// ═══════════════════════════════════════════════════════════════════════════
//  CANLI NAIL STUDIO — Zustand (V5.7)
//  Nail Studio'da oluşturulan tasarım → Randevu akışına taşınır.
//  `pending`: randevuya bağlanmayı bekleyen tasarım (basit kalıcı olmayan).
// ═══════════════════════════════════════════════════════════════════════════

"use client"

import { create } from "zustand"
import type { NailDesignConfig } from "@/lib/nail-design"

interface NailDesignState {
  pending: NailDesignConfig | null
  /** Tasarımı ayarlar (Nail Studio → Randevu). */
  setPending: (cfg: NailDesignConfig) => void
  /** Tasarımı temizler (randevu tamamlandı / müşteri vazgeçti). */
  clearPending: () => void
}

export const useNailDesign = create<NailDesignState>((set) => ({
  pending: null,
  setPending: (cfg) => set({ pending: cfg }),
  clearPending: () => set({ pending: null }),
}))
