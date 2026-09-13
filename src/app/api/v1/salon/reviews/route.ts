// Değerlendirme API'si (herkese açık + moderasyon)
// GET   /api/v1/salon/reviews              — onaylanmış yorumlar + puan özeti
//        ?summary=1                        — yalnızca özet
//        ?status=bekliyor                  — (ekip) moderasyon listesi
// POST  /api/v1/salon/reviews              — herkes değerlendirme yazabilir (girişsiz)
// PATCH /api/v1/salon/reviews              — (ekip) onayla / reddet

import { db } from "@/lib/db"

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const status = params.get("status")

  const reviews = await db.review.findMany({
    where: status ? { status } : { status: "onaylandi" },
    include: status ? undefined : { service: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 60,
  })

  // Puan özeti (yalnızca onaylanmış yorumlar üzerinden)
  const [approved, pendingCount] = await Promise.all([
    db.review.findMany({ where: { status: "onaylandi" }, select: { rating: true } }),
    db.review.count({ where: { status: "bekliyor" } }),
  ])
  const count = approved.length
  const average = count > 0 ? approved.reduce((s, r) => s + r.rating, 0) / count : 0
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: approved.filter((r) => r.rating === star).length,
  }))

  return Response.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      serviceName: r.service?.name ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
    summary: {
      count,
      average: Math.round(average * 10) / 10,
      distribution,
      pending: pendingCount,
    },
  })
}

// ─── Yeni değerlendirme (herkese açık, giriş gerekmez) ──────────────────────
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      authorName?: string
      rating?: number
      comment?: string
      serviceId?: string
    }

    const name = body.authorName?.trim() ?? ""
    const rating = Number(body.rating)
    const comment = body.comment?.trim() ?? ""

    if (name.length < 2) {
      return Response.json({ error: "Lütfen adınızı girin." }, { status: 400 })
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return Response.json({ error: "Lütfen 1 ile 5 arasında bir puan verin." }, { status: 400 })
    }
    if (comment.length < 5) {
      return Response.json({ error: "Lütfen en az birkaç kelimelik bir yorum yazın." }, { status: 400 })
    }
    if (comment.length > 600) {
      return Response.json({ error: "Yorum en fazla 600 karakter olabilir." }, { status: 400 })
    }

    // Hizmet geçerli mi (isteğe bağlı alan)?
    let serviceId: string | null = null
    if (body.serviceId) {
      const service = await db.service.findUnique({ where: { id: body.serviceId } })
      if (!service) {
        return Response.json({ error: "Hizmet bulunamadı." }, { status: 404 })
      }
      serviceId = service.id
    }

    const review = await db.review.create({
      data: {
        authorName: name.slice(0, 60),
        rating,
        comment,
        serviceId,
        status: "bekliyor",
      },
    })

    return Response.json(
      {
        review: {
          id: review.id,
          authorName: review.authorName,
          rating: review.rating,
          status: review.status,
        },
        message: "Değerlendirmeniz alındı — kısa incelemeden sonra yayınlanacak. Teşekkürler!",
      },
      { status: 201 },
    )
  } catch {
    return Response.json({ error: "Değerlendirme kaydedilemedi." }, { status: 500 })
  }
}

// ─── Moderasyon (ekip): onayla / reddet / sil ───────────────────────────────
const ALLOWED_STATUS = ["bekliyor", "onaylandi", "reddedildi"]

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id?: string; status?: string }
    if (!body.id || !body.status || !ALLOWED_STATUS.includes(body.status)) {
      return Response.json({ error: "Yorum kimliği ve geçerli bir durum gerekli." }, { status: 400 })
    }
    const review = await db.review.update({
      where: { id: body.id },
      data: { status: body.status },
    })
    return Response.json({
      review: { id: review.id, status: review.status, authorName: review.authorName },
    })
  } catch {
    return Response.json({ error: "Yorum bulunamadı." }, { status: 404 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { id?: string }
    if (!body.id) {
      return Response.json({ error: "Yorum kimliği gerekli." }, { status: 400 })
    }
    await db.review.delete({ where: { id: body.id } })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: "Yorum bulunamadı." }, { status: 404 })
  }
}
