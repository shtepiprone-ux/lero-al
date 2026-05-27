# Task 259 — F.5 — Save-to-Collection visibility in Favorites

**Date:** 2026-05-27  
**Sprint:** 13  
**Epic:** F — Favorites Improvements

---

## Audit (Scope 1)

### Root cause confirmed: **(a)** — missing `revalidatePath`

`createCollection` and `addToCollection` in `src/modules/listings/actions/collectionActions.ts` make DB writes but never call `revalidatePath`. The Favorites page (`/[locale]/favorites/page.tsx`) fetches collections via SSR using `getUserCollections(authUser.id)`. Since there is no cache invalidation signal, Next.js serves the stale SSR snapshot after navigation, so the newly created collection is never shown.

**Visibility matrix (pre-fix):**
- (a) Immediately after nav to Favorites: collection NOT visible ❌
- (b) After `router.refresh()`: collection NOT visible ❌ (stale cache)
- (c) After real page reload: collection visible ✅ (new SSR request bypasses cache)

**Cause (b)** is not applicable: `CollectionsSection` already uses `useState(initialCollections)` and updates it locally — the local state is correct; the bug is only on next navigation.

**Cause (c)** is not applicable: `createCollection` uses `createClient()` (session-aware); auth context is correct.

### Additional bug found: `addToCollection` result unchecked

In `SaveToCollectionButton.handleCreate`, the `addToCollection` call was `await addToCollection(...)` with no result check. If `addToCollection` returns `{ error: ... }` (e.g., DB constraint), the collection is created but the listing is not added — and the UI incorrectly shows `toast.success(t('created'))` and marks the listing as a member.

---

## Changes

### `src/modules/listings/actions/collectionActions.ts`

- Added `import { revalidatePath } from 'next/cache'`
- `createCollection`: added `revalidatePath('/[locale]/favorites', 'page')` before the success return
- `addToCollection`: added `revalidatePath('/[locale]/favorites', 'page')` before the success return

### `src/modules/listings/components/SaveToCollectionButton.tsx`

- `handleCreate`: changed `await addToCollection(...)` to `const addResult = await addToCollection(...)`
- Added error branch: if `'error' in addResult`:
  - `setCollections(prev => [{ ...result.collection, item_count: 0 }, ...prev])` — collection shown with `item_count: 0`, NOT added to `memberIds` (so the user can manually toggle it)
  - `toast.warning(t('error_add_after_create'))`
  - early `return`
- Success path unchanged: `item_count: 1` + memberIds updated + `toast.success(t('created'))`

### Locale files — 1 new key × 4 locales

| Key | sq | en | uk | it |
|-----|----|----|----|-----|
| `collections.error_add_after_create` | ✅ | ✅ | ✅ | ✅ |

---

## Positive flow verification

- User on listing detail page → click "Save to collection" → dialog opens → type collection name → Create
- `createCollection` inserts row → `revalidatePath('/[locale]/favorites', 'page')` → `addToCollection` inserts membership row → `revalidatePath('/[locale]/favorites', 'page')`
- Local state updated: collection appears in dialog with `item_count: 1`, checked ✅
- User navigates to `/favorites` → SSR re-runs (cache invalidated) → `getUserCollections` returns fresh list → new collection visible at top ✅
- After `router.refresh()`: same result ✅

## Negative flow verification

| Branch | Trigger | Result | UI |
|--------|---------|--------|-----|
| Empty name | whitespace only | `handleCreate` early-returns | ✅ preserved |
| `createCollection` error | DB fail / unauthenticated | `toast.error(t('error_generic'))` + early return | ✅ preserved |
| `addToCollection` error | DB fail after create succeeds | collection shown (`item_count: 0`), not checked; `toast.warning(t('error_add_after_create'))` | ✅ NEW |
| Cancel/Esc/backdrop | close dialog | no DB write for in-progress name | ✅ preserved |
| Double-submit | `isCreating` guard | Create button disabled | ✅ preserved |
| Permission denied (RLS) | unauthenticated | `createCollection` returns `{ error: 'unauthenticated' }` → `toast.error(t('error_generic'))` | ✅ preserved |
| Empty collection (0 items) | user creates then doesn't add | collection shown in Favorites with `item_count: 0` | ✅ preserved (no hiding) |

---

## Self-validation (Note 18)

- [x] `npx tsc --noEmit` → **0 errors**
- [x] `revalidatePath` imported and called in `createCollection` — verifiable at `collectionActions.ts:77`
- [x] `revalidatePath` imported and called in `addToCollection` — verifiable at `collectionActions.ts:155`
- [x] `addResult` checked for error in `handleCreate` — verifiable at `SaveToCollectionButton.tsx:88`
- [x] `error_add_after_create` present in all 4 locale files in `collections` namespace
- [x] Success path unchanged — `item_count: 1`, `memberIds` updated, `toast.success(t('created'))` ✅
- [x] Error path: collection shown with `item_count: 0`, not in `memberIds`, warning toast
- [x] `toggleCollection`, `handleOpen`, `Dialog` close behavior unchanged — no regressions

**Self-validation verdict: PASS** — 0 tsc errors, all AC met, positive + negative flows implemented.

---

## §17 UI pre-flight (responsive check)

Task 259 adds no new layout components — only a new warning toast (handled globally by Sonner) and a `revalidatePath` call in the server action. The 7 breakpoints (320/375/390/768/1280/1440/2560) are unaffected.

---

## Files changed

```
src/modules/listings/actions/collectionActions.ts
src/modules/listings/components/SaveToCollectionButton.tsx
messages/en.json
messages/sq.json
messages/uk.json
messages/it.json
```
