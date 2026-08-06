# Evidence-first preflight

Read this before publishing a non-trivial implementation kickoff or issuing an implementation-review decision.
Complete the applicable sections of
`docs/orchestrator-evidence-preflight-template.md` in working notes. This is a fail-closed gate: an unobservable
claim, invalid scheduled command, or destructive re-run is not ready for execution or approval.

## Treat selected rules as unwaivable invariants

Complete `docs/orchestrator-rule-compliance-ledger-template.md` for every rule in the selected pre-read bundle.
An agent may identify a rule conflict but cannot resolve it by rewording the rule, narrowing its scope, declaring an
alternative equivalent, or calling its own decision an exception. Only a traceable owner decision may change that
outcome. An incomplete or non-compliant ledger row is `BLOCKED` or `NEEDS REVISION`, never a publishable task or
approval.

## Model the task as one executable route

Complete `docs/orchestrator-execution-contract-template.md` and retain the completed contract with the task or review
evidence. An unresolved owner choice is a blocked decision note, not a multi-route executor task. After the owner
chooses, regenerate every route-dependent scope, acceptance criterion, verification step, report requirement, and
handoff as one active contract.

For every checkpoint, record its preconditions, allowed writes, producer, persisted output, comparator, and failure
behavior. Test the zero/empty and non-empty forms of every dynamic count, manifest, or baseline. "Compare", "quote",
or a green self-check is not evidence unless an exact comparator can reject the counterexample.

## Establish the evidence contract

For every material requirement, acceptance criterion, or gate, record:

| Item | Observable claim | Exact source/artifact | Producing command and output | Matrix/branch scope | Status |
|---|---|---|---|---|---|
| R / AC / gate | | file + symbol, manifest field, or rendered capture | command + exit semantics | state, viewport, locale, branch | `VERIFIED` / `ASSUMED` / `UNKNOWN` / `BLOCKED` |

Inspect the code that produces every cited verdict, enum, baseline count, exit code, selector, default, or
allowlist behavior. A name, comment, prior report, or configuration entry is not proof of the emitted state.

For every command, establish its real reads, writes or overwrites, output schema, matrix, and exit semantics. A
command proves only what its own artifact observes. A missing baseline cell, selector, rendered page, or infrastructure
result must fail an assertion; a diagnostic reason alone is not a passing check.

## Preserve execution state

Label the work exactly `from-scratch`, `remediation`, or `mixed`.

For remediation, name the entry step, reusable artifacts, forbidden re-runs, and irreplaceable evidence. Do not
schedule a baseline capture when its only valid pre-change input is gone, and do not overwrite a saved baseline unless
doing so is explicitly safe. Name `fast`, full, route, Storybook, locale, and historical matrices exactly; never use
one as evidence for another without proving their scopes are identical.

## Verify write-scope viability

Before task publication, inspect the current worktree for every path the executor is required to edit. Record whether
it is `CLEAN`, `OWNED`, `EXCLUDED AS UNRELATED`, or `AMBIGUOUS`, plus any file-local limit or write constraint. The
task's Scope, Out of scope, verification plan, completion report, and handoff must name the same viable write set.

An `AMBIGUOUS` path containing unreviewed work from another task, or a capped file already over its limit, is not
available for a new task's required edit. Defer it, define an explicit non-growing consolidation, or obtain an owner
sequencing decision first. Do not publish a kickoff that both requires and forbids the same path.

## Authorize exceptions and make dirty-tree evidence reproducible

A task document cannot grant its own exception to an owner-only rule. A claimed owner waiver, approval, or
acknowledgement must quote or precisely reference the owner's actual decision, including its date, exact scope, and
any follow-up owner. Without that evidence, mark the task `BLOCKED -- OWNER DECISION REQUIRED`; do not label the
exception "owner-approved" or turn it into an executor choice.

When a task uses `git status`, a diff, or an "exactly these paths" claim in a dirty worktree, capture a read-only
starting `git status --porcelain` snapshot before the task writes anything. State the comparator and classify
pre-existing paths; compare the ending state to that snapshot, never to an imagined clean worktree. A raw final
`git status --short` cannot prove that a pre-existing modified path was untouched.

For each pre-existing modified path that the task claims was not touched, an equal porcelain entry proves only that
the same path is still modified. Capture a content witness before and after (a SHA-256 hash or read-only source
snapshot) and require equality. If another writer may change that path concurrently, the task cannot make an
untouched-content claim: sequence the work or return `BLOCKED`.

When the starting status is non-empty, complete
`docs/orchestrator-dirty-worktree-manifest-template.md` for every start entry before publishing or approving work.
The only alternative is evidence of an actually isolated clean worktree. `M`, `??`, deleted, renamed, staged, and
conflict entries all require an explicit row; a single special-file hash or an "if concerned" instruction is not
full scope protection. A task must also require the executor to recapture or update the manifest immediately before
its first write; review the actual-start manifest, not only the design-time snapshot.

For every exact count, baseline, manifest, or other stateful measurement, enumerate every task-created file that can
enter its input set, including session logs, scratch probes, and ignored artifacts. Fix their creation order relative
to each measurement. Capture the result before a new scanned artifact exists, or explicitly account for it. Do not
leave this timing to executor convention.

After revising a task, recompute its current quality gate. Verify every cited step, phase, AC, and artifact against
the actual execution order, and remove or clearly mark superseded statements. A task may preserve historical context,
but a current self-check must not report a retracted waiver, status, or route as passing.

## Separate UI evidence layers

Keep source rules, computed values, rendered geometry, and visual/pixel outcome distinct. A CSS rule or computed
value does not prove geometry; geometry does not prove a pixel-level result unless the selected QA profile requires it.

For a same-page synthetic style measurement, first establish that all other relevant root rules are equivalent. Record
the story, locators, matrix, temporary mutation, restoration in `finally`, epsilon, and limitations. Do not use a DOM
clone or a source swap as a substitute unless its cascade or restoration safety is independently proven.

Treat the intended mutation as its own asserted observation. For every cell, prove and persist that the synthetic
pass reached the requested state (for example, `synthetic.computed.columnGap === '0px'`) before interpreting a zero
geometry delta. Persist both raw `live` and `synthetic` measurements, including computed values, rects, and overflow
inputs, alongside derived deltas. A matching result without a recorded effective perturbation is `NOT VERIFIABLE`,
not preservation evidence.

## Attempt falsification

Before relying on a material claim, inspect a concrete counterexample: missing or stale baseline, a different matrix
mode, an enum branch, long locale text, narrow viewport, absent selector, stale build, repeated execution, or an
overlapping path. Record the result and correction or owner decision. Do not relabel an untested assumption as
`VERIFIED`.

Mark a falsification as `EXECUTED` only when its command/run or persisted artifact actually exercised the branch.
Label a source-derived counterfactual as `ANALYTICAL`; do not call it “fired”, “passed”, or “cleared”.

## Stop conditions

Return `DRAFT — NEEDS EVIDENCE`, `NEEDS REVISION`, `PARTIALLY VERIFIED`, or `BLOCKED` rather than publish or approve
when a required artifact cannot represent the claim, a command cannot run at its scheduled point, baseline evidence
would be destroyed, a required write path is not viable, or an owner decision remains unresolved.
