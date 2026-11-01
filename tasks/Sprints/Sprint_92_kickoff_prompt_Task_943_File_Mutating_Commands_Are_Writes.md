# Task 943 — Commands that copy, move, delete or edit files in place are counted as writes by the security hook

Sprint 92. P1. QA profile **Q1** (non-UI gate code and its tests, `docs/qa-profiles.md`). Kickoff by Opus, 2026-11-01, at the
owner's instruction to close the gap that Task 941 leaves out of scope (D11).

## 1. Mode, task type and rule bundle

Governance task. **Implementer: Opus, in a fresh implementation session started for this task (D1); Sonnet does not execute it**,
because every path in scope is a policy path (C36). **Approver: Opus, in another fresh session that wrote none of the scope files
(D2).** Neither may be the session that designed this kickoff. Types (`docs/rule-index.md`): workflow gates / governance tooling.
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

## 3. Verified context

`shellWriteTargets` (C1) reports targets only for its write words (C2) and redirections; the independence check (C3) and the
pre-write guard (C4) consume it. An executed probe on the real function at HEAD `01b8259fa` (C34) shows twenty mutating forms with
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

## Mobile adaptation record
- Scope: none

## 4. Scope and out of scope

In scope (the implementer writes exactly these): `scripts/workflow-gates/security-hook.mjs`, new
`scripts/workflow-gates/shell-mutation.selftest.mjs`, its entry in `scripts/workflow-gates/publication.json` (C35), the
stage/implementation/report/sensitivity fields of this task's `.security.json`, and the evidence files
`docs/sessions/evidence/task943/impl/completion-report.md`, `docs/sessions/evidence/task943/impl/governance-report.json`,
`docs/sessions/evidence/task943/impl/base-runs.txt`, `docs/sessions/evidence/task943/impl/probes-after.txt`,
`docs/sessions/evidence/task943/sensitivity/sensitivity.json`, `docs/sessions/evidence/task943/sensitivity/GOV-943-HOOK-PROGRAM-DENY.txt`
and `docs/sessions/evidence/task943/sensitivity/GOV-943-HOOK-PRETOOL-DENY.txt`. Written by the approver only (R6): `scope` entries in
the `review.rebases` of the 935, 940 and 941 contracts with evidence `docs/sessions/evidence/task943/review/scope-rebase-935.md`,
`…/scope-rebase-940.md` and `…/scope-rebase-941.md`.

Out of scope: product code; every existing self-test file, including Task 941's `shell-write.selftest.mjs` (C26), which must pass
unchanged; `isReadOnlyShellCommand` and its allowlist (941); mutating Git commands, already refused by their own hook (C22); the
PowerShell hooks under `.claude/hooks/`; writes that no command text can reveal: a script file run by an interpreter (`node x.mjs`,
`python x.py`), `perl -i`, editors, and programs not listed in section 5. These remain undetected; the completion report lists them.

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
| `Clear-Content`, `clc`, `sc`, `ac` | Every positional and `-Path`/`-LiteralPath` value. |
| `Rename-Item`, `ren`, `rni` | The `-Path`/first positional and the sibling named by `-NewName`/second positional. |
| `xargs` followed by any program above, or `find` with `-delete`, `-exec`, `-execdir` or `-ok` | Every project path named in the simple command and every file under each named project directory. |

"Every file under a directory" walks the project directory recursively but never enters `node_modules/` or `.next/` (generated
trees, reported as the directory path itself); `.git` and anything under it are reported as given, so the existing Git-metadata
refusal of the pre-write guard still applies.

## 6. Current and required behaviour

Preserved: every target reported today stays reported (write words, redirections; C2, C14, C19); `isReadOnlyShellCommand` and the
result for read-only commands (941); the CI policy-diff check (C20); both consumers (C3, C4) unchanged in code. Changed: the files
changed by the commands of section 5 and by the API words of R3 are reported as targets, so the independence check counts them and
the pre-write guard decides on them exactly as on a `Set-Content` write.

## Requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| R1 [C24; C25; C27] | **Prerequisite and preservation.** Task 941 is reviewed and committed before the first write. For every command, the new result is a superset of the 941 result; for commands that 941 R1 (a) rejects as unparseable, the result is the 941 result plus, only when a program name of section 5 occurs in the command as a separate word, every project path matched by the existing path pattern of the write-word branch (C2), so the 941 equality case stays green. | P1 | AC1, AC5 |
| R2 [C1; C5; C6; C7; C8; C9; C10; C11; C16; C17; C18; D11] | **Program targets.** For a parseable command that is not read-only, `shellWriteTargets` adds, for each simple command, the targets of section 5, resolved through `projectPath`; targets outside the project stay as `projectPath` resolves them and never match a scope. A missing destination or option value adds nothing and never throws. | P1 | AC1, AC2, AC3, AC5 |
| R3 [C2; C12; C13] | **API words.** The write-word test of C2 also matches `appendFile`, `appendFileSync`, `copyFile`, `copyFileSync`, `cpSync`, `renameSync`, `rmSync`, `unlinkSync`, `truncateSync`, `createWriteStream`, `fs.rename`, `fs.rm`, `fs.unlink`, `fs.truncate`, `fs.cp`, `fs.promises`, `WriteAllText`, `WriteAllLines`, `WriteAllBytes`, `AppendAllText`, `AppendAllLines`, `File]::Copy`, `File]::Move`, `File]::Delete`, `File]::Replace`, `shutil.copy`, `shutil.copyfile`, `shutil.move`, `os.remove`, `os.unlink`, `os.replace`, `os.rename` and `write_bytes`, with the existing path collection unchanged. | P1 | AC4 |
| R4 [C3; C4; C15; C19] | **Consumers.** `governanceIndependenceErrors` and the pre-write guard keep calling `shellWriteTargets`; nothing else in their code changes. | P1 | AC2, AC3 |
| R5 [C20; C21; C26; C35] | **Proof.** The seven GOV-943 cases live in the new `scripts/workflow-gates/shell-mutation.selftest.mjs`, listed in `publication.json`; no existing self-test file changes. | P1 | AC6 |
| R6 [C28; C29; C30; C31; C32; C33; D7; D9] | **Rebases (approver).** After approving 943, the approver appends a `scope` entry by 943's contract to the `review.rebases` of the 935, 940 and 941 contracts, each with `## Changed scope files` evidence listing `scripts/workflow-gates/security-hook.mjs` and `scripts/workflow-gates/publication.json`, and recomputes nothing else in them. | P1 | AC7 |

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
  `node scripts/workflow-gates/selftests.mjs` exits 0 with at least the base count after 941 plus 7 passing tests and 0 skipped (C21
  is the count before 941); `node scripts/workflow-gates/check-workflow.mjs` exits 0;
  `node node_modules/eslint/bin/eslint.js --config scripts/workflow-gates/eslint.config.mjs scripts/workflow-gates` exits 0;
  `node scripts/workflow-gates/cli.mjs governance-report --contract <this sidecar>` passes every case;
  `node scripts/workflow-gates/cli.mjs verify --contract <this sidecar>` exits 0 at stage implemented; `npm run check:kickoff-evidence`
  passes.
- **AC7 [R6].** After the approver's rebases, the scoped harness of Task 940 AC7 (`validateDiff` and `changedFiles` from
  `scripts/workflow-gates/cli.mjs`, phase `release`, base `origin/main`, working tree) reports no error for the 935, 940, 941 and 943
  contracts.

## Security test contract

| Field | Content |
|---|---|
| Assets and boundaries | The shell write detection `shellWriteTargets` (C1, C2) and its two consumers: the governance independence check of the Stop hook (`governanceIndependenceErrors`, C3) and the pre-write guard (`evaluateHook` PreToolUse, C4, C19); the CI policy-diff check of `validateDiff` (C20) as the preserved outer layer. Owner: Opus (D1). |
| Frontend security | Governance has no browser consumer; the hook layer replaces this row: GOV-943-HOOK-SOURCE-ALLOW, GOV-943-HOOK-PROGRAM-DENY, GOV-943-HOOK-DIRECTORY-DENY, GOV-943-HOOK-API-DENY, GOV-943-HOOK-PRETOOL-DENY and GOV-943-HOOK-MALFORMED-ERROR on the real `shellWriteTargets`, `governanceIndependenceErrors` and `evaluateHook` with synthetic transcripts, contracts and fixture directories. |
| Server security | The CI layer replaces this row: GOV-943-CI-DELETE-DENY on the real `validateDiff` with a fixture root. |
| Database/integrations | Not applicable: no database, Storage, Realtime or provider path. |
| Cases | The seven GOV-943 cases of the sidecar, each with actor, resource, input, response and forbidden effects; allow, deny and error outcomes; hook and CI layers. |
| Fixtures and environment | Temporary directories from `mkdtempSync` as the project root, synthetic contracts, transcripts, files and directories; no credentials, no network, no repository writes outside temporary folders. |
| Sensitivity proof | Critical cases GOV-943-HOOK-PROGRAM-DENY and GOV-943-HOOK-PRETOOL-DENY: the breaks named in AC2 and AC3; baseline pass, isolated break failing with an assertion, restored pass; artifacts under `docs/sessions/evidence/task943/sensitivity/`. |
| Execution | `node scripts/workflow-gates/cli.mjs governance-report --contract tasks/Sprints/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json`, then `cli.mjs verify` on the same path; native Windows PowerShell 5.1, Node 22.22.3; QA Q1. |

## 7. Ordered route

1. **Owner** (separate PowerShell window, `C:\Claude_Code_Projects\lero-al`): stay on `task/935-governance-approval-route` (D7);
   commit this kickoff set with the command Opus gives.
2. **Prerequisite, before the first write of step 3:** Task 941 is approved and committed: the 941 sidecar reads `"stage": "reviewed"`
   (today `planned`, C27) and `git status --short tasks scripts/workflow-gates` shows no change to the 941 sidecar or the hook file.
   Otherwise this task stops as `BLOCKED` (R1).
3. **Opus implementer, fresh session** (D1): read this kickoff and its bundle; save the base run of `selftests.mjs` to
   `docs/sessions/evidence/task943/impl/base-runs.txt` before the first write. Implement R1–R4, then R5 with the seven cases. Record
   `implementation: { "role": "Opus" }`, stage `implemented`, `report` and `sensitivity` in the sidecar; run the two sensitivity
   breaks and keep their artifacts; rerun the p01 and p02 probes (AC2, AC3). Do not write R6: the approver does. Work on the hook
   file through the Edit tool: a shell command that copies or rewrites the hook is itself a write the hook now detects.
4. Run `cli.mjs governance-report` and every AC command; write the completion report, including the out-of-scope write forms that
   stay undetected (section 4); end with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` and the explicit-path commit command for the
   owner. No push.
5. **Opus approver, another fresh session** (D2): review R1–R6; on approval write the `review` block and stage `reviewed`, write R6
   with its three evidence files, run AC7, and hand off the explicit-path commit under `shared/git-publication.md`. PR #12 merges only
   after green PR checks (D7).

## 8. Completion report

Per requirement: changed files, evidence path, status; each GOV-943 case with its result; both sensitivity diffs with the failed
assertion; base and final self-test totals; the p01/p02 probes before and after; proof that no existing self-test file changed; the
write forms that stay undetected; one of `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

## 9. Rule compliance

| Rule | How this kickoff complies |
|---|---|
| `claim-evidence-contract.md` | Every R cites ledger rows; sources are retained snapshots and executed probes under `docs/sessions/evidence/task943/design/`. |
| `security-testing.md` | Governance contract: hook and CI layers, allow/deny/error, sensitivity for both critical cases, Q1. |
| `role-boundaries.md` | Opus implements policy (D1); Sonnet is not routed; approval by an independent session (D2). |
| `git-publication.md` | Task-branch commit on PR #12's branch (D7); merge only after green checks. |
| `mobile-adaptation-contract.md` | No visible scope: `Scope: none`. |

KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C28, C29, C30, C31, C32, C33, C34, C35, C36; owner decisions: D1, D2, D7, D9, D11; blocked claims: NONE.
