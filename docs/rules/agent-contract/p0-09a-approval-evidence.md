9a. **Approval evidence is exact, complete, and fail-closed.** An approval is a proof about the final reviewed
    diff, not a judgment that the executor's narrative sounds plausible. For every P0/P1 acceptance criterion, the
    reviewer must verify the complete required scope: each named source/consumer, state branch, Storybook story,
    locale, viewport, baseline/final phase, and required command artifact. Evidence for one tuple never proves a
    different tuple merely because the component, values, or visual result look similar. A missing tuple is
    `UNVERIFIED`, not a note.

    When a task reproduces generated CSS, a selector, a policy-sensitive syntax, or a cascade outcome, equivalence
    includes the *whole emitted rule*: selector/ancestor relationship, `@media` and `@supports` conditions,
    cascade layer, source order/specificity where relevant, declarations, and custom-property semantics. Matching a
    declaration while dropping a guard or wrapper is a behavioral change. The reviewer must inspect the exact
    generated form for the changed input, not infer it from a nearby utility, a comment, or a generic example.

    A zero-diff artifact proves only the measurements it actually captured. Its review record must name its target
    scope and explicitly identify every required dimension it did not cover. A stale, pre-final, narrowed, or
    scope-mismatched artifact is missing evidence. No summary, aggregate count, reported command result, likely
    mechanism, or proposed follow-up can promote it to `VERIFIED`.

    For frontend implementation work (components, pages, styles, and browser-visible behavior), a review ledger is
    not required and must not be created by default. Record the reviewed diff, evidence, findings, and decision in
    the session log or review response. Create a frontend ledger only when the owner explicitly requests one.

    For non-frontend work, before emitting `APPROVED`, `APPROVED WITH NOTES`, or any commit/push handoff, the reviewer
    must have a completed proof-carrying ledger and adversarial pass for all primary criteria. If any required row is
    `UNVERIFIED`, `INFERENCE`, `UNKNOWN`, or `BLOCKED`, the only allowed decisions are `NEEDS REVISION`,
    `PARTIALLY VERIFIED`, or `BLOCKED`; no commit or push handoff may accompany them.

    For non-frontend work, the completed ledger is a retained JSON artifact at `docs/reviews/*.review-ledger.json`, created from
    `docs/review-ledger-template.json` and accepted by `npm run check:review-ledger`. For exact generated semantics,
    schema v4 requires a full immutable base commit, exactly one candidate per semantic row (never a sibling or a
    comma-separated set), structured before/after envelopes, and retained raw rules. An `EQUIVALENT` semantic
    assessment requires explicit owner authorization for every envelope delta and an equivalent negative probe. A
    non-approved `MISMATCH_RECORDED` assessment instead lists every unapproved changed field in
    `observedSemanticDeltas`, with an open P0/P1/P2 finding for each; an unequal negative probe must cite that same
    finding. The two forms are mutually exclusive for a field. Required tuple scope is similarly fail-closed:
    only evidence with `coverageRole: "COVERS"` closes a tuple; every exact remaining tuple must be declared in
    `coverageGaps` and linked to an open primary finding. Each non-`VERIFIED` primary row names its open finding in
    `findingIds`, and the finding names the same row in `requirementIds`. For `TAILWIND_V4`, `compiler.input` is a
    `BASE_REVISION_FILE` whose revision exactly equals `review.baseRevision`; the validator reads that CSS with
    `git show <base>:<path>` and recompiles the candidate itself. It rejects any imported repository stylesheet that
    differs from that base and checks imported package styles against the base `package-lock.json`. A path string or
    current-worktree input is not compiler evidence. The ledger's `review.coverage` and `review.ledgerGate` must
    equal values derived by the validator; the gate attests to ledger integrity, while the decision, finding state,
    and handoff attest to implementation outcome. Thus a complete `NEEDS REVISION` ledger passes locally with a
    prohibited handoff, but can never satisfy the reviewable-PR approval gate. Neither a narrative pass claim nor a
    hand-written aggregate can override a failed row. A non-frontend reviewable PR without a changed **approved** valid ledger is
    blocked in CI. A `.review-ledger.DRAFT.json` inside `docs/reviews/` fails the all-ledger gate, and a
    `.review-ledger.SUPERSEDED.json` must be named in the valid successor's `review.supersedes`; neither filename is
    an exclusion mechanism. Markdown prose may explain the verdict but cannot replace this artifact.

