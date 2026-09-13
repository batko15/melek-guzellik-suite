// ═══════════════════════════════════════════════════════════════════════════
//  REZERVASYON MERKEZİ (V3) — Tüm randevuların TAM yönetimi
//  · Görüntüle: filtreler (durum, tarih aralığı, arama) + KPI'lar
//  · Değiştir: hizmet, tarih/saat, süre, fiyat, müşteri, notlar, durum (PUT)
//  · Oluştur: ekip doğrudan randevu planlar
//  · Bilgilendir: onay/değişiklik/iptal/hatırlatma → WhatsApp · SMS · E-posta
//  · İzle: bildirim günlüğü + CSV dışa aktarma
// ═══════════════════════════════════════════════════════════════════════════

"use client"

import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ClipboardList, Search, CheckCircle2, XCircle, Sparkles, Phone, ChevronDown,
  CalendarPlus, Pencil, MessageCircle, UserX, Download, Bell, History,
  Mail, Smartphone, Trash2, AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BOOKING_STATUS, type SalonBooking, type NotificationLogRow, type ReminderRow, para, timeStr,
  dateStr, weekdayStr, minutesLabel,
} from "@/lib/salon"
import { BookingFormDialog } from "@/components/staff/booking-form-dialog"
import { BookingNotifyDialog, type NotifyTarget } from "@/components/staff/booking-notify-dialog"

const STATUS_TABS = [
  { key: "tumu", label: "Tümü" },
  { key: "bekliyor", label: "Talepler" },
  { key: "onaylandi", label: "Onaylı" },
  { key: "tamamlandi", label: "Tamamlandı" },
  { key: "gelmedi", label: "Gelmedi" },
  { key: "iptal", label: "İptal" },
]

const DATE_FILTERS = [
  { key: "tumu", label: "Tüm zamanlar" },
  { key: "bugun", label: "Bugün" },
  { key: "hafta", label: "Bu hafta" },
  { key: "gelecek", label: "Gelecek" },
  { key: "gecmis", label: "Geçmiş" },
] as const
type DateFilter = (typeof DATE_FILTERS)[number]["key"]

const CHANNEL_META: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  whatsapp: { label: "WhatsApp", cls: "bg-emerald-950/60 text-emerald-300 border-emerald-800/50", Icon: MessageCircle },
  sms: { label: "SMS", cls: "bg-primary/15 text-brand-text border-primary/40", Icon: Smartphone },
  email: { label: "E-posta", cls: "bg-secondary text-muted-foreground border-border", Icon: Mail },
}

const KIND_LABEL: Record<string, string> = {
  onay: "Onay", degisiklik: "Değişiklik", iptal: "İptal", hatirlatma: "Hatırlatma",
  tamamlandi: "Son Bakım", ozel: "Özel",
}

export function RezervasyonView() {
  const [statusTab, setStatusTab] = useState("tumu")
  const [dateFilter, setDateFilter] = useState<DateFilter>("tumu")
  const [search, setSearch] = useState("")
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Diyaloglar
  const [editBooking, setEditBooking] = useState<SalonBooking | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [notifyTarget, setNotifyTarget] = useState<NotifyTarget | null>(null)
  const [notifyOpen, setNotifyOpen] = useState(false)

  // ── Veri ──
  const { data, isLoading } = useQuery({
    queryKey: ["randevular"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/bookings")
      if (!res.ok) return { bookings: [] as SalonBooking[] }
      return (await res.json()) as { bookings: SalonBooking[] }
    },
  })
  const { data: logData, isLoading: logLoading } = useQuery({
    queryKey: ["bildirimler"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/notifications?limit=100")
      if (!res.ok) return { logs: [] as NotificationLogRow[] }
      return (await res.json()) as { logs: NotificationLogRow[] }
    },
  })

  // V4: hatırlatma kuyruğu — önümüzdeki 48 saat, hatırlatma gönderilmemiş
  const { data: reminderData, isLoading: reminderLoading } = useQuery({
    queryKey: ["hatirlatmalar"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/reminders?hours=48")
      if (!res.ok) return { reminders: [] as ReminderRow[], count: 0 }
      return (await res.json()) as { reminders: ReminderRow[]; count: number }
    },
    refetchInterval: 60000,
  })
  const reminders = useMemo(() => reminderData?.reminders ?? [], [reminderData])

  const all = useMemo(() => data?.bookings ?? [], [data])

  // ── KPI'lar ──
  const now = new Date()
  const todayStr = now.toDateString()
  const kpis = useMemo(() => {
    const today = all.filter(
      (b) => new Date(b.startAt).toDateString() === todayStr && (b.status === "bekliyor" || b.status === "onaylandi"),
    )
    const pending = all.filter((b) => new Date(b.startAt) >= now && b.status === "bekliyor")
    const gelmedi = all.filter((b) => b.status === "gelmedi")
    const openVolume = all
      .filter((b) => new Date(b.startAt) >= now && (b.status === "bekliyor" || b.status === "onaylandi"))
      .reduce((s, b) => s + b.priceChf, 0)
    return { today: today.length, pending: pending.length, gelmedi: gelmedi.length, openVolume }
  }, [all])

  // ── Filtreleme ──
  const bookings = useMemo(() => {
    let list = all
    if (statusTab !== "tumu") list = list.filter((b) => b.status === statusTab)
    switch (dateFilter) {
      case "bugun":
        list = list.filter((b) => new Date(b.startAt).toDateString() === todayStr)
        break
      case "hafta": {
        const ws = new Date(now)
        ws.setHours(0, 0, 0, 0)
        ws.setDate(ws.getDate() - ((ws.getDay() + 6) % 7))
        const we = new Date(ws)
        we.setDate(we.getDate() + 7)
        list = list.filter((b) => {
          const d = new Date(b.startAt)
          return d >= ws && d < we
        })
        break
      }
      case "gelecek":
        list = list.filter((b) => new Date(b.startAt) >= now)
        break
      case "gecmis":
        list = list.filter((b) => new Date(b.startAt) < now)
        break
    }
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((b) =>
        b.customer.name.toLowerCase().includes(q) ||
        b.service.name.toLowerCase().includes(q) ||
        (b.customer.phone ?? "").toLowerCase().includes(q) ||
        (b.customer.email ?? "").toLowerCase().includes(q) ||
        (b.notes ?? "").toLowerCase().includes(q),
      )
    }
    return list
  }, [all, statusTab, dateFilter, search])

  const counts = useMemo(() => {
    const c: Record<string, number> = { tumu: all.length }
    for (const t of STATUS_TABS.slice(1)) c[t.key] = all.filter((b) => b.status === t.key).length
    return c
  }, [all])

  // ── Durum değiştir (hızlı aksiyon) → bildirim otomatik önerilir ──
  const setStatus = async (b: SalonBooking, status: string, label: string) => {
    try {
      const res = await fetch("/api/v1/salon/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id, status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Hata")
      toast({ title: `Randevu ${label}`, description: `${b.customer.name} · ${b.service.name}` })
      queryClient.invalidateQueries({ queryKey: ["randevular"] })
      queryClient.invalidateQueries({ queryKey: ["salon-stats"] })
      queryClient.invalidateQueries({ queryKey: ["kalender"] })
      // Duruma bağlı müşteri bildirimini otomatik öner (onay/iptal/tamamlandı)
      if (data.notifyMessage) {
        setNotifyTarget({ booking: { ...b, status }, initialKind: data.notifyKind, initialMessage: data.notifyMessage })
        setNotifyOpen(true)
      }
    } catch (e) {
      toast({ title: "Hata", description: e instanceof Error ? e.message : "Durum değiştirilemedi.", variant: "destructive" })
    }
  }

  // ── CSV dışa aktarma (Excel uyumlu: BOM + noktalı virgül) ──
  const exportCsv = () => {
    const esc = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`
    const header = ["Tarih", "Saat", "Müşteri", "Telefon", "E-posta", "Hizmet", "Süre (dk)", "Fiyat", "Durum", "Müşteri Notu", "İç Not", "Oluşturulma", "Güncelleme"]
    const rows = bookings.map((b) => [
      new Date(b.startAt).toLocaleDateString("tr-TR"),
      timeStr(b.startAt),
      b.customer.name,
      b.customer.phone,
      b.customer.email ?? "",
      b.service.name,
      b.durationMin,
      b.priceChf,
      BOOKING_STATUS[b.status]?.label ?? b.status,
      b.notes ?? "",
      b.staffNote ?? "",
      new Date(b.createdAt).toLocaleString("tr-TR"),
      new Date(b.updatedAt).toLocaleString("tr-TR"),
    ])
    const csv = "\uFEFF" + [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rezervasyonlar-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "CSV indirildi", description: `${bookings.length} randevu dışa aktarıldı (Excel uyumlu).` })
  }

  const openEdit = (b: SalonBooking) => { setEditBooking(b); setEditOpen(true) }

  // V4: hatırlatma gönderimini günlüğe kaydet (kanal tıklanınca)
  const sendReminderLog = async (r: ReminderRow, channel: string) => {
    try {
      await fetch("/api/v1/salon/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: r.id,
          customer: r.customerName,
          phone: r.customerPhone,
          channel,
          kind: "hatirlatma",
          message: r.message,
        }),
      })
      toast({ title: "Hatırlatma kaydedildi", description: `${r.customerName} · ${channel}` })
      queryClient.invalidateQueries({ queryKey: ["hatirlatmalar"] })
      queryClient.invalidateQueries({ queryKey: ["bildirimler"] })
      queryClient.invalidateQueries({ queryKey: ["salon-stats"] })
    } catch {
      // günlük kaydı başarısız olsa da WhatsApp açılır
    }
  }

  // V4: hatırlatma mesajını panoya kopyala
  const copyReminder = async (r: ReminderRow) => {
    try {
      await navigator.clipboard.writeText(r.message)
      toast({ title: "Kopyalandı", description: `${r.customerName} için hatırlatma mesajı` })
    } catch {
      toast({ title: "Kopyalanamadı", description: "Mesajı «Mesajı gör» altından seçip kopyalayın.", variant: "destructive" })
    }
  }
  const openNotify = (b: SalonBooking, kind?: NotifyTarget["initialKind"]) => {
    setNotifyTarget({ booking: b, initialKind: kind })
    setNotifyOpen(true)
  }

  return (
    <div className="mk-velvet">
      {/* ─── Başlık ─── */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-brand-text">
            <ClipboardList className="h-3.5 w-3.5" /> Rezervasyon Merkezi
            {kpis.pending > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{kpis.pending} talep</span>
            )}
          </div>
          <h1 className="mk-display text-2xl font-bold tracking-tight sm:text-3xl">
            Rezervasyon <span className="mk-gold-text">Merkezi</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Tüm randevuları görüntüleyin, değiştirin, yeni kayıt oluşturun ve müşterinizi WhatsApp / SMS / E-posta ile saniyeler içinde bilgilendirin.
          </p>

          {/* KPI'lar */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {[
              { label: "Bugün", value: kpis.today, hint: "aktif randevu" },
              { label: "Bekleyen talep", value: kpis.pending, hint: "onay bekliyor" },
              { label: "Hatırlatma", value: reminders.length, hint: "48 sa içinde bekleyen" },
              { label: "Gelmedi", value: kpis.gelmedi, hint: "no-show kaydı" },
              { label: "Açık değer", value: para(kpis.openVolume), hint: "gelecek randevular" },
            ].map((k) => (
              <div key={k.label} className="mk-card rounded-xl p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{k.label}</div>
                <div className="mk-display mt-1 text-xl font-bold text-foreground">{k.value}</div>
                <div className="text-[10px] text-muted-foreground">{k.hint}</div>
              </div>
            ))}
          </div>

          {/* Aksiyon barı */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => setCreateOpen(true)} className="h-10 rounded-full font-semibold">
              <CalendarPlus className="mr-1.5 h-4 w-4" /> Yeni Randevu
            </Button>
            <Button variant="outline" onClick={exportCsv} disabled={bookings.length === 0} className="mk-focus h-10 rounded-full">
              <Download className="mr-1.5 h-4 w-4" /> CSV Dışa Aktar
            </Button>
          </div>
        </div>
      </section>

      {/* ─── İçerik sekmeleri ─── */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Tabs defaultValue="randevular">
          <TabsList className="mk-scroll h-11 w-full max-w-lg rounded-full bg-secondary/50 p-1">
            <TabsTrigger value="randevular" className="flex-1 rounded-full text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ClipboardList className="mr-1.5 h-3.5 w-3.5" /> Randevular
            </TabsTrigger>
            <TabsTrigger value="hatirlatmalar" className="flex-1 rounded-full text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="mr-1.5 h-3.5 w-3.5" /> Hatırlatma
              {reminders.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-500/90 px-1.5 text-[10px] font-bold text-black">{reminders.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="bildirimler" className="flex-1 rounded-full text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="mr-1.5 h-3.5 w-3.5" /> Bildirimler
              {(logData?.logs.length ?? 0) > 0 && (
                <span className="ml-1 rounded-full bg-primary/80 px-1.5 text-[10px] font-bold text-primary-foreground">{logData!.logs.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ═══ TAB: Randevular ═══ */}
          <TabsContent value="randevular" className="mt-5 space-y-5">
            {/* Filtre çubuğu */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
                    {counts[t.key] > 0 && (
                      <span className={cn("ml-1.5", statusTab === t.key ? "text-primary-foreground/80" : "text-muted-foreground/70")}>
                        {counts[t.key]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex flex-1 items-center gap-2 lg:justify-end">
                <div className="relative w-full sm:w-56 lg:w-64">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Ara: müşteri, hizmet, telefon…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mk-focus h-10 rounded-full pl-10"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 shrink-0 rounded-full px-3.5 text-xs font-semibold">
                      {DATE_FILTERS.find((f) => f.key === dateFilter)?.label} <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl border-border">
                    {DATE_FILTERS.map((f) => (
                      <DropdownMenuItem key={f.key} onClick={() => setDateFilter(f.key)}>
                        {f.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Tablo (masaüstü) */}
            <Card className="mk-card hidden border-border md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3">Randevu</th>
                        <th className="px-4 py-3">Müşteri</th>
                        <th className="px-4 py-3">Hizmet</th>
                        <th className="px-4 py-3 text-right">Fiyat</th>
                        <th className="px-4 py-3">Durum</th>
                        <th className="px-4 py-3">Bildir</th>
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
                        <tr
                          key={b.id}
                          className={cn(
                            "cursor-pointer border-b border-border/40 odd:bg-secondary/15 transition-colors hover:bg-secondary/30",
                            b.status === "iptal" && "opacity-60",
                          )}
                          onClick={() => openEdit(b)}
                          title="Düzenlemek için tıklayın"
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold">{weekdayStr(b.startAt)}, {dateStr(b.startAt)}</div>
                            <div className="font-mono text-xs text-brand-text">{timeStr(b.startAt)} · {minutesLabel(b.durationMin)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">{b.customer.name}</span>
                              {(b.customer.allergies || b.customer.sensitive) && (
                                <span title={`⚠ ${b.customer.allergies ?? "Hassas cilt"}`}>
                                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" aria-label="Alerji beyanı var" />
                                </span>
                              )}
                              {b.deposit > 0 && (
                                <Badge className={cn("shrink-0 border text-[9px]", b.depositPaid ? "border-emerald-800/50 bg-emerald-950/40 text-emerald-300" : "border-amber-800/50 bg-amber-950/40 text-amber-300")} variant="outline">
                                  {b.depositPaid ? "Dep. ✓" : `Dep. ${para(b.deposit)}`}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-2.5 w-2.5" /> {b.customer.phone}
                              {b.staffName && <span className="ml-1.5 text-[10px] text-brand-text">· {b.staffName}</span>}
                            </div>
                            {b.staffNote && (
                              <div className="mt-0.5 max-w-[200px] truncate text-[10px] italic text-purple-300/80" title={b.staffNote}>
                                iç not: {b.staffNote}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div>{b.service.name}</div>
                            {b.notes && <div className="mt-0.5 max-w-[220px] truncate text-xs italic text-muted-foreground">«{b.notes}»</div>}
                          </td>
                          <td className="mk-display px-4 py-3 text-right font-bold text-brand-text">{para(b.priceChf)}</td>
                          <td className="px-4 py-3">
                            <Badge className={cn("border text-[10px]", BOOKING_STATUS[b.status]?.cls)} variant="outline">
                              {BOOKING_STATUS[b.status]?.label ?? b.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline" size="sm"
                              onClick={() => openNotify(b)}
                              className="mk-focus h-8 rounded-full border-emerald-800/50 px-3 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-950/40"
                            >
                              <MessageCircle className="mr-1 h-3 w-3" /> Bildir
                            </Button>
                          </td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs">
                                  İşlem <ChevronDown className="ml-1 h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl border-border">
                                <DropdownMenuItem onClick={() => openEdit(b)}>
                                  <Pencil className="mr-2 h-3.5 w-3.5 text-brand-text" /> Düzenle (tüm alanlar)
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {b.status !== "onaylandi" && b.status !== "tamamlandi" && (
                                  <DropdownMenuItem onClick={() => setStatus(b, "onaylandi", "onaylandı")}>
                                    <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Onayla + bilgilendir
                                  </DropdownMenuItem>
                                )}
                                {b.status !== "tamamlandi" && b.status !== "gelmedi" && (
                                  <DropdownMenuItem onClick={() => setStatus(b, "tamamlandi", "tamamlandı")}>
                                    <Sparkles className="mr-2 h-3.5 w-3.5 text-brand-text" /> Tamamla
                                  </DropdownMenuItem>
                                )}
                                {b.status !== "gelmedi" && b.status !== "tamamlandi" && (
                                  <DropdownMenuItem onClick={() => setStatus(b, "gelmedi", "«gelmedi» olarak işaretlendi")}>
                                    <UserX className="mr-2 h-3.5 w-3.5 text-purple-400" /> Gelmedi (no-show)
                                  </DropdownMenuItem>
                                )}
                                {b.status !== "iptal" && b.status !== "tamamlandi" && (
                                  <DropdownMenuItem onClick={() => setStatus(b, "iptal", "iptal edildi")} className="text-destructive">
                                    <XCircle className="mr-2 h-3.5 w-3.5" /> İptal et + bilgilendir
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openNotify(b, "hatirlatma")}>
                                  <Bell className="mr-2 h-3.5 w-3.5 text-amber-400" /> Hatırlatma gönder
                                </DropdownMenuItem>
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
              {isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
              {bookings.map((b) => (
                <div key={b.id} className="mk-card rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button onClick={() => openEdit(b)} className="mk-focus text-left">
                        <div className="mk-display flex items-center gap-1.5 text-sm font-bold">
                          {b.customer.name}
                          {(b.customer.allergies || b.customer.sensitive) && (
                            <span title={b.customer.allergies ?? "Hassas cilt"}>
                              <AlertTriangle className="h-3 w-3 shrink-0 text-red-400" aria-label="Alerji" />
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {weekdayStr(b.startAt)}, {dateStr(b.startAt)} · <span className="font-mono text-brand-text">{timeStr(b.startAt)}</span>
                        </div>
                        <div className="mt-1 truncate text-xs">{b.service.name} · {minutesLabel(b.durationMin)}</div>
                      </button>
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Phone className="h-2.5 w-2.5" /> {b.customer.phone}
                      </div>
                      {b.notes && <div className="mt-1 truncate text-[11px] italic text-muted-foreground">«{b.notes}»</div>}
                      {b.staffNote && (
                        <div className="mt-1 truncate text-[10px] italic text-purple-300/80">iç not: {b.staffNote}</div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="mk-display text-sm font-bold text-brand-text">{para(b.priceChf)}</div>
                      {b.deposit > 0 && (
                        <div className={cn("mt-0.5 text-[9px] font-bold", b.depositPaid ? "text-emerald-400" : "text-amber-400")}>
                          {b.depositPaid ? "Depozito ✓" : `Depozito ${para(b.deposit)}`}
                        </div>
                      )}
                      <Badge className={cn("mt-1 border text-[9px]", BOOKING_STATUS[b.status]?.cls)} variant="outline">
                        {BOOKING_STATUS[b.status]?.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
                    <Button size="sm" onClick={() => openEdit(b)} className="mk-focus h-8 rounded-full px-3 text-[11px]">
                      <Pencil className="mr-1 h-3 w-3" /> Düzenle
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      onClick={() => openNotify(b)}
                      className="mk-focus h-8 rounded-full border-emerald-800/50 px-3 text-[11px] font-semibold text-emerald-300"
                    >
                      <MessageCircle className="mr-1 h-3 w-3" /> Bildir
                    </Button>
                    {b.status === "bekliyor" && (
                      <Button size="sm" className="h-8 rounded-full bg-emerald-700 px-3 text-[11px] hover:bg-emerald-700/90" onClick={() => setStatus(b, "onaylandi", "onaylandı")}>
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Onayla
                      </Button>
                    )}
                    {b.status !== "gelmedi" && b.status !== "tamamlandi" && (
                      <Button size="sm" variant="outline" className="h-8 rounded-full border-purple-800/50 px-3 text-[11px] text-purple-300" onClick={() => setStatus(b, "gelmedi", "«gelmedi» olarak işaretlendi")}>
                        <UserX className="mr-1 h-3 w-3" /> Gelmedi
                      </Button>
                    )}
                    {b.status !== "iptal" && b.status !== "tamamlandi" && (
                      <Button size="sm" variant="outline" className="h-8 rounded-full border-destructive/40 px-3 text-[11px] text-destructive" onClick={() => setStatus(b, "iptal", "iptal edildi")}>
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
          </TabsContent>

          {/* ═══ TAB: Hatırlatmalar (V4 — otomatik kuyruk) ═══ */}
          <TabsContent value="hatirlatmalar" className="mt-5 space-y-4">
            <div className="mk-card rounded-xl border-amber-900/40 bg-amber-950/15 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-200">
                <Bell className="h-4 w-4" /> Otomatik Hatırlatma Kuyruğu
              </div>
              <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
                Önümüzdeki 48 saat içindeki ve henüz hatırlatma gönderilmemiş randevular. WhatsApp tıklandığında
                Türkçe hazır mesaj açılır ve gönderim günlüğe kaydedilir — kayıt kuyruktan düşer.
                (Araştırma: hatırlatmalar no-show oranını en çok düşüren yöntemdir.)
              </p>
            </div>

            {reminderLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}

            {!reminderLoading && reminders.length === 0 && (
              <div className="mk-card rounded-xl p-10 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-emerald-500/70" />
                <div className="mk-display text-lg font-bold">Tüm randevular hatırlatıldı</div>
                <p className="mt-1 text-sm text-muted-foreground">Önümüzdeki 48 saatte bekleyen hatırlatma yok.</p>
              </div>
            )}

            {reminders.map((r) => (
              <div key={r.id} className="mk-card rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="mk-display text-sm font-bold">{r.customerName}</span>
                      <Badge className="border-amber-800/50 bg-amber-950/40 text-[9px] text-amber-300" variant="outline">
                        {r.hoursUntil} saat sonra
                      </Badge>
                      {r.deposit > 0 && !r.depositPaid && (
                        <Badge className="border-amber-800/50 bg-amber-950/40 text-[9px] text-amber-300" variant="outline">
                          Depozito bekliyor: {para(r.deposit)}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {weekdayStr(r.startAt)}, {dateStr(r.startAt)} · <span className="font-mono text-brand-text">{timeStr(r.startAt)}</span> · {r.serviceName} · {para(r.priceChf)}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Phone className="h-2.5 w-2.5" /> {r.customerPhone}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {r.channels.filter((c) => c.channel === "whatsapp" || c.channel === "sms").map((c) => (
                      <a
                        key={c.channel}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => sendReminderLog(r, c.channel)}
                        className={cn(
                          "mk-focus inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-colors",
                          c.channel === "whatsapp"
                            ? "border-emerald-800/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950/60"
                            : "border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                        )}
                      >
                        {c.channel === "whatsapp" ? <MessageCircle className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
                        {c.channel === "whatsapp" ? "WhatsApp'tan Hatırlat" : "SMS"}
                      </a>
                    ))}
                    <Button
                      size="sm" variant="outline"
                      onClick={() => copyReminder(r)}
                      className="mk-focus h-9 rounded-full px-3 text-xs font-semibold"
                    >
                      Kopyala
                    </Button>
                  </div>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground">
                    Mesajı gör
                  </summary>
                  <pre className="mk-scroll mt-2 max-h-44 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-secondary/30 p-3 text-[11px] leading-relaxed text-foreground/90">{r.message}</pre>
                </details>
              </div>
            ))}
          </TabsContent>

          {/* ═══ TAB: Bildirimler (günlük) ═══ */}
          <TabsContent value="bildirimler" className="mt-5 space-y-3">
            <Card className="mk-card border-border">
              <CardContent className="p-0">
                <div className="border-b border-border/60 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <History className="h-3.5 w-3.5 text-brand-text/70" /> Müşteri bilgilendirme günlüğü — son {logData?.logs.length ?? 0} gönderim
                  </div>
                </div>
                {logLoading && (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                  </div>
                )}
                {!logLoading && (logData?.logs.length ?? 0) === 0 && (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    <Bell className="mx-auto mb-2 h-6 w-6 opacity-40" />
                    Henüz bildirim gönderilmedi. Bir randevuda «Bildir» düğmesine basın — her gönderim burada listelenir.
                  </div>
                )}
                <ul className="divide-y divide-border/40">
                  {(logData?.logs ?? []).map((l) => {
                    const ch = CHANNEL_META[l.channel]
                    return (
                      <li key={l.id} className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {ch && (
                            <Badge className={cn("border text-[10px]", ch.cls)} variant="outline">
                              <ch.Icon className="mr-1 h-2.5 w-2.5" /> {ch.label}
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-[10px] text-brand-text">
                            {KIND_LABEL[l.kind] ?? l.kind}
                          </Badge>
                          <span className="text-sm font-semibold text-foreground">{l.customer}</span>
                          <span className="text-xs text-muted-foreground">{l.phone}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            {new Date(l.createdAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <details className="mt-1.5">
                          <summary className="mk-focus cursor-pointer truncate text-xs italic text-muted-foreground">
                            {l.message.split("\n")[0]}…
                          </summary>
                          <pre className="mk-scroll mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-secondary/40 p-3 font-mono text-[11px] leading-relaxed text-foreground">
                            {l.message}
                          </pre>
                        </details>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* ─── Diyaloglar ─── */}
      <BookingFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        booking={editBooking}
        onSaved={(r) => {
          // Değişiklik bildirimini otomatik öner (tarih/hizmet değiştiyse)
          if (r.notifyMessage) {
            setNotifyTarget({ booking: r.booking, initialKind: "degisiklik", initialMessage: r.notifyMessage })
            setNotifyOpen(true)
          }
        }}
      />
      <BookingFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        booking={null}
        onSaved={(r) => {
          // Yeni randevu → onay bildirimi öner
          setNotifyTarget({ booking: r.booking, initialKind: "onay" })
          setNotifyOpen(true)
        }}
      />
      <BookingNotifyDialog
        open={notifyOpen}
        onOpenChange={setNotifyOpen}
        target={notifyTarget}
      />
    </div>
  )
}

function DropdownMenuSeparator() {
  return <div className="-mx-1 my-1 h-px bg-border/60" role="separator" />
}
