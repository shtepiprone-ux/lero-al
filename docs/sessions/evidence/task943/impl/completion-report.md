# Task 943 completion report (Opus governance implementer, revision 4)

Session `9466dccd-46fa-43be-af96-65034de74bc1`, a fresh session started for this task (`/clear`, 2026-11-03): not the designer
of the kickoff, not the Task 941 review 2 or review 3 session and not the Task 943 review 1 session that wrote revision 4
(D1, route step 3). It may not approve this task (D2). Native Windows 11, PowerShell 5.1, Node v22.22.3, Git Bash 5.2.37.
The revision 3 implementation (session `1450b70d`, commit `8899d9c42`) is the starting point; its report is in Git history.

Route checks before the first revision 4 write: HEAD `8332807fe453c9bbe54383b193259311f8236fc1`; the archived Task 941 sidecar
reads `"stage": "reviewed"`; `git status --short tasks scripts/workflow-gates` showed no change to it or to the hook; the hook
sha256 was `35b508014df04741bad213f2d6994aa82db1b38f5350975a19b6db29f8d43ddd`, line 1 of `design/p15-run.txt`; `cli.mjs plan`
and `cli.mjs receipt` of this sidecar exited 0. The revision 4 base run is appended to `base-runs.txt` (191 tests, 190 pass,
1 fail: GOV-941-HOOK-MALFORMED-ERROR, the K1 conflict; exit 1).

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW.** R1–R5 and R7–R15 are implemented; all fourteen GOV-943 cases pass;
R6 and AC7 belong to the approver and were not written.

## Requirements

| R | Status | Implementation | Evidence |
|---|---|---|---|
| R1 | implemented | revision 3 superset kept; K1: the two equality assertions of GOV-941-HOOK-MALFORMED-ERROR expect the pre-change result followed by `writeFileSync` for exactly the two R1 commands (constant `K1`, helper `expectedTargets`); every other command keeps `previousTargets` | `git diff` below; GOV-941 cases pass; corpus: 0 Task 941 targets dropped |
| R2 | implemented (rev. 3) | `programTargets` | GOV-943-HOOK-PROGRAM-DENY, -DIRECTORY-DENY, -SOURCE-ALLOW, -MALFORMED-ERROR |
| R3 | implemented (rev. 3) | `WRITE_WORD` | GOV-943-HOOK-API-DENY |
| R4 | implemented | consumers still call `shellWriteTargets`; changes: R8, R12 (d) (transcript and event `cwd`, revision 4: Write/Edit in the event `cwd`) and R14 (b) | GOV-943-HOOK-PRETOOL-DENY, -TARGET-SPELLING-DENY |
| R5 | implemented | nine cases in `shell-mutation.selftest.mjs` (revision 4 adds GOV-943-HOOK-NESTED-DENY), listed in `publication.json` | governance report |
| R6 | not written (approver) | — | — |
| R7–R11 | implemented (rev. 3), unchanged | `contract.mjs`, `cli.mjs`, rule files, `case-test-rebase.selftest.mjs` | GOV-943-TESTS-REBASE-*, -EXEMPT-UNTRACKED-DENY, -CI-STALE-REVIEW-DENY |
| R12 | implemented | revision 4 (d): the pre-write guard resolves a Write/Edit path at the root and in the event `cwd`, and refuses it as outside the project when either resolution leaves the root | GOV-943-HOOK-TARGET-SPELLING-DENY (executor Write and Edit with `cwd` `<root>/scripts`, Write with an outside `cwd`) |
| R13 | implemented | (a) `programIndex` skips the runners; `builtin cd`/`command cd`; (b) `evaluatedText` + recursion of `uncachedShellWriteTargets`, depth ≤ 3; (c) quoted `-i`/`-delete` in `WRITE_PROGRAM_WORDS`, R1 paths in every raw folder; (d) `PIPED_PROGRAMS`; (e) `lenientTargets`; (f) `CHILD_CALL` | GOV-943-HOOK-NESTED-DENY; `r1-adv-probe`, `r1-audit2-probe` |
| R14 | implemented | (a) `/d` dropped in parsed and raw folder changes; (b) `registeredWrites` builds the scope-key set once; (c) `API_QUALIFIER`; (d) `seenFolders` | NESTED-DENY, SOURCE-ALLOW; AC15 timings |
| R15 | implemented | `OTHER_WRITERS` and `otherWriterTargets` (not section 5 words of the R1 fallback); `npx`/`pnpx`/`bunx` skipped as wrappers | PROGRAM-DENY, NESTED-DENY, SOURCE-ALLOW |

Revision 4 changed files: `scripts/workflow-gates/security-hook.mjs`, `shell-mutation.selftest.mjs`,
`shell-write.selftest.mjs` (the two R1 assertions only), the `stage`/`implementation` fields of this sidecar, and
`docs/sessions/evidence/task943/impl/` (`base-runs.txt` appended, `probes-after.txt`, `governance-report.json`, this report) and
`docs/sessions/evidence/task943/sensitivity/` (seven artifacts, `sensitivity.json`). `contract.mjs` and `cli.mjs` were broken
and restored for sensitivity only; `git diff --quiet` on both exits 0.

## Cases (`docs/sessions/evidence/task943/impl/governance-report.json`)

All fourteen pass: GOV-943-HOOK-SOURCE-ALLOW, -HOOK-PROGRAM-DENY, -HOOK-DIRECTORY-DENY, -HOOK-API-DENY, -HOOK-PRETOOL-DENY,
-HOOK-MALFORMED-ERROR, -CI-DELETE-DENY, -HOOK-TARGET-SPELLING-DENY, -HOOK-NESTED-DENY, -TESTS-REBASE-ALLOW, -TESTS-REBASE-DENY,
-TESTS-REBASE-ERROR, -EXEMPT-UNTRACKED-DENY, -CI-STALE-REVIEW-DENY. `cli.mjs verify --contract <this sidecar>` exits 0.
Against the committed revision 3 hook (`test-results/task943-impl/against-rev3.mjs`, gitignored), the final
`shell-mutation.selftest.mjs` fails SOURCE-ALLOW (F7 control), PROGRAM-DENY (`npx prettier --write X: []`), TARGET-SPELLING-DENY
(Write/Edit `cwd`) and NESTED-DENY (`bash -c 'cp Y X': []`), and passes the other five.

AC13 platform line (native Windows run, `test-results/task943-impl/selftests-final-r4.txt`):
`GOV-943-HOOK-TARGET-SPELLING-DENY platform parts run on win32: trailing-dots, msys, device-prefixes, junction, admin-share, short-names`.

## Sensitivity (`docs/sessions/evidence/task943/sensitivity/`)

Every break was applied and restored with the Edit tool on the final source, `node --check` after each edit; the five hook
artifacts carry the final hook sha256 `f7413e0e38b07c485c4a640af250fe3b5ed7f967fc8b9c5f918059d7edca17bf` in their baseline
and restored runs, the four `shell-mutation` artifacts test-file sha256 `8dc8403f…5516`; `contract.mjs` and `cli.mjs` are
byte-identical to HEAD after their breaks. Failed assertion of each mutant:

| Case | Break | Failed assertion |
|---|---|---|
| GOV-943-HOOK-PROGRAM-DENY | `tee` removed from the table | `echo x \| tee -a scripts/workflow-gates/fixture-scope.mjs: []` |
| GOV-943-HOOK-PRETOOL-DENY | `Copy-Item` removed from the table | `did not match /POLICY-EDIT AUTHORITY REQUIRED/` (input `''`) |
| GOV-943-TESTS-REBASE-DENY | `[<id>]` presence check skipped | `case ID removed from the test file` |
| GOV-943-EXEMPT-UNTRACKED-DENY | tracked check dropped | `did not match /GOVERNANCE INDEPENDENCE: this session wrote tasks\/product_kickoff\.security\.json/` |
| GOV-943-CI-STALE-REVIEW-DENY | contracts outside `selected` skipped | `did not match /tasks\/product_kickoff\.security\.json: Independent review scope is stale/` |
| GOV-943-HOOK-TARGET-SPELLING-DENY | R12 (c) dropped (parsed and raw) | `cd D; cat Y > hook.mjs: ["hook.mjs"]` |
| GOV-943-HOOK-NESTED-DENY | R13 (b) text evaluation dropped | `bash -c 'cp docs/fixture-scope.mjs scripts/workflow-gates/fixture-scope.mjs': []` |

## Totals and checks

- Revision 4 base (`base-runs.txt`, before the first revision 4 write): 191 tests, 190 pass, 1 fail (K1), exit 1.
- Final: `node scripts/workflow-gates/selftests.mjs` 192 tests, 192 pass, 0 fail, 0 skipped, exit 0; 192 = 178 (after 941,
  `base-runs.txt` first run) + 14.
- No existing self-test file changed apart from the two R1 assertions: `git diff --quiet` exits 0 for `diff-hook`,
  `governance-contract`, `scope-rebase`, `session-role` and `case-test-rebase`; the `shell-write.selftest.mjs` diff adds the `K1`
  set and `expectedTargets` and changes the expected value of the two loops holding the two R1 commands
  (`[...previousTargets, 'writeFileSync']` for those two, `previousTargets` for every other command); no command, case ID or
  test name changed.
- `publication.mjs --base HEAD`: 86 explicit files, 0 dependency errors. `check-workflow.mjs`: exit 0.
  `eslint --config scripts/workflow-gates/eslint.config.mjs scripts/workflow-gates`: exit 0. `npm run check:kickoff-evidence`: PASS.
- Probes (`probes-after.txt`, final hook): p01 lines 2–21 report X (before: `design/p01-undetected-writes-probe.txt`, all
  `targets []`); p02 lines 2–5 refuse (before: `design/p02-pretool-probe.txt`, `[]`); p09 lines 4, 10–13, 19, 20, 22, 23, 29,
  30, 32–36 and p11 lines 3–14 report the file or a refusal; p14 lines 9–18 non-empty, controls 19–21 `[]`, `[]`, `["out.txt"]`;
  `r1-adv-probe` `REPORTED` on all 13 lines; `r1-audit2-probe` `REFUSED` on lines 1–31 and `ALLOWED` on lines 32–44. p01 and p02
  ran as copies under `test-results/` whose save prints to stdout (their output therefore appears twice); the design folder is
  unchanged.
- AC15 timings (native Windows, `probes-after.txt`): `evaluateHook` without a role on the real root: `rm -rf docs` 157 ms,
  `cp -r docs backup/` 1156 ms (limit 5 s); `shellWriteTargets` on the `p15-run.mjs` 5000-folder-change commands: parsed
  2086 ms, parser-rejected 8003 ms (limit 15 s; the prototype measured 2054 ms and 8069 ms, `design/p15-run.txt` lines 100–101).
- Q1 profile (`docs/qa-profiles.md`): `npm run check:mojibake` and `npm run check:file-integrity` exit 1 on the repository, but
  on files outside this task only (mojibake: `docs/sessions/evidence/task923/…`; file integrity: the two untracked
  `docs/sessions/evidence/task923/review-67/*.nul` files); neither reports a line for a file of this task. No changed file has a
  BOM; `base-runs.txt` holds CRLF lines from the PowerShell append, which the contract digest normalises.
  `npm run build` (Next.js production build, native PowerShell, output `test-results/task943-impl/build.txt`): exit 0.

## Corpus impact (frozen 2318-command corpus, sha256 `1eb5de48…155b9`; `test-results/task943-impl/corpus-rev4.mjs`)

Final hook against the committed revision 3 hook: 67 commands gain targets; 30 of them gain a target under the guarded
definition of `design/p15-run.mjs` line 151 (policy, product, `tasks/`, `docs/` or `.git`), 6 when `tasks/` and `docs/` are not
counted; 6 executor commands are newly refused (5 `SECURITY TEST CONTRACT MISSING`, 1 `POLICY-EDIT AUTHORITY REQUIRED`); no
governance scope file is added; slowest single call 4 ms. 67, 30 and 6 equal the prototype's counts (`design/p15-run.txt`
line 112 and its executor-guard line). 14 commands lose a revision 3
target: all are arguments of a bare string method (`.replace(…)`, …) that R14 (c) no longer reads as a file API; none of
them is a Task 941 target (`corpus-dropped.mjs`), so the R1 superset holds.

## Sub-review findings F1–F8

| ID | Closed by |
|---|---|
| F1 | R13 (e): NESTED-DENY executor `Set-Content package.json $x` and `"$x" \| Out-File -FilePath package.json` → `SECURITY TEST CONTRACT MISSING` |
| F2 | R13 (e): NESTED-DENY `find D -name '*.mjs' -exec sed -i 's/a/b/' {} +` and `find D -name x -exec rm {} \;` report X |
| F3 | R14 (a): NESTED-DENY executor `cmd /d /c "cd /d <root>/scripts && echo x > check-example.mjs"` → `POLICY-EDIT AUTHORITY REQUIRED` |
| F4 | R13 (e): NESTED-DENY `sed -i "s/a/$x/" D/*.mjs` reports X |
| F5 | R14 (b): AC15 timings 157 ms and 1156 ms (revision 3: 10971 ms and 22008 ms) |
| F6 | R12 (d) revision 4: TARGET-SPELLING-DENY executor Write and Edit with `cwd` `<root>/scripts`, Write with an outside `cwd` |
| F7 | R14 (c): SOURCE-ALLOW executor `node -e` with `'src/app/page.tsx'.replace(…)` and `'a'.replace('src/app/page.tsx', 'y')` → `[]`; `shutil.copy` and `require('fs').rm` still report X |
| F8 | R14 (d): AC15 timings 2086 ms and 8003 ms |

## Implementer decisions for review

1. **Runners before an evaluator or nested shell.** Section 5 defines the program as the first word after the wrappers and
   runners, and R13 (b) applies to a simple command "whose program is" `bash`, `eval`, …. The design prototype tested only the
   first word, so `sudo bash -c 'rm X'`, `exec bash -c …`, `timeout 5 bash -c …` and `env A=1 sh -c …` reported nothing
   (`test-results/task943-impl/residual.mjs`). The wrapper skip is now the shared `programIndex`, used by `programTargets` and
   `evaluatedText`; the four forms are in NESTED-DENY. The corpus counts did not change.
2. **Structure.** The R15 row is the separate function `otherWriterTargets`; the lenient reading is `lenientTargets`.
   Behaviour follows `design/p15-r13-pairs.txt`.
3. **K1 form.** The expected value changes only in the two loops that hold the two R1 commands (AC1 permits one constant).
4. **Live hook during this session.** A diagnostic `node -e` of this session whose text held
   `execSync('rm package.json')` was refused (`ORCHESTRATOR BOUNDARY`) by the new R13 (f) rule; diagnostics were then run as
   script files under `test-results/`. This is the intended fail-closed reading of command text.
5. **Fail-closed false positive of R13 (f).** In a parser-rejected command, child-process string literals are read even
   inside quoted text: the executor command `grep -n "execSync('rm src/a.ts')" docs/x.md` is refused with
   `SECURITY TEST CONTRACT MISSING` (`test-results/task943-impl/audit.mjs`). R13 (f) prescribes this raw-text reading, as the
   existing raw `>` regex does for quoted text (C119); it is listed here for the reviewer, not changed.

## Implementer self-audit (owner request after the first report)

`test-results/task943-impl/audit.mjs` (gitignored) on the final hook: 17 further write forms (wrapper with options before a
nested shell, `nohup sh -c`, `powershell -NoProfile -ExecutionPolicy Bypass -Command`, `Start-Process` with a quoted
argument list and with `cmd /c`, a recursive pipeline into `Remove-Item -Force`, `rm --`, nested `cmd` with `cd` and a
backslash path, a doubly nested `bash -c`, a parser-rejected `eval`, `subprocess.run(…, shell=True)`, `spawnSync` with an
argument array, `sed -i''`, `Copy-Item -Destination -Force`, `git show > X`, `tee > /dev/null`, `find | xargs sed -i`) all
report X; 25 of 26 common executor commands (`npm test`, `npx vitest run`, `npx tsc --noEmit`, `npm run build`,
`npx eslint src`, `npx prettier --check src`, `git status`, `curl … | head`, `timeout 60 npm test`,
`tar -czf test-results/x.tgz src`, `npm run lint -- --fix`, …) stay allowed, the exception being decision 5; whole-root
forms (`npx eslint --fix .`, `npx prettier --write .`, `unzip`, `tar -xf`, `rm -rf .`, `Get-ChildItem . | Remove-Item`) answer
in under 0.2 s with `OWNER GIT REQUIRED`; `governanceIndependenceErrors` on this session's own transcript (1328 lines) takes
40 ms and returns 6 `GOVERNANCE INDEPENDENCE` errors, so this session cannot approve the task. Found and fixed by the
self-audit: the inaccurate corpus wording of the first report, a doc comment left above `programIndex` instead of
`programTargets` after the refactor (moved; every hook sensitivity break, the probes, the corpus run and the self-tests were
rerun on the final hook), and the missing Q1 checks above.

## Write forms that stay undetected

Out of scope by section 4: a script file run by an interpreter (`node x.mjs`, `python x.py`), `perl -i`, editors, programs not
listed in section 5 or R15 (for example `npx rimraf X`), a folder change through a variable, `-`, `~` or
`popd`/`Pop-Location`, a path held in a variable (including `$_`), and an `-EncodedCommand` string. The hook recognizes
listed forms only; the CI policy-diff check (C20) is the outer layer. Found during this implementation and left for a
revision (section 4: new forms are added by a revision, not by the implementer): a nested shell whose `-c` is inside an option
cluster, `bash -lc '…'` (`residual.mjs`: MISSED; `bash -e -c '…'` is reported).

## Outcome

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. R6 (the `scope` rebases of 935, 940 and 941, the `tests` rebase of 941 and the
`rules` rebases of the 923 owner-fixes and 927 contracts) and AC7 remain with the approver, in another fresh session.
