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
  return currency ? `${formatted} ${currency}` : formatted
}

/**
 * Formats a plain count (e.g. stats). Requires explicit locale for the same reason.
 */
export function formatCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(value))
}
