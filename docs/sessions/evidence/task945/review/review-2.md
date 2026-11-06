# Task 945 — independent review 2 of commit `51109a901`

Opus reviewer, 2026-11-06, a session that wrote no scope file of the contract (D2): its transcript starts at the owner's prompt of 2026-11-06. Native Windows 11, Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`, branch
`task/935-governance-approval-route`, candidate `51109a901251b0afd41c057e53a467a658dc0943`, parent `5dd561a14`. Raw output is next to this file, under `a-*` and `p05-*`, `p06-*`. The completion report was read as an index, not as proof.

**Decision: `NEEDS REVISION`.** Scope: all 47 files of the commit, with the three source files and four self-tests read whole. Count: P0 0, P1 0, P2 1, P3 6. Overall risk: **medium until revision 2 lands**, because a hook that runs by itself can overwrite another writer's work.
The correction is revision 2 of the kickoff, R21 to R23. This session implements and approves nothing of it (D1, D2).

## What the commit holds

Everything revision 1 asked for is there and passes. F1 to F22 of review 1 are closed, with two exceptions: F7's fix causes F23, and F11 closes only with the measure at approval. Of 35 lines I chose and broke in memory, 28 failed a test for the right reason. The harness is sound: 11 of 11 test groups pass under the same loader with a defect that changes nothing, and four catches read as too quick were read and are real assertions (`a-controls.txt`).

## Commands run on the candidate

| Command | Result | Evidence |
|---|---|---|
| `node scripts/workflow-gates/selftests.mjs` | exit 0, 310 of 310, 134.1 s; 0 failed, skipped or cancelled | `a-selftests.txt` |
| `cli.mjs sensitivity`, each of the eight break specs | exit 0 each; baseline passed, mutant failed with `ERR_ASSERTION` on the named test, restored passed; in memory | `a-s-*.txt`, the artifacts under `sensitivity/` |
| `cli.mjs governance-report` | exit 0, passed, 14 cases, 232 s | `a-governance-report.txt` |
| `cli.mjs verify` | exit 0, on the contract as committed | `a-verify.txt` |
| `cli.mjs plan` | exit 0, before this revision | `a-plan.txt` |
| `node scripts/workflow-gates/change-review.mjs` | exit 0, 492.7 s, 74 code files, base `d8a07a3c7` | `a-change-review.txt` |
| `node scripts/workflow-gates/hook-differential.mjs` | exit 0, 86367 compared, `LOST 0`, 0 exceptions, 11.3 s | `a-differential.txt` |
| `check-workflow.mjs`; `publication.mjs --base HEAD`; the CI lint | exit 0 each; 107 explicit files, 0 dependency errors | `a-check-workflow.txt`, `a-publication.txt`, `a-ci-lint.txt` |
| `refusedLines` on the real tree, merge base with untracked files | 0 results, 2523 ms | `a-ac11.txt` |
| `node scripts/check-mojibake.mjs` | exit 1 on files outside this task; 0 lines name `scripts/workflow-gates/` | `a-mojibake.txt` |
| Independence check on this transcript | 0 errors through every run above. Two later commands of this revision are read by the hook as writes of `cli.mjs` because they name its `hash` command; `git status --short scripts .claude` prints nothing. This session approves nothing, so it does not matter here | `docs/sessions/evidence/task944/review/r3-independence.mjs` |

`cli.mjs sensitivity` and `governance-report` rewrite evidence files of the contract, by the owner's instruction: the eight artifacts, `sensitivity.json` and `impl/governance-report.json`. No script, rule or test changed. The next implementer writes them again.

My own error, stated: while `change-review.mjs` ran, a prototype of mine wrote a stray `from-worker.json` into the project root, because a relative path resolved against the runner's folder. I removed it within a minute, it changed nothing tracked, and the prototype now uses an absolute path.

## Findings

Each finding: title, severity, CWE, location, impact, how to reproduce, fix, status. Reproductions run from the project root.

### P2

**F23. A hook undoes another writer's work.** CWE-362, CWE-664. `scripts/workflow-gates/mutation-check.mjs:140`, with the rest of `treeGuard`. Task design: R15 asks for this and the implementer listed it as a limit, so the code does what the contract says. The guard sees that a file changed and cannot see who changed it. Executed through the real main on temporary repositories: during a mutation run started by `SubagentStop`, and again by `Stop`, another writer's edit was overwritten and its new file deleted (`a-probes.txt:19,22`). The writer is told nothing. Only the session that ran the hook reads `Restored: ...`, and a copy waits in the ignored `test-results/code-check/mutants/restored/<pid>/`. Impact: every session works in one folder (`role-boundaries.md:79`), and `SubagentStop` fires from a session's own background tasks while its main agent goes on writing (`impl/completion-report.md:408`), so this needs no second session. The window is up to 120 s of every `Stop` with a change, and 8 minutes of `change-review.mjs` by hand. I found no such restore having happened yet: `restored/` does not exist. Same class and same severity as F7, whose repair it is. Reproduce: `node docs/sessions/evidence/task945/review/a-probes.mjs`, section 5. Fix: R21: each Node process of the run records what it writes, and the guard restores only that. The rest is named and left (`p05-attribution.txt`, `p05-compat.txt`: all forms, a spawned script and a Vitest worker are recorded, the gate suite passes 310 of 310 at 133 s, and 966 Vitest tests pass). What this gives up: a mutant that writes through a program that is no Node process stays in the tree, named. Status: open, revision 2.

### P3

**F24. Three of the five forbidden character groups of `UNQUOTABLE` have no test.** No CWE (test gap, of the CWE-78 fix). `code-check.mjs:20`. The percent sign, the backtick and the line breaks each go with every test passing; only `'` and `$` are held (`a-breaks.txt:26-28`). Fix: R22. Status: open, revision 2.

**F25. The package name allowlist is held only by names that also break it another way.** No CWE (test gap, of the CWE-78 fix). `dependency-check.mjs:18`. Accepting `&` passes every test, because each hostile fixture also holds a space or another character (`a-breaks.txt:29`). `a&calc` would then reach a shell on Windows. Related: the kickoff's expression lets a name begin with `-`, which the report states as a limit. It reaches `npm view` as an option and is no command; no real name uses it (`a-dash-names.txt`), so it can go. Fix: R22. Status: open, revision 2.

**F26. The differential's main is not held for a hook that throws.** No CWE (test gap). `hook-differential.mjs:133`. `|| result.thrown` can go unnoticed (`a-breaks.txt:34`), so a new hook that throws on every command could exit 0 once that line slips. Fix: R22. Status: open, revision 2.

**F27. A form the report calls equivalent is not.** CWE-451. `impl/r1-defects/equivalent.txt`, `code-check.mjs:296`; the report's words: "read only on an attempt that fails again". A note stored by a stage reaches the agent on a later attempt that passes, after another command did not finish (`a-probes.txt:6`), and removing the line passes every test (`a-breaks.txt:33`). A lost note, nothing that passes wrongly. The other 31 forms I read and accept, as reading. Fix: R22. Status: open, revision 2.

**F28. A control that wrote the tree goes on to one defect, unnoticed.** No CWE (test gap). `mutation-check.mjs:260`. Removing that line passes every test (`a-breaks.txt:32`), because the later check of the guard gives the same `error`; one more defect runs on a tree already known to be changed, against "no later defect". Fix: R21, R22. Status: open, revision 2.

**F29. The suite stops at its limit without a word.** CWE-390. `selftests.mjs:11-12`. Status null, `ETIMEDOUT`, exit 1, and nothing on stderr (`a-probes.txt:8`, `p06-suite-reason.txt`), so the tool reports `exit 1` over a tail of passing tests and an agent looks for a defect that is not there. It fails closed; it only misleads. This task made the limit reachable: the suite grew from about 15 s to 134 s of 180 s. My probe left no process behind on this machine (`a-probes.txt:9`). Fix: R23. Status: open, revision 2.

## Requirements and acceptance criteria

Each AC was traced to code and to the assertions of its test, read in the self-tests. Green means the test passes on the candidate and I read what it asserts; a defect I chose failed it where the second column says so.

| AC | Result | Evidence |
|---|---|---|
| AC1 to AC8 | Met; no regression from revision 1 | Suite; `a-s-*`; `a-differential`, `a-check-workflow`, `a-publication`; `task-readiness.md` 8185 bytes |
| AC9 | Met for the candidate. The approval items stay open; the count of critical cases is now nine | Suite, `a-verify` |
| AC10 | **Not closed, and one word cannot be met by this session.** The state file exists and `seen` holds `PostToolUse`; it holds no `SessionStart`. This session's own `SessionStart` is dated 2026-11-04 14:29 UTC, before the tool was registered in `0c1e09eb1` on 2026-11-05, and the client carried it into this prompt. The tool does record the event on this client: `f2a00155` holds `SessionStart` 3, and two state files of this morning hold it alone. No defect. The rebases were not written, since this is no approval | `test-results/code-check/82d44df1-9680-4901-a5e8-a327c0ce0905.json` |
| AC11 | Met | Case read; breaks 0 to 4, 7, 20, 21; `a-ac11.txt` |
| AC12 | Met on Windows; the case passes on every platform once CI runs it. Holes F24, F25 | Breaks 9, 10, 23 |
| AC13 | Met | Breaks 19, 22; the case read |
| AC14 | Met | Breaks 17, 18 |
| AC15 | Met as written, and the requirement is the defect F23 | Breaks 28, 29 |
| AC16 | Met, (a) to (f) read one by one; hole F27 | Breaks 13 to 16 |
| AC17 | Met for mojibake (`a-mojibake.txt`). The breaks of C94, C95 and C96 I did not rerun: I read their tests and `impl/r17-breaks.txt` | — |
| AC18 | Met; the two refusals read, and `secure-code-review.md` read whole, 7906 bytes | Breaks 11, 12 |
| AC19 | Met; `cli.mjs plan` exit 0 | Breaks 33, 34; `a-plan.txt` |
| AC20 | Met | The test read; `a-ci-lint.txt` |
| AC21 | Not reachable: no push before approval | — |

Security contract: fourteen cases, all allow, deny and error outcomes on the real functions, no mock of the unit under test. The doubles are an npm on the PATH and fixture commands, which is what those tests are about. Q1: the build is not rerun, because this commit reaches no build input; the author's run predates the last change.

## Open points of the report, each answered

1. **The suite's time.** 134.1 s here alone, and 133 s under my prototype, against 180 s: a margin of 25 %. Nothing proves CI's time; that is AC21. The silent stop is F29. The limit stays until CI is read.
2. **The note shown twice.** Reproduced: `SubagentStop` and `Stop` at once repeat it on the next `Stop` in 9 of 12 rounds, a `Stop` alone in 0 of 12 (`a-probes.txt:3-4`). That the one on 2026-11-05 came this way stays an inference. It repeats once and then stops (`a-probes.txt:2`). No check reruns. The kickoff's limit stands.
3. **Three limits and 32 forms.** `hashOf` and `bytesOf` throw on an unreadable file and no test reaches it on Windows: read, the code is right, accepted as a gap of the test. The copy branch at `code-check.mjs:194` changes nothing under `status.renames=copies`: read, accepted. The 32 forms: read, one refuted, F27.
4. **The limits table.** A name beginning with `-`: closed by R22, F25. `inBundle` entries: accepted, none exists. One `git grep` per deleted file: accepted. The guard of a mutant run: **not accepted**, F23. A refused text in a UTF-16 file: accepted, R10 says so. A stage's memory: accepted. Concurrent hooks: see 2. Linux kill: AC21.

Cost, measured on the real tree with no code change: 85 to 110 ms an event, 220 ms a `Stop`, which reads the diff (`a-probes.txt:11-17`). The kickoff's 80 ms is for the former; both are fine.

## Each line of `a-change-review.txt`, answered

The base is the branch's merge base, so the report lists other tasks' files too; `review-1-lines.md` still answers those it held.

- **Refused, Could not run, Undecided, What a deletion left behind:** none.
- **A check said less, 12 lines.** Eight in the self-tests of this task are fixture text put into temporary repositories: read one by one, no test of this project is switched off. Four mocks come from Task 931's commit `2693c6b9a`, not this task.
- **What an attacker reaches, 77 lines.** `code-check.mjs:237`: `runCommand` runs the registry's commands; a name reaches it only in quotes and a name it cannot quote is refused first, with F24 on the tests of that. `mutation-check.selftest.mjs:508` runs a command the tool composed in a temporary repository. `change-review.selftest.mjs:49-57,87-90,153` are rows of rule tests, never run. `push-safety.mjs:13` is Git's own blob id. The 66 `steers` lines: the commit's own steering files I read whole; the rest are unchanged by this commit and were answered in review 1.
- **What a changed test misses, 27 lines.** Product files of Task 931's smoke tests; Task 931 D29 owns them. No product file changed here.
- **Not tried, 29 lines.** Time ran out over the whole branch. The gate files of this commit were judged by the author's defect runs (read, `impl/r1-defects/`) and by my 35 breaks. These lines say nothing else.

## Not proven

- The first run on CI: `change-review.mjs` against 10 minutes, the suite against 180 s, the Linux kill (AC21).
- How often a write meets a mutation run in real work; no incident is recorded.
- That the note of 2026-11-05 came the way my probe shows.
- `p05-loader.mjs` is a prototype: the guard's change itself is not written, and the record covers what `node:fs` covers.
- `mutation-check.mjs --all` over the whole file: not run; 7 of my 35 breaks survived, so more may.
- No Git history scan, as in review 1.
