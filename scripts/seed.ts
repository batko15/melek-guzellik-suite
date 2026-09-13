// ALIEN 1 — Parser & DB-Seed: importiert partners.json (aus Excel) + vehicles.json
// Usage: bun scripts/seed.ts
import { PrismaClient } from "@prisma/client"
import { readFileSync } from "fs"
import { plzToCoords } from "../src/lib/geo"
import { calcQuote, WARRANTY_OPTIONS, PRICE_LIST_2026 } from "../src/lib/pricing"
import { buildFollowupDates } from "../src/lib/followups"

const db = new PrismaClient()

interface PartnerRow {
  company: string; brands: string[]; primaryBrand: string; contactPerson: string
  street: string; zip: string; city: string; canton: string; country: string
  phone: string; email: string; website: string; priority: string
  capacityVehiclesPerMonth: number
}
interface VehicleRow {
  brand: string; model: string; engine: string; fuel: string; euroNorm: string
  years: string; hpOrig: number; nmOrig: number; hpTuned: number; nmTuned: number
  fuelSaving: number; price?: number; priceChf?: number; productCode: string; installMin: number
}

async function main() {
  console.log("🌱 Seed startet …")

  // Tabellen leeren (idempotent)
  await db.workshopOrder.deleteMany()
  await db.invoice.deleteMany()
  await db.appointment.deleteMany()
  await db.followupTask.deleteMany()
  await db.quote.deleteMany()
  await db.partner.deleteMany()
  await db.vehicle.deleteMany()

  // ─── Fahrzeuge importieren ───────────────────────────────────────────────
  const vehiclesRaw = JSON.parse(readFileSync("/home/z/my-project/data/vehicles.json", "utf-8")) as VehicleRow[]
  for (const v of vehiclesRaw) {
    const { price, ...rest } = v
    await db.vehicle.create({ data: { ...rest, priceChf: price ?? rest.priceChf ?? 990 } })
  }
  console.log(`✅ ${vehiclesRaw.length} Fahrzeuge importiert`)

  // ─── Markenhäuser importieren (aus Excel geparst) ────────────────────────
  const partnersRaw = JSON.parse(readFileSync("/home/z/my-project/data/partners.json", "utf-8")) as PartnerRow[]
  let unmapped = new Set<string>()
  for (const p of partnersRaw) {
    const c = plzToCoords(p.zip, p.canton)
    unmapped.add(p.zip.slice(0, 2))
    await db.partner.create({
      data: {
        company: p.company,
        brands: p.brands.join(", "),
        primaryBrand: p.primaryBrand,
        contactPerson: p.contactPerson || null,
        street: p.street || null,
        zip: p.zip,
        city: p.city,
        canton: p.canton,
        country: p.country,
        phone: p.phone || null,
        email: p.email || null,
        website: p.website || null,
        priority: p.priority,
        capacityVehiclesPerMonth: p.capacityVehiclesPerMonth,
        lat: c.lat,
        lng: c.lng,
      },
    })
  }
  console.log(`✅ ${partnersRaw.length} Markenhäuser importiert (PLZ-Zonen: ${unmapped.size})`)

  // ─── Demo-Offerten für aussagekräftiges Dashboard ────────────────────────
  const allVehicles = await db.vehicle.findMany()
  const allPartners = await db.partner.findMany({ where: { priority: "A" } })
  const demo: Array<{
    name: string; email: string; zip: string; city: string; daysAgo: number
    brand: string; warranty: keyof typeof WARRANTY_OPTIONS; install: "self" | "partner"
    channel: "b2c" | "b2b"; status: string
  }> = [
    { name: "Peter Rosselet", email: "p.rosselet@example.ch", zip: "8052", city: "Zürich", daysAgo: 26, brand: "Subaru", warranty: "none", install: "self", channel: "b2c", status: "won" },
    { name: "Marco Bächli", email: "buero@auto-zimmerli.com", zip: "5102", city: "Rupperswil", daysAgo: 22, brand: "Toyota", warranty: "none", install: "self", channel: "b2b", status: "won" },
    { name: "Sandra Keller", email: "s.keller@example.ch", zip: "6004", city: "Luzern", daysAgo: 19, brand: "Peugeot", warranty: "z3", install: "partner", channel: "b2c", status: "won" },
    { name: "Roger Weiss", email: "info@automobileweiss.ch", zip: "5085", city: "Sulz", daysAgo: 17, brand: "Toyota", warranty: "none", install: "self", channel: "b2b", status: "won" },
    { name: "Thomas Frei", email: "t.frei@example.ch", zip: "8400", city: "Winterthur", daysAgo: 14, brand: "Opel", warranty: "z5", install: "partner", channel: "b2c", status: "versendet" },
    { name: "Roman Faes", email: "info@garagefaes.ch", zip: "5727", city: "Oberkulm", daysAgo: 12, brand: "DS", warranty: "none", install: "self", channel: "b2b", status: "versendet" },
    { name: "Claudia Brunner", email: "c.brunner@example.ch", zip: "3005", city: "Bern", daysAgo: 9, brand: "Citroën", warranty: "z3", install: "partner", channel: "b2c", status: "fassbar" },
    { name: "Markus Dubler", email: "info@garagedubler.ch", zip: "5610", city: "Wohlen", daysAgo: 8, brand: "Toyota", warranty: "none", install: "self", channel: "b2b", status: "fassbar" },
    { name: "Andrea Zbinden", email: "a.zbinden@example.ch", zip: "4800", city: "Zofingen", daysAgo: 6, brand: "Fiat", warranty: "none", install: "self", channel: "b2c", status: "erstellt" },
    { name: "Luca Conti", email: "l.conti@example.ch", zip: "6900", city: "Lugano", daysAgo: 5, brand: "Peugeot", warranty: "z3", install: "partner", channel: "b2c", status: "versendet" },
    { name: "Peter Kohler", email: "autogaragekohler@bluewin.ch", zip: "5507", city: "Mellingen", daysAgo: 3, brand: "Toyota", warranty: "none", install: "self", channel: "b2b", status: "erstellt" },
    { name: "Nicola Portmann", email: "n.portmann@example.ch", zip: "9000", city: "St. Gallen", daysAgo: 2, brand: "Opel", warranty: "z5", install: "partner", channel: "b2c", status: "erstellt" },
    { name: "Fabio Meier", email: "f.meier@example.ch", zip: "4058", city: "Basel", daysAgo: 1, brand: "Citroën", warranty: "none", install: "self", channel: "b2c", status: "erstellt" },
    { name: "Martin Aebi", email: "info@aebi-auto.ch", zip: "3250", city: "Lyss", daysAgo: 28, brand: "Citroën", warranty: "none", install: "self", channel: "b2b", status: "lost" },
  ]

  let ref = 14571
  let custNo = 10901
  for (const d of demo) {
    const vehicle = allVehicles.find(v => v.brand === d.brand) ?? allVehicles[0]
    // Routing: nächstgelegenes A-Prioritäts-Markenhaus gleicher Marke
    const partner = d.install === "partner"
      ? (allPartners.filter(p => p.brands.includes(d.brand)).sort((a, b) =>
          Math.abs(Number(a.zip) - Number(d.zip)) - Math.abs(Number(b.zip) - Number(d.zip)))[0] ?? null)
      : null

    const totals = calcQuote({
      vehicle, warranty: d.warranty, install: d.install, channel: d.channel,
    })

    const createdAt = new Date(Date.now() - d.daysAgo * 86400000)
    const quote = await db.quote.create({
      data: {
        refNumber: ref++, customerNumber: custNo++,
        customerName: d.name, customerEmail: d.email,
        customerZip: d.zip, customerCity: d.city,
        vehicleId: vehicle.id,
        itemsJson: JSON.stringify(totals.items),
        basePrice: totals.basePrice, warrantyPrice: totals.warrantyPrice,
        installPrice: totals.installPrice, shipping: totals.shipping,
        subtotal: totals.subtotal, vatAmount: totals.vatAmount, total: totals.total,
        installMode: d.install, partnerId: partner?.id ?? null,
        channel: d.channel, status: d.status,
        createdAt,
      },
    })

    // Follow-ups gem. Tag 1/3/7-Sequenz — ältere automatisch als erledigt markiert
    for (const f of buildFollowupDates(createdAt)) {
      const overdue = f.dueAt.getTime() < Date.now()
      await db.followupTask.create({
        data: {
          quoteId: quote.id, dayOffset: f.dayOffset, dueAt: f.dueAt,
          action: `Tag ${f.dayOffset}: ${d.channel === "b2b" ? "B2B" : "B2C"}-Follow-up`,
          done: d.status === "won" || (overdue && d.daysAgo > f.dayOffset + 2 && d.status !== "lost" ? true : d.status === "lost"),
          doneAt: d.status === "won" ? f.dueAt : null,
        },
      })
    }
  }
  console.log(`✅ ${demo.length} Demo-Offerten mit Follow-up-Sequenz (Tag 1/3/7) erstellt`)

  // ─── Termine: Testfahrten · Einbautermine · Beratung (aktuelle + nächste Woche) ─
  const wonQuotes = await db.quote.findMany({ where: { status: "won" }, include: { vehicle: true, partner: true } })
  const openQuotes = await db.quote.findMany({ where: { status: { in: ["erstellt", "versendet", "fassbar"] } }, include: { vehicle: true, partner: true } })

  // Wochenstart (Montag) berechnen
  const weekStart = new Date()
  const dow = (weekStart.getDay() + 6) % 7 // 0 = Montag
  weekStart.setDate(weekStart.getDate() - dow)
  weekStart.setHours(0, 0, 0, 0)
  const at = (dayIdx: number, hour: number, min = 0) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + dayIdx)
    d.setHours(hour, min, 0, 0)
    return d
  }

  const appointmentRows: Array<{
    title: string; type: string; dayIdx: number; hour: number; min?: number
    durationMin: number; status: string; customerName: string; customerEmail?: string
    customerPhone?: string; quoteIdx: number; location: string; notes?: string
  }> = [
    { title: "Testfahrt Corolla Hybrid", type: "testfahrt", dayIdx: 0, hour: 9, durationMin: 90, status: "bestaetigt", customerName: "Andrea Zbinden", customerEmail: "a.zbinden@example.ch", customerPhone: "+41 79 123 45 67", quoteIdx: 0, location: "Neuenhof", notes: "Fahrzeug bereitstellen — LET26 Demo-Gerät installiert" },
    { title: "Beratungsgespräch B2B", type: "beratung", dayIdx: 0, hour: 14, durationMin: 60, status: "geplant", customerName: "Peter Kohler", customerEmail: "autogaragekohler@bluewin.ch", quoteIdx: 1, location: "Telefonisch", notes: "Rahmenvertrag über 6 Fahrzeuge besprechen" },
    { title: "Einbau LET26 — Astra", type: "einbau", dayIdx: 1, hour: 8, durationMin: 120, status: "bestaetigt", customerName: "Sandra Keller", customerEmail: "s.keller@example.ch", quoteIdx: 2, location: "Partner-Garage", notes: "Einbau bei Garage Kunz AG — Werkstatt-Auftrag WS-2026-0001" },
    { title: "Testfahrt nach Einbau", type: "testfahrt", dayIdx: 1, hour: 13, durationMin: 60, status: "geplant", customerName: "Sandra Keller", customerEmail: "s.keller@example.ch", quoteIdx: 2, location: "Partner-Garage", notes: "Qualitätskontrolle nach Einbau — Kunden-Erlebnis sichern" },
    { title: "Follow-up Telefonat Tag 3", type: "followup", dayIdx: 2, hour: 10, durationMin: 30, status: "geplant", customerName: "Fabio Meier", customerEmail: "f.meier@example.ch", quoteIdx: 3, location: "Telefonisch", notes: "Angebot besprechen — Skript Tag 3 aus Leitfaden" },
    { title: "Beratung Garage Dubler", type: "beratung", dayIdx: 2, hour: 15, durationMin: 90, status: "bestaetigt", customerName: "Markus Dubler", customerEmail: "info@garagedubler.ch", quoteIdx: 4, location: "Neuenhof", notes: "B2B-Mehrfachbestellung — Mengenrabatt klären" },
    { title: "Einbau LET26 — 3008", type: "einbau", dayIdx: 3, hour: 9, durationMin: 120, status: "geplant", customerName: "Luca Conti", customerEmail: "l.conti@example.ch", quoteIdx: 5, location: "Partner-Garage" },
    { title: "Testfahrt Opel Grandland", type: "testfahrt", dayIdx: 4, hour: 10, durationMin: 90, status: "geplant", customerName: "Nicola Portmann", customerEmail: "n.portmann@example.ch", quoteIdx: 6, location: "Neuenhof" },
    { title: "Follow-up Tag 7 — Abschluss", type: "followup", dayIdx: 4, hour: 14, durationMin: 30, status: "geplant", customerName: "Thomas Frei", customerEmail: "t.frei@example.ch", quoteIdx: 7, location: "Telefonisch", notes: "Entscheidung einholen — Skript Tag 7" },
    // Nächste Woche
    { title: "B2B-Präsentation Flotte", type: "beratung", dayIdx: 7, hour: 10, durationMin: 120, status: "geplant", customerName: "Marco Bächli", customerEmail: "buero@auto-zimmerli.com", quoteIdx: 8, location: "Partner-Garage", notes: "Flottenlösung für 4 Fahrzeuge vorstellen" },
    { title: "Einbau LET26 — Corolla", type: "einbau", dayIdx: 8, hour: 8, durationMin: 90, status: "geplant", customerName: "Peter Rosselet", customerEmail: "p.rosselet@example.ch", quoteIdx: 9, location: "Neuenhof" },
    { title: "Testfahrt C4 Hybrid", type: "testfahrt", dayIdx: 9, hour: 11, durationMin: 60, status: "geplant", customerName: "Claudia Brunner", customerEmail: "c.brunner@example.ch", quoteIdx: 10, location: "Neuenhof" },
  ]

  for (const a of appointmentRows) {
    const q = openQuotes[a.quoteIdx % openQuotes.length] ?? wonQuotes[0]
    await db.appointment.create({
      data: {
        title: a.title, type: a.type, startAt: at(a.dayIdx, a.hour, a.min ?? 0),
        durationMin: a.durationMin, status: a.status,
        customerName: a.customerName, customerEmail: a.customerEmail ?? null,
        customerPhone: a.customerPhone ?? null,
        vehicleId: q?.vehicleId ?? null, quoteId: q?.id ?? null,
        partnerId: q?.partnerId ?? null,
        location: a.location, notes: a.notes ?? null,
      },
    })
  }
  console.log(`✅ ${appointmentRows.length} Termine (Testfahrten · Einbautermine · Beratung) erstellt`)

  // ─── Rechnungen aus gewonnenen Offerten (Offerte→Rechnung-Workflow) ──────
  for (let i = 0; i < wonQuotes.length; i++) {
    const q = wonQuotes[i]
    const issuedAt = new Date(q.createdAt.getTime() + 3 * 86400000)
    const dueAt = new Date(issuedAt.getTime() + 30 * 86400000)
    // Status-Mix: 2 bezahlt, 1 überfällig, 1 offen
    let status = "offen"
    let paidAt: Date | null = null
    if (i < 2) { status = "bezahlt"; paidAt = new Date(issuedAt.getTime() + (i === 0 ? 5 : 12) * 86400000) }
    else if (i === 2) { status = "ueberfaellig" }
    await db.invoice.create({
      data: {
        invoiceNumber: `RE-2026-${String(i + 1).padStart(4, "0")}`,
        quoteId: q.id, customerName: q.customerName, customerEmail: q.customerEmail,
        customerZip: q.customerZip, customerCity: q.customerCity,
        vehicleId: q.vehicleId,
        subtotal: q.subtotal, vatAmount: q.vatAmount, total: q.total,
        status, paidAt, issuedAt, dueAt,
      },
    })
  }
  console.log(`✅ ${wonQuotes.length} Rechnungen aus gewonnenen Offerten erstellt (bezahlt/offen/überfällig)`)

  // ─── Werkstatt-Aufträge (Einbau-Workflow) ────────────────────────────────
  const workshopRows: Array<{ idx: number; status: string; dayOffset: number; progress: number; mechanic: string | null; notes?: string }> = [
    { idx: 0, status: "abgeschlossen", dayOffset: -6, progress: 100, mechanic: "Mischa Huser", notes: "Einbau + Testfahrt erfolgreich — Kunde zufrieden" },
    { idx: 1, status: "abgeschlossen", dayOffset: -4, progress: 100, mechanic: "Ümit Sapmaz" },
    { idx: 2, status: "qualitaet", dayOffset: 0, progress: 85, mechanic: "Mischa Huser", notes: "Qualitätskontrolle + Gutachten-Ausdruck ausstehend" },
    { idx: 3, status: "in_arbeit", dayOffset: 0, progress: 45, mechanic: "Ümit Sapmaz", notes: "Fahrzeug auf Bühne — OBD-Anbindung läuft" },
    { idx: 4, status: "geplant", dayOffset: 2, progress: 0, mechanic: null, notes: "Ersatzteil bestellt — Termin mit Kunde bestätigt" },
    { idx: 5, status: "geplant", dayOffset: 4, progress: 0, mechanic: null },
  ]
  for (let i = 0; i < workshopRows.length; i++) {
    const w = workshopRows[i]
    const q = wonQuotes[i % wonQuotes.length] ?? openQuotes[0]
    const scheduledAt = new Date(Date.now() + w.dayOffset * 86400000)
    scheduledAt.setHours(8 + (i % 4), 0, 0, 0)
    await db.workshopOrder.create({
      data: {
        orderNumber: `WS-2026-${String(i + 1).padStart(4, "0")}`,
        quoteId: q?.id ?? null, vehicleId: q?.vehicleId ?? null, partnerId: q?.partnerId ?? null,
        customerName: q?.customerName ?? "Demo-Kunde",
        customerPhone: "+41 79 555 12 34",
        status: w.status, mechanic: w.mechanic, scheduledAt,
        installMin: q?.vehicle?.installMin ?? 90,
        progress: w.progress, notes: w.notes ?? null,
      },
    })
  }
  console.log(`✅ ${workshopRows.length} Werkstatt-Aufträge erstellt (Geplant → In Arbeit → QS → Abgeschlossen)`)
  console.log("🏁 Seed abgeschlossen")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
