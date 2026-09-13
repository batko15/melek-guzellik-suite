// Ekip Portalı — Randevu Yönetimi: filtreler, tablo, durum işlemleri

"use client"

import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ClipboardList, Search, CheckCircle2, XCircle, CircleDot, Sparkles, Phone, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type SalonBooking, BOOKING_STATUS, para, timeStr, dateStr, weekdayStr, minutesLabel } from "@/lib/salon"

const STATUS_TABS = [
  { key: "tumu", label: "Tümü" },
  { key: "bekliyor", label: "Talepler" },
  { key: "onaylandi", label: "Onaylı" },
  { key: "tamamlandi", label: "Tamamlandı" },
  { key: "iptal", label: "İptal" },
]

export function RandevularView() {
  const [statusTab, setStatusTab] = useState("tumu")
  const [search, setSearch] = useState("")
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ["randevular"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/bookings")
      if (!res.ok) return { bookings: [] as SalonBooking[] }
      return (await res.json()) as { bookings: SalonBooking[] }
    },
  })

  const bookings = useMemo(() => {
    let list = data?.bookings ?? []
    if (statusTab !== "tumu") list = list.filter((b) => b.status === statusTab)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((b) =>
        b.customer.name.toLowerCase().includes(q) ||
        b.service.name.toLowerCase().includes(q) ||
        (b.customer.phone ?? "").toLowerCase().includes(q) ||
        (b.customer.email ?? "").toLowerCase().includes(q),
      )
    }
    return list
  }, [data, statusTab, search])

  const counts = useMemo(() => {
    const all = data?.bookings ?? []
    return {
      tumu: all.length,
      bekliyor: all.filter((b) => b.status === "bekliyor").length,
      onaylandi: all.filter((b) => b.status === "onaylandi").length,
      tamamlandi: all.filter((b) => b.status === "tamamlandi").length,
      iptal: all.filter((b) => b.status === "iptal").length,
    }
  }, [data])

  const setStatus = async (id: string, status: string, label: string) => {
    try {
      const res = await fetch("/api/v1/salon/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error()
      toast({ title: `Randevu ${label}`, description: "Durum güncellendi." })
      queryClient.invalidateQueries({ queryKey: ["randevular"] })
      queryClient.invalidateQueries({ queryKey: ["salon-stats"] })
      queryClient.invalidateQueries({ queryKey: ["kalender"] })
    } catch {
      toast({ title: "Hata", description: "Durum değiştirilemedi.", variant: "destructive" })
    }
  }

  const now = new Date()
  const upcoming = (data?.bookings ?? []).filter((b) => new Date(b.startAt) >= now && b.status === "bekliyor").length
  const openVolume = (data?.bookings ?? [])
    .filter((b) => new Date(b.startAt) >= now && (b.status === "bekliyor" || b.status === "onaylandi"))
    .reduce((s, b) => s + b.priceChf, 0)

  return (
    <div className="mk-velvet">
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-brand-text">
            <ClipboardList className="h-3.5 w-3.5" /> Talepler & durum
            {upcoming > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{upcoming} açık</span>
            )}
          </div>
          <h1 className="mk-display text-2xl font-bold tracking-tight sm:text-3xl">
            Randevu <span className="mk-gold-text">Yönetimi</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Talepleri onaylayın, randevuları tamamlayın veya iptal edin — açık randevu değeri: <span className="font-semibold text-brand-text">{para(openVolume)}</span>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        {/* Sekmeler + arama */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="mk-scroll flex gap-1 overflow-x-auto rounded-full bg-secondary/50 p-1">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusTab(t.key)}
                className={cn(
                  "mk-focus whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  statusTab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {counts[t.key as keyof typeof counts] > 0 && (
                  <span className={cn("ml-1.5", statusTab === t.key ? "text-primary-foreground/80" : "text-muted-foreground/70")}>
                    {counts[t.key as keyof typeof counts]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ara: müşteri, hizmet, telefon…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mk-focus h-10 rounded-full pl-10"
            />
          </div>
        </div>

        {/* Tablo (masaüstü) / Kartlar (mobil) */}
        <Card className="mk-card hidden border-border md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Randevu</th>
                    <th className="px-4 py-3">Müşteri</th>
                    <th className="px-4 py-3">Hizmet</th>
                    <th className="px-4 py-3">Süre</th>
                    <th className="px-4 py-3 text-right">Fiyat</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/40">
                      <td colSpan={7} className="px-4 py-3"><Skeleton className="h-9 w-full rounded-md" /></td>
                    </tr>
                  ))}
                  {!isLoading && bookings.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Randevu bulunamadı — filtreleri değiştirin.</td></tr>
                  )}
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-border/40 odd:bg-secondary/15 transition-colors hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{weekdayStr(b.startAt)}, {dateStr(b.startAt)}</div>
                        <div className="font-mono text-xs text-brand-text">{timeStr(b.startAt)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{b.customer.name}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-2.5 w-2.5" /> {b.customer.phone}
                        </div>
                        {b.customer.email && <div className="text-[10px] text-muted-foreground">{b.customer.email}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div>{b.service.name}</div>
                        {b.notes && <div className="mt-0.5 max-w-[220px] truncate text-xs italic text-muted-foreground">«{b.notes}»</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{minutesLabel(b.durationMin)}</td>
                      <td className="mk-display px-4 py-3 text-right font-bold text-brand-text">{para(b.priceChf)}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn("border text-[10px]", BOOKING_STATUS[b.status]?.cls)} variant="outline">
                          {BOOKING_STATUS[b.status]?.label ?? b.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs">
                              İşlem <ChevronDown className="ml-1 h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-border">
                            {b.status !== "onaylandi" && (
                              <DropdownMenuItem onClick={() => setStatus(b.id, "onaylandi", "onaylandı")}>
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Onayla
                              </DropdownMenuItem>
                            )}
                            {b.status !== "tamamlandi" && (
                              <DropdownMenuItem onClick={() => setStatus(b.id, "tamamlandi", "tamamlandı")}>
                                <Sparkles className="mr-2 h-3.5 w-3.5 text-brand-text" /> Tamamla
                              </DropdownMenuItem>
                            )}
                            {b.status !== "iptal" && (
                              <DropdownMenuItem onClick={() => setStatus(b.id, "iptal", "iptal edildi")} className="text-destructive">
                                <XCircle className="mr-2 h-3.5 w-3.5" /> İptal et
                              </DropdownMenuItem>
                            )}
                            {b.status === "iptal" && (
                              <DropdownMenuItem onClick={() => setStatus(b.id, "onaylandi", "yeniden etkinleştirildi")}>
                                <CircleDot className="mr-2 h-3.5 w-3.5" /> Yeniden etkinleştir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Mobil kartlar */}
        <div className="space-y-2.5 md:hidden">
          {isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          {bookings.map((b) => (
            <div key={b.id} className="mk-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mk-display text-sm font-bold">{b.customer.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {weekdayStr(b.startAt)}, {dateStr(b.startAt)} · <span className="font-mono text-brand-text">{timeStr(b.startAt)}</span>
                  </div>
                  <div className="mt-1 truncate text-xs">{b.service.name} · {minutesLabel(b.durationMin)}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Phone className="h-2.5 w-2.5" /> {b.customer.phone}
                  </div>
                  {b.notes && <div className="mt-1 truncate text-[11px] italic text-muted-foreground">«{b.notes}»</div>}
                </div>
                <div className="shrink-0 text-right">
                  <div className="mk-display text-sm font-bold text-brand-text">{para(b.priceChf)}</div>
                  <Badge className={cn("mt-1 border text-[9px]", BOOKING_STATUS[b.status]?.cls)} variant="outline">
                    {BOOKING_STATUS[b.status]?.label}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
                {b.status !== "onaylandi" && (
                  <Button size="sm" className="h-8 rounded-full bg-emerald-700 px-3 text-[11px] hover:bg-emerald-700/90" onClick={() => setStatus(b.id, "onaylandi", "onaylandı")}>
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Onayla
                  </Button>
                )}
                {b.status !== "tamamlandi" && (
                  <Button size="sm" className="h-8 rounded-full bg-primary px-3 text-[11px]" onClick={() => setStatus(b.id, "tamamlandi", "tamamlandı")}>
                    <Sparkles className="mr-1 h-3 w-3" /> Tamamla
                  </Button>
                )}
                {b.status !== "iptal" && (
                  <Button size="sm" variant="outline" className="h-8 rounded-full border-destructive/40 px-3 text-[11px] text-destructive hover:bg-destructive/10" onClick={() => setStatus(b.id, "iptal", "iptal edildi")}>
                    <XCircle className="mr-1 h-3 w-3" /> İptal
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!isLoading && bookings.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              Randevu bulunamadı.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
