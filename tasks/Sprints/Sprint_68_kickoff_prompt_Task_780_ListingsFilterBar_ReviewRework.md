# Task 780 — `ListingsFilterBar` review rework: remove the production inset, absorb the `Indicator` overhang in the story harness

**Sprint:** 68 — `/listings` leaves Tailwind, one surface at a time
**Priority:** P2 · **QA profile:** **Q3 Full Visual Matrix**
**Filed:** 2026-09-02 · **State:** `KICKOFF FILED`
**Kickoff path:** `tasks/Sprints/Sprint_68_kickoff_prompt_Task_780_ListingsFilterBar_ReviewRework.md`
**Supersedes:** the unfiled rework that produced `docs/sessions/2026-09-02-task780-listings-filter-bar-review-rework.md`.
That work was reviewed `NEEDS REVISION` on 2026-09-02; this kickoff is the artifact that review found missing.

---

## 1. Mode and task type

`TASK DESIGN` → implementation handoff. Task type: **UI / Layout — remediation** on a current Mantine surface.
Secondary bundle: **Storybook / Visual Proof**. Execution state: **remediation**, not from-scratch — Task 779's
migration and Task 780's two layout fixes are kept; only the third fix (`me="sm"`) is withdrawn and relocated.

---

## 2. Objective

Withdraw the 12px production-visible right inset from `ListingsFilterBar.tsx` and absorb the Mantine `Indicator`
corner-badge overhang where it actually belongs — in the story's own Mantine-native container, which is the
convention every other `Patterns/Mantine/*` story already follows and which mirrors the container production
supplies through `ListingsPageFrame`.

Then add the control that would have caught the defect in the first place: a **container-relative** width assertion.
The instrument that certified the previous attempt measured every control against the bar's own root, so it could
not observe that the bar root had itself shrunk.

---

## 3. Verified context

Every fact below was read from the working tree on **2026-09-02** in the review session that produced this kickoff.
`FACT` = read directly. `INFERENCE` = derived from named facts.

### 3.1 Worktree state at design time

`FACT` `git --no-optional-locks log --oneline -1` → `3beabc9cc`. `git --no-optional-locks status --porcelain -- src
scripts docs tasks` returns exactly ten paths: `M docs/backlog.md`, `M scripts/mantine-migration-scope.json`,
`M src/modules/listings/components/ListingsFilterBar.tsx`, `M src/modules/listings/components/ListingsShellView.tsx`,
and untracked `docs/sessions/2026-09-02-task779-…md`, `docs/sessions/2026-09-02-task780-…md`,
`docs/sessions/evidence/task779/`, `docs/sessions/evidence/task780/`,
`src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx`,
`src/stories/patterns/mantine/ListingsFilterBar.stories.tsx`.

`FACT` **All of Tasks 779 and 780 are uncommitted.** There is no commit boundary between them; the executor is
editing an already-dirty tree that it does not own end to end. Re-take the porcelain snapshot before the first write
and compare it to this list.

### 3.2 The defect being withdrawn

`FACT` `src/modules/listings/components/ListingsFilterBar.tsx:75` — `<Stack gap={0} me="sm" data-testid="listings-filter-bar-root">`.
`FACT` `src/design-system/mantine/theme.ts:203` — `sm: '0.75rem'` = **12px**.
`FACT` `docs/sessions/evidence/task780/layout-measurements.json` records `barRootWidth` **308 / 363 / 378 / 1012**
against viewports 320 / 375 / 390 / 1024 — exactly `viewport − 12` — with `barRootRight === barRootWidth`, i.e. the
inset is **right-side only**; there is no matching `ms`.
`FACT` `src/modules/listings/components/ListingsShellView.tsx:74-92` — the bar's wrapper `<Box visibleFrom="md">`
and every sibling (`ListingsStatusTabs`, `ActiveFilterChips`, `ListingsSortBar`, the grid, pagination) carry no
equivalent inset.
`INFERENCE` on the production route at ≥768px the bar's content box and its bottom `Divider` therefore end 12px
inside the container's right edge while every sibling is flush. **No artifact in Task 780 captured the production
consumer**, which is why this was returned rather than accepted.

### 3.3 Why the overhang exists, read at source

`FACT` `node_modules/@mantine/core/esm/components/Indicator/Indicator.mjs:25-27` — `defaultProps = { position: "top-end", offset: 0 }`.
`FACT` `node_modules/@mantine/core/esm/components/Indicator/get-position-variables/get-position-variables.mjs` — for
`position: "top-end"`, `placement === 'end'` sets `--indicator-right: <offset>` **and** `--indicator-translate-x: "50%"`.
`FACT` `node_modules/@mantine/core/styles/Indicator.css` — `.m_760d1fb1` is `position: absolute` with
`right: var(--indicator-right)` and `transform: translate(var(--indicator-translate-x), …)`; with a label it also
takes `padding-inline: calc(var(--mantine-spacing-xs) / 2)`.
`INFERENCE` the badge is centred on the Button's right edge and therefore overhangs it by **half the badge's own
width** by design. That is not a defect; it is what `Indicator` is for. The overhang is ~7px, matching the
`scrollWidth 1031 > clientWidth 1024` diagnostic recorded in the previous session log §2.

### 3.4 Why the overhang only escapes in the story

`FACT` `src/modules/listings/components/ListingsPageFrame.tsx:74-81` — production renders the shell inside a `Box`
with `px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }}`. `FACT` `theme.ts:201-212` — `md`=16px, `xl`=24px,
`2xl`=32px, `3xl`=48px. `FACT` `theme.ts:174-180` — `lg: '64em'` = 1024px.
`FACT` `src/stories/patterns/mantine/ListingsFilterBar.stories.tsx:31-33` — `skipCanvas: true`, `layout: 'fullscreen'`,
and the render at `:65` returns the bare `<ListingsFilterBar …/>` with **no container**.
`INFERENCE` the story places the bar in a containing block production never gives it — flush to the viewport edge —
so a badge that overhangs into a real gutter in production overhangs into nothing in the story.

### 3.5 The harness route is the repository's own documented convention

`FACT` `.storybook/preview.tsx:119-124` — *"Mantine pattern stories (`Patterns/Mantine/*`) set
`parameters.skipCanvas=true` to bypass this wrapper and **use Mantine-native layout containers instead**. This means
Mantine stories are NOT proven through `.container-wide` — they use **Mantine's own Box/Container/AppShell as their
responsive proof layer**."*
`FACT` `.storybook/preview.tsx:132-135` — `withCanvas` returns `<Story />` unwrapped when `skipCanvas` is set.
`FACT` `skipCanvas` is set in **73** story files; all three sibling `/listings` stories set it
(`ListingsFilters.stories.tsx:35`, `ListingsPagination.stories.tsx:10`, `ListingsPageFrame.stories.tsx:10`).
`INFERENCE` `skipCanvas: true` is correct and stays. What is missing is the second half of the convention — the
Mantine-native container the story is expected to supply in its place. `ListingsPageFrame` supplies its own; the
filter-bar story supplies none.

`FACT` `scripts/check-stories.mjs` Check 1 bans only `layout:'centered'` and `layout:'padded'`; no check in that file
(Checks 1-16, enumerated at `:175-1023`) forbids a Mantine wrapper element inside a story's `render`.
`FACT` `scripts/check-design-tokens.mjs:105` — `SKIP_SUFFIXES = ['.stories.tsx', '.test.tsx', '.test.ts']`.

### 3.6 What the rendered gate actually measures

`FACT` `scripts/check-stories-rendered.mjs:1128` —
`document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1` is the whole of
`noHorizontalOverflow`. It is **document-level**.
`INFERENCE` a story-level container with horizontal padding ≥ the badge overhang removes the violation without any
production change, because the overhang then falls inside the padding rather than past the document edge. At the
narrowest cell (320px) the base gutter is 16px against a ~7px overhang.

`FACT` the full-width checks are **parent-relative**. In manifest
`.screenshots/rendered-assert/2026-09-02T10-47`, cell `Patterns/Mantine/ListingsFilterBar/Default × uk × mobile-320`
reports `pass: true`, `fullWidthControlsAtMobile: true`, `fullWidthButtonsAtMobile: true`, while its retained
screenshot shows the two comboboxes and the advanced-filters Button at roughly 212 / 228 / 184 px inside a 320px
viewport. **A green rendered cell is not proof of a width contract on this surface.** That is why §13 R5 exists.

### 3.7 The `Indicator`-side alternative, inspected and rejected

Reducing the overhang at the `Indicator` requires `offset` ≈ half the badge width — a raw pixel value. `FACT` Task
779 §10.1/CC4 and §9 B10 require **no `size` and no `offset` prop**, citing Task 777's closure precedent that a
Mantine default control size is accepted over a raw-pixel reproduction; `FACT` R12 forbids raw px. `position` has no
value that removes the 50% translate (§3.3). `CONFLICT` therefore exists between the `Indicator` route and a recorded
constraint, and the harness route does not carry it. **One active route: the harness.** Recorded here so the executor
does not reopen it.

### 3.8 Baseline B is reusable — do not re-capture it

`FACT` `docs/sessions/evidence/task780/B-manifest.json` exists, `timestamp 2026-09-02T12-42`,
`runMode: mantine-only`, `phasesSkipped: ['phase1-assert-stories','phase2-geometry-only']`, summary
`1380 total / 1273 pass / 80 fail / 27 ambiguous`. It was captured from an isolated `git archive HEAD` tree.
`FACT` `HEAD` is still `3beabc9cc` and nothing has been committed since.
`INFERENCE` B remains a valid pre-edit baseline for the identical tree, so this task captures **one** new
`screenshots:assert` run (P), not two. **S0 re-verifies `HEAD` before relying on this.**

`FACT` the reviewer independently rebuilt the previous differential from `B-manifest.json` and `P-manifest.json`:
`P \ B` = 16 identities, all `Patterns/Mantine/ListingsFilterBar/Default`, all `verdict: pass`,
`P_fail \ B_fail = ∅`, `P_ambiguous \ B_ambiguous = ∅`. The comparator is sound; only its input changes here.

### 3.9 Evidence that is stale and must be replaced

`FACT` `ListingsFilterBar.tsx` mtime `14:44:38`; `V2-final.log` … `V6-final.log` are all `13:43–13:44` and are
**MD5-identical** to the `12:38` copies `V-check-stories.log`, `V-story-coverage.log`, `V-governance-tailwind.log`,
`V-design-tokens.log`, `V-typecheck.log`. They were observed before the final write and are not admissible as
final-state evidence. `npm run build` (`V10-build.log`, 16:13) and the P run (manifest `14-47`) **are** current.

### 3.10 The instrument that certified the previous attempt no longer exists

`FACT` the previous session log §1 records four `_task780-*.mjs` helper scripts created at the project root and
**deleted before the report**. `layout-measurements.json` therefore has no retained producer and no `probeHash`.
`FACT` its comparator normalises every control against `barRootWidth`, so `advancedWidth == barRootWidth` and
`rightEdgeDiff: 0` hold **by construction** even while the bar root is 12px narrower than its container. This is the
standing M1/M2/M4/M5 failure mode named in `docs/orchestrator-procedures.md` — the control could not detect its own
effect. `FACT` Sprint 68's own precedent (Task 775) required `probeHash` to match `git hash-object` of a retained
probe.

---

## 4. Requirements — ledger

| ID | Source | Observable requirement | Pri | Verification | Status |
|---|---|---|---|---|---|
| **R1** | Owner decision 2026-09-02 | `me="sm"` is removed from the root `Stack` (`:75`). `ListingsFilterBar.tsx` contains no margin, padding, width or inset that compensates for the `Indicator` overhang. The obsolete comment paragraph at `:21-32` is removed or rewritten to describe the real mechanism. | P0 | AC1 + `git diff` | Confirmed |
| **R2** | Owner decision 2026-09-02 · §3.5 | The overhang is absorbed by a **Mantine-native container inside the story file**, using the same responsive `px` ladder production supplies (`ListingsPageFrame.tsx:78`). Mantine tokens only; no raw px, no `className`, no CSS module. | P0 | AC2 + AC5 | Confirmed |
| **R3** | §3.7 · Task 779 CC4 · Task 777 precedent | `Indicator` keeps Mantine defaults — **no `size`, no `offset`, no `position`** prop. | P0 | AC3 | Confirmed |
| **R4** | Task 779/780 retained work | Everything the previous attempt fixed stays fixed: `Box w={FULL_BELOW_SM}` around both comboboxes, the `w={FULL_BELOW_SM}` cascade, `ms={{ sm: 'auto' }}` on the right-actions `Group`. No control regresses to content width. | P0 | AC4 | Confirmed |
| **R5** | Review finding F5 · §3.10 | The layout instrument gains a **container-relative** assertion: the bar root's right edge equals its containing block's content-box right edge within 2px, at every cell. This is the control that detects R1's defect class. | P0 | AC6 + the two-armed plant | Confirmed |
| **R6** | D68-2 | Differential rendered acceptance: B reused per §3.8, fresh P, `P \ B = ∅` as a **set of normalized cell identities**, all 16 `ListingsFilterBar` cells PASS, and `noHorizontalOverflow === true` on all 16. | P0 | AC7 | Confirmed |
| **R7** | Review finding F2 · contract clause 9/9a | Every gate in §13's V-list is observed **after** the final source write. No transcript may predate it. | P0 | AC8 | Confirmed |
| **R8** | Review finding F5 | The measurement script is retained (not deleted) under `docs/sessions/evidence/task780R/`, with its `git hash-object` recorded in the session log. | P1 | AC9 | Confirmed |
| **R9** | R14/AC14 lineage · review finding F7 | The CC record is brought back into agreement with the diff: CC8's `justify="space-between"` claim is corrected to `ms={{ sm: 'auto' }}`, and two new rows are recorded with measured before/after — **CC10** the withdrawal of the 12px inset, **CC11** the story container. No "visually neutral" claim anywhere. | P1 | AC10 | Confirmed |
| **R10** | Scope | Zero diff to `ListingsShellView.tsx`, `scripts/mantine-migration-scope.json`, `listingsFilterBar.smoke.test.tsx`, `useListingsUrlFilters.ts`. They are already correct. | P1 | AC11 | Confirmed |
| **R11** | `orchestrator-role.md` → Backlog discipline | The executor records **concise state only** and must not push `docs/backlog.md` above **80 physical lines**. Consolidating the file back under the limit was done by Opus in the same edit that filed this kickoff (84 → measured value recorded there); the executor inherits a compliant file and must keep it compliant. | P2 | AC12 | Confirmed |

---

## 5. Assumptions and open questions

- `A1` **(assumption, measured-not-assumed by AC7)** A base gutter of 16px absorbs a ~7px overhang at 320px. The
  executor measures `documentElement.scrollWidth` per cell rather than trusting this arithmetic.
- `A2` **(assumption, reversible)** The story container changes no full-width verdict, because those checks are
  parent-relative (§3.6). If any cell regresses, **stop and report** — do not widen the container to make it pass.
- `A3` **(known limitation, unchanged, do not fix here)** Raw lowercase enum labels in the property-type combobox in
  Storybook — Task 679.
- `A4` **(known limitation, unchanged)** §10.6 of the Task 779 kickoff still stands: 391-1023px is never captured, so
  the 768px route boundary is proven by T6, never by pixels.
- `Q1` **(open, non-blocking, do NOT act on it here)** `MantineCountButton` remains the convergence candidate for the
  "filters trigger + count" artifact, deferred to the final `ListingsShellView` slice.
- `UNKNOWN` Whether the migrated bar rendered as one row or two at 1024 **before** the migration. Recorded by the
  review as `NEEDS VERIFICATION`; no pre-migration baseline exists. **Out of scope here** — do not attempt to change
  the row count, and do not claim it as preserved.

---

## 6. Pre-read rule bundle

Read these and nothing else by default.

**Always required** — `docs/agent-contract.md` · `docs/rule-index.md` · `docs/qa-profiles.md` · `docs/backlog.md`.

**Current Mantine path** — `docs/mantine-responsive-design-system.md` · `docs/component-rules.md` · `docs/qa-rules.md`.

**Storybook / visual proof** — `docs/storybook-governance.md` (§14.1, §14.9.17, §14.11) · `docs/storybook-visual-snapshots.md`.

**Sprint** — `tasks/Sprints/Sprint_68_Listings_Leaves_Tailwind_One_Surface_At_A_Time.md` (**D68-2**, exit criteria) ·
`tasks/Sprints/Sprint_68_kickoff_prompt_Task_779_ListingsFilterBar_Mantine.md` (§3.7, §9, §10.1-10.4, §10.6 — the
constraints this task must not break) · `docs/sessions/2026-09-02-task780-listings-filter-bar-review-rework.md`
(the retained evidence this task reuses and replaces).

**Source to read before editing** — `src/modules/listings/components/ListingsFilterBar.tsx` ·
`src/stories/patterns/mantine/ListingsFilterBar.stories.tsx` · `src/modules/listings/components/ListingsPageFrame.tsx:74-81`
· `.storybook/preview.tsx:115-142` · `src/design-system/mantine/theme.ts` (spacing `:200-213`, breakpoints `:174-180`).

**Execution protocol** — `.claude/skills/execute-task/SKILL.md` (auto-loaded).

---

## 7. Scope

Exactly these paths may be edited:

| # | Path | Change |
|---|---|---|
| 1 | `src/modules/listings/components/ListingsFilterBar.tsx` | Remove `me="sm"` at `:75`; remove/rewrite the obsolete comment paragraph `:21-32`. **Nothing else.** |
| 2 | `src/stories/patterns/mantine/ListingsFilterBar.stories.tsx` | Add the Mantine-native container around the rendered bar (R2), plus its `Box` import and a comment naming `preview.tsx:119-124` and `ListingsPageFrame.tsx:78` as its provenance. |
| 3 | `docs/sessions/evidence/task780R/` | **New** — retained transcripts, manifests, measurement JSON **and the measurement script itself** (R8). |
| 4 | `docs/sessions/2026-09-02-task780R-listings-filter-bar-rework.md` | **New** session log. |
| 5 | `docs/backlog.md` | State update + return to ≤80 lines (R11). |

---

## 8. Out of scope — a diff touching any of these is rejected, not noted

- `src/modules/listings/components/ListingsShellView.tsx` — **zero diff**. Its wrapper is correct.
- `scripts/mantine-migration-scope.json` — **zero diff**, already at 22.
- `src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx` — **zero diff**. Its T1-T7 contract is
  unaffected; jsdom has no layout, so no unit test can assert this task's geometry. Do not add one that merely
  mirrors a prop.
- `src/modules/listings/hooks/useListingsUrlFilters.ts` · `LocationCombobox.tsx` · `MantineCombobox.tsx` ·
  `src/design-system/mantine/theme.ts` · `.storybook/preview.tsx` — read-only.
- `Indicator`'s `size`/`offset`/`position` (§3.7). `MantineCountButton` adoption (Q1).
- The desktop row count (§5 `UNKNOWN`), the standing global FAIL/AMBIGUOUS cells, the raw enum labels (Task 679),
  `scripts/governance/tailwind-entropy.allowlist.json`, `Codex-tasks/*`.
- Task 778's archive-row closure and the Sprint 68 `Landed tasks` count — **orchestrator/owner work, not the
  executor's.**

---

## 9. Current and required behavior

| # | Current (measured, §3) | Required after | Classification |
|---|---|---|---|
| B1 | Root `Stack` carries `me="sm"`; `barRootWidth = viewport − 12` at all four viewports, right side only. | Root `Stack` carries no `me`; `barRootWidth` equals its containing block's content width at all four viewports. | **Withdrawn — CC10.** |
| B2 | Story renders the bar bare at `layout:'fullscreen'`, flush to the viewport edge — a containing block production never supplies. | Story renders the bar inside a Mantine container carrying `px={{ base:'md', sm:'xl', lg:'2xl', xxl:'3xl' }}`, matching `ListingsPageFrame.tsx:78`. | **Added — CC11.** |
| B3 | `documentElement.scrollWidth` fits only because the bar shrank itself. | `documentElement.scrollWidth <= clientWidth + 1` at all 16 cells because the badge overhangs into the story container's gutter. | **Preserved outcome, mechanism relocated.** |
| B4 | Both comboboxes wrapped in `Box w={FULL_BELOW_SM}`; full `w` cascade; `ms={{ sm:'auto' }}`. | Identical. | **Preserved — P0.** |
| B5 | `Indicator` at Mantine defaults, `data-testid="task775-advanced-filters"` verbatim. | Identical. | **Preserved — P0.** |
| B6 | Layout instrument measures every control against `barRootWidth`; deleted after use. | Instrument adds a container-relative assertion and is **retained** with its `git hash-object`. | **Changed — R5/R8.** |

---

## 10. Implementation requirements

### 10.1 Visual source map

| Visible artifact | Current markup | Utility → cascade → token path | Disposition | Evidence |
|---|---|---|---|---|
| Bar right inset | `ListingsFilterBar.tsx:75` `me="sm"` | `theme.ts:203` `sm: '0.75rem'` = 12px, `margin-inline-end` | **Removed** — no provenance, no owner decision, production-visible | R1, AC1 |
| Story containing block | absent | `ListingsPageFrame.tsx:78` `px={{ base:'md', sm:'xl', lg:'2xl', xxl:'3xl' }}` → `theme.ts:201-212` 16/24/32/48px | **Reuse the production ladder, in the story only** | R2, AC2 |
| Badge overhang | `Indicator` defaults | `get-position-variables.mjs` `translate-x: 50%` on `top-end` | **Preserved unchanged** — it is the primitive's designed behaviour | R3, AC3 |

### 10.2 Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical source | Disposition | Required implementation |
|---|---|---|---|---|
| Story containing block | `.storybook/preview.tsx:115-142` (read in full) · `grep -rn "skipCanvas" src/stories` → 73 files · `ListingsFilters.stories.tsx:35` · `ListingsPagination.stories.tsx:10` · `ListingsPageFrame.stories.tsx:10` · `ListingsPageFrame.tsx:74-81` | Mantine `Box` with the production `px` ladder; convention stated verbatim at `preview.tsx:119-124` | **reuse** | Wrap the rendered bar in the story file. Mantine responsive props only. No new shared component — this is a per-story containing block, not a new pattern, so no catalog or coverage registration changes. |
| Badge overhang mechanism | `Indicator.mjs:25-27` · `get-position-variables.mjs` · `Indicator.css` `.m_760d1fb1` (all read in full) · Task 779 §3.7/CC4 · Task 777 closure | Mantine `Indicator` defaults | **reuse unchanged** | No prop override. The `offset` route is rejected in §3.7 with its reason. |

**No requested visual value lacks provenance.** This task is not `BLOCKED — CANONICAL STYLE DECISION REQUIRED`.

### 10.3 Accepted canonical changes — recorded, not masked

- **CC10 — the bar loses its 12px right inset.** Before: `barRootWidth` 308/363/378/1012 at 320/375/390/1024, right
  edge 12px inside the containing block. After: `barRootWidth` equals the containing block's content width; the bar's
  right edge is flush with its siblings on the production route. **Measure and record both.**
- **CC11 — the story gains the production containing block.** Before: bar flush to the viewport edge, controls sized
  against the full viewport. After: controls sized against `viewport − 2 × gutter` (16px each side at 320/375/390,
  32px at 1024). **Record the measured control widths before and after; this is a real change to what the 16 cells
  depict, and it makes them more faithful to production, not less.**
- **CC8 correction (Task 779 §7).** That row states the spacer became a `Group justify="space-between"` composition.
  The delivered mechanism is `ms={{ sm: 'auto' }}` on the right-actions `Group`. Correct the record.

**A "no visual change" or "visually neutral" claim anywhere in the report is an automatic finding.**

### 10.4 The measurement instrument — retained, and it must be able to fail

Rebuild the deleted script and keep it. It must record, per cell, alongside the existing raw values:

- `containerContentRight` — the content-box right edge of the bar root's **offset parent / containing block**;
- `barInsetRight = containerContentRight − barRootRight`;
- `pass` requires `|barInsetRight| <= 2`.

**Two-armed planted-violation obligation — both arms are mandatory:**

| Arm | Plant | Must fail |
|---|---|---|
| **P-A** | Re-add `me="sm"` to the root `Stack` | R5's `barInsetRight` assertion, at every cell |
| **P-B** | Remove the story container | `noHorizontalOverflow` in `screenshots:assert`, at ≥1 cell |

Record the **actual** failing output for each arm, then revert and re-run to green. A plant that does not fail is a
defective control and must be reported as such, not adjusted until it passes. P-B may be verified against a single
targeted cell rather than the full matrix if the harness supports it; say which was done.

---

## 11. Positive and negative flows

### 11.1 Positive flow

1. `me="sm"` is removed. The bar root's width equals its containing block's content width.
2. The story wraps the bar in the Mantine container carrying the production `px` ladder.
3. At 320/375/390 the controls fill `viewport − 32px`; the `Indicator` badge overhangs the advanced-filters Button
   by ~7px into the 16px right gutter and never reaches the document edge.
4. At 1024 the right-actions `Group` stays pinned to the bar's right edge via `ms={{ sm: 'auto' }}`, and the bar's
   right edge is now flush with the container.
5. `documentElement.scrollWidth <= clientWidth + 1` at all 16 cells.
6. On the production route the bar's bottom `Divider` is flush with the status tabs, the sort bar and the grid.

### 11.2 Negative-flow applicability

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Badge clipped or overflowing after the inset is withdrawn | **Yes** | §3.3, §3.6 | No `horizontal-overflow` verdict at any of the 16 cells; badge fully rendered | AC7 + P-B |
| A control regresses to content width | **Yes** | §3.6 — the gate is parent-relative and cannot be trusted alone | 16/16 container-relative cells PASS | AC6 + P-A |
| Long uk/it labels at 320 inside a narrower container | **Yes** | Q3 mobile stress; the container removes 32px of usable width | Labels wrap; no overflow; no clipped text | The 320 × sq/en/uk/it cells |
| Zero active filters | **Yes** | `:103`, `:127` lineage | Reset absent; `Indicator` disabled — unchanged by this task | Existing T7, re-run unmodified |
| URL contract | **No** | This task edits no handler and no hook | N/A — existing T1-T5 re-run unmodified as a regression guard | V1 |
| Route visibility boundary | **No** | `ListingsShellView.tsx` is zero-diff | N/A — existing T6 re-run unmodified | V1 |
| Authorization / RLS · offline · concurrent writer · SSR hydration | **No** | No read, no write, no new client hook; the story container is pure CSS | N/A | — |

---

## 12. Acceptance criteria

| # | Criterion |
|---|---|
| **AC1 [R1]** | **Given** the final `ListingsFilterBar.tsx`, **when** grepped, **then** it contains **0** matches for `me=`, `mr=`, `ml=`, `ms=` on the root `Stack`, **0** `className=`, and the `:21-32` comment paragraph no longer asserts a margin mechanism. `ms={{ sm: 'auto' }}` on the right-actions `Group` is **retained** and is the only `ms` in the file. |
| **AC2 [R2]** | **Given** the final story file, **then** the rendered bar is wrapped in a Mantine element whose `px` equals `{ base:'md', sm:'xl', lg:'2xl', xxl:'3xl' }`, expressed with Mantine tokens only — no raw px/rem, no `className`, no `style`, no CSS module — and `skipCanvas: true` and `layout: 'fullscreen'` are unchanged. |
| **AC3 [R3]** | **Given** the final `ListingsFilterBar.tsx`, **then** the `Indicator` carries no `size`, `offset` or `position` prop. |
| **AC4 [R4]** | **Given** the final file, **then** both comboboxes remain wrapped in `Box w={FULL_BELOW_SM}`, every leaf `Button` and the `Indicator` retain `w={FULL_BELOW_SM}`, and `data-testid="task775-advanced-filters"` and `data-testid="listings-filter-bar-root"` are byte-identical. |
| **AC5 [R2]** | **Given** the 16 cells, **then** every one renders the bar's real controls with the container's gutter visible on **both** sides — no asymmetric inset. |
| **AC6 [R5]** | **Given** the rebuilt instrument, **then** all 16 cells report `|barInsetRight| <= 2` and the mobile cells report every measured control `>= barRootWidth − 2`; **and** plant **P-A** is recorded failing this assertion before revert. |
| **AC7 [R6]** | **Given** B (§3.8, reused) and the fresh P, **then** `P \ B = ∅` as a set of normalized cell identities, `total(P) = total(B) + 16`, `pass(P) = pass(B) + 16`, all 16 `ListingsFilterBar` cells are PASS with `noHorizontalOverflow === true`, and plant **P-B** is recorded failing before revert. |
| **AC8 [R7]** | **Given** every transcript in §13's V-list, **then** each one's run time is **after** the final source write, and each records platform (`win32`), Node version, cwd, exact command and actual exit code. |
| **AC9 [R8]** | **Given** `docs/sessions/evidence/task780R/`, **then** the measurement script is present and the session log records its `git hash-object` value. |
| **AC10 [R9]** | **Given** the session log, **then** CC8 is corrected and CC10/CC11 are recorded with measured before/after values. |
| **AC11 [R10]** | **Given** `git --no-optional-locks diff --stat`, **then** `ListingsShellView.tsx`, `mantine-migration-scope.json`, `listingsFilterBar.smoke.test.tsx` and `useListingsUrlFilters.ts` show **no new diff** beyond what §3.1 already records. |
| **AC12 [R11]** | **Given** `docs/backlog.md` after the executor's edit, **then** its physical line count is **≤80**, with the pre-write baseline taken from `git show HEAD:docs/backlog.md` (never measured after the executor's own edit and reported as pre-existing — the 717/721/722 corollary), and no multi-line task report was appended. |

---

## 13. QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** `docs/qa-profiles.md:15` — the change alters the rendered geometry of a
migrated Mantine surface; `Q3` cannot be approved without full visual proof for the affected story.

**Windows-native rule (P0).** Every command runs in **native Windows PowerShell** from the project root using
`npm.cmd` / `npx.cmd`. Record `node.exe -p process.platform` first; only `win32` is admissible. **The owner runs
nothing — the executor runs every gate in its own native session.**

### Sequence

**S0 — preconditions (before any write).**
```powershell
node.exe -p process.platform
git --no-optional-locks rev-parse HEAD          # MUST equal 3beabc9cc — otherwise B is invalid, STOP and report
git --no-optional-locks status --porcelain      # compare to §3.1's ten paths
```
If `HEAD` moved, **stop**: B must be re-captured and this kickoff's §3.8 no longer holds.

**S1 — implement R1 and R2.** Then run the instrument (R5) to confirm 16/16 before touching the gates.

**S2 — the two-armed plant.** P-A and P-B per §10.4, each with its actual failing output, then revert.

**V — gates, in this order, all after the final write.**

| # | Command | Note |
|---|---|---|
| V1 | `npx.cmd vitest run src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx src/components/shared/__tests__/filtersPanelShell.smoke.test.tsx src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` | Unmodified suites, run as a regression guard. Expect 60/60. |
| V2 | `npm.cmd run check:stories` | |
| V3 | `npm.cmd run check:story-coverage` | Must still report 22/22. |
| V4 | `npm.cmd run governance:tailwind` | Baseline must not grow (`C0/H10/M0`). |
| V5 | `npm.cmd run check:design-tokens:strict` | **AC1/AC2.** |
| V6 | `npm.cmd run typecheck` | |
| V7 | `npm.cmd run build-storybook` | |
| V8 | `npm.cmd run screenshots:assert -- --mantine-only` | Produces **P**. Apply **D68-2** with B from §3.8. Compute `P \ B` as a set of normalized cell identities, not a count comparison. Report the 16 cells individually with their `noHorizontalOverflow` value. |
| V9 | `npm.cmd run check:locale-leak:mantine-only` | Compare to the 23 pre-existing leaks; zero attributable to this bar. |
| V10 | `npm.cmd run build` | **Hard gate.** |
| V11 | `git --no-optional-locks diff --check` | |
| V12 | `git --no-optional-locks diff --stat` | **AC11.** |

V4/V5/V6 replace the stale `V4-final`/`V5-final`/`V6-final` transcripts identified in §3.9; V2/V3 replace theirs for
completeness. Retain all of them under `docs/sessions/evidence/task780R/`.

---

## 14. Completion report contract

Status must be exactly one of `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.
**Sonnet has no approval authority and must not emit, suggest, or run any mutating git command, including `git push`.**

Report:

1. **Files changed** — a table matching the real `git --no-optional-locks status --short`, reconciled against §7, and
   explicitly separating this task's paths from the Task 779/780 changes already in the tree (§3.1).
2. **Requirement IDs completed** — R1-R11, each with its evidence pointer.
3. **S0 preconditions** — the `HEAD` value actually read, and the porcelain comparison.
4. **Commands run** — every §13 command with platform, Node version, cwd, exact command, **actual** exit code and
   retained transcript path, plus the run time of each relative to the final source write (AC8).
5. **Differential rendered result** — B and P identifiers, the `P \ B` set (empty or enumerated), the 16 cells listed
   individually with `noHorizontalOverflow`, and AC7's arithmetic reconciliation.
6. **Planted violations** — P-A and P-B, each with the actual failing output, the revert, and the re-run result.
7. **Measured before/after** — CC10 and CC11 per §10.3, plus the CC8 correction.
8. **Instrument** — the retained script's path and `git hash-object` value.
9. **Assumptions** — the fate of A1-A4, in particular whether A2 held.
10. **Backlog + session log** — concise state in `docs/backlog.md` (≤80 lines, baseline from `git show HEAD:`); full
    detail in `docs/sessions/2026-09-02-task780R-listings-filter-bar-rework.md` with a "Files Changed" table matching
    the diff.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | **Yes** — every file, line, command, token, prop and rejected alternative is named in-document. |
| Every primary requirement has a binary AC and a verification method | **Yes** — R1-R11 → AC1-AC12, each mapped to a §13 step. |
| Scope protects existing behavior and names what must not change | **Yes** — §8 makes four files zero-diff and fences off the `Indicator` props, the row count, and Task 778's closure. |
| Canonical Story source-of-truth check | **Yes** — the Story exists, is in scope, and is where the fix lands. No demo stand-in; the real component is still rendered. |
| Permanent-story creation gate | **Not triggered** — no story is created and no permanent markup is added to manufacture gate evidence. The container is the containing block production already supplies (`ListingsPageFrame.tsx:78`), authorized by `preview.tsx:119-124`; the two probes in §10.4 are explicitly reversible and their revert is evidenced by V8/V12. |
| Negative flows selected by applicability | **Yes** — §11.2 marks six branches `No` with the specific mechanism, not a generic checklist. |
| No uninspected claim | **Yes** — every `FACT` in §3 cites a file and line read in the design session, including the four `node_modules` reads (`Indicator.mjs:25-27`, `get-position-variables.mjs`, `Indicator.css` `.m_760d1fb1`) and `.storybook/preview.tsx:119-135`, `scripts/check-stories-rendered.mjs:1128`, `scripts/check-design-tokens.mjs:105`. |
| Detector-aware requirements | **Yes** — §3.6 states, **before** the executor builds against it, that the rendered gate's full-width checks are parent-relative and have already produced a measured false green on this exact story, and routes the real proof to R5's container-relative assertion instead. |
| Gates prove the changed behavior, not procedure | **Yes** — R5 exists specifically because the previous instrument could not detect its own effect, and §10.4 requires a two-armed plant in which P-A fails on the withdrawn defect and P-B fails on the relocated one. |
| Exactly one active owner route | **Yes** — the owner named two options; §3.7 rejects the `Indicator` route against a recorded constraint (CC4 / Task 777 / R12) and records the reason so it is not reopened. |
| Every owner-only exception has traceable authorization | **Yes** — the withdrawal of `me="sm"` cites the owner decision of 2026-09-02 quoted in §17; **D68-2** governs the rendered acceptance; the story-container convention is quoted verbatim from `preview.tsx:119-124`. |
| Checkpoints name producer, output, comparator, failure behavior | **Yes** — S0 (`HEAD` comparator → stop), S2 (both plants must fail), V8 (`P \ B` set comparator + per-cell overflow), AC6 (`\|barInsetRight\| <= 2`), AC8 (transcript-freshness comparator). |
| Counts account for task-created artifacts | **Yes** — AC7 states `total(P) = total(B) + 16` explicitly; no new story and no new manifest entry are created, so the arithmetic is unchanged from the previous attempt. |
| Dirty-worktree handling | **Measured, not assumed** — §3.1 records the exact ten-path start state and S0 requires re-taking it before the first write. |
| No fact asserted `Confirmed` whose first verification is deferred | **Yes** — S0 is an I0 re-measure of `HEAD` (freshness, because B's validity depends on it); every other `Confirmed` row cites a read performed in the design session. |
| Cited steps match the final plan | **Re-checked after the final revision** — §12's references to §13 S0/S1/S2/V1-V12 and §10.3/§10.4 resolve. |

---

## 16. Implementation handoff

Execute from the saved task at
`tasks/Sprints/Sprint_68_kickoff_prompt_Task_780_ListingsFilterBar_ReviewRework.md`, following
`.claude/skills/execute-task/SKILL.md`.

Order: **S0 preconditions → S1 implement → instrument 16/16 → S2 two-armed plant → V1-V12 → report.**

Return `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never self-approve.
Do not run any mutating git command.

---

## 17. FACTS · INFERENCES · UNKNOWNS · CONFLICTS

**FACTS** — `HEAD` `3beabc9cc` with all of 779/780 uncommitted; `ListingsFilterBar.tsx:75` `me="sm"`;
`theme.ts:203` `sm: '0.75rem'` = 12px; `layout-measurements.json` `barRootWidth` 308/363/378/1012 with
`barRootRight === barRootWidth`; `ListingsShellView.tsx:74-92` siblings carry no inset;
`ListingsPageFrame.tsx:74-81` `px={{ base:'md', sm:'xl', lg:'2xl', xxl:'3xl' }}`; `theme.ts:201-212` 16/24/32/48px and
`:174-180` `lg: '64em'`; `Indicator.mjs:25-27` defaults `top-end`/`offset 0`; `get-position-variables.mjs`
`translate-x: 50%` for `placement === 'end'`; `Indicator.css` `.m_760d1fb1` absolute + `padding-inline` with label;
`preview.tsx:119-124` and `:132-135` (skipCanvas → Mantine-native containers) with 73 story files setting it;
`check-stories.mjs` Checks 1-16 forbid no story-level wrapper; `check-design-tokens.mjs:105` skips `.stories.tsx`;
`check-stories-rendered.mjs:1128` document-level overflow assertion; manifest `2026-09-02T10-47`'s
`uk × mobile-320` cell reporting `pass`/`fullWidthControlsAtMobile: true` against a screenshot showing three
content-sized controls; `B-manifest.json` `1380/1273/80/27`; `V2-final`…`V6-final` MD5-identical to the 12:38 copies
and older than the `14:44:38` source write; the four `_task780-*.mjs` scripts deleted before the previous report;
`docs/backlog.md` at 84 lines.

**INFERENCES** — the badge overhangs by half its own width by design, so it escapes the document only where the
containing block has no gutter; a story container carrying the production ladder removes the violation with zero
production change; B remains valid while `HEAD` is unchanged, so one P run suffices; the parent-relative full-width
checks are unaffected by the container (**AC5/AC6 measure this rather than assuming it**).

**UNKNOWNS** — whether the legacy bar rendered as one row at 1024 (no pre-migration baseline exists; explicitly out
of scope); the exact measured control widths after the container is added (bounded and measured by CC11, not
predicted here).

**CONFLICTS** — **One, resolved in §3.7 and not left to the executor.** The owner offered two routes; the
`Indicator` route requires an `offset` in raw pixels, which Task 779 CC4/§9 B10 and R12 forbid on the recorded
Task 777 precedent. The harness route carries no such conflict and is the single active route.

**BLOCKED** — None.

**Owner decision, 2026-09-02, verbatim:**

> рішення по `me="sm"`: рекомендую прибрати його з production-компонента й вирішити overhang на рівні `Indicator`
> або Storybook harness. До цього жодні перезапуски тестів не мають сенсу; screenshot-gates я не запускав і не
> пропоную запускати.

Read as: the inset leaves production code; the fix moves to the `Indicator` or the harness (this kickoff selects the
harness, §3.7); and **no gate is re-run until the fix exists** — which is why §13 runs every gate once, after the
final write, in the executor's own native session rather than asking the owner to run anything.
