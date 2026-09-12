// Seed für die Melek'ce Güzellik Beauty & Nail Suite
// Leistungen (CHF-Preise), Kundinnen, Buchungen (2 Wochen) + Galerie

import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

// ─── Leistungen ─────────────────────────────────────────────────────────────
const SERVICES = [
  // Nägel
  { name: "Gel-Maniküre", category: "naegel", description: "Grundpflege mit hochwertigem Gel-Lack in Wunschfarbe", durationMin: 75, priceChf: 65, popular: true, sortOrder: 1 },
  { name: "Gel-Verlängerung", category: "naegel", description: "Verlängerung mit Gel in gewünschter Form & Länge", durationMin: 120, priceChf: 110, popular: true, sortOrder: 2 },
  { name: "Auffüllung (Refill)", category: "naegel", description: "Nachwachsen auffüllen und neu versiegeln", durationMin: 90, priceChf: 85, sortOrder: 3 },
  { name: "Nageldesign fancy", category: "naegel", description: "Individuelles Design mit Folie, Steinen & Glitzer", durationMin: 45, priceChf: 40, sortOrder: 4 },
  { name: "French-Maniküre", category: "naegel", description: "Klassiker mit weissen Spitzen in Perfektion", durationMin: 30, priceChf: 25, sortOrder: 5 },
  { name: "Shellac / Permanent-Lack", category: "naegel", description: "Langanhaltender Farbglanz bis zu 4 Wochen", durationMin: 45, priceChf: 50, popular: true, sortOrder: 6 },
  { name: "Maniküre klassisch", category: "naegel", description: "Nagelhautpflege, Feilen, Lack nach Wunsch", durationMin: 40, priceChf: 35, sortOrder: 7 },
  { name: "Pediküre Deluxe", category: "naegel", description: "Verwöhnende Fußpflege mit Peeling & Massage", durationMin: 60, priceChf: 70, sortOrder: 8 },

  // Beauty
  { name: "Brauen-Shaping", category: "beauty", description: "Präzises Zupfen & Styling für perfekte Brauen", durationMin: 20, priceChf: 25, popular: true, sortOrder: 10 },
  { name: "Brauen & Wimpern-Färben", category: "beauty", description: "Sanfte Tönung für ausdrucksstarke Augen", durationMin: 30, priceChf: 35, sortOrder: 11 },
  { name: "Gesichtsbehandlung Deluxe", category: "beauty", description: "Reinigung, Peeling, Maske & Pflege-Massage", durationMin: 60, priceChf: 90, popular: true, sortOrder: 12 },
  { name: "Augenbrauen-Threading", category: "beauty", description: "Traditionelle, besonders sanfte Haarentfernung", durationMin: 20, priceChf: 30, sortOrder: 13 },
  { name: "Henna-Brauen", category: "beauty", description: "Natürliche Henna-Tönung für vollere Brauen", durationMin: 40, priceChf: 45, sortOrder: 14 },

  // Wimpern
  { name: "Wimpernverlängerung 1:1", category: "wimpern", description: "Klassische Verlängerung, ein Haar pro Wimper", durationMin: 90, priceChf: 120, popular: true, sortOrder: 20 },
  { name: "Wimpernverlängerung Volume", category: "wimpern", description: "Russian Volume für maximalen Wow-Effekt", durationMin: 120, priceChf: 150, sortOrder: 21 },
  { name: "Wimpern-Auffüllung", category: "wimpern", description: "Auffüllen nach 2–3 Wochen", durationMin: 60, priceChf: 70, sortOrder: 22 },
  { name: "Lash-Lift inkl. Färben", category: "wimpern", description: "Natürliche Wimpern perfekt geschwungen", durationMin: 45, priceChf: 75, sortOrder: 23 },
]

// ─── Kundinnen ──────────────────────────────────────────────────────────────
const CUSTOMERS = [
  { name: "Elif Yilmaz", email: "elif.yilmaz@example.ch", phone: "+41 79 234 56 78", notes: "Liebt Gold-Glitzer-Design, Allergie auf Acrylat → Gel verwenden" },
  { name: "Sarah Meier", email: "sarah.meier@example.ch", phone: "+41 76 123 45 67", notes: "Bevorzugt French-Maniküre, kommt alle 3 Wochen" },
  { name: "Ayse Kaya", email: "ayse.kaya@example.ch", phone: "+41 78 987 65 43", notes: "Volume-Wimpern-Stammkundin" },
  { name: "Lena Weber", email: "lena.weber@example.ch", phone: "+41 77 555 12 34", notes: null },
  { name: "Fatma Demir", email: "fatma.demir@example.ch", phone: "+41 79 111 22 33", notes: "Immer Samstagvormittag" },
  { name: "Nicole Brunner", email: "nicole.brunner@example.ch", phone: "+41 76 444 88 99", notes: "Brauen-Shaping + Färben regelmäßig" },
  { name: "Zeynep Arslan", email: "zeynep.arslan@example.ch", phone: "+41 78 222 33 44", notes: "Nagelbeisserin → kurze Formen" },
  { name: "Melanie Keller", email: "melanie.keller@example.ch", phone: "+41 79 666 77 88", notes: null },
]

// ─── Galerie ────────────────────────────────────────────────────────────────
const GALLERY = [
  { title: "Champagner-Gold", category: "naegel", imagePath: "/gallery/hero.png", sortOrder: 1 },
  { title: "French Klassik", category: "naegel", imagePath: "/gallery/nails-french.png", sortOrder: 2 },
  { title: "Gold Baroque", category: "naegel", imagePath: "/gallery/nails-gold.png", sortOrder: 3 },
  { title: "Nude Ombre", category: "naegel", imagePath: "/gallery/nails-nude.png", sortOrder: 4 },
  { title: "Wimpern-Wow", category: "wimpern", imagePath: "/gallery/beauty-lashes.png", sortOrder: 5 },
  { title: "Beauty-Deluxe", category: "beauty", imagePath: "/gallery/beauty-spa.png", sortOrder: 6 },
  { title: "Unser Studio", category: "studio", imagePath: "/gallery/salon-interior.png", sortOrder: 7 },
]

async function main() {
  console.log("Seed: Melek'ce Güzellik Suite …")

  // Leistungen
  for (const s of SERVICES) {
    await db.service.upsert({ where: { id: `svc_${s.sortOrder}` }, update: {}, create: { id: `svc_${s.sortOrder}`, ...s } })
  }

  // Kundinnen
  for (let i = 0; i < CUSTOMERS.length; i++) {
    const c = CUSTOMERS[i]
    await db.salonCustomer.upsert({ where: { email: c.email }, update: {}, create: { id: `cus_${i + 1}`, ...c } })
  }

  // Galerie
  if ((await db.galleryItem.count()) === 0) {
    for (const g of GALLERY) {
      await db.galleryItem.create({ data: g })
    }
  }

  // Buchungen: vergangene + nächste 2 Wochen realistisch verteilt
  if ((await db.booking.count()) === 0) {
    const svc = await db.service.findMany()
    const cus = await db.salonCustomer.findMany()
    const byName = (n: string) => svc.find((s) => s.name === n)!
    const byEmail = (e: string) => cus.find((c) => c.email === e)!

    const day = (offset: number, hour: number, min = 0) => {
      const d = new Date()
      d.setDate(d.getDate() + offset)
      d.setHours(hour, min, 0, 0)
      return d
    }

    // Vergangenheit (abgeschlossen)
    const past: Array<[number, number, number, string, string, string, string]> = [
      [-14, 10, 0, "elif.yilmaz@example.ch", "Gel-Verlängerung", "abgeschlossen", "Gold-Glitzer-Akzente"],
      [-12, 14, 30, "sarah.meier@example.ch", "French-Maniküre", "abgeschlossen", null as unknown as string],
      [-10, 9, 0, "ayse.kaya@example.ch", "Wimpernverlängerung Volume", "abgeschlossen", "2D-Effekt"],
      [-7, 11, 0, "nicole.brunner@example.ch", "Brauen-Shaping", "abgeschlossen", null as unknown as string],
      [-5, 15, 0, "fatma.demir@example.ch", "Pediküre Deluxe", "abgeschlossen", "mit Peeling"],
      [-3, 13, 0, "zeynep.arslan@example.ch", "Auffüllung (Refill)", "abgeschlossen", "kurze Form"],
    ]
    for (const [off, h, m, email, svcName, status, notes] of past) {
      const s = byName(svcName)
      await db.booking.create({
        data: {
          customerId: byEmail(email).id, serviceId: s.id,
          startAt: day(off, h, m), durationMin: s.durationMin, priceChf: s.priceChf,
          status, notes,
        },
      })
    }

    // Heute
    await db.booking.create({ data: { customerId: byEmail("elif.yilmaz@example.ch").id, serviceId: byName("Shellac / Permanent-Lack").id, startAt: day(0, 10, 0), durationMin: 45, priceChf: 50, status: "bestaetigt", notes: "Nude mit Gold-Studs" } })
    await db.booking.create({ data: { customerId: byEmail("sarah.meier@example.ch").id, serviceId: byName("Gel-Maniküre").id, startAt: day(0, 14, 0), durationMin: 75, priceChf: 65, status: "bestaetigt", notes: null as unknown as string } })

    // Anfragen (offen)
    await db.booking.create({ data: { customerId: byEmail("melanie.keller@example.ch").id, serviceId: byName("Wimpernverlängerung 1:1").id, startAt: day(1, 9, 30), durationMin: 90, priceChf: 120, status: "angefragt", notes: "Erste Verlängerung — Beratung gewünscht" } })
    await db.booking.create({ data: { customerId: byEmail("lena.weber@example.ch").id, serviceId: byName("Nageldesign fancy").id, startAt: day(2, 16, 0), durationMin: 45, priceChf: 40, status: "angefragt", notes: "Herz-Design zum Geburtstag" } })

    // Nächste Woche
    await db.booking.create({ data: { customerId: byEmail("ayse.kaya@example.ch").id, serviceId: byName("Wimpern-Auffüllung").id, startAt: day(3, 10, 0), durationMin: 60, priceChf: 70, status: "bestaetigt", notes: null as unknown as string } })
    await db.booking.create({ data: { customerId: byEmail("fatma.demir@example.ch").id, serviceId: byName("Gesichtsbehandlung Deluxe").id, startAt: day(4, 11, 0), durationMin: 60, priceChf: 90, status: "bestaetigt", notes: "Empfindliche Haut" } })
    await db.booking.create({ data: { customerId: byEmail("nicole.brunner@example.ch").id, serviceId: byName("Brauen & Wimpern-Färben").id, startAt: day(5, 9, 0), durationMin: 30, priceChf: 35, status: "bestaetigt", notes: null as unknown as string } })
    await db.booking.create({ data: { customerId: byEmail("zeynep.arslan@example.ch").id, serviceId: byName("Gel-Verlängerung").id, startAt: day(6, 14, 0), durationMin: 120, priceChf: 110, status: "angefragt", notes: "Ballernagel-Form" } })
    await db.booking.create({ data: { customerId: byEmail("elif.yilmaz@example.ch").id, serviceId: byName("Nageldesign fancy").id, startAt: day(8, 15, 30), durationMin: 45, priceChf: 40, status: "bestaetigt", notes: "Golden Glitter" } })
    await db.booking.create({ data: { customerId: byEmail("sarah.meier@example.ch").id, serviceId: byName("Auffüllung (Refill)").id, startAt: day(9, 13, 0), durationMin: 90, priceChf: 85, status: "bestaetigt", notes: null as unknown as string } })
    await db.booking.create({ data: { customerId: byEmail("melanie.keller@example.ch").id, serviceId: byName("Lash-Lift inkl. Färben").id, startAt: day(10, 10, 30), durationMin: 45, priceChf: 75, status: "angefragt", notes: null as unknown as string } })
    await db.booking.create({ data: { customerId: byEmail("lena.weber@example.ch").id, serviceId: byName("Maniküre klassisch").id, startAt: day(11, 16, 30), durationMin: 40, priceChf: 35, status: "bestaetigt", notes: null as unknown as string } })

    // Storniert (Beispiel)
    await db.booking.create({ data: { customerId: byEmail("zeynep.arslan@example.ch").id, serviceId: byName("Pediküre Deluxe").id, startAt: day(-1, 15, 0), durationMin: 60, priceChf: 70, status: "storniert", notes: "Krankheit — verschoben" } })
  }

  console.log(`Seed OK: ${(await db.service.count())} Leistungen, ${(await db.salonCustomer.count())} Kundinnen, ${(await db.booking.count())} Buchungen, ${(await db.galleryItem.count())} Galerie-Einträge`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
