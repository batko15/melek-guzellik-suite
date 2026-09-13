// Hediye Kartları View (V5.4) — dijital hediye kartı yönetimi
// Talepleri aktifleştir · bakiyeden düş (ödeme al) · iptal · alıcıya WhatsApp bilgilendirme
"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Gift, Check, Copy, Ban, CreditCard, Plus, Search, Coins, Clock3, BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { para2 } from "@/lib/salon"

interface GiftCardRow {
  id: string
  code: string
  amount: number
  balance: number
  buyerName: string
  buyerPhone: string
  recipientName: string | null
  message: string | null
  status: string
  usedCount: number
  createdAt: string
}

interface GiftStats {
  totalIssued: number
  requested: number
  active: number
  activeBalance: number
  totalLoaded: number
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  talep: { label: "Ödeme Bekliyor", cls: "bg-amber-950/60 text-amber-300 border-amber-800/50" },
  aktif: { label: "Aktif", cls: "bg-emerald-950/60 text-emerald-300 border-emerald-800/50" },
  kullanildi: { label: "Tamamen Kullanıldı", cls: "bg-secondary text-muted-foreground border-border" },
  iptal: { label: "İptal", cls: "bg-red-950/60 text-red-300 border-red-800/50" },
}

export function HediyeKartlariView() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [waLink, setWaLink] = useState<string | null>(null)
  // «Kullan» (bakiye düş) dialog
  const [useCard, setUseCard] = useState<GiftCardRow | null>(null)
  const [useAmount, setUseAmount] = useState("")
  // «Yeni Kart» dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ buyerName: "", buyerPhone: "", amount: "1000", recipientName: "", message: "" })

  const { data } = useQuery({
    queryKey: ["salon-giftcards"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/giftcards")
      if (!res.ok) return { cards: [] as GiftCardRow[], count: 0, stats: null as GiftStats | null }
      return (await res.json()) as { cards: GiftCardRow[]; count: number; stats: GiftStats }
    },
  })

  const cards = data?.cards ?? []
  const stats = data?.stats
  const filtered = search
    ? cards.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.buyerName.toLowerCase().includes(search.toLowerCase()) ||
          (c.recipientName ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : cards

  function refresh() {
    qc.invalidateQueries({ queryKey: ["salon-giftcards"] })
  }

  async function activate(card: GiftCardRow) {
    setBusy(card.id)
    try {
      const res = await fetch("/api/v1/salon/giftcards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: card.id, status: "aktif" }),
      })
      const json = (await res.json()) as { card?: GiftCardRow; whatsappUrl?: string | null; error?: string }
      if (!res.ok || !json.card) {
        toast({ title: "Hata", description: json.error ?? "Kart aktifleştirilemedi.", variant: "destructive" })
        return
      }
      refresh()
      setWaLink(json.whatsappUrl ?? null)
      toast({
        title: "✓ Kart aktifleştirildi",
        description: `${card.code} — ${card.buyerName}. Alıcıya WhatsApp ile bilgilendirebilirsiniz.`,
      })
    } finally {
      setBusy(null)
    }
  }

  async function cancelCard(card: GiftCardRow) {
    setBusy(card.id)
    try {
      const res = await fetch("/api/v1/salon/giftcards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: card.id, status: "iptal" }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast({ title: "Hata", description: json.error ?? "Kart iptal edilemedi.", variant: "destructive" })
        return
      }
      refresh()
      toast({ title: "Kart iptal edildi", description: `${card.code}` })
    } finally {
      setBusy(null)
    }
  }

  async function submitUse() {
    if (!useCard) return
    const amount = Math.round(Number(useAmount.replace(/\D/g, "")) || 0)
    if (amount <= 0) {
      toast({ title: "Geçersiz tutar", description: "1 – 100.000 ₺ arasında bir tutar girin.", variant: "destructive" })
      return
    }
    setBusy(useCard.id)
    try {
      const res = await fetch("/api/v1/salon/giftcards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: useCard.code, amount }),
      })
      const json = (await res.json()) as { card?: GiftCardRow; deducted?: number; remaining?: number; error?: string }
      if (!res.ok || !json.card) {
        toast({ title: "Hata", description: json.error ?? "Bakiye düşülemedi.", variant: "destructive" })
        return
      }
      refresh()
      setUseCard(null)
      setUseAmount("")
      toast({
        title: "✓ Ödeme alındı",
        description: `${para2(json.deducted ?? amount)} düşüldü — kalan ${para2(json.remaining ?? 0)}.`,
      })
    } finally {
      setBusy(null)
    }
  }

  async function submitCreate() {
    const amount = Math.round(Number(form.amount.replace(/\D/g, "")) || 0)
    if (form.buyerName.trim().length < 2) return toast({ title: "Ad gerekli", variant: "destructive" })
    if (form.buyerPhone.replace(/\D/g, "").length < 7) return toast({ title: "Geçerli telefon gerekli", variant: "destructive" })
    if (amount < 250 || amount > 25000) return toast({ title: "Tutar 250–25.000 ₺ olmalı", variant: "destructive" })
    setBusy("create")
    try {
      const res = await fetch("/api/v1/salon/giftcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: form.buyerName.trim(),
          buyerPhone: form.buyerPhone.trim(),
          amount,
          recipientName: form.recipientName.trim() || undefined,
          message: form.message.trim() || undefined,
          byStaff: true,
        }),
      })
      const json = (await res.json()) as { card?: { code: string }; error?: string }
      if (!res.ok || !json.card) {
        toast({ title: "Hata", description: json.error ?? "Kart oluşturulamadı.", variant: "destructive" })
        return
      }
      refresh()
      setCreateOpen(false)
      setForm({ buyerName: "", buyerPhone: "", amount: "1000", recipientName: "", message: "" })
      toast({ title: "✓ Kart oluşturuldu (aktif)", description: `Kod: ${json.card.code}` })
    } finally {
      setBusy(null)
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // zararsız
    }
  }

  return (
    <div className="space-y-6">
      {/* ── İstatistikler ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Toplam Kart", value: stats ? `${stats.totalIssued}` : "—", icon: Gift, hint: "Oluşturulan tüm kartlar" },
          { label: "Bekleyen Talep", value: stats ? `${stats.requested}` : "—", icon: Clock3, hint: "Ödeme bekleyen talepler" },
          { label: "Aktif Kart", value: stats ? `${stats.active}` : "—", icon: BadgeCheck, hint: "Kullanıma hazır" },
          { label: "Aktif Bakiye", value: stats ? para2(stats.activeBalance) : "—", icon: Coins, hint: "Taahhüt edilmemiş yüklemeler" },
        ].map((s) => (
          <div key={s.label} className="mk-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-brand-text/80" />
            </div>
            <div className="mk-display mt-1.5 text-xl font-bold">{s.value}</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground/70">{s.hint}</div>
          </div>
        ))}
      </div>

      {/* Alıcı bilgilendirme WhatsApp banner */}
      {waLink && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-4">
          <div className="text-sm text-emerald-300">
            <span className="font-bold">Kart aktif — alıcıyı bilgilendirin:</span> hazır mesajla WhatsApp gönderebilirsiniz.
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" className="rounded-full bg-emerald-600 font-bold text-white hover:bg-emerald-500">
              <a href={waLink} target="_blank" rel="noopener noreferrer">WhatsApp Gönder</a>
            </Button>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => setWaLink(null)}>Kapat</Button>
          </div>
        </div>
      )}

      {/* ── Araç çubuğu ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Kod, alıcı veya hediye alan ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mk-focus h-11 rounded-xl pl-10"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="mk-gold-glow h-11 rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-1.5 h-4 w-4" /> Yeni Kart (Ödeme Alındı)
        </Button>
      </div>

      {/* ── Kart listesi ── */}
      {filtered.length === 0 ? (
        <div className="mk-card rounded-xl p-10 text-center">
          <Gift className="mx-auto h-10 w-10 text-brand-text/50" strokeWidth={1.4} />
          <div className="mk-display mt-3 text-lg font-bold">Henüz hediye kartı yok</div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Müşteriler web sitesindeki «Hediye Kartı» bölümünden talep oluşturabilir — burada listelenir.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((c) => {
            const meta = STATUS_META[c.status] ?? STATUS_META.talep
            return (
              <div key={c.id} className={cn("mk-card rounded-xl p-5", c.status === "talep" && "border-amber-800/40")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      onClick={() => copyCode(c.code)}
                      className="mk-focus group flex items-center gap-2 font-mono text-sm font-bold tracking-[0.1em] text-brand-text"
                      title="Kodu kopyala"
                    >
                      {c.code}
                      {copied === c.code ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 opacity-50 transition-opacity group-hover:opacity-100" />}
                    </button>
                    <div className="mt-1.5 truncate text-sm font-semibold text-foreground">
                      {c.buyerName}
                      {c.recipientName && <span className="font-normal text-muted-foreground"> → {c.recipientName}</span>}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{c.buyerPhone}</div>
                    {c.message && (
                      <div className="mt-2 rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-xs italic text-muted-foreground">
                        «{c.message}»
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge className={cn("border font-semibold", meta.cls)}>{meta.label}</Badge>
                    <div className="mk-display mt-2 text-lg font-bold text-brand-text">{para2(c.balance)}</div>
                    <div className="text-[10px] text-muted-foreground">
                      yüklenen {para2(c.amount)}{c.usedCount > 0 ? ` · ${c.usedCount} kullanım` : ""}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-3.5">
                  {c.status === "talep" && (
                    <Button size="sm" disabled={busy === c.id} onClick={() => activate(c)}
                      className="mk-gold-glow rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90">
                      <Check className="mr-1 h-3.5 w-3.5" /> Ödeme Alındı — Aktifleştir
                    </Button>
                  )}
                  {c.status === "aktif" && (
                    <Button size="sm" variant="outline" disabled={busy === c.id} onClick={() => { setUseCard(c); setUseAmount(String(Math.round(c.balance))) }}
                      className="rounded-full border-primary/40 font-semibold text-brand-text hover:bg-primary/10">
                      <CreditCard className="mr-1 h-3.5 w-3.5" /> Ödemede Kullan
                    </Button>
                  )}
                  {(c.status === "talep" || c.status === "aktif") && (
                    <Button size="sm" variant="outline" disabled={busy === c.id} onClick={() => cancelCard(c)}
                      className="rounded-full border-destructive/40 font-semibold text-destructive hover:bg-destructive/10">
                      <Ban className="mr-1 h-3.5 w-3.5" /> İptal
                    </Button>
                  )}
                  <span className="ml-auto self-center text-[10px] text-muted-foreground/60">
                    {new Date(c.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Bakiye kullanma dialog ── */}
      <Dialog open={useCard !== null} onOpenChange={(o) => !o && setUseCard(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="mk-display flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand-text" /> Hediye Kartından Ödeme Al
            </DialogTitle>
          </DialogHeader>
          {useCard && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-secondary/40 p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Kod</span><span className="font-mono font-bold text-brand-text">{useCard.code}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Alıcı</span><span className="font-semibold">{useCard.buyerName}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Kalan bakiye</span><span className="mk-display font-bold text-brand-text">{para2(useCard.balance)}</span></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gc-use-amount">Düşülecek tutar (₺)</Label>
                <Input id="gc-use-amount" inputMode="numeric" value={useAmount}
                  onChange={(e) => setUseAmount(e.target.value.replace(/[^\d]/g, ""))}
                  className="mk-focus h-11 rounded-xl" />
                <p className="text-[11px] text-muted-foreground">
                  Randevu ücreti kadar düşün — kalan bakiye sonraki ziyaretlerde kullanılabilir.
                </p>
              </div>
              <Button disabled={busy === useCard.id} onClick={submitUse}
                className="mk-gold-glow h-11 w-full rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90">
                Ödemeyi Al & Bakiyeden Düş
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Yeni kart dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="mk-display flex items-center gap-2">
              <Gift className="h-5 w-5 text-brand-text" /> Yeni Hediye Kartı
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Alıcı Adı *</Label>
                <Input value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                  placeholder="örn. Ayşe Demir" className="mk-focus h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Telefon *</Label>
                <Input type="tel" value={form.buyerPhone} onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
                  placeholder="+90 5XX XXX XX XX" className="mk-focus h-11 rounded-xl" />
              </div>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tutar (₺) *</Label>
                <Input inputMode="numeric" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^\d]/g, "") })}
                  placeholder="1000" className="mk-focus h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Kime hediye (isteğe bağlı)</Label>
                <Input value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                  placeholder="örn. Annem" className="mk-focus h-11 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hediye notu (isteğe bağlı)</Label>
              <Input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="örn. Doğum günün kutlu olsun!" className="mk-focus h-11 rounded-xl" />
            </div>
            <Button disabled={busy === "create"} onClick={submitCreate}
              className="mk-gold-glow h-11 w-full rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90">
              <Gift className="mr-1.5 h-4 w-4" /> Kartı Oluştur (Aktif)
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Ödemeyi kasada/elimizde aldığınız kartlar için — doğrudan aktif oluşturulur.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
