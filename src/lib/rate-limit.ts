// Bellek-içi hız sınırlayıcı (sliding window) — API form koruması
// Tek sunucu süreçleri için yeterli; çoklu sunucuda (Vercel/Lambda) Redis'e
// taşınmalı (bkz. README «Üretimde kullanım»).
// Araştırma: dev.to/freecodecamp «In-Memory Rate Limiter Next.js» pattern'i.

interface RateLimitResult {
  ok: boolean
  retryAfterSec: number
}

const buckets = new Map<string, number[]>()

// Gördüğümüz en geniş pencere — periyodik temizlik güvenli eşiği
let maxWindowMs = 60_000

// ─── Periyodik bellek temizliği (globalThis'e bağıl — dev hot-reload'da çoğalmaz) ──
const SWEEP_INTERVAL_MS = 60_000

/** Her 60 saniyede bir süresi geçmiş anahtarları siler (trafik azken de bellek büyümesin). */
function ensureSweeper(): void {
  const g = globalThis as unknown as { __rateLimitSweeper?: ReturnType<typeof setInterval> }
  if (g.__rateLimitSweeper) return
  const sweeper = setInterval(() => {
    const cutoff = Date.now() - maxWindowMs
    for (const [k, v] of buckets) {
      if (v.length === 0 || v.every((t) => t <= cutoff)) buckets.delete(k)
    }
  }, SWEEP_INTERVAL_MS)
  // Node sürecini açık tutmasın (serverless/test temiz kapanır)
  ;(sweeper as unknown as { unref?: () => void }).unref?.()
  g.__rateLimitSweeper = sweeper
}

/** Anahtar başına pencere içindeki istek sayısını sayar; aşarsa red. */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs
  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart)

  if (windowMs > maxWindowMs) maxWindowMs = windowMs
  ensureSweeper()

  if (hits.length >= limit) {
    const oldest = hits[0]!
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
    buckets.set(key, hits)
    return { ok: false, retryAfterSec }
  }

  hits.push(now)
  buckets.set(key, hits)

  // Bellek temizliği: büyümesini engelle (nadiren çağrılır yeter)
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => t <= windowStart)) buckets.delete(k)
    }
  }

  return { ok: true, retryAfterSec: 0 }
}

/** İstekten istemci IP'sini çıkarır.
 *  Ters proxy (Caddy) güvenilir «x-real-ip» başlığını set eder (bkz. Caddyfile).
 *  «x-forwarded-for» istemci tarafından sahtelenebilir — SADECE son girdisi
 *  (en içteki proxy'nin eklediği gerçek IP) kabul edilir, ilk girdi asla. */
export function clientIp(request: Request): string {
  // 1) Güvenilir: proxy'nin bağlantıdan aldığı gerçek IP
  const real = request.headers.get("x-real-ip")
  if (real?.trim()) return real.trim()
  // 2) Fallback: XFF'nin son girdisi (ilk girdi istemci sahtesi olabilir)
  const fwd = request.headers.get("x-forwarded-for")
  if (fwd) {
    const parts = fwd.split(",").map((s) => s.trim()).filter(Boolean)
    if (parts.length > 0) return parts[parts.length - 1]!
  }
  return "bilinmeyen"
}

/** Standart 429 yanıtı (Türkçe mesajla). */
export function tooManyRequests(retryAfterSec: number): Response {
  return Response.json(
    {
      error: `Çok fazla istek gönderdiniz — lütfen ${retryAfterSec} saniye sonra tekrar deneyin.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "Cache-Control": "no-store",
      },
    },
  )
}
