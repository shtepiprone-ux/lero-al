# Task 857 — `/admin/listings` honours `visibility=visible` and moves to canonical Mantine

**Sprint 78** (Wave E — landings) · **P2** · QA profile **Q4** (legacy surface → Mantine on the registered critical flow
"Listing public visibility invariant") · **depends on 893** (hard: `RangeDatePicker` `selectionMode="single"`) · runs
**after 886** (886 edits `AdminPageShell`, which this task deletes) · owner action **O78-12** · **Status: 🔁
`PARTIALLY VERIFIED` — review 5, 2026-10-02 (§20). Revisions 1–4 are verified in source and by Opus measurement. No
executor work remains; the owner's visual review of O78-12 (§19.7, 70 tuples) is owed before approval.**

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
| **R10** | clause 9 | Delete `AdminPageShell.tsx` and `AdminPageShell.stories.tsx`; `check-stories-rendered.mjs:161` → `patterns-mantine-adminlistingsview--default` (same anchor); any `admin-adminpageshell` entry removed; `scripts/story-realmode-allowlist.json:13` (`AdminListingsTable.stories.tsx` / `FilteredPending`) and `scripts/responsive-screenshots.mjs:126` (`admin-adminlistingstable--preview-dialog-sold-status-actions`) retargeted to the new Story ids (`FilteredPending`, `patterns-mantine-listingpreviewdialogview--sold-status-actions`) or removed with the reason in the session log; `visibility.test.ts:359-403` reads the file that now calls `formatVisibility` (`AdminListingsView.tsx`; if the container also calls it, both) and keeps its three assertions. **The reference grep is redefined by §16.4** (history paths named; the remaining live references are Opus's at approval closure, owner decision 2026-10-02). | P1 | AC6 | Confirmed |
| **R11** | Q4; clause 15 | `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx` (new; harness as `AdminUsersTable.smoke.test.tsx`, `next/navigation`, `@/modules/admin/actions`, `@/lib/toast` mocked): **T1** a `page.tsx` query-builder unit (export a pure `applyAdminListingsVisibility(query, visibility, reason)` from a new `src/app/admin/listings/visibilityFilter.ts` and call it from `page.tsx`) — `'visible'` calls `applyPublicVisibility`'s `eq('status','active')` + expiry chain on a capture mock, `'hidden_eligible'` the other helper, `'bogus'` nothing; **T2** choosing `visible` in the segmented control pushes `visibility=visible&page=1` and keeps `q`; **T3** typing in search pushes `q` after the debounce (fake timers) and drops `page`; **T4** a status action calls `updateListingStatus(id, to)` and patches the row's badge; **T5** delete confirm → `deleteListing(id)`, row removed; cancel → no call; **T6** premium preset "1 month" calls `setListingPremium(id, true, <ISO ≈ now+30d>)`; `db_missing_column` → `premium_error_db_schema` toast; **T7** Open public is absent for a hidden listing. | P0 | AC7 | Confirmed |
| **R12** | GR-1 | FAIL lines after = §3.1 calibration; the three Views `manifest:yes story:yes`; no `AdminPageShell`, `AdminSearchInput`, `AdminInput`, `Combobox` or `ui/*` node; baseline regenerated; removed keys only from this surface; **the only keys added are the two new containers `ListingPreviewDialog.tsx` / `PremiumDialog.tsx` (the §3.1 calibration lines; corrected by review 1 — "no key added" contradicted §3.1).** | P0 | AC8 | Confirmed |

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
| ~~**P2**~~ | **Superseded by §16.5 (P2a–P2c, review 1).** As written it could not fail: the gate's own scope line says it cannot see a builder passed as an argument. | — |
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
  the reference grep is as §16.4 defines it.
- **AC7 [R1, R11]** Given T1–T7 and P1–P4, then all tests pass on the final tree and each plant fails as stated and passes
  after restore with equal hashes; `check:listing-visibility` exits as in `04` (0, or only 887's pre-existing line).
  **Amended by §16.5 (review 1): P2 is replaced by P2a–P2c, and AC10/AC11 are added.**
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

---

## 16. Review 1 — `NEEDS REVISION`, 2026-10-02 → Revision 1

Opus inspected the real diff, ran the census (`node.exe scripts\check-surface-census.mjs --surface src\app\admin\listings\page.tsx`: exactly the four §3.1 calibration FAIL lines), ran T1–T7 + `visibility.test.ts` natively (79/79 pass), and measured all 16 Stories at 320/390/768/1024/1440 in `sq`/`uk`. Results: no page overflow; gutter 24/16/24/16 at 320/390 and 24/32/24/32 at 1024/1440; no text ≥ 20px; filter bar stacked below 640; every touch target ≥ 44px below 640. The implementation of R1–R12 stands. **Do not touch any file outside §16.6.** Revision 1 adds the detection the owner asked for and corrects three kickoff defects.

### 16.1 Owner decisions, 2026-10-02 (verbatim)

- **P2 / AC7.** Opus asked whether to retire P2 and file a separate task for the gate's blind spot, or block 857 on that task. The owner answered: *"створюй тест у цій задачі!"*. The detection is therefore built **in 857** (§16.3), and no separate task is filed.
- **AC6 live references.** Option chosen: *"Opus at approval closure (Recommended)"*. Opus rewrites the live references listed in §16.4 in the approval commit. The executor does not touch them.

### 16.2 Why P2 could not fail (kickoff design defect, measured)

1. **Helper shape.** `visibilityFilter.ts` receives the builder as a parameter. The gate's printed scope line says it *"CANNOT see … factories … passed as arguments"*. An inline `.eq('status','active')` + `.gte('expires_at', …)` there also keeps T1 green, because T1 checks the calls on the capture mock and the inline chain makes the same calls. So T1 does not prove that the canonical helper is used.
2. **Route shape.** In `page.tsx`, `let query = supabase` and `.from('listings')` are on different lines. `extractListingsQueryBlocks` (`scripts/check-listing-visibility.mjs`) records a derived variable only when `const|let <name> =` and `from('listings')` share one line. Shape 1's continuation also stops at the multi-line `.select(` template. So `query = query.eq('status', 'active')` in that route is invisible. Evidence: `06b`/`06c`/`06d`, all exit 0.
3. **Blast radius (Opus pre-measure, 2026-10-02).** Six declarations have this shape: `src/app/admin/listings/page.tsx:63`, `src/app/api/listings/route.ts:15`, `src/app/[locale]/cabinet/page.tsx:49`, `src/app/[locale]/listings/page.tsx:42`, `src/modules/listings/lib/favoritesQueries.ts:54` and `:120`. A simulation of the widened rule over `src` with the gate's own `VISIBILITY_PATTERNS` found **0** violations on today's tree. **Re-measure at execution; do not cite this count.**

### 16.3 New requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R13** | `scripts/check-listing-visibility.mjs`: a derived variable is also recognised when its declaration spans lines. `const`/`let <name> = [await] <identifier>` sits on one line, `.from('listings')` starts the next line, and its later `<name>.` / `<name> = <name>.` lines are scanned exactly as shape 2 scans them today. The write-method exclusion is unchanged. `SCOPE_LINE` says derived variables include a multi-line declaration. It keeps the *passed as arguments* blind spot, because that one is still not covered. `--verify-gate` gains two BAD arms: `multi-line declaration: query = query.eq('status','active')`, whose code is a `let query = supabase` line, a `.from('listings')` line, a multi-line `.select(` template, then `query = query.eq('status', 'active')`; and `multi-line declaration: query.gte('expires_at')`. It also gains two NO-FP arms: `multi-line declaration + dynamic .eq('status', status)` and `multi-line declaration + applyPublicVisibility(query)`. | P0 | AC10 |
| **R14** | **T1b** in `AdminListingsTable.smoke.test.tsx` mocks `@/modules/listings/lib/visibility` partially (`vi.mock` + `importActual`, with `applyPublicVisibility` and `applyPublicEligibleButHidden` wrapped in spies that call through). It asserts: `'visible'` calls `applyPublicVisibility` exactly once with the given builder and does not call `applyPublicEligibleButHidden`; `'hidden_eligible'` + `'expired'` calls `applyPublicEligibleButHidden(builder, { reason: 'expired' })` once; `'bogus'` calls neither. T1 stays unchanged. If the partial mock breaks T2–T7 in the same file, put T1b in a new file `src/app/admin/listings/__tests__/visibilityFilter.test.ts` and name it in the session log. | P0 | AC11 |

### 16.4 AC6 redefined (owner decision §16.1)

The R10 audit command becomes:

```powershell
git --no-optional-locks grep --untracked -n -E "AdminPageShell|admin-adminlistingstable|admin-adminpageshell" -- . ":!docs/sessions/**" ":!tasks/Archive/**" ":!tasks/Sprints/**" ":!docs/backlog-archive.md" ":!docs/governance-reports/**" ":!docs/reviews/**" ":!tasks/Epics/**" ":!docs/mantine-tailadmin-migration-tracker.md" ":!scripts/task419-qa-shell-fullwidth.mjs"
```

The added exclusions are history: weekly reports and retained review artifacts; the Epic files; the migration tracker, which is HISTORICAL by owner decision 2026-08-27 (`docs/backlog.md` → Active Epics); and the one-off Task 419 probe, which no `package.json` script or workflow runs.

**Expected executor output: exactly the live lines Opus rewrites at approval closure.** Those are `docs/admin-ux-rules.md` (§14.1, §14.5), `docs/design-system.md`, `docs/storybook-governance.md`, `docs/responsive-storybook-inventory.md`, `docs/backlog-reserved.md` (734's row) and `src/app/globals.css:729` (comment). Record the output in `20c-reference-audit-r1.txt`. Any path outside that list is the executor's to fix if it is inside §16.6. Otherwise report it.

### 16.5 Plants and acceptance (Revision 1)

| Plant | Edit (Node I/O, hash before/after, restore) | Must fail |
|---|---|---|
| **P2a** | in `visibilityFilter.ts`, replace `return applyPublicVisibility(query)` with `return query.eq('status', 'active').gte('expires_at', new Date().toISOString())` | T1b (T1 may stay green — say so) |
| **P2b** | in `page.tsx`, insert `query = query.eq('status', 'active')` on the line after `query = applyAdminListingsVisibility(…)` | `npm.cmd run check:listing-visibility` exits 1 and names `src/app/admin/listings/page.tsx:<line>` |
| **P2c** | revert only R13's detector change (keep the new self-test arms) | `npm.cmd run check:listing-visibility:verify` exits 1 with `❌ MISSED` on both new BAD arms |

- **AC10 [R13]** Given the final tree, `check:listing-visibility` exits 0 (or with any new hit reported per §16.7), `check:listing-visibility:verify` exits 0 with the four new arms printed, and P2b and P2c fail as stated, then pass after restore with equal hashes.
- **AC11 [R14]** Given the final tree, T1b passes, and P2a fails it and passes after restore with equal hashes.
- **AC7 (amended)** P1, P3, P4 and P5 stand on the retained `06-plants-run.txt` / `06b-plants-run.txt` and are **not re-run**. P2 is replaced by P2a–P2c.

### 16.6 Re-entry: `remediation`

- **Start step:** I0 platform line only (`24-platform-r1.txt`). Then R13 → R14 → plants P2a–P2c → the §16.8 gate block.
- **Reusable, do not re-run or overwrite:** `01`–`23`, every `plant-*` file, the Story measurements and the GR-3b/3c/3d receipts. Revision 1 changes no visible artifact.
- **Write set:**
  - `scripts/check-listing-visibility.mjs`;
  - `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx`, or the new `src/app/admin/listings/__tests__/visibilityFilter.test.ts` (R14);
  - `docs/critical-flow-registry.md` row `:70`: append *"Task 857 R13: the gate follows a multi-line `let query = supabase` / `.from('listings')` declaration; R14 T1b proves `/admin/listings?visibility=visible` calls `applyPublicVisibility`."*;
  - `docs/sessions/2026-10-02-task857-admin-listings-mantine.md` (append a "Revision 1" section; keep the original sections);
  - `docs/sessions/evidence/task857/` (new files with an `-r1` suffix);
  - the 857 cell of `docs/backlog.md`.
- **Forbidden:** any other `src/` file, any doc in §16.4's live list, and any `docs/*rule*.md`.

### 16.7 Negative branch — the widened gate finds a hit

If `check:listing-visibility` reports a violation in one of §16.2's files, stop. Record the file, line and text in the session log, and return `BLOCKED — R13 NEW HIT` (a public-read hit is a production visibility defect and needs an owner decision). Do not allowlist it and do not edit that file.

### 16.8 Gate block (Revision 1)

```powershell
$ev = "docs\sessions\evidence\task857"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\24-platform-r1.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx src/modules/listings/lib/__tests__/visibility.test.ts *>&1 | Tee-Object "$ev\25-tests-r1.txt"
npm.cmd run check:listing-visibility *>&1 | Tee-Object "$ev\26-listing-visibility-r1.txt"
npm.cmd run check:listing-visibility:verify *>&1 | Tee-Object "$ev\27-listing-visibility-verify-r1.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\28-typecheck-r1.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\29-lint-r1.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\30-file-integrity-r1.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\31-mojibake-r1.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\32-build-r1.txt"
git --no-optional-locks grep --untracked -n -E "AdminPageShell|admin-adminlistingstable|admin-adminpageshell" -- . ":!docs/sessions/**" ":!tasks/Archive/**" ":!tasks/Sprints/**" ":!docs/backlog-archive.md" ":!docs/governance-reports/**" ":!docs/reviews/**" ":!tasks/Epics/**" ":!docs/mantine-tailadmin-migration-tracker.md" ":!scripts/task419-qa-shell-fullwidth.mjs" | Tee-Object "$ev\20c-reference-audit-r1.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\33-status-after-r1.txt"
```

If T1b lives in the new file, add its path to the `vitest` line. Record every exit code, normalise the `Tee-Object` files to UTF-8 without BOM through Node, and write `git hash-object` of every Revision 1 file to `34-hash-object-r1.txt` in the same pass.

**Expected:** `win32`; tests pass; `26` = 0; `27` = 0 with the four new arms; typecheck, lint, file-integrity, mojibake and build = 0; `20c` = only §16.4's live list.

### 16.9 Completion report (Revision 1)

Status per `execute-task` (strongest: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`). Report: R13/R14 and AC10/AC11 with their evidence, the P2a–P2c hash pairs, the count of `from('listings')` declarations the widened rule now follows (re-measured), any §16.7 hit, and `GR-2 SCOPE STATED` for `check:listing-visibility` (what it still cannot see). Update the 857 cell of `docs/backlog.md`. No Git.

### 16.10 Still owed outside the executor

- **O78-12** (§13.3, 34 tuples) can be reviewed now. Revision 1 changes no visible artifact, and Opus's measurements (§16 preface) are clean.
- **Opus at approval closure:** the §16.4 live references, the archive, and the kickoff move to `tasks/Archive/`.

---

## 17. Review 2 — `NEEDS REVISION`, 2026-10-02 → Revision 2 (owner returned O78-12)

**Revision 1 is verified.** Opus re-ran these natively: `check:listing-visibility:verify` (34 passed, 0 failed),
`check:listing-visibility` (0 violations) and the smoke file (16/16). The R13 heuristic and the decision to treat a
destructured declaration as data, not a builder, are accepted. **Do not touch R13/R14 or their evidence.**

### 17.1 Owner returns, 2026-10-02 (verbatim)

1. `AdminListingsView` (`Default`, `VisibleFilter`, `HiddenEligible`, `Paginated` × sq/uk × 390/1440, and `Default` × en/it × 1024): *"не приймаю, не витримані горизонтальні відступи всередині таблиці на всіх breakpoints."*
2. `ListingPreviewDialogView`: *"не приймаю. Це суцільний хаос однакових по ієрархії кнопок. Необхідно у цьому попапі розробити ієрархію основних і допоміжних кнопок. Це можуть бути текстові кнопки з іконками та звичайні основні кнопки. Необхідно розрробити цей попап та і взагалі всі інші попапи мають притримуватись UI/UX best practices 2026 року. Наразі це повне лайно."*
3. `PremiumDialogView`: *"не приймаю. Звідки взявся цей жовтий колір ще й гімняного відтінку. … Кнопки мають бути стандартні з ієрархією!"*
4. The visibility segment that scrolls out of view at 320: the owner left this to Opus. Decision: fix it (R18).

The dialog rule the owner asked for is now `docs/mantine-responsive-design-system.md` **§23.6 "Dialog action
hierarchy"**. R16 and R17 implement it. The other existing dialogs are reserved **Task 915**.

### 17.2 Measured causes (Opus, 2026-10-02, `storybook-static` screenshots)

- **Table (return 1).** At 1024 and 1440 the desktop table is wider than its card, so it scrolls inside `MantineDataTableToCards`'s `ScrollArea`. The listing title column has no width and inherits the pattern's `nowrap` and `miw="max-content"`. A long title therefore sets the table width. The right-hand columns (status, visibility, agent, date, row chevron) are clipped at the card border with no right inset. At 1024 the status badge touches the border, and visibility, agent and the chevron are off-canvas. The legacy table capped the title (`truncate max-w-50`). `AdminTable` does not forward `TableColumn.width` / `wrap`: its own comment says *"widths belong to `TableColumn.width` in each manager's migration"*, and that migration was never done.
- **Audit panel.** `auditButton` wraps its label in `Text size="sm" inherit`. `inherit` overrides `size`, so the links render at 16px, not 14px.
- **Preview dialog (return 2).** It has eleven outline buttons of equal weight, including seven status actions in seven colours, plus a yellow `--badge-premium` Premium button.
- **Premium dialog (return 3).** Its four presets are outline buttons in `--badge-premium` yellow, there is a literal "OK", and no button is clearly primary.

### 17.3 New and replacing requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R15** | **`AdminTable` (canonical owner, EXTEND):** `AdminTableColumn` gains optional `width?: string \| number` and `wrap?: boolean`, forwarded unchanged to `TableColumn.width` / `TableColumn.wrap`. Omitted → today's output, so the other consumers do not change. Update the `@deprecated className` comment. `Patterns/Mantine/AdminTable` gains one export, `WrappedTitleColumn`: a fixture with one long title, a `wrap: true` + `width` title column and `onRowClick`, in `StoryPageGutter`. **`AdminListingsView`:** the listing column passes `wrap: true` and a percentage `width`, and its title becomes `Text size="sm" fw={500} lineClamp={2}`. Every other column stays `nowrap`. The `auditButton` label drops `inherit`. | P1 | AC12 |
| **R16** | **`ListingPreviewDialogView` per §23.6.** **Title:** the listing title (`lineClamp={2}`), plus a `Badge variant="light" color="gray"` with the new key `admin.listings.premium_badge` (sq/en/it "Premium", uk "Преміум") when premium. There is no yellow star. **Body:** the details `SimpleGrid`. Its **Status** cell is the canonical `StatusChangeSelect` (Task 894), with `currentStatus` = the listing status and `statuses` = the current status plus `getPrivilegedTargetStatuses(status)`, labelled with `statusLabels`; it replaces the status badge and every status-action button. Under the grid, a `Group gap="xs"` of tertiary `Button variant="subtle" color="gray"` text buttons with icons: View listing (`Eye`) and Open public page (`ExternalLink`, absent when hidden). **Footer, resting:** Delete `variant="subtle" color="red"` + `Trash2` on the left. On the right, Premium set/change as `variant="default"` + `Star` (neutral colour), then the **primary** filled Edit (`Pencil`, `component={Link}`, new tab), rightmost. **Footer, delete confirm:** Cancel `variant="default"` + Delete filled `color="red"` (`loading` while deleting). The confirm text stays in the body. **Below 640:** the footer stacks full-width, ≥ 44px, in the order Edit, Premium, Delete (confirm step: Delete, Cancel). **Container:** `usePreviewStatusActions` becomes `usePreviewStatusOptions` (`StatusSelectOption[]`); `ACTION_DEFS` and the `changingStatus` state are deleted. `handleStatusChange` throws when `result.error` is set and calls `onStatusChanged` on success. **It does not toast:** `StatusChangeSelect` owns the success and error toasts (`admin.common.status_control.status_change_success` / `_error`). `onStatusChanged` behaves as today. | P1 | AC13 |
| **R17** | **`PremiumDialogView` per §23.6.** **Body:** the listing title (`Text size="sm" c="dimmed" lineClamp={2}`), then a `Radio.Group` (label `premium_quick_label`) with five `Radio`s: `preset_1m`, `preset_3m`, `preset_6m`, `preset_1y` and `premium_custom_date`. Choosing the custom option reveals the `RangeDatePicker selectionMode="single" disablePastDates` below it. **Footer:** `premium_remove` as `variant="subtle" color="red"` on the left, only when premium. On the right, Cancel (`common.cancel`, `variant="default"`, closes) and **Save** (`common.save`, filled primary, `loading` while saving, disabled until a preset is chosen, or until the custom option has a date). **No `--badge-premium` and no literal "OK".** **Container:** `apply()` runs on Save with the chosen preset's days, or with the custom date's ISO as today; the error and success toasts are unchanged. **Changed flow:** a preset no longer applies on click; Save applies it. | P1 | AC14 |
| **R18** | **Visibility filter below 640.** Below `theme.other.mobileGate`, the `AdminListingsView` visibility filter is a full-width `MantineSelect` with the same three options and `aria-label` `visibility_label`. Choose it with `useMediaQuery(\`(max-width: ${theme.other.mobileGate})\`)`, the pattern's own query. From 640 it stays the `SegmentedControl`. No label is clipped at 320 in any locale. | P2 | AC15 |
| **R9 (amended)** | `ListingPreviewDialogView` exports: `Active`, `SoldStatusActions` (the id is kept; `responsive-screenshots.mjs` uses it), `Hidden`, `DeleteConfirm`, `Premium` (new: a premium listing, so the title shows the badge and the footer shows "change premium"). `ChangingStatus` is deleted, because that state no longer exists in the View. `PremiumDialogView` exports: `NotPremium`, `Premium`, `CustomDate` (new: the custom option with a date), `Saving`. | P1 | AC5 |
| **T4 / T6 (amended)** | **T4:** choosing a status in the dialog's `StatusChangeSelect` calls `updateListingStatus(id, to)` and patches the row badge; an error result raises the `status_change_error` toast. **T6:** choosing "1 month" and clicking Save calls `setListingPremium(id, true, <ISO ≈ now+30d>)`; clicking a preset alone calls nothing; `db_missing_column` → `premium_error_db_schema`. **T8 (new):** the resting preview footer has exactly one filled button (Edit). **P6 (new plant):** make Premium filled → T8 fails. | P0 | AC16 |

### 17.4 Acceptance (Revision 2)

- **AC12 [R15]** In `AdminListingsView` `Default` and `Paginated` at 640/768/1024/1280/1440 × sq/en/uk/it, the table's `ScrollArea` viewport has `scrollWidth ≤ clientWidth`, so nothing scrolls or clips. The first cell's left inset and the last cell's right inset are both the pattern's 24px (chevron cell included) from the card border. No text is clipped. Below 640, every card's left and right content inset are equal. `Patterns/Mantine/AdminTable` `WrappedTitleColumn` passes the same scroll check at 1024/1440. The other `AdminTable` exports are visually unchanged (before/after screenshots at 1440). The audit links compute to 14px.
- **AC13 [R16]** In every `ListingPreviewDialogView` export at 390/1440 × sq/uk: one filled button per state; no colour on a non-destructive, non-primary button; no `--badge-premium` in the file; `StatusChangeSelect` is the only status control; at 390 the footer is stacked, full-width and ≥ 44px.
- **AC14 [R17]** In every `PremiumDialogView` export: no `--badge-premium` and no literal `OK` (grep of the file prints nothing); Save is the only filled button; Save is disabled with no choice; at 390 the footer is stacked, full-width and ≥ 44px.
- **AC15 [R18]** At 320 and 390 × all four locales, the visibility filter is a select whose width equals the filter column and whose label is fully visible. At 640 and above the `SegmentedControl` renders; T2 still passes.
- **AC16** T1–T8 and T1b pass; P6 fails T8 and passes after restore with equal hashes. P1–P5 and P2a–P2c are not re-run.
- **AC9 (re-run)** Every §17.6 gate exits 0.

### 17.5 Re-entry: `remediation` (Revision 2)

- **Start step:** platform line `40-platform-r2.txt`. Then R15 → R18 → R16 → R17 → Stories → tests → P6 → the §17.6 gate block → receipts.
- **Do not re-run or overwrite:** evidence `01`–`36` and every `plant-*` file.
- **Write set:**
  - `src/components/admin/AdminTable.tsx` (R15, additive only);
  - `src/stories/patterns/mantine/AdminTable.stories.tsx` (one new export);
  - `src/components/admin/AdminListingsView.tsx`, `ListingPreviewDialog.tsx`, `ListingPreviewDialogView.tsx`, `PremiumDialog.tsx`, `PremiumDialogView.tsx`;
  - the three 857 Story files;
  - `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx`;
  - `messages/{sq,en,uk,it}.json` (`admin.listings.premium_badge` only; remove a key only if a grep shows it is now unused, e.g. the `btn_*` status-action labels, and list each removal);
  - `scripts/i18n-dynamic-manifest.json`, only if the `btn_*` labels were registered there;
  - session log, evidence with an `-r2` suffix, and the 857 cell of `docs/backlog.md`.
- **Forbidden:** `MantineDataTableToCards.tsx`, `StatusChangeSelect.tsx`, `MantineModal.tsx` and every other `AdminTable` consumer. If R15 cannot reach AC12 without changing the pattern, stop: `BLOCKED — R15 PATTERN`.
- **Census:** the containers and Views stay as they are, and `StatusChangeSelect` becomes a new tier-1 node under the dialog (`manifest:yes story:yes` since 894). Re-run the census; the FAIL lines must still be exactly the four §3.1 lines.

### 17.6 Gate block (Revision 2)

```powershell
$ev = "docs\sessions\evidence\task857"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\40-platform-r2.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\listings\page.tsx *>&1 | Tee-Object "$ev\41-census-r2.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx src/modules/listings/lib/__tests__/visibility.test.ts *>&1 | Tee-Object "$ev\42-tests-r2.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\43-typecheck-r2.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\44-lint-r2.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\45-story-coverage-r2.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\46-rendered-scope-r2.txt"
npm.cmd run check:surface-census:changed *>&1 | Tee-Object "$ev\47-census-changed-r2.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\48-design-tokens-r2.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\49-enrolled-tailwind-r2.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\50-i18n-r2.txt"
npm.cmd run check:i18n-dynamic *>&1 | Tee-Object "$ev\51-i18n-dynamic-r2.txt"
npm.cmd run check:type-responsive *>&1 | Tee-Object "$ev\52-type-responsive-r2.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\53-file-integrity-r2.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\54-mojibake-r2.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\55-storybook-build-r2.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\56-build-r2.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\57-status-after-r2.txt"
```

Record every exit code. Normalise the transcripts to UTF-8 without BOM through Node, and write
`git hash-object` of every Revision 2 file to `58-hash-object-r2.txt` in the same pass.

**Expected:** `win32`; four calibration FAIL lines; every other exit 0.

### 17.7 Receipts and measurements (Revision 2)

- **AC12 and AC15:** Playwright against the rebuilt `storybook-static`. Write the numbers to `59-measurements-r2.json` and the before/after screenshots of the `AdminTable` exports to `60-*`.
- **GR-3b, GR-3c and GR-3d:** one receipt per changed Story (the three 857 Stories and `AdminTable`), at 320/390/1024/1440 (type at 768/1440 too).
- **GR-0 and GR-3a:** for `WrappedTitleColumn` (`EXTEND`) and for `StatusChangeSelect` (`REUSE`).
- **§23.6:** one line per dialog state: the primary, the secondary, the tertiary and the destructive button.

### 17.8 Owner matrix after Revision 2 (O78-12, re-issued)

The tuples are the same as in §13.3, plus `ListingPreviewDialogView` `Premium` and `PremiumDialogView` `CustomDate`
(sq, 390/1440): **38 tuples**. Opus re-measures every Story before the owner sees it.

---

## 18. Review 3 — `NEEDS REVISION`, 2026-10-02 → Revision 3 (every Mantine table fits its production container)

Revision 2 is verified except AC12. Opus inspected the real diff and the `-r2` evidence. Results:
- R16, R17 and R18 match §17.3 and §23.6 in source.
- AC13–AC16 are as reported: `59b-dialogs-r2.json`, `59-measurements-r2.json`, `42-tests-r2.txt` (83 passed) and
  `61-plant-P6-r2.txt`.
- `41-census-r2.txt` shows exactly the four §3.1 FAIL lines, and `56-build-r2.txt` exits 0.
- R15's forwarding adds nothing when `width`/`wrap` are omitted. `MantineDataTableToCards.tsx:536` writes
  `style.width = col.width` and adds `whiteSpace: 'normal'` only when `col.wrap` is truthy. So the other `AdminTable`
  exports are unchanged by source inspection. The missing AdminTable "before" screenshots are no longer required.

**Do not touch R13/R14, R16/R17/R18, the dialogs, their Stories, T1–T8, T1b or their evidence.**

### 18.1 Owner decision, 2026-10-02 (verbatim option chosen)

Opus asked how the table should fit its card and gave three options: merge cells, hide columns by width, or keep the
horizontal scroll. The owner chose:

*"Merge cells, no scroll (Recommended)"*: Status + visibility become two stacked badges in one column.
Type · property · agent becomes a grey meta line under the title. The title column is capped by a theme token (legacy
`max-w-50` = 200px). Date shows from 1280 and ID from 1440 (legacy had both from 1280). Nothing scrolls from 768 up, and
all data except ID and date stays visible at every width.

### 18.2 Measured causes (Opus, 2026-10-02)

1. **The production card is narrower than the Story's.** `AdminShell` (`src/components/admin/AdminShell.tsx:23-28`)
   puts a 240px navbar (`appShellNavbarWidth`, `theme.ts:844`) beside the page from `lg`. `AppShell.Main` has padding 0,
   and the page `Box` pads `xl` (24px), then `2xl` (32px) from `lg` (`page.tsx:121`). The card is therefore:

   | Viewport | Production card | Story card |
   |---|---|---|
   | 768 | 720 | 720 |
   | 1024 | 720 | 960 |
   | 1280 | 976 | 1216 |
   | 1440 | 1136 | 1376 |

   The Story renders without the shell, so §17.4's Story measurement overstated the room by 240px from 1024. In
   production the table scrolls even at 1440.
2. **Per-column widths** (`59b-cols-r2.json`, worst locale `uk`): chevron 62, price 130, status 144, visibility 270,
   type · property 167, agent 144, date 130, ID 93. At a 720px card no layout with one value per cell fits.
3. **Kickoff defect (§17.3 R15):** a percentage `width` on a `wrap` column inflates the table, because the pattern's
   `miw="max-content"` divides the title's max-content width by the percentage. The executor measured this and used a
   fixed width. The fixed width they used is the defect in item 4.
4. **Disguised raw value (GR-0, P2):**
   - `AdminListingsView.tsx:133` and `AdminTable.stories.tsx` (`WrappedTitleColumn`) set
     `width: 'calc(var(--mantine-spacing-3xl) * 5)'`. That expression invents a 240px width from a spacing token and a
     multiplier.
   - A spacing token is not a column width, and ×5 has no provenance.
5. **Untranslated Story text (clause 13, P3):** `WrappedTitleColumn` shows the raw status code (`r.status`, for example
   `active`) inside its badge.

### 18.2a Owner instructions later the same day (verbatim) — scope widened

1. Opus noted that every admin page View Story renders without `AdminShell` and is therefore 240px wider than the
   real page from 1024. The owner replied: *"Це треба вирішити одразу у цій задачі, а не створювати купу
   додаткових задач!"*
2. *"і це стосується всіх таблиць у проекті, а не тільки в адмінці"*.
3. Asked how far that reaches, the owner chose *"857: усі Mantine + правило (Recommended)"*. Its full text:
   - 857 carries the rule, the shared Story frame with the real `AdminShell`, and the measurement and fix of every
     Mantine table.
   - The five legacy table screens get the rule when they migrate, in one task (**916**).
   - Support is covered in **859**.

**The rule is now `docs/mantine-responsive-design-system.md` §7.3 "Table fit"** (written by Opus, 2026-10-02). GR-3b
gains "An admin page View renders inside the real `AdminShell`". §7.3 is the acceptance standard for every table
below.

**Opus measurement, 2026-10-02.**
- Run: `win32` Node v22.22.3, `storybook-static` built 10:47 from the Revision 2 tree, Playwright, sq and uk.
- Production geometry was reproduced with the navbar offset and each page's `maw`.
- Script and raw output: `docs/sessions/evidence/task857/90-opus-table-census.mjs` and
  `90-opus-table-census.json` (copied there by Opus).

Each cell is `scroll overflow px` in uk, with the card width in brackets:

| Table (Story) | Production card 768 / 1024 / 1280 / 1440 | uk overflow at 1024 | Columns measured at 1024 (uk, px) |
|---|---|---|---|
| `AdminListingsView` | 720 / 720 / 976 / 1136 | +439 | listing 240, type 167, price 130, status 144, visibility 270, agent 144, chevron 62 |
| `AdminUsersTable` | 720 / 736 / 992 / 1152 (page `p="xl"`) | +809 | user 534 (`35%`), role 153, status 153, phone 198, date 305 (`20%`), actions 183 (`12%`) |
| `AdminExchangeProvidersView` | 720 / 720 / 960 / 960 | +392 | name 177, endpoint 332, priority 109, mode 129, enabled 129, notes 105, actions 130 |
| `AdminPagesView` | 720 / 720 / 832 / 832 | +371 | title 472, status 149, updated 197, actions 130 (slug from `md`) |
| `AdminReportsView` | 720 / 720 / 960 / 960 | +358 | reason 212, listing 337, status 127, date 197, chevron 62 (reporter from `lg`) |
| `AdminCurrenciesView` | 720 / 720 / 960 / 960 | +5 | code 71, symbol 94, name 159, active 206, chevron 62 (updated from `lg`) |
| `AgentStatisticsView` (cabinet) | 678 / 934 / 1190 / 1350 (its own `MantineDashboardGrid`) | +3238 | nine columns with `%` widths; the `22%` wrap title inflates the table to 4170px |
| `AdminSurfacePattern`, `AdminTable` `Default` | no production consumer / adapter | 0 | fit |

### 18.3 New and replacing requirements (supersede R15's `AdminListingsView` part and AC12)

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R19** | **Token (`src/design-system/mantine/theme.ts`, EXTEND).** Add `theme.other.layout.tableTitleColumnWidth: '12.5rem'` to the `layout` type and value blocks. Its comment gives the provenance: legacy `AdminListingsTable.tsx:511` (`git show HEAD`) `truncate max-w-50`, 12.5rem; owner decision 2026-10-02; §7.3 (a). Every table in this task uses it for its title column. | P1 | AC17 |
| **R20** | **`AdminTable` (EXTEND).** `AdminTableColumn.visibility` gains `'xxl'` (theme 1440px, `theme.ts:629`), forwarded through `visibleFrom()`. `AdminTable` passes `cardsBelow="md"` to `MantineDataTableToCards` (§7.3 rule 2). Every `AdminTable` consumer therefore shows cards below 768. That includes the legacy `AdminCompaniesManager`, `AdminPropertyTypesManager` and `AdminSupportManager`, which are not edited. Their synthesized or `cardRow` card already exists. | P1 | AC17, AC19 |
| **R21** | **`AdminListingsView` columns, in order:** <br>1. **ID**, `visibility: 'xxl'`. <br>2. **Listing** (sticky). `width: theme.other.layout.tableTitleColumnWidth`, `wrap: true`. Cell: the button with the premium star, title `Text size="sm" fw={500} lineClamp={2}`, and under it `Text size="xs" c="dimmed"` with `typeLabel(l)` plus ` · <agent>` when there is one. That is the card's `meta` string, from one helper both use. <br>3. **Price**. <br>4. **Status**. Header `col_status`. Cell: `Stack gap="tight" align="flex-start"` with the status badge, then the visibility badge. <br>5. **Date**, `visibility: 'xl'`. <br>The `type`, `visibility` and `agent` columns are deleted, and the `calc(…)` width is gone. | P1 | AC17 |
| **R22** | **`WrappedTitleColumn` (`AdminTable.stories.tsx`).** The title column uses `theme.other.layout.tableTitleColumnWidth` (`useMantineTheme()` in `render`), not `calc(…)`. The status badge shows `getListingStatusLabel(code, k => storyT(l, 'cabinet.' + k))` (`src/lib/i18n/listingStatusLabel.ts`; the container calls it with the `cabinet` translator at `AdminListingsTable.tsx:46,58`), never the raw code. | P2 | AC17 |
| **R23** | **`AdminPageFrame` (CREATE, production).** Add `src/components/admin/AdminPageFrame.tsx`: `<Box p={…} maw={…} mx={…}>{children}</Box>`, the wrapper every admin `page.tsx` hand-writes today. Props: <br>• `width: 'page' \| 'shell' \| 'narrow' \| 'panel' \| 'form'`, mapping to `adminPageMaxWidth` / `adminPageShellMaxWidth` / `adminPageNarrowMaxWidth` / `adminPagePanelMaxWidth` / `adminPageFormMaxWidth`. <br>• `gutter?: 'responsive' \| 'xl'`. Default `responsive` = `{ base: 'xl', lg: '2xl' }`; `xl` is today's `p="xl"`. <br>• `centered?: boolean`, default `true` (`mx="auto"`). <br>Every route keeps its exact current values: <br>• `currency`, `inquiries/sales`, `inquiries/support`, `reports`, `users/[id]`: `page`; <br>• `listings`: `shell`; <br>• `users`: `shell` + `gutter="xl"`; <br>• `pages`: `narrow`; <br>• `permissions`: `panel` + `gutter="xl"` + `centered={false}`; <br>• `users/new`: `form`. <br>Those ten `page.tsx` files replace their `Box` with it and change nothing else. Own Story `Patterns/Mantine/AdminPageFrame` (one export per `width`, inside `withAdminShell`, an `AdminPageHeader` + `Paper` placeholder as content). Enrolled in `scripts/mantine-migration-scope.json`. | P1 | AC18 |
| **R24** | **Shared Story frame (CREATE).** Move `withAdminShell` from `AdminDashboardView.stories.tsx:41-47` to `src/stories/_StoryAdminShell.tsx` (exported). `AdminDashboardView.stories.tsx` imports it. That is the only change to that Story. | P1 | AC18 |
| **R25** | **Admin page View Stories render as their route does (GR-3b, §7.3).** Each Story below: <br>• uses `decorators: [withAdminShell]`, `layout: 'fullscreen'`, `skipCanvas: true` and `parameters.nextjs.navigation.pathname` = its route; <br>• wraps every page export in the route's `AdminPageFrame` props (R23); <br>• removes `StoryPageGutter`. <br>Stories and routes: <br>• `AdminListingsView` (`/admin/listings`); <br>• `AdminUsersTable` (`/admin/users`); <br>• `AdminCurrencyTabs`, `AdminCurrenciesView`, `AdminExchangeProvidersView` (`/admin/currency`); <br>• `AdminPagesView` (`/admin/pages`); <br>• `AdminReportsView` (`/admin/reports`); <br>• `AdminInquiriesView` (`/admin/inquiries/sales`); <br>• `AdminPermissionsView` (`/admin/permissions`); <br>• `AdminUserProfileView`: `Create` → `/admin/users/new` with `form`; every other export → `/admin/users/[id]` with `page`. <br>Exports that render only an open dialog stay overlay-only. The dialog View Stories (`*DialogView`) do not change. | P1 | AC18 |
| **R26** | **`AdminUsersTable` fits (§7.3), both tables (users and verified agents).** <br>• Delete every percentage `width`. <br>• The user column takes `tableTitleColumnWidth` + `wrap: true`; the name stays as today, and phone moves to a dimmed meta line under it. <br>• Role and status stack in one cell (header `col_status`). <br>• Date from `xl`. <br>• Actions stay. <br>• `cardsBelow="md"`. <br>Apply the same order to the verified-agents table, and list its final columns in the session log. | P1 | AC19 |
| **R27** | **`AdminExchangeProvidersView` fits.** <br>• Name takes `tableTitleColumnWidth` + `wrap: true`. Under it, the endpoint shows as `Text size="xs" c="dimmed" ff="monospace" truncate="end"`, and the endpoint column is deleted. <br>• Mode and enabled stack in one cell. <br>• Notes from `xl`; they stay in the card. <br>• Priority and actions stay. <br>• `cardsBelow="md"`. | P1 | AC19 |
| **R28** | **`AdminPagesView` fits.** <br>• Title takes `tableTitleColumnWidth` + `wrap: true` + `lineClamp={2}`. <br>• The slug moves to a dimmed monospace meta line under it, and the slug column is deleted. <br>• Status, updated (`lg`) and actions stay. <br>• `cardsBelow="md"`. | P1 | AC19 |
| **R29** | **`AdminReportsView` fits.** <br>• The listing column takes `tableTitleColumnWidth` + `wrap: true` + `lineClamp={2}`, with the reporter as a dimmed meta line under it. The reporter column is deleted, and the listing column shows from `always`. <br>• Status and date stack in one cell. The date column is deleted. <br>• Reason and chevron stay. | P1 | AC19 |
| **R30** | **`AdminCurrenciesView` fits.** The symbol moves into the code cell as dimmed text after the code, and the symbol column is deleted. Everything else stays. | P2 | AC19 |
| **R31** | **`AgentStatisticsView` (cabinet) fits.** <br>• Delete every percentage `width`. <br>• The title column takes `tableTitleColumnWidth` + `wrap: true` (thumbnail + `lineClamp={2}` link, as today). <br>• Status and visibility stack in one cell. <br>• Keep `cardsBelow="md"`. <br>Then measure. If the table still overflows at 678 (768) or 934 (1024), the views, WhatsApp and form-inquiries counts stack in one right-aligned cell, header `agt10_col_activity_counts` (new key, sq/en/uk/it). Each count is a `Group gap="tight"` with its icon (`Eye`, `MessageCircle`, `Mail`) at `iconSize.badge` and an `aria-label` from the existing column labels. If it still overflows, return `BLOCKED — R31 BUDGET` with the per-column widths. Its Story already renders at production width (full-screen, the View's own `MantineDashboardGrid` gutter). Leave the decorator unchanged. | P1 | AC19 |

### 18.4 Acceptance (Revision 3)

**Measurement method (AC17–AC19).**
- Playwright runs against the rebuilt `storybook-static`. The admin Stories now render inside the real `AdminShell` and
  `AdminPageFrame`, so the script uses no synthetic offset.
- It records the card width per cell and asserts that it equals the production card in §18.2a (±1px). A cell with
  any other card width is invalid, not passing.
- It runs at 768, 1024, 1280 and 1440 × sq/en/uk/it. Below 768 it checks that the cards render.
- Write the results to `88-measurements-r3.json`, together with the script.

- **AC17 [R19–R22] replaces AC12.** For `AdminListingsView` `Default` and `Paginated`:
  - each cell has the `TABLE FIT CHECK` of §7.3: no scroll, nothing clipped, first and last inset 24px;
  - the title has at most two lines, and the meta line is present;
  - the date column shows from 1280 and the ID column from 1440 only.

  Also:
  - `WrappedTitleColumn` fits at 768/1024/1440;
  - the audit links compute to 14px;
  - a grep for `calc(` in `AdminListingsView.tsx` and `AdminTable.stories.tsx` prints nothing.
- **AC18 [R23–R25].**
  - The ten `page.tsx` diffs only swap `Box` for `AdminPageFrame` with the R23 props.
  - `Patterns/Mantine/AdminPageFrame` exists and is enrolled.
  - Every R25 Story renders inside `AdminShell`: at 1440 the navbar is visible, and the content's left edge sits at
    240px + the frame gutter.
  - In each R25 Story at 320/390/1024/1440, the top, right and bottom gutter from the `AppShell.Main` content edge equals
    the route's `AdminPageFrame` gutter: 24, or 32 from 1024 for `responsive`; 24 for `xl`. No side is 0 and none is
    doubled.
  - A grep for `StoryPageGutter` in the R25 Story files prints nothing.
- **AC19 [R20, R26–R31].** Each of `AdminUsersTable` (`Default` and the verified tab), `AdminExchangeProvidersView`,
  `AdminPagesView`, `AdminReportsView` (`AllTab`), `AdminCurrenciesView` and `AgentStatisticsView` `Default` gets the
  `TABLE FIT CHECK` at its production card in all four locales. Below 768, cards render. A grep for `width: '` followed
  by a digit and `%` in the seven table files prints nothing.

### 18.5 Re-entry: `remediation` (Revision 3)

- **Start step:** platform line `70-platform-r3.txt`, then:
  1. R19 → R20 → R23 → R24;
  2. the ten `page.tsx` swaps;
  3. R21 → R22 → R25;
  4. R26 → R31;
  5. rebuild Storybook → measurements → the §18.6 gate block → receipts.
- **Do not re-run or overwrite:** evidence `01`–`61` and every `plant-*` file. P1–P6 are not re-run. Opus's `90-*`
  files are read-only.
- **Write set:**
  - `src/design-system/mantine/theme.ts` (R19, one key);
  - `src/components/admin/AdminTable.tsx` (R20);
  - new `src/components/admin/AdminPageFrame.tsx` (R23);
  - the ten `src/app/admin/**/page.tsx` files named in R23 (the `Box` swap and its imports only);
  - `src/components/admin/AdminListingsView.tsx` (R21), `AdminUsersTable.tsx` (R26), `AdminExchangeProvidersView.tsx`
    (R27), `AdminPagesView.tsx` (R28), `AdminReportsView.tsx` (R29), `AdminCurrenciesView.tsx` (R30);
  - `src/modules/cabinet/statistics/components/AgentStatisticsView.tsx` (R31);
  - new `src/stories/_StoryAdminShell.tsx` and new `src/stories/patterns/mantine/AdminPageFrame.stories.tsx`;
  - the Story files named in R24/R25, `AdminTable.stories.tsx` (R22), and `AgentStatisticsView.stories.tsx` (only if a
    fixture needs a longer title);
  - `messages/{sq,en,uk,it}.json`, only for R31's `agt10_col_activity_counts` if that branch is taken;
  - `scripts/mantine-migration-scope.json` (enrol `AdminPageFrame`), `scripts/surface-census-baseline.json` (only lines
    the census names for the touched surfaces), `docs/component-catalog.md` (`AdminPageFrame`, `AdminTable`
    `visibility`/`cardsBelow`);
  - tests that select a deleted column. List each one.
  - the session log ("Revision 3" section), evidence `70`+ with an `-r3` suffix, and the 857 cell of
    `docs/backlog.md`.
- **Forbidden:**
  - `MantineDataTableToCards.tsx`;
  - the legacy managers (`AdminCompaniesManager`, `AdminPropertyTypesManager`, `AdminSupportManager`, `AdminLegalManager`,
    `AdminLocationsManager`, `AdminPopularLocationsManager`), which belong to 916 and 859;
  - the dialogs and their Stories;
  - every R13/R14 file;
  - any `docs/*rule*.md`, `docs/golden-rules.md`, `docs/mantine-responsive-design-system.md`.
- **Negative branches:**
  - If a table cannot meet AC17/AC19 with its R21–R31 layout, stop for that table with
    `BLOCKED — R<n> BUDGET` and the per-column widths. Finish the others.
  - If an R25 Story cannot render inside `AdminShell` (a missing mock), stop with `BLOCKED — R25 SHELL <story>`. Do not
    fall back to `StoryPageGutter`.

### 18.6 Gate block (Revision 3)

```powershell
$ev = "docs\sessions\evidence\task857"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\70-platform-r3.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\listings\page.tsx *>&1 | Tee-Object "$ev\71-census-r3.txt"
npm.cmd run test *>&1 | Tee-Object "$ev\72-tests-r3.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\73-typecheck-r3.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\74-lint-r3.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\75-story-coverage-r3.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\76-rendered-scope-r3.txt"
npm.cmd run check:surface-census:changed -- --base HEAD *>&1 | Tee-Object "$ev\77-census-changed-r3.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\78-design-tokens-r3.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\79-enrolled-tailwind-r3.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\80-i18n-r3.txt"
npm.cmd run check:type-responsive *>&1 | Tee-Object "$ev\81-type-responsive-r3.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\82-file-integrity-r3.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\83-mojibake-r3.txt"
npm.cmd run check:listing-visibility *>&1 | Tee-Object "$ev\83b-listing-visibility-r3.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\84-storybook-build-r3.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\85-build-r3.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\86-status-after-r3.txt"
```

Record every exit code. Normalise the transcripts to UTF-8 without BOM through Node. Write `git hash-object` of every
Revision 3 file to `87-hash-object-r3.txt` in the same pass.

**Expected:** `win32`; the four calibration FAIL lines; every other exit 0. If the whole `npm.cmd run test` run fails on
a file this revision does not touch, record it with its first failing line and run the touched test files alone.
Report both results; do not fix unrelated tests.

### 18.7 Receipts (Revision 3)

- **GR-0:** one each for `tableTitleColumnWidth` (EXTEND `theme.other.layout`), `AdminTable` `'xxl'` + `cardsBelow`
  (EXTEND), `AdminPageFrame` (CREATE: the search shows ten hand-written `Box` wrappers and no shared owner), and
  `withAdminShell` (EXTRACT from `AdminDashboardView.stories.tsx`).
- **GR-3a:** one for `Patterns/Mantine/AdminPageFrame` (CREATE).
- **GR-1:** the census of `src/app/admin/listings/page.tsx`; `check:surface-census:changed` covers the other nine
  surfaces.
- **GR-3b, GR-3c and GR-3d:** one each for every R25 Story, `AdminPageFrame`, `WrappedTitleColumn` and
  `AgentStatisticsView` `Default`, at 320/390/1024/1440 (type also at 768).
- **§7.3 `TABLE FIT CHECK`:** one per table export named in AC17/AC19.
- **GR-2:**
  - `check:design-tokens` cannot see token arithmetic or a percentage width; the AC17/AC19 greps close that.
  - `check:story-coverage` cannot see where a Story renders; AC18's measurement closes that.

### 18.8 Owner matrix after Revision 3 (O78-12, re-issued)

The 38 tuples of §17.8 stay. Added rows:

| Rows | Tuples |
|---|---|
| `AdminUsersTable`, `AdminExchangeProvidersView`, `AdminPagesView`, `AdminReportsView`, `AdminCurrenciesView`, `AgentStatisticsView`: `Default` × sq/uk × 1024/1440 | 24 |
| `AdminInquiriesView`, `AdminPermissionsView`, `AdminUserProfileView` (`View`), `AdminCurrencyTabs`, `AdminPageFrame` (`shell`): `Default` × sq × 1440 | 5 |
| `AdminListingsView` `Default` × uk × 1024 (the production card at its narrowest) | 1 |

**68 tuples.** Opus re-measures every Story in the matrix (GR-3b/3c/3d and §7.3) before the owner sees it.

---

## 19. Review 4 — `NEEDS REVISION`, 2026-10-02 → Revision 4 (R31 only: `AgentStatisticsView` cards to 1024, dates merged)

Opus inspected the real diff, the `-r3` evidence and the session log's "Revision 3" section, and re-measured
independently. Script and raw output: `docs/sessions/evidence/task857/91-opus-review4-measure.{mjs,json}`, `win32`
v22.22.3, the current `storybook-static` (no source file is newer than the build), uk + sq.
- **R19–R30 are verified.** All six admin tables and `WrappedTitleColumn` fit at 768/1024/1280/1440, at the
  production card width: listings 720/720/976/1136, users 720/736/992/1152, the four `page`/`narrow` Views 720/720/960
  (832)/960 (832). The navbar is 240 from 1024. The ten `page.tsx` diffs only swap `Box` for `AdminPageFrame` with
  the R23 props. The `calc(` and percentage-width greps print nothing, and no R25 Story file names `StoryPageGutter`.
- **`npm run test`: 4 failures, none from this task.** `css-var-resolvability` (`--width-content`, Task 869) and
  `appimage-config-class-assertions` are already listed under **790**. `mantine-story-scope.test.ts:20` has been red
  since Task 896 emptied the exact-title hatch at `HEAD`; it is added to 790's row. `globals.css`, `appImageConfig`
  and the hatch are not in this diff.
- **R31 is `NOT IMPLEMENTED`. The table still scrolls**, which confirms the executor's `BLOCKED — R31 BUDGET`. Overflow
  at 768 is +283…+395 and at 1024 is +27…+139, with the card at 678/934.

**Do not touch anything outside the §19.5 write set.** R13–R30, the dialogs, every R25 Story and their evidence stay
as they are.

### 19.1 Owner decision, 2026-10-02 (verbatim option chosen)

Opus asked: *"Which layout should it use?"* The owner chose *"Cards to 1024 + dates merged (Recommended)"*. Its full
text:
- this table shows cards below 1024 instead of 768, an exception to §7.3 rule 2 for this table only;
- expiry and last activity stack in one cell;
- no data is hidden at any width.

Opus recorded the exception in `docs/mantine-responsive-design-system.md` §7.3 rule 2 (named list: `AgentStatisticsView`).

### 19.2 Measured basis (Opus simulation, `91-opus-review4-measure.json` → `agt`)

Columns were hidden in the live DOM, and the table was re-measured.

| Width | Locale | All six columns | Without last activity | Without expires | Without both dates |
|---|---|---|---|---|---|
| 768 (client 676) | sq / en / uk / it | +363 / +283 / +395 / +330 | +151 / +90 / +196 / +129 | +177 / +93 / +208 / +129 | fit / fit / **+9** / fit |
| 1024 (client 932) | sq / en / uk / it | +107 / +27 / +139 / +74 | fit ×4 | fit ×4 | fit ×4 |

- At 768, no layout that shows every value fits, hence the owner's cards-to-1024 decision.
- At 1024, five columns fit in every locale. Natural widths, uk, the tightest: title 212 + status 144 + one date 199 +
  counts 181 + actions 149 = 885, against 932. The merged cell adds an icon (≈20px), so the INFERENCE is that it fits
  with about 27px to spare. Measure it; do not assume.

### 19.3 New requirements

| ID | Observable requirement | P | AC |
|---|---|---|---|
| **R32** | **`MantineDataTableToCards` (EXTEND, `src/design-system/mantine/patterns/MantineDataTableToCards.tsx`).** `cardsBelow` gains `'lg'`. It uses the same CSS switch as `'md'`: `<Box hiddenFrom="lg">{cardsMarkup}</Box><Box visibleFrom="lg">{tableMarkup}</Box>`, with no `useMediaQuery`. Update the prop's JSDoc and the component header comment. `'sm'` and `'md'` output must not change. **Story:** add `CardsBelowLg` to `Mantine/Primitives/Table` (`src/stories/mantine/primitives/Table.stories.tsx`), modelled on `CardsBelowMd` (`:164-195`), with the same fixture and `cardsBelow="lg"`. | P1 | AC20 |
| **R33** | **`AgentStatisticsView` (`src/modules/cabinet/statistics/components/AgentStatisticsView.tsx`).** <br>1. `MantineDataTableToCards` takes `cardsBelow="lg"` (§19.1). <br>2. The `expires` and `activity` columns are replaced by one column. Key `dates`, header `t('agt10_col_dates')`, a new key in sq/en/uk/it: sq `Datat`, en `Dates`, uk `Дати`, it `Date`. Its cell is `Stack gap="tight" align="flex-start"` with two lines: <br>• `Group gap="tight" wrap="nowrap" role="group" aria-label={t('agt10_col_expires')}`, holding `CalendarClock` at `theme.other.iconSize.badge` (`aria-hidden="true"`) and then `expiresCell(row)`; <br>• the same with `aria-label={t('agt10_col_activity')}`, `Activity` and `lastActivityCell(row)`. <br>No `width`, and no `wrap`: each line stays on one row. <br>3. The three `Group`s of the `counts` cell gain `role="group"`. Without a role, ARIA ignores an `aria-label` on a generic `div`, so screen readers never announced it. <br>4. Columns, in order: title · status (+ visibility) · dates · counts · actions. The title column (token width, `wrap`) and the status/visibility stack do not change. <br>5. The card (`card` config, `:383-396`) does not change. It keeps every value separately labelled. <br>6. Remove the R31 comment that calls the counts cell a "fallback". Write one comment that cites §7.3 (b) and the §19.1 decision. | P1 | AC20 |
| **R34** | **`AdminTable.tsx` JSDoc.** The `width` doc example `'40%'` contradicts §7.3 rule 6. Replace it with `theme.other.layout.tableTitleColumnWidth`. This is a comment-only change. | P3 | AC20 |
| **R35** | **Receipts owed from Revision 3 (§18.7).** Write GR-3b, GR-3c and GR-3d receipts for `AgentStatisticsView` `Default` and `AdminTable` `WrappedTitleColumn` at 320/390/1024/1440 (type also at 768), and a GR-3b/3d receipt for `Mantine/Primitives/Table` `CardsBelowLg`. Rewrite the `AgentStatisticsView` `TABLE FIT CHECK` line from the new measurement. The Revision 3 line (`89-receipts-r3.txt:127`) claimed "clipped: NONE; first/last inset 24/24" while its own numbers showed last insets of −339…−3. A receipt must state what its numbers show. | P2 | AC20 |

### 19.4 Acceptance (Revision 4)

- **AC20 [R32–R35].**
  - **`AgentStatisticsView` `Default`, at 1024, 1280 and 1440 × sq/en/uk/it.** The `TABLE FIT CHECK` (§7.3) passes at
    cards of 934/1190/1350 (±1px): no scroll, nothing clipped, first and last inset 24. The headers in order are title ·
    status · dates · counts · actions.
  - **The same Story at 390 and 768 (sq/uk).** No visible `<table>`, and cards render with every labelled value.
  - **`Mantine/Primitives/Table`, at 1000 and 1024 (sq).** `CardsBelowLg` shows cards at 1000 and the table at 1024.
    `CardsBelowMd` and `Default` at 700 and 1024 behave as before the change (cards/table at the same widths).
  - **In the rendered `dates` and `counts` cells,** every `[aria-label]` element has `role="group"` (Playwright).
  - **Greps.** A grep for `'expires'` and `'activity'` as column `key`s in `AgentStatisticsView.tsx` prints nothing. A
    grep for `'40%'` in `AdminTable.tsx` prints nothing.
  - **`check:i18n`** exits 0 with `agt10_col_dates` in all four locales.
  - **R35:** the receipts exist in `99-receipts-r4.txt`.

**Negative branch.** If the `dates` column overflows at 1024 in any locale, stop with `BLOCKED — R33 BUDGET` and the
per-column widths per locale. Do not hide a column, shrink a font or add a width.

### 19.5 Re-entry: `remediation` (Revision 4)

- **Start step:** platform line `92-platform-r4.txt`, then R32 → R33 → R34. Then rebuild Storybook, take the
  measurements (write `98-measure-r4.mjs` and `98-measurements-r4.json`), run the §19.6 gate block, and write the receipts.
- **Do not re-run or overwrite:** evidence `01`–`91` and every `plant-*` file. Opus's `90-*` and `91-*` files are
  read-only.
- **Write set:**
  - `src/design-system/mantine/patterns/MantineDataTableToCards.tsx` (R32, the `'lg'` branch and its comments only);
  - `src/stories/mantine/primitives/Table.stories.tsx` (R32, the `CardsBelowLg` export only);
  - `src/modules/cabinet/statistics/components/AgentStatisticsView.tsx` (R33);
  - `messages/{sq,en,uk,it}.json` (R33, `agt10_col_dates` only). Leave `agt10_col_activity_counts` alone; it stays in use;
  - `src/components/admin/AdminTable.tsx` (R34, one comment);
  - tests that select the removed `expires`/`activity` columns, if any. List each one;
  - `docs/component-catalog.md` (the `MantineDataTableToCards` `cardsBelow` row);
  - the session log ("Revision 4" section), evidence `92`+ with the `-r4` suffix, and the 857 cell of `docs/backlog.md`.
- **Forbidden:** every other file, including every R19–R30 file, every R25 Story, the dialogs, the legacy managers, and
  any `docs/*rule*.md`, `docs/golden-rules.md` or `docs/mantine-responsive-design-system.md`.

### 19.6 Gate block (Revision 4)

```powershell
$ev = "docs\sessions\evidence\task857"
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" | Tee-Object "$ev\92-platform-r4.txt"
node.exe scripts\check-surface-census.mjs --surface src\app\admin\listings\page.tsx *>&1 | Tee-Object "$ev\93-census-r4.txt"
npm.cmd run test *>&1 | Tee-Object "$ev\94-tests-r4.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\95-typecheck-r4.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\95b-lint-r4.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\95c-story-coverage-r4.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\95d-rendered-scope-r4.txt"
npm.cmd run check:surface-census:changed -- --base HEAD *>&1 | Tee-Object "$ev\95e-census-changed-r4.txt"
npm.cmd run check:design-tokens *>&1 | Tee-Object "$ev\95f-design-tokens-r4.txt"
npm.cmd run check:enrolled-tailwind *>&1 | Tee-Object "$ev\95g-enrolled-tailwind-r4.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\95h-i18n-r4.txt"
npm.cmd run check:type-responsive *>&1 | Tee-Object "$ev\95i-type-responsive-r4.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\95j-file-integrity-r4.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\95k-mojibake-r4.txt"
npm.cmd run check:listing-visibility *>&1 | Tee-Object "$ev\95l-listing-visibility-r4.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\96-storybook-build-r4.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\96b-build-r4.txt"
git --no-optional-locks status --porcelain | Tee-Object "$ev\97-status-after-r4.txt"
```

- Record every exit code. Normalise the transcripts to UTF-8 without BOM through Node.
- In the same pass, write `git hash-object` of every Revision 4 file to `97b-hash-object-r4.txt`.
- **Expected:** `win32`; the four calibration FAIL lines; every other gate exits 0.
- **`npm.cmd run test`:** expect the same 4 failures in the three files named at the top of §19 and no others. If any
  other test fails, report it with its first failing line, and run the touched test files alone.

### 19.7 Owner matrix after Revision 4 (O78-12, re-issued)

The 68 tuples of §18.8 stay. In the `AgentStatisticsView` rows, the 1024/1440 table is now the merged-dates layout.
Added rows:

| Rows | Tuples |
|---|---|
| `AgentStatisticsView` `Default` × uk × 768 (cards, the new range) | 1 |
| `Mantine/Primitives/Table` `CardsBelowLg` × sq × 1024 | 1 |

**70 tuples.** Opus re-measures every Story in the matrix (GR-3b/3c/3d and §7.3) before the owner sees it.

---

## 20. Review 5 — `PARTIALLY VERIFIED`, 2026-10-02: implementation verified, owner matrix O78-12 owed

No executor work remains. The only open criterion is the owner's visual review of O78-12 (§19.7, 70 tuples).

**Verified by Opus:**
- **Source.** R32 adds a `'lg'` branch that is the same CSS switch as `'md'`; `'sm'` and `'md'` are untouched. R33's
  columns are title · status · dates · counts · actions, with `cardsBelow="lg"` and five `role="group"` labels, and
  the card config is unchanged. R34 is a comment-only change. `agt10_col_dates` is in all four locales. No live
  caller remains for any of the 15 removed `admin.listings.*` keys.
- **Gates.** Every `-r4` gate exits 0, except the census with its four calibration FAIL lines.
  - `npm run test` timed out on an overloaded machine: an unrelated `node.exe`, PID 39052, has run since 30.09.
  - The sequential full run, `94c`, shows exactly the 4 known failures (790).
- **Independent measurement.** `100-opus-review5-matrix.{mjs,json}` and `100-opus-review5-summary.txt`, `win32`
  v22.22.3, `storybook-static` built after the last source change. It covers every matrix Story at
  320/390/768/1024/1440 × sq/uk, plus `AgentStatisticsView` at 1024/1280/1440 in en/it, plus the Table primitive at
  700/1000/1023. Results:
  - **Fit.** No document overflow and no table scroll in any of the 247 cells.
  - **`AgentStatisticsView`.** It shows cards below 1024. From 1024 the table sits on the production card (934/1190/1350) with 24/24 insets in all four locales.
  - **Table primitive.** `CardsBelowLg` shows cards to 1023 and the table at 1024. `CardsBelowMd` and `Default` are unchanged.
  - **Admin frame (GR-3d).** Every admin Story's frame gutter is 24/24/24/24, or 32 on all sides from 1024 for
    `responsive`. Content sits flush inside the frame, and the navbar is 240 from 1024.
  - **Headings (GR-3c).** No heading exceeds 20px below 640.
  - **Dialogs.** The four dialog sources and Stories are byte-identical to their `58-hash-object-r2.txt` hashes,
    measured in review 2.
- **NOTE (no action).** AC20's "every `[aria-label]` has `role=group`" was over-broad wording by Opus. The
  `<time aria-label>` of the shared `RelativeTime` maps to the ARIA `time` role, which allows an author name.

**Next:** the owner reviews the 70 tuples of §19.7. On acceptance, Opus approves 857 and archives it. On a return,
Opus writes the next revision section.
