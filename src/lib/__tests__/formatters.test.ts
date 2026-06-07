/**
 * formatPrice + formatListingDate — unit tests (Task 409 + rework).
 *
 * Verifies the canonical single-currency-marker contract,
 * the currency-free per_sqm label in all four locales,
 * and the listing-card date-with-year formatter.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { formatPrice, formatListingDate } from '../formatters'

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
