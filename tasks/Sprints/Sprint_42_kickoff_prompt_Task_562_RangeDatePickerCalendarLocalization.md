# Task 562 — `RangeDatePicker` calendar-body localization (sq/it month + weekday names) — Sprint 42 / Epic MM Phase-2

**Type:** UI / bug-fix (product code — `RangeDatePicker` internals). **Executor:** Sonnet 4.6.
**Origin:** Found during Task 559 round-2 rendered review (2026-07-08). Out of scope for 559 (wiring), split out here.

## Goal

The `RangeDatePicker` calendar body renders **month names and weekday labels in English** at `sq` (and, per the
Task 559 evidence log, possibly `it`) in the real app, while every surrounding `common.*`-driven string
(Cancel/Apply/Clear/placeholder) localizes correctly. Fix so the calendar's month names, the month+year header,
weekday labels, and the range summary all render in the **active locale for all four (`en`/`it`/`sq`/`uk`)**, with
**byte-identical server/client output (no hydration mismatch)**.

## Current state (READ + REPRODUCE the real files before touching)

- `src/design-system/mantine/patterns/RangeDatePicker.tsx` builds every calendar date string via
  `new Intl.DateTimeFormat(locale, …)` with `locale` from next-intl `useLocale()`:
  - `useWeekdayLabels(locale)` (~L180) — `{ weekday: 'short' }`
  - `monthFormatter` / `monthYearFormatter` in `DesktopBody` (~L361) and `MobileBody` (~L514)
  - `summaryFormatter` in `MobileBody` (~L519)
- **⚠️ The Task 559 evidence log is internally inconsistent** (it@1440 recorded Italian "Luglio"/"lun mar mer",
  but the observation says sq/it render English). **FIRST reproduce per-locale × per-breakpoint (desktop panel AND
  mobile sheet) and record EXACTLY which locales/runtimes break** — do not assume all of sq/it break.
- **Root-cause candidates to investigate (state which one it actually is):** (a) the Node server lacks full-ICU so
  `sq`/`it` fall back to English (note the calendar body renders inside a `MantinePopover` that only mounts on
  client open — so pin down whether the English text appears on the client too, not just a stale SSR frame);
  (b) the JS runtime genuinely lacks `sq` locale data → needs an explicit fallback/mapping; (c) the locale tag
  passed to `Intl` is not the BCP-47 value `Intl` expects for that locale.

## Pre-read (rule-index → UI / layout / component task)

- `docs/agent-contract.md` (esp. clauses 7, 11, 12) + `docs/backlog.md` + `docs/critical-flow-registry.md`
  ("Listings date-range filter" row — this primitive is on that flow).
- `docs/mantine-responsive-design-system.md` §7/§12/§18; `docs/tailadmin-style-reference.md` §6t (calendar body);
  `docs/ui-rules.md`; `docs/component-rules.md`; `docs/qa-rules.md`.
- `src/lib/formatters.ts` — note the existing "explicit locale for SSR/client parity" pattern already used there.

## Required after-behavior

- Month names, month+year header label, weekday row, and range summary render in the active locale for **all four**
  locales, on **both** the desktop two-month panel and the mobile scrolling sheet.
- **No React hydration mismatch** for any calendar text at any locale (server text === client text). Prefer the
  same deterministic-locale discipline `formatters.ts` documents (explicit locale in, fixed formatting out); if
  `sq` data is genuinely absent in the runtime, add an explicit documented fallback rather than silently emitting
  English.
- No change to `RangeDatePicker`'s public API, the `{from,to}` contract, day-cell chrome (§6t), or the 559 consumer
  wiring. Purely a localization fix inside the primitive.

## Positive flow

1) Open the picker at `sq`. 2) Desktop: the two-month header + weekday row + day grid show Albanian month/weekday
names. 3) Mobile: the fixed month/year dropdowns, each section title, and the weekday row show Albanian. 4) The
range summary (desktop field + mobile bottom bar) shows Albanian short-date parts. 5) Repeat for `it`, `uk`, `en`.

## Negative flow

- **Locale with missing runtime data** (if `sq`) → an explicit, documented fallback locale is used (state which),
  never a silent English leak; no console warning.
- **SSR → client hydration** → identical text; no hydration mismatch warning in the console at any locale.
- **maxDate/minDate disabled days, month/year dropdown bounds** → unchanged from Task 561.

## Regression coverage (clause 15)

The primitive is on the "Listings date-range filter" registry row. Add/extend a test asserting the calendar body's
month + weekday labels are the **localized** strings (not English) for `sq` and `it` (mount the picker OPEN under a
`sq`/`it` intl provider; assert the rendered month/weekday text matches the locale-formatted expectation). Planted
violation: force the English fallback → the assertion FAILS. Do not close without automated proof.

## Rendered evidence (clauses 12/13)

Calendar-OPEN rendered matrix at `sq`/`it`/`uk`/`en` × mobile (320/375) + desktop (1440), both `FiltersPanel` and
`ListingsFilters` as mounting hosts (or a Storybook host if added): month/weekday/summary localized, no clip, no
h-scroll, no hydration warning in the console. Paste the matrix + a console-clean note per cell.

## Acceptance criteria

1. Calendar month names, month+year header, weekday labels, and range summary render in the active locale for
   `en`/`it`/`sq`/`uk`, on both desktop panel and mobile sheet. Evidence pasted.
2. No hydration mismatch for any calendar text at any locale (console-clean note per rendered cell).
3. Root cause identified and stated; if a fallback is introduced it is explicit + documented (no silent English).
4. Public API, `{from,to}` contract, §6t day-cell chrome, and the Task 559 wiring all unchanged.
5. Regression test asserts localized (non-English) month/weekday labels for sq/it + planted-violation transcript.
6. Gates: `tsc=0`, `check:i18n`, `check:stories`, `check:design-tokens -- --strict`, `check:mojibake`,
   `check:file-integrity` green; Files-Changed table present. **Do NOT run git — HELD for orchestrator review.**

## Out of scope

Task 559 consumer wiring (done/approved); `PriceBlock` hydration bug (Task 563); day-cell chrome / range-fill color
(§6t, Task 558/561); admin suspension (Task 560).
