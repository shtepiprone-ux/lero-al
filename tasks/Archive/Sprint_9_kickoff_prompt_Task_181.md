# Kickoff prompt — Task 181 (Sprint 9 — P.1: guest "Add to favorites" opens the auth flow)

> Note 17: a guest clicks "Add to favorites" and the heart just shows an active/focus state — nothing
> happens. From the code, `src/modules/listings/components/FavoriteButton.tsx` ALREADY has a guest guard
> (lines ~56-61): it calls `openAuthSheet('login')` only when `status === 'unauthenticated'`, and
> `return`s otherwise. So for guests the click is no-op'ing because `useAuth().status` is NOT resolving to
> `'unauthenticated'` (likely stuck on `'loading'`). Root-cause it at the AuthContext layer and verify at
> EVERY favorite entry point (cards, detail, favorites page) — Global Change Verification Rule. NOTE:
> Task 182 shares this AuthContext root cause; whoever runs second reuses the fix.

```
You are Claude Code Sonnet 4.6 working in `lero-al`.

Hard contract:
- Do NOT change scope: make the guest favorite click open AuthSheet, at every entry point. Don't redesign
  favorites or the AuthSheet.
- Do NOT invent architecture. Use the existing openAuthSheet() + AuthContext. No window.location redirect.
- No fake fix: fix the auth status lifecycle deterministically — do NOT special-case `status==='loading'`
  to "just open the sheet" if that masks a real lifecycle bug. If the correct fix is ambiguous, STOP and ask.
- Global Change Verification Rule: verify the guest→auth behaviour at ListingCard, ListingContact,
  FavoritesShell, ListingsShell — every FavoriteButton consumer. Don't fix one.
- Update docs/backlog.md + add docs/sessions/2026-05-22-task-181-guest-favorite-auth.md.
- 0 new lint/typecheck errors; governance PASS; all four locales; all 7 breakpoints.
- Commit + push: SINGLE `git add -A`, then `git log -1` (paste real output). Owner runs git/SQL.

Pre-read:
- src/modules/listings/components/FavoriteButton.tsx (lines ~49-82: handleClick guest guard on
  `status === 'unauthenticated'`)
- src/modules/auth/context/AuthContext.tsx (the `status` state machine — why doesn't it reach
  'unauthenticated' for guests?), src/lib/auth/* , src/lib/auth/authSheet.ts (openAuthSheet)
- consumers: ListingCard.tsx, ListingContact.tsx, FavoritesShell.tsx, ListingsShell.tsx
- docs/ai-behavior.md (Auth Lifecycle Rules), docs/state-authority.md

Required investigation:
1. Determine the values `useAuth().status` actually takes for a guest, and why the guard's
   `status === 'unauthenticated'` branch isn't reached (likely `status` stays 'loading' / never settles).
2. Fix AuthContext so guest sessions deterministically resolve to `unauthenticated`. Keep the guard
   correct (open AuthSheet for guests; ignore in-flight transitions).
3. Confirm clicking any favorite control as a guest opens AuthSheet('login') at every entry point.

Acceptance criteria:
- Guest click on any favorite control opens AuthSheet (login) — verified at all four consumers.
- FIX the pre-existing FavoriteButton test suite `src/modules/listings/components/__tests__/FavoriteButton.test.tsx`
  (carried over from Task 211 review): it mocks `next-intl` + `favoriteActions` but NOT `useAuth`/
  `openAuthSheet`, so 4 tests fail because the `if (!user) return` guard blocks every click. Add a
  `useAuth` mock to drive guest vs authed states; assert a guest click calls `openAuthSheet('login')` and
  does NOT toggle, and an authed click toggles. The suite must be fully green.
- `useAuth().status` deterministically settles to 'unauthenticated' for guests.
- No forced reload / cookie purge / loading-state hack masking the root cause.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.

Out of scope:
- Contact card "account deleted" (Task 182) and post-delete header (Task 185) — except the shared
  AuthContext fix, which both reuse.
```
