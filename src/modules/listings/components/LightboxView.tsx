'use client'

import { Modal, useMantineTheme, useMatches } from '@mantine/core'
import { X } from 'lucide-react'
import { AppImage } from '@/design-system/media/AppImage'
import { GalleryNavActionIcon } from '@/design-system/mantine/patterns/GalleryNavActionIcon'
import { GalleryDesktopNavigation } from '@/design-system/mantine/patterns/GalleryDesktopNavigation'
import { GalleryThumbnailButton } from '@/design-system/mantine/patterns/GalleryThumbnailButton'
import { useSwipeTrackSync, buildWrappedSlides } from '@/hooks/useSwipeTrackSync'
import { cn } from '@/lib/utils'
import styles from './LightboxView.module.css'

interface LightboxImage {
  url: string
}

export interface LightboxViewLabels {
  close: string
  prev: string
  next: string
  counter: (index: number, total: number) => string
}

export interface LightboxViewProps {
  opened: boolean
  images: LightboxImage[]
  activeIndex: number
  title: string
  labels: LightboxViewLabels
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onSelect: (index: number) => void
}

export function LightboxView({
  opened,
  images,
  activeIndex,
  title,
  labels,
  onClose,
  onPrev,
  onNext,
  onSelect,
}: LightboxViewProps) {
  const activeImage = images[activeIndex]
  const theme = useMantineTheme()
  // Visual mode is the `sm` (640px) viewport breakpoint, not input/pointer capability — a wide
  // touch tablet gets the desktop chrome, a narrow mouse-driven window gets the mobile one.
  const isMobile = useMatches({ base: true, sm: false })
  const {
    containerRef: mobileContainerRef,
    trackRef,
    containerA11yProps,
    trackStyle: mobileTrackStyle,
    slideStyle: mobileSlideStyle,
  } = useSwipeTrackSync(activeIndex, images.length, onSelect, title)
  if (!activeImage) return null

  return (
    <Modal.Root
      opened={opened}
      onClose={onClose}
      fullScreen
      padding={0}
      radius={0}
      keepMounted={false}
    >
      {/* No Modal.Overlay — this component's own scrim (a near-opaque black wash painted on
          Content) IS the backdrop; a second Mantine overlay would double-darken. Compound API
          (not the shorthand <Modal>) so aria-label lands on Modal.Content — the actual
          role="dialog" element. No Modal.Header — a visible title bar would break the full-bleed
          media view. Scrim color via inline `style`, not a className — `Paper`, which
          `Modal.Content` renders through, sets its own unlayered `background-color`, so a
          className would lose the cascade regardless of specificity. `--overlay` is the single
          source token this scrim reads. */}
      <Modal.Content
        aria-label={labels.close}
        style={{ backgroundColor: 'color-mix(in oklab, var(--overlay) 95%, transparent)' }}
      >
        <Modal.Body className="h-full flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close */}
            <GalleryNavActionIcon onClick={onClose} ariaLabel={labels.close} tone="dark" className="top-4 right-4 z-10">
              <X className="size-5" />
            </GalleryNavActionIcon>

            {/* Counter */}
            <div className={cn(styles.counter, 'absolute top-4 left-1/2 -translate-x-1/2 text-sm')}>
              {labels.counter(activeIndex + 1, images.length)}
            </div>

            {/* Prev/next — desktop only; mobile browses by swiping/dragging/arrow-keying the image itself. */}
            <GalleryDesktopNavigation
              variant="lightbox"
              onPrev={onPrev}
              onNext={onNext}
              prevLabel={labels.prev}
              nextLabel={labels.next}
              hasMultiple={images.length > 1}
            />

            {/* Image — mobile: full-bleed transform-driven track, one photo per swipe/drag/arrow-key
                (`useSwipeTrackSync`, see that hook for the wrap-around contract). Desktop: a column
                flex of [media, thumbnail strip] so the strip is reserved space in normal flow, never
                an overlay guessing at how much room a `vh`-relative media box left over — that guess
                (`max-h-[85vh]`) is what let a tall/differently-cropped photo's frame intersect the
                strip (R25). `flex-1 min-h-0` makes the media region exactly the space left after the
                strip's own (shrink-0) height, at every viewport height, for every photo aspect ratio.
                `min-w-0` on this wrapper (kickoff §19, re-verified by a kickoff-§20 A/B test —
                `docs/sessions/evidence/task824/218_r20_ab_wrapper.txt`): without it this wrapper's own
                flex `min-width: auto` floors it wider than `max-w-5xl`/`mx-16` allow, swallowing the
                margin (measured: `left:0, right:1024, width:1024` with `min-w-0` absent, vs.
                `left:64, right:960, width:896` with it present — reproduced with the strip's own
                justify-direction held constant in both directions, so the strip is not the source).
                The `<img>` inside is `position:absolute` (`AppImage.module.css:141-145`,
                `.imageLayer`) and therefore out of flow — it contributes nothing to any ancestor's
                intrinsic sizing, so it is NOT the mechanism (a prior version of this comment
                incorrectly attributed the effect to the image's natural size; the fix is real and
                A/B-verified, the originally-stated cause was not). The exact source of the wrapper's
                content-based automatic minimum remains undiagnosed beyond ruling out the image;
                `min-w-0` closes it regardless of mechanism. */}
            {!isMobile ? (
              <div className="relative w-full h-full max-w-5xl mx-16 min-w-0 flex flex-col min-h-0">
                <div className="relative w-full flex-1 min-h-0">
                  <AppImage variant="lightbox" src={activeImage.url} alt={`${title} ${activeIndex + 1}`} />
                </div>
                {/* Thumbnail strip — desktop only, one canonical square per photo, in normal flow
                    beneath the media region (not an absolute overlay — see the comment above).
                    `justify-start` on the scroll container + `mx-auto` on the inner row (kickoff
                    §19, R35): a centered flex container whose content overflows strands the
                    start-side thumbnails outside `[0, scrollWidth - clientWidth]` — `scrollLeft`
                    can never go negative, so content centered past the container's width is
                    permanently unreachable on the leading side (measured and retained:
                    `docs/sessions/evidence/task824/218_r20_ab_wrapper.txt`, `NEITHER` arm).
                    `mx-auto` on the inner row still centers it when the row is NARROWER than the
                    strip (few photos, no overflow) — auto margins only collapse to 0, left-aligning
                    the row, once the row is wider than its container, which is exactly the
                    overflowing case that must start reachable at `scrollLeft = 0`. */}
                <div className="shrink-0 flex justify-start overflow-x-auto px-2 pt-4">
                  <div className="flex gap-2 mx-auto">
                    {images.map((img, i) => (
                      <GalleryThumbnailButton
                        key={i}
                        src={img.url}
                        alt=""
                        label={`${title} ${i + 1}`}
                        active={activeIndex === i}
                        onClick={() => onSelect(i)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div ref={mobileContainerRef} {...containerA11yProps} className="h-full w-full overflow-hidden">
                <div ref={trackRef} style={mobileTrackStyle}>
                  {buildWrappedSlides(images).map((img, i) => (
                    <div key={i} style={mobileSlideStyle} className="relative h-full shrink-0">
                      <AppImage variant="lightbox" src={img.url} alt={title} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination indicators — mobile only, position indicators (not clickable thumbnails
                or previews): one thin line segment per photo, the active one filled with the
                brand token. Never dots/pills/circles. Size comes from the registered
                `theme.other.boxSize.paginationSegment(Thickness)` tokens (D824-4); the CSS module
                keeps only what has no dimension role — `border-radius: 0` and the color-mix fill. */}
            {isMobile && images.length > 1 && (
              <div className={cn(styles.paginationRail, 'absolute bottom-4 left-1/2 -translate-x-1/2 flex')} role="presentation">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={cn(styles.paginationSegment, activeIndex === i && styles.paginationSegmentActive)}
                    style={{
                      width: theme.other.boxSize.paginationSegment,
                      height: theme.other.boxSize.paginationSegmentThickness,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}
