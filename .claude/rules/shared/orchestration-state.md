# Candidate identity and execution readiness

Read at C5-C7 and R2-R7. Use the existing workflow evidence record; do not create another receipt/ledger.

## Disable execution while designing

`stage: planned|implemented|reviewed` describes implementation evidence, not design readiness. Every new or
revised sidecar uses `executionStatus: draft|blocked|ready`. Before editing an active route, Opus sets its affected
sidecars to `draft`; create new sidecars as drafts. When investigation proves the saved route itself unexecutable,
set its affected sidecars to `blocked` immediately, before continuing the independent audit; do not wait for R7.
An ordinary implementation defect does not by itself invalidate a correctly designed route. Blocking a route
does not invent a replacement or require a new kickoff revision. It stays blocked until verified correction.
Unmodified legacy contracts without the field remain compatible; introduce it when revising them, not by bulk
migration. `validateContract` rejects any present value other than `ready` for execution/publication. The flag is
bound by `planDigest`, so Sonnet cannot promote it or remove it through a metadata update. Reconcile overlapping
contracts: an obsolete ready contract must not remain an alternate execution route to the same affected work.
Executor writes through a `reviewed` contract are frozen even while its task is still active. For a verified
correction Opus reopens the affected contract in one save: `draft`/`blocked`, appropriate `planned`/`implemented`
stage and no prior approval. Publish only after readiness and fresh affected evidence; Sonnet cannot reopen it.

Each executor step names one sidecar covering its whole write set. On a contract switch, complete its current
task/rule reads and register its receipt before writing. Split a command spanning disjoint scopes into verified
steps, or have Opus establish a verified common scope; historical receipts never form a union of permissions.

Finish investigation, dependency/authority checks and feasible proof before promotion. Check the saved kickoff's
evidence gate. For structural validation while disabled, import the canonical `validateContract` and check
`validateContract(root, {...savedContract, executionStatus: 'ready'}, {phase: 'plan'})` in memory for each affected
sidecar. Do not persist that copy or invent a successful receipt. This checks the proposed ready version, not its
semantic quality. After all readiness observations pass, Opus saves `ready`, runs the real `cli.mjs plan --contract`
against each final sidecar, and records final digests. On failure restore `draft`/`blocked` and investigate; do not
hand off. A terminal `BLOCKED` report is not a substitute for disabling the saved unusable route.

## Bind proof to the actual candidate

Before validation record working tree or full commit SHA, task/contract identities and the input manifest. Include
changed/deleted/untracked paths, affected callers, mapped tests, fixtures, guards, rules, runner/config and lockfiles.
Use canonical `scopeDigest(root, contract)` plus `planDigest(root, contract)` and `digest(root, [task])`; extend the
manifest for any relevant input not covered. `scopeDigest` includes declared paths/tests and selected runtime
configs, not an inferred complete dependency graph. Inspect that graph; missing inputs are a design defect.
Record environment/approved target identity without secrets, producing commands, outputs and artifact digests.
Git status alone cannot detect another edit to an already modified file. Hashes bind inspected inputs, not meaning.

Immediately after validation and before publication/verdict, recompute the fingerprints and refresh changed paths.
Account for new dependencies, not only changes within the old manifest. A relevant change invalidates its affected
checks and dependents; repeat them on the new candidate. Unchanged unrelated work does not invalidate all proof.
Reused baseline, CI or rendered artifacts must match their claimed input revision and environment. Never label a
working-tree run as proof for an untested commit pair.

## Finalization without duplicate testing

For a review of an open task, the final handoff includes one plain line:
`NEXT EXECUTOR CONTRACT: tasks/<actual-path>.security.json`. It identifies the verified correction or next assigned
stage, not the completed stage's disabled contract. The Node Stop hook requires an active saved task, explicit
`executionStatus: ready`, a stage open for execution, and canonical plan validation with a current task hash.
An incomplete transition ends only on a concrete external dependency with plain `BLOCKED` and no route/Git handoff.
Whole-task `APPROVED`/`APPROVED WITH NOTES` instead takes existing release validation. This reference is not another
ledger or proof of semantic readiness: retain that proof in the existing review record and pass shared readiness.

Keep the current phase, completed checks with input/environment fingerprints and raw evidence locators, and the
next action or exact blocker in the existing session/design/review record. A progress message or owner question
does not start a new review. A later "begin"/"continue" resumes that checkpoint; it does not repeat the completed
audit. Refresh required reads/status and recheck fingerprints, then run only outstanding or invalidated checks.
An explicitly requested new audit follows its requested scope; ordinary continuation never implies one.

R4 performs independent execution. R7 rechecks identities and validates the retained report/review metadata using
the canonical helpers; it does not rerun an unchanged suite solely because the phase changed. Rerun when inputs,
environment, required boundary state or evidence validity changed, or when a required check has not run.
An owner apply/live-state check needs current boundary evidence even with unchanged local files.

After closure moves a task/sidecar, update paths, task hash and bound report/review metadata in dependency order;
preserve the original raw evidence. Revalidate final contract/report bindings and use the read-only closure
`receipt --contract <moved-sidecar>` defined by `shared/workflow-gates.md`; it cannot authorize another edit. A metadata
move cannot justify inventing new runtime results, and it need not repeat unchanged tests when their inspected
inputs and boundary evidence still match. Approval and the final owner handoff refer to this final saved candidate.
