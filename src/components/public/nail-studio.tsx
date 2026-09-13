// ═══════════════════════════════════════════════════════════════════════════
//  CANLI NAIL STUDIO (V5.7) — interaktif tırnak tasarım stüdyosu (GİRİŞ GEREKMEZ)
//  Müşteri şekil · boy · renk · efekt · nail art seçer — SVG el önizlemesi
//  ANINDA güncellenir. «Bu tasarımla randevu al» ile randevu akışına bağlanır.
//  Tamamen SVG — resim yüklemesi yok, ultra hızlı, her ekrana uyumlu.
// ═══════════════════════════════════════════════════════════════════════════

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ChevronLeft, RotateCcw, CalendarCheck, Wand2, Info, MessageCircle, Share2, Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BRANDING } from "@/config/branding"
import { para } from "@/lib/salon"
import { useNailDesign } from "@/lib/nail-design-store"
import {
  NAIL_SHAPES, NAIL_LENGTHS, NAIL_COLORS, NAIL_FINISHES, NAIL_ARTS, NAIL_PRESETS,
  nailColorById, designLabel, designSurcharge, serializeDesign,
  type NailDesignConfig,
} from "@/lib/nail-design"

// ─── El geometrisi (SVG koordinatları) ───────────────────────────────────────
// rotate: yalnızca baş parmak eğimli — opsiyonel alan (union-access TS2339 için açık tip şart)
type Finger = { id: string; cx: number; topY: number; w: number; scale: number; rotate?: number }
const FINGERS: readonly Finger[] = [
  { id: "serce",  cx: 263, topY: 122, w: 25, scale: 0.70 },
  { id: "yuzuk",  cx: 222, topY: 88,  w: 29, scale: 0.92 },
  { id: "orta",   cx: 181, topY: 74,  w: 30, scale: 1.00 },
  { id: "isaret", cx: 140, topY: 92,  w: 28, scale: 0.86 },
  { id: "bas",    cx: 92,  topY: 172, w: 31, scale: 0.80, rotate: -26 },
] as const

const PALM = { x: 118, y: 196, w: 158, h: 96, r: 34 }

/** Boya göre tırnak yüksekliği (orta parmak ölçeği). */
const LENGTH_H: Record<string, number> = { kisa: 24, orta: 34, uzun: 46 }

/** Tırnak şekli — SVG path üretici. (y0 = kütikül çizgisi, uç yukarı) */
function nailPath(shape: string, cx: number, y0: number, w: number, h: number): string {
  const hw = w / 2
  const top = y0 - h
  const cuticle = `M ${cx - hw} ${y0} Q ${cx} ${y0 + 7} ${cx + hw} ${y0}`
  switch (shape) {
    case "kare":
      return `${cuticle} L ${cx + hw} ${top + 7} Q ${cx + hw} ${top} ${cx + hw - 7} ${top} L ${cx - hw + 7} ${top} Q ${cx - hw} ${top} ${cx - hw} ${top + 7} Z`
    case "yuvarlak":
      return `${cuticle} L ${cx + hw} ${top + hw} Q ${cx + hw * 0.72} ${top} ${cx} ${top} Q ${cx - hw * 0.72} ${top} ${cx - hw} ${top + hw} Z`
    case "oval":
      return `${cuticle} L ${cx + hw} ${top + h * 0.38} Q ${cx + hw * 0.9} ${top} ${cx} ${top} Q ${cx - hw * 0.9} ${top} ${cx - hw} ${top + h * 0.38} Z`
    case "badem":
      return `${cuticle} L ${cx + hw} ${top + h * 0.52} Q ${cx + hw * 0.82} ${top + h * 0.1} ${cx} ${top} Q ${cx - hw * 0.82} ${top + h * 0.1} ${cx - hw} ${top + h * 0.52} Z`
    case "stiletto":
      return `${cuticle} L ${cx + hw * 0.96} ${top + h * 0.6} Q ${cx + hw * 0.3} ${top + h * 0.18} ${cx} ${top} Q ${cx - hw * 0.3} ${top + h * 0.18} ${cx - hw * 0.96} ${top + h * 0.6} Z`
    case "ballerina":
      return `${cuticle} L ${cx + hw} ${top + h * 0.42} L ${cx + hw * 0.52} ${top} L ${cx - hw * 0.52} ${top} L ${cx - hw} ${top + h * 0.42} Z`
    default:
      return `${cuticle} L ${cx + hw} ${top + hw} Q ${cx} ${top} ${cx - hw} ${top + hw} Z`
  }
}

/** Rengi koyulaştırır (ombre ucu için). */
function shade(hex: string, f: number): string {
  const n = hex.replace("#", "")
  const r = Math.round(parseInt(n.slice(0, 2), 16) * f)
  const g = Math.round(parseInt(n.slice(2, 4), 16) * f)
  const b = Math.round(parseInt(n.slice(4, 6), 16) * f)
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`
}

// Deterministik "rastgele" — her render'da aynı deseni üretir
const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1) * 43758.5453
  return x - Math.floor(x)
}

// ─── Tek bir tırnağın çizimi (temel + efekt + nail art) ─────────────────────
function Nail({
  fi, cx, topY, w, scale, rotate, cfg, uid,
}: {
  fi: number; cx: number; topY: number; w: number; scale: number; rotate?: number
  cfg: NailDesignConfig; uid: string
}) {
  // Fallback «orta»: DB/Store'dan bozuk boy gelirse NaN yerine güvenli boy (SVG paths asla NaN olmasın)
  const h = Math.round((LENGTH_H[cfg.length] ?? LENGTH_H.orta) * scale)
  const color = nailColorById(cfg.color).hex
  const dark = shade(color, 0.55)
  const lighter = shade(color, 1.25)
  const y0 = topY + h // kütikül
  const path = nailPath(cfg.shape, cx, y0, w, h)
  const clipId = `${uid}-clip-${fi}`
  const hw = w / 2
  const top = y0 - h

  return (
    <g transform={rotate ? `rotate(${rotate} ${cx} ${y0 - h * 0.4})` : undefined}>
      <defs>
        <clipPath id={clipId}><path d={path} /></clipPath>
        <linearGradient id={`${uid}-ombre-${fi}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="45%" stopColor={dark} stopOpacity="0.35" />
          <stop offset="100%" stopColor={dark} stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={`${uid}-krom-${fi}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#e8e2d6" stopOpacity="0.35" />
          <stop offset="52%" stopColor="#fff7e0" stopOpacity="0.85" />
          <stop offset="75%" stopColor="#b8ab90" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fffdf5" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id={`${uid}-sedef-${fi}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe9ef" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#fff4d6" stopOpacity="0.25" />
          <stop offset="65%" stopColor="#f9e0c8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fff9ea" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id={`${uid}-parlak-${fi}`} cx="0.32" cy="0.22" r="0.75">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-inci-${fi}`} cx="0.35" cy="0.3" r="0.9">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#efe6da" />
          <stop offset="100%" stopColor="#cbb89f" />
        </radialGradient>
      </defs>

      {/* Temel renk */}
      <path d={path} fill={color} />

      <g clipPath={`url(#${clipId})`}>
        {/* Efekt katmanları */}
        {cfg.finish === "parlak" && (
          <path d={path} fill={`url(#${uid}-parlak-${fi})`} />
        )}
        {cfg.finish === "kedi-gozu" && (
          <>
            <rect x={cx - hw} y={top} width={w} height={h} fill={dark} opacity="0.45" />
            <rect
              x={cx - hw} y={top - 6} width={w} height={h + 12}
              fill={`url(#${uid}-parlak-${fi})`}
              transform={`rotate(-28 ${cx} ${y0 - h * 0.45})`}
            />
            <ellipse cx={cx} cy={y0 - h * 0.45} rx={w * 0.55} ry={h * 0.3} fill="#ffffff" opacity="0.3" transform={`rotate(-24 ${cx} ${y0 - h * 0.45})`} />
          </>
        )}
        {cfg.finish === "sim" && (
          <g>
            {Array.from({ length: 11 }).map((_, i) => {
              const rx = (rnd(fi * 31 + i) - 0.5) * w * 0.9
              const ry = (rnd(fi * 57 + i * 3) - 0.5) * h * 0.85
              const r = 0.7 + rnd(fi + i * 7) * 1.3
              return <circle key={i} cx={cx + rx} cy={top + h * 0.5 + ry} r={r} fill={i % 3 === 0 ? "#e8c66a" : "#ffffff"} opacity={0.5 + rnd(i + fi) * 0.5} />
            })}
          </g>
        )}
        {cfg.finish === "krom" && (
          <path d={path} fill={`url(#${uid}-krom-${fi})`} opacity="0.75" />
        )}
        {cfg.finish === "sedefli" && (
          <path d={path} fill={`url(#${uid}-sedef-${fi})`} />
        )}

        {/* Nail art katmanları */}
        {cfg.art === "ombre" && (
          <rect x={cx - hw} y={top} width={w} height={h} fill={`url(#${uid}-ombre-${fi})`} />
        )}
        {cfg.art === "french" && (
          <>
            <ellipse cx={cx} cy={top} rx={hw * 1.35} ry={h * 0.34} fill="#f8f3ec" />
            <ellipse cx={cx} cy={top} rx={hw * 1.35} ry={h * 0.34} fill="none" stroke="#d4af37" strokeOpacity="0.35" strokeWidth="0.7" />
          </>
        )}
        {cfg.art === "altin-folyo" && (
          <g>
            {Array.from({ length: 6 }).map((_, i) => {
              const fx = cx + (rnd(fi * 13 + i) - 0.5) * w * 0.8
              const fy = top + 4 + rnd(fi * 7 + i * 5) * (h - 9)
              const s = 1.6 + rnd(i * 3 + fi) * 2.4
              return (
                <path
                  key={i}
                  d={`M ${fx} ${fy} L ${fx + s} ${fy - s * 0.6} L ${fx + s * 1.7} ${fy + s * 0.2} L ${fx + s * 0.7} ${fy + s} Z`}
                  fill={i % 2 === 0 ? "#d4af37" : "#e8c66a"}
                  opacity="0.9"
                />
              )
            })}
          </g>
        )}
        {cfg.art === "deniz-kabugu" && (
          <g opacity="0.9">
            {[0.9, 0.65, 0.4].map((f, i) => (
              <path
                key={i}
                d={`M ${cx - hw * 0.8 * f} ${top + h * 0.34} Q ${cx} ${top + h * 0.34 - h * 0.34 * f} ${cx + hw * 0.8 * f} ${top + h * 0.34}`}
                fill="none"
                stroke="#fdf6ea"
                strokeWidth="1.4"
                strokeOpacity={0.85 - i * 0.15}
              />
            ))}
            <ellipse cx={cx} cy={top + h * 0.2} rx={hw * 0.6} ry={h * 0.16} fill={`url(#${uid}-sedef-${fi})`} />
          </g>
        )}
        {cfg.art === "inci-tas" && (
          <g>
            {[-0.45, 0.05, 0.5].map((f, i) => (
              <circle key={`p${i}`} cx={cx + w * f} cy={top + h * 0.62} r={2.1} fill={`url(#${uid}-inci-${fi})`} stroke="#c9a86a" strokeWidth="0.4" />
            ))}
            {[-0.2, 0.3].map((f, i) => (
              <path
                key={`t${i}`}
                d={`M ${cx + w * f} ${top + h * 0.34 - 2} L ${cx + w * f + 2} ${top + h * 0.34} L ${cx + w * f} ${top + h * 0.34 + 2} L ${cx + w * f - 2} ${top + h * 0.34} Z`}
                fill="#f3e9dc"
                stroke="#d4af37"
                strokeWidth="0.5"
              />
            ))}
          </g>
        )}
        {cfg.art === "nar-cicegi" && (fi === 2 || fi === 1) && (
          <g>
            {Array.from({ length: 5 }).map((_, i) => {
              const ang = (i * 72 * Math.PI) / 180
              const px = cx + Math.cos(ang) * 4.4
              const py = top + h * 0.45 + Math.sin(ang) * 4.4
              return <ellipse key={i} cx={px} cy={py} rx="3.4" ry="2.1" fill="#fdf1f1" opacity="0.95" transform={`rotate(${i * 72} ${px} ${py})`} />
            })}
            <circle cx={cx} cy={top + h * 0.45} r="1.7" fill="#d4af37" />
          </g>
        )}
        {cfg.art === "dantel" && (
          <g stroke="#fdf6ea" fill="none" strokeWidth="0.9" opacity="0.85">
            <path d={`M ${cx - hw} ${top + h * 0.55} Q ${cx - hw * 0.5} ${top + h * 0.38} ${cx} ${top + h * 0.55} Q ${cx + hw * 0.5} ${top + h * 0.72} ${cx + hw} ${top + h * 0.55}`} />
            <path d={`M ${cx - hw} ${top + h * 0.74} Q ${cx - hw * 0.5} ${top + h * 0.58} ${cx} ${top + h * 0.74} Q ${cx + hw * 0.5} ${top + h * 0.9} ${cx + hw} ${top + h * 0.74}`} />
            {[-0.5, 0, 0.5].map((f, i) => (
              <circle key={i} cx={cx + w * f} cy={top + h * 0.64} r="0.8" fill="#fdf6ea" stroke="none" />
            ))}
          </g>
        )}

        {/* Parlak vurgu (mat hariç) */}
        {cfg.finish !== "mat" && cfg.finish !== "krom" && (
          <ellipse cx={cx - w * 0.22} cy={top + h * 0.24} rx={w * 0.16} ry={h * 0.14} fill="#ffffff" opacity="0.5" transform={`rotate(-18 ${cx} ${top + h * 0.24})`} />
        )}
      </g>

      {/* Tırnak konturu — zarif altın çizgi */}
      <path d={path} fill="none" stroke="#000000" strokeOpacity="0.18" strokeWidth="0.6" />
    </g>
  )
}

// ─── El önizlemesi ───────────────────────────────────────────────────────────
function HandPreview({ cfg }: { cfg: NailDesignConfig }) {
  const uid = "nls"
  return (
    <svg
      viewBox="0 0 370 320"
      className="h-auto w-full max-w-[380px] drop-shadow-[0_18px_35px_rgba(0,0,0,0.35)]"
      role="img"
      aria-label={`Canlı tırnak önizlemesi: ${designLabel(cfg)}`}
    >
      <defs>
        <linearGradient id={`${uid}-skin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eec9ac" />
          <stop offset="100%" stopColor="#d9ac89" />
        </linearGradient>
        <linearGradient id={`${uid}-skin2`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e7bf9f" />
          <stop offset="100%" stopColor="#d4a37e" />
        </linearGradient>
      </defs>

      {/* Parmaklar */}
      {FINGERS.map((f, fi) => {
        const h = Math.round(LENGTH_H[cfg.length] * f.scale)
        const w = f.w
        return (
          <g key={f.id} transform={f.rotate ? `rotate(${f.rotate} ${f.cx} ${f.topY + 70})` : undefined}>
            <rect
              x={f.cx - w / 2} y={f.topY} width={w} height={210 - f.topY}
              rx={Math.min(12, w / 2.4)} fill={`url(#${uid}-skin)`}
            />
          </g>
        )
      })}

      {/* Avuç */}
      <g>
        <rect x={PALM.x} y={PALM.y} width={PALM.w} height={PALM.h} rx={PALM.r} fill={`url(#${uid}-skin2)`} />
        {/* Baş parmak avuç bağlantısı */}
        <ellipse cx={112} cy={222} rx={30} ry={24} fill={`url(#${uid}-skin2)`} />
        {/* Bilek */}
        <rect x={148} y={272} width={98} height={44} rx={20} fill={`url(#${uid}-skin2)`} />
        {/* Zarif altın yüzük — yüzük parmağı (detay) */}
        <rect x={210} y={150} width={24} height={5.5} rx={2.7} fill="#d4af37" opacity="0.9" />
      </g>

      {/* Tırnaklar (parmakların ÜZERİNE) */}
      {FINGERS.map((f, fi) => (
        <Nail
          key={f.id}
          fi={fi}
          cx={f.cx}
          topY={f.topY}
          w={f.w - 5}
          scale={f.scale}
          rotate={f.rotate}
          cfg={cfg}
          uid={uid}
        />
      ))}
    </svg>
  )
}

// ─── Seçim çipi ──────────────────────────────────────────────────────────────
function Chip({
  active, onClick, children, title,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "mk-focus rounded-full border px-3.5 py-2 text-xs font-bold transition-all",
        active
          ? "mk-gold-glow border-primary bg-primary/20 text-brand-text"
          : "border-border/70 bg-secondary/30 text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  ANA BİLEŞEN
// ═══════════════════════════════════════════════════════════════════════════
export function NailStudio({
  onBack, onBook, onStaffLogin,
}: {
  onBack: () => void
  onBook: () => void
  onStaffLogin: () => void
}) {
  const { pending, setPending, clearPending } = useNailDesign()
  const [cfg, setCfg] = useState<NailDesignConfig>(pending ?? NAIL_PRESETS[0].config)
  const [shared, setShared] = useState(false)

  // Temel hizmet fiyatı (kisa → jel manikür, orta/uzun → jel uzatma)
  const { data: servicesData } = useQuery({
    queryKey: ["salon-services-studio"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/services")
      if (!res.ok) throw new Error("db")
      return (await res.json()) as { services: Array<{ id: string; name: string; category: string; priceChf: number; durationMin: number }> }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  })
  const services = servicesData?.services ?? []
  const baseService = useMemo(() => {
    if (services.length === 0) return null
    const tirnak = services.filter((s) => s.category === "tirnak")
    const pick = (name: string) => tirnak.find((s) => s.name.includes(name))
    return cfg.length === "kisa" ? (pick("Manikür") ?? tirnak[0]) : (pick("Uzatma") ?? tirnak[0])
  }, [services, cfg.length])

  const surcharge = designSurcharge(cfg)
  const estimate = baseService ? baseService.priceChf + surcharge : null

  const patch = (p: Partial<NailDesignConfig>) => setCfg((c) => ({ ...c, ...p }))

  const label = designLabel(cfg)

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Merhaba! Canlı Nail Studio'da şu tasarımı oluşturdum: 💅 ${label} — Bu tasarım için randevu almak istiyorum.`,
    )
    window.open(`https://wa.me/${(BRANDING.company.whatsapp ?? BRANDING.company.phone).replace(/\D/g, "")}?text=${text}`, "_blank", "noopener,noreferrer")
  }

  // Paylaş geri bildirimi zamanlayıcısı — bileşen kaldırılırsa temizle
  const shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (shareTimer.current) clearTimeout(shareTimer.current)
  }, [])

  const shareCopy = async () => {
    try {
      await navigator.clipboard.writeText(`💅 Canlı Nail Studio tasarımım: ${label} — ${window.location.origin}/nailstudio`)
      setShared(true)
      if (shareTimer.current) clearTimeout(shareTimer.current)
      shareTimer.current = setTimeout(() => setShared(false), 2000)
    } catch { /* pano yoksa sessizce yut */ }
  }

  const bookWithDesign = () => {
    setPending(cfg)
    onBook()
  }

  return (
    <div className="mk-velvet min-h-screen bg-background pb-24 md:pb-0">
      {/* Üst bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mk-gold-line h-[2px] w-full" />
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <button
            onClick={onBack}
            className="mk-focus flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Geri"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="mk-gold-glow flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/40 bg-primary/8">
            <Wand2 className="h-4 w-4 text-brand-text" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="mk-display truncate text-lg font-bold">Canlı Nail Studio</h1>
            <div className="truncate text-[11px] text-muted-foreground">Tasarımını canlı oluştur — randevuna otomatik eklenir</div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1.5 text-[10px] font-bold text-brand-text sm:flex">
            <span className="mk-diamond" /> Canlı önizleme
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* ─── Sol: Canlı önizleme ─── */}
          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="mk-card mk-anim-up relative max-w-full overflow-hidden rounded-2xl p-6">
              <div className="pointer-events-none absolute -top-16 right-0 h-48 w-48 rounded-full opacity-[0.08]" style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 65%)" }} aria-hidden="true" />
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Canlı Önizleme</span>
                <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[9px] font-bold text-brand-text">
                  <span className="mk-anim-blink h-1.5 w-1.5 rounded-full bg-primary" /> ANINDA
                </span>
              </div>
              <div className="flex justify-center">
                <HandPreview cfg={cfg} />
              </div>
              {/* Özet */}
              <div className="mt-4 min-w-0 rounded-xl border border-border/70 bg-secondary/40 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Tasarım özeti</div>
                <p className="mk-display mt-1 text-sm font-bold text-foreground">💅 {label}</p>
                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-sm">
                  <span className="text-muted-foreground">Tahmini ücret</span>
                  <span className="mk-display text-base font-bold text-brand-text">
                    {estimate != null ? `≈ ${para(estimate)}` : "—"}
                  </span>
                </div>
                {baseService && (
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{baseService.name} · ~{baseService.durationMin} dk</span>
                    {surcharge > 0 && <span>+ {para(surcharge)} tasarım</span>}
                  </div>
                )}
                <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground">
                  <Info className="mt-0.5 h-3 w-3 shrink-0 text-brand-text/70" />
                  Kesin ücret randevu onayında stüdyo tarafından netleştirilir.
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <Button onClick={bookWithDesign} className="mk-gold-glow mk-btn-lift h-12 flex-1 rounded-full bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90">
                  <CalendarCheck className="mr-1.5 h-4 w-4" /> Bu Tasarımla Randevu Al
                </Button>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <Button onClick={shareWhatsApp} variant="outline" className="h-10 rounded-full border-emerald-700/50 text-xs font-semibold text-emerald-400 hover:bg-emerald-950/30">
                  <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> WhatsApp
                </Button>
                <Button onClick={shareCopy} variant="outline" className="h-10 rounded-full border-border/70 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground">
                  {shared ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="mr-1.5 h-3.5 w-3.5" />} {shared ? "Kopyalandı" : "Paylaş"}
                </Button>
              </div>
            </div>
          </div>

          {/* ─── Sağ: seçenekler ─── */}
          <div className="min-w-0 space-y-6">
            {/* Hazır şablonlar */}
            <section aria-label="Hazır şablonlar" className="mk-anim-in">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="mk-display text-sm font-bold text-foreground">Hazır Şablonlar</h2>
                <div className="mk-gold-line mx-3 h-px flex-1" aria-hidden="true" />
                <button
                  onClick={() => setCfg(NAIL_PRESETS[0].config)}
                  className="mk-focus flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" /> Sıfırla
                </button>
              </div>
              <div className="mk-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                {NAIL_PRESETS.map((p) => {
                  // Kanonik serileştirme ile karşılaştır (JSON.stringify key-sırasına kırılgandır)
                  const active = serializeDesign(p.config) === serializeDesign(cfg)
                  return (
                    <button
                      key={p.label}
                      onClick={() => setCfg(p.config)}
                      className={cn(
                        "mk-focus flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition-all",
                        active
                          ? "mk-gold-glow border-primary bg-primary/20 text-brand-text"
                          : "border-border/70 bg-secondary/30 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-white/20"
                        style={{ background: nailColorById(p.config.color).hex }}
                        aria-hidden="true"
                      />
                      {p.emoji} {p.label}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Şekil */}
            <section aria-label="Tırnak şekli" className="mk-anim-in">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="mk-display text-sm font-bold text-foreground">1 · Şekil</h2>
                <div className="mk-gold-line h-px flex-1" aria-hidden="true" />
              </div>
              <div className="flex flex-wrap gap-2">
                {NAIL_SHAPES.map((s) => (
                  <Chip key={s.id} active={cfg.shape === s.id} onClick={() => patch({ shape: s.id })} title={s.hint}>
                    {s.label}
                  </Chip>
                ))}
              </div>
            </section>

            {/* Boy */}
            <section aria-label="Tırnak boyu" className="mk-anim-in">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="mk-display text-sm font-bold text-foreground">2 · Boy</h2>
                <div className="mk-gold-line h-px flex-1" aria-hidden="true" />
              </div>
              <div className="flex flex-wrap gap-2">
                {NAIL_LENGTHS.map((l) => (
                  <Chip key={l.id} active={cfg.length === l.id} onClick={() => patch({ length: l.id })} title={l.hint}>
                    {l.label}
                  </Chip>
                ))}
              </div>
            </section>

            {/* Renk */}
            <section aria-label="Renk" className="mk-anim-in">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="mk-display text-sm font-bold text-foreground">
                  3 · Renk <span className="ml-1 text-[11px] font-normal text-muted-foreground">— {nailColorById(cfg.color).label}</span>
                </h2>
                <div className="mk-gold-line h-px flex-1" aria-hidden="true" />
              </div>
              <div className="flex flex-wrap gap-2.5">
                {NAIL_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => patch({ color: c.id })}
                    title={c.label}
                    aria-label={c.label}
                    aria-pressed={cfg.color === c.id}
                    className={cn(
                      "mk-focus relative h-10 w-10 rounded-full border-2 transition-transform hover:scale-110",
                      cfg.color === c.id ? "border-primary ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : "border-white/20",
                    )}
                    style={{ background: c.hex }}
                  >
                    {cfg.color === c.id && <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </section>

            {/* Efekt */}
            <section aria-label="Efekt" className="mk-anim-in">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="mk-display text-sm font-bold text-foreground">4 · Efekt</h2>
                <div className="mk-gold-line h-px flex-1" aria-hidden="true" />
              </div>
              <div className="flex flex-wrap gap-2">
                {NAIL_FINISHES.map((f) => (
                  <Chip key={f.id} active={cfg.finish === f.id} onClick={() => patch({ finish: f.id })} title={f.hint}>
                    {f.label}{f.surcharge > 0 && <span className="ml-1 text-[9px] font-semibold opacity-70">+{f.surcharge}₺</span>}
                  </Chip>
                ))}
              </div>
            </section>

            {/* Nail Art */}
            <section aria-label="Nail art" className="mk-anim-in">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="mk-display text-sm font-bold text-foreground">5 · Nail Art</h2>
                <div className="mk-gold-line h-px flex-1" aria-hidden="true" />
              </div>
              <div className="flex flex-wrap gap-2">
                {NAIL_ARTS.map((a) => (
                  <Chip key={a.id} active={cfg.art === a.id} onClick={() => patch({ art: a.id })} title={a.hint}>
                    {a.label}{a.surcharge > 0 && <span className="ml-1 text-[9px] font-semibold opacity-70">+{a.surcharge}₺</span>}
                  </Chip>
                ))}
              </div>
            </section>

            {/* Alt CTA (mobil) */}
            <div className="pt-2 lg:hidden">
              <Button onClick={bookWithDesign} className="mk-gold-glow h-12 w-full rounded-full bg-primary text-sm font-bold text-primary-foreground">
                <CalendarCheck className="mr-1.5 h-4 w-4" /> Bu Tasarımla Randevu Al
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
