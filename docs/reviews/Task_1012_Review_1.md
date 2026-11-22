# Task 1012 — Review 1

Kickoff: [Sprint_93_kickoff_prompt_Task_1012_A_Cancelled_Run_Leaves_No_Synthetic_Data.md](../../tasks/Archive/Sprint_93_kickoff_prompt_Task_1012_A_Cancelled_Run_Leaves_No_Synthetic_Data.md) · OWASP record: [Task_1012.json](../security/owasp/reviews/Task_1012.json)

Review 1 of the branch `task/1012-cancelled-run-leaves-no-synthetic-data`, working tree on 02caeef0b (uncommitted) — APPROVED
Scope: the diff against 81661dc4e (`main` the branch starts from): `.github/workflows/ci.yml` (02caeef0b, Opus), `src/tests/integration/fixtures.ts`, `package.json`, `scripts/sweep-synthetic.mjs`, `scripts/__tests__/sweep-synthetic.test.ts`; entry point: the CI step "Synthetic test data of this job is removed" of the jobs `authz` and `click-shield`
Tools: local commands below with their exit codes; CI is UNKNOWN until `gh pr checks <n>` after the owner's push (V14)
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: lowered; a cancelled run's synthetic users and listings are removed by a step that runs on cancellation, and only data of the exact run-prefix shape can be removed.

The implementer of the four uncommitted files is Sonnet; the three `ci.yml` hunks were written by an earlier Opus session (Route step 2). Every claim of the report was rerun here, none is taken from a report.

## Tools (local, 2026-11-22)

- V1: `node scripts/quality/owasp.mjs sync` → 0 changed (c2a1e3e32cec), exit 0; `node scripts/quality/owasp.mjs check` → exit 0; `node scripts/quality/check-ruleset.mjs` → the live ruleset matches, exit 0; `gh run list --branch main --limit 3` → CI run 45065787630 on e3c21b990 (#56) `success`.
- V3: `npx vitest run scripts/__tests__/sweep-synthetic.test.ts` (the body of `npm test --`) → 13 passed, exit 0; `scripts/sweep-synthetic.mjs` moved away → "Cannot find module '../sweep-synthetic.mjs'", exit 1; break 1 (the `return` of the refused target removed) → 1 failed, exit 1; break 2 (`TIME_AND_HEX` = `'zz_synth_.*'`) → 3 failed, exit 1; break 3 (`TWO_HOURS_MS = 0`) → 2 failed, exit 1; each restored with `git show 9de067faf:scripts/sweep-synthetic.mjs` and `cmp` → identical; final run 13 passed, exit 0. The executor's counts and failing cases reproduce exactly.
- V8: `.github/workflows/ci.yml` set to its `origin/main` version → the two `ci.yml` cases fail (2 failed, 11 passed), exit 1; restored from `HEAD`, `git diff --quiet HEAD -- .github/workflows/ci.yml` → clean; 13 passed, exit 0.
- V7: `node scripts/quality/check-files.mjs` on the five changed files → 0 findings, exit 0.
- V10: `node scripts/quality/owasp.mjs review <kickoff> --base origin/main` → 7 files, exit 0; record `docs/security/owasp/reviews/Task_1012.json` (every sheet of "## OWASP" and of the diff). The local `main` ref is at 25a72eb29, behind the branch base; `--base main` lists 28 files of Tasks 1011 and 1014, so `origin/main` (81661dc4e, the base of the branch) is the base of this diff.

## Scope (V2) and the changed lines (V4)

- `git diff --name-only origin/main...HEAD` → `.github/workflows/ci.yml` and the two kickoffs; `git status --short` → `package.json`, `src/tests/integration/fixtures.ts` modified, `scripts/sweep-synthetic.mjs`, `scripts/__tests__/sweep-synthetic.test.ts` new. Exactly the Scope.
- `fixtures.ts`, `sweep-synthetic.mjs` and the test are byte for byte the files of `9de067faf` (`cmp` → identical); `package.json` adds only `"sweep:synthetic": "node scripts/sweep-synthetic.mjs"`.
- The three `ci.yml` hunks equal the hunks `@@ -140`, `@@ -496`, `@@ -505` of `git diff main...9de067faf` (the `+`/`-` lines compared with `diff` → identical); the browser-cache hunks of Task 1013 are absent.
- `fixtures.ts`: the body of `cleanup()` moves into the exported `removeRun(admin, run, tracked)` (`src/tests/integration/fixtures.ts:36-107`) with the same order and verification; `cleanup()` calls it with the run's tracked ids (line 174); `createRun()` appends the prefix only to `SYNTHETIC_RUN_LOG` when set (lines 112-116). `RUN_LIKE` is no longer used inside `createRun()` (`grep` → only in `removeRun`).
- `sweep-synthetic.mjs`: the target guard runs before any read (lines 60-67); every read happens before any removal (lines 76-91); only `zz_synth_<8 base-36><4 hex>` in an `@example.com` e-mail or at the start of a slug is collected, and only when older than two hours unless logged (lines 93-101); output is counts and prefixes (lines 102-123).
- The sweep step reads `SECURITY_TEST_TARGET` and `SECURITY_TEST_PROJECT_REF` from the job `env` (`.github/workflows/ci.yml:111-113`, `:447-449`), so `loadIntegrationEnv()` confirms the development project in CI as it does for the suites.

## Approved behaviour (V5)

`cleanup()` keeps its order, its retry of refused user deletes and its verification (the moved lines are unchanged); the in-process clean-up stays; each CI job keeps its steps and gains one final step. No visible surface.

## Exemptions (V6)

None: the diff adds or removes no allowlist, baseline, registry row, `skip`, `only`, `ts-ignore` or `eslint-disable` (`grep` on the changed files → no match).

## Secure code review (V7, secure-code-review.md §2 and §3)

- §2: no control weakened (the suites keep every case; the clean-up is the same body); one new entry point, a CI step with the service-role key of the development project, guarded by `loadIntegrationEnv()`; no trust boundary moves; no package (`tsx` and `js-yaml` are already in `package-lock.json`); the workflow change adds no `uses:` and keeps `permissions: contents: read`.
- Authorization: not touched — no Server Action, Route Handler or policy in `git diff --name-only`.
- Input and output: touched — the only input is the job's log file; `parseRunLog` keeps a line only when it is exactly the prefix shape (`scripts/sweep-synthetic.mjs:33-36`); queries go through the Supabase client with escaped LIKE (`src/tests/integration/fixtures.ts:39`, `scripts/sweep-synthetic.mjs:178`).
- Authentication and sessions: not touched — no auth flow file in the diff.
- Requests and redirects: not touched — the script fetches only the configured Supabase URL confirmed by `loadIntegrationEnv()`.
- Next.js entry points: not touched — no file under `src/app`; `fixtures.ts` keeps `import 'server-only'`.
- Business logic: touched — the invariant "only synthetic data of a finished or cancelled run is removed" is held by the exact shape, the two-hour age (a job lasts at most 30 minutes, `timeout-minutes: 30`) and the target guard, each with a case that fails when broken (V3).
- JavaScript and TypeScript: the regular expressions are built from constants (`scripts/sweep-synthetic.mjs:24-29`), anchored, with no nested quantifier; no input reaches a `RegExp` constructor.
- Data exposure, errors, logging: touched — caught errors print fixed messages; no e-mail, id or secret is printed (the test asserts no `@` in the output).
- Files: not touched — no upload.
- Dependencies and configuration: touched — `ci.yml`: secrets bound to the sweep step only, the job `env` holds `vars` only, SHA pins unchanged, no `pull_request_target`.
- Agent and tool output: `check-files.mjs` → 0 findings on the five files; the CI change (02caeef0b) is listed here for the owner's approval in the pull request.
- Tests: one new test file, none removed or weakened; every case fails without its control (V3, V8).

## Stories (V9)

No Story changed; the change has no visible surface.

## Findings

None.

## Open parts

- Owner: commit the four files with this review, its OWASP record and the kickoff link; push; open the pull request (checklist H).
- Opus: `gh pr checks <n>` until every check has concluded (V14); the integration suites that run on `removeRun` (AC1) are read there.
- Opus, after that CI: `npm run -s sweep:synthetic -- --dry-run` (read-only, AC1) lists no prefix older than two hours.
