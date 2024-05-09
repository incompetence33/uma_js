const axios = require('axios');
const User_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0";
const fs = require("fs");

let thisFileDir = __dirname;
let outputDir = `${thisFileDir}/output/web`
fs.mkdirSync(outputDir, {recursive: true});
async function main(){
	let charactersData;
	try{
		charactersData = await getCharactorApiData();
	}catch{
		console.error("Error getting character Data from API");
		return;
	}
	for(const data of charactersData){
		const name = data.name;
		const visuals = data.visual;
		for(const visual of visuals){
			let title = visual.name?.title;
			if(title === undefined)title = '';
			const url = visual.image.url;
			const match = url.match(/(?:\.([^.?#]+))(?=[?#]|$)/);
			const extension = match ? match[1] : undefined;
			if(title.match(/STARTING.*FUTURE/))title = "STARTING_FUTURE";
			const targetFile = `${outputDir}/${name}${title != '' ? "_" : ""}${title}.${extension}`;
			if(fs.existsSync(targetFile)){
				console.log(`exist: ${name}${title != '' ? "_" : ""}${title}.${extension}`);
				continue;
			}else{
				console.log(`Downloading: ${name}${title != '' ? "_" : ""}${title}.${extension}`)
			}
			try{
				const image = await request(new requestObject_binary_data(url));
				if(image){
					fs.writeFileSync(targetFile, image);
				}else{
					console.error(`DownloadFailed: ${title}`);
				}
			}catch(error){
				console.error(`Error downloading ${title}: ${error}`);
			}
		}
	}
}

async function request(requestOptions, maxRetries = 3, timeout = 60000){
	for(let attempt = 0; attempt <= maxRetries; attempt++){
		try{
			const response = await axios({
				method: requestOptions.method,
				url: requestOptions.url,
				headers: requestOptions.headers,
				responseType: requestOptions.responseType,
				data: requestOptions.data,
				timeout: timeout
			});
			return response.data;
		}catch(error){
			console.error({function: "request", uri: requestOptions.url, statusCode: error?.response?.status, message: error.message});
			if(attempt === maxRetries){
				throw error;
			}
			const delay = Math.pow(2, attempt) * 1000;
			console.log(`Retrying in ${delay / 1000} seconds...`);
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}
}

async function getCharactorApiData(){
	let data = [];
	let totalCount,response;
	response = await request(new requestObject_characterAPI(`https://6azuq3sitt-aw4monxblm4y4x0oos66.microcms.io/api/v1/character?limit=100&offset=0`));
	data = response.contents;
	totalCount = response.totalCount;
	for(let i=1;i<=(totalCount/100);i++){
		response = await request(new requestObject_characterAPI(`https://6azuq3sitt-aw4monxblm4y4x0oos66.microcms.io/api/v1/character?limit=100&offset=${i*100}`));
		data = data.concat(response.contents);
	}
	console.log(`${totalCount} characters`)
	return data;
}

class requestObject{
	constructor(URL,addtional_cookie = undefined){
		this.method = 'GET';
		this.url = `${URL}`;
		this.headers = {
			"Content-Type": "text/html,application/xhtml+xml,application/xml",
			'User-agent': User_agent,
			'accept': '*/*',
			'Referer': URL,
			"Sec-Fetch-Mode": "navigate",
			"Sec-Fetch-Site": "cross-site",
			'cookie': `${addtional_cookie}`
		};
		this.package = null;
	}
}

class requestObject_binary_data{
	constructor(URL,addtional_cookie = undefined){
		this.method = 'GET';
		this.url = `${URL}`;
		this.body = null;
		this.responseType = 'arraybuffer';
		this.headers = {
			"Content-Type": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*",
			'User-agent': User_agent,
			'accept': '*/*',
			'Referer': URL,
			"Sec-Fetch-Mode": "navigate",
			'cookie': `${addtional_cookie}`
		};
		this.package = null;
	}
}

class requestObject_characterAPI{
	constructor(URL){
		this.method = 'GET';
		this.url = `${URL}`;
		this.headers = {
			"Content-Type": "text/html,application/xhtml+xml,application/xml",
			'User-agent': User_agent,
			'accept': '*/*',
			'Referer': URL,
			"Sec-Fetch-Mode": "navigate",
			"Sec-Fetch-Site": "cross-site",
			'x-microcms-api-key': "xCZfLPNnbazeFHih87prlh1pomFsB1LFq6qZ"
		};
		this.package = null;
	}
}
main();