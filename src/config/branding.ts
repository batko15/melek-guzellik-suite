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
  version: "2.0.0",

  // ─── Marka ────────────────────────────────────────────────────────────────
  // nameParts: 1. kısım normal, 2. kısım altın (vurgu rengi) yazılır.
  brand: {
    nameParts: ["Melek'çe", "Güzellik"],
    tagline: "Tırnak Sanatı & Güzellik Stüdyosu",
    slogan: "Her kadın bir melek gibi güzeldir",
    icon: "sparkles" as "sparkles" | "heart" | "crown" | "flower",
  },

  // ─── Stüdyo / Resmi Bilgiler ──────────────────────────────────────────────
  company: {
    legalName: "Melek'çe Güzellik",
    street: "Örnek Caddesi 12", // ← Gerçek adresi buraya girin
    city: "5000 Aarau", // ← Gerçek şehri buraya girin
    phone: "+41 79 000 00 00", // ← Gerçek telefon numarasını buraya girin
    instagram: "melekce_guzellik17",
    website: "www.melekce-guzellik.ch", // ← İsteğe bağlı: kendi web siteniz
    footerClaim: "Tırnak Sanatı · Güzellik · Kirpik",
  },

  // ─── Canlı Hava Durumu (Open-Meteo, ücretsiz, anahtar gerekmez) ──────────
  weather: {
    enabled: true,
    cityName: "Aarau",
    latitude: 47.39,
    longitude: 8.05,
    timezone: "Europe/Zurich",
  },

  // ─── Yerel Ayarlar ────────────────────────────────────────────────────────
  locale: {
    language: "tr-TR",
    currency: "CHF",
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
    demoPhone: "+41 79 111 22 33",
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
    { username: "melek", password: "melek123", name: "Melek", role: "İşletme Sahibi", initials: "MK" },
    { username: "admin", password: "admin123", name: "Yönetici", role: "Stüdyo Yöneticisi", initials: "AD" },
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
    { id: "randevular", group: "isletme", label: "Randevular", hint: "Talepler & durum", title: "Randevu Yönetimi", subtitle: "Talepleri onayla · tamamla · iptal et", icon: "clipboard-list", enabled: true },
    { id: "yorumlar", group: "isletme", label: "Yorumlar", hint: "Değerlendirme moderasyonu", title: "Değerlendirme Yönetimi", subtitle: "Onayla · reddet · yayındaki yorumlar", icon: "star", enabled: true },
    { id: "musteriler", group: "kayitlar", label: "Müşteriler", hint: "CRM & geçmiş", title: "Müşteri Yönetimi", subtitle: "Sık gelen müşteriler · ciro · notlar", icon: "users", enabled: true },
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
