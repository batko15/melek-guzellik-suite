#!/usr/bin/env python3
"""Bild-Verarbeitung V3.1:
1. Mann-freies Özel-Gun-Foto als JPG speichern
2. 6 neue echte Beauty-Fotos in Galerie-Ordner kopieren
3. Logo verarbeiten: Original + Flügel-Schnitt (Navbar/Favicon)
"""
from PIL import Image, ImageEnhance
import shutil, os

UP = "/home/z/my-project/upload"
GAL = "/home/z/my-project/public/gallery/real"
BRAND = "/home/z/my-project/public/brand"
APP = "/home/z/my-project/src/app"

os.makedirs(BRAND, exist_ok=True)

# ── 1. Mann-freies Özel-Gun-Foto (PNG → JPG, ersetzt Original) ────────────
src = Image.open(f"{GAL}/ozel-gun-takimi-new.png").convert("RGB")
src.save(f"{GAL}/ozel-gun-takimi.jpg", quality=88, optimize=True)
os.remove(f"{GAL}/ozel-gun-takimi-new.png")
print("1. ozel-gun-takimi.jpg ersetzt (mann-frei)", src.size)

# ── 2. Neue echte Fotos kopieren (Instagram melekce_guzellik17) ───────────
new_photos = {
    "melekce_guzellik17_14050510_043142485.jpg": "kirpik-kas-bakim.jpg",   # Auge: Wimpern + Brauen
    "melekce_guzellik17_14050510_043142943.jpg": "kirpik-zarif.jpg",       # Auge: geschwungene Wimpern
    "melekce_guzellik17_14050510_043143441.jpg": "goz-makyaj.jpg",         # Auge: Make-up + Lidschatten
    "melekce_guzellik17_14050510_043150500.jpg": "bordo-parlak.jpg",       # Hand: dunkelrote Glanz-Nägel
    "melekce_guzellik17_14050510_043150987.jpg": "bordo-klasik.jpg",       # Bordeaux-Nägel oval
    "melekce_guzellik17_14050510_043151488.jpg": "bordo-nailart.jpg",      # Nailart dunkelrot
}
for src_name, dst_name in new_photos.items():
    img = Image.open(f"{UP}/melek-photos/{src_name}").convert("RGB")
    # sanfte Qualitätsverbesserung
    img = ImageEnhance.Sharpness(img).enhance(1.08)
    img = ImageEnhance.Color(img).enhance(1.05)
    img.save(f"{GAL}/{dst_name}", quality=88, optimize=True)
    print(f"2. {dst_name} ({img.size})")
    shutil.copy(f"{UP}/melek-photos/{src_name}", f"{GAL}/.backup_{src_name}" if False else f"{GAL}/{dst_name}")

# ── 3. Logo verarbeiten ────────────────────────────────────────────────────
logo = Image.open(f"{UP}/melekce_guzellik17_14050510_043112392.jpg").convert("RGB")
W, H = logo.size  # 908x908

# 3a. Original-Logo (leicht optimiert) als JPG
logo_opt = ImageEnhance.Contrast(logo).enhance(1.03)
logo_opt.save(f"{BRAND}/logo.jpg", quality=92, optimize=True)
print("3a. logo.jpg", logo.size)

# 3b. Flügel-Schnitt (oberer Bereich, ca. 0-26% Höhe) → quadratisch mit Rand
wing_box = (int(W*0.10), int(H*0.035), int(W*0.90), int(H*0.30))
wing = logo.crop(wing_box)
# auf Quadrat padden (transparent → schwarz-velvet Hintergrund)
side = max(wing.size)
pad = Image.new("RGB", (side, side), (18, 16, 13))  # #12100D velvet
pad.paste(wing, ((side - wing.width)//2, (side - wing.height)//2))
pad.save(f"{BRAND}/logo-wing.jpg", quality=92, optimize=True)
print("3b. logo-wing.jpg", pad.size)

# 3c. Favicon (512x512) aus Flügel-Schnitt + auch als icon.png im app-Ordner
fav = pad.resize((512, 512), Image.LANCZOS)
fav.save(f"{APP}/icon.png")  # Next.js App-Router favicon
print("3c. icon.png (App-Router Favicon) 512x512")

# 3d. Logo-Banner (nur Textblock MELEK'ÇE GÜZELLİK + NAIL ARTIST) für Footer
banner_box = (int(W*0.06), int(H*0.26), int(W*0.94), int(H*0.62))
banner = logo.crop(banner_box)
banner.save(f"{BRAND}/logo-text.jpg", quality=92, optimize=True)
print("3d. logo-text.jpg", banner.size)

# 3e. Alte logo.svg entfernen, falls vorhanden (wird durch echtes Logo ersetzt)
if os.path.exists("/home/z/my-project/public/logo.svg"):
    os.remove("/home/z/my-project/public/logo.svg")
    print("3e. altes logo.svg entfernt")

print("\nFERTIG — alle Bilder verarbeitet.")
