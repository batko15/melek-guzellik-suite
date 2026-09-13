// Ekip Girişi — yalnızca stüdyo ekibi için (kullanıcı adı + şifre)
// Misafirler için giriş GEREKMEZ: randevu ve değerlendirme herkese açık.

"use client"

import { useState } from "react"
import { ArrowLeft, Sparkles, Heart, Crown, Flower2, User, Lock, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BRANDING, BRAND_DISPLAY, type BrandUser } from "@/config/branding"

export interface StaffSession {
  role: "staff"
  username: string
  name: string
  roleLabel: string
  initials: string
}

const BRAND_ICONS: Record<string, React.ElementType> = { sparkles: Sparkles, heart: Heart, crown: Crown, flower: Flower2 }
const BrandIcon = BRAND_ICONS[BRANDING.brand.icon] ?? Sparkles

export function LoginScreen({
  onBack, onStaffLogin,
}: {
  onBack: () => void
  onStaffLogin: (s: StaffSession) => void
}) {
  const { company } = BRANDING

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submitStaff = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError("")
    const found: BrandUser | undefined = BRANDING.users.find(
      (u) => u.username === username.trim().toLowerCase() && u.password === password,
    )
    if (!found) {
      setError("Kullanıcı adı veya şifre hatalı — aşağıdaki demo girişine dokunun.")
      return
    }
    setLoading(true)
    setTimeout(() => {
      onStaffLogin({ role: "staff", username: found.username, name: found.name, roleLabel: found.role, initials: found.initials })
    }, 400)
  }

  const autofillStaff = (u: BrandUser) => {
    setUsername(u.username)
    setPassword(u.password)
    setError("")
  }

  return (
    <div className="mk-velvet relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Altın parlama arka planı */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[130px]" />
        <div className="absolute -bottom-40 right-1/4 h-[380px] w-[380px] rounded-full bg-primary/6 blur-[120px]" />
        <div className="absolute inset-x-0 top-0 h-0.5 mk-gold-line" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Ana sayfaya dön */}
        <button
          onClick={onBack}
          className="mk-focus mb-6 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Ana sayfaya dön
        </button>

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mk-anim-pulse mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
            <BrandIcon className="h-8 w-8 text-brand-text" strokeWidth={1.5} />
          </div>
          <div className="mk-display text-2xl font-bold tracking-wide">
            <span className="text-foreground">{BRAND_DISPLAY.part1}</span>{" "}
            <span className="mk-gold-text">{BRAND_DISPLAY.part2}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Ekip Girişi
            </span>
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-text">
              V{BRANDING.version}
            </span>
          </div>
        </div>

        <div className="mk-card mk-anim-up rounded-2xl p-7 backdrop-blur-sm sm:p-8">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-text">
            <span className="h-1.5 w-1.5 rounded-full bg-primary mk-anim-blink" />
            Stüdyo Yönetimi
          </div>
          <h2 className="mk-display text-2xl font-bold">Hoş geldiniz</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Randevu yönetimi, yorumlar, müşteriler ve raporlar için giriş yapın.
          </p>

          <form onSubmit={submitStaff} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-user" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Kullanıcı adı
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="staff-user"
                  placeholder={`örn. ${BRANDING.users[0]?.username ?? "melek"}`}
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mk-focus h-11 rounded-xl pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-pass" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Şifre
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="staff-pass"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mk-focus h-11 rounded-xl pl-10"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mk-gold-glow mt-2 h-11 w-full rounded-full text-sm font-bold tracking-wide"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Giriş yapılıyor…
                </span>
              ) : (
                <>
                  Giriş yap <ChevronRight className="ml-1 h-4 w-4" strokeWidth={2.5} />
                </>
              )}
            </Button>
          </form>

          {BRANDING.users.length > 0 && (
            <div className="mt-6 border-t border-border/70 pt-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Demo girişleri — doldurmak için dokunun
              </div>
              <div className="mt-3 grid gap-2 min-[420px]:grid-cols-2">
                {BRANDING.users.map((u) => (
                  <button
                    key={u.username}
                    type="button"
                    onClick={() => autofillStaff(u)}
                    className="mk-focus group flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/10"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/15 text-[9px] font-bold text-brand-text">
                      {u.initials}
                    </span>
                    <span className="truncate text-foreground/90">{u.username}</span>
                    <ChevronRight className="ml-auto hidden h-3 w-3 shrink-0 text-primary group-hover:block" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-5 border-t border-border/70 pt-4 text-center text-[11px] text-muted-foreground">
            Misafir misiniz? Randevu almak ve değerlendirme yazmak için <span className="font-semibold text-brand-text">giriş gerekmez</span>.
          </p>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
          {company.legalName} · {company.street} · {company.city}
          <br />
          «{BRANDING.brand.slogan}»
        </p>
      </div>
    </div>
  )
}
