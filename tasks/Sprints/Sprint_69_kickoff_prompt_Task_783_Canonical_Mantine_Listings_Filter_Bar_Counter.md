# Task 783 — canonical inline counter for ListingsFilterBar Advanced filters

**Sprint:** 69 · **Priority:** P2 · **QA profile:** **Q2 Standard UI** · **Filed:** 2026-09-03 · **State:** 🟡 REOPENED (owner, 2026-09-04) for F6 — was briefly APPROVED/ARCHIVED; F6 icon-token fix applied and gate-verified, pending repeat owner visual QA on the `CountButton` 0/1/12 rows before re-closure

> **Task-design defect corrected in review, 2026-09-04 (orchestrator, author of this kickoff).** §9 below
> originally required the `ManyActiveFilters` query to produce **12**; its own ten listed addends
> (`1+1+1+1+1+1+1+2+1+1`) sum to **11**, and `countActiveFilters(parseSearchParams(...))`
> (`filterEngine.ts:387-415`) returns **11** for that exact query — confirmed by the owner's rendered
> capture, which shows a badge reading `11`. The criterion's purpose is a **two-digit** URL-derived
> boundary proving the badge stays content-sized, in-flow and unclipped; 11 satisfies that purpose
> exactly. R4/AC4 are corrected to "two-digit (11)" below. **No eleventh filter param is to be added.**
> The literal `12` proof stays where it belongs and remains unchanged: the `CountButton` primitive
> story's fixture state (R3/AC5), which has no `filterEngine` dependency. Recorded per
> `orchestrator-procedures.md` → "When feasibility evidence contradicts a drafted acceptance criterion,
> correct the criterion and record it as a task-design defect." The executor reproduced the query
> byte-for-byte and reported the true value rather than inventing scope — the correct disposition.

---

## 1. Mode and task type

`TASK DESIGN` → implementation kickoff. **Frontend UI correction** on one existing Mantine pattern and its canonical
stories. It is not a primitive migration, a filter-engine change, or screenshot-harness work.

Executor: fresh Sonnet under `.claude/skills/execute-task/SKILL.md`. Strongest permitted outcome:
`IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`. No self-approval and no mutating git.

**No review ledger** — Sprint decision D69-3 and the standing frontend exception apply.

## 2. Objective

Replace `ListingsFilterBar`'s Advanced filters counter, which currently overlays its button through Mantine
`Indicator`, with the project’s existing canonical `MantineCountButton`. The active count must remain derived from
the real URL/filter engine and render as an in-flow `rightSection` badge inside the button.

## 3. Verified context

### 3.1 Facts

| Fact | Evidence read 2026-09-03 |
|---|---|
| The observed defect is real | Owner’s `Patterns/Mantine/ListingsFilterBar/Default` capture at 359px shows red count `3` overhanging the top-right button edge. |
| Production cause | `src/modules/listings/components/ListingsFilterBar.tsx` wraps the Advanced filters `Button` in `Indicator label={activeCount}`. Mantine’s `Indicator` is an absolute corner overlay by design. |
| Canonical answer already exists | `src/design-system/mantine/patterns/MantineCountButton.tsx` renders `count > 0` in the native Button `rightSection`; its smoke suite proves no absolute count child and no zero-count badge. |
| A standalone canonical story already exists | `src/stories/mantine/primitives/CountButton.stories.tsx` statically imports and renders the real `MantineCountButton`. |
| A real production story already exists | `src/stories/patterns/mantine/ListingsFilterBar.stories.tsx` statically imports `ListingsFilterBar`; it must remain the composition proof, not become a demo analogue. |
| Counts can be genuine story inputs | `useListingsUrlFilters` calculates `activeCount` from `parseSearchParams` + `countActiveFilters`; the story’s `nextjs.navigation.query` reaches that exact production route. |
| Existing URL behavior is protected | `listingsFilterBar.smoke.test.tsx` already proves Advanced filters calls `onFiltersOpen` and does not call `router.push`; it documents this component is absent from the critical-flow registry. |

### 3.2 Canonical-story decision record

**Reuse + extend, not create.** `MantineCountButton` already owns the required Button + inline-count contract and has
the required canonical primitive story. First extend that existing story to show the exact count boundary states
needed here; only then change `ListingsFilterBar` to consume the real source and extend the existing pattern story.
Do not create a feature-local counter, wrapper, CSS override, theme token, or a hand-built story duplicate.

## 4. Requirements

| ID | Requirement | Verification |
|---|---|---|
| R1 | The Advanced filters control consumes `MantineCountButton`, not `Indicator` or a local badge composition. | AC1–AC2 |
| R2 | Its visible count remains exactly `activeCount` from `useListingsUrlFilters`; no constant, fixture prop, or story-name branch controls production count. | AC3–AC4 |
| R3 | Canonical primitive proof comes first: the existing CountButton story visibly covers default-button count states **0**, **1**, and **12**, with the filter icon composition. | AC5 + owner visual QA |
| R4 | The real ListingsFilterBar story visibly covers URL-derived **0**, **1**, and a **two-digit (11)** active-filter state. | AC4–AC6 + owner visual QA |
| R5 | Existing Advanced filters click semantics and all filter URL semantics remain unchanged. | AC7 |
| R6 | No new user-facing strings, hardcoded dimensions, raw CSS, `circle` badge, `Indicator`, or `screenshots:assert` invocation is added. | AC2, AC8 |

## 5. Assumptions and open questions

None. The target source, the canonical primitive, the state derivation, and the production-story path were all read.
If the executor finds the primitive cannot supply the required in-flow geometry without changing its public contract,
stop and return `BLOCKED`; do not invent another counter implementation.

## 6. Pre-read rule bundle

Read before editing: `docs/agent-contract.md` clauses 1, 3, 5, 6a, 7, 9, 11–16c · `docs/rule-index.md` ·
`docs/qa-profiles.md` · `docs/qa-rules.md` · `docs/ui-rules.md` · `docs/component-rules.md` ·
`docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` ·
`docs/storybook-governance.md` · `docs/responsive-screenshot-governance.md` ·
`docs/critical-flow-registry.md` · `tasks/Sprints/Sprint_69_Listings_Finishes_The_Mantine_Migration.md`.

Then read in full: `MantineCountButton.tsx`, its smoke test and story; `ListingsFilterBar.tsx`, its smoke test and
story; `useListingsUrlFilters.ts`; `filterEngine.ts`; and the current Task 782 F13 diff. The first action is to
confirm Task 782 F13 is committed and the checkout is clean enough to isolate this diff.

## 7. Scope

**Allowed files, subject to fresh inspection:**

- `src/stories/mantine/primitives/CountButton.stories.tsx` — extend canonical 0/1/12 filter-trigger states first.
- `src/modules/listings/components/ListingsFilterBar.tsx` — replace only the Advanced filters `Indicator` composition
  with the imported `MantineCountButton`; remove stale Indicator-specific provenance comments/imports.
- `src/stories/patterns/mantine/ListingsFilterBar.stories.tsx` — real production story states with actual URL queries.
- `src/modules/listings/components/__tests__/listingsFilterBar.smoke.test.tsx` — update zero-count assertion and add
  the non-zero in-flow structural assertion while retaining the click/URL tests.
- Task 783 session/backlog/sprint status files after implementation, per the reporting contract.

## 8. Out of scope

- `MantineCountButton.tsx`, its theme contract and its smoke suite: reuse them; do not redesign them.
- All other listings components, including `ListingsSortBar`, `ListingsStatusTabs`, `ListingsShellView`, filters Drawer,
  server/API behavior, query serialization, and `filterEngine`.
- Any new primitive, icon, theme token, Tailwind/CSS override, translation key, `Indicator` allowlist, or screenshot
  classifier/harness change.
- Task 782 F13 changes. This task begins only after that distinct diff is committed.

## 9. Current and required behavior

| State | Current | Required |
|---|---|---|
| `activeCount = 0` | Button is inside a disabled `Indicator`; no visible count. | Plain canonical default `MantineCountButton`; no empty badge. |
| `activeCount = 1` | `Indicator` overlays a corner count. | One content-sized count badge inside the button’s native `rightSection`. |
| `activeCount = 11` (two-digit) | `Indicator` overlays a corner count. | Two-digit content-sized count badge inside the same in-flow `rightSection`; no clipping or overhang. |
| Click | Opens the filter Drawer and does not write the URL. | Unchanged. |

The `ManyActiveFilters` URL query is `type=sale`, `property_type=apartment`, `location_id=1`,
`price_min=100`, `price_max=200`, `area_min=30`, `area_max=90`, `rooms=2,3`, `floor_min=1`,
`premium=true`. Through the real parser/counter this is **9 scalar params × 1 + `rooms` (2 values) = 11**
— nine `!= null`/truthy scalars plus `filters.rooms.length`, per `filterEngine.ts:387-415`. ~~12~~ **11**
is the required value (see the corrected-defect note at the top of this file). Do **not** add an
eleventh param to force 12.

## 10. Implementation requirements

1. Extend `Mantine/Primitives/CountButton` first with the default-variant, sliders-icon filter-trigger composition at
   counts 0, 1, and 12. Use the real primitive and existing story translation fixture; do not add text keys.
2. In `ListingsFilterBar`, import `MantineCountButton` from the existing pattern barrel and pass its existing
   `activeCount`, responsive `w`, icon `leftSection`, test id, `type`, variant and click handler directly. Delete the
   `Indicator` wrapper/import and its now-false comments. Do not alter the surrounding Groups or width cascade.
3. Make `Patterns/Mantine/ListingsFilterBar` stateful only through its existing `nextjs.navigation.query` mechanism:
   `Default` = 0, `OneActiveFilter` = 1, `ManyActiveFilters` = the exact real value of the §9 query (**11**).
   All render the real component.
4. Update the target smoke suite so zero proves no badge and no Indicator remains; non-zero proves the count badge is
   inside `[data-testid="task775-advanced-filters"]` and no count element is absolutely positioned. Preserve T5.
5. Record only task-local evidence. Do not run, edit, cite, waive, or replace `screenshots:assert`.

## 11. Positive and negative flows

| Flow | Expected result |
|---|---|
| Open each canonical CountButton state | 0 has no badge; 1 and 12 have a readable, in-button badge to the label’s right. |
| Open each ListingsFilterBar state | Real URL parser produces its stated count (0 / 1 / 11); reset presence tracks `activeCount`; count is in-flow. |
| Click Advanced filters in test | `onFiltersOpen` is called once; `router.push` remains untouched. |
| Plant: substitute `Indicator` again | Structural test fails because an Indicator/count overlay is present. |
| Plant: replace `activeCount` with a constant | Story-state assertions fail because 0/1/11 no longer match real query-derived state. |

## 12. Acceptance criteria

| ID | Pass condition |
|---|---|
| AC1 | `ListingsFilterBar.tsx` has no `Indicator` import, JSX, or overlay compensation; it imports and uses `MantineCountButton`. |
| AC2 | The Advanced filters button retains native responsive width, icon, label, click handler and test id; the count has no `circle` or absolute positioning. |
| AC3 | The source passes exactly its existing `activeCount` to the primitive. |
| AC4 | `ListingsFilterBar` stories’ 0 / 1 / two-digit (**11**) variants produce those values through real `nextjs.navigation.query` and `filterEngine`, not a mock. |
| AC5 | The canonical CountButton story shows matching default-variant + filter-icon 0/1/12 states before the composition story is changed. |
| AC6 | All four locales render from the existing translation keys; no locale file changes are necessary. |
| AC7 | Targeted smoke tests prove zero/no-badge, non-zero/in-flow badge, no `Indicator`, and unchanged `onFiltersOpen`/no-push behavior. |
| AC8 | `npm run typecheck`, `npm run check:stories`, `npm run check:story-coverage`, targeted Vitest, `npm run build-storybook`, and `npm run build` exit 0. No `screenshots:assert` command appears in evidence. |
| AC9 | Owner completes the exact manual Storybook matrix in §13 and records `ACCEPTED` or returns findings. |

## 13. QA profile and verification plan

**Q2 Standard UI.** The task changes an existing visual composition and existing stories; it introduces or migrates no
primitive, shell, overlay system, or route behavior.

Run the static checks in §12 and inspect the exact **OWNER VISUAL QA REQUIRED** tuples:

| Story × states | Required manual review |
|---|---|
| `Mantine/Primitives/CountButton` × filter-trigger 0/1/12 | `sq`, `en`, `uk`, `it` at 320 and 1440; `en` at 359 (defect reproduction), 390, 768, 1024. |
| `Patterns/Mantine/ListingsFilterBar` × Default (0), OneActiveFilter (1), ManyActiveFilters (11) | `sq`, `en`, `uk`, `it` at 320 and 1440; `en` at 359 (defect reproduction), 390, 768, 1024. |

At each tuple, confirm that the counter is absent at zero; otherwise is inside the button and to the right of its
label; it neither overlaps the border nor clips; and controls remain readable, full width below `sm`, and aligned
with the story gutter. `uk@320` is mandatory. This matrix replaces all automated visual-status claims.

## 14. Completion report contract

Return: changed paths and why; source-to-story proof that both stories statically import real production sources;
the exact query and arithmetic proving the two-digit count (11); targeted test/gate exit codes; the owner visual-QA matrix marked
`PENDING`, `ACCEPTED`, or `RETURNED`; and `FACTS / INFERENCES / UNKNOWNS / CONFLICTS`.

Do not claim completion or approval while owner visual QA is pending. No review ledger and no git mutation.

## 15. Task quality gate

| Gate | Result at filing |
|---|---|
| Objective is one visible defect and one production control | PASS |
| Canonical primitive/source/story is identified and reused before composition | PASS |
| Real, deterministic state inputs are specified | ~~PASS~~ **FAIL at filing — corrected 2026-09-04.** The query was explicit and correct; its stated total (12) was wrong. Seventh-family recurrence of "the kickoff's own measured facts are not exempt" — this one was pure arithmetic over the kickoff's own printed addends, catchable by adding ten numbers. |
| URL/interaction behavior is protected by existing test and scope bar | PASS |
| Manual rendered proof is exact; retired harness is excluded | PASS |
| Scope expands beyond frontend composition/story/test/docs | FAIL the task |

### Evidence preflight

| Evidence needed | Existing source | Fresh evidence required |
|---|---|---|
| In-flow count mechanism | `MantineCountButton.tsx` + smoke test | Targeted test and owner rendering |
| Real 0/1/12 behavior | `filterEngine.ts` + Stories’ navigation query | Storybook owner review |
| No URL regression | `listingsFilterBar.smoke.test.tsx` T5 | Targeted Vitest run |

### Execution contract

- **Start condition:** Task 782 F13 is committed; no unrelated dirty diff is folded in.
- **Stop condition:** primitive cannot express the required UI without a new contract, real story query fails to derive
  its stated count, or manual owner QA returns a defect.
- **No silent substitution:** neither a local counter nor a screenshot-harness exception is an acceptable fallback.
