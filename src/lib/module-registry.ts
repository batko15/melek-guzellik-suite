// ═══════════════════════════════════════════════════════════════════════════
//  MODÜL KAYDI (Ekip Portalı) — branding.ts modüllerini ikonlar & görünümlerle bağlar
//  Yeni görünümleri burada kaydedin; görünürlüğü branding.ts düzenler (enabled).
// ═══════════════════════════════════════════════════════════════════════════

import type { ElementType } from "react"
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, Sparkles, Image as ImageIcon, Settings, Star, Boxes, Users2, Gift, Hourglass,
} from "lucide-react"
import { DashboardView } from "@/components/staff/dashboard-view"
import { KalenderView } from "@/components/staff/kalender-view"
import { RezervasyonView } from "@/components/staff/rezervasyon-view"
import { YorumlarView } from "@/components/staff/yorumlar-view"
import { MusterilerView } from "@/components/staff/musteriler-view"
import { HizmetlerView } from "@/components/staff/hizmetler-view"
import { GaleriView } from "@/components/staff/galeri-view"
import { AyarlarView } from "@/components/staff/ayarlar-view"
import { EnvanterView } from "@/components/staff/envanter-view"
import { EkipView } from "@/components/staff/ekip-view"
import { HediyeKartlariView } from "@/components/staff/hediye-kartlari-view"
import { BeklemeView } from "@/components/staff/bekleme-view"
import { ENABLED_MODULES, BRANDING, type ModuleConfig } from "@/config/branding"

// İkon ataması (branding.ts içindeki ikon adları)
const ICONS: Record<string, ElementType> = {
  "layout-dashboard": LayoutDashboard,
  "calendar-days": CalendarDays,
  "clipboard-list": ClipboardList,
  users: Users,
  sparkles: Sparkles,
  image: ImageIcon,
  settings: Settings,
  star: Star,
  boxes: Boxes,
  "users-2": Users2,
  gift: Gift,
  hourglass: Hourglass,
}

// Görünüm bileşenleri ataması (modül kimliği → bileşen)
const VIEWS: Record<string, ElementType> = {
  dashboard: DashboardView,
  kalender: KalenderView,
  randevular: RezervasyonView, // V3: Rezervasyon Merkezi (tam yönetim)
  yorumlar: YorumlarView,
  musteriler: MusterilerView,
  hizmetler: HizmetlerView,
  galeri: GaleriView,
  ayarlar: AyarlarView,
  envanter: EnvanterView, // V4: malzeme & stok takibi
  ekip: EkipView,          // V4: ekip üyeleri + prim hesaplayıcı
  hediyekartlari: HediyeKartlariView, // V5.4: dijital hediye kartı yönetimi
  bekleme: BeklemeView,             // V5.4: bekleme listesi + iptal geri doldurma
}

export interface RegisteredModule extends ModuleConfig {
  Icon: ElementType
  View: ElementType
}

/** Etkinleştirilmiş tüm modüller (ikon ve görünüm çözümleriyle). */
export const REGISTERED_MODULES: RegisteredModule[] = ENABLED_MODULES.map((m) => ({
  ...m,
  Icon: ICONS[m.icon] ?? LayoutDashboard,
  View: VIEWS[m.id],
})).filter((m) => m.View != null)

/** Kenar çubuğu grupları sabit sırayla; yalnızca etkin modülü olan gruplar. */
export const NAV_SECTIONS: Array<{ key: string; label: string; items: RegisteredModule[] }> = (
  [
    { key: "genelBakis", label: "Genel Bakış" },
    { key: "isletme", label: "İşletme" },
    { key: "kayitlar", label: "Kayıtlar" },
  ] as const
)
  .map((g) => ({ ...g, items: REGISTERED_MODULES.filter((m) => m.group === g.key) }))
  .filter((g) => g.items.length > 0)

/** Varsayılan görünüm: yapılandırmadan; ilk etkin modüle düşer. */
export function resolveDefaultView(): string {
  const configured = BRANDING.defaultView
  if (REGISTERED_MODULES.some((m) => m.id === configured)) return configured
  return REGISTERED_MODULES[0]?.id ?? "dashboard"
}
