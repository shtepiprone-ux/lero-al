# Task 726 — Remove the author-appliable `[role="group"]` exclusion, then give the chip rows their accessible name back

**Sprint:** 53 (`tasks/Sprints/Sprint_53_Mobile_FullWidth_Control_Remediation.md`). **Epic:** MM Phase-2 / Epic RS.
**Status:** **`KICKOFF FILED`** — owner-approved 2026-08-07 after a final document-only review. Ready for `@executor`.
**Companion artifacts:** `Sprint_53_Task_726_execution_contract.md` · `Sprint_53_Task_726_rule_compliance_ledger.md`
**Closes:** 711 review note F1 · 724R review notes N1/N2/N7 (reviews 2026-08-07).
**Revision:** 2026-08-07, 3rd draft. Written from the owner's review findings; every structural choice below is an
orchestrator correction based on those findings, not an owner approval. The prior draft is void — see §4.

> **Ordering is load-bearing.** Restoring `role="group"` on the chip rows while `check-stories-rendered.mjs:1238`
> still skips on it would re-silence the gate exactly as Task 724 did. Removing the skip without restoring the
> name leaves a shipped accessibility regression standing. **R2 → R3 → R4 → R5 → R6, in that order.**

---

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** **gate change** (`docs/rule-index.md` → governance/gate), agent-contract **clause 13**;
  secondary **accessibility/UI** on a shipped surface, clauses **3**, **7**, **11**.
- **Baseline:** the current **dirty** worktree — see §2.0. The probe file `Button.stories.tsx` is the one exception:
  its canonical state is `HEAD` (`a2279cd137a31643be9c883e9bebae3a405544ac`) and absent from `git status`.

---

## 2. Verified context — read from the repository 2026-08-07

### 2.0 Baseline — two classes, because the prior draft's single class was self-defeating

The prior draft froze a fixed hash for every status entry and then the orchestrator edited three of those same
files, so its own R1 would have halted before any work. **Orchestrator correction based on the review findings:**
mutable task/backlog/sprint documents do not belong under "any change = stop". The baseline is therefore split.

**Class A — frozen. Any difference is `stop and report`.**

| Status expected at J1 | Path | Required state |
|---|---|---|
| `M` | `.claude/skills/create-task/SKILL.md` | `951da117d14f1fdc731dcfc67f46bf9a36c173b1` — owner-authored, **do not touch** |
| `M` | `.claude/skills/execute-task/SKILL.md` | `639b883db2f23e8d03db4838c543ab8e5fcf5447` — owner-authored, **do not touch** |
| **absent** | `src/stories/mantine/primitives/Button.stories.tsx` | **Must NOT appear in `git status --porcelain`.** `git hash-object` must equal `HEAD`'s `a2279cd137a31643be9c883e9bebae3a405544ac`. See §2.1a |

**Class B — mutable design documents. Record the J1 hash as a witness; a difference is NOT a stop.**

`docs/backlog.md` · `tasks/Sprints/Sprint_53_Mobile_FullWidth_Control_Remediation.md` · this kickoff · the two
companion artifacts. These are expected to move between design and execution. Record each hash at J1 for the
ckpt-12 reconciliation; do not halt on a difference, and never revert one.

**Any path in `git status` that is in neither class is unaccounted for → stop and report.**

### 2.1a The `Button.Group` hunk is agent-created and must be gone before J1

`src/stories/mantine/primitives/Button.stories.tsx` carried an uncommitted +18-line hunk at `:176-193` whose own
comment reads `{/* ── Button.Group — role="group" grouped controls (Task 726 R1a) ── */}`. `R1a` was a requirement
in **this task's own rejected second draft**; the markup was produced by an agent executing it, not by the owner.
The prior draft mis-attributed it as a pre-existing user change and required restoring to it — which would have
shipped permanently the exact markup the permanent-Storybook gate forbids.

`git diff` on that path consisted of nothing but that hunk, so the owner removed it natively with
`git checkout --`. **Verified 2026-08-07:** the path is absent from `git status --porcelain` and
`git hash-object` returns `a2279cd137a31643be9c883e9bebae3a405544ac`, equal to `HEAD`; `git grep 'Button\.Group'
-- src/` returns no story hit. The precondition is satisfied. **The executor neither removes it nor works around
it**; R1 re-confirms at J1 and stops if the path has reappeared in `git status`.

### 2.1 The exclusion, quoted

`scripts/check-stories-rendered.mjs:1238`, inside `fullWidthButtonsAtMobile`:

```js
if (el.closest('[role="group"]')) continue;
```

Task 711 introduced it as the re-anchored form of shadcn's `[data-slot="button-group"]`, justified in its own
comment at `:1160-1164` as *"currently zero live matches in Mantine scope … preserved in intent, not invented."*
Task 724 then produced that attribute on four production containers and turned 48 of 136 in-scope cells green
with no layout change (724 F1, P0). 724R removed all four uses. **The selector is still live, and any developer
can satisfy it by adding one attribute to any container.** That is what this task removes.

### 2.2 No production `Button.Group` consumer exists — and that authorizes nothing

**Measure this yourself at J1, after §2.1a's removal.** With the agent-created hunk gone,
`git grep -n 'Button\.Group\|ButtonGroup' -- src/` returns three hits, all one unrelated feature:
`src/modules/listings/components/form/ButtonGroupField.tsx:25` (a form-field renderer importing `Button` from
`@/components/ui/button` — the **legacy shadcn** button, not `@mantine/core`) and its two registry references at
`fieldRegistry.ts:29,42`. No hit in `src/stories/**` — §2.1a's hunk is gone, verified 2026-08-07.

**This is context, not evidence.** Per the permanent-Storybook gate, the absence of an API-specific story is not
authorization to add markup, and story markup existing only to exercise a gate is a **probe**. This task adds no
permanent Storybook markup. If a real production Mantine `Button.Group` consumer is discovered, that is a
**stop-and-report** scope/owner-decision issue — do not resolve it by adding a story.

### 2.3 Every live `role="group"` in `src/`

`git grep -n 'role="group"' -- src/` — four hits, none introduced by 724/724R:

| File | Line | Named? | Disposition |
|---|---|---|---|
| `src/components/ui/input-group.tsx` | 15, 53 | n/a | Legacy shadcn primitive, outside Mantine gate scope. **Out of scope.** |
| `src/modules/cabinet/components/ListingsTab.tsx` | 171 | Yes — `aria-label={t('filter_ALL')}` | Already correct. **Out of scope, zero diff.** |
| `src/modules/listings/components/FavoritesTypeFilter.tsx` | 31 | Yes — `aria-label={tf('filter_label')}` | Already correct. **Out of scope, zero diff.** |

### 2.4 The accessibility regression 724R left behind

724R removed `role="group"` from the two leaf components but kept the `ariaLabel` prop:

```tsx
// src/components/shared/FilterRoomsRow.tsx:15
<div aria-label={ariaLabel} className="flex gap-2 flex-wrap">
```

`aria-label` on a `<div>` with no role resolves to `role="generic"`, for which ARIA 1.2 **prohibits** naming — the
attribute is exposed to nothing and axe-core reports `aria-prohibited-attr`. `FilterMultiToggle.tsx` is identical
in shape. And **no production call site passes the prop at all**:

| File | Sites | Passes `ariaLabel`? |
|---|---|---|
| `src/modules/listings/components/ListingsFilters.tsx` | 164, 237, 250, 282, 294, 306, 319 (7) | **No** |
| `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` | 113, 123, 136, 142, 147 (5) | **No** |
| `src/components/shared/FiltersPanel.tsx` | 6 `ariaLabel` props + the property-type `SimpleGrid`'s `aria-label` | Yes — but inert, same reason |

**The names already exist and must not be invented.** All 7 `ListingsFilters` sites are wrapped in
`<AccordionSection title={…}>` with a translated title — `tc('rooms_label')`, `tc('condition')`,
`tc('layout_features')` and so on. R6 threads those same expressions. **No new locale keys.**

### 2.5 Why the probe must narrow a Button, not merely wrap one — measured

`Mantine/Primitives/Button/Default` currently **passes** every cell: 724R's approved final matrix has
`FAIL ⊆ {HeroSearch × 12, NotificationBellView/mobile-390 × 4}` and `Button/Default` is absent from it.

The reason is structural. The two Buttons in that story that carry no `fullWidth` prop —
`:80-86` (leading-icon, `t('button_save_changes')`) and `:124-126` (loading, `t('button_saving')`) — are each a
direct child of `<Stack gap="xs">`, and Mantine's `Stack` defaults to `align="stretch"`, so both already occupy
their parent's full content width and resolve `true`.

**Consequence:** wrapping one of them in `role="group"` produces no before/after delta — it resolves `true` with
the skip and `true` without it, proving nothing. The probe must therefore *also* temporarily narrow the button so
that it genuinely fails, which is exactly the shape Task 711's own R7 plant used: *"added `w={100}` to the first
`MantineCountButton` instance (otherwise full-width via its `Stack` parent)"*
(`docs/sessions/2026-08-06-task711-reanchor-dead-mantine-assertions.md` §8.1).

This is a stated deviation from the owner's literal instruction ("wrap an existing non-`fullWidth` Button"),
adopted because the measurement above shows the literal form cannot produce the required proof. It changes
nothing about the constraint that matters: the probe stays fully reversible and adds no permanent markup.

### 2.6 What must NOT change: why the chip rows currently pass

The chip rows are green because of 724R's `isChipSetMember()` (`check-stories-rendered.mjs:1210-1235`) — a
DOM-measured predicate (row-wrapping flex **or** ≥2-track grid · N≥3 visible Button siblings · ≤3× median sibling
width · <80% of the row's content width). **Not** because of `role="group"`. Removing the skip must therefore move
zero cells, and R8 is how that is proven.

### 2.7 The residual §14.9.28 gap (724R review note N7)

`docs/storybook-governance.md:1907-1919` documents the median dominance rule and both rejected designs, but not
the residual sensitivity: how wide a real CTA can be and still be exempted. Worked example from the shipped
constants — a 358px row holding buttons of 200px, 100px and 90px gives a median of 100, so the 200px control
passes both `≤3× median` and `<80% of row` and **is exempted** at 56% of the row's width. Verify this arithmetic
against the shipped constants before quoting it.

---

## 3. Requirements — one active route

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §2.0/§2.1a, dirty worktree | **Re-confirm the baseline, two classes.** `git status --porcelain` + `git hash-object`. **Class A:** both `.claude/skills/*.md` match §2.0 exactly, and `src/stories/mantine/primitives/Button.stories.tsx` is **absent from status** — any difference is `stop and report`. **Class B:** record each design doc's hash as a witness; a difference is **not** a stop. Any path in neither class is unaccounted for → stop. Complete `docs/orchestrator-dirty-worktree-manifest-template.md`. Never stage, revert, restore or commit any entry. | P0 | AC1 | Confirmed |
| R2 | 724 F1, D32, §2.5 | **Probe, before-arm.** In `src/stories/mantine/primitives/Button.stories.tsx`, temporarily (a) narrow one existing non-`fullWidth` Button so it no longer fills its parent — 711 R7's `w={…}` shape — and (b) wrap that single Button in a container carrying `role="group"`. With the skip still present, run `--mantine-only` unpiped: the `Button/Default` cells must resolve **`true`**. That captured `true` is the defect. | P0 | AC2 | Confirmed |
| R3 | 711 F1, 724 F1 | **Remove the exclusion.** Delete `check-stories-rendered.mjs:1238`'s `[role="group"]` line and the now-false button-group paragraph at `:1160-1164`. Do **not** substitute another selector, attribute, class or allowlist. | P0 | AC3 | Confirmed |
| R4 | R2, D32 | **Probe, after-arm.** With the probe unchanged and the skip gone, re-run `--mantine-only` unpiped: the same cells must now resolve **`false`** and name the planted button. Both transcripts persisted. | P0 | AC4 | Confirmed |
| R5 | permanent-story gate | **Restore the probe file byte-identical to `HEAD`** — `a2279cd137a31643be9c883e9bebae3a405544ac`. After §2.1a's removal `HEAD` *is* the clean pre-task state, so this is both correct and permitted; the prior draft's ban on `HEAD` was an artifact of its mis-attribution. Prove with `git hash-object` and by the path's absence from `git status` before any final verification runs. **No permanent Storybook markup ships from this task.** | P0 | AC5 | Confirmed |
| R6 | 724R N1, cl. 3, cl. 7 | **Named group restored.** `FilterMultiToggle` and `FilterRoomsRow` render `role="group"` **only when an accessible name is supplied**, never unconditionally, and render no `aria-label` when unnamed. Thread the name at all **7** `ListingsFilters` sites from each site's own `AccordionSection` title (§2.4). `FiltersPanel`'s 6 existing `ariaLabel` props and the property-type `SimpleGrid` keep their current values and become effective. | P0 | AC6 | Confirmed |
| R7 | 724R N1 | **No unnamed ARIA group, no inert `aria-label`.** After R6, `git grep -n 'role="group"' -- src/` accounts for every hit; state all 12 + 1 consumer sites with post-change state. | P0 | AC7 | Confirmed |
| R8 | R3, §2.6 | **Zero cell delta.** Final `--mantine-only` with the probe removed: **1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS, exit 1**, `FAIL ⊆ {HeroSearch × 12, NotificationBellView/mobile-390 × 4}` — byte-identical to 724R's approved bound. Any movement is a regression: **report it, do not absorb it**. | P0 | AC8 | Confirmed |
| R9 | 724R N7 | **Document the median sensitivity** in `docs/storybook-governance.md` §14.9.28 with a worked numeric example (§2.7), arithmetic re-verified against the shipped constants first. | P2 | AC9 | Confirmed |
| R10a | scope | **Whole-file zero diff, `git hash-object` verifiable.** `scripts/check-assertion-liveness.mjs` · `scripts/assertion-liveness-registry.json` · `scripts/check-click-shield.mjs` · `package.json` · `.github/workflows/governance-pr.yml` · `src/components/ui/input-group.tsx` · `src/modules/cabinet/components/ListingsTab.tsx` · `src/modules/listings/components/FavoritesTypeFilter.tsx` · `src/modules/notifications/components/NotificationCenter.tsx` · both `.claude/skills/*.md`. Quote each comparison. | P0 | AC10a | Confirmed |
| R10b | scope | **In-file regions of `scripts/check-stories-rendered.mjs` — verified by diff inspection, NOT by hash.** That file is the one R3 deliberately edits, so `git hash-object` cannot verify anything inside it. Instead assert that `git diff -- scripts/check-stories-rendered.mjs` contains **exactly six deleted lines and zero added lines**: the one-line selector `if (el.closest('[role="group"]')) continue;` at `:1238`, and the five-line button-group comment paragraph at `:1160-1164`. Then confirm by targeted read that `isChipSetMember`'s body and its three thresholds are unchanged, `FULL_WIDTH_TOLERANCE` still reads `= 8`, and assertion (c) `fullWidthControlsAtMobile` (`:1145`) and `MANTINE_VIEWPORTS` are untouched. Note these are **different** assertions: R3 edits (d) `fullWidthButtonsAtMobile` (`:1253`); (c) is protected. | P0 | AC10b | Confirmed |
| R11 | cl. 9 | `npx tsc --noEmit` 0 errors and `npm run build` exit **0**, transcripts with the exit code **inside** the file, under `.screenshots/task726-evidence/`. | P0 | AC11 | Confirmed |
| R12 | cl. 7 | `check:i18n` exits 0 with **no new keys**. A perceived need for one is a stop-and-report (§2.4 shows the names exist). | P1 | AC12 | Confirmed |
| R13 | cl. 14, `ai-behavior.md` 5a | Counting gates in two passes, the final one **after the session log and `docs/backlog.md` exist**, reconciled to `git status` with a correct composition. Both transcripts persisted. | P1 | AC13 | Confirmed |
| R14 | existing coverage | `npx vitest run src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` stays green, extended with one arm asserting no `role` renders unnamed and one asserting `role="group"` + `aria-label` render when named. | P1 | AC14 | Confirmed |

---

## 4. Correction record — four superseded instructions, all the orchestrator's

1. **`docs/backlog.md`'s 726 row (2026-08-07)** prescribed swapping the selector to `.mantine-ButtonGroup-root`.
   Superseded: a blind swap would create a second exclusion with zero live matches — the same untested-exclusion
   property that made 711's original sound defensible and 724's exploitation possible.
2. **This kickoff's first draft** replaced the swap with an unconditional delete justified by "nothing matches".
   The owner challenged it: *we have stories with buttons, why not use the stories?* He was right —
   `Button.stories.tsx` renders every Button variant except `Button.Group`, so "zero live matches" measured a hole
   in our own story coverage, not the design system.
3. **This kickoff's second draft** over-corrected into `R1a`: a **permanent** `Button.Group` arm added to
   `Button.stories.tsx` purely to manufacture DOM evidence for a gate decision. The owner rejected it, and the
   rule was already written: the permanent-Storybook gate in `.claude/skills/create-task/SKILL.md` states that
   *"the absence of an API-specific story … is not by itself authorization to add markup"* and that markup
   existing only to exercise a selector or gate *"is a probe, not a permanent Storybook artifact."* A permanent
   addition requires a named in-scope production consumer or quoted owner authorization for independent canonical
   coverage. **Neither exists here** (§2.2), so the correct disposition is a reversible probe — which is what R2
   and R5 now specify.

4. **This kickoff's third draft — a different kind of error.** It labelled the `Button.Group` hunk in
   `Button.stories.tsx` as `Owner — pre-existing user change. Do not touch`, and built R5's restore comparator
   around that hash. The label was never verified: the hunk carries its own comment
   `{/* ── Button.Group — role="group" grouped controls (Task 726 R1a) ── */}`, naming the rejected draft-2
   requirement that produced it. The orchestrator asserted a provenance it had not read, attributed agent output
   to the owner, and thereby made AC5 unsatisfiable — restoring to that hash would have permanently shipped the
   banned markup, while restoring to `HEAD` was forbidden by its own R5.

   Items 1–3 were design judgements corrected by argument. This one was a **fabricated fact**, and the artifact
   had been labelled by its own author the whole time. §2.1a now states the provenance, and §2.0's Class A
   requires the path to be absent rather than restored.

**The rule this restores.** A gate decision is proven by a reversible probe in an inspected existing story, not by
shipping UI the product does not use. Permanent Storybook markup documents a production consumer or an
owner-approved coverage requirement — never a measurement the orchestrator wanted.

---

## 5. Assumptions and open questions

- **A1 — the worktree starts dirty**, with the Class-A and Class-B entries §2.0 enumerates; two Class-A entries
  are owner-authored skill files. R1 re-confirms them; nothing there is staged, reverted or committed.
- **A2 — `role="group"` is the correct role for the chip rows.** A multi-select toggle set is a group of controls
  — not `radiogroup` (multi-select) and not `toolbar`. `ListingsTab.tsx:171` and `FavoritesTypeFilter.tsx:31`
  already use exactly this pattern with a name, so it is the established convention here, not a new choice.
- **A3 — no owner decision is outstanding.** Both halves close review findings the owner has already seen, and
  the story-authorization question is settled by *not* creating a story.
- **A4 — no critical-flow registry entry covers this surface.** Confirm at J1 against
  `docs/critical-flow-registry.md`; if one exists, R14's coverage requirement escalates and you stop to report.

---

## 6. Pre-read rule bundle

**Always:** `docs/agent-contract.md` (cl. 1, 3, 7, 9, 11, 13, 14) · `docs/rule-index.md` · `docs/qa-profiles.md` ·
`docs/backlog.md`.

**Because a blocking gate changes:** `docs/storybook-governance.md` §14.9.27 (711's re-anchor) and §14.9.28
(724R's chip-set predicate — you amend this, you do not tune it) · `docs/orchestrator-ui-task-design.md`.

**Because shipped ARIA changes:** `docs/component-rules.md` · `docs/ui-rules.md`.

**Because a story is probed:** the permanent-Storybook sections of `.claude/skills/execute-task/SKILL.md`
(start-gate item 6) — read before touching `Button.stories.tsx`.

**Task-specific:**

- `scripts/check-stories-rendered.mjs` — `:1160-1164` (711's justification comment, deleted with the code) ·
  `:1176-1235` (`isChipSetMember`, **do not edit**) · `:1238` (the line R3 deletes) · `:473`
  (`FULL_WIDTH_TOLERANCE`, do not edit).
- `docs/sessions/2026-08-06-task711-reanchor-dead-mantine-assertions.md` §8 — the plant/restore precedent R2 follows.
- `Sprint_53_kickoff_prompt_Task_724R_FullWidthButtons_Revision.md` §2.1 — the F1 finding this closes.
- `docs/sessions/2026-08-07-task724R-fullwidth-buttons-revision.md` §J7 — the 12-site consumer audit you update.
- `src/modules/listings/components/ListingsFilters.tsx` — the 7 sites and their `AccordionSection` titles.

---

## 7. Scope

- `scripts/check-stories-rendered.mjs` — **R3 only**: delete `:1238` and the `:1160-1164` paragraph.
- `src/stories/mantine/primitives/Button.stories.tsx` — **R2's reversible probe only**, restored byte-identical
  by R5. **Not a permanent change; it must not appear in the final diff.**
- `src/components/shared/FilterMultiToggle.tsx`, `FilterRoomsRow.tsx` — R6's conditional role.
- `src/modules/listings/components/ListingsFilters.tsx` — R6, the 7 names.
- `src/components/shared/FiltersPanel.tsx` — only if R6's conditional shape requires a prop rename.
- `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` — R14's two arms.
- `docs/storybook-governance.md` — §14.9.28 amendment (R9) and the R2–R5 probe record.
- `docs/backlog.md` and `docs/sessions/2026-08-0X-task726-role-group-exclusion-and-chiprow-aria.md`.

## 8. Out of scope — zero diff

- Everything in **R10a**'s whole-file hash list, including both `.claude/skills/*.md` — owner-authored, untouchable,
  plus the in-file regions **R10b** protects.
- **Any permanent Storybook addition or extension.** No new story, no new story arm, no new `Button.Group` markup.
- `HeroSearch` (Sprint 49) · `MobileBottomNavView` (Sprint 54) · `NotificationCenter` (Task 593's 390px decision).
- Task 724R's seven correct fixes and its `isChipSetMember` predicate.
- `.github/workflows/governance-pr.yml` — Task 727 owns CI wiring.

---

## 9. Current and required behavior

**Current.** `check-stories-rendered.mjs:1238` skips any button inside `[role="group"]` — an attribute any author
can apply to any container, with no legitimate live match anywhere in the codebase. The two chip-row leaf
components render `aria-label` on a role-less `<div>`, which ARIA 1.2 prohibits and no assistive technology
exposes; all 7 production call sites pass no name, so the `/listings` filter chip rows are unnamed button groups.

**Required after.** No attribute a developer can hand-apply makes a failing button pass the full-width assertion,
proven by a probe that resolved `true` before the removal and `false` after it. The chip rows announce as named
groups on `/listings` and in `FiltersPanel`, and never render a role without a name. Not one matrix cell moves.
`Button.stories.tsx` is byte-identical to its pre-task state.

### Implementation sequence

- **J1 — R1.** `git status --porcelain` + `git hash-object` for every listed entry; complete the dirty-worktree
  manifest; confirm §2.0. Confirm §2.2 and §2.3 yourself. Record content witnesses for every R10a path.
- **J2 — R2.** Apply the probe (narrow + `role="group"` wrapper) to `Button.stories.tsx`. Rebuild Storybook. Run
  `--mantine-only` unpiped. Cells must read **`true`**.
- **J3 — R3.** Delete `:1238` and the stale comment paragraph.
- **J4 — R4.** Rebuild Storybook. Re-run `--mantine-only` unpiped. Cells must read **`false`**, button named.
- **J5 — R5.** Revert the probe. `git hash-object` must equal `HEAD`'s `a2279cd137a31643be9c883e9bebae3a405544ac`,
  and `git status --porcelain -- src/stories/mantine/primitives/Button.stories.tsx` must be empty.
- **J6 — R6.** Conditional role in both leaf components; thread the 7 names in `ListingsFilters`.
- **J7 — R7.** `git grep` audit; state all 13 sites.
- **J8 — R14.** Extend and run the smoke test.
- **J9 — R8.** Rebuild Storybook (probe-free). Final `--mantine-only`, unpiped, every residual cell named.
- **J10 — R9.** Amend §14.9.28 after re-verifying §2.7's arithmetic.
- **J11 — R12, R11.** `check:i18n`, then `npx tsc --noEmit`, then `npm run build`.
- **J12 — R13.** Session log and backlog, **then** the final counting-gate pass. In that order.

---

## 10. Implementation requirements

1. **No permanent Storybook markup.** `Button.stories.tsx` is a probe surface only and must be absent from the
   final diff. If you believe permanent coverage is needed, that is `STORY CREATION AUTHORIZATION REQUIRED` —
   stop and report.
2. **Never substitute another selector for the deleted skip.** If you believe an exclusion is required, stop and
   report with the measured case that requires it.
3. **Do not touch `isChipSetMember` or its three thresholds.** R9 documents them; it does not tune them.
4. **Never widen `FULL_WIDTH_TOLERANCE`** (owner, Task 607 review, 2026-07-15).
5. **The role is conditional on the name inside the component** — not a convention callers are trusted to follow.
6. **No new locale keys** (§2.4). A perceived need is a stop-and-report.
7. **Restore `Button.stories.tsx` to `HEAD`** (`a2279cd137a31643be9c883e9bebae3a405544ac`) and confirm the path is
   absent from `git status`. That is its canonical clean state once §2.1a's agent-created hunk is gone.
8. **Never stage, revert, restore or commit any pre-existing worktree entry**, especially the two skill files.
9. **Every transcript unpiped** (711 F2 — a truncated or piped transcript is a failed AC).
10. **No task number in any code identifier.** Comments may cite; identifiers may not.
11. **Counting gates last** — after the session log and backlog exist. The 724R review broke this twice.
12. **Never run, emit, suggest or delegate a mutating git command**, including any form of `git push`.
13. **Status must be** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`.

---

## 11. Positive and negative flows

**Positive flow:** the baseline is re-confirmed by hash → the probe makes a real violation invisible via
`role="group"` and the cell reads `true` → the skip is deleted → the same cell reads `false` and names the button
→ the probe is reverted byte-identical → the chip rows get a named `role="group"` at all 7 production sites → the
final matrix is unchanged → build exits 0.

| Branch | Applicable? | Owner / source | Expected behavior | Evidence |
|---|---:|---|---|---|
| A **Class-A** entry differs at J1 (either skill hash, or the probe path back in `git status`) | **Yes** | R1 | **Stop and report** — baseline moved; do not proceed | AC1 |
| A **Class-B** design doc differs at J1 | **Yes** | R1 | **Not a stop.** Record the new hash as the witness and continue | AC1 |
| A `git status` path belongs to neither class | **Yes** | R1 | **Stop and report** — unaccounted-for change | AC1 |
| R2's before-arm reads `false` | **Yes** | R2 | The probe is not being skipped — check the wrapper is an ancestor and N<3 so `isChipSetMember` cannot apply; fix the probe, do not proceed | AC2 |
| R4's after-arm still reads `true` | **Yes** | R4 | The deletion did not take effect — **stop**, do not paper over | AC4 |
| A real production Mantine `Button.Group` consumer is found | **Yes** | §2.2 | **Stop and report** as a scope/owner-decision issue. **Do not add a story to resolve it.** | AC3 |
| `Button.stories.tsx` hash ≠ `HEAD` after revert, or the path is back in `git status` | **Yes** | R5 | **Stop** — no final verification runs against a polluted story file | AC5 |
| A caller cannot supply a name | **Yes** | R6 | The role must not render for that caller — no unnamed group ever ships | AC6, AC7 |
| An `AccordionSection` title is missing at a site | **Yes** | R6 | Stop and report — do not invent a key (§2.4 says all 7 have one) | AC6, AC12 |
| A matrix cell moves | **Yes** | R8 | **Report it**; do not absorb it into a new bound | AC8 |
| Smoke test fails after the role change | **Yes** | R14 | Fix the component or the expectation, and say which and why | AC14 |
| RLS / data access / auth | **No** | ARIA + a Storybook gate; no data path is touched | N/A | — |
| Responsive/visual chrome change | **No** | R6 adds an attribute only; no class, style or layout change | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1]** Given `git status --porcelain` and `git hash-object` at J1, then both Class-A skill hashes equal §2.0, `Button.stories.tsx` is absent from status, every Class-B hash is recorded as a witness without halting, no path is unaccounted for, the manifest is completed, and no entry was staged, reverted or committed.
- **AC2 [R2]** Given the probe applied and the skip still present, when `--mantine-only` runs unpiped, then the
  `Button/Default` cells resolve **`true`**; the transcript is persisted and the probe's exact diff is quoted.
- **AC3 [R3]** Given the final `scripts/check-stories-rendered.mjs`, then `:1238`'s `[role="group"]` line and the
  `:1160-1164` button-group paragraph are absent, and no substitute selector, attribute, class or allowlist was
  introduced anywhere in the diff.
- **AC4 [R4]** Given the same probe and the skip removed, when `--mantine-only` runs unpiped, then the same cells
  resolve **`false`** and name the planted button; the transcript is persisted.
- **AC5 [R5]** Given `git hash-object src/stories/mantine/primitives/Button.stories.tsx` after revert, then it equals
  `a2279cd137a31643be9c883e9bebae3a405544ac`, the path is absent from `git status --porcelain`, it is absent from the
  final `git diff`, and no permanent Storybook markup appears anywhere in the diff.
- **AC6 [R6]** Given `FilterMultiToggle` / `FilterRoomsRow` rendered without a name, then no `role` and no
  `aria-label` attribute appears; given a name, then both appear. All 7 `ListingsFilters` sites pass a name
  sourced from their own `AccordionSection` title, quoted per site.
- **AC7 [R7]** Given `git grep -n 'role="group"' -- src/`, then every hit is listed with owner and named state,
  and no `aria-label` remains on a role-less container in either leaf component.
- **AC8 [R8]** Given the final probe-free matrix, then it reads **1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS, exit 1**,
  `FAIL ⊆ {HeroSearch × 12, NotificationBellView/mobile-390 × 4}`, every residual cell named.
- **AC9 [R9]** §14.9.28 states the residual sensitivity with a worked numeric example whose arithmetic is
  verified against the shipped constants and quoted.
- **AC10a [R10a]** `git hash-object` vs the J1 witness for all ten listed whole files; all identical, each comparison
  quoted; both `.claude/skills/*.md` unchanged.
- **AC10b [R10b]** `git diff -- scripts/check-stories-rendered.mjs` shows **exactly six deleted lines and zero added
  lines** — the one-line `:1238` selector plus the five-line `:1160-1164` comment paragraph;
  `isChipSetMember` and its three thresholds, `FULL_WIDTH_TOLERANCE = 8`, `fullWidthControlsAtMobile` and
  `MANTINE_VIEWPORTS` are quoted unchanged from the post-edit file.
- **AC11 [R11]** `npx tsc --noEmit` 0 errors; `npm run build` exit **0**, code inside the transcript.
- **AC12 [R12]** `check:i18n` exits 0, identical key sets across all four locales, **no key added**.
- **AC13 [R13]** Two counting-gate passes, the final after the session log and backlog exist; composition
  reconciles to `git status --short`; both transcripts persisted.
- **AC14 [R14]** The smoke test passes with both new arms.

---

## 13. QA profile and verification plan

**Profile: `Q4` Release/Critical Flow.** Three independently sufficient reasons: a hard-blocking CI gate's
exclusion logic changes; shipped ARIA changes on a production surface in four locales; and a planted-violation
clause that only Q4 owns. AC2/AC4/AC8 evidence is entirely rendered.

| # | Exact command | Expected |
|---:|---|---|
| 1 | `git status --porcelain` · `git hash-object <path>` per entry (J1) | Class A matches §2.0, `Button.stories.tsx` absent; Class B recorded; manifest completed |
| 2 | `git grep -n 'Button\.Group\|ButtonGroup' -- src/` · `git grep -n 'role="group"' -- src/` (J1) | §2.2 / §2.3 confirmed independently |
| 3 | `npm run build-storybook` then `npm run screenshots:assert -- --mantine-only` (J2, probe in, skip in) | `Button/Default` cells **`true`** |
| 4 | `npm run build-storybook` then `npm run screenshots:assert -- --mantine-only` (J4, probe in, skip out) | same cells **`false`**, planted button named |
| 5 | `git hash-object src/stories/mantine/primitives/Button.stories.tsx` · `git status --porcelain -- src/stories/mantine/primitives/Button.stories.tsx` (J5) | `a2279cd137a31643be9c883e9bebae3a405544ac`; empty status |
| 6 | `git grep -n 'role="group"' -- src/` (J7) | all 13 sites named and accounted for |
| 7 | `npx vitest run src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` (J8) | exit 0, incl. both new arms |
| 8 | `npm run build-storybook` then **`npm run screenshots:assert -- --mantine-only`** (J9, final, probe-free) | **1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS, exit 1 — unchanged** |
| 9 | `npm run check:i18n` | exit 0, no new keys |
| 10 | `npx tsc --noEmit` | 0 errors |
| 11 | **`npm run build`** | **exit 0 — hard gate** |
| 12 | `npm run check:file-integrity` then `npm run check:mojibake` — pass 2, genuinely last | exit 0 each; file-integrity count == `git status --porcelain` entry count |

Capture every transcript unpiped: redirect to a file under `.screenshots/task726-evidence/`, then append
`EXIT_CODE=$LASTEXITCODE` as its own separate statement into that same file (`execute-task` SKILL §3a).

A failed or unrun step 11 permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`. An unrunnable harness is `BLOCKED`.
Evidence under `.screenshots/task726-evidence/` (local-only, **D6**). **Name every artifact.**

---

## 14. Completion report contract

Write `docs/sessions/2026-08-0X-task726-role-group-exclusion-and-chiprow-aria.md` containing:

1. **Files changed** — table matching the real `git diff --stat`, reconciled to the J1 manifest.
   `Button.stories.tsx` must **not** appear.
2. **R1–R14**, each with its AC verdict.
3. **The J1 dirty-worktree manifest** — every Class-A and Class-B entry with start and end hashes, plus the
   confirmation that `Button.stories.tsx` was absent from status at J1.
4. **The probe record** — its exact temporary diff, both transcripts, and the revert hash proof.
5. **The R6 site table** — all 7 `ListingsFilters` sites with the exact name expression used.
6. **The R7 audit** — all 13 `role="group"` sites, post-change state.
7. **The final matrix** — exit code as-is, every residual cell named, compared to 724R's bound.
8. **Commands and actual exit codes**, including the step-11 build transcript.
9. **Evidence locations**, every artifact named.
10. **Counting gates — both passes**, composition reconciled to `git status`.
11. **Standing findings not acted on** — 721 · 722 · 717 · 727 · 728 · 729 · `HeroSearch` (Sprint 49).
12. **Assumptions, deviations, limitations, unresolved issues.**
13. Concise state in `docs/backlog.md`; flag `BACKLOG LIMIT BREACH` if you cannot hold the line count.

---

## 15. Task quality gate

| Check | Status |
|---|---|
| A fresh Sonnet session can execute this with no hidden chat context | ✅ every file, line, hash, count and quote in §2 was read from the repository while writing this; the ordering constraint is in the header and §9 |
| Every primary requirement has a binary AC and a verification method | ✅ R1–R14 → AC1–AC14 → §13 steps 1–12 |
| Scope protects existing behavior and names what must not change | ✅ §8 + R10a's whole-file hash list + R10b's in-file diff bound + "do not touch `isChipSetMember`" + both skill files marked untouchable |
| **Permanent-Storybook creation gate** | ✅ **PASSES BY CONSTRUCTION — the task adds no permanent story markup.** §2.2 records the inspected candidate (`Button.stories.tsx`, all variants) and why no permanent addition is authorized: no in-scope production consumer, no quoted owner authorization. Disposition is **probe**, not `create canonical` or `extend`. R5 + AC5 + §10.1 + §8 enforce reversibility by hash |
| **No number is asserted that was not measured with the real tool** | ✅ 6 worktree hashes from `git hash-object` · 4 `role="group"` hits · 3 `ButtonGroup` hits, all shadcn · 7 + 5 + 6 consumer sites · 1146/1184/16/22 from 724R's approved transcript · §2.5's `Stack`/`align=stretch` reason read from the story source and cross-checked against the matrix |
| **A claim that could NOT be measured is marked as such** | ✅ §2.7's example flagged for arithmetic re-verification; A4's critical-flow claim flagged for J1 confirmation; §2.2 marked as context that authorizes nothing |
| **A prior task's summary was checked, not inherited** | ✅ §2.5 re-derives why `Button/Default` passes from the story source rather than trusting the matrix summary; §2.3 re-greps rather than reusing 724R's J7 table |
| The gate proves the changed behavior, not merely procedure | ✅ R2/R4 are the same probe measured across the exact one-line change, on a control `isChipSetMember` cannot absorb (N<3) |
| No new blind spot is created silently | ✅ R3 forbids substitution; §11 makes six conditions stop-and-report; R8 makes any cell movement a report |
| Zero/empty input covered | ✅ AC6 has an unnamed arm; AC12 has a no-new-keys arm; §11 covers both probe arms failing |
| Every checkpoint names producer, output, comparator, failure behavior | ✅ §13 + J2's captured `true` as J4's comparator + §2.0's hashes as R1/R5's comparator |
| Ordering/dependency stated | ✅ header + J2 precedes J3 precedes J4 (**D32**) + J5 precedes J9 + R3 precedes R6 + J12's gates genuinely last |
| **Dirty worktree** | ✅ §2.0 splits Class A (frozen, stop-on-change) from Class B (mutable design docs, recorded not enforced) — an orchestrator correction based on the review findings; the prior draft's single class halted on files the orchestrator itself had edited. R5 restores to `HEAD`, which §2.1a makes correct |
| **Completed contract and ledger exist as named files** | ✅ `Sprint_53_Task_726_execution_contract.md` (12-checkpoint matrix, dynamic-count formula with its zero case, counterexample trace) and `Sprint_53_Task_726_rule_compliance_ledger.md` (21 rows, every one `COMPLIANT` or source-based `NOT APPLICABLE`) |
| **Verification plan uses exact executable commands** | ✅ §13's 12 steps are full `npm run` / `npx` / `git` invocations with real paths; no abbreviations |
| Owner exceptions have traceable authorization | ✅ Task 607 review 2026-07-15 (tolerance) · Task 593 2026-07-14 (`NotificationCenter`) · D6 · owner scope direction 2026-08-07 (this revision). **No story-creation authorization is claimed, because none is needed** |
| Exactly one active executable route | ✅ probe → remove → re-measure → restore → ship the ARIA fix. Six stop-and-report branches, no elections, no forks |
| Prior-review corrections folded in | ✅ 711 F1 · 724 F1 · 724R N1/N2/N7 are the content; 711 F2 → requirement 9; 711 R7's plant shape → R2; the 724R counting-gate ordering failure → requirement 11; §4 records all four superseded orchestrator instructions, including the fabricated-provenance one |
| Sprint assigned before creation | ✅ Sprint 53, open; this is its third task and closes it |

**Remaining ambiguous or conflicting requirements: none.**
**Owner decisions still needed: none — approved 2026-08-07.** Two conditions remain stops at execution time rather
than open decisions now: a discovered production `Button.Group` consumer (§2.2), and a perceived need for a new
locale key (R12).
