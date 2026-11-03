# Task 944 — Sensitivity breaks exist only in the test process, and no write leaves a hook module unparseable

Sprint 92. P1. QA profile **Q1** (non-UI gate code and its tests, `docs/qa-profiles.md`). Kickoff by Opus, 2026-11-03, at the
owner's instruction to file a governance task so that deliberate breaks are made only on copies (D15), with the scope and placement
the owner chose (D16, D17). D15 is a later explicit owner instruction for this subject; D13 (no new task) is not reopened for any
other subject.
**Revision 1, 2026-11-03**, by the Task 943 review 2 session (6f2564f3), at the owner's choice D18 (that session's 943 verdict
was then withdrawn because the Stop hook's independence check counted its own commands as writes; a further fresh session
approves 943): the shell write forms that review found missed by the 943 hook, which already existed before 943, are closed
here in the same hook file instead of a new task or a new 943 revision (C58–C70): shell compound-command keywords, clustered
nested-shell flags, `open(…, 'w')` and .NET create calls, `pathlib` and directory-delete calls, `xcopy`, `robocopy`, `rimraf`,
`shx`, `perl -i`, `env -C`, and a glob of a parser-rejected command left unexpanded because the same text is quoted elsewhere.
R8, R9, AC12, the case GOV-944-HOOK-SHELL-FORMS-DENY, C58–C70 and D18 are added; sections 1, 2, 4, 5, the security contract, the
route, the completion report and AC10 are amended.
**Revision 2, 2026-11-03**, by the Task 943 review 3 session (e50584bc, the approver of 943), under D18 and D14: that review found
one more listed-form miss of the reviewed 943 hook, a generic file API name after `require('fs').promises.` (C71), and closes it
here with the other R8 forms: R8 (f), its AC12 forms and controls, C71 and C72 are added and the evidence receipt now lists
C58–C72 and D18.

## 1. Mode, task type and rule bundle

Governance task. **Implementer: Opus, in a fresh implementation session started for this task (D1); Sonnet does not execute it**,
because every executor path in scope is a policy path (C31). **Approver: Opus, in another fresh session that wrote none of the scope
files (D2).** Neither may be the session that designed this kickoff (session 3d40df28) or the session that wrote revision 1
(session 6f2564f3, the Task 943 review 2 session). Types (`docs/rule-index.md`): workflow
gates / governance tooling. Bundle: `.claude/rules/shared/workflow-gates.md` with `workflow-contract.md`, `workflow-evidence.md`,
`workflow-ci.md`, `git-publication.md`; `security-testing.md`; `security-test-quality.md`; `role-boundaries.md`;
`claim-evidence-contract.md`; `task-readiness.md`; `orchestration-state.md`; `.claude/rules/review/02-adversarial-ui.md`;
`.claude/rules/review/03-decision-closure.md`.

## 2. Objective

On 2026-11-03 a sensitivity break was planted with the Edit tool in the live `scripts/workflow-gates/contract.mjs` (C9). Its `//`
commented out the rest of line 197 (C6), the module stopped parsing, and the security hook, which imports it (C5) and runs before
every Edit, Write, Bash and PowerShell call with `onFailure: block` (C1–C3), refused every tool, including the Edit that would have
restored the line (C7); the Stop hooks failed on every response for the same import (C4, C8). Only the owner could repair it from an
outside terminal. The rule already asks for a disposable copy or an in-memory injection (C10), but nothing provides or checks one.

After this task: (1) `cli.mjs sensitivity` makes a break only in the memory of the test process and records it (D16); (2) a
governance sensitivity record not made that way is refused, except in the four contracts that predate the command (D16); (3) the
pre-write guard refuses an Edit or Write that would leave a module loaded by a hook unparseable or unable to load (D16; a
missing imported file or a removed export kills the hook the same way, C52, C53); (4) revision 1 (D18): the shell write forms of
R8, which the reviewed 943 hook reports nothing for (C58–C66, C68) although an executor `if true; then rm package.json; fi` changes a
product file unrefused (C67), are reported, so the independence check counts them and the pre-write guard decides on them.

## 3. Verified context

The security hook is the first PreToolUse hook for Edit, Write, Bash and PowerShell and blocks on failure (C1–C3); the Stop hooks run
it too (C4); it imports `contract.mjs` (C5) and handles Write and Edit in one branch (C42). The trap is retained in C6–C8; the 943
implementer's artifacts record live-file edits (C9); the restored file equals the 943 baseline (C20). Rules: the quality contract
already requires a disposable copy or in-memory injection (C10); the governance paragraph requires a record but names no method
(C11); task readiness asks the designer to name each break (C45); review checks the intended assertion failure (C46). Records: the
report validator checks only the five result fields (C12); `governanceReport` copies records from the sensitivity file (C13) and runs
tests with a filtered environment (C14, C15) parsed by `parseTap` (C16).

Executed probes: a Node `load` hook that replaces the target's source in memory fails the 943 AC8 case with its assertion (C17),
passes with an identity replacement (C18), turns the incident's form into a file-level failure, not an assertion (C19), leaves the
live files unchanged (C20), and reaches child processes only through `NODE_OPTIONS` (C21, C22); an anchored, escaped full test
name selects exactly one test (C48) and the mutant's TAP carries `ERR_ASSERTION` (C49). The closure of hook-loaded modules
built from `.claude/settings.json` and `.claude/hooks/*.ps1` contains `contract.mjs` (C23); `node --check` from stdin refuses the
incident's Edit result (C24), accepts a block-comment break (C25), in about 36 ms (C26). One closure module, `session-role.mjs`, is CRLF in the working tree
(C50), where a literal match of a multi-line LF `old_string` fails (C51), so the guard normalizes line ends before it computes an
Edit result. `node --check` accepts an import of a file not written yet and a removed export that the hook imports (C52, C53);
linking the graph with `vm.SourceTextModule` refuses both (C54, C55), links the live graph without evaluating it (C56), and needs
no package resolution because the hook-loaded modules import only relative files and builtins (C57). Design baseline: 190 of 191 self-tests pass;
the failure is Task 941's case under the uncommitted Task 943 tree (C27, C28, C44). Self-tests are discovered by name (C29) and listed
in `publication.json` (C30). The reviewed 935, 940 and 941 contracts and the 943 contract scope the changed code files (C33–C36);
neither rule file this task changes is in a reviewed contract's digest (C37, C38). Opus implements governance tasks (C39); no copy of
the project may be created (C40), which the in-memory method respects. Task 942's critical break (C41) targets its scoped gate script
(C43), and its break text occurs once there (C47).

## Claim ledger

| ID | Status | Claim | Evidence |
|---|---|---|---|
| C1 | FACT | The first PreToolUse hook group matches Edit, Write, Bash and PowerShell. | source: `docs/sessions/evidence/task944/design/sources/.claude__settings.json.txt:35-35`; observed: `"matcher": "Edit` |
| C2 | FACT | That group runs the security hook. | source: `docs/sessions/evidence/task944/design/sources/.claude__settings.json.txt:41-41`; observed: `${CLAUDE_PROJECT_DIR}/scripts/workflow-gates/security-hook.mjs` |
| C3 | FACT | A failure of that hook blocks the tool call. | source: `docs/sessions/evidence/task944/design/sources/.claude__settings.json.txt:44-44`; observed: `"onFailure": "block",` |
| C4 | FACT | The Stop hooks also run the security hook. | source: `docs/sessions/evidence/task944/design/sources/.claude__settings.json.txt:173-173`; observed: `${CLAUDE_PROJECT_DIR}/scripts/workflow-gates/security-hook.mjs` |
| C5 | FACT | The security hook imports the contract module. | source: `docs/sessions/evidence/task944/design/sources/scripts__workflow-gates__security-hook.mjs.txt:7-7`; observed: `from './contract.mjs';` |
| C6 | FACT | The live line 197 carried a break whose line comment swallowed the rest of the line. | source: `docs/sessions/evidence/task944/design/p00-incident.md:30-30`; observed: `// SENSITIVITY BREAK` |
| C7 | FACT | Every guarded tool call failed with a syntax error of the imported module. | source: `docs/sessions/evidence/task944/design/p00-incident.md:16-16`; observed: `SyntaxError: Unexpected token 'if'` |
| C8 | FACT | The Opus Stop gate failed on the same import. | source: `docs/sessions/evidence/task944/design/p00-incident.md:23-23`; observed: `orchestrator-response-gate.ps1` |
| C9 | FACT | The Task 943 implementer applied its breaks by editing the live file. | source: `docs/sessions/evidence/task943/sensitivity/GOV-943-TESTS-REBASE-DENY.txt:3-3`; observed: `Applied and restored with the Edit tool` |
| C10 | FACT | The test-quality rule already asks for a disposable copy or an in-memory injection. | source: `docs/sessions/evidence/task944/design/sources/.claude__rules__shared__security-test-quality.md.txt:78-79`; observed: `in-memory injection supported by the harness` |
| C11 | FACT | The governance paragraph requires a sensitivity record without naming a method. | source: `docs/sessions/evidence/task944/design/sources/.claude__rules__shared__security-testing.md.txt:44-45`; observed: `record (baseline pass, isolated break failing with an assertion, restored pass)` |
| C12 | FACT | The governance report validator checks only the result fields of a critical record. | source: `docs/sessions/evidence/task944/design/sources/scripts__workflow-gates__contract.mjs.txt:430-430`; observed: `s?.failureKind === 'assertion'` |
| C13 | FACT | governanceReport copies each record from the sensitivity file. | source: `docs/sessions/evidence/task944/design/sources/scripts__workflow-gates__cli.mjs.txt:211-211`; observed: `record.sensitivity = proof[0]` |
| C14 | FACT | governanceReport runs the case tests with the filtered unit environment. | source: `docs/sessions/evidence/task944/design/sources/scripts__workflow-gates__cli.mjs.txt:192-192`; observed: `env: unitEnvironment(process.env)` |
| C15 | FACT | The unit environment keeps only an allowlist of basic variables. | source: `docs/sessions/evidence/task944/design/sources/scripts__workflow-gates__cli.mjs.txt:224-224`; observed: `const allowed = /^(?:path` |
| C16 | FACT | A TAP parser for node test output exists. | source: `docs/sessions/evidence/task944/design/sources/scripts__workflow-gates__cli.mjs.txt:180-180`; observed: `export function parseTap(output) {` |
| C17 | FACT | The in-memory break of the 943 AC8 case fails it with its assertion (executed). | source: `docs/sessions/evidence/task944/design/p01-loader-run.txt:13-13`; observed: `error: 'case ID removed from the test file'` |
| C18 | FACT | An identity replacement through the same loader passes the case (executed). | source: `docs/sessions/evidence/task944/design/p01-loader-run.txt:23-23`; observed: `ok 1 - [GOV-943-TESTS-REBASE-DENY]` |
| C19 | FACT | The incident's syntax-breaking form fails the file, not the named test (executed). | source: `docs/sessions/evidence/task944/design/p01-loader-run.txt:33-33`; observed: `not ok 1 - scripts` |
| C20 | FACT | After all loader runs the live contract module has the 943 baseline digest (executed). | source: `docs/sessions/evidence/task944/design/p01-loader-run.txt:69-69`; observed: `764f8a58cadf13c4bc3b08901c08a02ecd235e14675f14e481d26d77bb6ef941` |
| C21 | FACT | Through NODE_OPTIONS a child process loads the mutant (executed). | source: `docs/sessions/evidence/task944/design/p01-loader-run.txt:66-66`; observed: `NODE_OPTIONS:  child sees mutant` |
| C22 | FACT | With only --import on the parent, a child process loads the live module (executed). | source: `docs/sessions/evidence/task944/design/p01-loader-run.txt:65-65`; observed: `--import only: child sees live` |
| C23 | FACT | The closure of hook-loaded modules contains the contract module (executed). | source: `docs/sessions/evidence/task944/design/p02-closure-run.txt:4-4`; observed: `scripts/workflow-gates/contract.mjs` |
| C24 | FACT | A stdin syntax check refuses the incident's Edit result (executed). | source: `docs/sessions/evidence/task944/design/p02-closure-run.txt:6-6`; observed: `incident Edit result: exit 1` |
| C25 | FACT | A block-comment break of the same line parses (executed). | source: `docs/sessions/evidence/task944/design/p02-closure-run.txt:7-7`; observed: `block-comment semantic Edit result: exit 0` |
| C26 | FACT | One stdin syntax check of the contract module takes about 36 ms (executed). | source: `docs/sessions/evidence/task944/design/p02-closure-run.txt:8-8`; observed: `mean check ms: 36` |
| C27 | FACT | At design time the only failing self-test is Task 941's malformed-command case (executed). | source: `docs/sessions/evidence/task944/design/p03-selftests-base.txt:11-11`; observed: `not ok 174 - [GOV-941-HOOK-MALFORMED-ERROR]` |
| C28 | FACT | At design time 190 self-tests pass (executed). | source: `docs/sessions/evidence/task944/design/p03-selftests-base.txt:14-14`; observed: `# pass 190` |
| C29 | FACT | The self-test runner discovers selftest files by name. | source: `docs/sessions/evidence/task944/design/sources/scripts__workflow-gates__selftests.mjs.txt:8-8`; observed: `/^[a-z0-9_-]+\.selftest\.mjs$/.test(file)` |
| C30 | FACT | The gate publication manifest lists each self-test file by path. | source: `docs/sessions/evidence/task944/design/sources/scripts__workflow-gates__publication.json.txt:82-82`; observed: `"scripts/workflow-gates/shell-write.selftest.mjs",` |
| C31 | FACT | Gate scripts and the rules tree are policy paths. | source: `docs/sessions/evidence/task944/design/sources/scripts__workflow-gates__contract.mjs.txt:78-78`; observed: `export const isPolicyPath = file =>` |
| C32 | FACT | Governance contracts carry four required rule inputs. | source: `docs/sessions/evidence/task944/design/sources/scripts__workflow-gates__contract.mjs.txt:85-85`; observed: `export const REQUIRED_GOVERNANCE_RULES` |
| C33 | FACT | The reviewed Task 935 contract scopes the four code files this task changes (executed). | source: `docs/sessions/evidence/task944/design/p04-rebase-targets.txt:2-2`; observed: `scope: scripts/workflow-gates/security-hook.mjs scripts/workflow-gates/contract.mjs scripts/workflow-gates/cli.mjs scripts/workflow-gates/publication.json` |
| C34 | FACT | The reviewed Task 940 contract scopes the same four files (executed). | source: `docs/sessions/evidence/task944/design/p04-rebase-targets.txt:3-3`; observed: `Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json` |
| C35 | FACT | The reviewed Task 941 contract scopes the hook and the manifest (executed). | source: `docs/sessions/evidence/task944/design/p04-rebase-targets.txt:4-4`; observed: `scope: scripts/workflow-gates/security-hook.mjs scripts/workflow-gates/publication.json` |
| C36 | FACT | The Task 943 contract digest includes the four code files (executed). | source: `docs/sessions/evidence/task944/design/p05-rule-owner-candidates.txt:5-5`; observed: `security-hook.mjs=true contract.mjs=true cli.mjs=true publication.json=true` |
| C37 | FACT | The review adversarial phase file is in no reviewed contract digest (executed). | source: `docs/sessions/evidence/task944/design/p05-rule-owner-candidates.txt:2-2`; observed: `.claude/rules/review/02-adversarial-ui.md -> in no reviewed contract digest` |
| C38 | FACT | The task-readiness rule is in no reviewed contract digest (executed). | source: `docs/sessions/evidence/task944/design/p05-rule-owner-candidates.txt:4-4`; observed: `.claude/rules/shared/task-readiness.md -> in no reviewed contract digest` |
| C39 | FACT | Opus implements governance tasks in a separate session. | source: `docs/sessions/evidence/task944/design/sources/.claude__rules__shared__role-boundaries.md.txt:13-13`; observed: `Opus governance implementer` |
| C40 | FACT | No worktree or other copy of the project may be created. | source: `docs/sessions/evidence/task944/design/sources/.claude__rules__shared__role-boundaries.md.txt:80-80`; observed: `checkout, or any other copy of the project.` |
| C41 | FACT | Task 942's critical break makes the allowlist ignore the path. | source: `docs/sessions/evidence/task944/design/sources/tasks__Sprints__Sprint_92_kickoff_prompt_Task_942_Listing_Visibility_Allowlist_Current.md.txt:130-130`; observed: `Sensitivity: making the allowlist` |
| C42 | FACT | The pre-write guard handles Write and Edit in one branch. | source: `docs/sessions/evidence/task944/design/sources/scripts__workflow-gates__security-hook.mjs.txt:713-713`; observed: `if (['Write', 'Edit'].includes(event.tool_name)) {` |
| C43 | FACT | Task 942's contract scopes its gate script. | source: `docs/sessions/evidence/task944/design/sources/tasks__Sprints__Sprint_92_kickoff_prompt_Task_942_Listing_Visibility_Allowlist_Current.security.json.txt:10-10`; observed: `"scripts/check-listing-visibility.mjs",` |
| C44 | FACT | The design ran on HEAD 93612ccea with Task 943 uncommitted. | source: `docs/sessions/evidence/task944/design/p03-selftests-base.txt:2-2`; observed: `HEAD 93612ccead6874a92448fa2a23cf1b8be6da59d8` |
| C45 | FACT | Task readiness asks the designer to name each deliberate break. | source: `docs/sessions/evidence/task944/design/sources/.claude__rules__shared__task-readiness.md.txt:65-65`; observed: `For a gate or critical security invariant specify what deliberate break reaches which assertion` |
| C46 | FACT | The review phase checks the intended assertion failure of sensitivity evidence. | source: `docs/sessions/evidence/task944/design/sources/.claude__rules__review__02-adversarial-ui.md.txt:24-24`; observed: `the intended assertion failure in sensitivity evidence` |
| C47 | FACT | Task 942's break text occurs exactly once in its gate script (executed). | source: `docs/sessions/evidence/task944/design/p06-942-break-text.txt:3-3`; observed: `count: 1` |
| C48 | FACT | An anchored, regex-escaped full test name selects exactly that one test (executed). | source: `docs/sessions/evidence/task944/design/p07-name-pattern-run.txt:4-4`; observed: `GOV-943-TESTS-REBASE-DENY: exit 0; results 1; named 1 passed` |
| C49 | FACT | The in-memory mutant's named result fails and its TAP carries ERR_ASSERTION (executed). | source: `docs/sessions/evidence/task944/design/p07-name-pattern-run.txt:5-5`; observed: `ERR_ASSERTION in TAP: true` |
| C50 | FACT | A hook-loaded module, session-role.mjs, has CRLF line ends in the working tree (executed, self-audit). | source: `docs/sessions/evidence/task944/design/p09-crlf-run.txt:14-14`; observed: `scripts/workflow-gates/session-role.mjs CR count 103` |
| C51 | FACT | In that file a literal match of a two-line LF old_string fails (executed, self-audit; the same line shows it found after CRLF normalization). | source: `docs/sessions/evidence/task944/design/p09-crlf-run.txt:19-19`; observed: `raw includes: false` |
| C52 | FACT | node --check accepts a hook module that imports a file not written yet (executed, self-audit 2). | source: `docs/sessions/evidence/task944/design/p11-link-run.txt:3-3`; observed: `A1 node --check, hook importing a file not written yet: exit 0` |
| C53 | FACT | node --check accepts contract.mjs without an export that the hook imports (executed, self-audit 2). | source: `docs/sessions/evidence/task944/design/p11-link-run.txt:4-4`; observed: `A2 node --check, contract.mjs without the isEvidencePath export: exit 0` |
| C54 | FACT | Linking the hook graph with vm.SourceTextModule refuses the missing imported file (executed, self-audit 2). | source: `docs/sessions/evidence/task944/design/p11-link-run.txt:6-6`; observed: `cannot find module scripts/workflow-gates/not-yet-written.mjs` |
| C55 | FACT | The same link refuses the removed export (executed, self-audit 2). | source: `docs/sessions/evidence/task944/design/p11-link-run.txt:7-7`; observed: `does not provide an export named 'isEvidencePath'` |
| C56 | FACT | The live hook graph links without evaluation (executed, self-audit 2). | source: `docs/sessions/evidence/task944/design/p11-link-run.txt:5-5`; observed: `B0 link, live graph: linked` |
| C57 | FACT | The hook-loaded modules import no bare package specifier (executed, self-audit 2). | source: `docs/sessions/evidence/task944/design/p12-bare-specifiers.txt:3-3`; observed: `other specifiers: 0` |
| C58 | FACT | The reviewed 943 hook reports nothing for a write after the shell keyword `then` (executed, revision 1). | source: `docs/sessions/evidence/task944/design/p14-shell-forms-run.txt:2-2`; observed: `(reviewed hook misses): if true; then rm` |
| C59 | FACT | The reviewed 943 hook reports nothing for a write after the shell keyword `do` (executed). | source: `docs/sessions/evidence/task944/design/p14-shell-forms-run.txt:5-5`; observed: `(reviewed hook misses): for f in a; do rm` |
| C60 | FACT | The reviewed 943 hook reports nothing for a nested shell with a clustered `-lc` flag (executed). | source: `docs/sessions/evidence/task944/design/p14-shell-forms-run.txt:9-9`; observed: `(reviewed hook misses): bash -lc 'rm` |
| C61 | FACT | The reviewed 943 hook reports nothing for a Python `open` with a write mode (executed). | source: `docs/sessions/evidence/task944/design/p14-shell-forms-run.txt:13-13`; observed: `(reviewed hook misses): python -c "open('scripts/workflow-gates/fixture-scope.mjs','w')` |
| C62 | FACT | The reviewed 943 hook reports nothing for a .NET `File]::Create` call (executed). | source: `docs/sessions/evidence/task944/design/p14-shell-forms-run.txt:18-18`; observed: `[IO.File]::Create('scripts/workflow-gates/fixture-scope.mjs')` |
| C63 | FACT | The reviewed 943 hook reports nothing for a `pathlib` `unlink` (executed). | source: `docs/sessions/evidence/task944/design/p14-shell-forms-run.txt:20-20`; observed: `Path('scripts/workflow-gates/fixture-scope.mjs').unlink()` |
| C64 | FACT | The reviewed 943 hook reports no file under a directory deleted by `shutil.rmtree` (executed). | source: `docs/sessions/evidence/task944/design/p14-shell-forms-run.txt:23-23`; observed: `(reviewed hook misses): python -c "import shutil; shutil.rmtree('scripts/workflow-gates')"` |
| C65 | FACT | The reviewed 943 hook reports nothing for `xcopy` and `robocopy` writes (executed). | source: `docs/sessions/evidence/task944/design/p14-shell-forms-run.txt:27-30`; observed: `robocopy docs/src scripts/workflow-gates /MIR` |
| C66 | FACT | The reviewed 943 hook reports nothing for `rimraf`, `shx`, `perl -i` and `env -C` writes (executed). | source: `docs/sessions/evidence/task944/design/p14-shell-forms-run.txt:31-40`; observed: `(reviewed hook misses): env -C scripts/workflow-gates rm fixture-scope.mjs` |
| C67 | FACT | The reviewed 943 pre-write guard allows an executor `rm package.json` after `then` (executed in the Task 943 review 2). | source: `docs/sessions/evidence/task943/review/r2-adv2.txt:17-17`; observed: `executor [] :: if true; then rm package.json; fi` |
| C68 | FACT | A glob of a parser-rejected command is not expanded when the same text is quoted elsewhere in it (executed). | source: `docs/sessions/evidence/task944/design/p14-shell-forms-run.txt:41-41`; observed: `(reviewed hook misses): echo 'scripts/workflow-gates/*.mjs'; rm scripts/workflow-gates/*.mjs` |
| C69 | FACT | A prototype of R8 on a copy of the reviewed hook reports every R8 form, refuses each executor form, keeps the controls silent and passes the seven hook-importing self-tests unchanged (executed). | source: `docs/sessions/evidence/task944/design/p14-shell-forms-run.txt:100-113`; observed: `FAILURES 0` |
| C70 | FACT | Over the frozen 2318-command corpus the prototype drops no target and adds no guarded target, executor refusal or governance scope file (executed). | source: `docs/sessions/evidence/task944/design/p14-shell-forms-run.txt:108-108`; observed: `drops 0; with added targets 2; with an added guarded target 0; executor commands newly refused 0; with an added governance scope file 0` |
| C71 | FACT | The reviewed 943 hook reports nothing for a generic file API name after `require('fs').promises.`, and its pre-write guard allows the executor form (executed in the Task 943 review 3 and revision 2). | source: `docs/sessions/evidence/task944/design/p15-promises-qualifier-run.txt:2-15`; observed: `PASS executor refused (reviewed hook allows): node -e "require('fs').promises.rm('scripts/check-example.mjs')"` |
| C72 | FACT | A prototype of R8 (f) with the revision 1 pairs on a copy of the reviewed hook reports the seven `.promises.` forms, refuses their executor forms, keeps six read controls silent, passes the seven hook-importing self-tests unchanged and leaves the corpus result of revision 1 unchanged (executed, revision 2). | source: `docs/sessions/evidence/task944/design/p15-promises-qualifier-run.txt:16-35`; observed: `FAILURES 0` |
| D1 | OWNER DECISION | Governance tasks are implemented by Opus in a separate session. | owner: 2026-11-01; decision: `Opus, a separate session (Recommended)` |
| D2 | OWNER DECISION | Approval independence is enforced by the hook. | owner: 2026-11-01; decision: `Yes, the hook blocks (Recommended)` |
| D7 | OWNER DECISION | Every CI fix is committed on task/935-governance-approval-route and published in PR #12, merged once all checks are green. | owner: 2026-11-01; decision: `Everything in PR #12 (Recommended)` |
| D9 | OWNER DECISION | A later independently reviewed contract may rebase a pinned reviewed contract when the changed files are in its scope but are not tests of its cases, with its cases rerun green. | owner: 2026-11-01; decision: `Governance task: audited rebase (Recommended)` |
| D13 | OWNER DECISION | No new task: every found and potential hole is closed inside the current tasks. | owner: 2026-11-02; decision: `no new task, everything within the current task; close every hole already found and every potential one` |
| D14 | OWNER DECISION | Dependent kickoff work found in a session is done in that session, never left for a later one, as a mandatory rule. | owner: 2026-11-02; decision: `This must be done immediately, because in the next session nobody will remember it.` |
| D15 | OWNER DECISION | File a governance task: deliberate breaks are made only on copies. | owner: 2026-11-03; decision: `file a governance task about deliberate breaks only on copies` |
| D16 | OWNER DECISION | Scope: the in-memory runner, the rule and record check, and the pre-write syntax guard for hook-loaded modules. | owner: 2026-11-03; decision: `Runner + guard (Recommended)` |
| D17 | OWNER DECISION | Placement: Sprint 92, committed on PR #12's branch after Task 943 is reviewed and committed and before Task 942. | owner: 2026-11-03; decision: `Sprint 92, after 943 (Recommended)` |
| D18 | OWNER DECISION | Task 943 is approved now, and the shell write forms its review 2 found are written as requirements of Task 944, not as a 943 revision. | owner: 2026-11-03; decision: `Approve 943, forms into 944` |

## Mobile adaptation record
- Scope: none

## 4. Scope and out of scope

In scope (the implementer writes exactly these): `scripts/workflow-gates/cli.mjs`, `scripts/workflow-gates/contract.mjs`,
`scripts/workflow-gates/security-hook.mjs`, new `scripts/workflow-gates/sensitivity-register.mjs`, new
`scripts/workflow-gates/sensitivity-hooks.mjs`, new `scripts/workflow-gates/sensitivity.selftest.mjs`, new
`scripts/workflow-gates/hook-syntax.selftest.mjs`, new `scripts/workflow-gates/hook-load-check.mjs`, their five entries in
`scripts/workflow-gates/publication.json` (C30),
`.claude/rules/shared/task-readiness.md`, `.claude/rules/review/02-adversarial-ui.md`, the stage/implementation/report/sensitivity
fields of this task's `.security.json`, and the evidence files `docs/sessions/evidence/task944/impl/completion-report.md`,
`docs/sessions/evidence/task944/impl/governance-report.json`, `docs/sessions/evidence/task944/impl/base-runs.txt`,
`docs/sessions/evidence/task944/impl/real-repo-guard.txt`, `docs/sessions/evidence/task944/sensitivity/sensitivity.json`, and for
each critical case `<id>` of GOV-944-SENS-RUN-DENY, GOV-944-VAL-RECORD-DENY and GOV-944-HOOK-SYNTAX-DENY the break spec
`docs/sessions/evidence/task944/sensitivity/<id>.break.json` and the artifact `docs/sessions/evidence/task944/sensitivity/<id>.txt`.
Revision 1 (R8, R9): `security-hook.mjs` (already in scope), new `scripts/workflow-gates/shell-forms.selftest.mjs` and its
`publication.json` entry, and for the critical case GOV-944-HOOK-SHELL-FORMS-DENY its break spec and artifact under the same names.
Written by the approver only (R7): `scope` entries in the `review.rebases` of the 935, 940, 941 and 943 contracts with evidence
`docs/sessions/evidence/task944/review/scope-rebase-935.md`, `…/scope-rebase-940.md`, `…/scope-rebase-941.md` and
`…/scope-rebase-943.md`.

Out of scope: product code; every existing self-test file (each must pass unchanged); `security-testing.md`,
`security-test-quality.md` and `workflow-evidence.md` (C10 already states the method; changing them would stale every reviewed
contract that reads them); the PowerShell hooks; Bash and PowerShell writes to a hook-loaded module (the shell guard cannot know the
resulting text; R3 covers Edit and Write); the sensitivity method of product contracts; the sensitivity records of the four legacy
contracts (935, 940, 941, 943), which are not redone; Task 942's own implementation (its route is revised in this design session,
D14, section 6 step 0). Revision 1: the write forms that Task 943 section 4 leaves undetected stay undetected (a path in a
variable, a script file run by an interpreter, `-EncodedCommand`, a folder change through a variable, `-`, `~` or `popd`), and
`isReadOnlyShellCommand` (Task 941) is unchanged.

## 5. Current and required behaviour

Preserved: every existing self-test and its expectations; the five result fields of a sensitivity record (C12) and the legacy
contracts' records; every pre-write decision for a write that does not touch a hook-loaded module or that parses; the guard's
fail-closed catch. Changed: a command produces sensitivity evidence without touching the live tree; a non-legacy governance report
refuses a record that the command did not make; an Edit or Write whose result does not parse is refused when the file is loaded by a
hook. Revision 1: every target the reviewed 943 hook reports stays reported (C70); the R8 forms add their targets, so the
independence check counts them and the pre-write guard decides on them as on any other shell target.

## Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R1 [C9; C10; C13; C14; C15; C16; C17; C18; C19; C20; C21; C22; C40; C48; C49; D15; D16] | **Sensitivity runner.** `cli.mjs` exports `runSensitivity(root, contractPath, breakPath)` and adds the command `node scripts/workflow-gates/cli.mjs sensitivity --contract <sidecar> --break <break spec>`. (a) A break spec is JSON `{ "version": 1, "case": "<case ID>", "target": "<repository path>", "find": "<text>", "replace": "<text>" }` at an evidence path (`isEvidencePath`) that the contract's `scope` lists. (b) Each of these refuses with its own message starting `SENSITIVITY:` and writes no file: the contract is not kind `governance`; the case is unknown or not critical; the spec is malformed or outside `scope`; the target is missing, not a `.mjs`, `.cjs` or `.js` file, in neither `scope` nor `inputs`, or the case's `testFile`; `find` is empty or does not occur exactly once in the live target; `replace` equals `find`. (c) It runs the case's `testFile` three times as `node --test --test-reporter=tap --test-name-pattern=<the case's testName as an anchored, regex-escaped pattern> <testFile>` with cwd `root`, `unitEnvironment(process.env)` (C14, C15) and the 5-minute timeout of `governanceReport` (C14): baseline and restored with no loader; the mutant with `NODE_OPTIONS=--import=<file URL of sensitivity-register.mjs beside cli.mjs>` and `SENSITIVITY_BREAK=<absolute spec path>` added after the filter (C21, C22). By `parseTap` (C16) each run has exactly one result named `testName`; baseline and restored are `passed`; the mutant result is `failed` and its TAP diagnostic block contains `code: 'ERR_ASSERTION'`, giving `failureKind: 'assertion'`. Any other outcome, among them a file-level failure (C19), a timeout or a passing mutant, refuses with `SENSITIVITY: the break did not fail <id> with an assertion` and writes no file. (d) `digest(root,[target])` and `digest(root,[testFile])` taken before the first run must equal those after the last run, else `SENSITIVITY: a live file changed during the run` and no file is written. (e) `sensitivity-register.mjs` calls `module.register` for `sensitivity-hooks.mjs` with the spec read from `SENSITIVITY_BREAK`; that `load` hook returns, for the target file only (the loaded URL turned into a resolved path with `fileURLToPath` and compared with the target's resolved path, case-insensitively on win32), the source with the single `find` replaced, throws when `find` does not occur exactly once, and writes no file; no other gate module imports these two files. (f) On success it writes the artifact `<spec folder>/<case ID>.txt` (node version, platform, UTC time, spec path and digest, target and test-file digests before and after, and per run the command, exit code and raw TAP), then replaces or adds the record `{ id, testName, baseline: 'passed', mutant: 'failed', failureKind: 'assertion', restored: 'passed', method: 'in-memory', break, breakSha256, artifact, artifactSha256 }` (digests by `digest(root,[path])`) in the file named by the contract's `sensitivity`, created as `{ "version": 1, "task": <contract task>, "cases": [] }` when absent; it prints `SENSITIVITY PASSED - <id>` and exits 0. Every refusal exits 1. | P1 | AC1, AC2, AC3 |
| R2 [C11; C12; C13; C32; D16] | **Record check.** `contract.mjs` exports `SENSITIVITY_LEGACY_TASKS`, the exact repository task paths `tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.md`, `tasks/Archive/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.md`, `tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.md`, `tasks/Sprints/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.md` and `tasks/Archive/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.md` (943 before and after its closure move); a file name alone never matches, so a copy of a legacy kickoff elsewhere is not legacy. For every critical case of a governance contract whose `task` is not in that list, `validateGovernanceReport` additionally requires `method === 'in-memory'`, `break` an evidence path, `breakSha256 === digest(root,[break])` and the break spec's `case` equal to the case ID; each failure is `<id>: sensitivity must come from cli.mjs sensitivity (<detail>)`. A legacy contract is validated exactly as today. `governanceReport` gets the check through its existing `validateGovernanceReport` call (C13). | P1 | AC4 |
| R3 [C1; C2; C3; C4; C5; C6; C7; C8; C23; C24; C25; C26; C42; C50; C51; C52; C53; C54; C55; C56; C57; D16] | **Hook-module syntax guard.** In `evaluateHook` for PreToolUse `Write` and `Edit` (C42), for every role and before the role checks: (a) the closure is every `.mjs`, `.cjs` or `.js` file named after `${CLAUDE_PROJECT_DIR}/` in a hook `command` or `args` of `.claude/settings.json`, plus every `scripts/…` script path named in `.claude/hooks/*.ps1`, plus, transitively, the files those name through relative static `import … from`, `export … from` and string-literal `import(…)` specifiers; only existing files inside `root`. Every unreadable or malformed input of the closure (`settings.json`, the `.claude/hooks` folder, a named or imported file) contributes nothing and never throws; cycles terminate. (b) When the write target is in the closure, the guard computes the resulting text. Write: `content`. Edit: the current file, `old_string` and `new_string` each with CRLF turned into LF (a closure module can be CRLF in the working tree, C50, and a literal match of a multi-line `old_string` then fails, C51), `old_string` replaced once, or everywhere when `replace_all` is true; when `old_string` still does not occur, the write is refused with `HOOK MODULE SYNTAX: <file>: old_string not found, the result cannot be checked` (fail closed: the tool itself would also fail). The check is a load check, not only a syntax check, because a syntactically valid write can still stop a hook from loading: an import of a file not written yet and a removed export that another closure module imports both pass `node --check` (C52, C53). The guard runs the new `scripts/workflow-gates/hook-load-check.mjs` as `node --experimental-vm-modules --no-warnings scripts/workflow-gates/hook-load-check.mjs`, in a child environment without `NODE_OPTIONS`, with JSON `{ entries, overrides: { <target>: <resulting text> } }` on stdin; it creates a `vm.SourceTextModule` for every ESM closure module (the target with the resulting text), links relative specifiers to closure files inside `root` and `node:` builtins (also unprefixed builtin names) to `vm.SyntheticModule`s of the builtin namespace, refuses a missing file and any other (bare package) specifier, never evaluates a module, writes no file, and prints `linked` (C54–C57). A `.cjs` closure module, or a `.js` one without `"type": "module"` in the root `package.json`, is checked with `node --check --input-type=commonjs -` instead. A failure returns `HOOK MODULE SYNTAX: <file> would stop a hook module from parsing or loading after this write (<first error line>); every hook that loads it would then refuse all tools. Write a new imported file before the import, correct the text; a sensitivity break uses cli.mjs sensitivity (Task 944).`; a spawn error or an unavailable `vm.SourceTextModule` refuses with the same prefix. (c) Any exception inside the guard becomes `HOOK MODULE SYNTAX: guard error (<message>)` for that one write and never leaves `evaluateHook`, because an escaping exception would make the hook refuse every tool again (C7). (d) The guard is the exported `hookModuleSyntaxErrors(root, event, { readText } = {})`, whose optional `readText(path)` replaces file reads for tests, and `evaluateHook` calls it; nothing else in `evaluateHook` changes. | P1 | AC5, AC6, AC7, AC8 |
| R4 [C10; C37; C38; C45; C46] | **Rule text.** (a) `task-readiness.md` section 4, after the sentence that asks which break reaches which assertion (C45): `For a governance gate module the break is a saved break spec run by cli.mjs sensitivity; a kickoff never instructs editing a live file to plant a break (Task 944).` (b) `review/02-adversarial-ui.md`, after the sensitivity sentence (C46): `A governance sensitivity record outside the four legacy contracts that lacks method in-memory and its current break spec is NEEDS REVISION, and so is any break planted in a live file.` The file stays under 8 KiB. | P1 | AC10 |
| R5 [C27; C28; C29; C30; C31] | **Proof files.** The eight GOV-944 cases live in the new `sensitivity.selftest.mjs` (AC1–AC4) and `hook-syntax.selftest.mjs` (AC5–AC7); the two new tests, `sensitivity-register.mjs`, `sensitivity-hooks.mjs` and `hook-load-check.mjs` are listed in `publication.json`; no existing self-test file changes. Fixtures are temporary folders from `mkdtempSync`. | P1 | AC10 |
| R6 [C12; C17; D15; D16] | **Own sensitivity through the runner.** The records of the three critical cases are produced only by `cli.mjs sensitivity` with the break specs named in section 4; this task is not legacy, so R2 applies to its own report. | P1 | AC9 |
| R7 [C33; C34; C35; C36; D7; D9] | **Rebases (approver).** After approving 944, the approver appends a `scope` entry by 944's contract to the `review.rebases` of the 935, 940, 941 and 943 contracts, each with `## Changed scope files` evidence listing the files of this task's diff that the rebased contract scopes (for 935, 940 and 943: `scripts/workflow-gates/security-hook.mjs`, `scripts/workflow-gates/contract.mjs`, `scripts/workflow-gates/cli.mjs`, `scripts/workflow-gates/publication.json`; for 941: the first and the last), and recomputes nothing else in them. | P1 | AC11 |
| R8 [C58; C59; C60; C61; C62; C63; C64; C65; C66; C67; C68; C69; C70; C71; C72; D13; D18] | **Shell write forms (revision 1).** `shellWriteTargets` in `security-hook.mjs` (Task 943 section 5, R12–R15 terms) also reports: (a) after the shell reserved words `if`, `then`, `else`, `elif`, `do`, `while`, `until` and `!` (case-sensitive, no options), which are skipped before the program like `sudo`, and before a folder-change program of R12 (c), in parsed commands and in the lenient reading of R13 (e); `shx` is skipped like `npx`; for `env`, the values of `--chdir`, `--unset` and `--split-string` are skipped like those of `-C`, `-u` and `-S`, and `-C <folder>`, `-C<folder>`, `--chdir <folder>` or `--chdir=<folder>` resolves the program's targets in that folder, resolved from the current folder as in R12 (c) (C58, C59, C66, C67); (b) for `bash`, `sh`, `zsh` and `dash`, a single-dash option word made only of letters that contains `c` (`-lc`, `-ec`, `-xc`) is the text flag of R13 (b), and a `--` right after the text flag is skipped; the flags of `cmd`, `powershell` and `pwsh` are unchanged, so `-ExecutionPolicy` is no text flag (C60); (c) W3 literal path arguments of: `open(` or `openSync(` with a quoted mode or flags (also as `mode=`/`flags=`) containing `w`, `a`, `x` or `+`, never a read mode or no mode; `]::Create(`, `]::OpenWrite(`, `]::CreateText(` and `]::AppendText(`; `Path('…')` followed by `.unlink()`, `.touch()`, `.open('<write mode>')`, `.rename('…')` or `.replace('…')` (both paths); and `rmSync`, `rmdirSync` and, after the R14 (c) qualifier, `rm`, `rmdir`, `rmtree` and `Delete`, whose literal path also adds every file under it when it names a project directory (the 943 section 5 walk) (C61–C64); (d) the programs `xcopy` (a copy program whose `/<letters or digits>[:value]` switch words are dropped; targets: the destination, the destination plus the source name, and every file under a source directory mapped into both), `robocopy <source> <destination> [names…]` (each name in the destination, otherwise every file under the source mapped into the destination; with `/MIR` or `/PURGE` also every file under the destination; with `/MOV` or `/MOVE` every file under the source), `rimraf` (a delete program) and `perl` with an in-place option (`-i`, `-i<suffix>`, in a cluster such as `-pi`), read like `sed` with `-e`/`-E` as script options and the letters `I`, `M`, `m`, `d`, `D`, `x` and `0` taking an attached value; `perl` with `-i` is a conditional R1 fallback word like `sed`, and `xcopy`, `robocopy` and `rimraf` are R1 fallback words (C65, C66); (e) in the lenient reading a word is literal, never glob-expanded, only when no occurrence of the same text in the command is unquoted (C68); (f) (revision 2) the Task 943 R14 (c) qualifier also accepts `).promises.`, so a generic name of R14 (c) or of (c) above after `require('fs').promises.`, `require('node:fs').promises.` or `(await import('fs')).promises.` counts as it does after `).`: `require('fs').promises.rm('X')`, `.unlink('X')`, `.truncate('X')`, `.rename('Y', 'X')`, `.cp('Y', 'X')`, and `.rm('D', { recursive: true })` with every file under D, while `readFile`, `stat`, `readdir` and a string method stay no write (C71, C72). Each addition is skipped when its target is already reported, so the result is a superset of the reviewed 943 result; `isReadOnlyShellCommand` is unchanged. Feasibility: `docs/sessions/evidence/task944/design/p14-shell-forms-run.mjs` applies `p14-shell-forms-pairs.json` to a copy of the reviewed hook (a design prototype to read, not code to paste): every form reports X, every executor form is refused, the controls report no X, the seven hook-importing self-tests pass unchanged (C69), and over the frozen corpus no target is dropped and no guarded target, executor refusal or governance scope file is added; the 5000-folder-change commands take 1937 ms and 7529 ms (C70). Feasibility of (f): `docs/sessions/evidence/task944/design/p15-promises-qualifier-run.mjs` applies the p14 pairs and `p15-promises-qualifier-pairs.json` to a copy of the reviewed hook: the seven `.promises.` forms, which the reviewed hook misses, report X and their executor forms are refused, the six controls report no X, the seven hook-importing self-tests pass unchanged, and the corpus result equals that of revision 1 (2 commands with added non-guarded targets, nothing dropped), with `FAILURES 0` (C72). | P1 | AC12 |
| R9 [C29; C30; C69] | **Proof of R8.** GOV-944-HOOK-SHELL-FORMS-DENY lives in the new `scripts/workflow-gates/shell-forms.selftest.mjs`, listed in `publication.json`; no existing self-test file changes, and every case of the reviewed 943 and 941 contracts still passes (C69). Its record is made by `cli.mjs sensitivity` (R6). | P1 | AC10, AC12 |

## Acceptance criteria

- **AC1 [R1].** GOV-944-SENS-RUN-ALLOW passes: in a fixture root with a governance contract whose critical case tests a fixture
  gate module through its own selftest, a spec that breaks the gate's check yields no error, a record with every R1 (f) field, an
  artifact holding three TAP outputs, a sensitivity file with that one record, and unchanged digests of the gate and its test; a
  second run with a changed spec replaces the record instead of adding one.
- **AC2 [R1].** GOV-944-SENS-RUN-DENY passes; each variant is refused with its named message, writes no artifact and no record and
  leaves the live digests unchanged: a break the test does not detect; the incident's form (a `//` comment that swallows the rest of a
  line); `find` absent; `find` twice; `replace` equal to `find`; a target outside `scope` and `inputs`; the case's test file as
  target; an unknown and a non-critical case; a spec outside the evidence tree; a product contract. Sensitivity (through `cli.mjs
  sensitivity`): making the runner accept a failed mutant result without `ERR_ASSERTION` fails GOV-944-SENS-RUN-DENY with an
  assertion; restored passes.
- **AC3 [R1].** GOV-944-SENS-LIVE-ERROR passes: a fixture test that rewrites its gate file during the run yields
  `SENSITIVITY: a live file changed during the run` and no record; a contract whose test file is missing yields a named error, not an
  exception.
- **AC4 [R2].** GOV-944-VAL-RECORD-ALLOW passes (a non-legacy contract with an in-memory record and a current spec digest: no
  sensitivity error; a contract whose task is the 941 kickoff name with a record without `method`: no error). GOV-944-VAL-RECORD-DENY
  passes (non-legacy: no `method`; `break` outside the evidence tree; stale `breakSha256`; a spec of another case; each with its named
  message, and `governanceReport` of such a contract has status `failed`). Sensitivity: treating every task as legacy fails
  GOV-944-VAL-RECORD-DENY with an assertion; restored passes.
- **AC5 [R3].** GOV-944-HOOK-SYNTAX-DENY passes: in a fixture root whose `.claude/settings.json` runs
  `${CLAUDE_PROJECT_DIR}/scripts/workflow-gates/hook.mjs`, which imports `./lib.mjs`, an Edit of `lib.mjs` with the incident's
  replacement form, a Write of unparseable text to `hook.mjs`, an Edit making a `.claude/hooks/*.ps1`-named script unparseable, and
  an Edit with a two-line LF `old_string` that makes a CRLF `lib.mjs` unparseable, an Edit of `hook.mjs` that imports a file not
  written yet, an Edit of `lib.mjs` that removes an export `hook.mjs` imports, and an Edit of `lib.mjs` that adds a bare package
  import are each refused with `HOOK MODULE SYNTAX`, for an orchestrator and an executor session alike. Sensitivity: an empty closure fails
  GOV-944-HOOK-SYNTAX-DENY with an assertion; restored passes.
- **AC6 [R3].** GOV-944-HOOK-SYNTAX-ALLOW passes: a parseable Edit of `lib.mjs`, an unparseable Write to a `.mjs` that no hook loads,
  an Edit that repairs an unparseable closure module, a CommonJS `.cjs` closure module with `require`, and the order "Write
  `new.mjs`, then Edit `hook.mjs` to import it" get no `HOOK MODULE SYNTAX` error; no fixture module is evaluated (a fixture
  `lib.mjs` whose top level writes a marker file leaves no marker).
- **AC7 [R3].** GOV-944-HOOK-CLOSURE-ERROR passes: a missing and a malformed `settings.json` and a missing `.claude/hooks` folder
  give no guard error and no exception; an import cycle terminates; an Edit of a closure module whose `old_string` is absent is
  refused with `HOOK MODULE SYNTAX: … old_string not found`; a guard step forced to throw (an injected closure reader that throws)
  yields `HOOK MODULE SYNTAX: guard error` for that write and no exception out of `evaluateHook`.
- **AC8 [R3; C23; C24].** `docs/sessions/evidence/task944/impl/real-repo-guard.txt` records, on the real repository and without
  writing, `evaluateHook` for a PreToolUse Edit of `scripts/workflow-gates/contract.mjs` with the incident's replacement (C6)
  returning `HOOK MODULE SYNTAX`, the same Edit with a `/* … */` break (C25) returning no `HOOK MODULE SYNTAX`, the two load-only
  variants of C52 and C53 returning `HOOK MODULE SYNTAX`, and the computed closure containing at least the 11 files of C23.
- **AC9 [R6].** The four records (three before revision 1) in `docs/sessions/evidence/task944/sensitivity/sensitivity.json` have `method: 'in-memory'` and
  current `breakSha256` and `artifactSha256`; `git grep -n "SENSITIVITY BREAK" -- scripts` prints nothing;
  `node scripts/workflow-gates/cli.mjs governance-report --contract <this sidecar>` passes every case.
- **AC10 [R4; R5; R9].** `node scripts/workflow-gates/selftests.mjs` exits 0 with 0 skipped and 9 more passing tests than the base run
  in `base-runs.txt`; `git diff --exit-code` on every self-test file that exists at the base; `node
  scripts/workflow-gates/check-workflow.mjs` exits 0; `node node_modules/eslint/bin/eslint.js --config
  scripts/workflow-gates/eslint.config.mjs scripts/workflow-gates` exits 0; `node scripts/workflow-gates/publication.mjs --base HEAD`
  reports 0 dependency errors; `node scripts/workflow-gates/cli.mjs verify --contract <this sidecar>` exits 0 at stage implemented;
  `npm run check:kickoff-evidence` passes.
- **AC11 [R7].** After the approver's rebases, the scoped harness of Task 940 AC7 (`validateDiff` and `changedFiles` from
  `scripts/workflow-gates/cli.mjs`, phase `release`, base `origin/main`, working tree) reports no error for the 935, 940, 941, 943
  and 944 contracts, and `reviewedFreshnessErrors` for that selection returns `[]`.
- **AC12 [R8; R9].** GOV-944-HOOK-SHELL-FORMS-DENY passes on a fixture root with X a governance scope file
  `scripts/workflow-gates/fixture-scope.mjs`, D its folder and N its file name: `if true; then rm X; fi`,
  `if true; then echo; else rm X; fi`, `if false; then :; elif true; then cp Y X; fi`, `for f in a; do rm X; done`,
  `while false; do rm X; done`, `until true; do cp Y X; done`, `if true; then cd D; rm N; fi`, `bash -lc 'rm X'`,
  `bash -ec 'cp Y X'`, `sh -xc "rm X"`, `bash -c -- 'rm X'`, `python -c "open('X','w').write('x')"`, `python3 -c "f = open('X', 'a')"`,
  `python -c "with open('X', mode='wb') as f: pass"`, `node -e "require('fs').openSync('X','w')"`,
  `node -e "require('fs').open('X', 'r+', () => 0)"`, `powershell -Command "[IO.File]::Create('X')"`,
  `powershell -Command "[System.IO.File]::OpenWrite('X')"`, `python -c "from pathlib import Path; Path('X').unlink()"`,
  `python -c "import pathlib; pathlib.Path('Y').rename('X')"`, `python -c "from pathlib import Path; Path('X').touch()"`,
  `python -c "import shutil; shutil.rmtree('D')"`, `node -e "require('fs').rmSync('D', { recursive: true })"`,
  `node -e "require('fs').rmdirSync('D', { recursive: true })"`, `powershell -Command "[IO.Directory]::Delete('D', $true)"`,
  `xcopy Y X`, `xcopy Y D\ /Y` (backslash spelling), `robocopy <folder of Y> D N`, `robocopy <folder holding N> D /MIR`, `npx rimraf X`,
  `rimraf D`, `npx shx rm X`, `npx shx cp Y X`, `perl -pi -e 's/a/b/' X`, `perl -i.bak -pe 's/a/b/' X`, `perl -pi -e 's/a/b/' X '`,
  `env -C D rm N`, `env --chdir=D rm N`, `env --chdir D rm N`, `echo 'D/*.mjs'; rm D/*.mjs; echo '` and (revision 2, R8 (f))
  `node -e "require('fs').promises.rm('X')"`, `node -e "require('fs').promises.unlink('X')"`,
  `node -e "require('node:fs').promises.truncate('X')"`, `node -e "require('fs').promises.rename('Y', 'X')"`,
  `node -e "require('fs').promises.cp('Y', 'X')"`, `node -e "(await import('fs')).promises.rm('X')"` and
  `node -e "require('fs').promises.rm('D', { recursive: true })"` (Y a fixture file named N
  outside D) each report X and yield `GOVERNANCE INDEPENDENCE` for X, and each executor form with X replaced by
  `scripts/check-example.mjs` (D by `scripts`) is refused with `POLICY-EDIT AUTHORITY REQUIRED` or `SECURITY TEST CONTRACT
  MISSING`. Controls report no X: `if [ -f X ]; then cat X; fi`, `for f in X; do grep -n a X; done`, `bash -lc 'cat X'`,
  `bash -ec 'cp X docs/z.mjs'`, `python -c "print(open('X').read())"`, `python -c "open('X', 'r')"`,
  `python -c "open('X', encoding='utf8')"`, `node -e "require('fs').openSync('X','r')"`,
  `powershell -Command "[IO.File]::ReadAllText('X')"`, `powershell -Command "[IO.Directory]::CreateDirectory('D/new')"`,
  `xcopy X docs/z.mjs`, `robocopy D docs/out N`, `perl -ne 'print' X`, `perl -Ilib -e 'print 1' X`, `env -C docs cat N`,
  `echo 'D/*.mjs'; echo '`, `grep -rn "then rm X" docs` and (revision 2) `node -e "require('fs').promises.readFile('X')"`,
  `node -e "require('fs').promises.stat('X')"`, `node -e "console.log('X'.replace('a', 'b'))"` and
  `node -e "require('fs').promises.readdir('D')"`. Sensitivity (through `cli.mjs sensitivity`, R6): a break spec that
  stops the R8 (a) keyword skip fails GOV-944-HOOK-SHELL-FORMS-DENY with an assertion; restored passes (artifact
  `GOV-944-HOOK-SHELL-FORMS-DENY.txt`). `node scripts/workflow-gates/selftests.mjs` shows every GOV-941 and GOV-943 case passing.
  The Task 943 AC15 F8 commands (5000 folder changes, parsed and parser-rejected, `design/p14-shell-forms-run.mjs` section D) still
  return within 15 s on the final hook from native Windows, each timing in the completion report (C70).

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | The pre-write guard and Stop gate (`evaluateHook` in `security-hook.mjs`, C1–C5, C42), its load checker (`hook-load-check.mjs`, R3) and every module a hook loads (C23); the governance report validator (`validateGovernanceReport`, C12) and its producer (`governanceReport`, C13); the new runner and loader (R1). Owner: Opus (D1). |
| Frontend security | Governance has no browser consumer; the hook layer replaces this row: GOV-944-HOOK-SYNTAX-DENY, GOV-944-HOOK-SYNTAX-ALLOW and GOV-944-HOOK-CLOSURE-ERROR on the real `evaluateHook` with fixture roots, plus the read-only real-repository probe of AC8; revision 1: GOV-944-HOOK-SHELL-FORMS-DENY on the real `shellWriteTargets`, `governanceIndependenceErrors` and `evaluateHook` with fixture roots and synthetic transcripts. |
| Server security | The CI and validator layer replaces this row: GOV-944-VAL-RECORD-ALLOW and GOV-944-VAL-RECORD-DENY on the real `validateGovernanceReport` and `governanceReport`; GOV-944-SENS-RUN-ALLOW, GOV-944-SENS-RUN-DENY and GOV-944-SENS-LIVE-ERROR on the real `runSensitivity` with real child `node --test` processes. |
| Database/integrations | Not applicable: no database, Storage, Realtime or provider path; no credentials. |
| Cases | The nine GOV-944 cases of the sidecar (revision 1 adds GOV-944-HOOK-SHELL-FORMS-DENY) with actor, resource, input, response and forbidden effects; allow, deny and error outcomes; hook, ci and validator layers. |
| Fixtures and environment | Temporary folders from `mkdtempSync` with synthetic contracts, gate modules, selftests, settings and hook scripts; removed after each test; no writes in the repository except the R6 evidence; no network. |
| Sensitivity proof | Critical cases GOV-944-SENS-RUN-DENY, GOV-944-VAL-RECORD-DENY, GOV-944-HOOK-SYNTAX-DENY and (revision 1) GOV-944-HOOK-SHELL-FORMS-DENY: the breaks named in AC2, AC4, AC5 and AC12, each as a break spec run by `cli.mjs sensitivity` (R6), never as an edit of a live file; baseline pass, mutant failing with `ERR_ASSERTION`, restored pass; artifacts under `docs/sessions/evidence/task944/sensitivity/`. |
| Execution | `node scripts/workflow-gates/cli.mjs governance-report --contract tasks/Sprints/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.security.json`, then `cli.mjs verify` on the same path; native Windows PowerShell 5.1 or Git Bash, Node 22.22.3; QA Q1. |

## 6. Ordered route

0. **Done in this design session (D14):** Task 942's kickoff and sidecar were revised so that its critical break runs through
   `cli.mjs sensitivity` and 942 starts only after this task is committed; the Sprint 92 plan and the backlog registry record 944.
1. **Owner** (separate PowerShell window, `C:\Claude_Code_Projects\lero-al`): stay on `task/935-governance-approval-route` (D7);
   commit this kickoff set with the command Opus gives.
2. **Prerequisite, before the first write of step 3:** Task 943 is reviewed and committed (D17), and `git status --short scripts`
   prints nothing. Otherwise wait; do not mix two governance implementations in one working tree.
3. **Opus implementer, fresh session** (D1): read this kickoff and its bundle; save the base runs of `node
   scripts/workflow-gates/selftests.mjs` and `npm run build` to `docs/sessions/evidence/task944/impl/base-runs.txt` before the first
   write. Implement R1, R2, R3 with the eight cases (R5), then R4, then (revision 1) R8 with its case (R9) through the Edit tool on
   the hook (`design/p14-shell-forms-pairs.json` is a design prototype to read, not code to paste); the R3 guard then checks each
   hook Edit. Record `implementation: { "role": "Opus" }`, stage `implemented`,
   `report` and `sensitivity` in the sidecar. Write the four break specs and run each with `node scripts/workflow-gates/cli.mjs
   sensitivity --contract <this sidecar> --break <spec>` (R6); never plant a break by editing a file. Write AC8's probe output.
4. Run `cli.mjs governance-report` and every AC command; write the completion report; end with
   `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` and the explicit-path commit command for the owner. No push.
5. **Opus approver, another fresh session** (D2; not session 3d40df28 or 6f2564f3): review R1–R9; on approval write the `review` block and stage `reviewed`, write R7
   with its evidence, run AC11, and hand off the explicit-path commit and the push of the branch under `shared/git-publication.md`.
   PR #12 merges only after green PR checks (D7). Task 942 starts after this commit.

## 7. Completion report

Per requirement: changed files, evidence path, status; each GOV-944 case with its result; the four break specs and the failed
assertion of each mutant; base and final self-test totals; proof that no existing self-test file changed; the AC8 probe; for R8
each AC12 form with its result and the write forms that stay undetected; one of
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 8. Rule compliance

| Rule | How this kickoff complies |
|---|---|
| `claim-evidence-contract.md` | Every R cites ledger rows; sources are retained snapshots and executed probes under `docs/sessions/evidence/task944/design/`. |
| `security-testing.md` | Governance contract: hook and CI/validator layers, allow/deny/error, sensitivity for the three critical cases, Q1. |
| `security-test-quality.md` | The break is an in-memory injection supported by the harness (C10); a load or syntax error is never sensitivity evidence (C19). |
| `role-boundaries.md` | Opus implements policy (D1); Sonnet is not routed; approval by an independent session (D2); no copy of the project (C40). |
| `git-publication.md` | Task-branch commit on PR #12's branch (D7, D17); push only after approval; merge only after green checks. |
| `mobile-adaptation-contract.md` | No visible scope: `Scope: none`. |

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31, C32, C33, C34, C35, C36, C37, C38, C39, C40, C41, C42, C43, C44, C45, C46, C47, C48, C49, C50, C51, C52, C53, C54, C55, C56, C57, C58, C59, C60, C61, C62, C63, C64, C65, C66, C67, C68, C69, C70, C71, C72; owner decisions: D1, D2, D7, D9, D13, D14, D15, D16, D17, D18; blocked claims: NONE.
