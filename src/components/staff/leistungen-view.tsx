// Team-Portal — Leistungen & Preise: Preisliste nach Kategorien

"use client"

import { useQuery } from "@tanstack/react-query"
import { Sparkles, Clock, Crown, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BRANDING } from "@/config/branding"
import { type SalonService, CATEGORY_META, chf, minutesLabel } from "@/lib/salon"

export function LeistungenView() {
  const { data, isLoading } = useQuery({
    queryKey: ["salon-services"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/services")
      if (!res.ok) return { services: [] as SalonService[] }
      return (await res.json()) as { services: SalonService[] }
    },
  })

  const services = data?.services ?? []
  const avgPrice = services.length > 0 ? Math.round(services.reduce((s, x) => s + x.priceChf, 0) / services.length) : 0
  const avgDur = services.length > 0 ? Math.round(services.reduce((s, x) => s + x.durationMin, 0) / services.length) : 0

  return (
    <div className="mk-velvet">
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-brand-text">
            <Sparkles className="h-3.5 w-3.5" /> Preisliste
          </div>
          <h1 className="mk-display text-2xl font-bold tracking-tight sm:text-3xl">
            Leistungen & <span className="mk-gold-text">Preise</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {services.length} Behandlungen · Ø Preis CHF {chf(avgPrice)} · Ø Dauer {minutesLabel(avgDur)}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        <div className="mk-card flex items-start gap-3 rounded-xl border-primary/25 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Preise ändern sich mit der nächsten Buchung automatisch mit (die Buchung speichert den Preis zum Buchungszeitpunkt).
            Neue Leistungen und Preisanpassungen erfolgen über die Datenbank bzw. das White-Label-Setup — siehe <span className="font-semibold text-foreground">Einstellungen → Template-Info</span>.
          </p>
        </div>

        {["naegel", "beauty", "wimpern"].map((cat) => {
          const catServices = services.filter((s) => s.category === cat)
          if (catServices.length === 0) return null
          const catAvg = catServices.reduce((s, x) => s + x.priceChf, 0) / catServices.length
          return (
            <Card key={cat} className="mk-card border-border">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{CATEGORY_META[cat]?.emoji}</span>
                    <span className="mk-display text-base font-bold">{CATEGORY_META[cat]?.label ?? cat}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Ø CHF {chf(Math.round(catAvg))} · {catServices.length} Leistungen</span>
                </div>
                <div className="divide-y divide-border/40">
                  {isLoading && [1, 2, 3].map((i) => (
                    <div key={i} className="px-5 py-3"><Skeleton className="h-8 w-full rounded-md" /></div>
                  ))}
                  {catServices.map((s) => (
                    <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-secondary/25">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="mk-display text-sm font-bold">{s.name}</span>
                          {s.popular && (
                            <Badge className="border-primary/40 bg-primary/10 text-[9px] font-bold uppercase text-brand-text">
                              <Crown className="mr-0.5 h-2.5 w-2.5" /> Beliebt
                            </Badge>
                          )}
                        </div>
                        {s.description && <div className="mt-0.5 truncate text-xs text-muted-foreground">{s.description}</div>}
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {minutesLabel(s.durationMin)}
                        </span>
                        <span className="mk-display w-20 text-right text-base font-bold text-brand-text">CHF {chf(s.priceChf)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
