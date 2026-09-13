# TEMPLATE-GUIDE — Bu suite'i diğer projeler için kullanmak

**Melek'çe Güzellik Suite bilinçli olarak yeniden kullanılabilir bir şablon
olarak kuruldu: Yeni proje = 2 dosya ayarla + veritabanını yeniden doldur.
Bitti.**

Kardeş suite (AutoFaszination Performance & B2B Sales Suite) aynı yapı planıyla
tamamen farklı bir sektörde çalışıyor — mimarinin sektörden bağımsız
çalıştığının kanıtı.

---

## 1. White-Label ilkesi

| Katman | Nerede | Ne yapılır |
|---|---|---|
| **İçerik & Marka** | `src/config/branding.ts` | Marka adı, slogan, stüdyo bilgileri, hava durumu şehri, açılış metinleri, çalışma saatleri, ekip girişleri, modüller (aç/kapat) — **tek dosya** |
| **Vurgu rengi** | `src/app/globals.css` → `:root { --brand: … }` | Altın → dilediğiniz renk. Butonlar, grafikler, rozetler, parlama efektleri otomatik uyum sağlar |
| **Veriler** | `scripts/seed-beauty.ts` + `bun run scripts/seed-beauty.ts` | Hizmetleri/fiyatları kendi işletmenize göre değiştirin, yeniden seed edin |
| **Görseller** | `public/gallery/` | Kendi fotoğraflarınızı koyun (aynı dosya adlarıyla değiştirin ya da seed'de yolları güncelleyin) |

## 2. 15 dakikalık yeniden markalama (örnek: «Esra'ca Saç Stüdyosu»)

```bash
# 1) branding.ts'i aç ve şunları değiştir:
#    brand.nameParts:      ["Esra'ca", "Saç Stüdyosu"]
#    brand.tagline:        "Saç Tasarım & Bakım Stüdyosu"
#    company.*:            gerçek adres / telefon / Instagram
#    weather.cityName + koordinatlar:  şehrin
#    openingHours:         kendi çalışma saatlerin
#    users:                kendi ekip girişlerin (güvenlik!)
#    landing.*:            Hero başlığı, açıklama, istatistikler

# 2) Vurgu rengi (örnek: gül kırmızısı):
#    globals.css → --brand: oklch(0.62 0.19 15)

# 3) Hizmetleri değiştir (seed-beauty.ts → SERVICES) ve yeniden yükle:
rm -f db/custom.db && bun run db:push && bun run scripts/seed-beauty.ts

# 4) Fotoğrafları public/gallery/ klasörüne kopyala → bitti
```

## 3. Veri modeli (Prisma / SQLite)

| Model | Alanlar | Not |
|---|---|---|
| `Service` | name, category, description, durationMin, priceChf, popular, active, sortOrder | Kategoriler: `tirnak` / `guzellik` / `kirpik` (etiketler `src/lib/salon.ts → CATEGORY_META` içinde) |
| `SalonCustomer` | name, **phone (benzersiz)**, email?, notes | **Girişsiz randevu** için anahtar: telefon. İlk randevuda otomatik oluşur |
| `Booking` | customerId, serviceId, startAt, durationMin, priceChf, status, notes | Durum zinciri: `bekliyor → onaylandi → tamamlandi` / `iptal`. Süre ve fiyat hizmetten anlık görüntü olarak kopyalanır |
| `Review` | authorName, rating (1–5), comment, serviceId?, status | Durum: `bekliyor → onaylandi / reddedildi` — herkese açık, moderasyonlu |
| `GalleryItem` | title, category, imagePath, sortOrder, active | Açılış sayfası galerisi |

## 4. API yüzeyi (değiştirmeden kullanılabilir)

- `GET /api/v1/salon/services` — aktif hizmetler
- `GET /api/v1/salon/availability?date=YYYY-MM-DD` — günün dolu blokları (müşteri verisi yok)
- `GET|POST|PATCH /api/v1/salon/bookings` — telefonla sorgulama · **herkes** randevu oluşturma · durum / self-iptal
- `GET|POST|PATCH|DELETE /api/v1/salon/reviews` — onaylılar + özet · yorum yazma · moderasyon
- `GET /api/v1/weather` — canlı hava durumu (Open-Meteo, Türkçe, 10 dk önbellek)
- `GET /api/v1/salon/customers` · `/stats` · `/gallery` — CRM, KPI'lar, galeri

## 5. V2.1 eklentileri

| Özellik | Nerede | Not |
|---|---|---|
| İnteraktif harita | `branding.ts → map` + `components/public/location-map.tsx` | Koyu CARTO karoları (anahtarsız), altın divIcon-iğne; koordinat/yakınlaştırma ayarlanabilir |
| Konfeti kutlaması | `components/public/booking-flow.tsx` (canvas-confetti) | Altın tonları; yalnızca başarı ekranında bir kez |
| WhatsApp bildirimleri | `src/lib/notify.ts` + bookings API | wa.me derin bağlantısı (önceden doldurulmuş Türkçe mesaj); gerçek SMS için Twilio/Meta Cloud API kancası hazır |
| Hız sınırlama | `src/lib/rate-limit.ts` | Bellek-içi kayan pencere: randevu 5/10dk, yorum 3/10dk, işlemler 30/dk — 429 + Türkçe mesaj; çoklu sunucuda Redis'e taşının |
| Hava durumu bakım ipuçları | `api/v1/weather/route.ts → careTipFor()` | WMO kodu + sıcaklık + neme göre Türkçe tırnak/cilt bakım önerisi |
| Fiyat yönetimi | `PATCH /api/v1/salon/services` + hizmetler görünümü | Satır içi fiyat/süre düzenleme, popüler rozet anahtarı (0–100.000 aralık kontrolü) |
| Yorum filtreleri | `components/public/reviews-page.tsx` | Yıldız (1–5) + hizmet filtresi, istemci tarafı |

## 6. Bilinmesi gerekenler

- **Ekip girişleri** demo amaçlı `branding.ts → users` içinde. Gerçek kullanım
  için NextAuth/Auth.js bağlayın (giriş katmanı `src/components/auth/` içinde
  tek dosyadır).
- **Hava durumu** Open-Meteo ile anahtarsız çalışır; `branding.ts → weather`
  içinde şehir, koordinat ve saat dilimi ayarlanır (`enabled: false` ile tamamen
  kapatılabilir).
- **Randevu aralıkları** çalışma saatlerinden üretilir (30 dakikalık adımlar);
  `branding.ts → openingHours` değişince otomatik uyar.
- **Mobil alt gezinme** (Ana Sayfa / Randevu / Yorumlar) `app-shell.tsx`
  içindeki `PUBLIC_NAV` listesinden gelir; herkese açık görünümler
  `landing | randevu | yorumlar` hash'leriyle derin bağlanabilir
  (örn. `site.com/#randevu`).
- **Ekip modülleri** `branding.ts → modules` içinde `enabled` bayrağıyla
  açılıp kapanır; yeni modül = yeni görünüm dosyası + `module-registry.ts`
  kaydı.
- **Hız sınırlama** bellek-içidir; Vercel/Lambda gibi geçici örneklerde Redis'e taşınmalıdır.
- SQLite dosyası `db/custom.db`; üretimde (Vercel vb.) düzenli yedekleyin veya
  Postgres'e geçin (Prisma ile kolay taşınır).
