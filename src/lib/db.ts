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
  const hasSslmode = /[?&]sslmode=/i.test(url)
  const hasConnLimit = /[?&]connection_limit=/i.test(url)
  const parts: string[] = []
  if (!hasSslmode) parts.push('sslmode=require')
  // Serverless-freundlicher Pool (Vercel-Funktionen teilen sich keine Connections)
  if (!hasConnLimit) parts.push('connection_limit=5')
  if (parts.length > 0) {
    process.env.DATABASE_URL = url + (url.includes('?') ? '&' : '?') + parts.join('&')
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
