# Task 943 review 1 — revision 3 candidate

Opus review session `688f8e95`, 2026-11-03, native Windows 11, Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`. The
candidate was the working tree on `b85f5a66b`; the owner later committed it unchanged as `8899d9c42` (hook sha256
`35b508014df04741bad213f2d6994aa82db1b38f5350975a19b6db29f8d43ddd`). This session wrote no scope file of the 943 contract
before its verdict; it then wrote kickoff revision 4, so it can neither implement nor approve 943.

**Decision: NEEDS REVISION** (mainly task design). Revision 4 is saved and ready:
`tasks/Sprints/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.md`.

## Checks on the candidate

| Step | Command / source | Observation | Result |
|---|---|---|---|
| R4 | `node scripts/workflow-gates/selftests.mjs` (`r1-selftests.txt`) | 191 tests, 190 pass, 1 fail (GOV-941-HOOK-MALFORMED-ERROR), exit 1 | FAIL (K1) |
| R4 | soft-assert copies of the five hook-importing self-tests | only lines 123 and 158 of `shell-write.selftest.mjs` conflict | K1 bounded |
| R4 | GOV-943 cases in the same run | all 13 pass; AC13 platform line lists every win32 part | PASS |
| R4 | `cli.mjs verify --contract <943 sidecar>` | exit 0 | PASS |
| R4 | `publication.mjs --base HEAD`, `check-workflow.mjs`, eslint, `check:kickoff-evidence` | all exit 0 | PASS |
| R4 | sensitivity artifacts | restored source hashes equal the candidate; `digest()` of each artifact equals `sensitivity.json` | PASS |
| R3 | code of R2, R3, R7, R8, R9, R11, R12 | matches the kickoff apart from the findings below; moved rule paragraphs are identical | PASS |
| R3 | `r1-f2-probe.mjs` (`r1-f2-probe.txt`) | executor Write/Edit of a relative policy path with `cwd` `<root>/scripts` -> `[]` | FAIL (F-cwd) |
| R3 | `r1-adv-probe.mjs` (`r1-adv-probe.txt`) | nested shells, evaluators, runners, `Start-Process`, pipeline-fed cmdlets and quoted options of parser-rejected commands -> `MISSED` | FAIL (design gap) |

## Findings

- **K1 (P1, task design).** R2 reports the second file positional of the parseable `sed -i 's/a/b/' X writeFileSync`; the
  unchanged 941 file asserts equality with the pre-change function. The candidate's result is the real write. Fix: revision 4 R1
  (two assertions changed, D12 `tests` rebase of the 941 contract by the approver).
- **F-cwd (P2, implementation against R12 (d); sub-review F6).** The pre-write guard ignores the event `cwd` for Write/Edit.
  Fix: revision 4 R12 (d), AC13.
- **Nested and run programs (P1, task design).** Section 5 programs run through another program report nothing. Fix: R13 (a)–(d), AC14,
  case GOV-943-HOOK-NESTED-DENY.
- **Quoted options of parser-rejected commands (P2).** Fix: R13 (c).
- **Sub-review F1–F8** (`docs/sessions/evidence/task943/impl/completion-report.md`, independent of this session): F1, F2, F4 -> R13 (e);
  F3, F5, F7, F8 -> R14; F6 = F-cwd.

## Revision 4 readiness

| Check | Evidence | Result |
|---|---|---|
| Feasibility | `design/p15-run.mjs` applies `design/p15-r13-pairs.txt` to the candidate hook; `design/p15-run.txt` `FAILURES 0` | PASS |
| Hook-importing self-tests against the prototype; 941 file with the K1 change against prototype and candidate | `p15-run.txt` lines 102–109 | PASS |
| Corpus (frozen, sha256 `1eb5de48…`) | 88 commands gain targets, 19 guarded, 1 executor refusal, 0 governance scope files, every 941 target kept | PASS |
| Rejected draft rule | pipeline rule inside the lenient reading walks the project root (`design/p15-lenient-pipeline-noise.txt`) | excluded in R13 (e) |
| Write authority | every scope path is a policy or evidence path; implementer Opus (D1); 941 contract entries by the approver | PASS |
| Stale locators | C37, C38, C45, C49–C52 moved to `design/sources/b85f5a66b__*` snapshots; 931 C28/C29 and 937 C37 re-pointed, sidecar task hashes updated, `cli.mjs plan` exit 0 | PASS |
| `check:kickoff-evidence` | PASS, 1 changed active kickoff | PASS |
| Sidecar | 14 cases (GOV-943-HOOK-NESTED-DENY added), stage `planned`, in-memory ready `plan` `[]` | PASS |

## Self-audit at the owner's request (same session, after the first handoff)

| Defect of revision 4 as first saved | Correction |
|---|---|
| R4 and section 6 still said nothing but R8 changes the consumers, while revision 4 changes the guard's Write/Edit resolution and `registeredWrites` | R4 and section 6 name R12 (d) and R14 (b); R4 also cites AC15 |
| AC1, R1 and section 4 allowed "only two changed assertions", but the change that passes (`p15-run.mjs`) edits four equality lines and adds one constant | they now bound the expected value of the two commands; commands, case IDs and test names stay |
| Section 9 still named five critical cases | seven |
| The two-entry 941 chain of R6 (`scope`, then `tests`) was not proven | `r1-r6-chain.mjs` on a copy of the tracked tree: chain, review and report digests and release validation `[]`; a single `scope` entry with the test file is refused (C156, C157) |
| The new ledger rows moved the 943 lines cited by 931 C28/C29 and 937 C37 again | re-pointed to lines 332 and 385, sidecar task hashes refreshed |

## Second self-audit at the owner's request

Executed against the prototype and the candidate (`r1-audit2-probe.mjs`, outputs `r1-audit2-probe.txt` and
`r1-audit2-candidate.txt`, user folders redacted), each defect of the saved revision 4 design corrected in
`design/p15-r13-pairs.txt` and re-measured with `design/p15-run.mjs` (`FAILURES 0`):

| Defect of revision 4 as saved after the first self-audit | Correction |
|---|---|
| A nested shell or `eval` whose quoted text holds `$` made the command parser-rejected, and the lenient reading had no recursion: `bash -c "rm package.json $y"` and four similar forms were allowed | R13 (e): such a part is read as the words it runs (C158, C159) |
| Script blocks (`Invoke-Command -ScriptBlock {…}`, `. {…}`, `Start-Job {…}`) hid the write program | R13 (e): the caller and its options are dropped (C160, C161) |
| Formatters, package managers, archivers and `Export-*` wrote project files with no target | R15 and its section 5 row, AC16 (C162–C164) |
| The lenient reading dropped words without a dot before parsing, so `npm install` lost its subcommand | all words are read; only file-like targets are kept |
| A quoted `*` of a sed script became a glob of the project root (`CLAUDE.md` among governance scope files) | quote-aware lenient words; a quoted word is never glob-expanded, a quoted `[locale]` path stays a target (C165, C166) |
| Heredoc prose was read as commands | heredoc and here-string bodies are dropped unless a shell reads them |
| A package manager with a prefix folder was read at the root only | `--prefix`/`-C`/`--dir`/`--cwd`; an absolute prefix outside the root reports no project file (C167) |
| C143 stated the old prototype output | restated: a script-block variable is reported only as its text |

Measured cost after these corrections: 63 corpus commands gain targets, 30 guarded, 6 executor refusals (five `npm install`
after `cd` into a scratch folder, read at the root as well by the R12 root rule; C140, C168), 0 governance scope files, every
941 target kept. The 931 C28/C29 and 937 C37 locators were re-pointed to lines 345 and 398.

## Third self-audit at the owner's request

| Defect of revision 4 as saved after the second self-audit | Correction |
|---|---|
| R1 still defined the result of a parser-rejected command exactly (941 result plus the conditional R1 paths), which R13 (c)/(e) and R15 contradict | R1: the R13 (c), (e), (f), R14 and R15 additions apply on top; the 941 equality still passes (C138, C154) |
| `curl -o`, `wget -O`, `Invoke-WebRequest -OutFile`, `scp`, `npm pkg set`, `npm version` and child-process strings of `node -e`/`python -c` wrote project files unreported, on the candidate and the prototype | R15 row extended, R13 (f), AC16 (C169, C170) |
| The kickoff implied completeness | section 4 states the limit of a listed-form hook and names CI policy-diff (C20) as the layer that holds regardless of form |

Checked and not a defect: lockfiles of other package managers as targets are not product or policy paths, so an executor with
`package.json` and `package-lock.json` in scope can still run `npm install`.

Measured after these corrections: probe lines 1–31 `REFUSED`, controls 32–44 `ALLOWED`; corpus 67 commands with added targets,
30 guarded, 6 executor refusals as before, 0 governance scope files, every 941 target kept, `FAILURES 0`.

Out of scope and listed in section 4: a path held in a variable (`$_` of a script block, `p15-run.txt` line 66) and
`-EncodedCommand`.
