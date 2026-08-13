'use client'

import type { CSSProperties } from 'react'
import { Modal, ActionIcon, UnstyledButton } from '@mantine/core'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { AppImage } from '@/components/ui/AppImage'
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

/**
 * `ActionIcon`'s CSS module rules (`background: var(--ai-bg)`, `color: var(--ai-color)`,
 * `position: relative` on its own root for the loader/ripple) are unlayered and always outrank a
 * Tailwind `@layer utilities` class regardless of specificity — confirmed empirically (rendered
 * `position: relative` + brand-red icon + transparent bg instead of the intended absolute
 * translucent round button, the exact class of bug documented in
 * `mantine-responsive-design-system.md` §18.1 / Task 602/606). Fix: drive `position` AND
 * Mantine's own `--ai-*` custom properties inline — `position` wins outright (inline always
 * wins), and the `--ai-*` vars feed Mantine's OWN `:hover` rule, so the hover interaction still
 * works natively instead of needing a JS-driven hover state.
 */
const LIGHTBOX_ACTION_ICON_STYLE = {
  position: 'absolute',
  '--ai-bg': 'color-mix(in oklab, var(--color-overlay-foreground) 10%, transparent)',
  '--ai-hover': 'color-mix(in oklab, var(--color-overlay-foreground) 20%, transparent)',
  '--ai-color': 'var(--color-overlay-foreground)',
  '--ai-hover-color': 'var(--color-overlay-foreground)',
} as CSSProperties

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
      {/* No Modal.Overlay — this component's own scrim (bg-overlay/95 equivalent on Content) IS
          the backdrop; a second Mantine overlay would double-darken. Compound API (not the
          shorthand <Modal>) so aria-label lands on Modal.Content — the actual role="dialog"
          element — instead of the outer root wrapper (verified via Mantine source: the
          shorthand spreads extra props onto ModalRoot→ModalBase's Box, not ModalBaseContent's
          Paper). No Modal.Header — a visible title bar would break the full-bleed media view.
          Scrim color via inline `style`, NOT a `bg-overlay/95` className — same cascade-layer
          trap as `LIGHTBOX_ACTION_ICON_STYLE` above (Mantine's `Paper`, which `Modal.Content`
          renders through, sets its own unlayered `background-color`). `--color-overlay` is the
          exact semantic token `bg-overlay` itself resolves to. */}
      <Modal.Content
        aria-label={labels.close}
        style={{ backgroundColor: 'color-mix(in oklab, var(--color-overlay) 95%, transparent)' }}
      >
        <Modal.Body className="h-full flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close */}
            <ActionIcon
              variant="transparent"
              size="xl"
              radius="xl"
              mih="2.75rem"
              miw="2.75rem"
              onClick={onClose}
              className="top-4 right-4 z-10"
              style={LIGHTBOX_ACTION_ICON_STYLE}
              aria-label={labels.close}
            >
              <X className="size-5" />
            </ActionIcon>

            {/* Counter */}
            <div className={cn(styles.counter, 'absolute top-4 left-1/2 -translate-x-1/2 text-sm')}>
              {labels.counter(activeIndex + 1, images.length)}
            </div>

            {/* Prev */}
            {images.length > 1 && (
              <ActionIcon
                variant="transparent"
                size="xl"
                radius="xl"
                mih="2.75rem"
                miw="2.75rem"
                onClick={onPrev}
                className="left-3 sm:left-6"
                style={LIGHTBOX_ACTION_ICON_STYLE}
                aria-label={labels.prev}
              >
                <ChevronLeft className="size-6" />
              </ActionIcon>
            )}

            {/* Image */}
            <div className="relative w-full h-full max-w-5xl max-h-[85vh] mx-16">
              <AppImage variant="lightbox" src={activeImage.url} alt={`${title} ${activeIndex + 1}`} />
            </div>

            {/* Next */}
            {images.length > 1 && (
              <ActionIcon
                variant="transparent"
                size="xl"
                radius="xl"
                mih="2.75rem"
                miw="2.75rem"
                onClick={onNext}
                className="right-3 sm:right-6"
                style={LIGHTBOX_ACTION_ICON_STYLE}
                aria-label={labels.next}
              >
                <ChevronRight className="size-6" />
              </ActionIcon>
            )}

            {/* Thumbnail strip */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto px-2">
              {images.map((img, i) => (
                <UnstyledButton
                  key={i}
                  onClick={() => onSelect(i)}
                  className={cn(
                    'relative h-14 w-20 shrink-0 rounded-lg overflow-hidden border-2',
                    activeIndex === i ? 'opacity-100' : 'opacity-60 hover:opacity-100',
                  )}
                  style={{ borderColor: activeIndex === i ? 'var(--color-overlay-foreground)' : 'transparent' }}
                >
                  <AppImage variant="gallery-strip" src={img.url} alt="" />
                </UnstyledButton>
              ))}
            </div>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}
