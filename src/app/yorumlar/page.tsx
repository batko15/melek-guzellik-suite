// V5.3 — /yorumlar: echte URL-Route für Kundenbewertungen (SEO + teilbare Links)
// Rendert dieselbe App-Shell mit Initial-Ansicht „yorumlar“ (Bewertungen).

import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { Providers } from "@/components/providers"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"

const brandName = `${BRAND_DISPLAY.part1} ${BRAND_DISPLAY.part2}`
const pageTitle = `Yorumlar — ${brandName}`
const pageDescription = `Müşteri yorumlarımızı okuyun ve deneyiminizi paylaşın — ${BRANDING.company.legalName}, ${BRANDING.company.city}`

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/yorumlar" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/yorumlar",
    siteName: brandName,
    type: "website",
    locale: "tr_TR",
    images: [BRANDING.brand.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
  },
}

export default function YorumlarPage() {
  return (
    <Providers>
      <AppShell initialStage="yorumlar" />
    </Providers>
  )
}
