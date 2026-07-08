# Task 559 — Listings filters → `RangeDatePicker` integration — Sprint 42 / Epic MM Phase-2

**Type:** UI / consumer wiring (product code). **Executor:** Sonnet 4.6.
**Depends on:** Task 558 (`RangeDatePicker`) APPROVED first. **Do NOT start until 558 is merged/approved.**

## Goal

Replace the TWO separate single-date pickers (`date_from`, `date_to`) in each listings filter surface with ONE
`RangeDatePicker` (Task 558), preserving the existing filter/query behavior exactly — same URL params, same applied
query, same reset behavior. This is a consumer-wiring task: **no new component internals, no new date logic.**

## Current state (READ the real files before touching)

- `src/components/shared/FiltersPanel.tsx` — a `date_from` DatePicker (~line 371) + a `date_to` DatePicker (~line
  380), each `value`/`onChange`/`placeholder`/`maxDate={today}`. Confirm the exact current props + how `date_from`/
  `date_to` feed the filter state / URL params / query.
- `src/modules/listings/components/ListingsFilters.tsx` — the same pair (~line 334 `date_from`, ~line 343 `date_to`).
- **Map the current data flow FIRST** (state → URL search params → listings query). The range picker's `{from,to}`
  MUST produce the identical `date_from`/`date_to` param values the backend query already consumes. **If the two
  fields are consumed independently anywhere (e.g. one applied without the other), STOP and ask — do not assume.**

## Pre-read (rule-index → UI / layout / component task + state boundary)

- `docs/agent-contract.md` (esp. clauses 3, 5, 11, 12) + `docs/backlog.md` + `docs/critical-flow-registry.md`
  (the "Listings date-range filter" row from Task 558 — baseline it, keep it green).
- `docs/mantine-responsive-design-system.md` §7/§12/§16; `docs/ui-rules.md`; `docs/component-rules.md`;
  `docs/qa-rules.md`; `docs/state-authority.md` (URL-param ↔ query boundary — do not change SSR/CSR authority).
- Task 558 kickoff + the shipped `RangeDatePicker` API (`{from,to}`).

## Required after-behavior

- Each surface renders ONE `RangeDatePicker` in place of the two DatePickers. `value={{from: date_from, to:
  date_to}}`; `onChange` writes back BOTH `date_from` and `date_to` to the existing state/URL params atomically.
  `maxDate={today}` preserved (filters cannot pick future).
- The applied listings query is BYTE-IDENTICAL to today for the same selected dates (prove: pick from+to → same
  `date_from`/`date_to` params → same results). Clearing the range clears BOTH params.
- Layout: the range picker occupies the space of the former two fields; full-width `<640` (clause 11); the filter
  row/`FilterBar` reflow verified at all breakpoints × sq/en/uk/it.

## Positive flow

1) Open filters. 2) Range picker shows current `date_from`–`date_to` (from URL) or placeholder. 3) Pick a range →
Apply/Confirm → both params update → listings re-query with the same result set today's two-field flow produces.
4) The applied-filters summary/badges (if any) reflect the range.

## Negative flow

- **Clear** → both `date_from` + `date_to` cleared from state + URL; listings re-query unfiltered by date.
- **Only one bound** (if 558 permits a single-day range) → maps to `date_from===date_to`; if 558 disables single-
  bound apply, the params are untouched until both set. Match 558's chosen behavior exactly; state it.
- **Back/forward + deep link** → a URL already carrying `date_from`/`date_to` hydrates the range picker correctly
  (SSR authority preserved per `state-authority.md`).
- **`maxDate` (today)** → future days not selectable (inherited from 558).
- **Locale switch** → labels/summary reflect locale at runtime.
- **Empty state / no results** for a valid range → existing empty-state renders unchanged.

## Regression coverage (clause 15)

Baseline the Task-558 "Listings date-range filter" registry row on the CURRENT two-field behavior BEFORE the swap
(record green), then extend it to the single-picker flow. RTL/integration smoke: a URL with `date_from`+`date_to`
hydrates the picker; applying a range sets both params; clearing removes both; results query identical to the two-
field baseline for the same dates. Planted-violation transcript (e.g. drop the `date_to` write → assertion FAILS).
**Do not close without automated proof the pre-existing filter behavior is preserved.**

## Rendered evidence (clauses 12/13)

Rendered matrix for both `FiltersPanel` and `ListingsFilters` at the canonical breakpoints × sq/en/uk/it (uk@320/
375/390 mandatory): range picker full-width `<640`, filter row reflow correct, no clip/no h-scroll at 320. §18.9
visual: the trigger's calendar icon ↔ text gap, no blank trigger. If the surfaces have Storybook coverage, update
those stories; otherwise app-route rendered evidence.

## Acceptance criteria

1. Both `FiltersPanel` + `ListingsFilters` use ONE `RangeDatePicker`; the two legacy `DatePicker` date_from/date_to
   instances removed from these surfaces; no raw `<button>`/`<select>` introduced.
2. `{from,to}` ↔ `date_from`/`date_to` mapping is atomic + lossless; applied query BYTE-IDENTICAL to today for the
   same dates (evidence pasted); clear removes both params.
3. Deep-link/back-forward hydration preserved (SSR authority unchanged).
4. Mobile `<640` full-width; all breakpoints × sq/en/uk/it verified; no h-scroll at 320.
5. Registry row baselined + extended; integration smoke + planted-violation transcript present.
6. i18n parity for any changed strings; `check:i18n` green.
7. Gates: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens -- --strict`, `check:mojibake`,
   `check:file-integrity` green; rendered matrix + §18.9 pasted; Files-Changed table present. **Do NOT run git —
   HELD for orchestrator review.**

## Out of scope

`RangeDatePicker` internals (Task 558); admin suspension (Task 560); changing the backend listings query contract or
the `date_from`/`date_to` param names; other filter controls on these surfaces.

---

## 🔴 ORCHESTRATOR REVIEW — 2026-07-08 — CHANGES REQUESTED (not approved, held; git NOT emitted)

**Diff reviewed against the real files (Read tool), not the report. The wiring is CORRECT on the merits** — I
verified every point below directly:

- Both surfaces now render ONE `RangeDatePicker`; the two legacy `DatePicker` (`date_from`/`date_to`) instances are
  gone; no raw `<button>`/`<select>` introduced. ✅ (AC 1)
- Atomic write confirmed in the diff: `FiltersPanel` → `onChange={next => update({date_from: next.from, date_to:
  next.to})}` (one merge); `ListingsFilters` → `onChange={next => updateParams({date_from: next.from ?? null,
  date_to: next.to ?? null})}` (one `router.push`). `{from,to}` ↔ params is lossless (both ISO `yyyy-MM-dd`); clear
  (trigger X → `onChange({undefined,undefined})`) removes both. ✅ (AC 2)
- Deep-link hydration paths present; SSR/CSR authority untouched. ✅ (AC 3)
- `maxDate={today}` preserved on both; `disablePastDates` correctly NOT passed (listings-search context). ✅
- i18n: no new strings; `common.period` present in all four locales at line 435 (verified), `RangeDatePicker`'s own
  keys parity-checked. ✅ (AC 6)
- Regression: 6/6 RTL tests mount the REAL components + planted-violation transcript; registry row extended. ✅ (AC 5)
- Scope clean (3 files + 1 test + registry + backlog); no orchestrator-authored product code.

**BLOCKER — AC 4 / clause 12 / clause 13 rendered-evidence gate is NOT satisfied.** This kickoff mandated a rendered
matrix for BOTH surfaces at "canonical breakpoints × sq/en/uk/it (uk@320/375/390 mandatory)". The session log
delivered only **uk@320 + en@1440** and argues the rest by inheritance from Task 558/561. Inheritance-by-argument is
exactly the "primitive is class-correct on paper" shortcut the owner rejected in Sprint 32 — the reflow of the picker
*inside* these two filter containers (long `sq`/`it` section titles — "Periudha e postimit" / "Periodo di
pubblicazione" — in the `SectionHeader` / `AccordionSection`, accordion open-state at 375/390) is a genuinely new,
unproven question. `tsc=0`/gates-green is not style/render proof.

**To close (evidence-only — do NOT change the wiring, it is approved as-is):** capture the missing rendered cells for
BOTH `FiltersPanel` and `ListingsFilters` — **uk@375, uk@390 (mandatory stress cells), and sq + it at ≥1 mobile
(320/375) and ≥1 desktop width** — via the real dev server, confirming: picker trigger full-width `<640`, no clip /
no h-scroll at 320, the `<640` bottom sheet full-width, section title wraps (no clip) at long `sq`/`it`, §18.9
icon↔text gap clean. Paste the completed matrix into the session log, then re-submit for a fresh diff-less evidence
review. No new task number — this is a Task 559 evidence completion (kickoff edited per the prompt-hand-off rule).
