// GET /api/v1/salon/services — alle aktiven Leistungen (Landing-Page & Buchung)
import { db } from "@/lib/db"

export async function GET() {
  const services = await db.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  })
  return Response.json({ services, count: services.length })
}
