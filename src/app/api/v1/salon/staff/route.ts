// Ekip API'si (V4 ULTIMATE — ekip üyeleri + komisyon/prim hesaplayıcı)
// GET    /api/v1/salon/staff         — üyeler + ciro/randevu/prim istatistikleri
// POST   /api/v1/salon/staff         — yeni ekip üyesi
// PUT    /api/v1/salon/staff         — güncelle (oran, ad, rol, aktif)
// DELETE /api/v1/salon/staff?id=…    — sil (randevuları önce serbest bırak)

import { db } from "@/lib/db"
import { requireStaff } from "@/lib/auth"
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit"

function isRecordNotFound(e: unknown): boolean {
  return String((e as { code?: string })?.code ?? "") === "P2025"
}

export async function GET(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  const params = new URL(request.url).searchParams
  const month = params.get("month") // "YYYY-MM" — aylık prim görünümü (opsiyonel)

  try {
  const members = await db.staffMember.findMany({
    include: {
      bookings: {
        select: { startAt: true, priceChf: true, status: true, durationMin: true },
        orderBy: { startAt: "desc" },
      },
    },
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
  })

  const now = new Date()
  // Ay filtresi (opsiyonel): YYYY-MM → ay başı/sonu; yoksa tüm zamanlar
  let rangeStart: Date | null = null
  let rangeEnd: Date | null = null
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number)
    rangeStart = new Date(y, m - 1, 1)
    rangeEnd = new Date(y, m, 1)
  }

  const rows = members.map((s) => {
    const inRange = s.bookings.filter((b) =>
      (!rangeStart || b.startAt >= rangeStart) && (!rangeEnd || b.startAt < rangeEnd),
    )
    const completed = inRange.filter((b) => b.status === "tamamlandi")
    const revenue = completed.reduce((sum, b) => sum + b.priceChf, 0)
    const commission = Math.round((revenue * s.commissionRate) / 100 * 100) / 100
    const upcoming = s.bookings.filter(
      (b) => b.startAt >= now && (b.status === "bekliyor" || b.status === "onaylandi"),
    )
    return {
      id: s.id,
      name: s.name,
      role: s.role,
      commissionRate: s.commissionRate,
      phone: s.phone,
      active: s.active,
      stats: {
        bookings: inRange.length,
        completed: completed.length,
        revenueChf: Math.round(revenue * 100) / 100,
        commissionChf: commission,
        upcoming: upcoming.length,
        hoursBooked: Math.round(completed.reduce((sum, b) => sum + b.durationMin, 0) / 6) / 10,
      },
    }
  })

  return Response.json({
    staff: rows,
    count: rows.length,
    totalCommission: Math.round(rows.reduce((s, r) => s + r.stats.commissionChf, 0) * 100) / 100,
    range: month ?? "all",
  })
  } catch (e) {
    console.error("[GET staff]", e)
    return Response.json({ error: "Ekip üyeleri yüklenemedi." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  const rl = rateLimit(`staff-post:${clientIp(request)}`, 10, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as {
      name?: string
      role?: string
      commissionRate?: number
      phone?: string
    }
    const name = body.name?.trim() ?? ""
    if (name.length < 2) {
      return Response.json({ error: "İsim en az 2 karakter olmalı." }, { status: 400 })
    }
    const rate = body.commissionRate ?? 0
    if (rate < 0 || rate > 90) {
      return Response.json({ error: "Prim oranı 0–90% arasında olmalı." }, { status: 400 })
    }
    const member = await db.staffMember.create({
      data: {
        name,
        role: body.role?.trim() || "Tırnak Sanatçısı",
        commissionRate: rate,
        phone: body.phone?.trim() || null,
      },
    })
    return Response.json({ staff: { id: member.id, name: member.name } }, { status: 201 })
  } catch {
    return Response.json({ error: "Ekip üyesi eklenemedi." }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  const rl = rateLimit(`staff-put:${clientIp(request)}`, 20, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as {
      id?: string
      name?: string
      role?: string
      commissionRate?: number
      phone?: string | null
      active?: boolean
    }
    if (!body.id) {
      return Response.json({ error: "Ekip kimliği gerekli." }, { status: 400 })
    }
    const existing = await db.staffMember.findUnique({ where: { id: body.id } })
    if (!existing) {
      return Response.json({ error: "Ekip üyesi bulunamadı." }, { status: 404 })
    }

    const rate = body.commissionRate ?? existing.commissionRate
    if (rate < 0 || rate > 90) {
      return Response.json({ error: "Prim oranı 0–90% arasında olmalı." }, { status: 400 })
    }
    if (body.name !== undefined && body.name.trim().length < 2) {
      return Response.json({ error: "İsim en az 2 karakter olmalı." }, { status: 400 })
    }

    const member = await db.staffMember.update({
      where: { id: body.id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.role !== undefined ? { role: body.role.trim() } : {}),
        commissionRate: rate,
        ...(body.phone !== undefined ? { phone: body.phone?.trim() || null } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
    })
    return Response.json({ staff: { id: member.id, name: member.name, commissionRate: member.commissionRate } })
  } catch (e) {
    if (isRecordNotFound(e)) {
      return Response.json({ error: "Ekip üyesi bulunamadı." }, { status: 404 })
    }
    console.error("[PUT staff]", e)
    return Response.json({ error: "Ekip üyesi güncellenemedi." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  const rl = rateLimit(`staff-delete:${clientIp(request)}`, 10, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const id = new URL(request.url).searchParams.get("id")
    if (!id) {
      return Response.json({ error: "Ekip kimliği gerekli." }, { status: 400 })
    }
    const existing = await db.staffMember.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Ekip üyesi bulunamadı." }, { status: 404 })
    }
    // Randevuları önce serbest bırak (FK ihlali olmasın)
    await db.booking.updateMany({ where: { staffId: id }, data: { staffId: null } })
    await db.staffMember.delete({ where: { id } })
    return Response.json({ deleted: true, id })
  } catch (e) {
    if (isRecordNotFound(e)) {
      return Response.json({ error: "Ekip üyesi bulunamadı." }, { status: 404 })
    }
    console.error("[DELETE staff]", e)
    return Response.json({ error: "Ekip üyesi silinemedi." }, { status: 500 })
  }
}
