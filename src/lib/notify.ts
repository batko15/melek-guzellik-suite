// ═══════════════════════════════════════════════════════════════════════════
//  BİLDİRİM SİSTEMİ V3 — Ekip → Müşteri bilgilendirme (WhatsApp / SMS / E-posta)
// ═══════════════════════════════════════════════════════════════════════════
//  Rezervasyon Merkezi'nin kalbi: randevu değiştiğinde / onaylandığında /
//  iptal edildiğinde müşteriye GÖNDERİLEBİLİRK Türkçe hazır mesajlar.
//
//  Pattern (araştırma): wa.me/<numara>?text=<önceden doldurulmuş mesaj> —
//  API anahtarı gerektirmez, Instagram/WhatsApp Business akışıyla uyumludur.
//  SMS: sms:<numara>?body=<mesaj> · E-posta: mailto:?subject=&body=
//
//  Üretimde gerçek gönderim için (opsiyonel):
//   • Twilio WhatsApp API / Meta Cloud API → sendBookingNotification()
//     içindeki console.log satırını sağlayıcı çağrısıyla değiştirin.
//   • Bildirim Günlüğü (NotificationLog tablosu) her gönderimi kaydeder.
// ═══════════════════════════════════════════════════════════════════════════

import { BRANDING } from "@/config/branding"
import { phoneDigits } from "@/lib/phone"

// ─── Ortak veri arayüzü ─────────────────────────────────────────────────────

export interface BookingNotificationData {
  customerName: string
  customerPhone: string
  serviceName: string
  startAt: Date
  price: number
  notes?: string | null
}

const TL_DATE = (d: Date) =>
  d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" })
const TL_TIME = (d: Date) =>
  d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
const PARA = (v: number) =>
  `${Math.round(v).toLocaleString("tr-TR")} ${BRANDING.locale.currencySymbol}`
const BRAND = () => BRANDING.brand.nameParts.join(" ")

// ═══════════════════════════════════════════════════════════════════════════
//  MESAJ ŞABLONLARI — Rezervasyon Merkezi'nden müşteriye gönderilir
// ═══════════════════════════════════════════════════════════════════════════

export type NotifyKind = "onay" | "degisiklik" | "iptal" | "hatirlatma" | "tamamlandi" | "ozel"

export const NOTIFY_KIND_META: Record<NotifyKind, { label: string; icon: string; hint: string }> = {
  onay: { label: "Onay", icon: "✅", hint: "Randevuyu onayla ve müşteriyi bilgilendir" },
  degisiklik: { label: "Değişiklik", icon: "🔄", hint: "Yeni tarih/saat bilgisini ilet" },
  iptal: { label: "İptal", icon: "❌", hint: "İptal bilgisi ve alternatif teklif" },
  hatirlatma: { label: "Hatırlatma", icon: "⏰", hint: "Randevudan önce nazik hatırlatma" },
  tamamlandi: { label: "Son Bakım", icon: "💐", hint: "Randevu sonrası teşekkür + bakım ipucu" },
  ozel: { label: "Özel Mesaj", icon: "✍️", hint: "Serbest metin — istediğinizi yazın" },
}

/** Şablon argümanları: yeni değerler değişiklik bildiriminde opsiyonel. */
export interface TemplateArgs extends BookingNotificationData {
  newStartAt?: Date
  newServiceName?: string
  customText?: string
}

/** Tüm mesaj şablonları — Rezervasyon Merkezi + API tarafından kullanılır. */
export function buildMessage(kind: NotifyKind, a: TemplateArgs): string {
  switch (kind) {
    case "onay":
      return [
        `✨ ${BRAND()} — Randevunuz Onaylandı`,
        ``,
        `Merhaba ${a.customerName},`,
        ``,
        `💅 ${a.serviceName}`,
        `📅 ${TL_DATE(a.startAt)} · ${TL_TIME(a.startAt)}`,
        `💰 Ücret: ${PARA(a.price)}`,
        a.notes ? `📝 Notunuz: ${a.notes}` : ``,
        ``,
        `Adres: ${BRANDING.company.street}, ${BRANDING.company.city}`,
        `Sizi görmek için sabırsızlanıyoruz! 🌸`,
      ].filter(Boolean).join("\n")

    case "degisiklik": {
      const lines = [
        `🔄 ${BRAND()} — Randevu Değişikliği`,
        ``,
        `Merhaba ${a.customerName},`,
        ``,
        `Randevunuz güncellendi:`,
        `❌ Eski: ${TL_DATE(a.startAt)} · ${TL_TIME(a.startAt)} — ${a.serviceName}`,
      ]
      if (a.newStartAt || a.newServiceName) {
        lines.push(
          `✅ Yeni: ${a.newStartAt ? `${TL_DATE(a.newStartAt)} · ${TL_TIME(a.newStartAt)}` : ""}${a.newStartAt && a.newServiceName ? " — " : ""}${a.newServiceName ?? ""}`,
        )
      }
      lines.push(
        ``,
        `Değişiklik size uygun değilse lütfen bize ulaşın: ${BRANDING.company.phone}`,
        `Anlayışınız için teşekkürler! 🌸`,
      )
      return lines.filter(Boolean).join("\n")
    }

    case "iptal":
      return [
        `❌ ${BRAND()} — Randevu İptali`,
        ``,
        `Merhaba ${a.customerName},`,
        ``,
        `Maalesef aşağıdaki randevunuz iptal edildi:`,
        `💅 ${a.serviceName}`,
        `📅 ${TL_DATE(a.startAt)} · ${TL_TIME(a.startAt)}`,
        ``,
        `Yeni bir randevu için bize kolayca ulaşabilirsiniz:`,
        `📱 ${BRANDING.company.phone}`,
        `En kısa sürede tekrar hizmetinizde olmaktan mutluluk duyarız. 🌸`,
      ].join("\n")

    case "hatirlatma":
      return [
        `⏰ ${BRAND()} — Randevu Hatırlatması`,
        ``,
        `Merhaba ${a.customerName},`,
        ``,
        `Yarınki randevunuzu hatırlatmak istedik:`,
        `💅 ${a.serviceName}`,
        `📅 ${TL_DATE(a.startAt)} · ${TL_TIME(a.startAt)}`,
        ``,
        `Adres: ${BRANDING.company.street}, ${BRANDING.company.city}`,
        `Gelemeyecekseniz lütfen kısa bir mesaj bırakın. 🌸`,
      ].join("\n")

    case "tamamlandi":
      return [
        `💐 ${BRAND()} — Teşekkürler!`,
        ``,
        `Merhaba ${a.customerName},`,
        ``,
        `${a.serviceName} randevumuz için teşekkür ederiz!`,
        `Umarım sonucunla çok mutlusunuz. ✨`,
        ``,
        `💡 Bakım ipucu: Tırnaklarınızın uzun süre dayanması için her akşam kütikül yağı uygulayın.`,
        ``,
        `Deneyiminizi isterse web sayfamızda paylaşabilirsiniz:`,
        `🌟 ${BRANDING.company.website}`,
        `Sizi tekrar görmek dileğiyle! 🌸`,
      ].join("\n")

    case "ozel": {
      const head = [`✨ ${BRAND()}`, ``, `Merhaba ${a.customerName},`, ``]
      const tail = [``, `${BRANDING.company.legalName} · ${BRANDING.company.phone}`]
      return [...head, a.customText?.trim() || "(mesajınızı buraya yazın)", ...tail].join("\n")
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  GÖNDERİM KANALLARI — müşteriye yönlendirilen derin bağlantılar
// ═══════════════════════════════════════════════════════════════════════════

/** Müşteriye WhatsApp derin bağlantısı (wa.me/<MÜŞTERİ>?text=…). */
export function customerWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phoneDigits(phone)}?text=${encodeURIComponent(message)}`
}

/** Müşteriye SMS derin bağlantısı (sms:+90…?body=… — iOS/Android uyumlu). */
export function customerSmsUrl(phone: string, message: string): string {
  const p = phoneDigits(phone)
  const body = encodeURIComponent(message)
  // iOS eski sürümlerde ';' — yeni sürümlerde '&' kullanır; standart '&' güvenlidir
  return `sms:+${p}?body=${body}`
}

/** Müşteriye e-posta bağlantısı (mailto:?subject=&body=). */
export function customerEmailUrl(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/** Bir bildirim için TÜM kanal bağlantılarını üretir. */
export function channelUrls(a: {
  phone: string
  email?: string | null
  message: string
  subject?: string
}): Array<{ channel: "whatsapp" | "sms" | "email"; url: string }> {
  const out: Array<{ channel: "whatsapp" | "sms" | "email"; url: string }> = [
    { channel: "whatsapp", url: customerWhatsAppUrl(a.phone, a.message) },
    { channel: "sms", url: customerSmsUrl(a.phone, a.message) },
  ]
  if (a.email) {
    out.push({ channel: "email", url: customerEmailUrl(a.email, a.subject ?? `${BRAND()} — Randevu Bilgilendirmesi`, a.message) })
  }
  return out
}

// ═══════════════════════════════════════════════════════════════════════════
//  SUNUCU KANCASI — yeni misafir randevusu oluşunca çağrılır (API tarafı)
// ═══════════════════════════════════════════════════════════════════════════

/** (V2 uyumluluğu) Stüdyoya «yeni talep» bildirimi — misafir WhatsApp butonu için. */
export function bookingMessage(b: BookingNotificationData): string {
  const lines = [
    `✨ ${BRAND()} — Yeni Randevu Talebi`,
    ``,
    `👤 ${b.customerName} (${b.customerPhone})`,
    `💅 ${b.serviceName}`,
    `📅 ${TL_DATE(b.startAt)} · ${TL_TIME(b.startAt)}`,
    `💰 ${PARA(b.price)}`,
  ]
  if (b.notes) lines.push(`📝 Not: ${b.notes}`)
  lines.push(``, `Onay için lütfen iletişime geçin. Teşekkürler! 🌸`)
  return lines.join("\n")
}

/** wa.me derin bağlantısı üretir (müşteri → stüdyo yönlendirmeli). */
export function whatsappUrl(message: string, phone?: string): string {
  const target = (phone ?? BRANDING.company.whatsapp ?? BRANDING.company.phone).replace(/\D/g, "")
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`
}

/**
 * Bildirim kancası: yeni randevu oluşunca çağrılır.
 * Şu an: mesajı loglar + WhatsApp bağlantısı döndürür (istemci «WhatsApp ile
 * gönder» butonunda kullanır). Gerçek SMS için sağlayıcı entegrasyonu eklenir.
 */
export function sendBookingNotification(b: BookingNotificationData): {
  whatsappUrl: string
  message: string
} {
  const message = bookingMessage(b)
  const url = whatsappUrl(message)
  // Kanal kancası (konsol → ileride Twilio/Meta Cloud API):
  console.log(`[BİLDİRİM] Yeni randevu: ${b.customerName} · ${b.serviceName} · ${TL_DATE(b.startAt)} ${TL_TIME(b.startAt)}`)
  return { whatsappUrl: url, message }
}
