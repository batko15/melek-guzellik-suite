// GET /api/v1/salon/gallery — Galerie-Einträge für die Landing-Page
import { db } from "@/lib/db"

export async function GET() {
  const items = await db.galleryItem.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  })
  return Response.json({ items, count: items.length })
}
