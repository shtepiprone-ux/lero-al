# Task 944 review 1 (Opus, session c819b1d2, 2026-11-03)

Independent review under D2: this session designed, implemented and reviewed none of the earlier 943 or 944 work and wrote no
file of the 944 contract scope. It wrote only this folder, the revision 3 kickoff text, the sidecar's `executionStatus`,
`taskSha256` and one scope entry, and the backlog row.

- Candidate: commit `1778c14b371cfa93f74489a181776ea9643108f9` on `task/935-governance-approval-route` (base `d17d9d5a8`);
  `git status --short scripts .claude` printed nothing; Node v22.22.3, native Windows 11, Git Bash, cwd
  `C:/Claude_Code_Projects/lero-al`.
- Implementer report: `docs/sessions/evidence/task944/impl/completion-report.md` (PARTIALLY IMPLEMENTED, K1), used as an index only.

## Verdict: NEEDS REVISION (task design, K1); next route ready (revision 3)

## Finding

- **K1, P1, task design (R2 against section 4, section 5 and AC10).** `scripts/workflow-gates/governance-contract.selftest.mjs:162-169`
  (snapshot `sources/scripts__workflow-gates__governance-contract.selftest.mjs.txt`) saves a hand-written critical record without
  `method`, `break` or `breakSha256` for the non-legacy fixture task `tasks/gov_kickoff.md` and expects a passing report. R2 as
  written refuses that record. Independent run: `r1-selftests.txt`, `selftests.mjs` exit 1, 201 tests, 200 pass, 1 fail
  (`not ok 56`, message `GOV-T-HOOK-DENY: sensitivity must come from cli.mjs sensitivity (method is not in-memory)`). Impact: the
  governance PR job runs `selftests.mjs` (`.github/workflows/governance-pr.yml:78`), so PR #12 would stay red; the 935 contract's
  case test file fails as a process. Not an implementation defect: R2 and "every existing self-test file unchanged" cannot both
  hold. Correction: kickoff revision 3, R10 (in-memory fields for that one fixture record) and a 935 `tests` rebase by the
  approver (R7, D12). Verification: `r1-k1-probe.txt`, the exact R10 replacement applied in memory through
  `sensitivity-register.mjs`: 17 of 17 tests pass, live file digest unchanged.

## Checks of the candidate (R1-R6, R8, R9 kept)

| Step | Command / source | Observation | Result |
|---|---|---|---|
| R1 runner | `cli.mjs` diff, `sensitivity-register.mjs`, `sensitivity-hooks.mjs` read in full | every R1 (b) refusal present; three runs with anchored escaped name, unit env, 5 min timeout; NODE_OPTIONS only in mutant; before/after digests; record fields of R1 (f) | PASS (ANALYTICAL) |
| R2 check | `contract.mjs` diff | exact legacy task paths; method, evidence path, current breakSha256, spec case | PASS; K1 is design |
| R3 guard | `security-hook.mjs` diff, `hook-load-check.mjs` | closure from settings and ps1 plus relative imports; CRLF normalization; link without evaluation; fail-closed catch; one call in `evaluateHook` before role checks | PASS (ANALYTICAL) |
| R3 probes | scratch script, real repo, no write | closure 11; unparseable Write of `session-role.mjs`, relative-path and upper-case-path Edits refused; valid `replace_all` Edit allowed; digests unchanged | PASS (EXECUTED) |
| R4 rules | `.claude/rules` diff | both sentences verbatim | PASS |
| R5/R9 | `publication.json` diff | six new files listed | PASS |
| R6/AC9 | in-memory `governanceReport` + `validateGovernanceReport`; record digests; `git grep -n "SENSITIVITY BREAK" -- scripts` | report passed, 9 cases, errors []; saved report validates []; four records in-memory with current break and artifact digests; grep exit 1 | PASS (EXECUTED; `governance-report` command not run because it writes a scope file, D2) |
| Sensitivity artifacts | four `.txt` artifacts and specs | baseline exit 0 ok; mutant exit 1 not ok with `code: 'ERR_ASSERTION'`; restored exit 0 ok | PASS |
| R8 | `security-hook.mjs` diff; GOV-944-HOOK-SHELL-FORMS-DENY in the self-test run | keyword skip, clustered flags, open/create/pathlib/directory APIs, xcopy/robocopy/rimraf/perl, lenient literal rule, `).promises.` qualifier; case ok | PASS |
| AC10 | `selftests.mjs`; `cli.mjs verify`; `check-workflow.mjs`; eslint; `publication.mjs --base HEAD`; `check:kickoff-evidence` | 1 fail (K1); verify 0; check-workflow 0; eslint 0; 92 files 0 dependency errors; PASS | FAIL only through K1 |
| Legacy contracts | `validateGovernanceReport` of 935, 940, 941, 943 | only scope-hash staleness pending the approver's R7 rebases | expected before R7 |

## Unverified

- The frozen 2318-command corpus comparison and the 5000-folder-change timings of AC12 were not rerun (implementer evidence only).
- AC11 belongs to the approver after R10.
- CI on PR #12 for this candidate: not checked; K1 makes the governance job red by construction.

## Readiness of revision 3

| Step | Source / command | Observation | Result |
|---|---|---|---|
| Manifest | `r1-k1-owners.txt`; grep of contracts, `publication.json`, workflows | only the 935 contract maps cases to the file; `publication.json` lists it unchanged; not in the hook closure | PASS |
| Write authority | `isPolicyPath` | the file is a policy path; Opus implementer only (D1) | PASS |
| Proof | `r1-k1-probe.txt` | 17/17 with the exact replacement, live file unchanged | PASS (EXECUTED) |
| Kickoff evidence | `npm run check:kickoff-evidence -- <kickoff>` | PASS, exit 0 | PASS |
| Contract | in-memory `validateContract(... executionStatus 'ready', phase 'plan')`; then `node scripts/workflow-gates/cli.mjs plan --contract <sidecar>` on the saved ready sidecar | [] in memory; saved sidecar exit 0; `taskSha256` equals `digest(root, [kickoff])` = `bcaf51ca1faa4a2cb34ecd72c09a4e9d435fe12a25c15648a3f871006a858f5d` | PASS (EXECUTED) |
| Rebase route | `scopeEntryErrors` and `testsEntryErrors` in `contract.mjs` (lines 160-205) against R7 | a `scope` entry may not list a case test file, so the 935 `scope` entry keeps its four files and the changed self-test goes only into the 935 `tests` entry; that file maps exactly the 13 cases of `r1-k1-owners.txt`, none of them the R10 test; 944's scope lists the file, as `testsEntryErrors` requires of the `by` contract | PASS (ANALYTICAL) |
