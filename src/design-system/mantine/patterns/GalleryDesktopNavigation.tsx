'use client'

import { useMatches } from '@mantine/core'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GalleryNavActionIcon } from './GalleryNavActionIcon'

export interface GalleryDesktopNavigationProps {
  onPrev: () => void
  onNext: () => void
  prevLabel: string
  nextLabel: string
  hasMultiple: boolean
  /** `'gallery'` — the closed gallery's light-tone overlay on the main photo. `'lightbox'` — the
   * full-screen modal's dark-tone scrim controls, further from the edge with a larger icon. */
  variant: 'gallery' | 'lightbox'
}

// Both variants share the identical vertical-position contract (`top-1/2 -translate-y-1/2`) —
// only the horizontal offset (`left-*`/`right-*`), tone and icon size differ. This must stay a
// single shared pair per variant: two independently-typed className strings is exactly how the
// vertical anchor drifted or went missing before.
const NAV_VARIANTS = {
  gallery: {
    tone: 'light' as const,
    prevClassName: 'left-2 top-1/2 -translate-y-1/2 z-10',
    nextClassName: 'right-2 top-1/2 -translate-y-1/2 z-10',
    iconClassName: 'size-5',
  },
  lightbox: {
    tone: 'dark' as const,
    prevClassName: 'left-3 sm:left-6 top-1/2 -translate-y-1/2',
    nextClassName: 'right-3 sm:right-6 top-1/2 -translate-y-1/2',
    iconClassName: 'size-6',
  },
}

/**
 * The one owner of the gallery/lightbox prev/next controls: the `sm`-breakpoint desktop-only
 * visibility check, the gallery-vs-lightbox position/tone/icon-size contract, and the two
 * `GalleryNavActionIcon`s themselves. Consumers pass callbacks and labels only —
 * `GalleryNavActionIcon` itself stays a low-level visual primitive with no responsive opinion of
 * its own, and no consumer re-derives the breakpoint check or the position/tone pairing locally.
 * Renders inside the caller's own `position: relative` media-canvas container; both buttons'
 * shared `top-1/2 -translate-y-1/2` then centers on that canvas's vertical center.
 */
export function GalleryDesktopNavigation({ onPrev, onNext, prevLabel, nextLabel, hasMultiple, variant }: GalleryDesktopNavigationProps) {
  const isMobile = useMatches({ base: true, sm: false })
  if (isMobile || !hasMultiple) return null
  const v = NAV_VARIANTS[variant]
  return (
    <>
      <GalleryNavActionIcon onClick={onPrev} ariaLabel={prevLabel} tone={v.tone} className={v.prevClassName}>
        <ChevronLeft className={v.iconClassName} />
      </GalleryNavActionIcon>
      <GalleryNavActionIcon onClick={onNext} ariaLabel={nextLabel} tone={v.tone} className={v.nextClassName}>
        <ChevronRight className={v.iconClassName} />
      </GalleryNavActionIcon>
    </>
  )
}
