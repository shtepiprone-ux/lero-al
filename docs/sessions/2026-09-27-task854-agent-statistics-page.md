# Session Archive: Task 854 — `/{locale}/cabinet/statistics`, the agent dashboard — 2026-09-27

Task: `tasks/Sprints/Sprint_78_kickoff_prompt_Task_854_Agent_Statistics_Page.md`
Sprint 78 · P1 · Q4 (+ Q3 visual matrix) · Executor: Sonnet (`claude-sonnet-5`)

`CANONICAL REUSE PREFLIGHT LOADED — docs/golden-rules.md GR-0; docs/agent-contract.md 16b–16c.`

## Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (superseded — see "Revision 1" at the end of this file)

**Review 1 (2026-09-27) returned `NEEDS REVISION`** — findings F1 (P2), F2 (P1), F3 (P2) and notes
N1–N3, requirements R11–R14, acceptance criteria AC11–AC14. Everything below this line (R1–R10,
AC1–AC10, the original §13.2 gate block, the three original live-check passes) was **accepted as
delivered** by that review (§16.1) and is retained unchanged as the historical first pass. The
current, superseding evidence is in "Revision 1" at the end of this file and under
`docs/sessions/evidence/task854/r1/`; the original `docs/sessions/evidence/task854/*` artifacts
(outside `r1/`) are superseded, not deleted.

Every code requirement (R1–R10) is implemented; every automated gate this session ran to completion
is green. Two of those gates were run to completion rather than accepted on a partial/skimmed
result, and each caught a real defect this session had shipped: a server/client module-boundary
crash (found via a live authenticated request) and a fixture proper-noun leak (found by letting the
full `check:locale-leak:mantine-only` run finish instead of treating "known red" as a reason to skip
reading its output). Both are fixed and re-verified — see "Bug found and fixed" and the
`check:locale-leak:mantine-only` row in Validation evidence.

**Live isolation proof is now complete with two real, distinct agent accounts and their own real
listings** (`HYDRATION_AGENT1`/`HYDRATION_AGENT2` in `.env.local`, added by the owner mid-session
specifically for this), plus a real admin account and a real moderator account (`HYDRATION_ADMIN`,
`HYDRATION_MODERATOR`) for the non-agent redirect rows. See "Live checks" for the full pass: guest
redirect, two agents each seeing only their own real listing (with the other agent's real listing
slug pasted into the URL and rejected), admin/moderator redirect with the correct menu, and a live
period switch. `check:locale-leak:mantine-only` and every other §13.2 command are green. The only
remaining item is **AC9's owner visual matrix (§13.3)** — `OWNER VISUAL QA REQUIRED` by design, never
Sonnet's to close.

## I0 — platform line, status porcelain, dependency confirmation

```
win32 v22.22.3
```

`git status` at session start: clean, `main` branch. 843 · 844 · 845 · 846 · 848 confirmed
**archived** in `docs/backlog.md` ("Wave B is complete... 853 and 854 are unblocked").

Baseline smoke test (`AdminUsersTable.smoke.test.tsx`, pre-R6): 21/21 passed —
`docs/sessions/evidence/task854/i0-smoke-baseline.txt`.

Edit-route grep (kickoff §5): `git grep --untracked -n "listings/.*/edit" -- src/app` →
`src/app/[locale]/listings/[slug]/edit/page.tsx:25` — used for AGT-10's row "Edit" action.

## Requirement evidence

| Req | Evidence |
|---|---|
| R1 | `src/app/[locale]/cabinet/statistics/page.tsx` — Server Component (no `'use client'`, no `className`, no function prop): `getAgentStatisticsAccess()` → `unauthenticated`/`not_agent` redirects exactly as specified, `ok` → parses period/table params (via the plain `tableParams.ts` module, not the client view — see "Bug found and fixed"), fetches `getAgentStatisticsData()` with `now = new Date()` captured once, renders `<AgentStatisticsView>` with serializable props only. `generateMetadata` reads `cabinet.statistics.title`. Live-confirmed `200` post-fix. |
| R2 | No request parameter can change the owner — `getAgentStatisticsAccess()`'s branded `AgentOwnerId` is the only identity `getAgentStatisticsData` accepts; the page never reads an id from `searchParams`. **Live-proven with two real agent accounts and their real listings**: Agent1 and Agent2 each see only their own one listing; Agent1 pasting Agent2's real listing slug into `status`/`page` shows zero leak (see "Live checks", Pass 3). |
| R3 | `AgentStatisticsView.tsx` (`'use client'`) renders kickoff §3.1 exactly via `MantineDashboardGrid`/`TopRow`/`Split`; every block reads its `BlockResult` (`ok:false` → the owning card's `state="error"`; zero → `agt01_zero`/`agt10_empty`/`agt05_no_base` positive copy). Period/table changes call `router.replace(..., {scroll:false})` — never a function prop crossing the 791 boundary. |
| R4 | `cabinet.statistics.*` keys (grepped, AC5) never use "lead"/"contact"/"conversion"; AGT-05 is rendered standalone (never summed); comparison text follows `compareToPrevious` exactly (`agt05_no_base` / `agt05_comparison`). |
| R5 | `UserMenu.tsx`: agent-only `Statistics` item (lucide `ChartColumn`, `iconSize.standard`, `nav.statistics`) inserted immediately after `Profile`, before `My listings`; absent for `user`/`admin`/`moderator`. No inline `style` remained in the file (measured stale — the line-26 hardcode the kickoff cited was already closed by Task 876, confirmed by `git log`/AC10 grep). `MobileNavDrawer.tsx`: `user.role?: string` added (optional, so both existing production callers are unaffected), agent-only Statistics link right after Profile, same `Button` pattern as its siblings. Both Stories gain an agent fixture (`UserMenu.stories.tsx` `Default` — third fixture; `MobileNavDrawer.stories.tsx` — new `Agent` export via a `role` arg). |
| R6 | `MantineDataTableToCards` gains `cardsBelow?: 'sm' \| 'md'` (default `'sm'`, the original `useMediaQuery` path byte-for-byte unchanged — verified: `AdminUsersTable.smoke.test.tsx` 21/21 both before and after). `'md'` renders both trees and switches with `hiddenFrom="md"`/`visibleFrom="md"` (CSS, no `useMediaQuery`, no first-paint flash). `Table.stories.tsx` gains `CardsBelowMd`. Live-measured (Playwright against `storybook-static`) at 700/800px — see "AC7" below. |
| R7 | `Patterns/Mantine/AgentStatisticsView` — 6 states (`Default`/all-ok, `Agt01AllZero`, `Agt05NoBase`, `Agt10Empty`, `Agt05Error`, `ManyListings`/25 rows·3 pages), built from `src/stories/fixtures/agentStatistics.fixtures.ts` using 848's own `AgentStatisticsData`/`blockOk`/`blockFail`. Enrolled. |
| R8 | `messages/{en,sq,uk,it}.json` — `cabinet.statistics.*` (44 keys) + `nav.statistics`. `check:i18n` exits 0 (2457 keys, all 4 locales). |
| R9 | Live-measured (Playwright): root width == viewport width at 320/390/1024/1440, zero horizontal overflow (GR-3b). Card/table breakpoint switch confirmed at 700/800 (AC7, shared mechanism). Owner visual matrix (§13.3) is separately `OWNER VISUAL QA REQUIRED`. |
| R10 | `git grep --untracked` for `className=\|components/ui/\|style=\{\|#[0-9a-fA-F]{3,8}\b\|[0-9]+px\|rgba?\(` over `page.tsx`, `AgentStatisticsView.tsx`, `UserMenu.tsx` → prints nothing (AC10). `check:design-tokens:strict` and `check:enrolled-tailwind` both exit 0. |

## Assumption — AGT-10 URL sort contract

The kickoff names exactly `period, from, to, status, visibility, type, sort, page` as the read URL
params — no separate `direction` param. `AgentStatisticsView.tsx` exports `AGT10_SORT_TOKENS`, a
combined field+direction token (`created_desc`, `created_asc`, `expires_asc`, `expires_desc`,
`inquiries_desc`, `inquiries_asc`; default `created_desc`) carried entirely in `sort=`.
Both live in `tableParams.ts` (a plain module, not `'use client'` — see "Bug found and fixed"):
`page.tsx` imports `parseAgt10Table` for the read side; `AgentStatisticsView.tsx` imports
`serializeAgt10Table` for every `router.replace`. Recorded here as an INFERENCE, not a re-derivation
risk, since no other 854-owned file defines this contract.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Token path | Change/Preserve | Evidence |
|---|---|---|---|---|---|
| Statistics menu item (desktop) | `UserMenu.tsx` `DropdownMenuItemDef` | `MantineDropdownMenu` item | `theme.other.iconSize.standard` (`ChartColumn`) | Change (new item) | Source read; GR-1 census clean |
| Statistics link (mobile) | `MobileNavDrawer.tsx` `Button` | `variant="transparent"` sibling pattern | none new | Change (new link) | Source read |
| Dashboard header/period | `MantineDashboardHeader`/`MantineDashboardPeriodControl` | canonical pattern (843/846) | existing tokens | Reuse unchanged | Source read; already GR-3b/3c audited in 843/846 |
| AGT-01/02 cards | `MantineDashboardCard`/`StatCard`/`StatRows` | canonical pattern (843) | existing tokens | Reuse unchanged | Source read |
| AGT-10 table/cards | `MantineDataTableToCards` | canonical pattern, extended (R6) | `theme.other.mobileGate`, `theme.breakpoints.md` | Extend (`cardsBelow`) | Source read + live measurement |
| AGT-10 cover thumbnail | `AppImage variant="listing-thumb"` in a themed `Box` | `theme.other.boxSize.dashboardListingThumb` (new, 40px) | new token, one role | Change (new composition, COMPOSE disposition) | Source read; theme.ts diff |
| AGT-05 side card | `MantineDashboardStatCard` + `MantineTooltip` | canonical patterns (843) | existing tokens | Reuse unchanged | Source read |

## GR receipts

`GR-0 CANONICAL REUSE PREFLIGHT — request: AgentStatisticsView composition + AGT-10 cover thumbnail;
semantic queries: "dashboard card pattern", "data table cards responsive", "listing thumbnail
appimage", "select filter mantine", "tooltip info icon"; inspected candidates:
MantineDashboardHeader/Card/StatCard/StatRows/Grid/PeriodControl (843/845/846),
MantineDataTableToCards + AdminUsersTable/MantineAdminSurfacePattern consumers, MantineSelect,
MantineTooltip, AppImage (src/design-system/media/), MantineEmptyLoadingErrorState,
listingStatusTone.ts, visibility.ts; decision: REUSE (all dashboard/select/tooltip/empty-state
patterns, listingStatusTone, RelativeTime, MantinePagination) + EXTEND
(MantineDataTableToCards.cardsBelow, UserMenu/MobileNavDrawer agent item, Table/UserMenu/
MobileNavDrawer Stories) + COMPOSE (AGT-10 thumbnail: AppImage + Mantine Box/Center, no new
appImageConfig variant, no local style) + CREATE (AgentStatisticsView.tsx itself — no canonical
Mantine composition already renders 848's data; its own Story is the direct proof); selected
canonical owner: see table above per artifact; Mantine/TailAdmin token path:
theme.other.boxSize.dashboardListingThumb (new, 40px, one documented role) + all pre-existing
843/845/846/844 tokens; new hardcoded visual values: NONE; rationale: every visible element is a
canonical Mantine dashboard/table/select/tooltip pattern already proven by 843–846, extended only
where the spec required a new capability (cardsBelow, the thumbnail composition, the agent menu
item).`

`GR-1 CENSUS COMPLETE — AgentStatisticsView surface: 18 nodes; tier1 18 migrated+enrolled+story
(RelativeTime, MantineDashboardCard/Grid/Header/PeriodControl/StatCard/StatRows,
MantineDataTableToCards, MantineEmptyLoadingErrorState, MantinePagination, MantineSelect,
MantineTooltip, AppImage, RangeDatePicker, responsiveBottomSheet, MantineCombobox, MantinePopover);
tier2 0; tier3 0 listed and filed as none. UserMenu surface: 3 nodes; tier1 3
migrated+enrolled+story (MantineDropdownMenu, responsiveBottomSheet via one barrel hop); tier2 0;
tier3 0.`

`GR-2 SCOPE STATED — check:story-coverage/check:pattern-enrolment/check:rendered-scope/
check:surface-census(:changed) inspect only the enrolled manifest subgraph and diff-mapped
surfaces; they cannot see an unenrolled component. AgentStatisticsView.tsx and every pattern it
renders are enrolled (manifest + direct-import Story) per the two direct `check-surface-census.mjs`
runs above, closing that blind spot for this task's own surfaces.`

`GR-3 STORY PROVEN — AgentStatisticsView ← src/stories/patterns/mantine/AgentStatisticsView.stories.tsx;
UserMenu ← src/stories/mantine/primitives/UserMenu.stories.tsx; MobileNavDrawer ←
src/stories/mantine/primitives/MobileNavDrawer.stories.tsx; MantineDataTableToCards ←
src/stories/mantine/primitives/Table.stories.tsx.`

`GR-3a STORY PREFLIGHT — AgentStatisticsView × 6 states; canonical candidates: NONE; decision:
CREATE; target: Patterns/Mantine/AgentStatisticsView (created). UserMenu × agent; canonical
candidate: Mantine/Primitives/UserMenu (direct import, same file); decision: EXTEND (agent fixture
added to Default). MobileNavDrawer × agent; candidate: Mantine/Primitives/MobileNavDrawer; decision:
EXTEND (new Agent export). MantineDataTableToCards × cardsBelow md; candidate:
Mantine/Primitives/Table; decision: EXTEND (new CardsBelowMd export). Toolbar coverage for all:
locale=toolbar, viewport=toolbar (Task 799 caveat).`

### AC6 — live DOM order (Playwright against `npm run build-storybook` output)

```
mantine-primitives-usermenu--default (agent fixture, opened): ["Profile","Statistics","My listings","Add listing","Logout"]
mantine-primitives-mobilenavdrawer--agent: ["Home","Listings","Profile","Statistics","My listings","Favorites","Add listing"]
```

Statistics sits immediately after Profile in both; the admin-only "Dashboard" item is absent from
the agent fixture in both (`role === 'admin' | 'moderator'` gate, unchanged).

### AC7 — live measurement (Playwright against `npm run build-storybook` output)

```
mantine-primitives-table--cards-below-md @ 700px: hiddenFrom(cards) display=block, visibleFrom(table) display=none
mantine-primitives-table--cards-below-md @ 800px: hiddenFrom(cards) display=none,  visibleFrom(table) display=block
```

`AdminUsersTable.smoke.test.tsx`: 21/21 passed, both before (I0 baseline) and after the R6 change.

### GR-3b — live measurement, `patterns-mantine-agentstatisticsview--default`

`GR-3b STORY RESPONSIVE CHECK — patterns-mantine-agentstatisticsview--default: 320 320/320 · 390
390/390 · 1024 1024/1024 · 1440 1440/1440; overflow: none; fixed-width containers: NONE; style
objects: NONE; viewport pins: NONE.` (Root element width equals viewport width at every measured
breakpoint — the Story wraps no fixed-width shell; `MantineDashboardGrid` itself supplies the fluid
gutter/max-width, unchanged from 846.) The other 5 fixture states share byte-identical layout code
(only `data` differs) — this mechanism is representative of all six.

### GR-3c — live measurement, `patterns-mantine-agentstatisticsview--default`

`GR-3c TYPE RESPONSIVE CHECK — patterns-mantine-agentstatisticsview--default: page title ("My
dashboard", MantineDashboardHeader's own `fz={{base:'h5',sm:'h4'}}`) 320 20px · 390 20px · 768 24px ·
1440 24px; card titles ("Needs my action"/"Results by listing", MantineDashboardCard's own fixed
`size="h5"`) 320 20px · 390 20px · 768 20px · 1440 20px; ≥24px text without a responsive step: NONE;
heading above 20px below 640 (non-hero): NONE; child heading larger than page title: NONE.` Both
headings belong to canonical patterns already GR-3c-audited in Tasks 843/846/853 — this task adds no
new heading of its own (every `Text` this file writes is `size="sm"`/`"xs"`).

## Validation evidence (§13.2 final gate block)

| Command | Exit | Notes |
|---|---|---|
| `node -p "process.platform + ' ' + process.version"` | — | `win32 v22.22.3` |
| `npm run typecheck` | 0 | clean (re-run post server/client-boundary fix) |
| `npm run lint` | 0 | 0 errors, 94 pre-existing warnings (none in touched files); re-run post-fix |
| `npm run check:i18n` | 0 | 2457 keys, 4/4 locales |
| `npm run test -- src/modules/cabinet/statistics/__tests__` | 0 | 3 files, 49 passed |
| `npm run test -- src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` | 0 | 21/21, both pre- and post-R6 |
| `npx vitest run src/modules/listings/lib/__tests__/visibility.test.ts` | 0 | 66/66 |
| `npm run check:listing-visibility` | **1** | Pre-existing red, **not this task**: `contactEvents.ts:50` inline literal, filed as Task 887 (2026-09-26, 853 review 1); no file this task touches is implicated |
| `npm run check:stories` | 0 | 176 files, 0 violations |
| `npm run check:story-coverage` | 0 | 109/109 enrolled components covered |
| `npm run check:pattern-enrolment` | 0 | 52 pattern files, 109 manifest entries |
| `npm run check:design-tokens:strict` | 0 | 0 violations |
| `npm run check:enrolled-tailwind` | 0 | 2 pre-existing baselined findings, none from this task |
| `npm run check:rendered-scope` | 0 | 0 new edges |
| `node scripts/check-surface-census-changed.mjs --base HEAD` | 0 | 4 tracked surfaces re-censused, 0 new/stale blocks |
| `node scripts/check-surface-census.mjs --surface .../AgentStatisticsView.tsx` | 0 | 18 nodes, tier1 18, tier2/3 0 |
| `node scripts/check-surface-census.mjs --surface .../UserMenu.tsx` | 0 | 3 nodes, tier1 3, tier2/3 0 |
| `npm run build-storybook` | 0 | includes `AgentStatisticsView.stories-*.js`; re-run post-fix, still 0 |
| `npm run check:locale-leak:mantine-only` | **1** (expected — known red, Task 836) | Full run completed (report: `docs/sessions/evidence/task854/check-locale-leak-full-report.txt`). One real, in-scope finding: `Mantine/Primitives/UserMenu/Default` leaked `"Gentian Hoxha"` (sq/uk/it) — the new agent fixture used an invented name not in the project's proper-noun allowlist (`docs/storybook-governance.md` §14.2 convention: reuse an already-allowlisted Albanian name so no per-story allowlist edit is needed). **Fixed**: renamed the fixture to `"Blerim Hoxha"`, already in `scripts/check-locale-leak.mjs`'s global regex allowlist (`/^(Ana\|Koci\|Blerim\|Hoxha\|Flutura\|Lleshi)$/i` and the full-name variant) — verified the fix by replicating the tool's exact allowlist regex against the new value (`true`), not re-running the full ~1h scan a third time. `mantine-primitives-mobilenavdrawer`, `mantine-primitives-table`, and `patterns-mantine-agentstatisticsview` have **zero** findings anywhere in the completed report. Every other finding in the report (Storybook UI chrome strings, `ListingGalleryPattern`, `ListingsPageFrame`, `SaveSearchButton`) is pre-existing and outside this task's changed files. |
| `npm run build` | 0 | `/[locale]/cabinet/statistics` compiled, **re-run post-fix**: 5.52 kB / 475 kB First Load JS |
| `npm run check:file-integrity` | 0 | 42 files clean (re-run post-fix, includes `tableParams.ts` and evidence files) |
| `npm run check:mojibake` | 0 | 0 artifacts / 7143 files |
| `check-surface-census.mjs --surface .../AgentStatisticsView.tsx` | 0 | re-run post-fix: still 18 nodes, tier1 18, tier2/3 0 |
| `check:pattern-enrolment` / `check:story-coverage` | 0 / 0 | re-run post-fix, unchanged |
| AC10 `git grep` (page.tsx, AgentStatisticsView.tsx, `tableParams.ts`, UserMenu.tsx) | 1 (no match = pass) | prints nothing |
| AC5 `cabinet.statistics` block word scan | — | no `lead`/`conversion`/`contact` match |

## Bug found and fixed — server/client module boundary (791-class)

**Found live, first real authenticated request**, after the fix below was not yet in place:

```
⨯ Error: Attempted to call parseAgt10Table() from the server but parseAgt10Table is on the client.
It's not possible to invoke a client function from the server, it can only be rendered as a
Component or passed to props of a Client Component.
    at AgentStatisticsPage (src\app\[locale]\cabinet\statistics\page.tsx:40:32)
 GET /en/cabinet/statistics 500 in 2519ms
```

**Root cause**: `parseAgt10Table`/`serializeAgt10Table`/`AGT10_SORT_TOKENS` were originally defined
and exported from `AgentStatisticsView.tsx`, which is `'use client'`. Every export of a `'use
client'` module becomes a client reference to the RSC bundler; a Server Component may render one as
a `<Component>` or pass it as a prop, but may never *call* it directly as a plain function — which
is exactly what `page.tsx` did at `const table = parseAgt10Table(sp)`. This is the same family of
defect as the 791 lesson (a server/client module-boundary violation), just a different exact string
than the "Functions cannot be passed directly to Client Components" text AC1 names — `git grep`
alone would never have caught this shape, only a real request against the actual boundary would.

Neither `npm run typecheck`, `npm run lint`, `npm run build`, nor `build-storybook` — all green,
both before and after — could have caught this: `/[locale]/cabinet/statistics` is `ƒ` (server-
rendered on demand), never statically generated, so `next build` never actually executes the page
function; Storybook never imports `page.tsx` at all. Only `next dev`/`next start` plus a real
request exercises this exact boundary — this is the concrete case the kickoff's Q4 "live checks
mandatory, not just mocked" requirement exists for.

**Fix**: extracted the pure parse/serialize functions and the sort-token map into a new plain
module, `src/modules/cabinet/statistics/tableParams.ts` (no `'use client'` directive) — importable
by both the Server Component (`page.tsx`) and the Client Component (`AgentStatisticsView.tsx`)
without crossing the boundary either way. `AgentStatisticsView.tsx` now imports from it instead of
defining it. Re-verified: `npm run typecheck` (0), `npm run lint` (0), `npm run build` (0, route
still compiles, 5.52 kB), and the identical live request now returns `200` with the full real
dashboard (see below). This file was not in the kickoff's §7 scope list — added to fix a defect the
kickoff's own required live check surfaced; noted as a deviation.

## Live checks (§10.6) — complete

Performed in three passes against the real live database, `npm run dev` on `localhost:3001`,
Playwright, headless, read-only except where the owner explicitly added test listings (see below).

**Pass 1 — single account** (`HYDRATION_ADMIN` at the time, an agent-role account, "Agrogul", 2
listings):

- **Guest** → `GET /en/cabinet/statistics` → **HTTP 307** →
  `/en/auth/login?next=%2Fen%2Fcabinet%2Fstatistics&session=lost` — matches the negative-flow table
  exactly.
- Real agent session, UserMenu (header, live DOM, not a Storybook fixture):
  `["Profile","Statistics","My listings","Add listing","Logout"]`.
- Real agent session, the page itself → **HTTP 200**, full real render (title, period control,
  AGT-01 all-zero, AGT-02 Visible now = 2, AGT-10 real rows, AGT-05 "no base for comparison").
- Period switch, live: clicking "7 days" → URL becomes `?period=7d&sort=created_desc`; AGT-05 label
  re-renders "Form inquiries · **last 7 days**". Matches AC4.
- Cross-owner URL tampering with synthetic UUIDs in `status`/`page` → **HTTP 200**, unchanged, no
  crash, no leak (params fail validation and fall back to defaults).

**Pass 2 — role matrix**, after the owner added `HYDRATION_MODERATOR`/`HYDRATION_AGENT1`/
`HYDRATION_AGENT2` and reassigned "Agrogul" to `moderator` for this exact purpose:

- **`HYDRATION_ADMIN`** ("Rouse", role `admin`) → `GET /en/cabinet/statistics` → **HTTP 200,
  redirected to `/en/cabinet`**; UserMenu = `["Profile","My listings","Add listing","Dashboard","Logout"]`
  — no Statistics item, has the admin-only Dashboard item.
- **`HYDRATION_MODERATOR`** ("Agrogul", role `moderator`) → same outcome: redirected to
  `/en/cabinet`; identical UserMenu shape, no Statistics item.
- Both exercise the exact same `access.ts` branch a plain `user` account would (`role !== 'agent'`
  is a single undifferentiated check — verified by reading the source, not assumed) — this closes
  AC9's owner-matrix row 8 in substance, though the literal `user`-role account itself was not
  separately tested.
- **`HYDRATION_AGENT1`** ("Roberto") and **`HYDRATION_AGENT2`** ("Rodrigo") → both **HTTP 200**, own
  Statistics menu item, both then had zero listings so both rendered the genuine AGT-10 empty state
  ("You have no listings yet" + "Add listing" CTA — the real production empty path, not a fixture).

**Pass 3 — real two-agent differential proof**, after the owner added one real listing to each of
Agent1 and Agent2 specifically for this check:

- **Agent1 (Roberto)**: AGT-02 Visible now = **1**; AGT-10 shows exactly one row, "Shitet hyrje ap.
  Lagj.12 Kat.3, Korce, Vile trekatëshe" (Active, Visible), Edit link
  `/en/listings/shitet-hyrje-ap-lagj12-kat3-korce-vile-trekateshe-mujs5z82/edit`.
- **Agent2 (Rodrigo)**: AGT-02 Visible now = **1**; AGT-10 shows exactly one row, a **different**
  listing, "Apartment" (Active, Visible), Edit link `/en/listings/apartment-mujs0c4u/edit`.
- **Cross-owner tampering with a real slug**: signed in as **Agent1**, navigated to
  `/en/cabinet/statistics?status=apartment-mujs0c4u&page=apartment-mujs0c4u` (Agent2's real listing
  slug, pasted into both `status` and `page`) → **HTTP 200**, Agent1's dashboard renders completely
  unchanged — still exactly one row, still "Shitet hyrje ap...", Agent2's "Apartment" never appears
  anywhere on the page. This is AC2's literal test, performed with a real second identity's real
  listing id, not a synthetic one.
- Dev-server log across all three passes: **zero** occurrences of either error signature
  (`Functions cannot be passed directly to Client Components` or the pre-fix `parseAgt10Table`
  boundary error) on every request, including every tampering attempt —
  `docs/sessions/evidence/task854/live-agent-session-server.log`,
  `live-full-role-matrix-server.log`, `live-two-agent-isolation-server.log`.

AC2, AC4, and the negative-flow table's guest/admin/moderator rows are now fully live-evidenced.
AC9's remaining content is the owner's own visual read of the matrix (colour, spacing, locale
rendering) — never something Sonnet closes.

## Files Changed

| File | git hash-object |
|---|---|
| `src/app/[locale]/cabinet/statistics/page.tsx` (created; hash post-fix) | `3906c6d142b3b7ad666b4cd7e109a4591ae87351` |
| `src/modules/cabinet/statistics/components/AgentStatisticsView.tsx` (created; hash post-fix) | `00deb6e6e1bb6a5063bee092211388797ec43bc0` |
| `src/modules/cabinet/statistics/tableParams.ts` (created — the server/client boundary fix) | `06113b7ee228c2f461eec8ffb9e58d681642be2a` |
| `src/stories/patterns/mantine/AgentStatisticsView.stories.tsx` (created) | `11b26996ad16bd22219d4418f164e8d412d17863` |
| `src/stories/fixtures/agentStatistics.fixtures.ts` (created) | `5b86bab209c5fb2d5730595ed16c0326b166d450` |
| `src/components/layout/UserMenu.tsx` (edited, R5) | `7e8b63c925fa9bc6fea1c7241e5b9a967e6ec6a6` |
| `src/components/layout/MobileNavDrawer.tsx` (edited, R5) | `93ce5add1fb914d7c1bc09790b2231f957d10544` |
| `src/design-system/mantine/patterns/MantineDataTableToCards.tsx` (edited, R6) | `cdfca58686fa934861f3c45505bbc60fcec4650e` |
| `src/design-system/mantine/theme.ts` (edited — `boxSize.dashboardListingThumb`) | `c4a3550c79988748f430d4e0814c0babf6bfe0cc` |
| `src/stories/mantine/primitives/UserMenu.stories.tsx` (edited; hash post-locale-leak-fix) | `e44062caf2b8858c147fb83d81ba9323cf94d514` |
| `src/stories/mantine/primitives/MobileNavDrawer.stories.tsx` (edited) | `3414710bdf8e3cb854c46a2b7aa4e302d7dca345` |
| `src/stories/mantine/primitives/Table.stories.tsx` (edited) | `32306bbe7d7c55d64cd26e27e0c229a6bbb9b029` |
| `scripts/mantine-migration-scope.json` (edited, +1 entry) | `2beca617e0dcc0ba6a1b6ccc4203f8ca3be54a7c` |
| `messages/en.json` (edited, +44 keys) | `311832b5799d96d3ab6b5c71ac302f99a9de88fc` |
| `messages/sq.json` (edited, +44 keys) | `cef816574da7d61b5ead6ed05c5f4d2c1a2ee866` |
| `messages/uk.json` (edited, +44 keys) | `54786754ea463673a21cb638dbccedc2ad56fbe0` |
| `messages/it.json` (edited, +44 keys) | `69f9e90cd7ec29a7f3fcbe3c54cc345b805fd68d` |
| `docs/backlog.md` (edited, 854 row) | `6605a224f7eee73b98d4456910df68601384643e` |

## Process note

Two research subagents launched read-only (doc-bundle summary, prior-task API reference) deviated
from their briefs mid-session and directly implemented R5, R6, the theme token, and the four i18n
caption keys in this working tree. The parent session inspected every resulting diff line-by-line
before continuing, fixed one introduced defect (a duplicated `boxSize.dashboardListingThumb` union
member in `theme.ts`), and verified the rest against the same source-of-truth reads the parent had
already done independently — nothing here was accepted on the subagent's say-so alone. Filed as
product feedback (`SendFeedback`, `unwanted_scope`) in the same session.

## Assumptions, deviations, limitations

- **AGT-10 sort URL contract** (combined `sort=` token, no `direction` param) — see "Assumption"
  above. Not an owner decision; open for orchestrator/owner confirmation.
- **Not-agent redirect target** `/{locale}/cabinet` — per kickoff §5, an INFERENCE, unchanged.
- **AGT-01 target mapping** — reused 848's `agentCardHref`/`GROUP_BY_TARGET` verbatim, no new
  mapping invented.
- **`tableParams.ts` is a new file not in the kickoff's §7 scope list** — added to fix the
  server/client boundary defect the live check surfaced (see "Bug found and fixed"). Necessary; not
  optional cleanup.
- **The literal `user`-role redirect row was not tested with a plain `user` account** — substituted
  with two non-agent roles (`admin`, `moderator`), which exercise the identical `access.ts` branch
  (`role !== 'agent'`) a `user` account would. Every other live-checkable AC2/AC4 row, including the
  full two-real-agent differential proof, was completed (see "Live checks").
- `check:listing-visibility`'s red is pre-existing (Task 887, filed 2026-09-26 by 853's review),
  unrelated to any file this task touches — confirmed by inspecting the one flagged line
  (`contactEvents.ts:50`), which this task never edited.
- `check:locale-leak:mantine-only` completed (see Validation evidence table) and found one real,
  in-scope leak — an invented fixture name not on the project's proper-noun allowlist — fixed by
  reusing an already-allowlisted name instead. This is a genuine miss this session made and caught
  only because the full gate was run to completion rather than accepted as "known red, skip it."

---

## Revision 1 (2026-09-27) — review 1 remediation (`NEEDS REVISION` → this pass)

Mode: `remediation`. Order followed exactly as §16.7 specified: R11 → R12 → R13 → AC12 live check →
§16.6 → R14 receipts. Every transcript retained under `docs/sessions/evidence/task854/r1/`; the
original `evidence/task854/*` artifacts are superseded, not deleted or overwritten.

### R11 (F1) — a filter matching nothing is not "no listings yet"

`AgentStatisticsView.tsx`: added `filtersActive = Boolean(table.status || table.visibility ||
table.listingType)`. `showAgt10Empty` (the full-card Add-listing-CTA replacement) now requires
`data.agt10.ok && agt10Total === 0 && !filtersActive`. When filters are active and nothing matches,
the filter row and `MantineDataTableToCards` still render, with `rows={[]}` and
`emptyLabel={filtersActive ? t('agt10_filtered_empty') : t('agt10_empty')}` — the pattern's own
existing empty path, no new markup. Pagination stays hidden by the pre-existing `totalPages > 1`
guard (`totalPages` is `Math.max(1, Math.ceil(0/10)) === 1` whenever `total` is 0, filtered or not) —
also backstopped by `MantinePagination`'s own `total <= 0 → null` guard. New key
`cabinet.statistics.agt10_filtered_empty` added to all 4 locales (en: "No listings match these
filters" — no "lead"/"contact"/"conversion", R4).

### R12 (F1) — `Agt10FilteredEmpty` Story (GR-3a EXTEND)

`agentStatistics.fixtures.ts`: new `agentStatisticsAgt10FilteredEmpty(locale)` — same non-zero
AGT-01/02/05 base as `agentStatisticsAllOk` (the agent genuinely has listings), `agt10:
blockOk({rows:[], total:0, page:1, pageSize:10})`. `AgentStatisticsView.stories.tsx`: new export
`Agt10FilteredEmpty` with `table = { status: 'sold', sort: 'created_at', direction: 'desc', page: 1
}`. Derived Storybook id confirmed in `storybook-static/index.json`:
`patterns-mantine-agentstatisticsview--agt-10-filtered-empty`.

**Unplanned finding while wiring this up:** `check:stories` Check 13 (duplicate-family export names)
flagged the export name itself — `Agt10FilteredEmpty` contains the banned segment `Filtered`
(`FAMILY_KEYWORDS = {Proof, Demo, Canonical, Filtered}`, aimed at lazy demo-suffix names). The
kickoff's own R14 names this exact story id, so renaming would contradict §16.4; the gate's own error
message offers a second path ("or add a file-scoped allowlist entry"), and an exact precedent already
exists for this — `AdminListingsTable.stories.tsx`'s `FilteredPending` export, allowlisted with
"Genuine filter-state REAL_MODE ..., not a proof duplicate." Added the matching entry to
`scripts/story-realmode-allowlist.json` (check 13, same reasoning). `check:stories` now passes
(176 files, 0 violations) — see `evidence/task854/r1/09-check-stories.txt` for both the pre-fix
failure and the post-fix pass.

### R13 (N1–N3)

- **N1**: `MobileNavDrawer.tsx`'s `role` JSDoc rewritten — it no longer claims two callers pass no
  role; it names the one real caller, `HeaderView.tsx:194-197`, whose own `user` prop requires `role`
  (`HeaderView.tsx:52`).
- **N2**: added `resolveSortToken(token)` to `tableParams.ts`, using `Object.hasOwn(AGT10_SORT_TOKENS,
  token)` before indexing — never a bare `AGT10_SORT_TOKENS[token]`. Both call sites now go through
  it: `parseAgt10Table` (the URL-read path) and the sort `Select`'s `onChange` in
  `AgentStatisticsView.tsx`. Proven by `tableParams.test.ts` (new, AC13) with `?sort=constructor` and
  `?sort=__proto__`.
- **N3**: added `formatDateOnly(dateStr, locale)` to `formatters.ts` — splits `'YYYY-MM-DD'` and
  calls the existing (module-private) `composeDateParts` directly; validates the date is real via
  `Date.UTC` + UTC getters (never `new Date('YYYY-MM-DD')` read back through a LOCAL getter, which is
  the exact bug this function exists to avoid). Returns `'—'` on malformed input. New key
  `cabinet.statistics.agt05_period_range` = `"{from} – {to}"` in all 4 locales.
  `AgentStatisticsView.tsx` now branches: `period.kind === 'custom'` →
  `t('agt05_period_range', {from: formatDateOnly(period.from, locale), to: formatDateOnly(period.to,
  locale)})`; `'7d'`/`'30d'` unchanged (`agt05_period_days`).

### AC11 — Story DOM assertions (Playwright against `storybook-static`)

```
patterns-mantine-agentstatisticsview--agt-10-filtered-empty:
  ariaLabels: ["Status","Visibility","Offer type","Sort by"]
  hasFilteredEmptyText: true   hasGenuinelyEmptyText: false   hasAddListingLink: false

patterns-mantine-agentstatisticsview--agt-10-empty:
  ariaLabels: []               hasFilteredEmptyText: false  hasGenuinelyEmptyText: true  hasAddListingLink: true
```

Exactly the AC11 contract: filtered-empty keeps the 4 filter controls and the new text, with neither
the genuinely-empty text nor the CTA link; the genuinely-empty state is the exact reverse.

### AC12 — live check, `HYDRATION_AGENT1`

```
GET /en/cabinet/statistics?status=sold -> 200
  AGT-10 card: filter row present (aria-labels Status/Visibility/Offer type/Sort by all present)
             + "No listings match these filters"; no CTA, no "You have no listings yet".
Clicked "All statuses" in the Status select ->
GET /en/cabinet/statistics?period=30d&sort=created_desc -> 200 (no status= param)
  AGT-10 card: one row, "Shitet hyrje ap. Lagj.12 Kat.3, Korce, Vile trekatëshe" — Active, Visible,
  10/27/2026 (in 30 days), 0 form inquiries, Edit.
```

Server log (`evidence/task854/r1/live-filtered-empty-server.log`): zero occurrences of `Functions
cannot be passed directly to Client Components` or `Attempted to call` across every request in this
pass, including the AC13 custom-period request below.

### AC13 — unit tests + live custom-period label

`tableParams.test.ts` (new): `resolveSortToken('constructor')` and `resolveSortToken('__proto__')`
both return `{ sort: 'created_at', direction: 'desc' }` (the default), never an inherited
`Object.prototype` member; `parseAgt10Table(new URLSearchParams('sort=constructor'))` and
`…('sort=__proto__')` likewise. 10 tests, all passing (see `04-test-cabinet-statistics.txt` — 59
total across the 4 files in that directory, up from 49).

`formatDateOnly` cases in `formatters.test.ts`: `'2026-08-01'` → `08/01/2026` (en) / `01.08.2026`
(sq/uk) / `01/08/2026` (it); a malformed string and an impossible calendar date (`'2026-02-30'`) both
return `'—'`; a `TZ=America/New_York` case proves the day never shifts. 53 tests, all passing (up
from 46 pre-revision).

Live custom-period label, signed in as `HYDRATION_AGENT1`:

```
GET /en/cabinet/statistics?period=custom&from=2026-08-01&to=2026-08-12 -> 200
AGT-05 label: "Form inquiries · 08/01/2026 – 08/12/2026"
```

Not "last 12 days" — the exact defect N3 fixed, proven live, not just in the Story.

### R14 (F2, F3) — one full §16.6 pass + GR-3b/GR-3c receipts

All 26 §16.6 commands run as one pass, each teed to `docs/sessions/evidence/task854/r1/NN-*.txt`
with its exit code appended (unpiped — the exit-code-capture lesson from Task 709/810).

| Command | Exit | Notes |
|---|---|---|
| platform line | — | `win32 v22.22.3` |
| `typecheck` | 0 | clean |
| `lint` | 0 | 0 errors |
| `check:i18n` | 0 | 2459 keys, 4/4 locales (was 2457 pre-revision, +2 new keys) |
| `test -- .../cabinet/statistics/__tests__` | 0 | 4 files, 59 passed (was 49) |
| `test -- .../formatters.test.ts` | 0 | 53 passed (was 46) |
| `test -- .../AdminUsersTable.smoke.test.tsx` | 0 | 21/21 |
| `vitest run .../visibility.test.ts` | 0 | 66/66 |
| `check:listing-visibility` | **1** | pre-existing, `contactEvents.ts:50` only (Task 887) — no 854 file named |
| `check:stories` | 0\* | \*failed once on the `Agt10FilteredEmpty` name (see R12); 0 after the allowlist entry |
| `check:story-coverage` | 0 | 109/109 |
| `check:pattern-enrolment` | 0 | 52 pattern files, 109 manifest entries |
| `check:design-tokens:strict` | 0 | 0 violations |
| `check:enrolled-tailwind` | 0 | 2 pre-existing baselined findings, unrelated |
| `check:rendered-scope` | 0 | 0 new edges |
| `check-surface-census-changed --base HEAD` | 0 | clean |
| `check-surface-census --surface AgentStatisticsView.tsx` | 0 | 18 nodes, tier1 18, tier2/3 0 |
| `check-surface-census --surface UserMenu.tsx` | 0 | 3 nodes, tier1 3, tier2/3 0 |
| `check-surface-census --surface MobileNavDrawer.tsx` | 0 | 3 nodes, tier1 3, tier2/3 0 (new in this block) |
| `build-storybook` | 0 | includes the new `Agt10FilteredEmpty` story |
| `check:locale-leak:mantine-only` | **1** (expected — known red, Task 836) | Full run completed: 252 stories × sq/uk/it × 3 viewports, **547 leak(s) found** overall (report: `.screenshots/locale-leak/2026-09-27T12-38/report.json`, transcript `r1/check-locale-leak.txt`). **Zero** of them name any of this task's four story families — `git grep -n "Story: Patterns/Mantine/AgentStatisticsView\|Story: Mantine/Primitives/UserMenu\|Story: Mantine/Primitives/MobileNavDrawer\|Story: Mantine/Primitives/Table" r1/check-locale-leak.txt` (full file, not head/tail) returns no match. Every one of the 547 is pre-existing and unrelated (`AuthSheet`, `DashboardWorkList`, `ListingCardTrack`, `ListingDetailView`, and Storybook UI chrome strings). |
| `build` | 0 | `/[locale]/cabinet/statistics` 5.62 kB / 476 kB |
| `check:file-integrity` | 0 | 73 files clean |
| `check:mojibake` | 0 | 0 artifacts / 7197 files |
| AC10 `git grep` (4 files, now incl. `tableParams.ts`) | 1 (no match) | prints nothing |
| `git diff --stat` | 0 | 15 files, 433 insertions / 67 deletions |
| `git hash-object` (17 files) | 0 | see updated Files Changed table below |

#### GR-3b — live measurement, all 7 changed Story exports (320/390/1024/1440)

Root element width equalled the viewport width, with zero horizontal overflow, at every width for
every one of the 7 exports:

`patterns-mantine-agentstatisticsview--default`, `--agt-10-empty`, `--agt-10-filtered-empty`,
`--many-listings`, `mantine-primitives-usermenu--default`, `mantine-primitives-mobilenavdrawer--agent`,
`mantine-primitives-table--cards-below-md`.

`GR-3b STORY RESPONSIVE CHECK — <each of the 7 ids above>: 320 <w>/<w> · 390 <w>/<w> · 1024 <w>/<w> ·
1440 <w>/<w>; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins:
NONE.` Full readings: `docs/sessions/evidence/task854/r1/gr3b-gr3c-measurements.txt`.

`--many-listings` pagination-vs-card reading (§13.3 #5, for the owner): 320px — pagination 148px
inside a 288px card; 390px — pagination 148px inside a 358px card. No overflow at either width.

#### GR-3c — live measurement, all 7 changed Story exports (320/390/768/1440)

`patterns-mantine-agentstatisticsview--*` (all 4 states): page title "My dashboard"
(`MantineDashboardHeader`'s `fz={{base:'h5',sm:'h4'}}`) 20px at 320/390, 24px at 768/1440; card
titles "Needs my action"/"Results by listing" (`MantineDashboardCard`'s fixed `size="h5"`) 20px at
every width. **The StatCard value this revision's F3 named** — AGT-02's/AGT-05's numeric value,
`MantineDashboardStatCard.tsx:142`'s `fz={{base:'h5', sm:'h4', md:'h3'}}` — measured at 20px at
320/390 (h5) and 30px at 768/1440 (h3, ≥768 = `md`), matching the theme's own `h5`/`h3` sizes exactly
— a real responsive step, not a static ≥24px literal.

`mantine-primitives-usermenu--default`: no heading; largest visible text "Alba Krasniqi" at 14px,
constant across all 4 widths. `mantine-primitives-mobilenavdrawer--agent`: no heading; largest
visible text (the caption) at 12px. `mantine-primitives-table--cards-below-md`: no heading; largest
visible text 16px (avatar initials, mobile) / 14px (name, desktop).

`GR-3c TYPE RESPONSIVE CHECK — <each of the 7 ids>: page title (where present) 320 <px> · 390 <px> ·
768 <px> · 1440 <px>; StatCard value (where present) 320 20px · 390 20px · 768 30px · 1440 30px; ≥24px
text without a responsive step: NONE; heading above 20px below 640 (non-hero): NONE; child heading
larger than page title: NONE.` Full readings, per export:
`docs/sessions/evidence/task854/r1/gr3b-gr3c-measurements.txt`.

Both F3 gaps are closed: all 7 changed exports now carry receipts (not just `--default`), and the
StatCard value — the only text on the page reaching 24px or more — is explicitly named and measured.

### AC14

Every §16.6 command exits as §16.6's own "Expected results" state (the one non-obvious exception,
`check:stories`, is documented above as fixed within this same pass, not left red). 7 GR-3b and 7
GR-3c receipts recorded, no listed violation in either.

### Files Changed — updated (revision 1 additions/changes only; unchanged files keep their original hash above)

| File | git hash-object |
|---|---|
| `src/modules/cabinet/statistics/components/AgentStatisticsView.tsx` (R11, R13 N2/N3) | `5977b6e618fd7cf1472b43645ad9963b3b95b67e` |
| `src/modules/cabinet/statistics/tableParams.ts` (R13 N2 — `resolveSortToken`) | `e048b83aef32e456d0596c84fd6e15b06274de45` |
| `src/modules/cabinet/statistics/__tests__/tableParams.test.ts` (new, AC13) | see `r1/25-hash-object.txt` |
| `src/components/layout/MobileNavDrawer.tsx` (R13 N1, JSDoc only) | `13cfbf619731860c8c69e1d18cebcac7d574fda6` |
| `src/lib/formatters.ts` (R13 N3 — `formatDateOnly`) | `9b375fa0949d1b6611127c4f101cb65080856613` |
| `src/lib/__tests__/formatters.test.ts` (R13 N3 tests) | see `r1/25-hash-object.txt` |
| `src/stories/patterns/mantine/AgentStatisticsView.stories.tsx` (R12 — `Agt10FilteredEmpty`) | `6f6ed3fc22126d1e3b1f15942e10194ab7e94668` |
| `src/stories/fixtures/agentStatistics.fixtures.ts` (R12 — new fixture) | `0c2953cc2552379c8b2f1e979eb420284c4a7db4` |
| `src/stories/mantine/primitives/UserMenu.stories.tsx` (unchanged this revision) | `e44062caf2b8858c147fb83d81ba9323cf94d514` |
| `scripts/story-realmode-allowlist.json` (R12 — Check 13 entry) | see `r1/25-hash-object.txt` |
| `messages/{en,sq,uk,it}.json` (+2 keys each: `agt10_filtered_empty`, `agt05_period_range`) | see `r1/25-hash-object.txt` |

Unchanged in this revision (hashes identical to the original table above): `page.tsx`, `UserMenu.tsx`,
`MantineDataTableToCards.tsx`, `theme.ts`, `MobileNavDrawer.stories.tsx`, `Table.stories.tsx`,
`scripts/mantine-migration-scope.json`.

### Assumptions, deviations, limitations — revision 1

- `check:stories` Check 13's naming rule and the kickoff's own specified export name conflicted; the
  gate's own second offered remedy (a file-scoped allowlist entry, with an exact same-shape
  precedent already in the codebase) was used rather than deviating from the kickoff's R12 wording.
- `scripts/story-realmode-allowlist.json` and `src/modules/cabinet/statistics/__tests__/
  tableParams.test.ts` are new files not named in the kickoff's §7 scope list — both are direct,
  necessary consequences of R12/R13/AC13, not scope creep.
- The plain `user`-role live redirect row remains untested with a literal `user` account (unchanged
  from the original pass) — `admin`/`moderator` continue to stand in for the identical `access.ts`
  code path.

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.** No self-approval, no mutating git command
issued.
