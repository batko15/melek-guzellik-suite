# Melek'çe Güzellik — Tırnak Sanatı & Güzellik Stüdyosu Suite V2.0.0

**Herkese açık web sitesi + giriş gerektirmeyen randevu ve değerlendirme + ekip yönetimi — tek uygulamada, TAMAMEN TÜRKÇE.**

**White-Label şablonu** olarak geliştirildi: Tek bir yapılandırma dosyasıyla
aynı suite herhangi başka bir stüdyo / işletme için yeniden markalanabilir
(bkz. `TEMPLATE-GUIDE.md`).

| Alan | İşlev |
|---|---|
| 🌐 **Herkese Açık Web Sitesi** | Hero + **canlı hava durumu (Open-Meteo)**, hizmetler & fiyatlar, galeri, **misafir değerlendirmeleri (yıldızlı)**, hakkımızda, çalışma saatleri, iletişim — giriş olmadan herkes görebilir |
| 📅 **Randevu Al (Girişsiz!)** | 3 adımlı online randevu: Hizmet → Tarih & Saat (30 dk'lık aralıklar, dolu/geçmiş saatler kilitli) → Ad + Telefon. **Herkes randevu alabilir — üyelik yok, giriş yok** |
| 📋 **Randevularım** | Telefon numarasıyla randevularını görüntüleme ve iptal etme — giriş gerekmez |
| ⭐ **Yorumlar (Girişsiz!)** | Herkes yıldızlı değerlendirme yazabilir (1–5 yıldız + yorum + isteğe bağlı hizmet). Yayın öncesi ekip moderasyonu |
| 👑 **Ekip Portalı (8 Modül)** | Genel Bakış (KPI'lar + **hava durumu** + değerlendirme özeti), Takvim (2 hafta), Randevu Yönetimi, **Yorum Moderasyonu (onayla/reddet/sil)**, Müşteri CRM, Hizmetler & Fiyatlar, Galeri, Ayarlar |

**Tasarım:** «Black Gold Luxury» — derin siyah, şampanya altını, zarif serif
başlıklar (Noto Serif SC) + Inter. Tüm yazı tipleri yerel olarak paketlenmiştir
(çevrimdışı çalışır). **Mobil:** sabit alt gezinme çubuğu ile uygulama hissi —
telefon ve bilgisayar için ayrı ayrı optimize.

**Demo girişleri:**

| Alan | Erişim |
|---|---|
| Randevu / Değerlendirme | **Giriş gerekmez** — ad + telefon yeterli |
| Ekip Portalı | `melek` / `melek123` (İşletme Sahibi) veya `admin` / `admin123` |
| Randevularım (demo) | Telefon: `+41 79 111 22 33` |

---

## 1. Paket içeriği

```
melek-guzellik-suite/
├── src/
│   ├── app/                      # Next.js App Router (açılış rotası, API'ler)
│   │   ├── page.tsx              # Giriş noktası → AppShell
│   │   ├── layout.tsx            # Meta veriler (branding.ts'den üretilir)
│   │   ├── globals.css           # Black-Gold tasarım sistemi (--brand Token!)
│   │   └── api/v1/
│   │       ├── salon/            # REST: services, bookings, reviews, customers, stats, gallery, availability
│   │       └── weather/          # Canlı hava durumu (Open-Meteo, Türkçe, 10 dk önbellek)
│   ├── components/
│   │   ├── landing/              # Herkese açık web sitesi (hava durumu + yorumlar dahil)
│   │   ├── public/               # Randevu akışı (3 adım) + Değerlendirme sayfası
│   │   ├── auth/                 # Ekip girişi
│   │   ├── staff/                # Ekip portalı (8 modül, Türkçe)
│   │   ├── weather-widget.tsx    # Canlı hava durumu bileşeni
│   │   └── ui/                   # shadcn/ui bileşenleri
│   ├── config/branding.ts        # ★ YENİDEN MARKALAMA İÇİN TEK DOSYA
│   └── lib/                      # Salon tipleri, biçimlendiriciler, modül kaydı, DB
├── prisma/schema.prisma          # SQLite veri modeli (Service, SalonCustomer, Booking, Review, GalleryItem)
├── scripts/seed-beauty.ts        # Türkçe demo veriler: 17 hizmet, 8 müşteri, 19 randevu, 9 değerlendirme, galeri
├── public/gallery/               # Stüdyo görselleri (açılış sayfası galerisi)
└── public/fonts/                 # Inter + Noto Serif SC (yerel, çevrimdışı)
```

## 2. Kurulum (2 dakika)

Gereksinimler: Node.js 20+ (veya Bun).

```bash
# 1) Paketleri kur
bun install        # veya: npm install

# 2) .env dosyası oluştur
cp .env.example .env
# → DATABASE_URL="file:./db/custom.db" (klasör otomatik oluşur)

# 3) Veritabanını oluştur ve demo verileri yükle
bun run db:push
bun run scripts/seed-beauty.ts

# 4) Başlat
bun run dev        # → http://localhost:3000
```

## 3. V2'de yeni ne var?

| Sürüm | Yenilikler |
|---|---|
| **2.0.0** | • **Tamamı Türkçe** (arayüz, veriler, API hataları) • **Girişsiz randevu**: herkes ad + telefonla randevu alır • **Herkese açık değerlendirmeler**: 1–5 yıldız + yorum, moderasyonlu • **Canlı hava durumu**: Open-Meteo, Türkçe açıklamalar, 4 günlük tahmin • **Randevularım**: telefonla sorgulama + self-servis iptal • **Mobil alt gezinme** (Ana Sayfa / Randevu / Yorumlar) — telefon için uygulama hissi • Ekip portalı 8 modüle çıktı (+ Yorum Moderasyonu) • Yeni API'ler: `reviews`, `weather`, `availability` • Türkçe demo verileri (9 değerlendirme dahil) |
| 1.0.0 | Açılış sayfası + müşteri portalı (e-posta girişli) + 7 modüllü ekip portalı, Black-Gold tasarım |

## 4. API'ye hızlı bakış

| Uç nokta | Yöntem | Açıklama |
|---|---|---|
| `/api/v1/salon/services` | GET | Aktif hizmetler (açılış sayfası + randevu akışı) |
| `/api/v1/salon/availability?date=` | GET | Bir günün dolu randevu blokları (müşteri verisi YOK — gizlilik güvenli) |
| `/api/v1/salon/bookings` | GET/POST/PATCH | Randevular: telefonla sorgulama · **herkes** randevu oluşturma (ad+telefon) · durum değiştirme / self-iptal |
| `/api/v1/salon/reviews` | GET/POST/PATCH/DELETE | Değerlendirmeler: onaylılar + özet · **herkes** yorum yazma · moderasyon · silme |
| `/api/v1/weather` | GET | Canlı hava durumu (Open-Meteo, Türkçe WMO açıklamaları, 10 dk önbellek) |
| `/api/v1/salon/customers` | GET | Müşteri CRM (ziyaret, ciro, yaklaşan) |
| `/api/v1/salon/stats` | GET | KPI'lar + **değerlendirme istatistikleri** |
| `/api/v1/salon/gallery` | GET | Açılış sayfası galerisi |

## 5. Yeniden markalama (başka bir proje için)

1. `src/config/branding.ts` dosyasını açın — **tek dosya**: marka, slogan, stüdyo
   bilgileri, hava durumu şehri, açılış metinleri, çalışma saatleri, ekip
   girişleri, modüller (aç/kapat).
2. `src/app/globals.css` içinde `--brand` değerini istediğiniz vurgu rengine
   değiştirin (altın → istediğiniz renk; tüm butonlar/grafikler/rozetler otomatik uyum sağlar).
3. `scripts/seed-beauty.ts` içindeki hizmetleri kendi hizmetlerinizle değiştirip yeniden seed edin.
4. `public/gallery/` klasörüne kendi fotoğraflarınızı koyun.

Ayrıntılı adım adım rehber: `TEMPLATE-GUIDE.md`.

## 6. Üretimde kullanım (Vercel vb.)

```bash
bun run build && bun run start   # veya Vercel'e deploy edin
```

Notlar:
- Ekip girişleri demo amaçlıdır (`branding.ts → users`). Gerçek kullanım için
  NextAuth/Auth.js'e bağlayın.
- Hava durumu Open-Meteo üzerinden anahtarsız ve ücretsiz çalışır
  (`branding.ts → weather` ile şehir/koordinat ayarlanır).
- SQLite yerel dosyadır; Vercel gibi geçici dosya sistemlerinde düzenli
  yedekleyin veya Postgres'e geçin (Prisma şeması kolayca taşınır).
