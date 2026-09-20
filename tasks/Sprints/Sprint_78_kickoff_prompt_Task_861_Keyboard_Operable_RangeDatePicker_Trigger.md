# Task 861 — `RangeDatePicker`'s trigger becomes a semantic button, so the canonical date-range picker opens from the keyboard

Sprint 78 · **P1** · QA profile **Q4** · cross-sprint prerequisite · **gates Task 846's approval and Sprint 78 Wave B** · **Status: 🔴 NEEDS REVISION (review 2, 2026-09-20) — implementation verified; F6 is fixed in this kickoff, F7 is owed. AC9's visual half accepted by the owner 2026-09-20 (§17.5), both §17.1 deltas ratified; its keyboard half still owner-owed. Re-enter at §17.2.**

Sprint plan: [`Sprint_78_…`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md). Filed by Task 846's review 1; promoted by owner decision 2026-09-20 (Option B, `Sprint_78_kickoff_prompt_Task_846_Dashboard_Header_Period_Grid.md` §16.1).

## 1. Mode and task type

`IMPLEMENTATION` — an accessibility defect fix on one shared canonical pattern and its popover host, on a registered
critical flow. Bundles: **UI / Current Mantine path** + **Storybook / Visual Proof** + **critical-flow regression**.

For `RangeDatePicker`/`MantinePopover` this is **not** a restyle: the rendered chrome must not change; only the
trigger's element type, its ARIA state and the surface's focus behaviour do. It **does** additionally carry a
Mantine migration of the bell's two popover components (R4c, §16.1) — also with no intended visual change.

## 2. Objective

A keyboard-only user can complete the entire custom-range flow on `RangeDatePicker`: open the calendar, select a
range, read validation feedback, close the surface, and land back on the trigger. Today they cannot open it at all.

Owner decision 2026-09-20, quoted verbatim in 846 §16.1:

> Task 861 is promoted as a prerequisite for final approval of Task 846. The RangeDatePicker/MantinePopover trigger
> must support a complete keyboard-only custom-range flow, including opening the picker, selecting a range, receiving
> validation feedback, closing the surface, and returning focus predictably.

## 3. Verified context — measured 2026-09-20 (re-measure at I0)

### 3.1 The defect, at source

- `src/design-system/mantine/patterns/RangeDatePicker.tsx:835-858` — the trigger is `<TextInput readOnly …>` with
  `leftSection` (`CalendarDays`), a conditional `rightSection` clear `ActionIcon` (`tabIndex={-1}`), `radius="lg"`,
  `w="100%"`, `placeholder`, and `style={{ cursor: 'pointer' }}`. **FACT.**
- `src/design-system/mantine/patterns/RangeDatePicker.tsx:860-873` — it is handed to
  `<MantinePopover trigger={trigger} fullWidthTrigger position="bottom-start">`. **FACT.**
- `src/design-system/mantine/patterns/MantinePopover.tsx:115-122` — desktop: `cloneElement(trigger, { onClick })`.
  `:137` — the `<640` path wraps the trigger in a `Box` with `onClick={() => openDrawer()}`. **Both open paths are
  `onClick` and nothing else.** **FACT.**
- Counter-check run: neither `MantinePopover.tsx` nor `RangeDatePicker.tsx` contains any `onKeyDown`, `onKeyUp` or
  `onFocus` handler. `MantinePopover.tsx:80-88` documents that `Popover.Target` in controlled mode attaches nothing
  of its own. **FACT.**
- An `input[readonly]` fires no `click` from `Enter` or `Space` (no implicit submission, and a text input is not an
  activation-behaviour element). Therefore the calendar cannot be opened without a pointer. **FACT** — this is the
  P1 defect. It violates **WCAG 2.2 SC 2.1.1 Keyboard** (owner's citation, 2026-09-20).

### 3.2 The in-repo precedent — this project already solved this, correctly, once

`src/design-system/mantine/patterns/MantineCombobox.tsx` has the same shape and **is** keyboard-operable:

- `:330-353` — its `variant="button"` trigger is also a `<TextInput readOnly>` with `onClick` only;
- `:303` — but it is wrapped in `<Combobox.Target targetType={variant === 'input' ? 'input' : 'button'}>`;
- `node_modules/@mantine/core/esm/components/Combobox/use-combobox-target-props/use-combobox-target-props.mjs:43-66`
  — when `targetType === "button"`, Mantine's own handler opens the dropdown on `Enter`, toggles on `Space`, opens on
  `ArrowDown`/`ArrowUp`, and closes on `Escape`; `:68-77` adds `aria-haspopup`, `aria-expanded`, `aria-controls`.

**FACT.** So `MantineCombobox`'s button variant is **not** defective and is **out of scope**. It is also the
reference for what "keyboard-operable trigger" means in this repo. `RangeDatePicker` is the one pattern that
composes a read-only input trigger with a popover that has no equivalent handler.

### 3.3 Clause 16d / GR-1 census — every `MantinePopover` consumer

> ⛔ **THIS CENSUS IS INCOMPLETE — corrected by review 1, §16.1 (2026-09-20). Read §16.1 before acting on it.**
> It inspected the bell's *trigger* and never censused what the bell's popover *opens*: `NotificationCenter` and
> `NotificationItem` are both **unenrolled**. They are **in 861's scope** (owner decision 2026-09-20, §16.1) and are
> migrated here — not deferred to a later task. **Story status is NOT the same for the two — see §16.8:**
> `NotificationItem` already has a direct-import Story under a non-canonical title and must be *migrated*, never
> duplicated; only `NotificationCenter` has none. The
> `NotificationBellView` row below and both receipts at the end of this section are superseded by §16.1's table.

Measured with `grep -rln "<MantinePopover" src/ --include=*.tsx`. Production renderers: **two**.

| Consumer | Trigger element passed | Keyboard-openable today | `className` | `components/ui/*` | manifest | own Story | Disposition |
|---|---|---|---|---|---|---|---|
| `RangeDatePicker.tsx:863` | `<TextInput readOnly>` — **not a button** | ❌ **no path at all** | 2 | 0 | yes | yes (`Mantine/Primitives/RangeDatePicker`) | **IN SCOPE — tier 1** |
| `NotificationBellView.tsx:29-44` | `<Indicator>` wrapping an `<ActionIcon>` | ✅ yes — `Enter` on the focused `ActionIcon` fires a real `click` that bubbles to `Indicator`'s root `div`, where `cloneElement`'s `onClick` sits | 0 | 0 | **NO — absent from `scripts/mantine-migration-scope.json`** | yes (`src/stories/mantine/primitives/NotificationBellView.stories.tsx`) | **IN SCOPE — ARIA (R4) + enrolment (R4a)** |

**Census finding, measured 2026-09-20 while writing this kickoff:** `grep -n "NotificationBellView"
scripts/mantine-migration-scope.json` returns **nothing**, while
`src/stories/mantine/primitives/NotificationBellView.stories.tsx` imports it directly. It is storied but
**unenrolled**, and `check:pattern-enrolment` cannot see it — that gate scans only
`src/design-system/mantine/patterns/` (Task 820), and this file lives in `src/modules/notifications/components/`.
**GR-2 applies: a green `check:pattern-enrolment` is not evidence about this file.** Since R4 changes it, clause 16d
puts it in scope; it is `className:0` and already storied, so enrolment is a one-line manifest addition (R4a), not a
migration. This is exactly the Task 809 shape and it is being closed here rather than passed over.

Non-production trigger sites, listed and not migrated: `__tests__/MantinePopover.smoke.test.tsx` (6×
`<button type="button">`) and `src/stories/mantine/primitives/Popover.stories.tsx` (`<Button>`). Both already pass
native buttons — **this is the measured basis for the owner's double-toggle warning in §4 R1.**

Components `RangeDatePicker` itself renders, from Task 846's census
(`docs/sessions/evidence/task846/final-census-PeriodControl.txt`): `MantineCombobox`, `MantinePopover`,
`responsiveBottomSheet` — all `tier1 manifest:yes story:yes`, none legacy, none unmigrated.

`GR-1 CENSUS COMPLETE — 8 nodes; tier1 8: 5 already migrated+enrolled+story; NotificationBellView storied-but-unenrolled (enrolled by R4a); NotificationItem unenrolled, storied under the non-canonical title 'Notifications/NotificationItem' (migrated + Story migrated to a canonical title + enrolled by R4c); NotificationCenter unenrolled with no Story at all (migrated + new Story + enrolled by R4c); tier2 0 imports removed; tier3 0 listed and filed as none.` *(corrected at review 1 — the 6-node count below was measured before the bell's popover contents were censused.)*
`GR-2 SCOPE STATED — check:pattern-enrolment inspects only src/design-system/mantine/patterns/; it cannot see src/modules/notifications/components/NotificationBellView.tsx; that gap is closed by this census and by R4a's manifest entry, not by the gate's exit code.`

### 3.4 Critical flow

`docs/critical-flow-registry.md:55` — **"Listings date-range filter"**, owner tasks 558/561/559/562. Consumers:
`src/components/shared/FiltersPanel.tsx` (homepage, batch-Apply) and
`src/modules/listings/components/ListingsFilters.tsx` (listings page, URL-immediate). Its required regression command
is quoted in §13.2. Task 846's `MantineDashboardPeriodControl` is a third consumer, not yet in production.

### 3.5 Mantine's DOM contract for the fix

`node_modules/@mantine/core/esm/components/Input/Input.mjs:144-175` renders `leftSection`, the input element
(`component: "input"` at `:159`, overridable by the `component` prop) and `rightSection` as **siblings** inside
`.mantine-Input-wrapper`. **FACT — so a `component="button"` input does not nest the clear-X `ActionIcon` inside a
`<button>`, and the fix produces no invalid button-in-button nesting.** The executor re-proves this in the rendered
DOM at AC5 rather than trusting this paragraph.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | owner 2026-09-20 | **The fix is at the trigger, not a key handler on the shared popover.** `MantinePopover.tsx` must not gain an `onKeyDown`/`onKeyUp` that opens or toggles the surface: its other trigger sites already pass native buttons (§3.3), which would then toggle twice — once from the native click and once from the key handler. `RangeDatePicker`'s trigger becomes a semantic `<button type="button">` (Mantine `InputBase`/`TextInput` with `component="button"`, or an equivalent natively keyboard-operable Mantine component), keeping the existing `.mantine-Input-input` chrome. | P0 | AC1, AC5 | Confirmed |
| **R2** | owner 2026-09-20, WCAG 2.2 SC 2.1.1 | `Enter` **and** `Space` on the focused trigger open the calendar, on the desktop popover path and the `<640` bottom-sheet path alike. No pointer event is involved. | P0 | AC1 | Confirmed |
| **R3** | WAI-ARIA dialog pattern | On open, focus moves into the surface. `Escape` closes it and returns focus to the trigger. Closing by `Apply`/`Confirm`/`Cancel` also returns focus to the trigger. Focus never lands on `document.body`. | P0 | AC2 | Confirmed |
| **R4** | owner 2026-09-20 | The trigger carries `aria-haspopup="dialog"` and an `aria-expanded` that is `true` exactly while the surface is open and `false` otherwise, on both paths. **REVISED — review 1, §16.2.** `MantinePopover` applies the two attributes **only when the trigger is a native button**; a wrapper trigger (the bell's `Indicator`) must receive neither, because they are invalid on a role-less element. The bell's own `ActionIcon` gets them via the render-function trigger (R4b) — **in this task**. | P1 | AC3, AC3b | Revised |
| **R4a** | 16d, GR-1, §3.3, owner 2026-09-20 | `NotificationBellView.tsx`, `NotificationCenter.tsx` and `NotificationItem.tsx` are **all three** added to `scripts/mantine-migration-scope.json`. The bell is already storied and `className:0`; the other two are covered by R4c. | P1 | AC3a | Confirmed |
| **R4c** | 16d, GR-1, GR-3a, owner decisions 2026-09-20 (§16.1, §16.8) | **The bell's popover contents are migrated in this task.** `NotificationCenter.tsx` loses its `className={styles.list}` **and its `NotificationCenter.module.css` (6 lines) is deleted** — a CSS module is not a canonical style source (GR-0); `NotificationItem.tsx` loses its one `cn(...)` `className` at `:180`. Both move to canonical Mantine components and theme tokens. **Story disposition is NOT symmetric — see §16.8:** `NotificationItem` **already has a direct-import Story** that must be *migrated*, never duplicated; `NotificationCenter` has none and gets a new one. **REVISED — review 2, §17.1. The original "the panel's rendered chrome must match its pre-861 capture" was a GR-4 absolute that a correct GR-0 implementation must violate**, and no pre-861 capture exists. Replaced by: every rendered-chrome difference is either zero or one of the two deltas ratified in §17.1; no third delta, and no new hardcoded visual value. | P1 | AC3c, AC9 | Revised |
| **R4b** | review 1, §16.2 | **The ARIA clone never lands on a role-less element.** `MantinePopover` applies `aria-haspopup`/`aria-expanded` only to a native-button trigger; a wrapper trigger (the bell's `Indicator`) receives neither on its root. The bell's own `ActionIcon` gets them through the render-function trigger API instead, so the attributes sit on the real button. Both halves are asserted, the wrapper case with a non-button trigger. | P1 | AC3b | Confirmed |
| **R5** | §3.4, clause 15 | Every behaviour in critical-flow row 55 is preserved byte-for-behaviour: day-tap alone never fires `onChange`; `Apply`/`Confirm` commits `{from, to: to ?? from}`; end-before-start is swapped; `maxDate`/`minDate`/`disablePastDates` disable the right cells; `Cancel`/backdrop discards; the clear-X commits `{undefined, undefined}` **without opening the surface**; an invalid `value.from` is guarded. | P0 | AC4, AC6 | Confirmed |
| **R6** | §3.5, 16/16a | Rendered chrome is unchanged: the trigger keeps its `leftSection` calendar icon, conditional clear-X, `radius="lg"`, full width under `fullWidthTrigger`, placeholder text, and the §6d/§6e resting/focus/disabled styling it inherits from `.mantine-Input-input`. Text alignment stays left. No new `className`, CSS rule, inline style, raw px/hex or theme token. | P1 | AC5, AC7 | Confirmed |
| **R7** | clause 15, Q4 | A **two-armed planted-violation proof**: with the fix reverted in the trigger only, the new keyboard test FAILS; restored, it passes. Both transcripts retained, plus the trigger file's `git hash-object` before and after the plant. | P0 | AC6 | Confirmed |
| **R8** | 16c, GR-3, GR-3a | `src/stories/mantine/primitives/RangeDatePicker.stories.tsx` is **extended, never duplicated** — it already imports the production component directly. Add the states the change makes observable: closed/collapsed and open/expanded. No new Story file, title or page. | P1 | AC7 | Confirmed |
| **R9** | 846 §16.1 | `MantineDashboardPeriodControl` inherits the fix with **zero changes to Task 846's files**. The executor proves 846's AC3 now passes keyboard-only, end to end, and changes nothing under `src/design-system/mantine/patterns/MantineDashboard*` or `src/lib/dashboard/`. | P0 | AC8 | Confirmed |

## 5. Assumptions and open questions

- **INFERENCE:** `component="button"` on Mantine's input keeps the `.mantine-Input-input` class and therefore the
  §6d/§6e chrome, because `Input.mjs:155-168` applies the same `input` Styles-API slot regardless of `component`.
  R6/AC5 re-measure it in the rendered DOM instead of relying on this.
- **UNKNOWN:** whether `Popover`'s own `returnFocus` prop, `trapFocus`, or explicit focus management is the smallest
  correct mechanism for R3 on the desktop path, and whether `ResponsiveBottomSheet` already returns focus (its
  `Drawer` sets `returnFocus` — the executor reads it at I0 and records which mechanism it used and why).
- **UNKNOWN:** whether a `<button>` trigger changes the `filtersRangeDatePicker` consumer smoke tests' queries
  (they may select by `textbox` role). Fixing a test's **selector** is in scope; weakening its **assertion** is not.
- `MantineCombobox` is measured non-defective (§3.2) and is out of scope. No owner decision is open on this task.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (9, 11, 13, 14, 15, 16–16d) · `docs/qa-profiles.md` (Q4) ·
`docs/critical-flow-registry.md` row 55 · `docs/mantine-responsive-design-system.md` ·
`docs/tailadmin-style-reference.md` §6d/§6e · `docs/component-rules.md` · `docs/qa-rules.md` ·
`docs/storybook-governance.md` · `.claude/skills/execute-task/SKILL.md` · this kickoff ·
`tasks/Sprints/Sprint_78_kickoff_prompt_Task_846_Dashboard_Header_Period_Grid.md` §16.1.

## 7. Scope

- **Edited:** `src/design-system/mantine/patterns/RangeDatePicker.tsx` (the trigger element, R1/R2/R6) ·
  `src/design-system/mantine/patterns/MantinePopover.tsx` (ARIA state + focus return only, R3/R4 — **no key
  handler**) · `src/modules/notifications/components/NotificationBellView.tsx` (R4 ARIA only, if the attributes are
  not supplied by the popover itself — R4b puts them on the inner `ActionIcon` via the render-function trigger) ·
  **`src/modules/notifications/components/NotificationCenter.tsx` and `…/NotificationItem.tsx` (R4c — migration)** ·
  **two new Story files, one per migrated component (R4c)** ·
  `scripts/mantine-migration-scope.json` (R4a — **three** entries: the bell, `NotificationCenter`,
  `NotificationItem`) ·
  `src/stories/mantine/primitives/RangeDatePicker.stories.tsx` (R8) ·
  `src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx` and
  `…/__tests__/MantinePopover.smoke.test.tsx` (new keyboard arms, R2/R3/R7) · `messages/{sq,en,uk,it}.json` only if
  R8's new Story states need a label · `docs/backlog.md` (861 line).
- **Possibly edited, selector-only:** `src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx` and
  `src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx` — only if a query selects the
  trigger by a role the change alters. Record every such edit and its before/after query.

## 8. Out of scope

`MantineCombobox.tsx` (measured non-defective, §3.2) · every Task 846 file (R9) · `responsiveBottomSheet.tsx`'s
own drag/height behaviour · the calendar body's internal roving-focus model beyond R3's entry/exit · any restyle ·
`MantineDrawer`/`MantineModal`/`MantineDropdownMenu`/`MantineNavigationMenu`/`MantineTooltip` (they do not render
`<MantinePopover>` — §3.3) · `emailChange.ts` (860).

## 9. Current and required behavior

**Before.** Pointer only: clicking the `readOnly` input opens the calendar (desktop popover ≥640, bottom sheet
<640). A keyboard user can focus the trigger and nothing more — `Enter` and `Space` do nothing. The trigger
advertises no popup: no `aria-haspopup`, no `aria-expanded`. Everything downstream of opening already works by
keyboard: the day cells are `<button aria-label>` (`RangeDatePicker.tsx:265-275`), and `Apply`/`Confirm`/`Cancel`
and the month arrows are real `Button`/`ActionIcon` elements.

**After.** The trigger is a semantic button. `Enter`/`Space` open the surface on both paths; focus moves inside;
`Escape` closes and returns focus to the trigger; `aria-expanded` tracks the open state. Pointer behaviour, emitted
values, disabled-day rules, the clear-X contract and all rendered chrome are unchanged.

## 10. Implementation requirements

1. **I0.** `node.exe -p "process.platform + ' ' + process.version"`; `git --no-optional-locks status --porcelain`
   (the worktree **starts dirty** — Task 846 is implemented and uncommitted; snapshot it and reconcile against it at
   the end, per `docs/orchestrator-dirty-worktree-manifest-template.md`); `git --no-optional-locks hash-object` of
   every file in §7; re-measure §3.1 and §3.2 and record both.
2. **Tests first (R7's red arm).** Write the keyboard tests before the fix: `Enter` opens, `Space` opens, `Escape`
   closes and focus returns to the trigger, `aria-expanded` flips — on the desktop path and the `<640` path. Run
   them red against today's code and retain the transcript. They must fail for the right reason (surface never
   opens), not on a selector error.
3. Change the trigger per R1. Keep every existing prop; add `type="button"`. Do not touch the calendar body.
4. R3/R4 in `MantinePopover.tsx`: ARIA state and focus return only. **If you find yourself adding a key handler that
   opens the surface, stop — that is the rejected route (R1) and it double-toggles the native-button consumers.**
5. R8: extend the existing Story with the closed and open states. `GR-3a` forbids a new Story file or title here —
   the canonical Story already imports the production component directly.
6. Green arm, then the plant: revert only the trigger's element type, re-run the keyboard test (must FAIL), restore,
   re-run (must PASS). Capture `git hash-object` of the trigger file at all three points.
7. Re-run the full critical-flow command in §13.2 and diff its result against the I0 baseline run.

## 11. Positive and negative flows

**Positive.** A keyboard user Tabs to the trigger on `/listings`, presses `Enter`, the calendar opens with focus
inside, arrows/Tab reach a day cell, `Enter` selects the start, another day selects the end, `Enter` on **Apply**
commits one `onChange({from, to})` and closes, and focus is back on the trigger showing the new range.

| Negative flow | Applicable | Expected |
|---|---|---|
| `Space` on the trigger | Yes | Opens; the page does not scroll (`preventDefault`). |
| `Escape` with a staged but uncommitted range | Yes | Closes, discards the staged range, fires nothing, focus returns to the trigger. |
| Trigger is `disabled` | Yes | `Enter`/`Space` do nothing; `aria-expanded` stays `false`. |
| Clear-X reached by keyboard | Yes | It is `tabIndex={-1}` today — record whether that stays. Its click must still commit `{undefined, undefined}` **without opening** the surface. |
| `<640` bottom-sheet path | Yes | Same open/close/focus-return contract; `Escape` and backdrop both close. |
| `NotificationBellView` after the ARIA change | Yes | Still opens by `Enter` (it already does, §3.3) and now reports `aria-expanded`. No double toggle. |
| Two triggers on one page | Yes | `FiltersPanel` renders one; `aria-expanded` is per-instance, never shared. |
| Authorization / data / RLS | No | Presentational pattern; no data path changes. |

## 12. Acceptance criteria

- **AC1 [R1, R2]** — Given the `RangeDatePicker` smoke test, when `Enter` and then (in a separate case) `Space` is
  pressed on the focused trigger with no pointer event at all, then the calendar surface is in the DOM. Quote the
  rendered trigger's `outerHTML` showing `<button type="button"` and the `.mantine-Input-input` class.
- **AC2 [R3]** — Given an open surface, when `Escape` is pressed, then the surface is gone and
  `document.activeElement` is the trigger. Assert the same after `Apply` and after `Cancel`. Quote each assertion.
- **AC3 [R4]** — Given the trigger closed and then open, when inspected, then `aria-haspopup="dialog"` is present in
  both states and `aria-expanded` reads `"false"` then `"true"`. **Revised (§16.2): assert this for the
  `RangeDatePicker` trigger only.**
- **AC3b [R4b]** — Given a `MantinePopover` whose trigger is a **non-button wrapper** element, when rendered closed
  and then open, then the wrapper root carries **no** `aria-haspopup` and **no** `aria-expanded` in either state.
  And given the real `NotificationBellView`, when rendered closed and then open, then its `<button>` (the
  `ActionIcon`) carries `aria-haspopup="dialog"` and `aria-expanded` reading `"false"` then `"true"`. Quote the
  wrapper's and the button's `outerHTML` in both states.
- **AC3a [R4a]** — Given `check:story-coverage`, `check:rendered-scope` and
  `node.exe scripts\check-surface-census.mjs --surface src\modules\notifications\components\NotificationBellView.tsx`,
  when run after all three manifest entries and both new Stories exist, then each exits 0 and **every** node in the
  bell's census reads `manifest:yes story:yes`. Quote the full census node list — this is the criterion that failed
  at review 1 with exit 1, so quote its exit code too.
- **AC3c [R4c]** — Given the hardcode grep of §13.2 extended to `NotificationCenter.tsx` and `NotificationItem.tsx`,
  when run, then it prints no `className=` match for either file, `NotificationCenter.module.css` no longer exists,
  and **exactly one** Story file imports each component by name — `NotificationItem`'s being the *migrated* file, not
  a second page (§16.8). Quote both story paths, both import lines, both canonical titles, and
  `git --no-optional-locks status --porcelain` showing the old `Notifications/NotificationItem` path as renamed or
  deleted, never left alongside a new one.
- **AC4 [R5]** — Given `npm.cmd run test -- <the four critical-flow files of §13.2>`, when run, then every
  pre-existing test passes with no assertion weakened. Quote the before/after counts and list every changed line
  with its reason; a changed **selector** is allowed, a changed **expectation** is a failure of this criterion.
- **AC5 [R1, R6]** — Given the trigger rendered with a value set, when its DOM is inspected, then the clear-X
  `ActionIcon` is a **sibling** of the button, not a descendant (`button button` nesting is absent), and the
  computed `border-radius`, `height`, `padding-inline`, `text-align`, `font-size` and `color` of the trigger match
  the pre-change values. Quote both sets.
- **AC6 [R5, R7]** — Given the trigger's element type reverted and the keyboard test re-run, when compared, then it
  FAILS; restored, it PASSES. Quote both transcripts and the three `git hash-object` values.
- **AC7 [R6, R8]** — Given `check:stories`, `check:story-coverage`, `check:pattern-enrolment`,
  `check:design-tokens:strict`, `check:enrolled-tailwind`, `check:rendered-scope`, `check:i18n` and the hardcode
  grep of §13.2, when run, then each gate exits 0 and **the grep's output is byte-identical to the same grep run
  against `HEAD`** — i.e. the diff adds no new match. **Revised (§16.4): the original "prints nothing" was a GR-4
  absolute that a correct implementation violates** — four pre-existing `≥640px`/`16px` header-comment lines match
  and are identical at `HEAD`.
- **AC8 [R9]** — Given Task 846's `DashboardPeriodControl → CustomRangeTooLong` story, when the whole 120-day flow
  is driven **keyboard-only** — open, select, read the `role="alert"`, close — then it completes, `onChange` is
  still not called, and `git --no-optional-locks status --porcelain` shows no change under
  `src/design-system/mantine/patterns/MantineDashboard*` or `src/lib/dashboard/`.
- **AC9 [R2, R3, R6]** — Given the §13.3 owner matrix, when reviewed, then each tuple is accepted or returned with a
  concrete defect.
- **AC10 [R4c, clause 9]** — **Added by review 2, §17.2.** Given a whole-repository search for the retired story id
  and title this task deleted, when run, then no live consumer still resolves them. Run the §17.2 command block and
  quote its output before and after the fix; state for each hit whether it was re-pointed or retired, and why.

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: AC7's "no new match versus HEAD" and AC8's empty porcelain under two Task 846 paths — both are measured preservation boundaries, not aspirations. AC10 asserts zero LIVE consumers of a deleted id, which is a measurable property of the current tree, not a byte-comparison. R4c's former "must match its pre-861 capture" was an absolute of exactly the forbidden kind and was removed in review 2 (§17.1) — the second GR-4 defect found in this kickoff, after AC7's at §16.4.`

`GR-3a STORY PREFLIGHT — RangeDatePicker × closed/expanded trigger states; canonical candidates: Mantine/Primitives/RangeDatePicker (src/stories/mantine/primitives/RangeDatePicker.stories.tsx); direct-import evidence: that file imports RangeDatePicker by name; toolbar coverage: locale=toolbar, viewport=toolbar (Task 799 caveat); decision: EXTEND; target: Mantine/Primitives/RangeDatePicker; rationale: the canonical Story already imports the production component — a new page would be the parallel-Story violation GR-3a exists to stop.`

## 13. QA profile and verification plan

**`Q4`** — `docs/qa-profiles.md:16`: the change touches a `docs/critical-flow-registry.md` row (55, "Listings
date-range filter"). Q4 requires the regression baseline, the changed-behaviour test, and the planted-violation
failure proof (R7/AC6).

### 13.1 Re-entry

`from-scratch`, in a **dirty worktree**: Task 846's implementation is present and uncommitted and must not be
touched (R9/AC8). Evidence root `docs/sessions/evidence/task861/`.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:i18n
npm.cmd run test -- src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantinePopover.smoke.test.tsx src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx
npm.cmd run test -- src/modules/notifications
npm.cmd run test:i18n-hydration
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:pattern-enrolment
npm.cmd run check:design-tokens:strict
npm.cmd run check:enrolled-tailwind
npm.cmd run check:rendered-scope
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\RangeDatePicker.tsx
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantinePopover.tsx
node.exe scripts\check-surface-census.mjs --surface src\modules\notifications\components\NotificationBellView.tsx
node.exe scripts\check-surface-census.mjs --surface src\modules\notifications\components\NotificationCenter.tsx
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n -E "className=|components/ui/|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/design-system/mantine/patterns/MantinePopover.tsx src/modules/notifications/components/NotificationCenter.tsx src/modules/notifications/components/NotificationItem.tsx
git --no-optional-locks status --porcelain
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/design-system/mantine/patterns/RangeDatePicker.tsx src/design-system/mantine/patterns/MantinePopover.tsx src/modules/notifications/components/NotificationBellView.tsx src/stories/mantine/primitives/RangeDatePicker.stories.tsx scripts/mantine-migration-scope.json
```

Expected: all exit 0. `check:locale-leak:mantine-only` is **not** in this block — it is known red (Task 836) and
this task adds no Story page. `RangeDatePicker.tsx` is excluded from the hardcode grep because it carries two
pre-existing `className` pass-throughs (§3.3); assert that its count is **still 2**, not 0.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

Until Task 799 lands, use `iframe.html?id=<story-id>&globals=locale:<locale>` and resize the window.

| # | Story | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `Mantine/Primitives/RangeDatePicker` | closed trigger, value set | 1280 | en | identical to before: calendar icon left, text left-aligned, clear-X right, same radius/height |
| 2 | same | open, keyboard-driven | 1280 | sq | `Enter` opens; focus visibly inside; `Escape` closes and the focus ring is back on the trigger |
| 3 | same | closed + open | 390 / 320 | uk | bottom sheet on both; no overflow; focus returns |
| 4 | `Patterns/Mantine/DashboardPeriodControl` → `CustomRangeTooLong` | keyboard-only, end to end | 1280 | it | opens without the mouse; the >90-day error still appears; Task 846 unchanged |
| 5 | `Mantine/Primitives/NotificationBellView` | **open** panel | 1280 | en | panel chrome, header/title, unread vs read rows, the "mark all read" control, internal scroll — nothing clipped, nothing relocated. **Revised (§17.1): judge this against the two named deltas, not against "unchanged" — the separator/header-underline shade is now `#e4e7ec` (was `#EBEBEB`) and the row background transition is 200 ms (was 150 ms). Accept or return each delta by name.** |
| 6 | same | **open** panel | 390 / 320 | uk | same list, and at both widths: no horizontal overflow, no clipped row text, the panel scrolls internally rather than pushing the page, "mark all read" reachable |
| 7 | the migrated `NotificationItem` Story (canonical title) and the new `NotificationCenter` Story | all retained scenarios | 1280 / 390 | sq | every scenario the old `Notifications/NotificationItem` page showed still renders, unread/read states still visually distinct |

**Tuples 1–4 are unchanged and were already owed from review 1.** Tuples 5–7 could not be answered as originally
written: they asked whether the panel is *unchanged*, for a panel the implementation had already measured as changed
in two named ways. §17.1 replaces that question with the two deltas above. Screenshots for convenience (not verdicts):
`docs/sessions/evidence/task861/final-r1/shot-bell-open-*.png`, `shot-item-*.png`, `shot-center-*.png`.

### 13.4 Evidence the executor hands over

§13.2 transcripts · the red/green keyboard transcripts · the R7 plant's three `git hash-object` values · AC1/AC3/AC5
DOM quotes · the AC4 before/after test inventory · the I0 dirty-worktree manifest · the owner matrix.

## 14. Completion report contract

Files with hashes · R1–R9 including R4a · AC1–AC9 including AC3a, with quotes · commands with exit codes · I0 probes · GR receipts · the
dirty-worktree manifest reconciling every Task 846 path as untouched · assumptions · deviations · limitations ·
owner matrix. Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No
self-approval, no mutating git. Update the 861 line of `docs/backlog.md`; session log with a Files Changed table.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Duplicate? | §3.2: `MantineCombobox` already solves this and is measured non-defective — reused as the reference, not re-implemented. |
| Is the rejected route fenced off? | R1 + §10.4 name it explicitly, with the measured reason (§3.3: every other trigger site passes a native button). |
| Clause 16d / GR-1 | §3.3 — both production consumers censused, both in scope, tiers assigned. |
| Critical flow | §3.4 row 55 named; its exact command is in §13.2; R7/AC6 supply the planted-violation proof Q4 requires. |
| Hardcode | R6/AC7; no new token, no new visual value — chrome is asserted unchanged, not redesigned. |
| Can a fresh Sonnet run it? | §10 is ordered, the worktree's dirty start is stated, and every command is in §13.2. |
| Commands in blocks | §13.2. |
| Does a green gate close a criterion it cannot see? | No — AC7's gates are scoped in §13.2's note; the keyboard behaviour is closed by AC1–AC3's own tests, never by a gate. |

## 16. Review 1 — `NEEDS REVISION` 2026-09-20 (Opus)

The picker half is implemented and genuinely well evidenced: the trigger is a real `<button type="button">`,
`Enter`/`Space` open it, focus returns on `Escape`/`Apply`/`Cancel`, 846's 120-day flow completes keyboard-only with
`onChange` still not called, the plant fails 16 of 31 and restores to 31/31, and the critical-flow suite is 59/59.
Verified against the diff and the retained transcripts, not the report. **Two of the five findings below are defects
in this kickoff, not in the implementation.**

### 16.1 F1 · P0 · `BLOCKED — CLAUSE 16d` is **upheld**; the bell is migrated **inside 861**

**The executor is right and this kickoff was wrong.** §3.3's census inspected the bell's *trigger* and stopped there.
Clause 16d requires every component the surface renders **including what its popover opens**. Measured 2026-09-20:

| Component | manifest | own Story | `className` |
|---|---|---|---|
| `src/modules/notifications/components/NotificationCenter.tsx` | **0 hits** | **none** | 1 |
| `src/modules/notifications/components/NotificationItem.tsx` | **0 hits** | **none** | 1 |

Enrolling `NotificationBellView` makes it a `check:rendered-scope` root, and both children then surface as new
un-baselined edges — `final/15-census-NotificationBellView.txt` exits 1. R4a and AC3a were therefore unsatisfiable
together with AC7, exactly as reported. This is the Task 809 shape, and refusing it was correct.

**First correction — WRONG, and withdrawn the same day.** This review initially split the bell out into a new Task
862. **The owner rejected that split on 2026-09-20:** *"Все має бути виконано під задачею 861! Є баг — він має бути
вирішений в рамках задачі!"* The owner is right, and clause **16d** says so in terms: *"Do not split it into a 'later
task' on your own authority — that is the exact move that produced 809."* The split was the very failure the clause
exists to stop, committed by the reviewer enforcing it. **Task 862 is folded into 861 and must never be issued.**

**Binding correction — the bell is fixed here.** R4a is restored and widened to all three files, **R4c** is added
(migrate `NotificationCenter` and `NotificationItem`, one canonical Story each), and **R4b** now also requires the
bell's own `ActionIcon` to carry the ARIA through the render-function trigger — which gives that API its production
caller inside this task. AC3a is restored, AC3b widened, AC3c added. The executor's revert of the bell edit and the
manifest entry was the correct interim state and is verified clean (`scripts/mantine-migration-scope.json` carries
only Task 846's three entries; `src/modules/notifications/` is absent from `git status`) — re-apply it as part of the
full migration, not as a lone enrolment, which is what made `check:rendered-scope` fail.

### 16.2 F2 · P1 · **new defect introduced by this diff** — ARIA lands on a role-less `<div>`

Not in the report; found by review. `MantinePopover.tsx:130-135` clones `aria-haspopup="dialog"` and `aria-expanded`
onto **whatever element the consumer passed**. `NotificationBellView.tsx:29-44` passes an `<Indicator>`, and Mantine's
`Indicator.mjs:79` spreads `...others` onto its root `Box` — a plain `<div>`. So the bell now renders
`<div aria-haspopup="dialog" aria-expanded="false">`, which is invalid on an element with no role, while the real
button inside still advertises nothing. The new test at
`__tests__/MantinePopover.smoke.test.tsx:182` passes a native `<button>`, so it cannot observe this — **GR-2: that
green test is not evidence about the wrapper case.**

**Resolution:** apply the ARIA clone **only when the trigger is a native button**; a wrapper trigger receives
neither attribute on its root (R4 revised, R4b added). The bell's real `<button>` — the inner `ActionIcon` — gets
the attributes instead, through the render-function trigger API, in this task.
**Verification:** AC3b.

### 16.3 F3 · P2 · AC5's placeholder evidence measures the wrong element

`AC5-computed-AFTER.json` records `placeholderColorEmpty: "rgb(29, 41, 57)"` against `BEFORE`'s
`"rgb(152, 162, 179)"`, while the report states the placeholder colour matches. **The report contradicts its own
artifact.** The implementation is probably correct — `Input.Placeholder c="gray.4"` resolves to `#98a2b3` =
`rgb(152,162,179)` (`theme.ts:287`), the exact `BEFORE` value — but the probe reads the `::placeholder` pseudo,
which no longer exists on a `<button>`, so it fell back to the button's own colour. The artifact cannot prove the
claim either way.
**Resolution:** re-measure the computed `color` of the rendered `span.mantine-Input-placeholder` and compare it to
`BEFORE`'s `rgb(152, 162, 179)`. If it differs, fix the token; do not restate the claim without the measurement.
**Verification:** AC5, with the span named as the measured element.

### 16.4 F4 · P2 · two kickoff defects of my own, corrected in place

1. **AC7 stated an absolute a correct implementation violates** — "the grep prints nothing". Four `≥640px`/`16px`
   header-comment lines match and are byte-identical at `HEAD` (verified both ways). That is a **GR-4** defect in
   this kickoff. AC7 now asserts "no new match versus the same grep at `HEAD`".
2. **§9's "advertises no popup" was false for the desktop path.** `AC5-computed-BEFORE.json` shows
   `aria-haspopup="dialog" aria-expanded="false"` already present — `Popover.Target` supplied them. They were
   missing only on the `<640` path. The executor's correction is accepted and §9 is superseded by this line.

### 16.5 F5 · P3 · unasserted differences to close

- `overflow: clip` → `visible` on the trigger (both AC5 captures). Harmless at 480px with a short range; assert no
  horizontal overflow at 320px with the longest locale's placeholder before closing AC5.
- Desktop `trapFocus` + `returnFocus` now apply to **every** `MantinePopover` consumer, including the bell.
  `final/05-notifications-tests.txt` is 9/9 green, so nothing is broken, but no test asserts the bell's new focus
  trap. Add one assertion, or state in the report that 862 owns it.

### 16.6 D1 ruling · the two selector edits in Task 846's Story are **accepted** (ratified — §16.9)

`src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx:71,99` changed `input[readonly]` →
`button[aria-haspopup="dialog"]`. Inspected: two selectors, both forced by the button change, **no assertion
altered** — the same class AC4 already permits, and leaving them would have broken 846's Story. R9's "zero changes"
is narrowed to: **no change to 846's production, library or evidence files; a Story selector that the trigger change
necessarily breaks may be updated, and every such line is listed.** The executor listed them.
**Ratified by the owner on 2026-09-20 — the verbatim text is in §16.9.** R9 is narrowed to exactly those two lines
and nothing more.

### 16.7 Accepted deviations (no action)

- `<TextInput component="button">` with one narrow cast instead of `InputBase`: justified in-file and by the AC5
  capture — the theme chrome (44px height, `rgb(29,41,57)` text, `8px` radius, border, background) is preserved
  exactly, which `InputBase` lost. `nestedButtonInButton: false` confirms §3.5's inference.
- The render-function trigger API has no production caller yet. **Keep it** — it is the mechanism 862 needs for the
  bell — and note it as such in the report. It is covered by its own test.
- The three disclosed slips (read-order, the aborted plant re-run under `try/finally` with a verified hash, and the
  PowerShell BOMs stripped under a printed manifest) are recorded and cost nothing; `18-file-integrity` is exit 0.

### 16.8 `NotificationItem` already has a Story — migrate it, never duplicate it (owner catch, 2026-09-20)

**A third census defect, same root cause as the first two.** Review 1 reported "own Story: none" for both notification
components. That came from `grep -rl <name> src/stories/`, which **structurally cannot see a colocated story**.
GR-3a requires searching `src/stories/**` *and* colocated `*.stories.*`; I searched half and reported the half as the
whole. Measured 2026-09-20 after the owner pointed at the file:

| Component | Story file | Title | Direct import | Exports |
|---|---|---|---|---|
| `NotificationItem` | **`src/modules/notifications/components/NotificationItem.stories.tsx` (exists, 5308 bytes)** | `Notifications/NotificationItem` — a **legacy, non-canonical** title | yes, `:2` | `AllCases`, `PriceChangeUnread`, `SavedSearchMatchUnread` |
| `NotificationCenter` | **none anywhere** | — | — | — |

That title is why `check:story-coverage` never counted it: the gate reads only `Mantine/Primitives/` and
`Patterns/Mantine/` prefixes. The component is storied; it is storied under a title the canonical gates ignore.

**Binding disposition — asymmetric, and a `CREATE` for `NotificationItem` would be a GR-3a violation** ("`CREATE`
with any canonical candidate makes the task invalid"):

- **`NotificationItem` → `EXTEND`/migrate.** Move the existing file to the canonical Mantine Story location and
  title, **preserving all three scenarios**. Do not leave the old page in place and do not add a second one; exactly
  one Story file may import `NotificationItem` when the task ends (AC3c asserts this, including the rename in
  `git status`). Locale and viewport switch by toolbar, per the canonical shape.
- **`NotificationCenter` → `CREATE`.** No candidate exists; create the direct-import canonical Story.

`GR-3a STORY PREFLIGHT — NotificationItem × unread/read/all-cases: canonical candidates: NONE canonical, but ONE non-canonical direct-import Story exists (src/modules/notifications/components/NotificationItem.stories.tsx, title 'Notifications/NotificationItem', direct-import evidence :2); decision: EXTEND (migrate that file to a canonical title, preserving AllCases/PriceChangeUnread/SavedSearchMatchUnread); target: the migrated file; rationale: a parallel canonical page beside it is the exact GR-3a violation. NotificationCenter × panel states: canonical candidates: NONE; direct-import evidence: NONE; decision: CREATE; toolbar coverage: locale=toolbar, viewport=toolbar.`

**Also found while measuring this:** `NotificationCenter.tsx:10` imports `./NotificationCenter.module.css` and
`:78` applies `className={styles.list}`. A CSS module is not a canonical style source under GR-0, so R4c deletes the
6-line module along with the `className`. Review 1's "className:1 each" was correct but incomplete — it counted the
attribute and missed the stylesheet behind it.

### 16.9 D1 — owner ratification recorded (2026-09-20)

> OWNER RATIFICATION 2026-09-20: R9 is narrowed solely to permit the two listed Story selector updates in
> DashboardPeriodControl.stories.tsx (input[readonly] → button[aria-haspopup="dialog"]) at lines 71 and 99; they are
> mechanically required by Task 861's semantic-trigger change and weaken no assertion. Task 846's production,
> library, test, evidence, and all other Story files remain unchanged.

R9 is narrowed to exactly that. Any further edit to a Task 846 file is out of scope and returns `BLOCKED`.

**The ratification is conditional:** the owner returned 861 to Opus for the three kickoff corrections now applied —
the stale "moves to Task 862" text in R4 (removed; it contradicted §16.1), the §13.3 bell rows (added as tuples 5–7),
and the `NotificationItem` duplicate-Story hazard (§16.8). Those are complete; 861 is executable again.

## 17. Review 2 — `NEEDS REVISION` 2026-09-20 (Opus)

**The implementation is verified.** Every claim below was re-measured against the diff and the artifacts, not the
report. Independently re-run by this review, native `win32 v22.22.3`: the bell census exits **0** with all 5 nodes
`tier1 manifest:yes story:yes className:0`; `check:rendered-scope` exits 0 with **0 new / 0 stale** edges;
`check:story-coverage` 95/95 exit 0; `check:surface-census:changed --base HEAD` 0 new / 0 stale, exit 0. F1 (16d),
F2 (wrapper ARIA), F3 (placeholder span) and F5 (320 overflow, bell focus trap) from review 1 are **closed**. The
`npm run build` transcript (`final-r1/17-build.txt`, `EXIT_CODE=0`, 12:11) is **current for the reviewed diff** —
every source file's mtime is at or before 12:07:46; the only later write is `scripts/surface-census-baseline.json`
(12:12), a governance JSON no bundle imports.

Two defects remain. **One of them is this kickoff's, not the executor's.**

### 17.1 F6 · P2 · **this kickoff's defect** — R4c demanded a visual preservation that GR-0 makes impossible

R4c said *"No visual change is intended: the panel's rendered chrome must match its pre-861 capture."* That cannot
hold, and the executor disclosed both reasons (D10) rather than papering over them:

| Delta | Before | After | Why it is forced |
|---|---|---|---|
| row separators + header underline | `var(--border)` = `#EBEBEB` (`globals.css:470`) | `Divider` `gray.2` = `#e4e7ec` (`theme.ts:285`; `Divider.defaultProps.color`, `theme.ts:1247-1255`) | the old value came from a **CSS module**, which GR-0 forbids as a style source; the canonical `Divider` carries gray-200 by project decision (Task 545 §6o) |
| row background transition | `150ms cubic-bezier(.4,0,.2,1)` | `var(--motion-duration-base)` = **200ms**, `var(--motion-ease-standard)` = the same curve (`globals.css:335,338`) | the deleted module's own comment records it: **no `--duration-*` token equals 150 ms** (fast 100 / base 200 / slow 300) |

Both are one canonical step away from the legacy value, and **there is no pre-861 capture to compare against** — the
old panel cannot be rendered without reverting the migration. So R4c's clause was unsatisfiable *and* unmeasurable:
a **GR-4 absolute**, the second in this kickoff after AC7's at §16.4, and this one is mine.

**Resolution — already applied above, no executor work:** R4c is rewritten to permit exactly these two deltas and no
third; §13.3 tuples 5–7 now name them so the owner ratifies or rejects them by name instead of being asked whether a
known-changed panel is unchanged. **The executor changes nothing for F6.**
**Verification:** AC9, tuples 5–7.

### 17.2 F7 · P3 · clause 9 — a deleted Story left one live consumer behind

`docs/agent-contract.md` **9**: a deletion requires a whole-repository audit of its live downstream references, and a
known broken one *"is part of the same task, never an out-of-scope cleanup."* The session's own
"Downstream references found and closed" section audited three and **missed a fourth**:

- `scripts/task319-qa-notification-templates.mjs:38` — `const STORY_ID = 'notifications-notificationitem--all-cases'`
  resolves to the Story file this task deleted. The script's header comment (`:5-6`) also describes the retired
  `w-80` wrapper. It is not wired into `package.json` or CI, which is why every gate stayed green — **GR-2: a green
  gate is not evidence about a script no gate runs.**

**Resolution — one of two, executor's call, stated with its reason:** either re-point `STORY_ID` to
`mantine-primitives-notificationitem--default` and correct the stale header comment, **or** delete the script as
superseded by the canonical Story (Task 319 is long closed and the capture is referenced by no live gate, runbook or
open task — prove that with the grep below before choosing deletion).
**Verification:** AC10.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
git --no-optional-locks grep -n -E "notifications-notificationitem|Notifications/NotificationItem|task319-qa-notification-templates"
node.exe scripts\check-surface-census.mjs --surface src\modules\notifications\components\NotificationBellView.tsx
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:file-integrity
```

Expected: the first command returns only prose/comment references inside `src/stories/**` and this kickoff — **no
executable `STORY_ID` or path binding to the deleted Story**; the remaining four exit 0. Return all five outputs.
`npm run build` does **not** need re-running for F7 if only `scripts/task319-*.mjs` changes — it is outside the
bundle; say so explicitly in the report rather than re-running it silently.

### 17.3 Rulings on the executor's open questions — no work owed for any of these

1. **D9 · the two `color-mix()` constants in `NotificationItem.tsx` — KEEP as they are.** They are the deleted
   module's own values, relocated **unchanged** (5 % resting / 10 % hover of `--primary`) onto Mantine's `bg` prop
   with `useHover`. Inventing a new theme token for a 5 %/10 % primary tint would need TailAdmin provenance this
   repo does not have (clause **16a**), and `globals.css` defines no such tint — the only comparable token,
   `--accent` (`:574`), is a 15 % brand tint for a different role. Moving a preserved value out of a forbidden CSS
   module into the nearest canonical mechanism is a **net GR-0 improvement**, not a new hardcode. Do not convert
   them to a token in this task.
2. **D11 · deleting `NotificationItem.module.css` too — CORRECT, keep.** R4c names only the `Center` module, but the
   `Item` module held the same class of rules and was the source of the `className` R4c removes. Deleting one and
   leaving the other would have left a CSS module as a live style source. The kickoff was narrower than GR-0; the
   executor applied GR-0.
3. **D13 · the native-button heuristic — ACCEPTED.** `type === 'button'` or `props.component === 'button'` or
   `Button`/`ActionIcon`/`UnstyledButton`, with `props.component` taking precedence. Verified against both
   production consumers: `RangeDatePicker` matches on `component`, the bell takes the render-function branch and its
   `Indicator` root correctly receives neither attribute. A future unknown wrapper degrades to *no ARIA*, which is
   the safe direction. Leave it.
4. **D5/D6 · desktop `trapFocus`/`returnFocus` on every consumer, and the render-function trigger — BOTH INTENDED.**
   The dropdown is portaled, so without the trap a keyboard user cannot reach it; the bell's inherited trap is now
   asserted (`NotificationBellView.smoke`, and Chromium `focusInsidePanel:true` / `afterEscape.focusOnBell:true`).
   D6 gained its production caller in this revision, which is exactly what §16.7 asked for.
5. **`scripts/surface-census-baseline.json` — SCOPE CONFIRMED.** Inspected: exactly the three now-paid-off
   `NotificationBellView`/`Center`/`Item` rows removed, nothing else, produced by the gate's own
   `--update-baseline`. A stale entry **fails** that gate by design (Task 819), so leaving them was not an option.
   No tier-2 row was touched.
6. **`check:stories-rendered` — NOT REQUIRED, and must not be run.** It is `screenshots:assert`, **retired by owner
   decision 2026-09-03**; its output is not valid review evidence. The two new Stories need no entry in its registry
   and this limitation is void, not outstanding.
7. **`tailwind-entropy.allowlist.json:18` · the stale `NotificationItem` entry — LEAVE IT, out of scope.** It was
   already stale before this task (the class went in Task 762). Correctly reported, correctly not touched.
8. **AC8 · the 120-day flow not re-driven — ACCEPTED as evidenced.** For `RangeDatePicker` the revision is a no-op:
   `buttonTrigger` is `true`, so the ARIA clone is unchanged and `withRoles={buttonTrigger}` equals Mantine's own
   default — the same DOM as the run that produced `playwright-keyboard-846-CustomRangeTooLong.txt`. The re-drive in
   `25-keyboard-after-popover-change.txt` confirms open/`Escape`/focus-return at 1280 **and** 390 for both the
   picker and 846's `CustomRangeTooLong`. `INFERENCE` backed by a real-browser counter-check; no re-run owed.
9. **AC4's one re-expressed assertion (review 1 item 3) — ACCEPTED.** `value`/`placeholder` do not exist on a
   `<button>`; `textContent === 'Select dates'` plus `not.toMatch(/\d{2}\.\d{2}\.\d{4}/)` asserts the same
   observable property. A selector/idiom change, not a weakened expectation.

### 17.4 Re-entry

`remediation`. **Start at §17.2 and change nothing else.** The only file this revision may touch is
`scripts/task319-qa-notification-templates.mjs` (re-point or retire), plus `docs/backlog.md` and the session log.
Every other path in the worktree — including all of Task 846's — is **frozen**; re-confirm that with
`git --no-optional-locks status --porcelain` against `final-r1/27-status-porcelain.txt` and report any difference.
Do **not** re-run the full §13.2 block: the §17.2 block is the whole verification for this revision. Do not revisit
F6 (§17.1 is already applied to this kickoff) or any ruling in §17.3.

AC9 is **partly closed — see §17.5.** Its visual half was accepted by the owner on 2026-09-20, which also ratifies
both §17.1 deltas; its keyboard half (tuples 2, 3-keyboard, 4) is still owner-owed. Neither half is executor work
and neither blocks this revision.

### 17.5 AC9 — owner visual verdict, 2026-09-20 (partial: chrome accepted, keyboard half still owed)

> OWNER 2026-09-20: «візуально сторіси виглядаю чудово»

**What this ratifies — the rendered-chrome half of the matrix, tuples 1 · 5 · 6 · 7, and the visual half of 3.**
That includes, by direct consequence, the two §17.1 deltas, because tuples 5–6 render exactly them and nothing else
in the panel changed: the separator / header-underline shade `#e4e7ec` (was `#EBEBEB`) and the row-background
transition 200 ms (was 150 ms). **Both are ACCEPTED.** R4c's revised clause is therefore satisfied: two deltas
permitted, two observed, no third. No token work follows — see §17.3 item 1.

**What it does NOT ratify, because it is not a visual property.** Tuples **2**, **3** (its keyboard half) and **4**
assert *behaviour* — that the surface opens from the keyboard with no pointer, that the focus ring comes back to the
trigger on `Escape`, and that 846's 120-day `CustomRangeTooLong` flow completes keyboard-only. That behaviour is the
entire subject of this task, so it cannot be closed by a verdict on appearance.

It is, separately, **machine-proven in a real browser** — `final-r1/25-keyboard-after-popover-change.txt` (picker and
846's control, `Enter` opens / `Escape` returns focus, 1280 and 390), `playwright-keyboard-RangeDatePicker.txt`,
`playwright-keyboard-846-CustomRangeTooLong.txt` (the full 120-day flow, `onChange` not called, positive control
live), and 61/61 critical-flow tests. So the risk here is low and the owner's remaining check is a confirmation, not
a discovery. It stays open because Q4 + `docs/critical-flow-registry.md` row 55 make the owner's hands-on keyboard
pass part of AC9, and because a reviewer may not convert "looks right" into "works from the keyboard".

`AC9 STATUS — visual: ACCEPTED (tuples 1, 5, 6, 7, and 3-visual), owner 2026-09-20 verbatim above. Keyboard: OPEN (tuples 2, 3-keyboard, 4) — owner hands-on confirmation owed; machine evidence already green.`
