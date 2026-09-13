// Bekleme Listesi View (V5.4) — dolu gün isteyen müşteriler + iptal geri doldurma
// Randevu oluştur (saat seçimli) · WhatsApp ile teklif ver · kaydı sil
"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Hourglass, MessageCircle, Trash2, CalendarPlus, Phone, Search, CheckCircle2, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { para2, openSlots, weekdayLongStr } from "@/lib/salon"

interface WaitlistRow {
  id: string
  name: string
  phone: string
  serviceId: string | null
  serviceName: string | null
  desiredDate: string
  note: string | null
  status: string
  createdAt: string
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  bekliyor: { label: "Bekliyor", cls: "bg-amber-950/60 text-amber-300 border-amber-800/50" },
  teklif: { label: "Teklif Verildi", cls: "bg-sky-950/60 text-sky-300 border-sky-800/50" },
  randevu: { label: "Randevuya Dönüştü", cls: "bg-emerald-950/60 text-emerald-300 border-emerald-800/50" },
  iptal: { label: "İptal", cls: "bg-red-950/60 text-red-300 border-red-800/50" },
}

export function BeklemeView() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  // Randevu oluşturma dialog
  const [creating, setCreating] = useState<WaitlistRow | null>(null)
  const [timeKey, setTimeKey] = useState("")
  const [busySlots, setBusySlots] = useState<Array<{ startAt: string; durationMin: number }>>([])
  const [serviceId, setServiceId] = useState<string>("")

  const { data } = useQuery({
    queryKey: ["salon-waitlist"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/waitlist")
      if (!res.ok) return { entries: [] as WaitlistRow[], count: 0 }
      return (await res.json()) as { entries: WaitlistRow[]; count: number }
    },
  })

  // Hizmet listesi (randevu oluştururken seçim için — eğer kayıtta hizmet yoksa)
  const { data: servicesData } = useQuery({
    queryKey: ["salon-services-waitlist"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/services")
      if (!res.ok) return { services: [] as Array<{ id: string; name: string; category: string; priceChf: number; durationMin: number }> }
      return (await res.json()) as { services: Array<{ id: string; name: string; category: string; priceChf: number; durationMin: number }> }
    },
  })

  const entries = data?.entries ?? []
  const now = new Date()
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0))

  // Yaklaşan (bugün ve sonrası) aktif kayıtlar önce, geçmiş/kapanan sonra
  const upcoming = entries.filter((e) => new Date(e.desiredDate) >= todayStart && (e.status === "bekliyor" || e.status === "teklif"))
  const archived = entries.filter((e) => new Date(e.desiredDate) < todayStart || (e.status !== "bekliyor" && e.status !== "teklif"))

  const filteredUpcoming = search
    ? upcoming.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.phone.replace(/\D/g, "").includes(search.replace(/\D/g, "")),
      )
    : upcoming

  function refresh() {
    qc.invalidateQueries({ queryKey: ["salon-waitlist"] })
    qc.invalidateQueries({ queryKey: ["salon-bookings"] })
  }

  function waOfferLink(e: WaitlistRow): string {
    const date = new Date(e.desiredDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })
    const text = encodeURIComponent(
      `Merhaba ${e.name} 🤍\n${date} için bekleme listesindeydiniz — istediğiniz günde yer açıldı!` +
        (e.serviceName ? `\nHizmet: ${e.serviceName}` : "") +
        `\nUygun bir saatte sizi ağırlamak isteriz. Onaylar mısınız?`,
    )
    return `https://wa.me/${e.phone.replace(/\D/g, "")}?text=${text}`
  }

  async function openCreateDialog(e: WaitlistRow) {
    setCreating(e)
    setTimeKey("")
    setBusySlots([])
    setServiceId(e.serviceId ?? "")
    try {
      const dateStr = e.desiredDate.slice(0, 10)
      const res = await fetch(`/api/v1/salon/availability?date=${dateStr}`)
      if (res.ok) {
        const json = (await res.json()) as { busy: Array<{ startAt: string; durationMin: number }> }
        setBusySlots(json.busy ?? [])
      }
    } catch {
      // zararsız — saatler yine seçilebilir
    }
  }

  function slotFree(iso: string): boolean {
    const d = new Date(iso)
    if (d.getTime() < Date.now() + 15 * 60000) return false
    return !busySlots.some((b) => {
      const bs = new Date(b.startAt).getTime()
      const be = bs + b.durationMin * 60000
      // 60 dk varsayım — çakışma ön kontrolü (sunucu nihai kontrol yapar)
      return d.getTime() < be && d.getTime() + 60 * 60000 > bs
    })
  }

  async function submitBooking() {
    if (!creating || !timeKey || !serviceId) return
    setBusy(creating.id)
    try {
      const dateStr = creating.desiredDate.slice(0, 10)
      const res = await fetch("/api/v1/salon/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: creating.name,
          customerPhone: creating.phone,
          serviceId,
          startAt: new Date(`${dateStr}T${timeKey}:00`).toISOString(),
          notes: creating.note ?? undefined,
          byStaff: true,
        }),
      })
      const json = (await res.json()) as { booking?: { id: string; serviceName: string }; error?: string }
      if (!res.ok || !json.booking) {
        toast({ title: "Randevu oluşturulamadı", description: json.error ?? "Saat çakışıyor olabilir.", variant: "destructive" })
        return
      }
      // Bekleme kaydını «randevu» olarak işaretle
      await fetch("/api/v1/salon/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: creating.id, status: "randevu" }),
      })
      refresh()
      setCreating(null)
      toast({
        title: "✓ Randevu oluşturuldu",
        description: `${creating.name} — ${json.booking.serviceName}, ${timeKey}. Müşteriye WhatsApp ile teyit gönderebilirsiniz.`,
      })
    } finally {
      setBusy(null)
    }
  }

  async function markStatus(e: WaitlistRow, status: string) {
    setBusy(e.id)
    try {
      const res = await fetch("/api/v1/salon/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: e.id, status }),
      })
      if (res.ok) {
        refresh()
        toast({ title: "Durum güncellendi", description: `${e.name} → ${STATUS_META[status]?.label ?? status}` })
      }
    } finally {
      setBusy(null)
    }
  }

  async function removeEntry(e: WaitlistRow) {
    setBusy(e.id)
    try {
      const res = await fetch(`/api/v1/salon/waitlist?id=${e.id}`, { method: "DELETE" })
      if (res.ok) {
        refresh()
        toast({ title: "Kayıt silindi", description: `${e.name} listeden kaldırıldı.` })
      }
    } finally {
      setBusy(null)
    }
  }

  const slotList = creating ? openSlots(new Date(creating.desiredDate.slice(0, 10) + "T00:00:00")) : []

  return (
    <div className="space-y-6">
      {/* ── İstatistik + açıklama ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="mk-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Bekleyen Kayıt</span>
            <Hourglass className="h-4 w-4 text-brand-text/80" />
          </div>
          <div className="mk-display mt-1.5 text-xl font-bold">{upcoming.length}</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground/70">Bugün ve sonrası için yer bekleyenler</div>
        </div>
        <div className="mk-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Teklif Verilen</span>
            <Bell className="h-4 w-4 text-brand-text/80" />
          </div>
          <div className="mk-display mt-1.5 text-xl font-bold">{upcoming.filter((e) => e.status === "teklif").length}</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground/70">WhatsApp üzerinden teklif gönderilenler</div>
        </div>
        <div className="mk-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Dönüştürülen</span>
            <CheckCircle2 className="h-4 w-4 text-brand-text/80" />
          </div>
          <div className="mk-display mt-1.5 text-xl font-bold">{entries.filter((e) => e.status === "randevu").length}</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground/70">Randevuya çevrilen toplam kayıt</div>
        </div>
      </div>

      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-xs leading-relaxed text-muted-foreground">
        <span className="font-bold text-foreground">İpucu — iptal geri doldurma:</span> Bir randevu iptal edildiğinde,
        aynı günün kayıtlarını burada görürsünüz. «Randevu Oluştur» ile boş saate yerleştirin ve müşteriye WhatsApp
        teklifi gönderin — takvim dolu kalır, boş saat paraya dönüşür.
      </div>

      {/* ── Araç çubuğu ── */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Müşteri adı veya telefon ara…" value={search}
          onChange={(e) => setSearch(e.target.value)} className="mk-focus h-11 rounded-xl pl-10" />
      </div>

      {/* ── Yaklaşan kayıtlar ── */}
      {filteredUpcoming.length === 0 ? (
        <div className="mk-card rounded-xl p-10 text-center">
          <Hourglass className="mx-auto h-10 w-10 text-brand-text/50" strokeWidth={1.4} />
          <div className="mk-display mt-3 text-lg font-bold">Bekleme listesi boş</div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Web sitesinde bir gün tamamen dolduğunda müşteriler «Bekleme Listesine Ekle» ile yazılabilir — kayıtlar burada listelenir.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredUpcoming.map((e) => {
            const meta = STATUS_META[e.status] ?? STATUS_META.bekliyor
            const dayLabel = new Date(e.desiredDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })
            return (
              <div key={e.id} className="mk-card rounded-xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="mk-display text-base font-bold text-foreground">{e.name}</span>
                      <Badge className={cn("border font-semibold", meta.cls)}>{meta.label}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {e.phone}</span>
                      <span className="font-semibold text-brand-text">{dayLabel} · {weekdayLongStr(e.desiredDate)}</span>
                      {e.serviceName && <span>💅 {e.serviceName}</span>}
                    </div>
                    {e.note && (
                      <div className="mt-2 rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-xs italic text-muted-foreground">
                        «{e.note}»
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-3.5">
                  <Button size="sm" disabled={busy === e.id} onClick={() => openCreateDialog(e)}
                    className="mk-gold-glow rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90">
                    <CalendarPlus className="mr-1 h-3.5 w-3.5" /> Randevu Oluştur
                  </Button>
                  <Button asChild size="sm" variant="outline"
                    className="rounded-full border-emerald-700/50 font-semibold text-emerald-400 hover:bg-emerald-950/30">
                    <a href={waOfferLink(e)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-1 h-3.5 w-3.5" /> WhatsApp Teklif Gönder
                    </a>
                  </Button>
                  {e.status === "bekliyor" && (
                    <Button size="sm" variant="outline" disabled={busy === e.id} onClick={() => markStatus(e, "teklif")}
                      className="rounded-full border-sky-800/50 font-semibold text-sky-300 hover:bg-sky-950/30">
                      <Bell className="mr-1 h-3.5 w-3.5" /> Teklif Verildi İşaretle
                    </Button>
                  )}
                  <Button size="sm" variant="outline" disabled={busy === e.id} onClick={() => removeEntry(e)}
                    className="rounded-full border-destructive/40 font-semibold text-destructive hover:bg-destructive/10">
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Sil
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Geçmiş / kapanan kayıtlar ── */}
      {archived.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Geçmiş & Kapanan</span>
            <div className="mk-gold-line h-px flex-1" />
          </div>
          <div className="space-y-2">
            {archived.slice(0, 12).map((e) => {
              const meta = STATUS_META[e.status] ?? STATUS_META.bekliyor
              return (
                <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/50 bg-card/40 px-4 py-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">{e.name}</span>
                    <span className="text-muted-foreground">
                      {new Date(e.desiredDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                    </span>
                    {e.serviceName && <span className="text-muted-foreground/70">{e.serviceName}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("border text-[10px] font-semibold", meta.cls)}>{meta.label}</Badge>
                    {e.status !== "randevu" && e.status !== "iptal" && (
                      <button onClick={() => removeEntry(e)} disabled={busy === e.id}
                        className="mk-focus rounded p-1 text-muted-foreground/50 hover:text-destructive" title="Sil">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Randevu oluşturma dialog (saat seçimi) ── */}
      <Dialog open={creating !== null} onOpenChange={(o) => !o && setCreating(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="mk-display flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-brand-text" /> Bekleme Listesinden Randevu
            </DialogTitle>
          </DialogHeader>
          {creating && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-secondary/40 p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Müşteri</span><span className="font-bold">{creating.name}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Telefon</span><span>{creating.phone}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Gün</span>
                  <span className="font-semibold text-brand-text">
                    {new Date(creating.desiredDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" })}
                  </span>
                </div>
                {creating.serviceName && (
                  <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Hizmet</span><span className="font-semibold">{creating.serviceName}</span></div>
                )}
                {!creating.serviceName && (
                  <div className="mt-3 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Hizmet seç *</div>
                    <select
                      value={serviceId}
                      onChange={(ev) => setServiceId(ev.target.value)}
                      className="mk-focus h-11 w-full rounded-xl border border-border/70 bg-card px-3 text-sm outline-none"
                    >
                      <option value="">Hizmet seçin…</option>
                      {(servicesData?.services ?? []).map((s) => (
                        <option key={s.id} value={s.id}>{s.name} — {para2(s.priceChf)}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Saat seç</div>
                {slotList.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border/70 p-4 text-center text-sm text-muted-foreground">
                    Bu gün kapalı — başka bir gün için randevu gerekir.
                  </p>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
                    {slotList.map(({ hour, minute }) => {
                      const key = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
                      const iso = new Date(`${creating.desiredDate.slice(0, 10)}T${key}:00`).toISOString()
                      const free = slotFree(iso)
                      const active = timeKey === key
                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={!free}
                          onClick={() => setTimeKey(key)}
                          title={free ? "Müsait" : "Dolu"}
                          className={cn(
                            "mk-focus h-10 rounded-lg border font-mono text-xs font-bold transition-all",
                            active && "mk-gold-glow border-primary bg-primary text-primary-foreground",
                            !active && free && "border-border/70 bg-card text-foreground hover:border-primary/50",
                            !free && "cursor-not-allowed border-border/40 bg-secondary/30 text-muted-foreground/40 line-through",
                          )}
                        >
                          {key}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <Button disabled={!timeKey || !serviceId || busy === creating.id} onClick={submitBooking}
                className="mk-gold-glow h-11 w-full rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90">
                <CalendarPlus className="mr-1.5 h-4 w-4" /> {timeKey ? `${timeKey} — Randevuyu Oluştur` : "Saat Seçin"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
