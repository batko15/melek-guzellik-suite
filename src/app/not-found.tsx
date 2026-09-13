// ═══════════════════════════════════════════════════════════════════════════
// src/app/not-found.tsx — 404 (Next.js App Router, sunucu bileşeni)
// V4-c: zarif Türkçe 404 sayfası — ana sayfalara hızlı gezinme kartları.
// ═══════════════════════════════════════════════════════════════════════════

import type { Metadata } from "next"
import Link from "next/link"
import { CalendarCheck, Home, Image as ImageIcon, Sparkles, Star, Wand2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Sayfa bulunamadı (404)",
  robots: { index: false, follow: true },
}

const QUICK_LINKS = [
  { href: "/", label: "Ana Sayfa", desc: "Açılış sayfası", Icon: Home },
  { href: "/randevu", label: "Randevu Al", desc: "1 dakikada online", Icon: CalendarCheck },
  { href: "/nailstudio", label: "Canlı Studio", desc: "Tasarımını canlı oluştur", Icon: Wand2 },
  { href: "/nailart", label: "Nail Art", desc: "Tasarım galerisi", Icon: ImageIcon },
  { href: "/yorumlar", label: "Yorumlar", desc: "Misafir değerlendirmeleri", Icon: Star },
] as const

export default function NotFound() {
  return (
    <main
      aria-label="Sayfa bulunamadı"
      className="mk-velvet flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center"
    >
      {/* 404 grafiği — kanat + parıltı, marka emojisini sırtlar */}
      <div aria-hidden="true" className="relative mb-2 select-none">
        <span className="block text-6xl">🧚</span>
        <Sparkles
          className="absolute -right-5 -top-2 h-6 w-6 text-brand-text/80"
          aria-hidden="true"
        />
      </div>

      <p className="mk-display mk-gold-text text-6xl font-bold tracking-tight" aria-hidden="true">
        404
      </p>
      <h1 className="mk-display mt-3 text-balance text-2xl font-bold leading-snug">
        Sayfa <span className="mk-gold-text">bulunamadı</span>
      </h1>
      <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
        Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir — melek kanadıyla
        sizi doğru yola götürelim ✨
      </p>

      {/* Hızlı gezinme — ana sayfalar */}
      <nav aria-label="Hızlı gezinme" className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2">
        {QUICK_LINKS.map(({ href, label, desc, Icon }) => (
          <Link
            key={href}
            href={href}
            className="mk-focus group flex items-center gap-3 rounded-xl border border-border/70 bg-card/40 px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-brand-text transition-colors group-hover:bg-primary/15">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[13px] font-bold text-foreground">{label}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{desc}</span>
            </span>
          </Link>
        ))}
        {/* Son kart — görsel denge için tam genişlikte CTA */}
        <Link
          href="/randevu"
          className="mk-focus mk-gold-glow col-span-full flex h-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 sm:col-span-2"
        >
          <CalendarCheck className="mr-2 h-4 w-4" aria-hidden="true" />
          Hemen randevu al
        </Link>
      </nav>
    </main>
  )
}
