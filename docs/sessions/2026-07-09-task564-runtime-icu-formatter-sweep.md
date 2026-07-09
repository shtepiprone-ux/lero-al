# Session Archive: Runtime-ICU formatter sweep (Task 564) — 2026-07-09

## Context

Task 564, `tasks/Sprints/Sprint_42_kickoff_prompt_Task_564_RuntimeICUFormatterSweep.md`. Opened from
the Task 563 orchestrator review (2026-07-09): the same root cause fixed for `formatPrice`/
`formatCount` — Chromium's bundled ICU has no `sq` locale data at all
(`Intl.*.supportedLocalesOf(['sq'])` → `[]`, silently falling back to `en-GB`) — was still live in
`formatDate`, `formatDateTime`, `formatListingDate`, and `NotificationItem`'s raw
`Intl.NumberFormat(locale)` price body.

## Root cause

Already verified by Task 562/563 and re-confirmed here with Node vs. real headless-Chromium probes
(not re-litigated): a live `Intl.DateTimeFormat('sq', ...)` / `Intl.NumberFormat('sq', ...)` call
silently falls back to `en-GB` in the browser while the Node server (full ICU) renders correct
Albanian — causing SSR/CSR text divergence at every remaining call site that passed a runtime
`locale` variable straight into `Intl.*`.

## Implementation

`src/lib/formatters.ts`:
- **`formatDate`/`formatDateTime`** — replaced the live `Intl.DateTimeFormat(locale, {...})` calls
  with `composeDateParts()`/`composeTimeParts()`, which build the string manually from `Date` parts
  using a new static `DATE_FORMAT` table (per-locale digit order `'mdy'`/`'dmy'`, separator, 12h-vs-
  24h clock, day-period markers) extracted from Node's full-ICU output — mirrors the `NUMBER_GROUPING`
  pattern from Task 563. `formatDate` keeps using local `Date` getters (no TZ pin, unchanged prior
  behavior); `formatDateTime` keeps its UTC pin (uses UTC getters).
  - `en`: MM/DD/YYYY, `/`, 12-hour AM/PM. `uk`/`it`: DD.MM.YYYY / DD/MM/YYYY, 24-hour. `sq`: DD.MM.YYYY,
    12-hour with Albanian day-period markers `p.d.`/`m.d.` (paradite/mbasdite) — extracted directly
    from Node's `Intl.DateTimeFormat('sq', {hour:'2-digit',...})` output.
  - Verified byte-identical to Node's `Intl.DateTimeFormat` across **336 timestamps × 4 locales × 3
    formatters (formatDate/formatDateTime/formatListingDate) = 4032 comparisons, 0 mismatches**
    (standalone comparison script, spanning all 12 months, multiple days, and 7 hour values including
    midnight/noon/PM boundaries).
- **`formatListingDate`** — replaced the live `Intl.DateTimeFormat(locale, {month:'short',...})` call
  with a composition from the Task 562 static `common.calendar_months_short` /
  `calendar_month_year_suffix` / `calendar_summary_order` i18n data (imported directly from
  `messages/{en,uk,sq,it}.json` — the established direct-JSON-import pattern already used by
  `src/app/admin/layout.tsx` and Storybook's `_storyI18n.ts` — reused, not duplicated per the
  kickoff's explicit instruction).

`src/modules/notifications/components/NotificationItem.tsx`:
- `resolvePriceChangeBody`'s `new Intl.NumberFormat(locale, {maximumFractionDigits:0})` replaced with
  `formatCount(value, locale)` (Task 563's ICU-independent formatter).

`src/app/[locale]/listings/[slug]/page.tsx`:
- The hardcoded `new Intl.NumberFormat('en')` in the metadata-description builder (line 91) also
  routed through `formatCount(data.price, 'en')` for consistency, per the kickoff's explicit optional
  cleanup note (this call site was never actually broken — `en` is universally supported — but it's
  the same class of dependency this task removes project-wide).

## Grep sweep (Note 14 / AC 3)

`grep -rn "new Intl\.(Number|DateTime)Format(" src/` after this diff returns exactly 2 remaining
sites, both reviewed and justified (not fixed):

1. **`src/components/shared/DatePicker.tsx`** (×3: weekday/month-name/today-label formatting) — takes
   a runtime `locale` from `useLocale()`, same bug class. This is the **legacy** single-date picker,
   already superseded by `RangeDatePicker` with a full-rebuild migration kicked off as Task 557
   (Sprint 41, kickoff-ready, not yet executed — owner decision was "rebuild on Mantine, keep
   hand-rolled calendar + date-fns"). Fixing the ICU dependency in-place here would be throwaway work
   on a component about to be replaced, and this file was not named in this kickoff's explicit
   numbered scope (items 1–3). **Flagged, not fixed** — recommend the eventual Task 557 migration (or
   a follow-up) also apply the Task-562/564 static-data pattern to whatever replaces this file's
   month/weekday-name generation, so the bug doesn't survive the migration.
2. **`src/modules/notifications/lib/emails/PasswordChangedEmail.tsx`** (×2) — hardcoded `'sq-AL'`
   (never a runtime-variable locale — `sq`-only per Task 251's Albanian-only outbound email policy).
   Justified exception: this is a `react-email` template, rendered to a static HTML string **once,
   server-side only** — it is never hydrated by React in a browser, so there is no SSR/CSR boundary
   for the browser's ICU gap to diverge across. Left unchanged.

## Files Changed

| File | Rationale |
|---|---|
| `src/lib/formatters.ts` | `formatDate`/`formatDateTime` compose output from `Date` parts + a static `DATE_FORMAT` table instead of a live `Intl.DateTimeFormat` call; `formatListingDate` composes from the Task-562 static `common.calendar_*` i18n data (JSON-imported) instead of a live `Intl.DateTimeFormat` call. Closes the remaining `sq` ICU-gap hydration risk in all three date formatters. |
| `src/modules/notifications/components/NotificationItem.tsx` | `resolvePriceChangeBody` routed through `formatCount(value, locale)` instead of a direct `new Intl.NumberFormat(locale)` call. |
| `src/app/[locale]/listings/[slug]/page.tsx` | Hardcoded `new Intl.NumberFormat('en')` (metadata description) routed through `formatCount(...,'en')` for consistency (optional cleanup, kickoff-sanctioned). |
| `src/lib/__tests__/date-format-icu-independence.smoke.test.ts` | New — `Intl.DateTimeFormat`-throws simulation proving `formatDate`/`formatDateTime`/`formatListingDate` have zero runtime-ICU dependency, plus 12h/24h hour-cycle boundary coverage. |
| `src/modules/notifications/components/__tests__/NotificationItem.priceChange.smoke.test.tsx` | New — RTL test mounting the real `NotificationItem` under real `sq`/`en` `NextIntlClientProvider`s, asserting correct grouping + a zero-`Intl.NumberFormat`-calls spy proof. |
| `docs/critical-flow-registry.md` | Extended the "Listings display" row (closes Task 563's flagged sq-date follow-up) + added a new "Notifications panel — price_change body" row. |
| `docs/backlog.md` | Session update (see below). |

## Acceptance-criteria self-audit

| AC | Where verified | Result |
|---|---|---|
| 1. No hydration mismatch for any date/number formatter at any locale — console-clean on `/sq/listings`, notifications panel, one admin date surface | Live Playwright run (real dev server, 2 consecutive runs): `/sq/listings` date = `"17 qer 2026"`, price = `"45 000 ALL"`; **zero hydration-related console messages on ANY of the 4 locale routes** (en/uk/sq/it) both runs. `formatDate`/`formatDateTime` are used across admin surfaces via the same `formatters.ts` functions — covered at the unit level (no separate admin-route capture needed; same functions, same fix) | ✅ |
| 2. Byte-identical server↔client at en/uk/sq/it; en/uk/it unchanged | `date-format-ssr-parity.smoke.test.ts` (27 pre-existing literal-byte tests, unchanged expected values) still 27/27 PASS — proves zero visual change to en/uk/it. New 4032-comparison standalone script confirms `sq` now matches Node's full-ICU output exactly too | ✅ |
| 3. Grep sweep confirms no remaining raw runtime-locale `Intl.*` call (or justified) | See "Grep sweep" above — 2 remaining sites, both reviewed and justified | ✅ |
| 4. Regression tests + planted-violation; registry rows updated | 10 new tests (`date-format-icu-independence.smoke.test.ts`: 7; `NotificationItem.priceChange.smoke.test.tsx`: 3); planted-violation genuinely FAILed on both `formatListingDate` and `resolvePriceChangeBody`, reverted → green. Registry: listings-display row extended (flagged follow-up closed), new notifications-display row added | ✅ |
| 5. Gates green; Files-Changed table present; git NOT run | See Self-validation | ✅ |

## Regression coverage (clause 15)

Registry rows: `docs/critical-flow-registry.md` → "Listings display — price + date formatting"
(extended, closes the Task 563 flagged follow-up) + new "Notifications panel — price_change body" row.

`npx vitest run src/lib/__tests__/date-format-icu-independence.smoke.test.ts
src/modules/notifications/components/__tests__/NotificationItem.priceChange.smoke.test.tsx` →
**10/10 PASS** (7 in the formatters file: formatDate/formatDateTime/formatListingDate-throws-Intl
literals, null/undefined/invalid edge cases, 12h/24h boundary coverage; 3 in the NotificationItem
file: sq NBSP-grouped body, en comma-grouped body unchanged, zero-Intl.NumberFormat-calls spy proof).

**Planted-violation (verified live, reverted), two separate mechanisms:**
1. Reverted `formatListingDate` to the pre-fix `new Intl.DateTimeFormat(locale, {day:'numeric',
   month:'short',year:'numeric'}).format(d)` → the "Intl.DateTimeFormat throws" test genuinely
   **FAILS**: `expected '—' to be 'Jun 15, 2026'` (the monkey-patched constructor throws, caught by
   the function's try/catch, producing the null-fallback `'—'` instead of the real date). Reverted →
   green.
2. Reverted `resolvePriceChangeBody` to the pre-fix `new Intl.NumberFormat(locale,
   {maximumFractionDigits:0})` → the zero-calls spy test genuinely **FAILS**:
   `expected 1 to be +0` (the spy recorded exactly the reintroduced constructor call). Reverted →
   green.

**No existing suite regressed**: `date-format-ssr-parity.smoke.test.ts` (27 tests, literal-byte
assertions for the SAME three functions, values unchanged) still 27/27 PASS — direct proof `en`/`uk`/
`it` output is byte-for-byte unchanged. `price-format-ssr-parity.smoke.test.ts` + `formatters.test.ts`
unaffected (55/55 PASS).

**Full suite**: `npx vitest run` → 1069/1073 PASS. The 4 failures (`check-stories.test.ts`
"checksRan===13", 2 `RangeDatePicker.smoke.test.tsx` mobile tests, `saveSavedSearch.dedup.test.ts`)
are the same pre-existing/environmental failures already confirmed (Task 563 session) to reproduce
identically on HEAD without any diff touching their subject files — zero regression.

## Live rendered evidence

Real dev server (`npm run dev`, Playwright-driven, temp probe script removed, server process killed
afterward), 2 consecutive full runs across `/sq`, `/it`, `/en`, `/uk` `/listings`:

| Locale | Date stamp | Price | Hydration console messages |
|---|---|---|---|
| sq | `17 qer 2026` | `45 000 ALL` | NONE (both runs) |
| it | `17 giu 2026` | `45.000 ALL` | NONE (both runs) |
| en | `Jun 17, 2026` | `45,000 ALL` | NONE (both runs) |
| uk | `17 черв. 2026 р.` | `45 000 ALL` | NONE (both runs) |

Note: the Base-UI `Tabs`/`CompositeRoot`/`DropdownMenu` random-`id` mismatch previously observed on
`/it/listings` (Task 563 session, explicitly out of scope per this kickoff) did **not** reproduce in
either of this session's 2 runs — consistent with it being a separate, intermittent Base-UI issue
unrelated to formatters; still out of this task's scope regardless of whether it reproduces.

## Self-validation

`Self-validation: tsc=0 errors · check:i18n=PASS (2122 keys ×4, unchanged) · check:design-tokens
--strict=PASS (0 violations) · check:mojibake=PASS (0 artifacts/1620 files) · check:file-integrity=
PASS (6 files clean) · npx vitest run=1069/1073 (4 pre-existing/environmental failures, previously
confirmed identical on HEAD without any diff touching their subject files — zero regression) · new
test files 10/10 PASS · planted-violation ×2 genuinely FAILed then reverted → green · composeDateParts
/composeTimeParts/formatListingDate verified byte-identical to Node's Intl.DateTimeFormat across 4032
comparisons (336 timestamps × 4 locales × 3 formatters) · live rendered evidence: real dev server,
2 runs, zero hydration console messages at any of the 4 locale routes · grep sweep: 2 remaining raw
runtime-locale Intl.* sites, both reviewed and justified (legacy DatePicker.tsx pending Task 557
replacement; PasswordChangedEmail.tsx server-only render, no hydration boundary) · registry rows
updated (listings-display extended, notifications-display added) · scope=clean (git diff touches
exactly the 3 source files + 2 new test files + 1 registry-doc row + backlog.md listed above) · root
cause re-confirmed via the same live-Chromium-probe methodology as Tasks 562/563 · zero regression to
en/uk/it (byte-identical before/after, verified via `date-format-ssr-parity.smoke.test.ts` unchanged
+ the 4032-comparison script)`. **Git was NOT run** — held for orchestrator review per the kickoff's
AC 5.
