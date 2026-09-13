// GET /api/v1/salon/stats — Stüdyo KPI'ları (Ekip portalı) + yorum istatistikleri
// V5.7.1: SADECE ekip oturumu ile (istek başına tüm tabloyu çekmek yerine
// Prisma count/aggregate/groupBy kullanılır — bellek ve gecikme sabit kalır).
// Yanıt yapısı değişmedi: app-shell (60 sn poll) ve Genel Bakış aynı alanları okur.

import { db } from "@/lib/db"
import { requireStaff } from "@/lib/auth"
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

export async function GET(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  try {
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

    // 8 haftalık ciro penceresi (haftalık grafik + ay özeti buradan hesaplanır)
    const windowStart = new Date(weekStart)
    windowStart.setDate(windowStart.getDate() - 7 * 7)

    const [today, pending, weekAgg, windowRows, statusGroups, activeServices, allServices, customers, reviewGroups, reviewAvg, inventory, upcomingActive, reminderLogs, staffCount, loyaltyReady] = await Promise.all([
      // Bugünkü aktif randevular (liste — tek gün, sınırlı)
      db.booking.findMany({
        where: { startAt: { gte: todayStart, lt: todayEnd }, status: { in: ["bekliyor", "onaylandi"] } },
        include: { service: { select: { name: true } }, customer: { select: { name: true } } },
        orderBy: { startAt: "asc" },
      }),
      // Bekleyen talepler (gelecekteki)
      db.booking.count({ where: { status: "bekliyor", startAt: { gte: now } } }),
      // Hafta özeti: adet + süre + ciro tek aggregate'te
      db.booking.aggregate({
        where: { startAt: { gte: weekStart, lt: weekEnd }, status: { in: ["bekliyor", "onaylandi", "tamamlandi"] } },
        _count: true,
        _sum: { durationMin: true, priceChf: true },
      }),
      // 8 haftalık pencere (yalnızca gerekli alanlar — tüm tablo DEĞİL)
      db.booking.findMany({
        where: { startAt: { gte: windowStart, lt: weekEnd } },
        select: { startAt: true, priceChf: true, status: true },
      }),
      // Durum dağılımı (tüm zamanlar) — tek groupBy
      db.booking.groupBy({ by: ["status"], _count: true, _sum: { priceChf: true } }),
      // Aktif hizmet sayısı
      db.service.findMany({ where: { active: true }, select: { id: true } }),
      // topServices/kategori eşlemesi için hizmet ad/kategori tablosu
      db.service.findMany({ select: { id: true, name: true, category: true } }),
      db.salonCustomer.count(),
      // Yorum istatistikleri — groupBy + ortalama aggregate
      db.review.groupBy({ by: ["status"], _count: true }),
      db.review.aggregate({ where: { status: "onaylandi" }, _avg: { rating: true }, _count: true }),
      // V4: envanter (düşük stok)
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
      db.staffMember.count({ where: { active: true } }),
      // V4: 10+ sadakat puanı toplayan müşteri sayısı (ödül hazır)
      db.salonCustomer.count({ where: { loyaltyPoints: { gte: 10 } } }),
    ])

    // ── Haftalık doluluk: ayrılan dakika / gerçek kapasite ──
    const bookedMin = weekAgg._sum.durationMin ?? 0
    const capacityMin = weeklyCapacityMin()
    const utilization = capacityMin > 0 ? Math.min(100, Math.round((bookedMin / capacityMin) * 100)) : 0
    const weekRevenue = weekAgg._sum.priceChf ?? 0

    // ── Popüler hizmetler (tüm randevular, hizmet başına adet + hacim) ──
    const svcAgg = await db.booking.groupBy({
      by: ["serviceId"],
      _count: true,
      _sum: { priceChf: true },
    })
    const svcName = new Map(allServices.map((s) => [s.id, s]))
    const svcCount = new Map<string, { name: string; count: number; volume: number }>()
    for (const row of svcAgg) {
      const svc = svcName.get(row.serviceId)
      if (!svc) continue
      const cur = svcCount.get(svc.name) ?? { name: svc.name, count: 0, volume: 0 }
      cur.count += row._count
      cur.volume += row._sum.priceChf ?? 0
      svcCount.set(svc.name, cur)
    }
    const topServices = [...svcCount.values()].sort((a, b) => b.count - a.count).slice(0, 6)

    // ── Kategori dağılımı (tüm randevular) ──
    const catCount = new Map<string, number>()
    for (const row of svcAgg) {
      const svc = svcName.get(row.serviceId)
      if (!svc) continue
      catCount.set(svc.category, (catCount.get(svc.category) ?? 0) + row._count)
    }

    // ── Haftalık ciro (son 8 hafta) + ay özeti — pencere verisinden ──
    const revenueByWeek: Array<{ label: string; volume: number }> = []
    for (let w = 7; w >= 0; w--) {
      const ws = new Date(weekStart)
      ws.setDate(ws.getDate() - w * 7)
      const we = new Date(ws)
      we.setDate(we.getDate() + 7)
      const vol = windowRows
        .filter((b) => b.startAt >= ws && b.startAt < we && b.status !== "iptal")
        .reduce((s, b) => s + b.priceChf, 0)
      revenueByWeek.push({
        label: w === 0 ? "Bu hafta" : w === 1 ? "-1 hafta" : `-${w} hf.`,
        volume: Math.round(vol),
      })
    }

    // Bu ayın cirosu ve randevu sayısı
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthRows = windowRows.filter((b) => b.startAt >= monthStart && b.status !== "iptal")
    const monthRevenue = monthRows.reduce((s, b) => s + b.priceChf, 0)

    // ── Durum grupları (tüm zamanlar) ──
    const byStatus = new Map(statusGroups.map((g) => [g.status, g]))
    const totalBookings = statusGroups.reduce((s, g) => s + g._count, 0)
    const countOf = (status: string) => byStatus.get(status)?._count ?? 0

    // V4: envanter & hatırlatma KPI'ları
    const lowStock = inventory.filter((i) => i.quantity <= i.minQuantity).length
    const inventoryValue = Math.round(inventory.reduce((s, i) => s + i.quantity * i.unitCost, 0))
    const remindedIds = new Set(reminderLogs.map((l) => l.bookingId))
    const remindersDue = upcomingActive.filter((b) => !remindedIds.has(b.id)).length

    // Yorum istatistikleri
    const reviewByStatus = new Map(reviewGroups.map((g) => [g.status, g._count]))
    const approvedReviews = reviewByStatus.get("onaylandi") ?? 0
    const ratingAvg = reviewAvg._avg.rating ?? 0

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
      week: { bookings: weekAgg._count, revenueChf: Math.round(weekRevenue), utilization },
      month: { bookings: monthRows.length, revenueChf: Math.round(monthRevenue) },
      total: {
        bookings: totalBookings,
        completed: countOf("tamamlandi"),
        cancelled: countOf("iptal"),
        noShow: countOf("gelmedi"),
        customers,
        services: activeServices.length,
        revenueChf: Math.round(byStatus.get("tamamlandi")?._sum.priceChf ?? 0),
      },
      reviews: {
        total: [...reviewByStatus.values()].reduce((s, c) => s + c, 0),
        approved: approvedReviews,
        pending: reviewByStatus.get("bekliyor") ?? 0,
        average: Math.round(ratingAvg * 10) / 10,
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
  } catch (e) {
    console.error("[GET stats]", e)
    return Response.json({ error: "İstatistikler yüklenemedi." }, { status: 500 })
  }
}
