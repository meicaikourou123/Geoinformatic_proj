import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const BATCH_SIZE = 1000;

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '123456',
    port: 5432,
});


const datasetDir = '/Users/sunzheng/Downloads/01datasets/PP_tot_10min';
async function insertBatch(rows) {
    if (rows.length === 0) return;

    const valuesClause = rows
        .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
        .join(', ');

    const flatValues = rows.flat();

    await client.query(
        `INSERT INTO pp_tot_10 (pp_id, date_time, data) VALUES ${valuesClause}`,
        flatValues
    );
}

async function importFileToDB(filePath) {
    const basename = path.basename(filePath);
    const filenameWithoutExt = path.parse(basename).name;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    const dataLines = lines.slice(1); // skip header

    let batch = [];
    let skipped = 0;

    for (const line of dataLines) {
        const parts = line.split(','); // change to '\t' or ' ' if needed

        // 检查字段个数 和 非空要求
        if (parts.length < 2 || parts[1].trim() === '') {
            // console.warn(`⚠️ 跳过无效行: ${line}`);   无效行直接跳过了，没有添加
            skipped++;
            continue;
        }

        const col1 = parts[0].trim();
        const col2 = parts[1].trim();
        const col3 = parts[2]?.trim() || null;

        batch.push([filenameWithoutExt, col1, col3]);

        if (batch.length === BATCH_SIZE) {
            await insertBatch(batch);
            // console.log(`✔ 插入批次 ${BATCH_SIZE} 行`);
            batch = [];
        }
    }

    if (batch.length > 0) {
        await insertBatch(batch);
        console.log(`✔ 插入剩余 ${batch.length} 行`);
    }

    console.log(`✅ 文件 ${filenameWithoutExt} 导入完成（跳过 ${skipped} 行）`);
}

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