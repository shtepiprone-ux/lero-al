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

First candidate status (commit `758508105`): implemented, awaiting review; review 1 found it `NEEDS REVISION`
(`docs/sessions/evidence/task941/review-1/review-1.md`). Superseded by revision 1 below.

---

# Revision 1 — completion report (Opus governance implementer, fresh session, D1, 2026-11-02)

Kickoff revision 1: `tasks/Sprints/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.md`, task digest
`f915b11baa4195025881c43197a2046da6bae7f6c17649e2a7d8b99598c96e9f` (`cli.mjs hash --task`, equal to the sidecar `taskSha256`).
Session: a fresh session started after `/clear`; it designed neither the kickoff nor its revision 1 (the review 1 session did),
so it must not approve 941 (D2). Platform: native Windows 11, Windows PowerShell 5.1.26100.9818, MSYS Bash 5.2.37, Node v22.22.3,
cwd `C:\Claude_Code_Projects\lero-al`, branch `task/935-governance-approval-route`, HEAD `ff462b0830ebdb367a5a015e80841dd33e89844b`.

## Prerequisite (route step 2, revision 1)

`git status --short` of the kickoff, its sidecar, `docs/backlog.md`, `docs/sessions/evidence/task941` and `scripts/workflow-gates`
printed nothing before the first write (the revision 1 set is committed in `c9efc9946` and `ff462b083`).

## Revision 1 base run (before the first write)

`docs/sessions/evidence/task941/impl/base-runs.txt`, heading `## Revision 1 base run`: `node scripts/workflow-gates/selftests.mjs`
on HEAD `ff462b083`: 178 pass, 0 fail, 0 skipped, exit 0 (as C47).

## Requirements

| R | Changed files | Status | Evidence |
|---|---|---|---|
| R1 (a) allowlist | `security-hook.mjs`: `UNQUOTED_CHAR`, `DOUBLE_QUOTED_CHAR`, `shellCommands` refuses every character outside the allowlist outside single quotes, `$` and `\` inside double quotes, and a `--%` word; the whole-string checks (backtick, `$(`, `<(`, `>(`, `<<`, `\` before a quote, U+2018–U+201E) are unchanged | IMPLEMENTED, plus fail-closed hardening I1–I3, B1 (notes R1–R4 below) | GOV-941-HOOK-MALFORMED-ERROR (every listed form, a sweep of every other ASCII character outside and inside double quotes, four non-ASCII characters), GOV-941-HOOK-WRITE-DENY |
| R1 (b) split | unchanged, except that text before the first operator of a redirection word is an argument (I2) | IMPLEMENTED with I2 | GOV-941-HOOK-MALFORMED-ERROR |
| R1 (c) programs | unchanged lists and option checks, now applied in two readings: as written and with each unquoted backslash dropped (`readOnlyArguments` called twice by `readOnlySimpleCommand`), also for the program name | IMPLEMENTED | GOV-941-HOOK-MALFORMED-ERROR (`rg --pr\e`, `git log --out\put=X`, the eight option forms without `#`) |
| R1 (d) argument allowlist | `ARGUMENT_CHARS` applied to every argument of `rg`, `sed` and `git` (quotes removed, an inner quote kept as a character) | IMPLEMENTED | GOV-941-HOOK-MALFORMED-ERROR (globs, brace list, inner quotes, `@file`); `sed -n '1,$p' Y` stays read-only |
| R2 targets | unchanged (the `PROJECT_FILE_SUFFIX` target suffix is kept); `$PWD`/`$pwd` targets now fall under R1 (a) and keep the pre-change detection | IMPLEMENTED | GOV-941-HOOK-WRITE-DENY (`/c/…` target); GOV-941-HOOK-MALFORMED-ERROR (`$PWD`, `$pwd\` equality only) |
| R3 consumers | `git diff -U0` of the hook: every hunk is inside lines 113–210 (the classifier block); `shellWriteTargets`, `governanceIndependenceErrors` and the PreToolUse guard are unchanged | IMPLEMENTED | GOV-941-HOOK-PRETOOL-DENY; `diff-hook.selftest.mjs` and `governance-contract.selftest.mjs` pass unchanged |
| R4 proof | `shell-write.selftest.mjs` (the five existing cases amended); `publication.json` unchanged (already lists the file) | IMPLEMENTED | `governance-report.json` passed |
| R5 rebases | none (approver only) | NOT WRITTEN BY DESIGN | — |

Sidecar: stage `implemented`, `implementation.role` `Opus`; planned fields unchanged.

## Cases (`node scripts/workflow-gates/cli.mjs governance-report --contract <sidecar>`, exit 0, five PASS)

| Case | Result |
|---|---|
| GOV-941-HOOK-READONLY-ALLOW | passed: the seven earlier AC1 commands plus `Get-Content scripts\workflow-gates\cli.mjs \| Select-String -Pattern 'Set-Content'` and `grep -n '#.*writeFileSync' scripts/workflow-gates/cli.mjs` give `true` and `[]`; `governanceIndependenceErrors` for a contract scoping their files is `[]` |
| GOV-941-HOOK-WRITE-DENY (critical) | passed: the AC2 variants, the read-only redirection forms and the four comment or `--%` hidden writes report X and a `GOVERNANCE INDEPENDENCE` error for X; the `$PWD`/`$pwd` variants moved to MALFORMED |
| GOV-941-HOOK-MALFORMED-ERROR | passed: every AC3 form and the I1–I3, B1 forms give `false`, the pre-change targets and X; every ASCII character outside the allowlist, unquoted and inside double quotes, gives `false` and the pre-change targets; the allowed characters `Az09-_./:=,+%~*?[]` keep a plain `grep` read-only, unquoted and double-quoted; `sed -n '1,$p' Y` is read-only |
| GOV-941-HOOK-PRETOOL-DENY | passed: the earlier three assertions, plus the executor Bash events with a comment-hidden redirection into `scripts/check-example.mjs` (`POLICY-EDIT AUTHORITY REQUIRED`) and into `.git/hooks/pre-commit` (`OWNER GIT REQUIRED`) |
| GOV-941-CI-POLICY-DENY | passed, unchanged |

Run against the first candidate's hook (its `security-hook.mjs` from `758508105` with imports made absolute, in the ignored
`test-results/task941-r1/old/`), the amended test file passes cases 1 and 5 and fails cases 2, 3 and 4 (`not ok`): the new
assertions test the revision 1 behaviour.

## Sensitivity (critical case, two isolated breaks in one artifact)

`docs/sessions/evidence/task941/sensitivity/GOV-941-HOOK-WRITE-DENY.txt`, digest `cada94ad…` in `sensitivity.json`. Hook sha256
`a5ee689c…` before break 1, after restore 1 and after restore 2; test file sha256 `d9853668…` unchanged in all five runs. This is
the second pass, run after the self-check correction of a test comment (see "Implementer self-check after the handoff"); the
first pass on test file sha256 `55942d50…` gave the same results.

| Break (Edit tool, then restored with the Edit tool) | Mutant | Restored |
|---|---|---|
| 1: `commands.every(readOnlySimpleCommand)` → `commands.slice(0, 1).every(readOnlySimpleCommand)` | `not ok 1`, `ERR_ASSERTION` on `grep -n 'a' scripts/workflow-gates/reader.mjs && Set-Content 'scripts/workflow-gates/example.mjs' 'x': []`, exit 1 | `ok 1`, exit 0 |
| 2: `#` added to the R1 (a) allowlist `UNQUOTED_CHAR` | `not ok 1`, `ERR_ASSERTION` on the comment-hidden `cat scripts/workflow-gates/reader.mjs # '` + line feed + `echo x > scripts/workflow-gates/example.mjs # '`: `[]`, exit 1 | `ok 1`, exit 0 |

Break 1 now fails on the `&&` variant rather than on the `node -e` variant: under the allowlist a `'` inside a double-quoted
span makes the whole `node -e "require('fs')…"` command unclassifiable, so that variant no longer depends on R1 (b).

## Review 1 probe (route step 3)

`node docs/sessions/evidence/task941/review-1/r1-bypass-probe.mjs 758508105` from the project root, exit 0, on the working tree:
`readOnly=false` on all 29 form lines, F1–F9 (`F1-bash-line-comment-redirect`, `F1-bash-line-comment-set-content`,
`F1-ps-line-comment-set-content`, `F1-ps-block-comment-set-content`, `F1-bash-line-comment-product`,
`F1-bash-line-comment-git-metadata`, `F2-bash-backslash-option`, `F2-bash-ansi-c-option`, `F2-rg-backslash-pre`, `F2-rg-ansi-c-pre`,
`F2-git-backslash-output`, `F2-git-ansi-c-output`, `F2-sed-glob-in-place`, `F3-bash-last-arg-git-output`,
`F3-bash-last-arg-sed-in-place`, `F3-bash-last-arg-rg-pre`, `F4-ps-stop-parsing-hides-command`, `F4-ps-stop-parsing-env-option`,
`F4-ps-outvariable-splat-option`, `F5-ps-embedded-double-quote`, `F5-ps-embedded-single-quote`,
`F6-bash-prompt-expansion-runs-command`, `F7-ps-quoted-glob-msys-sed`, `F7-ps-quoted-brace-msys-sed`, `F8-ps-nested-quote-msys-sed`,
`F8-ps-nested-quote-git-output`, `F8-bash-nested-quote-git-output`, `F9-ps-quoted-at-file-msys-sed`,
`F9-ps-quoted-at-file-git-output`), and on every line `after=` equals `before941=` (compared by script: 29 of 29). The executor
PreToolUse column refuses the F1 policy, product and Git metadata lines (`POLICY-EDIT AUTHORITY REQUIRED`,
`SECURITY TEST CONTRACT MISSING`, `OWNER GIT REQUIRED`), as the pre-941 function did. Example line:
`F1-bash-line-comment-redirect | real bash: hidden write happened: true | readOnly=false | after=["scripts/workflow-gates/security-hook.mjs"] | before941=["scripts/workflow-gates/security-hook.mjs"] | executor PreToolUse=["POLICY-EDIT AUTHORITY REQUIRED: Sonnet cannot edit workflow policy or enforcement"]`.

## p01 probe (AC1)

`docs/sessions/evidence/task941/impl/p01-after.txt`: run with exactly the two substitutions stated at the top of its run note;
lines 2–5 and 10 `[]`; lines 6–8 identical to the design run (diff exit 0); line 9 `["scripts/workflow-gates/publication.json"]`.

## AC commands (final candidate, hook sha256 `a5ee689c…`)

| AC | Command | Result |
|---|---|---|
| AC4 | `git diff --exit-code` on every tracked `scripts/workflow-gates/*.selftest.mjs` except `shell-write.selftest.mjs` (12 files) | exit 0 |
| AC5 | `node scripts/workflow-gates/selftests.mjs` | 178 pass (173 + 5), 0 fail, 0 skipped, exit 0 |
| AC5 | `node node_modules/eslint/bin/eslint.js --config scripts/workflow-gates/eslint.config.mjs scripts/workflow-gates` | exit 0 |
| AC5 | `node scripts/workflow-gates/check-workflow.mjs` | `Workflow structure and hook registration passed.`, exit 0 |
| AC5 | `node scripts/workflow-gates/publication.mjs --base HEAD` | `83 explicit files, 0 dependency errors`, exit 0 |
| AC5 | `cli.mjs governance-report --contract <sidecar>` | five PASS, `Governance report: passed`, exit 0 |
| AC5 | `cli.mjs verify --contract <sidecar>` | see the final run at the end of this report |
| AC5 | `npm run check:kickoff-evidence` | see the final run at the end of this report |
| AC6 | approver only | not run by the implementer |

## Implementer findings of revision 1 (for the approver)

The literal revision 1 R1 still classifies two executed writes as read-only. Both are closed fail-closed (such commands keep the
pre-change detection exactly); none of the AC1 commands is affected. Executed with a probe in the ignored
`test-results/task941-r1/i-probe.mjs` (source below), which runs each form for real in a fresh temporary folder and classifies it
with the first candidate (`758508105`) and with the working tree:

```text
first candidate 758508105; node v22.22.3; platform win32
I1-ps-quote-started-word-sed | real powershell: target content after run "one\n" (before "one\ntwo\n") | first candidate readOnly=true | revision 1 readOnly=false | revision 1 targets=[]
I1-ps-quote-started-word-sed-dq | real powershell: target content after run "one\n" (before "one\ntwo\n") | first candidate readOnly=true | revision 1 readOnly=false | revision 1 targets=[]
I1-ps-quote-started-word-git | real powershell: hidden write happened: false | first candidate readOnly=true | revision 1 readOnly=false | revision 1 targets=[]
I1-bash-quote-started-word-sed | real bash: target content after run "one\ntwo\n" (before "one\ntwo\n") | first candidate readOnly=true | revision 1 readOnly=false | revision 1 targets=[]
I2-bash-redirect-prefix-sed | real bash: target content after run "one\n" (before "one\ntwo\n") | first candidate readOnly=true | revision 1 readOnly=false | revision 1 targets=["o.txt"]
I2-ps-redirect-prefix-sed | real powershell: target content after run "one\n" (before "one\ntwo\n") | first candidate readOnly=true | revision 1 readOnly=false | revision 1 targets=["o.txt"]
I2-bash-redirect-prefix-git | real bash: hidden write happened: true | first candidate readOnly=true | revision 1 readOnly=false | revision 1 targets=["o.txt"]
I2-bash-redirect-prefix-rg | real bash: not run | first candidate readOnly=true | revision 1 readOnly=false | revision 1 targets=["scripts/workflow-gates/security-hook.mjs","o.txt"]
I3-ps-doubled-double-quote-sed | real powershell: target content after run "one\ntwo\n" (before "one\ntwo\n") | first candidate readOnly=true | revision 1 readOnly=false | revision 1 targets=[]
I3-ps-doubled-single-quote-sed | real powershell: target content after run "one\ntwo\n" (before "one\ntwo\n") | first candidate readOnly=true | revision 1 readOnly=false | revision 1 targets=[]
```

- **I1 — P1, task design (R1 (a)–(b)) and first candidate.** Windows PowerShell 5.1 ends a word that begins with a quoted span
  at its closing quote, while Bash (and the R1 (b) tokenizer) joins the rest to it. Executed: from PowerShell,
  `sed -n 1p 'x'-i T` and `sed -n 1p 'x'"-i" T` edit T in place (the classifier sees one argument `x-i`, which passes R1 (c)–(d));
  in Bash the same `sed` form does not edit (negative control); `git log -1 'x'--output=T` from PowerShell fails on the unknown
  revision `x` before writing (negative control). An argv probe (`printf.exe '[%s]'` started from PowerShell 5.1) shows
  `'x'-i`, `'x'"-i"`, `"x"'-i'` and `"x"-i` each arrive as `[x][-i]`, while `x'-i'` and `x"-i"` arrive as `[x-i]`.
  Fix: a quoted span that begins a word must be followed by whitespace, `;`, `|`, `&`, `<`, `>` or the end.
- **I2 — P1, task design (R1 (b)) and first candidate.** R1 (b) makes a token that contains an unquoted `>` or `<` "a
  redirection, not an argument", so the text before the operator is never checked, though both shells pass it to the program.
  Executed: `sed -n 1p -i>o.txt T` edits T in place in Bash and in PowerShell; `git log -1 --output=T>o.txt` writes T (Bash);
  `rg --pre=x>o.txt …` passes `--pre=x`. Fix: that text is an argument unless it is empty, a stream number or PowerShell's `*`;
  the targets are unchanged. This deviates from the literal R1 (b) sentence only by checking more arguments.
- **I3 — hardening, negative control.** A doubled quote inside a span (`''`, `""`) is one literal quote character for PowerShell
  and two spans for Bash, so the argument PowerShell passes contains a quote that R1 (d) never sees. Executed: no split and no
  edit for `"a ""-i"" b"` (`[a -i b]`) and `'a ''-i'' b'` (`[a '-i' b]`); refused anyway, since the R1 (d) premise (the
  classifier sees every quote the program receives) does not hold for it.
- **B1 — hardening (ANALYTICAL).** An unquoted backslash before whitespace, `;`, `|`, `&`, `<`, `>`, another backslash or the
  end is a Bash escape or line continuation (`rg --pr\` + line feed + `e=x` is `--pre=x` for Bash) and a literal for
  PowerShell; the two readings of R1 (d) no longer cover it, so it is refused.

Interpretations of revision 1 (fail-closed, for the approver to confirm):
- R1 (a) lists `"` but not `'` as allowed outside single-quoted spans; the quote characters that open and close a span are read
  as its delimiters, so a `'` inside a double-quoted span is refused (AC3's `sed -n 1p "'-i'" …` is refused by (a) before (d)).
- "No word is `--%`" is implemented as "no word contains `--%`", quoted or not.
- The first candidate's separate refusals of `@` before a quote, unquoted `(`/`{` and non-ASCII whitespace (S3) are now part of
  the allowlist; S1 (target suffix) and S2 (`--hostname-bin`) are kept.

Consequences: the set of commands that 941 R1 (a) rejects only grows, so Task 943's equality premise (C48) holds; the R1 (b)
text and AC3 do not list I1, I2, I3 or B1, so the approver should decide whether the kickoff records them (they are asserted in
GOV-941-HOOK-MALFORMED-ERROR). Residual pre-941 limits, unchanged: Git runs configured programs for read-only subcommands; a
relative redirection target after `cd`; `>|`; no detection for write programs without a write word (Task 943).

Tooling note: the Write tool refuses a path outside the project and the `block-mutating-git.ps1` hook refuses a Bash heredoc
that contains `git`, so the probe, the p01 runner and the sensitivity parts were written to the git-ignored `test-results/task941-r1/`
(not part of the candidate). The probe runs `git init`/`git commit` only inside temporary folders and `git show` read-only,
as the review 1 probe does.

<details><summary>Source of test-results/task941-r1/i-probe.mjs</summary>

```js
// Task 941 revision 1 implementer probe (Opus, 2026-11-02). Usage (repo root): node <this> <first-candidate-commit>
// Runs each form for real in Git Bash or Windows PowerShell 5.1 in a fresh temporary folder (writing only that folder),
// then classifies it (T replaced by a scope path) with the first candidate's and the working-tree isReadOnlyShellCommand.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, rmSync, writeFileSync as save } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const commit = process.argv[2];
if (!/^[0-9a-f]{7,40}$/.test(commit || '')) throw new Error('usage: i-probe.mjs <first-candidate-commit>');
const gates = pathToFileURL(join(root, 'scripts/workflow-gates/')).href;
const oldSource = execFileSync('git', ['show', `${commit}:scripts/workflow-gates/security-hook.mjs`], { encoding: 'utf8' })
  .replaceAll("from './", `from '${gates}`);
const scratch = mkdtempSync(join(tmpdir(), 'r941old-'));
save(join(scratch, 'old-hook.mjs'), oldSource);
const old = await import(pathToFileURL(join(scratch, 'old-hook.mjs')).href);
const now = await import(`${gates}security-hook.mjs`);
const X = 'scripts/workflow-gates/security-hook.mjs';
const forms = [
  // I1: PowerShell ends a word that begins with a quoted span at its closing quote; Bash joins the rest to it.
  ['I1-ps-quote-started-word-sed', 'powershell', "sed -n 1p 'x'-i %T%", 'inplace'],
  ['I1-ps-quote-started-word-sed-dq', 'powershell', `sed -n 1p 'x'"-i" %T%`, 'inplace'],
  ['I1-ps-quote-started-word-git', 'powershell', "git log -1 'x'--output=%T%", 'gitrepo'],
  ['I1-bash-quote-started-word-sed', 'bash', "sed -n 1p 'x'-i %T%", 'inplace'],
  // I2: text before the operator of a redirection word is an argument of the program.
  ['I2-bash-redirect-prefix-sed', 'bash', 'sed -n 1p -i>o.txt %T%', 'inplace'],
  ['I2-ps-redirect-prefix-sed', 'powershell', 'sed -n 1p -i>o.txt %T%', 'inplace'],
  ['I2-bash-redirect-prefix-git', 'bash', 'git log -1 --output=%T%>o.txt', 'gitrepo'],
  ['I2-bash-redirect-prefix-rg', 'bash', "rg --pre=x>o.txt 'writeFileSync' %T%", 'classifier-only'],
  // I3: a doubled quote is one literal quote for PowerShell and two spans for Bash (negative control for a split).
  ['I3-ps-doubled-double-quote-sed', 'powershell', 'sed -n 1p "a ""-i"" b" %T%', 'inplace'],
  ['I3-ps-doubled-single-quote-sed', 'powershell', "sed -n 1p 'a ''-i'' b' %T%", 'inplace'],
];
const lines = [`first candidate ${commit}; node ${process.version}; platform ${process.platform}`];
for (const [id, shell, form, mode] of forms) {
  let ran = 'not run';
  if (mode !== 'classifier-only') {
    const dir = mkdtempSync(join(tmpdir(), 'r941i-'));
    try {
      const target = 'target.txt';
      if (mode === 'inplace') save(join(dir, target), 'one\ntwo\n');
      if (mode === 'gitrepo') {
        execFileSync('git', ['init', '-q'], { cwd: dir });
        execFileSync('git', ['-c', 'user.name=probe', '-c', 'user.email=probe@example.invalid', 'commit', '-q', '--allow-empty', '-m', 'probe'], { cwd: dir });
      }
      const command = form.replaceAll('%T%', target);
      const args = shell === 'bash' ? ['-c', command] : ['-NoProfile', '-NonInteractive', '-Command', command];
      try { execFileSync(shell === 'bash' ? 'bash' : 'powershell.exe', args, { cwd: dir, stdio: 'pipe' }); } catch { /* the outcome is the file */ }
      ran = mode === 'inplace' ? `target content after run ${JSON.stringify(readFileSync(join(dir, target), 'utf8'))} (before "one\\ntwo\\n")`
        : `hidden write happened: ${existsSync(join(dir, target))}`;
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
  const classified = form.replaceAll('%T%', X);
  lines.push(`${id} | real ${shell}: ${ran} | first candidate readOnly=${old.isReadOnlyShellCommand(classified)} | revision 1 readOnly=${now.isReadOnlyShellCommand(classified)} | revision 1 targets=${JSON.stringify(now.shellWriteTargets(root, classified))}`);
}
rmSync(scratch, { recursive: true, force: true });
console.log(lines.join('\n'));
```

</details>

Argv probe of I1/I3 (PowerShell 5.1.26100.9818, `printf.exe '[%s]' <form>` in an empty temporary folder):
`'x'-i -> [x][-i]`; `'x'"-i" -> [x][-i]`; `"x"'-i' -> [x][-i]`; `"x"-i -> [x][-i]`; `x'-i' -> [x-i]`; `x"-i" -> [x-i]`;
`"a ""-i"" b" -> [a -i b]`; `'a ''-i'' b' -> [a '-i' b]`; `"a""-i" -> [a-i]`; `'a''-i' -> [a-i]`.

## Implementer self-check after the handoff (owner request, 2026-11-02)

Correction: the comment at `scripts/workflow-gates/shell-write.selftest.mjs:149` named "I1-I3, B1-B3", but this report defines
I1–I3, B1 and two interpretations; the comment now says so. No assertion changed; the sensitivity pass was repeated on the
corrected file (above), and every final run below is on it.

Further forms checked, all negative (no new defect). PowerShell 5.1 argv is from `node test-results/task941-r1/argv.mjs <form>`
(prints `process.argv.slice(2)`); classification uses the working-tree hook (`test-results/task941-r1/qa-extra.mjs`):
- PowerShell 5.1 quotes an argument that contains a space without escaping a trailing backslash, which splits it:
  `'a b\' 'c -i T'` arrives as `["a b\" c","-i","T"]`. Every such form needs a backslash directly before a quote (or an unquoted
  backslash before whitespace or the end), so R1 (a) and B1 refuse it: `sed -n 1p 'a b\' 'c -i X'`,
  `git log '--format=a b\' 'x --output=X'`, `sed -n 1p a'b c\' X`, `sed -n 1p a\ -i X` and `sed -n 1p "a b\" -i X` are `false`.
- PowerShell 5.1 splits an unquoted word of the form `-name.rest` in two: `-i.bak T` arrives as `["-i",".bak","T"]`, `-l.O x` as
  `["-l",".O","x"]` (`--outpu.t=T`, `-1.-i` and `-a:b.c` are not split). The second part begins with `.`, so it is never an option,
  and the first part is a prefix of the word R1 (c) already checks (every `sed` operand that begins with `-` is refused; `git`'s
  `-…O` test matches the prefix as well), so no read-only classification changes: `sed -n 1p -i.bak X`, `sed -n.x 1p X` and
  `git grep -l.O x X` are `false`; `git log -1.x X` (`-1`, path `.x`) and `rg -x.y a X` (`-x`, path `.y`) stay `true` and write
  nothing.
- An unquoted comma is not split for a native program: from real PowerShell (`test-results/task941-r1/qa-comma.mjs`),
  `sed -n 1p x,-i T` gives `can't read x,-i` with T unchanged and `git log -1 x,--output=O` gives `ambiguous argument
  'x,--output=O'` with no O; both forms are classified read-only, correctly.
- A quoted span inside a word does not split it: from PowerShell 5.1, `x'a'-i` arrives as `["xa-i"]`, `x'-i'y` as `["x-iy"]` and
  `1p'x'-i` as `["1px-i"]`, as Bash reads them; only a word that begins with a quoted span splits (I1).

Replay of real commands (`test-results/task941-r1/qa-replay.mjs`, output `qa-replay.txt`): every Bash and PowerShell command of the
89 session transcripts of this project (11682 unique commands) through the pre-941 hook (`758508105^`) and the working tree.
1680 are read-only now; for 0 commands a target is added and for 43 a target is dropped. All 43 dropped are reads: 40 lose the
false target `&1` that the pre-941 redirection pattern took from `2>&1` (`ls … 2>&1 | head`, `wc -l …`, `git status --short …`,
`cat … | tail`), and 3 lose `src/app/layout.tsx`, which they only search for write words
(`Select-String -Pattern 'Set-Content' -Path src/app/layout.tsx | Measure-Object …`, `grep -c -E 'writeFileSync|Set-Content'
src/app/layout.tsx; ls src/app/layout.tsx`, the same with a `cd` first). No command that writes a file lost a target.

Finding G1 (pre-941 limit, not in the kickoff, for the approver and the task designer; ANALYTICAL for severity). An unquoted
glob in a redirection target writes the one file it matches, in both shells: executed in a temporary folder,
`cat Y > scripts/workflow-gates/security-hoo?.mjs` from Bash and `Get-Content Y > scripts/workflow-gates/security-hoo?.mjs` from
PowerShell 5.1 each replaced the content of `scripts/workflow-gates/security-hook.mjs` (no new file was created). Both branches
report the literal target (`["scripts/workflow-gates/security-hoo?.mjs"]`), so `governanceIndependenceErrors` for a contract that
scopes `security-hook.mjs` returns 0 errors for the read-only `cat Y > …hoo?.mjs` and `cat Y > …security-h*.mjs`, and also for
`echo x > …hoo?.mjs`, which takes the pre-change branch (`test-results/task941-r1/qa-glob.mjs`). The pre-write guard is not
affected: an executor Bash event `echo x > scripts/check-exampl?.mjs` or `cat README.md > scripts/check-exampl?.mjs` still
returns `POLICY-EDIT AUTHORITY REQUIRED`. 941 does not change this: R2 fixes the read-only targets and requires the pre-change
result otherwise, so a fix (for example, a target with an unquoted `*`, `?` or `[` counting as a write of every scope file it
matches) needs a task design decision; the implementer did not make it.

Finding G2 (same family as G1, pre-941 limit, not in the kickoff). Windows reaches the same file through other spellings of
its path, which `projectPath` does not normalize (letter case is already handled: `pathKey` lowercases on win32). Executed in a
temporary folder whose file system lists the 8.3 name (`dir /x`: `SECURI~1.MJS security-hook.mjs`), with
`test-results/task941-r1/qa-winpath.mjs`:
- `cat Y > scripts/workflow-gates/SECURI~1.MJS` (Bash) and `Get-Content Y > scripts/workflow-gates/SECURI~1.MJS` (PowerShell)
  each replaced the content of `security-hook.mjs`;
- `Get-Content Y > scripts/workflow-gates/security-hook.mjs.` and `….mjs..` (PowerShell) replaced it as well; from Bash the same
  targets created separate files named `security-hook.mjs.` and `security-hook.mjs..` and left it unchanged;
- each of these is read-only, and the single target is the literal spelling, so `governanceIndependenceErrors` returns 0
  errors for a contract that scopes `security-hook.mjs`.
`projectPath` is outside the 941 change (R3), so a fix (for example, resolving an existing target to its long name with
`realpathSync.native` and removing trailing dots and spaces on win32) is also a task design decision.

## Final runs

This report is in the contract's scope digest, so `cli.mjs governance-report`, `cli.mjs verify` and
`npm run check:kickoff-evidence` run after its last edit; their output is in the implementer's final handoff, and the
approver reruns them. A governance report that passed before this report was finished (five PASS, exit 0) is superseded
by that final run.

Changed files of revision 1: `scripts/workflow-gates/security-hook.mjs`, `scripts/workflow-gates/shell-write.selftest.mjs`,
the 941 sidecar (stage, implementation), `docs/sessions/evidence/task941/impl/base-runs.txt` (appended),
`…/impl/p01-after.txt`, `…/impl/completion-report.md` (appended), `…/impl/governance-report.json`,
`…/sensitivity/sensitivity.json`, `…/sensitivity/GOV-941-HOOK-WRITE-DENY.txt`. `publication.json` is unchanged.

IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW
