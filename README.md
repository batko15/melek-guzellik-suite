# Melek'ce Güzellik — Nail Art & Beauty Studio Suite

**Öffentliche Webseite + Kundinnen-Buchungsportal + Team-Verwaltung — alles in einer Anwendung.**

Entwickelt als **White-Label-Template**: Dieselbe Suite kann mit einer einzigen
Konfigurationsdatei für jedes andere Studio / jeden anderen Betrieb umetikettiert
werden (siehe `TEMPLATE-GUIDE.md`).

| Bereich | Funktion |
|---|---|
| 🌐 **Öffentliche Webseite** | Hero, Leistungen & Preise, Galerie, Über uns, Öffnungszeiten, Kontakt — ohne Login sichtbar (für Kundinnen & Suchmaschinen) |
| 👩 **Kundinnen-Portal** | Online-Termin buchen (3 Schritte: Leistung → Datum & Zeit → Bestätigen), «Meine Termine» mit Stornierung — Login nur mit Name + E-Mail |
| 👑 **Team-Portal** | Studio-Übersicht (KPIs, heutige Termine, Umsatz), Terminkalender (2 Wochen), Buchungs-Verwaltung (Anfragen bestätigen/abschliessen/stornieren), Kundinnen-CRM mit Historie, Preisliste, Galerie-Verwaltung, Einstellungen |

**Design:** «Black Gold Luxury» — tiefes Schwarz, Champagner-Gold, elegante
Serifen-Headlines (Noto Serif SC) + Inter. Alle Schriften lokal gebündelt.

**Demo-Zugänge:**

| Bereich | Zugang |
|---|---|
| Kundinnen-Portal | Beliebiger Name + E-Mail (z. B. `Elif Yilmaz` / `elif.yilmaz@example.ch`) |
| Team-Portal | `melek` / `melek123` (Inhaberin) oder `admin` / `admin123` |

---

## 1. Was ist darin enthalten?

```
melek-guzellik-suite/
├── src/
│   ├── app/                      # Next.js App Router (Landing-Route, APIs)
│   │   ├── page.tsx              # Einstieg → AppShell
│   │   ├── layout.tsx            # Meta-Daten (aus branding.ts generiert)
│   │   ├── globals.css           # Black-Gold-Design-System (--brand-Token!)
│   │   └── api/v1/salon/         # REST-API: services, bookings, customers, stats, gallery
│   ├── components/
│   │   ├── landing/              # Öffentliche Webseite
│   │   ├── auth/                 # Login (Kundinnen-Tab + Team-Tab)
│   │   ├── customer/             # Kundinnen-Portal (Buchungsflow)
│   │   ├── staff/                # Team-Portal (7 Module)
│   │   └── ui/                   # shadcn/ui-Komponenten
│   ├── config/branding.ts        # ★ DIE EINE DATEI für Rebranding
│   └── lib/                      # Salon-Typen, Formatierer, Modul-Registry, DB
├── prisma/schema.prisma          # SQLite-Datenmodell (Service, SalonCustomer, Booking, GalleryItem)
├── scripts/seed-beauty.ts        # Demo-Daten: 17 Leistungen, 8 Kundinnen, 19 Buchungen, Galerie
├── public/gallery/               # Studio-Bilder (Landing-Page-Galerie)
└── public/fonts/                 # Inter + Noto Serif SC (lokal, offline-fähig)
```

## 2. Installation & Start

Voraussetzung: **Node.js 20+** (oder Bun) — https://nodejs.org

```bash
# 1. Abhängigkeiten installieren
npm install            # oder: bun install

# 2. Datenbank einrichten + Demo-Daten laden
npx prisma db push
npx tsx scripts/seed-beauty.ts     # oder: bun run scripts/seed-beauty.ts

# 3. Entwicklungsserver starten
npm run dev            # → http://localhost:3000
```

**Das war's.** Die Datenbank (SQLite) liegt lokal in `db/custom.db` — kein
Cloud-Dienst nötig, alle Daten bleiben auf Ihrem Rechner.

### Produktivbetrieb (echte Kundinnen)

Für den dauerhaften Betrieb empfiehlt sich ein Hosting:

| Option | Aufwand | Kosten |
|---|---|---|
| **Vercel** (empfohlen) | Repo importieren, `DATABASE_URL` setzen, deploy | kostenlos für kleine Projekte |
| ** eigener Server / VPS** | `npm run build && npm start` hinter nginx | ab ca. 5 CHF/Monat |
| **Hetzner / andere** | beliebig | variabel |

> Hinweis: SQLite eignet sich für Einzelbetrieb. Bei mehreren gleichzeitigen
> Nutzern oder Lastausfall auf PostgreSQL/MySQL umstellen (Prisma unterstützt
> beides mit minimalen Änderungen in `schema.prisma`).

## 3. Inhalte anpassen — ohne Programmieren

### Marke, Adresse, Preise, Texte: `src/config/branding.ts`

Die komplette Suite wird aus dieser EINEN Datei gesteuert: Markenname, Tagline,
Studio-Adresse, Telefon, Instagram, Landing-Page-Texte, Öffnungszeiten (steuern
automatisch die Buchungs-Slots!), Team-Zugänge, Fusszeile.

### Akzentfarbe: `src/app/globals.css` → `--brand`

```css
--brand: oklch(0.75 0.12 85);   /* Champagner-Gold (Standard) */
/* Rosé: oklch(0.72 0.12 15) · Silber: oklch(0.72 0.02 260) · Türkis: oklch(0.68 0.11 195) */
```

Buttons, Charts, Badges, Glow-Effekte und aktive Navigation folgen automatisch.

### Leistungen & Preise: Datenbank

Die Preisliste liegt in der Datenbank (Tabelle `Service`) und wird im
Team-Portal unter **Leistungen** angezeigt. Änderungen direkt in der DB oder
über das Seed-Skript (`scripts/seed-beauty.ts` → Array `SERVICES`).

### Bilder: `public/gallery/`

Eigene Fotos als PNG/JPG in `public/gallery/` ablegen und die Pfade in der
Tabelle `GalleryItem` (Seed-Skript → Array `GALLERY`) eintragen.

## 4. API-Überblick (für eigene Erweiterungen)

| Route | Methode | Zweck |
|---|---|---|
| `/api/v1/salon/services` | GET | Alle aktiven Leistungen |
| `/api/v1/salon/bookings` | GET | Buchungen (Filter: `email`, `from`, `to`, `status`) |
| | POST | Neue Buchung (Kundinnen-Portal) — mit Kollisionsprüfung |
| | PATCH | Status ändern: `angefragt → bestaetigt → abgeschlossen` oder `storniert` |
| `/api/v1/salon/customers` | GET | Kundinnen mit Umsatz-/Besuchsstatistik |
| `/api/v1/salon/stats` | GET | Dashboard-KPIs (heute, Auslastung, Umsatz, Top-Leistungen) |
| `/api/v1/salon/gallery` | GET | Galerie-Einträge für die Landing-Page |

## 5. Für andere Projekte wiederverwenden

Diese Suite ist bewusst als **White-Label-Template** gebaut — die Schwester-Suite
(AutoFaszination Sales Suite, gleiche Architektur) läuft mit identischem
Bauplan in einer völlig anderen Branche. Schritt-für-Schritt für eigene
Projekte: **`TEMPLATE-GUIDE.md`** lesen.

## 6. Hinweise

- Demo-Authentifizierung: Team-Logins sind in `branding.ts` definiert (Demo-Modus).
  Für den Echtbetrieb ein echtes Auth-System ergänzen (NextAuth.js o. Ä.).
- Die Kundinnen-«Anmeldung» (Name + E-Mail) ist eine bewusst niederschwellige
  Demo-Lösung ohne Passwort — für echte Kundendaten ggf. mit Bestätigungs-E-Mail
  kombinieren.
- Alle Bilder im Ordner `public/gallery/` sind KI-generierte Platzhalter —
  durch eigene Studio-Fotos ersetzen.
