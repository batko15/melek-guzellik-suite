#!/usr/bin/env python3
"""Statische Prüfung aller Frontend-JS-Dateien auf undefinierte Bezeichner.

Vereinfachte Analyse: sammelt pro IIFE-Datei alle destrukturierten Namen,
lokalen Funktionen/Variablen und prüft, welche genutzten Bezeichner fehlen.
"""
import re
import sys
from pathlib import Path

JS_DIR = Path('/home/z/my-project/af-suite-v3/app/static/assets/js')
FILES = ['af-api.js', 'af-ui.js', 'af-charts.js', 'af-app.js'] + \
        [f'views/{p.name}' for p in sorted((JS_DIR / 'views').glob('*.js'))]

GLOBALS = {
    'window', 'document', 'location', 'localStorage', 'navigator', 'console',
    'JSON', 'Object', 'Array', 'String', 'Number', 'Math', 'Promise', 'Date',
    'URLSearchParams', 'requestAnimationFrame', 'performance', 'setTimeout',
    'clearTimeout', 'setInterval', 'clearInterval', 'fetch', 'URL', 'Blob',
    'CustomEvent', 'HashChangeEvent', 'FormData', 'FileReader', 'isSecureContext',
    'AFN', 'arguments', 'Symbol', 'Infinity', 'parseInt', 'parseFloat',
    'encodeURIComponent', 'decodeURIComponent', 'URLSearchParams',
    'RegExp', 'Error', 'TypeError', 'navigator',
}

KEYWORDS = {
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break',
    'continue', 'return', 'function', 'typeof', 'instanceof', 'new', 'delete',
    'void', 'in', 'of', 'const', 'let', 'var', 'try', 'catch', 'finally',
    'throw', 'this', 'true', 'false', 'null', 'undefined', 'class', 'extends',
    'super', 'yield', 'async', 'await', 'static', 'get', 'set',
}

issues_found = 0
for rel in FILES:
    src = (JS_DIR / rel).read_text()
    # Strip Kommentare und Strings (grob)
    stripped = re.sub(r'//[^\n]*', '', src)
    stripped = re.sub(r'/\*.*?\*/', '', stripped, flags=re.S)
    stripped = re.sub(r'`[^`]*`', '``', stripped, flags=re.S)
    stripped = re.sub(r"'[^']*'", "''", stripped)
    stripped = re.sub(r'"[^"]*"', '""', stripped)

    defined = set(GLOBALS) | KEYWORDS
    # Destrukturierungen: const { a, b, c } = ...  (auch mehrzeilig)
    for m in re.finditer(r'const\s*\{([^}]+)\}\s*=', stripped):
        for part in m.group(1).split(','):
            part = part.strip()
            if part:
                defined.add(part.split(':')[0].strip())
    # const/let/function-Deklarationen
    for m in re.finditer(r'\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)', stripped):
        defined.add(m.group(1))
    for m in re.finditer(r'function\s+([A-Za-z_$][\w$]*)', stripped):
        defined.add(m.group(1))
    # Funktionsparameter (einfach: f(a, b) => / function f(a, b))
    for m in re.finditer(r'(?:function\s*\(([^)]*)\)|\(([^)]*)\)\s*=>)', stripped):
        params = m.group(1) or m.group(2) or ''
        for p in params.split(','):
            p = p.strip().split('=')[0].strip()
            if p:
                defined.add(p)
    # AFN.* Zugriffe sind ok; AFN selbst ist global

    # Genutzte Bezeichner: name( oder name. oder name) als Aufruf/Lesezugriff
    used = set()
    for m in re.finditer(r'(?<![\w$.])([a-zA-Z_$][\w$]*)\s*\(', stripped):
        used.add(m.group(1))
    for m in re.finditer(r'(?<![\w$.])([a-zA-Z_$][\w$]*)\s*\.', stripped):
        used.add(m.group(1))

    missing = sorted(u for u in used if u not in defined)
    # Bekannte falsch Positive durch Objektliterale/Patterns herausfiltern
    false_pos = {'toLocaleString', 'includes', 'map', 'filter', 'forEach', 'join',
                 'slice', 'concat', 'push', 'split', 'trim', 'replace', 'find',
                 'querySelector', 'querySelectorAll', 'getElementById', 'addEventListener',
                 'removeEventListener', 'createTextNode', 'createElement', 'requestSubmit',
                 'getAttribute', 'setAttribute', 'classList', 'innerHTML', 'textContent',
                 'appendChild', 'remove', 'click', 'dispatchEvent', 'CustomEvent', 'then',
                 'catch', 'finally', 'apply', 'call', 'bind', 'now', 'round', 'abs',
                 'min', 'max', 'pow', 'sqrt', 'random', 'keys', 'entries', 'values',
                 'from', 'isArray', 'stringify', 'parse', 'startsWith', 'endsWith',
                 'indexOf', 'lastIndexOf', 'toLowerCase', 'toUpperCase', 'repeat',
                 'test', 'exec', 'match', 'matchAll', 'get', 'set', 'has', 'delete',
                 'add', 'toggle', 'contains', 'insertAdjacentHTML', 'focus',
                 'setSelectionRange', 'submit', 'preventDefault', 'stopPropagation',
                 'target', 'closest', 'selectedOptions', 'checked', 'disabled', 'files',
                 'value', 'src', 'href', 'title', 'name', 'message', 'stack', 'reason',
                 'detail', 'employee', 'token', 'role', 'id', 'children', 'length',
                 'style', 'className', 'classList', 'dataset', 'ref', 'open', 'close',
                 'reload', 'scrollTo', 'isSecureContext'}
    missing = [m for m in missing if m not in false_pos]
    if missing:
        issues_found += 1
        print(f'⚠ {rel}: möglicherweise undefiniert: {missing}')

if not issues_found:
    print('✓ Alle Dateien sauber — keine undefinierten Bezeichner gefunden')
sys.exit(0)
