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

/**
 * Formats an ISO date string as a locale-aware absolute calendar date (DD.MM.YYYY style).
 * Requires explicit locale for SSR/client parity (no hydration mismatch).
 * Returns '—' on null, undefined, or invalid input.
 */
export function formatDate(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
  } catch {
    return '—'
  }
}

/**
 * Formats an ISO datetime string as a locale-aware absolute date+time (day/month/year hour:minute).
 * Uses an explicit fixed timezone (UTC) so the Node.js server and the browser always produce
 * byte-identical text, preventing SSR/CSR hydration mismatches caused by Intl locale or timezone
 * divergence between runtimes.
 * Returns '—' on null, undefined, or invalid input.
 */
export function formatDateTime(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(d)
  } catch {
    return '—'
  }
}

/**
 * Compact localized listing-card date that always includes the year.
 * e.g. en:"Jan 15, 2026" · uk:"15 січ. 2026" · it:"15 gen 2026" · sq:localized
 * Requires explicit locale for SSR/client parity (no hydration mismatch).
 * Returns '—' on null, undefined, or invalid input.
 */
export function formatListingDate(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
  } catch {
    return '—'
  }
}
