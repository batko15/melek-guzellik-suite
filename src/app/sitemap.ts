// sitemap.xml — Suchmaschinen-Sitemap (Next.js Metadata Route)
// Die Suite ist eine Single-Page-Anwendung (Landing + Hash-Routing für
// Buchung/Bewertungen) — daher ein Eintrag für die Startseite.

import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://melek-guzellik-suite.vercel.app"
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ]
}
