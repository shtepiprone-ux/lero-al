/**
 * Canonical SELECT projection for listing card data.
 *
 * SINGLE SOURCE OF TRUTH for all consumers:
 *   - SSR pages  (app/[locale]/listings/page.tsx)
 *   - API routes (app/api/listings/route.ts)
 *   - Favorites  (lib/favoritesQueries.ts)
 *   - Realtime   (hooks/useFavoritesRealtime.ts)
 *   - Hooks      (lib/queries.ts)
 *
 * Adding a field: update ONLY this constant — every consumer picks it up automatically.
 * TypeScript will surface any shape incompatibilities with CardListingData at build time.
 *
 * NOTE: CABINET_LISTING_SELECT (cabinet/lib/queries.ts) is intentionally narrower —
 * it is a compact tab-view projection and is managed separately.
 */
export const LISTING_SELECT = `
  id, public_id, slug, title, price, price_old, currency, listing_type, property_type,
  condition, rooms, bedrooms, bathrooms, area_gross, area_net, floor, total_floors,
  year_built, is_premium, status, created_at, views_count,
  location:locations(id, name_al, slug, type),
  images:listing_images(url, is_cover, order)
` as const
