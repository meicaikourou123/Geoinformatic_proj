import { defineEventHandler, getQuery } from 'h3'
import { Client } from 'pg'
import { createClient } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const start = query.start as string
    const end = query.end as string

    const client = createClient()
    await client.connect()

    const result = await client.query(
        `SELECT DISTINCT t_id FROM t_tot WHERE time BETWEEN $1::timestamp AND $2::timestamp LIMIT 50`,
        [start, end]
    )

    await client.end()

    return result.rows
})