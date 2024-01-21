# uma_js
このスクリプトはWindows10のwsl(ubuntu)で実行されることを想定して作られています。 それ以外の環境では動作を確認していません。<br>
あるゲームのアセットのリネームや音声の抽出などができるスクリプトです。<br>
このプロジェクトをクローンした場所にファイルは出力されます。

# 使用する前に
これを実行する前にゲーム内でデータの一括ダウンロードは済ませておきましょう。 一度タイトル画面をタップして先に進まないとmetaファイルが更新されないのでそれもしておきましょう。

## 環境整備
WSL2を初めてインストールする方はこのリポジトリに含まれてる[環境構築スクリプト](https://github.com/incompetence33/uma_js/tree/main/%E7%92%B0%E5%A2%83%E6%A7%8B%E7%AF%89)を使うことで環境構築を楽に行うことができます。

```bash
sudo apt update
sudo apt install sqlite3 lame
```
Javascriptのランタイムも必要なのでインストールします。<br>
[Bun](https://github.com/oven-sh/bun)を使うといいと思います(NodeでもいいですがBunの方が速いし楽です)。
```bash
curl -fsSL https://bun.sh/install | bash
```
次に、このプロジェクトをクローンしたディレクトリで
```bash
bun install
```
とやれば必要なモジュールがインストールされます(私の環境ではここで一度Shellを再起動しないとBunのLD_LIBRARY_PATHがおかしいのか、うまくいかなかったので再起動しておきます)。<br>
音声ファイルを変換したい場合、vgmstream-cliも必要なので、[公式サイト](https://vgmstream.org/)か[github](https://github.com/vgmstream/vgmstream/releases/latest)からダウンロードしてPATHを通しておいてください。<br>

# 使用方法
```bash
bun uma.js
```
で実行すればOKです。<br>
処理のオプション等が出てくるので矢印キーやスペースキーなどで選択し、エンターキーで決定しましょう。

# 補足
もしインストールや使用時にわからないことがあれば、解決に至る質問が先にでている可能性がありますので [issues](https://github.com/incompetence33/uma_js/issues)を一度御覧ください。
それでも解決しない場合新しく質問を[new issues](https://github.com/incompetence33/uma_js/issues/new/choose)からお書き下さい。
