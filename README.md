# Melek'ce Güzellik — Nail Art & Beauty Studio Suite

**Öffentliche Webseite + Kundinnen-Buchungsportal + Team-Verwaltung — alles in einer Anwendung.**

Entwickelt als **White-Label-Template**: Dieselbe Suite kann mit einer einzigen
Konfigurationsdatei für jedes andere Studio / jeden anderen Betrieb umetikettiert
werden (siehe `TEMPLATE-GUIDE.md`).

| Bereich | Funktion |
|---|---|
| 🌐 **Öffentliche Webseite** | Hero, Leistungen & Preise, Galerie, Über uns, Öffnungszeiten, Kontakt — ohne Login sichtbar (für Kundinnen & Suchmaschinen) |
| 👩 **Kundinnen-Portal** | Online-Termin buchen in 3 Schritten (Leistung → Datum & Zeit → Bestätigen), «Randevularım» mit Stornierung per Telefon — ganz ohne Login |
| 👑 **Team-Portal** | Studio-Übersicht (KPIs, heutige Termine, Umsatz, Live-Wetter), **Rezervasyon Merkezi (V3)** — alle Buchungen sehen, vollständig bearbeiten, neu anlegen, No-Show erfassen, CSV-Export — plus **Kundinnen-Benachrichtigung** per WhatsApp / SMS / E-Mail mit fertigen türkischen Vorlagen und Benachrichtigungs-Protokoll; Terminkalender (Klick → Bearbeiten), Bewertungs-Moderation, Kundinnen-CRM, Preis-Editor, Galerie, Einstellungen |

**Design:** «Black Gold Luxury» — tiefes Schwarz, Champagner-Gold, elegante
Serifen-Headlines (Noto Serif SC) + Inter. Alle Schriften lokal gebündelt.

**Demo-Zugänge:**

| Bereich | Zugang |
|---|---|
| Öffentliche Seite & Buchung | Kein Login — einfach «Randevu Al» klicken |
| Randevularım (eigene Termine) | Telefonnummer eingeben (Demo: `+90 532 111 22 33`) |
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
│   │   └── api/v1/salon/         # REST-API: services, bookings (GET/POST/PATCH/PUT/DELETE),
│   │                             #   notifications (V3), customers, stats, gallery, reviews
│   ├── components/
│   │   ├── landing/              # Öffentliche Webseite
│   │   ├── auth/                 # Team-Login
│   │   ├── public/               # Buchungsflow, Bewertungen, Karte (ohne Login)
│   │   ├── staff/                # Team-Portal (8 Module + Rezervasyon-Merkezi-Dialoge)
│   │   └── ui/                   # shadcn/ui-Komponenten
│   ├── config/branding.ts        # ★ DIE EINE DATEI für Rebranding
│   └── lib/                      # Salon-Typen, notify.ts (Vorlagen), phone.ts, DB, Rate-Limit
├── prisma/schema.prisma          # SQLite: Service, SalonCustomer, Booking, Review, GalleryItem, NotificationLog
├── scripts/seed-beauty.ts        # Demo-Daten: 17 Leistungen, 8 Kundinnen, 21 Buchungen, Bewertungen, Galerie
├── public/gallery/               # Studio-Bilder (echte Arbeiten + Hero)
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
| | PATCH | Preis / Dauer / Beschreibung / Popüler ändern |
| `/api/v1/salon/bookings` | GET | Buchungen (Filter: `phone`, `from`, `to`, `status`) |
| | POST | Neue Buchung (ganz ohne Login) — mit Kollisionsprüfung + WhatsApp-Link |
| | PATCH | Status ändern: `bekliyor → onaylandi → tamamlandi` / `iptal` / `gelmedi` (No-Show); Gäste-Storno per Telefon |
| | PUT | **V3:** Vollständiges Bearbeiten (Leistung, Datum/Zeit, Dauer, Preis, Kundin, Notizen, Status) — mit Kollisionsprüfung und fertiger Änderungs-Benachrichtigung |
| | DELETE | **V3:** Buchung endgültig löschen |
| `/api/v1/salon/notifications` | GET | **V3:** Benachrichtigungs-Protokoll (was wurde wann an wen gesendet) |
| | POST | **V3:** Protokoll-Eintrag erfassen (wird beim Kanal-Öffnen automatisch gesetzt) |
| `/api/v1/salon/customers` | GET | Kundinnen mit Umsatz-/Besuchsstatistik |
| `/api/v1/salon/stats` | GET | Dashboard-KPIs (heute, Auslastung aus echten Öffnungszeiten, Umsatz, No-Show, Top-Leistungen) |
| `/api/v1/salon/gallery` | GET | Galerie-Einträge für die Landing-Page |
| `/api/v1/salon/reviews` | GET | Veröffentliche Bewertungen + Stern-Verteilung |
| `/api/v1/weather` | GET | Live-Wetter + Pflege-Tipp (Open-Meteo, gekachelt) |

Telefonnummern werden V3-normalisiert: `+90 532 111 22 33`, `0532 111 22 33`
und `5321112233` gelten als dieselbe Nummer (Buchung, Storno, WhatsApp).

## 5. Für andere Projekte wiederverwenden

Diese Suite ist bewusst als **White-Label-Template** gebaut — die Schwester-Suite
(AutoFaszination Sales Suite, gleiche Architektur) läuft mit identischem
Bauplan in einer völlig anderen Branche. Schritt-für-Schritt für eigene
Projekte: **`TEMPLATE-GUIDE.md`** lesen.

## 6. Hinweise

- Demo-Authentifizierung: Team-Logins sind in `branding.ts` definiert (Demo-Modus).
  Für den Echtbetrieb ein echtes Auth-System ergänzen (NextAuth.js o. Ä.).
- Kundinnen benötigen **kein Konto**: Buchung und Storno laufen ohne Login über
  die Telefonnummer. Es werden keine Passwörter gespeichert.
- WhatsApp/SMS/E-Mail-Benachrichtigungen öffnen vorbereitete Deep-Links
  (`wa.me/…`, `sms:…`, `mailto:…`) — der eigentliche Versand passiert im
  jeweiligen Programm, damit bleibt die Suite schlüssellos und DSGVO-freundlich.
- Galerie-Ordner enthält echte Studio-Fotos plus KI-generierte Platzhalter.

---

## Changelog

### V3.0.0 — Rezervasyon Merkezi (Buchungsverwaltungszentrum)

- **Separater Verwaltungsbereich** für ALLE Buchungen: KPI-Leiste (heute /
  offene Anfragen / No-Show / offener Wert), Status-Tabs mit Zählern,
  Datumsfilter (heute / diese Woche / Zukunft / Vergangenheit) und Volltextsuche.
- **Volles Bearbeiten** jeder Buchung (PUT): Leistung, Datum & Uhrzeit, Dauer,
  Preis, Kundinnen-Stammdaten, Kunden-Notiz, interne Team-Notiz und Status —
  inklusive Kollisionsprüfung (eigenes Zeitfenster wird korrekt ausgenommen).
- **Neue Buchungen** direkt im Team-Portal anlegen (auch für Rückdatierung).
- **Kundinnen informieren** — das Herzstück: bei Bestätigung, Verschiebung,
  Storno oder No-Show öffnet sich automatisch ein Dialog mit fertig formulierter
  türkischer Nachricht; Versand per **WhatsApp, SMS oder E-Mail** (Deep-Link,
  ohne API-Keys), editierbar + Kopierfunktion; 6 Vorlagen (Onay / Değişiklik /
  İptal / Hatırlatma / Son Bakım / Özel).
- **Benachrichtigungs-Protokoll** (Tab «Bildirimler»): jede gesendete
  Nachricht wird mit Kanal, Typ, Text und Zeit protokolliert.
- **No-Show-Status** `gelmedi` überall sichtbar (Filter, Badges, Statistik,
  Auslastung) und blockiert keine Zeitfenster mehr.
- **CSV-Export** der gefilterten Liste (Excel-tauglich: UTF-8-BOM, Semikolon).
- **Kalender**: Klick auf einen Termin öffnet direkt das Bearbeitungsformular.
- **Bugfixes**: Telefon-Normalisierung (TR-Formate gelten als gleiche Nummer —
  Gäste-Storno mit `0532…` funktioniert jetzt), Buchungs-Preise im Seed
  übernehmen jetzt die Leistungs-₺-Preise statt alter CHF-Werte, wöchentliche
  Auslastung rechnet mit echten Öffnungszeiten statt pauschal 6×8h.

### V2.1.0 — Gelibolu, Karte, Konfetti, Rate-Limiting

Leaflet-Karte, Gold-Konfetti beim Buchungserfolg, WhatsApp-Deep-Links,
  Wetter-Pflege-Tipps, Preis-Editor, Bewertungsfilter, ₺-Währung,
  Rate-Limiting, echte Salon-Fotos.

### V2.0.0 — Öffentliche Buchungen & Bewertungen

Buchung und Bewertung ganz ohne Login, komplette türkische UI, Live-Wetter,
  Mobile-App-Feeling (Bottom-Nav), White-Label-Template.
