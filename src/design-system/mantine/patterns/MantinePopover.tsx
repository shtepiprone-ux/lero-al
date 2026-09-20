'use client'

import { cloneElement, isValidElement, useState, type MouseEvent, type ReactElement, type ReactNode } from 'react'
import { ActionIcon, Box, Button, Popover, UnstyledButton } from '@mantine/core'
import type { PopoverProps } from '@mantine/core'
import { useResponsiveDropdown, ResponsiveBottomSheet, SheetContent } from './responsiveBottomSheet'

/**
 * Task 861 (review 1 F2) — `aria-haspopup`/`aria-expanded` are valid only on an element with a role. Only a
 * trigger that IS a native button gets them cloned on; a wrapper (an `Indicator`, a `div`, …) must not carry
 * them on its role-less root — it uses the render-function trigger to put them on its real inner button.
 */
const BUTTON_TRIGGER_TYPES: ReadonlySet<unknown> = new Set([Button, ActionIcon, UnstyledButton])

function isButtonTrigger(node: ReactNode): boolean {
  if (!isValidElement(node)) return false
  const { type, props } = node as ReactElement<{ component?: unknown }>
  if (props.component !== undefined) return props.component === 'button'
  return type === 'button' || BUTTON_TRIGGER_TYPES.has(type)
}

export interface MantinePopoverProps {
  /**
   * Trigger element — activates the popover on click (must forward refs for Popover.Target on desktop).
   * Task 861: it MUST be natively keyboard-operable (a real `<button>`/`ActionIcon`) — this component
   * deliberately owns no key handler, because a native button already turns Enter/Space into a click and
   * a second handler here would toggle twice. A native-button element trigger gets `aria-haspopup`/
   * `aria-expanded` from this component; a WRAPPER trigger (e.g. an `Indicator`) gets neither on its
   * role-less root. Such a trigger is passed as a render function `({ opened }) => ReactNode` (additive):
   * it receives the open state so the inner button carries the two attributes itself.
   */
  trigger: ReactNode | ((state: { opened: boolean }) => ReactNode)
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
 * Keyboard + ARIA (Task 861): this component owns NO key handler that opens/toggles. Enter/Space work
 * because the trigger is a native button (a click event is synthesised by the browser), so consumers
 * that already pass a native button never toggle twice. The trigger carries `aria-haspopup="dialog"` +
 * a live `aria-expanded` on BOTH paths (`Popover.Target` only supplied them on desktop) — but only when the
 * trigger IS a native button; a wrapper trigger never gets them on its root (review 1 F2, `withRoles` off).
 * Desktop
 * `Popover` runs `trapFocus` + `returnFocus` — the dropdown is portaled, so without the trap a keyboard
 * user could not Tab into it — and the `<640` sheet's `Drawer` already returns focus.
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

  // Task 861 — one open state for the trigger's ARIA on both paths (desktop popover / mobile sheet).
  const expanded = isMobile ? drawerOpened : desktopOpened
  const triggerNode: ReactNode = typeof trigger === 'function' ? trigger({ opened: expanded }) : trigger
  // Native-button element trigger only (F2/R4b). A wrapper or render-function trigger owns its inner
  // button's ARIA; `Popover.Target`'s own `withRoles` is switched off for it below so it cannot land on the wrapper.
  const buttonTrigger = typeof trigger !== 'function' && isButtonTrigger(trigger)
  const ariaTrigger = buttonTrigger
    ? cloneElement(trigger as ReactElement<Record<string, unknown>>, {
        'aria-haspopup': 'dialog',
        'aria-expanded': expanded,
      })
    : triggerNode

  // Controlled Popover.Target attaches no click handler of its own (see doc comment above) — the
  // trigger must carry its own toggle onClick, attached BEFORE Popover.Target clones it.
  const clickableTrigger = isValidElement(ariaTrigger)
    ? cloneElement(ariaTrigger as ReactElement<{ onClick?: (e: MouseEvent) => void }>, {
        onClick: (e: MouseEvent) => {
          if (!disabled) setDesktopOpened((o) => !o)
          ;(ariaTrigger as ReactElement<{ onClick?: (e: MouseEvent) => void }>).props.onClick?.(e)
        },
      })
    : ariaTrigger

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
          {ariaTrigger}
        </Box>
      ) : (
        /* Desktop: alignSelf:flex-start (default) prevents a Stack align="stretch" parent from
           over-stretching the trigger — trigger renders at natural content width.
           fullWidthTrigger=true (Task 558, additive): alignSelf:stretch instead, so the Box (and
           the trigger inside it, when the trigger itself is set to fill its own width) fills the parent width. */
        <Box style={{ alignSelf: fullWidthTrigger ? 'stretch' : 'flex-start' }}>
          <Popover
            opened={desktopOpened}
            onChange={setDesktopOpened}
            position={position}
            width={width}
            withArrow={withArrow}
            offset={offset}
            disabled={disabled}
            withRoles={buttonTrigger}
            trapFocus
            returnFocus
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
