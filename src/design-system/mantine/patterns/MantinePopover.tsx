'use client'

import type { ReactNode } from 'react'
import { Popover, Drawer, Box, Text } from '@mantine/core'
import type { PopoverProps } from '@mantine/core'
import { useResponsiveDropdown, bottomSheetDrawerStyles } from './MantineSelect'

// Drag handle — replicates the private DragHandle in MantineSelect.tsx (not exported from foundation).
// P0 bottom-sheet exemption: 2.5rem/0.25rem sizing + gray-3 token already used by MantineSelect.
function DragHandle() {
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

export interface MantinePopoverProps {
  /** Trigger element — activates the popover on click (must forward refs for Popover.Target on desktop) */
  trigger: ReactNode
  /** Arbitrary content rendered in the anchored popover (≥640) or bottom sheet (<640) */
  children: ReactNode
  /** Disable trigger — does not open the popover or bottom sheet on either path */
  disabled?: boolean
  /** Optional title shown in the bottom sheet header (mobile only) */
  title?: ReactNode
  /** Desktop anchored dropdown position */
  position?: PopoverProps['position']
  /** Desktop dropdown width */
  width?: PopoverProps['width']
  /** Show arrow on desktop anchored popover */
  withArrow?: boolean
  /** Offset from trigger in px (desktop) */
  offset?: number
}

/**
 * Canonical P0-compliant responsive Popover.
 *
 * ONE component — no "plain Popover vs bottom-sheet Popover" choice.
 * Anchored Mantine Popover at ≥640px; full-width bottom sheet at <640px.
 * Consumes the Task 509 foundation (useResponsiveDropdown + bottomSheetDrawerStyles)
 * from MantineSelect.tsx — same single source as MantineSelect; no copy-pasted block.
 *
 * Desktop (≥640px): Mantine Popover in uncontrolled mode, anchored to trigger.
 * Position, width, and arrow are configurable.
 *
 * Mobile (<640px): clicking the trigger opens a P0-compliant bottom Drawer —
 * edge-to-edge, top-only radius, centered drag handle, ≤90dvh internal scroll,
 * backdrop tap + Esc to close, returnFocus=true. Disabled trigger is a no-op.
 *
 * Accepts arbitrary children — no Select-option structure imposed.
 *
 * Mobile click mechanism: at <640 the trigger is wrapped in an inline-block span
 * that captures the click event (bubbled from the trigger button) and calls openDrawer().
 * This avoids Mantine Popover's controlled-mode onChange behaviour (in Mantine v8,
 * onChange fires with the current value, not !current, making the pattern unusable
 * for suppressed-dropdown interception). The span is a direct event capture — reliable
 * and independent of Mantine's internal state machine.
 *
 * SSR/hydration: isMobile=false on first render (Mantine v8 getInitialValueInEffect=true).
 * On SSR and initial client render the desktop Popover path is used. After hydration,
 * useMediaQuery resolves and the mobile path mounts. No user interaction is possible
 * before this switch so the transition is imperceptible. Same documented caveat as
 * MantineDialogDrawerPattern and MantineSelect.
 */
export function MantinePopover({
  trigger,
  children,
  disabled = false,
  title,
  position = 'bottom',
  width = 'max-content',
  withArrow = false,
  offset = 4,
}: MantinePopoverProps) {
  const { isMobile, drawerOpened, openDrawer, closeDrawer } = useResponsiveDropdown()

  return (
    <>
      {isMobile ? (
        /* Mobile: span captures click from the trigger button (click bubbles up) → openDrawer().
           No Mantine Popover involved on this path — no double-portal, no focus-trap conflict. */
        <Box
          component="span"
          style={{ display: 'inline-block' }}
          onClick={() => { if (!disabled) openDrawer() }}
        >
          {trigger}
        </Box>
      ) : (
        /* Desktop: standard uncontrolled Mantine Popover, opens/closes on trigger click. */
        <Popover
          position={position}
          width={width}
          withArrow={withArrow}
          offset={offset}
          disabled={disabled}
        >
          <Popover.Target>{trigger}</Popover.Target>
          <Popover.Dropdown>{children}</Popover.Dropdown>
        </Popover>
      )}

      {/* P0 bottom sheet — only mounted after hydration when isMobile=true */}
      {isMobile && (
        <Drawer
          opened={drawerOpened}
          onClose={closeDrawer}
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
      )}
    </>
  )
}
