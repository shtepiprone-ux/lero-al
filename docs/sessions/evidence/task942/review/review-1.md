# Task 942 — independent review 1 of commit `5cd44cb97`

Opus reviewer, 2026-11-04, a fresh session that wrote no scope file (D2). Native Windows 11, Node v22.22.3, cwd
`C:/Claude_Code_Projects/lero-al`, branch `task/935-governance-approval-route`, candidate `5cd44cb971c74157f581efb3677310523c9c5a26`
(R1–R5 at `c00337ef5`, R6–R10 at this commit). Scripts and raw output are next to this file.

**Decision: `NEEDS REVISION`.** Two implementation defects (F1, F2) and the forms R10 sends to a revision (F3). The correction is revision 5 of
the kickoff, R11–R14, proven by `design/p13-reader-forms-run.txt` and `design/p14-proof-of-the-proof.txt`. This session implements and approves
nothing of it (D1, D2).

## Findings

### F1 (P2, implementation): the reader's bound loses targets the hook of C60 reports

- Requirement: section 5, "every target of the R4 hook stays reported"; R6 replaces the expressions, it does not narrow them.
- Location: `scripts/workflow-gates/security-hook.mjs`, `callArguments`: `const end = Math.min(text.length, start + CALL_SCAN);`.
- Observed (`r1-probes.txt:3-6`): `open(<5000 blanks>'X', 'w')`, `open(<5000 blanks>file='X', mode='w')`, `fs.openSync(<5000 blanks>'X', 'w')` and
  `[IO.File]::Open(<5000 blanks>'X', 'Create')` are reported by the hook of C60 and not by the final hook. A path longer than the bound is lost the
  same way (`r5-real-behaviour.txt`, section 6, runs the forms with 2500 `./` on both hooks).
- Why the implementer's audit missed it: difference 1 of the completion report pads between the path and the mode only, so the path was always
  inside the bound. The report's "no target of C60 is lost" is not true.
- Correction: R11. Verified by the same forms on the prototype and by the break of C85.

### F2 (P2, implementation): the reader's cost multiplies by the folders of a raw reading

- Requirement: R6 bounds the scan "because a hook has 15 s" (the code comment); C68 and C69 say the hook stays inside its timeout; the timeout is 15 s
  with `onFailure: block` (C73).
- Location: `uncachedShellWriteTargets` runs once per folder for a child-process text, and each run calls `openTargets`, which scans up to 4096
  characters per `open(`.
- Observed (`r2-checks.txt:31-32`): 100 folders and 2000 `open(` in 10812 characters take 71 ms on the hook of C60 and 10162 ms on the final hook; 200
  folders in 11712 characters take 133 ms and 21063 ms. AC9 passes, because no command of its hostile list combines folders and open calls.
- Executed: through the real hook process the command takes 16709 ms against the limit of 15000 ms (`r5-real-behaviour.txt`, section 4), and
  `governanceIndependenceErrors` alone takes 16567 ms (`r4-self-audit-first.txt`, section 4). The first version of this review gave 21063 ms; the machine varies.
- Impact, INFERENCE: read from `onFailure: block` and the Stop branch, not executed through the harness. It would fail closed, so it is a denial of the
  workflow and no bypass, and only for a contrived command. The first version of this review stated this impact as fact.
- Correction: R12. Verified: 317 ms on the prototype (C82); with the memo removed, 20617 ms again (C86).

### F3 (R10, C48): the new forms of the completion report and of this review

The completion report lists 26 forms and leaves them to "the owner and the approver". R10 already decides this: "each newly found one goes to a
revision (C48)", and D13 says no new task. This review found more of the same classes: a manager's own option with a value outside R8
(`npm --loglevel silent exec rimraf X`, `--cache`, `--reporter`, `--modules-folder`), `rimraf.cmd X`, `yarn.cmd rimraf X` and `corepack`. So no owner
question is open. Revision 5 closes 22 of the 26 in the same readers (R13). The other four stay out by a stated reason (section 4): three hold the
mode in a variable, which the R6 controls pin silent, and `npm --prefix=. run rm X` runs a package script.

## Requirement and criterion reconciliation

| R / AC | Inspected | Counter-check | Result |
|---|---|---|---|
| R1, AC1 | allowlist diff at `c00337ef5`: one changed entry, one removed, seven byte-identical | gate run: `0 violations`, `Allowlist: 8 entries, 0 stale.`, exit 0; `:verify` 34 passed, 0 failed | PASS |
| R2, AC2–AC4 | `staleAllowlistEntries` and `runCommandLine`; entry guard is the prescribed expression | the guard stays true with a lower-case drive and another folder case (`r2-checks.txt`, section 6); import prints nothing | PASS |
| R3, AC5 | four cases read: real `evaluateHook`, real detector, real gate spawn | `selftests.mjs` 207 of 207, 0 skipped; `check-workflow` 0; ESLint 0; `verify` 0; no self-test file committed at C60 and no manifest entry changed | PASS at C87; AC5 is amended for the seventh case |
| R4, R5 (AC6) | hook diff `4f1850fb0..c00337ef5` read in full (only in the self-audit below); `shell-forms-residual.selftest.mjs` read in full; the p07 and p10 lists are in it (`r2-checks.txt`, section 1; the one mismatch is a `.replace` in p10 that gives the same form); 20 and 12 controls in it (`r5-real-behaviour.txt`, section 5) | break of R4 (c) fails with an assertion, restored passes (`r3-sensitivity.txt`) | PASS |
| R6 | diff read in full | F1, F2 | **FAIL** |
| R7, R8, R9 | diff read in full; `r1-probes.txt` groups C to F | no regression other than F1; 40000 commands of another alphabet, 0 exceptions, 0 lost targets (`r2-checks.txt`, section 5) | PASS for their lists |
| R10, AC8 | the p11 forms and the head of `CONTROLS` equal the self-test as text; sensitivity record method in-memory; own in-memory run of the saved spec | assertion on `npm --prefix . exec rimraf`, restored passes; hook bytes unchanged | PASS |
| AC9 | own corpus run, own F8 and hostile runs | corpus: dropped 0, added 0, refused 0, scope 0, sha256 as the report says; F8 2819 ms and 10319 ms; worst hostile 620 ms | PASS as worded; F2 is outside its list |
| AC7, Linux run | | | not reached: they follow approval |
| Q1 build | not rerun, because the verdict does not rest on it; the implementer's exit 0 is not reused for the next candidate | | not applicable to this verdict |
| Q1 integrity | `check:file-integrity:all` and `check:mojibake` rerun in the self-audit: both exit 1 on this dirty tree; neither output names a `task942` path | | as the report says |

Other report claims checked: 207 of 207, 6 of 6 cases, the 135 handwritten breaks and the 284 mechanical ones with 9 survivors are in
`test-results/task942-r6/` as stated. The report's limit is honest about itself: a hand-chosen list only tests what its author thought of. F1 and F2 are
that kind of gap.

Not a finding: `open('X', 1)` now counts as a write, because R6 (a) says a nonzero flag number writes. A read that names the same text in `echo` or `git
commit -m` already counted at C60.

## Self-audit of this review (owner request, 2026-11-04)

The owner doubted this review and ordered a check of it. The verdict `NEEDS REVISION` stands; F1 to F3 hold. The review's own record and revision 5 did not:

| Defect in my own work | Evidence | Correction |
|---|---|---|
| **The first revision 5 prototype lost targets.** R13 (b) replaced a reading with a longer list of value options, so `npx --filter rm X`, which both older hooks report, went silent. npm really runs that word (`r5-real-behaviour.txt:4`). This was the class of F1, in the fix for F1 | `r4-self-audit-first.txt:35`; `r6-superset-first-prototype.txt:61`, `LOST 1011`, after 207 tests, 60 forms and the corpus had passed | R13 (b), (c), (d) read both ways; `LOST 0` (`r6-superset.txt`); the differential is now in AC11 |
| **A real hole left open.** `npx --loglevel silent rimraf X` is missed by C87 and by the first prototype; `pnpm -w exec rm X` likewise; a triple-quoted mode was in `r1-probes.txt:20` as a miss and nowhere in this review | `r5-real-behaviour.txt:16`; `r1-probes.txt:20` | in the forms of AC10 |
| **Overclaim in the final message.** "R1–R5, R7–R9: no defects" was written with the R4 hook diff, the residual self-test and the R1–R5 report unread | read in this audit: no defect found in them | the table above says what was read and when |
| **Unexecuted impact stated as fact** in F2 | see F2 | relabelled INFERENCE; the time is now executed |
| **A claim made before the run.** I told the owner `npx --filter rm X` deletes the file, then a probe with `--version` did not support it, and a third with `tsc <missing file>` did. A first probe with `where` proved nothing, because npx does not look programs up on PATH | `r5-real-behaviour.mjs`, header | the claim stands now only on `r5-real-behaviour.txt:4` |
| **C91 wider than its citation**; a retained result missing for the long path; a wrong title in `r2-checks` section 4 (about 11 000 characters, not 50 000); a manifest row marked EXECUTED that only named places | `readiness.md` revision 5, row 1 | each corrected |

Also checked, no defect: 6 of 6 GOV-942 cases `passed` in `impl/governance-report.json` and in a fresh `selftests.mjs`; the backlog line of 942 records filing, and task state lives in the sprint row, as for revision 4. `cli.mjs governance-report` was not rerun, because it writes a scope file of the task.

Root cause, stated plainly: I checked my change against lists I wrote myself. The owner decided on 2026-11-04 (D25) that a tool must do this after each write: Task 945.

## Candidate fingerprints

`security-hook.mjs` sha256 `5efddf6e47e4dbbf6a45628aee31ab5aa12dd73bb856f46b6192751569c17935`, unchanged across every run here; the candidate was never
edited. Evidence: `r1-probes.mjs` and `.txt`, `r2-checks.mjs` and `.txt`, `r3-sensitivity.mjs` and `.txt` in this folder.
