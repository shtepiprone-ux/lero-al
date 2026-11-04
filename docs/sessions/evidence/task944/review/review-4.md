# Task 944 review 4 (Opus, session f2fea951, 2026-11-04)

Verdict: **APPROVED WITH NOTES** (owner D21; no P0, P1 or P2 finding). This review is the independent approval of Task 944 under D2.
It treated `review-3.md` as an index and reran or reread each material claim. Every `r4-*` file below is this session's own output.
This text is the second version. The owner asked this session to check its own work; what that self-audit changed is in "Self-audit".

## Independence (D2, D21)

This session started with `/clear` and designed, implemented and reviewed nothing of Task 944 before this review. It wrote no file of
the 944 scope. The client's temporary task folder still carries the id 343df3cf, so it is the same terminal process as review 3 after
`/clear`; the transcript, which is what the Stop hook reads, is this session's own and holds none of that session's context.
`r3-independence.mjs` on this transcript: 0 errors at each run (`r4-independence-final.txt` is the last one). Evidence commands ran through
`r4-run.mjs`, which records the exact command, platform, Node version, cwd, output and exit code. The owner's one-job rule was not kept in
full: `r4-self-audit-commands.txt` lists 5 of the 17 commands that name a scope file as chained with other read-only commands, and none has a
forbidden form or a write program, so the hook counted none of them. Its count is by exact file path; a read-only chain that names only the
folders `scripts` or `.claude` is outside it. `cli.mjs governance-report` was not run and the kickoff was not moved: review 3 did both, and rerunning would write a scope file.

## Candidate and environment

- Commit `22c6871a31eaf693b16ad68c2e0f5ec290aeedea`, base `d17d9d5a8`; HEAD `94d20430b33d013d1044fc5b32185b04a0ee99ef` on
  `task/935-governance-approval-route`. `git diff --stat 22c6871a3 HEAD -- scripts .claude` prints nothing, and
  `git status --short scripts .claude` prints nothing before and after this review (`r4-fingerprint-before.txt`, `r4-fingerprint-final.txt`).
- Native Windows 11, Node v22.22.3, cwd `C:\Claude_Code_Projects\lero-al`. Task digest, plan digest and scope digest are in those two files.
- Read in full: the kickoff with revisions 1–3, the sidecar, `git diff d17d9d5a8 22c6871a3 -- scripts .claude` (1183 lines), `evaluateHook`,
  `governanceReport`, `runSensitivity`, the main command dispatch, and every `r3-*.mjs` script before running it.

## Requirement disposition

| R / AC | Disposition | Evidence |
|---|---|---|
| R1 / AC1–AC3 | Met. Refusals of R1 (b), three runs of R1 (c), digests of R1 (d), the load hook of R1 (e) and the record of R1 (f) read in the source. Beyond the self-test: a duplicate, skipped or absent named test, target traversal, a dotted spelling, extra keys, a text version, a non-text replace, a non-module target, a sensitivity file outside evidence and a malformed one are refused without writes; a parent `NODE_OPTIONS` and `SENSITIVITY_BREAK` do not reach baseline or restored. | `r4-selftests.txt`, `r4-mutants.txt` 1–8, `r4-counter.txt` |
| R2 / AC4 | Met. Five exact legacy paths; the check runs only for critical cases of a non-legacy task; one failure per branch. | `r4-mutants.txt` 9–13 |
| R3 / AC5–AC8 | Met. The guard call sits before the role checks in the one Write/Edit branch. The closure holds every file of an independent walk of whole-line imports and adds `prepush.mjs`, which `push-safety.mjs` reaches through a string-literal `import()`, as R3 (a) requires, and `check-workflow.mjs`, which `prepush.mjs` imports; 11 files. AC8: `impl/real-repo-guard.txt` opened, with the four named events, the 11 files and unchanged live digests. Multi-line, side-effect, star, named and dynamic imports are followed. Absolute, relative, backslash, upper-case, dotted, event-folder and `path` spellings are refused; a directory import and a Write without text are refused; `$&` in `new_string` is literal. The live graph links; about 60 ms per closure Edit. | `r4-probes.txt`, `r4-counter.txt`, `r4-mutants.txt` 14–21, `impl/real-repo-guard.txt` |
| R4 / AC10 | Met. Both sentences verbatim in the diff; `check-workflow.mjs` exit 0. | `r4-check-workflow.txt` |
| R5, R9 / AC10 | Met. Six `publication.json` entries; 92 explicit files, 0 dependency errors. A search of `scripts` finds no other importer of the two loader files; `cli.mjs` names one of them only by URL. | `r4-publication.txt` |
| R6 / AC9 | Met. In-memory `governanceReport` passed 9 cases, errors `[]`; retained report validates `[]` at current digests. Four in-memory records; each artifact's digests equal each other and the live target and test. The raw mutant block of each artifact was opened: exit 1, `ERR_ASSERTION`, the intended named test. `git grep -n "SENSITIVITY BREAK" -- scripts` printed nothing. `cli.mjs governance-report` not rerun; its closure run is `r3-governance-report.txt`, and the report's diff against HEAD changes only `task` and `contractSha256`. | `r4-report.txt`, `r4-counter.txt` |
| R7 / AC11 | Met; see below. | `r4-ac11.txt`, `r4-verify-935.txt`, `r4-rebase-digests.txt` |
| R8 / AC12 | AC12 met; R8 (c) has a reading gap, see N1. `r4-ac12.mjs` takes AC12 from the kickoff text, not from the task's test, and runs it on the final hook: 47 forms report X, yield `GOVERNANCE INDEPENDENCE` and refuse the executor; 21 controls report no X; 0 failures. Corpus: 2318 commands, sha256 `1eb5de48…`, dropped 0, added 2, guarded 0, executor newly refused 0, scope file 0, slowest 3 ms. F8: 2071 ms parsed, 7943 ms parser-rejected, both under 15 s. Adversarial 94 forms, 12 controls: the same result as review 3, line by line. `isReadOnlyShellCommand` does not read the extended sets. | `r4-ac12.txt`, `r4-probes.txt`, `r4-timing.txt`, `r4-adversarial.txt`, `r4-counter.txt`, `r4-forms-diagnosis.txt` |
| R10 / AC13 | Met. Three lines added, one removed, in the one fixture; `git diff --stat 1778c14b3 22c6871a3 -- scripts .claude` shows only that file; 17 of 17. | `r4-governance-contract-selftest.txt` |
| AC10 | Met. 201 tests against 192 in `impl/base-runs.txt`, the required 9 more; 201 pass, 0 fail, 0 skipped, 9 GOV-944 and 19 GOV-941/943 results `ok`; no other base self-test file in the diff; eslint exit 0; `cli.mjs verify` of 944 exit 0; `check:kickoff-evidence` exit 0. Three fresh runs of the four task test files in different file orders: 26 of 26 each (Node 22.22.3 has no seeded shuffle). | `r4-selftests.txt`, `r4-eslint.txt`, `r4-verify-944.txt`, `r4-kickoff-evidence.txt`, `r4-repeat.txt` |
| Q1 | Typecheck not applicable: no TypeScript file changed. `npm run build` exit 0. `check:file-integrity` exit 1 on two untracked `.nul` files of Task 923; none is a task file. `check:mojibake` exit 1, no task-changed file; see N3. | `r4-build.txt`, `r4-file-integrity.txt`, `task937/design/p11-third-mojibake-run.txt` |

## Review 3's mutants, rerun

34 breaks, in memory only, live digests unchanged: 31 fail the named case with `ERR_ASSERTION`; 21 fails by its rethrown error, the intended
failure of that mutant; 31 and 34 survive. I confirm review 3's reading of both: 34 is an invalid break, because a `load` hook cannot rewrite
its own module, and the four artifacts prove the behaviour; 31 is a test gap of a correct branch (N2).

## R7 rebases and AC11

The entries were written by review 3, and this review adopts them as the approver. It read the diff of each entry, `tests-rebase-935.md` in full, and the `## Changed scope files` list of all four scope evidence files: four files for 935, 940 and 943, the first and the last for 941, as R7 requires. AC11 (`r4-ac11-final.txt`, base
`origin/main` `d8a07a3c7`, working tree): 935, 940, 941, 943 and 944 each selected, no `validateDiff` error, release `[]`, report `[]`, chain `[]`;
`reviewedFreshnessErrors` `[]`. The current digest of each contract equals the end of its chain: 935 `9893459a…` (`tests` entry), 940 `1db15707…`,
941 `11686da5…`, 943 `b50491fa…`. With the base bytes of the 944 files each digest equals the `originalScopeSha256` of the first 944 entry:
`57f2f78a…`, `2ca83fb4…`, `17e727cd…`, `b82dbac3…`. `cli.mjs verify` of 935 exits 0, so the `tests` entry stays. The 20 other `validateDiff` errors are
the planned 931 and 942 contracts, as expected before those tasks are implemented.

## Corrections to the record

- `r4-rebase-digests.txt` prints `EQUALS last: false` where `r3-rebase-digests.txt` printed `true`. The script compares with the last chain
  digest, and the 944 entries now end each chain, so `false` is the expected value; the comparison above is the one that still holds.
- `scope-rebase-935.md`, `-940.md`, `-941.md`, `-943.md` say their session wrote no 944 scope file. `review-3.md` states the exact exception, the
  rule-mandated regeneration of `impl/governance-report.json`. That sentence is read with this correction; the files stay as written, because
  the rebase entries pin their digests.
- `sensitivity/sensitivity.json` keeps the `task` path of its run, under `tasks/Sprints/`. No validator reads it, and it is raw evidence of a scope file.

## Notes (P3, each with its home)

- **N1. Write forms outside the AC12 list.** Six groups in `r4-adversarial.txt`, 13 of whose forms an executor can still run (`r4-probes.txt`),
  as before Task 944. Owner D20: `tasks/Sprints/Sprint_92_kickoff_prompt_Task_942_Listing_Visibility_Allowlist_Current.md`, R4, AC6, AC7. The self-audit
  added four more spellings of the R8 (c) API forms, each missed by the base hook too and allowed to an executor (`r4-forms-diagnosis.txt`, `r4-ac12.txt`):
  a `mode=` after another keyword argument, `Path(…).open(mode=…)`, `rmtree(path=…)` and `\"` quotes inside a double-quoted command text. They are
  in the same kickoff, revision 3, R4 (f) (D13, D14), with `task942/design/p10-more-forms-run.txt` at `FAILURES 0`. The first of them is a judgement
  call: R8 (c) says "also as `mode=`/`flags=`", so `open('X', encoding='utf8', mode='w')` can be read as inside R8, though no AC12 form has it. This
  review treats it as D20 treated `open(file=…, mode='w')`: outside the enumerated acceptance, closed in Task 942. The owner asked that this be decided
  by programming best practice (D22), and the decision is to fix forward, not to reopen 944. The form is no regression, because the base hook misses it too
  (`r4-forms-diagnosis.txt`); the enumerated acceptance of AC12 holds; the hook is a workflow control with CI's policy-diff check as its outer layer
  (`shared/workflow-ci.md`); a revision would stale the report and all five rebases to deliver what Task 942 already carries with a passing prototype, in the
  same file, next in the sprint order; and the sprint plan requires 942 to be reviewed and committed before PR #12 merges, so the gap reaches main with neither route.
- **N2. The attached-script branch of R8 (d) has no test.** The same kickoff, AC6.
- **N3. A third tracked file for `check:mojibake`.** Commit 94d20430b tracked `r3-q1-integrity.txt`, a transcript of that gate, so Task 937 AC1 was
  unreachable and Governance Check would stay red. Found by this review and corrected under D14 in
  `tasks/Sprints/Sprint_92_kickoff_prompt_Task_937_Governance_Check_Product_Findings.md`, revision 3 (R2, AC1, C38–C41, proof
  `task937/design/p11-third-mojibake-run.txt`: tracked offenders 0 with both paths, 1 without). This review keeps no raw `check:mojibake` transcript
  for the same reason.

## Self-audit (owner request, 2026-11-04)

The first version of this file said more than this session had done, and the commit block given with it was not run: HEAD is unchanged.

- It said every scope-naming command was single-purpose; 5 were not (see Independence).
- It said "every AC12 form" on the strength of a green self-test, without comparing that test with the kickoff; `r4-ac12.mjs` now does.
- It said each rebase entry was checked, and described four evidence files, when only one had been opened; all are now read.
- It closed AC8 and AC10 and the sensitivity proof without opening `real-repo-guard.txt`, `base-runs.txt` or a raw mutant block; all are now opened.
- It reported "no defect" while no form of its own had been tried beyond the fixture spellings; that attempt found the four spellings of N1.
- `r4-counter.mjs` first failed on an exact closure comparison, and the check was then narrowed to a superset. The difference is explained
  above, but the narrowing is recorded here so it does not read as a first-run pass.
- The chat handoff named PR #12 from the backlog without checking it; `gh pr view 12` now shows it open from this branch into main.
- `docs/backlog.md` had 82 physical lines at HEAD against the 80 of `docs/orchestrator-procedures.md`, and the first report gave that number without
  saying that it exceeds the limit. Owner D23: no task and no new limit. Rows 744 and 745 are open, so they stay, but their full text is in
  `docs/backlog-reserved.md`, so they joined the existing reserved row and the file has 80 lines. `check:backlog-active` still does not enforce the limit.

## Finding set

No P0–P2 defect in the implementation, its tests or its sensitivity evidence; the R8 (c) reading is in N1. N3 is a defect of the review 3 evidence against another task's route;
it does not touch Task 944's requirements. The lowest-evidence row is AC11 / R7: it rests on digests and on the rebase rule, and its CI half
is outstanding.

## Unverified

- PR #12 CI for this commit: not run yet (owner push first). The task's objective is not a CI job, so this does not hold the verdict, but
  neither publication nor release is claimed. `check:mojibake` stays red in CI until Task 937 lands.
