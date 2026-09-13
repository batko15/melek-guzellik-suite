// Herkese açık açılış sayfası — Melek'çe Güzellik (V6, tamamen Türkçe)
// GERÇEK MARKA: Logo (public/brand/) Navbar · Hero · Footer'da
// Logo-DNA: Gold-Eck-Ornamente · Rauten-Trenner · «Since 2022» · Samt-Schwarz-Gold
// Hero + Canlı hava durumu + Canlı «Şu an açık» durumu · Güven şeridi ·
// Hizmetler (Menü-Stil + akıllı randevu ön seçimi) · Nasıl Çalışır · Galeri (Lightbox) ·
// ÖNCESİ & SONRASI · Yorumlar (Carousel) · SSS (FAQ + JSON-LD) · Hakkımızda ·
// Çalışma Saatleri · İletişim · İnteraktif Harita
// Randevu almak ve değerlendirme yazmak için giriş GEREKMEZ.
// V6 «Profesyonel Edition»: tek sayfa SPA — tüm gezinme istemci tarafında,
// URL değişmez; sayfa dışı <a href> yok (sandbox uyumlu + daha hızlı)

"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { useQuery } from "@tanstack/react-query"
import CountUp from "react-countup"
import useEmblaCarousel from "embla-carousel-react"
import Lightbox from "yet-another-react-lightbox"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import Counter from "yet-another-react-lightbox/plugins/counter"
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/thumbnails.css"
import "yet-another-react-lightbox/plugins/counter.css"
import { Instagram, MapPin, Phone, Clock, CalendarCheck, ChevronRight, ChevronLeft, MessageSquareHeart, ArrowRight, MessageCircle, Navigation, Sparkles, Heart, Crown, Mail, Gift, Copy, Check, User, MessageSquare, Smartphone, Download, Wand2, ShieldCheck, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"
import { type SalonService, type GalleryEntry, type ReviewRow, type ReviewSummary, CATEGORY_META, para, minutesLabel, Stars } from "@/lib/salon"
import { WeatherWidget } from "@/components/weather-widget"
import { LocationMap } from "@/components/public/location-map"
import { Reveal } from "@/components/public/reveal"
import { CompareSlider } from "@/components/public/compare-slider"

// ─── V5.8: Öncesi & Sonrası — dönüşüm karşılaştırmaları (görseller public/gallery) ───
// V6: karşılaştırma kaydırıcısı CompareSlider bileşenine taşındı (hidrasyon güvenli)
const BEFORE_AFTER = [
  {
    id: "klasik-bordo",
    title: "Klasik Bordo",
    before: "/gallery/before-bordo.png",
    after: "/gallery/after-bordo.png",
    beforeAlt: "Klasik Bordo öncesi — bakımsız ve kırılgan doğal tırnaklar",
    afterAlt: "Klasik Bordo sonrası — parlak bordo jel tırnaklar",
  },
  {
    id: "fransiz-incisi",
    title: "Fransız İncisi",
    before: "/gallery/before-french.png",
    after: "/gallery/after-french.png",
    beforeAlt: "Fransız İncisi öncesi — zayıf ve sararmış doğal tırnaklar",
    afterAlt: "Fransız İncisi sonrası — kusursuz fransız jel tırnaklar",
  },
] as const

// ─── «Bugün» — yalnızca istemcide çözülen tarih (SSG/SSR donması + hydration uyarısı olmasın) ───
const emptySubscribe = () => () => {}
const getServerToday = (): Date | null => null
let todayCache: Date | null = null
const getClientToday = (): Date => (todayCache ??= new Date())

/** useSyncExternalStore tabanlı — hidrasyon güvenli, kademeli render yok. */
function useToday(): Date | null {
  return useSyncExternalStore<Date | null>(emptySubscribe, getClientToday, getServerToday)
}

// ═══ V6: «Şu an açık/kapalı» canlı durum rozeti ═══════════════════════════
// openingHours: hafta Pzt = 0 · Date.getDay(): Paz = 0 → eşleme: [6,0,1,2,3,4,5]
const DAY_MAP = [6, 0, 1, 2, 3, 4, 5]

function parseHours(hours: string): { start: number; end: number } | null {
  // «09:00 – 18:00» / «09:00-18:00» biçimlerini esnekçe çözümle
  const m = hours.match(/(\d{1,2}):(\d{2})\s*[\u2013\u2014-]\s*(\d{1,2}):(\d{2})/)
  if (!m) return null
  const start = Number(m[1]) * 60 + Number(m[2])
  const end = Number(m[3]) * 60 + Number(m[4])
  return end > start ? { start, end } : null
}

function useOpenStatus(now: Date | null): { open: boolean; todayText: string; nextDay?: string } | null {
  if (!now) return null
  const entry = BRANDING.openingHours[DAY_MAP[now.getDay()]]
  if (!entry) return null
  const mins = now.getHours() * 60 + now.getMinutes()
  const range = entry.closed ? null : parseHours(entry.hours)
  if (range && mins >= range.start && mins < range.end) {
    return { open: true, todayText: entry.hours }
  }
  // Bugün daha açılacak mı?
  if (range && mins < range.start) {
    return { open: false, todayText: entry.hours, nextDay: `Bugün ${entry.hours.split(/\s*[\u2013\u2014-]\s*/)[0]}` }
  }
  // Gelecekteki ilk açık gün (en fazla 7 gün ileri bak)
  for (let i = 1; i <= 7; i++) {
    const e = BRANDING.openingHours[DAY_MAP[(now.getDay() + i) % 7]]
    if (e && !e.closed && parseHours(e.hours)) {
      return { open: false, todayText: entry.hours, nextDay: i === 1 ? `Yarın ${e.day}` : e.day }
    }
  }
  return { open: false, todayText: entry.hours }
}

/** V6: İstatistik değerini «17+» → { end: 17, suffix: "+", decimals: 0 } olarak ayrıştır */
function parseStat(value: string): { end: number; suffix: string; decimals: number } | null {
  const m = value.match(/^(\d+(?:\.\d+)?)(.*)$/)
  if (!m) return null
  return { end: Number(m[1]), suffix: m[2] ?? "", decimals: m[1].includes(".") ? 1 : 0 }
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKA-BAŞLIK (Sektionen) — Logo-DNA: Raute ◆ + Gold-Linie + Serifen
// ═══════════════════════════════════════════════════════════════════════════

function SectionHeader({
  eyebrow, title, accent, description, align = "center",
}: { eyebrow: string; title: string; accent?: string; description?: string; align?: "center" | "left" }) {
  return (
    <div className={cn("mb-10", align === "center" ? "text-center" : "text-left")}>
      <div className={cn("flex items-center gap-3", align === "center" && "justify-center")}>
        <span className="mk-gold-line h-px w-8 sm:w-12" />
        <span className="mk-diamond" />
        <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-brand-text sm:text-[11px]">
          {eyebrow}
        </span>
        <span className="mk-diamond" />
        <span className="mk-gold-line h-px w-8 sm:w-12" />
      </div>
      <h2 className="mk-display mt-4 text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        {title} {accent && <span className="mk-gold-text">{accent}</span>}
      </h2>
      {description && (
        <p className={cn("mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground", align === "center" && "mx-auto")}>
          {description}
        </p>
      )}
    </div>
  )
}

// Marka-Monogramm (Melek kanadı) — Navbar, Footer & Login'de kullanılır
function BrandMark({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn(
        "mk-gold-glow mk-logo-sheen relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/45 bg-primary/8",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={BRANDING.brand.logoWing}
        alt="Melek'çe Güzellik — melek kanadı monogramı"
        className="h-full w-full scale-[1.18] object-cover"
      />
    </span>
  )
}

export function LandingPage({
  onBook, onReviews, onStaffLogin, onStudio, onNailArt,
}: {
  onBook: (serviceId?: string | null) => void
  onReviews: () => void
  onStaffLogin: () => void
  onStudio: () => void
  onNailArt?: () => void
}) {
  const { company, landing, brand } = BRANDING
  const instagramUrl = `https://www.instagram.com/${company.instagram}`
  const [galleryFilter, setGalleryFilter] = useState<string>("tumu")

  const { data: servicesData } = useQuery({
    queryKey: ["salon-services-landing"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/services")
      if (!res.ok) return { services: [] as SalonService[] }
      return (await res.json()) as { services: SalonService[] }
    },
  })
  const { data: galleryData } = useQuery({
    queryKey: ["salon-gallery-landing"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/gallery")
      if (!res.ok) return { items: [] as GalleryEntry[] }
      return (await res.json()) as { items: GalleryEntry[] }
    },
  })
  const { data: reviewsData } = useQuery({
    queryKey: ["salon-reviews-landing"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/reviews")
      if (!res.ok) return { reviews: [] as ReviewRow[], summary: { count: 0, average: 0, distribution: [], pending: 0 } as ReviewSummary }
      return (await res.json()) as { reviews: ReviewRow[]; summary: ReviewSummary }
    },
  })

  const services = servicesData?.services ?? []
  const galleryAll = galleryData?.items ?? []
  const reviews = reviewsData?.reviews ?? []
  const summary = reviewsData?.summary
  const categories = ["tirnak", "guzellik", "kirpik", "paket"].filter((c) => services.some((s) => s.category === c))
  const galleryCategories = ["tumu", ...Array.from(new Set(galleryAll.map((g) => g.category)))]
  const gallery = galleryFilter === "tumu" ? galleryAll : galleryAll.filter((g) => g.category === galleryFilter)
  // «Bugün» vurgusu yalnızca tarayıcıda hesaplanır — sunucuda tarih sabitlenmez
  const today = useToday()
  const todayIdx = today ? (today.getDay() + 6) % 7 : -1
  // V6: canlı açık/kapalı durumu + sayfa yüklendikten sonra istatistik sayacı
  const openStatus = useOpenStatus(today)
  const mounted = today !== null

  // V6: Galeri lightbox (Zoom + Küçük resimler + Sayaç)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const lightboxSlides = useMemo(() => gallery.map((g) => ({ src: g.imagePath, description: `${g.title} · ${CATEGORY_META[g.category]?.label ?? g.category}` })), [gallery])

  // V6: Misafir yorumları — embla carousel ( Profesyonel döngü + oklar )
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", slidesToScroll: 1 })
  const [emblaIndex, setEmblaIndex] = useState(0)
  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setEmblaIndex(emblaApi.selectedScrollSnap())
    emblaApi.on("select", onSelect)
    onSelect()
    return () => { emblaApi.off("select", onSelect) }
  }, [emblaApi])
  const reviewSlides = useMemo(() => {
    const list = reviewsData?.reviews ?? []
    if (list.length <= 3) return [list]
    const chunks: typeof list[] = []
    for (let i = 0; i < list.length; i += 3) chunks.push(list.slice(i, i + 3))
    return chunks
  }, [reviewsData?.reviews])

  return (
    <div className="mk-velvet min-h-screen bg-background pb-24 md:pb-0">
      {/* ═══ Navbar — Gerçek marka monogramı ile ═══ */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/88 backdrop-blur-md">
        <div className="mk-gold-line h-[2px] w-full" />
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark size={44} />
            <div className="leading-none">
              <div className="mk-display text-[15px] font-bold tracking-wide sm:text-base">
                <span className="text-foreground">{BRAND_DISPLAY.part1}</span>{" "}
                <span className="mk-gold-text">{BRAND_DISPLAY.part2}</span>
              </div>
              <div className="mt-1.5 hidden text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground min-[400px]:block sm:text-[10px]">
                {brand.tagline}
              </div>
            </div>
          </div>
          <nav className="ml-auto hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#hizmetler" className="mk-focus rounded transition-colors hover:text-foreground">Hizmetler</a>
            <a href="#galeri" className="mk-focus rounded transition-colors hover:text-foreground">Galeri</a>
            <button onClick={onStudio} className="mk-focus rounded font-semibold text-brand-text transition-colors hover:text-foreground">Canlı Studio 💅</button>
            {onNailArt && <button onClick={onNailArt} className="mk-focus rounded transition-colors hover:text-foreground">Nail Art ✨</button>}
            <a href="#yorumlar" className="mk-focus rounded transition-colors hover:text-foreground">Yorumlar</a>
            <a href="#iletisim" className="mk-focus rounded transition-colors hover:text-foreground">İletişim</a>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Button
              onClick={() => onBook(null)}
              className="mk-gold-glow mk-btn-lift h-10 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 sm:px-5"
            >
              <CalendarCheck className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Randevu Al</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onStaffLogin}
              className="h-10 rounded-full border-border/70 px-3 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground sm:px-4"
            >
              Ekip
            </Button>
          </div>
        </div>
      </header>

      {/* ═══ Hero — Gerçek logo, marka çerçevesinde ═══ */}
      <section className="relative overflow-hidden">
        {/* Samt-Deko: goldene Schimmerpunkte */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-24 right-[8%] h-72 w-72 rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 left-[4%] h-56 w-56 rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 65%)" }} />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          {/* Sol: Metin */}
          <div className="mk-anim-right">
            <div className="inline-flex flex-wrap items-center gap-2.5 rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5">
              <span className="mk-diamond" />
              <span className="mk-since-badge text-[10px] font-semibold text-brand-text">Since {brand.since}</span>
              <span className="h-3 w-px bg-border" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Gelibolu · Çanakkale</span>
              {/* V6: canlı açık/kapalı rozeti (yalnızca tarayıcıda) */}
              {openStatus && (
                <>
                  <span className="h-3 w-px bg-border" />
                  <span
                    className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]", openStatus.open ? "text-emerald-400" : "text-rose-400")}
                    title={openStatus.open ? "Şu an açık" : `Şu an kapalı — ${openStatus.nextDay ?? ""}`}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", openStatus.open ? "bg-emerald-400 mk-anim-blink" : "bg-rose-400/80")} />
                    {openStatus.open ? "Şu an açık" : "Şu an kapalı"}
                  </span>
                </>
              )}
            </div>

            <h1 className="mk-display mt-6 text-balance text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              {landing.heroTitle}
              <br />
              <span className="mk-gold-text">{landing.heroTitleAccent}</span>
            </h1>
            <p className="mt-6 max-w-lg text-pretty text-[15px] leading-relaxed text-muted-foreground">
              {landing.heroDescription}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                onClick={() => onBook(null)}
                className="mk-gold-glow mk-btn-lift h-12 rounded-full bg-primary px-7 text-base font-bold text-primary-foreground hover:bg-primary/90"
              >
                {landing.ctaButton}
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                onClick={onStudio}
                className="mk-focus h-12 rounded-full border-primary/50 px-6 text-sm font-semibold text-brand-text hover:bg-primary/10"
              >
                <Wand2 className="mr-1.5 h-4 w-4 text-brand-text" />
                Canlı Nail Studio
              </Button>
              <Button
                variant="outline"
                onClick={onReviews}
                className="mk-focus h-12 rounded-full border-border/70 px-6 text-sm font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground"
              >
                <MessageSquareHeart className="mr-1.5 h-4 w-4 text-brand-text" />
                Değerlendirme Yap
              </Button>
            </div>
            <p className="mt-3.5 text-xs text-muted-foreground">
              <span className="font-semibold text-brand-text">{landing.guestNote}</span> · {landing.ctaHint}
            </p>

            {/* İstatistikler — V6: yumuşak sayaç animasyonu (hidrasyon güvenli) */}
            <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
              {landing.stats.map((s, i) => {
                const num = parseStat(s.value)
                return (
                  <div key={s.label} className={cn("mk-card mk-anim-up rounded-xl px-4 py-4 text-center sm:text-left", `mk-delay-${i + 1}`)}>
                    <div className="mk-display text-2xl font-bold text-brand-text">
                      {mounted && num ? (
                        <CountUp end={num.end} duration={1.6} decimals={num.decimals} separator="." suffix={num.suffix} useEasing />
                      ) : (
                        s.value
                      )}
                    </div>
                    <div className="mt-1 text-[11px] font-medium leading-tight text-muted-foreground">{s.label}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sağ: Gerçek logo — Ehrenrahmen mit Eck-Ornamenten */}
          <div className="mk-anim-up relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="mk-ornament mk-logo-frame mk-logo-sheen mk-gold-glow-soft relative rounded-2xl p-7 sm:p-9">
              <img
                src={brand.logoFull}
                alt="Melek'çe Güzellik resmi logosu — altın melek kanadı, MELEK'ÇE GÜZELLİK, NAIL ARTIST"
                className="mx-auto w-full max-w-[300px] rounded-lg"
              />
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="mk-gold-line h-px w-10" />
              <span className="mk-diamond" />
              <span className="mk-display text-[13px] italic tracking-wide text-brand-text/90 sm:text-sm">«{brand.slogan}»</span>
              <span className="mk-diamond" />
              <span className="mk-gold-line h-px w-10" />
            </div>

            {/* Canlı hava durumu */}
            <div className="mt-7">
              <WeatherWidget variant="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ V6: Güven şeridi — hero altı profesyonel güven bandı ═══ */}
      <section className="border-t border-border/60 py-8" aria-label="Neden biz">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {landing.trustStrip?.map((t, i) => {
              const Icon = t.icon === "calendar" ? CalendarCheck : t.icon === "wand" ? Wand2 : t.icon === "shield" ? ShieldCheck : Heart
              return (
                <div key={t.title} className={cn("mk-card mk-anim-up flex items-start gap-3 rounded-xl px-4 py-3.5", `mk-delay-${Math.min(6, i + 1)}`)}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/8">
                    <Icon className="h-4 w-4 text-brand-text" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold leading-tight text-foreground">{t.title}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{t.text}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ İmza İşçiliği — Foto şeridi ═══ */}
      {galleryAll.length > 0 && (
        <section className="border-t border-border/60 py-10" aria-label="İmza çalışmalarımız">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {galleryAll.slice(0, 3).map((g, i) => (
                <figure
                  key={g.id}
                  className={cn(
                    "mk-gallery-tile mk-photo-frame mk-anim-up group relative overflow-hidden rounded-2xl border border-border/60",
                    i === 1 && "sm:-translate-y-3",
                    `mk-delay-${i + 1}`,
                  )}
                >
                  <img
                    src={g.imagePath}
                    alt={`${g.title} — Melek'çe Güzellik imza çalışması`}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/85 to-transparent px-3 pb-2 pt-8">
                    <div className="truncate text-[11px] font-bold text-foreground">{g.title}</div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Hizmetler & Fiyatlar — Menü-Stil (noktalı fiyat çizgisi) ═══ */}
      <section id="hizmetler" className="scroll-mt-24 border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionHeader
              eyebrow="Hizmetler & Fiyatlar"
              title="Her kadın için"
              accent="bakım programları"
              description="Yüksek kaliteli ürünler, hassas teknik ve isteklerinize ayrılan zaman — klasik manikürden etkileyici kirpiklere kadar."
            />
          </Reveal>

          {categories.map((cat) => (
            <div key={cat} id={`hizmet-${cat}`} className="mb-10 scroll-mt-28 last:mb-0">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-xl">{CATEGORY_META[cat]?.emoji}</span>
                <h3 className="mk-display text-xl font-bold">{CATEGORY_META[cat]?.label}</h3>
                <div className="mk-gold-line h-px flex-1" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {services.filter((s) => s.category === cat).map((s, i) => (
                  <div
                    key={s.id}
                    className={cn(
                      "mk-card mk-anim-up group relative rounded-xl p-5",
                      s.popular && "border-primary/35",
                      `mk-delay-${Math.min(6, i + 1)}`,
                    )}
                  >
                    {s.popular && (
                      <Badge className="absolute -top-2 right-4 border-primary/50 bg-primary/15 text-[9px] font-bold uppercase tracking-wider text-brand-text">
                        Popüler
                      </Badge>
                    )}
                    <div className="flex items-baseline gap-2.5">
                      <div className="mk-display text-[15px] font-bold leading-snug text-foreground">{s.name}</div>
                      <div className="mb-1 flex-1 border-b border-dotted border-border/90" aria-hidden="true" />
                      <div className="mk-display shrink-0 text-lg font-bold text-brand-text">{para(s.priceChf)}</div>
                    </div>
                    {s.description && (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        <Clock className="h-3 w-3 text-brand-text/70" />
                        {minutesLabel(s.durationMin)}
                      </div>
                      {/* V6: akıllı randevu — hizmet önceden seçili olarak açılır */}
                      <button
                        onClick={() => onBook(s.id)}
                        className="mk-focus rounded-full px-3 py-1 text-[11px] font-bold text-brand-text transition-colors hover:bg-primary/10"
                      >
                        Randevu Al →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Reveal>
            <div className="mk-ornament mk-card mt-10 flex flex-col items-center justify-between gap-4 rounded-xl p-6 text-center hover:-translate-y-0.5 sm:flex-row sm:text-left">
              <div>
                <div className="mk-display text-lg font-bold">Randevunuz için hazır mısınız?</div>
                <div className="mt-1 text-sm text-muted-foreground">1 dakikada online alın — hizmeti, saati ve tarihi kendiniz seçin. Giriş gerekmez.</div>
              </div>
              <Button
                onClick={() => onBook(null)}
                className="mk-gold-glow h-11 shrink-0 rounded-full bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/90"
              >
                <CalendarCheck className="mr-1.5 h-4 w-4" /> Hemen Al
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ V6: Nasıl Çalışır — 3 adımda randevu ═══ */}
      <section id="nasil-calisir" className="scroll-mt-24 border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionHeader
              eyebrow="Nasıl Çalışır"
              title="3 adımda"
              accent="randevunuz"
              description="Karmaşık formlar yok, telefon trafiği yok — sadece seçin, onaylayın, gelin."
            />
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                no: "01",
                title: "Hizmetinizi seçin",
                text: "Fiyat listemizden tırnak, güzellik veya kirpik hizmetinizi seçin — isterseniz Canlı Studio'da tasarımınızı kendiniz oluşturun.",
                icon: Sparkles,
              },
              {
                no: "02",
                title: "Saat & gün seçin",
                text: "Açık günleri ve boş saatleri gerçek zamanlı görün — çakışma yok, bekleme yok. Dolu günler için bekleme listemize yazılabilirsiniz.",
                icon: Clock,
              },
              {
                no: "03",
                title: "Onayınızı alın",
                text: "Adınız ve telefon numaranız yeterli. Randevunuz anında stüdyomuza düşer — «Randevularım» bölümünden her zaman takip edebilirsiniz.",
                icon: CalendarCheck,
              },
            ].map((step, i) => (
              <Reveal key={step.no} delay={i * 0.12} className="min-w-0">
                <div className="mk-card mk-ornament relative h-full overflow-hidden rounded-2xl p-6">
                  <span className="mk-display pointer-events-none absolute -right-1 -top-3 select-none text-[64px] font-bold leading-none text-primary/10" aria-hidden="true">
                    {step.no}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/35 bg-primary/10">
                    <step.icon className="h-5 w-5 text-brand-text" strokeWidth={1.8} />
                  </span>
                  <h3 className="mk-display mt-4 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{step.text}</p>
                  {i < 2 && (
                    <ArrowRight className="absolute right-4 top-6 hidden h-4 w-4 text-primary/40 md:block" aria-hidden="true" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ V5.4: Hediye Kartı — sevdiklerinize şımartma ═══ */}
      <section id="hediye-karti" className="scroll-mt-24 border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionHeader
              eyebrow="Hediye Kartı"
              title="Sevdiklerinize"
              accent="şımartma hediyesi"
              description="Dijital hediye kartı ile manikürden kirpiklere dilediği bakımı hediye edin — kodu anında oluşturulur, ödeme sonrası aktifleşir."
            />
          </Reveal>
          <GiftCardSection />
        </div>
      </section>

      {/* ═══ Galeri — Kategori filtresi ile ═══ */}
      <section id="galeri" className="scroll-mt-24 border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionHeader
              eyebrow="Galeri"
              title="Gerçek çalışmalarımız"
              description="Stüdyomuzdan seçilmiş tırnak sanatı, kirpik ve güzellik uygulamaları — hepsi kendi çalışmalarımız."
            />
          </Reveal>

          {galleryAll.length > 0 && (
            <div className="mb-7 flex flex-wrap items-center justify-center gap-2">
              {galleryCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => setGalleryFilter(c)}
                  aria-pressed={galleryFilter === c}
                  className={cn(
                    "mk-focus rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
                    galleryFilter === c
                      ? "border-primary/50 bg-primary/15 text-brand-text mk-gold-glow"
                      : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {c === "tumu" ? "Tümü" : (CATEGORY_META[c]?.label ?? c)}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((g, i) => (
              <figure
                key={g.id}
                className={cn(
                  "mk-gallery-tile mk-photo-frame mk-anim-up mk-card group relative cursor-zoom-in overflow-hidden rounded-2xl",
                  `mk-delay-${Math.min(6, (i % 6) + 1)}`,
                )}
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(gallery.findIndex((x) => x.id === g.id))}
                  className="mk-focus block w-full"
                  aria-label={`${g.title} — büyütmek için aç`}
                >
                  <img
                    src={g.imagePath}
                    alt={`${g.title} — Melek'çe Güzellik ${CATEGORY_META[g.category]?.label ?? g.category} çalışması`}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                </button>
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent px-3 pb-2.5 pt-10">
                  <div className="truncate text-xs font-bold text-foreground">{g.title}</div>
                  <div className="text-[10px] text-muted-foreground">{CATEGORY_META[g.category]?.label ?? g.category}</div>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={() => onNailArt?.()}
              className="mk-focus mk-gold-glow inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Sparkles className="h-4 w-4" /> Tüm tırnak sanatı galerisini gör
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mk-focus inline-flex items-center gap-2 rounded-full border border-border/70 px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <Instagram className="h-4 w-4 text-brand-text" />
              Instagram'da daha fazlası · @{company.instagram}
            </a>
          </div>
          {/* V6: Galeri Lightbox — Zoom + Küçük resimler + Sayaç */}
          <Lightbox
            open={lightboxIndex !== null}
            index={lightboxIndex ?? 0}
            slides={lightboxSlides}
            close={() => setLightboxIndex(null)}
            plugins={[Zoom, Thumbnails, Counter]}
            animation={{ zoom: 350 }}
            zoom={{ maxZoomPixelRatio: 3 }}
            controller={{ closeOnBackdropClick: true }}
          />
        </div>
      </section>

      {/* ═══ V5.8: Öncesi & Sonrası — dönüşüm karşılaştırma slider'ları ═══
          img-comparison-slider (a11y: tabindex + ok tuşları, dokunmatik sürükleme) ═══ */}
      <section id="oncesi-sonrasi" className="scroll-mt-24 border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionHeader
              eyebrow="Öncesi & Sonrası"
              title="Farkı kendiniz"
              accent="görün"
              description="Kaydırıcıyı sürükleyin — farkı görün ✨ Gerçek dönüşümler, stüdyomuzda elle uygulanan bakımlarla."
            />
          </Reveal>

          <div className="grid gap-5 md:grid-cols-2 md:gap-6">
            {BEFORE_AFTER.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.12} className="min-w-0">
                <figure className="mk-card mk-photo-frame h-full overflow-hidden rounded-2xl p-2.5 sm:p-3">
                  <div className="relative overflow-hidden rounded-xl">
                    {/* V6: hidrasyon güvenli karşılaştırma kaydırıcısı */}
                    <CompareSlider pair={c} />
                    <span className="pointer-events-none absolute left-3 top-3 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/90 backdrop-blur-md">
                      Önce
                    </span>
                    <span className="pointer-events-none absolute right-3 top-3 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-text backdrop-blur-md">
                      Sonra
                    </span>
                  </div>
                  <figcaption className="flex items-center justify-between gap-2 px-1.5 pb-0.5 pt-2.5">
                    <span className="mk-display text-sm font-bold text-foreground">{c.title}</span>
                    <span className="text-[10px] font-medium text-muted-foreground">Stüdyo çalışması</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Misafir Değerlendirmeleri ═══ */}
      <section id="yorumlar" className="scroll-mt-24 border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionHeader eyebrow="Değerlendirmeler" title="Misafirlerimiz" accent="ne diyor?" />
          </Reveal>
          {summary && summary.count > 0 && (
            <div className="mb-8 flex justify-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-primary/30 bg-primary/8 px-5 py-2.5">
                <span className="mk-display text-2xl font-bold text-brand-text">{summary.average.toFixed(1)}</span>
                <Stars value={summary.average} size="md" />
                <span className="text-xs text-muted-foreground">{summary.count} değerlendirme</span>
              </div>
            </div>
          )}

          {reviewSlides.length > 0 && reviewSlides[0]?.length > 0 ? (
            <div className="relative">
              {/* V6: embla carousel — profesyonel, dokunmatik + ok tuşları */}
              <div ref={emblaRef} className="overflow-hidden" aria-roledescription="carousel" aria-label="Misafir değerlendirmeleri">
                <div className="flex">
                  {reviewSlides.map((group, gi) => (
                    <div key={gi} className="min-w-0 flex-[0_0_100%]">
                      <div className="grid gap-4 px-0.5 md:grid-cols-3">
                        {group.map((r) => (
                          <figure key={r.id} className="mk-card h-full rounded-2xl p-6">
                            <Stars value={r.rating} />
                            <blockquote className="mt-3 text-sm leading-relaxed text-foreground/90">«{r.comment}»</blockquote>
                            <figcaption className="mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
                              <span className="mk-display flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-brand-text">
                                {r.authorName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                              </span>
                              <div className="leading-tight">
                                <div className="text-xs font-bold text-foreground">{r.authorName}</div>
                                <div className="text-[10px] text-muted-foreground">{r.serviceName ?? BRANDING.reviews.anonymousLabel}</div>
                              </div>
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {reviewSlides.length > 1 && (
                <div className="mt-5 flex items-center justify-center gap-4">
                  <button
                    onClick={() => emblaApi?.scrollPrev()}
                    aria-label="Önceki yorumlar"
                    className="mk-focus flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-primary/50 hover:text-brand-text"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-1.5" role="tablist" aria-label="Yorum sayfaları">
                    {reviewSlides.map((_, di) => (
                      <button
                        key={di}
                        role="tab"
                        aria-selected={emblaIndex === di}
                        aria-label={`${di + 1}. yorum sayfası`}
                        onClick={() => emblaApi?.scrollTo(di)}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          emblaIndex === di ? "w-6 bg-primary mk-gold-glow" : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70",
                        )}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => emblaApi?.scrollNext()}
                    aria-label="Sonraki yorumlar"
                    className="mk-focus flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-primary/50 hover:text-brand-text"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Henüz yayınlanmış değerlendirme yok — ilk siz olun!</p>
          )}

          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={onReviews}
              className="mk-focus h-11 rounded-full border-primary/40 px-6 text-sm font-bold text-brand-text hover:bg-primary/10"
            >
              Tüm yorumları gör & değerlendirme yaz
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ V6: SSS — sıkça sorulan sorular (FAQPage JSON-LD ile SEO) ═══ */}
      <section id="sss" className="scroll-mt-24 border-t border-border/60 py-14 lg:py-20">
        {/* Google/Farklı arama motorları için FAQPage yapılandırılmış verisi */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: landing.faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal>
            <SectionHeader
              eyebrow="SSS"
              title="Sıkça sorulan"
              accent="sorular"
              description="Merak edilenler — aradığınızı bulamazsanız WhatsApp'tan yazın, hemen yardımcı olalım."
            />
          </Reveal>
          <Reveal delay={0.1}>
            <Accordion type="single" collapsible className="mk-card rounded-2xl px-5 py-2">
              {landing.faq.map((f, i) => (
                <AccordionItem key={f.q} value={`faq-${i}`} className="border-border/50 last:border-b-0">
                  <AccordionTrigger className="mk-focus gap-3 py-4 text-left hover:no-underline">
                    <span className="flex items-start gap-3">
                      <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" strokeWidth={1.8} />
                      <span className="text-[14px] font-semibold leading-snug text-foreground">{f.q}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pl-7 text-[13px] leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* ═══ Hakkımızda ═══ */}
      <section id="hakkimizda" className="scroll-mt-24 border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal className="min-w-0">
            <div className="mk-ornament mk-gold-glow-soft overflow-hidden rounded-3xl border border-primary/25">
              <img
                src="/gallery/salon-interior.png"
                alt="Melek'çe Güzellik'te siyah ve altın tonlarında zarif stüdyo iç mekânı"
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
            </div>
          </Reveal>
          <Reveal className="min-w-0" delay={0.12}>
            <div>
              <SectionHeader eyebrow="Hakkımızda" title={landing.aboutTitle} align="left" />
              <div>
              <p className="max-w-lg text-[15px] leading-relaxed text-muted-foreground">{landing.aboutText}</p>
              <div className="mt-7 space-y-3">
                {[
                  { icon: Sparkles, text: "Cilt dostu, yüksek kaliteli ürünler" },
                  { icon: Heart, text: "İsteklerinize zaman ve kişisel danışmanlık" },
                  { icon: Crown, text: "Zarif atmosfer — kendinizi bir melek gibi hissedin" },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-3 text-sm text-foreground/90">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/8">
                      <f.icon className="h-4 w-4 text-brand-text" strokeWidth={1.8} />
                    </span>
                    {f.text}
                  </div>
                ))}
              </div>
              <div className="mt-7 flex items-center gap-3">
                <span className="mk-gold-line h-px w-8" />
                <span className="mk-diamond" />
                <span className="mk-since-badge text-[10px] text-muted-foreground">Since {brand.since}</span>
                <span className="mk-diamond" />
                <span className="mk-gold-line h-px w-8" />
              </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ Çalışma Saatleri & İletişim ═══ */}
      <section id="iletisim" className="scroll-mt-24 border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader eyebrow="Çalışma Saatleri & İletişim" title="Bizimle" accent="iletişime geçin" />
          <Reveal>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Çalışma saatleri */}
            <div className="mk-card rounded-2xl p-7 hover:-translate-y-0.5">
              <div className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.25em] text-brand-text">
                <Clock className="h-4 w-4" /> Çalışma Saatleri
              </div>
              <div className="mt-5 space-y-1">
                {BRANDING.openingHours.map((h, i) => (
                  <div
                    key={h.day}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm",
                      i === todayIdx && "border border-primary/30 bg-primary/8",
                    )}
                  >
                    <span className={cn("font-medium", h.closed ? "text-muted-foreground" : "text-foreground")}>
                      {h.day}
                      {i === todayIdx && <span className="ml-2 text-[10px] font-bold uppercase text-brand-text">Bugün</span>}
                    </span>
                    <span className={cn("font-mono text-xs", h.closed ? "text-muted-foreground/70" : "text-foreground")}>{h.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* İletişim */}
            <div className="mk-card rounded-2xl p-7 hover:-translate-y-0.5">
              <div className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.25em] text-brand-text">
                <MapPin className="h-4 w-4" /> İletişim & Ulaşım
              </div>
              <div className="mt-5 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-text/70" />
                  <div>
                    <div className="font-semibold text-foreground">{company.legalName}</div>
                    <div className="text-muted-foreground">{company.street} · {company.city}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-brand-text/70" />
                  <a href={`tel:${company.phone.replace(/\s/g, "")}`} className="text-muted-foreground hover:text-foreground hover:underline">
                    Bizi arayın
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-4 w-4 shrink-0 text-brand-text/70" />
                  <a
                    href={`https://wa.me/${(company.whatsapp ?? company.phone).replace(/\D/g, "")}?text=${encodeURIComponent("Merhaba! Randevu hakkında bilgi almak istiyorum. ✨")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-text hover:underline"
                  >
                    WhatsApp'tan yaz
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Instagram className="h-4 w-4 shrink-0 text-brand-text/70" />
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-brand-text hover:underline">
                    @{company.instagram}
                  </a>
                </div>
                {(company as { email?: string }).email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-brand-text/70" />
                    <a href={`mailto:${(company as { email?: string }).email}`} className="text-brand-text hover:underline">
                      {(company as { email?: string }).email}
                    </a>
                  </div>
                )}
              </div>
              <div className="mt-6 border-t border-border/60 pt-5">
                <Button
                  onClick={() => onBook(null)}
                  className="mk-gold-glow h-11 w-full rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90"
                >
                  <CalendarCheck className="mr-1.5 h-4 w-4" /> Online randevu al
                </Button>
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  Ya da bize ulaşın: WhatsApp, telefon veya Instagram mesajı.
                </p>
              </div>
            </div>
          </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ Konum & İnteraktif Harita ═══ */}
      <section id="konum" className="scroll-mt-24 border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <SectionHeader
              eyebrow="Konum"
              title="Bizi"
              accent="Gelibolu'da bulun"
              description={`${company.street}, ${company.city} — haritayı yakınlaştırıp yol tarifi alın ya da WhatsApp'tan yazın.`}
            />
          </Reveal>

          <div className="grid items-start gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <LocationMap />
            </div>
            <Reveal className="min-w-0" delay={0.12}>
              <div className="mk-card space-y-3 rounded-2xl p-6 hover:-translate-y-0.5">
              <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-text">
                <Navigation className="h-4 w-4" /> Yol Tarifi
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Stüdyomuza toplu taşıma veya özel araçla kolayca ulaşabilirsiniz. Randevu saatinizden 5 dakika önce gelmeniz yeterli.
              </p>
              <Button
                asChild
                className="mk-gold-glow h-11 w-full rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90"
              >
                <a href={BRANDING.map.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                  <Navigation className="mr-1.5 h-4 w-4" /> Google Haritalar'da Aç
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="mk-focus h-11 w-full rounded-full border-emerald-700/50 font-semibold text-emerald-400 hover:bg-emerald-950/30"
              >
                <a
                  href={`https://wa.me/${(company.whatsapp ?? company.phone).replace(/\D/g, "")}?text=${encodeURIComponent("Merhaba! Melek'çe Güzellik'te randevu almak istiyorum. ✨")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp'tan Randevu
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="mk-focus h-11 w-full rounded-full border-border/70 font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground"
              >
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                  <Instagram className="mr-1.5 h-4 w-4 text-brand-text" /> Instagram'ı Aç
                </a>
              </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ Alt bilgi — V6: profesyonel 3 kolonlu marka kapanışı ═══ */}
      <footer className="mt-auto border-t border-border/60 bg-card/30">
        <div className="mk-gold-line h-[2px] w-full" />
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_1fr]">
            {/* Kolon 1: Marka */}
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="flex items-center gap-3">
                <div className="mk-ornament mk-logo-frame mk-logo-sheen mk-gold-glow-soft rounded-xl p-2">
                  <img
                    src={brand.logoWing}
                    alt="Melek'çe Güzellik melek kanadı"
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                </div>
                <div className="leading-none">
                  <div className="mk-display text-base font-bold tracking-wide">
                    <span className="text-foreground">{BRAND_DISPLAY.part1}</span>{" "}
                    <span className="mk-gold-text">{BRAND_DISPLAY.part2}</span>
                  </div>
                  <div className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {brand.tagline}
                  </div>
                </div>
              </div>
              <p className="mt-4 max-w-xs text-[12px] leading-relaxed text-muted-foreground">
                {company.legalName} · {company.street}, {company.city}
                <br />
                {company.footerClaim}
              </p>
              <div className="mt-4 flex items-center gap-2.5">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram sayfamız"
                  className="mk-focus flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-primary/50 hover:text-brand-text"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href={`https://wa.me/${(company.whatsapp ?? company.phone).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp'tan yazın"
                  className="mk-focus flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-primary/50 hover:text-brand-text"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
                <a
                  href={`tel:${company.phone.replace(/\s/g, "")}`}
                  aria-label="Bizi arayın"
                  className="mk-focus flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-primary/50 hover:text-brand-text"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
              <div className="mk-display mt-5 text-[11px] italic tracking-wide text-muted-foreground">«{brand.slogan}»</div>
            </div>

            {/* Kolon 2: Hızlı bağlantılar */}
            <div className="text-center md:text-left">
              <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-text">Hızlı Bağlantılar</div>
              <ul className="mt-4 space-y-2.5 text-[13px]">
                {[
                  { label: "Randevu Al", action: () => onBook(null), icon: CalendarCheck },
                  { label: "Canlı Nail Studio", action: onStudio, icon: Wand2 },
                  { label: "Nail Art Galerisi", action: () => onNailArt?.(), icon: Sparkles },
                  { label: "Hediye Kartı", action: () => document.getElementById("hediye-karti")?.scrollIntoView({ behavior: "smooth" }), icon: Gift },
                  { label: "Misafir Yorumları", action: onReviews, icon: MessageSquareHeart },
                  { label: "Ekip Girişi", action: onStaffLogin, icon: ShieldCheck },
                ].map((l) => (
                  <li key={l.label}>
                    <button
                      onClick={l.action}
                      className="mk-focus group inline-flex items-center gap-2 rounded text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <l.icon className="h-3.5 w-3.5 text-brand-text/70 transition-colors group-hover:text-brand-text" />
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kolon 3: Saatler + mobil uygulama */}
            <div className="text-center md:text-left">
              <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-text">Çalışma Saatleri</div>
              <ul className="mt-4 space-y-1.5 text-[12px]">
                {BRANDING.openingHours.map((h, i) => (
                  <li key={h.day} className="flex items-center justify-between gap-3 md:justify-start">
                    <span className={cn("font-medium", h.closed ? "text-muted-foreground/70" : "text-foreground")}>{h.day}</span>
                    <span className="ml-auto inline-flex items-center gap-2">
                      <span className="h-px w-4 bg-border md:hidden" aria-hidden="true" />
                      <span className={cn("font-mono text-[11px]", i === todayIdx ? "font-bold text-brand-text" : "text-muted-foreground")}>
                        {h.hours}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3 md:justify-start">
                <a
                  href="https://github.com/batko15/melek-guzellik-suite/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mk-focus mk-ornament mk-logo-frame shrink-0 rounded-lg p-1.5 transition-transform hover:scale-[1.03]"
                  aria-label="Melek'çe Android uygulamasını indir (GitHub)"
                >
                  <img
                    src="/brand/app-qr.png"
                    alt="Melek'çe Android uygulaması indirme QR kodu"
                    className="h-16 w-16 rounded"
                    width={64}
                    height={64}
                  />
                </a>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-brand-text" />
                    <span className="text-[12px] font-bold">Mobil uygulama</span>
                  </div>
                  <p className="mt-1 max-w-[210px] text-[10px] leading-relaxed text-muted-foreground">
                    Randevu, galeri ve hediye kartı tek dokunuşta cebinizde. iPhone: Safari → «Ana Ekrana Ekle».
                  </p>
                  <a
                    href="https://github.com/batko15/melek-guzellik-suite/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mk-focus mt-1.5 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-brand-text transition-colors hover:bg-primary/20"
                  >
                    <Download className="h-3 w-3" /> APK indir
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Alt bant */}
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-5 sm:flex-row">
            <div className="flex items-center gap-2.5 text-[9px] uppercase tracking-[0.3em] text-muted-foreground/70">
              <span className="mk-since-badge">Since {brand.since}</span>
              <span className="mk-diamond scale-75 opacity-50" />
              <span>Gelibolu</span>
            </div>
            <div className="text-[10px] text-muted-foreground/70">
              Melek'çe Güzellik Suite <span className="font-semibold text-brand-text/80">V{BRANDING.version}</span> · {BRANDING.versionCodename}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// V5.4: HEDİYE KARTI BÖLÜMÜ — talep formu + dijital kart görseli
// (Araştırma: dijital hediye kartları nail salonları için yıl boyu satış
//  iticisi — Booksy/Mangomint/Square hepsinde standart özellik)
// ═══════════════════════════════════════════════════════════════════════════

function GiftCardSection() {
  const company = BRANDING.company
  const [amount, setAmount] = useState<number>(1000)
  const [customAmount, setCustomAmount] = useState<string>("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [recipient, setRecipient] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<{ code: string; amount: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [waUrl, setWaUrl] = useState("")

  // Kopyalama geri bildirimi zamanlayıcısı — bileşen kaldırılırsa temizle
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current)
  }, [])

  const amounts = [500, 750, 1000, 1500]
  const selectedAmount = customAmount ? Math.round(Number(customAmount.replace(/\D/g, "")) || 0) : amount

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError("")
    if (name.trim().length < 2) return setError("Lütfen adınızı girin.")
    if (phone.replace(/\D/g, "").length < 7) return setError("Lütfen geçerli bir telefon numarası girin.")
    if (!Number.isFinite(selectedAmount) || selectedAmount < 250 || selectedAmount > 25000) {
      return setError("Tutar 250 – 25.000 ₺ arasında olmalı.")
    }
    setSending(true)
    try {
      const res = await fetch("/api/v1/salon/giftcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: name.trim(),
          buyerPhone: phone.trim(),
          amount: selectedAmount,
          recipientName: recipient.trim() || undefined,
          message: note.trim() || undefined,
        }),
      })
      const json = (await res.json()) as {
        card?: { code: string; amount: number }
        whatsappUrl?: string
        error?: string
      }
      if (!res.ok || !json.card) {
        setError(json.error ?? "Hediye kartı oluşturulamadı.")
        return
      }
      setDone({ code: json.card.code, amount: json.card.amount })
      setWaUrl(json.whatsappUrl ?? "")
    } catch {
      setError("Bağlantı hatası — lütfen tekrar deneyin.")
    } finally {
      setSending(false)
    }
  }

  const copyCode = async () => {
    if (!done) return
    try {
      await navigator.clipboard.writeText(done.code)
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // panoya kopyalanamadı — zararsız
    }
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      {/* ── Sol: dijital kart görseli + neden hediye kartı ── */}
      <div className="mk-anim-up">
        {/* Dijital hediye kartı (CSS ile çizilmiş — saman+altın) */}
        <div className="mk-gold-glow relative overflow-hidden rounded-2xl border border-primary/40 p-7 sm:p-9">
          <div className="mk-velvet absolute inset-0" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="mk-gold-glow flex h-10 w-10 items-center justify-center rounded-full border border-primary/45 bg-primary/10">
                  <img src={BRANDING.brand.logoWing} alt="" className="h-full w-full scale-[1.18] object-cover" />
                </span>
                <div>
                  <div className="mk-display text-sm font-bold leading-tight">{BRAND_DISPLAY.part1}'çe</div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.28em] text-brand-text/80">Hediye Kartı</div>
                </div>
              </div>
              <Gift className="h-6 w-6 text-brand-text" strokeWidth={1.6} />
            </div>
            <div className="mt-7 flex items-baseline gap-2">
              <span className="mk-display text-4xl font-bold text-brand-text sm:text-5xl">
                {selectedAmount ? Math.round(selectedAmount).toLocaleString("tr-TR") : "—"}
              </span>
              <span className="mk-display text-lg font-bold text-brand-text/70">{BRANDING.locale.currencySymbol}</span>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              Tüm hizmetlerde geçerli — {company.city}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
              <div className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
                {done ? done.code : "MELEK-••••-••••"}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground/75">
                Since {BRANDING.brand.since}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-2.5 text-xs leading-relaxed text-muted-foreground">
          {[
            "✉️ Kod dijital olarak oluşturulur — çıktı veya kargo gerekmez",
            "💅 Manikür, pedikür, kirpik ve tüm paketlerde geçerli",
            "🤝 Ödeme nakit veya havale ile yapıldığında anında aktifleşir",
            "📅 Bakiye birden fazla randevuda kullanılabilir",
          ].map((t) => (
            <div key={t} className="flex items-start gap-2 rounded-lg border border-border/50 bg-card/50 px-3.5 py-2.5">
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* ── Sağ: talep formu ── */}
      <div className="mk-card mk-anim-up mk-delay-2 rounded-2xl p-6 sm:p-7">
        {done ? (
          <div className="text-center">
            <div className="mk-gold-glow mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
              <Check className="h-8 w-8 text-brand-text" strokeWidth={1.8} />
            </div>
            <h3 className="mk-display mt-4 text-xl font-bold">Hediye kartınız hazır!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Ödeme alındığında kartınız aktifleşir — kodu hediye edeceğiniz kişiyle paylaşabilirsiniz.
            </p>
            <button
              onClick={copyCode}
              className="mk-focus mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3.5 font-mono text-lg font-bold tracking-[0.14em] text-brand-text transition-colors hover:bg-primary/15"
            >
              {done.code} {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4 opacity-70" />}
            </button>
            {waUrl && (
              <Button asChild variant="outline" className="mk-focus mt-3 h-11 w-full rounded-full border-emerald-700/50 font-semibold text-emerald-400 hover:bg-emerald-950/30">
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp'tan Bildir
                </a>
              </Button>
            )}
            <button
              onClick={() => { setDone(null); setCopied(false); setName(""); setPhone(""); setRecipient(""); setNote(""); setCustomAmount("") }}
              className="mk-focus mt-4 text-xs font-semibold text-brand-text hover:underline"
            >
              Yeni bir kart daha oluştur
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <div className="mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Tutar seçin
              </div>
              <div className="grid grid-cols-4 gap-2">
                {amounts.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => { setAmount(a); setCustomAmount("") }}
                    className={cn(
                      "mk-focus rounded-xl border py-2.5 text-sm font-bold transition-all",
                      !customAmount && amount === a
                        ? "mk-gold-glow border-primary bg-primary/15 text-brand-text"
                        : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {a.toLocaleString("tr-TR")}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-border/70 px-3.5">
                <span className="text-sm font-bold text-brand-text">{BRANDING.locale.currencySymbol}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="veya özel tutar (250–25.000)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value.replace(/[^\d]/g, ""))}
                  className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground" htmlFor="gc-name">
                Adınız Soyadınız <span className="text-brand-text">*</span>
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input id="gc-name" placeholder="örn. Ayşe Demir" autoComplete="name" value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mk-focus h-11 w-full rounded-xl border border-border/70 bg-transparent pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary/50" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground" htmlFor="gc-phone">
                Telefon <span className="text-brand-text">*</span>
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input id="gc-phone" type="tel" placeholder="+90 5XX XXX XX XX" autoComplete="tel" value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mk-focus h-11 w-full rounded-xl border border-border/70 bg-transparent pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary/50" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground" htmlFor="gc-recipient">
                  Kime hediye? <span className="text-muted-foreground/60">(isteğe bağlı)</span>
                </label>
                <input id="gc-recipient" placeholder="örn. Annem" value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="mk-focus h-11 w-full rounded-xl border border-border/70 bg-transparent px-3.5 text-sm outline-none transition-colors focus:border-primary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground" htmlFor="gc-note">
                  Hediye notu <span className="text-muted-foreground/60">(isteğe bağlı)</span>
                </label>
                <input id="gc-note" placeholder="örn. Doğum günün kutlu olsun!" value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mk-focus h-11 w-full rounded-xl border border-border/70 bg-transparent px-3.5 text-sm outline-none transition-colors focus:border-primary/50" />
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={sending}
              className="mk-gold-glow h-12 w-full rounded-full bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90">
              {sending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Oluşturuluyor…
                </span>
              ) : (
                <><Gift className="mr-1.5 h-5 w-5" /> Hediye Kartı Oluştur</>
              )}
            </Button>
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              Talebiniz stüdyomuza iletilir — ödeme sonrası kart kodunuz aktifleşir. Sorunuz olursa{" "}
              <a
                href={`https://wa.me/${(company.whatsapp ?? company.phone).replace(/\D/g, "")}?text=${encodeURIComponent("Merhaba! Hediye kartı hakkında sorum var. 🎁")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-brand-text hover:underline"
              >
                WhatsApp'tan yazın
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
