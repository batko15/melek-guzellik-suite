// Salon-Daten-Typen & Helpers (Client-seitig)
import { BRANDING } from "@/config/branding"

export interface SalonService {
  id: string
  name: string
  category: "naegel" | "beauty" | "wimpern" | string
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
  status: "angefragt" | "bestaetigt" | "abgeschlossen" | "storniert" | string
  notes: string | null
  service: { name: string; category: string }
  customer: { name: string; email: string; phone: string | null }
}

export interface SalonCustomer {
  id: string
  name: string
  email: string
  phone: string | null
  notes: string | null
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

export interface SalonStats {
  today: { count: number; bookings: Array<SalonBooking & { serviceName: string; customerName: string }> }
  pending: number
  week: { bookings: number; revenueChf: number; utilization: number }
  total: { bookings: number; completed: number; cancelled: number; customers: number; services: number; revenueChf: number }
  topServices: Array<{ name: string; count: number; volume: number }>
  categories: Array<{ name: string; count: number }>
  revenueByWeek: Array<{ label: string; volume: number }>
}

// ─── Formatierungs-Helfer ───────────────────────────────────────────────────
export function chf(value: number): string {
  return new Intl.NumberFormat("de-CH", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

export function chf2(value: number): string {
  return new Intl.NumberFormat("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

export function timeStr(iso: string): string {
  return new Date(iso).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })
}

export function dateStr(iso: string): string {
  return new Date(iso).toLocaleDateString("de-CH", { day: "2-digit", month: "short", year: "numeric" })
}

export function weekdayStr(iso: string): string {
  return new Date(iso).toLocaleDateString("de-CH", { weekday: "short" })
}

export function minutesLabel(min: number): string {
  if (min < 60) return `${min} Min.`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h} Std.` : `${h} Std. ${m} Min.`
}

// ─── Status-Metadaten ───────────────────────────────────────────────────────
export const BOOKING_STATUS: Record<string, { label: string; cls: string }> = {
  angefragt: { label: "Angefragt", cls: "bg-amber-950/60 text-amber-300 border-amber-800/50" },
  bestaetigt: { label: "Bestätigt", cls: "bg-emerald-950/60 text-emerald-300 border-emerald-800/50" },
  abgeschlossen: { label: "Abgeschlossen", cls: "bg-secondary text-muted-foreground border-border" },
  storniert: { label: "Storniert", cls: "bg-red-950/60 text-red-300 border-red-800/50" },
}

export const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  naegel: { label: "Nägel", emoji: "💅" },
  beauty: { label: "Beauty", emoji: "✨" },
  wimpern: { label: "Wimpern", emoji: "👁️" },
  studio: { label: "Studio", emoji: "🏛️" },
}

// ─── Öffnungszeiten-Helfer ─────────────────────────────────────────────────
export function isOpenDay(date: Date): boolean {
  const h = BRANDING.openingHours[(date.getDay() + 6) % 7] // Mo=0
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
