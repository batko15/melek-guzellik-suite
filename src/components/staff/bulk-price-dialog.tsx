// ═══════════════════════════════════════════════════════════════════════════
//  TOPLU FİYAT GÜNCELLEME — alle Preise mit einem Klick anpassen (V5.1)
// ═══════════════════════════════════════════════════════════════════════════
//  Modus: Prozent (%) oder fester Betrag (₺) · Umfang: alle oder je Kategorie
//  Mit Live-Vorschau (alt → neu) vor dem Speichern. PUT /api/v1/salon/services

"use client"

import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { TrendingUp, Sparkles, Check, Percent, Coins, RotateCcw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { type SalonService, CATEGORY_META, para } from "@/lib/salon"
import { cn } from "@/lib/utils"

type Mode = "percent" | "amount"

const PERCENT_QUICK = [5, 10, 15, 20, -10, -20]
const AMOUNT_QUICK = [50, 100, 250, -50, -100]

export function BulkPriceDialog({
  services, open, onOpenChange,
}: {
  services: SalonService[]
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [mode, setMode] = useState<Mode>("percent")
  const [value, setValue] = useState("10")
  const [category, setCategory] = useState<string>("all")
  const [busy, setBusy] = useState(false)

  const numValue = Number(value)
  const valid = Number.isFinite(numValue) && numValue !== 0

  const scope = useMemo(
    () => (category === "all" ? services : services.filter((s) => s.category === category)),
    [services, category],
  )

  // Live-Vorschau: alt → neu
  const preview = useMemo(() => {
    if (!valid) return []
    return scope
      .map((s) => {
        const raw = mode === "percent" ? s.priceChf * (1 + numValue / 100) : s.priceChf + numValue
        const newPrice = Math.max(0, Math.min(100000, Math.round(raw)))
        return { name: s.name, oldPrice: s.priceChf, newPrice, changed: newPrice !== s.priceChf }
      })
      .filter((p) => p.changed)
  }, [scope, mode, numValue, valid])

  const apply = async () => {
    if (!valid || preview.length === 0) return
    setBusy(true)
    try {
      const res = await fetch("/api/v1/salon/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, value: numValue, category: category === "all" ? undefined : category }),
      })
      const json = (await res.json()) as { updatedCount?: number; error?: string }
      if (!res.ok) {
        toast({ title: "Güncellenemedi", description: json.error ?? "Hata.", variant: "destructive" })
        return
      }
      toast({
        title: "Fiyatlar güncellendi",
        description: `${json.updatedCount ?? preview.length} hizmet ${mode === "percent" ? `%${numValue > 0 ? "+" : ""}${numValue}` : `${numValue > 0 ? "+" : ""}${numValue} ₺`} olarak güncellendi.`,
      })
      onOpenChange(false)
      qc.invalidateQueries({ queryKey: ["salon-services"] })
      qc.invalidateQueries({ queryKey: ["salon-services-booking"] })
      qc.invalidateQueries({ queryKey: ["salon-stats"] })
    } catch {
      toast({ title: "Bağlantı hatası", description: "Tekrar deneyin.", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mk-scroll max-h-[92vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto border-border bg-background">
        <DialogHeader>
          <DialogTitle className="mk-display flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-text" />
            Toplu Fiyat Güncelle
          </DialogTitle>
          <DialogDescription>
            Tüm fiyatları tek seferde ayarlayın — canlı önizleme ile, kaydetmeden önce görürsünüz.
          </DialogDescription>
        </DialogHeader>

        {/* Umfang */}
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Kapsam</div>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setCategory("all")} className={chip(category === "all")}>
              Tümü ({services.length})
            </button>
            {["tirnak", "guzellik", "kirpik"].map((c) => {
              const count = services.filter((s) => s.category === c).length
              if (count === 0) return null
              return (
                <button key={c} type="button" onClick={() => setCategory(c)} className={chip(category === c)}>
                  {CATEGORY_META[c]?.emoji} {CATEGORY_META[c]?.label ?? c} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Modus + Wert */}
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Ayar</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setMode("percent"); setValue("10") }}
              className={cn(chip(false), "flex-1 justify-center gap-1.5", mode === "percent" && "border-primary/60 bg-primary/15 text-brand-text")}
            >
              <Percent className="h-3.5 w-3.5" /> Yüzde (%)
            </button>
            <button
              type="button"
              onClick={() => { setMode("amount"); setValue("100") }}
              className={cn(chip(false), "flex-1 justify-center gap-1.5", mode === "amount" && "border-primary/60 bg-primary/15 text-brand-text")}
            >
              <Coins className="h-3.5 w-3.5" /> Tutar (₺)
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mk-focus h-11 flex-1 rounded-xl text-right font-mono text-base font-bold"
              aria-label={mode === "percent" ? "Yüzde değeri" : "Tutar değeri"}
            />
            <span className="mk-display w-8 text-sm font-bold text-brand-text">{mode === "percent" ? "%" : "₺"}</span>
            <Button
              type="button"
              variant="outline"
              className="mk-focus h-11 rounded-xl px-3"
              onClick={() => setValue((v) => String(Number(v) * -1 || 0))}
              title="Vorzeichen umkehren (+/−)"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          {/* Schnellwahl */}
          <div className="flex flex-wrap gap-1.5">
            {(mode === "percent" ? PERCENT_QUICK : AMOUNT_QUICK).map((q) => (
              <button key={q} type="button" onClick={() => setValue(String(q))} className={chip(false)}>
                {q > 0 ? "+" : ""}{mode === "percent" ? `${q}%` : `${q} ₺`}
              </button>
            ))}
          </div>
        </div>

        {/* Live-Vorschau */}
        <div className="rounded-xl border border-border bg-secondary/30">
          <div className="flex items-center justify-between border-b border-border/50 px-3.5 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Canlı Önizleme
            </div>
            <div className="text-[11px] font-semibold text-brand-text">
              {valid ? `${preview.length} hizmet değişiyor` : "Geçerli bir değer girin"}
            </div>
          </div>
          <div className="mk-scroll max-h-52 overflow-y-auto px-3.5 py-2">
            {valid && preview.length === 0 && (
              <p className="py-3 text-center text-xs text-muted-foreground">Bu ayarda değişen fiyat yok.</p>
            )}
            {preview.map((p) => (
              <div key={p.name} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                <span className="min-w-0 flex-1 truncate text-foreground/90">{p.name}</span>
                <span className="shrink-0 text-muted-foreground line-through">{para(p.oldPrice)}</span>
                <span className="shrink-0 font-mono text-muted-foreground">→</span>
                <span className="shrink-0 mk-display font-bold text-brand-text">{para(p.newPrice)}</span>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={apply}
          disabled={busy || !valid || preview.length === 0}
          className="mk-gold-glow h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground"
        >
          {busy ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              Güncelleniyor…
            </span>
          ) : (
            <>
              <Sparkles className="mr-1.5 h-4 w-4" />
              {preview.length} Fiyatı Güncelle
            </>
          )}
        </Button>
        <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
          <Check className="mr-1 inline h-3 w-3" />
          Yeni fiyatlar sonraki randevularda geçerli olur — mevcut randevular eski fiyatını korur.
        </p>
      </DialogContent>
    </Dialog>
  )
}

function chip(active: boolean) {
  return cn(
    "mk-focus rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
    active
      ? "border-primary/60 bg-primary/15 text-brand-text"
      : "border-border/70 bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
  )
}
