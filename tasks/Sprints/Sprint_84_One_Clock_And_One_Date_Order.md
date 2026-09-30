# Sprint 84 — one clock and one date order, on screens that have left Tailwind

**Opened:** 2026-09-27 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Kickoffs filed:** 6 (885 · 892 · 893 · 894 · 895 · 896) · **Reserved:** 0

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
| **D84-4** | 2026-09-28 | *"англійською мовою дати нехай залишаються з першим місяцем у рядку, так звичніше читати дати. Але якщо дата виглядає ось так "09/12/2026" то першим має бути день."* | `en` dates with a month name stay month-first (`Jun 15, 2026`); `en` numeric dates are day-first. |

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
| **885** | 24-hour clock in every locale and day-first `en` numeric dates: `DATE_FORMAT` loses its 12-hour branch, the audit-log timestamp gets `hourCycle: 'h23'`, all pinned literals move, and a repo-wide guard test rejects any 12-hour output or option. | `KICKOFF FILED` 2026-09-27, **blocked** on 892–896 and 859 (§I0 census gate; 877 landed 2026-09-29) → [`…Task_885…`](Sprint_84_kickoff_prompt_Task_885_24_Hour_Clock_And_Day_First_Dates.md) |
| **892** | `/admin/permissions` on canonical Mantine: `AdminPermissionsManager` (44 `className`; `ui/badge`, `ui/switch`) | `KICKOFF FILED` 2026-09-29 → [`…Task_892…`](Sprint_84_kickoff_prompt_Task_892_Admin_Permissions_On_Mantine.md) — needs 893 (`MantineFormSection`); owner matrix **O84-3** |
| **893** | `/admin/users/[id]` and `/admin/users/new` on canonical Mantine: `AdminUserProfile` → container + `AdminUserProfileView` + `AdminUserProfileDialogsView`; new `AdminUserAvatarField` (+ View) over a hook shared with the legacy avatar; `MantineFormSection` extracted; `RangeDatePicker` single-date mode; legacy `DatePicker` deleted. Shared `Combobox`, `AdminInput`, `AdminEditLayout` and the legacy `AdminUserAvatar` stay for their other consumers (Q4, five critical flows) | `NEEDS REVISION` 2026-09-30, revision 2 (kickoff §19: mobile year/month selection outside the month window is a silent no-op) → [`…Task_893…`](Sprint_84_kickoff_prompt_Task_893_Admin_User_Profile_On_Mantine.md) |
| **894** | `/admin/inquiries/{sales,support}` on canonical Mantine: `AdminInquiriesManager` (42), `StatusChangeControl` (12), `StatusChangeHistory` (15). `StatusChangeControl` is also rendered by `ListingFormShellView` | `KICKOFF FILED` 2026-09-29 → [`…Task_894…`](Sprint_84_kickoff_prompt_Task_894_Admin_Inquiries_On_Mantine.md) — new canonical `StatusChangeSelect`; the legacy control stays for the listing form until 796; owner matrix **O84-5** |
| **895** | `/{locale}/cabinet` on canonical Mantine: `CabinetShell` (17), `ListingsTab` (51), `ProfileTab` (66), `SavedSearchesTab` (29), `RecentlyViewedSection`, `RecentlyViewedGrid`, `ClearRecentlyViewedButton` (enrolment) | `KICKOFF FILED` 2026-09-29 → [`…Task_895…`](Sprint_84_kickoff_prompt_Task_895_Cabinet_On_Mantine.md) — one task (16d; no per-tab split); needs 893, runs after Sprint 83's 886; subsumes Sprint 70's **789** (fold pending **O84-7**); owner matrix **O84-6** |
| **896** | `/admin/users` list: `page.tsx` (8 `className`) and `AdminUsersTable` enrolled in the manifest (it already has a Story) | `KICKOFF FILED` 2026-09-29 → [`…Task_896…`](Sprint_84_kickoff_prompt_Task_896_Admin_Users_List_Page_On_Mantine.md) — the Story moves to `Patterns/Mantine/AdminUsersTable`, the exact-title hatch is emptied; owner matrix **O84-4** |

External dependencies (Sprint 78, not moved): **877** makes `AdminTable` and `AdminPageHeader` adapters over
canonical patterns and deletes `AdminCardList`. **859** migrates `AdminSupportManager` under 16d. Both surfaces
(`/admin/support`, `/admin/inquiries/*`) show `formatDate` output that 885 changes.

## Execution order and gating

1. **893 runs after 877** (the admin page wrapper and width token). It does not migrate the shared legacy files in
   place: each migrated screen stops importing `Combobox`/`AdminInput`/`AdminEditLayout` itself (tier-2 treatment), and
   the last consumer deletes them. 893 does establish `AdminUserAvatarField`, which 895 consumes.
2. 892, 896 have no dependency on each other and may run in any order.
3. 894 waits for 877 (`AdminPageHeader`). 895 waits for 893 (`AdminUserAvatarField`).
4. **885 runs last.** Its I0 re-runs the census on every surface it changes; any `FAIL` line other than the surface's
   own root `page.tsx` stops it with `BLOCKED — D84-1`. It also needs `src/lib/formatters.ts` and
   `src/lib/__tests__/formatters.test.ts` committed (854's hunks land with 891).
5. One UI task at a time where they share `messages/*.json`, `theme.ts` or `scripts/mantine-migration-scope.json`.
6. **Added 2026-09-29 (kickoffs 892–896):** 892 and 895 also need 893 (`MantineFormSection`, `AdminUserAvatarField`); 895 runs after Sprint 83's **886** (both edit `RecentlyViewedSection`/`RecentlyViewedGridView`). Order: 893 → 896 · 892 · 894 → 895 → (859 in Sprint 78) → 885.
7. **CONFLICT found 2026-09-29, fix before 885 runs:** the census prints `FAIL [tier1-unenrolled-or-unstoried]` for every GR-1 container-exempt node (measured on `/admin/currency` after 877: `AdminCurrenciesManager`, `AdminExchangeProvidersManager`, both `className:0 ui-imports:0`). 885's I0 rule "no FAIL line except the root `page.tsx`" therefore stops on every surface these migrations produce, and 893's AC7 states the same impossible expectation. Each 892/894/895/896 kickoff lists its exact calibration set; 885's gate must accept container lines with `className:0 ui-imports:0` whose View is enrolled and storied.

## Owner actions

| # | Action | Blocks |
|---|---|---|
| **O84-2** | Task 893's `OWNER VISUAL QA REQUIRED` matrix (kickoff §13.4, 72 tuples; **64 accepted 2026-09-30**; the 8 `RangeDatePicker` tuples were returned; after revision 2, **12 remain**: `SingleDate` / `SingleDateSelected` / `Default`, choose a year after 2026 and confirm a day, `uk`/`en` × 320/1440, kickoff §19.5), then one live check after the deploy: block a user with an end date, unblock them with the status select alone and save, and create one test user. | 893 approval |
| **O84-1** | After 885 deploys: in `en` and `sq`, open `/admin/permissions` (audit log), `/admin/users/<id>` (change log) and `/cabinet` (`Member since`), and read one email-change security notice. Every time reads `HH:MM` in 24 hours, and every `en` numeric date is day-first. | 885 closure |
| **O84-3** | Task 892's `OWNER VISUAL QA REQUIRED` matrix (kickoff §13.3, 14 tuples); after the deploy, toggle one permission and read the audit log. | 892 approval |
| **O84-4** | Task 896's matrix (kickoff §13.3, 12 tuples); after the deploy, read `/admin/users` at phone and desktop width. | 896 approval |
| **O84-5** | Task 894's matrix (kickoff §13.3, 30 tuples); after the deploy, reply to and close one test inquiry. | 894 approval |
| **O84-6** | Task 895's matrix (kickoff §13.3, 64 tuples); after the deploy, the live checks on a **test** account listed there (never the self-delete on a real account). | 895 approval |
| **O84-8** | **Answered 2026-09-30, option A** (owner verbatim: *"O84-8: варіант A, виправляємо в 893"*): the status-only save fix is kickoff §17.3 R17, in 893 revision 1. | none (carried by 893 revision 1) |
| **O84-7** | Decision: confirm that Sprint 70's reserved **789** (the cabinet listings filter bar) is folded into **895** and never re-issued. 895 migrates that bar either way (clause 16d). | registry bookkeeping only |

## Exit criteria

1. 885 is approved, and `test:i18n-hydration` (CI) runs its guard.
2. Every surface in 885's census list reports only its root `page.tsx`.
3. O84-1 is accepted.

## Explicitly not in this sprint

- Month-name dates (`formatListingDate`, `formatShortDate`, the `DatePicker`/`RangeDatePicker` summaries). They follow
  `calendar_summary_order` in `messages/*.json` (`en` = `month_day`, e.g. `Jun 15, 2026`) and **stay month-first by
  owner decision D84-4** (2026-09-28).
- The emails' own copy and the React-Email migration.
