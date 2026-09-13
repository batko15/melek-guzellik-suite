// Browser-E2E-Test-Artefakte bereinigen
import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()

async function main() {
  // 1) Zeynep Test + ihre Buchung löschen
  const c = await db.salonCustomer.findFirst({ where: { name: "Zeynep Test" } })
  if (c) {
    await db.booking.deleteMany({ where: { customerId: c.id } })
    await db.salonCustomer.delete({ where: { id: c.id } })
    console.log("Zeynep Test entfernt")
  }
  // 2) Elifs vergangene Buchung wieder auf 10:00 (PUT-Test hatte 14:30 gesetzt)
  const elif = await db.salonCustomer.findUnique({ where: { phone: "+90 532 111 22 33" } })
  if (elif) {
    const past = await db.booking.findFirst({
      where: { customerId: elif.id, status: "tamamlandi", notes: "Altın parıltı vurgular" },
      orderBy: { startAt: "desc" },
    })
    if (past) {
      const d = past.startAt
      d.setHours(10, 0, 0, 0)
      await db.booking.update({ where: { id: past.id }, data: { startAt: d } })
      console.log("Elifs alte Buchung: 10:00 wiederhergestellt")
    }
  }
  console.log("Endzustand:", {
    bookings: await db.booking.count(),
    customers: await db.salonCustomer.count(),
    logs: await db.notificationLog.count(),
  })
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
