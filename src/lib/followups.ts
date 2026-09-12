// ALIEN 4 — B2B SALES & WORKFLOW AUTOMATOR
// Follow-up-Trigger nach LET26-Vertriebs-Guide: Tag 1 / Tag 3 / Tag 7
// Skript-Snippets aus «Leitfaden Mischa» (Gradliniges Verkaufssystem LET26)

export interface FollowupTemplate {
  dayOffset: 1 | 3 | 7
  action: string
  channel: "Telefon" | "E-Mail"
  script: string
}

export const FOLLOWUP_SEQUENCE: FollowupTemplate[] = [
  {
    dayOffset: 1,
    action: "Tag 1 — Telefonat: Offerte kurz durchgehen, Einwände behandeln",
    channel: "Telefon",
    script:
      "«Ich schicke Ihnen das Ganse so zu — Einbauanleitung und Originalstecker sind mit dabei. " +
      "Habe ich alles richtig zusammengefasst, oder sollen wir noch etwas anpassen?»",
  },
  {
    dayOffset: 3,
    action: "Tag 3 — E-Mail: Nutzen vertiefen (Marge CHF 350+ / 15 Min. Einbau)",
    channel: "E-Mail",
    script:
      "«Kurze Erinnerung: Bei ca. 15 Minuten Einbauzeit entspricht das über CHF 1'400 Ertrag pro Arbeitsstunde. " +
      "Mit der Zürich-Versicherung ist die Motorgarantie abgesichert. Sollen wir das erste Fahrzeug zusammen machen?»",
  },
  {
    dayOffset: 7,
    action: "Tag 7 — Telefonat: Abschluss oder Nachfassen (Türöffner Gaspedaloptimierung)",
    channel: "Telefon",
    script:
      "«Wir haben neu auch Gaspedaltuning, welches bei der ESA gelistet ist — eintragungsfrei, UVP CHF 490. " +
      "Falls für Sie alles klar ist: Gut, dann schicke ich Ihnen das Ganse definitiv so zu.»",
  },
]

export function buildFollowupDates(from: Date): Array<{ dayOffset: number; dueAt: Date }> {
  return FOLLOWUP_SEQUENCE.map(f => {
    const dueAt = new Date(from)
    dueAt.setDate(dueAt.getDate() + f.dayOffset)
    dueAt.setHours(9, 30, 0, 0)
    return { dayOffset: f.dayOffset, dueAt }
  })
}

/** UI-Label für den Follow-up-Status */
export function followupStatusLabel(dueAt: Date, done: boolean): "erledigt" | "überfällig" | "geplant" {
  if (done) return "erledigt"
  return dueAt.getTime() < Date.now() ? "überfällig" : "geplant"
}
