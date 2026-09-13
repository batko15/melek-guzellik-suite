// sitemap.xml — Suchmaschinen-Sitemap (Next.js Metadata Route)
// V5.3: echte URL-Routen (/randevu, /yorumlar) neben der Startseite —
// zusätzlich bleiben die Legacy-Hash-Links (#randevu, #yorumlar) funktional.

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
    {
      url: `${base}/randevu`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/nailart`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/nailstudio`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${base}/yorumlar`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ]
}
