import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';


//  importBatchData.js is faster, please use importBatchData
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =
const datasetDir = '/Users/sunzheng/Downloads/01datasets/PA_tot';

// ===== PostgreSQL  =====
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '123456',
    port: 5432,
});

// ===== 导入单个文件 =====
async function importFileToDB(filePath) {
    const basename = path.basename(filePath);               // e.g. data_123.txt
    const filenameWithoutExt = path.parse(basename).name.slice(0, -7);   // e.g. data_123

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(Boolean);   // 去除空行
    const dataLines = lines.slice(1);


    for (const line of dataLines) {
        const parts = line.split(','); // ← 可根据需要改成 '\t' 或 ' '

        if (parts.length < 2||parts[1].trim()=='') {
            console.warn(`⚠️ 跳过无效行: ${line}`);
            continue;
        }

        const col1 = parts[0].trim();
        const col2 = parts[1].trim();
        console.log(filenameWithoutExt,col1,col2)

        await client.query(
            'INSERT INTO pa_tot (pa_id, date_time, data) VALUES ($1, $2, $3)',
            [filenameWithoutExt, col1, col2]
        );

        console.log(`✔ 插入: [${filenameWithoutExt}] ${col1} - ${col2}`);
    }
}

// ===== 主函数 =====
async function main() {
    await client.connect();

    const txtFiles = fs.readdirSync(datasetDir).filter(file => file.endsWith('.txt'));

    for (const file of txtFiles) {
        const fullPath = path.join(datasetDir, file);
        await importFileToDB(fullPath);
    }

    await client.end();
    console.log('✅ 所有文件导入完成');
}

main().catch(console.error);