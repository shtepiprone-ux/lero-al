# Task 182 — P.2: Contact Card "Account Deleted" for Guests / Zombie Sessions

**Date:** 2026-05-23  
**Sprint:** 9  
**Type:** auth/data layer bug fix

## Root Cause Investigation

### Bug: guest sees "Account deleted" instead of "Sign in to see contacts"

`ListingContact.tsx` has three display branches:

```ts
const ownerDeleted = !!(owner.deleted_at)
const showGuestCTA = isGuest && !owner.id && !ownerDeleted
```

1. `ownerDeleted` → "Account deleted" UI
2. `showGuestCTA` → "Sign in to see contacts" UI + `openAuthSheet('login')` button
3. else → contact buttons (phone, WhatsApp, message)

The bug was in `page.tsx`, not `ListingContact.tsx`.

### Root cause: `isGuest = !authUser` was too broad; fallback inferred deletion

In `page.tsx`:

```ts
const ownerRaw = Array.isArray(listing.owner) ? listing.owner[0] : listing.owner
const isGuest = !authUser  // ← BUG: zombie sessions not covered

const owner = ownerRaw ?? {
  // ...
  deleted_at: isGuest ? null : ('deleted' as string),  // ← BUG: null row inferred as deleted
}
```

**Guest path (correct):** `authUser = null` → `isGuest = true` → fallback `deleted_at = null` → `ownerDeleted = false` → `showGuestCTA = true` → "Sign in" UI shown. ✓

**Zombie session path (bug):** JWT is valid (Supabase `auth.users` row exists) but `public.users` row is gone (deleted/orphaned account). `getUser()` validates JWT only — returns a truthy `authUser`. `ownerRaw` comes from a join on `listings.user_id` → `users.id`; the owner's row may still exist OR the viewer's own row may be gone. The viewer's profile fetch in `profileResult` returns `null` for a zombie.

The critical failure: `isGuest = !authUser` is false for a zombie → fallback uses `deleted_at = 'deleted'` → `ownerDeleted = true` → "Account deleted" shown for a guest with a stale/zombie session.

Additionally, `ownerRaw` from the join resolves the **owner's** row, not the viewer's. For pure guests (no auth), RLS blocks the `users` join entirely → `ownerRaw = null`. For authenticated viewers, `ownerRaw = null` only when the **owner's** row is genuinely missing. But the `deleted_at` fallback was incorrectly applied based on viewer auth state, not owner data.

### Why `resolveSession()` was not used

`resolveSession()` validates JWT + fetches viewer's own `public.users` row. Using it here would require replacing `getUser()` with a more expensive auth call. Instead, the already-fetched `profileResult` (from `supabase.from('users').select('preferred_currency').eq('id', authUser.id).single()`) is a reliable proxy: if `profileResult.data = null`, the viewer's profile row is gone → zombie session.

## Fix

### `src/app/[locale]/listings/[slug]/page.tsx`

```diff
  let isInitiallyFavorited = false
  let preferredCurrency: PreferredCurrency = 'ALL'
+ let hasValidProfile = false
  if (authUser) {
    const [favResult, profileResult] = await Promise.all([...])
    isInitiallyFavorited = !!favResult.data
    preferredCurrency = (profileResult.data?.preferred_currency as PreferredCurrency) ?? 'ALL'
+   hasValidProfile = !!profileResult.data
  }

  const ownerRaw = Array.isArray(listing.owner) ? listing.owner[0] : listing.owner
- const isGuest = !authUser
+ // A zombie session has a valid JWT (authUser truthy) but no profile row.
+ // Treat zombie sessions as guests so the contact card shows "Sign in" instead of "Account deleted".
+ const isGuest = !authUser || !hasValidProfile

  const owner = ownerRaw ?? {
    // ...
-   deleted_at: isGuest ? null : ('deleted' as string),
+   deleted_at: null,  // never infer deletion from null row — guests also produce null ownerRaw via RLS
  }
```

```diff
- canReport={!!authUser && authUser.id !== owner.id}
+ canReport={!isGuest && !!authUser && authUser.id !== listing.user_id}
```

### Why `deleted_at: null` is always correct for the fallback

When `ownerRaw = null`, there are exactly two causes:
1. **Guest / zombie viewer** — RLS blocks the `users` join; owner row exists but is invisible.
2. **Orphaned listing** — the owner's `public.users` row was genuinely deleted.

For case 2, the owner's row is genuinely gone, but the owner has a `deleted_at` column that would be non-null in the DB. The join returns `null` (entire row missing), not `{ deleted_at: 'some-date' }`. So setting `deleted_at: null` in the fallback is correct: there is no `deleted_at` value to infer.

The correct way to show "Account deleted" is when the **join succeeds** but `owner.deleted_at` is non-null — i.e., `ownerRaw` is truthy and has a `deleted_at` value. This case is already handled correctly without any fallback logic change.

## Acceptance Criteria

- [x] Guest viewer sees "Sign in to see contacts" (not "Account deleted") — `showGuestCTA` path
- [x] Zombie session viewer treated as guest — `isGuest = !authUser || !hasValidProfile`
- [x] Genuinely deleted owner account shows "Account deleted" — `ownerRaw` truthy with `deleted_at` set
- [x] `canReport` uses `!isGuest` guard (zombie cannot report)
- [x] `canReport` uses `listing.user_id` not `owner.id` (defensive against empty-string fallback)
- [x] `tsc --noEmit` → 0 errors
- [x] No fake fix — root cause addressed in auth/data layer, not papering over in UI component
