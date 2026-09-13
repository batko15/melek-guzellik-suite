// ═══════════════════════════════════════════════════════════════════════════
// src/app/error.tsx — Error-Boundary (Next.js App Router, muss Client sein)
// V4-c: zarif Türkçe hata sayfası — salon kimliğine uygun sıcak koyu tema,
//   "Tekrar dene" (reset) + Ana Sayfa bağlantısı.
// ═══════════════════════════════════════════════════════════════════════════

"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Home, RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Konsola loglanır — üretimde izleme servisine bağlanabilir
    console.error("Sayfa hatası:", error)
  }, [error])

  return (
    <main
      aria-label="Hata sayfası"
      className="mk-velvet flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center"
    >
      <div className="mk-card mk-anim-up w-full max-w-md rounded-3xl border border-border/70 p-8 sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-primary/10 mk-gold-glow">
          <Sparkles className="h-7 w-7 text-brand-text" aria-hidden="true" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
          Bir aksilik oldu
        </p>
        <h1 className="mk-display mt-2 text-balance text-2xl font-bold leading-snug">
          Sayfa şu an <span className="mk-gold-text">gösterilemiyor</span>
        </h1>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
          Beklenmeyen bir sorun yaşandı — endişelenmeyin, verileriniz güvende.
          Lütfen sayfayı yeniden yüklemeyi deneyin.
        </p>
        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            className="mk-gold-glow h-11 rounded-full bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Tekrar dene
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-primary/40 px-6 font-semibold text-brand-text hover:bg-primary/10"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Ana Sayfa
            </Link>
          </Button>
        </div>
        {error?.digest && (
          <p className="mt-5 text-[10px] tracking-wide text-muted-foreground/70">
            Hata kodu: {error.digest}
          </p>
        )}
      </div>
    </main>
  )
}
