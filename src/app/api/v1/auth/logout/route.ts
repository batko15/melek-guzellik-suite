// POST /api/v1/auth/logout — ekip oturumunu kapatır (V5.7.1)
// ms_session çerezini siler (Max-Age=0). Her zaman 200 döner (idempotent).

import { NextResponse } from "next/server"
import { clearSessionCookie } from "@/lib/auth"

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.headers.set("Set-Cookie", clearSessionCookie())
  response.headers.set("Cache-Control", "no-store")
  return response
}
