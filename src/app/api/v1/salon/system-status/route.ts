// GET /api/v1/salon/system-status — V5.5 «Sistem Durumu» (Ekip portalı)
// Bulut sağlığı canlı izleme: Veritabanı (Prisma) + Supabase API ağ geçidi.
//
// Supabase URL tespiti (öncelik sırası):
//   1. SUPABASE_API_URL / NEXT_PUBLIC_SUPABASE_URL ortam değişkeni
//   2. DATABASE_URL'den otomatik türetme — pooler kullanıcı adı
//      «postgres.<proje-ref>@…» biçimindedir → https://<ref>.supabase.co
//   3. Varsayılan: mevcut salon projesi (pmudlcpusvwvmejirpsq)
//
// Not: /rest/v1/ uç noktası anon anahtar olmadan 401 döndürür — bu bir
// BAŞARI işaretidir: proje AKTİF demektir. Free tier'da 7 gün işlem
// yapılmazsa proje duraklatılır; o durumda ağ geçidi yanıt vermez ve
// kart «duraklatılmış» uyarısı gösterir (sahip Supabase'de Restore tıklar).

import { db } from "@/lib/db"
import { isPostgres, SUPABASE_PROJECT_REF } from "@/lib/db-bootstrap"
import { BRANDING } from "@/config/branding"
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit"

/** Supabase API ağ geçidi yoklaması — 4 s zaman aşımı ile. */
async function pingSupabase(baseUrl: string): Promise<{
  status: "aktif" | "duraklatilmis" | "bilinmiyor"
  httpCode: number | null
  latencyMs: number | null
  hint: string
}> {
  const started = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`${baseUrl}/rest/v1/`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    })
    clearTimeout(timer)
    const latencyMs = Date.now() - started
    // 401 = ağ geçidi ayakta, anon anahtar yok (beklenen) → proje AKTİF
    if (res.status === 401 || res.status === 200) {
      return {
        status: "aktif",
        httpCode: res.status,
        latencyMs,
        hint: "Supabase bulut projesi aktif — veritabanı ve API ağ geçidi ayakta.",
      }
    }
    return {
      status: "bilinmiyor",
      httpCode: res.status,
      latencyMs,
      hint: `Beklenmeyen yanıt: HTTP ${res.status}.`,
    }
  } catch {
    return {
      status: "duraklatilmis",
      httpCode: null,
      latencyMs: Date.now() - started,
      hint: "Supabase ağ geçidine ulaşılamıyor — proje duraklatılmış olabilir (free tier 7 gün kuralı). Supabase → Settings → General → Restore project.",
    }
  }
}

export async function GET(request: Request) {
  // Hız sınırı: izleme paneli 10 req / dakika / IP
  const rl = rateLimit(`system-status:${clientIp(request)}`, 10, 60_000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  // ── Supabase URL'i çöz ──
  const envUrl = process.env.SUPABASE_API_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const supabaseUrl = envUrl
    ? envUrl.replace(/\/+$/, "")
    : `https://${SUPABASE_PROJECT_REF}.supabase.co`

  // ── 1) Veritabanı yoklaması (bu isteğin kendi DB bağlantısı) ──
  const dbStarted = Date.now()
  let dbOk = false
  let dbLatencyMs: number | null = null
  let dbError: string | null = null
  let serviceCount: number | null = null
  try {
    serviceCount = await db.service.count()
    dbOk = true
    dbLatencyMs = Date.now() - dbStarted
  } catch (e) {
    dbError = String((e as Error)?.message ?? e).slice(0, 300)
    dbLatencyMs = Date.now() - dbStarted
  }

  // ── 2) Supabase API ağ geçidi (paralel değil — DB zaten ölçüldü) ──
  const supabase = await pingSupabase(supabaseUrl)

  const info = {
    version: BRANDING.version,
    runtime: process.env.NODE_ENV,
    region: process.env.VERCEL_REGION ?? null,
    checkedAt: new Date().toISOString(),
    database: {
      ok: dbOk,
      protocol: isPostgres() ? "postgresql" : "sqlite",
      mode: isPostgres() ? "bulut (Supabase)" : "yerel (SQLite)",
      latencyMs: dbLatencyMs,
      serviceCount,
      error: dbError,
    },
    supabaseApi: {
      url: supabaseUrl,
      projectRef: SUPABASE_PROJECT_REF,
      ...supabase,
    },
    notification: {
      // Bilgi amaçlı: gerçek gönderim Vercel env değişkenlerine bağlı
      smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
      twilioConfigured: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    },
  }

  const healthy = dbOk && supabase.status === "aktif"
  return Response.json(info, {
    status: healthy ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  })
}
