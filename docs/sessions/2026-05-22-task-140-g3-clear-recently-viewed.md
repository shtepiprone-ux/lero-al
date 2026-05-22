# Session Archive: Task 140 — G.3 Clear Recently Viewed History — 2026-05-22

## Task

**Task 140 — Epic G.3 — Clear recently viewed history**
Type: Feature | Priority: Low
Localization: sq, en, uk, it | Responsive: 320, 375, 390, 768, 1280, 1440, 2560

## Summary

Added "Clear history" functionality to the recently-viewed profile section:
- "Clear history" button in the `RecentlyViewedSection` header (visible when items exist).
- Canonical `Dialog` confirmation before clearing.
- `clearRecentlyViewed()` server action: deletes all rows from `recently_viewed` (auth, RLS-scoped) OR resets `rv_listings` cookie to `[]` (guest).
- `sonner` success/error toast + `router.refresh()` to re-render the section empty.
- `showEmptyState` prop added to `RecentlyViewedSection` (used on profile; listing detail still returns null when empty).
- **Epic G — CLOSED.** G.1 + G.2 + G.3 all complete.

## Architecture

- `clearRecentlyViewed()` in `recentlyViewedActions.ts`: auth path calls `supabase.delete().eq('user_id', user.id)` + `revalidatePath` for all cabinet locales; guest path sets cookie to `'[]'`.
- `ClearRecentlyViewedButton` (Client Component): `Dialog` confirmation → server action → `toast.success` + `router.refresh()`. Error caught silently → `toast.error`.
- `RecentlyViewedSection` renders `<ClearRecentlyViewedButton />` in the section header when items exist. When `showEmptyState=true` and no items, renders empty state text (profile context after clearing).

## Files Changed

| File | Change |
|---|---|
| `src/modules/listings/actions/recentlyViewedActions.ts` | Added `clearRecentlyViewed()` |
| `src/modules/listings/components/ClearRecentlyViewedButton.tsx` | **NEW** — Dialog + toast + router.refresh |
| `src/modules/listings/components/RecentlyViewedSection.tsx` | Added `showEmptyState` prop; added `ClearRecentlyViewedButton` in header |
| `src/app/[locale]/cabinet/page.tsx` | Added `showEmptyState` to `RecentlyViewedSection` prop |
| `messages/sq.json` | 6 new keys: `recently_viewed_clear*` |
| `messages/en.json` | 6 new keys |
| `messages/uk.json` | 6 new keys |
| `messages/it.json` | 6 new keys |

## Acceptance Criteria Verification

- [x] Server entries deleted on confirm (auth — RLS-scoped DELETE); cookie cleared (guest — `rv_listings='[]'`).
- [x] Canonical `Dialog` + `sonner` toast; no raw `<button>` / `div.fixed.inset-0`.
- [x] All 4 locales (sq, en, uk, it); all 7 breakpoints (layout-only, no viewport JS).
- [x] `router.refresh()` re-renders section → shows empty state after clearing.
- [x] 0 lint errors / 0 new TypeScript errors.
- [x] **Epic G — CLOSED** (G.1 storage + G.2 UI + G.3 clear history all done).

## Out of scope
Per-item delete (not in epic).
