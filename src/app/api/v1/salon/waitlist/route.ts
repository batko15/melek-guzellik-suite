// Bekleme Listesi API'si (V5.4 — dolu günler için otomatik geri doldurma)
// GET    /api/v1/salon/waitlist             — ekip: tüm kayıtlar (yakın tarih önce)
//         ?date=YYYY-MM-DD                  — sadece belirli gün (iptal geri doldurma)
//         ?upcoming=1                       — yalnızca bugün ve sonrası
// POST   /api/v1/salon/waitlist             — HERKES listeye katılır (ad + telefon + istenen gün)
// PATCH  /api/v1/salon/waitlist             — ekip: durum güncelle (teklif/randevu/iptal)
// DELETE /api/v1/salon/waitlist?id=…        — ekip: kaydı kalıcı sil

import { db } from "@/lib/db"
import { requireStaff } from "@/lib/auth"
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit"
import { phoneDigits, canonicalPhone } from "@/lib/phone"
import { BRANDING } from "@/config/branding"

const ALLOWED_STATUS = ["bekliyor", "teklif", "randevu", "iptal"]

interface WaitlistRow {
  id: string
  name: string
  phone: string
  serviceId: string | null
  serviceName: string | null
  desiredDate: string
  note: string | null
  status: string
  createdAt: string
}

function toRow(w: {
  id: string; name: string; phone: string; serviceId: string | null; desiredDate: Date
  note: string | null; status: string; createdAt: Date; service?: { name: string } | null
}): WaitlistRow {
  return {
    id: w.id,
    name: w.name,
    phone: w.phone,
    serviceId: w.serviceId,
    serviceName: w.service?.name ?? null,
    desiredDate: w.desiredDate.toISOString(),
    note: w.note,
    status: w.status,
    createdAt: w.createdAt.toISOString(),
  }
}

const INCLUDE = { include: { service: { select: { name: true } } } }

export async function GET(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  const params = new URL(request.url).searchParams
  const date = params.get("date")
  const upcoming = params.get("upcoming")
  const status = params.get("status")

  const dayStart = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : null

  try {
  const entries = await db.waitlistEntry.findMany({
    where: {
      ...(dayStart ? { desiredDate: dayStart } : {}),
      ...(status ? { status } : {}),
      ...(upcoming === "1" ? { desiredDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } : {}),
    },
    ...INCLUDE,
    orderBy: [{ desiredDate: "asc" }, { createdAt: "asc" }],
  })

  return Response.json({
    entries: entries.map(toRow),
    count: entries.length,
  })
  } catch (e) {
    console.error("[GET waitlist]", e)
    return Response.json({ error: "Bekleme listesi yüklenemedi." }, { status: 500 })
  }
}

// ─── Listeye katıl — HERKES, giriş gerekmez ─────────────────────────────────
export async function POST(request: Request) {
  // Hız sınırı: IP başına 10 dakikada en fazla 5 kayıt
  const rl = rateLimit(`waitlist:${clientIp(request)}`, 5, 10 * 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as {
      name?: string
      phone?: string
      serviceId?: string
      desiredDate?: string
      note?: string
    }

    const name = body.name?.trim() ?? ""
    const phone = canonicalPhone(body.phone ?? "")
    const note = body.note?.trim() ?? ""

    if (name.length < 2) {
      return Response.json({ error: "Lütfen adınızı girin." }, { status: 400 })
    }
    if (phoneDigits(phone).length < 7) {
      return Response.json({ error: "Lütfen geçerli bir telefon numarası girin." }, { status: 400 })
    }
    if (!body.desiredDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.desiredDate)) {
      return Response.json({ error: "Geçerli bir istenen tarih gerekli (YYYY-MM-DD)." }, { status: 400 })
    }

    const desired = new Date(`${body.desiredDate}T00:00:00`)
    if (Number.isNaN(desired.getTime())) {
      return Response.json({ error: "Geçersiz tarih." }, { status: 400 })
    }
    const today = new Date(new Date().setHours(0, 0, 0, 0))
    if (desired.getTime() < today.getTime()) {
      return Response.json({ error: "Geçmiş bir tarih için bekleme listesine eklenemez." }, { status: 400 })
    }
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + 60)
    if (desired.getTime() > maxDate.getTime()) {
      return Response.json({ error: "En fazla 60 gün ilerisi için kayıt yapılabilir." }, { status: 400 })
    }
    if (note.length > 300) {
      return Response.json({ error: "Not en fazla 300 karakter olabilir." }, { status: 400 })
    }

    // Hizmet geçerli mi? (opsiyonel alan)
    let serviceId: string | null = null
    if (body.serviceId) {
      const svc = await db.service.findUnique({ where: { id: body.serviceId } })
      if (!svc) {
        return Response.json({ error: "Hizmet bulunamadı." }, { status: 404 })
      }
      serviceId = svc.id
    }

    // Aynı telefon + aynı gün zaten kayıtlı mı? (çift kayıt önle)
    const existing = await db.waitlistEntry.findFirst({
      where: {
        phone,
        desiredDate: desired,
        status: { in: ["bekliyor", "teklif"] },
      },
    })
    if (existing) {
      return Response.json(
        { error: "Bu telefon numarası bu tarih için zaten bekleme listesinde." },
        { status: 409 },
      )
    }

    const entry = await db.waitlistEntry.create({
      data: {
        name,
        phone,
        serviceId,
        desiredDate: desired,
        note: note || null,
        status: "bekliyor",
      },
      ...INCLUDE,
    })

    // Stüdyoya bilgilendirme WhatsApp bağlantısı
    const waPhone = (BRANDING.company.whatsapp ?? BRANDING.company.phone).replace(/\D/g, "")
    const dateLabel = desired.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })
    const waText = encodeURIComponent(
      `📋 Bekleme listesi kaydı\n${name} (${phone})\nİstenen gün: ${dateLabel}` +
        (entry.service?.name ? `\nHizmet: ${entry.service.name}` : "") +
        (note ? `\nNot: ${note}` : ""),
    )

    return Response.json(
      {
        entry: toRow(entry),
        whatsappUrl: waPhone ? `https://wa.me/${waPhone}?text=${waText}` : null,
      },
      { status: 201 },
    )
  } catch {
    return Response.json({ error: "Bekleme listesi kaydı oluşturulamadı." }, { status: 500 })
  }
}

// ─── Durum güncelle (PATCH) — ekip ──────────────────────────────────────────
// { id, status } — teklif verildi / randevu oluştu / iptal
export async function PATCH(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  const rl = rateLimit(`waitlist-patch:${clientIp(request)}`, 30, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as { id?: string; status?: string }
    if (!body.id || !body.status || !ALLOWED_STATUS.includes(body.status)) {
      return Response.json({ error: "Kayıt kimliği ve geçerli bir durum gerekli." }, { status: 400 })
    }

    const existing = await db.waitlistEntry.findUnique({ where: { id: body.id } })
    if (!existing) {
      return Response.json({ error: "Bekleme listesi kaydı bulunamadı." }, { status: 404 })
    }

    const entry = await db.waitlistEntry.update({
      where: { id: body.id },
      data: { status: body.status },
      ...INCLUDE,
    })

    return Response.json({ entry: toRow(entry) })
  } catch {
    return Response.json({ error: "Kayıt güncellenemedi." }, { status: 500 })
  }
}

// ─── Kalıcı sil (DELETE) — ekip ─────────────────────────────────────────────
export async function DELETE(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  const rl = rateLimit(`waitlist-delete:${clientIp(request)}`, 30, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const id = new URL(request.url).searchParams.get("id")
    if (!id) {
      return Response.json({ error: "Kayıt kimliği gerekli." }, { status: 400 })
    }
    const existing = await db.waitlistEntry.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Kayıt bulunamadı." }, { status: 404 })
    }
    await db.waitlistEntry.delete({ where: { id } })
    return Response.json({ deleted: true, id })
  } catch {
    return Response.json({ error: "Kayıt silinemedi." }, { status: 500 })
  }
}
