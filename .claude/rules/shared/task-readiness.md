# Task readiness before every executor handoff

Owner instruction, 2026-10-22: task design and implementation review must follow separate ordered workflows with
analysis and verification. This shared boundary applies to new tasks and to every correction produced by review.
It supplies the publication checks; it does not require loading the other role's parent workflow.

## Evidence record and meaning

Use the existing design/review/session record. For each workflow step retain `step | source/command/artifact |
observation | PASS / FAIL / BLOCKED / justified N/A`. Link detailed manifests and raw output rather than copying
them into the kickoff. For frontend review use its existing session record, not a new review-ledger artifact.
A command observation includes native platform, Node version, cwd, exact invocation, output and exit code.
Mark source-only reasoning as ANALYTICAL and an actual probe as EXECUTED. A receipt, hash, literal match or green
schema validator does not prove semantic correctness or runtime permission.

Do these checks after the solution and proof are designed and before calling the saved task ready:

## 1. Close the affected-path manifest

For each changed symbol list its production callers, tests, direct/composition Stories, fixtures, generated outputs
and registry/contract entries. Search both imports and non-import consumers such as string IDs and script inputs.
For deletion inspect every reference and its replacement/removal, including tests and sensitivity scripts. For an API
or data-read change inspect test doubles and error expectations. Classify each dependent path as change, unchanged
with evidence, Opus prerequisite, or outside the assignment with a verified preservation boundary.

Reconcile the manifest with scope and every affected security contract, including already implemented contracts.
Changing/removing an implementation does not automatically retire its security invariant. Replace or remove a case
only after proving the boundary it protected is preserved or deliberately removed by an explicit owner decision.
An unexamined caller, stale case or required out-of-scope edit is a design defect, not work for Sonnet to discover.

## 2. Check actual write authority

Classify every executor write path with the canonical `isPolicyPath` exported by
`scripts/workflow-gates/contract.mjs`, which is also used by `security-hook.mjs`. Check exact contract scope, project
root and any UI/Story pre-write conditions. `scripts/check-*`, hooks, workflow policy and other policy paths cannot
be assigned to Sonnet, even when the desired edit is one line. Resolve Opus policy prerequisites first and validate
them, or mark the route blocked. Product contracts describe executor writes; unchanged policy can be a rule/input.

Check scope enrollment for helper scripts/docs too; the built-in product-path list is not the whole write set.
Use one current security-task receipt; a stale receipt cannot supplement the current scope.
`plan` rejects policy in product scope; it does not inspect every dependency, command or actual future executor
transcript. Verify those separately. Never manufacture a successful executor receipt or bypass a hook to test a route.
For a fresh session, inspect its supported role/root setup and specify its required reads/receipts as execution
preconditions; do not claim to have inspected a future transcript or require future implementation tests to exist.

## 3. Check command inputs and timing

For each required command record `actor | phase | exact command | input state | writes/effects | expected
assertion/artifact | prerequisite`. Inspect its real argument parser and output semantics. Run existing focused
checks/probes where safe. Verify the installed runner, target configuration and environment availability without
printing credentials. Planned tests may not exist yet; demonstrate their runner/fixture prerequisites on existing
targets and say which assertion remains to be implemented. Do not pretend future implementation tests ran.

Separate working-tree checks from commit-pair checks. A gate reading committed blobs cannot verify uncommitted
changes; name its verified base, the owner commit prerequisite, subsequent head, and the reviewer who will run it.
Missing artifacts, credentials, builds, migrations or owner applies must be explicit, acyclic dependencies, not assumed state.
Assign required evidence to the phase where its inputs will exist; approval/release remains blocked until it exists.

## 4. Challenge the proposed proof

For each changed behavior identify its allow control, relevant refusal/error, preservation regression, and observable
forbidden effects. Inspect actual assertions in reused tests and run them on the current scoped baseline. Record
pre-existing failures with matching test identities and causes; a failing total alone is not a comparator.

For a gate or critical security invariant specify what deliberate break reaches which assertion and how it is
restored. For a governance gate module the break is a saved break spec run by cli.mjs sensitivity; a kickoff never
instructs editing a live file to plant a break (Task 944). Confirm the break is allowed in this task/environment. A read-only DB task cannot require mutating its
schema/policies for sensitivity; use a demonstrated same-check negative control when the security contract permits
it, or sequence an authorized sensitivity prerequisite. Timeout, missing credentials and import errors are not
assertion failures. Never reduce a security/QA requirement simply to make readiness pass.

## 5. Validate the exact saved contract

Reopen the final kickoff and sidecars after the last edit. Check every amended R/AC, scope/out-of-scope, command,
internal reference, prerequisite and completion condition together. Follow `shared/orchestration-state.md` for
draft/ready promotion and input fingerprints. Run `check:kickoff-evidence` on the explicit saved path and final
`cli.mjs plan --contract` for every affected ready sidecar, plus selected publication gates. The former
validates evidence literals and R/AC citations across requirement/AC sections, including later numbered revisions;
neither command establishes the semantic claims above. Bind the readiness record to the final task/contract digests.
Any later relevant change invalidates the affected check and its dependents.

## One current route and recovery

Keep one current execution route in the kickoff: start step, ordered actions with actor/prerequisites, exact write
set, required evidence and completion conditions. Historical reviews belong in evidence records. When revising a
long kickoff, consolidate superseded instructions and update references/digests without losing owner decisions,
open obligations, stable case IDs or evidence. Never silently erase an unresolved requirement during consolidation.

If the same orchestration defect returns, reopen the entire affected manifest and command/test plan before another
handoff; fixing only the newest reported path is insufficient. Collect related defects in one correction. Do not
impose a revision-count limit or waive approval criteria to stop the loop.

Continue independent investigation when blocked. Keep a confirmed review finding even if its correction is not
ready; do not write or present an executable replacement until its prerequisites are verified. No Sonnet handoff or
ready-task commit command may be produced for a failed readiness check. A saved investigation draft, if necessary,
has disabled sidecars as `shared/orchestration-state.md` requires. For an incomplete correction, finish with
the plain `BLOCKED` status line; do not combine it with approval, implementation completion or Git commands. The
Opus Stop gate permits that incomplete report and rejects a contradictory handoff; contract validation denies drafts.
Existing Stop/CI checks remain cumulative; this workflow record is reviewer-inspected evidence, not a claim that
Markdown mechanically enforces reasoning.
