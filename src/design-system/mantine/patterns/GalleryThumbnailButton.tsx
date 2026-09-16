'use client'

import { AspectRatio, Image, UnstyledButton, useMantineTheme } from '@mantine/core'

export interface GalleryThumbnailButtonProps {
  src: string
  alt: string
  /** Accessible name for the button — must be unique among sibling thumbnails. */
  label: string
  active: boolean
  onClick: () => void
}

/**
 * The one canonical desktop gallery/lightbox thumbnail: a fixed `theme.other.boxSize.galleryThumb`
 * square that owns its own size, border, radius and clipping on a single element — so the
 * active-state brand border is never cut by a mismatched outer mask. The border is always
 * `theme.other.borderWidth.galleryThumbActive` (`transparent` when inactive), so toggling active
 * state never shifts layout.
 */
export function GalleryThumbnailButton({ src, alt, label, active, onClick }: GalleryThumbnailButtonProps) {
  const theme = useMantineTheme()
  return (
    <UnstyledButton
      onClick={onClick}
      style={{ flexShrink: 0 }}
      aria-label={label}
      aria-current={active ? 'true' : undefined}
    >
      <AspectRatio
        ratio={1}
        w={theme.other.boxSize.galleryThumb}
        bdrs="md"
        bd={`${theme.other.borderWidth.galleryThumbActive} solid ${active ? 'var(--mantine-primary-color-filled)' : 'transparent'}`}
        style={{ overflow: 'hidden' }}
      >
        <Image src={src} alt={alt} fit="cover" />
      </AspectRatio>
    </UnstyledButton>
  )
}
