/**
 * Dashboard period library — the single source for the spec's time rules (v3.3 §4). Task 846.
 *
 * - Store UTC; cut days in `Europe/Tirane` (IANA's canonical id — `Europe/Tirana` is REJECTED by
 *   `Intl` with a RangeError, measured on Node 22).
 * - "Today" is an incomplete day and is never part of a period or a comparison base.
 * - Presets are 7 and 30 COMPLETED local days ending yesterday; a custom range is at most 90 days
 *   and ends no later than yesterday.
 * - Comparison is against the previous equal, adjacent period; a zero base has no comparison.
 *
 * Everything here is pure: every function that needs "now" takes it as an argument, and nothing
 * reads the machine clock or the machine's time zone. Days are `'YYYY-MM-DD'` strings (Tirane
 * local dates); calendar arithmetic on them goes through `Date.UTC`, which has no DST.
 * No UI, no dependencies beyond `Intl` and `formatters.ts`.
 *
 * Consumers: 847, 848, 849, 853, 854, 855.
 */
import { formatDateTimeInZone } from '@/lib/formatters'

export const TIRANE_TZ = 'Europe/Tirane'

export const MAX_CUSTOM_RANGE_DAYS = 90
const DAY_MS = 86_400_000

/** A `'YYYY-MM-DD'` Tirane local date. */
export type DateString = string

export type PeriodSelection =
  | { kind: '7d' }
  | { kind: '30d' }
  | { kind: 'custom'; from: DateString; to: DateString }

/** An inclusive range of completed Tirane local days. */
export interface Period {
  from: DateString
  to: DateString
  days: number
}

export type CustomRangeValidation =
  | 'ok'
  | 'end_after_yesterday'
  | 'start_after_end'
  | 'longer_than_90_days'
  | 'invalid_date'

export type PeriodComparison =
  | { kind: 'no_base' }
  | { kind: 'delta'; delta: number; percent: number }

// ── calendar helpers (date strings ↔ UTC-midnight day numbers) ──────────────────────────────

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Days since the epoch for a real calendar date string, or `null` if it is not one. */
function dayNumber(date: string): number | null {
  const m = DATE_RE.exec(date)
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const ms = Date.UTC(y, mo - 1, d)
  const back = new Date(ms)
  // Rejects 2026-02-30 and similar: `Date.UTC` would silently roll them into the next month.
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null
  return ms / DAY_MS
}

function fromDayNumber(n: number): DateString {
  return new Date(n * DAY_MS).toISOString().slice(0, 10)
}

function addDays(date: DateString, delta: number): DateString {
  return fromDayNumber((dayNumber(date) as number) + delta)
}

// ── Tirane day cutting ──────────────────────────────────────────────────────────────────────

const PARTS_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: TIRANE_TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
})

/** The Tirane wall-clock fields of an instant. */
function tiraneWallClock(ms: number) {
  const parts = PARTS_FORMAT.formatToParts(new Date(ms))
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value)
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24,
    minute: get('minute'),
    second: get('second'),
  }
}

/** Tirane's offset from UTC, in ms, at an instant (positive east of UTC). */
function tiraneOffsetMs(ms: number): number {
  const w = tiraneWallClock(ms)
  const asIfUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second)
  return asIfUtc - Math.floor(ms / 1000) * 1000
}

/** The Tirane local calendar date of an instant. */
export function tiraneDateOf(instant: Date | string): DateString {
  const ms = typeof instant === 'string' ? Date.parse(instant) : instant.getTime()
  const w = tiraneWallClock(ms)
  return fromDayNumber(Date.UTC(w.year, w.month - 1, w.day) / DAY_MS)
}

/** Yesterday's Tirane local date — the last COMPLETED day as of `now`. */
export function tiraneYesterday(now: Date): DateString {
  return addDays(tiraneDateOf(now), -1)
}

/** The UTC instant at which a Tirane local day starts. */
function tiraneDayStartMs(date: DateString): number {
  const n = dayNumber(date)
  if (n === null) throw new RangeError(`Invalid date: ${date}`)
  const localMidnightAsUtc = n * DAY_MS
  // Tirane's DST switch happens at 01:00 UTC, i.e. 02:00/03:00 local — never at local midnight, so
  // one refinement of the offset guess is exact.
  const guess = localMidnightAsUtc - tiraneOffsetMs(localMidnightAsUtc)
  return localMidnightAsUtc - tiraneOffsetMs(guess)
}

/**
 * UTC bounds of one Tirane local day for `timestamptz` queries: `[startUtc, endUtc)`, half-open.
 * DST-correct: the day of the spring switch is 23h long and the day of the autumn switch is 25h.
 */
export function tiraneDayUtcBounds(date: DateString): { startUtc: string; endUtc: string } {
  return {
    startUtc: new Date(tiraneDayStartMs(date)).toISOString(),
    endUtc: new Date(tiraneDayStartMs(addDays(date, 1))).toISOString(),
  }
}

// ── periods ─────────────────────────────────────────────────────────────────────────────────

function periodOf(from: DateString, to: DateString): Period {
  return { from, to, days: (dayNumber(to) as number) - (dayNumber(from) as number) + 1 }
}

/** Resolves a selection to concrete completed Tirane days as of `now`. */
export function resolvePeriod(selection: PeriodSelection, now: Date): Period {
  if (selection.kind === 'custom') return periodOf(selection.from, selection.to)
  const to = tiraneYesterday(now)
  const days = selection.kind === '7d' ? 7 : 30
  return periodOf(addDays(to, -(days - 1)), to)
}

/** The adjacent period of equal length that ends the day before `period` starts. */
export function previousPeriod(period: Period): Period {
  const to = addDays(period.from, -1)
  return periodOf(addDays(to, -(period.days - 1)), to)
}

/** UTC bounds `[startUtc, endUtc)` covering every local day of the period. */
export function periodUtcBounds(period: Period): { startUtc: string; endUtc: string } {
  return {
    startUtc: tiraneDayUtcBounds(period.from).startUtc,
    endUtc: tiraneDayUtcBounds(period.to).endUtc,
  }
}

/** Every local date of the period, in order. */
export function listDates(period: Period): DateString[] {
  return Array.from({ length: period.days }, (_, i) => addDays(period.from, i))
}

// ── custom range validation and URL round-trip ──────────────────────────────────────────────

/**
 * Validates a custom range against the spec: real dates, `from <= to`, `to` no later than yesterday
 * (Tirane) and at most 90 days. Returns `'ok'` or the first failing code.
 */
export function validateCustomRange(from: string, to: string, now: Date): CustomRangeValidation {
  const fromN = dayNumber(from)
  const toN = dayNumber(to)
  if (fromN === null || toN === null) return 'invalid_date'
  if (fromN > toN) return 'start_after_end'
  if (toN > (dayNumber(tiraneYesterday(now)) as number)) return 'end_after_yesterday'
  if (toN - fromN + 1 > MAX_CUSTOM_RANGE_DAYS) return 'longer_than_90_days'
  return 'ok'
}

type ParamValue = string | string[] | undefined
export type PeriodSearchParams = URLSearchParams | Record<string, ParamValue>

function readParam(params: PeriodSearchParams, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

/**
 * Reads the period from URL search params (`period=7d|30d|custom`, plus `from`/`to` for custom).
 * Missing, malformed or invalid input — including a custom range that ends today, exceeds 90 days
 * or is reversed — falls back to `30d`. Never throws.
 */
export function parsePeriodParams(params: PeriodSearchParams, now: Date): PeriodSelection {
  try {
    const period = readParam(params, 'period')
    if (period === '7d') return { kind: '7d' }
    if (period === '30d') return { kind: '30d' }
    if (period === 'custom') {
      const from = readParam(params, 'from')
      const to = readParam(params, 'to')
      if (from && to && validateCustomRange(from, to, now) === 'ok') return { kind: 'custom', from, to }
    }
  } catch {
    // fall through to the default
  }
  return { kind: '30d' }
}

/** The inverse of `parsePeriodParams`: the query params that select `selection`. */
export function serializePeriod(selection: PeriodSelection): Record<string, string> {
  if (selection.kind === 'custom') return { period: 'custom', from: selection.from, to: selection.to }
  return { period: selection.kind }
}

// ── comparison and labels ───────────────────────────────────────────────────────────────────

/**
 * Compares a value with its previous-period value. A zero (or unusable) base returns `no_base` —
 * never Infinity, NaN or a "+100%" verdict (spec §4). `percent` is rounded to an integer.
 */
export function compareToPrevious(current: number, previous: number): PeriodComparison {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return { kind: 'no_base' }
  }
  const delta = current - previous
  const percent = Math.round((delta / Math.abs(previous)) * 100)
  return { kind: 'delta', delta, percent: percent === 0 ? 0 : percent } // normalise -0
}

/**
 * Absolute date-time label in Tirane wall-clock time for Task 844's `RelativeTime absoluteLabel`.
 * SERVER-ONLY: compute it on the server and pass the string down (see `formatDateTimeInZone`).
 */
export function tiraneAbsoluteLabel(iso: string, locale: string): string {
  return formatDateTimeInZone(iso, locale, TIRANE_TZ)
}
