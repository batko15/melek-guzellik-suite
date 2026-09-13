// Hediye Kartı API'si (V5.4 — dijital hediye kartı, Booksy/Mangomint standardı)
// GET    /api/v1/salon/giftcards            — ekip: tüm kartlar (stats ile)
// GET    /api/v1/salon/giftcards?code=MELEK-XXXX-XXXX — herkese açık bakiye sorgusu
// POST   /api/v1/salon/giftcards            — HERKES kart talebi (ad + telefon + tutar)
// PATCH  /api/v1/salon/giftcards            — ekip: aktifleştir / iptal et
// PUT    /api/v1/salon/giftcards            — ekip: bakiyeden kullan (ödeme düş)

import { db } from "@/lib/db"
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit"
import { phoneDigits, canonicalPhone } from "@/lib/phone"
import { BRANDING } from "@/config/branding"

const ALLOWED_STATUS = ["talep", "aktif", "kullanildi", "iptal"]

// Hediye kartı kodu üret: MELEK-XXXX-XXXX (büyük harf+rakam, karışan karakterler yok)
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // I/1/O/0 çıkarıldı — okuma hatası olmasın
function generateGiftCode(): string {
  const pick = () =>
    Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("")
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

  // Herkese açık bakiye sorgusu — yalnızca kod + durum + maske bilgiler
  if (code) {
    if (!/^MELEK-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
      return Response.json({ error: "Geçersiz kart kodu biçimi." }, { status: 400 })
    }
    const card = await db.giftCard.findUnique({ where: { code } })
    if (!card || card.status === "iptal") {
      return Response.json({ error: "Bu koda ait aktif bir hediye kartı bulunamadı." }, { status: 404 })
    }
    return Response.json({
      code: card.code,
      status: card.status,
      balance: card.status === "aktif" ? card.balance : null,
      amount: card.amount,
      message: card.status === "talep"
        ? "Kartınız ödeme teyidi sonrası aktifleştirilecek."
        : card.status === "kullanildi"
          ? "Kartın bakiyesi tamamen kullanılmış."
          : null,
    })
  }

  // Ekip: tüm kartlar + istatistik
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
        // Ekip elle oluşturuyorsa ödeme alınmış sayılır → doğrudan aktif
        status: body.byStaff === true ? "aktif" : "talep",
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
  } catch {
    return Response.json({ error: "Hediye kartı oluşturulamadı." }, { status: 500 })
  }
}

// ─── Durum değişikliği (PATCH) — ekip ───────────────────────────────────────
// { id, status: "aktif" | "iptal" } — ödeme alındığında aktifleştir
export async function PATCH(request: Request) {
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
  } catch {
    return Response.json({ error: "Hediye kartı güncellenemedi." }, { status: 500 })
  }
}

// ─── Bakiye kullan (PUT) — ekip: ödeme anında düş ───────────────────────────
// { code, amount, note? } → aktif kartın bakiyesinden düşer
export async function PUT(request: Request) {
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
    if (card.balance < amount) {
      return Response.json(
        { error: `Bakiye yetersiz — kalan ${paraTL(card.balance)}.` },
        { status: 400 },
      )
    }

    const newBalance = Math.round((card.balance - amount) * 100) / 100
    const updated = await db.giftCard.update({
      where: { id: card.id },
      data: {
        balance: newBalance,
        usedCount: { increment: 1 },
        status: newBalance <= 0 ? "kullanildi" : "aktif",
      },
    })

    return Response.json({
      card: toRow(updated),
      deducted: amount,
      remaining: newBalance,
    })
  } catch {
    return Response.json({ error: "Bakiye düşülemedi." }, { status: 500 })
  }
}
