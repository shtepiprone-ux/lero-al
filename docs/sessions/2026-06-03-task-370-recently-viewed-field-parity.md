# Session Log — Task 370: RecentlyViewedSection story field-parity

**Date:** 2026-06-03  
**Executor:** Sonnet 4.6  
**Status:** COMPLETE — UNCOMMITTED — OWNER QA REQUIRED

---

## Summary

Brought `RecentlyViewedSection.stories.tsx` cards to full field-parity with the live `ListingCard`. The old `StoryCard` (simplified: placeholder image, type label, title, price, location) was replaced by the shared `StoryListingCard` from a new shared story helper file.

---

## Approach (Note 14 — no duplicate mock card)

`StoryListingCard` was defined locally inside `ListingGrid.stories.tsx`. To satisfy Note 14 (single-source, no clone), it was extracted to a **shared story helper file** `src/stories/StoryListingCard.tsx` with three exports:
- `StoryCardData` type
- `STORY_LISTINGS` fixture (8 items derived from `LISTINGS_GRID_FIXTURE` with status/price variants)
- `StoryListingCard` component (the full-field-parity card)

Both `ListingGrid.stories.tsx` and `RecentlyViewedSection.stories.tsx` now import from this shared helper. No runtime code was touched.

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/stories/StoryListingCard.tsx` | **Created** — shared story helper with `StoryCardData`, `STORY_LISTINGS`, `StoryListingCard` | Single source per Note 14; extracted from ListingGrid for reuse |
| `src/stories/ListingGrid.stories.tsx` | Removed local `StoryCardData`/`STORY_STATUSES`/`STORY_LISTINGS`/`StoryListingCard` definitions; now imports from `./StoryListingCard` | De-duplicates mock card |
| `src/stories/RecentlyViewedSection.stories.tsx` | Replaced `StoryCard` (simplified) with `StoryListingCard` from `./StoryListingCard`; uses `STORY_LISTINGS` fixture; `UkrainianLocale` story gets `viewport: mobile320` + uk titles; docs updated | Field-parity AC1; layout preserved AC2 |

---

## Field Parity (AC1)

Old `StoryCard` → New `StoryListingCard`:

| Field | Old | New |
|-------|-----|-----|
| Image placeholder | Maximize2 icon | ✅ Same (no live images in Storybook) |
| Premium stripe | ✅ badge only | ✅ top gradient stripe + border shadow |
| Status overlay (sold/rented) | ❌ missing | ✅ `isClosed` → rotated badge overlay |
| Status badges (new/price_reduced/archived) | ❌ only premium badge | ✅ new, price_reduced, archived badges |
| Photo count chip | ❌ missing | ✅ Camera icon + count |
| Favorite heart stub | ❌ missing | ✅ Heart button (toggle, disabled when closed) |
| Price + €/m² | price only | ✅ price + old price strike-through + per_sqm |
| Features row (area/beds) | ❌ missing | ✅ Maximize2+m² + BedDouble+bedrooms |
| Location | ✅ MapPin + neighborhood/city | ✅ MapPin + location (from fixture) |
| Public ID copy | ❌ missing | ✅ #public_id copy button |
| Days-ago | ❌ missing | ✅ "2h ago" |
| Title line-clamp | ✅ line-clamp-2 | ✅ line-clamp-2 |
| Archived grayscale | ❌ missing | ✅ `grayscale opacity-60` |

---

## RVS Layout Preservation (AC2)

The `RecentlyViewedLayout` component is unchanged:
- `<div className="flex gap-3 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 md:grid-cols-3 lg:grid-cols-4">` — mobile scroll → 2/3/4-col grid ✅
- `<div key={listing.id} className="w-48 shrink-0 sm:w-auto sm:shrink">` — w-48 mobile card width ✅
- `StoryClrButton` — canonical Button, i18n key `recently_viewed_clear`, action-wired ✅
- Empty state via `showEmptyState` prop ✅

---

## Positive / Negative Flow Verification

### Positive
- ✅ Open `Populated` story → cards show all live fields (premium stripe, status badges, photo count, price/m², features, favorite, days-ago, location)
- ✅ Mobile 375px → horizontal scroll, w-48 cards with full field set
- ✅ 2560px → 4-col grid
- ✅ "Clear history" present in Populated, MobileScroll, HugeDesktop, UkrainianLocale stories

### Negative
- ✅ Empty history → `EmptyState` story shows i18n empty-state message, no clear button
- ✅ `UkrainianLocale` story: uk@320, 4 cards with long Ukrainian titles → line-clamp-2, no overflow; `globals: { locale: 'uk' }` pinned
- ✅ `ListingGrid.stories.tsx` unchanged in visual output — all 4 stories still render same cards via shared helper

---

## AC Self-Audit

| AC | Status | Evidence |
|----|--------|---------|
| AC1 RVS cards reach field-parity via shared `StoryListingCard` | ✅ | Field table above; `StoryListingCard` imported from `./StoryListingCard` |
| AC2 RVS responsive layout + `clearSlot` preserved | ✅ | `RecentlyViewedLayout` markup unchanged; all stories retain clear button |
| AC3 No duplicate mock card | ✅ | Single `StoryListingCard` in `./StoryListingCard.tsx`; both stories import it |
| AC4 Story-only; no runtime change | ✅ | Only `src/stories/` files touched; no `src/components/`, `src/modules/`, `src/app/` changes |
| 0 new tsc errors | ✅ | `npx tsc --noEmit` = 0 errors |
| build-storybook passes | ✅ | Built in 6.29s |
| check:i18n PASS | ✅ | 1437 keys, all 4 locales identical |

**Self-validation verdict: PASS. All ACs met. No scope drift. No runtime code touched.**
