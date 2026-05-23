# Task 185 — P.3: Clear Stale Profile Name in Header After Self-Delete

**Date:** 2026-05-23  
**Epic:** P — Favorites, Guest-Auth & Account Lifecycle  
**Status:** ✅ Complete

## Root cause

`deleteOwnAccount()` (server action) calls `db.auth.admin.signOut(userId)` which invalidates the session on the Supabase server side. However, the Supabase JS SDK on the client does **not** fire a synchronous `SIGNED_OUT` event from a server-side token revocation — the event only arrives when the client next tries to refresh an expired access token. The `AuthController` therefore remained in `{ user: <stale> }` through the redirect, and the header continued to show the deleted user's name on the homepage.

## What changed

### `src/modules/cabinet/components/ProfileTab.tsx`

1. Added `useAuth` import from `@/modules/auth/context/AuthContext`
2. Added `const { signOut } = useAuth()` in the component body
3. In `handleDeleteAccount`: replaced `router.push(`/${locale}`)` with `signOut(() => router.push(`/${locale}`))`

```tsx
// Before
toast.success(t('delete_account_success'))
router.push(`/${locale}`)

// After
toast.success(t('delete_account_success'))
signOut(() => router.push(`/${locale}`))
```

## Why this works

`AuthContext.signOut()` wraps `controller.signOut()` in `startTransition`. `AuthController.signOut()`:
1. Commits `{ status: 'signing_out', user: null }` synchronously → header re-renders immediately with signed-out state
2. Calls `coreSignOut()` → clears the local Supabase session (stops stale refresh-token attempts)
3. Commits `{ status: 'unauthenticated', user: null }`
4. Then `navigate()` → `router.push(`/${locale}`)` redirects to the homepage

This is the identical pattern used by `handleLogout` in `Header.tsx` — the fix reuses the existing auth layer without any new mechanism.

## Verification
- `tsc --noEmit` → 0 errors
- No forced reload; no `window.location` usage; fixed exclusively via `AuthContext.signOut()`
