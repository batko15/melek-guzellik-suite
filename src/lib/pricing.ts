// ALIEN 3 — SWISS QUOTE & PDF ENGINE
// Preislogik der AutoFaszination Performance & B2B Sales Suite
// Basis: AF Preisliste CH/DE 2026 + Offerten-Struktur (Offerte_10900)

export const VAT_RATE_CH = 0.081 // CH-MwSt. 8.1 %
export const SHIPPING_CHF = 14.5 // Porto gem. Offerten-Struktur

// ─── Preisliste 2026 (Auszug) ───────────────────────────────────────────────
export const PRICE_LIST_2026 = {
  DA: { code: "DA", name: "Diesel Komplettsatz LET26", ekNetto: 690, uvpBrutto: 990 },
  BA: { code: "BA", name: "Benzin Komplettsatz LET26", ekNetto: 790, uvpBrutto: 1090 },
  K:  { code: "K",  name: "LETx Hybrid-System",       ekNetto: 890, uvpBrutto: 1290 },
  GA: { code: "GA", name: "Gaspedaltuning LET26",     ekNetto: 290, uvpBrutto: 490 },
} as const

// ─── Garantie-Optionen ──────────────────────────────────────────────────────
export const WARRANTY_OPTIONS = {
  none:    { id: "none",    label: "Keine Zusatzgarantie", price: 0, months: 0 },
  z3:      { id: "z3",      label: "Motorgarantie Zürich Versicherung — 36 Monate", price: 290, months: 36 },
  z5:      { id: "z5",      label: "Motorgarantie Zürich Versicherung — 60 Monate", price: 490, months: 60 },
} as const
export type WarrantyId = keyof typeof WARRANTY_OPTIONS

// ─── Einbau-Optionen (B2C-Selbsteinbau vs. Partner-Garage vor Ort) ───────────
// Einbauzeit LET26 Komplettsatz: 15 Minuten (Leitfaden: CHF 1'400+ Ertrag/Std in der Garage)
export const INSTALL_OPTIONS = {
  self:    { id: "self",    label: "Selbsteinbau (Plug & Play, 15–25 Min.)", hourlyRate: 0 },
  partner: { id: "partner", label: "Einbau bei Partner-Garage vor Ort", hourlyRate: 180 }, // CHF/Std. à 15 Min.
} as const
export type InstallId = keyof typeof INSTALL_OPTIONS

// B2B-Konditionen gem. Staffelpreisliste (EK Netto)
export const B2B_TIERS = [
  { minQty: 10, discount: 0.30 },  // ab 10 Stück
  { minQty: 5,  discount: 0.27 },  // ab 5 Stück
  { minQty: 3,  discount: 0.19 },  // ab 3 Stück
  { minQty: 1,  discount: 0.0 },
] as const

export interface QuoteItem {
  artNo: string
  description: string
  unit: string
  qty: number
  price: number
  discountPct: number
  total: number
}

export interface QuoteTotals {
  items: QuoteItem[]
  basePrice: number       // Grundpreis (Warenwert netto)
  warrantyPrice: number   // optionale Garantie
  installPrice: number    // Einbaukosten
  shipping: number        // Porto
  subtotal: number        // netto Total
  vatAmount: number       // MwSt 8.1 %
  total: number           // Gesamtbetrag
}

const r2 = (n: number) => Math.round(n * 100) / 100

/** CHF-Beträge formatieren: 1'290.00 */
export function chf(n: number): string {
  return n.toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export interface VehicleLike {
  brand: string; model: string; engine: string; fuel: string
  hpOrig: number; nmOrig: number; hpTuned: number; nmTuned: number
  fuelSaving: number; priceChf: number; productCode: string; installMin: number
}

export interface CalcQuoteInput {
  vehicle: VehicleLike
  warranty: WarrantyId
  install: InstallId
  channel?: "b2c" | "b2b"
  b2bQty?: number
}

/** Vollständige Offerten-Berechnung: Grundpreis, Garantie, Einbau, Porto, MwSt, Total */
export function calcQuote(input: CalcQuoteInput): QuoteTotals {
  const { vehicle, warranty, install, channel = "b2c", b2bQty = 1 } = input
  const isB2B = channel === "b2b"

  // Grundpreis: B2C = UVP, B2B = EK Netto abzgl. Staffelrabatt
  const list = PRICE_LIST_2026[vehicle.productCode as keyof typeof PRICE_LIST_2026]
  let unitPrice = isB2B ? list.ekNetto : vehicle.priceChf
  let discountPct = 0
  if (isB2B) {
    const tier = B2B_TIERS.find(t => b2bQty >= t.minQty) ?? B2B_TIERS[B2B_TIERS.length - 1]
    discountPct = Math.round(tier.discount * 100)
    unitPrice = r2(list.ekNetto * (1 - tier.discount))
  }

  const product = list.name
  const items: QuoteItem[] = [{
    artNo: `${vehicle.productCode}-${vehicle.brand.slice(0, 2).toUpperCase()}${100 + (vehicle.hpOrig % 900)}`,
    description: `${vehicle.brand} ${vehicle.model}\n${product}\n${vehicle.engine}\n${vehicle.years ?? ""}\n${vehicle.hpOrig} » ${vehicle.hpTuned} PS / ${vehicle.nmOrig} » ${vehicle.nmTuned} Nm`,
    unit: "Stk.",
    qty: isB2B ? b2bQty : 1,
    price: unitPrice,
    discountPct: 0,
    total: r2(unitPrice * (isB2B ? b2bQty : 1)),
  }]

  const basePrice = items[0].total

  // Optionale Garantie (nur B2C sinnvoll, B2B-Garage hat eigene Abwicklung)
  const warrantyPrice = !isB2B && warranty !== "none" ? WARRANTY_OPTIONS[warranty].price : 0
  if (warrantyPrice > 0) {
    items.push({
      artNo: `GW-${WARRANTY_OPTIONS[warranty].months}`,
      description: WARRANTY_OPTIONS[warranty].label,
      unit: "Stk.",
      qty: 1,
      price: warrantyPrice,
      discountPct: 0,
      total: warrantyPrice,
    })
  }

  // Einbaukosten (Partner-Garage vor Ort; 15-Min-Rhythmus, min. 60 CHF)
  const installPrice = install === "partner" ? r2(Math.max(60, (vehicle.installMin / 60) * INSTALL_OPTIONS.partner.hourlyRate)) : 0
  if (installPrice > 0) {
    items.push({
      artNo: "SL-INST",
      description: `Einbau durch Partner-Garage (ca. ${vehicle.installMin} Min.)`,
      unit: "Stk.",
      qty: 1,
      price: installPrice,
      discountPct: 0,
      total: installPrice,
    })
  }

  const subtotal = r2(basePrice + warrantyPrice + installPrice)
  const vatAmount = r2(subtotal * VAT_RATE_CH)
  const total = r2(subtotal + vatAmount + SHIPPING_CHF)

  return {
    items,
    basePrice: r2(basePrice),
    warrantyPrice: r2(warrantyPrice),
    installPrice: r2(installPrice),
    shipping: SHIPPING_CHF,
    subtotal,
    vatAmount,
    total,
  }
}

/** Leistungssteigerung-Berechnung für den Live-Rechner (Alien 2) */
export function calcPerformance(v: VehicleLike) {
  const hpGain = v.hpTuned - v.hpOrig
  const nmGain = v.nmTuned - v.nmOrig
  return {
    hpGain,
    nmGain,
    hpGainPct: Math.round((hpGain / v.hpOrig) * 100),
    nmGainPct: Math.round((nmGain / v.nmOrig) * 100),
    fuelSavingPct: v.fuelSaving,
    // 0–100 km/h Beschleunigung theoretisch ~ PS-Proportional
    accelGainPct: Math.round((hpGain / v.hpOrig) * 100 * 0.8),
  }
}
