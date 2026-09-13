// ═══════════════════════════════════════════════════════════════════════════
//  SERVER-AUTH (V5.7.1) — yalnızca sunucu tarafı! ASLA istemciden import etmeyin.
// ═══════════════════════════════════════════════════════════════════════════
//  Güvenlik mimarisi (K1/K2/K3):
//    • Şifreler: node:crypto scrypt (N=16384 varsayılan, 64 byte) — düz metin
//      ASLA kodda/env'de saklanmaz (varsayılan hesaplarda salt+hash hex gömülü).
//    • Karşılaştırma: timingSafeEqual → zamanlama saldırısına kapalı.
//      Bilinmeyen kullanıcıda da sahte (dummy) hash üzerinden scrypt çalışır →
//      «kullanıcı yok» ile «şifre yanlış» ayırt edilemez (konstant zaman).
//    • Oturum: imzalı token — payload = base64url(JSON {u, exp}) +
//      "." + base64url(HMAC-SHA256(payload, SESSION_SECRET)). HttpOnly cookie
//      (12 saat), JS erişemez → XSS token çalamaz.
//    • Ortam değişkeni STAFF_USERS_JSON (Array [{username,password,…}]) varsa
//      varsayılan hesapları geçersiz kılar (salt = kullanıcı adı, anlık scrypt).
//    • SESSION_SECRET tanımlı değilse gömülü yedek anahtar kullanılır —
//      ÜRETİMDE MUTLAKA SESSION_SECRET env değişkenini tanımlayın!
// ═══════════════════════════════════════════════════════════════════════════

import { createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import { NextResponse } from "next/server"

const scrypt = promisify(nodeScrypt) as (
  password: string,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>

// ─── Oturum sabitleri ────────────────────────────────────────────────────────
export const SESSION_COOKIE = "ms_session"
export const SESSION_TTL_SEC = 60 * 60 * 12 // 12 saat
const KEYLEN = 64

/** Üretimde env SESSION_SECRET kullanılmalı — bu yedek tek seferlik gömüldü. */
const FALLBACK_SESSION_SECRET = "4ce4a4c98e808286223f3ddb7247c7064cc2be8d205df3bd7362ca2626c9b844"
const SESSION_SECRET = process.env.SESSION_SECRET?.trim() || FALLBACK_SESSION_SECRET

// ─── Hesap modeli ────────────────────────────────────────────────────────────
interface StaffAccount {
  username: string
  name: string
  roleLabel: string
  initials: string
  /** scrypt salt (hex) — STAFF_USERS_JSON varyantında kullanıcı adı kullanılır */
  salt: string
  /** scrypt hash (hex) */
  hash: string
  /** Yalnızca STAFF_USERS_JSON varyantı: düz metin anlık doğrulama için (bellekte) */
  plain?: string
}

/**
 * Varsayılan ekip hesapları — scrypt(salt, 64) ile gömülü (düz metin YOK).
 * Değiştirmek isterseniz: /tmp/genhash.ts benzeri bir script ile yeni
 * salt+hash üretin ve buraya yapıştırın — ya da STAFF_USERS_JSON kullanın.
 */
const DEFAULT_ACCOUNTS: StaffAccount[] = [
  {
    username: "melek",
    name: "Melek",
    roleLabel: "İşletme Sahibi",
    initials: "MK",
    salt: "0a8c7d9e0d126de2fe8065766d09baec",
    hash: "959644b09e4c4ab9e185dc0a8dc5a74253aafbfc87751d1b95f7e605c30f2bc08c850a127f4c3b146ee704fa3e21f6c3587905dd27e05468d5309c1c99415f56",
  },
  {
    username: "admin",
    name: "Yönetici",
    roleLabel: "Stüdyo Yöneticisi",
    initials: "AD",
    salt: "474e2cf53e9ec5d76b7a7305207982d3",
    hash: "226766cb2bb47fa8c32bb00cdc6931cbe155d061d6ebbbf9f9564564b838020c38b2de8d9ffb7b3458f783bdf1f1722a73d5967e111b3525318cb2f62a69936d",
  },
]

/** Bilinmeyen kullanıcı için sahte hedef (konstant zaman sağlamak için) */
const DUMMY_SALT = "d33303ba57e24fe078e780c2d95ddfcc"
const DUMMY_HASH =
  "d2b9664ba9127faba8d62ed9c389d16181ecea555786a1646c115bced510d8107fd987faadcfe9b58ce39ee1f8f19f7b705c58021c337219038b327d15acf940"

/** STAFF_USERS_JSON varsa varsayılan hesapların yerine geçer. */
function resolveAccounts(): StaffAccount[] {
  const raw = process.env.STAFF_USERS_JSON?.trim()
  if (!raw) return DEFAULT_ACCOUNTS
  try {
    const parsed = JSON.parse(raw) as Array<{
      username?: string
      password?: string
      name?: string
      role?: string
      roleLabel?: string
      initials?: string
    }>
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_ACCOUNTS
    const accounts = parsed
      .filter((u) => typeof u.username === "string" && typeof u.password === "string" && u.username && u.password)
      .map((u) => ({
        username: (u.username as string).trim().toLowerCase(),
        name: u.name ?? (u.username as string),
        roleLabel: u.roleLabel ?? u.role ?? "Ekip",
        initials: u.initials ?? (u.username as string).slice(0, 2).toUpperCase(),
        // env-Varyant: salt = kullanıcı adı, anlık scrypt doğrulaması
        salt: (u.username as string).trim().toLowerCase(),
        hash: "",
        plain: u.password as string,
      }))
    if (accounts.length === 0) {
      console.error("[auth] STAFF_USERS_JSON geçersiz — varsayılan hesaplar kullanılıyor.")
      return DEFAULT_ACCOUNTS
    }
    return accounts
  } catch (e) {
    console.error("[auth] STAFF_USERS_JSON okunamadı — varsayılan hesaplar kullanılıyor.", e)
    return DEFAULT_ACCOUNTS
  }
}

// ─── Şifre doğrulama ─────────────────────────────────────────────────────────

function safeEqualHex(aHex: string, bHex: string): boolean {
  const a = Buffer.from(aHex, "hex")
  const b = Buffer.from(bHex, "hex")
  if (a.length !== b.length || a.length === 0) return false
  return timingSafeEqual(a, b)
}

/** STAFF_USERS_JSON varyantı: düz metin şifrenin scrypt'i ilk girişte hesaplanır, sonra önbellekte. */
const plainHashCache = new Map<string, string>()
async function targetHashFor(account: StaffAccount): Promise<string> {
  if (account.plain === undefined) return account.hash
  const cached = plainHashCache.get(account.username)
  if (cached) return cached
  const computed = (await scrypt(account.plain, saltFor(account), KEYLEN)).toString("hex")
  plainHashCache.set(account.username, computed)
  return computed
}

/** Salt girişi: gömülü hesaplarda hex → ham baytlar; env hesaplarında kullanıcı adı (utf8). */
function saltFor(account: StaffAccount | null | undefined): string | Buffer {
  if (!account) return Buffer.from(DUMMY_SALT, "hex")
  if (account.plain !== undefined) return account.salt
  return Buffer.from(account.salt, "hex")
}

/**
 * Kullanıcı adı + şifreyi doğrular. Başarılıysa hesap meta verisini döndürür.
 * Zamanlama sızıntısı yok: bilinmeyen kullanıcıda da scrypt çalıştırılır.
 */
export async function verifyCredentials(
  username: string,
  password: string,
): Promise<{ username: string; name: string; roleLabel: string; initials: string } | null> {
  const uname = username.trim().toLowerCase()
  const account = resolveAccounts().find((a) => a.username === uname)

  // «kullanıcı yok» ile «şifre yanlış» ayırt edilemez olsun: her iki yolda da
  // aynı miktarda scrypt + timingSafeEqual çalışır.
  const candidate = (await scrypt(password ?? "", saltFor(account), KEYLEN)).toString("hex")
  const target = account ? await targetHashFor(account) : DUMMY_HASH
  const ok = safeEqualHex(candidate, target)

  if (!account || !ok) return null
  return { username: account.username, name: account.name, roleLabel: account.roleLabel, initials: account.initials }
}

/** Kullanıcı adına hesap meta verisi (sadece gizli olmayan alanlar). */
export function getAccount(username: string): { username: string; name: string; roleLabel: string; initials: string } | null {
  const account = resolveAccounts().find((a) => a.username === username.trim().toLowerCase())
  if (!account) return null
  return { username: account.username, name: account.name, roleLabel: account.roleLabel, initials: account.initials }
}

// ─── Oturum token (HMAC imzalı) ──────────────────────────────────────────────

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url")
}

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url")
}

/** İmzalı oturum tokeni üretir: payload.signature (base64url). */
export function createSessionToken(username: string): string {
  const payload = base64url(
    JSON.stringify({ u: username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC }),
  )
  return `${payload}.${sign(payload)}`
}

/** Tokeni doğrular (imza + süre). Geçerliyse kullanıcı adını döndürür. */
export function verifySessionToken(token: string): string | null {
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const [payload, signature] = parts as [string, string]
  try {
    const expected = Buffer.from(sign(payload))
    const given = Buffer.from(signature)
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      u?: string
      exp?: number
    }
    if (!data.u || typeof data.exp !== "number") return null
    if (data.exp < Math.floor(Date.now() / 1000)) return null
    return data.u
  } catch {
    return null
  }
}

// ─── Cookie yardımcıları ─────────────────────────────────────────────────────

/** Set-Cookie değeri: HttpOnly + SameSite=Lax (+ Secure üretimde). */
export function createSessionCookie(username: string): string {
  const parts = [
    `${SESSION_COOKIE}=${createSessionToken(username)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SEC}`,
  ]
  if (process.env.NODE_ENV === "production") parts.push("Secure")
  return parts.join("; ")
}

/** Oturumu silen Set-Cookie değeri (Max-Age=0). */
export function clearSessionCookie(): string {
  const parts = [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"]
  if (process.env.NODE_ENV === "production") parts.push("Secure")
  return parts.join("; ")
}

// ─── İstekten oturum okuma ───────────────────────────────────────────────────

/** İsteğin çerezinden oturumu okur ve doğrular. Geçerliyse {username}. */
export function getSession(request: Request): { username: string } | null {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=")
    if (idx === -1) continue
    const name = part.slice(0, idx).trim()
    if (name !== SESSION_COOKIE) continue
    const value = part.slice(idx + 1).trim()
    if (!value) return null
    const username = verifySessionToken(value)
    return username ? { username } : null
  }
  return null
}

/** requireStaff deseni: `const staff = await requireStaff(request); if (!staff.ok) return staff.response;` */
export async function requireStaff(
  request: Request,
): Promise<{ ok: true; username: string } | { ok: false; response: NextResponse }> {
  const session = getSession(request)
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Yetkisiz." }, { status: 401 }),
    }
  }
  return { ok: true, username: session.username }
}

/** Opsiyonel oturum (herkese açık uçlarda ekip ayrımı için). */
export function getOptionalStaff(request: Request): { username: string } | null {
  return getSession(request)
}

/** rastgele id/token üretimi gereken yerler için (ör. güvenli kod üretimi) */
export function randomToken(bytes = 16): string {
  return randomBytes(bytes).toString("hex")
}
