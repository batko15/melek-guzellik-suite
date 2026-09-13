// V5.6 — /nailart: Tırnak Sanatı Galerisi (gerçek URL, SEO + paylaşılabilir canlı link)
// Rendert dieselbe App-Shell mit Initial-Ansicht „nailart“ — giriş GEREKMEZ.

import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { Providers } from "@/components/providers"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"

const brandName = `${BRAND_DISPLAY.part1} ${BRAND_DISPLAY.part2}`
const pageTitle = `Tırnak Sanatı — ${brandName}`
const pageDescription = `Tırnak sanatı tasarım galerimiz: kedi gözü, ombre, folyo, inci tozu ve daha fazlası — beğendiğiniz tasarımı online randevuyla isteyin · ${BRANDING.company.legalName}`

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/nailart" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/nailart",
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

export default function NailArtPage() {
  return (
    <Providers>
      <AppShell initialStage="nailart" />
    </Providers>
  )
}
