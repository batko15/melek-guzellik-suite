// DIAGNOSE-ENDPUNKT — Cloud-Datenbank-Status (nur für Einrichtung/Fehlersuche)
// Gibt KEINE Geheimnisse preis: Protokoll + maskierter Host + Fehlerklasse/-meldung.
// Nutzt den geteilten Client aus lib/db (inkl. URL-Normalisierung + Bootstrap) —
// ein eigener PrismaClient pro Aufruf wäre eine zusätzliche Verbindungsquelle.

import { db } from "@/lib/db"
import { requireStaff } from "@/lib/auth"
import { isPostgres, SUPABASE_PROJECT_REF } from "@/lib/db-bootstrap"

export async function GET(request: Request) {
  // V5.7.1: yalnızca ekip oturumu — maskeli DB-URL, proje-ref gibi
  // altyapı ayrıntıları artık herkese açık değil (2-b Bulgu 25).
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  const url = process.env.DATABASE_URL ?? ""
  const masked = url
    .replace(/\/\/[^@]+@/, "//***:***@")
    .replace(/([?&])(password|p)=[^&]*/gi, "$1***")

  const info: Record<string, unknown> = {
    runtime: process.env.NODE_ENV,
    vercelRegion: process.env.VERCEL_REGION ?? null,
    dbProtocol: url.split("://")[0] || "none",
    dbUrlMasked: masked.slice(0, 90),
    isPostgres: isPostgres(),
    supabaseProjectRef: SUPABASE_PROJECT_REF,
  }

  // V5.5 — Supabase-API-Gateway (nicht-blockierend, 3 s Timeout):
  // 401 von /rest/v1/ = Projekt AKTİF (anon anahtar yok, beklenen).
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 3000)
    const r = await fetch(`https://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1/`, {
      signal: ctrl.signal,
      cache: "no-store",
    })
    clearTimeout(t)
    info.supabaseApi = { reachable: true, httpCode: r.status, active: r.status === 401 || r.status === 200 }
  } catch {
    info.supabaseApi = { reachable: false, active: false }
  }

  if (!isPostgres()) {
    info.error = "Läuft gegen SQLite (lokal) — Cloud-Bootstrap nicht aktiv."
    return Response.json(info)
  }

  try {
    // 1) Tabellen-Check
    const exists = await db.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'Service'
      ) AS exists
    `
    info.tablesExist = exists[0]?.exists === true

    // 2) Zählstände (löst bei fehlenden Tabellen den Auto-Bootstrap aus)
    try {
      const c = await db.service.count()
      info.serviceCount = c
    } catch (e) {
      info.serviceCountError = String((e as Error)?.message ?? e).slice(0, 300)
    }

    return Response.json(info)
  } catch (e) {
    info.fatalError = String((e as Error)?.message ?? e).slice(0, 500)
    return Response.json(info, { status: 500 })
  }
}
