// Rezervasyon Merkezi — Müşteri Bilgilendirme Penceresi (V3)
// Şablon seç → mesajı düzenle → WhatsApp / SMS / E-posta ile gönder.
// Her kanal açılışı Bildirim Günlüğü'ne kaydedilir (NotificationLog).
// Not: İçerik bileşeni hedef anahtarıyla yeniden bağlanır → form durumu
// props'tan türetilir, efektle eşitlenmez (react-hooks kuralı uyumlu).

"use client"

import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { MessageCircle, Send, Mail, Smartphone, History, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { type SalonBooking } from "@/lib/salon"
import {
  buildMessage, channelUrls, NOTIFY_KIND_META, type NotifyKind,
} from "@/lib/notify"

export interface NotifyTarget {
  booking: SalonBooking
  /** Hangi şablonla açılsın (varsayılan: onay) */
  initialKind?: NotifyKind
  /** API'nin hazırladığı mesaj (değişiklik akışında sunucudan gelir) */
  initialMessage?: string
}

const KINDS: NotifyKind[] = ["onay", "degisiklik", "iptal", "hatirlatma", "tamamlandi", "ozel"]

export function BookingNotifyDialog({
  target, open, onOpenChange,
}: {
  target: NotifyTarget | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  if (!target) return null
  const dialogKey = `${target.booking.id}-${target.initialKind ?? "onay"}-${target.initialMessage?.length ?? 0}`
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <NotifyInner key={dialogKey} target={target} onOpenChange={onOpenChange} />
    </Dialog>
  )
}

function NotifyInner({ target, onOpenChange }: { target: NotifyTarget; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const b = target.booking

  const [kind, setKind] = useState<NotifyKind>(target.initialKind ?? "onay")
  const [customText, setCustomText] = useState("")
  const [message, setMessage] = useState(() =>
    target.initialMessage ?? buildMessage(target.initialKind ?? "onay", mkArgs(b, "")),
  )

  const channels = useMemo(
    () =>
      channelUrls({
        phone: b.customer.phone,
        email: b.customer.email,
        message,
        subject: "Melek'çe Güzellik — Randevu Bilgilendirmesi",
      }),
    [b, message],
  )

  const applyKind = (k: NotifyKind) => {
    setKind(k)
    setMessage(buildMessage(k, mkArgs(b, customText)))
  }

  const send = async (channel: "whatsapp" | "sms" | "email", url: string) => {
    if (!message.trim()) {
      toast({ title: "Boş mesaj", description: "Lütfen bir mesaj yazın.", variant: "destructive" })
      return
    }
    // 1) Günlüğe kaydet (kanal açıldı = gönderildi kabulü)
    try {
      await fetch("/api/v1/salon/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: b.id,
          customer: b.customer.name,
          phone: b.customer.phone,
          channel,
          kind,
          message,
        }),
      })
      queryClient.invalidateQueries({ queryKey: ["bildirimler"] })
    } catch {
      // Günlük başarısızsa gönderi yine açılır — engelleme yok
    }
    // 2) Kanalı aç (yeni sekme — popup engelleyiciler için target=_blank)
    window.open(url, "_blank", "noopener,noreferrer")
    toast({
      title: `${channel === "whatsapp" ? "WhatsApp" : channel === "sms" ? "SMS" : "E-posta"} açılıyor`,
      description: `${b.customer.name} için mesaj hazır — gönder tuşuna basmanız yeterli.`,
    })
    onOpenChange(false)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      toast({ title: "Kopyalandı", description: "Mesaj panoya alındı." })
    } catch {
      toast({ title: "Kopyalanamadı", variant: "destructive" })
    }
  }

  return (
    <DialogContent className="mk-scroll max-h-[92vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-2xl border-border sm:max-w-xl">
      <DialogHeader>
        <DialogTitle className="mk-display flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5 text-brand-text" />
          Müşteriyi Bilgilendir
        </DialogTitle>
        <DialogDescription>
          {b.customer.name} · {b.customer.phone} — hazır Türkçe şablonla saniyeler içinde haber ver.
        </DialogDescription>
      </DialogHeader>

      {/* Şablon seçimi */}
      <div className="mk-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {KINDS.map((k) => (
          <button
            key={k}
            onClick={() => applyKind(k)}
            className={cn(
              "mk-focus whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              kind === k
                ? "border-primary/60 bg-primary/15 text-brand-text"
                : "border-border/70 bg-secondary/40 text-muted-foreground hover:text-foreground",
            )}
          >
            <span aria-hidden>{NOTIFY_KIND_META[k].icon}</span> {NOTIFY_KIND_META[k].label}
          </button>
        ))}
      </div>
      <p className="-mt-1 text-[11px] text-muted-foreground">{NOTIFY_KIND_META[kind].hint}</p>

      {/* Özel mesaj girişi */}
      {kind === "ozel" && (
        <div className="space-y-1.5">
          <label htmlFor="ozel-mesaj" className="text-xs font-semibold text-foreground">Özel metniniz</label>
          <Textarea
            id="ozel-mesaj"
            placeholder="Örn: Sayın Elif, bu hafta cumartesi için yeni bir dolgu randevusu planlamak istiyoruz…"
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value)
              setMessage(buildMessage("ozel", mkArgs(b, e.target.value)))
            }}
            className="min-h-[70px] rounded-xl"
          />
        </div>
      )}

      {/* Mesaj önizleme */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="bildirim-mesaj" className="text-xs font-semibold text-foreground">Mesaj (düzenlenebilir)</label>
          <Button variant="ghost" size="sm" onClick={copy} className="h-7 rounded-full px-2.5 text-[11px] text-muted-foreground">
            <Copy className="mr-1 h-3 w-3" /> Kopyala
          </Button>
        </div>
        <Textarea
          id="bildirim-mesaj"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[180px] rounded-xl font-mono text-[12px] leading-relaxed"
          aria-label="Gönderilecek mesaj"
        />
      </div>

      {/* Kanal butonları */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {channels.map(({ channel, url }) => (
          <Button
            key={channel}
            onClick={() => send(channel, url)}
            className={cn(
              "h-11 rounded-xl font-semibold",
              channel === "whatsapp" && "bg-emerald-700 text-white hover:bg-emerald-600",
              channel === "sms" && "bg-primary text-primary-foreground hover:bg-primary/90",
              channel === "email" && "border border-border bg-secondary/60 text-foreground hover:bg-secondary",
            )}
          >
            {channel === "whatsapp" && <MessageCircle className="mr-1.5 h-4 w-4" />}
            {channel === "sms" && <Smartphone className="mr-1.5 h-4 w-4" />}
            {channel === "email" && <Mail className="mr-1.5 h-4 w-4" />}
            {channel === "whatsapp" ? "WhatsApp" : channel === "sms" ? "SMS" : "E-posta"}
            <Send className="ml-1 h-3 w-3 opacity-70" />
          </Button>
        ))}
        {!b.customer.email && (
          <div className="col-span-2 flex items-center gap-2 rounded-xl border border-dashed border-border/70 px-3 py-2.5 text-[11px] text-muted-foreground sm:col-span-1">
            <Mail className="h-3.5 w-3.5 shrink-0" /> E-posta yok
          </div>
        )}
      </div>

      <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <History className="h-3 w-3" /> Gönderimler «Bildirimler» sekmesinde günlüğe yazılır.
      </p>
    </DialogContent>
  )
}

function mkArgs(b: SalonBooking, customText: string) {
  return {
    customerName: b.customer.name,
    customerPhone: b.customer.phone,
    serviceName: b.service.name,
    startAt: new Date(b.startAt),
    price: b.priceChf,
    notes: b.notes,
    customText,
  }
}
