import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { BRANDING, BRAND_DISPLAY } from "@/config/branding";

const brandName = `${BRAND_DISPLAY.part1} ${BRAND_DISPLAY.part2}`;

export const metadata: Metadata = {
  title: `${brandName} — ${BRANDING.brand.tagline}`,
  description: `${BRANDING.landing.heroDescription}`,
  keywords: [BRAND_DISPLAY.part2, "Tırnak Sanatı", "Güzellik Stüdyosu", "Manikür", "Kirpik", BRANDING.company.city, "Randevu Al", BRANDING.locale.currency],
  authors: [{ name: BRANDING.company.legalName }],
  openGraph: {
    title: `${brandName} — ${BRANDING.brand.tagline}`,
    description: BRANDING.landing.heroDescription,
    siteName: brandName,
    type: "website",
    images: ["/gallery/hero.png"],
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
