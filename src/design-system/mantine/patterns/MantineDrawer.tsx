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
 * Task 567 round-2 Fix 4 (owner 2026-07-09) — the pinned footer treatment.
 *
 * A first attempt reused `position:sticky` (the `MantineResponsiveActionFooter` pattern).
 * That is WRONG in this context: a `position:sticky;bottom:0` element is already visually
 * "stuck" at the bottom of the viewport from the FIRST frame whenever total content exceeds
 * the viewport — it does not wait for the user to scroll past it. Padding the scroll region
 * by the footer's height (tried next) does not help either: sticky/fixed/absolute all just
 * anchor an element to a fixed SCREEN position, while the scrollable region's own viewport
 * still spans behind it at every scroll position, including 0 — caught live via
 * `screenshots:assert` (`element-overlap`, the market-type row behind the Apply/Reset
 * buttons at the INITIAL, unscrolled screenshot).
 *
 * The only construction that has NO overlap at any scroll position is a genuine flex-column
 * split: the footer occupies its OWN dedicated, non-shrinking space; the scrollable region is
 * a SEPARATE sibling whose own viewport is physically bounded above the footer (`flex:1`,
 * `overflow-y:auto`) — never extends behind it. This is exactly what the kickoff specifies
 * ("`.mantine-Drawer-body` a flex column … `children` in a `flex:1; overflow-y:auto` scroll
 * region; `footer` a non-shrinking sibling pinned below it").
 */
function DrawerBodyLayout({
  children,
  footer,
  contentPadding,
}: {
  children: ReactNode
  footer?: ReactNode
  /** Padding the scroll region needs to replace what Mantine's own body padding used to give
   * (body's own padding is set to 0 so only the scroll region — not the footer — gets inset). */
  contentPadding: string
}) {
  return (
    <>
      <Box
        data-testid="mantine-drawer-scroll-content"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: contentPadding }}
      >
        <Stack gap="md">
          <Box>{children}</Box>
        </Stack>
      </Box>
      {footer && (
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
      )}
    </>
  )
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
 * Desktop (≥640px): side Mantine `Drawer` (`position={side}`, `size`) with `title`
 * (bottom-bordered when present — Task 567 round-2 Fix 2). `.mantine-Drawer-content`
 * becomes a non-scrolling flex column (`overflow:hidden` — Mantine's own header stays
 * `position:sticky` but that's now inert since nothing scrolls at that level); `body`
 * becomes a flex column too (`flex:1`, own `overflow:hidden`, zero padding) containing
 * the true scroll region (`flex:1`, `overflow-y:auto`) and the pinned footer as a
 * non-shrinking sibling (Fix 4) — never overlapping, at any scroll position.
 *
 * Mobile (<640px): the shared `ResponsiveBottomSheet` (Task 514 single source) —
 * edge-to-edge, top-only radius, centered DragHandle, ≤90dvh internal scroll, header
 * bottom-bordered when a title is present (Fix 2, applied inside `ResponsiveBottomSheet`
 * itself so title-less consumers stay undivided). `side` has NO effect at <640 (the
 * mobile form is always the bottom sheet). The SAME flex-column split (Fix 4) is applied
 * to `ResponsiveBottomSheet`'s own body ONLY when a `footer` is passed — title-less/
 * footer-less consumers (Select/Popover/DropdownMenu/NavigationMenu/Combobox/Tooltip)
 * keep their original single-scroll-region body untouched.
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
      <ResponsiveBottomSheet opened={opened} onClose={onClose} title={title} footer={footer}>
        <SheetContent>
          <Stack gap="md">
            <Box>{children}</Box>
          </Stack>
        </SheetContent>
      </ResponsiveBottomSheet>
    )
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={title}
      position={side}
      size={size}
      styles={{
        // Task 567 round-2 Fix 2: bottom border under the header, only when a title is
        // present — same canonical gray-3 divider token as MantineResponsiveActionFooter's
        // borderTop (zero invented value).
        header: title ? { borderBottom: '1px solid var(--mantine-color-gray-3)' } : undefined,
        // Task 567 round-2 Fix 4: content/body become non-scrolling flex columns — the true
        // scroll region + pinned footer (DrawerBodyLayout) take over scrolling one level in.
        content: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' },
      }}
    >
      <DrawerBodyLayout footer={footer} contentPadding="var(--mantine-spacing-md)">
        {children}
      </DrawerBodyLayout>
    </Drawer>
  )
}
