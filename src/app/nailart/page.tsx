// V5.6 — /nailart: Tırnak Sanatı Galerisi (gerçek URL, SEO + paylaşılabilir canlı link)
// Rendert dieselbe App-Shell mit Initial-Ansicht „nailart“ — giriş GEREKMEZ.

import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { Providers } from "@/components/providers"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"

export const metadata: Metadata = {
  title: `Tırnak Sanatı — ${BRAND_DISPLAY.part1} ${BRAND_DISPLAY.part2}`,
  description: `Tırnak sanatı tasarım galerimiz: kedi gözü, ombre, folyo, inci tozu ve daha fazlası — beğendiğiniz tasarımı online randevuyla isteyin · ${BRANDING.company.legalName}`,
}

export default function NailArtPage() {
  return (
    <Providers>
      <AppShell initialStage="nailart" />
    </Providers>
  )
}
