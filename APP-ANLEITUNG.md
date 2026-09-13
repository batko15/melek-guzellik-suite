# 📱 Melek'çe Güzellik — App & Betrieb Anleitung

**Stand: V6.0 «Profesyonel Edition» · Live-Adresse: https://melek-guzellik-suite.vercel.app**

Diese Anleitung steht im GitHub-Repository und kann jederzeit von dort heruntergeladen
(`Code → Download ZIP` oder Datei öffnen → `Raw`) werden.

---

## 1️⃣ WICHTIG zuerst: Datenbank verbinden (Supabase) — einmalig, 5 Minuten

Die Internetseite läuft bereits. Damit **Online-Randevular (Termin-Buchungen)**
funktionieren und gespeichert werden, muss die kostenlose Supabase-Datenbank
mit Vercel verbunden werden. **Ohne diesen Schritt bleiben die Buchungsseite
und die Preise leer!**

### Schritt-für-Schritt:

1. **Supabase-Projekt öffnen**: https://supabase.com → eigenes Projekt
   (z. B. `salon-suite-db`) → oben rechts **Connect** (oder unten links ⚙️ **Project Settings** → **Database**).
2. **Connection String** → Reiter **Connection Pooler** → Modus **Session** anklicken → kopieren.
   Die Adresse sieht so aus (⚠️ **empfohlen — funktioniert immer, auch ohne IPv6**):
   ```
   postgresql://postgres.xxxxxxxxx:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
   ```
   *(Alternativ funktioniert auch der Reiter **URI** mit `db.xxxxxxxxx.supabase.co` —
   dieser ist allerdings reines IPv6 und kann je nach Vercel-Region connection errors verursachen. 
   Der Pooler ist die sichere Wahl.)*
   ℹ️ **Gut zu wissen:** Ob Session- (Port 5432) oder Transaction-Pooler (Port 6543) — die App
   optimiert die Verbindung automatisch selbst (stellt immer auf Transaction-Mode um, damit
   niemals das Client-Limit erreicht wird). Einfach die Adresse wie kopiert eintragen.
   ⚠️ `[YOUR-PASSWORD]` mit dem bei der Projekterstellung vergebenen Passwort ersetzen!
3. **Vercel öffnen**: https://vercel.com → eigenes Projekt
   (`melek-guzellik-suite`) → oben **Settings** → **Environment Variables**.
4. **Neue Variable anlegen**:
   - **Key** (Name): `DATABASE_URL`
   - **Value** (Wert): die komplette kopierte Adresse aus Schritt 2
   - **Umgebung**: ✅ **Production** ankreuzen (und gerne auch Preview)
   - → **Save**
5. **Neu deployen** (damit die Variable wirksam wird):
   Dashboard → **Deployments** → oberster Eintrag → rechtes Menü `⋯` → **Redeploy** → **Redeploy**.
   *(Oder einfach irgendein Update ins GitHub-Repo pushen — das löst automatisch ein
   neues Deployment aus.)*
6. **Fertig!** Nach ca. 1–2 Minuten richtet die App die Cloud-Datenbank
   **vollautomatisch** ein: Tabellen, 17 Leistungen mit ₺-Preisen, 22 Galerie-Fotos.
   Es sind **keine Migrationen, kein CLI und keine weiteren Handgriffe nötig.**
   ℹ️ Der allererste Seitenaufruf nach dem Redeploy kann bis zu einer Minute dauern
   (Datenbank wird eingerichtet) — danach ist alles blitzschnell.

> 🔍 **Selbst prüfen:** `https://melek-guzellik-suite.vercel.app/api/v1/diag` öffnen —
> dort muss `"dbProtocol": "postgresql"` stehen (statt `"none"`).

> ⏸️ **Wichtig — kostenloses Supabase (Free-Tier):** Bleibt die Datenbank **7 Tage lang
> ungenutzt** (kein einziger Seitenaufruf/Buchung), pausiert Supabase das Projekt
> automatisch. Kein Problem: In Supabase einfach auf **«Restore project»** klicken —
> alle Daten bleiben erhalten. Ein gelegentlicher Besuch der Internetseite reicht
> bereits, um die Datenbank aktiv zu halten.

---

## 2️⃣ Als App installieren — ganz ohne App-Store (100 % kostenlos)

Die Webseite ist eine **Progressive Web App (PWA)**: Sie verhält sich wie eine echte
App mit eigenem Icon und Vollbild — auf Android **und** iPhone.

### Android (Chrome / Samsung Internet / Edge)
1. `https://melek-guzellik-suite.vercel.app` öffnen
2. Menü **⋮** (drei Punkte oben rechts)
3. **»App installieren«** oder **»Zum Startbildschirm hinzufügen«** wählen
4. Fertig — die App «Melek'çe» erscheint mit dem goldenen Flügel-Logo

### iPhone (Safari)
1. Seite öffnen
2. **Teilen**-Button (Quadrat mit Pfeil nach oben) antippen
3. **»Zum Home-Bildschirm«** wählen → **Hinzufügen**

---

## 3️⃣ Echte Android-APK-Datei (für direkte Installation)

Im GitHub-Release liegt eine **fertig signierte APK**:
`Code → Releases → V5.5 → melekce-guzellik.apk` herunterladen.

- ✅ **Eine APK für alle Architekturen** (arm64-v8a, armeabi-v7a, x86, x86_64) —
  es ist eine reine Web-App-Hülle ohne nativen Code.
- ⚠️ Nur für **Android**. iPhones nutzen .ipa und benötigen zwingend Mac + Apple
  Developer-Account — für iPhone bitte die PWA aus Abschnitt 2 nutzen.
- **Installation**: APK auf dem Handy öffnen → «Installation aus unbekannten
  Quellen erlauben» bestätigen. Die App öffnet die Salon-Seite im Vollbild-Modus
  (Adressleiste wird automatisch ausgeblendet, sobald sie online ist).
- 🆕 **V5.5 (App-Version 5.5.0, Build 3)**: Startscreen-Verknüpfungen für
  **Randevu**, **Hediye Kartı** und **Yorumlar** (langer Druck aufs App-Icon).
  Wer die alte V5.1-App installiert hat: einfach APK drüberinstallieren —
  gleiche Signatur, alle Daten bleiben.
- 📲 **QR-Code**: Auf der Salon-Webseite ganz unten («Melek'çe mobil
  uygulaması») — Handy-Kamera darauf richten → landet direkt beim neuesten
  Release. Der Code zeigt immer auf «latest», veraltet also nie.

### APK später selbst neu bauen (optional)
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://melek-guzellik-suite.vercel.app/manifest.json
bubblewrap build
```
Details: https://docs.pwabuilder.com · Alternativ über https://www.pwabuilder.com
(Manifest-URL eingeben → Android-Paket herunterladen).
⚠️ Wichtig: Updates nur mit demselben Keystore signieren
(`download/melekce-signing-keystore`, Passwort siehe KEYSTORE-INFO.txt) —
sonst verweigert Android die Installation über die Bestands-App.

---

## 4️⃣ Preise blitzschnell ändern — «Toplu Fiyat Güncelle»

Im **Ekip-Portal** (Anmeldung oben rechts auf der Seite) → **Hizmetler & Fiyatlar**:

- **Einzelpreis**: Stift-Symbol antippen → Preis/Süre direkt in der Zeile ändern.
- **ALLE PREISE AUF EINMAL** (neu in V5.1): Button **»Toplu Fiyat Güncelle —
  Tümünü Tek Tıkla«**:
  - **Kapsam**: alle Leistungen oder nur Tırnak / Güzellik / Kirpik
  - **Yüzde (%)**: z. B. +10 % auf alles — oder Schnellwahl +5 % / +10 % / +15 % / −10 % …
  - **Tutar (₺)**: z. B. +100 ₺ auf alle — oder −50 ₺ …
  - **Canlı Önizleme**: jede Preisänderung wird **vor dem Speichern** angezeigt
    (alt → neu, z. B. `600 ₺ → 660 ₺`)
  - **»… Fiyatı Güncelle«** → fertig. Beispiel: *«17 hizmet +%10 olarak güncellendi.»*

> Bereits bestätigte Randevular behalten ihren ursprünglichen Preis — neue Preise
> gelten automatisch für alle folgenden Buchungen.

---

## 5️⃣ Kunden direkt anschreiben — Mesaj Merkezi

**Müşteriler** (im Ekip-Portal) → Kundin antippen → **»Mesaj Gönder —
WhatsApp · SMS · E-Mail · Instagram«**:

- 5 fertige türkische Vorlagen: 🎁 Kampanya · ⏰ Hatırlatma · 🎂 Doğum Günü · 💐 Teşekkür · ✍️ Serbest
- Nachricht frei editierbar → Kanal antippen → **WhatsApp/SMS/E-Mail öffnen sich
  mit der fertigen Nachricht**; bei Instagram wird der Text kopiert und das
  DM-Postfach geöffnet (dort Kundin suchen → einfügen → senden).
- Jede versandte Nachricht wird im **Bildirim-Günlüge** protokolliert.

---

## 5️⃣b NEU V5.4 — Hediye Kartları (Geschenkkarten) 🎁

**So funktioniert's für die Kundin (ohne Login):**
1. Webseite → Abschnitt **«Hediye Kartı»** (unter den Leistungen)
2. Betrag antippen (500 / 750 / 1.000 / 1.500 ₺) oder eigenen Betrag eintippen
3. Name + Telefon eintragen, optional «Kime hediye?» und eine Notiz
4. **«Hediye Kartı Oluştur»** → Code erscheint im Format `MELEK-XXXX-XXXX`
   (kopierbar) + WhatsApp-Knopf zur schnellen Absprache mit dem Studio
5. Der Code gilt für **alle Leistungen & Pakete** — Restbakiye bleibt erhalten

**So funktioniert's für Sie (Ekip-Portal → Hediye Kartları):**
- **«Ödeme Alındı — Aktifleştir»**: Kundin hat bezahlt (bar/Überweisung) →
  Karte mit einem Klick aktivieren → WhatsApp-Nachricht an die Käuferin ist
  vorbereitet («Kartınız hazır!»)
- **«Ödemede Kullan»**: Bei einem Termin den Betrag vom Guthaben abziehen —
  Teilbeträge möglich; ist die Bakiye aufgebraucht, wird die Karte automatisch
  auf «Tamamen Kullanıldı» gesetzt
- **«Yeni Kart (Ödeme Alındı)»**: direkt am Studio verkaufte Karten anlegen
  (sofort aktiv)
- Übersicht: Karten-Stand, offene Zahlungen, aktive Bakiye (Σ ₺)

---

## 5️⃣c NEU V5.4 — Bekleme Listesi (Warteliste) 📋

**Das Problem:** Ein Tag ist voll → Kundin geht verloren.
**Die Lösung (Branchen-Best-Practice gegen No-Shows):**

1. Ist ein Tag komplett ausgebucht, zeigt der Buchungsfluss automatisch
   **«Bu gün tamamen doldu — Bekleme Listesine Ekle»** — Name + Telefon genügt
2. Im Ekip-Portal → **Bekleme Listesi** sehen Sie alle Wünsche (Datum, Dienst,
   Notiz wie «nachmittags bitte»)
3. Fällt ein Termin aus: **«Randevu Oluştur»** → freie Stunde wählen →
   Buchung wird erstellt und der Eintrag auf «Randevuya Dönüştü» gesetzt
4. **«WhatsApp Teklif Gönder»** öffnet die fertige Nachricht
   («yer açıldı!») an die Kundin — ein Klick, ein verkaufter Termin

---

## 5️⃣d NEU V5.4 — Automatische Erinnerungen (Vercel Cron) ⏰

- Vercel ruft täglich um **11:00 Türkische Zeit** den Endpunkt
  `/api/v1/cron/reminders` auf
- Der Sweep versendet für alle Termine der **nächsten 24 Stunden** automatisch
  Erinnerungen — per E-Mail (SMTP) und/oder WhatsApp (Twilio), sofern in den
  Umgebungsvariablen konfiguriert; ohne Konfiguration wird nur protokolliert
- Jede versendete Erinnerung landet im Benachrichtigungs-Protokoll →
  **kein Doppelversand**
- Optional: Umgebungsvariable `CRON_SECRET` in Vercel setzen → dann ist der
  Endpunkt nur mit `Authorization: Bearer <geheimnis>` erreichbar
- (**Hinweis:** Auf dem Hobby-Plan läuft Cron 1× täglich. Manuell jederzeit
  aufrufbar: `…/api/v1/cron/reminders` im Browser.)

---

## 5️⃣e NEU V5.5 — Sistem Durumu (Live-Systemmonitor) 🩺

Im **Ekip-Portal → Ayarlar** steht oben jetzt die Karte **«Sistem durumu»**:

- **Bulut veritabanı**: Verbindung, Modus (Bulut/lokal), Antwortzeit in ms,
  Anzahl erfasster Hizmetler — Grün = alles gut
- **Supabase API ağ geçidi**: prüft `https://pmudlcpusvwvmejirpsq.supabase.co`
  live ab. Wichtig für den **Free-Tier-Pauschalter**: Nach 7 Tagen ohne
  Datenbankaktivität pausiert Supabase das Projekt — die Karte zeigt dann
  rot **«duraklatılmış»** mit Anleitung (Supabase → Settings → General →
  *Restore project* — Daten bleiben erhalten)
- **Bildirim altyapısı**: zeigt auf einen Blick, ob E-Mail (SMTP) und
  WhatsApp (Twilio) aktiviert sind oder im manuellen Modus laufen
- Button **«Yenile»** = sofortige Neuprüfung; darunter Version, Umgebung
  (üretim) und Vercel-Region (dub1) mit Uhrzeit des Checks

Technisch: Endpunkt `/api/v1/salon/system-status` (10 Abrufe/Minute/IP),
Supabase-URL wird automatisch aus der `DATABASE_URL` abgeleitet — nichts
zu konfigurieren. Der Diagnose-Endpunkt `/api/v1/diag` zeigt ergänzend
`supabaseApi: { active: true }`.

---

## 5️⃣f NEU V5.6 — Tırnak Sanatı Galerisi (`/nailart`) 💅

Es gibt jetzt eine **eigene, teilbare Seite nur für Nageldesigns** — perfekt
zum Weitergeben:

**👉 Live-Link: `https://melek-guzellik-suite.vercel.app/nailart`**

- **Alle 14 Nageldesigns** groß in der Galerie — antippen öffnet den
  **Vollbild-Modus** (mit Pfeiltasten oder Vor/Zurück-Buttons blättern,
  ESC schließt)
- **«Bu tasarımı WhatsApp'tan iste»**: Die Kundin tippt ein Design an,
  dann auf den grünen Button — die WhatsApp-Nachricht enthält bereits
  den **Design-Namen** (z. B. «Bordo Kedi Gözü»); sie muss nur noch
  senden. Du siehst sofort, welches Design gemeint ist
- **Preisliste gleich darunter**: alle 8 Nageldienste mit Dauer und
  «Randevu Al»-Button — von der Bewunderung direkt zum Termin
- **«Galeriyi paylaş»**: teilt den Galerie-Link (Web-Share, sonst
  Kopieren) — ideal für Instagram-Story oder WhatsApp-Status
- Die Nummer bleibt **unsichtbar** (nur in den Links enthalten) —
  V5.5.1-Regel gilt weiter

**Wo Kundinnen die Seite finden:** Navigation oben («Nail Art ✨»),
Gold-Button unter der Galerie auf der Startseite, 4. Tab in der mobilen
Navigation, PWA-Shortcut «Nail Art» und direkt über den Live-Link.

---

## 5️⃣g NEU V5.7 — Canlı Nail Studio (`/nailstudio`) 🪄

Das Highlight: Kundinnen bauen ihr **Nageldesign jetzt selbst zusammen** —
mit **Live-Vorschau einer stilisierten Hand (SVG)**, die bei jeder Auswahl
**sofort** aktualisiert wird. Kein Anmelden nötig.

**👉 Live-Link: `https://melek-guzellik-suite.vercel.app/nailstudio`**

So funktioniert es für die Kundin:

1. **Hazır Şablonlar** — 9 Fertig-Designs aus deiner echten Galerie
   (Bordo Kedi Gözü, Bordo Ombre, Klasik French, Deniz Kabuğu French,
   24K Altın Folyo, İnci Tozu, Nar Çiçeği, Siyah Krom, Pudra Sim) —
   ein Tipp, Design geladen
2. **Şekil** — Kare, Yuvarlak, Oval, Badem, Stiletto, Balerina
3. **Boy** — Kısa / Orta / Uzun (Nägel wachsen in der Vorschau!)
4. **Renk** — 16 Studio-Farben (Bordo, Nude, Şampanya Altın, …)
5. **Efekt** — Parlak, Mat, Kedi Gözü, Sim, Krom, Sedefli (mit
   Aufpreis-Anzeige, z. B. «+100₺»)
6. **Nail Art** — Düz, French, Ombre, Altın Folyo, Deniz Kabuğu,
   İnci & Taş, Nar Çiçeği, Dantel
7. **«Bu Tasarımla Randevu Al»** — das Design wird **automatisch an die
   Buchung angehängt**. Die Kundin sieht es auf jedem Buchungsschritt und
   im Erfolgsbildschirm; du siehst es im Ekip-Portal (Rezervasyon
   Merkezi) als goldene Zeile «💅 …» direkt beim Termin.
8. Alternativ: **WhatsApp-Button** schickt das fertige Design als
   vorausgefüllte Nachricht — und **«Paylaş»** kopiert den Design-Text.

**Preis-Schätzung:** Das Studio rechnet Grundleistung (Kısa → Jel
Manikür, Orta/Uzun → Jel Uzatma aus deiner Preisliste) + Effekt/Nail-Art
Aufpreis zusammen und zeigt «≈ ücret» an. **Hinweis:** Die Schätzung ist
unverbindlich — du bestätigst den Endpreis bei der Terminbestätigung.
Die Aufpreise (Efekt/Nail Art) kannst du in
`src/lib/nail-design.ts` (`NAIL_FINISHES` / `NAIL_ARTS`, Feld
`surcharge`) anpassen.

**Wo Kundinnen das Studio finden:** Navigation oben («Canlı Studio 💅»),
Gold-Button im Hero («Canlı Nail Studio»), 2. Tab in der mobilen
Navigation, CTA in der Nail-Art-Galerie («Tasarımı Canlı Dene»),
PWA-Shortcut «Studio» und direkt über den Live-Link.

---

## 6️⃣ Zugänge & Sicherheit

| Was | Wo |
|---|---|
| **Ekip-Girişi** (Team-Portal) | Benutzername + Passwort — steht **nur der Inhaberin** bekannt (in `src/config/branding.ts` hinterlegt, wird nirgends auf der Seite angezeigt) |
| **Vercel «Project ID»** (`prj_…`, *»Used when interacting with the Vercel API«*) | **Kein Passwort!** Nur eine interne Kennung des Vercel-Projekts — wird für API-Aufrufe an Vercel benutzt (z. B. automatische Deployments). Nicht geheim, aber nicht veröffentlichen. |
| **Supabase-Datenbank-Passwort** | Beim Erstellen des Supabase-Projekts vergeben — in der `DATABASE_URL` enthalten. **Niemals ins GitHub-Repo schreiben!** |
| **GitHub-Token** | Wurden im Chatverlauf sichtbar → bitte in GitHub → Settings → Developer settings → Tokens **rotieren** (neu generieren, alte löschen). |

---

## 7️⃣ Schnell-Checkliste «Seite live & komplett»

- [ ] https://melek-guzellik-suite.vercel.app öffnet sich mit Logo, Leistungen & Galerie
- [ ] `…/api/v1/diag` zeigt `"dbProtocol": "postgresql"` (Abschnitt 1 erledigt)
- [ ] Online-Randevu testen: Leistung → Datum → Uhrzeit → Name + Telefon → Konfetti ✓
- [ ] App auf dem Handy installiert (Abschnitt 2) — Icon: goldener Flügel
- [ ] Ekip-Login funktioniert & Preise sind über «Toplu Fiyat» einstellbar

*Gelibolu'da sevgiyle · «Her kadın bir melek gibi güzeldir»* ✨
