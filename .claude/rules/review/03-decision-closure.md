# Opus review: verdict and closure

## R6. Finish the audit and consolidate findings

Before deciding, reconcile every binding R/AC with the inspected source and required evidence, every changed path
with ownership, and every previous finding with a verified correction or continued failure. Complete the affected
dependency sweep after a defect is found; do not create one revision per newly inspected file.

Classify each finding as implementation/test defect, task-design/policy defect, or unavailable environment/evidence.
Group shared root causes, include relevant regressions, and attribute an impossible instruction to task design.
For each blocking finding record severity, R/AC, exact location, observed/expected behavior, direct evidence,
impact, proposed resolution and its verification. Do not add new acceptance requirements during review without an
existing rule or explicit owner decision. Preserve uncertainty rather than inventing a cause.

**Exit:** all reviewable in-scope criteria have a disposition; unreviewable criteria and reasons are explicit.

## R7. Decide, then close or publish the verified next route

Read `shared/git-publication.md` now. Reconcile the full actual commit/range, not its title. Before a commit handoff,
complete its publication/source checks. Uncommitted files get a task-branch commit handoff. After `APPROVED`
hand off the branch push and PR creation; never a push to main. Hand off the merge only after
`ci-status.mjs --pr <number>` is green, and after the merge require exact-SHA `ci-status.mjs` success on main for
both stable summaries and every dependency; pending CI is not completion.

Decide for the whole assigned task, not only the latest stage. After an intermediate stage passes, reconcile open
obligations and perform the next available Opus action in this turn. A pending owner-validation result resumes this
step from current proof; it is not a reason to restart the audit. If the next assigned stage needs design, complete
it under shared readiness now; if already ready, preserve it. Apply the same publication checks as for a correction.
Do not invent a defect, create a redundant revision, or expand the assignment to justify continuing.

Use one decision only:

- `APPROVED` only when every primary requirement/AC and required QA evidence is verified with no unresolved P0–P2;
- `APPROVED WITH NOTES` only when approval conditions hold and only P3/notes remain;
- `NEEDS REVISION` for a wrong/incomplete result, missing required evidence, or missing/failed GR-3j mobile
  adaptation proof;
- `PARTIALLY VERIFIED` or `BLOCKED` when evidence/access cannot support a final verdict.

Before an `APPROVED WITH NOTES` verdict, every note is fixed in this cycle, written as an R/AC into a named saved
kickoff (its path in the note), or a `BLOCKED` owner question; a note kept only in a review file is an incomplete
review. A task whose objective is a CI job is approved only after `ci-status.mjs --pr <n>` (or exact-SHA
`ci-status.mjs`) shows that job green on the reviewed SHA; before that the decision is `PARTIALLY VERIFIED`.
Owner D14 (2026-11-02): a design, review or self-audit session writes and verifies every kickoff revision, new route
and cross-task text correction it finds necessary before its final handoff, or names it `BLOCKED` with the missing
owner decision; a final report that lists such work as not yet done is an incomplete handoff, and a `draft` sidecar
is not a substitute for the revised text.

For an accepted intermediate stage with outstanding assigned implementation/evidence, use task-level
`PARTIALLY VERIFIED` and identify the accepted scope. It permits a commit-only design handoff once the next route
is saved and verified; it is not whole-task approval and permits no implementation commit/push. If a concrete
external dependency prevents that transition, finish with plain `BLOCKED` instead.

Before any open-task review handoff, name the verified saved route using the plain line
`NEXT EXECUTOR CONTRACT: tasks/<actual-path>.security.json` under `shared/orchestration-state.md`. A promise to design
it later, deferred notes, or a backlog/session-only update is not a completed transition. A real missing owner
decision, apply result or access permits an exact `BLOCKED` report without Git; unfinished available design work
does not. GR-6 does not turn that unfinished work into a commit handoff.

Apply `shared/orchestration-state.md`: recheck candidate/input fingerprints after R4/R5 and before the verdict.
Validate contract/report/review bindings with the canonical helpers of `shared/workflow-gates.md`; reuse R4 runs
only while their inputs and required boundary evidence remain valid. Set `reviewed` only after approval conditions
hold. Check both stable CI verdicts on the
reviewed revision before any release claim. A red release-blocker check remains a release stop even if governance passes.

Under [shared/security-testing.md](../shared/security-testing.md), missing required frontend OR server security
tests, false-positive sensitivity proof, or substituted mock evidence for a required real boundary prevents approval.
Use `NEEDS REVISION` for deficient tests/implementation; use `PARTIALLY VERIFIED`/`BLOCKED` for genuinely unavailable
runtime evidence. Never infer an executable CI gate or release readiness from the presence of these Markdown rules.

Before approving a `governance` contract or writing a `rules`, `scope` or `tests` rebase entry, read and apply
[04-contract-rebases.md](04-contract-rebases.md).

For `NEEDS REVISION`, disable a confirmed unusable saved route as `shared/orchestration-state.md` requires, then
investigate and persist the consolidated, verified correction within this already authorized review cycle. Do not
end with an offer or ask whether to make the revision. Complete feasible evidence gathering before finalizing. Apply
`shared/task-readiness.md` in full to the changed route and affected dependencies; this is the same publication
boundary as task design, without loading a competing workflow parent. Update current scope/R/AC/commands, all
affected security contracts and active state records together; consolidate superseded instructions and preserve
open obligations. Reopen final files and rerun affected readiness checks before the commit-only owner handoff.

If the correction is not yet evidenced, keep the confirmed finding and state the exact readiness gap. Continue
independent investigation; do not fabricate a route to satisfy a same-turn amendment demand or send Sonnet to
discover whether it works. Name a genuine remaining dependency, not missing permission for routine review/revision.
Resume current checkpoints rather than repeat the audit after a go-ahead. Do not claim the kickoff ready when it is
not. For an incomplete final report,
use the plain `BLOCKED` status and no Git handoff as `shared/task-readiness.md` requires. If the same orchestration defect
recurs, rebuild the affected manifest and proof plan before issuing another revision. The obligation is a complete
verified correction, not a new revision number. For approval,
synchronize GR-5 state, archive the closed task/stale closed rows, re-read active backlog, run its gate, and emit the
required receipt. Rebind/revalidate moved artifacts under `shared/orchestration-state.md`, then reconcile real
status/diff and give the owner handoff permitted by `shared/git-publication.md` at the current boundary.
Never issue a handoff for unreconciled or unapproved work. Every permitted commit handoff is an unattributed owner
commit: `Co-Authored-By`, AI/agent credit, and `--author` are forbidden in every command and message.

The final response uses the concise headings and exact command format in `docs/orchestrator-procedures.md`; detailed
transcripts remain in the review/session record.
