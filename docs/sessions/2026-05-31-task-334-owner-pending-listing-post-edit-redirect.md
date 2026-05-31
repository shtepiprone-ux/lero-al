# Task 334 — Owner post-edit redirect for listings with «На модерації» status

**Date:** 2026-05-31  
**Sprint:** 30 — Wave 1 (parallel-safe with 330 + 335)  
**Type:** bugfix / listing lifecycle / routing / UX  
**Priority:** HIGH (production bug)

## Root cause

`ListingFormShell.tsx` line 262 (pre-fix):
```tsx
setTimeout(() => { router.push(`/${activeLocale}/listings/${result.slug}`) }, 3000)
```

The public listing detail route (`/listings/[slug]/page.tsx`) queries:
```tsx
.in('status', ['active', 'sold', 'rented', 'archived'])
```
Listings with `pending` (= «На модерації») or `inactive` status are **not** in that `IN` clause → `notFound()` fires → 404.

The done-screen (3 seconds success card) is shown first, which is why the owner sees the page "for a few seconds" before the 404 redirect fires.

## Fix

1. `updateListing.ts` now returns `{ slug, status }` (was `{ slug }`) — status read from `existing` (no extra DB query since update does not change status).
2. New domain helper `getPostSaveRedirect(status, slug, locale)` in `listingSemanticHelpers.ts`:
   - `active` (VISIBLE) → public detail route (preserves existing behaviour for published listings)
   - all others (`pending`, `inactive`, `archived`, `sold`, `rented`) → `/[locale]/cabinet/listings`
3. `ListingFormShell.tsx`:
   - Imports `isListingVisible`, `getPostSaveRedirect` from domain + `ListingStatus` type
   - Stores `savedStatus: ListingStatus | null` in state after successful save
   - Redirect uses `getPostSaveRedirect(result.status, result.slug, activeLocale)` instead of hardcoded public URL
   - `not_found` error case now redirects to cabinet instead of showing inline error (listing was deleted concurrently — no point staying on form)
   - Done-screen body: shows `saved_pending_moderation` when `!isListingVisible(savedStatus)`, keeps `edit_success_body` for active
4. New locale key `listing.saved_pending_moderation` × 4 locales

## Current behavior preserved (Notes 19/20/23)

Inventoried and preserved:
- All editable fields: listing_type, property_type, title, description, price, currency, condition, wall_type, heating, rooms, bedrooms, bathrooms, toilets, area_gross, area_net, floor, total_floors, multi_storey_building, land fields, offer_type, purchase_conditions, year_built, location_id, address, images
- Image upload/removal (ImageUpload component) — unchanged
- Validation (required + schema-driven) — unchanged
- Save button states (idle / Loader2+text / done) — unchanged
- Cancel / back via `navigateAway()` — unchanged; Cancel confirmation Dialog — unchanged
- Status display in form — unchanged
- Owner permission check in edit page — unchanged
- For `active` listings: post-save still redirects to public detail (existing behaviour preserved)
- `revalidatePath` calls in `updateListing.ts` — unchanged
- `moderation_title`/`moderation_body` (create flow) — unchanged
- `edit_success_title` — unchanged

## Post-save redirect matrix implemented

| Actor | Listing status | Redirect target |
|---|---|---|
| Owner | `active` | `/${locale}/listings/${slug}` (public detail) |
| Owner | `pending`, `inactive` | `/${locale}/cabinet/listings` |
| Owner | `archived`, `sold`, `rented` | `/${locale}/cabinet/listings` |
| Owner (not_found error) | any | `/${locale}/cabinet/listings` |
| Guest / non-owner | any | blocked at edit page level (unchanged) |

## Files Changed

| Path | Change |
|------|--------|
| `src/modules/listings/actions/updateListing.ts` | Return type `{ slug, status }` (was `{ slug }`); return includes `status: existing.status` |
| `src/modules/listings/domain/listingSemanticHelpers.ts` | Added `getPostSaveRedirect(status, slug, locale)` helper |
| `src/modules/listings/components/ListingFormShell.tsx` | Imports; `savedStatus` state; status-aware redirect; `not_found` redirect; done-screen status-aware body |
| `messages/sq.json` | `listing.saved_pending_moderation` added |
| `messages/en.json` | `listing.saved_pending_moderation` added |
| `messages/uk.json` | `listing.saved_pending_moderation` added |
| `messages/it.json` | `listing.saved_pending_moderation` added |

## Translation keys

| Key | sq | en | uk | it |
|-----|----|----|----|----|
| `listing.saved_pending_moderation` | Njoftimi juaj është përditësuar dhe pret moderimin. | Your listing has been updated and is awaiting moderation. | Ваше оголошення оновлено та очікує модерації. | Il tuo annuncio è stato aggiornato ed è in attesa di moderazione. |

## Public route not weakened

`/listings/[slug]/page.tsx` query `.in('status', ['active', 'sold', 'rented', 'archived'])` — **not touched**. `pending`/`inactive` listings still return `notFound()` for guests.

## Validation results

```
tsc --noEmit     → 0 errors
next lint        → 0 warnings / 0 errors
next build       → passes
check:i18n       → ✅ PASSED — 1431 keys × 4 locales (was 1430, +1 saved_pending_moderation)
```

## Note 18 self-validation

| AC | Status |
|----|--------|
| Root cause documented | ✅ (public route IN clause excludes pending/inactive) |
| Owner can edit + save «На модерації» listing | ✅ |
| After save, owner on owner-safe route (cabinet) | ✅ |
| Refresh keeps owner on safe destination | ✅ (cabinet route is always owner-accessible) |
| Pending listings remain hidden from guests | ✅ (public route not changed) |
| Unrelated users cannot access edit flow | ✅ (edit page permission check unchanged) |
| Published-listing save behavior preserved | ✅ (active → public detail route preserved) |
| All editable fields + image handling + validation preserved | ✅ |
| `saved_pending_moderation` localized sq/en/uk/it | ✅ |
| 0 new lint errors / warnings | ✅ |
| tsc=0 errors | ✅ |
| build passes | ✅ |
| check:i18n parity | ✅ (1431 × 4) |

Self-validation: tsc=0 · lint=0/0 · build=passes · check:i18n=1431×4 · AC table=all green · public route=untouched · scope=clean
