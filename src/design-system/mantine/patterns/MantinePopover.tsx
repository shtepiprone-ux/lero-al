'use client'

import { cloneElement, isValidElement, useState, type MouseEvent, type ReactElement, type ReactNode } from 'react'
import { Popover, Box } from '@mantine/core'
import type { PopoverProps } from '@mantine/core'
import { useResponsiveDropdown, ResponsiveBottomSheet, SheetContent } from './responsiveBottomSheet'

export interface MantinePopoverProps {
  /** Trigger element — activates the popover on click (must forward refs for Popover.Target on desktop) */
  trigger: ReactNode
  /**
   * Arbitrary content rendered in the anchored popover (≥640) or bottom sheet (<640). A plain
   * `ReactNode` renders unchanged (existing behavior). A render function `(close: () => void) =>
   * ReactNode` (Task 558, additive) additionally receives a `close()` handle that closes the
   * popover/sheet uniformly from inside the content — e.g. a day-click commit or a Confirm button.
   */
  children: ReactNode | ((close: () => void) => ReactNode)
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
  /**
   * Task 558 (additive, default false): when true, the DESKTOP wrapper does NOT apply
   * `alignSelf:'flex-start'` — it stretches to the parent width instead, so the trigger can be
   * full-width `§6d/§6e` chrome on desktop too (e.g. `RangeDatePicker`). Default false preserves
   * the §20.5 natural-width contract verbatim for every existing consumer.
   */
  fullWidthTrigger?: boolean
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
 *
 * `close()` render-function children (Task 558): the desktop `<Popover>` is now driven by a local
 * `opened` boolean (`useState`) instead of being fully uncontrolled, so `children` can close it
 * on demand (Apply/Cancel/day-commit). Verified against the installed `@mantine/core` v8 source
 * (`PopoverTarget.mjs`): `Popover.Target` only auto-attaches its click-to-toggle `onClick` when
 * **uncontrolled** (`...!ctx.controlled ? { onClick: ... } : null`) — in controlled mode it attaches
 * NOTHING, so a naive `opened`/`onChange` switch would silently break click-to-open. This
 * component therefore clones the `trigger` itself to attach the open/close `onClick` BEFORE
 * handing it to `Popover.Target` (which, in controlled mode, does not overwrite it — confirmed by
 * reading `PopoverTarget.mjs`'s `cloneElement` call, whose conditional onClick spread is `null`
 * when controlled). `closeOnClickOutside`/`closeOnEscape` are unaffected (they call `onClose` →
 * the same controlled `onChange`), so every existing consumer's outside-click/Escape/dropdown
 * positioning behavior is byte-identical; only the desktop open state can now ALSO be closed from
 * inside `children` via the exposed `close()`. Both `Popover.Dropdown` and
 * `ResponsiveBottomSheet`'s `Drawer` default `keepMounted:false`, so content — and any local state
 * owned by a `children` render function's component — is freshly (re)instantiated on every open,
 * matching the "no plain-ReactNode `children`" positive/negative flow parity requirement for free.
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
  fullWidthTrigger = false,
}: MantinePopoverProps) {
  const { isMobile, drawerOpened, openDrawer, closeDrawer } = useResponsiveDropdown()
  const [desktopOpened, setDesktopOpened] = useState(false)
  const closeDesktop = () => setDesktopOpened(false)

  const renderChildren = (close: () => void) =>
    typeof children === 'function' ? children(close) : children

  // Controlled Popover.Target attaches no click handler of its own (see doc comment above) — the
  // trigger must carry its own toggle onClick, attached BEFORE Popover.Target clones it.
  const clickableTrigger = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<{ onClick?: (e: MouseEvent) => void }>, {
        onClick: (e: MouseEvent) => {
          if (!disabled) setDesktopOpened((o) => !o)
          ;(trigger as ReactElement<{ onClick?: (e: MouseEvent) => void }>).props.onClick?.(e)
        },
      })
    : trigger

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
        /* Desktop: alignSelf:flex-start (default) prevents a Stack align="stretch" parent from
           over-stretching the trigger — trigger renders at natural content width.
           fullWidthTrigger=true (Task 558, additive): alignSelf:stretch instead, so the Box (and
           the trigger inside it, when the trigger itself is width:100%) fills the parent width. */
        <Box style={{ alignSelf: fullWidthTrigger ? 'stretch' : 'flex-start' }}>
          <Popover
            opened={desktopOpened}
            onChange={setDesktopOpened}
            position={position}
            width={width}
            withArrow={withArrow}
            offset={offset}
            disabled={disabled}
          >
            <Popover.Target>{clickableTrigger}</Popover.Target>
            <Popover.Dropdown>{renderChildren(closeDesktop)}</Popover.Dropdown>
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
          <SheetContent>{renderChildren(closeDrawer)}</SheetContent>
        </ResponsiveBottomSheet>
      )}
    </>
  )
}
