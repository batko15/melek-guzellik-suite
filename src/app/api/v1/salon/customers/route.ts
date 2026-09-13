// Müşteri API'si (V4 ULTIMATE — müşteri kartı: alerji, tercihler, sadakat, portfolyo)
// GET    /api/v1/salon/customers              — tüm müşteriler + V4 kart alanları
// PUT    /api/v1/salon/customers              — müşteri kartını güncelle (ekip)
// PATCH  /api/v1/salon/customers              — sadakat puanı ekle/kullan (ekip)

import { db } from "@/lib/db"
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit"

const SHAPES = ["badem", "oval", "kare", "yuvarlak", "stiletto", null]
const GELS = ["jel", "akrilik", "dip", "kalici-oje", "dogal", null]

export async function GET() {
  const customers = await db.salonCustomer.findMany({
    include: {
      bookings: {
        select: { startAt: true, priceChf: true, status: true },
        orderBy: { startAt: "desc" },
      },
      galleryItems: {
        select: { id: true, title: true, imagePath: true, category: true },
        orderBy: { createdAt: "desc" },
      },
      loyaltyLogs: {
        select: { points: true, reason: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "asc" },
  })

  const now = new Date()
  const rows = customers.map((c) => {
    const completed = c.bookings.filter((b) => b.status === "tamamlandi")
    const upcoming = c.bookings.filter((b) => new Date(b.startAt) >= now && b.status !== "iptal" && b.status !== "gelmedi")
    const volume = completed.reduce((sum, b) => sum + b.priceChf, 0)
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      notes: c.notes,
      // V4: müşteri kartı
      allergies: c.allergies,
      sensitive: c.sensitive,
      prefShape: c.prefShape,
      prefGel: c.prefGel,
      prefColors: c.prefColors,
      loyaltyPoints: c.loyaltyPoints,
      portfolio: c.galleryItems,
      loyaltyHistory: c.loyaltyLogs.map((l) => ({
        points: l.points,
        reason: l.reason,
        createdAt: l.createdAt.toISOString(),
      })),
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

// ─── Müşteri kartı güncelleme (PUT) — ekip ──────────────────────────────────
export async function PUT(request: Request) {
  const rl = rateLimit(`customer-put:${clientIp(request)}`, 20, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as {
      id?: string
      name?: string
      email?: string | null
      notes?: string | null
      allergies?: string | null
      sensitive?: boolean
      prefShape?: string | null
      prefGel?: string | null
      prefColors?: string | null
    }
    if (!body.id) {
      return Response.json({ error: "Müşteri kimliği gerekli." }, { status: 400 })
    }
    const existing = await db.salonCustomer.findUnique({ where: { id: body.id } })
    if (!existing) {
      return Response.json({ error: "Müşteri bulunamadı." }, { status: 404 })
    }

    if (body.name !== undefined && body.name.trim().length < 2) {
      return Response.json({ error: "İsim en az 2 karakter olmalı." }, { status: 400 })
    }
    if (body.prefShape !== undefined && body.prefShape !== null && !SHAPES.includes(body.prefShape)) {
      return Response.json({ error: "Geçersiz tırnak formu." }, { status: 400 })
    }
    if (body.prefGel !== undefined && body.prefGel !== null && !GELS.includes(body.prefGel)) {
      return Response.json({ error: "Geçersiz enhancement tercihi." }, { status: 400 })
    }

    const customer = await db.salonCustomer.update({
      where: { id: body.id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.email !== undefined ? { email: body.email?.trim().toLowerCase() || null } : {}),
        ...(body.notes !== undefined ? { notes: body.notes?.trim() || null } : {}),
        ...(body.allergies !== undefined ? { allergies: body.allergies?.trim() || null } : {}),
        ...(body.sensitive !== undefined ? { sensitive: body.sensitive } : {}),
        ...(body.prefShape !== undefined ? { prefShape: body.prefShape } : {}),
        ...(body.prefGel !== undefined ? { prefGel: body.prefGel } : {}),
        ...(body.prefColors !== undefined ? { prefColors: body.prefColors?.trim() || null } : {}),
      },
    })

    return Response.json({
      customer: {
        id: customer.id,
        name: customer.name,
        allergies: customer.allergies,
        sensitive: customer.sensitive,
        prefShape: customer.prefShape,
        prefGel: customer.prefGel,
        prefColors: customer.prefColors,
        loyaltyPoints: customer.loyaltyPoints,
      },
    })
  } catch {
    return Response.json({ error: "Müşteri güncellenemedi." }, { status: 500 })
  }
}

// ─── Sadakat puanı ekle / kullan (PATCH) — ekip ─────────────────────────────
// { id, points: +5 | -10, reason: "…" } → puan güncelle + işlem günlüğü
export async function PATCH(request: Request) {
  const rl = rateLimit(`customer-patch:${clientIp(request)}`, 20, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as { id?: string; points?: number; reason?: string }
    if (!body.id || typeof body.points !== "number" || body.points === 0) {
      return Response.json({ error: "Müşteri kimliği ve sıfırdan farklı puan gerekli." }, { status: 400 })
    }
    if (body.points < -1000 || body.points > 1000) {
      return Response.json({ error: "Puan -1000 ile +1000 arasında olmalı." }, { status: 400 })
    }
    const existing = await db.salonCustomer.findUnique({ where: { id: body.id } })
    if (!existing) {
      return Response.json({ error: "Müşteri bulunamadı." }, { status: 404 })
    }
    if (existing.loyaltyPoints + body.points < 0) {
      return Response.json(
        { error: `Yetersiz puan — mevcut: ${existing.loyaltyPoints}.` },
        { status: 400 },
      )
    }

    const reason = body.reason?.trim() || (body.points > 0 ? "Manuel puan ekleme" : "Ödül kullanıldı")
    await db.loyaltyLog.create({
      data: { customerId: body.id, points: body.points, reason },
    })
    const customer = await db.salonCustomer.update({
      where: { id: body.id },
      data: { loyaltyPoints: { increment: body.points } },
    })

    return Response.json({
      customer: { id: customer.id, name: customer.name, loyaltyPoints: customer.loyaltyPoints },
      change: body.points,
      reason,
    })
  } catch {
    return Response.json({ error: "Puan güncellenemedi." }, { status: 500 })
  }
}
