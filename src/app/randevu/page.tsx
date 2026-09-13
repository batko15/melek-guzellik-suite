// V5.3 — /randevu: echte URL-Route für die Online-Buchung (SEO + teilbare Links)
// Rendert dieselbe App-Shell mit Initial-Ansicht „randevu“ (Buchungsflow).

import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { Providers } from "@/components/providers"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"

const brandName = `${BRAND_DISPLAY.part1} ${BRAND_DISPLAY.part2}`
const pageTitle = `Randevu Al — ${brandName}`
const pageDescription =
  "Online randevu alın: hizmeti, saati ve tarihi kendiniz seçin — üyelik yok, giriş gerekmez, 1 dakikada tamam."

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/randevu" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/randevu",
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

export default function RandevuPage() {
  return (
    <Providers>
      <AppShell initialStage="randevu" />
    </Providers>
  )
}
