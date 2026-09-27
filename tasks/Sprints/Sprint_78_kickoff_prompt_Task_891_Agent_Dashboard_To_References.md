# Task 891 — `/{locale}/cabinet/statistics` rebuilt to the owner's references: KPI mini-charts, the activity chart, the portfolio donut, top listings, AGT-10 activity columns — and 854 closed with it

Sprint 78 · P1 · QA profile **Q3** (+ 854's Q4 isolation evidence carried forward) · Wave D (D78-9) · depends on
**889** approved · builds on **854's working tree** and closes **854 jointly** · folds **855**'s agent half and **856** ·
**Status: 📝 KICKOFF FILED 2026-09-27 — BLOCKED ON 889**

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
