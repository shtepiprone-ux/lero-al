/**
 * Price-format SSR/CSR parity guard (Task 563).
 *
 * Root cause: some browsers' bundled ICU lacks locale data entirely for `sq`
 * (`Intl.NumberFormat.supportedLocalesOf(['sq'])` → `[]` in Chromium — verified
 * directly, same class of gap as Task 562's calendar-name fix). `formatPrice`/
 * `formatCount` no longer call `Intl.NumberFormat` at all (see `NUMBER_GROUPING`
 * in `formatters.ts`) — grouping is computed from a static per-locale table
 * extracted from Node's full-ICU output, so output cannot diverge between a
 * runtime with complete locale data and one without.
 *
 * The "Intl.NumberFormat throws" tests below directly simulate the failure mode
 * (a runtime whose ICU cannot construct a NumberFormat for the given locale) and
 * assert the exact expected literal still comes out — proving the fix does not
 * depend on `Intl.NumberFormat` succeeding at all. If `formatPrice`/`formatCount`
 * were ever reverted to call `Intl.NumberFormat` directly, these tests would fail
 * (throw), catching the regression.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { formatPrice, formatCount } from '../formatters'

const LOCALES = ['en', 'uk', 'sq', 'it'] as const

// ── Literal-byte assertions — grouping matches Node's authoritative full-ICU output ──

describe('formatPrice — literal byte assertions per locale (5-digit price, grouped)', () => {
  const expected: Record<string, string> = {
    en: '45,000 ALL',
    uk: '45 000 ALL',
    sq: '45 000 ALL',
    it: '45.000 ALL',
  }

  for (const locale of LOCALES) {
    it(`${locale}: formatPrice(45000, 'ALL', '${locale}') === expected literal`, () => {
      expect(formatPrice(45000, 'ALL', locale)).toBe(expected[locale])
    })
  }
})

describe('formatPrice — sq/it 4-digit prices are NOT grouped (real CLDR behavior)', () => {
  // sq/it CLDR data requires >=5 total digits before any grouping is applied —
  // a naive "insert a separator every 3 digits" reimplementation would wrongly
  // group 4-digit numbers like "4500" -> "4.500"/"4 500", which is NOT what real
  // ICU does for these two locales (verified directly against Node's Intl output).
  const expected: Record<string, string> = {
    en: '4,500 EUR',
    uk: '4 500 EUR',
    sq: '4500 EUR',
    it: '4500 EUR',
  }

  for (const locale of LOCALES) {
    it(`${locale}: formatPrice(4500, 'EUR', '${locale}') === expected literal`, () => {
      expect(formatPrice(4500, 'EUR', locale)).toBe(expected[locale])
    })
  }
})

describe('formatPrice — multi-group price (7 digits)', () => {
  const expected: Record<string, string> = {
    en: '1,234,567 USD',
    uk: '1 234 567 USD',
    sq: '1 234 567 USD',
    it: '1.234.567 USD',
  }

  for (const locale of LOCALES) {
    it(`${locale}: formatPrice(1234567, 'USD', '${locale}') === expected literal`, () => {
      expect(formatPrice(1234567, 'USD', locale)).toBe(expected[locale])
    })
  }
})

describe('formatCount — literal byte assertions per locale', () => {
  const expected: Record<string, string> = {
    en: '45,000',
    uk: '45 000',
    sq: '45 000',
    it: '45.000',
  }

  for (const locale of LOCALES) {
    it(`${locale}: formatCount(45000, '${locale}') === expected literal`, () => {
      expect(formatCount(45000, locale)).toBe(expected[locale])
    })
  }
})

// ── Hydration-mismatch simulation — Intl.NumberFormat unavailable/broken ─────────
// Directly reproduces the failure mode behind the original bug: a runtime whose
// ICU either lacks the locale entirely or otherwise fails. If formatPrice/formatCount
// depended on Intl.NumberFormat succeeding, these would throw. Planted-violation:
// temporarily route formatPrice/formatCount back through `new Intl.NumberFormat(locale,
// {maximumFractionDigits:0}).format(...)` -> these tests FAIL (the patched constructor
// throws) instead of producing the expected literal.

describe('formatPrice/formatCount — hydration-stable even when Intl.NumberFormat is broken', () => {
  const originalNumberFormat = Intl.NumberFormat

  afterEach(() => {
    Intl.NumberFormat = originalNumberFormat
  })

  it('formatPrice for sq/it still produces the correct literal when Intl.NumberFormat throws for every locale', () => {
    // @ts-expect-error -- intentionally breaking the global to prove no dependency on it
    Intl.NumberFormat = function () {
      throw new Error('simulated broken/incomplete ICU locale data')
    }

    expect(formatPrice(45000, 'ALL', 'sq')).toBe('45 000 ALL')
    expect(formatPrice(45000, 'ALL', 'it')).toBe('45.000 ALL')
    expect(formatPrice(45000, 'ALL', 'en')).toBe('45,000 ALL')
    expect(formatPrice(45000, 'ALL', 'uk')).toBe('45 000 ALL')
  })

  it('formatCount is unaffected by a broken Intl.NumberFormat', () => {
    // @ts-expect-error -- intentionally breaking the global to prove no dependency on it
    Intl.NumberFormat = function () {
      throw new Error('simulated broken/incomplete ICU locale data')
    }

    expect(formatCount(4500, 'sq')).toBe('4500')
    expect(formatCount(4500, 'it')).toBe('4500')
  })
})

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('formatPrice — edge cases', () => {
  it('rounds fractional prices before grouping', () => {
    expect(formatPrice(571.9, 'EUR', 'en')).toBe('572 EUR')
  })

  it('zero price formats without a double currency marker', () => {
    expect(formatPrice(0, 'EUR', 'en')).toBe('0 EUR')
  })

  it('negative values are grouped correctly (per-sqm / adjustments)', () => {
    expect(formatPrice(-45000, 'ALL', 'sq')).toBe('-45 000 ALL')
    expect(formatPrice(-45000, 'ALL', 'it')).toBe('-45.000 ALL')
  })

  it('unknown locale falls back to the en grouping table (never throws)', () => {
    expect(formatPrice(45000, 'EUR', 'fr')).toBe('45,000 EUR')
  })
})
