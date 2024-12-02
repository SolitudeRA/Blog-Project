const fs = require('fs-extra');
const matter = require('gray-matter');

// 格式化时间为带时区偏移的 ISO 字符串
const formatWithTimezone = (date) => {
    const tzOffset = -date.getTimezoneOffset();
    const offsetHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
    const offsetMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0');
    const sign = tzOffset >= 0 ? '+' : '-';
    const isoString = date.toISOString().split('.')[0]; // 去掉毫秒部分
    return `${isoString}${sign}${offsetHours}:${offsetMinutes}`;
};

const updateMetadata = (directory) => {
    fs.readdirSync(directory).forEach((file) => {
        if (file.endsWith('.md')) {
            const filePath = `${directory}/${file}`;
            const content = fs.readFileSync(filePath, 'utf8');
            const parsed = matter(content);

            // 获取文件最后修改时间并格式化
            const updatedAt = formatWithTimezone(new Date(fs.statSync(filePath).mtime));

            // 如果 `local_updated_at` 没有变化，则跳过
            if (parsed.data.local_updated_at === updatedAt) {
                console.log(`Skipping unchanged file: ${file}`);
                return;
            }

            // 更新 `local_updated_at`
            parsed.data.local_updated_at = updatedAt;

            // 写回文件
            const newContent = matter.stringify(parsed.content, parsed.data);
            fs.writeFileSync(filePath, newContent);
            console.log(`Updated metadata for: ${file}`);
        }
    });
};

// 指定需要更新的目录
const targetDir = process.argv[2]; // 从命令行参数中获取目标目录
if (!targetDir) {
    console.error("Error: No directory specified. Usage: node update-metadata.js <directory>");
    process.exit(1);
}

updateMetadata(targetDir);