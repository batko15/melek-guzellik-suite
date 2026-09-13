// Bildirim Günlüğü API'si (V3 — Rezervasyon Merkezi)
// GET  /api/v1/salon/notifications?limit=50      — son gönderilen müşteri bildirimleri
// POST /api/v1/salon/notifications               — ekip bir kanalı açtığında kayıt düşer
//        { bookingId?, customer, phone, channel, kind, message }

import { db } from "@/lib/db"
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit"

const CHANNELS = ["whatsapp", "sms", "email"]
const KINDS = ["onay", "degisiklik", "iptal", "hatirlatma", "tamamlandi", "ozel"]

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const limitRaw = Number(params.get("limit") ?? 50)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50
  const bookingId = params.get("bookingId")

  const logs = await db.notificationLog.findMany({
    where: bookingId ? { bookingId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return Response.json({
    logs: logs.map((l) => ({
      id: l.id,
      bookingId: l.bookingId,
      customer: l.customer,
      phone: l.phone,
      channel: l.channel,
      kind: l.kind,
      message: l.message,
      createdAt: l.createdAt.toISOString(),
    })),
    count: logs.length,
  })
}

export async function POST(request: Request) {
  // Hız sınırı: IP başına dakikada 60 kayıt (kanal açma tıklamaları)
  const rl = rateLimit(`notify-log:${clientIp(request)}`, 60, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as {
      bookingId?: string
      customer?: string
      phone?: string
      channel?: string
      kind?: string
      message?: string
    }

    if (!body.customer || !body.phone || !body.channel || !body.kind || !body.message?.trim()) {
      return Response.json({ error: "Müşteri, telefon, kanal, tür ve mesaj zorunludur." }, { status: 400 })
    }
    if (!CHANNELS.includes(body.channel)) {
      return Response.json({ error: "Geçersiz kanal." }, { status: 400 })
    }
    if (!KINDS.includes(body.kind)) {
      return Response.json({ error: "Geçersiz bildirim türü." }, { status: 400 })
    }
    if (body.message.length > 2000) {
      return Response.json({ error: "Mesaj çok uzun (maks. 2000 karakter)." }, { status: 400 })
    }

    // Randevu var mı? (yoksa da kayıt düşülebilir — bağlantısız özel mesajlar)
    let bookingId: string | null = null
    if (body.bookingId) {
      const b = await db.booking.findUnique({ where: { id: body.bookingId }, select: { id: true } })
      if (!b) return Response.json({ error: "Randevu bulunamadı." }, { status: 404 })
      bookingId = b.id
    }

    const log = await db.notificationLog.create({
      data: {
        bookingId,
        customer: body.customer.trim().slice(0, 120),
        phone: body.phone.trim().slice(0, 40),
        channel: body.channel,
        kind: body.kind,
        message: body.message.trim(),
      },
    })

    return Response.json({ log: { id: log.id, createdAt: log.createdAt.toISOString() } }, { status: 201 })
  } catch {
    return Response.json({ error: "Bildirim kaydedilemedi." }, { status: 500 })
  }
}
