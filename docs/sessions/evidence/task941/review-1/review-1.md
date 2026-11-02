# Task 941 — review 1 (Opus reviewer, 2026-11-02): NEEDS REVISION

Candidate: commit `75850810596d518522470e67049e618366572bac` on `task/935-governance-approval-route` (owner commit, not pushed;
`origin/task/935-governance-approval-route` is `2693c6b9a`). Ten files, all inside the 941 scope plus the 941 sidecar.
Platform: native Windows 11, Git Bash 5.2.37 and Windows PowerShell 5.1, Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`.
This session wrote no 941 scope file before the verdict. Because it then designed revision 1, it may not approve 941 (D2).

## R1–R5 audit

| Step | Source / command | Observation | Result |
|---|---|---|---|
| R1 contract | kickoff, sidecar, `git show --stat 758508105` | 10 files: hook, new self-test, publication entry, sidecar stage fields, six evidence files | PASS |
| R2 manifest | `grep shellWriteTargets\|isReadOnlyShellCommand` over `scripts`, `.claude` | consumers only `governanceIndependenceErrors` and the PreToolUse guard; only the new self-test imports the classifier | PASS |
| R3 consumers (R3) | hook diff | consumers unchanged; the write-word path pattern moved into `PROJECT_FILE` unchanged | PASS |
| R3 R1/R2 semantics | `node docs/sessions/evidence/task941/review-1/r1-bypass-probe.mjs 758508105` (EXECUTED, exit 0) → `r1-bypass-probe.txt` | F1, F2 below | FAIL |
| R4 self-tests | `node scripts/workflow-gates/selftests.mjs` (EXECUTED, exit 0) → `r1-selftests-758508105.txt` | `# pass 178`, `# fail 0`, `# skipped 0` | PASS |
| R4 AC5 gates | `cli.mjs governance-report` and `cli.mjs verify` on the sidecar; `check-workflow.mjs`; eslint on `scripts/workflow-gates`; `publication.mjs --base HEAD` (EXECUTED) | five PASS, exit 0; exit 0; exit 0; exit 0; `83 explicit files, 0 dependency errors` | PASS |
| R4 sensitivity | `sensitivity/GOV-941-HOOK-WRITE-DENY.txt` | first-command-only break fails with `ERR_ASSERTION`, restored passes | PASS (does not cover F1/F2) |
| R5 UI | — | no visible scope | N/A |

## Findings

**F1 — P1, implementation and task design (R1 (a), R2; AC2, AC4). A quote inside a comment hides a real write.**
`shellCommands` has no comment handling, so a `'` after `#` (Bash, PowerShell) or inside `<# … #>` (PowerShell) opens a quoted
span that swallows the next command. Executed: Bash runs `echo hidden > T` written on the line after `cat README.md # '`;
PowerShell runs `Set-Content` after `# '` and between `<# ' #>` comments (probe lines 3, 5, 6). The candidate returns
`readOnly=true` and no target; the pre-941 function returned the scope file, a product file or `.git/hooks/pre-commit` (lines 3–8),
and an executor PreToolUse event gets no refusal. Impact: an implementing session passes the D2 independence check, and Sonnet can
write policy, product or Git metadata past the guard: a regression of every pre-941 detection R2 must preserve. The literal R1 lexer
omits comments (design gap); the implementer's own hardening missed them (implementation gap).
Resolution: R1 (a) rejects an unquoted `#`; AC2 and AC4 assert the hidden writes; second sensitivity break.

**F2 — P1, implementation and task design (R1 (c)). Bash reads the excluded options differently.**
Executed: Bash prints `--pre` for `--pr\e` and `$'--pre'`, and `--output=…` for `--out\put=…` and `$'--output=…'` (lines 9–10);
the candidate classifies `rg --pr\e`, `rg $'--pre'`, `git log --out\put=X`, `git log $'--output=X'` read-only (lines 11–14), so the
R1 (c) exclusions do not hold; with a write word the pre-941 function reported the scope file. Executed: an unquoted `*` beside a
file named `-i` makes `sed -n 1p *` an in-place edit, classified read-only (line 15). Resolution: R1 (a) rejects unquoted `$` before
a quote; new R1 (d): no unquoted glob in `rg`/`sed`/`git` arguments, and the (c) checks hold with unquoted backslashes dropped.

**F3 — P1, found by the owner-requested self-check of this review (same day). `$_` carries an option into the next command.**
The first revision 1 draft closed F1/F2 but not parameter expansion: a double-quoted `$` is not "unquoted `$` before a quote".
Executed (probe lines 16–18): `cat --output=T 2>/dev/null; git log -1 "$_"` makes `git log` write T; `head -i 2>/dev/null;
sed -n 1p "$_" T` edits T in place; `cat --pre=bash …; rg "$_" 'writeFileSync' X` is read-only for the candidate, where the
pre-941 function reported X. Resolution: R1 (d) also rejects a `$` outside single quotes in `rg`/`sed`/`git` arguments
(`sed -n '1,$p'` stays allowed); AC3 asserts the three forms.

Self-check corrections of the first draft: C36 split into C36 (read-only) and C54 (no target); the revision 1 claims added to
the R1/R2 citation lists; the route prerequisite now names exact paths, because `tasks/Sprints` holds unrelated untracked Task 926
files; the sensitivity artifact binding was verified (hook sha256 `86d020…` equals the artifact's before/after value, and
`cli.mjs verify` checks `artifactSha256` with the canonical `digest`). Residual, unchanged pre-941 limits (not regressions, out
of scope): Git runs configured programs (`diff.external`, `core.fsmonitor`, pager, textconv) for read-only subcommands, and
`cd` followed by a relative redirection target resolves from the root.

**Implementer findings, confirmed and resolved in revision 1:** AC1 line 9 conflicts with R2 (completion report note 3), and the
design probe cannot run as saved (note 4); the hardening (note 1) and the target suffix (note 2) are adopted into R1/R2.
Note 6 (`>|`, `cd` + relative target) and note 7 (`echo` outside the list) are unchanged pre-941 limits, not regressions.

## Revision 1 readiness (task-readiness.md)

| Step | Source / command | Observation | Result |
|---|---|---|---|
| 1 manifest | as R2 above; Task 943 R1 refers to the 941 R1 (a) set | revision 1 only widens that set; 943 is gated on 941 `reviewed` and stays valid | PASS |
| 2 authority | scope unchanged; implementer Opus (D1), not this reviewer; approver another session (D2) | the probe in `review-1/` is run read-only, not written | PASS |
| 3 commands | `r1-bypass-probe.mjs 758508105` reads the parent of that commit for `before941` and the working-tree hook | runs read-only, writes only temporary folders (EXECUTED above) | PASS |
| 4 proof | AC1 allow forms contain no unquoted `#`, `$'`, `$"` or glob in `rg`/`sed`/`git` arguments; AC3 forms each carry X and a write word, so the pre-change copy reports X | ANALYTICAL | PASS |
| 5 contract | `node scripts/check-kickoff-evidence.mjs --files <941 kickoff>`; in-memory `validateContract({...c, executionStatus:'ready'}, {phase:'plan'})`; then `cli.mjs plan --contract <941 sidecar>` | `PASS — 1 changed active kickoff(s) verified`; `[]`; `plan` exit 0 at `executionStatus: ready`, stage `planned` | PASS |
| 5 gates | `check-workflow.mjs`; `publication.mjs --base HEAD`; `npm run check:kickoff-evidence` | passed; `83 explicit files, 0 dependency errors`; PASS | PASS |

Step 4 recheck after the self-check: no AC1 command and no existing `[]` expectation of `shell-write.selftest.mjs` contains an
unquoted `#`, or a `$` or glob in an `rg`/`sed`/`git` argument; every AC3 form carries X and a write word (ANALYTICAL, PASS).
The kickoff was set back to `draft`, revised, rehashed and promoted to `ready` again; `plan`, `check:kickoff-evidence`,
`check:backlog-active`, `check-workflow.mjs` and `publication.mjs --base HEAD` passed again.

Final digests of the saved revision 1 (superseding the first draft's `efe0d413…`/`eca01c0b…`): task
`cf08f7e070e86303be36bc8031422adc2f11eacc86e8d56180c7de400da3c476`, plan
`35d5a51291b49e4d1a5c9ec5db700d11496190af4019f1976c403adb4a13699f`.
