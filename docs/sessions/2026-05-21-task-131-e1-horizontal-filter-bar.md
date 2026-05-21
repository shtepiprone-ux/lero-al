# Session Archive: Epic E.1 — Horizontal Filter Bar — 2026-05-21

## Task 131 — E.1 Horizontal filter bar redesign

**Status:** COMPLETE

---

## What changed

### Before
- Desktop (≥lg/1024px): fixed sidebar (w-72) on the left with all filters
- Mobile: Sheet drawer triggered by sort bar button (lg:hidden)

### After (E.1)
- Desktop/tablet (≥md/768px): horizontal filter bar at top of listings page
- Mobile (<md/768px): Sheet drawer triggered by sort bar button (md:hidden)

---

## Files created

### `src/modules/listings/components/ListingsFilterBar.tsx`
Horizontal bar (`hidden md:flex`). Uses `useListingsUrlFilters` (same hook as ListingsFilters — no duplicate filter logic, routes through filterEngine.ts).

Shows inline:
- Listing type buttons (All / Sale / Rent)
- Property type Combobox
- Location LocationCombobox
- Reset button (when filters active)
- "Advanced filters" button with active count badge → opens full Sheet

---

## Files modified

### `ListingsShell.tsx`
- Removed desktop `<aside>` sidebar (w-72, sticky)
- Changed root layout from `flex gap-8` → `flex flex-col gap-0`
- Added `<ListingsFilterBar>` above main content
- Sheet stays: contains full `ListingsFilters` for both mobile AND "More filters" on desktop

### `ListingsSortBar.tsx`
- Mobile filter button: `lg:hidden` → `md:hidden`
  (horizontal bar now handles md+; only mobile <768 needs the sort bar button)

---

## Architecture

- Filter state: `useListingsUrlFilters` → URL-immediate (no homepage batch-state mixing ✓)
- Filter logic: filterEngine.ts (no duplication ✓)
- Primitives: Combobox, LocationCombobox, Button (all canonical ✓)
- Mobile: canonical Sheet drawer ✓

## Validation

- lint: 0 errors / 0 warnings
- typecheck: 0 new errors
- governance:localization: PASS
- No new i18n keys needed (used existing: common.advanced_filters, common.reset_filters, etc.)
