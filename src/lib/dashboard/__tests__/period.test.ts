import { describe, it, expect } from 'vitest'
import {
  TIRANE_TZ,
  tiraneDateOf,
  tiraneYesterday,
  tiraneDayUtcBounds,
  resolvePeriod,
  previousPeriod,
  periodUtcBounds,
  listDates,
  validateCustomRange,
  parsePeriodParams,
  serializePeriod,
  compareToPrevious,
  tiraneAbsoluteLabel,
  type PeriodSelection,
} from '../period'

// Task 846 — every case passes an explicit `now`; nothing here reads the machine clock or zone.
const NORMAL_DAY = new Date('2026-09-18T08:00:00Z') // Tirane 10:00 on 2026-09-18 (CEST, +2)
const DST_START_DAY = new Date('2026-03-29T00:30:00Z') // Tirane 01:30 on 2026-03-29, the day clocks jump forward
const DST_END_DAY = new Date('2026-10-25T12:00:00Z') // Tirane 13:00 on 2026-10-25, the day clocks fall back
const PAST_LOCAL_MIDNIGHT = new Date('2026-09-18T22:30:00Z') // Tirane 00:30 on 2026-09-19

const HOUR_MS = 3_600_000
const lengthHours = (date: string) => {
  const { startUtc, endUtc } = tiraneDayUtcBounds(date)
  return (Date.parse(endUtc) - Date.parse(startUtc)) / HOUR_MS
}

describe('TIRANE_TZ', () => {
  it('is the IANA id Intl accepts (Europe/Tirana is rejected by Intl)', () => {
    expect(TIRANE_TZ).toBe('Europe/Tirane')
    expect(() => new Intl.DateTimeFormat('en-GB', { timeZone: TIRANE_TZ })).not.toThrow()
    expect(() => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Tirana' })).toThrow(RangeError)
  })
})

describe('case: normal day (2026-09-18 10:00 Tirane)', () => {
  it('cuts the local day in Tirane time', () => {
    expect(tiraneDateOf(NORMAL_DAY)).toBe('2026-09-18')
    expect(tiraneYesterday(NORMAL_DAY)).toBe('2026-09-17')
  })
  it('accepts an ISO string instant', () => {
    expect(tiraneDateOf('2026-01-15T23:30:00Z')).toBe('2026-01-16') // CET +1
  })
  it('summer day is UTC+2, winter day is UTC+1, both 24h', () => {
    expect(tiraneDayUtcBounds('2026-09-18')).toEqual({
      startUtc: '2026-09-17T22:00:00.000Z',
      endUtc: '2026-09-18T22:00:00.000Z',
    })
    expect(tiraneDayUtcBounds('2026-01-15')).toEqual({
      startUtc: '2026-01-14T23:00:00.000Z',
      endUtc: '2026-01-15T23:00:00.000Z',
    })
  })
  it('day bounds are half-open: consecutive days share the boundary', () => {
    expect(tiraneDayUtcBounds('2026-09-18').endUtc).toBe(tiraneDayUtcBounds('2026-09-19').startUtc)
  })
})

describe('case: DST start day (2026-03-29, 23h local day)', () => {
  it('yesterday is 2026-03-28', () => {
    expect(tiraneDateOf(DST_START_DAY)).toBe('2026-03-29')
    expect(tiraneYesterday(DST_START_DAY)).toBe('2026-03-28')
  })
  it('the local day is 23 hours long with DST-correct UTC bounds', () => {
    expect(tiraneDayUtcBounds('2026-03-29')).toEqual({
      startUtc: '2026-03-28T23:00:00.000Z',
      endUtc: '2026-03-29T22:00:00.000Z',
    })
    expect(lengthHours('2026-03-29')).toBe(23)
  })
  it('the 7d period ending yesterday is 03-22..03-28', () => {
    expect(resolvePeriod({ kind: '7d' }, DST_START_DAY)).toEqual({ from: '2026-03-22', to: '2026-03-28', days: 7 })
  })
})

describe('case: DST end day (2026-10-25, 25h local day)', () => {
  it('yesterday is 2026-10-24', () => {
    expect(tiraneDateOf(DST_END_DAY)).toBe('2026-10-25')
    expect(tiraneYesterday(DST_END_DAY)).toBe('2026-10-24')
  })
  it('the local day is 25 hours long with DST-correct UTC bounds', () => {
    expect(tiraneDayUtcBounds('2026-10-25')).toEqual({
      startUtc: '2026-10-24T22:00:00.000Z',
      endUtc: '2026-10-25T23:00:00.000Z',
    })
    expect(lengthHours('2026-10-25')).toBe(25)
  })
  it('a period spanning the change has exact UTC bounds', () => {
    const p = { from: '2026-10-24', to: '2026-10-25', days: 2 }
    expect(periodUtcBounds(p)).toEqual({
      startUtc: '2026-10-23T22:00:00.000Z',
      endUtc: '2026-10-25T23:00:00.000Z',
    })
  })
})

describe('case: instant already the next local day in Tirane (2026-09-18T22:30Z)', () => {
  it('today in Tirane is the 19th, so yesterday is 2026-09-18', () => {
    expect(tiraneDateOf(PAST_LOCAL_MIDNIGHT)).toBe('2026-09-19')
    expect(tiraneYesterday(PAST_LOCAL_MIDNIGHT)).toBe('2026-09-18')
  })
})

describe('resolvePeriod / previousPeriod / listDates', () => {
  it('7d and 30d end yesterday and contain exactly 7/30 dates', () => {
    const p7 = resolvePeriod({ kind: '7d' }, NORMAL_DAY)
    const p30 = resolvePeriod({ kind: '30d' }, NORMAL_DAY)
    expect(p7).toEqual({ from: '2026-09-11', to: '2026-09-17', days: 7 })
    expect(p30).toEqual({ from: '2026-08-19', to: '2026-09-17', days: 30 })
    expect(listDates(p7)).toHaveLength(7)
    expect(listDates(p30)).toHaveLength(30)
    expect(listDates(p30)[0]).toBe('2026-08-19')
    expect(listDates(p30)[29]).toBe('2026-09-17')
  })
  it('positive flow: 30d at 2026-09-18 10:00 Tirane, previous is 2026-07-20..2026-08-18', () => {
    const p = resolvePeriod({ kind: '30d' }, NORMAL_DAY)
    expect(previousPeriod(p)).toEqual({ from: '2026-07-20', to: '2026-08-18', days: 30 })
  })
  it('previous period is adjacent and equal in length', () => {
    for (const sel of [{ kind: '7d' }, { kind: '30d' }] as PeriodSelection[]) {
      const p = resolvePeriod(sel, NORMAL_DAY)
      const prev = previousPeriod(p)
      expect(prev.days).toBe(p.days)
      expect(listDates(prev)).toHaveLength(p.days)
      expect(periodUtcBounds(prev).endUtc).toBe(periodUtcBounds(p).startUtc)
    }
  })
  it('custom selection resolves to its own range', () => {
    expect(resolvePeriod({ kind: 'custom', from: '2026-09-01', to: '2026-09-10' }, NORMAL_DAY)).toEqual({
      from: '2026-09-01',
      to: '2026-09-10',
      days: 10,
    })
  })
  it('crosses a year boundary', () => {
    expect(listDates({ from: '2025-12-30', to: '2026-01-02', days: 4 })).toEqual([
      '2025-12-30',
      '2025-12-31',
      '2026-01-01',
      '2026-01-02',
    ])
  })
})

describe('validateCustomRange', () => {
  it('accepts a range ending yesterday', () => {
    expect(validateCustomRange('2026-09-01', '2026-09-17', NORMAL_DAY)).toBe('ok')
  })
  it('accepts exactly 90 days and rejects 91', () => {
    expect(validateCustomRange('2026-06-20', '2026-09-17', NORMAL_DAY)).toBe('ok') // 90 days
    expect(validateCustomRange('2026-06-19', '2026-09-17', NORMAL_DAY)).toBe('longer_than_90_days') // 91 days
  })
  it('rejects a range ending today (incomplete day) and in the future', () => {
    expect(validateCustomRange('2026-09-10', '2026-09-18', NORMAL_DAY)).toBe('end_after_yesterday')
    expect(validateCustomRange('2026-09-10', '2026-09-30', NORMAL_DAY)).toBe('end_after_yesterday')
  })
  it('uses the Tirane day, not the UTC day', () => {
    // 22:30Z on the 18th is already the 19th in Tirane, so the 18th is now selectable.
    expect(validateCustomRange('2026-09-10', '2026-09-18', PAST_LOCAL_MIDNIGHT)).toBe('ok')
  })
  it('rejects start after end', () => {
    expect(validateCustomRange('2026-09-10', '2026-09-05', NORMAL_DAY)).toBe('start_after_end')
  })
  it('rejects invalid dates', () => {
    expect(validateCustomRange('garbage', '2026-09-05', NORMAL_DAY)).toBe('invalid_date')
    expect(validateCustomRange('2026-09-01', '', NORMAL_DAY)).toBe('invalid_date')
    expect(validateCustomRange('2026-02-30', '2026-03-05', NORMAL_DAY)).toBe('invalid_date')
    expect(validateCustomRange('2026-9-1', '2026-09-05', NORMAL_DAY)).toBe('invalid_date')
  })
  it('accepts a single-day range', () => {
    expect(validateCustomRange('2026-09-17', '2026-09-17', NORMAL_DAY)).toBe('ok')
  })
})

describe('parsePeriodParams / serializePeriod', () => {
  const parse = (q: string) => parsePeriodParams(new URLSearchParams(q), NORMAL_DAY)

  it('parses the presets', () => {
    expect(parse('period=7d')).toEqual({ kind: '7d' })
    expect(parse('period=30d')).toEqual({ kind: '30d' })
  })
  it('parses a valid custom range', () => {
    expect(parse('period=custom&from=2026-09-01&to=2026-09-10')).toEqual({
      kind: 'custom',
      from: '2026-09-01',
      to: '2026-09-10',
    })
  })
  it('falls back to 30d for missing, garbage or partial input and never throws', () => {
    for (const q of [
      '',
      'period=',
      'period=garbage',
      'period=custom',
      'period=custom&from=2026-09-01',
      'period=custom&from=x&to=y',
      'period=%E0%A4%A',
    ]) {
      expect(parse(q)).toEqual({ kind: '30d' })
    }
  })
  it('falls back to 30d for a custom range ending today, over 90 days, or reversed', () => {
    expect(parse('period=custom&from=2026-09-10&to=2026-09-18')).toEqual({ kind: '30d' })
    expect(parse('period=custom&from=2026-01-01&to=2026-09-10')).toEqual({ kind: '30d' })
    expect(parse('period=custom&from=2026-09-10&to=2026-09-01')).toEqual({ kind: '30d' })
  })
  it('accepts a Next.js style record, including array values', () => {
    expect(parsePeriodParams({ period: '7d' }, NORMAL_DAY)).toEqual({ kind: '7d' })
    expect(parsePeriodParams({ period: ['7d', '30d'] }, NORMAL_DAY)).toEqual({ kind: '7d' })
    expect(parsePeriodParams({ period: undefined }, NORMAL_DAY)).toEqual({ kind: '30d' })
  })
  it('serializePeriod is the inverse of parsePeriodParams', () => {
    const selections: PeriodSelection[] = [
      { kind: '7d' },
      { kind: '30d' },
      { kind: 'custom', from: '2026-09-01', to: '2026-09-10' },
    ]
    for (const sel of selections) {
      const params = new URLSearchParams(serializePeriod(sel))
      expect(parsePeriodParams(params, NORMAL_DAY)).toEqual(sel)
    }
    expect(serializePeriod({ kind: '30d' })).toEqual({ period: '30d' })
  })
})

describe('compareToPrevious', () => {
  it('returns no_base when the previous value is 0 (never Infinity, NaN or +100%)', () => {
    expect(compareToPrevious(5, 0)).toEqual({ kind: 'no_base' })
    expect(compareToPrevious(0, 0)).toEqual({ kind: 'no_base' })
  })
  it('returns delta and an integer percent otherwise', () => {
    expect(compareToPrevious(15, 10)).toEqual({ kind: 'delta', delta: 5, percent: 50 })
    expect(compareToPrevious(5, 10)).toEqual({ kind: 'delta', delta: -5, percent: -50 })
    expect(compareToPrevious(10, 10)).toEqual({ kind: 'delta', delta: 0, percent: 0 })
    expect(compareToPrevious(1, 3)).toEqual({ kind: 'delta', delta: -2, percent: -67 })
  })
  it('never returns a non-finite number', () => {
    for (const [a, b] of [
      [NaN, 5],
      [5, NaN],
      [Infinity, 5],
      [5, Infinity],
    ]) {
      expect(compareToPrevious(a, b)).toEqual({ kind: 'no_base' })
    }
  })
})

describe('tiraneAbsoluteLabel', () => {
  it('renders the Tirane wall clock in the per-locale layout', () => {
    // 2026-09-18T08:05:00Z is 10:05 in Tirane (CEST).
    expect(tiraneAbsoluteLabel('2026-09-18T08:05:00Z', 'en')).toBe('09/18/2026, 10:05 AM')
    expect(tiraneAbsoluteLabel('2026-09-18T08:05:00Z', 'sq')).toBe('18.09.2026, 10:05 p.d.')
    expect(tiraneAbsoluteLabel('2026-09-18T08:05:00Z', 'uk')).toBe('18.09.2026, 10:05')
    expect(tiraneAbsoluteLabel('2026-09-18T08:05:00Z', 'it')).toBe('18/09/2026, 10:05')
  })
  it('crosses the local midnight', () => {
    expect(tiraneAbsoluteLabel('2026-09-18T22:30:00Z', 'uk')).toBe('19.09.2026, 00:30')
  })
  it('returns the em dash for invalid input', () => {
    expect(tiraneAbsoluteLabel('nope', 'en')).toBe('—')
  })
})
