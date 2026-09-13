// Ekip Portalı — Hizmetler & Fiyatlar: fiyat listesi + satır içi düzenleme
// Fiyat/süre/popüler düzenlemeleri PATCH /api/v1/salon/services üzerinden kaydedilir.

"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Sparkles, Clock, Crown, Info, Pencil, Check, X, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { BulkPriceDialog } from "@/components/staff/bulk-price-dialog"
import { type SalonService, CATEGORY_META, para, minutesLabel } from "@/lib/salon"

export function HizmetlerView() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [editing, setEditing] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState("")
  const [editDuration, setEditDuration] = useState("")
  const [saving, setSaving] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)

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

  const startEdit = (s: SalonService) => {
    setEditing(s.id)
    setEditPrice(String(Math.round(s.priceChf)))
    setEditDuration(String(s.durationMin))
  }

  const cancelEdit = () => setEditing(null)

  const saveEdit = async (s: SalonService) => {
    const price = Number(editPrice)
    const duration = Number(editDuration)
    if (!Number.isFinite(price) || price < 0) {
      toast({ title: "Geçersiz fiyat", description: "Lütfen geçerli bir sayı girin.", variant: "destructive" })
      return
    }
    if (!Number.isInteger(duration) || duration < 5 || duration > 600) {
      toast({ title: "Geçersiz süre", description: "5 ile 600 dakika arasında girin.", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/v1/salon/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id, priceChf: price, durationMin: duration }),
      })
      if (!res.ok) {
        const json = (await res.json()) as { error?: string }
        toast({ title: "Kaydedilemedi", description: json.error ?? "Hizmet güncellenemedi.", variant: "destructive" })
        return
      }
      toast({ title: "Hizmet güncellendi", description: `${s.name}: ${para(price)} · ${minutesLabel(duration)}` })
      setEditing(null)
      queryClient.invalidateQueries({ queryKey: ["salon-services"] })
      queryClient.invalidateQueries({ queryKey: ["salon-stats"] })
    } catch {
      toast({ title: "Hata", description: "Bağlantı hatası — tekrar deneyin.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const togglePopular = async (s: SalonService) => {
    try {
      const res = await fetch("/api/v1/salon/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id, popular: !s.popular }),
      })
      if (!res.ok) throw new Error()
      toast({ title: s.popular ? "Popüler etiketi kaldırıldı" : "Popüler olarak işaretlendi", description: s.name })
      queryClient.invalidateQueries({ queryKey: ["salon-services"] })
    } catch {
      toast({ title: "Hata", description: "Güncellenemedi.", variant: "destructive" })
    }
  }

  return (
    <div className="mk-velvet">
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-brand-text">
            <Sparkles className="h-3.5 w-3.5" /> Fiyat listesi — satır içi düzenlenebilir
          </div>
          <h1 className="mk-display text-2xl font-bold tracking-tight sm:text-3xl">
            Hizmetler & <span className="mk-gold-text">Fiyatlar</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {services.length} uygulama · ortalama fiyat {para(avgPrice)} · ortalama süre {minutesLabel(avgDur)} — kalem simgesine dokunup fiyat ve süreyi doğrudan güncelleyin.
          </p>
          {/* V5.1: Toplu fiyat güncelleme */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={() => setBulkOpen(true)}
              disabled={services.length === 0}
              className="mk-gold-glow h-11 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
            >
              <TrendingUp className="mr-1.5 h-4 w-4" />
              Toplu Fiyat Güncelle — Tümünü Tek Tıkla
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        <div className="mk-card flex items-start gap-3 rounded-xl border-primary/25 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Güncellediğiniz fiyatlar sonraki randevularda otomatik geçerli olur (randevu, alındığı andaki fiyatı saklar).
            Popüler rozetini tıklayarak açıp kapatabilirsiniz.
          </p>
        </div>

        {["tirnak", "guzellik", "kirpik"].map((cat) => {
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
                  <span className="text-xs text-muted-foreground">ort. {para(Math.round(catAvg))} · {catServices.length} hizmet</span>
                </div>
                <div className="divide-y divide-border/40">
                  {isLoading && [1, 2, 3].map((i) => (
                    <div key={i} className="px-5 py-3"><Skeleton className="h-8 w-full rounded-md" /></div>
                  ))}
                  {catServices.map((s) => {
                    const isEditing = editing === s.id
                    return (
                      <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-secondary/25">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="mk-display text-sm font-bold">{s.name}</span>
                            <button
                              onClick={() => togglePopular(s)}
                              title={s.popular ? "Popüler rozetini kaldır" : "Popüler olarak işaretle"}
                              className={cn(
                                "mk-focus rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-colors",
                                s.popular
                                  ? "border-primary/40 bg-primary/10 text-brand-text"
                                  : "border-dashed border-border/70 text-muted-foreground/60 hover:border-primary/40 hover:text-muted-foreground",
                              )}
                            >
                              <Crown className="mr-0.5 inline h-2.5 w-2.5" /> Popüler
                            </button>
                          </div>
                          {s.description && <div className="mt-0.5 truncate text-xs text-muted-foreground">{s.description}</div>}
                        </div>

                        {isEditing ? (
                          <div className="flex shrink-0 items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="mk-focus h-9 w-24 rounded-lg text-right font-mono text-sm"
                                aria-label="Fiyat"
                              />
                              <span className="text-xs font-semibold text-muted-foreground">₺</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={5}
                                max={600}
                                value={editDuration}
                                onChange={(e) => setEditDuration(e.target.value)}
                                className="mk-focus h-9 w-20 rounded-lg text-right font-mono text-sm"
                                aria-label="Süre (dakika)"
                              />
                              <span className="text-xs font-semibold text-muted-foreground">dk</span>
                            </div>
                            <Button size="sm" className="h-9 rounded-full bg-emerald-700 px-3 hover:bg-emerald-700/90" disabled={saving} onClick={() => saveEdit(s)}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-9 rounded-full px-3" onClick={cancelEdit}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex shrink-0 items-center gap-4">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" /> {minutesLabel(s.durationMin)}
                            </span>
                            <span className="mk-display w-24 text-right text-base font-bold text-brand-text">{para(s.priceChf)}</span>
                            <button
                              onClick={() => startEdit(s)}
                              title="Düzenle"
                              aria-label={`${s.name} düzenle`}
                              className="mk-focus flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-brand-text"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      {/* V5.1: Toplu fiyat güncelleme diyaloğu */}
      <BulkPriceDialog services={services} open={bulkOpen} onOpenChange={setBulkOpen} />
    </div>
  )
}
