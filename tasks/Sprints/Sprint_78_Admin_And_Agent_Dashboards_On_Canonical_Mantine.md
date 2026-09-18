# Sprint 78 — the admin and agent dashboards, rebuilt on canonical Mantine from the dashboard spec v3.3

**Opened:** 2026-09-18 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Kickoffs filed:** 14 (843–856) · **Reserved:** 4 (857 · 858 · 859 · 860)

> **Opened by owner instruction, 2026-09-18:** *"необхідно створити новий спринт для оновлення Admin Dashboard та
> Agent Statistic Dashboard. У теці tech-materials/ є файли з технічним завданням. Необхідно створити план задач і
> потім написати kickoff файли для кожної з задач. Все має бути з канонічними Mantine стилями та токенами, жодного
> hardcode, враховуючи всі Mantine breakpoints."*
>
> References named by the owner: `kamr-vite.vercel.app` (dashboard after the login button),
> `techzaa.in/lahomes/admin/dashboard-agent.html`, `omah.dexignzone.com/xhtml/index.html`. The spec itself (§16,
> §16.4) says Kamr is a reference **only** for density, grid, cards, charts and statuses; its hotel entities and
> financial metrics are not requirements. The project's visual source stays TailAdmin (`agent-contract` 16,
> decision **D78-5** below). The references inform composition; they never supply a raw value.

## Source specification

`tech-materials/Lero_al_Technical_Specification_Dashboards_v3.3.docx` (v3.3, 17 September 2026) is the governing
spec. v3.2 and the unversioned file are superseded: the v3.2→v3.3 diff (measured 2026-09-18) adds only §17 (detailed
block anatomy); nothing else changed. Every kickoff in this sprint restates the spec rules it needs, so no executor
has to open the `.docx`. Spec block IDs (`ADM-01`…`ADM-11`, `AGT-01`…`AGT-12`) are used verbatim.

## Why a new sprint — goal fit checked against every open sprint

| Sprint | Its goal | Fits? |
|---|---|---|
| **46** | ListingCard de-Tailwind + overlay exit | No — one component family, not a dashboard. |
| **55 · 56 · 57** | ARIA semantics / raw enum leaks / deleting unused code | No — detector and removal work. |
| **61 · 62** | Projection layer no gate reads / Tailwind runtime tokens | No — gate families. |
| **69** | `/listings` finishes the Mantine migration | No — public listings route. |
| **70** | Site chrome leaves Tailwind | **Closest, and still no.** 70 is the public header/footer/mobile bar; the admin shell (852) is admin chrome inside a new feature scope. |
| **71 · 72 · 73 · 74** | Listing-detail de-Tailwind / similar listings / sold reachability / card width | No — listing-detail and card surfaces. |
| **77** | The full test suite is red (widened to host unsprinted reserved work) | No — test-suite health; the owner widened it only for six named reserved numbers. |

## Goal

1. `/admin` becomes the spec's **operations dashboard**, not a set of general numbers. The first row shows the work
   queues (ADM-01, ADM-02, ADM-06). A chart row, a diagnostics row (ADM-08, ADM-09) and the ADM-11 status
   distribution follow. It sits inside an admin shell migrated to Mantine.
2. Agents (`users.role = 'agent'`) get a new page, **`/{locale}/cabinet/statistics`**, reached from a **"Statistics"**
   item in the user menu next to "Profile". It carries AGT-01, AGT-02, AGT-05 and AGT-10 on existing data, then
   AGT-03, AGT-04 and AGT-11 once the activity aggregate exists.
3. Every visible artifact is built from a canonical Mantine pattern with its own Story, from theme tokens only, and
   works at every Mantine breakpoint of `theme.ts` (`xs` 320 · `xs2` 480 · `sm` 640 · `md` 768 · `lg` 1024 · `xl`
   1280 · `xxl` 1440). No Tailwind utility, no `@/components/ui/*` import, no raw px/rem/hex in any file this sprint
   creates or migrates.
4. The numbers are honest (spec §3–§4): no "leads", "contacts" or "conversion"; views, WhatsApp clicks and form
   inquiries are never summed; `0` only after a successful query; a failed block shows its own error and Retry, and
   the other blocks keep working. Days are cut in `Europe/Tirane`. Periods are completed local days ending yesterday.

## Owner decisions taken while designing this sprint (2026-09-18, verbatim)

| ID | Question | Owner answer (verbatim) | Binding consequence |
|---|---|---|---|
| **D78-1** | What part of the spec's data foundation belongs in this sprint? | *"UI + агрегат активності (Рекомендовано)"* | In scope: every block on existing data plus the new `listing_activity_daily` aggregate and its job. **Out of scope, separate sprints:** agent-review moderation (ADM-03, ADM-04, AGT-12, spec §8) and chat (ADM-05, AGT-06–AGT-09, Task 342). Those blocks are **not rendered**, and the grid closes over their slots (spec §16.3, §17.3). |
| **D78-2** | Chart library? | *"@mantine/charts (Рекомендовано)"* | `@mantine/charts` (Mantine's own chart package, Recharts-based) is added, version-matched to `@mantine/core`. No other chart library. |
| **D78-3** | Who sees the agent dashboard, and where? | *"role=agent. Нова стоірнка, кнопка "Statistics" на цю сторінку знаходиться у меню користувача, біля кнопки "Профіль""* | Access = `users.role = 'agent'` (set by an admin), never the self-selected `user_type`. A new page; the cabinet tabs (`CabinetShell`) are untouched. The entry point is a user-menu item placed directly after "Profile". |
| **D78-4** | How is `listing_activity_daily` refreshed? | *"перечитай інформацію тут https://vercel.com/docs/cron-jobs, після чого необхідно буле обрати варіант, в пріоритеті авжеж /api/cron/listing-activity зі schedule щогодини; ідемпотентний перерахунок сьогодні+вчора."* | Read 2026-09-18: Vercel calls cron paths with **HTTP GET**. On **Hobby**, an expression that runs more than once a day **fails the deployment**, and timing is ±59 min. On **Pro**, per-minute. Delivery is best effort and can duplicate, so the job must be idempotent and reconciliation-based. `CRON_SECRET` arrives as `Authorization: Bearer …`. **Chosen:** `GET /api/cron/listing-activity`, schedule `0 * * * *`, idempotent recompute of today and yesterday (Tirane). **Precondition (owner action O78-1):** the project is on Pro. If it is on Hobby, an hourly entry would break every deployment, so 849 ships with daily `30 0 * * *` instead. That is the only permitted fallback. |
| **D78-5** | The spec's §17.1 type scale (28/36 page title, KPI 28/34 semibold, card label 13/18) vs TailAdmin (§6u metric card: KPI 30/38 bold, label 14/20)? | *"TailAdmin (Рекомендовано)"* | Dashboard typography uses the existing theme scale and the TailAdmin §6u metric-card values; **no new font-size or line-height token**. Orchestrator reading, reversible: the same rule applies to the spec's other chrome numbers that TailAdmin already defines (card radius/border/padding, status-badge size). Only dimensions TailAdmin has no value for (e.g. the 72px desktop top bar, the 132px top-card minimum height, the 384px chart-card minimum height, the 1440px content cap) become new `theme.other` roles. |
| **D78-6** | Route of the agent page? | *"/{locale}/cabinet/statistics"* | Route fixed. |

## Measured context (read-only, 2026-09-18)

- `/admin` (`src/app/admin/page.tsx`) is legacy: **53** `className`, its own local `StatCard`/`StatusBar`; it
  renders `AdminDashboardRecentListings` (**28** `className`, shadcn `Dialog` + `Button`), `AdminPageHeader` and
  `RelativeTime`. None is enrolled or has its own Story (`check-surface-census.mjs` output). It counts **raw
  `status='active'`** as "active listings", which the spec forbids (ADM-08 must use the visibility helper).
- The admin layout renders `AdminShell` → `AdminSidebar` (shadcn `Sheet`/`Button`, 23 `className`),
  `AdminMobileHeader` (shadcn `Button`) and `AdminLocaleSwitcher`. None is enrolled or has its own canonical Story.
  `MantineAppShellFoundation` exists, is enrolled, and has **no production consumer**.
- No metric-card, dashboard-card, chart, donut or period-control pattern exists in `src/`. No chart package is
  installed.
- `listing_views` is written only by the `record_listing_view` RPC (24-hour dedup). `listing_contact_events` is
  inserted by `trackListingContactEvent` with a **client-supplied `listingOwnerId`**. Anonymous insert was revoked
  (`scripts/task-289-…sql`), so **guest WhatsApp clicks are never recorded**. Spec §5 requires the server to resolve
  the owner and a separate safe guest path (→ 850).
- **All four existing cron routes export only `POST`** (`inactivity`, `listings-expiry`, `price-alerts`,
  `saved-searches`). Vercel invokes crons with `GET`. INFERENCE: those jobs return 405 in production, and
  `listings-expiry` is a registered critical flow. It also feeds ADM-09's "expired" count (→ 851; owner-native log
  check first).
- `verification_requests` is read or written nowhere in `src/` or `scripts/`, and no admin verification screen
  exists. ADM-07 therefore has neither a proven source nor a drill-down target. It stays unrendered until Task 313's
  schema contract is signed (Epic HH).
- `AgentReview` exists only as a TypeScript type; no review feature exists. ADM-03, ADM-04 and AGT-12 are out
  under D78-1.
- `/admin/listings` accepts `?status=` and `?visibility=hidden_eligible&reason=expired|no_expiry`. It has **no**
  "visible" filter. `/admin/reports` and `/admin/support` read **no** URL filter. Their filtered landings are the
  reserved 857–859.

## Tasks

> **This table is the single state source for the sprint.** Read state here, not from a kickoff header.

| # | Title | Priority | QA | Depends on | State |
|---|---|---|---|---|---|
| **843** | Canonical dashboard card patterns: `MantineDashboardCard`, `MantineDashboardStatCard`, `MantineDashboardStatRows` + their `theme.other` roles | P1 | Q3 | — | 🔁 `NEEDS REVISION` 2026-09-18 (review 1) — execute kickoff §16 Revision 1 (F1–F6) → [`Sprint_78_kickoff_prompt_Task_843_…`](Sprint_78_kickoff_prompt_Task_843_Dashboard_Card_Patterns.md) · [session log](../../docs/sessions/2026-09-18-task843-dashboard-card-patterns.md) |
| **844** | `MantineDashboardWorkList`, the shared listing-status tone source, and `RelativeTime` on Mantine with an absolute-time tooltip | P1 | Q3 | 843 | 📝 KICKOFF FILED → [`…_Task_844_…`](Sprint_78_kickoff_prompt_Task_844_Dashboard_Work_List_Status_Tone_Relative_Time.md) |
| **845** | `@mantine/charts` + `MantineDashboardLineChart` and `MantineDashboardDonut` with text alternatives | P1 | Q3 | 843, 844 | 📝 KICKOFF FILED → [`…_Task_845_…`](Sprint_78_kickoff_prompt_Task_845_Dashboard_Chart_Patterns.md) |
| **846** | `MantineDashboardHeader`, `MantineDashboardPeriodControl`, `MantineDashboardGrid` + `src/lib/dashboard/period.ts` (Tirane completed periods) | P1 | Q3 | 843 | 📝 KICKOFF FILED → [`…_Task_846_…`](Sprint_78_kickoff_prompt_Task_846_Dashboard_Header_Period_Grid.md) |
| **847** | Admin dashboard server data layer (ADM-01/02/06/08/09/11, recent listings, location requests) with per-block error results | P1 | Q1 | 846 (`period.ts`) | 📝 KICKOFF FILED → [`…_Task_847_…`](Sprint_78_kickoff_prompt_Task_847_Admin_Dashboard_Data_Layer.md) |
| **848** | Agent statistics server data layer + `role='agent'` gate (AGT-01/02/05/10) with owner isolation | P1 | Q4 | 846 (`period.ts`), 847 (`BlockResult`) | 📝 KICKOFF FILED → [`…_Task_848_…`](Sprint_78_kickoff_prompt_Task_848_Agent_Statistics_Data_Layer.md) |
| **849** | `listing_activity_daily` + idempotent recompute + `GET /api/cron/listing-activity` hourly + backfill + read helpers | P1 | Q4 | 846, 851, O78-1 | 📝 KICKOFF FILED → [`…_Task_849_…`](Sprint_78_kickoff_prompt_Task_849_Listing_Activity_Daily_Aggregate.md) |
| **850** | WhatsApp click event: server resolves the owner; guest clicks recorded through a rate-limited server path | P1 | Q4 | — | 📝 KICKOFF FILED → [`…_Task_850_…`](Sprint_78_kickoff_prompt_Task_850_WhatsApp_Event_Server_Owner.md) |
| **851** | The four existing cron routes answer Vercel's `GET` and fail closed without `CRON_SECRET` | P1 | Q4 | O78-2 | 📝 KICKOFF FILED → [`…_Task_851_…`](Sprint_78_kickoff_prompt_Task_851_Cron_Routes_Answer_GET.md) |
| **852** | Admin shell on Mantine: `AdminShell`/`AdminSidebar`/`AdminMobileHeader`/`AdminLocaleSwitcher` through an extended `MantineAppShellFoundation` | P1 | Q3 | — | 📝 KICKOFF FILED → [`…_Task_852_…`](Sprint_78_kickoff_prompt_Task_852_Admin_Shell_Mantine.md) |
| **853** | `/admin` operations dashboard (P0 blocks) composed from the 843–846 patterns; recent-listings preview on `MantineModal` | P1 | Q3 | 843–847, 852 | 📝 KICKOFF FILED → [`…_Task_853_…`](Sprint_78_kickoff_prompt_Task_853_Admin_Operations_Dashboard.md) |
| **854** | `/{locale}/cabinet/statistics` for agents (P0 blocks) + "Statistics" menu entry | P1 | Q4 | 843–846, 848 | 📝 KICKOFF FILED → [`…_Task_854_…`](Sprint_78_kickoff_prompt_Task_854_Agent_Statistics_Page.md) |
| **855** | Activity analytics on both dashboards: ADM-10, the agent single-event chart, AGT-03, AGT-10 activity columns | P1 | Q3 | 849, 850, 853, 854 | 📝 KICKOFF FILED → [`…_Task_855_…`](Sprint_78_kickoff_prompt_Task_855_Activity_Analytics_Integration.md) |
| **856** | AGT-11 "Top listings by …" photo cards with a single-channel selector | P2 | Q3 | 849, 854, 855 | 📝 KICKOFF FILED → [`…_Task_856_…`](Sprint_78_kickoff_prompt_Task_856_Agent_Top_Listings.md) |
| **857** | `/admin/listings` honours `visibility=visible` (drill-down landing for ADM-08/ADM-11) — `AdminListingsTable` (759 ln, legacy) must migrate under 16d when its filter UI changes | P2 | Q3 | 853 | reserved — kickoff after that surface's census |
| **858** | `/admin/reports` honours `?status=` (ADM-02 landing) — `AdminReportsManager` (508 ln, legacy) | P2 | Q3 | 853 | reserved — kickoff after that surface's census |
| **859** | `/admin/support` honours `?assigned=unassigned&status=` (ADM-06 landing) — `AdminSupportManager` (903 ln, legacy) | P2 | Q3 | 853 | reserved — kickoff after that surface's census |
| **860** | `sendEmailChangeEmails` throws before sending: `emailChange.ts:177` uses `timeZone: 'Europe/Tirana'`, which Node rejects (`RangeError: Invalid time zone specified`, measured 2026-09-18, Node 22.22.3); the IANA id is `Europe/Tirane`. Critical-flow row "Email change". | **P1** | Q4 | — | reserved — **hosted here by discovery, not goal fit** (found while designing 846); the owner may move it. Kickoff not yet written. |

**Why 857–859 are reserved, not kicked off.** Each needs its target page to read a URL filter. Each page is a large
legacy manager; changing its visible filter state brings the whole surface under clause 16d, which a responsible
kickoff can scope only after a full census of that surface. Until they land, 853's cards link to the filtered URLs
(harmless query strings, ignored by those pages today), and the kickoff records that the landing is unfiltered.

## Execution order

Sequential inside each wave: the pattern tasks edit the same `theme.ts`, the manifest and `messages/*.json`, and
parallel Sonnet sessions would conflict on them.

| Wave | Tasks | Gate to start the next wave |
|---|---|---|
| A — patterns | **843 → 844 → 845 → 846** | each approved |
| B — data (independent of A except `period.ts`) | **851 → 849** (both edit `vercel.json`) · **850** · **847** · **848** | 847/848 need 846's `period.ts` |
| C — surfaces | **852 → 853** · **854** | A approved; 853 also needs 847 + 852; 854 needs 848 |
| D — analytics | **855 → 856** | 849 + 850 approved and the aggregate populated in production (O78-3) |
| E — landings | 857 · 858 · 859 | kickoffs written after each surface census |

## Owner actions this sprint needs

| ID | Action | Blocks |
|---|---|---|
| **O78-1** | Confirm the Vercel plan (Pro or Hobby). Hobby rejects the hourly expression at deploy time (D78-4). **Owner answer:** — (pending; 849 reads it here) | 849 `vercel.json` step |
| **O78-2** | In Vercel → Project → Cron Jobs → View Logs, check the last `listings-expiry` invocations for status `405`, and confirm `CRON_SECRET` is set for Production. | 851 execution (I0) |
| **O78-3** | Apply 849's SQL script to Supabase, run its backfill once, and confirm the first hourly run wrote a refresh row. | Wave D |
| **O78-4** | Apply 850's SQL script (guest insert path) to Supabase. | 850 AC on a live DB |

## Explicitly not in this sprint (by owner decision or missing source)

| Spec block | Why | Where it lives |
|---|---|---|
| ADM-03, ADM-04, AGT-12 (review moderation, spec §8) | D78-1 | a later sprint; no number reserved yet — the owner opens it |
| ADM-05, AGT-06, AGT-07, AGT-08, AGT-09 (chat) | D78-1; chat does not exist | Task 342 (Epic BB) phases |
| ADM-07 (verification queue) | no proven data source, no staff screen | Task 313 (Epic HH), blocked on the owner's signature |
| `listing_status_events` history chart (spec §9.2) | spec allows only the current distribution until that table exists; D78-1 scoped the aggregate only | not scheduled |

## Exit criteria

1. 843–856 are archived as `APPROVED` or `APPROVED WITH NOTES`, and 857–859 are either archived or moved with an owner decision.
2. The census of `src/modules/admin/dashboard/components/AdminDashboardView.tsx` and of
   `src/modules/cabinet/statistics/components/AgentStatisticsView.tsx` shows no tier-1 or tier-2 block. For the two
   route files, the only remaining row is each route file's own root row, because route files carry no Story; that
   row must show `className:0`.
3. The owner has accepted the visual matrices of 853 and 854 at 320 / 390 / 768 / 1024 / 1280 / 1440 in all four locales.
4. The spec §13 acceptance groups this sprint owns are proven: **semantics** (no merged "leads"), **visibility**
   (`active` + past or null `expires_at` never counted as visible), **ownership** (agent A sees nothing of agent B's),
   **form** (an inquiry counts even when the email fails), **WhatsApp** (an owner's own click is excluded, a failed
   write adds nothing, a guest write goes through the server path), **period** (30 completed Tirane dates; a 0
   baseline reads "no base for comparison"), **top listings**, **UI** (every card opens its filter; empty, error and
   loading never mask each other).

## Viewport review caveat (Task 799, Sprint 77)

The Storybook viewport toolbar is reported not to resize the preview (799, reserved). Until 799 lands, every owner
width tuple in this sprint is reviewed by opening the story's `iframe.html?id=<story-id>&globals=locale:<locale>` URL
directly and resizing the browser window, or with DevTools device mode, to the tuple's width. Each kickoff's owner
matrix says so.
