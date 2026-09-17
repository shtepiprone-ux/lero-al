'use client'

import type { ReactNode } from 'react'
import { ActionIcon, useMantineTheme, type StyleProp, type MantineSpacing, type MantineTheme } from '@mantine/core'
import { cn } from '@/lib/utils'
import styles from './GalleryNavActionIcon.module.css'

export type GalleryOffset = StyleProp<MantineSpacing | (string & {})>

export interface GalleryNavActionIconPlacement {
  top?: GalleryOffset
  right?: GalleryOffset
  bottom?: GalleryOffset
  left?: GalleryOffset
  /** Vertical center, `top: 50%` + `translateY(-50%)` — the shared vertical anchor both variants use. */
  centerY?: boolean
  /** `z-index: var(--z-dropdown)` — only the controls that must clear sibling content need it. */
  raised?: boolean
}

export interface GalleryNavActionIconProps {
  onClick: () => void
  ariaLabel: string
  placement: GalleryNavActionIconPlacement
  children: ReactNode
  /** Backdrop context: `'light'` (default, an arbitrary photo) or `'dark'` (a near-black scrim). Only the two color tokens change. */
  tone?: 'light' | 'dark'
}

// `top`/`right`/`bottom`/`left` are Mantine Box "size" style props (identity resolver — passes a
// string through unchanged, see @mantine/core's style-props-data.mjs) rather than "spacing" style
// props: unlike `w`/`h`/`mx`, they never resolve a `MantineSpacing` key to `var(--mantine-spacing-*)`
// on their own — measured directly (R6): `top="md"` on a bare Mantine style prop compiles to the
// literal, invalid `top: md`, which the browser drops entirely (the element then falls back to its
// abspos "static position," which a flex ancestor's `align-items` DOES influence per the flexbox
// spec — exactly what moved `LightboxView`'s counter/pagination-rail to mid-screen before this
// fix). Resolving a spacing key ourselves before handing the value to the style prop — the same
// theme.spacing membership test @mantine/core's own spacingResolver uses — keeps `top="md"`
// meaning "theme.spacing.md" everywhere it is used this way: here, and in `LightboxView.tsx`'s own
// counter/pagination-rail (the same `top`/`bottom`+spacing-key shape, reused rather than
// reimplemented, per agent-contract 16b).
export function resolveGalleryOffsetValue(theme: MantineTheme, value: MantineSpacing | (string & {})): string {
  return typeof value === 'string' && value in theme.spacing ? `var(--mantine-spacing-${value})` : String(value)
}

export function resolveGalleryOffset(theme: MantineTheme, value: GalleryOffset | undefined) {
  if (value === undefined) return undefined
  if (typeof value !== 'object') return resolveGalleryOffsetValue(theme, value)
  const resolved: Record<string, string> = {}
  for (const key of Object.keys(value)) {
    resolved[key] = resolveGalleryOffsetValue(theme, (value as Record<string, MantineSpacing | (string & {})>)[key])
  }
  return resolved
}

/**
 * The one canonical overlay nav-arrow / close control for gallery-style `ActionIcon`s. A low-level
 * visual primitive only — it owns size, shape and the two tone color pairs, and takes no position
 * of its own beyond the caller-supplied `placement`. Responsive visibility is the caller's concern
 * (see `GalleryDesktopNavigation`, which is the actual desktop-only prev/next composition).
 */
export function GalleryNavActionIcon({ onClick, ariaLabel, placement, children, tone = 'light' }: GalleryNavActionIconProps) {
  const theme = useMantineTheme()
  const { centerY, raised, top, right, bottom, left } = placement

  return (
    <ActionIcon
      size="xl"
      radius="50%"
      pos="absolute"
      top={resolveGalleryOffset(theme, top)}
      right={resolveGalleryOffset(theme, right)}
      bottom={resolveGalleryOffset(theme, bottom)}
      left={resolveGalleryOffset(theme, left)}
      bg={tone === 'dark' ? 'gray.8' : 'gray.1'}
      c={tone === 'dark' ? 'gray.2' : 'gray.5'}
      onClick={onClick}
      className={cn(centerY && styles.centerY, raised && styles.raised)}
      aria-label={ariaLabel}
    >
      {children}
    </ActionIcon>
  )
}
