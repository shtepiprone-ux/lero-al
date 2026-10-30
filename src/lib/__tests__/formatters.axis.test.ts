/**
 * formatDayNumber + formatDateRange — the chart axis text (Task 923 Revision 7, owner 2026-10-17): a time-axis tick is the bare day of the month,
 * never a month name; the month (and the period) is stated once above the chart, as a range. UTC parsing: a bare YYYY-MM-DD date never shifts a day.
 */
import { describe, it, expect } from 'vitest'
import { formatDayNumber, formatDateRange, formatShortDate } from '../formatters'

describe('formatDayNumber — the bare day of the month', () => {
  it('is the day only, without a leading zero, a month or a year', () => {
    expect(formatDayNumber('2026-09-17')).toBe('17')
    expect(formatDayNumber('2026-09-01')).toBe('1')
    expect(formatDayNumber('2026-12-31')).toBe('31')
    expect(formatDayNumber('2026-02-28')).toBe('28')
  })

  it('reads the UTC day, whatever the runtime time zone', () => {
    const before = process.env.TZ
    try {
      for (const tz of ['UTC', 'America/New_York', 'Pacific/Auckland']) {
        process.env.TZ = tz
        expect(formatDayNumber('2026-09-19')).toBe('19')
      }
    } finally {
      if (before === undefined) delete process.env.TZ
      else process.env.TZ = before
    }
  })

  it('is a dash for a missing or invalid date', () => {
    expect(formatDayNumber(null)).toBe('—')
    expect(formatDayNumber(undefined)).toBe('—')
    expect(formatDayNumber('')).toBe('—')
    expect(formatDayNumber('not a date')).toBe('—')
  })

  it('never contains a letter (so never a month name) for any day of a year', () => {
    for (let i = 0; i < 366; i++) {
      const d = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10)
      expect(formatDayNumber(d)).toMatch(/^\d{1,2}$/)
    }
  })
})

describe('formatDateRange — the period stated once above the chart', () => {
  it('en: "Aug 19 – Sep 17" (month then day), the first and the last date, both months named', () => {
    expect(formatDateRange('2026-08-19', '2026-09-17', 'en')).toBe('Aug 19 – Sep 17')
  })

  it('every locale joins the two formatShortDate values with an en dash', () => {
    for (const l of ['sq', 'en', 'uk', 'it']) {
      expect(formatDateRange('2026-08-19', '2026-09-17', l)).toBe(`${formatShortDate('2026-08-19', l)} – ${formatShortDate('2026-09-17', l)}`)
    }
  })

  it('a single day is one date, not "X – X"', () => {
    expect(formatDateRange('2026-09-17', '2026-09-17', 'en')).toBe('Sep 17')
  })

  it('is empty when either end is missing or invalid, so a card without data shows no caption', () => {
    expect(formatDateRange(undefined, '2026-09-17', 'en')).toBe('')
    expect(formatDateRange('2026-08-19', null, 'en')).toBe('')
    expect(formatDateRange('2026-08-19', 'nope', 'en')).toBe('')
    expect(formatDateRange('', '', 'en')).toBe('')
  })

  it('a period across a month boundary names both months (the ticks only carry days)', () => {
    const r = formatDateRange('2026-08-19', '2026-09-17', 'en')
    expect(r).toContain('Aug')
    expect(r).toContain('Sep')
  })
})
