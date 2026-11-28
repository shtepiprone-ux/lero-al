# Task 1080 — Review 2

Kickoff: [Sprint_93_kickoff_prompt_Task_1080_An_Interrupted_Run_Leaves_No_Synthetic_Rows.md](../../tasks/Sprints/Sprint_93_kickoff_prompt_Task_1080_An_Interrupted_Run_Leaves_No_Synthetic_Rows.md) · OWASP record: [Task_1080.json](../security/owasp/reviews/Task_1080.json)

Review 2 of the working tree on 740e81772 (branch `task/1080-an-interrupted-run-leaves-no-synthetic-rows`, Revision 1, uncommitted) — APPROVED
Scope: diff-based; Revision 1 (`git diff 740e81772`): `src/tests/integration/fixtures.ts` (`removeRun`, the shape check), `src/tests/integration/__tests__/removeRun.test.ts` (`[SEC-1080-SHAPE-ONLY]`); the whole task diff against `main` re-read for V5 and V10; the executor's report of Revision 1 (pasted by the owner, 2026-11-28)
Tools: `owasp.mjs sync`, `check` → exit 0; `check-ruleset.mjs` → exit 0; `main` CI 46174747938 green; Route unit files → exit 0, 22 passed; `vitest related` → exit 0; typecheck → exit 0; ESLint → exit 0; `product-gates.mjs` → exit 0, 36 of 36; integration 35 files → exit 0, 192 passed; synthetic rows read-only → only the 14 rows of the 2026-11-23 run
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: the clean-up removes and counts the run's rows of every table a suite writes by its prefix, deletes only by one escaped run prefix of the exact shape, and the sweep finds a stale run by any of those rows; F1 of Review 1 is fixed.

## Checklist V

- V1: `node scripts/quality/owasp.mjs sync` → "142 sheets at 5254440ecf1a; 0 downloaded; added 0, changed 0, removed 0", exit 0; `check` → "142 sheets mapped (87 apply), every one read at its current version, every quote verified", exit 0; `node scripts/quality/check-ruleset.mjs` → "the live ruleset matches scripts/quality/main-ruleset.json", exit 0; `gh run list --branch main --limit 3` → CI 46174747938 success (Task 990, #86), Scorecard 46174747953 success, Repository settings 46148491112 success.
- V2: `git diff --stat 740e81772` → `src/tests/integration/__tests__/removeRun.test.ts` +11/-2, `src/tests/integration/fixtures.ts` +2; the two files R1 names, no other hunk.
- V3: claims rerun.
  - Route: `npm test -- scripts/__tests__/sweep-synthetic.test.ts src/tests/integration/__tests__/removeRun.test.ts` → "Test Files 2 passed (2)", "Tests 22 passed (22)", exit 0. Reproduced.
  - Import graph: `npx vitest related --run --reporter=verbose src/tests/integration/fixtures.ts src/tests/integration/__tests__/removeRun.test.ts` → `removeRun.test.ts`, 6 passed, exit 0. Text search (`tests/integration/fixtures|integration/__tests__/removeRun|removeRun|PREFIXED_COLUMNS`) → 37 files: the Route's 2 and its 35 integration files.
  - Integration: `npm run test:security-integration -- <the 35 Route files>` with the environment of `.claude/rules/project-facts.md` ("Supabase and test data": `SECURITY_TEST_TARGET=development`, the recorded `SECURITY_TEST_PROJECT_REF`, `TURNSTILE_SECRET_KEY` empty) → "Test Files 35 passed (35)", "Tests 192 passed (192)", 453 s, exit 0. No file was changed while it ran. Reproduced.
  - `npm run typecheck` → exit 0. `npx eslint --no-warn-ignored --max-warnings 0` over the two files → exit 0. `node scripts/quality/product-gates.mjs` → "36 of 36 product checks passed.", exit 0.
  - Break: the shape-check line of `removeRun` removed → `[SEC-1080-SHAPE-ONLY]` failed ("Tests 1 failed | 5 passed (6)"); restored, `cmp` → identical; the two Route files → 22 passed. Reproduced.
  - Rows after the run, read-only through `pg` in a `read only` transaction: every pair of `PREFIXED_COLUMNS`, `listings.slug`, `listing_inquiries.name` → 0, except `rate_limit_hits`: `zz_synth_mwtbsmmha629` 14; `auth.users` with a `zz_synth_` e-mail → 0. `node scripts/sweep-synthetic.mjs --dry-run` → "0 logged, 1 to remove (dry run)", "would remove zz_synth_mwtbsmmha629", exit 0. The executor's counts reproduced.
- V4: both files read in full. `removeRun` returns `{ verified: false, remaining: 0, errors: ['refused: not a run prefix'] }` as its first statement when `run` is not `^zz_synth_[0-9a-z]{8}[0-9a-f]{4}$` (`fixtures.ts:47`); without the `m` flag `$` matches only the end, so a trailing newline is refused too. The test's fake now records `listUsers`, so "no call" covers every read. R1 removes F1.
- V5: against `main` and against 740e81772: the two callers pass the exact shape (`createRun`, `fixtures.ts:131`; the sweep, only `PREFIX_SHAPE` matches, `scripts/sweep-synthetic.mjs:27`), so their behaviour is unchanged; the result shape is kept. Review 1 V5 holds for the rest of the task diff.
- V5a: no visible element changes.
- V6: no allowlist, baseline, registry row, `skip`, `only`, `todo` or `eslint-disable` added or removed.
- V7: below.
- V8: `git show 740e81772:src/tests/integration/fixtures.ts` written over the file → `[SEC-1080-SHAPE-ONLY]` failed (`"": expected { verified: true, remaining: +0, …(1) } to deeply equal …`), "Tests 1 failed | 5 passed (6)"; restored. AC1-AC3 as in Review 1 V8; AC4 the integration run above; AC5 `gh pr checks <n>` after the push.
- V9: no Story changes.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base main` → the same 14 sheets as Review 1; the record judges them and every sheet of the kickoff; `Input_Validation` and `Threat_Modeling` are now `met`.
- V11: no finding.
- V12: this file; `check-files.mjs` on the kickoff, this file and the record.
- V13: APPROVED; the commands for the owner follow (checklist H).
- V14: after the push.

## V7 — secure code review

Six steps on Revision 1: (1) no control weakened: the escaping, the target guard and the verified result are kept;
(2) no new entry point or input; (3) trust boundary unchanged; (4) no package or API; (5) no test or assertion
weakened, one case added; (6) categories: Authorization — touched: the service-role clean-up now denies by default
any value that is not one run prefix (`fixtures.ts:47`); Input and output — touched: the same check, a fixed anchored
pattern on an argument, no query built; JavaScript and TypeScript — touched: the pattern has no nested quantifier;
Authentication, Requests and redirects, Next.js entry points, Business logic, Data exposure and logging, Files — not
touched (`git diff --name-only 740e81772` names only the two test-tooling files).

## Findings

No findings. F1 of Review 1: fixed by Revision 1 (`src/tests/integration/fixtures.ts:47`,
`[SEC-1080-SHAPE-ONLY]`).

## Open for Opus and the owner

- The 14 `rate_limit_hits` rows of `zz_synth_mwtbsmmha629` go with the sweep step of this branch's first CI run
  (Review 1).
- After the merge: checklist H7 (archive, backlog, branch deletion).
