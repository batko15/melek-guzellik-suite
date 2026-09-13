// VLM-Design-Review der wichtigsten Screenshots (Türkische V2 Suite)
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
    ["scripts/shot-tr-landing.png", "Bu bir güzellik salonu web sitesinin Türkçe açılış sayfası. Değerlendir: 1) Layout bütünlüğü (taşma, kırılma var mı?) 2) Tipografi ve renk uyumu (siyah-altın lüks temas) 3) Hava durumu widget'ı görünür mü? 4) Genel profesyonellik 1-10 puan. Kısa yanıt ver."],
    ["scripts/shot-tr-dashboard.png", "Bu bir stüdyo yönetim paneli (Türkçe). Değerlendir: 1) KPI kartları ve grafikler düzgün render oldu mu? 2) Hava durumu kartı var mı? 3) Değerlendirme özeti kartı var mı? 4) Layout sorunları var mı? Kısa yanıt ver, 1-10 puan."],
    ["scripts/shot-tr-mobile-landing.png", "Bu mobil görünüm (390px) açılış sayfası. 1) Alt gezinme çubuğu (Ana Sayfa/Randevu/Yorumlar) görünür ve sabitlenmiş mi? 2) İçerik mobilde okunabilir ve taşmıyor mu? Kısa yanıt ver, 1-10 puan."],
  ]
  for (const [path, q] of shots) {
    if (!fs.existsSync(path)) { console.log(`\n=== ${path} FEHLT ===`); continue }
    try {
      const answer = await review(path, q)
      console.log(`\n=== ${path} ===\n${answer}`)
    } catch (e) {
      console.log(`\n=== ${path} ERROR: ${e.message} ===`)
    }
  }
}

main()
