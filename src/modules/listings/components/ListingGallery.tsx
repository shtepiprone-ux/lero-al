'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { AppImage } from '@/components/ui/AppImage'
import { Camera, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LightboxView } from './LightboxView'

interface GalleryImage { url: string; is_cover: boolean; order: number }

interface ListingGalleryProps {
  images: GalleryImage[]
  title: string
}

export function ListingGallery({ images, title }: ListingGalleryProps) {
  const t = useTranslations('listing')
  const tc = useTranslations('common')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const sorted = [...images].sort((a, b) => {
    if (a.is_cover) return -1
    if (b.is_cover) return 1
    return a.order - b.order
  })

  const prev = useCallback(() => {
    setLightboxIndex(i => (i === null ? null : (i - 1 + sorted.length) % sorted.length))
  }, [sorted.length])

  const next = useCallback(() => {
    setLightboxIndex(i => (i === null ? null : (i + 1) % sorted.length))
  }, [sorted.length])

  // Progressive enhancement: remove the SSR static hero frame (GalleryStaticFrame)
  // and reveal this interactive shell once the gallery JS has loaded and mounted.
  // Both operations happen in the same synchronous JS task — no intermediate repaint,
  // zero CLS. The static frame provides the LCP candidate before this effect runs.
  useEffect(() => {
    // gallery-wrapper-static wraps both the SSR static hero frame and the "All photos"
    // button placeholder. Removing the wrapper as a single unit ensures it is replaced
    // by the interactive shell in one JS task — the browser performs a single layout
    // recalculation after both removals, eliminating the intermediate repaint that
    // would otherwise cause CLS (the title section shifting as the wrapper leaves).
    const wrapper = document.getElementById('gallery-wrapper-static')
    const shell = document.getElementById('gallery-interactive-shell')
    if (wrapper) wrapper.remove()
    if (shell) shell.classList.remove('hidden')
  }, [])

  // Arrow-key prev/next — Mantine's Modal has no built-in equivalent (Esc/backdrop/scroll-lock
  // are now owned by Modal itself, see LightboxView).
  useEffect(() => {
    if (lightboxIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lightboxIndex, prev, next])

  if (!sorted.length) {
    return (
      <div className="listing-gallery aspect-[16/9] rounded-2xl bg-muted flex items-center justify-center">
        <Maximize2 className="h-12 w-12 text-muted-foreground" />
      </div>
    )
  }

  const cover = sorted[0]
  const rest = sorted.slice(1, 5)

  return (
    <>
      {/* Mobile-only: "All photos (N)" above gallery — full-width via buttonVariants default size (max-sm:w-full); positioned here to avoid Y-overlap with the fixed contact bar */}
      {sorted.length > 1 && (
        <Button
          variant="link"
          className="sm:hidden mb-3 text-sm font-medium gap-1.5"
          onClick={() => setLightboxIndex(0)}
        >
          <Camera className="h-4 w-4 shrink-0" />
          {t('all_photos')} ({sorted.length})
        </Button>
      )}

      {/* Grid gallery */}
      <div className="listing-gallery relative grid grid-cols-4 grid-rows-2 gap-2 h-[var(--listing-gallery-h-mobile)] sm:h-[var(--listing-gallery-h-tablet)] md:h-[var(--listing-gallery-h-desktop)] rounded-2xl overflow-hidden">
        {/* Main image — priority must be explicit, no variant default */}
        <div
          className="col-span-4 md:col-span-2 row-span-2 relative cursor-zoom-in group"
          onClick={() => setLightboxIndex(0)}
        >
          <AppImage variant="gallery-main" src={cover.url} alt={title} priority />
        </div>

        {/* Side thumbnails — desktop only */}
        {rest.map((img, i) => (
          <div
            key={i}
            className="hidden md:block relative cursor-zoom-in group"
            onClick={() => setLightboxIndex(i + 1)}
          >
            {/* "View all" overlay lives inside AppImage's positioned container */}
            <AppImage variant="gallery-side" src={img.url} alt={`${title} ${i + 2}`}>
              {i === 3 && sorted.length > 5 && (
                <div className="absolute inset-0 bg-overlay/50 flex flex-col items-center justify-center text-overlay-foreground gap-1">
                  <Camera className="h-6 w-6" />
                  <span className="text-sm font-semibold">+{sorted.length - 5} {t('photo_count')}</span>
                </div>
              )}
            </AppImage>
          </div>
        ))}

        {/* Mobile photo count badge — wrapper div is the positioned element (shrinks to content);
            Button is max-sm:w-full of the wrapper (not of the gallery) → no outside-container escape */}
        <div className="md:hidden absolute top-3 right-3">
          <Button
            variant="ghost"
            className="gap-1.5 bg-overlay/60 text-overlay-foreground text-sm px-3 py-1.5 rounded-full z-10 h-auto hover:bg-overlay/70"
            onClick={() => setLightboxIndex(0)}
            aria-label={t('all_photos')}
          >
            <Camera className="h-4 w-4 shrink-0" />
            {sorted.length} {t('photo_count')}
          </Button>
        </div>
      </div>

      {/* Desktop/tablet (≥640): "All photos (N)" below gallery */}
      {sorted.length > 1 && (
        <Button
          variant="link"
          className="hidden sm:inline-flex mt-3 text-sm font-medium gap-1.5 h-auto p-0"
          onClick={() => setLightboxIndex(0)}
        >
          <Camera className="h-4 w-4 shrink-0" />
          {t('all_photos')} ({sorted.length})
        </Button>
      )}

      <LightboxView
        opened={lightboxIndex !== null}
        images={sorted}
        activeIndex={lightboxIndex ?? 0}
        title={title}
        labels={{
          close: t('close_gallery'),
          prev: tc('aria_prev'),
          next: tc('aria_next'),
          counter: (index, total) => `${index} / ${total}`,
        }}
        onClose={() => setLightboxIndex(null)}
        onPrev={prev}
        onNext={next}
        onSelect={setLightboxIndex}
      />
    </>
  )
}
