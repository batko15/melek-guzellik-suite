#!/usr/bin/env node
// Wandelt scripts/pg-schema.sql (Prisma migrate diff Output) in ein
// idempotentes TypeScript-Modul um: src/lib/pg-ddl.ts
// Transformationen: CREATE TABLE → IF NOT EXISTS, CREATE INDEX → IF NOT EXISTS,
// CREATE SCHEMA → IF NOT EXISTS (bereits vorhanden).
//
// V5.4: ALTER TABLE / ADD CONSTRAINT werden in DO $$ … EXCEPTION $$-Blöcke
// gewickelt. Grund: In einer PostgreSQL-TRANSAKTION versetzt ein fehlgeschlagenes
// Statement (z.B. «constraint already exists» auf einer Bestands-DB) die GESAMTE
// Transaktion in den Zustand «aborted» (25P02) — alle weiteren Statements
// scheitern dann blind. Ein DO-Block mit EXCEPTION-Klausel bildet dagegen eine
// Subtransaktion: der Fehler wird abgefangen, die äußere Transaktion bleibt
// intakt. So läuft derselbe DDL-Block sowohl auf leeren als auch auf
// bereits eingerichteten Datenbanken (Upgrade-Pfad V5.2 → V5.4).

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
  // V5.4: ALTER … ADD CONSTRAINT in subtransaktionssicheren DO-Block wickeln
  // (duplicate_object = 42710 «already exists», undefined_table = 42P01 Defensive)
  .map((s) =>
    s.startsWith("ALTER TABLE")
      ? `DO $$\nBEGIN\n  ${s.replace(/;$/, "")};\nEXCEPTION\n  WHEN duplicate_object THEN NULL;\n  WHEN undefined_table THEN NULL;\nEND $$;`
      : s,
  )

const out = `// AUTO-GENERIERT aus prisma/schema.postgres.prisma (scripts/build-pg-ddl.mjs)
// PostgreSQL-DDL für Supabase-Bootstrap — idempotent (IF NOT EXISTS +
// ALTER in DO-EXCEPTION-Blöcken: lauffähig auf leeren UND bestehenden DBs).
// NICHT von Hand bearbeiten — stattdessen Schema ändern und Skript neu ausführen.

export const PG_DDL: string[] = [
${statements.map((s) => "  " + JSON.stringify(s) + ",").join("\n")}
]
`

writeFileSync("src/lib/pg-ddl.ts", out)
console.log(`✓ src/lib/pg-ddl.ts — ${statements.length} Statements`)
