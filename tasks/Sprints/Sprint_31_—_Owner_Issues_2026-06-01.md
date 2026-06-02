# Sprint 31 — Owner-Reported Issues Batch (2026-06-01)

> **Origin:** Owner uploaded a new `issues.md` (3 issues) on 2026-06-01. Orchestrator (Opus) batched all 3
> into Sprint 31. **Owner directive: the design-system fix is priority #1; the other two are lower priority.**
>
> **Source-of-truth for each task body:** the corresponding kickoff file under
> `tasks/Sprints/Sprint_31_kickoff_prompt_Task_<NNN>_*.md`.
>
> **Numbering:** Tasks **354–356**. Last task number 353 → **356**. The Sonnet sub-task produced by the Opus
> architectural Task 356 consumes the next free number **≥ 357** (assigned when the Opus session writes the
> sub-task file).
>
> **Single-writer git (Cowork + Windows):** Opus does NOT run mutating git. The owner runs every git command
> the orchestrator emits, from PowerShell. See `docs/orchestrator-role.md` → "Environment & git safety" +
> "Orchestrator-owned commit emission (Task 264)".

## Sprint goal

Convert 3 owner-reported items from the 2026-06-01 `issues.md` into ready kickoff files — **2 direct Sonnet
tasks** (1 design-system hardening + 1 listing-status bugfix) and **1 Opus architectural task** (produces a
contract + one Sonnet sub-task in a later session). Every kickoff carries the hard contract + the mandatory
Positive-flow / Negative-flow sections (Task 255 rule).

## Task inventory (2 Sonnet + 1 Opus = 3)

| # | Type | Priority | Title | Kickoff file |
|---|---|---|---|---|
| 354 | Sonnet | **CRITICAL (owner #1)** | Admin DS primitives: overflow, row-actions & Storybook i18n hardening (AdminTable / AdminCardList / StatusChangeControl / StatusChangeHistory / Combobox/Select) | [`Sprint_31_kickoff_prompt_Task_354_AdminDSPrimitivesHardening.md`](./Sprint_31_kickoff_prompt_Task_354_AdminDSPrimitivesHardening.md) |
| 354-Fix | Sonnet | CRITICAL (owner #1) | Rendered-QA failure → global mobile-control / Storybook-localization / filter-state DS corrective | [`Sprint_31_kickoff_prompt_Task_354-Fix_RenderedStorybookMobileControlLocalizationDSContract.md`](./Sprint_31_kickoff_prompt_Task_354-Fix_RenderedStorybookMobileControlLocalizationDSContract.md) |
| 354-Fix-2 | Sonnet | **CRITICAL (owner #1, 2nd re-rejection)** | Canonical AdminTable column MENU (sort A→Z/Z→A, date Newest/Oldest + Hide column) + Columns visibility manager + single global search; REMOVE row-filter chips; ⇅ icon < font; scenario-named stories (no per-width/proof); Docs shows canonical table | [`Sprint_31_kickoff_prompt_Task_354-Fix-2_AdminTableCanonicalFilteringConsolidation.md`](./Sprint_31_kickoff_prompt_Task_354-Fix-2_AdminTableCanonicalFilteringConsolidation.md) |
| 355 | Sonnet | high | Listing status lifecycle — owner/admin/moderator can correct Sold/Rented | [`Sprint_31_kickoff_prompt_Task_355_ListingStatusLifecycleCorrection.md`](./Sprint_31_kickoff_prompt_Task_355_ListingStatusLifecycleCorrection.md) |
| 356 | Opus | critical | Define Private → Agent account upgrade flow + produce Sonnet impl task | [`Sprint_31_kickoff_prompt_Task_356_AgentAccountUpgrade_OpusPlanning.md`](./Sprint_31_kickoff_prompt_Task_356_AgentAccountUpgrade_OpusPlanning.md) |
| 357 | Sonnet | **CRITICAL (P0 blocker)** | Repair corrupted AdminTable.stories.tsx (strip 32 063-byte NUL tail; no logic change) — unblocks 354-Fix-2 commit | [`Sprint_31_kickoff_prompt_Task_357_AdminTableStoriesCorruptionRepair.md`](./Sprint_31_kickoff_prompt_Task_357_AdminTableStoriesCorruptionRepair.md) |
| 358 | Sonnet | **CRITICAL (owner #1)** | Storybook canonicalization (ALL sections): scenario-named stories, dedup, remove per-width/proof exports + DELETE dead primitives ControlGroup & ActionBar (0 product consumers) | [`Sprint_31_kickoff_prompt_Task_358_StorybookCanonicalizationAndDeadPrimitiveRemoval.md`](./Sprint_31_kickoff_prompt_Task_358_StorybookCanonicalizationAndDeadPrimitiveRemoval.md) |
| 359 | Sonnet | **CRITICAL (owner #1)** | Global mobile control & tab contract: buttons + tab groups full-width / stacked below sm (640px); no ragged flex-wrap grids; fix tabs primitive + 6 real consumers + DS action clusters | [`Sprint_31_kickoff_prompt_Task_359_MobileControlTabFullWidthStackContract.md`](./Sprint_31_kickoff_prompt_Task_359_MobileControlTabFullWidthStackContract.md) |

**Run order (this batch):** 357 (repair, unblocks 354-Fix-2 commit) → 358 (Storybook cleanup + delete dead
primitives) → 359 (mobile control/tab full-width contract on the live consumers). 357 first; 358 before 359
so 359 does not waste effort on the soon-deleted ActionBar/ControlGroup.

## Run order (owner priority)

**1. Task 354** (design-system, owner priority #1) → **2. Task 355** (listing-status bugfix) →
**3. Task 356** (Opus planning session → emits Sonnet sub-task ≥ 357).

Task 354 is disjoint from 355/356 in file scope (admin/ui/shared primitives + stories vs listings module + admin
listings vs auth/profile), so 354 may run in parallel with the others if the owner chooses; the stated priority is
354 first.

## Cross-references

- Task 354 ↔ Task 350: 354 is the **admin-primitive** corrective slice; Task 350 layout primitive runtime files
  (PageShell/Section/PageHeader/ActionBar/FilterBar) are FROZEN for 354. Distinct surfaces.
- Task 354 ↔ Sprint 28: must NOT unfreeze Sprint 28 or migrate admin routes.
- Task 355 ↔ Task 334: must preserve the pending-listing post-save redirect fixed in Task 334; relates to Epic I
  (Listing Lifecycle and Status Rules).
- Task 356 ↔ Epic B (Auth Registration and Agent Onboarding) ↔ Task 330 (homepage agent CTA copy): the upgrade flow
  supersedes the current Private→Agent profile toggle behavior; the homepage CTA branching is in scope.

Planning session: [`docs/sessions/2026-06-01-sprint-31-formation-orchestration.md`](../../docs/sessions/2026-06-01-sprint-31-formation-orchestration.md).
