// Ekip Portalı — Müşteri Yönetimi: KPI'lar, kartlar + geçmiş ve notlar

"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Users, Search, Phone, Mail, CalendarDays, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { type SalonCustomerRow, type SalonBooking, BOOKING_STATUS, para, dateStr, timeStr } from "@/lib/salon"

export function MusterilerView() {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<SalonCustomerRow | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["salon-customers"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/customers")
      if (!res.ok) return { customers: [] as SalonCustomerRow[] }
      return (await res.json()) as { customers: SalonCustomerRow[] }
    },
  })

  const { data: selectedBookings } = useQuery({
    queryKey: ["customer-bookings", selected?.phone],
    queryFn: async () => {
      if (!selected) return { bookings: [] as SalonBooking[] }
      const res = await fetch(`/api/v1/salon/bookings?phone=${encodeURIComponent(selected.phone)}`)
      if (!res.ok) return { bookings: [] as SalonBooking[] }
      return (await res.json()) as { bookings: SalonBooking[] }
    },
    enabled: !!selected,
  })

  const customers = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = data?.customers ?? []
    if (q) {
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
      )
    }
    return list
  }, [data, search])

  const all = data?.customers ?? []
  const totalVolume = all.reduce((s, c) => s + c.volumeChf, 0)
  const regulars = all.filter((c) => c.completedBookings >= 3).length

  return (
    <div className="mk-velvet">
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-brand-text">
            <Users className="h-3.5 w-3.5" /> CRM
          </div>
          <h1 className="mk-display text-2xl font-bold tracking-tight sm:text-3xl">
            Müşteri <span className="mk-gold-text">Yönetimi</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {all.length} müşteri · {regulars} sık gelen müşteri · toplam ciro {para(totalVolume)}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        {/* Arama */}
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Ara: ad, telefon veya e-posta…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mk-focus h-10 rounded-full pl-10"
          />
        </div>

        {/* Kartlar */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && [1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
          {customers.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={cn(
                "mk-card mk-kpi mk-anim-up group relative overflow-hidden rounded-xl p-5 text-left",
                `mk-delay-${Math.min(6, (i % 6) + 1)}`,
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="mk-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-bold text-brand-text">
                    {c.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold" title={c.name}>{c.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground" title={c.phone}>{c.phone}</div>
                  </div>
                </div>
                {c.completedBookings >= 3 && (
                  <Badge className="shrink-0 border-primary/40 bg-primary/10 text-[9px] font-bold text-brand-text">
                    <Crown className="mr-0.5 h-2.5 w-2.5" /> Sadık
                  </Badge>
                )}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-center">
                <div>
                  <div className="mk-display text-base font-bold tabular-nums">{c.completedBookings}</div>
                  <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Ziyaret</div>
                </div>
                <div>
                  <div className="mk-display text-base font-bold tabular-nums text-brand-text">{para(c.volumeChf)}</div>
                  <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Ciro</div>
                </div>
                <div>
                  <div className="mk-display text-base font-bold tabular-nums">{c.upcomingBookings}</div>
                  <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Yaklaşan</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        {!isLoading && customers.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
            Müşteri bulunamadı — aramayı değiştirin.
          </div>
        )}
      </section>

      {/* ─── Detay sayfası ─── */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="mk-scroll w-full overflow-y-auto border-border bg-background sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="pb-0">
                <SheetTitle className="mk-display flex items-center gap-3 text-left">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-bold text-brand-text">
                    {selected.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                  </span>
                  <span className="truncate">{selected.name}</span>
                </SheetTitle>
                <SheetDescription className="text-left">
                  {dateStr(selected.since)} tarihinden beri müşteri
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-8">
                {/* İletişim */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-brand-text/70" />
                    <span className="truncate" title={selected.phone}>{selected.phone}</span>
                  </div>
                  {selected.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-brand-text/70" />
                      <span className="truncate" title={selected.email}>{selected.email}</span>
                    </div>
                  )}
                </div>

                {/* Notlar */}
                {selected.notes && (
                  <div className="rounded-xl border border-primary/25 bg-primary/8 p-3.5">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brand-text">Stüdyo notları</div>
                    <p className="text-xs leading-relaxed text-foreground/90">{selected.notes}</p>
                  </div>
                )}

                {/* İstatistik */}
                <div className="grid grid-cols-3 divide-x divide-border/60 rounded-xl border border-border/60 text-center">
                  <div className="px-2 py-3">
                    <div className="mk-display text-lg font-bold">{selected.completedBookings}</div>
                    <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Ziyaret</div>
                  </div>
                  <div className="px-2 py-3">
                    <div className="mk-display text-lg font-bold text-brand-text">{para(selected.volumeChf)}</div>
                    <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Ciro</div>
                  </div>
                  <div className="px-2 py-3">
                    <div className="mk-display text-lg font-bold">{selected.upcomingBookings}</div>
                    <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Yaklaşan</div>
                  </div>
                </div>

                {/* Geçmiş */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-brand-text" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Randevu geçmişi</span>
                  </div>
                  <div className="space-y-1.5">
                    {(selectedBookings?.bookings ?? []).map((b) => (
                      <div key={b.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-secondary/30 px-3 py-2 text-xs">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{b.service.name}</div>
                          <div className="text-[10px] text-muted-foreground">{dateStr(b.startAt)} · {timeStr(b.startAt)}</div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="mk-display font-bold text-brand-text">{para(b.priceChf)}</span>
                          <Badge className={cn("border text-[9px]", BOOKING_STATUS[b.status]?.cls)} variant="outline">
                            {BOOKING_STATUS[b.status]?.label}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {(selectedBookings?.bookings ?? []).length === 0 && (
                      <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                        Henüz randevu yok.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
