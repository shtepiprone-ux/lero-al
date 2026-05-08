## Permissions

- **Create listing**: any authenticated user (private person or agent).
- **Edit listing**: owner only (user_id match) or admin/moderator.
- **Delete listing**: owner only or admin/moderator.
- **Publish/activate**: owner sets status to active on submit; admin/moderator can override.

## Listing Features
- Badges: New (`created_at > now() - interval '7 days'`), Premium (`is_premium = true`), Price reduced (`price_old IS NOT NULL AND price < price_old`), Archived (`status IN ('sold', 'rented', 'archived')`).
- Price: always show the current price; if `price_old IS NOT NULL` and `price < price_old`, also show the old price as struck through; display prices in ALL and EUR.
- Currency: ALL (default) and EUR; exchange rate is fetched from iliria98.com daily.
- Full text search via Postgres tsvector (GIN index).
- Unique views tracking via ip_hash (privacy-safe).
- Amenities system via listing_amenities junction table.
- Listing expires after 60 days (extendable by moderator/admin).
- Slug-based URLs for SEO.

## Underground Floor Rules (canonical)

The single source of truth is `UNDERGROUND_FLOOR_TYPES` in `src/modules/listings/constants/index.ts`.

**Types that support underground floors (floor < 0):**
- `garage`, `parking`, `warehouse`, `other`

**Conditions:**
- Underground floors are only valid when `multi_storey_building = true` AND the property type is in `UNDERGROUND_FLOOR_TYPES`.
- Minimum underground floor: **-10**.
- All other property types: floor minimum **0** (ground level or above).

**Enforcement layers (all must be consistent — never patch one layer alone):**
1. **Zod schema** (`validations/index.ts`): `superRefine` rejects `floor < 0` unless type is in `UNDERGROUND_FLOOR_TYPES` AND `multi_storey_building = true`.
2. **Form UI** (`ListingFormShell.tsx`): multi_storey_building checkbox gated to `UNDERGROUND_FLOOR_TYPES`; floor field hidden unless checkbox is ON.
3. **Filter UI** (`ListingsFilters.tsx`, `FiltersPanel.tsx`): `getFloorFilterMin()` returns -10 for underground types, 0 for all others; `min` attribute and rejection guard both derived from this helper.
4. **SSR query** (`listings/page.tsx`) and **API query** (`api/listings/route.ts`):
   - Negative `floor_min`/`floor_max` rejected for non-underground types.
   - Negative floor filter with no `property_type` selected → auto-constrains `property_type IN (UNDERGROUND_FLOOR_TYPES)` to prevent legacy-data leaks.

**Never hardcode the type list in components.** All consumers must import from constants.