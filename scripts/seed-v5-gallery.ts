// V5: Galeriye 6 yeni Instagram fotoğrafı ekle (idempotent — mevcut verileri korur)
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const NEW_ITEMS = [
  { title: 'Yarı Jel & Tips French', category: 'tirnak', imagePath: '/gallery/real/yari-jel-tips-french.jpg', sortOrder: 17 },
  { title: 'Pembe Pırıltı Jel', category: 'tirnak', imagePath: '/gallery/real/jel-guclendirme-pembe-pirilti.jpg', sortOrder: 18 },
  { title: '24K Altın Folyo', category: 'tirnak', imagePath: '/gallery/real/turuncu-pembe-altin-folyo.jpg', sortOrder: 19 },
  { title: 'Deniz Kabuğu French', category: 'tirnak', imagePath: '/gallery/real/yeni-nesil-protez-deniz-kabugu.jpg', sortOrder: 20 },
  { title: 'İnci Tozu Sarısı', category: 'tirnak', imagePath: '/gallery/real/tereyagi-sarisi-inci-tozu.jpg', sortOrder: 21 },
  { title: 'Nar Çiçeği Nail Art', category: 'tirnak', imagePath: '/gallery/real/nar-cicegi-deniz-yildizi.jpg', sortOrder: 22 },
]

async function main() {
  for (const item of NEW_ITEMS) {
    const existing = await db.galleryItem.findFirst({ where: { imagePath: item.imagePath } })
    if (existing) {
      console.log(`✓ mevcut: ${item.title}`)
      continue
    }
    await db.galleryItem.create({ data: item })
    console.log(`+ eklendi: ${item.title}`)
  }
  const total = await db.galleryItem.count()
  console.log(`\nGaleri toplam: ${total} öğe`)
}

main().finally(() => db.$disconnect())
