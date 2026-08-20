# Task 756 — REWORK 3 (Sprint 60): the AddItemPanel canonical story fails the blocking mobile gate

**Sprint:** 60 · **Type:** canonical-story fix · **QA profile:** `Q1 Targeted` · **Status:** KICKOFF FILED

> **Executor:** Sonnet. **One JSX node.** This is not a re-open of Task 756's migration — that work is
> committed as `29f9b16de`, reviewed and approved, and stays exactly as it is. The defect is in the
> canonical Storybook fixture the task created, not in the component or in production.
> If anything here looks larger than one node, STOP and report (agent-contract clause 2).
>
> **Base kickoff:** `tasks/Sprints/Sprint_60_kickoff_prompt_Task_756_LocationCombobox_CopyId_CardPattern.md`
> **Base session log:** `docs/sessions/2026-08-17-task756-locationcombobox-copyidbutton-listingcardpattern.md`
> **Source:** owner-run `npm run screenshots:assert:fast`, 2026-08-18 (`.screenshots/rendered-assert/2026-08-18T12-06/`).
> Neither Task 756's own evidence nor the orchestrator review caught this — 756 proved itself with a custom
> Playwright capture and never ran the enrolled gate that governs registered stories.

## Pre-read (load ONLY these)

- `docs/agent-contract.md` (clauses 1, 2, 9)
- `docs/orchestrator-ui-review.md` — the `create canonical` clause is what this task exists to satisfy
- `src/stories/patterns/mantine/AddItemPanel.stories.tsx` (the only file you edit)
- `src/components/shared/LocationCombobox.tsx` lines ~150-190 (the real consumer, for reference only — do not edit)

## The defect

12 failing cells, all four locales × the three mobile viewports:

```
Patterns/Mantine/AddItemPanel/Default × {sq,en,uk,it} × {mobile-320, mobile-375, mobile-390}
  ✗ text button not full-width at <640: Shto, Anulo / Add, Cancel / Додати, Скасувати / Aggiungi, Annulla
```

**Root cause.** The story's button row and the real consumer's button row are different components:

| | Button row |
|---|---|
| `AddItemPanel.stories.tsx` (canonical proof) | `<Group gap="xs">` |
| `LocationCombobox.tsx` (real consumer) | `<Flex direction={{ base: 'column', sm: 'row' }} gap="xs">` |

`Group` is a row with `align-items: center`, so its children keep their intrinsic width at every viewport.
The consumer's `Flex` becomes a column below 640px, where `align-items` is unset and the buttons stretch to
full width. **Production is correct; the canonical story is not.** The gate is right and the fixture is wrong.

**Why this is worth a task.** `docs/orchestrator-ui-review.md` requires a `create canonical` disposition to
ship a valid toolbar-reactive canonical Storybook proof; a fixture that fails a blocking §14 mobile rule is
not one. And Task 757 is instructed to consume `MantineAddItemPanel` and follow 756's decision — it will read
this story as the reference for composing children and copy a button row that is not mobile-correct into
`AuthSheet`'s add-company panel.

## Required change

In `src/stories/patterns/mantine/AddItemPanel.stories.tsx`, replace the `<Group gap="xs">` wrapping the two
`<Button>`s with the same responsive shape the real consumer uses:

```jsx
<Flex direction={{ base: 'column', sm: 'row' }} gap="xs">
```

Update the `@mantine/core` import accordingly (`Group` may become unused — remove it if so). That is the whole
product change.

While you are in the file, extend the `docs.description.component` string by one sentence stating that the
story's children mirror `LocationCombobox`'s real composition, so the next reader knows the fixture is a
faithful reference and not an arbitrary arrangement.

## Preserve exactly — do not touch

- `src/design-system/mantine/patterns/MantineAddItemPanel.tsx` — the component is correct. It owns chrome only;
  the button layout is deliberately the caller's responsibility. **Do not add layout to the component to make
  the story pass.** That would change every consumer to fix a fixture.
- `src/components/shared/LocationCombobox.tsx` — already correct, already committed.
- `scripts/mantine-migration-scope.json`, the barrel export, and everything else from 756 and 758.
- The story's `title`, `skipCanvas`/`layout` parameters, and its `storyT` i18n keys (no new keys).

## Positive flow

Storybook → `Patterns/Mantine/AddItemPanel/Default` → at 320/375/390 the Add and Cancel buttons stack and each
fills the panel's inner width; at ≥640 they sit side by side at intrinsic width. Identical to what
`LocationCombobox`'s add-location panel already renders in production.

## Negative flows

| Branch | Applicable? | Expected |
|---|---:|---|
| Validation / RLS / offline / concurrent writer | No | A Storybook fixture; no form, data or mutation |
| ≥640 desktop branch | Yes | Unchanged — `sm: 'row'` reproduces the current side-by-side arrangement |
| Long uk/sq labels at 320 | Yes | Full-width buttons make clipping less likely, not more; confirm none of the 12 cells trades one failure for another |

## Acceptance criteria

- **AC1** — the story's button row is `<Flex direction={{ base: 'column', sm: 'row' }} gap="xs">`; the report
  quotes both it and `LocationCombobox`'s line side by side to show they now match.
- **AC2** — `npm run build-storybook && npm run screenshots:assert:fast`: the 12
  `patterns-mantine-additempanel--default` cells go from **12 fail → 0 fail**. Quote the before and after
  counts from your own two runs, not from this kickoff.
- **AC3** — reconcile every other verdict change against the harness's known non-determinism. Six cells
  (`checkbox`, `navigationmenu`, `popover` ×3, `dialog`) are documented flaky — Task 758 measured them
  flipping in both directions across three runs. **Do not claim "no other cell changed"**; instead list any
  change and classify it as `known-flaky`, `explained`, or `UNEXPLAINED`. A single `UNEXPLAINED` entry fails
  this AC and needs a second run before you report.
- **AC4** — production is untouched: `git hash-object` on `MantineAddItemPanel.tsx` and `LocationCombobox.tsx`
  matches `git rev-parse HEAD:<path>` for both.
- **AC5** — `npm run typecheck`, `check:design-tokens`, `check:stories`, `check:story-coverage` and
  `npm run build` all exit 0.
- **AC6** — evidence retained under `docs/sessions/evidence/task756R3/`: both assert runs' logs and the two
  manifests. Do not use a scratch directory.

## Out of scope

Everything else in Sprint 60 · Task 757 · the `Command/MobileBottomSheet × it × mobile-320`
"form control not full-width at <640" cell, which is new as of 2026-08-18 and not yet classified — **record
whether it appears in each of your two runs** so the next task can decide if it is flaky or real, but do not
fix it here.

## Verification plan

Edit → `npm run typecheck` → `npm run build-storybook` → `npm run screenshots:assert:fast` (AC2 + AC3) →
`git hash-object` witnesses (AC4) → `check:design-tokens` → `check:stories` → `check:story-coverage` →
`npm run build`.

## Report contract

Changed file with line numbers. The two quoted button rows. Before/after cell counts for the 12 AddItemPanel
cells. The full reconciliation table for AC3. The two hash witnesses. Commands with actual output and exit
codes. Evidence paths — retained, not scratch.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED`. Never self-approve.
