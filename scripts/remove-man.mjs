// Mann aus Galerie-Foto entfernen (SDK-Weg, base64)
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

const SRC = '/home/z/my-project/public/gallery/real/ozel-gun-takimi.jpg'
const OUT = '/home/z/my-project/public/gallery/real/ozel-gun-takimi-new.png'

async function main() {
  const zai = await ZAI.create()
  const b64 = fs.readFileSync(SRC).toString('base64')
  const dataUrl = `data:image/jpeg;base64,${b64}`

  const response = await zai.images.generations.edit({
    prompt:
      'Remove the man completely from this photo. Keep the elegant festive background with golden vases, warm bokeh lights and decorative flowers exactly as they are. Fill the area where the man stood with more of the luxurious background scenery: golden vases, warm fairy lights, elegant celebration decoration. Absolutely no people in the result. Warm, elegant, luxurious beauty salon atmosphere, same warm golden color tones, same lighting.',
    images: [{ url: dataUrl }],
    size: '768x1344',
  })

  const out = response.data?.[0]?.base64
  if (!out) throw new Error('Keine Bild-Daten erhalten: ' + JSON.stringify(response).slice(0, 500))
  fs.writeFileSync(OUT, Buffer.from(out, 'base64'))
  console.log('OK ->', OUT, fs.statSync(OUT).size, 'Bytes')
}

main().catch((e) => {
  console.error('FEHLER:', e.message)
  process.exit(1)
})
