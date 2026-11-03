# Task 943 — Commands that copy, move, delete or edit files in place are counted as writes by the security hook

Sprint 92. P1. QA profile **Q1** (non-UI gate code and its tests, `docs/qa-profiles.md`). Kickoff by Opus, 2026-11-01, at the
owner's instruction to close the gap that Task 941 leaves out of scope (D11). **Revision 1, 2026-11-02** (D12, D13): this task also
carries the gate and rule holes found since — the audited rebase of a changed case test (R7), the untracked exempting contract (R8),
the two review-closure rule gaps (R9) and reviewed contracts going stale outside the diff (R11, with two rebases in R6) — because the owner forbids a new task (D13) and these touch the same gate files.
**Revision 2, 2026-11-02**, by the Opus session that reviewed the Task 941 revision 1 candidate (review 2) in its self-audit (D14):
other spellings of a target reach the same file unreported — a glob, a folder changed inside the command or by an earlier tool call,
a Windows 8.3 short name, trailing dots and spaces, and, found by an independent audit, MSYS, device, UNC and junction spellings
and folder changes inside nested shells — and a write word naming a project-root product file reports nothing (C60–C100);
R12, AC13 and one case are added, and R1, R4, R5, AC11 and the route are amended.
**Revision 3, 2026-11-03**, by the Opus session that approved Task 941 (review 3), under D13 and D14: the Bash `>|` redirection
(write despite `noclobber`) writes its target while the hook reports none, before and after 941 (C108–C122); R12 (g) is added and
AC13, the case input and the route are amended.
**Revision 4, 2026-11-03**, by the Opus session that reviewed the revision 3 candidate (Task 943 review 1, `NEEDS REVISION`),
under D13 and D14: R2 contradicts two equality assertions of the unchanged Task 941 test file (C123–C127), so the 943
implementation changes exactly those two assertions and its approver writes a D12 `tests` rebase of the 941 contract; the
pre-write guard ignores the event `cwd` for a relative Write/Edit path (C128); and section 5 programs run through a nested
shell, an evaluator, `Start-Process`, a runner such as `timeout`, a pipeline into a path-less cmdlet, or a quoted option of a
parser-rejected command report nothing (C129–C133); an independent sub-review of the same candidate adds F1–F8 (C144),
consolidated here; a second self-audit of revision 4 adds nested shells inside parser-rejected commands, script blocks
and the programs of R15 (C158–C168), and a third adds downloads, remote copies, `npm pkg`/`npm version` and child-process
command strings (C169, C170) and states the limit of a listed-form hook (section 4). R13, R14, R15, AC14, AC15, AC16 and the case GOV-943-HOOK-NESTED-DENY are added; R1, R5, R6, R12 (d), AC1, AC7,
AC11, AC13, section 4, the security contract and the route are amended (C134–C155).

## 1. Mode, task type and rule bundle

Governance task. **Implementer: Opus, in a fresh implementation session started for this task (D1); Sonnet does not execute it**,
because every path in scope is a policy path (C36). **Approver: Opus, in another fresh session that wrote none of the scope files
(D2).** Neither may be the session that designed this kickoff, the session that wrote revision 2 (the Task 941 review 2
session), the session that wrote revision 3 (the Task 941 review 3 session) or the session that wrote revision 4 (the Task 943
review 1 session); the session that implemented revision 3 may implement revision 4, and it still may not approve. Types (`docs/rule-index.md`): workflow gates / governance tooling.
Bundle: `.claude/rules/shared/workflow-gates.md` with `workflow-contract.md`, `workflow-evidence.md`, `workflow-ci.md`,
`git-publication.md`; `security-testing.md`; `role-boundaries.md`; `claim-evidence-contract.md`; `task-readiness.md`;
`orchestration-state.md`; `.claude/rules/review/03-decision-closure.md`.

## 2. Objective

The hook knows that a shell command writes a file only from a write word (`Set-Content`, `writeFileSync`, …) or an output
redirection (C1, C2). Every other way of changing a file is invisible to it: `cp`, `mv`, `tee`, `sed -i`, `rm`, `Copy-Item`,
`Remove-Item`, `fs.copyFileSync`, `[IO.File]::WriteAllText` and more report no target (C5–C13), while `Set-Content` does (C14).
Consequences: a session that changed governance scope files only this way passes the independence check (C3, C15), and Sonnet can
change a policy or out-of-scope product file through `cp`, `sed -i` or `Copy-Item` without being stopped (C4, C16–C18), although
the same write through `Set-Content` is refused (C19). After this task these commands report the files they change, for both
consumers.

Revision 1 adds four more holes. (a) A changed case test can never be rebased (C37): hardening the case tests of reviewed
contracts that Task 931 revision 3 must fix (19 among its first 39 files alone, C39) — among them the CI-red `googlePopup.test.ts` (C40, C41) — would leave those
contracts stale for ever; the owner chose an audited case-test rebase (D12), which CI can bound because it reruns the cases of every
touched product contract (C38). (b) The independence exemption trusts any contract on disk, tracked or not (C42), although a valid
rules entry is now required (C43, Task 935 note N1 closed by Task 940 R5); this is Task 940 note N3. (c) The closure rule lets
`APPROVED WITH NOTES` leave notes with no destination (C44), and nothing requires the CI job a task exists to fix to be green on the
reviewed SHA (C41). (d) No gate notices a reviewed contract going stale while its own file is not in the diff (C50): the 923
owner-fixes and 927 reviews have been stale since rule changes on this branch, with no rebase, unnoticed (C54, C55); a `rules` entry
by the reviewed 935 contract carries both (C56).

Revision 2 adds (e): the hook reports a target as it is spelled, while both shells reach the same file through other spellings. A
redirection glob writes the one file it matches in Git Bash and PowerShell 5.1 (C60–C62). A `cd`/`Push-Location` inside the
command moves a relative target that the hook resolves against the project root (C64–C67), and so does the folder an earlier tool
call left, which the transcript records per tool call and the hook ignores (C68, C69). An 8.3 short name writes the long file in
both shells, and a Write tool call to a short spelling of a scope file passes the independence check (C70–C74). PowerShell drops
trailing dots and spaces (C75–C78). A write word naming a project-root product file reports nothing, so the pre-write guard lets
Sonnet change `package.json` with `Set-Content` or `node -e` (C79–C82). After this task each of these reports the real file too.

Revision 3 adds (f): Git Bash `>|` writes the word after it, also with a space, a `2` prefix, a quoted word and after a `cd`
(C108–C110), and inside `.git` `>|head` overwrites `.git/HEAD` (C112); a quoted `>|` writes nothing (C111). The hook's redirection
pattern never matches `>|`, so a command that is not read-only reports no target (C113) and an executor `echo x >| src/profile.ts`
is allowed before and after 941 (C115); the 941 classifier splits at the `|`, so a target spelled as a read-only program name
leaves the command read-only with no target (C114). A prototype rule reports the target (C116), adds nothing for a quoted `>|`
(C117), yields the existing refusals for its paths (C118), changes 2 commands of the frozen corpus with no guarded target (C119)
and touches no existing self-test (C120).

Revision 4 adds (g): the review of the revision 3 candidate found 190 of 191 self-tests passing; GOV-941-HOOK-MALFORMED-ERROR
fails because the parseable `sed -i 's/a/b/' X writeFileSync` really edits `writeFileSync` too, which R2 reports and the 941
assertion forbids (C123–C126); only the 941 contract scopes that file (C127). The executor guard allows a relative Write in a
`cwd` below the root (C128). `bash -c 'cp Y X'`, `powershell -Command "Copy-Item Y X"`, `timeout 5 rm X`,
`Get-ChildItem D | Remove-Item` and an unparseable `sed "-i" … X '` report nothing (C129–C133). A design prototype
(`docs/sessions/evidence/task943/design/p15-r13-pairs.txt` applied to the candidate hook by `p15-run.mjs`) reports every such form
and the guard refuses it (C134), keeps the read controls silent (C135), fixes the relative Write (C136), passes every hook-importing
self-test, `shell-write.selftest.mjs` with the K1 change also against the candidate (C137, C138), and over the frozen corpus adds
targets for 63 commands, refuses 6 executor commands, adds no governance scope file and keeps every Task 941 target
(C139–C142, C154). The sub-review findings (C144) are closed by the same prototype: W2 and section 5 in a parser-rejected
command (F1, F2, F4; C145, C146, C148), `cd /d` (F3; C147), the enrollment cost of a directory walk (F5; C149), the string
method `replace` (F7; C150, C151) and 5000 folder changes within the hook timeout (F8; C152, C153); F6 is C128.

## 3. Verified context

`shellWriteTargets` (C1) reports targets only for its write words (C2) and redirections; the independence check (C3) and the
pre-write guard (C4) consume it. Revision 2 probes (p09, p10) ran on HEAD `db04c936f` with the hook at sha256 `a5ee689c…` (C60–C86). An executed probe on the real function at HEAD `01b8259fa` (C34) shows twenty mutating forms with
no target (C5–C13) and the `Set-Content` control detected (C14); the independence check returns no error for a transcript of all
of them (C15). An executed probe of the pre-write guard for an executor shows `cp`, `sed -i` and `Copy-Item` into policy or product
files allowed (C16–C18) and the `Set-Content` control refused (C19). Mutating Git commands are already refused by a separate hook
that allows only read-only subcommands (C22). Task 941 leaves this gap out of its scope (C23), keeps the result of every command it
does not classify read-only identical to today's (C24) and asserts that equality for unparseable commands in a case test (C25) of
its own test file (C26); 941 is still `planned` (C27). The hook file and the publication manifest are scope files of the reviewed
935 and 940 contracts (C28–C31) and of 941 (C32, C33), so this task needs their scope rebases (owner D9). A CI probe shows that a
deleted hook file outside every governance scope is refused (C20). Baseline: 173 gate self-tests pass (C21); self-tests are listed
in the publication manifest (C35).

## Claim ledger

| ID | Status | Claim | Evidence |
|---|---|---|---|
| C1 | FACT | The hook derives shell write targets in one exported function. | source: `docs/sessions/evidence/task943/design/sources/scripts__workflow-gates__security-hook.mjs.txt:109-109`; observed: `export function shellWriteTargets(root, command) {` |
| C2 | FACT | Path collection depends on a fixed list of write cmdlet and API words. | source: `docs/sessions/evidence/task943/design/sources/scripts__workflow-gates__security-hook.mjs.txt:111-111`; observed: `(?:Set-Content` |
| C3 | FACT | The governance independence check is a function of the transcript's calls. | source: `docs/sessions/evidence/task943/design/sources/scripts__workflow-gates__security-hook.mjs.txt:124-124`; observed: `export function governanceIndependenceErrors(root, contract, receiptPath, transcript) {` |
| C4 | FACT | The pre-write guard takes shell write targets from the same function. | source: `docs/sessions/evidence/task943/design/sources/scripts__workflow-gates__security-hook.mjs.txt:244-244`; observed: `files = shellWriteTargets(root, input.command);` |
| C5 | FACT | cp into a scope file reports no target (executed probe). | source: `docs/sessions/evidence/task943/design/p01-undetected-writes-probe.txt:2-2`; observed: `cp: targets []` |
| C6 | FACT | mv onto a scope file reports no target (executed probe). | source: `docs/sessions/evidence/task943/design/p01-undetected-writes-probe.txt:3-3`; observed: `mv (destination): targets []` |
| C7 | FACT | tee into a scope file reports no target (executed probe). | source: `docs/sessions/evidence/task943/design/p01-undetected-writes-probe.txt:5-5`; observed: `tee: targets []` |
| C8 | FACT | sed -i on a scope file reports no target (executed probe). | source: `docs/sessions/evidence/task943/design/p01-undetected-writes-probe.txt:6-6`; observed: `sed -i: targets []` |
| C9 | FACT | rm of a scope file reports no target (executed probe). | source: `docs/sessions/evidence/task943/design/p01-undetected-writes-probe.txt:7-7`; observed: `rm: targets []` |
| C10 | FACT | Copy-Item onto a scope file reports no target (executed probe). | source: `docs/sessions/evidence/task943/design/p01-undetected-writes-probe.txt:12-12`; observed: `Copy-Item: targets []` |
| C11 | FACT | Remove-Item of a scope file reports no target (executed probe). | source: `docs/sessions/evidence/task943/design/p01-undetected-writes-probe.txt:14-14`; observed: `Remove-Item: targets []` |
| C12 | FACT | node -e with fs.copyFileSync onto a scope file reports no target (executed probe). | source: `docs/sessions/evidence/task943/design/p01-undetected-writes-probe.txt:18-18`; observed: `node fs.copyFileSync: targets []` |
| C13 | FACT | A .NET File.WriteAllText call reports no target (executed probe). | source: `docs/sessions/evidence/task943/design/p01-undetected-writes-probe.txt:21-21`; observed: `.NET WriteAllText: targets []` |
| C14 | FACT | The Set-Content control is detected (executed probe). | source: `docs/sessions/evidence/task943/design/p01-undetected-writes-probe.txt:22-22`; observed: `control: Set-Content (detected today): targets ["scripts/workflow-gates/cli.mjs"]` |
| C15 | FACT | The independence check finds no write in a transcript of all twenty mutating forms (executed probe). | source: `docs/sessions/evidence/task943/design/p01-undetected-writes-probe.txt:23-23`; observed: `transcript of every command above except the control): []` |
| C16 | FACT | The pre-write guard allows an executor cp into a policy file (executed probe). | source: `docs/sessions/evidence/task943/design/p02-pretool-probe.txt:2-2`; observed: `executor cp into a policy file: []` |
| C17 | FACT | The pre-write guard allows an executor Copy-Item into a policy file (executed probe). | source: `docs/sessions/evidence/task943/design/p02-pretool-probe.txt:4-4`; observed: `executor Copy-Item into a policy file: []` |
| C18 | FACT | The pre-write guard allows an executor cp into a product file without a task receipt (executed probe). | source: `docs/sessions/evidence/task943/design/p02-pretool-probe.txt:5-5`; observed: `executor cp into a product file: []` |
| C19 | FACT | The pre-write guard refuses the executor Set-Content control (executed probe). | source: `docs/sessions/evidence/task943/design/p02-pretool-probe.txt:6-6`; observed: `POLICY-EDIT AUTHORITY REQUIRED` |
| C20 | FACT | CI refuses a deleted hook file outside every governance scope (executed probe). | source: `docs/sessions/evidence/task943/design/p03-ci-delete-probe.txt:2-2`; observed: `outside every changed governance contract scope` |
| C21 | FACT | The gate self-tests pass 173 tests before this task. | source: `docs/sessions/evidence/task943/design/p04-selftests-base.txt:1045-1045`; observed: `# pass 173` |
| C22 | FACT | A separate hook allows only read-only Git subcommands. | source: `docs/sessions/evidence/task943/design/sources/.claude__hooks__block-mutating-git.ps1.txt:13-13`; observed: `$readOnlyGitSubcommands = @(` |
| C23 | FACT | Task 941 leaves write programs without a write word out of its scope. | source: `docs/sessions/evidence/task943/design/sources/tasks__Sprints__Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.md.txt:101-101`; observed: `widening detection to write programs` |
| C24 | FACT | Task 941 keeps today's result for every command it does not classify read-only. | source: `docs/sessions/evidence/task943/design/sources/tasks__Sprints__Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.md.txt:116-116`; observed: `returns exactly what the current function returns` |
| C25 | FACT | A Task 941 case asserts that equality for unparseable commands. | source: `docs/sessions/evidence/task943/design/sources/tasks__Sprints__Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.md.txt:125-125`; observed: `equal to the result of the pre-change function` |
| C26 | FACT | The Task 941 cases live in its own selftest file. | source: `docs/sessions/evidence/task943/design/sources/tasks__Sprints__Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json.txt:44-44`; observed: `"testFile": "scripts/workflow-gates/shell-write.selftest.mjs",` |
| C27 | FACT | Task 941 is planned and not yet implemented. | source: `docs/sessions/evidence/task943/design/sources/tasks__Sprints__Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json.txt:3-3`; observed: `"stage": "planned",` |
| C28 | FACT | The reviewed Task 935 contract scopes the hook file. | source: `docs/sessions/evidence/task943/design/sources/tasks__Archive__Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json.txt:49-49`; observed: `"scripts/workflow-gates/security-hook.mjs",` |
| C29 | FACT | The reviewed Task 935 contract scopes the publication manifest. | source: `docs/sessions/evidence/task943/design/sources/tasks__Archive__Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json.txt:47-47`; observed: `"scripts/workflow-gates/publication.json",` |
| C30 | FACT | The reviewed Task 940 contract scopes the hook file. | source: `docs/sessions/evidence/task943/design/sources/tasks__Archive__Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json.txt:15-15`; observed: `"scripts/workflow-gates/security-hook.mjs",` |
| C31 | FACT | The reviewed Task 940 contract scopes the publication manifest. | source: `docs/sessions/evidence/task943/design/sources/tasks__Archive__Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json.txt:17-17`; observed: `"scripts/workflow-gates/publication.json",` |
| C32 | FACT | The Task 941 contract scopes the hook file. | source: `docs/sessions/evidence/task943/design/sources/tasks__Sprints__Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json.txt:10-10`; observed: `"scripts/workflow-gates/security-hook.mjs",` |
| C33 | FACT | The Task 941 contract scopes the publication manifest. | source: `docs/sessions/evidence/task943/design/sources/tasks__Sprints__Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json.txt:12-12`; observed: `"scripts/workflow-gates/publication.json",` |
| C34 | FACT | The design was made on HEAD 01b8259fa. | source: `docs/sessions/evidence/task943/design/p00-head.txt:1-1`; observed: `01b8259fa7e118e0990928fbbc2a5281b9447c14` |
| C35 | FACT | The publication manifest lists each self-test file by path. | source: `docs/sessions/evidence/task943/design/sources/scripts__workflow-gates__publication.json.txt:74-74`; observed: `"scripts/workflow-gates/scope-rebase.selftest.mjs",` |
| C36 | FACT | Gate scripts are policy paths. | source: `docs/sessions/evidence/task943/design/sources/scripts__workflow-gates__contract.mjs.txt:78-78`; observed: `export const isPolicyPath = file =>` |
| D1 | OWNER DECISION | Governance tasks are implemented by Opus in a separate session. | owner: 2026-11-01; decision: `Opus, a separate session (Recommended)` |
| D2 | OWNER DECISION | Approval independence is enforced by the hook. | owner: 2026-11-01; decision: `Yes, the hook blocks (Recommended)` |
| D7 | OWNER DECISION | Every CI fix is committed on task/935-governance-approval-route and published in PR #12, merged once all checks are green. | owner: 2026-11-01; decision: `Everything in PR #12 (Recommended)` |
| D9 | OWNER DECISION | A later independently reviewed contract may rebase a pinned reviewed contract when the changed files are in its scope but are not tests of its cases, with its cases rerun green. | owner: 2026-11-01; decision: `Governance task: audited rebase (Recommended)` |
| D11 | OWNER DECISION | The hook must also detect writes by cp, mv, tee, sed -i and similar commands, as its own task. | owner: 2026-11-01; decision: `I want to close this hole too, write the kickoff` |
| C37 | FACT | A scope rebase refuses every case test of the rebased contract. | source: `docs/sessions/evidence/task943/design/sources/b85f5a66b__scripts__workflow-gates__contract.mjs.txt:158-158`; observed: `case tests are never rebased` (revision 4: the snapshot at `b85f5a66b`, before the 943 implementation moved the line) |
| C38 | FACT | The CI diff check reruns the mapped cases of every touched product contract. | source: `docs/sessions/evidence/task943/design/sources/b85f5a66b__scripts__workflow-gates__cli.mjs.txt:283-283`; observed: `errors.push(...runMappedTests(ROOT, contract));` (revision 4: the snapshot at `b85f5a66b`, before the 943 implementation moved the line) |
| C39 | FACT | Task 931 revision 3 changes 19 case tests of reviewed contracts other than 931 (executed probe). | source: `docs/sessions/evidence/task931/design/d08-rev3-contract-impact.txt:42-42`; observed: `reviewed contracts other than 931 with a changed case test: 19` |
| C40 | FACT | With the libuv thread pool busy, one cold WebCrypto digest takes 207118 event-loop turns against the 500-turn wait of the Google tests (executed probe). | source: `docs/sessions/evidence/task931/design/d06-digest-turn-budget.txt:5-5`; observed: `cold digest: 207118 turns` |
| C41 | FACT | PR #12 CI on head 2693c6b9a fails two tests of googlePopup.test.ts after Task 931 was approved. | source: `docs/sessions/evidence/task931/design/d06-digest-turn-budget.txt:9-9`; observed: `googlePopup.test.ts 2 failed` |
| C42 | FACT | The contract list of the hook walks the disk, so an untracked contract is included. | source: `scripts/workflow-gates/cli.mjs:34-34`; observed: `readdirSync(join(root, dir), { withFileTypes: true })` |
| C43 | FACT | An exempting rules entry must name an evidence path (Task 935 note N1, closed by Task 940 R5). | source: `docs/sessions/evidence/task943/design/sources/db04c936f__scripts__workflow-gates__security-hook.mjs.txt:251-251`; observed: `!isEvidencePath(entry.evidence)) continue;` (revision 2: the snapshot at `db04c936f`, as Task 941 moved the line) |
| C44 | FACT | The closure rule allows approval with notes and names no destination for them. | source: `.claude/rules/review/03-decision-closure.md:34-34`; observed: `only P3/notes remain` |
| C45 | FACT | The closure rule holds the scope-rebase paragraph of owner decision D9. | source: `docs/sessions/evidence/task943/design/sources/b85f5a66b__.claude__rules__review__03-decision-closure.md.txt:67-67`; observed: `Scope rebase (owner D9, Task 940)` (revision 4: the snapshot at `b85f5a66b`, before the 943 implementation moved the line) |
| C46 | FACT | The Task 940 hook self-tests build their fixture root in a plain temporary folder, not a Git repository. | source: `scripts/workflow-gates/scope-rebase.selftest.mjs:33-33`; observed: `const root = mkdtempSync(join(tmpdir(), prefix));` |
| C47 | FACT | Git separates a tracked contract, an untracked one and a folder outside any repository (executed probe). | source: `docs/sessions/evidence/task943/design/p06-git-worktree-probe.txt:10-10`; observed: `exists on disk, but not in 'HEAD'` |
| C48 | FACT | A static testName match is infeasible: most reviewed testNames carry describe titles before the case ID (executed probe). | source: `docs/sessions/evidence/task943/design/p08-testname-literal-probe.txt:3-3`; observed: `cases 231; literal ok 45; misses 186` |
| C49 | FACT | The mapped-case rerun requires the exact full Vitest name. | source: `docs/sessions/evidence/task943/design/sources/b85f5a66b__scripts__workflow-gates__cli.mjs.txt:240-240`; observed: `a.file === row.testFile && a.fullName === row.testName` (revision 4: the snapshot at `b85f5a66b`, before the 943 implementation moved the line) |
| C50 | FACT | The CI diff selects every contract whose file changed. | source: `docs/sessions/evidence/task943/design/sources/b85f5a66b__scripts__workflow-gates__cli.mjs.txt:113-113`; observed: `paths.filter(p => files.includes(p)` (revision 4: the snapshot at `b85f5a66b`, before the 943 implementation moved the line) |
| C51 | FACT | Integration cases run only with the approved development project identity. | source: `docs/sessions/evidence/task943/design/sources/b85f5a66b__scripts__workflow-gates__cli.mjs.txt:198-198`; observed: `if (environment.SECURITY_TEST_TARGET !== 'development'` (revision 4: the snapshot at `b85f5a66b`, before the 943 implementation moved the line) |
| C52 | FACT | The CI diff anchor check of rebase entries reads only rules and scope file lists. | source: `docs/sessions/evidence/task943/design/sources/b85f5a66b__scripts__workflow-gates__cli.mjs.txt:83-83`; observed: `(kind === 'rules' ? rebaseFiles : scopeRebaseFiles)` (revision 4: the snapshot at `b85f5a66b`, before the 943 implementation moved the line) |
| C53 | FACT | The reviewed Task 935 and Task 940 contracts scope `cli.mjs`. | source: `tasks/Archive/Sprint_92_kickoff_prompt_Task_940_Reviewed_Contracts_Rebase_After_Scope_Changes.security.json:14-14`; observed: `"scripts/workflow-gates/cli.mjs",` (the 935 contract has the same line 14) |
| C54 | FACT | Two reviewed contracts are stale with no rebase entry (executed probe). | source: `docs/sessions/evidence/task931/design/d12-reviewed-digest-freshness.txt:4-4`; observed: `owner_fixes.security.json [product] rebases 0; review current false; review errors ["review scope hash is stale"]` |
| C55 | FACT | They went stale through shared rule files changed on the PR #12 branch (executed probe). | source: `docs/sessions/evidence/task931/design/d13-stale-cause.txt:5-6`; observed: `23206fb7f governance: PR-only main, push-handoff guard and CI status tooling` |
| C56 | FACT | The digest with the base bytes of the six rule files equals each recorded review digest (executed probe). | source: `docs/sessions/evidence/task931/design/d14-rules-rebase-feasibility.txt:4-4`; observed: `MATCH true` |
| C57 | FACT | Only CI runs the diff command; no self-test calls it. | source: `.github/workflows/governance-pr.yml:191-191`; observed: `"run": "node scripts/workflow-gates/cli.mjs diff --phase release",` |
| C58 | FACT | The reviewed Task 935 contract scopes the task-design publication phase file. | source: `tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json:24-24`; observed: `".claude/rules/create/03-publication.md",` |
| C59 | FACT | `allContracts` lists only contract files present in the working tree, and `validateDiff` selects only from that list, so a contract deleted by a diff is never validated. | source: `scripts/workflow-gates/cli.mjs:31-37`; observed: `return readdirSync(join(root, dir), { withFileTypes: true }).flatMap(e => e.isDirectory()` |
| C60 | FACT | In Git Bash a redirection glob writes the one file it matches (executed). | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:2-2`; observed: `D/hook.mjs=changed; D/LongFileName.mjs=old` |
| C61 | FACT | In Windows PowerShell 5.1 a redirection glob writes the one file it matches (executed). | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:3-3`; observed: `D/hook.mjs=changed; D/LongFileName.mjs=old` |
| C62 | FACT | The hook reports a glob redirection target only as spelled. | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:4-4`; observed: `targets=["scripts/workflow-gates/security-hoo?.mjs"]` |
| C63 | FACT | Node 22.22.3 `fs.globSync` expands that pattern to the hook file. | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:5-5`; observed: `= ["scripts/workflow-gates/security-hook.mjs"]` |
| C64 | FACT | In Git Bash `cd D; cat Y > hook.mjs` writes D/hook.mjs (executed). | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:6-6`; observed: `D/hook.mjs=changed; D/LongFileName.mjs=old` |
| C65 | FACT | In PowerShell `Push-Location D; Set-Content hook.mjs x` writes D/hook.mjs (executed). | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:9-9`; observed: `D/hook.mjs=changed; D/LongFileName.mjs=old` |
| C66 | FACT | The hook resolves a target after `cd` against the project root. | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:11-11`; observed: `targets=["security-hook.mjs"]` |
| C67 | FACT | The hook reports nothing for `Push-Location` followed by `Set-Content` of a bare file name. | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:12-12`; observed: `targets=[]` |
| C68 | FACT | The independence check ignores the shell folder recorded in a transcript entry. | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:13-13`; observed: `errors=0` |
| C69 | FACT | A transcript `tool_use` entry records the folder its call starts in, the one an earlier call left. | source: `docs/sessions/evidence/task943/design/p10-transcript-cwd.txt:3-3`; observed: `cwd=<root>/docs/sessions/evidence/task941/review-2` |
| C70 | FACT | In Git Bash a redirection to an 8.3 short name writes the long file (executed). | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:16-16`; observed: `D/hook.mjs=old; D/LongFileName.mjs=changed` |
| C71 | FACT | In PowerShell a redirection to an 8.3 short name writes the long file (executed). | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:17-17`; observed: `D/hook.mjs=old; D/LongFileName.mjs=changed` |
| C72 | FACT | The project folder has 8.3 short names for the hook file and its folder. | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:18-18`; observed: `security-hook.mjs=SECURI~2.MJS; workflow-gates=WORKFL~1` |
| C73 | FACT | `realpathSync` keeps a short name; `realpathSync.native` returns the long name. | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:19-19`; observed: `realpathSync="scripts/workflow-gates/SECURI~2.MJS"` |
| C74 | FACT | A Write tool call to a short spelling of the scoped hook file yields no independence error. | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:23-23`; observed: `errors=0` |
| C75 | FACT | PowerShell writes the file without the trailing dots and spaces of the last segment (executed). | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:26-26`; observed: `D/hook.mjs=changed; D/LongFileName.mjs=old` |
| C76 | FACT | PowerShell writes through a folder spelled with one trailing dot (executed). | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:27-27`; observed: `D/hook.mjs=changed; D/LongFileName.mjs=old` |
| C77 | FACT | Git Bash creates a separate file whose name keeps the trailing dot (executed). | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:28-28`; observed: `D=["hook.mjs","hook.mjs.","LongFileName.mjs"]` |
| C78 | FACT | The hook reports a trailing-dot target as spelled. | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:29-29`; observed: `targets=["scripts/workflow-gates/security-hook.mjs."]` |
| C79 | FACT | An executor `Set-Content package.json x` reports no target and no refusal. | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:32-32`; observed: `executor PreToolUse=[]` |
| C80 | FACT | An executor `node -e` with `writeFileSync('package.json', …)` reports no target and no refusal. | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:36-36`; observed: `executor PreToolUse=[]` |
| C81 | FACT | The control redirection into `package.json` is refused without a task contract. | source: `docs/sessions/evidence/task943/design/p09-target-spelling-probe.txt:38-38`; observed: `executor PreToolUse=["SECURITY TEST CONTRACT MISSING"]` |
| C82 | FACT | The write-word path pattern needs one of the listed folder prefixes. | source: `docs/sessions/evidence/task943/design/sources/db04c936f__scripts__workflow-gates__security-hook.mjs.txt:214-214`; observed: `const PROJECT_FILE = /(?:src` |
| C83 | FACT | `projectPath` resolves the root and the existing ancestor with `realpathSync`. | source: `docs/sessions/evidence/task943/design/sources/db04c936f__scripts__workflow-gates__security-hook.mjs.txt:92-92`; observed: `return relative(realpathSync(root), join(realpathSync(ancestor), ...tail))` |
| C84 | FACT | The independence check takes Write and Edit paths through `projectPath`. | source: `docs/sessions/evidence/task943/design/sources/db04c936f__scripts__workflow-gates__security-hook.mjs.txt:242-242`; observed: `calls.filter(call => ['Write', 'Edit'].includes(call.name)).map(call => projectPath(root,` |
| C85 | FACT | A gate script already reads the hook event's `cwd`. | source: `scripts/workflow-gates/push-safety.mjs:182-182`; observed: `event.cwd` |
| C86 | FACT | CI runs the gates on Node 22.22.3. | source: `.github/workflows/governance-pr.yml:68-68`; observed: `"node-version": "22.22.3"` |
| C87 | FACT | A Git Bash redirection to the MSYS absolute spelling `/c/…` of a scope file writes it and passes the independence check (executed). | source: `docs/sessions/evidence/task943/design/p11-absolute-spelling-probe.txt:3-3`; observed: `independence errors=0` |
| C88 | FACT | A redirection through the 8.3 alias of the root folder in an absolute path writes the scope file; the hook reports a path outside the root (executed). | source: `docs/sessions/evidence/task943/design/p11-absolute-spelling-probe.txt:4-4`; observed: `targets=["../LONGFI~1/D/hook.mjs"]` |
| C89 | FACT | A Write tool call through the 8.3 alias of the root folder passes the independence check. | source: `docs/sessions/evidence/task943/design/p11-absolute-spelling-probe.txt:5-5`; observed: `independence errors=0` |
| C90 | FACT | A redirection through a junction to a project folder writes the scope file; the hook reports the junction path (executed). | source: `docs/sessions/evidence/task943/design/p11-absolute-spelling-probe.txt:6-6`; observed: `targets=["../j/hook.mjs"]` |
| C91 | FACT | A redirection with the `\\.\` device prefix writes the scope file unreported (executed). | source: `docs/sessions/evidence/task943/design/p11-absolute-spelling-probe.txt:7-7`; observed: `targets=["//./<tmp>/LongFixtureRootName/D/hook.mjs"]` |
| C92 | FACT | A redirection with the `\\?\` prefix writes the scope file and passes the independence check (executed). | source: `docs/sessions/evidence/task943/design/p11-absolute-spelling-probe.txt:8-8`; observed: `independence errors=0` |
| C93 | FACT | A redirection through the local administrative share `\\localhost\C$` writes the scope file and passes the independence check (executed). | source: `docs/sessions/evidence/task943/design/p11-absolute-spelling-probe.txt:9-9`; observed: `independence errors=0` |
| C94 | FACT | A `cd` inside `bash -c` moves the target; the hook keeps the closing quote in it (executed). | source: `docs/sessions/evidence/task943/design/p11-absolute-spelling-probe.txt:10-10`; observed: `targets=["hook.mjs'"]` |
| C95 | FACT | A `cd` inside `cmd /c` moves the target; the hook keeps the closing quote in it (executed). | source: `docs/sessions/evidence/task943/design/p11-absolute-spelling-probe.txt:11-11`; observed: `targets=["hook.mjs\""]` |
| C96 | FACT | `process.chdir` in `node -e` before `writeFileSync` of a bare name writes the scope file with no target reported (executed). | source: `docs/sessions/evidence/task943/design/p11-absolute-spelling-probe.txt:12-12`; observed: `targets=[]` |
| C97 | FACT | `hook.mjs` has no 8.3 alias, while a long file name and a long folder name have one. | source: `docs/sessions/evidence/task943/design/p11-absolute-spelling-probe.txt:2-2`; observed: `hook.mjs=null; LongScopeFileName.mjs=LONGSC~1.MJS` |
| C98 | FACT | An executor redirection into the MSYS spelling of the real project's `package.json` is not refused. | source: `docs/sessions/evidence/task943/design/p11-absolute-spelling-probe.txt:13-13`; observed: `PreToolUse=[]` |
| C99 | FACT | An executor redirection into the hook file through the 8.3 alias of the real project's parent folder is not refused. | source: `docs/sessions/evidence/task943/design/p11-absolute-spelling-probe.txt:14-14`; observed: `PreToolUse=[]` |
| C100 | FACT | An existing self-test requires a Write on a missing drive to stay outside the project. | source: `scripts/workflow-gates/diff-hook.selftest.mjs:466-466`; observed: `/outside the project/` |
| C101 | FACT | A prototype of R12 on a copy of the hook reports the scope file for the nested-shell folder change (executed). | source: `docs/sessions/evidence/task943/design/p12-run.txt:11-11`; observed: `PASS AC13 reports X: bash -c 'cd D; cat ../Y > hook.mjs'` |
| C102 | FACT | The five self-test files that import the hook pass unchanged against the prototype (executed). | source: `docs/sessions/evidence/task943/design/p12-run.txt:34-38`; observed: `unchanged against the prototype` |
| C103 | FACT | On a frozen corpus of 2318 session commands (sha256 in line 39) the prototype adds targets for 68 commands (executed). | source: `docs/sessions/evidence/task943/design/p12-run.txt:40-40`; observed: `commands with added targets 68` |
| C104 | FACT | The prototype refuses 1 executor command that the hook allows today (executed). | source: `docs/sessions/evidence/task943/design/p12-run.txt:69-69`; observed: `commands allowed today and refused by the prototype 1` |
| C105 | FACT | The prototype adds a governance scope file for 1 session command (executed). | source: `docs/sessions/evidence/task943/design/p12-run.txt:71-71`; observed: `commands whose added targets are governance scope files 1` |
| C106 | FACT | Every AC13 and audit form check of the prototype passes (executed). | source: `docs/sessions/evidence/task943/design/p12-run.txt:73-73`; observed: `FAILURES 0` |
| C107 | FACT | The Claude Code hooks reference defines the hook input `cwd` as the working directory when the hook runs, following `cd`. | source: `docs/sessions/evidence/task943/design/p13-hook-cwd-doc.txt:4-4`; observed: `Current working directory when the hook is invoked` |
| C108 | FACT | In Git Bash the noclobber-override redirection (a greater-than sign and a pipe sign) writes the word after it (executed). | source: `docs/sessions/evidence/task943/design/p14-noclobber-run.txt:2-2`; observed: `files=["Y","out","s/Y"]` |
| C109 | FACT | It also writes with a space before the word, with a `2` stream prefix and with a quoted word (executed). | source: `docs/sessions/evidence/task943/design/p14-noclobber-run.txt:3-5`; observed: `files=["Y","err","s/Y"]` |
| C110 | FACT | After `cd s` the noclobber-override target is written in `s` (executed). | source: `docs/sessions/evidence/task943/design/p14-noclobber-run.txt:6-6`; observed: `files=["Y","s/Y","s/out"]` |
| C111 | FACT | A quoted noclobber-override operator inside a grep pattern writes nothing (executed control). | source: `docs/sessions/evidence/task943/design/p14-noclobber-run.txt:8-8`; observed: `files=["Y","s/Y"]` |
| C112 | FACT | Inside `.git` a noclobber-override redirection to `head` overwrites `.git/HEAD` on the case-insensitive file system (executed). | source: `docs/sessions/evidence/task941/review/r3-probe.txt:6-6`; observed: `files="1\n"` |
| C113 | FACT | The hook at Task 941 revision 2 reports no target for an `echo` noclobber-override redirection into the hook file (executed). | source: `docs/sessions/evidence/task943/design/p14-noclobber-run.txt:16-16`; observed: `current=[]` |
| C114 | FACT | With the noclobber-override target spelled as a read-only program name, the 941 classifier makes the command read-only with no target (executed). | source: `docs/sessions/evidence/task943/design/p14-noclobber-run.txt:9-9`; observed: `readOnly=true` |
| C115 | FACT | Neither the pre-941 nor the 941 revision 2 pre-write guard refuses an executor noclobber-override redirection into `src/profile.ts` (executed). | source: `docs/sessions/evidence/task941/review/r3-probe.txt:9-9`; observed: `before941=[]` |
| C116 | FACT | The prototype rule reports the `.git/HEAD` target of a noclobber-override redirection (executed). | source: `docs/sessions/evidence/task943/design/p14-noclobber-run.txt:18-18`; observed: `prototype=[".git/HEAD"]` |
| C117 | FACT | The prototype adds nothing for a quoted noclobber-override operator in a read-only grep (executed control). | source: `docs/sessions/evidence/task943/design/p14-noclobber-run.txt:19-19`; observed: `prototype=[]` |
| C118 | FACT | As `>` targets, the prototype's paths get the existing refusals of the pre-write guard (executed). | source: `docs/sessions/evidence/task943/design/p14-noclobber-run.txt:22-23`; observed: `OWNER GIT REQUIRED: agents cannot write Git metadata` |
| C119 | FACT | Over the frozen 2318-command corpus (the C103 sha256) the prototype changes 2 commands, none with a guarded target (executed). | source: `docs/sessions/evidence/task943/design/p14-noclobber-run.txt:24-24`; observed: `of them with an added policy, product, tasks, docs or .git target 0` |
| C120 | FACT | No existing gate self-test file contains the noclobber-override operator (executed scan). | source: `docs/sessions/evidence/task943/design/p14-noclobber-run.txt:27-27`; observed: `files containing the noclobber operator: []` |
| C121 | FACT | The revision 2 R12 prototype ((a)–(f), run on the db04c936f hook it was written for) reports no target for the AC13 noclobber-override forms (executed). | source: `docs/sessions/evidence/task943/design/p14-noclobber-run.txt:28-31`; observed: `p12 as written=[]` |
| C122 | FACT | With the noclobber-override word taken as a W1 target of its simple command, R12 (c) of that prototype resolves it against the changed folder (executed). | source: `docs/sessions/evidence/task943/design/p14-noclobber-run.txt:28-28`; observed: `=["hook.mjs","D/hook.mjs"]` |
| C123 | FACT | On the revision 3 candidate one gate self-test fails: the Task 941 malformed-command case (executed). | source: `docs/sessions/evidence/task943/review/r1-selftests.txt:1046-1046`; observed: `not ok 174 - [GOV-941-HOOK-MALFORMED-ERROR]` |
| C124 | FACT | The failing assertion is the in-place file positional `writeFileSync` that the candidate adds to a parseable `sed -i` command (executed). | source: `docs/sessions/evidence/task943/review/r1-selftests.txt:1051-1058`; observed: `+   'writeFileSync'` |
| C125 | FACT | A Task 941 equality loop holds the parseable `sed -i` command with a second file positional. | source: `scripts/workflow-gates/shell-write.selftest.mjs:123-123`; observed: `sed -i 's/a/b/' ${X} writeFileSync` |
| C126 | FACT | A second Task 941 equality loop holds `sed -n 1p -i` with a second file positional. | source: `scripts/workflow-gates/shell-write.selftest.mjs:158-158`; observed: `sed -n 1p -i>o.txt ${X} writeFileSync` |
| C127 | FACT | The reviewed Task 941 contract scopes its test file. | source: `tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json:14-14`; observed: `"scripts/workflow-gates/shell-write.selftest.mjs",` |
| C128 | FACT | The candidate guard allows an executor Write of a relative policy path in a `cwd` below the root (executed). | source: `docs/sessions/evidence/task943/review/r1-f2-probe.txt:4-4`; observed: `Write relative, cwd scripts: []` |
| C129 | FACT | The candidate reports no target for a section 5 program inside `bash -c` (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:3-3`; observed: `PASS R13 deny form missed by the candidate: bash -c 'cp docs/y.mjs scripts/workflow-gates/fixture-scope.mjs'` |
| C130 | FACT | The candidate reports no target for a cmdlet inside `powershell -Command` (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:11-11`; observed: `PASS R13 deny form missed by the candidate: powershell -Command "Copy-Item` |
| C131 | FACT | The candidate reports no target after the runner `timeout` (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:33-33`; observed: `PASS R13 deny form missed by the candidate: timeout 5 rm` |
| C132 | FACT | The candidate reports no target for a path-less `Remove-Item` fed by a pipeline (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:51-51`; observed: `PASS R13 deny form missed by the candidate: Get-ChildItem scripts/workflow-gates` |
| C133 | FACT | The candidate reports no target for a parser-rejected `sed` with a quoted in-place option (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:45-45`; observed: `PASS R13 deny form missed by the candidate: sed "-i"` |
| C134 | FACT | The revision 4 prototype reports the scope file of a nested-shell copy and the executor guard refuses it (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:2-2`; observed: `PASS R13 deny reports X and the executor guard refuses: bash -c 'cp` |
| C135 | FACT | The prototype reports no scope file when a nested shell copies it elsewhere (executed control). | source: `docs/sessions/evidence/task943/design/p15-run.txt:67-67`; observed: `PASS R13 control reports no X: bash -c 'cp scripts/workflow-gates/fixture-scope.mjs docs/elsewhere/z.mjs'` |
| C136 | FACT | The prototype guard refuses the relative executor Write in a `cwd` below the root (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:78-78`; observed: `PASS F2 executor Write of a relative path in cwd <root>/scripts is refused` |
| C137 | FACT | `shell-write.selftest.mjs` with only the two K1 assertions changed passes against the candidate hook (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:109-109`; observed: `PASS self-test shell-write.selftest.mjs against the candidate with the K1 change` |
| C138 | FACT | Every gate self-test file that imports the hook passes against the prototype (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:102-108`; observed: `against the prototype (# pass` |
| C139 | FACT | Over the frozen corpus (the C103 sha256) the prototype adds targets for 67 commands, 30 with a guarded target (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:112-112`; observed: `commands with added targets 67; with an added guarded target 30` |
| C140 | FACT | The prototype refuses 6 executor corpus commands that the candidate allows, five of them `npm install` after a folder change outside the root, which the root resolution of R12 also reads at the root (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:139-139`; observed: `the prototype refuses 6` |
| C141 | FACT | The prototype adds no governance scope file for any corpus command (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:146-146`; observed: `governance scope files 0` |
| C142 | FACT | Every check of the revision 4 feasibility run passes (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:149-149`; observed: `FAILURES 0` |
| C143 | FACT | A path held in a pipeline variable of a script block is reported by the prototype only as its variable text, never as the files it holds (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:66-66`; observed: `out of scope, prototype targets for ForEach-Object with $_: ["$_.FullName"]` |
| C144 | FACT | An independent sub-review of the revision 3 candidate lists eight findings F1-F8, the first a parser-rejected command losing W2. | source: `docs/sessions/evidence/task943/impl/completion-report.md:142-149`; observed: `A parser-rejected command loses W2` |
| C145 | FACT | The prototype refuses an executor `Set-Content package.json $x` (sub-review F1, executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:83-83`; observed: `PASS F1 executor Set-Content package.json $x is refused` |
| C146 | FACT | The prototype reports the files under the folder of `find … -exec sed -i … {} +` (sub-review F2, executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:87-87`; observed: `PASS F2 reports X: find scripts/workflow-gates -name '*.mjs' -exec sed -i 's/a/b/' {} +` |
| C147 | FACT | The prototype refuses an executor cmd command that changes to the absolute scripts folder with cd and its /d option before a relative redirection (sub-review F3, executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:91-91`; observed: `PASS F3 executor cmd /d /c "cd /d <abs>/scripts && echo x > check-example.mjs" is refused` |
| C148 | FACT | The prototype expands a glob of a parser-rejected `sed -i` (sub-review F4, executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:93-93`; observed: `PASS F4 reports X: sed -i "s/a/$x/" scripts/workflow-gates/*.mjs` |
| C149 | FACT | Without a role on the real root, the prototype evaluates `rm -rf docs` and `cp -r docs backup/` within 5 s (sub-review F5, executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:98-99`; observed: `PASS F5 evaluateHook without a role on the real root:` |
| C150 | FACT | The prototype allows an executor `node -e` that only calls the string method `replace` (sub-review F7, executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:95-95`; observed: `PASS F7 control: executor node -e with the string method replace is allowed` |
| C151 | FACT | The prototype still reports literal paths of `shutil.copy` and `require('fs').rm` (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:97-97`; observed: `PASS F7 regression: shutil.copy and fs.rm with literal paths still report X` |
| C152 | FACT | A parser-rejected command of 48901 characters with 5000 folder changes completes within 15 s on the prototype (sub-review F8, executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:101-101`; observed: `PASS F8 parser-rejected command of 48901 characters with 5000 folder changes in` |
| C153 | FACT | The security hook runs with a 15 s timeout whose failure blocks the call. | source: `.claude/settings.json:43-44`; observed: `"onFailure": "block",` |
| C154 | FACT | Over the frozen corpus the prototype keeps every Task 941 target after R12 (a) normalisation (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:147-147`; observed: `does not keep (after R12 (a) normalisation) 0` |
| C155 | FACT | With the pipeline rule also in the lenient reading, a read-only grep chain whose quoted pattern holds a pipe adds files of the whole project root (executed). | source: `docs/sessions/evidence/task943/design/p15-lenient-pipeline-noise.txt:5-5`; observed: `.artifacts/actionrow_fail.txt` |
| C156 | FACT | On a copy of the tracked tree, a `scope` entry and then a `tests` entry by a reviewed 943 contract keep the 941 chain, review and report digests valid with the K1 change (executed). | source: `docs/sessions/evidence/task943/review/r1-r6-chain.txt:3-6`; observed: `rebaseChainErrors with scope then tests entry: []` |
| C157 | FACT | A single `scope` entry that lists the 941 test file is refused (executed control). | source: `docs/sessions/evidence/task943/review/r1-r6-chain.txt:7-7`; observed: `case tests are never rebased` |
| C158 | FACT | The prototype refuses an executor nested shell whose quoted text holds `$`, a folder change and `rm` (executed). | source: `docs/sessions/evidence/task943/review/r1-audit2-probe.txt:3-3`; observed: `REFUSED :: bash -c "cd scripts; rm check-example.mjs; echo $y"` |
| C159 | FACT | The candidate allows that command (executed). | source: `docs/sessions/evidence/task943/review/r1-audit2-candidate.txt:3-3`; observed: `ALLOWED :: bash -c "cd scripts; rm check-example.mjs; echo $y"` |
| C160 | FACT | The prototype refuses a write inside an `Invoke-Command` script block (executed). | source: `docs/sessions/evidence/task943/review/r1-audit2-probe.txt:11-11`; observed: `REFUSED :: Invoke-Command -ScriptBlock { Remove-Item package.json }` |
| C161 | FACT | The candidate allows that command (executed). | source: `docs/sessions/evidence/task943/review/r1-audit2-candidate.txt:11-11`; observed: `ALLOWED :: Invoke-Command -ScriptBlock { Remove-Item package.json }` |
| C162 | FACT | The candidate allows formatters, package managers, archivers and `Export-Csv` that write project files (executed). | source: `docs/sessions/evidence/task943/review/r1-audit2-candidate.txt:16-22`; observed: `ALLOWED :: npx prettier --write scripts/check-example.mjs` |
| C163 | FACT | The prototype refuses each of them (executed). | source: `docs/sessions/evidence/task943/review/r1-audit2-probe.txt:16-22`; observed: `REFUSED :: npx prettier --write scripts/check-example.mjs` |
| C164 | FACT | Their read-only forms stay allowed on the prototype (executed controls). | source: `docs/sessions/evidence/task943/review/r1-audit2-probe.txt:34-43`; observed: `ALLOWED :: npx prettier --check scripts/check-example.mjs` |
| C165 | FACT | A quoted `*` in a sed script of a parser-rejected command is no glob of the project root (executed control). | source: `docs/sessions/evidence/task943/review/r1-audit2-probe.txt:32-32`; observed: `ALLOWED :: sed -i "s#import * as R#x#" docs/y.mjs; echo $y` |
| C166 | FACT | A quoted path with brackets in a parser-rejected command is a literal target (executed). | source: `docs/sessions/evidence/task943/review/r1-audit2-probe.txt:31-31`; observed: `REFUSED :: rm "src/app/[locale]/page.tsx" $y` |
| C167 | FACT | `npm install` with an absolute `--prefix` outside the root stays allowed (executed control). | source: `docs/sessions/evidence/task943/review/r1-audit2-probe.txt:33-33`; observed: `ALLOWED :: npm install left-pad --prefix` |
| C168 | FACT | A newly refused corpus command is an `npm install` after a folder change into a scratch folder (executed). | source: `docs/sessions/evidence/task943/design/p15-run.txt:144-144`; observed: `npm in` |
| C169 | FACT | The prototype refuses downloads into a project file, a remote copy to a local policy file, `npm pkg set`, `npm version` and child-process command strings of `node -e` and `python -c` (executed). | source: `docs/sessions/evidence/task943/review/r1-audit2-probe.txt:23-30`; observed: `REFUSED :: curl -sSL -o package.json https://example.test/x` |
| C170 | FACT | The candidate allows each of them (executed). | source: `docs/sessions/evidence/task943/review/r1-audit2-candidate.txt:23-30`; observed: `ALLOWED :: curl -sSL -o package.json https://example.test/x` |
| D14 | OWNER DECISION | Dependent kickoff work found in a session is done in that session, never left for a later one, as a mandatory rule. | owner: 2026-11-02; decision: `This must be done immediately, because in the next session nobody will remember it. Write it into your mandatory rules so you never forget such points and never skip them!` |
| D12 | OWNER DECISION | D9 is extended: a later independently reviewed contract may rebase a changed case test of a reviewed contract when every case ID and test name are kept, the cases pass in CI, and the approver states each changed assertion; implemented in Task 943 before Task 931. | owner: 2026-11-02; decision: `Extend D9 (Recommended)` |
| D13 | OWNER DECISION | No new task: every found and potential hole is closed inside the current tasks. | owner: 2026-11-02; decision: `no new task, everything within the current task; close every hole already found and every potential one` |

## Mobile adaptation record
- Scope: none

## 4. Scope and out of scope

In scope (the implementer writes exactly these): `scripts/workflow-gates/security-hook.mjs`, new
`scripts/workflow-gates/shell-mutation.selftest.mjs`, its entry in `scripts/workflow-gates/publication.json` (C35), the
stage/implementation/report/sensitivity fields of this task's `.security.json`, and the evidence files
`docs/sessions/evidence/task943/impl/completion-report.md`, `docs/sessions/evidence/task943/impl/governance-report.json`,
`docs/sessions/evidence/task943/impl/base-runs.txt`, `docs/sessions/evidence/task943/impl/probes-after.txt`,
`docs/sessions/evidence/task943/sensitivity/sensitivity.json`, `docs/sessions/evidence/task943/sensitivity/GOV-943-HOOK-PROGRAM-DENY.txt`
and `docs/sessions/evidence/task943/sensitivity/GOV-943-HOOK-PRETOOL-DENY.txt`; revision 1 adds
`scripts/workflow-gates/contract.mjs` and `scripts/workflow-gates/cli.mjs` (R7), new `scripts/workflow-gates/case-test-rebase.selftest.mjs` and its `publication.json`
entry (R10), `.claude/rules/review/03-decision-closure.md` (R7 move, R9), `.claude/rules/create/03-publication.md` (R9 c), new
`.claude/rules/review/04-contract-rebases.md` (R7), and
`docs/sessions/evidence/task943/sensitivity/GOV-943-TESTS-REBASE-DENY.txt`,
`docs/sessions/evidence/task943/sensitivity/GOV-943-EXEMPT-UNTRACKED-DENY.txt`,
`docs/sessions/evidence/task943/sensitivity/GOV-943-CI-STALE-REVIEW-DENY.txt`; R8 edits `security-hook.mjs` and R11 `cli.mjs`, both
already in scope; revision 2 adds `docs/sessions/evidence/task943/sensitivity/GOV-943-HOOK-TARGET-SPELLING-DENY.txt`, and R12 edits
`security-hook.mjs` and adds its case to `shell-mutation.selftest.mjs`; revision 4 adds
`scripts/workflow-gates/shell-write.selftest.mjs` (only the expected value of the two R1 commands, C125–C127) and
`docs/sessions/evidence/task943/sensitivity/GOV-943-HOOK-NESTED-DENY.txt`, and R13 and R14 edit `security-hook.mjs` and R13 adds its
case to `shell-mutation.selftest.mjs`.
Written by the approver only (R6): `scope` entries in the `review.rebases` of the 935, 940 and 941 contracts with evidence
`docs/sessions/evidence/task943/review/scope-rebase-935.md`, `…/scope-rebase-940.md` and `…/scope-rebase-941.md`; a `tests` entry
in the 941 contract with evidence `…/tests-rebase-941.md`; `rules` entries
by the 935 contract in the 923 owner-fixes and 927 contracts with evidence `…/rules-rebase-923-owner-fixes.md` and
`…/rules-rebase-927.md`.

Out of scope: product code; every existing self-test file and every other expected value, command, case ID and test name of
Task 941's `shell-write.selftest.mjs` (C26), which must pass with only the expected value of the two R1 commands changed (AC1); `isReadOnlyShellCommand` and its allowlist (941); mutating Git commands, already refused by their own hook (C22); the
PowerShell hooks under `.claude/hooks/`; writes that no command text can reveal: a script file run by an interpreter (`node x.mjs`,
`python x.py`), `perl -i`, editors, and programs not listed in section 5; a folder change whose folder is a variable, `-`, `~`
or `popd`/`Pop-Location` (R12 (c)); a path held in a variable, including the `$_` of a script block (C143), and a
`-EncodedCommand` string. These remain undetected; the completion report lists them. Revision 4 (review 1, third self-audit): the
hook recognizes write forms from a list, so a program or interpreter script outside that list can always write unreported; the
outer layer that holds regardless of the write form is the CI policy-diff check (C20), which refuses a changed policy file outside
every governance scope. A newly found common write form is added to section 5 or R13 by a revision of this task, not by the
implementer.

## 5. Program table

R2 reads each simple command produced by the quote-aware split of Task 941 R1 (b). The program is the first token, compared
case-insensitively; a leading `sudo`, `env`, `command`, `nohup` or `time` is skipped, and (revision 4, R13 (a)) `exec`, `nice`,
`ionice`, `timeout`, `stdbuf`, `builtin` and `doas`, each with its own options and option values (and the duration of
`timeout`). Options are tokens starting with `-` (a
PowerShell named parameter takes the next token as its value); positionals are the remaining tokens, redirection tokens excluded.

| Program (and aliases) | Targets |
|---|---|
| `cp`, `copy`, `cpi`, `Copy-Item`, `install`, `ln` | The destination: the value of `-Destination`, or of `-t`/`--target-directory`, otherwise the last positional. A destination ending in `/` or `\` or naming an existing project directory gives destination + `/` + the name of each source; for a recursive copy (`-r`, `-R`, `-a`, `-Recurse`) of a directory source, every file under that source mapped into the destination. |
| `mv`, `move`, `mi`, `Move-Item` | Every source (`-Path`/`-LiteralPath` values or the positionals before the destination), every file under a directory source, and the destination as for `cp`. |
| `rm`, `del`, `erase`, `ri`, `unlink`, `Remove-Item` | Every positional and `-Path`/`-LiteralPath` value; a directory gives every file under it. |
| `tee`, `Tee-Object` | Every positional and the value of `-FilePath`/`-LiteralPath`. |
| `sed` with an option `-i`, `-i<suffix>` or `--in-place[=…]` | Every file positional: all positionals when `-e`, `-f`, `--expression` or `--file` is present, otherwise all positionals after the first (the script). |
| `touch`, `truncate` | Every positional (for `truncate`, the value of `-s`/`--size` is not a file). |
| `dd` | The value of each `of=` operand. |
| `New-Item`, `ni` | The `-Path`/positional value, joined with `-Name` when present. |
| `Clear-Content`, `clc`, `sc`, `ac`; revision 2 (R12 (e)): `Set-Content`, `Add-Content`, `Out-File` | Every positional and `-Path`/`-LiteralPath`/`-FilePath` value. |
| `Rename-Item`, `ren`, `rni` | The `-Path`/first positional and the sibling named by `-NewName`/second positional. |
| `xargs` followed by any program above, or `find` with `-delete`, `-exec`, `-execdir` or `-ok` | Every project path named in the simple command and every file under each named project directory. |
| Revision 4 (R15): `prettier` with `--write`/`-w`; `eslint` with `--fix`; `npm`, `pnpm`, `yarn`, `bun` with `install`, `i`, `ci`, `add`, `remove`, `uninstall`, `rm`, `un`, `update`, `up`, `upgrade`, `dedupe`, `prune` or `link` (`yarn` alone too), never with `-g`/`--global`; `tar` creating or extracting; `unzip`; `Expand-Archive`, `Compress-Archive`, `Export-Csv`, `Export-Clixml`; third self-audit: `curl`, `wget`, `Invoke-WebRequest`/`iwr`, `Invoke-RestMethod`/`irm`, `scp`, `rsync`, `npm pkg set|delete|fix`, `npm version`; `npx`, `pnpx` and `bunx` are skipped like `sudo` | prettier and eslint: every positional and every file under a named directory (eslint also its `--output-file`); package managers: `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` and `bun.lockb` in the `--prefix`/`-C`/`--dir`/`--cwd` folder, otherwise in the current folder; `tar`: the `-f`/`--file` archive when creating, every file under the `-C`/`--directory` folder (otherwise the current folder) when extracting; `unzip`: every file under the `-d` folder or the current folder; `Expand-Archive`: every file under `-DestinationPath`, the second positional or the current folder; `Compress-Archive`: `-DestinationPath` or the second positional; `Export-*`: `-Path`/`-LiteralPath` or the first positional; `curl`: the `-o`/`--output` file, and with `-O`/`--remote-name` the last URL segment; `wget`: the `-O`/`--output-document` file, otherwise the last URL segment in the `-P`/`--directory-prefix` folder or the current folder; `Invoke-WebRequest`/`Invoke-RestMethod`: `-OutFile`; `scp`/`rsync`: the last positional when it is not a `host:path` word, and destination + `/` + the name of each local source when it is a folder; `npm pkg set|delete|fix`: `package.json`; `npm version`: `package.json` and `package-lock.json` (both in the `--prefix` folder when given). |

"Every file under a directory" walks the project directory recursively but never enters `node_modules/` or `.next/` (generated
trees, reported as the directory path itself); `.git` and anything under it are reported as given, so the existing Git-metadata
refusal of the pre-write guard still applies.

## 5b. Case-test rebase entry (R7, D12)

A `review.rebases` entry `{ kind: 'tests', by, evidence, evidenceSha256, originalScopeSha256, rebasedScopeSha256 }` takes its place
in the same chain as `rules` and `scope` entries (`rebaseChainErrors` unchanged in ordering). Its evidence file under
`docs/sessions/evidence/` has a `## Changed case test files` list (one `- \`path\`` per line, the format of `scopeRebaseFiles`) and a
`## Case assertions` list with one line per affected case, `- <CASE-ID>: <what each changed assertion checked before> -> <after>`.
`testsEntryErrors(root, contract, entry)` returns one named error for each of: the list is empty; a listed file is not the
`testFile` of a case of the rebased contract; a listed file is a runtime file; for a case whose `testFile` is listed, the file text no
longer contains `[<id>]`, or `## Case assertions` has no line for that ID; `by` is the
rebased contract itself, unreadable, not `product`/`governance`, not `reviewed`, or does not scope a listed file; the evidence is not an
evidence path or its hash is stale. A `scope` entry keeps refusing case tests (C37). `testsEntryErrors` does not match the
`testName` text: it is the Vitest full name with describe titles, and source text escapes characters (C48). The exact name is bound
by the rerun instead: writing the entry changes the rebased contract file, which selects that reviewed contract in the CI diff (C50),
and `runMappedTests` requires exactly one passing test whose full name equals `testName` (C38, C49). The approver therefore runs
`node scripts/workflow-gates/cli.mjs verify --contract <rebased contract>` after writing the entry and keeps the entry only when it
exits 0, with the development project identity that `integrationTargetErrors` requires for integration cases
(`SECURITY_TEST_TARGET=development`, `SECURITY_TEST_PROJECT_REF`, `NEXT_PUBLIC_SUPABASE_URL`; C51); `04-contract-rebases.md` states it.

## 6. Current and required behaviour

Preserved: every target reported today stays reported (write words, redirections; C2, C14, C19); `isReadOnlyShellCommand` and the
result for read-only commands (941); the CI policy-diff check (C20); both consumers (C3, C4) unchanged in code apart from the R8 tracked check in the exemption loop, the shell folder of R12 (d)
and (revision 4) the guard's Write/Edit resolution of R12 (d) and the enrollment set of R14 (b). Changed: the files
changed by the commands of section 5 and by the API words of R3 are reported as targets, so the independence check counts them and
the pre-write guard decides on them exactly as on a `Set-Content` write. Revision 2: every target and Write/Edit path is also
reported in the spellings of R12 that reach the same file, and both consumers also resolve relative targets against the shell
folder of the tool call (R12 (d)).

## Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R1 [C24; C25; C27; C120; C123; C124; C125; C126; C127; C137; D12] | **Prerequisite and preservation.** Task 941 is reviewed and committed before the first write. For every command, the new result is a superset of the 941 result; for commands that 941 R1 (a) rejects as unparseable, the result is the 941 result plus, only when a program name of section 5 occurs in the command as a separate word, every project path matched by the existing path pattern of the write-word branch (C2), so the 941 equality case stays green. Revision 2: the R12 additions apply on top, and R12 (a) normalizes both sides of the superset comparison; revision 4: the R13 (c), (e) and (f), R14 and R15 additions also apply on top of that result for a parser-rejected command, and the 941 equality case stays green with them (C138, C154); no hook input of the five self-test files that import the hook (`diff-hook`, `governance-contract`, `scope-rebase`, `session-role`, `shell-write`, 83 tests at `db04c936f`) has an asserted result that R12 (a)–(g) changes ((g): no self-test file contains its operator, C120): each copy run against a proxy of the real hook that records every input meeting an R12 trigger passes, the recorded inputs are absolute fixture paths with long names (unchanged by `realpathSync.native`), the MSYS case asserted with `includes` (C51), the missing-drive case kept by R12 (a) (C100) and quoted text of read-only commands, which (f) does not touch, its positive control records the known forms, and the two tests that spawn the hook send Stop events with neither `cwd` nor an R12 spelling (`docs/sessions/evidence/task941/review-2/r12-scan/run-scan.txt`), and the same five files pass unchanged against the R12 prototype (C102); the 941 revision 2 `cd`/`Set-Location` forms assert inclusion. Revision 4 (C123–C127, C137): R2 reports the second file
positional of the parseable `sed -i 's/a/b/' ${X} writeFileSync` and `sed -n 1p -i>o.txt ${X} writeFileSync`, a file `sed -i`
really edits, so for exactly these two commands the equality assertions of GOV-941-HOOK-MALFORMED-ERROR in
`shell-write.selftest.mjs` expect the pre-change result followed by `writeFileSync`, still with `deepEqual` and the existing
`includes(X)`; no other expected value, command, case ID or test name of that file changes (AC1), and the approver writes the D12
`tests` entry of R6. | P1 | AC1, AC5 |
| R2 [C1; C5; C6; C7; C8; C9; C10; C11; C16; C17; C18; D11] | **Program targets.** For a parseable command that is not read-only, `shellWriteTargets` adds, for each simple command, the targets of section 5, resolved through `projectPath`; targets outside the project stay as `projectPath` resolves them and never match a scope. A missing destination or option value adds nothing and never throws. | P1 | AC1, AC2, AC3, AC5 |
| R3 [C2; C12; C13] | **API words.** The write-word test of C2 also matches `appendFile`, `appendFileSync`, `copyFile`, `copyFileSync`, `cpSync`, `renameSync`, `rmSync`, `unlinkSync`, `truncateSync`, `createWriteStream`, `fs.rename`, `fs.rm`, `fs.unlink`, `fs.truncate`, `fs.cp`, `fs.promises`, `WriteAllText`, `WriteAllLines`, `WriteAllBytes`, `AppendAllText`, `AppendAllLines`, `File]::Copy`, `File]::Move`, `File]::Delete`, `File]::Replace`, `shutil.copy`, `shutil.copyfile`, `shutil.move`, `os.remove`, `os.unlink`, `os.replace`, `os.rename` and `write_bytes`, with the existing path collection unchanged. | P1 | AC4 |
| R4 [C3; C4; C15; C19] | **Consumers.** `governanceIndependenceErrors` and the pre-write guard keep calling `shellWriteTargets`; nothing else in their code changes, except the tracked check that R8 adds to the exemption loop of `governanceIndependenceErrors`, the shell folder of R12 (d) and, revision 4, the pre-write guard's Write/Edit resolution in the event `cwd` (R12 (d)) and the once-per-call enrollment set of `registeredWrites` (R14 (b)). | P1 | AC2, AC3, AC13, AC15 |
| R5 [C20; C21; C26; C35] | **Proof.** The nine GOV-943 cases of AC1–AC6, AC13 and AC14 (revision 2 adds GOV-943-HOOK-TARGET-SPELLING-DENY, revision 4 GOV-943-HOOK-NESTED-DENY) live in the new `scripts/workflow-gates/shell-mutation.selftest.mjs`, listed in `publication.json`; no existing self-test file changes apart from the two assertions of R1. | P1 | AC6 |
| R6 [C28; C29; C30; C31; C32; C33; C45; C127; C156; C157; D7; D9; D12] | **Rebases (approver).** After approving 943, the approver appends a `scope` entry by 943's contract to the `review.rebases` of the 935, 940 and 941 contracts, each with `## Changed scope files` evidence listing the files of this task's diff that the rebased contract scopes (for 935 and 940: `scripts/workflow-gates/security-hook.mjs`, `scripts/workflow-gates/publication.json`, `scripts/workflow-gates/contract.mjs`, `scripts/workflow-gates/cli.mjs` (C53), `.claude/rules/review/03-decision-closure.md`, and for 935 also `.claude/rules/create/03-publication.md` (C58); for 941: the first two), and recomputes nothing else in them. Revision 4 (C127, D12): after the 941 `scope` entry the approver
appends a `tests` entry by 943's contract to the 941 contract, its evidence listing `scripts/workflow-gates/shell-write.selftest.mjs`
under `## Changed case test files` and one `## Case assertions` line per case of that file (GOV-941-HOOK-MALFORMED-ERROR states
the two changed assertions: equal to the pre-change result -> the pre-change result followed by the in-place file `writeFileSync`;
every other case of that file: `unchanged -> unchanged`), and keeps it only when `cli.mjs verify --contract` of the 941 contract exits 0
(`04-contract-rebases.md`); the `tests` entry starts at the `rebasedScopeSha256` of the `scope` entry, which is the 941 digest
with the final hook and `publication.json` and the unchanged test file, and a single `scope` entry cannot carry the test file
(C156, C157, `docs/sessions/evidence/task943/review/r1-r6-chain.mjs`). The approver also appends a `rules` entry by the 935 contract to the `review.rebases` of `tasks/Sprints/Sprint_78_Task_923_security_record_owner_fixes.security.json` and `tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json` (C54–C56), each with `## Changed rule files` evidence listing `.claude/rules/shared/` `security-testing.md`, `workflow-gates.md`, `workflow-contract.md`, `workflow-evidence.md`, `workflow-ci.md` and `git-publication.md`, the base-bytes digest match of the d14 probe rerun at that time, and `cli.mjs verify --contract <that contract>` exit 0 with the development project identity (C51). | P1 | AC7 |
| R7 [C37; C38; C39; C45; C48; C49; C50; C51; C52; D12] | **Case-test rebase.** `contract.mjs` implements section 5b: `rebaseChain` accepts `kind: 'tests'`, `rebaseChainErrors` validates it with the new exported `testsEntryErrors`, and the new exported `testsRebaseFiles` reads `## Changed case test files`; `scopeEntryErrors` is unchanged. In `cli.mjs`, `diffRebaseErrors` reads the listed files of a `tests` entry with `testsRebaseFiles` (today it knows only `rules` and `scope` lists, C52), so its diff-base check that no file other than the listed ones changed since the review covers `tests` entries; nothing else in `cli.mjs` changes apart from R11. The file `03-decision-closure.md` is 7879 bytes against the 8 KiB limit, so its "Governance approval path" and "Scope rebase" paragraphs (C45) move unchanged to new `.claude/rules/review/04-contract-rebases.md`, which `03-decision-closure.md` R7 names in one sentence, and that new file gains one paragraph stating D12: who writes the entry (the approver, never the implementer), its two evidence sections, the approver's
`cli.mjs verify` run of the rebased contract after the entry, exit 0 to keep it (section 5b), and that removing, renaming or weakening a case is never rebased but needs a revision of the owning task. | P1 | AC8 |
| R8 [C42; C43; C46; C47] | **Tracked exempting contract.** When `<root>/.git` exists (file or directory), `governanceIndependenceErrors` exempts a contract path and its evidence only when the contract file is tracked at `HEAD`: `execFileSync('git', ['cat-file', '-e', 'HEAD:' + path], { cwd: root, stdio: 'ignore' })`, no shell; a non-zero exit or a spawn error exempts nothing. When `<root>/.git` does not exist, the exemption is unchanged: the fixture roots of the existing Task 935/940 hook self-tests are plain temporary folders (C46), and the project root always has `.git` (C47). | P1 | AC9 |
| R9 [C41; C44; C58; D14] | **Closure rules.** `03-decision-closure.md`: (a) every note of an `APPROVED WITH NOTES` review is, before the verdict, either fixed in the cycle, written as an R/AC into a named saved kickoff (its path in the note), or a `BLOCKED` owner question; a note kept only in a review file is an incomplete review; (b) a task whose objective is a CI job is approved only after `ci-status.mjs --pr <n>` (or exact-SHA `ci-status.mjs`) shows that job green on the reviewed SHA; before that the decision is `PARTIALLY VERIFIED`; (c) owner D14, in `03-decision-closure.md` and in C7 of `.claude/rules/create/03-publication.md`: a design, review or self-audit session writes and verifies every kickoff revision, new route and cross-task text correction it finds necessary before its final handoff, or names it `BLOCKED` with the missing owner decision; a final report that lists such work as not yet done is an incomplete handoff, and a `draft` sidecar is not a substitute for the revised text. Both files stay at or under 8 KiB (`validateRuleSizes`). | P1 | AC10 |
| R10 [C35] | **Proof of R7, R8 and R11.** The five new GOV-943 cases live in new `scripts/workflow-gates/case-test-rebase.selftest.mjs`, listed in `publication.json`; no existing self-test file changes. | P1 | AC11 |
| R11 [C50; C54; C55; C57; C59] | **Reviewed-contract freshness.** New exported `reviewedFreshnessErrors(root, selected, { files, readBase })` in `cli.mjs` returns, for every path of `allContracts(root)` not in `selected` whose contract has stage `reviewed`, the errors of `scopeHashErrors(root, contract, contract.review.scopeSha256, 'Independent review scope is stale')` and, for its report, of `scopeHashErrors(root, contract, report.scopeSha256, 'Security report scope hash is stale')`, each prefixed with the path; an unreadable contract or report is a named error. It also returns `reviewed contract removed: <path>` for every path of `files` under `tasks/` ending in `.security.json` that is absent at head and whose base contents (`readBase`) parse to stage `reviewed`, unless a contract with the same file name exists at head under `tasks/` with stage `reviewed` (a move to the archive, or a revision under the same kickoff name, whose own freshness `validateDiff` or this function checks); today a deleted contract is checked by nothing (C59), and deleting a stale reviewed contract is never a way around its rebase. The `diff` command calls it at phase `release` with the paths `validateDiff` selected, the changed `files` and `gitBaseReader(ROOT, base)`, and adds its errors; `validateDiff` itself is unchanged, so no existing self-test changes (C57). | P1 | AC12 |
| R12 [C60; C61; C62; C63; C64; C65; C66; C67; C68; C69; C70; C71; C72; C73; C74; C75; C76; C77; C78; C79; C80; C81; C82; C83; C84; C85; C86; C87; C88; C89; C90; C91; C92; C93; C94; C95; C96; C97; C98; C99; C100; C101; C102; C103; C104; C105; C106; C107; C108; C109; C110; C111; C112; C113; C114; C115; C116; C117; C118; C119; C120; C121; C122; C128; C136; D13; D14] | **Target spellings (revision 2; (g) revision 3).** Every target the hook derives — of `shellWriteTargets` and the Write/Edit paths of both consumers (C84) — also covers the spellings that reach the same file: (a) on win32 only, `projectPath`, in this order: maps a leading `/<letter>/` to `<letter>:/` (MSYS, C87, C98); removes a leading `\\?\`, `\\.\`, `//?/` or `//./` (C91, C92); maps a leading `\\<any host>\<letter>$\` or `//<any host>/<letter>$/` to `<letter>:/` (C93; a share of another machine is then reported as the local drive, fail-closed); removes every trailing dot and space of the last segment and one trailing dot of every other segment, never changing a segment `.` or `..` (C75, C76; two dots or a dot and a space before a separator write nothing in PowerShell, review 2 second self-audit; Git Bash then writes a separate file, C77, which is reported as the plain name, fail-closed); resolves the result against its folder of (c)/(d); and canonicalises both the root and the deepest existing ancestor with `realpathSync.native` instead of `realpathSync` (C73, C83) **before** deciding inside or outside the root, so an 8.3 alias in any segment, the root's parents included, a junction and a symbolic link reach the long canonical path (C70–C74, C88–C90, C99; today the lexical outside test runs first, C83); when no ancestor exists (a missing drive) the lexical result stays, as `diff-hook.selftest.mjs` requires (C100); elsewhere `projectPath` is unchanged; only **write positions** are widened, never every path a command mentions: W1 redirection targets, W2 the path positions (positionals and `-Path`/`-LiteralPath`/`-FilePath` values) of `Set-Content`, `Add-Content`, `Out-File` and the section 5 `Clear-Content` row, W3 the literal path arguments of the API write calls of C2 and R3 (`writeFileSync('x'`, both arguments of `copyFileSync('a','b')`/`renameSync`, `[IO.File]::WriteAllText('x'`, `Path('x').write_text`, …), and the section 5 targets; the C2 list of mentioned paths keeps today's result, normalised by (a) (review 2 sixth check: re-resolving every mentioned word reported `.claude/settings.json` read through `require(…)` as written); (b) a W1 target found by the quote-aware parser of a parseable command, a W2 path or a section 5 target containing `*`, `?` or `[` adds every path `fs.globSync` returns for it with `cwd` set to its folder of (c)/(d) (C60–C63, C86; on win32 case-insensitive, as PowerShell is); a target found by the raw-text regex is never expanded, as that regex also finds `>` inside quoted text such as a grep pattern `-->`; (c) write positions are resolved against the folder current at their simple command: a simple command `cd`, `chdir`, `pushd`, `Set-Location`, `sl` or `Push-Location` (case-insensitive) with a folder (first positional or `-Path`/`-LiteralPath` value; `-`, `~` or a `$` folder change nothing) moves it for the later simple commands, the folder normalised as in (a) and resolved with `path.resolve` from the previous one, starting at each folder of (d), so an absolute folder replaces it (C64–C67); for a command the parser rejects, or one that starts a nested shell or interpreter (`bash`, `sh`, `cmd`, `powershell` or `pwsh` with `-c`, `/c` or `-Command`; `node` or `python` with `-e` or `-c`), every folder-change word of the raw text, inside quotes included, and `process.chdir('…')`/`os.chdir('…')` add folders, in order, for the raw-text write positions (regex redirection targets with (f), and W3) (C94–C96, C101); (d) `governanceIndependenceErrors` also resolves the write positions and Write/Edit paths of each tool call against the `cwd` of the transcript entry holding its `tool_use`, and the pre-write guard against the event's `cwd` — its shell write positions and (revision 4, C128, C136) a relative
Write/Edit path, which the guard decides on in both resolutions and refuses as outside the project when either leaves the root (C85; documented as the working directory when the hook runs, following `cd`, C107), each whenever it is an absolute path, also one outside the root, because a relative target from an outside folder can still lead into the project and a result outside the project never matches a scope (C68, C69; review 2 fourth self-audit); (e) W2 and W3 are targets for every command that is not read-only, so `Set-Content package.json x` (C79), `node -e "require('fs').writeFileSync('package.json','x')"` (C80) and a bare scope or evidence file name written by `node -e` after a folder change count although no C82 folder prefix occurs (C81, C82); (f) a raw-text redirection target also counts with its leading and trailing `'` and `"` removed, as a nested shell leaves the closing quote on it (C94, C95); (g) (revision 3, C108–C120) the Bash `>\|` redirection, with an optional stream number prefix (`2>\|`, C109) and optional spaces or tabs before its word, is a W1 redirection whose target is that word with its quotes removed (C108–C110, C113): in a command the 941 parser accepts it is found quote-aware at an unquoted `>` directly followed by an unquoted `\|` (941 R1 (b) splits there, so the word is the first word of the next simple command, C114) and gets (c) at the simple command holding the `>`, so `cd .git; grep -c a ../README.md >\|head` reports `.git/head` (C112); in a command the parser rejects, the raw-text redirection regex also matches `>\|` and the word after it, with (c) and (f); a quoted `>\|` is no redirection of a parsed command (C111, C117), while the raw-text match of a rejected command also finds one inside quoted text, fail-closed like the existing `>` regex (C119, where the prototype used the raw-text match for every command that is not read-only, an upper bound). Resolution against the root always stays; each addition is skipped when that target is already reported, so a command that (a)–(g) do not touch keeps its result and order. The targets of a read-only command (941 R2) get (a), (b) and (d) only, and its `>\|` targets also (c) and (g). Feasibility (`docs/sessions/evidence/task943/design/p12-r12-prototype.mjs` with `p12-r12-additions.txt`, a design prototype on a copy of the hook): every AC13 and audit form passes (C101, C106), the five hook-importing self-test files pass unchanged (C102), and over a frozen corpus of 2318 session commands it adds targets for 68 commands (C103), refuses 1 executor command allowed today (C104) and adds 1 governance scope file (C105), both for one command whose text contains a redirection into the hook file inside a quoted string, a class the hook already reports in today's spelling. Feasibility of (g): `docs/sessions/evidence/task943/design/p14-noclobber-prototype.mjs` with `p14-noclobber-run.txt`, a wrapper around the 941 revision 2 `shellWriteTargets` (C116–C120); (a)–(f) alone miss every AC13 form of (g) and (c) resolves its word once it is a W1 target (C121, C122). | P1 | AC13 |
| R13 [C129; C130; C131; C132; C133; C134; C135; C138; C139; C140; C141; C142; C143; C144; C145; C146; C148; C154; C155; C158; C159; C160; C161; C165; C166; C168; C169; C170; D13; D14] | **Commands run by another program (revision 4).** For a command that is not read-only: (a) the runners of section 5 (`exec`, `nice`, `ionice`, `timeout`, `stdbuf`, `builtin`, `doas`, with their options, option values and the `timeout` duration) are skipped before the program, and `builtin cd` or `command cd` changes the folder of R12 (c) (C131); (b) a parsed simple command whose program is `eval`, `iex` or `Invoke-Expression` (its remaining words, a `-Command` word dropped), `bash`, `sh`, `zsh`, `dash`, `cmd`, `powershell` or `pwsh` with or without `.exe` (the words after `-c`, `/c`, `/k` or `-Command` or a unique prefix of it), or `Start-Process`/`saps` (the `-FilePath` value or first positional, then the `-ArgumentList` values or the remaining positionals, split at commas and blanks) runs the text of those words joined by one space: `shellWriteTargets` of that text, started in each current folder of R12 (c), adds its targets, nested at most three levels deep (C129, C130, C134); (c) for a command the parser rejects, the R1 condition of `sed` and `find` also accepts the in-place or action option inside quotes (`"-i"`, `'-i'`, `"-delete"`), and the R1 paths are also resolved in every raw folder of R12 (c) (C133); (d) a simple command whose program is a delete, move or rename program of section 5 or `Clear-Content`, `clc`, `Set-Content`, `sc`, `Add-Content` or `ac`, with no `-Path`/`-LiteralPath` value and no positional, in a command of more than one simple command, takes its paths from the pipeline: every project path named by the words of the other simple commands (their program words and options excluded) and every file under each named project directory, a move also keeping its destination (C132); (e) a command the parser rejects is also read leniently (sub-review F1, F2, F4; C144–C146, C148): the body of a heredoc or PowerShell here-string is dropped first unless a shell (`bash`, `sh`, `zsh`, `dash`, `pwsh`, `powershell`) reads it; the rest is split at `;`, `|`, `&` and line breaks, and each part into words at blanks, unquoted brackets and backticks, a quoted span staying inside its word and a word with a quoted character never glob-expanded by R12 (b) (C165, C166); a part whose program is an evaluator, nested shell or `Start-Process` of (b) is read as the words it runs, and a leading script-block caller (`Invoke-Command`/`icm`, `Start-Job`/`sajb`, `Start-ThreadJob`, `ForEach-Object`/`foreach`/`%`, `.`) is dropped with its options (C158–C161); each part in order then either changes the folder as R12 (c) does (`cd /d` included) or gets the section 5 and R15 targets in the root and its current folder, of which only file-like targets (with a `/`, `\` or `.`, never `.` or `..`) are kept; the pipeline rule (d) and the `xargs` rule do not apply to these parts, because a `|` inside quoted text would make a false pipeline that walks the project root (C155); (f) (third self-audit) in the raw text of a parser-rejected command or of a nested shell or interpreter, the string literals of a child-process call (`execSync`, `execFileSync`, `execFile`, `exec`, `spawnSync`, `spawn`, `system`, `popen`, `Popen`, `run`, `call`, `check_call`, `check_output` followed by `(` and string literals, an array of them included) are joined by one space and read as a command whose targets, in every raw folder of R12 (c), are added, nested at most three levels deep (C169, C170). Each addition is skipped when that target is already reported, so the R1 superset and every existing result stay. A path held in a variable stays out of scope (section 4, C143). Feasibility: `docs/sessions/evidence/task943/design/p15-run.mjs` applies `p15-r13-pairs.txt` to the candidate hook; every deny form reports X and the executor guard refuses it, the controls report nothing (C134, C135), every hook-importing self-test passes (C138), and over the frozen corpus (with R14 and R15 applied too) 67 commands gain targets, 30 of them a guarded one, 6 executor commands are newly refused, five of them `npm install` after a folder change into a scratch folder that the root resolution of R12 also reads at the root (C140, C168; the supported form is an absolute `--prefix`, C167), no governance scope file is added (C139–C141) and every Task 941 target is kept (C154), with `FAILURES 0` (C142). | P1 | AC14 |
| R14 [C144; C147; C149; C150; C151; C152; C153; D13; D14] | **Sub-review corrections (revision 4).** (a) F3 (C147): `cd /d <folder>` (also `chdir` and `pushd` with `/d`) changes to `<folder>`, in parsed commands and in the raw folder words of R12 (c); (b) F5 (C149): `registeredWrites` builds the set of scope keys of every contract once per call and tests each target against it, with the result of `inScope`, so `evaluateHook` without a role on the real project root answers `rm -rf docs` and `cp -r docs backup/` within 5 s; (c) F7 (C150, C151): a generic API name of W3 (`truncate`, `rm`, `unlink`, `Delete`, `remove`, `cp`, `rename`, `Copy`, `Move`, `Replace`, `copyfile`, `copy`, `move`, `replace`) counts only after `fs.`, `fs.promises.`, `fsp.`, `os.`, `shutil.`, `]::` or `).`, so a `node -e` that only calls the string method `replace` on a literal product path is no write while `shutil.copy('Y','X')` and `require('fs').rm('X')` stay writes; the C2/R3 write-word list is unchanged; (d) F8 (C152, C153): each raw folder of R12 (c) is kept once, and `shellWriteTargets` on a command of about 49 000 characters with 5000 folder changes, parsed or parser-rejected, returns within the 15 s timeout of the security hook, whose failure blocks the call. | P2 | AC15 |
| R15 [C162; C163; C164; C167; C169; C170; D11; D13; D14] | **Other programs that write the files they name (revision 4, second and third self-audits).** The R15 row of section 5 is part of the program table for parsed commands, the lenient reading of R13 (e) and R12 (c)/(d) folders; its program words are not section 5 words of the R1 fallback, so they never add the R1 PROJECT_FILE paths of a parser-rejected command (the lenient reading still applies the row to it). Formatters, package managers, archivers, `Export-*`, downloads (`curl -o`/`-O`, `wget -O`/`-P`, `Invoke-WebRequest`/`Invoke-RestMethod -OutFile`), remote copies to a local destination (`scp`, `rsync`) and `npm pkg set|delete|fix` and `npm version` writing project files are refused for an executor (C162, C163, C169, C170), their read-only forms (`prettier --check`, `eslint` without `--fix`, `npm run`, `tar -t`) report nothing (C164), and an absolute `--prefix` outside the root reports no project file (C167). | P1 | AC16 |

## Acceptance criteria

For the cases, X is a fixture governance scope file, Y a readable fixture file, D a fixture directory holding X, and Z a path outside
every scope.

- **AC1 [R1; R2].** GOV-943-HOOK-SOURCE-ALLOW passes: `cp X Z`, `cp X C:/outside/x.mjs`, `Copy-Item -Path X -Destination Z`,
  `install X Z`, `ln -s X Z`, `dd if=X of=Z` and `tee Z < X` report no X target; the read-only commands of GOV-941-HOOK-READONLY-ALLOW
  still report `[]`; `governanceIndependenceErrors` for a transcript of all of them is `[]`. `node scripts/workflow-gates/selftests.mjs`
  shows every GOV-941 case passing, and `git diff` on `scripts/workflow-gates/shell-write.selftest.mjs` changes only the expected
  value of the two R1 commands (revision 4): the equality assertions may name those two commands in one constant, every other
  command keeps `previousTargets` as its expected value, and no command, case ID or test name changes.
- **AC2 [R2; R4].** GOV-943-HOOK-PROGRAM-DENY passes: each row of section 5 in Bash and, where it has one, PowerShell form (at least
  `cp Y X`, `cp Y D/`, `mv Y X`, `mv X Z`, `echo x | tee -a X`, `sed -i 's/a/b/' X`, `sed -i.bak -e 's/a/b/' X`, `rm -f X`, `touch X`,
  `truncate -s 0 X`, `ln -sf Y X`, `install Y X`, `dd if=Y of=X`, `Copy-Item Y X`, `Copy-Item -Path Y -Destination X`,
  `Move-Item -Path X -Destination Z`, `Remove-Item -Path X -Force`, `Rename-Item -Path X -NewName other.mjs`,
  `New-Item -ItemType File -Path X -Force`, `Clear-Content X`, `sc X 'x'`, `grep -n a Y; cp Y X`) reports X and yields
  `GOVERNANCE INDEPENDENCE` for X. GOV-943-HOOK-DIRECTORY-DENY passes: `rm -rf D`, `Remove-Item -Recurse -Force D`, `mv D Z` and
  `cp -r Y-dir D/` report the affected files under D. Sensitivity: removing `tee` from the table fails GOV-943-HOOK-PROGRAM-DENY with
  an assertion; restored passes. Rerunning `p01-undetected-writes-probe.mjs` reports X on every line 2–21 (saved to
  `docs/sessions/evidence/task943/impl/probes-after.txt`).
- **AC3 [R2; R4].** GOV-943-HOOK-PRETOOL-DENY passes: for executor PreToolUse events, `cp docs/backlog.md scripts/check-example.mjs`,
  `sed -i 's/a/b/' scripts/check-example.mjs` and `Copy-Item -Path docs/backlog.md -Destination scripts/check-example.mjs` return
  `POLICY-EDIT AUTHORITY REQUIRED`, and `cp docs/backlog.md src/lib/example.ts` without a receipt returns
  `SECURITY TEST CONTRACT MISSING`. Sensitivity: removing `Copy-Item` from the table fails GOV-943-HOOK-PRETOOL-DENY with an
  assertion; restored passes. Rerunning `p02-pretool-probe.mjs` shows a refusal on lines 2–5 (appended to `probes-after.txt`).
- **AC4 [R3].** GOV-943-HOOK-API-DENY passes: `node -e` with each Node API word of R3, a `[IO.File]::WriteAllText`, a
  `[System.IO.File]::Delete` and a `python -c` with `shutil.copy`, each naming X, report X.
- **AC5 [R1; R2].** GOV-943-HOOK-MALFORMED-ERROR passes: `cp` with no positional, `Copy-Item -Destination` with no value and
  `dd of=` report nothing and do not throw; an unparseable command (unterminated quote) containing `rm` and X reports X;
  `find D -name x -delete` and `ls D | xargs rm` report the files under D.
- **AC6 [R5].** GOV-943-CI-DELETE-DENY passes (`validateDiff` refuses a deleted `scripts/workflow-gates/security-hook.mjs` outside
  every governance scope, C20). `node scripts/workflow-gates/publication.mjs --base HEAD` reports 0 dependency errors;
  `node scripts/workflow-gates/selftests.mjs` meets AC11 (C21 is the count before 941); `node scripts/workflow-gates/check-workflow.mjs` exits 0;
  `node node_modules/eslint/bin/eslint.js --config scripts/workflow-gates/eslint.config.mjs scripts/workflow-gates` exits 0;
  `node scripts/workflow-gates/cli.mjs governance-report --contract <this sidecar>` passes every case;
  `node scripts/workflow-gates/cli.mjs verify --contract <this sidecar>` exits 0 at stage implemented; `npm run check:kickoff-evidence`
  passes.
- **AC8 [R7].** GOV-943-TESTS-REBASE-ALLOW, GOV-943-TESTS-REBASE-DENY and GOV-943-TESTS-REBASE-ERROR pass on fixture roots built
  with `mkdtempSync`; ALLOW and DENY include `validateDiff` at phase `release` with an injected base reader (the contract reviewed at
  the base): only the listed case test changed → no rebase error; a second, unlisted case test also changed → `rebases: files other
  than the listed files changed since the review`. Sensitivity: making `testsEntryErrors` skip the `[<id>]` presence check fails GOV-943-TESTS-REBASE-DENY with an
  assertion; restored passes (artifact `GOV-943-TESTS-REBASE-DENY.txt`). `scope-rebase.selftest.mjs` passes unchanged.
- **AC9 [R8].** GOV-943-EXEMPT-UNTRACKED-DENY passes on a fixture Git repository (`git init -q` in a `mkdtempSync` folder, the
  commit made with `-c user.name=fixture -c user.email=fixture@example.test commit -q --no-gpg-sign`, as
  `governance-contract.selftest.mjs:315-321` does): a rules entry by the receipt contract, valid under `rulesEntryErrors`, exempts the
  approver's write when its contract is committed, and the same entry in an untracked contract file yields `GOVERNANCE INDEPENDENCE`
  for that file; with `git` unavailable (`process.env.PATH`, and `Path` on Windows, set to `''` for the call and restored after; spawn error
  ENOENT, C47 probe line 8) the committed contract exempts nothing. Sensitivity: dropping
  the tracked check fails it with an assertion; restored passes (artifact `GOV-943-EXEMPT-UNTRACKED-DENY.txt`). `scope-rebase.selftest.mjs`
  and `governance-contract.selftest.mjs`, including GOV-940-HOOK-EXEMPT-ALLOW on its non-Git fixture, pass unchanged.
- **AC10 [R9].** `node scripts/workflow-gates/check-workflow.mjs` exits 0 (rule sizes included); the three rule texts of R9 are present
  in `03-decision-closure.md`, and the text of R9 (c) also in C7 of `.claude/rules/create/03-publication.md`.
- **AC11 [R10].** `node scripts/workflow-gates/selftests.mjs` exits 0 with at least the base count after 941 plus 14 passing tests and
  0 skipped; `cli.mjs governance-report` passes all fourteen GOV-943 cases (revision 2 adds AC13's case, revision 4 AC14's).
- **AC12 [R11].** GOV-943-CI-STALE-REVIEW-DENY passes on a fixture root: a reviewed contract outside `selected` whose scope file
  changed yields `Independent review scope is stale` for its path; the same contract with a valid rebase chain, a fresh reviewed
  contract, a planned contract and a selected stale contract yield nothing from `reviewedFreshnessErrors`; a contract reviewed at
  the base and deleted at head yields `reviewed contract removed`, the same contract moved to `tasks/Archive/` or replaced by a
  reviewed contract of the same file name yields nothing. Sensitivity: skipping the
  reviewed contracts outside `selected` fails it with an assertion; restored passes (artifact `GOV-943-CI-STALE-REVIEW-DENY.txt`).
- **AC13 [R12; R4].** GOV-943-HOOK-TARGET-SPELLING-DENY passes on a fixture root whose scope file X is `D/hook.mjs`: `cat Y > D/hoo?.mjs`
  and `Get-Content Y > D/hoo?.mjs` report X; `cd D; cat Y > hook.mjs`, `cd D && echo x > hook.mjs`,
  `Set-Location D; Get-Content Y > hook.mjs`, `Push-Location D; Set-Content hook.mjs x` and
  `cd D; node -e "require('fs').writeFileSync('hook.mjs','x')"` report X; a transcript whose `tool_use` entry has `cwd` `<root>/D`
  and the command `echo x > hook.mjs` yields `GOVERNANCE INDEPENDENCE` for X, and so does an entry whose `cwd` is a sibling folder
  outside the root with `echo x > ../<root folder name>/D/hook.mjs`; an executor PreToolUse event with `cwd` `<root>/scripts`
  and `echo x > check-example.mjs` returns `POLICY-EDIT AUTHORITY REQUIRED`, and so do an executor Write and an executor Edit with
  `file_path` `check-example.mjs` and `cwd` `<root>/scripts`, while the same relative Write with a `cwd` outside the root returns
  `Write outside the project cannot be verified` (revision 4, R12 (d)); executor PreToolUse events `Set-Content package.json x`,
  `Set-Content -Path next.config.ts -Value x`, `Add-Content tsconfig.json x`, `'x' | Out-File -FilePath package.json` and
  `node -e "require('fs').writeFileSync('package.json','x')"` return `SECURITY TEST CONTRACT MISSING`. On win32 only (an `if` inside
  the test, never a skipped test, so AC11 keeps 0 skipped): `Get-Content Y > D/hook.mjs.`, `Get-Content Y > "D/hook.mjs. ."` and
  `Get-Content Y > D./hook.mjs` report X. The win32 short-name and absolute-path part uses a fixture root folder named
  `LongFixtureRootName` with a second scope file `D/LongScopeFileName.mjs` (`hook.mjs` has no 8.3 alias, C97): when
  `cmd /d /c dir /x` lists aliases, a redirection to the file alias, a redirection and a Write tool call through the root folder
  alias in an absolute path, the MSYS spelling `/<drive>/…`, a `\\?\` and a `\\.\` prefix and a junction (`mklink /J`) to `D`
  each yield `GOVERNANCE INDEPENDENCE` for the file, and so does `\\localhost\<drive>$\…` when that share is reachable (C87–C93);
  the test prints which parts ran, and the completion report quotes that line from the native Windows run of this machine, where
  every part must have run (C97). Nested folder changes: `bash -c 'cd D; cat ../Y > hook.mjs'`, `cmd /d /c "cd D && type ..\Y > hook.mjs"`
  and `node -e "process.chdir('D'); require('fs').writeFileSync('hook.mjs','x')"` report X (C94–C96); the executor events
  `echo x > /<drive>/<root path>/package.json` and an absolute redirection through an alias of a parent folder of the root into
  `scripts/check-example.mjs` are refused (C98, C99). Revision 3, R12 (g) (C108–C120): `cat Y >| D/hook.mjs`, `cat Y >|D/hook.mjs`,
  `cat Y 2>| D/hook.mjs`, `cat Y >| 'D/hook.mjs'`, `echo x >| D/hook.mjs` and `cd D; cat ../Y >| hook.mjs` report X, and
  `cd D; grep -c a ../Y >|cat` reports `D/cat`; the executor events `echo x >| scripts/check-example.mjs` and
  `cd .git; grep -c a ../README.md >|head` return `POLICY-EDIT AUTHORITY REQUIRED` and `OWNER GIT REQUIRED` respectively (the guard's Git-metadata test is
  case-insensitive, `security-hook.mjs` line 369). Controls:
  `cd D; grep -n a hook.mjs` and `grep -n '>|D/hook.mjs' Y` report `[]`, and a glob matching no file reports only its literal. Sensitivity: dropping R12 (c) fails the case with an assertion; restored passes
  (artifact `GOV-943-HOOK-TARGET-SPELLING-DENY.txt`). Rerunning `p09-target-spelling-probe.mjs` reports the real file or a refusal on
  lines 4, 10–13, 19, 20, 22, 23, 29, 30 and 32–36, and `p11-absolute-spelling-probe.mjs` a reported target or a refusal on
  lines 3–14, and `p14-noclobber-prototype.mjs` a non-empty `current` on lines 9–18 with the controls on lines 19–21
  unchanged (all three appended to `probes-after.txt`).
- **AC14 [R13].** GOV-943-HOOK-NESTED-DENY passes on a fixture root with X, Y, D and Z as above: `bash -c 'cp Y X'`,
  `bash -c "rm -f X"`, `sh -c 'sed -i s/a/b/ X'`, `bash -c 'cd D; rm <file name of X>'`, `powershell -Command "Copy-Item Y X"`,
  `powershell -NoProfile -Command "Remove-Item X"`, `cmd /c "copy Y X"`, `cmd /d /c "del X"`, `eval "cp Y X"`, `iex "Remove-Item X"`,
  `Invoke-Expression "Remove-Item X"`, `Start-Process cp -ArgumentList Y,X`, `exec cp Y X`, `timeout 5 rm X`, `timeout -s KILL 5 rm X`,
  `nice -n 5 rm X`, `stdbuf -o0 rm X`, `builtin cd D; rm <file name of X>`, `sed "-i" 's/a/b/' X '`, `find X "-delete" '`,
  `Get-ChildItem D | Remove-Item`, `Get-Item X | Remove-Item`, `Get-Item X | Move-Item -Destination docs`, `Get-Item X | Clear-Content`
  and `Get-Item X | Rename-Item -NewName other.mjs` each report X and yield `GOVERNANCE INDEPENDENCE` for X, and each executor form
  with X replaced by `scripts/check-example.mjs` is refused. R13 (e) (sub-review F1, F2, F4): `find D -name '*.mjs' -exec sed -i 's/a/b/' {} +`,
  `find D -name x -exec rm {} \;` and `sed -i "s/a/$x/" D/*.mjs` report X, and the executor PreToolUse events
  `Set-Content package.json $x` and `"$x" | Out-File -FilePath package.json` return `SECURITY TEST CONTRACT MISSING`. Controls report no X: `bash -c 'cp X Z'`, `bash -c 'grep -n a X'`,
  `eval "cat X"`, `powershell -Command "Get-Content X"`, `cmd /c "type X"`, `timeout 5 cat X`, `Get-Item X | Copy-Item -Destination docs/`,
  `Get-Content X | Select-String a` and `Start-Process cat -ArgumentList X`. Sensitivity: dropping the R13 (b) text evaluation fails
  GOV-943-HOOK-NESTED-DENY with an assertion; restored passes (artifact `GOV-943-HOOK-NESTED-DENY.txt`). Rerunning
  `node docs/sessions/evidence/task943/review/r1-adv-probe.mjs` on the final hook prints `REPORTED` on every line (appended to
  `probes-after.txt`).
- **AC15 [R14].** In GOV-943-HOOK-NESTED-DENY: the executor event `cmd /d /c "cd /d <absolute fixture root>/scripts && echo x > check-example.mjs"`
  returns `POLICY-EDIT AUTHORITY REQUIRED` (F3); in GOV-943-HOOK-SOURCE-ALLOW: an executor `node -e` that only calls the string method
  `replace` on the text `src/app/page.tsx` returns `[]`, while `python -c "import shutil; shutil.copy('Y', 'X')"` and
  `node -e "require('fs').rm('X', () => 0)"` still report X (F7). Timings, each command and its output appended to `probes-after.txt` from
  native Windows: `evaluateHook` without a role on the real project root for `rm -rf docs` and `cp -r docs backup/` under 5 s (F5);
  `shellWriteTargets` on the 5000-folder-change commands of `docs/sessions/evidence/task943/design/p15-run.mjs` (parsed and
  parser-rejected) under 15 s (F8). The completion report states F1–F8 one by one with the case or line that closes each.
- **AC16 [R15; R13].** In GOV-943-HOOK-PROGRAM-DENY: `npx prettier --write X`, `npx eslint --fix D`, `tar -xzf Y.tgz -C D`,
  `unzip -o Y.zip -d D` and `Expand-Archive -Path Y.zip -DestinationPath D -Force` report X; the executor events `npm install left-pad`
  and `Get-Process | Export-Csv -Path package.json` return `SECURITY TEST CONTRACT MISSING`. In GOV-943-HOOK-NESTED-DENY (R13 (e)):
  the executor events `bash -c "rm package.json $y"`, `bash -c "cd scripts; rm check-example.mjs; echo $y"`,
  `powershell -Command "Remove-Item package.json; $x = 1"`, `eval "rm package.json $y"`,
  `Invoke-Command -ScriptBlock { Remove-Item package.json }`, `. { Remove-Item package.json }`, `Start-Job { Remove-Item package.json }`
  and `rm "src/app/[locale]/page.tsx" $y` are refused, and (R13 (f), R15 third self-audit) so are `curl -sSL -o package.json <url>`,
  `wget -q -O scripts/check-example.mjs <url>`, `Invoke-WebRequest -Uri <url> -OutFile package.json`,
  `scp host:/tmp/x scripts/check-example.mjs`, `npm pkg set name=x`, `npm version patch --no-git-tag-version`,
  `node -e "require('child_process').execSync('rm package.json')"` and
  `python -c "import subprocess; subprocess.run(['rm', 'package.json'])"`. In GOV-943-HOOK-SOURCE-ALLOW: `npx prettier --check X`, `npx eslint D`,
  `npm run build`, `tar -tzf Y.tgz`, `curl -sS <url>`, `scp X host:/tmp/x`, `npm pkg get name`,
  `node -e "require('child_process').execSync('git status')"`, `Get-ChildItem D | ForEach-Object { Get-Content $_.FullName }`,
  `sed -i "s#import * as R#x#" Y; echo $y` (no root file reported) and `npm install left-pad --prefix <absolute folder outside the root>`
  report no X and no root file. Rerunning `docs/sessions/evidence/task943/review/r1-audit2-probe.mjs` with the final hook path prints
  `REFUSED` on lines 1–31 and `ALLOWED` on lines 32–44 (appended to `probes-after.txt`).
- **AC7 [R6].** After the approver's rebases, the scoped harness of Task 940 AC7 (`validateDiff` and `changedFiles` from
  `scripts/workflow-gates/cli.mjs`, phase `release`, base `origin/main`, working tree) reports no error for the 935, 940, 941, 943,
  923 owner-fixes and 927 contracts, and `reviewedFreshnessErrors` for that selection returns `[]`; `cli.mjs verify` of the 941
  contract exits 0 after its `tests` entry (revision 4), and `cli.mjs verify` of the 923
  owner-fixes and 927 contracts exits 0 with the development project identity (the only step of this task that uses credentials and
  the network: the approver's, never a case fixture).

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | The shell write detection `shellWriteTargets` (C1, C2) and its two consumers: the governance independence check of the Stop hook (`governanceIndependenceErrors`, C3) and the pre-write guard (`evaluateHook` PreToolUse, C4, C19); the CI policy-diff check of `validateDiff` (C20) as the preserved outer layer. Owner: Opus (D1). |
| Frontend security | Governance has no browser consumer; the hook layer replaces this row: GOV-943-HOOK-SOURCE-ALLOW, GOV-943-HOOK-PROGRAM-DENY, GOV-943-HOOK-DIRECTORY-DENY, GOV-943-HOOK-API-DENY, GOV-943-HOOK-PRETOOL-DENY, GOV-943-HOOK-MALFORMED-ERROR, GOV-943-HOOK-TARGET-SPELLING-DENY and GOV-943-HOOK-NESTED-DENY (revision 4) on the real `shellWriteTargets`, `governanceIndependenceErrors` and `evaluateHook` with synthetic transcripts, contracts and fixture directories. |
| Server security | The CI layer replaces this row: GOV-943-CI-DELETE-DENY on the real `validateDiff` with a fixture root; GOV-943-TESTS-REBASE-ALLOW, GOV-943-TESTS-REBASE-DENY and GOV-943-TESTS-REBASE-ERROR on the real `testsEntryErrors`, `rebaseChainErrors`, `validateContract` and `validateDiff` (its `diffRebaseErrors` anchor check); GOV-943-CI-STALE-REVIEW-DENY on the real `reviewedFreshnessErrors` and `scopeHashErrors`; the hook layer adds GOV-943-EXEMPT-UNTRACKED-DENY on the real `governanceIndependenceErrors` in a fixture Git repository. |
| Database/integrations | Not applicable: no database, Storage, Realtime or provider path. |
| Cases | The fourteen GOV-943 cases of the sidecar, each with actor, resource, input, response and forbidden effects; allow, deny and error outcomes; hook and CI layers. |
| Fixtures and environment | Temporary directories from `mkdtempSync` as the project root, synthetic contracts, transcripts, files and directories; no credentials, no network, no repository writes outside temporary folders. |
| Sensitivity proof | Critical cases GOV-943-HOOK-PROGRAM-DENY, GOV-943-HOOK-PRETOOL-DENY, GOV-943-TESTS-REBASE-DENY, GOV-943-EXEMPT-UNTRACKED-DENY, GOV-943-CI-STALE-REVIEW-DENY, GOV-943-HOOK-TARGET-SPELLING-DENY and GOV-943-HOOK-NESTED-DENY: the breaks named in AC2, AC3, AC8, AC9, AC12, AC13 and AC14; baseline pass, isolated break failing with an assertion, restored pass; artifacts under `docs/sessions/evidence/task943/sensitivity/`. |
| Execution | `node scripts/workflow-gates/cli.mjs governance-report --contract tasks/Sprints/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json`, then `cli.mjs verify` on the same path; native Windows PowerShell 5.1, Node 22.22.3; QA Q1. |

## 7. Ordered route

1. **Owner** (separate PowerShell window, `C:\Claude_Code_Projects\lero-al`): stay on `task/935-governance-approval-route` (D7);
   commit this kickoff set with the command Opus gives.
2. **Prerequisite, before the first write of step 3:** Task 941 is approved and committed at its revision 2 or later (whose
   R1 (b) makes a `cd`/`Set-Location` command with a write redirection not read-only, which AC13 relies on): the archived 941 sidecar
   `tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json` reads `"stage": "reviewed"`
   (`planned` at design time, C27; approved 2026-11-03 by review 3, `docs/sessions/evidence/task941/review/review-941.md`) and
   `git status --short tasks scripts/workflow-gates` shows no change to the 941 sidecar or the hook file.
   Otherwise this task stops as `BLOCKED` (R1).
3. **Opus implementer, fresh session or the session that implemented revision 3** (D1; not the designer of this kickoff, not the Task 941 review 2 session, not the Task 941 review 3 session and not the Task 943 review 1 session, which wrote revision 4): read this
   kickoff and its bundle; save the base run of `selftests.mjs` to
   `docs/sessions/evidence/task943/impl/base-runs.txt` before the first write. Implement R1–R4 and R12, then R5 with the eight cases, then
   R7–R11 with the five new cases. Revision 4: start from the committed revision 3 implementation (hook sha256 `35b508014df0…`,
   line 1 of `docs/sessions/evidence/task943/design/p15-run.txt`; check it with `Get-FileHash` before the first write, otherwise `BLOCKED`);
   append a `selftests.mjs` run to `base-runs.txt` before the first revision 4 write, then implement the R1
   change of the two 941 assertions, the R12 (d) Write/Edit change, R13 with GOV-943-HOOK-NESTED-DENY, R14 and R15 (`design/p15-r13-pairs.txt`
   is a design prototype to read, not code to paste), and rerun every
   sensitivity break on the final source. Record `implementation: { "role": "Opus" }`, stage `implemented`, `report` and `sensitivity` in
   the sidecar; run the seven sensitivity breaks and keep their artifacts; rerun the p01, p02, p09, p11 and p14 probes and `review/r1-adv-probe.mjs` `review/r1-audit2-probe.mjs` with the final hook path and the AC15 timings (AC2, AC3, AC13, AC14, AC15, AC16; p09,
   p11 and p14 from native PowerShell with Git Bash installed at `C:\Program Files\Git\bin\bash.exe`). Do not write R6: the approver does. Work on the hook
   file through the Edit tool: a shell command that copies or rewrites the hook is itself a write the hook now detects.
4. Run `cli.mjs governance-report` and every AC command; write the completion report, including the out-of-scope write forms that
   stay undetected (section 4); end with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` and the explicit-path commit command for the
   owner. No push.
5. **Opus approver, another fresh session** (D2; none of the sessions named in step 3): review R1–R15; on approval write the `review` block and stage `reviewed`, write R6
   with its six evidence files (the five `scope`/`rules` files and `tests-rebase-941.md`), run AC7, and hand off the explicit-path commit under `shared/git-publication.md`. PR #12 merges only
   after green PR checks (D7).

## 8. Completion report

Per requirement: changed files, evidence path, status; each GOV-943 case with its result; the seven sensitivity diffs with the failed
assertion; base and final self-test totals; the p01/p02/p09 probes before and after; the AC13 short-name line; proof that no existing self-test file changed apart from the two R1 assertions; the
write forms that stay undetected; one of `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 9. Rule compliance

| Rule | How this kickoff complies |
|---|---|
| `claim-evidence-contract.md` | Every R cites ledger rows; sources are retained snapshots and executed probes under `docs/sessions/evidence/task943/design/`. |
| `security-testing.md` | Governance contract: hook and CI layers, allow/deny/error, sensitivity for the seven critical cases, Q1. |
| `role-boundaries.md` | Opus implements policy (D1); Sonnet is not routed; approval by an independent session (D2). |
| `git-publication.md` | Task-branch commit on PR #12's branch (D7); merge only after green checks. |
| `mobile-adaptation-contract.md` | No visible scope: `Scope: none`. |

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31, C32, C33, C34, C35, C36, C37, C38, C39, C40, C41, C42, C43, C44, C45, C46, C47, C48, C49, C50, C51, C52, C53, C54, C55, C56, C57, C58, C59, C60, C61, C62, C63, C64, C65, C66, C67, C68, C69, C70, C71, C72, C73, C74, C75, C76, C77, C78, C79, C80, C81, C82, C83, C84, C85, C86, C87, C88, C89, C90, C91, C92, C93, C94, C95, C96, C97, C98, C99, C100, C101, C102, C103, C104, C105, C106, C107, C108, C109, C110, C111, C112, C113, C114, C115, C116, C117, C118, C119, C120, C121, C122, C123, C124, C125, C126, C127, C128, C129, C130, C131, C132, C133, C134, C135, C136, C137, C138, C139, C140, C141, C142, C143, C144, C145, C146, C147, C148, C149, C150, C151, C152, C153, C154, C155, C156, C157, C158, C159, C160, C161, C162, C163, C164, C165, C166, C167, C168, C169, C170; owner decisions: D1, D2, D7, D9, D11, D12, D13, D14; blocked claims: NONE.
