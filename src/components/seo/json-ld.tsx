// ═══════════════════════════════════════════════════════════════════════════
// SEO — JSON-LD Structured Data (schema.org) — Task 4-c
// ═══════════════════════════════════════════════════════════════════════════
//   Google Rich-Snippets için yapılandırılmış veri — tüm değerler statik
//   olarak src/config/branding.ts'ten gelir (build-time güvenli, kullanıcı
//   girdisi YOK). Sunucu bileşenidir ("use client" yok) — root layout'ta
//   <body> içinde render edilir; Google JSON-LD'yi body'de de okur.
//
//   Kasıtlı olarak ATLANDI (Google yapılandırılmış veri ilkeleri gereği):
//     • AggregateRating — değerler yalnızca API üzerinden çalışma anında
//       biliniyor (onaylı yorumlar DB'de); build-time doğrulanabilir gerçek
//       bir kaynak yok ve "/" sayfası puan bileşeni göstermiyor → sahte/
//       görünmeyen puan işaretlemesi manuel işlem riski taşır.
//     • FAQPage — açılış sayfasında SSS içeriği yok → uydurulmaz.
//     • Service/Offer fiyatları — hizmet fiyatları DB'den (API) geliyor,
//       statik sabit değil → Offer işaretlemesi eklenmez.
// ═══════════════════════════════════════════════════════════════════════════

import { BRANDING, BRAND_NAME } from "@/config/branding"
import { absoluteUrl, SITE_URL } from "./site"

/** Bilinçli olarak gevşek tip — schema.org düğümleri serbest anahtar kümesidir. */
export type JsonLdNode = Record<string, unknown>

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

/** BRANDING.openingHours sırası: Pzt=0 … Paz=6 → schema.org gün adları. */
const SCHEMA_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const

interface HourRange {
  opens: string
  closes: string
}

/** "09:00 – 18:00" → { opens, closes } (en-dash, em-dash, tire desteklenir). */
function parseHourRange(hours: string): HourRange | null {
  const m = hours.match(/(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/)
  if (!m) return null
  return { opens: m[1]!, closes: m[2]! }
}

/**
 * Aynı saatlere sahip ardışık günler tek OpeningHoursSpecification'da
 * birleştirilir (Salı–Cuma 09:00–18:00, Cumartesi ayrı) — kapalı günler atlanır.
 * Ayrıştırılamayan satırlar güvenli şekilde sessizce atlanır.
 */
function openingHoursSpecifications(): JsonLdNode[] {
  const specs: JsonLdNode[] = []
  let run: { days: string[]; range: HourRange } | null = null

  const flush = () => {
    if (!run) return
    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: run.days,
      opens: run.range.opens,
      closes: run.range.closes,
    })
    run = null
  }

  for (const [idx, entry] of BRANDING.openingHours.entries()) {
    const day = SCHEMA_DAYS[idx]
    const range = entry.closed ? null : parseHourRange(entry.hours)
    if (!day || !range) {
      flush()
      continue
    }
    if (run && run.range.opens === range.opens && run.range.closes === range.closes) {
      run.days.push(day)
    } else {
      flush()
      run = { days: [day], range }
    }
  }
  flush()
  return specs
}

/** "17500 Gelibolu / Çanakkale" → { postalCode, addressLocality, addressRegion }. */
function parseCity(city: string): {
  postalCode?: string
  addressLocality: string
  addressRegion?: string
} {
  const [left, right] = city.split("/").map((part) => part.trim())
  const zm = left?.match(/^(\d{5})\s+(.+)$/)
  return {
    postalCode: zm?.[1],
    addressLocality: zm?.[2] ?? left ?? city,
    addressRegion: right || undefined,
  }
}

function instagramUrl(): string | undefined {
  const handle = BRANDING.company.instagram?.trim().replace(/^@/, "")
  return handle ? `https://www.instagram.com/${handle}` : undefined
}

// ─── Düğüm kurucular ─────────────────────────────────────────────────────────

/** BeautySalon (LocalBusiness) — ana kuruluş düğümü (@id ile referanslanır). */
export function salonJsonLd(): JsonLdNode {
  const { company, map, brand, landing, locale } = BRANDING
  const city = parseCity(company.city)
  const sameAs = instagramUrl()

  return {
    "@type": "BeautySalon",
    "@id": absoluteUrl("/#salon"),
    name: BRAND_NAME,
    alternateName: company.legalName,
    description: landing.heroDescription,
    url: SITE_URL,
    telephone: company.phone,
    priceRange: "₺₺",
    currenciesAccepted: locale.currency,
    image: [absoluteUrl(brand.ogImage), absoluteUrl("/gallery/hero.png")],
    logo: absoluteUrl(brand.logoFull),
    foundingDate: brand.since,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.street,
      addressLocality: city.addressLocality,
      addressRegion: city.addressRegion,
      postalCode: city.postalCode,
      addressCountry: "TR",
    },
    ...(map.enabled
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: map.latitude,
            longitude: map.longitude,
          },
          hasMap: map.googleMapsUrl,
        }
      : {}),
    openingHoursSpecification: openingHoursSpecifications(),
    ...(sameAs ? { sameAs: [sameAs] } : {}),
  }
}

/** WebSite — yayıncı olarak BeautySalon düğümüne @id üzerinden bağlanır. */
export function webSiteJsonLd(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: SITE_URL,
    name: BRAND_NAME,
    alternateName: `${BRAND_NAME} — ${BRANDING.brand.tagline}`,
    description: BRANDING.brand.tagline,
    inLanguage: BRANDING.locale.language,
    publisher: { "@id": absoluteUrl("/#salon") },
  }
}

/**
 * Site geneli @graph: BeautySalon + WebSite (ayrı Organization düğümü
 * bilinçli olarak atlandı — BeautySalon zaten bir Organization alt tipidir;
 * @id referansı ikilemeyi önler).
 */
export const SITE_JSON_LD: JsonLdNode = {
  "@context": "https://schema.org",
  "@graph": [salonJsonLd(), webSiteJsonLd()],
}

// ─── Render bileşeni ─────────────────────────────────────────────────────────

/** <script type="application/ld+json"> — değerler statik sabitlerdir. */
export function JsonLd({ data }: { data: JsonLdNode }) {
  return (
    <script
      type="application/ld+json"
      // "</script>" kaçışını engellemek için "<" unicode-escape edilir
      // (best practice — veri statik olsa da savunmacı kalınır).
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}
