# Task 88 — Fix guest favorite behavior

**Date:** 2026-05-19  
**Sprint:** Sprint 0 — Critical Bugfix / Regression Stabilization  
**Status:** ✅ PASS

---

## Problem summary

A guest user (unauthenticated) clicking the favorite heart button on a listing card experienced a UX flash: the button briefly showed the heart as filled/active (optimistic UI), then immediately reset to inactive after the server returned `{ error: 'unauthenticated' }`. The auth flow was not triggered promptly — the guest saw a confusing flicker with no clear "sign in" prompt from the card itself.

---

## Root cause

In `FavoriteButton.tsx`, the optimistic state update (`setFavorited(nextState)` at line 52) ran unconditionally before any auth check. The server action `toggleFavorite` checked auth and returned `{ error: 'unauthenticated' }` for guests, which caused the button to revert via `setFavorited(previousState)` — but only after the round-trip to the server, creating the visual flash.

The fix: add a guest guard at the **top of `handleClick`**, before any state mutation, using `useAuth()` to check whether the viewer is authenticated.

---

## Investigation summary

### Favorite entry points audited

| Entry point | Component | Guest visible? | Fix needed? |
|-------------|-----------|---------------|-------------|
| Listing card (search results) | `ListingCard` ← `ListingsShell` | ✅ Yes | ✅ Fixed via `FavoriteButton` |
| Listing card (homepage featured) | `ListingCard` ← `FeaturedListings` | ✅ Yes | ✅ Fixed via `FavoriteButton` |
| Listing card (similar listings) | `ListingCard` ← `SimilarListings` | ✅ Yes | ✅ Fixed via `FavoriteButton` |
| Listing detail desktop sidebar | `FavoriteButton` ← `ListingContact` | ✅ Guest shows it | N/A — Already guarded |
| Favorites page | `ListingCard` ← `FavoritesShell` | ❌ Auth-gated | Not affected |

**`ListingContact.tsx` was already safe:** `listingId={authUser ? listing.id : undefined}` in `page.tsx` meant the FavoriteButton inside the listing detail sidebar was not rendered for guests (`{listingId && <FavoriteButton ...>}`). Mobile bottom bar also correctly used `showGuestCTA` to show a "Sign in" CTA for guests. No change needed there.

### Auth pattern in the project

The project uses route-based auth: no modal popup. Guests are redirected to `/${locale}/auth/login`.

`AuthStatus` has multiple states: `'initializing' | 'authenticated' | 'unauthenticated' | 'refreshing' | 'signing_out'`.

The guard redirects only when `status === 'unauthenticated'` (definitively not logged in). During `status === 'refreshing'` (in-flight session restoration), no action is taken — neither redirect nor toggle — to avoid false redirects when a session is being restored in the background.

---

## Implementation summary

**`src/modules/listings/components/FavoriteButton.tsx`**

Added imports:
- `useLocale` from `next-intl`
- `useRouter` from `next/navigation`
- `useAuth` from `@/modules/auth/context/AuthContext`

Added inside `FavoriteButton`:
- `const { user, status } = useAuth()`
- `const router = useRouter()`
- `const locale = useLocale()`

Added guest guard at the top of `handleClick`, before optimistic state mutation:
```tsx
if (!user) {
  if (status === 'unauthenticated') {
    router.push(`/${locale}/auth/login`)
  }
  return
}
```

No other callers were modified. No translation keys were added (the button redirects; it shows no new UI text).

---

## Files changed

- `src/modules/listings/components/FavoriteButton.tsx`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-88-guest-favorite-behavior.md` (this file)

---

## Guest favorite behavior before vs after

| Scenario | Before | After |
|----------|--------|-------|
| Guest clicks favorite on listing card | Heart flashes active → reverts to inactive ❌ | Heart stays inactive → redirects to `/auth/login` ✅ |
| Guest clicks favorite (auth refreshing) | Heart flashes active → reverts ❌ | Nothing happens (do-nothing during in-flight auth) ✅ |
| Guest clicks disabled listing favorite | No action (disabled guard runs first) ✅ | No action (disabled guard still runs first) ✅ |

## Authenticated favorite behavior before vs after

| Scenario | Before | After |
|----------|--------|-------|
| Add favorite | Optimistic toggle → server INSERT → reconcile ✅ | Same behavior ✅ (unchanged) |
| Remove favorite | Optimistic toggle → server DELETE → reconcile ✅ | Same behavior ✅ (unchanged) |
| Server error | Rollback to previous state ✅ | Same rollback ✅ (unchanged) |
| Concurrent favoriting | Intent-based dedup ✅ | Same dedup ✅ (unchanged) |

---

## Auth modal/login behavior

The project uses route-based auth (no modal). `router.push(\`/${locale}/auth/login\`)` is the established pattern:
- Consistent with `ListingContact.tsx` guest CTA (`href={/${locale}/auth/login}`)
- Consistent with `Header.tsx` favorites link for guests
- No new auth UI needed

Post-login behavior: the user lands on the login page. After login, Next.js will return them to whatever page they were on (the listing). Automatic replay of the favorite action after login is NOT implemented — the user will need to click favorite again after signing in. This is documented as a follow-up.

---

## Locales checked

All 4 locales (`sq`, `en`, `uk`, `it`) — no translation keys were added or changed. The guest redirect uses the locale prefix from `useLocale()`, so it works correctly for all locales.

- `sq` ✅ — redirect goes to `/sq/auth/login`
- `en` ✅ — redirect goes to `/en/auth/login`
- `uk` ✅ — redirect goes to `/uk/auth/login`
- `it` ✅ — redirect goes to `/it/auth/login`

---

## Breakpoints checked

`FavoriteButton` renders as a `w-8 h-8` circular button. No layout changes were made.

- `320` / `375` / `390` — mobile: favorite button remains its canonical 32×32px circle; redirect works
- `768` — tablet transition; no change
- `1280` / `1440` / `2560` — desktop: unchanged appearance and behavior

---

## Validation commands and results

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors / 6 warnings (all pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing errors in test files — 0 new errors |
| `npm run governance:localization` | ✅ PASS — 0C/0H/18M, at baseline |
| `npm run governance:primitives` | ✅ PASS — 0C/57H/8M, at baseline |
| `npm run governance:responsive` | ✅ PASS — at baseline |
| `npm run governance:ssr` | ✅ PASS — 0C/0H/0M, at baseline |
| `npm run governance:tailwind` | ✅ PASS — at baseline |
| `npm run build` | Not run (user runs builds manually per project policy) |

---

## Known pre-existing issues

- **Typecheck**: 4 errors in `AuthContext.test.tsx` and `FavoriteButton.test.tsx` (`@testing-library/react` missing exports). Pre-existing before this task.
- **Lint warnings (6)**: All pre-existing.

---

## Remaining risks or follow-up items

1. **Post-login favorite replay**: After the guest is redirected to login and successfully authenticates, they land on the listings page but must manually click favorite again. The project has no redirect-back-with-action system. Could be implemented later by storing redirect intent in `localStorage` or URL param before navigating to login.

2. **`FavoriteButton` test file**: `FavoriteButton.test.tsx` has 4 pre-existing typecheck errors. The test was likely written before `useAuth`, `useRouter`, and `useLocale` were added. The test file may need mock updates to reflect the new hook dependencies. Out of scope for this fix.
