// ═══════════════════════════════════════════════════════════════════════════
//  SUPABASE/POSTGRES BOOTSTRAP — automatische Datenbank-Ersteinrichtung
// ═══════════════════════════════════════════════════════════════════════════
//  Vercel + Supabase: Beim ALLERERSTEN API-Aufruf richtet dieses Modul die
//  Cloud-Datenbank vollständig automatisch ein:
//    1. Tabellen anlegen (idempotente DDL aus pg-ddl.ts)
//    2. Grunddaten säen: 17 Hizmetler (₺), 22 Galerie-Fotos, Ekip
//  Danach läuft alles wie gewohnt — ohne Migrationen, ohne CLI, ohne Setup.
//  Lokal (SQLite) wird dieser Bootstrap vollständig übersprungen.
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

async function runBootstrap(prisma: PrismaClient): Promise<void> {
  const started = Date.now()

  // 1) Tabellen vorhanden?
  const existing = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'Service'
    ) AS exists
  `
  const tablesExist = existing[0]?.exists === true

  if (!tablesExist) {
    console.log("[bootstrap] Supabase-Datenbank leer → Tabellen werden erstellt …")
    for (const stmt of PG_DDL) {
      try {
        await prisma.$executeRawUnsafe(stmt)
      } catch (err) {
        const msg = String((err as Error)?.message ?? err)
        // Bereits vorhanden / bereits existierender Constraint → überspringen
        if (/already exists|duplicate/i.test(msg)) continue
        console.error("[bootstrap] DDL-Fehler:", msg.slice(0, 200))
        throw err
      }
    }
    console.log(`[bootstrap] ✓ ${PG_DDL.length} DDL-Statements ausgeführt`)
  }

  // 2) Grunddaten säen (nur wenn Service-Tabelle leer ist)
  const serviceCount = await prisma.service.count()
  if (serviceCount === 0) {
    console.log("[bootstrap] Hizmetler säen (17) …")
    await prisma.service.createMany({ data: SERVICES })
  }

  const galleryCount = await prisma.galleryItem.count()
  if (galleryCount === 0) {
    console.log("[bootstrap] Galeri säen (22) …")
    await prisma.galleryItem.createMany({ data: GALLERY })
  }

  const staffCount = await prisma.staffMember.count()
  if (staffCount === 0) {
    console.log("[bootstrap] Ekip säen …")
    await prisma.staffMember.createMany({ data: STAFF })
  }

  if (Date.now() - started > 50) {
    console.log(`[bootstrap] ✓ fertig in ${Date.now() - started} ms`)
  }
}
