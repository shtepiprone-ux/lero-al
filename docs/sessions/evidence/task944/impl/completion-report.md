# Task 944 completion report (Opus governance implementer, D1)

Session: a fresh implementation session (not 3d40df28, 6f2564f3 or e50584bc), 2026-11-03, native Windows 11, Node v22.22.3,
branch `task/935-governance-approval-route`, HEAD `d17d9d5a86fcc1186c86e0d8f052fbd209829a64` (Task 943 committed; `git status
--short scripts` printed nothing before the first write). Base runs: `docs/sessions/evidence/task944/impl/base-runs.txt`
(192 self-tests, 192 pass, 0 fail, 0 skipped; `npm run build` exit 0), saved before the first write.

**Status: PARTIALLY IMPLEMENTED.** R1-R6, R8 and R9 are implemented as written and every AC command except AC10's first
command passes. AC10 fails on one finding of the kickoff itself (K1 below): R2 as written makes one existing self-test fail,
while section 4 and AC10 require every existing self-test file to pass unchanged. The implementer cannot resolve that
conflict (it is task design); the kickoff needs a revision before the task can be approved. AC11 (R7) belongs to the approver.

## K1. Kickoff conflict: R2 versus the unchanged existing self-tests (BLOCKED for a kickoff revision)

- Failing test: `scripts/workflow-gates/governance-contract.selftest.mjs`, the unnamed test `the governance report passes only on
  every mapped case and records current hashes and sensitivity` (line 162, not a GOV case name). Its fixture contract has task
  `tasks/gov_kickoff.md` (not in `SENSITIVITY_LEGACY_TASKS`), a critical case `GOV-T-HOOK-DENY` and a hand-written sensitivity
  record without `method`, `break` or `breakSha256`, and asserts `report.errors` is `[]` and status `passed`.
- R2 requires exactly this record to be refused (`GOV-T-HOOK-DENY: sensitivity must come from cli.mjs sensitivity (method is
  not in-memory)`), which AC4 (GOV-944-VAL-RECORD-DENY, "a record without method") tests. Section 4 ("every existing self-test
  file (each must pass unchanged)"), section 5 ("Preserved: every existing self-test and its expectations") and AC10
  (`selftests.mjs` exits 0; `git diff --exit-code` on every self-test file of the base) require the old test to stay green and
  unchanged. Both cannot hold; no reading of R2 keeps the test green without accepting a hand-written non-legacy record.
- The design baseline (C27, C28) and the p14/p15 prototypes ran no R2 prototype, so the conflict was not visible at design time.
- Final run: `node scripts/workflow-gates/selftests.mjs` exit 1; 201 tests, 200 pass, 1 fail (the test above), 0 skipped.
  It also makes the reviewed Task 935 contract's case test file fail as a whole process (its `governanceReport` requires exit 0).
- Revision candidate for the designer (not implemented here): add the in-memory fields to that one fixture record (a fixture
  break spec of GOV-T-HOOK-DENY, `method: 'in-memory'`, `break`, `breakSha256`), add the file to this task's scope, amend AC10's
  unchanged-file list, and add a `tests` rebase of the 935 contract to the approver's R7 (Task 940/943 machinery), as the 943
  K1 precedent did for its two Task 941 assertions. Alternatively an owner decision on another scope for R2.

## Per requirement

| Req | Status | Changed files | Evidence |
|---|---|---|---|
| R1 | implemented | `cli.mjs` (`runSensitivity`, `tapResultBlock`, command `sensitivity`), new `sensitivity-register.mjs`, new `sensitivity-hooks.mjs` | GOV-944-SENS-RUN-ALLOW, -DENY, -LIVE-ERROR; four artifacts |
| R2 | implemented as written; conflicts with K1 | `contract.mjs` (`SENSITIVITY_LEGACY_TASKS`, `inMemoryRecordErrors`, the check in `validateGovernanceReport`) | GOV-944-VAL-RECORD-ALLOW, -DENY; this task's own report passes R2 |
| R3 | implemented | `security-hook.mjs` (`hookModuleClosure`, `hookModuleSyntaxErrors`, the call in `evaluateHook`), new `hook-load-check.mjs` | GOV-944-HOOK-SYNTAX-DENY, -ALLOW, -CLOSURE-ERROR; `real-repo-guard.txt` |
| R4 | implemented | `.claude/rules/shared/task-readiness.md` section 4, `.claude/rules/review/02-adversarial-ui.md` R4 (6117 bytes, under 8 KiB) | the two sentences verbatim |
| R5 | implemented | new `sensitivity.selftest.mjs`, `hook-syntax.selftest.mjs`; `publication.json` lists the five R5 files | `publication.mjs --base HEAD`: 92 files, 0 dependency errors |
| R6 | implemented | four break specs and artifacts, `sensitivity.json` | every record `method: 'in-memory'`, made only by `cli.mjs sensitivity` |
| R7 | approver only | none | AC11 not run (approver) |
| R8 | implemented | `security-hook.mjs` (a)-(f) through the Edit tool, each Edit checked by the live R3 guard | GOV-944-HOOK-SHELL-FORMS-DENY; corpus and timings below |
| R9 | implemented | new `shell-forms.selftest.mjs` and its `publication.json` entry | 19 GOV-941/GOV-943 results all `ok` in the final run |

Implementation order: base runs; R1 modules; R2; `hook-load-check.mjs`; R3 added to the hook first without its call in
`evaluateHook` and probed on the real repository (closure, incident, block comment, C52, C53, a throwing reader, a valid hook
Edit), then the one-line call added; R8 Edits of the hook (each passed the guard); the three new self-test files; R4; R5;
sidecar; break specs; sensitivity runs; AC8 probe; governance report; implementer self-audit (below), its two fixes, and a
rerun of every proof on the final files. No break was planted in a live file: the digests of
`cli.mjs`, `contract.mjs` and `security-hook.mjs` were identical before and after all four final sensitivity runs
(cfbfacbb…, 9eb5df00…, 478a215f…), and `git grep -n "SENSITIVITY BREAK" -- scripts` prints nothing (the new test files use
the text `planted line comment`, so the grep also stays empty once they are committed).

## GOV-944 cases (`cli.mjs governance-report`: passed, 9 cases)

| Case | Result |
|---|---|
| GOV-944-SENS-RUN-ALLOW | passed |
| GOV-944-SENS-RUN-DENY | passed (15 named refusals: undetected break, incident line comment, TypeError without ERR_ASSERTION, find absent, find twice, replace equal to find, empty find, target outside scope and inputs, the test file as target, unknown case, non-critical case, malformed spec, spec outside the evidence tree, spec not in scope; product contract) |
| GOV-944-SENS-LIVE-ERROR | passed |
| GOV-944-VAL-RECORD-ALLOW | passed |
| GOV-944-VAL-RECORD-DENY | passed |
| GOV-944-HOOK-SYNTAX-DENY | passed (orchestrator and executor; plus an unparseable CommonJS closure module) |
| GOV-944-HOOK-SYNTAX-ALLOW | passed |
| GOV-944-HOOK-CLOSURE-ERROR | passed |
| GOV-944-HOOK-SHELL-FORMS-DENY | passed |

## Break specs and the failed assertion of each mutant (`docs/sessions/evidence/task944/sensitivity/`)

| Case | Break (target: find -> replace) | Mutant assertion |
|---|---|---|
| GOV-944-SENS-RUN-DENY | `cli.mjs`: the runner accepts a failed mutant without `ERR_ASSERTION` (`&& (true \|\| /code: 'ERR_ASSERTION'/…)`) | `error: 'typeError'`, `ERR_ASSERTION` (the TypeError variant gets a record) |
| GOV-944-VAL-RECORD-DENY | `contract.mjs`: every task treated as legacy (`… && false`) | `error: 'no method'`, `ERR_ASSERTION` |
| GOV-944-HOOK-SYNTAX-DENY | `security-hook.mjs`: an empty closure (`return [];`) | closure `[]` instead of the four fixture modules, `ERR_ASSERTION` |
| GOV-944-HOOK-SHELL-FORMS-DENY | `security-hook.mjs`: the R8 (a) keyword skip stopped (`if (false && SHELL_KEYWORD.test(word))`) | `error: 'X reported for: if true; then rm scripts/workflow-gates/fixture-scope.mjs; fi'`, `ERR_ASSERTION` |

Each artifact holds baseline (exit 0, ok), mutant (exit 1, not ok with `code: 'ERR_ASSERTION'`) and restored (exit 0, ok) TAP.

## Self-test totals and unchanged files

Base 192 / 192 pass. Final 201 tests: 200 pass, 1 fail (K1), 0 skipped; 9 new passing GOV-944 tests. `git diff --exit-code`
over all fifteen self-test files of the base exits 0. `check-workflow.mjs` exit 0; eslint exit 0; `publication.mjs --base HEAD`
0 dependency errors; `cli.mjs verify` exit 0 at stage implemented; `npm run check:kickoff-evidence` PASS.

## AC8 probe (`docs/sessions/evidence/task944/impl/real-repo-guard.txt`)

On the real repository, without writing: computed closure of 11 files, containing the 11 files of C23; incident line-comment Edit
of `contract.mjs` -> `HOOK MODULE SYNTAX` (`SyntaxError: Unexpected token 'if'`); block-comment Edit -> `[]`; hook importing a
file not written yet -> `HOOK MODULE SYNTAX` (`cannot find module`); `contract.mjs` without the `isEvidencePath` export ->
`HOOK MODULE SYNTAX` (`does not provide an export named 'isEvidencePath'`); live digests unchanged. One guard call takes about
60 ms.

## R8: AC12 forms and what stays undetected

Every AC12 form (revision 1 and the seven revision 2 `.promises.` forms) reports X and gives `GOVERNANCE INDEPENDENCE` for X;
each executor form with `scripts/check-example.mjs` (D `scripts`) is refused with `POLICY-EDIT AUTHORITY REQUIRED` or
`SECURITY TEST CONTRACT MISSING`; all 23 controls report no X and no independence error. Non-vacuity (self-audit): the
reviewed HEAD hook reports X for none of the 47 forms (`test-results/task944-impl/vacuity.mjs`, gitignored) and already
refuses 1 of the 47 executor forms. The backslash form
`xcopy Y D\ /Y` is asserted on win32 only: on Linux a backslash is a file-name character and xcopy does not exist there.
Frozen 2318-command corpus, final hook versus the reviewed 943 hook: 0 commands with a dropped target, 2 with added targets,
0 executor commands newly refused (C70 reproduced).
Still undetected (section 4, unchanged): a path in a variable, a script file run by an interpreter, `-EncodedCommand`, a folder
change through a variable, `-`, `~` or `popd`; Bash and PowerShell writes to a hook-loaded module are outside R3.

AC12 timings (Task 943 AC15 F8 commands, native Windows, final hook): after the corpus warm-up that 943 and p14 also had,
parsed 1941 ms and parser-rejected 7437 ms (reviewed 943 hook: 1930 ms and 7409 ms), both under 15 s. Finding for the reviewer, not caused by
this task: in a cold process the parsed command throws `Maximum call stack size exceeded` after about 980 ms with the final hook
and with the reviewed HEAD hook alike (`canonicalPath` recursion over 5000 missing folders); the hook process then fails closed
with `SECURITY GATE BLOCKED`. Parser-rejected cold: 7567 ms. Not changed here (R8 does not cover it).

## Implementer self-audit (owner request, same session; not an independent review, D2)

Defects found in this implementation and fixed:
- S1, R8 (d): the R1-fallback word for `perl` was case-insensitive and took any letter before `i`, so in a parser-rejected
  command a read such as `perl -Ilib -e 'print 1' X '` or `perl -Mstrict … X '` reported X as written (a false executor
  refusal; not a missed write). Fixed: case-sensitive, and `i` counts only before a letter that takes a value or a script
  (`I`, `M`, `m`, `d`, `D`, `x`, `0`, `e`, `E`), matching the parsed `perl` reading; the two parser-rejected controls were
  added to `shell-forms.selftest.mjs`. `-pi`, `-i.bak` and `-npi` are still reported.
- S2, R1 (f): the artifact replaced the mutant's `NODE_OPTIONS` file URL with a placeholder; it now records the exact command.
- Earlier in the session the new test files held the literal `SENSITIVITY BREAK`, which `git grep` (tracked files only) would
  have printed after the commit (AC9); they now use `planted line comment`.

Checked without a finding: the hook diff removes only the lines R3 and R8 replace (`isReadOnlyShellCommand` is untouched); the
mutant of each critical case fails the named test with the intended assertion and baseline and restored pass; `!`, a `-lc`
cluster in a parser-rejected command, a keyword before `env -C`, a leading xcopy switch and a recursive `.promises.rm` of a
directory are reported; the guard costs about 2 ms on a Write outside the closure and about 68 ms on a closure Edit.

Residual limits, stated for the reviewer (not required by the kickoff, unchanged):
- A mode written as an escaped quote inside a double-quoted script (`open('X', \"w\")`) is not read; the Task 943 API
  patterns have the same limit.
- R3 (a): a file-system read failure contributes nothing; a reader exception without a file-system error code (only the
  injected test reader) becomes `HOOK MODULE SYNTAX: guard error` for that write, which is how AC7's throwing reader is met.
- While one closure module is already unloadable on disk (written by a shell command, which R3 does not cover), an Edit of
  another closure module is refused until that module is repaired; the repairing Edit itself is allowed (AC6).
- A CommonJS dependency of an ESM closure module is linked as its `default` export only; the live closure has none.

IMPLEMENTATION RESULT: PARTIALLY IMPLEMENTED - K1 needs a kickoff revision before review.
