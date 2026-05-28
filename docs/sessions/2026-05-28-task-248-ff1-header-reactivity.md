# Task 248 — FF.1 — Header reactivity on profile name change

**Date:** 2026-05-28  
**Sprint:** 14  
**Type:** bug fix (state-authority)  
**Status:** ✅ Complete

---

## Problem Statement

After saving a name change in cabinet ProfileTab, the header user-chip continued showing the old name until a manual page reload. `router.refresh()` was already called but it only invalidates the RSC cache — the client-side `AuthController` state was not updated.

---

## State-Authority Analysis

**Data path (header name display):**
```
Header.tsx → useUser() → useAuth() → AuthContext → AuthController.getState()
                                                       ↑
                                              user: User | null
                                           (user.name shown in chip)
```

**Save flow (before fix):**
1. `updateCabinetProfile()` → writes new name to `users` DB table ✅
2. `startTransition(() => router.refresh())` → invalidates RSC cache, re-renders server components ✅
3. ❌ `AuthController.state.user.name` NOT updated → Header still reads old name

**Root cause:** `router.refresh()` updates SSR data but NOT the client-side `AuthController` state. The `Header` is a client component that reads from the controller's `user` object — it doesn't get the new name until a full navigation or explicit controller update.

**Fix (server-authoritative, not a fake fix):** After profile save, call `AuthController.refresh()` which triggers `syncFromServer()` → fetches `/api/auth/me` → returns updated user with new name → `commit()` notifies all subscribers → Header re-renders with new name.

---

## UX Flow Trace (Note 19)

**Before:**
- User edits name → Save → `t('profile_updated')` ✅ → router.refresh() ✅ → Header still shows OLD name ❌ → must reload manually

**After:**
- User edits name → Save → `t('profile_updated')` ✅ → `refreshUser()` fires → `/api/auth/me` returns new user → `AuthController` commits → Header re-renders with NEW name → `router.refresh()` also invalidates SSR cache ✅

---

## Control Inventory (Note 20 — preserved)

| Control | Before | After |
|---------|--------|-------|
| Name input | Editable | Unchanged — still editable |
| Save button | Works | Unchanged |
| Success status + checkmark | Shows after save | Unchanged |
| Error status | Shows on failure | Unchanged |
| Header user-chip (name) | Stale until reload | Now updates immediately |
| Header mobile drawer (name) | Stale until reload | Now updates immediately |
| Header initials (Avatar) | Stale until reload | Now updates immediately |
| All other ProfileTab controls | Unchanged | Unchanged |

---

## Changes Made

### `src/lib/auth/controller.ts`
Added public `refresh()` method that delegates to the private `syncFromServer()`:
```typescript
refresh(): void {
  this.syncFromServer()
}
```

### `src/modules/auth/context/AuthContext.tsx`
- Added `refreshUser: () => void` to `AuthContextValue` interface (default: `() => {}`)
- Wired `refreshUser` in `AuthProvider` via `useCallback`:
  ```typescript
  const refreshUser = useCallback((): void => { controller.refresh() }, [controller])
  ```
- Exposed in context value

### `src/modules/cabinet/components/ProfileTab.tsx`
- Destructured `refreshUser` from `useAuth()`
- Called `refreshUser()` immediately after save success (before the `router.refresh()` transition)

---

## Negative Flow

| Branch | Response |
|--------|----------|
| Server error on save | `setSaveStatus('error')`; `refreshUser` NOT called; form unchanged |
| Empty name (client validation) | Existing guard (empty name still saves — backend allows null) |
| Network offline | `updateCabinetProfile` rejects → `result.error`; no refreshUser |
| Double-submit | `isPending` guard prevents concurrent submits |
| Cancel without saving | No state mutation; old name preserved everywhere |
| `/api/auth/me` returns error after refreshUser | `AuthController` commits `status: 'error', user: null` — user sees sign-out state; unlikely (profile just saved successfully) |
| `router.refresh()` fails (rare) | `refreshUser()` still ran → header shows new name client-side; next navigation picks up truth from server |

---

## Surfaces Using `user.name` — All Update After Fix

| Surface | Location | Update path |
|---------|----------|-------------|
| Desktop user-chip (name) | `Header.tsx:191` | `useUser()` re-renders on controller commit |
| Desktop Avatar initials | `Header.tsx:122-123` | Same |
| Mobile drawer user name | `Header.tsx:262` | Same |
| Mobile drawer initials | `Header.tsx:259` | Same |

No breadcrumb or sidebar with user name found in the codebase.

---

## Self-Validation Block (Note 18)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `refreshUser` in `AuthContextValue` interface | ✅ with default `() => {}` |
| `AuthController.refresh()` delegates to `syncFromServer()` | ✅ |
| `ProfileTab` calls `refreshUser()` after save success | ✅ before `router.refresh()` |
| Server-authoritative fix (not fake/client-only) | ✅ fetches `/api/auth/me` from server |
| Error path: `refreshUser` NOT called | ✅ only called on success |
| No new locale keys | ✅ |
| No UI layout changes | ✅ |

**Final verdict:** ✅ PASS — `AuthController.refresh()` added; `refreshUser` exposed via context; ProfileTab calls it after save; tsc=0; server-authoritative fix.

---

## Files Changed

| Path | Change | Rationale |
|------|--------|-----------|
| `src/lib/auth/controller.ts` | Added `public refresh()` method delegating to private `syncFromServer()` | Expose server re-sync without exposing private method directly |
| `src/modules/auth/context/AuthContext.tsx` | Added `refreshUser: () => void` to interface + default; wired `refreshUser = useCallback(() => controller.refresh(), [controller])`; exposed in context value | Surface `refresh()` to React consumers |
| `src/modules/cabinet/components/ProfileTab.tsx` | `const { signOut, refreshUser } = useAuth()`; call `refreshUser()` after save success | Trigger auth state re-sync so header shows new name immediately |
