// Hediye Kartı API'si (V5.4 — dijital hediye kartı, Booksy/Mangomint standardı)
// GET    /api/v1/salon/giftcards            — ekip (oturum): tüm kartlar (stats ile)
// GET    /api/v1/salon/giftcards?code=MELEK-XXXX-XXXX — herkese açık bakiye sorgusu
//          → yalnızca { valid, remaining } döner (alıcı bilgisi sızdırılmaz)
// POST   /api/v1/salon/giftcards            — HERKES kart talebi (ad + telefon + tutar)
//          → talep «talep» olarak açılır; «aktif» yalnızca ekip PATCH'i ile (V5.7.1:
//            istemcinin byStaff iddiasına güvenilmez — oturum yoksa hep «talep»)
// PATCH  /api/v1/salon/giftcards            — ekip: aktifleştir / iptal et
// PUT    /api/v1/salon/giftcards            — ekip: bakiyeden kullan (ödeme düş) — atomik

import { db } from "@/lib/db"
import { requireStaff, getOptionalStaff } from "@/lib/auth"
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit"
import { phoneDigits, canonicalPhone } from "@/lib/phone"
import { BRANDING } from "@/config/branding"
import { randomInt } from "node:crypto"

const ALLOWED_STATUS = ["talep", "aktif", "kullanildi", "iptal"]

// Hediye kartı kodu üret: MELEK-XXXX-XXXX (büyük harf+rakam, karışan karakterler yok)
// V5.7.1: Math.random() yerine kriptografik randomInt — kodlar tahmin edilemez
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // I/1/O/0 çıkarıldı — okuma hatası olmasın
function generateGiftCode(): string {
  const pick = () =>
    Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)]).join("")
  return `MELEK-${pick()}-${pick()}`
}

function paraTL(v: number): string {
  return `${Math.round(v).toLocaleString("tr-TR")} ${BRANDING.locale.currencySymbol}`
}

interface GiftCardRow {
  id: string
  code: string
  amount: number
  balance: number
  buyerName: string
  buyerPhone: string
  recipientName: string | null
  message: string | null
  status: string
  usedCount: number
  createdAt: string
}

function toRow(g: {
  id: string; code: string; amount: number; balance: number; buyerName: string; buyerPhone: string
  recipientName: string | null; message: string | null; status: string; usedCount: number
  createdAt: Date
}): GiftCardRow {
  return { ...g, createdAt: g.createdAt.toISOString() }
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const code = params.get("code")?.trim().toUpperCase()

  // Herkese açık bakiye sorgusu — V5.7.1: yalnızca { valid, remaining }
  // (kart durumu, tutar, alıcı adı/telefonu gibi hiçbir bilgi sızdırılmaz)
  if (code) {
    const rl = rateLimit(`giftcard-balance:${clientIp(request)}`, 10, 60 * 1000)
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

    if (!/^MELEK-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
      return Response.json({ error: "Geçersiz kart kodu biçimi." }, { status: 400 })
    }
    try {
      const card = await db.giftCard.findUnique({ where: { code }, select: { status: true, balance: true } })
      const valid = card?.status === "aktif"
      return Response.json(
        { valid, remaining: valid ? card!.balance : 0 },
        { headers: { "Cache-Control": "no-store" } },
      )
    } catch (e) {
      console.error("[GET giftcards:code]", e)
      return Response.json({ error: "Kart sorgulanamadı." }, { status: 500 })
    }
  }

  // Ekip: tüm kartlar + istatistik (oturum gerekli)
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  try {
    const cards = await db.giftCard.findMany({ orderBy: { createdAt: "desc" } })
    const rows = cards.map(toRow)
    return Response.json({
      cards: rows,
      count: rows.length,
      stats: {
        totalIssued: rows.length,
        requested: rows.filter((c) => c.status === "talep").length,
        active: rows.filter((c) => c.status === "aktif").length,
        activeBalance: rows.filter((c) => c.status === "aktif").reduce((sum, c) => sum + c.balance, 0),
        totalLoaded: rows.filter((c) => c.status !== "iptal").reduce((sum, c) => sum + c.amount, 0),
      },
    })
  } catch (e) {
    console.error("[GET giftcards]", e)
    return Response.json({ error: "Hediye kartları yüklenemedi." }, { status: 500 })
  }
}

// ─── Kart talebi — HERKES, giriş gerekmez ───────────────────────────────────
export async function POST(request: Request) {
  // Hız sınırı: IP başına 10 dakikada en fazla 3 talep
  const rl = rateLimit(`giftcard:${clientIp(request)}`, 3, 10 * 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as {
      buyerName?: string
      buyerPhone?: string
      amount?: number
      recipientName?: string
      message?: string
      byStaff?: boolean
    }

    const name = body.buyerName?.trim() ?? ""
    const phone = canonicalPhone(body.buyerPhone ?? "")
    const recipient = body.recipientName?.trim() ?? ""
    const note = body.message?.trim() ?? ""
    const amount = Math.round(Number(body.amount ?? 0))

    if (name.length < 2) {
      return Response.json({ error: "Lütfen adınızı girin." }, { status: 400 })
    }
    if (phoneDigits(phone).length < 7) {
      return Response.json({ error: "Lütfen geçerli bir telefon numarası girin." }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount < 250 || amount > 25000) {
      return Response.json({ error: "Tutar 250 – 25.000 ₺ arasında olmalı." }, { status: 400 })
    }
    if (note.length > 300) {
      return Response.json({ error: "Hediye notu en fazla 300 karakter olabilir." }, { status: 400 })
    }

    // V5.7.1 GÜVENLİK: «aktif» durum artık yalnızca GEÇERLİ ekip oturumuyla
    // mümkündür (eski byStaff:true istemci açığı kapatıldı). Misafir talebi
    // her zaman «talep» olur — ödeme teyidinden sonra ekip PATCH ile aktifleştirir.
    const staffSession = getOptionalStaff(request)
    const isStaff = staffSession !== null && body.byStaff === true

    // Benzersiz kod üret (çakışma ihtimali çok düşük — 3 deneme)
    let code = generateGiftCode()
    for (let i = 0; i < 3; i++) {
      const exists = await db.giftCard.findUnique({ where: { code } })
      if (!exists) break
      code = generateGiftCode()
    }

    const card = await db.giftCard.create({
      data: {
        code,
        amount,
        balance: amount,
        buyerName: name,
        buyerPhone: phone,
        recipientName: recipient || null,
        message: note || null,
        status: isStaff ? "aktif" : "talep",
      },
    })

    // Stüdyoya WhatsApp bildirim bağlantısı (talebi hızlı teyit için)
    const waPhone = (BRANDING.company.whatsapp ?? BRANDING.company.phone).replace(/\D/g, "")
    const waText = encodeURIComponent(
      `🎁 Hediye kartı talebi\nKod: ${code}\nTutar: ${paraTL(amount)}\nAlan: ${name} (${phone})` +
        (recipient ? `\nKime: ${recipient}` : "") +
        (note ? `\nNot: ${note}` : ""),
    )

    return Response.json(
      {
        card: { id: card.id, code: card.code, amount: card.amount, status: card.status },
        whatsappUrl: `https://wa.me/${waPhone}?text=${waText}`,
      },
      { status: 201 },
    )
  } catch (e) {
    console.error("[POST giftcards]", e)
    return Response.json({ error: "Hediye kartı oluşturulamadı." }, { status: 500 })
  }
}

// ─── Durum değişikliği (PATCH) — ekip ───────────────────────────────────────
// { id, status: "aktif" | "iptal" } — ödeme alındığında aktifleştir
export async function PATCH(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  const rl = rateLimit(`giftcard-patch:${clientIp(request)}`, 30, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as { id?: string; status?: string }
    if (!body.id || !body.status || !ALLOWED_STATUS.includes(body.status)) {
      return Response.json({ error: "Kart kimliği ve geçerli bir durum gerekli." }, { status: 400 })
    }
    if (body.status === "talep") {
      return Response.json({ error: "Durum «talep» geri alınamaz." }, { status: 400 })
    }

    const existing = await db.giftCard.findUnique({ where: { id: body.id } })
    if (!existing) {
      return Response.json({ error: "Hediye kartı bulunamadı." }, { status: 404 })
    }
    if (existing.status === "iptal") {
      return Response.json({ error: "İptal edilmiş kart değiştirilemez." }, { status: 400 })
    }
    if (existing.status === "kullanildi" && body.status === "aktif") {
      return Response.json({ error: "Tamamen kullanılmış kart yeniden aktifleştirilemez." }, { status: 400 })
    }

    const card = await db.giftCard.update({
      where: { id: body.id },
      data: { status: body.status },
    })

    // Alıcıya «kartınız aktif» WhatsApp bağlantısı (ekip isterse gönderir)
    const waPhone = phoneDigits(card.buyerPhone)
    const waText = encodeURIComponent(
      `🎁 ${BRANDING.brand.nameParts.join(" ")} hediye kartınız hazır!\nKod: ${card.code}\nBakiye: ${paraTL(card.balance)}\nAfiyet olsun! 💅`,
    )

    return Response.json({
      card: toRow(card),
      whatsappUrl: waPhone ? `https://wa.me/${waPhone}?text=${waText}` : null,
    })
  } catch (e) {
    console.error("[PATCH giftcards]", e)
    return Response.json({ error: "Hediye kartı güncellenemedi." }, { status: 500 })
  }
}

// ─── Bakiye kullan (PUT) — ekip: ödeme anında düş ───────────────────────────
// { code, amount, note? } → aktif kartın bakiyesinden düşer
// W2 (V5.7.1): düşüm artık ATOMİK — koşullu updateMany (status=aktif VE
// balance >= tutar) paralel isteklerde bakiyenin eksiye düşmesini imkânsız kılar.
export async function PUT(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  const rl = rateLimit(`giftcard-use:${clientIp(request)}`, 30, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as { code?: string; amount?: number; note?: string }
    const code = body.code?.trim().toUpperCase() ?? ""
    const amount = Math.round(Number(body.amount ?? 0))

    if (!code) {
      return Response.json({ error: "Kart kodu gerekli." }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      return Response.json({ error: "Geçerli bir tutar girin (1 – 100.000 ₺)." }, { status: 400 })
    }

    // Atomik koşullu düşüm: yalnızca kart aktifse ve bakiye yeterliyse azalt
    const updated = await db.giftCard.updateMany({
      where: { code, status: "aktif", balance: { gte: amount } },
      data: {
        balance: { decrement: amount },
        usedCount: { increment: 1 },
      },
    })

    if (updated.count === 0) {
      // Neden ayırt et: kart yok / aktif değil / bakiye yetersiz
      const card = await db.giftCard.findUnique({ where: { code } })
      if (!card) {
        return Response.json({ error: "Bu koda ait hediye kartı bulunamadı." }, { status: 404 })
      }
      if (card.status !== "aktif") {
        return Response.json(
          { error: `Kart aktif değil (durum: ${card.status}) — önce aktifleştirin.` },
          { status: 400 },
        )
      }
      return Response.json(
        { error: `Bakiye yetersiz — kalan ${paraTL(card.balance)}.` },
        { status: 409 },
      )
    }

    // Güncel kartı oku (bakiye, durum — bakiye bittiyse «kullanildi»)
    const card = (await db.giftCard.findUnique({ where: { code } }))!
    if (card.balance <= 0 && card.status === "aktif") {
      await db.giftCard.update({ where: { id: card.id }, data: { status: "kullanildi" } })
      card.status = "kullanildi"
    }

    return Response.json({
      card: toRow(card),
      deducted: amount,
      remaining: card.balance,
    })
  } catch (e) {
    console.error("[PUT giftcards]", e)
    return Response.json({ error: "Bakiye düşülemedi." }, { status: 500 })
  }
}
