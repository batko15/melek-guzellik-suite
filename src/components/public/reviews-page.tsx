// ═══════════════════════════════════════════════════════════════════════════
// YORUMLAR — herkese açık değerlendirme sayfası (GİRİŞ GEREKMEZ)
//   • Puan özeti (ortalama + dağılım) + yayınlanmış yorumlar
//   • «Değerlendirme Yap» formu: ad + yıldız + (isteğe bağlı hizmet) + yorum
//   • Gönderimden sonra kısa inceleme (moderasyon) notu
// ═══════════════════════════════════════════════════════════════════════════

"use client"

import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ChevronLeft, Star, MessageSquareHeart, Send, CheckCircle2, User, Sparkles, Quote,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BRANDING } from "@/config/branding"
import { type SalonService, type ReviewRow, type ReviewSummary, Stars, dateStrShort } from "@/lib/salon"

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Puan seç">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} yıldız`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="mk-focus rounded p-1 transition-transform hover:scale-110"
        >
          <svg
            viewBox="0 0 24 24"
            className={cn("h-8 w-8 transition-colors", i <= shown ? "fill-current text-brand-text" : "fill-current text-muted-foreground/25")}
          >
            <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17l-6.1 3.6 1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
          </svg>
        </button>
      ))}
      <span className="ml-2 text-sm font-bold text-muted-foreground">{value > 0 ? `${value}/5` : "Puan verin"}</span>
    </div>
  )
}

export function ReviewsPage({
  onBack, onBook, onStaffLogin,
}: {
  onBack: () => void
  onBook: () => void
  onStaffLogin: () => void
}) {
  const qc = useQueryClient()
  const { reviews: cfg } = BRANDING

  const [name, setName] = useState("")
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [serviceId, setServiceId] = useState<string>("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  // Yorum filtreleri (yıldız + hizmet)
  const [starFilter, setStarFilter] = useState<number | "tumu">("tumu")
  const [serviceFilter, setServiceFilter] = useState<string>("")

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ["salon-reviews"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/reviews")
      if (!res.ok) return { reviews: [] as ReviewRow[], summary: { count: 0, average: 0, distribution: [], pending: 0 } as ReviewSummary }
      return (await res.json()) as { reviews: ReviewRow[]; summary: ReviewSummary }
    },
  })
  const { data: servicesData } = useQuery({
    queryKey: ["salon-services-reviews"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/services")
      if (!res.ok) return { services: [] as SalonService[] }
      return (await res.json()) as { services: SalonService[] }
    },
  })

  const reviews = reviewsData?.reviews ?? []
  const summary = reviewsData?.summary

  // Filtrelenmiş yorum listesi + mevcut hizmet filtreleri
  const serviceOptions = useMemo(
    () => [...new Set(reviews.map((r) => r.serviceName).filter((s): s is string => !!s))],
    [reviews],
  )
  const filteredReviews = useMemo(() => {
    let list = reviews
    if (starFilter !== "tumu") list = list.filter((r) => r.rating === starFilter)
    if (serviceFilter) list = list.filter((r) => r.serviceName === serviceFilter)
    return list
  }, [reviews, starFilter, serviceFilter])
  const services = servicesData?.services ?? []
  const maxCount = Math.max(1, ...(summary?.distribution.map((d) => d.count) ?? [1]))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (name.trim().length < 2) return setError("Lütfen adınızı girin.")
    if (rating < 1) return setError("Lütfen yıldızlarla puan verin.")
    if (comment.trim().length < 5) return setError("Lütfen en az birkaç kelimelik bir yorum yazın.")

    setSubmitting(true)
    try {
      const res = await fetch("/api/v1/salon/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: name.trim(), rating, comment: comment.trim(), serviceId: serviceId || undefined }),
      })
      const json = (await res.json()) as { message?: string; error?: string }
      if (!res.ok) {
        setError(json.error ?? "Değerlendirme kaydedilemedi.")
        return
      }
      setSent(true)
      qc.invalidateQueries({ queryKey: ["salon-reviews"] })
    } catch {
      setError("Bağlantı hatası — lütfen tekrar deneyin.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mk-velvet min-h-screen bg-background pb-24 lg:pb-0">
      {/* Üst bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
          <button
            onClick={onBack}
            className="mk-focus flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Ana sayfaya dön"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="mk-display truncate text-lg font-bold">{cfg.title}</h1>
            <div className="truncate text-[11px] text-muted-foreground">{cfg.subtitle}</div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1.5 text-[10px] font-bold text-brand-text sm:flex">
            <Sparkles className="h-3 w-3" /> Giriş gerekmez
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* ═══ Puan özeti ═══ */}
        {summary && summary.count > 0 && (
          <div className="mk-card mb-8 flex flex-col items-center gap-6 rounded-2xl p-6 sm:flex-row sm:p-7">
            <div className="shrink-0 text-center">
              <div className="mk-display text-5xl font-bold text-brand-text">{summary.average.toFixed(1)}</div>
              <div className="mt-1.5 flex justify-center"><Stars value={summary.average} size="md" /></div>
              <div className="mt-1.5 text-[11px] text-muted-foreground">{summary.count} değerlendirme</div>
            </div>
            <div className="w-full flex-1 space-y-1.5">
              {summary.distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-2.5">
                  <span className="flex w-10 shrink-0 items-center gap-0.5 text-[11px] font-bold text-muted-foreground">
                    {d.star}<Star className="h-3 w-3 fill-current text-brand-text/60" />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary/70">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${Math.round((d.count / maxCount) * 100)}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ Değerlendirme formu / teşekkür ═══ */}
        {sent ? (
          <div className="mk-card mk-anim-up mx-auto mb-10 max-w-md rounded-2xl p-8 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-brand-text" strokeWidth={1.4} />
            <h2 className="mk-display mt-4 text-2xl font-bold">Teşekkürler, {name.split(" ")[0]}!</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cfg.pendingNote}</p>
            <Button onClick={() => { setSent(false); setName(""); setRating(0); setComment(""); setServiceId("") }}
              variant="outline" className="mt-6 h-11 rounded-full border-border/70 px-6 font-semibold">
              Yeni değerlendirme yaz
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mk-card mb-10 rounded-2xl p-6 sm:p-7">
            <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-text">
              <MessageSquareHeart className="h-4 w-4" /> {cfg.writeButton}
            </div>
            <h2 className="mk-display mt-2.5 text-xl font-bold">Deneyiminizi paylaşın</h2>
            <p className="mt-1 text-sm text-muted-foreground">Deneyiminiz diğer misafirlere yardımcı olur — giriş yapmanıza gerek yok.</p>

            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Puanınız *</Label>
                <StarPicker value={rating} onChange={setRating} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rv-name" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Adınız <span className="text-brand-text">*</span>
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="rv-name" placeholder="örn. Ayşe K." autoComplete="name" value={name}
                    onChange={(e) => setName(e.target.value)} className="mk-focus h-11 rounded-xl pl-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rv-service" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Hizmet <span className="text-muted-foreground/60">(isteğe bağlı)</span>
                </Label>
                <Select value={serviceId || undefined} onValueChange={(v) => setServiceId(v)}>
                  <SelectTrigger id="rv-service" className="mk-focus h-11 rounded-xl">
                    <SelectValue placeholder="Hangi hizmetle ilgili?" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rv-comment" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Yorumunuz <span className="text-brand-text">*</span>
                </Label>
                <Textarea
                  id="rv-comment"
                  rows={4}
                  maxLength={600}
                  placeholder="örn. Jel tırnaklar harika oldu, çok özenli bir çalışma! Stüdyo çok temiz ve şık…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mk-focus rounded-xl"
                />
                <div className="text-right text-[10px] text-muted-foreground">{comment.length}/600</div>
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="mk-gold-glow mt-5 h-12 w-full rounded-full bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Gönderiliyor…
                </span>
              ) : (
                <><Send className="mr-1.5 h-4 w-4" /> Değerlendirmeyi gönder</>
              )}
            </Button>
          </form>
        )}

        {/* ═══ Yayınlanmış yorumlar ═══ */}
        <section aria-label="Yayınlanmış yorumlar">
          <h2 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            <Quote className="h-3.5 w-3.5 text-brand-text/70" /> Tüm yorumlar ({summary?.count ?? 0})
          </h2>

          {/* Geribildirim filtreleri: yıldız + hizmet */}
          {reviews.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <div className="mk-scroll flex gap-1 overflow-x-auto rounded-full bg-secondary/50 p-1">
                {(["tumu", 5, 4, 3, 2, 1] as const).map((f) => (
                  <button
                    key={String(f)}
                    onClick={() => setStarFilter(f)}
                    aria-pressed={starFilter === f}
                    className={cn(
                      "mk-focus whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
                      starFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f === "tumu" ? "Tümü" : `${f} ★`}
                  </button>
                ))}
              </div>
              {serviceOptions.length > 1 && (
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  aria-label="Hizmete göre filtrele"
                  className="mk-focus h-8 rounded-full border border-border/70 bg-secondary/50 px-3 text-[11px] font-semibold text-foreground"
                >
                  <option value="">Tüm hizmetler</option>
                  {serviceOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
              {(starFilter !== "tumu" || serviceFilter) && (
                <button
                  onClick={() => { setStarFilter("tumu"); setServiceFilter("") }}
                  className="mk-focus rounded-full text-[11px] font-semibold text-brand-text hover:bg-primary/10 px-3 py-1.5"
                >
                  Filtreleri temizle ✕
                </button>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="mk-card h-32 animate-pulse rounded-2xl" />)}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="mk-card rounded-2xl p-10 text-center">
              <MessageSquareHeart className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                {reviews.length === 0
                  ? <>Henüz yayınlanmış yorum yok.<br /><span className="text-xs">İlk değerlendirmeyi siz yazın — 1 dakikanızı alır.</span></>
                  : <>Bu filtreyle eşleşen yorum yok.</>}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReviews.map((r, i) => (
                <article key={r.id} className={cn("mk-card mk-anim-up rounded-2xl p-5", `mk-delay-${Math.min(6, (i % 6) + 1)}`)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="mk-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-brand-text">
                        {r.authorName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </span>
                      <div className="leading-tight">
                        <div className="text-sm font-bold text-foreground">{r.authorName}</div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {r.serviceName ?? cfg.anonymousLabel} · {dateStrShort(r.createdAt)}
                        </div>
                      </div>
                    </div>
                    <Stars value={r.rating} />
                  </div>
                  <p className="mt-3.5 text-sm leading-relaxed text-foreground/90">«{r.comment}»</p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Randevu çağrısı */}
        <div className="mk-card mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl p-6 text-center sm:flex-row sm:text-left">
          <div>
            <div className="mk-display text-lg font-bold">Bu deneyimi kendiniz yaşamak ister misiniz?</div>
            <div className="mt-1 text-sm text-muted-foreground">1 dakikada online randevu alın — giriş gerekmez.</div>
          </div>
          <Button onClick={onBook} className="mk-gold-glow h-11 shrink-0 rounded-full bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/90">
            Randevu Al
          </Button>
        </div>
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
