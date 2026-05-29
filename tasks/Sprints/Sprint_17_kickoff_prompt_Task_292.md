# Sprint 17 — Task 292 kickoff (test-env stub for `next/cache` so `applyListingTransition` tests exercise the success path)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands. Sonnet NEVER runs git. The orchestrator (Opus) reviews the real diff and emits explicit-path commit commands; the owner runs them in PowerShell.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST. Pre-read selection per `docs/rule-index.md` — **`docs/qa-rules.md` (test discipline) + `docs/architecture.md` (test setup placement)**. No scope change; STOP & ASK if ambiguous; literal AC; self-validate. This is a TEST-INFRASTRUCTURE task — NO production code or production behavior change.

---

## Why this task exists (orchestrator note, Opus, 2026-05-29)

During the Sprint 17 commit review, `npx vitest run` showed **26 failures / 318
pass**. Task 291 reconciles 7 of them (the Task 281 auth-controller contract).
The remaining **19 failures all live in
`src/modules/listings/actions/applyListingTransition.test.ts`** and share one
root cause — NOT a product bug:

```
Error: Invariant: static generation store missing in revalidateTag site-stats
 ❯ revalidate node_modules/next/src/server/web/spec-extension/revalidate.ts:89
 ❯ executeTransition src/modules/listings/actions/applyListingTransition.ts:127
     125| // Invalidate the homepage stats counter …
     127| revalidateTag('site-stats')
```

`applyListingTransition.ts` imports `revalidateTag` + `revalidatePath` from
`next/cache` (line 41) and calls them after a successful DB transition (lines
127 / 132 / 134). Under vitest (jsdom, no Next.js request scope) these functions
throw `Invariant: static generation store missing`, so **every test that drives
a SUCCESSFUL transition** (admin/moderator allowed, all valid action paths, all
`applyListingTransitionByStatus` bridges, two-step restore) blows up — 19 tests.
The permission-denied / invalid-transition / db-error tests pass because they
return BEFORE reaching `revalidateTag`.

The test file is otherwise well-built: it injects a pure mock DB via the optional
`_db` parameter ("no `vi.mock` needed, no module hoisting concerns"). Only the
`next/cache` framework side-effect is unstubbed. The repo ALREADY solves the
identical class of problem for `server-only` via a stub module + a Vitest alias
(`vitest.config.ts` line 18 → `src/tests/server-only-stub.ts`, added in Task
290). Task 292 applies the same proven pattern to `next/cache`.

This task does NOT touch `applyListingTransition.ts` or any production code —
the revalidate calls are correct in production; they simply have no request
scope in the unit-test env.

---

## Task 292 — Stub `next/cache` in the test environment

```
Hard contract: see top.

Type:        test infrastructure (NO production change)
Priority:    medium (last red block in the suite; unblocks the green-build gate)
Area:        vitest config / test setup — src/tests + vitest.config.ts

GOAL: Make the 19 success-path tests in applyListingTransition.test.ts pass by
neutralizing the `next/cache` request-scope side-effects in the test env, using
the SAME stub+alias pattern the repo already uses for `server-only`. After this
task, `npx vitest run` shows 0 failures (combined with Task 291).

PRIMARY approach (mirror the existing `server-only` pattern — recommended):
1. NEW `src/tests/next-cache-stub.ts` — exports test no-ops for the `next/cache`
   surface actually imported across the codebase. At minimum:
     export const revalidateTag = (_tag: string): void => {}
     export const revalidatePath = (_path: string, _type?: 'page' | 'layout'): void => {}
     export const unstable_cache = <T>(fn: T): T => fn   // pass-through (callers get the raw fn)
     export const unstable_noStore = (): void => {}
   Match the exact signatures of what is imported (see investigation §2). Do NOT
   invent exports that are not consumed.
2. `vitest.config.ts` — add a `resolve.alias` entry mapping `'next/cache'` to
   `path.resolve(__dirname, './src/tests/next-cache-stub.ts')`, immediately
   below the existing `server-only` alias, with a matching one-line comment
   explaining the rationale (request-scope guard, like server-only).

FALLBACK approach (only if the alias leaks — see investigation §3): if any tested
module relies on the REAL `next/cache` behavior (e.g. `unstable_cache` actually
caching), do NOT globally alias. Instead add a per-file
`vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }))`
at the top of `applyListingTransition.test.ts` only. Document why the global
alias was rejected. (Default expectation: the alias is safe — `next/cache` never
functions in jsdom anyway — but you MUST confirm via §3 before choosing.)

This task MUST NOT:
- Touch `src/modules/listings/actions/applyListingTransition.ts` or any other
  production file.
- Change what `revalidateTag`/`revalidatePath` do in production.
- Delete, skip (`it.skip`), or weaken any of the 19 tests to make them "pass".
  They must pass by exercising the REAL success path with the side-effect stubbed.
- Change unrelated test files.

Filed by: orchestrator (Opus 4.7) on 2026-05-29 as the follow-up flagged in the
Task 291 kickoff ("Out of scope / Follow-up").

Pre-read:
- docs/agent-contract.md   (always)
- docs/backlog.md          (always)
- docs/qa-rules.md         → test discipline; "passing" means real path exercised.
- docs/architecture.md     → where test setup/stubs live.
- vitest.config.ts         → the existing `server-only` alias (the pattern to mirror), line 14-20.
- src/tests/server-only-stub.ts → the reference stub (Task 290).
- src/tests/setup.ts       → global setup (fetch stub).
- src/modules/listings/actions/applyListingTransition.ts → READ ONLY: confirm the next/cache import + call sites (lines 41, 127, 132, 134).
- src/modules/listings/actions/applyListingTransition.test.ts → the suite that must go green; note the pure `_db` injection style.

Required investigation (PASTE outputs in the session log):

1. Capture the exact current red set BEFORE changes:
   ```
   npx vitest run src/modules/listings/actions/applyListingTransition.test.ts
   ```
   Paste the failing-count + the `Invariant: static generation store missing` trace.

2. Exact `next/cache` surface imported across the repo (so the stub exports match):
   ```
   grep -rIn "from 'next/cache'\|from \"next/cache\"" src/ --include="*.ts" --include="*.tsx"
   grep -rIn "revalidateTag\|revalidatePath\|unstable_cache\|unstable_noStore\|revalidate(" src/ --include="*.ts" --include="*.tsx" | grep -v ".test." | grep -v node_modules
   ```

3. Alias blast-radius check — do any tested modules depend on REAL `next/cache`
   behavior (esp. `unstable_cache` as a cache, not a pass-through)?
   ```
   grep -rIn "unstable_cache" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
   ```
   For each hit, note whether a test imports that module and asserts caching
   behavior. If none → PRIMARY (alias) is safe. If any → use FALLBACK (per-file
   vi.mock) and document.

Scope (files Sonnet may touch — TEST INFRA + DOCS ONLY):
1. `src/tests/next-cache-stub.ts` — NEW (PRIMARY approach).
2. `vitest.config.ts` — add one `resolve.alias` entry + comment (PRIMARY approach).
   — OR (FALLBACK only) `src/modules/listings/actions/applyListingTransition.test.ts` — add the top-of-file `vi.mock('next/cache', …)`.
3. `docs/backlog.md` — standard task-closure update.
4. `docs/sessions/2026-05-29-task-292-next-cache-test-stub.md` — NEW session log per Task 264.

Out of scope (do NOT touch):
- `applyListingTransition.ts` and every other production file.
- The auth tests handled by Task 291 (`controller.test.ts`, `AuthContext.test.tsx`).
- `server-only-stub.ts` / the existing server-only alias (leave as-is; only add the new one beside it).
- Any product behavior, RLS, Supabase, email.

Acceptance criteria (literal):
- `npx vitest run src/modules/listings/actions/applyListingTransition.test.ts` → 0 failures (all 40 tests pass, incl. the 19 previously-failing success-path tests).
- Whole-suite `npx vitest run`: combined with Task 291, **0 failures**. If Task 291 is not yet merged when you run, expect exactly the 7 Task-291 auth failures and 0 `applyListingTransition` failures (the 19 are gone). State which baseline you ran against.
- The 19 tests pass by exercising the real success path (the mock DB returns `{ error: null }` and the transition completes); none are skipped, deleted, or weakened.
- NO production file changed (`git diff --name-only` shows only test-infra files + `docs/backlog.md` + the new session log). `applyListingTransition.ts` is byte-identical.
- The stub exports exactly the `next/cache` members consumed by the codebase (no more, no less) with matching signatures.
- `npx tsc --noEmit` → 0 errors.
- `npm run lint` → no NEW errors vs the known pre-existing 7.
- Note 18 self-validation block in the session log.
- "Files Changed" table per Task 264.
- Self-validation verdict line: `Self-validation: tsc=0 errors · applyListingTransition suite green (40/40) · whole-suite failures=0 (with T291) · production untouched · scope=test-infra+docs · PASS`.

Final report required from Sonnet:
1. Files Changed table.
2. Root-cause restatement (1-2 lines): `next/cache` request-scope side-effect under jsdom.
3. Approach chosen (PRIMARY alias vs FALLBACK vi.mock) + the §3 evidence that justified it.
4. The exact `next/cache` export surface stubbed + why each is included.
5. Before/after counts for the file (19 fail → 0 fail; 40/40 pass).
6. Whole-suite before/after (state the baseline: with or without Task 291 merged).
7. Confirmation `applyListingTransition.ts` is unchanged (diff/grep evidence).
8. Confirmation no test was skipped/deleted/weakened.

Do NOT emit `git add` / `git commit`. Do NOT run git. Do NOT change any
production file. Do NOT skip/delete/weaken tests. Do NOT alter the existing
server-only alias. Do NOT touch the Task 291 auth tests. Do NOT add stub exports
that nothing imports.
```

---

## Sequencing note (orchestrator)
Tasks 291 and 292 are independent (different files, different root causes) and
can be executed in either order or in parallel. Together they take the suite from
**26 failures → 0**. Recommend running 291 first (security-adjacent), then 292,
so the final `npx vitest run` on the 292 session log can show the full green
suite. Each gets its own review + commit hand-off.
