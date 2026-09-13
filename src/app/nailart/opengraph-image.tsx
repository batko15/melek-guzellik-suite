// ═══════════════════════════════════════════════════════════════════════════
//  OG-Image (/nailart) — 1200×630, next/og. Variante mit «Tırnak Sanatı
//  Galerisi»-Titel, links gespiegelter Flügel-Fächer, echte Technik-Chips
//  (Katalog-Labels aus der Nail-Art-Galerie — nichts erfundenes).
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"

export const alt = `Tırnak Sanatı Galerisi — ${BRAND_DISPLAY.part1} ${BRAND_DISPLAY.part2}`
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
          fontFamily: "Inter",
          backgroundColor: VELVET,
          backgroundImage: `linear-gradient(225deg, ${BURGUNDY} 0%, ${VELVET} 52%, #120d0f 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Schimmer */}
        <div
          style={{
            position: "absolute",
            left: -240,
            top: -280,
            width: 880,
            height: 740,
            borderRadius: 9999,
            backgroundImage:
              "radial-gradient(closest-side, rgba(122,31,43,0.5), rgba(122,31,43,0))",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -260,
            bottom: -320,
            width: 760,
            height: 640,
            borderRadius: 9999,
            backgroundImage:
              "radial-gradient(closest-side, rgba(212,175,55,0.16), rgba(212,175,55,0))",
            display: "flex",
          }}
        />

        {/* ─── Flügel-Fächer (links, gespiegelt) ─── */}
        {[
          { w: 430, top: 66, left: -84, rot: 34 },
          { w: 356, top: 152, left: -108, rot: 12 },
          { w: 292, top: 236, left: -96, rot: -12 },
          { w: 224, top: 312, left: -66, rot: -36 },
        ].map((f, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: f.top,
              left: f.left,
              width: f.w,
              height: 22,
              borderRadius: 9999,
              backgroundImage:
                "linear-gradient(90deg, rgba(212,175,55,0.42), rgba(212,175,55,0))",
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

        {/* ─── Inhalt (rechts ausgerichtet, sonst wie Root gespiegelt) ─── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            paddingLeft: 360,
            paddingRight: 104,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ fontSize: 25, letterSpacing: 7, color: GOLD_SOFT }}>
              {upper(BRANDING.company.legalName)}
            </div>
            <div style={{ width: 14, height: 14, backgroundColor: GOLD, transform: "rotate(45deg)", display: "flex" }} />
          </div>

          <div style={{ display: "flex", alignItems: "baseline", marginTop: 26 }}>
            <div style={{ fontSize: 92, fontWeight: 700, color: IVORY }}>Tırnak Sanatı</div>
            <div style={{ fontSize: 92, fontWeight: 700, color: GOLD }}>{`\u00a0Galerisi`}</div>
          </div>

          {/* Echte Technik-Chips (Nail-Art-Katalog) */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 40 }}>
            {["Kedi Gözü", "Ombre", "Altın Folyo", "İnci & Taş"].map((c) => (
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

        {/* Fußzeile */}
        <div
          style={{
            position: "absolute",
            right: 104,
            bottom: 74,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 22px",
              borderRadius: 9999,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "rgba(212,175,55,0.45)",
              color: GOLD_SOFT,
              fontSize: 24,
            }}
          >
            Beğendiğin tasarımı online randevuyla iste
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  )
}
