// ═══════════════════════════════════════════════════════════════════════════
//  GET /api/v1/og?design=<serializeDesign-JSON> — dynamische Design-OG-Card
//  (V5.7 Canlı Nail Studio). Geteilte Studio-Links hängen ?design=… an
//  (serializeDesign, kompakt ~80 Zeichen) → /nailstudio generateMetadata
//  verweist für den og:image auf diese Route → WhatsApp/X zeigt das gewählte
//  Design als Bild.
//  Robustheit: ungültiges/fehlendes/überlanges design → elegante Default-OG
//  (kein 500!), parseDesign validiert alle Werte gegen den Katalog.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { BRANDING, BRAND_DISPLAY } from "@/config/branding"
import {
  DEFAULT_DESIGN,
  NAIL_SHAPES,
  NAIL_LENGTHS,
  NAIL_COLORS,
  NAIL_FINISHES,
  NAIL_ARTS,
  nailColorById,
  nailShapeLabel,
  nailLengthLabel,
  nailFinishLabel,
  nailArtLabel,
  parseDesign,
  type NailDesignConfig,
} from "@/lib/nail-design"

const size = { width: 1200, height: 630 } as const

// Inter aus public/fonts — volle türkische Glyphen (ş/ğ/İ fehlen im
// latin-only Standard-Font von next/og → Tofu-Boxen).
// V6.0.1 BUGFIX: readFileSync ist FAULT-TOLERANT — fehlt eine Font-Datei
// im Deploy-Bundle, fällt die Route auf den eingebauten Font zurück
// (schlechtere Türkisch-Glyphen, aber KEIN 500 mehr beim Modul-Init).
function loadFont(file: string): Buffer | null {
  try {
    return readFileSync(join(process.cwd(), "public/fonts", file))
  } catch {
    return null
  }
}
const interRegular = loadFont("Inter-400.ttf")
const interBold = loadFont("Inter-700.ttf")
const fonts = [
  ...(interRegular ? [{ name: "Inter", data: interRegular, weight: 400 as const, style: "normal" as const }] : []),
  ...(interBold ? [{ name: "Inter", data: interBold, weight: 700 as const, style: "normal" as const }] : []),
]
const upper = (s: string) => s.toLocaleUpperCase("tr-TR")

/** Gezeichneter Gold-Funke (✨-Ersatz — Emoji-Glyph fehlt in Text-Fonts). */
function Sparkle({ s = 40, color = GOLD }: { s?: number; color?: string }) {
  const bar = Math.round(s * 0.3)
  return (
    <div style={{ position: "relative", width: s, height: s, display: "flex" }}>
      <div
        style={{
          position: "absolute",
          left: (s - bar) / 2,
          top: 0,
          width: bar,
          height: s,
          borderRadius: bar,
          backgroundColor: color,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: (s - bar) / 2,
          width: s,
          height: bar,
          borderRadius: bar,
          backgroundColor: color,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: (s - bar) / 2 - 1,
          top: (s - bar) / 2 - 1,
          width: bar + 2,
          height: bar + 2,
          borderRadius: 9999,
          backgroundColor: color,
          display: "flex",
        }}
      />
    </div>
  )
}

const GOLD = "#d4af37"
const GOLD_SOFT = "#e9c766"
const IVORY = "#f6efe7"
const VELVET = "#150e10"
const BURGUNDY = "#2a1016"

/** Chip mit kleiner Beschriftung + Wert (optional Farbfeld). */
function Chip({ label, value, hex }: { label: string; value: string; hex?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 22px",
        borderRadius: 9999,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "rgba(212,175,55,0.5)",
        backgroundColor: "rgba(21,14,16,0.55)",
      }}
    >
      {hex ? (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9999,
            backgroundColor: hex,
            borderWidth: 2,
            borderStyle: "solid",
            borderColor: "rgba(246,239,231,0.55)",
            display: "flex",
          }}
        />
      ) : null}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 17, letterSpacing: 3, color: "rgba(246,239,231,0.6)" }}>
          {upper(label)}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: IVORY }}>{value}</div>
      </div>
    </div>
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get("design")
  // serializeDesign ist ~80 Zeichen — alles Deutlich Längere ist manipuliert.
  const cfg: NailDesignConfig | null = raw && raw.length > 0 && raw.length <= 512 ? parseDesign(raw) : null
  const color = nailColorById(cfg?.color ?? DEFAULT_DESIGN.color)

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
            right: -200,
            top: -260,
            width: 820,
            height: 700,
            borderRadius: 9999,
            backgroundImage:
              "radial-gradient(closest-side, rgba(122,31,43,0.5), rgba(122,31,43,0))",
            display: "flex",
          }}
        />

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

        {/* Flügel-Fächer oben rechts */}
        {[
          { w: 340, top: 44, right: -66, rot: -30 },
          { w: 278, top: 116, right: -90, rot: -8 },
          { w: 218, top: 184, right: -78, rot: 14 },
        ].map((f, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: f.top,
              right: f.right,
              width: f.w,
              height: 18,
              borderRadius: 9999,
              backgroundImage:
                "linear-gradient(90deg, rgba(212,175,55,0), rgba(212,175,55,0.42))",
              transform: `rotate(${f.rot}deg)`,
              display: "flex",
            }}
          />
        ))}

        {/* ─── Inhalt — V6.0.1: ABSOLUTE Positionierung (Satori legt
                Flex-Spalten sonst nebeneinander statt untereinander —
                Chips liefen über den rechten Rand) ─── */}
        <div
          style={{
            position: "absolute",
            left: 100,
            top: 140,
            width: 660,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 12, height: 12, backgroundColor: GOLD, transform: "rotate(45deg)", display: "flex" }} />
            <div style={{ fontSize: 22, letterSpacing: 6, color: GOLD_SOFT }}>
              {`${upper(`${BRAND_DISPLAY.part1} ${BRAND_DISPLAY.part2}`)} · Canlı Nail Studio`}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", marginTop: 22 }}>
            <div style={{ fontSize: 62, fontWeight: 700, color: IVORY }}>
              {cfg ? "Canlı Stüdyo'da tasarladım" : "Canlı Nail Studio"}
            </div>
            <div style={{ marginLeft: 16, display: "flex" }}>
              <Sparkle s={44} />
            </div>
          </div>

          {/* V6.0.1 KERNFIX: React-Fragmente (<>…) rendern Satori in einer
              unsichtbaren REIHE statt in der Spalte → beide Zwecke bekommen
              jetzt echte Column-Divs (beweislich korrekt gestapelt). */}
          {cfg ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ display: "flex", marginTop: 24, fontSize: 30, color: "rgba(246,239,231,0.82)" }}>
                {`${nailShapeLabel(cfg.shape)} · ${nailLengthLabel(cfg.length)} · ${color.label} · ${nailArtLabel(cfg.art)}`}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 34, width: 660 }}>
                <Chip label="Şekil" value={nailShapeLabel(cfg.shape)} />
                <Chip label="Boy" value={nailLengthLabel(cfg.length)} />
                <Chip label="Renk" value={color.label} hex={color.hex} />
                <Chip label="Efekt" value={nailFinishLabel(cfg.finish)} />
                <Chip label="Nail Art" value={nailArtLabel(cfg.art)} />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: "rgba(246,239,231,0.82)" }}>
                {`Tasarımını canlı oluştur — randevuna otomatik eklenir`}
              </div>
              <div style={{ display: "flex", marginTop: 36, fontSize: 26, color: GOLD_SOFT }}>
                {`${NAIL_SHAPES.length} Şekil · ${NAIL_LENGTHS.length} Boy · ${NAIL_COLORS.length} Renk · ${NAIL_FINISHES.length} Efekt · ${NAIL_ARTS.length} Nail Art`}
              </div>
            </div>
          )}
        </div>

        {/* ─── Rechtes Farbfeld-Panel (nur bei gültigem Design) ─── */}
        {cfg ? (
          <div
            style={{
              position: "absolute",
              right: 96,
              top: 120,
              width: 250,
              height: 400,
              borderRadius: 40,
              backgroundColor: color.hex,
              borderWidth: 3,
              borderStyle: "solid",
              borderColor: "rgba(212,175,55,0.65)",
              backgroundImage:
                "radial-gradient(circle at 28% 20%, rgba(255,255,255,0.35), rgba(255,255,255,0) 55%)",
              display: "flex",
            }}
          />
        ) : null}

        {/* ─── Fußzeile ─── */}
        <div
          style={{
            position: "absolute",
            left: 100,
            bottom: 70,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 26px",
              borderRadius: 9999,
              backgroundColor: GOLD,
              color: "#1a0d10",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            Bu tasarımla randevu al
          </div>
          {/* V6.0.1 BUGFIX: mehrere Text-Kinder ohne display:flex → Satori-500
              («Expected <div> to have explicit display:flex …») auf JEDEN Aufruf */}
          <div style={{ display: "flex", fontSize: 24, color: "rgba(246,239,231,0.6)" }}>
            {`${BRANDING.company.city.replace("17500 ", "")} · ${BRANDING.brand.since}'den beri`}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    },
  )
}
