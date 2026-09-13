// ═══════════════════════════════════════════════════════════════════════════
//  TELEFON NORMALİZASYONU (V3) — Türkiye biçimleriyle akıllı eşleştirme
// ═══════════════════════════════════════════════════════════════════════════
//  Sorun (V2'de bulundu): aynı numara farklı biçimlerde yazılırdı —
//    kayıt: «+90 539 888 99 00» · iptal: «0539 888 99 00» → eşleşmezdi.
//  Çözüm: karşılaştırmalar her zaman normalize RAKAMLARLA yapılır.
//    11 hane, 0 ile başlar → 0 yerine 90 (TR yerel biçimi)
//    10 hane, 5 ile başlar → başa 90 (cep kısa biçimi)
//    diğerleri → dokunulmaz (yabancı numaralar)

/** Rakamları çıkarır + TR yerel biçimlerini uluslararası hale getirir. */
export function phoneDigits(p: string): string {
  let d = (p ?? "").replace(/\D/g, "")
  if (d.length === 11 && d.startsWith("0")) d = `90${d.slice(1)}`
  else if (d.length === 10 && d.startsWith("5")) d = `90${d}`
  return d
}

/** Kayıt için standart biçim: TR numaraları «+90 5XX XXX XX XX» olarak saklanır.
 *  Tanınmayan biçimler girildiği gibi (kırpılmış) döner. */
export function canonicalPhone(p: string): string {
  const d = phoneDigits(p)
  if (d.length === 12 && d.startsWith("90")) {
    return `+90 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`
  }
  return (p ?? "").trim()
}
