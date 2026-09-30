'use client'

import { useRef } from 'react'
import { Modal, Center, Box, Stack, Group, useMantineTheme, useMatches } from '@mantine/core'
import { X } from 'lucide-react'
import { AppImage } from '@/design-system/media/AppImage'
import { GalleryNavActionIcon, resolveGalleryOffset } from '@/design-system/mantine/patterns/GalleryNavActionIcon'
import { GalleryDesktopNavigation } from '@/design-system/mantine/patterns/GalleryDesktopNavigation'
import { GalleryThumbnailButton } from '@/design-system/mantine/patterns/GalleryThumbnailButton'
import { useSwipeTrackSync, buildWrappedSlides } from '@/hooks/useSwipeTrackSync'
import { useKeepActiveInView } from '@/hooks/useKeepActiveInView'
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
  // Task 825 Revision 1 (R11/R12, owner decision §16.2 ③) — each carousel scrolls only its own
  // element into view on `activeIndex` change; `Modal.Content`/the page never scroll.
  const stripScrollerRef = useRef<HTMLDivElement>(null)
  const railScrollerRef = useRef<HTMLDivElement>(null)
  useKeepActiveInView(stripScrollerRef, activeIndex)
  useKeepActiveInView(railScrollerRef, activeIndex)
  if (!activeImage) return null

  // Task 886 R43 (owner O83-1): the counter is a ROW IN NORMAL FLOW above the media region, never an
  // overlay on it — a photo that fills the media region can no longer run under the text. Same rule the
  // thumbnail strip already follows (Task 824 R25: reserved space in flow, never an overlay). `py="md"` is
  // the `md` step the old absolute `top` offset used; `ta="center"` centres it in its column.
  const counter = (
    <Box ta="center" py="md" fz="sm" lh={theme.other.lineHeight.lightboxCounter} className={cn(styles.counter, styles.noShrink)}>
      {labels.counter(activeIndex + 1, images.length)}
    </Box>
  )

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
          media view. Task 886 R42 (owner O83-1): the surface is OPAQUE `var(--overlay)` — the former 95%
          scrim let the page text behind the dialog show through at 5%. Set with the Mantine `bg` style
          prop (an inline style, so it beats `Paper`'s unlayered `background-color`, which a className
          could not). `--overlay` is the single source token this surface reads. */}
      <Modal.Content aria-label={labels.close} bg="var(--overlay)">
        <Modal.Body h="100%" className={styles.body}>
          <Center pos="relative" w="100%" h="100%">
            {/* Close */}
            <GalleryNavActionIcon onClick={onClose} ariaLabel={labels.close} tone="dark" placement={{ top: 'md', right: 'md', raised: true }}>
              <X size={theme.other.iconSize.roomy} />
            </GalleryNavActionIcon>

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
                `min-width:0` (`.minZero` below, Task 825) on this wrapper (kickoff §19, re-verified
                by a kickoff-§20 A/B test — `docs/sessions/evidence/task824/218_r20_ab_wrapper.txt`):
                without it this wrapper's own flex `min-width: auto` floors it wider than
                `maw={theme.other.boxSize.lightboxMediaMaxWidth}`/`mx={theme.other.boxSize.lightboxMediaInlineMargin}`
                (Task 825's migration of the pre-825 `max-w-5xl`/`mx-16`) allow, swallowing the
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
              <Stack
                pos="relative"
                w="100%"
                h="100%"
                maw={theme.other.boxSize.lightboxMediaMaxWidth}
                mx={theme.other.boxSize.lightboxMediaInlineMargin}
                gap={0}
                className={styles.minZero}
              >
                {counter}
                {/* The photo container (Task 886 R43, owner O83-1): the region between the counter row above and
                    the thumbnail strip below, sized only by the flex column (`.fill`: flex 1, min-height 0) and
                    clipping (`.clip`) whatever it holds, so a photo can never paint outside its own bounds. */}
                <Box pos="relative" w="100%" className={cn(styles.fill, styles.clip)}>
                  <AppImage variant="lightbox" src={activeImage.url} alt={`${title} ${activeIndex + 1}`} />
                </Box>
                {/* Thumbnail strip — desktop only, one canonical square per photo, in normal flow
                    beneath the media region (not an absolute overlay — see the comment above).
                    `justify="flex-start"` on the scroll container + `mx="auto"` on the inner row
                    (Task 825's migration of the pre-825 `justify-start`/`mx-auto`; kickoff §19, R35):
                    a centered flex container whose content overflows strands the
                    start-side thumbnails outside `[0, scrollWidth - clientWidth]` — `scrollLeft`
                    can never go negative, so content centered past the container's width is
                    permanently unreachable on the leading side (measured and retained:
                    `docs/sessions/evidence/task824/218_r20_ab_wrapper.txt`, `NEITHER` arm).
                    `mx-auto` on the inner row still centers it when the row is NARROWER than the
                    strip (few photos, no overflow) — auto margins only collapse to 0, left-aligning
                    the row, once the row is wider than its container, which is exactly the
                    overflowing case that must start reachable at `scrollLeft = 0`. */}
                <Group ref={stripScrollerRef} wrap="nowrap" justify="flex-start" px="xs" pt="md" pb="md" className={cn(styles.strip, styles.hiddenScrollbar)}>
                  <Group wrap="nowrap" gap="xs" mx="auto">
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
                  </Group>
                </Group>
              </Stack>
            ) : (
              <Stack w="100%" h="100%" gap={0} className={styles.minZero}>
                {counter}
                <Box ref={mobileContainerRef} {...containerA11yProps} w="100%" className={cn(styles.fill, styles.clip)}>
                  <div ref={trackRef} style={mobileTrackStyle}>
                    {buildWrappedSlides(images).map((img, i) => (
                      <Box key={i} pos="relative" h="100%" style={mobileSlideStyle} className={styles.noShrink}>
                        <AppImage variant="lightbox" src={img.url} alt={title} />
                      </Box>
                    ))}
                  </div>
                </Box>
              </Stack>
            )}

            {/* Pagination indicators — mobile only, position indicators (not clickable thumbnails
                or previews): one thin line segment per photo, the active one filled with the
                brand token. Never dots/pills/circles. Size comes from the registered
                `theme.other.boxSize.paginationSegment(Thickness)` tokens (D824-4); the CSS module
                keeps only what has no dimension role — `border-radius: 0` and the color-mix fill. */}
            {isMobile && images.length > 1 && (
              <Group
                ref={railScrollerRef}
                wrap="nowrap"
                justify="flex-start"
                pos="absolute"
                bottom={resolveGalleryOffset(theme, 'md')}
                left={resolveGalleryOffset(theme, 'md')}
                right={resolveGalleryOffset(theme, 'md')}
                className={cn(styles.paginationRail, styles.hiddenScrollbar)}
                role="presentation"
              >
                <Group wrap="nowrap" gap="xs" mx="auto" className={styles.paginationRow}>
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
                </Group>
              </Group>
            )}
          </Center>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}
