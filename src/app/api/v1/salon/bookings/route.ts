// Randevu API'si (V3 — Rezervasyon Merkezi · V5.7.1 güvenlik güncellemesi)
// GET    /api/v1/salon/bookings?phone=…              — misafir: kendi randevuları (hız sınırı + küçültülmüş alanlar)
// GET    /api/v1/salon/bookings?from=…&to=…&status=… — ekip (oturum): tüm randevular
// POST   /api/v1/salon/bookings                      — HERKES randevu alabilir (ad + telefon); ekip alanları yalnızca oturumla
// PATCH  /api/v1/salon/bookings                      — ekip: durum değiştir · misafir: telefon ile SADECE iptal
// PUT    /api/v1/salon/bookings                      — ekip: TAM DÜZENLEME (hizmet, tarih, süre, fiyat, müşteri, notlar, durum)
// DELETE /api/v1/salon/bookings?id=…                 — ekip: randevuyu kalıcı sil
//
// V5.7.1 GÜVENLİK:
//  • Oturum yoksa: GET yalnızca ?phone= ile (KVKK — küçültülmüş alanlar),
//    PATCH yalnızca kendi randevusunu iptal (telefon eşleşmesi), PUT/DELETE kapalı.
//  • Çakışma kontrolü + oluşturma TEK Seriştirilebilir işlemde (W1 — yarış koşulu yok).
//  • Sadakat puanı koşullu updateMany ile bir kez verilir (W3 — çift puan yok).

import { db } from "@/lib/db"
import { requireStaff } from "@/lib/auth"
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit"
import { sendBookingNotification, buildMessage, type NotifyKind } from "@/lib/notify"
import { notifyStudioNewBooking, notifyCustomer } from "@/lib/notify-send"
import { phoneDigits, canonicalPhone } from "@/lib/phone"
import { dbUnavailable, isDbInitError } from "@/lib/api-errors"

const STATUS_ACTIVE = ["bekliyor", "onaylandi"]
const digits = phoneDigits

// Prisma «kayıt bulunamadı» hatası (P2025) — 404 dönmeli, 500 değil
function isRecordNotFound(e: unknown): boolean {
  return String((e as { code?: string })?.code ?? "") === "P2025"
}

// V4: Sadakat kuralı — tamamlanan her randevu için 100₺ başına 1 puan (en az 1)
// 10 puan = dijital damgalı kartta ödül (indirim)
export const LOYALTY_STAMPS = 10
export function loyaltyPointsForPrice(price: number): number {
  return Math.max(1, Math.floor(price / 100))
}

interface BookingRow {
  id: string
  startAt: string
  durationMin: number
  priceChf: number
  status: string
  notes: string | null
  staffNote: string | null
  design: string | null
  serviceId: string
  deposit: number
  depositPaid: boolean
  staffId: string | null
  staffName: string | null
  loyaltyAwarded: boolean
  createdAt: string
  updatedAt: string
  service: { name: string; category: string }
  customer: {
    name: string
    phone: string
    email: string | null
    allergies: string | null
    sensitive: boolean
    loyaltyPoints: number
  }
}

/** Misafir (telefon sorgusu) yanıtı — yalnızca kendi kartında görülen alanlar.
 *  KVKK/GDPR: müşteri profili (e-posta, alerji, hassasiyet, sadakat), ekip notu,
 *  depozito, iç zaman damgaları ASLA gönderilmez. */
interface GuestBookingRow {
  id: string
  startAt: string
  durationMin: number
  priceChf: number
  status: string
  notes: string | null
  design: string | null
  staffName: string | null
  service: { name: string; category: string }
}

const SELECT = {
  include: {
    service: { select: { name: true, category: true } },
    customer: { select: { name: true, phone: true, email: true, allergies: true, sensitive: true, loyaltyPoints: true } },
    staff: { select: { name: true } },
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
  design: string | null
  serviceId: string
  deposit: number
  depositPaid: boolean
  staffId: string | null
  loyaltyAwarded: boolean
  createdAt: Date
  updatedAt: Date
  service: { name: string; category: string }
  customer: { name: string; phone: string; email: string | null; allergies: string | null; sensitive: boolean; loyaltyPoints: number }
  staff: { name: string } | null
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
    design: b.design,
    serviceId: b.serviceId,
    deposit: b.deposit,
    depositPaid: b.depositPaid,
    staffId: b.staffId,
    staffName: b.staff?.name ?? null,
    loyaltyAwarded: b.loyaltyAwarded,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    service: { name: b.service.name, category: b.service.category },
    customer: {
      name: b.customer.name,
      phone: b.customer.phone,
      email: b.customer.email,
      allergies: b.customer.allergies,
      sensitive: b.customer.sensitive,
      loyaltyPoints: b.customer.loyaltyPoints,
    },
  }
}

function toGuestRow(b: BookingRow): GuestBookingRow {
  return {
    id: b.id,
    startAt: b.startAt,
    durationMin: b.durationMin,
    priceChf: b.priceChf,
    status: b.status,
    notes: b.notes,
    design: b.design,
    staffName: b.staffName,
    service: { name: b.service.name, category: b.service.category },
  }
}

/** V4/W3: Randevu «tamamlandı»ğunda sadakat puanı kazandırır — TEK KEZ.
 *  Koşullu updateMany (loyaltyAwarded=false → true) atomik hak alır; paralel
 *  isteklerden yalnızca biri count=1 görür ve puanı verir (çift sayım yok). */
async function awardLoyaltyIfNeeded(bookingId: string): Promise<{ awarded: number; total: number } | null> {
  return db.$transaction(async (tx) => {
    const b = await tx.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true, priceChf: true, loyaltyAwarded: true, customerId: true },
    })
    if (!b || b.status !== "tamamlandi" || b.loyaltyAwarded) return null
    const claimed = await tx.booking.updateMany({
      where: { id: b.id, loyaltyAwarded: false },
      data: { loyaltyAwarded: true },
    })
    if (claimed.count === 0) return null // başka istek az önce puanı verdi
    const points = loyaltyPointsForPrice(b.priceChf)
    await tx.loyaltyLog.create({
      data: {
        customerId: b.customerId,
        points,
        reason: `Randevu tamamlandı — ${b.priceChf} ₺`,
        bookingId: b.id,
      },
    })
    const updated = await tx.salonCustomer.update({
      where: { id: b.customerId },
      data: { loyaltyPoints: { increment: points } },
    })
    return { awarded: points, total: updated.loyaltyPoints }
  })
}

async function listBookings(params: URLSearchParams): Promise<BookingRow[]> {
  const phone = params.get("phone")
  const from = params.get("from")
  const to = params.get("to")
  const status = params.get("status")

  // V5.7 DÜZELTME: misafir farklı biçimde yazsa bile («0539…», «+90 539 …»)
  // randevularını bulabilsin — kanonik biçimle VE ham girişle arama yapılır.
  const phoneFilter = phone
    ? { customer: { phone: { in: Array.from(new Set([phone.trim(), canonicalPhone(phone)])) } } }
    : {}

  const bookings = await db.booking.findMany({
    where: {
      ...phoneFilter,
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
  const phone = params.get("phone")

  // ── Ekip (oturum): tam liste ──
  const staff = await requireStaff(request)
  if (staff.ok) {
    try {
      const bookings = await listBookings(params)
      return Response.json({ bookings, count: bookings.length })
    } catch (e) {
      if (isDbInitError(e)) return dbUnavailable(String((e as Error)?.message ?? e))
      console.error("[GET bookings]", e)
      return Response.json({ error: "Randevular yüklenemedi." }, { status: 500 })
    }
  }

  // ── Misafir: YALNIZCA kendi telefonu ile sorgu (hız sınırı 8/dk/IP) ──
  if (!phone) return staff.response // 401
  const rl = rateLimit(`booking-lookup:${clientIp(request)}`, 8, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const bookings = await listBookings(new URLSearchParams({ phone }))
    const rows = bookings.map(toGuestRow)
    return Response.json({ bookings: rows, count: rows.length })
  } catch (e) {
    if (isDbInitError(e)) return dbUnavailable(String((e as Error)?.message ?? e))
    console.error("[GET bookings:guest]", e)
    return Response.json({ error: "Randevular yüklenemedi." }, { status: 500 })
  }
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
      design?: string
      byStaff?: boolean
      deposit?: number
      staffId?: string | null
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
    // (istisna: ekip geçmişe düzeltme kaydı girebilir — yalnızca GEÇERLİ oturumla;
    //  V5.7.1: byStaff artık istemci iddiası DEĞİL, sunucu oturumuyla doğrulanır)
    const staffSession = await requireStaff(request)
    const isStaff = staffSession.ok && body.byStaff === true
    const start = new Date(body.startAt)
    const now = new Date()
    if (Number.isNaN(start.getTime())) {
      return Response.json({ error: "Geçersiz tarih." }, { status: 400 })
    }
    if (!isStaff && start.getTime() < now.getTime() - 60000) {
      return Response.json({ error: "Geçmiş bir tarihe randevu alınamaz." }, { status: 400 })
    }
    if (!isStaff && start.getTime() > now.getTime() + 60 * 24 * 3600 * 1000) {
      return Response.json({ error: "Randevu en fazla 60 gün ileride alınabilir." }, { status: 400 })
    }

    // V4: Depozito & ekip ataması — yalnızca ekip (oturumlu) belirleyebilir
    const deposit = isStaff ? Math.min(Math.max(body.deposit ?? 0, 0), 100000) : 0
    let staffId: string | null = null
    if (isStaff && body.staffId) {
      const member = await db.staffMember.findUnique({ where: { id: body.staffId } })
      if (member) staffId = member.id
    }

    // ── W1: Müşteri + çakışma kontrolü + oluşturma TEK işlemde ──
    // (check-then-act yarış koşulu kaldırıldı: paralel istekler aynı slotu alamaz)
    const end = new Date(start.getTime() + service.durationMin * 60000)
    const dayStart = new Date(start)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const outcome = await db.$transaction(
      async (tx) => {
        const customer = await tx.salonCustomer.upsert({
          where: { phone },
          update: { name, ...(email ? { email } : {}) },
          create: { name, phone, email: email || null },
        })

        // Çakışma kontrolü (yalnızca bekleyen/onaylı randevular)
        const overlapping = await tx.booking.findMany({
          where: { startAt: { gte: dayStart, lt: dayEnd }, status: { in: STATUS_ACTIVE } },
          select: { startAt: true, durationMin: true },
        })
        const clash = overlapping.some((b) => {
          const bEnd = new Date(b.startAt.getTime() + b.durationMin * 60000)
          return b.startAt < end && bEnd > start
        })
        if (clash) return { clash: true as const }

        const booking = await tx.booking.create({
          data: {
            customerId: customer.id,
            serviceId: service.id,
            startAt: start,
            durationMin: service.durationMin,
            priceChf: service.priceChf,
            status: "bekliyor",
            notes: body.notes?.trim() || null,
            staffNote: isStaff ? body.staffNote?.trim() || null : null,
            // V5.7: Canlı Nail Studio tasarımı (kompakt JSON — en fazla 500 karakter)
            design: body.design && body.design.trim().length > 0 && body.design.length <= 500 ? body.design.trim() : null,
            deposit,
            staffId,
          },
          ...SELECT,
        })
        return { clash: false as const, customer, booking }
      },
      { isolationLevel: "Serializable" },
    )

    if (outcome.clash) {
      return Response.json(
        { error: "Bu saat maalesef dolu — lütfen başka bir saat seçin." },
        { status: 409 },
      )
    }

    const { customer, booking } = outcome

    // Bildirim kancası: WhatsApp onay bağlantısı üret (konsol logu + istemci butonu)
    const notification = sendBookingNotification({
      customerName: customer.name,
      customerPhone: customer.phone,
      serviceName: service.name,
      startAt: start,
      price: service.priceChf,
      notes: body.notes?.trim() || null,
    })

    // V5.3 — Gerçek stüdyo bildirimi: SMTP e-posta + Twilio WhatsApp
    // (yapılandırılmışsa gerçekten gönderilir, değilse sessizce atlanır;
    //  her durumda NotificationLog'a yazılır, asla akışı bozmaz)
    try {
      await notifyStudioNewBooking({
        bookingId: booking.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        serviceName: service.name,
        startAt: start,
        price: service.priceChf,
        notes: body.notes?.trim() || null,
      })
    } catch {
      // Bildirim başarısızlığı randevuyu oluşturmayı engellemez
    }

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
  } catch (e) {
    console.error("[POST bookings]", e)
    return Response.json({ error: "Randevu oluşturulamadı." }, { status: 500 })
  }
}

// ─── Durum değişikliği (PATCH) ──────────────────────────────────────────────
// Ekip:  { id, status }                       — tüm geçişler (bekliyor|onaylandi|tamamlandi|iptal|gelmedi)
// Misafir: { id, status: "iptal", phone }     — yalnızca kendi randevusunu iptal edebilir
// V5.7.1: oturum YOKSA ve phone gönderilmemişse → 401 (misafir yolu ıskalamaz)
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

    const staff = await requireStaff(request)

    // V5.7.1: yetkisiz istek — ne oturum ne telefon doğrulaması → erişim yok
    if (!staff.ok && !body.phone) return staff.response

    const existing = await db.booking.findUnique({
      where: { id: body.id },
      ...SELECT,
    })
    if (!existing) {
      return Response.json({ error: "Randevu bulunamadı." }, { status: 404 })
    }

    // Misafir-iptali (oturum yok): telefon numarası eşleşmeli ve yalnızca iptal mümkün
    if (!staff.ok) {
      if (body.status !== "iptal") {
        return Response.json({ error: "Randevu yalnızca iptal edilebilir." }, { status: 403 })
      }
      // DÜZELTME (V3): biçim farklarına karşı normalize rakamlarla karşılaştır
      // («+90 532 111 22 33» ≡ «0532 111 22 33» ≡ «532 111 22 33»)
      if (phoneDigits(existing.customer.phone) !== phoneDigits(body.phone!.trim())) {
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

    // V4: «Tamamlandı» → sadakat puanı kazandır (W3: çift sayım yok)
    const loyalty = body.status === "tamamlandi" ? await awardLoyaltyIfNeeded(booking.id) : null

    // Durum değişiminde müşteri bildirim mesajını hazır üret (ekip isterse gönderir)
    const isStaffAction = staff.ok && !body.phone
    const kind = statusNotificationKind(body.status)
    const message =
      kind && isStaffAction
        ? buildMessage(kind, {
            customerName: booking.customer.name,
            customerPhone: booking.customer.phone,
            serviceName: booking.service.name,
            startAt: booking.startAt,
            price: booking.priceChf,
            notes: booking.notes,
          })
        : null

    // V5.3 — Otomatik müşteri bildirimi (yalnızca ekip eylemi, misafir iptali değil):
    // E-posta (müşteri adresi varsa) + WhatsApp (Twilio yapılandırılmışsa) gerçekten
    // gönderilir. Derin bağlantılar (wa.me) manuel kanal olarak yanıtta kalır.
    let autoSend: { emailSent: boolean; whatsappSent: boolean } | null = null
    if (message && kind && isStaffAction) {
      try {
        autoSend = await notifyCustomer({
          bookingId: booking.id,
          customerName: booking.customer.name,
          customerPhone: booking.customer.phone,
          customerEmail: booking.customer.email,
          kind,
          message,
        })
      } catch {
        autoSend = null
      }
    }

    return Response.json({
      booking: {
        id: booking.id,
        status: booking.status,
        serviceName: booking.service.name,
        customerName: booking.customer.name,
      },
      ...(loyalty ? { loyalty } : {}),
      ...(message ? { notifyMessage: message, notifyKind: kind } : {}),
      ...(autoSend ? { autoSend } : {}),
    })
  } catch (e) {
    if (isRecordNotFound(e)) {
      return Response.json({ error: "Randevu bulunamadı." }, { status: 404 })
    }
    console.error("[PATCH bookings]", e)
    return Response.json({ error: "Randevu güncellenemedi." }, { status: 500 })
  }
}

// ─── TAM DÜZENLEME (PUT) — Rezervasyon Merkezi (SADECE EKİP) ─────────────────
// { id, serviceId?, startAt?, durationMin?, priceChf?, customerName?,
//   customerPhone?, customerEmail?, notes?, staffNote?, status? }
export async function PUT(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

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
      deposit?: number
      depositPaid?: boolean
      staffId?: string | null
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

    // V4: Depozito doğrulama (0–100.000)
    const deposit = body.deposit ?? existing.deposit
    if (deposit < 0 || deposit > 100000) {
      return Response.json({ error: "Depozito 0–100.000 arasında olmalı." }, { status: 400 })
    }
    const depositPaid = body.depositPaid ?? existing.depositPaid

    // V4: Ekip ataması doğrulama
    let staffId: string | null = existing.staffId
    if (body.staffId !== undefined) {
      if (body.staffId === null || body.staffId === "") {
        staffId = null
      } else {
        const member = await db.staffMember.findUnique({ where: { id: body.staffId } })
        if (!member) {
          return Response.json({ error: "Ekip üyesi bulunamadı." }, { status: 404 })
        }
        staffId = member.id
      }
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
        deposit,
        depositPaid,
        staffId,
      },
      ...SELECT,
    })

    // V4: Durum «tamamlandı» yapıldıysa sadakat puanı kazandır (W3: bir kez)
    const loyalty = status === "tamamlandi" ? await awardLoyaltyIfNeeded(booking.id) : null

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
      ...(loyalty ? { loyalty } : {}),
      ...(notifyMessage ? { notifyMessage, notifyKind: "degisiklik" as const } : {}),
    })
  } catch (e) {
    if (isRecordNotFound(e)) {
      return Response.json({ error: "Randevu bulunamadı." }, { status: 404 })
    }
    console.error("[PUT bookings]", e)
    return Response.json({ error: "Randevu güncellenemedi." }, { status: 500 })
  }
}

// ─── Kalıcı silme (DELETE) — ekip ───────────────────────────────────────────
export async function DELETE(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

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
  } catch (e) {
    if (isRecordNotFound(e)) {
      return Response.json({ error: "Randevu bulunamadı." }, { status: 404 })
    }
    console.error("[DELETE bookings]", e)
    return Response.json({ error: "Randevu silinemedi." }, { status: 500 })
  }
}
