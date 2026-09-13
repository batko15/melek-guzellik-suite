// ═══════════════════════════════════════════════════════════════════════════
//  OG-Image (/randevu) — 1200×630, next/og. «Online Randevu»-Variante mit
//  echten Versprechen aus branding.ts (ctaHint, guestNote, footer note).
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"

export const alt = `Online Randevu — ${BRAND_DISPLAY.part1} ${BRAND_DISPLAY.part2}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Inter aus public/fonts — volle türkische Glyphen (ş/ğ/İ fehlen im
// latin-only Standard-Font von next/og → Tofu-Boxen).
const interRegular = readFileSync(join(process.cwd(), "public/fonts/Inter-400.ttf"))
const interBold = readFileSync(join(process.cwd(), "public/fonts/Inter-700.ttf"))
const fonts = [
  { name: "Inter", data: interRegular, weight: 400 as const, style: "normal" as const },
  { name: "Inter", data: interBold, weight: 700 as const, style: "normal" as const },
]
const upper = (s: string) => s.toLocaleUpperCase("tr-TR")

const GOLD = "#d4af37"
const GOLD_SOFT = "#e9c766"
const IVORY = "#f6efe7"
const VELVET = "#150e10"
const BURGUNDY = "#2a1016"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Inter",
          backgroundColor: VELVET,
          backgroundImage: `linear-gradient(160deg, ${BURGUNDY} 0%, ${VELVET} 55%, #120d0f 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Zentrale Schimmer */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -420,
            marginLeft: -620,
            width: 1240,
            height: 900,
            borderRadius: 9999,
            backgroundImage:
              "radial-gradient(closest-side, rgba(122,31,43,0.42), rgba(122,31,43,0))",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: -420,
            marginLeft: -620,
            width: 1240,
            height: 900,
            borderRadius: 9999,
            backgroundImage:
              "radial-gradient(closest-side, rgba(212,175,55,0.14), rgba(212,175,55,0))",
            display: "flex",
          }}
        />

        {/* Zwei kleine Flügel-Fächer, symmetrisch unten */}
        {[0, 1].map((side) => (
          <div key={side} style={{ display: "flex" }}>
            {[
              { w: 300, top: 400, off: 96, rot: 30 },
              { w: 244, top: 452, off: 118, rot: 54 },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: f.top,
                  ...(side === 0 ? { left: f.off } : { right: f.off }),
                  width: f.w,
                  height: 20,
                  borderRadius: 9999,
                  backgroundImage:
                    side === 0
                      ? "linear-gradient(90deg, rgba(212,175,55,0), rgba(212,175,55,0.4))"
                      : "linear-gradient(90deg, rgba(212,175,55,0.4), rgba(212,175,55,0))",
                  transform: `rotate(${side === 0 ? -f.rot : f.rot}deg)`,
                  display: "flex",
                }}
              />
            ))}
          </div>
        ))}

        {/* Gold-Rahmen */}
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            borderRadius: 26,
            borderWidth: 2,
            borderStyle: "solid",
            borderColor: "rgba(212,175,55,0.38)",
            display: "flex",
          }}
        />

        {/* ─── Inhalt (zentriert) ─── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 12, height: 12, backgroundColor: GOLD, transform: "rotate(45deg)", display: "flex" }} />
            <div style={{ fontSize: 25, letterSpacing: 7, color: GOLD_SOFT }}>
              {upper(BRANDING.company.legalName)}
            </div>
            <div style={{ width: 12, height: 12, backgroundColor: GOLD, transform: "rotate(45deg)", display: "flex" }} />
          </div>

          <div style={{ display: "flex", alignItems: "baseline", marginTop: 30 }}>
            <div style={{ fontSize: 108, fontWeight: 700, color: IVORY }}>Online</div>
            <div style={{ fontSize: 108, fontWeight: 700, color: GOLD }}>{`\u00a0Randevu`}</div>
          </div>

          <div style={{ marginTop: 28, fontSize: 38, color: "rgba(246,239,231,0.82)" }}>
            {BRANDING.landing.ctaHint}
          </div>

          {/* Echte Versprechen-Chips */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 40 }}>
            {["7/24 açık", "Giriş gerekmez", "Üyelik yok"].map((c) => (
              <div
                key={c}
                style={{
                  display: "flex",
                  padding: "10px 24px",
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: "rgba(212,175,55,0.5)",
                  color: GOLD_SOFT,
                  fontSize: 26,
                }}
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  )
}
