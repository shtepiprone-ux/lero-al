# Task 1012 — A cancelled CI run leaves no synthetic users or listings

Sprint 93. Priority P2. Owner decisions: O957-5 2026-11-19 (the owner, translated: "this test must be added to the next task in the list, because there are already 1008 tasks not done, and the list keeps growing": the synthetic test users and listings a cancelled CI run leaves are removed). Split out of Task 957 by the owner, 2026-11-22 (translated: "split the task into several subtasks"; option A chosen: each part is its own pull request from `main`, built from the code already written in the working tree of `task/957-signed-listing-uploads`). Corrected 2026-11-22 before execution (checklist D, owner, translated: "fix it"): that code is in commit `9de067faf`; `ci.yml` carries only this task's steps (the browser cache goes in Task 1013's own pull request, option A); Opus writes them before the executor starts, because AC1's test reads them; the Route runs the checklist's test command. Checked again 2026-11-22 before execution (after Task 1011's Scope missed two test mocks): the hunk headers corrected to the real `git diff main...9de067faf` (`@@ -140`, `@@ -496`, `@@ -505`); no other file of `9de067faf` that `main` holds names `removeRun`, `SYNTHETIC_RUN_LOG` or the sweep (the three integration tests that do are Task 957's own, absent from `main`); `main` has not changed any Scope file since `9de067faf` left it.
Implementer: Sonnet (`src/tests/integration/fixtures.ts`, `scripts/sweep-synthetic.mjs` and its test); Opus (`.github/workflows/ci.yml`). Reviewer: Opus. Human owner of the change: the owner.

## Goal

A cancelled CI run leaves its synthetic users and listings in the development project, because they are removed only in-process at the end of the run. After the task each job logs its prefix and a final step that also runs on cancellation removes the logged prefixes and any older than two hours.

## Cause

Read at `a9915f3ba`
- Synthetic test data outlives a cancelled run (O957-5): the integration suites and the signed-in walk create users and listings with the run prefix `zz_synth_<time><hex>` (`src/tests/integration/fixtures.ts:32`) and delete them only in-process at the end (`src/tests/integration/fixtures.ts:92`, called at `scripts/check-signed-in-pages.mjs:383`); a pull-request run is cancelled when a newer commit arrives (`.github/workflows/ci.yml:21`, `cancel-in-progress`), and GitHub then sends the running step "`SIGINT/Ctrl-C`", then "`SIGTERM/Ctrl-Break`", then "kills the process tree" (docs.github.com/en/actions/reference/workflows-and-actions/workflow-cancellation), so the clean-up never runs; no other code removes an old prefix. `gh run view 44417722424 --json jobs` → the walk step started 2026-11-18T23:11:24Z and was `cancelled` at 23:17:04Z, the authz test step (23:08:03Z) likewise; a read-only census of the development project (2026-11-19) → `zz_synth_mwmqjll84aaa` (started 23:11:25Z: 4 users including `walk_agent`, 1 listing) and `zz_synth_mwmqqjgb09a7` (23:16:49Z: 3 users) are left. The same GitHub cancellation page: a step with `if: always()` still runs in a cancelled job ("the condition `if: always()` would evaluate to true and the job continues to run"), within "the 5 minute cancellation timeout period".
Fix: every run writes its prefix to a job file and a final `if: always()` step of each CI job that creates synthetic data removes those prefixes and any prefix older than two hours; the in-process clean-up stays.

## Scope

- Synthetic leftovers (O957-5): `src/tests/integration/fixtures.ts`: the delete-and-verify body of `cleanup()` becomes the exported `removeRun(admin, run)` (same order, same verification), and `createRun()` appends its prefix (the prefix only) to the file named by `SYNTHETIC_RUN_LOG` when set.
  `scripts/sweep-synthetic.mjs` (new, Sonnet): starts only through `loadIntegrationEnv()` (development target and project ref, `src/tests/integration/environment.ts:49-52`); collects the prefixes listed in `SYNTHETIC_RUN_LOG` and every prefix of the exact shape
  `zz_synth_<8 base-36 time><4 hex>` found in auth e-mails and listing slugs whose time is more than two hours old (a job lasts at most 30 minutes); calls `removeRun` for each; prints counts and prefixes only; exits 1 when a read fails or anything remains; `--dry-run` only reads and lists.
  `.github/workflows/ci.yml` (Opus, on the same branch before Sonnet starts): in the `authz` and `click-shield` jobs every step that runs `test:security-integration` or `check-signed-in-pages`, and the final step "Synthetic test data of this job is removed" (`if: always()`, the three Supabase secrets on that step only, `node scripts/sweep-synthetic.mjs`), set `SYNTHETIC_RUN_LOG: ${{ runner.temp }}/synthetic-runs.txt` in their step `env` (Review 1 F4: GitHub's context table lists `runner` for `jobs.<job_id>.steps.env`, not for `jobs.<job_id>.env`); `package.json` (Sonnet): `sweep:synthetic`.
- `package.json`: the `sweep:synthetic` script line. Test: `scripts/__tests__/sweep-synthetic.test.ts`.
- Source of the code (option A, owner 2026-11-22): commit `9de067faf` on the local branch `task/957-signed-listing-uploads` (Task 957 Revision 3; Reviews 1-4 of Task 957 name no finding against these lines). Taken verbatim with `git show 9de067faf:<path>`: `src/tests/integration/fixtures.ts`, `scripts/sweep-synthetic.mjs` and `scripts/__tests__/sweep-synthetic.test.ts` whole (every change of them in that commit is O957-5), the `sweep:synthetic` line of `package.json`; and of `.github/workflows/ci.yml` only the three hunks of O957-5 (`git diff main...9de067faf -- .github/workflows/ci.yml`: `@@ -140`, `@@ -496`, `@@ -505`: the `SYNTHETIC_RUN_LOG` lines and the two "Synthetic test data of this job is removed" steps). Nothing else of that commit.
- Dependencies: none. Out of scope: the browser cache (the hunks `@@ -57`, `@@ -378`, `@@ -409`, `@@ -454` of the same diff: Task 1013, its own pull request).
- Kept as on `main` (checklist A2): `cleanup()` keeps its order and verification; the in-process clean-up stays; every CI job keeps its steps and adds only the final sweep step.

## Attack surface

Changed: a script with the service-role key that deletes users and listings of the development project.
- T8 Tampering: the synthetic sweep deletes a real person or listing, or runs against another project — mitigate: only the exact `zz_synth_` prefix shape (an e-mail or slug without it is never read for deletion), the escaped LIKE of `removeRun`, the development-target guard before any read, the two-hour age for a prefix this job did not log.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (2026-11-22).

- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — "## Attack surface" names the sweep script and its service-role key — AC1
- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the workflow change reaches `main` only through the pull request with `CI Required` green, merged by the owner — AC2
- Denial_of_Service: not applicable — the sweep runs in CI after the job, not on a request path
- Dependency_Graph_SBOM: not applicable — `package.json` gains one script line; no dependency enters the SBOM
- File_Upload: not applicable — no file is uploaded; the sweep reads a job-local prefix file
- GitHub_Actions_Security: "Pass secrets at the step level, not the job level." — the sweep step binds the three Supabase secrets to itself; the job keeps `contents: read` and full-SHA pins — AC1
- Injection_Prevention: "The preferred option is to use a safe API which avoids the use of the interpreter entirely or provides a parameterized interface" — `removeRun` deletes through the Supabase client with an escaped LIKE of the exact prefix shape — AC1
- JavaScript_and_TypeScript_Security: not applicable — no merge, path setter or eval; the prefix pattern is fixed and anchored
- Key_Management: not applicable — no key is added; the step uses the existing development project secrets
- Logging: "The following should usually not be recorded directly in the logs, but instead should be removed, masked, sanitized, hashed, or encrypted" — the sweep prints counts and prefixes only, never an e-mail — AC1
- Logging_Vocabulary: not applicable — the sweep records maintenance counts, not a security event of the vocabulary
- NPM_Security: not applicable — `package.json` gains the `sweep:synthetic` script only; no package is installed
- OS_Command_Injection_Defense: "The primary defense is to avoid calling OS commands directly." — the sweep starts no process; it calls the Supabase API — AC1
- Secrets_Management: "prevent them from leaking and compromising the organization" — the secrets are bound to the step and never printed — AC1
- Secure_Code_Review: "Security-Focused Review differs from functional code review by specifically targeting security concerns" — Opus reviews by `secure-code-review.md` — AC2
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — no package is added; the code is written by Sonnet and its every claim is rerun by Opus — AC2
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — threat T8 became an acceptance criterion — AC1
- Software_Supply_Chain_Security: "limit the application's dependencies to a specific version that has been previously verified as legitimate and secure" — the three `ci.yml` hunks add no action; every `uses:` of `ci.yml` stays pinned to a full commit SHA (`actions/cache` comes with Task 1013, not here) — AC2
- Threat_Modeling: "the threat modeling process should answer the following four questions" — "## Attack surface" answers them for T8 — AC1
- User_Privacy_Protection: not applicable — the sweep prints prefixes and counts only, no personal data
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns every claim of the executor's report — AC2
- Vulnerable_Dependency_Management: not applicable — no dependency is added or changed; `package.json` gains one script
## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 A cancelled run's synthetic data is removed and nothing else (O957-5) — test: `scripts/__tests__/sweep-synthetic.test.ts` (new, Sonnet): a logged prefix is removed at any age; an unlogged one older than two hours is removed, a younger one stays; `walk_agent@example.com`, `zz_synthx…` and a real e-mail are never touched; a failing read deletes nothing and exits 1; a non-development target is refused before any read; `--dry-run` deletes nothing; every `.github/workflows/ci.yml` job (the test reads the file; Opus adds the steps) that receives `SECURITY_CI_SUPABASE_SERVICE_ROLE_KEY` and runs `test:security-integration` or `check-signed-in-pages` sets `SYNTHETIC_RUN_LOG` (under `runner.temp`) in the `env` of each of those steps and of its last step, the sweep under `if: always()` (Revision 1); the existing integration suites pass on `removeRun`; after the PR's CI, `npm run -s sweep:synthetic -- --dry-run` (Opus, read-only) lists no prefix older than two hours.
- AC2 The CI jobs pass — test: `gh pr checks <n>` on GitHub after every check has concluded (checklist A5).

## Route

1. The owner creates the branch `task/1012-cancelled-run-leaves-no-synthetic-data` from `main` with this kickoff committed on it (checklist H).
2. Opus writes the three `ci.yml` hunks of the Scope from `9de067faf`; the owner commits them on the branch (checklist H), so the executor starts from a clean tree (checklist I1).
3. Tests first (I4): `scripts/__tests__/sweep-synthetic.test.ts` from `9de067faf`; run `npm test -- scripts/__tests__/sweep-synthetic.test.ts`; it fails on the unchanged code (no `scripts/sweep-synthetic.mjs`); keep that output.
4. The change (I5): `src/tests/integration/fixtures.ts`, `scripts/sweep-synthetic.mjs` and the `package.json` line from `9de067faf`.
5. Run: `npm test -- scripts/__tests__/sweep-synthetic.test.ts`; nothing else runs locally (the integration suites that use `removeRun` run in CI). Break (I9), each once, then restore: the development-target guard, the exact prefix shape, the two-hour age (the test fails each time). CI runs only on GitHub after the owner's push and is read with `gh pr checks <n>` (checklist A5).
6. Report: each command, exit code, relevant output; the failing run before the change; each break output.

## Review

- [Review 1 — APPROVED](../../docs/reviews/Task_1012_Review_1.md)
