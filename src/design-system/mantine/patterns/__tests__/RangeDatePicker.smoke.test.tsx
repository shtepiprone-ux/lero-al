/**
 * RangeDatePicker — regression smoke (Task 558 / Sprint 42 / Epic MM Phase-2; updated by Task 561
 * after an owner rejection of the Task 558 mobile render, 2026-07-08).
 *
 * Registry: docs/critical-flow-registry.md → "Listings date-range filter".
 *
 * Test dates (`DAY_10`/`DAY_15`/`DAY_20`) are the 10th/15th/20th of the CURRENT real month —
 * mid-month so they never collide with a neighboring month's leading/trailing spillover cells
 * (spillover never reaches 9+ days deep, regardless of which weekday the month starts on), and
 * deterministic in EFFECT without pinning a fixed year. `PAST_MONTH_DAY` is the 10th of LAST
 * month (relative to today) — used for the `disablePastDates` tests, deterministic for the same
 * reason. Tests that need a clean-slate selection (picking `from` then `to` from scratch) pass
 * `value={{from:undefined,to:undefined}}` — passing a pre-existing `value.from` that happens to
 * equal the first click target would instead exercise the "click the already-staged start again →
 * single-day restart" branch of `pickDay`, not the "fresh from/to" flow those tests target.
 *
 * Covers:
 *   1. Desktop: picking `from`+`to` then Apply fires ONE `onChange({from,to})` with correct ISO.
 *   2. Desktop: end-before-start is swapped so `from <= to`.
 *   3. Desktop: single day then Apply commits `{from:X, to:X}` (Task 561 D1).
 *   4. Desktop: a day past `maxDate` is `disabled`; clicking it does NOT stage a new endpoint —
 *      Apply (enabled by the pre-seeded `from`, per D1) commits the UNCHANGED single-day range,
 *      proving the disabled click was a true no-op, not a weakened assertion.
 *   4b. Desktop: a day past `maxDate` cannot become `from` on a fresh (empty) selection either.
 *   5. Desktop: Cancel discards the staged range — fires nothing, panel closes.
 *   6. Mobile: tapping days alone does NOT fire `onChange`; only Confirm commits.
 *   7. Mobile: single day then Confirm (enabled) commits `{from:X, to:X}` (Task 561 D1).
 *   8. `disablePastDates`: desktop disables a day before today; mobile excludes past month
 *      sections entirely (the correct literal behavior — a past section is never rendered, not
 *      rendered-then-disabled); both are selectable/reachable when the prop is omitted (false).
 *   9. Trigger clear-X commits `onChange({undefined,undefined})` and does NOT open the panel.
 *   10. Invalid incoming `value.from` is guarded to empty — placeholder shown, no crash.
 *
 * Planted-violation (documented, verified once and reverted — same convention as
 * `MantinePagination.smoke.test.tsx`): removing the `isBefore(day, staged.from)` swap branch in
 * `pickDay` (so a 2nd click before `from` just overwrites `to` unswapped) makes test 2 FAIL — the
 * committed `onChange` payload has `from > to` (verified during Task 558, `pickDay` untouched by
 * Task 561 — re-verified here unchanged).
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, cleanup, within, waitFor, act } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { format, subMonths } from 'date-fns'
import { readFileSync } from 'fs'
import { join } from 'path'
import { theme } from '@/design-system/mantine/theme'
import { RangeDatePicker } from '../RangeDatePicker'
import type { DateRange } from '../RangeDatePicker'

const messages = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf-8'))

// jsdom has no ResizeObserver — Mantine's ScrollArea (mobile month list) needs one to mount.
// Same stub/precedent as MantinePagination.smoke.test.tsx.
beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
})

const today = new Date()
const DAY_10 = format(new Date(today.getFullYear(), today.getMonth(), 10), 'yyyy-MM-dd')
const DAY_15 = format(new Date(today.getFullYear(), today.getMonth(), 15), 'yyyy-MM-dd')
const DAY_20 = format(new Date(today.getFullYear(), today.getMonth(), 20), 'yyyy-MM-dd')
const PAST_MONTH_DAY = format(subMonths(new Date(today.getFullYear(), today.getMonth(), 10), 1), 'yyyy-MM-dd')

function withProviders(children: React.ReactNode) {
  // env="test" — see MantinePopover.smoke.test.tsx: makes the Popover/Drawer Transition render
  // synchronously instead of behind a real requestAnimationFrame+timer tick.
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        {children}
      </MantineProvider>
    </NextIntlClientProvider>
  )
}

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

afterEach(() => cleanup())

/** The trigger, located by Mantine's input slot class — valid for an `<input>` and a `<button>`. */
function getTrigger(root: ParentNode): HTMLElement {
  return root.querySelector('.mantine-Input-input') as HTMLElement
}

/**
 * Task 861 — models the browser's keyboard ACTIVATION BEHAVIOUR without dispatching a pointer event
 * (this repo has no user-event). HTML: a `<button>` fires `click` on `Enter` keydown and on `Space`
 * keyup (after an un-prevented keydown); an `<input readonly>` has no activation behaviour, so
 * nothing happens — which is exactly the pre-fix defect. The real-browser proof is the Playwright
 * transcript in docs/sessions/evidence/task861/.
 */
function pressKey(el: HTMLElement, key: 'Enter' | ' ') {
  const isButton = el instanceof HTMLButtonElement && !el.disabled
  const downNotPrevented = fireEvent.keyDown(el, { key })
  if (isButton && downNotPrevented && key === 'Enter') fireEvent.click(el)
  const upNotPrevented = fireEvent.keyUp(el, { key })
  if (isButton && downNotPrevented && upNotPrevented && key === ' ') fireEvent.click(el)
}

describe('RangeDatePicker — desktop (Task 558/561)', { timeout: 15_000 }, () => {
  beforeEach(() => stubMatchMedia(false))

  it('picking from+to (fresh, no pre-existing value) then Apply fires ONE onChange({from,to})', () => {
    const onChange = vi.fn<(next: DateRange) => void>()
    const { baseElement, container } = render(
      withProviders(<RangeDatePicker value={{ from: undefined, to: undefined }} onChange={onChange} />),
    )
    fireEvent.click(getTrigger(container))

    fireEvent.click(baseElement.querySelector(`[data-date="${DAY_10}"]`)!)
    fireEvent.click(baseElement.querySelector(`[data-date="${DAY_15}"]`)!)

    const applyBtn = within(baseElement as HTMLElement).getByRole('button', { name: 'Apply' })
    expect(applyBtn).not.toBeDisabled()
    fireEvent.click(applyBtn)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ from: DAY_10, to: DAY_15 })
  })

  it('end-before-start is swapped so from <= to', () => {
    const onChange = vi.fn<(next: DateRange) => void>()
    const { baseElement, container } = render(
      withProviders(<RangeDatePicker value={{ from: undefined, to: undefined }} onChange={onChange} />),
    )
    fireEvent.click(getTrigger(container))

    // Click the LATER day first, then the EARLIER day — pickDay must swap so from <= to.
    fireEvent.click(baseElement.querySelector(`[data-date="${DAY_20}"]`)!)
    fireEvent.click(baseElement.querySelector(`[data-date="${DAY_10}"]`)!)
    fireEvent.click(within(baseElement as HTMLElement).getByRole('button', { name: 'Apply' }))

    expect(onChange).toHaveBeenCalledWith({ from: DAY_10, to: DAY_20 })
  })

  it('single day then Apply commits a single-day range {from:X, to:X} (Task 561 D1)', () => {
    const onChange = vi.fn<(next: DateRange) => void>()
    const { baseElement, container } = render(
      withProviders(<RangeDatePicker value={{ from: undefined, to: undefined }} onChange={onChange} />),
    )
    fireEvent.click(getTrigger(container))
    fireEvent.click(baseElement.querySelector(`[data-date="${DAY_10}"]`)!)

    const applyBtn = within(baseElement as HTMLElement).getByRole('button', { name: 'Apply' })
    expect(applyBtn).not.toBeDisabled()
    fireEvent.click(applyBtn)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ from: DAY_10, to: DAY_10 })
  })

  it('a day past maxDate is disabled; clicking it does NOT stage a new endpoint', () => {
    const onChange = vi.fn<(next: DateRange) => void>()
    const { baseElement, container } = render(
      withProviders(
        <RangeDatePicker
          value={{ from: DAY_10, to: undefined }}
          onChange={onChange}
          maxDate={new Date(today.getFullYear(), today.getMonth(), 12)}
        />,
      ),
    )
    fireEvent.click(getTrigger(container))

    const day15 = baseElement.querySelector(`[data-date="${DAY_15}"]`) as HTMLButtonElement
    expect(day15).toBeDisabled()
    fireEvent.click(day15) // disabled → must be a no-op, must NOT stage `to`

    // Apply is enabled (D1: `from`=DAY_10 was pre-seeded) — but since the disabled click never
    // staged `to`, committing now must still emit the UNCHANGED single-day range, proving the
    // click on day15 truly changed nothing (not a weakened "Apply disabled" assertion).
    const applyBtn = within(baseElement as HTMLElement).getByRole('button', { name: 'Apply' })
    expect(applyBtn).not.toBeDisabled()
    fireEvent.click(applyBtn)
    expect(onChange).toHaveBeenCalledWith({ from: DAY_10, to: DAY_10 })
  })

  it('a day past maxDate cannot become `from` on a fresh (empty) selection', () => {
    const onChange = vi.fn<(next: DateRange) => void>()
    const { baseElement, container } = render(
      withProviders(
        <RangeDatePicker
          value={{ from: undefined, to: undefined }}
          onChange={onChange}
          maxDate={new Date(today.getFullYear(), today.getMonth(), 12)}
        />,
      ),
    )
    fireEvent.click(getTrigger(container))

    const day15 = baseElement.querySelector(`[data-date="${DAY_15}"]`) as HTMLButtonElement
    expect(day15).toBeDisabled()
    fireEvent.click(day15)

    const applyBtn = within(baseElement as HTMLElement).getByRole('button', { name: 'Apply' })
    expect(applyBtn).toBeDisabled() // nothing was ever staged
    expect(onChange).not.toHaveBeenCalled()
  })

  it('Cancel discards the staged range — fires nothing, panel closes', () => {
    const onChange = vi.fn<(next: DateRange) => void>()
    const { baseElement, container } = render(
      withProviders(<RangeDatePicker value={{ from: DAY_10, to: undefined }} onChange={onChange} />),
    )
    fireEvent.click(getTrigger(container))
    // value.from seeds staged.from; one click on a LATER day stages `to` directly.
    fireEvent.click(baseElement.querySelector(`[data-date="${DAY_15}"]`)!)

    const cancelBtn = within(baseElement as HTMLElement).getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelBtn)

    expect(onChange).not.toHaveBeenCalled()
    expect(baseElement.querySelector('[data-date]')).toBeNull()
  })

  it('disablePastDates disables a day before today', () => {
    const onChange = vi.fn<(next: DateRange) => void>()
    const { baseElement, container } = render(
      withProviders(
        <RangeDatePicker value={{ from: PAST_MONTH_DAY, to: undefined }} onChange={onChange} disablePastDates />,
      ),
    )
    fireEvent.click(getTrigger(container))
    const cell = baseElement.querySelector(`[data-date="${PAST_MONTH_DAY}"]`) as HTMLButtonElement
    expect(cell).toBeDisabled()
  })

  it('disablePastDates omitted (default false): a day before today is selectable', () => {
    const onChange = vi.fn<(next: DateRange) => void>()
    const { baseElement, container } = render(
      withProviders(<RangeDatePicker value={{ from: PAST_MONTH_DAY, to: undefined }} onChange={onChange} />),
    )
    fireEvent.click(getTrigger(container))
    const cell = baseElement.querySelector(`[data-date="${PAST_MONTH_DAY}"]`) as HTMLButtonElement
    expect(cell).not.toBeDisabled()
  })
})

describe('RangeDatePicker — mobile (Task 558/561)', { timeout: 15_000 }, () => {
  beforeEach(() => stubMatchMedia(true))

  it('tapping days alone does NOT fire onChange; only Confirm commits', () => {
    const onChange = vi.fn<(next: DateRange) => void>()
    const { baseElement, container } = render(
      withProviders(<RangeDatePicker value={{ from: undefined, to: undefined }} onChange={onChange} />),
    )
    fireEvent.click(getTrigger(container))

    fireEvent.click(baseElement.querySelector(`[data-date="${DAY_10}"]`)!)
    fireEvent.click(baseElement.querySelector(`[data-date="${DAY_15}"]`)!)
    expect(onChange).not.toHaveBeenCalled()

    const confirmBtn = within(baseElement as HTMLElement).getByRole('button', { name: 'Confirm' })
    expect(confirmBtn).not.toBeDisabled()
    fireEvent.click(confirmBtn)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ from: DAY_10, to: DAY_15 })
  })

  it('single day then Confirm (enabled) commits a single-day range {from:X, to:X} (Task 561 D1)', () => {
    const onChange = vi.fn<(next: DateRange) => void>()
    const { baseElement, container } = render(
      withProviders(<RangeDatePicker value={{ from: undefined, to: undefined }} onChange={onChange} />),
    )
    fireEvent.click(getTrigger(container))
    fireEvent.click(baseElement.querySelector(`[data-date="${DAY_10}"]`)!)

    const confirmBtn = within(baseElement as HTMLElement).getByRole('button', { name: 'Confirm' })
    expect(confirmBtn).not.toBeDisabled()
    fireEvent.click(confirmBtn)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ from: DAY_10, to: DAY_10 })
  })

  it('disablePastDates excludes past month sections entirely (no cell to find, not disabled-in-place)', () => {
    const onChange = vi.fn<(next: DateRange) => void>()
    const { baseElement, container } = render(
      withProviders(
        <RangeDatePicker value={{ from: PAST_MONTH_DAY, to: undefined }} onChange={onChange} disablePastDates />,
      ),
    )
    fireEvent.click(getTrigger(container))
    expect(baseElement.querySelector(`[data-date="${PAST_MONTH_DAY}"]`)).toBeNull()
  })

  it('disablePastDates omitted (default false): a past month section is rendered and selectable', () => {
    const onChange = vi.fn<(next: DateRange) => void>()
    const { baseElement, container } = render(
      withProviders(<RangeDatePicker value={{ from: PAST_MONTH_DAY, to: undefined }} onChange={onChange} />),
    )
    fireEvent.click(getTrigger(container))
    const cell = baseElement.querySelector(`[data-date="${PAST_MONTH_DAY}"]`) as HTMLButtonElement
    expect(cell).toBeTruthy()
    expect(cell).not.toBeDisabled()
  })
})

describe('RangeDatePicker — trigger (Task 558)', { timeout: 15_000 }, () => {
  beforeEach(() => stubMatchMedia(false))

  it('clear-X commits onChange({undefined,undefined}) and does NOT open the panel', () => {
    const onChange = vi.fn<(next: DateRange) => void>()
    const { baseElement, container } = render(
      withProviders(<RangeDatePicker value={{ from: DAY_10, to: DAY_15 }} onChange={onChange} />),
    )
    const clearBtn = container.querySelector('button[aria-label="Clear"]') as HTMLButtonElement
    expect(clearBtn).toBeTruthy()
    fireEvent.click(clearBtn)

    expect(onChange).toHaveBeenCalledWith({ from: undefined, to: undefined })
    expect(baseElement.querySelector('[data-date]')).toBeNull()
  })

  it('unparseable value.from is guarded to empty — placeholder shown, no crash', () => {
    const onChange = vi.fn<(next: DateRange) => void>()
    const { container } = render(
      withProviders(<RangeDatePicker value={{ from: 'not-a-date', to: undefined }} onChange={onChange} />),
    )
    // Task 861 (selector only): the trigger is a <button> now — no .value/.placeholder; the same
    // expectation (no date shown, the placeholder shown) is read from its text.
    const trigger = getTrigger(container)
    expect(trigger.textContent).toBe('Select dates')
    expect(trigger.textContent).not.toMatch(/\d{2}\.\d{2}\.\d{4}/)
  })
})

describe.each([
  { path: 'desktop ≥640', mobile: false, commit: 'Apply' },
  { path: 'mobile <640 bottom sheet', mobile: true, commit: 'Confirm' },
])('RangeDatePicker — keyboard-only custom-range flow, $path (Task 861)', ({ mobile, commit }) => {
  beforeEach(() => stubMatchMedia(mobile))

  const empty = { from: undefined, to: undefined }
  const surface = (root: HTMLElement) => root.querySelector('[data-date]')
  const insideSurface = (root: HTMLElement) =>
    !!surface(root)?.closest('[role="dialog"]')?.contains(document.activeElement)
  const rendered = (onChange = vi.fn<(next: DateRange) => void>(), value: DateRange = empty) => {
    const r = render(withProviders(<RangeDatePicker value={value} onChange={onChange} />))
    return { ...r, onChange, trigger: getTrigger(r.container) }
  }

  it('trigger is a semantic <button type="button"> keeping the Mantine input chrome (AC1)', () => {
    const { trigger } = rendered()
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.getAttribute('type')).toBe('button')
    expect(trigger.classList.contains('mantine-Input-input')).toBe(true)
  })

  it('Enter on the focused trigger opens the surface with no pointer event (AC1)', () => {
    const { baseElement, trigger } = rendered()
    trigger.focus()
    expect(surface(baseElement)).toBeNull()
    pressKey(trigger, 'Enter')
    expect(surface(baseElement)).toBeTruthy()
  })

  it('Space on the focused trigger opens the surface on keyup, with no pointer event (AC1)', () => {
    const { baseElement, trigger } = rendered()
    trigger.focus()
    expect(surface(baseElement)).toBeNull()
    pressKey(trigger, ' ')
    expect(surface(baseElement)).toBeTruthy()
  })

  it('aria-haspopup="dialog" in both states; aria-expanded "false" then "true" (AC3)', () => {
    const { trigger } = rendered()
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    pressKey(trigger, 'Enter')
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('opening moves focus inside the surface; Escape closes and returns focus to the trigger (AC2)', async () => {
    const { baseElement, trigger } = rendered()
    trigger.focus()
    pressKey(trigger, 'Enter')
    await waitFor(() => expect(insideSurface(baseElement)).toBe(true))
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    await waitFor(() => expect(surface(baseElement)).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(trigger))
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('Escape with a staged but uncommitted range discards it, fires nothing, focus returns (negative)', async () => {
    const { baseElement, trigger, onChange } = rendered()
    trigger.focus()
    pressKey(trigger, 'Enter')
    fireEvent.click(baseElement.querySelector(`[data-date="${DAY_10}"]`)!)
    await waitFor(() => expect(insideSurface(baseElement)).toBe(true))
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    await waitFor(() => expect(surface(baseElement)).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(trigger))
    expect(onChange).not.toHaveBeenCalled()
  })

  it(`${commit} commits one onChange, closes, and returns focus to the trigger (AC2)`, async () => {
    const { baseElement, trigger, onChange } = rendered()
    trigger.focus()
    pressKey(trigger, 'Enter')
    fireEvent.click(baseElement.querySelector(`[data-date="${DAY_10}"]`)!)
    fireEvent.click(baseElement.querySelector(`[data-date="${DAY_15}"]`)!)
    fireEvent.click(within(baseElement as HTMLElement).getByRole('button', { name: commit }))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ from: DAY_10, to: DAY_15 })
    await waitFor(() => expect(surface(baseElement)).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  if (!mobile) {
    it('Cancel discards, fires nothing, and returns focus to the trigger (AC2)', async () => {
      const { baseElement, trigger, onChange } = rendered()
      trigger.focus()
      pressKey(trigger, 'Enter')
      fireEvent.click(baseElement.querySelector(`[data-date="${DAY_10}"]`)!)
      fireEvent.click(within(baseElement as HTMLElement).getByRole('button', { name: 'Cancel' }))
      expect(onChange).not.toHaveBeenCalled()
      await waitFor(() => expect(surface(baseElement)).toBeNull())
      await waitFor(() => expect(document.activeElement).toBe(trigger))
    })
  }

  it('clear-X is a sibling of the trigger (no button-in-button) and commits {undefined,undefined} without opening (AC5)', () => {
    const onChange = vi.fn<(next: DateRange) => void>()
    const { baseElement, container } = render(
      withProviders(<RangeDatePicker value={{ from: DAY_10, to: DAY_15 }} onChange={onChange} />),
    )
    const trigger = getTrigger(container)
    const clear = container.querySelector('button[aria-label="Clear"]') as HTMLButtonElement
    expect(trigger.contains(clear)).toBe(false)
    expect(container.querySelector('button button')).toBeNull()
    act(() => {
      fireEvent.click(clear)
    })
    expect(onChange).toHaveBeenCalledWith({ from: undefined, to: undefined })
    expect(surface(baseElement)).toBeNull()
  })
})
