# Task 857 — `/admin/listings` honours `visibility=visible` and moves to canonical Mantine

**Sprint 78** (Wave E — landings) · **P2** · QA profile **Q4** (legacy surface → Mantine on the registered critical flow
"Listing public visibility invariant") · **depends on 893** (hard: `RangeDatePicker` `selectionMode="single"`) · runs
**after 886** (886 edits `AdminPageShell`, which this task deletes) · owner action **O78-12** · **Status: 📝
`KICKOFF FILED` 2026-09-29**

Sprint plan: [`Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md)
("Execution order" item 6: 858, then 857 · 859). Precedents, read-only: **877** (container/View split, `AdminTable`
adapter, page wrapper), **893** (shared legacy files stop being imported; logic extracted to a hook), **896**
(`adminPageShellMaxWidth`).

Executor: run this file through `execute-task`. Strongest status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No Git.

## 1. Mode and task type

`IMPLEMENTATION`, UI migration + a public-visibility filter. Bundles: **UI / Layout / Component (current Mantine
path)**, **Storybook / Visual Proof**, **Component Catalog / Coverage**, **Regression / Critical Flow Coverage**,
**Admin Table / Admin Control**, **Data access** (one query predicate through the canonical helper).

- **Why the whole surface migrates.** Adding the "visible" filter changes the manager's visible filter state; clause 16d
  then puts every component the route renders in scope.
- **Shared legacy files (tier-2 treatment, 893 precedent).** `AdminInput` (6 other consumers) and `AdminSearchInput`
  (`AdminPropertyTypesManager`) are **not** edited visually; the listings surface stops importing them. `Combobox`
  likewise. `AdminPageShell` has **no other consumer** (§3.3) and is deleted with its legacy Story.

## 2. Objective

1. `/admin/listings?visibility=visible` lists only publicly visible listings through `applyPublicVisibility`; the ADM-08
   card and ADM-11's `visible` segment (`visibleListingsHref()`, `src/modules/admin/dashboard/hrefs.ts:46-49`) land
   filtered, and the filter bar shows the state and can clear it.
2. Tabs, search, status filter, hidden-eligible filter and audit panel, pagination, the preview dialog (status actions,
   links, premium, delete) and the premium dialog behave as today (§3.4), on canonical Mantine.
3. The census shows only the root `page.tsx` and the container-exempt containers.

## 3. Verified context — measured 2026-09-29 (re-measure at I0)

### 3.1 GR-1 census — `node.exe scripts\check-surface-census.mjs --surface src\app\admin\listings\page.tsx`

| Node | Tier | Manifest | Own Story | `className` | `ui/*` | Disposition |
|---|---|---|---|---|---|---|
| `src/app/admin/listings/page.tsx` (hash `fd481776…`) | 1 (root) | no | no | 0 | 0 | `visible` predicate (R1), wrapper + header (R8) |
| `src/components/admin/AdminListingsTable.tsx` (759 lines, hash `ec314da0…`) | 1 | no | legacy `Admin/AdminListingsTable` | 93 | 8 | containers + Views (R2–R6) |
| `src/components/admin/AdminPageShell.tsx` (65 lines) | 1 | no | legacy `Admin/AdminPageShell` | 10 | 1 | **deleted** with its Story (R10) |
| `src/components/admin/AdminSearchInput.tsx` (59 lines) | 1 | no | no | 3 | 1 | logic → hook (R7); file stays for `AdminPropertyTypesManager`; import removed here |
| `src/components/admin/AdminInput.tsx` | 1 | no | no | 1 | 1 | import removed (premium date → `RangeDatePicker` single) |
| `src/components/shared/Combobox.tsx` | 1 | no | no | 21 | 0 | import removed (`MantineSelect`) |
| `AdminTable`, `RelativeTime`, `MantineDataTableToCards`, `MantineTooltip`, `responsiveBottomSheet` | 1 | yes | yes | — | 0 | reused |
| `ui/button`, `dialog`, `label`, `badge`, `input` | 2 | — | — | — | — | imports removed |

**Calibration (FACT, `/admin/currency` after 877):** the census prints FAIL for the root `page.tsx` and for every pure
container. Expected after: `page.tsx`, `AdminListingsTable.tsx`, `ListingPreviewDialog.tsx`, `PremiumDialog.tsx` (all
containers `className:0 ui-imports:0`).

### 3.2 The filter today — `page.tsx`, read in full

`visibility` and `reason` are read (`:23-24`); only `visibility === 'hidden_eligible'` changes the query
(`applyPublicEligibleButHidden`, `:87-89`); an unknown value such as `visible` is silently ignored. The audit panel runs
three head counts (`:92-110`). The manager renders a single toggle button for `hidden_eligible`
(`AdminListingsTable.tsx:596-610`) and the audit links (`:661-703`). FACT.

`applyPublicVisibility` (`src/modules/listings/lib/visibility.ts:99`) is the canonical predicate (`status='active'` and a
future or null `expires_at`), consumed by every public list read (registry "Listing public visibility invariant",
`docs/critical-flow-registry.md:70`). FACT.

### 3.3 Consumers of the shared files (FACT, grep of imports over `src`, stories excluded)

| File | Other consumers | Consequence |
|---|---|---|
| `AdminPageShell.tsx` | none | deleted (R10) |
| `AdminSearchInput.tsx` | `AdminPropertyTypesManager.tsx:11` | stays; its logic moves to a hook it consumes (R7), JSX byte-identical |
| `AdminInput.tsx` | `AdminLegalManager`, `AdminLocationsManager`, `AdminPagesManager`, `AdminSettings`, `AdminUserCreate` | untouched |
| `Combobox.tsx` | 9 other files | untouched |

### 3.4 Current behaviour to preserve — `AdminListingsTable.tsx`

| Area | Today | Line |
|---|---|---|
| URL navigation | `navigate(updates)` merges into the current params and `router.push`es; the visibility helper resets `page` | `:461-473` |
| Tabs | `all` / `premium` (premium → `tab=premium`, resets `page` and `status`) | `:566-579` |
| Search | `AdminSearchInput`: controlled, 300 ms debounce, writes `q`, drops `page`, resyncs from the URL only when no debounce is pending | `AdminSearchInput.tsx:18-45` |
| Status filter | select of `''` + 7 statuses (`cabinet.filter_ALL`, `getListingStatusLabel`) → `status`, resets `page` | `:454-457`, `:588-595` |
| Hidden-eligible toggle | on → `visibility=hidden_eligible`; again → cleared | `:596-610` |
| Audit panel | total 0 → `audit_hidden_zero`; else links total / expired / no-expiry → `visibility=hidden_eligible[&reason=…]`; the active one highlighted | `:661-703` |
| Columns | ID copy (from `xl`, `#public_id` or 8 chars, copied check 1.5 s); listing title button (premium star) opens preview; type · property type (from `md`); price; status badge; visibility badge (`formatVisibility`: visible, or the hidden reason label); agent (from `lg`); date (from `xl`); sticky column = listing | `:475-561`, `:709` |
| Cards (< 640) | title with star; price + status + visibility badges; type · property · agent; chevron | `:713-742` |
| Archived rows | `grayscale opacity-70` via `rowClassName` | `:710` |
| Pagination | prev / `page / total` / next when more than one page | `:745-755` |
| Preview dialog | title (star when premium); status, visibility, type, price, agent, date; status actions from `getStatusActionsForStatus` (engine labels, `btn_set_status {status}` fallback, spinner on the clicked one, all disabled while changing); inline delete confirm replaces the actions; footer links View (`/admin/listings/<id>/preview`), Open public (hidden when `isListingHidden`), Edit (new tab), Premium set/change, Delete | `:242-429` |
| Premium dialog | 4 presets (1/3/6/12 months → `until = now + days`), custom date (today or later) + OK, remove when premium; error keys `premium_error_<e>` (`db_missing_column` → `premium_error_db_schema`); success toasts; `onDone` → `router.refresh()` | `:116-238`, `:618-627` |
| Results | delete → `delete_success`, row removed, refresh; status change → `status_update_success`/`_error`, row + dialog patched, refresh | `:269-287`, `:638-651` |
| Root | `data-testid="admin-listings-table"` | `:616` |

### 3.5 Tests and registrations that name the current files (FACT)

- `src/modules/listings/lib/__tests__/visibility.test.ts:359-403` reads `AdminListingsTable.tsx` **by path** and asserts it
  imports and calls `formatVisibility` and holds no inline predicate (Task 456, critical-flow proof).
- `scripts/check-stories-rendered.mjs:161` — `admin-adminlistingstable--default`, anchor `admin-listings-table`.
- Legacy Stories: `src/components/admin/AdminListingsTable.stories.tsx` (`Admin/AdminListingsTable`: `Default`,
  `FilteredPending`, `LocaleStress`, `Visibility`, `VisibilityAuditZero`, `PreviewDialogSoldStatusActions`) and
  `src/components/admin/AdminPageShell.stories.tsx` (`Admin/AdminPageShell`).
- `scripts/check-listing-visibility.mjs` scans `page.tsx` (a new inline literal there would fail it).

### 3.6 Canonical sources inspected (FACT)

| Need | Candidate | Fit |
|---|---|---|
| Tabs, search, segmented filter, pagination on an admin list | `AdminUsersTable.tsx` (Mantine `Tabs`, `TextInput`, `SegmentedControl` in `ScrollArea`, pagination) | the sibling precedent to follow |
| List / cards | `AdminTable` adapter (`onRowClick`, `visibility`, `cardRow`, `stickyColumnIndex`) | reuse |
| Status colour | `LISTING_STATUS_COLOR` (`src/modules/listings/lib/listingStatusTone.ts`, Task 844) | reuse |
| ID copy | `MantineCopyIdButton` (`id`, `label`, `copyLabel`, `copiedLabel`), Story `Mantine/Primitives/CopyIdButton`; call site to copy labels from: `ListingCard.tsx:190-200` | reuse |
| Status select | `MantineSelect` | reuse |
| Dialogs | `MantineModal` | reuse |
| Premium date | `RangeDatePicker selectionMode="single"` (893 R2) with `minDate` / `disablePastDates` (props exist, `RangeDatePicker.tsx:57-74`) | reuse |
| Pagination | `MantinePagination` (Story `Mantine/Primitives/Pagination`) | reuse |
| Header + width | `AdminPageHeader`; `adminPageShellMaxWidth` (896 R5; `.container-admin` caps at 112rem) | reuse / extend-if-absent |

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | reserved row; §3.2 | `page.tsx`: `visibility === 'visible'` → `query = applyPublicVisibility(query)` (import from `@/modules/listings/lib/visibility`); `hidden_eligible` unchanged; any other value ignored. No inline status/expiry literal is added (the gate scans this file). | P0 | T1, AC7 | Confirmed |
| **R2** | component-rules P0 | `AdminListingsTable` (container) keeps its `Props`, `items`/dialog state, `navigate`, `navigateVisibility`, `STATUS_LABEL`, the resync effect and every `onDeleted`/`onPremium`/`onStatusChanged` handler; renders only `AdminListingsView`, and when open `ListingPreviewDialog` / `PremiumDialog`. 0 `className`, 0 `ui/*`. | P1 | AC1 | Confirmed |
| **R3** | component-rules P0 | `src/components/admin/ListingPreviewDialog.tsx` and `PremiumDialog.tsx` (containers, extracted from `:242-287` and `:116-169`): state, server-action calls and toasts unchanged; each renders only its View. | P1 | T4–T7 | Confirmed |
| **R4** | §3.4; GR-0 | `src/components/admin/AdminListingsView.tsx` (presentational; `useTranslations`, `useLocale`, `usePropertyTypes` read-only). Root `Stack gap="md"` `data-testid="admin-listings-table"`. Filter bar, in order: `Tabs` all/premium (as `AdminUsersTable`); a `Group` (`wrap`, stacked below 640) with a search `TextInput` (`leftSection` `Search`, `iconSize.standard`, value/onChange from the R7 hook), `MantineSelect` status (`cabinet.filter_ALL` + 7 labels), and a `SegmentedControl` visibility in a horizontal `ScrollArea` with data `''` → `cabinet.filter_ALL`, `'visible'` → `visibility_visible`, `'hidden_eligible'` → `visibility_filter_hidden_eligible`, `aria-label` `visibility_label`. Audit panel: `Paper withBorder radius="lg" p="sm"`; zero → `Text size="sm" c="dimmed"` `audit_hidden_zero`; else three `UnstyledButton`s (`mih={{ base: theme.other.touchTarget, sm: 'auto' }}` — `touchTarget: '2.75rem'` is defined at `theme.ts:694`; `c="brand"` when active, `fw={500}`) separated by a `·` from `sm`. List through `AdminTable` with §3.4's columns: ID = `MantineCopyIdButton`; title = `UnstyledButton` with the premium `Star` (`c="var(--badge-premium)"` — defined at `src/app/globals.css:483` and `:592`, the token `MantineListingCardPattern.module.css:58` already consumes) and `Text lineClamp={1}`; status `Badge variant="light" color={LISTING_STATUS_COLOR[s]}`; visibility `Badge variant="light"` `green` or `red` with the `formatVisibility` label; `cardRow` per §3.4. Pagination: `MantinePagination` (`total=totalPages`, `value=page`, `onChange` → `navigate({ page })`), rendered only when `totalPages > 1`. **Archived rows are no longer dimmed** (the legacy `grayscale opacity-70` has no token; the gray status badge carries the state — §9, owner matrix). | P1 | AC2 | Confirmed |
| **R5** | §3.4 | `src/components/admin/ListingPreviewDialogView.tsx`: `MantineModal` (title `Group` with the premium star and `Text lineClamp={2}`), a `SimpleGrid cols={2}` of label/value pairs, the status-action `Group` (`Button variant="outline" size="xs"`, colour per the engine action: approve/publish/restore/renew `green`, reject/expire `yellow`, mark sold `blueLight`, mark rented `purple`, archive and the fallback `gray`; `loading` on the clicked one), the inline delete confirm (`Stack` replacing the actions), and the footer `Group` (full-width buttons below 640): `Button component={Link}` View, Open public (hidden when hidden), Edit (`target="_blank"`), Premium (`variant="outline"`, `c="var(--badge-premium)"`, `leftSection` `Star`), Delete (`variant="outline" color="red"`). | P1 | AC2 | Confirmed |
| **R6** | §3.4 | `src/components/admin/PremiumDialogView.tsx`: `MantineModal` (title `premium_dialog_title`, description = listing title `lineClamp={2}`); `premium_quick_label` + `SimpleGrid cols={2}` of four `Button variant="outline"` (`c="var(--badge-premium)"`); `premium_custom_date` + `RangeDatePicker selectionMode="single" disablePastDates` + OK `Button` (`loading`, disabled without a date); remove `Button variant="subtle" color="red"` when premium. The container converts the picked `YYYY-MM-DD` to the same ISO `until` as today. | P1 | T6 | Confirmed |
| **R7** | §3.3; 893 R3a precedent | `src/components/admin/useAdminSearchQuery.ts` (new): the state, debounce, URL write and resync of `AdminSearchInput.tsx:18-45` move into a hook returning `{ value, onChange }`; `AdminSearchInput.tsx` consumes it with its JSX byte-identical; the listings container passes the hook's pair to the View. | P1 | AC3, T3 | Confirmed |
| **R8** | 877/896 precedent | `page.tsx` returns `<Box p={{ base: 'xl', lg: '2xl' }} maw={layout.adminPageShellMaxWidth} mx="auto">` with `<AdminPageHeader title={t('listings_title')} subtitle={t('listings_total', { count: total })} />` and the manager (`pageTitle` prop dropped or ignored). If `adminPageShellMaxWidth` is absent (896 not landed), add it exactly as 896 R5 defines it. | P2 | AC4 | Confirmed |
| **R9** | GR-3, GR-3a, GR-3d, 16c | Stories under `src/stories/patterns/mantine/`, `skipCanvas: true`, page exports in `StoryPageGutter`: `Patterns/Mantine/AdminListingsView` — `Default`, `PremiumTab`, `FilteredPending`, `VisibleFilter`, `HiddenEligible` (audit counts, `reason=expired` active), `AuditZero`, `Empty`, `Paginated`; `Patterns/Mantine/ListingPreviewDialogView` — `Active`, `SoldStatusActions`, `Hidden` (no public link), `DeleteConfirm`, `ChangingStatus`; `Patterns/Mantine/PremiumDialogView` — `NotPremium`, `Premium`, `Saving`. Fixtures from the legacy Story; Views enrolled. The two legacy Stories are deleted. | P1 | AC5 | Confirmed |
| **R10** | clause 9 | Delete `AdminPageShell.tsx` and `AdminPageShell.stories.tsx`; `check-stories-rendered.mjs:161` → `patterns-mantine-adminlistingsview--default` (same anchor); any `admin-adminpageshell` entry removed; `scripts/story-realmode-allowlist.json:13` (`AdminListingsTable.stories.tsx` / `FilteredPending`) and `scripts/responsive-screenshots.mjs:126` (`admin-adminlistingstable--preview-dialog-sold-status-actions`) retargeted to the new Story ids (`FilteredPending`, `patterns-mantine-listingpreviewdialogview--sold-status-actions`) or removed with the reason in the session log; `visibility.test.ts:359-403` reads the file that now calls `formatVisibility` (`AdminListingsView.tsx`; if the container also calls it, both) and keeps its three assertions; `git grep --untracked -n "AdminPageShell\|admin-adminlistingstable\|admin-adminpageshell"` prints nothing outside history paths. | P1 | AC6 | Confirmed |
| **R11** | Q4; clause 15 | `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx` (new; harness as `AdminUsersTable.smoke.test.tsx`, `next/navigation`, `@/modules/admin/actions`, `@/lib/toast` mocked): **T1** a `page.tsx` query-builder unit (export a pure `applyAdminListingsVisibility(query, visibility, reason)` from a new `src/app/admin/listings/visibilityFilter.ts` and call it from `page.tsx`) — `'visible'` calls `applyPublicVisibility`'s `eq('status','active')` + expiry chain on a capture mock, `'hidden_eligible'` the other helper, `'bogus'` nothing; **T2** choosing `visible` in the segmented control pushes `visibility=visible&page=1` and keeps `q`; **T3** typing in search pushes `q` after the debounce (fake timers) and drops `page`; **T4** a status action calls `updateListingStatus(id, to)` and patches the row's badge; **T5** delete confirm → `deleteListing(id)`, row removed; cancel → no call; **T6** premium preset "1 month" calls `setListingPremium(id, true, <ISO ≈ now+30d>)`; `db_missing_column` → `premium_error_db_schema` toast; **T7** Open public is absent for a hidden listing. | P0 | AC7 | Confirmed |
| **R12** | GR-1 | FAIL lines after = §3.1 calibration; the three Views `manifest:yes story:yes`; no `AdminPageShell`, `AdminSearchInput`, `AdminInput`, `Combobox` or `ui/*` node; baseline regenerated; removed keys only from this surface; no key added. | P0 | AC8 | Confirmed |

## 5. Assumptions and open questions

1. **893 is a precondition** (`RangeDatePicker` single mode). Otherwise `PREMISE DRIFT — 893`.
2. **886 before 857.** If 886 has not landed, `AdminPageShell` is still deleted here; 886's own kickoff then loses that
   row — report it as `CROSS-TASK NOTE — 886` in the session log.
3. Visual changes (O78-12): archived rows not dimmed; page title 20→24px responsive (was a static 24px `h1`); the
   hidden-eligible toggle becomes one segment of a three-way control; dialogs on `MantineModal`; the native date input
   becomes the canonical picker (Apply/Confirm).
4. Open owner questions: none.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` 1, 3–7, 9–16d · `docs/rule-index.md` → the §1 bundles ·
`docs/data-access-rules.md` · `docs/critical-flow-registry.md:70` · `docs/mantine-responsive-design-system.md` ·
`docs/tailadmin-style-reference.md` §6b · `docs/component-rules.md` · `docs/qa-profiles.md` Q4 · the executed 877 and 893
kickoffs and the 896 kickoff, read-only · `docs/orchestrator-procedures.md` → 818/819 corollary.

## 7. Scope — the exact allowed write set

1. `src/app/admin/listings/page.tsx`; new `src/app/admin/listings/visibilityFilter.ts`
2. `src/components/admin/AdminListingsTable.tsx`; new `ListingPreviewDialog.tsx`, `PremiumDialog.tsx`, `AdminListingsView.tsx`,
   `ListingPreviewDialogView.tsx`, `PremiumDialogView.tsx`, `useAdminSearchQuery.ts` (all `src/components/admin/`)
3. `src/components/admin/AdminSearchInput.tsx` (R7 only: logic out, JSX byte-identical)
4. deleted `src/components/admin/AdminPageShell.tsx`, `AdminPageShell.stories.tsx`, `AdminListingsTable.stories.tsx`
5. new Stories `src/stories/patterns/mantine/AdminListingsView.stories.tsx`, `ListingPreviewDialogView.stories.tsx`, `PremiumDialogView.stories.tsx`
6. new `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx`; `src/modules/listings/lib/__tests__/visibility.test.ts` (path constant only)
7. `src/design-system/mantine/theme.ts` — only if R8's token is absent
8. `scripts/mantine-migration-scope.json`, `scripts/surface-census-baseline.json`, `scripts/check-stories-rendered.mjs`,
   `scripts/story-realmode-allowlist.json`, `scripts/responsive-screenshots.mjs`, and `scripts/story-coverage-exempt.json` /
   `scripts/i18n-dynamic-manifest.json` if they name the moved files; catalog files if required
9. `docs/critical-flow-registry.md` row `:70` — append *"Task 857: `/admin/listings?visibility=visible` through `applyPublicVisibility` (T1); the Task 456 static proof now reads `AdminListingsView.tsx`."*
10. `docs/sessions/<date>-task857-admin-listings-mantine.md`, `docs/sessions/evidence/task857/*`; `docs/backlog.md` 857 cell

## 8. Out of scope

- `src/modules/admin/actions/**`, the transition engine, `visibility.ts`, the database.
- `AdminInput`, `Combobox`, `AdminPropertyTypesManager` (still renders `AdminSearchInput`).
- `/admin/listings/[id]/preview` (a separate route).

## 9. Current and required behavior

| Area | Current | Required after |
|---|---|---|
| `visibility=visible` | ignored | public-visible only; segment selected |
| All other filters, dialogs, actions, toasts, pagination | §3.4 | **unchanged** (T2–T7) |
| Archived rows | dimmed | not dimmed; gray badge (**changed**) |
| Title | static 24px | 20px below 640, 24px from 640 (**changed**, GR-3c) |
| Premium custom date | native date input | canonical single-date picker (**changed**) |
| Shell | `AdminPageShell` (`container-admin`) | Mantine `Box` + `AdminPageHeader` |

## 10. Implementation requirements

### 10.1 I0

1. `win32` platform line; status + hashes → `docs/sessions/evidence/task857/01-*`; a §7 path modified → `BLOCKED — SHARED PATH`.
2. **893 gate:** `selectionMode` in `RangeDatePicker.tsx` and 893 archived; quote both. Else `PREMISE DRIFT — 893`.
3. Census → `02`; re-run §3.3's import grep → `03`. A new `AdminPageShell` consumer stops R10 (`PREMISE DRIFT`).
4. Baselines → `04`: `npx.cmd vitest run src/modules/listings/lib/__tests__/visibility.test.ts` and `npm.cmd run check:listing-visibility`.
5. GR-0 and GR-3a receipts (§15.1).

### 10.2 Order

I0 → R7 hook → R4–R6 Views → R9 Stories → R2–R3 containers → R1 + `visibilityFilter.ts` → R8 → R11 → plants → R10 → R12
→ gates → receipts.

### 10.3 Plants (Node I/O; hash before and after)

| Plant | Edit | Must fail |
|---|---|---|
| **P1** | `visibilityFilter.ts` maps `'visible'` to nothing | T1 |
| **P2** | write an inline `.eq('status', 'active')` into `visibilityFilter.ts` instead of the helper | `check:listing-visibility` exits 1 naming the line |
| **P3** | the segmented control's `onChange` omits `page: '1'` | T2 |
| **P4** | `ListingPreviewDialogView` shows Open public for hidden listings | T7 |
| **P5** | re-add `import { Badge } from '@/components/ui/badge'` in `AdminListingsView` | census exits 1 naming `ui/badge` |

## 11. Positive and negative flows

**Positive flow.** An admin clicks ADM-08 "visible listings" on `/admin`, lands on `/admin/listings?visibility=visible`,
sees only public listings with the "visible" segment selected, searches a title, opens one and marks it sold; the
listing leaves the filtered list after refresh.

| Branch | Applicable? | Expected | Evidence |
|---|---:|---|---|
| Unknown `visibility` | Yes | ignored | T1 |
| `hidden_eligible` + `reason` | Yes | unchanged | T1, `HiddenEligible` Story |
| Status update error | Yes | `status_update_error` toast | code unchanged (R3) |
| Premium errors | Yes | mapped toasts | T6 |
| Delete cancel | Yes | no call | T5 |
| Empty result | Yes | `empty` | `Empty` Story |
| Mobile < 640 | Yes | cards, stacked filters, bottom sheets, ≥ 44px targets | GR-3b receipts |

## 12. Acceptance criteria

- **AC1 [R2, R3]** Given the three containers, then each renders only its View, with 0 `className`/`ui/*`, and the
  handlers of §3.4 are unchanged in the diff.
- **AC2 [R4–R6]** Given the three Views, then none contains `className`, a `ui/*` import or a raw colour/px/rem literal;
  `check:design-tokens` and `check:enrolled-tailwind` exit 0.
- **AC3 [R7]** Given `git diff src/components/admin/AdminSearchInput.tsx`, then its `return (…)` JSX is unchanged and the
  logic lives in the hook.
- **AC4 [R8]** Given `page.tsx`, then the wrapper and header are Mantine/`AdminPageHeader`; the token line is quoted.
- **AC5 [R9]** Given the three Story files, then each imports its View, carries R9's exports without a written gutter or
  viewport pin, and `check:story-coverage` exits 0 with the three Views enrolled.
- **AC6 [R10]** Given the tree, then the three deleted files are gone, `visibility.test.ts` passes with its new path, and
  the R10 grep prints nothing outside history paths.
- **AC7 [R1, R11]** Given T1–T7 and P1–P4, then all tests pass on the final tree and each plant fails as stated and passes
  after restore with equal hashes; `check:listing-visibility` exits as in `04` (0, or only 887's pre-existing line).
- **AC8 [R12]** Given `11-census-after.txt`, then the FAIL lines are exactly the four calibration lines.
- **AC9 [all]** `npm.cmd run build` exits 0; `typecheck`, `lint`, `check:story-coverage`, `check:rendered-scope`,
  `check:surface-census:changed`, `check:i18n`, `check:i18n-dynamic`, `check:file-integrity`, `check:mojibake`,
  `build-storybook` exit 0.

`GR-4 AC AUDIT — 9 criteria; each states an observable property; absolutes: AC3's unchanged JSX (declared R7 deliverable) and AC6's empty grep over live paths (deletion audit, --untracked).`

### 12.1 Type-scale table (GR-3c)

| Element | Role | base | sm | md | lg | Theme key | Provenance |
|---|---|---|---|---|---|---|---|
| `listings_title` | page title | 20px | 24px | 24px | 24px | `MantineDashboardHeader` | 877 adapter |
| Tabs, filters, cells | body | 14px | 14px | 14px | 14px | `sm` | legacy `text-sm` |
| Badges, ID, meta | small | 12px | 12px | 12px | 12px | `xs` / `Badge size="sm"` | legacy `text-xs` |
| Dialog titles | dialog title | — | — | — | — | `MantineModal` | 868 precedent |

### 12.2 Width contract (GR-3b) and gutter (GR-3d)

Parent: the R8 `Box` (cap, fluid). Stories fluid. GR-3d: `Patterns/Mantine/AdminListingsView` — **wrap in this task**;
`ListingPreviewDialogView`, `PremiumDialogView` — **n/a: overlay-only**; `Patterns/Mantine/AdminPageHeader`,
`Patterns/Mantine/AdminTable` (blast radius) — **profile present**.

## 13. QA profile and verification plan

**Q4** — critical flow "Listing public visibility invariant" gains a predicate path and its Task 456 static proof moves.

### 13.1 Final gate block (executor)

```powershell
$ev = "docs\sessions\evidence\task857"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\09-platform.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\listings\page.tsx *>&1 | Tee-Object "$ev\11-census-after.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx src/modules/listings/lib/__tests__/visibility.test.ts *>&1 | Tee-Object "$ev\10-tests.txt"
npm.cmd run check:listing-visibility *>&1 | Tee-Object "$ev\10b-listing-visibility.txt"
npm.cmd run check:listing-visibility:verify *>&1 | Tee-Object "$ev\10c-listing-visibility-verify.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\12-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\13-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\14-story-coverage.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\15-rendered-scope.txt"
npm.cmd run check:surface-census:changed *>&1 | Tee-Object "$ev\16-census-changed.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\17-design-tokens.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\17b-enrolled-tailwind.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\17c-i18n.txt"
npm.cmd run check:i18n-dynamic *>&1 | Tee-Object "$ev\17d-i18n-dynamic.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\18-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\18b-mojibake.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\19-storybook-build.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\19b-build.txt"
git --no-optional-locks diff -- scripts\surface-census-baseline.json | Tee-Object "$ev\20-baseline-diff.txt"
git --no-optional-locks grep --untracked -n -E "AdminPageShell|admin-adminlistingstable|admin-adminpageshell" -- . ":!docs/sessions/**" ":!tasks/Archive/**" ":!tasks/Sprints/**" ":!docs/backlog-archive.md" | Tee-Object "$ev\20b-reference-audit.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\21-status-after.txt"
```

Record each exit code; normalise `Tee-Object` files to UTF-8 without BOM through Node; hashes → `22-hash-object.txt`.
Expected: `win32`; four calibration FAIL lines; `10b` as `04`; all other exits 0; `20b` empty.

### 13.2 Receipts (executor)

GR-3b / GR-3c / GR-3d for every export at 320/390/1024/1440 (type 768/1440): widths, overflow, title/cell/badge font
sizes; edge gap 16/16/32/32 for `AdminListingsView`.

### 13.3 `OWNER VISUAL QA REQUIRED` — O78-12

| Story | States | Locales | Viewports | Tuples |
|---|---|---|---|---|
| `Patterns/Mantine/AdminListingsView` | `Default`, `VisibleFilter`, `HiddenEligible`, `Paginated` | `sq`, `uk` | 390, 1440 | 16 |
| `Patterns/Mantine/ListingPreviewDialogView` | `Active`, `SoldStatusActions`, `DeleteConfirm` | `sq`, `uk` | 390, 1440 | 12 |
| `Patterns/Mantine/PremiumDialogView` | `NotPremium`, `Premium` | `sq` | 390, 1440 | 4 |
| `Patterns/Mantine/AdminListingsView` `Default` | — | `en`, `it` | 1024 | 2 |

34 tuples. After the deploy: click ADM-08 on `/admin` and confirm the visible segment and a list of public listings.

## 14. Completion report contract

Status per `execute-task`. Files with hashes; R1–R12/AC1–AC9 with evidence; exit codes; the 893 gate quotes; census
before/after; GR-0, GR-1, GR-2 (for `check:listing-visibility`), GR-3 per View, GR-3a, GR-3b, GR-3c, GR-3d receipts;
plants with hash pairs; any 886 cross-task note; limitations; O78-12 owed. Update the 857 cell of `docs/backlog.md`;
session log. No Git.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | yes |
| Every requirement has an AC | R2/R3→AC1 · R4–R6→AC2 · R7→AC3 · R8→AC4 · R9→AC5 · R10→AC6 · R1/R11→AC7 · R12→AC8 · all→AC9 |
| Critical-flow proof | T1 + P1/P2 on the gate; Task 456 static proof kept (R10) |
| Path-reading test hazard | named (§3.5, R10) |
| Owner exception claimed | none |

### 15.1 Canonical UI decision record

| Visible artifact | Searches / inspected | Canonical source | Disposition | Registration |
|---|---|---|---|---|
| Tabs / search / segmented filter / pagination | `AdminUsersTable`, `Tabs`, `SegmentedControl`, `TextInput`, `MantinePagination` | their `Mantine/Primitives/*` Stories | **reuse** | — |
| List / cards | `AdminTable` | `Patterns/Mantine/AdminTable` | **reuse** | — |
| Status / visibility badges | `LISTING_STATUS_COLOR`, `Badge` | `Mantine/Primitives/Badge` | **reuse** | — |
| ID copy | `MantineCopyIdButton` | `Mantine/Primitives/CopyIdButton` | **reuse** | — |
| Dialogs | `MantineModal` | `Mantine/Primitives/Modal` | **reuse** | — |
| Premium date | `RangeDatePicker` single (893) | `Mantine/Primitives/RangeDatePicker` | **reuse** | — |
| Page chrome | `AdminPageHeader`, `adminPageShellMaxWidth` | 877 / 896 | **reuse** (extend if absent) | — |
| The screens | — | three new Views | **compose** | own Stories, manifest |

`GR-0 CANONICAL REUSE PREFLIGHT — request: /admin/listings (list View, preview dialog View, premium dialog View, search hook, page wrapper, visible filter); semantic queries: admin list tabs, debounced url search, status select, segmented visibility filter, data table to cards, copy id, status badge colour, modal, single date picker, pagination, admin page header, admin page width; inspected candidates: AdminUsersTable, Tabs, SegmentedControl, TextInput, MantineSelect, AdminTable (Patterns/Mantine/AdminTable), MantineDataTableToCards, MantineCopyIdButton (Mantine/Primitives/CopyIdButton), LISTING_STATUS_COLOR, MantineModal, RangeDatePicker, MantinePagination, AdminPageHeader, adminPageShellMaxWidth; decision: REUSE + COMPOSE (three Views with own Stories) + EXTEND-IF-ABSENT (adminPageShellMaxWidth); selected canonical owner: components/admin/AdminTable.tsx, patterns/*, listingStatusTone.ts, theme.other.layout; Mantine/TailAdmin token path: spacing sm/md/xl/2xl, fz sm/xs, iconSize, TailAdmin §6b; new hardcoded visual values: NONE (the archived-row dimming is dropped, not re-created); rationale: every value exists in the theme or a canonical owner.`

`GR-3a STORY PREFLIGHT — AdminListingsView / ListingPreviewDialogView / PremiumDialogView × R9 states; canonical candidates: NONE (Admin/AdminListingsTable and Admin/AdminPageShell render legacy components); direct-import evidence: NONE; toolbar coverage: locale=toolbar, viewport=toolbar; decision: CREATE; target: NONE; rationale: new Views; both legacy Stories deleted.`

`GR-1 CENSUS COMPLETE — 16 nodes today; after: tier1 3 Views migrated+enrolled+story + 3 container-exempt (AdminListingsTable, ListingPreviewDialog, PremiumDialog); AdminPageShell deleted; AdminSearchInput/AdminInput/Combobox imports removed (files stay for other consumers); tier2 5 imports removed; tier3 none — filed as none.`

## Appendix A — Evidence preflight

| Claim | Source | Status |
|---|---|---|
| Census, 16 nodes | 2026-09-29 run | VERIFIED |
| `visible` ignored today | `page.tsx:23-24,:87-89` | VERIFIED |
| `AdminPageShell` has no other consumer | import grep over `src` | VERIFIED |
| Path-reading test | `visibility.test.ts:359-403` | VERIFIED |
| `RangeDatePicker` min/single props | `RangeDatePicker.tsx:52-74` (893 working tree) | VERIFIED as present; landed state re-checked at I0 |
| ADM-08 href | `hrefs.ts:46-49` | VERIFIED |

## Appendix B — Rule-compliance ledger

| Rule | Outcome | Result |
|---|---|---|
| 16d / GR-1 | whole surface; shared files tier-2 | COMPLIANT |
| GR-0 | reuse/compose; no new raw value | COMPLIANT |
| GR-3 / 3a / 16c | three own Stories; legacy deleted | COMPLIANT |
| GR-3b / 3c / 3d | §12 | COMPLIANT |
| clause 9 | deletion audit | COMPLIANT (R10) |
| clause 15 | visibility flow proof | COMPLIANT (T1, P1, P2, Task 456 test) |
| data-access rules | canonical helper, no inline literal | COMPLIANT (R1) |

## Appendix C — Execution contract

| # | Checkpoint | Failure |
|---|---|---|
| 0 | 893 landed; no shared path dirty | `PREMISE DRIFT — 893` / `BLOCKED — SHARED PATH` |
| 1 | Census before | unmigrated node outside R2–R7 → `BLOCKED — CLAUSE 16d` |
| 2 | Views + Stories | receipts missing → `BLOCKED` |
| 3 | Tests + plants | a plant passes → test defect |
| 4 | Deletions + baseline | a live reference remains → fix |
| 5 | Gates | non-zero → `PARTIALLY IMPLEMENTED` |
| 6 | O78-12 | returned → revision |

## Appendix D — the reserved-registry row, moved verbatim (2026-09-29)

| # | State | What |
|---|---|---|
| **857** | reserved 2026-09-18 — **Sprint 78**, P2 | **`/admin/listings` has no "visible" filter.** `src/app/admin/listings/page.tsx:23,87-103` supports `visibility=hidden_eligible` (+ `reason`) only; `AdminListingsTable.tsx:598-694` renders only that filter's UI, so an unknown `visibility=visible` would filter nothing and show no chip. Needed by ADM-08 and the ADM-11 `visible` segment (847 `hrefs.ts`). The filter must use `applyPublicVisibility` (critical flow "Listing public visibility invariant"). `AdminListingsTable` (759 lines, legacy) comes under clause 16d → census first. |

---

## Addendum — Task 886 closure, 2026-09-30 (owner decision O83-2)

Task 886 added the blocking `check:type-responsive` gate (`scripts/check-type-responsive.mjs`). It baselines the legacy site **L5** (`src/components/admin/AdminPageShell.tsx :: text-2xl`) in `scripts/type-responsive-baseline.json`.
- When this task removes that site, delete its baseline entry in the same change. The gate fails on a **stale** entry: *"the site was fixed or removed; delete the entry"*.
- Add `npm.cmd run check:type-responsive` to the final gate block. It must exit 0.
- The migrated heading follows GR-3c: a breakpoint-keyed theme `fz` (`TITLE_FZ`, `src/design-system/mantine/typography.ts`), and at most 20px below 640.

Owner, verbatim (O83-2, 2026-09-30): *"що це за Legacy-сайти і чи використовуємо ми їх наразі у проекті? Якщо використовуємо, тоді треба мігрувати на Minetine."*
