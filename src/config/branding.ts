// ═══════════════════════════════════════════════════════════════════════════
//  WHITE-LABEL-KONFIGURATION — DIE EINE DATEI FÜR NEUE PROJEKTE
// ═══════════════════════════════════════════════════════════════════════════
//  Sie wollen diese Suite für ein ANDERES Projekt verwenden?
//  Dann NUR HIER die Inhalte abändern — fertig.
//
//  Schritt-für-Schritt: siehe TEMPLATE-GUIDE.md im Projekt-Root.
//
//  Was hier konfigurierbar ist:
//    • Marke        — Name (zweifarbig), Tagline, Slogan, Versions-Badge
//    • Studio       — rechtlicher Name, Adresse, Telefon, Instagram, Web
//    • Landing-Page — Hero, Über-uns, Öffnungszeiten, Kontakt-Hinweise
//    • Portale      — Kundinnen-Portal & Team-Portal (Rollen, Demo-Zugänge)
//    • Module       — Team-Module ein-/ausschaltbar, Bezeichnungen frei
//    • Lokales      — Sprache, Währung
//
//  Akzentfarbe (Gold → Wunschfarbe): in src/app/globals.css den Wert
//  «--brand» unter «:root» ändern (siehe TEMPLATE-GUIDE.md).
// ═══════════════════════════════════════════════════════════════════════════

export interface BrandStat {
  value: string
  label: string
}

export interface BrandUser {
  username: string
  password: string
  name: string
  role: string
  initials: string
}

export interface BrandCustomerDemo {
  name: string
  email: string
}

export interface ModuleConfig {
  id: string
  group: "uebersicht" | "betrieb" | "stammdaten"
  label: string
  hint: string
  title: string
  subtitle: string
  icon: string
  enabled: boolean
}

export const BRANDING = {
  // ─── Version (wird überall sichtbar gekennzeichnet) ─────────────────────
  version: "1.0.0",

  // ─── Marke ───────────────────────────────────────────────────────────────
  // nameParts: Teil 1 normal, Teil 2 in Gold (Akzentfarbe).
  brand: {
    nameParts: ["Melek'ce", "Güzellik"],
    tagline: "Nail Art & Beauty Studio",
    slogan: "Her kadın bir melek gibi güzeldir",
    sloganDe: "«Jede Frau ist schön wie ein Engel»",
    icon: "sparkles" as "sparkles" | "heart" | "crown" | "flower",
  },

  // ─── Studio / Rechtliches ────────────────────────────────────────────────
  company: {
    legalName: "Melek'ce Güzellik",
    street: "Musterstrasse 12", // ← Hier die echte Adresse eintragen
    city: "5000 Aarau", // ← Hier den echten Ort eintragen
    phone: "+41 79 000 00 00", // ← Hier die echte Telefonnummer eintragen
    instagram: "melekce_guzellik17",
    website: "www.melekce-guzellik.ch", // ← Optional: eigene Website
    footerClaim: "Nail Art · Beauty · Wimpern",
  },

  // ─── Regionale Einstellungen ─────────────────────────────────────────────
  locale: {
    language: "de-CH",
    currency: "CHF",
  },

  // ─── Öffentliche Landing-Page ───────────────────────────────────────────
  landing: {
    heroTitle: "Schönheit, die",
    heroTitleAccent: "strahlt.",
    heroDescription:
      "Verwöhnende Nail-Art, elegante Beauty-Behandlungen und ausdrucksstarke Wimpern — bei Melek'ce Güzellik wird jede Frau wie ein Engel verzaubert. Jetzt ganz einfach online einen Termin buchen.",
    stats: [
      { value: "17+", label: "Behandlungen" },
      { value: "1000+", label: "verwöhnte Kundinnen" },
      { value: "5★", label: "Kundinnen-Liebling" },
    ] as BrandStat[],
    aboutTitle: "Ihr Wohlfühl-Studio",
    aboutText:
      "Bei Melek'ce Güzellik steht Ihre Schönheit im Mittelpunkt. In elegantem Ambiente verwöhnen wir Sie mit hochwertigen Produkten, präzisem Nageldesign und sanften Beauty-Behandlungen. Ob klassische Maniküre, ausgefallenes Nail-Art oder perfekte Wimpern — wir nehmen uns Zeit für Ihre Wünsche.",
    ctaButton: "Termin buchen",
    ctaHint: "Online in 1 Minute — ganz ohne Anruf",
  },

  // ─── Öffnungszeiten (Wochentage, Mo = 0) ────────────────────────────────
  openingHours: [
    { day: "Montag", hours: "Geschlossen", closed: true },
    { day: "Dienstag", hours: "09:00 – 18:00", closed: false },
    { day: "Mittwoch", hours: "09:00 – 18:00", closed: false },
    { day: "Donnerstag", hours: "09:00 – 18:00", closed: false },
    { day: "Freitag", hours: "09:00 – 18:00", closed: false },
    { day: "Samstag", hours: "09:00 – 16:00", closed: false },
    { day: "Sonntag", hours: "Geschlossen", closed: true },
  ],

  // ─── Kundinnen-Portal (Login ohne Passwort: Name + E-Mail) ──────────────
  customerPortal: {
    welcomeTitle: "Willkommen, liebe Kundin",
    bookTitle: "Neue Buchung",
    myBookingsTitle: "Meine Termine",
    demoCustomers: [
      { name: "Elif Yilmaz", email: "elif.yilmaz@example.ch" },
      { name: "Sarah Meier", email: "sarah.meier@example.ch" },
    ] as BrandCustomerDemo[],
  },

  // ─── Team-Zugänge (Login-Chips fürs Team-Portal) ────────────────────────
  users: [
    { username: "melek", password: "melek123", name: "Melek", role: "Inhaberin", initials: "MK" },
    { username: "admin", password: "admin123", name: "Administrator", role: "Studio-Admin", initials: "AD" },
  ] as BrandUser[],

  // ─── Fusszeile ───────────────────────────────────────────────────────────
  footer: {
    notes: [
      "Termin online buchen — 24/7",
      "Folgen Sie uns auf Instagram",
    ],
  },

  // ─── Modul-Registry (Team-Portal): Module ein-/ausschalten ──────────────
  modules: [
    { id: "dashboard", group: "uebersicht", label: "Übersicht", hint: "Heute & KPIs", title: "Studio-Übersicht", subtitle: "Termine heute · Anfragen · Auslastung · Umsatz", icon: "layout-dashboard", enabled: true },
    { id: "kalender", group: "betrieb", label: "Kalender", hint: "Wochenansicht", title: "Terminkalender", subtitle: "Alle Buchungen der nächsten 2 Wochen", icon: "calendar-days", enabled: true },
    { id: "buchungen", group: "betrieb", label: "Buchungen", hint: "Anfragen & Status", title: "Buchungs-Verwaltung", subtitle: "Anfragen bestätigen · abschliessen · stornieren", icon: "clipboard-list", enabled: true },
    { id: "kunden", group: "stammdaten", label: "Kundinnen", hint: "CRM & Historie", title: "Kundinnen-Verwaltung", subtitle: "Stammkundinnen · Umsatz · Notizen", icon: "users", enabled: true },
    { id: "leistungen", group: "stammdaten", label: "Leistungen", hint: "Preisliste", title: "Leistungen & Preise", subtitle: "Nägel · Beauty · Wimpern — Dauer und Preis", icon: "sparkles", enabled: true },
    { id: "galerie", group: "stammdaten", label: "Galerie", hint: "Arbeiten-Showcase", title: "Galerie verwalten", subtitle: "Bilder für die öffentliche Landing-Page", icon: "image", enabled: true },
    { id: "einstellungen", group: "stammdaten", label: "Einstellungen", hint: "Studio & Team", title: "Einstellungen", subtitle: "Studio-Daten · Öffnungszeiten · Team · System", icon: "settings", enabled: true },
  ] as ModuleConfig[],

  // ─── Startansicht im Team-Portal nach Login ─────────────────────────────
  defaultView: "dashboard",
}

// ─── Abgeleitete Hilfswerte (nicht abändern) ────────────────────────────────
export const ENABLED_MODULES = BRANDING.modules.filter((m) => m.enabled)
export const MODULE_MAP = new Map(ENABLED_MODULES.map((m) => [m.id, m]))
export const BRAND_DISPLAY =
  BRANDING.brand.nameParts.length === 2
    ? { part1: BRANDING.brand.nameParts[0], part2: BRANDING.brand.nameParts[1] }
    : { part1: BRANDING.brand.nameParts[0] ?? "", part2: "" }
export const BRAND_NAME = BRANDING.brand.nameParts.join(" ")
