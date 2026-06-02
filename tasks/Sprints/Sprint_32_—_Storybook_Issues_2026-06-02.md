# Sprint 32 — Storybook Issues (owner 2026-06-02)

**Source:** owner-uploaded `Storybook_issues.md` (15 component sections, 2026-06-02).
**Formed by:** Opus orchestrator, 2026-06-02.
**Planning session:** `docs/sessions/2026-06-02-sprint-32-storybook-issues-formation.md` (to be written by the orchestrator on first review, optional).

## Goal

Fix every defect the owner reported while reviewing components in Storybook. The defects fall into
five buckets: canonical-primitive style/responsive, overlay/layout spacing, input validation,
settlement localization, and story-level localization/interaction hygiene. Each task below has a
**disjoint file scope** so the tasks are parallel-safe and each diff is independently reviewable.

## Owner clarifications captured (2026-06-02)

1. **Combobox multilingual settlement search** — the settlement DB holds **only Albanian (`name_al`)
   and English (`name_en`)** names (verify in `/admin/locations`). uk/it settlement names do **not**
   exist → fall back to `name_al`. No new multilingual schema is in scope; if `name_en` is missing
   from the data layer, the executor **STOPs and ASKs** (contract clause 2). → **Task 364**.
2. **ListingGrid** — bring the Storybook card to **field-parity with the live
   `ListingCard`** (`src/modules/listings/components/ListingCard.tsx`). → **Task 365**.
3. **Dialog "Docs tab" stacked dialogs** — this is a **bug**; only one dialog should be visible.
   Also fix the scroll-slider not clipping to the container. → **Task 361**.
4. **StatusChangeControl** — NOT a defect. It is the existing canonical tiered status-change
   primitive (`variant="select"` for low-stakes Inquiries; `variant="workflow"` for moderation —
   Support tickets, Listings; Epic HH Phase 2 / Task 307). The owner's question ("what kind of story
   is this / where do we use it?") is answered by adding an in-canvas purpose note + clearer docs
   description to the story. → **Task 365**.

## Tasks (run order: all parallel-safe — disjoint file scope)

| Task | Title | Primary file scope | Risk |
|---|---|---|---|
| **360** | Tabs underline style + Button responsive (full-width <640) & text-fit | `ui/tabs.tsx`(+story), `ui/button.tsx`(+story) | Global primitive — preserve all consumers |
| **361** | Sheet indentation spacing + Dialog stacking bug + scroll-slider clipping | `ui/sheet.tsx`(+story), `ui/dialog.tsx`(+story) | Global primitive — preserve all consumers |
| **362** | FilterBar alignment + responsive filter grid | `layout/FilterBar.tsx`(+story) | Layout component |
| **363** | Phone Input numeric-only validation (reject letters/symbols) | `shared/PhoneField.tsx`, `modules/auth/validations`, `ui/input.stories.tsx` | Runtime validation |
| **364** | Settlement localization: LocationCombobox sq/en + Select capitalization & i18n | `shared/LocationCombobox.tsx`, `shared/Combobox(.stories)`, `ui/select(.stories)`, `modules/locations` data | Data-access — STOP&ASK guard |
| **365** | Storybook story batch: RecentlyViewedSection, PasswordInput, PasswordRequirementsHint, AdminLayout, ListingGrid, StatusChangeControl, AdminTable badge | the listed `*.stories.tsx` (+ AdminTable badge logic if runtime) | Story-only / low risk |

### Kickoff files
- [Task 360](./Sprint_32_kickoff_prompt_Task_360.md)
- [Task 361](./Sprint_32_kickoff_prompt_Task_361.md)
- [Task 362](./Sprint_32_kickoff_prompt_Task_362.md)
- [Task 363](./Sprint_32_kickoff_prompt_Task_363.md)
- [Task 364](./Sprint_32_kickoff_prompt_Task_364.md)
- [Task 365](./Sprint_32_kickoff_prompt_Task_365.md)

## Cross-references / file-scope discipline

- No two tasks edit the same file. Each component's full set of reported issues lives in exactly one
  task to avoid merge/review collisions.
- Tasks 360 + 361 touch **canonical primitives** — every consumer must keep working (Note 14 global
  change rule + Note 20 control preservation). Tasks 358 + 359 (2026-06-02) already canonicalized the
  tab/button/sheet mobile contract; 360/361 extend that consistently, not against it.
- Task 364 is the only data-access task — if the data layer has no `name_en`, the executor STOPs and
  ASKs before inventing schema.

## Review gate (orchestrator)

Per `docs/orchestrator-role.md`: approve only after reading the real `git diff`; verify locale parity
(sq/en/uk/it), all 7 breakpoints, canonical components only, Positive + Negative flow parity, and the
§17 UI pre-flight block + "Files Changed" table in each session log. Commit commands are emitted by
the orchestrator per task at review time.
