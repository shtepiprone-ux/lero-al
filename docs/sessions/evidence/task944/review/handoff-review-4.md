# Task 944: handoff to the fresh Opus approver (review 4, owner D21, 2026-11-04)

Review 3 (session 343df3cf) finished the audit and the closure but cannot issue the verdict (`review-3.md`, top box). The closure is
uncommitted in the working tree on HEAD `22c6871a3`. You give the independent verdict. You write no scope file of the 944 contract.

## Do not repeat the trap

The Stop hook reads your whole transcript. A command the parser rejects (`$(…)`, `${…}`, a heredoc, backticks) that also names a
write program (`sed -i`, `rm`, `mv`, `cp`, `tee`, …) counts EVERY project path in that command as written. So any command that names a
file of the 944 scope, `scripts/workflow-gates/cli.mjs` included:

- has one job, no `$(…)`, no `${…}`, no heredoc, no write program, and no `node -e`;
- never joins a `sed -i` or `mv` for another file. Edit contracts and state records with the Edit tool.

Run `node docs/sessions/evidence/task944/review/r3-independence.mjs <your transcript.jsonl>` before the verdict; it must print 0 errors.

## Steps

1. Read the kickoff `tasks/Archive/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.md`, its sidecar, `review-3.md`
   and the `git diff d17d9d5a8 22c6871a3` of `scripts` and `.claude`. Treat review 3 as an index and verify its material claims.
2. Rerun, each as its own command with its output saved under this folder as `r4-*.txt`: `node scripts/workflow-gates/selftests.mjs`;
   `r3-report.mjs`; `r3-mutants.mjs`; `r3-adversarial.mjs`; `r3-probes.mjs`; `r3-ac11-harness.mjs`; `cli.mjs verify` of the 944 and 935
   contracts; `check-workflow.mjs`; `publication.mjs --base HEAD`. Do not run `cli.mjs governance-report` and do not move the
   kickoff: both are done, and running them would write a scope file.
3. Confirm the closure: `git status --short scripts .claude` prints nothing; the diff of `impl/governance-report.json` changes only
   `task` and `contractSha256`; the rebase chains end at the current digests (`r3-ac11.txt` format, `chain []`).
4. Decide. On approval: write `review-4.md`, set the sidecar's `review.evidence` and `review.evidenceSha256` to it, set the decision
   and `review.reviewedRevision` wording of the ledger (`r3-ledger.mjs` is its generator), and turn the "verdict pending" wording of
   `docs/backlog.md`, `docs/backlog-archive.md` and the sprint plan into your verdict; refresh the sprint plan's `taskSha256` in its
   `.security.json`; run `npm run check:backlog-active` and `npm run check:review-ledger`.
5. Run `r3-independence.mjs` on your transcript, then `node scripts/workflow-gates/cli.mjs receipt --contract <archived sidecar>` as its own
   command, then give the verdict with the explicit-path commit and the branch push of `shared/git-publication.md`.

The owner commits the Task 942 revision 2 set and its cited evidence separately, before you start (GR-6, commit-only design block of
review 3); check `git log` and `git status`, and carry every path that is still uncommitted. That commit holds no 944 closure file. If you find a defect, the 944 contract goes back through
`shared/orchestration-state.md`, and the owner decides on the closure; do not edit a scope file.
