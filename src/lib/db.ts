// ═══════════════════════════════════════════════════════════════════════════
//  PRISMA CLIENT — SQLite (lokal) & PostgreSQL/Supabase (Vercel) in einem
// ═══════════════════════════════════════════════════════════════════════════
//  • Postgres: vor der ersten Operation wird ensureDatabase() await-et
//    (Tabellen + Grunddaten werden automatisch eingerichtet — siehe
//    db-bootstrap.ts). Der $extends-Hook fängt ALLE Modell-Operationen ab,
//    ohne dass bestehende Routen angefasst werden müssten.
//  • SQLite (lokal): Hook ist ein reines Durchreichen — null Overhead-Logik.
//  • Query-Logging nur in der Entwicklung (Vercel-Logs sauber halten).
// ═══════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'
import { ensureDatabase, isPostgres } from '@/lib/db-bootstrap'

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createDbClient> | undefined
}

// Supabase/Neon & Co. erzwingen TLS — Parameter sicher ergänzen, falls fehlt.
// Muss VOR der Client-Erstellung passieren (der Client liest die URL einmalig).
function normalizeDatabaseUrl() {
  const url = process.env.DATABASE_URL
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) return

  // ── Supabase-Pooler: Transaction-Mode erzwingen (Serverless-kritisch!) ───
  // Der Session-Pooler (Port 5432) erlaubt DB-weit nur ~15 gleichzeitige
  // Clients. Auf Vercel ist JEDE API-Route eine eigene Serverless-Funktion
  // mit eigenem Prisma-Pool — wenige warme Instanzen × connection_limit=5
  // erschöpfen das Limit sofort (EMAXCONNSESSION-Fehler, Site tot).
  // Der Transaction-Pooler (Port 6543) blockiert zwischen Transaktionen
  // KEINE Server-Session → Tausende Clients möglich.
  // Prisma benötigt dafür pgbouncer=true (deaktiviert Prepared Statements)
  // und connection_limit=1 (eine Vercel-Funktion bearbeitet ohnehin nur
  // einen Request gleichzeitig).
  const POOLER_RE = /(pooler\.supabase\.com)(?::(\d+))?/i
  let target = url
  let isTransactionMode = false
  const poolerMatch = url.match(POOLER_RE)
  if (poolerMatch) {
    const port = poolerMatch[2] ?? '5432' // fehlender Port = 5432 = Session-Mode
    if (port === '5432') {
      target = url.replace(POOLER_RE, '$1:6543')
    }
    isTransactionMode = /:6543(?!\d)/.test(target)
  }

  const isSupabasePooler = Boolean(poolerMatch)
  const parts: string[] = []
  if (!/[?&]sslmode=/i.test(target)) parts.push('sslmode=require')
  if (isTransactionMode && !/[?&]pgbouncer=/i.test(target)) parts.push('pgbouncer=true')
  // Serverless-freundlicher Pool: Supabase-Pooler → 1 Verbindung pro Funktion;
  // andere Postgres-Hosts (eigener Server) → 5 Verbindungen
  if (!/[?&]connection_limit=/i.test(target)) {
    parts.push(`connection_limit=${isSupabasePooler ? 1 : 5}`)
  }
  if (parts.length > 0) {
    process.env.DATABASE_URL = target + (target.includes('?') ? '&' : '?') + parts.join('&')
  } else {
    process.env.DATABASE_URL = target
  }
}
normalizeDatabaseUrl()

function createDbClient() {
  const base = new PrismaClient({
    log: ['error'],
  })

  // Vor jeder Modell-Operation: Cloud-Bootstrap sicherstellen (no-op lokal).
  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          if (isPostgres()) await ensureDatabase(base)
          return query(args)
        },
      },
    },
  })
}

export const db = globalForPrisma.prisma ?? createDbClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
