// Team-Portal — Galerie-Verwaltung: Bilder, die auf der Landing-Page erscheinen

"use client"

import { useQuery } from "@tanstack/react-query"
import { Image as ImageIcon, Sparkles, Instagram, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BRANDING } from "@/config/branding"
import { type GalleryEntry, CATEGORY_META } from "@/lib/salon"

export function GalerieView() {
  const { data, isLoading } = useQuery({
    queryKey: ["salon-gallery"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/gallery")
      if (!res.ok) return { items: [] as GalleryEntry[] }
      return (await res.json()) as { items: GalleryEntry[] }
    },
  })

  const items = data?.items ?? []
  const instagramUrl = `https://www.instagram.com/${BRANDING.company.instagram}`

  return (
    <div className="mk-velvet">
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-brand-text">
            <ImageIcon className="h-3.5 w-3.5" /> Arbeiten-Showcase
          </div>
          <h1 className="mk-display text-2xl font-bold tracking-tight sm:text-3xl">
            Galerie <span className="mk-gold-text">verwalten</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {items.length} Bilder erscheinen auf der öffentlichen Webseite (Sektion «Galerie») — genau in dieser Reihenfolge.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        <div className="mk-card flex flex-col items-start gap-3 rounded-xl border-primary/25 p-4 sm:flex-row sm:items-center">
          <Instagram className="h-5 w-5 shrink-0 text-brand-text" />
          <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
            Diese Bilder sind auf der Landing-Page sichtbar. Eigene Fotos einfach als PNG/JPG in den Ordner{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground">public/gallery/</code>{" "}
            legen und in der Datenbank (Tabelle <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground">GalleryItem</code>) eintragen — oder die vorhandenen Dateien ersetzen.
          </p>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mk-focus flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <Instagram className="h-3.5 w-3.5 text-brand-text" /> Instagram öffnen
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {isLoading && [1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="aspect-square w-full rounded-xl" />)}
          {items.map((g, i) => (
            <figure key={g.id} className={cn("mk-card mk-anim-up group relative overflow-hidden rounded-xl", `mk-delay-${Math.min(6, (i % 6) + 1)}`)}>
              { }
              <img
                src={g.imagePath}
                alt={`${g.title} — ${CATEGORY_META[g.category]?.label ?? g.category}`}
                className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent px-3 pb-2.5 pt-8">
                <div className="flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-foreground">{g.title}</div>
                    <div className="text-[10px] text-muted-foreground">{CATEGORY_META[g.category]?.label ?? g.category}</div>
                  </div>
                  <Badge className="shrink-0 border-primary/30 bg-background/70 text-[9px] text-brand-text">
                    <Eye className="mr-0.5 h-2.5 w-2.5" /> Live
                  </Badge>
                </div>
              </figcaption>
              <div className="absolute left-2 top-2 rounded-full bg-background/70 px-2 py-0.5 font-mono text-[10px] font-bold text-brand-text backdrop-blur-sm">
                #{i + 1}
              </div>
            </figure>
          ))}
        </div>
      </section>
    </div>
  )
}
