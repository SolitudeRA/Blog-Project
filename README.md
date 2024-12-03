# Qiita/Zenn同時対応ブログリポジトリ

ZennとQiitaへの記事管理や同時公開に対応した多端対応ブログリポジトリです。  
記事の自動更新、シリーズリンク生成、公開プロセスの効率化を実現します。

---

## 特徴

- **複数プラットフォーム対応**  
  ZennとQiitaへの同時公開をサポート。
  
- **シリーズリンクの自動生成**  
  `articles/share` `articles/zenn` `articles/qiita`ディレクトリの内容に基づき、シリーズリンクを自動的に生成し、記事に挿入します。

- **効率的な記事管理**  
  GitHub Actionsを活用して、記事の自動更新とコミットを実現。

- **簡単な設定**  
  必要な設定を整えるだけで、すぐに記事の管理と公開を開始できます。

---

## ディレクトリ構成

```
.
├── articles/        # 記事が格納されるディレクトリ
│   ├── qiita/       # Qiita専用の記事
│   ├── share/       # ZennとQiitaの両方で共有される記事
│   └── zenn/        # Zenn専用の記事
├── scripts/         # 自動化スクリプト
│   └── update_metadata.js # メタデータの更新スクリプト
├── .github/         # GitHub Actions設定
│   └── workflows/
│       └── distribute.yml # 公開処理を自動化するワークフロー
├── LICENSE          # ライセンスファイル
└── README.md        # このファイル
```
---

## 必要なセットアップ

### 1. **リポジトリのクローン**

以下のコマンドでリポジトリをクローンします。

```bash
git clone https://github.com/SolitudeRA/Blog-Project.git
cd Blog-Project
```

### 2. **依存パッケージのインストール**

Node.jsがインストールされていることを確認し、以下のコマンドを実行してください。

```bash
npm install
```

### 3. **GitHub Actionsを利用するためのSecretsの設定**

GitHub Actionsを使用してリポジトリを自動更新するには、**Personal Access Token (PAT)** を設定する必要があります。

#### 1. **Personal Access Tokenの生成**

1. GitHubの[Personal Access Token設定ページ](https://github.com/settings/tokens)にアクセス。
2. **"Generate new token"** をクリック。
3. 必要なスコープを選択：
   - **`repo`**: プライベートリポジトリへのアクセスを許可（プライベートリポジトリの場合）。
4. トークンをコピーして保存します（トークンは一度しか表示されません）。

#### 2. **Secretsへの登録**

1. リポジトリの **Settings** > **Secrets and variables** > **Actions** に移動します。
2. **"New repository secret"** をクリック。
3. 以下の情報を入力：
   - **Name**: `BLOG_PROJECT_TOKEN`  
   - **Secret**: 生成したトークンの値を貼り付け。
4. **保存**をクリック。

### **重要な注意点**

- **トークンの権限**：  
  トークンのスコープは必要最低限にすることを推奨します。一般的には `repo` スコープのみで十分です。

- **トークンの安全管理**：  
  トークンは第三者に漏れないよう、必ずGitHub Secretsに保存してください。

### 4. **articlesに記事を追加**

公開先に応じで`articles/share` `articles/zenn` `articles/qiita`ディレクトリにMarkdownファイルを作成し、適切なメタデータを追加します。例：

```markdown
---
title: "ホームサーバー完全構築ガイド #1 OS導入とインフラ設定"
series: "ホームサーバー完全構築ガイド"
topics:
  - "linux"
  - "selfhosting"
---
記事本文をここに書きます。
```
## 使用方法

### 記事を分散する手順

1. **記事の追加または更新**  
   - `articles/share` ディレクトリに、Zenn と Qiita の両方で共有する記事を追加します。
   - `articles/zenn` ディレクトリには Zenn 専用の記事を追加します。
   - `articles/qiita` ディレクトリには Qiita 専用の記事を追加します。

2. **`main` ブランチへのプッシュ**  
   変更を `main` ブランチにプッシュします。以下のようなコマンドを使用します：

   ```bash
   git add .
   git commit -m "Update articles"
   git push origin main
   ```

3. **GitHub Actionsによる自動処理**  
   プッシュがトリガーされると、GitHub Actions が以下の処理を自動で行います：

   1. **`local_updated_at` の自動更新**  
      - 各記事ファイルの最終更新日時（`local_updated_at`）が検出され、自動的に更新されます。

   2. **Qiitaリポジトリへの分散**  
      - `articles/share` と `articles/qiita` 内の記事が Qiita の子リポジトリ（例: `qiita-repo/pre-publish`）にコピーされ、コミット・プッシュされます。

   3. **Zennリポジトリへの分散**  
      - `articles/share` と `articles/zenn` 内の記事が Zenn の子リポジトリ（例: `zenn-repo/pre-publish`）にコピーされ、コミット・プッシュされます。

---

### 注意事項: 実際のリポジトリリンクの設定

GitHub Actions を使用する前に、`distribute.yml` ワークフローで指定されている Qiita と Zenn リポジトリのリンクを、あなたのリポジトリに変更してください。

#### 対応箇所:
以下の箇所でリポジトリ名を変更します：

```yaml
# Qiitaリポジトリ
with:
  repository: solitudeRA/qiita-repo  # ここを変更
  ref: main
  token: ${{ secrets.BLOG_PROJECT_TOKEN }}

# Zennリポジトリ
with:
  repository: SolitudeRA/zenn-repo  # ここを変更
  ref: main
  token: ${{ secrets.BLOG_PROJECT_TOKEN }}
```

#### 実例:
- Qiita リポジトリ: `your-username/your-qiita-repo`
- Zenn リポジトリ: `your-username/your-zenn-repo`

---

### 自動化の例: GitHub Actions

以下は、自動化された処理の概要です：

#### 1. 記事のメタデータを更新

- **スクリプト**: `update_metadata.js`
- **処理内容**:
  - 各記事の `local_updated_at` フィールドをファイルの最終更新日時で更新。

#### 2. Qiitaリポジトリへの分散

- **処理**:
  - `articles/share` と `articles/qiita` の記事を Qiita の子リポジトリ（例: `qiita-repo/pre-publish`）にコピー。
  - コピー後、変更内容をコミットしてプッシュ。

#### 3. Zennリポジトリへの分散

- **処理**:
  - `articles/share` と `articles/zenn` の記事を Zenn の子リポジトリ（例: `zenn-repo/pre-publish`）にコピー。
  - コピー後、変更内容をコミットしてプッシュ。

## 開発者向け情報

### スクリプト一覧

- **`update_metadata.js`**  
  `articles`ディレクトリ内のMarkdownファイルをスキャンし、ファイルの最終更新日時（`local_updated_at`）をメタデータに反映します。

### デバッグ

以下のコマンドでローカル環境でスクリプトを実行できます：

```bash
# メタデータを更新
node scripts/update_metadata.js <directory>
```

`<directory>` には更新対象のディレクトリ（例: `articles/zenn` や `articles/qiita`）を指定してください。

--- 

## ライセンス

本リポジトリは [MITライセンス](LICENSE) のもとで公開されています。