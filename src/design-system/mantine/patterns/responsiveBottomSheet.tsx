'use client'

import type { ReactNode } from 'react'
import { Drawer, Box, Text } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'

// ── Shared bottom-sheet Drawer styles ────────────────────────────────────────
// Canonical P0 bottom-sheet treatment (single source of truth for Batch C overlays).
// Justified raw values: 2.5rem/0.25rem drag handle, 90dvh, 0.5rem padding-bottom
// are P0 bottom-sheet exemptions mirroring MantineDialogDrawerPattern (Task 482).
export const bottomSheetDrawerStyles = {
  content: {
    borderRadius: 'var(--mantine-radius-lg) var(--mantine-radius-lg) 0 0',
    // Drawer size="auto" leaves Mantine's --drawer-height/--drawer-size vars
    // unresolved, so the class-level height falls back to 100% (Task 522
    // diagnosis) and only maxHeight clamped it back down to 90dvh — meaning
    // the sheet always rendered at exactly 90dvh regardless of content.
    // Explicit height:'auto' restores content-driven sizing; maxHeight still
    // caps long content at 90dvh.
    height: 'auto',
    maxHeight: '90dvh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: { paddingBottom: 0 },
  // Stretch the title slot to the full header width so the centered DragHandle
  // centers across the whole sheet (Mantine's .mantine-Drawer-title is otherwise
  // content-width under the header's justify-content:space-between → handle drifts left).
  title: { width: '100%' },
  // minHeight:0 overrides the flex-item default (min-height:auto, i.e.
  // content's intrinsic min-content size), which otherwise prevents body from
  // shrinking to the available space once `content` is clamped at 90dvh —
  // without it, long content would overflow instead of scrolling internally.
  body: { flex: 1, minHeight: 0, overflowY: 'auto' as const, padding: 0 },
  inner: { padding: 0 },
}

// ── Foundation hook ───────────────────────────────────────────────────────────
/**
 * useResponsiveDropdown — shared foundation hook for dropdown → bottom-sheet at <640px.
 *
 * Returns isMobile state + Drawer open/close controls. Batch C overlays (Popover,
 * Menu, Combobox, NavigationMenu) consume this hook alongside ResponsiveBottomSheet
 * to build the P0 bottom-sheet pattern without copy-pasting.
 *
 * SSR/hydration caveat: isMobile returns false on first render (getInitialValueInEffect=true
 * in Mantine v8 — query evaluated in useEffect after hydration). Drawer is always closed on
 * SSR; no visible flash. Same documented trade-off as MantineDialogDrawerPattern.
 */
export function useResponsiveDropdown() {
  const isMobile = useMediaQuery('(max-width: 40em)')
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false)
  return {
    isMobile: isMobile ?? false,
    drawerOpened,
    openDrawer,
    closeDrawer,
  }
}

// ── Shared DragHandle ─────────────────────────────────────────────────────────
// ONE definition — Batch C overlays consume this through ResponsiveBottomSheet;
// never duplicate. Justified raw sizes: 2.5rem × 0.25rem P0 exemption.
export function DragHandle() {
  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: '0.5rem', // design-tokens-allow: : '0.5rem' — genuine N1, reserved Task 734, not remediated here per Task 717 R7; an exact project spacing token exists
      }}
    >
      <Box
        style={{
          width: '2.5rem', // design-tokens-allow: : '2.5rem' — canonical drag-handle geometry — non-tokenized affordance per the original allowlist reason, no project token represents this fixed swipe-affordance size
          height: '0.25rem', // design-tokens-allow: : '0.25rem' — canonical drag-handle geometry — non-tokenized affordance per the original allowlist reason, no project token represents this fixed swipe-affordance size
          borderRadius: '9999px', // design-tokens-allow: : '9999px' — canonical drag-handle geometry — non-tokenized affordance per the original allowlist reason, no project token represents this fixed swipe-affordance size
          backgroundColor: 'var(--mantine-color-gray-3)',
        }}
      />
    </Box>
  )
}

// ── ResponsiveBottomSheet ─────────────────────────────────────────────────────
export interface ResponsiveBottomSheetProps {
  opened: boolean
  onClose: () => void
  /** Optional heading rendered below the drag handle */
  title?: ReactNode
  children: ReactNode
  /**
   * Optional pinned footer (Task 567 round-2 Fix 4). When present, `body` becomes a true
   * flex-column split — `children` scroll in their own `flex:1; overflow-y:auto` region,
   * `footer` is a non-shrinking sibling that is NEVER scrolled behind or overlapped, at any
   * scroll position (unlike `position:sticky`, which anchors to a fixed screen position while
   * the scrollable viewport still spans behind it — see `MantineDrawer.tsx`'s `DrawerBodyLayout`
   * docstring for why that was tried first and rejected). Additive/optional: consumers that
   * pass no `footer` (Select/Popover/DropdownMenu/NavigationMenu/Combobox/Tooltip) keep the
   * original single-scroll-region `body` untouched.
   */
  footer?: ReactNode
}

/**
 * Canonical P0 full-width bottom-sheet wrapper for Batch C overlays.
 *
 * Wraps Mantine Drawer with the fixed P0 chrome:
 *   - bottom-anchored, edge-to-edge (inner padding 0)
 *   - top-only radius (radius-lg on top, 0 on bottom)
 *   - centered DragHandle at top of header
 *   - optional title text (fw=600, sm, gray.8) below the handle
 *   - ≤90dvh max-height, internal body scroll (flex column)
 *   - withCloseButton=false, returnFocus=true
 *   - closes on backdrop tap or Esc (Mantine Drawer default)
 *
 * Consumed by MantineSelect (options list) and MantinePopover (arbitrary content).
 * Every additional Batch C overlay (DropdownMenu, NavigationMenu, Tooltip) should
 * consume this wrapper — not duplicate the Drawer block.
 */
export function ResponsiveBottomSheet({
  opened,
  onClose,
  title,
  children,
  footer,
}: ResponsiveBottomSheetProps) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      withCloseButton={false}
      size="auto"
      returnFocus
      title={
        <Box>
          <DragHandle />
          {title && (
            <Text fw={600} size="sm" c="gray.8">
              {title}
            </Text>
          )}
        </Box>
      }
      styles={{
        ...bottomSheetDrawerStyles,
        // Task 567 round-2 Fix 2 (owner 2026-07-09): a bottom border under the header, ONLY
        // when a title is present — drag-handle-only sheets (Select/Popover/Menu/Nav option
        // lists with no title) must NOT gain a stray divider. Value = the same canonical
        // gray-3 divider token MantineResponsiveActionFooter already uses for its borderTop
        // (zero invented value). Layered on top of the shared static bottomSheetDrawerStyles.header
        // (not mutated — every consumer that imports that object directly stays untouched).
        //
        // Task 584 (owner-reported 2026-07-11): the title rendered flush against this divider
        // because bottomSheetDrawerStyles.header's paddingBottom:0 stayed 0 even with the
        // divider added. `var(--mantine-spacing-md)` (16px) restores the same rhythm unit
        // already reused everywhere else in this file (footer Box padding, SheetContent's
        // `pb="md"` gutter) and matches Mantine's own default ModalBase header padding (top
        // AND bottom both `var(--mantine-spacing-md)` by default — see .m_b5489c3c in
        // @mantine/core/styles/ModalBase.css), so top/bottom stay symmetric. Title-less sheets
        // are untouched — this only applies inside the same `title ?` branch as the divider.
        header: {
          ...bottomSheetDrawerStyles.header,
          ...(title ? { borderBottom: '1px solid var(--mantine-color-gray-3)', paddingBottom: 'var(--mantine-spacing-md)' } : {}),
        },
        // Task 567 round-2 Fix 4: body becomes ITS OWN flex column (not a single scroll
        // region) ONLY when a footer is passed — every other consumer's body stays exactly
        // bottomSheetDrawerStyles.body (unmutated, unchanged).
        //
        // Task 584 (owner-reported 2026-07-11, re-scoped): bottomSheetDrawerStyles.body's
        // padding:0 left the divider→content gap at 0px on titled sheets (the primary
        // defect — row-based consumers' first row and SheetContent's blob both touched the
        // divider). `var(--mantine-spacing-md)` (16px) is the same rhythm unit as the header
        // paddingBottom above, restoring a balanced gap on both sides of the divider. Only
        // the TOP is overridden — padding-left/right stay 0 so row-based consumers keep
        // full-width edge-to-edge rows. Title-less sheets are untouched (padding:0 unchanged).
        body: {
          ...(footer
            ? { ...bottomSheetDrawerStyles.body, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }
            : bottomSheetDrawerStyles.body),
          ...(title ? { paddingTop: 'var(--mantine-spacing-md)' } : {}),
        },
      }}
    >
      {footer ? (
        <>
          <Box data-testid="mantine-drawer-scroll-content" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {children}
          </Box>
          <Box
            data-testid="mantine-drawer-footer"
            style={{
              flexShrink: 0,
              backgroundColor: 'var(--mantine-color-body)',
              borderTop: '1px solid var(--mantine-color-gray-3)',
              padding: 'var(--mantine-spacing-md)',
            }}
          >
            {footer}
          </Box>
        </>
      ) : (
        children
      )}
    </Drawer>
  )
}

// ── SheetContent ──────────────────────────────────────────────────────────────
export interface SheetContentProps {
  children: ReactNode
}

/**
 * Canonical content gutter for arbitrary-content `ResponsiveBottomSheet` consumers
 * (Task 520 — Defect A fix).
 *
 * `ResponsiveBottomSheet`'s body is `padding: 0` so that row-based consumers
 * (`MantineSelect` options, `MantineDropdownMenu`/`MantineNavigationMenu` items) can
 * render ≥44px tap rows that span the full sheet width, each row supplying its own
 * `px="md"` inset for the label. A consumer whose content is an arbitrary blob
 * (not a list of full-width rows) — `MantineModal`, `MantinePopover` — must wrap that
 * content in `SheetContent` so it aligns with the sheet's title inset instead of
 * bleeding to the sheet's edges. Gutter = `px="md"` (16px) + `pb="md"`, matching the
 * §6i Select option-row padding value. Purely additive: does not alter
 * `ResponsiveBottomSheet`/`DragHandle`/`useResponsiveDropdown`/`bottomSheetDrawerStyles`.
 */
export function SheetContent({ children }: SheetContentProps) {
  return (
    <Box px="md" pb="md">
      {children}
    </Box>
  )
}
