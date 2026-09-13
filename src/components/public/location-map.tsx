// İnteraktif konum haritası — Leaflet + koyu CARTO karoları (Black-Gold uyumlu)
// SSR güvenli: Leaflet yalnızca tarayıcıda (useEffect içinde dinamik import) yüklenir.
// Araştırma pattern'i: vanilla Leaflet + Next.js App Router (tech-talk/nextjs-leaflet-starter).

"use client"

import { useEffect, useRef } from "react"
import "leaflet/dist/leaflet.css"
import { BRANDING } from "@/config/branding"
import { cn } from "@/lib/utils"

export function LocationMap({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cfg = BRANDING.map

  useEffect(() => {
    if (!cfg?.enabled || !containerRef.current) return

    let map: import("leaflet").Map | null = null
    let cancelled = false

    ;(async () => {
      const L = (await import("leaflet")).default

      if (cancelled || !containerRef.current) return

      // Altın iğne (divIcon — varsayılan iğne görselleri paketleyiciyle kırılır)
      const goldPin = L.divIcon({
        className: "mk-map-pin",
        html: `<div style="
          width: 34px; height: 34px; border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: linear-gradient(135deg, #f5d77f 0%, #d4af37 55%, #b8860b 100%);
          border: 2px solid rgba(245,215,127,0.9);
          box-shadow: 0 0 18px rgba(212,175,55,0.55), 0 4px 10px rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
        "><span style="transform: rotate(45deg); color:#1a1208; font-size:15px; font-weight:700;">✦</span></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 32],
        popupAnchor: [0, -30],
      })

      map = L.map(containerRef.current, {
        scrollWheelZoom: false, // sayfa kaydırmayı engellemesin
        attributionControl: true,
      }).setView([cfg.latitude, cfg.longitude], cfg.zoom)

      // Koyu CARTO karoları — Black-Gold temaya uyum (ücretsiz, atıf zorunlu)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
      }).addTo(map)

      L.marker([cfg.latitude, cfg.longitude], { icon: goldPin })
        .addTo(map)
        .bindPopup(
          `<b style="color:#d4af37">${BRANDING.company.legalName}</b><br>` +
            `<span style="color:#c9c4b8">${BRANDING.company.street}<br>${BRANDING.company.city}</span>`,
        )
        .openPopup()
    })()

    return () => {
      cancelled = true
      map?.remove()
    }
  }, [cfg?.enabled, cfg?.latitude, cfg?.longitude, cfg?.zoom])

  if (!cfg?.enabled) return null

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={`${BRANDING.company.legalName} konum haritası`}
      className={cn("h-[300px] w-full overflow-hidden rounded-2xl border border-border/70 sm:h-[360px]", className)}
    />
  )
}
