// V5.7 — /nailstudio: Canlı Nail Studio (gerçek URL, SEO + paylaşılabilir canlı link)
// Müşteri tırnak tasarımını canlı oluşturur — giriş GEREKMEZ.

import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { Providers } from "@/components/providers"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"

export const metadata: Metadata = {
  title: `Canlı Nail Studio — ${BRAND_DISPLAY.part1} ${BRAND_DISPLAY.part2}`,
  description: `Tırnak tasarımını canlı oluştur: şekil, boy, renk, efekt ve nail art seç — anında önizle ve doğrudan randevu al · ${BRANDING.company.legalName}`,
}

export default function NailStudioPage() {
  return (
    <Providers>
      <AppShell initialStage="nailstudio" />
    </Providers>
  )
}
