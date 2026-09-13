// Passwort aus .env.cloud-test laden (gitignored) — NICHT hardcodieren!
import fs from 'node:fs'
function loadPw() {
  try {
    const m = fs.readFileSync('/home/z/my-project/.env.cloud-test', 'utf8').match(/postgresql:\/\/[^:]*:([^@]+)@/)
    return m ? m[1] : null
  } catch { return null }
}
// Full connection test with correct database name + table creation check
import { Client } from 'pg'

const REF = 'pmudlcpusvwvmejirpsq'
const HOST = 'aws-1-eu-west-1.pooler.supabase.com'
const USER = `postgres.${REF}`
const PW = loadPw()

async function main() {
  const c = new Client({
    host: HOST, port: 5432, database: 'postgres', user: USER, password: PW,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
  await c.connect()
  const v = await c.query('select version() as v')
  console.log('VERSION:', v.rows[0].v)

  const tables = await c.query("select table_name from information_schema.tables where table_schema='public' order by table_name")
  console.log('TABLES (' + tables.rows.length + '):', tables.rows.map(r => r.table_name).join(', ') || '(none)')

  // SSL check via parameter (ssl_is_used not exposed via pooler)
  const ssl = await c.query("show ssl")
  console.log('Server SSL:', ssl.rows[0].ssl)

  await c.end()
  console.log('\nFULL POOLER URL (working):')
  console.log(`postgresql://${USER}:${PW}@${HOST}:5432/postgres`)
}
main().catch(e => { console.error('FAIL:', e.message); process.exit(1) })
