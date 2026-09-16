'use client'

import type { ReactNode } from 'react'
import { ActionIcon } from '@mantine/core'

export interface GalleryNavActionIconProps {
  onClick: () => void
  ariaLabel: string
  /** Tailwind position-offset utility classes only (e.g. `"left-2 top-1/2 -translate-y-1/2 z-10"`) — sizing/shape stay fixed by this component regardless of tone. */
  className: string
  children: ReactNode
  /** Backdrop context: `'light'` (default, an arbitrary photo) or `'dark'` (a near-black scrim). Only the two color tokens change. */
  tone?: 'light' | 'dark'
}

/**
 * The one canonical overlay nav-arrow / close control for gallery-style `ActionIcon`s. A low-level
 * visual primitive only — it owns size, shape and the two tone color pairs, and takes no position
 * of its own beyond the caller-supplied offset classes. Responsive visibility is the caller's
 * concern (see `GalleryDesktopNavigation`, which is the actual desktop-only prev/next composition).
 */
export function GalleryNavActionIcon({ onClick, ariaLabel, className, children, tone = 'light' }: GalleryNavActionIconProps) {
  return (
    <ActionIcon
      size="xl"
      radius="50%"
      pos="absolute"
      bg={tone === 'dark' ? 'gray.8' : 'gray.1'}
      c={tone === 'dark' ? 'gray.2' : 'gray.5'}
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </ActionIcon>
  )
}
