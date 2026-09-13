// ═══════════════════════════════════════════════════════════════════════════
//  BILDİRİM SİSTEMİ V5.3 — Gerçek gönderim (E-Mail SMTP + WhatsApp Twilio)
// ═══════════════════════════════════════════════════════════════════════════
//  Zarif yoksunluk (graceful degradation) ilkesi:
//   • SMTP yapılandırılmışsa  → gerçek e-posta gönderilir (nodemailer)
//   • Twilio yapılandırılmışsa → gerçek WhatsApp mesajı gönderilir (REST API)
//   • Yapılandırılmamışsa     → hiçbir şey kırılmaz: derin bağlantılar
//     (wa.me / mailto) üretilmeye devam eder, gönderim günlüğe yazılır.
//
//  Ortam değişkenleri (hepsi OPSİYONEL — .env.example bakınız):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
//   NOTIFY_EMAIL_TO   — stüdyo bildirim kutusu (yoksa SMTP_USER kullanılır)
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
// ═══════════════════════════════════════════════════════════════════════════

import nodemailer from "nodemailer"
import { db } from "@/lib/db"
import { BRANDING } from "@/config/branding"
import { phoneDigits } from "@/lib/phone"
import type { NotifyKind } from "@/lib/notify"

const BRAND = () => BRANDING.brand.nameParts.join(" ")

// ─── Yapılandırma algılama ──────────────────────────────────────────────────

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null
  const port = Number(process.env.SMTP_PORT ?? "587")
  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure: port === 465,
    auth: { user, pass },
    from: process.env.SMTP_FROM?.trim() || user,
  }
}

function twilioConfig() {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const token = process.env.TWILIO_AUTH_TOKEN?.trim()
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim()
  if (!sid || !token || !from) return null
  return { sid, token, from }
}

export function notifyCapabilities(): { email: boolean; whatsapp: boolean } {
  return { email: smtpConfig() !== null, whatsapp: twilioConfig() !== null }
}

// ─── Gönderim günlüğü (NotificationLog) ─────────────────────────────────────

/** Gönderimi veritabanına yazar — asla akışı bozmaz, hata yutulur. */
async function logNotification(entry: {
  bookingId?: string | null
  customer: string
  phone?: string | null
  channel: "whatsapp" | "sms" | "email"
  kind: NotifyKind | "talep"
  message: string
}): Promise<void> {
  try {
    await db.notificationLog.create({
      data: {
        bookingId: entry.bookingId ?? null,
        customer: entry.customer,
        phone: entry.phone ?? "",
        channel: entry.channel,
        kind: entry.kind,
        message: entry.message,
      },
    })
  } catch (e) {
    console.error("[BİLDİRİM] Günlük kaydı yazılamadı:", (e as Error)?.message)
  }
}

// ─── E-Mail (nodemailer) ────────────────────────────────────────────────────

/** HTML e-postası — SMTP yapılandırılmışsa gerçek gönderim. */
async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const cfg = smtpConfig()
  if (!cfg) return false
  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: cfg.auth,
      // Vercel serverless koruması: takılan bir SMTP sunucusu isteği bloklamasın
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    })
    await transporter.sendMail({
      from: `"${BRAND()}" <${cfg.from}>`,
      to,
      subject,
      text,
      headers: { "X-Entity-Ref": "melek-guzellik-suite" },
    })
    return true
  } catch (e) {
    console.error("[BİLDİRİM] E-posta gönderilemedi:", (e as Error)?.message)
    return false
  }
}

// ─── WhatsApp (Twilio REST) ─────────────────────────────────────────────────

/** Twilio WhatsApp API üzerinden gerçek mesaj gönderimi. */
async function sendWhatsApp(toPhone: string, message: string): Promise<boolean> {
  const cfg = twilioConfig()
  if (!cfg) return false
  try {
    const to = `whatsapp:+${phoneDigits(toPhone)}`
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${cfg.sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${cfg.sid}:${cfg.token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: `whatsapp:${cfg.from}`,
          To: to,
          Body: message,
        }),
        // Vercel serverless: fetch zaman aşımı — bildirim akışı bloklanmasın
        signal: AbortSignal.timeout(10000),
      },
    )
    if (!res.ok) {
      console.error("[BİLDİRİM] Twilio hatası:", res.status, await res.text().catch(() => ""))
      return false
    }
    return true
  } catch (e) {
    console.error("[BİLDİRİM] WhatsApp gönderilemedi:", (e as Error)?.message)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  KANCALAR — API tarafında çağrılır (bookings POST/PATCH)
// ═══════════════════════════════════════════════════════════════════════════

export interface NewBookingNotification {
  bookingId: string
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  serviceName: string
  startAt: Date
  price: number
  notes?: string | null
}

/**
 * Yeni misafir randevusu → STÜDYO bildirimi.
 * E-posta (SMTP) + WhatsApp (Twilio) yapılandırılmışsa gerçekten gönderilir;
 * her durumda NotificationLog'a yazılır. Asla throw etmez.
 */
export async function notifyStudioNewBooking(b: NewBookingNotification): Promise<void> {
  // Sunucu her zaman İstanbul saatiyle biçimlendirir (UTC sunucularda 3 saatlik kayma olmasın)
  const TZ = { timeZone: "Europe/Istanbul" } as const
  const TL_DATE = b.startAt.toLocaleDateString("tr-TR", { ...TZ, day: "numeric", month: "long", weekday: "long" })
  const TL_TIME = b.startAt.toLocaleTimeString("tr-TR", { ...TZ, hour: "2-digit", minute: "2-digit" })
  // timeZone yalnızca tarih/saat biçiminde anlamlıdır (NumberFormat seçeneği değildir)
  const PARA = `${Math.round(b.price).toLocaleString("tr-TR")} ${BRANDING.locale.currencySymbol}`

  const message = [
    `✨ ${BRAND()} — Yeni Randevu Talebi`,
    ``,
    `👤 ${b.customerName} (${b.customerPhone})`,
    `💅 ${b.serviceName}`,
    `📅 ${TL_DATE} · ${TL_TIME}`,
    `💰 ${PARA}`,
    b.notes ? `📝 Not: ${b.notes}` : ``,
    ``,
    `Panelden onaylayın: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://melek-guzellik-suite.vercel.app"}`,
  ].filter(Boolean).join("\n")

  const inbox = process.env.NOTIFY_EMAIL_TO?.trim() || process.env.SMTP_USER?.trim()
  const jobs: Promise<unknown>[] = []

  // E-posta → stüdyo
  if (inbox) {
    jobs.push(
      sendEmail(inbox, `🆕 Yeni Randevu: ${b.customerName} — ${b.serviceName}`, message)
        .then((ok) => logNotification({
          bookingId: b.bookingId,
          customer: b.customerName,
          phone: b.customerPhone,
          channel: "email",
          kind: "talep",
          message,
        }).then(() => ok)),
    )
  }

  // WhatsApp → stüdyo numarası
  const studioPhone = BRANDING.company.whatsapp ?? BRANDING.company.phone
  if (studioPhone) {
    jobs.push(
      sendWhatsApp(studioPhone, message)
        .then((ok) => logNotification({
          bookingId: b.bookingId,
          customer: b.customerName,
          phone: studioPhone,
          channel: "whatsapp",
          kind: "talep",
          message,
        }).then(() => ok)),
    )
  }

  await Promise.allSettled(jobs).catch(() => {})
}

export interface CustomerNotification {
  bookingId: string
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  kind: NotifyKind
  message: string
}

/**
 * Durum değişimi (onay/iptal/değişiklik/tamamlandı) → MÜŞTERİ bildirimi.
 * Otomatik gönderim: E-posta (adres varsa) + WhatsApp (Twilio varsa).
 * El ile kanal (wa.me derin bağlantı) API yanıtında dönmeye devam eder.
 */
export async function notifyCustomer(n: CustomerNotification): Promise<{
  emailSent: boolean
  whatsappSent: boolean
}> {
  const jobs: Array<Promise<boolean>> = []

  if (n.customerEmail) {
    jobs.push(
      sendEmail(n.customerEmail, `${BRAND()} — Randevu Bilgilendirmesi`, n.message)
        .then((ok) => {
          void logNotification({
            bookingId: n.bookingId,
            customer: n.customerName,
            phone: n.customerPhone,
            channel: "email",
            kind: n.kind,
            message: n.message,
          })
          return ok
        }),
    )
  }

  if (twilioConfig()) {
    jobs.push(
      sendWhatsApp(n.customerPhone, n.message)
        .then((ok) => {
          void logNotification({
            bookingId: n.bookingId,
            customer: n.customerName,
            phone: n.customerPhone,
            channel: "whatsapp",
            kind: n.kind,
            message: n.message,
          })
          return ok
        }),
    )
  }

  const results = await Promise.allSettled(jobs)
  const emailSent = n.customerEmail ? results[0]?.status === "fulfilled" && results[0].value === true : false
  const whatsappSent = twilioConfig()
    ? results[results.length - 1]?.status === "fulfilled" && (results[results.length - 1] as PromiseFulfilledResult<boolean>).value === true
    : false
  return { emailSent, whatsappSent }
}
