// Canlı hava durumu widget'ı — Open-Meteo verisiyle (Türkçe)
// Kullanım: <WeatherWidget variant="hero" | "panel" />
// Yapılandırma: branding.ts → BRANDING.weather

"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Sun, Moon, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, Thermometer, Droplets, Wind, MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type WeatherData } from "@/lib/salon"

const ICONS: Record<string, React.ElementType> = {
  sun: Sun,
  moon: Moon,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  "cloud-fog": CloudFog,
  "cloud-drizzle": CloudDrizzle,
  "cloud-rain": CloudRain,
  "cloud-snow": CloudSnow,
  "cloud-lightning": CloudLightning,
}

export function WeatherIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Cloud
  return <Icon className={className} />
}

export function WeatherWidget({ variant = "panel" }: { variant?: "hero" | "panel" }) {
  const { data, isLoading } = useQuery({
    queryKey: ["weather"],
    queryFn: async () => {
      const res = await fetch("/api/v1/weather")
      if (!res.ok) return { enabled: false, city: "" } as WeatherData
      return (await res.json()) as WeatherData
    },
    refetchInterval: 15 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className={cn("mk-card animate-pulse rounded-2xl p-5", variant === "hero" && "min-w-[220px]")}>
        <div className="h-4 w-24 rounded bg-secondary" />
        <div className="mt-3 h-8 w-16 rounded bg-secondary" />
      </div>
    )
  }

  if (!data?.enabled || !data.current) {
    if (data?.error) {
      return (
        <div className="mk-card flex items-center gap-2.5 rounded-2xl px-5 py-4 text-xs text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0 text-brand-text/70" />
          {data.city}: {data.error}
        </div>
      )
    }
    return null
  }

  const cur = data.current

  if (variant === "hero") {
    // Açılış sayfası hero widget'ı — kompakt ve şık
    return (
      <div className="mk-card mk-gold-glow-soft rounded-2xl p-5" aria-label={`${data.city} canlı hava durumu`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <MapPin className="h-3 w-3 text-brand-text/70" />
              {data.city} · Şimdi
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="mk-display text-4xl font-bold text-foreground">{cur.temp}°</span>
              <span className="text-sm font-medium text-muted-foreground">{cur.text}</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Thermometer className="h-3 w-3" />{cur.feelsLike}°</span>
              <span className="flex items-center gap-1"><Droplets className="h-3 w-3" />%{cur.humidity}</span>
              <span className="flex items-center gap-1"><Wind className="h-3 w-3" />{cur.wind} km/s</span>
            </div>
          </div>
          <WeatherIcon name={cur.isDay ? cur.icon : "moon"} className="h-14 w-14 shrink-0 text-brand-text" strokeWidth={1.2} />
        </div>

        {/* 3 günlük mini tahmin */}
        {data.daily && data.daily.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-1.5 border-t border-border/60 pt-3.5">
            {data.daily.slice(0, 4).map((d, i) => (
              <div key={d.date} className="text-center">
                <div className="text-[10px] font-semibold text-muted-foreground">
                  {i === 0 ? "Bugün" : new Date(d.date).toLocaleDateString("tr-TR", { weekday: "short" })}
                </div>
                <WeatherIcon name={d.icon} className="mx-auto mt-1 h-4 w-4 text-brand-text/80" />
                <div className="mt-1 text-[11px] font-bold text-foreground">{d.max}°</div>
                <div className="text-[10px] text-muted-foreground">{d.min}°</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Ekip paneli sürümü
  return (
    <div className="mk-card rounded-2xl p-5" aria-label={`${data.city} canlı hava durumu`}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        <MapPin className="h-3 w-3 text-brand-text/70" />
        {data.city} · Hava Durumu
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="mk-display text-3xl font-bold text-foreground">{cur.temp}°</span>
          <span className="text-xs font-medium text-muted-foreground">{cur.text}</span>
        </div>
        <WeatherIcon name={cur.isDay ? cur.icon : "moon"} className="h-10 w-10 shrink-0 text-brand-text" strokeWidth={1.2} />
      </div>
      {data.daily && data.daily.length > 1 && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-center">
          {data.daily.slice(0, 4).map((d, i) => (
            <div key={d.date} className="flex-1">
              <div className="text-[10px] font-semibold text-muted-foreground">
                {i === 0 ? "Bugün" : new Date(d.date).toLocaleDateString("tr-TR", { weekday: "short" })}
              </div>
              <div className="mt-0.5 text-[11px] font-bold text-foreground">{d.max}°<span className="ml-1 font-normal text-muted-foreground">{d.min}°</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
