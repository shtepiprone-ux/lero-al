'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { AppImage } from '@/components/ui/AppImage'
import { X, ChevronLeft, ChevronRight, Camera, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  useEffect(() => {
    if (lightboxIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
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
      {/* Grid gallery */}
      <div className="listing-gallery grid grid-cols-4 grid-rows-2 gap-2 h-[340px] sm:h-[420px] md:h-[500px] rounded-2xl overflow-hidden">
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

        {/* Mobile photo count badge */}
        <button
          className="md:hidden absolute bottom-3 right-3 flex items-center gap-1.5 bg-overlay/60 text-overlay-foreground text-sm px-3 py-1.5 rounded-full z-10"
          onClick={() => setLightboxIndex(0)}
        >
          <Camera className="h-4 w-4" />
          {sorted.length} {t('photo_count')}
        </button>
      </div>

      {/* All photos button */}
      {sorted.length > 1 && (
        <button
          className="mt-3 text-sm text-primary font-medium hover:underline flex items-center gap-1.5"
          onClick={() => setLightboxIndex(0)}
        >
          <Camera className="h-4 w-4" />
          {t('all_photos')} ({sorted.length})
        </button>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-overlay/95 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={t('close_gallery')}>
          {/* Close */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 h-11 w-11 rounded-full bg-overlay-foreground/10 hover:bg-overlay-foreground/20 flex items-center justify-center text-overlay-foreground transition-colors z-10"
            aria-label={t('close_gallery')}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-overlay-foreground/80 text-sm">
            {lightboxIndex + 1} / {sorted.length}
          </div>

          {/* Prev */}
          {sorted.length > 1 && (
            <button
              onClick={prev}
              className="absolute left-3 sm:left-6 h-11 w-11 rounded-full bg-overlay-foreground/10 hover:bg-overlay-foreground/20 flex items-center justify-center text-overlay-foreground transition-colors"
              aria-label={tc('aria_prev')}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <div className="relative w-full h-full max-w-5xl max-h-[85vh] mx-16">
            <AppImage variant="lightbox" src={sorted[lightboxIndex].url} alt={`${title} ${lightboxIndex + 1}`} />
          </div>

          {/* Next */}
          {sorted.length > 1 && (
            <button
              onClick={next}
              className="absolute right-3 sm:right-6 h-11 w-11 rounded-full bg-overlay-foreground/10 hover:bg-overlay-foreground/20 flex items-center justify-center text-overlay-foreground transition-colors"
              aria-label={tc('aria_next')}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Thumbnail strip */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto px-2">
            {sorted.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className={cn('relative h-14 w-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all', lightboxIndex === i ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100')}
              >
                <AppImage variant="gallery-strip" src={img.url} alt="" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
