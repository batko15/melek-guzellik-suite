// OTOMATİK HATIRLATMA CRON (V5.4) — Vercel Cron tetikler, her gün 11:00 TSİ
// GET/POST /api/v1/cron/reminders
//   1) Önümüzdeki 24 saat içindeki BEKLİYOR/ONAYLANDI randevuları bulur
//      (henüz «hatirlatma» bildirimi gönderilmemiş olanlar)
//   2) Her biri için: müşteriye E-posta (SMTP) + WhatsApp (Twilio) gönderilir
//      ve NotificationLog'a «hatirlatma» kaydı yazılır → bir daha gönderilmez
//   3) Sonuç özeti döner
//
// GÜVENLİK: CRON_SECRET ortam değişkeni tanımlıysa Authorization: Bearer
// <secret> (veya ?secret=) zorunludur — tanımlı değilse yalnızca GET ile
// manuel tetiklenebilir (yerel test).
//
// Vercel Hobby planı: günde 1 cron çağrısı — vercel.json «crons» bölümü.
// Araştırma (probeauty/youcanbook 2026): otomatik hatırlatma, no-show
// kaybını en çok azaltan yöntem (%40'a varan azalma).

import { timingSafeEqual } from "node:crypto"
import { db } from "@/lib/db"
import { getOptionalStaff } from "@/lib/auth"
import { buildMessage } from "@/lib/notify"
import { notifyCustomer } from "@/lib/notify-send"

const WINDOW_HOURS = 24

/** Timing-sicherer String-Vergleich (gleiche Länge nötig; Länge selbst gilt als unkritisch). */
function secretEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8")
  const bb = Buffer.from(b, "utf8")
  if (ab.length !== bb.length || ab.length === 0) return false
  return timingSafeEqual(ab, bb)
}

function authorized(request: Request): { ok: boolean; configError?: boolean } {
  // V5.7.1: geçerli ekip oturumu da yetkili sayılır (portaldan manuel tetikleme)
  if (getOptionalStaff(request)) return { ok: true }

  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    // V6.0.1 FAIL-CLOSED BUGFIX: Ohne CRON_SECRET war der Endpunkt in
    // Production offen (jeder konnte Sweeps auslösen + Kundendaten im
    // Summary sehen). Jetzt gilt: fehlendes Secret auf Vercel/Production
    // = Konfigurationsfehler → 401 (nur noch die Ekip-Oturum bleibt weg).
    // Rein lokal (NODE_ENV=development, kein VERCEL) bleibt der Testmodus.
    const isProduction =
      process.env.VERCEL_ENV === "production" ||
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL === "1"
    return isProduction ? { ok: false, configError: true } : { ok: true }
  }

  const header = request.headers.get("authorization") ?? ""
  const bearer = header.replace(/^Bearer\s+/i, "").trim()
  const query = new URL(request.url).searchParams.get("secret") ?? ""
  // V5.7.2: === durch timing-sicheren Vergleich ersetzt (Secret-Extraktion per Response-Timing verhindern)
  return { ok: secretEquals(bearer, secret) || secretEquals(query, secret) }
}

async function runReminderSweep() {
  const now = new Date()
  const until = new Date(now.getTime() + WINDOW_HOURS * 3600 * 1000)

  // Hatırlatma penceresindeki randevular (son 7 günde hatirlatma gönderilmemiş)
  const bookings = await db.booking.findMany({
    where: {
      startAt: { gte: now, lt: until },
      status: { in: ["bekliyor", "onaylandi"] },
    },
    include: {
      service: { select: { name: true } },
      customer: { select: { name: true, phone: true, email: true } },
      notifications: {
        where: { kind: "hatirlatma", createdAt: { gte: new Date(now.getTime() - 7 * 24 * 3600 * 1000) } },
        select: { id: true },
      },
    },
    orderBy: { startAt: "asc" },
  })

  const due = bookings.filter((b) => b.notifications.length === 0)

  const results: Array<{
    bookingId: string
    customer: string
    service: string
    startAt: string
    emailSent: boolean
    whatsappSent: boolean
    error?: string
  }> = []

  for (const b of due) {
    const message = buildMessage("hatirlatma", {
      customerName: b.customer.name,
      customerPhone: b.customer.phone,
      serviceName: b.service.name,
      startAt: b.startAt,
      price: b.priceChf,
      notes: b.notes,
    })
    try {
      const sent = await notifyCustomer({
        bookingId: b.id,
        customerName: b.customer.name,
        customerPhone: b.customer.phone,
        customerEmail: b.customer.email,
        kind: "hatirlatma",
        message,
      })
      results.push({
        bookingId: b.id,
        customer: b.customer.name,
        service: b.service.name,
        startAt: b.startAt.toISOString(),
        emailSent: sent.emailSent,
        whatsappSent: sent.whatsappSent,
      })
    } catch (e) {
      results.push({
        bookingId: b.id,
        customer: b.customer.name,
        service: b.service.name,
        startAt: b.startAt.toISOString(),
        emailSent: false,
        whatsappSent: false,
        error: (e as Error)?.message?.slice(0, 120),
      })
    }
  }

  return {
    window: { from: now.toISOString(), until: until.toISOString(), hours: WINDOW_HOURS },
    checked: bookings.length,
    due: due.length,
    sent: results.filter((r) => r.emailSent || r.whatsappSent).length,
    logged: results.length, // NotificationLog'a yazılan (tekrar gönderilmemesi için)
    results,
  }
}

export async function GET(request: Request) {
  const auth = authorized(request)
  if (!auth.ok) {
    return Response.json(
      {
        error: "Yetkisiz.",
        ...(auth.configError
          ? {
              hint:
                "CRON_SECRET ist auf Vercel nicht gesetzt — Environment Variable anlegen (Vercel → Settings → Environment Variables) und neu deployen. Bis dahin bleiben tägliche Erinnerungen deaktiviert.",
            }
          : {}),
      },
      { status: 401 },
    )
  }
  try {
    const summary = await runReminderSweep()
    return Response.json({ ok: true, ...summary })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error)?.message ?? "bilinmeyen hata" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
