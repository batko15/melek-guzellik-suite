// Melek'çe Güzellik Suite V2 — Türkçe demo verileri
// Hizmetler (CHF fiyatlarla), müşteriler (telefon anahtarlı), randevular (2 hafta),
// misafir değerlendirmeleri (onaylı + incelemede) + galeri

import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

// ─── Hizmetler ───────────────────────────────────────────────────────────────
const SERVICES = [
  // Tırnak
  { name: "Jel Manikür", category: "tirnak", description: "İstediğiniz renkte yüksek kaliteli jel cila ile temel bakım", durationMin: 75, priceChf: 65, popular: true, sortOrder: 1 },
  { name: "Jel Uzatma", category: "tirnak", description: "İstenen şekil ve boyda jel ile uzatma", durationMin: 120, priceChf: 110, popular: true, sortOrder: 2 },
  { name: "Dolgu (Refil)", category: "tirnak", description: "Yeni çıkan tırnakların dolgusu ve yeniden mühürleme", durationMin: 90, priceChf: 85, sortOrder: 3 },
  { name: "Özel Tırnak Tasarımı", category: "tirnak", description: "Folyo, taş ve parıltı ile kişiye özel tasarım", durationMin: 45, priceChf: 40, sortOrder: 4 },
  { name: "Fransız Manikür", category: "tirnak", description: "Kusursuz beyaz uçlu klasik", durationMin: 30, priceChf: 25, sortOrder: 5 },
  { name: "Kalıcı Oje (Shellac)", category: "tirnak", description: "4 haftaya kadar süren parlak renk", durationMin: 45, priceChf: 50, popular: true, sortOrder: 6 },
  { name: "Klasik Manikür", category: "tirnak", description: "Kütikül bakımı, törpüleme, istediğiniz cila", durationMin: 40, priceChf: 35, sortOrder: 7 },
  { name: "Delüks Pedikür", category: "tirnak", description: "Peeling ve masajlı şımartan ayak bakımı", durationMin: 60, priceChf: 70, sortOrder: 8 },

  // Güzellik
  { name: "Kaş Şekillendirme", category: "guzellik", description: "Kusursuz kaşlar için hassas alma ve şekillendirme", durationMin: 20, priceChf: 25, popular: true, sortOrder: 10 },
  { name: "Kaş & Kirpik Boyama", category: "guzellik", description: "Etkileyici bakışlar için nazik boya", durationMin: 30, priceChf: 35, sortOrder: 11 },
  { name: "Delüks Cilt Bakımı", category: "guzellik", description: "Temizlik, peeling, maske ve bakım masajı", durationMin: 60, priceChf: 90, popular: true, sortOrder: 12 },
  { name: "İp ile Kaş Alma", category: "guzellik", description: "Geleneksel, özellikle nazik tüy alma yöntemi", durationMin: 20, priceChf: 30, sortOrder: 13 },
  { name: "Kına Kaş", category: "guzellik", description: "Daha dolgun kaşlar için doğal kına boyası", durationMin: 40, priceChf: 45, sortOrder: 14 },

  // Kirpik
  { name: "Kirpik Uzatma 1:1", category: "kirpik", description: "Her kirpiğe bir kılla klasik uzatma", durationMin: 90, priceChf: 120, popular: true, sortOrder: 20 },
  { name: "Volume Kirpik Uzatma", category: "kirpik", description: "Maksimum etki için Rus volume tekniği", durationMin: 120, priceChf: 150, sortOrder: 21 },
  { name: "Kirpik Dolgusu", category: "kirpik", description: "2–3 hafta sonra dolgu uygulaması", durationMin: 60, priceChf: 70, sortOrder: 22 },
  { name: "Lash Lift + Boyama", category: "kirpik", description: "Doğal kirpikler kusursuz kıvrımla", durationMin: 45, priceChf: 75, sortOrder: 23 },
]

// ─── Müşteriler (telefon = benzersiz anahtar) ────────────────────────────────
const CUSTOMERS = [
  { name: "Elif Yılmaz", phone: "+41 79 234 56 78", email: "elif.yilmaz@example.ch", notes: "Altın parıltı tasarımları seviyor, akrilat alerjisi → jel kullan" },
  { name: "Sara Meier", phone: "+41 76 123 45 67", email: "sarah.meier@example.ch", notes: "Fransız manikürü tercih ediyor, 3 haftada bir geliyor" },
  { name: "Ayşe Kaya", phone: "+41 78 987 65 43", email: "ayse.kaya@example.ch", notes: "Volume kirpik sadık müşterisi" },
  { name: "Lena Weber", phone: "+41 77 555 12 34", email: "lena.weber@example.ch", notes: null },
  { name: "Fatma Demir", phone: "+41 79 111 22 33", email: "fatma.demir@example.ch", notes: "Her zaman cumartesi sabahı" },
  { name: "Nikole Brunner", phone: "+41 76 444 88 99", email: "nicole.brunner@example.ch", notes: "Düzenli kaş şekillendirme + boyama" },
  { name: "Zeynep Arslan", phone: "+41 78 222 33 44", email: "zeynep.arslan@example.ch", notes: "Tırnak yiyen → kısa şekiller" },
  { name: "Melani Keller", phone: "+41 79 666 77 88", email: "melanie.keller@example.ch", notes: null },
]

// ─── Galeri ──────────────────────────────────────────────────────────────────
const GALLERY = [
  { title: "Şampanya Altını", category: "tirnak", imagePath: "/gallery/hero.png", sortOrder: 1 },
  { title: "Klasik Fransız", category: "tirnak", imagePath: "/gallery/nails-french.png", sortOrder: 2 },
  { title: "Altın Barok", category: "tirnak", imagePath: "/gallery/nails-gold.png", sortOrder: 3 },
  { title: "Nude Ombre", category: "tirnak", imagePath: "/gallery/nails-nude.png", sortOrder: 4 },
  { title: "Kirpik Etkisi", category: "kirpik", imagePath: "/gallery/beauty-lashes.png", sortOrder: 5 },
  { title: "Delüks Bakım", category: "guzellik", imagePath: "/gallery/beauty-spa.png", sortOrder: 6 },
  { title: "Stüdyomuz", category: "studyo", imagePath: "/gallery/salon-interior.png", sortOrder: 7 },
]

// ─── Misafir değerlendirmeleri ───────────────────────────────────────────────
const REVIEWS = [
  // Onaylı (açılış sayfasında görünür)
  { authorName: "Elif Yılmaz", rating: 5, comment: "Jel tırnaklar harika oldu, çok özenli bir işçilik! Stüdyo çok temiz ve şık. Kendimi gerçekten bir melek gibi hissettim.", status: "onaylandi", daysAgo: 3, service: "Jel Uzatma" },
  { authorName: "Sara Meier", rating: 5, comment: "Fransız manikürü kusursuzdu. Melek Hanım çok ilgili ve sabırlı. Kesinlikle tavsiye ederim!", status: "onaylandi", daysAgo: 6, service: "Fransız Manikür" },
  { authorName: "Ayşe Kaya", rating: 5, comment: "Volume kirpiklerim çok doğal ve şık duruyor. Randevu almak online çok kolaydı, telefonla hiç uğraşmadım.", status: "onaylandi", daysAgo: 9, service: "Volume Kirpik Uzatma" },
  { authorName: "Nikole Brunner", rating: 4, comment: "Kaş şekillendirme çok iyi. Küçük bir bekleme oldu ama sonuç buna değer. Tekrar geleceğim.", status: "onaylandi", daysAgo: 12, service: "Kaş Şekillendirme" },
  { authorName: "Fatma Demir", rating: 5, comment: "Delüks pedikür bir masaj gibi! Rahatlama stüdyosu tam anlamıyla. Herkese tavsiye ederim.", status: "onaylandi", daysAgo: 15, service: "Delüks Pedikür" },
  { authorName: "Lena Weber", rating: 5, comment: "Doğum günüm için kalp desenli tırnak tasarımı yaptırdım — herkes nerede yaptırdığımı sordu!", status: "onaylandi", daysAgo: 18, service: "Özel Tırnak Tasarımı" },
  { authorName: "Melani Keller", rating: 4, comment: "Cilt bakımı çok Profesyoneldi, cildim günlerce parladı. Fiyat performans mükemmel.", status: "onaylandi", daysAgo: 22, service: "Delüks Cilt Bakımı" },
  // İncelemede (ekip onayı bekliyor)
  { authorName: "Zeynep Arslan", rating: 5, comment: "Jel dolgu yaptırdım, tırnaklarım çok sağlıklı. Çok memnun kaldım, teşekkürler Melek'çe!", status: "bekliyor", daysAgo: 0, service: "Dolgu (Refil)" },
  { authorName: "Deniz Yıldız", rating: 4, comment: "Kına kaş uygulamasi çok doğal durdu. Salon atmosferi çok sıcakkanlı.", status: "bekliyor", daysAgo: 1, service: "Kına Kaş" },
]

async function main() {
  console.log("Seed: Melek'çe Güzellik Suite V2 (Türkçe) …")

  // Hizmetler
  for (const s of SERVICES) {
    await db.service.upsert({ where: { id: `svc_${s.sortOrder}` }, update: { ...s }, create: { id: `svc_${s.sortOrder}`, ...s } })
  }

  // Müşteriler
  for (let i = 0; i < CUSTOMERS.length; i++) {
    const c = CUSTOMERS[i]
    await db.salonCustomer.upsert({ where: { phone: c.phone }, update: {}, create: { id: `cus_${i + 1}`, ...c } })
  }

  // Galeri
  if ((await db.galleryItem.count()) === 0) {
    for (const g of GALLERY) {
      await db.galleryItem.create({ data: g })
    }
  }

  // Değerlendirmeler
  if ((await db.review.count()) === 0) {
    const svc = await db.service.findMany()
    const byName = (n: string) => svc.find((s) => s.name === n)
    for (const r of REVIEWS) {
      const d = new Date()
      d.setDate(d.getDate() - r.daysAgo)
      await db.review.create({
        data: {
          authorName: r.authorName,
          rating: r.rating,
          comment: r.comment,
          status: r.status,
          serviceId: byName(r.service)?.id ?? null,
          createdAt: d,
        },
      })
    }
  }

  // Randevular: geçmiş + bugün + sonraki 2 hafta gerçekçi dağıtımla
  if ((await db.booking.count()) === 0) {
    const svc = await db.service.findMany()
    const cus = await db.salonCustomer.findMany()
    const bySvc = (n: string) => svc.find((s) => s.name === n)!
    const byPhone = (p: string) => cus.find((c) => c.phone === p)!

    const day = (offset: number, hour: number, min = 0) => {
      const d = new Date()
      d.setDate(d.getDate() + offset)
      d.setHours(hour, min, 0, 0)
      return d
    }

    // Geçmiş (tamamlanmış)
    const past: Array<[number, number, number, string, string, string | null]> = [
      [-14, 10, 0, "+41 79 234 56 78", "Jel Uzatma", "Altın parıltı vurgular"],
      [-12, 14, 30, "+41 76 123 45 67", "Fransız Manikür", null],
      [-10, 9, 0, "+41 78 987 65 43", "Volume Kirpik Uzatma", "2D etki"],
      [-7, 11, 0, "+41 76 444 88 99", "Kaş Şekillendirme", null],
      [-5, 15, 0, "+41 79 111 22 33", "Delüks Pedikür", "peeling ile"],
      [-3, 13, 0, "+41 78 222 33 44", "Dolgu (Refil)", "kısa şekil"],
    ]
    for (const [off, h, m, phone, svcName, notes] of past) {
      const s = bySvc(svcName)
      await db.booking.create({
        data: {
          customerId: byPhone(phone).id, serviceId: s.id,
          startAt: day(off, h, m), durationMin: s.durationMin, priceChf: s.priceChf,
          status: "tamamlandi", notes,
        },
      })
    }

    // Bugün
    await db.booking.create({ data: { customerId: byPhone("+41 79 234 56 78").id, serviceId: bySvc("Kalıcı Oje (Shellac)").id, startAt: day(0, 10, 0), durationMin: 45, priceChf: 50, status: "onaylandi", notes: "Nude + altın taşlar" } })
    await db.booking.create({ data: { customerId: byPhone("+41 76 123 45 67").id, serviceId: bySvc("Jel Manikür").id, startAt: day(0, 14, 0), durationMin: 75, priceChf: 65, status: "onaylandi", notes: null } })

    // Talepler (bekliyor)
    await db.booking.create({ data: { customerId: byPhone("+41 79 666 77 88").id, serviceId: bySvc("Kirpik Uzatma 1:1").id, startAt: day(1, 9, 30), durationMin: 90, priceChf: 120, status: "bekliyor", notes: "İlk uzatma — danışma istiyorum" } })
    await db.booking.create({ data: { customerId: byPhone("+41 77 555 12 34").id, serviceId: bySvc("Özel Tırnak Tasarımı").id, startAt: day(2, 16, 0), durationMin: 45, priceChf: 40, status: "bekliyor", notes: "Doğum günü için kalp deseni" } })

    // Gelecek hafta
    await db.booking.create({ data: { customerId: byPhone("+41 78 987 65 43").id, serviceId: bySvc("Kirpik Dolgusu").id, startAt: day(3, 10, 0), durationMin: 60, priceChf: 70, status: "onaylandi", notes: null } })
    await db.booking.create({ data: { customerId: byPhone("+41 79 111 22 33").id, serviceId: bySvc("Delüks Cilt Bakımı").id, startAt: day(4, 11, 0), durationMin: 60, priceChf: 90, status: "onaylandi", notes: "Hassas cilt" } })
    await db.booking.create({ data: { customerId: byPhone("+41 76 444 88 99").id, serviceId: bySvc("Kaş & Kirpik Boyama").id, startAt: day(5, 9, 0), durationMin: 30, priceChf: 35, status: "onaylandi", notes: null } })
    await db.booking.create({ data: { customerId: byPhone("+41 78 222 33 44").id, serviceId: bySvc("Jel Uzatma").id, startAt: day(6, 14, 0), durationMin: 120, priceChf: 110, status: "bekliyor", notes: "Badem şekli" } })
    await db.booking.create({ data: { customerId: byPhone("+41 79 234 56 78").id, serviceId: bySvc("Özel Tırnak Tasarımı").id, startAt: day(8, 15, 30), durationMin: 45, priceChf: 40, status: "onaylandi", notes: "Altın parıltı" } })
    await db.booking.create({ data: { customerId: byPhone("+41 76 123 45 67").id, serviceId: bySvc("Dolgu (Refil)").id, startAt: day(9, 13, 0), durationMin: 90, priceChf: 85, status: "onaylandi", notes: null } })
    await db.booking.create({ data: { customerId: byPhone("+41 79 666 77 88").id, serviceId: bySvc("Lash Lift + Boyama").id, startAt: day(10, 10, 30), durationMin: 45, priceChf: 75, status: "bekliyor", notes: null } })
    await db.booking.create({ data: { customerId: byPhone("+41 77 555 12 34").id, serviceId: bySvc("Klasik Manikür").id, startAt: day(11, 16, 30), durationMin: 40, priceChf: 35, status: "onaylandi", notes: null } })

    // İptal (örnek)
    await db.booking.create({ data: { customerId: byPhone("+41 78 222 33 44").id, serviceId: bySvc("Delüks Pedikür").id, startAt: day(-1, 15, 0), durationMin: 60, priceChf: 70, status: "iptal", notes: "Hastalık — ertelendi" } })
  }

  console.log(
    `Seed OK: ${(await db.service.count())} hizmet, ${(await db.salonCustomer.count())} müşteri, ` +
    `${(await db.booking.count())} randevu, ${(await db.review.count())} değerlendirme, ${(await db.galleryItem.count())} galeri görseli`,
  )
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
