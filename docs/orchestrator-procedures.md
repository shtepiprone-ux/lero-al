# Orchestrator Procedures

This file contains the longer procedures that were previously mixed into `docs/agent-contract.md`.
The short contract states the invariants; this file explains how Opus applies them.

## Modes

Classify each request before acting:

- `TASK DESIGN`
- `ORCHESTRATION`
- `IMPLEMENTATION REVIEW`
- `TASK REVIEW`
- `BUG ANALYSIS`
- `QA VALIDATION`
- `RELEASE READINESS`
- `DECISION REVIEW`

State the mode briefly in the output unless the user asked for a tiny direct answer.

## Context acquisition

Before planning, assigning, reviewing, or approving work:

1. Read `CLAUDE.md`, `docs/agent-contract.md`, this file, `docs/rule-index.md`, and `docs/backlog.md`.
2. Select the task-type bundle from `docs/rule-index.md`.
3. Read only the relevant rule files for that bundle.
4. Inspect affected source files, tests, existing patterns, and task history as needed.
5. Inspect the current diff when reviewing implementation work.

Do not rely on filenames, task titles, prior summaries, or a worker's completion report as proof.

## Requirement ledger

For non-trivial task design or review, normalize requirements into a ledger:

| ID | Source | Requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | User/task/docs | Observable requirement | P0/P1/P2/P3 | Test, diff, rendered proof, native check | Confirmed/Assumed/Ambiguous/Conflict |

Every acceptance criterion and every confirmed review finding should map back to one or more requirement IDs.

## Evidence-first preflight (mandatory before task publication or review decision)

Before publishing an implementation kickoff, declaring a task executable, or returning an approval/revision
decision, complete the applicable sections of
[`docs/orchestrator-evidence-preflight-template.md`](orchestrator-evidence-preflight-template.md). This is a
**fail-closed gate**, not optional planning prose.

The preflight must distinguish these evidence layers:

1. **Source semantics:** inspect the exact implementation, enum, conditional branches, and configuration that make
   the claim true. Do not infer an output state, default, selector, or registry behavior from a name, a comment, or
   a prior report.
2. **Command/artifact contract:** for every required command, record its real inputs, output path and schema, matrix
   scope, exit semantics, and every file it writes or can overwrite. A command may prove only properties observable
   in its actual artifact.
3. **Rendered behavior:** keep source rules, computed CSS, geometry, and visual outcome separate. A declaration or
   computed value does not prove rendered geometry; a geometry result does not prove a pixel-level result unless the
   selected QA profile calls for that evidence.
4. **Execution state:** label the plan exactly one of `from-scratch`, `remediation`, or `mixed`. A remediation plan
   must name its start step, reusable artifacts, forbidden re-runs, and every preserved artifact that a command
   could overwrite.
5. **Ownership and sequencing:** reconcile task-owned, unrelated, and ambiguous paths before task publication and
   before a handoff. A path containing unreviewed work from another task is ambiguous, not implicitly available to
   edit or stage.
6. **Requirement feasibility and detector scope:** when a requirement depends on a static checker recognizing source
   syntax—for example, a marker, suppression, allowlist, forbidden value, or a required pass/fail count—read the
   detector and prove how it treats the target syntax before publishing the task. Do not carry forward a historical
   marker count unless each post-change raw value is demonstrably detectable and suppressible. A green gate proves
   only properties within that gate's actual detection scope.

For every material claim, acceptance criterion, and proposed gate, attempt one concrete falsification before relying
on it: inspect a counter-branch, an absent/missing baseline, a different matrix mode, a real enum, a narrow/long
locale UI state, or another relevant failure mode. Record the result as `VERIFIED`, `ASSUMED`, `UNKNOWN`, or
`BLOCKED`.

Do not publish a task as ready for Sonnet when a required command has no valid input at the point it is scheduled,
when a required artifact cannot represent the claimed property, or when a proposed rerun can overwrite the only
baseline. Return `DRAFT — NEEDS EVIDENCE` or stop for an owner decision instead. Do not approve a review while the
same gaps remain.

### Detector-aware requirements and migrations

When a migration changes the syntax through which a policy-sensitive value is expressed, Opus must establish whether
the relevant detector still observes that value. Use a minimal, reversible failing arm and passing arm in the target
syntax when feasible; otherwise record the detector blind spot explicitly.

- Do not require historical markers or suppressions to be copied mechanically into syntax the detector does not
  inspect. A stale-marker failure is evidence that the requirement is unsatisfiable, not an executor deviation.
- If the migration moves a value outside detector coverage, the kickoff must either include detector support in the
  same task or name a separately sequenced corrective task. Until then, describe the coverage decrease accurately;
  never treat a green result as proof that the original site-level protection remains enforced.
- When feasibility evidence contradicts a drafted acceptance criterion, correct the criterion before assigning the
  task and record it as a task-design defect. Do not delegate the contradiction to Sonnet to resolve ad hoc.

### A documented token is not an implemented token — grep the definition, never the table

Before writing any requirement, inventory row, or acceptance criterion that tells the executor to consume
`var(--some-token)`, prove the custom property is *defined*, not merely *tabled*:

```powershell
Select-String -Path src\app\globals.css -Pattern '^\s*--some-token\s*:'
```

Zero matches means the token does not exist, no matter how completely `docs/design-system.md` §22 documents its
value, tier and "Use via" column. **Quote the matched definition line in the task.** The same rule binds any
`@theme` variable, Mantine theme key, or CSS custom property a task directs the executor to consume, and it binds
the reviewer: an `N1-VIOLATION`-style "a token exists at this value" claim is not verified until the definition
has been grepped.

**This is a hard gate, not advice, because every gate the repo owns is blind to the failure.**
`check:design-tokens` exempts anything *shaped* like `var(--token)` without resolving it (its own arm:
`does NOT flag zIndex bound to a var(--token)`); `tsc` and `next build` never read CSS values; a rendered md5
comparator cannot see a stacking-order change in an isolated story. The declaration becomes invalid at
computed-value time and silently falls back to the property's initial value — for a non-inherited property such as
`z-index`, that is `auto`.

Tasks **714 → 716 → 715** carried `--z-sticky` — tabled in §22.3, defined nowhere — through two `APPROVED WITH
NOTES` reviews and into a production build before the third review caught it. Both inventories classified against
the documentation table rather than `globals.css`. See `docs/design-system.md` §22.3's ⚠️ banner and Task **718**.

### Additional rules for baselines, assertions, and revisions

- Name matrices precisely. Never substitute a `fast`, subset, Storybook-only, route-only, or historical result for a
  full-run baseline without proving identical scope.
- Read the code that produces a reported status or verdict. An allowlist entry, configuration name, or expected
  behavior does not create a manifest enum value unless the code assigns one.
- New regression harnesses must fail closed for missing baseline cells, infra failures, absent selectors, and
  unrendered pages. A reason string without a failing result is not an assertion.
- A revision of completed work must begin with an explicit re-entry mode. Preserve prior baseline artifacts by
  default; do not rerun a baseline capture unless a valid pre-change input is available and overwriting is explicitly
  safe.
- Before assigning an executor write path, inspect its current worktree classification and any file-local cap. A
  mixed/unreviewed path or an already-over-limit file is not viable scope: defer it, define an explicit non-growing
  consolidation, or obtain owner sequencing. Scope, out-of-scope, verification, completion-report, and handoff
  instructions must not contradict one another.
- For UI migrations, test the smallest observable question. When the only suspected difference is a runtime style
  value, a same-page synthetic measurement may be valid; prove that all other relevant container rules are
  equivalent first, assert and persist the effective mutation for every cell, retain raw live/synthetic measurements
  before deriving deltas, restore temporary state in `finally`, and document the measurement limits. A zero delta
  does not prove a synthetic mutation ran.
- Distinguish an executed falsification from an analytical counterfactual. Call a branch `fired`, `passed`, or
  `cleared` only when a run or persisted artifact actually exercised it.

## Ambiguity policy

Ask the user only when all are true:

1. The answer materially changes architecture, contract, data model, security model, or user-visible behavior.
2. The answer cannot be derived from repository context or accepted decisions.
3. A reversible documented assumption would be unsafe.

Otherwise choose the safest reversible assumption, label it, and keep the task easy to change.

## Task design protocol

Every implementation task must be executable by a fresh Sonnet session with repository access and no hidden chat context.

A valid task includes:

1. Title with a concrete outcome.
2. Objective.
3. Verified context.
4. Scope and out of scope.
5. Functional requirements.
6. Technical constraints.
7. Positive flow.
8. Negative-flow applicability table.
9. Acceptance criteria linked to requirement IDs.
10. QA profile from `docs/qa-profiles.md`.
11. Verification plan with exact commands when known.
12. Completion report contract:
    - files changed;
    - requirement IDs completed;
    - tests and commands run;
    - actual results;
    - assumptions;
    - deviations;
    - known limitations;
    - unresolved issues;
    - evidence needed for review.

For a UI task, add a canonical UI decision record before publishing the kickoff:

| Visible artifact | Search queries and inspected paths | Canonical story/source | Disposition | Required implementation and registration |
|---|---|---|---|---|

Use `reuse` when the canonical story/component already covers the artifact, `extend` when that source is the right
owner for a missing variant, and `create canonical` only when searches prove no suitable source exists. The record
must cite the exact story title/path when available and the component, pattern, theme token, or legacy semantic
token that supplies each visual value. `create canonical` requires the shared source, a canonical Storybook proof
added or updated in the same task, and applicable catalog/coverage updates. If a needed visual value has no approved
provenance, stop task design for `CANONICAL STYLE DECISION REQUIRED`; do not leave Sonnet to choose a local value.

### Canonical Story source-of-truth check (mandatory for Opus before publishing a UI kickoff)

Opus must inspect the source of the corresponding canonical Mantine Story, not merely cite its title or path. The
kickoff's decision record, scope, requirements, and acceptance criteria must then bind the production change to that
Story:

- **Existing Story:** the same task must update or preserve the exact Story so it renders the migrated artifact with
  the same canonical Mantine primitive and applicable states. Opus must not mark that Story out of scope or authorize
  a route-only proof in its place.
- **No Story:** the kickoff must require creation of a canonical Mantine Story before, or in the same task as, the
  consumer migration, plus `scripts/mantine-migration-scope.json` registration and a passing static-import proof from
  `check:story-coverage`.
- **Slot or demo mismatch:** a Story that supplies a static stand-in, legacy control, or other divergent demo through
  a pattern slot does not cover the real production node. Opus must scope an update that renders the real node or an
  equivalent canonical composition Story. If that would change a deliberate boundary, stop task design and ask the
  owner; do not leave the decision to Sonnet or silently exclude the Story.

A kickoff that omits this decision, declares an existing corresponding Story out of scope, or treats a demo stand-in
as Story proof is a task-design defect and must not be handed to Sonnet.

Do not publish a task that says "read all docs." Use `docs/rule-index.md`.
Save an implementation kickoff under `tasks/` using the location and naming rules in `docs/ai-behavior.md`.

## Review protocol

Review implementation evidence, not the author's explanation.

1. Rebuild the requirement ledger from the task.
2. Inspect the actual changed files and diff.
3. Compare changed files to the session log's "Files Changed" table.
4. Trace each requirement to code and validation evidence.
5. Check failure paths that are applicable to the task.
6. Check regressions in affected components and consumers.
7. Apply the selected QA profile from `docs/qa-profiles.md`.
8. For every non-Q0 task, require a final `npm run build` transcript with exit code 0 for the reviewed diff. A
   failed, unrun, or stale build is missing blocking evidence and cannot receive an approval decision.
9. For UI work, compare the canonical UI decision record with the diff and rendered evidence. Reject copied local
   styles when `reuse` was available; require the shared source, canonical story, and registration when `extend` or
   `create canonical` was selected. A missing record or uncited "no story" claim is missing P1 evidence.
10. Produce exactly one decision.

### Proof-carrying review and adversarial pass (mandatory)

Complete the review sections of `docs/orchestrator-evidence-preflight-template.md` before choosing a decision. The
review record must list every task/rule file, changed source/test file, producing implementation, and validation
artifact actually opened. Reading a worker report, a task title, or a quoted command result does not satisfy any of
those entries.

For every P0/P1 acceptance criterion, record all of the following in the requirement ledger or review evidence:

| AC / conclusion | Observed result | Exact producing source inspected | Exact artifact or command output inspected | Counter-check | Classification |
|---|---|---|---|---|---|
| | | path + symbol/line | manifest/log/screenshot/diff + command where applicable | contradictory branch, alternate input, or failure path | `VERIFIED` / `INFERENCE` / `UNKNOWN` / `BLOCKED` |

- Before saying a function or condition "only", "never", or "always" does something, read its complete relevant
  body and enumerate every return/override branch that can affect the claim. A short line window or a matching
  `rg` hit is not enough.
- Keep source semantics, command/artifact semantics, computed state, geometry, and rendered pixels separate. A
  screenshot does not prove a causal mechanism; a computed style does not prove the geometry it supposedly caused.
- A claim that a regression is a flake or "not caused by this diff" needs a controlled A/B comparison, reproduction,
  or another concrete falsification. A diff that does not touch an obvious assertion is useful evidence, but is not
  sufficient causal proof; report the cell as `UNATTRIBUTED`/`INFERENCE` until the cause is established.
- For every changed cell in a rendered baseline/fail-set comparison, inspect the complete before/after manifest
  entries, the relevant screenshots when available, and the exact assertion and readiness/validity guards that
  produced the verdict. A count or one diagnostic signal alone cannot settle the cell's cause.
- Verify final repository reality as well as task behavior: final diff/status paths, scope, session-log path,
  backlog references, and every proposed follow-up's actual filed or reserved state. A proposed or unfiled task is
  not a correction.

After the evidence pass, perform an adversarial pass: for each material conclusion, identify the most direct source
branch, artifact, or counterexample that could falsify it and inspect it. Record the result. If that pass changes a
conclusion, revise the ledger and decision rather than retaining the earlier narrative.

### Approval-closure gate (mandatory, fail-closed)

Do not choose an approval decision until the reviewer has closed every P0/P1 ledger row against the **final reviewed
diff**. For each row, the review record must carry a scope certificate with all applicable fields:

| Required field | What the reviewer records |
|---|---|
| Final subject | Changed source path/symbol and the exact final diff hunk it proves |
| Required scope | Every named consumer, branch/state, Storybook ID, locale, viewport, matrix mode, and before/final phase |
| Exact evidence | Artifact path plus the command/result/schema actually opened; build or manifest freshness where relevant |
| Observable claim | The specific source, computed, geometric, rendered, or gate property that artifact can prove |
| Counter-check | The most direct contrary branch, artifact, or generated form inspected, with its observed result |
| Verdict | `VERIFIED`, `INFERENCE`, `UNKNOWN`, or `BLOCKED` — never a bare checkmark |

Persist this table as `docs/reviews/YYYY-MM-DD-taskNNN-short-name.review-ledger.json`, using
`docs/review-ledger-template.json`, and run `npm run check:review-ledger -- --file <ledger>`. The validator checks
retained artifact paths, tuple coverage, mandatory counter-checks, generated-rule envelopes, derived coverage
totals, gate receipt consistency, decision consistency, finding-to-requirement links, and the non-approved handoff
ban. CI requires a changed **approved** valid ledger for any reviewable task, source, workflow, or review-governance
change.
`requiredScope.notApplicable` is the only allowed way to declare a dimension not applicable, and it requires a
concrete reason; leaving the dimension out is an evidence gap. Only evidence with `coverageRole: "COVERS"` closes a
tuple. If it leaves any tuple uncovered, enumerate the exact complement in `coverageGaps`, link it to an open
P0/P1/P2 finding, and keep the row non-`VERIFIED`; a `GAP_WITNESS` may prove the absence but never closes it. Copy
`review.coverage` and `review.ledgerGate` only from the final validator run. The gate records ledger integrity, not
an approval result: a complete `NEEDS REVISION` ledger passes locally with its findings and `PROHIBITED` handoff
intact. Each non-`VERIFIED` primary row names its open finding in `findingIds`, and each finding must reciprocally
name the requirement in `requirementIds`. A prose or JSON claim cannot make either a malformed ledger or a failed
implementation pass.

The reviewer must compare the certificate's required scope to the artifact's real scope before using the result.
A capture of one story, locale, viewport, state, or synthetic node does not cover another required one; a visual
matrix does not substitute for a required computed-style/cascade capture; a count does not substitute for the set or
per-cell records the criterion requires. `diffCount: 0` proves only the named fields for the targets actually
captured. Every omitted required target is `UNVERIFIED` and blocks approval.

For generated CSS, selectors, policy-sensitive syntax, or cascade migrations, inspect the exact generated rule for
the input removed or replaced. Compare its full semantic envelope — ancestor/descendant relation, selector
specificity, `@media`/`@supports` wrappers, layer, source-order dependence, declarations, and custom-property
behavior — rather than comparing only computed desktop values or declaration text. Schema v4 records this as
machine-compared before/after values: retain the full 40-character base commit, exactly one candidate, compiler
version, and each raw rule. For Tailwind, `compiler.input` must be a `BASE_REVISION_FILE` at that identical base
commit; the validator fetches the CSS through `git show <base>:<path>` and compiles the named candidate, rather than
trusting a CSS string, a path value, a sibling utility, or the current worktree. It also rejects imported repository
stylesheets that changed since the base and checks imported package styles against the base lockfile. A nearby example, a comment, or a
final bundle that no longer contains the removed rule is not evidence. For `assessment: "EQUIVALENT"`, every changed
envelope field must cite a retained owner decision and the adversarial counter-check must persist an equivalent
negative probe. For a non-approved `assessment: "MISMATCH_RECORDED"`, every unapproved changed field must instead
cite an open P0/P1/P2 finding through `observedSemanticDeltas`; a non-equivalent probe cites that same finding. An
uncited guard, declaration, or custom-property delta is a P0 regression, never a reason to make the ledger invalid.

For retry-based evidence, read the binding decision and the task's acceptance criterion before classifying runs.
Record every execution separately as invalid/contaminated, initial valid result, or authorized re-run with its
reason. Do not infer a retry count from the number of command executions, relabel a contaminated run as an
authorized retry, or replace an `UNATTRIBUTED` result with a causal story that was not measured.

The final review must state the lowest-evidence row, not only the strongest result. If an artifact is stale,
missing, narrower than required, or contradictory, downgrade the decision before writing required-next-actions.
Owner commit/push commands may be emitted only after this locked decision; a non-approved decision must contain no
commit or push handoff.

Allowed decisions:

- `APPROVED`
- `APPROVED WITH NOTES`
- `NEEDS REVISION`
- `BLOCKED`
- `PARTIALLY VERIFIED`

Do not approve from a summary. Do not approve when required evidence is missing.

Decision criteria:

- `APPROVED`: all primary requirements and acceptance criteria are verified; selected QA evidence is complete; no
  unresolved P0/P1/P2 findings remain.
- `APPROVED WITH NOTES`: the approval conditions above are met and only non-blocking P3 findings or notes remain.
- `NEEDS REVISION`: a requirement is incomplete/incorrect, required evidence is missing, or a blocking finding
  remains.
- `PARTIALLY VERIFIED`: actual implementation was inspected, but only part of the required evidence is available.
- `BLOCKED`: required access, context, owner decision, environment, or dependency prevents meaningful review.

These decision rules are fail-closed: an unmet, changed, or unverified P0/P1/P2 acceptance criterion is never
converted into an approval by asserting that its intent was met, by a likely-cause explanation, or by promising a
follow-up. Use `NEEDS REVISION`, `PARTIALLY VERIFIED`, or `BLOCKED` as the evidence warrants. A requirement may be
changed only by an explicit owner decision recorded before the verdict.

### Owner-native validation handoff

When sandbox execution, a missing native binary, or a timeout prevents a task-required check, list the exact command
under `Missing evidence and limitations` and repeat it under `Required next actions`. Use the command verified in the
task or repository; on Windows PowerShell prefer `npm.cmd` / `npx.cmd` for Node commands. Include the expected exit
result, report, screenshot, or output to return. Missing validation is not a "low risk" result and cannot support an
approval decision.

### Windows-native execution gate

For this Windows repository, every evidence-producing `node`, `npm`, `npx`, Playwright, Next, Tailwind, Vite,
Storybook, or native-addon command must run in native Windows PowerShell, not WSL, a Linux VM, or a mounted Linux
view. At the start of the command session, record `node.exe -p process.platform`; it must return `win32`. Retained
transcripts also record the Node version, working directory, exact command, and actual exit code.

An output from a different platform — including a native-binary load failure — is an environment screen only. It
cannot establish a repository finding, gate failure, clean state, or follow-up task. Re-run the exact command in
native Windows PowerShell; if that cannot happen, classify the result as `MISSING EVIDENCE` and issue the
owner-native handoff. Only Windows-native or CI output can support the task or review verdict.

## Finding format

Confirmed findings must be specific and actionable:

- Severity: `P0 BLOCKER`, `P1 HIGH`, `P2 MEDIUM`, `P3 LOW`, or `NOTE`.
- Requirement IDs.
- Location.
- Observed behavior.
- Expected behavior.
- Evidence.
- Impact.
- Required correction.
- Verification method.

Label uncertain issues as `NEEDS VERIFICATION`; do not report them as confirmed defects.

## Git policy

Read-only git is allowed for inspection:

- `git status`
- `git diff`
- `git show`
- `git log`
- `git grep`
- commands using `--no-optional-locks` for read-only inspection

Mutating git is owner-only and native PowerShell only, including:

- `git add`
- `git commit`
- `git push`
- `git reset`
- `git restore`
- `git checkout`
- `git stash`
- `git merge`
- `git rebase`
- `git rm`
- `git apply`
- `git clean`
- `git config`

After verified task design that changed task/docs artifacts, or an `APPROVED` / `APPROVED WITH NOTES` review, the
orchestrator may emit explicit-path commit commands for the owner to run, but must not run them. Only after the
`APPROVED` / `APPROVED WITH NOTES` review may Opus append `git push <verified-remote> <verified-branch>` for the
owner. Inspect the current branch and remote/upstream read-only first and replace both placeholders with verified
values; never emit a bare `git push`. A task-design handoff and each non-approved review must omit a push command.
Never emit `git add -A`, `git add -u`, or wildcard staging.

Immediately before the handoff, inspect `git status --short` and the corresponding real diff. Reconcile each status
path with task scope and the session `Files Changed` table. The command lists every reconciled artifact once, including
required `docs/backlog.md` and `docs/sessions/...` updates. Classify every remaining status path as `EXCLUDED AS
UNRELATED` or `AMBIGUOUS`. Explicitly excluded parallel work is not a blocker and must not be staged. Report
`STATUS/REPORT MISMATCH` and withhold the handoff only when a path that should belong to the current task is missing,
undocumented, or ambiguous; never omit a reconciled task artifact or stage a broad set.

Before this reconciliation, inspect `.git/index.lock`. Stale lock cleanup is the sole authorized agent-side `.git`
mutation: first check that no Git process is active; then delete only the exact project-local `.git/index.lock`,
confirm it is absent, and re-run `git status --short`. If a Git process is active or the lock remains, return
`GIT WRITE BLOCKED` and emit no handoff. Never delete another `.git` file or run recovery commands.

If the sandbox view shows corruption, stale files, impossible dirty state, NUL bytes, or truncation, treat it as a
screen only. Ask for owner-native verification or use available CI evidence before issuing a verdict.

## Self-critique before final output

Before returning a task or review:

1. Did I inspect evidence or repeat claims?
2. Did I preserve every explicit user requirement?
3. Did I invent project facts?
4. Did I separate assumptions from decisions?
5. Did I verify applicable failure paths?
6. Are findings specific and actionable?
7. Does the decision match the evidence?
8. Did each marker, suppression, or gate-based requirement remain satisfiable and enforced in the target syntax?

If any answer exposes a gap, revise before returning.

## Recurring orchestrator failure modes

> Moved verbatim out of `docs/backlog.md` on **2026-08-27** by the row-by-row audit. This is durable procedure,
> not active state. **Read it before writing any kickoff.**

**Recurring orchestrator failure mode — read before writing any kickoff (M1 · M2 · M4 · M5).** Four blocked/revised tasks failed identically: the *fix* was right, the *control* could not detect its own effect. **Every kickoff needs a two-armed plant that can demonstrably fail, plus a pre-plant census proving no further lifeline.** Reconcile git state from `git log`/`git status`, never a session log's self-description. **Corollary (709):** a kickoff's own "measured" facts are not exempt. **Corollary (710–714, 2026-08-06):** four consecutive kickoffs shipped a factual defect the executor had to correct — a stale line reference, a `grep` that counted `.split(` as a test, a crude literal census, and a requirement that was *unsatisfiable* because the detector could not see the target syntax. **Measure with the real tool, not an ad-hoc grep**; see `orchestrator-procedures.md` → "Detector-aware requirements and migrations" (`6c3a2054e`). **Corollary (724, 2026-08-07) — two defects, one kickoff.** ① *Never fence an artifact off as zero-diff and simultaneously require the aggregate gate that measures it to go green.* State the scoped condition — "no failure outside X" — and assign the exit code to the task that owns X. ② *A gate's own exclusion selector is an attack surface.* When a kickoff re-expresses an exclusion as a DOM property (711's `[role="group"]`), the next task can satisfy the gate by **producing** that property. Say so in the kickoff, and require every exemption to be a condition the gate evaluates — never one an author applies. **Corollary (726, 2026-08-08) — story markup that exists only to exercise a selector, gate or measurement is a probe, not a permanent artifact.** A missing API-specific story is not authorization to add one; a permanent addition needs a named in-scope production consumer or quoted owner authorization. Blocking in both `create-task/SKILL.md` and `execute-task/SKILL.md`: it stopped 726 draft 2, and 726 then proved the probe/revert path end-to-end. **Corollary (661, recorded 2026-08-08) — a verdict that is not written down did not happen.** 661 was `APPROVED WITH NOTES` and committed on 2026-07-23; the same session then pivoted straight into writing 662's kickoff, 662's outcome got recorded and 661's did not, and the backlog still read `AWAITING ORCHESTRATOR REVIEW` sixteen days later — long enough that the orchestrator proposed re-reviewing already-approved, already-committed work. This is the **second** occurrence of the identical failure (703/704/705, 2026-08-01). **Write the verdict, the archive row and every spawned follow-up before starting the next artifact, not after.** Follow-ups a review names but does not file are lost the same way: 661's ΔE sync-check went unfiled for sixteen days. **Corollary (721, 2026-08-08) — the kickoff's own measured facts are still not exempt, now a fifth time.** 721's kickoff stated band-700's applicable set as "4 locales × 1 viewport = 4 cells"; `MANTINE_STORY_EXTRA_VIEWPORTS` keys by **component**, and `HeroSearch` has two stories, so it is 8. The executor measured it correctly and the orchestrator did not. When a kickoff derives a count from a config, **read what the config keys on**, not what it appears to key on. **Corollary (717 · 721 · 722) — three consecutive executors misreported `docs/backlog.md`'s line count** by measuring it after their own edit and calling the result pre-existing. Take the baseline from `git show HEAD:docs/backlog.md | wc -l` before writing. **Corollary (694, 2026-08-10) — the kickoff-fact defect is now a sixth occurrence, and this one was the orchestrator's own, written the same day it was executed.** §13.2's plant matrix listed P1's failing set as "B, C, E"; assertion C compares `--accent` to `brand[0]` and P1 edits `brand[7]`, so C structurally cannot fire. The executor measured B+E, said so, and did **not** widen C to react to an unrelated token — the correct disposition, and the reason a plant matrix must state *which assertion consumes which input*, not merely which assertions exist. **Freshness is not accuracy: a fact measured an hour ago is exempt from nothing.** The same task read its backlog baseline from `HEAD` correctly — a third consecutive clean read after 717/721/722. **Corollary (702, 2026-08-10) — seventh occurrence, and the tell is now specific enough to act on: all three of 702's defects were *derived* claims, not measurements.** §3's numbers survived re-derivation; what failed was the reasoning laid over them — "688 already reproduces this composition" (it flattens instead), "no markers needed" (true of the `.tsx`, false of the module it creates), and a command list whose flag silently skips the phase its own AC depends on. **Inspecting a value is not inspecting the claim built on it: open the cited file and the cited flag's code path, not just the number.** §15's quality-gate row asserting nothing went uninspected was itself the defect. **Corollary (702, same day) — the unwritten-verdict failure is now a THIRD occurrence** after 661 and 703/704/705, and this time the gap was hours, not weeks: 702 was approved and committed while `docs/backlog.md` still read `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, so the next session handed it to an executor as live work. It was refused on artifact evidence, which is the only reason this cost a round trip instead of a duplicate implementation. **Sixteen days and four hours produce the same defect — approve, archive and update the backlog as one indivisible step.** **Corollary (2026-08-10, same day, FOURTH occurrence) — "the backlog" is not one file, and updating it is not one edit.** 702's verdict was recorded in `docs/backlog.md` and its sprint plan's **Tasks table was left at `KICKOFF FILED`**, so an executor was again offered approved-and-committed work — this time it surfaced the row as a menu option instead of acting on it, which is the only reason it cost nothing. **Root cause: `Sprint_NN_*.md` carried task state in two tables and only one was maintained.** Fixed structurally rather than by another reminder — the Tasks table is now the single state source, the execution-order table is order-and-gating only, and both say so in-file. **When closing a task, enumerate every artifact that names its state — backlog registry, backlog Last Session, sprint Tasks table, sprint order table, archive — and change them in the same edit.** **Corollary (700, 2026-08-10) — a gate's scoping rule is also its blind spot, and the kickoff must say which half it does not cover.** 700's R3 scopes the gate by ownership computed live from `globals.css`, which is what makes it precise (the unscoped form reports 112 Mantine false positives) and simultaneously what makes it blind: deleting a token there un-owns it **together with its orphaned consumers**, so the gate goes silent on `0 violations, exit 0` — filed as **743**. **When a requirement narrows a detector to make it usable, state the class the narrowing excludes, in the kickoff, before the executor builds it.** Also 700: the same rule silently made two of the kickoff's own plants self-immunizing, and the executor caught it — **write plants against the observable defect, not against the mechanism you assume produces it.** And its re-scope is the counterexample worth keeping: the reserved premise was measured false *before* the kickoff was written, which is the only reason a gate that could never fail did not ship.

## Git state — durable lessons

> Moved verbatim out of `docs/backlog.md`'s Git row on **2026-08-27**. The backlog recorded a `HEAD` SHA, a branch
> name and a divergence snapshot as if they were evergreen state; they were false within one commit. **Volatile Git
> facts are never recorded in a document — they are read live** with `git --no-optional-locks status`,
> `git --no-optional-locks rev-list` and `git --no-optional-locks log`.

⚠️ **Never record divergence counts or tree cleanliness in any document** — stale within one commit. Read from `git status` / `git rev-list`. **After every push, confirm it actually published** — do not infer it from the command not erroring in your scrollback. If a future fetch shows any remote-only commit, `--force-with-lease` is no longer safe; stop and re-measure. Bridge sessions must use `git --no-optional-locks …`; a plain `git status` there leaves an `index.lock` the sandbox cannot unlink, which then blocks the owner's next `git add`

**The durable lesson is the failure mode, not the fix:** a plain `git push` had been rejected on every attempt and nothing surfaced it, so approved work sat unpublished while the backlog asserted `origin` contained it.
