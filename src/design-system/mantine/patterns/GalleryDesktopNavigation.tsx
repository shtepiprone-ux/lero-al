'use client'

import { useMantineTheme, useMatches } from '@mantine/core'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GalleryNavActionIcon, type GalleryNavActionIconPlacement } from './GalleryNavActionIcon'

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

// Both variants share the identical vertical-position contract (`centerY`) — only the horizontal
// offset (`left`/`right`), tone and icon size differ. This must stay a single shared pair per
// variant: two independently-typed placement objects is exactly how the vertical anchor drifted
// or went missing before.
const NAV_VARIANTS = {
  gallery: {
    tone: 'light' as const,
    prevPlacement: { left: 'xs', centerY: true, raised: true } satisfies GalleryNavActionIconPlacement,
    nextPlacement: { right: 'xs', centerY: true, raised: true } satisfies GalleryNavActionIconPlacement,
    iconSize: 'roomy' as const,
  },
  lightbox: {
    tone: 'dark' as const,
    prevPlacement: { left: { base: 'sm', sm: 'xl' }, centerY: true } satisfies GalleryNavActionIconPlacement,
    nextPlacement: { right: { base: 'sm', sm: 'xl' }, centerY: true } satisfies GalleryNavActionIconPlacement,
    iconSize: 'decorative' as const,
  },
}

/**
 * The one owner of the gallery/lightbox prev/next controls: the `sm`-breakpoint desktop-only
 * visibility check, the gallery-vs-lightbox position/tone/icon-size contract, and the two
 * `GalleryNavActionIcon`s themselves. Consumers pass callbacks and labels only —
 * `GalleryNavActionIcon` itself stays a low-level visual primitive with no responsive opinion of
 * its own, and no consumer re-derives the breakpoint check or the position/tone pairing locally.
 * Renders inside the caller's own `position: relative` media-canvas container; both buttons'
 * shared `centerY` then centers on that canvas's vertical center.
 */
export function GalleryDesktopNavigation({ onPrev, onNext, prevLabel, nextLabel, hasMultiple, variant }: GalleryDesktopNavigationProps) {
  const isMobile = useMatches({ base: true, sm: false })
  const theme = useMantineTheme()
  if (isMobile || !hasMultiple) return null
  const v = NAV_VARIANTS[variant]
  const iconSize = theme.other.iconSize[v.iconSize]
  return (
    <>
      <GalleryNavActionIcon onClick={onPrev} ariaLabel={prevLabel} tone={v.tone} placement={v.prevPlacement}>
        <ChevronLeft size={iconSize} />
      </GalleryNavActionIcon>
      <GalleryNavActionIcon onClick={onNext} ariaLabel={nextLabel} tone={v.tone} placement={v.nextPlacement}>
        <ChevronRight size={iconSize} />
      </GalleryNavActionIcon>
    </>
  )
}
