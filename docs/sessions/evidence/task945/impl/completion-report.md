# Task 945 completion report (Opus governance implementer, D1)

Session: a fresh implementation session, 2026-11-04, native Windows 11, Node v22.22.3, cwd the project root, branch
`task/935-governance-approval-route`, base HEAD `929558a66ce5446297ebe127f5a734e17bfc1953`. `git status --short scripts .claude` printed nothing
before the first write. Route started at section 6 step 2. This session designed nothing of this task.

## Status per requirement

| R | Changed files | Evidence | Status |
|---|---|---|---|
| R1 | new `scripts/workflow-gates/code-check.mjs` | GOV-945-HOOK-SHELL-WRITE-DENY, GOV-945-HOOK-CLEAN-ALLOW | done, with the corrections below |
| R2 | `code-check.mjs` | GOV-945-HOOK-WRITE-DENY | done |
| R3 | `code-check.mjs` | GOV-945-HOOK-IMPACT-DENY | done |
| R4 | `code-check.mjs` | GOV-945-HOOK-TIMEOUT-ERROR | done; the Linux kill branch is first proven by CI on PR #12 |
| R5 | new `scripts/workflow-gates/code-check.json` | GOV-945-HOOK-CLEAN-ALLOW | done, with deviation 1 below |
| R6 | new `scripts/workflow-gates/hook-differential.mjs`, `scripts/workflow-gates/hook-corrections.json` | GOV-945-HOOK-DIFFERENTIAL-DENY, the real run below | done |
| R7 | `.claude/settings.json`, `scripts/workflow-gates/check-workflow.mjs`, `scripts/workflow-gates/publication.json` | GOV-945-CI-SETTINGS-DENY | done |
| R8 | `CLAUDE.md`, `.claude/rules/shared/task-readiness.md` | AC8 below | done |
| R9 | new `scripts/workflow-gates/code-check.selftest.mjs`; this report; the sensitivity files | the eight cases; `impl/governance-report.json` | implementer part done; the five `scope` rebases and AC10 belong to the approver |

Paths under `impl/` and `sensitivity/` are relative to `docs/sessions/evidence/task945/`.

## Acceptance criteria

| AC | Result |
|---|---|
| AC1 | GOV-945-HOOK-SHELL-WRITE-DENY passed. |
| AC2 | GOV-945-HOOK-WRITE-DENY passed. |
| AC3 | GOV-945-HOOK-IMPACT-DENY passed under the real `tsc`: `error TS2345` for the signature, `error TS2307` for the rename and the deletion. |
| AC4 | GOV-945-HOOK-TIMEOUT-ERROR passed, including the real main as a process. |
| AC5 | GOV-945-HOOK-CLEAN-ALLOW passed, against the registry of deviation 5, not the exact rows of R5. |
| AC6 | GOV-945-HOOK-DIFFERENTIAL-DENY passed. `node scripts/workflow-gates/hook-differential.mjs` exit 0, `LOST 0`, 86367 commands, 0 exceptions, slowest 6 ms, old hook `5efddf6e…c17935`, 11.1 s, inside the 240000 ms of R4. `code-check.json` runs it only on `scripts/workflow-gates/security-hook.mjs`. The real main on a hook copy that drops the targets of `rimraf`: exit 1, `LOST 2290`, the commands listed; on an unchanged copy: exit 0, `LOST 0` (`test-results/task945-impl/differential-main-probe.mjs`). |
| AC7 | GOV-945-CI-SETTINGS-DENY passed. `check-workflow.mjs` exit 0. `publication.mjs --base HEAD` exit 0: `107 explicit files, 0 dependency errors`. |
| AC8 | The paragraph is in `## Automation` of `CLAUDE.md`, the two sentences close section 1 of `task-readiness.md`. `check-workflow.mjs` no error; `wc -c` of `task-readiness.md` 8185; `git status --short .claude/rules/shared/workflow-gates.md` prints nothing. |
| AC9 | GOV-945-HOOK-EXECUTOR-DENY passed. `selftests.mjs` exit 0. Five sensitivity records below. `governance-report` and `verify` as the last step of this route. No existing self-test file changed: the self-tests in `git status` are this task's four new ones. |
| AC10 | **Not run: it follows the approver's rebases and live proof.** Until the rebases exist the five reviewed contracts of R9 are stale by design (C50). |
| Q1 (`docs/qa-profiles.md`) | `npm run build` exit 0 in 86 s, run after the last edit of the tool, the registry and the self-tests; only this report, the sidecar's scope and the governance report came later, and none reaches the build. No TypeScript source changed; `tsc --noEmit` exit 0 anyway. The CI lint `eslint --config scripts/workflow-gates/eslint.config.mjs scripts/workflow-gates` exit 0. `check-file-integrity --files` on the written scripts and JSON: clean. |

## Cases

| Case | Layer, outcome | Result |
|---|---|---|
| GOV-945-HOOK-WRITE-DENY | hook, deny, critical | passed |
| GOV-945-HOOK-IMPACT-DENY | hook, deny, critical | passed |
| GOV-945-HOOK-SHELL-WRITE-DENY | hook, deny, critical | passed |
| GOV-945-HOOK-DIFFERENTIAL-DENY | hook, deny, critical | passed |
| GOV-945-HOOK-CLEAN-ALLOW | hook, allow | passed |
| GOV-945-HOOK-TIMEOUT-ERROR | hook, error | passed |
| GOV-945-CI-SETTINGS-DENY | ci, deny, critical | passed |
| GOV-945-HOOK-EXECUTOR-DENY | hook, deny | passed |

Self-tests: base 207 passed of 207 (`impl/base-runs.txt`), final 288 passed of 288, 0 failed, 0 skipped, 80 s against the runner's 180 s, and 116 s of it when other runs shared the machine. This task raised it from 18 s, so the approver should watch the margin on CI's slower runners, where it has not run. `code-check.selftest.mjs` holds the 8 mapped cases and the tests of the corrections below; deviations 7 and 8 add three self-test files.

## Sensitivity (all through `cli.mjs sensitivity`, in memory, live files unchanged, rerun after the last change of the tool)

| Case | Break | Failed assertion | Restored |
|---|---|---|---|
| GOV-945-HOOK-WRITE-DENY | the PostToolUse failure returns status 0 | `a lint failure refuses`, `ERR_ASSERTION` | passed |
| GOV-945-HOOK-IMPACT-DENY | the Stop failure returns status 0 | `and Stop refuses it`, `ERR_ASSERTION` | passed |
| GOV-945-HOOK-SHELL-WRITE-DENY | only a file a write tool names counts as changed | `a file changed directly, under a Bash event that names no file, is refused`, `ERR_ASSERTION` | passed |
| GOV-945-HOOK-DIFFERENTIAL-DENY | a lost target is not counted | `a new hook dropping a target reports it`, `ERR_ASSERTION` | passed |
| GOV-945-CI-SETTINGS-DENY | the registration check pushes no error | `removed from SessionStart`, `ERR_ASSERTION` | passed |

## Deviation from the kickoff, for the approver to accept or reject

1. **The PowerShell row of R5.** R5 names "the PowerShell parse command of `p05-registry-commands.mjs:14`", which ends `if($e){$e;exit 1}`. Executed on a broken script that form exits 1 with **no text**, because `exit` discards the output still being formatted (2 characters of output, `test-results/task945-impl/ps-stdin-probe.mjs`), which breaks the failing line R2 requires. C31, the ledger row that proves this check can fail, was observed on another form: `if($e){$e[0].Message;exit 1}` of `p06-each-check-can-fail.mjs:20`. The registry and the exact-rows assertion hold that proven form. The kickoff text was not edited.

2. **A whole-tree gate that names no file it checks (R5, R4).** R5 counts a non-zero exit of a `namesFile` gate only when its output names a changed file. Taken literally, a gate that crashes passes on every Stop. Executed: a fixture gate printing `Error: Cannot find module x` with exit 1 returned status 0. The tool now refuses with `could not finish (exit 1, and its output names no file it checks)` unless the output names a real file under the folders of the gate's row. A finding elsewhere still does not block, and AC5's two cases hold. The rule reads the real gate's output, so a test asserts its shape.
3. **A note a subagent received first (R3).** R3 says once per file version. Taken literally, a note goes to whichever agent stops first, and the main agent never sees it. Executed: `SubagentStop` status 2, then `Stop` status 0. A note given at `SubagentStop` is now held and given once at `Stop` as well, while that version is current.
4. **A missing state and the write that fired the event (R1).** R1 starts a baseline at that event. Taken literally, the baseline holds the file just written, and it goes unchecked. Executed: a failing write with no state returned status 0 at `PostToolUse` and at `Stop`. The file a write tool names is now left out of a new baseline; any other dirty file stays in it.
5. **The rows and roots of R5 (AC5).** R5 and AC5 fix the registry exactly, and the implementer first left it so and listed the gaps as open points. The owner then said, on 2026-11-04: "Just don't tell me that a new task has to be created." and asked whether the finished task checks superficially and misses holes. D25 says written code is always checked, so the measured holes were closed in this task. Real defects run through the real chain with the registry of R5 (`test-results/task945-impl/real-chain-first.txt`, gitignored) went unseen in these cases, each now stopped:
   - changed behaviour of a scanner in `scripts/` that its vitest test asserts: the gate suite does not reach it. Measured: `vitest related scripts/check-design-tokens.mjs --run` runs 2 files and 220 tests in 2.3 s, and no earlier self-test named that script. New row: `vitest related` for `scripts/*`, `scripts/lib`, `scripts/governance` and `scripts/rendered-state-census`. `scripts/workflow-gates` stays with the gate suite, whose tests are no vitest tests, so the note "no test reaches" would be false there.
   - a failing test and a type error in `scripts/__tests__/*.test.ts`: no row. New row `scripts/**/*.ts`.
   - a broken `tsconfig.json`, `package.json`, `vitest.config.ts` or `eslint.config.mjs`: outside the roots. New roots and rows, also for `next.config.ts`, `vitest.integration.config.ts`, `postcss.config.mjs`, both Sentry configs and `.storybook/`.
   - mojibake in a source or locale file: R5 left it to CI because the gate fails at this tree. As a whole-tree gate it counts only findings in changed files, the same rule as the design tokens, for about 22 s at Stop. An entry may name the `folders` it reports on, since this gate scans wider than its row.
   - a test left with `it.only`, which silently narrows a run: `--allowOnly=false`. This case was added after the first run, so its behaviour without the flag was not measured.

6. **What makes a check quieter (new, by the same owner words).** A registry key `quieting` names patterns counted in a changed file against its blob at HEAD: a test switched off, an assertion that accepts almost anything, assertions removed, a type check switched off, a rule switched off, garbled Cyrillic, which the mojibake gate's literal signatures do not hold. What the change adds stops the agent once per version with the file, line and text, also through a subagent's stop. It is a note and not a lasting refusal, because each has a legitimate use. Before it, all of these passed every check. It ran live on this session's own self-test, at a Stop: five lines hold `it.skip` as text of a fixture, which is right, and one was a real false positive on the file name `design-tokens-allowlist.json`, so the pattern now requires the marker's colon, with a test.

7. **Mutation check (owner, 2026-11-04: "add the mutation check to this task").** Nothing in R1 to R9 holds it. `mutation-check.mjs` breaks the written lines in memory, one kind of defect at a time, and asks whether the tests notice: through `mutation-loader.mjs` for plain Node and child processes and `mutation-vitest.config.mjs` for Vitest. The defect's text is stored in memory only, but a defect is code that runs and may write the disk: revision 1 (R15) reads the tree after each run and restores what changed. A run with the unchanged text comes first, which tells a broken harness and a file the tests never load from a survivor. Results are counted as caught, not caught, not tried or undecided, and only `caught` stays quiet. It stops the agent once per version, inside the 285 s the Stop hook leaves it.

8. **The OWASP flow (owner, 2026-11-05: "this concerns all tasks and all AI models").** New `.claude/rules/shared/secure-code-review.md`, linked from `.claude/rules/README.md`, `create/01-preflight.md`, `execute/02-implement.md`, `execute/03-validate-handoff.md`, `review/02-adversarial-ui.md`, `CLAUDE.md` and `AGENTS.md`. New `dependency-check.mjs` (a package name the registry does not hold, a new package or version too young, a lock file fetching elsewhere or with no hash, a new high or critical advisory). New `change-review.mjs` in the `static` group of `pipeline.json`, so CI and `prepush.mjs` run it for a change from any tool. `code-check.json` gains 22 `secure` rules, 5 of which refuse at the write: a private key, a live credential, a signed token, an invisible direction character, a secret under `NEXT_PUBLIC_`. New `audit-baseline.json` lists the 76 high and critical advisories open today as unresolved findings, not accepted risks.

9. **The sidecar's `scope` and two files outside it.** The new files were added to the sidecar's `scope`, and the kickoff text was not edited. `AGENTS.md` changed but is not in `scope`, because `contract.mjs:88` refuses it as "a product or unrelated path"; it is neither product nor policy, so no gate requires it there, and widening that validator for one file would touch every contract. `.codex/RULES.md` also changed but cannot be committed, since `.gitignore:90` holds `.codex/`. The rule first went only there, and a self-test read that file, which would have failed on CI alone. Found by reading the test, not by any run. `AGENTS.md` now carries the rule, and the self-test asserts each file naming the flow is not ignored.

## What the checks of deviations 7 and 8 found when run for real

Each result below came from a real run. Several green self-test runs preceded each of these defects.

| Found by | What it found | Now |
|---|---|---|
| Mutation check on my own strong test | `value <= 0` → `value <= 1` unseen | a case added |
| Mutation check on `dependency-check.mjs` | 35 of 89 not caught: every line that calls npm and reads its answer was untested, because the tests passed in fakes | npm replaced first on the PATH, so the real calls read real exit codes: 74 caught, 11 not caught, 4 not tried |
| Mutation check on `change-review.mjs` | 15 of 70 not caught, among them which file starts the package check and how the report decides it is empty | final: 66 of 71 caught, 0 not tried |
| The live tool | a `(?i)` rule made every call `COULD NOT RUN`, because JavaScript has no such form, and my earlier compile check had stripped the prefix | a `flags` field |
| The real review on 74 files | **8 minutes tried no defect at all:** each file's control ran a whole suite first | a command measured as dearer than a file's share is not run again, product code goes first, the whole suite last |
| The same report | **it overstated.** Files time did not reach, and a module judged by one changed test, read as "Lines no test checks". `captcha.ts` showed 4 lines; all its tests catch 26 of 26. `listingTransitionEngine.ts` showed 4; all its tests catch 37 of 38 | three separate headings: lines no test checks, what a changed test misses, not tried |
| The same report | a scanner tested only by a gate self-test read as never loaded | the next matching row is asked before that is said |
| In-memory breaks | 10 of the tool's and the scheduler's new lines broken with every test passing, among them both time limits of the stage and a check that threw reading as silence | tests added; each of those breaks rerun and now fails a test |

### What remains not caught, read by hand

- `dependency-check.mjs` and `change-review.mjs`: `windowsHide`, `maxBuffer`, the spawn timeout, realpath and lowercasing in the main guard. They do not change a result on this platform.
- `dependency-check.mjs:87`, `&&` → `||` and `===` → `!==` in the main guard: the parent then runs the script and exits 0 before any test registers, and `node --test` reports that as a pass. This is a weakness of the check that errs toward naming a line, never toward hiding one.
- `code-check.mjs`, `registry.secure.filter(rule => !rule.refuse)` → `registry.secure`: a file holding a refused line never reaches the note, so the two forms mean the same.
- `mutation-check.mjs` itself: **21 of 317 tried** in the last 15 minutes, 21 caught; each run takes minutes, so all of it would take many hours. An earlier version had 122 of 300 tried, its real survivors closed and its equivalents read, and its scheduling lines have 11 handwritten breaks, all failing a test. `dependency-check.mjs`: 4 not tried.

### A sample of the project's existing tests (`--all`, by hand)

Ten security modules, 25 minutes, alongside other work: 372 defects, 127 caught, 25 not caught, 220 not tried. `sanitizeReturnTo` 10 of 10; `permissions` 6 caught, 11 not tried; `listingPermissions` 8, 1 not caught, 10 not tried; `security/inputs` 3, 0, 25; `sanitizeCmsHtml` 4, 2, 16; `visibility` 3, 0, 54; `contactEvents` 21, 3, 26; `submitListingInquiry` 8, 4, 78; cron `listings-expiry` 16, 1, 0; `sentryScrub` 48, 14, 0. Later, alone: `captcha.ts` 26 of 26, `listingTransitionEngine.ts` 37 of 38. **Most of these 25 have not been read, so do not call them all holes.** Read by hand and real: `contactEvents.ts:63` and `:109`, a listing lookup failure returning `undefined` goes unnoticed; `submitListingInquiry.ts:46`, one `||` of the fail-closed rate limit. Product tests are outside a governance task's role and were not changed.

### The review of this whole change, on the real tree

`node scripts/workflow-gates/change-review.mjs`: exit 0, 6.8 minutes, 74 files against `d8a07a3c7`: 11 lines that make a check quieter, 35 on what an attacker reaches or what steers later agents, 37 a changed test misses, 0 no test checks, 29 files time did not reach. **The 29 say nothing either way.** Answered for this task: each line of `A check said less` in `code-check.selftest.mjs` and `change-review.selftest.mjs` is a fixture of a rule; the 4 mocks in `listings-expiry` and `AdminListingsTable` are in commits of other tasks on this branch, not in this diff; `code-check.mjs:136` runs commands from the repository's own registry; `push-safety.mjs:13` is Git's own blob id, not a protection. An independent reader still answers them all, and the rule and CI files on the list were read only by their author. No upgrade of `next` or `@sentry/nextjs` was run.

### Limits of deviations 7 and 8

- A line only deleted has nothing to break. String literals are not broken. UI with no unit test reads as never loaded.
- A note can reach the main agent a second time. Observed on 2026-11-05: a `Stop` of about 2 s with no mutation run repeated the note of the `Stop` before it, with every file already passed and nothing held afterwards. Only `SubagentStop` stores a held note, and which one stored this was not proven; concurrent hooks write the state last-wins. No check was rerun and no file passed that should not have.
- A flaky failure can count as caught. An equivalent mutant reads as not caught, so a person reads the list.
- A shared module is costly: `src/lib/utils.ts --all`, 8 defects, 222 s. A gate file with no own self-test costs about 2 minutes per defect, so at Stop it is usually not tried, and says so.
- It adds up to 120 s per Stop and up to 8 minutes per CI run, against a 10-minute command limit and a 35-minute job. **None of this has run on CI**, and the last run of this branch, 41823787040 of 2026-11-04, failed on an earlier commit; why was not read here.
- A `secure` rule is a pattern: it finds where to look and proves nothing. The review of section 4 of the flow stays with a person or a session that wrote none of it.
- Claude Code hooks run only in Claude Code. Another tool is told by `AGENTS.md` to run the review by hand, which nothing enforces locally; CI is what cannot be skipped once the branch is pushed.
- 76 known high and critical advisories stay open. Production alone: `npm audit --omit=dev`, 2 critical, 9 high, 34 in all.

## The real chain: what the tool stops, measured

Every self-test above except one runs fixture checks, which prove the tool reads an exit code and nothing about whether the registry's commands see a real defect. `test-results/task945-impl/real-chain.mjs` (gitignored) runs the real main as a process, with the real registry, ESLint config, `tsconfig.json`, vitest config and gate scripts, on a small temporary repository whose `node_modules` is a junction to this project's. A compact form of it is now in the suite, so CI runs it: `Task 945: the real registry stops real defects through the real main`.

Final run, with the mutation check of deviation 7 in the chain: 49 cases, 12 clean controls and 37 real defects. It reports 46 as expected and 3 against its older expectations, each read: the superficial test below is now caught; a clean change to a `.ps1` hook now gets the note that an independent reader must read it; a clean `package.json` in a fixture with no lock file is refused, because `npm audit` cannot run without one and a check that could not run is no pass.

| Result | Count | Defects |
|---|---|---|
| Refused after the write, and again at Stop | 18 | syntax error in TypeScript and in a script; a project ESLint rule; a hook called conditionally; a NUL byte; broken JSON in messages and settings; a broken PowerShell hook; a changed signature, a removed export, a rename and a deletion, each reported in the consumer never written; a type error under `scripts/__tests__`; a broken `tsconfig.json`, `vitest.config.ts`, `eslint.config.mjs` and `package.json`; `@ts-ignore` |
| Refused at Stop, on every attempt | 11 | changed behaviour a consumer test asserts, by a write tool and by a shell; a new failing test; `it.only`; a raw CSS length; a raw size prop; mojibake in source and locale files; a locale key removed; changed behaviour of a scanner in `scripts/`; a failing test under `scripts/__tests__` |
| Stops the agent once, with the line, and asks for a fix or a statement in the report | 8 | wrong logic no test reaches; `it.skip`; an assertion removed; an assertion weakened; `as any`; `eslint-disable`; garbled Cyrillic; **wrong logic under an existing test that asserts nothing real**, named line by line by the mutation check |
| Not seen | 0 | none of these 37; what this list does not hold is below under the limits of deviation 7 |

Measured with R5's registry and before the corrections, in a first run of 38 cases, 11 defects went through unseen (`test-results/task945-impl/real-chain-first.txt`): the seven of deviation 5 in `scripts/` and the configuration files, garbled Cyrillic, `it.skip`, a weakened assertion, and the superficial test. Cases added after that run were not measured against that registry.

**The tool first ran tests without judging them, which left the one defect that matters most, a superficial test staying green over wrong code. Deviation 7 closed that for lines a change writes.** It stops the agent once; it does not refuse, because some forms mean the same. `mutation-check.mjs --all <file>` judges existing tests by hand, and no such pass has run over the whole project.

## Defects of the prototype found and fixed

The prototype run ended `FAILURES 0` with each of these present. Each now has a test.

| Defect | What a real session would have met | Fix |
|---|---|---|
| The glob replaced `**/` first and then rewrote the `*` it had just written, so `**/` matched one folder level | `src/modules/listings/actions/x.ts` is no code file: most of the tree goes unchecked. AC1's bracket path caught it. | one pass over the pattern |
| `tool_input.file_path` counted for any tool | every `Read` of a clean source file runs ESLint and `tsc`: C12 fails in real use | only a write tool's path counts; any other writer is found by its content |
| A `{files}` command took all paths on one line | above 8191 characters `cmd.exe` refuses the line and Stop refuses until the cap | batches of at most 7000 characters |
| A file of two rows was passed twice to one command | double work | one set per command |
| The passed version was hashed after the check | a file written during a check is recorded as passed at a version no check saw | the version is read before any check runs |
| A named file was forgotten after its event | a written file the tree cannot show escapes Stop | kept in the state |
| A damaged or unreadable state was read as a missing one | a new baseline forgives all the session changed | `CODE CHECK COULD NOT RUN` naming the file |
| A dirty file back at its committed text was seen only through a write tool | a revert through a shell form goes unchecked | every baseline file is rehashed |
| The old path of a staged rename was skipped | a rename to a name no row holds runs nothing | the old path counts as gone |
| A substring search of the output for `namesFile` | `a.ts` counts a finding in `a.tsx` | a match bounded on both sides |

Found by this tool or this audit in the implementation itself:

| Defect | Found by | Fix |
|---|---|---|
| A failure at Stop showed only the last lines, with no `not ok` line in them | the first live refusal below | failed tests above the tail are shown too |
| The whole-tree gate's lines of a changed file could lie above the tail | self-review | those lines lead the failure |
| `setTimeout` and `clearTimeout` as globals, refused by the CI lint config | the CI lint command, not the tool (see Open points) | imported from `node:timers` |
| The state file name turned the hyphens of a session id into `_`, not the `<session>.json` of AC10 | the real-tree run | hyphens kept; a hostile id stays in the folder |
| A `noted` map with no effect, since a passed version never reruns | mutation audit | removed |

## Implementer self-audit (not a substitute for review)

`test-results/task945-impl/mutation-audit.mjs` (gitignored) ran 58 isolated in-memory breaks with the Task 944 register, writing no record, over the fixture tests of the final tool. The real-chain test is left out of it, because each run would take too long. **An earlier run was invalid**: its relative spec path broke every fixture child, so all 39 breaks of that version "failed", the planted equivalent control among them. The control exposed it. With an absolute path that version showed 7 real survivors, closed by stronger tests and the removal above. A later run over the corrections of deviations 2 to 6 found one more, the note of an older version held for a newer one, also closed by a test. Final state: 55 killed, 3 survivors:

- break 51, the control that must survive;
- break 6, a read error of the state taken for a missing state. It stays equivalent on the path a test can reach: the save then fails on the same folder and returns `COULD NOT RUN` too. A permission error on the state file alone is not exercised;
- break 32, reading the output of a failed `git show` directly. It is equivalent when a file has no blob at HEAD, since that output is empty; the check only guards a `git` that could not start.

This audit ran before one later edit, a pattern of `quieting` with its test; the defect chain, the sensitivity records and the suite were rerun after it. It shows that the tests of this tool hold its behaviour, and nothing about the rest of the project's tests.

Breaks of killing a hung check leave hung fixture processes in their mutant runs; they were stopped by hand after each run, and no process of the audit remains.

## Real tree, real main, no file changed (`test-results/task945-impl/real-tree.mjs`, gitignored)

| Event | Exit | Time |
|---|---|---|
| SessionStart, clean PostToolUse (Bash), Read of a source file, clean Stop | 0 | 85 to 90 ms each |
| Write of `src/lib/utils.ts` | 0 | 10.1 s |
| Write of `src/app/[locale]/[slug]/page.tsx` | 0 | 10.2 s |
| Write of `.claude/hooks/phase-write-gate.ps1` | 0 | 0.3 s |
| Write of `messages/en.json` | 0 | 0.15 s |
| Write of `scripts/check-design-tokens.mjs`, `postcss.config.mjs` | 0 | 0.2 s each |
| Write of `scripts/__tests__/check-design-tokens.test.ts`, `tsconfig.json`, `package.json`, `vitest.config.ts` | 0 | 7.6 s each |
| Write of `next.config.ts`, `sentry.edge.config.ts`, `.storybook/preview.tsx` | 0 | 10 s each |
| Write of `eslint.config.mjs` | 0 | 2.6 s |
| Stop over those 14, with the defect chain running alongside | 0 | 152.5 s of the stage's 240 s |
| Stop again | 0 | 84 ms, no command |
| Write, then Stop, of `src/components/shared/Map.module.css`, which holds a design-token finding at HEAD | 0, then 2 | the finding line leads the message |

The differential takes 11.1 s; the gate suite 18 s.

## Limits of section 3: confirmed or changed

| Limit | Now |
|---|---|
| "Settings load at session start, so a running session does not get the tool until it restarts" | **Wrong on this client.** The tool ran in this session from the first tool call after `.claude/settings.json` changed: with no SessionStart, its state started by the missing-state rule, with `seen` holding `PostToolUse` 59 by the time of the check below. The route's "this session does not run under the tool" did not hold. |
| A first live Stop is left to the session after the approver | **Happened here.** At an attempt to finish, the tool refused with `CODE CHECK FAILED: how scripts/workflow-gates/code-check.mjs, scripts/workflow-gates/code-check.selftest.mjs affects the rest of the project`, on a real failing test of its own suite, and the later attempts passed once it was fixed. `seen` held `SubagentStop` 7 with no subagent started by this session and no `Stop` key, though the client labelled the refusal a Stop hook. The state of this session after its context summary holds `Stop` 2 and `SubagentStop` 4, again with no subagent started, so `Stop` does arrive and something else in the client also fires `SubagentStop`. What fires it was not determined. For the approver: AC10's live proof names `SessionStart` and `PostToolUse` only, which is unaffected. |
| Node start and status cost about 60 ms (C64) | 85 to 90 ms with the registry and the state. |
| A TypeScript write costs about 9 s; a shared util about a minute at Stop; the gate suite about 15 s | 9 to 15 s; 57 s; 18 s with this suite. |
| Two sessions at once are not told apart | Confirmed by design. In addition, concurrent hooks of one session write the state last-wins: a lost update can only rerun a check, since a pass is by hash. |
| A deleted state | **New limit, not in section 3.** R1 starts a baseline at a missing state, so deleting `test-results/code-check/` in mid-session forgives what the session changed. Executed: a failing write, the folder removed, `Stop` status 0. Nothing in `scripts/` or `package.json` removes that folder, and no Playwright config exists. A state cannot tell this from a first event. |
| A file no test reaches | **New limit, not in section 3.** The note reads the output of the whole `vitest related` run, so a run over one reached and one unreached file says nothing about the second. Executed: status 0, no note. Running each file alone would multiply the cost of Stop. |
| A superficial test | Closed for lines a change writes, within the time of the stage (deviation 7). Existing tests over lines no change touches are judged only by hand. |
| A subagent that cannot act | **New limit, not in section 3.** R3 refuses `SubagentStop` too, so a read-only subagent finishing while another agent's version fails is refused up to the cap, each attempt rerunning the checks. Nothing in the event was read to tell who wrote a file. |
| It cannot judge logic no check catches; prototypes outside the roots; the cap of eight; a workflow control, not a barrier; mojibake and the UI contract stay in CI; the differential compares `shellWriteTargets` only; pnpm, yarn and bun are absent | Unchanged. |
| The Linux kill branch | Still first proven by CI on PR #12. |

## Open points for the approver

1. Deviations 1 to 4 above.
2. Deviation 5 changes rows AC5 fixes exactly. The kickoff text and its AC5 were not edited, so that deviation is the approver's to accept against the owner's words quoted there.
3. R5 leaves ESLint out of the `scripts/` rows because the default config ignores them (C25, C26). The CI lint uses another config, `scripts/workflow-gates/eslint.config.mjs`, which can fail and did: 5 errors in this implementation that the tool did not report and CI would have. A registry row with that command is not in this task's exact rows. Decide whether it becomes a numbered task.
4. Two hooks misread this session, both outside this task. In addition, `orchestrator-router` injected the implementation-review workflow on every background notification and owner prompt of this implementation; its receipt was not emitted, since this session reviews nothing. `orchestrator-router.ps1` injected the task-design workflow on a background-task notification, which holds no owner prompt. `phase-write-gate.ps1` and the pre-write hook read a `.tsx`, `.css` or `src/` path inside a command's text as a write of it, also in a heredoc to an ignored file; such scripts were written through the Write tool instead, and no receipt was invented.
5. `orchestrator-response-gate.ps1` (GR-6) refused each attempt to end a turn while the audit ran in the background: a long background wait now uses up the same cap of eight as the tool.
6. Rule files changed, so other tasks' `rules` digests read stale until the approver rebases them.
7. Owner decisions surfaced, not acted on: upgrading `next` and `@sentry/nextjs` (critical in production); `ignore-scripts=true` in `.npmrc`, effect on the build not measured; CODEOWNERS, none exists; agents' access to `.env.local`, where a saved memory and the OWASP guidance conflict; the MCP allowlist and Vercel write tools; the real test gaps above.

IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW

## Revision 1

Session: a fresh Opus implementation session (D1), 2026-11-05, native Windows 11, Node v22.22.3, branch `task/935-governance-approval-route`,
HEAD `5dd561a1422480236c05db8ac68ee21c0a80a16b`. Read first: the kickoff with its rule bundle, `review/review-1.md`, and
`review/p01-corrections-prototype.mjs`, `review/p02-mutation-disk-guard.mjs`, `review/p03-agents-policy-path.mjs` as evidence (no code copied).
Base run before the first write: `impl/base-runs-r10.txt`, 288 of 288, exit 0, 81215 ms. `package.json` and `package-lock.json` are unchanged (D30).
Order as the route says: R12, R10, R11, R14, R13, R15, R16, R17, R18, R20, then R19 in one save with the sidecar's `scope`. Stage `implemented`.

### Status per requirement

| R | Changed files | Evidence | Status |
|---|---|---|---|
| R10 | `code-check.mjs`: `readableText` (8 MiB, NUL in the first 8000 bytes), `unquotedPath`, `headerPath`, exported `addedLinesOf` and `refusedLines(root, base, named, { untracked })`; `added` no longer runs refuse rules. `change-review.mjs` calls it against its base with untracked files | GOV-945-HOOK-SECRET-REACH-DENY and its sensitivity record | done |
| R11 | `code-check.mjs`: `refusedText` gives `<file>:<line>: <what>`; a line another rule finds that also holds refused text is printed as `its text is withheld` | GOV-945-HOOK-SECRET-ECHO-DENY | done |
| R12 | `dependency-check.mjs`: `PACKAGE_NAME`, refusal with `JSON.stringify` and CWE-78 before any process; `mutation-check.mjs`: no command for an `UNQUOTABLE` name, `error` on the result; `change-review.mjs`: `changedFiles` reads both lists with `-z` | GOV-945-HOOK-NAME-INJECTION-DENY and its sensitivity record | done |
| R13 | `code-check.mjs`: exported `leftBehind`, `snapshot` returns `{ files, gone, others }`, Stop and SubagentStop tell each deletion once (`told`, `deletions`, `goneBefore`), and a file no row holds that was in the tree at the start is kept by name (`othersBefore`), so an untracked one that goes is named too; `change-review.mjs`: `## What a deletion left behind` | GOV-945-HOOK-DELETED-CONSUMER-DENY and its sensitivity record | done |
| R14 | `code-check.json`: `finding` on both `namesFile` entries, `folders` gone; `code-check.mjs`: `reportsFile` gone, `readRegistry` refuses an entry without `finding`, the stage reads finding lines | GOV-945-HOOK-GATE-CRASH-ERROR, which also runs both real gates and accepts their exit code | done |
| R15 | `mutation-check.mjs`: `treeStatus`, `bytesOf`, `treeGuard` (a copy of what a run left under `test-results/code-check/mutants/restored/<pid>`); the comment of `mutation-loader.mjs`; line 80 of this report | GOV-945-MUTATION-DISK-ERROR | done |
| R16 | `change-review.mjs` (`## Could not run`, `## Undecided`), `mutation-check.mjs` (`reportLines`, `--base=`, the by-hand words), `code-check.mjs` (a stage's memory over one set of versions, `subagentRefused`), `code-check.json` (steering row) | a test each for (a) to (f); (f) runs the command of a real `not tried` line as written | done |
| R17 | the four self-tests; `hook-differential.mjs` takes a hook path and `--limit=N` | `impl/r17-breaks.txt` below | done |
| R18 | `dependency-check.mjs`, `.claude/rules/shared/secure-code-review.md` (7906 bytes) | the tests named in AC18 | done |
| R19 | `contract.mjs` (`isPolicyPath`, `isDoc`); the sidecar's `scope` gets `AGENTS.md` in the same save | GOV-945-HOOK-EXECUTOR-DENY; `cli.mjs plan` exit 0; `cli.mjs diff --phase release` | done |
| R20 | `code-check.json` (the CI lint at `write` of `scripts/workflow-gates/*.mjs`) | the AC20 test | implementer part done; AC21 is the approver's |

### Acceptance criteria 11 to 21

| AC | Result |
|---|---|
| AC11 | GOV-945-HOOK-SECRET-REACH-DENY and GOV-945-HOOK-SECRET-ECHO-DENY pass. `refusedLines` over the merge base of `origin/main` (`d8a07a3c7841022207fd5331f53e5a80b4d7c7e2`) and `HEAD`, with untracked files, on the real tree: 0 results in 4011 ms. Over `HEAD` with untracked files, after the last change: 0 in 3397 ms. |
| AC12 | GOV-945-HOOK-NAME-INJECTION-DENY passes, through the hook and `change-review.mjs`; on Windows the `$(touch PWNED)` form is a name with no effect, and Linux is first proven on CI. Every name of the real `package.json` and lock file passes. |
| AC13 | GOV-945-HOOK-DELETED-CONSUMER-DENY passes through the real chain of the suite; AC3's `error TS2307` for a deleted module still holds. |
| AC14 | GOV-945-HOOK-GATE-CRASH-ERROR passes, with the two expressions read against the real output of both gates. |
| AC15 | GOV-945-MUTATION-DISK-ERROR passes. |
| AC16 | A test for each of (a) to (f) passes; (f) commits a change on a fixture branch and runs the command of a real `not tried` line as written: defects above 0. |
| AC17 | `impl/r17-breaks.txt`: C94, C95 and C96 caught by the tests R17 names, through the tool's own loader. `npm run check:mojibake` exits 1 on six evidence files of Tasks 923, 927 and 944 and names no file of `scripts/workflow-gates/`. |
| AC18 | The two refusals by a test each; the real lock file passes; a test reads the three limits in section 3 and the added items in section 4; 7906 bytes. |
| AC19 | `evaluateHook` refuses a Sonnet Edit of each path of R19, also with a product contract loaded. `cli.mjs plan` exit 0. `cli.mjs diff --phase release --base HEAD --working-tree` prints no error naming `AGENTS.md`; it exits 1 only on what belongs to the approver: stage not `reviewed`, no review decision, `review.evidence` absent (read as an invalid path), and the stale rebases of Tasks 935, 940, 941, 943 and 944 (C50). |
| AC20 | The test finds the CI lint in the `write` of the row and a fixture the default config passes returns status 2. The CI lint over `scripts/workflow-gates/*.mjs` exits 0. |
| AC21 | The approver's. |

### Cases

All fourteen GOV-945 cases pass in `node scripts/workflow-gates/cli.mjs governance-report`: `impl/governance-report.json`, "passed, 14 case(s)".
`cli.mjs verify` exit 0.

### Sensitivity (all eight, through `cli.mjs sensitivity`, in memory, after the last change of the tool)

Each record holds a baseline exit 0, a mutant exit 1 with `ERR_ASSERTION` on the named test, and a restored exit 0. No gate file was edited to plant a break.

| Case | Break (`find` once, `replace`) | Failed assertion |
|---|---|---|
| GOV-945-HOOK-WRITE-DENY | the failure at a write returns `status: 0` | `a lint failure refuses`, 0 !== 2 |
| GOV-945-HOOK-IMPACT-DENY | `if (failures.length && false) return refuse(...)` at Stop | `/error TS2307/` absent: only the deletion note reached the agent |
| GOV-945-HOOK-SHELL-WRITE-DENY | only `tool_input.file_path` counts as changed | `a file changed directly, under a Bash event that names no file, is refused`, 0 !== 2 |
| GOV-945-HOOK-DIFFERENTIAL-DENY | a lost target is not counted | `a new hook dropping a target reports it` |
| GOV-945-CI-SETTINGS-DENY | the registration check is removed | `removed from SessionStart` |
| GOV-945-HOOK-SECRET-REACH-DENY | a refuse rule reads only a file a row holds | `a key replaced by another is named, though the count is the same` |
| GOV-945-HOOK-NAME-INJECTION-DENY | `const refused = [];` | `no registry call for "left-pad&echo ran>PWNED-NPM&rem "` |
| GOV-945-HOOK-DELETED-CONSUMER-DENY | `const names = [];` | the deletion of `scripts/lib/shared.mjs` returns 0, expected 2 |

The WRITE and IMPACT break specs were rewritten because their old `find` text now occurs twice and zero times; each new `find` occurs once.

### Self-test totals and times

| Run | Tests | Exit | Duration |
|---|---|---|---|
| Base, before the first write (`impl/base-runs-r10.txt`) | 288 / 288 | 0 | 81215 ms |
| Final, alone, after the last change (`impl/r1-final-selftests.txt`) | 310 / 310 | 0 | 130647 ms |

The tool on a clean `PostToolUse` event, real main: 98, 94 and 98 ms. A TypeScript write runs the row's three commands, timed on `src/lib/utils.ts`:
ESLint 2360 ms, `check-file-integrity` 47 ms, `tsc --noEmit` 19022 ms, about 21.4 s. The differential: exit 0, `LOST 0`, 86367 commands,
0 exceptions, 11132 ms. `npm run build` exit 0 in 133 s (Q1), run before the last change, which is in `code-check.mjs` and its self-test only and reaches no build input. The CI lint over the gate scripts exit 0 in 1 s. The output of each AC command
is in `impl/r1-ac-commands.txt`.

**The suite grew by 49.4 s (61 %) and reaches 130.6 s against the 180000 ms limit of `selftests.mjs`.** The files run in parallel, so the
longest one sets the time: `code-check.selftest.mjs`, whose slowest tests are the real registry through the real main (56 s, revision 0) and
GOV-945-HOOK-GATE-CRASH-ERROR (25 s), which runs both real whole-tree gates as AC14 asks. At a Stop of this session that ran
while three defect runs used the machine, the suite was cut at that limit: `selftests.mjs` printed no line saying so, and the tool reported
`exit 1` with a tail of passing tests. Alone it passed 310 of 310. The duration on CI is one of the three R20 observations.

### No older self-test file changed

The four changed self-test files are the ones commit `0c1e09eb1` of this task added (`git log --diff-filter=A`); no other `*.selftest.mjs` is
in `git status`. Inside them, the assertions the requirements replace: the ESLint assertion of the `scripts/` rows (R20 adds the CI lint);
the folder test and the design-token shape test, replaced by GOV-945-HOOK-GATE-CRASH-ERROR (R14); the mojibake fixture line, now in `\u`
escapes (R17); `failures.length` 2 of `dependency-check.selftest.mjs:72-76` (R18); the texts of `reportLines` and the by-hand runs (R16);
the test named `... and no file on disk changes`, now `... and the file under test keeps its text` (R15). Test counts: code-check 26 to 35, change-review 16 to 22, dependency-check 14 to 17,
mutation-check 25 to 29.

### R17: the review's breaks, rerun (`impl/r17-breaks.txt`, script `impl/r1-defects/r17-breaks.mjs`)

C94 (a hung check after grace counts as passed), C95 (the differential's main always exits 0) and C96 (the review follows renames) are each
caught by the test R17 names. C125, the main guard of `dependency-check.mjs`: `===` to `!==`, `&&` to `||` and the negated guard are caught (the
self-test file fails at import, because the guard then runs the main inside it); the missing `realpathSync.native` is caught by the new test that
starts the tool through a junction to its folder. One form survives: lower case on Linux instead of Windows. It is equivalent:
`realpathSync.native` already returns the case the file system holds on Windows, and Linux compares both sides the same way.

### The changed lines of revision 1, broken one by one (`impl/r1-defects/`)

Beyond the route, every defect `mutantsOf` makes on the lines changed since `HEAD` in the seven gate files was run against the tests through
the tool's own loader, in memory. First a focused run (443 defects, a name pattern per group): 304 caught, 139 survived, 0 not loaded. The
survivors against every test file reaching their source: 52 more caught. Tests were then added for what is behaviour; 51 non-equivalent defects
rerun: 43 caught; after two more assertions `mutation-check.mjs:322`, both forms of `:329` and `contract.mjs:84` were rerun: caught. 32 forms
are equivalent, 30 listed in `equivalent.txt` and two left by the third pass, answered here:

- `windowsHide` true to false, a `maxBuffer` bound one step larger, one minute plus one millisecond: no output and no result changes.
- `mutation-check.mjs:117`, the status read as three characters instead of two: the third is always the space before the path, so the
  rename test reads the same.
- `addedLinesOf` keeps `removed`, but in a `-U0` hunk every line starts with `-`, `+` or `\`, and none of them reads as a header, so its four
  defects (`removed` start 1, `&&`/`||`, `> 1`, no count) give the same list. A quoted path both starts and ends with `"`, so `startsWith`
  versus `endsWith` is the same. An added line's file exists, so `throwIfNoEntry` and its fallback 0 are never read.
- `git grep` exits 0, 1 or 128, never 2. `hashOf` of a folder is compared only with itself, `'folder'` or `undefined`. A `readableText` error
  that is not a missing file still throws, as a `TypeError`. The `known.notes` of a stage's memory are read only on an attempt that fails again.
  The `saveState` of the repeated `SubagentStop` holds only the `seen` counter and prunings the next event makes again. A report copy appears only after the last look of its file.
- `rmSync(..., { force })` removes a file that exists; `change-review.mjs:50` reads the base that line 44 already read, which throws first.
- `mutation-check.mjs:196`: a fallback concurrency 2 instead of 1 is used only when the registry names none; the real registry names 3.
- `code-check.mjs:76`, an `index` of -2 instead of -1: both are below 0.

Three do not survive as equivalent, and stay limits: `hashOf` (`code-check.mjs:175`) and `bytesOf` (`mutation-check.mjs:127`) of a file
that exists but cannot be read (EACCES) would return nothing instead of throwing, and no test can make such a file on Windows; a copy entry
of `git status` (`code-check.mjs:194`, `&&` to `||`) is listed only with `status.renames=copies`, not the default.

### Each line of a fresh `change-review.md`, answered

`node scripts/workflow-gates/change-review.mjs`, base the merge base with `origin/main` `d8a07a3c7841022207fd5331f53e5a80b4d7c7e2`, run again
after the last change: exit 0 in 494 s, 74 code files (`impl/r1-change-review.md`). It holds no `Refused`, `Could not run`, `Undecided` or `What a deletion left behind`
heading. The base reaches back over every commit of this branch, so it lists files of Tasks 931, 935 to 944 too.

- **A check said less.** `change-review.selftest.mjs:176` and `:262` (the second written by R11) and `code-check.selftest.mjs:380` to `:405`
  and `:428` are fixture text: the `it.skip` and the switched-off rule are what the quieting rules are tested against, written into a temporary
  repository, and no test of this project is switched off. `route.test.ts:79/157/170` and `AdminListingsTable.smoke.test.tsx:82` come from
  `2693c6b9a` (Task 931); this task does not touch product tests.
- **What an attacker reaches.** CWE-95, CWE-78, CWE-327 and CWE-295 in `change-review.selftest.mjs:49/50/56/57/87/88/90/153` are the rows of the
  rule tests: strings put into a fixture file, never run. `code-check.mjs:237` is `runCommand`: it runs a command of the registry, a steering file
  only Opus may change (R19 and GOV-945-HOOK-EXECUTOR-DENY); a file name reaches it only in quotes, and a name holding a character no command line
  can quote is a failure before any process starts (R12, CWE-78). `mutation-check.selftest.mjs:508` runs the command of a `not tried` line as
  written, because that is what R16 (f) asks to prove; the command is composed by the tool under test in a temporary repository.
  `push-safety.mjs:13` is SHA-1 as Git's own blob id, not a protection; it comes from `23206fb7f`. Each steering file of this task (`code-check.mjs`,
  `code-check.json`, `change-review.mjs`, `dependency-check.mjs`, `mutation-check.mjs`, `mutation-loader.mjs`, `hook-differential.mjs`,
  `contract.mjs`, `secure-code-review.md`, the four self-tests) was read against section 4 of `secure-code-review.md`: input from the tree
  (package names, file names, diff headers, lock entries) is checked against an allow-list or quoted before it reaches a process; no process
  runs through a shell with a name from the tree; no refused text leaves `refusedLines`; every failure to read Git throws, so no read is no pass;
  a mutant that writes is restored and named; nothing is logged that a rule refuses. The steering files of the other tasks are theirs.
- **What a changed test misses.** `permissions.ts`, `captcha.ts`, `listingTransitionEngine.ts` and `applyListingTransition.ts` are product code
  of Task 931's commit, judged against its changed smoke tests only. Not this task's code; the owner's route for them is Task 931.
- **Not tried.** Time ran out for every gate file of this task over the whole branch. The lines revision 1 changed were broken one by one in
  this session (`impl/r1-defects/`); the lines of commit `0c1e09eb1` were judged in its own report; the other files are other tasks'.

### Self-check at the owner's request (2026-11-06)

The owner asked this session to check its own work. Each claim of this section was read again against the code, the tests and the
recorded runs. Found and corrected:

1. **R13 was not met in full.** It names a file no row holds among the deleted files, and an untracked such file present at the start of a
   session was not seen when it went: it had been written below as a limit instead. Fixed in `code-check.mjs` (`othersBefore`, kept by name
   at the start, read at Stop and SubagentStop), with a test in `code-check.selftest.mjs` that fails under each of four in-memory breaks of
   the new lines (`impl/r1-defects/r13-breaks.txt`). Then the suite, all eight sensitivity cases, the CI lint, `check-workflow.mjs`, `publication.mjs`, `change-review.mjs`,
   `governance-report`, `verify` and `plan` were run again; the numbers in this section are those of the reruns.
2. **This section said four limits survive the defect runs; there are three.** The equivalent forms were counted as 30 and are 32, and one
   of them (`mutation-check.mjs:117`, three characters) had no answer. Corrected.
3. The times of `refusedLines` over `HEAD`, the suite, the review and the line number of `runCommand` were of earlier runs. Replaced.

Read again and found as written: the eight break specs and their failed assertions; AC11 (eleven places, each untracked, staged and
committed, a non-ASCII name among them); AC13 (three consumers, once, then 0; the unnamed file; the review's heading; `error TS2307`);
AC16 (e) (ten `SubagentStop`, one refusal, one run; two `Stop` refusals, at most one further run); AC18 (each item of sections 3 and 4 is
read by a test, 7906 bytes); AC19 (the seven paths of R19, with and without a product contract); R16 (c) (the steering row).

### Limits: confirmed or changed

| Limit | Now |
|---|---|
| The three limits R18 adds to section 3 | Confirmed by the tests of AC18. |
| A name that begins with `-` | Passes the kickoff's package-name expression, so it reaches `npm view` as an argument; it is no command (no shell), but an option. |
| `inBundle` lock entries | Refused by R18, since they hold neither `resolved` nor `integrity`; the real lock file holds none today. |
| A deleted file's consumers | One `git grep` per deleted file, with no bound on their number. A file no row holds that is created and deleted within one session is not named, because it was not in the tree at the start. |
| The guard of a mutant run | One `git status` per attempt; a file outside the roots is compared by its status code only; a change by another session at that moment is restored too, which is why a copy is kept first. A base Git cannot name judges every line of the file, as `changedLines` does for a new file. |
| A refused text in a file the hook reads whole | The hook reads a named file whole, so an old key in a written file is named at the hook; the review names only added lines. A UTF-16 file holds NUL bytes and is skipped. |
| A stage's memory | A flaky failure is shown again until a file under the roots changes. |
| Concurrent hooks of one session | **Changed: the lost update can also repeat a note.** After the last version of the self-tests this session got the same `CODE CHECK NOTE` (the steering files and `mutation-check.selftest.mjs:508`) at two Stops in a row, against "once per version". The state then held no stored note and 17 `SubagentStop` events, which background tasks of this session fire. Probable cause, not reproduced: a `SubagentStop` that stored the notes and a `Stop` that showed them ran at once, and the last write of the state won. |
| The suite's time | See above: 130.7 s alone, cut at 180 s under load with no word of why. |
| The Linux kill branch and the `$(touch PWNED)` marker | First proven on CI. |

### Open points for the approver

1. The suite's time against the 180 s of `selftests.mjs` (above). `selftests.mjs` itself was not changed: it is outside the requirements.
2. This session's `UserPromptSubmit` router classified the owner's prompt as an implementation review; no review receipt was written, since this
   session reviews nothing.
3. Temporary folders of failed runs of the hold-pipes test are left in `%TEMP%`: `lero-945-check-2IjdAK`, `lero-945-check-2rz7Rg`,
   `lero-945-check-Pvg5NE` (and `lero-945-check-6przay`, `lero-945-check-rx5FJ6`, origin not confirmed). A wildcard removal in the shared
   temporary folder was refused by the session's permission classifier and was not retried; the owner may remove them.
4. No process of these runs is left: `Win32_Process` lists only the Playwright MCP servers and an Adobe process.
5. The Stop notes of this session (a switched-off test and `eval` in `change-review.selftest.mjs`, `shell: true` in
   `mutation-check.selftest.mjs:507`, the steering files) are answered in the review answers above.

IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW
