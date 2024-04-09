#!/bin/bash
trap "echo;echo 'CTRL+C が入力されたので終了します';exit 1" SIGINT
DISTRIBUTION="$(cat /etc/os-release | grep "^NAME=" |awk -F '=' '{gsub(/"/,"",$2);printf $2"\n"}')"
BASEPOINT="$(pwd -P)"
setup_ubuntu(){
	LANG="ja_JP.UTF-8"
	echo "これは簡易的な環境構築スクリプトです。"
	echo "Wslをインストールしてこれから環境を0から作らなければいけない方向けのスクリプトです。"
	echo "これを実行するとログインShellはZshになります。"
	echo "oh-my-zshやPreztoみたいなものは導入しません。"
	echo "それでも最低限使っていけるようにはなっていますが各々カスタマイズして使いやすいようにしてください。"
	echo "あ、vimもインストールするので拒否反応が出る方は後でアンインストールしておいてください。"
	echo "途中何回かパスワードを求められると思いますが、全てUbuntuをインストールしたときに決めたものを入力すればOKです。"
	read -e -p "よろしければなにかキーを押してください。"
	sudo apt update && \
	sudo apt install bc aria2 git jq curl lame nkf language-pack-ja rename sqlite3 tar unar unzip vim zsh -y
	mv ~/.zshrc ~/.zshrc_bak
	curl -Lo ~/.zshrc "https://raw.githubusercontent.com/incompetence33/uma_js/master/%E7%92%B0%E5%A2%83%E6%A7%8B%E7%AF%89/.zshrc"
	curl -Lo ~/.myfunctions "https://raw.githubusercontent.com/incompetence33/uma_js/master/%E7%92%B0%E5%A2%83%E6%A7%8B%E7%AF%89/.myfunctions"
	git clone https://github.com/zsh-users/zsh-completions.git ~/.zsh-completions
	git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.zsh-syntax-highlighting
	sudo update-locale LANG="ja_JP.UTF-8"
	git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf && \
	yes | ~/.fzf/install 
	curl -fsSL https://bun.sh/install | bash
	echo "このウィンドウを閉じてもう一度WSLを起動したときZshになっていればOKです。"
	rm -f ~/setup_ubuntu_zsh.sh
	mkdir -p ~/commands/bin
	curl -Lo ~/vgmstream-cli.tar.gz "$(curl -sL http://vgmstream.org/ | tr '"' '\n' | \grep 'vgmstream-linux-cli.tar.gz')"
	tar -xvf ~/vgmstream-cli.tar.gz -C ~/commands/bin
	rm -f ~/vgmstream-cli.tar.gz
 	echo "デフォルトのShellをBashからZshにします。"
	echo "パスワードを入力してください。"
	chsh -s /usr/bin/zsh
}

if [[ "${DISTRIBUTION}" == *buntu ]]; then cd ~;setup_ubuntu;else echo "WSLのUbuntu用のSetUpスクリプトなのでUbuntuで実行してください。";fi
