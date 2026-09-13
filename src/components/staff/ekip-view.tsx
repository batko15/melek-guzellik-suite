// Ekip & Prim View (V4 ULTIMATE) — ekip üyeleri + komisyon/prim hesaplayıcı
// Ciro · tamamlanan randevu · prim (ciro × oran) · aylık görünüm
"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, Pencil, Users2, TrendingUp, Clock3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { type StaffMemberRow, para, para2 } from "@/lib/salon"

function monthOptions(): Array<{ value: string; label: string }> {
  const out: Array<{ value: string; label: string }> = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    out.push({ value, label: i === 0 ? "Bu ay" : d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }) })
  }
  return out
}

interface MemberForm {
  name: string
  role: string
  commissionRate: string
  phone: string
}

export function EkipView() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [month, setMonth] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<StaffMemberRow | null>(null)
  const [form, setForm] = useState<MemberForm>({ name: "", role: "Tırnak Sanatçısı", commissionRate: "30", phone: "" })
  const [busy, setBusy] = useState(false)

  const queryMonth = month === "all" ? undefined : month

  const { data } = useQuery({
    queryKey: ["salon-staff", queryMonth],
    queryFn: async () => {
      const url = queryMonth ? `/api/v1/salon/staff?month=${queryMonth}` : "/api/v1/salon/staff"
      const res = await fetch(url)
      if (!res.ok) return { staff: [] as StaffMemberRow[], count: 0, totalCommission: 0, range: "all" }
      return (await res.json()) as { staff: StaffMemberRow[]; count: number; totalCommission: number; range: string }
    },
  })

  const staff = (data?.staff ?? []).filter((s) => s.active)
  const totalCommission = data?.totalCommission ?? 0
  const totalRevenue = staff.reduce((s, m) => s + m.stats.revenueChf, 0)

  function openCreate() {
    setEditing(null)
    setForm({ name: "", role: "Tırnak Sanatçısı", commissionRate: "30", phone: "" })
    setDialogOpen(true)
  }

  function openEdit(m: StaffMemberRow) {
    setEditing(m)
    setForm({ name: m.name, role: m.role, commissionRate: String(m.commissionRate), phone: m.phone ?? "" })
    setDialogOpen(true)
  }

  async function submitMember() {
    setBusy(true)
    try {
      const payload = {
        ...(editing ? { id: editing.id } : {}),
        name: form.name,
        role: form.role,
        commissionRate: Number(form.commissionRate) || 0,
        phone: form.phone || null,
      }
      const res = await fetch("/api/v1/salon/staff", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const out = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast({ title: "Hata", description: out.error ?? "Kaydedilemedi.", variant: "destructive" })
        return
      }
      toast({ title: editing ? "Ekip üyesi güncellendi" : "Ekip üyesi eklendi", description: form.name })
      setDialogOpen(false)
      qc.invalidateQueries({ queryKey: ["salon-staff"] })
    } finally {
      setBusy(false)
    }
  }

  async function deleteMember(m: StaffMemberRow) {
    if (!confirm(`«${m.name}» silinsin mi? Randevuları atamasız kalır.`)) return
    const res = await fetch(`/api/v1/salon/staff?id=${m.id}`, { method: "DELETE" })
    if (res.ok) {
      toast({ title: "Ekip üyesi silindi", description: m.name })
      qc.invalidateQueries({ queryKey: ["salon-staff"] })
      qc.invalidateQueries({ queryKey: ["salon-bookings"] })
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Başlık */}
      <div className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-brand-text">
          <Users2 className="h-3.5 w-3.5" /> V4 · Ekip & Prim
        </div>
        <h1 className="mk-display text-2xl font-bold sm:text-3xl">Ekip Prim Hesaplayıcı</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ciro, tamamlanan randevu ve komisyon oranı — prim otomatik hesaplanır.
        </p>
      </div>

      {/* KPI'lar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="mk-card rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ekip Üyesi</div>
          <div className="mk-display mt-1 text-2xl font-bold text-foreground">{staff.length}</div>
        </div>
        <div className="mk-card rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {month === "all" ? "Toplam Ciro" : "Ayın Cirosu"}
          </div>
          <div className="mk-display mt-1 text-2xl font-bold text-foreground">{para(totalRevenue)}</div>
        </div>
        <div className="mk-card rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Toplam Prim</div>
          <div className="mk-display mt-1 text-2xl font-bold text-brand-text">{para2(totalCommission)}</div>
        </div>
        <div className="mk-card rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Atanan Randevu</div>
          <div className="mk-display mt-1 text-2xl font-bold text-foreground">
            {staff.reduce((s, m) => s + m.stats.bookings, 0)}
          </div>
        </div>
      </div>

      {/* Ay filtresi + yeni üye */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMonth("all")}
            className={cn(
              "mk-focus rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
              month === "all" ? "border-primary/50 bg-primary/15 text-brand-text" : "border-border/70 text-muted-foreground hover:text-foreground",
            )}
          >
            Tüm zamanlar
          </button>
          {monthOptions().map((m) => (
            <button
              key={m.value}
              onClick={() => setMonth(m.value)}
              className={cn(
                "mk-focus rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
                month === m.value ? "border-primary/50 bg-primary/15 text-brand-text" : "border-border/70 text-muted-foreground hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <Button
          onClick={openCreate}
          className="mk-gold-glow h-10 shrink-0 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 sm:ml-auto"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Yeni Üye
        </Button>
      </div>

      {/* Üye kartları */}
      <div className="grid gap-4 md:grid-cols-2">
        {staff.map((m) => (
          <div key={m.id} className="mk-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="mk-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-bold text-brand-text">
                  {m.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
                <div className="leading-tight">
                  <div className="mk-display text-base font-bold text-foreground">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground">{m.role}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(m)} aria-label="Düzenle" className="mk-focus flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => deleteMember(m)} aria-label="Sil" className="mk-focus flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-lg bg-secondary/40 px-2 py-2.5">
                <div className="mk-display text-base font-bold text-foreground">{m.stats.completed}</div>
                <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Randevu</div>
              </div>
              <div className="rounded-lg bg-secondary/40 px-2 py-2.5">
                <div className="mk-display text-base font-bold text-foreground">{m.stats.hoursBooked}sa</div>
                <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Çalışma</div>
              </div>
              <div className="rounded-lg bg-secondary/40 px-2 py-2.5">
                <div className="mk-display text-base font-bold text-foreground">{para(m.stats.revenueChf)}</div>
                <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Ciro</div>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/10 px-2 py-2.5">
                <div className="mk-display text-base font-bold text-brand-text">{para2(m.stats.commissionChf)}</div>
                <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Prim</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-brand-text/70" /> Prim oranı: <b className="text-foreground">%{m.commissionRate}</b>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-brand-text/70" /> Yaklaşan: <b className="text-foreground">{m.stats.upcoming}</b>
              </span>
            </div>
          </div>
        ))}
        {staff.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
            Henüz ekip üyesi eklenmedi — «Yeni Üye» ile başlayın.
          </p>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="mk-display">{editing ? "Ekip Üyesini Düzenle" : "Yeni Ekip Üyesi"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">İsim *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="örn. Melek Hanım"
                className="mk-focus h-10 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rol</Label>
                <Input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Tırnak Sanatçısı"
                  className="mk-focus h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prim oranı %</Label>
                <Input
                  type="number" min={0} max={90}
                  value={form.commissionRate}
                  onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                  className="mk-focus h-10 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefon</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+90 5XX XXX XX XX"
                className="mk-focus h-10 rounded-xl"
              />
            </div>
            <Button
              onClick={submitMember}
              disabled={busy || form.name.trim().length < 2}
              className="mk-gold-glow h-11 w-full rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90"
            >
              {editing ? "Değişiklikleri Kaydet" : "Ekip Üyesini Ekle"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
