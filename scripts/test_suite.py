#!/usr/bin/env python3
"""Startet den Server, testet alle API-Endpunkte und beendet ihn wieder."""
import json
import subprocess
import sys
import time
import urllib.request
import urllib.error

BASE = 'http://127.0.0.1:8010'
ROOT = '/home/z/my-project/af-suite-v3'

proc = subprocess.Popen(
    [sys.executable, 'run_server.py', '--port', '8010', '--no-browser'],
    cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
)

def req(path, method='GET', data=None, token=None, raw=False):
    r = urllib.request.Request(BASE + '/api/v1' + path, method=method)
    if token:
        r.add_header('Authorization', 'Bearer ' + token)
    body = None
    if data is not None:
        r.add_header('Content-Type', 'application/json')
        body = json.dumps(data).encode()
    with urllib.request.urlopen(r, body, timeout=15) as resp:
        payload = resp.read()
        return payload if raw else json.loads(payload)

def get_static(path):
    with urllib.request.urlopen(BASE + path, timeout=15) as resp:
        return resp.status, resp.read()

try:
    # Warten bis Server oben ist
    for _ in range(40):
        try:
            urllib.request.urlopen(BASE + '/api/v1/health', timeout=2)
            break
        except Exception:
            time.sleep(0.5)

    ok = 0
    # 1) Login
    login = req('/auth/login', 'POST', {'username': 'admin', 'password': 'admin123'})
    token = login['token']
    print('✓ Login:', login['employee']['name'], '| Rolle:', login['employee']['role'])
    ok += 1

    # 2) Fahrzeuge
    veh = req('/vehicles', token=token)
    veh_t = [v for v in veh if v['brand'] == 'Toyota']
    print(f'✓ Fahrzeuge: {len(veh)} total, {len(veh_t)} Toyota')
    ok += 1

    # 3) Kalkulation
    calc = req('/calculate-performance', 'POST', {
        'vehicleId': veh_t[0]['id'], 'warranty': 'z3', 'install': 'partner',
        'channel': 'b2c', 'b2bQty': 1}, token=token)
    print('✓ Kalkulation: Total', calc['totals']['total'],
          '| Garantie', calc['totals']['warrantyPrice'],
          '| Einbau', calc['totals']['installPrice'])
    ok += 1

    # 4) Offerte erstellen (B2C, mit Garantie + Partner-Einbau)
    quote = req('/generate-quote', 'POST', {
        'vehicleId': veh_t[0]['id'],
        'customer': {'name': 'Testkunde Bruno', 'zip': '8001', 'city': 'Zürich',
                     'channel': 'b2c', 'street': 'Bahnhofstrasse 1'},
        'warranty': 'z3', 'install': 'partner', 'channel': 'b2c', 'b2bQty': 1,
        'note': 'Testofferte'},
        token=token)
    print('✓ Offerte erstellt: #' + str(quote['refNumber']),
          '| Total', quote['total'],
          '| Partner:', quote['partner']['company'] if quote['partner'] else '—',
          '| Follow-ups:', len(quote['followups']),
          '| E-Mails:', list((quote['emails'] or {}).keys()))
    ok += 1

    # 5) B2B-Offerte
    quote2 = req('/generate-quote', 'POST', {
        'vehicleId': veh_t[1]['id'],
        'customer': {'name': 'Muster Garage AG', 'zip': '5600', 'city': 'Lenzburg',
                     'channel': 'b2b'},
        'warranty': 'none', 'install': 'self', 'channel': 'b2b', 'b2bQty': 10},
        token=token)
    print('✓ B2B-Offerte: #' + str(quote2['refNumber']), '| Total', quote2['total'],
          '| Rabatt:', quote2['items'][0]['discountPct'], '%')
    ok += 1

    # 6) PDF-Download
    pdf = req(f'/quotes/{quote["id"]}/pdf', token=token, raw=True)
    print('✓ PDF:', len(pdf), 'Bytes | Header:', pdf[:5])
    ok += 1

    # 7) Status-Update
    upd = req(f'/quotes/{quote["id"]}', 'PATCH', {'status': 'versendet'}, token=token)
    print('✓ Status-Update →', upd['status'])
    ok += 1

    # 8) Dashboard
    stats = req('/dashboard/stats', token=token)
    print('✓ Dashboard: Offerten', stats['quotesTotal'],
          '| Volumen', stats['volumeTotal'],
          '| Marken', [b['brand'] for b in stats['topBrands'][:3]],
          '| Follow-ups offen:', stats['followupsOverdue'] + stats['followupsToday'] + stats['followupsUpcoming'])
    ok += 1

    # 9) Partner + Routing
    partners = req('/partners?perPage=3', token=token)
    route = req('/partners/route', 'POST', {'zip': '8001', 'brand': 'Toyota'}, token=token)
    print('✓ Partner:', partners['total'], 'total | Routing PLZ 8001:',
          route[0]['partner']['company'], round(route[0]['effectiveKm']), 'km effektive Distanz')
    ok += 1

    # 10) Followups
    fu = req('/followups?status=offen', token=token)
    print('✓ Follow-ups offen:', len(fu), '| Erste Aktion:', fu[0]['action'][:60] if fu else '—')
    ok += 1

    # 11) Kunden
    cust = req('/customers?search=Bruno', token=token)
    print('✓ Kunden-Suche «Bruno»:', len(cust), 'Treffer')
    ok += 1

    # 12) Einstellungen
    st = req('/settings', token=token)
    print('✓ Einstellungen: Preisliste', len(st['priceList']), 'Produkte | MwSt',
          st['vatRate'], '| System:', st['system'])
    ok += 1

    # 13) Statische Dateien (Frontend)
    for path, label in [('/', 'index.html'), ('/assets/css/af.css', 'CSS'),
                        ('/assets/js/af-app.js', 'af-app.js'), ('/assets/js/af-ui.js', 'af-ui.js'),
                        ('/assets/js/af-api.js', 'af-api.js'), ('/assets/js/af-charts.js', 'af-charts.js'),
                        ('/assets/js/views/login.js', 'login.js'),
                        ('/assets/js/views/cockpit.js', 'cockpit.js'),
                        ('/assets/js/views/konfigurator.js', 'konfigurator.js'),
                        ('/assets/js/views/offerten.js', 'offerten.js'),
                        ('/assets/js/views/kunden.js', 'kunden.js'),
                        ('/assets/js/views/partner.js', 'partner.js'),
                        ('/assets/js/views/aufgaben.js', 'aufgaben.js'),
                        ('/assets/js/views/einstellungen.js', 'einstellungen.js'),
                        ('/assets/fonts/Inter-400.ttf', 'Font Inter'),
                        ('/assets/fonts/SpaceGrotesk-700.ttf', 'Font SpaceGrotesk'),
                        ('/favicon.svg', 'favicon.svg')]:
        status, body = get_static(path)
        assert status == 200 and len(body) > 50, f'{path} nicht ausgeliefert!'
        print(f'✓ Static {label}: {len(body):,} Bytes')
        ok += 1

    print(f'\n═════════ {ok} TESTS BESTANDEN ═════════')
finally:
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
