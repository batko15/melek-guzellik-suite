#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  PRISMA SCHEMA-SELEKTOR — SQLite (lokal) / PostgreSQL (Supabase, Vercel)
// ═══════════════════════════════════════════════════════════════════════════
//  Liest DATABASE_URL und wählt das passende Schema:
//    • file:...        → prisma/schema.prisma          (SQLite, lokale Entwicklung)
//    • postgres://...  → prisma/schema.postgres.prisma (PostgreSQL, Supabase/Vercel)
//
//  Wird von package.json aufgerufen: postinstall, db:generate, build.
//  So funktioniert dieselbe Code-Basis lokal (SQLite) UND in der Cloud (Supabase).
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, existsSync } from "node:fs"
import { execSync } from "node:child_process"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

function resolveDatabaseUrl() {
  // 1) .env-Datei (lokale Entwicklung — Quelle der Wahrheit).
  //    BEWUSST vor der Umgebungsvariable: Shells können veraltete
  //    DATABASE_URL-Exports tragen (z. B. altes SQLite-Setup), die sonst
  //    die .env überdecken würden. Auf Vercel existiert keine .env im Repo
  //    (gitignored) → Umgebungsvariable greift dort automatisch.
  const envPath = resolve(root, ".env")
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/)
      if (m) return m[1].trim().replace(/^["']|["']$/g, "")
    }
  }
  // 2) Umgebungsvariable (Vercel setzt diese beim Build)
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  return null
}

const url = resolveDatabaseUrl()
// Provider-Wahl:
//  • DATABASE_URL sichtbar → Protokoll entscheidet (postgres:// → PostgreSQL)
//  • URL NICHT sichtbar, aber Vercel-Build (VERCEL=1) → PostgreSQL annehmen.
//    Grund: «Sensitive» Umgebungsvariablen sind beim Build versteckt, zur
//    Laufzeit aber vorhanden. Auf Vercel ist die Cloud-Datenbank der Normalfall.
//  • Lokal ohne URL → SQLite (Entwicklung wie gehabt).
const isPostgres = url
  ? /^postgres(ql)?:\/\//i.test(url)
  : process.env.VERCEL === "1"
const schema = isPostgres ? "prisma/schema.postgres.prisma" : "prisma/schema.prisma"

console.log(`▸ Prisma-Schema: ${schema} (${isPostgres ? "PostgreSQL" : "SQLite"}${url ? "" : " · URL nicht sichtbar → " + (process.env.VERCEL === "1" ? "Vercel-Cloud-Annahme" : "lokale Annahme")})`)
if (isPostgres && !existsSync(resolve(root, schema))) {
  console.error(`✗ FEHLER: ${schema} fehlt!`)
  process.exit(1)
}

execSync(`npx prisma generate --schema=${schema}`, { stdio: "inherit", cwd: root })
console.log(`✓ Prisma Client generiert (${isPostgres ? "PostgreSQL" : "SQLite"})`)
