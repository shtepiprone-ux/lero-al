/**
 * DatePicker — calendar localization regression (Task 565).
 *
 * Root cause (Task 562/563/564's exact class, verified for this component too): the three
 * `Intl.DateTimeFormat(locale, ...)` calls (weekday row, month/year header, today label) render
 * correct output on Node's full-ICU server but some browsers' bundled ICU lacks locale data
 * entirely for `sq` (`Intl.DateTimeFormat.supportedLocalesOf(['sq'])` → `[]` in Chromium),
 * silently falling back to English — causing a hydration mismatch. Fixed by sourcing all three
 * strings from `messages/*.json` `common.calendar_*` (static data, no runtime ICU dependency)
 * instead of `Intl`.
 *
 * This test mounts the REAL `DatePicker` OPEN under each locale's real `NextIntlClientProvider`,
 * with `Intl.DateTimeFormat` globally monkey-patched to THROW (the actual failure mode a
 * browser lacking locale data would trigger) — proving the rendered weekday row, month/year
 * header, and today label do not depend on it succeeding. `date-fns` (day-grid generation,
 * `format(day, 'yyyy-MM-dd')`) does not use `Intl.DateTimeFormat`, so breaking it is safe and
 * isolates the fix to exactly the three call sites this task removed.
 *
 * Planted-violation (documented, verified once and reverted): temporarily reverting any one of
 * the three call sites to its raw `Intl.DateTimeFormat(locale, ...)` form makes the corresponding
 * assertion below FAIL — the broken-Intl simulation throws, and the component's un-fixed call
 * site propagates that exception (mount crashes) instead of rendering the static fallback text.
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { render, fireEvent, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { readFileSync } from 'fs'
import { join } from 'path'
import { DatePicker } from '../DatePicker'

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
      <DatePicker value={undefined} onChange={() => {}} />
    </NextIntlClientProvider>,
  )
  fireEvent.click(baseElement.querySelector('[data-slot="popover-trigger"]')!)
  return within(baseElement as HTMLElement)
}

const OriginalDateTimeFormat = Intl.DateTimeFormat

function breakIntlDateTimeFormat() {
  // @ts-expect-error -- intentionally breaking the global to simulate a browser whose ICU
  // cannot construct a DateTimeFormat for the active locale at all (the real failure mode).
  Intl.DateTimeFormat = function () {
    throw new Error('simulated broken/incomplete ICU locale data')
  }
}

describe('DatePicker — calendar localization is ICU-independent (Task 565)', () => {
  afterEach(() => {
    Intl.DateTimeFormat = OriginalDateTimeFormat
  })

  it('sq: weekday row, month header, and today label render Albanian even when Intl.DateTimeFormat throws', () => {
    breakIntlDateTimeFormat()
    const screen = renderOpen('sq')

    // Weekday header — Albanian short forms, never English.
    expect(screen.getAllByText('hën').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Mon').length).toBe(0)

    // Month/year header — nominative Albanian month name (lowercase; CSS `capitalize` handles
    // the visual first-letter uppercase, DOM text content stays as stored).
    const now = new Date()
    const messages = loadMessages('sq')
    const expectedMonthLabel = `${messages.common.calendar_months[now.getMonth()]} ${now.getFullYear()}${messages.common.calendar_month_year_suffix}`
    expect(screen.getByText(expectedMonthLabel)).toBeTruthy()

    // Today label — day + formatting-form month (sq: same as nominative), never English.
    const expectedTodayMonth = messages.common.calendar_months_formatting[now.getMonth()]
    expect(screen.getByText(`${now.getDate()} ${expectedTodayMonth}`, { exact: false })).toBeTruthy()
    expect(screen.queryByText(/January|February|March|April|May|June|July|August|September|October|November|December/)).toBeNull()
  })

  it('uk: today label uses the genitive (formatting) month form, never the nominative or English', () => {
    breakIntlDateTimeFormat()
    const screen = renderOpen('uk')

    expect(screen.getAllByText('пн').length).toBeGreaterThan(0)

    const now = new Date()
    const messages = loadMessages('uk')
    const nominativeMonth = messages.common.calendar_months[now.getMonth()]
    const genitiveMonth = messages.common.calendar_months_formatting[now.getMonth()]
    expect(genitiveMonth).not.toBe(nominativeMonth) // sanity: uk genitive really differs from nominative

    const allButtons = screen.getAllByRole('button')
    const todayButton = allButtons.find(b => b.textContent?.includes(String(now.getDate())) && b.textContent?.includes(genitiveMonth))
    expect(todayButton).toBeTruthy()
    // Never the nominative form embedded in the today label specifically.
    expect(todayButton!.textContent).not.toContain(`${now.getDate()} ${nominativeMonth}`)

    // Month/year header — nominative + genitive-case year suffix (" р.").
    const expectedMonthLabel = `${nominativeMonth} ${now.getFullYear()}${messages.common.calendar_month_year_suffix}`
    expect(screen.getByText(expectedMonthLabel)).toBeTruthy()
  })
})
