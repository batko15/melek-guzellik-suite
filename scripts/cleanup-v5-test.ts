// V5 test kalıntılarını temizler: Test Musteri V5 randevusu + müşteri kaydı
import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()

async function main() {
  // 1) Test randevularını bul
  const bookings = await db.booking.findMany({
    where: { OR: [{ notes: { contains: "V5" } }, { customer: { is: { name: { contains: "Test Musteri" } } } }] },
    include: { customer: true },
  })
  for (const b of bookings) {
    await db.booking.delete({ where: { id: b.id } })
    console.log("silindi: randevu", b.id, "-", b.customer?.name)
  }

  // 2) Test müşteri kaydını sil
  const delC = await db.salonCustomer.deleteMany({ where: { name: { contains: "Test Musteri" } } })
  console.log("müşteri silindi:", delC.count)

  // 3) Test bildirim kayıtları (Elif'e giden ozel-mesaj testi dahil değil — gerçek akış)
  const total = await db.booking.count()
  console.log("kalan randevu:", total)
}

main().finally(() => db.$disconnect())
