# Task 943 — governance review 2, WITHDRAWN DRAFT (Opus session 6f2564f3, 2026-11-03)

**Status: draft, verdict withdrawn (owner decision D19, 2026-11-03: "Withdraw, as in 940").** This session found no blocking
defect and proposed `APPROVED WITH NOTES`, but the Stop hook would refuse that verdict: `governanceIndependenceErrors` on this
session's transcript reports `cli.mjs`, `security-hook.mjs` and `contract.mjs` as written (`r2-independence-self-check.mjs`).
All eleven hits are the pre-existing C2 write-word rule (a write word anywhere in a command text, even `writeFileSync` inside a
`grep` pattern or `Out-File` of a probe's own output, makes every mentioned project path a target); no Write or Edit call touched a
scope file and every 943 code and rule scope file is identical to HEAD (`r2-independence-diagnose.txt`). As in the Task 940
precedent (`docs/sessions/evidence/task940/review/review-940.md`, "History of this review"), this session withdrew everything that
recorded the approval: the review block and `reviewed` stage, the archive move, the R6 entries, the 931/937 locator moves, the
backlog and archive rows and the review ledger were restored from HEAD. **A further fresh Opus session approves 943**: it reruns
the checks below itself, reuses these drafts only after rerunning them, and avoids write words in any shell command that names a
scope file (use the Read and Grep tools and script files under `test-results/`). The R6 evidence drafts (`scope-rebase-935.md`,
`scope-rebase-940.md`, `scope-rebase-941.md`, `tests-rebase-941.md`, `rules-rebase-923-owner-fixes.md`, `rules-rebase-927.md`)
and `r2-write-rebases.mjs`, `r2-closure.mjs`, `r2-ac7-harness.mjs` are prepared for that session; their hashes and digests must be
recomputed when it writes the entries.

Kept from this session (owner D18): Task 944 revision 1 (R8, R9, AC12) for the shell write forms of note N1; this session may
neither implement nor approve 944.

## Independence (as observed, not accepted by the hook)

This session (`6f2564f3`) is a fresh Opus session started with `/clear`. It designed none of the kickoff or revisions 1–4,
implemented none of 943 and is none of the sessions excluded by route step 3. It read scope files with the Read and Grep tools
and shell commands, and reproduced the sensitivity break only on a copy under `test-results/`. Its only scope-file write was the
rule-mandated `cli.mjs governance-report` regeneration of `docs/sessions/evidence/task943/impl/governance-report.json` after the
archive move (`r2-govreport-archived.txt`, only `task` and `contractSha256` changed), since restored from HEAD.

## Candidate and environment

- Candidate: commit `04545b0ea58577a6c23ff0b6bd3ba56277637236` (revision 4) on `task/935-governance-approval-route`, on the revision 3
  implementation `8899d9c42` and the revision 4 kickoff `8332807fe`; the task paths were clean before this review's writes.
- Hook sha256 `f7413e0e38b07c485c4a640af250fe3b5ed7f967fc8b9c5f918059d7edca17bf`; `shell-mutation.selftest.mjs`
  `8dc8403f018894c91102f084b55bd12dadef95305e80f80724f7130708615516`; `shell-write.selftest.mjs`
  `9c3426845be9d5eaf8bb8dfeb8d0a1e0a0617210559949693a774f2015e7a42b`.
- Native Windows 11, Windows PowerShell 5.1, Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`.
- Prior review: `review-943-r1.md` (NEEDS REVISION; K1, F-cwd, nested programs, quoted options, sub-review F1–F8).

## Runs (this session)

| Check | Artifact | Result |
|---|---|---|
| `node scripts/workflow-gates/selftests.mjs` | `r2-selftests.txt` | exit 0; 192 tests, 192 pass, 0 fail, 0 skipped (178 after 941 + 14); 14 GOV-943 and 5 GOV-941 cases `ok`; platform line `trailing-dots, msys, device-prefixes, junction, admin-share, short-names` |
| canonical `governanceReport` in memory (no write) against the retained report | `r2-govreport.txt` | 14 PASS; equal to the retained report; `validateGovernanceReport` `[]`; `cli.mjs verify` exit 0 at stage implemented |
| `publication.mjs --base HEAD`, `check-workflow.mjs`, eslint on `scripts/workflow-gates`, `npm run check:kickoff-evidence` | console | 86 files, 0 dependency errors; exit 0; exit 0; PASS |
| `npm run build` (Q1) | `r2-build.txt` | exit 0 |
| sensitivity: the seven artifacts | `docs/sessions/evidence/task943/sensitivity/` | baseline and restored carry the final hook sha256; every mutant fails with `AssertionError`/`ERR_ASSERTION`; digests equal `sensitivity.json` |
| sensitivity reproduced (NESTED-DENY, R13 (b) dropped) on a copy | `r2-sens-nested.txt`, `r2-sens.mjs` | baseline pass, mutant `AssertionError` (`bash -c 'cp …': []`), restored pass; live hook sha256 unchanged |
| AC14/AC16 probes on the final hook | `r2-adv-final.txt`, `r2-audit2-final.txt` | `r1-adv-probe`: 13/13 `REPORTED`; `r1-audit2-probe`: lines 1–31 `REFUSED`, 32–44 `ALLOWED` |
| AC15 timings on the real root | `r2-timing.txt` | F5 221 ms and 1527 ms (< 5 s); F8 2636 ms parsed, 10533 ms parser-rejected (< 15 s) |
| adversarial forms outside the self-tests | `r2-adv.txt`, `r2-adv2.txt`, `r2-adv3.txt` | most forms reported, read controls silent; the misses are the notes below |

## Requirement disposition (source and tests read in this session)

| R / AC | Disposition |
|---|---|
| R1 / AC1, AC5 | Met. The `shell-write.selftest.mjs` diff adds only `K1` and `expectedTargets` and changes the expected value of the two equality loops; no command, case ID or test name changes; `diff-hook`, `governance-contract`, `scope-rebase`, `session-role` and `case-test-rebase` are unchanged since `b85f5a66b`. |
| R2, R3 / AC2–AC5 | Met (revision 3 code re-read where revision 4 touched it: `programTargets` split into `programIndex`, piped and R15 branches). |
| R4, R12 (d) / AC3, AC13 | Met. Consumers still call `shellWriteTargets`; the guard resolves a Write/Edit path at the root and in the event `cwd` and refuses when either leaves the root; tested for Write, Edit and an outside `cwd`. |
| R5, R10 / AC6, AC11 | Met. Nine cases in `shell-mutation.selftest.mjs`, five in `case-test-rebase.selftest.mjs`, both in `publication.json`. |
| R7–R9, R11 / AC8–AC10, AC12 | Unchanged since review 1 (`contract.mjs`, `cli.mjs`, rule files byte-identical to `8899d9c42`); cases pass. |
| R13 / AC14 | Met. Runners, evaluators, nested shells, `Start-Process`, piped cmdlets, lenient reading and child-process strings; every AC14 form and control in GOV-943-HOOK-NESTED-DENY. |
| R14 / AC15 | Met. `cd /d`, one scope-key set per call, `API_QUALIFIER`, `seenFolders`; timings above. |
| R15 / AC16 | Met. `OTHER_WRITERS`/`otherWriterTargets`; not R1 fallback words; AC16 forms in PROGRAM-DENY, NESTED-DENY and SOURCE-ALLOW. |
| R6 / AC7 | Executed in this session, then withdrawn (D19); outcome for the next approver to reproduce (`r2-write-rebases.mjs`, `r2-write-rebases.txt`): `scope` entries by the archived 943 contract on 935 (six files), 940 (five files) and 941 (two files), a `tests` entry on 941 (`shell-write.selftest.mjs`), `rules` entries by the 935 contract on the 923 owner-fixes and 927 contracts; every chain `[]`. Anchors and census: `r2-closure-output.txt`. `cli.mjs verify` of 941 exit 0; of 923 owner-fixes exit 0 with the development identity; of 927 exit 1 on the first run (2 of 86 unit tests of `googlePopup.test.ts`, the known turn-budget failure under a busy thread pool, C40/C41, owned by Task 931 revision 3; the file passes 8/8 alone) and exit 0 on the second run, 86/86. AC7 harness: `r2-ac7-output.txt`. |
| Previous findings | K1, F-cwd, nested programs, quoted options and F1–F8 are closed by the cases named in the completion report, each checked in the test source. |
| Q1 | Typecheck N/A (no TypeScript changed); build exit 0; no file of this task in the mojibake/file-integrity findings (pre-existing Task 923 files); governance-scan gate N/A (`scripts/governance/` scans `src/` only). |

## Notes (P3)

- **N1 — shell write forms still missed, pre-existing before 943 and outside its saved contract.** Shell keywords (`if …; then rm X;
  fi`, `for …; do …; done`; an executor `if true; then rm package.json; fi` is allowed), clustered nested-shell flags (`bash -lc`,
  `-ec`, `sh -xc`, `bash -c --`), `open(…, 'w')`/`openSync(…, 'w')`, `[IO.File]::Create`/`OpenWrite`, `pathlib` `unlink`/`touch`/
  `rename`, directory-deleting APIs (`shutil.rmtree`, `rmSync(…, { recursive })`, `[IO.Directory]::Delete`), `xcopy`, `robocopy`,
  `rimraf`, `shx`, `perl -i`, `env -C`, and (R13 (e) implementation detail) an unquoted glob of a parser-rejected command left
  unexpanded when the same text is quoted elsewhere. Owner decision D18 (2026-11-03): approve 943 and write them into Task 944.
  Destination: `tasks/Sprints/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.md` revision 1, R8, R9, AC12,
  case GOV-944-HOOK-SHELL-FORMS-DENY; feasibility `docs/sessions/evidence/task944/design/p14-shell-forms-run.txt` (`FAILURES 0`).
- **N2 — F8 margin.** The parser-rejected 5000-folder-change command took 10533 ms here (8003 ms in the implementer's run) of the
  15 s hook timeout. Destination: Task 944 AC12 keeps the bound after R8.
- **N3 — flaky `googlePopup.test.ts` under load** affects the 927 `verify` of AC7 (first run red, second green); already Task 931
  revision 3 scope (C40, C41); no new destination needed.

## Closure (withdrawn, D19)

Executed and then withdrawn in this session: the archive move with the task path, hash, stage and review block, the report
regeneration, the R6 entries (every chain `[]`), the AC7 harness (`r2-ac7-output.txt`: no error for the six contracts,
`reviewedFreshnessErrors` `[]`), the 931/937 locator moves, the backlog, plan and archive rows and the review ledger
(`check:review-ledger` PASSED). All of them were restored from HEAD; the next approver redoes them in its own session, in this
order: archive move and task hash; stage `reviewed`; `cli.mjs governance-report`; R6 entries; review block; AC7 harness;
locators of 931 C28/C29 and 937 C37 and their sidecar hashes; the Sprint 92 plan sidecar hash; GR-5 rows; review ledger. Kept:
Task 944 revision 1 (`docs/sessions/evidence/task944/design/readiness.md` "Revision 1") and the backlog and plan mentions of it.
