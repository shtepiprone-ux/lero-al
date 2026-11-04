# Task 944 review 3 (Opus, session 343df3cf, 2026-11-04)

> **NO VERDICT ISSUED (owner D21).** The audit below is complete and found no defect, but this session cannot issue the approval:
> the Stop hook's independence check counts `scripts/workflow-gates/cli.mjs` as written (`r3-independence.txt`). The cause is this
> session's own closure commands, which joined `sed -i` with `node scripts/workflow-gates/cli.mjs` in a line the parser rejects,
> so the fallback counted every project path of the line. `cli.mjs` did not change: its blob equals HEAD. D21: the closure stays
> uncommitted in the working tree, and a fresh Opus session verifies it, writes `review-4.md` and issues the verdict
> (`handoff-review-4.md`). "Verdict" below is this session's proposal, not an approval.

Review 2's verdict was withdrawn because the Stop hook counted that session's read-only `node -e` calls as writes
(`r2-independence-diagnosis.txt`); `review-2.md` stays as that record. This review reran the work and did not reuse its verdict.

## Independence (D2)

This session is none of 3d40df28, 6f2564f3, e50584bc, c819b1d2, 8ae82d47, the first 944 implementation session or the review 2
session. It implemented nothing of 944. Every in-memory check ran as a saved script in this folder, never as `node -e`.
Its only scope-file write is the rule-mandated `cli.mjs governance-report` regeneration of `impl/governance-report.json` after the
archive move (`.claude/rules/review/04-contract-rebases.md`, AC9, AC13, the Task 943 approver's precedent): the diff of that file
changes only `task` and `contractSha256`. No code, rule, test or sensitivity file was touched (`git status --short scripts .claude`
stays empty). `r3-independence.txt`, the Stop hook's `governanceIndependenceErrors` on this session's own transcript, reports 0 errors at
131 calls and, after the closure commands, 1 error for `cli.mjs` (see the box above).
Otherwise it wrote only this folder, the 944 sidecar's `stage`, `review`, `task` and `taskSha256` fields, the `review.rebases`
entries of the 935, 940, 941 and 943 contracts, the Task 942 revision 2 set (D20), the review ledger, and the backlog, sprint and archive rows.

## Candidate and environment

- Candidate: commit `22c6871a31eaf693b16ad68c2e0f5ec290aeedea` on `task/935-governance-approval-route`, base `d17d9d5a8`;
  `git status --short scripts .claude` printed nothing before the audit and after it (`r3-fingerprint-before.txt`, `r3-fingerprint-final.txt`).
- Native Windows 11, Git Bash, Node v22.22.3, cwd `C:/Claude_Code_Projects/lero-al`.
- Implementer report `impl/completion-report.md`: index only; every claim below was rerun or reread in this session.

## Proposed verdict: APPROVED WITH NOTES (not issued, D21)

Every R1–R10 and AC1–AC13 is met. No P0–P2 finding. K1 of review 1 is closed by R10. The notes are P3, and each has a saved home.

## Requirement disposition (source and tests read in full in this session)

| R / AC | Disposition |
|---|---|
| R1 / AC1–AC3 | Met. `runSensitivity`, `tapResultBlock`, `sensitivity-register.mjs` and `sensitivity-hooks.mjs` read in full: every R1 (b) refusal; three runs with the anchored escaped name, unit environment and 5-minute timeout; `NODE_OPTIONS` only in the mutant, added after the filter; before/after digests; the R1 (f) record. No other gate module imports the two loader files (only `cli.mjs` names one, by URL). Mutants 1–8 fail their case. |
| R2 / AC4 | Met. Five exact legacy paths, all existing in `tasks/Archive/` or named for 943 before its move; `inMemoryRecordErrors` runs only for critical cases of a non-legacy task. Mutants 9–13 fail their case, one per branch. |
| R3 / AC5–AC8 | Met. `hookModuleClosure`, `hookModuleSyntaxErrors`, `hookModuleLoadFailure`, `hook-load-check.mjs` and the one call in `evaluateHook` read: before the role checks, no module evaluated, child without `NODE_OPTIONS`, every exception contained. `r3-probes.txt`: closure of 11, a swallowed function head refused for orchestrator and executor, a block comment allowed, an unwritten import and a removed export refused, relative and upper-case spellings refused, a multi-line LF `old_string` in a CRLF module found, `replace_all` computed, absent `old_string` refused, about 60 ms per closure Edit. `hook-load-check.mjs` is outside the closure, so a broken load checker refuses closure Edits but never its own repair. Mutants 14–21 fail their case; 21 fails by the rethrown error, which is the intended failure of that mutant. |
| R4 / AC10 | Met. Both sentences verbatim; `02-adversarial-ui.md` under 8 KiB (`check-workflow.mjs`). |
| R5, R9 / AC10 | Met. Six files in `publication.json`, 92 explicit files, 0 dependency errors. |
| R6 / AC9 | Met. `r3-report.txt`: canonical `governanceReport` in memory passed, 9 cases, errors `[]`; retained report validates `[]` with current digests; four records `method: 'in-memory'`, specs and artifacts current, baseline exit 0, mutant exit 1 with `ERR_ASSERTION`, restored exit 0, target and test digests unchanged. `git grep -n "SENSITIVITY BREAK" -- scripts` printed nothing, exit 1. `cli.mjs governance-report` after the archive move → `r3-governance-report.txt`, exit 0, 9 `PASS`. |
| R7 / AC11 | Met; see "R7 rebases and AC11". |
| R8 / AC12 | Met. Every AC12 form, executor form and control passes in GOV-944-HOOK-SHELL-FORMS-DENY; mutants 22–30, 32 and 33 fail it. Corpus rerun (review 1 and 2 left it unverified): `r3-probes.txt`, 2318 commands, sha256 `1eb5de48…`, dropped 0, added 2, guarded 0, executor newly refused 0, scope file 0, slowest 3 ms. Timings `r3-timing.txt`: F8 2005 ms parsed, 7579 ms parser-rejected, both under 15 s. |
| R10 / AC13 | Met. Numstat 3 added, 1 removed; the one hunk adds the break spec save and the three record fields and replaces only the `saveJson` line it extends; test name and assertions are unchanged context; `contract.mjs` unchanged since `1778c14b3`; 17/17. |
| AC10 | Met. `r3-selftests.txt`: 201 tests, 201 pass, 0 fail, 0 skipped, 0 `not ok`, 19 GOV-941/943 and 9 GOV-944 results `ok`; the 14 other base self-test files exit 0 on `git diff --exit-code`; `r3-ac10-gates.txt`: `check-workflow.mjs`, eslint, `publication.mjs --base HEAD`, `cli.mjs verify`, `check:kickoff-evidence` all exit 0. |
| Q1 | `r3-build.txt`: `npm run build` exit 0. `r3-q1-integrity.txt`: `check:mojibake` and `check:file-integrity` exit 1 on pre-existing findings, none in a file this task touched (no hit for `944`, `workflow-gates`, `task-readiness` or `02-adversarial`). |

## This review's own breaks (`r3-mutants.txt`, in memory only, live digests unchanged)

34 breaks of R1, R2, R3 and R8 beyond the four recorded ones: 31 fail the named case with `ERR_ASSERTION`, one (21) with its rethrown error, and two survive:

- 34 is an invalid break: a `load` hook cannot rewrite its own module. The real behaviour is proven by the four artifacts, whose mutants fail.
- 31 (perl script handling dropped) survives every AC12 form, because `slice(1)` drops the script when it is a separate word. The live
  branch is correct: `perl -pi -e's/a/b/' X` reports X (`r3-probes.txt`). Test gap only, note N2.

## Adversarial forms outside AC12 (`r3-adversarial.txt`, 94 forms, 12 controls)

46 forms that the base hook missed are reported; every control is quiet. 16 forms are not reported, none of them reported by the
base hook, so none is a regression and none is an AC12 form. `env -C D cat a > N` is a correct silence: the shell opens the
redirection in the current folder, not in the `env` folder. The other 15 form six groups, and an executor can run them unrefused
(`r3-probes.txt`); CI's policy-diff check stays the outer layer. See N1.

## Notes (P3, each with its home)

- **N1. Six groups of write forms outside the AC12 list:** a command in backticks; `perl -0pi` and `-0777pi`; a nested shell or interpreter under
  `env -C`; `npm exec`, `pnpm exec`, `pnpm dlx`, `yarn rimraf`; `open(file=…)` and `os.removedirs`; `[IO.File]::Open`. Owner decision D20
  (2026-11-04, "Approve, the forms into 942 (Recommended)"): written as R4, R5, AC6 and AC7 of
  `tasks/Sprints/Sprint_92_kickoff_prompt_Task_942_Listing_Visibility_Allowlist_Current.md` (revision 2). Feasibility: `task942/design/p07-shell-forms-run.txt`, `FAILURES 0`.
- **N2. The attached-script branch of R8 (d) has no test:** the same kickoff, AC6.

Observation, no action: in a cold process the parsed 5000-folder-change command overflows the stack in `canonicalPath`, on this hook and on the
`d17d9d5a8` hook alike; the hook fails closed with `SECURITY GATE BLOCKED`. AC12 is measured after the warm-up that 943 and p14 used.

## R7 rebases and AC11

`r3-rebase-digests.txt`: for each of 935, 940, 941 and 943, `scopeDigest` with the base bytes of every 944-changed file equals the last
chain digest. Entries written after this review block:

| Contract | Entry | Evidence | original → rebased |
|---|---|---|---|
| 935 | `scope` | `scope-rebase-935.md` | `57f2f78a…` → `8f70b3a1…` (case test at base) |
| 935 | `tests` | `tests-rebase-935.md` | `8f70b3a1…` → `9893459a…` |
| 940 | `scope` | `scope-rebase-940.md` | `2ca83fb4…` → `1db15707…` |
| 941 | `scope` | `scope-rebase-941.md` | `17e727cd…` → `11686da5…` |
| 943 | `scope` | `scope-rebase-943.md` | `b82dbac3…` → `b50491fa…` |

AC11, after the entries: `r3-ac11-harness.mjs` (base `origin/main` = `d8a07a3c7841022207fd5331f53e5a80b4d7c7e2`, working tree) →
`r3-ac11.txt`, exit 0: 935, 940, 941, 943 and 944 each selected, `validateDiff` no error, release validation `[]`, governance report `[]`,
rebase chain `[]`; `reviewedFreshnessErrors` for the selection `[]`. `cli.mjs verify --contract <935 contract>` → `r3-verify-935.txt`, exit 0,
so the 935 `tests` entry is kept; its chain ends with that entry. The other 20 `validateDiff` errors belong to the planned 931 contract
(10) and the planned 942 contract (10, selected since revision 2 scopes the hook): stage planned and files they create are missing, as
expected before those tasks are implemented, and both are reviewed before PR #12 merges (D7).

## Closure

The kickoff and sidecar moved to `tasks/Archive/` (mandatory, `docs/orchestrator-procedures.md`, approved-review closure). The path is
part of the task digest, so `taskSha256` changed from `bcaf51ca…` to `73dd0fd4…` and the report was regenerated. The first regeneration ran
before that digest was rebound and wrote a failed report (`Task hash is stale`); the second, on the rebound sidecar, passed and is the retained one.
The rebase entries' `by` fields and evidence files name the archived contract. Review 1 and 2 had read D2 as forbidding that regeneration;
the rule that names it and AC9 and AC13 require it. Review ledger: `docs/reviews/2026-11-04-task944-sensitivity-breaks-only-in-memory.review-ledger.json`.

## Unverified

- PR #12 CI for the commit of this review: not run yet (owner push first).
