import { defineEventHandler, getQuery } from 'h3'
import { Client } from 'pg'
import { formatDateTime } from '~/utils/formats'
export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const start = query.start as string
    const end = query.end as string

    console.log('接收到的时间参数:', start, end)

    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '123456',
        database: 'postgres'
    })

    await client.connect()

    const result = await client.query(
        `SELECT 
            idx AS stormcode,
            MIN(date_time) AS start_time,
            MAX(date_time) AS end_time,
            json_agg(json_build_object('lon', lon, 'lat', lat)) AS points
         FROM dbz_10_19
         WHERE date_time BETWEEN $1::timestamp AND $2::timestamp
         GROUP BY idx
         ORDER BY start_time`,
        [start, end]
    )

    await client.end()
    const formattedRows = result.rows.map(row => ({
        ...row,
        start_time: formatDateTime(row.start_time),
        end_time: formatDateTime(row.end_time),
        // points 字段已直接包含所有点 [{lon,lat},...]
    }))
    return formattedRows
})