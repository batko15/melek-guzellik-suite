// Randevu API'si (V3 — Rezervasyon Merkezi)
// GET    /api/v1/salon/bookings?phone=…              — misafir: kendi randevuları
// GET    /api/v1/salon/bookings?from=…&to=…&status=… — ekip: tüm randevular
// POST   /api/v1/salon/bookings                      — HERKES randevu alabilir (ad + telefon)
// PATCH  /api/v1/salon/bookings                      — ekip: durum değiştir · misafir: telefon ile iptal
// PUT    /api/v1/salon/bookings                      — ekip: TAM DÜZENLEME (hizmet, tarih, süre, fiyat, müşteri, notlar, durum)
// DELETE /api/v1/salon/bookings?id=…                 — ekip: randevuyu kalıcı sil

import { db } from "@/lib/db"
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit"
import { sendBookingNotification, buildMessage, type NotifyKind } from "@/lib/notify"
import { phoneDigits, canonicalPhone } from "@/lib/phone"

const STATUS_ACTIVE = ["bekliyor", "onaylandi"]
const digits = phoneDigits

interface BookingRow {
  id: string
  startAt: string
  durationMin: number
  priceChf: number
  status: string
  notes: string | null
  staffNote: string | null
  serviceId: string
  createdAt: string
  updatedAt: string
  service: { name: string; category: string }
  customer: { name: string; phone: string; email: string | null }
}

const SELECT = {
  include: {
    service: { select: { name: true, category: true } },
    customer: { select: { name: true, phone: true, email: true } },
  },
}

type DbBooking = {
  id: string
  startAt: Date
  durationMin: number
  priceChf: number
  status: string
  notes: string | null
  staffNote: string | null
  serviceId: string
  createdAt: Date
  updatedAt: Date
  service: { name: string; category: string }
  customer: { name: string; phone: string; email: string | null }
}

function toRow(b: DbBooking): BookingRow {
  return {
    id: b.id,
    startAt: b.startAt.toISOString(),
    durationMin: b.durationMin,
    priceChf: b.priceChf,
    status: b.status,
    notes: b.notes,
    staffNote: b.staffNote,
    serviceId: b.serviceId,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    service: { name: b.service.name, category: b.service.category },
    customer: { name: b.customer.name, phone: b.customer.phone, email: b.customer.email },
  }
}

async function listBookings(params: URLSearchParams): Promise<BookingRow[]> {
  const phone = params.get("phone")
  const from = params.get("from")
  const to = params.get("to")
  const status = params.get("status")

  const bookings = await db.booking.findMany({
    where: {
      ...(phone ? { customer: { phone } } : {}),
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            startAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lt: new Date(to) } : {}),
            },
          }
        : {}),
    },
    ...SELECT,
    orderBy: { startAt: "asc" },
  })

  return bookings.map(toRow)
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const bookings = await listBookings(params)
  return Response.json({ bookings, count: bookings.length })
}

// ─── Yeni randevu — HERKES, giriş gerekmez ──────────────────────────────────
export async function POST(request: Request) {
  // Hız sınırı: IP başına 10 dakikada en fazla 5 randevu (form suistimaline karşı)
  const rl = rateLimit(`booking:${clientIp(request)}`, 5, 10 * 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as {
      customerName?: string
      customerPhone?: string
      customerEmail?: string
      serviceId?: string
      startAt?: string
      notes?: string
      staffNote?: string
      byStaff?: boolean
    }

    const name = body.customerName?.trim() ?? ""
    // V3: telefonlar kanonik biçimde saklanır («+90 5XX XXX XX XX») —
    // farklı biçimde girilen aynı numara tek müşteri kaydına bağlanır
    const phone = canonicalPhone(body.customerPhone ?? "")
    const email = body.customerEmail?.trim().toLowerCase() ?? ""

    if (name.length < 2) {
      return Response.json({ error: "Lütfen adınızı girin." }, { status: 400 })
    }
    if (digits(phone).length < 7) {
      return Response.json({ error: "Lütfen geçerli bir telefon numarası girin." }, { status: 400 })
    }
    if (!body.serviceId || !body.startAt) {
      return Response.json({ error: "Hizmet ve randevu saati zorunludur." }, { status: 400 })
    }

    const service = await db.service.findUnique({ where: { id: body.serviceId } })
    if (!service) {
      return Response.json({ error: "Hizmet bulunamadı." }, { status: 404 })
    }

    // Randevu tarihi geçmişte olamaz ve en fazla 60 gün ileride olabilir
    // (istisna: ekip geçmişe düzeltme kaydı girebilir)
    const start = new Date(body.startAt)
    const now = new Date()
    const isStaff = body.byStaff === true
    if (Number.isNaN(start.getTime())) {
      return Response.json({ error: "Geçersiz tarih." }, { status: 400 })
    }
    if (!isStaff && start.getTime() < now.getTime() - 60000) {
      return Response.json({ error: "Geçmiş bir tarihe randevu alınamaz." }, { status: 400 })
    }
    if (!isStaff && start.getTime() > now.getTime() + 60 * 24 * 3600 * 1000) {
      return Response.json({ error: "Randevu en fazla 60 gün ileride alınabilir." }, { status: 400 })
    }

    // Müşteriyi telefon numarasına göre bul veya oluştur (girişsiz)
    const customer = await db.salonCustomer.upsert({
      where: { phone },
      update: { name, ...(email ? { email } : {}) },
      create: { name, phone, email: email || null },
    })

    // Çakışma kontrolü (yalnızca bekleyen/onaylı randevular)
    const end = new Date(start.getTime() + service.durationMin * 60000)
    const dayStart = new Date(start)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const overlapping = await db.booking.findMany({
      where: { startAt: { gte: dayStart, lt: dayEnd }, status: { in: STATUS_ACTIVE } },
      select: { startAt: true, durationMin: true },
    })
    const clash = overlapping.some((b) => {
      const bEnd = new Date(b.startAt.getTime() + b.durationMin * 60000)
      return b.startAt < end && bEnd > start
    })
    if (clash) {
      return Response.json(
        { error: "Bu saat maalesef dolu — lütfen başka bir saat seçin." },
        { status: 409 },
      )
    }

    const booking = await db.booking.create({
      data: {
        customerId: customer.id,
        serviceId: service.id,
        startAt: start,
        durationMin: service.durationMin,
        priceChf: service.priceChf,
        status: "bekliyor",
        notes: body.notes?.trim() || null,
        staffNote: isStaff ? body.staffNote?.trim() || null : null,
      },
      ...SELECT,
    })

    // Bildirim kancası: WhatsApp onay bağlantısı üret (konsol logu + istemci butonu)
    const notification = sendBookingNotification({
      customerName: customer.name,
      customerPhone: customer.phone,
      serviceName: service.name,
      startAt: start,
      price: service.priceChf,
      notes: body.notes?.trim() || null,
    })

    return Response.json(
      {
        booking: {
          id: booking.id,
          startAt: booking.startAt.toISOString(),
          durationMin: booking.durationMin,
          priceChf: booking.priceChf,
          status: booking.status,
          serviceName: booking.service.name,
          customerName: customer.name,
          customerPhone: customer.phone,
        },
        whatsappUrl: notification.whatsappUrl,
      },
      { status: 201 },
    )
  } catch {
    return Response.json({ error: "Randevu oluşturulamadı." }, { status: 500 })
  }
}

// ─── Durum değişikliği (PATCH) ──────────────────────────────────────────────
// Ekip:  { id, status }                       — tüm geçişler (bekliyor|onaylandi|tamamlandi|iptal|gelmedi)
// Misafir: { id, status: "iptal", phone }     — yalnızca kendi randevusunu iptal edebilir
const ALLOWED_STATUS = ["bekliyor", "onaylandi", "tamamlandi", "iptal", "gelmedi"]

/** Durum değişince müşteriye gönderilecek hazır bildirim mesajını üretir. */
function statusNotificationKind(status: string): NotifyKind | null {
  switch (status) {
    case "onaylandi": return "onay"
    case "iptal": return "iptal"
    case "tamamlandi": return "tamamlandi"
    default: return null // bekliyor / gelmedi → otomatik mesaj yok
  }
}

export async function PATCH(request: Request) {
  // Hız sınırı: IP başına dakikada 30 durum değişikliği
  const rl = rateLimit(`booking-patch:${clientIp(request)}`, 30, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as { id?: string; status?: string; phone?: string }
    if (!body.id || !body.status || !ALLOWED_STATUS.includes(body.status)) {
      return Response.json({ error: "Randevu kimliği ve geçerli bir durum gerekli." }, { status: 400 })
    }

    const existing = await db.booking.findUnique({
      where: { id: body.id },
      ...SELECT,
    })
    if (!existing) {
      return Response.json({ error: "Randevu bulunamadı." }, { status: 404 })
    }

    // Misafir-iptali: telefon numarası eşleşmeli ve yalnızca iptal mümkün
    if (body.phone) {
      if (body.status !== "iptal") {
        return Response.json({ error: "Randevu yalnızca iptal edilebilir." }, { status: 403 })
      }
      // DÜZELTME (V3): biçim farklarına karşı normalize rakamlarla karşılaştır
      // («+90 532 111 22 33» ≡ «0532 111 22 33» ≡ «532 111 22 33»)
      if (phoneDigits(existing.customer.phone) !== phoneDigits(body.phone.trim())) {
        return Response.json({ error: "Bu randevu bu telefon numarasına ait değil." }, { status: 403 })
      }
      if (existing.status === "tamamlandi" || existing.status === "gelmedi") {
        return Response.json({ error: "Bu randevu artık iptal edilemez." }, { status: 400 })
      }
    }

    const booking = await db.booking.update({
      where: { id: body.id },
      data: { status: body.status },
      ...SELECT,
    })

    // Durum değişiminde müşteri bildirim mesajını hazır üret (ekip isterse gönderir)
    const kind = statusNotificationKind(body.status)
    const message =
      kind && !body.phone
        ? buildMessage(kind, {
            customerName: booking.customer.name,
            customerPhone: booking.customer.phone,
            serviceName: booking.service.name,
            startAt: booking.startAt,
            price: booking.priceChf,
            notes: booking.notes,
          })
        : null

    return Response.json({
      booking: {
        id: booking.id,
        status: booking.status,
        serviceName: booking.service.name,
        customerName: booking.customer.name,
      },
      ...(message ? { notifyMessage: message, notifyKind: kind } : {}),
    })
  } catch {
    return Response.json({ error: "Randevu bulunamadı." }, { status: 404 })
  }
}

// ─── TAM DÜZENLEME (PUT) — Rezervasyon Merkezi ──────────────────────────────
// { id, serviceId?, startAt?, durationMin?, priceChf?, customerName?,
//   customerPhone?, customerEmail?, notes?, staffNote?, status? }
export async function PUT(request: Request) {
  // Hız sınırı: IP başına dakikada 20 düzenleme
  const rl = rateLimit(`booking-put:${clientIp(request)}`, 20, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as {
      id?: string
      serviceId?: string
      startAt?: string
      durationMin?: number
      priceChf?: number
      customerName?: string
      customerPhone?: string
      customerEmail?: string
      notes?: string | null
      staffNote?: string | null
      status?: string
    }
    if (!body.id) {
      return Response.json({ error: "Randevu kimliği gerekli." }, { status: 400 })
    }

    const existing = await db.booking.findUnique({ where: { id: body.id }, ...SELECT })
    if (!existing) {
      return Response.json({ error: "Randevu bulunamadı." }, { status: 404 })
    }

    // ── Hizmet doğrulama & anlık görüntü güncellemesi ──
    let service = existing.service
    let serviceId = existing.serviceId
    if (body.serviceId && body.serviceId !== existing.serviceId) {
      const svc = await db.service.findUnique({ where: { id: body.serviceId } })
      if (!svc) return Response.json({ error: "Hizmet bulunamadı." }, { status: 404 })
      service = { name: svc.name, category: svc.category }
      serviceId = svc.id
    }

    // ── Tarih/saat doğrulama (ekip geçmişe de kayıt girebilir) ──
    let start = existing.startAt
    if (body.startAt !== undefined) {
      const s = new Date(body.startAt)
      if (Number.isNaN(s.getTime())) {
        return Response.json({ error: "Geçersiz tarih/saat." }, { status: 400 })
      }
      start = s
    }

    // ── Süre & fiyat aralık kontrolü ──
    const durationMin = body.durationMin ?? existing.durationMin
    const priceChf = body.priceChf ?? existing.priceChf
    if (durationMin < 5 || durationMin > 600) {
      return Response.json({ error: "Süre 5–600 dakika arasında olmalı." }, { status: 400 })
    }
    if (priceChf < 0 || priceChf > 100000) {
      return Response.json({ error: "Fiyat 0–100.000 arasında olmalı." }, { status: 400 })
    }

    // ── Müşteri alanları ──
    const name = (body.customerName ?? existing.customer.name).trim()
    // V3: kanonik biçim (+90 5XX XXX XX XX) — yerel biçim girilse bile aynı kayda bağlanır
    const phone = body.customerPhone !== undefined ? canonicalPhone(body.customerPhone) : existing.customer.phone
    const email = (body.customerEmail ?? existing.customer.email ?? "").trim().toLowerCase()
    if (name.length < 2) {
      return Response.json({ error: "Müşteri adı en az 2 karakter olmalı." }, { status: 400 })
    }
    if (digits(phone).length < 7) {
      return Response.json({ error: "Geçerli bir telefon numarası gerekli." }, { status: 400 })
    }

    // Telefon değiştiyse → hedef müşteriyi bul/oluştur (upsert), randevuyu aktar
    let customerId: string | undefined = undefined
    if (digits(existing.customer.phone) !== digits(phone)) {
      const target = await db.salonCustomer.upsert({
        where: { phone },
        update: { name, ...(email ? { email } : {}) },
        create: { name, phone, email: email || null },
      })
      customerId = target.id
    } else if (name !== existing.customer.name || (email || null) !== existing.customer.email) {
      // Aynı müşteri (rakamlar aynı) → kayıtlı telefon anahtarıyla iletişim bilgisini güncelle
      await db.salonCustomer.update({
        where: { phone: existing.customer.phone },
        data: { name, ...(email ? { email } : {}) },
      })
    }

    // ── Durum doğrulama ──
    const status = body.status ?? existing.status
    if (!ALLOWED_STATUS.includes(status)) {
      return Response.json({ error: "Geçersiz durum." }, { status: 400 })
    }

    // ── Çakışma kontrolü (kendisi hariç) ──
    const end = new Date(start.getTime() + durationMin * 60000)
    const dayStart = new Date(start)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    const overlapping = await db.booking.findMany({
      where: {
        startAt: { gte: dayStart, lt: dayEnd },
        status: { in: STATUS_ACTIVE },
        id: { not: existing.id }, // ← kendisi hariç
      },
      select: { startAt: true, durationMin: true },
    })
    const clash = overlapping.some((b) => {
      const bEnd = new Date(b.startAt.getTime() + b.durationMin * 60000)
      return b.startAt < end && bEnd > start
    })
    if (clash && status !== "iptal") {
      return Response.json(
        { error: "Bu saatte başka bir randevu var — çakışıyor. Farklı bir saat seçin." },
        { status: 409 },
      )
    }

    // ── Güncelle ──
    const booking = await db.booking.update({
      where: { id: existing.id },
      data: {
        ...(serviceId !== existing.serviceId ? { serviceId } : {}),
        ...(customerId ? { customerId } : {}),
        startAt: start,
        durationMin,
        priceChf,
        status,
        notes: body.notes !== undefined ? body.notes?.trim() || null : existing.notes,
        staffNote: body.staffNote !== undefined ? body.staffNote?.trim() || null : existing.staffNote,
      },
      ...SELECT,
    })

    // Değişiklik bildirimi (tarih veya hizmet değiştiyse) — ekip isterse gönderir
    const changed =
      start.getTime() !== existing.startAt.getTime() || serviceId !== existing.serviceId
    const notifyMessage = changed
      ? buildMessage("degisiklik", {
          customerName: booking.customer.name,
          customerPhone: booking.customer.phone,
          serviceName: existing.service.name,
          startAt: existing.startAt,
          newStartAt: booking.startAt,
          newServiceName: booking.service.name,
          price: booking.priceChf,
        })
      : null

    return Response.json({
      booking: toRow(booking),
      ...(notifyMessage ? { notifyMessage, notifyKind: "degisiklik" as const } : {}),
    })
  } catch (e) {
    console.error("[PUT bookings]", e)
    return Response.json({ error: "Randevu güncellenemedi." }, { status: 500 })
  }
}

// ─── Kalıcı silme (DELETE) — ekip ───────────────────────────────────────────
export async function DELETE(request: Request) {
  const rl = rateLimit(`booking-delete:${clientIp(request)}`, 20, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const id = new URL(request.url).searchParams.get("id")
    if (!id) {
      return Response.json({ error: "Randevu kimliği gerekli." }, { status: 400 })
    }
    const existing = await db.booking.findUnique({ where: { id }, ...SELECT })
    if (!existing) {
      return Response.json({ error: "Randevu bulunamadı." }, { status: 404 })
    }
    await db.booking.delete({ where: { id } })
    return Response.json({
      deleted: true,
      booking: {
        id,
        customerName: existing.customer.name,
        serviceName: existing.service.name,
        startAt: existing.startAt.toISOString(),
      },
    })
  } catch {
    return Response.json({ error: "Randevu silinemedi." }, { status: 500 })
  }
}
