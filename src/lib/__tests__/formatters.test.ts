/**
 * formatPrice + formatListingDate — unit tests (Task 409 + rework).
 *
 * Verifies the canonical single-currency-marker contract,
 * the currency-free per_sqm label in all four locales,
 * and the listing-card date-with-year formatter.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { formatPrice, formatListingDate, formatShortDate, formatMonthAbbrev, formatFullDate, formatMonthFull, formatWeekdayShort } from '../formatters'

// ── formatPrice — single-currency-marker contract ─────────────────────────────

describe('formatPrice — single currency marker', () => {
  it('returns exactly one currency code in the output (en/EUR)', () => {
    const result = formatPrice(95000, 'EUR', 'en')
    const matches = result.match(/EUR/g) ?? []
    expect(matches).toHaveLength(1)
    expect(result).not.toMatch(/€/)
  })

  it('returns exactly one currency code in the output (sq/ALL)', () => {
    const result = formatPrice(50000, 'ALL', 'sq')
    const matches = result.match(/ALL/g) ?? []
    expect(matches).toHaveLength(1)
  })

  it('returns exactly one currency code in the output (uk/USD)', () => {
    const result = formatPrice(42852, 'USD', 'uk')
    const matches = result.match(/USD/g) ?? []
    expect(matches).toHaveLength(1)
    expect(result).not.toMatch(/EUR/)
  })

  it('does not embed a € symbol — only the 3-letter code', () => {
    expect(formatPrice(571, 'EUR', 'en')).not.toMatch(/€/)
    expect(formatPrice(571, 'USD', 'en')).not.toMatch(/\$/)
    expect(formatPrice(571, 'ALL', 'sq')).not.toMatch(/€/)
  })

  it('rounds fractional prices before formatting', () => {
    const result = formatPrice(571.9, 'EUR', 'en')
    expect(result).toContain('572')
    expect(result).toContain('EUR')
  })

  it('handles zero area guard — zero price still formats correctly', () => {
    const result = formatPrice(0, 'EUR', 'en')
    expect(result).toContain('EUR')
    expect(result).not.toMatch(/EUR.*EUR/)
  })
})

// ── per_sqm label — currency-free in all four locales ─────────────────────────

describe('messages per_sqm label — currency-free in sq/en/uk/it', () => {
  const root = join(process.cwd(), 'messages')

  const locales = [
    { code: 'en', file: join(root, 'en.json'), expected: '/m²' },
    { code: 'sq', file: join(root, 'sq.json'), expected: '/m²' },
    { code: 'it', file: join(root, 'it.json'), expected: '/m²' },
    { code: 'uk', file: join(root, 'uk.json'), expected: '/м²' },
  ]

  for (const { code, file, expected } of locales) {
    it(`${code}: listing.per_sqm is "${expected}"`, () => {
      const messages = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
      const listing = messages['listing'] as Record<string, string>
      expect(listing['per_sqm']).toBe(expected)
    })

    it(`${code}: listing.per_sqm does not contain €, $, USD, EUR, or ALL`, () => {
      const messages = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
      const listing = messages['listing'] as Record<string, string>
      const label = listing['per_sqm']
      expect(label).not.toMatch(/[€$]/)
      expect(label).not.toMatch(/\b(USD|EUR|ALL)\b/)
    })

    it(`${code}: composed per-sqm output has exactly one currency marker (no double)`, () => {
      const messages = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
      const listing = messages['listing'] as Record<string, string>
      const perSqmLabel = listing['per_sqm']
      const composed = `${formatPrice(571, 'USD', code)} ${perSqmLabel}`
      const usdMatches = composed.match(/USD/g) ?? []
      expect(usdMatches).toHaveLength(1)
      expect(composed).not.toMatch(/€/)
    })
  }
})

// ── formatListingDate — year-inclusive compact listing-card date ───────────────

describe('formatListingDate — includes year in all four locales', () => {
  const ISO = '2026-01-15T10:00:00Z'

  const locales = ['en', 'sq', 'uk', 'it']

  for (const locale of locales) {
    it(`${locale}: output contains a 4-digit year`, () => {
      const result = formatListingDate(ISO, locale)
      expect(result).toMatch(/2026/)
    })

    it(`${locale}: output does not contain relative-time words (no "ago", "тому")`, () => {
      const result = formatListingDate(ISO, locale)
      expect(result).not.toMatch(/\bago\b/i)
      expect(result).not.toMatch(/тому/i)
    })
  }

  it('en: output contains Jan (short English month) and year', () => {
    const result = formatListingDate(ISO, 'en')
    expect(result).toMatch(/Jan/i)
    expect(result).toContain('2026')
  })

  it('uk: output contains Cyrillic month abbreviation and year', () => {
    const result = formatListingDate(ISO, 'uk')
    // January in Ukrainian short = "січ." — verify Cyrillic content
    expect(result).toMatch(/[а-яА-ЯіїєґІЇЄҐ]/)
    expect(result).toContain('2026')
  })

  it('uk: output does NOT contain English-only month names', () => {
    const result = formatListingDate(ISO, 'uk')
    // Must not be only English months for a Ukrainian locale
    expect(result).not.toMatch(/^Jan |^Feb |^Mar /)
  })

  it('returns "—" for null input', () => {
    expect(formatListingDate(null, 'en')).toBe('—')
    expect(formatListingDate(undefined, 'en')).toBe('—')
  })

  it('returns "—" for invalid date string', () => {
    expect(formatListingDate('not-a-date', 'en')).toBe('—')
    expect(formatListingDate('', 'en')).toBe('—')
  })

  it('raw string input, not preformatted — same as Date object conversion', () => {
    const fromStr = formatListingDate(ISO, 'en')
    expect(fromStr).toBeTruthy()
    expect(fromStr).toContain('2026')
    expect(fromStr).not.toBe(ISO)
  })

  it('fixture date 2026-01-15 produces year 2026 in all locales', () => {
    for (const locale of locales) {
      expect(formatListingDate('2026-01-15T10:00:00Z', locale)).toContain('2026')
    }
  })
})

// ── Regression guard — detail page no longer needs .split('/') ────────────────

describe('per_sqm label allows direct use without .split("/")', () => {
  it('en: label starts with "/" so no split hack is needed', () => {
    const messages = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'en.json'), 'utf8')) as Record<string, unknown>
    const listing = messages['listing'] as Record<string, string>
    expect(listing['per_sqm'].startsWith('/')).toBe(true)
  })

  it('uk: Cyrillic label starts with "/" and м² is intact', () => {
    const messages = JSON.parse(readFileSync(join(process.cwd(), 'messages', 'uk.json'), 'utf8')) as Record<string, unknown>
    const listing = messages['listing'] as Record<string, string>
    expect(listing['per_sqm'].startsWith('/')).toBe(true)
    expect(listing['per_sqm']).toContain('м²')
    expect(listing['per_sqm']).not.toContain('m2')
  })
})

// ── Task 845 Revision 1 (W6) — chart date formatters use UTC getters consistently ─

describe('formatShortDate / formatMonthAbbrev / formatFullDate / formatMonthFull / formatWeekdayShort — UTC parsing, all 4 locales', () => {
  // A `YYYY-MM-DD` string parses as UTC midnight. Before this fix, `formatWeekdayShort` read
  // `getUTCDay()` while the other four read local `getDate()`/`getMonth()` — for any viewer west
  // of UTC (e.g. `America/New_York`), `new Date('2026-09-19')` is still 2026-09-18 in local time,
  // so the weekday and the day/month disagreed. `2026-09-19` (UTC) is a Saturday in September.
  const DATE = '2026-09-19'
  const locales = ['en', 'sq', 'uk', 'it'] as const

  for (const locale of locales) {
    it(`${locale}: all five formatters return non-empty, non-placeholder text for ${DATE}`, () => {
      for (const fn of [formatShortDate, formatMonthAbbrev, formatFullDate, formatMonthFull, formatWeekdayShort]) {
        const result = fn(DATE, locale)
        expect(result).toBeTruthy()
        expect(result).not.toBe('—')
      }
    })

    it(`${locale}: returns "—" for null/undefined/invalid input`, () => {
      for (const fn of [formatShortDate, formatMonthAbbrev, formatFullDate, formatMonthFull, formatWeekdayShort]) {
        expect(fn(null, locale)).toBe('—')
        expect(fn(undefined, locale)).toBe('—')
        expect(fn('not-a-date', locale)).toBe('—')
      }
    })
  }

  it('en: every formatter names September (the UTC month), never August/October', () => {
    expect(formatShortDate(DATE, 'en')).toBe('Sep 19')
    expect(formatMonthAbbrev(DATE, 'en')).toBe('Sep')
    expect(formatFullDate(DATE, 'en')).toBe('19 September')
    expect(formatMonthFull(DATE, 'en')).toBe('September')
    expect(formatWeekdayShort(DATE, 'en')).toBe('Sat')
  })

  it('uk: every formatter names вересень (the UTC month) in Cyrillic', () => {
    expect(formatShortDate(DATE, 'uk')).toBe('19 вер.')
    expect(formatMonthAbbrev(DATE, 'uk')).toBe('вер.')
    expect(formatFullDate(DATE, 'uk')).toBe('19 вересня')
    expect(formatMonthFull(DATE, 'uk')).toBe('Вересень')
    expect(formatWeekdayShort(DATE, 'uk')).toBe('Сб')
  })

  describe('TZ=America/New_York — UTC parsing keeps every formatter on the same calendar day regardless of the runtime local timezone', () => {
    const originalTZ = process.env.TZ

    beforeAll(() => {
      process.env.TZ = 'America/New_York'
    })

    afterAll(() => {
      if (originalTZ === undefined) delete process.env.TZ
      else process.env.TZ = originalTZ
    })

    it('formatWeekdayShort and formatShortDate both describe Saturday 19 September for 2026-09-19 in en', () => {
      // Pre-fix: `formatShortDate` read local `getDate()`/`getMonth()`, which resolve
      // `2026-09-19T00:00:00Z` back to 2026-09-18 under `America/New_York` (UTC-4) — a Friday, the
      // 18th, not the 19th — while `formatWeekdayShort`'s `getUTCDay()` still said Saturday. Both
      // now read UTC parts, so both agree regardless of the runtime's local timezone.
      expect(formatWeekdayShort(DATE, 'en')).toBe('Sat')
      expect(formatShortDate(DATE, 'en')).toBe('Sep 19')
      expect(formatMonthAbbrev(DATE, 'en')).toBe('Sep')
      expect(formatFullDate(DATE, 'en')).toBe('19 September')
      expect(formatMonthFull(DATE, 'en')).toBe('September')
    })
  })
})
