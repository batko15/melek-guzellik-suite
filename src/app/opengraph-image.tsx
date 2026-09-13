// ═══════════════════════════════════════════════════════════════════════════
//  OG-Image (Root) — 1200×630, next/og (Next 16 eingebaut, kein Paket nötig)
//  Marken-Design: dunkler Samt (Burgundy-Schwarz) + Champagner-Gold,
//  Engel-Flügel-Silhouette aus schlichten gerundeten Formen (Satori-divs).
//  Inter (public/fonts) als Marken-Font — volle türkische Glyphen.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"

export const alt = `Melek'çe Güzellik — ${BRANDING.brand.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Font: Inter (public/fonts, voller türkischer Glyphen-Satz) — die von next/og
// gebündelte Standard-Schrift (Noto Sans, latin-only) fehlen ş/ğ/İ (Tofu).
// Muster laut next/og-Doku: readFileSync über process.cwd() — wird von Next
// gebuildet/getraced, kein Netzwerk-Fetch nötig.
const interRegular = readFileSync(join(process.cwd(), "public/fonts/Inter-400.ttf"))
const interBold = readFileSync(join(process.cwd(), "public/fonts/Inter-700.ttf"))
const fonts = [
  { name: "Inter", data: interRegular, weight: 400 as const, style: "normal" as const },
  { name: "Inter", data: interBold, weight: 700 as const, style: "normal" as const },
]

// Türkisch-korrektes Uppercase (JS-toUpperCase macht aus «i» fälschlich «I» statt «İ»)
const upper = (s: string) => s.toLocaleUpperCase("tr-TR")

// Markenfarben (aus src/app/globals.css abgeleitet: Samt #151210 + Gold oklch(0.76 0.11 86))
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
          backgroundImage: `linear-gradient(135deg, ${BURGUNDY} 0%, ${VELVET} 52%, #120d0f 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Sanftes Burgundy-Schimmern oben rechts + Goldschimmer unten links */}
        <div
          style={{
            position: "absolute",
            right: -220,
            top: -260,
            width: 900,
            height: 760,
            borderRadius: 9999,
            backgroundImage:
              "radial-gradient(closest-side, rgba(122,31,43,0.5), rgba(122,31,43,0))",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -260,
            bottom: -320,
            width: 760,
            height: 640,
            borderRadius: 9999,
            backgroundImage:
              "radial-gradient(closest-side, rgba(212,175,55,0.16), rgba(212,175,55,0))",
            display: "flex",
          }}
        />

        {/* ─── Engel-Flügel-Silhouette (rechts) — Fächer aus gerundeten Federn ─── */}
        {[
          { w: 430, top: 66, right: -84, rot: -34 },
          { w: 356, top: 152, right: -108, rot: -12 },
          { w: 292, top: 236, right: -96, rot: 12 },
          { w: 224, top: 312, right: -66, rot: 36 },
        ].map((f, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: f.top,
              right: f.right,
              width: f.w,
              height: 22,
              borderRadius: 9999,
              backgroundImage:
                "linear-gradient(90deg, rgba(212,175,55,0), rgba(212,175,55,0.42))",
              transform: `rotate(${f.rot}deg)`,
              display: "flex",
            }}
          />
        ))}

        {/* ─── Gold-Rahmen ─── */}
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
            paddingRight: 360,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                backgroundColor: GOLD,
                transform: "rotate(45deg)",
                display: "flex",
              }}
            />
            <div
              style={{
                fontSize: 25,
                letterSpacing: 7,
                color: GOLD_SOFT,
              }}
            >
              {upper(BRANDING.brand.tagline)}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginTop: 26,
            }}
          >
            <div style={{ fontSize: 96, fontWeight: 700, color: IVORY, letterSpacing: 1 }}>
              {BRAND_DISPLAY.part1}
            </div>
            <div style={{ fontSize: 96, fontWeight: 700, color: GOLD, letterSpacing: 1 }}>
              {`\u00a0${BRAND_DISPLAY.part2}`}
            </div>
          </div>

          {/* Zierlinie mit Rauten */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 34 }}>
            <div style={{ width: 150, height: 2, backgroundColor: "rgba(212,175,55,0.55)", display: "flex" }} />
            <div style={{ width: 10, height: 10, backgroundColor: GOLD, transform: "rotate(45deg)", display: "flex" }} />
            <div style={{ width: 150, height: 2, backgroundColor: "rgba(212,175,55,0.55)", display: "flex" }} />
          </div>

          <div
            style={{
              marginTop: 34,
              fontSize: 38,
              color: "rgba(246,239,231,0.82)",
            }}
          >
            {BRANDING.brand.slogan}
          </div>
        </div>

        {/* ─── Fußzeile (absolut, unten links) ─── */}
        <div
          style={{
            position: "absolute",
            left: 104,
            bottom: 74,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {["Gelibolu · Çanakkale", `${BRANDING.brand.since}'den beri`].map((chip) => (
            <div
              key={chip}
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
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts },
  )
}
