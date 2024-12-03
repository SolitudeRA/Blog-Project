const fs = require('fs-extra');
const matter = require('gray-matter');

// タイムゾーンオフセット付きのISO文字列にフォーマットする関数
const formatWithTimezone = (date) => {
    const tzOffset = -date.getTimezoneOffset();
    const offsetHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
    const offsetMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0');
    const sign = tzOffset >= 0 ? '+' : '-';
    const isoString = date.toISOString().split('.')[0]; // ミリ秒部分を削除
    return `${isoString}${sign}${offsetHours}:${offsetMinutes}`;
};

const updateMetadata = (directory) => {
    fs.readdirSync(directory).forEach((file) => {
        if (file.endsWith('.md')) {
            const filePath = `${directory}/${file}`;
            const content = fs.readFileSync(filePath, 'utf8');
            const parsed = matter(content);

            // ファイルの最終更新日時を取得してフォーマット
            const updatedAt = formatWithTimezone(new Date(fs.statSync(filePath).mtime));

            // `local_updated_at` が変更されていない場合はスキップ
            if (parsed.data.local_updated_at === updatedAt) {
                console.log(`変更がないためスキップしました: ${file}`);
                return;
            }

            // `local_updated_at` を更新
            parsed.data.local_updated_at = updatedAt;

            // ファイルを書き込み
            const newContent = matter.stringify(parsed.content, parsed.data);
            fs.writeFileSync(filePath, newContent);
            console.log(`メタデータを更新しました: ${file}`);
        }
    });
};

// 更新対象のディレクトリを指定
const targetDir = process.argv[2]; // コマンドライン引数からディレクトリを取得
if (!targetDir) {
    console.error("エラー: ディレクトリが指定されていません。使用法: node update-metadata.js <directory>");
    process.exit(1);
}

updateMetadata(targetDir);