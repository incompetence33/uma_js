これはUbuntuの環境構築用スクリプトです。  
WSLインストールしたけどどうしたらいいのかわからない方や環境作るのめんどくさい人向けです。  
簡易的なものになっているのでOh-my-zshやPreztoなどはインストールしません。  
下の行を貼り付けて実行すればOKです。  
パスワードが途中と最後で2回求められます。入力しても画面上にはなにも変化がありませんがきちんと入力できているので入力が終わったらエンターを押してあげてください。  
```sh
curl -Lo ~/setup_ubuntu_zsh.sh 'https://raw.githubusercontent.com/incompetence33/uma_js/master/%E7%92%B0%E5%A2%83%E6%A7%8B%E7%AF%89/setup_ubuntu_zsh.sh' && ~/setup_ubuntu_zsh.sh
```
