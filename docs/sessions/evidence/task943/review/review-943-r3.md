# Task 943 — governance review 3, APPROVED WITH NOTES (Opus session e50584bc, 2026-11-03)

**Decision: `APPROVED WITH NOTES`.** Every R1–R15 and AC1–AC16 is met on the candidate; no P0–P2 finding. Notes N1–N4 are P3,
each with a saved destination (below).

## Independence (D2)

This session (`e50584bc-9bf8-4a25-a2eb-491f49ff87a4`) is a fresh Opus session started with `/clear` after the implementer
session `9466dccd`. It designed none of the 943 kickoff or revisions 1–4 and none of the 944 kickoff or revision 1, implemented
nothing of 943, and is none of `9466dccd`, `1450b70d`, `688f8e95`, `6f2564f3`. It read every 943 scope file with the Read and
Grep tools or `git diff`/`git show`; no shell command wrote into a gate or rule path, but two commands joined a `2>/dev/null` or
`>/dev/null` redirection with a gate path in one command line (redirection target `/dev/null`, not a scope file); probes, harnesses and the sensitivity breaks ran as script files under `test-results/943-r3/` (breaks only on a copy).
Its only scope-file write is the rule-mandated `cli.mjs governance-report` regeneration of
`docs/sessions/evidence/task943/impl/governance-report.json` after the archive move (only `task` and `contractSha256` changed).
`test-results/943-r3/independence-self-check.mjs` (the Stop hook's `governanceIndependenceErrors` on this session's own
transcript) reported 0 errors early (35 calls, active path), after the archive move (166 calls) and before the verdict (see
"Final checks"); every 943 code and rule scope file is identical to HEAD.

## Candidate and environment

- Candidate: commit `04545b0ea58577a6c23ff0b6bd3ba56277637236` (revision 4) on `task/935-governance-approval-route`, on the
  revision 3 implementation `8899d9c42` and the revision 4 kickoff `8332807fe`; HEAD `39ec2660f` changes no 943 scope file.
  `git diff --stat 8332807fe 04545b0ea` touches only scope files and the sidecar stage/implementation fields.
- Hook sha256 `f7413e0e38b07c485c4a640af250fe3b5ed7f967fc8b9c5f918059d7edca17bf`.
- Native Windows 11 (10.0.26300), Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`; every artifact below records its exact
  command and exit code (`test-results/943-r3/run.mjs`). `test-results/` is gitignored, so byte copies of the eleven scripts of
  this review are kept in `docs/sessions/evidence/task943/review/r3-scripts/` (their relative imports resolve from
  `test-results/943-r3/`, where they ran).

## Runs (this session)

| Check | Artifact | Result |
|---|---|---|
| `node scripts/workflow-gates/selftests.mjs` | `r3-selftests.txt` | exit 0; 192 tests, 192 pass, 0 fail, 0 skipped; 14 GOV-943 and 5 GOV-941 cases `ok`; platform line `trailing-dots, msys, device-prefixes, junction, admin-share, short-names` |
| canonical `governanceReport` in memory against the retained report (`r2-govreport.mjs`) | `r3-govreport.txt` | 14 PASS; equal to the retained report; `validateGovernanceReport` `[]`; `validateContract` verify `[]`; task digest equal |
| `cli.mjs verify` / `publication.mjs --base HEAD` / `check-workflow.mjs` / eslint / `check:kickoff-evidence` | `r3-verify943.txt`, `r3-publication.txt`, `r3-check-workflow.txt`, `r3-eslint.txt`, `r3-kickoff-evidence.txt` | exit 0; 86 files, 0 dependency errors; exit 0; exit 0; PASS |
| `npm run build` (Q1) | `r3-build.txt` | exit 0, compiled successfully |
| `npm run check:mojibake`, `npm run check:file-integrity` (Q1) | console | findings only in pre-existing Task 923/927 files; no file of this task |
| sensitivity on a copy (`test-results/943-r3/sens.mjs`) | `r3-sens.txt` | baseline 9/9; three kickoff breaks (R13 (b) → NESTED-DENY, `tee` → PROGRAM-DENY, `Copy-Item` → PRETOOL-DENY and also PROGRAM, DIRECTORY, MALFORMED and NESTED) and six breaks chosen by this review (R13 (f) child-process strings, R15 `prettier`, R12 (d) Write/Edit `cwd`, R14 (c) unqualified API names, R13 (d) pipeline, R13 (e) lenient reading) each fail a named case with `ERR_ASSERTION`; restored 9/9; copy equals the live hook sha256 |
| the four remaining kickoff breaks on a copy and the retained artifacts (`test-results/943-r3/sens2.mjs`, self-audit) | `r3-sens2.txt` | `[<id>]` check skipped → TESTS-REBASE-DENY (`case ID removed from the test file`), tracked check dropped → EXEMPT-UNTRACKED-DENY, contracts outside `selected` skipped → CI-STALE-REVIEW-DENY, R12 (c) parsed folder change dropped → TARGET-SPELLING-DENY (`cd D; cat Y > hook.mjs: ["hook.mjs"]`), each `ERR_ASSERTION`, baseline and restored pass, restored copy equals the live file; all seven retained artifacts equal their `sensitivity.json` digests |
| AC2, AC3, AC13 design probes on the final hook (`test-results/943-r3/probes.mjs`, self-audit; p01/p02 as copies, design folder unchanged) | `r3-probes.txt` | p01 lines 2–21 report X; p02 lines 2–5 refused; p09 lines 4, 10–13, 19, 20, 22, 23, 29, 30, 32–36 and p11 lines 3–14 real file or refusal; p14 lines 9–18 non-empty, controls 19–21 `[]`, `[]`, `["out.txt"]` |
| AC14/AC16 probes on the final hook | `r3-adv.txt`, `r3-audit2.txt` | `r1-adv-probe`: 13/13 `REPORTED`; `r1-audit2-probe`: lines 1–31 `REFUSED`, 32–44 `ALLOWED` |
| AC15 timings on the real root | `r3-timing.txt` | F5 165 ms and 1186 ms (< 5 s); F8 2130 ms parsed, 7770 ms parser-rejected (< 15 s) |
| adversarial forms chosen by this review (`test-results/943-r3/adversarial.mjs`) | `r3-adversarial.txt` | 48 write forms: 47 report X with an executor refusal; 19 read controls silent; the miss is note N4 |
| R6 anchors and freshness census (`r2-closure.mjs`) | `r3-closure.txt` | 935, 940, 941: digest with the listed files at `b85f5a66b` `EQUALS RECORDED`; 941 intermediate `28fede2a…`; 923 owner-fixes and 927 `MATCH true` with `origin/main` rule bytes; before R6 the 14 freshness errors are exactly those of these five contracts |

## Requirement disposition (source and tests read in this session)

| R / AC | Disposition |
|---|---|
| R1 / AC1, AC5 | Met. `git diff 8332807fe 04545b0ea -- scripts/workflow-gates/shell-write.selftest.mjs` adds only `K1` and `expectedTargets` and switches the two equality loops; no command, case ID or test name changes; `diff-hook`, `governance-contract`, `scope-rebase`, `session-role`, `case-test-rebase`, `contract.mjs`, `cli.mjs` and the rule files are unchanged since revision 3. |
| R2, R3 / AC2–AC5 | Met; the program table and API words read in `programTargets`, `otherWriterTargets` and `apiArguments`; PROGRAM/DIRECTORY/API/MALFORMED cases pass and their breaks fail. |
| R4, R12 (d) / AC3, AC13 | Met. Both consumers still call `shellWriteTargets`; the guard resolves a Write/Edit path at the root and in the event `cwd` and refuses when either leaves the root (break fails TARGET-SPELLING-DENY). |
| R5, R10 / AC6, AC11 | Met. Nine cases in `shell-mutation.selftest.mjs`, five in `case-test-rebase.selftest.mjs`, both listed in `publication.json`; 192 = 178 + 14, 0 skipped. |
| R7–R9, R11 / AC8–AC10, AC12 | Met; code unchanged since revision 3 and read in the self-audit (`git diff b85f5a66b 8899d9c42` of `contract.mjs` and `cli.mjs`): `testsEntryErrors` gives one error for each section 5b defect (empty list, not a case test, runtime file, missing `[<id>]`, missing Case assertions line, `by` itself, unreadable, not reviewed product/governance, not scoping the file, evidence via `rebaseEvidence`), `diffRebaseErrors` reads `tests` lists, `reviewedFreshnessErrors` follows R11 including the same-name reviewed replacement, and the R8 `git cat-file -e` check runs without a shell; all four breaks fail their case (`r3-sens2.txt`); R9 (a)–(c) texts present in `03-decision-closure.md` and R9 (c) in C7 of `03-publication.md`; rule sizes pass `check-workflow.mjs`. |
| R13 / AC14 | Met: runners, evaluators, nested shells, `Start-Process`, the pipeline rule, the lenient reading and child-process strings; each has a failing break. |
| R14 / AC15 | Met: `cd /d`, the once-per-call scope-key set, `API_QUALIFIER`, `seenFolders`; timings above. |
| R15 / AC16 | Met: `OTHER_WRITERS`/`otherWriterTargets`, not R1 fallback words; read forms silent. |
| R6 / AC7 | Executed by this session; see "R6 and AC7". |
| Implementer decisions 1–5 | Accepted: (1) the wrapper skip shared by `programIndex` follows the section 5 definition of the program word; (2), (3) structure and K1 form within AC1; (4), (5) the fail-closed reading of command text that R13 (f) prescribes (as C119 for `>`). |
| Previous findings | K1, F-cwd, nested programs, quoted options and F1–F8 closed by the cases named in the completion report, checked in the test source and by the breaks above. |
| Q1 | Typecheck N/A (no TypeScript changed); build exit 0; encoding checks clean for this task; governance scan N/A (`scripts/governance/` scans `src/` only). |

## R6 and AC7

Entries written by `test-results/943-r3/write-rebases.mjs` with the evidence files of this session (`scope-rebase-935.md`,
`scope-rebase-940.md`, `scope-rebase-941.md`, `tests-rebase-941.md`, `rules-rebase-923-owner-fixes.md`, `rules-rebase-927.md`):
`scope` by the archived 943 contract on 935 (six files, `cfb7e1f2…` → `57f2f78a…`), 940 (five files, `1c437930…` → `2ca83fb4…`)
and 941 (two files, `3cf59b32…` → `28fede2a…`), `tests` on 941 (`28fede2a…` → `17e727cd…`), `rules` by the 935 contract on the
923 owner-fixes (`86039ff1…` → `f3d1b17a…`) and 927 (`3c78d47c…` → `6ee714db…`) contracts; every `rebaseChainErrors` `[]`.
`cli.mjs verify` (`test-results/943-r3/verify-dev.mjs`, development identity from the `.env.local` Supabase URL, values not
printed, as in the Task 923 real-boundary runs): 941 exit 0 (`r3-verify-941.txt`); 923 owner-fixes exit 0, unit 1142/1142,
external 6/6 (`r3-verify-923-owner-fixes.txt`); 927 run 1 exit 1, unit 84/86 with `[SEC-927-FE-POPUP-DENY-ORIGIN]` and
`[SEC-927-FE-POPUP-DENY-STATE]` of `googlePopup.test.ts` failing (`expected false to be true`, the known turn budget, note N3),
external 4/4 (`r3-verify-927-run1.txt`); run 2 exit 0, unit 86/86, external 4/4 (`r3-verify-927-run2.txt`). AC7 harness:
`r3-ac7.txt` (see "Final checks").

## Notes (P3, each with a destination)

- **N1 — shell write forms missed before 943 and outside its contract** (shell keywords, clustered `-lc`/`-ec`, `open(…,'w')`,
  .NET create, `pathlib`, directory deletes, `xcopy`, `robocopy`, `rimraf`, `shx`, `perl -i`, `env -C`, the quoted-twin glob):
  owner D18; destination `tasks/Sprints/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.md` revision 1, R8,
  R9, AC12 (checked present in this session).
- **N2 — F8 margin** (7770 ms here of the 15 s hook timeout): destination the same kickoff, AC12 keeps the bound after R8.
- **N3 — flaky `googlePopup.test.ts` under load** (927 `verify` run 1 red, run 2 green): Task 931 revision 3
  (`tasks/Sprints/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.md`, its C1 and route).
- **N4 — `require('fs').promises.<name>(…)`** (found by this review, `r3-adversarial.txt`): the R14 (c) qualifier lists
  `fs.promises.` and `).` but not `).promises.`, so `node -e "require('fs').promises.rm('X')"` reports nothing and its executor form
  is allowed; not a form the saved 943 contract requires (section 4, listed-form limit). Destination: Task 944 **revision 2**
  written and verified by this session under D18 and D14: R8 (f), AC12 forms and controls, C71, C72
  (`docs/sessions/evidence/task944/design/p15-promises-qualifier-run.txt`, `FAILURES 0`; 944 `cli.mjs plan` exit 0,
  `check-kickoff-evidence` PASS; `docs/sessions/evidence/task944/design/readiness.md` "Revision 2").

## Closure

Archive move of the kickoff and sidecar unchanged (sha256 equal before and after), `task` and `taskSha256`
(`7a4ab9f4…`); stage `reviewed`; `cli.mjs governance-report`; R6 entries; review block; AC7; locators of 931 C28/C29 and 937 C37
and their sidecar hashes; the Sprint 92 plan row and sidecar hash; GR-5 backlog and archive rows; review ledger. Results:
"Final checks".

## Final checks

- Archived sidecar: `test-results/943-r3/review-hashes.mjs` (`r3-review-hashes.txt`): task digest equal, `validateContract`
  release `[]`, `validateGovernanceReport` `[]`; review `scopeSha256` `b82dbac3…` (unchanged by the report regeneration),
  `reportSha256` `a385b3d8…`; this file's digest is recomputed into `review.evidenceSha256` after its last edit.
- AC7 harness (`r3-ac7.txt`, base `origin/main` `d8a07a3c…`, working tree): 927, 935, 940, 941, 943 and 923 owner-fixes selected,
  `validateDiff` no error, release `[]`, governance report `[]`; `reviewedFreshnessErrors` for the selection `[]`. The other
  `validateDiff` errors (24) belong only to the open Task 931 and 944 contracts (not implemented yet), as does every error of
  `cli.mjs diff --phase release --base d8a07a3c… --working-tree` (`r3-diff-release.txt`, exit 1); PR #12 merges only after those
  tasks and green required checks.
- Locators: 931 C28/C29 and 937 C37 point at `tasks/Archive/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.md`
  lines 352 and 405 (unchanged content); 931, 937, 944 and Sprint 92 plan sidecars `validateContract` plan `[]`;
  `check-kickoff-evidence --files` for 931, 937 and 944 PASS.
- GR-5: Sprint 92 plan rows 943 and 944, `docs/backlog.md` Sprint 92 entry (943 out of the "filed and ready" list),
  `docs/backlog-archive.md` top row; `npm run check:backlog-active` PASSED; review ledger
  `docs/reviews/2026-11-03-task943-file-mutating-commands-are-writes.review-ledger.json` `check:review-ledger` PASSED.
- Independence self-check before the verdict: 0 errors on 310 tool calls, every 943 code and rule scope file identical to HEAD;
  rerun after the self-audit below (0 errors required before the final handoff).

## Self-audit (owner request, same session, 2026-11-03)

The owner asked this session to check the quality of its own work. Found and corrected:
- **Missing independent proof.** The first pass reproduced 3 of the 7 kickoff sensitivity breaks, did not check the retained
  artifacts and did not rerun the AC2, AC3 and AC13 design probes, and judged R7, R8 and R11 from the tests only. Now done
  (`r3-sens2.txt`, `r3-probes.txt`, the R7–R11 row above); no new finding.
- **Inaccurate ledger locators.** Four `diffHunks` ranges ran past their function (`contract.mjs:180-210`, `cli.mjs:152-180`,
  `security-hook.mjs:602-640`), one pointed at the wrong lines of the 941 contract (`113-131`, the `rebases` array is 129–146) and the
  Q1 row cited `security-hook.mjs:1-30`, unrelated to the change; corrected to verified ranges.
- **Rules read late.** `shared/claim-evidence-contract.md`, `security-testing.md`, `task-readiness.md` and
  `orchestration-state.md` were read only in the self-audit, after the Task 944 revision 2 and the closure; rechecked against
  them: the 944 revision edited its `ready` sidecar without first setting `draft` (recorded in
  `docs/sessions/evidence/task944/design/readiness.md`, with the final planDigest); the 943 sensitivity record keeps its
  original `task` path, as for 940 and 941 (raw evidence is preserved after a move).
- **Two command lines** joined `/dev/null` redirections with a gate path (stated under Independence); harmless to the scope.
