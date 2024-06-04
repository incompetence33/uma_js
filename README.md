# uma_js
このスクリプトはWindows10のwsl(ubuntu)で実行されることを想定して作られています。 それ以外の環境では動作を確認していません。  
あるゲームのアセットのリネームや音声の抽出などができるスクリプトです。  
このプロジェクトをクローンした場所にファイルは出力されます。

# 使用する前に
これを実行する前にゲーム内でデータの一括ダウンロードは済ませておきましょう。  
一度タイトル画面をタップして先に進まないとmetaファイルが更新されないのでそれもしておきましょう。

# 使い方

## ①環境整備
初めてUbuntuを使うならば私の作った環境構築スクリプトを使うことで簡単に環境を構築できます。  
具体的にはzshのインストール、zshの設定のインストール、vgmstream-cliのインストールなどを行います。  
パスワードが途中と最後で2回求められます。入力しても画面上にはなにも変化がありませんがきちんと入力できているので入力が終わったらエンターを押してあげてください。
```sh
curl -Lo ~/setup_ubuntu_zsh.sh 'https://raw.githubusercontent.com/incompetence33/uma_js/master/%E7%92%B0%E5%A2%83%E6%A7%8B%E7%AF%89/setup_ubuntu_zsh.sh' && chmod 777 ~/setup_ubuntu_zsh.sh  && ~/setup_ubuntu_zsh.sh
```
<br>

シェルの環境は既にあるという場合は vgmstream-cli, lame, sqlite3, gitがインストールされていることを確認してください。  
<br>
次にJavascriptのランタイム [Bun](https://github.com/oven-sh/bun) をインストールします。これは環境構築スクリプトを使った人もやってください。

```sh
curl -fsSL https://bun.sh/install | bash
```

## ②uma.jsを使えるようにする
任意のディレクトリで以下のようにコマンドを実行し、本プロジェクトをダウンロードしてから必要なJavascriptのモジュールをインストールします。  
処理されたファイルはuma_jsのoutputディレクトリに出力されますのでアクセスしやすい場所がいいかもしれません。
```sh
git clone --depth 1 https://github.com/incompetence33/uma_js
cd uma_js
bun install
```

## ③uma.jsを実行する
```
bun uma.js
または
bun run uma.js
```
以上のようにやることで実行できます。  
処理のオプション等が出てくるので矢印キーやスペースキーなどで選択し、エンターキーで決定しましょう。

# 補足
もしインストールや使用時にわからないことがあれば、解決に至る質問が先にでている可能性がありますので [issues](https://github.com/incompetence33/uma_js/issues?q=)を一度御覧ください。  
それでも解決しない場合新しく質問を[new issues](https://github.com/incompetence33/uma_js/issues/new/choose)からお書き下さい。  
おまけとしてuma_pic.jsというものがあり、それを使うと公式サイト上の立ち絵をダウンロードすることができます。
