# Task 558 — `RangeDatePicker` component (Booking.com-style) — Sprint 42 / Epic MM Phase-2

**Type:** UI / component (product code). **Executor:** Sonnet 4.6.
**Depends on:** the §6t reference row + the `MantinePopover` `fullWidthTrigger`/`close()` additive props (both
speced in `tasks/Sprints/Sprint_41_kickoff_prompt_Task_557_DatePickerMantineMigration.md` — read it as the chrome/
primitive reference). **This task builds the NEW component only; wiring the filters is Task 559; do NOT touch the
consumers here.**

## Goal

A new `RangeDatePicker` that selects a **date range** (`{ from, to }`), visually + functionally matching the owner's
two references (2026-07-06): Booking.com on mobile, a two-month side-by-side picker on desktop. Single source for
both the listings `date_from`/`date_to` filters (wired in Task 559). Monday-first, `date-fns`, `sq/en/uk/it`.

## Proposed public API (STOP-AND-ASK if a consumer needs more)

```ts
interface DateRange { from: string | undefined; to: string | undefined } // ISO yyyy-MM-dd
interface RangeDatePickerProps {
  value: DateRange
  onChange: (next: DateRange) => void      // fired on Apply (desktop) / Confirm (mobile), NOT on each day click
  maxDate?: Date                            // days after are disabled
  minDate?: Date
  placeholder?: string                      // trigger placeholder when no range
  className?: string
}
```
The trigger shows `dd.MM.yyyy — dd.MM.yyyy` when a range is set, else the placeholder; a clear affordance resets to
`{from:undefined,to:undefined}`. **If Task 559's real filter code needs a different shape (e.g. two separate URL
params), STOP and ask — do not invent.**

## Pre-read (rule-index → UI / layout / component task)

- `docs/agent-contract.md` (clauses 1–16, esp. **2, 3, 5, 11, 12, 16, 16a**) + `docs/backlog.md` +
  `docs/critical-flow-registry.md` (add/extend a listings date-range-filter row — see Regression coverage).
- 🔴 `docs/mantine-responsive-design-system.md` — §7 (mobile gate), §12 (canonical patterns), §15 (control-height),
  §16 (gates), §18 (theming/CSS pitfalls, `input-chrome.css`), **§18.9 (icon/placeholder/overlap iron rule),
  §20.5 (MantinePopover trigger-width contract + the new `fullWidthTrigger` opt-in)**.
- 🔴 `docs/tailadmin-style-reference.md` — **§6t (day-cell state matrix + trigger chrome), §6d/§6e (trigger field),
  §6c (dropdown/select chrome for the desktop month/year dropdowns)**.
- `docs/ui-rules.md` (§15 control-height, §17 UI pre-flight), `docs/component-rules.md` (no raw `<button>`/`<select>`
  — day cells → Mantine `UnstyledButton`, month/year → `MantineCombobox`/Mantine `Select`), `docs/qa-rules.md`.
- Reference code: `src/design-system/mantine/patterns/MantinePopover.tsx` (+ the `fullWidthTrigger`/`close()` props
  from Task 557's spec), `src/components/shared/DatePicker.tsx` (the single-date base — grid/date-fns logic to reuse),
  `src/design-system/mantine/patterns/MantineCombobox.tsx` (dropdowns), `responsiveBottomSheet.tsx` (mobile sheet).

## Desktop (`≥640`) — owner reference "на десктопі має бути ось так"

Anchored panel via `MantinePopover` (`fullWidthTrigger` for the trigger). Panel contents:
- **Top bar:** a **range-summary field** showing `10 February 2023 — 17 March 2023` (bordered §6d/§6e field, read-
  only display of the *staged* range), a **"Clear filters"** text link (§6s text-link — resets staged range), and
  **"Cancel"** (ghost) + **"Apply"** (primary brand) buttons. Apply commits `onChange(staged)` + `close()`; Cancel
  discards staged + `close()`.
- **Two months side-by-side — CONSECUTIVE pair (right = left+1), single shared header (owner decision 2026-07-08,
  M3-docked/setproduct reference — replaces the earlier per-month From/To dropdowns):** the header carries (a) a
  **prev arrow** (icon button, §6 button chrome) that shifts the PAIR back one month, (b) a **month dropdown** +
  **year dropdown** (`MantineCombobox`/`Select`, §6c chrome) that re-anchor the LEFT month (right month follows as
  left+1), (c) a **gray "Month, YYYY" text label** for the right month (non-interactive, §6t weekday-gray styling),
  and (d) a **next arrow** that shifts the pair forward one month. No `From`/`To` labels. Default anchor: month of
  `value.from ?? today`.
- **Weekday header** per month: Monday-first (`Mo Tu We Th Fr Sa Su`), §6t weekday styling (gray-500, ~12px, bolder).
- **Day grid** per month: §6t day cells (39px, pill radius). States: resting, hover (gray-200), **start/end = brand
  `#EC5447` fill**, **inRange = light brand tint** (`brand`/10-ish per §6t inRange), today = gray-400 border,
  disabled (`> maxDate` / `< minDate` / out-of-month) = §6t disabled. The `inRange` fill spans across BOTH months.
- **Selection model (staged):** click a day → sets `from` (if none staged or both set → restart) then `to` on the
  next click; if the 2nd click is before `from`, swap. Nothing commits until **Apply**.

## Mobile (`<640`) — Booking.com reference

Full-width `ResponsiveBottomSheet` (via `MantinePopover`): drag handle, edge-to-edge, ≤90dvh, backdrop-tap + Esc.
- **Sticky month-name header** at the top (replaces Booking's "Calendar / I'm flexible" tabs) — shows the month
  currently scrolled into view (e.g. "July 2026"); updates on scroll. **CONFIRM interpretation at first render.**
- **Pinned Monday-first weekday header** below it (does not scroll away).
- **Vertically-scrolling multi-month list:** consecutive months rendered downward (each with a "Month YYYY" section
  label + its Monday-first grid), NO prev/next arrows — the user scrolls. Render a reasonable forward window (e.g.
  current month → +12–18 months, bounded by `maxDate`); STOP and ask if the range window is unclear.
- **Day cells §6t 39px** (owner override of the ≥44px min for day cells — documented in §6t; nav/CTA still ≥44px).
- **Range fill** identical to desktop (start/end brand, inRange light tint, across month boundaries).
- **Bottom bar (sticky):** range summary (e.g. "6 Jul – 7 Jul") + a **full-width Confirm CTA** ("Select dates",
  primary brand, ≥44px). Confirm commits `onChange(staged)` + closes. Backdrop/Esc discard staged (no commit).
- **NO** ±day flexibility chips.

## Mobile <640 full-width gate (clause 11)

Trigger full-width (`fullWidthTrigger`); sheet edge-to-edge; **day cells = §6t 39px (documented exemption)**; the
Confirm CTA + any dropdown triggers ≥44px + full-width; long sq/en/uk/it month labels wrap; **no h-scroll at 320**.

## TailAdmin conformance (clause 16 / 16a)

Day-cell VISUALS trace to `§6t`; trigger + range-summary field trace to `§6d/§6e`; month/year dropdowns to `§6c`;
text-link "Clear filters" to `§6s`; buttons to the §6 Button chrome. **The STRUCTURE (two-month desktop, scrolling
mobile) is an explicit owner override of §6t's single-month flatpickr layout — record it in the §6t row's
"consumers/overrides" note; every COLOR/px/radius still traces to a cited row (zero invented values).** Rendered
side-by-side proof required; `tsc=0`/gate-green is not style proof.

## Positive flow (happy path)

Actor: user setting a listings date range. 1) Trigger shows placeholder or `dd.MM.yyyy — dd.MM.yyyy` + clear. 2)
Click → desktop two-month panel (≥640) / mobile scrolling sheet (<640) opens at `value.from`'s month (or current).
3) **Desktop:** pick month/year via dropdowns; click start day, click end day (inRange fills); **Apply** commits
`onChange({from,to})` + closes. 4) **Mobile:** scroll months; tap start, tap end (inRange fills); **Confirm** commits
+ closes. 5) Trigger reflects the committed range. Success: correct ISO `{from,to}`, no layout shift, no clip at 320.

## Negative flow (every off-happy-path branch)

- **Cancel / Esc / backdrop** → discard STAGED range, no `onChange`, focus returns to trigger; sheet closes cleanly.
- **Clear filters (desktop) / clear affordance (trigger)** → staged range reset to `{undefined,undefined}`; on the
  trigger's clear, commit `onChange({undefined,undefined})` and do NOT open the panel (`stopPropagation`).
- **Only start picked, then Apply/Confirm** → decide + state: either disable Apply/Confirm until both set, OR commit
  a single-day range (`from===to`). Pick ONE, implement it, cite it. Do NOT emit a half range silently.
- **End before start** → swap so `from ≤ to` (never emit inverted).
- **`maxDate`/`minDate`** → out-of-bounds days disabled (not selectable, not stageable); month/year dropdowns do not
  offer out-of-bounds months where trivially bounded; **prev/next arrows disable** when the shifted pair would fall
  entirely out of bounds (no wrap-around, no empty month).
- **Invalid incoming `value`** (unparseable) → guard → treated as empty; placeholder shown; no crash.
- **Locale switch (sq/en/uk/it)** → weekday labels, month names (dropdowns + section labels), summary, and CTA label
  reflect the active locale at runtime.
- **Inside overlay contexts** → the panel/sheet must not clip when opened from a filter Sheet/Popover (portal).
- **Long uk/it month names** → wrap/fit in dropdowns + section labels; no clip / no h-scroll at 320.

## Regression coverage (clause 15)

Scan `docs/critical-flow-registry.md`; add/extend a **"Listings date-range filter"** row (route/action: filter apply
→ query params; happy = pick from+to → `onChange({from,to})` with correct ISO; failure = end-before-start swapped /
`maxDate` day not selectable / clear → empty). Add an RTL smoke: (1) desktop pick from+to then **Apply** fires one
`onChange({from,to})`; (2) mobile pick then **Confirm** fires it (and tapping days alone does NOT); (3) end-before-
start is swapped; (4) a day past `maxDate` is disabled; (5) Cancel/backdrop fires nothing. Planted-violation
transcript (drop the swap → test 3 FAILS). Do NOT close without automated proof. Also confirm the `MantinePopover`
`fullWidthTrigger`/`close()` smokes exist (added with the props).

## Rendered evidence (clauses 12/13 + §18.9)

ONE persisted story `Mantine/Primitives/RangeDatePicker` (`skipCanvas:true`, `layout:'fullscreen'`, toolbar-driven
locale/viewport, `storyT` strings sq/en/uk/it parity). Render: empty, a staged range spanning two months, `maxDate`-
bounded, and forced-open on BOTH the desktop two-month panel and the mobile scrolling sheet (Task 554 open-overlay
pattern). `screenshots:assert -- --mantine-only` green (paste before/after count). 🔴 §18.9 human-visual proof at
**uk@320/375/390 + sq@320 + it@320 + en@1280 + en@1440** showing: mobile scrolling sheet with sticky month header +
Monday-first pinned weekday header + 39px cells + range fill across a month boundary + full-width Confirm; desktop
two-month consecutive pair with the shared header (arrows + month/year dropdowns + gray right-month label) + range
summary + Clear/Cancel/Apply + inRange fill spanning both months; no clip, no h-scroll at 320.

## Acceptance criteria (each verifiable in diff + rendered evidence)

1. New `RangeDatePicker` with the `{from,to}` API; renders via `MantinePopover` (`fullWidthTrigger`+`close()`) +
   Mantine `Button`/`UnstyledButton` + `MantineCombobox`/`Select` (month/year); **zero raw `<button>`/`<select>`**.
2. Desktop = two-month CONSECUTIVE pair + single shared header (prev/next arrows shifting the pair + month/year
   dropdowns anchoring the left month + gray right-month label) + range summary + Clear/Cancel/Apply; Apply commits,
   Cancel discards. Mobile = Booking scrolling sheet + sticky month header + pinned Monday-first weekday header +
   Confirm CTA; day-tap stages, only Confirm commits.
3. Monday-first everywhere; range selection with start/end (`#EC5447`) + inRange fill spanning month boundaries;
   today gray-400; disabled per §6t; all VISUAL values trace to §6t/§6d/§6e/§6c/§6s (zero invented).
4. Mobile `<640`: trigger full-width; sheet edge-to-edge; day cells §6t 39px (documented exemption); CTA + dropdowns
   ≥44px + full-width; no h-scroll at 320 × sq/en/uk/it.
5. All negative branches have a verifiable line; RTL smoke + planted-violation transcript present.
6. i18n: new keys as needed (`common.from`/`common.to`/`common.apply`/`common.cancel`/`common.clear_filters`/
   `common.confirm` — reuse existing where present) with full sq/en/uk/it parity; `check:i18n` green; runtime-confirmed.
7. Gates: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens -- --strict`, `check:mojibake`,
   `check:file-integrity` all green; `screenshots:assert -- --mantine-only` green; §18.9 human-visual set pasted;
   Files-Changed table present. **Do NOT run git — HELD for orchestrator review.**

## Out of scope

Wiring the listings filters (Task 559); the admin suspension range + its schema (Task 560); ±day flexibility chips;
time-of-day; presets (Today/Last 7 Days/…/Custom sidebar — owner re-confirmed OUT 2026-07-08 despite it appearing in
the reference screenshots); a `@mantine/dates` dependency (owner re-confirmed hand-rolled + `date-fns` 2026-07-08);
redesigning `MantinePopover`/`responsiveBottomSheet` (the two additive props are allowed).
