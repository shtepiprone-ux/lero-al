# Task 561 — `RangeDatePicker` owner-rejection fixes — Sprint 42 / Epic MM Phase-2

**Type:** UI / component (product code). **Executor:** Sonnet 4.6.
**Follow-up to:** Task 558 (`RangeDatePicker` component) — REJECTED by the owner on 2026-07-08. This task fixes
the six defects below **in the existing component**; it does NOT rebuild it and does NOT touch the listings
consumers (that is still Task 559). File under review:
`src/design-system/mantine/patterns/RangeDatePicker.tsx` (+ its story + smoke test + chrome CSS).

## Why this task exists (owner rejection, 2026-07-08 — verified against the real diff)

The owner tested the Task 558 render at 320px and rejected it. Each point below is confirmed in the current code:

1. **Duplicate month/year in the mobile sheet header.** `MobileBody` renders BOTH a sticky top month/year label
   (`RangeDatePicker.tsx` ~L507–511) AND a per-section month/year label above every grid (~L545–547). The top one
   is redundant — remove it.
2. **Weekday row sits ABOVE the month/year title.** The single pinned Monday-first weekday header (~L513–533) is
   rendered before the scrolling month sections, so the weekdays appear above each section's month/year label. The
   weekday row must appear **under** the month/year title.
3. **Confirm / Apply disabled when only ONE date is picked.** `disabled={!staged.from || !staged.to}` on Apply
   (~L374), Confirm (~L576), and the `commit()` guard (~L616) block a single-date selection. Must be enabled once a
   start day is staged.
4. **No year selection on mobile.** `MobileBody` has no month/year picker — only a forward scroll of 15 months.
   (Desktop already has month + year dropdowns; mobile does not.)
5. **Past dates are unreachable, and there is no context switch.** The mobile window is `addMonths(startMonth, i)`
   forward-only from today (~L475–483), so past months cannot be reached at all. There is also no prop to express
   the two required behaviors: a **rental** picker must block past dates; a **listings-search** picker must allow
   them (a listing can have been published before the search date).
6. **(owner add-on) The mobile Confirm CTA must be pinned to the bottom** and must NOT scroll together with the
   month list.

## Owner decisions locked (2026-07-08, AskUserQuestion — implement these literally, do NOT re-decide)

- **D1 — single-date semantics:** when only `from` is staged and the user confirms, commit a **single-day range**:
  `onChange({ from, to: from })` (never emit `to: undefined`).
- **D2 — mobile navigation:** the mobile sheet gets a **fixed (non-scrolling) header with a month dropdown + a year
  dropdown** (same idea as desktop). This is the mechanism for both year selection (point 4) and reaching past
  months (point 5). Keep the vertically-scrolling month list beneath it.
- **D3 — weekday placement:** the Monday-first weekday row goes **under the month/year title of EACH month section**
  (section order: `Month YYYY` title → weekday row → day grid). Remove the single pinned weekday header AND the
  redundant sticky top month/year label from point 1.
- **D4 — Confirm pinned:** the bottom bar (range summary + full-width Confirm) is **fixed at the bottom of the
  sheet** and does not scroll with the months.

## New public prop (additive — default preserves current behavior)

```ts
interface RangeDatePickerProps {
  // ...existing: value, onChange, maxDate, minDate, placeholder, className
  /**
   * When true, days before *today* are disabled and cannot be reached/selected on either breakpoint
   * (rental context). When false (default), past dates are fully selectable (listings-search context).
   * Combines with `minDate`: effective min = disablePastDates ? max(minDate ?? -∞, startOfToday) : minDate.
   */
  disablePastDates?: boolean
}
```

- Default `false` → past allowed (the listings-search default; Task 559 will pass `disablePastDates` for the rental
  surface). Compute an `effectiveMinDate` once and thread it everywhere a bound is checked (day-disable, prev/next
  arrow enable, month/year dropdown option bounding, and the mobile window's start). Do NOT hardcode `today` anywhere
  else. **If Task 559 turns out to need a different shape than a single boolean, STOP and ask — do not invent.**

## Pre-read (rule-index → UI / layout / component task)

- `docs/agent-contract.md` (clauses 1–16, esp. **2, 3, 5, 11, 12, 16, 16a**) + `docs/backlog.md` +
  `docs/critical-flow-registry.md` ("Listings date-range filter" row — update it for the new single-date + past-date
  behavior; keep the planted-violation proof real).
- 🔴 `docs/mantine-responsive-design-system.md` — §7 (mobile gate), §12 (canonical patterns), §15 (control-height),
  §16 (gates), §18 (theming/CSS pitfalls, `input-chrome.css`), **§18.9 (icon/placeholder/overlap iron rule),
  §20.5 (MantinePopover trigger-width + `fullWidthTrigger`)**.
- 🔴 `docs/tailadmin-style-reference.md` — **§6t (day-cell states + the mobile-nav override note you will extend),
  §6d/§6e (trigger + range-summary field), §6c (the month/year dropdown chrome — now used on mobile too)**.
- `docs/ui-rules.md` (§15 control-height, §17 UI pre-flight), `docs/component-rules.md` (no raw `<button>`/`<select>`),
  `docs/qa-rules.md`.
- Reference code you are editing: `src/design-system/mantine/patterns/RangeDatePicker.tsx`,
  `src/design-system/mantine/range-date-picker-chrome.css` (imported in `src/app/layout.tsx`), the story
  `src/stories/mantine/primitives/RangeDatePicker.stories.tsx`, and the smoke
  `src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx`. Primitives:
  `MantineCombobox` (dropdowns), `MantinePopover` / `ResponsiveBottomSheet` (sheet).

## Required after-behavior — DESKTOP (`≥640`)

Mostly unchanged. The ONLY required desktop change is D1:
- **Apply enabled once `from` is staged** (drop the `!staged.to` half of the disable). On Apply with no `to`,
  commit `onChange({ from: toISO(from), to: toISO(from) })` (single-day). With both set, commit `{from,to}` as today.
- Past navigation already works via the prev arrow; ensure it now respects `effectiveMinDate` (so `disablePastDates`
  disables the prev arrow / past months on desktop too). No other desktop structural change.

## Required after-behavior — MOBILE (`<640`) — the main rework

Sheet body is a fixed-height flex column with THREE regions; only the middle scrolls:

1. **Fixed header (does not scroll):**
   - A **month dropdown** + a **year dropdown** (`MantineCombobox variant="button"`, §6c chrome, each ≥44px tall).
     Year options span `effectiveMinDate`'s year … `maxDate`'s year (fall back to a sensible bounded range when a
     bound is absent — reuse the desktop `minYear`/`maxYear` logic). Month options bounded by the active year's
     `effectiveMinDate`/`maxDate` months (reuse desktop `monthOptions`).
   - Changing either dropdown re-anchors and **jump-scrolls** the list to that month's section
     (`scrollIntoView`/ScrollArea scroll-to). The dropdowns also **reflect the month currently scrolled into view**
     (reuse the existing `handleScrollPositionChange` → `visibleMonthIdx`, but drive the dropdowns instead of the
     removed sticky label). **Confirm this scroll↔dropdown sync at first rendered evidence** (flagged, not a blocker).
   - **Remove** the old redundant sticky month/year `<Text>` label (point 1) and the old single pinned weekday
     header (point 2/D3).
2. **Scrolling month list (the ONLY scroll region):** consecutive month sections. Each section renders, in order:
   **`Month YYYY` title → Monday-first weekday row → day grid** (D3 — set `showWeekdayHeader` so the weekday row
   renders inside each section, under the title). Window bounds:
   - start = `effectiveMinDate ? startOfMonth(effectiveMinDate) : startOfMonth(subMonths(anchor, 12))`
   - end   = `maxDate ? startOfMonth(maxDate) : startOfMonth(addMonths(anchor, 15))`
   - cap the total at a sane maximum (e.g. ≤ 60 months) to bound the DOM; if `disablePastDates` is true the start
     is today's month (no past sections rendered).
3. **Fixed bottom bar (does not scroll — D4):** range summary (e.g. `6 Jul – 7 Jul`, or `6 Jul` when single) +
   a **full-width Confirm CTA** (≥44px, brand). **Enabled once `from` is staged** (D1); Confirm commits
   `onChange({ from, to: to ?? from })` mapped to ISO, then closes. Ensure the sheet itself does NOT add a second
   outer scroll that would let the footer drift — only the middle list scrolls. **If `ResponsiveBottomSheet` /
   `MantinePopover` forces its own body scroll that defeats the pinned footer, STOP and ask** before hacking around
   it.

## Mobile <640 full-width gate (clause 11)

Trigger full-width (`fullWidthTrigger`); sheet edge-to-edge with drag handle, ≤90dvh, backdrop-tap + Esc; **day cells
= §6t 39px (documented exemption)**; month/year dropdown triggers + Confirm CTA ≥44px and full-width-appropriate;
long sq/en/uk/it month names wrap in the dropdowns and section titles; **no horizontal scroll at 320** in any locale.

## TailAdmin conformance (clause 16 / 16a)

Day-cell visuals still trace to `§6t`; the mobile month/year dropdowns now use the **§6c** dropdown/select chrome
(same as desktop); trigger + range summary trace to `§6d/§6e`. **The mobile fixed-header-with-dropdowns is an owner
override of the Booking scrolling-sheet layout (2026-07-08) — record it in the `§6t` "consumers/overrides" note**;
every COLOR/px/radius still traces to a cited row (zero invented values). The pre-existing `brand.0` `inRange` tint
(flagged by Task 558 as not a literal zip citation because §6t's flatpickr reference is single-select) is **accepted
as-is for this task** — do NOT change it and do NOT invent a new value; it stays a documented divergence pending a
future §6t range-state extraction. Rendered side-by-side proof required; `tsc=0`/gate-green is not style proof.

## Positive flow (happy path)

Actor: user setting a listings date range. 1) Trigger shows placeholder or `dd.MM.yyyy — dd.MM.yyyy` + clear.
2) Click → desktop two-month panel (≥640) / mobile sheet (<640) opens at `value.from`'s month (or today).
3) **Desktop:** pick month/year via dropdowns (past reachable when `!disablePastDates`); click start, click end → Apply
commits `{from,to}`; OR click a single day → Apply commits `{from, to:from}`. 4) **Mobile:** use the fixed-header
month/year dropdowns to jump to any month/year; the weekday row shows under each month title; tap start (+ optionally
end); the pinned bottom Confirm commits `{from, to: to ?? from}` and closes. 5) Trigger reflects the committed range.
Success: correct ISO, Confirm/Apply enabled from the first staged day, no clip/no h-scroll at 320.

## Negative flow (every off-happy-path branch)

- **Cancel / Esc / backdrop** → discard STAGED range, no `onChange`, focus returns to trigger; sheet closes cleanly.
- **Clear filters (desktop) / trigger clear-X** → staged reset to empty; trigger clear commits
  `onChange({undefined,undefined})` and does NOT open the panel (`stopPropagation`).
- **Single day then Confirm/Apply** → commits `{from, to:from}` (D1) — NOT a half-open range, NOT a no-op.
- **End before start** → swap so `from ≤ to` (unchanged `pickDay` behavior; keep the test).
- **`disablePastDates` true** → every day before today is disabled on BOTH breakpoints; mobile renders NO past month
  sections; desktop prev arrow / past month options are disabled. `disablePastDates` false → past days selectable and
  past months reachable via the mobile dropdowns and the desktop prev arrow.
- **`maxDate`/`minDate`** → out-of-bounds days disabled; month/year dropdown options bounded; prev/next disable when
  the shifted pair/window would fall entirely out of bounds (no empty month, no wrap).
- **Invalid incoming `value`** (unparseable) → guarded to empty; placeholder shown; no crash.
- **Locale switch (sq/en/uk/it)** → weekday labels, month names (dropdowns + section titles), summary, CTA reflect
  the active locale at runtime.
- **Long uk/it month names** → wrap/fit in dropdowns + titles; no clip / no h-scroll at 320.

## Regression coverage (clause 15)

Update the existing `RangeDatePicker.smoke.test.tsx` (registry row "Listings date-range filter"):
- **Fix the now-incorrect desktop maxDate test** (currently asserts "Apply stays disabled" after seeding
  `value.from`): with D1 a pre-staged `from` legitimately ENABLES Apply. Rewrite it to assert the intended invariant —
  a `> maxDate` day is `disabled` and clicking it does NOT change the staged range / does NOT stage a new endpoint —
  WITHOUT weakening it (do not just delete the assertion). Keep a fresh `value={{undefined,undefined}}` variant if
  needed to test the disabled-day path cleanly.
- **Add:** desktop single day → Apply → `onChange({from:X,to:X})`.
- **Add:** mobile single day → Confirm (enabled) → `onChange({from:X,to:X})`; and the existing "tap-only fires
  nothing" test still passes.
- **Add:** `disablePastDates` → a day before today is `disabled` (both breakpoints); and with it false, a past day is
  selectable.
- Keep the `pickDay` swap planted-violation transcript. **Do NOT close without automated proof (green + planted
  FAIL).**

## Rendered evidence (clauses 12/13 + §18.9)

Update the persisted story `Mantine/Primitives/RangeDatePicker` (add a `disablePastDates` variant + a mobile-open
variant showing the new fixed header + per-section weekday rows + pinned Confirm). `screenshots:assert --
--mantine-only` green (paste before/after count). 🔴 §18.9 human-visual proof at **uk@320/375/390 + sq@320 + it@320
+ en@1280** showing, on mobile: fixed header month/year dropdowns, NO duplicate month label, weekday row UNDER each
month title, a reachable PAST month (with `disablePastDates=false`), pinned bottom Confirm enabled after a single tap,
range fill across a month boundary; on desktop: Apply enabled with one day selected. No clip, no h-scroll at 320.

## Acceptance criteria (each verifiable in diff + rendered evidence)

1. **Point 1 fixed:** the mobile sheet has exactly ONE month/year indication (the fixed-header dropdowns); the
   redundant sticky top label is gone.
2. **Point 2 / D3 fixed:** the Monday-first weekday row renders UNDER the `Month YYYY` title inside each month
   section; the old single pinned weekday header is removed.
3. **Point 3 / D1 fixed:** Apply (desktop) and Confirm (mobile) are enabled once `from` is staged; committing with no
   `to` emits `{from, to:from}`; `commit()` guard updated accordingly.
4. **Point 4 / D2 fixed:** the mobile fixed header has working month + year dropdowns (§6c chrome, ≥44px) that
   jump-scroll the list and reflect the in-view month.
5. **Point 5 fixed:** new `disablePastDates?: boolean` prop (default false, byte-behavior-identical when omitted);
   `effectiveMinDate` threaded through day-disable, arrow/window/dropdown bounds; past months reachable on mobile
   when allowed; blocked when `disablePastDates`.
6. **Point 6 / D4 fixed:** the mobile Confirm bottom bar is pinned and does not scroll with the month list; only the
   middle list scrolls.
7. Monday-first everywhere; zero raw `<button>`/`<select>`; all VISUAL values trace to §6t/§6d/§6e/§6c (zero
   invented, `brand.0` inRange left unchanged & documented).
8. Mobile `<640`: full-width gate satisfied (clause 11) — day cells §6t 39px exemption; dropdowns + CTA ≥44px; no
   h-scroll at 320 × sq/en/uk/it.
9. i18n: add `common.period_year` (aria for the year dropdown) with full sq/en/uk/it parity (reuse existing keys
   otherwise); `check:i18n` green; runtime-confirmed.
10. Regression: updated + added smoke tests green; the corrected maxDate test is NOT weakened; planted-violation
    transcript present.
11. Gates: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens -- --strict`, `check:mojibake`,
    `check:file-integrity` all green; `screenshots:assert -- --mantine-only` green; §18.9 human-visual set pasted;
    "Files Changed" table present. **Do NOT run git — HELD for orchestrator review.**

## Out of scope

Wiring the listings filters (Task 559 — but this task DEFINES `disablePastDates` so 559 can pass it); the admin
suspension range + schema (Task 560); changing the `inRange` tint token; ±day flexibility chips; presets sidebar;
a `@mantine/dates` dependency; redesigning `MantinePopover`/`ResponsiveBottomSheet` beyond consuming them.

## Files expected to change (executor fills the real "Files Changed" table)

- `src/design-system/mantine/patterns/RangeDatePicker.tsx` — the six fixes + new prop.
- `src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx` — corrected + added tests.
- `src/stories/mantine/primitives/RangeDatePicker.stories.tsx` — new variants.
- `messages/{sq,en,uk,it}.json` — `common.period_year` (only if the year dropdown needs an aria label).
- `src/design-system/mantine/range-date-picker-chrome.css` — only if a new hover/nav state needs a CSS-only selector.
- `docs/tailadmin-style-reference.md` §6t — mobile-nav override note.
- `docs/critical-flow-registry.md` — update the "Listings date-range filter" row for the new behavior.
