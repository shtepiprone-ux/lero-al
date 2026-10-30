# Opus task design: executable kickoff contract

## C3. Select one evidenced solution

Start with C2's reproduction, end-to-end trace and affected-path manifest. Compare feasible approaches against owner
requirements, existing canonical owners and preservation obligations; record the chosen approach and material tradeoff.
Choose the smallest complete change, including dependent consumers and regressions. Inspect relevant installed API
guides before prescribing an unfamiliar/version-sensitive API. Resolve policy work, schema/app ordering and owner
applies as explicit prerequisites. Do not add a requirement merely because it sounds like a best practice.

Order prerequisites as an acyclic dependency graph: an owner apply/commit may be an explicit later prerequisite,
but final approval cannot depend on a gate that first requires that same approval. An unresolved cycle is blocked.

**Exit:** the change is supported by inspected behavior and explicit owner intent; there is one route and no hidden
prerequisite or policy edit delegated to Sonnet.

## C4. Design evidence that can actually be obtained

Map each proposed requirement to an observable assertion and exact existing/planned test target. Include the normal
flow, relevant denial/error paths, forbidden effects and affected regressions. Inspect assertions, collection config,
fixtures and mocked boundaries in reused tests, and run the existing focused baseline. Record which planned tests do
not exist yet and how their runner/environment is established. A new test is not evidence that its premise is true.

Apply `shared/task-readiness.md` sections 3-4 to every command and sensitivity method. Distinguish before-write,
after-write, after-build, after-owner-apply and after-commit evidence. Name the actor and prerequisite for deferred
checks; do not require a commit-pair gate to certify a dirty tree or a DB mutation in a read-only task. Select QA and
the smallest sufficient matrix without dropping a mandatory gate.

**Exit:** every requirement has a feasible proof and preservation check, with required infrastructure resolved or
explicitly sequenced. Do not write the active implementation contract while a prerequisite is still a guess.

## C5. Save the current task and matching sidecar

Read `shared/orchestration-state.md`. Disable affected saved routes with `executionStatus: draft` before editing;
stage and readiness are separate. Keep drafts unexecutable through C6, including changes to implemented sidecars.

Build one executable route for a fresh Sonnet session. Add the single Claim ledger of `shared/claim-evidence-contract.md`;
each R cites its C/D evidence and each AC cites its R, adding C/D only for an additional premise. The kickoff includes:

1. objective, verified context expressed only through ledger-backed facts/owner decisions, and exact scope/out-of-scope;
2. current behavior to preserve and required after behavior;
3. atomic requirements, positive flow, applicable negative-flow table, and `ACn [R…] Given/when/then` criteria;
4. selected Q0–Q4 profile, exact commands/evidence, non-Q0 final-build gate, critical-flow coverage where relevant;
5. completion-report contract and a per-rule compliance ledger;
6. the saved path under the selected sprint, never a chat-only task or `tasks/` root file.

Put the current start step and ordered route together. Each step names actor, prerequisite, exact paths, action and
expected evidence. Keep the current R/AC and scope authoritative; link historical review evidence instead of appending
another competing route. When replacing old instructions, preserve open obligations and owner decisions and update
all affected references/contracts. Requirements are atomic: do not hide several independent changes in one R/AC row.

The sidecar's scope includes every executor edit/deletion in the manifest, not Opus-only policy prerequisites.
New work stays planned; reconcile overlapping implemented contracts when an API or invariant changes. Do not
change a case expectation merely because its test fails. Run C6 on the saved version before it becomes executable.

Every created or revised task also includes `## Security test contract`, using the exact fields and applicability
rules in [shared/security-testing.md](../shared/security-testing.md). Name frontend AND server security tests,
specific allow/deny/data-leak assertions, fixtures, boundary integration and sensitivity evidence. Existing mapped
regressions require inspected assertions and a rerun; changed behavior requires its own regression. Resolve missing
test infrastructure explicitly before promising runnable evidence. Only genuine Q0 documentation-only work may
justify runtime N/A under that contract. Do not publish a product kickoff missing either layer's criteria.

Apply `shared/canonical-component-reuse.md` before design: the canonical decision comes before reference research.
For each visible artifact, add a canonical decision record: semantic searches, inspected candidates, direct Story and
source, `reuse`/`extend`/`create canonical`, shared token path, registration, preservation boundary, and component →
composition → route evidence hierarchy. A missing token becomes a named semantic-token creation in the canonical
registry, never a consumer value. A Story only passes public props/data; it never contains style repair.

Use `shared/enforcement-model.md` to add the exact pre-write receipt, the required UI-contract registry row for any
new manifest enrolment, and `npm run check:ui-contract` to the task's verification plan. These are requirements, not
optional evidence suggestions.

For a changed shared visual contract or reproduced parity defect, require the affected GR-12 built-Storybook census
before design completion and review; scope Opus's proof under the reuse rule. Do not make remeasurement of unchanged
canonical chrome a publication requirement. Keep applicable executor proof requirements before its first write.
A kickoff cannot prescribe one consumer's colour, radius, spacing, size, or typography;
it prescribes the owning token/component and the evidence that proves cross-Story parity.

Every kickoff has `## Mobile adaptation record`. Use `Scope: none` only for non-visible work. Inherit the ready
owner's adaptation fields under the reuse rule; do not invent a new pattern for reuse. For visible work use the
exact fields and source basis in `shared/mobile-adaptation-contract.md`: surfaces, component-family and pattern IDs,
W3C/Apple/Android sources, the registry-allowed Mantine mechanism and canonical Mantine owner, the `<640px` mobile
range and actual component thresholds, compact reading/action order, required-content treatment, and direct Story
verification through the `640px` transition across affected locales. Mantine retains implementation/interaction/a11y
authority; the record only supplies semantic outcome and proof. A ready Story supplies the reuse baseline;
a new adaptation decision requires the mobile contract's source basis.

For visible UI, include the responsive width/type, gutter, popup text-action, circular-control, rounded-corner, state,
locale, viewport, and interactive-control requirements selected by `shared/storybook-proof.md` and GR-3b…GR-3j/GR-9.
Require an owner visual-QA matrix; never specify retired `screenshots:assert` as a verdict. For every changed surface
that opens an overlay, name its `scripts/rendered-interaction-states.json` rows and the rendered state census gate as
its rendered proof (`shared/rendered-state-census.md`); a task-local probe is never that proof. Every visible-UI kickoff
names, per changed container and matrix Story, the container's rhythm token with its owner `path:line`, the GR-3h
vertical-rhythm probe and the GR-3i name-wrap probe with their widths: the full canonical matrix plus both sides of
every layout switch, in all four locales. A kickoff never prescribes a gap value of its own; it names the container's
rhythm token.
