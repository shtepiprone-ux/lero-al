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
    maxHeight: '90dvh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: { paddingBottom: 0 },
  // Stretch the title slot to the full header width so the centered DragHandle
  // centers across the whole sheet (Mantine's .mantine-Drawer-title is otherwise
  // content-width under the header's justify-content:space-between → handle drifts left).
  title: { width: '100%' },
  body: { flex: 1, overflowY: 'auto' as const, padding: 0 },
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
    <Box style={{ display: 'flex', justifyContent: 'center', paddingBottom: '0.5rem' }}>
      <Box
        style={{
          width: '2.5rem',
          height: '0.25rem',
          borderRadius: '9999px',
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
      styles={bottomSheetDrawerStyles}
    >
      {children}
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
