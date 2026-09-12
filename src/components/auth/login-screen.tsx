// Login-Bildschirm — zwei Bereiche:
// 1. Kundinnen-Bereich: Name + E-Mail (ohne Passwort → Buchungs-Portal)
// 2. Team-Login: Benutzername + Passwort (→ Studio-Verwaltung)

"use client"

import { useState } from "react"
import { ArrowLeft, Sparkles, Heart, Crown, Flower2, Mail, User, Lock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BRANDING, BRAND_DISPLAY, type BrandUser } from "@/config/branding"

export type LoginMode = "customer" | "staff"

export interface CustomerSession {
  role: "customer"
  name: string
  email: string
}

export interface StaffSession {
  role: "staff"
  username: string
  name: string
  role: string
  initials: string
}

export type PortalSession = CustomerSession | StaffSession

const BRAND_ICONS: Record<string, React.ElementType> = { sparkles: Sparkles, heart: Heart, crown: Crown, flower: Flower2 }
const BrandIcon = BRAND_ICONS[BRANDING.brand.icon] ?? Sparkles

export function LoginScreen({
  mode, onBack, onCustomerLogin, onStaffLogin,
}: {
  mode: LoginMode
  onBack: () => void
  onCustomerLogin: (c: CustomerSession) => void
  onStaffLogin: (s: StaffSession) => void
}) {
  const { company } = BRANDING

  // Kundinnen-Formular
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [customerError, setCustomerError] = useState("")
  const [customerLoading, setCustomerLoading] = useState(false)

  // Team-Formular
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [staffError, setStaffError] = useState("")
  const [staffLoading, setStaffLoading] = useState(false)

  const submitCustomer = (e?: React.FormEvent) => {
    e?.preventDefault()
    setCustomerError("")
    if (!name.trim() || name.trim().length < 2) {
      setCustomerError("Bitte geben Sie Ihren Namen ein.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setCustomerError("Bitte geben Sie eine gültige E-Mail-Adresse ein.")
      return
    }
    setCustomerLoading(true)
    setTimeout(() => {
      onCustomerLogin({ role: "customer", name: name.trim(), email: email.trim().toLowerCase() })
    }, 500)
  }

  const submitStaff = (e?: React.FormEvent) => {
    e?.preventDefault()
    setStaffError("")
    const found: BrandUser | undefined = BRANDING.users.find(
      (u) => u.username === username.trim().toLowerCase() && u.password === password,
    )
    if (!found) {
      setStaffError("Benutzername oder Passwort ist falsch — Demo-Zugang unten antippen.")
      return
    }
    setStaffLoading(true)
    setTimeout(() => {
      onStaffLogin({ role: "staff", username: found.username, name: found.name, role: found.role, initials: found.initials })
    }, 500)
  }

  const autofillDemo = (demo: { name: string; email: string }) => {
    setName(demo.name)
    setEmail(demo.email)
    setCustomerError("")
  }

  const autofillStaff = (u: BrandUser) => {
    setUsername(u.username)
    setPassword(u.password)
    setStaffError("")
  }

  return (
    <div className="mk-velvet relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Goldener Glow-Hintergrund */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[130px]" />
        <div className="absolute -bottom-40 right-1/4 h-[380px] w-[380px] rounded-full bg-primary/6 blur-[120px]" />
        <div className="absolute inset-x-0 top-0 h-0.5 mk-gold-line" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Zurück zur Landing-Page */}
        <button
          onClick={onBack}
          className="mk-focus mb-6 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück zur Webseite
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
              {BRANDING.brand.tagline}
            </span>
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-text">
              V{BRANDING.version}
            </span>
          </div>
        </div>

        <div className="mk-card mk-anim-up rounded-2xl p-7 backdrop-blur-sm sm:p-8">
          <Tabs defaultValue={mode}>
            <TabsList className="mb-6 grid h-11 w-full grid-cols-2 rounded-full bg-secondary/60 p-1">
              <TabsTrigger value="customer" className="rounded-full text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Kundinnen-Bereich
              </TabsTrigger>
              <TabsTrigger value="staff" className="rounded-full text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Team-Login
              </TabsTrigger>
            </TabsList>

            {/* ═══ Kundinnen ═══ */}
            <TabsContent value="customer">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-text">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mk-anim-blink" />
                Termin buchen & verwalten
              </div>
              <h2 className="mk-display text-2xl font-bold">Willkommen, liebe Kundin</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Mit Name und E-Mail anmelden — ganz ohne Passwort.
              </p>

              <form onSubmit={submitCustomer} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cust-name" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Ihr Name
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="cust-name"
                      placeholder="z. B. Elif Yilmaz"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mk-focus h-11 rounded-xl pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cust-email" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    E-Mail
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="cust-email"
                      type="email"
                      placeholder="ihre.email@example.ch"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mk-focus h-11 rounded-xl pl-10"
                    />
                  </div>
                </div>

                {customerError && (
                  <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive">
                    {customerError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={customerLoading}
                  className="mk-gold-glow mt-2 h-11 w-full rounded-full text-sm font-bold tracking-wide"
                >
                  {customerLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                      Anmelden …
                    </span>
                  ) : (
                    <>
                      Zum Buchungs-Portal <ChevronRight className="ml-1 h-4 w-4" strokeWidth={2.5} />
                    </>
                  )}
                </Button>
              </form>

              {BRANDING.customerPortal.demoCustomers.length > 0 && (
                <div className="mt-6 border-t border-border/70 pt-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Demo-Kundinnen — antippen zum Ausfüllen
                  </div>
                  <div className="mt-3 grid gap-2 min-[420px]:grid-cols-2">
                    {BRANDING.customerPortal.demoCustomers.map((d) => (
                      <button
                        key={d.email}
                        type="button"
                        onClick={() => autofillDemo(d)}
                        className="mk-focus group flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/10"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/15 text-[9px] font-bold text-brand-text">
                          {d.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                        </span>
                        <span className="truncate text-foreground/90">{d.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ═══ Team ═══ */}
            <TabsContent value="staff">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-text">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mk-anim-blink" />
                Studio-Verwaltung
              </div>
              <h2 className="mk-display text-2xl font-bold">Team-Login</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Zugang zur Buchungs-Verwaltung, Kundinnen und Berichten.
              </p>

              <form onSubmit={submitStaff} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-user" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Benutzername
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="staff-user"
                      placeholder={`z. B. ${BRANDING.users[0]?.username ?? "melek"}`}
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="mk-focus h-11 rounded-xl pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-pass" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Passwort
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

                {staffError && (
                  <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive">
                    {staffError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={staffLoading}
                  className="mk-gold-glow mt-2 h-11 w-full rounded-full text-sm font-bold tracking-wide"
                >
                  {staffLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                      Anmeldung läuft …
                    </span>
                  ) : (
                    <>
                      Anmelden <ChevronRight className="ml-1 h-4 w-4" strokeWidth={2.5} />
                    </>
                  )}
                </Button>
              </form>

              {BRANDING.users.length > 0 && (
                <div className="mt-6 border-t border-border/70 pt-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Demo-Zugänge — antippen zum Ausfüllen
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
                        <span className="hidden truncate text-muted-foreground group-hover:hidden">· {u.role}</span>
                        <ChevronRight className="ml-auto hidden h-3 w-3 shrink-0 text-primary group-hover:block" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
          {company.legalName} · {company.street} · {company.city}
          <br />
          {BRANDING.brand.sloganDe}
        </p>
      </div>
    </div>
  )
}
