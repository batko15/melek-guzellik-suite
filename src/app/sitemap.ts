// sitemap.xml — Suchmaschinen-Sitemap (Next.js Metadata Route)
// V5.3: echte URL-Routen (/randevu, /yorumlar) neben der Startseite —
// zusätzlich bleiben die Legacy-Hash-Links (#randevu, #yorumlar) funktional.
// V4-c: kanonische Basis aus EINER Quelle (seo/site.ts — NEXT_PUBLIC_SITE_URL
// → Vercel-Fallback), alle 5 öffentlichen Routen.

import type { MetadataRoute } from "next"
import { SITE_URL } from "@/components/seo/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL
  const now = new Date()
  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/randevu`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/nailart`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/nailstudio`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${base}/yorumlar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ]
}
