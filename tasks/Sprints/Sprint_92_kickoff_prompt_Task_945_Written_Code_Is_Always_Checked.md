# Task 945 — Written code is always checked for quality and for its effect on other code

Sprint 92. P1. QA profile **Q1** (non-UI gate code and its tests, `docs/qa-profiles.md`). Kickoff by Opus, 2026-11-04, at the owner's
decision D25, written by the review session of Task 942 commit `5cd44cb97`.

## 1. Mode, task type and rule bundle

Governance task. **Implementer: Opus, in a fresh implementation session started for this task (D1); Sonnet does not execute it**,
because every file of the tool is a policy path (C45) and Sonnet cannot edit one (C46). **Approver: Opus, in another fresh session that
wrote none of the scope files (D2).** Neither may be the session that designed this kickoff. Types (`docs/rule-index.md`): workflow gates /
governance tooling. Bundle: `.claude/rules/shared/workflow-gates.md` with `workflow-contract.md`, `workflow-evidence.md`, `workflow-ci.md`,
`git-publication.md`; `security-testing.md`; `role-boundaries.md`; `claim-evidence-contract.md`; `task-readiness.md`; `orchestration-state.md`.

## 2. Objective

The owner's complaint is exact: code is written and then checked superficially or not at all, above all for how it affects other code
(D25). The review of Task 942 showed it: a prototype written by the reviewer itself lost 1011 targets of older hooks while its hand-written
tests stayed green (C54), and only an old-versus-new run found it (C53). Rules already ask for such checks; nothing runs them, because no
tool event runs code after a write (C1).

This task adds one tool, `scripts/workflow-gates/code-check.mjs`, run by Claude Code itself:

1. **Code written → quality check.** After every tool call the tool finds what changed and runs the quality checks of those files. A failure
   is shown to the agent at once (C2).
2. **Effect on other code.** The same run checks the whole project's types, so a consumer the session never touched is reported (C9). Before the
   agent may finish, the tests that reach the changed files run too (C11).
3. **Problems are solved at once.** While a check fails the agent is told to fix it and cannot finish (C3). The refusal repeats on every attempt, up to
   the cap of C4.

It works for any session and any writer, because it compares file contents and parses no command (C10). A session that wrote no code runs no
check (C12) and pays about 60 ms per event on this tree (C64).

## 3. Verified context

The whole tool is proven as a prototype: `docs/sessions/evidence/task945/design/p03-code-check-prototype.mjs`, run as a real hook process on a
temporary Git repository with the real `tsc` (`p04-prototype-run.txt`, C19). It is a design prototype to read, not code to paste. Probes of this
design corrected the first plan four times. Three were checks that look present and do nothing or block everything: ESLint ignores `scripts/**`
(C25, C26), the UI contract gate reads committed revisions only (C34), and a whole-tree gate that fails at HEAD would block every change (C32). The
fourth is this task's own effect on other code: the first plan edited `workflow-gates.md`, a digest input of all nine reviewed contracts (C66, C67), so
the rule goes into `CLAUDE.md` instead (C69).

Limits, stated so nobody reads more into this tool:

- It runs checks; it cannot judge logic no check catches. A wrong behaviour with no test passes. It says so for a file no test reaches (C16).
- Its roots are project code. A design prototype or probe under `docs/` or `test-results/` is outside them, and that is where the defect of C54 lived. The
  rule of R8 and the path argument of R6 cover it: an author of a hook prototype runs the differential by hand, and that stays a discipline.
- The cap of C4 ends a turn after eight refusals. The failure was then shown eight times, but the turn does end. CI stays the outer barrier.
- It is a workflow control, not a security barrier: its state lives in the ignored `test-results/` (C60).
- Two sessions working at once are not told apart: one session's change is charged to the other.
- Settings load at session start, so a running session does not get the tool until it restarts.
- A TypeScript write costs about 9 s (C20, C21), a shared util up to about a minute at Stop (C22), the gate suite about 15 s (C37).
- Mojibake (C33) and the UI contract (C34) stay in CI. The design-token gate fails at HEAD, so it counts only findings in changed files (C32).
- The differential of R6 compares `shellWriteTargets` only; the other logic of the hook is guarded by the gate suite.
- The kill of a hung check is proven on Windows (C14). Its Linux branch is first proven by CI on PR #12.
- pnpm, yarn and bun are absent locally; no registry command uses them.

## Claim ledger

| ID | Status | Claim | Evidence |
|---|---|---|---|
| C1 | FACT | No gate file names the PostToolUse or SubagentStop event today. | source: `docs/sessions/evidence/task945/design/p08-registration-probe.txt:17-17`; observed: `11 files of the gates that name PostToolUse or SubagentStop: []` |
| C2 | FACT | A PostToolUse hook that exits 2 shows its stderr to Claude after the tool ran. | source: `docs/sessions/evidence/task945/design/p07-hooks-doc-quotes.txt:2-2`; observed: `Shows stderr to Claude; the tool already ran` |
| C3 | FACT | A Stop hook that exits 2 keeps the conversation going. | source: `docs/sessions/evidence/task945/design/p07-hooks-doc-quotes.txt:4-4`; observed: `Prevents Claude from stopping, continues the conversation` |
| C4 | FACT | Stop refusals are capped at eight in a row. | source: `docs/sessions/evidence/task945/design/p07-hooks-doc-quotes.txt:6-6`; observed: `Claude Code overrides the next block and ends the turn` |
| C5 | FACT | A hook that reaches its timeout has its output discarded. | source: `docs/sessions/evidence/task945/design/p07-hooks-doc-quotes.txt:7-7`; observed: `on most events a timed-out hook renders no decision` |
| C6 | FACT | Tool events inside a subagent fire the same hooks. | source: `docs/sessions/evidence/task945/design/p07-hooks-doc-quotes.txt:8-8`; observed: `fire the same configured hooks as in the main conversation` |
| C7 | FACT | SubagentStop runs when a subagent finishes. | source: `docs/sessions/evidence/task945/design/p07-hooks-doc-quotes.txt:9-9`; observed: `Runs when a Claude Code subagent has finished responding` |
| C8 | FACT | In the prototype a lint failure in the written file is shown at once. | source: `docs/sessions/evidence/task945/design/p04-prototype-run.txt:5-5`; observed: `PASS QUALITY a lint failure in the written file is shown at once: exit 2` |
| C9 | FACT | In the prototype a changed signature is reported in a consumer the session never touched, by the real tsc. | source: `docs/sessions/evidence/task945/design/p04-prototype-run.txt:8-8`; observed: `PASS IMPACT a changed signature is reported in the consumer the session never touched: exit 2` |
| C10 | FACT | In the prototype a write through a shell command is seen by its hash, with no parsing. | source: `docs/sessions/evidence/task945/design/p04-prototype-run.txt:10-10`; observed: `PASS a write through a shell form with no parsing is seen by its hash: exit 0` |
| C11 | FACT | In the prototype Stop refuses while a test of the consumers fails. | source: `docs/sessions/evidence/task945/design/p04-prototype-run.txt:11-11`; observed: `PASS IMPACT Stop refuses while a test of the consumers fails: exit 2` |
| C12 | FACT | In the prototype a read-only session does nothing. | source: `docs/sessions/evidence/task945/design/p04-prototype-run.txt:2-2`; observed: `PASS a read-only session does nothing and stops at once: exit 0` |
| C13 | FACT | In the prototype a check that does not finish is a failure. | source: `docs/sessions/evidence/task945/design/p04-prototype-run.txt:24-24`; observed: `PASS ERROR a check that does not finish is a failure: exit 2` |
| C14 | FACT | In the prototype on Windows the hung check leaves no process. | source: `docs/sessions/evidence/task945/design/p04-prototype-run.txt:25-25`; observed: `PASS ERROR the hung check left no process behind: 0 running` |
| C15 | FACT | In the prototype an unreadable registry refuses with a message. | source: `docs/sessions/evidence/task945/design/p04-prototype-run.txt:27-27`; observed: `PASS ERROR an unreadable registry refuses with a message: exit 2` |
| C16 | FACT | In the prototype a file no test reaches stops the agent once. | source: `docs/sessions/evidence/task945/design/p04-prototype-run.txt:16-16`; observed: `PASS NOTE no test reaches a new file: stopped once: exit 2` |
| C17 | FACT | In the prototype a whole-tree gate blocks only for a finding in a changed file. | source: `docs/sessions/evidence/task945/design/p04-prototype-run.txt:18-19`; observed: `the same gate blocks once the changed file holds a finding: exit 2` |
| C18 | FACT | In the prototype a rename is reported in the consumer that imports the old path. | source: `docs/sessions/evidence/task945/design/p04-prototype-run.txt:22-22`; observed: `PASS IMPACT a rename is reported in the consumer that still imports the old path: exit 2` |
| C19 | FACT | The prototype run ended with no failure. | source: `docs/sessions/evidence/task945/design/p04-prototype-run.txt:29-29`; observed: `FAILURES 0` |
| C20 | FACT | The whole project type check takes about 7 s. | source: `docs/sessions/evidence/task945/design/p05-registry-commands.txt:3-3`; observed: `write, types of the whole project: exit 0` |
| C21 | FACT | ESLint of one file takes about 2 s. | source: `docs/sessions/evidence/task945/design/p05-registry-commands.txt:1-1`; observed: `write, ts: exit 0` |
| C22 | FACT | The related tests of a shared util are 77 files and pass. | source: `docs/sessions/evidence/task945/design/p02-baseline.txt:19-19`; observed: `src/lib/utils.ts: exit 0` |
| C23 | FACT | vitest related says when no test reaches a file. | source: `docs/sessions/evidence/task945/design/p02-baseline.txt:17-17`; observed: `No test files found, exiting with code 0` |
| C24 | FACT | The whole vitest run fails only on leftover copies under test-results. | source: `docs/sessions/evidence/task945/design/p02-baseline.txt:8-13`; observed: `test-results/task941-review2/r12-scan/diff-hook.copy.test.mjs` |
| C25 | FACT | ESLint ignores every script. | source: `eslint.config.mjs:103-103`; observed: `"scripts/**",` |
| C26 | FACT | ESLint passes a gate script with a syntax error. | source: `docs/sessions/evidence/task945/design/p06-each-check-can-fail.txt:3-3`; observed: `eslint is applied to a gate script, a syntax error: exit 0` |
| C27 | FACT | ESLint fails a source file with a syntax error. | source: `docs/sessions/evidence/task945/design/p06-each-check-can-fail.txt:1-1`; observed: `eslint is applied to src, a syntax error: exit 1` |
| C28 | FACT | The file integrity check fails on a NUL byte. | source: `docs/sessions/evidence/task945/design/p06-each-check-can-fail.txt:6-6`; observed: `file integrity, a NUL byte: exit 1` |
| C29 | FACT | The file integrity check fails on a script with a syntax error. | source: `docs/sessions/evidence/task945/design/p06-each-check-can-fail.txt:10-10`; observed: `file integrity, a syntax error in a script: exit 1` |
| C30 | FACT | The file integrity check fails on broken JSON. | source: `docs/sessions/evidence/task945/design/p06-each-check-can-fail.txt:11-11`; observed: `file integrity, a broken JSON file: exit 1` |
| C31 | FACT | The PowerShell parse command fails on a broken script. | source: `docs/sessions/evidence/task945/design/p06-each-check-can-fail.txt:7-7`; observed: `PowerShell parse, a broken script: exit 1` |
| C32 | FACT | The design-token gate fails at HEAD and names the files of its findings. | source: `docs/sessions/evidence/task945/design/p06-each-check-can-fail.txt:9-9`; observed: `design tokens at HEAD: exit 1; names src/components/shared/Map.module.css: true; names src/lib/utils.ts: false` |
| C33 | FACT | The mojibake check fails at this tree and takes 18 s, for one named file. | source: `docs/sessions/evidence/task945/design/p05-registry-commands.txt:8-8`; observed: `write, mojibake: exit 1` |
| C34 | FACT | The UI contract gate reads Stories from a committed revision. | source: `scripts/check-ui-contract.mjs:307-307`; observed: `const text = readRevisionFile(head, story)` |
| C35 | FACT | The dot reporter still says no test reaches a file. | source: `docs/sessions/evidence/task945/design/p06-each-check-can-fail.txt:12-12`; observed: `says No test files found: true` |
| C36 | FACT | The locale parity gate fails when a key group is removed. | source: `docs/sessions/evidence/task945/design/p10-parity-can-fail.txt:2-2`; observed: `one top-level group removed from en.json: exit 1` |
| C37 | FACT | The gate suite takes about 15 s and passes at this tree. | source: `docs/sessions/evidence/task945/design/p05-registry-commands.txt:15-15`; observed: `stop, gate suite: exit 0` |
| C38 | FACT | The workflow settings check passes at this tree. | source: `docs/sessions/evidence/task945/design/p05-registry-commands.txt:16-16`; observed: `stop, workflow settings: exit 0` |
| C39 | FACT | validateSettings refuses a narrowed matcher of an event other than PreToolUse. | source: `scripts/workflow-gates/check-workflow.mjs:77-77`; observed: `mandatory hook matcher is narrowed or changed` |
| C40 | FACT | validateSettings requires every hook to block on a runtime failure. | source: `scripts/workflow-gates/check-workflow.mjs:73-73`; observed: `hook runtime failures must block` |
| C41 | FACT | validateSettings of today accepts settings without the tool. | source: `docs/sessions/evidence/task945/design/p08-registration-probe.txt:5-5`; observed: `5 validateSettings of today, the registration removed: []` |
| C42 | FACT | The planned registration passes validateSettings once the tool file exists. | source: `docs/sessions/evidence/task945/design/p08-registration-probe.txt:3-3`; observed: `3 validateSettings, patched settings, tool file present: []` |
| C43 | FACT | Once registered, the tool is in the closure of the pre-write guard with no change of the hook. | source: `docs/sessions/evidence/task945/design/p08-registration-probe.txt:7-7`; observed: `7 guard closure holds the tool, patched settings: true` |
| C44 | FACT | The guard closure is an exported function of the hook. | source: `scripts/workflow-gates/security-hook.mjs:1148-1148`; observed: `export function hookModuleClosure(root, { readText } = {})` |
| C45 | FACT | The new tool files are policy paths. | source: `docs/sessions/evidence/task945/design/p08-registration-probe.txt:8-11`; observed: `isPolicyPath scripts/workflow-gates/code-check.mjs: true` |
| C46 | FACT | Sonnet cannot edit a policy path. | source: `scripts/workflow-gates/security-hook.mjs:1314-1314`; observed: `POLICY-EDIT AUTHORITY REQUIRED: Sonnet cannot edit workflow policy or enforcement` |
| C47 | FACT | The publication manifest does not list the tool today. | source: `docs/sessions/evidence/task945/design/p08-registration-probe.txt:15-15`; observed: `9 publication.json ownedFiles holds the tool today: false` |
| C48 | FACT | The publication check visits every hook target of the settings. | source: `scripts/workflow-gates/publication.mjs:66-66`; observed: `if (arg.startsWith('${CLAUDE_PROJECT_DIR}/')) visit(` |
| C49 | FACT | The gate suite finds a self-test by its file name. | source: `scripts/workflow-gates/selftests.mjs:8-8`; observed: `.selftest\.mjs$/.test(file)` |
| C50 | FACT | Measured by digest, the files this task changes stale reviewed contracts 935, 940, 941, 943 and 944 only. | source: `docs/sessions/evidence/task945/design/p13-rule-inputs-of-reviewed-contracts.txt:2-6`; observed: `scripts/workflow-gates/publication.json: changes the digest of 5 reviewed contracts: 935 940 941 943 944` |
| C51 | FACT | The digest of the hook at the design HEAD. | source: `docs/sessions/evidence/task945/design/p09-reviewed-scopes-and-base.txt:7-7`; observed: `5efddf6e47e4dbbf6a45628aee31ab5aa12dd73bb856f46b6192751569c17935` |
| C52 | FACT | A sensitivity break resolves its target from the working folder of the process. | source: `scripts/workflow-gates/sensitivity-register.mjs:16-16`; observed: `target: resolve(process.cwd(), spec.target)` |
| C53 | FACT | The old-versus-new run of Task 942 ends with no lost target on the corrected prototype. | source: `docs/sessions/evidence/task942/review/r6-superset.txt:2-2`; observed: `matrix 26367 commands; fuzz 60000 commands; exceptions 0; slowest 6 ms; corrections section 5 names 2; LOST 0` |
| C54 | FACT | The same run found 1011 lost targets on the first prototype, whose hand-written tests were green. | source: `docs/sessions/evidence/task942/review/r6-superset-first-prototype.txt:61-61`; observed: `LOST 1011` |
| C55 | FACT | That run names its accepted corrections in one rule. | source: `docs/sessions/evidence/task942/review/r6-superset.mjs:33-33`; observed: `const corrected = (command, target) =>` |
| C56 | FACT | The readiness rule this task changes has room under 8 KB. | source: `docs/sessions/evidence/task945/design/p09-reviewed-scopes-and-base.txt:9-9`; observed: `.claude/rules/shared/task-readiness.md: 8010 bytes` |
| C57 | FACT | The rule size check limits operational rule files. | source: `scripts/workflow-gates/check-workflow.mjs:99-99`; observed: `export function validateRuleSizes(root)` |
| C58 | FACT | The type check writes an incremental build file. | source: `tsconfig.json:19-19`; observed: `"incremental": true,` |
| C59 | FACT | That build file is ignored by Git. | source: `.gitignore:43-43`; observed: `*.tsbuildinfo` |
| C60 | FACT | The folder of the tool's state is ignored by Git. | source: `.gitignore:56-56`; observed: `/test-results/` |
| C61 | FACT | A command that takes one file at a time runs per file and names the bad one. | source: `docs/sessions/evidence/task945/design/p04-prototype-run.txt:20-20`; observed: `PASS a {file} command runs per file and names the bad one: exit 2` |
| C62 | FACT | A self-test asserts that the real settings give no error. | source: `docs/sessions/evidence/task945/design/p11-consumers-of-changed-symbols.txt:5-5`; observed: `assert.deepEqual(validateSettings(process.cwd(), settings), []);` |
| C63 | FACT | ESLint lints a quoted App Router path with brackets. | source: `docs/sessions/evidence/task945/design/p12-real-paths-and-cost.txt:2-2`; observed: `files linted 2; bracket path among them: true` |
| C64 | FACT | Node start and the status of the roots cost about 60 ms on this tree. | source: `docs/sessions/evidence/task945/design/p12-real-paths-and-cost.txt:6-6`; observed: `node start and git status of the roots, this tree, 5 runs:` |
| C65 | FACT | No leftover copy imports a source file, so vitest related does not reach them. | source: `docs/sessions/evidence/task945/design/p12-real-paths-and-cost.txt:7-7`; observed: `leftover copies 5; importing a src file 0` |
| C66 | FACT | The digest of a contract reads the text of its rule inputs. | source: `scripts/workflow-gates/contract.mjs:72-72`; observed: `...workflowRuleInputs(root, contract.rules` |
| C67 | FACT | A change of workflow-gates.md changes the digest of all nine reviewed contracts. | source: `docs/sessions/evidence/task945/design/p13-rule-inputs-of-reviewed-contracts.txt:5-5`; observed: `.claude/rules/shared/workflow-gates.md: changes the digest of 9 reviewed contracts` |
| C68 | FACT | The publication check reads a listed file from the working tree. | source: `scripts/workflow-gates/publication.mjs:15-15`; observed: `if (overlay.has(file)) return readFileSync(path, 'utf8');` |
| C69 | FACT | A change of CLAUDE.md changes the digest of contract 935 only. | source: `docs/sessions/evidence/task945/design/p13-rule-inputs-of-reviewed-contracts.txt:10-10`; observed: `CLAUDE.md: changes the digest of 1 reviewed contracts: 935` |
| C70 | FACT | vitest related accepts a quoted App Router path with brackets and reaches its test. | source: `docs/sessions/evidence/task945/design/p12-real-paths-and-cost.txt:5-5`; observed: `vitest related, the bracket source: exit 0; Test Files  1 passed (1)` |
| D1 | OWNER DECISION | Governance tasks are implemented by Opus in a separate session. | owner: 2026-11-01; decision: `Opus, a separate session (Recommended)` |
| D2 | OWNER DECISION | Approval independence is enforced by the hook. | owner: 2026-11-01; decision: `Yes, the hook blocks (Recommended)` |
| D7 | OWNER DECISION | Every CI fix is committed on task/935-governance-approval-route and published in PR #12. | owner: 2026-11-01; decision: `Everything in PR #12 (Recommended)` |
| D25 | OWNER DECISION | A tool always checks written code for quality and for its effect on other code, and problems are solved at once. | owner: 2026-11-04; decision: `a mechanism (tool) must be created that always checks written code for quality and for how it affects other code in the project. The task is this: code written, then a quality check, then a check of how this code affects other written code in the project and whether there are problems. If there are problems, solve them at once.` |

## Mobile adaptation record
- Scope: none

## 4. Scope and out of scope

In scope (the implementer writes exactly these): new `scripts/workflow-gates/code-check.mjs`, `scripts/workflow-gates/code-check.json`,
`scripts/workflow-gates/code-check.selftest.mjs`, `scripts/workflow-gates/hook-differential.mjs` and `scripts/workflow-gates/hook-corrections.json`;
`.claude/settings.json`; `scripts/workflow-gates/check-workflow.mjs`; `scripts/workflow-gates/publication.json`;
`CLAUDE.md`; `.claude/rules/shared/task-readiness.md`; the stage/implementation/report/sensitivity fields of this
task's `.security.json`; and the evidence files `docs/sessions/evidence/task945/impl/completion-report.md`,
`docs/sessions/evidence/task945/impl/governance-report.json`, `docs/sessions/evidence/task945/impl/base-runs.txt`,
`docs/sessions/evidence/task945/sensitivity/sensitivity.json`, and a break spec `<case>.break.json` and artifact `<case>.txt` in that folder for each of the five critical cases.
Written by the approver only (R9): `scope` entries in the `review.rebases` of the 935, 940, 941, 943 and 944 contracts with evidence
`docs/sessions/evidence/task945/review/scope-rebase-935.md`, `…-940.md`, `…-941.md`, `…-943.md` and `…-944.md`.

Out of scope: every product file; `scripts/workflow-gates/security-hook.mjs` (the guard closure covers the tool with no change, C43);
`.claude/rules/shared/workflow-gates.md` and its companions (a digest input of all nine reviewed contracts, C66, C67); every
existing self-test file; a CI job for this tool (CI's existing jobs stay the outer layer); fixing the design-token findings at HEAD (C32), the
mojibake findings (C33) or the leftover test copies (C24); a check of the UI contract before a commit (C34).

## 5. Current and required behaviour

Today nothing runs after a write (C1); the checks exist and run only if the agent remembers them, or in CI after a push.

| Moment | Who triggers it | What runs | On failure |
|---|---|---|---|
| Session start | Claude Code | records the hash of every code file already changed | nothing to fail |
| After every tool call, in a subagent too (C6) | Claude Code | the `write` commands of each code file changed since the session start and not yet checked at its hash | exit 2: the text reaches the agent at once (C2) |
| Agent or subagent wants to finish (C3, C7) | Claude Code | remaining `write` commands, then the `stop` commands of every changed file not yet passed at its hash | exit 2: the agent continues and must fix it (C3) |

A session that changed no code runs no command. A failed version is shown once after a tool call, and again at every Stop until it changes.

## Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R1 [C10; C12; C18; C52; C60; C63; C64; C70; D25] | **Finding what changed.** `code-check.mjs` exports `async function runCodeCheck(event, root)` returning `{ status, message }`, with no `process.exit`, reads its registry and state under `root`, and is a hook process only through a guarded main that reads JSON from stdin, writes `message` to stderr and exits with `status`. The in-process export exists so that a sensitivity break reaches it (C52). At SessionStart it records, unless a state exists for the session, `git status --porcelain -z --untracked-files=all -- <roots>` reduced to registry-matched files with the sha256 of each; a rename or copy reads its old path as the entry it is; a path reaches a command quoted and with forward slashes, so an App Router path with brackets works (C63, C70). At each other event it computes the same snapshot; a file is changed when its hash differs from the baseline; `tool_input.file_path` adds a file the snapshot cannot show. A missing state starts a baseline at that event. No command text is parsed. State is saved atomically by temp file and rename in `test-results/code-check/<session>.json`, and holds a `seen` map of event names. | P1 | AC1 |
| R2 [C2; C6; C8; C27; D25] | **Quality check at once.** At PostToolUse it runs the `write` commands of each changed file not passed and not failed at its current hash. A failure returns status 2 and a message that starts `CODE CHECK FAILED after a write to <files>. Fix this now, before anything else:`, then each failing command, its exit code and its last `tailLines` lines. A failed version is not rerun at PostToolUse. A pass is stored by hash. | P1 | AC2 |
| R3 [C3; C4; C7; C9; C11; C16; C18; C22; C23; C24; C35; C65; D25] | **Effect on other code before finishing.** At Stop and SubagentStop it runs the remaining `write` commands and the `stop` commands of each changed file not passed at its hash. A failure returns status 2 with a message that starts `CODE CHECK FAILED: how <files> affects the rest of the project. Fix this before finishing:`, on every attempt until the file changes, whatever `stop_hook_active` says. The message ends by saying that a session that wrote none of these files reports that instead of changing them. A deleted file runs the commands that name no file, so a consumer of it is reported. Output holding `No test files found` returns status 2 once per file version with `CODE CHECK NOTE: no test reaches <files>. …`, naming the type check as the only proof and telling the agent to add a test or say so in its report. | P1 | AC3 |
| R4 [C5; C13; C14; C15; D25] | **A check that did not run is a failure.** The registry's `timeoutMs.write` is 50000 and `timeoutMs.stop` 240000, each for a whole stage, so a stage ends before the hook timeouts of R7, which would discard the decision (C5). A command past that limit is killed with its whole process tree (`taskkill /T /F` on Windows, a process group otherwise) and reported as `could not finish`. An unreadable registry, a failed `git status` and any exception return status 2 with `CODE CHECK COULD NOT RUN: …`. No path returns 0 for a command that did not finish. | P1 | AC4 |
| R5 [C17; C20; C21; C25; C26; C27; C28; C29; C30; C31; C32; C33; C34; C36; C37; C38; C58; C59; C61; C63; D25] | **The registry.** `scripts/workflow-gates/code-check.json` holds `roots`, `timeoutMs`, `tailLines` and `rows` of `{ paths, write, stop }`, exactly the table below. A command with `{files}` gets all changed files of its row; with `{file}` it runs once per file; an entry `{ run, namesFile: true }` is a whole-tree gate whose non-zero exit counts only when its output names a changed file (C17, C32). Each command is proven able to fail (C26–C36): ESLint is not used for scripts, because it ignores them (C25, C26). | P1 | AC5 |
| R6 [C51; C53; C54; C55; D25] | **Old versus new for the shared hook.** `scripts/workflow-gates/hook-differential.mjs` exports `differential(oldHook, newHook, { corrections, limit })`, returning `{ compared, lost, named, thrown, slowest, lines }`, built from the matrix and seeded fuzz of `docs/sessions/evidence/task942/review/r6-superset.mjs`. Its main compares the working `security-hook.mjs`, or a hook path given as its one argument, with the blob at `HEAD`, prints `LOST <n>` and exits 1 when a target of the old hook is lost and no correction names it. `scripts/workflow-gates/hook-corrections.json` holds rows `{ baseSha256, commandPattern, targetPattern, reason }`; a row applies only when the sha256 of the old hook, its bytes as `git show` gives them, equals its `baseSha256`, so a correction ends with the commit it was written for. It is seeded with the rule of C55, split into rows, with the digest of C51, because Task 942 revision 5 names those corrections. | P1 | AC6 |
| R7 [C39; C40; C41; C42; C43; C44; C47; C48; C49; C62; C68; D25] | **Always on.** `.claude/settings.json` registers `node` with `${CLAUDE_PROJECT_DIR}/scripts/workflow-gates/code-check.mjs`, matcher `''` and `onFailure: block` for SessionStart (timeout 15), PostToolUse (60), Stop (300) and SubagentStop (300). `validateSettings` reports an error naming each of those events when its registration is missing. `publication.json` `ownedFiles` lists the five new files. | P1 | AC7 |
| R8 [C56; C57; C66; C67; C69; D25] | **The rule.** `CLAUDE.md` section `## Automation`, which every session loads, gets one paragraph: the tool runs after every write and before finishing; a failure is fixed at once, not reported as done; a green tool is no proof of behaviour no check reaches. `shared/task-readiness.md` section 1 gets two sentences: a manifest row names places, and a change of shared logic also gets an executed old-versus-new run over generated inputs, prototypes included; which contracts a changed file stales is measured by `scopeDigest`, not read from `scope`. `task-readiness.md` stays at or under 8192 bytes. | P1 | AC8 |
| R9 [C45; C46; C49; C50; D1; D2; D7; D25] | **Proof and rebases.** The eight cases of the sidecar live in the new `scripts/workflow-gates/code-check.selftest.mjs`. After approving, the approver appends a `scope` entry by this contract to the `review.rebases` of the 935, 940, 941, 943 and 944 contracts, each with `## Changed scope files` evidence listing exactly its files, and recomputes nothing else in them: 935 `.claude/settings.json`, `CLAUDE.md`, `scripts/workflow-gates/check-workflow.mjs`, `scripts/workflow-gates/publication.json`; 940, 941 and 943 `scripts/workflow-gates/publication.json`; 944 `scripts/workflow-gates/publication.json`, `.claude/rules/shared/task-readiness.md`. The other four reviewed contracts stay unchanged (C50). | P1 | AC9, AC10 |

The registry of R5, with `E` = `node node_modules/eslint/bin/eslint.js --quiet`, `I` = `node scripts/check-file-integrity.mjs --files {files}`,
`T` = `node node_modules/typescript/bin/tsc --noEmit --pretty false`, `G` = `node scripts/workflow-gates/selftests.mjs`,
`W` = `node scripts/workflow-gates/check-workflow.mjs`. Roots: `src`, `scripts`, `.claude/hooks`, `.claude/settings.json`, `messages`.

| Paths | `write` | `stop` |
|---|---|---|
| `src/**/*.ts`, `src/**/*.tsx` | `E {files}`; `I`; `T` | `node node_modules/vitest/vitest.mjs related {files} --run --passWithNoTests --reporter=dot` |
| `src/**/*.tsx`, `src/**/*.css` | `I` | `{ run: "node scripts/check-design-tokens.mjs --strict", namesFile: true }` |
| `scripts/**/*.mjs`, `scripts/**/*.js`, `scripts/**/*.cjs` | `I` | `G` |
| `scripts/**/*.json` | `I` | `G`; `W` |
| `scripts/workflow-gates/security-hook.mjs` | | `node scripts/workflow-gates/hook-differential.mjs` |
| `.claude/hooks/*.ps1` | the PowerShell parse command of `p05-registry-commands.mjs:14`, with `{file}` | `W` |
| `.claude/settings.json` | `I` | `W` |
| `messages/*.json` | `I` | `node scripts/check-i18n-parity.mjs` |

## Acceptance criteria

All self-test cases run on a temporary Git repository from `mkdtempSync` holding its own registry, passed as `root`, with fixture check scripts and,
for AC3, the real `tsc` of this project; the test removes it. They call `runCodeCheck` in process, except where a criterion says process.

- **AC1 [R1].** GOV-945-HOOK-SHELL-WRITE-DENY passes: a fixture file changed by a direct file write, with a Bash event that names no file and a
  command text that does not mention it, is checked and refused. A file already dirty at SessionStart with an unchanged hash runs nothing. A staged
  rename is checked under its new name. A fixture file at `src/app/[locale]/page.ts` reaches a `{files}` command with its exact path. A missing state starts a baseline. Stop after no code change runs no command, shown by a fixture command that writes a marker file which stays absent. The state holds `seen`.
- **AC2 [R2].** GOV-945-HOOK-WRITE-DENY passes: a fixture lint failure returns status 2 with the literal start of R2 and the failing line; the next PostToolUse on the same version returns 0 and writes no marker; a fix returns 0.
- **AC3 [R3].** GOV-945-HOOK-IMPACT-DENY passes: a changed signature in `owner.ts` is reported in `consumer.ts`, never written, as `error TS2345` by the real `tsc`; a renamed `owner.ts` is reported as `error TS2307`; a deleted `owner.ts` is reported too; a failing fixture stop command returns status 2 with the literal start of R3 on two attempts, the second with `stop_hook_active: true`; a fixed version returns 0; an unchanged passed version runs no command; `No test files found` returns status 2 once and then 0.
- **AC4 [R4].** GOV-945-HOOK-TIMEOUT-ERROR passes: a fixture command that spawns a child, writes both process ids and hangs, under `timeoutMs.stop` 3000, returns status 2 with `could not finish`, and after return neither id is alive by `process.kill(id, 0)`. An unreadable registry and a folder that is no Git repository each return status 2 with `CODE CHECK COULD NOT RUN`. One test spawns the real main as a process, with JSON on stdin and `CLAUDE_PROJECT_DIR` at the fixture, and observes exit 2 and the text on stderr.
- **AC5 [R5].** A test named `[GOV-945-HOOK-CLEAN-ALLOW] …` passes: a clean fixture write returns 0 at PostToolUse and Stop. A test reads the real registry and asserts: the rows and commands of R5 exactly; no row of `scripts/` holds ESLint; no command names `check-mojibake` or `check-ui-contract`; each script a command runs exists. A `namesFile` fixture gate with a finding outside the change returns 0, and with a finding in a changed file returns 2.
- **AC6 [R6].** GOV-945-HOOK-DIFFERENTIAL-DENY passes, with in-memory hooks as both arguments and `limit` 500: equal hooks report `lost` 0; a new hook dropping one target reports `lost` above 0 with the command in `lines`; a matching correction moves it to `named`; the same correction with another `baseSha256` does not. `node scripts/workflow-gates/hook-differential.mjs` on the tree exits 0 with `LOST 0`, inside the 240000 of R4, and its time is in the report. `code-check.json` runs it on a change of the hook only.
- **AC7 [R7].** GOV-945-CI-SETTINGS-DENY passes: the real settings give `validateSettings` no error; removing the registration from each of the four events, one at a time, gives an error naming that event; a narrowed matcher gives the error of C39. `hookModuleClosure` of the real root holds `scripts/workflow-gates/code-check.mjs`. `node scripts/workflow-gates/check-workflow.mjs` and `node scripts/workflow-gates/publication.mjs --base HEAD` exit 0. The real registered command, read from the settings with the variable replaced by the fixture root, runs as in AC4.
- **AC8 [R8].** The paragraph and the two sentences of R8 exist; `node scripts/workflow-gates/check-workflow.mjs` reports no error; `wc -c` of `task-readiness.md` is at or under 8192; `git status --short .claude/rules/shared/workflow-gates.md` prints nothing.
- **AC9 [R9; D1].** GOV-945-HOOK-EXECUTOR-DENY passes: `evaluateHook` for a Sonnet Edit of `code-check.mjs`, `code-check.json`, `hook-differential.mjs` and `hook-corrections.json` is refused with `POLICY-EDIT AUTHORITY REQUIRED` or `SECURITY TEST CONTRACT MISSING`. `node scripts/workflow-gates/selftests.mjs` exits 0, with its base run saved first. `cli.mjs sensitivity` gives a baseline pass, a failing assertion and a restored pass for the five critical cases. `cli.mjs governance-report` and `cli.mjs verify` on this sidecar exit 0. `git status --short` shows no existing self-test file and no file outside section 4 changed by this task.
- **AC10 [R9; D2].** After the rebases, the harness `docs/sessions/evidence/task944/review/r3-ac11-harness.mjs`, extended with this contract, reports no error for the 935, 940, 941, 943, 944 and 945 contracts, and `reviewedFreshnessErrors` for that selection returns `[]`, which also proves the four reviewed contracts this task does not touch stay fresh. Live proof by the approver, whose fresh session loaded the settings: `test-results/code-check/<its session>.json` exists and its `seen` holds SessionStart and PostToolUse. Stop stays for the first session after it, the Task 942 implementer, whose completion report says what the tool reported.

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | The hook process `scripts/workflow-gates/code-check.mjs` and its registry `code-check.json`; the settings registration read by `validateSettings` (C39–C42); the pre-write guard closure (C43, C44); the state folder (C60); `hook-differential.mjs` and `hook-corrections.json`. |
| Frontend security | Governance has no browser consumer; the hook layer replaces this row: GOV-945-HOOK-WRITE-DENY, GOV-945-HOOK-IMPACT-DENY, GOV-945-HOOK-SHELL-WRITE-DENY, GOV-945-HOOK-DIFFERENTIAL-DENY, GOV-945-HOOK-CLEAN-ALLOW, GOV-945-HOOK-TIMEOUT-ERROR and GOV-945-HOOK-EXECUTOR-DENY on the real `runCodeCheck`, `differential` and `evaluateHook`. |
| Server security | The CI layer replaces this row: GOV-945-CI-SETTINGS-DENY on the real `validateSettings` and the real settings; `check-workflow.mjs` and the gate suite run in CI. |
| Database/integrations | Not applicable: the tool reads and hashes source files and runs local checks; no database, Storage, Realtime or provider path. |
| Cases | The eight GOV-945 cases of the sidecar with actor, resource, input, response and forbidden effects; allow, deny and error outcomes; hook and CI layers. |
| Fixtures and environment | Temporary Git repositories from `mkdtempSync` with synthetic files and registries, removed by the test; the repository settings read-only; native Windows PowerShell 5.1, Node 22.22.3; CI on Linux for the other kill branch. |
| Sensitivity proof | Critical cases GOV-945-HOOK-WRITE-DENY (the PostToolUse failure path returns 0), GOV-945-HOOK-IMPACT-DENY (the Stop failure path returns 0), GOV-945-HOOK-SHELL-WRITE-DENY (only `tool_input.file_path` counts as changed), GOV-945-HOOK-DIFFERENTIAL-DENY (a lost target is not counted) and GOV-945-CI-SETTINGS-DENY (the registration check is removed), each as a saved break spec run by `cli.mjs sensitivity`, in memory; baseline pass, isolated break failing with an assertion, restored pass. |
| Execution | `node scripts/workflow-gates/cli.mjs governance-report --contract tasks/Sprints/Sprint_92_kickoff_prompt_Task_945_Written_Code_Is_Always_Checked.security.json`, then `cli.mjs verify` on the same path; QA Q1. |

## 6. Ordered route

1. **Owner** (separate PowerShell window, `C:\Claude_Code_Projects\lero-al`): stay on `task/935-governance-approval-route` (D7); commit this
   design with the command Opus gives. **Prerequisite, before the first write of step 2:** `git status --short scripts .claude` prints nothing.
2. **Opus implementer, fresh session** (D1; not the session of this kickoff): read this kickoff and its bundle; read `p03-code-check-prototype.mjs`,
   `p04-prototype-run.mjs` and `r6-superset.mjs`, design evidence to read, not code to paste. Save the base run of
   `node scripts/workflow-gates/selftests.mjs` to `docs/sessions/evidence/task945/impl/base-runs.txt` before the first write. Write the tool, registry,
   differential and corrections; then the self-test; then `check-workflow.mjs` and `publication.json`; then the settings, last, because
   validateSettings wants the hook target to exist (`p08-registration-probe.txt:2`); then the two rule texts. The settings take effect in a new session, so this session
   does not run under the tool. Set stage `implemented`, save the break specs and run the critical cases with `cli.mjs sensitivity`; never edit a gate to plant a break.
3. Run `cli.mjs governance-report` and every AC command, write the completion report and run `cli.mjs governance-report` again, because that report
   is part of the scope digest; end with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` and the explicit-path commit command for the owner. No push.
4. **Opus approver, another fresh session** (D2; not the session of this kickoff): review R1–R9, run the live proof of AC10; on approval write the
   `review` block and stage `reviewed`, write the five R9 `scope` entries with their evidence, run AC10 and hand off the explicit-path commit under
   `shared/git-publication.md`. PR #12 merges only after green PR checks (D7). The next route is Task 942.

## 7. Completion report

Per requirement: changed files, evidence path, status; each GOV-945 case with its result; each sensitivity diff with the failed assertion; base and
final self-test totals; the time of the tool on a clean event, a TypeScript write and the differential; proof that no existing self-test file changed;
every limit of section 3 that the work confirmed or changed; one of `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 8. Rule compliance

| Rule | How this kickoff complies |
|---|---|
| `claim-evidence-contract.md` | Every R cites ledger rows; sources are the repository and executed probes under `docs/sessions/evidence/task945/design/`. |
| `security-testing.md` | Governance contract: hook and CI layers, allow/deny/error, sensitivity for the five critical cases, Q1. |
| `role-boundaries.md` | Opus implements policy (D1); Sonnet is not routed (C45, C46); approval by an independent session (D2). |
| `git-publication.md` | Task-branch commit on PR #12's branch (D7); merge only after green checks. |
| `mobile-adaptation-contract.md` | No visible scope: `Scope: none`. |

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31, C32, C33, C34, C35, C36, C37, C38, C39, C40, C41, C42, C43, C44, C45, C46, C47, C48, C49, C50, C51, C52, C53, C54, C55, C56, C57, C58, C59, C60, C61, C62, C63, C64, C65, C66, C67, C68, C69, C70; owner decisions: D1, D2, D7, D25; blocked claims: NONE.
