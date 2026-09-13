// POST /api/v1/auth/login — Ekip girişi (V5.7.1: gerçek sunucu doğrulaması)
// { username, password } → 200 + HttpOnly ms_session çerezi (12 saat)
// Güvenlik: scrypt + timingSafeEqual (src/lib/auth.ts), hız sınırı 5 deneme/dk/IP.
// Hatalı girişte genel mesaj — «kullanıcı yok» ile «şifre yanlış» ayırt edilemez.

import { NextResponse } from "next/server"
import { verifyCredentials, createSessionCookie } from "@/lib/auth"
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit"

export async function POST(request: Request) {
  // Hız sınırı: IP başına dakikada 5 deneme (brute-force koruması)
  const rl = rateLimit(`auth-login:${clientIp(request)}`, 5, 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec)

  try {
    const body = (await request.json()) as { username?: string; password?: string }
    const username = body.username?.trim() ?? ""
    const password = body.password ?? ""

    if (!username || !password) {
      return Response.json({ error: "Kullanıcı adı ve şifre gerekli." }, { status: 400 })
    }

    const account = await verifyCredentials(username, password)
    if (!account) {
      return Response.json({ error: "Kullanıcı adı veya şifre hatalı." }, { status: 401 })
    }

    const response = NextResponse.json({
      username: account.username,
      name: account.name,
      roleLabel: account.roleLabel,
      initials: account.initials,
    })
    response.headers.set("Set-Cookie", createSessionCookie(account.username))
    response.headers.set("Cache-Control", "no-store")
    return response
  } catch {
    return Response.json({ error: "Giriş yapılamadı — lütfen tekrar deneyin." }, { status: 500 })
  }
}
