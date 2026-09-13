// Melek'çe Güzellik Suite V3 — Türkçe demo verileri
// Hizmetler (₺ fiyatlarla), müşteriler (telefon anahtarlı), randevular (2 hafta),
// misafir değerlendirmeleri (onaylı + incelemede) + galeri
// V3: randevu fiyatları HİZMETTEN otomatik kopyalanır (₺ tutarlılığı),
//     no-show (gelmedi) örnekleri, iç personel notu + bildirim günlüğü

import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

// ─── Hizmetler ───────────────────────────────────────────────────────────────
const SERVICES = [
  // Tırnak
  { name: "Jel Manikür", category: "tirnak", description: "İstediğiniz renkte yüksek kaliteli jel cila ile temel bakım", durationMin: 75, priceChf: 600, popular: true, sortOrder: 1 },
  { name: "Jel Uzatma", category: "tirnak", description: "İstenen şekil ve boyda jel ile uzatma", durationMin: 120, priceChf: 1200, popular: true, sortOrder: 2 },
  { name: "Dolgu (Refil)", category: "tirnak", description: "Yeni çıkan tırnakların dolgusu ve yeniden mühürleme", durationMin: 90, priceChf: 900, sortOrder: 3 },
  { name: "Özel Tırnak Tasarımı", category: "tirnak", description: "Folyo, taş ve parıltı ile kişiye özel tasarım", durationMin: 45, priceChf: 450, sortOrder: 4 },
  { name: "Fransız Manikür", category: "tirnak", description: "Kusursuz beyaz uçlu klasik", durationMin: 30, priceChf: 350, sortOrder: 5 },
  { name: "Kalıcı Oje (Shellac)", category: "tirnak", description: "4 haftaya kadar süren parlak renk", durationMin: 45, priceChf: 500, popular: true, sortOrder: 6 },
  { name: "Klasik Manikür", category: "tirnak", description: "Kütikül bakımı, törpüleme, istediğiniz cila", durationMin: 40, priceChf: 400, sortOrder: 7 },
  { name: "Delüks Pedikür", category: "tirnak", description: "Peeling ve masajlı şımartan ayak bakımı", durationMin: 60, priceChf: 700, sortOrder: 8 },

  // Güzellik
  { name: "Kaş Şekillendirme", category: "guzellik", description: "Kusursuz kaşlar için hassas alma ve şekillendirme", durationMin: 20, priceChf: 250, popular: true, sortOrder: 10 },
  { name: "Kaş & Kirpik Boyama", category: "guzellik", description: "Etkileyici bakışlar için nazik boya", durationMin: 30, priceChf: 350, sortOrder: 11 },
  { name: "Delüks Cilt Bakımı", category: "guzellik", description: "Temizlik, peeling, maske ve bakım masajı", durationMin: 60, priceChf: 900, popular: true, sortOrder: 12 },
  { name: "İp ile Kaş Alma", category: "guzellik", description: "Geleneksel, özellikle nazik tüy alma yöntemi", durationMin: 20, priceChf: 300, sortOrder: 13 },
  { name: "Kına Kaş", category: "guzellik", description: "Daha dolgun kaşlar için doğal kına boyası", durationMin: 40, priceChf: 400, sortOrder: 14 },

  // Kirpik
  { name: "Kirpik Uzatma 1:1", category: "kirpik", description: "Her kirpiğe bir kılla klasik uzatma", durationMin: 90, priceChf: 1250, popular: true, sortOrder: 20 },
  { name: "Volume Kirpik Uzatma", category: "kirpik", description: "Maksimum etki için Rus volume tekniği", durationMin: 120, priceChf: 1500, sortOrder: 21 },
  { name: "Kirpik Dolgusu", category: "kirpik", description: "2–3 hafta sonra dolgu uygulaması", durationMin: 60, priceChf: 750, sortOrder: 22 },
  { name: "Lash Lift + Boyama", category: "kirpik", description: "Doğal kirpikler kusursuz kıvrımla", durationMin: 45, priceChf: 800, sortOrder: 23 },
]

// ─── Müşteriler (telefon = benzersiz anahtar) ────────────────────────────────
const CUSTOMERS = [
  { name: "Elif Yılmaz", phone: "+90 532 111 22 33", email: "elif.yilmaz@ornek.com.tr", notes: "Altın parıltı tasarımları seviyor, akrilat alerjisi → jel kullan" },
  { name: "Sara Meier", phone: "+90 533 222 33 44", email: "sarah.meier@ornek.com.tr", notes: "Fransız manikürü tercih ediyor, 3 haftada bir geliyor" },
  { name: "Ayşe Kaya", phone: "+90 534 333 44 55", email: "ayse.kaya@ornek.com.tr", notes: "Volume kirpik sadık müşterisi" },
  { name: "Lena Weber", phone: "+90 535 444 55 66", email: "lena.weber@ornek.com.tr", notes: null },
  { name: "Fatma Demir", phone: "+90 536 555 66 77", email: "fatma.demir@ornek.com.tr", notes: "Her zaman cumartesi sabahı" },
  { name: "Nikole Brunner", phone: "+90 537 666 77 88", email: "nicole.brunner@ornek.com.tr", notes: "Düzenli kaş şekillendirme + boyama" },
  { name: "Zeynep Arslan", phone: "+90 538 777 88 99", email: "zeynep.arslan@ornek.com.tr", notes: "Tırnak yiyen → kısa şekiller" },
  { name: "Melani Keller", phone: "+90 539 888 99 00", email: "melanie.keller@ornek.com.tr", notes: null },
]

// ─── Galeri ──────────────────────────────────────────────────────────────────
// Gerçek stüdyo fotoğrafları (melek.zip + Instagram) + hero görseli
const GALLERY = [
  { title: "Bordo Kedi Gözü", category: "tirnak", imagePath: "/gallery/real/bordo-kedi-gozu.jpg", sortOrder: 1 },
  { title: "Bordo Ombre", category: "tirnak", imagePath: "/gallery/real/bordo-ombre.jpg", sortOrder: 2 },
  { title: "Pudra Pembe-Bordo", category: "tirnak", imagePath: "/gallery/real/pembe-bordo-isiltili.jpg", sortOrder: 3 },
  { title: "Kirpik Uzatma", category: "kirpik", imagePath: "/gallery/real/kirpik-uzatma.jpg", sortOrder: 4 },
  { title: "Kirpik Bakımı", category: "kirpik", imagePath: "/gallery/real/kirpik-bakim.jpg", sortOrder: 5 },
  { title: "Kaş Tasarımı", category: "guzellik", imagePath: "/gallery/real/kas-tasarimi.jpg", sortOrder: 6 },
  { title: "Özel Gün Dekoru", category: "tirnak", imagePath: "/gallery/real/ozel-gun-takimi.jpg", sortOrder: 7 },
  { title: "Marka Kimliğimiz", category: "studyo", imagePath: "/gallery/real/marka.jpg", sortOrder: 8 },
  { title: "Şampanya Altını", category: "tirnak", imagePath: "/gallery/hero.png", sortOrder: 9 },
  { title: "Stüdyomuz", category: "studyo", imagePath: "/gallery/salon-interior.png", sortOrder: 10 },
  { title: "Kirpik & Kaş Bakımı", category: "kirpik", imagePath: "/gallery/real/kirpik-kas-bakim.jpg", sortOrder: 11 },
  { title: "Zarif Kirpikler", category: "kirpik", imagePath: "/gallery/real/kirpik-zarif.jpg", sortOrder: 12 },
  { title: "Göz Makyajı", category: "guzellik", imagePath: "/gallery/real/goz-makyaj.jpg", sortOrder: 13 },
  { title: "Bordo Parlak", category: "tirnak", imagePath: "/gallery/real/bordo-parlak.jpg", sortOrder: 14 },
  { title: "Bordo Klasik", category: "tirnak", imagePath: "/gallery/real/bordo-klasik.jpg", sortOrder: 15 },
  { title: "Bordo Nail Art", category: "tirnak", imagePath: "/gallery/real/bordo-nailart.jpg", sortOrder: 16 },
  { title: "Yarı Jel & Tips French", category: "tirnak", imagePath: "/gallery/real/yari-jel-tips-french.jpg", sortOrder: 17 },
  { title: "Pembe Pırıltı Jel", category: "tirnak", imagePath: "/gallery/real/jel-guclendirme-pembe-pirilti.jpg", sortOrder: 18 },
  { title: "24K Altın Folyo", category: "tirnak", imagePath: "/gallery/real/turuncu-pembe-altin-folyo.jpg", sortOrder: 19 },
  { title: "Deniz Kabuğu French", category: "tirnak", imagePath: "/gallery/real/yeni-nesil-protez-deniz-kabugu.jpg", sortOrder: 20 },
  { title: "İnci Tozu Sarısı", category: "tirnak", imagePath: "/gallery/real/tereyagi-sarisi-inci-tozu.jpg", sortOrder: 21 },
  { title: "Nar Çiçeği Nail Art", category: "tirnak", imagePath: "/gallery/real/nar-cicegi-deniz-yildizi.jpg", sortOrder: 22 },
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
      [-14, 10, 0, "+90 532 111 22 33", "Jel Uzatma", "Altın parıltı vurgular"],
      [-12, 14, 30, "+90 533 222 33 44", "Fransız Manikür", null],
      [-10, 9, 0, "+90 534 333 44 55", "Volume Kirpik Uzatma", "2D etki"],
      [-7, 11, 0, "+90 537 666 77 88", "Kaş Şekillendirme", null],
      [-5, 15, 0, "+90 536 555 66 77", "Delüks Pedikür", "peeling ile"],
      [-3, 13, 0, "+90 538 777 88 99", "Dolgu (Refil)", "kısa şekil"],
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
    await db.booking.create({ data: { customerId: byPhone("+90 532 111 22 33").id, serviceId: bySvc("Kalıcı Oje (Shellac)").id, startAt: day(0, 10, 0), durationMin: 45, priceChf: bySvc("Kalıcı Oje (Shellac)").priceChf, status: "onaylandi", notes: "Nude + altın taşlar", staffNote: "Sıkı müşteri — 10 dk önce gelsin" } })
    await db.booking.create({ data: { customerId: byPhone("+90 533 222 33 44").id, serviceId: bySvc("Jel Manikür").id, startAt: day(0, 14, 0), durationMin: 75, priceChf: bySvc("Jel Manikür").priceChf, status: "onaylandi", notes: null } })

    // Talepler (bekliyor)
    await db.booking.create({ data: { customerId: byPhone("+90 539 888 99 00").id, serviceId: bySvc("Kirpik Uzatma 1:1").id, startAt: day(1, 9, 30), durationMin: 90, priceChf: bySvc("Kirpik Uzatma 1:1").priceChf, status: "bekliyor", notes: "İlk uzatma — danışma istiyorum" } })
    await db.booking.create({ data: { customerId: byPhone("+90 535 444 55 66").id, serviceId: bySvc("Özel Tırnak Tasarımı").id, startAt: day(2, 16, 0), durationMin: 45, priceChf: bySvc("Özel Tırnak Tasarımı").priceChf, status: "bekliyor", notes: "Doğum günü için kalp deseni" } })

    // Gelecek hafta
    await db.booking.create({ data: { customerId: byPhone("+90 534 333 44 55").id, serviceId: bySvc("Kirpik Dolgusu").id, startAt: day(3, 10, 0), durationMin: 60, priceChf: bySvc("Kirpik Dolgusu").priceChf, status: "onaylandi", notes: null } })
    await db.booking.create({ data: { customerId: byPhone("+90 536 555 66 77").id, serviceId: bySvc("Delüks Cilt Bakımı").id, startAt: day(4, 11, 0), durationMin: 60, priceChf: bySvc("Delüks Cilt Bakımı").priceChf, status: "onaylandi", notes: "Hassas cilt", staffNote: "Parfümsüz ürünler kullan" } })
    await db.booking.create({ data: { customerId: byPhone("+90 537 666 77 88").id, serviceId: bySvc("Kaş & Kirpik Boyama").id, startAt: day(5, 9, 0), durationMin: 30, priceChf: bySvc("Kaş & Kirpik Boyama").priceChf, status: "onaylandi", notes: null } })
    await db.booking.create({ data: { customerId: byPhone("+90 538 777 88 99").id, serviceId: bySvc("Jel Uzatma").id, startAt: day(6, 14, 0), durationMin: 120, priceChf: bySvc("Jel Uzatma").priceChf, status: "bekliyor", notes: "Badem şekli" } })
    await db.booking.create({ data: { customerId: byPhone("+90 532 111 22 33").id, serviceId: bySvc("Özel Tırnak Tasarımı").id, startAt: day(8, 15, 30), durationMin: 45, priceChf: bySvc("Özel Tırnak Tasarımı").priceChf, status: "onaylandi", notes: "Altın parıltı" } })
    await db.booking.create({ data: { customerId: byPhone("+90 533 222 33 44").id, serviceId: bySvc("Dolgu (Refil)").id, startAt: day(9, 13, 0), durationMin: 90, priceChf: bySvc("Dolgu (Refil)").priceChf, status: "onaylandi", notes: null } })
    await db.booking.create({ data: { customerId: byPhone("+90 539 888 99 00").id, serviceId: bySvc("Lash Lift + Boyama").id, startAt: day(10, 10, 30), durationMin: 45, priceChf: bySvc("Lash Lift + Boyama").priceChf, status: "bekliyor", notes: null } })
    await db.booking.create({ data: { customerId: byPhone("+90 535 444 55 66").id, serviceId: bySvc("Klasik Manikür").id, startAt: day(11, 16, 30), durationMin: 40, priceChf: bySvc("Klasik Manikür").priceChf, status: "onaylandi", notes: null } })

    // İptal (örnek)
    await db.booking.create({ data: { customerId: byPhone("+90 538 777 88 99").id, serviceId: bySvc("Delüks Pedikür").id, startAt: day(-1, 15, 0), durationMin: 60, priceChf: bySvc("Delüks Pedikür").priceChf, status: "iptal", notes: "Hastalık — ertelendi" } })

    // No-show (gelmedi) örnekleri — V3
    await db.booking.create({ data: { customerId: byPhone("+90 538 777 88 99").id, serviceId: bySvc("Klasik Manikür").id, startAt: day(-4, 11, 0), durationMin: 40, priceChf: bySvc("Klasik Manikür").priceChf, status: "gelmedi", notes: null, staffNote: "Arandı, ulaşılamadı — yeniden randevu planlanacak" } })
    await db.booking.create({ data: { customerId: byPhone("+90 536 555 66 77").id, serviceId: bySvc("Kaş Şekillendirme").id, startAt: day(-2, 14, 0), durationMin: 20, priceChf: bySvc("Kaş Şekillendirme").priceChf, status: "gelmedi", notes: null, staffNote: "Habersiz gelmedi" } })
  }

  // Bildirim günlüğü (örnek kayıtlar) — V3
  if ((await db.notificationLog.count()) === 0) {
    const confirmed = await db.booking.findFirst({ where: { status: "onaylandi" }, orderBy: { updatedAt: "desc" } })
    if (confirmed) {
      await db.notificationLog.create({
        data: {
          bookingId: confirmed.id,
          customer: "Elif Yılmaz",
          phone: "+90 532 111 22 33",
          channel: "whatsapp",
          kind: "onay",
          message: `✨ Melek'çe Güzellik — Randevunuz Onaylandı\n💅 Kalıcı Oje (Shellac)\n📅 Bugün 10:00\n\nSizi görmek için sabırsızlanıyoruz! 🌸`,
        },
      })
    }
  }

  console.log(
    `Seed OK: ${(await db.service.count())} hizmet, ${(await db.salonCustomer.count())} müşteri, ` +
    `${(await db.booking.count())} randevu, ${(await db.review.count())} değerlendirme, ${(await db.galleryItem.count())} galeri görseli, ${(await db.notificationLog.count())} bildirim kaydı`,
  )
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
