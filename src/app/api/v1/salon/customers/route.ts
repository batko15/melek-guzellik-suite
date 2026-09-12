// GET /api/v1/salon/customers — Kundinnen mit Statistik (Team-Portal)
import { db } from "@/lib/db"

export async function GET() {
  const customers = await db.salonCustomer.findMany({
    include: {
      bookings: {
        select: { startAt: true, priceChf: true, status: true },
        orderBy: { startAt: "desc" },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  const now = new Date()
  const rows = customers.map((c) => {
    const completed = c.bookings.filter((b) => b.status === "abgeschlossen")
    const upcoming = c.bookings.filter((b) => new Date(b.startAt) >= now && b.status !== "storniert")
    const volume = completed.reduce((sum, b) => sum + b.priceChf, 0)
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      notes: c.notes,
      totalBookings: c.bookings.length,
      completedBookings: completed.length,
      upcomingBookings: upcoming.length,
      volumeChf: Math.round(volume * 100) / 100,
      lastVisit: completed[0]?.startAt?.toISOString() ?? null,
      since: c.createdAt.toISOString(),
    }
  })

  return Response.json({ customers: rows, count: rows.length })
}
