# Task 941 — completion report (Opus governance implementer, D1, 2026-11-02)

Kickoff: `tasks/Sprints/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.md`
(kickoff digest `d60062b2418f884a6ebd2fdff0da15858e5193c696fd247a47fd57a99f951749`, committed in `2c8c51adf`).
Session: a fresh implementation session; it did not design the kickoff and must not approve it (D2).
Platform: native Windows 11, PowerShell 5.1 and Git Bash, Node v22.22.3, branch `task/935-governance-approval-route`,
head `8ba241ccb28091372d4067d50d6813ce6eaaa90f`.

## Prerequisite (route step 2)

The archived Task 940 sidecar reads `"stage": "reviewed"` (as does the 935 sidecar), and `git status --short tasks/`
showed neither of them as changed or untracked before the first write (only the unrelated untracked Task 926 kickoff).

## Base run (before the first write)

`docs/sessions/evidence/task941/impl/base-runs.txt`: `node scripts/workflow-gates/selftests.mjs`: 173 pass, 0 fail,
0 skipped, exit 0.

## Requirements

| R | Changed files | Status | Evidence |
|---|---|---|---|
| R1 classification | `scripts/workflow-gates/security-hook.mjs`: exported `isReadOnlyShellCommand` with `shellCommands` (quote-aware split), `redirections`, `readOnlySimpleCommand` | IMPLEMENTED (with the hardening in note 1) | GOV-941-HOOK-READONLY-ALLOW, -WRITE-DENY, -MALFORMED-ERROR |
| R2 targets | `security-hook.mjs`: `shellWriteTargets` returns the unquoted `>`/`>>` targets for a read-only command, plus the project file path a target ends with (note 2); otherwise its previous logic runs unchanged | IMPLEMENTED | GOV-941-HOOK-WRITE-DENY; GOV-941-HOOK-MALFORMED-ERROR compares with an inline copy of the pre-change logic |
| R3 consumers | `git diff --numstat` of the hook is `90 1`: the one removed line is the write-word branch, whose inline path pattern moved unchanged into the constant `PROJECT_FILE` (shared with note 2); `governanceIndependenceErrors` and the PreToolUse guard still call `shellWriteTargets` | IMPLEMENTED | equality with the inline pre-change copy in GOV-941-HOOK-MALFORMED-ERROR; GOV-941-HOOK-PRETOOL-DENY; `diff-hook.selftest.mjs` and `governance-contract.selftest.mjs` pass unchanged |
| R4 proof | new `scripts/workflow-gates/shell-write.selftest.mjs` (five cases); `scripts/workflow-gates/publication.json` lists it | IMPLEMENTED | `governance-report.json` passed; `publication.mjs --base HEAD`: 83 files, 0 dependency errors |
| R5 rebases | none (approver only) | NOT WRITTEN BY DESIGN | the approver writes the `scope` entries of the 935 and 940 contracts and `docs/sessions/evidence/task941/review/scope-rebase-935.md`, `…/scope-rebase-940.md` |

Sidecar: stage `implemented`, `implementation.role` `Opus`; planned fields unchanged.

## Cases (`node scripts/workflow-gates/cli.mjs governance-report --contract <sidecar>`)

| Case | Layer / outcome | Result |
|---|---|---|
| GOV-941-HOOK-READONLY-ALLOW | hook / allow | passed: the seven AC1 commands give `true` and `[]`; `governanceIndependenceErrors` for a contract scoping their files is `[]`; a read-only `grep … 2>&1 > docs/out.txt` reports only `docs/out.txt` |
| GOV-941-HOOK-WRITE-DENY (critical) | hook / deny | passed: the eight AC2 variants and eight more read-only redirection forms (`>>`, `2> "X"`, `>&X`, `<>X`, `*> 'X'`, `> $PWD/X`, `> /c/…/lero-al/X`, PowerShell `> $pwd\…\X`) report X and a `GOVERNANCE INDEPENDENCE` error for X |
| GOV-941-HOOK-MALFORMED-ERROR | hook / error | passed: unterminated single and double quote, backtick, `$(…)`, `<(…)`, heredoc and the seven hardening forms of note 1 give `false` and the pre-change targets (X included); `undefined`, `null`, `42`, `{}`, `['grep']` give `false`; `sed -i`, `git log --output`, `git grep -O`, `git grep --open=…`, `git grep -lO…`, `rg --pre-glob`, `rg --hostname-bin`, `sed -n 1w` keep the pre-change result |
| GOV-941-HOOK-PRETOOL-DENY | hook / deny | passed: the executor `Select-String` search returns `[]`; the chained `Set-Content` and a redirection into the policy file return `POLICY-EDIT AUTHORITY REQUIRED` |
| GOV-941-CI-POLICY-DENY | ci / deny | passed: `validateDiff` on a fixture root refuses the changed hook file at phases `verify` and `release` |

## Sensitivity (critical case)

`docs/sessions/evidence/task941/sensitivity/GOV-941-HOOK-WRITE-DENY.txt`, recorded in `sensitivity.json`. Break (AC2):
`commands.every(readOnlySimpleCommand)` → `commands.slice(0, 1).every(readOnlySimpleCommand)` in `isReadOnlyShellCommand`.
Baseline `ok 1`, exit 0; mutant `not ok 1`, `code: 'ERR_ASSERTION'`, failing on
`grep -n 'writeFileSync' scripts/workflow-gates/reader.mjs; node -e "require('fs').writeFileSync('scripts/workflow-gates/example.mjs', 'x')": []`,
exit 1; restored `ok 1`, exit 0. Hook and test-file sha256 are identical before the break and after the restore.

## AC commands

| AC | Command | Result |
|---|---|---|
| AC1 | p01 probe rerun, output in `docs/sessions/evidence/task941/impl/p01-after.txt` | lines 2–5 and 10 `[]`; lines 6–8 unchanged; line 9 see finding F2 |
| AC4 | `git diff --exit-code` on every tracked `scripts/workflow-gates/*.selftest.mjs` | exit 0 (no existing self-test changed) |
| AC5 | `node scripts/workflow-gates/selftests.mjs` | 178 pass (173 + 5), 0 fail, 0 skipped, exit 0 |
| AC5 | `node node_modules/eslint/bin/eslint.js --config scripts/workflow-gates/eslint.config.mjs scripts/workflow-gates` | exit 0 |
| AC5 | `node scripts/workflow-gates/check-workflow.mjs` | `Workflow structure and hook registration passed.`, exit 0 |
| AC5 | `node scripts/workflow-gates/publication.mjs --base HEAD` | `83 explicit files, 0 dependency errors`, exit 0 |
| AC5 | `cli.mjs governance-report --contract <sidecar>` | five PASS, `Governance report: passed`, exit 0 |
| AC5 | `cli.mjs verify --contract <sidecar>` | exit 0 at stage `implemented` |
| AC5 | `npm run check:kickoff-evidence`; `node scripts/check-kickoff-evidence.mjs --files <kickoff>` | PASS (0 changed); PASS (1 verified) |
| AC6 | approver only | not run by the implementer |

## Self-audit at the owner's request (same session, 2026-11-02)

The owner asked this session to check its own work. It is not an independent review and grants no approval (D2).
Three defects of the first candidate were found, fixed, covered by new assertions, and each fix was shown to be
needed: with it removed, the new assertions fail (`not ok` with an assertion, then restored).

| # | Defect of the first candidate | Fix | Proof |
|---|---|---|---|
| S1 | Security regression: `grep writeFileSync x > $PWD/scripts/check-x.mjs` really writes a policy file; before Task 941 the write-word branch reported `scripts/check-x.mjs`, the first candidate only `$PWD/scripts/check-x.mjs` (no policy path), so the pre-write guard would let Sonnet write it. Same for `~/…` and Git Bash `/c/…` targets (EXECUTED probe) | for a read-only command, each target also reports the project file path it ends with (`PROJECT_FILE_SUFFIX`) | WRITE-DENY `$PWD`, `/c/…`, `$pwd\…` variants; with the suffix match removed GOV-941-HOOK-WRITE-DENY fails on the `$PWD` variant |
| S2 | `rg --hostname-bin <program>` runs a program but was classified read-only | `--hostname-bin` refused like `--pre` | MALFORMED `rg --hostname-bin`; with the check removed GOV-941-HOOK-MALFORMED-ERROR fails |
| S3 | PowerShell splits words at U+00A0 and other Unicode whitespace (EXECUTED: `Write-Output first<U+00A0>second` prints two arguments), so `rg a<U+00A0>--pre=x` hid `--pre` inside one word | unquoted whitespace other than space, tab and line breaks makes a command unclassifiable | MALFORMED `rg a<U+00A0>--pre=x`, `grep …<U+2028>Set-Content …` |

Each break was applied alone with the Edit tool and restored; the hook sha256 after the restores equals the
final candidate `86d020c1003e3b4d620b20d69fe58f6d3dec65c785c03d95af5111248ee16748` bound by the sensitivity artifact:
S1 → WRITE-DENY `not ok` on `grep -n 'writeFileSync' … > $PWD/scripts/workflow-gates/example.mjs`; S2 → MALFORMED
`not ok` on `rg --hostname-bin scripts/workflow-gates/example.mjs a # writeFileSync`; S3 → MALFORMED `not ok` on
`rg a<U+00A0>--pre=x scripts/workflow-gates/example.mjs # writeFileSync`.

Live hook (the registered `.claude/settings.json` PreToolUse hook running this candidate in this session):
`grep -c -E 'writeFileSync|Set-Content' src/app/layout.tsx` (Bash) and `Select-String -Pattern 'Set-Content' -Path
src/app/layout.tsx` (PowerShell) ran; before Task 941 the same shape was refused as `ORCHESTRATOR BOUNDARY` (C11).
Commands of this session that were not read-only (`node -e` with a write word and an `src/` path, a heredoc, a
command with `echo`) were still refused as `ORCHESTRATOR BOUNDARY`.

Linux: CI runs `selftests.mjs` on `ubuntu-latest` (Governance Check) and on `windows-latest` (Windows Hook Tests); no
Linux runtime is available here (WSL has no distribution, no Docker). The Windows-shaped test inputs (`/c/…`,
`$pwd\…`) were traced through `projectPath` for POSIX paths (ANALYTICAL: both still yield X through the suffix
match); the PR checks execute them.

The first report also claimed that `git diff --outp=…` is accepted; executed, `git diff` rejects it (exit 129). Executed
on this Git: `git grep --open=uname`, `git grep -Ouname` and `git grep -lOuname` run `uname`, so the abbreviation and
bundle refusals of note 1 are needed for `git grep`. After the fixes every check above was rerun on the final
candidate (sensitivity, p01 probe, full self-tests, lint, workflow, publication, governance report, verify).

## Notes and findings for the approver

1. **Hardening beyond the literal R1 (a)** (fail-closed only: such commands keep the pre-change detection exactly).
   Read literally, R1 classifies as read-only commands that run a write in at least one of the two shells, because the
   hook classifies a command without knowing which shell runs it. `shellCommands` therefore also returns "not
   classifiable" for: a backslash directly before a quote (Bash escape, PowerShell literal; EXECUTED: Bash runs the
   middle command of `echo a\' x; echo SECOND; echo b\' y`, which the literal R1 would hide inside one quoted span); the
   typographic quotes U+2018–U+201E (EXECUTED: PowerShell closes `'a’` and runs the following command); an unquoted `@`
   before a quote (PowerShell here-strings, inside which `'` does not end the string); an unquoted `(` or `{`
   (`Select-String -Path (Set-Content X x)` and `Select-Object -Property {Set-Content X x}` run the write); and unquoted
   whitespace other than space, tab and line breaks (S3). For `git`, the excluded options are widened to every argument
   starting `-O` or a short bundle containing `O`, and to abbreviations of `--output`/`--open-files-in-pager` (EXECUTED
   for `git grep`, see above). For `rg`, `--hostname-bin` is refused like `--pre` (S2). Each form is asserted in
   GOV-941-HOOK-MALFORMED-ERROR. None of the AC1 commands is affected.
2. **Target suffix (S1), beyond the literal R2.** R2 says the read-only targets are resolved through `projectPath`.
   The hook cannot expand `$PWD`, `~` or a Git Bash drive path, so each target also reports the project file path it
   ends with; that path is the same one the write-word branch reported before this task. This adds targets and never
   removes one.
3. **F2 — AC1 conflicts with R2 on probe line 9.** AC1 expects unchanged targets on lines 6–9, but line 9 is
   `grep -n 'writeFileSync' scripts/workflow-gates/cli.mjs > scripts/workflow-gates/publication.json`, a read-only
   command under R1, for which R2 requires only its redirection target. It now reports
   `["scripts/workflow-gates/publication.json"]` instead of the previous three targets (the read `cli.mjs` and the bogus
   `publication.js` are gone; the real write stays detected, as AC2 `grep -n 'a' Y > X` also asserts). The
   implementation follows R2.
4. **F3 — the design probe cannot run as saved.** `docs/sessions/evidence/task941/design/p01-false-positive-probe.mjs`
   exits 1 with `ENOENT` for `tasks/Sprints/Sprint_92_kickoff_prompt_Task_940_…security.json` (archived to
   `tasks/Archive/` in `01b8259fa`), and on success it would overwrite the design artifact `p01-false-positive-probe.txt`.
   The design files are outside this scope and unchanged; `p01-after.txt` documents the run with exactly two asserted
   substitutions (archived path; no self-write).
5. Not changed, as scoped: write programs without a write word (`cp`, `mv`, `tee`, `sed -i`) keep today's result (Task
   943); the PowerShell hooks under `.claude/hooks/` keep their own parsers.
6. Residual limits, unchanged from before this task: a relative target after `cd`/`Set-Location` in the same command
   (`cd scripts; grep a b > check-x.mjs`) is resolved from the project root, and a target with no project directory in
   its text (`> $PWD/CLAUDE.md`, `> $f`) cannot be resolved; `cat x >| y` is not read-only and its pre-change
   result has no target (the old redirection pattern does not match `>|`). The pre-change function missed all of these.
7. Usability as specified: `echo`, `node`, `npm` and every other program outside the R1 list keep the pre-change
   result, so `grep … ; echo …` naming a product path with a write word is still refused for Opus. Widening the list
   would reduce detection and needs a design decision.
8. Task 943 (planned, ready) builds on 941: its R1 refers to the commands 941 rejects as unparseable. Notes 1–2 make
   that set larger than the literal R1 (a); its designer and the 941 approver should confirm 943's equality case
   against this candidate.

IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW
