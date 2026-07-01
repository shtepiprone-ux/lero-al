'use client'

import type { ReactNode } from 'react'
import { Modal, Stack, Box } from '@mantine/core'
import { useResponsiveDropdown, ResponsiveBottomSheet, SheetContent } from './responsiveBottomSheet'

export interface MantineModalProps {
  /** Controlled open state */
  opened: boolean
  /** Close handler — fired by backdrop tap, Esc, and the close affordance */
  onClose: () => void
  /** Heading (below the drag handle on mobile; Modal title on desktop) */
  title?: ReactNode
  /** Body content (arbitrary) */
  children: ReactNode
  /** Optional actions region rendered below the body (caller composes buttons) */
  footer?: ReactNode
  /** Desktop centered-Modal size (Mantine size token); default 'md'. Ignored <640. */
  size?: string
}

/**
 * Canonical P0-compliant responsive Modal.
 *
 * ONE component — no "plain Modal vs bottom-sheet Modal" choice.
 * Centered Mantine Modal at ≥640px; full-width bottom sheet at <640px.
 * Consumes the Task 514 single-source foundation (useResponsiveDropdown +
 * ResponsiveBottomSheet from ./responsiveBottomSheet) — same source as
 * MantineSelect/MantinePopover/MantineDropdownMenu/MantineNavigationMenu;
 * no copy-pasted DragHandle or Drawer block.
 *
 * Unlike MantinePopover/MantineDropdownMenu (uncontrolled trigger-wrapping
 * overlays), MantineModal is fully controlled — the caller owns `opened`/
 * `onClose` and supplies its own trigger; this component only renders the
 * overlay content.
 *
 * Desktop (≥640px): centered Mantine `Modal` (`centered`, `radius="md"`,
 * configurable `size`) with `title`, then a `<Stack gap="md">` (Task 521 —
 * matches the `MantineDialogDrawerPattern` body/actions rhythm) containing
 * exactly two slots: `<Box>{children}</Box>` and `footer`. `children` is
 * wrapped in a `Box` so a multi-element `children` (e.g. an array of several
 * `Text` paragraphs) collapses into ONE Stack item — Stack's `gap` is a CSS
 * row-gap applied BETWEEN its direct children, so without this wrapper a
 * multi-paragraph `children` would get the 16px gap inserted between every
 * paragraph too, not just once between body and footer. `footer=undefined`
 * renders no second Stack item, so no phantom gap. Standard X/backdrop/Esc
 * close; focus returns to the opener (Mantine default `returnFocus`).
 *
 * Mobile (<640px): the shared `ResponsiveBottomSheet` — edge-to-edge,
 * top-only radius, centered DragHandle, ≤90dvh internal scroll. Inside
 * `SheetContent` (Task 520 — the sheet's `body` is `padding:0` by design so
 * row-based consumers can render edge-to-edge tap rows; an arbitrary-content
 * consumer like this one must supply its own 16px gutter), the same
 * `<Stack gap="md">` + `<Box>{children}</Box>` + `footer` composition (Task
 * 521) as the desktop path — one 16px vertical gap between body and footer,
 * never between individual body paragraphs. The primitive does not impose a
 * stacked/row footer INTERNAL layout (that is caller composition, e.g. the
 * story's `Flex direction={{ base: 'column-reverse', sm: 'row' }}` footer).
 * Backdrop tap + Esc close (foundation default), focus returns to the opener.
 *
 * SSR/hydration: isMobile=false on first render (Mantine v8
 * getInitialValueInEffect=true). On SSR and initial client render the
 * desktop Modal path is used. After hydration, useMediaQuery resolves and
 * the mobile path mounts. The overlay is controlled and closed by the
 * caller on first paint, so no flash occurs. Same documented caveat as
 * MantinePopover/MantineDropdownMenu/MantineNavigationMenu.
 */
export function MantineModal({
  opened,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: MantineModalProps) {
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
    <Modal opened={opened} onClose={onClose} title={title} centered radius="md" size={size}>
      <Stack gap="md">
        <Box>{children}</Box>
        {footer}
      </Stack>
    </Modal>
  )
}
