// Ekip Portalı — Değerlendirme Yönetimi: yorum moderasyonu (onayla / reddet / sil)

"use client"

import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Star, CheckCircle2, XCircle, Trash2, Quote, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { type ReviewRow, type ReviewSummary, REVIEW_STATUS, Stars, dateStrShort } from "@/lib/salon"

const STATUS_TABS = [
  { key: "bekliyor", label: "İncelemede" },
  { key: "onaylandi", label: "Yayında" },
  { key: "reddedildi", label: "Reddedildi" },
  { key: "tumu", label: "Tümü" },
]

export function YorumlarView() {
  const [statusTab, setStatusTab] = useState("bekliyor")
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Tüm durumlar için: her iki listeyi de çek
  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ["yorumlar", "bekliyor"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/reviews?status=bekliyor")
      if (!res.ok) return { reviews: [] as ReviewRow[] }
      return (await res.json()) as { reviews: ReviewRow[] }
    },
  })
  const { data: approvedData } = useQuery({
    queryKey: ["yorumlar", "onaylandi"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/reviews?status=onaylandi")
      if (!res.ok) return { reviews: [] as ReviewRow[] }
      return (await res.json()) as { reviews: ReviewRow[] }
    },
  })
  const { data: rejectedData } = useQuery({
    queryKey: ["yorumlar", "reddedildi"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/reviews?status=reddedildi")
      if (!res.ok) return { reviews: [] as ReviewRow[] }
      return (await res.json()) as { reviews: ReviewRow[] }
    },
  })
  const { data: summaryData } = useQuery({
    queryKey: ["yorumlar-ozet"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/reviews")
      if (!res.ok) return null
      return (await res.json()) as { summary: ReviewSummary }
    },
  })

  const pending = pendingData?.reviews ?? []
  const approved = approvedData?.reviews ?? []
  const rejected = rejectedData?.reviews ?? []
  const all = useMemo(() => [...pending, ...approved, ...rejected]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [pending, approved, rejected])

  const shown = statusTab === "tumu" ? all : statusTab === "bekliyor" ? pending : statusTab === "onaylandi" ? approved : rejected
  const summary = summaryData?.summary

  const moderate = async (id: string, status: string, label: string) => {
    try {
      const res = await fetch("/api/v1/salon/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error()
      toast({ title: `Yorum ${label}`, description: "Durum güncellendi." })
      queryClient.invalidateQueries({ queryKey: ["yorumlar"] })
      queryClient.invalidateQueries({ queryKey: ["yorumlar-ozet"] })
      queryClient.invalidateQueries({ queryKey: ["salon-stats"] })
    } catch {
      toast({ title: "Hata", description: "Yorum güncellenemedi.", variant: "destructive" })
    }
  }

  const remove = async (id: string) => {
    try {
      const res = await fetch("/api/v1/salon/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Yorum silindi", description: "Değerlendirme kalıcı olarak kaldırıldı." })
      queryClient.invalidateQueries({ queryKey: ["yorumlar"] })
      queryClient.invalidateQueries({ queryKey: ["yorumlar-ozet"] })
      queryClient.invalidateQueries({ queryKey: ["salon-stats"] })
    } catch {
      toast({ title: "Hata", description: "Yorum silinemedi.", variant: "destructive" })
    }
  }

  const counts = { bekliyor: pending.length, onaylandi: approved.length, reddedildi: rejected.length, tumu: all.length }

  return (
    <div className="mk-velvet">
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-brand-text">
            <Star className="h-3.5 w-3.5" /> Değerlendirme moderasyonu
            {pending.length > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{pending.length} yeni</span>
            )}
          </div>
          <h1 className="mk-display text-2xl font-bold tracking-tight sm:text-3xl">
            Yorum <span className="mk-gold-text">Yönetimi</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Misafir değerlendirmelerini onaylayın, reddedin veya silin.
            {summary && summary.count > 0 && (
              <> Şu an ortalama <span className="font-semibold text-brand-text">{summary.average.toFixed(1)}★</span> ({summary.count} yorum).</>
            )}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        {/* Sekmeler */}
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

        {/* Yorum listesi */}
        {loadingPending && [1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}

        {!loadingPending && shown.length === 0 && (
          <Card className="mk-card border-border">
            <CardContent className="flex flex-col items-center p-12 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                {statusTab === "bekliyor"
                  ? "İnceleme bekleyen yorum yok — hepsi halledilmiş! ✨"
                  : "Bu kategoride yorum yok."}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {shown.map((r, i) => (
            <Card key={r.id} className={cn("mk-card mk-anim-up border-border", `mk-delay-${Math.min(6, (i % 6) + 1)}`,
              r.status === "bekliyor" && "border-amber-800/40")}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="mk-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-brand-text">
                      {r.authorName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                    </span>
                    <div className="leading-tight">
                      <div className="text-sm font-bold text-foreground">{r.authorName}</div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        {r.serviceName ?? "Genel"} · {dateStrShort(r.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Stars value={r.rating} />
                    <Badge className={cn("border text-[10px]", REVIEW_STATUS[r.status]?.cls)} variant="outline">
                      {REVIEW_STATUS[r.status]?.label ?? r.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3.5 flex items-start gap-2 rounded-lg bg-secondary/40 px-4 py-3">
                  <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-text/60" />
                  <p className="text-sm leading-relaxed text-foreground/90">{r.comment}</p>
                </div>

                {/* İşlem butonları */}
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/60 pt-3.5">
                  {r.status !== "onaylandi" && (
                    <Button size="sm" className="h-8 rounded-full bg-emerald-700 px-3.5 text-[11px] font-semibold hover:bg-emerald-700/90" onClick={() => moderate(r.id, "onaylandi", "onaylandı — artık yayında")}>
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Onayla & yayınla
                    </Button>
                  )}
                  {r.status !== "reddedildi" && (
                    <Button size="sm" variant="outline" className="h-8 rounded-full border-amber-700/40 px-3.5 text-[11px] font-semibold text-amber-400 hover:bg-amber-950/30" onClick={() => moderate(r.id, "reddedildi", "reddedildi")}>
                      <XCircle className="mr-1 h-3 w-3" /> Reddet
                    </Button>
                  )}
                  {r.status === "reddedildi" && (
                    <Button size="sm" variant="outline" className="h-8 rounded-full border-border/70 px-3.5 text-[11px] font-semibold" onClick={() => moderate(r.id, "bekliyor", "incelemeye alındı")}>
                      İncelemeye al
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="ml-auto h-8 rounded-full border-destructive/40 px-3 text-[11px] font-semibold text-destructive hover:bg-destructive/10" onClick={() => remove(r.id)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Sil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
