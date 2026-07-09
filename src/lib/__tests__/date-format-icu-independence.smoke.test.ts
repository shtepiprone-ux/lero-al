/**
 * Date-format ICU-independence guard (Task 564 / Sprint 42).
 *
 * Root cause (already verified by Task 562/563, re-applied here): some browsers' bundled
 * ICU lacks locale data entirely for `sq` (`Intl.DateTimeFormat.supportedLocalesOf(['sq'])`
 * → `[]` in Chromium), so a live `Intl.DateTimeFormat('sq', ...)` call silently falls back
 * to a different locale (`en-GB`) on the client while the Node server (full ICU) renders
 * correct Albanian — causing a hydration mismatch. `formatDate`/`formatDateTime`/
 * `formatListingDate` no longer call `Intl.DateTimeFormat` at all (see `DATE_FORMAT` /
 * `CALENDAR_MESSAGES` in `formatters.ts`) — output is composed from `Date` parts + the
 * static `common.calendar_*` i18n data (Task 562), so it cannot diverge between a runtime
 * with complete locale data and one without.
 *
 * `date-format-ssr-parity.smoke.test.ts` already asserts the literal-byte output (unchanged
 * by this task for en/uk/it, fixed for sq's ICU-gap scenario). This file adds the direct
 * "Intl.DateTimeFormat throws" simulation proving the fix does not depend on it succeeding
 * — the actual failure mode behind the original bug.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { formatDate, formatDateTime, formatListingDate } from '../formatters'

const LOCALES = ['en', 'uk', 'sq', 'it'] as const

describe('formatDate/formatDateTime/formatListingDate — hydration-stable when Intl.DateTimeFormat is broken', () => {
  const originalDateTimeFormat = Intl.DateTimeFormat

  afterEach(() => {
    Intl.DateTimeFormat = originalDateTimeFormat
  })

  function breakDateTimeFormat() {
    // @ts-expect-error -- intentionally breaking the global to prove no dependency on it
    Intl.DateTimeFormat = function () {
      throw new Error('simulated broken/incomplete ICU locale data')
    }
  }

  it('formatDate produces the correct literal for every locale when Intl.DateTimeFormat throws', () => {
    breakDateTimeFormat()
    const expected: Record<string, string> = {
      en: '06/15/2026',
      uk: '15.06.2026',
      sq: '15.06.2026',
      it: '15/06/2026',
    }
    for (const locale of LOCALES) {
      expect(formatDate('2026-06-15T12:00:00.000Z', locale)).toBe(expected[locale])
    }
  })

  it('formatDateTime produces the correct literal for every locale when Intl.DateTimeFormat throws', () => {
    breakDateTimeFormat()
    const expected: Record<string, string> = {
      en: '01/01/2026, 12:30 AM',
      uk: '01.01.2026, 00:30',
      sq: '01.01.2026, 12:30 p.d.',
      it: '01/01/2026, 00:30',
    }
    for (const locale of LOCALES) {
      expect(formatDateTime('2026-01-01T00:30:00.000Z', locale)).toBe(expected[locale])
    }
  })

  it('formatListingDate produces the correct localized literal for every locale when Intl.DateTimeFormat throws', () => {
    breakDateTimeFormat()
    const expected: Record<string, string> = {
      en: 'Jun 15, 2026',
      uk: '15 черв. 2026 р.',
      sq: '15 qer 2026',
      it: '15 giu 2026',
    }
    for (const locale of LOCALES) {
      expect(formatListingDate('2026-06-15T12:00:00.000Z', locale)).toBe(expected[locale])
    }
  })

  it('edge cases (null/undefined/invalid) still return "—" when Intl.DateTimeFormat throws', () => {
    breakDateTimeFormat()
    expect(formatDate(null, 'sq')).toBe('—')
    expect(formatDateTime(undefined, 'sq')).toBe('—')
    expect(formatListingDate('not-a-date', 'sq')).toBe('—')
  })
})

// ── Additional PM/24h-boundary coverage for the manual hour-cycle composition ────

describe('formatDateTime — 12h vs 24h hour-cycle composition per locale', () => {
  it('en/sq (12-hour) show PM correctly after noon', () => {
    expect(formatDateTime('2026-01-01T13:05:00.000Z', 'en')).toBe('01/01/2026, 01:05 PM')
    expect(formatDateTime('2026-01-01T13:05:00.000Z', 'sq')).toBe('01.01.2026, 01:05 m.d.')
  })

  it('uk/it (24-hour) show 24h clock, no day-period marker', () => {
    expect(formatDateTime('2026-01-01T13:05:00.000Z', 'uk')).toBe('01.01.2026, 13:05')
    expect(formatDateTime('2026-01-01T13:05:00.000Z', 'it')).toBe('01/01/2026, 13:05')
  })

  it('midnight (00:00 UTC) shows 12 AM/p.d. for 12-hour locales, 00:00 for 24-hour locales', () => {
    expect(formatDateTime('2026-01-01T00:00:00.000Z', 'en')).toBe('01/01/2026, 12:00 AM')
    expect(formatDateTime('2026-01-01T00:00:00.000Z', 'sq')).toBe('01.01.2026, 12:00 p.d.')
    expect(formatDateTime('2026-01-01T00:00:00.000Z', 'uk')).toBe('01.01.2026, 00:00')
  })
})
