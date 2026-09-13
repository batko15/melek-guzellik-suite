#!/usr/bin/env python3
"""V5.6.0 — GitHub-Releases erstellen: beide Repos + nachträgliches v5.5.1 auf Repo 2."""
import json
import subprocess
import sys
import urllib.error
import urllib.request

def token():
    url = subprocess.run(["git", "remote", "get-url", "guzellik"], capture_output=True, text=True, cwd="/home/z/my-project").stdout.strip()
    # https://USER:TOKEN@github.com/... → TOKEN
    return url.split("@")[0].rsplit(":", 1)[1]

def api(method, path, body=None, tok=None):
    req = urllib.request.Request(
        f"https://api.github.com{path}",
        data=json.dumps(body).encode() if body else None,
        headers={"Authorization": f"token {tok}", "Accept": "application/vnd.github+json", "Content-Type": "application/json"},
        method=method,
    )
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return {"not_found": True}
        raise

def upload_asset(upload_url, asset_path, tok):
    # upload_url hat eine {?name,label}-Vorlage
    base = upload_url.split("{")[0]
    name = asset_path.split("/")[-1]
    req = urllib.request.Request(
        f"{base}?name={name}",
        data=open(asset_path, "rb").read(),
        headers={"Authorization": f"token {tok}", "Content-Type": "application/zip"},
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

TOK = token()
REPOS = ["batko15/melek-guzellik-suite", "batko15/melek-salon-suite"]
ZIP = "/tmp/melek-guzellik-suite-v5.6.0.zip"

NOTES_V56 = """## 💅 V5.6 — NAIL ART GALERİSİ (teilbare Design-Galerie)

### Neu
- **Route `/nailart`** — die komplette Tırnak-Sanatı-Galerie als eigener, teilbarer Live-Link (SEO + Sitemap): alle 14 Nagel-Designs aus der Datenbank
- **Lightbox-Modus** — Design anklicken → Vollbild, Pfeiltasten/ESC-Navigation, Design-Zähler, Gold-Rahmen
- **«Bu tasarımı WhatsApp'tan iste»** — pro Design vorausgefüllte WhatsApp-Nachricht mit Design-Name; Nummer bleibt ausschließlich im Link (Klartext-Schutz V5.5.1 unverändert)
- **Tırnak Hizmetleri & Fiyatlar** — alle 8 Nageldienste (Menü-Stil) mit Dauer + Randevu-Sprung direkt auf der Galerie-Seite
- **Galeriyi paylaş** — Web-Share-API mit Clipboard-Fallback

### Verlinkt überall
- Desktop-Navigation («Nail Art ✨») · Gold-Button unter der Haupt-Galerie · mobile Alt-Navigation (4. Tab) · PWA-Shortcut (ersetzt das «Randevularım»-Duplikat)

### Qualität
- Vollständige Live-Prüfung: 13 Routen + 23/23 Galerie-Fotos, 0 Console-Fehler · ESLint 0 / TSC 0 (src/) · Production-Build sauber
- 📱 Android-App (5.5.0/Build 3) unverändert gültig — App lädt die Webseite live, die neue Galerie ist sofort in der App verfügbar

**Live:** https://melek-guzellik-suite.vercel.app/nailart"""

NOTES_V551 = """## 🔒 V5.5.1 — Nummer-Schutz (nachgetragen auf diesem Repo)

- **Telefonnummer überall funktional korrigiert** (branding.ts → alle `tel:`- und `wa.me`-Links, Buchungs-/Benachrichtigungs-Vorlagen) — **aber nicht mehr als Klartext auf öffentlichen Seiten sichtbar**
- Kontakt zeigt «Bizi arayın» (Anruf-Button) + «WhatsApp'tan yaz»; Footer zeigen Stadt statt Nummer; README-Digits entfernt
- 📱 Android-App (Build 3) unverändert gültig — Korrektur wirkt automatisch

*(Dieses Release wurde auf melek-guzellik-suite bereits am 13.09.2026 veröffentlicht und hier zur Vollständigkeit der Release-Historie nachgetragen.)*"""

def main():
    releases_created = []
    for repo in REPOS:
        # 1) v5.6.0 Release (idempotent — bereits vorhandene werden übersprungen)
        existing56 = api("GET", f"/repos/{repo}/releases/tags/v5.6.0", None, TOK)
        if existing56.get("not_found"):
            rel = api("POST", f"/repos/{repo}/releases", {
                "tag_name": "v5.6.0",
                "name": "V5.6 — NAIL ART GALERİSİ (teilbare Design-Galerie /nailart)",
                "body": NOTES_V56,
                "draft": False,
                "prerelease": False,
            }, TOK)
            print(f"[{repo}] v5.6.0 Release #{rel.get('id')} erstellt")
            # ZIP-Asset hochladen (nur bei Neu-Erstellung)
            if not rel.get("assets"):
                asset = upload_asset(rel["upload_url"], ZIP, TOK)
                print(f"[{repo}] Asset: {asset.get('name')} ({asset.get('size', 0)//1024} KB)")
            releases_created.append((repo, "v5.6.0", rel.get("html_url")))
        else:
            rel = existing56
            print(f"[{repo}] v5.6.0 Release existiert bereits (#{rel.get('id')}) — Asset-Check…")
            if not rel.get("assets"):
                asset = upload_asset(rel["upload_url"], ZIP, TOK)
                print(f"[{repo}] Asset nachgereicht: {asset.get('name')} ({asset.get('size', 0)//1024} KB)")
            else:
                print(f"[{repo}] Asset vorhanden: {rel['assets'][0]['name']}")

    # 2) Fehlendes v5.5.1 auf Repo 2 nachtragen (nur melek-salon-suite)
    existing = api("GET", "/repos/batko15/melek-salon-suite/releases/tags/v5.5.1", None, TOK)
    if existing.get("not_found"):
        rel551 = api("POST", "/repos/batko15/melek-salon-suite/releases", {
            "tag_name": "v5.5.1",
            "name": "V5.5.1 — Nummer-Schutz (Telefonnummer korrigiert & nicht mehr sichtbar)",
            "body": NOTES_V551,
            "draft": False,
            "prerelease": False,
        }, TOK)
        print(f"[melek-salon-suite] v5.5.1 Release #{rel551.get('id')} nachgetragen")
        releases_created.append(("melek-salon-suite", "v5.5.1", rel551.get("html_url")))
    else:
        print("[melek-salon-suite] v5.5.1 Release existiert bereits — übersprungen")

    print("\n=== FERTIG ===")
    for repo, tag, url in releases_created:
        print(f"  {repo} · {tag} → {url}")

if __name__ == "__main__":
    main()
