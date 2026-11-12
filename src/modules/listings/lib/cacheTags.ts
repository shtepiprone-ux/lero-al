/**
 * The one cache tag of the public listings (Task 964, Revision 1, R1-2). The sitemap files and `robots.txt` are cached under it (`src/app/sitemap.ts`), and every
 * Server Action that changes which listings are public, or a field a sitemap shows (`slug`, `updated_at`), expires it with `updateTag` after its successful write, so a
 * new listing reaches search engines at once and not at the next deployment. One constant: a second literal of the same tag would silently stop expiring the other.
 */
export const PUBLIC_LISTINGS_CACHE_TAG = 'public-listings'
