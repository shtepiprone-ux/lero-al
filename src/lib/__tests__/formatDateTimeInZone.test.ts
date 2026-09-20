import { describe, it, expect } from 'vitest'
import { formatDateTime, formatDateTimeInZone } from '../formatters'

// Task 846 R4 — same per-locale layout as `formatDateTime`, but for the wall clock of an IANA zone.
describe('formatDateTimeInZone', () => {
  it('UTC zone reproduces formatDateTime exactly for every locale', () => {
    const iso = '2026-09-18T14:05:00Z'
    for (const locale of ['en', 'sq', 'uk', 'it']) {
      expect(formatDateTimeInZone(iso, locale, 'UTC')).toBe(formatDateTime(iso, locale))
    }
  })
  it('shifts to the wall clock of Europe/Tirane (summer +2, winter +1)', () => {
    expect(formatDateTimeInZone('2026-09-18T08:05:00Z', 'uk', 'Europe/Tirane')).toBe('18.09.2026, 10:05')
    expect(formatDateTimeInZone('2026-01-15T08:05:00Z', 'uk', 'Europe/Tirane')).toBe('15.01.2026, 09:05')
  })
  it('uses the 12h layout with the locale day-period for en and sq', () => {
    expect(formatDateTimeInZone('2026-09-18T13:30:00Z', 'en', 'Europe/Tirane')).toBe('09/18/2026, 03:30 PM')
    expect(formatDateTimeInZone('2026-09-18T13:30:00Z', 'sq', 'Europe/Tirane')).toBe('18.09.2026, 03:30 m.d.')
  })
  it('renders midnight as 00:00 in 24h locales and 12:00 AM in 12h locales (never 24:00)', () => {
    expect(formatDateTimeInZone('2026-09-18T22:00:00Z', 'uk', 'Europe/Tirane')).toBe('19.09.2026, 00:00')
    expect(formatDateTimeInZone('2026-09-18T22:00:00Z', 'en', 'Europe/Tirane')).toBe('09/19/2026, 12:00 AM')
  })
  it('falls back to the en layout for an unknown locale, like formatDateTime', () => {
    expect(formatDateTimeInZone('2026-09-18T08:05:00Z', 'xx', 'Europe/Tirane')).toBe('09/18/2026, 10:05 AM')
  })
  it('returns the em dash for null, undefined, empty and invalid input', () => {
    expect(formatDateTimeInZone(null, 'en', 'Europe/Tirane')).toBe('—')
    expect(formatDateTimeInZone(undefined, 'en', 'Europe/Tirane')).toBe('—')
    expect(formatDateTimeInZone('', 'en', 'Europe/Tirane')).toBe('—')
    expect(formatDateTimeInZone('nope', 'en', 'Europe/Tirane')).toBe('—')
  })
  it('returns the em dash for an invalid time zone instead of throwing', () => {
    expect(formatDateTimeInZone('2026-09-18T08:05:00Z', 'en', 'Europe/Tirana')).toBe('—')
  })
})
