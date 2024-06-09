const fs = require("fs");
const path = require('path');
const sqlite = require("bun:sqlite");
const util = require('util');
const childProcess = require('child_process');
const exec = util.promisify(childProcess.exec);
const async = require('async');
const cliProgress = require('cli-progress');
const prompts = require('prompts');
const os = require('os');

let umamusumeDir, tmpDir;
let thisFileDir = __dirname;
let outputDir = `${thisFileDir}/output`;

async function main(){
	const cwd = process.cwd();
	const umamusumeDirPattern = /\/mnt\/.*AppData\/LocalLow\/Cygames\/umamusume/;
	if(process.platform === "linux"){
		const com = '/mnt/c/Windows/System32/cmd.exe /C "echo %USERNAME%"';
		const windowsUserName = (await exec(com)).stdout.replace(/\r\n$/, '');
		if(!windowsUserName)throw("wsl2でwindowsの実行ファイルを実行できない設定にしていませんか？");
		umamusumeDir = `/mnt/c/Users/${windowsUserName}/AppData/LocalLow/Cygames/umamusume`;
		tmpDir = '/tmp/uma_js'
	}else if(process.platform === 'win32'){
		const windowsUserName = process.env.USERNAME;
		umamusumeDir = path.join('C:', 'Users', windowsUserName, 'AppData', 'LocalLow', 'umamusume');;
		tmpDir = path.join(thisFileDir,'tmp')
	}else{
		throw(`想定されていない環境で実行されているようです。`);
	}
	if(!fs.existsSync(`${umamusumeDir}/meta`)){
		throw(`umamusumeがインストールされていないようです。\n一度もウマ娘を起動していない場合もこのエラーが出ます。\n「meta」ファイルが「${umamusumeDir}」にあることを確認してください。`);
	}
	fs.rmSync(tmpDir, { recursive: true, force: true });
	fs.mkdirSync(tmpDir, {recursive: true});
	const metaDB = await getDataFromSQDB(new sqlite.Database(`${umamusumeDir}/meta`),"a",true);
	const masterDBSqlite = new sqlite.Database(`${umamusumeDir}/master/master.mdb`);
	let manifests = [];
	const assetCategories = metaDB.reduce((acc,o) => {
		if(/manifest.*/.test(o.m)){
			if(!(/\/\/(all|root|Windows)/.test(o.n)))acc.push(o.n.replace('//',''));
			manifests.push({n: `manifest/${o.n.replace('//','')}`, h: o.h, m: "manifest"});
		}
		return acc;
	},["manifest"]);
	const options = await decideOptions(assetCategories);
	startTime = new Date();
	makeIdTable(masterDBSqlite);
	if(options.categories.includes('sound'))await processSoundFile(metaDB, options.sounds, options.parallelNum);
	if(options.categories.includes('asset'))await processAssetts(metaDB, options.assets, options.parallelNum, manifests);
	return "done";
}
async function makeIdTable(db){
	const DBData = await getDataFromSQDB(db, "text_data");
	outputFile(16, "ライブID.txt");
	outputFile(6, "キャラID.txt");
	db.close();
	async function outputFile(id, outputName){
		const data = DBData.reduce((acc,o) => {
			if(o.id === id){
				acc.push(`${o.index} ${o.text}`);
			}
			return acc;
		},[]);
		fs.writeFileSync(`${outputDir}/${outputName}`, data.join('\n'));
	}
}
async function getDataFromSQDB(db, table, close = false){
	try{
		const rows = db.query(`SELECT * FROM ${table}`).all();
		if(close)db.close();
		return rows;
	}catch(err){
		if(close)db.close();
		throw err;
	}
}
async function processParallel(taskFunction, taskArray, taskParallelNum = 10){
	return new Promise((resolve) => {
		const taskQueue = async.queue((task, done) => {
			taskFunction(task).then(() => {
				done();
			}).catch(err => {
				done(err);
			});
		}, taskParallelNum);
		taskQueue.push(taskArray);
		taskQueue.drain(() => {
			resolve();
		});
	});
}
async function processAssetts(db, option, parallelNum, manifests){
	if(!(option.targets))throw("オプションが正しく設定されていないようです。");
	let toDoList = [];
	toDoList = db.filter(o=>option.targets.includes(o.m)&&(!/manifest.*/.test(o.m)));
	if(option.targets.includes('manifest'))toDoList = toDoList.concat(manifests);
	let existFileList = {};
	[...new Set(toDoList.map(o=>path.dirname(o.n)))].forEach(dirPath => {
		const targetDirPath = `${outputDir}/${dirPath}`;
		fs.mkdirSync(targetDirPath, {recursive: true});
		const files = fs.readdirSync(targetDirPath);
		files.forEach(file => {
			const filePath = path.join(targetDirPath, file);
			if(fs.statSync(filePath).isFile())existFileList[filePath] = "1";
		});
	});
	const progressBar = new cliProgress.SingleBar({
		format: '進捗 [{bar}] {percentage}% | {value}/{total} | スキップ: {skipped} | 存在なし: {notExists}',
		barCompleteChar: '\u2588',
		barIncompleteChar: '\u2591',
		hideCursor: false
	});
	progressBar.start(toDoList.length, 0, {
		skipped: 0,
		notExists: 0
	});
	await processParallel(placeFile, toDoList, parallelNum);
	progressBar.update(toDoList.length, {
		skipped: progressBar.payload.skipped,
		notExists: progressBar.payload.notExists
	});
	progressBar.stop();
	return "done";
	async function placeFile(task){
		try{
			return new Promise((resolve) => {
				const assetFilePath = `${umamusumeDir}/dat/${task.h.slice(0,2)}/${task.h}`;
				const outputFilePath = `${outputDir}/${task.n}`;
				if(!fs.statSync(assetFilePath).isFile()){
					progressBar.increment({notExists: progressBar.payload.notExists + 1});
					return resolve("OK");
				}else if(existFileList[outputFilePath]){
					progressBar.increment({skipped: progressBar.payload.skipped + 1});
					return resolve("OK");
				}
				fs.copyFileSync(assetFilePath, outputFilePath);
				progressBar.increment();
				return resolve("OK");
			});
		}catch(error){
			throw(error);
		}
	}
}
async function processSoundFile(db, option, parallelNum){
	if(!(option.targets && option.format))throw("オプションが正しく設定されていないようです。");
	let toDoList = [];
	const escapedToDo = option.targets.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
	const regexPattern = new RegExp(`sound/(${escapedToDo.join('|')})/.*\\.awb`);
	toDoList = db.filter(o=>o.m === "sound" && regexPattern.test(o.n));
	let existFileList = [];
	[...new Set(toDoList.map(o=>path.dirname(o.n)))].forEach(dirPath => {
		const targetDirPath = `${outputDir}/${dirPath.replace(/^sound/,'sound_wav')}`;
		fs.mkdirSync(targetDirPath, {recursive: true});
		const files = fs.readdirSync(targetDirPath);
		files.forEach(file => {
			const filePath = path.join(targetDirPath, file);
			if(fs.statSync(filePath).isFile())existFileList.push(filePath);
		});
	});
	const progressBar = new cliProgress.SingleBar({
		format: '進捗 [{bar}] {percentage}% | {value}/{total} | スキップ: {skipped} | 存在なし: {notExists}',
		barCompleteChar: '\u2588',
		barIncompleteChar: '\u2591',
		hideCursor: false
	});
	progressBar.start(toDoList.length, 0, {
		skipped: 0,
		notExists: 0
	});
	await processParallel(convertAwbToWav, toDoList, parallelNum);
	progressBar.update(toDoList.length, {
		skipped: progressBar.payload.skipped,
		notExists: progressBar.payload.notExists
	});
	progressBar.stop();
	return "done";
	async function convertAwbToWav(task){
		try{
			return new Promise((resolve) => {
				const awbFilePath = `${umamusumeDir}/dat/${task.h.slice(0,2)}/${task.h}`;
				const outputFilePathTemplate = `${outputDir}/${task.n.replace(/^sound/,'sound_wav').replace(/\.awb$/,'_')}`;
				fs.open(awbFilePath, 'r', (err, fd) => {
					if(err){
						console.log(`\n存在なし: ${awbFilePath}\n ┗━${task.n}`);
						progressBar.increment({notExists: progressBar.payload.notExists + 1});
						return resolve("OK");
					}
					const buffer = Buffer.alloc(2);
					fs.read(fd, buffer, 0, 2, 8, async (err, bytesRead, buffer) => {
						const trackCount = parseInt(`${buffer[1].toString(16)}${buffer[0].toString(16)}`, 16);
						const regex = new RegExp(`${outputFilePathTemplate}[0-9]{4}`);
						if(existFileList.filter(item => regex.test(item)).length < trackCount){
							const tempFilePath = `${tmpDir}/${path.basename(task.n)}`;
							fs.symlinkSync(awbFilePath, tempFilePath);
							if(option.format == "mp3"){
								for(let i=0;i<trackCount;i++){
									await exec(`vgmstream-cli -s ${i+1} ${tempFilePath} -p | lame -V0 -b0 -B320 - ${outputFilePathTemplate}${i.toString().padStart(4, '0')}.mp3`);
								}
							}else{
								await exec(`vgmstream-cli -S 0 ${tempFilePath} -o "${outputFilePathTemplate}?04s.wav"`);
							}
							fs.unlinkSync(tempFilePath);
							progressBar.increment();
						}else{
							progressBar.increment({skipped: progressBar.payload.skipped + 1});
						}
						fs.close(fd, ()=>{});
						return resolve("OK");
					});
				});
			});
		}catch(error){
			throw(error);
		}
	}
}

async function decideOptions(assetCategories){
	let answers = {
		sounds: {},
		assets: {},
	};
	const cpuNum = os.cpus().length;
	answers.categories = (await prompts({
		type: 'multiselect',
		name: 'categories',
		message: '処理する音声の種類を選択してください(複数選択可)',
		choices: [
			{title: '音声', value: 'sound'},
			{title: 'アセットのリネーム', value: 'asset'},
		],
		instructions: true
	})).categories;
	answers.parallelNum = (await prompts({
		type: 'number',
		name: 'parallelNum',
		message: `並列処理数(最大${cpuNum})`,
		initial: cpuNum,
		validate: value => value >= 1 && value <= cpuNum ? true : `数値は1から${cpuNum}の間である必要があります。`
	})).parallelNum;
	if(answers.categories.includes('sound')){
		answers.sounds.targets = (await prompts({
			type: 'multiselect',
			name: 'targets',
			message: '処理する音声の種類を選択してください(複数選択可)',
			choices: [
				{title: 'b: bgm', value: 'b'},
				{title: 'c: ストーリーのキャラボイス', value: 'c'},
				{title: 'j: 実況', value: 'j'},
				{title: 'l: ライブ', value: 'l'},
				{title: 's: 効果音など', value: 's'},
				{title: 'v: 単発のキャラボイス', value: 'v'},
			],
			instructions: true
		})).targets;
		answers.sounds.format = (await prompts({
			type: 'select',
			name: 'format',
			message: '出力する音声ファイルの形式',
			choices: [
				{title: 'wav', value: 'wav'},
				{title: 'mp3', value: 'mp3'},
			],
			instructions: true
		})).format;
	}
	if(answers.categories.includes('asset')){
		answers.assets.targets = (await prompts({
			type: 'multiselect',
			name: 'targets',
			message: '処理するアセットの種類を選択してください(複数選択可)',
			choices: assetCategories.map(e=>{
				return {title: e, value: e};
			}),
			instructions: true
		})).targets;
	}
	return answers;
}
let startTime;
(async () => {
	try{
		await main();
	}catch(error){
		console.error(error);
		console.error("うまくいかない場合「https://github.com/incompetence33/uma_js/issues?q=」に同症例の前例がないか確認してみてください");
		console.error("また、どうしても解決しない場合「https://github.com/incompetence33/uma_js/issues/new/choose」から新しくissueをお書きください");
	}finally{
		const endTime = new Date();
		const executionTimeMs = endTime - startTime;
		const seconds = Math.floor(executionTimeMs / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const secondsRemainder = seconds % 60;
		const minutesRemainder = minutes % 60;
		console.log("\n\n");
		if(startTime)console.log(`\n実行時間: ${hours > 0 ? String(hours).padStart(2, '0') + '時間 ' : ''}${minutes > 0 ? String(minutesRemainder).padStart(2, '0') + '分 ' : ''}${String(secondsRemainder).padStart(2, '0')}秒 (${executionTimeMs}ms)`);
	}
})();
