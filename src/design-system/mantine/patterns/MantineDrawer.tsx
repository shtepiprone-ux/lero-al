'use client'

import type { ReactNode } from 'react'
import { Drawer, Stack, Box } from '@mantine/core'
import { useResponsiveDropdown, ResponsiveBottomSheet, SheetContent } from './responsiveBottomSheet'

export interface MantineDrawerProps {
  /** Controlled open state */
  opened: boolean
  /** Close handler — fired by backdrop tap, Esc, and the close affordance */
  onClose: () => void
  /** Heading (below the drag handle on mobile; Drawer title on desktop) */
  title?: ReactNode
  /** Body content (arbitrary) */
  children: ReactNode
  /** Optional actions region rendered below the body (caller composes buttons) */
  footer?: ReactNode
  /** Desktop drawer side; 'left' | 'right'. Default 'right'. Ignored <640 (always bottom sheet). */
  side?: 'left' | 'right'
  /** Desktop drawer width (Mantine size token); default 'md'. Ignored <640. */
  size?: string
}

/**
 * Canonical P0-compliant responsive Drawer.
 *
 * ONE component — no "plain Drawer vs bottom-sheet Drawer" choice. Ports the legacy
 * `src/components/ui/sheet.tsx` behavior onto the Task 514 single-source foundation.
 *
 * Same controlled shape as `MantineModal` (519) — the caller owns `opened`/`onClose`
 * and supplies its own trigger; this component only renders the overlay content. The
 * ONLY difference from `MantineModal` is the ≥640 desktop form: a **side** Mantine
 * `Drawer` (`side` prop, default `'right'`) instead of a centered `Modal`.
 *
 * Desktop (≥640px): side Mantine `Drawer` (`position={side}`, `size`) with `title`,
 * then a `<Stack gap="md">` (matches `MantineModal`'s Task 521 body/actions rhythm)
 * containing `<Box>{children}</Box>` and `footer`. Standard X/backdrop/Esc close.
 *
 * Mobile (<640px): the shared `ResponsiveBottomSheet` (Task 514 single source) —
 * edge-to-edge, top-only radius, centered DragHandle, ≤90dvh internal scroll. `side`
 * has NO effect at <640 (the mobile form is always the bottom sheet). `children`/
 * `footer` wrapped in `SheetContent` (Task 520 gutter) + the same `Stack gap="md"`
 * composition as the desktop branch.
 *
 * SSR/hydration: isMobile=false on first render (Mantine v8 getInitialValueInEffect
 * =true). The overlay is controlled and closed by the caller on first paint, so no
 * flash occurs. Same documented caveat as MantineModal/MantinePopover/etc.
 */
export function MantineDrawer({
  opened,
  onClose,
  title,
  children,
  footer,
  side = 'right',
  size = 'md',
}: MantineDrawerProps) {
  const { isMobile } = useResponsiveDropdown()

  if (isMobile) {
    return (
      <ResponsiveBottomSheet opened={opened} onClose={onClose} title={title}>
        <SheetContent>
          <Stack gap="md">
            <Box>{children}</Box>
            {footer}
          </Stack>
        </SheetContent>
      </ResponsiveBottomSheet>
    )
  }

  return (
    <Drawer opened={opened} onClose={onClose} title={title} position={side} size={size}>
      <Stack gap="md">
        <Box>{children}</Box>
        {footer}
      </Stack>
    </Drawer>
  )
}
