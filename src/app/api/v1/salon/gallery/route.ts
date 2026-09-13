// Galeri API'si (V4 — portfolyo desteğiyle)
// GET   /api/v1/salon/gallery                    — aktif öğeler (customerId dahil)
// PATCH /api/v1/salon/gallery                    — öğeyi müşteri portfolyosuna bağla / çöz
import { db } from "@/lib/db"
import { requireStaff } from "@/lib/auth"
import { dbUnavailable } from "@/lib/api-errors"
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit"

export async function GET() {
  try {
  const items = await db.galleryItem.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      category: true,
      imagePath: true,
      sortOrder: true,
      customerId: true,
      createdAt: true,
    },
  })
  return Response.json({ items, count: items.length })

  } catch (e) {
    return dbUnavailable(String((e as Error)?.message ?? e))
  }
}

// ─── Portfolyo bağlama (PATCH) — ekip ───────────────────────────────────────
// { id, customerId: "…" | null } — çalışmayı müşteri portfolyosuna bağla/çıkar
export async function PATCH(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  const rl = rateLimit(`gallery-patch:${clientIp(request)}`, 30, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as { id?: string; customerId?: string | null }
    if (!body.id) {
      return Response.json({ error: "Galeri öğesi kimliği gerekli." }, { status: 400 })
    }
    const existing = await db.galleryItem.findUnique({ where: { id: body.id } })
    if (!existing) {
      return Response.json({ error: "Galeri öğesi bulunamadı." }, { status: 404 })
    }
    if (body.customerId) {
      const customer = await db.salonCustomer.findUnique({ where: { id: body.customerId } })
      if (!customer) {
        return Response.json({ error: "Müşteri bulunamadı." }, { status: 404 })
      }
    }
    const item = await db.galleryItem.update({
      where: { id: body.id },
      data: { customerId: body.customerId ?? null },
    })
    return Response.json({
      item: { id: item.id, title: item.title, customerId: item.customerId },
    })
  } catch {
    return Response.json({ error: "Galeri öğesi güncellenemedi." }, { status: 500 })
  }
}
