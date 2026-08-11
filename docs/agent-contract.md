# Agent Contract

This is the short P0 contract for Claude Code agents on lero-al.

Long procedures live in:

- `docs/orchestrator-procedures.md`
- `docs/qa-profiles.md`
- `docs/ai-behavior.md`
- `docs/rule-index.md`

If a longer document appears to contradict this contract, stop and ask the orchestrator instead of choosing a
convenient interpretation. Clause identifiers are intentionally stable because other project documents cite them.

## P0 invariants

1. **Scope stays bounded.** Change only what the task requires. No drive-by refactors, unrelated cleanup, or hidden
   architecture changes.

2. **No invented architecture or facts.** If a required decision is missing and cannot be safely inferred from the
   repository, stop and ask.

3. **Existing capabilities stay reachable.** Do not remove buttons, row actions, filters, edit controls, navigation
   entries, status controls, validation states, empty/loading/error/success/cancel states, or downstream steps unless
   the kickoff explicitly authorizes removal.

4. **Editable controls cannot become read-only by accident.** If an editable control moves, the new editable
   location must be implemented in the same task. A read-only label is not a replacement.

5. **Existing UX flows remain intact.** Preserve entry points, sibling controls, downstream steps, state transitions,
   and cross-page effects unless the kickoff explicitly changes them.

6. **Current and required behavior must be explicit.** Every UI/control kickoff and session log must describe the
   current behavior to preserve and the required after behavior. Implementation kickoffs are saved under `tasks/`;
   chat-only handoffs are not sufficient.

6a. **Positive and applicable negative flows must be handled.** Every task defines the happy path and an
   applicability table for off-happy-path branches. Implement and verify every branch marked applicable; do not
   invent irrelevant branches.

7. **Localization covers all four locales.** Any new or changed user-facing string must be represented in `sq`,
   `en`, `uk`, and `it`, with runtime behavior verified according to the selected QA profile.

8. **Responsive verification follows the selected QA profile.** Use `docs/qa-profiles.md` to choose targeted Q2
   evidence or the full Q3/Q4 visual matrix. Historical fixed-width lists do not override the selected profile.

9. **Validation evidence is mandatory.** A completion claim must include the selected QA profile, exact checks run,
   actual results, and an acceptance-criteria self-audit. Every non-Q0 task must include the final `npm run build`
   result with exit code 0; a failed, unavailable, or stale build transcript blocks `IMPLEMENTED - AWAITING
   ORCHESTRATOR REVIEW` and all approval decisions. `tsc=0` alone is not proof of build integrity, UI behavior,
   regression safety, or visual conformance. When a required check cannot run because of a sandbox, native-binary
   mismatch, or timeout, record it as missing evidence and provide the owner exact native commands plus the expected
   evidence; return `PARTIALLY IMPLEMENTED` or `BLOCKED`, never a confidence claim.

   A deletion or rename also requires a whole-repository audit of its live downstream references: automation,
   governance scripts, catalogs, allowlists, CI/configuration, and current operational documentation. Update or
   remove every active consumer and run its relevant gate. A known active broken reference or non-zero required gate
   is part of the same task, never an out-of-scope cleanup. Report each command's real exit status; do not call the
   work clean, complete, validated, or ready for review while any required check is unrun or failing.

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

    Before emitting `APPROVED`, `APPROVED WITH NOTES`, or any commit/push handoff, the reviewer must have a
    completed proof-carrying ledger and adversarial pass for all primary criteria. If any required row is
    `UNVERIFIED`, `INFERENCE`, `UNKNOWN`, or `BLOCKED`, the only allowed decisions are `NEEDS REVISION`,
    `PARTIALLY VERIFIED`, or `BLOCKED`; no commit or push handoff may accompany them.

    The completed ledger is a retained JSON artifact at `docs/reviews/*.review-ledger.json`, created from
    `docs/review-ledger-template.json` and accepted by `npm run check:review-ledger`. A reviewable PR without a
    changed **approved** valid ledger is blocked in CI. Markdown prose may explain the verdict but cannot replace
    this artifact.

10. **Session evidence, backlog, and git ownership stay accurate.** Every completed implementation task updates
    `docs/backlog.md` with concise current task state and adds a session log under `docs/sessions/` with a
    "Files Changed" table matching the real diff. Sonnet does not add detailed history to the backlog and flags a
    `BACKLOG LIMIT BREACH` when it cannot keep the file at or below 80 lines. Opus validates Sonnet's backlog/session
    evidence against the real diff, then corrects or consolidates the backlog as needed. Agents may use read-only git
    for inspection. Mutating git is owner-only and native PowerShell only. Sonnet neither runs, emits, suggests, nor
    delegates mutating git commands, including any `git push` form, and it cannot approve its own task. Opus alone
    may issue an approval verdict after review; it may emit explicit-path commit commands after verified task design
    or approved review, and a push command only after an approved review, using the single handoff protocol in
    `docs/orchestrator-procedures.md`.

11. **Mobile and overlay behavior remain protected.** For in-scope UI below 640px, text controls use the full
    available width, mobile-reachable controls provide adequate touch targets, labels wrap without horizontal
    overflow, and popups follow the current Mantine or legacy bottom-sheet contract for that surface. Icon-only or
    domain-specific exemptions must be explicit.

12. **Rendered evidence follows risk.** UI compilation is only a baseline. Q2 requires targeted rendered evidence;
    Q3/Q4 visual work requires the full proof path and locale/viewport matrix defined by `docs/qa-profiles.md` and
    the relevant UI document. Missing required rendered evidence blocks approval.

13. **Storybook and no-hardcode gates remain enforceable.** Work touching stories, story-rendered primitives, or
    visual governance must follow the current Mantine or legacy Storybook proof path, use locale-backed visible
    strings, avoid forbidden raw controls, and provide machine-produced evidence when Q3/Q4 requires it. A green
    typecheck or Storybook build is not rendered proof.

14. **File integrity and encoding must be protected.** Touched text/source files remain UTF-8 without BOM, without
    NUL bytes, parseable where applicable, complete, and free of mojibake. Use owner-native or CI evidence as the
    authority when a sandbox read looks suspicious; a sandbox anomaly is a screen, not a verdict.

15. **Critical flows require regression proof.** If a task touches a flow in `docs/critical-flow-registry.md`, it
    must establish the existing baseline, preserve or add automated coverage for the changed behavior, and record
    the command/evidence. Manual checking alone is not enough for critical-flow closure.

16. **TailAdmin is the visual source for current UI.** New or migrated UI, and any task changing rendered chrome,
    must trace visual values to `docs/tailadmin-style-reference.md` and use Mantine for behavior/responsiveness.
    Legacy surfaces keep their existing token source until migrated. TailAdmin side-by-side evidence is required
    when styling or chrome is in scope.

16a. **A missing TailAdmin reference requires provenance, not invention.** If the bundled reference has no example
    for an in-scope primitive, the orchestrator must establish a live-captured or owner-waived reference row with
    provenance before implementation. The executor must stop if that source-of-truth row is missing.

16b. **UI styles require canonical provenance before code.** For every visible UI artifact, the task and executor
    must record the canonical-story/component/pattern search, its result, and the reused, extended, or newly-created
    shared source. A component-local utility chain, inline value, or scanner allowlist is not evidence of a canonical
    style. If no suitable source exists, create and register one in the appropriate library or stop for the missing
    design decision; do not improvise a local style.

16c. **Canonical Mantine Stories are the visual source of truth and cannot be bypassed.** Before publishing a task
    that changes a visible Mantine-migrated artifact, the Opus orchestrator must inspect its corresponding canonical
    Mantine Story and put the required Story work in scope; before implementing it, the executor must re-verify that
    result. If that Story exists, the same task must preserve or update it so it renders the migrated artifact with
    the same canonical primitive and state; neither the orchestrator nor executor may declare the Story out of scope,
    rely on a divergent demo stand-in, or use route-only evidence as a substitute. If no corresponding canonical
    Mantine Story exists, create it first (or in the same task before consumer migration), register it and its
    migrated production source with the applicable story-coverage path, then perform the migration. A pattern Story
    that receives a behavior-bearing node through a slot is not proof for that node unless it renders the real
    production component or an equivalent canonical composition; otherwise update the Story or create that
    composition Story. Stop for an owner decision if the required Story boundary is genuinely ambiguous.

## Role split

| Layer | Role |
|---|---|
| Opus orchestrator/reviewer | Plans, writes tasks, and is the sole approval authority after reviewing evidence and diffs. It emits owner-run explicit-path commit commands after verified task design or approved review, and an owner-run push command only after approved review. Does not write product code unless explicitly asked. |
| Sonnet executor | Implements code per the kickoff, self-validates, and writes session evidence. May inspect read-only git; cannot approve a task and does not run, emit, or suggest mutating git commands, including `git push`. |
| Owner | Runs mutating git natively in PowerShell and makes product decisions when rules conflict. |

## Required routing

Every task or review must route through:

1. `docs/rule-index.md` for the minimal rule bundle.
2. `docs/qa-profiles.md` for validation depth.
3. `docs/orchestrator-procedures.md` for task design and review protocol when Opus is planning or reviewing.

## What "report is not proof" means

The executor's report is an index, not evidence. Approval requires inspecting the actual changed files, the real
diff, and the validation artifacts required by the selected QA profile. A review is proof-carrying: for every
P0/P1 acceptance criterion, the reviewer records the producing source path/symbol, the artifact or command actually
inspected, and the observed result. A causal claim, an assertion that a branch is the only path, or an attribution
such as "not caused by this diff" is `VERIFIED` only after a concrete counter-check; otherwise label it
`INFERENCE` or `UNKNOWN`.

An unmet, changed, or unverified primary acceptance criterion blocks `APPROVED` and `APPROVED WITH NOTES`. A planned
follow-up is not evidence and does not repair the reviewed task's status. Before deciding, the reviewer must make an
adversarial pass that tries to falsify every material conclusion against the complete relevant function, producing
artifact, and failure-path evidence.
