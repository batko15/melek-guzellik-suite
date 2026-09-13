// ALIEN 3 — E-Mail-Versand-Mockup (Kunde & Vertrieb) 
// Protokolliert den automatischen Versand ohne echten SMTP-Account.

export interface EmailRecord {
  id: string
  to: string
  cc?: string
  subject: string
  body: string
  sentAt: string
  direction: "customer" | "sales" | "partner"
}

export function buildCustomerEmail(params: {
  customerName: string
  refNumber: number
  total: number
  vehicleLabel: string
  installMode: "self" | "partner"
  partnerLabel?: string
}): { subject: string; body: string } {
  const subject = `Ihre AutoFaszination Offerte Nr. ${params.refNumber} — LET26 Leistungssteigerung`
  const body = [
    `Lieber Kunde ${params.customerName},`,
    ``,
    `herzlichen Dank für Ihr Interesse an der LET26-Optimierung.`,
    `Anbei erhalten Sie Ihre persönliche Offerte (Referenz-Nr. ${params.refNumber}) für:`,
    ``,
    `  ${params.vehicleLabel}`,
    ``,
    params.installMode === "partner"
      ? `Der Einbau erfolgt bequem bei Ihrer Partner-Garage vor Ort: ${params.partnerLabel}. Wir leiten Ihre Anfrage direkt weiter — die Garage meldet sich innert 24 Stunden für die Terminvereinbarung.`
      : `Der Selbsteinbau erfolgt dank Original-Steckverbinder (Plug & Play) in wenigen Minuten — die beiliegende Einbauanleitung führt Sie Schritt für Schritt.`,
    ``,
    `Sollten Sie Fragen haben, erreichen Sie uns unter +41 44 552 28 28.`,
    ``,
    `Sportliche Grüsse`,
    `Ihr AutoFaszination Team — Schnell & Friends GmbH, Neuenhof`,
  ].join("\n")
  return { subject, body }
}

export function buildSalesEmail(params: {
  refNumber: number
  customerName: string
  customerZip: string
  total: number
  vehicleLabel: string
  channel: string
  partnerLabel?: string
}): { subject: string; body: string } {
  const subject = `[Vertrieb] Neue Offerte #${params.refNumber} — ${params.customerName} (${params.customerZip})`
  const body = [
    `Neue Offerte über das Online-Tool erstellt:`,
    ``,
    `  Referenz:      ${params.refNumber}`,
    `  Kunde:         ${params.customerName}, ${params.customerZip}`,
    `  Fahrzeug:      ${params.vehicleLabel}`,
    `  Kanal:         ${params.channel === "b2b" ? "B2B Markenhaus" : "B2C Direktvertrieb"}`,
    `  Volumen:       CHF ${params.total.toFixed(2)}`,
    params.partnerLabel ? `  Routing:       ${params.partnerLabel}` : `  Routing:       Selbsteinbau (Direktversand)`,
    ``,
    `Follow-up-Sequenz gem. LET26-Vertriebs-Guide automatisch geplant: Tag 1 / Tag 3 / Tag 7.`,
    ``,
    `Vertrieb · Schnell & Friends GmbH`,
  ].join("\n")
  return { subject, body }
}

export function buildPartnerEmail(params: {
  partnerCompany: string
  customerName: string
  customerZip: string
  vehicleLabel: string
  installDate?: string
}): { subject: string; body: string } {
  const subject = `[Partner-Auftrag] Einbauanfrage ${params.customerName} (${params.customerZip})`
  const body = [
    `Guten Tag ${params.partnerCompany},`,
    ``,
    `über das AutoFaszination Partner-Routing ist folgende Einbauanfrage bei Ihnen eingegangen:`,
    ``,
    `  Kunde:    ${params.customerName}, ${params.customerZip}`,
    `  Fahrzeug: ${params.vehicleLabel}`,
    `  Produkt:  LET26 Komplettsatz (Einbauzeit ca. 15–25 Min.)`,
    ``,
    `Bitte kontaktieren Sie den Kunden innert 24 Stunden zur Terminvereinbarung.`,
    `Die Einbauanleitung und das Original-Stecksystem sind im Lieferumfang enthalten.`,
    ``,
    `Beste Grüsse · AutoFaszination Partner-Management`,
  ].join("\n")
  return { subject, body }
}
