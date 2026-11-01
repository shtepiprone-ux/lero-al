# Task 941 — A read-only shell command is not counted as a write by the security hook

Sprint 92. P1. QA profile **Q1** (non-UI gate code and its tests, `docs/qa-profiles.md`). Kickoff by Opus, 2026-11-01, at the
owner's instruction to fix the hook after the Task 940 approver session was refused approval for a command that only read files
(D10).

## 1. Mode, task type and rule bundle

Governance task. **Implementer: Opus, in a fresh implementation session started for this task (D1); Sonnet does not execute it**,
because every path in scope is a policy path (C30). **Approver: Opus, in another fresh session that wrote none of the scope files
(D2).** Neither may be the session that designed this kickoff, and the approver must not be the implementer of Task 940 or the
approver of Task 940. Types (`docs/rule-index.md`): workflow gates / governance tooling. Bundle:
`.claude/rules/shared/workflow-gates.md` with `workflow-contract.md`, `workflow-evidence.md`, `workflow-ci.md`, `git-publication.md`;
`security-testing.md`; `role-boundaries.md`; `claim-evidence-contract.md`; `task-readiness.md`; `orchestration-state.md`;
`.claude/rules/review/03-decision-closure.md`.

## 2. Objective

The hook decides which project files a shell command writes from the command text. Today any command that contains a write
word (`Set-Content`, `writeFileSync`, …) counts every project path it names as written (C1–C3), so a read-only `grep` or
`Select-String` that searches for such a word "writes" the file it reads (C8–C11). The governance independence check then refuses
an approver that wrote nothing (C5, C15), and the pre-write guard refuses read-only commands (C6, C7). After this task a command
made only of read-only programs reports only its real redirection targets, while every command that is not provably read-only is
detected exactly as today.

## 3. Verified context

`shellWriteTargets` (C1) collects, when the command contains a write word (C2), every project path named anywhere in it (C3), plus
every redirection target (C4), without regard to quotes. Its two consumers are the governance independence check of the Stop hook
(C5) and the pre-write guard (C6), which refuses Sonnet policy writes (C7). An executed probe on the real function (design HEAD C32)
shows four read-only commands reported as writes: this design session's `grep` (C8), the Task 940 approver's `grep` + `sed -n`
(C9), a PowerShell `Select-String` (C10) and a `grep` whose quoted pattern contains a redirection to a product path (C11); the
independence check refuses the Task 940 approver on that `grep` + `sed -n` alone (C15). Real writes are detected: `Set-Content`
(C12), `node -e` with `writeFileSync` (C13) and redirection (C14); existing self-tests assert such detections (C16, C18) and an
allowed read (C17). The hook file and the publication manifest are scope files of the reviewed Task 935 contract (C21, C22) and of
the Task 940 contract (C19, C20), now reviewed and archived (C31); the scope digest covers the scope files (C23), so this task
stales both contracts until its approver writes scope entries (C24). Case test files of 935 cannot be rebased (C33). Self-tests are
discovered by file name (C25) and listed in the publication manifest (C26). A governance contract needs a hook and a CI case (C27);
CI refuses a changed hook file outside every governance scope (C28). Baseline: 173 gate self-tests pass (C29).

## Claim ledger

| ID | Status | Claim | Evidence |
|---|---|---|---|
| C1 | FACT | The hook derives shell write targets in one exported function. | source: `docs/sessions/evidence/task941/design/sources/scripts__workflow-gates__security-hook.mjs.txt:109-109`; observed: `export function shellWriteTargets(root, command) {` |
| C2 | FACT | The function first tests the command for a write cmdlet or API word. | source: `docs/sessions/evidence/task941/design/sources/scripts__workflow-gates__security-hook.mjs.txt:111-111`; observed: `(?:Set-Content` |
| C3 | FACT | With a write word present, every project path named in the command is collected. | source: `docs/sessions/evidence/task941/design/sources/scripts__workflow-gates__security-hook.mjs.txt:112-112`; observed: `...[...command.matchAll(` |
| C4 | FACT | Every redirection target in the command is also collected, without regard to quotes. | source: `docs/sessions/evidence/task941/design/sources/scripts__workflow-gates__security-hook.mjs.txt:115-115`; observed: `for (const match of command.matchAll(` |
| C5 | FACT | The governance independence check counts these targets as files the session wrote. | source: `docs/sessions/evidence/task941/design/sources/scripts__workflow-gates__security-hook.mjs.txt:128-128`; observed: `.flatMap(call => shellWriteTargets(root, call.input.command))];` |
| C6 | FACT | The pre-write guard uses the same function for shell tools. | source: `docs/sessions/evidence/task941/design/sources/scripts__workflow-gates__security-hook.mjs.txt:244-244`; observed: `files = shellWriteTargets(root, input.command);` |
| C7 | FACT | The pre-write guard refuses Sonnet writes to policy paths. | source: `docs/sessions/evidence/task941/design/sources/scripts__workflow-gates__security-hook.mjs.txt:262-262`; observed: `POLICY-EDIT AUTHORITY REQUIRED: Sonnet cannot edit workflow policy or enforcement` |
| C8 | FACT | A read-only grep for write words reports the searched hook file as written (executed probe). | source: `docs/sessions/evidence/task941/design/p01-false-positive-probe.txt:2-2`; observed: `targets ["scripts/workflow-gates/security-hook.mjs"]` |
| C9 | FACT | The Task 940 approver's read-only grep and sed -n report two scope files as written (executed probe). | source: `docs/sessions/evidence/task941/design/p01-false-positive-probe.txt:3-3`; observed: `targets ["scripts/workflow-gates/cli.mjs",".claude/rules/review/03-decision-closure.md"]` |
| C10 | FACT | A read-only PowerShell Select-String reports the searched file as written (executed probe). | source: `docs/sessions/evidence/task941/design/p01-false-positive-probe.txt:4-4`; observed: `targets ["scripts/workflow-gates/security-hook.mjs"]` |
| C11 | FACT | A redirection inside a quoted grep pattern is reported as a product write (executed probe). | source: `docs/sessions/evidence/task941/design/p01-false-positive-probe.txt:5-5`; observed: `targets ["src/profile.ts","scripts/workflow-gates/diff-hook.selftest.mjs","src/profile.ts'"]` |
| C12 | FACT | Set-Content on a file is detected as a write (executed probe). | source: `docs/sessions/evidence/task941/design/p01-false-positive-probe.txt:6-6`; observed: `write: Set-Content` |
| C13 | FACT | node -e with writeFileSync is detected as a write (executed probe). | source: `docs/sessions/evidence/task941/design/p01-false-positive-probe.txt:7-7`; observed: `write: node -e writeFileSync` |
| C14 | FACT | An output redirection to a file is detected as a write (executed probe). | source: `docs/sessions/evidence/task941/design/p01-false-positive-probe.txt:8-8`; observed: `write: redirection` |
| C15 | FACT | The independence check refuses the Task 940 contract approval for a transcript with only the read-only command (executed probe). | source: `docs/sessions/evidence/task941/design/p01-false-positive-probe.txt:10-10`; observed: `GOVERNANCE INDEPENDENCE: this session wrote scripts/workflow-gates/cli.mjs` |
| C16 | FACT | An existing self-test asserts that a node -e writeFileSync helper write is guarded. | source: `docs/sessions/evidence/task941/design/sources/scripts__workflow-gates__diff-hook.selftest.mjs.txt:343-343`; observed: `writeFileSync('scripts/product-helper.mjs', 'synthetic')` |
| C17 | FACT | An existing self-test asserts that a Get-Content read of a helper is allowed. | source: `docs/sessions/evidence/task941/design/sources/scripts__workflow-gates__diff-hook.selftest.mjs.txt:352-352`; observed: `command: 'Get-Content scripts/product-helper.mjs'` |
| C18 | FACT | An existing self-test asserts that a redirection into a product file is guarded. | source: `docs/sessions/evidence/task941/design/sources/scripts__workflow-gates__diff-hook.selftest.mjs.txt:162-162`; observed: `command: 'echo injected > src/profile.ts'` |
| C19 | FACT | The Task 940 contract scopes the hook file. | source: `docs/sessions/evidence/task941/design/sources/tasks__Archive__Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json.txt:15-15`; observed: `"scripts/workflow-gates/security-hook.mjs",` |
| C20 | FACT | The Task 940 contract scopes the publication manifest. | source: `docs/sessions/evidence/task941/design/sources/tasks__Archive__Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json.txt:17-17`; observed: `"scripts/workflow-gates/publication.json",` |
| C21 | FACT | The reviewed Task 935 contract scopes the hook file. | source: `docs/sessions/evidence/task941/design/sources/tasks__Archive__Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json.txt:49-49`; observed: `"scripts/workflow-gates/security-hook.mjs",` |
| C22 | FACT | The reviewed Task 935 contract scopes the publication manifest. | source: `docs/sessions/evidence/task941/design/sources/tasks__Archive__Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json.txt:47-47`; observed: `"scripts/workflow-gates/publication.json",` |
| C23 | FACT | The scope digest of a contract covers its scope files. | source: `docs/sessions/evidence/task941/design/sources/scripts__workflow-gates__contract.mjs.txt:72-72`; observed: `let files = [...new Set([...contract.scope` |
| C24 | FACT | The review rule assigns the scope rebase of other reviewed contracts to the approver of the changing task. | source: `docs/sessions/evidence/task941/design/sources/.claude__rules__review__03-decision-closure.md.txt:67-67`; observed: `Scope rebase (owner D9, Task 940)` |
| C25 | FACT | The self-test runner discovers every selftest file by name. | source: `docs/sessions/evidence/task941/design/sources/scripts__workflow-gates__selftests.mjs.txt:8-8`; observed: `/^[a-z0-9_-]+\.selftest\.mjs$/.test(file)` |
| C26 | FACT | The publication manifest lists each self-test file by path. | source: `docs/sessions/evidence/task941/design/sources/scripts__workflow-gates__publication.json.txt:74-74`; observed: `"scripts/workflow-gates/scope-rebase.selftest.mjs",` |
| C27 | FACT | A governance contract needs at least one hook case and one CI case. | source: `docs/sessions/evidence/task941/design/sources/scripts__workflow-gates__contract.mjs.txt:360-360`; observed: `governance: missing ${layer} case` |
| C28 | FACT | CI refuses a changed hook file outside every changed governance scope (executed probe). | source: `docs/sessions/evidence/task941/design/p03-ci-policy-probe.txt:2-2`; observed: `outside every changed governance contract scope` |
| C29 | FACT | The gate self-tests pass 173 tests before this task. | source: `docs/sessions/evidence/task941/design/p02-selftests-base.txt:1045-1045`; observed: `# pass 173` |
| C30 | FACT | Gate scripts are policy paths. | source: `docs/sessions/evidence/task941/design/sources/scripts__workflow-gates__contract.mjs.txt:78-78`; observed: `export const isPolicyPath = file =>` |
| C31 | FACT | The archived Task 940 contract is reviewed in the working tree (its review commit is still pending). | source: `docs/sessions/evidence/task941/design/sources/tasks__Archive__Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json.txt:3-3`; observed: `"stage": "reviewed",` |
| C32 | FACT | The design was made on HEAD ad6e1b08e. | source: `docs/sessions/evidence/task941/design/p00-head.txt:1-1`; observed: `ad6e1b08ec9cf21d29550b037040c02ed6772eae` |
| C33 | FACT | The governance contract self-test file is a case test file of the 935 contract. | source: `docs/sessions/evidence/task941/design/sources/tasks__Archive__Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json.txt:74-74`; observed: `"testFile": "scripts/workflow-gates/governance-contract.selftest.mjs",` |
| D1 | OWNER DECISION | Governance tasks are implemented by Opus in a separate session. | owner: 2026-11-01; decision: `Opus, a separate session (Recommended)` |
| D2 | OWNER DECISION | Approval independence is enforced by the hook. | owner: 2026-11-01; decision: `Yes, the hook blocks (Recommended)` |
| D7 | OWNER DECISION | Every CI fix is committed on task/935-governance-approval-route and published in PR #12, merged once all checks are green. | owner: 2026-11-01; decision: `Everything in PR #12 (Recommended)` |
| D9 | OWNER DECISION | A later independently reviewed contract may rebase a pinned reviewed contract when the changed files are in its scope but are not tests of its cases, with its cases rerun green. | owner: 2026-11-01; decision: `Governance task: audited rebase (Recommended)` |
| D10 | OWNER DECISION | The hook's false write detection is fixed as its own governance task, designed in the session that found it. | owner: 2026-11-01; decision: `Yes, fix the hook` and `Yes, prepare the kickoff for the hook` |

## Mobile adaptation record
- Scope: none

## 4. Scope and out of scope

In scope (the implementer writes exactly these): `scripts/workflow-gates/security-hook.mjs`, new
`scripts/workflow-gates/shell-write.selftest.mjs`, its entry in `scripts/workflow-gates/publication.json` (C26), the
stage/implementation/report/sensitivity fields of this task's `.security.json`, and the evidence files
`docs/sessions/evidence/task941/impl/completion-report.md`, `docs/sessions/evidence/task941/impl/governance-report.json`,
`docs/sessions/evidence/task941/impl/base-runs.txt`, `docs/sessions/evidence/task941/impl/p01-after.txt`,
`docs/sessions/evidence/task941/sensitivity/sensitivity.json` and `docs/sessions/evidence/task941/sensitivity/GOV-941-HOOK-WRITE-DENY.txt`.
Written by the approver only (R5): `scope` entries in the `review.rebases` of the Task 935 contract
`tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json` and of the Task 940
contract `tasks/Archive/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json`, with evidence `docs/sessions/evidence/task941/review/scope-rebase-935.md` and `…/scope-rebase-940.md`.

Out of scope: product code; every existing self-test file (case test files of 935 cannot be rebased, C33; `diff-hook.selftest.mjs`
must pass unchanged as the regression of C16–C18); the PowerShell hooks under `.claude/hooks/` and their own shell parsers; `cli.mjs`,
`contract.mjs` and the rules tree; widening detection to write programs that carry no write word today (`cp`, `mv`, `tee`,
`sed -i`): commands that are not provably read-only keep today's behaviour exactly, neither better nor worse.

## 5. Current and required behaviour

Preserved: for every command that is not classified read-only under R1, `shellWriteTargets` returns exactly what it returns today
(C2–C4), so every current detection (C12–C14, C16, C18) and every existing self-test stays as is; both consumers (C5, C6) and the
CI policy-diff check (C28) are unchanged. Changed: a command made only of read-only programs reports only its unquoted redirection
targets, so searching for a write word in a file no longer counts as writing it.

## Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R1 [C2; C3; C8; C9; C10; C11; D10] | **Read-only classification.** `security-hook.mjs` exports `isReadOnlyShellCommand(command)`, true only when all hold: (a) `command` is a string with no backtick, no `$(`, no `<(`, no `>(`, no `<<` and no unterminated single or double quote; (b) split on unquoted `;`, `&`, `|` and line breaks (so also `&&`, `\|\|`; an `&` directly after `>` or `<`, as in `2>&1`, belongs to the redirection and is not a separator), every non-empty simple command is read-only; tokens are whitespace-separated with their quote characters removed, and a token that contains an unquoted `>` or `<` is a redirection, not an argument; (c) a simple command is read-only when its first token, compared case-insensitively, is one of `cd`, `pwd`, `ls`, `cat`, `head`, `tail`, `wc`, `cut`, `grep`, `egrep`, `fgrep`, `Set-Location`, `Get-Location`, `Get-Content`, `Get-ChildItem`, `Get-Item`, `Select-String`, `Test-Path`, `Resolve-Path`, `Select-Object`, `Measure-Object`, or: `rg` with no argument starting `--pre`; `sed` whose arguments are exactly `-n`, one script matching `^[0-9]+(,([0-9]+\|\$))?p$` and one or more arguments not starting with `-`; `git` whose second token is one of `log`, `show`, `diff`, `status`, `rev-parse`, `ls-files`, `blame`, `grep`, `cat-file` and with no argument starting `--output` or `--open-files-in-pager` and no argument `-O`. Every other command is not read-only. | P1 | AC1, AC2, AC3 |
| R2 [C1; C3; C4; C11; C12; C13; C14] | **Targets.** When `isReadOnlyShellCommand(command)` is true, `shellWriteTargets` returns only the targets of the unquoted redirections `>` and `>>` (with an optional `1`, `2` or `*` stream prefix; `2>&1` has no target), resolved through `projectPath`. When it is false, `shellWriteTargets` returns exactly what the current function returns for that command (both branches, C2–C4). | P1 | AC1, AC2, AC3 |
| R3 [C5; C6; C7; C16; C17; C18] | **Consumers unchanged.** `governanceIndependenceErrors` and the pre-write guard keep calling `shellWriteTargets`; nothing else in `security-hook.mjs` changes. | P1 | AC4 |
| R4 [C25; C26; C27; C28; C29; C33] | **Proof.** The five GOV-941 cases live in the new `scripts/workflow-gates/shell-write.selftest.mjs`, listed in `publication.json`; no existing self-test file changes. | P1 | AC5 |
| R5 [C19; C20; C21; C22; C23; C24; C31; D7; D9] | **Rebase of the 935 and 940 contracts (approver).** After approving 941 (stage `reviewed`), the approver appends a `scope` entry by 941's contract to the `review.rebases` of the Task 935 contract and of the Task 940 contract, each with evidence (`scope-rebase-935.md`, `scope-rebase-940.md`) listing under `## Changed scope files` the files of that contract's scope that 941 changed (`scripts/workflow-gates/security-hook.mjs`, `scripts/workflow-gates/publication.json`), and recomputes nothing else in those contracts. | P1 | AC6 |

## Acceptance criteria

- **AC1 [R1; R2].** GOV-941-HOOK-READONLY-ALLOW passes: the read-only commands of C8–C11, `git diff -- scripts/workflow-gates/cli.mjs`, `sed -n '1,5p' scripts/workflow-gates/cli.mjs` and `Get-Content scripts/workflow-gates/cli.mjs | Select-String -Pattern 'Set-Content'` each give `isReadOnlyShellCommand` true and `shellWriteTargets` `[]`, and `governanceIndependenceErrors` for a fixture governance contract scoping the named files and a transcript of only these commands is `[]`. Rerunning `node docs/sessions/evidence/task941/design/p01-false-positive-probe.mjs` (output copied to `docs/sessions/evidence/task941/impl/p01-after.txt`) shows `[]` on lines 2–5 and 10 and unchanged targets on lines 6–9.
- **AC2 [R1; R2].** GOV-941-HOOK-WRITE-DENY passes; for a fixture scope file X and a read file Y each variant reports X among the targets and yields `GOVERNANCE INDEPENDENCE` for X: `Set-Content 'X' 'x'`; `node -e "require('fs').writeFileSync('X', 'x')"`; `echo x > X`; `grep -n 'a' Y > X`; `grep -n 'writeFileSync' Y; node -e "require('fs').writeFileSync('X', 'x')"`; `grep -n 'a' Y && Set-Content 'X' 'x'`; `Get-Content Y | Set-Content 'X'`; `rg --pre 'x' 'writeFileSync' X`. Sensitivity: classifying only the first simple command (ignoring the separators of R1 (b)) fails GOV-941-HOOK-WRITE-DENY with an assertion; restored passes.
- **AC3 [R1; R2].** GOV-941-HOOK-MALFORMED-ERROR passes: an unterminated quote, a backtick, `$(…)`, `<(…)` and a heredoc, each in a command that also names X with a write word, give `isReadOnlyShellCommand` false and `shellWriteTargets` equal to the result of the pre-change function (X included, compared against a copy of the C2–C4 logic inside the test); a non-string command gives false.
- **AC4 [R3].** GOV-941-HOOK-PRETOOL-DENY passes: for an executor PreToolUse event, `Select-String -Pattern 'Set-Content' -Path scripts/check-example.mjs` returns `[]`, and `Select-String -Pattern 'x' -Path scripts/check-example.mjs; Set-Content 'scripts/check-example.mjs' 'x'` returns `POLICY-EDIT AUTHORITY REQUIRED`. Every existing test of `diff-hook.selftest.mjs` and `governance-contract.selftest.mjs` passes with `git diff --exit-code` on all existing `*.selftest.mjs` files.
- **AC5 [R4].** GOV-941-CI-POLICY-DENY passes (`validateDiff` on a fixture root refuses a changed `scripts/workflow-gates/security-hook.mjs` with no governance contract: `outside every changed governance contract scope`, C28). `node scripts/workflow-gates/publication.mjs --base HEAD` reports 0 dependency errors; `node scripts/workflow-gates/selftests.mjs` exits 0 with at least 173 + 5 passing tests and 0 skipped (C29); `node scripts/workflow-gates/check-workflow.mjs` exits 0; `node node_modules/eslint/bin/eslint.js --config scripts/workflow-gates/eslint.config.mjs scripts/workflow-gates` exits 0; `node scripts/workflow-gates/cli.mjs governance-report --contract <this sidecar>` passes every case; `node scripts/workflow-gates/cli.mjs verify --contract <this sidecar>` exits 0 at stage implemented; `npm run check:kickoff-evidence` passes.
- **AC6 [R5].** After the approver's rebase, the scoped harness of Task 940 AC7 (`validateDiff` and `changedFiles` imported from `scripts/workflow-gates/cli.mjs`, phase `release`, base `origin/main`, working tree) reports no error for the 935, 940 and 941 contracts.

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | The shell write detection `shellWriteTargets` (C1–C4) and its two consumers: the Stop hook's governance independence check (`governanceIndependenceErrors`, C5) and the pre-write guard (`evaluateHook` PreToolUse, C6, C7); the CI policy-diff check of `validateDiff` (C28) as the preserved outer layer. Owner: Opus (D1). |
| Frontend security | Governance has no browser consumer; the hook layer replaces this row: GOV-941-HOOK-READONLY-ALLOW, GOV-941-HOOK-WRITE-DENY, GOV-941-HOOK-MALFORMED-ERROR and GOV-941-HOOK-PRETOOL-DENY on the real `isReadOnlyShellCommand`, `shellWriteTargets`, `governanceIndependenceErrors` and `evaluateHook` with synthetic transcripts and contracts. |
| Server security | The CI layer replaces this row: GOV-941-CI-POLICY-DENY on the real `validateDiff` with a fixture root. |
| Database/integrations | Not applicable: no database, Storage, Realtime or provider path. |
| Cases | The five GOV-941 cases of the sidecar, each with actor, resource, input, response and forbidden effects; allow, deny and error outcomes; hook and CI layers. |
| Fixtures and environment | Temporary directories from `mkdtempSync`, synthetic contracts and transcripts; no credentials, no network, no repository writes outside temporary folders. |
| Sensitivity proof | Critical case GOV-941-HOOK-WRITE-DENY: the break named in AC2; baseline pass, isolated break failing with an assertion, restored pass; artifact `docs/sessions/evidence/task941/sensitivity/GOV-941-HOOK-WRITE-DENY.txt`. |
| Execution | `node scripts/workflow-gates/cli.mjs governance-report --contract tasks/Sprints/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json`, then `cli.mjs verify` on the same path; native Windows PowerShell 5.1, Node 22.22.3; QA Q1. |

## 6. Ordered route

1. **Owner** (separate PowerShell window, `C:\Claude_Code_Projects\lero-al`): stay on `task/935-governance-approval-route` (D7);
   commit this kickoff set with the command Opus gives.
2. **Prerequisite, before the first write of step 3:** the Task 940 approval is committed on the branch: the archived 940 sidecar
   reads `"stage": "reviewed"` (C31) and `git status --short tasks/Archive` shows neither the 935 nor the 940 sidecar as changed or
   untracked. Otherwise this task stops as `BLOCKED`, because changing a 940 scope file before that commit changes a candidate
   whose approval is not yet recorded (C19, C20).
3. **Opus implementer, fresh session** (D1): read this kickoff and its bundle; save the base run of `selftests.mjs` to
   `docs/sessions/evidence/task941/impl/base-runs.txt` before the first write. Implement R1–R3, then R4 with the five cases. Record
   `implementation: { "role": "Opus" }`, stage `implemented`, `report` and `sensitivity` in the sidecar; run the AC2 sensitivity
   break and keep its artifact; rerun the p01 probe (AC1). Do not write R5: the approver does.
4. Run `cli.mjs governance-report` and every AC command; write the completion report; end with
   `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` and the explicit-path commit command for the owner. No push.
5. **Opus approver, another fresh session** (D2): review R1–R5; on approval write the `review` block and stage `reviewed`, write R5
   with its two evidence files, run AC6, and hand off the explicit-path commit under `shared/git-publication.md`. PR #12 merges only
   after green PR checks (D7).

## 7. Completion report

Per requirement: changed files, evidence path, status; each GOV-941 case with its result; the sensitivity diff with the failed
assertion; base and final self-test totals; the p01 probe before/after; proof that no existing self-test file changed; one of
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 8. Rule compliance

| Rule | How this kickoff complies |
|---|---|
| `claim-evidence-contract.md` | Every R cites ledger rows; sources are retained snapshots and executed probes under `docs/sessions/evidence/task941/design/`. |
| `security-testing.md` | Governance contract: hook and CI layers, allow/deny/error, sensitivity for the critical case, Q1. |
| `role-boundaries.md` | Opus implements policy (D1); Sonnet is not routed; approval by an independent session (D2). |
| `git-publication.md` | Task-branch commit on PR #12's branch (D7); merge only after green checks. |
| `mobile-adaptation-contract.md` | No visible scope: `Scope: none`. |

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31, C32, C33; owner decisions: D1, D2, D7, D9, D10; blocked claims: NONE.
