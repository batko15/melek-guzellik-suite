#!/usr/bin/env python3
# V5.4 E2E-Test: Hediye Kartı + Bekleme Listesi + Cron-Reminders + Paketler
# Läuft gegen lokalen Dev-Server (SQLite). Räumt alle Testdaten am Ende auf.
import json
import urllib.request
import urllib.error
import sys
from datetime import datetime, timedelta

BASE = "http://localhost:3000"
results = []


def call(method, path, body=None, expect=200, label=""):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as res:
            code = res.status
            payload = json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        code = e.code
        payload = json.loads(e.read().decode() or "{}")
    ok = code == expect
    results.append((ok, f"{label or method+' '+path}", code, expect, payload))
    return payload if ok else None


def show():
    print("\n" + "=" * 72)
    fails = 0
    for ok, label, code, expect, payload in results:
        mark = "✓" if ok else "✗"
        extra = ""
        if not ok:
            fails += 1
            extra = f"  → {json.dumps(payload, ensure_ascii=False)[:200]}"
        print(f" {mark} [{code}] (erwarte {expect}) {label}{extra}")
    print("=" * 72)
    print(f" {len(results) - fails}/{len(results)} BESTANDEN" + ("  — ALLES OK ✓" if fails == 0 else f"  — {fails} FEHLER!"))
    return fails


# ═══ 1) Paket-Hizmetler (Bootstrap-Seed für lokale SQLite via API prüfen) ═══
# Hinweis: lokale SQLite hat 17 Services ohne Pakete — der Bootstrap läuft nur
# gegen Postgres. Für den Test fügen wir Pakete direkt über den services-API hinzu? Nein —
# Der services-API hat evtl. kein POST. Stattdessen prüfen wir die vorhandene
# Funktionalität der Kategorie-Anzeige: Pakete werden nur gegen Cloud geseedet.
# Lokal prüfen wir nur, dass die Kategorie in der API-Antwort toleriert wird.

svc = call("GET", "/api/v1/salon/services", label="Services-Liste")
if svc:
    cats = {s["category"] for s in svc.get("services", [])}
    print(f"   → Kategorien lokal: {sorted(cats)} (paket fehlt lokal = OK, wird in Cloud geseedet)")

# ═══ 2) Hediye Kartı: vollständiger Lebenszyklus ═══
gc = call("POST", "/api/v1/salon/giftcards", {
    "buyerName": "Test Ayşe",
    "buyerPhone": "+90 555 999 88 77",
    "amount": 1000,
    "recipientName": "Test Annem",
    "message": "Doğum günün kutlu olsun",
}, expect=201, label="GiftCard: Talep erstellen")
card_id = gc["card"]["id"] if gc else None
card_code = gc["card"]["code"] if gc else None
wa = gc.get("whatsappUrl", "") if gc else ""

# Ungültige Eingaben
call("POST", "/api/v1/salon/giftcards", {"buyerName": "X", "buyerPhone": "1", "amount": 10}, expect=400, label="GiftCard: Validierung (400)")
call("GET", "/api/v1/salon/giftcards?code=MELEK-XXXX-XXXX", expect=404, label="GiftCard: unbekannter Code (404)")

# Bakiye-Abfrage mit echtem Code (Status talep → balance null)
if card_code:
    call("GET", f"/api/v1/salon/giftcards?code={card_code}", label="GiftCard: öffentliche Bakiye-Abfrage (talep)")

# Ekip-Liste
lst = call("GET", "/api/v1/salon/giftcards", label="GiftCard: Ekip-Liste + Stats")
if lst:
    print(f"   → Stats: {json.dumps(lst.get('stats', {}))}")

# PUT vor Aktivierung → Fehler erwartet
if card_code:
    call("PUT", "/api/v1/salon/giftcards", {"code": card_code, "amount": 100}, expect=400, label="GiftCard: Nutzung vor Aktivierung (400)")

# Aktivieren
if card_id:
    act = call("PATCH", "/api/v1/salon/giftcards", {"id": card_id, "status": "aktif"}, label="GiftCard: aktivieren")
    if act:
        print(f"   → WhatsApp-Link an Alice: {'vorhanden' if act.get('whatsappUrl') else 'fehlt!'}")

# Bakiye jetzt sichtbar
if card_code:
    bal = call("GET", f"/api/v1/salon/giftcards?code={card_code}", label="GiftCard: Bakiye-Abfrage (aktiv)")
    if bal:
        print(f"   → Bakiye: {bal.get('balance')} ₺")

# Teil-Betrag nutzen
if card_code:
    use = call("PUT", "/api/v1/salon/giftcards", {"code": card_code, "amount": 600}, label="GiftCard: 600₺ einlösen")
    if use:
        print(f"   → Verbleibend: {use.get('remaining')} ₺")
    # Überhöhten Betrag versuchen
    call("PUT", "/api/v1/salon/giftcards", {"code": card_code, "amount": 99999}, expect=400, label="GiftCard: Überziehung abgelehnt (400)")
    # Rest komplett aufbrauchen → kullanildi
    use2 = call("PUT", "/api/v1/salon/giftcards", {"code": card_code, "amount": 400}, label="GiftCard: Rest aufbrauchen")
    if use2:
        print(f"   → Status danach: {use2['card']['status']}")

# ═══ 3) Bekleme Liste: vollständiger Lebenszyklus ═══
future = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
past = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

wl = call("POST", "/api/v1/salon/waitlist", {
    "name": "Test Musteri",
    "phone": "+90 555 111 22 33",
    "desiredDate": future,
    "note": "öğleden sonra olursa çok iyi olur",
}, expect=201, label="Waitlist: beitreten")
wl_id = wl["entry"]["id"] if wl else None

# Duplikat → 409
call("POST", "/api/v1/salon/waitlist", {
    "name": "Test Musteri",
    "phone": "+90 555 111 22 33",
    "desiredDate": future,
}, expect=409, label="Waitlist: Duplikat abgelehnt (409)")
# Vergangenheit → 400
call("POST", "/api/v1/salon/waitlist", {
    "name": "Test Musteri",
    "phone": "+90 555 111 22 33",
    "desiredDate": past,
}, expect=400, label="Waitlist: Vergangenheit abgelehnt (400)")

# Ekip-Liste + Filter
call("GET", "/api/v1/salon/waitlist", label="Waitlist: Ekip-Liste")
call("GET", f"/api/v1/salon/waitlist?date={future}", label="Waitlist: Tages-Filter")

# Status → teklif
if wl_id:
    call("PATCH", "/api/v1/salon/waitlist", {"id": wl_id, "status": "teklif"}, label="Waitlist: teklif markieren")

# ═══ 4) Cron-Reminders ═══
cron = call("GET", "/api/v1/cron/reminders", label="Cron: Reminder-Sweep (lokal ohne Secret)")
if cron:
    print(f"   → Fenster: {cron.get('window', {}).get('hours')}h · geprüft: {cron.get('checked')} · fällig: {cron.get('due')} · protokolliert: {cron.get('logged')}")

# Auth-Test: Mit CRON_SECRET kann von hier aus nicht negativ getestet werden
# (lokal nicht gesetzt). Verifikation der Logik erfolgt über obigen Sweep.

# ═══ 5) Aufräumen ═══
if wl_id:
    call("DELETE", f"/api/v1/salon/waitlist?id={wl_id}", label="Cleanup: Waitlist-Eintrag löschen")

# GiftCard löschen — es gibt keinen DELETE; wir setzen auf iptal (Testdaten-Markierung)
if card_id:
    call("PATCH", "/api/v1/salon/giftcards", {"id": card_id, "status": "iptal"}, label="Cleanup: GiftCard stornieren")

sys.exit(show())
