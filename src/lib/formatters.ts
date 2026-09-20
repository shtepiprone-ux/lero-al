import enMessages from '../../messages/en.json'
import ukMessages from '../../messages/uk.json'
import sqMessages from '../../messages/sq.json'
import itMessages from '../../messages/it.json'

/**
 * Returns a currency code for display as-is.
 *
 * Currency codes are domain identifiers (ISO 4217-style), never i18n keys.
 * Never pass a currency code through useTranslations/t() — `ALL` is Albanian lek,
 * not the UI word "all/everything". This function makes that contract explicit.
 */
export function normalizeCurrencyCode(code: string): string {
  return code.toUpperCase()
}

/**
 * Per-locale digit-grouping data (separator + minimum leading-group digit count before
 * grouping applies), extracted from Node's full-ICU `Intl.NumberFormat` output — the
 * authoritative reference, since the Node server always has complete CLDR data.
 *
 * NOT sourced from a live `Intl.NumberFormat` call at render time: some browsers'
 * bundled ICU lacks locale data entirely for less-common locales (confirmed for `sq` —
 * `Intl.NumberFormat.supportedLocalesOf(['sq'])` → `[]` in Chromium — same class of gap
 * as Task 562's calendar-name fix), which silently falls back to a different grouping
 * (comma) than the server produces (space), causing a hydration mismatch. Grouping is
 * computed manually from this static table instead, so output is identical on every
 * runtime regardless of that runtime's own ICU completeness.
 */
const NUMBER_GROUPING: Record<string, { separator: string; minimumGroupingDigits: number }> = {
  en: { separator: ',', minimumGroupingDigits: 1 },
  uk: { separator: ' ', minimumGroupingDigits: 1 },
  sq: { separator: ' ', minimumGroupingDigits: 2 },
  it: { separator: '.', minimumGroupingDigits: 2 },
}

/**
 * Groups an integer's digits per-locale without depending on `Intl.NumberFormat` (see
 * `NUMBER_GROUPING`). Mirrors real CLDR behavior for `sq`/`it`, which omit grouping
 * entirely below a 5-digit threshold (e.g. `4500`, never `4.500`/`4 500`) but group
 * normally at/above it — verified against Node's `Intl.NumberFormat` output.
 */
function groupDigits(value: number, locale: string): string {
  const negative = value < 0
  const digits = Math.abs(value).toString()
  const { separator, minimumGroupingDigits } = NUMBER_GROUPING[locale] ?? NUMBER_GROUPING.en
  let grouped = digits
  if (digits.length >= 3 + minimumGroupingDigits) {
    const leadLen = digits.length % 3 || 3
    const parts = [digits.slice(0, leadLen)]
    for (let i = leadLen; i < digits.length; i += 3) parts.push(digits.slice(i, i + 3))
    grouped = parts.join(separator)
  }
  return negative ? `-${grouped}` : grouped
}

/**
 * Formats a price for display. Always requires an explicit locale so
 * server-side and client-side rendering produce identical output (hydration-safe,
 * independent of the runtime's own ICU locale-data completeness — see `NUMBER_GROUPING`).
 *
 * Use the route locale from params (server) or useLocale() (client).
 */
export function formatPrice(price: number, currency: string, locale: string): string {
  const formatted = groupDigits(Math.round(price), locale)
  return currency ? `${formatted} ${normalizeCurrencyCode(currency)}` : formatted
}

/**
 * Formats a plain count (e.g. stats). Requires explicit locale for the same reason.
 */
export function formatCount(value: number, locale: string): string {
  return groupDigits(Math.round(value), locale)
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Per-locale numeric date/time layout, extracted from Node's full-ICU `Intl.DateTimeFormat`
 * output (authoritative reference) — same rationale as `NUMBER_GROUPING` (Task 563): some
 * browsers' bundled ICU lacks locale data entirely for `sq` (`Intl.DateTimeFormat
 * .supportedLocalesOf(['sq'])` → `[]` in Chromium), silently falling back to a different
 * locale and diverging from the server's output. `formatDate`/`formatDateTime` compose the
 * string manually from `Date` parts instead of calling `Intl.DateTimeFormat` at render time.
 */
const DATE_FORMAT: Record<string, {
  order: 'dmy' | 'mdy'
  separator: string
  hour12: boolean
  dayPeriod?: [am: string, pm: string]
}> = {
  en: { order: 'mdy', separator: '/', hour12: true, dayPeriod: ['AM', 'PM'] },
  uk: { order: 'dmy', separator: '.', hour12: false },
  sq: { order: 'dmy', separator: '.', hour12: true, dayPeriod: ['p.d.', 'm.d.'] },
  it: { order: 'dmy', separator: '/', hour12: false },
}

function composeDateParts(day: number, month: number, year: number, locale: string): string {
  const { order, separator } = DATE_FORMAT[locale] ?? DATE_FORMAT.en
  const d = pad2(day)
  const m = pad2(month)
  const y = String(year)
  return (order === 'mdy' ? [m, d, y] : [d, m, y]).join(separator)
}

function composeTimeParts(hours: number, minutes: number, locale: string): string {
  const cfg = DATE_FORMAT[locale] ?? DATE_FORMAT.en
  const mm = pad2(minutes)
  if (!cfg.hour12) return `${pad2(hours)}:${mm}`
  const period = hours < 12 ? cfg.dayPeriod![0] : cfg.dayPeriod![1]
  const displayHour = hours % 12 === 0 ? 12 : hours % 12
  return `${pad2(displayHour)}:${mm} ${period}`
}

/**
 * Formats an ISO date string as a locale-aware absolute calendar date (numeric, locale order —
 * e.g. `en`: MM/DD/YYYY, `sq`/`uk`: DD.MM.YYYY, `it`: DD/MM/YYYY — see `DATE_FORMAT`).
 * Uses the runtime's local system timezone (unchanged prior behavior — no timezone pin here;
 * see `formatDateTime` for the UTC-pinned variant). Requires explicit locale for SSR/client
 * parity — output is composed from `Date` parts, not a live `Intl.DateTimeFormat` call, so it
 * cannot diverge between a runtime with complete locale data and one without (see `DATE_FORMAT`).
 * Returns '—' on null, undefined, or invalid input.
 */
export function formatDate(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    return composeDateParts(d.getDate(), d.getMonth() + 1, d.getFullYear(), locale)
  } catch {
    return '—'
  }
}

/**
 * Formats an ISO datetime string as a locale-aware absolute date+time (day/month/year hour:minute).
 * Uses an explicit fixed timezone (UTC) so the Node.js server and the browser always produce
 * byte-identical text, preventing SSR/CSR hydration mismatches caused by Intl locale or timezone
 * divergence between runtimes. Composed from `Date` UTC parts (see `DATE_FORMAT`), not a live
 * `Intl.DateTimeFormat` call, so it also cannot diverge due to a runtime's ICU completeness.
 * Returns '—' on null, undefined, or invalid input.
 */
export function formatDateTime(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    const datePart = composeDateParts(d.getUTCDate(), d.getUTCMonth() + 1, d.getUTCFullYear(), locale)
    const timePart = composeTimeParts(d.getUTCHours(), d.getUTCMinutes(), locale)
    return `${datePart}, ${timePart}`
  } catch {
    return '—'
  }
}

/**
 * Zone-aware variant of `formatDateTime` (Task 846 R4): the SAME per-locale layout
 * (`DATE_FORMAT` → `composeDateParts`/`composeTimeParts`), but for the wall clock of `timeZone`
 * (an IANA id, e.g. `Europe/Tirane`) instead of UTC. Only the numeric wall-clock parts come from
 * `Intl.DateTimeFormat('en-US', …).formatToParts` — the fixed `en-US` locale is used purely as a
 * zone-conversion engine (its ICU data is present in every runtime), never for layout, so `sq`
 * still renders through the manual composition described at `DATE_FORMAT`.
 *
 * SERVER-ONLY USE: call this on the server and pass the resulting string down (Task 844 R5,
 * `RelativeTime absoluteLabel`). Zone conversion depends on the runtime's tz database, so a
 * client-side call is not guaranteed to match the server byte for byte.
 *
 * Returns '—' on null, undefined, invalid input, or an invalid time zone (never throws).
 */
export function formatDateTimeInZone(
  dateStr: string | null | undefined,
  locale: string,
  timeZone: string,
): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).formatToParts(d)
    const part = (type: Intl.DateTimeFormatPartTypes): number =>
      Number(parts.find((p) => p.type === type)?.value)
    const datePart = composeDateParts(part('day'), part('month'), part('year'), locale)
    // `% 24`: some engines report midnight as "24" even under `h23`.
    const timePart = composeTimeParts(part('hour') % 24, part('minute'), locale)
    return `${datePart}, ${timePart}`
  } catch {
    return '—'
  }
}

/** `common.calendar_*` data (Task 562) reused here — do not duplicate; keyed by locale. */
const CALENDAR_MESSAGES: Record<string, {
  common: {
    calendar_months: string[]
    calendar_months_short: string[]
    calendar_months_formatting: string[]
    calendar_month_year_suffix: string
    calendar_summary_order: string
    calendar_weekdays_short: string[]
  }
}> = { en: enMessages, uk: ukMessages, sq: sqMessages, it: itMessages } as never

/**
 * Compact localized listing-card date that always includes the year.
 * e.g. en:"Jun 15, 2026" · uk:"15 черв. 2026 р." · it:"15 giu 2026" · sq:"15 qer 2026"
 * Composed from `common.calendar_months_short`/`calendar_month_year_suffix`/
 * `calendar_summary_order` (the same static i18n data Task 562 added for the
 * `RangeDatePicker` calendar body) instead of a live `Intl.DateTimeFormat` call — some
 * browsers' bundled ICU lacks locale data entirely for `sq`, which would otherwise render
 * an English month name on the client while the server (full ICU) renders Albanian.
 * Uses the runtime's local system timezone (unchanged prior behavior).
 * Returns '—' on null, undefined, or invalid input.
 */
export function formatListingDate(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    const { calendar_months_short, calendar_month_year_suffix, calendar_summary_order } =
      (CALENDAR_MESSAGES[locale] ?? CALENDAR_MESSAGES.en).common
    const day = d.getDate()
    const month = calendar_months_short[d.getMonth()]
    const year = d.getFullYear()
    return calendar_summary_order === 'month_day'
      ? `${month} ${day}, ${year}`
      : `${day} ${month} ${year}${calendar_month_year_suffix}`
  } catch {
    return '—'
  }
}

/**
 * Compact localized date WITHOUT the year — day + short month only, e.g. en:"Jun 15" ·
 * uk:"15 черв." · it:"15 giu" · sq:"15 qer". Same safe, static `calendar_months_short` data as
 * `formatListingDate` (never a live `Intl.DateTimeFormat` call — some browsers' bundled ICU has no
 * `sq` locale data at all). For dense chart axis ticks where a full year repeated on every point
 * (Task 845 Pass 10 — a 7-point week view previously fit only 3 of 7 `formatListingDate` labels on
 * a narrow screen before wrapping/overlap-hiding kicked in). Returns '—' on null, undefined, or
 * invalid input.
 */
export function formatShortDate(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    const { calendar_months_short, calendar_summary_order } = (CALENDAR_MESSAGES[locale] ?? CALENDAR_MESSAGES.en).common
    // UTC getters (Task 845 Revision 1, W6 — owner-reported): a bare `YYYY-MM-DD` string parses as
    // UTC midnight. `getDate()`/`getMonth()` read that instant back in the RUNTIME's own local
    // timezone, which disagrees with `formatWeekdayShort`'s `getUTCDay()` (already UTC) for any
    // viewer west of UTC — e.g. `formatWeekdayShort('2026-09-19', 'en')` said "Sat" while this
    // function said "18" for the same input under `TZ=America/New_York`. All five of this file's
    // `YYYY-MM-DD`-input chart formatters now read UTC parts consistently.
    const day = d.getUTCDate()
    const month = calendar_months_short[d.getUTCMonth()]
    return calendar_summary_order === 'month_day' ? `${month} ${day}` : `${day} ${month}`
  } catch {
    return '—'
  }
}

/**
 * The bare localized short month name — e.g. en:"Jun" · uk:"черв." · it:"giu" · sq:"qer". Same
 * safe, static `calendar_months_short` data as `formatListingDate`/`formatShortDate` (never a live
 * `Intl.DateTimeFormat` call). For a chart whose header already states the active month/year via
 * `MantineDashboardCard`'s own `scopeLabel` slot, so a per-point axis tick never needs to repeat it
 * — e.g. a 12-point year view's own ticks (Task 845 Pass 10, owner correction: state the period
 * ONCE next to the title, then let the chart's own axis show only the bare value the reference
 * needs, never the month name on every single tick). Returns '—' on null, undefined, or invalid
 * input.
 */
export function formatMonthAbbrev(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    const { calendar_months_short } = (CALENDAR_MESSAGES[locale] ?? CALENDAR_MESSAGES.en).common
    // UTC getter (Task 845 Revision 1, W6) — see `formatShortDate`'s own comment.
    return calendar_months_short[d.getUTCMonth()]
  } catch {
    return '—'
  }
}

/**
 * Day + full month name, no year — e.g. en:"19 September" · uk:"19 вересня" · it:"19 settembre" ·
 * sq:"19 shtator". Uses `common.calendar_months_formatting` (already in every locale file, the
 * standard CLDR "format" form used when a month name is preceded by a day number — for Ukrainian
 * specifically this is the grammatically-required GENITIVE case, "вересня" not the standalone
 * nominative "вересень" `calendar_months`/`calendar_months_short` carry; en/sq/it have no such
 * case distinction, so their `calendar_months_formatting` values are identical to their
 * `calendar_months`). Never a live `Intl.DateTimeFormat` call. For a chart tooltip that needs a
 * genuinely full, unambiguous date on hover (Task 845 Pass 10, owner-requested) while the chart's
 * own dense axis ticks stay bare (`formatMonthAbbrev`) — two different labels for two different
 * contexts sharing one point, not one function trying to serve both. Returns '—' on null,
 * undefined, or invalid input.
 */
export function formatFullDate(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    const { calendar_months_formatting } = (CALENDAR_MESSAGES[locale] ?? CALENDAR_MESSAGES.en).common
    // UTC getters (Task 845 Revision 1, W6) — see `formatShortDate`'s own comment.
    return `${d.getUTCDate()} ${calendar_months_formatting[d.getUTCMonth()]}`
  } catch {
    return '—'
  }
}

/**
 * The bare full, standalone month name — e.g. en:"September" · uk:"Вересень" · it:"Settembre" ·
 * sq:"Shtator". Uses `common.calendar_months` — the NOMINATIVE/standalone CLDR form (unlike
 * `formatFullDate`'s `calendar_months_formatting`, which is the genitive/"preceded by a day
 * number" form for Ukrainian) — capitalised, since the raw message data is lowercase (a
 * calendar-internal key convention, not display-ready text). For a chart tooltip whose point IS a
 * whole month (a year-view's 12 points, Task 845 Pass 10, owner-requested) where a day number
 * would be meaningless. Never a live `Intl.DateTimeFormat` call. Returns '—' on null, undefined,
 * or invalid input.
 */
export function formatMonthFull(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    const { calendar_months } = (CALENDAR_MESSAGES[locale] ?? CALENDAR_MESSAGES.en).common
    // UTC getter (Task 845 Revision 1, W6) — see `formatShortDate`'s own comment.
    const month = calendar_months[d.getUTCMonth()]
    return month.charAt(0).toUpperCase() + month.slice(1)
  } catch {
    return '—'
  }
}

/**
 * The bare localized short weekday name — e.g. en:"Tue" · uk:"Вт" · it:"mar" · sq:"mar".
 * Uses `common.calendar_weekdays_short` (already in every locale file for the `RangeDatePicker`
 * calendar header, Monday-first order matching this data's own existing consumer) — capitalised
 * here regardless of the raw message casing, since uk/sq/it store lowercase abbreviations but a
 * chart axis/tooltip label reads as a proper noun (same capitalisation rule `formatMonthFull`
 * already applies for the same reason). Never a live `Intl.DateTimeFormat` call (same ICU-
 * completeness rationale as every other formatter in this file — some browsers' bundled ICU has
 * no `sq` locale data at all). `getUTCDay()` (0=Sun..6=Sat) is remapped to the data's Monday-first
 * order. For a chart's week-period axis tick/tooltip (Task 845 Pass 12, owner-requested: "Пн, Вт,
 * Ср..." — a real weekday name, never a generic "Day N" counter). Returns '—' on null, undefined,
 * or invalid input.
 */
export function formatWeekdayShort(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    const { calendar_weekdays_short } = (CALENDAR_MESSAGES[locale] ?? CALENDAR_MESSAGES.en).common
    const mondayFirstIndex = (d.getUTCDay() + 6) % 7
    const weekday = calendar_weekdays_short[mondayFirstIndex]
    return weekday.charAt(0).toUpperCase() + weekday.slice(1)
  } catch {
    return '—'
  }
}
