# Task 943 completion report (Opus governance implementer)

Session `1450b70d-ee65-4372-870d-cde8f826647e`, fresh (transcript started 2026-11-03 08:35), not the designer of the
kickoff and not the Task 941 review 2 or review 3 session (D1). Native Windows 11, Node v22.22.3, Git Bash 5.2.37.
Base: HEAD `93612ccead6874a92448fa2a23cf1b8be6da59d8`; the Task 941 sidecar is archived with `"stage": "reviewed"` and
`git status --short tasks scripts/workflow-gates` showed no change to it or to the hook before the first write (route step 2).

**Status: PARTIALLY IMPLEMENTED.** Every requirement R1–R5 and R7–R12 is implemented and all thirteen GOV-943 cases pass,
but AC1, AC6 and AC11 require `node scripts/workflow-gates/selftests.mjs` to exit 0 with the Task 941 test file unchanged,
and the kickoff makes that impossible (finding K1). R6 belongs to the approver and was not written.

## K1 — kickoff conflict (BLOCKED, needs a kickoff revision or an owner decision)

R2 and section 5 make every file positional of an in-place `sed` a target. Two assertions of the unchanged Task 941 file
`scripts/workflow-gates/shell-write.selftest.mjs` (GOV-941-HOOK-MALFORMED-ERROR) require equality with the pre-change
function for parseable `sed -i` commands whose last positional is the word `writeFileSync`:

- line 123: `sed -i 's/a/b/' scripts/workflow-gates/example.mjs writeFileSync`;
- line 158: `sed -n 1p -i>o.txt scripts/workflow-gates/example.mjs writeFileSync`.

The implementation reports `writeFileSync` as an additional target of both (a file positional of `sed -i`), so the deepEqual
fails (`test-results/task943-impl/conflict.mjs`, rerun output: `["scripts/workflow-gates/example.mjs","writeFileSync"]`).
R1 states that no asserted result of the five hook-importing files changes, but that check covered R12 (C102, C120), not the
section 5 rows. No implementation satisfies both R2 (`sed -i`: every file positional) and R1/AC1 (941 file unchanged and
green). Changing the 941 equality to inclusion weakens a reviewed case, which `04-contract-rebases.md` (owner D12) forbids
as a rebase; it needs a revision of Task 941, or R2 needs a narrower `sed` row. That is a design decision for a design
session or the owner; the implementer did not choose one.

## Requirements

| R | Status | Implementation | Evidence |
|---|---|---|---|
| R1 | implemented; AC1 blocked by K1 | `baseShellWriteTargets` keeps the 941 result; the R1 fallback adds the PROJECT_FILE paths of a parser-rejected command naming a section 5 program (`namesWriteProgram`) | `selftests-final` below; corpus check |
| R2 | implemented | `programTargets` (section 5 table, PowerShell parameters with unique prefixes, `-t`/`--target-directory`, recursive copies, directories, root `.`) | GOV-943-HOOK-PROGRAM-DENY, -DIRECTORY-DENY, -SOURCE-ALLOW, -MALFORMED-ERROR |
| R3 | implemented | `WRITE_WORD` holds every R3 word | GOV-943-HOOK-API-DENY (path held in a variable, so only the word can report it) |
| R4 | implemented | both consumers still call `shellWriteTargets`; changes are R8 (tracked check) and R12 (d) (transcript `cwd`, event `cwd`) | GOV-943-HOOK-PRETOOL-DENY, -TARGET-SPELLING-DENY |
| R5 | implemented | eight cases in `scripts/workflow-gates/shell-mutation.selftest.mjs`, listed in `publication.json` | governance report |
| R6 | not written (approver) | — | — |
| R7 | implemented | `testsRebaseFiles`, `testsEntryErrors`, `rebaseChain` accepts `tests`, `rebaseChainErrors` dispatches it; `diffRebaseErrors` reads `tests` lists; `03-decision-closure.md` paragraphs moved unchanged to `04-contract-rebases.md` with the D12 paragraph | GOV-943-TESTS-REBASE-ALLOW/-DENY/-ERROR |
| R8 | implemented | `git cat-file -e HEAD:<path>` through `execFileSync` without a shell, only when `<root>/.git` exists | GOV-943-EXEMPT-UNTRACKED-DENY |
| R9 | implemented | (a), (b) and (c) in `03-decision-closure.md`; (c) also in C7 of `create/03-publication.md`; sizes 7829 and 3987 bytes | `check-workflow.mjs` exit 0 |
| R10 | implemented | five cases in `scripts/workflow-gates/case-test-rebase.selftest.mjs`, listed in `publication.json` | governance report |
| R11 | implemented | `reviewedFreshnessErrors` in `cli.mjs`, called by `diff` at phase `release`; `validateDiff` unchanged | GOV-943-CI-STALE-REVIEW-DENY; real-repository run below |
| R12 | implemented | (a) `win32Spelling` + `canonicalPath` (`realpathSync.native`) before the inside/outside decision; (b) `globSync` per folder; (c) parsed and raw folder changes; (d) `shellFolder` from the transcript entry and the event `cwd`; (e) W2/W3; (f) quote stripping; (g) `noclobberCommands` (parsed) and `RAW_NOCLOBBER` (raw) | GOV-943-HOOK-TARGET-SPELLING-DENY; probes p09, p11, p14 |

Changed files: `scripts/workflow-gates/security-hook.mjs`, `contract.mjs`, `cli.mjs`, `publication.json`, new
`shell-mutation.selftest.mjs` and `case-test-rebase.selftest.mjs`, `.claude/rules/review/03-decision-closure.md`,
`.claude/rules/create/03-publication.md`, new `.claude/rules/review/04-contract-rebases.md`, the stage and
`implementation` fields of this task's sidecar, and the evidence under `docs/sessions/evidence/task943/impl/` and
`docs/sessions/evidence/task943/sensitivity/`.

## Cases (governance report `docs/sessions/evidence/task943/impl/governance-report.json`)

All thirteen pass: GOV-943-HOOK-SOURCE-ALLOW, -HOOK-PROGRAM-DENY, -HOOK-DIRECTORY-DENY, -HOOK-API-DENY, -HOOK-PRETOOL-DENY,
-HOOK-MALFORMED-ERROR, -CI-DELETE-DENY, -HOOK-TARGET-SPELLING-DENY, -TESTS-REBASE-ALLOW, -TESTS-REBASE-DENY,
-TESTS-REBASE-ERROR, -EXEMPT-UNTRACKED-DENY, -CI-STALE-REVIEW-DENY. `cli.mjs verify --contract <this sidecar>` exits 0.
Against the HEAD hook (copy under `test-results/task943-impl/head/`), seven of the eight `shell-mutation` cases fail and
GOV-943-CI-DELETE-DENY passes, as it asserts preserved behaviour.

AC13 platform line (native Windows run of this machine, `test-results/task943-impl/selftests-final.txt`):
`GOV-943-HOOK-TARGET-SPELLING-DENY platform parts run on win32: trailing-dots, msys, device-prefixes, junction, admin-share, short-names`.

## Sensitivity (`docs/sessions/evidence/task943/sensitivity/`)

Each break was applied and restored with the Edit tool on the final source; baseline and restored runs carry the same
source sha256. Failed assertion of each mutant:

| Case | Break | Failed assertion |
|---|---|---|
| GOV-943-HOOK-PROGRAM-DENY | `tee` removed from the table | `echo x \| tee -a scripts/workflow-gates/fixture-scope.mjs: []` |
| GOV-943-HOOK-PRETOOL-DENY | `Copy-Item` removed from the table | `did not match /POLICY-EDIT AUTHORITY REQUIRED/` (input `''`) |
| GOV-943-TESTS-REBASE-DENY | `[<id>]` presence check skipped | `case ID removed from the test file` |
| GOV-943-EXEMPT-UNTRACKED-DENY | tracked check dropped | `did not match /GOVERNANCE INDEPENDENCE: this session wrote tasks\/product_kickoff…/` |
| GOV-943-CI-STALE-REVIEW-DENY | contracts outside `selected` skipped | `did not match /tasks\/product_kickoff\.security\.json: Independent review scope is stale/` |
| GOV-943-HOOK-TARGET-SPELLING-DENY | R12 (c) dropped (parsed and raw) | `cd D; cat Y > hook.mjs: ["hook.mjs"]` |

## Totals and checks

- Base (`base-runs.txt`, before the first write): 178 tests, 178 pass, exit 0.
- Final (`test-results/task943-impl/selftests-final.txt`): 191 tests, 190 pass, 1 fail (GOV-941-HOOK-MALFORMED-ERROR, K1),
  0 skipped, exit 1. 191 = 178 + 13.
- `git diff --exit-code` on `shell-write`, `diff-hook`, `governance-contract`, `scope-rebase` and `session-role` self-tests: exit 0.
- `publication.mjs --base HEAD`: 86 explicit files, 0 dependency errors, exit 0. `check-workflow.mjs`: exit 0.
  `eslint --config scripts/workflow-gates/eslint.config.mjs scripts/workflow-gates`: exit 0.
  `npm run check:kickoff-evidence`: PASS, exit 0.
- Probes (`probes-after.txt`, checked by `test-results/task943-impl/check-probes.mjs`): p01 lines 2–21 report X (before:
  `design/p01-undetected-writes-probe.txt`, all `targets []`); p02 lines 2–5 refuse (before: `design/p02-pretool-probe.txt`,
  `[]`); p09 lines 4, 10–13, 19, 20, 22, 23, 29, 30, 32–36, p11 lines 3–14 and p14 lines 9–18 report the file or a refusal;
  p14 controls 19–21 are `[]`, `[]`, `["out.txt"]`. p01 and p02 ran as copies printing to stdout, because the originals
  overwrite their design output; the design folder is unchanged (`git status --short` empty).
- Real repository, `cli.mjs diff --phase release --base origin/main --working-tree`: R11 reports exactly the contracts that
  R6 rebases — 935, 940, 941 (review scope stale) and 923 owner-fixes, 927 (review and report stale).

## Corpus impact (frozen 2318-command corpus of C103, sha256 `1eb5de48…155b9`; `test-results/task943-impl/corpus-impact.mjs`)

Against the HEAD hook: 121 commands gain targets, 43 gain a policy, product or Git-metadata target, and 41 executor
commands are refused that HEAD allowed. Inspected samples are real writes the hook missed (`sed -i` and `cp`/`rm` of
product files) and, per R1, PROJECT_FILE paths named in parser-rejected commands that name a section 5 program (heredoc
prose). Five commands lose a target string only through R12 (a) normalisation (trailing space or dot removed, case and 8.3
alias canonicalised). Slowest single `shellWriteTargets`: 8 ms.

## Implementer decisions and deviations for review

1. **R1 fallback condition.** A first version took the bare words `sed`, `find` and `xargs` as section 5 programs: on the
   corpus, 168 executor commands were newly refused, most of them read-only `grep`/`sed -n` chains. The fallback now uses
   the condition of each section 5 row: `sed` with an in-place option, `find` with `-delete`/`-exec`/`-execdir`/`-ok`/`-okdir`,
   `xargs` followed by a write program (MALFORMED-ERROR asserts both sides).
2. **Project root.** `rm -rf .`, `find . -delete` and `mv .` first reported nothing (`projectPath('.')` is `''`); the root is
   now walked (DIRECTORY-DENY asserts it; the guard answers `OWNER GIT REQUIRED` because `.git` is reported as given).
3. **Performance.** Path canonicalisation is memoised within one top-level call (`withPathCache`); independence check after
   `rm -rf .` went from 132 s to 0.5 s, `rm -rf .` targets take about 0.2 s. No result changes.
4. **`>|` in nested shells.** The raw `>|` pattern also runs for nested shells and interpreters, not only parser-rejected
   commands, fail-closed like the existing raw `>` pattern.
5. **Non-string commands.** `shellWriteTargets` returns `[]` for a non-string command; the HEAD version threw.
6. **`publication.json`.** Besides the two self-tests, the new rule file `.claude/rules/review/04-contract-rebases.md` is listed,
   as every other owned rule file is.
7. **Wrapper options.** An adversarial self-check (`test-results/task943-impl/adversarial.mjs`: 53 write forms outside the
   self-tests, 13 read forms) found `sudo -u admin rm X` and `env -i A=1 rm X` unreported; the options of a leading wrapper
   (and the value of `sudo -u/-g/…`, `env -u/-C/-S`) are now skipped (PROGRAM-DENY asserts both). After the fix every write
   form reports X except `cp -rT docs/sub D`, which correctly reports `D/f.mjs` (X is not affected), and no read form reports X.
8. **Incident.** During the first attempt at sensitivity break 3 a mutant comment (`//`) made `contract.mjs` unparseable;
   every hook-guarded tool was blocked until the owner restored the line. All final mutants use block comments with
   `node --check` after each edit; all six proofs were rerun on the final source.

## Write forms that stay undetected

Out of scope by section 4: a script file run by an interpreter (`node x.mjs`, `python x.py`), `perl -i`, editors, programs not
in section 5, and a folder change through a variable, `-`, `~` or `popd`/`Pop-Location`. Also undetected: a section 5 program
inside a nested shell or interpreter string (`bash -c 'cp Y X'`), because R12 (c) gives nested commands only the raw
redirection and API positions; a `find -exec rm {} \;` names only the paths written in its text (the parser rejects `\;`);
and a write through an API whose path is not a literal and whose word is not in R3.

## Independent sub-review findings (after this report; implementation paused)

A fresh-context sub-agent reviewed the uncommitted candidate adversarially (probes in `test-results/task943-subreview/`);
the implementer reproduced F1, F2, F3, F5 and F7 (`test-results/task943-impl/verify-subreview.mjs`). Meanwhile a design
session set this sidecar to `executionStatus: "blocked"` and drafted revision 4 (`design/p15-*`, R13), so no code was
changed after these findings; they are input for that revision.

| ID | P | Defect (reproduced) | Requirement |
|---|---|---|---|
| F1 | P1 | A parser-rejected command loses W2: `Set-Content package.json $x` and `"$x" \| Out-File -FilePath package.json` report `[]` and the executor guard allows them (control without `$` is refused) | R12 (e) |
| F2 | P1 | `find D -name '*.mjs' -exec sed -i 's/a/b/' {} +` and `… -exec rm {} \;` report `[]` and are allowed: `{`/`\;` make the command unparseable and the R1 fallback names no file under D. The MALFORMED-ERROR assertion uses `-exec rm` without `{}`, which parses, so it does not cover the real form | section 5 `find` row, AC5 |
| F3 | P1 | `cmd /d /c "cd /d <abs>/scripts && echo x > check-example.mjs"` is allowed: the raw folder pattern captures `/d` as the folder | R12 (c) |
| F4 | P2 | (sub-agent) a glob in a parser-rejected `sed -i … scripts/workflow-gates/*.mjs` is not expanded, so the independence check misses the scope file | R12 (b) |
| F5 | P1 | `evaluateHook` without a role on the real root: `rm -rf docs` 10971 ms, `cp -r docs backup/` 22008 ms, beyond the 15 s hook timeout (`onFailure: block`); the cost is `registeredWrites` (every target × every contract × `inScope`) | usability of R2 directory walks |
| F6 | P3 | (sub-agent) R12 (d) is not applied to Write/Edit paths in the pre-write guard (Write normally sends absolute paths) | R12 (d) |
| F7 | P3 | `node -e "'a'.replace('src/app/page.tsx','y')"` is refused: API_TWO matches the bare string method `replace` | R3/W3 scope |
| F8 | P3 | (sub-agent) inputs of 35 KB with 5000 `cd` words take 14.6 s | performance |

Spec gaps (not code defects): a section 5 program inside a nested shell (`bash -c 'cp Y X'`) or after `exec` is not parsed
(listed above as undetected). Revision 4 drafts cover `exec`, more wrappers, evaluators and pipeline-fed cmdlets; F1–F5
are not visibly covered by `design/p15-r13-pairs.txt`.

## Outcome

`PARTIALLY IMPLEMENTED` — K1 blocks AC1, AC6 and AC11; R6 and AC7 remain with the approver.
