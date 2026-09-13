# 💅 Melek'çe Güzellik Suite — V5.0.0 CLOUD

**Die komplette Salon-Software für Nagelstudios & Beauty-Studios — öffentliche Webseite, Kundinnen-Buchungsportal und Team-Verwaltung in einer Anwendung.**

> Entwickelt nach dem Standard moderner Salon-Plattformen (Booksy, Vagaro, Mangomint, Salonkee, OpenSalon — Feature-Recherche 2026) und als **White-Label-Template** aufgebaut: Dieselbe Suite lässt sich über eine einzige Konfigurationsdatei (`src/config/branding.ts`) für jedes andere Studio umetikettieren (siehe `TEMPLATE-GUIDE.md`).

---

## ✨ Feature-Highlights (V5.0.0 CLOUD)

### 🌐 Öffentliche Webseite (ohne Login)
- **Luxury-Design** «Black-Gold-Champagner» mit echtem Studio-Logo (Engelsflügel), Gold-Eck-Ornamenten und Rauten-Trennern — mobil, Tablet & Desktop optimiert
- ⭐ **V5 CLOUD**: Komplett Vercel- + Supabase-fähig — PostgreSQL-Unterstützung mit **vollautomatischem Datenbank-Setup** (Tabellen + Grunddaten beim ersten Aufruf, ohne CLI/Migrationen)
- ⭐ **V5 ECHT-DATEN**: echte Adresse (Hoca Hamza Mah. 1023. Sk No: 2, Gelibolu), echte Telefon-/WhatsApp-Nummer (+90 542 633 15 70), exakte Karten-Koordinaten + Google-Maps-Ortslink
- ⭐ **V5 GALERIE**: 22 echte Instagram-Fotos des Studios (die 6 neuesten Arbeiten direkt von @melekce_guzellik17 übernommen)
- Leistungen & Preise im **Menü-Stil** (punktierte Preisführung), **Galerie mit Kategorie-Filter** (Tırnak / Güzellik / Kirpik / Stüdyo)
- Live-**Wetter-Widget** mit türkischen Pflege-Tipps (Open-Meteo, schlüssellos), **interaktive Karte** (Leaflet, dunkle CARTO-Tiles)
- Gästebewertungen mit Sternen — jeder darf ohne Login bewerten (moderiert)

### 👩 Kundinnen-Portal (ohne Login)
- **Online-Buchung in 3 Schritten** (Leistung → Datum & Zeit → Kontaktdaten) — keine Registrierung, Telefon genügt
- «Randevularım»: eigene Termine per Telefonnummer einsehen & stornieren
- Buchungsbestätigung mit **Gold-Konfetti** + **WhatsApp-Deep-Link** (vorausgefüllte türkische Buchungszusammenfassung)

### 👑 Team-Portal (Login)
| Modul | Funktionen |
|---|---|
| **Genel Bakış** | 6 Live-KPIs: heutige Termine, offene Anfragen, **fällige Erinnerungen**, **niedriger Lagerbestand**, Auslastung, **belohnungsbereite Kundinnen** + Wetter |
| **Takvim** | 2-Wochen-Kalender, klickbare Karten → gemeinsames Formular zum Bearbeiten |
| **Rezervasyon Merkezi** | ALLE Termine: ansehen, vollständig bearbeiten, neu anlegen, No-Show, CSV-Export · **automatische Erinnerungs-Warteschlange** (48 h) mit 1-Klick-WhatsApp/SMS |
| **Bildirimler** | Protokoll aller Kundenbenachrichtigungen (WhatsApp / SMS / E-Mail) mit 6 türkischen Vorlagen |
| **Mesaj Merkezi** ⭐ NEU V5 | **Direkt-Kundenkontakt ohne Termin**: fertige türkische Vorlagen (Kampagne, Erinnerung, Geburtstag, Dank, frei) — Versand per WhatsApp, SMS, E-Mail (vorausgefüllt) oder Instagram-DM (Nachricht wird kopiert, DM-Postfach öffnet) — direkt aus der Kundenkarte |
| **Envanter** ⭐ NEU V4 | **Materiallager**: Gele, Acryl, Wimpern, Öle — Mengen-±, Mindestbestand-Alarme, Lagerwert, Lieferanten |
| **Müşteriler** ⭐ V4 | **Digitale Kundenkarte**: Allergie- & Empfindlichkeits-Erklärung (rot markiert), Präferenzen (Form / Gel-Typ / Lieblingsfarben), **Treue-Stempelkarte** (10 Stempel = Belohnung), Portfolio-Fotos pro Kundin, Punkthistorie |
| **Ekip & Prim** ⭐ NEU V4 | **Provisionsrechner**: Umsatz & abgeschlossene Termine pro Mitarbeiter × Provisionsquote → fällige Provision, Monatsansicht |
| **Yorumlar** | Bewertungs-Moderation (genehmigen / ablehnen), Filter nach Sternen & Leistung |
| **Hizmetler** | Preis-Editor (Preis, Dauer, Beschreibung, Beliebtheit) direkt in der Zeile |
| **Galeri** | Verwaltung der öffentlichen Galerie + Kundinnen-Portfolio-Zuordnung |
| **Ayarlar** | Studio-Daten, Öffnungszeiten, Team, System |

### 🔔 Benachrichtigungen & Rückstellung (Recherche-Best Practices)
- **6 türkische Nachrichten-Vorlagen**: Bestätigung, Änderung, Stornierung, Erinnerung, Nachsorge, individuell
- **Automatische Erinnerungs-Warteschlange**: alle Termine der nächsten 48 h ohne gesendete Erinnerung — 1 Klick öffnet WhatsApp mit fertiger Nachricht, Versand wird protokolliert (No-Show-Schutz № 1 laut Branchenstatistik)
- **Anzahlung / Stornierungsschutz**: Anzahlungsbetrag + Zahlungswahlschalter pro Termin (No-Show-Schutz № 2)
- Kanal-Deep-Links: `wa.me` (WhatsApp), `sms:`, `mailto:` — ohne API-Schlüssel produktiv nutzbar; Twilio/Meta-Anbindung vorbereitet

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

### V5.0.0 CLOUD — «Kunden-Lieferung»
- ⭐ **Vercel + Supabase ready**: dual Prisma-Schema (SQLite lokal / PostgreSQL Cloud) mit automatischer Auswahl; `postinstall` + Build-Hook generieren den passenden Client
- ⭐ **Auto-Datenbank-Setup**: beim ersten API-Aufruf werden Tabellen (idempotente DDL) UND Grunddaten (17 Leistungen, 22 Galerie-Fotos, Ekip) automatisch in Supabase angelegt — keine Migrationen, kein CLI, kein Setup für die Kundin
- ⭐ **Echte Betriebsdaten**: korrekte Adresse (Hoca Hamza Mah. 1023. Sk No: 2, Villa Tunçaydın, 17500 Gelibolu/Çanakkale), echte Telefon-/WhatsApp-Nummer **+90 542 633 15 70**, exakte Koordinaten (40.430461, 26.690142) + Google-Maps-Ortslink, SSL- und Pool-Parameternormalisierung für Supabase
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
