// ═══════════════════════════════════════════════════════════════════════════
//  MÜŞTERİ MESAJ MERKEZİ — direkt müşteriye yaz (rezervasyondan bağımsız)
// ═══════════════════════════════════════════════════════════════════════════
//  Kanallar: WhatsApp (wa.me) · SMS (sms:) · E-Mail (mailto:) · Instagram DM
//  Hazır Türkçe şablonlar: kampanya, hatırlatma, doğum günü, teşekkür, özel.
//  Her kanal açılışı Bildirim Günlüğü'ne kaydedilir (Rezervasyon Merkezi'nde
//  «Bildirimler» sekmesinde görünür).

"use client"

import { useMemo, useState } from "react"
import { MessageCircle, Send, Copy, Mail, Smartphone, Instagram, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { BRANDING } from "@/config/branding"
import { phoneDigits } from "@/lib/phone"
import { cn } from "@/lib/utils"

export interface MessageCustomer {
  name: string
  phone: string
  email?: string | null
}

type TemplateId = "kampanya" | "hatirlatma" | "dogumgunu" | "tesekkur" | "ozel"

const TEMPLATES: Array<{ id: TemplateId; label: string; emoji: string }> = [
  { id: "kampanya", label: "Kampanya", emoji: "🎁" },
  { id: "hatirlatma", label: "Hatırlatma", emoji: "⏰" },
  { id: "dogumgunu", label: "Doğum Günü", emoji: "🎂" },
  { id: "tesekkur", label: "Teşekkür", emoji: "💐" },
  { id: "ozel", label: "Serbest", emoji: "✍️" },
]

const BRAND = () => BRANDING.brand.nameParts.join(" ")
const IG = () => BRANDING.company.instagram

function templateText(id: TemplateId, name: string): string {
  const first = name.split(" ")[0] || "Misafirimiz"
  switch (id) {
    case "kampanya":
      return `Merhaba ${first}! 🎁 ${BRAND()}'te bu hafta özel: jel tırnak bakımlarında %20 indirim. Yer sınırlı — hemen randevu almak için bize yazabilir ya da sitemizden online randevu oluşturabilirsin. Sevgilerle ✨ Instagram: @${IG()}`
    case "hatirlatma":
      return `Merhaba ${first}! ⏰ Tırnak/kirpik bakım zamanınız yaklaşıyor gibi görünüyor. Tazelik için uygun bir tarih ayarlayalım mı? Online randevu: sitemiz üzerinden saniyeler içinde. Görüşmek üzere! ✨`
    case "dogumgunu":
      return `Doğum günün kutlu olsun ${first}! 🎂💐 ${BRAND()} ailesi olarak güzel gününde sana özel bir sürprizimiz var — doğum günü haftanıza özel bakımlarımızda indirim. Detay için bize yaz. Nice güzel yıllara! ✨`
    case "tesekkur":
      return `Merhaba ${first}! 💐 Bizi tercih ettiğin ve güvendiğin için çok teşekkür ederiz. Yeni çalışmalarımızı görmek için Instagram'ımızı takip edebilirsin: @${IG()} Yine bekleriz — sevgiler! ✨`
    case "ozel":
      return `Merhaba ${first}! `
  }
}

export function CustomerMessageDialog({
  customer, open, onOpenChange,
}: {
  customer: MessageCustomer | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { toast } = useToast()
  const [template, setTemplate] = useState<TemplateId>("kampanya")
  // Çağıran taraf key={customer.phone} ile remount eder → şablon her müşteri
  // için taze başlar (set-state-in-render anti-pattern'inden kaçınır).
  const [text, setText] = useState(() => templateText("kampanya", customer?.name ?? ""))
  const [sent, setSent] = useState<string | null>(null)

  const message = useMemo(() => text.trim(), [text])
  const whatsappUrl = customer
    ? `https://wa.me/${phoneDigits(customer.phone)}?text=${encodeURIComponent(message)}`
    : "#"
  const smsUrl = customer
    ? `sms:+${phoneDigits(customer.phone)}?body=${encodeURIComponent(message)}`
    : "#"
  const emailUrl = customer?.email
    ? `mailto:${customer.email}?subject=${encodeURIComponent(`${BRAND()} — Özel Mesajınız`)}&body=${encodeURIComponent(message)}`
    : null
  const instagramUrl = `https://www.instagram.com/direct/inbox/`

  async function logChannel(channel: string) {
    if (!customer || !message) return
    try {
      await fetch("/api/v1/salon/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customer.name,
          phone: customer.phone,
          channel,
          kind: "ozel",
          message,
        }),
      })
    } catch {
      /* Protokol hatası mesajı engellemesin */
    }
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message)
      toast({ title: "Kopyalandı", description: "Mesaj panoya alındı — istediğiniz yere yapıştırın." })
    } catch {
      toast({ title: "Kopyalanamadı", description: "Metni elle seçip kopyalayın." })
    }
  }

  function openChannel(channel: string, url: string) {
    if (!message) {
      toast({ title: "Mesaj boş", description: "Önce bir mesaj yazın veya şablon seçin." })
      return
    }
    void logChannel(channel)
    window.open(url, "_blank", "noopener,noreferrer")
    setSent(channel)
  }

  async function openInstagram() {
    if (!message) {
      toast({ title: "Mesaj boş", description: "Önce bir mesaj yazın veya şablon seçin." })
      return
    }
    // Instagram DM derin bağlantısı metin ön-doldurmayı desteklemez:
    // mesajı panoya kopyala + DM kutusunu aç → orada müşteriyi arayıp yapıştır.
    try { await navigator.clipboard.writeText(message) } catch { /* yoksay */ }
    void logChannel("instagram")
    window.open(instagramUrl, "_blank", "noopener,noreferrer")
    setSent("instagram")
    toast({
      title: "Instagram DM açılıyor",
      description: "Mesaj panoya kopyalandı — müşteri adını arayın ve yapıştırın.",
    })
  }

  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mk-scroll max-h-[92vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto border-border bg-background sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="mk-display flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-brand-text" />
            Müşteriye Mesaj Gönder
          </DialogTitle>
          <DialogDescription>
            {customer.name} · {customer.phone}
            {customer.email ? ` · ${customer.email}` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Şablonlar */}
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTemplate(t.id); setText(templateText(t.id, customer.name)); setSent(null) }}
              className={cn(
                "mk-focus rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
                template === t.id
                  ? "border-primary/60 bg-primary/15 text-brand-text"
                  : "border-border/70 bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* Mesaj */}
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            maxLength={2000}
            className="mk-focus w-full resize-none rounded-xl border border-border bg-secondary/30 p-3.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground"
            placeholder="Müşteriye göndermek istediğiniz mesajı yazın…"
          />
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{text.length} / 2000 karakter</span>
            <button type="button" onClick={copyMessage} className="mk-focus inline-flex items-center gap-1 font-semibold text-brand-text hover:underline">
              <Copy className="h-3 w-3" /> Kopyala
            </button>
          </div>
        </div>

        {/* Kanallar */}
        <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-4">
          <Button
            onClick={() => openChannel("whatsapp", whatsappUrl)}
            className="h-11 rounded-xl bg-[#25D366] text-[11px] font-bold text-black hover:bg-[#20bd5a]"
          >
            <MessageCircle className="mr-1 h-4 w-4" /> WhatsApp
          </Button>
          <Button
            onClick={() => openChannel("sms", smsUrl)}
            className="h-11 rounded-xl bg-secondary/70 text-[11px] font-bold text-foreground hover:bg-secondary"
          >
            <Smartphone className="mr-1 h-4 w-4" /> SMS
          </Button>
          <Button
            onClick={() => openChannel("email", emailUrl ?? "mailto:")}
            disabled={!customer.email}
            className="h-11 rounded-xl bg-secondary/70 text-[11px] font-bold text-foreground hover:bg-secondary disabled:opacity-40"
            title={customer.email ? undefined : "Müşterinin e-postası yok"}
          >
            <Mail className="mr-1 h-4 w-4" /> E-Mail
          </Button>
          <Button
            onClick={openInstagram}
            className="h-11 rounded-xl bg-gradient-to-tr from-[#feda75] via-[#d62977] to-[#4f5bd5] text-[11px] font-bold text-white hover:opacity-90"
          >
            <Instagram className="mr-1 h-4 w-4" /> Instagram
          </Button>
        </div>

        {sent && (
          <p className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-[11px] font-medium text-brand-text">
            <Check className="h-3.5 w-3.5" />
            {sent === "whatsapp" && "WhatsApp sohbeti yeni sekmede açıldı — gönder tuşuna basmanız yeterli."}
            {sent === "sms" && "Mesaj uygulaması açıldı — numara ve metin hazır."}
            {sent === "email" && "E-posta programınız açıldı — konu ve metin hazır."}
            {sent === "instagram" && "Instagram DM kutusu açıldı — mesaj panoya kopyalandı, müşteriyi arayıp yapıştırın."}
          </p>
        )}

        <p className="flex items-center gap-1.5 text-[10px] leading-relaxed text-muted-foreground">
          <Send className="h-3 w-3 shrink-0" />
          Gönderim telefonunuzda/e-postanızda tamamlanır — her açılan kanal otomatik olarak Bildirim Günlüğü'ne kaydedilir.
        </p>
      </DialogContent>
    </Dialog>
  )
}
