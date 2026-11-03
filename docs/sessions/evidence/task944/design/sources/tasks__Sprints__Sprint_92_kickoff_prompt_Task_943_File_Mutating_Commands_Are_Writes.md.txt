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

## 1. Mode, task type and rule bundle

Governance task. **Implementer: Opus, in a fresh implementation session started for this task (D1); Sonnet does not execute it**,
because every path in scope is a policy path (C36). **Approver: Opus, in another fresh session that wrote none of the scope files
(D2).** Neither may be the session that designed this kickoff, the session that wrote revision 2 (the Task 941 review 2
session) or the session that wrote revision 3 (the Task 941 review 3 session). Types (`docs/rule-index.md`): workflow gates / governance tooling.
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
| C37 | FACT | A scope rebase refuses every case test of the rebased contract. | source: `scripts/workflow-gates/contract.mjs:158-158`; observed: `case tests are never rebased` |
| C38 | FACT | The CI diff check reruns the mapped cases of every touched product contract. | source: `scripts/workflow-gates/cli.mjs:283-283`; observed: `errors.push(...runMappedTests(ROOT, contract));` |
| C39 | FACT | Task 931 revision 3 changes 19 case tests of reviewed contracts other than 931 (executed probe). | source: `docs/sessions/evidence/task931/design/d08-rev3-contract-impact.txt:42-42`; observed: `reviewed contracts other than 931 with a changed case test: 19` |
| C40 | FACT | With the libuv thread pool busy, one cold WebCrypto digest takes 207118 event-loop turns against the 500-turn wait of the Google tests (executed probe). | source: `docs/sessions/evidence/task931/design/d06-digest-turn-budget.txt:5-5`; observed: `cold digest: 207118 turns` |
| C41 | FACT | PR #12 CI on head 2693c6b9a fails two tests of googlePopup.test.ts after Task 931 was approved. | source: `docs/sessions/evidence/task931/design/d06-digest-turn-budget.txt:9-9`; observed: `googlePopup.test.ts 2 failed` |
| C42 | FACT | The contract list of the hook walks the disk, so an untracked contract is included. | source: `scripts/workflow-gates/cli.mjs:34-34`; observed: `readdirSync(join(root, dir), { withFileTypes: true })` |
| C43 | FACT | An exempting rules entry must name an evidence path (Task 935 note N1, closed by Task 940 R5). | source: `docs/sessions/evidence/task943/design/sources/db04c936f__scripts__workflow-gates__security-hook.mjs.txt:251-251`; observed: `!isEvidencePath(entry.evidence)) continue;` (revision 2: the snapshot at `db04c936f`, as Task 941 moved the line) |
| C44 | FACT | The closure rule allows approval with notes and names no destination for them. | source: `.claude/rules/review/03-decision-closure.md:34-34`; observed: `only P3/notes remain` |
| C45 | FACT | The closure rule holds the scope-rebase paragraph of owner decision D9. | source: `.claude/rules/review/03-decision-closure.md:67-67`; observed: `Scope rebase (owner D9, Task 940)` |
| C46 | FACT | The Task 940 hook self-tests build their fixture root in a plain temporary folder, not a Git repository. | source: `scripts/workflow-gates/scope-rebase.selftest.mjs:33-33`; observed: `const root = mkdtempSync(join(tmpdir(), prefix));` |
| C47 | FACT | Git separates a tracked contract, an untracked one and a folder outside any repository (executed probe). | source: `docs/sessions/evidence/task943/design/p06-git-worktree-probe.txt:10-10`; observed: `exists on disk, but not in 'HEAD'` |
| C48 | FACT | A static testName match is infeasible: most reviewed testNames carry describe titles before the case ID (executed probe). | source: `docs/sessions/evidence/task943/design/p08-testname-literal-probe.txt:3-3`; observed: `cases 231; literal ok 45; misses 186` |
| C49 | FACT | The mapped-case rerun requires the exact full Vitest name. | source: `scripts/workflow-gates/cli.mjs:240-240`; observed: `a.file === row.testFile && a.fullName === row.testName` |
| C50 | FACT | The CI diff selects every contract whose file changed. | source: `scripts/workflow-gates/cli.mjs:113-113`; observed: `paths.filter(p => files.includes(p)` |
| C51 | FACT | Integration cases run only with the approved development project identity. | source: `scripts/workflow-gates/cli.mjs:198-198`; observed: `if (environment.SECURITY_TEST_TARGET !== 'development'` |
| C52 | FACT | The CI diff anchor check of rebase entries reads only rules and scope file lists. | source: `scripts/workflow-gates/cli.mjs:83-83`; observed: `(kind === 'rules' ? rebaseFiles : scopeRebaseFiles)` |
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
`security-hook.mjs` and adds its case to `shell-mutation.selftest.mjs`.
Written by the approver only (R6): `scope` entries in the `review.rebases` of the 935, 940 and 941 contracts with evidence
`docs/sessions/evidence/task943/review/scope-rebase-935.md`, `…/scope-rebase-940.md` and `…/scope-rebase-941.md`; `rules` entries
by the 935 contract in the 923 owner-fixes and 927 contracts with evidence `…/rules-rebase-923-owner-fixes.md` and
`…/rules-rebase-927.md`.

Out of scope: product code; every existing self-test file, including Task 941's `shell-write.selftest.mjs` (C26), which must pass
unchanged; `isReadOnlyShellCommand` and its allowlist (941); mutating Git commands, already refused by their own hook (C22); the
PowerShell hooks under `.claude/hooks/`; writes that no command text can reveal: a script file run by an interpreter (`node x.mjs`,
`python x.py`), `perl -i`, editors, and programs not listed in section 5; a folder change whose folder is a variable, `-`, `~`
or `popd`/`Pop-Location` (R12 (c)). These remain undetected; the completion report lists them.

## 5. Program table

R2 reads each simple command produced by the quote-aware split of Task 941 R1 (b). The program is the first token, compared
case-insensitively; a leading `sudo`, `env`, `command`, `nohup` or `time` is skipped. Options are tokens starting with `-` (a
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
result for read-only commands (941); the CI policy-diff check (C20); both consumers (C3, C4) unchanged in code apart from the R8 tracked check in the exemption loop. Changed: the files
changed by the commands of section 5 and by the API words of R3 are reported as targets, so the independence check counts them and
the pre-write guard decides on them exactly as on a `Set-Content` write. Revision 2: every target and Write/Edit path is also
reported in the spellings of R12 that reach the same file, and both consumers also resolve relative targets against the shell
folder of the tool call (R12 (d)).

## Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R1 [C24; C25; C27; C120] | **Prerequisite and preservation.** Task 941 is reviewed and committed before the first write. For every command, the new result is a superset of the 941 result; for commands that 941 R1 (a) rejects as unparseable, the result is the 941 result plus, only when a program name of section 5 occurs in the command as a separate word, every project path matched by the existing path pattern of the write-word branch (C2), so the 941 equality case stays green. Revision 2: the R12 additions apply on top, and R12 (a) normalizes both sides of the superset comparison; no hook input of the five self-test files that import the hook (`diff-hook`, `governance-contract`, `scope-rebase`, `session-role`, `shell-write`, 83 tests at `db04c936f`) has an asserted result that R12 (a)–(g) changes ((g): no self-test file contains its operator, C120): each copy run against a proxy of the real hook that records every input meeting an R12 trigger passes, the recorded inputs are absolute fixture paths with long names (unchanged by `realpathSync.native`), the MSYS case asserted with `includes` (C51), the missing-drive case kept by R12 (a) (C100) and quoted text of read-only commands, which (f) does not touch, its positive control records the known forms, and the two tests that spawn the hook send Stop events with neither `cwd` nor an R12 spelling (`docs/sessions/evidence/task941/review-2/r12-scan/run-scan.txt`), and the same five files pass unchanged against the R12 prototype (C102); the 941 revision 2 `cd`/`Set-Location` forms assert inclusion. | P1 | AC1, AC5 |
| R2 [C1; C5; C6; C7; C8; C9; C10; C11; C16; C17; C18; D11] | **Program targets.** For a parseable command that is not read-only, `shellWriteTargets` adds, for each simple command, the targets of section 5, resolved through `projectPath`; targets outside the project stay as `projectPath` resolves them and never match a scope. A missing destination or option value adds nothing and never throws. | P1 | AC1, AC2, AC3, AC5 |
| R3 [C2; C12; C13] | **API words.** The write-word test of C2 also matches `appendFile`, `appendFileSync`, `copyFile`, `copyFileSync`, `cpSync`, `renameSync`, `rmSync`, `unlinkSync`, `truncateSync`, `createWriteStream`, `fs.rename`, `fs.rm`, `fs.unlink`, `fs.truncate`, `fs.cp`, `fs.promises`, `WriteAllText`, `WriteAllLines`, `WriteAllBytes`, `AppendAllText`, `AppendAllLines`, `File]::Copy`, `File]::Move`, `File]::Delete`, `File]::Replace`, `shutil.copy`, `shutil.copyfile`, `shutil.move`, `os.remove`, `os.unlink`, `os.replace`, `os.rename` and `write_bytes`, with the existing path collection unchanged. | P1 | AC4 |
| R4 [C3; C4; C15; C19] | **Consumers.** `governanceIndependenceErrors` and the pre-write guard keep calling `shellWriteTargets`; nothing else in their code changes, except the tracked check that R8 adds to the exemption loop of `governanceIndependenceErrors` and the shell folder of R12 (d). | P1 | AC2, AC3, AC13 |
| R5 [C20; C21; C26; C35] | **Proof.** The eight GOV-943 cases of AC1–AC6 and AC13 (revision 2 adds GOV-943-HOOK-TARGET-SPELLING-DENY) live in the new `scripts/workflow-gates/shell-mutation.selftest.mjs`, listed in `publication.json`; no existing self-test file changes. | P1 | AC6 |
| R6 [C28; C29; C30; C31; C32; C33; C45; D7; D9] | **Rebases (approver).** After approving 943, the approver appends a `scope` entry by 943's contract to the `review.rebases` of the 935, 940 and 941 contracts, each with `## Changed scope files` evidence listing the files of this task's diff that the rebased contract scopes (for 935 and 940: `scripts/workflow-gates/security-hook.mjs`, `scripts/workflow-gates/publication.json`, `scripts/workflow-gates/contract.mjs`, `scripts/workflow-gates/cli.mjs` (C53), `.claude/rules/review/03-decision-closure.md`, and for 935 also `.claude/rules/create/03-publication.md` (C58); for 941: the first two), and recomputes nothing else in them. The approver also appends a `rules` entry by the 935 contract to the `review.rebases` of `tasks/Sprints/Sprint_78_Task_923_security_record_owner_fixes.security.json` and `tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json` (C54–C56), each with `## Changed rule files` evidence listing `.claude/rules/shared/` `security-testing.md`, `workflow-gates.md`, `workflow-contract.md`, `workflow-evidence.md`, `workflow-ci.md` and `git-publication.md`, the base-bytes digest match of the d14 probe rerun at that time, and `cli.mjs verify --contract <that contract>` exit 0 with the development project identity (C51). | P1 | AC7 |
| R7 [C37; C38; C39; C45; C48; C49; C50; C51; C52; D12] | **Case-test rebase.** `contract.mjs` implements section 5b: `rebaseChain` accepts `kind: 'tests'`, `rebaseChainErrors` validates it with the new exported `testsEntryErrors`, and the new exported `testsRebaseFiles` reads `## Changed case test files`; `scopeEntryErrors` is unchanged. In `cli.mjs`, `diffRebaseErrors` reads the listed files of a `tests` entry with `testsRebaseFiles` (today it knows only `rules` and `scope` lists, C52), so its diff-base check that no file other than the listed ones changed since the review covers `tests` entries; nothing else in `cli.mjs` changes apart from R11. The file `03-decision-closure.md` is 7879 bytes against the 8 KiB limit, so its "Governance approval path" and "Scope rebase" paragraphs (C45) move unchanged to new `.claude/rules/review/04-contract-rebases.md`, which `03-decision-closure.md` R7 names in one sentence, and that new file gains one paragraph stating D12: who writes the entry (the approver, never the implementer), its two evidence sections, the approver's
`cli.mjs verify` run of the rebased contract after the entry, exit 0 to keep it (section 5b), and that removing, renaming or weakening a case is never rebased but needs a revision of the owning task. | P1 | AC8 |
| R8 [C42; C43; C46; C47] | **Tracked exempting contract.** When `<root>/.git` exists (file or directory), `governanceIndependenceErrors` exempts a contract path and its evidence only when the contract file is tracked at `HEAD`: `execFileSync('git', ['cat-file', '-e', 'HEAD:' + path], { cwd: root, stdio: 'ignore' })`, no shell; a non-zero exit or a spawn error exempts nothing. When `<root>/.git` does not exist, the exemption is unchanged: the fixture roots of the existing Task 935/940 hook self-tests are plain temporary folders (C46), and the project root always has `.git` (C47). | P1 | AC9 |
| R9 [C41; C44; C58; D14] | **Closure rules.** `03-decision-closure.md`: (a) every note of an `APPROVED WITH NOTES` review is, before the verdict, either fixed in the cycle, written as an R/AC into a named saved kickoff (its path in the note), or a `BLOCKED` owner question; a note kept only in a review file is an incomplete review; (b) a task whose objective is a CI job is approved only after `ci-status.mjs --pr <n>` (or exact-SHA `ci-status.mjs`) shows that job green on the reviewed SHA; before that the decision is `PARTIALLY VERIFIED`; (c) owner D14, in `03-decision-closure.md` and in C7 of `.claude/rules/create/03-publication.md`: a design, review or self-audit session writes and verifies every kickoff revision, new route and cross-task text correction it finds necessary before its final handoff, or names it `BLOCKED` with the missing owner decision; a final report that lists such work as not yet done is an incomplete handoff, and a `draft` sidecar is not a substitute for the revised text. Both files stay at or under 8 KiB (`validateRuleSizes`). | P1 | AC10 |
| R10 [C35] | **Proof of R7, R8 and R11.** The five new GOV-943 cases live in new `scripts/workflow-gates/case-test-rebase.selftest.mjs`, listed in `publication.json`; no existing self-test file changes. | P1 | AC11 |
| R11 [C50; C54; C55; C57; C59] | **Reviewed-contract freshness.** New exported `reviewedFreshnessErrors(root, selected, { files, readBase })` in `cli.mjs` returns, for every path of `allContracts(root)` not in `selected` whose contract has stage `reviewed`, the errors of `scopeHashErrors(root, contract, contract.review.scopeSha256, 'Independent review scope is stale')` and, for its report, of `scopeHashErrors(root, contract, report.scopeSha256, 'Security report scope hash is stale')`, each prefixed with the path; an unreadable contract or report is a named error. It also returns `reviewed contract removed: <path>` for every path of `files` under `tasks/` ending in `.security.json` that is absent at head and whose base contents (`readBase`) parse to stage `reviewed`, unless a contract with the same file name exists at head under `tasks/` with stage `reviewed` (a move to the archive, or a revision under the same kickoff name, whose own freshness `validateDiff` or this function checks); today a deleted contract is checked by nothing (C59), and deleting a stale reviewed contract is never a way around its rebase. The `diff` command calls it at phase `release` with the paths `validateDiff` selected, the changed `files` and `gitBaseReader(ROOT, base)`, and adds its errors; `validateDiff` itself is unchanged, so no existing self-test changes (C57). | P1 | AC12 |
| R12 [C60; C61; C62; C63; C64; C65; C66; C67; C68; C69; C70; C71; C72; C73; C74; C75; C76; C77; C78; C79; C80; C81; C82; C83; C84; C85; C86; C87; C88; C89; C90; C91; C92; C93; C94; C95; C96; C97; C98; C99; C100; C101; C102; C103; C104; C105; C106; C107; C108; C109; C110; C111; C112; C113; C114; C115; C116; C117; C118; C119; C120; C121; C122; D13; D14] | **Target spellings (revision 2; (g) revision 3).** Every target the hook derives — of `shellWriteTargets` and the Write/Edit paths of both consumers (C84) — also covers the spellings that reach the same file: (a) on win32 only, `projectPath`, in this order: maps a leading `/<letter>/` to `<letter>:/` (MSYS, C87, C98); removes a leading `\\?\`, `\\.\`, `//?/` or `//./` (C91, C92); maps a leading `\\<any host>\<letter>$\` or `//<any host>/<letter>$/` to `<letter>:/` (C93; a share of another machine is then reported as the local drive, fail-closed); removes every trailing dot and space of the last segment and one trailing dot of every other segment, never changing a segment `.` or `..` (C75, C76; two dots or a dot and a space before a separator write nothing in PowerShell, review 2 second self-audit; Git Bash then writes a separate file, C77, which is reported as the plain name, fail-closed); resolves the result against its folder of (c)/(d); and canonicalises both the root and the deepest existing ancestor with `realpathSync.native` instead of `realpathSync` (C73, C83) **before** deciding inside or outside the root, so an 8.3 alias in any segment, the root's parents included, a junction and a symbolic link reach the long canonical path (C70–C74, C88–C90, C99; today the lexical outside test runs first, C83); when no ancestor exists (a missing drive) the lexical result stays, as `diff-hook.selftest.mjs` requires (C100); elsewhere `projectPath` is unchanged; only **write positions** are widened, never every path a command mentions: W1 redirection targets, W2 the path positions (positionals and `-Path`/`-LiteralPath`/`-FilePath` values) of `Set-Content`, `Add-Content`, `Out-File` and the section 5 `Clear-Content` row, W3 the literal path arguments of the API write calls of C2 and R3 (`writeFileSync('x'`, both arguments of `copyFileSync('a','b')`/`renameSync`, `[IO.File]::WriteAllText('x'`, `Path('x').write_text`, …), and the section 5 targets; the C2 list of mentioned paths keeps today's result, normalised by (a) (review 2 sixth check: re-resolving every mentioned word reported `.claude/settings.json` read through `require(…)` as written); (b) a W1 target found by the quote-aware parser of a parseable command, a W2 path or a section 5 target containing `*`, `?` or `[` adds every path `fs.globSync` returns for it with `cwd` set to its folder of (c)/(d) (C60–C63, C86; on win32 case-insensitive, as PowerShell is); a target found by the raw-text regex is never expanded, as that regex also finds `>` inside quoted text such as a grep pattern `-->`; (c) write positions are resolved against the folder current at their simple command: a simple command `cd`, `chdir`, `pushd`, `Set-Location`, `sl` or `Push-Location` (case-insensitive) with a folder (first positional or `-Path`/`-LiteralPath` value; `-`, `~` or a `$` folder change nothing) moves it for the later simple commands, the folder normalised as in (a) and resolved with `path.resolve` from the previous one, starting at each folder of (d), so an absolute folder replaces it (C64–C67); for a command the parser rejects, or one that starts a nested shell or interpreter (`bash`, `sh`, `cmd`, `powershell` or `pwsh` with `-c`, `/c` or `-Command`; `node` or `python` with `-e` or `-c`), every folder-change word of the raw text, inside quotes included, and `process.chdir('…')`/`os.chdir('…')` add folders, in order, for the raw-text write positions (regex redirection targets with (f), and W3) (C94–C96, C101); (d) `governanceIndependenceErrors` also resolves the write positions and Write/Edit paths of each tool call against the `cwd` of the transcript entry holding its `tool_use`, and the pre-write guard against the event's `cwd` (C85; documented as the working directory when the hook runs, following `cd`, C107), each whenever it is an absolute path, also one outside the root, because a relative target from an outside folder can still lead into the project and a result outside the project never matches a scope (C68, C69; review 2 fourth self-audit); (e) W2 and W3 are targets for every command that is not read-only, so `Set-Content package.json x` (C79), `node -e "require('fs').writeFileSync('package.json','x')"` (C80) and a bare scope or evidence file name written by `node -e` after a folder change count although no C82 folder prefix occurs (C81, C82); (f) a raw-text redirection target also counts with its leading and trailing `'` and `"` removed, as a nested shell leaves the closing quote on it (C94, C95); (g) (revision 3, C108–C120) the Bash `>\|` redirection, with an optional stream number prefix (`2>\|`, C109) and optional spaces or tabs before its word, is a W1 redirection whose target is that word with its quotes removed (C108–C110, C113): in a command the 941 parser accepts it is found quote-aware at an unquoted `>` directly followed by an unquoted `\|` (941 R1 (b) splits there, so the word is the first word of the next simple command, C114) and gets (c) at the simple command holding the `>`, so `cd .git; grep -c a ../README.md >\|head` reports `.git/head` (C112); in a command the parser rejects, the raw-text redirection regex also matches `>\|` and the word after it, with (c) and (f); a quoted `>\|` is no redirection of a parsed command (C111, C117), while the raw-text match of a rejected command also finds one inside quoted text, fail-closed like the existing `>` regex (C119, where the prototype used the raw-text match for every command that is not read-only, an upper bound). Resolution against the root always stays; each addition is skipped when that target is already reported, so a command that (a)–(g) do not touch keeps its result and order. The targets of a read-only command (941 R2) get (a), (b) and (d) only, and its `>\|` targets also (c) and (g). Feasibility (`docs/sessions/evidence/task943/design/p12-r12-prototype.mjs` with `p12-r12-additions.txt`, a design prototype on a copy of the hook): every AC13 and audit form passes (C101, C106), the five hook-importing self-test files pass unchanged (C102), and over a frozen corpus of 2318 session commands it adds targets for 68 commands (C103), refuses 1 executor command allowed today (C104) and adds 1 governance scope file (C105), both for one command whose text contains a redirection into the hook file inside a quoted string, a class the hook already reports in today's spelling. Feasibility of (g): `docs/sessions/evidence/task943/design/p14-noclobber-prototype.mjs` with `p14-noclobber-run.txt`, a wrapper around the 941 revision 2 `shellWriteTargets` (C116–C120); (a)–(f) alone miss every AC13 form of (g) and (c) resolves its word once it is a W1 target (C121, C122). | P1 | AC13 |

## Acceptance criteria

For the cases, X is a fixture governance scope file, Y a readable fixture file, D a fixture directory holding X, and Z a path outside
every scope.

- **AC1 [R1; R2].** GOV-943-HOOK-SOURCE-ALLOW passes: `cp X Z`, `cp X C:/outside/x.mjs`, `Copy-Item -Path X -Destination Z`,
  `install X Z`, `ln -s X Z`, `dd if=X of=Z` and `tee Z < X` report no X target; the read-only commands of GOV-941-HOOK-READONLY-ALLOW
  still report `[]`; `governanceIndependenceErrors` for a transcript of all of them is `[]`. `node scripts/workflow-gates/selftests.mjs`
  shows every GOV-941 case passing with `git diff --exit-code` on `scripts/workflow-gates/shell-write.selftest.mjs`.
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
- **AC11 [R10].** `node scripts/workflow-gates/selftests.mjs` exits 0 with at least the base count after 941 plus 13 passing tests and
  0 skipped; `cli.mjs governance-report` passes all thirteen GOV-943 cases (revision 2 adds AC13's case).
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
  and `echo x > check-example.mjs` returns `POLICY-EDIT AUTHORITY REQUIRED`; executor PreToolUse events `Set-Content package.json x`,
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
- **AC7 [R6].** After the approver's rebases, the scoped harness of Task 940 AC7 (`validateDiff` and `changedFiles` from
  `scripts/workflow-gates/cli.mjs`, phase `release`, base `origin/main`, working tree) reports no error for the 935, 940, 941, 943,
  923 owner-fixes and 927 contracts, and `reviewedFreshnessErrors` for that selection returns `[]`; `cli.mjs verify` of the 923
  owner-fixes and 927 contracts exits 0 with the development project identity (the only step of this task that uses credentials and
  the network: the approver's, never a case fixture).

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | The shell write detection `shellWriteTargets` (C1, C2) and its two consumers: the governance independence check of the Stop hook (`governanceIndependenceErrors`, C3) and the pre-write guard (`evaluateHook` PreToolUse, C4, C19); the CI policy-diff check of `validateDiff` (C20) as the preserved outer layer. Owner: Opus (D1). |
| Frontend security | Governance has no browser consumer; the hook layer replaces this row: GOV-943-HOOK-SOURCE-ALLOW, GOV-943-HOOK-PROGRAM-DENY, GOV-943-HOOK-DIRECTORY-DENY, GOV-943-HOOK-API-DENY, GOV-943-HOOK-PRETOOL-DENY, GOV-943-HOOK-MALFORMED-ERROR and GOV-943-HOOK-TARGET-SPELLING-DENY on the real `shellWriteTargets`, `governanceIndependenceErrors` and `evaluateHook` with synthetic transcripts, contracts and fixture directories. |
| Server security | The CI layer replaces this row: GOV-943-CI-DELETE-DENY on the real `validateDiff` with a fixture root; GOV-943-TESTS-REBASE-ALLOW, GOV-943-TESTS-REBASE-DENY and GOV-943-TESTS-REBASE-ERROR on the real `testsEntryErrors`, `rebaseChainErrors`, `validateContract` and `validateDiff` (its `diffRebaseErrors` anchor check); GOV-943-CI-STALE-REVIEW-DENY on the real `reviewedFreshnessErrors` and `scopeHashErrors`; the hook layer adds GOV-943-EXEMPT-UNTRACKED-DENY on the real `governanceIndependenceErrors` in a fixture Git repository. |
| Database/integrations | Not applicable: no database, Storage, Realtime or provider path. |
| Cases | The thirteen GOV-943 cases of the sidecar, each with actor, resource, input, response and forbidden effects; allow, deny and error outcomes; hook and CI layers. |
| Fixtures and environment | Temporary directories from `mkdtempSync` as the project root, synthetic contracts, transcripts, files and directories; no credentials, no network, no repository writes outside temporary folders. |
| Sensitivity proof | Critical cases GOV-943-HOOK-PROGRAM-DENY, GOV-943-HOOK-PRETOOL-DENY, GOV-943-TESTS-REBASE-DENY, GOV-943-EXEMPT-UNTRACKED-DENY, GOV-943-CI-STALE-REVIEW-DENY and GOV-943-HOOK-TARGET-SPELLING-DENY: the breaks named in AC2, AC3, AC8, AC9, AC12 and AC13; baseline pass, isolated break failing with an assertion, restored pass; artifacts under `docs/sessions/evidence/task943/sensitivity/`. |
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
3. **Opus implementer, fresh session** (D1; not the designer of this kickoff, not the Task 941 review 2 session and not the Task 941 review 3 session): read this
   kickoff and its bundle; save the base run of `selftests.mjs` to
   `docs/sessions/evidence/task943/impl/base-runs.txt` before the first write. Implement R1–R4 and R12, then R5 with the eight cases, then
   R7–R11 with the five new cases. Record `implementation: { "role": "Opus" }`, stage `implemented`, `report` and `sensitivity` in
   the sidecar; run the six sensitivity breaks and keep their artifacts; rerun the p01, p02, p09, p11 and p14 probes (AC2, AC3, AC13; p09,
   p11 and p14 from native PowerShell with Git Bash installed at `C:\Program Files\Git\bin\bash.exe`). Do not write R6: the approver does. Work on the hook
   file through the Edit tool: a shell command that copies or rewrites the hook is itself a write the hook now detects.
4. Run `cli.mjs governance-report` and every AC command; write the completion report, including the out-of-scope write forms that
   stay undetected (section 4); end with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` and the explicit-path commit command for the
   owner. No push.
5. **Opus approver, another fresh session** (D2; none of the sessions named in step 3): review R1–R12; on approval write the `review` block and stage `reviewed`, write R6
   with its five evidence files, run AC7, and hand off the explicit-path commit under `shared/git-publication.md`. PR #12 merges only
   after green PR checks (D7).

## 8. Completion report

Per requirement: changed files, evidence path, status; each GOV-943 case with its result; the six sensitivity diffs with the failed
assertion; base and final self-test totals; the p01/p02/p09 probes before and after; the AC13 short-name line; proof that no existing self-test file changed; the
write forms that stay undetected; one of `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 9. Rule compliance

| Rule | How this kickoff complies |
|---|---|
| `claim-evidence-contract.md` | Every R cites ledger rows; sources are retained snapshots and executed probes under `docs/sessions/evidence/task943/design/`. |
| `security-testing.md` | Governance contract: hook and CI layers, allow/deny/error, sensitivity for the five critical cases, Q1. |
| `role-boundaries.md` | Opus implements policy (D1); Sonnet is not routed; approval by an independent session (D2). |
| `git-publication.md` | Task-branch commit on PR #12's branch (D7); merge only after green checks. |
| `mobile-adaptation-contract.md` | No visible scope: `Scope: none`. |

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31, C32, C33, C34, C35, C36, C37, C38, C39, C40, C41, C42, C43, C44, C45, C46, C47, C48, C49, C50, C51, C52, C53, C54, C55, C56, C57, C58, C59, C60, C61, C62, C63, C64, C65, C66, C67, C68, C69, C70, C71, C72, C73, C74, C75, C76, C77, C78, C79, C80, C81, C82, C83, C84, C85, C86, C87, C88, C89, C90, C91, C92, C93, C94, C95, C96, C97, C98, C99, C100, C101, C102, C103, C104, C105, C106, C107, C108, C109, C110, C111, C112, C113, C114, C115, C116, C117, C118, C119, C120, C121, C122; owner decisions: D1, D2, D7, D9, D11, D12, D13, D14; blocked claims: NONE.
