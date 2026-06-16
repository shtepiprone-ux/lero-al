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
 * Formats a price for display. Always requires an explicit locale so
 * server-side and client-side rendering produce identical output (hydration-safe).
 *
 * Use the route locale from params (server) or useLocale() (client).
 */
export function formatPrice(price: number, currency: string, locale: string): string {
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    Math.round(price),
  )
  return currency ? `${formatted} ${normalizeCurrencyCode(currency)}` : formatted
}

/**
 * Formats a plain count (e.g. stats). Requires explicit locale for the same reason.
 */
export function formatCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(value))
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
