import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { BRANDING, BRAND_DISPLAY } from "@/config/branding";

const brandName = `${BRAND_DISPLAY.part1} ${BRAND_DISPLAY.part2}`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#151210",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://melek-guzellik-suite.vercel.app"),
  title: `${brandName} — ${BRANDING.brand.tagline}`,
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
  openGraph: {
    title: `${brandName} — ${BRANDING.brand.tagline}`,
    description: BRANDING.landing.heroDescription,
    siteName: brandName,
    type: "website",
    images: [BRANDING.brand.ogImage],
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
