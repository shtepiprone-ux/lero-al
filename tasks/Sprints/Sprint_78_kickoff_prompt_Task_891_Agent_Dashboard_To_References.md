# Task 891 — `/{locale}/cabinet/statistics` rebuilt to the owner's references: KPI mini-charts, the activity chart, the portfolio donut, top listings, AGT-10 activity columns — and 854 closed with it

Sprint 78 · P1 · QA profile **Q3** (+ 854's Q4 isolation evidence carried forward) · Wave D (D78-9) · depends on
**889** approved · builds on **854's working tree** and closes **854 jointly** · folds **855**'s agent half and **856** ·
**Status: 🔁 NEEDS REVISION (review 6, 2026-09-29) — execute §22 (revision 5: `RangeDatePicker` chrome in Storybook, mobile bar divider, mobile header month, fresh evidence) on top of the current working tree**

Sprint plan: [`Sprint_78_…`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md) → **D78-9** (owner,
2026-09-27). The owner, verbatim: *"Я не приймаю таку візуально жахливу Dashboard для … агента"*. Their chart
choices were *"Area-графік активності, Donut портфеля, Топ-оголошення (стовпчики), KPI з міні-графіком"*. D854-1 was
answered *"A: перенос у 2 рядки (Рекомендовано)"*, and the style is *"Композиція референсів"* (D78-5 stands).
854 kickoff: [`…_Task_854_…`](Sprint_78_kickoff_prompt_Task_854_Agent_Statistics_Page.md) §16–§17.

## 1. Mode and task type

`IMPLEMENTATION` — recompose `AgentStatisticsView` (854, uncommitted and under review) around charts, move its
inquiry numbers onto the activity aggregate, add activity columns to AGT-10, and apply D854-1 = A. Bundles:
**UI / Current Mantine path** + **Profile / Edit Flow** (cabinet) + **DB / Server Action / RLS** (owner-scoped
reads) + **Storybook / Visual Proof**.

## 2. Objective

The agent page reads like the owner's references:
- **Kamr** `kamr-vite.vercel.app/dashboard`: the multi-line "Guest Activity" area chart, and the "Rooms Availability"
  donut with its numbers in the legend;
- **Lahomes** `techzaa.in/lahomes/admin/dashboard-agent.html` and its analytics page: KPI cards with mini-bars, and a
  hero card.

The numbers stay honest: one named event per series, and different events are never summed.

### 2.1 Composition (desktop ≥ `lg`; reference block in brackets)

| Row | Grid | Content |
|---|---|---|
| Header | — | Unchanged from 854 (title, subtitle, updated-at, period control). With a stale aggregate, the updated-at reads the last refresh time (R10). |
| 1 | `TopRow` (4) | **AGT-02 "Visible now"** as `variant="accent"` with the value only; its inventory rows move to row 3 (Omah hero / Lahomes "My Balance"). Then three KPIs for the period, each with a `comparison` from `compareToPrevious` (neutral colour, "no base for comparison" when the previous value is 0) and a `chart` = `MantineDashboardSparkline` of the daily values over the period: **AGT-03 "Recorded views · {period}"**, **"WhatsApp clicks · {period}"** and **AGT-05 "Form inquiries · {period}"** (keeping 854's info tooltip) (Lahomes KPI row). |
| 2 | `Split` 8 + 4 | **main:** "Activity · {period}" using `MantineDashboardLineChart mode="multi"`, with three series (views, WhatsApp, form) that are never summed (Kamr "Guest Activity"). **side:** **AGT-01 "Needs my action"** (854's card, unchanged). |
| 3 | `Split` 8 + 4 | **main:** "Top listings by views · {period}" using `MantineDashboardBarChart horizontal`, the top 5 of the agent's listings with `recordedViews > 0`, ties broken by last activity and then by id. **side:** "My portfolio", a `MantineDashboardDonut` with visible / needs action / not visible, and under it AGT-02's inventory rows (`MantineDashboardStatRows`, 854's hrefs) (Kamr "Rooms Availability"). |
| 4 | `Full` | **AGT-10** (854) is now full width. It gains the columns recorded views, WhatsApp clicks and last activity; form inquiries now come from the aggregate; D854-1 = A applies (R12). |

## 3. Verified context — measured 2026-09-27 (re-measure at I0)

- **854's state (FACT).**
  - 854 is uncommitted in the working tree. The files are `page.tsx`, `AgentStatisticsView.tsx` (hash `5977b6e6…`),
    `tableParams.ts` (`e048b83a…`), the Story and fixtures, and `UserMenu` and `MobileNavDrawer` with their Stories.
  - Reviews 1 and 2 accepted everything except F4, the AGT-10 table overflow. D854-1 = A resolves F4 here.
  - The owner matrix (854 §13.3) was never run and is **superseded by §13.4 below** for the dashboard rows. §13.3 rows
    #7–#10 (menu, drawer, user and guest redirects, agent B) carry over as §13.4 rows 7–9.
- **The view:** `src/modules/cabinet/statistics/components/AgentStatisticsView.tsx`.
  - Namespaces are `cabinet.statistics`, `listing`, `cabinet`, `dashboard.period` and `dashboard.common`.
  - The table columns are at `:216-223`. The card is at `:225-235`. `showAgt10Empty` and `filtersActive` are at
    `:237-243` (854 R11).
- **The data** (`src/modules/cabinet/statistics/data.ts`, 848):
  - `readOwnInquiriesViaServiceRole` (`:138`), `countInquiries` (`:178`) and `inquiriesPerListing` (`:186`) are 848's
    direct inquiry reads. The form-inquiry sort (`table.sort === 'form_inquiries'`) calls `inquiriesPerListing` (`:~280`).
  - `readAgt10` is at `:261`, and `getAgentStatisticsData` at `:326`.
  - Types (`types.ts`): `Agt02` carries `statusCounts: Record<ListingStatus, number>` (`:42`). `Agt10Row.formInquiries`
    is at `:78`.
- **Activity (849):**
  - `getOwnerActivitySeries(ownerId, period) → BlockResult<ActivityPoint[]>`;
  - `getOwnerActivityByListing(ownerId, period) → BlockResult<ActivityByListingRow[]>`, where each row is
    `{ listingId, recordedViews, whatsappClicks, listingInquirySubmissions, lastActivityDate }` and only listings with
    activity appear;
  - `getActivityFreshness(now)`.
  - The aggregate is live and backfilled.
- **Sort contract:** `tableParams.ts` → `AGT10_SORT_TOKENS` carries one `sort=` token for field + direction (854
  §16.2), and `resolveSortToken` uses `Object.hasOwn` (854 R13).
- **Patterns from 889** (must be approved): `MantineDashboardSparkline`, the StatCard `chart`/`variant="accent"`, and
  the BarChart `horizontal`.
- **854 §17.2 measurement (FACT, reviewer 2026-09-27):** in the 8-column card, the AGT-10 table was 1296px inside a
  viewport of 599–876px. The cause is the pattern's `td { whiteSpace: 'nowrap' }` (`MantineDataTableToCards.tsx:437`)
  cancelling `lineClamp={2}` (`AgentStatisticsView.tsx:174`).

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | D78-9 | `page.tsx` also fetches, in one `Promise.all` with 848's data: `getOwnerActivitySeries` for the current and the previous period, `getOwnerActivityByListing(current period)` and `getActivityFreshness(now)`. Each call takes the **session-derived `ownerId` only** (854 R2 unchanged). Props stay serializable (791). | P0 | AC1 | Confirmed |
| **R2** | §2.1 row 1 | AGT-02 becomes `variant="accent"` with its value only; the inventory rows move to R6. AGT-03, WhatsApp and AGT-05 are StatCards whose values are period sums from the owner series (AGT-05 ← `listingInquirySubmissions`). Each has a comparison against the previous-period sum (`compareToPrevious`; the 854 wording keys, neutral colour) and a `chart` sparkline (`color` = the matching `theme.other.chartSeries` key, one bar per period day, `dateLabel` = a Tirane short date). A failed series read puts those three cards into their error state (Retry), never 0. | P0 | AC2 | Confirmed |
| **R3** | §2.1 row 2 | The activity card: `MantineDashboardLineChart mode="multi"`, series `recordedViews`, `whatsappClicks` and `formInquiries`, with 855 §3.1's descriptions (views: *"a recorded view after de-duplication, not a unique visitor"*; WhatsApp: *"a recorded attempt to follow the button; it does not confirm a message or reply"*; form: *"a stored inquiry; it does not confirm email delivery or reading"*), and empty/error/loading states. | P0 | AC3 | Confirmed |
| **R4** | §2.1 row 2 | AGT-01 moves to row 2's side and is otherwise unchanged. | P1 | AC7 | Confirmed |
| **R5** | §2.1 row 3, D78-9 Q2 | New pure `src/modules/cabinet/statistics/topListings.ts` → `rankTopListings(byListing, listings, limit = 5)`. It keeps rows with `recordedViews > 0`, sorts by views descending, then `lastActivityDate` descending (null last), then `listingId`, and joins titles from the owner's own listing list. Unit tests cover the ties, null last-activity, zero exclusion and a listing id missing from the owner list (dropped). The card uses `MantineDashboardBarChart horizontal`, one series `recordedViews`, with titles as the categories; with no rows it shows the chart's empty state ("No recorded views in this period"). | P0 | AC4 | Confirmed |
| **R6** | §2.1 row 3, 855 R4 | New pure `portfolioSegments(statusCounts, hidden)` → `visible` = AGT-02 visible; `needs_action` = pending + active-hidden (AGT-01 hidden); `not_visible` = inactive + sold + rented + archived + expired. Unit test: the three segments are disjoint and sum to all listings. The donut has **no segment links** (OD-1 = B, 2026-09-20). Under it sit AGT-02's `MantineDashboardStatRows` (pending, inactive, sold "marked by me", rented "marked by me", each with 854's href). | P0 | AC5 | Confirmed |
| **R7** | 855 R5/R6 | AGT-10: `Agt10Row` gains `recordedViews`, `whatsappClicks` and `lastActivityDate`, merged from `getOwnerActivityByListing` by `listingId` (missing = 0 / null, **only after a successful read**). `formInquiries` comes from `listingInquirySubmissions`. `AGT10_SORT_TOKENS` gains `views_desc`, `views_asc`, `whatsapp_desc`, `whatsapp_asc`, `activity_desc` and `activity_asc`. Every activity sort orders **all** of the owner's matching listings before paging (10 per page). `readOwnInquiriesViaServiceRole`, `countInquiries` and `inquiriesPerListing` are **deleted** together with their tests (a clause-9 deletion audit: `git grep --untracked -n -E "countInquiries\|inquiriesPerListing\|readOwnInquiriesViaServiceRole" -- src` prints nothing). If the by-listing read fails, AGT-10 shows its error state. | P0 | AC6 | Confirmed |
| **R8** | 854 R9 | Table columns: title (thumb + link), status, visibility, expires, views, WhatsApp, form, last activity (date + `RelativeTime`), actions. Card meta rows below `md`: visibility, expires, views, WhatsApp, form and last activity, each labelled. | P0 | AC6 | Confirmed |
| **R9** | 16c, GR-3 | `Patterns/Mantine/AgentStatisticsView` keeps its exports; `Default` gains activity fixtures. New exports: `ActivityStale`, `ActivityError`, `NoActivity` (all-zero period: empty chart, 0 KPIs with "no base", top-listings empty) and `SortedByViews` (25 listings, `sort=views_desc`, page 1). Fixtures extend `agentStatistics.fixtures.ts`; no wall-clock values. | P0 | AC8 | Confirmed |
| **R10** | 855 R8 | When `freshness.ok && freshness.data.stale`, the header shows the last refresh time and the activity chart shows its data plus a stale caption. When `freshness` fails, the activity chart and the three KPIs show their errors, never 0. | P0 | AC3 | Confirmed |
| **R11** | i18n | New `cabinet.statistics` keys in all four locales: KPI labels, series labels and descriptions, card titles, "No recorded views in this period", the stale caption, the donut segment labels, and the new column and sort labels. No label uses "lead", "conversion" or "contact" (854 R4). | P0 | AC9 | Confirmed |
| **R12** | D854-1 = A (854 §17.3–§17.4 R15) | `MantineDataTableToCards`'s `TableColumn` gains `wrap?: boolean` (default `false`, so every existing consumer keeps `nowrap`). With `true`, that column's `Table.Th`/`Table.Td` add `whiteSpace: 'normal'` to the pattern's existing per-cell `style` object. AGT-10 sets `wrap: true` on `title` (so `lineClamp={2}` applies) and on `expires` (so "(in N days)" drops under the date). `Mantine/Primitives/Table` → `CardsBelowMd` sets `wrap: true` on one existing fixture column (GR-3a EXTEND, no new export or string). | P0 | AC10 | Confirmed |
| **R13** | hardcode | No `className`, Tailwind, `@/components/ui/*`, `style=` or raw px/rem/hex in `page.tsx`, `AgentStatisticsView.tsx`, `tableParams.ts`, `topListings.ts` or `portfolio.ts`. | P0 | AC11 | Confirmed |
| **R14** | 854 closure | 854's accepted work (854 §16.1, §17.1) is preserved: the filtered-empty state, the sort-token safety, `formatDateOnly`, the menu and drawer entries, and the redirects. 854's live isolation proof is re-run once on the final tree (R15). | P0 | AC12 | Confirmed |
| **R15** | 854 R2, Q4 | Live, as `HYDRATION_AGENT1` and a second agent: each sees only their own KPI values, chart, top listings and rows. A URL with the other agent's listing id in `sort`, `page` or `status` changes nothing. The full server log has no `Functions cannot be passed` or `Attempted to call` line. | P0 | AC12 | Confirmed |

## 5. Assumptions and open questions

- **INFERENCE:** the WhatsApp KPI has no spec block ID in the retained sources (855 §3 used AGT-03 and AGT-05 only),
  so it is labelled by its event.
- 855's `?event=` selector and 856's `?top=` selector are **not** built: D78-9 Q2 chose a multi-line chart and "top
  by views". 856's photo-card pattern (`MantineDashboardTopListingCard`) is **not** created. Both folds are recorded
  in the sprint file.
- 855 R7's guest-click sentence is dropped, for the same reason as 890 §5: the guest arm is unreachable (owner
  decision A, 2026-09-21).
- No owner decision is open.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (1–7, 9–16d) · `docs/qa-profiles.md` · `docs/mantine-responsive-design-system.md` ·
`docs/tailadmin-style-reference.md` §6, §6b, §6u · `docs/component-rules.md` · `docs/domain-rules.md` · `docs/rls-rules.md` ·
`docs/data-access-rules.md` · `docs/state-authority.md` · `docs/storybook-governance.md` · `docs/i18n-rules.md` ·
`docs/qa-rules.md` · `docs/orchestrator-procedures.md` → "Corollary (791)" · `.claude/skills/execute-task/SKILL.md` ·
kickoffs 848 (archive), **854 (§16, §17)**, 855 and 856 (history), and 889.

## 7. Scope

- **Created:** `src/modules/cabinet/statistics/topListings.ts` · `src/modules/cabinet/statistics/portfolio.ts` · their
  tests under `src/modules/cabinet/statistics/__tests__/`.
- **Edited (on top of 854's tree):**
  - `src/app/[locale]/cabinet/statistics/page.tsx` · `AgentStatisticsView.tsx`;
  - `src/modules/cabinet/statistics/{data.ts,types.ts,tableParams.ts}` and their existing tests;
  - `src/design-system/mantine/patterns/MantineDataTableToCards.tsx` (R12 only) ·
    `src/stories/mantine/primitives/Table.stories.tsx`;
  - `src/stories/patterns/mantine/AgentStatisticsView.stories.tsx` · `src/stories/fixtures/agentStatistics.fixtures.ts`;
  - `messages/{sq,en,uk,it}.json`;
  - `docs/backlog.md` (the 854 and 891 lines).
- **Session log:** one new file `docs/sessions/<date>-task891-agent-dashboard-to-references.md`, which also records
  854's final Files Changed.

## 8. Out of scope

The admin dashboard (890) · the patterns themselves (889) · the menu and drawer (854, already accepted) · chat and
reviews (D78-1) · a per-event chart selector and photo top-cards (folded away by D78-9).

## 9. Current and required behavior

**Before (854 tree).**
- Row 1: AGT-01 and AGT-02.
- Row 2: AGT-10 (8 columns) with AGT-05.
- No chart. The owner rejected this.

**After.** §2.1.

**Preserve:**
- 854 §16.1/§17.1: access, redirects, the filters, the filtered-empty state, sort safety, the custom-period label,
  pagination and the menu entry;
- every block's error and Retry.

## 10. Implementation requirements

1. **I0.**
   - Platform line.
   - `git status --porcelain` → `evidence/task891/i0-status.txt`.
   - Hashes of every 854 file, which must equal 854 §17's reviewed hashes; any drift is recorded before writing.
   - Confirm 889 is approved.
   - Census of `AgentStatisticsView.tsx`.
2. Unit-tested pure functions first (R5, R6, R7 merge/sort), then data (R1, R7), then R12, then the view (R2–R4, R6,
   R8, R10), then R9/R11.
3. The census stays all tier 1 (18 nodes today; + `MantineDashboardLineChart`, `…BarChart`, `…Donut` and
   `…Sparkline`, all enrolled and storied).
4. Live proof: R15, plus `?period=7d` changing rows 1–3 and the AGT-10 activity columns, and `sort=views_desc` staying
   consistent from page 1 to page 2.
5. Record the First Load JS of `/[locale]/cabinet/statistics` before and after.

## 11. Positive and negative flows

**Positive.** An agent opens Statistics:
- the coral hero shows 12 visible listings;
- three KPIs show views, WhatsApp and forms, each with mini-bars and "±n vs the previous 30 days";
- the area chart has three lines, with AGT-01 beside it;
- the top-5 bars and the portfolio donut follow, with the status rows under the donut;
- the full-width table has two-line titles and the Edit action is visible at 1440.

| Negative flow | Applicable | Expected |
|---|---|---|
| Aggregate stale | Yes | Data + stale caption; never zeros. |
| A series, by-listing or freshness read fails | Yes | The dependent cards error with Retry; the others are fine. |
| No activity in the period | Yes | KPIs show 0 with "no base" only after a successful read; empty chart; top-listings empty. |
| Previous period 0 | Yes | "no base for comparison". |
| Agent with no listings | Yes | 854's empty AGT-10; donut empty; the others 0 / empty. |
| Filter matches nothing | Yes | 854 R11 filtered-empty (preserved). |
| Activity sort across pages | Yes | Global order (R7). |
| Cross-owner URL tampering | Yes | No effect (R15). |
| ≤ 767px | Yes | One column; AGT-10 cards with labelled rows; no horizontal scroll at 320. |
| Long `uk` strings / long titles | Yes | Wrap; the top-listings labels truncate with the full title in the tooltip. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `page.tsx`, when read, then it has no `'use client'` and no function prop, and every activity
  call takes `access.ownerId`. Quote the lines.
- **AC2 [R2]** — Given `Default` at 1440, when inspected:
  - card 1 computes `background-color: rgb(189, 67, 57)`;
  - cards 2–4 each hold one sparkline with 30 bars;
  - in `NoActivity`, cards 2–4 read 0 with "no base for comparison";
  - in `ActivityError`, they show Retry.
- **AC3 [R3, R10]** — Given `Default`, `ActivityStale` and `ActivityError`, when rendered:
  - `Default` has an area chart with 3 series;
  - `ActivityStale` has data plus the stale caption;
  - `ActivityError` has the chart error, and no 0 appears.
- **AC4 [R5]** — Given the unit tests and `Default`, when run and rendered, then the tests pass, and the horizontal
  chart shows ≤ 5 bars in non-increasing order.
- **AC5 [R6]** — Given the portfolio test and `Default`, when run and rendered, then the segments sum to the total,
  and the donut has no `<a>` inside its ring. The four inventory rows sit under it with 854's hrefs.
- **AC6 [R7, R8]** — Given `SortedByViews` and the unit tests:
  - the last views value on page 1 is ≥ the first on page 2;
  - the deletion `git grep` prints nothing;
  - the mobile card at 390 shows six labelled meta rows.
- **AC7 [R4, §2.1]** — Given the DOM order at 1440, when read, then the rows are §2.1's.
- **AC8 [R9]** — Given `check:story-coverage`, `check:stories` and the census, when run, then all exit 0, and every
  pre-existing export renders.
- **AC9 [R11]** — Given the new `cabinet.statistics` keys in `messages/en.json` (quote them), when read, then no
  "lead", "conversion" or "contact" appears, and `check:i18n` exits 0.
- **AC10 [R12]** — Given `Default` at 1440 in `en`, measured on AGT-10's `.mantine-ScrollArea-viewport`:
  - `scrollWidth <= clientWidth`;
  - every title link is at most two computed line-heights tall;
  - the same two readings at 768, 1024 and 1280 (`en`) and at 1440 (`uk`) are recorded for the owner, not as
    pass/fail;
  - `mantine-primitives-table--cards-below-md` at 800: the wrapped column computes `white-space: normal` and the
    others `nowrap`;
  - `AdminUsersTable.smoke.test.tsx` passes.
- **AC11 [R13]** — Given
  `git --no-optional-locks grep --untracked -n -E "className=|components/ui/|style=\{|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- "src/app/[locale]/cabinet/statistics/page.tsx" src/modules/cabinet/statistics/components/AgentStatisticsView.tsx src/modules/cabinet/statistics/tableParams.ts src/modules/cabinet/statistics/topListings.ts src/modules/cabinet/statistics/portfolio.ts`,
  when run, then it prints nothing.
- **AC12 [R14, R15]** — Given the live checks, when performed, then:
  - each agent sees only their own data (quote the values);
  - tampering has no effect;
  - `?status=sold` on an agent with no sold listings still shows 854's filtered-empty text;
  - the server log is clean.

`GR-4 AC AUDIT — 12 criteria; each states an observable property; absolutes: AC5's absent link in the ring, AC6's and AC11's empty greps on named files, AC10's scrollWidth ≤ clientWidth at one named width/locale/story.`

### Type-scale table (GR-3c)

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| Page title | page title | 20px | 24px | 24px | 24px | `MantineDashboardHeader` `fz={{ base: 'h5', sm: 'h4' }}` | unchanged, measured in 854 r1 |
| Card titles | section heading | 20px | 20px | 20px | 20px | `MantineDashboardCard` `size="h5"` | 843 |
| KPI values (hero + 3) | KPI value | 20px | 24px | 30px | 30px | `h5` / `h4` / `h3` / `h3` | 889 table |
| KPI labels / comparisons | label / meta | 14px / 12px | same | same | same | `sm` / `xs` | 843 |
| Table cells | body | 14px | 14px | 14px | 14px | `sm` | 854 |
| Chart text | axis / legend | library default | — | — | — | 845 / 889 | unchanged |

### Width contract (GR-3b)

The Story uses `layout: 'fullscreen'` with no decorators, as in 854. The view's own `MantineDashboardGrid` is the page
container.

## 13. QA profile and verification plan

**Q3**, plus 854's Q4 isolation (R15).

### 13.1 Re-entry

`from-scratch` for 891's changes; `remediation` for 854 (keep `evidence/task854/**` untouched). Evidence root
`docs/sessions/evidence/task891/`.

### 13.2 Final gate block

Tee each command to `evidence/task891/<name>.txt` with its exit code.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:i18n
npm.cmd run test -- src/modules/cabinet/statistics/__tests__
npm.cmd run test -- src/lib/__tests__/formatters.test.ts
npm.cmd run test -- src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx
npx.cmd vitest run src/modules/listings/lib/__tests__/visibility.test.ts
npm.cmd run check:listing-visibility
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:pattern-enrolment
npm.cmd run check:design-tokens:strict
npm.cmd run check:enrolled-tailwind
npm.cmd run check:rendered-scope
node.exe scripts\check-surface-census-changed.mjs --base HEAD
node.exe scripts\check-surface-census.mjs --surface src\modules\cabinet\statistics\components\AgentStatisticsView.tsx
node.exe scripts\check-surface-census.mjs --surface src\components\layout\UserMenu.tsx
node.exe scripts\check-surface-census.mjs --surface src\components\layout\MobileNavDrawer.tsx
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep --untracked -n -E "className=|components/ui/|style=\{|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- "src/app/[locale]/cabinet/statistics/page.tsx" src/modules/cabinet/statistics/components/AgentStatisticsView.tsx src/modules/cabinet/statistics/tableParams.ts src/modules/cabinet/statistics/topListings.ts src/modules/cabinet/statistics/portfolio.ts
git --no-optional-locks grep --untracked -n -E "countInquiries|inquiriesPerListing|readOwnInquiriesViaServiceRole" -- src
git --no-optional-locks diff --stat
git --no-optional-locks hash-object "src/app/[locale]/cabinet/statistics/page.tsx" src/modules/cabinet/statistics/components/AgentStatisticsView.tsx src/modules/cabinet/statistics/tableParams.ts src/modules/cabinet/statistics/topListings.ts src/modules/cabinet/statistics/portfolio.ts src/modules/cabinet/statistics/data.ts src/modules/cabinet/statistics/types.ts src/design-system/mantine/patterns/MantineDataTableToCards.tsx src/stories/patterns/mantine/AgentStatisticsView.stories.tsx src/stories/fixtures/agentStatistics.fixtures.ts src/stories/mantine/primitives/Table.stories.tsx src/components/layout/UserMenu.tsx src/components/layout/MobileNavDrawer.tsx src/lib/formatters.ts messages/en.json messages/sq.json messages/uk.json messages/it.json
```

Expected results:
- Every command exits 0, except:
  - `check:listing-visibility`, which exits 1 only on `contactEvents.ts:50` (Task 887) unless 887 has landed. Quote it,
    and confirm that no 891 file is named.
  - The two `git grep` commands, which print nothing.
- `check:locale-leak:mantine-only` is known red (Task 836). Quote zero findings for
  `patterns-mantine-agentstatisticsview`, `mantine-primitives-table`, `mantine-primitives-usermenu` and
  `mantine-primitives-mobilenavdrawer`.

### 13.3 GR-3b / GR-3c receipts

For every changed export at 320/390/768/1024/1440, measure over the whole document:
- component widths;
- every `.mantine-ScrollArea-viewport`'s `scrollWidth` against its `clientWidth`;
- computed font sizes.

Portal content counts.

### 13.4 Owner visual review — `OWNER VISUAL QA REQUIRED` (supersedes 854 §13.3)

| # | Story / route | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `/en/cabinet/statistics` (live, agent) | real data, 30d | 1440 | en | hero + 3 KPIs with mini-bars; area chart + AGT-01; top-5 bars + donut; full table with visible Edit; reads like the references |
| 2 | `/sq/cabinet/statistics` | real data | 1280 / 1024 | sq | same layout; numbers per locale |
| 3 | `/uk/cabinet/statistics` | real data | 768 | uk | 2-up KPIs; splits stacked |
| 4 | `/uk/cabinet/statistics` | real data | 390 / 320 | uk | one column; listing cards; no horizontal scroll |
| 5 | `/it/cabinet/statistics?period=7d` | 7 days | 1440 | it | rows 1–3 and the activity columns change |
| 6 | `Patterns/Mantine/AgentStatisticsView` | ActivityStale / ActivityError / NoActivity / SortedByViews / Agt10FilteredEmpty | 1440 / 390 | en | honest states |
| 7 | `Mantine/Primitives/UserMenu` / `…/MobileNavDrawer` | agent | 1440 / 390 | en / uk | Statistics right after Profile (854) |
| 8 | live, **user** account / guest | typed URL | 1440 / 390 | en / uk | redirected to the cabinet / login (854) |
| 9 | live, agent B | same URLs as agent A | 1440 | en | only B's data (854 R2) |

## 14. Completion report contract

Report:
- files with hashes;
- R1–R15 and AC1–AC12 with quotes;
- commands with exit codes;
- the live notes and server-log paths;
- the GR-0, GR-1, GR-3a, GR-3b and GR-3c receipts;
- the First Load JS before and after;
- deviations and limitations.

End with status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (854 + 891 jointly), `PARTIALLY IMPLEMENTED` or
`BLOCKED`. No self-approval and no mutating git. Update the 854 and 891 lines of `docs/backlog.md`.

## 15. Task quality gate

| Question | Answer |
|---|---|
| The owner's references honoured block by block? | §2.1 names the reference for every row. |
| Every owner chart choice present? | KPI mini-charts (row 1), area (row 2), top bars (row 3 main), donut (row 3 side). |
| D854-1 = A applied, and does the table still fit? | R12; and AGT-10 is now full width, so the measured 1296px table has room (AC10 measures it). |
| Honest numbers? | One event per series; no sums; zeros only after successful reads; aggregate single source (R7 deletes the second source). |
| 854 not lost? | R14/R15 and §13.4 rows 6–9 carry every 854 obligation; one joint review. |

`GR-0 CANONICAL REUSE PREFLIGHT — request: agent dashboard with area/horizontal-bar/donut/sparkline/accent + table wrap; semantic queries: MantineDashboard* patterns, "chart", "sparkline", MantineDataTableToCards TableColumn, AgentStatisticsView; inspected candidates: MantineDashboardLineChart, MantineDashboardBarChart, MantineDashboardDonut, MantineDashboardStatCard, MantineDashboardStatRows, MantineDashboardSparkline (889), MantineDataTableToCards (Mantine/Primitives/Table), Patterns/Mantine/AgentStatisticsView; decision: COMPOSE + EXTEND (TableColumn.wrap, per D854-1 = A); selected canonical owner: 843–846 + 889 patterns, MantineDataTableToCards; Mantine/TailAdmin token path: theme.other.chartSeries, brand tuple, dashboardChart roles; new hardcoded visual values: NONE; rationale: every contract exists or is created by 889; the one table extension is owner-decided (D854-1).`

`GR-3a STORY PREFLIGHT — AgentStatisticsView × 4 new states; canonical candidates: patterns-mantine-agentstatisticsview; direct-import evidence: src/stories/patterns/mantine/AgentStatisticsView.stories.tsx:2; toolbar coverage: locale=toolbar, viewport=toolbar; decision: EXTEND. — MantineDataTableToCards × wrap; candidate: mantine-primitives-table--cards-below-md; decision: EXTEND (existing export, no new one).`

`GR-1 CENSUS COMPLETE — AgentStatisticsView surface: 18 nodes today (reviewer run 2026-09-27), tier1 18 migrated+enrolled+story; after this task + MantineDashboardLineChart, MantineDashboardBarChart, MantineDashboardDonut (845, enrolled+storied) + MantineDashboardSparkline (889); tier2 0; tier3 0 listed and filed as none.`

`GR-3 STORY PROVEN — AgentStatisticsView ← src/stories/patterns/mantine/AgentStatisticsView.stories.tsx; MantineDataTableToCards ← src/stories/mantine/primitives/Table.stories.tsx; every composed chart ← its own Patterns/Mantine/Dashboard* story.`

## 16. Amendment — sign-out from `/cabinet/statistics` (added by Task 860 review 1, 2026-09-27)

**Why.** 854 added `src/app/[locale]/cabinet/statistics/page.tsx`, which sends guests to
`/${locale}/auth/login?next=…&session=lost` (`page.tsx:32`). It did not add the route to
`SESSION_REQUIRED_ROUTE_PATTERNS` (`src/lib/auth/postSignOut.ts:3-8`). `matchesPattern` compares whole segments, so
`'/cabinet'` does not cover `/cabinet/statistics`. Measured 2026-09-27 in Task 860's evidence
(`docs/sessions/evidence/task860/04-test-auth-before.txt` and `11-test-auth.txt`):

- `npm.cmd run test:auth` exits 1 on the tree that holds 854's work. The one failure is `postSignOut.test.ts` →
  "SESSION_REQUIRED_ROUTE_PATTERNS equals the set of guest-guarded [locale] pages", with
  `missing: [], extra: [/cabinet/statistics]`.
- In the product, signing out on `/{locale}/cabinet/statistics` returns `null` (stay), so the page's own guard then
  sends the user to the login page with `session=lost`. Signing out on `/{locale}/cabinet` goes home.

**R16 [P1].** `SESSION_REQUIRED_ROUTE_PATTERNS` gains `'/cabinet/statistics'` directly after `'/cabinet'`. No other
line of `postSignOut.ts` changes. The per-locale table in `postSignOut.test.ts` gains one case,
`${locale}: /cabinet/statistics -> /${locale}`.

**Scope addition to §7:** `src/lib/auth/postSignOut.ts` (R16 only) · `src/lib/auth/__tests__/postSignOut.test.ts`
(the one case).

**AC13 [R16].**
- Given `npm.cmd run test:auth` on the final tree, when run, then it exits 0, and the drift test and the four new
  `/cabinet/statistics` cases pass.
- Given a plant that removes `'/cabinet/statistics'` from the array, when the same command runs, then the drift test
  fails naming `extra: [/cabinet/statistics]` and the four new cases fail. After the restore, the file's
  `git hash-object` equals its pre-plant value.

**Gate addition to §13.2.** Insert this line before `npm.cmd run build`, teed to `evidence/task891/test-auth.txt`:

```powershell
npm.cmd run test:auth
```

Expected: exit 0. The plant transcript goes to `evidence/task891/plant-postsignout.txt` with both hashes. Report R16
and AC13 alongside R1–R15 and AC1–AC12 (§14).

## 17. Review 1 — NEEDS REVISION (Opus, 2026-09-28) · revision 1

Reviewed the joint 854 + 891 working tree against the session log
`docs/sessions/2026-09-28-task891-agent-dashboard-to-references.md` and `docs/sessions/evidence/task891/`. The census
was re-run by the reviewer (win32 v22.22.3): 24 nodes, all tier 1. Everything not named below is accepted and must
be preserved: R1's shared `activityByListing` promise (the executor's open question 1 — accepted), R5–R7's data and
pure modules, the R7 deletions, R11's keys, R13's grep, R15's live isolation and R16 with its plant. The executor's
open question 4 (AC6) is answered by F6 and question 2 by F1.

### 17.1 Re-entry

`remediation`. Keep every file in `evidence/task891/`. New artifacts go to `evidence/task891/rev1/`. Do not re-run
R15's live two-agent check unless `page.tsx`, `data.ts` or `access.ts` changes; F1–F6 do not require it.

### 17.2 Findings and required corrections

**F1 · P1 · R12 / AC10 — the `wrap` extension removes `nowrap` from every column of every table consumer.**
- Where: `MantineDataTableToCards.tsx:452` and `:467`, which pass `whiteSpace: col.wrap ? 'normal' : undefined`.
- Cause (FACT). Mantine 8.3.18 `get-style.mjs` builds each cell's style as `{ ...styles[td], ...options.style }`, so
  the cell's own `style` is spread last. An own key whose value is `undefined` therefore replaces the Table's
  `styles.td/th.whiteSpace: 'nowrap'` (`:442-443`), and React drops it. The reviewer reproduced the spread with
  `node.exe`: `{...{whiteSpace:'nowrap'},...{textAlign:'left',whiteSpace:undefined}}` → `{"textAlign":"left"}`.
- Evidence. The executor's own `gr3b-gr3c-out.json` → `tableWrapCheck` shows all four columns computing `normal`.
- The session log's notes 1–2 call this a pre-existing defect. That is a **CONTRADICTION**: before this diff the
  cell style was `{ textAlign }` with no `whiteSpace` key, so `nowrap` applied. This is also consistent with 854
  §17.2's 1296px measurement.
- Impact:
  - `AdminUsersTable` and every other consumer lose `nowrap`, which breaks R12's "every existing consumer keeps
    `nowrap`";
  - AC10's third bullet fails;
  - AC10's 1440 pass was measured on the regressed tree, so it is not evidence.
- **Correction:**
  - Add the key only when wrapping, on both `Table.Th` and `Table.Td`:
    `style={{ …, ...(col.wrap ? { whiteSpace: 'normal' } : {}) }}`.
  - Change nothing else in the pattern.
  - Rewrite session-log notes 1–2 to state the real cause.
  - Re-measure AC10 in full (1440 en pass/fail; 768, 1024, 1280 en and 1440 uk recorded).
  - If AC10's 1440/en `scrollWidth <= clientWidth` now fails, add `wrap: true` to AGT-10's `activity` column. It has
    the same date + "(relative)" shape as `expires`, so D854-1 = A covers it. Re-measure after that change. If it
    still fails, stop with `BLOCKED — AC10` and quote the per-column widths. Do not tune widths or add styles.

**F2 · P2 · R3, R9, §11 — the activity chart has no empty state.**
- Where: `AgentStatisticsView.tsx:499` hard-codes `state="ready"`.
- Evidence: `noactivity-en-1440.png` shows three flat zero lines on a 0–2 axis. R3 requires empty/error/loading.
  §11 and R9 require an "empty chart" for a period with no activity.
- **Correction:**
  - When the current series read succeeded and all three period sums are 0, pass `state="empty"` and
    `emptyDescription={t('activity_empty')}`.
  - Add the new key `cabinet.statistics.activity_empty` in all four locales. `en`: "No recorded activity in this
    period". No "lead", "conversion" or "contact".
  - Error and stale are unchanged (the card already carries them).

**F3 · P2 · R2 — a failed previous-period read is shown as "No base for comparison".**
- Where: `AgentStatisticsView.tsx:149-154`. A failed `activitySeriesPrevious` becomes `[]`, its sum reads 0, and
  `compareToPrevious` prints "no base". That asserts the previous period had nothing when it was never read.
- R2's text: "A failed series read puts those three cards into their error state (Retry), never 0". The previous
  period is one of the series reads R1 fetches.
- **Correction:**
  - Move the state decision into a new pure module `src/modules/cabinet/statistics/activityState.ts`, exporting
    `activityStates(freshness, current, previous)` → `{ kpiState: 'ready' | 'error', chartState: 'ready' | 'stale' | 'empty' | 'error' }`.
  - `kpiState` is `error` when freshness, current **or previous** fails.
  - `chartState` depends on freshness and current only: error on failure, else `empty` (F2), else `stale`, else
    `ready`.
  - The view consumes it. Unit tests in `__tests__/activityState.test.ts` cover each of the three failures, stale,
    all-zero and ready.
  - Add `activityState.ts` to the AC11 grep's file list.

**F4 · P2 · R9, §13.4 row 6 — the Story states are not honest, so the owner cannot judge them.**
- (a) **Past dates render as future.** Every "Last activity" cell reads "(in about 1–2 months)" for a date before
  the fixture's `now`. The same happens to "Expires" ("in 2 months" for `now` + 20 days).
  - Cause (FACT): `RelativeTime` calls `formatDistanceToNow`, which reads the frozen Storybook clock
    `2026-07-30T00:00:00Z` (`.storybook/preview-head.html:15`). The fixtures anchor to
    `DASHBOARD_PERIOD_NOW = 2026-09-18T08:00:00Z`.
  - In production the same call reads the server clock during SSR and the browser clock on the client. The view's
    own contract (`AgentStatisticsView.tsx:61-62`, "this view never reads the clock") is therefore false.
- (b) **The fixtures contradict each other.**
  - In `Default`, the top-listings bar for "Modern Apartment in Tirana Center" reads 42, but its AGT-10 row reads
    Views 0.
  - Rows with 0/0/0 carry a last-activity date, while rows with 21 views read "—".
  - In `NoActivity`, the KPIs are 0 and top-listings is empty, yet AGT-10 shows views 7–35 and last-activity dates.
- **Correction (a).** Apply GR-0 **EXTEND** to the canonical owner `src/components/shared/RelativeTime.tsx`:
  - add an optional `baseDate?: string` (ISO). When it is set, render `formatDistance(date, baseDate, { addSuffix: true, locale })`;
    otherwise keep today's `formatDistanceToNow` byte-for-byte, so the other consumers do not change;
  - `AgentStatisticsView` passes `baseDate={now}` to both of its `RelativeTime`s;
  - add one export to `src/stories/mantine/primitives/RelativeTime.stories.tsx` for the `baseDate` state (GR-3a
    EXTEND, with a receipt).
- **Correction (b).** Derive every AGT-10 row's `recordedViews`, `whatsappClicks`, `formInquiries` and
  `lastActivityDate` in `agentStatistics.fixtures.ts` from the same `byListing` fixture that feeds `rankTopListings`:
  - a row with no activity entry gets 0/0/0 and `null`;
  - `NoActivity` uses an empty `byListing`;
  - `SortedByViews` stays ordered by the derived views.
  - Use no wall-clock values.

**F5 · P2 · GR-3b, GR-3c, §13.3, AC2 — the required receipts and measurements are missing.**
- Receipts exist for `Default` only:
  - GR-3b at 320/390/1024/1440;
  - GR-3c at 320/390/768/1440.
- Missing:
  - `ActivityStale`, `ActivityError`, `NoActivity` and `SortedByViews`;
  - `mantine-primitives-table--cards-below-md`;
  - the new RelativeTime export;
  - §13.3's 768 width and portal content;
  - AC2's computed `background-color` and bar count, which were checked by eye only;
  - AC9's quoted keys.
- **Correction:**
  - Extend `gr3b-gr3c-measure.mjs` into `rev1/measure.mjs`, run against a fresh `build-storybook`. For every changed
    export at 320/390/768/1024/1440, record the root width against the viewport, every
    `.mantine-ScrollArea-viewport` `scrollWidth`/`clientWidth`, body overflow, and the computed `fontSize` of every
    heading, KPI value and table cell. Include open `MantineSelect` portal content.
  - In `Default` at 1440, record card 1's computed `background-color` and `background-image`, and the rect count in
    each of the three sparklines (expected 30).
  - Emit one GR-3b and one GR-3c receipt per export.
  - Quote every new `cabinet.statistics` key and its `en` value.

**F6 · P2 · R7, AC6 — the whole-set sort test cannot fail.**
- In `data.test.ts:411`, the three ranked ids (`l-02`, `l-05`, `l-09`) are all on page 1 in natural order, so a
  sort-the-page-then-slice bug passes it too. The reviewer read `readAgt10` and it does sort before slicing, but no
  test proves it.
- **Correction:**
  - Add a case with 12 listings where only `l-12` (page 2 in natural order) has the most views. Assert that page 1's
    first row is `l-12`.
  - Request `page: 2` and assert that its first `recordedViews` is ≤ page 1's last.
  - Plant proof: temporarily sort after slicing and show the new case fails. Record the file's hash (hash-object)
    before the plant and after the restore in `rev1/plant-sort.txt`.

### 17.3 Acceptance criteria added by revision 1

- **AC14 [F1]** — Given `mantine-primitives-table--cards-below-md` at 800 (`en`), when measured, then the `date`
  column's `th`/`td` compute `white-space: normal` and the other three compute `nowrap`. Given
  `AdminUsersTable.smoke.test.tsx`, when run, then it passes. AC10 is re-measured on the corrected tree.
- **AC15 [F2, F3]** — Given `activityState.test.ts`, when run, then every branch in F3 passes. Given `NoActivity`,
  when rendered, then the activity card shows the "No recorded activity in this period" empty state and no axis.
- **AC16 [F4]** — Given `Default` and `NoActivity` at 1440 (`en`), when read, then every "Last activity" relative
  label is in the past ("… ago") and every "Expires" label matches `now` + its fixture offset. The top-listings bar
  values equal the matching AGT-10 rows' views. In `NoActivity`, every AGT-10 activity cell is 0 or "—".
- **AC17 [F5]** — Given `rev1/measure.out.json`, when read, then it holds every export × width in F5, and the
  receipts quote it.
- **AC18 [F6]** — Given the new sort case, when run, then it passes on the final tree and fails under the plant.

### 17.4 Revision gate block

Tee every command to `evidence/task891/rev1/<name>.txt` with its exit code. Run the full §13.2 block plus the lines
below. Add `activityState.ts` to the AC11 grep and to the hash list. Add `src/components/shared/RelativeTime.tsx` and
`src/stories/mantine/primitives/RelativeTime.stories.tsx` to the hash list.

```powershell
npm.cmd run test -- src/modules/cabinet/statistics/__tests__/activityState.test.ts
npm.cmd run test -- src/modules/cabinet/statistics/__tests__/data.test.ts
npm.cmd run test:auth
npm.cmd run build-storybook
node.exe docs\sessions\evidence\task891\rev1\measure.mjs
npm.cmd run check:locale-leak:mantine-only
```

- Expected: exit 0 everywhere except the §13.2 exceptions.
- If `check:locale-leak:mantine-only` still cannot finish, record the start time, the elapsed time and the
  `Get-Process node` count, and hand it to the owner. Do not mark it passed.

### 17.5 Report

- Append a "Revision 1" section to the existing session log. Do not create a new log.
- Give F1–F6 and AC14–AC18 with quotes, the corrected Files Changed table with final hashes, and the new receipts.
- End with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (854 + 891 jointly). The owner matrix in §13.4 runs only after
  review 2 accepts revision 1.

## 18. Review 2 — NEEDS REVISION (Opus, 2026-09-28) · revision 2

Reviewed revision 1 against the working tree, the session log's "Revision 1" section and
`docs/sessions/evidence/task891/rev1/`. **Accepted, and preserved as they are:**
- F1: the conditional spread at `MantineDataTableToCards.tsx:452`/`:467`; AC14 (`ac14TableWrap`: `nowrap` ×3, `normal` on
  `date`); AC10 re-measured.
- F2, F3: `activityState.ts` and its 7 tests. §18 F9 changes only its stale branch.
- F4a: `RelativeTime` `baseDate`, the `WithBaseDate` export, and AGT-10 passing `baseDate={now}`.
- F6: the page-boundary case and its plant (both hashes `e43f72c3…`).
- `scripts/surface-census-baseline.json`: the gate-mandated removal of 7 stale `RelativeTime` rows (21 deletions, no
  other change).

Re-entry: `remediation`. Keep `evidence/task891/` and `rev1/` untouched. New artifacts go to
`evidence/task891/rev2/`. Do not re-run R15, because `page.tsx`, `data.ts` and `access.ts` do not change. Do not
re-run `check:locale-leak:mantine-only`, because revision 2 adds and changes no string.

### 18.1 Findings and required corrections

**F7 · P2 · R9, AC16, §17 F4(b) — the Story numbers still contradict each other.**
- **(a) Bar vs row, in `SortedByViews`.**
  - Its AGT-10 rows merge from `SORTED_BY_LISTING`: row `l0` reads 200 views.
  - Its `topListings` is `topListingsAllOk(locale)` (`AgentStatisticsView.stories.tsx:229`), which ranks
    `CANONICAL_BY_LISTING`: the bar for the same listing reads 42.
  - This is the exact F4(b) defect. It is a **CONTRADICTION** of the session log's claim that the bar and the row
    "can never disagree again".
- **(b) KPI totals vs per-listing totals, in every export fed by `activitySeriesCurrentAllOk()`.**
  - Those exports are `Default`, `Agt01AllZero`, `Agt10FilteredEmpty`, `ActivityStale` and `SortedByViews`.
  - The series sums to 410 recorded views, 103 WhatsApp clicks and 6 form inquiries. Each day is
    `8 + (i % 7) * 2`, `2 + (i % 4)` and `i % 5 === 0 ? 1 : 0`, over 30 days.
  - `CANONICAL_BY_LISTING` sums to 42+30+18+9+4 = 103 views, 9 WhatsApp clicks and 3 form inquiries.
  - In production both come from the one 849 aggregate, so the KPI for a period equals the sum over the owner's
    listings.
- **Correction:**
  - In `agentStatistics.fixtures.ts`, add `activitySeriesFrom(byListing, days = PERIOD_DAYS)`. It spreads each metric's
    by-listing total over the period's days deterministically, and the daily values of each metric sum **exactly** to
    that total. One valid spread is `floor(T*(i+1)/D) - floor(T*i/D)`. It reads no wall-clock value.
  - `activitySeriesCurrentAllOk()` returns `activitySeriesFrom(CANONICAL_BY_LISTING)`.
  - Add `activitySeriesSortedByViews()` = `activitySeriesFrom(SORTED_BY_LISTING)` and
    `topListingsSortedByViews(locale)` = `rankTopListings(SORTED_BY_LISTING, ownListingTitles(locale, 10))`.
    `SortedByViews` consumes both.
  - The previous period stays independent and lower than the current one, so the comparisons stay positive.
  - Every three-sparkline export still renders 30 bars (AC2).
  - Change no production file.

**F8 · P2 · §17 F5, AC17, GR-3b, GR-3c — the revision-1 measurement set is incomplete.**
- `rev1/measure.out.json` → `perStory` holds only the 8 `AgentStatisticsView` exports.
- Missing, although §17 F5 named each one:
  - `mantine-primitives-table--cards-below-md` at 320/390/768/1024/1440. Its receipt reads "unmeasured for width".
  - `mantine-primitives-relativetime--with-base-date` at those widths. It has no GR-3b or GR-3c receipt.
  - The computed `fontSize` of the KPI values. These are the only text on the page at 24px or more: 30px from `md`
    (§12 type-scale table).
  - Open `MantineSelect` portal content. The log says no select was opened.
- The AC16 measurement `topListingsBarCount: 95` counts elements. It never compares a bar value with an AGT-10 row.
- **Correction:**
  - Copy `rev1/measure.mjs` to `rev2/measure.mjs` and run it against a fresh `build-storybook`.
  - For all 8 `AgentStatisticsView` exports, `mantine-primitives-table--cards-below-md` and
    `mantine-primitives-relativetime--with-base-date`, at 320/390/768/1024/1440 in `en`, record:
    - the root width against the viewport;
    - every `.mantine-ScrollArea-viewport`'s `scrollWidth` against its `clientWidth`;
    - body overflow;
    - the computed `fontSize` of the page title, the card titles, **each of the four KPI values** (hero and three) and
      a table cell (the `<time>` text for `RelativeTime`).
  - In `Default` at 320 and at 1440, open the AGT-10 status filter's `MantineSelect`. Record the dropdown's
    `getBoundingClientRect()` against the viewport and body overflow, then close it.
  - For `Default`, `ActivityStale` and `SortedByViews` at 1440 `en`, record:
    - every top-listings bar's label and value next to that listing's AGT-10 Views cell;
    - each of the three KPI values next to the fixture's by-listing total.
  - Emit one GR-3b and one GR-3c receipt per export, quoting `rev2/measure.out.json`.

**F9 · P3 · R10, §11 "Aggregate stale" — a stale all-zero period loses the card's stale caption.**
- Where: `activityState.ts` returns `chartState: 'empty'` before it checks `stale`. The view maps that to card state
  `ready` (`AgentStatisticsView.tsx:154`).
- The header badge still shows. The card itself, however, presents "No recorded activity in this period" as current,
  although the aggregate is stale. That is the case R10 forbids.
- **Correction:**
  - `ActivityStates` becomes
    `{ kpiState: 'ready' | 'error'; cardState: 'ready' | 'stale' | 'error'; chartState: 'ready' | 'empty' | 'error' }`.
  - `cardState` is `error` when freshness or current fails, else `stale` when `freshness.data.stale`, else `ready`.
  - `chartState` is `error` on the same failures, else `empty` when all-zero, else `ready`.
  - `kpiState` is unchanged.
  - The view passes `cardState` to the activity `MantineDashboardCard` and `chartState` to
    `MantineDashboardLineChart`. Delete the two mapping expressions at `:154` and `:498`.
  - `activityState.test.ts`: the all-zero-and-stale case expects `cardState 'stale'` and `chartState 'empty'`. Every
    other case asserts both fields.

**F10 · P3 · clause 10, §17.5 — the session log's revision-1 record is wrong.**
- (a) Nine hash cells in "Corrected Files Changed" belong to a different row. Measured with `git hash-object`:
  - `RelativeTime.tsx` = `334232eb…` (logged `c4f4760d…`);
  - `RelativeTime.stories.tsx` = `82352c49…` (logged `1cd71eff…`);
  - `agentStatistics.fixtures.ts` = `1cd71eff…` (logged `334232eb…`);
  - `AgentStatisticsView.stories.tsx` = `c4f4760d…` (logged `82352c49…`);
  - `data.test.ts` = `237b81df…` (logged `947f53cb…`);
  - `en` = `947f53cb…`, `sq` = `c25072af…`, `uk` = `634a7849…`, `it` = `b460a183…` (each logged one locale off).
  - `rev1/hash-list.txt` carries no paths, so it cannot settle the attribution.
- (b) The census note says extending `RelativeTime.stories.tsx` "paid off" the 7 rows. In fact `RelativeTime` has been
  enrolled (`scripts/mantine-migration-scope.json:81`) and storied since Task 853 (`7aaad37cb`). The rows were already
  stale; the gate re-censused their parents only because `RelativeTime.tsx` changed.
- **Correction:**
  - Write `rev2/hash-list.txt` as `<hash> <path>` lines, from a `for` loop over the §17.4 hash list plus
    `activityState.test.ts` and `data.test.ts`.
  - Put the revision-2 Files Changed table in the new section, built from that file.
  - Correct sentence (b) in the Revision 1 section with a one-line `Corrected by review 2:` note. Leave the rest of that
    section unchanged.

### 18.2 Acceptance criteria added by revision 2

- **AC19 [F7]** — Given `rev2/measure.out.json`, for `Default`, `ActivityStale` and `SortedByViews` at 1440 `en`, when
  read, then:
  - every top-listings bar value equals that listing's AGT-10 Views cell;
  - each KPI value equals the sum of that export's by-listing metric. For `Default` that is 103 / 9 / 3.
  - A fixture unit test asserts both equalities for `activitySeriesFrom` over `CANONICAL_BY_LISTING` and
    `SORTED_BY_LISTING`: each metric's daily sum equals its by-listing total, and there are 30 points.
- **AC20 [F8]** — Given `rev2/measure.out.json`, when read, then it holds every export × width in F8. At each width
  it holds:
  - the KPI value font sizes match §12's type-scale row (20 / 24 / 30 / 30);
  - no `.mantine-ScrollArea-viewport` overflows at 320 or 390;
  - body overflow is `false`;
  - the open select dropdown lies inside the viewport.
  One GR-3b and one GR-3c receipt per export quote it. The 768/1024 AGT-10 table overflow stays recorded-only (AC10).
- **AC21 [F9]** — Given `activityState.test.ts`, when run, then the all-zero-and-stale case yields `cardState 'stale'`
  and `chartState 'empty'`, and every case asserts both fields. `AgentStatisticsView.tsx` has no
  `chartState === 'stale'` expression.
- **AC22 [F10]** — Given `rev2/hash-list.txt`, when compared with a fresh `git hash-object` of each listed path, then
  every line matches. The revision-2 Files Changed table repeats those pairs.

`GR-4 AC AUDIT — 4 criteria added (AC19–AC22); each states an observable property; absolutes: AC20's no-overflow at 320/390 and dropdown-in-viewport at named widths, AC21's absent expression in one named file.`

### 18.3 Revision gate block

Tee every command to `evidence/task891/rev2/<name>.txt` with its exit code.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:i18n
npm.cmd run test -- src/modules/cabinet/statistics/__tests__
npm.cmd run test -- src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens:strict
npm.cmd run check:rendered-scope
node.exe scripts\check-surface-census-changed.mjs --base HEAD
node.exe scripts\check-surface-census.mjs --surface src\modules\cabinet\statistics\components\AgentStatisticsView.tsx
npm.cmd run build-storybook
node.exe docs\sessions\evidence\task891\rev2\measure.mjs
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep --untracked -n -E "className=|components/ui/|style=\{|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- "src/app/[locale]/cabinet/statistics/page.tsx" src/modules/cabinet/statistics/components/AgentStatisticsView.tsx src/modules/cabinet/statistics/tableParams.ts src/modules/cabinet/statistics/topListings.ts src/modules/cabinet/statistics/portfolio.ts src/modules/cabinet/statistics/activityState.ts
git --no-optional-locks grep --untracked -n "chartState === 'stale'" -- src/modules/cabinet/statistics/components/AgentStatisticsView.tsx
```

- Expected: exit 0 for every command except the two `git grep` commands, which print nothing and exit 1.
- Put the fixture unit test for AC19 under `src/modules/cabinet/statistics/__tests__/`, so the fourth line runs it.

### 18.4 Report

- Append a "Revision 2" section to the existing session log. Give F7–F10 and AC19–AC22 with quotes, the receipts and
  the labelled Files Changed table.
- End with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (854 + 891 jointly).
- The owner matrix in §13.4 runs only after review 3 accepts revision 2. This supersedes §17.5's last sentence.

## 19. Review 3 — PARTIALLY VERIFIED (Opus, 2026-09-28)

Revision 2 is accepted in full; no executor action is open.

- **F7 / AC19.** `rev2/measure.out.json` compares every value directly:
  - top-listings bars equal the AGT-10 rows, 5/5 in `Default`, `ActivityStale` and `SortedByViews`;
  - the KPIs are 103/9/3 in `Default` and `ActivityStale`, and 1,550/55/9 in `SortedByViews`, which equal the
    by-listing totals;
  - `activitySeriesFrom.test.ts` passes 2/2.
- **F8 / AC20.** All 10 stories are measured at the 5 widths:
  - KPI values are 20/20/30/30/30;
  - no ScrollArea overflows at 320 or 390, and body overflow is false everywhere;
  - the select dropdown lies inside the viewport at both 320 (bottom sheet) and 1440.
- **F9 / AC21.** `activityState.ts` returns `cardState` and `chartState` separately; the all-zero-and-stale case gives
  `stale` + `empty`, and the grep prints nothing.
- **F10 / AC22.** The reviewer recomputed `rev2/hash-list.txt`: 24/24 lines match.
- Every changed source predates the gate run (last edit 20:37; `build-storybook` 20:52, `build` 20:55). Both exit 0.

**Lowest-evidence row: the visual criterion, `NOT VERIFIABLE` until the owner runs §13.4 (rows 1–9).** It is owner
action **O891-1**. For rows 2–3 the owner decides one recorded-only reading (AC10): from 768 to 1279, AGT-10 scrolls
horizontally inside its own card. At 768 the table is 1087 wide in a 676 viewport; at 1024 it is 1087 in 932. The body
does not overflow. Accepting all rows → review 4 approves 854 + 891 jointly and archives both. A returned row → a
numbered revision in §20.

## 20. Review 4 — NEEDS REVISION: the owner returned §13.4 rows 1–5 (2026-09-28) · revision 3

### 20.1 The owner's return and decisions

**Owner, O891-1, rows 1–5, verbatim:** *"UI взагалі не схожий на той, який я показав у референсах! … все криве,
величезне, не збалансоване. Поглянь на референс і на його офігезний UI https://techzaa.in/lahomes/admin/index.html#!"*

**D891-1 (owner, 2026-09-28, AskUserQuestion), verbatim answers:**
- Sizes: *"Лишити TailAdmin"*.
  - Fonts, paddings and gaps are unchanged, so D78-5 stands and the §12 type-scale table is unchanged.
  - The fix is composition only.
- Card chrome: *"Як на сайті (Рекомендовано)"*. The radius stays 16px and the 1px border stays. There is no shadow
  restyle.

**Reviewer measurement, 1440, `en`.** Evidence is in `evidence/task891/review4/`:
- `ref-lahomes-index-1440.png` is the reference;
- `ours-default-1440.png` is the Story (rows 1–5 used the same composition).

| Block | Lahomes | Ours | Defect |
|---|---|---|---|
| KPI row | 4 cards, 173px tall. Label and value sit left, a 96×95 sparkline sits **beside** them. | 4 cards, **335px** tall. The sparkline is 279×95 and sits **under** the value. The AGT-05 card also prints its tooltip text inline (`AgentStatisticsView.tsx:444-450`) next to its info icon, so its sparkline starts 44px lower than the others. | "huge", "crooked" |
| Hero | "My Balance" is **in the side column of row 2**. It holds its value plus two sub-stats. | A 335px coral tile in row 1 that holds only "12". | "unbalanced" |
| Row 2 | The chart card (544) and the side stack (227 + 20 + 291 = 538) end together. | The activity card is 600 (the chart plus three description lines) and AGT-01 is 254: **a 346px hole**. | "unbalanced" |
| Row 3 | Cards stretch to the row height. The donut is centred. | Top listings is 470 and portfolio is 698: **a 228px hole**. The donut is left-aligned. The legend is vertical, with 38px rows and no counts. | "unbalanced" |
| Fixture series | — | `activitySeriesFrom`'s even `floor` spread draws a periodic saw-tooth (only 3/4 and 0/1). | reads as broken |

### 20.2 Required composition (replaces §2.1 rows 1–3; row 4, AGT-10, is unchanged)

| Row | Grid | Content |
|---|---|---|
| 1 | `MantineDashboardGridTopRow` with **3** cards | AGT-03 views, WhatsApp and AGT-05 forms, unchanged except for R17. The pattern's `lg` 3-column track gives each card room for the chart **beside** the text (889's `wrap` layout). |
| 2 | `MantineDashboardGridSplit` 8 + 4 | **main:** the activity card (R19). **side:** a `Stack`. First the **AGT-02 hero** (`variant="accent"`, "Visible now" 12) carrying the four inventory numbers as sub-stats (R18). Below it **AGT-01**, which fills the rest of the column (R20). |
| 3 | `MantineDashboardGridSplit` 8 + 4 | **main:** top listings. **side:** "My portfolio", which holds only the donut and a legend with each segment's count. Both cards fill the row height (R20). |

### 20.3 Requirements

- **R17 [P0] — AGT-05 without the duplicate.**
  - Remove the inline `t('agt05_tooltip')` text from the AGT-05 card's `secondaryLine`.
  - Keep the info `ActionIcon` + `MantineTooltip` with the same key and `aria-label`.
  - No other card change.
- **R18 [P0] — the hero carries the inventory. GR-0 EXTEND of `MantineDashboardStatCard`.**
  - Add an optional `substats?: { key: string; label: string; value: ReactNode; href?: string }[]`, rendered only for
    `variant="accent"` as a 2-column `SimpleGrid` under the value.
  - Each sub-stat: label `xs`, value `sm` `fw={600}`, both white. With an `href`, the whole sub-stat is a Next link
    whose text is the label and value.
  - With no `substats`, the output is byte-identical, so 853 and 889 consumers do not change.
  - Add one export to `Patterns/Mantine/DashboardStatCard`: `AccentWithSubstats` (GR-3a EXTEND).
  - AGT-02 passes `agt02Rows`'s four entries (pending, inactive, sold "marked by me", rented "marked by me") with
    854's hrefs. The `MantineDashboardStatRows` under the donut is **removed**.
  - Clause 3 is kept: each of the four hrefs stays reachable, now from the hero.
- **R19 [P0] — a compact activity card.**
  - The three series descriptions leave the card body.
  - They move into one info `ActionIcon` + `MantineTooltip` in the card's `headerAction`. The tooltip holds the
    three existing keys `activity_desc_views`, `activity_desc_whatsapp` and `activity_desc_form`, one per line, and
    the `aria-label` reuses `agt05_tooltip_aria`.
  - The chart height, the legend and the stale, empty and error states are unchanged.
  - R3's descriptions stay on the page, reachable by hover and focus. This amends R3's placement only.
- **R20 [P0] — equal row heights. GR-0 EXTEND of `MantineDashboardCard`.**
  - Add an optional `fill?: boolean`. With `true`, the root `Card` gets `h="100%"` and the body grows (`flex={1}`),
    so the card fills its grid column. The default is off, so the output is byte-identical for 853.
  - Add one export to `Patterns/Mantine/DashboardCard`: `Fill`, two cards of different content height in a
    2-column `SimpleGrid` (GR-3a EXTEND).
  - In the view:
    - the row-2 side `Stack` gets `h="100%"`, and AGT-01 sets `fill`;
    - the row-2 activity card sets `fill`;
    - both row-3 cards set `fill`.
  - Where a `MantineDashboardStatCard` (the hero) sits in that `Stack`, it keeps its content height.
- **R21 [P1] — the donut is centred, and its legend carries counts.**
  - The portfolio card centres `MantineDashboardDonut` horizontally with a Mantine `Center` or
    `Group justify="center"`.
  - Each legend entry reads `<label> · <count>`, from the same `portfolio` segments that feed the donut.
  - If the donut pattern cannot render counts, EXTEND it with `showCounts?: boolean` (default off) plus one Story
    export. Record the choice in the GR-0 receipt.
- **R22 [P1] — the fixture series looks like traffic, not a saw-tooth.**
  - `activitySeriesFrom` spreads each total with a fixed 7-day weight profile `[3, 4, 5, 4, 6, 8, 7]`, starting
    from the first date's weekday offset `i % 7`, using largest-remainder rounding.
  - The daily sums stay **exactly** equal to the totals: AC19 and `activitySeriesFrom.test.ts` stay green.
  - Add one test that asserts the 30 view values are not all within 1 of each other.
  - **The hero and the donut disagree today.**
    - `agentStatisticsAllOk` sets `agt02.visible: 12` with `statusCounts.active: 12` and `agt01.hidden: 2`.
    - `portfolioSegments` therefore draws visible = **10** while the hero reads 12.
    - Set `statusCounts.active: 14`. The hero then stays 12 and the donut reads 12 / 4 / 6, total 22.
    - Add a fixture test for every exported `agentStatistics*` data fixture: `agt02.visible` equals
      `portfolioSegments(...).visible`.
- **Unchanged:** R1, R5–R16, the data, `page.tsx`, AGT-10, the §12 type scale (D891-1) and the card chrome (D891-1).

### 20.4 Acceptance criteria added by revision 3

Measure with `rev3/measure.mjs`, extended from `rev2/measure.mjs`, on a fresh `build-storybook`, `Default`, `en`.
Record every reading.

- **AC23 [R17, row 1]** — At 1440 and 1024:
  - row 1 holds 3 StatCards;
  - in each card, the sparkline's `top` is above the value element's `bottom` (it sits beside the value, not under
    it);
  - the three sparklines' `top` values are equal within 1px;
  - the AGT-05 card body contains no visible `agt05_tooltip` text while its tooltip is closed.
  - Record each card's height.
- **AC24 [R18]** — At 1440:
  - the hero is the first child of the row-2 side column and shows 4 sub-stat links;
  - their `href`s equal 854's four inventory hrefs;
  - the portfolio card contains no `MantineDashboardStatRows`.
  - `AccentWithSubstats` renders at 320 and 1440 with no overflow.
- **AC25 [R19, R20]** — At 1440 and 1024:
  - the activity card and AGT-01 end at the same `bottom` within 1px;
  - so do the two row-3 cards.
  - The activity card body holds no description paragraph, and the header info tooltip, once opened, shows all three
    `activity_desc_*` strings.
  - Below `lg`, every card stacks in one column with body overflow `false`.
- **AC26 [R21]** — At 1440, the donut's left and right gaps inside the portfolio card's content box differ by at most
  2px, and each of the 3 legend entries shows its count (12 / 4 / 6 in `Default`, after R22's fixture fix). The
  hero reads the same visible count as the donut.
- **AC27 [R22]** — `activitySeriesFrom.test.ts` passes, including the new spread assertion, and AC19 is re-measured
  unchanged (bars = rows; KPIs 103 / 9 / 3 and 1,550 / 55 / 9).
- **AC28 [853 unaffected]** — `Patterns/Mantine/AdminDashboardView` `Default` at 1440, measured before and after the
  two pattern extensions, gives identical heights for every card. `DashboardStatCard` and `DashboardCard`'s
  pre-existing exports render unchanged.
- **AC29 [GR-3b/3c]** — One GR-3b receipt and one GR-3c receipt per changed export:
  - all 8 `AgentStatisticsView` exports, `AccentWithSubstats` and `Fill`;
  - widths 320/390/768/1024/1440.
  - The GR-3c values equal §12 (D891-1).

`GR-4 AC AUDIT — 7 criteria added (AC23–AC29); each states an observable property; absolutes: AC23's 3 cards and 1px top alignment, AC25's 1px bottom alignment, AC26's 2px centring and AC28's identical heights, each at named widths on named stories.`

`GR-0 CANONICAL REUSE PREFLIGHT — request: balanced agent-dashboard composition (hero with sub-stats, equal-height cards, centred donut with counts); semantic queries: MantineDashboardStatCard accent/caption/secondaryLine/chart, MantineDashboardCard props, MantineDashboardGrid TopRow/Split, MantineDashboardDonut legend, MantineDashboardStatRows; inspected candidates: MantineDashboardStatCard.tsx (no sub-stat slot), MantineDashboardCard.tsx (no height/fill prop — Card at :83), MantineDashboardGrid.tsx (TopRow cols lg=min(count,4); Split 8+4), MantineDashboardDonut, Patterns/Mantine/DashboardStatCard, …/DashboardCard; decision: EXTEND (StatCard.substats, DashboardCard.fill, Donut.showCounts only if absent) + COMPOSE; selected canonical owner: those three patterns; Mantine/TailAdmin token path: existing theme spacing/fontSizes/headings (D78-5, D891-1), accent gradient (889); new hardcoded visual values: NONE; rationale: every gap is a missing slot on an existing canonical pattern, not a new component.`

### 20.5 Re-entry, gate block, report

- Re-entry: `remediation`. New artifacts go to `evidence/task891/rev3/`. R15 is not re-run (`page.tsx` and `data.ts`
  do not change).
- Gate: run §18.3's block with `rev3/` in every path, plus these lines. Expected exit codes are the same as §18.3's.

  ```powershell
  npm.cmd run check:pattern-enrolment
  npm.cmd run test -- src/components/admin/__tests__
  npm.cmd run check:locale-leak:mantine-only
  ```
- Scope added to §7:
  - `MantineDashboardStatCard.tsx`, `MantineDashboardCard.tsx` and, only if needed, `MantineDashboardDonut.tsx`;
  - their Stories;
  - no `messages/*` change (every string already exists).
- Report: append a "Revision 3" section to the session log, with AC23–AC29 quoted from `rev3/measure.out.json`,
  every receipt and a labelled hash list. End with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (854 + 891 jointly).
- After review 5 accepts revision 3, the owner re-runs §13.4 in full as **O891-1**. Row 3 now reads "3 KPI cards,
  2 + 1 below `lg`; splits stacked".
  **Superseded by §21.5:** the owner matrix follows review 6.

## 21. Review 5 — NEEDS REVISION (Opus, 2026-09-28) · revision 4

### 21.1 Accepted from revision 3

No action is owed on these:
- R18–R22 with AC24, AC25, AC26, AC27 and AC28, as measured in `rev3/measure.out.json`.
- GR-1: the reviewer re-ran the census on `AgentStatisticsView.tsx` and got 24 nodes, all tier 1, manifest yes, story
  yes.
- `check:locale-leak:mantine-only`. `rev3/check-locale-leak.txt` **did finish** (`EXIT_CODE=1`, last write 23:41).
  - It is known red (Task 836).
  - It has zero lines for `AgentStatisticsView`, `DashboardStatCard`, `DashboardCard`, `DashboardDonut`, `Table`,
    `RelativeTime`, `UserMenu` and `MobileNavDrawer`.
  - The session log's "did not finish" record is stale. Correct it (§21.4); do not re-run the gate.

### 21.2 Orchestrator defect — AC23's 1024 "beside" clause cannot be met, and is superseded

Review 4 wrote AC23 without checking whether it was feasible. At 1024 (`lg`), row 1 has 3 columns. Each card's content
box is narrower than the sum of three parts:
- the label's max-content width (the `en` label "Recorded views · last 30 days");
- the `md` gap;
- the 154px sparkline floor. Task 889 set this floor (`MantineDashboardStatCard.tsx:241-254`, owner-accepted at
  O889-1).

D891-1 keeps every size, so the chart wraps under the text. `rev3/row1-1024-wrap.png` shows it.

**AC23 as amended:**
- At 1024, the chart-under-text layout is **recorded, not required**. Record each card's height.
- Every other AC23 clause still binds at **both** 1440 and 1024.
- AC30 below adds value alignment.

The owner judges the 1024 row in O891-1.

### 21.3 Findings and required corrections

**F11 · P2 · R17, AC23 — row 1 is still crooked. The AGT-05 value sits higher than its siblings.**
- Evidence, from `rev3/measure.out.json` → `ac23`:
  - at 1440, `valueBottom` is 288 / 288 / **259**;
  - at 1024, `sparklineTop` is 275 / 275 / **305**, which fails AC23's own 1px clause;
  - `rev3/row1-1440-ok.png` shows "3" raised above "103" and "9", with the info icon on its own line underneath.
- Cause:
  - R17 kept the icon in `secondaryLine`, which `MantineDashboardStatCard.tsx:205` renders as an extra line under the
    value inside the text stack;
  - from `xs2` up, the chart row aligns `flex-end` (`:239`);
  - so the taller stack lifts the value and label.
- Correction, in `AgentStatisticsView.tsx` only, with no pattern change:
  - remove `secondaryLine` from the AGT-05 card;
  - pass the unchanged `MantineTooltip` + `ActionIcon` (same `agt05_tooltip` label, same `agt05_tooltip_aria`) through
    the card's `comparison` slot, which is its top-right corner;
  - compose it as `<Group gap="xs" wrap="nowrap">{comparisonNode(formsSum, formsPrevSum)}{infoIcon}</Group>` when
    `kpiState === 'ready'`, and pass the icon alone otherwise;
  - leave the other two cards untouched.

**F12 · P2 · GR-3b, AC29 — two new Story exports fix a width, and one has no receipt.**
- `DashboardCard.stories.tsx` `Fill` (`:84-116`) renders `<SimpleGrid cols={2} p="md">`. That is two columns at every
  width, so at 320 each card is about 136px.
  - The production parent is `MantineDashboardGridSplit`: `span={{ base: 12, lg: 8 }}` + `{{ base: 12, lg: 4 }}`
    (`MantineDashboardGrid.tsx:80-81`).
  - Review 4's R20 prescribed "a 2-column `SimpleGrid`". That was an orchestrator defect, and this finding corrects it.
  - **Correction:** render the two cards as
    `<MantineDashboardGrid><MantineDashboardGridSplit main={…} side={…} /></MantineDashboardGrid>`. Both are the real
    production parents, so remove the `SimpleGrid`. Give the longer card to `main`, the shorter to `side`, and keep
    `fill` on both.
- `DashboardDonut.stories.tsx` `WithCounts` (`:165`) wraps the card in `Box p="md" maw={theme.other.boxSize.content}`.
  That is a max-width container in a new export, which GR-3b forbids.
  - **Correction:** `Box p="md"` with no `maw`.
  - The pre-existing sibling exports are not changed by this task and stay as they are.
- `WithCounts` has no GR-3b or GR-3c receipt, because AC29's list left it out. That omission was the orchestrator's.
- AC29's receipts give `rootWidth === viewportWidth`. That value cannot see a fixed inner grid.
  - **Correction:** every GR-3b receipt gives `<component w>/<parent w>` per width, as `docs/golden-rules.md` GR-3b
    specifies. The component is the card; the parent is its grid column or the fluid container.

**F14 · P1 · R18, R20, clause 3 — the hero is clipped. Three of its four sub-stat links are cut off.**
- Reviewer's probe: live Storybook `patterns-mantine-agentstatisticsview--default`, `en`, 1440, with the Custom segment
  selected. Screenshot: `evidence/task891/review5/custom-closed-1440.png`.
  - The hero `Card` is 186px tall, `scrollHeight` is 254 and `overflow: hidden`. The sub-stat links end at 598 and
    644, while the card ends at 576.
  - Only the first row's labels ("Pending", "Inactive") show, cut through. "Sold …" and "Rented …" are invisible.
- AC24 counted the `<a>` elements in the DOM, which cannot see clipping.
- Cause:
  - the side `Stack` (`AgentStatisticsView.tsx:516`) is `h="100%"`;
  - AGT-01's `fill` gives its `Card` `h="100%"` of that same `Stack`;
  - both children keep the default `flex-shrink: 1`, so the hero shrinks below its content.
- **Correction, in `AgentStatisticsView.tsx` only:**
  - wrap AGT-01 in a `Box flex={1}` and keep its `fill`, so AGT-01 fills the Box and not the Stack;
  - the hero is rendered unwrapped and keeps its content height.
  - Do not change `MantineDashboardCard` or `MantineDashboardStatCard`.

**F13 · P1 · owner-reported, GR-0, clause 7 — the "Custom" date picker is hand-rolled and hardcoded.**
- **Owner, 2026-09-28, verbatim:** *"я вже бачу, що на сторінці статистики у агента combobox з датами захардкоджений,
  бо він виглядає криво."*
- **D891-2 (owner, 2026-09-28, AskUserQuestion), verbatim option chosen:** *"Fold into 891 revision 4"*.
  - The `RangeDatePicker` rebuild is part of this revision, not a separate task.
  - Because `RangeDatePicker` feeds the registered critical flow **"Listings date-range filter"**
    (`docs/critical-flow-registry.md`), **this part of revision 4 is Q4**.
- Reviewer's probe: same Story, 1440, `en`. Screenshots: `review5/custom-closed-1440.png` and
  `review5/custom-open-1440.png`.
  1. **The trigger text sits low.** The "Select dates" text centre is 115.5; the trigger centre and the calendar icon
     centre are both 110. The trigger is `TextInput` rendered as `component: 'button'` (Task 861). Its computed
     `padding: 10px 16px 10px 34px` plus `line-height: 34px` push the text box 5.5px down.
  2. **Raw values everywhere.** `RangeDatePicker.tsx` carries:
     - `style={{…}}` objects at `:253`, `:257-262`, `:275-300`, `:330`, `:334-340`, `:348`, `:416`, `:498`, `:636`,
       `:666`, `:670`, `:697-700`, `:850` and `:865`;
     - `DAY_CELL_PX = 39`, `marginBottom: 8`, `height: 24`, `paddingTop: 12`, `'45dvh'`, `'90vw'` and `'9999px'`
       radii;
     - `fz="var(--mantine-font-size-xs)"`, `mih="2.75rem"` and `mb={8}`;
     - `triggerWidth={150|100}` and `dropdownMinWidth={190|140}`;
     - the placeholder's inline `color`.

     None of these reaches the theme.
  3. **The header does not line up with the grids.** The left arrow, the month/year selectors, the right-month
     label and the right arrow sit in one `justify="space-between"` row (`:448-509`). So:
     - the selectors are not centred over the left grid;
     - "August 2026" is not centred over the right grid.
  4. **The panel opens on the wrong months.** With no value, the anchor is `new Date()` (`:737`), not `maxDate`. The
     dashboard's period ends yesterday, yet the pair shown is July/August, and the right-hand month can be entirely
     disabled.
  5. **The summary field opens with a focus border.** On open, focus lands in the read-only summary `TextInput`
     (`:419-425`), which draws the brand focus border. It reads as an error.
  6. **The wrong label.** The clear link reads "Clear filters" (`common.clear_filters`) on a dashboard that has no
     filters.
  7. **An English accessible name in every locale (clause 7).** The day cell `aria-label` is
     `format(day, 'd MMMM yyyy')` (`:270`), which is English in `sq`, `uk` and `it`.
  8. **The Story fixes a width (GR-3b).** `RangeDatePicker.stories.tsx:64` and `:153` wrap the picker in
     `<div style={{ maxWidth: 480 }}>`.

- **Correction (R24), in `RangeDatePicker.tsx`, its Story and the canonical chrome files only.** Keep Task 561's
  owner-locked behaviour:
  - D1: Apply/Confirm is enabled once `from` is staged, and a single day commits `{from, to: from}`;
  - D2: the mobile fixed header;
  - D3: title → weekday row → grid;
  - D4: the fixed mobile Confirm bar;
  - day-tap only stages, and `onChange` fires only on Apply/Confirm.

  Keep every size (D891-1).

  1. **Tokens, no literals.**
     - Remove every `style` object and raw value listed in item 2.
     - Use Mantine style props and existing tokens where they fit: `theme.radius.pill` (`theme.ts:625`),
       `theme.other.boxSize.touchTarget` (`:674`), `fz="xs"` and theme spacing.
     - For a value with no token, add one named role group, `theme.other.rangeDatePicker`: `dayCell` (39),
       `weekdayRowHeight` (24), `monthTriggerWidth` (150), `yearTriggerWidth` (100), `monthDropdownMinWidth` (190),
       `yearDropdownMinWidth` (140) and `mobileListHeight` (45dvh). Give each a provenance comment citing today's
       literal and its source (Task 561 §6t; Task 774).
     - Move the day cell's state colours (boundary, in-range band, today, out-of-month, disabled, hover) into
       `range-date-picker-chrome.css`, keyed on `data-*` attributes and consuming only `var(--mantine-*)` values.
     - Remove the unused `className` prop. No consumer passes it (reviewer grep).
  2. **Trigger centring.** Fix it at the canonical input chrome. `input-chrome.css` is keyed on
     `.mantine-TextInput-input`, so a rule for the button-rendered trigger goes there, consuming theme values only.
     The trigger stays a semantic `<button type="button">` (Task 861).
  3. **Header alignment (desktop).**
     - Lay the header out as two columns, each exactly as wide as its month grid (`7 × dayCell`), with the grids'
       `xl` gap between them.
     - The left column centres the month/year selectors, with the prev arrow at its outer edge.
     - The right column centres the right-month label, with the next arrow at its outer edge.
  4. **Opening anchor.**
     - With no `value.from` and a `maxDate`, the **right-hand** month of the desktop pair is `maxDate`'s month, and
       the mobile list opens scrolled to `maxDate`'s month.
     - With a `value.from`, the behaviour is unchanged.
     - With neither, the behaviour is unchanged (today).
  5. **Initial focus.** Opening the panel does not focus the read-only summary field. Mark the month selector trigger
     as the popover's initial focus target, using Mantine's native `data-autofocus`, and never an effect.
  6. **Label.** The clear link uses the existing `common.aria_clear` ("Clear"). Add no new string.
  7. **Localized accessible name.** Each day's `aria-label` is built from the same `common.calendar_*` data as the
     visible labels, in `calendar_summary_order`, plus the year. For example, `sq`: `"9 korrik 2026"`.
  8. **Story (GR-3b).** Replace both `<div style={{ maxWidth: 480 }}>` with
     `<Box w={{ base: '100%', sm: theme.other.boxSize.compactTrigger }}>`, which is the production parent's contract
     (`MantineDashboardPeriodControl.tsx:128`, cited in a comment).
     - Add one export, `OpenBoundedNoValue`. It is forced open with no value and `maxDate` fixed to `2026-09-17`.
     - It proves items 3–5 (GR-3a EXTEND of `Mantine/Primitives/RangeDatePicker`).

### 21.4 Acceptance criteria added by revision 4

Measure with `rev4/measure.mjs`, extended from `rev3/measure.mjs`, on a fresh `build-storybook`, in `en`. Record every
reading.

- **AC30 [F11]** — `AgentStatisticsView` `Default` at 1440 and 1024:
  - the three row-1 cards' value elements end at the same `bottom` within 1px;
  - their sparklines' `top` values are equal within 1px;
  - the AGT-05 info trigger's `top` is above its card's value `top`;
  - its `aria-label` is `agt05_tooltip_aria`'s `en` string;
  - focusing it opens a tooltip whose text is `agt05_tooltip`'s `en` string;
  - AC23's other clauses hold, as amended by §21.2.
- **AC31 [F12]**:
  - `DashboardCard` `Fill`:
    - at 320, 390 and 768, the two cards stack, and each card's width equals the container's content width within
      1px;
    - at 1024 and 1440, they sit side by side, 8 + 4, and end at the same `bottom` within 1px.
  - `DashboardDonut` `WithCounts`: the card's width equals the container's content width within 1px at
    320/390/768/1024/1440, with no horizontal overflow.
- **AC32 [F12, GR-3b/3c]** — One GR-3b receipt in `<component w>/<parent w>` form and one GR-3c receipt, at
  320/390/768/1024/1440, for each of:
  - `Fill`, `WithCounts` and `AccentWithSubstats`;
  - `AgentStatisticsView` `Default`, whose component is each row-1 card and the row-2 hero.
- **AC33 [record]** — The revision 3 section of the session log states that `check:locale-leak:mantine-only`
  completed with `EXIT_CODE=1`. Quote its zero-line result for the eight stories named in §21.1.
- **AC34 [F14]** — `AgentStatisticsView` `Default` at 1024 and 1440, once with the 30-day segment and once with
  Custom selected:
  - the hero's `scrollHeight` is at most its `clientHeight` + 1;
  - each of its 4 sub-stat links lies fully inside the hero's box;
  - AC25's equal bottoms still hold.
- **AC35 [F13 items 1, 6, 7, 8]**:
  - `RangeDatePicker.tsx` and `RangeDatePicker.stories.tsx` contain no `style=` and no raw px/rem/vw/dvh or
    `9999px` literal. The grep in §21.5 prints nothing.
  - `check:design-tokens:strict` exits 0.
  - At 1440, a day cell measures 39 × 39, and the month and year triggers are 150 and 100 wide (D891-1: sizes
    unchanged).
  - The clear link reads `common.aria_clear` in the active locale.
  - With `locale=sq`, a day's `aria-label` contains the Albanian month name.
  - The Story's picker width equals its parent's width at 320 and 390, and equals `compactTrigger` at 1024 and 1440.
- **AC36 [F13 items 2–5]**, on `Mantine/Primitives/RangeDatePicker` → `OpenBoundedNoValue`, `en`:
  - At 1440:
    - the trigger's text centre and its trigger centre differ by at most 1px, closed and with a value;
    - the selector group's centre and the left grid's centre differ by at most 2px;
    - the right-month label's centre and the right grid's centre differ by at most 2px;
    - the right grid's month is September 2026;
    - after opening, `document.activeElement` is not the summary input.
  - At 390, the bottom sheet opens scrolled to the September 2026 section.
  - The same trigger-centring check holds on `AgentStatisticsView` `Default` with Custom selected.
- **AC37 [F13, Q4 critical flow]** — The registry's regression set passes, plus one new test for each behaviour
  change:
  - four files: `RangeDatePicker.smoke`, `MantinePopover.smoke`, `filtersRangeDatePicker.smoke` and
    `RangeDatePickerLocalization`;
  - opening with no value and a `maxDate` shows `maxDate`'s month as the right-hand month;
  - a `sq` day `aria-label` is Albanian;
  - opening does not focus the summary field.

  Each new test needs a planted-violation proof: revert its fix, the test fails; restore it, the test passes, with
  `git hash-object` before and after (Node I/O only).

  Update `docs/critical-flow-registry.md`'s "Listings date-range filter" row with the new tests and the
  anchor/label change.

`GR-4 AC AUDIT — 8 criteria added (AC30–AC37); each states an observable property; absolutes: AC30's and AC31's 1px alignments, AC34's +1px scroll height, AC35's zero-literal grep and the unchanged 39/150/100 sizes, AC36's 1–2px centring, each at named widths on named stories.`

`GR-3a STORY PREFLIGHT — RangeDatePicker × opened-with-no-value-and-maxDate; canonical candidates: mantine-primitives-rangedatepicker--default; direct-import evidence: src/stories/mantine/primitives/RangeDatePicker.stories.tsx:7; toolbar coverage: locale=globals.locale, viewport=toolbar; decision: EXTEND; target: Mantine/Primitives/RangeDatePicker; rationale: the existing forced-open instance carries a value, so it cannot show the no-value anchor; one export is added to the same file (its own comment forbids two simultaneous open instances in one export).`

`GR-0 CANONICAL REUSE PREFLIGHT — request: AGT-05 info icon placement; Fill/WithCounts Story width contracts; semantic queries: MantineDashboardStatCard slots (comparison, secondaryLine, caption), MantineDashboardGrid Split, DashboardCard/DashboardDonut story wrappers; inspected candidates: MantineDashboardStatCard.tsx:176-262 (comparison slot = top-right Group, :234-237), MantineDashboardGrid.tsx:47-84, DashboardCard.stories.tsx:84-116, DashboardDonut.stories.tsx:161-188; decision: COMPOSE (existing comparison slot; existing grid parents); selected canonical owner: MantineDashboardStatCard, MantineDashboardGrid; Mantine/TailAdmin token path: existing theme spacing (xs gap); new hardcoded visual values: NONE; rationale: both defects are composition errors, not missing slots.`

`GR-0 CANONICAL REUSE PREFLIGHT — request: RangeDatePicker on tokens (F13); semantic queries: date range picker, calendar, @mantine/dates, range-day-cell, compactTrigger, radius pill, touchTarget; inspected candidates: RangeDatePicker.tsx (sole range picker, Task 558/561; consumers MantineDashboardPeriodControl, FiltersPanel, ListingsFilters), @mantine/dates (not a dependency — package.json has no match; adopting it would replace Task 561's owner-locked D1–D4 UI, so it is rejected), src/components/shared/DatePicker.tsx (legacy single date), theme.ts radius.pill:625 and boxSize.touchTarget:674, range-date-picker-chrome.css, input-chrome.css; decision: EXTEND (theme.other.rangeDatePicker roles; existing chrome files) + REUSE (pill, touchTarget, common.aria_clear, common.calendar_*); selected canonical owner: RangeDatePicker.tsx + theme.ts; Mantine/TailAdmin token path: theme radius/spacing/fontSizes, §6t day-cell values carried into named roles; new hardcoded visual values: NONE; rationale: every value already exists as a literal with recorded provenance, so it gets a named owner, and nothing new is invented.`

### 21.5 Re-entry, gate block, report

- Re-entry is `remediation`. Put new artifacts in `evidence/task891/rev4/`.
  - Keep `rev3/` and `review5/` untouched, except for the session log correction in AC33.
  - Do not re-run R15, because `page.tsx` and `data.ts` do not change.
- Scope added to §7 by this revision:
  - `RangeDatePicker.tsx` and `RangeDatePicker.stories.tsx`;
  - `range-date-picker-chrome.css` and `input-chrome.css`, trigger rule only;
  - `theme.ts`, the `theme.other.rangeDatePicker` roles only. `theme.ts` already carries uncommitted 889/854 hunks,
    so add only this group and record its hunk;
  - the RangeDatePicker test files named in AC37;
  - `docs/critical-flow-registry.md`, that one row only.
- QA: Q4 for F13 (critical flow) and Q3 for everything else.
- Before the first write, run the GR-1 census for the two other `RangeDatePicker` consumers,
  `src/components/shared/FiltersPanel.tsx` and `src/modules/listings/components/ListingsFilters.tsx`, and quote both
  receipts. Their surfaces change visibly, because of the clear label and the anchor.
- Tee every command to `evidence/task891/rev4/<name>.txt` with its exit code.

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:i18n
npm.cmd run test -- src/modules/cabinet/statistics/__tests__
npm.cmd run test -- src/design-system/mantine/patterns/__tests__/RangeDatePicker.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantinePopover.smoke.test.tsx src/components/shared/__tests__/filtersRangeDatePicker.smoke.test.tsx src/design-system/mantine/patterns/__tests__/RangeDatePickerLocalization.test.tsx src/components/shared/__tests__/heroSearch.smoke.test.tsx
node.exe scripts\check-surface-census.mjs --surface src\components\shared\FiltersPanel.tsx
node.exe scripts\check-surface-census.mjs --surface src\modules\listings\components\ListingsFilters.tsx
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:pattern-enrolment
npm.cmd run check:design-tokens:strict
npm.cmd run check:rendered-scope
node.exe scripts\check-surface-census-changed.mjs --base HEAD
node.exe scripts\check-surface-census.mjs --surface src\modules\cabinet\statistics\components\AgentStatisticsView.tsx
npm.cmd run build-storybook
node.exe docs\sessions\evidence\task891\rev4\measure.mjs
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep --untracked -n -E "className=|components/ui/|style=\{|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- "src/app/[locale]/cabinet/statistics/page.tsx" src/modules/cabinet/statistics/components/AgentStatisticsView.tsx src/modules/cabinet/statistics/tableParams.ts src/modules/cabinet/statistics/topListings.ts src/modules/cabinet/statistics/portfolio.ts src/modules/cabinet/statistics/activityState.ts
git --no-optional-locks grep -n -E "maw=|SimpleGrid cols=\{2\}" -- src/stories/patterns/mantine/DashboardCard.stories.tsx
git --no-optional-locks grep -n -E "style=\{|[0-9]+px|[0-9.]+rem|[0-9]+dvh|[0-9]+vw|9999" -- src/design-system/mantine/patterns/RangeDatePicker.tsx src/stories/mantine/primitives/RangeDatePicker.stories.tsx
npm.cmd run check:locale-leak:mantine-only
```

- Expected results:
  - exit 0 for every command up to and including `check:mojibake`;
  - the first `git grep` prints nothing and exits 1;
  - the `DashboardCard` `git grep` prints **only** the two pre-existing `maw=` lines, in the `Loading` and `Error`
    exports (`:70` and `:122` at review 5), and no line inside `Fill`. Quote its output;
  - the `RangeDatePicker` `git grep` prints nothing and exits 1. A comment that must keep a historical number
    (Task 774's measurement note) is rephrased without the unit, so the grep stays falsifiable;
  - `check:locale-leak:mantine-only` is known red (836). Quote zero findings for
    `mantine-primitives-rangedatepicker`, `patterns-mantine-dashboardperiodcontrol` and the §21.1 stories. If it has
    not finished in 60 minutes, record the elapsed time and the `Get-Process node` count, as §17.4 requires.
- Report:
  - append a "Revision 4" section to the session log, with AC30–AC37 quoted from `rev4/measure.out.json` and the test
    transcripts, every receipt, the three AC37 plant/restore witnesses and a labelled hash list that includes
    `rev4/measure.mjs`;
  - end with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (854 + 891 jointly).
- After review 6 accepts revision 4, the owner re-runs §13.4 in full as **O891-1**.
  - Row 3 reads "3 KPI cards, 2 + 1 below `lg`; splits stacked; at 1024 the charts sit under the values (§21.2)".
  - One row is added: `Mantine/Primitives/RangeDatePicker` → `OpenBoundedNoValue` and `AgentStatisticsView` with
    Custom open, at 390 and 1440, in `sq` and `en`.
  - **Superseded by §22.4:** the owner matrix follows review 7.

## 22. Review 6 — NEEDS REVISION (Opus, 2026-09-29) · revision 5

Reviewer evidence: `docs/sessions/evidence/task891/review6/`. It was measured on the executor's final `storybook-static`
(built 00:47), served natively (`win32 v22.22.3`):
- `probe.out.json`;
- `daycell-computed.json`;
- `mobile-anchor.json`;
- the screenshots.

### 22.1 Accepted from revision 4

No action is owed on these:
- **F11 / AC30** — row-1 values end at 288/288/288 at 1440, and sparklines start at 275/275/275 at 1024.
- **F12 / AC31** — the `Fill` and `WithCounts` widths.
- **F14 / AC34** — the reviewer re-measured the **Custom** segment, which `rev4/measure.mjs` skipped. At 1024 and
  1440, the hero's `scrollHeight` equals its `clientHeight` (296/296 and 278/278), and all 4 links lie inside it.
- **AC33** — accepted.
- **AC35** — the grep, the 39 / 150 / 100 sizes, "Clear", and the `sq` day `aria-label` are accepted.
- **AC36, desktop header and focus** — accepted. For the "with a value" trigger, the reviewer measured the text centre
  at 190.5 against a trigger centre of 191, and 544.5 against 545.
- **GR-1** — `AgentStatisticsView` returns 24/24 nodes on the reviewer's re-run.
- **GR-1 on `FiltersPanel` / `ListingsFilters`** — it reports 4 blocking nodes: `FilterChoiceGroup`,
  `FilterRangeInputs`, `FilterRoomsRow` and `YearCombobox`. They are baselined and already filed as reserved **840**
  (Sprint 69). They are not in 891's scope.
- **F13 item 5, a deviation the executor did not record.** The executor used `FocusTrap.InitialFocus` instead of
  `data-autofocus` on the month trigger. `MantineCombobox` has no trigger-prop passthrough (`MantineCombobox.tsx:31-55`),
  so the reviewer accepts the Mantine-native initial-focus anchor. No action.

### 22.2 Findings and required corrections

**F15 · P1 · F13 item 1, clause 16c, GR-3 — the canonical Story renders no day-cell states.**
- Revision 4 moved every day-cell colour into `range-date-picker-chrome.css`.
  - `src/app/layout.tsx:15` imports that file.
  - `.storybook/preview.tsx:13-20` imports every other chrome file, but not this one.
- In every `Mantine/Primitives/RangeDatePicker` export, and in `AgentStatisticsView` with Custom open, the following
  compute to `color: rgb(0,0,0)`, `opacity: 1`, `border: 0` (`review6/daycell-computed.json`):
  - disabled days after `maxDate` (Sep 18–30);
  - out-of-month fillers;
  - today's border;
  - the boundary fill and the in-range band.
- No `range-day-cell` rule is present in the document's stylesheets. `review6/rdp-open-1440-uk.png` shows it.
- Before revision 4 these states were inline, so Storybook rendered them.
- The owner reviews this Story, and the "криво" complaint gets worse.
- **Correction:**
  - Import the file in `.storybook/preview.tsx`, between `notification-chrome.css` and `typography-chrome.css` (the
    `layout.tsx` order).
  - Change no other file for this finding.

**F16 · P2 · F13 item 1, Task 561 D4 — the mobile Confirm bar is boxed on four sides.**
- `RangeDatePicker.tsx` `MobileBody` renders `<Box pt="sm" bd={…}>`. Mantine's `bd` is the `border` shorthand, so the
  bar gets a 1px border on top, left, right and bottom (`review6/probe.out.json` → `mobileBar`;
  `review6/rdp-mobile-390.png`).
- Before this revision it had `borderTop` only.
- **Correction:**
  - Remove `bd` from that `Box`.
  - Render a Mantine `<Divider />` immediately above the `Box`. Its theme default is gray.2 at 1px
    (`theme.ts:1342-1353`), the same value the old top border used.
  - Keep `pt="sm"`.

**F17 · P2 · F13 item 4, AC36 — the mobile sheet opens with its header reading the previous month.**
- `maxDate`'s month is the **last** section of the list, so the scroll clamps at the end. Measured at 390,
  `OpenBoundedNoValue`: `scrollTop` 3273 = max, and the "September 2026" title sits 105px below the viewport top.
- `handleScrollPositionChange` (`RangeDatePicker.tsx:620-627`) picks the last section whose top is at or above
  `scrollTop + 4`. That is **August**, so the fixed month selector reads "August" (`review6/rdp-mobile-390.png`).
  Filters with `maxDate={today}` open the same way.
- The session log says `rev4/measure.mjs` used "the same closest-offset rule the mobile body's own scroll-position
  handler uses". The handler does not use a closest-offset rule, so the log is wrong here.
- **Correction:**
  - Extract the index choice into an exported pure function, `pickVisibleMonthIdx(sectionTops, scrollTop,
    clientHeight, scrollHeight)`. It returns the **last** index when `scrollTop + clientHeight >= scrollHeight - 1`,
    and otherwise the current rule.
  - Call it from `handleScrollPositionChange` with `viewportRef.current`'s metrics.

**F18 · P3 · GR-2, §21.5 — revision 4's evidence does not describe the final tree.**
- The three AC37 plants ran against RangeDatePicker hash `4a1d61…`. The final hash is `5f3947…`, because the header
  was redesigned after the plants.
- `DashboardCard.stories.tsx` was edited at 00:46:32. That is after these were written: `typecheck-final`,
  `lint-final`, `check-stories-final`, `check-design-tokens-final`, `build-final` and `grep-hardcode-final`.
  - `grep-hardcode-final.txt` still prints line 85 (`SimpleGrid cols={2}` inside `Fill`).
  - The session log says the grep printed nothing inside `Fill`.
  - The reviewer's re-run on the current tree is clean.
- The session log calls the `AgentStatisticsView` Custom trigger "a real staged-value trigger". It shows the
  placeholder.
- **Correction:**
  - Run §22.4's whole block after the last write.
  - Re-plant all AC37 tests and AC40's new test against the final file.
  - In the Revision 5 section, correct the three statements above.

### 22.3 Acceptance criteria added by revision 5

Measure with `rev5/measure.mjs`, extended from `rev4/measure.mjs`, on a fresh `build-storybook`. Compare every colour
with `getComputedStyle(document.documentElement).getPropertyValue('--mantine-color-…')` resolved on the same page.

- **AC38 [F15]** — `OpenBoundedNoValue`, 1440, `en`:
  - day `2026-09-20` (after `maxDate`) computes to the gray-3 colour at opacity 0.4, with `cursor: not-allowed`;
  - the out-of-month `2026-10-02` computes to gray-4;
  - `2026-09-10` computes to gray-7 at opacity 1;
  - on `Default`, the staged boundary days have a brand-7 background and white text, and a middle day's
    `.range-day-band` has a brand-0 background.
  - **Route proof:** `npm.cmd run start`, then `/en/listings` at 1440 and 390. Open the period picker in the filters,
    and record the same two computed values: a day after today (blocked) and an available day.
- **AC39 [F16]** — `OpenBoundedNoValue`, 390:
  - the Confirm bar's container computes to `border-left`, `border-right` and `border-bottom` width 0;
  - a 1px gray-2 divider sits directly above it, as wide as the bar.
  - Add a screenshot.
- **AC40 [F17]** — at 390:
  - `OpenBoundedNoValue` opens with the header month selector reading "September" (`en`) and "Shtator" (`sq`);
  - `Default` still opens reading its staged month ("January").
  - Add one unit test for `pickVisibleMonthIdx` in `RangeDatePicker.smoke.test.tsx`, covering three cases: at the end,
    mid-list and at the top. Plant it: remove the end-of-list branch → FAIL; restore → PASS. Record the content hash
    before and after, using Node I/O only.
  - Add the test to the "Listings date-range filter" row of `docs/critical-flow-registry.md`.
- **AC41 [F18]:**
  - each of the 4 plants (3 from AC37 plus AC40's) fails under its plant and passes restored, and the restored hash
    equals the final file hash in `rev5/hash-list.txt`;
  - every §22.4 artifact is newer than the last source write;
  - `hash-list.txt` is written last.

`GR-4 AC AUDIT — 4 criteria added (AC38–AC41); each states an observable property; absolutes: AC38's exact token colours and 0.4 opacity, AC39's zero side borders, AC40's month labels, AC41's hash equality, each on named stories/widths.`

`GR-0 CANONICAL REUSE PREFLIGHT — request: RangeDatePicker Storybook chrome, mobile bar divider, visible-month rule; semantic queries: range-date-picker-chrome import sites, Divider theme default, ScrollArea viewport metrics; inspected candidates: src/app/layout.tsx:7-17, .storybook/preview.tsx:11-20, theme.ts:1342-1353 (Divider gray.2, --divider-size-xs 1px), RangeDatePicker.tsx:606-627 and :717-726; decision: REUSE (existing chrome file, Mantine Divider default) + EXTEND (one pure helper inside RangeDatePicker.tsx); selected canonical owner: RangeDatePicker.tsx, .storybook/preview.tsx; Mantine/TailAdmin token path: Divider theme default, existing chrome CSS; new hardcoded visual values: NONE; rationale: all three defects are wiring errors in revision 4, not missing design.`

### 22.4 Re-entry, gate block, report

- Re-entry is `remediation`. Put new artifacts in `evidence/task891/rev5/`, and keep `rev4/` and `review6/` untouched.
- Scope added to §7: `.storybook/preview.tsx`, that one import only. The files §21.5 named for `RangeDatePicker` stay
  in scope. Nothing else changes; F11, F12 and F14 are closed.
- QA: Q4 for this revision, since every change is inside the critical-flow component.
- Gate: run §21.5's block with `rev5/` in every path. Add `node.exe docs\sessions\evidence\task891\rev5\measure.mjs`
  in place of the `rev4` line, and after `npm.cmd run build` run:

  ```powershell
  npm.cmd run start
  ```

  Run it in the background for AC38's route proof. Stop it after the proof.
  - Expected results are the same as §21.5's.
  - `check:locale-leak:mantine-only` must show zero findings for `mantine-primitives-rangedatepicker`.
- Report:
  - Append a "Revision 5" section to the session log. It must hold:
    - AC38–AC41 quoted from `rev5/measure.out.json`;
    - the 4 plant transcripts;
    - the route-proof values;
    - the three corrections from F18.
  - Keep the header month of the mobile sheet in the §13.4 row that §21.5 added.
  - End with `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (854 + 891 jointly).
- After review 7 accepts revision 5, the owner re-runs §13.4 in full as **O891-1**, with §21.5's row 3 text and its
  added row.
