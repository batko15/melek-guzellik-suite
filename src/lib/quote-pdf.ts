// ALIEN 3 — SWISS QUOTE & PDF ENGINE
// Dynamische PDF-Generierung analog zur AutoFaszination Offerten-Struktur (Vorlage: Offerte_10900)
// Layout: Firmenkopf, Adressblock, Referenz, Positionstabelle, Warenwert/Porto/MwSt/Total, Rekapitulation

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import { chf, VAT_RATE_CH, type QuoteTotals } from "@/lib/pricing"

export const AF = {
  name: "Schnell & Friends GmbH",
  street: "Seestrasse 14b",
  city: "5432 Neuenhof/AG",
  tel: "Tel. +41 44 552 28 28",
  fax: "Fax +41 44 552 28 88",
  email: "info@autofaszination.ch",
  web: "www.autofaszination.ch",
  salesContact: "Ümit Sapmaz",
  b2bContact: "Mischa Huser",
}

const RED = rgb(0.79, 0.07, 0.13)      // AutoFaszination Rot
const BLACK = rgb(0.1, 0.1, 0.12)
const SILVER = rgb(0.62, 0.64, 0.67)
const DARK = rgb(0.25, 0.25, 0.28)
const WHITE = rgb(1, 1, 1)

export interface QuotePdfData {
  refNumber: number
  customerNumber: number
  customerName: string
  customerStreet?: string
  customerZipCity?: string
  customerEmail: string
  vehicleLabel: string
  installMode: "self" | "partner"
  partnerLabel?: string
  channel: "b2c" | "b2b"
  totals: QuoteTotals
  date?: Date
}

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const lines: string[] = []
  for (const raw of text.split("\n")) {
    const words = raw.split(" ")
    let line = ""
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (font.widthOfTextAtSize(test, size) > maxW && line) {
        lines.push(line)
        line = w
      } else line = test
    }
    lines.push(line)
  }
  return lines
}

export async function generateQuotePdf(data: QuotePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page: PDFPage = doc.addPage([595.28, 841.89]) // A4
  const reg = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const date = data.date ?? new Date()
  const dateStr = date.toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })

  const W = page.getWidth()
  const M = 50 // Rand

  // ─── Kopf: Logo-Balken (Schwarz/Rot/Silber) ──────────────────────────────
  page.drawRectangle({ x: 0, y: 792, width: W, height: 49.89, color: BLACK })
  page.drawRectangle({ x: 0, y: 786, width: W, height: 6, color: RED })
  page.drawText("AUTO", { x: M, y: 806, size: 24, font: bold, color: WHITE })
  page.drawText("FASZINATION", { x: M + 63, y: 806, size: 24, font: bold, color: RED })
  page.drawText("Performance & B2B Sales Suite", { x: M + 205, y: 812, size: 9, font: reg, color: SILVER })
  page.drawText("Motor- und Gaspedaloptimierung · Swiss Made", { x: M + 205, y: 800, size: 9, font: reg, color: SILVER })

  // ─── Absender links ─────────────────────────────────────────────────────
  let y = 762
  const sender = [AF.name, AF.street, AF.city, AF.tel, AF.email, AF.web]
  sender.forEach((l, i) => {
    page.drawText(l, { x: M, y, size: 8, font: i === 0 ? bold : reg, color: DARK })
    y -= 10.5
  })

  // ─── Adressblock rechts ─────────────────────────────────────────────────
  y = 726
  const addr = [data.customerName, data.customerStreet ?? "", data.customerZipCity ?? ""].filter(Boolean)
  addr.forEach(l => {
    page.drawText(l, { x: 330, y, size: 10, font: reg, color: BLACK })
    y -= 13
  })

  // ─── Meta-Zeile ─────────────────────────────────────────────────────────
  y = 668
  page.drawText(`Kundennummer: ${data.customerNumber}`, { x: M, y, size: 9, font: reg, color: DARK })
  page.drawText(`Referenz-Nr. ${data.refNumber}`, { x: 210, y, size: 9, font: bold, color: BLACK })
  page.drawText(`5432 Neuenhof AG, ${dateStr}`, { x: 330, y, size: 9, font: reg, color: DARK })
  y -= 12
  page.drawText(`Ansprechpartner: ${data.channel === "b2b" ? AF.b2bContact : AF.salesContact}`, { x: M, y, size: 9, font: reg, color: DARK })
  page.drawText(`Kanal: ${data.channel === "b2b" ? "B2B Markenhaus" : "B2C Direktvertrieb"}`, { x: 330, y, size: 9, font: reg, color: DARK })

  // ─── Titel ──────────────────────────────────────────────────────────────
  y -= 34
  page.drawText("Offerte", { x: M, y, size: 20, font: bold, color: BLACK })
  page.drawRectangle({ x: M, y: y - 7, width: 58, height: 3, color: RED })

  // ─── Anrede ─────────────────────────────────────────────────────────────
  y -= 30
  for (const l of [
    "Lieber Kunde",
    "",
    "Herzlichen Dank für Ihr Interesse, wir freuen uns sehr, Ihnen nachfolgende",
    "Offerte zu unterbreiten und sichern Ihnen eine fristgerechte Lieferung zu.",
  ]) {
    page.drawText(l, { x: M, y, size: 9.5, font: reg, color: DARK })
    y -= 13
  }
  y -= 6

  // ─── Positionstabelle ───────────────────────────────────────────────────
  const colX = { art: M, desc: M + 75, unit: 340, qty: 378, price: 420, rab: 475, total: 505 }
  const rowH = 13
  // Kopfzeile
  page.drawRectangle({ x: M - 4, y: y + 3, width: W - 2 * M + 8, height: rowH, color: BLACK })
  const headers: Array<[string, number]> = [
    ["Art.-Nr.", colX.art], ["Beschreibung", colX.desc], ["Einheit", colX.unit],
    ["Anzahl", colX.qty], ["Preis", colX.price], ["Rab%", colX.rab], ["Wert SC", colX.total],
  ]
  headers.forEach(([t, x]) => page.drawText(t, { x, y: y + 6.5, size: 8, font: bold, color: WHITE }))
  y -= rowH

  // Positionen
  for (const item of data.totals.items) {
    const descLines = wrap(item.description, reg, 8, 255)
    const lines = Math.max(descLines.length, 1)
    // Zebra
    if (data.totals.items.indexOf(item) % 2 === 1) {
      page.drawRectangle({ x: M - 4, y: y - (lines - 1) * 11 - 2, width: W - 2 * M + 8, height: lines * 11 + 4, color: rgb(0.96, 0.96, 0.97) })
    }
    page.drawText(item.artNo, { x: colX.art, y, size: 8, font: reg, color: DARK })
    descLines.forEach((l, i) => page.drawText(l, { x: colX.desc, y: y - i * 11, size: 8, font: i === 0 ? bold : reg, color: BLACK }))
    page.drawText(item.unit, { x: colX.unit, y, size: 8, font: reg, color: DARK })
    page.drawText(String(item.qty), { x: colX.qty + 12, y, size: 8, font: reg, color: DARK })
    page.drawText(chf(item.price), { x: colX.price + 14, y, size: 8, font: reg, color: DARK })
    page.drawText(item.discountPct ? `${item.discountPct}%` : "", { x: colX.rab + 12, y, size: 8, font: reg, color: DARK })
    page.drawText(chf(item.total), { x: colX.total + 18, y, size: 8, font: bold, color: BLACK })
    y -= lines * 11 + 3
  }

  // ─── Zwischensummen ─────────────────────────────────────────────────────
  y -= 8
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.7, color: SILVER })
  y -= 16
  const sumRow = (label: string, value: string, isBold = false, isTotal = false) => {
    if (isTotal) {
      page.drawRectangle({ x: 330, y: y - 5, width: W - M - 330, height: 20, color: RED })
      page.drawText(label, { x: 340, y, size: 9.5, font: bold, color: WHITE })
      page.drawText(value, { x: W - M - 8 - bold.widthOfTextAtSize(value, 9.5), y, size: 9.5, font: bold, color: WHITE })
    } else {
      page.drawText(label, { x: 340, y, size: 9, font: isBold ? bold : reg, color: DARK })
      page.drawText(value, { x: W - M - 8 - (isBold ? bold : reg).widthOfTextAtSize(value, 9), y, size: 9, font: isBold ? bold : reg, color: BLACK })
    }
    y -= 15
  }
  sumRow("Warenwert gesamt", chf(data.totals.basePrice), true)
  if (data.totals.warrantyPrice > 0) sumRow("Garantie-Option", chf(data.totals.warrantyPrice))
  if (data.totals.installPrice > 0) sumRow(`Einbau ${data.installMode === "partner" ? "(Partner-Garage)" : "(Selbsteinbau)"}`, chf(data.totals.installPrice))
  sumRow("Porto", chf(data.totals.shipping))
  sumRow("zuzügl. MWST 8.1%", chf(data.totals.vatAmount))
  y -= 4
  sumRow("Gesamtbetrag", `CHF ${chf(data.totals.total)}`, true, true)

  // ─── Rekapitulation MWST ────────────────────────────────────────────────
  y -= 26
  page.drawText(`Rekapitulation MWST:  1 = ${(VAT_RATE_CH * 100).toFixed(1)}% MWST`, { x: M, y, size: 8.5, font: bold, color: DARK })
  page.drawText(`${chf(data.totals.subtotal)}            ${chf(data.totals.vatAmount)}`, { x: 330, y, size: 8.5, font: reg, color: BLACK })

  // ─── Leistungshinweis (Vorher/Nachher) ──────────────────────────────────
  y -= 46
  page.drawRectangle({ x: M, y: y - 36, width: W - 2 * M, height: 44, borderColor: SILVER, borderWidth: 0.7, color: rgb(0.985, 0.985, 0.99) })
  page.drawText("LE26 Leistungssteigerung", { x: M + 8, y: y - 1, size: 8.5, font: bold, color: RED })
  page.drawText(data.vehicleLabel, { x: M + 8, y: y - 14, size: 8.5, font: bold, color: BLACK })
  page.drawText(
    `${data.installMode === "self"
      ? "Einbau: Plug & Play Selbsteinbau gem. beiliegender Einbauanleitung (Original-Steckverbinder, IP65, 5 Jahre Garantie)."
      : `Einbau: Termin bei ${data.partnerLabel ?? "Ihrer Partner-Garage"} — Original-Steckverbinder, IP65, 5 Jahre Garantie.`}`,
    { x: M + 8, y: y - 26, size: 8, font: reg, color: DARK },
  )
  page.drawText("Technische Hilfe innerhalb von 1 Stunde · Fachgerechte Montage nach ISO 9001", { x: M + 8, y: y - 36, size: 8, font: reg, color: SILVER })

  // ─── Fusszeile ──────────────────────────────────────────────────────────
  const fy = 60
  page.drawRectangle({ x: 0, y: 0, width: W, height: 6, color: RED })
  page.drawRectangle({ x: 0, y: 6, width: W, height: 40, color: BLACK })
  page.drawText(`${AF.name} · ${AF.street} · ${AF.city} · ${AF.tel} · ${AF.email}`, { x: M, y: fy - 26, size: 7.5, font: reg, color: SILVER })
  page.drawText("Zahlungsbedingungen: 30 Tage netto · Offerte gültig 30 Tage · Preise exkl. MWST 8.1%, inkl. Porto", { x: M, y: fy - 36, size: 7.5, font: reg, color: SILVER })
  page.drawText(`Seite 1 · Ref. ${data.refNumber}`, { x: W - M - 80, y: fy - 36, size: 7.5, font: reg, color: SILVER })

  return doc.save()
}
