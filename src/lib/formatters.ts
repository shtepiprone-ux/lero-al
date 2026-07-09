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

/** `common.calendar_*` data (Task 562) reused here — do not duplicate; keyed by locale. */
const CALENDAR_MESSAGES: Record<string, {
  common: {
    calendar_months_short: string[]
    calendar_month_year_suffix: string
    calendar_summary_order: string
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
