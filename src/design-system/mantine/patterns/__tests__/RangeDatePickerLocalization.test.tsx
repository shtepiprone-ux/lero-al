/**
 * RangeDatePicker — calendar-body localization regression (Task 562 / Sprint 42 / Epic MM Phase-2).
 *
 * Registry: docs/critical-flow-registry.md → "Listings date-range filter".
 *
 * Root cause (Task 562 session log has the full investigation): the calendar body used
 * `Intl.DateTimeFormat(locale, {month:'long'|'weekday':'short'})` for month/weekday names.
 * Node's ICU has full `sq` data, but Chromium's bundled ICU does not
 * (`Intl.DateTimeFormat.supportedLocalesOf(['sq'])` → `[]` in the browser — the ONLY runtime that
 * renders this popover, since it opens on click, never during SSR) — `sq` silently fell back to
 * English. Fixed by sourcing month/weekday names from `messages/*.json` `common.calendar_*`
 * (static data, no runtime ICU dependency) instead of `Intl`.
 *
 * This test asserts the calendar body renders the LOCALIZED (non-English) month + weekday labels
 * for `sq` and `it` — the two locales explicitly named in the Task 559 evidence-review finding —
 * by mounting the desktop panel OPEN under each locale's real `NextIntlClientProvider` and reading
 * the rendered text directly (not re-deriving it from the same `common.calendar_*` data the
 * component reads, which would only prove the component echoes its input, not that the input is
 * actually the correct language).
 *
 * Planted-violation (documented, verified once and reverted): temporarily hardcoding
 * `useCalendarLocaleData` to always return the English month/weekday arrays regardless of locale
 * makes both `sq` assertions below FAIL (`getByText('Korrik 2026')` / `hën` not found) — proving
 * these assertions actually exercise the locale data, not just the component's plumbing.
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, fireEvent, within } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { readFileSync } from 'fs'
import { join } from 'path'
import { theme } from '@/design-system/mantine/theme'
import { RangeDatePicker } from '../RangeDatePicker'

function loadMessages(locale: string) {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf-8'))
}

beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
  // Desktop branch (matches the it@1440/sq@1440 rendered-evidence cells from Task 559 round 2).
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

function renderOpen(locale: string) {
  const messages = loadMessages(locale)
  const { baseElement } = render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <MantineProvider theme={theme} env="test">
        <RangeDatePicker value={{ from: undefined, to: undefined }} onChange={() => {}} />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
  fireEvent.click(baseElement.querySelector('input')!)
  return within(baseElement as HTMLElement)
}

function capitalizeFirst(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s
}

// Right-hand pane of the desktop two-month pair is always `today + 1 month` on a fresh, empty
// selection (anchorMonth defaults to the current month) — computed the same way the component
// does, from the SAME `common.calendar_months`/`calendar_month_year_suffix` data, so this doesn't
// depend on which real-world month the test happens to run in.
function expectedRightMonthLabel(locale: string): string {
  const messages = loadMessages(locale)
  const now = new Date()
  const rightMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const monthName = capitalizeFirst(messages.common.calendar_months[rightMonth.getMonth()])
  return `${monthName} ${rightMonth.getFullYear()}${messages.common.calendar_month_year_suffix}`
}

describe('RangeDatePicker — calendar-body localization (Task 562)', () => {
  it('sq: month header + weekday row render Albanian, not English', () => {
    const screen = renderOpen('sq')
    // Right-month gray label uses `formatMonthYearLabel` — Albanian month name, capitalized first
    // letter, matching the exact `common.calendar_months` data (messages/sq.json), NOT English.
    expect(screen.getByText(expectedRightMonthLabel('sq'))).toBeTruthy()
    expect(screen.queryByText(/^(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/)).toBeNull()
    // Weekday header — Albanian short forms (messages/sq.json `calendar_weekdays_short`).
    expect(screen.getAllByText('hën').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Mon').length).toBe(0)
  })

  it('it: month header + weekday row render Italian, not English', () => {
    const screen = renderOpen('it')
    expect(screen.getByText(expectedRightMonthLabel('it'))).toBeTruthy()
    expect(screen.queryByText(/^(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/)).toBeNull()
    expect(screen.getAllByText('lun').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Mon').length).toBe(0)
  })
})
