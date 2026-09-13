// Salon veri tipleri & yardımcılar (istemci tarafı) — V2 Türkçe
import { BRANDING } from "@/config/branding"
import { cn } from "@/lib/utils"

export interface SalonService {
  id: string
  name: string
  category: "tirnak" | "guzellik" | "kirpik" | string
  description: string | null
  durationMin: number
  priceChf: number
  popular: boolean
  sortOrder: number
}

export interface SalonBooking {
  id: string
  startAt: string
  durationMin: number
  priceChf: number
  status: "bekliyor" | "onaylandi" | "tamamlandi" | "iptal" | "gelmedi" | string
  notes: string | null
  staffNote: string | null
  serviceId: string
  // V4
  deposit: number
  depositPaid: boolean
  staffId: string | null
  staffName: string | null
  loyaltyAwarded: boolean
  createdAt: string
  updatedAt: string
  service: { name: string; category: string }
  customer: {
    name: string
    phone: string
    email: string | null
    allergies: string | null
    sensitive: boolean
    loyaltyPoints: number
  }
}

export interface SalonCustomerRow {
  id: string
  name: string
  email: string | null
  phone: string
  notes: string | null
  // V4: müşteri kartı
  allergies: string | null
  sensitive: boolean
  prefShape: string | null
  prefGel: string | null
  prefColors: string | null
  loyaltyPoints: number
  portfolio: Array<{ id: string; title: string; imagePath: string; category: string }>
  loyaltyHistory: Array<{ points: number; reason: string; createdAt: string }>
  totalBookings: number
  completedBookings: number
  upcomingBookings: number
  volumeChf: number
  lastVisit: string | null
  since: string
}

export interface GalleryEntry {
  id: string
  title: string
  category: string
  imagePath: string
}

// ─── V4 ULTIMATE tipleri ─────────────────────────────────────────────────
export interface InventoryItemRow {
  id: string
  name: string
  category: string
  unit: string
  quantity: number
  minQuantity: number
  unitCost: number
  supplier: string | null
  active: boolean
  lowStock: boolean
  stockValue: number
  updatedAt: string
}

export interface StaffMemberRow {
  id: string
  name: string
  role: string
  commissionRate: number
  phone: string | null
  active: boolean
  stats: {
    bookings: number
    completed: number
    revenueChf: number
    commissionChf: number
    upcoming: number
    hoursBooked: number
  }
}

export interface ReminderRow {
  id: string
  startAt: string
  serviceName: string
  customerName: string
  customerPhone: string
  priceChf: number
  status: string
  deposit: number
  depositPaid: boolean
  hoursUntil: number
  message: string
  channels: Array<{ channel: "whatsapp" | "sms" | "email" | string; url: string }>
}

export const INVENTORY_CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  jel: { label: "Jel & UV", emoji: "✨" },
  akrilik: { label: "Akrilik & Toz", emoji: "🧪" },
  kirpik: { label: "Kirpik Malzemesi", emoji: "👁️" },
  bakim: { label: "Bakım & Yağlar", emoji: "🌸" },
  alet: { label: "Alet & Ekipman", emoji: "🔧" },
  diger: { label: "Diğer", emoji: "📦" },
}

export const SHAPE_LABELS: Record<string, string> = {
  badem: "Badem",
  oval: "Oval",
  kare: "Kare",
  yuvarlak: "Yuvarlak",
  stiletto: "Stiletto",
}

export const GEL_TYPE_LABELS: Record<string, string> = {
  jel: "Jel",
  akrilik: "Akrilik",
  dip: "Dip Powder (SDK)",
  "kalici-oje": "Kalıcı Oje",
  dogal: "Doğal Tırnak",
}

/** V4: Sadakat — ödül eşiği (damga sayısı). */
export const LOYALTY_REWARD_AT = 10

// ─── Bildirim günlüğü satırı (V3 — Rezervasyon Merkezi) ─────────────────────
export interface NotificationLogRow {
  id: string
  bookingId: string | null
  customer: string
  phone: string
  channel: "whatsapp" | "sms" | "email" | string
  kind: string
  message: string
  createdAt: string
}

export interface ReviewRow {
  id: string
  authorName: string
  rating: number
  comment: string
  status: string
  serviceName: string | null
  createdAt: string
}

export interface ReviewSummary {
  count: number
  average: number
  distribution: Array<{ star: number; count: number }>
  pending: number
}

export interface WeatherData {
  enabled: boolean
  city: string
  current?: {
    temp: number
    feelsLike: number
    humidity: number
    wind: number
    code: number
    isDay: boolean
    text: string
    icon: string
  }
  daily?: Array<{ date: string; code: number; max: number; min: number; text: string; icon: string }>
  careTip?: string
  updatedAt?: string
  error?: string
}

export interface SalonStats {
  today: { count: number; bookings: Array<SalonBooking & { serviceName: string; customerName: string }> }
  pending: number
  week: { bookings: number; revenueChf: number; utilization: number }
  month: { bookings: number; revenueChf: number }
  total: { bookings: number; completed: number; cancelled: number; customers: number; services: number; revenueChf: number }
  reviews: { total: number; approved: number; pending: number; average: number }
  topServices: Array<{ name: string; count: number; volume: number }>
  categories: Array<{ name: string; count: number }>
  revenueByWeek: Array<{ label: string; volume: number }>
  // V4 ULTIMATE KPI'ları (opsiyonel — eski önbelleklerle uyum için)
  v4?: { lowStock: number; inventoryValue: number; remindersDue: number; staffCount: number; loyaltyReady: number }
}

// ─── Biçimlendirme yardımcıları ─────────────────────────────────────────────
/** Para biçimi: "1.250 ₺" (Türkçe binlik ayraç + branding sembolü). */
export function para(value: number): string {
  return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.round(value))} ${BRANDING.locale.currencySymbol}`
}

/** Kuruşlu para biçimi. */
export function para2(value: number): string {
  return `${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${BRANDING.locale.currencySymbol}`
}

export function timeStr(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
}

export function dateStr(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
}

export function dateStrShort(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function weekdayStr(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { weekday: "short" })
}

export function weekdayLongStr(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { weekday: "long" })
}

export function minutesLabel(min: number): string {
  if (min < 60) return `${min} dk`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h} sa` : `${h} sa ${m} dk`
}

// ─── Durum meta verileri ────────────────────────────────────────────────────
export const BOOKING_STATUS: Record<string, { label: string; cls: string }> = {
  bekliyor: { label: "Bekliyor", cls: "bg-amber-950/60 text-amber-300 border-amber-800/50" },
  onaylandi: { label: "Onaylandı", cls: "bg-emerald-950/60 text-emerald-300 border-emerald-800/50" },
  tamamlandi: { label: "Tamamlandı", cls: "bg-secondary text-muted-foreground border-border" },
  gelmedi: { label: "Gelmedi", cls: "bg-purple-950/60 text-purple-300 border-purple-800/50" },
  iptal: { label: "İptal edildi", cls: "bg-red-950/60 text-red-300 border-red-800/50" },
}

export const REVIEW_STATUS: Record<string, { label: string; cls: string }> = {
  bekliyor: { label: "İncelemede", cls: "bg-amber-950/60 text-amber-300 border-amber-800/50" },
  onaylandi: { label: "Yayında", cls: "bg-emerald-950/60 text-emerald-300 border-emerald-800/50" },
  reddedildi: { label: "Reddedildi", cls: "bg-red-950/60 text-red-300 border-red-800/50" },
}

export const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  tirnak: { label: "Tırnak", emoji: "💅" },
  guzellik: { label: "Güzellik", emoji: "✨" },
  kirpik: { label: "Kirpik", emoji: "👁️" },
  studyo: { label: "Stüdyo", emoji: "🏛️" },
  paket: { label: "Paketler", emoji: "🎁" },
}

// ─── Yıldız yardımcıları ────────────────────────────────────────────────────
export function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} / 5 yıldız`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={cn(cls, i <= Math.round(value) ? "fill-current text-brand-text" : "fill-current text-muted-foreground/30")}
          aria-hidden
        >
          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17l-6.1 3.6 1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
        </svg>
      ))}
    </span>
  )
}

// ─── Çalışma saatleri yardımcıları ──────────────────────────────────────────
export function isOpenDay(date: Date): boolean {
  const h = BRANDING.openingHours[(date.getDay() + 6) % 7] // Pzt=0
  return !h?.closed
}

export function openSlots(date: Date): Array<{ hour: number; minute: number }> {
  const h = BRANDING.openingHours[(date.getDay() + 6) % 7]
  if (!h || h.closed) return []
  const match = h.hours.match(/(\d{2}):(\d{2})\s*[–-]\s*(\d{2}):(\d{2})/)
  if (!match) return []
  const [, h1, m1, h2, m2] = match.map(Number)
  const start = h1 * 60 + m1
  const end = h2 * 60 + m2
  const slots: Array<{ hour: number; minute: number }> = []
  for (let t = start; t < end; t += 30) {
    slots.push({ hour: Math.floor(t / 60), minute: t % 60 })
  }
  return slots
}
