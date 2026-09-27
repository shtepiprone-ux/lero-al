# Task 885 — the whole site tells time in 24 hours, and English dates are day-first

Sprint 84 · **P2** · QA profile **Q4** (critical flows "Date-format SSR/CSR match" and "Listings display") ·
**blocked on 892 · 893 · 894 · 895 · 896 (Sprint 84) and 859 · 877 (Sprint 78)** ·
**Status: `KICKOFF FILED` 2026-09-27 — do not start until the §10.1 I0 gate passes**

Sprint plan: [`Sprint_84_One_Clock_And_One_Date_Order.md`](Sprint_84_One_Clock_And_One_Date_Order.md). Reserved
2026-09-25 while designing Task 860; the reserved row's text moves into §3. Moved from Sprint 78 on 2026-09-27.

## 1. Mode and task type

`IMPLEMENTATION`. A change to the canonical date layout, one options line on one screen, their tests, and a
repo-wide guard. Bundles: **Regression / Critical Flow Coverage** (plus **Auth / Email** for the one email test).

**Visible-surface classification.** The text of dates and times changes on visible surfaces; no markup, style,
component, Story or locale key changes. Clause 16d still applies to every surface whose text changes. Owner
decision **D84-1** (2026-09-27, option chosen: **"Migrate first"**) grants no exception: every surface in §3.4 must
pass its census before this task runs (§10.1). GR-0, GR-3 and GR-3a: no component, Story or visual value is created
or changed. GR-3b/GR-3c: no element's width, role or size changes (§12, type-scale note).

## 2. Objective

1. `formatDate`, `formatDateTime`, `formatDateTimeInZone` and `formatDateOnly` render the 24-hour clock in `sq`,
   `en`, `uk`, `it` and the unknown-locale fallback. No output contains `AM`, `PM`, `p.d.` or `m.d.`.
2. `en` numeric dates are day-first, `DD/MM/YYYY` (the `it` layout). `sq`, `uk` and `it` keep their order and
   separator.
3. The admin permissions audit log shows its time in 24 hours.
4. A guard test in CI fails on any 12-hour output of the canonical formatters, on month-first `en`, and on any
   `timeStyle` or string-valued `hour` option in `src` without `hourCycle: 'h23'` or `hour12: false` in the same object.

## 3. Verified context — measured 2026-09-27 (re-measure at I0)

### 3.1 Owner decisions (Sprint 84 plan)

- **D84-0** (2026-09-25, verbatim): *"у Європі ми використовуємо 24 години, а не 12 годин!"*
- **D84-1** (2026-09-27): chosen option **"Migrate first"**. There is no 16d exception; the migrations come first.
- **D84-2** (2026-09-27): chosen option **"Day-first too"**. `en` numeric dates become day-first.
- **D84-3** (2026-09-27): chosen option **"Everything in 885"**. The clock and the `en` order ship together.

### 3.2 The canonical layout (FACT, `git show HEAD:src/lib/formatters.ts`)

- `DATE_FORMAT` (`:88-98`) has one entry per locale:
  - `en: { order: 'mdy', separator: '/', hour12: true, dayPeriod: ['AM', 'PM'] }`;
  - `uk: { order: 'dmy', separator: '.', hour12: false }`;
  - `sq: { order: 'dmy', separator: '.', hour12: true, dayPeriod: ['p.d.', 'm.d.'] }`;
  - `it: { order: 'dmy', separator: '/', hour12: false }`.
- An unknown locale falls back to `en` (`?? DATE_FORMAT.en`, `:101`, `:109`).
- `composeTimeParts(hours, minutes, locale)` (`:108-114`) holds the only 12-hour branch.
- `composeDateParts` (`:100-106`) is shared by `formatDate` (`:126`), `formatDateTime` (`:145`) and
  `formatDateTimeInZone` (`:172`), and by 854's `formatDateOnly` (uncommitted today; lands with 891).
- `formatListingDate`, `formatShortDate`, `formatMonthAbbrev`, `formatFullDate`, `formatMonthFull` and
  `formatWeekdayShort` do not read `DATE_FORMAT`. They follow `calendar_*` messages and are out of scope (§8).

### 3.3 Other time formatting in `src` (FACT)

`git grep -n -E "\b(timeStyle|hour)\s*:\s*['\"]" -- src ':!*.test.*' ':!**/__tests__/**'`:

| Site | Options | 24-hour today? |
|---|---|---|
| `src/components/admin/AdminPermissionsManager.tsx:185-188` | next-intl `format.dateTime(…, { dateStyle: 'medium', timeStyle: 'short' })` | **No.** Measured: `en` `Mar 29, 2026, 3:30 PM`, `sq` `29 mar 2026, 3:30 m.d.`. With `hourCycle: 'h23'` added: `en` `Mar 29, 2026, 15:30`, `sq` `29 mar 2026, 15:30`, `uk` `29 бер. 2026 р., 15:30`, `it` `29 mar 2026, 15:30`; midnight renders `00:30` |
| `src/lib/formatters.ts:208` (`formatDateTimeInZone`) | `hour: 'numeric'` with `hourCycle: 'h23'` | yes |
| `src/lib/dashboard/period.ts:83` | `hour: 'numeric'` with `hourCycle: 'h23'` | yes |
| `src/modules/notifications/lib/emails/PasswordChangedEmail.tsx:30` | `hour: '2-digit'` with `hour12: false` | yes |

`AdminEmailTemplatesManager.tsx:439` calls `toLocaleDateString()` with no time. No `toLocaleTimeString`, and no
Mantine `TimeInput` or `DateTimePicker`, exists in `src`.

### 3.4 Surfaces whose text changes, and their census (FACT, `node scripts/check-surface-census.mjs --surface …`)

| Surface | What changes | Unmigrated nodes today | Owner |
|---|---|---|---|
| `src/app/admin/permissions/page.tsx` | audit-log time | `AdminPermissionsManager`; `ui/badge`, `ui/switch` | **892** |
| `src/app/admin/users/[id]/page.tsx`, `src/app/admin/users/new/page.tsx` | change-log and status-history times; `suspended_until` date (`en`) | `AdminUserProfile`, `AdminEditLayout`, `AdminInput`, `AdminUserAvatar`, `Combobox`, `DatePicker`; eight `ui/*` | **893** |
| `src/app/admin/inquiries/sales/page.tsx`, `…/support/page.tsx` | inquiry dates (`en`) | `AdminInquiriesManager`, `StatusChangeControl`, `StatusChangeHistory`, `Combobox`, `AdminPageHeader`; four `ui/*` | **894**, **877** |
| `src/app/[locale]/cabinet/page.tsx` | `Member since`, `Last seen` (`en`) | `CabinetShell`, `ListingsTab`, `ProfileTab`, `SavedSearchesTab`, `RecentlyViewedSection`, `RecentlyViewedGrid`, `ClearRecentlyViewedButton`, `AdminUserAvatar`, `Combobox`; seven `ui/*` | **895** |
| `src/app/admin/users/page.tsx` | created / last-seen dates (`en`) | root `page.tsx` has 8 `className`; `AdminUsersTable` not in the manifest | **896** |
| `src/app/admin/support/page.tsx` | ticket dates (`en`) | `AdminSupportManager`, `AdminTable`, `AdminCardList`, `AdminPageHeader`, `Combobox`; five `ui/*` | **859**, **877** |
| `src/app/admin/page.tsx` | `RelativeTime` absolute labels | none: only its own root `page.tsx` | — |
| `src/app/[locale]/cabinet/statistics/page.tsx` | absolute labels and `formatDateOnly` dates | none: only its own root `page.tsx` | — |

**Calibration.** The census prints one `FAIL … [tier1-unenrolled-or-unstoried]` line for every root `page.tsx`, even
on a migrated route. `src/app/admin/page.tsx` (853, approved) exits 1 with that one line and no other. "Passes" in
§10.1 therefore means: **no `FAIL` line except the surface's own root `page.tsx`**.

### 3.5 Tests that pin today's output (FACT, `git grep`)

| File | Line(s) | Today | After |
|---|---|---|---|
| `src/lib/__tests__/date-format-icu-independence.smoke.test.ts` | 42 | `en: '06/15/2026'` | `en: '15/06/2026'` |
| same | 55, 57 | `en: '01/01/2026, 12:30 AM'`, `sq: '01.01.2026, 12:30 p.d.'` | `en: '01/01/2026, 00:30'`, `sq: '01.01.2026, 00:30'` |
| same | 88-102 | the "12h vs 24h" describe: `01:05 PM`, `01:05 m.d.`, `12:00 AM`, `12:00 p.d.` | one 24-hour describe: `en` `01/01/2026, 13:05`, `sq` `01.01.2026, 13:05`; midnight `en` `01/01/2026, 00:00`, `sq` `01.01.2026, 00:00`; `uk`/`it` lines unchanged |
| `src/lib/__tests__/date-format-ssr-parity.smoke.test.ts` | 31, 47, 48 | `en: '06/15/2026'`, `sq: '… 12:30 p.d.'`, `en: '… 12:30 AM'` | `en: '15/06/2026'`, `sq: '01.01.2026, 00:30'`, `en: '01/01/2026, 00:30'` |
| `src/lib/__tests__/formatDateTimeInZone.test.ts` | 16-18 | 12-hour describe: `09/18/2026, 03:30 PM`, `18.09.2026, 03:30 m.d.` | `en` `18/09/2026, 15:30`, `sq` `18.09.2026, 15:30`; title says 24-hour |
| same | 20-23 | midnight `en` `09/19/2026, 12:00 AM` | `19/09/2026, 00:00`; title drops "12:00 AM in 12h locales" |
| same | 25 | `xx` → `09/18/2026, 10:05 AM` | `18/09/2026, 10:05` |
| `src/lib/dashboard/__tests__/period.test.ts` | 255, 256 | `en` `09/18/2026, 10:05 AM`, `sq` `18.09.2026, 10:05 p.d.` | `18/09/2026, 10:05`, `18.09.2026, 10:05` |
| `src/lib/__tests__/formatters.test.ts` (854's, after 891 lands) | 20, 59 | `formatDateOnly('2026-08-01','en')` → `'08/01/2026'` | `'01/08/2026'` |
| `src/modules/notifications/lib/emails/__tests__/emailChange.test.ts` | 47, 65 | `toContain('29.03.2026, 01:30 p.d.')` | `toContain('>29.03.2026, 01:30</td>')`, plus `not.toContain('p.d.')`. The closing tag is required: `'29.03.2026, 01:30'` alone is also a substring of the old 12-hour text. |

Every "After" value was derived from the §3.2 code with `hour12` removed and `en.order = 'dmy'`. The executor proves
each one red-first (§10.2).

### 3.6 Where these tests run in CI (FACT)

`.github/workflows/governance-pr.yml` runs `npm run test:i18n-hydration` (`:83`), which runs only
`date-format-ssr-parity.smoke.test.ts` and `i18n-render-parity.smoke.test.tsx` (`package.json:17`). It also runs
`test:auth` (`:68`), which includes `emailChange.test.ts` since 860. `date-format-icu-independence`,
`formatDateTimeInZone.test.ts` and `period.test.ts` are in no CI script.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | D84-0 | `DATE_FORMAT` loses `hour12` and `dayPeriod` from its type and every entry. `composeTimeParts` returns `${pad2(hours)}:${pad2(minutes)}` for every locale (drop the `locale` parameter and update its two callers in the file). The doc comments in `formatters.ts` that mention 12-hour output, `AM` or day-periods say 24-hour. | P1 | AC1, AC4 | Confirmed |
| **R2** | D84-2 | `DATE_FORMAT.en` becomes `{ order: 'dmy', separator: '/' }`. If no locale uses `'mdy'` any more, narrow the `order` type to `'dmy'` and delete the `'mdy'` branch in `composeDateParts`. Update the `formatDate` doc comment's `en: MM/DD/YYYY` example. | P1 | AC1, AC4 | Confirmed |
| **R3** | D84-0, §3.3 | The audit-log `format.dateTime` options in the permissions screen gain `hourCycle: 'h23'`. After 892 the call may live in a new View. Find it at I0 with the §3.3 grep; nothing else in that file changes. | P1 | AC2 | Confirmed (site re-located at I0) |
| **R4** | §3.5 | Every test in §3.5 asserts the "After" value. Test titles that say 12-hour say 24-hour. No other assertion changes. | P1 | AC3 | Confirmed |
| **R5** | Objective 4 | New `src/lib/__tests__/clock-24h.test.ts`. **G1:** for `sq`, `en`, `uk`, `it` and `xx`, and for every UTC hour 0–23 at minute 7 on 2026-01-15, `formatDateTime` and `formatDateTimeInZone(…, 'UTC')` end in `, HH:07`, where `HH` is the zero-padded hour, and contain none of `AM`, `PM`, `p.d.`, `m.d.`. **G2:** `formatDate('2026-01-15T12:00:00.000Z', 'en')` is `'15/01/2026'`. **G3:** reads every non-test, non-story `src/**/*.{ts,tsx}` through `fs`. For each match of `/\b(timeStyle\|hour)\s*:\s*['"]/`, it takes the innermost enclosing `{…}` by brace matching. It asserts that the object contains `hourCycle: 'h23'` or `hour12: false`. A failure names the file and the line. G3 also asserts that at least one match was found. | P1 | AC4, AC5 | Confirmed |
| **R6** | §3.6 | `package.json` `test:i18n-hydration` gains `clock-24h.test.ts`, `date-format-icu-independence.smoke.test.ts` and `formatDateTimeInZone.test.ts`, so CI runs them. | P1 | AC6 | Confirmed |
| **R7** | agent-contract 15 | `docs/critical-flow-registry.md`: the "Date-format SSR/CSR match" row (`:116`) command cell becomes the new `test:i18n-hydration` file list, and its coverage cell gains one note: *"Task 885: 24-hour clock in every locale, `en` day-first; `clock-24h.test.ts` guards output and Intl options."* The "Listings display" row (`:62`) coverage cell gains *"Task 885: `en` numeric dates day-first."* No other cell changes. | P2 | AC6 | Confirmed |

## 5. Assumptions and open questions

1. **Month-name dates are not changed.** `formatListingDate` and its siblings follow `calendar_summary_order` (`en`
   `month_day`, e.g. `Jun 15, 2026`). D84-2 was asked with the numeric example `09/18/2026`. Changing month-name
   order is a new owner decision and a new number (Sprint 84 plan → "Explicitly not in this sprint").
2. **`en` and `it` numeric layouts become identical** (`DD/MM/YYYY`, `/`). That is the effect of D84-2, not a defect.
3. **Text gets shorter, never longer.** `03:30 PM` → `15:30` and `03:30 m.d.` → `15:30`, and the day-first `en` date is
   the same length. No layout risk is expected. Any layout effect is caught by the owner check (§13.3).
4. **Hydration.** The layout stays composed from `Date` parts. No new runtime `Intl` call is added on the client, so
   the Task 563 parity reasoning is unchanged. The audit-log call is a client `next-intl` call and was already
   locale-data-dependent. Adding `hourCycle` does not change that dependency.

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: GR-1, GR-2, GR-4, GR-5, GR-6.
- `docs/agent-contract.md`: clauses 1, 3, 7, 9, 10, 14, 15, 16d.
- `docs/rule-index.md`: "Regression / Critical Flow Coverage"; "Auth / Email / Account Lifecycle" for the email test.
- `docs/qa-profiles.md`: `Q4`. `docs/qa-rules.md`.
- `docs/critical-flow-registry.md`: rows "Date-format SSR/CSR match" and "Listings display".
- `docs/orchestrator-procedures.md` → the 818/819 corollary (Node I/O, hash witnesses).
- `tasks/Sprints/Sprint_84_One_Clock_And_One_Date_Order.md`.

## 7. Scope — the exact allowed write set

1. `src/lib/formatters.ts` (R1, R2 only)
2. the file that holds the audit-log `format.dateTime` call (R3; one options line)
3. the six test files in §3.5 (R4 only)
4. `src/lib/__tests__/clock-24h.test.ts` (new, R5)
5. `package.json`: the `test:i18n-hydration` string only
6. `docs/critical-flow-registry.md`: the two rows in R7 only
7. `docs/sessions/<date>-task885-24-hour-clock.md`, `docs/sessions/evidence/task885/*`
8. `docs/backlog.md`: the 885 cell only

## 8. Out of scope

- Month-name date functions and `messages/*.json` `calendar_*` keys (§5.1).
- Any markup, style, Story or locale key on the §3.4 surfaces. Their migrations belong to 892–896, 859 and 877.
- `PasswordChangedEmail.tsx` and `period.ts` (already 24-hour; G3 guards them).
- `AdminEmailTemplatesManager.tsx:439` (`toLocaleDateString()`, date only, runtime-locale). It is noted, not changed.

## 9. Current and required behavior

| Situation | Current | Required after |
|---|---|---|
| `formatDateTime('2026-01-01T13:05Z', 'sq')` | `01.01.2026, 01:05 m.d.` | `01.01.2026, 13:05` |
| `formatDateTime('2026-01-01T13:05Z', 'en')` | `01/01/2026, 01:05 PM` | `01/01/2026, 13:05` |
| `formatDate('2026-06-15T12:00Z', 'en')` | `06/15/2026` | `15/06/2026` |
| midnight, `en` / `sq` | `12:00 AM` / `12:00 p.d.` | `00:00` |
| `uk`, `it` output | 24-hour, day-first | unchanged |
| unknown locale | `en` layout, 12-hour | `en` layout, now 24-hour and day-first |
| permissions audit log | `3:30 PM` / `3:30 m.d.` | `15:30` |
| email-change security notice | `29.03.2026, 01:30 p.d.` | `29.03.2026, 01:30` |
| invalid or empty input | `—` | unchanged |

## 10. Implementation requirements

### 10.1 I0 — gate first; stop if it fails

1. `node.exe -p "process.platform + ' ' + process.version + ' ' + process.versions.icu"` → must start `win32`.
2. `git --no-optional-locks status --porcelain` → `01-status-before.txt`, plus the `git hash-object` of each modified
   path → `01b-hash-before.txt`.
3. **Shared-path gate.** `git --no-optional-locks status --porcelain src/lib/formatters.ts src/lib/__tests__/formatters.test.ts`
   must print nothing (854's hunks committed with 891). Otherwise stop with `BLOCKED — SHARED PATH`, naming the files.
4. **Census gate (D84-1).** Run the census for every surface in §3.4 (block below) → `02-census.txt`. Every surface
   must print no `FAIL` line other than its own root `page.tsx`. Otherwise stop with `BLOCKED — D84-1`, and quote each
   remaining node and the number that owns it.
5. Re-run the §3.3 grep → `03-time-options.txt`. Record where the audit-log call now lives. Any new site without
   `hourCycle: 'h23'` or `hour12: false` goes into the report and must fail G3 in the red run.
6. Re-run the §3.5 inventory: `git --no-optional-locks grep -n -E "p\.d\.|m\.d\.|[0-9] (AM|PM)|'(0[1-9]|1[0-2])/[0-3][0-9]/20[0-9]{2}" -- "src/**/__tests__/**" "src/**/*.test.*" "src/**/*.stories.*"`
   → `04-literals.txt`. Any hit not in §3.5 is reported and handled under R4 only if it pins formatter output.
   Otherwise stop and report it.
7. Baseline: `npm.cmd run test:i18n-hydration` and the five other §3.5 test files → `05-tests-before.txt`
   (exit 0 expected).

```powershell
$ev = "docs\sessions\evidence\task885"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\permissions\page.tsx *>&1 | Tee-Object "$ev\02-census.txt"
node.exe scripts\check-surface-census.mjs --surface "src\app\admin\users\[id]\page.tsx" *>&1 | Tee-Object -Append "$ev\02-census.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\users\new\page.tsx *>&1 | Tee-Object -Append "$ev\02-census.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\users\page.tsx *>&1 | Tee-Object -Append "$ev\02-census.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\inquiries\sales\page.tsx *>&1 | Tee-Object -Append "$ev\02-census.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\inquiries\support\page.tsx *>&1 | Tee-Object -Append "$ev\02-census.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\support\page.tsx *>&1 | Tee-Object -Append "$ev\02-census.txt"
node.exe scripts\check-surface-census.mjs --surface "src\app\[locale]\cabinet\page.tsx" *>&1 | Tee-Object -Append "$ev\02-census.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\page.tsx *>&1 | Tee-Object -Append "$ev\02-census.txt"
node.exe scripts\check-surface-census.mjs --surface "src\app\[locale]\cabinet\statistics\page.tsx" *>&1 | Tee-Object -Append "$ev\02-census.txt"
```

Expected: each block's `FAIL` lines are only the root `page.tsx` it was run on.

### 10.2 Order

I0 → R4 + R5 written first and run against the **unchanged** `formatters.ts` and audit-log file → `06-red.txt`. Every
§3.5 assertion fails on its 12-hour or month-first value. G1 and G2 fail. G3 fails, naming the audit-log file.
→ R1, R2, R3 → green → plants → R6, R7 → gates → report.

### 10.3 Plants (each transcript holds the planted file's hash before the plant and after the restore)

| Plant | Edit | Must fail | Evidence |
|---|---|---|---|
| **P1** | `composeTimeParts`: temporarily put back the pre-885 12-hour branch for `sq` only (hours 0–11 → `p.d.`, 12–23 → `m.d.`, hour shown 1–12) | G1 names `sq`; the `sq` literals in §3.5 fail | `07-plant-p1.txt` |
| **P2** | `DATE_FORMAT.en.order` back to month-first (restore the `'mdy'` branch for this plant) | G2; the `en` date literals | `08-plant-p2.txt` |
| **P3** | remove `hourCycle: 'h23'` from the audit-log options | G3 names that file and line | `09-plant-p3.txt` |
| **P4** | remove `hourCycle: 'h23'` from `formatDateTimeInZone`'s `Intl.DateTimeFormat` options | G3 names `src/lib/formatters.ts` | `10-plant-p4.txt` |

Plant and restore through Node `fs` (818/819 corollary). Record the `git hash-object` before the plant and after the
restore. The two must be equal.

## 11. Positive and negative flows

**Positive.** An admin opens a user's change log, the permissions audit log and the inquiries list in `en` and `sq`.
A signed-in user opens `/cabinet` in `en`. Every time reads `HH:MM` in 24 hours, and every `en` numeric date is
`DD/MM/YYYY`.

| Branch | Applicable? | Owner/source | Expected | Evidence |
|---|---:|---|---|---|
| Midnight and noon | **Yes** | R1 | `00:MM`, `12:MM`; never `24:MM` | G1, §3.5 midnight rows |
| Unknown locale | **Yes** | R1, R2 | the `en` layout, 24-hour, day-first | G1 (`xx`), `formatDateTimeInZone.test.ts:25` |
| Invalid, empty or null input | **Yes** | unchanged | `—` | existing tests stay green |
| Invalid time zone | **Yes** | unchanged | `—`, no throw | existing `formatDateTimeInZone` tests |
| A new 12-hour `Intl` option in any file | **Yes** | R5 G3 | test fails naming file and line | P3, P4 |
| A surface still carrying unmigrated components | **Yes** | D84-1 | task does not start | §10.1.4 |
| SSR/CSR mismatch | **Yes** | critical flow 445/563 | literals byte-identical, TZ-invariant | `test:i18n-hydration` |
| Locale / viewport rendering | No | text only, shorter or equal length | — | §13.3 owner check |

## 12. Acceptance criteria

- **AC1 [R1, R2]** Given `git diff src/lib/formatters.ts`, when read, then `DATE_FORMAT` has no `hour12` or
  `dayPeriod`, `en` is `order: 'dmy'`, `composeTimeParts` has no 12-hour branch, and the doc comments say 24-hour and
  day-first.
- **AC2 [R3]** Given the audit-log file's diff, when read, then the only change is `hourCycle: 'h23'` in that
  `format.dateTime` options object.
- **AC3 [R4]** Given the §3.5 files on the final tree, when run, then every "After" value passes. Given `06-red.txt`,
  then each of those assertions failed on the unchanged source with its old value.
- **AC4 [R5]** Given `clock-24h.test.ts` on the final tree, when run, then G1, G2 and G3 pass, and G3 reports at least
  one match. Given `06-red.txt` and `07`–`10`, then each plant fails the test the §10.3 table names. The restore then
  passes, and the two hashes are equal.
- **AC5 [R5]** Given G3's failure text under P3, when read, then it names the file and line of the offending object.
- **AC6 [R6, R7]** Given `package.json`, when `npm.cmd run test:i18n-hydration` runs, then it exits 0 and lists the
  three added files. Given the registry diff, then only the two R7 cells changed.
- **AC7 [all]** `npm.cmd run build`, `typecheck`, `lint`, `test:auth`, `check:file-integrity` and `check:mojibake`
  exit 0. `git status` shows no path outside §7 beyond the I0 snapshot.

`GR-4 AC AUDIT — 7 criteria; each states an observable property; absolutes: none.` (AC2's "only change" is the
one-line deliverable in that file.)

**Type-scale note (GR-3c).** No text element is added, and none changes its role, size or width. The strings only get
shorter or keep their length (§5.3). The surfaces' own type-scale tables belong to their migrations (892–896, 859,
877).

## 13. QA profile and verification plan

**Q4.** Reasons: two registered critical flows ("Date-format SSR/CSR match", "Listings display") change their
literals. Required: the baseline, red-then-green tests, planted failures, the build, and an owner check after deploy.

### 13.1 Re-entry

From scratch, after the §10.1 gate passes.

### 13.2 Final gate block (executor, Windows PowerShell, project root)

Plants first, by hand. Then:

```powershell
$ev = "docs\sessions\evidence\task885"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\11-platform.txt"
npx.cmd vitest run src/lib/__tests__/clock-24h.test.ts src/lib/__tests__/date-format-icu-independence.smoke.test.ts src/lib/__tests__/date-format-ssr-parity.smoke.test.ts src/lib/__tests__/formatDateTimeInZone.test.ts src/lib/dashboard/__tests__/period.test.ts src/lib/__tests__/formatters.test.ts src/modules/notifications/lib/emails/__tests__/emailChange.test.ts *>&1 | Tee-Object "$ev\12-tests.txt"
npm.cmd run test:i18n-hydration *>&1 | Tee-Object "$ev\13-test-i18n-hydration.txt"
npm.cmd run test:auth *>&1 | Tee-Object "$ev\14-test-auth.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\15-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\16-lint.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\17-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\18-mojibake.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\19-build.txt"
git --no-optional-locks hash-object src\lib\formatters.ts src\lib\__tests__\clock-24h.test.ts package.json docs\critical-flow-registry.md | Tee-Object "$ev\20-hash-object.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\21-status-after.txt"
```

Also append the `git hash-object` of the audit-log file and of each §3.5 test file to `20-hash-object.txt`. Their
paths are known only after I0.

Append `EXIT_CODE=$LASTEXITCODE` after each command. Normalise the `Tee-Object` files (UTF-16LE on Windows
PowerShell 5.1) to UTF-8 without BOM through Node before `check:file-integrity`. Stop any running Next server before
`build`.

Expected:
- `11` starts with `win32`.
- `12`–`19` exit 0.
- `21` has no path outside §7 beyond `01-status-before.txt`.

### 13.3 Owner-native check (after the approved change is deployed) — O84-1

1. In `en` and `sq`, open `/admin/permissions` and read one audit-log time.
2. In the same two locales, open `/admin/users/<id>` for a user with a change-log entry, and read one entry.
3. In `en`, open `/cabinet` and read `Member since`.
4. Read one email-change security notice.

Each time must read `HH:MM` in 24 hours, and each `en` numeric date must be day-first.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED` (`BLOCKED — SHARED PATH`
or `BLOCKED — D84-1` from I0). Never self-approved.

- the changed files with their `20-hash-object.txt` values;
- R1–R7 and AC1–AC7, each quoted;
- every command in §10.1, §10.3 and §13.2 with its real exit code;
- `02-census.txt` summarised per surface (the FAIL lines);
- where the audit-log call lives (§10.1.5);
- the red run (`06`), listing which assertions failed and on what value;
- the plant table with its hash pairs;
- assumptions, deviations and limitations;
- O84-1, stated as owed.

Sonnet updates the 885 cell of `docs/backlog.md` (state only), writes the session log with a "Files Changed" table,
and emits no git command.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | Yes: owner decisions quoted, every site, literal, surface and command is in this file |
| One active route | Yes: drop the 12-hour branch, `en` → `dmy`, one `hourCycle` line, guard; the owner decided there is no 16d exception, so the only branch is the I0 stop |
| Every requirement has a binary AC | R1/R2→AC1 · R3→AC2 · R4→AC3 · R5→AC4/AC5 · R6/R7→AC6 · all→AC7 |
| Two-armed control | red-first (`06`) and P1–P4. P3 and P4 prove G3 sees both an app file and a lib file |
| Detector blind spot stated | G3 sees string-valued `timeStyle`/`hour` options in non-test `src` source only. It cannot see options built at runtime or passed through a variable, or a 12-hour string produced by hand. G1/G2 cover the canonical formatters' output, not other code |
| Material absence claims traced | "No other 12-hour source": the §3.3 grep plus `toLocaleTimeString`/`TimeInput`/`DateTimePicker` searches (0 hits). "Month-name functions do not read `DATE_FORMAT`": read at HEAD (§3.2). All three are re-run at I0 |
| Dirty worktree handled | I0 snapshot and hashes; the shared-path gate stops on 854's uncommitted `formatters.ts` |
| Owner exception claimed | None. D84-1 refused the exception; §10.1.4 enforces it |

---

## Appendix A — Evidence preflight (task design)

| Claim | Source inspected | Status |
|---|---|---|
| `DATE_FORMAT` is 12-hour for `en`/`sq`, `en` month-first | `git show HEAD:src/lib/formatters.ts:88-114` | VERIFIED |
| next-intl `timeStyle: 'short'` is 12-hour in `en`/`sq`; `hourCycle: 'h23'` fixes all four locales | native `node` run 2026-09-27, ICU 78.2 | VERIFIED |
| No other 12-hour option in `src` | §3.3 grep, including untracked 854/889 files via `grep -r` | VERIFIED |
| Surfaces and their unmigrated nodes | `check-surface-census.mjs` on 10 surfaces, 2026-09-27 | VERIFIED |
| Root `page.tsx` always prints one FAIL | `src/app/admin/page.tsx` (853 approved): exit 1, one FAIL line, its own root | VERIFIED |
| CI coverage of the date tests | `governance-pr.yml:68,83`, `package.json:17` | VERIFIED |
| "After" literals | derived from the §3.2 code; each proven red-first by the executor | INFERENCE → proven at `06` |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Evidence | Result |
|---|---|---|---|
| 16d / GR-1 | no exception (D84-1); census gate before any write | §3.4, §10.1.4 | COMPLIANT |
| agent-contract 15 | both critical-flow rows get regression coverage and notes | R5–R7 | COMPLIANT |
| Q4 | baseline, red-first, plants, build, owner check | §10.1.7, §10.2, §10.3, §13 | COMPLIANT |
| agent-contract 7 | no locale key changes; all four locales asserted | G1, §3.5 | COMPLIANT |
| agent-contract 14 | Node I/O, hash witnesses | §10.3, §13.2 | COMPLIANT |
| GR-0 (non-visual) | canonical formatter changed at its owner; no parallel formatter | R1, R2 | COMPLIANT |

## Appendix C — Execution contract

| # | Checkpoint | Producer → artifact | Failure |
|---|---|---|---|
| 0 | Shared path clean | I0.3 | `BLOCKED — SHARED PATH` |
| 1 | Census | I0.4 → `02` | any non-root FAIL → `BLOCKED — D84-1` |
| 2 | Red-first | R4/R5 on unchanged source → `06` | a test green before R1–R3 → the test cannot see the defect |
| 3 | Plants | `07`–`10` | a plant passes → test defect |
| 4 | Gates | §13.2 | non-zero → `PARTIALLY IMPLEMENTED` |
| 5 | Owner | O84-1 | a 12-hour time or month-first `en` date after deploy → finding |
