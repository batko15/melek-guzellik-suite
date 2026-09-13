// Envanter API'si (V4 ULTIMATE — malzeme & stok takibi)
// GET    /api/v1/salon/inventory          — tüm malzemeler + düşük stok uyarısı
// POST   /api/v1/salon/inventory          — yeni malzeme
// PUT    /api/v1/salon/inventory          — güncelle (miktar dahil)
// DELETE /api/v1/salon/inventory?id=…     — sil

import { db } from "@/lib/db"
import { requireStaff } from "@/lib/auth"
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit"

const UNITS = ["gr", "ml", "adet", "set"]
const CATEGORIES = ["jel", "akrilik", "kirpik", "bakim", "alet", "diger"]

export async function GET(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  try {
  const items = await db.inventoryItem.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  })
  const rows = items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    unit: i.unit,
    quantity: Math.round(i.quantity * 100) / 100,
    minQuantity: Math.round(i.minQuantity * 100) / 100,
    unitCost: Math.round(i.unitCost * 100) / 100,
    supplier: i.supplier,
    active: i.active,
    lowStock: i.active && i.quantity <= i.minQuantity,
    stockValue: Math.round(i.quantity * i.unitCost * 100) / 100,
    updatedAt: i.updatedAt.toISOString(),
  }))
  return Response.json({
    items: rows,
    count: rows.length,
    lowStockCount: rows.filter((r) => r.lowStock).length,
    totalValue: Math.round(rows.reduce((s, r) => s + r.stockValue, 0) * 100) / 100,
  })
  } catch (e) {
    console.error("[GET inventory]", e)
    return Response.json({ error: "Envanter yüklenemedi." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  const rl = rateLimit(`inventory-post:${clientIp(request)}`, 20, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as {
      name?: string
      category?: string
      unit?: string
      quantity?: number
      minQuantity?: number
      unitCost?: number
      supplier?: string
    }
    const name = body.name?.trim() ?? ""
    if (name.length < 2) {
      return Response.json({ error: "Malzeme adı en az 2 karakter olmalı." }, { status: 400 })
    }
    const category = body.category ?? "diger"
    if (!CATEGORIES.includes(category)) {
      return Response.json({ error: "Geçersiz kategori." }, { status: 400 })
    }
    const unit = body.unit ?? "adet"
    if (!UNITS.includes(unit)) {
      return Response.json({ error: "Geçersiz birim (gr, ml, adet, set)." }, { status: 400 })
    }
    const quantity = body.quantity ?? 0
    const minQuantity = body.minQuantity ?? 0
    const unitCost = body.unitCost ?? 0
    if (quantity < 0 || quantity > 1_000_000 || minQuantity < 0 || minQuantity > 1_000_000) {
      return Response.json({ error: "Miktar 0–1.000.000 arasında olmalı." }, { status: 400 })
    }
    if (unitCost < 0 || unitCost > 100_000) {
      return Response.json({ error: "Birim maliyet 0–100.000 arasında olmalı." }, { status: 400 })
    }

    const item = await db.inventoryItem.create({
      data: {
        name,
        category,
        unit,
        quantity,
        minQuantity,
        unitCost,
        supplier: body.supplier?.trim() || null,
      },
    })
    return Response.json({ item: { id: item.id, name: item.name } }, { status: 201 })
  } catch {
    return Response.json({ error: "Malzeme eklenemedi." }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  const rl = rateLimit(`inventory-put:${clientIp(request)}`, 30, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as {
      id?: string
      name?: string
      category?: string
      unit?: string
      quantity?: number
      minQuantity?: number
      unitCost?: number
      supplier?: string | null
      active?: boolean
    }
    if (!body.id) {
      return Response.json({ error: "Malzeme kimliği gerekli." }, { status: 400 })
    }
    const existing = await db.inventoryItem.findUnique({ where: { id: body.id } })
    if (!existing) {
      return Response.json({ error: "Malzeme bulunamadı." }, { status: 404 })
    }

    if (body.name !== undefined && body.name.trim().length < 2) {
      return Response.json({ error: "Malzeme adı en az 2 karakter olmalı." }, { status: 400 })
    }
    if (body.category !== undefined && !CATEGORIES.includes(body.category)) {
      return Response.json({ error: "Geçersiz kategori." }, { status: 400 })
    }
    if (body.unit !== undefined && !UNITS.includes(body.unit)) {
      return Response.json({ error: "Geçersiz birim." }, { status: 400 })
    }
    const quantity = body.quantity ?? existing.quantity
    const minQuantity = body.minQuantity ?? existing.minQuantity
    const unitCost = body.unitCost ?? existing.unitCost
    if (quantity < 0 || quantity > 1_000_000 || minQuantity < 0 || minQuantity > 1_000_000) {
      return Response.json({ error: "Miktar 0–1.000.000 arasında olmalı." }, { status: 400 })
    }
    if (unitCost < 0 || unitCost > 100_000) {
      return Response.json({ error: "Birim maliyet 0–100.000 arasında olmalı." }, { status: 400 })
    }

    const item = await db.inventoryItem.update({
      where: { id: body.id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.unit !== undefined ? { unit: body.unit } : {}),
        quantity,
        minQuantity,
        unitCost,
        ...(body.supplier !== undefined ? { supplier: body.supplier?.trim() || null } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
    })
    return Response.json({
      item: { id: item.id, name: item.name, quantity: item.quantity },
      lowStock: item.active && item.quantity <= item.minQuantity,
    })
  } catch {
    return Response.json({ error: "Malzeme güncellenemedi." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const staff = await requireStaff(request)
  if (!staff.ok) return staff.response

  const rl = rateLimit(`inventory-delete:${clientIp(request)}`, 20, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const id = new URL(request.url).searchParams.get("id")
    if (!id) {
      return Response.json({ error: "Malzeme kimliği gerekli." }, { status: 400 })
    }
    const existing = await db.inventoryItem.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "Malzeme bulunamadı." }, { status: 404 })
    }
    await db.inventoryItem.delete({ where: { id } })
    return Response.json({ deleted: true, id })
  } catch {
    return Response.json({ error: "Malzeme silinemedi." }, { status: 500 })
  }
}
