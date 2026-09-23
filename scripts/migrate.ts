import fs from 'fs'
import path from 'path'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

async function runMigration() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:PRITAMsingh@123@db.wjocnbzspehdfsbjdpbe.supabase.co:5432/postgres'

  console.log('Connecting to PostgreSQL database...')
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    await client.connect()
    console.log(' Connected to Supabase PostgreSQL successfully!')

    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20260923_init_schema.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('Running migration: 20260923_init_schema.sql...')
    await client.query(sql)
    console.log(' Migration executed successfully!')

    // Check tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `)
    console.log('Tables in public schema:')
    res.rows.forEach((r) => console.log(`  - ${r.table_name}`))
  } catch (err: any) {
    console.error(' Migration failed:', err.message)
    console.error(err)
  } finally {
    await client.end()
  }
}

runMigration()
