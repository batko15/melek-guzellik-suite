// Test-artefaktlarını temizler (demo verilerini gerçekçi tutmak için)
import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()

async function main() {
  // 1) PUT-testi bozduğu randevuyu orijinal durumuna döndür
  const b = await db.booking.findFirst({ where: { notes: "Değişiklik testi — kalp deseni" } })
  if (b) {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(9, 30, 0, 0)
    await db.booking.update({
      where: { id: b.id },
      data: {
        startAt: d,
        durationMin: 90,
        priceChf: 1250,
        status: "bekliyor",
        notes: "İlk uzatma — danışma istiyorum",
        staffNote: null,
      },
    })
    console.log("randevu geri yüklendi:", b.id)
  }

  // 2) Test bildirim günlüğü kaydını sil
  const del = await db.notificationLog.deleteMany({ where: { message: { startsWith: "Test mesajı" } } })
  console.log("test bildirimi silindi:", del.count)

  // 3) Test kullanıcısı ve randevusu kaldıysa sil
  const testCustomer = await db.salonCustomer.findFirst({ where: { name: "Test Kullanıcı" } })
  if (testCustomer) {
    await db.booking.deleteMany({ where: { customerId: testCustomer.id } })
    await db.salonCustomer.delete({ where: { id: testCustomer.id } })
    console.log("test kullanıcısı silindi")
  }

  console.log("durum:", {
    bookings: await db.booking.count(),
    customers: await db.salonCustomer.count(),
    logs: await db.notificationLog.count(),
  })
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
