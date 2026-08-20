# Task 752 — REWORK (Sprint 60): filter button label centering

> **Executor:** Sonnet. **Read this file directly.** This is a SCOPED REWORK of the already-implemented
> Task 752 — do NOT re-do the task. Every other migration in 752 is CORRECT and stays: the icon `size`
> props, `Group`/`Stack` swaps, `PhoneField`'s `align="stretch"` fix, `UserMenu`'s `Text truncate`, the
> `style={{ flex: 1, minWidth: 0 }}` replacements. Fix ONLY the item below.
> If anything is ambiguous, STOP and ASK the orchestrator (agent-contract clause 2).
>
> **Base kickoff:** `tasks/Sprints/Sprint_60_kickoff_prompt_Task_752_Icon_And_Small_Layout_Utilities.md`
> (all original rules still apply, D28 above all).
> **Base session log:** `docs/sessions/2026-08-16-task752-icon-and-small-layout-utilities.md`
> **Source:** orchestrator review 2026-08-17, finding P1. Not visible from the session log — found in the
> real cascade, reproduced with a rendered harness.

## Pre-read (load ONLY these)

- `docs/agent-contract.md` (clauses 1, 2, 9)
- The base kickoff and base session log above
- `src/components/shared/FilterMultiToggle.tsx` (the only product file this rework edits)
- `src/components/layout/HeaderView.tsx:104` — the Task 629 cascade note that explains the defect

## The defect

`FilterMultiToggle.tsx` builds one shared `buttons` array used by both the horizontal (`Group`) and the
vertical (`Stack`) branch. That array carries `justify="flex-start"`, introduced as a 1:1 replacement for
the pre-migration `className="justify-start text-left"`.

**The two Tailwind classes it replaced were inert.** Neither ever rendered:

- `justify-start` sat on the Button **root**, which Mantine renders `display: inline-block`
  (`node_modules/@mantine/core/styles/Button.css`, `.m_77c9d27d`). `justify-content` does nothing there.
  The live declaration is `justify-content: var(--button-justify, center)` on the **inner** element
  (`.m_80f1301b`, Button.css:125).
- `text-left` lost to Mantine's unlayered `text-align: center` on the same root. Mantine's CSS ships with
  no `@layer` wrapper, so it beats any Tailwind `@layer utilities` class regardless of source order —
  documented in this repo at `HeaderView.tsx:104` (Task 629).

`justify="flex-start"` is **not** inert: it sets `--button-justify`, which the inner consumes. In the
horizontal branch the button is intrinsic-width, so the change is invisible — this is why the
`FilterControls` story matched MD5 and the regression got through. In the vertical branch the buttons are
full-width (`Stack` → `align-items: stretch`), so the label moved from centered to left-aligned.

**Measured** (real `@mantine/core/styles.css` + this project's `theme.ts` Button `styles`, uk label
"Потребує капітального ремонту", 276px container): label inset from the button's left edge
**35.1px → 19px**; inner `justify-content` **center → flex-start**. Button box and label box unchanged.

**Live surfaces affected:** `src/modules/listings/components/ListingsFilters.tsx:243, 316, 330` — the
Condition, Offer type and Purchase conditions groups in the mobile filters drawer. Three call sites, all
passing `className="flex-col gap-1.5"`.

**Owner decision (2026-08-17):** filter chip and button labels are centered. That was the real
pre-migration render and it is the wanted behavior. The rework restores it; it does not "fix" the original
author's unrealised left-align intent.

## Required fix

Delete `justify="flex-start"` from the `Button` in the shared `buttons` array in
`src/components/shared/FilterMultiToggle.tsx`. Substitute nothing — `center` is Mantine's own default, so
removing the prop leaves `--button-justify` unset and restores the exact pre-migration render in both
branches.

That is the entire product change. One prop, one file.

## Preserve exactly — do not touch

- `PhoneField.tsx`'s `align="stretch"` — a correct fix for a real regression. It stays.
- The `.flex-wrap` compatibility anchors on `FilterMultiToggle` and `FilterRoomsRow`. They are a separate
  orchestrator finding with its own follow-up; changing them here is out of scope in either direction.
- The `className?.includes('flex-col')` branch condition and both branches' structure.
- `role="group"` / `aria-label` on both roots, and `className` passthrough to `FilterMultiToggle`'s root.
- Every other file 752 changed. This rework does not revisit them.

## Scope extension (authorized here, overrides base AC5)

The vertical branch has no Storybook coverage — that gap is why the defect shipped. You **may** add a
vertical fixture to `src/stories/mantine/primitives/FilterControls.stories.tsx` (an arg or a second demo
component reusing the existing `MultiToggleDemo` with `className="flex-col gap-1.5"`). Reuse the existing
story file; do not create a new one. `src/modules/listings/components/ListingsFilters.tsx` stays untouched.

## Worktree warning

The worktree currently carries uncommitted, unreviewed work from Tasks 753, 754, 755 and 756. Do not
touch, stage, revert or "clean up" any of it. Reconcile your final `git status --porcelain` by content,
not by count.

## Positive flow

Mobile filters drawer → open the Condition group → the option buttons render full-width with their labels
horizontally centered, identical to the pre-752 render. Same for Offer type and Purchase conditions.

## Negative flows

| Branch | Applicable? | Expected |
|---|---:|---|
| Validation / RLS / offline / concurrent writer | No | No form, data or mutation touched |
| Horizontal branch (`FiltersPanel`, 6 call sites) | Yes | Byte-identical before and after this rework — the prop was invisible there |
| Long label wrapping to 2 lines (uk/sq @320) | Yes | Both lines centered; theme sets `label: { whiteSpace: 'normal' }`, so wrapping is real and must be in the evidence |
| Selected vs unselected chip (`filled`/`default`) | Yes | Unchanged in both branches |

## Acceptance criteria

- **AC1** — `justify` no longer appears in `FilterMultiToggle.tsx`. Prove with `git grep -n "justify" src/components/shared/FilterMultiToggle.tsx` returning nothing.
- **AC2** — rendered before/after evidence for the **vertical** branch at 320 / 390 / 768 / 1024 / 1440, `uk@320` mandatory, including at least one label long enough to wrap. Labels centered in the "after". **Retain the artifacts** under `docs/sessions/evidence/task752R/` — do not use a scratch directory that gets deleted.
- **AC3** — the horizontal branch is byte-identical to the current tree (MD5 or equivalent), proving the prop removal changes nothing there.
- **AC4** — `npm run typecheck`, `npm run check:design-tokens`, `npm run check:i18n`, `npm run check:mojibake`, `npm run build` all exit 0, plus `npx vitest run src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` (10 tests).
- **AC5** — `git status --porcelain` shows, beyond the pre-existing 753/754/755/756 entries: `src/components/shared/FilterMultiToggle.tsx`, optionally `src/stories/mantine/primitives/FilterControls.stories.tsx`, the retained evidence directory, `docs/backlog.md` and the rework session log. Nothing else.

## QA profile

`Q2 Standard UI`. The rendered proof is targeted: the vertical branch is the changed surface, the
horizontal branch is the no-delta control.

## Verification plan

`npm run typecheck` → targeted `vitest` → rendered vertical-branch matrix per AC2 → horizontal-branch
identity check per AC3 → `npm run check:design-tokens` → `npm run check:i18n` → `npm run check:mojibake`
→ `npm run build`.

Note that `check:design-tokens --strict` currently fails on `MantineCopyIdButton.module.css` (Task 756,
uncommitted). That is not yours. Report its exit code honestly and state that the violations are outside
this rework's scope — do not fix them, and do not claim a green gate you did not get.

## Report contract

Changed files with line numbers. The `git grep` output for AC1. Evidence paths for AC2 and AC3 —
retained, not scratch. Commands run with actual output and exit codes. Any place the render did not match
and what you did about it.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED`. Never self-approve.
