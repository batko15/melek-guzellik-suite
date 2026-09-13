import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { BRANDING, BRAND_DISPLAY } from "@/config/branding";
import { JsonLd, SITE_JSON_LD } from "@/components/seo/json-ld";
import { SITE_URL } from "@/components/seo/site";

const brandName = `${BRAND_DISPLAY.part1} ${BRAND_DISPLAY.part2}`;
const brandTitle = `${brandName} — ${BRANDING.brand.tagline}`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#151210",
};

export const metadata: Metadata = {
  // V4-c: kanonik taban tek kaynaktan (NEXT_PUBLIC_SITE_URL → Vercel fallback)
  metadataBase: new URL(SITE_URL),
  title: brandTitle,
  description: `${BRANDING.landing.heroDescription}`,
  keywords: [BRAND_DISPLAY.part2, "Tırnak Sanatı", "Güzellik Stüdyosu", "Manikür", "Kirpik", BRANDING.company.city, "Randevu Al", BRANDING.locale.currency],
  authors: [{ name: BRANDING.company.legalName }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Melek'çe",
  },
  formatDetection: { telephone: true },
  alternates: {
    // V4-c: sayfa bazlı canonical — alt sayfalar kendi canonical'ını yazar
    canonical: "/",
  },
  openGraph: {
    title: brandTitle,
    description: BRANDING.landing.heroDescription,
    siteName: brandName,
    type: "website",
    // V4-c: Open Graph yereli (Türkiye)
    locale: "tr_TR",
    url: "/",
    images: [BRANDING.brand.ogImage],
  },
  twitter: {
    // V4-c: Twitter/X kartı — görseller opengraph-image.tsx dosyalarından
    // (veya fallback olarak OG görselinden) gelir
    card: "summary_large_image",
    title: brandTitle,
    description: BRANDING.landing.heroDescription,
    images: [BRANDING.brand.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "cache-control": "no-cache, no-store, must-revalidate",
    pragma: "no-cache",
    expires: "0",
    version: `Suite-${BRANDING.version}`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground min-h-screen">
        {/* V4-c: site geneli JSON-LD — BeautySalon + WebSite (@graph) */}
        <JsonLd data={SITE_JSON_LD} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
