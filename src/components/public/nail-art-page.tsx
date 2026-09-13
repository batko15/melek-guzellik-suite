// ═══════════════════════════════════════════════════════════════════════════
// NAIL ART — herkese açık tırnak sanatı sayfası (GİRİŞ GEREKMEZ)  ·  V5.6
//   • Tüm tırnak tasarımı galerisi (API'den canlı) + büyütme (lightbox)
//   • Tasarım başına «WhatsApp'tan iste» — tasarım adı mesaja otomatik gelir
//     (numara yalnızca bağlantı içinde, sayfada Kliğ metin ASLA görünmez)
//   • Tırnak hizmetleri & fiyatlar (menü stili) + randevu çağrısı
//   • Sayfayı paylaş (Web Share / panoya kopyala) — canlı link /nailart
// ═══════════════════════════════════════════════════════════════════════════

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ChevronLeft, ChevronRight, X, Clock, CalendarCheck, Instagram, Sparkles,
  Share2, Copy, Check, MessageCircle, Crown, Gem, Palette, ArrowRight, Phone, Wand2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BRANDING } from "@/config/branding"
import { type SalonService, type GalleryEntry, para, minutesLabel } from "@/lib/salon"

// ─── Klartext-Nummernschutz: yerel sayı biçimi (bağlantı için) ───────────────
function waLink(text: string): string {
  const digits = BRANDING.company.phone.replace(/[^\d]/g, "")
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function NailArtPage({
  onBack, onBook, onReviews, onStaffLogin, onStudio,
}: {
  onBack: () => void
  onBook: () => void
  onReviews: () => void
  onStaffLogin: () => void
  onStudio: () => void
}) {
  const { company, brand } = BRANDING
  const instagramUrl = `https://www.instagram.com/${company.instagram}`

  // Galeri (canlı API) — yalnızca tırnak kategorisi
  const { data: galleryData } = useQuery({
    queryKey: ["salon-gallery-nailart"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/gallery")
      if (!res.ok) return { items: [] as GalleryEntry[] }
      return (await res.json()) as { items: GalleryEntry[] }
    },
  })
  // Hizmetler — tırnak kategorisi
  const { data: servicesData } = useQuery({
    queryKey: ["salon-services-nailart"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/services")
      if (!res.ok) return { services: [] as SalonService[] }
      return (await res.json()) as { services: SalonService[] }
    },
  })

  const designs = useMemo(
    () => (galleryData?.items ?? []).filter((g) => g.category === "tirnak"),
    [galleryData],
  )
  const services = useMemo(
    () => (servicesData?.services ?? []).filter((s) => s.category === "tirnak"),
    [servicesData],
  )

  // ─── Lightbox durumu ───
  const [lightbox, setLightbox] = useState<number | null>(null)
  const current = lightbox !== null ? designs[lightbox] : undefined

  // Lightbox: klavye ile gezinme (←/→/ESC)
  const next = useCallback(() => {
    setLightbox((i) => (i === null ? null : (i + 1) % Math.max(1, designs.length)))
  }, [designs.length])
  const prev = useCallback(() => {
    setLightbox((i) => (i === null ? null : (i - 1 + Math.max(1, designs.length)) % Math.max(1, designs.length)))
  }, [designs.length])
  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null)
      if (e.key === "ArrowRight") next()
      if (e.key === "ArrowLeft") prev()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [lightbox, next, prev])

  // ─── Sayfayı paylaş ───
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const data = {
      title: "Melek'çe — Tırnak Sanatı Galerisi",
      text: "Tırnak sanatı tasarım galerimize göz atın ✨",
      url: typeof window !== "undefined" ? `${window.location.origin}/nailart` : "/nailart",
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share(data); return } catch { /* iptal — kopyaya düş */ }
    }
    try {
      await navigator.clipboard.writeText(data.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* pano yok — sessizce geç */ }
  }

  return (
    <div className="mk-velvet min-h-screen bg-background pb-24 md:pb-0">
      {/* ═══ Üst bar ═══ */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mk-gold-line h-[2px] w-full" />
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <button
            onClick={onBack}
            className="mk-focus flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Ana sayfaya dön"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="mk-gold-glow flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/40 bg-primary/8">
            <img src={BRANDING.brand.logoWing} alt="Melek'çe" className="h-full w-full scale-[1.18] object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="mk-display truncate text-lg font-bold">Tırnak Sanatı <span className="mk-gold-text">Galerisi</span></h1>
            <div className="truncate text-[11px] text-muted-foreground">Özel tasarımlarımız — büyütmek için fotoğrafa dokunun</div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1.5 text-[10px] font-bold text-brand-text sm:flex">
            <Sparkles className="h-3 w-3" /> {designs.length} tasarım
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* ═══ Giriş — istatistik kartları ═══ */}
        <div className="mk-card mk-anim-up mb-8 overflow-hidden rounded-2xl">
          <div className="grid grid-cols-3 divide-x divide-border/60">
            <div className="p-4 text-center sm:p-6">
              <div className="mk-display text-2xl font-bold text-brand-text sm:text-3xl">{designs.length}</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">Özel Tasarım</div>
            </div>
            <div className="p-4 text-center sm:p-6">
              <div className="mk-display text-2xl font-bold text-brand-text sm:text-3xl">{services.length}</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">Tırnak Hizmeti</div>
            </div>
            <div className="p-4 text-center sm:p-6">
              <div className="mk-display text-2xl font-bold text-brand-text sm:text-3xl">{new Date().getFullYear() - 2022}+</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">Yıllık Tecrübe</div>
            </div>
          </div>
          <div className="border-t border-border/60 bg-primary/5 px-5 py-3 text-center text-xs leading-relaxed text-muted-foreground">
            <Palette className="mr-1 inline h-3.5 w-3.5 text-brand-text" />
            Kedi gözü, ombre, folyo, inci tozu, fransız ve daha fazlası — her tasarım stüdyomuzda elle uygulanır.
          </div>
        </div>

        {/* ═══ Galeri — tırnak sanatı ═══ */}
        <section aria-label="Tırnak sanatı galerisi" className="mb-12">
          <div className="mb-5 flex items-center gap-3">
            <span className="mk-diamond" />
            <h2 className="mk-display text-xl font-bold">Tasarım Galerisi</h2>
            <div className="mk-gold-line h-px flex-1" />
          </div>

          {designs.length === 0 ? (
            <div className="mk-card rounded-2xl p-10 text-center text-sm text-muted-foreground">
              Tasarımlar yükleniyor…
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {designs.map((g, i) => (
                <button
                  key={g.id}
                  onClick={() => setLightbox(i)}
                  aria-label={`${g.title} tasarımını büyüt`}
                  className={cn(
                    "mk-gallery-tile mk-photo-frame mk-card mk-anim-up group relative overflow-hidden rounded-xl text-left",
                    `mk-delay-${Math.min(6, (i % 6) + 1)}`,
                  )}
                >
                  <img
                    src={g.imagePath}
                    alt={`${g.title} — Melek'çe tırnak sanatı tasarımı`}
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent px-3 pb-2.5 pt-10">
                    <div className="truncate text-xs font-bold text-foreground">{g.title}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-brand-text opacity-0 transition-opacity group-hover:opacity-100">
                      <MessageCircle className="h-3 w-3" /> Bu tasarımı iste
                    </div>
                  </figcaption>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mk-focus inline-flex items-center gap-2 rounded-full border border-border/70 px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <Instagram className="h-4 w-4 text-brand-text" />
              Instagram'da daha fazlası · @{company.instagram}
            </a>
            <button
              onClick={share}
              className="mk-focus inline-flex items-center gap-2 rounded-full border border-border/70 px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {copied ? <Check className="h-4 w-4 text-brand-text" /> : <Share2 className="h-4 w-4 text-brand-text" />}
              {copied ? "Bağlantı kopyalandı!" : "Galeriyi paylaş"}
            </button>
          </div>
        </section>

        {/* ═══ Tırnak hizmetleri — menü stili ═══ */}
        {services.length > 0 && (
          <section aria-label="Tırnak hizmetleri ve fiyatlar" className="mb-12">
            <div className="mb-5 flex items-center gap-3">
              <span className="mk-diamond" />
              <h2 className="mk-display text-xl font-bold">Tırnak Hizmetleri & Fiyatlar</h2>
              <div className="mk-gold-line h-px flex-1" />
            </div>
            <div className="mk-card rounded-2xl p-5 sm:p-6">
              {services.map((s) => (
                <div key={s.id} className={cn("py-4", "first:pt-0 last:pb-0")}>
                  <div className="flex items-baseline gap-2.5">
                    <div className="mk-display text-[15px] font-bold leading-snug text-foreground">
                      {s.name}
                      {s.popular && (
                        <Badge className="ml-2 border-primary/50 bg-primary/15 text-[9px] font-bold uppercase tracking-wider text-brand-text">
                          Popüler
                        </Badge>
                      )}
                    </div>
                    <div className="mb-1 flex-1 border-b border-dotted border-border/90" aria-hidden="true" />
                    <div className="mk-display shrink-0 text-lg font-bold text-brand-text">{para(s.priceChf)}</div>
                  </div>
                  {s.description && (
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <Clock className="h-3 w-3 text-brand-text/70" />
                      {minutesLabel(s.durationMin)}
                    </div>
                    <button
                      onClick={onBook}
                      className="mk-focus rounded-full px-3 py-1 text-[11px] font-bold text-brand-text transition-colors hover:bg-primary/10"
                    >
                      Randevu Al →
                    </button>
                  </div>
                  {s !== services[services.length - 1] && <div className="mt-4 border-t border-border/50" />}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══ Çağrı — randevu & iletişim ═══ */}
        <section className="mk-ornament mk-card flex flex-col items-center gap-5 rounded-2xl p-7 text-center sm:p-9">
          <Crown className="h-10 w-10 text-brand-text" strokeWidth={1.3} />
          <div>
            <h2 className="mk-display text-2xl font-bold">Beğendiğiniz tasarım <span className="mk-gold-text">sizin olsun</span></h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Tasarımı büyütün, «WhatsApp'tan iste» ile adını bize gönderin — ya da doğrudan online randevu alın. Giriş gerekmez.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button
              onClick={onStudio}
              className="mk-gold-glow mk-btn-lift h-12 rounded-full bg-primary px-7 font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Wand2 className="mr-1.5 h-4 w-4" /> Tasarımı Canlı Dene
            </Button>
            <Button
              onClick={onBook}
              variant="outline"
              className="h-12 rounded-full border-primary/40 px-7 font-bold text-brand-text hover:bg-primary/10"
            >
              <CalendarCheck className="mr-1.5 h-4 w-4" /> Hemen Randevu Al
            </Button>
            <a
              href={waLink("Merhaba! Tırnak sanatı galerinizdeki tasarımları çok beğendim, bilgi almak istiyorum.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mk-focus inline-flex h-12 items-center gap-2 rounded-full border border-primary/40 bg-primary/8 px-7 text-sm font-bold text-brand-text transition-colors hover:bg-primary/15"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp'tan yazın
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1 text-xs text-muted-foreground">
            <button onClick={onReviews} className="mk-focus inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-foreground">
              Misafir değerlendirmeleri <ArrowRight className="h-3 w-3" />
            </button>
            <a href={`tel:${BRANDING.company.phone}`} className="mk-focus inline-flex items-center gap-1.5 font-semibold transition-colors hover:text-foreground">
              <Phone className="h-3 w-3 text-brand-text" /> Bizi arayın
            </a>
            <button onClick={onStaffLogin} className="mk-focus rounded font-semibold transition-colors hover:text-foreground">
              Ekip girişi
            </button>
          </div>
        </section>
      </main>

      {/* ═══ Lightbox — tasarımı büyüt & WhatsApp'tan iste ═══ */}
      {current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${current.title} tasarım görüntüleyici`}
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Kapat"
            className="mk-focus absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Önceki / sonraki */}
          {designs.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                aria-label="Önceki tasarım"
                className="mk-focus absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-colors hover:text-foreground sm:left-6"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                aria-label="Sonraki tasarım"
                className="mk-focus absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-colors hover:text-foreground sm:right-6"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div
            className="mk-photo-frame mk-gold-glow mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-primary/25"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.imagePath}
              alt={`${current.title} — Melek'çe tırnak sanatı tasarımı (büyük)`}
              className="max-h-[62vh] w-full object-contain bg-secondary/40"
            />
            <div className="border-t border-border/60 bg-background p-4">
              <div className="flex items-center gap-2.5">
                <Gem className="h-4 w-4 shrink-0 text-brand-text" />
                <div className="mk-display min-w-0 flex-1 truncate text-lg font-bold">{current.title}</div>
                <div className="shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {lightbox! + 1} / {designs.length}
                </div>
              </div>
              <a
                href={waLink(`Merhaba! Tırnak sanatı galerinizdeki «${current.title}» tasarımını çok beğendim — bu tarz bir tasarım için randevu almak istiyorum.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mk-focus mt-3.5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <MessageCircle className="h-4 w-4" /> Bu tasarımı WhatsApp'tan iste
              </a>
              <button
                onClick={onBook}
                className="mk-focus mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/8 text-sm font-bold text-brand-text transition-colors hover:bg-primary/15"
              >
                <CalendarCheck className="h-4 w-4" /> Online randevu al
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
