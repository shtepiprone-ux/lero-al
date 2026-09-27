# Sprint 84 — one clock and one date order, on screens that have left Tailwind

**Opened:** 2026-09-27 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Kickoffs filed:** 1 (885) · **Reserved:** 5
(892 · 893 · 894 · 895 · 896)

> **These counts drift.** Re-derive them from the Tasks table below, never from this line.

> **Opened by the orchestrator on 2026-09-27, while writing Task 885's kickoff at the owner's request**
> (*"пиши kickoff 885 — 24-годинний формат часу по всьому сайту"*). Task 885 had been hosted in Sprint 78 by
> discovery, not by goal fit, and its row there said "the owner may move it". The owner's decisions below turned it
> into a task that depends on six legacy migrations, and no open sprint has that goal.

## Owner decisions

| ID | Date | Decision (verbatim) | Consequence |
|---|---|---|---|
| **D84-0** | 2026-09-25 | *"у Європі ми використовуємо 24 години, а не 12 годин!"* | Every date-time on the site uses the 24-hour clock. |
| **D84-1** | 2026-09-27 | Asked: the 24-hour change reaches unmigrated legacy screens, and clause 16d requires migrating every component on a changed surface unless the owner grants an exception. Chosen option: **"Migrate first"**. | No exception. 885 ships only after every surface whose text it changes has passed its census. |
| **D84-2** | 2026-09-27 | Asked: should `en` also switch from month-first (`09/18/2026`) to day-first? Chosen option: **"Day-first too"**. | `en` numeric dates become `DD/MM/YYYY`. |
| **D84-3** | 2026-09-27 | Asked: day-first `en` adds four more unmigrated components. Split it into its own task, or keep it all in 885? Chosen option: **"Everything in 885"**. | 885 carries the clock and the `en` order together, and waits for all the migrations below. |

## The defect

The canonical date layout `DATE_FORMAT` (`src/lib/formatters.ts:88-98`) sets `hour12: true` for `sq` (`p.d.`/`m.d.`)
and `en` (`AM`/`PM`), and month-first order for `en`. One admin screen formats its own time through next-intl
`timeStyle: 'short'` (`AdminPermissionsManager.tsx:185-188`), which renders `3:30 PM` / `3:30 m.d.`
(measured 2026-09-27, Node 22.22.3, ICU 78.2).

## Goal

Every date and time the site renders uses the 24-hour clock in all four locales, and `en` numeric dates are
day-first. The change reaches no surface that still carries unmigrated components. A repo-wide guard keeps a 12-hour
option from coming back.

## Goal-fit — why no open sprint takes this

| Open sprint | Goal | Fits? |
|---|---|---|
| 46 | ListingCard de-Tailwind + overlay exit | No |
| 55 / 56 / 57 | ARIA semantics · raw enum leaks · deletions | No |
| 61 / 62 | projection-layer detector · Tailwind runtime tokens | No |
| 69 / 70 / 71 | `/listings` · site chrome · listing detail | No — other routes |
| 72 / 73 / 74 | similar listings · sold visibility · card width | No |
| 77 | full test suite | No |
| 78 | admin and agent dashboards | No — the dashboards already show dates correctly; this goal needs `/cabinet` and five other admin screens |
| 79 | CMS pages | No |
| 83 | responsive text size | No — size, not format |

## Tasks

The Tasks table is the **single state source**. The execution-order note below is order and gating only.

| # | Outcome | State |
|---|---|---|
| **885** | 24-hour clock in every locale and day-first `en` numeric dates: `DATE_FORMAT` loses its 12-hour branch, the audit-log timestamp gets `hourCycle: 'h23'`, all pinned literals move, and a repo-wide guard test rejects any 12-hour output or option. | `KICKOFF FILED` 2026-09-27, **blocked** on 892–896, 859 and 877 (§I0 census gate) → [`…Task_885…`](Sprint_84_kickoff_prompt_Task_885_24_Hour_Clock_And_Day_First_Dates.md) |
| **892** | `/admin/permissions` on canonical Mantine: `AdminPermissionsManager` (44 `className`; `ui/badge`, `ui/switch`) | reserved — kickoff after its own census |
| **893** | `/admin/users/[id]` and `/admin/users/new` on canonical Mantine: `AdminUserProfile` (167 `className`), `AdminEditLayout`, `AdminInput`, `AdminUserAvatar`, shared `Combobox`, shared `DatePicker` (critical flow "Admin user detail loads") | reserved — kickoff after its own census |
| **894** | `/admin/inquiries/{sales,support}` on canonical Mantine: `AdminInquiriesManager` (42), `StatusChangeControl` (12), `StatusChangeHistory` (15). `StatusChangeControl` is also rendered by `ListingFormShellView` | reserved — after 893 (shared `Combobox`) |
| **895** | `/{locale}/cabinet` on canonical Mantine: `CabinetShell` (17), `ListingsTab` (51), `ProfileTab` (66), `SavedSearchesTab` (29), `RecentlyViewedSection`, `RecentlyViewedGrid`, `ClearRecentlyViewedButton` (enrolment) | reserved — after 893 (shared `Combobox`, `AdminUserAvatar`) |
| **896** | `/admin/users` list: `page.tsx` (8 `className`) and `AdminUsersTable` enrolled in the manifest (it already has a Story) | reserved |

External dependencies (Sprint 78, not moved): **877** makes `AdminTable` and `AdminPageHeader` adapters over
canonical patterns and deletes `AdminCardList`. **859** migrates `AdminSupportManager` under 16d. Both surfaces
(`/admin/support`, `/admin/inquiries/*`) show `formatDate` output that 885 changes.

## Execution order and gating

1. **893 first** among the new numbers: it migrates the shared `Combobox`, `AdminUserAvatar` and `DatePicker` that
   894 and 895 consume.
2. 892, 896 have no dependency on each other and may run in any order.
3. 894 and 895 run after 893. 894 also waits for 877 (`AdminPageHeader`).
4. **885 runs last.** Its I0 re-runs the census on every surface it changes; any `FAIL` line other than the surface's
   own root `page.tsx` stops it with `BLOCKED — D84-1`. It also needs `src/lib/formatters.ts` and
   `src/lib/__tests__/formatters.test.ts` committed (854's hunks land with 891).
5. One UI task at a time where they share `messages/*.json`, `theme.ts` or `scripts/mantine-migration-scope.json`.

## Owner actions

| # | Action | Blocks |
|---|---|---|
| **O84-1** | After 885 deploys: in `en` and `sq`, open `/admin/permissions` (audit log), `/admin/users/<id>` (change log) and `/cabinet` (`Member since`), and read one email-change security notice. Every time reads `HH:MM` in 24 hours, and every `en` numeric date is day-first. | 885 closure |

## Exit criteria

1. 885 is approved, and `test:i18n-hydration` (CI) runs its guard.
2. Every surface in 885's census list reports only its root `page.tsx`.
3. O84-1 is accepted.

## Explicitly not in this sprint

- Month-name dates (`formatListingDate`, `formatShortDate`, the `DatePicker`/`RangeDatePicker` summaries). They follow
  `calendar_summary_order` in `messages/*.json` (`en` = `month_day`, e.g. `Jun 15, 2026`). D84-2 was asked about the
  numeric form only (`09/18/2026`). Changing them is a new owner decision and a new number.
- The emails' own copy and the React-Email migration.
