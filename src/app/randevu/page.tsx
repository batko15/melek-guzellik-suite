// V5.3 — /randevu: echte URL-Route für die Online-Buchung (SEO + teilbare Links)
// Rendert dieselbe App-Shell mit Initial-Ansicht „randevu“ (Buchungsflow).

import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { Providers } from "@/components/providers"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"

export const metadata: Metadata = {
  title: `Randevu Al — ${BRAND_DISPLAY.part1} ${BRAND_DISPLAY.part2}`,
  description: `Online randevu alın: ${BRANDING.landing.heroDescription}`,
}

export default function RandevuPage() {
  return (
    <Providers>
      <AppShell initialStage="randevu" />
    </Providers>
  )
}
