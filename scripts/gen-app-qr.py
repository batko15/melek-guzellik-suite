#!/usr/bin/env python3
"""V5.5 — App-Download-QR-Code (Markenfarben: Champagner-Gold auf Samt-Dunkel).
Ziel: GitHub-Release-«latest»-URL — zeigt IMMER auf die neueste APK,
egal wie viele Versionen später folgen."""

import qrcode
from qrcode.constants import ERROR_CORRECT_M
from PIL import Image

URL = "https://github.com/batko15/melek-guzellik-suite/releases/latest"
OUT = "/home/z/my-project/public/brand/app-qr.png"

# Markenpalette (globals.css: --brand oklch(0.76 0.11 86) ≈ Champagner-Gold)
FG = (216, 172, 98)      # Champagner-Gold
BG = (21, 18, 16)        # Samt-Dunkel #151210

qr = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=12, border=2)
qr.add_data(URL)
qr.make(fit=True)
img = qr.make_image(fill_color=FG, back_color=BG).convert("RGB")

# Deckkraft-Kontrast prüfen: Gold-auf-Dunkel ist gut lesbar (Luminanz-Delta ~46%).
# Sicherheitshalber Modul-Helligkeit leicht anheben, damit Handy-Scanner im
# Dunkelmodus zuverlässig erfassen:
img = Image.eval(img, lambda p: min(255, int(p * 1.08)) if p > 100 else p)

img.save(OUT, optimize=True)
print(f"QR gespeichert: {OUT} ({img.size[0]}x{img.size[1]} px) → {URL}")
