# Task 449 — Fix infinite `/api/auth/me` polling loop (self-retriggered SIGNED_OUT)

> **Type:** Bug fix — Email/auth lifecycle + Regression Shield (Epic RS, clause 15 in scope).
> **Severity:** P0. Every unauthenticated (and any null-session) client hammers `/api/auth/me`
> back-to-back forever (~3–4 req/s), confirmed in the owner's `npm run dev` log 2026-06-17.
> **Files in product scope:** `src/lib/auth/controller.ts` (1 guard, ~2 lines).
> **Files in test scope:** `src/lib/auth/__tests__/controller.test.ts` (new regression test).
> **Do NOT touch** anything else in product/test scope. No refactor, no architecture change, no new
> product/test files beyond the listed test update. Governance/session files listed below are allowed.

## Pre-read (rule-index → "Email / auth lifecycle task" + "Regression / critical-flow coverage task")

- `docs/agent-contract.md` (clauses 1–15; clause 15 = regression coverage is MANDATORY here)
- `docs/backlog.md`
- `docs/critical-flow-registry.md` — this task touches **P0 — Auth lifecycle** (the SIGNED_OUT/null-session
  re-verify path that feeds `Logout` / `Refresh token expiration` rows). Baseline the existing
  `controller.test.ts` green, then ADD the regression test below.
- `tasks/Epics/Epic_RS_Regression_Shield.md`
- `docs/qa-rules.md` (test/error-handling conventions)
- `docs/domain-rules.md`, `docs/integrations.md`, `docs/env.md` (auth lifecycle context only)

No UI is touched → the Mobile <640 full-width gate and the rendered verification matrix are **N/A**
for this task (state that explicitly in the session log; do not fabricate a matrix).

## Root cause (verified against the real code, not the report)

`src/lib/auth/controller.ts`:

1. `syncFromServer()` fetches `/api/auth/me` (line 54).
2. Server returns `user: null` → commits `{ status: 'unauthenticated' }` (line 138), then calls
   `coreSignOut('local')` (line 142) to stop the SDK's stale-token auto-refresh.
3. `coreSignOut('local')` makes the Supabase browser client emit a **`SIGNED_OUT`** event.
4. `handleAuthEvent('SIGNED_OUT', null)` reaches the branch at line 182
   (`if (!session || event === 'SIGNED_OUT')`) and calls `syncFromServer()` again.
5. → back to step 1. Infinite loop: `/api/auth/me → null → coreSignOut('local') → SIGNED_OUT → /api/auth/me`.
   The interval (~280 ms) equals one fetch round-trip — exactly the owner's dev-log signature.

The only existing guard (`if (this.state.status === 'signing_out') return`, line 167) does NOT cover
this, because after step 2 the status is `unauthenticated`, not `signing_out`.

**Why the current test suite misses it:** in `controller.test.ts` the `coreSignOut` mock is
`vi.fn().mockResolvedValue({ error: null })` — it never re-invokes the auth callback, so the
test's "does not loop" assertion (Scenario 4, line 417) only ever sees one fetch. The real SDK
re-emits `SIGNED_OUT`, which the mock does not model. The regression test below closes this gap.

## The fix (literal — implement exactly this)

In `handleAuthEvent`, the SIGNED_OUT / null-session branch must NOT re-sync when the controller is
already `unauthenticated` (the self-retriggered event has nothing left to verify).

Current (`src/lib/auth/controller.ts` ~line 182):

```ts
    if (!session || event === 'SIGNED_OUT') {
      this.syncFromServer()
      return
    }
```

Required after:

```ts
    if (!session || event === 'SIGNED_OUT') {
      // Guard against the self-retriggered loop: syncFromServer() calls
      // coreSignOut('local') when the server reports no user, which makes the
      // Supabase client emit another SIGNED_OUT. If we are ALREADY
      // unauthenticated there is nothing new to verify — re-syncing here would
      // fetch /api/auth/me forever (~3–4 req/s). Only re-verify when the current
      // state could still change (e.g. authenticated + localStorage cleared but
      // cookies still valid → must re-confirm with the server).
      if (this.state.status === 'unauthenticated') return
      this.syncFromServer()
      return
    }
```

Do not change any other line of `controller.ts`. Do not alter `syncFromServer`, the
`coreSignOut('local')` call, the version counter, or the `signing_out` guard.

**Scope precision (product vs test):** product scope is exact — the ONLY product change is this
guard + comment in `controller.ts`. In the **test file** you MAY add the minimal imports/helpers
inside `controller.test.ts` that Scenario 9 needs (e.g. a small flush helper). That is not scope creep;
inventing new product code or new files is.

## Positive flow (happy path) — must still work after the fix

- **P1. Authenticated session stays authenticated on tab restore.** Authenticated user, visibility
  sync fires → `/api/auth/me` returns user → stays `authenticated`. (Unchanged — not the SIGNED_OUT branch.)
- **P2. Genuine cross-tab / expired-token sign-out settles cleanly.** State `authenticated`,
  `SIGNED_OUT` fires → status is `authenticated` (≠ `unauthenticated`) → guard passes →
  `syncFromServer()` runs ONCE → server returns null → `unauthenticated` + `coreSignOut('local')`
  → the resulting self-`SIGNED_OUT` now hits the guard (status is `unauthenticated`) → **stops**.
  Net: exactly ONE extra `/api/auth/me`, then silence. (Previously: infinite.)
- **P3. localStorage cleared, cookies still valid (documented line 172 scenario).** State
  `authenticated`, DevTools clears localStorage → `SIGNED_OUT` fires → status is `authenticated` →
  guard passes → `syncFromServer()` → server returns the user (cookies valid) → stays
  `authenticated`. **This scenario MUST remain intact** — it is the reason the branch exists.
- **P4. Sign-in still verifies.** `SIGNED_IN` with a real session → line 188 path → `syncFromServer()`.
  Unchanged (the guard is only on the SIGNED_OUT/null-session branch).

## Negative flow (every off-happy-path branch)

- **N1. Self-retriggered SIGNED_OUT while already `unauthenticated`** → guard returns immediately,
  **no fetch**. This is the bug being fixed; it is the primary assertion.
- **N2. Guest first paint (state `unauthenticated`) receives a SIGNED_OUT/null-session event** →
  guard returns, no `/api/auth/me` storm. (A guest must never poll `/api/auth/me`.)
- **N3. Explicit `controller.signOut()`** → still guarded by `signing_out` at line 167; never reaches
  the new guard. Unchanged.
- **N4. `INITIAL_SESSION` / `TOKEN_REFRESHED`** → still early-return at lines 159/163. Unchanged.
- **N5. Network error during the one legitimate sync (P2)** → existing `catch` → `error` state.
  Unchanged; the guard does not affect the error path.

## Regression test (clause 15 — MANDATORY, this is the close condition)

Add to `src/lib/auth/__tests__/controller.test.ts`, in a new `describe` block
(e.g. "Scenario 9 — Self-retriggered SIGNED_OUT loop (Task 449)"). The key is that the
`coreSignOut('local')` mock must re-emit `SIGNED_OUT` like the real SDK does.

**Setup discipline (MANDATORY — prevents false red/green from init noise).** Mount/initialization can
itself trigger a sync/fetch depending on the harness. In EVERY Scenario 9 case, complete the
mount/setup phase FIRST, then clear the counters BEFORE firing the tested `SIGNED_OUT` event:
- `vi.mocked(global.fetch).mockClear()`
- `mockCoreSignOut.mockClear()` (where the case asserts on it)

All `fetch` / `coreSignOut` count assertions in Scenario 9 must count ONLY the calls caused by the
tested `SIGNED_OUT` event — never setup/initialization calls. (Re-install the re-firing
`mockCoreSignOut.mockImplementation` AFTER the clear, so the loop behavior is still modeled.)

Required cases:

1. **Loop is broken (primary).** Mount authenticated. Make `mockCoreSignOut` re-fire the auth
   callback when called with `'local'`:
   ```ts
   mockCoreSignOut.mockImplementation((scope?: string) => {
     if (scope === 'local') authCallbackRef.current?.('SIGNED_OUT', null)
     return Promise.resolve({ error: null })
   })
   ```
   `fetch` always resolves `okResponse(null)`. Fire `authCallbackRef.current?.('SIGNED_OUT', null)`,
   drive to `unauthenticated`, then **flush enough microtasks/timers to prove the self-retriggered
   `SIGNED_OUT` did not start a second sync**, and assert `fetch` was called **exactly 1 time** after
   the initial SIGNED_OUT-triggered sync. Settles at `unauthenticated`. **Without the guard, this same
   test must exceed 1 fetch call or fail by timeout** — capture that as the planted-violation proof in
   the session log.
2. **No fetch when self-event arrives already unauthenticated (N1/N2).** Mount **unauthenticated**;
   fire `SIGNED_OUT` (null session); assert `fetch` is **never** called.
3. **localStorage-cleared-but-cookies-valid still re-verifies (P3).** Mount authenticated;
   `fetch` returns `okResponse(MOCK_USER)`; `mockCoreSignOut` does NOT re-fire (server returns a user
   so `coreSignOut('local')` is never reached); fire `SIGNED_OUT`; assert exactly ONE fetch and final
   state `authenticated` with the user preserved.
4. **Genuine sign-out settles with exactly one extra verification (P2).** Mount authenticated; the
   re-firing `mockCoreSignOut` as in case 1; `fetch` returns null; assert final `unauthenticated`,
   `coreSignOut` called with `'local'`, and **exactly 1 legitimate server verification after the
   external SIGNED_OUT** (the self-retriggered SIGNED_OUT must not add a second fetch).

**Planted-violation proof (MUST be bounded — do NOT let the test hang on a real infinite loop):**
temporarily revert the guard (remove the `if (this.state.status === 'unauthenticated') return` line),
then:
- Run ONLY the new Scenario 9 case 1 (e.g. `npx vitest run -t "Self-retriggered SIGNED_OUT"` or the
  exact test name) — NOT the full suite.
- Use the existing per-test timeout or an explicit short bounded wait/flush window.
- Acceptable failure proof = `fetch` count becomes **>1 within the bounded flush/wait window**. Do NOT
  rely on a long timeout as the only failure signal (that just hangs CI).
Paste that bounded transcript in the session log, then restore the guard. A gate that passes both with
and without the fix is a no-op and is a task failure.

Also UPDATE `docs/critical-flow-registry.md`: under **P0 — Auth lifecycle**, either add a row or
extend the `Logout` / `Refresh token expiration` coverage note to cite the new Task 449 loop-guard
test + command, and set coverage ✅.

## Secondary observation — `AuthController: server sync failed {}` (collateral, NOT separate scope)

The owner also sees an intermittent console error from `controller.ts:149`
(`console.error('AuthController: server sync failed', { error: err })`). This is **collateral of the
same storm**: while the loop fires `/api/auth/me` ~3–4×/s, each new `syncFromServer()` aborts the
previous in-flight request, and under Turbopack HMR a fetch occasionally rejects with a non-Abort
error mid-recompile → the controller commits `error` state and logs. It is NOT an independent loop
(the `error` state does not self-retrigger), and it is expected to disappear once the loop is fixed.

- **In scope for this task:** confirm in the session log that, after the guard, the storm stops AND
  the `server sync failed {}` lines no longer appear in a normal `npm run dev` browse.
- **Out of scope (do NOT bundle):** the poor `{ error: err }` → `{}` serialization is a diagnosability
  weakness (qa-rules "Actionable Error-Toast Rule"). If still worth hardening after the loop is gone,
  the orchestrator opens a separate follow-up (Task 450) — do not expand this task to cover it.

## Acceptance criteria (each must be verifiable in the diff)

- AC1 — `controller.ts` SIGNED_OUT/null-session branch has the `unauthenticated` guard exactly as
  specified; no other product line changed. (Positive P2/P3, Negative N1.)
- AC2 — Regression case 1 (exactly 1 fetch after the initial SIGNED_OUT sync) present and passing;
  planted-violation FAIL transcript (without guard: >1 fetch or timeout) in the log.
- AC3 — Regression case 2 (no fetch when already unauthenticated) present and passing. (N1/N2)
- AC4 — Regression case 3 (localStorage-cleared/cookies-valid → stays authenticated) present and
  passing. (P3 — proves the fix does not over-block.)
- AC5 — Regression case 4 (genuine sign-out → exactly 1 server verification → unauthenticated) present
  and passing. (P2)
- AC6 — `docs/critical-flow-registry.md` updated (row/coverage note + command) to ✅.
- AC7 — Self-validation: `npx tsc --noEmit` = 0 errors; `npx vitest run src/lib/auth/__tests__/controller.test.ts`
  green; file-integrity (clause 14) green on both touched files; AC-by-AC table in the session log;
  Mobile/rendered-matrix explicitly marked N/A (no UI).
- AC8 — `docs/backlog.md` + a session log under `docs/sessions/2026-06-17-task449-auth-me-signout-loop.md`,
  including the "Files Changed" table. Do NOT emit `git add`/`git commit` — the orchestrator does that.

## Files Changed (expected — Sonnet fills the real table in the session log)

| Path | Why |
|---|---|
| `src/lib/auth/controller.ts` | Add the `unauthenticated` guard to break the self-retriggered SIGNED_OUT loop. |
| `src/lib/auth/__tests__/controller.test.ts` | New Scenario 9 regression cases 1–4 reproducing/guarding the loop. |
| `docs/critical-flow-registry.md` | Coverage row/note for the loop guard → ✅. |
| `docs/backlog.md` | Mark Task 449 status. |
| `docs/sessions/2026-06-17-task449-auth-me-signout-loop.md` | Session log + Files Changed table + planted-violation transcript. |
