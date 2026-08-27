# Task 773 — `RangeDatePicker`'s in-calendar month/year selectors dismiss the calendar

**Sprint:** 67 · **Priority:** P1 (owner-reported user-facing defect) · **QA profile:** **Q4 Release/Critical Flow**
**State:** `IMPLEMENTED — AWAITING OWNER NATIVE GATE` · **Implemented by:** Opus, under the explicit owner
authorization recorded in the Sprint 67 plan (`docs/orchestrator-role.md` → Role exception). Opus holds no approval
authority over its own implementation; the verdict is the owner's.

**Registry:** `docs/critical-flow-registry.md` → "Listings date-range filter" (Task 558/561/559 row).

---

## Reported behavior

Homepage → **Розширені фільтри** (Advanced filters) drawer → date-range filter → open the calendar → open the month
dropdown → pick a month. **The whole calendar closes.** The month is applied, but the panel is gone, so the range can
never be finished in one pass. Broke silently during an earlier task; validation stayed green throughout.

## Root cause — established from source, not inferred

| # | Fact | Where |
|---|---|---|
| 1 | Mantine `Popover` dismisses via `useClickOutside(cb, ['mousedown','touchstart'], [targetNode, dropdownNode])`. | `@mantine/core` `Popover.mjs:159` |
| 2 | That hook fires when `event.composedPath()` contains **neither** node. | `@mantine/hooks` `use-click-outside.mjs` |
| 3 | Mantine `Combobox` defaults `withinPortal: true`. | `Combobox.mjs:41` |
| 4 | A portalled list mounts in the shared `[data-mantine-shared-portal-node]` as a **sibling** of the calendar's dropdown — never a descendant. | verified in jsdom: `calendarDropdown.contains(option) === false` |
| 5 | `ComboboxOption` calls `event.preventDefault()` on `mousedown` but **never** `stopPropagation()`, so the mousedown does reach the document listener. | `ComboboxOption.mjs:61-63` |

Pressing a month option therefore satisfies (2) exactly: composedPath holds the combobox's own portal chain and
nothing of the calendar's, so the calendar reads the press as an outside click and closes — **before** the option is
submitted. Confirmed as a general property of the wiring, not of this call site: under `env="test"` (portals inlined)
a `mousedown` on `document.body` does close the calendar, proving the dismiss path is live.

## Current behavior to preserve

Everything else in the flow, unchanged: two-month consecutive pair · `pickDay` staging and the end-before-start swap ·
`minDate`/`maxDate` disabling · `disablePastDates` · Apply/Cancel/clear-X semantics (`onChange` fires **only** on
Apply) · the `<640` bottom-sheet path · the atomic `date_from`+`date_to` commit in both `FiltersPanel` and
`ListingsFilters` · all four locales · every other `MantineCombobox` consumer, byte-identical.

## Required after behavior

Picking a month **or** a year inside the open calendar re-anchors the calendar on that month/year and **leaves the
calendar open**.

## What changed — 3 lines of behavior across 2 files

1. **`src/design-system/mantine/patterns/MantineCombobox.tsx`** — new optional `withinPortal?: boolean`, threaded to
   Mantine's `<Combobox>`. Default `undefined` → Mantine's own `true` still applies → **byte-identical when absent**,
   matching the `triggerWidth` / `inputMode` / `onKeyDown` / `dropdownMinWidth` precedent. The stale "portal mode is
   DEFERRED" paragraph in the component doc comment was corrected in the same edit.
2. **`src/design-system/mantine/patterns/RangeDatePicker.tsx`** — `withinPortal={false}` on the **desktop** month and
   year selectors (`DesktopBody`, ~L455/L464), with the mechanism recorded inline.

**Deliberately NOT changed.** The mobile-header selectors (`MobileBody`, ~L615/L624) were left alone: below 640px
`MantineCombobox` renders the shared `ResponsiveBottomSheet` and never mounts `Combobox.Dropdown` at all, so the
portal path does not exist there. No sweep of other nested-combobox sites — that is Sprint 67 exit criterion 4.

## Positive flow

Open the drawer → open the calendar (anchored on `date_from`, or today) → open **Month** → pick a month → **calendar
stays open, both panes advance** → pick two days → **Apply** → one `onChange({date_from, date_to})`.

## Negative-flow applicability

| Branch | Applicable? | Source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | **No** | No schema, no user input parsed | N/A — the picker emits ISO dates it constructed itself | — |
| Authorization / RLS | **No** | Pure client-side filter UI, no write path | N/A | — |
| Offline / network | **No** | No fetch on this path | N/A | — |
| Concurrent writer | **No** | No persisted state | N/A | — |
| Bounded month list | **Yes** | `computeMonthOptions` clamps to `minDate`/`maxDate` | Out-of-range months absent; empty list falls back to the anchor month | unchanged by this diff — existing `RangeDatePicker.smoke.test.tsx` coverage |
| Dropdown escapes / is clipped | **Yes** | `withinPortal={false}` removes the portal escape hatch | The list now renders inside the calendar dropdown; the calendar panel is `MantinePopover`-positioned and not `overflow:hidden`, and the list carries its own `mah={220}` scroll cap | **owner native gate — visual, see below** |
| Mobile (`<640`) | **Yes** | `MantineCombobox` bottom-sheet path | Unchanged — no `Combobox.Dropdown` mounts | existing mobile tests in `RangeDatePicker.smoke.test.tsx` |

## Acceptance criteria

- **AC1** Picking a month in the open calendar leaves it open and re-anchors it. *(containment-level proof landed;
  real-browser proof outstanding — see Residual evidence.)*
- **AC2** Same for the year selector. *(same fix, same file; not separately asserted.)*
- **AC3** The month/year list is not visually clipped or mispositioned now that it is not portalled. **Owner native.**
- **AC4** `MantineCombobox` is byte-identical for every consumer that omits `withinPortal`. ✅ prop defaults to
  `undefined`; all other consumers untouched; 64/64 related tests green.
- **AC5** No regression in the date-range critical flow. ✅ 64/64.

## Verification plan and what was actually run

Run in a Linux container against a faithful copy of `src/` + `messages/` (the repo's own `node_modules` is a Windows
install; its native `rollup`/`esbuild` binaries cannot execute under the mounted Linux shell — recorded as an
environment limitation, not a skipped gate).

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **0 errors** |
| `RangeDatePicker.smoke` · `RangeDatePickerLocalization` · `MantineCombobox.smoke` · `MantinePopover.smoke` · `filtersRangeDatePicker.smoke` · `filtersPanelShell.smoke` · `heroSearch.smoke` | **7 files / 64 tests passed** |
| **Before/after proof** on the new test | **unfixed sources → FAIL** (`expected false to be true` at the containment assertion) → **fixed sources → PASS**. This is the planted-violation transcript Q4 requires: the violation is the absent `withinPortal={false}`, and it was run in that exact order. |

### Residual evidence the owner must produce natively

```
npm run typecheck
npm run lint
npx vitest run src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx src/design-system/mantine/patterns/__tests__/MantineCombobox.smoke.test.tsx
npm run check:i18n
npm run check:mojibake
npm run build            # clause 9 — required, exit 0, and NOT reproducible on my side
```

Plus **AC1/AC2/AC3 in a real browser**: Homepage → Advanced filters → calendar → Month, then Year; confirm the panel
stays open, both panes advance, and the list is neither clipped nor mispositioned. `uk@320` and one desktop width.

**Why the automated test cannot stand in for that browser run** — and why the existing 20 tests were green while the
feature was broken: under `MantineProvider env="test"` Mantine's `OptionalPortal` returns children inline, so
`withinPortal` is a **no-op** and the defect cannot be represented; without `env="test"` the portals are real but
every jsdom rect is `0×0`, `hideDetached` marks the reference hidden, and click-outside stops firing entirely. The
symptom is unobservable in jsdom from **both** directions. The new test therefore asserts the exact predicate
`composedPath().includes(dropdownNode)` evaluates — DOM containment — which is the strongest available claim, and it
does discriminate (it fails on the unfixed tree). Full reasoning is in the test's own header comment.
