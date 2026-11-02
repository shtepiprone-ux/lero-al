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

**F4 — P1, found by the owner's second self-check request (same day). PowerShell stop-parsing and splatting.**
Executed (probe lines 19–21): after `--%` a quote no longer quotes, so `git log --% -1 '` + line feed + `Set-Content 'T' 'x';
git log --% -1 '` runs the hidden `Set-Content` (the pre-941 function reported X; the candidate: read-only, no target);
`--%` also expands `%VAR%` into `--output=T`, and `Get-Content opts.txt -OutVariable v; git log -1 @v` passes the file's
`--output=T` line; each writes T and is classified read-only. Resolution: R1 (a) rejects an unquoted `--%`; R1 (d) rejects an
unquoted `@` in `rg`/`sed`/`git` arguments; AC2 and AC3 assert the forms. Negative control (lines 22–23): Windows PowerShell 5.1
did not turn a quote inside a quoted `git` argument into a separate option, so no rule is added for it. Other paths checked
analytically and left as they are: a PowerShell `a,b` argument reaches a native program as one argument (EXECUTED with an
argv echo, `argv-echo.mjs`, output `argv-echo.txt`); a trailing backslash in a quoted argument, which PowerShell 5.1 does split (EXECUTED), always
needs `\'` or `\"` in the command text, which R1 (a) already rejects.

**F6 — P1, found by the owner's third self-check request (same day). Bash prompt expansion runs a command.**
Executed (probe line 24): `cat '\044\050touch T\051' 2>/dev/null; grep -c zzz "${_@P}"` makes Bash decode the octal escapes
of `$_` into `$(touch T)` and run it; the candidate classifies the `grep` command read-only. The revision 1 draft of the second
self-check still allowed it (a `$` inside double quotes in a `grep` argument). Root cause of F1–F6 together: R1 listed
forbidden shell forms, and every review pass found another one. Resolution: R1 (a) is now an allowlist: outside single
quotes only the listed ASCII characters; no `$`, backtick or backslash inside double quotes; no backslash before a quote; no
typographic quote; no `--%` word. R1 (d) keeps only the `rg`/`sed`/`git` glob and backslash rules. Consequence: `> $PWD/X`
and `> $pwd\X` targets are no longer read-only and keep the pre-941 detection (AC3 equality), a documented pre-941 limit.
Feasibility (`r1-allowlist-feasibility.mjs`, output `r1-allowlist-feasibility.txt`, EXECUTED, exit 0, `unexpected results: 0`):
a reviewer prototype of R1 (a) passes all 18 AC1 and read-only redirection forms, rejects the 12 F1/F2/F3/F4/F6 forms that
belong to (a), and leaves the 4 forms that need (d) to (d).

**F7 — P1, found by the owner's fifth self-check request (same day). A program started from PowerShell expands a quoted
glob or brace list itself.** Executed (probe lines 25–26): from Windows PowerShell 5.1, `sed -n 1p '*'` beside a file named
`-i` and `sed -n 1p '{-i,T}'` (no file needed) both edit T in place; Git for Windows `sed.exe` is an MSYS program, and the MSYS
runtime expands `*?[]{}` in the Windows command line it receives, which PowerShell passes without quotes. The candidate
classifies both read-only; the pre-941 function reports nothing either (no write word), so this is a classifier soundness hole,
not a regression. `r1-msys-argv.mjs` (output `r1-msys-argv.txt`) shows the argv an MSYS program receives for 31 forms.

**F8 — P1, same pass. A quote inside a quoted argument is read again as quoting.** Executed (probe lines 27–28): from
PowerShell, `sed -n 1p '"-i"' T` edits T in place and `git log -1 '--out"put"=T'` writes T (`r1-msys-argv.txt` lines 14–15:
`'"-i"'` and `"'-i'"` both arrive as `-i`). C62 (no split into two arguments) stays true; the fourth self-check's reading of C62
as "no rule needed" was wrong. In Bash the same `git` form does not write (probe line 29, negative control).

**F9 — P1, same pass. A quoted `@file` argument is read as more arguments.** Executed (probe line 30): from PowerShell,
`sed -n 1p '@sedopts.txt' T` with `sedopts.txt` holding `-i` edits T in place (the MSYS runtime reads `@file` arguments
from a non-MSYS parent); `git log -1 '@opts.txt'` does not (line 31, negative control). Classified read-only.

Resolution of F7–F9: three more forbidden forms in one pass repeat the F1–F6 pattern, so R1 (d) is now an allowlist too:
every argument of `rg`, `sed` and `git`, read as the shell reads it (an inner quote is kept), uses only `A`–`Z`, `a`–`z`,
`0`–`9`, space and `- _ . / : = , + % | $ \ ~ ^`; the backslash dual view of (d) stays. `rg` was not measured (not on this
machine's PowerShell path) and keeps the rule fail-closed. Feasibility: `r1-allowlist-feasibility.mjs` now models this
allowlist; all 18 AC1 and redirection forms pass (a) and (d), all 9 glob, brace, inner-quote and `@file` forms are rejected,
`unexpected results: 0`. The cost: an `rg` regex with `*`, `[`, `(` or `{` keeps the pre-941 detection; an approver uses
`grep` or `Select-String` for such searches.

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

Second self-check (F4): the route text named both `<HEAD>` and `758508105` for the probe (now one exact command), the expected
probe result is false on F1–F4 only (F5 lines are negative controls), and the `--%` form moved under R1 (a) in AC3. The kickoff
went through draft, rehash and ready again; all gates of step 5 passed again on the final save; the hook under review is
unchanged (sha256 `86d020…`).

Third self-check (F6): R1 (a) rewritten as a character allowlist, R1 (d) reduced to glob and backslash rules, AC2's second
sensitivity break restated for the allowlist, AC3 lists the moved `$PWD`/`$pwd` variants with equality only. Draft, rehash,
ready and every step 5 gate again; hook under review unchanged (`86d020…`).

Fourth self-check (owner request, same day). Allowlisted characters re-examined one by one in both shells: `~` expands only
to absolute paths; `,` reaches a native program as one argument (`argv-echo.txt`); `%` matters only after `--%`; `[ ] * ?` are
Bash globs, rejected for `rg`/`sed`/`git` by (d) and harmless for the other read-only programs; `\` keeps the dual view of (d);
`< > & | ;` are the parsed operators; CR only splits more than Bash does. The unchanged whole-string checks of R1 (a) stay on
top of the allowlist, so the rejected set only grows (as Task 943 assumes); the prototype comment now says it covers only the
allowlist part. ripgrep here is 14.1.1, after the 13.0.0 fix for decompressors found in the current folder. Kickoff
corrections: AC4 and section 7 required no change to any `*.selftest.mjs`, which revision 1 cannot meet because it amends 941's
own `shell-write.selftest.mjs`, so both now exclude that file; section 1 named only a fresh implementer, contradicting the
route, and now matches it and excludes this session and both implementers from approval; section 8 names the review-1
evidence; the MALFORMED case input lists prompt expansion, the allowlist and the moved `$PWD`/`$pwd` targets.

After the fourth self-check: draft, rehash, ready; `plan` exit 0, `check:kickoff-evidence`, `check:backlog-active`,
`check-workflow.mjs`, `publication.mjs --base HEAD` passed; feasibility prototype rerun, `unexpected results: 0`.

Fifth self-check (owner request, same day). The fourth self-check judged `[ ] * ?` only as Bash globs and C62 as "no rule";
both were wrong for programs started from PowerShell (F7–F9 above). Also checked, no change needed: Task 943 relies only on
`isReadOnlyShellCommand` as a whole and on the R1 (a) rejected set, which revision 1 only widens; redirections `2>&1>X`, `>>X`,
`>&X`, `<>X` and PowerShell `*>X` are parsed by the candidate as R2 states; `>|X` and an upper-case `/C/…` target are pre-941
limits of the old function, not regressions. Kickoff: header, section 3, ledger C66–C72, R1 (d) as an allowlist, AC3, the route's probe
expectation, the MALFORMED case input and the receipt amended; the sidecar went through draft, rehash and ready again.

Sixth self-check (owner request, same day). Checked with executed argv probes (`r1-msys-argv.txt` lines 22-32), no new
hole: a PowerShell comma list (`x,'-i'`, `'x','-i'`) reaches an MSYS program as the one argument `x,-i`, and only a comma with
spaces splits, which the classifier sees as a separate `-i` word; a doubled single quote `''` (one quote for PowerShell, an
empty span for Bash) at most joins neighbouring arguments with a space (`-n 1p`, `a x b`), GNU sed rejects a joined script
such as `1p w x` (`extra characters after command`, no file written), and `;` and line breaks are outside the R1 (d)
allowlist. Kickoff defect fixed: the R1 table row held two bare pipe characters, which split the Markdown cell; the one in
(b) dates from the original design, the one in the new (d) allowlist from the fifth self-check; both are now escaped and
every table row of the kickoff has its header's cell count. Draft, rehash and ready again; every step 5 gate rerun on the
final save.

Final digests of the saved revision 1 (superseding `efe0d413…`/`eca01c0b…`, `cf08f7e0…`/`35d5a512…`,
`f431e6c1…`/`abcca249…`, `9e5a2140…`/`b3d7afc8…`, `507098a4…`/`1b4a4fe7…` and `406aa441…`/`a4677227…`): task
`f915b11baa4195025881c43197a2046da6bae7f6c17649e2a7d8b99598c96e9f`, plan
`912ef815d780313070e95794c3d4abda7a3b62d96474ad2bba3cc1d7d6843995`.
