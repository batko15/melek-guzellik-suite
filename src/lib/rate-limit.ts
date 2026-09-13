// Bellek-içi hız sınırlayıcı (sliding window) — API form koruması
// Tek sunucu süreçleri için yeterli; çoklu sunucuda (Vercel/Lambda) Redis'e
// taşınmalı (bkz. README «Üretimde kullanım»).
// Araştırma: dev.to/freecodecamp «In-Memory Rate Limiter Next.js» pattern'i.

interface RateLimitResult {
  ok: boolean
  retryAfterSec: number
}

const buckets = new Map<string, number[]>()

/** Anahtar başına pencere içindeki istek sayısını sayar; aşarsa red. */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs
  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart)

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

/** İstekten istemci IP'sini çıkarır (proxy arkasında X-Forwarded-For). */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]!.trim()
  return request.headers.get("x-real-ip") ?? "bilinmeyen"
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
