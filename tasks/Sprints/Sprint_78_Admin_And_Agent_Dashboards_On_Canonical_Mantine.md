# Sprint 78 — the admin and agent dashboards, rebuilt on canonical Mantine from the dashboard spec v3.3

**Opened:** 2026-09-18 · **Status:** 🟠 **OPEN** · **Landed tasks:** 10 (843 · 844 · 845 · 846 · 847 · 848 · 849 · 850 · 851 · 861) · **Kickoffs filed:** 14 (843–856 — of these 9 landed, 5 still open: 852 · 853 · 854 · 855 · 856; **861** landed too but was filed after that batch, which is why the landed count is 10) · **Reserved:** 7 (857 · 858 · 859 · 863 · 864 · 865 · 885; **860** kickoff filed 2026-09-25) · **Added 2026-09-24:** **874** `KICKOFF FILED` (moved in, D78-7) · **877** `KICKOFF FILED` (D78-8) · **Added 2026-09-25:** **868** `KICKOFF FILED` (routed from Sprint 79; after 877)

> **These counts drift.** They were last reconciled against `docs/backlog.md`'s registry and the Tasks table below on **2026-09-21**, when the header still read "Landed 5 / Reserved 4 (857–860)" — five tasks after the fact, and three reserved numbers (863 · 864 · 865) that had no row in the Tasks table at all. Re-derive from the Tasks table, never cite this line. **862** is folded into 861 and **866** is retired unused; neither is ever reused.

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
| **D78-2** | Chart library? | *"@mantine/charts (Рекомендовано)"* | `@mantine/charts` (Mantine's own chart package, Recharts-based) is added, version-matched to `@mantine/core`. No other chart library. **Superseded 2026-09-19 by D845-1** (owner, in-session: ApexCharts) — recorded verbatim in the 845 kickoff §16.1. |
| **D78-3** | Who sees the agent dashboard, and where? | *"role=agent. Нова стоірнка, кнопка "Statistics" на цю сторінку знаходиться у меню користувача, біля кнопки "Профіль""* | Access = `users.role = 'agent'` (set by an admin), never the self-selected `user_type`. A new page; the cabinet tabs (`CabinetShell`) are untouched. The entry point is a user-menu item placed directly after "Profile". |
| **D78-4** | How is `listing_activity_daily` refreshed? | *"перечитай інформацію тут https://vercel.com/docs/cron-jobs, після чого необхідно буле обрати варіант, в пріоритеті авжеж /api/cron/listing-activity зі schedule щогодини; ідемпотентний перерахунок сьогодні+вчора."* | Read 2026-09-18: Vercel calls cron paths with **HTTP GET**. On **Hobby**, an expression that runs more than once a day **fails the deployment**, and timing is ±59 min. On **Pro**, per-minute. Delivery is best effort and can duplicate, so the job must be idempotent and reconciliation-based. `CRON_SECRET` arrives as `Authorization: Bearer …`. **Chosen:** `GET /api/cron/listing-activity`, schedule `0 * * * *`, idempotent recompute of today and yesterday (Tirane). **Precondition (owner action O78-1):** the project is on Pro. If it is on Hobby, an hourly entry would break every deployment, so 849 ships with daily `30 0 * * *` instead. That is the only permitted fallback. |
| **D78-5** | The spec's §17.1 type scale (28/36 page title, KPI 28/34 semibold, card label 13/18) vs TailAdmin (§6u metric card: KPI 30/38 bold, label 14/20)? | *"TailAdmin (Рекомендовано)"* | Dashboard typography uses the existing theme scale and the TailAdmin §6u metric-card values; **no new font-size or line-height token**. Orchestrator reading, reversible: the same rule applies to the spec's other chrome numbers that TailAdmin already defines (card radius/border/padding, status-badge size). Only dimensions TailAdmin has no value for (e.g. the 72px desktop top bar, the 132px top-card minimum height, the 384px chart-card minimum height, the 1440px content cap) become new `theme.other` roles. |
| **D78-6** | Route of the agent page? | *"/{locale}/cabinet/statistics"* | Route fixed. |
| **D78-7** | (2026-09-24, at 874's design) What is 874's scope under GR-1, and which sprint does it belong to? | Scope: *"Manager subtree (Recommended)"*. The option read: *"Migrate AdminExchangeProvidersManager fully to canonical Mantine: table via MantineDataTableToCards (precedent: AdminUsersTable), the form + delete dialogs via the canonical Mantine modal pattern, native PasswordInput. It gets its own Story and a manifest entry, drops all ui/* imports and AdminTable, and ui/PasswordInput plus its legacy Story are deleted. The rest of /admin/currency (page, AdminCurrencyTabs, AdminPageHeader, AdminCurrenciesManager) is filed as task 877."* Sprint: *"Move to Sprint 78 (Recommended)"*. | 874 moves here from Sprint 81 with that scope. **877** is reserved here for the rest of `/admin/currency`. |
| **D78-8** | (2026-09-24, at 877's design) Q1: *"877: AdminPageHeader … is shared by 17 admin pages. How should 877 handle it?"* Q2: *"877: AdminCurrenciesManager … renders the shared legacy AdminTable. How should it get its table?"* | Q1: *"Migrate shared file (Recommended)"*. The option read: *"Rewrite AdminPageHeader in place on Mantine (Group/Title/Text, same props) with its own Story and manifest entry. All 17 admin pages get the canonical header at once, and the owner matrix checks it on 2-3 of them."* Q2: *"Migrate shared AdminTable"*. The option read: *"877 also rewrites AdminTable + AdminCardList on Mantine, which changes the tables of all 5 remaining admin managers at once. Much larger blast radius and a larger owner matrix."* | Under GR-0, 877 delivers both as **adapters over the extended canonical patterns** `MantineDataTableToCards` and `MantineDashboardHeader`, not as parallel copies (877 kickoff §5 item 1). The real count of header consumers is 16, not 17. |

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
| **843** | Canonical dashboard card patterns: `MantineDashboardCard`, `MantineDashboardStatCard`, `MantineDashboardStatRows` + their `theme.other` roles | P1 | Q3 | — | ✅ `APPROVED WITH NOTES` 2026-09-18 (review 4, joint with 844; owner visual accepted) — archived → [`Sprint_78_kickoff_prompt_Task_843_…`](Sprint_78_kickoff_prompt_Task_843_Dashboard_Card_Patterns.md) · [session log](../../docs/sessions/2026-09-18-task843-dashboard-card-patterns.md) |
| **844** | `MantineDashboardWorkList`, the shared listing-status tone source, and `RelativeTime` on Mantine with an absolute-time tooltip | P1 | Q3 | 843 | ✅ `APPROVED WITH NOTES` 2026-09-18 (review 3, joint with 843; owner visual accepted incl. `/admin/listings`) — archived → [`…_Task_844_…`](Sprint_78_kickoff_prompt_Task_844_Dashboard_Work_List_Status_Tone_Relative_Time.md) · [session log](../../docs/sessions/2026-09-18-task844-worklist-status-tone-relativetime.md) |
| **845** | ApexCharts + eight canonical chart patterns (Line, Bar, Donut, SemiDonut, Radar, RadialProgress, ChartLegend, ChartStateFrame) | P1 | Q3 | 843, 844 | ✅ `APPROVED WITH NOTES` 2026-09-20 (review 3, Revision 2 + tooltip follow-up; owner visual accepted; OD-1 = B and OD-2 = B, both waivers — 853/855 amended) — archived → [`…_Task_845_…`](Sprint_78_kickoff_prompt_Task_845_Dashboard_Chart_Patterns.md) · [session log](../../docs/sessions/2026-09-19-task845-dashboard-chart-patterns.md) |
| **846** | `MantineDashboardHeader`, `MantineDashboardPeriodControl`, `MantineDashboardGrid` + `src/lib/dashboard/period.ts` (Tirane completed periods) | P1 | Q3 | 843; **861** (owner decision 2026-09-20) | ✅ **APPROVED WITH NOTES (review 2, 2026-09-20) — ARCHIVED.** Re-reviewed **unchanged** after 861 landed, per §16.1's binding consequence 2: only AC3 was re-verified, and all six production hashes are byte-identical to the review-1 witnesses. AC3 now passes keyboard-only end to end in real Chromium — `Enter` opens the picker with no pointer, the 122-day range raises `role="alert"`, focus returns to the trigger, `onChange` is never called, positive control live. Only post-review-1 edit to any 846 file is the two ratified D1 Story selector lines (§16.9). **853/854 must write the period back to the URL.** Ledger row → `docs/backlog-archive.md` (2026-09-20). **Wave A complete; Wave B open.** → [`…_Task_846_…`](Sprint_78_kickoff_prompt_Task_846_Dashboard_Header_Period_Grid.md) |
| **847** | Admin dashboard server data layer (ADM-01/02/06/08/09/11, recent listings, location requests) with per-block error results | P1 | Q1 | 846 (`period.ts`) | ✅ **APPROVED WITH NOTES (review 1, 2026-09-20) — ARCHIVED.** `blockResult.ts` + `queries.ts` / `hrefs.ts` / `types.ts` + two test suites; a failed query, a thrown exception or a `null` count/`data` fails **its own block** and never reads as `0`. ADM-08/09/11 take their predicate only from the canonical visibility helpers. Verified against the tree: six matching hash witnesses, empty AC3/AC6 greps, AC4's single allowed hit at `queries.ts:241`, a real two-armed plant, 31 tests + critical-flow 66/66, typecheck/lint/build/integrity/mojibake all 0. Notes (P3): the kickoff's `git grep` ACs were vacuous on untracked files (re-run with `--untracked` and re-verified here); `check:listing-visibility` is blind to factory-chained predicates → **863**; ADM-06's href encodes the comma; shared counts couple ADM-01/11, 08/11 and 09/11; the ADM-11 consistency check can race the clock (spec-mandated). Ledger row → `docs/backlog-archive.md` (2026-09-20). **853 is unblocked.** → [`…_Task_847_…`](Sprint_78_kickoff_prompt_Task_847_Admin_Dashboard_Data_Layer.md) · [session log](../../docs/sessions/2026-09-20-task847-admin-dashboard-data-layer.md) |
| **848** | Agent statistics server data layer + `role='agent'` gate (AGT-01/02/05/10) with owner isolation | P1 | Q4 | 846 (`period.ts`), 847 (`BlockResult`) | ✅ **APPROVED WITH NOTES 2026-09-20**, archived (review 1; notes → **864**) → [`…_Task_848_…`](Sprint_78_kickoff_prompt_Task_848_Agent_Statistics_Data_Layer.md) |
| **849** | `listing_activity_daily` + idempotent recompute + `GET /api/cron/listing-activity` **daily** (Hobby) + backfill + read helpers | P1 | Q4 | 846, 851, O78-1 | ✅ **APPROVED WITH NOTES (review 2, 2026-09-20) — ARCHIVED.** Review 1 closed AC1–AC4/AC6/AC7 owner-native on the live database (idempotency two-armed with the 6789 plant fired and erased and the phantom row cleared, aggregate = raw on all three metrics, the `is_owner_click` exclusion proven with a positive control, grants/RLS locked, R3 read functions returning exactly `period.days` rows). **AC5 closed by the two-edit re-entry:** O78-1 = **Hobby** → `vercel.json` `30 0 * * *` + `ACTIVITY_REFRESH_CADENCE='daily'` (26 h); the cadence test's `if (!entry) return` guard no longer fires, so it really asserts; all seven hashes equal the tree and the build lists the route. Accepted third edit: a `Record<ActivityRefreshCadence, number>` lookup forced by TS2367, values unchanged. **Open owner action (carried in `docs/backlog.md`, not here):** the first scheduled `200`, and confirmation that a deployment with a **fifth** Hobby cron succeeds. Archive row 2026-09-20 → [`backlog-archive.md`](../../docs/backlog-archive.md) · kickoff **§16–§17** → [`…_Task_849_…`](Sprint_78_kickoff_prompt_Task_849_Listing_Activity_Daily_Aggregate.md) · [session log](../../docs/sessions/2026-09-20-task849-listing-activity-daily.md) |
| **850** | WhatsApp click event: server resolves the owner; guest clicks recorded through a rate-limited server path | P1 | Q4 | — | ✅ **APPROVED WITH NOTES (review 1, 2026-09-20) — ARCHIVED.** Held at `PARTIALLY VERIFIED` while R1/R2 were unrun SQL, then approved the same day on the owner's live-database grid: step 1 applied, and verify PART (a) fired **both** arms — spoofed owner `a5a5bdc1…` stored as the real `1f937a00…` with `is_owner_click` reset to false (`corrected = true`, a real correction since the two differ), and an unknown listing raising `sqlstate 23503`. Code half verified against the tree: 9/9 red→green, the plant's `TS2578` with an equal pre/post hash, the action is the **only** writer to `listing_contact_events` in `src/`, census PASS, build 0. In-task fix: `rls-write-path-manifest.md:42` reclassified `user-scoped` → `service-role`. Filed, not fixed: `WhatsAppContactButton.tsx` and `ListingMobileCTA.tsx` have zero importers in `src/` (dead — this pattern superseded the mobile bar) → **814**. Notes (P3): read-then-insert de-dup is not atomic; `actor_ip_hash = ''` for an IP-less guest; the 30-min window is an INFERENCE. **Open owner action (carried in `docs/backlog.md`, not here): O78-4 step 2 + verify (b)/(c) + the guest tap, after the deploy.** Archive row 2026-09-20 → [`backlog-archive.md`](../../docs/backlog-archive.md) · [`…_Task_850_…`](Sprint_78_kickoff_prompt_Task_850_WhatsApp_Event_Server_Owner.md) · [session log](../../docs/sessions/2026-09-20-task850-whatsapp-event-server-owner.md) |
| **851** | The four existing cron routes answer Vercel's `GET` and fail closed without `CRON_SECRET` | P1 | Q4 | O78-2 ✅ | ✅ APPROVED WITH NOTES 2026-09-20, **archived** (archive row) — O78-2 returned empty logs and the crons are **Disabled**; first-run grid measured 7 silent baseline rows and zero emails; enabling all four is a live owner action → [`…_Task_851_…`](Sprint_78_kickoff_prompt_Task_851_Cron_Routes_Answer_GET.md) |
| **852** | Admin shell on Mantine: `AdminShell`/`AdminSidebar`/`AdminMobileHeader`/`AdminLocaleSwitcher` through an extended `MantineAppShellFoundation` | P1 | Q3 | — | 🔁 NEEDS REVISION 2026-09-26 (review 3: owner returned AdminShell — viewport pinned in 3 story exports) → [`…_Task_852_…`](Sprint_78_kickoff_prompt_Task_852_Admin_Shell_Mantine.md) §18 |
| **853** | `/admin` operations dashboard (P0 blocks) composed from the 843–846 patterns; recent-listings preview on `MantineModal` | P1 | Q3 | 843–847, 852 | 📝 KICKOFF FILED → [`…_Task_853_…`](Sprint_78_kickoff_prompt_Task_853_Admin_Operations_Dashboard.md) |
| **854** | `/{locale}/cabinet/statistics` for agents (P0 blocks) + "Statistics" menu entry | P1 | Q4 | 843–846, 848 | 📝 KICKOFF FILED → [`…_Task_854_…`](Sprint_78_kickoff_prompt_Task_854_Agent_Statistics_Page.md) |
| **855** | Activity analytics on both dashboards: ADM-10, the agent single-event chart, AGT-03, AGT-10 activity columns | P1 | Q3 | 849, 850, 853, 854 | 📝 KICKOFF FILED → [`…_Task_855_…`](Sprint_78_kickoff_prompt_Task_855_Activity_Analytics_Integration.md) |
| **856** | AGT-11 "Top listings by …" photo cards with a single-channel selector | P2 | Q3 | 849, 854, 855 | 📝 KICKOFF FILED → [`…_Task_856_…`](Sprint_78_kickoff_prompt_Task_856_Agent_Top_Listings.md) |
| **857** | `/admin/listings` honours `visibility=visible` (drill-down landing for ADM-08/ADM-11) — `AdminListingsTable` (759 ln, legacy) must migrate under 16d when its filter UI changes | P2 | Q3 | 853 | reserved — kickoff after that surface's census |
| **858** | `/admin/reports` honours `?status=` (ADM-02 landing) — `AdminReportsManager` (508 ln, legacy) | P2 | Q3 | 853 | reserved — kickoff after that surface's census |
| **859** | `/admin/support` honours `?assigned=unassigned&status=` (ADM-06 landing) — `AdminSupportManager` (903 ln, legacy) | P2 | Q3 | 853 | reserved — kickoff after that surface's census |
| **860** | `sendEmailChangeEmails` throws before sending: `emailChange.ts:177` uses `timeZone: 'Europe/Tirana'`, which Node rejects (`RangeError: Invalid time zone specified`, measured 2026-09-18, Node 22.22.3); the IANA id is `Europe/Tirane`. Critical-flow row "Email change". | **P1** | Q4 | — | 📝 `KICKOFF FILED` 2026-09-25 — hosted here by discovery, not goal fit (found while designing 846); the owner may move it. Track B, first → [`…Task_860…`](Sprint_78_kickoff_prompt_Task_860_Email_Change_Timezone_RangeError.md) |
| **885** | Every date-time the site shows uses the 24-hour clock: canonical `DATE_FORMAT` `sq`/`en` → `hour12: false` (Owner decision 2026-09-25, verbatim: *"у Європі ми використовуємо 24 години, а не 12 годин!"*) | P2 | Q3 | **860** | reserved 2026-09-25 — hosted here next to 860; the owner may move it. Full text → [`backlog-reserved.md`](../../docs/backlog-reserved.md) |
| **861** | **`RangeDatePicker`'s trigger opened on pointer only, so the canonical date-range picker could not be opened by keyboard at all** (WCAG 2.2 SC 2.1.1), on a registered critical flow — and its clause-16d census pulled the notification bell's whole popover into scope. | **P1** | Q4 | — | ✅ **APPROVED WITH NOTES (review 3, 2026-09-20) — ARCHIVED.** Trigger is a semantic `<button>`; ARIA lands only on native-button triggers (review 1 F2) and the bell's `ActionIcon` carries its own; `NotificationCenter` + `NotificationItem` migrated, storied and enrolled **inside 861** (862 folded, never issued); owner accepted all 7 visual tuples including the two §17.1 deltas; F7 retired the orphaned `task319` QA script. Ledger row → `docs/backlog-archive.md` (2026-09-20). **This unblocks 846 and Wave B.** |
| **863** | `check:listing-visibility` cannot see a listings predicate chained through a query-builder factory | P2 | Q4 | — | reserved 2026-09-20, filed by 847's review — measured two-armed with the gate's own detector: a genuine inline predicate behind `listingCount()` yields **0** violations, while the same predicate written directly on `from('listings')` yields 2. Full text → [`backlog-reserved.md`](../../docs/backlog-reserved.md) |
| **864** | A `git grep` acceptance criterion is vacuous against the files its own task creates | P2 | Q1 | — | reserved 2026-09-20, filed by 848's review — third recurrence after 843 and 847. ~~852 · 853 · 854 · 855 · 856 still carry the plain form~~ **applied to 852–856 on 2026-09-25 (`--untracked` in every `git grep`); still open: the future-kickoff guard and the `period.ts` export**; 850 and 851 closed unaffected (their grep targets are tracked+modified, not created). Folds in a `period.ts` forward day-add export. Full text → [`backlog-reserved.md`](../../docs/backlog-reserved.md) |
| **874** | The exchange-provider manager on canonical Mantine: the containers plus `AdminExchangeProvidersView` and `ProviderFormDialogView`, each with its own Story and manifest entry. Then `ui/PasswordInput` and its legacy Story are deleted (D78-7; moved from Sprint 81) | P3 | Q3 | 873 (landed) | 📝 `KICKOFF FILED` 2026-09-24 → [`…Task_874…`](Sprint_78_kickoff_prompt_Task_874_Exchange_Providers_Manager_On_Mantine.md) |
| **877** | The rest of `/admin/currency` on canonical Mantine: `page.tsx`, `AdminCurrencyTabs` (legacy `tabs`), `AdminPageHeader`, `AdminCurrenciesManager` (81 `className`, 10 `ui/*` bindings), plus the decision for the shared `AdminTable`/`AdminCardList` it still renders (five consumers after 874). Full census first (filed 2026-09-24 by 874's design, D78-7). **Scope per D78-8:** the shared `AdminTable` and `AdminPageHeader` become adapters over the extended `MantineDataTableToCards` and `MantineDashboardHeader`; `AdminCardList` and three legacy Stories are deleted | P3 | Q3 | 874 | 📝 `KICKOFF FILED` 2026-09-24 → [`…Task_877…`](Sprint_78_kickoff_prompt_Task_877_Admin_Currency_Page_And_Shared_Admin_Table_On_Mantine.md) |
| **868** | `/admin/pages` on canonical Mantine, and a refused publish tells the admin why: containers `AdminPagesManager`/`PageEditorDialog` render the new Views `AdminPagesView`/`PageEditorDialogView` (own Stories, manifest); `sq_body_required` shown on the Albanian body field; delete confirm on `MantineModal`; page width token `adminPageNarrowMaxWidth`; rider: `admin.footer.link_url_invalid_internal` reworded (filed 2026-09-21 by 867's design, routed from Sprint 79) | P3 | Q3 | **877** | 📝 `KICKOFF FILED` 2026-09-25 → [`…Task_868…`](Sprint_78_kickoff_prompt_Task_868_Admin_Pages_On_Mantine_With_Publish_Refusal_Reason.md) |
| **865** | Close the one live anonymous write path: `listing_views` → `"Anyone can insert a view"` | P2 | Q4 | — | reserved 2026-09-21, filed by 850's owner-native closure — `PERMISSIVE`, `roles {public}`, `with_check = true` plus anon's INSERT grant let an anonymous caller insert view rows straight through PostgREST, bypassing `record_listing_view` and the guards `rls-rules.md:378` cites as the reason that exception is acceptable. **SCOPE LOCKED NARROW by owner decision 2026-09-21** — that policy + that table's anon write grants + the `rls-rules.md` row + proof tracking still works; **not** a schema-wide audit. Full text → [`backlog-reserved.md`](../../docs/backlog-reserved.md) |

**Why 857–859 are reserved, not kicked off.** Each needs its target page to read a URL filter. Each page is a large
legacy manager; changing its visible filter state brings the whole surface under clause 16d, which a responsible
kickoff can scope only after a full census of that surface. Until they land, 853's cards link to the filtered URLs
(harmless query strings, ignored by those pages today), and the kickoff records that the landing is unfiltered.

## Execution order

Sequential inside each wave: the pattern tasks edit the same `theme.ts`, the manifest and `messages/*.json`, and
parallel Sonnet sessions would conflict on them.

| Wave | Tasks | Gate to start the next wave |
|---|---|---|
| A — patterns | **843 → 844 → 845 → 846** | ✅ **COMPLETE 2026-09-20.** All four approved and archived, plus **861** (the cross-sprint keyboard-trigger prerequisite the owner promoted ahead of 846 under Option B). `period.ts` is final, so **Wave B is open** — 847/848 may start. 846 and 861 share `messages/*.json` + `scripts/mantine-migration-scope.json` and land in one combined commit. |
| B — data (independent of A except `period.ts`) | **849** · **850** · ~~**847**~~ · ~~**848**~~ · ~~**851**~~ | **847, 848 and 851 are approved and archived 2026-09-20**, so `BlockResult`, `getAdminDashboardData()`, `src/modules/cabinet/statistics/` and `src/lib/cron/verifyCronRequest.ts` are final and Wave C's 853/854 are unblocked. **849 and 850 remain**, neither touching `period.ts`; 849 reuses 851's helper and is the only one still editing `vercel.json`. Both kickoffs still carry the vacuous `git grep` AC form — fix via **864** before execution (851's two lines were **not** affected: they grep tracked route files and returned real hits). |
| C — surfaces | **852 → 853** · **854** | A approved; 853 also needs 847 + 852; 854 needs 848 |
| D — analytics | **855 → 856** | 849 + 850 approved and the aggregate populated in production (O78-3) |
| E — landings | 857 · 858 · 859 | kickoffs written after each surface census |

**Re-sequenced 2026-09-25** (owner request: *"надай мені короткий список виконання задач у Sprint 78 та 79, бо задачі там
пов'язані одна з одною"*). The waves above stand. Three cross-task facts change the order inside them:

1. **877 before 857 and 859.** 877 turns the shared `AdminTable` into an adapter over `MantineDataTableToCards`
   (D78-8). `AdminListingsTable` (857) and `AdminSupportManager` (859) render it, so their censuses must be taken
   after 877 lands. 858 (`AdminReportsManager`) does not render it.
2. **874 → 877 → 868 is one chain.** 877 needs 874. 868 needs 877's `visibleFrom`, `AdminPageHeader` adapter and
   page-width token.
3. **One UI task at a time.** `messages/*.json`, `theme.ts`, `scripts/mantine-migration-scope.json` and
   `scripts/surface-census-baseline.json` are shared by every UI task here. Non-UI tasks (860, 863, 865, and Sprint
   79's 884) can run beside one UI task.

| Order | Track A — admin/agent UI (sequential) | Track B — bugs and security (beside A) |
|---|---|---|
| 1 | **852** admin shell | **860** email change throws (P1) → **885** 24-hour clock site-wide |
| 2 | **853** admin dashboard | **865** `listing_views` anonymous write — kickoff first |
| 3 | **854** agent statistics (Q4) | **863** `check:listing-visibility` blind spot |
| 4 | **874** → **877** → **868** | — |
| 5 | **855** → **856** (after O78-3's first scheduled run) | — |
| 6 | **858**, then **857** · **859** (after 877; census, then kickoff) | 864's remaining guard |


## Owner actions this sprint needs

| ID | Action | Blocks |
|---|---|---|
| **O78-1** | ✅ **ANSWERED 2026-09-20 — "Hobby"** (owner, verbatim), confirmed by the Vercel Settings → Cron Jobs screenshot: project badge **Hobby**, and the panel's own notice *"All scheduled times use the UTC timezone. Cron jobs on Hobby have a flexible time window of 1-hour."* **Binding consequence for 849 (D78-4's only permitted fallback):** `vercel.json` gets `{"path":"/api/cron/listing-activity","schedule":"30 0 * * *"}` and `ACTIVITY_REFRESH_CADENCE` in `src/modules/analytics/activity/types.ts` becomes `'daily'` — in the same commit, which also moves `STALE_AFTER_MS` to 26 h. An hourly expression would fail every deployment. The 26 h threshold is correct for this plan: 00:30 UTC + the 1-hour window puts every run at 01:30–03:30 Tirane, i.e. always after local midnight, in both CET and CEST, so each completed Tirane day still gets a final recompute as `yesterday`. | closed — 849 R5 unblocked |
| **O78-2** | ✅ **ANSWERED 2026-09-20** (851's review). View Logs is **empty** for all four paths — no `405`, no `200` — because **Cron Jobs is Disabled**; the 405 claim stays `UNKNOWN` and is moot. `CRON_SECRET` **is** set for Production (+ Preview), sensitive. Production branch `main`; every commit deploys. Verbatim in `docs/sessions/evidence/task851/owner-o78-2-and-first-run-impact.md`. **Successor owner action:** enable the four crons after 851 deploys — owner authorized all four together on the measured grid. | closed — 851 archived |
| **O78-3** | 🟡 **PARTLY DONE 2026-09-20.** SQL **applied**; backfill returned six `success` rows `2026-03-25 → 2026-09-20` (**AC6 closed**). Consolidated grid returned: **AC7(c) closed** (anon/authenticated have no table select and no function execute; RLS on both tables; service_role select true) and the three R3 read functions **execute**, returning exactly 7 rows for a 7-day range — the guard that protects 855/856. **AC2 closed 2026-09-20, two-armed** on the busiest real day 2026-09-10: two recomputes agreed (6 rows / 12 views); a planted corruption moved the total to 6789 = `12 + 6×1000 + 777`; the next recompute restored 6 / 12 and erased the phantom row — proving the delete clears the whole range, not just its own key set. **AC3 closed on all three metrics**, each on its own busiest day: `recorded_views` 12 = 12 on 2026-09-10 with 0 per-listing mismatches (half-open `timestamptz` bounds agreeing with the direct date cast), `whatsapp_clicks` 2 = 2 on 2026-09-11, `listing_inquiry_submissions` 1 = 1 on 2026-07-30. **`is_owner_click = false` exclusion closed 2026-09-20** by a net-zero probe on 2026-09-11: baseline 2 → owner click added, still **2** → same row flipped to `false`, **3** (positive control) → deleted, back to **2** and 4 table rows. **O78-3 is done apart from the first scheduled run's refresh row**, which needs 849's `vercel.json` entry deployed first. | Wave D |
| **O78-4** | Apply 850's SQL script (guest insert path) to Supabase. | 850 AC on a live DB |
| **O78-6** | 877's `OWNER VISUAL QA REQUIRED` matrix (kickoff §13.3): the four new `Table` exports, `DashboardHeader` `WithActions`, the new `AdminTable`/`AdminPageHeader`/currency Views/`AdminCurrencyTabs` Stories, **plus the blast radius**: the legacy `Admin/AdminListingsTable`, `Admin/AdminSupportManager`, `Admin/AdminCompaniesManager` and `Admin/AdminPropertyTypesManager` `Default`, which now render the new `AdminTable`. | 877 approval |
| **O78-5** | 874's `OWNER VISUAL QA REQUIRED` matrix, 4 locales × 320/1440, 64 tuples in all:<br>• `Patterns/Mantine/AdminExchangeProvidersView`: `Default`, `Empty`, `Pending`, `DeleteConfirm`;<br>• `Patterns/Mantine/ProviderFormDialogView`: `New`, `Edit`, `ApiKeyRevealed`, `Submitting`. | 874 approval |
| **O78-7** | 868's `OWNER VISUAL QA REQUIRED` matrix (kickoff §13.3), 48 tuples: `Patterns/Mantine/AdminPagesView` × 5 states and `Patterns/Mantine/PageEditorDialogView` × 6 states at `sq`/`uk` × 390/1440, plus `AdminPagesView` `Default` at `en`/`it` × 768/1024. After the deploy: publish a page with an empty Albanian body on `/admin/pages` and confirm the field message. |

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
