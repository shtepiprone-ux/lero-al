# Session Archive: `RangeDatePicker` calendar-body localization fix (Task 562) — 2026-07-08

## Context

Task 562 (Sprint 42 / Epic MM Phase-2), `Sprint_42_kickoff_prompt_Task_562_RangeDatePickerCalendarLocalization.md`.
Origin: found during the Task 559 round-2 rendered-evidence review — the calendar body rendered
month/weekday names in English at `sq` in the real app (not just Storybook), while every
surrounding `common.*`-driven string localized correctly. Split out as its own task per the
kickoff (out of scope for 559's wiring).

## Root cause (verified directly, not assumed)

The kickoff flagged the Task 559 evidence log as internally inconsistent (it@1440 showed correct
Italian, but the observation claimed both sq/it broke) and required reproducing per-locale before
assuming which locales actually break. Tested directly:

- **Node** (`node -e "new Intl.DateTimeFormat('sq',{month:'long'}).format(...)"`) → `"korrik"` —
  full, correct Albanian ICU data present server-side.
- **The actual runtime that matters** — a headless Chromium page (`page.evaluate(() =>
  Intl.DateTimeFormat.supportedLocalesOf(['sq']))`) → `[]`. Chromium's bundled ICU has **no
  Albanian locale data at all**; `it`/`uk` ARE supported (`Intl.DateTimeFormat('it',{month:'long'})`
  → `"luglio"`, correct). Since `RangeDatePicker`'s calendar body only mounts on click (inside
  `MantinePopover`), it never renders during SSR — the browser's `Intl` is the ONLY runtime that
  ever formats these strings, and it silently falls back to English for `sq` specifically. `it` was
  never actually broken (the Task 559 note was a misreading of a `sq`-only bug) — confirmed by this
  session's screenshots: `it` output is byte-identical before/after this fix.

This is candidate (b) from the kickoff ("the JS runtime genuinely lacks `sq` locale data") — but
scoped to the browser specifically, not Node. Per the kickoff's explicit instruction, rather than
branch on per-browser ICU support (fragile, untestable, and other browsers/versions may have
different gaps), **all four locales' calendar month/weekday names are now static data** —
byte-identical across every runtime by construction, the same "explicit locale in, fixed formatting
out" discipline `src/lib/formatters.ts` already documents for hydration-safety, just extended to
name-based (not digit-based) formatting where ICU completeness can't be trusted.

## Implementation

`src/design-system/mantine/patterns/RangeDatePicker.tsx`:
- Removed every `Intl.DateTimeFormat` call used for month/weekday **names** (the `useWeekdayLabels`
  hook, `DesktopBody`'s `monthFormatter`/`monthYearFormatter`, `MobileBody`'s
  `monthFormatter`/`monthYearFormatter`/`summaryFormatter`) and the now-unused `useLocale()` import
  entirely (nothing else in the file needed the raw locale string).
- Added `CalendarLocaleData` + `useCalendarLocaleData(t)`: reads `t.raw('calendar_months')` /
  `calendar_months_short` / `calendar_weekdays_short` / `calendar_month_year_suffix` /
  `calendar_summary_order` from the `common` namespace (`next-intl`'s `t.raw()` returns the JSON
  array/string as-is, no ICU message parsing needed for plain data).
- Added `formatMonthYearLabel(month, cal)` and `formatSummaryDate(d, cal)` — pure functions
  replacing the old `Intl` calls, built from the static arrays.
- `computeMonthOptions` now takes `months: string[]` instead of an `Intl.DateTimeFormat` instance.
- `DesktopBody`/`MobileBody` traded their `weekdays: string[]` + `locale: string` props for a
  single `cal: CalendarLocaleData` prop (passed once from `RangeCalendarBody`).
- No change to the public API (`RangeDatePickerProps`), the `{from,to}` contract, day-cell chrome
  (§6t), or anything the Task 559 consumer wiring touches.

`messages/{en,sq,uk,it}.json` — 5 new `common.*` keys each (added after `select_range`, before
`year_from` — same relative position in all 4 files):
- `calendar_months` (array[12], **lowercase** — `capitalizeFirst()` is applied uniformly in code,
  same as the previous `Intl` output for sq/it/uk which was already lowercase; en's own prior
  `Intl` output was already fully capitalized, and `capitalizeFirst` on an already-capitalized
  string is a no-op, so storing it lowercase too and relying on the same code path produces the
  identical "January" result).
- `calendar_months_short` (array[12], exact casing as extracted from the previously-working `Intl`
  output — en capitalized "Jan", others lowercase "gen"/"jan"/"січ." — no code-side transform).
- `calendar_weekdays_short` (array[7], Monday-first, exact casing as extracted).
- `calendar_month_year_suffix` (string) — `" р."` for `uk` (Ukrainian's genitive-case year marker,
  present in the prior `Intl.DateTimeFormat(locale,{month:'long',year:'numeric'})` output), `""`
  for the other three.
- `calendar_summary_order` (`"month_day"` for `en` — "Jul 15" — vs `"day_month"` for sq/uk/it —
  "15 lug"/"15 черв."/"15 korr" — matching each locale's prior `Intl` day+month ordering exactly).

Every value was extracted from a **Node reference run** of the previously-working `Intl` calls
(`new Intl.DateTimeFormat(locale,{month:'long'|'short', weekday:'short'}).format(...)` for all 12
months / 7 weekdays / both format combinations) BEFORE writing the static tables, specifically to
guarantee byte-identical output for the three locales that were already correct (en/it/uk) — this
fix changes `sq` output only.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/RangeDatePicker.tsx` | Replaced `Intl.DateTimeFormat` month/weekday-NAME formatting with static i18n-sourced data (see root cause) — no runtime ICU dependency for calendar strings. |
| `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json` | 5 new `common.calendar_*` keys each (months/monthsShort/weekdaysShort/yearSuffix/summaryOrder), extracted from the prior correct `Intl` output for en/it/uk, corrected to real Albanian for sq. |
| `src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx` | New — 2 RTL tests asserting the REAL rendered calendar text is localized (non-English) for sq/it. |
| `docs/critical-flow-registry.md` | Extended the "Listings date-range filter" row with the Task 562 fix + coverage. |

## Acceptance-criteria self-audit

| AC | Where verified | Result |
|---|---|---|
| 1. Month/weekday/monthYear/summary render in the active locale for en/it/sq/uk, desktop + mobile | Real-app screenshots, 4 locales × 2 breakpoints (8 captures) — see Rendered evidence | ✅ |
| 2. No hydration mismatch for any calendar text at any locale | Console-clean note per cell, all 8 captures — see Rendered evidence. Additionally: the calendar only mounts on client click (inside `MantinePopover`), never during SSR, so there is no server-text-vs-client-text pair to mismatch in the first place — confirmed by reading the component (no calendar JSX renders before the popover opens) | ✅ |
| 3. Root cause identified + stated; explicit documented fallback (no silent English) | See "Root cause" above — Chromium's bundled ICU lacks `sq` data (`supportedLocalesOf(['sq'])` → `[]`), verified directly via a headless-Chromium `page.evaluate`; fix is static i18n data for all 4 locales (not a runtime-detected fallback, an explicit unconditional replacement — stronger than "a fallback", removes the ICU dependency entirely) | ✅ |
| 4. Public API, `{from,to}` contract, §6t day-cell chrome, Task 559 wiring unchanged | `git diff` — `RangeDatePickerProps`, `DayCell`, `pickDay`, `commit()` all untouched; `FiltersPanel.tsx`/`ListingsFilters.tsx` not in this diff at all | ✅ |
| 5. Regression test asserts localized (non-English) sq/it labels + planted-violation | `RangeDatePickerLocalization.test.tsx`, 2/2 PASS; planted-violation below | ✅ |
| 6. Gates green | See Self-validation | ✅ |

## Regression coverage (clause 15)

Registry row: `docs/critical-flow-registry.md` → "Listings date-range filter" (extended, Task 562
detail appended to the existing Task 558/561/559 row — same underlying primitive).

`npx vitest run src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx`
→ **2/2 PASS**:
1. `sq`: mounts the REAL `RangeDatePicker` open under a REAL `sq` `NextIntlClientProvider` (loading
   the actual `messages/sq.json`, not a stub), asserts the right-month gray label matches the
   dynamically-computed Albanian month+year string (computed independently in the test from the
   SAME `messages/sq.json` data the component reads — so this proves the data source is correct
   Albanian, not just that the component echoes whatever it's given) and that no English month name
   appears anywhere; asserts the weekday header shows `"hën"` (Monday) and never `"Mon"`.
2. `it`: same shape, Italian.

**No re-run of the existing suites was skipped**: `RangeDatePicker.smoke.test.tsx` (14/14, all
pre-existing tests, `en` locale, unaffected) and `filtersRangeDatePicker.smoke.test.tsx` (6/6, Task
559's consumer-wiring tests, unaffected) both re-verified green after this diff — confirming zero
regression to the existing behavior this refactor touches the internals of.

Planted-violation (verified live, reverted): temporarily hardcoded `useCalendarLocaleData` to
always return the English `months`/`weekdaysShort` arrays regardless of the `t.raw()` locale data
(simulating "the fix silently reverted to English") — both new tests FAIL:
```
TestingLibraryElementError: Unable to find an element with the text: Korrik 2026 / Gusht 2026
TestingLibraryElementError: Unable to find an element with the text: Luglio 2026 / Agosto 2026
```
Reverted → 2/2 PASS again.

**Full suite**: `npx vitest run` → 1038/1041 PASS. The 3 failures
(`check-stories.test.ts` "checksRan===13", one `RangeDatePicker.smoke.test.tsx` mobile test,
`saveSavedSearch.dedup.test.ts`) are the same pre-existing/environmental flakes already documented
in the Task 558/561/559 session logs this session — `git diff --stat` confirms none of their
subject files are in this diff, and none involve calendar localization.

## Rendered evidence

Real dev server (`npm run dev`, Playwright-driven, temp probe script removed, server process killed
afterward), calendar OPEN (clicked from the homepage's "Advanced filters" `FiltersPanel` — the
same mounting host already verified for the picker's own rendering in Task 558/561/559), 8 captures:

| Locale | Width | Desktop/mobile | Result |
|---|---|---|---|
| en | 1440 | desktop | Unchanged — "July"→"January" family (via `calendar_months`), "Jul 15" order. Console clean. |
| sq | 1440 | desktop | **FIXED** — left dropdown "Korrik" (July), right label "Gusht 2026" (August), weekday row "hën mar mër enj pre sht die". Previously "July"/"August 2026"/"Mon Tue...". Console clean. |
| uk | 1440 | desktop | Unchanged — "Липень" (July), right label **"Серпень 2026 р."** (the genitive `" р."` suffix preserved byte-identically), weekday row "пн вт ср чт пт сб нд". Console clean. |
| it | 1440 | desktop | Unchanged — "Luglio", "Agosto 2026", "lun mar mer gio ven sab dom" — confirms `it` was never actually broken (the Task 559 note was a `sq`-only misreading). Console clean. |
| en | 375 | mobile | Unchanged. Console clean. |
| sq | 375 | mobile | **FIXED** — fixed-header dropdown "Qershor" (June), scrolling section title "Korrik 2026" (July), weekday row "hën mar mër enj pre sht die", bottom bar "Zgjidhni datat"/"Konfirmo". Console clean. |
| uk | 375 | mobile | Unchanged. Console clean. |
| it | 375 | mobile | Unchanged. Console clean. |

§18.9 / clause 12 note: this is a text-content fix, not a layout change — no new clip/overflow risk
introduced (every string is drawn from the same position the prior `Intl` output occupied); all 8
captures confirm no clip/h-scroll regardless.

## Self-validation

`Self-validation: tsc=0 errors · check:i18n=PASS (2122 keys ×4, +5 new common.calendar_* keys per
locale) · check:stories=PASS (107 files, 0 violations) · check:design-tokens --strict=PASS (0
violations) · check:mojibake=PASS (0 artifacts/1613 files) · check:file-integrity=PASS (8 files
clean) · npx vitest run=1038/1041 (3 pre-existing/environmental failures, none touching this diff)
· AC table=all green · runtime locale=sq+it+uk+en all PASS (real app, both breakpoints) · scope=
clean (git diff touches exactly the 4 files + 4 message files + 1 new test listed) · root cause
stated and verified directly (not assumed) · zero regression to en/it/uk (verified byte-identical
before/after) · integrity=PASS`. **Git was NOT run** — held for orchestrator review per the
kickoff's AC 6.
