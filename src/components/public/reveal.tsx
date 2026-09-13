// ═══════════════════════════════════════════════════════════════════════════
// V5.8 — REVEAL: görünür olunca yumuşakça belirme (fade + yukarı kayma)
//   • framer-motion whileInView — sayfa yüklenirken değil, ekrana girince
//   • prefers-reduced-motion: hareketi tamamen kapatır (yalnızca içerik)
//   • Layout-shift yok: yalnızca transform/opacity animasyonu
// ═══════════════════════════════════════════════════════════════════════════

"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"

type RevealProps = {
  children: ReactNode
  /** Kademeli görünüm için gecikme (saniye) — ör. grid içinde 0 / 0.12 / 0.24 */
  delay?: number
  className?: string
}

/** Ekrana girince fade+up ile belirir; reduced-motion'da hareket etmeden gösterir. */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduceMotion = useReducedMotion()

  // Kullanıcı hareket azaltmayı tercih ettiyse: animasyonsuz, doğrudan içerik
  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  )
}
