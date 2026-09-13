# 📱 Melek'çe Güzellik — App & Betrieb Anleitung

**Stand: V5.1 · Live-Adresse: https://melek-guzellik-suite.vercel.app**

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
`Code → Releases → V5.1 → melekce-guzellik.apk` herunterladen.

- ✅ **Eine APK für alle Architekturen** (arm64-v8a, armeabi-v7a, x86, x86_64) —
  es ist eine reine Web-App-Hülle ohne nativen Code.
- ⚠️ Nur für **Android**. iPhones nutzen .ipa und benötigen zwingend Mac + Apple
  Developer-Account — für iPhone bitte die PWA aus Abschnitt 2 nutzen.
- **Installation**: APK auf dem Handy öffnen → «Installation aus unbekannten
  Quellen erlauben» bestätigen. Die App öffnet die Salon-Seite im Vollbild-Modus
  (Adressleiste wird automatisch ausgeblendet, sobald sie online ist).

### APK später selbst neu bauen (optional)
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://melek-guzellik-suite.vercel.app/manifest.json
bubblewrap build
```
Details: https://docs.pwabuilder.com · Alternativ über https://www.pwabuilder.com
(Manifest-URL eingeben → Android-Paket herunterladen).

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
