# Task 181 — P.1: Guest "Add to Favorites" Opens Auth Flow

**Date:** 2026-05-23  
**Sprint:** 9  
**Type:** auth lifecycle fix + test suite repair

## Root Cause Investigation

### FavoriteButton guest guard (pre-fix)

```ts
if (!user) {
  if (status === 'unauthenticated') {   // ← too narrow
    openAuthSheet('login')
  }
  return
}
```

The guard opened the auth sheet ONLY when `status === 'unauthenticated'`. Two scenarios cause `status` to be something else when `user = null`:

1. **Transient visibility sync:** `AuthController.handleVisibilityChange()` calls `syncFromServer()` which immediately commits `{ status: 'refreshing', user: null }` (preserving the current null user). If the user clicks the favorite button during this ~50ms window (e.g., switching from another tab directly to a listing card), the click is silently swallowed.

2. **`'error'` state:** If `/api/auth/me` fails with a non-AbortError, the controller commits `{ status: 'error', user: null }`. The guard would also no-op here.

3. **Test/default context:** `AuthContext` defaults to `status: 'initializing'`. Any render outside `AuthProvider` (including the entire test suite) hits this default and is no-op'd.

### AuthContext initialization (confirmed correct)

`AuthProvider` initializes with:
```ts
new AuthController({
  status: initialUser ? 'authenticated' : 'unauthenticated',
  user: initialUser,
})
```

For guests (`initialUser = null`): initial status IS `'unauthenticated'`. The PRIMARY bug is the transient 'refreshing' window, not the initialization.

### Test suite failure

`FavoriteButton.test.tsx` rendered `<FavoriteButton>` WITHOUT an `AuthProvider` and WITHOUT mocking `useAuth`. `useContext(AuthContext)` returned the default `{ user: null, status: 'initializing' }`. With the old guard, ALL click tests were failing because:
- `!user` = true, `status === 'unauthenticated'` = false → early return, no optimistic update

## Fix

### Production fix — `src/modules/listings/components/FavoriteButton.tsx`

Changed guard from `status === 'unauthenticated'` to `status !== 'signing_out'`:

```diff
-    if (status === 'unauthenticated') {
+    // Guard only against active sign-out; all other null-user states are guests.
+    if (status !== 'signing_out') {
       openAuthSheet('login')
     }
```

This correctly opens the auth sheet for guests in:
- `'unauthenticated'` (steady state) ✓
- `'refreshing'` (transient visibility-sync window) ✓
- `'error'` (failed server sync) ✓
- `'initializing'` (should not happen in production, but handled defensively) ✓

And correctly suppresses it for:
- `'signing_out'` — user is actively signing out; auth sheet should not pop up ✓
- Authenticated users — `!user` = false; guard does not fire ✓

### Test suite fix — `src/modules/listings/components/__tests__/FavoriteButton.test.tsx`

Added missing mocks:
- `vi.mock('@/modules/auth/context/AuthContext', () => ({ useAuth: () => mockUseAuth() }))`
- `vi.mock('@/lib/auth/authSheet', () => ({ openAuthSheet: (view) => mockOpenAuthSheet(view) }))`

`beforeEach` default: `mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, status: 'authenticated' })` — restores all existing toggle tests.

Added 3 new guest tests:
- `guest click (unauthenticated) opens AuthSheet and does NOT toggle`
- `guest click while status=refreshing opens AuthSheet (transient visibility-sync state)`
- `guest click during signing_out does NOT open AuthSheet`

## Consumer Coverage (Global Change Verification)

| Consumer | Entry point | Auth tree | Covered |
|---|---|---|---|
| `ListingCard.tsx` | Card overlay + list button | `[locale]/layout.tsx` → `AuthProvider` | ✓ |
| `ListingContact.tsx` | Detail page action row | `[locale]/layout.tsx` → `AuthProvider` | ✓ |
| `FavoritesShell.tsx` | Via `ListingCard` | `[locale]/layout.tsx` → `AuthProvider` | ✓ |
| `ListingsShell.tsx` | Via `ListingCard` | `[locale]/layout.tsx` → `AuthProvider` | ✓ |

Fix is in `FavoriteButton.tsx` itself — single source covers all consumers.

## Post-Fix Verification

- `npx vitest run FavoriteButton.test.tsx` → **12/12 passed** (was failing on all click tests)
- `npx tsc --noEmit` → **0 errors**

## Acceptance Criteria

- [x] Guest click on any favorite control opens AuthSheet (login) — verified at all four consumers
- [x] FavoriteButton test suite fully green (12 tests, 3 new guest tests added)
- [x] `useAuth().status` guard now handles all guest states (unauthenticated, refreshing, error)
- [x] `status === 'signing_out'` correctly suppresses auth sheet
- [x] No fake fix — root-cause lifecycle bug fixed in guard, not papered over
- [x] 0 new lint/typecheck errors
