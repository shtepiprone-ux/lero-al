'use client'

import { Center, useMantineTheme, type MantineThemeOther } from '@mantine/core'
import { Image as ImageIcon } from 'lucide-react'

interface MediaPlaceholderProps {
  /** Theme icon-size key (`theme.other.iconSize`) for the picture glyph. */
  iconSize: keyof MantineThemeOther['iconSize']
  /** Accessible name (the image's alt text). Empty → the placeholder is decorative (`aria-hidden`). */
  label: string
}

/**
 * Canonical photo placeholder (Task 886 R21, owner O83-1 2026-09-30): a neutral grey field with a
 * picture glyph centred in it, shown by `AppImage` when a photo has no `src` or fails to load, so
 * a broken `<img>` (browser glyph + alt text) never shows inside a frame.
 *
 * Fills its positioned parent (`AppImage`'s `.frame` is `position: relative`). Colours are the
 * TailAdmin gray scale from `theme.ts` (`gray.2` field, `gray.5` glyph ≈ 4:1, above the 3:1 a
 * graphic needs); the glyph size is a `theme.other.iconSize` key. No px/rem, CSS rule or `style`.
 */
export function MediaPlaceholder({ iconSize, label }: MediaPlaceholderProps) {
  const theme = useMantineTheme()
  const labelled = label.length > 0
  return (
    <Center
      pos="absolute"
      inset={0}
      bg="gray.2"
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? label : undefined}
      aria-hidden={labelled ? undefined : true}
      data-testid="media-placeholder"
    >
      <ImageIcon size={theme.other.iconSize[iconSize]} color={theme.colors.gray[5]} aria-hidden />
    </Center>
  )
}
