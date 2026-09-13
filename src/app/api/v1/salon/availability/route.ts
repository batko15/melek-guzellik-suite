// GET /api/v1/salon/availability?date=YYYY-MM-DD
// Belirli bir gün için dolu randevu bloklarını döndürür (müşteri verisi YOK —
// yalnızca saat ve süre). Herkese açık randevu akışı için gizlilik güvenli.

import { db } from "@/lib/db"

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const dateStr = params.get("date")

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return Response.json({ error: "Geçerli bir tarih gerekli (YYYY-MM-DD)." }, { status: 400 })
  }

  const dayStart = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(dayStart.getTime())) {
    return Response.json({ error: "Geçersiz tarih." }, { status: 400 })
  }
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  try {
    const bookings = await db.booking.findMany({
      where: { startAt: { gte: dayStart, lt: dayEnd }, status: { in: ["bekliyor", "onaylandi"] } },
      select: { startAt: true, durationMin: true },
      orderBy: { startAt: "asc" },
    })

    return Response.json({
      date: dateStr,
      busy: bookings.map((b) => ({
        startAt: b.startAt.toISOString(),
        durationMin: b.durationMin,
      })),
    })
  } catch (e) {
    console.error("[GET availability]", e)
    return Response.json({ error: "Uygunluk bilgisi alınamadı." }, { status: 500 })
  }
}
