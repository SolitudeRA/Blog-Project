---
title: 'ホームサーバー完全構築ガイド #1 OS導入とインフラ設定'
series: ホームサーバー完全構築ガイド
tags:
  - Linux
  - server
  - Ubuntu
  - Docker
  - homeserver
local_updated_at: '2024-11-11T18:51:48+09:00'
---

# OSのインストール

ハードウェアを入手した後、プリインストールされたWindows OSをLinuxに置き換える必要があります。インストール手順は通常のコンピューターと同じです：OSが入ったUSBメモリを挿入し、BIOSでブートドライブを変更し、指示に従ってインストールを完了します。今回選択したLinuxディストリビューションは **Ubuntu 22.04 Jammy Jellyfish** です。

![Ubuntuインストール画面](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/3877434/b0f53437-ea0d-17ac-797e-29c81e619224.jpeg)

**注意**：インストール中にDockerのインストールを選択しないことをお勧めします。これは、古いバージョンがインストールされる可能性や、後の設定と競合する可能性があるためです。Dockerはインストール後、公式ドキュメントに従ってaptリポジトリまたは公式スクリプトを使用してインストールすることを推奨します。

OSのインストールが完了したら、インフラ設定を開始します。

> **OSバージョンについて**
> 以下の内容は、私が使用しているLinuxディストリビューション、つまり **Ubuntu 22.04 Jammy Jellyfish** に基づいています。

# 基本設定

### 1. APT自動更新の設定

UbuntuはデフォルトでAPTパッケージ管理ツールを使用しています。APTの自動更新機能を有効にすることで、システムが常に最新のセキュリティパッチとソフトウェア更新を受け取ることができます。しかし、サーバー環境では、自動更新が予期せぬ問題を引き起こす可能性があります。特にカーネルや重要なサービスの更新に関しては注意が必要です。安全な更新のみを自動的にインストールし、他の更新は定期的に手動でチェックすることをお勧めします。

#### 自動更新するパッケージの設定

`/etc/apt/apt.conf.d/50unattended-upgrades` ファイルを編集し、Unattended-Upgradeが自動更新するパッケージソースを制御します。

```plaintext
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
};
```

上記の設定はセキュリティ更新のみを自動的にインストールします：

- `${distro_id}:${distro_codename}-security`：Ubuntuのセキュリティ更新ソース
- `${distro_id}ESM:${distro_codename}-infra-security`：Ubuntu ESM（Extended Security Maintenance）からの追加のセキュリティメンテナンスサポートソース
- `${distro_id}ESMApps:${distro_codename}-apps-security`：Ubuntu ESMからのアプリケーションセキュリティ更新ソース

#### 自動更新の頻度設定

`/etc/apt/apt.conf.d/20auto-upgrades` ファイルを編集し、以下の内容が含まれていることを確認します。

```plaintext
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
```

各項目の意味：

- `APT::Periodic::Update-Package-Lists "1";`：毎日パッケージリストを更新
- `APT::Periodic::Unattended-Upgrade "1";`：毎日自動アップグレードを実行
- `APT::Periodic::AutocleanInterval "7";`：7日ごとにダウンロードしたパッケージを自動的にクリーンアップ

#### サービスの有効化

以下のコマンドを実行して、`unattended-upgrades` サービスが有効で実行中であることを確認します。

```bash
sudo systemctl enable unattended-upgrades
sudo systemctl start unattended-upgrades
```

#### ログの確認と通知の設定

自動更新の状況を確認するには、`/var/log/unattended-upgrades/` ディレクトリ内のログファイルを参照できます。更新状況をタイムリーに把握するために、メール通知を設定することをお勧めします。`/etc/apt/apt.conf.d/50unattended-upgrades` に以下を追加します。

```plaintext
Unattended-Upgrade::Mail "your-email@example.com";
```

### 2. SSHの設定

サーバーが自宅にある場合でも、SSHを使用してリモートでログインする方が便利です。セキュリティを強化するために、以下の設定を行うことをお勧めします。

#### 鍵の生成またはインポート

既にSSH鍵を持っている場合は、それをサーバーにコピーできます。新しい鍵を生成するには、以下のコマンドを使用します。

```bash
ssh-keygen -t rsa -b 4096
```

#### 公開鍵をサーバーに追加

以下のコマンドを使用して、公開鍵をサーバーの `~/.ssh/authorized_keys` ファイルに追加します。

```bash
ssh-copy-id -i ~/.ssh/id_rsa.pub user@server_ip
```

#### `sshd_config` の設定

`/etc/ssh/sshd_config` ファイルを編集し、以下の設定を確認または追加します。

```plaintext
Port 2222                   # デフォルトの22以外のポートに変更
PermitRootLogin no          # rootログインを禁止
PasswordAuthentication no   # パスワード認証を無効化
PubkeyAuthentication yes    # 公開鍵認証を有効化
AuthorizedKeysFile .ssh/authorized_keys .ssh/authorized_keys2
```

#### 鍵の権限設定

`~/.ssh` ディレクトリと `authorized_keys` ファイルの権限を正しく設定します。

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

#### SSHサービスの再起動

```bash
sudo systemctl restart sshd
```

**注意**：SSHの設定を変更してサービスを再起動する前に、物理コンソールなど他の方法でサーバーにアクセスできることを確認してください。万が一設定ミスでログインできなくなった場合に備えます。

#### 新しいSSH設定のテスト

新しいポートと設定を使用して、クライアントから接続を試みます。

```bash
ssh -p 2222 user@server_ip
```

### 3. UFWファイアウォールの設定

簡単なファイアウォールであるUFWを使用して、サーバーのセキュリティを向上させます。

#### UFWのインストール（必要な場合）

```bash
sudo apt update
sudo apt install ufw
```

#### デフォルトルールの設定

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

#### 必要なサービスを許可

必要に応じて、特定のポートやサービスを許可します。

```bash
sudo ufw allow 2222/tcp      # 新しいSSHポートを許可
sudo ufw allow http
sudo ufw allow https
```

#### SSHログイン速度の制限

ブルートフォース攻撃を防ぐために、SSHの接続速度を制限します。

```bash
sudo ufw limit 2222/tcp
```

#### UFWの有効化

```bash
sudo ufw enable
```

#### ルールの確認と管理

現在のルールを確認：

```bash
sudo ufw status verbose
```

ルールを削除：

```bash
sudo ufw delete allow 2222/tcp
```

### 4. Dockerのインストール

公式ドキュメントの手順に従って、Dockerをインストールすることをお勧めします。

- [UbuntuにDocker Engineをインストールする](https://docs.docker.com/engine/install/ubuntu/)

#### インストール手順の概要

1. **古いバージョンの削除**

```bash
sudo apt remove docker docker-engine docker.io containerd runc
```

2. **リポジトリの設定**

```bash
sudo apt update
sudo apt install ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) \
  signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

3. **Docker Engineのインストール**

```bash
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

4. **現在のユーザーをdockerグループに追加**

```bash
sudo usermod -aG docker $USER
```

**注意**：グループ変更を有効にするために、再ログインが必要です。

### 5. MySQLのインストール

#### MySQLのインストール

```bash
sudo apt update
sudo apt install mysql-server
```

#### セキュリティ設定

```bash
sudo mysql_secure_installation
```

- rootパスワードの設定
- 匿名ユーザーの削除
- rootのリモートログインを禁止
- テストデータベースの削除
- 権限テーブルの再読み込み

#### 新しいユーザーの作成

MySQLにログインして、新しいユーザーを作成し、必要な権限を付与します。

```bash
sudo mysql
```

```sql
CREATE USER 'username'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'username'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EXIT;
```

#### リモートアクセスの設定（必要な場合）

`/etc/mysql/mysql.conf.d/mysqld.cnf` を編集し、`bind-address` を変更します。

```plaintext
bind-address = 0.0.0.0
```

**警告**：リモートアクセスを有効にするとセキュリティリスクが増加します。ファイアウォールでMySQLのポート（デフォルトは3306）へのアクセスを制限するか、SSHトンネルを使用して接続することをお勧めします。

### 6. Redisのインストール

#### Redisのインストール

```bash
sudo apt update
sudo apt install redis-server
```

#### セキュリティ設定

`/etc/redis/redis.conf` を編集し、以下の変更を行います。

- デフォルトの `bind 127.0.0.1 ::1` を維持し、ローカルインターフェイスのみをリッスン
- アクセスパスワードを設定：

```plaintext
requirepass your_redis_password
```

#### サービスの有効化と確認

```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
sudo systemctl status redis-server
```

#### Redisのテスト

```bash
redis-cli
```

```plaintext
AUTH your_redis_password
PING
```

`PONG` と返されれば成功です。

### 7. ddclientを使用したDDNSの設定

#### ddclientのインストール

```bash
sudo apt update
sudo apt install ddclient
```

#### ddclientの設定

`/etc/ddclient.conf` を編集します。設定例：

```plaintext
daemon=300
syslog=yes
pid=/var/run/ddclient.pid
ssl=yes
use=web, web=dynamicdns.park-your-domain.com/getip

protocol=cloudflare
zone=yourdomain.com
login=your_email@example.com
password=your_api_token
subdomain.yourdomain.com
```

#### Cloudflare APIトークンの使用

CloudflareダッシュボードでDNS編集権限を持つAPIトークンを作成し、それを `password` として使用します。

#### 設定ファイルの権限設定

```bash
sudo chmod 600 /etc/ddclient.conf
```

#### ddclientサービスの有効化と起動

```bash
sudo systemctl enable ddclient
sudo systemctl start ddclient
```

#### ddclientの状態確認

```bash
sudo systemctl status ddclient
```

### 8. バックアップと復元の戦略

データの安全性を確保するために、重要なデータや設定ファイルを定期的にバックアップすることをお勧めします。`rsync` や `tar` などのツールを使用してローカルバックアップを行うか、リモートストレージにアップロードします。

#### rsyncを使用したバックアップ例

```bash
rsync -av --delete /source/directory/ /backup/directory/
```

### 9. システム監視とログ管理

`htop` や `netdata` などの監視ツールをインストールして、システムリソースをリアルタイムで監視します。ログローテーション（`logrotate`）とログ分析ツールを設定して、システムの異常を早期に発見します。

#### htopのインストール

```bash
sudo apt update
sudo apt install htop
```

### 10. セキュリティ強化

- **Fail2Banのインストールと設定**：ブルートフォース攻撃を防ぎます。

```bash
sudo apt update
sudo apt install fail2ban
```

- **Fail2Banの設定ファイルを編集**

`/etc/fail2ban/jail.local` を作成または編集し、SSHの保護を有効にします。

```plaintext
[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
```

- **システムとソフトウェアの定期的な更新**：最新のセキュリティパッチを適用します。

- **不要なポートの閉鎖**：必要最小限のポートのみを開放し、攻撃の表面積を最小化します。

- **侵入検知システムの導入**：`Snort` や `OSSEC` などを検討します。



# まとめ

これで、自宅サーバーの基本設定が完了しました。適切な設定とセキュリティ強化により、サーバーを安定して安全に運用できます。次回の記事では、各種サービスのデプロイと最適化について詳しく説明します。

# 参考資料

- [Ubuntu公式ドキュメント](https://help.ubuntu.com/)
- [Docker公式ドキュメント](https://docs.docker.com/)
- [MySQL公式ドキュメント](https://dev.mysql.com/doc/)
- [Redis公式ドキュメント](https://redis.io/documentation)
- [Cloudflare APIドキュメント](https://api.cloudflare.com/)
