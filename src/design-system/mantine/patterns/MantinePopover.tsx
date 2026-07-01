'use client'

import type { ReactNode } from 'react'
import { Popover, Box } from '@mantine/core'
import type { PopoverProps } from '@mantine/core'
import { useResponsiveDropdown, ResponsiveBottomSheet, SheetContent } from './responsiveBottomSheet'

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
  /**
   * Icon-only trigger exemption (clause 11). Set true for ⋮ kebab / icon-only triggers
   * to keep them compact at <640. Default false = text trigger = full-width at <640.
   */
  iconOnlyTrigger?: boolean
}

/**
 * Canonical P0-compliant responsive Popover.
 *
 * ONE component — no "plain Popover vs bottom-sheet Popover" choice.
 * Anchored Mantine Popover at ≥640px; full-width bottom sheet at <640px.
 * Consumes the Task 514 single-source foundation (useResponsiveDropdown +
 * ResponsiveBottomSheet from ./responsiveBottomSheet) — same source as MantineSelect;
 * no copy-pasted DragHandle or Drawer block.
 *
 * Desktop (≥640px): Mantine Popover in uncontrolled mode, anchored to trigger.
 * Position, width, and arrow are configurable.
 *
 * Mobile (<640px): clicking the trigger opens a P0-compliant ResponsiveBottomSheet —
 * edge-to-edge, top-only radius, DragHandle, ≤90dvh internal scroll,
 * backdrop tap + Esc to close, returnFocus=true. Disabled trigger is a no-op.
 * `children` are wrapped in `SheetContent` (Task 520) so arbitrary popover content
 * gets a 16px gutter instead of bleeding to the sheet's edges — the sheet body is
 * `padding:0` by design for row-based consumers (Select/DropdownMenu/NavigationMenu),
 * so a blob-content consumer like this one supplies its own inset.
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
  iconOnlyTrigger = false,
}: MantinePopoverProps) {
  const { isMobile, drawerOpened, openDrawer, closeDrawer } = useResponsiveDropdown()

  return (
    <>
      {isMobile ? (
        /* Mobile: click is captured on the wrapper and delegates to openDrawer().
           Text trigger (default): flex column container so the trigger fills full width
           via align-items:stretch without needing to clone/patch the ReactNode.
           Icon-only exemption (iconOnlyTrigger=true): inline-block keeps it compact. */
        <Box
          component={iconOnlyTrigger ? 'span' : 'div'}
          style={iconOnlyTrigger
            ? { display: 'inline-block' }
            : { display: 'flex', flexDirection: 'column' }
          }
          onClick={() => { if (!disabled) openDrawer() }}
        >
          {trigger}
        </Box>
      ) : (
        /* Desktop: alignSelf:flex-start prevents a Stack align="stretch" parent from
           over-stretching the trigger — trigger renders at natural content width. */
        <Box style={{ alignSelf: 'flex-start' }}>
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
        </Box>
      )}

      {/* P0 bottom sheet — rendered via shared foundation (Task 514) */}
      {isMobile && (
        <ResponsiveBottomSheet
          opened={drawerOpened}
          onClose={closeDrawer}
          title={title}
        >
          {/* Task 520 — content gutter: the sheet body is padding:0 by design
              (row-based consumers need edge-to-edge tap rows), so arbitrary
              popover content must supply its own inset via SheetContent. */}
          <SheetContent>{children}</SheetContent>
        </ResponsiveBottomSheet>
      )}
    </>
  )
}
