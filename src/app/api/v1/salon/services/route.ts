// PATCH /api/v1/salon/services — hizmet düzenleme (Ekip portalı)
// İzinlenen alanlar: fiyat, süre, popüler bayrağı, aktiflik, açıklama
// Not: Fiyatlar sonraki randevularda otomatik geçerli olur (anlık görüntü sistemi).

import { db } from "@/lib/db"
import { requireStaff } from "@/lib/auth"
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit"
import { dbUnavailable, isDbInitError } from "@/lib/api-errors"

// GET /api/v1/salon/services — aktif hizmetler (açılış sayfası & randevu akışı)
export async function GET() {
  try {
    const services = await db.service.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    })
    return Response.json({ services, count: services.length })
  } catch (e) {
    return dbUnavailable(String((e as Error)?.message ?? e))
  }
}

export async function PATCH(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

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
  } catch (e) {
    if (String((e as { code?: string })?.code ?? "") === "P2025") {
      return Response.json({ error: "Hizmet bulunamadı." }, { status: 404 })
    }
    console.error("[PATCH services]", e)
    return Response.json({ error: "Hizmet güncellenemedi." }, { status: 500 })
  }
}

// PUT /api/v1/salon/services — TOPLU FİYAT GÜNCELLEME (V5.1)
// Alle Preise auf einen Schlag: Prozent oder fester Betrag, optional auf eine
// Kategorie begrenzt. Beispiel:
//   { "mode": "percent", "value": 10 }          → alle Preise +10 %
//   { "mode": "amount",  "value": -50, "category": "tirnak" } → Tırnak −50 ₺
export async function PUT(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  // Hız sınırı: IP başına dakikada 10 toplu güncelleme
  const rl = rateLimit(`service-bulk:${clientIp(request)}`, 10, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as {
      mode?: string
      value?: number
      category?: string
    }

    if (body.mode !== "percent" && body.mode !== "amount") {
      return Response.json({ error: "Mod 'percent' (yüzde) veya 'amount' (tutar) olmalıdır." }, { status: 400 })
    }
    if (!Number.isFinite(body.value)) {
      return Response.json({ error: "Geçerli bir sayı girin." }, { status: 400 })
    }
    const value = body.value as number
    if (body.mode === "percent" && (value < -90 || value > 500)) {
      return Response.json({ error: "Yüzde −90 ile +500 arasında olmalıdır." }, { status: 400 })
    }
    if (body.mode === "amount" && (value < -50000 || value > 50000)) {
      return Response.json({ error: "Tutar −50.000 ile +50.000 ₺ arasında olmalıdır." }, { status: 400 })
    }
    const category = body.category?.trim()
    if (category && !["tirnak", "guzellik", "kirpik"].includes(category)) {
      return Response.json({ error: "Geçersiz kategori." }, { status: 400 })
    }

    const where = {
      active: true,
      ...(category ? { category } : {}),
    }
    const services = await db.service.findMany({ where, orderBy: { sortOrder: "asc" } })
    if (services.length === 0) {
      return Response.json({ error: "Güncellenecek hizmet bulunamadı." }, { status: 404 })
    }

    const updated: Array<{ id: string; name: string; oldPrice: number; newPrice: number }> = []
    for (const s of services) {
      const raw =
        body.mode === "percent"
          ? s.priceChf * (1 + value / 100)
          : s.priceChf + value
      const newPrice = Math.max(0, Math.min(100000, Math.round(raw)))
      if (newPrice === s.priceChf) continue
      await db.service.update({ where: { id: s.id }, data: { priceChf: newPrice } })
      updated.push({ id: s.id, name: s.name, oldPrice: s.priceChf, newPrice })
    }

    return Response.json({
      updatedCount: updated.length,
      checkedCount: services.length,
      services: updated,
    })
  } catch (e) {
    if (isDbInitError(e)) return dbUnavailable(String((e as Error)?.message ?? e))
    console.error("[PUT services]", e)
    return Response.json({ error: "Toplu fiyat güncellemesi başarısız." }, { status: 500 })
  }
}
