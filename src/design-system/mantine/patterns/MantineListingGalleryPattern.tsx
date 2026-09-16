'use client'

import { useState } from 'react'
import { Image, ScrollArea, Group, UnstyledButton, Paper, useMatches } from '@mantine/core'
import { Maximize2 } from 'lucide-react'
import { LightboxView, type LightboxViewLabels } from '@/modules/listings/components/LightboxView'
import { GalleryDesktopNavigation } from './GalleryDesktopNavigation'
import { GalleryThumbnailButton } from './GalleryThumbnailButton'
import { useSwipeTrackSync, buildWrappedSlides } from '@/hooks/useSwipeTrackSync'
import { cn } from '@/lib/utils'
import styles from './MantineListingGalleryPattern.module.css'

export interface MantineListingGalleryImage {
  url: string
}

export interface MantineListingGalleryPatternProps {
  images: MantineListingGalleryImage[]
  /** Listing title — used as the main photo `alt` and the lightbox `aria-label`. */
  title: string
  labels: LightboxViewLabels
}

/**
 * Canonical listing-detail gallery pattern — the photo IS a Mantine component that owns its own
 * lightbox open/active-index/prev/next/select state. Renders a Mantine `Image` main photo +
 * (desktop only, when >1) a thumbnail row, both wired to the same `LightboxView` modal. Pure,
 * prop-driven, hook-free of data/network — `'use client'` only for the open-state.
 *
 * Visual mode is the `sm` (640px) viewport breakpoint, not input/pointer capability: below `sm`
 * it's a full-bleed one-photo-per-swipe/drag/arrow-key track (`useSwipeTrackSync`) with no
 * thumbnails or arrows; at `sm` and above it's a static photo with prev/next arrows and a
 * thumbnail strip of canonical squares (`GalleryThumbnailButton`,
 * `theme.other.boxSize.galleryThumb`). Height vars reuse the real `GalleryStaticFrame`'s frame
 * height tokens (`globals.css` `--listing-gallery-h-*`).
 *
 * A desktop thumbnail click only selects — it never opens the lightbox, which opens from the main
 * photo alone.
 */
export function MantineListingGalleryPattern({ images, title, labels }: MantineListingGalleryPatternProps) {
  const [opened, setOpened] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const isMobile = useMatches({ base: true, sm: false })
  const {
    containerRef: mobileContainerRef,
    trackRef: mobileTrackRef,
    containerA11yProps,
    trackStyle: mobileTrackStyle,
    slideStyle: mobileSlideStyle,
  } = useSwipeTrackSync(activeIndex, images.length, setActiveIndex, title)
  const wraps = images.length > 1
  const activeWrappedIndex = wraps ? activeIndex + 1 : activeIndex

  function goPrev() {
    setActiveIndex(i => (i - 1 + images.length) % images.length)
  }

  function goNext() {
    setActiveIndex(i => (i + 1) % images.length)
  }

  if (images.length === 0) {
    return (
      <Paper
        withBorder
        radius="lg"
        className="flex items-center justify-center bg-muted h-[var(--listing-gallery-h-mobile)] sm:h-[var(--listing-gallery-h-tablet)] md:h-[var(--listing-gallery-h-desktop)]"
      >
        <Maximize2 className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      </Paper>
    )
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg h-[var(--listing-gallery-h-mobile)] sm:h-[var(--listing-gallery-h-tablet)] md:h-[var(--listing-gallery-h-desktop)]">
        {/* Mobile: full-bleed transform-driven track, one photo per swipe/drag/arrow-key, no
            adjacent-photo peeking — `useSwipeTrackSync` owns the gesture directly, clamping live
            drag offset to one slide width and animating a settle by at most one internal step;
            wrap-around rebases off a clone slide invisibly. Only the currently visible slide is in
            the accessibility tree (a unique `aria-label`, focusable); every clone/off-screen slide
            is `aria-hidden` and untabbable, so the accessible name stays unambiguous. Desktop: the
            single static image tied to `activeIndex` plus arrow controls. */}
        {!isMobile ? (
          <UnstyledButton
            onClick={() => setOpened(true)}
            className="absolute inset-0 block h-full w-full"
            aria-label={title}
          >
            <Image src={images[activeIndex].url} alt={title} fit="cover" className="h-full w-full" />
          </UnstyledButton>
        ) : (
          <div ref={mobileContainerRef} {...containerA11yProps} className="h-full w-full overflow-hidden">
            <div ref={mobileTrackRef} style={mobileTrackStyle}>
              {buildWrappedSlides(images).map((img, i) => {
                const isVisible = i === activeWrappedIndex
                return (
                  <UnstyledButton
                    key={i}
                    onClick={() => setOpened(true)}
                    style={mobileSlideStyle}
                    className="block h-full shrink-0"
                    aria-label={isVisible ? title : undefined}
                    aria-hidden={isVisible ? undefined : true}
                    tabIndex={isVisible ? undefined : -1}
                  >
                    <Image src={img.url} alt="" fit="cover" className="h-full w-full" />
                  </UnstyledButton>
                )
              })}
            </div>
          </div>
        )}

        <GalleryDesktopNavigation
          variant="gallery"
          onPrev={goPrev}
          onNext={goNext}
          prevLabel={labels.prev}
          nextLabel={labels.next}
          hasMultiple={images.length > 1}
        />
        {images.length > 1 && (
          <div className={cn(styles.photoCountBadge, 'pointer-events-none absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-xs')}>
            {labels.counter(activeIndex + 1, images.length)}
          </div>
        )}
      </div>

      {/* Desktop-only thumbnail row: a non-stretching horizontal strip of canonical squares.
          `ScrollArea` + `Group wrap="nowrap"` keeps every square the token's fixed size regardless
          of container width or thumbnail count, letting the row — not the page — absorb overflow.
          A click only selects (`setActiveIndex`); the lightbox opens from the main photo alone. */}
      {!isMobile && images.length > 1 && (
        <ScrollArea type="auto" scrollbars="x" scrollbarSize={0} mt="xs">
          <Group gap="xs" wrap="nowrap">
            {images.map((img, index) => (
              <GalleryThumbnailButton
                key={index}
                src={img.url}
                alt=""
                label={`${title} ${index + 1}`}
                active={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </Group>
        </ScrollArea>
      )}

      <LightboxView
        opened={opened}
        images={images}
        activeIndex={activeIndex}
        title={title}
        labels={labels}
        onClose={() => setOpened(false)}
        onPrev={goPrev}
        onNext={goNext}
        onSelect={setActiveIndex}
      />
    </div>
  )
}
