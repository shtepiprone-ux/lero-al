# Sprint 17 — Task 291 kickoff (CORRECTIVE to Task 281 — reconcile auth test suite with the new `SIGNED_OUT → syncFromServer()` contract)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands. Sonnet NEVER runs git. The orchestrator (Opus) reviews the real diff and emits explicit-path commit commands; the owner runs them in PowerShell.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST. Pre-read selection per `docs/rule-index.md` — **"Email / auth lifecycle" bundle + `docs/qa-rules.md` (test discipline) + `docs/state-authority.md`**. No scope change; STOP & ASK if ambiguous; literal AC; self-validate.

> **Security-critical task.** This touches the client auth state machine. Read clause 17 (security forbidden list) BEFORE writing any code. The tests you are editing encode real security guarantees (cross-tab sign-out, "stale result cannot re-authenticate", "no re-auth loop"). You are NOT allowed to weaken those guarantees — only to re-express them under the new async model. When in doubt, STOP & ASK.

---

## Why this task exists (orchestrator note, Opus, 2026-05-29)

Task 281 changed `AuthController.handleAuthEvent()` so that the `SIGNED_OUT` /
null-session branch now calls `this.syncFromServer()` instead of synchronously
committing `{ status: 'unauthenticated', user: null }`:

```ts
// src/lib/auth/controller.ts  (Task 281, lines ~182-185)
if (!session || event === 'SIGNED_OUT') {
  this.syncFromServer()   // was: ++version; inflight?.abort(); commit(unauthenticated)
  return
}
```

This change is **intentional and correct** — it fixes the owner-reported bug
where clearing only `localStorage` (DevTools → Application → Local Storage) fired
a spurious `SIGNED_OUT` and logged the user out even though valid auth cookies
remained. Delegating to `syncFromServer()` lets the server cookie session decide
the truth.

**However, Task 281 shipped without running `npx vitest run`.** The change broke
**7 pre-existing tests** that asserted the OLD synchronous contract. These test
files were NOT updated in Task 281 and are now red. Task 281 production code is
already committed and on `origin/main`; this task does NOT revert it. This task
makes the new contract explicit in the test suite and re-proves the security
properties hold under the new async model.

The 7 failing tests (verified by `npx vitest run` on 2026-05-29, owner machine):

**`src/lib/auth/__tests__/controller.test.ts`** (6):
1. `Scenario 3 — Multi-tab auth synchronization > SIGNED_OUT event (from any tab) transitions immediately to unauthenticated without fetch` (L317)
2. `Scenario 3 — Multi-tab auth synchronization > SIGNED_IN with null session (cross-tab token invalidation) transitions to unauthenticated` (L325)
3. `Scenario 3 — Multi-tab auth synchronization > SIGNED_OUT aborts any in-flight sync so the stale result cannot re-authenticate` (L333)
4. `Scenario 3 — Multi-tab auth synchronization > SIGNED_IN after SIGNED_OUT re-authenticates correctly` (L354)
5. `Scenario 4 — Refresh token expiration > SIGNED_OUT event on token expiration does not loop or leave loading state` (L384)
6. `Scenario 8 — UI state stability > unauthenticated state always has user === null` (L~651)

**`src/modules/auth/__tests__/AuthContext.test.tsx`** (1):
7. `Auth event propagation > SIGNED_OUT event updates rendered UI to unauthenticated` (L190)

---

## Task 291 — Reconcile auth test suite with the new SIGNED_OUT contract

```
Hard contract: see top.

Type:        test correction + security verification (NO production behavior change)
Priority:    high (red test suite blocks the green-build gate; security-adjacent)
Area:        client auth state machine — tests only (src/lib/auth + src/modules/auth)

GOAL: Restore a fully green `npx vitest run` for the auth controller and
AuthContext suites by updating the 7 listed tests to encode Task 281's NEW
`SIGNED_OUT → syncFromServer()` contract — while PROVING the original security
guarantees still hold under the new async model. No production auth code change
(default). If — and only if — investigation reveals a genuine security hole in
the new behavior (not merely a stale test), STOP & ASK the orchestrator before
touching `controller.ts`.

THE NEW CONTRACT (what the tests must now assert):
- On `SIGNED_OUT` (or any event with `session === null`), the controller does
  NOT immediately commit `unauthenticated`. It calls `syncFromServer()`:
    • `++version` (supersedes any prior in-flight sync)
    • `inflight?.abort()` (cancels the stale request)
    • commits `{ status: 'refreshing', user: <previous user> }` synchronously
    • awaits `/api/auth/me`; on resolve, commits
      `{ status: user ? 'authenticated' : 'unauthenticated', user }`
- A genuine sign-out (server session truly gone) ⇒ `/api/auth/me` returns
  `{ user: null }` ⇒ final state `unauthenticated`, user `null`,
  `coreSignOut('local')` called.
- A spurious SIGNED_OUT (localStorage cleared, cookies valid) ⇒ `/api/auth/me`
  returns the user ⇒ final state `authenticated` (this is the Task 281 fix).

SECURITY PROPERTIES THAT MUST REMAIN PROVEN (re-express, do NOT delete):
- "Stale result cannot re-authenticate": a SIGNED_OUT that supersedes an
  in-flight SIGNED_IN sync must reject the stale fetch result via the version
  guard — the stale user must NOT win. After SIGNED_OUT's own fresh sync
  resolves with null, final state is `unauthenticated`.
- "No re-auth loop / no stuck loading": after SIGNED_OUT, the controller settles
  to a terminal state (`unauthenticated`) once the sync resolves — it does not
  loop or hang in `refreshing`/`initializing`.
- "Genuine cross-tab sign-out ends unauthenticated": tab B receiving SIGNED_OUT
  ends at `unauthenticated` after the server confirms no session.

This task MUST NOT:
- Revert or alter the Task 281 production change in `controller.ts`
  (unless a real security hole is found → STOP & ASK first).
- Delete a security-property test or weaken it to a tautology. Re-express each
  under the async model; the guarantee must still fail the test if violated.
- Change `/api/auth/me`, `browser.ts`, AuthContext production code, middleware,
  or any other production file.
- Touch the 19 pre-existing `applyListingTransition.test.ts` failures
  (`revalidateTag` "static generation store missing" — unrelated test-env issue;
  see "Out of scope" + "Follow-up").
- Add fake timers / arbitrary sleeps where `vi.waitFor` / awaited promises are
  the correct tool.

Filed by: orchestrator (Opus 4.7) on 2026-05-29 after the Sprint 17 commit
review caught that Task 281 shipped 7 red tests (vitest was not run in 281).

Pre-read:
- docs/agent-contract.md            (always)
- docs/backlog.md                   (always)
- docs/qa-rules.md                  → test discipline, what a passing gate means.
- docs/state-authority.md           → SSR vs client auth authority (the model these tests encode).
- docs/ai-behavior.md               → Note 18 self-validation block.
- src/lib/auth/controller.ts        → the NEW production behavior (read; do NOT edit).
- src/lib/auth/__tests__/controller.test.ts   → the file you edit (helpers: mountAuthenticated, unauthenticated(), okResponse(), MOCK_USER, MOCK_SESSION, authCallbackRef, mockCoreSignOut).
- src/modules/auth/__tests__/AuthContext.test.tsx → the file you edit (helpers: renderProvider, okResponse, MOCK_USER, MOCK_SESSION, authCallbackRef).
- src/lib/auth/browser.ts           → onAuthStateChange / coreSignOut shapes (read only).

Required investigation (PASTE outputs in the session log):

1. Confirm the production branch under test (read, do NOT edit):
   ```
   sed -n '154,189p' src/lib/auth/controller.ts
   sed -n '120,152p' src/lib/auth/controller.ts   # syncFromServer
   ```

2. Re-run the suite to capture the exact current red set BEFORE changes:
   ```
   npx vitest run src/lib/auth/__tests__/controller.test.ts src/modules/auth/__tests__/AuthContext.test.tsx
   ```
   Paste the failing-test list + the actual-vs-expected for each (refreshing-vs-unauthenticated; user-present-vs-null; error-vs-unauthenticated).

3. Inventory the test helpers so the rewrites use existing fakes (no new ad-hoc mocks if a helper exists):
   ```
   grep -n "mountAuthenticated\|function unauthenticated\|okResponse\|MOCK_USER\|MOCK_SESSION\|authCallbackRef\|mockCoreSignOut" src/lib/auth/__tests__/controller.test.ts
   grep -n "renderProvider\|okResponse\|MOCK_USER\|MOCK_SESSION\|authCallbackRef" src/modules/auth/__tests__/AuthContext.test.tsx
   ```

Scope (files Sonnet may touch — TESTS + DOCS ONLY):
1. `src/lib/auth/__tests__/controller.test.ts` — update the 6 listed tests.
2. `src/modules/auth/__tests__/AuthContext.test.tsx` — update the 1 listed test.
3. `docs/backlog.md` — standard task-closure update + flip the Sprint 17 / Task 281 line to note "281 tests reconciled in 291".
4. `docs/sessions/2026-05-29-task-291-auth-test-reconciliation.md` — NEW session log per Task 264.

Per-test required changes (literal):

`controller.test.ts`:
- **(1) L317 "transitions immediately to unauthenticated without fetch"** — rename/rewrite to the new contract, e.g. "SIGNED_OUT (from any tab) re-verifies with the server and settles unauthenticated when no session remains". Mock `/api/auth/me` → `okResponse(null)`. Assert: synchronously `status === 'refreshing'`; `fetch` WAS called once; after awaiting, final `getState()` equals `unauthenticated()` and `mockCoreSignOut` called with `'local'`.
- **(2) L325 "SIGNED_IN with null session …"** — same pattern: null session ⇒ syncFromServer ⇒ server returns null ⇒ `unauthenticated`. Drive the async to resolution; assert final state.
- **(3) L333 "SIGNED_OUT aborts any in-flight sync so the stale result cannot re-authenticate"** — KEEP this as the key security test. New shape: SIGNED_IN starts in-flight fetch #1 (deferred, returns MOCK_USER). SIGNED_OUT supersedes it (`++version`, abort) and starts fetch #2 → mock it to resolve `okResponse(null)`. Resolve the STALE fetch #1 with MOCK_USER → assert it is REJECTED (state does NOT become authenticated). After fetch #2 resolves, final state is `unauthenticated`. The guarantee "stale result cannot re-authenticate" must still be the thing the assertion proves.
- **(4) L354 "SIGNED_IN after SIGNED_OUT re-authenticates correctly"** — change the mid-assertion `expect(...status).toBe('unauthenticated')` (now wrong) to drive SIGNED_OUT's sync to resolution first (mock null), `await vi.waitFor` unauthenticated, THEN SIGNED_IN (mock MOCK_USER), `await vi.waitFor` authenticated. End state + user unchanged in intent.
- **(5) L384 "SIGNED_OUT … does not loop or leave loading state"** — mock `/api/auth/me` → `okResponse(null)`; after awaiting, assert terminal `unauthenticated`, `user === null`, and that the controller is not stuck in `refreshing` (no loop). Drop the `fetch not.toHaveBeenCalled()` line (a fetch is now expected) and instead assert exactly ONE settle to a terminal state.
- **(6) L~651 "unauthenticated state always has user === null"** — drive SIGNED_OUT's sync to resolution (mock null) before asserting `user` is null; the invariant "no `unauthenticated` state carries a user" still holds at the terminal state.

`AuthContext.test.tsx`:
- **(7) L190 "SIGNED_OUT event updates rendered UI to unauthenticated"** — add `vi.mocked(global.fetch).mockResolvedValueOnce(okResponse(null))` before firing SIGNED_OUT (mirrors the SIGNED_IN test at L174). Keep the `await act(...)` and add `await waitFor(...)` so the async sync resolves; then assert `status === 'unauthenticated'` and `user-name === 'none'`. (Without the mock, syncFromServer's fetch rejects → `error` state — that is why this test currently shows "error".)

Acceptance criteria (literal):
- `npx vitest run src/lib/auth/__tests__/controller.test.ts src/modules/auth/__tests__/AuthContext.test.tsx` → 0 failures.
- `npx vitest run` whole-suite delta: the 7 listed tests now PASS; the 19 `applyListingTransition.test.ts` `revalidateTag` failures remain UNCHANGED (out of scope — must not be touched, must not increase); net new failures = 0; previously-passing tests still pass.
- Each rewritten security test still FAILS if its guarantee is violated (sanity: temporarily imagine reverting the version-guard → test #3 must go red). State this reasoning in the log; do not actually commit a broken controller.
- No production file changed (`git diff --name-only` shows only the 2 test files + `docs/backlog.md` + the new session log). If `controller.ts` had to change, that means a security hole was found → STOP & ASK was required first.
- `npx tsc --noEmit` → 0 errors.
- `npm run lint` → no NEW errors vs the known pre-existing 7 (documented in the Sprint 17 review: 3× PasswordInput.stories, 2× contacts/actions direct-status-write, 2× tel: window.location.href). Test edits must not add lint errors.
- Note 18 self-validation block in the session log.
- "Files Changed" table per Task 264 (one row per touched path + 1-line rationale).
- Self-validation verdict line: `Self-validation: tsc=0 errors · auth suites green · whole-suite new-failures=0 · 19 revalidateTag fails untouched · scope=tests+docs only · PASS`.

Final report required from Sonnet:
1. Files Changed table.
2. The OLD vs NEW contract for SIGNED_OUT (2-4 lines).
3. For each of the 7 tests: what the old assertion was, what the new assertion is, and which guarantee it now proves.
4. Explicit confirmation that NO production auth code changed (grep/diff evidence).
5. Explicit confirmation the "stale result cannot re-authenticate" guarantee is still proven (describe the version-guard mechanism the test exercises).
6. Before/after vitest counts (expect: 26 → 19 failures; 318 → 325 pass; total 344).
7. Confirmation the 19 `applyListingTransition` `revalidateTag` failures are unchanged + the recommendation to file a separate follow-up task for them (test-env `revalidateTag` stub).
8. Known limitations: note the brief `refreshing`-with-user window after a cross-tab SIGNED_OUT (sub-second, before the server confirms) — confirm it is acceptable per the Task 281 design intent, or STOP & ASK if you believe it is a UX/security problem.

Do NOT emit `git add` / `git commit`. Do NOT run git. Do NOT change `controller.ts`
or any production file (STOP & ASK if you think you must). Do NOT touch the 19
`applyListingTransition.test.ts` failures. Do NOT delete or weaken a security
test. Do NOT add new ad-hoc fetch mocks where an existing helper (`okResponse`,
`mountAuthenticated`) applies. Do NOT touch out-of-scope files.
```

---

## Out of scope (do NOT touch)
- `src/lib/auth/controller.ts` and every other production file (tests + docs only).
- `src/modules/listings/actions/applyListingTransition.test.ts` — its 19 failures
  are a pre-existing test-environment issue: `revalidateTag('site-stats')` at
  `applyListingTransition.ts:127` throws `Invariant: static generation store
  missing` because vitest runs it outside a Next.js request scope. Unrelated to
  Task 281 / 288. Leave it red.
- `/api/auth/me`, middleware, AuthContext production, `browser.ts`.
- Supabase dashboard, email, RLS, service-role usage.

## Follow-up (orchestrator will file separately if owner agrees)
- **Task 292 (proposed):** stub/guard `revalidateTag` in the vitest setup so the
  19 `applyListingTransition` tests can exercise the success path
  (`vi.mock('next/cache', ...)` or a request-scope shim). Cleans the last red
  block in the suite. Not part of Task 291.
