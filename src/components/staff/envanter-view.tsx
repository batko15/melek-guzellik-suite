// Envanter View (V4 ULTIMATE) — malzeme & stok takibi
// Düşük stok uyarıları · toplam stok değeri · hızlı miktar düzenleme · yeni malzeme
"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Package, Plus, Minus, AlertTriangle, Boxes, Search, Trash2, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { type InventoryItemRow, INVENTORY_CATEGORY_META, para2 } from "@/lib/salon"

const CATEGORIES = Object.keys(INVENTORY_CATEGORY_META)
const UNITS = ["gr", "ml", "adet", "set"]

interface NewItem {
  name: string
  category: string
  unit: string
  quantity: string
  minQuantity: string
  unitCost: string
  supplier: string
}

const EMPTY_ITEM: NewItem = { name: "", category: "jel", unit: "gr", quantity: "", minQuantity: "", unitCost: "", supplier: "" }

export function EnvanterView() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState<string>("tumu")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryItemRow | null>(null)
  const [form, setForm] = useState<NewItem>(EMPTY_ITEM)
  const [busy, setBusy] = useState(false)

  const { data } = useQuery({
    queryKey: ["salon-inventory"],
    queryFn: async () => {
      const res = await fetch("/api/v1/salon/inventory")
      if (!res.ok) return { items: [] as InventoryItemRow[], count: 0, lowStockCount: 0, totalValue: 0 }
      return (await res.json()) as { items: InventoryItemRow[]; count: number; lowStockCount: number; totalValue: number }
    },
  })

  const items = data?.items ?? []
  const filtered = items.filter((i) => {
    if (catFilter !== "tumu" && i.category !== catFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return i.name.toLowerCase().includes(q) || (i.supplier ?? "").toLowerCase().includes(q)
    }
    return true
  })
  const lowStockCount = data?.lowStockCount ?? 0

  async function changeQuantity(item: InventoryItemRow, delta: number) {
    const q = Math.max(0, Math.round((item.quantity + delta) * 100) / 100)
    const res = await fetch("/api/v1/salon/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, quantity: q }),
    })
    if (res.ok) {
      qc.invalidateQueries({ queryKey: ["salon-inventory"] })
      if (q <= item.minQuantity) {
        toast({ title: "⚠️ Düşük stok", description: `${item.name} — minimum seviyenin altında (${q} ${item.unit})` })
      }
    } else {
      toast({ title: "Hata", description: "Miktar güncellenemedi.", variant: "destructive" })
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_ITEM)
    setDialogOpen(true)
  }

  function openEdit(item: InventoryItemRow) {
    setEditing(item)
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: String(item.quantity),
      minQuantity: String(item.minQuantity),
      unitCost: String(item.unitCost),
      supplier: item.supplier ?? "",
    })
    setDialogOpen(true)
  }

  async function submitItem() {
    setBusy(true)
    try {
      const payload = {
        ...(editing ? { id: editing.id } : {}),
        name: form.name,
        category: form.category,
        unit: form.unit,
        quantity: Number(form.quantity) || 0,
        minQuantity: Number(form.minQuantity) || 0,
        unitCost: Number(form.unitCost) || 0,
        supplier: form.supplier || null,
      }
      const res = await fetch("/api/v1/salon/inventory", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const out = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast({ title: "Hata", description: out.error ?? "Kaydedilemedi.", variant: "destructive" })
        return
      }
      toast({ title: editing ? "Malzeme güncellendi" : "Malzeme eklendi", description: form.name })
      setDialogOpen(false)
      qc.invalidateQueries({ queryKey: ["salon-inventory"] })
    } finally {
      setBusy(false)
    }
  }

  async function deleteItem(item: InventoryItemRow) {
    if (!confirm(`«${item.name}» kalıcı olarak silinsin mi?`)) return
    const res = await fetch(`/api/v1/salon/inventory?id=${item.id}`, { method: "DELETE" })
    if (res.ok) {
      toast({ title: "Malzeme silindi", description: item.name })
      qc.invalidateQueries({ queryKey: ["salon-inventory"] })
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Başlık */}
      <div className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-brand-text">
          <Boxes className="h-3.5 w-3.5" /> V4 · Envanter & Stok
        </div>
        <h1 className="mk-display text-2xl font-bold sm:text-3xl">Malzeme Stok Takibi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Jel, akrilik, kirpik ve bakım malzemeleri — minimum stok uyarılarıyla.
        </p>
      </div>

      {/* KPI'lar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="mk-card rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Toplam Malzeme</div>
          <div className="mk-display mt-1 text-2xl font-bold text-foreground">{items.length}</div>
        </div>
        <div className={cn("mk-card rounded-xl p-4", lowStockCount > 0 && "border-red-800/50")}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Düşük Stok</div>
          <div className={cn("mk-display mt-1 text-2xl font-bold", lowStockCount > 0 ? "text-red-300" : "text-foreground")}>
            {lowStockCount}
          </div>
        </div>
        <div className="mk-card rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stok Değeri</div>
          <div className="mk-display mt-1 text-2xl font-bold text-brand-text">{para2(data?.totalValue ?? 0)}</div>
        </div>
        <div className="mk-card rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kategori</div>
          <div className="mk-display mt-1 text-2xl font-bold text-foreground">{CATEGORIES.length}</div>
        </div>
      </div>

      {/* Filtre + arama + yeni */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Malzeme veya tedarikçi ara…"
            className="mk-focus h-10 rounded-xl pl-9"
          />
        </div>
        <Button
          onClick={openCreate}
          className="mk-gold-glow h-10 shrink-0 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Yeni Malzeme
        </Button>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {["tumu", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={cn(
              "mk-focus rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
              catFilter === c
                ? "border-primary/50 bg-primary/15 text-brand-text"
                : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {c === "tumu" ? "Tümü" : `${INVENTORY_CATEGORY_META[c]?.emoji} ${INVENTORY_CATEGORY_META[c]?.label}`}
          </button>
        ))}
      </div>

      {/* Masaüstü tablo */}
      <div className="mk-card hidden overflow-hidden rounded-xl md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/70 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Malzeme</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3 text-center">Stok</th>
              <th className="px-4 py-3 text-center">Min.</th>
              <th className="px-4 py-3 text-right">Birim Maliyet</th>
              <th className="px-4 py-3 text-right">Stok Değeri</th>
              <th className="px-4 py-3 text-center">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className={cn("border-b border-border/40 last:border-0", i.lowStock && "bg-red-950/20")}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {i.lowStock && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />}
                    <span className="font-semibold text-foreground">{i.name}</span>
                  </div>
                  {i.supplier && <div className="text-[10px] text-muted-foreground">{i.supplier}</div>}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {INVENTORY_CATEGORY_META[i.category]?.emoji} {INVENTORY_CATEGORY_META[i.category]?.label ?? i.category}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <button onClick={() => changeQuantity(i, -1)} aria-label="Azalt" className="mk-focus flex h-6 w-6 items-center justify-center rounded-md border border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className={cn("mk-display w-16 font-bold", i.lowStock ? "text-red-300" : "text-foreground")}>
                      {i.quantity} {i.unit}
                    </span>
                    <button onClick={() => changeQuantity(i, 1)} aria-label="Arttır" className="mk-focus flex h-6 w-6 items-center justify-center rounded-md border border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-xs text-muted-foreground">{i.minQuantity} {i.unit}</td>
                <td className="px-4 py-3 text-right text-xs text-muted-foreground">{para2(i.unitCost)}</td>
                <td className="px-4 py-3 text-right font-semibold text-brand-text">{para2(i.stockValue)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(i)} aria-label="Düzenle" className="mk-focus flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteItem(i)} aria-label="Sil" className="mk-focus flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  <Package className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  Malzeme bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobil kartlar */}
      <div className="space-y-3 md:hidden">
        {filtered.map((i) => (
          <div key={i.id} className={cn("mk-card rounded-xl p-4", i.lowStock && "border-red-800/50 bg-red-950/20")}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {i.lowStock && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />}
                  <span className="truncate font-semibold text-foreground">{i.name}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {INVENTORY_CATEGORY_META[i.category]?.emoji} {INVENTORY_CATEGORY_META[i.category]?.label ?? i.category}
                  {i.supplier ? ` · ${i.supplier}` : ""}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(i)} aria-label="Düzenle" className="mk-focus flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => deleteItem(i)} aria-label="Sil" className="mk-focus flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button onClick={() => changeQuantity(i, -1)} aria-label="Azalt" className="mk-focus flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground">
                  <Minus className="h-4 w-4" />
                </button>
                <span className={cn("mk-display w-20 text-center text-lg font-bold", i.lowStock ? "text-red-300" : "text-foreground")}>
                  {i.quantity}
                </span>
                <button onClick={() => changeQuantity(i, 1)} aria-label="Arttır" className="mk-focus flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground">
                  <Plus className="h-4 w-4" />
                </button>
                <span className="text-xs text-muted-foreground">{i.unit}</span>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-muted-foreground">Değer</div>
                <div className="mk-display text-sm font-bold text-brand-text">{para2(i.stockValue)}</div>
              </div>
            </div>
            {i.lowStock && (
              <div className="mt-2 rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-1.5 text-[11px] font-semibold text-red-300">
                ⚠️ Minimum stok: {i.minQuantity} {i.unit} — sipariş verilmeli
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Malzeme bulunamadı.</p>
        )}
      </div>

      {/* Yeni / düzenleme dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="mk-display">{editing ? "Malzemeyi Düzenle" : "Yeni Malzeme"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Malzeme adı *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="örn. UV Jel — Bordo"
                className="mk-focus h-10 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kategori</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mk-focus h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{INVENTORY_CATEGORY_META[c]?.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Birim</Label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="mk-focus h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Miktar</Label>
                <Input
                  type="number" min={0} step="0.01"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="mk-focus h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Min. stok</Label>
                <Input
                  type="number" min={0} step="0.01"
                  value={form.minQuantity}
                  onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                  className="mk-focus h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Birim maliyet</Label>
                <Input
                  type="number" min={0} step="0.01"
                  value={form.unitCost}
                  onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                  className="mk-focus h-10 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tedarikçi</Label>
              <Input
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                placeholder="örn. Nail Supply TR"
                className="mk-focus h-10 rounded-xl"
              />
            </div>
            <Button
              onClick={submitItem}
              disabled={busy || form.name.trim().length < 2}
              className="mk-gold-glow h-11 w-full rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90"
            >
              {editing ? "Değişiklikleri Kaydet" : "Malzemeyi Ekle"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
