// ═══════════════════════════════════════════════════════════════════════════
//  API-FEHLER-HILFSFUNKTIONEN — saubere, türkische Fehlermeldungen
// ═══════════════════════════════════════════════════════════════════════════
//  Verhindert stumme 500er ohne Erklärung (z. B. wenn die Cloud-Datenbank
//  noch nicht konfiguriert ist). Kunden sehen eine freundliche Meldung,
//  die Oberfläche zeigt einen Hinweis statt einer leeren Liste.

/** Datenbank-/Serverfehler → 503 mit türkischer Meldung. */
export function dbUnavailable(detail?: string): Response {
  return Response.json(
    {
      error: "Veritabanına şu anda ulaşılamıyor. Lütfen kısa süre sonra tekrar deneyin.",
      hint: detail ? detail.slice(0, 200) : undefined,
    },
    { status: 503 },
  )
}

/**Ungültige Anfrage → 400 mit Meldung. */
export function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 })
}

/** Trickreich: prüft, ob der Fehler ein Datenbank-Verbindungsproblem ist. */
export function isDbInitError(e: unknown): boolean {
  const msg = String((e as Error)?.message ?? e)
  return (
    /PrismaClientInitializationError|DATABASE_URL|datasource|unable to open|Can't reach database/i.test(msg)
  )
}
