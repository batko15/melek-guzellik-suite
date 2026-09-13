// Passwort aus .env.cloud-test laden (gitignored) — NICHT hardcodieren!
import fs from 'node:fs'
function loadPw() {
  try {
    const m = fs.readFileSync('/home/z/my-project/.env.cloud-test', 'utf8').match(/postgresql:\/\/[^:]*:([^@]+)@/)
    return m ? m[1] : null
  } catch { return null }
}
// Find the correct Supabase pooler region for project pmudlcpusvwvmejirpsq
import { Client } from 'pg'
const dns = (await import('node:dns')).promises

const REF = 'pmudlcpusvwvmejirpsq'
const REGIONS = [
  'us-east-1','us-east-2','us-west-1','us-west-2','ca-central-1','sa-east-1',
  'eu-west-1','eu-west-2','eu-west-3','eu-central-1','eu-central-2','eu-north-1','eu-south-1','eu-south-2',
  'ap-east-1','ap-southeast-1','ap-southeast-2','ap-southeast-3','ap-southeast-4','ap-south-1','ap-south-2',
  'ap-northeast-1','ap-northeast-2','me-central-1','me-south-1','af-south-1'
]
const CLUSTERS = ['aws-0', 'aws-1']
const PW = loadPw()
const PASSWORDS = [PW].filter(Boolean)

async function tryConn(host, user, password) {
  const c = new Client({ host, port: 5432, user, password, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 })
  const t = setTimeout(() => { try { c.end() } catch {} }, 10000)
  try {
    await c.connect()
    const v = await c.query('select version() as v')
    clearTimeout(t); try { await c.end() } catch {}
    return { ok: true, version: v.rows[0].v }
  } catch (e) {
    clearTimeout(t); try { c.end() } catch {}
    return { ok: false, err: e.message }
  }
}

;(async () => {
  for (const region of REGIONS) {
    for (const cluster of CLUSTERS) {
      const host = `${cluster}-${region}.pooler.supabase.com`
      let ip
      try { ip = (await dns.resolve6(host))[0] } catch { try { ip = (await dns.resolve4(host))[0] } catch { continue } }
      for (const pw of PASSWORDS) {
        const r = await tryConn(host, `postgres.${REF}`, pw)
        if (r.ok) {
          console.log(`FOUND: ${host} password=${JSON.stringify(pw)} => ${r.version.slice(0, 80)}`)
          console.log(`CONNECTION_STRING: postgresql://postgres.${REF}:${encodeURIComponent(pw)}@${host}:5432/postgres`)
          process.exit(0)
        } else if (!/not found/i.test(r.err)) {
          // tenant exists but password wrong — region found!
          console.log(`REGION FOUND (auth issue): ${host} pw=${JSON.stringify(pw)} => ${r.err}`)
        }
      }
    }
  }
  console.log('NO POOLER FOUND — project may use direct-only connection')
})()
