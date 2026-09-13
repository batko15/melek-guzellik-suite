// Rezervasyon Merkezi — Randevu Formu (V3): YENİ kayıt + TAM DÜZENLEME
// Hizmet, tarih/saat, süre, fiyat, müşteri iletişimi, müşteri notu, iç personel
// notu ve durum tek pencereden yönetilir. Kayıt sonrası müşteri bildirimi
// otomatik önerilir (değişiklik şablonu sunucudan gelir).

"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CalendarPlus, Pencil, Trash2, Loader2, Clock, History, UserRound, Sparkles, Phone, Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  BOOKING_STATUS, type SalonBooking, type SalonService, openSlots,
  timeStr, dateStr, para, minutesLabel,
} from "@/lib/salon"

// ─── Tarih/saat yardımcıları ────────────────────────────────────────────────
const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const toTimeInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}

export interface BookingFormResult {
  saved: true
  booking: SalonBooking
  notifyMessage?: string
  notifyKind?: string
}

export function BookingFormDialog({
  open, onOpenChange, booking, onSaved,
}: {
  /** null → yeni randevu, dolu → düzenleme */
  open: boolean
  onOpenChange: (v: boolean) => void
  booking: SalonBooking | null
  onSaved: (r: BookingFormResult) => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isEdit = booking != null

  // ── Form durumu ──
  const [serviceId, setServiceId] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("10:00")
  const [durationMin, setDurationMin] = useState(60)
  const [price, setPrice] = useState(0)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [notes, setNotes] = useState("")
  const [staffNote, setStaffNote] = useState("")
  const [status, setStatus] = useState("bekliyor")
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hizmet listesi
  const { data: svcData } = useQuery({
    queryKey: ["hizmetler"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/services")
      if (!res.ok) return { services: [] as SalonService[] }
      return (await res.json()) as { services: SalonService[] }
    },
  })
  const services = useMemo(() => svcData?.services ?? [], [svcData])

  // Müşteri geçmişi (düzenleme modunda)
  const { data: historyData } = useQuery({
    queryKey: ["musteri-gecmis", booking?.customer.phone],
    queryFn: async () => {
      const res = await fetch(`/api/v1/salon/bookings?phone=${encodeURIComponent(booking!.customer.phone)}`)
      if (!res.ok) return { bookings: [] as SalonBooking[] }
      return (await res.json()) as { bookings: SalonBooking[] }
    },
    enabled: isEdit && open,
  })
  const history = useMemo(
    () => (historyData?.bookings ?? []).filter((b) => b.id !== booking?.id).slice(0, 5),
    [historyData, booking],
  )

  // Açılışta formu doldur
  useEffect(() => {
    if (!open) return
    setError(null)
    setConfirmDelete(false)
    if (booking) {
      const d = new Date(booking.startAt)
      setServiceId(booking.serviceId)
      setDate(toLocalInput(d))
      setTime(toTimeInput(d))
      setDurationMin(booking.durationMin)
      setPrice(Math.round(booking.priceChf))
      setName(booking.customer.name)
      setPhone(booking.customer.phone)
      setEmail(booking.customer.email ?? "")
      setNotes(booking.notes ?? "")
      setStaffNote(booking.staffNote ?? "")
      setStatus(booking.status)
    } else {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      d.setHours(10, 0, 0, 0)
      setServiceId("")
      setDate(toLocalInput(d))
      setTime("10:00")
      setDurationMin(60)
      setPrice(0)
      setName("")
      setPhone("")
      setEmail("")
      setNotes("")
      setStaffNote("")
      setStatus("bekliyor")
    }
  }, [open, booking])

  // Hizmet seçilince süre/fiyatı otomatik doldur (kullanıcı sonra değiştirebilir)
  const onServiceChange = (id: string) => {
    setServiceId(id)
    const s = services.find((x) => x.id === id)
    if (s) {
      setDurationMin(s.durationMin)
      setPrice(Math.round(s.priceChf))
    }
  }

  // Hızlı saat seçim çipleri (çalışma saatlerinden)
  const slotChips = useMemo(() => {
    if (!date) return []
    const d = new Date(`${date}T${time}:00`)
    return openSlots(d).map((s) => `${String(s.hour).padStart(2, "0")}:${String(s.minute).padStart(2, "0")}`)
  }, [date, time])

  // ── Kaydet ──
  const save = async () => {
    setError(null)
    if (!serviceId) return setError("Lütfen bir hizmet seçin.")
    if (!date || !time) return setError("Tarih ve saat zorunludur.")
    if (name.trim().length < 2) return setError("Müşteri adı en az 2 karakter olmalı.")
    if (phone.replace(/\D/g, "").length < 7) return setError("Geçerli bir telefon numarası girin.")
    if (durationMin < 5 || durationMin > 600) return setError("Süre 5–600 dakika arasında olmalı.")
    if (price < 0 || price > 100000) return setError("Fiyat 0–100.000 arasında olmalı.")

    setSaving(true)
    try {
      const payload = {
        ...(isEdit ? { id: booking!.id } : { byStaff: true }),
        serviceId,
        startAt: new Date(`${date}T${time}:00`).toISOString(),
        durationMin,
        priceChf: price,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim(),
        notes: notes.trim() || null,
        staffNote: staffNote.trim() || null,
        ...(isEdit ? { status } : {}),
      }
      const res = await fetch("/api/v1/salon/bookings", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Kaydedilemedi.")
        return
      }

      queryClient.invalidateQueries({ queryKey: ["randevular"] })
      queryClient.invalidateQueries({ queryKey: ["kalender"] })
      queryClient.invalidateQueries({ queryKey: ["salon-stats"] })
      queryClient.invalidateQueries({ queryKey: ["musteri-gecmis"] })
      toast({
        title: isEdit ? "Randevu güncellendi" : "Randevu oluşturuldu",
        description: `${name.trim()} · ${dateStr(`${date}T${time}:00`)} ${time}`,
      })
      onSaved({
        saved: true,
        booking: isEdit ? data.booking : { ...data.booking, serviceId, notes: notes.trim() || null, staffNote: staffNote.trim() || null, customer: { name: name.trim(), phone: phone.trim(), email: email.trim() || null }, service: services.find((s) => s.id === serviceId) ? { name: services.find((s) => s.id === serviceId)!.name, category: services.find((s) => s.id === serviceId)!.category } : { name: data.booking.serviceName ?? "", category: "" }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as SalonBooking,
        notifyMessage: data.notifyMessage,
        notifyKind: data.notifyKind,
      })
      onOpenChange(false)
    } catch {
      setError("Sunucuya ulaşılamadı.")
    } finally {
      setSaving(false)
    }
  }

  // ── Sil ──
  const doDelete = async () => {
    if (!booking) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/salon/bookings?id=${booking.id}`, { method: "DELETE" })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? "Silinemedi.")
        return
      }
      queryClient.invalidateQueries({ queryKey: ["randevular"] })
      queryClient.invalidateQueries({ queryKey: ["kalender"] })
      queryClient.invalidateQueries({ queryKey: ["salon-stats"] })
      toast({ title: "Randevu silindi", description: `${booking.customer.name} · ${booking.service.name}` })
      onOpenChange(false)
    } catch {
      setError("Silinemedi.")
    } finally {
      setSaving(false)
      setConfirmDelete(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="mk-scroll max-h-[92vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-2xl border-border">
          <DialogHeader>
            <DialogTitle className="mk-display flex items-center gap-2 text-lg">
              {isEdit ? <Pencil className="h-5 w-5 text-brand-text" /> : <CalendarPlus className="h-5 w-5 text-brand-text" />}
              {isEdit ? "Randevuyu Düzenle" : "Yeni Randevu Oluştur"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? `${booking!.customer.name} · ${booking!.service.name} — tüm alanlar değiştirilebilir.`
                : "Ekip olarak doğrudan randevu planlayın — müşteri bildirimi hazır gelir."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Hizmet */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rf-service" className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-brand-text" /> Hizmet</Label>
              <Select value={serviceId} onValueChange={onServiceChange}>
                <SelectTrigger id="rf-service" className="mk-focus h-11 rounded-xl">
                  <SelectValue placeholder="Hizmet seçin — süre ve fiyat otomatik gelir" />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-xl">
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} · {minutesLabel(s.durationMin)} · {para(s.priceChf)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tarih & saat */}
            <div className="space-y-1.5">
              <Label htmlFor="rf-date" className="flex items-center gap-1.5"><CalendarPlus className="h-3.5 w-3.5 text-brand-text" /> Tarih</Label>
              <Input id="rf-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mk-focus h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rf-time" className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-brand-text" /> Saat</Label>
              <Input id="rf-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mk-focus h-11 rounded-xl" />
            </div>

            {/* Hızlı saat çipleri */}
            {slotChips.length > 0 && (
              <div className="sm:col-span-2">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Çalışma saatlerinden hızlı seçim</div>
                <div className="mk-scroll flex flex-wrap gap-1.5">
                  {slotChips.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTime(t)}
                      className={cn(
                        "mk-focus rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors",
                        time === t
                          ? "border-primary/60 bg-primary/15 text-brand-text"
                          : "border-border/70 bg-secondary/40 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Süre & fiyat */}
            <div className="space-y-1.5">
              <Label htmlFor="rf-duration" className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-brand-text" /> Süre (dk)</Label>
              <Input id="rf-duration" type="number" min={5} max={600} step={5} value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))} className="mk-focus h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rf-price" className="flex items-center gap-1.5">Fiyat (₺)</Label>
              <Input id="rf-price" type="number" min={0} max={100000} step={10} value={price}
                onChange={(e) => setPrice(Number(e.target.value))} className="mk-focus h-11 rounded-xl" />
            </div>

            {/* Müşteri */}
            <div className="mt-1 border-t border-border/60 pt-3 sm:col-span-2">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <UserRound className="h-3.5 w-3.5 text-brand-text/70" /> Müşteri
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rf-name">Ad Soyad</Label>
              <Input id="rf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Elif Yılmaz" className="mk-focus h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rf-phone" className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-brand-text/70" /> Telefon</Label>
              <Input id="rf-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5xx xxx xx xx" className="mk-focus h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rf-email" className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-brand-text/70" /> E-posta (opsiyonel)</Label>
              <Input id="rf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="musteri@ornek.com" className="mk-focus h-11 rounded-xl" />
            </div>

            {/* Notlar */}
            <div className="mt-1 space-y-1.5 border-t border-border/60 pt-3 sm:col-span-2">
              <Label htmlFor="rf-notes">Müşteri notu (randevu isteği)</Label>
              <Textarea id="rf-notes" value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Örn. Fransız + altın parıltı" className="min-h-[60px] rounded-xl" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rf-staffnote" className="text-muted-foreground">İç not (yalnızca ekip görür)</Label>
              <Textarea id="rf-staffnote" value={staffNote} onChange={(e) => setStaffNote(e.target.value)}
                placeholder="Örn. Alerjiler, tercihler, hatırlatmalar…" className="min-h-[60px] rounded-xl" />
            </div>

            {/* Durum (düzenlemede) */}
            {isEdit && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Durum</Label>
                <div className="mk-scroll flex flex-wrap gap-1.5">
                  {Object.entries(BOOKING_STATUS).map(([key, meta]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setStatus(key)}
                      className={cn(
                        "mk-focus rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        status === key ? meta.cls : "border-border/70 bg-secondary/40 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {meta.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Müşteri geçmişi (düzenlemede) */}
            {isEdit && history.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 sm:col-span-2">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <History className="h-3 w-3" /> Bu müşterinin diğer randevuları
                </div>
                <ul className="space-y-1.5">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 truncate">
                        <span className="font-mono font-semibold text-brand-text">{timeStr(h.startAt)}</span>{" "}
                        <span className="text-muted-foreground">{dateStr(h.startAt)}</span> · {h.service.name}
                      </span>
                      <Badge className={cn("shrink-0 border text-[9px]", BOOKING_STATUS[h.status]?.cls)} variant="outline">
                        {BOOKING_STATUS[h.status]?.label ?? h.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hata */}
            {error && (
              <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs font-semibold text-destructive sm:col-span-2">
                {error}
              </div>
            )}
          </div>

          {/* Aksiyonlar */}
          <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center">
            {isEdit && (
              <Button
                type="button" variant="outline"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
                className="h-11 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 sm:mr-auto"
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Kalıcı Sil
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="h-11 rounded-xl">
              Vazgeç
            </Button>
            <Button type="button" onClick={save} disabled={saving} className="h-11 rounded-xl font-semibold">
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {isEdit ? "Değişiklikleri Kaydet" : "Randevuyu Oluştur"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Silme onayı */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="rounded-2xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="mk-display">Randevu kalıcı silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {booking && (
                <>
                  <strong>{booking.customer.name}</strong> · {booking.service.name} ·{" "}
                  {dateStr(booking.startAt)} {timeStr(booking.startAt)}
                  <br />
                  Bu işlem geri alınamaz — geçmiş kayıtlardan da kaldırılır. (İptal etmek yeterliyse «Vazgeç» deyin.)
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="rounded-xl bg-destructive text-white hover:bg-destructive/90">
              <Trash2 className="mr-1.5 h-4 w-4" /> Evet, sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
