// ═══════════════════════════════════════════════════════════════════════════
// RANDEVU AL — herkese açık 3 adımlı randevu akışı (GİRİŞ GEREKMEZ)
//   1. Hizmet seç        — kategorilere göre kartlar
//   2. Tarih & saat      — önümüzdeki 14 gün, 30 dk'lık aralıklar (dolu/ geçmiş kilitli)
//   3. Bilgileriniz      — ad + telefon (e-posta isteğe bağlı) → onay
// + "Randevularım": telefon numarasıyla randevularını görüntüle / iptal et
// ═══════════════════════════════════════════════════════════════════════════

"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import confetti from "canvas-confetti"
import {
  Sparkles, CalendarCheck, ChevronLeft, ChevronRight, Check, Clock, User, Phone, Mail,
  MessageSquare, Search, CalendarX2, PartyPopper, Star, MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BRANDING } from "@/config/branding"
import {
  type SalonService, type SalonBooking, CATEGORY_META, para, minutesLabel,
  timeStr, dateStrShort, weekdayStr, isOpenDay, openSlots, BOOKING_STATUS,
} from "@/lib/salon"

type Step = 0 | 1 | 2

const DATE_FMT = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

export function BookingFlow({
  onBack, onReviews, onStaffLogin,
}: {
  onBack: () => void
  onReviews: () => void
  onStaffLogin: () => void
}) {
  const qc = useQueryClient()
  const { guestBooking } = BRANDING

  const [step, setStep] = useState<Step>(0)
  const [service, setService] = useState<SalonService | null>(null)
  const [dateKey, setDateKey] = useState<string>("")
  const [timeKey, setTimeKey] = useState<string>("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ startAt: string; priceChf: number; serviceName?: string } | null>(null)
  const [whatsappUrl, setWhatsappUrl] = useState<string>("")

  // ─── Altın konfeti kutlaması (randevu başarı ekranında — bir kez) ─────
  useEffect(() => {
    if (!done) return
    const colors = ["#f5d77f", "#d4af37", "#b8860b", "#fff3c4", "#e8c66a"]
    // Sağ patlama
    confetti({ particleCount: 90, angle: 60, spread: 70, origin: { x: 0.85, y: 0.6 }, colors, scalar: 0.9 })
    // Sol patlama
    const t = setTimeout(() => {
      confetti({ particleCount: 90, angle: 120, spread: 70, origin: { x: 0.15, y: 0.6 }, colors, scalar: 0.9 })
    }, 150)
    // Orta altın yağmuru
    const t2 = setTimeout(() => {
      confetti({ particleCount: 50, angle: 90, spread: 100, origin: { x: 0.5, y: 0.35 }, colors, scalar: 0.7 })
    }, 350)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [done?.startAt])

  // Hizmetleri yükle
  const { data: servicesData } = useQuery({
    queryKey: ["salon-services-booking"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/services")
      if (!res.ok) return { services: [] as SalonService[] }
      return (await res.json()) as { services: SalonService[] }
    },
  })
  const services = servicesData?.services ?? []
  const categories = ["tirnak", "guzellik", "kirpik"].filter((c) => services.some((s) => s.category === c))
  const [cat, setCat] = useState<string>("tirnak")

  // Önümüzdeki günler (yalnızca açık günler, en fazla 10)
  const days = useMemo(() => {
    const list: Date[] = []
    const today = new Date()
    for (let i = 0; i < 21 && list.length < 10; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      if (isOpenDay(d)) list.push(d)
    }
    return list
  }, [])

  // Seçilen günün dolu blokları
  const { data: availData } = useQuery({
    queryKey: ["salon-availability", dateKey],
    queryFn: async () => {
      const res = await fetch(`/api/v1/salon/availability?date=${dateKey}`)
      if (!res.ok) return { busy: [] as Array<{ startAt: string; durationMin: number }> }
      return (await res.json()) as { busy: Array<{ startAt: string; durationMin: number }> }
    },
    enabled: dateKey !== "",
  })
  const busy = availData?.busy ?? []

  // Bir başlangıç saati seçilebilir mi? (çakışma yok + en az 30 dk ilerisi)
  const isSlotFree = (d: Date) => {
    if (d.getTime() < Date.now() + 30 * 60000) return false
    const end = d.getTime() + (service?.durationMin ?? 60) * 60000
    return !busy.some((b) => {
      const bStart = new Date(b.startAt).getTime()
      const bEnd = bStart + b.durationMin * 60000
      return d.getTime() < bEnd && end > bStart
    })
  }

  const selectedDate = dateKey ? new Date(`${dateKey}T00:00:00`) : null
  const slots = selectedDate ? openSlots(selectedDate) : []

  // ─── Gönder ───────────────────────────────────────────────────────────────
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError("")
    if (name.trim().length < 2) return setError("Lütfen adınızı girin.")
    if (phone.replace(/\D/g, "").length < 7) return setError("Lütfen geçerli bir telefon numarası girin.")
    if (!service || !dateKey || !timeKey) return setError("Lütfen hizmet, tarih ve saat seçin.")

    setSubmitting(true)
    try {
      const startAt = new Date(`${dateKey}T${timeKey}:00`).toISOString()
      const res = await fetch("/api/v1/salon/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerEmail: email.trim() || undefined,
          serviceId: service.id,
          startAt,
          notes: note.trim() || undefined,
        }),
      })
      const json = (await res.json()) as {
        booking?: { id: string; startAt: string; priceChf: number; serviceName: string; customerName: string }
        whatsappUrl?: string
        error?: string
      }
      if (!res.ok || !json.booking) {
        setError(json.error ?? "Randevu oluşturulamadı.")
        if (res.status === 409) {
          setStep(1)
          qc.invalidateQueries({ queryKey: ["salon-availability", dateKey] })
        }
        return
      }
      setDone(json.booking)
      setWhatsappUrl(json.whatsappUrl ?? "")
      qc.invalidateQueries({ queryKey: ["salon-availability"] })
    } catch {
      setError("Bağlantı hatası — lütfen tekrar deneyin.")
    } finally {
      setSubmitting(false)
    }
  }

  const restart = () => {
    setDone(null); setWhatsappUrl(""); setStep(0); setService(null); setDateKey(""); setTimeKey("")
    setName(""); setPhone(""); setEmail(""); setNote(""); setError("")
  }

  const steps = guestBooking.steps

  return (
    <div className="mk-velvet min-h-screen bg-background pb-24 lg:pb-0">
      {/* Üst bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
          <button
            onClick={done ? restart : step === 0 ? onBack : () => setStep((s) => (s - 1) as Step)}
            className="mk-focus flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Geri"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="mk-display truncate text-lg font-bold">{guestBooking.title}</h1>
            <div className="truncate text-[11px] text-muted-foreground">{guestBooking.subtitle}</div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1.5 text-[10px] font-bold text-brand-text sm:flex">
            <Sparkles className="h-3 w-3" /> Giriş gerekmez
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Tabs defaultValue="yeni">
          <TabsList className="mb-6 grid h-11 w-full grid-cols-2 rounded-full bg-secondary/60 p-1">
            <TabsTrigger value="yeni" className="rounded-full text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Yeni Randevu
            </TabsTrigger>
            <TabsTrigger value="benim" className="rounded-full text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Randevularım
            </TabsTrigger>
          </TabsList>

          <TabsContent value="yeni">
            {/* ═══ Başarı ekranı ═══ */}
            {done ? (
              <div className="mk-card mk-anim-up mx-auto max-w-md rounded-2xl p-8 text-center">
                <div className="mk-gold-glow mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
                  <PartyPopper className="h-8 w-8 text-brand-text" strokeWidth={1.6} />
                </div>
                <h2 className="mk-display mt-5 text-2xl font-bold">{guestBooking.successTitle}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{guestBooking.successText}</p>

                <div className="mt-6 space-y-2.5 rounded-xl border border-border/70 bg-secondary/40 p-5 text-left text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Hizmet</span><span className="font-bold text-foreground">{done.serviceName ?? "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tarih</span><span className="font-bold text-foreground">{dateStrShort(done.startAt)} {weekdayStr(done.startAt)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Saat</span><span className="font-bold text-foreground">{timeStr(done.startAt)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Ücret</span><span className="font-bold text-brand-text">{para(done.priceChf ?? 0)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Durum</span><span className="font-bold text-amber-300">Onay bekliyor</span></div>
                </div>

                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                  <Button onClick={restart} variant="outline" className="h-11 flex-1 rounded-full border-border/70 font-semibold">
                    Yeni randevu al
                  </Button>
                  <Button onClick={onReviews} className="mk-gold-glow h-11 flex-1 rounded-full bg-primary font-bold text-primary-foreground">
                    <Star className="mr-1.5 h-4 w-4" /> Değerlendirme yap
                  </Button>
                </div>

                {/* WhatsApp ile bilgileri gönder (stüdyoya önceden doldurulmuş mesaj) */}
                {whatsappUrl && (
                  <Button
                    asChild
                    variant="outline"
                    className="mk-focus mt-2.5 h-11 w-full rounded-full border-emerald-700/50 font-semibold text-emerald-400 hover:bg-emerald-950/30"
                  >
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp'tan Randevuyu Gönder
                    </a>
                  </Button>
                )}
                <p className="mt-5 text-[11px] text-muted-foreground">
                  Randevunuzu «Randevularım» sekmesinden telefon numaranızla görüntüleyip iptal edebilirsiniz.
                </p>
              </div>
            ) : (
              <>
                {/* ═══ Adım göstergesi ═══ */}
                <div className="mb-8 flex items-center gap-2">
                  {steps.map((label, i) => (
                    <div key={label} className="flex flex-1 items-center gap-2">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors",
                          i < step && "border-primary/50 bg-primary/15 text-brand-text",
                          i === step && "mk-gold-glow border-primary bg-primary text-primary-foreground",
                          i > step && "border-border text-muted-foreground",
                        )}
                      >
                        {i < step ? <Check className="h-4 w-4" /> : i + 1}
                      </div>
                      <span className={cn("hidden text-xs font-semibold sm:block", i === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                      {i < steps.length - 1 && <div className={cn("h-px flex-1", i < step ? "bg-primary/40" : "bg-border")} />}
                    </div>
                  ))}
                </div>

                {/* ═══ 1. Adım: Hizmet ═══ */}
                {step === 0 && (
                  <div className="mk-anim-in">
                    {/* Kategori sekmeleri */}
                    <div className="mb-5 flex flex-wrap gap-2">
                      {categories.map((c) => (
                        <button
                          key={c}
                          onClick={() => setCat(c)}
                          className={cn(
                            "mk-focus rounded-full border px-4 py-2 text-xs font-bold transition-colors",
                            cat === c
                              ? "border-primary/50 bg-primary/15 text-brand-text"
                              : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                          )}
                        >
                          {CATEGORY_META[c]?.emoji} {CATEGORY_META[c]?.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {services.filter((s) => s.category === cat).map((s, i) => (
                        <button
                          key={s.id}
                          onClick={() => { setService(s); setStep(1); setTimeKey("") }}
                          className={cn(
                            "mk-card mk-anim-up group rounded-xl p-5 text-left transition-all hover:border-primary/40",
                            `mk-delay-${Math.min(6, i + 1)}`,
                          )}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="mk-display text-[15px] font-bold text-foreground">{s.name}</div>
                            <div className="mk-display shrink-0 text-base font-bold text-brand-text">{para(s.priceChf)}</div>
                          </div>
                          {s.description && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.description}</p>}
                          <div className="mt-3 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                              <Clock className="h-3 w-3 text-brand-text/70" />{minutesLabel(s.durationMin)}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-bold text-brand-text opacity-0 transition-opacity group-hover:opacity-100">
                              Seç <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ═══ 2. Adım: Tarih & Saat ═══ */}
                {step === 1 && service && (
                  <div className="mk-anim-in">
                    {/* Seçilen hizmet özeti */}
                    <div className="mk-card mb-6 flex items-center justify-between rounded-xl p-4">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Seçilen hizmet</div>
                        <div className="mk-display mt-0.5 text-sm font-bold text-foreground">{service.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="mk-display text-base font-bold text-brand-text">{para(service.priceChf)}</div>
                        <div className="text-[11px] text-muted-foreground">{minutesLabel(service.durationMin)}</div>
                      </div>
                    </div>

                    {/* Günler */}
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Gün seç</div>
                    <div className="mk-scroll -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-2">
                      {days.map((d) => {
                        const key = DATE_FMT(d)
                        const active = dateKey === key
                        return (
                          <button
                            key={key}
                            onClick={() => { setDateKey(key); setTimeKey("") }}
                            className={cn(
                              "mk-focus flex h-[72px] w-[64px] shrink-0 flex-col items-center justify-center rounded-xl border transition-all",
                              active
                                ? "mk-gold-glow border-primary bg-primary/15"
                                : "border-border/70 bg-card hover:border-primary/40",
                            )}
                          >
                            <span className={cn("text-[10px] font-bold uppercase", active ? "text-brand-text" : "text-muted-foreground")}>
                              {weekdayStr(d.toISOString())}
                            </span>
                            <span className={cn("mk-display mt-1 text-lg font-bold", active ? "text-foreground" : "text-foreground/80")}>
                              {d.getDate()}
                            </span>
                            <span className={cn("text-[9px]", active ? "text-brand-text" : "text-muted-foreground")}>
                              {d.toLocaleDateString("tr-TR", { month: "short" })}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Saatler */}
                    {dateKey === "" ? (
                      <p className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                        Lütfen yukarıdan bir gün seçin.
                      </p>
                    ) : (
                      <>
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          Saat seç — {new Date(`${dateKey}T00:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" })}
                        </div>
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                          {slots.map(({ hour, minute }) => {
                            const d = new Date(`${dateKey}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`)
                            const key = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
                            const free = isSlotFree(d)
                            const active = timeKey === key
                            return (
                              <button
                                key={key}
                                disabled={!free}
                                onClick={() => setTimeKey(key)}
                                title={free ? "Müsait" : "Dolu"}
                                className={cn(
                                  "mk-focus h-11 rounded-lg border font-mono text-sm font-bold transition-all",
                                  active && "mk-gold-glow border-primary bg-primary text-primary-foreground",
                                  !active && free && "border-border/70 bg-card text-foreground hover:border-primary/50",
                                  !free && "cursor-not-allowed border-border/40 bg-secondary/30 text-muted-foreground/40 line-through",
                                )}
                              >
                                {key}
                              </button>
                            )
                          })}
                        </div>
                        {busy.length > 0 && (
                          <p className="mt-3 text-[11px] text-muted-foreground">
                            {busy.length} randevu bu günde zaten ayırtılmış — dolu saatler üstü çizili.
                          </p>
                        )}

                        <Button
                          disabled={timeKey === ""}
                          onClick={() => setStep(2)}
                          className="mk-gold-glow mt-6 h-12 w-full rounded-full bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90"
                        >
                          Devam et <ChevronRight className="ml-1 h-5 w-5" />
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* ═══ 3. Adım: Bilgileriniz ═══ */}
                {step === 2 && service && dateKey && timeKey && (
                  <form onSubmit={submit} className="mk-anim-in mk-card mx-auto max-w-md rounded-2xl p-6 sm:p-7">
                    <div className="mb-5 space-y-2 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Hizmet</span><span className="font-bold text-foreground">{service.name}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Tarih</span><span className="font-bold text-foreground">{new Date(`${dateKey}T00:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Saat</span><span className="font-bold text-foreground">{timeKey}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Ücret</span><span className="font-bold text-brand-text">{para(service.priceChf)}</span></div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bk-name" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Adınız Soyadınız <span className="text-brand-text">*</span>
                        </Label>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input id="bk-name" placeholder="örn. Elif Yılmaz" autoComplete="name" value={name}
                            onChange={(e) => setName(e.target.value)} className="mk-focus h-11 rounded-xl pl-10" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bk-phone" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Telefon <span className="text-brand-text">*</span>
                        </Label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input id="bk-phone" type="tel" placeholder="+41 79 111 22 33" autoComplete="tel" value={phone}
                            onChange={(e) => setPhone(e.target.value)} className="mk-focus h-11 rounded-xl pl-10" />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Randevularınızı bu numarayla görüntüleyebilirsiniz.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bk-email" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          E-posta <span className="text-muted-foreground/60">(isteğe bağlı)</span>
                        </Label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input id="bk-email" type="email" placeholder="ornek@eposta.ch" autoComplete="email" value={email}
                            onChange={(e) => setEmail(e.target.value)} className="mk-focus h-11 rounded-xl pl-10" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bk-note" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Notunuz <span className="text-muted-foreground/60">(isteğe bağlı)</span>
                        </Label>
                        <div className="relative">
                          <MessageSquare className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                          <Textarea id="bk-note" rows={3} placeholder="örn. Fransız + altın parıltı istiyorum…" value={note}
                            onChange={(e) => setNote(e.target.value)} className="mk-focus rounded-xl pl-10" />
                        </div>
                      </div>
                    </div>

                    {error && (
                      <p role="alert" className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive">
                        {error}
                      </p>
                    )}

                    <Button type="submit" disabled={submitting} className="mk-gold-glow mt-6 h-12 w-full rounded-full bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90">
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                          Randevu alınıyor…
                        </span>
                      ) : (
                        <><CalendarCheck className="mr-1.5 h-5 w-5" /> Randevuyu onayla</>
                      )}
                    </Button>
                    <p className="mt-3 text-center text-[11px] text-muted-foreground">
                      Onayımızı kısa süre içinde alacaksınız — isterseniz sizi arayıp teyit ederiz.
                    </p>
                  </form>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="benim">
            <MyBookings />
          </TabsContent>
        </Tabs>
      </main>

      {/* Alt bilgi (masaüstü) */}
      <footer className="mt-auto hidden border-t border-border/60 bg-card/30 lg:block">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4 text-[11px] text-muted-foreground">
          <span>{BRANDING.company.legalName} · {BRANDING.company.phone}</span>
          <button onClick={onStaffLogin} className="mk-focus rounded hover:text-foreground">Ekip Girişi</button>
        </div>
      </footer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// RANDEVULARIM — telefon numarasıyla sorgulama + iptal
// ═══════════════════════════════════════════════════════════════════════════

function MyBookings() {
  const qc = useQueryClient()
  const { guestBooking } = BRANDING
  const [phone, setPhone] = useState("")
  const [searched, setSearched] = useState("")
  const [error, setError] = useState("")
  const [cancelling, setCancelling] = useState<string | null>(null)

  const { data: myData, isLoading } = useQuery({
    queryKey: ["my-bookings", searched],
    queryFn: async () => {
      const res = await fetch(`/api/v1/salon/bookings?phone=${encodeURIComponent(searched)}`)
      if (!res.ok) return { bookings: [] as SalonBooking[] }
      return (await res.json()) as { bookings: SalonBooking[] }
    },
    enabled: searched !== "",
  })

  const bookings = myData?.bookings ?? []
  const now = Date.now()
  const upcoming = bookings.filter((b) => new Date(b.startAt).getTime() >= now && b.status !== "iptal" && b.status !== "gelmedi")
  const past = bookings.filter((b) => new Date(b.startAt).getTime() < now || b.status === "iptal" || b.status === "gelmedi")

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.replace(/\D/g, "").length < 7) {
      setError("Lütfen randevu verirken kullandığınız telefon numarasını girin.")
      return
    }
    setError("")
    setSearched(phone.trim())
  }

  const cancel = async (id: string) => {
    setCancelling(id)
    try {
      const res = await fetch("/api/v1/salon/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "iptal", phone: searched }),
      })
      if (!res.ok) {
        const json = (await res.json()) as { error?: string }
        setError(json.error ?? "Randevu iptal edilemedi.")
        return
      }
      qc.invalidateQueries({ queryKey: ["my-bookings", searched] })
    } catch {
      setError("Bağlantı hatası — lütfen tekrar deneyin.")
    } finally {
      setCancelling(null)
    }
  }

  return (
    <div className="mk-anim-in mx-auto max-w-md">
      <div className="mk-card rounded-2xl p-6">
        <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-text">
          <Search className="h-4 w-4" /> {guestBooking.myBookingsTitle}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{guestBooking.myBookingsHint}</p>

        <form onSubmit={search} className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="tel"
              placeholder={guestBooking.demoPhone}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mk-focus h-11 rounded-xl pl-10"
              aria-label="Telefon numarası"
            />
          </div>
          <Button type="submit" className="mk-gold-glow h-11 shrink-0 rounded-xl bg-primary px-5 font-bold text-primary-foreground">
            Ara
          </Button>
        </form>

        {/* Demo ipucu */}
        <button
          type="button"
          onClick={() => { setPhone(guestBooking.demoPhone); setSearched(guestBooking.demoPhone) }}
          className="mk-focus mt-3 w-full rounded-lg border border-dashed border-border/70 px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          Demo: {guestBooking.demoPhone} numarasıyla deneyin
        </button>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive">
            {error}
          </p>
        )}
      </div>

      {/* Sonuçlar */}
      {searched !== "" && (
        <div className="mt-6 space-y-5">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="mk-card h-20 animate-pulse rounded-xl" />)}
            </div>
          ) : upcoming.length === 0 && past.length === 0 ? (
            <div className="mk-card rounded-xl p-8 text-center">
              <CalendarX2 className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Bu numaraya ait randevu bulunamadı.<br />
                <span className="text-[11px]">Yeni randevu almak için «Yeni Randevu» sekmesine geçin.</span>
              </p>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <section>
                  <h3 className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Yaklaşan randevular</h3>
                  <div className="space-y-2.5">
                    {upcoming.map((b) => (
                      <div key={b.id} className="mk-card rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="mk-display text-sm font-bold text-foreground">{b.service.name}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {dateStrShort(b.startAt)} {weekdayStr(b.startAt)} · {timeStr(b.startAt)} · {minutesLabel(b.durationMin)}
                            </div>
                            <span className={cn("mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold", BOOKING_STATUS[b.status]?.cls)}>
                              {BOOKING_STATUS[b.status]?.label ?? b.status}
                            </span>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="mk-display text-sm font-bold text-brand-text">{para(b.priceChf)}</div>
                            <button
                              onClick={() => cancel(b.id)}
                              disabled={cancelling === b.id}
                              className="mk-focus mt-2 rounded-full border border-destructive/40 px-3 py-1 text-[10px] font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                            >
                              {cancelling === b.id ? "İptal ediliyor…" : "İptal et"}
                            </button>
                          </div>
                        </div>
                        {b.notes && <p className="mt-2.5 rounded-lg bg-secondary/50 px-3 py-2 text-[11px] italic text-muted-foreground">Not: {b.notes}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {past.length > 0 && (
                <section>
                  <h3 className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Geçmiş & iptal edilenler</h3>
                  <div className="space-y-2">
                    {past.slice(0, 5).map((b) => (
                      <div key={b.id} className="mk-card flex items-center justify-between rounded-xl p-3.5 opacity-70">
                        <div>
                          <div className="text-xs font-bold text-foreground">{b.service.name}</div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground">{dateStrShort(b.startAt)} · {timeStr(b.startAt)}</div>
                        </div>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", BOOKING_STATUS[b.status]?.cls)}>
                          {BOOKING_STATUS[b.status]?.label ?? b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
