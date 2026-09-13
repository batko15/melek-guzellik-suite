// GET /api/v1/salon/stats — Stüdyo KPI'ları (Ekip portalı) + yorum istatistikleri
import { db } from "@/lib/db"
import { BRANDING } from "@/config/branding"

/** Açılış saatlerinden gerçek haftalık kapasite (dakika) — V3 düzeltmesi:
 *  sabit «6 gün × 8 sa» yerine branding.ts saatleri sayılır (örn. Cmt 09–16 = 7 sa). */
function weeklyCapacityMin(): number {
  let total = 0
  for (const h of BRANDING.openingHours) {
    if (h.closed) continue
    const m = h.hours.match(/(\d{2}):(\d{2})\s*[–-]\s*(\d{2}):(\d{2})/)
    if (!m) continue
    const start = Number(m[1]) * 60 + Number(m[2])
    const end = Number(m[3]) * 60 + Number(m[4])
    if (end > start) total += end - start
  }
  return total
}

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

  const [today, pending, weekBookings, allBookings, services, customers, reviewRows, inventory, upcomingActive, reminderLogs] = await Promise.all([
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
    // V4: envanter (düşük stok) + ekip
    db.inventoryItem.findMany({ where: { active: true }, select: { quantity: true, minQuantity: true, unitCost: true } }),
    // V4: önümüzdeki 48 saatteki aktif randevular (hatırlatma kuyruğu)
    db.booking.findMany({
      where: {
        startAt: { gte: now, lt: new Date(now.getTime() + 48 * 3600 * 1000) },
        status: { in: ["bekliyor", "onaylandi"] },
      },
      select: { id: true },
    }),
    db.notificationLog.findMany({
      where: { kind: "hatirlatma", createdAt: { gte: new Date(now.getTime() - 14 * 24 * 3600 * 1000) } },
      select: { bookingId: true },
    }),
  ])

  const staffCount = await db.staffMember.count({ where: { active: true } })
  // V4: 10+ sadakat puanı toplayan müşteri sayısı (ödül hazır)
  const loyaltyReady = await db.salonCustomer.count({ where: { loyaltyPoints: { gte: 10 } } })

  // Haftalık doluluk: ayrılan dakika / gerçek kapasite (açılış saatlerinden)
  const bookedMin = weekBookings.reduce((s, b) => s + b.durationMin, 0)
  const capacityMin = weeklyCapacityMin()
  const utilization = capacityMin > 0 ? Math.min(100, Math.round((bookedMin / capacityMin) * 100)) : 0

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

  // V4: envanter & hatırlatma KPI'ları
  const lowStock = inventory.filter((i) => i.quantity <= i.minQuantity).length
  const inventoryValue = Math.round(inventory.reduce((s, i) => s + i.quantity * i.unitCost, 0))
  const remindedIds = new Set(reminderLogs.map((l) => l.bookingId))
  const remindersDue = upcomingActive.filter((b) => !remindedIds.has(b.id)).length

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
      noShow: allBookings.filter((b) => b.status === "gelmedi").length,
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
    // V4 ULTIMATE KPI'ları
    v4: {
      lowStock,
      inventoryValue,
      remindersDue,
      staffCount,
      loyaltyReady,
    },
    topServices: topServices.map((s) => ({ name: s.name, count: s.count, volume: Math.round(s.volume) })),
    categories: [...catCount.entries()].map(([name, count]) => ({ name, count })),
    revenueByWeek,
  })
}
