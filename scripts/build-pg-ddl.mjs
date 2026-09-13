#!/usr/bin/env node
// Wandelt scripts/pg-schema.sql (Prisma migrate diff Output) in ein
// idempotentes TypeScript-Modul um: src/lib/pg-ddl.ts
// Transformationen: CREATE TABLE → IF NOT EXISTS, CREATE INDEX → IF NOT EXISTS,
// CREATE SCHEMA → IF NOT EXISTS (bereits vorhanden).
// ALTER TABLE / ADD CONSTRAINT bleiben unverändert (Bootstrap fängt Fehler ab).

import { readFileSync, writeFileSync } from "node:fs"

const sql = readFileSync("scripts/pg-schema.sql", "utf8")

// In Einzel-Statements zerlegen (die DDL enthält keine String-Literale mit ';')
const raw = sql
  .split("-- ")                     // Kommentar-Zeilen abtrennen
  .map((chunk) => chunk.split("\n").slice(1).join("\n")) // erste Zeile (Kommentar) entfernen
  .join("\n")

const statements = raw
  .split(";\n")
  .map((s) => s.trim())
  .filter((s) => s.length > 0)
  .map((s) => s + ";")
  .map((s) => s.replace(/^CREATE TABLE (?!IF NOT EXISTS)/, "CREATE TABLE IF NOT EXISTS "))
  .map((s) => s.replace(/^CREATE INDEX (?!IF NOT EXISTS)/, "CREATE INDEX IF NOT EXISTS "))
  .map((s) => s.replace(/^CREATE UNIQUE INDEX (?!IF NOT EXISTS)/, "CREATE UNIQUE INDEX IF NOT EXISTS "))

const out = `// AUTO-GENERIERT aus prisma/schema.postgres.prisma (scripts/build-pg-ddl.mjs)
// PostgreSQL-DDL für Supabase-Bootstrap — idempotent (IF NOT EXISTS).
// NICHT von Hand bearbeiten — stattdessen Schema ändern und Skript neu ausführen.

export const PG_DDL: string[] = [
${statements.map((s) => "  " + JSON.stringify(s) + ",").join("\n")}
]
`

writeFileSync("src/lib/pg-ddl.ts", out)
console.log(`✓ src/lib/pg-ddl.ts — ${statements.length} Statements`)
