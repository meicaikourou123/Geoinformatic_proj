import fs from 'fs';
import csv from 'csv-parser';
import { Client } from 'pg';
import proj4 from 'proj4';  //must install proj4 : npm install proj4

// define EPSG:32632
proj4.defs("EPSG:32632", "+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs");

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '123456',
    port: 5432,
});

const csvFilePath = '/Users/sunzheng/Downloads/01datasets/dataset_temp_summary3.csv';

const columns = {
    nan_percentage: 'NaN percentage',
    idstazione: 'IDstazione',
    nome_tipologia: 'NOMEtipologia',
    datainizio: 'DataInizio',
    quotasensore: 'QuotaSensore',
    aggregazione_temporale: 'AggregazioneTemporale',
    nomestazione: 'NOMEstazione',
    lat: 'lat',
    lon: 'lon',
    comune: 'Comune',
    provincia: 'Provincia',
    idsensore: 'IDsensore',
    start_year: 'start year',
    end_year: 'end year',
    years: 'years',
    total_data: 'total data',
};

async function insertRow(row) {
    try {
        const lat = parseFloat(row[columns.lat]);
        const lon = parseFloat(row[columns.lon]);
//transform from 4326 geographic reference to 32632 project reference. from the degree to the meter.
        let geom = null;
        if (!isNaN(lat) && !isNaN(lon)) {
            const [x, y] = proj4('EPSG:4326', 'EPSG:32632', [lon, lat]);
            geom = `SRID=32632;POINT(${x} ${y})`;
        }

        const values = [
            row[columns.idsensore] || null,
            row[columns.start_year] || null,
            row[columns.end_year] || null,
            parseInt(row[columns.years]) || null,
            parseInt(row[columns.total_data]) || null,
            parseFloat(row[columns.nan_percentage]) || null,
            parseInt(row[columns.idstazione]) || null,
            row[columns.nome_tipologia] || null,
            row[columns.datainizio] || null,
            parseInt(row[columns.quotasensore]) || null,
            parseInt(row[columns.aggregazione_temporale]) || null,
            row[columns.nomestazione] || null,
            lat || null,
            lon || null,
            row[columns.comune] || null,
            row[columns.provincia] || null,
            geom
        ];

        const query = `
            INSERT INTO temp_sensor (
                idsensore, start_year, end_year, years, total_data,
                nan_percentage, idstazione, nome_tipologia, datainizio, quotasensore,
                aggregazione_temporale, nomestazione, lat, lon, comune, provincia, geom
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16,
                ST_GeomFromText($17)
            )
        `;

        await client.query(query, values);
        console.log('✔ 插入成功');
    } catch (err) {
        console.error('❌ 插入失败:', err.message);
    }
}

import pLimit from 'p-limit';

async function main() {
    await client.connect();
    const rows = [];
    const limit = pLimit(5); // 设置并发上限为 5

    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
            rows.push(row);
            // console.log(row)
        })
        .on('end', async () => {
            const tasks = rows.map(row => limit(() => insertRow(row)));
            await Promise.all(tasks);
            console.log('✅ 数据导入完成');
            await client.end();
        });
}

main().catch(console.error);