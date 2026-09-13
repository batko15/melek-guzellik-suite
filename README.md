# 💅 Melek'çe Güzellik Suite — V5.7 CANLI NAIL STUDIO

**Die komplette Salon-Software für Nagelstudios & Beauty-Studios — öffentliche Webseite, Kundinnen-Buchungsportal und Team-Verwaltung in einer Anwendung.**

> Entwickelt nach dem Standard moderner Salon-Plattformen (Booksy, Vagaro, Mangomint, Salonkee, OpenSalon — Feature-Recherche 2026) und als **White-Label-Template** aufgebaut: Dieselbe Suite lässt sich über eine einzige Konfigurationsdatei (`src/config/branding.ts`) für jedes andere Studio umetikettieren (siehe `TEMPLATE-GUIDE.md`).

---

## ✨ Feature-Highlights (V5.7 CANLI NAIL STUDIO)

### 🌐 Öffentliche Webseite (ohne Login)
- **Luxury-Design** «Black-Gold-Champagner» mit echtem Studio-Logo (Engelsflügel), Gold-Eck-Ornamenten und Rauten-Trennern — mobil, Tablet & Desktop optimiert
- ⭐ **V5 CLOUD**: Komplett Vercel- + Supabase-fähig — PostgreSQL-Unterstützung mit **vollautomatischem Datenbank-Setup** (Tabellen + Grunddaten beim ersten Aufruf, ohne CLI/Migrationen)
- ⭐ **V5.2 Serverless-Härtung**: Supabase-**Transaction-Pooler** wird automatisch genutzt (Port 6543, `pgbouncer=true`, 1 Verbindung pro Funktion) — kein «max clients reached» mehr; Vercel-Funktionen in **Dublin (dub1)** neben der Datenbank (eu-west-1) für minimale Latenz; `maxDuration 60 s` für den Erste-Aufruf-Bootstrap
- ⭐ **V5.2 SEO**: `robots.txt` + `sitemap.xml` automatisch generiert
- ⭐ **V5 ECHT-DATEN**: echte Adresse (Hoca Hamza Mah. 1023. Sk No: 2, Gelibolu), echte Telefon-/WhatsApp-Nummer (+90 536 572 66 10 in `branding.ts`), Kontakt läuft über Buttons (Anruf/WhatsApp), exakte Karten-Koordinaten + Google-Maps-Ortslink
- ⭐ **V5 GALERIE**: 22 echte Instagram-Fotos des Studios (die 6 neuesten Arbeiten direkt von @melekce_guzellik17 übernommen)
- Leistungen & Preise im **Menü-Stil** (punktierte Preisführung), **Galerie mit Kategorie-Filter** (Tırnak / Güzellik / Kirpik / Stüdyo)
- ⭐ **V5.6 Nail Art**: Eigene, teilbare **Tırnak-Sanatı-Galerie** unter `/nailart` — alle 14 Nagel-Designs groß im **Lightbox-Modus** (Pfeiltasten/ESC), pro Design **«Bu tasarımı WhatsApp'tan iste»** (Design-Name automatisch in der Nachricht), Preisliste der 8 Nageldienste, Teilen-Button (Web-Share/Panoya kopyala); verlinkt aus Navigation, Galerie-Sektion, mobiler Alt-Navigation und PWA-Shortcut
- ⭐ **V5.7 Canlı Nail Studio**: **Interaktiver Nageldesign-Konfigurator** unter `/nailstudio` — Kundinnen wählen **Şekil (6 Formen) · Boy (3 Längen) · Renk (16 Farben) · Efekt (6 Finishes) · Nail Art (8 Muster)** und sehen eine **stilisierte Hand als Live-SVG-Vorschau**, die sofort mitwächst; 9 Fertig-Presets aus der echten Galerie, unverbindliche **Preis-Schätzung** (Grundleistung + Aufpreise), **«Bu Tasarımla Randevu Al»** hängt das Design automatisch an die Buchung (DB-Feld `design` + lesbarer Notizeile) — sichtbar auf jedem Buchungsschritt, im Erfolgsbildschirm und als goldene «💅»-Zeile im Ekip-Portal; WhatsApp-Share & Copy-Link inklusive
- Live-**Wetter-Widget** mit türkischen Pflege-Tipps (Open-Meteo, schlüssellos), **interaktive Karte** (Leaflet, dunkle CARTO-Tiles)
- ⭐ **V5.5 Mobil Uygulama**: App-Download-Bereich im Footer mit **QR-Code in Markenfarben** (Champagner-Gold auf Samt) — zeigt immer auf das neueste GitHub-Release; dazu PWA-Installationshinweis für iPhone
- Gästebewertungen mit Sternen — jeder darf ohne Login bewerten (moderiert)

### 👩 Kundinnen-Portal (ohne Login)
- **Online-Buchung in 3 Schritten** (Leistung → Datum & Zeit → Kontaktdaten) — keine Registrierung, Telefon genügt
- ⭐ **V5.4 Hediye Kartı**: Digitale Geschenkkarten direkt auf der Webseite kaufen — Betragswahl (500/750/1000/1500 ₺ oder frei), persönliche Widmung, Code im Format `MELEK-XXXX-XXXX`, öffentliche Bakiye-Abfrage
- ⭐ **V5.4 Paketler**: Kombi-Pakete mit Sparvorteil (Manikür+Pedikür 1.100 ₺ statt 1.300 ₺ u.v.m.) — direkt buchbar wie Einzelleistungen
- ⭐ **V5.4 Bekleme Listesi**: Ist ein Tag ausgebucht, landet die Kundin automatisch auf der Warteliste — das Studio füllt abgesagte Termine mit einem Klick nach
- ⭐ **V5.4 Klare Storno-Politik** im Buchungsfluss (24-h-Regel, transparent vor Absenden)
- «Randevularım»: eigene Termine per Telefonnummer einsehen & stornieren
- Buchungsbestätigung mit **Gold-Konfetti** + **WhatsApp-Deep-Link** (vorausgefüllte türkische Buchungszusammenfassung)

### 👑 Team-Portal (Login)
| Modul | Funktionen |
|---|---|
| **Genel Bakış** | 6 Live-KPIs: heutige Termine, offene Anfragen, **fällige Erinnerungen**, **niedriger Lagerbestand**, Auslastung, **belohnungsbereite Kundinnen** + Wetter |
| **Takvim** | 2-Wochen-Kalender, klickbare Karten → gemeinsames Formular zum Bearbeiten |
| **Rezervasyon Merkezi** | ALLE Termine: ansehen, vollständig bearbeiten, neu anlegen, No-Show, CSV-Export · **automatische Erinnerungs-Warteschlange** (48 h) mit 1-Klick-WhatsApp/SMS |
| **Bekleme Listesi** ⭐ NEU V5.4 | **Warteliste mit Backfill**: ausgebuchte Tage → Kundinnen-Wünsche; Absage → Tag öffnen → «Randevu Oluştur» mit freier Stunde + **WhatsApp-Angebot** — der Kalender bleibt voll (No-Show-Schutz № 4 laut Branchenstudien) |
| **Hediye Kartları** ⭐ NEU V5.4 | **Digitale Geschenkkarten-Verwaltung**: Zahlungseingänge aktivieren, Guthaben pro Termin abbuchen (Teilbeträge möglich), Statuslebenszyklus (Anfrage → aktiv → verbraucht), Statistken + Käufer-WhatsApp-Benachrichtigung |
| **Bildirimler** | Protokoll aller Kundenbenachrichtigungen (WhatsApp / SMS / E-Mail) mit 6 türkischen Vorlagen |
| **Mesaj Merkezi** ⭐ NEU V5 | **Direkt-Kundenkontakt ohne Termin**: fertige türkische Vorlagen (Kampagne, Erinnerung, Geburtstag, Dank, frei) — Versand per WhatsApp, SMS, E-Mail (vorausgefüllt) oder Instagram-DM (Nachricht wird kopiert, DM-Postfach öffnet) — direkt aus der Kundenkarte |
| **Envanter** ⭐ NEU V4 | **Materiallager**: Gele, Acryl, Wimpern, Öle — Mengen-±, Mindestbestand-Alarme, Lagerwert, Lieferanten |
| **Müşteriler** ⭐ V4 | **Digitale Kundenkarte**: Allergie- & Empfindlichkeits-Erklärung (rot markiert), Präferenzen (Form / Gel-Typ / Lieblingsfarben), **Treue-Stempelkarte** (10 Stempel = Belohnung), Portfolio-Fotos pro Kundin, Punkthistorie |
| **Ekip & Prim** ⭐ NEU V4 | **Provisionsrechner**: Umsatz & abgeschlossene Termine pro Mitarbeiter × Provisionsquote → fällige Provision, Monatsansicht |
| **Yorumlar** | Bewertungs-Moderation (genehmigen / ablehnen), Filter nach Sternen & Leistung |
| **Hizmetler** | Preis-Editor (Preis, Dauer, Beschreibung, Beliebtheit) direkt in der Zeile |
| **Galeri** | Verwaltung der öffentlichen Galerie + Kundinnen-Portfolio-Zuordnung |
| **Ayarlar** | Studio-Daten, Öffnungszeiten, Team, System · ⭐ **NEU V5.5 Sistem Durumu**: Live-Systemmonitor (Bulut-DB-Latenz, **Supabase-API-Gateway-Check** mit Free-Tier-Pausen-Warnung, SMTP/Twilio-Bereitschaft) |

### 🔔 Benachrichtigungen & Rückstellung (Recherche-Best Practices)
- ⭐ **V5.4 Vercel Cron**: `/api/v1/cron/reminders` läuft täglich 11:00 TSİ — versendet automatisch 24-h-Erinnerungen (E-Mail + WhatsApp) und protokolliert sie; mit `CRON_SECRET` absicherbar
- **6 türkische Nachrichten-Vorlagen**: Bestätigung, Änderung, Stornierung, Erinnerung, Nachsorge, individuell
- **Automatische Erinnerungs-Warteschlange**: alle Termine der nächsten 48 h ohne gesendete Erinnerung — 1 Klick öffnet WhatsApp mit fertiger Nachricht, Versand wird protokolliert (No-Show-Schutz № 1 laut Branchenstatistik)
- **Anzahlung / Stornierungsschutz**: Anzahlungsbetrag + Zahlungswahlschalter pro Termin (No-Show-Schutz № 2)
- Kanal-Deep-Links: `wa.me` (WhatsApp), `sms:`, `mailto:` — ohne API-Schlüssel produktiv nutzbar; Twilio/SMTP-Anbindung aktiv konfigurierbar (V5.3)

### 🛡️ Sicherheit & Qualität
- **IP-basiertes Rate-Limiting** (Sliding Window) auf allen Schreib-Endpunkten (26 Stellen) mit türkischen 429-Meldungen
- **Eingabevalidierung** serverseitig auf allen Routen (Längen, Bereiche, Enums, Telefon-Normalisierung `+90 …`)
- Kollisionsprüfung bei Terminen (inkl. Eigenausschluss beim Bearbeiten), kanonische Telefon-Zusammenführung (UPsert)
- React-Standard-Escaping (kein `dangerouslySetInnerHTML` mit Nutzereingaben), URL-Encoding aller Deep-Links
- **0 ESLint-Fehler · 0 TypeScript-Fehler** in `src/` · E2E-verifiziert (Desktop 1440 px, Tablet 820 px, Mobile 390 px)

---

## 🧰 Tech-Stack

| Ebene | Technologie |
|---|---|
| Frontend | **Next.js 16 (App Router, Turbopack)** · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui (Radix) · TanStack Query |
| Backend | **Next.js API-Routen** (`/api/v1/…`) · eigenvalidierte Handler (Typ- & Bereichsprüfungen) |
| Datenbank | **SQLite** via **Prisma ORM** (11 Modelle, additive Migrationen) — Datei-Backups genügen |
| Karten & Wetter | Leaflet 1.9 (CARTO Dark) · Open-Meteo (Server-Proxy mit Cache) |
| Effekte | canvas-confetti (Gold-Konfetti) · eigene CSS-Animationen (Logo-Schimmer, Stempel-Glow) |
| Fonts | Noto Serif SC (Display) + Inter (UI) — **lokal gebündelt, offlinefähig** |

### Systemarchitektur

```
┌──────────────────────────────────────────────────────────────┐
│                    Browser (Mobil / Tablet / Desktop)        │
│  Öffentliche Seite · Buchung · Bewertungen   Team-Portal     │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTPS / LAN
┌──────────────────────────▼───────────────────────────────────┐
│              Next.js 16 (Port 3000) — App Router             │
│  React-UI (Tailwind + shadcn)      API-Routen /api/v1/salon/ │
│  branding.ts (White-Label-Kern)    bookings · services ·     │
│  module-registry.ts                customers · reviews ·     │
│                                    gallery  · inventory ·    │
│                                    staff    · reminders ·    │
│                                    notifications · stats      │
└──────────────────────────┬───────────────────────────────────┘
                           │ Prisma Client
                ┌──────────▼──────────┐        ┌─────────────────┐
                │  SQLite custom.db   │        │ Open-Meteo API  │
                │  Service · Customer │        │ (Wetter-Proxy,  │
                │  Booking · Review   │        │  gecacht)       │
                │  NotificationLog    │        └─────────────────┘
                │  GalleryItem        │
                │  InventoryItem  ⭐  │
                │  StaffMember    ⭐  │
                │  LoyaltyLog     ⭐  │
                └─────────────────────┘
                           │ wa.me / sms: / mailto:
                    Kundinnen-Benachrichtigung
```

---

## 🚀 Installation

### Variante A: Lokal (Entwicklung)

```bash
# 1. Repository klonen
git clone https://github.com/batko15/melek-salon-suite.git
cd melek-salon-suite

# 2. Abhängigkeiten installieren
npm install            # oder: bun install

# 3. Datenbank initialisieren (SQLite-Datei db/custom.db)
npm run db:push        # Prisma-Schema anlegen
npx prisma generate    # Client generieren

# 4. Demo-Daten laden (optional, empfohlen)
npx tsx scripts/seed-beauty.ts        # Grunddaten: Leistungen, Kundinnen, Termine …
npx tsx scripts/seed-v4-upgrade.ts    # V4: Team, Lager, Kundenkarten, Treuepunkte …

# 5. Starten
npm run dev            # → http://localhost:3000
```

**Produktions-Build:** `npm run build && npm start`

### Variante B: Vercel + Supabase (Kostenlos & Dauerhaft Online) ⭐ EMPFOHLEN FÜR DEN LIVE-BETRIEB

1. **Supabase-Projekt** anlegen → [supabase.com](https://supabase.com) → New Project (Region Frankfurt) → unter *Project Settings → Database → Connection String → URI* kopieren und `[YOUR-PASSWORD]` ersetzen → das ist die `DATABASE_URL`
2. **Repository** auf GitHub pushen (`.env` bleibt lokal — steht in `.gitignore`)
3. **Vercel**: [vercel.com](https://vercel.com) → Sign up with GitHub → *Add New Project* → Repository importieren
4. **Environment Variables**: `DATABASE_URL` = die Supabase-URI aus Schritt 1 eintragen → **Deploy**
5. **Fertig** — beim ersten Aufruf richtet sich die Cloud-Datenbank **vollautomatisch** ein (Tabellen + 17 Leistungen + 22 Galerie-Fotos + Team). Keine Migrationen, kein CLI, kein weiteres Setup nötig.

> Die App erkennt am `DATABASE_URL`-Protokoll selbstständig, ob SQLite (lokal) oder PostgreSQL (Supabase) genutzt wird — derselbe Code, beide Welten.

### Variante C: Docker (Studio-Betrieb)

---

## 🔑 Zugänge

| Bereich | Zugang |
|---|---|
| Öffentliche Seite & Buchung | Kein Login — «Randevu Al» klicken |
| Randevularım | Eigene Telefonnummer eingeben |
| Team-Portal | Benutzername + Passwort — Zugangsdaten liegen privat bei der Inhaberin (`src/config/branding.ts`) |

> ⚠️ **Sicherheit:** Zugänge werden nirgends auf der Seite angezeigt. Passwörter nur der Inhaberin bekannt geben und bei Bedarf in `src/config/branding.ts` ändern.

---

## 📚 API-Dokumentation (Auszug)

Basis: `/api/v1` — alle Antworten JSON, Fehlermeldungen auf Türkisch.

| Methode & Route | Zweck |
|---|---|
| `GET /salon/services` | Leistungen (kategorisiert, mit Preis/Dauer) |
| `PATCH /salon/services` | Leistung bearbeiten (Preis, Dauer, …) |
| `GET /salon/availability?date=…` | freie Zeitfenster eines Tages |
| `POST /salon/bookings` | **öffentliche Buchung** (Name + Telefon) → Rückgabe inkl. `whatsappUrl` |
| `GET /salon/bookings?phone=…` | eigene Buchungen (Kundin) · ohne Parameter: alle (Team) |
| `PUT /salon/bookings` | **vollständige Bearbeitung** (Dienst, Zeit, Preis, Kundin, Notizen, **Kaution**, **Team-Zuweisung**, Status) |
| `PATCH /salon/bookings` | Statuswechsel — bei `tamamlandi` automatische **Treuepunkte** (1 je 100 ₺) |
| `DELETE /salon/bookings?id=…` | endgültig löschen |
| `GET /salon/reminders?hours=48` | ⭐ **fällige Erinnerungen** (fertige Nachricht + Kanal-Links) |
| `POST /salon/notifications` | Benachrichtigungs-Versand protokollieren |
| `GET /salon/customers` | Kundinnen inkl. **Kundenkarte** (Allergien, Präferenzen, Treuepunkte, Portfolio) |
| `PUT /salon/customers` | Kundenkarte bearbeiten |
| `PATCH /salon/customers` | Treuepunkte vergeben / einlösen |
| `GET /salon/inventory` | ⭐ Lagerbestand (inkl. `lowStock`, Gesamtwert) |
| `POST/PUT/DELETE /salon/inventory` | Material anlegen / bearbeiten / löschen |
| `GET /salon/staff?month=YYYY-MM` | ⭐ Team + **Provisionsstatistik** (Umsatz, Provision) |
| `POST/PUT/DELETE /salon/staff` | Team-Mitglieder verwalten |
| `GET /salon/stats` | KPIs (heute/Woche/Monat + V4: niedriger Lagerbestand, fällige Erinnerungen, Team) |
| `GET /salon/reviews` · `PATCH` | Bewertungen (öffentlich / moderiert) |
| `GET /salon/gallery` · `PATCH` | Galerie + Portfolio-Zuordnung |
| `GET /weather` | Wetter-Proxy (Open-Meteo, gecacht) |

**Fehlerformat:** `{ "error": "Türkçe Meldung" }` mit HTTP 400/403/404/409/429/500 · Rate-Limit-Antworten enthalten `Retry-After`.

---

## 🗂 Projektstruktur (Auszug)

```
src/
├── app/                      # App Router: Seiten + API-Routen (/api/v1/salon/…)
├── components/
│   ├── landing/              # öffentliche Webseite (Hero, Logo-Ehrenkarte, Menü-Preise …)
│   ├── public/               # Buchungs-Ablauf · Bewertungen · Karte
│   ├── staff/                # Team-Module (Rezervasyon, Envanter ⭐, Ekip ⭐, Müşteriler …)
│   └── ui/                   # shadcn/ui-Basis
├── config/branding.ts        # ⭐ White-Label-Kern: Marke, Studio, Öffnungszeiten, Module
├── lib/                      # notify.ts (Vorlagen) · phone.ts · rate-limit.ts · salon.tsx (Typen)
└── prisma/schema.prisma      # 11 Datenmodelle
scripts/                      # seed-beauty.ts · seed-v4-upgrade.ts · Start-Daemon
public/brand/                 # echtes Logo (vollständig / Flügel / Text)
public/gallery/real/          # echte Studio-Fotos
```

---

## 📋 Changelog

### V6.0 — «PROFESYONEL EDITION» (Design-Überarbeitung + KMS Signed Tokens)
- 🎨 **Landing-Page neu komponiert** — aufgeräumt & höchst professionell, komplett in der Samt-Schwarz-Gold-DNA: Live-«Şu an açık/kapalı»-Badge im Hero (echte Öffnungszeiten-Auswertung), Trust-Strip (4 Karten), «Nasıl Çalışır» in 3 Schritten mit großen Serifen-Ziffern, SSS-Accordion (6 Fragen + `FAQPage`-JSON-LD für Google-Rich-Snippets)
- 🖼️ **Galerie-Lightbox V2** (yet-another-react-lightbox): Zoom + Thumbnail-Leiste + Zähler direkt auf der Landing-Galerie
- ⭐ **Rezensionen als Embla-Carousel** (Gruppen à 3, Pfeile + Dots, Loop) und **Hero-Stats mit CountUp-Animation** (17+ Jahre, 1000+ Kundinnen, 4.9★)
- 🦶 **Footer V2**: 3 Spalten (Marke + Social | Hızlı Bağlantılar | Öffnungszeiten mit Heute-Markierung + App-QR-Code), sauberes Bottom-Band
- 💅 **Randevu-Preselect**: «Randevu Al» auf der Landing übergibt die gewählte Leistung **direkt** in die Buchung (Schritt 2 mit Zusammenfassung) — Kundinnen wählen schneller
- 🐛 **Bugfixes**: Navbar-/Galerie-CTAs sind jetzt echte SPA-Buttons (kein Seiten-Neuladen mehr), Service-Übergabe aus dem Landing funktioniert, Hydration-Mismatch durch `img-comparison-slider` behoben (neuer hydration-sicherer `compare-slider`)
- 🔐 **NEU: Vercel KMS Signed Tokens** — `GET /api/v1/kms/token` signiert Tokens mit dem Account-Signing-Key (`@vercel/kms`); Verifikation über JWKS bzw. `docs/vercel-kms-public-key.pem`; Issuer konfigurierbar via `VERCEL_KMS_ISSUER_ID`
- 📱 Mobile & Desktop browser-verifiziert (1440 px + 390 px, 0 Console-Fehler); ESLint 0 Fehler

### V5.7 — «CANLI NAIL STUDIO» (Live-Nageldesign-Konfigurator)
- 🪄 **Neue öffentliche Route `/nailstudio`** (SEO + Sitemap + PWA-Shortcut): Kundinnen erstellen ihr Nageldesign **selbst und live** — reine SVG-Vorschau (keine Bilder, ultra-schnell, offline-fähig)
- 🖐️ **Live-Hand-Vorschau**: 5 Finger mit individuell gezeichneten Nägeln — alle 6 Formen (Kare/Yuvarlak/Oval/Badem/Stiletto/Balerina) als echte SVG-Pfade, Längen ändern die Nagelgröße sichtbar, Effekte (Kedi Gözü mit Magnetlinie, Sim-Partikel, Krom-Verlauf, Sedef-Schimmer, Mat/Parlak) und alle 8 Nail-Art-Muster werden live darüber gerendert
- 🎨 **16 Studio-Farben** + 9 Galerie-Presets (Bordo Kedi Gözü, Bordo Ombre, Klasik French, Deniz Kabuğu French, 24K Altın Folyo, İnci Tozu, Nar Çiçeği, Siyah Krom, Pudra Sim)
- 💰 **Preis-Schätzung live**: Grundleistung aus der echten Preisliste (Kısa → Jel Manikür, Orta/Uzun → Jel Uzatma) + konfigurierbare Aufpreise pro Efekt/Nail-Art
- 📅 **Buchungs-Integration**: «Bu Tasarımla Randevu Al» → Design hängt an der Buchung (neues DB-Feld `Booking.design`, kompakter JSON + Menschen-lesbare Notiz) — Chip «💅 Tasarım hazır» im Booking-Header, Zusammenfassung in Schritt 1 & 3, Anzeige im Erfolgsbildschirm, **goldene Design-Zeile im Ekip-Portal** (Rezervasyon Merkezi, Tabelle + Karten)
- 🐛 **Bugfix**: «Randevularım» fand mit lokal formatierter Nummer («0539 …») die Buchung nicht, wenn sie als «+90 539 …» gespeichert war — GET `/api/v1/salon/bookings?phone=` durchsucht jetzt kanonisch + roh
- 🐛 **Bugfix**: konkurrierende `public/robots.txt` + `src/app/robots.ts` → 500-Fehler auf `/robots.txt` behoben (Datei entfernt, Metadata-Route gewinnt)
- ⚡ **Performance & Sicherheit**: `compress`, `poweredByHeader: false`, Security-Header (nosniff, SAMEORIGIN, Referrer-Policy, Permissions-Policy), 1-Jahres-`immutable`-Cache für Galerie-/Brand-Assets, `optimizePackageImports` (lucide-react, date-fns), AVIF/WebP-Formate; ESLint 0 Fehler (auch in allen Dev-Skripten)
- 📱 Mobile: 5. Tab «Studio» in der App-Navigation, Grid-Overflow-Fix (`minmax(0, …)`) — auf 390 px exakt ohne horizontales Scrollen
- 📚 Doku: `APP-ANLEITUNG.md` Kapitel 5️⃣g mit Kundinnen-Anleitung + Anpassung der Aufpreise

### V5.6 — «NAIL ART GALERİSİ» (teilbare Design-Galerie)
- 💅 **Neue öffentliche Route `/nailart`** — die komplette Tırnak-Sanatı-Galerie als eigener, teilbarer Live-Link (SEO-Metadaten + Sitemap-Eintrag): alle Nagel-Designs aus der Datenbank in großer Grid-Ansicht
- 🔍 **Lightbox-Modus**: Design anklicken → Vollbild mit Pfeiltasten-/Swipe-Navigation (←/→/ESC), Design-Zähler (x/14) und Gold-Rahmen
- 💬 **«Bu tasarımı WhatsApp'tan iste»**: pro Design vorausgefüllte WhatsApp-Nachricht mit Design-Name (z. B. «Kedi Gözü») — die Kundin tippt nur noch senden; Nummer bleibt ausschließlich im Link (Klartext-Schutz V5.5.1 unverändert)
- 💰 **Tırnak-Hizmetleri & Fiyatlar**: alle 8 Nageldienste im Menü-Stil mit Dauer + «Randevu Al»-Sprung, direkt auf der Galerie-Seite
- 🔗 **Galeriyi paylaş**-Button (Web-Share-API mit Clipboard-Fallback) — perfekt für Instagram-Stories & WhatsApp-Status
- 🧭 **Verlinkt überall**: Desktop-Navigation («Nail Art ✨»), Gold-Button unter der Haupt-Galerie, mobile Alt-Navigation (4. Tab) und PWA-Shortcut («Randevularım»-Duplikat ersetzt)
- ✅ Vollständige Live-Prüfung aller Seiten/Endpunkte/Bilder (13 Routen + 23/23 Galerie-Fotos, 0 Console-Fehler); ESLint 0 / TSC 0 (src/) · Production-Build sauber

### V5.5.1 — «Nummer-Schutz» (Telefonnummer nicht mehr sichtbar)
- 🔒 **Telefonnummer überall funktional korrigiert** (neue Nummer in `branding.ts` → alle `tel:`- und `wa.me`-Links, Buchungs-/Benachrichtigungs-Vorlagen automatisch aktualisiert) — **aber nicht mehr als Klartext auf öffentlichen Seiten sichtbar**: Kontaktbereich zeigt jetzt «Bizi arayın» (Anruf-Button) + «WhatsApp'tan yaz», Hediye-Kart-Hinweis und Fehler-Fallbacks ebenfalls verlinkt statt numeriert; Seiten-Footer zeigen Stadt statt Nummer
- 📱 Android-App (Build 3) unverändert gültig — lädt die Webseite live, Korrektur wirkt automatisch

### V5.5 — «MOBİL & CANLI İZLEME» (Android-App V2 + Supabase-API-Monitoring)
- 📱 **Android-APK neu gebaut** (App 5.5.0, Build 3): Startscreen-Shortcuts für **Randevu**, **Hediye Kartı** und **Yorumlar** (langer Druck aufs App-Icon); gleiche Signatur wie V5.1 → Updates installieren sich drüber; APK + AAB wieder im GitHub-Release
- 🩺 **Sistem Durumu (Live-Systemmonitor)**: neue Karte im Ekip-Portal → Ayarlar — prüft auf einen Klick die Bulut-Datenbank (Latenz, Hizmet-Zählung) UND das **Supabase-API-Gateway** (`https://pmudlcpusvwvmejirpsq.supabase.co`) live ab; warnt rot, wenn das Free-Tier-Projekt nach 7 Tagen Inaktivität pausiert wurde (Restore-Anleitung gleich mit dabei); zeigt SMTP/Twilio-Bereitschaft als Badges
- 🔌 **Neuer Endpunkt** `/api/v1/salon/system-status` (Rate-Limit 10/min) + `diag` zeigt jetzt `supabaseApi: { active: true }` — Supabase-URL wird automatisch aus der `DATABASE_URL` abgeleitet (`SUPABASE_API_URL` überschreibbar)
- 📲 **App-Download-Bereich** auf der öffentlichen Webseite (Footer): QR-Code in Markenfarben (Champagner-Gold auf Samt) verlinkt auf `releases/latest` — veraltet nie; «Android için indir»-Button + iPhone-PWA-Hinweis
- ⚡ **PWA-Manifest**: Shortcuts um **Hediye Kartı** und **Yorumlar** erweitert
- ✅ ESLint 0 / TSC 0 (src/) · Production-Build sauber · APK mit aapt2 + apksigner verifiziert (Paket, Version, Signatur, Shortcuts)

### V5.4 — «EŞSİZ» (Marktanalyse-Upgrade: Geschenkkarten · Warteliste · Cron)
- 🎁 **Hediye Kartı (Digitale Geschenkkarten)**: Buchsy/Mangomint-Standard — Kundinnen erstellen auf der Webseite eine Kartenanfrage (Betrag, Empfängerin, Notiz) → Studio aktiviert nach Zahlungseingang → Guthaben wird pro Termin (auch Teilbeträge) abgebucht; öffentliche Bakiye-Abfrage per Code `MELEK-XXXX-XXXX`; Admin-Modul mit Statistiken + WhatsApp-Aktivierungsbenachrichtigung
- 📋 **Bekleme Listesi (Warteliste mit Backfill)**: Einer der vier nachweislich wirksamsten No-Show-Gegenmaßnahmen — ausgebuchte Tage bieten der Kundin automatisch die Warteliste an (Duplikat- & Vergangenheits-Schutz); das Team sieht offene Wünsche, erstellt mit einem Klick eine Buchung in einer freien Stunde und versendet ein WhatsApp-Angebot
- ⏰ **Automatische Erinnerungen via Vercel Cron**: neuer Endpunkt `/api/v1/cron/reminders` (täglich 08:00 UTC = 11:00 TSİ) versendet 24-h-Erinnerungen über die bestehende Infrastruktur (SMTP + Twilio) und protokolliert sie in `NotificationLog` — Wiederholversand wird verhindert; mit `CRON_SECRET` gegen Fremdaufrufe absicherbar
- 📦 **Paketler (Kombi-Angebote)**: 3 günstige Service-Bundles (Manikür+Pedikür, Kalıcı Oje+Kaş/Kirpik, Jel Uzatma+Lash Lift) mit ausgewiesener Ersparnis — eigene Kategorie 🎁 auf Webseite & im Buchungsfluss
- 📜 **Transparente Stornierungspolitik**: 24-h-Regel wird der Kundin vor dem Absenden des Formulars angezeigt
- 🗄️ **Schema V5.4**: neue Modelle `GiftCard` + `WaitlistEntry` (SQLite + PostgreSQL); Cloud-Bootstrap ergänzt Bestandsdatenbanken automatisch (idempotente DDL + Nachzimmerung der Pakete)
- ✅ **21/21 E2E-Tests** für die neuen Endpunkte, ESLint 0 / TSC 0, Production-Build sauber

### V5.3 — «Echte Routen & Benachrichtigungen»
- 🛣️ Echte URL-Routen `/randevu` + `/yorumlar` (statt reiner Hash-Navigation) inkl. SEO-Sitemap (3 URLs) und Seiten-Metadaten
- 📧 **Echtes Benachrichtigungssystem V2**: `notify-send.ts` mit SMTP-E-Mail (nodemailer) + Twilio-WhatsApp-REST-API — konfigurierbar über Umgebungsvariablen, ohne Konfiguration läuft alles wie bisher mit Deep-Links
- 🖼️ Instagram-Markenfoto importiert (Galerie 23), robots.txt-Konflikt behoben, verwaiste Mock-Datei entfernt

### V5.2 — «Serverless-Härtung» (Supabase-Pooler-Fix)
- 🔧 **EMAXCONNSESSION-Fehler behoben**: Der Session-Pooler (Port 5432) erlaubt nur ~15 Clients — mit je ~12 API-Routen als eigenen Vercel-Funktionen war das Limit sofort erschöpft. Die URL-Normalisierung in `db.ts` schreibt Supabase-Pooler-Adressen jetzt automatisch auf den **Transaction-Pooler (Port 6543)** um (`pgbouncer=true`, `connection_limit=1`) — unlimitierte parallele Clients, keine blockierten Server-Sessions
- 🔧 **Bootstrap-Rennerschutz**: 2-Phasen-Transaktionen (DDL/Saat) mit `pg_advisory_xact_lock` — mehrere parallele Kaltstarts können nicht mehr doppelt säen; Fast-Path ohne Lock für Warmstarts (0,2 s)
- 🌍 **Vercel-Region dub1** (Dublin) — direkte Nähe zur Supabase-Datenbank (eu-west-1 Irland), ~10 ms statt ~90 ms Abfrage-Latenz
- ⏱️ `vercel.json` mit `maxDuration 60` für alle API-Routen (Erste-Aufruf-Datenbank-Setup braucht ~20 s)
- 🔎 **diag-Endpunkt** nutzt jetzt den geteilten Prisma-Client (keine zusätzliche Verbindungsquelle) und löst den Auto-Bootstrap aus
- 🤖 **SEO**: `robots.txt` + `sitemap.xml` als Next.js Metadata Routes
- 📖 APP-ANLEITUNG: Pooler-Empfehlung + Hinweis zu Supabase-Free-Tier-Pause nach 7 Tagen Inaktivität

### V5.0.0 CLOUD — «Kunden-Lieferung»
- ⭐ **Vercel + Supabase ready**: dual Prisma-Schema (SQLite lokal / PostgreSQL Cloud) mit automatischer Auswahl; `postinstall` + Build-Hook generieren den passenden Client
- ⭐ **Auto-Datenbank-Setup**: beim ersten API-Aufruf werden Tabellen (idempotente DDL) UND Grunddaten (17 Leistungen, 22 Galerie-Fotos, Ekip) automatisch in Supabase angelegt — keine Migrationen, kein CLI, kein Setup für die Kundin
- ⭐ **Echte Betriebsdaten**: korrekte Adresse (Hoca Hamza Mah. 1023. Sk No: 2, Villa Tunçaydın, 17500 Gelibolu/Çanakkale), echte Telefon-/WhatsApp-Nummer **+90 536 572 66 10**, exakte Koordinaten (40.430461, 26.690142) + Google-Maps-Ortslink, SSL- und Pool-Parameternormalisierung für Supabase
- ⭐ **Zugangsdaten entfernt**: Login-Screen ohne Demo-Hinweise, keine Demo-Telefonnummer im Buchungsfluss, neue starke Passwörter (nur der Inhaberin bekannt), README bereinigt
- ⭐ **Instagram-Fotos**: 6 neueste Arbeiten von @melekce_guzellik17 (9.947 Follower) in die Galerie übernommen — jetzt 22 echte Fotos
- ⭐ **Mesaj Merkezi** (Müşteriler): Kunden direkt anschreiben — WhatsApp/SMS/E-Mail mit vorausgefüllten türkischen Vorlagen (Kampagne, Erinnerung, Geburtstag, Dank) + Instagram-DM-Kanal mit Kopier-Hilfe; jeder Versand wird protokolliert
- ⭐ **Kontakt-Sektion**: anklickbare Telefonnummer (tel:), optionale E-Mail-Zeile (konfigurierbar in `branding.ts → company.email`)
- 🧹 **Altversionen entfernt**: AutoFaszimation-Altbestände (V3-Backend-Ordner, alte Parser/Seeds/Screenshots) komplett gelöscht
- 🔧 `metadataBase` für korrekte OG-Bilder in der Cloud, HTTPS-fähige Build-Pipeline

### V4.0.0 ULTIMATE
- ⭐ **Envanter**: Materiallager mit Mindestbestand-Alarmen und Lagerwert
- ⭐ **Müşteri-Karte**: Allergien/Empfindlichkeiten, Präferenzen, Portfolio-Fotos
- ⭐ **Treuepunkte**: digitale Stempelkarte (10 Stempel = Belohnung), automatische Vergabe je 100 ₺, Punkthistorie
- ⭐ **Ekip & Prim**: Provisionsrechner mit Monatsansicht
- ⭐ **Kaution**: Anzahlungswahl pro Termin (No-Show-Schutz)
- ⭐ **Automatische Erinnerungen**: 48-h-Warteschlange mit 1-Klick-WhatsApp
- Tablet-Optimierung (Seitenleiste ab 768 px), Champagner-/Nude-Akzente, 6 Dashboard-KPIs
- Docker-Setup (`Dockerfile` + `docker-compose.yml`), professionelle README

### V3.x — Marka Kimliği & Rezervasyon Merkezi
- Echtes Logo überall integriert · Herren aus Galerie-Foto entfernt · 16er-Galerie mit Filter
- Vollständiges Buchungsmanagement + Kundenbenachrichtigung (WhatsApp/SMS/E-Mail) + Protokoll

### V2.x — Gelibolu
- Leaflet-Karte, Gold-Konfetti, Wetter-Pflege-Tipps, Rate-Limiting, ₺-Währung, echte Fotos

---

## 📄 Lizenz & Credits

Für **Melek'çe Güzellik** (Gelibolu / Çanakkale) entwickelt — als wiederverwendbares White-Label-Template dokumentiert (`TEMPLATE-GUIDE.md`). Design «Black-Gold-Champagner» nach dem echten Studio-Logo. Wetter: Open-Meteo · Karten: Leaflet/CARTO.
