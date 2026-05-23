# Task 212 — P.5: Inline "Create Collection" from "Add to Collection"

**Date:** 2026-05-23  
**Epic:** P — Favorites, Guest-Auth & Account Lifecycle  
**Status:** ✅ Complete

## What changed

### `src/modules/listings/components/SaveToCollectionButton.tsx`

**Added imports:**
- `createCollection` from existing `collectionActions` (no new server actions)
- `Input` from `@/components/ui/input`

**Added state:**
- `newName: string` — controlled input for the new collection name
- `isCreating: boolean` — loading guard during create+add flow

**Added `handleCreate()`:**
```tsx
async function handleCreate() {
  const trimmed = newName.trim()
  if (!trimmed || isCreating) return
  setIsCreating(true)
  const result = await createCollection(trimmed)
  if ('error' in result) {
    toast.error(t('error_generic'))
    setIsCreating(false)
    return
  }
  // Add listing to new collection in the same flow
  await addToCollection(result.collection.id, listingId)
  setCollections(prev => [{ ...result.collection, item_count: 1 }, ...prev])
  setMemberIds(prev => new Set([...prev, result.collection.id]))
  setNewName('')
  setIsCreating(false)
  toast.success(t('created'))
}
```

**Dialog restructured:** flat `loading ? spinner : (emptyState | list)` → `loading ? spinner : fragment`:
- Empty-state (no collections) shown as before (Folder icon + message), reduced bottom padding
- Existing collections list rendered as before
- Inline create form (`Input` + `Button`) always shown below, separated by `border-t`

**Enter key:** `onKeyDown` on the Input triggers `handleCreate()` on Enter.

## Architecture decisions

- Two calls (createCollection → addToCollection) is correct: no atomicity concern since collection is created and RLS-owned by the user; `addToCollection` is idempotent on 23505. Not ambiguous — the task spec's "stop if ambiguous" refers to the data-model level, not the call count.
- Reuses existing `collectionActions.ts` exclusively — no parallel collections implementation.
- No new i18n keys: all strings use existing `collections` namespace (`name_placeholder`, `create`, `created`, `no_collections`, `error_generic`).

## Verification
- `tsc --noEmit` → 0 errors
- `createCollection` + `addToCollection` imported from existing `collectionActions.ts`
- RLS respected: `createCollection` checks `getUser()` + `getBlockedError()` server-side; `collection_items` RLS enforces collection ownership
