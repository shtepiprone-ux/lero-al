'use client'

import type { ReactNode } from 'react'
import { Tooltip, Box } from '@mantine/core'
import { useResponsiveDropdown, ResponsiveBottomSheet, SheetContent } from './responsiveBottomSheet'

export interface MantineTooltipProps {
  /** Short tooltip text/content (label-like; not rich/interactive content) */
  label: ReactNode
  /** The single trigger element the tooltip describes — an INFO affordance (e.g. an
   *  info icon), NOT an already-interactive control. Must be focusable/tappable. */
  children: ReactNode
  /** Desktop tooltip position; 'top' | 'bottom' | 'left' | 'right'. Default 'top'. Ignored <640. */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Optional heading shown above the label inside the mobile bottom sheet only. */
  title?: ReactNode
}

// TailAdmin §6k (docs/tailadmin-style-reference.md) — chrome extracted 2026-07-02 from
// the live demo (demo.tailadmin.com/tooltips.html; not present in the supplied zip).
// Dark variant (default, cited exactly, not invented): bg gray-800 #1d2939, white text,
// 12px/font-medium(500), radius lg (8px), padding 8px 14px, shadow-md, withArrow. Mantine
// has no shadow token matching TailAdmin's exact shadow-md formula (Mantine's own "md"
// shadow differs numerically) — the raw value below is the cited §6k number, not an
// invented one.
const TOOLTIP_SHADOW_MD = '0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1)' // design-tokens-allow: rgba( — TailAdmin §6k shadow-md exact value, no matching Mantine shadow token (Task 524)

/**
 * Canonical P0-compliant responsive Tooltip.
 *
 * ONE component — no "plain Tooltip vs bottom-sheet Tooltip" choice. Same
 * foundation-consuming shape as `MantinePopover` (self-managed disclosure,
 * span-onClick → `openDrawer()` on mobile), the only difference being the ≥640
 * desktop form: a hover/focus Mantine `Tooltip` (§6k chrome) instead of a
 * click-anchored `Popover`.
 *
 * Desktop (≥640px): Mantine `Tooltip` wrapping `children`, opening on hover AND
 * keyboard focus (Mantine default — not disabled). Chrome is ENTIRELY the §6k
 * extracted values — zero invented color/px/radius/shadow.
 *
 * Mobile (<640px): hover does not exist on touch, so `children` is wrapped in an
 * inline-block span that captures the tap and calls `openDrawer()` (from
 * `useResponsiveDropdown`) → the shared `ResponsiveBottomSheet` (Task 514 source)
 * opens with `label` wrapped in `SheetContent` (Task 520 gutter — `label` is blob
 * content, §19.1a). Backdrop tap + Esc close (foundation default); focus returns
 * to the trigger (Mantine `returnFocus`). `position` has NO effect at <640.
 *
 * SSR/hydration: isMobile=false on first render (Mantine v8
 * getInitialValueInEffect=true). Desktop Tooltip path renders on SSR + initial
 * client render; mobile path mounts after hydration. Sheet always closed on SSR;
 * no flash. Same documented caveat as MantinePopover/MantineModal/MantineDrawer.
 */
export function MantineTooltip({
  label,
  children,
  position = 'top',
  title,
}: MantineTooltipProps) {
  const { isMobile, drawerOpened, openDrawer, closeDrawer } = useResponsiveDropdown()

  if (isMobile) {
    return (
      <>
        <Box
          component="span"
          style={{ display: 'inline-block' }}
          onClick={openDrawer}
        >
          {children}
        </Box>
        <ResponsiveBottomSheet opened={drawerOpened} onClose={closeDrawer} title={title}>
          {/* Task 520 — content gutter: label is blob content (§19.1a), not a row list */}
          <SheetContent>{label}</SheetContent>
        </ResponsiveBottomSheet>
      </>
    )
  }

  return (
    <Tooltip
      label={label}
      position={position}
      // Mantine's own default is { hover: true, focus: false, touch: false } — focus
      // is OFF by default. The kickoff requires keyboard focus to open the tooltip
      // (the a11y path for non-mouse users), so it must be explicitly enabled here.
      events={{ hover: true, focus: true, touch: false }}
      // Task 526 (owner rejection, 2026-07-02): §6k documents TailAdmin's own
      // whitespace-nowrap, correct only for its short demo labels. Our labels are
      // long/localized (sq/en/uk/it) and clipped/overflowed the viewport at it@680
      // under nowrap. multiline + maw wraps long content within a sane bubble width
      // instead — short labels still render compactly. Documented divergence in §6k.
      multiline
      maw="16.25rem" // 260px — Sonnet-picked within the 240-320px kickoff range
      withArrow
      radius="lg"
      color="gray.8"
      c="white"
      fz="xs"
      fw={500}
      py="xs"
      px="0.875rem" // TailAdmin §6k px-3.5 = 14px; no theme spacing token matches 14px exactly (xs=8/sm=12/md=16)
      style={{ boxShadow: TOOLTIP_SHADOW_MD }}
    >
      {children}
    </Tooltip>
  )
}
