// Herkese açık açılış sayfası — Melek'çe Güzellik (V2, tamamen Türkçe)
// Hero + Canlı hava durumu · Hizmetler & Fiyatlar · Galeri · Değerlendirmeler ·
// Hakkımızda · Çalışma Saatleri · İletişim
// Randevu almak ve değerlendirme yazmak için giriş GEREKMEZ.

"use client"

import { useQuery } from "@tanstack/react-query"
import { Sparkles, Heart, Crown, Flower2, Instagram, MapPin, Phone, Clock, CalendarCheck, ChevronRight, Star, MessageSquareHeart, ArrowRight, MessageCircle, Navigation } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"
import { type SalonService, type GalleryEntry, type ReviewRow, type ReviewSummary, CATEGORY_META, para, minutesLabel, Stars } from "@/lib/salon"
import { WeatherWidget } from "@/components/weather-widget"
import { LocationMap } from "@/components/public/location-map"

const BRAND_ICONS: Record<string, React.ElementType> = { sparkles: Sparkles, heart: Heart, crown: Crown, flower: Flower2 }
const BrandIcon = BRAND_ICONS[BRANDING.brand.icon] ?? Sparkles

export function LandingPage({
  onBook, onReviews, onStaffLogin,
}: {
  onBook: () => void
  onReviews: () => void
  onStaffLogin: () => void
}) {
  const { company, landing } = BRANDING
  const instagramUrl = `https://www.instagram.com/${company.instagram}`

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
  const gallery = galleryData?.items ?? []
  const reviews = (reviewsData?.reviews ?? []).slice(0, 3)
  const summary = reviewsData?.summary
  const categories = ["tirnak", "guzellik", "kirpik"].filter((c) => services.some((s) => s.category === c))
  const todayIdx = (new Date().getDay() + 6) % 7

  return (
    <div className="mk-velvet min-h-screen bg-background">
      {/* ═══ Navbar (masaüstü) ═══ */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="mk-gold-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
              <BrandIcon className="h-5 w-5 text-brand-text" strokeWidth={1.8} />
            </div>
            <div className="leading-none">
              <div className="mk-display text-base font-bold tracking-wide">
                <span className="text-foreground">{BRAND_DISPLAY.part1}</span>{" "}
                <span className="mk-gold-text">{BRAND_DISPLAY.part2}</span>
              </div>
              <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                {BRANDING.brand.tagline}
              </div>
            </div>
          </div>
          <nav className="ml-auto hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#hizmetler" className="mk-focus rounded transition-colors hover:text-foreground">Hizmetler</a>
            <a href="#galeri" className="mk-focus rounded transition-colors hover:text-foreground">Galeri</a>
            <a href="#yorumlar" className="mk-focus rounded transition-colors hover:text-foreground">Yorumlar</a>
            <a href="#iletisim" className="mk-focus rounded transition-colors hover:text-foreground">İletişim</a>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Button
              onClick={onBook}
              className="mk-gold-glow h-10 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              <CalendarCheck className="mr-1.5 h-4 w-4" />
              Randevu Al
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onStaffLogin}
              className="h-10 rounded-full border-border/70 px-4 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground"
            >
              Ekip
            </Button>
          </div>
        </div>
      </header>

      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div className="mk-anim-right">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-text">
              <Star className="h-3 w-3 fill-current" />
              {BRANDING.brand.tagline}
            </div>
            <h1 className="mk-display text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
              {landing.heroTitle}
              <br />
              <span className="mk-gold-text">{landing.heroTitleAccent}</span>
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              {landing.heroDescription}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                onClick={onBook}
                className="mk-gold-glow h-12 rounded-full bg-primary px-7 text-base font-bold text-primary-foreground hover:bg-primary/90"
              >
                {landing.ctaButton}
                <ChevronRight className="ml-1 h-5 w-5" />
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
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="font-semibold text-brand-text">{landing.guestNote}</span> · {landing.ctaHint}
            </p>

            {/* İstatistikler */}
            <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
              {landing.stats.map((s, i) => (
                <div key={s.label} className={cn("mk-card mk-anim-up rounded-xl px-4 py-4", `mk-delay-${i + 1}`)}>
                  <div className="mk-display text-2xl font-bold text-brand-text">{s.value}</div>
                  <div className="mt-1 text-[11px] font-medium leading-tight text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            <p className="mt-8 text-xs italic text-muted-foreground">«{BRANDING.brand.slogan}»</p>
          </div>

          {/* Hero görseli + hava durumu */}
          <div className="mk-anim-up relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="mk-gold-glow-soft relative overflow-hidden rounded-3xl border border-primary/25">
              <img
                src="/gallery/hero.png"
                alt="Siyah ipek üzerinde zarif altın jel tırnaklar — Melek'çe Güzellik tırnak sanatı"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md">
                <div className="text-xs font-semibold text-foreground">Şampanya Altını Tasarım</div>
                <Badge className="border-primary/40 bg-primary/10 text-[10px] text-brand-text">Tırnak Sanatı</Badge>
              </div>
            </div>

            {/* Canlı hava durumu */}
            <div className="mt-4">
              <WeatherWidget variant="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Hizmetler & Fiyatlar ═══ */}
      <section id="hizmetler" className="border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-text">Hizmetler & Fiyatlar</div>
            <h2 className="mk-display mt-3 text-3xl font-bold sm:text-4xl">
              Her kadın için <span className="mk-gold-text">bakım programları</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Yüksek kaliteli ürünler, hassas teknik ve isteklerinize ayrılan zaman — klasik manikürden etkileyici kirpiklere kadar.
            </p>
          </div>

          {categories.map((cat) => (
            <div key={cat} className="mb-10">
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
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="mk-display text-[15px] font-bold text-foreground">{s.name}</div>
                      <div className="mk-display shrink-0 text-lg font-bold text-brand-text">{para(s.priceChf)}</div>
                    </div>
                    {s.description && (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        <Clock className="h-3 w-3 text-brand-text/70" />
                        {minutesLabel(s.durationMin)}
                      </div>
                      <button
                        onClick={onBook}
                        className="mk-focus rounded-full text-[11px] font-bold text-brand-text transition-colors hover:bg-primary/10 px-3 py-1"
                      >
                        Randevu Al →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mk-card mt-4 flex flex-col items-center justify-between gap-4 rounded-xl p-6 text-center sm:flex-row sm:text-left">
            <div>
              <div className="mk-display text-lg font-bold">Randevunuz için hazır mısınız?</div>
              <div className="mt-1 text-sm text-muted-foreground">1 dakikada online alın — hizmeti, saati ve tarihi kendiniz seçin. Giriş gerekmez.</div>
            </div>
            <Button
              onClick={onBook}
              className="mk-gold-glow h-11 shrink-0 rounded-full bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/90"
            >
              <CalendarCheck className="mr-1.5 h-4 w-4" /> Hemen Al
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ Misafir Değerlendirmeleri ═══ */}
      <section id="yorumlar" className="border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-text">Değerlendirmeler</div>
            <h2 className="mk-display mt-3 text-3xl font-bold sm:text-4xl">
              Misafirlerimiz <span className="mk-gold-text">ne diyor?</span>
            </h2>
            {summary && summary.count > 0 && (
              <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-primary/30 bg-primary/8 px-5 py-2.5">
                <span className="mk-display text-2xl font-bold text-brand-text">{summary.average.toFixed(1)}</span>
                <Stars value={summary.average} size="md" />
                <span className="text-xs text-muted-foreground">{summary.count} değerlendirme</span>
              </div>
            )}
          </div>

          {reviews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {reviews.map((r, i) => (
                <figure key={r.id} className={cn("mk-card mk-anim-up rounded-2xl p-6", `mk-delay-${i + 1}`)}>
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

      {/* ═══ Galeri ═══ */}
      <section id="galeri" className="border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-text">Galeri</div>
            <h2 className="mk-display mt-3 text-3xl font-bold sm:text-4xl">
              <span className="mk-gold-text">Çalışmalarımız</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((g, i) => (
              <figure key={g.id} className={cn("mk-card mk-anim-up group relative overflow-hidden rounded-xl", `mk-delay-${Math.min(6, (i % 6) + 1)}`)}>
                <img
                  src={g.imagePath}
                  alt={`${g.title} — Melek'çe Güzellik ${CATEGORY_META[g.category]?.label ?? g.category} çalışması`}
                  className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/85 to-transparent px-3 pb-2.5 pt-8">
                  <div className="text-xs font-bold text-foreground">{g.title}</div>
                  <div className="text-[10px] text-muted-foreground">{CATEGORY_META[g.category]?.label ?? g.category}</div>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-8 text-center">
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
        </div>
      </section>

      {/* ═══ Hakkımızda ═══ */}
      <section id="hakkimizda" className="border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div className="mk-gold-glow-soft overflow-hidden rounded-3xl border border-primary/25">
            <img
              src="/gallery/salon-interior.png"
              alt="Melek'çe Güzellik'te siyah ve altın tonlarında zarif stüdyo iç mekânı"
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-text">Hakkımızda</div>
            <h2 className="mk-display mt-3 text-3xl font-bold sm:text-4xl">{landing.aboutTitle}</h2>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground">{landing.aboutText}</p>
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
          </div>
        </div>
      </section>

      {/* ═══ Çalışma Saatleri & İletişim ═══ */}
      <section id="iletisim" className="border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
          {/* Çalışma saatleri */}
          <div className="mk-card rounded-2xl p-7">
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
          <div className="mk-card rounded-2xl p-7">
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
                <span className="text-muted-foreground">{company.phone}</span>
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
            </div>
            <div className="mt-6 border-t border-border/60 pt-5">
              <Button
                onClick={onBook}
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
      </section>

      {/* ═══ Konum & İnteraktif Harita ═══ */}
      <section id="konum" className="border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-text">Konum</div>
            <h2 className="mk-display mt-3 text-3xl font-bold sm:text-4xl">
              Bizi <span className="mk-gold-text">Gelibolu'da</span> bulun
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              {company.street}, {company.city} — haritayı yakınlaştırıp yol tarifi alın ya da WhatsApp'tan yazın.
            </p>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <LocationMap />
            </div>
            <div className="mk-card space-y-3 rounded-2xl p-6">
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
          </div>
        </div>
      </section>

      {/* ═══ Alt bilgi ═══ */}
      <footer className="mt-auto border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-center sm:text-left">
              <div className="mk-display text-sm font-bold">
                <span className="text-foreground">{BRAND_DISPLAY.part1}</span> <span className="mk-gold-text">{BRAND_DISPLAY.part2}</span>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {company.legalName} · {company.street}, {company.city} · {company.footerClaim}
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="mk-focus flex items-center gap-1.5 rounded hover:text-foreground">
                <Instagram className="h-3.5 w-3.5 text-brand-text/70" /> Instagram
              </a>
              <button onClick={onReviews} className="mk-focus rounded hover:text-foreground">Yorumlar</button>
              <button onClick={onStaffLogin} className="mk-focus rounded hover:text-foreground">Ekip Girişi</button>
            </div>
          </div>
          <p className="mt-5 text-center text-[10px] italic text-muted-foreground/60">
            «{BRANDING.brand.slogan}»
          </p>
        </div>
      </footer>
    </div>
  )
}
