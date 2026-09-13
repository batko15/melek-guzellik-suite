// ═══════════════════════════════════════════════════════════════════════════
// FLOATING WHATSAPP — site geneli yüzen WhatsApp butonu (Task 4-c)
// ═══════════════════════════════════════════════════════════════════════════
//   • Herkese açık görünümlerde sağ altta yüzen yuvarlak buton — app-shell
//     yalnızca public stage'lerde render eder (ekip portalı/giriş ekranı YOK).
//   • Mobil: alt gezinme çubuğunun (min 60px + safe-area) ÜSTENDE yüzer →
//     bottom-[calc(72px+env(safe-area-inset-bottom))]; masaüstü: bottom-6.
//   • Numara UI'da düz metin olarak GÖSTERİLMEZ (branding kuralı) — yalnızca
//     wa.me bağlantısında yaşar. Prefill mesajı hazırdır.
//   • Mini sohbet popup'ı: selamlama + wa.me CTA — framer-motion, reduced-motion
//     duyarlı, Escape ile kapanır, açılınca CTA odak alır (klavye erişimi).
// ═══════════════════════════════════════════════════════════════════════════

"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowUpRight, MessageCircle, X } from "lucide-react"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"

// wa.me yalnızca başında "+" olmayan uluslararası biçimi kabul eder (+90… → 90…)
const WA_NUMBER = (
  BRANDING.company.whatsapp || BRANDING.company.phone
).replace(/\D/g, "")

const WA_PREFILL =
  "Merhaba! Randevu ve hizmetleriniz hakkında bilgi almak istiyorum. 🌸"

const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_PREFILL)}`

const WHATSAPP_GREEN = "#25D366"

export function FloatingWhatsApp() {
  const [open, setOpen] = useState(false)
  const reduceMotion = useReducedMotion()
  const ctaRef = useRef<HTMLAnchorElement>(null)

  // Escape popup'ı kapatır
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  // Açılınca klavye odağı CTA'ya geçer (a11y)
  useEffect(() => {
    if (open) ctaRef.current?.focus()
  }, [open])

  return (
    <div
      className="fixed z-40 flex flex-col items-end gap-3 right-4 bottom-[calc(72px+env(safe-area-inset-bottom))] md:right-6 md:bottom-6 print:hidden"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="WhatsApp hızlı mesaj"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.92 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-72 max-w-[calc(100vw-2rem)] origin-bottom-right overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl shadow-black/40"
          >
            {/* Başlık — marka + çevrimiçi durumu */}
            <div className="flex items-center gap-3 border-b border-border/60 bg-secondary/50 px-4 py-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: WHATSAPP_GREEN }}
                aria-hidden="true"
              >
                <MessageCircle className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 leading-tight">
                <div className="mk-display truncate text-[13px] font-bold text-foreground">
                  {BRAND_DISPLAY.part1} {BRAND_DISPLAY.part2}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: WHATSAPP_GREEN }} />
                  Çevrimiçi — genellikle hızlı yanıt
                </div>
              </div>
            </div>

            {/* Selamlama balonu */}
            <div className="px-4 py-4">
              <div className="rounded-xl rounded-tl-sm border border-border/60 bg-background/70 px-3.5 py-3 text-[13px] leading-relaxed text-foreground">
                Merhaba! 👋 Nasıl yardımcı olabilirim?
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  Randevu, fiyatlar veya tırnak tasarımınız — kısaca yazın, en kısa sürede dönelim.
                </span>
              </div>

              {/* CTA — numara yalnızca bağlantıda */}
              <a
                ref={ctaRef}
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="mk-focus mt-3 flex h-11 items-center justify-center gap-2 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: WHATSAPP_GREEN }}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp&apos;tan yaz
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Yüzen buton */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? "WhatsApp penceresini kapat" : "WhatsApp'tan yaz"}
        title="WhatsApp'tan yaz"
        initial={reduceMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.6 }}
        whileHover={reduceMotion ? undefined : { scale: 1.07 }}
        whileTap={reduceMotion ? undefined : { scale: 0.94 }}
        className="mk-focus relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl shadow-black/40 ring-1 ring-white/20 md:h-16 md:w-16"
        style={{ backgroundColor: WHATSAPP_GREEN }}
      >
        {open ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <MessageCircle className="h-7 w-7" aria-hidden="true" />
        )}
        {!open && (
          <span
            className="absolute right-0.5 top-0.5 h-3.5 w-3.5 animate-pulse rounded-full bg-primary ring-2 ring-background"
            aria-hidden="true"
          />
        )}
      </motion.button>
    </div>
  )
}
