// DIAGNOSE-ENDPUNKT — Cloud-Datenbank-Status (nur für Einrichtung/Fehlersuche)
// Gibt KEINE Geheimnisse preis: Protokoll + maskierter Host + Fehlerklasse/-meldung.
// Nutzt den geteilten Client aus lib/db (inkl. URL-Normalisierung + Bootstrap) —
// ein eigener PrismaClient pro Aufruf wäre eine zusätzliche Verbindungsquelle.

import { db } from "@/lib/db"
import { isPostgres } from "@/lib/db-bootstrap"

export async function GET() {
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
