# Task 854 — `/{locale}/cabinet/statistics`: the agent dashboard (P0 blocks), reached from a "Statistics" item next to "Profile"

Sprint 78 · P1 · QA profile **Q4** (new authenticated route with owner isolation) + Q3 visual matrix · Wave C ·
depends on **843, 844, 845, 846, 848** approved · **Status: 📝 KICKOFF FILED 2026-09-18 — READY FOR SONNET**

> **Revised 2026-09-25 (864's finding, applied before execution):** every `git grep` command in this file now
> carries `--untracked`. Without it `git grep` reads only the index, so a "prints nothing" check over files this task
> **creates** passes whatever they contain (measured on 848: 0 hits without the flag, 3 with it). `--untracked` also
> searches tracked files, so no check lost coverage.

Sprint plan: [`Sprint_78_…`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md).
- **D78-3** (owner, 2026-09-18): *"role=agent. Нова стоірнка, кнопка "Statistics" на цю сторінку знаходиться у меню
  користувача, біля кнопки "Профіль""*.
- **D78-6**: *"/{locale}/cabinet/statistics"*.
- D78-1 keeps AGT-06–09 and AGT-12 out. AGT-03/04/11 and the activity columns come with 855/856.

## 1. Mode and task type

`IMPLEMENTATION` — a new route, its client view composed from the Sprint 78 patterns, one canonical-pattern extension
(`MantineDataTableToCards` switches at `md` without a JS flash), and a navigation entry on desktop and mobile.
Bundles: **UI / Current Mantine path** + **Profile / Edit Flow** (cabinet) + **DB / Server Action / RLS** (read gate) +
**Storybook / Visual Proof**.

## 2. Objective

An agent (`users.role = 'agent'`) opens the user menu, taps **Statistics** (right after "Profile") and lands on
`/{locale}/cabinet/statistics`. The page shows, per spec §7, §16.3 and §17.3:

- a header ("My dashboard" · "Listing state and activity for the period" · updated-at · the 7/30/custom period control);
- **AGT-01** (three action rows, or one positive empty state) and **AGT-02** (visible now + status inventory, "marked
  by me" on sold/rented);
- **AGT-05** (form inquiries for the period, with an honest comparison and a tooltip that excludes email delivery);
- **AGT-10** — the agent's listings with status/visibility, expiry and form inquiries, sortable and filterable,
  10 per page, a table from `md` and listing cards below `md`.

Non-agents never see the menu item. A signed-in non-agent who types the URL is redirected to `/{locale}/cabinet`; a
guest goes to login. Every value is a theme token or pattern prop; every breakpoint and all four locales work.

## 3. Verified context — measured 2026-09-18 (re-measure at I0)

- **Entry points.**
  - `src/components/layout/UserMenu.tsx:20-33` (Mantine, enrolled, Story `Mantine/Primitives/UserMenu`): items
    Profile (`/${locale}/cabinet`), My listings, Add listing (separator), Admin dashboard (admin/moderator only),
    Logout. `user.role` is available (`UserMenuProps.user.role: string`). Line 26 carries an inline
    `style={{ fontWeight: 500 }}` hardcode.
  - `src/components/layout/MobileNavDrawer.tsx:69-90` (Mantine, enrolled, Story `Mantine/Primitives/MobileNavDrawer`)
    repeats the signed-in links: Profile, My listings, Favorites, Add listing. Its `user` prop type has **no `role`**
    (`:15`), but `HeaderView.tsx:57` already passes a superset object with `role`.
- **Cabinet route today:** only `src/app/[locale]/cabinet/page.tsx` (tabs `?tab=`). It shows the login-redirect form
  for guests: `/${locale}/auth/login?next=${encodeURIComponent(...)}&session=lost` (`:43`). The `[locale]` layout
  renders the Mantine header and footer (enrolled).
- **Data:** 848's `getAgentStatisticsAccess()` and `getAgentStatisticsData({ ownerId, now, period, table })`, plus
  `hrefs.ts`.
- **`MantineDataTableToCards`** (enrolled; Story `Mantine/Primitives/Table`; consumers `AdminUsersTable`,
  `MantineAdminSurfacePattern`) switches table↔cards with `useMediaQuery('(max-width: 40em)')`, i.e. at **640px**.
  Its JSDoc warns that `useMediaQuery` is `false` on the first render, so the first paint is the table. Spec §17.1
  requires the card layout **below 768px**, with horizontal table scroll forbidden there. So the pattern needs a
  CSS-driven `md` switch (R6), which also removes the first-paint flash on this public-site page.
- Visibility helpers and critical-flow row as in 848.

### 3.1 Composition (spec §16.3, §17.3; P0 subset)

| Row | Content |
|---|---|
| Header | `MantineDashboardHeader` + `MantineDashboardPeriodControl` (the URL `?period=…&from=…&to=…` via `serializePeriod`/`parsePeriodParams`). The period applies to AGT-05 and AGT-10's form column; AGT-01/02 are "Now". |
| 1 | `TopRow`: **AGT-01** as `MantineDashboardCard` "Needs my action" (scope "Now") containing `MantineDashboardStatRows` (On moderation / Not visible / Expiring within 7 days; tones warning/danger/warning; hrefs from 848; `allZeroState` "No listings need action"); **AGT-02** as `MantineDashboardStatCard` "Visible now" + `MantineDashboardStatRows` secondaries (pending, inactive, sold "marked by me", rented "marked by me") each with its own href. 855 adds AGT-03 here. |
| 2 | `Split`: main = `MantineDashboardCard` "Results by listing" with **AGT-10** (`MantineDataTableToCards` `cardsBelow="md"`; columns: title with a cover thumbnail (`AppImage` from `src/design-system/media/`, square, size from a new role `theme.other.boxSize.dashboardListingThumb: '2.5rem'` — 40px, spec §17.3 AGT-06 "listing thumbnail 40 px"; neutral placeholder when `coverUrl` is null) + link to the listing, status badge (`LISTING_STATUS_COLOR`), visibility badge (positive / danger tone + text), expires (date + `RelativeTime`), form inquiries (period), row action "Edit" → the existing edit route; filters status / visibility / sale-rent as `Select`s; sort control; `MantinePagination` 10 per page; the URL holds `table.*` params); side = **AGT-05** `MantineDashboardStatCard` "Form inquiries · {period}" with a `comparison` line from `compareToPrevious` ("no base for comparison" when the previous value is 0; otherwise "{±n} vs the previous {n} days", neutral colour, no green/red verdict — spec §4) and an info `Tooltip` "A stored inquiry; it does not confirm email delivery or reading". 855 adds the chart row and the visibility donut. |

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | D78-3, D78-6 | `src/app/[locale]/cabinet/statistics/page.tsx` (server): `getAgentStatisticsAccess()` → `unauthenticated` ⇒ `redirect(/${locale}/auth/login?next=${encodeURIComponent('/'+locale+'/cabinet/statistics')}&session=lost)`; `not_agent` ⇒ `redirect(/${locale}/cabinet)`; `ok` ⇒ parse the period/table params, fetch 848's data with `now = new Date()` captured once, render `<AgentStatisticsView …/>` with serializable props only (791 lesson). `generateMetadata` title from `cabinet.statistics.title`. | P0 | AC1, AC2 | Confirmed |
| **R2** | spec §13 ownership | No request parameter can change the owner. Two agent accounts (live check, §10.6) each see only their own rows, including with the other agent's listing id typed into any URL param. | P0 | AC2 | Confirmed |
| **R3** | §3.1 | `src/modules/cabinet/statistics/components/AgentStatisticsView.tsx` (`'use client'`) renders §3.1 exactly; every block renders its `BlockResult` (error → that block's error + Retry = `router.refresh()`; zero → the specific text). Period and table changes use `router.replace` with `scroll: false`. | P0 | AC3, AC4 | Confirmed |
| **R4** | spec §3, §4 | Labels never say "lead", "contact" or "conversion"; AGT-05 is never summed with anything; comparison per §3.1. | P0 | AC5 | Confirmed |
| **R5** | D78-3 | `UserMenu`: for `user.role === 'agent'` a **Statistics** item (lucide `ChartColumn` or `BarChart3` at `iconSize.standard`, label `nav.statistics`) sits **immediately after Profile** and navigates to `/${locale}/cabinet/statistics`; absent for every other role. The line-26 inline `fontWeight` becomes a Mantine prop (e.g. `Text component="span" fw={500}`), so the file carries no inline style. `MobileNavDrawer`: `user` type gains `role?: string`; for agents a Statistics link sits right after Profile (same `styles.navLink` pattern as its siblings). Both Stories gain an agent state (`Mantine/Primitives/UserMenu` agent fixture; `Mantine/Primitives/MobileNavDrawer` agent state). | P0 | AC6 | Confirmed |
| **R6** | spec §17.1, extend canonical | `MantineDataTableToCards` gains `cardsBelow?: 'sm' \| 'md'` (default `'sm'`, existing path byte-for-byte unchanged in behaviour). With `'md'`, it renders both layouts and switches with Mantine `hiddenFrom="md"` / `visibleFrom="md"` (CSS, no `useMediaQuery`), so there is no first-paint flash and no table below 768px. `Mantine/Primitives/Table` gets a `cardsBelow md` state. The existing consumers' smoke test (`AdminUsersTable.smoke.test.tsx`) still passes. | P1 | AC7 | Confirmed |
| **R7** | 16c, GR-3 | Own Story `Patterns/Mantine/AgentStatisticsView` with fixtures for: all ok; AGT-01 all zero; AGT-05 previous = 0 ("no base"); AGT-10 empty ("You have no listings yet" + CTA "Add listing"); AGT-05 error; 25 listings with pagination. Enrolled. | P1 | AC8 | Confirmed |
| **R8** | i18n | New keys `cabinet.statistics.*` and `nav.statistics` in sq/en/uk/it. `check:i18n` 0. | P1 | AC5 | Confirmed |
| **R9** | breakpoints | 1440 / 1280: 2 top cards (closing grid), 8+4 split, table visible. 1024: same. 768: cards 2-up, split stacked, table visible. ≤ 767: 1 column, AGT-10 as listing cards (title and status on top, then labelled rows: visibility, expires, form inquiries), no horizontal scroll, filters and pagination full width. | P0 | AC9 | Confirmed |
| **R10** | hardcode | No `className=`, Tailwind, `@/components/ui/*`, raw px/rem/hex/rgb, or inline `style=` in the new files and in `UserMenu.tsx`. `MobileNavDrawer.tsx` keeps its existing CSS-module class usage (no new values). | P0 | AC10 | Confirmed |

## 5. Assumptions and open questions

- **Not-agent redirect target** `/{locale}/cabinet` is an INFERENCE (the friendliest destination; the item is never
  shown to non-agents). The owner may return it.
- **AGT-01 targets** use 848's recorded mapping onto the existing cabinet filters. Where no filter matches (e.g.
  "expiring within 7 days"), the target is `/{locale}/cabinet?tab=listings`, with the gap recorded in the report as a
  follow-up candidate, not solved here.
- The "Edit" action uses the existing listing edit route. The executor finds it with
  `git grep --untracked -n "listings/.*/edit" -- src/app` at I0 and records it.
- No owner decision open.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (3, 5, 6, 6a, 7, 9, 10, 11, 12, 13, 14, 16–16d) ·
`docs/qa-profiles.md` · `docs/mantine-responsive-design-system.md` · `docs/tailadmin-style-reference.md` §6, §6u ·
`docs/component-rules.md` · `docs/domain-rules.md` · `docs/rls-rules.md` · `docs/state-authority.md` ·
`docs/storybook-governance.md` · `docs/i18n-rules.md` · `docs/qa-rules.md` · `docs/orchestrator-procedures.md` →
"Corollary (791)" · `.claude/skills/execute-task/SKILL.md` · kickoffs 843–846, 848.

## 7. Scope

- **Created:** `src/app/[locale]/cabinet/statistics/page.tsx` ·
  `src/modules/cabinet/statistics/components/AgentStatisticsView.tsx` ·
  `src/stories/patterns/mantine/AgentStatisticsView.stories.tsx` · a fixtures module under `src/stories/fixtures/`.
- **Edited:** `src/design-system/mantine/theme.ts` (`boxSize.dashboardListingThumb` + union) · `src/components/layout/UserMenu.tsx` · `src/components/layout/MobileNavDrawer.tsx` ·
  `src/stories/mantine/primitives/UserMenu.stories.tsx` · `src/stories/mantine/primitives/MobileNavDrawer.stories.tsx`
  · `src/design-system/mantine/patterns/MantineDataTableToCards.tsx` · `src/stories/mantine/primitives/Table.stories.tsx`
  · `scripts/mantine-migration-scope.json` (1) · `messages/{sq,en,uk,it}.json` · `docs/backlog.md` (854 line).

## 8. Out of scope

`CabinetShell` and its tabs (D78-3: new page) · AGT-03/04/11 and activity columns (855/856) · chat/review blocks ·
new cabinet filters · `HeaderView` (it already passes `role`).

## 9. Current and required behavior

**Before.** Agents have no statistics; the user menu has Profile, My listings, Add listing, [Admin], Logout.
**After.** Agents see a Statistics item after Profile (desktop menu and mobile drawer). The page shows AGT-01, 02, 05
and 10. Everyone else sees no change.

## 10. Implementation requirements

1. **I0.** Platform line; status porcelain; hashes; confirm the prerequisites are approved; census of `UserMenu.tsx`,
   `MobileNavDrawer.tsx`, `MantineDataTableToCards.tsx` (before); the edit-route grep; run
   `npm.cmd run test -- src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` (baseline).
2. R6 first (pattern extension + Table Story state), then R5, then the view (R3/R4) and its Story (R7), then the page (R1).
3. Period/table URL: only `period`, `from`, `to`, `status`, `visibility`, `type`, `sort`, `page` are read; anything
   else is ignored.
4. Enrol `AgentStatisticsView.tsx`.
5. `node.exe scripts\check-surface-census.mjs --surface src\modules\cabinet\statistics\components\AgentStatisticsView.tsx`
   must be clean (tier 1 enrolled + storied; no tier 2).
6. **Live proof** (dev server; the owner supplies or approves two agent test accounts and one `user` account; if none
   are available, hand these tuples to the owner):
   - agent A and agent B each see only their own rows (quote row counts, and one title that appears only for its
     owner);
   - a `user` account has no menu item and is redirected from the URL;
   - a guest is sent to login;
   - agent A pastes a URL with agent B's listing id in `status`/`page` params: no leak;
   - the period switch updates AGT-05 and the URL.
   Read the full server log for the 791 signature.

## 11. Positive and negative flows

**Positive.** Agent A opens the menu and picks Statistics. AGT-01 shows 2 / 2 / 3; AGT-02 shows 12 with pending 2 and
sold 1 "marked by me". AGT-05 shows 7 in the last 30 days, "+3 vs the previous 30 days". The table shows 10 of 20
listings; sorting by "Expires" reorders them; page 2 shows the rest.

| Negative flow | Applicable | Expected |
|---|---|---|
| Guest opens the URL | Yes | Login redirect with `next`. |
| Signed-in `user`/`admin`/`moderator` | Yes | Redirect to `/{locale}/cabinet`; no menu item. |
| Cross-owner URL tampering | Yes | No effect (R2). |
| Invalid `period` | Yes | Falls back to 30d (846). |
| Custom range > 90 days | Yes | Control shows the error; no navigation. |
| Block error | Yes | That block's error + Retry only. |
| No listings | Yes | AGT-01 all-zero state; AGT-02 zero state; AGT-10 empty + "Add listing" CTA. |
| Previous period 0 | Yes | "no base for comparison". |
| ≤ 767px | Yes | Cards, not a table; no horizontal scroll. |
| Long `uk` strings | Yes | Wrap; no overflow at 320. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given the page file, when read, then it contains no `'use client'`, no `className`, no function-valued
  prop, and exactly the redirects of R1; the full dev-server log of §10.6 has no `Functions cannot be passed directly
  to Client Components` line.
- **AC2 [R1, R2]** — Given §10.6's live checks, when performed, then each outcome matches the negative-flow table.
  Quote counts and URLs. (If no test accounts exist: `PARTIALLY IMPLEMENTED` with the owner steps §13.3 #8–#10.)
- **AC3 [R3]** — Given `Patterns/Mantine/AgentStatisticsView`, when each fixture state renders, then the blocks match
  §3.1 and the error state appears only in its own block.
- **AC4 [R3]** — Given the live page, when the period control switches 30d → 7d, then the URL shows `period=7d`,
  AGT-05's label and value change, and AGT-01/02 are unchanged.
- **AC5 [R4, R8]** — Given `git --no-optional-locks grep --untracked -n -i -E "lead|conversion|contact" -- messages/en.json` limited
  to the new `cabinet.statistics` block (quote the block), when read, then no label uses those words; and
  `check:i18n` exits 0.
- **AC6 [R5]** — Given the UserMenu and MobileNavDrawer Stories' agent states, when opened, then "Statistics" is the item
  right after "Profile", and the regular-user state has no such item. Quote DOM order.
- **AC7 [R6]** — Given `Mantine/Primitives/Table`'s `cardsBelow md` state at 700px and 800px, when inspected, then at
  700 only the cards are visible and at 800 only the table (computed `display`), and
  `AdminUsersTable.smoke.test.tsx` passes.
- **AC8 [R7]** — Given `check:story-coverage`, `check:pattern-enrolment` and the §10.5 census, when run, then they exit 0
  and `AgentStatisticsView` reads `manifest:yes story:yes`.
- **AC9 [R9]** — Given the owner matrix §13.3, when reviewed, then each tuple is accepted or returned with a concrete defect.
- **AC10 [R10]** — Given
  `git --no-optional-locks grep --untracked -n -E "className=|components/ui/|style=\{|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- src/app/[locale]/cabinet/statistics/page.tsx src/modules/cabinet/statistics/components/AgentStatisticsView.tsx src/components/layout/UserMenu.tsx`,
  when run, then it prints nothing; `check:design-tokens:strict` and `check:enrolled-tailwind` exit 0.

`GR-4 AC AUDIT — 10 criteria; each states an observable property; absolutes: AC10's empty grep on three named files; AC5 is limited to the new key block.`

`GR-3a STORY PREFLIGHT — AgentStatisticsView × 6 states; canonical candidates: NONE; decision: CREATE; target: Patterns/Mantine/AgentStatisticsView. — UserMenu × agent; canonical candidate: Mantine/Primitives/UserMenu (direct import src/stories/mantine/primitives/UserMenu.stories.tsx:5); decision: EXTEND (add the agent fixture). — MobileNavDrawer × agent; candidate: Mantine/Primitives/MobileNavDrawer; decision: EXTEND. — MantineDataTableToCards × cardsBelow md; candidate: Mantine/Primitives/Table; decision: EXTEND. Toolbar coverage for all: locale=toolbar, viewport=toolbar (Task 799 caveat).`

`GR-1 CENSUS COMPLETE — AgentStatisticsView surface: tier1 1 created+enrolled+story (AgentStatisticsView) + reused enrolled patterns (843–846, MantineDataTableToCards, MantinePagination, RelativeTime); tier2 0; tier3 0 listed and filed as none. The route file keeps its own root row (route files carry no Story).`

`GR-3 STORY PROVEN — AgentStatisticsView ← src/stories/patterns/mantine/AgentStatisticsView.stories.tsx; UserMenu ← src/stories/mantine/primitives/UserMenu.stories.tsx; MobileNavDrawer ← src/stories/mantine/primitives/MobileNavDrawer.stories.tsx; MantineDataTableToCards ← src/stories/mantine/primitives/Table.stories.tsx` (after execution).

## 13. QA profile and verification plan

**`Q4`** for isolation (live two-account proof, AC2) with the **Q3** visual matrix. Visibility regression re-run.

### 13.1 Re-entry

`from-scratch`. Evidence root `docs/sessions/evidence/task854/`.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p "process.platform + ' ' + process.version"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:i18n
npm.cmd run test -- src/modules/cabinet/statistics/__tests__
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
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep --untracked -n -E "className=|components/ui/|style=\{|#[0-9a-fA-F]{3,8}\b|[0-9]+px|rgba?\(" -- "src/app/[locale]/cabinet/statistics/page.tsx" src/modules/cabinet/statistics/components/AgentStatisticsView.tsx src/components/layout/UserMenu.tsx
git --no-optional-locks diff --stat
git --no-optional-locks hash-object "src/app/[locale]/cabinet/statistics/page.tsx" src/modules/cabinet/statistics/components/AgentStatisticsView.tsx src/components/layout/UserMenu.tsx src/components/layout/MobileNavDrawer.tsx src/design-system/mantine/patterns/MantineDataTableToCards.tsx
```

Expected: all exit 0 except `check:locale-leak:mantine-only` (known red, Task 836) — zero leak lines for
`patterns-mantine-agentstatisticsview`, `mantine-primitives-usermenu`, `mantine-primitives-mobilenavdrawer`,
`mantine-primitives-table`; quote the grep. The `git grep` prints nothing.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

Stories: until Task 799 lands, use `iframe.html?id=<story-id>&globals=locale:<locale>` and resize. Live: signed in as an agent.

| # | Story / route | State | Width | Locale | Owner checks |
|---|---|---|---|---|---|
| 1 | `/en/cabinet/statistics` (live) | agent data | 1440 | en | header + period; AGT-01 rows; AGT-02; table 8 cols wide + AGT-05 side card |
| 2 | `/sq/cabinet/statistics` | agent data | 1280 | sq | same; Albanian labels and numbers |
| 3 | `/it/cabinet/statistics` | agent data | 1024 | it | layout kept |
| 4 | `/uk/cabinet/statistics` | agent data | 768 | uk | 2-up cards; split stacked; table visible |
| 5 | `/uk/cabinet/statistics` | agent data | 390 / 320 | uk | listing cards, labelled rows; no horizontal scroll; filters full width |
| 6 | `Patterns/Mantine/AgentStatisticsView` | AGT-01 all zero; previous = 0; AGT-10 empty; AGT-05 error | 1440 / 390 | en / uk | specific texts; "no base for comparison"; error only in AGT-05 |
| 7 | `Mantine/Primitives/UserMenu` / `…/MobileNavDrawer` | agent | 1440 / 390 | en / uk | Statistics right after Profile |
| 8 | live, **user** account | menu + typed URL | 1440 | en | no item; redirected to the cabinet |
| 9 | live, guest | typed URL | 390 | uk | login page |
| 10 | live, agent B | same URLs as agent A | 1440 | en | only B's listings |

### 13.4 Evidence the executor hands over

§13.2 transcripts · §10.6 live notes and the server-log path · AC7 computed-display readings · owner matrix.

## 14. Completion report contract

Files with hashes · R1–R10 · AC1–AC10 with quotes · commands with exit codes · the edit route and AGT-01 target
mapping used · GR receipts · assumptions · deviations · limitations · owner matrix. Status
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no mutating git.
Update the 854 line of `docs/backlog.md`; session log with Files Changed.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Owner's placement honoured? | R5: immediately after Profile, desktop menu and mobile drawer (mobile parity, agent-contract 5). |
| Isolation proven live, not only mocked? | AC2 two-account check (+ 848's unit plant). |
| Spec mobile table rule? | R6 extends the canonical table pattern with a CSS `md` switch; the default path is untouched. |
| Existing hardcode touched is removed? | `UserMenu.tsx:26` inline style (R5/AC10). |
| 791 lesson | R1/AC1. |
| Commands in blocks | §13.2. |
