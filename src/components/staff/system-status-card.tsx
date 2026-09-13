// Ekip Portalı — V5.5 «Sistem Durumu» canlı izleme kartı
// Bulut veritabanı + Supabase API ağ geçidi + bildirim altyapısı tek bakışta.
// Araştırma notu: free tier'da 7 gün işlem yapılmazsa Supabase projesi
// duraklatılır — bu kart sahibine durumu ilk hatadan ÖNCE gösterir.

"use client"

import { useCallback, useEffect, useState } from "react"
import { Activity, Database, Cloud, BellRing, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface StatusData {
  version: string
  runtime: string
  region: string | null
  checkedAt: string
  database: {
    ok: boolean
    protocol: string
    mode: string
    latencyMs: number | null
    serviceCount: number | null
    error: string | null
  }
  supabaseApi: {
    url: string
    projectRef: string
    status: "aktif" | "duraklatilmis" | "bilinmiyor"
    httpCode: number | null
    latencyMs: number | null
    hint: string
  }
  notification: { smtpConfigured: boolean; twilioConfigured: boolean }
}

type LoadState = "yukleniyor" | "hazir" | "hata"

function Dot({ tone }: { tone: "yesil" | "sari" | "kirmizi" }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        tone === "yesil" && "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
        tone === "sari" && "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
        tone === "kirmizi" && "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]",
      )}
    />
  )
}

function Row({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode
  title: string
  tone: "yesil" | "sari" | "kirmizi"
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-brand-text/70">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Dot tone={tone} /> {title}
        </div>
        <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}

export function SystemStatusCard() {
  const [data, setData] = useState<StatusData | null>(null)
  const [state, setState] = useState<LoadState>("yukleniyor")
  const [checking, setChecking] = useState(false)

  const load = useCallback(async () => {
    setChecking(true)
    try {
      const res = await fetch("/api/v1/salon/system-status", { cache: "no-store" })
      const json = (await res.json()) as StatusData
      setData(json)
      setState("hazir")
    } catch {
      setState("hata")
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const dbTone = !data ? "sari" : data.database.ok ? "yesil" : "kirmizi"
  const apiTone = !data
    ? "sari"
    : data.supabaseApi.status === "aktif"
      ? "yesil"
      : data.supabaseApi.status === "duraklatilmis"
        ? "kirmizi"
        : "sari"

  return (
    <Card className="mk-card">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="flex items-center justify-between gap-2 text-sm font-bold">
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand-text" /> Sistem durumu
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-[11px]"
            onClick={() => void load()}
            disabled={checking}
          >
            <RefreshCw className={cn("h-3 w-3", checking && "animate-spin")} />
            {checking ? "Kontrol ediliyor…" : "Yenile"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {state === "yukleniyor" && (
          <div className="py-6 text-center text-xs text-muted-foreground">Sistem durumu kontrol ediliyor…</div>
        )}
        {state === "hata" && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Durum alınamadı — bağlantıyı kontrol edip yenileyin.
          </div>
        )}
        {state === "hazir" && data && (
          <>
            <Row icon={<Database className="h-4 w-4" />} title="Bulut veritabanı" tone={dbTone}>
              {data.database.ok ? (
                <>
                  {data.database.mode} · {data.database.serviceCount ?? "?"} hizmet kayıtlı ·{" "}
                  {data.database.latencyMs != null ? `${data.database.latencyMs} ms` : "—"} yanıt süresi
                </>
              ) : (
                <span className="text-red-300">Bağlantı hatası: {data.database.error ?? "bilinmiyor"}</span>
              )}
            </Row>
            <Row icon={<Cloud className="h-4 w-4" />} title="Supabase API ağ geçidi" tone={apiTone}>
              {data.supabaseApi.status === "aktif" ? (
                <>
                  {data.supabaseApi.url.replace(/^https:\/\//, "")} ·{" "}
                  {data.supabaseApi.latencyMs != null ? `${data.supabaseApi.latencyMs} ms` : "—"} · proje aktif
                </>
              ) : (
                <span className="text-amber-300">{data.supabaseApi.hint}</span>
              )}
            </Row>
            <Row
              icon={<BellRing className="h-4 w-4" />}
              title="Bildirim altyapısı"
              tone={data.notification.smtpConfigured || data.notification.twilioConfigured ? "yesil" : "sari"}
            >
              <span className="inline-flex flex-wrap items-center gap-1.5">
                {data.notification.smtpConfigured ? (
                  <Badge variant="outline" className="gap-1 border-emerald-500/40 text-[10px] text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> E-posta hazır
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-amber-500/40 text-[10px] text-amber-300">
                    <XCircle className="h-3 w-3" /> E-posta: manuel
                  </Badge>
                )}
                {data.notification.twilioConfigured ? (
                  <Badge variant="outline" className="gap-1 border-emerald-500/40 text-[10px] text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> WhatsApp hazır
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-amber-500/40 text-[10px] text-amber-300">
                    <XCircle className="h-3 w-3" /> WhatsApp: manuel
                  </Badge>
                )}
              </span>
              <div className="mt-1.5">
                Manuel mod: bildirimler protokole yazılır, WhatsApp/e-posta bağlantıları tek tıkla açılır.
              </div>
            </Row>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
              <span>
                v{data.version} · {data.runtime === "production" ? "üretim" : data.runtime}
                {data.region ? ` · ${data.region}` : ""}
              </span>
              <span>{new Date(data.checkedAt).toLocaleTimeString("tr-TR")}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
