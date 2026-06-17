# Task 449 — Fix infinite `/api/auth/me` polling loop (self-retriggered SIGNED_OUT)

**Date:** 2026-06-17
**Type:** Bug fix — Auth lifecycle + Regression Shield (clause 15)
**Severity:** P0
**Status:** IMPLEMENTED — awaiting orchestrator review

## Summary

Fixed the infinite `/api/auth/me` polling loop (~3-4 req/s) caused by a self-retriggering
cycle: `syncFromServer()` → server returns null → `coreSignOut('local')` → Supabase emits
`SIGNED_OUT` → `handleAuthEvent` calls `syncFromServer()` again → forever.

The fix: a single guard in the SIGNED_OUT/null-session branch of `handleAuthEvent` that
returns immediately when the controller is already `unauthenticated` — there is nothing
new to verify.

## Root cause

In `controller.ts`, the `handleAuthEvent` SIGNED_OUT branch unconditionally called
`syncFromServer()`. When the server returned no user, `syncFromServer()` committed
`unauthenticated` and called `coreSignOut('local')`. The real Supabase browser client
re-emits `SIGNED_OUT` on `coreSignOut('local')`, which re-entered `handleAuthEvent` and
called `syncFromServer()` again — infinite loop.

The existing `signing_out` guard (line 167) did not cover this because after step 2 the
status is `unauthenticated`, not `signing_out`.

## Fix applied

```ts
// In handleAuthEvent, SIGNED_OUT/null-session branch:
if (this.state.status === 'unauthenticated') return
```

One guard line + a 7-line comment explaining the loop mechanism.

## Positive flows verified

- **P1.** Authenticated session stays authenticated on tab restore — unchanged (not the SIGNED_OUT branch).
- **P2.** Genuine cross-tab/expired-token sign-out settles cleanly — exactly ONE server verification, then the self-retriggered SIGNED_OUT hits the guard and stops (Scenario 9 case 4).
- **P3.** localStorage cleared, cookies still valid — re-verifies and stays authenticated (Scenario 9 case 3). The guard does NOT block this because status is `authenticated`, not `unauthenticated`.
- **P4.** Sign-in still verifies — SIGNED_IN path unchanged.

## Negative flows verified

- **N1.** Self-retriggered SIGNED_OUT while already `unauthenticated` → guard returns immediately, no fetch (Scenario 9 cases 1 and 2).
- **N2.** Guest first paint + SIGNED_OUT → no `/api/auth/me` poll (Scenario 9 case 2).
- **N3.** Explicit `controller.signOut()` → `signing_out` guard at line 167, unchanged.
- **N4.** `INITIAL_SESSION` / `TOKEN_REFRESHED` → early returns, unchanged.
- **N5.** Network error during legitimate sync → existing catch, unchanged.

## Secondary observation — `AuthController: server sync failed {}`

The intermittent console error from `controller.ts:149` was collateral of the same storm:
while the loop fired `/api/auth/me` ~3-4x/s, each new `syncFromServer()` aborted the
previous, and under Turbopack HMR a fetch occasionally rejected. Expected to disappear
once the loop is fixed. Owner should confirm during `npm run dev` after applying.

## Regression tests (Scenario 9 — 4 cases)

All 4 cases use a `mockCoreSignOut` that re-fires `authCallbackRef.current?.('SIGNED_OUT', null)`
when called with `'local'` scope — modeling the real Supabase SDK behavior.

1. **Loop is broken (primary):** Mount authenticated, fire SIGNED_OUT, assert exactly 1 fetch after settling unauthenticated.
2. **No fetch when already unauthenticated (N1/N2):** Mount unauthenticated, fire SIGNED_OUT, assert fetch never called.
3. **localStorage-cleared-but-cookies-valid (P3):** Mount authenticated, server returns user, assert stays authenticated with exactly 1 fetch.
4. **Genuine sign-out settles with 1 verification (P2):** Mount authenticated, server returns null, assert exactly 1 fetch and final unauthenticated.

## Planted-violation proof

Guard removed (`if (this.state.status === 'unauthenticated') return` commented out), ran
`npx vitest run src/lib/auth/__tests__/controller.test.ts -t "Self-retriggered SIGNED_OUT"`:

**Result: 3 of 4 tests FAIL.**

- Case 1 (loop is broken): FAIL — `expected { status: 'error', user: null } to deeply equal { status: 'unauthenticated' }` — the loop exhausts the mock response body, second sync gets `Body is unusable: Body has already been read`, controller enters error state.
- Case 2 (no fetch when already unauth): FAIL — `expected "vi.fn()" to not be called at all, but actually been called 1 times` — without the guard, the unauthenticated controller calls syncFromServer.
- Case 3 (localStorage-cleared): PASS — server returns user, coreSignOut('local') is never reached, guard is irrelevant.
- Case 4 (genuine sign-out): FAIL — same loop→error as case 1.

Guard restored, all 44 tests pass.

## Self-validation (AC7)

- `npx tsc --noEmit` = 0 errors
- `npx vitest run src/lib/auth/__tests__/controller.test.ts` = 44 passed (44)
- Mobile/rendered-matrix: **N/A** (no UI touched)

## AC-by-AC checklist

| AC | Status | Evidence |
|----|--------|----------|
| AC1 — `unauthenticated` guard in SIGNED_OUT branch, no other product line changed | DONE | `git diff src/lib/auth/controller.ts` shows only the guard + comment |
| AC2 — Case 1 (exactly 1 fetch) + planted-violation FAIL transcript | DONE | Test passes; planted-violation shows case 1 FAIL (error state from body reuse) |
| AC3 — Case 2 (no fetch when already unauthenticated) | DONE | Test passes |
| AC4 — Case 3 (localStorage-cleared → stays authenticated) | DONE | Test passes |
| AC5 — Case 4 (genuine sign-out → exactly 1 verification) | DONE | Test passes |
| AC6 — critical-flow-registry.md updated | DONE | New row under P0 Auth lifecycle |
| AC7 — tsc 0 errors, vitest green, mobile N/A | DONE | tsc clean, 44/44 green |
| AC8 — backlog.md + session log + Files Changed table | DONE | This file |

## Files Changed

| Path | Why |
|------|-----|
| `src/lib/auth/controller.ts` | Add `unauthenticated` guard to break the self-retriggered SIGNED_OUT loop |
| `src/lib/auth/__tests__/controller.test.ts` | New Scenario 9 regression cases 1-4 reproducing/guarding the loop |
| `docs/critical-flow-registry.md` | Coverage row for the loop guard → coverage status set to check |
| `docs/backlog.md` | Mark Task 449 as IMPLEMENTED |
| `docs/sessions/2026-06-17-task449-auth-me-signout-loop.md` | This session log |
