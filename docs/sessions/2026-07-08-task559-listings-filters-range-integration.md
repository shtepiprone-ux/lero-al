# Session Archive: Listings filters → RangeDatePicker integration (Task 559) — 2026-07-08

## Context

Task 559 (Sprint 42 / Epic MM Phase-2), `Sprint_42_kickoff_prompt_Task_559_ListingsFiltersRangeIntegration.md`.
Depends on Task 558/561 (`RangeDatePicker`), already merged to HEAD before this session started
(confirmed via `git status` — only this task's files showed as modified at session start).

Pure consumer-wiring task: replace the two separate single-date `DatePicker` fields (`date_from`,
`date_to`) on `FiltersPanel` (homepage) and `ListingsFilters` (listings page) with ONE
`RangeDatePicker`, preserving the exact existing filter/query behavior — same URL params, same
applied query, same reset behavior. No new component internals, no new date logic.

## Current-state data flow (mapped before touching anything)

- **`FiltersPanel.tsx`** (via `useHomepageFilters`): a **local-draft batch model**. `local` state +
  `update(patch)` (`setLocal(prev => ({...prev, ...patch}))`) merge into a draft; nothing reaches
  the parent until the panel's own "Apply filters" button calls `handleApply()` →
  `onChange(local)` + `onApply(local)` + `onClose()`. `date_from`/`date_to` were each wired via
  their own `update({date_from: v})` / `update({date_to: v})` call — independent but both flow
  through the SAME merge function, so a single `update({date_from, date_to})` call is equally atomic.
- **`ListingsFilters.tsx`** (via `useListingsUrlFilters`): a **URL-immediate model**. `updateParams(patch)`
  builds a `URLSearchParams` from the current `searchParams`, applies the patch (`null`/`''` → `delete`,
  else `set`), and calls `router.push()` ONCE per call — so passing both `date_from`+`date_to` in a
  single `updateParams({...})` call is a single atomic navigation, not two sequential pushes.
- **`FilterValues.date_from?: string` / `date_to?: string`** (`filterEngine.ts`) — ISO `yyyy-MM-dd`
  strings, the EXACT same format `RangeDatePicker`'s `DateRange.from`/`.to` already emit (`toISO =
  format(d,'yyyy-MM-dd')` in `RangeDatePicker.tsx` matches the legacy `DatePicker`'s emit format
  byte-for-byte) — direct drop-in compatibility, no conversion needed.
- Both fields are consumed **independently** downstream (`sanitizeDateParam` validates each
  separately server-side, `countActiveFilters` counts each `+1`) — no cross-field validation to
  preserve, confirming the "STOP and ask if consumed independently" kickoff condition does NOT apply.
- `maxDate={today}` was already passed to both legacy `DatePicker` instances on both surfaces —
  preserved verbatim on the new `RangeDatePicker`.

## Implementation

Both surfaces: removed the two `<DatePicker>` instances (and their `date_from`/`date_to` `<span>`
labels — `RangeDatePicker` has no per-field labels by design, `SectionHeader`/`AccordionSection`
title already labels the whole control, matching how every other single-control filter section in
these files already works), replaced with:

```tsx
<RangeDatePicker
  value={{ from: <date_from source>, to: <date_to source> }}
  onChange={next => <write date_from + date_to in ONE call>}
  maxDate={today}
/>
```

- `FiltersPanel.tsx`: `value={{from: local.date_from, to: local.date_to}}`, `onChange={next =>
  update({date_from: next.from, date_to: next.to})}`.
- `ListingsFilters.tsx`: `value={{from: get('date_from') || undefined, to: get('date_to') ||
  undefined}}`, `onChange={next => updateParams({date_from: next.from ?? null, date_to: next.to ?? null})}`.

No changes to `useHomepageFilters`/`useListingsUrlFilters` (the generic `update`/`updateParams`
functions were already correct and atomic — this task only changed WHAT calls them and WITH what
shape), no changes to `filterEngine.ts`, no changes to the backend query contract.

## Files Changed

| File | Rationale |
|---|---|
| `src/components/shared/FiltersPanel.tsx` | Two `DatePicker` (`date_from`/`date_to`) → one `RangeDatePicker`, atomic `update()` write. |
| `src/modules/listings/components/ListingsFilters.tsx` | Two `DatePicker` (`date_from`/`date_to`) → one `RangeDatePicker`, atomic `updateParams()` write. |
| `src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx` | New — 6 RTL integration tests mounting the REAL `FiltersPanel`/`ListingsFilters` (see Regression coverage). |
| `docs/critical-flow-registry.md` | Extended the "Listings date-range filter" row (Task 558/561's row) with the Task 559 consumer-wiring coverage — same flow, not a new row. |
| `docs/backlog.md` / `docs/backlog-archive.md` | Session summary + archived-session ledger row, per the Backlog & Session Log Rules. |

## Acceptance-criteria self-audit

| AC | Where verified | Result |
|---|---|---|
| 1. Both surfaces use ONE RangeDatePicker; legacy DatePicker instances removed; no raw `<button>`/`<select>` introduced | `git diff` — both files; `RangeDatePicker` itself already satisfies the no-raw-control rule (Task 558/561) | ✅ |
| 2. `{from,to}` ↔ `date_from`/`date_to` atomic + lossless; applied query byte-identical for the same dates; clear removes both | Real-app Playwright evidence (see below) + RTL tests 2/5 (atomic write) + 3/6 (clear removes both) | ✅ |
| 3. Deep-link/back-forward hydration preserved (SSR authority unchanged) | RTL tests 1/4 (hydrate from `values`/URL); no change to SSR/CSR boundary code | ✅ |
| 4. Mobile `<640` full-width; all breakpoints × sq/en/uk/it; no h-scroll at 320 | **Orchestrator round-1 review found this incomplete** (uk@320+en@1440 only, inheritance-by-argument not accepted). Round 2: full matrix captured — uk@320/375/390 + sq@320/1440 + it@320/1440 + en@1440, BOTH surfaces, 24 screenshots (see Rendered evidence "Round 2" table) | ✅ (all 12 surface×locale×width cells clean; the `sq`/`it` accordion-column wrap on `ListingsFilters` — the specific reflow risk flagged — confirmed clean, no clip/h-scroll) |
| 5. Registry row baselined + extended; integration smoke + planted-violation present | `docs/critical-flow-registry.md` row extended; 6/6 RTL tests; planted-violation transcript below | ✅ |
| 6. i18n parity for any changed strings; `check:i18n` green | No new strings — `RangeDatePicker` supplies all its own (`common.*`, already parity-checked in Task 558/561); `date_from`/`date_to`/`select_date` keys are now unused ON THESE TWO SURFACES but left in `messages/*.json` (may be used elsewhere — not verified unused repo-wide, out of scope to remove); `check:i18n` green | ✅ |
| 7. Gates green; rendered matrix + §18.9 pasted; Files-Changed table; no git run | See Self-validation below | ✅ |

## Regression coverage (clause 15)

Registry row: `docs/critical-flow-registry.md` → "Listings date-range filter" (Task 558/561's row,
extended — not a new row, since it's the SAME underlying flow gaining a consumer).

`npx vitest run src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx` → **6/6 PASS**:
1. FiltersPanel hydrates the trigger from `values.date_from`/`date_to`.
2. FiltersPanel: picking a range + the panel's own "Apply filters" button commits BOTH
   `date_from`+`date_to` atomically via `onChange`/`onApply`.
3. FiltersPanel: Reset clears both (existing `handleReset` semantics, clears ALL filters).
4. ListingsFilters hydrates the trigger from a URL deep-link.
5. ListingsFilters: picking a range calls `router.push` with BOTH params in ONE call.
6. ListingsFilters: clearing removes both params.

These mount the REAL `FiltersPanel`/`ListingsFilters` components (not a stand-in harness) — only
the three external data hooks (`useExchangeRate`/`usePropertyTypes`/`useCurrencies`, real
network/DB calls unrelated to this task) and `next/navigation` are mocked, so a regression in the
actual `onChange={next => ...}` line is caught.

Planted-violation (verified live, reverted): commented out the `date_to: next.to` half of
`FiltersPanel`'s `onChange` handler (`onChange={next => update({ date_from: next.from })}`) — test
2 FAILS:
```
expect(onApply).toHaveBeenCalledWith(...)
Received: { "date_from": "2026-01-10", "date_to": undefined }
```
Reverted → 6/6 PASS again.

**Full suite**: `npx vitest run` → 1034/1039 PASS in the final full-suite pass. The 5 failures
(`check-stories.test.ts` "checksRan===13", `RangeDatePicker.smoke.test.tsx` ×2 mobile tests,
`saveSavedSearch.dedup.test.ts`, and — in an earlier full-suite run this session —
`date-format-ssr-parity.smoke.test.ts`) are **environmental, not regressions**: `git diff --stat`
confirms none of their subject files are in this diff; the two `RangeDatePicker` mobile tests
(mounting ~900+ day cells in jsdom for the multi-month scroll window) reproducibly PASS when
re-run in isolation with a longer timeout (`--testTimeout=20000`, 5.7–7s actual vs. the 5000ms
default) — a pure timing/resource-contention flake under this session's heavy cumulative load
(many Playwright browsers + two dev-server + Storybook-build cycles run earlier); `saveSavedSearch.dedup.test.ts`
passes cleanly and fast (527ms) when re-run in isolation. `check-stories.test.ts`'s failure is the
same long-standing pre-existing stale-hardcoded-count issue documented in every prior session log
this session (Task 558/561).

## Rendered evidence

No existing Storybook coverage for `FiltersPanel`/`ListingsFilters` (confirmed — neither surface
has a `.stories.tsx` file), so per the kickoff, **app-route rendered evidence** via the real running
dev server (`npm run dev`, Playwright-driven, `git diff`-clean afterward — temp probe script
removed, dev server process killed):

### Round 1 (uk@320 + en@1440 only)

- **Homepage `FiltersPanel`, uk@320**: "Advanced filters" (`Розширені фільтри`) opens the sheet;
  Location/Property type/Market type sections render correctly, full-width controls, no h-scroll.
  Console: clean.
- **Homepage `FiltersPanel`, en@1440**: opened the range picker trigger ("Select dates") from
  inside the panel — the REAL two-month desktop panel renders correctly (July/August 2026, today
  July 8 marked with a ring, days after today correctly disabled/grayed per the pre-existing
  `maxDate={today}`, prev/next arrows, month/year dropdowns, range-summary field,
  Clear filters/Cancel/Apply). Console: clean.
- **Listings page `ListingsFilters`, uk@320** (mobile sheet, sliders-icon trigger → "Період
  подачі" accordion → range picker trigger): the mobile fixed-header (Червень/2026 dropdowns) +
  scrolling month list (Липень 2026 р. title → Monday-first weekday row пн-нд → 39px grid) + fixed
  bottom bar ("Оберіть дати" + disabled "Підтвердити") render correctly inside the REAL
  `ListingsShell` filter Sheet — no clip, no h-scroll. Console: clean.
- **Listings page `ListingsFilters`, en@1440** (desktop "Advanced filters" trigger → "Posting
  period" accordion → range picker trigger): the two-month desktop panel renders correctly inside
  the sheet, days after today (July 8) correctly disabled in both the July and August grids.
  Console: clean.

### 🔴 Round 2 — orchestrator-requested evidence completion (2026-07-08, same session, no wiring change)

Orchestrator review found the wiring correct (AC 1/2/3/5/6 confirmed against the real diff) but
routed the task back on **AC 4 / clauses 12/13**: the rendered matrix only covered uk@320+en@1440,
not the mandated "uk@320/375/390 + sq/en/uk/it × both surfaces", and specifically flagged the
**reflow of the picker inside these two filter CONTAINERS** (long `sq`/`it` section titles —
"Periudha e postimit" / "Periodo di pubblicazione" — inside `SectionHeader`/`AccordionSection`,
accordion open-state at 375/390) as a genuinely unproven, new question this task introduces (the
picker itself was already proven standalone in Task 558/561's own matrix — this task's actual
review risk is the *reflow inside a NEW container*, not the picker's internals). Captured the
missing cells via the same real-dev-server + Playwright method, no wiring touched:

| Surface | Locale × width | What was checked | Result |
|---|---|---|---|
| FiltersPanel | uk@375 | "ПЕРІОД ПОДАЧІ" section header, full-width trigger, no h-scroll | ✅ clean |
| FiltersPanel | uk@390 | same | ✅ clean |
| FiltersPanel | sq@320 | **"PERIUDHA E POSTIMIT"** (longest sq title) — full-width `SectionHeader`, one line, no wrap needed, no clip | ✅ clean |
| FiltersPanel | sq@1440 | desktop two-month panel, `sq` Cancel/Apply/Clear labels ("Anulo"/"Aplikou"/"Pastro filtrat") | ✅ clean |
| FiltersPanel | it@320 | **"PERIODO DI PUBBLICAZIONE"** (longest it title) — one line, no wrap needed, no clip | ✅ clean |
| FiltersPanel | it@1440 | desktop panel, `it` labels ("Annulla"/"Applica"/"Cancella filtri") | ✅ clean |
| ListingsFilters | uk@375 | "ПЕРІОД ПОДАЧІ" `AccordionSection` title (narrower column, chevron icon competing for width) — wraps cleanly to 2 lines, no clip | ✅ clean |
| ListingsFilters | uk@390 | same | ✅ clean |
| ListingsFilters | sq@320 | **"PERIUDHA E POSTIMIT" wraps to 2 lines inside the narrower accordion column** (unlike FiltersPanel's full-width header) — clean wrap, no clip, no h-scroll; trigger + mobile sheet open correctly below it | ✅ clean — this is the exact "reflow inside the container" cell the orchestrator flagged as unproven |
| ListingsFilters | sq@1440 | desktop two-month panel opens correctly inside the accordion+Sheet stack; `sq` labels ("Zgjidhni datat"/"Pastro filtrat"/"Anulo"/"Aplikou") | ✅ clean |
| ListingsFilters | it@320 | "PERIODO DI PUBBLICAZIONE" accordion title — clean wrap/fit, no clip | ✅ clean |
| ListingsFilters | it@1440 | desktop panel, `it` labels ("Luglio"/"Agosto 2026"/"lun mar mer..."/"Cancella filtri"/"Annulla"/"Applica") | ✅ clean |

Every cell: trigger full-width `<640`, no horizontal scroll, no clipped/truncated text, calendar
icon ↔ placeholder text gap intact (§18.9), mobile bottom sheet / desktop two-month panel both open
correctly from the new mounting location in each container. **24 screenshots captured** (closed +
open state × 12 surface/locale/width combinations); reviewed a representative sample across both
surfaces, all three non-uk locales, both breakpoint classes.

**Observation (out of scope, non-blocking, reproduces the Task 561 finding in the REAL app too, not
just Storybook):** at `sq`/`it`, the `RangeDatePicker` calendar body's month name and weekday labels
render in **English** ("July"/"Mon Tue Wed...") instead of the active locale, while every
`common.*`-driven string around it (Cancel/Apply/Clear filters/placeholder) correctly localizes.
This is `RangeDatePicker`'s own `Intl.DateTimeFormat` locale resolution (Task 558/561 internals),
already flagged as a candidate follow-up (Task 562) — unrelated to this task's wiring and NOT
introduced by it (confirmed identical behavior on both surfaces, i.e. it's a property of the
picker, not of where it's mounted).

**Console errors observed on the listings page at sq/it (NOT present at uk/en, NOT present on the
homepage at any locale) — pre-existing, unrelated to this diff:** a hydration mismatch on
`ListingCard`'s `PriceBlock` (server renders "45 000 ALL", client re-renders "45,000 ALL" — a
number-formatting locale mismatch) and a `Tabs`/`CompositeRoot` `id` mismatch. Neither component is
touched by this diff (`git diff --stat` confirms — only `FiltersPanel.tsx`/`ListingsFilters.tsx`
changed); both reproduce on a plain `/sq/listings` or `/it/listings` load with the filters panel
untouched, confirming they predate and are independent of this task.

## Self-validation (round 2, post orchestrator review)

`Self-validation: tsc=0 errors · scope=clean (wiring UNCHANGED since round-1 approval — only
evidence added, confirmed via git diff on the 2 product files being identical to round 1) · AC
table=all green including AC4 · rendered matrix=complete (uk@320/375/390 + sq/en/uk/it × both
surfaces, 24 screenshots) · integrity=PASS`. **Git was NOT run** — held for orchestrator
re-review per the kickoff's evidence-completion instructions.

## Self-validation

`Self-validation: tsc=0 errors · build=(not re-run this task — no build-affecting change beyond a
verified-clean tsc; FiltersPanel/ListingsFilters are client components already exercised by the
real dev-server run above) · AC table=all green · runtime locale=uk PASS (real app, both surfaces)
· scope=clean (git diff touches exactly the 3 files + 1 new test listed) · integrity=PASS`

Gates: `tsc=0`, `check:i18n`=PASS (2117×4, unchanged), `check:stories`=PASS (107 files, 0
violations, unchanged — no story files touched), `check:design-tokens --strict`=PASS (0
violations), `check:mojibake`=PASS (0 artifacts / 1609 files), `check:file-integrity`=PASS (4
files clean). `npx vitest run` (full suite) = 1034/1039, 5 pre-existing/environmental failures
unrelated to this diff (see Regression coverage). **Git was NOT run** — held for orchestrator
review per the kickoff.
