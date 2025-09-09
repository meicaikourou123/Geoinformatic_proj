import { defineEventHandler, getQuery } from 'h3'
import { readBody } from 'h3'
import {createClient} from "~/server/utils/db";

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { lon, lat, radius } = body

    const client = createClient()
    await client.connect()

    const tableNames = [
        'pres_sensor',
        'temp_sensor',
        'wind_sensor',
        'winv_sensor',
        'relh_sensor',
        'rain_sensor'
    ]

    const results = {}

    for (const table of tableNames) {
        const query = `
  SELECT *, ST_AsGeoJSON(geom) AS geojson
  FROM ${table}
  WHERE ST_DWithin(
    geom,
    ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), 4326), 32632),
    $3
  )
`
        const res = await client.query(query, [lon, lat, radius])
        results[table] = res.rows
    }

    await client.end()
    return results
})