// add-instagram-photo.js — Fügt das neue Instagram-Marken-Foto zur Cloud-Galerie hinzu
// (idempotent: fügt nur ein, wenn noch nicht vorhanden)
// Lädt die Verbindung aus .env.cloud-test (gitignored — keine Credentials im Repo)

const fs = require("fs")
const path = require("path")
const { Client } = require("pg")

function loadCloudUrl() {
  const envPath = path.join(__dirname, "..", ".env.cloud-test")
  if (!fs.existsSync(envPath)) {
    console.error("✗ .env.cloud-test nicht gefunden — Cloud-Update übersprungen")
    process.exit(2)
  }
  const line = fs.readFileSync(envPath, "utf8")
    .split("\n")
    .find((l) => l.startsWith("DATABASE_URL="))
  if (!line) {
    console.error("✗ DATABASE_URL fehlt in .env.cloud-test")
    process.exit(2)
  }
  return line.slice("DATABASE_URL=".length).trim().replace(/^"|"$/g, "")
}

async function main() {
  const url = loadCloudUrl()
  const imagePath = "/gallery/real/melekce-instagram-markasi.jpg"

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()

  // Bereits vorhanden?
  const existing = await client.query(
    "SELECT id, title FROM \"GalleryItem\" WHERE \"imagePath\" = $1 LIMIT 1",
    [imagePath],
  )
  if (existing.rows.length > 0) {
    console.log(`✓ Bereits vorhanden: "${existing.rows[0].title}" (id=${existing.rows[0].id})`)
    await client.end()
    return
  }

  // Einfügen (cuid-artige ID selbst erzeugen — einfachheitshalber zeitbasiert)
  const id = "img" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  await client.query(
    `INSERT INTO "GalleryItem" (id, title, category, "imagePath", "sortOrder", "customerId", active, "createdAt")
     VALUES ($1, $2, $3, $4, $5, NULL, TRUE, NOW())`,
    [id, "Melek'çe Instagram Markası", "studyo", imagePath, 23],
  )
  console.log(`✓ Eingefügt: "Melek'çe Instagram Markası" (id=${id}, sortOrder=23)`)

  const count = await client.query('SELECT COUNT(*)::int AS c FROM "GalleryItem" WHERE active = TRUE')
  console.log(`Galerie-Gesamtbestand (Cloud, aktiv): ${count.rows[0].c}`)

  await client.end()
}

main().catch((e) => {
  console.error("✗ Fehler:", e.message)
  process.exit(1)
})
