# TEMPLATE-GUIDE — Diese Suite für andere Projekte verwenden

**Die Melek'ce Güzellik Suite ist bewusst als wiederverwendbare Vorlage gebaut:
Neues Projekt = 2 Dateien anpassen + Datenbank neu befüllen. Fertig.**

Die Schwester-Suite (AutoFaszination Performance & B2B Sales Suite) läuft mit
demselben Bauplan in einer völlig anderen Branche — Beweis, dass die Architektur
branchenneutral funktioniert.

---

## 1. Das White-Label-Prinzip

| Ebene | Wo? | Was? |
|---|---|---|
| **Inhalte** | `src/config/branding.ts` | Marke, Tagline, Adresse, Öffnungszeiten, Team, Landing-Texte, Modul-Liste |
| **Farbe** | `src/app/globals.css` → `--brand` | EIN Wert steuert Buttons, Charts, Badges, Glow, aktive Navigation |
| **Daten** | `prisma/schema.prisma` + Seed | Domain-Objekte (hier: Service/Booking/Kunde) — branchenspezifisch |
| **Views** | `src/components/**` | Modulare Views, die über die Modul-Registry eingebunden werden |

## 2. Rebrand in 15 Minuten — Schritt für Schritt

### Schritt 1 — Marke & Studio: `src/config/branding.ts`

```ts
brand: {
  nameParts: ["Frisör", "Luna"],        // Teil 2 erscheint in Gold
  tagline: "Hair & Style Studio",
  slogan: "Ihr Haar, unsere Leidenschaft",
},
company: {
  legalName: "Luna Hair GmbH",
  street: "Hauptstrasse 5",
  city: "6004 Luzern",
  phone: "+41 41 000 00 00",
  instagram: "luna_hair",
},
```

→ Landing-Page, Login, Sidebar, Footer und Browser-Titel folgen automatisch.

### Schritt 2 — Öffnungszeiten (steuern die Buchungsslots!)

```ts
openingHours: [
  { day: "Montag", hours: "Geschlossen", closed: true },
  { day: "Dienstag", hours: "09:00 – 18:00", closed: false },
  // …
],
```

Das Kundinnen-Portal berechnet freie Zeitfenster (30-Min.-Raster) automatisch
aus diesen Zeiten — keine weitere Konfiguration nötig.

### Schritt 3 — Akzentfarbe: `src/app/globals.css`

```css
:root {
  --brand: oklch(0.72 0.12 15);   /* z. B. Rosé statt Gold */
}
```

Umrechnung Hex→OKLCH: https://oklch.com — die gesamte Suite folgt diesem einen
Token (primär, Ring, Charts, Glow, Selektion).

### Schritt 4 — Leistungen & Preise: `scripts/seed-beauty.ts`

```ts
const SERVICES = [
  { name: "Damenschnitt", category: "hair", description: "…", durationMin: 45, priceChf: 85, sortOrder: 1 },
  // …
]
```

Kategorien (`naegel | beauty | wimpern`) in `src/lib/salon.ts` → `CATEGORY_META`
umbenennen/erweitern. Danach Datenbank neu aufsetzen:

```bash
rm db/custom.db
npx prisma db push
npx tsx scripts/seed-beauty.ts
```

### Schritt 5 — Team-Zugänge & Demo-Kundinnen: `branding.ts`

```ts
users: [{ username: "luna", password: "luna123", name: "Luna", role: "Inhaberin", initials: "LU" }],
customerPortal: { demoCustomers: [{ name: "Muster Kundin", email: "…" }] },
```

### Schritt 6 — Bilder: `public/gallery/`

Eigene Fotos ablegen, Pfade im Seed-Skript (`GALLERY`-Array) bzw. in der
Tabelle `GalleryItem` eintragen.

### Schritt 7 — Module anpassen (Team-Portal): `branding.ts → modules[]`

Jedes Modul hat `enabled: true/false` — deaktivierte Module verschwinden aus
Sidebar und Navigation. Neue Views: Komponente in `src/components/staff/`
erstellen, in `src/lib/module-registry.ts` registrieren, Modul-Eintrag in
`branding.ts` ergänzen.

### Schritt 8 — **V3:** Benachrichtigungs-Vorlagen: `src/lib/notify.ts`

Die 6 Kunden-Vorlagen (Onay / Değişiklik / İptal / Hatırlatma / Son Bakım /
Özel) liegen in `buildMessage()` — für ein anderes Land/Sprache die türkischen
Texte dort übersetzen. Betreffzeilen und Signatur kommen aus `branding.ts`.
Kanal-Deep-Links (`wa.me`, `sms:`, `mailto:`) sind generisch und funktionieren
weltweit; Telefon-Normalisierung (TR-Formate) in `src/lib/phone.ts` bei Bedarf
anpassen.

## 3. Ehrliche Grenzen

- **Domain-Logik:** Buchungs-Kollisionsprüfung, Slots, Statistiken sind auf
  Salon-Abläufe ausgelegt (30-Min.-Raster, eine Behandlerin). Für mehrere
  Mitarbeiter parallel die Modelle um ein `staffId`-Feld erweitern.
- **Authentifizierung:** Demo-Modus (siehe README, Abschnitt 6).
- **Zahlungen:** Es gibt keine Zahlungs-Integration — die Suite verwaltet
  Termine und Umsatz-Statistiken, kassiert aber nichts online.
- **Benachrichtigungen:** Versand über Deep-Links (WhatsApp/SMS/E-Mail öffnen
  sich vorbereitet im jeweiligen Programm) — für vollautomatischen Versand
  Twilio/Meta-Cloud-API in `src/lib/notify.ts` einhängen; jedes Senden wird
  in `NotificationLog` protokolliert.

*Stand: V3.0.0 — White-Label-Basis (zentrale Branding-Datei, --brand-Farb-Token,
Öffnungszeiten-gesteuerte Slot-Berechnung, Modul-Registry).*
