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
