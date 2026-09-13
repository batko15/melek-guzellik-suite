// ═══════════════════════════════════════════════════════════════════════════
//  SUPABASE/POSTGRES BOOTSTRAP — automatische Datenbank-Ersteinrichtung
// ═══════════════════════════════════════════════════════════════════════════
//  Vercel + Supabase: Beim ALLERERSTEN API-Aufruf richtet dieses Modul die
//  Cloud-Datenbank vollständig automatisch ein:
//    1. Tabellen anlegen (idempotente DDL aus pg-ddl.ts)
//    2. Grunddaten säen: 17 Hizmetler (₺), 22 Galerie-Fotos, Ekip
//  Danach läuft alles wie gewohnt — ohne Migrationen, ohne CLI, ohne Setup.
//  Lokal (SQLite) wird dieser Bootstrap vollständig übersprungen.
//
//  V5.2 — RENNEN-SCHUTZ: Vercel kann bei einem Kaltstart MEHRERE Lambda-
//  Instanzen gleichzeitig hochfahren ( parallele API-Aufrufe beim ersten
//  Laden der Seite). Ohne Schutz würden alle Instanzen gleichzeitig säen
//  → doppelte Hizmetler/Galerie. Lösung: das komplette Bootstrap läuft in
//  EINER Transaktion mit PostgreSQL-Advisory-Lock — DB-weit serialisiert.
//  Die Lock-Nummer ist frei gewählt, muss nur projektweit eindeutig sein.
// ═══════════════════════════════════════════════════════════════════════════

import type { PrismaClient } from "@prisma/client"
import { PG_DDL } from "@/lib/pg-ddl"

// ─── Produktions-Grunddaten (bewusst KEINE Demo-Randevulars/Yorumlar) ──────

const SERVICES = [
  { name: "Jel Manikür", category: "tirnak", description: "İstediğiniz renkte yüksek kaliteli jel cila ile temel bakım", durationMin: 75, priceChf: 600, popular: true, sortOrder: 1 },
  { name: "Jel Uzatma", category: "tirnak", description: "İstenen şekil ve boyda jel ile uzatma", durationMin: 120, priceChf: 1200, popular: true, sortOrder: 2 },
  { name: "Dolgu (Refil)", category: "tirnak", description: "Yeni çıkan tırnakların dolgusu ve yeniden mühürleme", durationMin: 90, priceChf: 900, sortOrder: 3 },
  { name: "Özel Tırnak Tasarımı", category: "tirnak", description: "Folyo, taş ve parıltı ile kişiye özel tasarım", durationMin: 45, priceChf: 450, sortOrder: 4 },
  { name: "Fransız Manikür", category: "tirnak", description: "Kusursuz beyaz uçlu klasik", durationMin: 30, priceChf: 350, sortOrder: 5 },
  { name: "Kalıcı Oje (Shellac)", category: "tirnak", description: "4 haftaya kadar süren parlak renk", durationMin: 45, priceChf: 500, popular: true, sortOrder: 6 },
  { name: "Klasik Manikür", category: "tirnak", description: "Kütikül bakımı, törpüleme, istediğiniz cila", durationMin: 40, priceChf: 400, sortOrder: 7 },
  { name: "Delüks Pedikür", category: "tirnak", description: "Peeling ve masajlı şımartan ayak bakımı", durationMin: 60, priceChf: 700, sortOrder: 8 },
  { name: "Kaş Şekillendirme", category: "guzellik", description: "Kusursuz kaşlar için hassas alma ve şekillendirme", durationMin: 20, priceChf: 250, popular: true, sortOrder: 10 },
  { name: "Kaş & Kirpik Boyama", category: "guzellik", description: "Etkileyici bakışlar için nazik boya", durationMin: 30, priceChf: 350, sortOrder: 11 },
  { name: "Delüks Cilt Bakımı", category: "guzellik", description: "Temizlik, peeling, maske ve bakım masajı", durationMin: 60, priceChf: 900, popular: true, sortOrder: 12 },
  { name: "İp ile Kaş Alma", category: "guzellik", description: "Geleneksel, özellikle nazik tüy alma yöntemi", durationMin: 20, priceChf: 300, sortOrder: 13 },
  { name: "Kına Kaş", category: "guzellik", description: "Daha dolgun kaşlar için doğal kına boyası", durationMin: 40, priceChf: 400, sortOrder: 14 },
  { name: "Kirpik Uzatma 1:1", category: "kirpik", description: "Her kirpiğe bir kılla klasik uzatma", durationMin: 90, priceChf: 1250, popular: true, sortOrder: 20 },
  { name: "Volume Kirpik Uzatma", category: "kirpik", description: "Maksimum etki için Rus volume tekniği", durationMin: 120, priceChf: 1500, sortOrder: 21 },
  { name: "Kirpik Dolgusu", category: "kirpik", description: "2–3 hafta sonra dolgu uygulaması", durationMin: 60, priceChf: 750, sortOrder: 22 },
  { name: "Lash Lift + Boyama", category: "kirpik", description: "Doğal kirpikler kusursuz kıvrımla", durationMin: 45, priceChf: 800, sortOrder: 23 },
]

const GALLERY = [
  { title: "Bordo Kedi Gözü", category: "tirnak", imagePath: "/gallery/real/bordo-kedi-gozu.jpg", sortOrder: 1 },
  { title: "Bordo Ombre", category: "tirnak", imagePath: "/gallery/real/bordo-ombre.jpg", sortOrder: 2 },
  { title: "Pudra Pembe-Bordo", category: "tirnak", imagePath: "/gallery/real/pembe-bordo-isiltili.jpg", sortOrder: 3 },
  { title: "Kirpik Uzatma", category: "kirpik", imagePath: "/gallery/real/kirpik-uzatma.jpg", sortOrder: 4 },
  { title: "Kirpik Bakımı", category: "kirpik", imagePath: "/gallery/real/kirpik-bakim.jpg", sortOrder: 5 },
  { title: "Kaş Tasarımı", category: "guzellik", imagePath: "/gallery/real/kas-tasarimi.jpg", sortOrder: 6 },
  { title: "Özel Gün Dekoru", category: "tirnak", imagePath: "/gallery/real/ozel-gun-takimi.jpg", sortOrder: 7 },
  { title: "Marka Kimliğimiz", category: "studyo", imagePath: "/gallery/real/marka.jpg", sortOrder: 8 },
  { title: "Şampanya Altını", category: "tirnak", imagePath: "/gallery/hero.png", sortOrder: 9 },
  { title: "Stüdyomuz", category: "studyo", imagePath: "/gallery/salon-interior.png", sortOrder: 10 },
  { title: "Kirpik & Kaş Bakımı", category: "kirpik", imagePath: "/gallery/real/kirpik-kas-bakim.jpg", sortOrder: 11 },
  { title: "Zarif Kirpikler", category: "kirpik", imagePath: "/gallery/real/kirpik-zarif.jpg", sortOrder: 12 },
  { title: "Göz Makyajı", category: "guzellik", imagePath: "/gallery/real/goz-makyaj.jpg", sortOrder: 13 },
  { title: "Bordo Parlak", category: "tirnak", imagePath: "/gallery/real/bordo-parlak.jpg", sortOrder: 14 },
  { title: "Bordo Klasik", category: "tirnak", imagePath: "/gallery/real/bordo-klasik.jpg", sortOrder: 15 },
  { title: "Bordo Nail Art", category: "tirnak", imagePath: "/gallery/real/bordo-nailart.jpg", sortOrder: 16 },
  { title: "Yarı Jel & Tips French", category: "tirnak", imagePath: "/gallery/real/yari-jel-tips-french.jpg", sortOrder: 17 },
  { title: "Pembe Pırıltı Jel", category: "tirnak", imagePath: "/gallery/real/jel-guclendirme-pembe-pirilti.jpg", sortOrder: 18 },
  { title: "24K Altın Folyo", category: "tirnak", imagePath: "/gallery/real/turuncu-pembe-altin-folyo.jpg", sortOrder: 19 },
  { title: "Deniz Kabuğu French", category: "tirnak", imagePath: "/gallery/real/yeni-nesil-protez-deniz-kabugu.jpg", sortOrder: 20 },
  { title: "İnci Tozu Sarısı", category: "tirnak", imagePath: "/gallery/real/tereyagi-sarisi-inci-tozu.jpg", sortOrder: 21 },
  { title: "Nar Çiçeği Nail Art", category: "tirnak", imagePath: "/gallery/real/nar-cicegi-deniz-yildizi.jpg", sortOrder: 22 },
]

const STAFF = [
  { name: "Melek", role: "İşletme Sahibi & Nail Artist", commissionRate: 45, phone: "+90 542 633 15 70", active: true },
]

// ─── Bootstrap ──────────────────────────────────────────────────────────────

/** true, wenn die App gegen PostgreSQL (Supabase) läuft. */
export function isPostgres(): boolean {
  return /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL ?? "")
}

let bootstrapPromise: Promise<void> | null = null

/**
 * Richtet die PostgreSQL-Datenbank einmalig ein (Tabellen + Grunddaten).
 * Wird vor der ersten DB-Operation await-et — siehe db.ts ($extends-Hook).
 * Idempotent: mehrfacher Aufruf ist harmlos, teil-fertige Setups werden
 * vervollständigt.
 */
export function ensureDatabase(prisma: PrismaClient): Promise<void> {
  if (!isPostgres()) return Promise.resolve()
  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap(prisma).catch((err) => {
      // Bei Fehler: Cache zurücksetzen, nächster Request versucht es erneut
      bootstrapPromise = null
      throw err
    })
  }
  return bootstrapPromise
}

/** Advisory-Lock-Kennung — DB-weit eindeutig, serialisiert parallele Kaltstarts. */
const BOOTSTRAP_LOCK_ID = 727101

async function runBootstrap(prisma: PrismaClient): Promise<void> {
  const started = Date.now()

  // ── Schneller Pfad OHNE Lock/Transaktion: alles schon eingerichtet? ──────
  // (einmal pro Kaltstart — bei bestehender DB drei winzige Counts, kein Lock)
  if (await isAlreadyBootstrapped(prisma)) return

  // ── Phase 1: Tabellen (DDL) — eigene Transaktion + Lock ──────────────────
  // Zwei GETRENNTE Transaktionen statt einer: sollte die Serverless-Funktion
  // mitten drin sterben (Timeout), bleibt die fertige Phase erhalten und der
  // nächste Request macht nahtlos weiter (Alles-oder-Nichts pro Phase).
  // RENNEN-SCHUTZ: wer die Lock zuerst hält, setzt auf; alle anderen warten
  // und sehen danach den frisch eingetragenen Stand (READ COMMITTED).
  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BOOTSTRAP_LOCK_ID})`
      const existing = await tx.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'Service'
        ) AS exists
      `
      if (existing[0]?.exists === true) return

      console.log("[bootstrap] Supabase-Datenbank leer → Tabellen werden erstellt …")
      for (const stmt of PG_DDL) {
        try {
          await tx.$executeRawUnsafe(stmt)
        } catch (err) {
          const msg = String((err as Error)?.message ?? err)
          // Bereits vorhanden / bereits existierender Constraint → überspringen
          if (/already exists|duplicate/i.test(msg)) continue
          console.error("[bootstrap] DDL-Fehler:", msg.slice(0, 200))
          throw err
        }
      }
      console.log(`[bootstrap] ✓ ${PG_DDL.length} DDL-Statements ausgeführt`)
    },
    { timeout: 90_000, maxWait: 15_000 },
  )

  // ── Phase 2: Grunddaten säen — eigene Transaktion + Lock ─────────────────
  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BOOTSTRAP_LOCK_ID})`

      const serviceCount = await tx.service.count()
      if (serviceCount === 0) {
        console.log("[bootstrap] Hizmetler säen (17) …")
        await tx.service.createMany({ data: SERVICES })
      }

      const galleryCount = await tx.galleryItem.count()
      if (galleryCount === 0) {
        console.log("[bootstrap] Galeri säen (22) …")
        await tx.galleryItem.createMany({ data: GALLERY })
      }

      const staffCount = await tx.staffMember.count()
      if (staffCount === 0) {
        console.log("[bootstrap] Ekip säen …")
        await tx.staffMember.createMany({ data: STAFF })
      }
    },
    { timeout: 60_000, maxWait: 15_000 },
  )

  console.log(`[bootstrap] ✓ fertig in ${Date.now() - started} ms`)
}

/** Fast-Path-Check: Tabellen + Grunddaten bereits vollständig vorhanden? */
async function isAlreadyBootstrapped(prisma: PrismaClient): Promise<boolean> {
  try {
    const existing = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'Service'
      ) AS exists
    `
    if (existing[0]?.exists !== true) return false
    const [svc, gal, staff] = await Promise.all([
      prisma.service.count(),
      prisma.galleryItem.count(),
      prisma.staffMember.count(),
    ])
    return svc > 0 && gal > 0 && staff > 0
  } catch {
    // Tabelle noch nicht da o.ä. → Setup-Pfad laufen lassen
    return false
  }
}
