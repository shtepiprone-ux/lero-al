# Task 944 review 2 (Opus approver, 2026-11-04)

> **VERDICT WITHDRAWN (D19 precedent).** The Stop hook refused this session's approval with `GOVERNANCE INDEPENDENCE` for
> `cli.mjs`, `contract.mjs` and `governance-contract.selftest.mjs`: its shell-write reading counts six read-only `node -e`
> calls of this session as writes (`r2-independence-diagnosis.txt`; the pre-944 hook reports the same, no scope file changed).
> The 944 review block and the 935, 940, 941 and 943 rebase entries were reverted to their committed state; this file and the
> rebase evidence files in this folder are a template only. A fresh Opus approver that runs no such command reruns the review,
> rewrites them and signs the contracts.

Independent review under D2 (route step 5): this session is not 3d40df28, 6f2564f3, c819b1d2, 8ae82d47 or the first 944
implementation session; it wrote no file of the 944 contract scope. It wrote only this folder, the 944 sidecar's `stage` and
`review` fields, the `review.rebases` entries of the 935, 940, 941 and 943 contracts, the backlog row and the `docs/backlog-archive.md` closure row
(`npm run check:backlog-active` passed).

- Candidate: commit `22c6871a31eaf693b16ad68c2e0f5ec290aeedea` on `task/935-governance-approval-route` = R1–R9 of `1778c14b3` plus
  R10; base `d17d9d5a8`. `git status --short scripts .claude` printed nothing before the audit. Native Windows 11
  (MINGW64 Git Bash), Node v22.22.3, cwd `C:/Claude_Code_Projects/lero-al`.
- Implementer report `docs/sessions/evidence/task944/impl/completion-report.md` (section R10) and `r10-*.txt`: index only; every
  material claim below was rerun or reread in this session.

## Verdict: APPROVED

No P0–P3 finding. K1 of review 1 is closed by R10.

## R10 (revision 3)

| Check | Command / source | Observation | Result |
|---|---|---|---|
| Code diff of R10 | `git diff 1778c14b3 22c6871a3 -- scripts` | only `governance-contract.selftest.mjs`, hunk `@@ -163,7 +163,9 @@`: one added `saveJson` of `docs/sessions/evidence/gov/break.json` with exactly the R10 spec; the record `saveJson` line replaced by its extension with `method: 'in-memory'`, `break`, `breakSha256: digest(f.root, [...])`; every other record field unchanged | PASS (AC13) |
| Same from base | `git diff d17d9d5a8 22c6871a3 -- <same file>` | identical hunk; test name `the governance report passes only on every mapped case and records current hashes and sensitivity` and both assertions unchanged (context lines) | PASS |
| R2 unchanged | `git diff 1778c14b3 -- scripts/workflow-gates/contract.mjs` | 0 lines; `SENSITIVITY_LEGACY_TASKS` (contract.mjs:410-416) holds the five R2 paths only | PASS |
| R1–R9 unchanged | `git diff --stat 1778c14b3 22c6871a3` | no other `scripts/` or `.claude/` path; no `sensitivity/` file; `22c6871a3` itself changes only the test file and `impl/` evidence | PASS |
| Load-bearing fields | implementer `r10-self-audit.txt` read; consistent with R2 code (contract.mjs:419-429) | four in-memory mutants each fail test 8 with the matching R2 message | ACCEPTED (index; R2 code read) |

## AC10 and AC13 (rerun in this session)

| Command | Raw output | Result |
|---|---|---|
| `node scripts/workflow-gates/selftests.mjs` | `r2-selftests.txt` | exit 0; tests 201, pass 201, fail 0, skipped 0, `not ok` 0 |
| `node --test scripts/workflow-gates/governance-contract.selftest.mjs` | `r2-governance-contract-selftest.txt` | exit 0; tests 17, pass 17, fail 0 |
| `git diff --exit-code --quiet d17d9d5a8 -- <file>` for the 14 other base self-test files | this review's terminal | 14 × exit 0 (case-test-rebase, diff-hook, git-policy, hooks, locale-runtime, publication-safety, response-state, runner, scope-rebase, security-contract, session-role, shell-mutation, shell-write, workflow) |
| `check-workflow.mjs`; eslint; `publication.mjs --base HEAD`; `cli.mjs verify --contract <944>`; `npm run check:kickoff-evidence` | `r2-ac10-gates.txt` | all exit 0; publication 92 explicit files, 0 dependency errors |
| `git grep -n "SENSITIVITY BREAK" -- scripts` | terminal | no output, exit 1 |
| `governance-report` (AC9, AC13) | in memory: `governanceReport` + `validateGovernanceReport` (`node --input-type=module -e`), command not run because it writes a scope file (D2) | status passed, errors `[]`, 9 cases all passed; in-memory report validates `[]`; saved `governance-report.json` validates `[]`; scope and sidecar digest unchanged by the run; task digest current |

## R1–R6, R8, R9 (review 1 evidence reused)

Review 1 (`review-1/review-1.md`) checked these on `1778c14b3`; the R10 commit leaves every one of their files byte-identical
(table above), so its results stand. Sensitivity records rechecked against current files: GOV-944-SENS-RUN-DENY,
GOV-944-VAL-RECORD-DENY, GOV-944-HOOK-SYNTAX-DENY and GOV-944-HOOK-SHELL-FORMS-DENY each `method: 'in-memory'`, `break` the
case's `.break.json`, `breakSha256` current, `artifactSha256` current, baseline passed, mutant failed, `failureKind` assertion,
restored passed.

AC12 timing, reviewed in this session (review 1 left it unverified): the Task 943 approver's harness
`node docs/sessions/evidence/task943/review/r2-timing.mjs <root>` on the final hook: F8 parsed 1991 ms (2 results), parser-rejected
7641 ms (5001 results), both under 15 s. Observation outside 944: with a smaller warm-up the parsed command throws
`Maximum call stack size exceeded` after about 0.9 s on the final hook and identically on the `d17d9d5a8` hook (loaded in memory
from `git show`), so it is not caused by 944; the hook's main block catches it and refuses with `SECURITY GATE BLOCKED`
(security-hook.mjs:1197-1200, fail closed). The 2318-command corpus comparison was not rerun (implementer and design evidence only).

## Extra implementer evidence files

`impl/r10-ac10.txt`, `r10-ac13.txt`, `r10-final.txt`, `r10-self-audit.txt` are not named in section 4 but are raw outputs of the
reruns that step 4b requires, under the evidence tree, outside every contract digest, and not used as approval proof here.
No defect.

## R7 rebases and AC11

`r2-rebase-digests.txt`: for each of 935, 940, 941 and 943, `scopeDigest` with the base contents of every 944-changed file equals
the last chain digest. Entries written after this review block:

| Contract | Entry | Evidence | original → rebased |
|---|---|---|---|
| 935 | `scope` | `scope-rebase-935.md` | `57f2f78a…` → `8f70b3a1…` (case test at base) |
| 935 | `tests` | `tests-rebase-935.md` | `8f70b3a1…` → `9893459a…` |
| 940 | `scope` | `scope-rebase-940.md` | `2ca83fb4…` → `1db15707…` |
| 941 | `scope` | `scope-rebase-941.md` | `17e727cd…` → `11686da5…` |
| 943 | `scope` | `scope-rebase-943.md` | `b82dbac3…` → `b50491fa…` |

AC11 (after the entries), `node docs/sessions/evidence/task944/review/r2-ac11-harness.mjs` (base `origin/main` =
`d8a07a3c7841022207fd5331f53e5a80b4d7c7e2`, working tree) → `r2-ac11.txt`, exit 0: 935, 940, 941, 943 and 944 each selected,
`validateDiff` no error, release validation `[]`, governance report `[]`, rebase chain `[]`; `reviewedFreshnessErrors` for the
selection `[]`. The other 10 `validateDiff` errors all belong to the Task 931 contract (stage planned, revision 3 not yet
implemented; files it creates are missing), unrelated to 944. `node scripts/workflow-gates/cli.mjs verify --contract <935
contract>` → `r2-verify-935.txt`, exit 0, so the 935 `tests` entry is kept; its chain ends with that entry.

## Closure

The kickoff stays in `tasks/Sprints/`: an archive move changes `task` and `contractSha256` and would need a `governance-report`
regeneration, which writes a 944 scope file; the owner's route for this session forbids that write (D2). Task 942 starts after the
commit of this review.

## Unverified

- PR #12 CI for the commit of this review: not run yet (owner push first).
- The frozen 2318-command corpus comparison of AC12.
