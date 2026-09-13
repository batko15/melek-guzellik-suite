#!/usr/bin/env python3
"""Logo-Schnitte V2 mit korrigierten Koordinaten + Verifikations-Grid"""
from PIL import Image, ImageDraw, ImageEnhance
import os

UP = "/home/z/my-project/upload"
BRAND = "/home/z/my-project/public/brand"
APP = "/home/z/my-project/src/app"

logo = Image.open(f"{UP}/melekce_guzellik17_14050510_043112392.jpg").convert("RGB")
W, H = logo.size

# Verifikations-Grid (10%-Linien) für Debug
grid = logo.copy()
d = ImageDraw.Draw(grid)
for i in range(1, 10):
    y = int(H * i / 10)
    d.line([(0, y), (W, y)], fill=(255, 80, 80), width=2)
    d.text((8, y + 6), f"{i*10}%", fill=(255, 120, 120))
grid.save("/tmp/logo-grid.jpg", quality=90)
print("Grid gespeichert: /tmp/logo-grid.jpg")

# ── Flügel-Schnitt: 4% – 34% Höhe, horizontale Mitte ──────────────────────
wing_box = (int(W*0.16), int(H*0.045), int(W*0.84), int(H*0.335))
wing = logo.crop(wing_box)
side = max(wing.size)
pad = Image.new("RGB", (side, side), (18, 16, 13))
pad.paste(wing, ((side - wing.width)//2, (side - wing.height)//2))
pad.save(f"{BRAND}/logo-wing.jpg", quality=92, optimize=True)
print("logo-wing.jpg", pad.size)

# Favicon aus Flügel
fav = pad.resize((512, 512), Image.LANCZOS)
fav.save(f"{APP}/icon.png")
print("icon.png aktualisiert")

# ── Text-Banner: 38% – 68% Höhe (MELEK'ÇE GÜZELLİK + NAIL ARTIST komplett) ─
banner_box = (int(W*0.05), int(H*0.375), int(W*0.95), int(H*0.685))
banner = logo.crop(banner_box)
banner.save(f"{BRAND}/logo-text.jpg", quality=92, optimize=True)
print("logo-text.jpg", banner.size)
