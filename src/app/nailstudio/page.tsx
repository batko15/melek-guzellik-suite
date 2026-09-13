// V5.7 — /nailstudio: Canlı Nail Studio (gerçek URL, SEO + paylaşılabilir canlı link)
// Müşteri tırnak tasarımını canlı oluşturur — giriş GEREKMEZ.

import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { Providers } from "@/components/providers"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"

const brandName = `${BRAND_DISPLAY.part1} ${BRAND_DISPLAY.part2}`
const pageTitle = `Canlı Nail Studio — ${brandName}`
const pageDescription = `Tırnak tasarımını canlı oluştur: şekil, boy, renk, efekt ve nail art seç — anında önizle ve doğrudan randevu al · ${BRANDING.company.legalName}`

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/nailstudio" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/nailstudio",
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

export default function NailStudioPage() {
  return (
    <Providers>
      <AppShell initialStage="nailstudio" />
    </Providers>
  )
}
