// robots.txt — Suchmaschinen-Crawler-Anweisungen (Next.js Metadata Route)
// Erlaubt das Crawlen der öffentlichen Salon-Webseite und verweist auf die Sitemap.
// V4-c: kanonische Basis aus EINER Quelle (seo/site.ts) — Sitemap-URL ist
// dadurch garantiert absolut und konsistent mit metadataBase/canonical.

import type { MetadataRoute } from "next"
import { SITE_URL } from "@/components/seo/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
