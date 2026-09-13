// PATCH /api/v1/salon/services — hizmet düzenleme (Ekip portalı)
// İzinlenen alanlar: fiyat, süre, popüler bayrağı, aktiflik, açıklama
// Not: Fiyatlar sonraki randevularda otomatik geçerli olur (anlık görüntü sistemi).

import { db } from "@/lib/db"
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit"

// GET /api/v1/salon/services — aktif hizmetler (açılış sayfası & randevu akışı)
export async function GET() {
  const services = await db.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  })
  return Response.json({ services, count: services.length })
}

export async function PATCH(request: Request) {
  // Hız sınırı: IP başına dakikada 20 güncelleme
  const rl = rateLimit(`service-patch:${clientIp(request)}`, 20, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as {
      id?: string
      priceChf?: number
      durationMin?: number
      popular?: boolean
      active?: boolean
      description?: string
    }

    if (!body.id) {
      return Response.json({ error: "Hizmet kimliği gerekli." }, { status: 400 })
    }

    // Değer aralığı kontrolleri
    if (body.priceChf !== undefined) {
      if (!Number.isFinite(body.priceChf) || body.priceChf < 0 || body.priceChf > 100000) {
        return Response.json({ error: "Geçersiz fiyat — 0 ile 100.000 arasında bir değer girin." }, { status: 400 })
      }
    }
    if (body.durationMin !== undefined) {
      if (!Number.isInteger(body.durationMin) || body.durationMin < 5 || body.durationMin > 600) {
        return Response.json({ error: "Geçersiz süre — 5 ile 600 dakika arasında girin." }, { status: 400 })
      }
    }
    if (body.description !== undefined && body.description.length > 300) {
      return Response.json({ error: "Açıklama en fazla 300 karakter olabilir." }, { status: 400 })
    }

    const service = await db.service.update({
      where: { id: body.id },
      data: {
        ...(body.priceChf !== undefined ? { priceChf: body.priceChf } : {}),
        ...(body.durationMin !== undefined ? { durationMin: body.durationMin } : {}),
        ...(body.popular !== undefined ? { popular: body.popular } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.description !== undefined ? { description: body.description.trim() || null } : {}),
      },
    })

    return Response.json({
      service: {
        id: service.id,
        name: service.name,
        priceChf: service.priceChf,
        durationMin: service.durationMin,
        popular: service.popular,
        active: service.active,
      },
    })
  } catch {
    return Response.json({ error: "Hizmet bulunamadı veya güncellenemedi." }, { status: 404 })
  }
}
