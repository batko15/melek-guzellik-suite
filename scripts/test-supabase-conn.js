// Passwort aus .env.cloud-test laden (gitignored) — NICHT hardcodieren!
const fs = require('fs')
function loadPw() {
  try {
    const m = fs.readFileSync('/home/z/my-project/.env.cloud-test', 'utf8').match(/postgresql:\/\/[^:]*:([^@]+)@/)
    return m ? m[1] : null
  } catch { return null }
}
// Test Supabase connection: password variants × pooler hosts
const { Client } = require('pg')

const REF = 'pmudlcpusvwvmejirpsq'
const HOSTS = ['aws-0-eu-central-1.pooler.supabase.com', 'aws-1-eu-central-1.pooler.supabase.com']
const PASSWORDS = [loadPw()].filter(Boolean)

async function tryConn(host, password, user) {
  const c = new Client({
    host, port: 5432, user, password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
  const t = setTimeout(() => { try { c.end() } catch {} }, 12000)
  try {
    await c.connect()
    const v = await c.query('select version() as v, current_database() as db')
    const cnt = await c.query("select count(*)::int as n from information_schema.tables where table_schema='public'")
    clearTimeout(t)
    await c.end()
    return { ok: true, version: v.rows[0].v.slice(0, 60), tables: cnt.rows[0].n }
  } catch (e) {
    clearTimeout(t)
    try { await c.end() } catch {}
    return { ok: false, err: e.message }
  }
}

;(async () => {
  for (const host of HOSTS) {
    for (const pw of PASSWORDS) {
      const user = `postgres.${REF}`
      const r = await tryConn(host, pw, user)
      console.log(`${host} | user=${user} | pw=${JSON.stringify(pw)} =>`, r.ok ? `OK (${r.version}, tables=${r.tables})` : `FAIL: ${r.err}`)
      if (r.ok) {
        // also test direct user name form via pooler? Not valid — pooler requires postgres.<ref>. Also test plain 'postgres' for completeness:
        const r2 = await tryConn(host, pw, 'postgres')
        console.log(`   (plain user 'postgres': ${r2.ok ? 'OK' : 'FAIL: ' + r2.err})`)
        process.exit(0)
      }
    }
  }
  console.log('ALL FAILED')
})()
