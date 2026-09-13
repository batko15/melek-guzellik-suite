// V5.4 Bootstrap-Upgrade-Pfad-Test — gegen die ECHTE Produktions-Supabase-DB
// Prüft exakt die Produktionslogik: Transaktion + Advisory-Lock + Tabellen-Check
// + DO-Block-DDL (Upgrade: Service existiert, GiftCard/WaitlistEntry fehlen)
// + Paket-Saat. Passwort aus gitignored .env.cloud-test.
const fs = require('fs')
const { Client } = require('pg')

function loadUrl() {
  try {
    return fs.readFileSync('/home/z/my-project/.env.cloud-test', 'utf8').match(/postgresql:\/\/.+/)[0].trim()
  } catch { return null }
}

// DDL wird unten direkt aus src/lib/pg-ddl.ts (JSON-Array) gelesen

async function main() {
  const url = loadUrl()
  if (!url) { console.error('Keine .env.cloud-test'); process.exit(1) }
  const u = new URL(url)
  const c = new Client({
    host: u.hostname, port: Number(u.port) || 5432, database: u.pathname.slice(1),
    user: decodeURIComponent(u.username), password: decodeURIComponent(u.password),
    ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
  })
  await c.connect()

  // Ausgangszustand
  const before = await c.query("select table_name from information_schema.tables where table_schema='public' and table_name in ('Service','GiftCard','WaitlistEntry')")
  console.log('VORHER vorhandene Tabellen:', before.rows.map(r => r.table_name).join(', '))

  // ── Phase 1 exakt wie runBootstrap: Transaktion + Lock + DDL ──
  await c.query('BEGIN')
  try {
    await c.query('SELECT pg_advisory_xact_lock(727101)')
    const tables = await c.query("select table_name from information_schema.tables where table_schema='public' and table_name in ('Service','GiftCard','WaitlistEntry')")
    const present = new Set(tables.rows.map(r => r.table_name))
    if (present.has('Service') && present.has('GiftCard') && present.has('WaitlistEntry')) {
      console.log('Alle Tabellen bereits vorhanden — DDL übersprungen')
    } else {
      // DDL-Statements laden (aus der generierten TS-Datei — als JS evaluieren)
      const ts = fs.readFileSync('/home/z/my-project/src/lib/pg-ddl.ts', 'utf8')
      const marker = 'string[] = ['
      const arrStart = ts.indexOf(marker) + marker.length - 1
      const jsonArr = ts.slice(arrStart, ts.lastIndexOf(']') + 1).replace(/,\s*\]$/, ']')
      const stmts = JSON.parse(jsonArr)
      console.log(`DDL ausführen (${stmts.length} Statements) …`)
      let skipped = 0
      for (const s of stmts) {
        try {
          await c.query(s)
        } catch (err) {
          const msg = String(err.message)
          if (/already exists|duplicate/i.test(msg)) { skipped++; continue }
          console.error('DDL-FEHLER:', msg.slice(0, 200))
          throw err
        }
      }
      console.log(`✓ DDL fertig (übersprungen: ${skipped})`)
    }
    await c.query('COMMIT')
  } catch (e) {
    await c.query('ROLLBACK')
    console.error('PHASE-1 FEHLGESCHLAGEN (Rollback):', e.message)
    await c.end()
    process.exit(1)
  }

  // ── Phase 2: Paket-Saat (exakt wie runBootstrap) ──
  await c.query('BEGIN')
  try {
    await c.query('SELECT pg_advisory_xact_lock(727101)')
    const paket = await c.query("select count(*)::int as n from \"Service\" where category = 'paket'")
    if (paket.rows[0].n === 0) {
      await c.query(`insert into "Service" (id, name, category, description, "durationMin", "priceChf", popular, active, "sortOrder", "createdAt")
        values
        (gen_random_uuid()::text, 'Manikür + Pedikür Düet Paketi', 'paket', 'Jel Manikür + Delüks Pedikür birlikte: normalde 1.300 ₺ → pakette 1.100 ₺ (200 ₺ tasarruf)', 135, 1100, true, true, 30, now()),
        (gen_random_uuid()::text, 'Kalıcı Oje + Kaş & Kirpik Boyama', 'paket', 'Kalıcı Oje (Shellac) + Kaş & Kirpik Boyama birlikte: normalde 850 ₺ → pakette 700 ₺ (150 ₺ tasarruf)', 75, 700, false, true, 31, now()),
        (gen_random_uuid()::text, 'Jel Uzatma + Lash Lift Paketi', 'paket', 'Jel Uzatma + Lash Lift & Boyama birlikte: normalde 2.000 ₺ → pakette 1.750 ₺ (250 ₺ tasarruf)', 165, 1750, false, true, 32, now())`)
      console.log('✓ 3 Paket-Hizmetler eingefügt')
    } else {
      console.log('Paket-Hizmetler bereits vorhanden:', paket.rows[0].n)
    }
    await c.query('COMMIT')
  } catch (e) {
    await c.query('ROLLBACK')
    console.error('PHASE-2 FEHLGESCHLAGEN (Rollback):', e.message)
    await c.end()
    process.exit(1)
  }

  // ── Endzustand ──
  const after = await c.query("select table_name from information_schema.tables where table_schema='public' and table_name in ('Service','GiftCard','WaitlistEntry')")
  console.log('NACHHER vorhandene Tabellen:', after.rows.map(r => r.table_name).join(', '))
  const svc = await c.query('select count(*)::int as total, count(*) filter (where category = \'paket\')::int as paket from "Service"')
  console.log(`Service: ${svc.rows[0].total} gesamt, davon ${svc.rows[0].paket} Paket`)
  const gc = await c.query('select count(*)::int as n from "GiftCard"')
  const wl = await c.query('select count(*)::int as n from "WaitlistEntry"')
  console.log(`GiftCard: ${gc.rows[0].n} Zeilen · WaitlistEntry: ${wl.rows[0].n} Zeilen`)
  await c.end()
  console.log('✓ UPGRADE-PFAD ERFOLGREICH VERIFIZIERT')
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
