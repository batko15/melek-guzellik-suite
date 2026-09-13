// ═══════════════════════════════════════════════════════════════════════════
//  CANLI NAIL STUDIO — Tasarım modeli & katalog (V5.7)
//  Müşteri sitede NAGEL TASARIMINI CANLI oluşturur:
//    Şekil · Boy · Renk · Efekt · Nail Art — SVG önizleme anında güncellenir.
//  Tasarım «randevu»ya bağlanır (Booking.design, JSON) — ekip portalında görünür.
// ═══════════════════════════════════════════════════════════════════════════

export type NailShape = "kare" | "yuvarlak" | "oval" | "badem" | "stiletto" | "ballerina"
export type NailLength = "kisa" | "orta" | "uzun"
export type NailFinish = "parlak" | "mat" | "kedi-gozu" | "sim" | "krom" | "sedefli"
export type NailArt = "yok" | "french" | "ombre" | "altin-folyo" | "deniz-kabugu" | "inci-tas" | "nar-cicegi" | "dantel"

export interface NailDesignConfig {
  shape: NailShape
  length: NailLength
  color: string // palet kimliği
  finish: NailFinish
  art: NailArt
}

// ─── Şekiller ────────────────────────────────────────────────────────────────
export const NAIL_SHAPES: Array<{ id: NailShape; label: string; hint: string }> = [
  { id: "kare", label: "Kare", hint: "Keskin ve modern" },
  { id: "yuvarlak", label: "Yuvarlak", hint: "Doğal ve zarif" },
  { id: "oval", label: "Oval", hint: "Klasik feminen" },
  { id: "badem", label: "Badem", hint: "En çok tercih edilen" },
  { id: "stiletto", label: "Stiletto", hint: "İddialı ve sivri" },
  { id: "ballerina", label: "Balerina", hint: "Kutyu — içe dönük uç" },
]

// ─── Boylar ──────────────────────────────────────────────────────────────────
export const NAIL_LENGTHS: Array<{ id: NailLength; label: string; hint: string }> = [
  { id: "kisa", label: "Kısa", hint: "Doğal tırnak boyu" },
  { id: "orta", label: "Orta", hint: "Günlük şıklık" },
  { id: "uzun", label: "Uzun", hint: "Etkileyici görünüm" },
]

// ─── Renk paleti (stüdyonun gerçek çalışma renkleri — markaya uygun sıcak tonlar) ──
export interface NailColor { id: string; label: string; hex: string }
export const NAIL_COLORS: NailColor[] = [
  { id: "bordo", label: "Bordo", hex: "#7a1f2b" },
  { id: "koyu-bordo", label: "Koyu Bordo", hex: "#521320" },
  { id: "pudra-pembe", label: "Pudra Pembe", hex: "#e8b4b8" },
  { id: "gul-pembe", label: "Gül Pembe", hex: "#dd7d94" },
  { id: "nude", label: "Nude", hex: "#d9b49b" },
  { id: "terracotta", label: "Terracotta", hex: "#c07049" },
  { id: "sampanya", label: "Şampanya Altını", hex: "#d4af37" },
  { id: "altin", label: "24K Altın", hex: "#e3b341" },
  { id: "beyaz", label: "Süt Beyazı", hex: "#f6efe7" },
  { id: "krem", label: "Krem", hex: "#f0e2cc" },
  { id: "siyah", label: "Siyah", hex: "#232020" },
  { id: "duman", label: "Duman Grisi", hex: "#8d8681" },
  { id: "tereyagi", label: "Tereyağı Sarısı", hex: "#eed58b" },
  { id: "nar", label: "Nar Kırmızısı", hex: "#c14a4a" },
  { id: "zeytin", label: "Zeytin Yeşili", hex: "#8a8b5c" },
  { id: "kahve", label: "Kahve", hex: "#6f4a30" },
]

// ─── Efektler (bitiş) ────────────────────────────────────────────────────────
export const NAIL_FINISHES: Array<{ id: NailFinish; label: string; hint: string; surcharge: number }> = [
  { id: "parlak", label: "Parlak", hint: "Yüksek parlaklık", surcharge: 0 },
  { id: "mat", label: "Mat", hint: "İpeksi mat bitiş", surcharge: 0 },
  { id: "kedi-gozu", label: "Kedi Gözü", hint: "Manyetik ışık çizgisi", surcharge: 100 },
  { id: "sim", label: "Sim", hint: "Işıltılı parıltı", surcharge: 50 },
  { id: "krom", label: "Krom", hint: "Ayna metalik görünüm", surcharge: 100 },
  { id: "sedefli", label: "Sedefli", hint: "İnci sedef parıltı", surcharge: 100 },
]

// ─── Nail Art (desen) ────────────────────────────────────────────────────────
export const NAIL_ARTS: Array<{ id: NailArt; label: string; hint: string; surcharge: number }> = [
  { id: "yok", label: "Düz Renk", hint: "Temiz tek renk", surcharge: 0 },
  { id: "french", label: "French", hint: "Kusursuz beyaz uç", surcharge: 100 },
  { id: "ombre", label: "Ombre", hint: "Yumuşak renk geçişi", surcharge: 150 },
  { id: "altin-folyo", label: "Altın Folyo", hint: "24K folyo parçacıkları", surcharge: 200 },
  { id: "deniz-kabugu", label: "Deniz Kabuğu", hint: "Sedefli kabuk dokusu", surcharge: 200 },
  { id: "inci-tas", label: "İnci & Taş", hint: "İnci + kristal taşlar", surcharge: 250 },
  { id: "nar-cicegi", label: "Nar Çiçeği", hint: "El yapımı çiçek sanatı", surcharge: 250 },
  { id: "dantel", label: "Dantel", hint: "İnce dantel çizimleri", surcharge: 250 },
]

// ─── Hazır şablonlar (stüdyonun gerçek galeri tasarımları) ───────────────────
export const NAIL_PRESETS: Array<{ label: string; emoji: string; config: NailDesignConfig }> = [
  { label: "Bordo Kedi Gözü", emoji: "🍷", config: { shape: "badem", length: "orta", color: "bordo", finish: "kedi-gozu", art: "yok" } },
  { label: "Bordo Ombre", emoji: "🌹", config: { shape: "ballerina", length: "uzun", color: "koyu-bordo", finish: "parlak", art: "ombre" } },
  { label: "Klasik French", emoji: "🤍", config: { shape: "kare", length: "kisa", color: "pudra-pembe", finish: "parlak", art: "french" } },
  { label: "Deniz Kabuğu French", emoji: "🐚", config: { shape: "kare", length: "orta", color: "krem", finish: "sedefli", art: "deniz-kabugu" } },
  { label: "24K Altın Folyo", emoji: "✨", config: { shape: "badem", length: "uzun", color: "gul-pembe", finish: "parlak", art: "altin-folyo" } },
  { label: "İnci Tozu Sarısı", emoji: "🧈", config: { shape: "oval", length: "orta", color: "tereyagi", finish: "sedefli", art: "yok" } },
  { label: "Nar Çiçeği Sanatı", emoji: "🌸", config: { shape: "oval", length: "orta", color: "nude", finish: "parlak", art: "nar-cicegi" } },
  { label: "Siyah Krom", emoji: "🖤", config: { shape: "stiletto", length: "uzun", color: "siyah", finish: "krom", art: "yok" } },
  { label: "Pudra Sim", emoji: "🎀", config: { shape: "yuvarlak", length: "kisa", color: "pudra-pembe", finish: "sim", art: "yok" } },
]

// ─── Yardımcılar ─────────────────────────────────────────────────────────────
export function nailColorById(id: string): NailColor {
  return NAIL_COLORS.find((c) => c.id === id) ?? NAIL_COLORS[0]
}
export function nailShapeLabel(id: string): string {
  return NAIL_SHAPES.find((s) => s.id === id)?.label ?? id
}
export function nailLengthLabel(id: string): string {
  return NAIL_LENGTHS.find((s) => s.id === id)?.label ?? id
}
export function nailFinishLabel(id: string): string {
  return NAIL_FINISHES.find((s) => s.id === id)?.label ?? id
}
export function nailArtLabel(id: string): string {
  return NAIL_ARTS.find((s) => s.id === id)?.label ?? id
}

// ─── Enum guard'ları (DB/URL'den gelen değerler asla SVG'yi çökertmesin) ────
const SHAPE_IDS: NailShape[] = NAIL_SHAPES.map((s) => s.id)
const LENGTH_IDS: NailLength[] = NAIL_LENGTHS.map((s) => s.id)
const FINISH_IDS: NailFinish[] = NAIL_FINISHES.map((s) => s.id)
const ART_IDS: NailArt[] = NAIL_ARTS.map((s) => s.id)
const COLOR_IDS: string[] = NAIL_COLORS.map((c) => c.id)

export function isDesignShape(v: unknown): v is NailShape {
  return SHAPE_IDS.includes(v as NailShape)
}
export function isDesignLength(v: unknown): v is NailLength {
  return LENGTH_IDS.includes(v as NailLength)
}
export function isDesignFinish(v: unknown): v is NailFinish {
  return FINISH_IDS.includes(v as NailFinish)
}
export function isDesignArt(v: unknown): v is NailArt {
  return ART_IDS.includes(v as NailArt)
}
export function isDesignColor(v: unknown): boolean {
  return COLOR_IDS.includes(v as string)
}

/** Liste içinde değilse güvenli varsayılana döner. */
function pick<T extends string>(list: readonly T[], v: unknown, fallback: T): T {
  return list.includes(v as T) ? (v as T) : fallback
}

/** Fiyat tahmini: temel hizmet + efekt/desen ek ücretleri (₺). */
export function designSurcharge(cfg: NailDesignConfig): number {
  const finish = NAIL_FINISHES.find((f) => f.id === cfg.finish)?.surcharge ?? 0
  const art = NAIL_ARTS.find((a) => a.id === cfg.art)?.surcharge ?? 0
  return finish + art
}

/** İnsan-okur tasarım özeti — randevu notlarına & ekip görünümüne gider. */
export function designLabel(cfg: NailDesignConfig): string {
  return `${nailShapeLabel(cfg.shape)} · ${nailLengthLabel(cfg.length)} · ${nailColorById(cfg.color).label} (${nailFinishLabel(cfg.finish)}) · ${nailArtLabel(cfg.art)}`
}

/** Tasarımı kompakt JSON olarak serileştirir (Booking.design). */
export function serializeDesign(cfg: NailDesignConfig): string {
  return JSON.stringify({ v: 1, s: cfg.shape, l: cfg.length, c: cfg.color, f: cfg.finish, a: cfg.art })
}

/** Varsayılan tasarım — geçersiz alanlar buna döner (markanın imza stili). */
export const DEFAULT_DESIGN: NailDesignConfig = {
  shape: "badem",
  length: "orta",
  color: "bordo",
  finish: "parlak",
  art: "yok",
}

/** Booking.design (JSON string) → config. JSON bozuksa null; alan değeri
 *  katalogda yoksa güvenli varsayılana döner (SVG NaN/çökme engellenir). */
export function parseDesign(raw: string | null | undefined): NailDesignConfig | null {
  if (!raw) return null
  try {
    const j = JSON.parse(raw) as { v?: number; s?: unknown; l?: unknown; c?: unknown; f?: unknown; a?: unknown }
    if (!j || typeof j !== "object" || !j.s || !j.l || !j.c || !j.f || !j.a) return null
    return {
      shape: pick(SHAPE_IDS, j.s, DEFAULT_DESIGN.shape),
      length: pick(LENGTH_IDS, j.l, DEFAULT_DESIGN.length),
      color: pick(COLOR_IDS, j.c, DEFAULT_DESIGN.color),
      finish: pick(FINISH_IDS, j.f, DEFAULT_DESIGN.finish),
      art: pick(ART_IDS, j.a, DEFAULT_DESIGN.art),
    }
  } catch {
    return null
  }
}

/** Booking.design (ham JSON) → insan-okur özet. Geçersiz/boşsa null. */
export function designLabelSafe(raw: string | null | undefined): string | null {
  const cfg = parseDesign(raw)
  return cfg ? designLabel(cfg) : null
}
