# Task 942 completion report (Opus governance implementer, D1)

Session: a fresh implementation session, 2026-11-04, native Windows 11, Node v22.22.3, cwd the project root, branch
`task/935-governance-approval-route`, base HEAD `4f1850fb0bc1f6454a38d88272fc493dc55ca65f` (Task 944 committed, D17). `git status
--short scripts` printed nothing before the first write. Route started at section 6 step 2.

## Status per requirement

| R | Changed files | Evidence | Status |
|---|---|---|---|
| R1 | `scripts/check-listing-visibility.mjs` | `impl/gate-after.txt`, GOV-942-CI-GATE-ALLOW, GOV-942-CI-PATH-DENY | done |
| R2 | `scripts/check-listing-visibility.mjs` | GOV-942-CI-GATE-ALLOW (AC4), GOV-942-CI-STALE-ERROR, `impl/gate-after.txt` | done |
| R3 | new `scripts/workflow-gates/listing-visibility-allowlist.selftest.mjs` | the four GOV-942 cases of that file | done |
| R4 | `scripts/workflow-gates/security-hook.mjs` through the Edit tool, each Edit passing the Task 944 guard | GOV-942-HOOK-SHELL-FORMS-DENY, sections below | done |
| R5 | new `scripts/workflow-gates/shell-forms-residual.selftest.mjs`, not in `publication.json` | the fifth case | implementer part done; the five `scope` rebases and AC7 belong to the approver |

Paths under `impl/` and `sensitivity/` are relative to `docs/sessions/evidence/task942/`.

## Acceptance criteria

| AC | Result |
|---|---|
| AC1 | `node scripts/check-listing-visibility.mjs` exit 0 with `0 violations` and `Allowlist: 8 entries, 0 stale.`; `npm run check:listing-visibility` exit 0 (`impl/gate-after.txt`); `npm run check:listing-visibility:verify` `34 passed, 0 failed`. |
| AC2 | GOV-942-CI-PATH-DENY passed; sensitivity below. |
| AC3 | GOV-942-CI-STALE-ERROR passed. |
| AC4 | Inside GOV-942-CI-GATE-ALLOW: an import with another file in `argv[1]` prints nothing and the process goes on; `node --check` exit 0. |
| AC5 | GOV-942-HOOK-EXECUTOR-DENY passed on the real tree with no temporary write. `selftests.mjs` exit 0: base 201 passed, final 206 passed, 0 failed, 0 skipped. `git diff --exit-code` on every tracked `scripts/workflow-gates/*.selftest.mjs` and `publication.json` exit 0. `check-workflow.mjs` exit 0. ESLint on `scripts/workflow-gates` exit 0. `governance-report` passed 5 of 5. `verify` exit 0 at stage implemented. **Open for the approver:** the Governance Check job of PR #12 after Task 937. |
| AC6 | GOV-942-HOOK-SHELL-FORMS-DENY passed; every form, control, sensitivity, corpus and timing result is below; every GOV-941, GOV-943 and GOV-944 case passed in `selftests.mjs`. |
| AC7 | **Not run: it follows the approver's rebases.** Until they exist the five contracts that scope the hook are stale by design (C52). |
| Q1 (`docs/qa-profiles.md`) | `npm run build` exit 0 on this candidate. No TypeScript source changed, so no typecheck applies. `check:file-integrity:all` and `check:mojibake` exit 1 on this dirty working tree, and neither output names a file of this task (15 and 3208 findings, for example `docs/sessions/evidence/task923/review-48/`). Both remain red locally for reasons outside this task; each of the 14 written files was checked one by one for NUL, BOM, invalid UTF-8, CR, Cyrillic, mojibake patterns, JSON and `node --check`, with no finding. |

## Cases

| Case | Layer, outcome | Result |
|---|---|---|
| GOV-942-CI-GATE-ALLOW | ci, allow | passed |
| GOV-942-CI-PATH-DENY | ci, deny, critical | passed |
| GOV-942-CI-STALE-ERROR | ci, error | passed |
| GOV-942-HOOK-EXECUTOR-DENY | hook, deny | passed |
| GOV-942-HOOK-SHELL-FORMS-DENY | hook, deny, critical | passed |

## Sensitivity (both through `cli.mjs sensitivity`, in memory, live files unchanged)

| Case | Break | Failed assertion | Restored |
|---|---|---|---|
| GOV-942-CI-PATH-DENY | `sensitivity/GOV-942-CI-PATH-DENY.break.json`: `norm === e.path && ` removed, so an entry matches by fingerprint alone | `one violation for src/modules/listings/actions/otherAction.ts`, expected 1, actual 0, `ERR_ASSERTION` | passed |
| GOV-942-HOOK-SHELL-FORMS-DENY | `sensitivity/GOV-942-HOOK-SHELL-FORMS-DENY.break.json`: `envFolder` returns its start folder, which stops R4 (c) in the parsed and lenient readings | `X reported for: env -C scripts/workflow-gates bash -c 'rm fixture-scope.mjs'`, `ERR_ASSERTION` | passed |

That break is not limited to R4 (c): `envFolder` also carries the reviewed Task 944 R8 (a) behaviour, which it stops too, and it cannot
stop the raw reading of R4 (c), a separate regular expression. The self-audit below breaks each R4 (c) branch alone. Both records were
rerun after the last change of the hook, a comment.

## Implementer self-audit (not a substitute for review)

`test-results/task942-impl/mutation-audit.mjs` (gitignored) ran 53 isolated in-memory breaks of R1, R2 and every R4 branch, with the
Task 944 register, writing no record. Final result: 0 survivors; 50 failed by assertion, 1 by timeout (a long `-0` run without the
lookaheads backtracks exponentially), 1 by exception (an object map instead of the `Map` throws on the word `constructor`), 1 with
no test result (a removed entry-point guard exits the test process at import, which `governance-report` reports as a missing case).
The first run of the 52 breaks then listed left nine survivors: six branches no design-list form reached (the R1 fallback of R4 (a)
and (b), which only a command inside backticks reaches, and the parsed API reading of R4 (c), which only an interpreter outside
`NESTED_SHELL` reaches), one fixture that could not see a removed guard, one control that checked too little and one badly placed
break, corrected in the audit. The test lists gained forms and controls for them, and `yarn install` now also proves it keeps
`package.json`.

A second pass, after the owner asked for this work to be checked, tested what the first one had assumed (scripts
`test-results/task942-impl/self-audit.mjs` and `self-audit-2.mjs`, gitignored):

| Check | Result |
|---|---|
| The design lists against the self-test, evaluated, not by eye | 45 of 45 forms, 32 of 32 controls |
| The differences from the prototype, run on the prototype of p10 | each confirmed: `env -C docs x; cd src; echo $y > a.ts` loses `src/a.ts` there and keeps it here |
| Each of five `env` spellings in five readings | 25 of 25 report X |
| Output, stderr and exit code of the HEAD gate (R1 allowlist applied) against the final gate | identical in strict, `--report` and `--verify-gate`, on the clean tree and with planted stale entries and violations |
| The entry-point guard under four spellings of the working directory and a dotted path | the gate runs each time |
| 16 hostile commands of about 50 000 characters against the new expressions | at most 241 ms, each close to the Task 944 hook |
| The R1 fingerprint and reason against the kickoff text | equal |
| `validateDiff` in phase verify on exactly the 14 written paths | `errors: []` |
| Every self-test duration against the runner's 180 s | 14.5 s for the whole suite |

One defect was found and fixed: the comment above the `perl` reading still said `0` takes an attached value.

**Not verified: a Linux run.** CI runs on Linux; every run here was native Windows, and this machine has no WSL distribution. The two new
self-test files pass 5 of 5 with `process.platform` shimmed to `linux`, which reaches the hook's POSIX branches but keeps the Windows
`node:path`, so it is partial evidence only. The first real Linux result is the Governance Check job of PR #12.

## Where the implementation differs from the design prototypes, and why

The prototypes were read, not pasted. All lists of AC6 pass; these differences each keep or widen the required result.

1. **Raw `env -C` no longer moves the shell's folder chain.** In the prototype it set `current`, so `env -C a x; cd b; …` lost `b` and
   broke the superset rule, and a second `env -C` resolved inside the first. Here it only adds a folder.
2. **`perl -0` anywhere in a cluster.** R4 (b) says "inside an option cluster"; the prototype's fallback read it only at the start.
   Each lookahead keeps a digit run in one piece, so `-000…` has one reading.
3. **The runner table is exact and a `Map`.** The prototype also accepted `npm dlx`, `pnpm x` and `yarn x`, outside the R4 (d) list. A
   plain object would throw on `constructor`.
4. **The raw reading runs on both spellings** of `\"`, so its result is a superset by construction.
5. **A negative keyword value** (`buffering=-1`) is read in (f) (i) and (ii).
6. **The lenient `env` folder follows nested levels**, and the raw reading accepts other `env` options before `-C` (`-i`, `-u NAME`).

## Corpus and timing (AC6)

`test-results/task943-prototype/corpus.json`, 2318 commands, sha256 `1eb5de48147f002a02d0f2f81530b6d544736980098b4c0a9db7080c5f0155b9`,
the Task 944 hook of HEAD against the final hook:
`corpus: dropped 0; with added targets 1; with an added guarded target 0; executor commands newly refused 0; with an added governance scope file 0; slowest final-hook call 6 ms`.
The one added target set is the unguarded `D/scripts/workflow-gates/security-hook.mjs` family, the same count as the prototype's C50.

Task 943 AC15 F8 on the final hook, native Windows: parsed 48900 characters with 5000 folder changes 1880 ms; parser-rejected 48901
characters 7232 ms; both under 15 s. Four commands with an `env -C` before a later `cd` or a second `env -C` drop no target.

## Write forms that stay undetected

Excluded by section 4 of the kickoff: a path or folder in a variable; a script file run by an interpreter; `-EncodedCommand`; a folder
change inside backticks or `$(…)`; a `.NET` file mode held in a variable; a redirection after `env -C`.

**New, for the approver.** A probe of `shellWriteTargets` on the final hook reports nothing for the 23 forms below. They are outside
R4, so they are unchanged here; C48 sends a newly found form to a revision, not to the implementer, and D13 asks that found holes be
closed. A decision is needed.

| Form | Row it is closest to |
|---|---|
| `python -c "open(mode='w', file='X')"` | R4 (f) (i), mode before file |
| `python -c "import os; os.removedirs(name='D')"` | R4 (f) (iii), that call's keyword is `name` |
| `powershell -Command "[IO.File]::Open('X', 2)"` | R4 (e), a numeric mode |
| `powershell -Command "[IO.File]::Open('X', [IO.FileMode]'Create')"` | R4 (e), a cast mode |
| `powershell -Command "[IO.File]::Create(ˋ"Xˋ")"` | R4 (f) (iv), the PowerShell quote escape |
| `/usr/bin/env -C D bash -c 'rm N'` | R4 (c), `env` by path |
| `env --unset HOME -C D python -c "open('N','w')"` | R4 (c), raw reading of a long option with a value |
| `env -C D bash -c "bash -c 'rm N'"` | R4 (c), a second quoted nesting keeps its quotes in the lenient reading |
| `npm exec --package foo -- touch X` | R4 (d), `--package` takes a value; these options are shared with `npx`, whose reviewed reading was left unchanged |
| `npm --prefix . exec rimraf X` | R4 (d), a manager option before `exec` |
| `pnpm -C . exec rimraf X` | R4 (d), the same |
| `npm exec -c 'rimraf X'` | R4 (d), the command text of a runner |
| `npm exec --call 'rm X'` | R4 (d), the same |
| `npx -c 'rm X'` | the same in the Task 944 reading of `npx` |
| `pnpm rimraf X` | R4 (d), a local program named directly, as `yarn rimraf` is |
| `bun rimraf X` | R4 (d), the same |
| `yarn run rimraf X` | R4 (d), through `run` |
| `npm run rimraf X` | R4 (d), through `run`; it runs a package script of that name, so it may not reach the program |
| `env -iC D bash -c 'rm N'` | R4 (c), `-C` inside an `env` option cluster |
| `python -c "import os; os.open('X', os.O_WRONLY)"` | R4 (e), a flag constant in place of a quoted mode |
| `node -e "require('fs').openSync('X', require('fs').constants.O_WRONLY)"` | R4 (e), the same |
| `python -c "open('X', **{'mode': 'w'})"` | R4 (f) (i), an unpacked keyword |
| `python -c "import os; os.chdir('D'); os.system(\"rm N\")"` | R4 (f) (iv), `\"` in a child-process call, which it does not list |

A probe shows `grep "ˋrmˋ" docs/x.md` now reports `docs/x.md`, which the Task 944 hook did not: a false positive for a search text that
the required backtick reading of R4 (a) brings. The corpus result above has no added guarded target, so it holds no such command.

## Other observations

- A failing or skipped entry-point guard makes the gate print nothing and exit 0. GOV-942-CI-GATE-ALLOW asserts the output, so such a
  failure cannot pass the self-tests. The guard text is the literal one of R2.
- `node scripts/workflow-gates/cli.mjs diff --base <HEAD> --working-tree` stops at `Approved development project identity is required
  for boundary tests`. It is no AC of this task and the local run has no such environment; the same run no longer names this contract.
- `publication.mjs --base HEAD`: `Publication candidate: 92 explicit files, 0 dependency errors.`

## AC6 forms

**The forms list of p07-shell-forms-run.mjs** (29 forms)

| Form (X, D, N of AC6; a backtick shown as ˋ) | X reported | Independence | Executor refused |
|---|---|---|---|
| `echo ˋrm Xˋ` | yes | yes | yes |
| `echo ˋcp docs/N Xˋ` | yes | yes | yes |
| `perl -0pi -e 's/a/b/' X` | yes | yes | yes |
| `perl -0777pi -e 's/a/b/' X` | yes | yes | yes |
| `perl -0x1Fpi -e 's/a/b/' X` | yes | yes | yes |
| `perl -0pi -e 's/a/b/' X '` | yes | yes | yes |
| `env -C D bash -c 'rm N'` | yes | yes | yes |
| `env --chdir=D bash -lc 'rm N'` | yes | yes | yes |
| `env --chdir D sh -c 'rm N'` | yes | yes | yes |
| `env -C D python -c "open('N','w')"` | yes | yes | yes |
| `env -C D node -e "require('fs').rmSync('N')"` | yes | yes | yes |
| `env -C D bash -c 'rm N'; echo '` | yes | yes | yes |
| `npm exec rimraf X` | yes | yes | yes |
| `npm exec --yes -- rimraf X` | yes | yes | yes |
| `npm x rimraf X` | yes | yes | yes |
| `pnpm exec rimraf X` | yes | yes | yes |
| `pnpm dlx rimraf X` | yes | yes | yes |
| `yarn rimraf X` | yes | yes | yes |
| `yarn exec rimraf X` | yes | yes | yes |
| `yarn dlx rimraf X` | yes | yes | yes |
| `bun x rimraf X` | yes | yes | yes |
| `yarn shx rm X` | yes | yes | yes |
| `python -c "open(file='X', mode='w')"` | yes | yes | yes |
| `python -c "open(file='X', 'a')"` | yes | yes | yes |
| `python -c "import os; os.removedirs('D')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X','Create')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X','Append')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X',[IO.FileMode]::Truncate)"` | yes | yes | yes |
| `powershell -Command "[System.IO.File]::Open('X','OpenOrCreate')"` | yes | yes | yes |

**The forms list of p10-more-forms-run.mjs** (16 forms)

| Form (X, D, N of AC6; a backtick shown as ˋ) | X reported | Independence | Executor refused |
|---|---|---|---|
| `python -c "open('X', buffering=1, mode='w')"` | yes | yes | yes |
| `python -c "open('X', encoding='utf8', mode='w')"` | yes | yes | yes |
| `python -c "open('X', newline='', mode='a')"` | yes | yes | yes |
| `python -c "open(file='X', encoding='utf8', mode='w')"` | yes | yes | yes |
| `node -e "fs.open('X', encoding='utf8', flags='w')"` | yes | yes | yes |
| `python -c "from pathlib import Path; Path('X').open(mode='w')"` | yes | yes | yes |
| `python -c "from pathlib import Path; Path('X').open(encoding='utf8', mode='a')"` | yes | yes | yes |
| `python -c "import shutil; shutil.rmtree(path='D')"` | yes | yes | yes |
| `python -c "open(\"X\", 'w')"` | yes | yes | yes |
| `python -c "open(\"X\", \"w\")"` | yes | yes | yes |
| `python -c "open(\"X\", mode=\"w\")"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Create(\"X\")"` | yes | yes | yes |
| `powershell -Command "[IO.File]::OpenWrite(\"X\")"` | yes | yes | yes |
| `python -c "from pathlib import Path; Path(\"X\").unlink()"` | yes | yes | yes |
| `node -e "require(\"fs\").openSync(\"X\", \"w\")"` | yes | yes | yes |
| `python -c "import shutil; shutil.rmtree(\"D\")"` | yes | yes | yes |

**Spellings of the same rows beyond the two design lists** (21 forms)

| Form (X, D, N of AC6; a backtick shown as ˋ) | X reported | Independence | Executor refused |
|---|---|---|---|
| `echo ˋrmˋ X` | yes | yes | yes |
| `echo ˋperl -0pi -e 's/a/b/' Xˋ` | yes | yes | yes |
| `echo ˋperl -0777pi -e 's/a/b/' Xˋ` | yes | yes | yes |
| `echo ˋperl -0x1Fpi -e 's/a/b/' Xˋ` | yes | yes | yes |
| `echo ˋperl -n0pi -e 's/a/b/' Xˋ` | yes | yes | yes |
| `perl -n0pi -e 's/a/b/' X` | yes | yes | yes |
| `perl -n0pi -e 's/a/b/' X '` | yes | yes | yes |
| `perl -l0777pi -e 's/a/b/' X` | yes | yes | yes |
| `env -C D bun -e 'require("fs").rmSync("N")'` | yes | yes | yes |
| `env -C scripts bun -e 'require("fs").rmSync("workflow-gates", { recursive: true })'` | yes | yes | yes |
| `env -i -C D python -c "open('N','w')"` | yes | yes | yes |
| `env -u HOME -C D python -c "open('N','w')"` | yes | yes | yes |
| `env -C docs python -c "print(1)"; env -C D python -c "open('N','w')"` | yes | yes | yes |
| `env -C scripts bash -c 'env -C workflow-gates rm N'` | yes | yes | yes |
| `env -C scripts bash -c 'env -C workflow-gates eval rm N'; echo '` | yes | yes | yes |
| `env -C D python -c 'open("N","w")'` | yes | yes | yes |
| `python -c "open('X', buffering=-1, mode='w')"` | yes | yes | yes |
| `python -c "from pathlib import Path; Path('X').open(buffering=-1, mode='w')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X',[FileMode]::CreateNew)"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X',[System.IO.FileMode]::OpenOrCreate)"` | yes | yes | yes |
| `perl -pi -e's/a/b/' X` | yes | yes | yes |

Controls: 45 of 45 report no X.

## Final status

IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW

## Revision 4

Session: a fresh Opus implementation session (D1), 2026-11-04, native Windows 11, Node v22.22.3, cwd the project root, branch
`task/935-governance-approval-route`, base HEAD `4d2aa74f75da34e88872750c99eb79b545572aad`; the hook there equals C60. `git status --short
scripts` printed nothing before the first write. Route started at section 6 step 3. The prompt router labelled this session an
implementation review; the owner's instruction assigned the implementer role, so no review or verdict was made here. Everything
above this section is the record of R1 to R5 and is unchanged.

### Status per requirement

| R | Changed files | Evidence | Status |
|---|---|---|---|
| R6 | `scripts/workflow-gates/security-hook.mjs` through the Edit tool, each Edit passing the Task 944 guard | GOV-942-HOOK-SHELL-CLASSES-DENY, tables below | done |
| R7 | the same | the same | done |
| R8 | the same | the same, `sensitivity/GOV-942-HOOK-SHELL-CLASSES-DENY.txt` | done |
| R9 | the same | the same | done |
| R10 | new `scripts/workflow-gates/shell-forms-classes.selftest.mjs`, not in `publication.json` | the sixth case, the break table, the undetected list | done |

### Acceptance criteria

| AC | Result |
|---|---|
| AC1 | Rerun: `node scripts/check-listing-visibility.mjs` exit 0 with `0 violations` and `Allowlist: 8 entries, 0 stale.`; `npm run check:listing-visibility` exit 0; `npm run check:listing-visibility:verify` `34 passed, 0 failed`. `impl/gate-after.txt` is unchanged, because the gate is. |
| AC5 | `selftests.mjs` exit 0: base of `impl/base-runs.txt` 201, base of `impl/base-runs-r6.txt` 206, final 207 passed, 0 failed, 0 skipped, so 6 more than the first base. `git diff --exit-code c00337ef5` on every `scripts/workflow-gates/*.selftest.mjs` committed at C60 and on `publication.json` exit 0. `check-workflow.mjs` exit 0. ESLint on `scripts/workflow-gates` exit 0. `governance-report` passed 6 of 6. `verify` exit 0 at stage implemented. **Open for the approver:** the Governance Check job of PR #12 after Task 937. |
| AC6 | GOV-942-HOOK-SHELL-FORMS-DENY passed and its sensitivity was rerun on the final hook, because its target changed. |
| AC7 | **Not run: it follows the approver's rebases.** |
| AC8 | GOV-942-HOOK-SHELL-CLASSES-DENY passed. The `forms(x, d, n)` list and the head of the `CONTROLS` list of the self-test equal the p11 file as text (`A` of `test-results/task942-r6/verify-r6.txt`). 44 of the 47 forms were missed by the hook of C60. Every form, control and break is below. |
| AC9 | Corpus and timing below. **Open for the approver:** the Governance Check job of PR #12, the first Linux run of these self-tests. |
| Q1 (`docs/qa-profiles.md`) | `npm run build` exit 0 on this hook, `Compiled successfully`. No TypeScript source changed, so no typecheck applies. `check:file-integrity:all` and `check:mojibake` exit 1 on this dirty working tree and neither output names a file of this task, as in the R1 to R5 run. Each written file was checked one by one for NUL, BOM, invalid UTF-8, CR, Cyrillic, mojibake patterns, JSON and `node --check`, with no finding. `publication.mjs --base HEAD`: `Publication candidate: 92 explicit files, 0 dependency errors.` |

### Sensitivity (through `cli.mjs sensitivity`, in memory, live files unchanged)

| Case | Break | Failed assertion | Restored |
|---|---|---|---|
| GOV-942-HOOK-SHELL-CLASSES-DENY | `sensitivity/GOV-942-HOOK-SHELL-CLASSES-DENY.break.json`: the option walk of R8 removed | `X reported for: npm --prefix . exec rimraf scripts/workflow-gates/fixture-scope.mjs`, `ERR_ASSERTION` | passed |
| GOV-942-HOOK-SHELL-FORMS-DENY | the unchanged spec of R4 (c), rerun | `X reported for: env -C scripts/workflow-gates bash -c 'rm fixture-scope.mjs'`, `ERR_ASSERTION` | passed |

The record of GOV-942-CI-PATH-DENY stays: its target, the gate, did not change.

### Where the implementation differs from the design prototype, and why

The prototype was read, not pasted. Its lists pass in full. Each difference keeps or widens a required result, and each is pinned by a
form or control of the self-test.

1. **A call the bound cuts counts as a write.** With the scan bound of the prototype, `open('X',<5000 blanks>'w')` loses X, which the
   unbounded expressions of the R4 hook report, so section 5 would break. A cut open call now reports its path. The cost is deliberate:
   `open('X',<5000 blanks>'r')` is reported too. The end of the text is no cut.
2. **All values of a repeated keyword count.** The map of the prototype keeps the last one, so `open('X', mode='w', mode='r')` would lose
   X. The file keyword keeps the first, like the replaced expression.
3. **A quoted mode is the text that starts the argument.** The prototype takes the first quoted text anywhere in it, so
   `require('graceful-fs').constants.O_RDONLY` reads as a write through the `a` of the module name. A leading text keeps
   `open('X', 'w' if a else 'r')`, which the replaced expression reported, and a constant is read first.
4. **A number counts only in a flags position.** The `mode` of `os.open` is the permission of a new file, so `mode=511` writes nothing.
   The prototype reads a number only in decimal; `Number` also reads `0o1` and `0x41`.
5. **The raw `env` word cannot start with `-`.** With the prototype's prefix, a word such as `-/env` reads both as an `env` word and as an
   option of it, so `-/env -C docs …` moves a folder and a run of them scans quadratically. Measured on the same input of 2000, 4000,
   8000 and 16000 words: prototype 121, 406, 1594 and 6679 ms, final 11, 9, 17 and 32 ms. The `(?!-)` closes both. An assertion pins the
   folder and the hostile command of 16000 words pins the time.
6. **The nested words are read by a function, not by one expression.** It keeps brackets in a word (`src/app/(group)/x.ts`, which the
   reading it replaces kept), keeps a quote that never closes (`it's`), joins `a'b c'` as a shell does, and keeps the rule of Task 944 R8
   (e): a quoted word is literal, so a quoted `*` of a nested text expands to nothing. The prototype expands it, which adds targets.
7. **A literal `**{…}` reads as keywords**, so its `'file'` counts too, through the one reader. `FileMode` and `FileAccess` numbers are
   also read quoted or cast (R6 (c), "in any spelling").
8. **`commandName` also names the program** of `programTargets` and the `xargs` program, the same expression written twice before.
9. **`--call=` is read as the tool reads it.** The prototype takes the first of a repeated `--call=`, so `npx --call='cat a' --call='rm X'`
   loses X; the last one runs. An empty `--call=` is no text, so `npx --call= eval touch a` keeps its reading. A runner's own words stay a
   reading, so a program after `--call=` keeps its targets, as at C60.

The claims 1 to 6 were executed on the prototype, the hook of C60 and the final hook (`test-results/task942-r6/claims-probe.mjs`).

### An inherited defect, fixed here

`env -C` with no word after it made `shellWriteTargets` throw a `TypeError` at C60, in 27 of 130 truncated command lines, because
`envFolder` walks to the index of `programIndex`, which runs past the last word. R7 would have widened it to 33 through `-iC`. A throw
is a fail-closed refusal at PreToolUse, but `governanceIndependenceErrors` reads every command of a transcript, so one such command
would break that check. The walk now stops at the last word: 0 of 130 throw, and no random command of the fuzz below throws (C60: 41 of
240000).

### Two more corrections than section 5 lists, for the approver

Section 5 names one correction, the value of `--package`. R7 and R9 bring two more, each required by the row it follows.

1. R9, in the lenient reading only: a word of a nested text no longer keeps its quote characters. For `bash -c "rm 'X'"; echo $y` the
   hook of C60 reported the path `'X'`, with the quotes, which names no file; the final hook reports X. For `'a b'` it reported the two
   halves `'a` and `b'`; the final hook reports the one word.
2. R7, in the raw reading only: `--unset` and `--split-string` take a value, so in `env --unset -C docs …` the `-C` is a name, not a folder
   change. The hook of C60 moved the folder there.

Apart from these, no target of C60 is lost, and the frozen corpus drops nothing. The kickoff text was not changed, because this session
cannot revise it.

### Corpus, differential and timing (AC9)

`test-results/task943-prototype/corpus.json`, 2318 commands, sha256 `1eb5de48147f002a02d0f2f81530b6d544736980098b4c0a9db7080c5f0155b9`,
the hook of C60 against the final hook, native Windows:
`corpus: dropped 0; with added targets 0; with an added guarded target 0; executor commands newly refused 0; with an added governance scope file 0; slowest final-hook call 9 ms`.

A seeded differential of 66000 generated commands (open calls in every shell, wrappers and runners before writers, quoted nested texts):
`lost a target 0; a target with a quote character in it now read without it 1686, of which half of a quoted word that is now one word 40; gained a target 3153`.
The script is `test-results/task942-r6/verify-r6.mjs` (gitignored).

A random fuzz of six seeds of 40000 commands each, from a list of option words, programs, quotes and separators
(`test-results/task942-r6/fuzz-nothrow.mjs`): 0 exceptions on the final hook against 41 on C60; 1 lost target, the second correction above.
It found two regressions of this implementation, fixed: difference 9, the program after `--call=` and the empty `--call=`. Its slowest
final call was 2.5 s, a `**{ ..` glob that takes the same time on C60.

Task 943 AC15 F8 on the final hook: parsed 48900 characters with 5000 folder changes 2241 ms; parser-rejected 48901 characters 9060 ms;
both under 15 s. The `hostile` commands of the p11 file, about 50 000 characters each, and five added here (`env words` is 96 000), in ms:

| Command | ms | Command | ms |
|---|---|---|---|
| open calls | 622 | env path | 17 |
| open commas | 5 | nested | 5 |
| open brackets | 2 | escaped | 6 |
| unclosed quote | 1 | backtick quotes | 2 |
| path open | 381 | env words (added) | 46 |
| net open | 8 | runner text (added) | 3 |
| manager options | 42 | call keywords (added) | 5 |
| env cluster | 16 | spread (added) | 3 |
| env options | 38 | open quotes (added) | 3 |

The self-test also holds each hostile command under 5 s. Timing limits of this kind can only be measured, so the first Linux run is the
real check of them.

### Write forms that stay undetected

Excluded by section 4: a path or folder in a variable; a script file run by an interpreter; `-EncodedCommand`; a folder change inside
backticks or `$(…)`; a `.NET` file mode held in a variable; a redirection after `env -C`; a `.NET` stream constructor or the file API of
an interpreter outside section 5.

**New, for the approver (C48).** A probe of `shellWriteTargets` on the final hook (`test-results/task942-r6/undetected-probe.txt`) reports
nothing for the forms below. They are outside R6 to R9, so they are unchanged here; a new form goes to a revision, which this session
cannot write. CI stays the barrier (C24, C62).

| Form | Class |
|---|---|
| `python -c "open('X', mode=m)"`, `node -e "fs.openSync('X', w)"` | a mode held in a variable |
| `python -c "open('X', **opts)"`, `python -c "open('X', **dict(mode='w'))"`, `python -c "open('X', *['w'])"` | keywords that are no literal `**{…}` |
| `python -c "import os; os.open(path='X', flags=os.O_WRONLY)"` | the `path=` keyword of `os.open`; R6 (a) names `file=` only |
| `python -c "import os; os.open('X', 1 \| 64)"` | a flag expression of numbers |
| `node -e "fs.openSync(ˋXˋ, 'w')"` | a JavaScript template literal as the path |
| `bash -c "python -c \"open(\\\"X\\\", 'w')\""` | a second level of escaped quotes; R9 reads one |
| `env -S 'rm X'`, `env --split-string='rm X'` | the command text of `env -S` |
| `"env" -C D python -c "open('N','w')"` | a quoted `env` word in the raw reading |
| `npm exec -w app -- rimraf X`, `npm exec --workspace app rimraf X`, `pnpm exec --filter app rimraf X` | a value option of the manager after the subcommand; R8 names those before it |
| `pnpm --package foo dlx rimraf X` | `--package` before the subcommand; R8 lists it for the runners, not for the manager's own options |
| `yarn workspace app rimraf X`, `yarn workspace app exec rimraf X` | the `workspace` subcommand of `yarn` |
| `npm --prefix=. run rm X` | deliberate: `<manager> run` runs a package script, and R8 reads it as a program only before `rimraf` or `shx` |
| `npm.cmd exec rimraf X`, `npx.cmd rimraf X`, `pnpm.cmd exec rimraf X`, `npm.ps1 exec rimraf X` | the Windows launchers; R7 names `.exe` only, and on native Windows these are the real files |
| `pnpm run --silent rimraf X`, `npm run -- rimraf X` | an option between `run` and the program; R8 reads `run` directly before it |
| `npx -c 'cat a' -c 'rm X'` | a repeated `-c`; difference 9 reads the last of `--call=` only |

The Windows launchers matter most of these on this project's platform; a revision may want them first.

Two results of the same classes run the other way and are reported as writes: a lower-case `[IO.File]::open('X', 3)`, which also reads as
an `open(` call with a flag number, and the cut call of difference 1. The false positive of a backtick search text noted for R4 stays.
Both were executed in `test-results/task942-r6/claims-probe.mjs`.

### Implementer self-audit (not a substitute for review)

`test-results/task942-r6/mutation-audit.mjs` (gitignored) ran 135 isolated in-memory breaks, chosen by hand, one per branch of R6 to R9, each
against GOV-942-HOOK-SHELL-CLASSES-DENY and GOV-942-HOOK-SHELL-FORMS-DENY, with the Task 944 register, writing no record. Before the
breaks it requires both cases to pass plainly and through the load hook with a null break. The table is at the end of this section.

**A hand-chosen list only tests what its author thought of.** After the first handoff, on the owner's request to check the quality of
this work, `test-results/task942-r6/auto-mutants.mjs` generated breaks mechanically from every added code line of the hook. Its first
run left 60 survivors of 274, so the earlier `0 survivors` said nothing about completeness. Those runs and the fuzz then found four defects
of the code, all fixed, and many gaps of the test, all closed. The final run:

`added code lines 134; mutants 284; assertion 217; exception 48; timeout 2; killed only by the rest of the suite 4; unloadable 4; SURVIVED 9`

Most of the 48 exceptions are mechanical typos of a variable name, so they prove little. The 9 survivors:

| Survivors | Why they stand |
|---|---|
| 7: `?? ''` as `\|\| ''`; `file ??` as `file \|\|`; `[dD]` as `[d]` and `[D]` under the `i` flag; the `-[i0v]*C` lookahead without `i`, `0` or `v` | equivalent: each compiled as a module gives the same result as the final hook on 2318 corpus and 134 directed commands (`test-results/task942-r6/equivalence.txt`). This is evidence, not a proof. |
| 2: `m[2]` for `m[1]` of `API_PATHLIB`; `!depth < 3` of the child-process calls | inherited logic on a line this task only touched; not a branch of R6 to R9 |

The errors of this audit, in order, recorded because each earlier result meant nothing:

1. The first run reported 131 of 131 killed. That was false: a control I had just added failed on the live hook, so every break failed
   with it. The baseline guard above was added then, and that control was removed with the expression it tried to pin, which was an
   equivalent branch.
2. The next run left 11 survivors, each a form or a control missing from the test. Example: the bracket form passed through the R1 path
   fallback, so it needed an extension outside `PROJECT_FILE`. The same trap hid the `--call=` assertion later.
3. I then took the plain text of R9 for an equivalent break and removed that break from the audit. The differential showed 718 different
   results out of 22318, so the claim was wrong; the break is back and an assertion pins it.
4. An assertion that was true only on Windows (a path split by `/` where POSIX keeps `\`) was corrected before the first Linux run.
5. The first handoff claimed `0 survivors`, said the timing of difference 5 was pinned when no test could fail on it, and said `9`
   differences where this report had 8. This section replaces those statements.

**Not verified: a Linux run.** The sixth case passes 1 of 1 with `process.platform` shimmed to `linux`, which reaches the POSIX branches of
the hook but keeps the Windows `node:path`, so it is partial evidence only. The first real Linux result is the Governance Check job of
PR #12.

### AC8 forms

**The forms list of p11-class-forms-run.mjs** (47 forms, 47 with all three results)

| Form (X, D, N of AC6; a backtick shown as ˋ) | X reported | Independence | Executor refused |
|---|---|---|---|
| `python -c "open(mode='w', file='X')"` | yes | yes | yes |
| `python -c "import os; os.removedirs(name='D')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 2)"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', [IO.FileMode]'Create')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Create(ˋ"Xˋ")"` | yes | yes | yes |
| `/usr/bin/env -C D bash -c 'rm N'` | yes | yes | yes |
| `env --unset HOME -C D python -c "open('N','w')"` | yes | yes | yes |
| `env -C D bash -c "bash -c 'rm N'"` | yes | yes | yes |
| `npm exec --package foo -- touch X` | yes | yes | yes |
| `npm --prefix . exec rimraf X` | yes | yes | yes |
| `pnpm -C . exec rimraf X` | yes | yes | yes |
| `npm exec -c 'rimraf X'` | yes | yes | yes |
| `npm exec --call 'rm X'` | yes | yes | yes |
| `npx -c 'rm X'` | yes | yes | yes |
| `pnpm rimraf X` | yes | yes | yes |
| `bun rimraf X` | yes | yes | yes |
| `yarn run rimraf X` | yes | yes | yes |
| `npm run rimraf X` | yes | yes | yes |
| `env -iC D bash -c 'rm N'` | yes | yes | yes |
| `python -c "import os; os.open('X', os.O_WRONLY)"` | yes | yes | yes |
| `node -e "require('fs').openSync('X', require('fs').constants.O_WRONLY)"` | yes | yes | yes |
| `python -c "open('X', **{'mode': 'w'})"` | yes | yes | yes |
| `python -c "import os; os.chdir('D'); os.system(\"rm N\")"` | yes | yes | yes |
| `python -c "open(mode='a', encoding='utf8', file='X')"` | yes | yes | yes |
| `python -c "from pathlib import Path; Path('X').open(**{'mode': 'a'})"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 6)"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 'Open', 'Write')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite)"` | yes | yes | yes |
| `/usr/bin/env -C D python -c "open('N','w')"` | yes | yes | yes |
| `/usr/bin/sudo rm X` | yes | yes | yes |
| `env --unset=HOME -C D bash -c 'rm N'` | yes | yes | yes |
| `env -iCD bash -c 'rm N'` | yes | yes | yes |
| `env -iC D python -c "open('N','w')"` | yes | yes | yes |
| `env -vi -C D bash -c 'rm N'` | yes | yes | yes |
| `npm exec --package=foo -- touch X` | yes | yes | yes |
| `npx --package foo -- touch X` | yes | yes | yes |
| `pnpm --dir . dlx rimraf X` | yes | yes | yes |
| `yarn --cwd . exec rimraf X` | yes | yes | yes |
| `npm -w app exec rimraf X` | yes | yes | yes |
| `npm exec --call='rm X'` | yes | yes | yes |
| `pnpm exec -c 'rm X'` | yes | yes | yes |
| `pnpm run shx rm X` | yes | yes | yes |
| `bun run rimraf X` | yes | yes | yes |
| `yarn --cwd . rimraf X` | yes | yes | yes |
| `python -c "import os; os.open('X', os.O_CREAT \| os.O_TRUNC)"` | yes | yes | yes |
| `node -e "require('fs').openSync('X', 1)"` | yes | yes | yes |
| `python -c "import os; os.chdir(\"D\"); os.system('rm N')"` | yes | yes | yes |

**Spellings of the same rows beyond the design list** (131 forms, 131 with all three results)

| Form (X, D, N of AC6; a backtick shown as ˋ) | X reported | Independence | Executor refused |
|---|---|---|---|
| `python -c "open('X',<5000 blanks>'w')"` | yes | yes | yes |
| `python -c "open('X',<5000 blanks>mode='w')"` | yes | yes | yes |
| `python -c "from pathlib import Path; Path('X').open(<5000 blanks>'w')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X',<5000 blanks>'Create')"` | yes | yes | yes |
| `python -c "open('X',<5000 blanks>'r')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X',<5000 blanks>'Open')"` | yes | yes | yes |
| `python -c "open('X', mode='r', mode='w')"` | yes | yes | yes |
| `python -c "open('X', mode='w', mode='r')"` | yes | yes | yes |
| `python -c "open('X', 'w' if a else 'r')"` | yes | yes | yes |
| `python -c "open('X', encoding='a,b', mode='w')"` | yes | yes | yes |
| `python -c "open('X', encoding=')', mode='w')"` | yes | yes | yes |
| `python -c "open('X', opener=f(1, 2), mode='w')"` | yes | yes | yes |
| `python -c "open('X', opener=f[1, 2], mode='w')"` | yes | yes | yes |
| `python -c "open('X', opener={1, 2}, mode='w')"` | yes | yes | yes |
| `python -c "open(file='X', 'a')"` | yes | yes | yes |
| `python -c "open('X', 'x')"` | yes | yes | yes |
| `python -c "open('X', r'w')"` | yes | yes | yes |
| `python -c "open(r'X', 'w')"` | yes | yes | yes |
| `python -c "open(file='X', **{'mode': 'w'})"` | yes | yes | yes |
| `python -c "open(**{'file': 'X', 'mode': 'w'})"` | yes | yes | yes |
| `python -c "import os; os.open('X', flags=os.O_RDWR)"` | yes | yes | yes |
| `python -c "import os; os.open('X', **{'flags': os.O_APPEND})"` | yes | yes | yes |
| `python -c "import os; os.open('X', **{'flags': 1})"` | yes | yes | yes |
| `python -c "import os; os.open('X', flags=1)"` | yes | yes | yes |
| `python -c "import os; os.open('X', os.O_RDONLY \| os.O_CREAT)"` | yes | yes | yes |
| `python -c "import os; os.open('X', os.O_TRUNC)"` | yes | yes | yes |
| `python -c "import os; os.open('X', 0o1)"` | yes | yes | yes |
| `python -c "import os; os.open('X', 0x41)"` | yes | yes | yes |
| `node -e "fs.openSync('X', 'a+')"` | yes | yes | yes |
| `python -c "open(R'X', 'w')"` | yes | yes | yes |
| `python -c "open('X', R'w')"` | yes | yes | yes |
| `python -c "open(**{'file': 'X' , 'mode': 'w'})"` | yes | yes | yes |
| `python -c 'open("X", encoding=")", mode="w")'` | yes | yes | yes |
| `python -c "from pathlib import Path; Path('X').open('w')"` | yes | yes | yes |
| `python -c "from pathlib import Path; Path('X').open('r+')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 'CreateNew')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 'Create')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 'Append')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 'Truncate')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 'OpenOrCreate')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 1)"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 4)"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 5)"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', [IO.FileMode]2)"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', '2')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::open('X', [IO.FileMode]::Create)"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 3, 2)"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 3, 3)"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 'Open', [IO.FileAccess]2)"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 'create')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 'Open', 'write')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open('X', 'Open', 'readwrite')"` | yes | yes | yes |
| `env -vC D bash -c 'rm N'` | yes | yes | yes |
| `env -0vCD bash -c 'rm N'` | yes | yes | yes |
| `env -vC D python -c "open('N','w')"` | yes | yes | yes |
| `env -iS x -C D bash -c 'rm N'` | yes | yes | yes |
| `env -vu HOME -C D bash -c 'rm N'` | yes | yes | yes |
| `ENV -C D bash -c 'rm N'` | yes | yes | yes |
| `SUDO rm X` | yes | yes | yes |
| `NPM exec rimraf X` | yes | yes | yes |
| `env.exe -C D bash -c 'rm N'` | yes | yes | yes |
| `/usr/bin/env.exe -C D python -c "open('N','w')"` | yes | yes | yes |
| `env -0C D bash -c 'rm N'` | yes | yes | yes |
| `env -0iC D python -c "open('N','w')"` | yes | yes | yes |
| `env --unset HOME -C D bash -c 'rm N'` | yes | yes | yes |
| `env --split-string x -C D bash -c 'rm N'` | yes | yes | yes |
| `env -iu HOME -C D bash -c 'rm N'` | yes | yes | yes |
| `env -iu HOME -C D python -c "open('N','w')"` | yes | yes | yes |
| `env --split-string x -C D python -c "open('N','w')"` | yes | yes | yes |
| `env --chdir=D python -c "open('N','w')"` | yes | yes | yes |
| `env -0u HOME -C D python -c "open('N','w')"` | yes | yes | yes |
| `env -vu HOME -C D python -c "open('N','w')"` | yes | yes | yes |
| `env -iS x -C D python -c "open('N','w')"` | yes | yes | yes |
| `/usr/bin/sudo -u admin rm X` | yes | yes | yes |
| `/usr/bin/timeout 5 rm X` | yes | yes | yes |
| `ionice -c 2 rm X` | yes | yes | yes |
| `ionice -n 1 rm X` | yes | yes | yes |
| `ionice -p 1 rm X` | yes | yes | yes |
| `timeout -k 5 5 rm X` | yes | yes | yes |
| `stdbuf -i L rm X` | yes | yes | yes |
| `stdbuf -o L rm X` | yes | yes | yes |
| `stdbuf -e L rm X` | yes | yes | yes |
| `doas -u a rm X` | yes | yes | yes |
| `doas -C a rm X` | yes | yes | yes |
| `npx -p foo rm X` | yes | yes | yes |
| `pnpx -p foo rm X` | yes | yes | yes |
| `bunx -p foo rm X` | yes | yes | yes |
| `xargs -0 rm X` | yes | yes | yes |
| `pnpm RIMRAF X` | yes | yes | yes |
| `npm RUN rimraf X` | yes | yes | yes |
| `npx --call='cat a' --call='rm X'` | yes | yes | yes |
| `npx --call=cat mv X docs/N '` | yes | yes | yes |
| `npx --call= eval rm X` | yes | yes | yes |
| `npx --package foo rm X` | yes | yes | yes |
| `pnpx --package foo rm X` | yes | yes | yes |
| `bunx --package foo rm X` | yes | yes | yes |
| `bunx --package=foo rm X` | yes | yes | yes |
| `/usr/bin/npm exec rimraf X` | yes | yes | yes |
| `npm.exe exec rimraf X` | yes | yes | yes |
| `npm --workspace app x rimraf X` | yes | yes | yes |
| `pnpm --filter app exec rimraf X` | yes | yes | yes |
| `pnpm -F app dlx rimraf X` | yes | yes | yes |
| `yarn --dir . dlx rimraf X` | yes | yes | yes |
| `bun --cwd . x rimraf X` | yes | yes | yes |
| `npm --silent exec rimraf X` | yes | yes | yes |
| `yarn run shx rm X` | yes | yes | yes |
| `npm run shx rm X` | yes | yes | yes |
| `bun shx rm X` | yes | yes | yes |
| `pnpm --dir . rimraf X` | yes | yes | yes |
| `npx --call='rm X'` | yes | yes | yes |
| `npm x -c 'rm X'` | yes | yes | yes |
| `npm exec -c "bash -c 'rm X'"` | yes | yes | yes |
| `npm exec -c 'cd D; rm N'` | yes | yes | yes |
| `chdir D; python -c "open('N','w')"` | yes | yes | yes |
| `pushd D; python -c "open('N','w')"` | yes | yes | yes |
| `sl D; python -c "open('N','w')"` | yes | yes | yes |
| `push-location D; python -c "open('N','w')"` | yes | yes | yes |
| `Set-Location -Path D; python -c "open('N','w')"` | yes | yes | yes |
| `Set-Location -LiteralPath D; python -c "open('N','w')"` | yes | yes | yes |
| `cd /d D & python -c "open('N','w')"` | yes | yes | yes |
| `cd /D D & python -c "open('N','w')"` | yes | yes | yes |
| `node -e "process.chdir('D'); require('fs').rmSync('N')"` | yes | yes | yes |
| `python -c "import os; os.rmdir('D')"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Delete(ˋ"Xˋ")"` | yes | yes | yes |
| `powershell -Command "[IO.File]::Open(ˋ"Xˋ", 2)"` | yes | yes | yes |
| `powershell -Command "Set-Location ˋ"Dˋ"; [IO.File]::Create('N')"` | yes | yes | yes |
| `python -c "import subprocess; subprocess.run([\"rm\", \"X\"])"` | yes | yes | yes |
| `env -C D bash -c "bash -c 'bash -c \"rm N\"'"` | yes | yes | yes |
| `bash -c "rm 'X'"` | yes | yes | yes |
| `bash -c "rm '' 'X'"` | yes | yes | yes |
| `bash -c "bash -c \"rm 'X'\""` | yes | yes | yes |

Controls: 66 of 66 report no X.

### One break per branch of R6 to R9

`mutants 135; killed 135 (assertion 134, timeout 0, exception 1); survivors 0; invalid 0`

| Break | Failed with |
|---|---|
| R6 reader: quotes | assertion |
| R6 reader: quote closes | assertion |
| R6 reader: ( bracket | assertion |
| R6 reader: [ bracket | assertion |
| R6 reader: { bracket | assertion |
| R6 reader: closing ends the call | assertion |
| R6 reader: closing lowers the depth | assertion |
| R6 reader: top-level comma only | assertion |
| R6 reader: last argument | assertion |
| R6 reader: bound removed | assertion |
| R6 reader: cut never set | assertion |
| R6 reader: end of text is no cut | assertion |
| R6 reader: keyword | assertion |
| R6 reader: unpacked keywords | assertion |
| R6 keywordValues: all of a name | assertion |
| R6 keywordValues: last too | assertion |
| R6 stringValue: prefix | assertion |
| R6 stringValue: whole argument | assertion |
| R6 mode: O_WRONLY | assertion |
| R6 mode: O_RDWR | assertion |
| R6 mode: O_CREAT | assertion |
| R6 mode: O_TRUNC | assertion |
| R6 mode: O_APPEND | assertion |
| R6 mode: w | assertion |
| R6 mode: a | assertion |
| R6 mode: x | assertion |
| R6 mode: + | assertion |
| R6 mode: leading text only | assertion |
| R6 mode: the whole of a mode argument | assertion |
| R6 flags: number | assertion |
| R6 flags: zero | assertion |
| R6 flags: negative | assertion |
| R6 open: mode keyword | assertion |
| R6 open: mode keyword takes no number | assertion |
| R6 open: flags keyword | assertion |
| R6 open: positional mode | assertion |
| R6 open: cut | assertion |
| R6 open: file keyword | assertion |
| R6 open: mode after a file keyword | assertion |
| R6 open: only the next positional | assertion |
| R6 open: openSync | assertion |
| R6 pathlib: branch | assertion |
| R6 pathlib: positional mode | assertion |
| R6 net: branch | assertion |
| R6 net: cut | assertion |
| R6 net: case | assertion |
| R6 net: CreateNew | assertion |
| R6 net: Create | assertion |
| R6 net: Append | assertion |
| R6 net: Truncate | assertion |
| R6 net: OpenOrCreate | assertion |
| R6 net: Open reads | assertion |
| R6 net: ReadWrite | assertion |
| R6 net: Write | assertion |
| R6 net: Read writes | assertion |
| R6 net: access | assertion |
| R6 net: fourth argument | assertion |
| R6 net: number 1 | assertion |
| R6 net: number 2 | assertion |
| R6 net: number 3 reads | assertion |
| R6 net: number 4 | assertion |
| R6 net: number 5 | assertion |
| R6 net: number 6 | assertion |
| R6 net: access 2 | assertion |
| R6 net: access 3 | assertion |
| R6 net: access 1 reads | assertion |
| R6 net: cast number | assertion |
| R6 net: quoted number | assertion |
| R6 directory: name= | assertion |
| R6 directory: path= | assertion |
| R6 apiArguments: open targets | assertion |
| R7 name: folder | assertion |
| R7 name: .exe | assertion |
| R7 wrapper: by name | assertion |
| R7 wrapper value: cluster | assertion |
| R7 wrapper value: --unset | assertion |
| R7 env folder: env by name | assertion |
| R7 env folder: cluster | assertion |
| R7 env folder: attached | assertion |
| R7 env folder: next word | assertion |
| R7 raw: folder before env | assertion |
| R7 raw: .exe | assertion |
| R7 raw: an option word starts no env word | assertion |
| R7 raw: cluster with a value | assertion |
| R7 raw: --unset | assertion |
| R7 raw: --split-string | assertion |
| R7 raw: cluster before -C | assertion |
| R8 option walk | assertion |
| R8 option value | assertion |
| R8 value: --prefix | assertion |
| R8 value: -C | assertion |
| R8 value: --dir | assertion |
| R8 value: --cwd | assertion |
| R8 value: -w | assertion |
| R8 value: --workspace | assertion |
| R8 value: --filter | assertion |
| R8 value: -F | assertion |
| R8 runner | assertion |
| R8 runner options | assertion |
| R8 run | assertion |
| R8 run before any word | assertion |
| R8 direct | assertion |
| R8 direct for npm | assertion |
| R8 direct before any word | assertion |
| R8 tool: rimraf | assertion |
| R8 tool: shx | assertion |
| R8 manager by name | assertion |
| R8 map, not an object | exception |
| R8 package: npx | assertion |
| R8 package: pnpx | assertion |
| R8 package: bunx | assertion |
| R8 text: runner only | assertion |
| R8 text: --call= | assertion |
| R8 text: an empty --call= is no text | assertion |
| R8 text: -c | assertion |
| R8 text: --call | assertion |
| R8 text: evaluated | assertion |
| R8 text: the last --call= | assertion |
| R8 text: a program after --call= | assertion |
| R7 env folder: the end of the words | assertion |
| R9 reading: escaped quote | assertion |
| R9 reading: PowerShell quote | assertion |
| R9 reading: the plain text stays | assertion |
| R9 folders: readings | assertion |
| R9 api: readings | assertion |
| R9 directories: readings | assertion |
| R9 child calls: readings | assertion |
| R9 nested: word split | assertion |
| R9 nested: a closed quote goes | assertion |
| R9 nested: quoted is literal | assertion |
| R9 nested: blanks | assertion |
| R9 nested: an open quote stays | assertion |
| R9 nested: brackets stay | assertion |
| R9 literal: unquoted wins | assertion |
| R9 literal: unquoted first | assertion |

## Final status of revision 4

IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW
