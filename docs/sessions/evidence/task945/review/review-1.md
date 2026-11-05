# Task 945 — independent review 1 of commit `0c1e09eb1`

Opus reviewer, 2026-11-05, a fresh session that wrote no scope file of the commit (D2). Native Windows 11, Node v22.22.3, cwd `C:/Claude_Code_Projects/lero-al`, branch
`task/935-governance-approval-route`, candidate `0c1e09eb1`, base `929558a66`. Scripts and raw output are next to this file. The completion report was read as an index, not as proof.

**Decision: `NEEDS REVISION`.** Scope: all 42 files of the commit (`## Self-audit`, item 1, says how they were read), with `.claude/rules/shared/secure-code-review.md` section 4. Count: P0 0, P1 3, P2 10, P3 9. Overall risk: **high until revision 1 lands**, because a
tool that runs by itself in every session can execute a package name as a command (F1). The correction is revision 1 of the kickoff, R10 to R20, proven by `p01`, `p02`, `p03` and `r20-paths.txt` here. This session implements and approves nothing of it (D1, D2).
What the commit does hold: the quality and effect checks refuse at Stop, a check that hangs fails, and 14 of my 17 chosen in-memory breaks failed a test (`r03-breaks-c.txt`; its `deleted files` line of 0 s was a syntax error of my break, not a catch, and the rerun at the end of that file is the valid one; its last lines are proposed corrections, not breaks).

## Self-audit

The owner asked this session to check its own work before this record was final. It found these errors in its first report and in the first version of this file. Each is corrected below.

1. **"All 42 files read one by one" was false when written.** At that moment: 19 by the Read tool; rule, settings and small files by `git show` cut to 400 columns; eight sensitivity files as fragments; the governance report and the audit baseline in part or by script. Measured afterwards: no rule or settings file has a line over 400 columns, so that cut hid nothing. The sensitivity files, the governance report and the audit baseline were then read whole.
2. **A wrong location:** F1 said `dependency-check.mjs:29`; the name passes at `:28`.
3. **Wrong figures:** "390 ms" for the CI lint is 377 ms (`r09:3`); "What a changed test misses (37)" is 42; "Not tried (29)" is 28; "20 s mojibake" is 21 s (`r06:27`); "817 changed" is 812 (`p04:3`), against 712 on the CI run (`r17:13`).
4. **A figure with no source:** "CI ran the older suite at about 0.34 of local time" is retracted. It cannot transfer anyway: the suite now spends most of its time in a real `tsc`. Only the reading of R20 settles it.
5. **A figure presented as mine:** "57 s" and "over 3 minutes" per attempt in F9 are the author's table, not my measurement; F9 now says so.
6. **Not what the owner asked:** the owner asked for an answer to each line of the change-review report; I answered by groups and wrote "say nothing" for lines whose own text says a reviewer of security-relevant code runs the command. `review-1-lines.md` now answers each line, and the runs were made where they could finish; it names each that did not. Doing them found F22.
7. **A task that should not exist:** I said `check:surface-census:changed` had no owner and filed Task 946. D8 and the Task 942 kickoff say Task 942 is the policy half of that job, and D13 and D26 say no new task. Task 946 is withdrawn; the correction is Task 942 R15, proven by `p04`.
8. **A red check missed:** `check:kickoff-evidence` failed on run 41823787040 and reproduces here: a stale line of C25 in the Task 931 ledger. Corrected in that kickoff.
9. **A cause not named:** the Unit job failed with every test passing, on one unhandled error (`r17:5-10`). I had reported the symptom. Task 931 R14 now names it, with `r21-hydration-alone.txt`.
10. **F10 understated, and "except AGENTS.md" was false.** `CLAUDE.md` is refused only for a missing contract, and `.npmrc`, `.github/CODEOWNERS`, `.codex/RULES.md` and `docs/governance-enforcement.md` are open to Sonnet (`r19-measure.txt`). R19 now holds them all, proven by `r20-paths.txt`.
11. **A wrong date:** D27 is 2026-11-05, not 2026-11-04; the author's report has the same error. D26 to D28 were absent from the Sprint register and are there now.
12. **Deviation 8 was accepted without reading OWASP.** Now compared with the page: F21.
13. **No disposition by requirement:** the first version had none. See `## Requirements and acceptance criteria`.
14. **The final report broke the four-heading rule** of `docs/orchestrator-procedures.md:528-539`, a rule file I had not opened. `security-testing.md` and `workflow-gates.md` were also unopened then, and all three have now been read.
15. **The secret statement was unbounded:** see F2.

Confirmed correct by the same audit: every other cited line of `r01` to `r14` and `p01` to `p03`; the reproduce commands, run from their saved location; F1 to F20 otherwise.

## Commands run on the candidate

| Command | Result |
|---|---|
| `node scripts/workflow-gates/selftests.mjs` | exit 0, 288 of 288, 81 s; the claim holds |
| `check-workflow.mjs`; `publication.mjs --base HEAD`; the CI lint; `tsc --noEmit` | exit 0 each; `107 explicit files, 0 dependency errors` |
| `npm run build` | exit 0, 95 s |
| `cli.mjs verify` on the contract as committed | exit 0 |
| `node scripts/workflow-gates/change-review.mjs` | exit 0, 7.9 minutes wall, 74 files (`r10-change-review.md`) |
| `node scripts/workflow-gates/hook-differential.mjs` | exit 0, 15 s, 86367 compared, `LOST 0` |
| The `static` group, change-review apart (`r06-static-group.txt`) | failures: `lint` here only (two untracked task923 `.cjs` files; 0 errors in tracked files), `file-integrity` (15 untracked or pre-existing files), `mojibake` (adds F12), `enrolled-tailwind`, `design-tokens`, `surface-census:changed`; `check:ui-contract` and `check-mobile-adaptation-contract` exit 0 once given `--base origin/main` |
| `mutation-check.mjs --all` (`r11`, `r15`, `r18`, `r24`) | per file in `review-1-lines.md` |
| Live proof: `test-results/code-check/bde334f3-b0fe-4b70-914b-22e860e14cd8.json` | `seen` holds `SessionStart` 2, `PostToolUse` 160, `SubagentStop` 2, `Stop` 1 |

## Findings

Each finding: title, severity, CWE, location, impact, how to reproduce, fix, status. Reproductions run from the project root.

### P1

**F1. A package name in `package.json` runs as a command on the owner's machine.** CWE-78. `scripts/workflow-gates/dependency-check.mjs:17` starts npm through a shell on Windows, and `:28` passes the name unescaped. Impact: the check that exists because a model may invent a package name executes that name, by itself, in any session whose change touches `package.json`, and in `change-review.mjs` by hand; `.env.local` holds service keys on this machine. A prompt-injected name or a hostile branch is enough. Reproduce: `node docs/sessions/evidence/task945/review/breaks-d.mjs npm`; `r04-breaks-d.txt:28-29`, the marker exists for both. Fix: R12 (a), an allowlist before any process; no real name is refused (`p01`, line 2). Status: open, revision 1.

**F2. What must never enter the tree is refused only in files a row holds.** CWE-798. `code-check.json:16-20` says `**/*`, while `change-review.mjs:36` and `code-check.mjs:87` filter by rows first. 15698 of 17139 tracked files have no row (`r04:40`), among them every evidence file, the likeliest place for a pasted log. Impact: a live key in `docs/`, `supabase/`, `.env.example`, `tests/` or `.github/actions/` passes the hook and CI on a public repository (`r14:1`), while section 3 of the flow and the tool's own comment say it fails. Reproduce: `breaks-a.mjs`, `r01:11-20`. Fix: R10, one read of every added line, 104945 lines in under a second, 0 hits on this branch (`p01`, lines 18-22). Status: open, revision 1. What I can say of today's tree, and only this: over the 5 refuse patterns, 13854 of 17139 tracked files are text and were read, with two hits, both in a built Storybook bundle from 2026-08: one `NEXT_PUBLIC_` name with no value, one invisible text-direction character (`r07-secret-census.txt`); the branch diff has 0 hits; no env file is tracked. Git history was not scanned.

**F3. A deleted file that is no TypeScript leaves its consumers broken with a pass.** CWE-703. `code-check.mjs:196` drops a deleted file from `{files}` commands, and only `tsc` and the gate suite remain. R3 promises the consumer is reported; that holds only for TypeScript modules. Impact: deleting `scripts/lib/shared.mjs` gives `Stop 0` while its consumer's test no longer loads (`r02:5-6`); a deleted JSON gives `Stop 0` while `tsc` reports TS2307, because no row holds JSON under `src` (`r02:10`); a CSS module the same (`r02:9`). This is the owner's objective D25 and the chain the owner asked to break. Reproduce: `breaks-b.mjs`. Fix: R13, a `git grep` for what still names it, a note because 30 of 104 historic deletions are still named, many on purpose (`p01`, line 35). Status: open, revision 1.

### P2

**F4. A refused credential is printed whole.** CWE-532. `code-check.mjs:69`, `change-review.mjs:97-99`. Impact: the key reaches the CI log, the run summary and an artifact kept 14 days, on a public repository, and survives a force-push that removes the commit; locally it re-enters the agent's context. Reproduce: `r01:4-8`. Fix: R11. Status: open, revision 1.

**F5. change-review drops a file with a non-ASCII name.** CWE-176. `change-review.mjs:33,35` reads git's quoted form without `-z`, so no row matches. Impact: `eval` and a key in `src/lib/café.ts` give exit 0 and `0 code files`, untracked and committed, while the hook sees the same file. Reproduce: `r01:23-26`. Fix: R12 (c), R10. Status: open, revision 1.

**F6. A whole-tree gate that crashes can still pass.** CWE-390. `code-check.mjs:205-206`, `:176-177`. Deviation 2 closed the crash that names no file; a stack trace naming any real file under the gate's folders counts as a finding elsewhere, and the version is stored as passed. Reproduce: `r01:35`. Fix: R14, the form of a finding per gate, proven against both real gates (`p01`, lines 50-53). Status: open, revision 1.

**F7. "No file on disk changes" is false: a mutant overwrote a tracked file.** CWE-664. `mutation-check.mjs:165-176`; the claim at `completion-report.md:80`. A defect is stored in memory, but it is code that runs: flipping `if (update)` in a scanner writes its baseline, the run reports only `became !(update)`, and the tree stays changed. Real scanners hold such flags (`check-design-tokens.mjs:1394`, `check-enrolled-tailwind.mjs:100`); the one test of them I read, `scripts/__tests__/check-design-tokens.test.ts`, starts no process, so this is shown on a fixture and not on a real scanner. Reproduce: `breaks-d.mjs mutant`, `r04:8-9`. Fix: R15; the first prototype lost an untracked file and the union fixed it (`p02`). Status: open, revision 1.

**F8. The report misleads in four ways.** CWE-451. (a) A check that could not run sits under `## Lines no test checks` (`change-review.mjs:64-65,75`, enshrined by `change-review.selftest.mjs:255`; `r01:46-47`). (b) A run with only undecided defects reads as time having run out with `0 not tried` (`mutation-check.mjs:234`; `r01:48-49`). (c) `never loaded` is false for `sensitivity-register.mjs`: `cli.mjs:295` replaces `NODE_OPTIONS`, so the loader cannot be there; and my run listed it while the author's listed 0, so the section depends on the schedule. (d) The list headed "steers every later agent or runs by itself" omits this tool and every gate script, and `pipeline.json`, though all changed (`code-check.json:37`). Fix: R16 (a), (b), (c). Status: open, revision 1.

**F9. A subagent that wrote nothing is refused eight times and reruns the failure eight times.** CWE-400. `code-check.mjs:283,304-317`. The report states the limit; the cost is the finding: by the author's table each attempt on a shared util costs from 57 s, which I did not measure. The session cannot act on it, and the message tells it so. `SubagentStop` also fires here with no subagent started (`seen` above), so this is not only about subagents. Reproduce: `r01:52`. Fix: R16 (d), (e). Status: open, revision 1. This narrows R3 for `SubagentStop`; `Stop` keeps refusing, so nothing can finish on a failing version.

**F10. Sonnet may edit the files that steer other tools and installs.** CWE-284. `contract.mjs:78`; `r19-measure.txt:2-8`. `AGENTS.md`, `.npmrc`, `.github/CODEOWNERS`, `.codex/RULES.md` and `docs/governance-enforcement.md` are allowed outright. `CLAUDE.md` and `docs/orchestrator-procedures.md` are refused only for a missing contract, so a contract naming them lets Sonnet write. Impact: the executor can change what other tools are told, where npm installs from and whether install scripts run. Deviation 9's reason is wrong: widening the validator touches no contract beyond the five R9 already rebases (`r12:1-5`), the whole suite stays green with all of them (`r20-paths.txt:10`), the sidecar validates (`p03`), and each of them this branch changes other than `AGENTS.md` is held by a reviewed governance contract (`r20-paths.txt:2,4`). Fix: R19, all of them. Status: open, revision 1.

**F11. R9's exact lists are short by one file each (task design).** `.claude/rules/README.md` for 935 and `.claude/rules/review/02-adversarial-ui.md` for 944 (`r08:2,6`). The scope grew after C50 measured. An approver following the text writes evidence the digest refutes. Fix: R9 now takes the lists from the measure. Status: corrected in revision 1.

**F12. The new self-test adds a mojibake finding, so Task 937's AC1 becomes unreachable.** No CWE (encoding hygiene). `code-check.selftest.mjs:480`, and `:415-416`, whose comment says `Escapes` over literal text. `r06:29`. Fix: R17. Status: open, revision 1.

**F22. The command the report gives a reviewer tries nothing.** CWE-451. `mutation-check.mjs:234`, with `changedLines` defaulting to `HEAD` at `:96`. Found only by doing what the report says. A `not tried` line for a gate script names `mutation-check.mjs <file>` with no base and no `--all`. Once the change is committed, that command compares with `HEAD`, finds no changed line and prints `0 defects`, exit 0. Impact: 16 of the 28 `not tried` lines name this form, and a reviewer following one gets a clean count for code nothing judged; I ran three of them. `mutation-check.selftest.mjs:441` pins the text, not its effect. Reproduce: `node scripts/workflow-gates/mutation-check.mjs scripts/check-listing-visibility.mjs` (`r24-mutation-last.txt:4,79,82`). Fix: R16 (f). Status: open, revision 1.

### P3

**F13. A file name reaches the mutation command through a POSIX shell.** CWE-78. `mutation-check.mjs:133`, with `runCommand` at `code-check.mjs:136`. The hook refuses such a name (`UNQUOTABLE`); the mutation path does not. Impact: execution on the Linux runner, with no gain over the tests a pull request already runs, hence P3; the author's answer to line 136 of the report, "commands from the repository's own registry", is incomplete. Reproduce: `r04:21-22`. Fix: R12 (b). Status: open, revision 1.

**F14. A count cannot see a replaced key or a moved call.** CWE-697. `code-check.mjs:66`. `r01:28-32`. Fix: R10 for the key; a stated limit for the moved call (R18). Status: open, revision 1.

**F15. A commit hides a version that failed before it, and a new session forgives what is dirty.** CWE-693. `r01:38`. CI remains the barrier. Fix: a stated limit (R18). Status: open, revision 1.

**F16. Three gaps of the dependency check.** CWE-353, CWE-494. `dependency-check.mjs:55`, `:71-72`, `:60`. A deleted `package.json`, a lock entry with no `resolved` and no `integrity`, and a change of the lock file alone (`r01:41-43`). The last is not named among the limits. Fix: R18. Status: open, revision 1.

**F17. The repeated note has a shown mechanism.** CWE-362. `code-check.mjs:120-125`, `:324-329`. Stop and SubagentStop at once repeat the note in 3 of 6 runs here (`r01:56`). That this is what happened on 2026-11-05 stays an inference. No check reruns. Fix: a stated limit with its cause (kickoff section 3). Status: open, revision 1.

**F18. Three of my breaks passed the whole suite.** No CWE (test gap). A hung check counted as passed after the grace period (`code-check.mjs:152`), a differential main that always exits 0 (`hook-differential.mjs:129`, so AC6's real-main proof lives only in a gitignored probe), and dropping `--no-renames` (`change-review.mjs:35`). `r03:7,11,14`. Fix: R17. Status: open, revision 1.

**F19. Open point 6 of the report overstates.** No CWE. It says rule files stale other tasks' `rules` digests; measured, this commit hits no reviewed contract's rule inputs, only their scope (`r08`: `ruleHits` empty). Status: answered here.

**F20. The tool does not run the CI lint config.** No CWE. The author's open point 3: 5 errors the tool missed and CI would not. It costs 377 ms (`r09:3`). Fix: R20. Status: open, revision 1.

**F21. The flow's checklist omits items of the page it is taken from.** No CWE (rule text). `secure-code-review.md:70-81`. The diff-based steps, data flow and finding and summary templates match the OWASP page. The checklist has no parameterized queries, path traversal, deserialization or XXE, password hashing, lockout, MFA, secure reset, concurrent sessions, certificate and hostname validation, TLS, environment separation or alerts, and the preparation omits threat models and previous security findings. Impact: a reviewer following the list does not ask these. Reproduce: read the two side by side. Fix: R18; the file stays under 8 KB. Status: open, revision 1.

## Requirements and acceptance criteria

This review does not close the requirements of `0c1e09eb1`: R1 to R9 stand with the deviations below, and the holes above go to R10 to R20.

| AC | Result on the candidate | Evidence |
|---|---|---|
| AC1 | Met | Case passes; my break fails it (`r03`) |
| AC2 | Met | Case passes; sensitivity artifact read whole |
| AC3 | Met for TypeScript; the promise for other deleted files fails: F3 | `r02` |
| AC4 | Met, Windows branch; the Linux branch is unproven until R20 | Case passes; `r03:7` is F18 |
| AC5 | Met, as amended by revision 1 on D26 | Self-test; registry read |
| AC6 | Met; the real main's proof is in a gitignored probe: F18 | `hook-differential.mjs`, exit 0, `LOST 0` |
| AC7 | Met | Case passes; `check-workflow.mjs`, `publication.mjs` exit 0 |
| AC8 | Met | `task-readiness.md` 8185 of 8192 bytes; `workflow-gates.md` unchanged |
| AC9 | Not closed: its approval items wait for an approved commit. The eight cases exist in the self-test, 288 of 288 pass | `r06`, self-tests |
| AC10 | Not closed: the verdict is not an approval. Its live half holds: `seen` above | Live proof |

## Deviations 1 to 9

| # | Decision | Evidence |
|---|---|---|
| 1 PowerShell row | **Accepted.** The form of C31 is the proven one, and the test exists. | Kickoff C31; `code-check.json`; the self-test passes. |
| 2 Crashing gate | **Accepted in part.** Right direction, incomplete: F6. | My break of `:206` fails a test (`r03:1`); `r01:35`. |
| 3 Note a subagent received first | **Accepted**, with the race stated: F17. | `r01:56`. |
| 4 Missing state and the write | **Accepted.** | My break fails its test (`r03:4`). |
| 5 Rows and roots | **Accepted**, on D26. The kickoff was not edited; revision 1 does that (R5, AC5). The owner's words had no ledger row; D26 now holds them. | Registry read; `test-results/task945-impl/real-chain-first.txt`. |
| 6 What makes a check quieter | **Accepted.** A heuristic and a note, which is what a pattern can honestly be. A deleted test is named (`r04:12-13`). | Self-tests; `r04`. |
| 7 Mutation check | **Accepted**, on D27, with its false claim corrected: F7, F8. | `r04:8`; `r11`. |
| 8 OWASP flow | **Accepted**, on D28, with F1, F2, F4, F5, F16 and F21 corrected. Its steps and templates match the page, and the implementer did fetch the named sheets; its checklist does not cover all of it, and its section 3 says more than the tool does. | Sections above. |
| 9 Scope and two files outside | **`.codex/RULES.md` outside the commit: accepted** (`git ls-files .codex` empty, `.gitignore:90`), though R19 still keeps Sonnet off it. **`AGENTS.md`: rejected**: F10. | `r19-measure.txt`, `p03`. |

## The stated limits, checked

- **`mutation-check.mjs`, 21 of 317:** 317 matches this run's report; the 21 was not rerun, so it stands as the author's figure. It is an honest number and a thin one: the file that judges every test is itself mostly unjudged.
- **CI:** nothing of this commit has run there. Run 41823787040 ran `4f1850fb0` (`r14:2`). It failed for reasons this commit did not cause, by job: Governance Check, Unit, Click-Shield, Locale Leak 1 to 4, Task Security Contracts (931, 942 not reviewed). Each has an owner:

  | Failing | Owner |
  |---|---|
  | `file-integrity`, `mojibake`, `enrolled-tailwind`, `design-tokens` (`r14:13-15,17`) | Task 937 |
  | `listing-visibility` (`r14:19`) | Task 942 R1 to R5 |
  | `surface-census:changed` (`r14:16`): every changed path counts against the limit, though all are ones the gate excludes (`p04:3-10`) | Task 942 R15, revision 6 |
  | `kickoff-evidence` (`r14:18`): the literal of C25 moved to `cli.mjs:20` | Corrected by this session in the Task 931 kickoff |
  | Unit: 5931 passed, one unhandled error (`r17:5-10`) | Task 931 R14 |
  | Task Security Contracts | The reviews of 931 and 942 |
  | Click-Shield; Locale Leak | Tasks 938, 939 |

- **8 minutes against 10 and 35:** my run took 7.9 minutes with other work on the machine, and its deadline is hard in the code. The fit is by reading: a margin of 2 minutes, unproven on Linux, and 119 s for the rest of `static`. R20 requires reading the first real run.
- **80 s against 180 s:** 81 s here. How it runs on CI is unknown: the base suite took about 15 s locally (`impl/base-runs.txt`) and the new one is slower through a real `tsc`, so no ratio carries over. R20.
- **The repeated note:** F17 shows a mechanism.
- **`AGENTS.md`, `.codex/RULES.md`:** deviation 9.

## Does the tool hinder normal work

| Moment | Measured | Verdict |
|---|---|---|
| Event with no code change | 82 to 86 ms (`r04:32-36`) | Fine |
| TypeScript write | about 10 s (author); 3 at once 5 s here on a small fixture, no false failure (`r04:17`) | Acceptable, and a real slowdown over many writes |
| Stop with a change | by the author's table 57 s and up for a shared util; 21 s mojibake (`r06:27`); up to 120 s mutation | Slow and honest; a long task pays it once per version |
| A note | once per version, again on the next version of the same legitimate line | A real cost, and accepted: it is what reading a line costs |
| The cap of 8 | F9 | Needless; R16 |
| Sonnet | refused on policy paths; a subagent as in F9 | R16 |

## Each line of `r10-change-review.md`, answered

`review-1-lines.md` answers each of the 117 lines: A check said less 11, what an attacker reaches or steers 35, lines no test checks 1, what a changed test misses 42, not tried 28.

## For the owner, separate from this task

Confirmed holes in product tests, each executed in memory with every related test still passing (`r05:1-3`); no product file or test was changed:

- `src/modules/listings/actions/contactEvents.ts:63`: a listing lookup failure returning `undefined` goes unnoticed.
- `src/modules/listings/actions/contactEvents.ts:109`: the same for an unexpected error.
- `src/modules/listings/actions/submitListingInquiry.ts:46`: one `||` of the fail-closed rate limit; a count of `null` with no error is untested.

Further real gaps the runs with all tests found (`review-1-lines.md`):

- `src/modules/admin/actions/permissions.ts:206`: an unexpected failure of saving a permission would read as success.
- `src/modules/admin/actions/permissions.ts:198`: a failed audit insert of a permission change would go unlogged.
- `src/modules/listings/actions/applyListingTransition.ts:161,163`: no test notices public pages not being refreshed after a status change.
- `src/app/admin/listings/page.tsx`: 53 of 55 defects unnoticed: no test renders the staff page past its guard, so its filters and search are unchecked. The guard at `:20` is caught.

Six decisions stay the owner's: upgrade `next` and `@sentry/nextjs` (2 critical, 9 high in production by the author's `npm audit --omit=dev`; my full audit shows 4 critical, 33 high, by package); `ignore-scripts=true` in `.npmrc`, effect on the build not measured; CODEOWNERS, none exists; agents' access to `.env.local`; the MCP allowlist and Vercel write tools; whether the real test gaps above are closed, and where. D13 and D26 argue against a new number; Task 931 is the test-only product task of this sprint and could hold them through a revision.
