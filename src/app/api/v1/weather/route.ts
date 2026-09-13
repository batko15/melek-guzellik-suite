// GET /api/v1/weather — Canlı hava durumu (Open-Meteo, anahtarsız, ücretsiz)
// Yapılandırma: src/config/branding.ts → BRANDING.weather
// Bellekte 10 dakika önbellek alır (hızlı, kotaları korur).

import { BRANDING } from "@/config/branding"

// WMO hava kodları → Türkçe açıklama
const WMO_TR: Record<number, string> = {
  0: "Açık",
  1: "Genelde açık",
  2: "Parçalı bulutlu",
  3: "Kapalı",
  45: "Puslu",
  48: "Kırağılı pus",
  51: "Hafif çisenti",
  53: "Çisenti",
  55: "Yoğun çisenti",
  56: "Donan çisenti",
  57: "Yoğun donan çisenti",
  61: "Hafif yağmur",
  63: "Yağmurlu",
  65: "Şiddetli yağmur",
  66: "Donan yağmur",
  67: "Yoğun donan yağmur",
  71: "Hafif kar",
  73: "Kar yağışlı",
  75: "Yoğun kar",
  77: "Kar taneleri",
  80: "Hafif sağanak",
  81: "Sağanak yağış",
  82: "Şiddetli sağanak",
  85: "Kar sağanağı",
  86: "Yoğun kar sağanağı",
  95: "Gök gürültülü fırtına",
  96: "Dolulu fırtına",
  99: "Şiddetli dolulu fırtına",
}

// WMO hava kodları → istemci ikonu (lucide adı)
const WMO_ICON: Record<number, string> = {
  0: "sun",
  1: "sun",
  2: "cloud-sun",
  3: "cloud",
  45: "cloud-fog",
  48: "cloud-fog",
  51: "cloud-drizzle",
  53: "cloud-drizzle",
  55: "cloud-drizzle",
  56: "cloud-rain",
  57: "cloud-rain",
  61: "cloud-rain",
  63: "cloud-rain",
  65: "cloud-rain",
  66: "cloud-rain",
  67: "cloud-rain",
  71: "cloud-snow",
  73: "cloud-snow",
  75: "cloud-snow",
  77: "cloud-snow",
  80: "cloud-rain",
  81: "cloud-rain",
  82: "cloud-rain",
  85: "cloud-snow",
  86: "cloud-snow",
  95: "cloud-lightning",
  96: "cloud-lightning",
  99: "cloud-lightning",
}

interface WeatherPayload {
  enabled: boolean
  city: string
  current: {
    temp: number
    feelsLike: number
    humidity: number
    wind: number
    code: number
    isDay: boolean
    text: string
    icon: string
  }
  daily: Array<{
    date: string
    code: number
    max: number
    min: number
    text: string
    icon: string
  }>
  updatedAt: string
}

let cache: { at: number; data: WeatherPayload } | null = null
const CACHE_MS = 10 * 60 * 1000

export async function GET() {
  const cfg = BRANDING.weather
  if (!cfg?.enabled) {
    return Response.json({ enabled: false })
  }

  if (cache && Date.now() - cache.at < CACHE_MS) {
    return Response.json(cache.data)
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${cfg.latitude}&longitude=${cfg.longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=${encodeURIComponent(cfg.timezone)}&forecast_days=4`

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`)
    const raw = (await res.json()) as {
      current: {
        temperature_2m: number
        relative_humidity_2m: number
        apparent_temperature: number
        is_day: number
        weather_code: number
        wind_speed_10m: number
      }
      daily: {
        time: string[]
        weather_code: number[]
        temperature_2m_max: number[]
        temperature_2m_min: number[]
      }
    }

    const cur = raw.current
    const data: WeatherPayload = {
      enabled: true,
      city: cfg.cityName,
      current: {
        temp: Math.round(cur.temperature_2m),
        feelsLike: Math.round(cur.apparent_temperature),
        humidity: cur.relative_humidity_2m,
        wind: Math.round(cur.wind_speed_10m),
        code: cur.weather_code,
        isDay: cur.is_day === 1,
        text: WMO_TR[cur.weather_code] ?? "Bilinmiyor",
        icon: WMO_ICON[cur.weather_code] ?? "cloud",
      },
      daily: raw.daily.time.slice(0, 4).map((date, i) => ({
        date,
        code: raw.daily.weather_code[i],
        max: Math.round(raw.daily.temperature_2m_max[i]),
        min: Math.round(raw.daily.temperature_2m_min[i]),
        text: WMO_TR[raw.daily.weather_code[i]] ?? "Bilinmiyor",
        icon: WMO_ICON[raw.daily.weather_code[i]] ?? "cloud",
      })),
      updatedAt: new Date().toISOString(),
    }

    cache = { at: Date.now(), data }
    return Response.json(data)
  } catch {
    // Ağ hatası: eski önbellek varsa onu döndür, yoksa nazik bir bilgilendirme
    if (cache) return Response.json(cache.data)
    return Response.json(
      { enabled: true, city: cfg.cityName, error: "Hava durumu şu anda alınamıyor." },
      { status: 200 },
    )
  }
}
