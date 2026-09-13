// ALIEN 4 — B2B SALES & WORKFLOW AUTOMATOR
// Geo-Routing: PLZ → approx. Koordinaten + Distanzberechnung (Haversine)
// Basis für die Zuordnung der Offerte zur nächstgelegenen Partner-Garage.

export interface Coords { lat: number; lng: number }

// Approximative Zonen-Zentren je PLZ-Präfix (erste 2 Ziffern)
const PLZ_ZONES: Record<string, Coords> = {
  "10": { lat: 46.21, lng: 6.15 }, "11": { lat: 46.22, lng: 6.12 }, "12": { lat: 46.25, lng: 6.10 }, "13": { lat: 46.26, lng: 6.09 },
  "14": { lat: 46.78, lng: 6.64 }, "15": { lat: 46.82, lng: 6.94 }, "16": { lat: 46.62, lng: 7.06 }, "17": { lat: 46.80, lng: 7.15 },
  "18": { lat: 46.46, lng: 6.85 }, "19": { lat: 46.25, lng: 6.95 },
  "20": { lat: 46.99, lng: 6.93 }, "21": { lat: 47.05, lng: 6.88 }, "22": { lat: 47.02, lng: 6.85 }, "23": { lat: 47.10, lng: 6.82 },
  "24": { lat: 47.06, lng: 6.74 }, "25": { lat: 47.14, lng: 7.24 }, "26": { lat: 47.15, lng: 7.00 }, "27": { lat: 47.28, lng: 7.37 },
  "28": { lat: 47.36, lng: 7.35 }, "29": { lat: 47.42, lng: 7.07 },
  "30": { lat: 46.95, lng: 7.45 }, "31": { lat: 46.88, lng: 7.55 }, "32": { lat: 46.95, lng: 7.12 }, "33": { lat: 47.10, lng: 7.55 },
  "34": { lat: 47.06, lng: 7.62 }, "35": { lat: 46.90, lng: 7.60 }, "36": { lat: 46.76, lng: 7.63 }, "37": { lat: 46.65, lng: 7.68 },
  "38": { lat: 46.69, lng: 7.87 }, "39": { lat: 46.29, lng: 7.98 },
  "40": { lat: 47.56, lng: 7.60 }, "41": { lat: 47.53, lng: 7.62 }, "42": { lat: 47.42, lng: 7.55 }, "43": { lat: 47.55, lng: 7.79 },
  "44": { lat: 47.48, lng: 7.73 }, "45": { lat: 47.21, lng: 7.54 }, "46": { lat: 47.35, lng: 7.90 }, "47": { lat: 47.28, lng: 7.80 },
  "48": { lat: 47.48, lng: 7.97 }, "49": { lat: 47.25, lng: 7.80 },
  "50": { lat: 47.39, lng: 8.05 }, "51": { lat: 47.45, lng: 8.15 }, "52": { lat: 47.48, lng: 8.20 }, "53": { lat: 47.49, lng: 8.28 },
  "54": { lat: 47.47, lng: 8.34 }, "55": { lat: 47.33, lng: 8.28 }, "56": { lat: 47.35, lng: 8.25 }, "57": { lat: 47.30, lng: 8.12 },
  "58": { lat: 47.25, lng: 8.05 }, "59": { lat: 47.25, lng: 8.05 },
  "60": { lat: 47.05, lng: 8.30 }, "61": { lat: 47.12, lng: 8.02 }, "62": { lat: 47.18, lng: 8.10 }, "63": { lat: 47.15, lng: 8.45 },
  "64": { lat: 46.90, lng: 8.60 }, "65": { lat: 46.19, lng: 9.02 }, "66": { lat: 47.15, lng: 8.50 }, "67": { lat: 46.40, lng: 8.85 },
  "68": { lat: 45.87, lng: 8.98 }, "69": { lat: 46.00, lng: 8.95 },
  "70": { lat: 46.85, lng: 9.53 }, "71": { lat: 46.78, lng: 9.20 }, "72": { lat: 46.97, lng: 9.55 }, "73": { lat: 47.05, lng: 9.45 },
  "74": { lat: 46.70, lng: 9.42 }, "75": { lat: 46.50, lng: 9.90 }, "77": { lat: 46.33, lng: 10.05 },
  "80": { lat: 47.38, lng: 8.54 }, "81": { lat: 47.32, lng: 8.52 }, "82": { lat: 47.35, lng: 8.70 }, "83": { lat: 47.44, lng: 8.60 },
  "84": { lat: 47.50, lng: 8.72 }, "85": { lat: 47.55, lng: 9.05 }, "86": { lat: 47.27, lng: 8.80 }, "87": { lat: 47.22, lng: 8.83 },
  "88": { lat: 47.20, lng: 8.90 }, "89": { lat: 47.10, lng: 9.35 },
  "90": { lat: 47.45, lng: 9.30 }, "91": { lat: 47.39, lng: 9.28 }, "92": { lat: 47.40, lng: 9.10 }, "93": { lat: 47.55, lng: 8.90 },
  "94": { lat: 47.35, lng: 9.50 }, "95": { lat: 47.46, lng: 9.04 }, "96": { lat: 47.30, lng: 9.09 },
}

// Kanton-Zentren als Fallback
const CANTON_CENTERS: Record<string, Coords> = {
  AG: { lat: 47.42, lng: 8.21 }, ZH: { lat: 47.38, lng: 8.54 }, BE: { lat: 46.93, lng: 7.55 }, VD: { lat: 46.60, lng: 6.55 },
  SG: { lat: 47.25, lng: 9.05 }, TI: { lat: 46.30, lng: 8.80 }, LU: { lat: 47.09, lng: 8.10 }, FR: { lat: 46.70, lng: 7.10 },
  VS: { lat: 46.21, lng: 7.60 }, TG: { lat: 47.55, lng: 9.05 }, SO: { lat: 47.30, lng: 7.60 }, BL: { lat: 47.45, lng: 7.70 },
  BS: { lat: 47.56, lng: 7.60 }, SZ: { lat: 47.03, lng: 8.65 }, AR: { lat: 47.32, lng: 9.25 }, AI: { lat: 47.32, lng: 9.40 },
  UR: { lat: 46.65, lng: 8.60 }, GL: { lat: 47.00, lng: 9.10 }, ZG: { lat: 47.15, lng: 8.50 }, NE: { lat: 46.95, lng: 6.85 },
  GE: { lat: 46.20, lng: 6.10 }, JU: { lat: 47.35, lng: 7.15 }, SH: { lat: 47.70, lng: 8.60 }, GR: { lat: 46.65, lng: 9.58 },
  NW: { lat: 46.95, lng: 8.35 }, OW: { lat: 46.85, lng: 8.25 }, FL: { lat: 47.15, lng: 9.55 },
}

/** Deterministischer Jitter (±ca. 3 km), damit Häuser derselben Zone nicht identisch liegen */
function jitter(zip: string): { dLat: number; dLng: number } {
  let h = 0
  for (const ch of zip) h = (h * 31 + ch.charCodeAt(0)) % 1000
  const dLat = ((h % 100) / 100 - 0.5) * 0.05
  const dLng = (((h / 100) | 0) % 100 / 100 - 0.5) * 0.07
  return { dLat, dLng }
}

/** PLZ (+ Kanton als Fallback) → approximative Koordinaten in der Schweiz */
export function plzToCoords(zip: string, canton?: string): Coords {
  const prefix = zip.replace(/\D/g, "").slice(0, 2)
  const base = PLZ_ZONES[prefix] ?? CANTON_CENTERS[canton ?? ""] ?? CANTON_CENTERS.AG
  const { dLat, dLng } = jitter(zip)
  return { lat: base.lat + dLat, lng: base.lng + dLng }
}

/** Haversine-Distanz in km */
export function distanceKm(a: Coords, b: Coords): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Validierung Schweizer/Liechtensteiner PLZ (4-stellig) */
export function isValidChZip(zip: string): boolean {
  return /^[1-9]\d{3}$/.test(zip.trim())
}
