# Task 821 — `ListingFeatureIcon` and `FavoriteButton`: the last two tier-3 allowlist entries get their own Stories

Sprint 75 · P1 · QA profile **Q3**

**Status: ✅ `APPROVED WITH NOTES` 2026-09-16 — see §16. R5/AC6 amended by the owner decision of 2026-09-16 quoted there.** Originally `READY FOR SONNET`, sequenced after Task 820's commit. Split out of Task 813 by owner decision §5.1 (B1),
2026-09-11, quoted verbatim in §2 — so that Task 820's critical path is not held by two components unrelated to its
blocking tier-2 hop.

## 1. Mode and task type

`IMPLEMENTATION` — design-system governance. Give the two remaining tier-3 allowlisted components their own canonical
Mantine Stories and manifest enrolment, and move their allowlist ownership from Task 813 to this task. No product
behaviour change.

## 2. Objective

Owner decision §5.1 on Task 813 (2026-09-11, quoted verbatim in
`tasks/Sprints/Sprint_75_kickoff_prompt_Task_813_AppImage_Tier2_Root_Cause.md` §5.1 and in the sprint file):

> Task 813 is scoped to `AppImage` and its proven co-located siblings only. File `ListingFeatureIcon` and
> `FavoriteButton` as the next numbered task, transfer their allowlist ownership from `813` to that task in the same
> state update, and keep them governed by their explicit entries. Task 820 may resume immediately after the AppImage
> half is approved; it does not wait for the two unrelated components.

And the owner amendment that sequences the field-level transfer (2026-09-11, quoted verbatim; also recorded in
`tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md` and in
`tasks/Sprints/Sprint_75_kickoff_prompt_Task_813_AppImage_Tier2_Root_Cause.md` §5.1):

> **Owner amendment, 2026-09-11.** Ownership of `ListingFeatureIcon` and `FavoriteButton` transfers to Task 821 in
> the sprint/backlog/task-design state now. Their `owner` fields in `scripts/rendered-scope-allowlist.json` remain
> `"813"` as a documented transitional snapshot until Task 820's final approved commit preserves AC6. Task 821 must
> make the field-level `813 → 821` transfer as its first tracked-file change after verifying that commit, then
> retain its own before/after hash and gate evidence. No further implementation work for those two components
> remains authorized under Task 813.

**What this binds.** Ownership is already this task's in every state artifact; only the JSON field lags, deliberately.
The field edit is this task's **first tracked-file write** — not its first action: R1's census and R2's projection are
read-only and still precede it, because measuring after a tracked file changes destroys the "before" number. R5 and
AC6/AC6a below carry the verification, the ordering and the hash witness the amendment requires.

## 3. Verified context — measured 2026-09-11, re-measure at execution

### 3.1 What the two entries are

`FACT` — `scripts/rendered-scope-allowlist.json`, read this session in Task 820's post-change working tree, holds
exactly two entries, and these are they:

```json
{ "path": "src/modules/listings/components/ListingFeatureIcon.tsx",
  "reason": "Shared feature-icon renderer used by ListingCard and ListingDetailView; filed by Task 809 as a tier-3 node owned separately.",
  "owner": "813" }
{ "path": "src/modules/listings/components/FavoriteButton.tsx",
  "reason": "Shared favorite-toggle control used by ListingCard and ListingDetailView; filed by Task 809 as a tier-3 node owned separately.",
  "owner": "813" }
```

`FACT` — `npm run check:rendered-scope` on Task 820's final tree reports `Allowlisted edges (tier3, owner-filed): 4`
(`docs/sessions/evidence/task820/Rev2_rendered-scope.txt`): two entries × two consuming surfaces each, matching the
`reason` strings above.

`FACT` — `docs/agent-contract.md` 16d tier 3 (`:213-216`): a shared component rendered by an in-scope surface but
owned elsewhere is "**not this task's to migrate**, and equally **not permitted to go unlisted**"; one that lacks a
Story of its own is filed as a numbered task. Task 809's census did exactly that, and this is the resulting task.

### 3.2 What Task 809's census recorded about them

`FACT`, quoted from `docs/backlog.md`'s Task 813 row (filed 2026-09-10 by Task 809's clause-16d census):

> `ListingFeatureIcon` (27 ln, 1 `className`, zero) and `FavoriteButton` (184 ln, 0 `className`, appears only inside
> `ListingCardPattern.stories.tsx` as a composition — not its own). None is in the manifest.

`FavoriteButton`'s situation is exactly GR-3's case: a composition Story is not a component Story. `check:story-coverage`
would report it unproven the moment it is enrolled, the same way 27 of Task 820's patterns did.

### 3.3 What is NOT established

`UNKNOWN` — every figure in §3.2. Those line counts, `className` counts and Story-import results are a dated
measurement by another task, re-quoted here and **not** re-verified for this kickoff. R1 re-derives all of them.

`UNKNOWN` — whether either component renders further unenrolled children of its own. A tier-3 node is still a surface
once enrolled, so enrolling it makes `check:rendered-scope` walk it as a root and its own rendered local imports
become frontier edges that do not exist today — the same mechanism Task 820 §3.2 measured for the 28 patterns. R2
measures that **before** anything is enrolled.

`UNKNOWN` — whether either component imports `@/components/ui/*`. If one does, `--update-baseline` refuses the new
tier-2 edge and this task stops for an owner decision (§5's `CONFLICT`), exactly as Task 820 did.

## 4. Requirement ledger

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.3 | Re-derive at execution, for both components: line count, `className` count, whether it imports `@/components/ui/*`, whether it is in `scripts/mantine-migration-scope.json`, and whether a canonical Mantine Story imports **its own path** (not a parent's). Reconcile against §3.2 and explain every difference. §3.2's figures are a dated measurement to reconcile against, never to copy. | **P0** | AC1 | Confirmed |
| **R2** | §3.3, Task 820 §3.2 precedent | **Measure the expanded frontier before modifying it.** With both paths enrolled in a scratch projection that does not write the tracked manifest, record how many new frontier edges appear, their tiers, and the `tier2-legacy-primitive` count explicitly. Report it before changing any tracked file. If that count is not zero, stop per §5. | **P0** | AC2 | Confirmed |
| **R3** | 16d tier 3, GR-3 | Each component gets a canonical Mantine Story that **statically imports its own path** and renders the real production component — not a parent, not a stand-in. `ListingCardPattern.stories.tsx` consuming `FavoriteButton` inside a composition is explicitly not proof for it. Each `meta.title` satisfies `isCanonicalMantineTitle`. Import the component by its direct file path, never through a barrel — `check-story-coverage.mjs` does not unwrap barrels (Task 820 §2). | **P0** | AC3, AC4 | Confirmed |
| **R4** | Decision §5.1 | Both paths are added to `scripts/mantine-migration-scope.json`. Report the before/after counts and the two added paths; no other entry changes. | **P0** | AC5 | Confirmed |
| **R5** | Decision §5.1 + owner amendment 2026-09-11 | Both `scripts/rendered-scope-allowlist.json` entries change `owner` from `"813"` to `"821"` and **nothing else** — path and reason byte-identical. The entries stay in place: the decision says "keep them governed by their explicit entries". Removing them is not in scope and is not what enrolment implies here. **Ordering, required by the amendment:** verify Task 820's final approved commit for that file first, then make this edit as the **first tracked-file change of this task**, before the Stories, the manifest and the baselines. Read-only measurement (R1, R2) precedes it; no other tracked file is written before it. | **P0** | AC6, AC6a | Confirmed |
| **R6** | Task 820 §3.2 precedent | Both blocking baselines are brought to a true state in the same change, each through its own `--update-baseline`, never by hand. Neither writer's tier-2 refusal is bypassed. Report both before/after entry counts and list every entry added and removed. | **P0** | AC7 | Confirmed |
| **R7** | 812 R9 precedent | `scripts/check-rendered-scope.mjs`, `scripts/check-surface-census.mjs`, `scripts/check-surface-census-changed.mjs`, `scripts/map-changed-surfaces.mjs`, `scripts/audit-design-system-patterns.mjs`, `scripts/check-pattern-enrolment.mjs` and `scripts/check-media-enrolment.mjs` (Task 813) are **not modified**. Every existing gate and self-test passes with its counts explained by this task's changes and nothing else. | **P0** | AC8 | Confirmed |
| **R8** | §3.1 | Neither component's source is edited. If enrolling one would require changing it, that is the `CONFLICT` in §5, not a small fix. | **P0** | AC9 | Confirmed |
| **R9** | GR-5 | `docs/backlog.md`'s Task 813 row stops naming these two components, and `docs/design-system-pattern-ownership.md` records that the allowlist's two remaining entries are now owned by Task 821 with their own Stories, and that the `owner: "813"` values were a documented transitional snapshot under the 2026-09-11 owner amendment, closed by this task's AC6. | P1 | AC10 | Confirmed |

## 5. Assumptions and open questions

- **Sequencing, and it is not optional — the owner amendment of 2026-09-11 makes it a requirement, not a caution.**
  `scripts/rendered-scope-allowlist.json` carries Task 820's `13 → 2` edit, whose `git hash-object`
  `bf09fd2f63b542faa14a63bfb44253203422b026` is Task 820's own AC6 evidence
  (`docs/sessions/evidence/task820/Rev2_hash-object_primary-files.txt`). **Do not write to that file until Task
  820's final approved commit for it exists, and do not read the working tree in its place** — the amendment says
  the commit must preserve AC6, and only the committed blob proves that. Verify both the commit and the blob's hash
  in §13.1, record them in the baseline transcript, and return `BLOCKED — OWNER DECISION REQUIRED` naming what you
  found if the file is still uncommitted or the committed blob does not hash to `bf09fd2f…`.
- **`ASSUMPTION` (reversible, stated)** — the two allowlist entries survive enrolment rather than being deleted,
  because the decision says "keep them governed by their explicit entries". `INFERENCE` from
  `check-rendered-scope.mjs`: an allowlist entry whose path produces no frontier edge becomes **stale** and fails.
  R2's projection must therefore report what happens to these two entries once both paths are enrolled. **If the
  projection shows either entry going stale, stop and report it** — the decision's "keep them" and the gate's stale
  rule would then be in direct conflict, and that is an owner decision, not an executor's reconciliation.
- **`CONFLICT` to surface, not to resolve alone.** If R2 shows any new `tier2-legacy-primitive` edge — either
  component importing `@/components/ui/*` — `--update-baseline` refuses it and the blocking gate stays red. Stop for
  `BLOCKED — OWNER DECISION REQUIRED`, name the component and the primitive, and do not work around it.
- **Out of scope:** `AppImage` and everything in Task 813 · migrating, restyling or changing the behaviour of either
  component · editing any gate's logic · Task 820's own baseline reconciliation.

## 6. Pre-read rule bundle

`docs/golden-rules.md` in full, GR-1 · GR-3 · the `Enforcement status` table · `docs/agent-contract.md` clauses
**9, 13, 16c, 16d** — 16d's tier-3 paragraph (`:213-216`) in full · `docs/qa-profiles.md` (Q3) ·
`docs/orchestrator-ui-task-design.md` · `src/modules/listings/components/ListingFeatureIcon.tsx` and
`src/modules/listings/components/FavoriteButton.tsx` in full · `src/stories/patterns/mantine/ListingCardPattern.stories.tsx`
— the composition that is **not** proof for `FavoriteButton` · one existing component Story as the shape to follow,
e.g. `src/stories/mantine/primitives/CountButton.stories.tsx` · `scripts/check-story-coverage.mjs` — the admission
test, and its lack of barrel unwrapping · `scripts/check-rendered-scope.mjs` — the root walk, the allowlist stale
rule, the baseline writer and the tier-2 refusal · `scripts/mantine-migration-scope.json` ·
`scripts/rendered-scope-allowlist.json` ·
`tasks/Sprints/Sprint_75_kickoff_prompt_Task_813_AppImage_Tier2_Root_Cause.md` §5.1 · this kickoff.

## 7. Scope

- **New:** one canonical Mantine Story per component, placed beside its siblings — say which directory and title you
  chose and why.
- **Edited:** `scripts/mantine-migration-scope.json` (+2) · `scripts/rendered-scope-allowlist.json` (`owner` field
  only, two entries) · `scripts/rendered-scope-baseline.json` and `scripts/surface-census-baseline.json` (each via
  its own `--update-baseline`) · `docs/backlog.md` · `docs/design-system-pattern-ownership.md`.
- **Written:** `docs/sessions/evidence/task821/*` · `docs/sessions/<date>-task821-*.md` · the concise
  `docs/backlog.md` state line.

## 8. Out of scope

Everything in §5. In particular: **neither component's source is edited**, and no gate script is modified.

## 9. Current and required behavior

**Before.** Two shared components render on `/listings`, `/listings/[slug]` and `/favorites` with no manifest entry
and no canonical Story of their own, visible to the gates only as two tier-3 allowlist entries owned by a task that
no longer covers them.

**After.** Both are enrolled, both have a canonical Story that imports their own path, both allowlist entries name
Task 821 as owner, and both blocking baselines are true.

## 10. Implementation requirements

1. **Order is load-bearing, and the amendment fixes its first write.** Verify Task 820's committed blob (§5) →
   R1's census → R2's read-only projection → **allowlist `owner` field — the first tracked-file change** → Stories →
   manifest +2 → both baselines → docs. R1 and R2 are read-only and precede the write deliberately: measuring after
   a tracked file changes destroys the "before" number. Enrolling before a Story exists makes `check:story-coverage`
   red, which is why the manifest follows the Stories.
2. **Never hand-edit a baseline.** Both are written by their own `--update-baseline`, which is also what keeps the
   tier-2 refusals intact.
3. **Direct file imports in the Stories**, never the barrel — `check-story-coverage.mjs` resolves the specifier
   without unwrapping a single-hop `index.ts` re-export, which cost Task 820 a whole revision to discover.
4. **Read and write through Node for every plant-and-restore probe**, never PowerShell `Get-Content -Raw` without
   `-Encoding utf8`.
5. **Transcripts record platform, Node version, working directory, exact command and actual exit code in the same
   file**, and the final gate block records the `git hash-object` of every changed file.
6. **Transcripts BOM-free** — `[IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding $false))` or
   PowerShell 7's `-Encoding utf8NoBOM`.

## 11. Positive and negative flows

**Positive.** A reviewer runs GR-1's per-surface census on `/listings` and both components now report
`manifest:yes` with a Story of their own, instead of appearing only as allowlist entries.

| Negative flow | Applicable | Expected behavior |
|---|---:|---|
| A Story imports the component through the patterns barrel | Yes | `check:story-coverage` reports it enrolled-but-unproven — R3, and the Task 820 precedent |
| A composition Story is offered as proof for `FavoriteButton` | Yes | Rejected by GR-3 and 16d; the component needs its own Story |
| An enrolled component renders a further unenrolled component | Yes | new tier-1 frontier edge → recorded by `--update-baseline` — R6 |
| Either component imports `@/components/ui/*` | Yes | `--update-baseline` **refuses** it → `BLOCKED — OWNER DECISION REQUIRED`, §5's `CONFLICT` |
| An allowlist entry goes stale once its path is enrolled | Yes | Stop and report — §5's second bullet; the decision's "keep them" and the gate's stale rule would conflict |
| Task 820's allowlist edit is still uncommitted | Yes | Do not start; §5's first bullet and its exact check |
| Authorization / RLS / network / concurrent writer | **No** | two Stories, one manifest edit, one field edit, two baselines and two docs |

## 12. Acceptance criteria

- **AC1 [R1]** — Given the census re-derived at execution, then both components' line count, `className` count,
  `@/components/ui/*` import status, manifest status and own-Story status are stated and reconciled against §3.2,
  with every difference explained. Quote the totals and the commands that produced them.
- **AC2 [R2]** — Given the read-only projection with both paths enrolled, then the new frontier edge count, their
  tiers, the explicit `tier2-legacy-primitive` count, and the resulting state of both allowlist entries are reported
  **before** any tracked file changed. Quote the measurement and the command. If the tier-2 count is not zero, or
  either allowlist entry goes stale, stop per §5.
- **AC3 [R3]** — Given each new Story, then its `meta.title` satisfies `isCanonicalMantineTitle` and it statically
  imports the component's own path by direct file path. Quote both titles and both import lines.
- **AC4 [R3]** — Given each new Story, then it renders the real production component and covers its applicable
  states — for `FavoriteButton` at minimum saved and unsaved, enabled and disabled. Name the states and how each is
  expressed.
- **AC5 [R4]** — Given `scripts/mantine-migration-scope.json` after the change, then it holds exactly two more
  entries than before, they are these two paths, and no other entry changed. Quote the before/after counts.
- **AC6 [R5]** — Given `scripts/rendered-scope-allowlist.json` after the change, then it holds the same two entries
  with `owner: "821"`, and `path` and `reason` are byte-identical to their pre-task content. Quote the file and its
  `git diff` — the diff must show two changed lines and nothing else.
- **AC6a [R5]** — `OWNER AMENDMENT EVIDENCE`. Given the amendment's ordering, then one transcript carries, in this
  order: Task 820's verified commit for that path and that committed blob's `git hash-object`
  (`bf09fd2f63b542faa14a63bfb44253203422b026`); the working-tree `git hash-object` **before** this task's edit; the
  `git hash-object` **after** it; and `npm run check:rendered-scope` exiting 0 on the tree immediately after the
  edit, proving both entries are still matched and neither went stale. Quote the transcript. The edit must also be
  the first row of the session log's `Files Changed` ordering, with no other tracked path written before it.
- **AC7 [R6]** — Given both baselines after their own `--update-baseline`, then `check:rendered-scope` and
  `check:surface-census:changed` both exit **0** with 0 new and 0 stale, and every entry added and removed is listed
  with its before/after count. Quote both scope blocks.
- **AC8 [R7]** — Given the final tree, then `git diff --stat` is **empty** for the seven scripts named in R7, and
  `check:rendered-scope:verify`, `check:surface-census:changed:verify`, `check:pattern-enrolment:verify`,
  `check:media-enrolment:verify` and `check:stories` all pass. Quote the empty diff and each result.
- **AC9 [R8]** — Given the final tree, then `git diff --stat` is **empty** for both components' source files. Quote it.
- **AC10 [R9]** — `OWNER VISUAL QA REQUIRED`. Given the two new Stories, then the owner reviews and records
  accepted or returned for each tuple: `ListingFeatureIcon/Default` at `390` and `1440` in `en`;
  `FavoriteButton/Default` saved and unsaved at `390` and `1440` in `en`. Name the six tuples; no automated
  screenshot verdict substitutes for this review.

**GR-4 AC AUDIT — 11 criteria; each states an observable property; absolutes: AC8's and AC9's "empty diff" are scoped
to named files this task deliberately does not change, and AC5's "+2" is this task's defined outcome.**

## 13. QA profile and verification plan

**`Q3 Full Visual Matrix`** — `docs/qa-profiles.md` selects Q3 for Storybook-governance work and for new canonical
Story coverage. Two new visible Storybook artifacts are created and two blocking baselines move; no production
component changes, so the rendered proof is AC10's six owner tuples rather than a route matrix. Not Q4: no gate is
claimed, no critical flow in `docs/critical-flow-registry.md` is touched, and no route behaviour changes.

### 13.1 Baseline — capture before any edit

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$evidence = "docs\sessions\evidence\task821"
New-Item -ItemType Directory -Force -Path $evidence
node.exe -p process.platform
node.exe --version
Get-Location
git --no-optional-locks status --short
git --no-optional-locks log -1 --oneline -- scripts/rendered-scope-allowlist.json
git --no-optional-locks log -1 --format=%H -- scripts/rendered-scope-allowlist.json
git --no-optional-locks hash-object scripts/rendered-scope-allowlist.json
npm.cmd run check:rendered-scope
npm.cmd run check:story-coverage
npm.cmd run check:surface-census -- --surface src/modules/listings/components/ListingFeatureIcon.tsx
npm.cmd run check:surface-census -- --surface src/modules/listings/components/FavoriteButton.tsx
```

Expected: `win32`; the Node version; the project root; the worktree state; **a commit touching the allowlist that is
Task 820's**, its full SHA, and the hash `bf09fd2f63b542faa14a63bfb44253203422b026` — if the file is still
uncommitted or the hash differs, stop per §5's first bullet; the rendered-scope gate at exit 0; the
coverage gate at exit 0; and each per-surface census with its current manifest/Story facts. **Return all of it, then
do R2's projection and return that too, before changing any tracked file.**

### 13.2 Gates on the final tree

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
Get-Location
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:story-coverage
npm.cmd run check:stories
npm.cmd run check:rendered-scope
npm.cmd run check:rendered-scope:verify
npm.cmd run check:surface-census:changed
npm.cmd run check:surface-census:changed:verify
npm.cmd run check:pattern-enrolment:verify
npm.cmd run check:media-enrolment:verify
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
```

Expected: typecheck 0 · lint 0 · `check:story-coverage` exit 0 with both components counted as covered ·
`check:stories` 0 violations · `check:rendered-scope` exit 0 with 0 new / 0 stale · every self-test passing every
arm · `build` **exit 0**, mandatory under `agent-contract` clause 9 · both hygiene gates clean. **Record every exit
code inside its own transcript and the `git hash-object` of every changed file in this block.**

### 13.3 Owner visual review

AC10's six tuples, opened in Storybook by the owner. `screenshots:assert` and every alias are retired (owner decision
2026-09-03) and must not be run or cited.

### 13.4 Owner-native rule

Native Windows PowerShell throughout. A result from WSL, a Linux VM or a mounted Linux view is an environment screen,
not evidence; record it as `MISSING EVIDENCE` with the exact native command.

## 14. Completion report contract

Files changed · requirement IDs completed · §13.1's baseline including the allowlist commit check · **R2's
pre-change frontier projection with its tier breakdown, the explicit tier-2 count, and both allowlist entries'
projected state** · AC1's reconciled census · AC3's two titles and import lines · AC4's states · AC5's before/after
counts · AC6's two-line diff · AC6a's single ordering-and-hash witness · AC7's two scope blocks with every baseline delta listed · AC8's and AC9's empty diffs ·
AC10's six `OWNER VISUAL QA REQUIRED` tuples · every command with its real exit code and transcript path · the
`git hash-object` of every changed file · assumptions · deviations · limitations · unresolved issues.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED — OWNER DECISION REQUIRED`
if §5's `CONFLICT` or its allowlist-stale case fires. Do not self-approve; Sonnet runs, emits and suggests no
mutating git command.

## 15. Task quality gate

| Question | Required answer |
|---|---|
| Why is this not part of Task 813? | Owner decision §5.1 (B1), quoted in §2: these two components are unrelated to the tier-2 hop blocking Task 820, and holding 820 for them lengthens its critical path for nothing. |
| Are the §3.2 figures safe to copy? | **No** — they are another task's dated measurement, re-quoted and explicitly `UNKNOWN`. R1/AC1 re-derives all of them. |
| Is a composition Story acceptable for `FavoriteButton`? | **No** — GR-3 and 16d tier 3. `ListingCardPattern.stories.tsx` rendering it proves nothing about it. |
| What could stop this task? | Either component importing `@/components/ui/*` — `--update-baseline` refuses the new tier-2 edge. Unmeasured today; R2 makes it the first thing checked. |
| Do the allowlist entries stay or go? | **Stay**, with `owner: "821"` — the decision's own words. If R2's projection shows an entry going stale once enrolled, stop: that is a conflict between the decision and the gate, and it is the owner's to resolve. |
| Can this task start immediately? | **No** — not until Task 820's final approved commit for `scripts/rendered-scope-allowlist.json` exists and that committed blob still hashes to `bf09fd2f…`. §5's first bullet gives both checks; a working-tree read does not satisfy them. |
| What is this task's first tracked-file write? | **The `owner` `813` → `821` field edit** — owner amendment 2026-09-11, evidenced by AC6a. R1's census and R2's projection are read-only and precede it. |
| Why does the JSON still say `813` today? | It is a **documented transitional snapshot**, recorded in this kickoff, in Task 813 §5.1, in the sprint file and in `docs/backlog.md`. Ownership already sits with 821 in every state artifact; the field lags on purpose so Task 820's AC6 hash survives to its commit. |

## 16. Review closure — 2026-09-16

**Decision: `APPROVED WITH NOTES`** (Opus implementation review, after one `PARTIALLY VERIFIED` pass awaiting AC10).

### 16.1 Owner decision, 2026-09-16 — amends R5 / AC6 (quoted verbatim; full text in `docs/sessions/evidence/task821/Rev2_00_owner-decision.txt`)

> Decision: the two stale allowlist entries are authorized for removal as part of Task 821.
>
> The 2026-09-11 instruction to "keep them governed by their explicit entries" applies to the transitional
> pre-enrolment state. It does not require stale allowlist records to remain after the underlying tier-3
> exception has been resolved.
>
> R5 / AC6 are amended only insofar as they previously required the two allowlist entries to remain in the
> final tree. AC6a's sequencing and ownership-transfer evidence remains required.

Wherever §4 R5, §12 AC6, §5 and §15 say the entries "stay", read "are removed after enrolment makes them stale".

### 16.2 AC10 — owner visual QA

Owner, 2026-09-16, on all six tuples (Story blobs `295481528a3163c8eca64d684949f3adb066b9d3` /
`c9558f196e4f1d2359fe6318606f9b785611dfa1`): "візуально все ок, підтверджую." — **ACCEPTED**.

### 16.3 Notes carried

Two P3 findings, filed as **826**: both Stories' JSDoc still claim `owner: "821"` in an allowlist that is `[]`;
`FavoriteButton.stories.tsx` cites `ListingDetailView.tsx:248-254` as a reproduced call site but does not render it.
