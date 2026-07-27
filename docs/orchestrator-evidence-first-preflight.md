# Evidence-first preflight

Read this before publishing a non-trivial implementation kickoff or issuing an implementation-review decision.
Complete the applicable sections of
`docs/orchestrator-evidence-preflight-template.md` in working notes. This is a fail-closed gate: an unobservable
claim, invalid scheduled command, or destructive re-run is not ready for execution or approval.

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
would be destroyed, or an owner decision remains unresolved.
