/**
 * G1 — Date-format SSR/CSR parity guard (Task 445 / Epic RS Slice 6).
 *
 * Asserts literal-byte output for formatDate, formatDateTime, formatListingDate
 * across sq/en/uk/it. The TZ-invariance test for formatDateTime spawns child
 * Node processes with explicit TZ env values so V8 Intl state is cleanly
 * initialized — mutating process.env.TZ mid-process is unreliable.
 */

import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { formatDate, formatDateTime, formatListingDate } from '../formatters'

const LOCALES = ['sq', 'en', 'uk', 'it'] as const

// Near-day-boundary timestamp: 00:30 UTC is Dec 31 in UTC-5.
// formatDateTime pins timeZone:'UTC' so it always shows Jan 1.
// Removing that pin causes a byte difference in non-UTC timezones.
const TZ_TEST_ISO = '2026-01-01T00:30:00.000Z'

// Midday timestamp: same calendar date in all practical timezones (UTC-12..UTC+14).
// Used for formatDate/formatListingDate which do NOT pin TZ.
const SAFE_ISO = '2026-06-15T12:00:00.000Z'

// ── formatDate — literal byte assertions ─────────────────────────────────────

describe('formatDate — literal byte assertions per locale', () => {
  const expected: Record<string, string> = {
    sq: '15.06.2026',
    en: '06/15/2026',
    uk: '15.06.2026',
    it: '15/06/2026',
  }

  for (const locale of LOCALES) {
    it(`${locale}: formatDate('${SAFE_ISO}') === '${expected[locale]}'`, () => {
      expect(formatDate(SAFE_ISO, locale)).toBe(expected[locale])
    })
  }
})

// ── formatDateTime — literal byte assertions (TZ pinned to UTC) ──────────────

describe('formatDateTime — literal byte assertions per locale', () => {
  const expected: Record<string, string> = {
    sq: '01.01.2026, 12:30 p.d.',
    en: '01/01/2026, 12:30 AM',
    uk: '01.01.2026, 00:30',
    it: '01/01/2026, 00:30',
  }

  for (const locale of LOCALES) {
    it(`${locale}: formatDateTime('${TZ_TEST_ISO}') === expected literal`, () => {
      const result = formatDateTime(TZ_TEST_ISO, locale)
      // Normalize Unicode narrow no-break space (U+202F) to regular space for
      // cross-platform stability — Node/ICU may emit either.
      const normalized = result.replace(/ /g, ' ')
      const expectedNormalized = expected[locale].replace(/ /g, ' ')
      expect(normalized).toBe(expectedNormalized)
    })
  }
})

// ── formatListingDate — literal byte assertions ──────────────────────────────

describe('formatListingDate — literal byte assertions per locale', () => {
  const expected: Record<string, string> = {
    sq: '15 qer 2026',
    en: 'Jun 15, 2026',
    uk: '15 черв. 2026 р.',
    it: '15 giu 2026',
  }

  for (const locale of LOCALES) {
    it(`${locale}: formatListingDate('${SAFE_ISO}') === '${expected[locale]}'`, () => {
      expect(formatListingDate(SAFE_ISO, locale)).toBe(expected[locale])
    })
  }
})

// ── formatDateTime TZ-invariance — child-process approach ────────────────────
// Spawns two child Node processes (TZ=UTC vs TZ=America/New_York) that import
// the real formatDateTime and print the output. Asserts byte-identical results.

describe('formatDateTime — TZ-invariance (child process)', () => {
  function runInTZ(tz: string): Record<string, string> {
    const script = `
      const { formatDateTime } = require('./src/lib/formatters');
      const iso = '${TZ_TEST_ISO}';
      const result = {};
      for (const l of ['sq','en','uk','it']) {
        result[l] = formatDateTime(iso, l);
      }
      process.stdout.write(JSON.stringify(result));
    `
    const out = execSync(`npx tsx -e "${script.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
      env: { ...process.env, TZ: tz },
      encoding: 'utf-8',
      timeout: 15_000,
    })
    return JSON.parse(out) as Record<string, string>
  }

  it('formatDateTime output is byte-identical under TZ=UTC and TZ=America/New_York', () => {
    const utcResults = runInTZ('UTC')
    const nyResults = runInTZ('America/New_York')

    for (const locale of LOCALES) {
      expect(utcResults[locale]).toBe(nyResults[locale])
    }
  })
})

// ── Edge cases: null / undefined / invalid → '—' ────────────────────────────

describe('edge cases — null / undefined / invalid → "—"', () => {
  const fns = [
    { name: 'formatDate', fn: formatDate },
    { name: 'formatDateTime', fn: formatDateTime },
    { name: 'formatListingDate', fn: formatListingDate },
  ] as const

  for (const { name, fn } of fns) {
    it(`${name}(null) → '—'`, () => {
      expect(fn(null, 'en')).toBe('—')
    })

    it(`${name}(undefined) → '—'`, () => {
      expect(fn(undefined, 'en')).toBe('—')
    })

    it(`${name}('invalid') → '—'`, () => {
      expect(fn('not-a-date', 'en')).toBe('—')
    })

    it(`${name}('') → '—'`, () => {
      expect(fn('', 'en')).toBe('—')
    })
  }
})
