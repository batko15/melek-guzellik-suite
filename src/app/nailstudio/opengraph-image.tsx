// ═══════════════════════════════════════════════════════════════════════════
//  OG-Image (/nailstudio) — 1200×630, next/og. «Canlı Nail Studio»-Variante
//  mit den echten Katalog-Umfängen (6 Formen · 3 Längen · 16 Farben ·
//  6 Effekte · 8 Nail-Art) als Chips. Geteilte Designs erhalten stattdessen
//  die dynamische Variante über /api/v1/og?design=…
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"
import { NAIL_SHAPES, NAIL_LENGTHS, NAIL_COLORS, NAIL_FINISHES, NAIL_ARTS } from "@/lib/nail-design"

export const alt = `Canlı Nail Studio — ${BRAND_DISPLAY.part1} ${BRAND_DISPLAY.part2}`
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
  const counts = [
    `${NAIL_SHAPES.length} Şekil`,
    `${NAIL_LENGTHS.length} Boy`,
    `${NAIL_COLORS.length} Renk`,
    `${NAIL_FINISHES.length} Efekt`,
    `${NAIL_ARTS.length} Nail Art`,
  ]
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          fontFamily: "Inter",
          backgroundColor: VELVET,
          backgroundImage: `linear-gradient(135deg, ${BURGUNDY} 0%, ${VELVET} 52%, #120d0f 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Schimmer */}
        <div
          style={{
            position: "absolute",
            right: -220,
            bottom: -320,
            width: 880,
            height: 740,
            borderRadius: 9999,
            backgroundImage:
              "radial-gradient(closest-side, rgba(122,31,43,0.48), rgba(122,31,43,0))",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -260,
            top: -320,
            width: 760,
            height: 640,
            borderRadius: 9999,
            backgroundImage:
              "radial-gradient(closest-side, rgba(212,175,55,0.16), rgba(212,175,55,0))",
            display: "flex",
          }}
        />

        {/* Flügel-Fächer oben rechts, aufsteigend */}
        {[
          { w: 380, top: 40, right: -70, rot: -30 },
          { w: 310, top: 118, right: -96, rot: -8 },
          { w: 244, top: 192, right: -84, rot: 16 },
        ].map((f, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: f.top,
              right: f.right,
              width: f.w,
              height: 20,
              borderRadius: 9999,
              backgroundImage:
                "linear-gradient(90deg, rgba(212,175,55,0), rgba(212,175,55,0.42))",
              transform: `rotate(${f.rot}deg)`,
              display: "flex",
            }}
          />
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

        {/* ─── Inhalt ─── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            paddingLeft: 104,
            paddingRight: 340,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 14, height: 14, backgroundColor: GOLD, transform: "rotate(45deg)", display: "flex" }} />
            <div style={{ fontSize: 25, letterSpacing: 7, color: GOLD_SOFT }}>
              {upper(BRANDING.company.legalName)}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", marginTop: 26 }}>
            <div style={{ fontSize: 100, fontWeight: 700, color: IVORY }}>Canlı</div>
            <div style={{ fontSize: 100, fontWeight: 700, color: GOLD }}>{`\u00a0Nail Studio`}</div>
          </div>

          <div style={{ marginTop: 30, fontSize: 36, color: "rgba(246,239,231,0.82)" }}>
            Tasarımını canlı oluştur — randevuna otomatik eklenir
          </div>

          {/* Echte Katalog-Umfänge */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 44 }}>
            {counts.map((c) => (
              <div
                key={c}
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: "rgba(212,175,55,0.5)",
                  color: GOLD_SOFT,
                  fontSize: 24,
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
