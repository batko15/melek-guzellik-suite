// VERCEL KMS — SIGNED TOKENS (V6.0 «Profesyonel Edition»)
// Signiert Tokens mit dem Vercel-KMS-Signing-Key des Accounts
// (Issuer d5488b7f-fb4e-4c37-b3ce-4210e95222db, Key 300b591c-…).
//
// • Funktioniert NUR in Vercel Functions (Production/Preview) — der
//   private Schlüssel bleibt sicher in der Vercel-KMS-Infrastruktur.
// • Verifikation der Tokens: JWKS  →
//   https://kms.vercel.com/d5488b7f-fb4e-4c37-b3ce-4210e95222db/jwks.json
//   oder mit dem öffentlichen Schlüssel: docs/vercel-kms-public-key.pem
// • Claims hier im Code anpassen (z. B. role/salonId pro Einsatzzweck).

import { signToken } from "@vercel/kms"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const KMS_ISSUER_ID =
  process.env.VERCEL_KMS_ISSUER_ID ?? "d5488b7f-fb4e-4c37-b3ce-4210e95222db"

export async function GET(): Promise<Response> {
  try {
    const token = await signToken({
      issuerId: KMS_ISSUER_ID,
      claims: {
        app: "melek-guzellik-suite",
        role: "service",
      },
    })

    return Response.json({ token })
  } catch {
    // Lokal / außerhalb von Vercel ist das Signieren nicht möglich.
    return Response.json(
      {
        error: "KMS signToken yalnızca Vercel üzerinde çalışır.",
        hint: "Deploy auf Vercel (melek-guzellik-suite.vercel.app) oder lokal: vercel dev",
        issuerId: KMS_ISSUER_ID,
      },
      { status: 501 },
    )
  }
}
