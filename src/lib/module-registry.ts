// ═══════════════════════════════════════════════════════════════════════════
//  MODUL-REGISTRY (Team-Portal) — verbindet branding.ts-Module mit Icons & Views
//  Neue Views hier registrieren; Sichtbarkeit regelt branding.ts (enabled).
// ═══════════════════════════════════════════════════════════════════════════

import type { ElementType } from "react"
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, Sparkles, Image as ImageIcon, Settings,
} from "lucide-react"
import { DashboardView } from "@/components/staff/dashboard-view"
import { KalenderView } from "@/components/staff/kalender-view"
import { BuchungenView } from "@/components/staff/buchungen-view"
import { KundenView } from "@/components/staff/kunden-view"
import { LeistungenView } from "@/components/staff/leistungen-view"
import { GalerieView } from "@/components/staff/galerie-view"
import { EinstellungenView } from "@/components/staff/einstellungen-view"
import { ENABLED_MODULES, BRANDING, type ModuleConfig } from "@/config/branding"

// Icon-Zuordnung (Icon-Namen aus branding.ts)
const ICONS: Record<string, ElementType> = {
  "layout-dashboard": LayoutDashboard,
  "calendar-days": CalendarDays,
  "clipboard-list": ClipboardList,
  users: Users,
  sparkles: Sparkles,
  image: ImageIcon,
  settings: Settings,
}

// View-Komponenten-Zuordnung (Modul-ID → Komponente)
const VIEWS: Record<string, ElementType> = {
  dashboard: DashboardView,
  kalender: KalenderView,
  buchungen: BuchungenView,
  kunden: KundenView,
  leistungen: LeistungenView,
  galerie: GalerieView,
  einstellungen: EinstellungenView,
}

export interface RegisteredModule extends ModuleConfig {
  Icon: ElementType
  View: ElementType
}

/** Alle aktivierten Module inkl. Icon- und View-Auflösung. */
export const REGISTERED_MODULES: RegisteredModule[] = ENABLED_MODULES.map((m) => ({
  ...m,
  Icon: ICONS[m.icon] ?? LayoutDashboard,
  View: VIEWS[m.id],
})).filter((m) => m.View != null)

/** Sidebar-Gruppen in fester Reihenfolge, nur Gruppen mit aktiven Modulen. */
export const NAV_SECTIONS: Array<{ key: string; label: string; items: RegisteredModule[] }> = (
  [
    { key: "uebersicht", label: "Übersicht" },
    { key: "betrieb", label: "Betrieb" },
    { key: "stammdaten", label: "Stammdaten" },
  ] as const
)
  .map((g) => ({ ...g, items: REGISTERED_MODULES.filter((m) => m.group === g.key) }))
  .filter((g) => g.items.length > 0)

/** Standard-View: aus Config, mit Fallback auf erstes aktives Modul. */
export function resolveDefaultView(): string {
  const configured = BRANDING.defaultView
  if (REGISTERED_MODULES.some((m) => m.id === configured)) return configured
  return REGISTERED_MODULES[0]?.id ?? "dashboard"
}
