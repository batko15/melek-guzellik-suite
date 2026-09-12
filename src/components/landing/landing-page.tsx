// Öffentliche Landing-Page für Melek'ce Güzellik
// Hero · Leistungen & Preise · Galerie · Über uns · Öffnungszeiten · Kontakt
// Kundinnen können hier alles sehen OHNE Login — Buchung via Login-Button.

"use client"

import { useQuery } from "@tanstack/react-query"
import { Sparkles, Heart, Crown, Flower2, Instagram, MapPin, Phone, Clock, CalendarCheck, ChevronRight, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"
import { type SalonService, type GalleryEntry, CATEGORY_META, chf, minutesLabel } from "@/lib/salon"

const BRAND_ICONS: Record<string, React.ElementType> = { sparkles: Sparkles, heart: Heart, crown: Crown, flower: Flower2 }
const BrandIcon = BRAND_ICONS[BRANDING.brand.icon] ?? Sparkles

export function LandingPage({ onLogin }: { onLogin: (mode: "customer" | "staff") => void }) {
  const { company, landing } = BRANDING
  const instagramUrl = `https://www.instagram.com/${company.instagram}`

  // Leistungen & Galerie laden
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

  const services = servicesData?.services ?? []
  const gallery = galleryData?.items ?? []
  const categories = ["naegel", "beauty", "wimpern"].filter((c) => services.some((s) => s.category === c))
  const todayIdx = (new Date().getDay() + 6) % 7

  return (
    <div className="mk-velvet min-h-screen bg-background">
      {/* ═══ Navbar ═══ */}
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
            <a href="#leistungen" className="mk-focus rounded transition-colors hover:text-foreground">Leistungen</a>
            <a href="#galerie" className="mk-focus rounded transition-colors hover:text-foreground">Galerie</a>
            <a href="#ueber" className="mk-focus rounded transition-colors hover:text-foreground">Über uns</a>
            <a href="#kontakt" className="mk-focus rounded transition-colors hover:text-foreground">Kontakt</a>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Button
              onClick={() => onLogin("customer")}
              className="mk-gold-glow h-10 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              <CalendarCheck className="mr-1.5 h-4 w-4" />
              Termin buchen
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLogin("staff")}
              className="h-10 rounded-full border-border/70 px-4 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground"
            >
              Team
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
                onClick={() => onLogin("customer")}
                className="mk-gold-glow h-12 rounded-full bg-primary px-7 text-base font-bold text-primary-foreground hover:bg-primary/90"
              >
                {landing.ctaButton}
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
              <span className="text-xs text-muted-foreground">{landing.ctaHint}</span>
            </div>

            {/* Statistiken */}
            <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
              {landing.stats.map((s, i) => (
                <div key={s.label} className={cn("mk-card mk-anim-up rounded-xl px-4 py-4", `mk-delay-${i + 1}`)}>
                  <div className="mk-display text-2xl font-bold text-brand-text">{s.value}</div>
                  <div className="mt-1 text-[11px] font-medium leading-tight text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            <p className="mt-8 text-xs italic text-muted-foreground">
              {BRANDING.brand.slogan} — <span className="not-italic">{BRANDING.brand.sloganDe}</span>
            </p>
          </div>

          {/* Hero-Bild */}
          <div className="mk-anim-up relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="mk-gold-glow-soft relative overflow-hidden rounded-3xl border border-primary/25">
              { }
              <img
                src="/gallery/hero.png"
                alt="Elegante Gold-Gel-Nägel auf schwarzer Seide — Nail-Art von Melek'ce Güzellik"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md">
                <div className="text-xs font-semibold text-foreground">Champagner-Gold Design</div>
                <Badge className="border-primary/40 bg-primary/10 text-[10px] text-brand-text">Nail Art</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Leistungen & Preise ═══ */}
      <section id="leistungen" className="border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-text">Leistungen & Preise</div>
            <h2 className="mk-display mt-3 text-3xl font-bold sm:text-4xl">
              Verwöhnprogramme für <span className="mk-gold-text">jede Frau</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Hochwertige Produkte, präzise Technik und Zeit für Ihre Wünsche — von klassischer Maniküre bis zum kompletten Wimpern-Wow.
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
                        Beliebt
                      </Badge>
                    )}
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="mk-display text-[15px] font-bold text-foreground">{s.name}</div>
                      <div className="mk-display shrink-0 text-lg font-bold text-brand-text">CHF {chf(s.priceChf)}</div>
                    </div>
                    {s.description && (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <Clock className="h-3 w-3 text-brand-text/70" />
                      {minutesLabel(s.durationMin)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mk-card mt-4 flex flex-col items-center justify-between gap-4 rounded-xl p-6 text-center sm:flex-row sm:text-left">
            <div>
              <div className="mk-display text-lg font-bold">Bereit für Ihren Termin?</div>
              <div className="mt-1 text-sm text-muted-foreground">Online buchen in 1 Minute — Leistungen, Zeit und Wunschtermin selbst wählen.</div>
            </div>
            <Button
              onClick={() => onLogin("customer")}
              className="mk-gold-glow h-11 shrink-0 rounded-full bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/90"
            >
              <CalendarCheck className="mr-1.5 h-4 w-4" /> Jetzt buchen
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ Galerie ═══ */}
      <section id="galerie" className="border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-text">Galerie</div>
            <h2 className="mk-display mt-3 text-3xl font-bold sm:text-4xl">
              Unsere <span className="mk-gold-text">Arbeiten</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((g, i) => (
              <figure key={g.id} className={cn("mk-card mk-anim-up group relative overflow-hidden rounded-xl", `mk-delay-${Math.min(6, (i % 6) + 1)}`)}>
                { }
                <img
                  src={g.imagePath}
                  alt={`${g.title} — ${CATEGORY_META[g.category]?.label ?? g.category} von Melek'ce Güzellik`}
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
              Mehr auf Instagram · @{company.instagram}
            </a>
          </div>
        </div>
      </section>

      {/* ═══ Über uns ═══ */}
      <section id="ueber" className="border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div className="mk-gold-glow-soft overflow-hidden rounded-3xl border border-primary/25">
            { }
            <img
              src="/gallery/salon-interior.png"
              alt="Elegantes Studio-Interieur in Schwarz und Gold bei Melek'ce Güzellik"
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-text">Über uns</div>
            <h2 className="mk-display mt-3 text-3xl font-bold sm:text-4xl">{landing.aboutTitle}</h2>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground">{landing.aboutText}</p>
            <div className="mt-7 space-y-3">
              {[
                { icon: Sparkles, text: "Hochwertige, hautfreundliche Produkte" },
                { icon: Heart, text: "Zeit & Beratung für Ihre individuellen Wünsche" },
                { icon: Crown, text: "Elegantes Ambiente — Sie fühlen sich wie ein Engel" },
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

      {/* ═══ Öffnungszeiten & Kontakt ═══ */}
      <section id="kontakt" className="border-t border-border/60 py-14 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
          {/* Öffnungszeiten */}
          <div className="mk-card rounded-2xl p-7">
            <div className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.25em] text-brand-text">
              <Clock className="h-4 w-4" /> Öffnungszeiten
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
                    {i === todayIdx && <span className="ml-2 text-[10px] font-bold uppercase text-brand-text">Heute</span>}
                  </span>
                  <span className={cn("font-mono text-xs", h.closed ? "text-muted-foreground/70" : "text-foreground")}>{h.hours}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kontakt */}
          <div className="mk-card rounded-2xl p-7">
            <div className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.25em] text-brand-text">
              <MapPin className="h-4 w-4" /> Kontakt & Anfahrt
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
                <Instagram className="h-4 w-4 shrink-0 text-brand-text/70" />
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-brand-text hover:underline">
                  @{company.instagram}
                </a>
              </div>
            </div>
            <div className="mt-6 border-t border-border/60 pt-5">
              <Button
                onClick={() => onLogin("customer")}
                className="mk-gold-glow h-11 w-full rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90"
              >
                <CalendarCheck className="mr-1.5 h-4 w-4" /> Termin online buchen
              </Button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Oder klassisch per Telefon oder Instagram-Direktnachricht.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
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
              <button onClick={() => onLogin("staff")} className="mk-focus rounded hover:text-foreground">Team-Login</button>
            </div>
          </div>
          <p className="mt-5 text-center text-[10px] italic text-muted-foreground/60">
            {BRANDING.brand.slogan} — {BRANDING.brand.sloganDe}
          </p>
        </div>
      </footer>
    </div>
  )
}
