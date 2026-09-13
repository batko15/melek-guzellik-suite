// Randevu API'si (V2 — misafir randevusu, giriş GEREKMEZ)
// GET   /api/v1/salon/bookings?phone=…           — misafir: kendi randevuları
// GET   /api/v1/salon/bookings?from=…&to=…&status=… — ekip: tüm randevular
// POST  /api/v1/salon/bookings                   — HERKES randevu alabilir (ad + telefon)
// PATCH /api/v1/salon/bookings                   — ekip: durum değiştir · misafir: telefon ile iptal

import { db } from "@/lib/db"

const STATUS_ACTIVE = ["bekliyor", "onaylandi"]

interface BookingRow {
  id: string
  startAt: string
  durationMin: number
  priceChf: number
  status: string
  notes: string | null
  service: { name: string; category: string }
  customer: { name: string; phone: string; email: string | null }
}

async function listBookings(params: URLSearchParams): Promise<BookingRow[]> {
  const phone = params.get("phone")
  const from = params.get("from")
  const to = params.get("to")
  const status = params.get("status")

  const bookings = await db.booking.findMany({
    where: {
      ...(phone ? { customer: { phone } } : {}),
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
      customer: { select: { name: true, phone: true, email: true } },
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
    customer: { name: b.customer.name, phone: b.customer.phone, email: b.customer.email },
  }))
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const bookings = await listBookings(params)
  return Response.json({ bookings, count: bookings.length })
}

// ─── Yeni randevu — HERKES, giriş gerekmez ──────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customerName?: string
      customerPhone?: string
      customerEmail?: string
      serviceId?: string
      startAt?: string
      notes?: string
    }

    const name = body.customerName?.trim() ?? ""
    const phone = body.customerPhone?.trim() ?? ""
    const email = body.customerEmail?.trim().toLowerCase() ?? ""

    if (name.length < 2) {
      return Response.json({ error: "Lütfen adınızı girin." }, { status: 400 })
    }
    if (phone.replace(/\D/g, "").length < 7) {
      return Response.json({ error: "Lütfen geçerli bir telefon numarası girin." }, { status: 400 })
    }
    if (!body.serviceId || !body.startAt) {
      return Response.json({ error: "Hizmet ve randevu saati zorunludur." }, { status: 400 })
    }

    const service = await db.service.findUnique({ where: { id: body.serviceId } })
    if (!service) {
      return Response.json({ error: "Hizmet bulunamadı." }, { status: 404 })
    }

    // Randevu tarihi geçmişte olamaz ve en fazla 60 gün ileride olabilir
    const start = new Date(body.startAt)
    const now = new Date()
    if (Number.isNaN(start.getTime()) || start.getTime() < now.getTime() - 60000) {
      return Response.json({ error: "Geçmiş bir tarihe randevu alınamaz." }, { status: 400 })
    }
    if (start.getTime() > now.getTime() + 60 * 24 * 3600 * 1000) {
      return Response.json({ error: "Randevu en fazla 60 gün ileride alınabilir." }, { status: 400 })
    }

    // Müşteriyi telefon numarasına göre bul veya oluştur (girişsiz)
    const customer = await db.salonCustomer.upsert({
      where: { phone },
      update: { name, ...(email ? { email } : {}) },
      create: { name, phone, email: email || null },
    })

    // Çakışma kontrolü (yalnızca bekleyen/onaylı randevular)
    const end = new Date(start.getTime() + service.durationMin * 60000)
    const dayStart = new Date(start)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const overlapping = await db.booking.findMany({
      where: { startAt: { gte: dayStart, lt: dayEnd }, status: { in: STATUS_ACTIVE } },
      select: { startAt: true, durationMin: true },
    })
    const clash = overlapping.some((b) => {
      const bEnd = new Date(b.startAt.getTime() + b.durationMin * 60000)
      return b.startAt < end && bEnd > start
    })
    if (clash) {
      return Response.json(
        { error: "Bu saat maalesef dolu — lütfen başka bir saat seçin." },
        { status: 409 },
      )
    }

    const booking = await db.booking.create({
      data: {
        customerId: customer.id,
        serviceId: service.id,
        startAt: start,
        durationMin: service.durationMin,
        priceChf: service.priceChf,
        status: "bekliyor",
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
          customerPhone: customer.phone,
        },
      },
      { status: 201 },
    )
  } catch {
    return Response.json({ error: "Randevu oluşturulamadı." }, { status: 500 })
  }
}

// ─── Durum değişikliği ───────────────────────────────────────────────────────
// Ekip:  { id, status }                       — tüm geçişler
// Misafir: { id, status: "iptal", phone }     — yalnızca kendi randevusunu iptal edebilir
const ALLOWED_STATUS = ["bekliyor", "onaylandi", "tamamlandi", "iptal"]

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id?: string; status?: string; phone?: string }
    if (!body.id || !body.status || !ALLOWED_STATUS.includes(body.status)) {
      return Response.json({ error: "Randevu kimliği ve geçerli bir durum gerekli." }, { status: 400 })
    }

    const existing = await db.booking.findUnique({
      where: { id: body.id },
      include: { customer: { select: { phone: true } } },
    })
    if (!existing) {
      return Response.json({ error: "Randevu bulunamadı." }, { status: 404 })
    }

    // Misafir-iptali: telefon numarası eşleşmeli ve yalnızca iptal mümkün
    if (body.phone) {
      if (body.status !== "iptal") {
        return Response.json({ error: "Randevu yalnızca iptal edilebilir." }, { status: 403 })
      }
      if (existing.customer.phone !== body.phone.trim()) {
        return Response.json({ error: "Bu randevu bu telefon numarasına ait değil." }, { status: 403 })
      }
      if (existing.status === "tamamlandi") {
        return Response.json({ error: "Tamamlanmış randevu iptal edilemez." }, { status: 400 })
      }
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
    return Response.json({ error: "Randevu bulunamadı." }, { status: 404 })
  }
}
