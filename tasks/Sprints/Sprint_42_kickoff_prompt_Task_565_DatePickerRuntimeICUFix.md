# Task 565 — Remove runtime-ICU-dependent `Intl.DateTimeFormat` from legacy `DatePicker.tsx`

**Type:** Bug-fix / hydration + i18n (product code). **Executor:** Sonnet 4.6.
**Origin:** Opened from the Task 564 orchestrator review (2026-07-09). Task 564's grep sweep left
`src/components/shared/DatePicker.tsx` as the **last** remaining site calling `Intl.DateTimeFormat`
with a runtime `locale` variable — the same **Chromium-lacks-`sq`-ICU** root cause
(`Intl.DateTimeFormat.supportedLocalesOf(['sq'])` → `[]`, silent `en-GB` fallback) fixed in Tasks
562 (calendar names) / 563 (grouping) / 564 (date/count formatters). Owner decision (2026-07-09):
fix it **now as a standalone task**, do NOT wait for the Task 557 Mantine rebuild — 557 then proceeds
on already-clean code, and the new i18n data this task adds is reused by 557.
**Critical flow:** `DatePicker` is used on the **admin user detail** surface → clause 15 regression
coverage is in scope (registry row "Admin user detail loads … no hydration/date-format mismatch").

## Root cause (already verified — do not re-litigate, just fix)

`Intl.DateTimeFormat('sq', …)` renders correct Albanian on the Node server (full ICU) but silently
falls back to `en-GB` in Chromium (bundled ICU has **no** `sq` data at all). `DatePicker.tsx` makes
three such calls with the runtime `useLocale()` value, so on `/sq` (and any browser-unsupported
locale) the weekday row, month/year header, and "Today —" label render English on the client while
the server rendered Albanian → **SSR/CSR hydration mismatch** + wrong-language admin UI.

## Current consumers (verified 2026-07-09)

`DatePicker` has exactly **ONE** consumer: `src/components/admin/AdminUserProfile.tsx:29`
(the two `FiltersPanel`/`ListingsFilters` single-date usages were already replaced by `RangeDatePicker`
in Task 559). Small, admin-only blast radius. **Do not touch any other file's imports.**

## The three `Intl.DateTimeFormat(locale, …)` call sites to remove

| # | Line | Current | Renders (Node full-ICU) | Static-data replacement |
|---|---|---|---|---|
| 1 | `~44–48` `weekdays` | `Intl.DateTimeFormat(locale,{weekday:'short'})` × Mon–Sun | en `Mon…Sun` · uk `пн…нд` · sq `hën…die` · it `lun…dom` | **Direct reuse** of `common.calendar_weekdays_short` (already Monday-first, index-for-index identical — verified byte-for-byte) |
| 2 | `~50–52` `monthLabel` | `Intl.DateTimeFormat(locale,{month:'long',year:'numeric'}).format(viewMonth)` | en `July 2026` · uk `липень 2026 р.` · sq `korrik 2026` · it `luglio 2026` | Compose `` `${calendar_months[m]} ${year}${calendar_month_year_suffix}` `` (nominative long month + year + suffix). Raw string stays lowercase; the **existing `capitalize` CSS class on the header span (`DatePicker.tsx:116`) already normalizes the first letter — rendered output is byte-identical.** Keep that class. |
| 3 | `~178` today label | `Intl.DateTimeFormat(locale,{day:'numeric',month:'long'}).format(new Date())` | en `July 9` · uk `9 липня` (**genitive**) · sq `9 korrik` · it `9 luglio` | Compose per `calendar_summary_order` from a **NEW** `calendar_months_formatting` array (see below). The today-label button has **no `capitalize` class**, so the array stores the exact case ICU emits. |

## New i18n data — `common.calendar_months_formatting` (owner decision, 2026-07-09)

The today label needs the **day-bound (formatting/genitive) long-month** form, which the nominative
`calendar_months` array cannot supply for `uk` (`липня` ≠ `липень`) and which differs in case for `en`.
Add **one** new key `common.calendar_months_formatting` (12-element array) to **all four** `messages/*.json`,
extracted from Node's full-ICU output (authoritative source, same methodology as Tasks 562/564):

- **en:** `["January","February","March","April","May","June","July","August","September","October","November","December"]`
- **uk:** `["січня","лютого","березня","квітня","травня","червня","липня","серпня","вересня","жовтня","листопада","грудня"]`
- **sq:** `["janar","shkurt","mars","prill","maj","qershor","korrik","gusht","shtator","tetor","nëntor","dhjetor"]`
- **it:** `["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"]`

`check:i18n` parity must stay green (each locale +1 key → 2123 keys × 4, identical key sets). Place the
key adjacent to the other `calendar_*` keys in each file. **Do NOT** rename or touch any existing
`calendar_*` key (they are consumed by `RangeDatePicker`/`formatters.ts` — a rename is an out-of-scope regression).

## Exact composition (spell it out — no invention)

```
weekdays[i]  = cal.calendar_weekdays_short[i]                       // Mon-first, i = 0..6
monthLabel   = `${cal.calendar_months[m]} ${year}${cal.calendar_month_year_suffix}`   // m = viewMonth month index
todayLabel   = cal.calendar_summary_order === 'month_day'
                 ? `${cal.calendar_months_formatting[m]} ${day}`
                 : `${day} ${cal.calendar_months_formatting[m]}`
```

Read the arrays via `useTranslations('common')` + `t.raw('calendar_*')` — the **exact pattern already
used by `useCalendarLocaleData` inside `RangeDatePicker.tsx:195`**. You MAY lift a small local helper in
`DatePicker.tsx` mirroring that shape; do **not** try to import `useCalendarLocaleData` (it is a
non-exported local of `RangeDatePicker.tsx`). Reuse the DATA, not a cross-file import. Do not duplicate
the month/weekday string data anywhere — it lives only in `messages/*.json`.

## Global-change rule (Note 14)

After this task, `grep -rn "new Intl\.\(Number\|DateTime\)Format(" src/` must return **only**
`src/modules/notifications/lib/emails/PasswordChangedEmail.tsx` (×2, hardcoded `'sq-AL'`, server-only
email render — no hydration boundary; the standing justified exception). Every runtime-`locale` `Intl.*`
site in the app is then eliminated. State the grep result in the session log.

## Pre-read (rule-index → hydration/i18n bug-fix, mirrors Task 564)

- `docs/agent-contract.md` + `docs/backlog.md` + `docs/critical-flow-registry.md` (extend the **Admin user
  detail** row's coverage note — DatePicker localization now regression-covered — OR add a focused
  DatePicker-localization row; do not invent a new flow group).
- `docs/state-authority.md` (hydration determinism); `docs/qa-rules.md`; `docs/component-rules.md`.
- Task 562 session log `docs/sessions/2026-07-08-task562-rangedatepicker-calendar-localization.md` +
  `RangeDatePicker.tsx`'s `useCalendarLocaleData` (the reuse pattern). Task 564 `src/lib/formatters.ts`
  (`CALENDAR_MESSAGES` reuse pattern) + its session log.

## Required after-behavior

- `DatePicker`'s weekday row, month/year header, and "Today —" label render **byte-identical on server
  and client at all four locales** — no hydration warning when `AdminUserProfile` is viewed on `/sq/*`
  (or any locale), and correct-language labels in the browser (Albanian on `sq`, Ukrainian genitive
  `9 липня` in the today label on `uk`).
- `en`/`uk`/`sq`/`it` **rendered output is byte-identical to the current Intl output** (this is a
  fix that makes `sq` correct on the client and removes the hydration risk; visible text on every
  locale is unchanged from what a full-ICU runtime produces today). Verify with the extracted literals.
- **Zero** structural / style / chrome change: the legacy `ui/popover`, `ui/button`, raw day-cell
  `<button>`, `rounded-xl bg-muted` trigger, widths, and the `capitalize` class all stay exactly as-is.
  This task is **formatter-logic only** — the Mantine/TailAdmin restyle is Task 557's job.

## Positive flow

1. Admin opens a user detail page on `/sq/admin/users/[id]` → opens the `DatePicker` → weekday row shows
   `hën mar mër enj pre sht die`, header shows `Korrik 2026` (via `capitalize`), today button shows
   `<today_label> — 9 korrik`, all identical server↔client, console clean (no hydration warning).
2. Same on `/uk/*`: header `Липень 2026 р.`, today label `9 липня` (genitive, correct).
3. `en`/`it` unchanged from today's output.
4. Selecting a day, month nav (‹ ›), clear-X, `maxDate` disabling, and the Today shortcut all behave
   exactly as before (date-fns logic untouched).

## Negative flow

- **Browser without `sq` ICU data** (the actual bug) → static-data composition renders correct Albanian
  regardless; no silent `en-GB` fallback, no SSR/CSR divergence.
- **Unknown/unsupported locale** (not `en`/`uk`/`sq`/`it`) → `useTranslations('common')` resolves against
  the active provider; if a `calendar_*` array is somehow missing, fall back deterministically (mirror
  `RangeDatePicker`'s handling) — never a raw `Intl.*` fallback, never a throw. Preserve current behavior.
- **`maxDate` next-month guard, disabled future days, clear-X, empty value/placeholder** → all preserved
  byte-for-byte (no logic change to date-fns paths).
- **No selection** → trigger shows `placeholder ?? t('select_date')` exactly as now.

## Regression coverage (clause 15)

Add a smoke test (mirror `src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx`):
mount the **real** `DatePicker` **open** under a **real** `sq` and `uk` `NextIntlClientProvider`, then, with
`Intl.DateTimeFormat` globally monkey-patched to **throw** (the actual failure mode), assert the rendered
DOM shows the localized weekday row, month/year header, and today label — `sq` Albanian (e.g. `hën`, `korrik`),
`uk` Ukrainian genitive today label (`9 липня`, never `9 липень` and never English `9 July`/`Jul`). date-fns
does not use `Intl.DateTimeFormat`, so breaking it is safe and isolates the fix. **Planted violation:** revert
any one of the three call sites to its raw `Intl.DateTimeFormat(locale, …)` form → the corresponding assertion
FAILS (English/`en-GB` fallback text appears under the broken-Intl simulation); revert → green. Record both
transcripts. Update the registry row + coverage status.

## Acceptance criteria

1. No React hydration mismatch from `DatePicker` at any locale — console-clean evidence on
   `/sq/admin/users/[id]` (weekday row + month header + today label specifically). tsc/build green is NOT proof.
2. All three formatted surfaces byte-identical server↔client at `en`/`uk`/`sq`/`it`, matching the extracted
   full-ICU literals in this kickoff (weekday row; `monthLabel`; today label incl. uk genitive `9 липня`).
3. `grep` sweep confirms the ONLY remaining `new Intl.(Number|DateTime)Format(` in `src/` is
   `PasswordChangedEmail.tsx` (×2, justified). Paste the result.
4. `common.calendar_months_formatting` added to all 4 locales with the exact arrays above; `check:i18n`
   parity green (2123 × 4). No existing `calendar_*` key renamed/removed.
5. Regression test + planted-violation transcript; critical-flow-registry updated (Admin-user-detail
   coverage note extended or a DatePicker-localization row added).
6. Gates: `tsc=0`, `check:i18n`, `check:design-tokens -- --strict`, `check:mojibake`, `check:file-integrity`
   green; per-file read-after-write integrity transcript in the session log; **Files-Changed table present**.
   **Do NOT run git — HELD for orchestrator review.**

## Out of scope

- The Task 557 Mantine/TailAdmin rebuild of `DatePicker` (chrome, popover primitive, day-cell `<button>`,
  bottom-sheet, `≥44px`/`max-sm` full-width, TailAdmin tokens) — **none of that here.** No structural or
  style change; logic only.
- Any change to `RangeDatePicker`, `formatters.ts`, or the existing `calendar_*` keys' values.
- The `new Date()` "today" value itself (pre-existing; a midnight-boundary `new Date()` SSR/CSR nuance is
  not an ICU bug and is not this task's subject).
- `PasswordChangedEmail.tsx` (server-only email render, justified exception — leave as-is).

## Files expected to change

`src/components/shared/DatePicker.tsx` · `messages/en.json` · `messages/uk.json` · `messages/sq.json` ·
`messages/it.json` · a new `src/components/shared/__tests__/DatePicker.localization.test.tsx` ·
`docs/critical-flow-registry.md` · `docs/backlog.md` · new `docs/sessions/2026-07-09-task565-datepicker-runtime-icu-fix.md`.
