// PWA-Icons aus dem echten Melek'çe-Logo generieren (V5.1)
// Erzeugt: icon-192.png, icon-512.png, icon-maskable-192/512.png, apple-touch-icon.png
import sharp from "sharp"

const SRC = "public/brand/logo.jpg"
const BG = { r: 21, h: 18, s: 10, l: 8 } // dunkles Velvet-Black passend zur Seite (#151210-artig)

async function plain(size, out) {
  // Logo deckt die volle Fläche (Purpose: any)
  await sharp(SRC)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(out)
  console.log(`✓ ${out} (${size}x${size})`)
}

async function maskable(size, out) {
  // Maskable: ~80 % Sicherheitszone — Logo mit dunklem Rand
  const inner = Math.round(size * 0.78)
  const offset = Math.round((size - inner) / 2)
  const base = await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 21, g: 18, b: 16 },
    },
  })
    .png()
    .toBuffer()
  await sharp(base)
    .composite([
      {
        input: await sharp(SRC)
          .resize(inner, inner, { fit: "contain", background: { r: 21, g: 18, b: 16 } })
          .png()
          .toBuffer(),
        left: offset,
        top: offset,
      },
    ])
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(out)
  console.log(`✓ ${out} (${size}x${size}, maskable)`)
}

await plain(192, "public/icon-192.png")
await plain(512, "public/icon-512.png")
await maskable(192, "public/icon-maskable-192.png")
await maskable(512, "public/icon-maskable-512.png")
await plain(180, "public/apple-touch-icon.png")
console.log("Fertig — alle PWA-Icons generiert")
