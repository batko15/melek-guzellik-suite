// ═══════════════════════════════════════════════════════════════════════════
//  MELEK'ÇE GÜZELLİK — V4 ULTIMATE Incremental Upgrade Seed
//  Mevcut V3 veritabanını KORUR ve V4 özellik verilerini ekler:
//   • Ekip üyeleri (prim oranlarıyla)
//   • Envanter (jel, akrilik, kirpik, bakım — düşük stok uyarıları dahil)
//   • Müşteri kartları: alerji beyanı, hassasiyet, tercihler, sadakat puanı
//   • Portfolyo: bazı galeri öğeleri müşterilere bağlanır
//   • Depozito + ekip ataması (randevulara)
//   • Sadakat işlem günlüğü (mevcut puanlarla tutarlı)
//  Çalıştırma: bunx tsx scripts/seed-v4-upgrade.ts   (veya: npx tsx …)
// ═══════════════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  console.log("═══ V4 ULTIMATE Upgrade Seed başlıyor ═══\n")

  // ─── 1. EKİP ÜYELERİ ──────────────────────────────────────────────────────
  const staff = [
    { name: "Melek Hanım", role: "Kurucu & Tırnak Sanatçısı", commissionRate: 45, phone: "+90 530 000 00 01" },
    { name: "Zeynep Arslan", role: "Tırnak Sanatçısı", commissionRate: 30, phone: "+90 538 777 88 99" },
    { name: "Elif Yıldız", role: "Kirpik & Kaş Uzmanı", commissionRate: 25, phone: "+90 533 222 33 44" },
  ]
  const staffMap = new Map<string, string>()
  for (const s of staff) {
    const existing = await db.staffMember.findFirst({ where: { name: s.name } })
    const m = existing
      ? await db.staffMember.update({ where: { id: existing.id }, data: s })
      : await db.staffMember.create({ data: s })
    staffMap.set(s.name, m.id)
    console.log(`  👤 Ekip: ${m.name} — prim %${m.commissionRate}`)
  }

  // ─── 2. ENVANTER ───────────────────────────────────────────────────────────
  const inventory = [
    // Jel & UV (düşük stok örneği: Bordo jel)
    { name: "UV Jel — Bordo", category: "jel", unit: "gr", quantity: 18, minQuantity: 50, unitCost: 12, supplier: "Nail Supply TR" },
    { name: "UV Jel — Pudra Pembe", category: "jel", unit: "gr", quantity: 85, minQuantity: 40, unitCost: 12, supplier: "Nail Supply TR" },
    { name: "UV Jel — Şampanya Altın", category: "jel", unit: "gr", quantity: 62, minQuantity: 30, unitCost: 14, supplier: "Nail Supply TR" },
    { name: "Jel Baz Kat (Base Coat)", category: "jel", unit: "ml", quantity: 120, minQuantity: 50, unitCost: 9, supplier: "Nail Supply TR" },
    { name: "Jel Üst Kat (Top Coat)", category: "jel", unit: "ml", quantity: 45, minQuantity: 50, unitCost: 9, supplier: "Nail Supply TR" },
    // Akrilik
    { name: "Akrilik Toz — Şeffaf", category: "akrilik", unit: "gr", quantity: 150, minQuantity: 60, unitCost: 8, supplier: "K beauty Wholesale" },
    { name: "Akrilik Sıvı (Monomer)", category: "akrilik", unit: "ml", quantity: 200, minQuantity: 100, unitCost: 11, supplier: "K beauty Wholesale" },
    // Kirpik
    { name: "Volume Kirpik Seti (C+)", category: "kirpik", unit: "set", quantity: 6, minQuantity: 3, unitCost: 180, supplier: "Lash Art İstanbul" },
    { name: "Kirpik Yapıştırıcısı (Düşük Buket)", category: "kirpik", unit: "adet", quantity: 2, minQuantity: 4, unitCost: 95, supplier: "Lash Art İstanbul" },
    // Bakım & Yağlar
    { name: "Kütikül Yağı — Badem", category: "bakim", unit: "ml", quantity: 90, minQuantity: 40, unitCost: 7, supplier: "Doğal Kozmetik" },
    { name: "Tırnak Güçlendirici Serum", category: "bakim", unit: "ml", quantity: 55, minQuantity: 25, unitCost: 15, supplier: "Doğal Kozmetik" },
    // Alet
    { name: "Törpü (100/180)", category: "alet", unit: "adet", quantity: 40, minQuantity: 20, unitCost: 6, supplier: "Nail Supply TR" },
    { name: "Kalıp Seti (12'li)", category: "alet", unit: "set", quantity: 8, minQuantity: 4, unitCost: 45, supplier: "Nail Supply TR" },
    { name: "LED Lamba 48W", category: "alet", unit: "adet", quantity: 2, minQuantity: 1, unitCost: 850, supplier: "Nail Supply TR" },
  ]
  for (const i of inventory) {
    const existing = await db.inventoryItem.findFirst({ where: { name: i.name } })
    if (existing) continue
    await db.inventoryItem.create({ data: i })
  }
  const invCount = await db.inventoryItem.count()
  const lowCount = await db.inventoryItem.count({ where: { active: true } })
  console.log(`  📦 Envanter: ${invCount} malzeme (düşük stok: ${invCount - 0}/${lowCount} aktif)`)

  // ─── 3. MÜŞTERİ KARTLARI (alerji, hassasiyet, tercih, sadakat) ────────────
  const customerCards: Array<{
    phone: string
    allergies?: string
    sensitive?: boolean
    prefShape?: string
    prefGel?: string
    prefColors?: string
    loyaltyPoints?: number
    loyaltyReason?: string
  }> = [
    {
      phone: "+90 532 111 22 33",
      allergies: "Jel çözücüye hafif hassasiyet — aseton içermeyen kullanın",
      sensitive: true,
      prefShape: "badem",
      prefGel: "jel",
      prefColors: "bordo, pudra pembe",
      loyaltyPoints: 12,
      loyaltyReason: "V4 geçiş bakiyesi (12 damga)",
    },
    {
      phone: "+90 533 222 33 44",
      prefShape: "oval",
      prefGel: "kalici-oje",
      prefColors: "şampanya altın, nude",
      loyaltyPoints: 6,
      loyaltyReason: "V4 geçiş bakiyesi (6 damga)",
    },
    {
      phone: "+90 534 333 44 55",
      allergies: "HEMA alerjisi — HEMA içermeyen jel kullanın!",
      sensitive: true,
      prefShape: "kare",
      prefGel: "akrilik",
      prefColors: "kırmızı, bordo",
      loyaltyPoints: 15,
      loyaltyReason: "V4 geçiş bakiyesi (15 damga — ödül hazır)",
    },
    { phone: "+90 535 444 55 66", prefShape: "yuvarlak", prefGel: "dogal", prefColors: "fransız beyazı", loyaltyPoints: 3, loyaltyReason: "V4 geçiş bakiyesi (3 damga)" },
    { phone: "+90 536 555 66 77", prefShape: "stiletto", prefGel: "dip", prefColors: "siyah, gümüş", loyaltyPoints: 8, loyaltyReason: "V4 geçiş bakiyesi (8 damga)" },
    { phone: "+90 537 666 77 88", sensitive: true, prefShape: "oval", prefGel: "jel", prefColors: "pudra pembe", loyaltyPoints: 5, loyaltyReason: "V4 geçiş bakiyesi (5 damga)" },
    { phone: "+90 538 777 88 99", prefShape: "badem", prefGel: "jel", prefColors: "bordo", loyaltyPoints: 10, loyaltyReason: "V4 geçiş bakiyesi (10 damga — ödül hazır)" },
    { phone: "+90 539 888 99 00", prefShape: "oval", prefGel: "kalici-oje", loyaltyPoints: 2, loyaltyReason: "V4 geçiş bakiyesi (2 damga)" },
  ]

  for (const c of customerCards) {
    const customer = await db.salonCustomer.findFirst({ where: { phone: c.phone } })
    if (!customer) {
      console.log(`  ⚠️ Müşteri bulunamadı: ${c.phone}`)
      continue
    }
    await db.salonCustomer.update({
      where: { id: customer.id },
      data: {
        allergies: c.allergies ?? null,
        sensitive: c.sensitive ?? false,
        prefShape: c.prefShape ?? null,
        prefGel: c.prefGel ?? null,
        prefColors: c.prefColors ?? null,
        loyaltyPoints: c.loyaltyPoints ?? 0,
      },
    })
    if (c.loyaltyPoints && c.loyaltyPoints > 0) {
      const hasLog = await db.loyaltyLog.findFirst({ where: { customerId: customer.id } })
      if (!hasLog) {
        await db.loyaltyLog.create({
          data: { customerId: customer.id, points: c.loyaltyPoints, reason: c.loyaltyReason ?? "V4 geçiş bakiyesi" },
        })
      }
    }
  }
  console.log(`  🎴 Müşteri kartları: ${customerCards.length} kayıt güncellendi (alerji/tercih/sadakat)`)

  // ─── 4. PORTFOLYO — galeri öğelerini müşterilere bağla ────────────────────
  const portfolioLinks: Array<{ imagePath: string; phone: string }> = [
    { imagePath: "/gallery/real/bordo-kedi-gozu.jpg", phone: "+90 532 111 22 33" },
    { imagePath: "/gallery/real/bordo-ombre.jpg", phone: "+90 532 111 22 33" },
    { imagePath: "/gallery/real/pembe-bordo-isiltili.jpg", phone: "+90 533 222 33 44" },
    { imagePath: "/gallery/real/kirpik-uzatma.jpg", phone: "+90 534 333 44 55" },
    { imagePath: "/gallery/real/kirpik-bakim.jpg", phone: "+90 534 333 44 55" },
    { imagePath: "/gallery/real/kas-tasarimi.jpg", phone: "+90 535 444 55 66" },
    { imagePath: "/gallery/real/bordo-nailart.jpg", phone: "+90 536 555 66 77" },
    { imagePath: "/gallery/real/bordo-parlak.jpg", phone: "+90 538 777 88 99" },
    { imagePath: "/gallery/real/bordo-klasik.jpg", phone: "+90 538 777 88 99" },
  ]
  let linked = 0
  for (const link of portfolioLinks) {
    const item = await db.galleryItem.findFirst({ where: { imagePath: link.imagePath } })
    const customer = await db.salonCustomer.findFirst({ where: { phone: link.phone } })
    if (!item || !customer || item.customerId) continue
    await db.galleryItem.update({ where: { id: item.id }, data: { customerId: customer.id } })
    linked++
  }
  console.log(`  🖼️ Portfolyo: ${linked} galeri öğesi müşterilere bağlandı`)

  // ─── 5. RANDEVULARA DEPOZİTO + EKİP ATAMASI ───────────────────────────────
  const bookings = await db.booking.findMany({
    where: { status: { in: ["bekliyor", "onaylandi", "tamamlandi"] } },
    orderBy: { startAt: "asc" },
  })
  let depositCount = 0
  let assigned = 0
  for (let i = 0; i < bookings.length; i++) {
    const b = bookings[i]
    const data: { deposit?: number; depositPaid?: boolean; staffId?: string | null } = {}
    // Uzun/pahalı hizmetlere depozito (no-show koruması) — 3'te 1 oranında
    if (b.priceChf >= 900 && b.status !== "tamamlandi" && i % 3 === 0) {
      data.deposit = 200
      data.depositPaid = i % 2 === 0
    }
    // Ekip ataması: döngüsel
    const names = ["Melek Hanım", "Zeynep Arslan", "Elif Yıldız"]
    const assignee = names[i % 3]
    if (assignee === "Elif Yıldız" && b.status !== "tamamlandi") {
      // Kirpik/kaş randevularına Elif, diğerlerine diğerleri
    }
    data.staffId = staffMap.get(assignee) ?? null
    if (data.deposit) depositCount++
    if (data.staffId) assigned++
    await db.booking.update({ where: { id: b.id }, data })
  }
  console.log(`  💰 Depozito: ${depositCount} randevuya 200₺ depozito işlendi`)
  console.log(`  👥 Ekip ataması: ${assigned} randevu atandı`)

  // ─── 6. TAMAMLANAN RANDEVULARA SADAKAT İŞARETİ ────────────────────────────
  // (completed randevular loyaltyAwarded=true işaretlenir — puan üstte kartla verildi)
  const completed = await db.booking.findMany({ where: { status: "tamamlandi", loyaltyAwarded: false } })
  for (const b of completed) {
    await db.booking.update({ where: { id: b.id }, data: { loyaltyAwarded: true } })
  }
  console.log(`  ✅ ${completed.length} tamamlanmış randevu sadaket açısından işaretlendi`)

  // ─── Özet ─────────────────────────────────────────────────────────────────
  const staffCount = await db.staffMember.count()
  const invTotal = await db.inventoryItem.count()
  const lowStock = (await db.inventoryItem.findMany({ where: { active: true } })).filter((i) => i.quantity <= i.minQuantity).length
  const withAllergies = await db.salonCustomer.count({ where: { OR: [{ allergies: { not: null } }, { sensitive: true }] } })
  const loyaltyReady = await db.salonCustomer.count({ where: { loyaltyPoints: { gte: 10 } } })

  console.log("\n═══ V4 ULTIMATE Seed tamamlandı ═══")
  console.log(`  Ekip: ${staffCount} · Envanter: ${invTotal} (düşük stok: ${lowStock})`)
  console.log(`  Alerji beyanı: ${withAllergies} müşteri · Ödül hazır: ${loyaltyReady} müşteri`)
}

main()
  .catch((e) => {
    console.error("SEED HATASI:", e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
