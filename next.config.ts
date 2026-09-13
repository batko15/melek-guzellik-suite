import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  env: {
    // ============================================================
    // VERSION KONFIGURATION (V5.6.0)
    // ============================================================
    APP_VERSION: "5.6.0",
    NEXT_PUBLIC_APP_VERSION: "5.6.0",
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
    return `v5.6.0-${Date.now()}`;
  },
};

export default nextConfig;
