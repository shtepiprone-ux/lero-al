# Task 230 — W.3 Add `area_asc` sort option

**Date:** 2026-05-28  
**Epic:** W — Listings Filter Bar & Drawer Polish  
**Executor:** Sonnet 4.6

---

## What changed

Added `area_asc` ("Area: ascending / smallest first") to the canonical sort catalog. Five files updated.

Note: the kickoff referenced `ListingsFilterBar.tsx` for the sort Combobox — the sort Combobox actually lives in `ListingsSortBar.tsx`. Updated the correct file.

---

## Current behavior to preserve

- All existing sort options (`newest`, `price_asc`, `price_desc`, `area_desc`) preserved and unchanged.
- Sort routing through `filterEngine.ts` → `VALID_SORTS` allowlist drops unknown values → no regression.
- URL ↔ Combobox state sync pattern unchanged.

## Required after behavior

- `area_asc` selectable in sort Combobox in all 4 locales.
- Selecting it sorts listings by `area_gross ASC NULLS LAST`.
- URL `?sort=area_asc` → query applies correct order.
- URL ↔ Combobox bidirectional sync works.

---

## Positive flow

User opens sort Combobox → sees "Area: smallest first" / "Площа: від меншої" → selects → URL gets `?sort=area_asc` → listings re-order ascending by area (nulls last).

## Negative flow

| Branch | Handling |
|--------|----------|
| URL `?sort=area_asc` with no listings | Empty state preserved (unchanged) |
| Listings without `area_gross` set | `NULLS LAST` → nulls appear at bottom ✓ |
| Locale switch | Label re-renders in new locale (next-intl) ✓ |
| Existing `area_desc` | Still in VALID_SORTS, logic unchanged ✓ |
| Invalid `?sort=xyz` URL | `VALID_SORTS` allowlist in `parseSearchParams` drops unknown → defaults to `'newest'` ✓ |
| API route path | `route.ts` updated alongside SSR `page.tsx` — both paths covered ✓ |

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/modules/listings/domain/filterEngine.ts` | Added `'area_asc'` to `ListingSort` type + `VALID_SORTS` array | Type safety + allowlist validation |
| `src/app/[locale]/listings/page.tsx` | Added `area_asc` case: `q.order('area_gross', { ascending: true, nullsFirst: false })` | SSR sort path |
| `src/app/api/listings/route.ts` | Same `area_asc` case | API (client-side load-more) sort path |
| `src/modules/listings/components/ListingsSortBar.tsx` | Added `{ value: 'area_asc', labelKey: 'sort_area_asc' }` to `SORT_OPTIONS` | UI Combobox option |
| `messages/en.json` | `"sort_area_asc": "Area: smallest first"` | Locale parity |
| `messages/sq.json` | `"sort_area_asc": "Sipërfaqja: nga vogëlsia"` | Locale parity |
| `messages/uk.json` | `"sort_area_asc": "Площа: від меншої"` | Locale parity |
| `messages/it.json` | `"sort_area_asc": "Superficie: dalla più piccola"` | Locale parity |
| `docs/backlog.md` | Updated Last Session + Next Immediate Tasks | Task 264 contract |
| `docs/sessions/2026-05-28-task-230-w3-area-asc-sort.md` | New session log | Task 264 contract |

---

## §17 UI Pre-flight Checklist

1. **No non-canonical dropdowns:** Sort uses canonical `Combobox` (`variant="button"`) — unchanged ✓
2. **No ad-hoc control heights:** No height changes in touched files ✓
3. **Z-index:** No z-index changes ✓
4. **Overflow-risk rows:** Sort Combobox `w-auto min-w-[140px]` — no clipping risk ✓
5. **Same-row height:** Combobox `size="sm"` — pre-existing, unchanged ✓
6. **7 breakpoints:** Sort Combobox exists across all breakpoints; `area_asc` is just one more option in an existing Combobox → no layout change ✓
7. **Touch targets:** Combobox trigger in sort bar — pre-existing ✓
8. **4 locales:** `sort_area_asc` added to sq/en/uk/it (all 4) ✓

---

## AC self-audit

| AC | Status |
|----|--------|
| `area_asc` selectable in sort Combobox in all 4 locales | ✓ |
| Listings sort ascending by area when selected | ✓ (`ORDER BY area_gross ASC NULLS LAST`) |
| URL routing works both ways (Combobox → URL, URL → Combobox) | ✓ (existing mechanism, value just added) |
| Existing sort options preserved (regression check) | ✓ (`area_desc` and others untouched) |
| Both query paths covered (SSR page.tsx + API route.ts) | ✓ |
| §17 UI pre-flight output | ✓ |
| 0 new lint/typecheck errors (tsc → 0) | ✓ |
| 4 locale keys added (×4 parity) | ✓ |
| "Files Changed" table per Task 264 | ✓ |
| Self-validation block per Note 18 | ✓ |

---

## Self-validation

- `npx tsc --noEmit` → **0 errors** ✓
- `grep area_asc src/` → 5 hits across correct files ✓
- `grep sort_area_asc messages/` → 4 hits (sq/en/uk/it) ✓
- `area_desc` regression: untouched, still in VALID_SORTS and both query paths ✓
- **Self-validation verdict: COMPLETE — all AC met, tsc=0, §17 pre-flight passed**
