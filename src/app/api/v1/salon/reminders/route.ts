// Hatırlatma API'si (V4 ULTIMATE — otomatik randevu hatırlatma kuyruğu)
// GET /api/v1/salon/reminders?hours=48
//   Önümüzdeki `hours` saat içindeki BEKLİYOR/ONAYLANMIŞ randevulardan
//   henüz «hatirlatma» bildirimi GÖNDERİLMEMİŞ olanları döndürür.
//   Her kayıt için hazır Türkçe mesaj + WhatsApp/SMS bağlantıları üretilir.
//   (Araştırma: otomatik hatırlatma, no-show oranını en çok düşüren yöntem —
//    youcanbook.me / probeauty 2026)
//
// Gönderim akışı: ekip kuyruğu görür → WhatsApp tıklar → wa.me açılır +
// POST /api/v1/salon/notifications günlüğe kaydeder → randevu kuyruktan düşer.

import { db } from "@/lib/db"
import { buildMessage, channelUrls } from "@/lib/notify"

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const hoursRaw = Number(params.get("hours") ?? 48)
  const hours = Number.isFinite(hoursRaw) ? Math.min(Math.max(hoursRaw, 1), 168) : 48

  const now = new Date()
  const until = new Date(now.getTime() + hours * 3600 * 1000)

  const bookings = await db.booking.findMany({
    where: {
      startAt: { gte: now, lt: until },
      status: { in: ["bekliyor", "onaylandi"] },
    },
    include: {
      service: { select: { name: true } },
      customer: { select: { name: true, phone: true, email: true } },
      notifications: {
        where: { kind: "hatirlatma", createdAt: { gte: new Date(now.getTime() - 14 * 24 * 3600 * 1000) } },
        select: { id: true },
      },
    },
    orderBy: { startAt: "asc" },
  })

  // Yalnızca hatırlatması henüz gönderilmemiş olanlar (son 14 gün içinde kayıt yok)
  const due = bookings.filter((b) => b.notifications.length === 0)

  const rows = due.map((b) => {
    const message = buildMessage("hatirlatma", {
      customerName: b.customer.name,
      customerPhone: b.customer.phone,
      serviceName: b.service.name,
      startAt: b.startAt,
      price: b.priceChf,
      notes: b.notes,
    })
    const urls = channelUrls({ phone: b.customer.phone, email: b.customer.email, message })
    return {
      id: b.id,
      startAt: b.startAt.toISOString(),
      serviceName: b.service.name,
      customerName: b.customer.name,
      customerPhone: b.customer.phone,
      priceChf: b.priceChf,
      status: b.status,
      deposit: b.deposit,
      depositPaid: b.depositPaid,
      hoursUntil: Math.max(0, Math.round((b.startAt.getTime() - now.getTime()) / 3600000)),
      message,
      channels: urls,
    }
  })

  return Response.json({
    reminders: rows,
    count: rows.length,
    hours,
    window: { from: now.toISOString(), until: until.toISOString() },
  })
}
