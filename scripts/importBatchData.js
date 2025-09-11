import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

// here I import the sensor data into the pgsql
// but the strom data, I import it manually


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


const datasetDir = '/Users/sunzheng/Downloads/01datasets/VV_tot';
async function insertBatch(rows) {
    if (rows.length === 0) return;

    const valuesClause = rows
        .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
        .join(', ');

    const flatValues = rows.flat();

    await client.query(
        `INSERT INTO vv_tot (vv_id, date_time, data) VALUES ${valuesClause}`,
        flatValues
    );
}

async function importFileToDB(filePath) {
    const basename = path.basename(filePath);
    const filenameWithoutExt = path.parse(basename).name.slice(0, -7);

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    const dataLines = lines.slice(1); // skip header

    let batch = [];
    let skipped = 0;

    for (const line of dataLines) {
        const parts = line.split(','); // 确认分隔符是不是 ','

        if (parts.length < 2 || parts[1].trim() === '') {
            skipped++;
            continue;
        }

        const date_time = parts[0].trim();  // 第一列：时间
        const data = parts[1].trim();       // 第二列：数值

        // 插入三列：文件名 + 时间 + 数据
        batch.push([filenameWithoutExt, date_time, data]);

        if (batch.length === BATCH_SIZE) {
            await insertBatch(batch);
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