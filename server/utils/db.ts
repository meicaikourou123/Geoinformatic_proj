// server/utils/db.ts
import { Client } from 'pg'

export function createClient() {
    return new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '123456',
        database: 'postgres',
    })
}