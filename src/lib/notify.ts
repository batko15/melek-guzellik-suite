// Bildirim kancaları (hooks) — randevu onayları için WhatsApp / SMS mantığı
// Pattern (araştırma): wa.me/<numara>?text=<önceden doldurulmuş mesaj> —
// API anahtarı gerektirmez, Instagram/WhatsApp Business akışıyla uyumludur.
//
// Üretimde gerçek SMS/WhatsApp gönderimi için (opsiyonel):
//   • Twilio WhatsApp API / Meta Cloud API → sendBookingNotification()
//     içindeki console.log satırını sağlayıcı çağrısıyla değiştirin.
//   • Hız sınırları ve şablon onayları sağlayıcı tarafında yönetilir.

import { BRANDING } from "@/config/branding"

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

/** Randevu özetini Türkçe mesaja dönüştürür. */
export function bookingMessage(b: BookingNotificationData): string {
  const lines = [
    `✨ ${BRANDING.brand.nameParts.join(" ")} — Yeni Randevu Talebi`,
    ``,
    `👤 ${b.customerName} (${b.customerPhone})`,
    `💅 ${b.serviceName}`,
    `📅 ${TL_DATE(b.startAt)} · ${TL_TIME(b.startAt)}`,
    `💰 ${Math.round(b.price).toLocaleString("tr-TR")} ${BRANDING.locale.currencySymbol}`,
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
