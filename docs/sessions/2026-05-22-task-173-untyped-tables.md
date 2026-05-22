# Task 173 — Sprint 8 — Add interfaces for 3 untyped tables; extend drift guard

**Date:** 2026-05-22  
**Status:** ✅ Complete

## Problem
Three tables queried via `.from()` in src/ had no TypeScript interface and were invisible to the
schema-drift guard: `collection_items`, `favorite_price_alerts`, `report_actions`.

## Column derivation (code-only, no DB connection)

### `CollectionItem` → `collection_items`
Source: `collectionActions.ts` + `favoritesQueries.ts`
- `.select('collection_id')` + `.eq('listing_id', listingId)` → both columns always co-present
- `.insert({ collection_id, listing_id })` → composite PK, no `id` referenced anywhere
- Columns: `collection_id: string`, `listing_id: string`

### `FavoritePriceAlert` → `favorite_price_alerts`
Source: `cron/price-alerts/route.ts`
- `.select('user_id, listing_id, last_notified_price')` + typed inline as `{ …; last_notified_price: number }`
- `.upsert({ user_id, listing_id, last_notified_price, last_notified_at }, { onConflict: 'user_id,listing_id' })`
- Composite PK `(user_id, listing_id)` — no `id` referenced
- Columns: `user_id: string`, `listing_id: string`, `last_notified_price: number`, `last_notified_at: string`

### `ReportAction` → `report_actions`
Source: `reportListing.ts` — single insert only
- `.insert({ report_id, actor_id, actor_role, old_status, new_status, notes })`
- `notes` passed as `trimmedNotes` (can be `null`)
- No `id` or `created_at` referenced anywhere
- Columns: `report_id: string`, `actor_id: string`, `actor_role: string`, `old_status: string`, `new_status: string`, `notes: string | null`

## Files changed

| File | Change |
|---|---|
| `src/types/database.ts` | 3 new interfaces added (after Collection, Favorite, ListingReport) |
| `scripts/check-schema-drift.mjs` | INTERFACE_TABLE_MAP: 21 → 24 entries |
| `scripts/schema-drift-check.sql` | Regenerated — 24 tables / 217 columns |

## Script output after regeneration
```
Tables covered : 24
Columns tracked: 217
```

## Result set 2 note (owner — Task 174)
After running the regenerated SQL in Supabase, result set 2 will show any DB columns on these
three tables that code usage didn't surface (e.g. auto-generated `id`, `created_at`, DB triggers).
These are informational — the owner reconciles via Task 174.
The only pre-existing informational entry remains `listings.search_vector` (intentionally excluded).
