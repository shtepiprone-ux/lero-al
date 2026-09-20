/**
 * MantineCombobox — `triggerWidth` prop smoke test (Task 551 STOP-and-ASK #1, Option A)
 *
 * Registry: no new critical-flow row — this is a primitive-level prop-wiring test, not a
 * user flow (the flow-level coverage is the listing-form regression baseline, Task 551 session
 * log). Covers the ONE prop this task adds to `MantineCombobox`:
 *
 *   1. Default (no `triggerWidth` passed) — the trigger keeps its existing responsive width
 *      (`{ base: '100%', sm: 'auto' }`, content-width on desktop) — byte-identical to every other
 *      consumer created before this task (LocationCombobox, YearCombobox, etc. still on legacy
 *      `Combobox.tsx`, but any FUTURE `MantineCombobox` consumer that omits the prop must see the
 *      unchanged default).
 *   2. Override (`triggerWidth={{ base: '100%', sm: '100%' }}`, what `PropertyTypeCombobox` now
 *      passes) — the override reaches the trigger and replaces the desktop `sm` value.
 *
 * Planted-violation proof (documented, not asserted here — see Task 551 session log): removing
 * the `?? { base: '100%', sm: 'auto' }` fallback (e.g. `w: triggerWidth` with no default) makes
 * test 1 below FAIL — the trigger renders with no width style at all when the prop is omitted.
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { MantineCombobox } from '../MantineCombobox'

function withProvider(children: React.ReactNode) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>
}

beforeAll(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
})

function getInlineWidthRule(container: HTMLElement) {
  const styleTag = container.querySelector('style[data-mantine-styles="inline"]')
  return styleTag?.textContent ?? ''
}

describe('MantineCombobox — triggerWidth prop (Task 551)', () => {
  it('default (prop absent): trigger stays 100% base / auto sm — unchanged desktop content-width', () => {
    const { container } = render(
      withProvider(
        <MantineCombobox
          options={[]}
          value=""
          onChange={() => {}}
          variant="button"
          noResultsLabel="none"
          triggerAriaLabel="probe"
        />,
      ),
    )
    const rule = getInlineWidthRule(container)
    expect(rule).toContain('width:100%')
    expect(rule).toContain('@media(min-width: 40em)')
    expect(rule).toContain('width:auto')
  })

  it('override reaches the trigger: {base:"100%", sm:"100%"} replaces the desktop auto value', () => {
    const { container } = render(
      withProvider(
        <MantineCombobox
          options={[]}
          value=""
          onChange={() => {}}
          variant="button"
          noResultsLabel="none"
          triggerAriaLabel="probe"
          triggerWidth={{ base: '100%', sm: '100%' }}
        />,
      ),
    )
    const rule = getInlineWidthRule(container)
    expect(rule).toContain('@media(min-width: 40em)')
    expect(rule).not.toContain('width:auto')
    // Both the base rule and the sm media rule resolve to 100% — the override reached the trigger.
    expect(rule.match(/width:100%/g)?.length).toBe(2)
  })
})

/**
 * `inputMode` + `onInputChange` (Task 552 STOP-and-ASK #1, Option A). jsdom's `useMediaQuery`
 * always resolves `isMobile=false` here (stubbed `matchMedia` never matches), so these assertions
 * exercise the desktop `variant="input"` trigger — the mobile sheet's own search field wires the
 * identical `onInputChange?.(raw)` call (verified via rendered evidence, `check:` gates, and
 * `check:mojibake`/`tsc` — not re-provable in jsdom without a real viewport).
 */
describe('MantineCombobox — inputMode + onInputChange (Task 552)', () => {
  it('onInputChange present: fires with the raw typed value AND suppresses the internal onChange("") on keystroke', () => {
    const onChange = vi.fn()
    const onInputChange = vi.fn()
    const { container } = render(
      withProvider(
        <MantineCombobox
          options={[{ value: '2024', label: '2024' }]}
          value=""
          onChange={onChange}
          variant="input"
          noResultsLabel="none"
          onInputChange={onInputChange}
        />,
      ),
    )
    const input = container.querySelector('input')!
    fireEvent.change(input, { target: { value: '2024' } })
    expect(onInputChange).toHaveBeenCalledWith('2024')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('onInputChange absent: on-type behavior is byte-identical to today — onChange("") still fires on keystroke', () => {
    const onChange = vi.fn()
    const { container } = render(
      withProvider(
        <MantineCombobox
          options={[{ value: '2024', label: '2024' }]}
          value=""
          onChange={onChange}
          variant="input"
          noResultsLabel="none"
        />,
      ),
    )
    const input = container.querySelector('input')!
    fireEvent.change(input, { target: { value: '2024' } })
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('inputMode reaches the desktop trigger input', () => {
    const { container } = render(
      withProvider(
        <MantineCombobox
          options={[]}
          value=""
          onChange={() => {}}
          variant="input"
          noResultsLabel="none"
          inputMode="numeric"
        />,
      ),
    )
    const input = container.querySelector('input')!
    expect(input.getAttribute('inputmode')).toBe('numeric')
  })
})

/**
 * Desktop `Combobox.Options` scroll cap (Task 552, discovered while proving STOP-and-ASK #2):
 * long lists (e.g. YearCombobox's ~80 years) rendered unbounded without this. Capped at 220px +
 * `overflow-y:auto` to match `MantineSelect`'s own built-in `maxDropdownHeight` default — value
 * empirically measured via a rendered long-list `getComputedStyle` proof against the live
 * `MantineSelect` story (220px), not invented and not the legacy `Combobox.tsx`'s unrelated 224px.
 */
describe('MantineCombobox — desktop options scroll cap (Task 552)', () => {
  it('caps Combobox.Options at 220px with overflow-y:auto, matching MantineSelect', () => {
    const { baseElement } = render(
      withProvider(
        <MantineCombobox
          options={Array.from({ length: 40 }, (_, i) => ({ value: String(i), label: String(i) }))}
          value=""
          onChange={() => {}}
          variant="input"
          noResultsLabel="none"
        />,
      ),
    )
    const input = baseElement.querySelector('input')!
    fireEvent.focus(input)
    // Combobox.Dropdown portals to document.body — query baseElement, not the RTL container.
    const optionsEl = baseElement.querySelector('.mantine-Combobox-options') as HTMLElement
    expect(optionsEl).toBeTruthy()
    const style = optionsEl.getAttribute('style') ?? ''
    expect(style).toContain('max-height')
    expect(style).toMatch(/13\.75rem/) // 220px / 16 = 13.75rem (Mantine's rem() conversion)
    expect(getComputedStyle(optionsEl).overflowY).toBe('auto')
  })
})

/**
 * `onKeyDown` passthrough (Task 553 STOP-and-ASK #1, Option A) — desktop trigger ONLY (never the
 * mobile sheet's search field, where Enter should filter/commit a location, not navigate away).
 */
describe('MantineCombobox — onKeyDown passthrough (Task 553)', () => {
  it('onKeyDown reaches the desktop trigger input and fires on Enter', () => {
    const onKeyDown = vi.fn()
    const { container } = render(
      withProvider(
        <MantineCombobox
          options={[]}
          value=""
          onChange={() => {}}
          variant="input"
          noResultsLabel="none"
          onKeyDown={onKeyDown}
        />,
      ),
    )
    const input = container.querySelector('input')!
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onKeyDown).toHaveBeenCalledTimes(1)
    expect(onKeyDown.mock.calls[0][0].key).toBe('Enter')
  })

  it('onKeyDown absent: no error, byte-identical to today', () => {
    const { container } = render(
      withProvider(
        <MantineCombobox
          options={[]}
          value=""
          onChange={() => {}}
          variant="input"
          noResultsLabel="none"
        />,
      ),
    )
    const input = container.querySelector('input')!
    expect(() => fireEvent.keyDown(input, { key: 'Enter' })).not.toThrow()
  })
})

/**
 * `dropdownMinWidth` (Task 556 STOP-and-ASK #2, Option A) — desktop `Combobox.Dropdown` only (the
 * mobile bottom sheet is already full-width, unaffected).
 */
describe('MantineCombobox — dropdownMinWidth (Task 556)', () => {
  it('dropdownMinWidth reaches the desktop Combobox.Dropdown', () => {
    const { baseElement } = render(
      withProvider(
        <MantineCombobox
          options={[{ value: 'a', label: 'a' }]}
          value=""
          onChange={() => {}}
          variant="button"
          noResultsLabel="none"
          triggerAriaLabel="probe"
          dropdownMinWidth={240}
        />,
      ),
    )
    const trigger = baseElement.querySelector('input')!
    fireEvent.click(trigger)
    const dropdown = baseElement.querySelector('.mantine-Combobox-dropdown') as HTMLElement
    expect(dropdown).toBeTruthy()
    expect(dropdown.style.minWidth).toBe('240px')
  })

  it('dropdownMinWidth absent: no min-width style, byte-identical to today', () => {
    const { baseElement } = render(
      withProvider(
        <MantineCombobox
          options={[{ value: 'a', label: 'a' }]}
          value=""
          onChange={() => {}}
          variant="button"
          noResultsLabel="none"
          triggerAriaLabel="probe"
        />,
      ),
    )
    const trigger = baseElement.querySelector('input')!
    fireEvent.click(trigger)
    const dropdown = baseElement.querySelector('.mantine-Combobox-dropdown') as HTMLElement
    expect(dropdown).toBeTruthy()
    expect(dropdown.style.minWidth).toBe('')
  })
})

/**
 * Task 845 Revision 1 (W3) — two owner-reported fixes now in this task's scope (clause 15: both
 * consumers, `AuthSheet.tsx`/`PhoneField.tsx`/`RangeDatePicker.tsx`, are P0 auth / critical-flow
 * surfaces per `docs/critical-flow-registry.md`).
 *
 * Both DOM facts below were confirmed against a real render of this component (a throwaway dump,
 * not asserted here) before writing the assertions, per the project's evidence rules:
 *   - The outer `Box` is `.mantine-TextInput-root`'s own parent element.
 *   - A responsive `triggerWidth` (default `{ base: '100%', sm: 'auto' }`) resolves through a
 *     generated `<style data-mantine-styles="inline">` class rule on BOTH the outer Box and the
 *     trigger; a fixed/percentage `triggerWidth` resolves through a plain inline `style="width:…"`
 *     attribute on both instead — Mantine's own style-props system picks the mechanism, not this
 *     component.
 *   - `pointer-events: none` on the chevron section is real only in the browser's own compiled
 *     `@mantine/core/styles.css` (not loaded in this jsdom test run — `getComputedStyle` on the
 *     section returns the CSS-initial `auto` here regardless). The OBSERVABLE fact in jsdom is that
 *     `rightSectionPointerEvents: 'none'` reaches Mantine's own `vars` mechanism, which sets the
 *     `--input-right-section-pointer-events` custom property inline on `.mantine-TextInput-wrapper`
 *     — that inline property is what these assertions check.
 */
function outerBoxOf(container: HTMLElement): HTMLElement {
  return container.querySelector('.mantine-TextInput-root')!.parentElement as HTMLElement
}

describe('MantineCombobox — outer Box mirrors the trigger\'s resolved width (Task 845 Revision 1, W3)', () => {
  it('default (no triggerWidth): outer Box carries the identical responsive 100%/auto rule as the trigger', () => {
    const { container } = render(
      withProvider(
        <MantineCombobox options={[]} value="" onChange={() => {}} variant="button" noResultsLabel="none" triggerAriaLabel="probe" />,
      ),
    )
    const outer = outerBoxOf(container)
    const outerClass = outer.className
    expect(outerClass).toBeTruthy()
    // First inline-style tag in DOM order belongs to the outer Box (it wraps the trigger); the
    // second belongs to the trigger's own TextInput wrapper — verified against a real render dump.
    const styleTags = Array.from(container.querySelectorAll('style[data-mantine-styles="inline"]'))
    expect(styleTags.length).toBeGreaterThanOrEqual(2)
    const outerRule = styleTags[0].textContent ?? ''
    const triggerRule = styleTags[1].textContent ?? ''
    expect(outerRule).toContain(`.${outerClass}{width:100%;}`)
    expect(outerRule).toContain(`@media(min-width: 40em){.${outerClass}{width:auto;}}`)
    // Both rules resolve to the identical width contract (base 100% / sm auto) — the outer Box
    // mirrors the trigger, it does not invent a different width. Each generated class id is
    // replaced with a constant placeholder (globally, jsdom ids are not always pure digits — e.g.
    // `_r_9c_` — so this normalizes every occurrence rather than assuming a fixed character set).
    const normalize = (s: string) => s.replace(/__m__-_r_[0-9a-z]+_/g, 'CLASS')
    expect(normalize(outerRule)).toBe(normalize(triggerRule))
  })

  it('fixed triggerWidth={112}: outer Box carries the identical fixed width as the trigger', () => {
    const { container } = render(
      withProvider(
        <MantineCombobox options={[]} value="" onChange={() => {}} variant="button" noResultsLabel="none" triggerAriaLabel="probe" triggerWidth={112} />,
      ),
    )
    const outer = outerBoxOf(container)
    const triggerRoot = container.querySelector('.mantine-TextInput-root') as HTMLElement
    expect(outer.style.width).toBeTruthy()
    expect(outer.style.width).toBe(triggerRoot.style.width)
  })

  it('triggerWidth="100%": outer Box carries the identical 100% width as the trigger', () => {
    const { container } = render(
      withProvider(
        <MantineCombobox options={[]} value="" onChange={() => {}} variant="button" noResultsLabel="none" triggerAriaLabel="probe" triggerWidth="100%" />,
      ),
    )
    const outer = outerBoxOf(container)
    const triggerRoot = container.querySelector('.mantine-TextInput-root') as HTMLElement
    expect(outer.style.width).toBe('100%')
    expect(triggerRoot.style.width).toBe('100%')
  })
})

describe('MantineCombobox — chevron right-section pointer-events (Task 845 Revision 1, W3)', () => {
  it('the trigger wrapper carries --input-right-section-pointer-events: none', () => {
    const { container } = render(
      withProvider(
        <MantineCombobox options={[]} value="" onChange={() => {}} variant="button" noResultsLabel="none" triggerAriaLabel="probe" />,
      ),
    )
    const wrapper = container.querySelector('.mantine-TextInput-wrapper') as HTMLElement
    expect(wrapper.style.getPropertyValue('--input-right-section-pointer-events')).toBe('none')
  })
})
