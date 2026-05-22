# Session Archive: Task 139 — G.2 Recently Viewed UI Block — 2026-05-22

## Task

**Task 139 — Epic G.2 — Recently viewed UI block**
Type: Feature | Priority: Medium
Localization: sq, en, uk, it | Responsive: 320, 375, 390, 768, 1280, 1440, 2560

## Summary

Rendered the recently-viewed listings section in two surfaces:
1. **Listing detail page** — below the main content, before similar listings, excluding current listing. Wrapped in `<Suspense>` with skeleton fallback.
2. **Cabinet profile tab** — dedicated section above the danger zone, auth users only (cabinet always requires login).

Both surfaces use the same `RecentlyViewedSection` Server Component.

## Architecture

### Data flow
- **`RecentlyViewedSection`** — Server Component that self-fetches.
  - Auth: queries `recently_viewed` table via `getRecentlyViewedForUser` (2-step: IDs first, then listings; RLS-scoped).
  - Guest: reads `rv_listings` cookie → `getRecentlyViewedForGuest`.
  - Returns `null` if no items; no empty state shown on listing detail to avoid clutter.
- **`recentlyViewedQueries.ts`** — two query functions using `LISTING_SELECT` (canonical single source of truth).
- **Cabinet integration**: `RecentlyViewedSection` passed as `React.ReactNode` prop from `CabinetPage` (Server) → `CabinetShell` (Client, `profileRecentlyViewed?: ReactNode`) → `ProfileTab` (Client, `recentlyViewed?: ReactNode`) — RSC composition pattern, no data prop threading.

### Layout
- Mobile (base): `flex gap-3 overflow-x-auto pb-2 scrollbar-hide` with `w-48 shrink-0` cards.
- sm+: `grid grid-cols-2` → `md:grid-cols-3` → `lg:grid-cols-4` using CSS display override (`sm:grid`).
- No viewport JS, no hydration mismatch.

### Guest cookie read
- Cookie `rv_listings` parsed from request cookies in the Server Component — SSR-first, no client hydration needed.
- If cookie is missing/malformed, returns empty array silently.

## Files Changed

| File | Change |
|---|---|
| `src/modules/listings/lib/recentlyViewedQueries.ts` | **NEW** — `getRecentlyViewedForUser` / `getRecentlyViewedForGuest` |
| `src/modules/listings/components/RecentlyViewedSection.tsx` | **NEW** — Server Component + `RecentlyViewedSkeleton` |
| `src/app/[locale]/listings/[slug]/page.tsx` | Added `<Suspense><RecentlyViewedSection currentListingId={listing.id} /></Suspense>` |
| `src/app/[locale]/cabinet/page.tsx` | Added `profileRecentlyViewed={<RecentlyViewedSection limit={25} />}` |
| `src/modules/cabinet/components/CabinetShell.tsx` | Added `profileRecentlyViewed?: ReactNode` prop |
| `src/modules/cabinet/components/ProfileTab.tsx` | Added `recentlyViewed?: ReactNode` prop + renders above danger zone |
| `messages/sq.json` | `recently_viewed_title`, `recently_viewed_empty` |
| `messages/en.json` | `recently_viewed_title`, `recently_viewed_empty` |
| `messages/uk.json` | `recently_viewed_title`, `recently_viewed_empty` |
| `messages/it.json` | `recently_viewed_title`, `recently_viewed_empty` |

## Acceptance Criteria Verification

- [x] Section renders on listing detail (current listing excluded) and profile.
- [x] Auth → server query; guest → cookie; both SSR-first, no hydration mismatch.
- [x] Canonical `ListingCard` used; no inline card clones.
- [x] Mobile horizontal scroll; sm+ responsive grid (2→3→4 cols).
- [x] All 4 locales: sq, en, uk, it — keys added to `listing` namespace.
- [x] Empty state key added (`recently_viewed_empty`); section returns `null` if no items on detail page (clean), profile renders section only when `recentlyViewed` is not null.
- [x] No viewport JS; no `suppressHydrationWarning`; no `typeof window` in render.
- [x] 0 lint errors / 0 new TypeScript errors (2 pre-existing test-fixture errors from Task 126 unchanged).
- [x] `scrollbar-hide` — reuses existing pattern from `FavoritesTypeFilter`.
- [x] `LISTING_SELECT` single source of truth reused.

## Out of scope
G.3 (clear history).
