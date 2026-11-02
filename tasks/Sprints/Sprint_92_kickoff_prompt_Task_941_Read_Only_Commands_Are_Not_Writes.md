# Task 941 — A read-only shell command is not counted as a write by the security hook

Sprint 92. P1. QA profile **Q1** (non-UI gate code and its tests, `docs/qa-profiles.md`). Kickoff by Opus, 2026-11-01, at the
owner's instruction to fix the hook after the Task 940 approver session was refused approval for a command that only read files
(D10). **Revision 1, 2026-11-02**, by the Opus reviewer of the first candidate (commit `758508105`, C34): review 1 is
`NEEDS REVISION` because comments, Bash-only quoting, globs and `$_` let a command that really writes pass as read-only (C35–C46,
C55–C57); R1, R2 and
AC1–AC4 are amended, the route resumes from that commit. The reviewer of revision 1 designed it, so neither it nor the first
implementer may approve 941 (D2); revision 1 is implemented by an Opus session that is not this reviewer (D1).

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

Review 1 of the first candidate (C34; 178 gate self-tests pass on it, C47) executed each form below for real in Git Bash or
Windows PowerShell in a temporary folder and through the candidate hook (`docs/sessions/evidence/task941/review-1/r1-bypass-probe.mjs`).
A quote inside a comment hides the next command from the quote-aware split: Bash runs `echo hidden > T` written on the line after
`cat README.md # '` (C35), PowerShell runs a `Set-Content` after a `#` line comment (C38) and after a `<# ' #>` block comment
(C39); the candidate classifies each read-only (C36) with no target (C54), where the pre-941 function reported the scope file (C37) or
the `.git` path (C41), so an executor PreToolUse event gets no refusal (C40). Bash also reads `--pr\e` and `$'--pre'` as `--pre`
(C42), so `rg` and `git` options the R1 list excludes pass as read-only (C43, C44), and expands an unquoted `*` to file names, so
`sed -n 1p *` beside a file named `-i` edits files in place while classified read-only (C45, C46). A double-quoted `"$_"` carries
the previous command's last argument (`--output=X`, `-i`, `--pre=…`) into `git`, `sed` or `rg` (C55–C57). The owner asked on 2026-11-02 to
close every found and potential hole inside the current tasks (C49). The first implementer's hardening beyond the literal R1 (C50)
and target suffix beyond the literal R2 (C51) are adopted below; its two findings on AC1 (C52, C53) are corrected in AC1. Task 943
builds on the set that 941 R1 (a) rejects (C48); revision 1 only widens that set.

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
| C34 | FACT | Review 1 probed the first candidate, commit 758508105. | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:1-1`; observed: `commit 758508105;` |
| C35 | FACT | Git Bash runs a redirection written on the line after a comment that contains a quote (executed). | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:3-3`; observed: `real bash: hidden write happened: true` |
| C36 | FACT | The candidate classifies that command read-only (executed). | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:3-3`; observed: `readOnly=true` |
| C37 | FACT | The pre-941 function reported the scope file for that command (executed on the parent commit's function). | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:3-3`; observed: `before941=["scripts/workflow-gates/security-hook.mjs"]` |
| C38 | FACT | PowerShell runs a Set-Content written on the line after a comment that contains a quote (executed). | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:5-5`; observed: `real powershell: hidden write happened: true` |
| C39 | FACT | PowerShell runs a Set-Content placed between two block comments that each contain a quote (executed). | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:6-6`; observed: `real powershell: hidden write happened: true` |
| C40 | FACT | An executor PreToolUse event with the comment-hidden policy write gets no refusal from the candidate (executed). | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:3-3`; observed: `executor PreToolUse=[]` |
| C41 | FACT | The pre-941 function reported a comment-hidden write of Git metadata, which the candidate misses (executed). | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:8-8`; observed: `before941=[".git/hooks/pre-commit"]` |
| C42 | FACT | Git Bash reads an unquoted backslash and ANSI-C quoting away, so both spellings become the option (executed). | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:9-10`; observed: `bash prints [--pre][--output=%T%]` |
| C43 | FACT | The candidate classifies rg with a backslash-spelled --pre read-only (executed). | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:11-11`; observed: `readOnly=true` |
| C44 | FACT | The candidate classifies git log with an ANSI-C quoted --output read-only (executed). | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:14-14`; observed: `readOnly=true` |
| C45 | FACT | Git Bash expands an unquoted glob to a file named -i, so sed -n 1p edits files in place (executed). | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:15-15`; observed: `target content after run "one\n" (before "one\ntwo\n")` |
| C46 | FACT | The candidate classifies that sed command read-only (executed). | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:15-15`; observed: `readOnly=true` |
| C47 | FACT | The gate self-tests pass 178 tests on the first candidate (review run). | source: `docs/sessions/evidence/task941/review-1/r1-selftests-758508105.txt:1075-1075`; observed: `# pass 178` |
| C48 | FACT | Task 943 defines its result relative to the commands that 941 R1 (a) rejects. | source: `tasks/Sprints/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.md:205-205`; observed: `for commands that 941 R1 (a) rejects as unparseable` |
| C49 | FACT | The owner asked on 2026-11-02 to close every found and potential hole inside the current tasks. | source: `docs/backlog.md:45-45`; observed: `close every found and potential hole inside the current tasks, no new task` |
| C50 | FACT | The first implementer hardened the classifier beyond the literal R1 (a), fail-closed only. | source: `docs/sessions/evidence/task941/impl/completion-report.md:100-100`; observed: `Hardening beyond the literal R1 (a)` |
| C51 | FACT | The first implementer also reports the project path a read-only redirection target ends with. | source: `docs/sessions/evidence/task941/impl/completion-report.md:112-112`; observed: `Target suffix (S1), beyond the literal R2.` |
| C52 | FACT | AC1's unchanged line 9 conflicts with R2, because line 9 is a read-only grep redirected into a file. | source: `docs/sessions/evidence/task941/impl/completion-report.md:116-116`; observed: `F2 — AC1 conflicts with R2 on probe line 9.` |
| C53 | FACT | The design probe cannot run as saved, because the Task 940 contract it names was archived. | source: `docs/sessions/evidence/task941/impl/completion-report.md:122-122`; observed: `F3 — the design probe cannot run as saved.` |
| C54 | FACT | The candidate reports no write target for that command (executed). | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:3-3`; observed: `after=[]` |
| C55 | FACT | Git Bash passes the previous command's last argument through a double-quoted `$_`, so git log writes the --output file (executed). | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:16-16`; observed: `real bash: hidden write happened: true` |
| C56 | FACT | The same `$_` turns sed -n 1p into an in-place edit (executed). | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:17-17`; observed: `target content after run "one\n" (before "one\ntwo\n")` |
| C57 | FACT | The candidate classifies rg with a `$_` argument read-only, where the pre-941 function reported the scope file (executed). | source: `docs/sessions/evidence/task941/review-1/r1-bypass-probe.txt:18-18`; observed: `before941=["scripts/workflow-gates/security-hook.mjs","../../dev/null"]` |
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
| R1 [C2; C3; C8; C9; C10; C11; C35; C36; C37; C38; C39; C40; C41; C42; C43; C44; C45; C46; C49; C50; C54; C55; C56; C57; D10] | **Read-only classification.** `security-hook.mjs` exports `isReadOnlyShellCommand(command)`, true only when all hold: (a) `command` is a string with no backtick, no `$(`, no `<(`, no `>(`, no `<<` and no unterminated single or double quote, and (revision 1; C35–C46, C50) with none of: an unquoted `#` (a comment in Bash and PowerShell, including `<#`); an unquoted `$` directly before a quote (Bash `$'…'` and `$"…"`); a backslash directly before a quote; a typographic quote U+2018–U+201E; an unquoted `@` directly before a quote (PowerShell here-strings); an unquoted `(` or `{`; unquoted whitespace other than space, tab, carriage return and line feed; (b) split on unquoted `;`, `&`, `|` and line breaks (so also `&&`, `\|\|`; an `&` directly after `>` or `<`, as in `2>&1`, belongs to the redirection and is not a separator), every non-empty simple command is read-only; tokens are whitespace-separated with their quote characters removed, and a token that contains an unquoted `>` or `<` is a redirection, not an argument; (c) a simple command is read-only when its first token, compared case-insensitively, is one of `cd`, `pwd`, `ls`, `cat`, `head`, `tail`, `wc`, `cut`, `grep`, `egrep`, `fgrep`, `Set-Location`, `Get-Location`, `Get-Content`, `Get-ChildItem`, `Get-Item`, `Select-String`, `Test-Path`, `Resolve-Path`, `Select-Object`, `Measure-Object`, or: `rg` with no argument starting `--pre` or `--hostname-bin`; `sed` whose arguments are exactly `-n`, one script matching `^[0-9]+(,([0-9]+\|\$))?p$` and one or more arguments not starting with `-`; `git` whose second token is one of `log`, `show`, `diff`, `status`, `rev-parse`, `ls-files`, `blame`, `grep`, `cat-file` and with no argument that starts `--output` or `--open-files-in-pager` or is a prefix abbreviation of either (with or without `=…`), and no single-dash argument containing `O` (`-O`, `-lOx`); (d) (revision 1; C42–C46, C55–C57) for `rg`, `sed` and `git`, no argument contains an unquoted `*`, `?` or `[` (Bash expands it to file names such as `-i`), no argument contains a `$` outside single quotes (Bash and PowerShell expand `$_` and other parameters also inside double quotes; a single-quoted `sed` script `'1,$p'` stays allowed), and the program name and every argument check of (c) hold both for each token as written and for the token with each unquoted backslash dropped (Bash reads `\x` outside quotes as `x`). Every other command is not read-only. | P1 | AC1, AC2, AC3 |
| R2 [C1; C3; C4; C11; C12; C13; C14; C51] | **Targets.** When `isReadOnlyShellCommand(command)` is true, `shellWriteTargets` returns only the targets of the unquoted redirections `>` and `>>` (with an optional `1`, `2` or `*` stream prefix; `2>&1` has no target; `>&file` and `<>file` write `file`), resolved through `projectPath`, plus for each target the project file path its text ends with (C51: `$PWD/…`, `~/…`, `/c/…`, `$pwd\…`). When it is false, `shellWriteTargets` returns exactly what the current function returns for that command (both branches, C2–C4). | P1 | AC1, AC2, AC3 |
| R3 [C5; C6; C7; C16; C17; C18] | **Consumers unchanged.** `governanceIndependenceErrors` and the pre-write guard keep calling `shellWriteTargets`; nothing else in `security-hook.mjs` changes. | P1 | AC4 |
| R4 [C25; C26; C27; C28; C29; C33] | **Proof.** The five GOV-941 cases live in the new `scripts/workflow-gates/shell-write.selftest.mjs`, listed in `publication.json`; no existing self-test file changes. | P1 | AC5 |
| R5 [C19; C20; C21; C22; C23; C24; C31; D7; D9] | **Rebase of the 935 and 940 contracts (approver).** After approving 941 (stage `reviewed`), the approver appends a `scope` entry by 941's contract to the `review.rebases` of the Task 935 contract and of the Task 940 contract, each with evidence (`scope-rebase-935.md`, `scope-rebase-940.md`) listing under `## Changed scope files` the files of that contract's scope that 941 changed (`scripts/workflow-gates/security-hook.mjs`, `scripts/workflow-gates/publication.json`), and recomputes nothing else in those contracts. | P1 | AC6 |

## Acceptance criteria

- **AC1 [R1; R2].** GOV-941-HOOK-READONLY-ALLOW passes: the read-only commands of C8–C11, `git diff -- scripts/workflow-gates/cli.mjs`, `sed -n '1,5p' scripts/workflow-gates/cli.mjs` and `Get-Content scripts/workflow-gates/cli.mjs | Select-String -Pattern 'Set-Content'`, and (revision 1) `Get-Content scripts\workflow-gates\cli.mjs | Select-String -Pattern 'Set-Content'` and `grep -n '#.*writeFileSync' scripts/workflow-gates/cli.mjs` each give `isReadOnlyShellCommand` true and `shellWriteTargets` `[]`, and `governanceIndependenceErrors` for a fixture governance contract scoping the named files and a transcript of only these commands is `[]`. The design probe `docs/sessions/evidence/task941/design/p01-false-positive-probe.mjs` cannot run as saved (C53); it is evaluated with exactly the two substitutions stated at the top of the run note of `docs/sessions/evidence/task941/impl/p01-after.txt` (Task 940 path `tasks/Sprints/` → `tasks/Archive/`; its own result-file write removed, stdout saved instead), and shows `[]` on lines 2–5 and 10, unchanged targets on lines 6–8, and on line 9, a read-only `grep` redirected into `publication.json` (C52), exactly `["scripts/workflow-gates/publication.json"]`.
- **AC2 [R1; R2].** GOV-941-HOOK-WRITE-DENY passes; for a fixture scope file X and a read file Y each variant reports X among the targets and yields `GOVERNANCE INDEPENDENCE` for X: `Set-Content 'X' 'x'`; `node -e "require('fs').writeFileSync('X', 'x')"`; `echo x > X`; `grep -n 'a' Y > X`; `grep -n 'writeFileSync' Y; node -e "require('fs').writeFileSync('X', 'x')"`; `grep -n 'a' Y && Set-Content 'X' 'x'`; `Get-Content Y | Set-Content 'X'`; `rg --pre 'x' 'writeFileSync' X`; and (revision 1, C35–C41) the comment-hidden writes `cat Y # '` + line feed + `echo x > X # '` (Bash), `Get-Content Y # '` + line feed + `Set-Content 'X' 'x' # '` (PowerShell) and `Get-Content Y <# ' #> ; Set-Content 'X' 'x' <# ' #>` (PowerShell). Sensitivity: classifying only the first simple command (ignoring the separators of R1 (b)) fails GOV-941-HOOK-WRITE-DENY with an assertion; restored passes. Revision 1 adds a second isolated break in the same artifact: removing the unquoted-`#` refusal of R1 (a) fails GOV-941-HOOK-WRITE-DENY with an assertion on a comment-hidden variant; restored passes.
- **AC3 [R1; R2].** GOV-941-HOOK-MALFORMED-ERROR passes: an unterminated quote, a backtick, `$(…)`, `<(…)` and a heredoc, each in a command that also names X with a write word, give `isReadOnlyShellCommand` false and `shellWriteTargets` equal to the result of the pre-change function (X included, compared against a copy of the C2–C4 logic inside the test); a non-string command gives false. The same holds for each other R1 (a) form with X and a write word (revision 1 adds an unquoted `#` and `$'…'`, `$"…"`), and for these commands that R1 (c)–(d) do not classify read-only: `rg --pr\e 'x' 'writeFileSync' X`, `git log --out\put=X -S writeFileSync`, `sed -n 1p * 'writeFileSync' X`, `rg a *pre=x 'writeFileSync' X` (C42–C46), `cat --pre=x; rg "$_" 'writeFileSync' X`, `cat --output=X; git log -1 "$_" -S writeFileSync` and `head -i; sed -n 1p "$_" 'writeFileSync' X` (C55–C57); `sed -n '1,$p' Y` stays read-only.
- **AC4 [R3].** GOV-941-HOOK-PRETOOL-DENY passes: for an executor PreToolUse event, `Select-String -Pattern 'Set-Content' -Path scripts/check-example.mjs` returns `[]`, and `Select-String -Pattern 'x' -Path scripts/check-example.mjs; Set-Content 'scripts/check-example.mjs' 'x'` returns `POLICY-EDIT AUTHORITY REQUIRED`; (revision 1, C40, C41) an executor Bash event `cat README.md # '` + line feed + `echo x > scripts/check-example.mjs # '` returns `POLICY-EDIT AUTHORITY REQUIRED`, and the same shape writing `.git/hooks/pre-commit` returns `OWNER GIT REQUIRED`. Every existing test of `diff-hook.selftest.mjs` and `governance-contract.selftest.mjs` passes with `git diff --exit-code` on all existing `*.selftest.mjs` files.
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
| Sensitivity proof | Critical case GOV-941-HOOK-WRITE-DENY: the two breaks named in AC2, each isolated; baseline pass, break failing with an assertion, restored pass; artifact `docs/sessions/evidence/task941/sensitivity/GOV-941-HOOK-WRITE-DENY.txt`. |
| Execution | `node scripts/workflow-gates/cli.mjs governance-report --contract tasks/Sprints/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json`, then `cli.mjs verify` on the same path; native Windows PowerShell 5.1, Node 22.22.3; QA Q1. |

## 6. Ordered route

1. **Owner** (separate PowerShell window, `C:\Claude_Code_Projects\lero-al`): stay on `task/935-governance-approval-route` (D7);
   commit this kickoff set with the command Opus gives.
2. **Prerequisite, before the first write of step 3:** the Task 940 approval is committed on the branch: the archived 940 sidecar
   reads `"stage": "reviewed"` (C31) and `git status --short tasks/Archive` shows neither the 935 nor the 940 sidecar as changed or
   untracked. Otherwise this task stops as `BLOCKED`, because changing a 940 scope file before that commit changes a candidate
   whose approval is not yet recorded (C19, C20).
   Done for the first candidate (commit `758508105`, C34). Revision 1 prerequisite: the owner has committed the revision 1 set
   (this kickoff, its sidecar, `docs/backlog.md` and `docs/sessions/evidence/task941/review-1/`), and
   `git status --short tasks/Sprints/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.md tasks/Sprints/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json docs/backlog.md docs/sessions/evidence/task941 scripts/workflow-gates`
   prints nothing; otherwise stop as `BLOCKED` (unrelated untracked files elsewhere in `tasks/Sprints` do not count).
3. **Opus implementer** (D1): the first implementer session or a fresh one, never the revision 1 reviewer. Read this kickoff and
   its bundle in full; append the revision 1 base run of `selftests.mjs` (expected 178 pass, C47) under a `## Revision 1 base run`
   heading of `docs/sessions/evidence/task941/impl/base-runs.txt` before the first write. Amend the first candidate's code for
   revision 1 of R1–R2 and its assertions in the existing five cases (R3, R4 unchanged). Record `implementation: { "role": "Opus" }`,
   stage `implemented`, `report` and `sensitivity` in the sidecar; run both AC2 sensitivity breaks and keep them in the one
   artifact; rerun the p01 probe as AC1 states, and rerun `node docs/sessions/evidence/task941/review-1/r1-bypass-probe.mjs <HEAD>`
   with the argument `758508105` (its `before941` column reads the parent of that commit; read-only) and quote its `readOnly=`
   values in the completion report: false on every line. Do not write R5: the approver does.
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

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31, C32, C33, C34, C35, C36, C37, C38, C39, C40, C41, C42, C43, C44, C45, C46, C47, C48, C49, C50, C51, C52, C53, C54, C55, C56, C57; owner decisions: D1, D2, D7, D9, D10; blocked claims: NONE.
