// ═══════════════════════════════════════════════════════════════════════════
//  WHITE-LABEL YAPILANDIRMASI — YENİ PROJELER İÇİN TEK DOSYA
// ═══════════════════════════════════════════════════════════════════════════
//  Bu yazılımı BAŞKA bir proje için mi kullanmak istiyorsunuz?
//  O zaman SADECE BURADAki içerikleri değiştirin — bitti.
//
//  Adım adım anlatım: proje kökündeki TEMPLATE-GUIDE.md dosyasına bakın.
//
//  Burada yapılandırılabilir olanlar:
//    • Marka        — isim (iki renkli), slogan, sürüm etiketi
//    • Stüdyo       — resmi isim, adres, telefon, Instagram, web
//    • Açılış Sayfası — Hero, Hakkımızda, Çalışma Saatleri, İletişim
//    • Hava Durumu  — şehir adı + koordinatlar (canlı hava durumu widget'ı)
//    • Portallar    — Misafir randevusu (girişsiz) & Ekip portalı
//    • Modüller     — Ekip modülleri açılıp kapatılabilir, adlar serbest
//    • Yerel Ayarlar — dil, para birimi
//
//  Vurgu rengi (altın → istediğiniz renk): src/app/globals.css içindeki
//  «--brand» değerini «:root» altında değiştirin (bkz. TEMPLATE-GUIDE.md).
// ═══════════════════════════════════════════════════════════════════════════

export interface BrandStat {
  value: string
  label: string
}

export interface BrandUser {
  username: string
  password: string
  name: string
  role: string
  initials: string
}

export interface ModuleConfig {
  id: string
  group: "genelBakis" | "isletme" | "kayitlar"
  label: string
  hint: string
  title: string
  subtitle: string
  icon: string
  enabled: boolean
}

export const BRANDING = {
  // ─── Sürüm (her yerde görünür şekilde işaretlenir) ───────────────────────
  version: "5.3.0",

  // ─── Marka ────────────────────────────────────────────────────────────────
  // nameParts: 1. kısım normal, 2. kısım altın (vurgu rengi) yazılır.
  brand: {
    nameParts: ["Melek'çe", "Güzellik"],
    tagline: "Tırnak Sanatı & Güzellik Stüdyosu",
    slogan: "Her kadın bir melek gibi güzeldir",
    icon: "sparkles" as "sparkles" | "heart" | "crown" | "flower",
    // Gerçek logo dosyaları (public/brand/) —NavigationBar, Hero, Footer, Favicon
    logoFull: "/brand/logo.jpg",       // Tam logo (kare, altın-siyah)
    logoWing: "/brand/logo-wing.jpg",  // Melek kanadı (navbar ikonu / favicon)
    logoText: "/brand/logo-text.jpg",  // MELEK'ÇE GÜZELLİK + NAIL ARTIST
    since: "2022",                     // Kuruluş yılı (logoda "Since 2022")
    ogImage: "/brand/logo.jpg",
  },

  // ─── Stüdyo / Resmi Bilgiler ──────────────────────────────────────────────
  company: {
    legalName: "Melek'çe Güzellik",
    street: "Hoca Hamza Mah. 1023. Sokak No: 2 (Villa Tunçaydın)",
    city: "17500 Gelibolu / Çanakkale",
    phone: "+90 542 633 15 70",
    whatsapp: "+90 542 633 15 70", // WhatsApp bildirimleri için numara (ülke koduyla)
    email: "", // Salon e-postası (boş = iletişim bölümünde görünmez) — örn. "randevu@melekce.com"
    instagram: "melekce_guzellik17",
    website: "Gelibolu · Çanakkale · Türkiye",
    footerClaim: "Tırnak Sanatı · Güzellik · Kirpik — 2022'den beri",
  },

  // ─── Konum & İnteraktif Harita (Leaflet, koyu CARTO karoları) ──────────
  map: {
    enabled: true,
    label: "Melek'çe Güzellik — Gelibolu",
    latitude: 40.430461,
    longitude: 26.690142,
    zoom: 17,
    googleMapsUrl: "https://www.google.com/maps/place/Villa+Tun%C3%A7ayd%C4%B1n,+Hoca+Hamza,+1023.+Sk+No:2,+17500+Gelibolu%2F%C3%87anakkale/data=!4m2!3m1!1s0x14b16500733c9467:0xee564cd8c1e2a587",
  },

  // ─── Canlı Hava Durumu (Open-Meteo, ücretsiz, anahtar gerekmez) ──────────
  weather: {
    enabled: true,
    cityName: "Gelibolu",
    latitude: 40.430461,
    longitude: 26.690142,
    timezone: "Europe/Istanbul",
  },

  // ─── Yerel Ayarlar ────────────────────────────────────────────────────────
  locale: {
    language: "tr-TR",
    currency: "TRY",
    currencySymbol: "₺",
  },

  // ─── Herkese Açık Açılış Sayfası ──────────────────────────────────────────
  landing: {
    heroTitle: "Işıldayan",
    heroTitleAccent: "güzellik.",
    heroDescription:
      "Bakım yapan tırnak sanatı, zarif güzellik uygulamaları ve etkileyici kirpikler — Melek'çe Güzellik'te her kadın bir melek gibi hisseder. Randevunuzu bugün online alın: üyelik yok, saniyeler içinde.",
    stats: [
      { value: "17+", label: "Uygulama" },
      { value: "1000+", label: "mutlu misafir" },
      { value: "5★", label: "misafir favorisi" },
    ] as BrandStat[],
    aboutTitle: "Rahatlama Stüdyonuz",
    aboutText:
      "Melek'çe Güzellik'te güzelliğiniz merkezdedir. Zarif bir atmosferde sizi yüksek kaliteli ürünler, hassas tırnak tasarımı ve nazik güzellik uygulamalarıyla ağırlıyoruz. Klasik manikürden iddialı tırnak sanatına veya kusursuz kirpiklere kadar — isteklerinize zaman ayırıyoruz.",
    ctaButton: "Randevu Al",
    ctaHint: "1 dakikada online — aramaya gerek yok",
    guestNote: "Giriş gerekmez — herkes randevu alabilir",
  },

  // ─── Çalışma Saatleri (haftanın günleri, Pzt = 0) ─────────────────────────
  openingHours: [
    { day: "Pazartesi", hours: "Kapalı", closed: true },
    { day: "Salı", hours: "09:00 – 18:00", closed: false },
    { day: "Çarşamba", hours: "09:00 – 18:00", closed: false },
    { day: "Perşembe", hours: "09:00 – 18:00", closed: false },
    { day: "Cuma", hours: "09:00 – 18:00", closed: false },
    { day: "Cumartesi", hours: "09:00 – 16:00", closed: false },
    { day: "Pazar", hours: "Kapalı", closed: true },
  ],

  // ─── Misafir Randevusu (girişsiz — ad + telefon yeterli) ─────────────────
  guestBooking: {
    title: "Randevu Al",
    subtitle: "Giriş gerekmez — herkes kolayca randevu alabilir",
    steps: ["Hizmet", "Tarih & Saat", "Bilgileriniz"],
    myBookingsTitle: "Randevularım",
    myBookingsHint: "Telefon numaranızı girin — randevularınızı görün ve gerekirse iptal edin",
    successTitle: "Randevunuz alındı!",
    successText: "En kısa sürede onaylanacak. Sizi görmek için sabırsızlanıyoruz!",
    demoPhone: "+90 542 633 15 70",
  },

  // ─── Değerlendirmeler (herkese açık) ──────────────────────────────────────
  reviews: {
    title: "Misafir Değerlendirmeleri",
    subtitle: "Deneyiminizi paylaşın — herkes değerlendirme yazabilir",
    writeButton: "Değerlendirme Yap",
    pendingNote: "Değerlendirmeniz yayınlanmadan önce kısa süreyle incelenir. Teşekkürler!",
    anonymousLabel: "Misafir",
  },

  // ─── Ekip Girişleri (Ekip portalı için giriş bilgileri) ───────────────────
  users: [
    { username: "melek", password: "Melekce!2022", name: "Melek", role: "İşletme Sahibi", initials: "MK" },
    { username: "admin", password: "Salon!2022", name: "Yönetici", role: "Stüdyo Yöneticisi", initials: "AD" },
  ] as BrandUser[],

  // ─── Alt Bilgi ────────────────────────────────────────────────────────────
  footer: {
    notes: [
      "Online randevu — 7/24 açık",
      "Instagram'da bizi takip edin",
    ],
  },

  // ─── Modül Kaydı (Ekip portalı): modülleri aç/kapat ──────────────────────
  modules: [
    { id: "dashboard", group: "genelBakis", label: "Genel Bakış", hint: "Bugün & KPI'lar", title: "Stüdyo Genel Bakış", subtitle: "Bugünkü randevular · Talepler · Doluluk · Hava durumu", icon: "layout-dashboard", enabled: true },
    { id: "kalender", group: "isletme", label: "Takvim", hint: "Haftalık görünüm", title: "Randevu Takvimi", subtitle: "Önümüzdeki 2 haftanın tüm randevuları", icon: "calendar-days", enabled: true },
    { id: "randevular", group: "isletme", label: "Rezervasyon Merkezi", hint: "Tüm randevu yönetimi", title: "Rezervasyon Merkezi", subtitle: "Görüntüle · düzenle · oluştur · müşteriyi bilgilendir · hatırlat", icon: "clipboard-list", enabled: true },
    { id: "yorumlar", group: "isletme", label: "Yorumlar", hint: "Değerlendirme moderasyonu", title: "Değerlendirme Yönetimi", subtitle: "Onayla · reddet · yayındaki yorumlar", icon: "star", enabled: true },
    { id: "envanter", group: "isletme", label: "Envanter", hint: "Stok & malzeme", title: "Envanter & Stok", subtitle: "Jel · akrilik · kirpik malzemeleri — düşük stok uyarıları", icon: "boxes", enabled: true },
    { id: "musteriler", group: "kayitlar", label: "Müşteriler", hint: "CRM & müşteri kartı", title: "Müşteri Yönetimi", subtitle: "Alerji beyanı · tercihler · sadakat kartı · portfolyo", icon: "users", enabled: true },
    { id: "ekip", group: "kayitlar", label: "Ekip & Prim", hint: "Komisyon hesabı", title: "Ekip Prim Hesaplayıcı", subtitle: "Ciro · tamamlanan randevu · komisyon oranı ile prim", icon: "users-2", enabled: true },
    { id: "hizmetler", group: "kayitlar", label: "Hizmetler", hint: "Fiyat listesi", title: "Hizmetler & Fiyatlar", subtitle: "Tırnak · Güzellik · Kirpik — süre ve fiyat", icon: "sparkles", enabled: true },
    { id: "galeri", group: "kayitlar", label: "Galeri", hint: "Çalışmalar", title: "Galeri Yönetimi", subtitle: "Herkese açık açılış sayfası görselleri", icon: "image", enabled: true },
    { id: "ayarlar", group: "kayitlar", label: "Ayarlar", hint: "Stüdyo & ekip", title: "Ayarlar", subtitle: "Stüdyo bilgileri · Saatler · Ekip · Sistem", icon: "settings", enabled: true },
  ] as ModuleConfig[],

  // ─── Ekip portalında girişten sonraki başlangıç görünümü ─────────────────
  defaultView: "dashboard",
}

// ─── Türetilmiş yardımcı değerler (değiştirmeyin) ───────────────────────────
export const ENABLED_MODULES = BRANDING.modules.filter((m) => m.enabled)
export const MODULE_MAP = new Map(ENABLED_MODULES.map((m) => [m.id, m]))
export const BRAND_DISPLAY =
  BRANDING.brand.nameParts.length === 2
    ? { part1: BRANDING.brand.nameParts[0], part2: BRANDING.brand.nameParts[1] }
    : { part1: BRANDING.brand.nameParts[0] ?? "", part2: "" }
export const BRAND_NAME = BRANDING.brand.nameParts.join(" ")
