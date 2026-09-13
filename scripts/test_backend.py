#!/usr/bin/env python3
"""Smoke-Test: Backend-API komplett durchtesten (Login → Fahrzeuge → Berechnung → Offerte → PDF → Dashboard)."""
import json
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8765"
TOKEN = None
PASSED = FAILED = 0


def req(method: str, path: str, body=None, headers=None, raw=False):
    url = BASE + path
    data = None
    hdrs = {"Content-Type": "application/json"}
    if headers:
        hdrs.update(headers)
    if body is not None:
        data = body if isinstance(body, bytes) else json.dumps(body).encode()
    r = urllib.request.Request(url, data=data, method=method, headers=hdrs)
    try:
        with urllib.request.urlopen(r, timeout=20) as resp:
            content = resp.read()
            if raw:
                return resp.status, content
            return resp.status, json.loads(content) if content else None
    except urllib.error.HTTPError as e:
        content = e.read()
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, content[:200]


def check(name: str, status: int, expected: int, extra: str = "") -> bool:
    global PASSED, FAILED
    ok = status == expected
    if ok:
        PASSED += 1
        print(f"  OK   {name} [{status}] {extra}")
    else:
        FAILED += 1
        print(f"  FAIL {name} [{status} != {expected}] {extra}")
    return ok


print("=== 1. Health & Login ===")
s, d = req("GET", "/api/v1/health")
check("GET /health", s, 200, str(d.get("version", "")))

s, d = req("POST", "/api/v1/auth/login", {"username": "admin", "password": "admin123"})
check("Login admin", s, 200)
TOKEN = d.get("token", "")
AUTH = {"Authorization": f"Bearer {TOKEN}"}

s, d = req("POST", "/api/v1/auth/login", {"username": "admin", "password": "falsch"})
check("Login falsches Passwort -> 401", s, 401)

print("=== 2. Fahrzeuge ===")
s, d = req("GET", "/api/v1/vehicles", headers=AUTH)
check("GET /vehicles", s, 200, f"{len(d)} Fahrzeuge")
first_vehicle = d[0] if d else None
s, d = req("GET", "/api/v1/vehicles/brands", headers=AUTH)
check("GET /vehicles/brands", s, 200, f"{len(d)} Marken: {', '.join(d)}")
s, d = req("GET", "/api/v1/vehicles?brand=Toyota", headers=AUTH)
check("GET /vehicles?brand=Toyota", s, 200, f"{len(d)} Toyota")

print("=== 3. Leistungsberechnung ===")
toyota = [v for v in req("GET", "/api/v1/vehicles?brand=Toyota", headers=AUTH)[1] if "RAV4" in v["model"]]
vid = toyota[0]["id"]
s, d = req("POST", "/api/v1/calculate-performance",
           {"vehicleId": vid, "warranty": "z3", "install": "partner", "channel": "b2c", "b2bQty": 1}, headers=AUTH)
check("POST /calculate-performance", s, 200,
      f"Total CHF {d['totals']['total']} | +{d['performance']['hpGainPct']}% PS")

s, d = req("POST", "/api/v1/calculate-performance",
           {"vehicleId": vid, "warranty": "none", "install": "self", "channel": "b2b", "b2bQty": 10}, headers=AUTH)
check("POST calculate B2B ab 10 Stk", s, 200,
      f"EK-Preis CHF {d['totals']['basePrice']} | Rabatt {d['totals']['items'][0]['discountPct']}%")

print("=== 4. Offerte erstellen (B2C mit Partner-Einbau) ===")
s, d = req("POST", "/api/v1/generate-quote",
           {"vehicleId": vid, "customer": {"name": "Testkunde Toni Tester", "street": "Testweg 1",
                                            "zip": "8005", "city": "Zürich", "email": "toni@example.ch",
                                            "phone": "+41 79 000 00 00", "channel": "b2c"},
            "warranty": "z3", "install": "partner", "channel": "b2c", "b2bQty": 1}, headers=AUTH)
check("POST /generate-quote", s, 200,
      f"Ref {d['refNumber']} | Total CHF {d['total']} | Partner: {d['partner']['company'] if d['partner'] else 'keiner'}")
quote_id = d["id"]
has_emails = d.get("emails") and "customer" in d["emails"] and "sales" in d["emails"] and "partner" in d["emails"]
check("E-Mail-Mockups (Kunde/Vertrieb/Partner)", 200 if has_emails else 500, 200)
check("Follow-ups Tag 1/3/7 erzeugt", 200 if len(d.get("followups", [])) == 3 else 500, 200)

s, content = req("GET", f"/api/v1/quotes/{quote_id}/pdf", headers=AUTH, raw=True)
check("GET /quotes/{id}/pdf", s, 200, f"{len(content)} Bytes, PDF-Magic: {content[:5]}")

print("=== 5. Offerten-Verwaltung ===")
s, d = req("GET", "/api/v1/quotes?status=offen", headers=AUTH)
check("GET /quotes?status=offen", s, 200, f"{len(d)} offene Offerten")
s, d = req("PATCH", f"/api/v1/quotes/{quote_id}", {"status": "versendet"}, headers=AUTH)
check("PATCH Status -> versendet", s, 200, f"sentAt gesetzt: {bool(d.get('sentAt'))}")

print("=== 6. Partner & Routing ===")
s, d = req("GET", "/api/v1/partners/stats", headers=AUTH)
check("GET /partners/stats", s, 200, f"{d['total']} Häuser, {d['withContactPerson']} mit Ansprechperson")
s, d = req("GET", "/api/v1/partners?page=1&perPage=10", headers=AUTH)
check("GET /partners (Seite 1)", s, 200, f"{d['total']} total")
s, d = req("POST", "/api/v1/partners/route", {"zip": "8640", "brand": "Toyota"}, headers=AUTH)
check("POST /partners/route PLZ 8640", s, 200,
      f"1. {d[0]['partner']['company']} ({d[0]['partner']['city']}, {d[0]['distanceKm']} km, Match: {d[0]['brandMatch']})")

print("=== 7. Kunden, Follow-ups, Dashboard ===")
s, d = req("GET", "/api/v1/customers", headers=AUTH)
check("GET /customers", s, 200, f"{len(d)} Kunden")
s, d = req("GET", "/api/v1/followups", headers=AUTH)
check("GET /followups", s, 200, f"{len(d)} Aufgaben")
if d:
    fid = d[0]["id"]
    s2, d2 = req("PATCH", f"/api/v1/followups/{fid}", {"done": True}, headers=AUTH)
    check("PATCH followup -> erledigt", s2, 200, f"done={d2['done']}")
s, d = req("GET", "/api/v1/dashboard/stats", headers=AUTH)
check("GET /dashboard/stats", s, 200,
      f"Volumen CHF {d['volumeTotal']}, Abschlussquote {d['winRate']}%, Marken: {len(d['topBrands'])}")
s, d = req("GET", "/api/v1/settings", headers=AUTH)
check("GET /settings", s, 200, f"MwSt {(d['vatRate'] * 100)}%")

print("=== 8. Rollen & Rechte ===")
s, d = req("POST", "/api/v1/auth/login", {"username": "uemit", "password": "uemit123"})
check("Login vertrieb (uemit)", s, 200)
SALES_AUTH = {"Authorization": f"Bearer {d.get('token', '')}"}
s, d = req("GET", "/api/v1/settings/employees", headers=SALES_AUTH)
check("Mitarbeiter-Liste für Vertrieb -> 403", s, 403)
s, d = req("GET", "/api/v1/quotes", headers={"Authorization": "Bearer ungültig"})
check("Ungültiger Token -> 401", s, 401)

print()
print(f"ERGEBNIS: {PASSED} bestanden, {FAILED} fehlgeschlagen")
exit(0 if FAILED == 0 else 1)
