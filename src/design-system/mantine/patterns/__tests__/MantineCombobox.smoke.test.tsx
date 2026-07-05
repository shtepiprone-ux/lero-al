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
import { render } from '@testing-library/react'
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
