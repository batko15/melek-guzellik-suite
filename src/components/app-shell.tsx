// Melek'ce Güzellik Suite — App-Shell (White-Label V1.0)
// Landing-Page (öffentlich) → Login (Kundinnen ODER Team) →
//   • Kundinnen-Portal (Buchung + Meine Termine)
//   • Team-Portal (Sidebar + Module aus branding.ts)
// ALLE Inhalte kommen aus src/config/branding.ts — dort abändern für neue Projekte.

"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Sparkles, Heart, Crown, Flower2, MapPin, Phone, LogOut, Menu, X,
  Activity, Instagram,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LandingPage } from "@/components/landing/landing-page"
import { LoginScreen, type LoginMode, type PortalSession } from "@/components/auth/login-screen"
import { CustomerPortal } from "@/components/customer/customer-portal"
import { BRANDING, BRAND_DISPLAY, MODULE_MAP } from "@/config/branding"
import { REGISTERED_MODULES, NAV_SECTIONS, resolveDefaultView } from "@/lib/module-registry"

const BRAND_ICONS: Record<string, React.ElementType> = { sparkles: Sparkles, heart: Heart, crown: Crown, flower: Flower2 }
const BrandIcon = BRAND_ICONS[BRANDING.brand.icon] ?? Sparkles

type View = string

// ═══════════════════════════════════════════════════════════════════════════
// TEAM-SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════

function SidebarContent({
  view, setView, onLogout, onNavigate, badge,
}: {
  view: View
  setView: (v: View) => void
  onLogout: () => void
  onNavigate?: () => void
  badge: number
}) {
  const { company } = BRANDING
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-[68px] shrink-0 items-center gap-3 border-b border-border/70 px-5">
        <div className="mk-gold-glow flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
          <BrandIcon className="h-4.5 w-4.5 h-[18px] w-[18px] text-brand-text" strokeWidth={1.6} />
        </div>
        <div className="leading-none">
          <div className="mk-display text-[14px] font-bold tracking-wide">
            <span className="text-foreground">{BRAND_DISPLAY.part1}</span>{" "}
            <span className="mk-gold-text">{BRAND_DISPLAY.part2}</span>
          </div>
          <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Team-Portal · V{BRANDING.version}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mk-scroll flex-1 overflow-y-auto px-3 py-4" aria-label="Hauptnavigation">
        {NAV_SECTIONS.map((section) => (
          <div key={section.key} className="mb-4">
            <div className="px-2.5 pb-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              {section.label}
            </div>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = view === item.id
                const showBadge = item.id === "buchungen" && badge > 0
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => { setView(item.id); onNavigate?.() }}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "mk-focus group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all",
                        active
                          ? "bg-primary/12 text-foreground"
                          : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-primary mk-gold-glow" />
                      )}
                      <item.Icon className={cn("h-[17px] w-[17px] shrink-0", active ? "text-brand-text" : "text-muted-foreground group-hover:text-foreground")} strokeWidth={1.8} />
                      <span className="flex-1">
                        <span className={cn("block text-[13px] font-semibold", active && "text-brand-text")}>{item.label}</span>
                        <span className="block text-[10px] text-muted-foreground">{item.hint}</span>
                      </span>
                      {showBadge && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/80 px-1.5 text-[10px] font-bold text-primary-foreground" aria-label={`${badge} offene Anfragen`}>
                          {badge}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        {/* Firmenblock */}
        <div className="mt-2 border-t border-border/70 pt-4">
          <div className="px-2.5 pb-2 text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            {company.legalName}
          </div>
          <div className="space-y-2 px-2.5 text-[11px] leading-relaxed text-muted-foreground">
            <span className="flex items-start gap-2"><MapPin className="mt-0.5 h-3 w-3 shrink-0 text-brand-text/70" />{company.street}, {company.city}</span>
            <span className="flex items-center gap-2"><Phone className="h-3 w-3 shrink-0 text-brand-text/70" />{company.phone}</span>
            <span className="flex items-center gap-2"><Instagram className="h-3 w-3 shrink-0 text-brand-text/70" />@{company.instagram}</span>
          </div>
        </div>
      </nav>

      {/* User-Karte */}
      <div className="shrink-0 border-t border-border/70 p-3">
        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5">
          <div className="mk-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-brand-text">
            {BRANDING.users[0]?.initials ?? "MK"}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[13px] font-semibold text-foreground">{BRANDING.users[0]?.name ?? "Team"}</div>
            <div className="truncate text-[10px] text-muted-foreground">{BRANDING.users[0]?.role ?? "Studio"}</div>
          </div>
          <button
            onClick={onLogout}
            title="Abmelden"
            aria-label="Abmelden"
            className="mk-focus flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// APP-SHELL
// ═══════════════════════════════════════════════════════════════════════════

function useClock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const tick = () => setNow(new Date())
    const t0 = setTimeout(tick, 0)
    const t = setInterval(tick, 1000)
    return () => { clearTimeout(t0); clearInterval(t) }
  }, [])
  return now
}

type Stage = "landing" | "login"

export function AppShell() {
  const [session, setSession] = useState<PortalSession | null>(null)
  const [stage, setStage] = useState<Stage>("landing")
  const [loginMode, setLoginMode] = useState<LoginMode>("customer")
  const [view, setView] = useState<View>(resolveDefaultView())
  const [mobileOpen, setMobileOpen] = useState(false)
  const now = useClock()

  // Offene Anfragen als Badge
  const { data: statsBadge } = useQuery({
    queryKey: ["salon-stats-badge"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/stats")
      if (!res.ok) return { pending: 0 }
      return (await res.json()) as { pending: number }
    },
    refetchInterval: 60000,
    enabled: session?.role === "staff",
  })
  const pending = statsBadge?.pending ?? 0

  // ESC schliesst mobiles Menü
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // ─── Öffentliche Landing-Page ───
  if (!session && stage === "landing") {
    return (
      <LandingPage
        onLogin={(mode) => { setLoginMode(mode); setStage("login") }}
      />
    )
  }

  // ─── Login (Kundinnen ODER Team) ───
  if (!session) {
    return (
      <LoginScreen
        mode={loginMode}
        onBack={() => setStage("landing")}
        onCustomerLogin={(c) => setSession(c)}
        onStaffLogin={(s) => setSession(s)}
      />
    )
  }

  // ─── Kundinnen-Portal (ohne Sidebar) ───
  if (session.role === "customer") {
    return <CustomerPortal session={session} onLogout={() => { setSession(null); setStage("landing") }} />
  }

  // ─── Team-Portal (Sidebar + Module) ───
  const meta = MODULE_MAP.get(view) ?? REGISTERED_MODULES[0]
  const ActiveView: React.ElementType | undefined = REGISTERED_MODULES.find((m) => m.id === view)?.View

  const timeStr = now
    ? now.toLocaleTimeString(BRANDING.locale.language, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--"
  const dateStr = now
    ? now.toLocaleDateString(BRANDING.locale.language, { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
    : ""

  return (
    <div className="flex min-h-screen bg-background">
      {/* ─── Sidebar (Desktop) ─── */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 border-r border-border/70 bg-card/40 lg:block">
        <SidebarContent view={view} setView={setView} onLogout={() => { setSession(null); setStage("landing") }} badge={pending} />
      </aside>

      {/* ─── Mobile-Sidebar (Overlay) ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="mk-anim-in absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="mk-anim-right absolute inset-y-0 left-0 w-[280px] border-r border-border bg-background shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Menü schliessen"
              className="mk-focus absolute right-3 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              view={view}
              setView={setView}
              onLogout={() => { setSession(null); setStage("landing") }}
              onNavigate={() => setMobileOpen(false)}
              badge={pending}
            />
          </div>
        </div>
      )}

      {/* ─── Hauptbereich ─── */}
      <div className="mk-velvet flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
          <div className="mk-gold-line h-0.5 w-full" />
          <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Menü öffnen"
              className="mk-focus flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1 leading-tight">
              <h1 className="mk-display truncate text-lg font-bold tracking-tight">{meta.title}</h1>
              <div className="hidden truncate text-[11px] text-muted-foreground sm:block">{meta.subtitle}</div>
            </div>

            {/* Offene Anfragen (mobil sichtbar) */}
            {pending > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView("buchungen")}
                className="h-9 rounded-full border-primary/40 px-3 text-xs font-semibold text-brand-text"
              >
                {pending} Anfrage{pending === 1 ? "" : "n"}
              </Button>
            )}

            {/* Live-Uhr */}
            <div className="hidden items-center gap-3 rounded-lg border border-border/70 bg-secondary/40 px-3.5 py-2 md:flex" aria-label="Aktuelle Uhrzeit">
              <div className="flex items-center gap-2 text-brand-text" title="System aktiv">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mk-anim-blink" />
                <Activity className="h-3.5 w-3.5" />
              </div>
              <div className="leading-none">
                <div className="font-mono text-sm font-semibold tabular-nums text-foreground">{timeStr}</div>
                <div className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">{dateStr}</div>
              </div>
            </div>

            {/* User */}
            <div className="flex items-center gap-2.5">
              <div className="hidden text-right leading-tight sm:block">
                <div className="text-xs font-semibold text-foreground">{session.name}</div>
                <div className="text-[10px] text-muted-foreground">{session.role}</div>
              </div>
              <div className="mk-display flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-brand-text">
                {session.initials}
              </div>
            </div>
          </div>
        </header>

        {/* Inhalt */}
        <main className="mk-anim-in min-h-0 flex-1" key={view}>
          {ActiveView ? <ActiveView /> : null}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-border/70 bg-card/30">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
            <div className="text-xs">
              <span className="font-bold text-foreground">{BRANDING.company.legalName}</span>
              <span className="text-brand-text"> · {BRAND_DISPLAY.part1}{BRAND_DISPLAY.part2} Suite V{BRANDING.version}</span>
              <span className="ml-2 hidden text-muted-foreground sm:inline">· {BRANDING.company.website}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
              <span>{BRANDING.company.footerClaim}</span>
              {BRANDING.footer.notes.map((n) => (
                <span key={n} className="hidden sm:inline">{n}</span>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
