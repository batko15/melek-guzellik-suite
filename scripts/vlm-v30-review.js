// VLM-Design-Review der V3-Rezervasyon-Merkezi-Screenshots
const ZAI = require("z-ai-web-dev-sdk").default
const fs = require("fs")

async function review(imagePath, question) {
  const b64 = fs.readFileSync(imagePath).toString("base64")
  const zai = await ZAI.create()
  const res = await zai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: question },
          { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
    model: "glm-4.5v",
  })
  return res.choices[0]?.message?.content ?? "(keine Antwort)"
}

async function main() {
  const shots = [
    ["scripts/shot-v30-merkez.png", "Dies ist das 'Rezervasyon Merkezi' (Buchungsverwaltungszentrum) eines türkischen Beauty-Salons (Desktop). Prüfe: 1) Sind KPI-Karten, Status-Tabs mit Zählern, Suchfeld, Tabelle mit Aktionen sichtbar und sauber ausgerichtet? 2) Wirkt das Gold/Schwarz-Design elegant? 3) Gibt es Überlappungen, abgeschnittene Elemente oder Lesbarkeitsprobleme? Antworte kurz auf Deutsch mit einer Note /10."],
    ["scripts/shot-v30-bildirimler.png", "Dies ist der 'Bildirimler'-Tab (Kundenbenachrichtigungs-Protokoll) des türkischen Beauty-Salons. Prüfe: 1) Sind die Kanal-Badges (WhatsApp/SMS/E-Mail) und Benachrichtigungstypen sichtbar? 2) Sind die Protokollzeilen saubere Listeneinträge? 3) Layout-Probleme? Antworte kurz auf Deutsch mit einer Note /10."],
    ["scripts/shot-v30-mobile-merkez.png", "Dies ist die mobile Ansicht (390px) des Rezervasyon Merkezi. Prüfe: 1) Sind die KPI-Karten 2-spaltig und lesbar? 2) Sind die Buchungskarten mit Düzenle/Bildir/Onayla-Buttons touch-freundlich (min 44px)? 3) Gibt es Überläufe oder abgeschnittene Texte? Antworte kurz auf Deutsch mit einer Note /10."],
    ["scripts/shot-v30-mobile-onayla-bildir.png", "Dies ist der mobile Dialog 'Müşteriyi Bilgilendir' (Kunde informieren) nach einer Buchungsbestätigung. Prüfe: 1) Ist die vorbereitete türkische WhatsApp-Nachricht im Textfeld lesbar? 2) Sind die Kanal-Buttons (WhatsApp/SMS/E-Mail) groß und klar? 3) Layout-Probleme? Antworte kurz auf Deutsch mit einer Note /10."],
  ]
  const out = {}
  for (const [img, q] of shots) {
    if (!fs.existsSync(img)) { out[img] = "(fehlt)"; continue }
    out[img] = await review(img, q)
    console.log("=== " + img + " ===\n" + out[img] + "\n")
  }
  fs.writeFileSync("scripts/vlm-v30-review.json", JSON.stringify(out, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
