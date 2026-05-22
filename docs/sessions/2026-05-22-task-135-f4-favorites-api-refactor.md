# Session Archive: Task 135 — F.4 Favorites API Refactor — 2026-05-22

## Summary

Migrated from `toggleFavorite(listingId, currentlyFavorited)` to explicit `addFavorite(listingId)` / `removeFavorite(listingId)` server actions. Intent is now unambiguous at the call site; no second argument needed.

## Files Changed

| File | Change |
|---|---|
| `src/modules/listings/actions/favoriteActions.ts` | New — `addFavorite` + `removeFavorite` server actions |
| `src/modules/listings/actions/toggleFavorite.ts` | Deleted — zero callers remaining |
| `src/modules/listings/components/FavoriteButton.tsx` | Updated import + call site |
| `src/modules/listings/components/__tests__/FavoriteButton.test.tsx` | Updated mocks to `addFavorite`/`removeFavorite` |

## Design Notes

**Idempotency preserved:**
- `addFavorite`: 23505 unique-constraint violation treated as success (concurrent add already completed).
- `removeFavorite`: deleting 0 rows is not an error (concurrent remove already completed).

**FavoriteButton call site:**
```typescript
const result = previousState
  ? await removeFavorite(listingId)   // user intent: remove
  : await addFavorite(listingId)      // user intent: add
```

The explicit branching makes the intent readable; the old `toggleFavorite(listingId, previousState)` required reading the implementation to understand which direction was being taken.

**Return types narrowed:**
- `addFavorite` → `{ isFavorited: true }` | `{ error: string }` — can never return false on success
- `removeFavorite` → `{ isFavorited: false }` | `{ error: string }` — can never return true on success

**`toggleFavorite.ts` removed** — it was the sole exported function in the file and had only one caller (`FavoriteButton`). No wrapper kept.

## Test Notes

`FavoriteButton.test.tsx` mocks updated. The test suite cannot run until `@testing-library/dom` is installed:
```
npm install --save-dev @testing-library/dom
```
This is a pre-existing missing peer dependency of `@testing-library/react` v16.

`favoritesShell.liveCounts.test.ts` — 8/8 passing (no changes required).

## Acceptance Criteria

- [x] `addFavorite`/`removeFavorite` created, RLS-safe
- [x] `FavoriteButton` uses explicit actions; no second argument
- [x] `toggleFavorite` deleted; zero references in codebase
- [x] No race conditions / double-writes (idempotent semantics preserved)
- [x] Optimistic state correct (existing FavoriteButton logic unchanged)
- [x] Test mocks updated to new API
- [x] 0 new lint/warnings in modified files
- [x] `favoritesShell.liveCounts.test.ts` 8/8 passing
- [x] TypeScript: no new errors in production code (pre-existing test-file TS errors unchanged)
