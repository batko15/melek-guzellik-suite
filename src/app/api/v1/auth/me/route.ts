// GET /api/v1/auth/me — geçerli ekip oturumunu sorgular (V5.7.1)
// Geçerli ms_session çerezi → 200 { username, name, roleLabel, initials }
// Oturum yok / süresi dolmuş → 401

import { getSession, getAccount } from "@/lib/auth"

export async function GET(request: Request) {
  const session = getSession(request)
  if (!session) {
    return Response.json({ error: "Yetkisiz." }, { status: 401 })
  }
  const account = getAccount(session.username)
  if (!account) {
    // Token imzalı ama hesap artık yok (ör. STAFF_USERS_JSON değişti) → oturum geçersiz
    return Response.json({ error: "Yetkisiz." }, { status: 401 })
  }
  return Response.json(account, { headers: { "Cache-Control": "no-store" } })
}
