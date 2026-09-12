// Team-Portal — Studio-Übersicht: Heute-Termine, KPIs, Top-Leistungen

"use client"

import { useQuery } from "@tanstack/react-query"
import {
  CalendarCheck, Clock, TrendingUp, Users, Sparkles, ChevronRight, CircleDot,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BRANDING } from "@/config/branding"
import { type SalonStats, BOOKING_STATUS, CATEGORY_META, chf, timeStr, minutesLabel } from "@/lib/salon"
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts"

export function DashboardView() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["salon-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/stats")
      if (!res.ok) return null
      return (await res.json()) as SalonStats
    },
  })

  const kpis = [
    { label: "Termine heute", value: stats ? String(stats.today.count) : "…", icon: CalendarCheck, tone: "text-brand-text" },
    { label: "Offene Anfragen", value: stats ? String(stats.pending) : "…", icon: CircleDot, tone: stats && stats.pending > 0 ? "text-amber-400" : "text-muted-foreground" },
    { label: "Auslastung Woche", value: stats ? `${stats.week.utilization} %` : "…", icon: TrendingUp, tone: "text-brand-text" },
    { label: "Kundinnen total", value: stats ? String(stats.total.customers) : "…", icon: Users, tone: "text-foreground" },
  ]

  const maxTop = stats?.topServices[0]?.count ?? 1

  return (
    <div className="mk-velvet">
      {/* Header */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-brand-text">
            <Sparkles className="h-3.5 w-3.5" /> Studio-Übersicht · V{BRANDING.version}
          </div>
          <h1 className="mk-display text-2xl font-bold tracking-tight sm:text-3xl">
            Guten Tag — <span className="mk-gold-text">hier ist Ihr Studio im Blick</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Heutige Termine, offene Buchungs-Anfragen, Auslastung und Umsatz auf einen Blick.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        {/* KPI-Leiste */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((kpi, i) => (
            <div key={kpi.label} className={cn("mk-card mk-kpi mk-anim-up relative overflow-hidden rounded-xl p-5", `mk-delay-${i + 1}`)}>
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</div>
                <kpi.icon className={cn("h-4 w-4", kpi.tone)} strokeWidth={1.8} />
              </div>
              <div className={cn("mk-display mt-2 text-2xl font-bold tabular-nums sm:text-3xl", kpi.tone)}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* ─── Termine heute ─── */}
          <Card className="mk-card border-border">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <CalendarCheck className="h-4 w-4 text-brand-text" /> Termine heute
                {stats && stats.today.count > 0 && (
                  <Badge className="border-primary/40 bg-primary/10 text-[10px] text-brand-text">{stats.today.count}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              {stats && stats.today.bookings.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  Heute sind keine Termine gebucht — Zeit für Instagram-Postings? ✨
                </div>
              )}
              {stats?.today.bookings.map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <div className="mk-display w-14 shrink-0 text-center">
                    <div className="text-sm font-bold text-brand-text">{timeStr(b.startAt)}</div>
                    <div className="text-[9px] text-muted-foreground">{minutesLabel(b.durationMin).replace(" Std.", "h").replace(" Min.", "m")}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{b.customerName}</div>
                    <div className="truncate text-xs text-muted-foreground">{b.serviceName}{b.notes ? ` · «${b.notes}»` : ""}</div>
                  </div>
                  <Badge className={cn("shrink-0 border text-[10px]", BOOKING_STATUS[b.status]?.cls)} variant="outline">
                    {BOOKING_STATUS[b.status]?.label}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ─── Wochen-Umsatz ─── */}
          <Card className="mk-card border-border">
            <CardHeader className="pb-0 pt-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <TrendingUp className="h-4 w-4 text-brand-text" /> Umsatz-Entwicklung (8 Wochen)
                {stats && <span className="ml-auto text-xs font-normal text-muted-foreground">CHF {chf(stats.total.revenueChf)} total</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-56 pt-4">
              {stats && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.revenueByWeek} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--popover-foreground)", fontSize: 12 }}
                      formatter={(v: number) => [`CHF ${chf(v)}`, "Umsatz"]}
                    />
                    <Area type="monotone" dataKey="volume" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#goldGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* ─── Top-Leistungen ─── */}
          <Card className="mk-card border-border">
            <CardHeader className="pb-0 pt-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Sparkles className="h-4 w-4 text-brand-text" /> Top-Leistungen nach Buchungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-4">
              {stats?.topServices.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold",
                    i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                  )}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{s.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{s.count}× · CHF {chf(s.volume)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(s.count / maxTop) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ─── Kategorie-Verteilung + Wochen-Info ─── */}
          <div className="space-y-4">
            <Card className="mk-card border-border">
              <CardHeader className="pb-0 pt-4">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <Users className="h-4 w-4 text-brand-text" /> Kategorie-Verteilung
                </CardTitle>
              </CardHeader>
              <CardContent className="h-40 pt-3">
                {stats && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.categories.map((c) => ({ ...c, label: CATEGORY_META[c.name]?.label ?? c.name }))} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="label" stroke="var(--muted-foreground)" fontSize={11} width={70} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--popover-foreground)", fontSize: 12 }}
                        formatter={(v: number) => [`${v} Buchungen`, "Anzahl"]}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={20} fill="var(--chart-1)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="mk-card border-border">
              <CardContent className="grid grid-cols-3 divide-x divide-border/60 p-0 text-center">
                {[
                  { label: "Buchungen (Woche)", value: stats ? String(stats.week.bookings) : "…" },
                  { label: "Umsatz (Woche)", value: stats ? `CHF ${chf(stats.week.revenueChf)}` : "…" },
                  { label: "Erledigt total", value: stats ? String(stats.total.completed) : "…" },
                ].map((s) => (
                  <div key={s.label} className="px-3 py-4">
                    <div className="mk-display text-lg font-bold tabular-nums text-foreground">{s.value}</div>
                    <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
