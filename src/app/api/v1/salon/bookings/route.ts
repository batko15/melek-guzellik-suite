// Buchungen-API
// GET   /api/v1/salon/bookings?email=…&from=…&to=…&status=…&role=customer|staff
// POST  /api/v1/salon/bookings           — neue Buchung (Kundinnen-Portal)
// PATCH /api/v1/salon/bookings           — Status ändern / stornieren (Team)

import { db } from "@/lib/db"

interface BookingRow {
  id: string
  startAt: string
  durationMin: number
  priceChf: number
  status: string
  notes: string | null
  service: { name: string; category: string }
  customer: { name: string; email: string; phone: string | null }
}

async function listBookings(params: URLSearchParams): Promise<BookingRow[]> {
  const email = params.get("email")
  const from = params.get("from")
  const to = params.get("to")
  const status = params.get("status")

  const bookings = await db.booking.findMany({
    where: {
      ...(email ? { customer: { email } } : {}),
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            startAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lt: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: {
      service: { select: { name: true, category: true } },
      customer: { select: { name: true, email: true, phone: true } },
    },
    orderBy: { startAt: "asc" },
  })

  return bookings.map((b) => ({
    id: b.id,
    startAt: b.startAt.toISOString(),
    durationMin: b.durationMin,
    priceChf: b.priceChf,
    status: b.status,
    notes: b.notes,
    service: { name: b.service.name, category: b.service.category },
    customer: { name: b.customer.name, email: b.customer.email, phone: b.customer.phone },
  }))
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const bookings = await listBookings(params)
  return Response.json({ bookings, count: bookings.length })
}

// ─── Neue Buchung (Kundinnen-Portal) ────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customerName: string
      customerEmail: string
      customerPhone?: string
      serviceId: string
      startAt: string
      notes?: string
    }

    if (!body.customerName?.trim() || !body.customerEmail?.trim() || !body.serviceId || !body.startAt) {
      return Response.json({ error: "Name, E-Mail, Leistung und Termin sind erforderlich." }, { status: 400 })
    }

    const service = await db.service.findUnique({ where: { id: body.serviceId } })
    if (!service) {
      return Response.json({ error: "Leistung nicht gefunden." }, { status: 404 })
    }

    // Kundin finden oder anlegen
    const customer = await db.salonCustomer.upsert({
      where: { email: body.customerEmail.trim().toLowerCase() },
      update: {
        ...(body.customerPhone ? { phone: body.customerPhone } : {}),
        name: body.customerName.trim(),
      },
      create: {
        name: body.customerName.trim(),
        email: body.customerEmail.trim().toLowerCase(),
        phone: body.customerPhone ?? null,
      },
    })

    // Kollision prüfen (nur bestätigte/angefragte Buchungen)
    const start = new Date(body.startAt)
    const end = new Date(start.getTime() + service.durationMin * 60000)
    const dayStart = new Date(start)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const overlapping = await db.booking.findMany({
      where: { startAt: { gte: dayStart, lt: dayEnd }, status: { in: ["angefragt", "bestaetigt"] } },
      select: { startAt: true, durationMin: true },
    })
    const clash = overlapping.some((b) => {
      const bEnd = new Date(b.startAt.getTime() + b.durationMin * 60000)
      return b.startAt < end && bEnd > start
    })
    if (clash) {
      return Response.json({ error: "Dieser Termin ist leider schon belegt — bitte eine andere Zeit wählen." }, { status: 409 })
    }

    const booking = await db.booking.create({
      data: {
        customerId: customer.id,
        serviceId: service.id,
        startAt: start,
        durationMin: service.durationMin,
        priceChf: service.priceChf,
        status: "angefragt",
        notes: body.notes?.trim() || null,
      },
      include: { service: { select: { name: true } } },
    })

    return Response.json(
      {
        booking: {
          id: booking.id,
          startAt: booking.startAt.toISOString(),
          durationMin: booking.durationMin,
          priceChf: booking.priceChf,
          status: booking.status,
          serviceName: booking.service.name,
          customerName: customer.name,
        },
      },
      { status: 201 },
    )
  } catch {
    return Response.json({ error: "Buchung konnte nicht erstellt werden." }, { status: 500 })
  }
}

// ─── Status-Änderung (Team-Portal) ──────────────────────────────────────────
const ALLOWED_STATUS = ["angefragt", "bestaetigt", "abgeschlossen", "storniert"]

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id?: string; status?: string }
    if (!body.id || !body.status || !ALLOWED_STATUS.includes(body.status)) {
      return Response.json({ error: "Buchungs-ID und gültiger Status erforderlich." }, { status: 400 })
    }
    const booking = await db.booking.update({
      where: { id: body.id },
      data: { status: body.status },
      include: { service: { select: { name: true } }, customer: { select: { name: true } } },
    })
    return Response.json({
      booking: {
        id: booking.id,
        status: booking.status,
        serviceName: booking.service.name,
        customerName: booking.customer.name,
      },
    })
  } catch {
    return Response.json({ error: "Buchung nicht gefunden." }, { status: 404 })
  }
}
