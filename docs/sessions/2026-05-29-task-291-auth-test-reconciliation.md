# Session Log — Task 291: Auth Test Suite Reconciliation (SIGNED_OUT → syncFromServer contract)

**Date:** 2026-05-29
**Task:** 291
**Sprint:** 17
**Type:** test correction + security verification (NO production behavior change)
**Executor:** Sonnet 4.6

---

## 1. Why this task exists

Task 281 changed `AuthController.handleAuthEvent()` so the `SIGNED_OUT` / null-session branch now calls `this.syncFromServer()` instead of synchronously committing `{ status: 'unauthenticated', user: null }`. This fix is intentional and correct (prevents spurious logout when only `localStorage` is cleared). However, Task 281 shipped without running `npx vitest run`, leaving 7 tests asserting the OLD synchronous contract. This task re-expresses all 7 tests under the new async model while proving the original security guarantees still hold.

---

## 2. Investigation Outputs

### §1 — Production branch under test (read-only — NOT edited)

**`controller.ts` lines 182–185 (new SIGNED_OUT path):**
```ts
if (!session || event === 'SIGNED_OUT') {
  this.syncFromServer()   // was: ++version; inflight?.abort(); commit(unauthenticated)
  return
}
```

**`controller.ts` lines 120–129 (syncFromServer entry):**
```ts
private async syncFromServer(): Promise<void> {
  const v = ++this.version          // supersedes any prior in-flight
  this.inflight?.abort()            // cancels previous request
  const abort = new AbortController()
  this.inflight = abort
  // Enter refreshing — preserves current user so UI has no flicker.
  this.commit({ status: 'refreshing', user: this.state.user })
  ...
```

**OLD contract:** `SIGNED_OUT` → `++version` → `inflight?.abort()` → `commit(unauthenticated)` synchronously → no fetch  
**NEW contract:** `SIGNED_OUT` → `syncFromServer()` → `++version` → `abort old inflight` → `commit(refreshing, user)` → await `/api/auth/me` → on null → `commit(unauthenticated)` + `coreSignOut('local')`

### §2 — Failing test set BEFORE changes

```
npx vitest run src/lib/auth/__tests__/controller.test.ts src/modules/auth/__tests__/AuthContext.test.tsx

Test Files  2 failed (2)
      Tests  7 failed | 49 passed (56)
```

Exact failures:

| # | File | Test | Actual vs Expected |
|---|------|------|--------------------|
| 1 | controller.test.ts | "SIGNED_OUT transitions immediately to unauthenticated without fetch" (L317) | got `refreshing` + user present; expected `unauthenticated` + null + no fetch |
| 2 | controller.test.ts | "SIGNED_IN with null session transitions to unauthenticated" (L325) | got `refreshing`; expected `unauthenticated` + no fetch |
| 3 | controller.test.ts | "SIGNED_OUT aborts in-flight sync" (L333) | SIGNED_OUT left state as `refreshing`; test expected synchronous `unauthenticated` |
| 4 | controller.test.ts | "SIGNED_IN after SIGNED_OUT re-authenticates" (L354) | intermediate assert `unauthenticated` failed (`refreshing` actual) |
| 5 | controller.test.ts | "SIGNED_OUT does not loop or leave loading state" (L384) | got `refreshing` + user; expected `unauthenticated` + null + no fetch |
| 6 | controller.test.ts | "unauthenticated state always has user === null" (L650) | got MOCK_USER (user preserved during `refreshing`) |
| 7 | AuthContext.test.tsx | "SIGNED_OUT event updates rendered UI to unauthenticated" (L190) | fetch not mocked → TypeError → `error` state; expected `unauthenticated` |

### §3 — Helper inventory

**controller.test.ts:** `mountAuthenticated`, `mountUnauthenticated`, `unauthenticated()`, `authenticated()`, `okResponse(user)`, `errorResponse()`, `makeAbortError()`, `authCallbackRef`, `mockCoreSignOut`, `MOCK_USER`, `MOCK_SESSION`

**AuthContext.test.tsx:** `renderProvider(user)`, `okResponse(user)`, `authCallbackRef`, `MOCK_USER`, `MOCK_SESSION`, `mockCoreSignOut`

No new ad-hoc mocks created — all rewrites use existing helpers.

---

## 3. OLD vs NEW Contract for SIGNED_OUT

| Aspect | OLD (before Task 281) | NEW (Task 281 + Task 291) |
|--------|----------------------|--------------------------|
| Synchronous state after `SIGNED_OUT` | `unauthenticated`, user=null | `refreshing`, user=previous user |
| Fetch triggered? | No | Yes — one call to `/api/auth/me` |
| When unauthenticated is set | Immediately (synchronous) | After server confirms no session |
| Why | Simple signal pass-through | `localStorage`-cleared false-logout fix |
| Security unchanged? | N/A | ✓ version guard + abort still prevent stale re-auth |

---

## 4. Per-Test Changes

### Test 1 — controller.test.ts (was L317, Scenario 3)

**OLD name:** "SIGNED_OUT event (from any tab) transitions immediately to unauthenticated without fetch"  
**NEW name:** "SIGNED_OUT (from any tab) re-verifies with server and settles unauthenticated when no session remains"

**Old assertion:** synchronous `unauthenticated()` + fetch not called  
**New assertion:** mock `okResponse(null)` → synchronously `refreshing` + 1 fetch called → `await vi.waitFor(unauthenticated)` + `coreSignOut('local')` called

**Guarantee proven:** Cross-tab sign-out ends in `unauthenticated` once server confirms no session.

---

### Test 2 — controller.test.ts (was L325, Scenario 3)

**OLD name:** "SIGNED_IN with null session (cross-tab token invalidation) transitions to unauthenticated"  
**NEW name:** "SIGNED_IN with null session (cross-tab token invalidation) re-verifies with server and settles unauthenticated"

**Old assertion:** synchronous `unauthenticated()` + fetch not called  
**New assertion:** mock `okResponse(null)` → synchronously `refreshing` + 1 fetch → `await vi.waitFor(unauthenticated)`

**Guarantee proven:** null session is treated identically to SIGNED_OUT — always server-verified before committing unauthenticated.

---

### Test 3 — controller.test.ts (was L333, Scenario 3) — KEY SECURITY TEST

**OLD name:** "SIGNED_OUT aborts any in-flight sync so the stale result cannot re-authenticate"  
**NEW name:** "SIGNED_OUT aborts in-flight SIGNED_IN sync — stale result cannot re-authenticate"

**Old shape:** 1 deferred fetch (#1 = SIGNED_IN). SIGNED_OUT → synchronous `unauthenticated`. Resolve stale → rejected.  
**New shape:** 2 deferred fetches. SIGNED_IN → fetch #1 (staleFetch). SIGNED_OUT → `++version`, aborts #1, starts fetch #2 (signedOutFetch). Resolve stale #1 with MOCK_USER → version guard rejects (v=1, version=2). Resolve fetch #2 with null → commits `unauthenticated`.

**Subscriber pattern:** `committed[]` records every `commit()` call. Asserts `committed` never contains `'authenticated'`.

**How the guarantee is still proven:** The test would FAIL if the version guard were removed — stale fetch #1 would commit `authenticated` before fetch #2 commits `unauthenticated`, and `committed.includes('authenticated')` would be true. The test catches exactly this violation. `coreSignOut('local')` called exactly once (by fetch #2 only).

---

### Test 4 — controller.test.ts (was L354, Scenario 3)

**Old assertion:** mid-test synchronous `toBe('unauthenticated')` after SIGNED_OUT  
**New assertion:** two fetch mocks — `okResponse(null)` for SIGNED_OUT, `okResponse(MOCK_USER)` for SIGNED_IN. `await vi.waitFor(unauthenticated)` between events.

**Guarantee proven:** Genuine sign-out + subsequent sign-in reaches the correct terminal authenticated state. Sequential order enforced.

---

### Test 5 — controller.test.ts (was L384, Scenario 4)

**Old assertion:** synchronous `unauthenticated`, user=null, fetch not called  
**New assertion (async):** mock `okResponse(null)` → synchronously `refreshing` + `toHaveBeenCalledTimes(1)` → `await vi.waitFor(unauthenticated)` → user=null → `toHaveBeenCalledTimes(1)` (still 1, no loop)

**Guarantee proven:** Token expiry does NOT cause a retry loop. Exactly one server check; terminal state is `unauthenticated`.

---

### Test 6 — controller.test.ts (was L650, Scenario 8)

**Old assertion:** synchronous `user === null` (failed because user was MOCK_USER during `refreshing`)  
**New assertion (async):** mock `okResponse(null)` → `await vi.waitFor(unauthenticated)` → `user === null`

**Guarantee proven:** The invariant "unauthenticated state never carries a user" holds at the TERMINAL state, not the intermediate `refreshing` state (which intentionally preserves user to prevent UI flicker).

---

### Test 7 — AuthContext.test.tsx (L190)

**Old assertion:** synchronous DOM check after `act()` — failed because fetch was unmocked → `TypeError` → `error` state  
**New assertion:** `vi.mocked(global.fetch).mockResolvedValueOnce(okResponse(null))` before `renderProvider`. `await act(...)` fires SIGNED_OUT. `await waitFor(...)` for `unauthenticated`. DOM asserts `status=unauthenticated`, `user-name=none`.

**Guarantee proven:** React UI settles to `unauthenticated` after a cross-tab SIGNED_OUT + server confirmation.

---

## 5. Security Properties — Verification Summary

| Property | How test proves it |
|----------|--------------------|
| "Stale result cannot re-authenticate" | Test 3: `committed` never contains `'authenticated'` even after stale fetch #1 resolves with MOCK_USER. Would fail if version guard removed. |
| "No re-auth loop / no stuck loading" | Test 5: `toHaveBeenCalledTimes(1)` before AND after resolution; state reaches terminal `unauthenticated`. |
| "Genuine cross-tab sign-out ends unauthenticated" | Tests 1, 3, 7: all confirm terminal `unauthenticated` after server returns null. |
| "Brief refreshing-with-user window is acceptable" | Acknowledged: between SIGNED_OUT and server confirmation, state is `refreshing` with previous user (sub-second). This is the intended Task 281 design — prevents spurious logout flicker. Not a security problem (the user is not re-authenticated; old session is being re-verified, not restored). |

---

## 6. Production Code — Confirmation No Changes

Only test files touched. Production code is untouched:
- `src/lib/auth/controller.ts` — NOT changed (STOP & ASK not triggered; no security hole found)
- `src/modules/auth/context/AuthContext.tsx` — NOT changed
- `src/lib/auth/browser.ts` — NOT changed
- No `.tsx` / `.ts` source files changed (test files only)

---

## 7. Vitest Results

| Metric | Before Task 291 | After Task 291 |
|--------|----------------|----------------|
| Auth suites failures | 7 | 0 |
| Auth suites passing | 49 | 56 |
| applyListingTransition failures | 19 | 19 (unchanged — pre-existing `revalidateTag` test-env issue) |
| Total failures | 26 | 19 |
| Total passing | 318 | 325 |
| Total tests | 344 | 344 |

```
Tests  19 failed | 325 passed (344)
```

The 19 `applyListingTransition.test.ts` failures are pre-existing and unrelated to Task 291. Root cause: `revalidateTag('site-stats')` at `applyListingTransition.ts:127` throws `Invariant: static generation store missing` when run outside a Next.js request scope. Recommendation: file Task 292 to stub `revalidateTag` in vitest setup (`vi.mock('next/cache', ...)`) so the 19 tests can exercise the success path.

---

## 8. Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/lib/auth/__tests__/controller.test.ts` | Updated 6 tests (renamed + async + fetch mock + security assertions) | Re-express old synchronous SIGNED_OUT contract under new async model |
| `src/modules/auth/__tests__/AuthContext.test.tsx` | Updated 1 test (add fetch mock, sync → waitFor) | SIGNED_OUT now needs a mocked `/api/auth/me` response to settle to `unauthenticated` |
| `docs/backlog.md` | Task 291 ✅, sprint closure | Standard closure |
| `docs/sessions/2026-05-29-task-291-auth-test-reconciliation.md` | NEW — this file | Task 264 contract |

No `src/` production code changed.

---

## 9. AC Self-Audit (Note 18)

| AC | Status |
|----|--------|
| `npx vitest run` auth suites → 0 failures | ✅ 56/56 pass |
| Whole-suite delta: 7 tests now PASS | ✅ 26→19 failures; 318→325 pass |
| 19 `applyListingTransition` failures unchanged | ✅ confirmed |
| No previously-passing tests broken | ✅ 325 pass total |
| Each rewritten test still FAILS if guarantee violated | ✅ Test 3 subscriber proves stale-reject; Test 5 count proves no-loop |
| No production file changed | ✅ git diff shows only test files + docs |
| `npx tsc --noEmit` → 0 errors | ✅ |
| `npm run lint` → no NEW errors | ✅ 7 errors / 10 warnings — all pre-existing |
| "Brief refreshing-with-user window" acknowledged | ✅ Section 5 — acceptable per Task 281 design |
| 19 `revalidateTag` failures — Task 292 recommendation noted | ✅ Section 7 |
| Note 18 self-validation block | ✅ |
| "Files Changed" table per Task 264 | ✅ |
| locale parity ×4 | N/A — tests only, no user-facing strings |
| 7 breakpoints | N/A — tests only, no UI changes |

**Self-validation: tsc=0 errors · auth suites green (56/56) · whole-suite new-failures=0 · 19 revalidateTag fails untouched · scope=tests+docs only · PASS**
