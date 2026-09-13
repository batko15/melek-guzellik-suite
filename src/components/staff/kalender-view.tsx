// Ekip Portalı — Randevu Takvimi: 2 haftalık ızgara (pazartesi–pazar), bugün vurgulu

"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BOOKING_STATUS, type SalonBooking, timeStr, minutesLabel, para } from "@/lib/salon"

const DAY_MS = 86_400_000

function mondayOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return d
}

export function KalenderView() {
  const [weekOffset, setWeekOffset] = useState(0)
  const weekStart = useMemo(() => {
    const m = mondayOf(new Date())
    m.setDate(m.getDate() + weekOffset * 7)
    return m
  }, [weekOffset])

  const days = useMemo(
    () => Array.from({ length: 14 }, (_, i) => new Date(weekStart.getTime() + i * DAY_MS)),
    [weekStart],
  )

  const { data, isLoading } = useQuery({
    queryKey: ["kalender", weekStart.toISOString()],
    queryFn: async () => {
      const from = new Date(weekStart)
      const to = new Date(weekStart.getTime() + 14 * DAY_MS)
      const res = await fetch(`/api/v1/salon/bookings?from=${from.toISOString()}&to=${to.toISOString()}`)
      if (!res.ok) return { bookings: [] as SalonBooking[] }
      return (await res.json()) as { bookings: SalonBooking[] }
    },
  })

  const bookings = data?.bookings ?? []
  const byDay = (d: Date) =>
    bookings.filter((b) => {
      const bd = new Date(b.startAt)
      return bd.getDate() === d.getDate() && bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear()
    })

  const today = new Date()
  const isToday = (d: Date) => d.toDateString() === today.toDateString()
  const totalRevenue = bookings.filter((b) => b.status !== "iptal").reduce((s, b) => s + b.priceChf, 0)
  const weekLabel = `${weekStart.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} – ${new Date(weekStart.getTime() + 13 * DAY_MS).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}`

  return (
    <div className="mk-velvet">
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-brand-text">
            <CalendarDays className="h-3.5 w-3.5" /> Haftalık görünüm
          </div>
          <h1 className="mk-display text-2xl font-bold tracking-tight sm:text-3xl">
            Randevu takvimi — <span className="mk-gold-text">{weekLabel}</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Önümüzdeki 2 haftada {bookings.length} randevu · toplam değeri {para(totalRevenue)}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Hafta gezinme */}
        <div className="mb-5 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)} className="rounded-full">
            <ChevronLeft className="mr-1 h-4 w-4" /> Geri
          </Button>
          <span className="text-xs font-semibold text-muted-foreground">
            {weekOffset === 0 ? "Şu anki 2 hafta" : weekOffset > 0 ? `+${weekOffset} hafta ileri` : `${Math.abs(weekOffset)} hafta geri`}
          </span>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)} className="rounded-full">
            İleri <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {/* Takvim ızgarası */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {days.map((d, i) => {
            const dayBookings = byDay(d)
            const todayCls = isToday(d)
            return (
              <div
                key={d.toISOString()}
                className={cn(
                  "mk-card mk-anim-up min-h-[150px] rounded-xl p-3",
                  todayCls && "border-primary/50 bg-primary/5",
                  `mk-delay-${Math.min(6, (i % 6) + 1)}`,
                )}
              >
                <div className="mb-2 flex items-baseline justify-between border-b border-border/50 pb-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {d.toLocaleDateString("tr-TR", { weekday: "short" })}
                    </div>
                    <div className={cn("mk-display text-lg font-bold", todayCls ? "text-brand-text" : "text-foreground")}>
                      {d.getDate()}.{d.getMonth() + 1}
                      {todayCls && <span className="ml-1.5 text-[9px] font-bold uppercase text-brand-text">Bugün</span>}
                    </div>
                  </div>
                  {dayBookings.length > 0 && (
                    <Badge className="border-primary/40 bg-primary/10 text-[10px] text-brand-text">{dayBookings.length}</Badge>
                  )}
                </div>
                {isLoading && <Skeleton className="h-16 w-full rounded-md" />}
                <div className="space-y-1.5">
                  {dayBookings.length === 0 && !isLoading && (
                    <div className="py-3 text-center text-[11px] text-muted-foreground/60">boş</div>
                  )}
                  {dayBookings.map((b) => (
                    <div
                      key={b.id}
                      className={cn(
                        "rounded-md border p-2 text-xs",
                        b.status === "iptal"
                          ? "border-red-900/40 bg-red-950/20 opacity-60"
                          : b.status === "bekliyor"
                            ? "border-amber-800/40 bg-amber-950/15"
                            : "border-border/60 bg-secondary/40",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-brand-text">{timeStr(b.startAt)}</span>
                        <span className="text-[9px] text-muted-foreground">{minutesLabel(b.durationMin)}</span>
                      </div>
                      <div className="mt-0.5 truncate font-semibold text-foreground">{b.customer.name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">{b.service.name}</div>
                      {b.status === "bekliyor" && (
                        <div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-amber-400">Talep</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
