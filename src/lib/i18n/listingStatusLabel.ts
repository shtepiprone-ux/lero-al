/**
 * Canonical listing status label helper — single source of truth for mapping
 * listing status codes to localized display labels.
 *
 * Pass the `listing` or `cabinet` translation function (both namespaces carry
 * identical `status_*` keys for listing status codes).
 *
 * Falls back to the raw code string for unknown statuses so the UI is never
 * blank — unknown codes render visibly identifiable instead of silently broken.
 *
 * Usage:
 *   const tl = useTranslations('listing')
 *   getListingStatusLabel('pending', tl)  // → "Nën shqyrtim" (sq)
 *   getListingStatusLabel('active',  tl)  // → "Aktiv" (sq)
 *
 * Created: Task 288 (2026-05-29) — i18n hardcode audit.
 */

export const LISTING_STATUS_CODES = [
  'pending', 'active', 'inactive', 'sold', 'rented', 'archived', 'expired',
] as const

export type ListingStatusCode = typeof LISTING_STATUS_CODES[number]

const KNOWN_LISTING_STATUSES = new Set<string>(LISTING_STATUS_CODES)

/**
 * Map a listing status code to its localized display label.
 * @param status - raw DB status code (e.g. 'pending', 'active')
 * @param t - any translation function that handles `status_*` keys
 *            (e.g. useTranslations('listing') or useTranslations('cabinet'))
 * @returns localized label, or the raw code if the status is unknown
 */
export function getListingStatusLabel(
  status: string,
  t: (key: string) => string,
): string {
  if (KNOWN_LISTING_STATUSES.has(status)) {
    return t(`status_${status}`)
  }
  // Unknown status — show the raw code wrapped so it is visibly identifiable
  return status
}
