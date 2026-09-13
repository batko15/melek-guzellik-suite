// V5.3 — /yorumlar: echte URL-Route für Kundenbewertungen (SEO + teilbare Links)
// Rendert dieselbe App-Shell mit Initial-Ansicht „yorumlar“ (Bewertungen).

import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { Providers } from "@/components/providers"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"

export const metadata: Metadata = {
  title: `Yorumlar — ${BRAND_DISPLAY.part1} ${BRAND_DISPLAY.part2}`,
  description: `Müşteri yorumlarımızı okuyun ve deneyiminizi paylaşın — ${BRANDING.company.legalName}`,
}

export default function YorumlarPage() {
  return (
    <Providers>
      <AppShell initialStage="yorumlar" />
    </Providers>
  )
}
