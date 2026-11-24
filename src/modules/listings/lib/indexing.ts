// ── The one rule: may this listing be listed and indexed? (Task 1035) ─────────────────────────────────────────────────────────────────────────────────
// The integration fixtures (src/tests/integration/fixtures.ts) create synthetic listings on the real project with the slug `zz_synth_<run>-<tag>`. The prefix is a safe marker:
// a session cannot write a slug with `_` (the database guard allows only `^[a-z0-9]+(-[a-z0-9]+)*$`), so no real listing starts with it. The public listing filter
// (`applyPublicVisibility`), the listing page's metadata and a future IndexNow submission all ask this module.

/** the slug prefix of every synthetic test listing */
export const SYNTHETIC_LISTING_SLUG_PREFIX = 'zz_synth_'

/** the same prefix as a LIKE pattern: BOTH underscores escaped (an unescaped `_` matches any character, and `zz-synth-house` is a valid user slug), then a wildcard */
export const SYNTHETIC_LISTING_SLUG_LIKE = 'zz\\_synth\\_%'

/** true for the slug of a synthetic test listing: the slug starts with the exact prefix */
export function isSyntheticListingSlug(slug: string): boolean {
  return slug.startsWith(SYNTHETIC_LISTING_SLUG_PREFIX)
}

/** may this listing be indexed (and, later, submitted to IndexNow)? A synthetic test listing never is */
export function isListingIndexable(listing: { slug: string }): boolean {
  return !isSyntheticListingSlug(listing.slug)
}
