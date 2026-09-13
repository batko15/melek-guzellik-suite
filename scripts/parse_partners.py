#!/usr/bin/env python3
"""
ALIEN 1 — SYSTEM ARCHITECT & DATA ENGINEER
Parser für Excel/JSON-Daten der AutoFaszination B2B Sales Suite.

Quellen:
  - Markenhaeuser_vollstaendig_sortiert.xlsx (433 Markenhäuser CH & FL)
Ziel:
  - data/partners.json  (sauber normalisiert für den DB-Seed)
"""
import json, os, re
import openpyxl

SRC = "/home/z/my-project/upload/autofaszination-extracted/Markenhaeuser_vollstaendig_sortiert(2)(1).xlsx"
OUT_DIR = "/home/z/my-project/data"
os.makedirs(OUT_DIR, exist_ok=True)

wb = openpyxl.load_workbook(SRC, data_only=True)

def clean(v):
    if v is None:
        return ""
    return str(v).strip()

# ---------- Vertriebspipeline Sheet (Priorität + Ansprechperson) ----------
ws = wb["Vertriebspipeline"]
pipeline = {}
for row in list(ws.iter_rows(values_only=True))[3:]:  # Zeile 4 = Header, danach Daten
    prio, marke, firma, ansprech, strasse, plz, ort, kanton, land, tel, mail, web = [clean(c) for c in row[:12]]
    if not firma:
        continue
    key = (firma.lower(), clean(plz))
    pipeline[key] = {
        "priority": prio or "C",
        "contactPerson": ansprech,
    }

# ---------- Gesamtübersicht Sheet (alle 433 Häuser) ----------
ws = wb["Gesamtübersicht"]
partners = []
seen = set()
for row in list(ws.iter_rows(values_only=True))[3:]:
    marke, firma, ansprech, strasse, plz, ort, kanton, land, tel, mail, web = [clean(c) for c in row[:11]]
    if not firma or not plz:
        continue
    key = (firma.lower(), plz)
    if key in seen:
        continue
    seen.add(key)
    pipe = pipeline.get(key, {})
    brands = [b.strip() for b in re.split(r"[,;/]", marke) if b.strip()]
    partners.append({
        "company": firma,
        "brands": brands,
        "primaryBrand": brands[0] if brands else "Unbekannt",
        "contactPerson": ansprech or pipe.get("contactPerson", ""),
        "street": strasse,
        "zip": plz,
        "city": ort,
        "canton": kanton,
        "country": "LI" if "liechtenstein" in land.lower() else "CH",
        "phone": tel,
        "email": mail,
        "website": web.replace("http://", "https://") if web.startswith("http://") else web,
        "priority": pipe.get("priority", "C"),
        # Kapazität gemäss Leitfaden: normaler Garagenbetrieb ~500-1000 Kunden
        "capacityVehiclesPerMonth": 8 if pipe.get("priority") == "A" else (5 if pipe.get("priority") == "B" else 3),
    })

with open(f"{OUT_DIR}/partners.json", "w", encoding="utf-8") as f:
    json.dump(partners, f, ensure_ascii=False, indent=2)

# Statistik
from collections import Counter
prios = Counter(p["priority"] for p in partners)
cantons = Counter(p["canton"] for p in partners)
brand_counter = Counter(p["primaryBrand"] for p in partners)
print(f"✅ {len(partners)} Markenhäuser geparst → {OUT_DIR}/partners.json")
print(f"Prioritäten: {dict(prios)}")
print(f"Top-Kantone: {cantons.most_common(10)}")
print(f"Marken: {dict(brand_counter)}")
print(f"Mit Ansprechperson: {sum(1 for p in partners if p['contactPerson'])}")
print(f"Mit E-Mail: {sum(1 for p in partners if p['email'])}")
