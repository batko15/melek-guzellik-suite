import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // ── V5.7 Performance & Sicherheit ──────────────────────────────────────────
  compress: true,                 // gzip/brotli-Antwortkomprimierung
  poweredByHeader: false,         // X-Powered-By entfernen (schmaler + sicherer)
  reactStrictMode: false,
  images: {
    // Moderne Formate für alle next/image-Bilder (AVIF ~30 % kleiner als WebP)
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    // Tree-Shaking für große Icon-/Datums-Bibliotheken → kleineres Client-Bundle
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
      {
        // Galerie-/Brand-Assets dürfen aggressiv gecacht werden (1 Jahr, immutable)
        source: "/gallery/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    // ============================================================
    // VERSION KONFIGURATION (V5.7.0)
    // ============================================================
    APP_VERSION: "5.7.0",
    NEXT_PUBLIC_APP_VERSION: "5.7.0",
    APP_NAME: "Melek Güzellik Suite",
    APP_DESCRIPTION: "Nail Art & Beauty Studio Gelibolu",
    BUILD_DATE: new Date().toISOString(),
    NEXT_PUBLIC_BUILD_DATE: "2026-09-13",
    // ============================================================
    // KONTAKT-INFORMATIONEN
    // ============================================================
    SALON_PHONE: "+905365726610",
    NEXT_PUBLIC_SALON_PHONE: "+905365726610",
    SALON_PHONE_FORMATTED: "+90 536 572 66 10",
    NEXT_PUBLIC_SALON_PHONE_FORMATTED: "+90 536 572 66 10",
    WHATSAPP_NUMBER: "905365726610",
    NEXT_PUBLIC_WHATSAPP_NUMBER: "905365726610",
  },
  generateBuildId: async () => {
    return `v5.7.0-${Date.now()}`;
  },
};

export default nextConfig;
