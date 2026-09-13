// GET /api/v1/salon/stats — Stüdyo KPI'ları (Ekip portalı) + yorum istatistikleri
import { db } from "@/lib/db"

export async function GET() {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  // Hafta (pazartesi tabanlı)
  const weekStart = new Date(todayStart)
  const dow = (weekStart.getDay() + 6) % 7 // Pzt=0 … Paz=6
  weekStart.setDate(weekStart.getDate() - dow)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const [today, pending, weekBookings, allBookings, services, customers, reviewRows] = await Promise.all([
    db.booking.findMany({
      where: { startAt: { gte: todayStart, lt: todayEnd }, status: { in: ["bekliyor", "onaylandi"] } },
      include: { service: { select: { name: true } }, customer: { select: { name: true } } },
      orderBy: { startAt: "asc" },
    }),
    db.booking.count({ where: { status: "bekliyor", startAt: { gte: now } } }),
    db.booking.findMany({
      where: { startAt: { gte: weekStart, lt: weekEnd }, status: { in: ["bekliyor", "onaylandi", "tamamlandi"] } },
      select: { startAt: true, durationMin: true, priceChf: true, serviceId: true },
    }),
    db.booking.findMany({
      include: { service: { select: { name: true, category: true } } },
      orderBy: { startAt: "desc" },
    }),
    db.service.findMany({ where: { active: true } }),
    db.salonCustomer.count(),
    db.review.findMany({ select: { rating: true, status: true } }),
  ])

  // Haftalık doluluk: ayrılan dakika / açık dakika (Sal–Cmt, 6 gün × 480 dk)
  const bookedMin = weekBookings.reduce((s, b) => s + b.durationMin, 0)
  const capacityMin = 6 * 8 * 60
  const utilization = Math.min(100, Math.round((bookedMin / capacityMin) * 100))

  const weekRevenue = weekBookings.reduce((s, b) => s + b.priceChf, 0)

  // Popüler hizmetler (randevu sayısına göre)
  const svcCount = new Map<string, { name: string; count: number; volume: number }>()
  for (const b of allBookings) {
    const key = b.service.name
    const cur = svcCount.get(key) ?? { name: key, count: 0, volume: 0 }
    cur.count += 1
    cur.volume += b.priceChf
    svcCount.set(key, cur)
  }
  const topServices = [...svcCount.values()].sort((a, b) => b.count - a.count).slice(0, 6)

  // Kategori dağılımı
  const catCount = new Map<string, number>()
  for (const b of allBookings) catCount.set(b.service.category, (catCount.get(b.service.category) ?? 0) + 1)

  // Haftalık ciro (son 8 hafta)
  const revenueByWeek: Array<{ label: string; volume: number }> = []
  for (let w = 7; w >= 0; w--) {
    const ws = new Date(weekStart)
    ws.setDate(ws.getDate() - w * 7)
    const we = new Date(ws)
    we.setDate(we.getDate() + 7)
    const vol = allBookings
      .filter((b) => b.startAt >= ws && b.startAt < we && b.status !== "iptal")
      .reduce((s, b) => s + b.priceChf, 0)
    revenueByWeek.push({
      label: w === 0 ? "Bu hafta" : w === 1 ? "-1 hafta" : `-${w} hf.`,
      volume: Math.round(vol),
    })
  }

  // Bu ayın cirosu ve randevu sayısı
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthBookings = allBookings.filter((b) => b.startAt >= monthStart && b.status !== "iptal")
  const monthRevenue = monthBookings.reduce((s, b) => s + b.priceChf, 0)

  // Yorum istatistikleri
  const approvedReviews = reviewRows.filter((r) => r.status === "onaylandi")
  const ratingAvg =
    approvedReviews.length > 0
      ? Math.round((approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length) * 10) / 10
      : 0

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
    month: { bookings: monthBookings.length, revenueChf: Math.round(monthRevenue) },
    total: {
      bookings: allBookings.length,
      completed: allBookings.filter((b) => b.status === "tamamlandi").length,
      cancelled: allBookings.filter((b) => b.status === "iptal").length,
      customers,
      services: services.length,
      revenueChf: Math.round(allBookings.filter((b) => b.status === "tamamlandi").reduce((s, b) => s + b.priceChf, 0)),
    },
    reviews: {
      total: reviewRows.length,
      approved: approvedReviews.length,
      pending: reviewRows.filter((r) => r.status === "bekliyor").length,
      average: ratingAvg,
    },
    topServices: topServices.map((s) => ({ name: s.name, count: s.count, volume: Math.round(s.volume) })),
    categories: [...catCount.entries()].map(([name, count]) => ({ name, count })),
    revenueByWeek,
  })
}
