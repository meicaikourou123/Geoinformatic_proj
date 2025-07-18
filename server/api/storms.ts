import { Client } from 'pg'

export default defineEventHandler(async () => {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '123456',
        database: 'postgres'
    })

    await client.connect()
    const result = await client.query('SELECT * FROM t_tot LIMIT 50')
    await client.end()

    return result.rows
})