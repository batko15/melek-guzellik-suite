// V6 «Profesyonel Edition» — Öncesi & Sonrası karşılaştırma kaydırıcısı
// img-comparison-slider bir Web Component'tir ve hafif DOM'u (light DOM) kendisi
// yeniden düzenler; React 19 hidrasyonu sırasında bu mutasyon, ağaç yapısını
// kaydırıp sonraki bileşenlerde useId uyuşmazlıkları yaratır.
// Çözüm: bileşen yalnızca hidrasyondan SONRA ekrana girer — sunucuda ve ilk
// istemci render'ında «sonrası» görseli sade bir yedek olarak gösterilir
// (görsel aynı olduğundan görsel sıçrama olmaz, SEO ve a11y korunur).

"use client"

import { useSyncExternalStore, type CSSProperties } from "react"
import Image from "next/image"
import "img-comparison-slider"
import "img-comparison-slider/dist/styles.css"
import { ChevronsLeftRight } from "lucide-react"

// ─── img-comparison-slider (Web Component) — React 19 JSX tip bildirimi ───
/* eslint-disable @typescript-eslint/no-namespace -- JSX augmentation requires namespace syntax */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "img-comparison-slider": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        value?: number
      }
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

const emptySubscribe = () => () => {}
const getServerFlag = (): boolean => false
let mountedCache = false
const getClientFlag = (): boolean => (mountedCache = true)

/** Hidrasyon güvenli «ekranda mıyız» bayrağı — sunucuda hep false. */
function useMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, getClientFlag, getServerFlag)
}

export interface ComparePair {
  title: string
  before: string
  after: string
  beforeAlt: string
  afterAlt: string
}

export function CompareSlider({ pair }: { pair: ComparePair }) {
  const mounted = useMounted()

  // Sunucu + ilk istemci render: sade «sonrası» görseli (hidrasyon güvenli)
  if (!mounted) {
    return (
      <Image
        src={pair.after}
        alt={pair.afterAlt}
        width={1344}
        height={768}
        sizes="(min-width: 768px) 50vw, 100vw"
        className="h-auto w-full select-none"
      />
    )
  }

  return (
    <img-comparison-slider
      value={50}
      className="block w-full"
      aria-label={`${pair.title} — öncesi ve sonrası karşılaştırması (ok tuşlarıyla da kaydırabilirsiniz)`}
      style={
        {
          "--divider-color": "color-mix(in oklch, var(--brand) 65%, transparent)",
          "--divider-width": "2px",
          "--divider-shadow": "0 0 12px rgba(0, 0, 0, 0.45)",
        } as CSSProperties
      }
    >
      <Image
        slot="first"
        src={pair.before}
        alt={pair.beforeAlt}
        width={1344}
        height={768}
        sizes="(min-width: 768px) 50vw, 100vw"
        className="h-auto w-full select-none"
        draggable={false}
      />
      <Image
        slot="second"
        src={pair.after}
        alt={pair.afterAlt}
        width={1344}
        height={768}
        sizes="(min-width: 768px) 50vw, 100vw"
        className="h-auto w-full select-none"
        draggable={false}
      />
      {/* Özel altın tutamak — bileşen konumlandırır, sürükleme tüm yüzeyde çalışır */}
      <span slot="handle" className="mk-compare-handle" aria-hidden="true">
        <ChevronsLeftRight className="h-5 w-5" />
      </span>
    </img-comparison-slider>
  )
}
