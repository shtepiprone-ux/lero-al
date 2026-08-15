'use client'

import { useState } from 'react'
import { Image, SimpleGrid, UnstyledButton, Paper, Text } from '@mantine/core'
import { Camera, Maximize2 } from 'lucide-react'
import { LightboxView, type LightboxViewLabels } from '@/modules/listings/components/LightboxView'
import { cn } from '@/lib/utils'
import styles from './MantineListingGalleryPattern.module.css'

export interface MantineListingGalleryImage {
  url: string
}

export interface MantineListingGalleryPatternProps {
  images: MantineListingGalleryImage[]
  /** Listing title — used as the main photo `alt` and the lightbox `aria-label`. */
  title: string
  labels: LightboxViewLabels & {
    /** Word placed after the photo count, e.g. `${count} ${photoCountSuffix}` -> "8 photos". */
    photoCountSuffix: string
  }
}

const MAX_THUMBNAILS = 4

/**
 * Canonical listing-detail gallery pattern (Task 616 D1) — the photo IS a Mantine component
 * that owns its own lightbox open/active-index/prev/next/select state. Renders a Mantine
 * `Image` main photo + (when >1) a thumbnail row, both wired to open the SAME `LightboxView`
 * (the Task 612 Mantine fullScreen-Modal primitive — single source of the lightbox chrome;
 * this pattern owns the state/open-trigger, `LightboxView` renders the modal). Pure,
 * prop-driven, hook-free of data/network — `'use client'` only for the open-state.
 *
 * Height vars reuse the real `GalleryStaticFrame`'s frame height tokens
 * (`globals.css` `--listing-gallery-h-*`) — no invented pixel values.
 */
export function MantineListingGalleryPattern({ images, title, labels }: MantineListingGalleryPatternProps) {
  const [opened, setOpened] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  function openAt(index: number) {
    setActiveIndex(index)
    setOpened(true)
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

  const extraCount = images.length - MAX_THUMBNAILS

  return (
    <div>
      <UnstyledButton
        onClick={() => openAt(0)}
        className="relative block w-full overflow-hidden rounded-lg h-[var(--listing-gallery-h-mobile)] sm:h-[var(--listing-gallery-h-tablet)] md:h-[var(--listing-gallery-h-desktop)]"
        aria-label={title}
      >
        <Image src={images[0].url} alt={title} radius="lg" fit="cover" className="h-full w-full" />
        {images.length > 1 && (
          <div className={cn(styles.photoCountBadge, 'absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs')}>
            <Camera className="h-3 w-3" aria-hidden="true" />
            <span>
              {images.length} {labels.photoCountSuffix}
            </span>
          </div>
        )}
      </UnstyledButton>

      {images.length > 1 && (
        <SimpleGrid cols={{ base: 4 }} spacing="xs" mt="xs">
          {images.slice(1, MAX_THUMBNAILS + 1).map((img, i) => {
            const index = i + 1
            const isLastVisible = i === MAX_THUMBNAILS - 1 && extraCount > 0
            return (
              <UnstyledButton
                key={index}
                onClick={() => openAt(index)}
                className="relative block h-16 w-full overflow-hidden rounded-md sm:h-20"
                aria-label={title}
              >
                <Image src={img.url} alt="" radius="md" fit="cover" className="h-full w-full" />
                {isLastVisible && (
                  <div className={cn(styles.extraCountOverlay, 'absolute inset-0 flex items-center justify-center')}>
                    <Text size="sm" fw={600} c="var(--overlay-foreground)">
                      +{extraCount}
                    </Text>
                  </div>
                )}
              </UnstyledButton>
            )
          })}
        </SimpleGrid>
      )}

      <LightboxView
        opened={opened}
        images={images}
        activeIndex={activeIndex}
        title={title}
        labels={labels}
        onClose={() => setOpened(false)}
        onPrev={() => setActiveIndex(i => (i - 1 + images.length) % images.length)}
        onNext={() => setActiveIndex(i => (i + 1) % images.length)}
        onSelect={setActiveIndex}
      />
    </div>
  )
}
