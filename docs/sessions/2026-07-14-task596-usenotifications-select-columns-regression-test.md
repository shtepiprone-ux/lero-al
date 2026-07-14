# Task 596 — Hook-level regression test: `useNotifications` `.select()` MUST include `template_id` + `template_params`

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_596_UseNotificationsSelectColumnsRegressionTest.md`.
Follow-up opened by the orchestrator at the Task 595 review (2026-07-14) — owner decision: commit 595's fix,
close the regression-coverage gap as this task.

## Why

Task 595's regression test (`NotificationItem.templateLocalization.smoke.test.tsx`) guards the downstream
**renderer** with a hard-coded `template_id` fixture — it never exercises `useNotifications`. If a future
refactor drops `template_id`/`template_params` from the hook's `.select()` again, all four of those tests would
still pass (the exact fixtures-bypass-the-hook blind spot that let the original bug ship). This task adds the
missing guard at the layer that actually regressed.

## Scope discipline

Product code (`useNotifications.ts`, `NotificationItem.tsx`) is byte-identical to `HEAD` — confirmed via
`git status --short` (not listed) and `git diff --stat` (empty output) after this session's temporary
planted-violation edit was reverted. Only a new test file was added; the existing `templateLocalization` /
`priceChange` tests were not touched.

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/notifications/hooks/__tests__/useNotifications.smoke.test.ts` (new) | Mounts the REAL `useNotifications` hook via `renderHook` against a mocked `@/lib/supabase/client` query-builder chain (`from → select → order → limit`, plus a no-op `channel/on/subscribe/removeChannel` for the realtime-subscription `useEffect`). Test 1 asserts `.select()` was called once with a column string containing BOTH `template_id` and `template_params`. Test 2 (chain-integrity) asserts `.order('created_at', {ascending:false})` and `.limit(30)` are still invoked, guarding against a refactor that silently drops ordering/paging while "fixing" the select. |
| `docs/critical-flow-registry.md` | Updated the "Notifications panel — template-driven title/body localization" row (owner task `595` → `595 + 596`): added the new hook-level test to the Command column and a Coverage note explaining both layers (render + hook `.select()`) are now guarded. |

## Positive flow

`renderHook(() => useNotifications())` triggers the hook's `useEffect` → `fetchAll()` → mocked
`supabase.from('notifications').select(...)`. `waitFor` resolves once the mocked `.limit()` promise settles.
Assertions read `selectSpy.mock.calls[0][0]` (the exact string literal passed to `.select()`) and check it
contains both column names — resilient to column-order/whitespace changes, matching AC2's "substring/contains
assertions" requirement.

## Negative flow — planted-violation proof (MANDATORY, clause 15)

Temporarily edited `useNotifications.ts` line 19 from
`.select('id, user_id, type, title, body, link, is_read, created_at, template_id, template_params')` to
`.select('id, user_id, type, title, body, link, is_read, created_at')` (simulating the exact Task 595 regression)
— then reran the new test:

**RED transcript:**
```
FAIL  src/modules/notifications/hooks/__tests__/useNotifications.smoke.test.ts > useNotifications — .select()
must fetch the template columns NotificationItem needs to localize > calls .select() with a column list
containing BOTH template_id AND template_params
AssertionError: expected 'id, user_id, type, title, body, link,…' to deeply equal StringContaining "template_id"

 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
```

Reverted the hook back to the correct `.select()` string. **GREEN transcript:**
```
 Test Files  1 passed (1)
      Tests  2 passed (2)
```

`git diff --stat -- src/modules/notifications/hooks/useNotifications.ts` after the revert → empty output,
confirming the product file is byte-identical to `HEAD` (no product-code change survives this session).

This is the literal AC4 requirement: dropping the two columns from the HOOK's `.select()` makes this test FAIL
(unlike Task 595's render-layer test, whose fixtures bypass the hook and would stay green).

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | New test file mounts the REAL `useNotifications` against a mocked Supabase client; no product-code change | ✅ | `useNotifications.smoke.test.ts` (new file); `useNotifications.ts` untouched (empty `git diff --stat`) |
| 2 | Positive-flow: `.select()` called with a string containing `template_id` AND `template_params` | ✅ | Test 1 |
| 3 | Chain-integrity: `.order(...)` + `.limit(PAGE_SIZE)` still called | ✅ | Test 2 |
| 4 | Planted-violation red/green transcript in session log | ✅ | Above |
| 5 | `docs/critical-flow-registry.md` row updated to "595 + 596" with new Command + Coverage note | ✅ | Row edited (see Files Changed) |
| 6 | Gates green: tsc=0, eslint clean, check:i18n unchanged, file-integrity + mojibake green | ✅ | See Self-validation |
| 7 | Single-writer: no git run | ✅ | This session ran no `git add`/`git commit` |

## UX flow trace

This is a test-only change with no user-facing runtime effect — the flow being guarded is the same one Task 595
fixed: bell open → `useNotifications` fetches with the template columns → `NotificationItem` localizes
template-driven rows per viewer locale. This task adds an automated tripwire at the fetch layer so that flow
cannot silently regress again without a failing test.

## Self-validation

`npx tsc --noEmit` = 0 errors (first pass caught two type errors from untyped mock-chain arrow functions —
`selectSpy.mock.calls[0][0]` inferred as `never`/tuple-index-out-of-range because `vi.fn(() => …)` with no
declared parameter types has an empty `Parameters` tuple; fixed by typing each mock's parameter explicitly).
`npx eslint src/modules/notifications/hooks/__tests__/useNotifications.smoke.test.ts` = clean (first pass had 5
`no-unused-vars` warnings on the newly-typed-but-unreferenced mock parameters; fixed with explicit `void param`
statements in each mock body — 0 warnings after). `npm run check:i18n` = PASSED, 2147×4 keys (unchanged, no key
touched). `npm run check:file-integrity` = PASSED, 2 files clean. `npm run check:mojibake` = PASSED, 0 artifacts
in 1705 files. `npx vitest run src/modules/notifications/` = **9/9 PASS** (3 `priceChange` + 4
`templateLocalization` + 2 new `useNotifications` hook tests) — zero regression on the two existing suites.

Git NOT run by this session (single-writer rule). Files Changed table above is for the orchestrator/owner to
review before staging/committing.

**Verdict: Task 596 is complete.** The hook-level blind spot flagged at the Task 595 review is closed — a
future refactor that drops `template_id`/`template_params` from `useNotifications`'s `.select()` will now fail
this test immediately (proven via the red/green planted-violation cycle above), independent of whether the
render-layer test's hard-coded fixtures would have masked it. HELD for orchestrator review — not committed.
