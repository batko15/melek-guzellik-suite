// Melek'çe Güzellik Suite — Uygulama Kabuğu (White-Label V2.0)
// HERKES AÇIK alan: Açılış sayfası → Randevu Al (girişsiz) → Yorumlar (girişsiz)
// Ekip alanı: Giriş → Ekip portalı (kenar çubuğu + branding.ts modülleri)
// Tüm içerikler src/config/branding.ts dosyasından gelir — yeni projeler için orayı değiştirin.
// Mobil: alt gezinme çubuğu (uygulama hissi) · Masaüstü: üst gezinme çubuğu

"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  MapPin, Phone, LogOut, Menu, X,
  Activity, Instagram, Home, CalendarCheck, Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LandingPage } from "@/components/landing/landing-page"
import { BookingFlow } from "@/components/public/booking-flow"
import { ReviewsPage } from "@/components/public/reviews-page"
import { LoginScreen, type StaffSession } from "@/components/auth/login-screen"
import { BRANDING, BRAND_DISPLAY, MODULE_MAP } from "@/config/branding"
import { REGISTERED_MODULES, NAV_SECTIONS, resolveDefaultView } from "@/lib/module-registry"

type PublicView = "landing" | "randevu" | "yorumlar"
type Stage = PublicView | "login"

// ═══════════════════════════════════════════════════════════════════════════
// MOBİL ALT GEZİNME (herkese açık alan) — telefon için uygulama hissi
// ═══════════════════════════════════════════════════════════════════════════

const PUBLIC_NAV: Array<{ id: PublicView; label: string; Icon: React.ElementType }> = [
  { id: "landing", label: "Ana Sayfa", Icon: Home },
  { id: "randevu", label: "Randevu", Icon: CalendarCheck },
  { id: "yorumlar", label: "Yorumlar", Icon: Star },
]

function MobileBottomNav({ view, setView }: { view: PublicView; setView: (v: PublicView) => void }) {
  return (
    <nav
      aria-label="Alt gezinme"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch">
        {PUBLIC_NAV.map((item) => {
          const active = view === item.id
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              aria-current={active ? "page" : undefined}
              className="mk-focus relative flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 px-2 py-2"
            >
              {active && <span className="absolute top-0 h-[3px] w-10 rounded-b-full bg-primary mk-gold-glow" />}
              <item.Icon
                className={cn("h-5 w-5", active ? "text-brand-text" : "text-muted-foreground")}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span className={cn("text-[10px] font-bold", active ? "text-foreground" : "text-muted-foreground")}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// EKİP KENAR ÇUBUĞU
// ═══════════════════════════════════════════════════════════════════════════

function SidebarContent({
  view, setView, onLogout, onNavigate, badge, reviewBadge,
}: {
  view: string
  setView: (v: string) => void
  onLogout: () => void
  onNavigate?: () => void
  badge: number
  reviewBadge: number
}) {
  const { company } = BRANDING
  return (
    <div className="flex h-full flex-col">
      {/* Logo — gerçek marka */}
      <div className="flex h-[68px] shrink-0 items-center gap-3 border-b border-border/70 px-5">
        <span className="mk-gold-glow mk-logo-sheen relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/45 bg-primary/8">
          <img
            src={BRANDING.brand.logoWing}
            alt="Melek'çe Güzellik — melek kanadı"
            className="h-full w-full scale-[1.18] object-cover"
          />
        </span>
        <div className="leading-none">
          <div className="mk-display text-[14px] font-bold tracking-wide">
            <span className="text-foreground">{BRAND_DISPLAY.part1}</span>{" "}
            <span className="mk-gold-text">{BRAND_DISPLAY.part2}</span>
          </div>
          <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Ekip Portalı · V{BRANDING.version}
          </div>
        </div>
      </div>

      {/* Gezinme */}
      <nav className="mk-scroll flex-1 overflow-y-auto px-3 py-4" aria-label="Ana gezinme">
        {NAV_SECTIONS.map((section) => (
          <div key={section.key} className="mb-4">
            <div className="px-2.5 pb-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              {section.label}
            </div>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = view === item.id
                const showBadge =
                  (item.id === "randevular" && badge > 0) ||
                  (item.id === "yorumlar" && reviewBadge > 0)
                const badgeValue = item.id === "randevular" ? badge : reviewBadge
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
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/80 px-1.5 text-[10px] font-bold text-primary-foreground" aria-label={`${badgeValue} bekleyen`}>
                          {badgeValue}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        {/* Şirket bloğu */}
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

      {/* Kullanıcı kartı */}
      <div className="shrink-0 border-t border-border/70 p-3">
        <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5">
          <div className="mk-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-brand-text">
            {BRANDING.users[0]?.initials ?? "MK"}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[13px] font-semibold text-foreground">{BRANDING.users[0]?.name ?? "Ekip"}</div>
            <div className="truncate text-[10px] text-muted-foreground">{BRANDING.users[0]?.role ?? "Stüdyo"}</div>
          </div>
          <button
            onClick={onLogout}
            title="Çıkış yap"
            aria-label="Çıkış yap"
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
// UYGULAMA KABUĞU
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

/** V5.3: Öffentliche Ansicht → echter URL-Pfad (SEO + teilbare Links). */
function pathForView(v: PublicView): string {
  return v === "landing" ? "/" : `/${v}`
}

/** V5.3: URL-Pfad → öffentliche Ansicht („/randevu“ → „randevu“). */
function viewForPath(p: string): PublicView {
  const clean = p.replace(/\/+$/, "")
  if (clean === "/randevu") return "randevu"
  if (clean === "/yorumlar") return "yorumlar"
  return "landing"
}

export function AppShell({ initialStage }: { initialStage?: PublicView }) {
  const [session, setSession] = useState<StaffSession | null>(null)
  const [stage, setStage] = useState<Stage>(initialStage ?? "landing")
  const [view, setView] = useState<string>(resolveDefaultView())
  const [mobileOpen, setMobileOpen] = useState(false)
  const now = useClock()

  // Bekleyen randevular + bekleyen yorumlar (rozetler)
  const { data: statsBadge } = useQuery({
    queryKey: ["salon-stats-badge"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/stats")
      if (!res.ok) return { pending: 0, reviews: { pending: 0 } }
      return (await res.json()) as { pending: number; reviews?: { pending: number } }
    },
    refetchInterval: 60000,
    enabled: session?.role === "staff",
  })
  const pending = statsBadge?.pending ?? 0
  const reviewPending = statsBadge?.reviews?.pending ?? 0

  // ESC mobil menüyü kapatır
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Görünümler arası gezinme olayı (örn. gösterge tablosu → Rezervasyon Merkezi)
  useEffect(() => {
    const onGoto = (e: Event) => {
      const view = (e as CustomEvent<string>).detail
      if (typeof view === "string" && MODULE_MAP.has(view)) setView(view)
    }
    window.addEventListener("mk-goto", onGoto)
    return () => window.removeEventListener("mk-goto", onGoto)
  }, [])

  // Tarayıcı geçmişi: hash (eski bağlantılar) + gerçek URL yolları (V5.3)
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "")
      if (h === "randevu" || h === "yorumlar" || h === "") {
        if (!session) setStage(h === "" ? viewForPath(window.location.pathname) : (h as PublicView))
      }
    }
    onHash() // doğrudan #randevu / #yorumlar ile açılışta da çalışsın
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [session])

  // V5.3: Zurück/Vorwärts-Knöpfe des Browsers synchronisieren
  useEffect(() => {
    const onPop = () => {
      if (session) return
      const h = window.location.hash.replace("#", "")
      if (h === "randevu" || h === "yorumlar") {
        setStage(h)
        return
      }
      setStage(viewForPath(window.location.pathname))
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [session])

  const goPublic = (v: PublicView) => {
    // V5.3: echte URL-Pfade — teilbar, SEO-fähig, Back-Button-freundlich
    const target = pathForView(v)
    if (window.location.pathname !== target) {
      window.history.pushState({}, "", target)
    }
    setStage(v)
    window.scrollTo({ top: 0 })
  }

  // ─── Herkese açık: Açılış sayfası ───
  if (!session && stage === "landing") {
    return (
      <>
        <LandingPage
          onBook={() => goPublic("randevu")}
          onReviews={() => goPublic("yorumlar")}
          onStaffLogin={() => setStage("login")}
        />
        <MobileBottomNav view="landing" setView={goPublic} />
      </>
    )
  }

  // ─── Herkese açık: Randevu Al (girişsiz) ───
  if (!session && stage === "randevu") {
    return (
      <>
        <BookingFlow
          onBack={() => goPublic("landing")}
          onReviews={() => goPublic("yorumlar")}
          onStaffLogin={() => setStage("login")}
        />
        <MobileBottomNav view="randevu" setView={goPublic} />
      </>
    )
  }

  // ─── Herkese açık: Yorumlar (girişsiz) ───
  if (!session && stage === "yorumlar") {
    return (
      <>
        <ReviewsPage
          onBack={() => goPublic("landing")}
          onBook={() => goPublic("randevu")}
          onStaffLogin={() => setStage("login")}
        />
        <MobileBottomNav view="yorumlar" setView={goPublic} />
      </>
    )
  }

  // ─── Ekip girişi ───
  if (!session) {
    return (
      <LoginScreen
        onBack={() => goPublic("landing")}
        onStaffLogin={(s) => setSession(s)}
      />
    )
  }

  // ─── Ekip portalı (kenar çubuğu + modüller) ───
  const meta = MODULE_MAP.get(view) ?? REGISTERED_MODULES[0]
  const ActiveView: React.ElementType | undefined = REGISTERED_MODULES.find((m) => m.id === view)?.View

  const timeStr = now
    ? now.toLocaleTimeString(BRANDING.locale.language, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--"
  const dateStr = now
    ? now.toLocaleDateString(BRANDING.locale.language, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : ""

  return (
    <div className="flex min-h-screen bg-background">
      {/* ─── Kenar çubuğu (masaüstü) ─── */}
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 border-r border-border/70 bg-card/40 md:block lg:w-[264px]">
        <SidebarContent view={view} setView={setView} onLogout={() => { setSession(null); goPublic("landing") }} badge={pending} reviewBadge={reviewPending} />
      </aside>

      {/* ─── Mobil kenar çubuğu (katman) ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="mk-anim-in absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="mk-anim-right absolute inset-y-0 left-0 w-[280px] border-r border-border bg-background shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Menüyü kapat"
              className="mk-focus absolute right-3 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              view={view}
              setView={setView}
              onLogout={() => { setSession(null); goPublic("landing") }}
              onNavigate={() => setMobileOpen(false)}
              badge={pending}
              reviewBadge={reviewPending}
            />
          </div>
        </div>
      )}

      {/* ─── Ana alan ─── */}
      <div className="mk-velvet flex min-w-0 flex-1 flex-col">
        {/* Üst bar */}
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
          <div className="mk-gold-line h-0.5 w-full" />
          <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Menüyü aç"
              className="mk-focus flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1 leading-tight">
              <h1 className="mk-display truncate text-lg font-bold tracking-tight">{meta.title}</h1>
              <div className="hidden truncate text-[11px] text-muted-foreground sm:block">{meta.subtitle}</div>
            </div>

            {/* Bekleyenler (mobilde görünür) */}
            {pending > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView("randevular")}
                className="h-9 rounded-full border-primary/40 px-3 text-xs font-semibold text-brand-text"
              >
                {pending} talep
              </Button>
            )}
            {reviewPending > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView("yorumlar")}
                className="h-9 hidden rounded-full border-primary/40 px-3 text-xs font-semibold text-brand-text min-[420px]:flex"
              >
                {reviewPending} yorum
              </Button>
            )}

            {/* Canlı saat */}
            <div className="hidden items-center gap-3 rounded-lg border border-border/70 bg-secondary/40 px-3.5 py-2 md:flex" aria-label="Şu anki saat">
              <div className="flex items-center gap-2 text-brand-text" title="Sistem aktif">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mk-anim-blink" />
                <Activity className="h-3.5 w-3.5" />
              </div>
              <div className="leading-none">
                <div className="font-mono text-sm font-semibold tabular-nums text-foreground">{timeStr}</div>
                <div className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">{dateStr}</div>
              </div>
            </div>

            {/* Kullanıcı */}
            <div className="flex items-center gap-2.5">
              <div className="hidden text-right leading-tight sm:block">
                <div className="text-xs font-semibold text-foreground">{session.name}</div>
                <div className="text-[10px] text-muted-foreground">{session.roleLabel}</div>
              </div>
              <div className="mk-display flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-brand-text">
                {session.initials}
              </div>
            </div>
          </div>
        </header>

        {/* İçerik */}
        <main className="mk-anim-in min-h-0 flex-1" key={view}>
          {ActiveView ? <ActiveView /> : null}
        </main>

        {/* Alt bilgi */}
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
