# Session Archive: Legacy `DatePicker.tsx` runtime-ICU fix (Task 565) — 2026-07-09

## Context

Task 565, `tasks/Sprints/Sprint_42_kickoff_prompt_Task_565_DatePickerRuntimeICUFix.md`. Opened from
the Task 564 orchestrator review (2026-07-09): the grep sweep in that task left
`src/components/shared/DatePicker.tsx` as the last remaining site calling `Intl.DateTimeFormat` with
a runtime `locale` variable. Owner decision (2026-07-09): fix it now as a standalone task rather than
waiting for the Task 557 Mantine rebuild, so 557 proceeds on already-clean code.

## Root cause

Already verified by Tasks 562/563/564 and re-confirmed for this component's exact call sites (Node
full-ICU vs. real headless-Chromium probe, per the kickoff's instruction to verify but not
re-litigate): `Intl.DateTimeFormat('sq', ...)` renders correct Albanian on the Node server but
Chromium's bundled ICU has no `sq` locale data at all (`supportedLocalesOf(['sq'])` → `[]`), silently
falling back to `en-GB` in the browser — causing the weekday row, month/year header, and "Today —"
label to render English on the client while the server rendered Albanian.

Directly re-verified the kickoff's data table with Node before implementing (weekdays, `monthLabel`
for July 2026, and `todayLabel` for July 9 across all 4 locales) — all four locales matched the
kickoff's provided literals exactly, including the `uk` genitive `todayLabel` ("9 липня") and the
sq/it/uk lowercase `monthLabel` forms. Also verified the full 12-month `calendar_months_formatting`
arrays for all 4 locales against Node — all matched the kickoff-provided arrays exactly.

## Implementation

**`messages/{en,uk,sq,it}.json`** — added one new key, `common.calendar_months_formatting` (12-element
array, day-bound/formatting-case long month names), placed immediately after the existing
`calendar_months` key in each file (adjacent to the other `calendar_*` keys, per the kickoff's
placement instruction). No existing `calendar_*` key renamed, removed, or reordered. Values are the
exact arrays specified in the kickoff, independently re-verified against Node's
`Intl.DateTimeFormat(locale, {day:'numeric',month:'long'})` output for all 12 months.

**`src/components/shared/DatePicker.tsx`**:
- Added `CalendarLocaleData` + `useCalendarLocaleData(t)` — mirrors `RangeDatePicker.tsx`'s
  `useCalendarLocaleData` shape exactly (reads `t.raw('calendar_months')` /
  `calendar_months_formatting` / `calendar_weekdays_short` / `calendar_month_year_suffix` /
  `calendar_summary_order` from the `common` namespace). This is a local helper in `DatePicker.tsx`
  (not a cross-file import of `RangeDatePicker`'s non-exported local) — the DATA is reused, not the
  function.
- **Weekday row**: `weekdays = cal.weekdaysShort` — direct reuse, no composition needed (already
  Monday-first, index-for-index identical to the prior `Intl` output).
- **Month/year header**: `` monthLabel = `${cal.monthsNominative[m]} ${year}${cal.monthYearSuffix}` ``
  — the existing `capitalize` CSS class on the header `<span>` is unchanged and still does the visual
  first-letter uppercase; the underlying DOM text stays lowercase for sq/it/uk (matching what the CSS
  class already normalized before this fix — zero visual change, confirmed byte-identical to the
  Node-verified literals above).
- **Today label**: composed per `calendar_summary_order` from the new `calendar_months_formatting`
  array (`` `${month} ${day}` `` for `month_day` locales, `` `${day} ${month}` `` otherwise) — this
  call site has no `capitalize` class, so the array stores the exact ICU-emitted case.
- Removed the `useLocale` import (no longer needed — `locale` was only ever passed into the three now-
  removed `Intl.DateTimeFormat` calls) and all three raw `Intl.DateTimeFormat(locale, ...)` calls.
- Zero change to date-fns logic (day-grid generation, `format(day, 'yyyy-MM-dd')`, `maxDate`/disabled-
  day logic, selection/clear/today-shortcut handlers), popover/button chrome, widths, or the
  `capitalize` class — formatter-logic-only, per the kickoff's explicit scope boundary (Task 557 owns
  the eventual Mantine/TailAdmin restyle).

## Grep sweep (Note 14 / AC 3)

`grep -rn "new Intl\.(Number|DateTime)Format(" src/` after this diff:

```
src\modules\notifications\lib\emails\PasswordChangedEmail.tsx:21:  const dateStr = new Intl.DateTimeFormat('sq-AL', {
src\modules\notifications\lib\emails\PasswordChangedEmail.tsx:28:  const timeStr = new Intl.DateTimeFormat('sq-AL', {
```
(plus 2 harmless code-comment mentions in test files, not real calls). **Exactly matches the kickoff's
predicted end-state** — `PasswordChangedEmail.tsx` is the standing justified exception (hardcoded
`'sq-AL'`, server-only `react-email` render, never hydrated in a browser, no SSR/CSR boundary to
diverge across). Every runtime-`locale` `Intl.*` call site in the app is now eliminated.

## Files Changed

| File | Rationale |
|---|---|
| `src/components/shared/DatePicker.tsx` | Removed all 3 `Intl.DateTimeFormat(locale,...)` calls (weekday row, month/year header, today label); added `useCalendarLocaleData` (mirrors `RangeDatePicker.tsx`'s pattern) sourcing static `common.calendar_*` data instead. |
| `messages/en.json`, `messages/uk.json`, `messages/sq.json`, `messages/it.json` | New `common.calendar_months_formatting` key (12-element array), placed adjacent to the other `calendar_*` keys. |
| `src/components/shared/__tests__/DatePicker.localization.test.tsx` | New — mounts the real `DatePicker` OPEN under real `sq`/`uk` `NextIntlClientProvider`s with `Intl.DateTimeFormat` monkey-patched to throw, asserting the localized weekday/month/today-label text. |
| `docs/critical-flow-registry.md` | Extended the "Admin user detail loads" row's coverage note (Task 565 DatePicker localization now regression-covered) rather than inventing a new flow group, per the kickoff's instruction. |

## Acceptance-criteria self-audit

| AC | Where verified | Result |
|---|---|---|
| 1. No hydration mismatch from `DatePicker` at any locale — console-clean on `/sq/admin/users/[id]` | Live-authenticated admin-route capture is **owner-run only** (no real admin auth cookies available in this session — matches the existing registry precedent for this exact route, Task 448's note). Mechanism-level proof instead: the vitest test mounts the REAL component and proves it makes zero calls that could diverge (Intl.DateTimeFormat monkey-patched to throw, component still renders correctly) — the strongest proof achievable without live credentials | ✅ (mechanism-level; live route capture flagged as owner-run, consistent with existing precedent) |
| 2. All three surfaces byte-identical server↔client at en/uk/sq/it, matching the kickoff's extracted literals | Independently re-verified all of the kickoff's literals against Node before implementing (weekdays, monthLabel, todayLabel, full 12-month `calendar_months_formatting` arrays) — all matched exactly, confirming the static data is correct | ✅ |
| 3. `grep` sweep confirms ONLY `PasswordChangedEmail.tsx` remains | See "Grep sweep" above — pasted, matches exactly | ✅ |
| 4. `calendar_months_formatting` added to all 4 locales; `check:i18n` green; no existing key renamed | `check:i18n` → 2123 keys × 4, parity PASSED. `git diff` on the 4 message files shows only the one new line inserted per file, no other `calendar_*` key touched | ✅ |
| 5. Regression test + planted-violation; registry updated | 2 RTL tests, planted-violation verified for all 3 call sites individually (see below); "Admin user detail loads" row extended | ✅ |
| 6. Gates green; per-file integrity; Files-Changed table; git NOT run | See Self-validation | ✅ |

## Regression coverage (clause 15)

Registry row: `docs/critical-flow-registry.md` → "Admin user detail loads" (extended with the Task 565
DatePicker-localization note, per the kickoff's instruction not to invent a new flow group).

`npx vitest run src/components/shared/__tests__/DatePicker.localization.test.tsx` → **2/2 PASS**:
1. `sq`: mounts the REAL `DatePicker` open under a REAL `sq` `NextIntlClientProvider`, with
   `Intl.DateTimeFormat` monkey-patched to throw — asserts the weekday header shows `hën` (never
   `Mon`), the month/year header matches the exact Albanian literal composed from the same
   `messages/sq.json` data the component reads, and the today label shows the correct
   `<day> <formatting-month>` with no English month name anywhere.
2. `uk`: same shape, additionally asserts the today label uses the **genitive** form (`9 липня`) and
   explicitly NOT the nominative form (`9 липень`) — a sanity check first confirms `uk`'s genitive
   and nominative arrays actually differ (guards against a vacuously-true assertion), then locates the
   today button and checks its exact text.

**Planted-violation (verified live for EACH of the 3 call sites individually, reverted after each)**:
1. Reverted `weekdays` to `Array.from({length:7}, (_,i) => new Intl.DateTimeFormat('sq',
   {weekday:'short'}).format(...))` → both tests genuinely **FAIL** — the monkey-patched
   `Intl.DateTimeFormat` throws synchronously inside the component body, crashing the mount:
   `Error: simulated broken/incomplete ICU locale data` at `DatePicker.tsx:75`. Reverted → 2/2 PASS.
2. Reverted `monthLabel` to `new Intl.DateTimeFormat('sq', {month:'long',year:'numeric'}).format(...)`
   → both tests genuinely **FAIL** identically (crash at `DatePicker.tsx:76`). Reverted → 2/2 PASS.
3. Reverted `todayLabel` to `new Intl.DateTimeFormat('sq', {day:'numeric',month:'long'}).format(...)`
   → both tests genuinely **FAIL** identically (crash at `DatePicker.tsx:78`). Reverted → 2/2 PASS.

**No existing suite regressed**: full `npx vitest run` → 1074/1075 PASS. The 1 failure
(`check-stories.test.ts` "checksRan===13") is the same pre-existing/environmental failure already
documented in the Task 563/564 session logs — confirmed unrelated (this diff touches none of that
test's subject files). The other 3 flaky timeout failures seen in prior sessions
(`RangeDatePicker.smoke.test.tsx` ×2, `saveSavedSearch.dedup.test.ts`) did not reproduce this run,
consistent with them being timing/resource-contention flakes, not deterministic failures.

## Self-validation

`Self-validation: tsc=0 errors · check:i18n=PASS (2123 keys ×4, +1 new common.calendar_months_formatting
key per locale, no existing key touched) · check:design-tokens --strict=PASS (0 violations) ·
check:mojibake=PASS (0 artifacts/1623 files) · check:file-integrity=PASS (6 files clean) · npx vitest
run=1074/1075 (1 pre-existing/environmental failure, confirmed unrelated; 3 previously-seen flaky
timeout failures did not reproduce this run) · new test file 2/2 PASS · planted-violation verified
individually for all 3 call sites (each genuinely crashed the mount under the broken-Intl simulation),
reverted → 2/2 PASS each time · grep sweep: only PasswordChangedEmail.tsx (×2, justified) remains ·
registry row extended (Admin user detail loads) · scope=clean (git diff touches exactly
DatePicker.tsx + 4 message files + 1 new test file + 1 registry-doc row + backlog.md) · root cause
re-confirmed via direct Node computation matching the kickoff's provided literals exactly for all 3
call sites across all 4 locales (not blindly trusted) · zero structural/style/chrome change (popover,
button, day-cell `<button>`, widths, `capitalize` class all untouched — confirmed via `git diff`) ·
DatePicker's ONE consumer (`AdminUserProfile.tsx`) confirmed unchanged, no other file's imports
touched`. **Git was NOT run** — held for orchestrator review per the kickoff's AC 6.

**Note on live route evidence**: a fully-authenticated `/sq/admin/users/[id]` Playwright capture (the
strongest possible proof) requires real admin auth cookies not available in this session — this
matches the EXISTING registry precedent for this exact route (Task 448: "full ✅ requires owner auth
run with real user UUID"). The mechanism-level vitest proof above (mounting the real component with
`Intl.DateTimeFormat` broken) is the strongest evidence achievable without live credentials, and
directly demonstrates the fix's core claim: the component no longer depends on the runtime's ICU
completeness at all.
