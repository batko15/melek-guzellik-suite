// ═══════════════════════════════════════════════════════════════════════════
// SEO — Kanonische Basis-URL (Task 4-c)
// ═══════════════════════════════════════════════════════════════════════════
//   • canonical URLs, metadataBase, JSON-LD, sitemap.xml ve robots.txt
//     hepsi TEK kaynaktan türetilir — dağınık fallback'ler biter.
//   • Üretimde: NEXT_PUBLIC_SITE_URL ortam değişkenini gerçek alan adına
//     ayarlayın (örn. "https://melekce.com"). Branding'de sabit bir alan adı
//     bulunmadığı için (company.website serbest metindir) fallback, projenin
//     mevcut Vercel alan adıdır — layout.tsx/sitemap.ts'deki eski davranışla
//     birebir aynı.
// ═══════════════════════════════════════════════════════════════════════════

/** Trim edilmiş, sondaki eğik çizgiler temizlenmiş kanonik site kökü. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://melek-guzellik-suite.vercel.app"
).trim().replace(/\/+$/, "")

/** Relatif yol → mutlak URL (Google JSON-LD ve OG etiketleri mutlak URL ister). */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}
