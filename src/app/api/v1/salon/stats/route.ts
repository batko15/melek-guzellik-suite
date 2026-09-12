// GET /api/v1/salon/stats — Dashboard-KPIs (Team-Portal)
import { db } from "@/lib/db"

export async function GET() {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  // Woche (Montag-basiert)
  const weekStart = new Date(todayStart)
  const dow = (weekStart.getDay() + 6) % 7 // Mo=0 … So=6
  weekStart.setDate(weekStart.getDate() - dow)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const [today, pending, weekBookings, allBookings, services, customers] = await Promise.all([
    db.booking.findMany({
      where: { startAt: { gte: todayStart, lt: todayEnd }, status: { in: ["angefragt", "bestaetigt"] } },
      include: { service: { select: { name: true } }, customer: { select: { name: true } } },
      orderBy: { startAt: "asc" },
    }),
    db.booking.count({ where: { status: "angefragt", startAt: { gte: now } } }),
    db.booking.findMany({
      where: { startAt: { gte: weekStart, lt: weekEnd }, status: { in: ["angefragt", "bestaetigt", "abgeschlossen"] } },
      select: { startAt: true, durationMin: true, priceChf: true, serviceId: true },
    }),
    db.booking.findMany({
      include: { service: { select: { name: true, category: true } } },
      orderBy: { startAt: "desc" },
    }),
    db.service.findMany({ where: { active: true } }),
    db.salonCustomer.count(),
  ])

  // Wochen-Auslastung: gebuchte Minuten / Öffnungsminuten (Di–Sa, 6 Tage × 480 Min.)
  const bookedMin = weekBookings.reduce((s, b) => s + b.durationMin, 0)
  const capacityMin = 6 * 8 * 60
  const utilization = Math.min(100, Math.round((bookedMin / capacityMin) * 100))

  const weekRevenue = weekBookings.reduce((s, b) => s + b.priceChf, 0)

  // Top-Leistungen (nach Anzahl Buchungen)
  const svcCount = new Map<string, { name: string; count: number; volume: number }>()
  for (const b of allBookings) {
    const key = b.service.name
    const cur = svcCount.get(key) ?? { name: key, count: 0, volume: 0 }
    cur.count += 1
    cur.volume += b.priceChf
    svcCount.set(key, cur)
  }
  const topServices = [...svcCount.values()].sort((a, b) => b.count - a.count).slice(0, 6)

  // Kategorie-Verteilung
  const catCount = new Map<string, number>()
  for (const b of allBookings) catCount.set(b.service.category, (catCount.get(b.service.category) ?? 0) + 1)

  // Umsatz pro Woche (letzte 8 Wochen)
  const revenueByWeek: Array<{ label: string; volume: number }> = []
  for (let w = 7; w >= 0; w--) {
    const ws = new Date(weekStart)
    ws.setDate(ws.getDate() - w * 7)
    const we = new Date(ws)
    we.setDate(we.getDate() + 7)
    const vol = allBookings
      .filter((b) => b.startAt >= ws && b.startAt < we && b.status !== "storniert")
      .reduce((s, b) => s + b.priceChf, 0)
    revenueByWeek.push({
      label: w === 0 ? "Diese" : w === 1 ? "-1 Woche" : `-${w} Wo.`,
      volume: Math.round(vol),
    })
  }

  return Response.json({
    today: {
      count: today.length,
      bookings: today.map((b) => ({
        id: b.id,
        startAt: b.startAt.toISOString(),
        durationMin: b.durationMin,
        priceChf: b.priceChf,
        status: b.status,
        notes: b.notes,
        serviceName: b.service.name,
        customerName: b.customer.name,
      })),
    },
    pending,
    week: { bookings: weekBookings.length, revenueChf: Math.round(weekRevenue), utilization },
    total: {
      bookings: allBookings.length,
      completed: allBookings.filter((b) => b.status === "abgeschlossen").length,
      cancelled: allBookings.filter((b) => b.status === "storniert").length,
      customers,
      services: services.length,
      revenueChf: Math.round(allBookings.filter((b) => b.status === "abgeschlossen").reduce((s, b) => s + b.priceChf, 0)),
    },
    topServices: topServices.map((s) => ({ name: s.name, count: s.count, volume: Math.round(s.volume) })),
    categories: [...catCount.entries()].map(([name, count]) => ({ name, count })),
    revenueByWeek,
  })
}
