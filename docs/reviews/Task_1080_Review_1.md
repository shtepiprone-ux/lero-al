# Task 1080 — Review 1

Kickoff: [Sprint_93_kickoff_prompt_Task_1080_An_Interrupted_Run_Leaves_No_Synthetic_Rows.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_1080_An_Interrupted_Run_Leaves_No_Synthetic_Rows.md) · OWASP record: [Task_1080.json](../security/owasp/reviews/Task_1080.json)

Review 1 of the working tree on 0eccad3b2 (branch `task/1080-an-interrupted-run-leaves-no-synthetic-rows`, uncommitted) — NEEDS REVISION
Scope: diff-based; `src/tests/integration/fixtures.ts` (`PREFIXED_COLUMNS`, `removeRun`), `scripts/sweep-synthetic.mjs` (`runSweep`, `readPrefixed`), `scripts/__tests__/sweep-synthetic.test.ts`, the new `src/tests/integration/__tests__/removeRun.test.ts`; no entry point: service-role test clean-up and the CI sweep step against the one real project (D91); the executor's report (pasted by the owner, 2026-11-28)
Tools: `owasp.mjs sync`, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 46174747938 green; Route unit files → exit 0; `vitest related` → exit 0; ESLint → exit 0; typecheck → exit 1 (80 errors, all in the stale `.next/types/validator.ts`, 0 in repository files), exit 0 after the owner's removal of that folder; `product-gates.mjs` → exit 0, 36 of 36; integration 35 files → exit 0, 192 passed (twice, see V3)
Findings: Critical 0, High 0, Medium 1, Low 0
Overall risk: the change removes the Cause and its tests fail without it, but the clean-up that now deletes rows of pages, site settings and e-mail templates in the one real project still accepts any string as the run prefix, so the kickoff's T1 mitigation ("`RUN` of the exact shape") is not enforced.

## Checklist V

- V1: `node scripts/quality/owasp.mjs sync` → "142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0", exit 0; `check` → "142 sheets mapped (87 apply), every one read at its current version, every quote verified", exit 0; `node scripts/quality/check-ruleset.mjs` → "the live ruleset matches scripts/quality/main-ruleset.json", exit 0; `gh run list --branch main --limit 3` → CI 46174747938 success (Task 990, #86), Scorecard 46174747953 success, Repository settings 46148491112 success.
- V2: `git diff --stat 0eccad3b2` → `scripts/__tests__/sweep-synthetic.test.ts` +46/-2, `scripts/sweep-synthetic.mjs` +31/-2, `src/tests/integration/fixtures.ts` +18; untracked `src/tests/integration/__tests__/removeRun.test.ts`. Every file is a Scope file; no hunk outside the Fix.
- V3: claims rerun.
  - Route, default collection: `npm test -- scripts/__tests__/sweep-synthetic.test.ts src/tests/integration/__tests__/removeRun.test.ts` → "Test Files 2 passed (2)", "Tests 21 passed (21)", exit 0. Reproduced.
  - Import graph: `npx vitest related --run --reporter=verbose` over the four changed and new files → the same 2 files, 21 passed, exit 0. Text search (`tests/integration/fixtures|sweep-synthetic|removeRun|PREFIX_SHAPE|runSweep|PREFIXED_COLUMNS|PREFIXED_VALUE|readPrefixed|integration/__tests__/removeRun`) → 37 files: the 2 above and the 35 integration files of the Route. Nothing the Route left out.
  - Integration: `npm run test:security-integration -- <the 35 Route files>` (`SECURITY_TEST_TARGET=development`, the project ref taken from the host of `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`, `TURNSTILE_SECRET_KEY` empty, no value printed) → "Test Files 35 passed (35)", "Tests 192 passed (192)", 455 s, exit 0. V8 below put the `main` versions of the two product files back for a few seconds while this run was in progress, so the run was repeated on the unchanged tree: see "Clean integration run".
  - `npm run typecheck` → exit 1: 80 errors, every one in `.next/types/validator.ts` (39 TS2307, 41 TS2344), a gitignored file (`.gitignore:18`) of a production build dated 2026-11-21 that still names `src/app/admin/layout.js` (moved by Task 988); `tsconfig.json:35` includes `.next/types/**/*.ts`; 0 errors in repository files. The same state was recorded in Task 990 Review 1. Not a finding of this diff. Owner, 2026-11-28 (translated): "if this folder is no longer needed, it can be deleted"; nothing but `tsconfig.json` reads `.next/types` (`grep` over `scripts`, `src`, `.github`, the configs → no match), the folder was removed, and `npm run typecheck` → exit 0.
  - `npx eslint --no-warn-ignored --max-warnings 0` over the four files → exit 0.
  - `node scripts/quality/product-gates.mjs` → "36 of 36 product checks passed.", exit 0.
  - Deliberate breaks, each once, restored (`cmp` → identical), 21 passed after: AC3 `PREFIXED_VALUE = /(zz_synth_[0-9a-z]+)/` → `[SEC-1080-SHAPE]` failed; AC2 `RUN_LIKE = \`${RUN}%\`` → `[SEC-1080-PREFIX-ONLY]` failed; AC1 the count's error branch alone removed → 21 passed (the `typeof left !== 'number'` branch still reports the failed count, so the control holds twice); the error branch and the `catch` removed together (the executor's break) → `[SEC-1080-UNKNOWN]` "a count that throws: expected true to be false". Reproduced.
- V4: the four files read in full. `removeRun` deletes each listed pair before `listing_inquiries`, the listings and the users (`fixtures.ts:71`) and counts each with `count: 'exact', head: true` (`fixtures.ts:110-117`); the sweep reads each listed column after the slugs (`sweep-synthetic.mjs:97-102`, `:197-210`) and matches it with `PREFIXED_VALUE` (`:31`). Paging by a non-unique column can only repeat or skip a row whose value equals another's, which names the same prefix. The change removes both facts of "## Cause".
- V5: `git show main:` of both product files. Kept: the order inquiries → listing rows → listings → users, the retried user delete, the result shape; the target refused before any read, the log at any age, the two-hour rule, a failing read removing nothing, `--dry-run`, the e-mail and slug shapes, counts and prefixes only in the output (`[1080-SWEEP-FOUND]` asserts no value text). The one changed assertion (`--dry-run` now also expects the read `prefixed`) is stricter, not looser.
- V5a: no visible element changes (`git diff --name-only` names no page, component or Story).
- V6: no allowlist, baseline, registry row, `skip`, `only`, `todo` or `eslint-disable` added or removed.
- V7: below.
- V8: `git show 0eccad3b2:` of `fixtures.ts` and `sweep-synthetic.mjs` written over the changed files, the two Route files run → "Tests 9 failed | 12 passed (21)", exit 1 (`[1080-REMOVE]` ×3, `[SEC-1080-UNKNOWN]`, `[SEC-1080-PREFIX-ONLY]`, `[1080-SWEEP-FOUND]`, `[SEC-1080-SHAPE]`, `[1080-SWEEP-READ-FAILS]`, `[AC16] --dry-run`); restored, `cmp` → identical. Each AC test fails without the change. AC4 is the integration run; AC5 is `gh pr checks <n>` after the push.
- V9: no Story changes.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → the diff triggers `AI_Agent_Security`, `Identity_Propagation_Patterns`, `Injection_Prevention`, `Input_Validation`, `JavaScript_and_TypeScript_Security`, `LLM_Prompt_Injection_Prevention`, `Logging`, `Logging_Vocabulary`, `MCP_Security`, `Mass_Assignment`, `OS_Command_Injection_Defense`, `Prototype_Pollution_Prevention`, `Secure_Coding_with_AI`, `Verifying_Third_Party_Agent_Execution_Evidence`; the record judges these and every sheet of the kickoff.
- V11: one finding, F1.
- V12: this file; `check-files.mjs` on the kickoff and this file.
- V13: NEEDS REVISION; the commit of the reviewed tree and the executor's prompt are handed over with this review.
- V14: after the push.

## Clean integration run

The same command on the unchanged tree (`cmp` with the executor's files → identical) → "Test Files 35 passed (35)",
"Tests 192 passed (192)", 456 s, exit 0. AC4 reproduced.

`node scripts/sweep-synthetic.mjs --dry-run` (read-only, the same environment) → "0 logged, 1 to remove (dry run)",
"would remove zz_synth_mwtbsmmha629", exit 0: the new read finds the run of 2026-11-23 that only `rate_limit_hits`
still names, which the sweep on `main` cannot find. The executor's claim reproduced.

## V7 — secure code review

Six steps: (1) no existing control weakened: the escaping of `RUN_LIKE` (`fixtures.ts:48`), the target guard
(`loadIntegrationEnv`) and the verified result are kept; (2) no new entry point; the widened service-role delete is the
change, F1; (3) trust boundary: the service role, unchanged in who holds it; (4) no new package or API; (5) no test,
assertion or rule weakened; (6) the categories below.

- Authorization — touched: the service-role delete of `removeRun` now covers 11 more tables (`fixtures.ts:35-38`,
  `:71`); "deny by default" for its one input, the run prefix, is missing: F1.
- Input and output — touched: every delete, count and read is a PostgREST `like` filter with the `escapeLike`
  pattern (`fixtures.ts:48`, `sweep-synthetic.mjs:200`, `:203`); no SQL text is built.
- Authentication and sessions — not touched: `git diff --name-only main` names no auth file.
- Requests and redirects — not touched: no request, redirect, fetch target or webhook in the diff.
- Next.js entry points — not touched: no file under `src/app`, no Server Action, no `next.config.ts`.
- Business logic — not touched: no product invariant; test tooling only.
- JavaScript and TypeScript — touched: `PREFIXED_VALUE` (`sweep-synthetic.mjs:31`) is a fixed-length prefix and one
  negative lookahead, linear; no `any` reaches a trust boundary.
- Data exposure, errors, logging — touched: the sweep prints counts and prefixes only; `removeRun`'s error texts stay
  in its result and the sweep prints only their number (`sweep-synthetic.mjs:131`).
- Files — not touched: no upload or storage change.

`db-catalog-audit.mjs`: not run in the review; the diff changes no table, grant, policy or role (the kickoff's D6 run,
2026-11-28, exit 0, "no finding").

## Findings

F1 — The clean-up deletes by any string it is given, not only by a run prefix
Severity: Medium      Category: Authorization (deny by default)      CWE: CWE-1287 (improper validation of specified type of input)
Location: `src/tests/integration/fixtures.ts:45-48`, `:71`
Description: `removeRun(admin, run)` builds `RUN_LIKE = escapeLike(run) + '%'` from whatever `run` is and, with this
diff, deletes by it in `pages`, `site_settings`, `email_templates` and eight more tables of the one real project
(D91). It never checks that `run` has the shape of a run prefix. The kickoff's threat model, T1, names the mitigation
"every delete and count is `like(column, escapeLike(RUN) + '%')` with `RUN` of the exact shape"; the shape is only
true of today's two callers (`createRun`, `fixtures.ts:129`; the sweep, which passes only `PREFIX_SHAPE` matches).
Impact: a caller that passes `''`, `zz_synth_` or a shortened prefix (a refactor, a new script, a test typo) deletes
every row of those tables (`like '%'`) or every synthetic run, and every user (`startsWith('')`, `fixtures.ts:66`),
through the service role, which skips RLS. Not reachable by a user today.
Reproduction: by reading: `escapeLike('')` → `''` (`src/lib/postgrest/escape.ts:12-13`), so `RUN_LIKE` → `'%'`; no
test calls `removeRun` with a value of another shape (`removeRun.test.ts` uses one valid `RUN` only).
Recommendation: Revision 1, R1.
References: OWASP Threat_Modeling, Input_Validation; kickoff "## Attack surface" T1; checklist A4.
Status: open

## Revision 1

- R1 (F1) — `src/tests/integration/fixtures.ts`, `removeRun`: as its first statement, before any read, delete or
  count, when `run` does not match `/^zz_synth_[0-9a-z]{8}[0-9a-f]{4}$/` (the shape `createRun` makes,
  `fixtures.ts:129`, and `PREFIX_SHAPE` of `scripts/sweep-synthetic.mjs:27`), return
  `{ verified: false, remaining: 0, errors: ['refused: not a run prefix'] }`. Nothing else changes.
  Test: `src/tests/integration/__tests__/removeRun.test.ts`, a new case `[SEC-1080-SHAPE-ONLY]`: for `''`,
  `'zz_synth_'`, `'zz_synth_short'`, `` `${RUN}%` ``, `` `${RUN}x` ``, `` ` ${RUN}` `` and `'%'`, the result is
  `{ verified: false, remaining: 0, errors: ['refused: not a run prefix'] }` and the fake records no query, no
  `deleteUser` and no `listUsers` call (the fake gains a `listUsers` record). It fails before R1 (save the output),
  passes after; I9: remove the check once, run, restore.

## Stories for the owner (V9)

None: no Story changes.

## Open for Opus and the owner

- Fact gap, reported by the executor: `.claude/rules/project-facts.md` ("Supabase and test data") does not say where
  `SECURITY_TEST_PROJECT_REF` comes from; the executor and this review took it from the host of
  `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`, which makes the check compare the URL with itself. Owner, 2026-11-28
  (translated): "OK" — the approved ref is now a fact in `.claude/rules/project-facts.md` ("Supabase and test data"),
  equal to the four earlier records of it; a run takes it from there.
- The executor edited `scripts/__tests__/sweep-synthetic.test.ts` once through a shell heredoc instead of Edit
  (A12, reported by the executor); the changed lines were read in V4 and are correct.
- 14 `rate_limit_hits` rows of `zz_synth_mwtbsmmha629` (2026-11-23) counted by the executor: left by a run before this
  task, of the kind this task removes. No manual deletion: the sweep step of this branch's first CI run (`ci.yml:184`,
  `:652`, `if: always()`) finds and removes them (the dry run above).
