// Kundinnen-Portal: Termin buchen (3 Schritte) + Meine Termine
// Mobil-first — ohne Sidebar, einfache Tab-Navigation oben.

"use client"

import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CalendarCheck, Clock, ChevronRight, ChevronLeft, Sparkles, CheckCircle2, XCircle,
  CalendarDays, LogOut, Check, Heart, Phone, Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"
import type { CustomerSession } from "@/components/auth/login-screen"
import {
  type SalonService, type SalonBooking, CATEGORY_META, BOOKING_STATUS,
  chf, minutesLabel, timeStr, dateStr, weekdayStr, isOpenDay, openSlots,
} from "@/lib/salon"

type Step = 1 | 2 | 3
type PortalTab = "book" | "mine"

// ─── Datums-Helfer ──────────────────────────────────────────────────────────
function nextDays(count: number): Date[] {
  const days: Date[] = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  while (days.length < count) {
    if (isOpenDay(d)) days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

function toLocalIso(d: Date, hour: number, minute: number): string {
  const dt = new Date(d)
  dt.setHours(hour, minute, 0, 0)
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString()
}

export function CustomerPortal({ session, onLogout }: { session: CustomerSession; onLogout: () => void }) {
  const [tab, setTab] = useState<PortalTab>("book")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // ─── Buchungsflow-State ──
  const [step, setStep] = useState<Step>(1)
  const [service, setService] = useState<SalonService | null>(null)
  const [day, setDay] = useState<Date | null>(null)
  const [slot, setSlot] = useState<{ hour: number; minute: number } | null>(null)
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<SalonBooking | null>(null)

  // Leistungen laden
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ["salon-services"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/services")
      if (!res.ok) return { services: [] as SalonService[] }
      return (await res.json()) as { services: SalonService[] }
    },
  })
  const services = servicesData?.services ?? []

  // Meine Termine laden
  const { data: myBookings, refetch: refetchMine } = useQuery({
    queryKey: ["my-bookings", session.email],
    queryFn: async () => {
      const res = await fetch(`/api/v1/salon/bookings?email=${encodeURIComponent(session.email)}`)
      if (!res.ok) return { bookings: [] as SalonBooking[] }
      return (await res.json()) as { bookings: SalonBooking[] }
    },
  })

  // Belegte Slots für gewählten Tag
  const { data: dayBookings } = useQuery({
    queryKey: ["day-bookings", day?.toDateString()],
    queryFn: async () => {
      if (!day) return { bookings: [] as SalonBooking[] }
      const from = new Date(day)
      from.setHours(0, 0, 0, 0)
      const to = new Date(from)
      to.setDate(to.getDate() + 1)
      const res = await fetch(`/api/v1/salon/bookings?from=${from.toISOString()}&to=${to.toISOString()}`)
      if (!res.ok) return { bookings: [] as SalonBooking[] }
      return (await res.json()) as { bookings: SalonBooking[] }
    },
    enabled: !!day,
  })

  const days = useMemo(() => nextDays(14), [])
  const slots = useMemo(() => (day ? openSlots(day) : []), [day])

  // Slot-Belegung prüfen (in der Vergangenheit oder überlappend)
  const isSlotBlocked = (hour: number, minute: number) => {
    if (!day) return true
    const start = new Date(day)
    start.setHours(hour, minute, 0, 0)
    if (start < new Date()) return true
    if (!service) return false
    const end = new Date(start.getTime() + service.durationMin * 60000)
    return (dayBookings?.bookings ?? []).some((b) => {
      if (b.status === "storniert" || b.status === "abgeschlossen") return false
      const bEnd = new Date(new Date(b.startAt).getTime() + b.durationMin * 60000)
      const bStart = new Date(b.startAt)
      return bStart < end && bEnd > start
    })
  }

  const submitBooking = async () => {
    if (!service || !day || !slot) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/v1/salon/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: session.name,
          customerEmail: session.email,
          customerPhone: phone || undefined,
          serviceId: service.id,
          startAt: toLocalIso(day, slot.hour, slot.minute),
          notes: notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: "Buchung nicht möglich", description: data.error ?? "Bitte versuchen Sie es erneut.", variant: "destructive" })
        setSubmitting(false)
        return
      }
      setSuccess(data.booking as SalonBooking)
      refetchMine()
      queryClient.invalidateQueries({ queryKey: ["day-bookings"] })
      toast({
        title: "Termin angefragt ✓",
        description: `${service.name} am ${dateStr(toLocalIso(day, slot.hour, slot.minute))} um ${String(slot.hour).padStart(2, "0")}:${String(slot.minute).padStart(2, "0")} Uhr`,
      })
    } catch {
      toast({ title: "Netzwerkfehler", description: "Bitte erneut versuchen.", variant: "destructive" })
    }
    setSubmitting(false)
  }

  const cancelBooking = async (id: string) => {
    try {
      const res = await fetch("/api/v1/salon/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "storniert" }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Termin storniert", description: "Wir freuen uns auf Ihren nächsten Besuch!" })
      refetchMine()
    } catch {
      toast({ title: "Nicht möglich", description: "Termin konnte nicht storniert werden.", variant: "destructive" })
    }
  }

  const resetFlow = () => {
    setStep(1); setService(null); setDay(null); setSlot(null); setNotes(""); setSuccess(null)
  }

  const upcoming = (myBookings?.bookings ?? []).filter((b) => new Date(b.startAt) >= new Date() && b.status !== "storniert")
  const past = (myBookings?.bookings ?? []).filter((b) => new Date(b.startAt) < new Date() || b.status === "storniert")

  return (
    <div className="mk-velvet min-h-screen bg-background">
      {/* ─── Kopfzeile ─── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
            <Sparkles className="h-4 w-4 text-brand-text" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="mk-display truncate text-sm font-bold">
              <span className="text-foreground">{BRAND_DISPLAY.part1}</span> <span className="mk-gold-text">{BRAND_DISPLAY.part2}</span>
            </div>
            <div className="truncate text-[10px] text-muted-foreground">Kundinnen-Portal · {session.name}</div>
          </div>
          <button
            onClick={onLogout}
            className="mk-focus flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" /> Abmelden
          </button>
        </div>
        {/* Tabs */}
        <div className="mx-auto flex max-w-3xl gap-1 px-4 pb-3">
          <button
            onClick={() => setTab("book")}
            className={cn(
              "mk-focus flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold transition-colors",
              tab === "book" ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:text-foreground",
            )}
          >
            <CalendarCheck className="h-4 w-4" /> Termin buchen
          </button>
          <button
            onClick={() => setTab("mine")}
            className={cn(
              "mk-focus relative flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold transition-colors",
              tab === "mine" ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:text-foreground",
            )}
          >
            <CalendarDays className="h-4 w-4" /> Meine Termine
            {upcoming.length > 0 && (
              <span className="absolute right-3 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/80 px-1.5 text-[10px] font-bold text-primary-foreground">
                {upcoming.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-16">
        {/* ═══ TAB: TERMIN BUCHEN ═══ */}
        {tab === "book" && (
          <>
            {success ? (
              /* ─── Erfolgs-Ansicht ─── */
              <div className="mk-card mk-anim-up mx-auto max-w-md rounded-2xl p-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-700/50 bg-emerald-950/60">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" strokeWidth={1.8} />
                </div>
                <h2 className="mk-display text-2xl font-bold">Termin angefragt</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {BRANDING.brand.sloganDe} — wir melden uns rasch zur Bestätigung.
                </p>
                <div className="mt-6 space-y-2 rounded-xl border border-border/70 bg-secondary/40 p-4 text-left text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Leistung</span><span className="font-semibold">{success.service.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Termin</span><span className="font-semibold">{weekdayStr(success.startAt)}, {dateStr(success.startAt)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Zeit</span><span className="font-semibold">{timeStr(success.startAt)} Uhr</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Dauer</span><span className="font-semibold">{minutesLabel(success.durationMin)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Preis</span><span className="mk-display font-bold text-brand-text">CHF {chf(success.priceChf)}</span></div>
                </div>
                <div className="mt-6 flex gap-2">
                  <Button variant="outline" className="h-11 flex-1 rounded-full" onClick={() => { setTab("mine") }}>
                    Meine Termine ansehen
                  </Button>
                  <Button className="mk-gold-glow h-11 flex-1 rounded-full" onClick={resetFlow}>
                    Weiteren Termin buchen
                  </Button>
                </div>
              </div>
            ) : (
              /* ─── 3-Schritt-Flow ─── */
              <div className="mk-anim-in">
                {/* Fortschritt */}
                <div className="mb-6 flex items-center gap-2">
                  {[
                    { n: 1, label: "Leistung" },
                    { n: 2, label: "Termin" },
                    { n: 3, label: "Bestätigen" },
                  ].map((s, i) => (
                    <div key={s.n} className="flex flex-1 items-center gap-2">
                      <div className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                        step >= s.n ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                      )}>
                        {step > s.n ? <Check className="h-3.5 w-3.5" /> : s.n}
                      </div>
                      <span className={cn("text-xs font-semibold", step >= s.n ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
                      {i < 2 && <div className={cn("h-px flex-1", step > s.n ? "bg-primary/60" : "bg-border")} />}
                    </div>
                  ))}
                </div>

                {/* SCHRITT 1: Leistung */}
                {step === 1 && (
                  <div>
                    <h2 className="mk-display text-xl font-bold">Welche Verwöhnung darf es sein?</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Bitte wählen Sie eine Leistung aus.</p>
                    {servicesLoading && <div className="py-10 text-center text-sm text-muted-foreground">Leistungen werden geladen …</div>}
                    {["naegel", "beauty", "wimpern"].map((cat) => {
                      const catServices = services.filter((s) => s.category === cat)
                      if (catServices.length === 0) return null
                      return (
                        <div key={cat} className="mt-5">
                          <div className="mb-2.5 flex items-center gap-2">
                            <span className="text-lg">{CATEGORY_META[cat]?.emoji}</span>
                            <span className="mk-display text-sm font-bold">{CATEGORY_META[cat]?.label}</span>
                            <div className="mk-gold-line h-px flex-1" />
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {catServices.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => { setService(s); setDay(null); setSlot(null); setStep(2) }}
                                className={cn(
                                  "mk-card mk-focus group rounded-xl p-4 text-left",
                                  service?.id === s.id && "border-primary/50",
                                )}
                              >
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="mk-display text-sm font-bold">{s.name}</span>
                                  <span className="mk-display shrink-0 text-base font-bold text-brand-text">CHF {chf(s.priceChf)}</span>
                                </div>
                                <div className="mt-1.5 flex items-center justify-between">
                                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Clock className="h-3 w-3" /> {minutesLabel(s.durationMin)}
                                  </span>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-brand-text" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* SCHRITT 2: Tag & Zeit */}
                {step === 2 && service && (
                  <div>
                    <button onClick={() => setStep(1)} className="mk-focus mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                      <ChevronLeft className="h-4 w-4" /> Andere Leistung
                    </button>
                    <h2 className="mk-display text-xl font-bold">Wann passt es Ihnen?</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {service.name} · {minutesLabel(service.durationMin)} · CHF {chf(service.priceChf)}
                    </p>

                    {/* Tage */}
                    <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7">
                      {days.map((d) => {
                        const active = day?.toDateString() === d.toDateString()
                        return (
                          <button
                            key={d.toISOString()}
                            onClick={() => { setDay(d); setSlot(null) }}
                            className={cn(
                              "mk-card mk-focus rounded-xl px-1 py-2.5 text-center",
                              active && "border-primary/60 bg-primary/10",
                            )}
                          >
                            <div className="text-[10px] font-semibold uppercase text-muted-foreground">{weekdayStr(d.toISOString())}</div>
                            <div className={cn("mk-display mt-0.5 text-base font-bold", active && "text-brand-text")}>
                              {d.getDate()}.{d.getMonth() + 1}.
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {/* Zeit-Slots */}
                    {day && (
                      <div className="mt-6">
                        <div className="mb-2.5 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-brand-text" />
                          <span className="text-sm font-semibold">
                            Freie Zeiten am {weekdayStr(day.toISOString())}, {dateStr(day.toISOString())}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                          {slots.map((s) => {
                            const blocked = isSlotBlocked(s.hour, s.minute)
                            const active = slot?.hour === s.hour && slot?.minute === s.minute
                            return (
                              <button
                                key={`${s.hour}-${s.minute}`}
                                disabled={blocked}
                                onClick={() => setSlot(s)}
                                className={cn(
                                  "mk-focus rounded-lg border py-2.5 font-mono text-sm font-semibold transition-colors",
                                  active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : blocked
                                      ? "cursor-not-allowed border-border/50 text-muted-foreground/40 line-through"
                                      : "border-border bg-secondary/50 text-foreground hover:border-primary/50 hover:bg-primary/10",
                                )}
                              >
                                {String(s.hour).padStart(2, "0")}:{String(s.minute).padStart(2, "0")}
                              </button>
                            )
                          })}
                          {slots.length === 0 && (
                            <div className="col-span-full rounded-lg border border-border/60 bg-secondary/40 p-4 text-center text-sm text-muted-foreground">
                              An diesem Tag ist das Studio geschlossen.
                            </div>
                          )}
                        </div>
                        {slots.length > 0 && (
                          <p className="mt-3 text-[11px] text-muted-foreground">
                            Durchgestrichene Zeiten sind bereits belegt. Offene Anfragen bestätigen wir persönlich.
                          </p>
                        )}
                      </div>
                    )}

                    <Button
                      disabled={!day || !slot}
                      onClick={() => setStep(3)}
                      className="mk-gold-glow mt-6 h-12 w-full rounded-full text-base font-bold"
                    >
                      Weiter zur Bestätigung <ChevronRight className="ml-1 h-5 w-5" />
                    </Button>
                  </div>
                )}

                {/* SCHRITT 3: Bestätigen */}
                {step === 3 && service && day && slot && (
                  <div>
                    <button onClick={() => setStep(2)} className="mk-focus mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                      <ChevronLeft className="h-4 w-4" /> Andere Zeit wählen
                    </button>
                    <h2 className="mk-display text-xl font-bold">Fast geschafft!</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Bitte prüfen und bestätigen Sie Ihre Buchung.</p>

                    <div className="mk-card mt-5 space-y-2.5 rounded-xl p-5 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Leistung</span><span className="font-semibold">{service.name}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Termin</span><span className="font-semibold">{weekdayStr(day.toISOString())}, {dateStr(day.toISOString())}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Zeit</span><span className="font-semibold">{String(slot.hour).padStart(2, "0")}:{String(slot.minute).padStart(2, "0")} Uhr</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Dauer</span><span className="font-semibold">{minutesLabel(service.durationMin)}</span></div>
                      <div className="flex justify-between border-t border-border/60 pt-2.5">
                        <span className="text-muted-foreground">Preis</span>
                        <span className="mk-display text-lg font-bold text-brand-text">CHF {chf(service.priceChf)}</span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="book-phone" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Telefon (optional — für Rückfragen)
                        </Label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="book-phone"
                            placeholder="+41 79 000 00 00"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="mk-focus h-11 rounded-xl pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="book-notes" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Ihre Wünsche (optional)
                        </Label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                          <Textarea
                            id="book-notes"
                            placeholder="z. B. French mit Gold-Glitzer, kurze Nägel …"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="mk-focus min-h-[88px] rounded-xl pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      disabled={submitting}
                      onClick={submitBooking}
                      className="mk-gold-glow mt-6 h-12 w-full rounded-full text-base font-bold"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                          Buchung wird gesendet …
                        </span>
                      ) : (
                        <>
                          <Heart className="mr-1.5 h-4 w-4" /> Termin verbindlich anfragen
                        </>
                      )}
                    </Button>
                    <p className="mt-3 text-center text-[11px] text-muted-foreground">
                      Die Anfrage ist kostenlos — Sie erhalten eine Bestätigung von uns.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ═══ TAB: MEINE TERMINE ═══ */}
        {tab === "mine" && (
          <div className="mk-anim-in">
            <h2 className="mk-display text-xl font-bold">Meine Termine</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {upcoming.length === 0 ? "Sie haben momentan keine kommenden Termine." : `Sie haben ${upcoming.length} kommenden${upcoming.length === 1 ? " Termin" : " Termine"}.`}
            </p>

            {/* Kommende Termine */}
            {upcoming.length > 0 && (
              <div className="mt-5 space-y-2.5">
                {upcoming.map((b) => (
                  <div key={b.id} className="mk-card rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mk-display text-[15px] font-bold">{b.service.name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{weekdayStr(b.startAt)}, {dateStr(b.startAt)}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{timeStr(b.startAt)} · {minutesLabel(b.durationMin)}</span>
                        </div>
                        {b.notes && <div className="mt-2 truncate text-xs italic text-muted-foreground">«{b.notes}»</div>}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="mk-display text-base font-bold text-brand-text">CHF {chf(b.priceChf)}</div>
                        <Badge className={cn("mt-1 border text-[10px]", BOOKING_STATUS[b.status]?.cls)} variant="outline">
                          {BOOKING_STATUS[b.status]?.label ?? b.status}
                        </Badge>
                      </div>
                    </div>
                    {(b.status === "angefragt" || b.status === "bestaetigt") && (
                      <div className="mt-3 border-t border-border/60 pt-3">
                        <button
                          onClick={() => cancelBooking(b.id)}
                          className="mk-focus flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Termin stornieren
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Vergangene Termine */}
            {past.length > 0 && (
              <div className="mt-8">
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Vergangene Termine</span>
                  <div className="mk-gold-line h-px flex-1" />
                </div>
                <div className="space-y-2">
                  {past.map((b) => (
                    <div key={b.id} className="rounded-xl border border-border/50 bg-secondary/20 p-3.5 opacity-75">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{b.service.name}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{dateStr(b.startAt)} · {timeStr(b.startAt)}</div>
                        </div>
                        <Badge className={cn("shrink-0 border text-[10px]", BOOKING_STATUS[b.status]?.cls)} variant="outline">
                          {BOOKING_STATUS[b.status]?.label ?? b.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
