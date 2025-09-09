import { defineEventHandler,readBody } from 'h3'
import {createClient} from "~/server/utils/db";
import { formatToPgTimestamp } from '~/utils/formats'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)   // the POST request, if it is GET request, should use const query = getQuery(event)
    const client = createClient()
    await client.connect()
    const { groups, start_time, end_time } = body

    // console.log(body)
    const tableMap: Record<string, { table: string, idColumn: string }> = {     //map the table and idcolumn
        temp: { table: "t_tot", idColumn: "t_id" },
        pres: { table: "pa_tot", idColumn: "pa_id" },
        wind: { table: "dv_tot", idColumn: "dv_id" },
        rain: { table: "pp_tot", idColumn: "pp_id" },
        relh: { table: "ur_tot", idColumn: "ur_id" },
        winv: { table: "vv_tot", idColumn: "vv_id" }
    }

    const start = formatToPgTimestamp(body.start)
    const end = formatToPgTimestamp(body.end)

    console.log(start,end)

    const results: Record<string, any[]> = {}

    for (const [groupType, sensors] of Object.entries(groups)) {
        const mapping = tableMap[groupType]
        if (!mapping) continue

        const { table, idColumn } = mapping
        results[groupType] = []

        for (const sensor of sensors as { id: string }[]) {
            const res = await client.query(
                `SELECT *
       FROM ${table}
       WHERE ${idColumn} = $1
         AND date_time BETWEEN $2 AND $3
         AND data IS NOT NULL`,
                [sensor.id, start, end]
            )
            results[groupType].push({
                id: sensor.id,
                data: res.rows
            })
        }
    }

    await client.end()

    console.log(results)
    return {
        success: true,
        data: results
    }

})