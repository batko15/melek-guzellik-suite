// ALIEN 2 — Konfigurator-State (Zustand)
// 3 Schritte: Fahrzeug → Leistungsrechner → Offerten-Optionen

"use client"

import { create } from "zustand"
import type { WarrantyId, InstallId } from "@/lib/pricing"

export interface Vehicle {
  id: string
  brand: string
  model: string
  engine: string
  fuel: string
  euroNorm: string
  years: string
  hpOrig: number
  nmOrig: number
  hpTuned: number
  nmTuned: number
  fuelSaving: number
  priceChf: number
  productCode: string
  installMin: number
}

export interface CalcResult {
  vehicle: Vehicle
  performance: {
    hpGain: number; nmGain: number; hpGainPct: number; nmGainPct: number
    fuelSavingPct: number; accelGainPct: number
  }
  totals: {
    items: Array<{ artNo: string; description: string; unit: string; qty: number; price: number; discountPct: number; total: number }>
    basePrice: number; warrantyPrice: number; installPrice: number
    shipping: number; subtotal: number; vatAmount: number; total: number
  }
  routing: {
    partner: { id: string; company: string; city: string; zip: string; canton: string; phone: string | null; brands: string; distanceKm: number }
    alternatives: number
  } | null
}

export interface GeneratedQuote {
  id: string
  refNumber: number
  customerNumber: number
  customerName: string
  customerEmail: string
  customerZip: string
  vehicle: Vehicle
  totals: CalcResult["totals"]
  installMode: string
  channel: string
  partner: { company: string; city: string; zip: string; phone: string | null; canton: string } | null
  status: string
  createdAt: string
}

export interface FollowupInfo { dayOffset: number; action: string; channel: string; dueAt: string }
export interface EmailInfo { id: string; to: string; cc?: string; subject: string; body: string; sentAt: string; direction: "customer" | "sales" | "partner" }

interface ConfiguratorState {
  step: 1 | 2 | 3
  // Schritt 1: Fahrzeug
  brand: string | null
  model: string | null
  vehicle: Vehicle | null
  // Schritt 2: Live-Berechnung
  calc: CalcResult | null
  // Schritt 3: Optionen + Kundendaten
  warranty: WarrantyId
  install: InstallId
  channel: "b2c" | "b2b"
  b2bQty: number
  customer: { name: string; email: string; phone: string; zip: string; city: string; street: string }
  // Ergebnis
  generated: { quote: GeneratedQuote; followups: FollowupInfo[]; emails: EmailInfo[]; pdfBase64: string } | null

  setStep: (s: 1 | 2 | 3) => void
  setBrand: (b: string | null) => void
  setModel: (m: string | null) => void
  setVehicle: (v: Vehicle | null) => void
  setCalc: (c: CalcResult | null) => void
  setWarranty: (w: WarrantyId) => void
  setInstall: (i: InstallId) => void
  setChannel: (c: "b2c" | "b2b") => void
  setB2bQty: (q: number) => void
  setCustomer: (patch: Partial<ConfiguratorState["customer"]>) => void
  setGenerated: (g: ConfiguratorState["generated"]) => void
  reset: () => void
}

const initialCustomer = { name: "", email: "", phone: "", zip: "", city: "", street: "" }

export const useConfigurator = create<ConfiguratorState>((set) => ({
  step: 1,
  brand: null,
  model: null,
  vehicle: null,
  calc: null,
  warranty: "z3",
  install: "partner",
  channel: "b2c",
  b2bQty: 3,
  customer: initialCustomer,
  generated: null,

  setStep: (step) => set({ step }),
  setBrand: (brand) => set({ brand, model: null, vehicle: null, calc: null }),
  setModel: (model) => set({ model, vehicle: null, calc: null }),
  setVehicle: (vehicle) => set({ vehicle, calc: null }),
  setCalc: (calc) => set({ calc }),
  setWarranty: (warranty) => set({ warranty }),
  setInstall: (install) => set({ install }),
  setChannel: (channel) => set({ channel }),
  setB2bQty: (b2bQty) => set({ b2bQty: Math.max(1, b2bQty) }),
  setCustomer: (patch) => set((s) => ({ customer: { ...s.customer, ...patch } })),
  setGenerated: (generated) => set({ generated }),
  reset: () => set({ step: 1, brand: null, model: null, vehicle: null, calc: null, generated: null, customer: initialCustomer }),
}))

// Hilfsfunktionen für die Fahrzeugauswahl
export function groupModels(vehicles: Vehicle[]): Map<string, Vehicle[]> {
  const map = new Map<string, Vehicle[]>()
  for (const v of vehicles) {
    const list = map.get(v.model) ?? []
    list.push(v)
    map.set(v.model, list)
  }
  return map
}

export const FUEL_LABEL: Record<string, string> = {
  diesel: "Diesel",
  benzin: "Benzin",
  hybrid: "Hybrid",
}

export const FUEL_ICON: Record<string, string> = {
  diesel: "Diesel",
  benzin: "Benzin",
  hybrid: "Hybrid",
}
