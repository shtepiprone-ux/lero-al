# Task 877 — `/admin/currency` finishes on canonical Mantine; the shared `AdminTable` and `AdminPageHeader` become adapters over canonical patterns

Sprint 78 · **P3** · QA profile **Q3** · depends on **874** (approved first) · owner decisions **D78-7, D78-8** ·
owner action **O78-6** · **Status: 🔁 NEEDS REVISION — review 4 (2026-09-29): the Story gutter profile does not match GR-3d; the executor re-enters at §19.2**

Sprint plan: [`Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md`](Sprint_78_Admin_And_Agent_Dashboards_On_Canonical_Mantine.md).

## 1. Mode and task type

`IMPLEMENTATION`, three ordered phases, one route:
- **Phase A:** two canonical patterns are **extended**, and two shared admin components become **thin adapters** over
  them. `AdminTable` (5 consumers after 874) wraps `MantineDataTableToCards`; `AdminPageHeader` (14 consumers, §16.2) wraps
  `MantineDashboardHeader`.
- **Phase B:** the `/admin/currency` surface migrates: container/View splits, Mantine `Tabs`, the page wrapper.
- **Phase C:** deletions (`AdminCardList` and three legacy Stories), the reference audit, and baselines.

Bundles:
- **UI / Mantine current path**;
- **Admin Table / Admin Control**;
- **Storybook / Visual Proof**;
- **Component Catalog / Coverage**;
- **Regression**, for the `Archetype C` admin write-guard row, which is read-only here.

## 2. Objective

- Every node `/admin/currency` renders becomes canonical Mantine: enrolled with its own Story, or a container proven
  by its View's Story.
- The two shared legacy admin components stop producing their own chrome. Every admin page that uses them gets the
  canonical table/cards and the canonical page header **without editing those pages**.

## 3. Verified context — measured 2026-09-24 (re-measure at I0; 874 must have landed)

- **F1 (FACT, census).** `node.exe scripts\check-surface-census.mjs --surface src/app/admin/currency/page.tsx`, full:
  18 nodes, exit 1.
  - Tier-1 unenrolled: `page.tsx` (1 `className`), `AdminCurrencyTabs` (2 / 4 `ui/*` bindings), `AdminPageHeader`
    (4 / 0), `AdminCurrenciesManager` (81 / 10), `AdminExchangeProvidersManager`, `AdminTable` (29 / 5),
    `AdminCardList` (14 / 0).
  - Tier-2: `tabs`, `badge`, `button`, `dialog`, `input`, `label`, `PasswordInput`, `dropdown-menu`.

  After 874, `AdminExchangeProvidersManager` is a container-exempt node with enrolled Views, and `PasswordInput` is
  gone.
- **F2 (FACT) — `AdminTable`** (`src/components/admin/AdminTable.tsx`, 319 lines). Its public API:
  - `AdminTableColumn<Row>`: `key`, `header: ReactNode`, `cell`, `visibility: 'always'|'sm'|'md'|'lg'|'xl'`, `align`,
    `className`, `sortable`, `sortType`, `sortDirection`, `onSort`, `hideable`, `onHideColumn`, `sortLabels`;
  - props: `rows`, `columns`, `rowKey`, `onRowClick`, `rowClassName`, `stickyColumnIndex` (default `0`), `cardRow`
    (→ `StructuredCard {title, subtitle, meta, trailing}`), `emptyState`, `loading`, `loadingState`, `errorState`,
    `ariaLabel`.

  Behaviour:
  - cards below `lg` via `AdminCardList`, and a `<table>` from `lg`;
  - a sticky header (`z-[2]`) and sticky column (`z-[1]`);
  - a keyboard-reachable clickable row (`tabIndex=0`, Enter/Space, `:270-283`) with a trailing chevron column;
  - a right-edge scroll fade (`globals.css:744-762`, `.admin-table-scroll-wrap`).
- **F3 (FACT, complete trace across `src/`).** `sortable`, `sortType`, `sortDirection`, `onSort`, `hideable`,
  `onHideColumn`, `sortLabels`, `loading`, `loadingState` and `errorState` are read by `AdminTable.tsx` and passed
  **only** by the legacy `src/components/admin/AdminTable.stories.tsx`. No production consumer passes any of them.

  The five production consumers after 874 pass:
  - `columns` (`key`, `header`, `cell`, `visibility`, `align`; and `className` in two places:
    `AdminListingsTable.tsx:480` `'w-24'`, `AdminCompaniesManager.tsx:279` `'w-14'`);
  - `rows`, `rowKey`, `cardRow`, `emptyState`;
  - `onRowClick` (Currencies, Companies, PropertyTypes, Support);
  - `ariaLabel` (Listings, Support);
  - `stickyColumnIndex={1}` and `rowClassName` (Listings only, `:709-710`).
- **F4 (FACT) — `AdminCardList`** (115 lines). Its only importer is `AdminTable.tsx`. Clickable cards are
  `role="button" tabIndex=0` with Enter/Space (`:80-87`). A chevron appears automatically when `trailing` is absent.
- **F5 (FACT) — the canonical table pattern.** `MantineDataTableToCards` (`patterns/MantineDataTableToCards.tsx`,
  manifest `:54`, Story `Mantine/Primitives/Table`):
  - cards below `theme.other.mobileGate` (640px), a TailAdmin §6b table above;
  - `columns: {key, label: string, isBadge, badgeColor, align, width, render}`, `rows: {id: string}[]`,
    `emptyLabel: string`, `rowClassName`, `card: CardConfig {id, actions, avatar, title, subtitle, badge, meta[]}`,
    `tableHeader`;
  - **no** row click, per-column breakpoint, sticky column or free-form card body.

  Its only production consumer is `AdminUsersTable.tsx`, with a smoke test at
  `src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx`.
- **F6 (FACT) — `AdminPageHeader`** (17 lines): `div.admin-page-header` with `h1 text-2xl font-bold` and
  `p text-sm text-muted-foreground mt-0.5`, `action` on the right, `mb-6`.

  **Corrected at review 1 (§16.2):** it has **14 production consumers**, 13 `src/app/admin/**/page.tsx` plus
  `AdminUserCreate.tsx`. The design-time "16" and the owner's "17" were both miscounts.

  `MantineDashboardHeader` (`patterns/MantineDashboardHeader.tsx`, manifest `:91`, Story
  `Patterns/Mantine/DashboardHeader`) is the canonical page header. Its own doc (`:28-30`) says title
  `Title order={1} size="h4"` is *"what `AdminPageHeader` renders today"* and the subtitle is `Text size="sm"
  c="gray.5"`. It has slots for `periodControl` / `updatedAtLabel` / `stale`, but **no generic actions slot**.
  `scripts/story-coverage-exempt.json:10` exempts `AdminPageHeader`.
- **F7 (FACT) — `AdminCurrenciesManager`** (465 lines).
  - Exports: the container `AdminCurrenciesManager({ initialCurrencies })` (`:252`) and the container
    `CurrencyFormDialog({ initial, onClose, onSaved })` (`:34`).
  - The internal `CurrencyDetailDialog` (`:166-244`) is presentational.
  - Actions: `create`/`update`/`delete`/`toggleCurrencyActive`/`setDefaultCurrency`, with `default_currency` /
    `duplicate_code` error mapping.
  - A client search filter (`:263-271`); a row or code click opens the detail dialog; a delete confirm.
  - Badges use `bg-badge-premium` (`globals.css:479`, gold ≈ `#D97706`, which is **not** a theme tuple shade) for
    "default", and default/secondary for active/inactive.
  - It renders `RelativeTime`, which is enrolled.
  - Legacy Story `src/components/admin/AdminCurrenciesManager.stories.tsx`.
- **F8 (FACT).** `AdminCurrencyTabs` (32 lines) wraps both managers in legacy `ui/tabs`, and uses only
  `useTranslations`. The canonical Story is `Mantine/Primitives/Tabs`.

  `page.tsx` is a server component, with the wrapper `<div className="p-6 lg:p-8 max-w-5xl mx-auto">`. The same
  wrapper is on 16 admin pages (`grep -rl "p-6 lg:p-8" src/app/admin`).

  Route roots keep their own census key as baselined debt: precedent
  `src/app/[locale]/favorites/page.tsx :: … :: tier1` at `scripts/surface-census-baseline.json:130`.
- **F9 (FACT, tokens).** Theme spacing (`theme.ts`) has `xl` = 1.5rem and `2xl` = 2rem (`:548`, `:553`).
  - There is **no** token for 64rem as a content width; the only `64rem` is `other.layout.lightboxMediaMaxWidth`,
    whose role is different (`:649`).
  - ~~There is no z-index token.~~ **Corrected at review 1 (§16.2):** `theme.other.zIndex` exists (Task 879, `theme.ts:150` type, `:699-701` value `siteHeader: 30`).
  - D71-4 (Sprint 71): *"raw px never acceptable — create the token"*. Precedent: Task 825 created
    `lightboxMediaMaxWidth` from the legacy `max-w-5xl`.
- **F10 (FACT, TailAdmin).** `docs/tailadmin-style-reference.md:74`: a status badge is `Badge` pill, `size sm`,
  `variant light`, `color = success/warning/error`. `:434`: the measured `/badge` page includes the primary (brand)
  light variant.
- **F11 (FACT) — live references to what Phase C deletes or replaces.** Historical folders are excluded:
  `docs/sessions`, `docs/reviews/artifacts`, `docs/governance-reports`, `docs/chat-gpt-reports`, `tasks`.
  - `scripts/check-stories-rendered.mjs:138`, `:140`, `:153`: legacy story ids. The script is **retired**: edit its
    rows, never run it.
  - `scripts/check-locale-leak.mjs:164-167`: the `admin-admintable` / `admin-admincardlist` allowlist keys.
  - `scripts/story-realmode-allowlist.json:8`: the `AdminCurrenciesManager` legacy export (`check:stories` has a
    stale-entry check).
  - `scripts/story-coverage-exempt.json:10`: `AdminPageHeader`.
  - `src/app/globals.css:744-762`: `.admin-table-scroll-wrap`.
  - Docs: `docs/component-coverage-matrix.md`, `docs/component-catalog.md`, `docs/responsive-storybook-inventory.md`,
    `docs/storybook-governance.md`, `docs/design-system.md`, `docs/admin-ux-rules.md`, `docs/component-governance.md`.
    The executor lists each hit at I0. **Review 1 (§16.2):** `docs/mantine-tailadmin-migration-tracker.md:192` is also
    a live hit; `component-coverage-matrix.md` and `component-governance.md` have no hit.

  `scripts/__tests__/mantine-story-scope.test.ts:23`, `:46` use `'Admin/AdminCardList'` only as a **title string**
  in a negative test; they stay. The comments in `scripts/check-design-tokens.mjs:926`, `:1256` stay.
- **F12 (FACT).** `docs/critical-flow-registry.md:85` ("Archetype C: Admin/moderator write guard", `createCurrency`)
  is guarded by `npm run test:rls-guards`. The server actions do not change.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | F2, F3, F5, D78-8 | **EXTEND `MantineDataTableToCards`**, additive and optional, so `AdminUsersTable` is unchanged:<br>• `onRowClick?(row)`: the table row and the card get click, `tabIndex=0` and Enter/Space (the F2/F4 behaviour), plus Mantine `highlightOnHover` on the table. When set, an `aria-hidden` chevron is added (table: its own trailing column; card: only when `actions` returns nothing — the F4 rule, §16.2) at `theme.other.iconSize.compact`, `c="gray.4"`.<br>• `TableColumn.visibleFrom?: MantineBreakpoint`, applied to `Table.Th`/`Table.Td`.<br>• `stickyColumnIndex?: number`: `pos="sticky" left={0}`, body background, z-index from the new role `theme.other.zIndex.tableStickyColumn = 1` in the existing Task 879 `zIndex` map (§16.2) (legacy `z-[1]`, D71-4). Use Mantine `Table stickyHeader` for the header.<br>• `CardConfig.detail?(row): ReactNode`, a free-form region below one divider, used where `meta[]` is absent.<br>• `emptyLabel` and `TableColumn.label` widen to `ReactNode`.<br>• `ariaLabel?` on `Table`.<br>The pattern's own Story `Mantine/Primitives/Table` gains exports `RowClick`, `ResponsiveColumns`, `StickyColumn` and `CardDetail`. | P0 | AC1, AC2 | Confirmed |
| **R2** | F2, F3, F4, D78-8 | **`AdminTable` becomes an adapter.** Same path, same `AdminTableColumn`/prop names **minus** the F3 dead ones. It renders only `<MantineDataTableToCards>`:<br>• `rowKey` → a string `id` wrapper, unwrapped in `render`/`card`;<br>• `header` → `label`, `cell` → `render`, `visibility` → `visibleFrom`, `align` → `align`;<br>• `cardRow` → `CardConfig` (`title`, `subtitle`, `meta` → `detail`, `trailing` → `actions`);<br>• with no `cardRow`, the legacy `synthesizeCard` rule (`:104-127`), rebuilt from Mantine `Group`;<br>• `onRowClick`, `rowClassName`, `stickyColumnIndex` and `ariaLabel` passed through; `emptyState` → `emptyLabel`.<br>Column `className` is **not** forwarded (§5 item 3). The result has 0 `className`, 0 `@/components/ui/*` imports and no `AdminCardList` import. It has its own Story, `Patterns/Mantine/AdminTable` (`Default`, `Synthesized`, `Empty`, `RowClick`), and a manifest entry. | P0 | AC3, AC4, AC11 | Confirmed |
| **R3** | F6, D78-8 | **EXTEND `MantineDashboardHeader`** with `actions?: ReactNode`, rendered at the right end of the right column (below `sm`, after the status line and period control, full width). Its Story gains `WithActions`. **`AdminPageHeader` becomes an adapter** with the same props: `<Box mb="xl"><MantineDashboardHeader title subtitle actions={action} /></Box>`. It has 0 `className`, its own Story `Patterns/Mantine/AdminPageHeader` (`Default`, `WithAction`) and a manifest entry. Its `story-coverage-exempt.json` row is removed. | P1 | AC5 | Confirmed |
| **R4** | F7, component-rules P0 | **`AdminCurrenciesManager.tsx` splits.** The containers `AdminCurrenciesManager` and `CurrencyFormDialog` keep their exported APIs. All state, actions, `toast` and error mapping stay unchanged, and each renders only its View. They have 0 `className` and 0 `ui/*` imports. The Views:<br>• `src/components/admin/AdminCurrenciesView.tsx`: search `TextInput` with a `Search` `leftSection`, the "new" `Button` (`loading`), `AdminTable` (R2) with today's columns and `cardRow`, the delete `MantineModal`, and `CurrencyDetailDialogView` when a detail target is set;<br>• `src/components/admin/CurrencyFormDialogView.tsx`: a controlled `MantineModal`; `TextInput` for code (`disabled` when editing, upper-cased by the container as today), symbol and the four names; `TextInput type="number"` for decimals (0–8);<br>• `src/components/admin/CurrencyDetailDialogView.tsx`: the old `CurrencyDetailDialog` on `MantineModal`; fields in a `SimpleGrid cols={2}` with `Text size="xs" c="dimmed"` labels; the same footer actions and conditions.<br>Badges: "default" → `Badge size="sm" variant="light" color="brand"` (F10 primary); active/inactive → `color="green"` / `color="gray"`, `size="sm" variant="light"` (F10 status). Each View has its own Story and a manifest entry: `Patterns/Mantine/AdminCurrenciesView` (`Default`, `Empty`, `DeleteConfirm`, `Detail`), `…/CurrencyFormDialogView` (`New`, `Edit`, `Submitting`), `…/CurrencyDetailDialogView` (`Default`, `DefaultCurrency`, `Inactive`). | P0 | AC6, AC7, AC11 | Confirmed |
| **R5** | F8 | **`AdminCurrencyTabs`** becomes presentational, with slots `currencies: ReactNode` and `providers: ReactNode`. It uses Mantine `Tabs` (`defaultValue="currencies"`, the same keys `tab_currencies`/`tab_providers`), has 0 `className`, its own Story `Patterns/Mantine/AdminCurrencyTabs` (`Default`: the real `AdminCurrenciesView` and `AdminExchangeProvidersView` from 874, fed by fixtures), and a manifest entry. **`page.tsx`** passes the two containers into the slots and replaces its wrapper `div` with `<Box p={{ base: 'xl', lg: '2xl' }} maw={theme token} mx="auto">`. The width token is the new `theme.other.layout.adminPageMaxWidth = '64rem'` (legacy `max-w-5xl`, D71-4), read through a CSS variable or theme helper that works in a server component. `page.tsx`'s own census key stays baselined (route root, F8). | P1 | AC8 | Confirmed |
| **R6** | F4, F11, clause 9 | **Phase C deletions:** `AdminCardList.tsx`, `AdminCardList.stories.tsx`, `AdminTable.stories.tsx` (legacy `Admin/AdminTable`), and `AdminCurrenciesManager.stories.tsx` (legacy). Remove `.admin-table-scroll-wrap` from `globals.css` once it has no user. Update every F11 live reference as §10.5 states. | P1 | AC9 | Confirmed |
| **R7** | F7, F2 | Tests, with plants whose transcripts are kept:<br>• **T1** `src/components/admin/__tests__/AdminCurrenciesManager.smoke.test.tsx`: create, the validation toast, toggle, set default, delete and detail flows, with the actions module and `toast` mocked;<br>• **T2** `src/components/admin/__tests__/AdminTable.adapter.test.tsx`: Enter on a focused row calls `onRowClick`; `visibility:'md'` renders `visibleFrom="md"`; with no `cardRow` the synthesized card shows the column-0 title;<br>• the existing `AdminUsersTable.smoke.test.tsx` passes unchanged (proof that R1 is additive). | P0 | AC10 | Confirmed |
| **R8** | F1, F11 | `scripts/surface-census-baseline.json` is regenerated with the house updater. Every removed key must belong to one of the §10.6 classes, and **no key may be added**. `scripts/rendered-scope-baseline.json` stays unchanged. Anything else is `SCOPE GUARD FAILED`. | P0 | AC11 | Confirmed (class-bounded, §5 item 5) |

## 5. Assumptions and open questions

1. **DECIDED — D78-8 (owner, 2026-09-24), two answers.**
   - The question was *"877: AdminPageHeader (17 lines, 3 Tailwind classNames) is shared by 17 admin pages. How should
     877 handle it?"*. The option chosen, verbatim: *"Migrate shared file (Recommended)"*. The option read: *"Rewrite
     AdminPageHeader in place on Mantine (Group/Title/Text, same props) with its own Story and manifest entry. All 17
     admin pages get the canonical header at once, and the owner matrix checks it on 2-3 of them."*
   - The question was *"877: AdminCurrenciesManager … renders the shared legacy AdminTable. How should it get its
     table?"*. The option chosen: *"Migrate shared AdminTable"*. The option read: *"877 also rewrites AdminTable +
     AdminCardList on Mantine, which changes the tables of all 5 remaining admin managers at once. Much larger blast
     radius and a larger owner matrix."*
   - **How GR-0 reads this.** A Mantine re-implementation of either component written inside the component would copy
     markup that already exists in a canonical pattern (F5, F6). So "rewrite on Mantine" is delivered as an **adapter
     over the extended canonical pattern**. The owner's "Group/Title/Text" is exactly `MantineDashboardHeader`'s
     anatomy (F6).
2. **Authorized visual changes on the 5 table pages and 14 header consumers** (inside D78-8's stated blast radius):
   - Cards switch at **640px** (canonical) instead of 1024px, so 640–1023px now shows the table.
   - Card anatomy becomes `CardConfig` (actions in the header row, `detail` below one divider).
   - The scroll fade is replaced by the `ScrollArea` scrollbar.
   - The page title is weight 600 at `h4` (24px), instead of 700, and the subtitle is `gray.5`.
   - The "default currency" badge becomes brand-light instead of gold (F7, F10).

   Everything else stays reachable, including row click with its keyboard equivalent, the chevron, the sticky column
   and column hiding.
3. **Column `className` is not forwarded.** Only two width utilities use it (F3). Table columns size to their content,
   and each consumer's own migration task sets widths with `TableColumn.width`. `rowClassName` is still forwarded,
   because the pattern already supports it.
4. **Dead API removed.** The F3 props (sorting, hiding, loading, error) have no production consumer, and removing them
   changes no rendered page. The legacy Story that exercised them is deleted (R6).
5. **INFERENCE (R8).** The exact set of removed baseline keys depends on the post-change render graph, which cannot be
   simulated before the files exist. §10.6 therefore bounds the set by class, not by count, and has a stop branch.

## 6. Pre-read rule bundle

- `docs/golden-rules.md`: GR-0 to GR-6, including GR-1's container exemption.
- `docs/agent-contract.md`: clauses 3, 5, 7, 9, 11, 13, 14, 15, 16b–16d.
- `docs/component-rules.md`: "Container / Presentational Primitive Split", "Storybook-First Implementation".
- `docs/mantine-responsive-design-system.md`; `docs/tailadmin-style-reference.md` §2, §4, §6 (line 74), §6b, §6c.
- `docs/admin-ux-rules.md`: the table and dialog rows for the five managers.
- `docs/storybook-governance.md`: canonical titles, toolbar locale/viewport, no duplicate pages.
- `docs/critical-flow-registry.md:85`.
- `docs/qa-profiles.md`: the Q3 row.
- The 874 kickoff: its View/container precedent (`tasks/Archive/Sprint_78_kickoff_prompt_Task_874_…`, approved 2026-09-29).

## 7. Scope

**Phase A:**
- `src/design-system/mantine/patterns/MantineDataTableToCards.tsx`: R1
- `src/design-system/mantine/patterns/MantineDashboardHeader.tsx`: R3
- `src/design-system/mantine/theme.ts`: the two new tokens only (`other.zIndex.tableStickyColumn`,
  `other.layout.adminPageMaxWidth`) and their type entries
- `src/stories/mantine/primitives/Table.stories.tsx`, `src/stories/patterns/mantine/DashboardHeader.stories.tsx`: new
  exports only
- `src/components/admin/AdminTable.tsx`, `src/components/admin/AdminPageHeader.tsx`: R2, R3
- `src/stories/patterns/mantine/AdminTable.stories.tsx`, `src/stories/patterns/mantine/AdminPageHeader.stories.tsx`
  *(new)*

**Phase B:**
- `src/components/admin/AdminCurrenciesManager.tsx`; new `AdminCurrenciesView.tsx`, `CurrencyFormDialogView.tsx`,
  `CurrencyDetailDialogView.tsx`; `src/components/admin/AdminCurrencyTabs.tsx`; `src/app/admin/currency/page.tsx`
- New Stories `Patterns/Mantine/AdminCurrenciesView`, `…/CurrencyFormDialogView`, `…/CurrencyDetailDialogView`,
  `…/AdminCurrencyTabs` under `src/stories/patterns/mantine/`
- `scripts/mantine-migration-scope.json`: exactly 6 new entries: `AdminTable`, `AdminPageHeader`,
  `AdminCurrenciesView`, `CurrencyFormDialogView`, `CurrencyDetailDialogView`, `AdminCurrencyTabs`.

**Phase C:**
- The four R6 deletions, the `globals.css` block, and the F11 files, each only at the cited rows
- New tests T1, T2
- `scripts/surface-census-baseline.json`: R8, updater only

**All phases:**
- `messages/*.json`: only if a View needs a key that does not exist. List it, add it in all four locales, and expect
  none, because all strings exist today.
- `docs/sessions/2026-09-2?-task877-*.md`, `docs/sessions/evidence/task877/**`
- `docs/backlog.md`: the 877 state cell only

## 8. Out of scope

- The **five consumer files** of `AdminTable` and the **13 admin pages + `AdminUserCreate`** (§16.2) that consume
  `AdminPageHeader`. None of them is edited. Their surfaces change only through the two adapters, and each will get
  its own migration task.
- The `p-6 lg:p-8 max-w-5xl` wrapper on the other 15 admin pages.
- The server actions.
- `AdminUsersTable.tsx`, which is unchanged, as T-existing proves.
- The `ui/*` primitive files.
- `scripts/rendered-scope-baseline.json`.

## 9. Current and required behavior

| | Current | Required |
|---|---|---|
| Admin tables (5 pages) <640px | legacy card list | canonical `CardConfig` cards; the row click and keyboard are unchanged |
| Admin tables 640–1023px | legacy card list | canonical table (§5 item 2) |
| Admin tables ≥1024px | legacy table, sticky header/column, fade | canonical table; `stickyHeader`; sticky column (Listings: column 1); `ScrollArea` |
| Row click (4 managers) | mouse + Enter/Space, chevron | same |
| Admin page header (14 consumers) | legacy `h1` 24/700 + muted subtitle, `mb-6` | `MantineDashboardHeader` 24/600 + `gray.5`, `mb="xl"` (24px) |
| `/admin/currency` tabs | legacy `ui/tabs` | Mantine `Tabs` (TailAdmin §6c through theme) |
| Currencies: search / new / detail / form / delete / toggle / set default | legacy | the same flows, texts and error toasts, on the Views |
| "default" badge | gold | brand-light (§5 item 2) |

## 10. Implementation requirements

### 10.1 I0

1. Record the platform (`win32`), then save the dirty-tree snapshot and the hash of every modified path:
   `git --no-optional-locks status --porcelain`, plus `git hash-object` of every ` M` path, go to
   `01-status-before.txt`.
2. **874 has landed:** `AdminExchangeProvidersManager.tsx` imports neither `AdminTable` nor `@/components/ui/`, and
   `src/components/ui/PasswordInput.tsx` does not exist. If either check fails, return `BLOCKED — 874 FIRST`.
3. Re-run the F1 census **in full** → `02a-census-page.txt`. Re-run the F3 trace (the dead-prop grep, and each
   consumer's `AdminTable` props) → `02b-admintable-usage.txt`. Re-run the F6 consumer list →
   `02c-pageheader-consumers.txt`. Re-run the F11 reference search, with `--untracked` excluded because nothing is
   created yet → `02d-references-before.txt`.
4. **PREMISE DRIFT, stop:** any new production use of an F3 dead prop, a sixth `AdminTable` consumer, or a new
   `AdminPageHeader` prop.

### 10.2 GR receipts, before each phase's first related write

- **GR-0:** one receipt per changed or new file.
  - R1: `EXTEND MantineDataTableToCards`. R3: `EXTEND MantineDashboardHeader`.
  - R2/R3 adapters: `COMPOSE`.
  - R4/R5 Views: `COMPOSE` of `MantineModal`, `TextInput`, `Button`, `Badge`, `SimpleGrid`, `Tabs`, `AdminTable`,
    `RelativeTime`.
  - Tokens: the two new tokens are the only new values, each carrying its legacy provenance (F9).
- **GR-3a:** one receipt per new Story and per extended Story. The legacy `Admin/*` Stories are **not** canonical
  candidates; they are deleted.
- **GR-3:** each changed or new visible component ← its own Story file (R1–R5).
- **GR-1, at the end:**
  `GR-1 CENSUS COMPLETE — <n> nodes; tier1 <a> migrated+enrolled+story (AdminTable, AdminPageHeader, AdminCurrencyTabs, AdminCurrenciesView, CurrencyFormDialogView, CurrencyDetailDialogView …) + <e> container-exempt (AdminCurrenciesManager, AdminExchangeProvidersManager); page.tsx route root baselined; tier2 <b> imports removed; tier3 0.`
  AdminCardList is deleted, so it is no longer a node.

### 10.3 Phase order and checkpoints

1. **Phase A**, then its checkpoint:
   - `typecheck` and `AdminUsersTable.smoke.test.tsx` pass;
   - `check:story-coverage` exits 0;
   - save `A-checkpoint.txt`.

   If `AdminUsersTable` changes behaviour, stop: R1 must be additive.
2. **Phase B**, then its checkpoint: `typecheck` and T1 pass → `B-checkpoint.txt`.
3. **Phase C**, then the §13.2 gate block.

### 10.4 Rules

- The new and changed files have no `className`, `style` object with a visual value, CSS module, raw px/hex or
  arbitrary utility. A non-visual mechanism is recorded in the session log with its reason, as in 878's ledger rule.
- The only new theme keys are `other.zIndex.tableStickyColumn` (a new role in the existing Task 879 map, §16.2) and `other.layout.adminPageMaxWidth`. Any other missing
  token means stopping with `CANONICAL STYLE DECISION REQUIRED`.
- UTF-8 without BOM. Use the Edit tool or Node `fs`. Every multi-file mechanical write needs a relative-path manifest
  (clause 14).

### 10.5 Reference updates (R6)

| Reference | Action |
|---|---|
| `check-stories-rendered.mjs:138, :140, :153` | delete the three rows (retired script, **not run**) |
| `check-locale-leak.mjs:164-167` | delete the two legacy keys. If the new Stories render raw fixture role strings, add the **new** story-id prefixes with the same reason (measure with `check:locale-leak`). |
| `story-realmode-allowlist.json:8` | delete the row |
| `story-coverage-exempt.json:10` | delete the row |
| `globals.css:744-762` | delete the block after the grep shows no user |
| docs listed in F11 | update each row to the migrated state, or remove it; one line per edit in the session log |

### 10.6 R8 — the allowed classes of removed keys

A removed `scripts/surface-census-baseline.json` key must match one of these:
1. `* :: src/components/admin/AdminPageHeader.tsx :: tier1-unenrolled-or-unstoried`;
2. `* :: src/components/admin/AdminTable.tsx :: *` or `* :: src/components/admin/AdminCardList.tsx :: *`;
3. `src/app/admin/currency/page.tsx :: <AdminCurrencyTabs | AdminCurrenciesManager | a ui/* primitive> :: *`;
4. `<one of the 5 AdminTable consumer pages> :: src/components/ui/dropdown-menu.tsx :: tier2-legacy-primitive`, when
   that page's only importer of it was `AdminTable`;
5. `* :: src/components/shared/RelativeTime.tsx :: *`, which has been enrolled since 844 and was carried.

**Added keys: 0.** Refused tier-2: 0.

Record every removed key with its class number in `03b-removed-keys-classified.txt`. An unclassifiable key is
`SCOPE GUARD FAILED`.

## 11. Positive and negative flows

**Positive.**
1. An admin opens `/admin/currency`. The canonical page header and Mantine tabs show.
2. They search for "EU", open EUR's detail, set it as default, edit its Italian name, and save.
3. On the Providers tab, 874's View is unchanged.
4. On `/admin/listings` the table has a sticky title column and keeps its row actions. Below 640px, the cards open
   the same targets.

| Branch | Applicable | Source | Expected | Evidence |
|---|---:|---|---|---|
| Empty list / no search match | Yes | F7 | `emptyLabel` text | Story `Empty`; T1 |
| Delete the default currency | Yes | F7 `default_currency` | `delete_blocked` toast | T1 |
| Deactivate the default | Yes | F7 | `error_default_required` toast | T1 |
| Duplicate code | Yes | F7 | `error_code_duplicate` | T1 |
| Keyboard row activation | Yes | F2/F4 | Enter/Space opens the target | T2 |
| Archived listing rows (Listings `rowClassName`) | Yes | F3 | still forwarded | O78-6 (`Admin/AdminListingsTable`) |
| Admin/moderator guard | No — server actions unchanged | F12 | — | `test:rls-guards` regression |

## 12. Acceptance criteria

- **AC1 [R1]** Given the pattern diff, when read, then every new prop is optional, and with none of them passed the
  render is unchanged: `AdminUsersTable.smoke.test.tsx` passes unchanged. The four new Story exports exist.
- **AC2 [R1]** Given the `StickyColumn` export at 1440px, when rendered, then the column stays in place while the
  table scrolls horizontally. The owner checks this in O78-6.
- **AC3 [R2]** Given `AdminTable.tsx`, when read, then:
  - it imports only React, the pattern and Mantine;
  - it has 0 `className` and no `ui/*` or `AdminCardList` import;
  - `AdminTableColumn` no longer declares the F3 dead fields;
  - `typecheck` exits 0 across the five unchanged consumers.
- **AC4 [R2, R7]** Given T2, when run, then it passes, and each plant fails it:
  - **P1:** remove the Enter/Space handler in the pattern;
  - **P2:** map `visibility` to nothing.

  Transcripts and hash witnesses are kept.
- **AC5 [R3]** Given `AdminPageHeader.tsx`, when read, then it renders only `Box` + `MantineDashboardHeader`, and its
  props are unchanged. `check:story-coverage` exits 0 with the exemption row removed.
- **AC6 [R4]** Given the containers, when read, then they have 0 `className` and 0 `ui/*` imports, and each renders
  only its View. Given the Views, when read, then they import no server action or `toast`.
- **AC7 [R4, R7]** Given T1, when run, then every flow case passes, and each plant fails it:
  - **P3:** drop `setDefaultCurrency`'s state update;
  - **P4:** drop the `default_currency` error mapping in `handleDelete`.

  Transcripts are kept.
- **AC8 [R5]** Given `AdminCurrencyTabs.tsx` and `page.tsx`, when read, then:
  - the tabs use Mantine `Tabs` with slots;
  - the page wrapper is a `Box` with `xl`/`2xl` padding and the `adminPageMaxWidth` token;
  - the admin route build output lists `/admin/currency`.
- **AC9 [R6]** Given an `--untracked` `git grep` for `AdminCardList|admin-admintable|admin-admincardlist|admin-admincurrenciesmanager|admin-table-scroll`
  outside F11's historical folders, when run, then it returns no line. The four deleted paths show as `D`, and
  `check:stories` exits 0.
- **AC10 [R7]** Given `npm.cmd run test:rls-guards` and `AdminUsersTable.smoke.test.tsx`, when run, then both exit 0.
- **AC11 [R8]** Given `03-baseline-diff.txt` and `03b-removed-keys-classified.txt`, when read, then:
  - every removed key has a §10.6 class, and 0 keys are added;
  - the rendered-scope baseline is unchanged;
  - `check:surface-census:changed --base` (and `:verify`) and `check:rendered-scope` (and `:verify`) exit 0.
- **AC12 [all]** Given the §13.2 block, when run, then:
  - `lint`, `check:i18n`, `build-storybook`, `check:file-integrity`, `check:mojibake` and `npm run build` exit 0;
  - the final status lists no path outside §7 beyond those in `01-status-before.txt`;
  - `governance:tailwind` is recorded, not asserted, because it was red at HEAD before this task;
  - `check:locale-leak:mantine-only` (`24b`, which reads `storybook-static`, so it runs after `24`) is recorded, not
    asserted, because it is non-deterministic run to run (836). Any leak line naming a **new** 877 Story id is
    reviewed individually.
- **AC13 [Objective] — owner, before approval (O78-6):** the §13.3 matrix.

`GR-4 AC AUDIT — 13 criteria; each states an observable property; absolutes: AC3/AC6 "0 className / 0 ui imports" are the enforced adapter/container conditions; AC9 greps with --untracked (864); AC11 is class-bounded with a stop branch, not a count.`

## 13. QA profile and verification plan

**Q3:** two canonical patterns extended, two shared admin components converted (21 consumer surfaces affected
visually), and one admin surface migrated. The owner matrix is the visual criterion. `test:rls-guards` guards the one
related critical-flow row.

### 13.1 Re-entry

From scratch, after 874. Evidence root: `docs/sessions/evidence/task877/`.

### 13.2 Gate block (executor, Windows PowerShell, project root, after Phase C)

```powershell
$ev = "docs\sessions\evidence\task877"
$base = git --no-optional-locks rev-parse HEAD
node.exe scripts\check-surface-census-changed.mjs --base $base --update-baseline *>&1 | Tee-Object "$ev\03a-census-update-baseline.txt"
git --no-optional-locks diff -- scripts/surface-census-baseline.json scripts/rendered-scope-baseline.json *>&1 | Tee-Object "$ev\03-baseline-diff.txt"
node.exe -p "process.platform + ' ' + process.version" *>&1 | Tee-Object "$ev\10-platform.txt"
npx.cmd vitest run src/components/admin/__tests__/AdminCurrenciesManager.smoke.test.tsx src/components/admin/__tests__/AdminTable.adapter.test.tsx src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx *>&1 | Tee-Object "$ev\11-tests.txt"
npm.cmd run test:rls-guards *>&1 | Tee-Object "$ev\12-rls-guards.txt"
npm.cmd run typecheck *>&1 | Tee-Object "$ev\13-typecheck.txt"
npm.cmd run lint *>&1 | Tee-Object "$ev\14-lint.txt"
npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\15-story-coverage.txt"
node.exe scripts\check-surface-census.mjs --surface src/app/admin/currency/page.tsx *>&1 | Tee-Object "$ev\16-census-page.txt"
npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\17-rendered-scope.txt"
npm.cmd run check:rendered-scope:verify *>&1 | Tee-Object "$ev\18-rendered-scope-verify.txt"
node.exe scripts\check-surface-census-changed.mjs --base $base *>&1 | Tee-Object "$ev\19-census-changed.txt"
npm.cmd run check:surface-census:changed:verify *>&1 | Tee-Object "$ev\20-census-changed-verify.txt"
npm.cmd run check:i18n *>&1 | Tee-Object "$ev\21-i18n.txt"
npm.cmd run check:stories *>&1 | Tee-Object "$ev\22-check-stories.txt"
npm.cmd run governance:tailwind *>&1 | Tee-Object "$ev\23b-governance-tailwind.txt"
git --no-optional-locks grep --untracked -n -E "AdminCardList|admin-admintable|admin-admincardlist|admin-admincurrenciesmanager|admin-table-scroll" -- . ":(exclude)docs/sessions" ":(exclude)docs/reviews" ":(exclude)docs/governance-reports" ":(exclude)docs/chat-gpt-reports" ":(exclude)docs/backlog*.md" ":(exclude)tasks" ":(exclude)scripts/__tests__/mantine-story-scope.test.ts" *>&1 | Tee-Object "$ev\23c-references-after.txt"
npm.cmd run build-storybook *>&1 | Tee-Object "$ev\24-build-storybook.txt"
npm.cmd run check:locale-leak:mantine-only *>&1 | Tee-Object "$ev\24b-locale-leak.txt"
npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\25-file-integrity.txt"
npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\26-mojibake.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\27-build.txt"
git --no-optional-locks status --porcelain *>&1 | Tee-Object "$ev\29-status-after.txt"
```

After each command, append `"EXIT_CODE=$LASTEXITCODE" | Add-Content <file>`.

Then:
- write `03b-removed-keys-classified.txt` (§10.6);
- record `git hash-object` of every created or changed file in `28-hash-object.txt`;
- run plants P1–P4 in the 876/874 order (pre-hash → Edit → run → `EXIT_CODE` → restore → post-hash), saving
  `plant-p{1..4}-{pre-hash,run,post-hash}.txt`;
- re-run `11` as `11b`.

Expected results:
- `03a` exits 0 with no refusal.
- `11` and `12` pass.
- `13`–`15` exit 0.
- `16` exits 1 with FAIL lines only for `page.tsx` (route root) and the container-exempt managers.
- `17`–`22` exit 0.
- `23b` is recorded.
- `23c` is empty.
- `24` and `25`–`27` exit 0.
- `24b` is recorded.
- Each plant run has `EXIT_CODE=1`, and each post-hash equals its pre-hash.

### 13.3 Owner steps

1. **O78-6 — `OWNER VISUAL QA REQUIRED`, before approval.** Toolbar locales: `en` and `uk` at every width listed;
   `sq` and `it` at 390 only.

   | Story | Exports | Widths |
   |---|---|---|
   | `Mantine/Primitives/Table` | `RowClick`, `ResponsiveColumns`, `StickyColumn`, `CardDetail` | 390, 768, 1440 |
   | `Mantine/Primitives/Table` (§16.3 item 3) | `Default` (the card subtitle is now a `div`) | 390 |
   | `Patterns/Mantine/DashboardHeader` | `WithActions` | 390, 1440 |
   | `Patterns/Mantine/AdminTable` | all 4 | 390, 768, 1440 |
   | `Patterns/Mantine/AdminPageHeader` | both | 390, 1440 |
   | `Patterns/Mantine/AdminCurrenciesView` | all 4 | 390, 1440 |
   | `Patterns/Mantine/CurrencyFormDialogView` | all 3 | 390, 1440 |
   | `Patterns/Mantine/CurrencyDetailDialogView` | all 3 | 390, 1440 |
   | `Patterns/Mantine/AdminCurrencyTabs` | `Default` | 390, 1440 |
   | **Blast radius**, legacy consumer Stories that now render the new `AdminTable`: `Admin/AdminListingsTable`, `Admin/AdminSupportManager`, `Admin/AdminCompaniesManager`, `Admin/AdminPropertyTypesManager` | `Default` | 390, 1440 |

   Record accepted or returned per tuple.
2. **After deploy, on lero.al, as an admin** (recorded, not an approval gate):
   - `/admin/currency`: search, detail, set default, edit, and both tabs;
   - `/admin/listings`: the sticky title column while scrolling sideways, and the archived-row styling;
   - two more admin pages with the new header.

## 14. Completion report contract

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or `BLOCKED`.

Report:
- created, changed and deleted files with their hashes;
- R1–R8 and AC1–AC12 (AC13 = `MISSING EVIDENCE`, owed by the owner);
- the phase checkpoints;
- every command with its exit code;
- `03b` by class;
- the plant transcripts and hashes;
- the §10.5 edits;
- the GR receipts;
- deviations.

Update the 877 backlog state cell. Write the session log with a Files Changed table.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable without chat context | Yes — facts cited by file:line, D78-8 verbatim, one route in three ordered phases with checkpoints |
| GR-0 canonical-first | `AdminTable` and `AdminPageHeader` become adapters over **extended** canonical patterns, not parallel Mantine copies (§5 item 1) |
| GR-1 | full census (F1); every tier-1 node is migrated, container-exempt, or the baselined route root; the 5 table consumers and 14 header consumers are **not** edited, so their own surfaces stay their own tasks |
| Container / View split | P0 rule applied to `AdminCurrenciesManager`/`CurrencyFormDialog`; `AdminCurrencyTabs` made presentational with slots |
| Absence claims traced | F3 dead props: every production consumer's props enumerated; the only user is the legacy Story |
| Tokens | two new tokens, each with legacy provenance and the D71-4/825 precedent; the badge colours cite TailAdmin §6 |
| Blast radius stated | 5 table pages and 14 header consumers; the visual changes are listed (§5 item 2) and covered by the matrix |
| Two-armed control | P1–P4, transcripts kept |
| Detector blind spots stated | R8 is class-bounded because the post-change graph cannot be simulated in advance; `governance:tailwind` is red at HEAD; `check-stories-rendered.mjs` is retired |

## 16. Review 1 — NEEDS REVISION (2026-09-29), revision 1

### 16.1 What review 1 inspected

It inspected the executor's `PARTIALLY IMPLEMENTED` handoff, which stopped in Phase A. The real diff was nine paths:
- ` M`: `theme.ts`, `MantineDataTableToCards.tsx`, `MantineDashboardHeader.tsx`, `AdminTable.tsx`, `AdminPageHeader.tsx`;
- ` D`: the four R6 files;
- `??`: `docs/sessions/evidence/task877/` (`01`, `02a`, `02b`, `02c`).

Two checks were re-run in native PowerShell on that tree (win32 v22.22.3):
- `npm.cmd run typecheck`: exit 0;
- `AdminUsersTable.smoke.test.tsx`: 21/21 passed.

The code kept from review 1 is:
- the adapter mapping in `AdminTable.tsx`;
- the `AdminPageHeader` adapter;
- the `actions` slot;
- `visibleFrom`, `detail`, `ariaLabel`, `stickyHeader` and the `ReactNode` widening in the pattern.

Only the items in §16.2 change.

### 16.2 Corrections (each one supersedes the text it names)

1. **The z-index token goes in the existing map. This corrects F9, R1, §7 and §10.4.** `theme.other.zIndex` exists:
   its type is at `theme.ts:150`, `zIndex: Record<'siteHeader', number>`, and its value is at `:699-701`,
   `siteHeader: 30` (Task 879). The kickoff's "there is no z-index token" was false, and the executor's
   `other.layer` created a second, parallel namespace (GR-0: extend the owner, never parallel it).
   - Delete `other.layer`, both its type entry and its value.
   - Add `tableStickyColumn: 1` to `other.zIndex`, and widen its type to `Record<'siteHeader' | 'tableStickyColumn', number>`.
   - The pattern reads `theme.other.zIndex.tableStickyColumn`.
   - Afterwards, a search of `src/` for `other.layer` or `.layer.` returns no line.
2. **The card chevron follows the F4 rule. This corrects R1.** Legacy `AdminCardList` (`HEAD:src/components/admin/AdminCardList.tsx`,
   the trailing slot) rendered `trailing ?? chevron`: an automatic chevron **only when `trailing` was absent**. The
   pattern now appends the chevron whenever `onRowClick` is set, so `AdminCompaniesManager.tsx:377-389` shows two:
   its own delete button plus `ChevronRight`, then the pattern's. That page is out of scope and is not edited.
   - In `renderDesignedCard`, call `cfg.actions?.(row)` **once**. Render the chevron only when `onRowClick` is set
     and that result is `null`/`undefined`/`false`.
   - The header row still renders when only the chevron is present.
   - The table keeps its dedicated trailing chevron column, as legacy did.
   - Phase B: `AdminCurrenciesView`'s `cardRow` passes **no** `trailing`, because the pattern supplies the chevron.
     Today's `AdminCurrenciesManager.tsx:451` passes one explicitly.
   - T2 gains a case: a card whose `cardRow` returns `trailing` shows exactly one chevron-or-trailing (no automatic
     chevron), and a card without `trailing` shows the automatic one.
3. **Consumer counts and references. This corrects F1, F6 and F11.**
   - The census (`02a`) has **21** nodes. The net extra three come from 874's View subtree: `AdminExchangeProvidersView`,
     `ProviderFormDialogView`, `MantineDataTableToCards` and `MantineModal` are all `manifest:yes story:yes`, and
     `PasswordInput` is gone.
   - `AdminPageHeader` has **14** consumers: 13 pages plus `AdminUserCreate`.
   - F11 gains `docs/mantine-tailadmin-migration-tracker.md:192`. `component-coverage-matrix.md` and
     `component-governance.md` have no hit, so the executor does not edit them.
   - **I0 is incomplete:** `02d-references-before.txt` was never written. Write it now, with the §10.1 step 3
     command, and note in the session log that it post-dates the R6 deletions.
4. **P3 — compute each card once per row.** `AdminTable.tsx:109-112` calls `resolveCard(w.row)` up to four times
   per row, and each call re-runs `cardRow` or `synthesizeCard` and every cell renderer. Build one
   `Map<string, AdminTableCard>` per render from `wrappedRows`, and have the four `CardConfig` callbacks read it.

### 16.3 Executor deviations accepted by review 1 (record each in the session log)

1. **The Enter/Space guard, `e.target !== e.currentTarget`.** Legacy `HEAD:AdminTable.tsx` (the row `onKeyDown`)
   and `AdminCardList` called `preventDefault()` on an Enter/Space that bubbled from a focused inner button, which
   cancelled that button's own activation. Only row-focused keys activate the row now. This fixes a defect, and no
   capability is lost. T2's keyboard case focuses the row itself. Add a second T2 case: Enter on a focused inner
   `button` inside a clickable row does **not** call `onRowClick`.
2. **`AdminTableColumn.className` stays declared, and is not forwarded.** `AdminListingsTable.tsx:480` and
   `AdminCompaniesManager.tsx:279` pass it, and they are out of scope, so AC3's typecheck needs the field. Mark it
   `@deprecated` in its JSDoc. AC3's clause "no longer declares the F3 dead fields" is unaffected, because
   `className` is not an F3 field.
3. **The card subtitle `Text` becomes `component="div"`.** This also changes the existing `AdminUsersTable` cards. It
   is covered by the added O78-6 row (`Mantine/Primitives/Table` `Default` at 390, §13.3).
4. **The R6 deletions landed in Phase A, not Phase C.** The legacy `AdminTable.stories.tsx` passed the removed F3
   props and could not typecheck against the adapter. `check:stories` may stay red until the Phase C row edit in
   `story-realmode-allowlist.json:8`. It is not part of the Phase A or Phase B checkpoint, and it is asserted only
   in §13.2.
5. **Two non-visual `style` mechanisms, recorded under §10.4:**
   - `cursor: 'pointer'` on a clickable row or card (legacy `cursor-pointer`);
   - `zIndex` on the sticky cell (legacy `z-[1]`). Mantine has no prop for either.

### 16.4 Re-entry (a fresh Sonnet session starts here)

The mode is remediation. **Keep** the current working-tree code and `01`–`02c`. Do **not** re-run `01-status-before.txt`,
because the tree is no longer the pre-task state. Execute, in order:

1. §16.2 item 3 (`02d`), then items 1, 2 and 4.
2. The rest of Phase A, as §10.3 step 1 lists it:
   - the four `Mantine/Primitives/Table` exports (R1);
   - the `DashboardHeader` `WithActions` export;
   - the `AdminTable` and `AdminPageHeader` Stories;
   - their two manifest entries;
   - the removal of the `story-coverage-exempt.json:10` row;
   - `A-checkpoint.txt` (typecheck, `AdminUsersTable` smoke, `check:story-coverage`).

   Emit the GR-0 / GR-3a / GR-3 / GR-3b / GR-3c receipts for each Story before writing it.
3. Phase B and Phase C unchanged, except that T2 now carries the §16.2 item 2 and §16.3 item 1 cases.
4. Run the §13.2 gate block and plants P1–P4. The completion report lists §16.2 items 1–4 as `DONE` or
   `NOT DONE`, each with its evidence file.

## 17. Review 2 — NEEDS REVISION (2026-09-29), revision 2

### 17.1 What review 2 verified

- The implementation hashes all equal `docs/sessions/evidence/task877/28-hash-object.txt`. §16.2 items 1–4 are done.
- The GR-1 census (re-run by the reviewer) has 17 nodes. Every tier-1 node is `manifest:yes story:yes`, except the route
  root `page.tsx` and the two container-exempt managers.
- The reviewer measured GR-3b and GR-3c on the built Storybook: 27 Stories at 320, 390 and 1440. There is no overflow,
  and the only heading ≥18px is the page `h1`, at 20 px below `sm` and 24 px above. Evidence:
  `docs/sessions/evidence/task877/r2-review/gr3b-gr3c-measure-run.txt`.
- **AC9 is closed by the orchestrator.** The four `docs/admin-ux-rules.md` lines (`:131`, `:537`, `:555`, `:557`)
  were a kickoff defect: F11/§10.5 sent an edit to a file the executor may not write. Review 2 rewrote them to the
  adapter/`CardConfig` wording (D78-8), and added the 640px switch exception to §14.3. The `23c` grep now returns no
  line.
- **24b is replaced for the in-scope Stories.** The full `check:locale-leak:mantine-only` (296 Stories) did not finish
  in 76 minutes. That run is 836's problem, not 877's. Review 2 ran the same detector over only the 27 Stories 877
  created or extended:
  - generator: `r2-review/make-leak877-scoped.mjs`;
  - transcript: `r2-review/leak877-run.txt`;
  - report: `r2-review/leak877-report.json`.

  Result: 147 leak lines, on 11 Stories. Every token is fixture data or language-neutral text:
  - the currency codes `ALL`, `USD`;
  - the database name columns from `FIXTURE_CURRENCIES` (`src/stories/fixtures/admin.fixtures.ts:55`). The list
    shows `name_en || name_sq` in every locale, as production does, and the detail dialog shows all four columns;
  - the search placeholder `EUR, ALL…`, which is identical in all four `messages/*.json` (`:1553`).

  No UI string leaks.

### 17.2 Finding (the only one)

**P2 — §10.5 row 2 not done** (`scripts/check-locale-leak.mjs`, `PER_STORY_TOKENS`). §10.5 says: *"If the new
Stories render raw fixture role strings, add the new story-id prefixes with the same reason (measure with
check:locale-leak)."* The measurement never completed, so the entries were never added. Without them, every future
`check:locale-leak:mantine-only` run carries 147 fixture lines for these Stories, and those lines hide real leaks.

### 17.3 Re-entry (a fresh Sonnet session starts here)

The mode is remediation. **Keep** all code and every evidence file. Change only `scripts/check-locale-leak.mjs`, and
use the Edit tool: the tokens contain `…` and `—`, so a PowerShell read/write would corrupt them.

1. In `PER_STORY_TOKENS`, directly after the `'patterns-mantine-adminsurfacepattern'` entry, add one comment and four
   entries. Copy each token exactly from `r2-review/leak877-report.json`.
   - The comment: *"Task 877: currency codes and database-stored multilingual currency names from
     `FIXTURE_CURRENCIES` render verbatim by design (the list shows `name_en || name_sq`, the detail shows all four
     name columns). The search placeholder `EUR, ALL…` is identical in all four locales."*
   - The entries:
     - `'patterns-mantine-admintable': ['ALL', 'Albanian Lek', 'Euro', 'USD', 'US Dollar']`
     - `'patterns-mantine-admincurrenciesview': ['EUR, ALL…', 'ALL', 'Albanian Lek', 'Euro', 'USD', 'US Dollar', 'EUR — Euro']`
     - `'patterns-mantine-admincurrencytabs': ['EUR, ALL…', 'ALL', 'Albanian Lek', 'Euro', 'USD', 'US Dollar']`
     - `'patterns-mantine-currencydetaildialogview': ['ALL', 'Albanian Lek', 'Lek albanese', 'Euro', 'USD', 'US Dollar', 'Dollar amerikan', 'Dollaro statunitense']`
2. Run this block from the project root, in Windows PowerShell. The existing `storybook-static` is current, because
   no Story changes; rebuild it only if it is missing.

   ```powershell
   $ev = "docs\sessions\evidence\task877\r2"
   New-Item -ItemType Directory -Force $ev | Out-Null
   node.exe -p "process.platform + ' ' + process.version" *>&1 | Tee-Object "$ev\10-platform.txt"
   git --no-optional-locks hash-object scripts/check-locale-leak.mjs *>&1 | Tee-Object "$ev\00-pre-hash.txt"
   node.exe docs\sessions\evidence\task877\r2-review\make-leak877-scoped.mjs .screenshots\leak877-scoped.mjs *>&1 | Tee-Object "$ev\24c-generate.txt"
   node.exe .screenshots\leak877-scoped.mjs *>&1 | Tee-Object "$ev\24c-locale-leak-877-scoped.txt"
   npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\25-file-integrity.txt"
   npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\26-mojibake.txt"
   git --no-optional-locks hash-object scripts/check-locale-leak.mjs *>&1 | Tee-Object "$ev\28-hash-object.txt"
   git --no-optional-locks status --porcelain *>&1 | Tee-Object "$ev\29-status-after.txt"
   ```

   After each command, append `"EXIT_CODE=$LASTEXITCODE" | Add-Content <file>`.

   Expected: `24c` exits 0 and prints `ZERO leaks across 27 stories`. `25` and `26` exit 0. The pre-hash is
   `16fad348ae33d88f84fd3e67a9243255baa5e090`, and the new hash differs from it. The only newly changed path is
   `scripts/check-locale-leak.mjs`, plus the `r2/` evidence.
3. **Stop, and report `BLOCKED`, on any of these:** `24c` still reports a leak; a token in the report is not in the
   list above; or a leak line names a UI string rather than fixture data. Do not widen the allowlist beyond these
   four entries.
4. In the session log, add a short "Review 2 re-entry" section: the edit, the `r2/` exit codes and the new hash. Set
   the 877 backlog cell to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

### 17.4 Owner

**Superseded by §18.** The owner ran O78-6 on 2026-09-29. The executor re-enters at §18.3, and the owner then
re-checks only the tuples in §18.4.

## 18. O78-6 returned by the owner (2026-09-29), revision 3

### 18.1 The owner's result, verbatim per tuple

| Story | Result |
|---|---|
| `Mantine/Primitives/Table` `RowClick`, `ResponsiveColumns`, `StickyColumn`, `CardDetail`; `Default` | *"Підтверджую!"* — accepted |
| `Patterns/Mantine/DashboardHeader` `WithActions` | accepted |
| `Patterns/Mantine/AdminTable` (all 4), `AdminPageHeader` (both), `AdminCurrenciesView` (all 4), `CurrencyFormDialogView` (all 3) | accepted |
| `Patterns/Mantine/CurrencyDetailDialogView` (all 3) | **returned:** *"Має бути баланс між стовпчиками. Наразі виходить так, що перший стовпчик заповнений повністю, а другий стовпчик пустий, через що попап дуже великий. Виправити!"* |
| `Patterns/Mantine/AdminCurrencyTabs` `Default` | **returned:** *"Якось не до кінця ця таблиця адаптивна, там нічого взагалі не прочитаєш, бо на екранах меньше 1920px увесь контент всередині таблиці обрізається і виходить щось накшталт "В...", взагалі не розібрати що це за стовпчик і що там написано."* |
| All Stories | **new owner rule:** *"необхідно занести в правило, що під час створення Story необхідно дотримуватись канонічних відступів від країв екрану! Це постійна проблема. І ці Story не виключення, також мають цю проблему! Її необхідно виправити!"* It is now `docs/golden-rules.md` **GR-3d**. The owner then amended it, verbatim: *"насправді не треба окрема задача для відступів у Story, достатньо буде зробити один і той самий профіль для всіх Story, щоб вони завжди мали однаковий відступ від країв екрану"*. So there is one shared profile, `StoryPageGutter`, and no separate task. |

The blast-radius legacy Stories got no return.

### 18.2 What the reviewer measured

- **The detail dialog.** `CurrencyDetailDialogView.tsx` puts only `symbol`/`decimals` in `SimpleGrid cols={2}`. The
  four names sit below it in a one-column `Stack`, so the right half is empty for four rows (screenshot, 1440 `en`).
- **The table.** On the Providers tab of `AdminCurrencyTabs` `Default` (`uk`), the badges render as `А…`, `Гі…`,
  `Р…`, `Увімк…` at 768 and 1024, and the actions column is cut off. At 1440 nothing is cut.

  The cause is in the canonical pattern, not in a View. A Mantine `Badge` label ellipsizes, so its min-content
  width is near zero. When the `<table>` is narrower than its content, the table layout squeezes exactly those
  columns. The reviewer set `min-width: max-content` on the table in the browser: zero truncated elements at 768,
  1024 and 1440, and the `ScrollArea` scrolls instead. The same defect reaches every `MantineDataTableToCards`
  consumer with badges between 640px and the width at which its content fits.
- **The gutters.**
  - `AdminCurrenciesView.stories.tsx` has no gutter at all (full bleed).
  - `AdminTable`, `AdminPageHeader` and `AdminCurrencyTabs` write a fixed `p="md"` (16px at every width).
  - The GR-3d profile is 16px, then 24px from 640px, then 32px from 1024px. That is the same as the default
    `.container-wide` canvas every legacy Story already has.

### 18.3 Re-entry (a fresh Sonnet session starts here)

The mode is remediation. **Keep** all code and evidence. §17.3's allowlist step is still owed, and it is step 1 here.
Put the new evidence in `docs/sessions/evidence/task877/r3/`.

1. **§17.3 steps 1 and 3:** the `PER_STORY_TOKENS` entries, and the stop conditions.
2. **Detail dialog balance.** In `src/components/admin/CurrencyDetailDialogView.tsx`, render all six fields in **one**
   `SimpleGrid cols={2} spacing="md"`, in this order: `symbol`, `decimals`, `name_sq`, `name_en`, `name_uk`,
   `name_it`. Delete the separate `Stack` of names. Nothing else in the dialog changes: the subtitle, the badges and
   the footer stay as they are.
3. **The table never truncates cell content.** In `src/design-system/mantine/patterns/MantineDataTableToCards.tsx`,
   add `miw="max-content"` to the desktop `<Table>`. This is a Mantine style prop with a CSS keyword, so it adds no
   raw value. The table still fills its card when the content fits, and scrolls inside the `ScrollArea` when it does
   not. Add a comment citing §18.2.
4. **The shared Story gutter profile (GR-3d, amended 2026-09-29).** The owner's rule is **one profile for all
   Stories**. There are no per-surface variants. Before writing it, emit the GR-0 and GR-3a receipts: search
   `src/stories` for an existing gutter helper. `MantineStoryShell` is the primitive showcase shell (card chrome,
   16/24px), and GR-3d names it as a known exception, so it is **not** the profile.
   - Create `src/stories/_StoryPageGutter.tsx`. It exports `StoryPageGutter({ children })` with **no other prop**, and
     renders `<Box px={{ base: 'md', sm: 'xl', lg: '2xl' }} py="xl">{children}</Box>`. Add a comment citing GR-3d and
     its source: the `.container-wide` ladder (`src/app/globals.css:714-724`) with the canvas `py-6`
     (`.storybook/preview.tsx` `withCanvas`). **If an earlier draft of this step already made the file with a
     `surface` prop or `p={{ base: 'xl', lg: '2xl' }}`, replace it with this form.**
   - Wrap the page content of every export in these Stories in it, and delete their own `Box`/`Stack` `p`/`px`/`py`
     gutters and decorators:
     - `src/stories/patterns/mantine/AdminTable.stories.tsx` (4 exports);
     - `…/AdminPageHeader.stories.tsx` (decorator);
     - `…/AdminCurrenciesView.stories.tsx` (all 4 renders; for `DeleteConfirm`/`Detail` the page content, not the modal);
     - `…/AdminCurrencyTabs.stories.tsx` (decorator);
     - `…/DashboardHeader.stories.tsx`: this task changed the file, so all 4 exports move. `Stack p="md"` becomes
       `<StoryPageGutter><Stack …>` without `p`.
   - `CurrencyFormDialogView` and `CurrencyDetailDialogView` are overlay-only, so they get no wrapper.
     `Table.stories.tsx` stays on `MantineStoryShell` (the GR-3d exception), so it is not changed.
5. Run this block from the project root, in Windows PowerShell. After each command, append
   `"EXIT_CODE=$LASTEXITCODE" | Add-Content <file>`.

   ```powershell
   $ev = "docs\sessions\evidence\task877\r3"
   New-Item -ItemType Directory -Force $ev | Out-Null
   $base = git --no-optional-locks rev-parse HEAD
   node.exe -p "process.platform + ' ' + process.version" *>&1 | Tee-Object "$ev\10-platform.txt"
   npx.cmd vitest run src/components/admin/__tests__/AdminCurrenciesManager.smoke.test.tsx src/components/admin/__tests__/AdminTable.adapter.test.tsx src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx *>&1 | Tee-Object "$ev\11-tests.txt"
   npm.cmd run typecheck *>&1 | Tee-Object "$ev\13-typecheck.txt"
   npm.cmd run lint *>&1 | Tee-Object "$ev\14-lint.txt"
   npm.cmd run check:story-coverage *>&1 | Tee-Object "$ev\15-story-coverage.txt"
   npm.cmd run check:rendered-scope *>&1 | Tee-Object "$ev\17-rendered-scope.txt"
   node.exe scripts\check-surface-census-changed.mjs --base $base *>&1 | Tee-Object "$ev\19-census-changed.txt"
   npm.cmd run check:stories *>&1 | Tee-Object "$ev\22-check-stories.txt"
   npm.cmd run build-storybook *>&1 | Tee-Object "$ev\24-build-storybook.txt"
   node.exe docs\sessions\evidence\task877\r2-review\make-leak877-scoped.mjs .screenshots\leak877-scoped.mjs *>&1 | Tee-Object "$ev\24c-generate.txt"
   node.exe .screenshots\leak877-scoped.mjs *>&1 | Tee-Object "$ev\24c-locale-leak-877-scoped.txt"
   npm.cmd run check:file-integrity *>&1 | Tee-Object "$ev\25-file-integrity.txt"
   npm.cmd run check:mojibake *>&1 | Tee-Object "$ev\26-mojibake.txt"
   npm.cmd run build *>&1 | Tee-Object "$ev\27-build.txt"
   git --no-optional-locks status --porcelain *>&1 | Tee-Object "$ev\29-status-after.txt"
   ```

   Expected results:
   - Every command exits 0, except `24c` if a stop condition fires.
   - `24c` prints `ZERO leaks across 27 stories`.
   - `11` passes 33 tests or more, with `AdminUsersTable.smoke` unchanged.
6. **Measure on the new `storybook-static`, and save the result as `r3/30-measurements.json`.**
   - **GR-3b/GR-3c:** every Story file this revision changed, at 320/390/768/1024/1440.
   - **GR-3d:** the edge gap of the first page-content box at 320/390/1024/1440. The expected values are 16/16/32/32.
   - **Truncation:** the number of elements inside `#storybook-root table` whose `text-overflow` is `ellipsis` and
     whose `scrollWidth > clientWidth`. Measure it at 768/1024/1440, `uk`, for two Stories:
     `patterns-mantine-admincurrencytabs--default` with the **Providers tab clicked**, and
     `patterns-mantine-adminexchangeprovidersview--default`. The expected value is 0.
   - **Dialog balance:** the detail dialog's height at 1440 `en`, before and after. The height must drop.
7. Record `git hash-object` of every created or changed file in `r3/28-hash-object.txt`. Emit one `GR-3d STORY GUTTER
   CHECK` receipt per changed Story.
8. Add a "Revision 3" section to the session log. Set the 877 backlog cell to `IMPLEMENTED - AWAITING ORCHESTRATOR
   REVIEW`.

### 18.4 Owner — O78-6b, after the executor's re-entry

Use the toolbar locales `en` and `uk`.

| Story | Exports | Widths | What to check |
|---|---|---|---|
| `Patterns/Mantine/CurrencyDetailDialogView` | all 3 | 390, 1440 | both columns balanced |
| `Patterns/Mantine/AdminCurrencyTabs` | `Default`, **both tabs** | 390, 768, 1024, 1440 | nothing truncated; the table scrolls sideways where needed |
| `Patterns/Mantine/AdminCurrenciesView`, `AdminTable`, `AdminPageHeader`, `DashboardHeader` | all | 390, 1440 | the same edge gutter as every other Story (GR-3d) |
| `Mantine/Primitives/Table` `Default` · `Patterns/Mantine/AdminExchangeProvidersView` `Default` | — | 1024 | blast radius of step 3 |

Every other O78-6 tuple stays accepted. Approval needs O78-6b accepted and §18.3 done.

## 19. Review 4 — NEEDS REVISION (2026-09-29), revision 4

### 19.1 What review 4 found

The implementation hashes match `r3/28-hash-object.txt`. Four items are done:
- the `PER_STORY_TOKENS` entries (`scripts/check-locale-leak.mjs:189-192`), with `24c` reporting `ZERO leaks across 27
  stories`;
- the detail dialog's single `SimpleGrid cols={2}` (`CurrencyDetailDialogView.tsx:90-97`);
- `miw="max-content"` on the desktop table (`MantineDataTableToCards.tsx:509`);
- tests, typecheck, check:stories, build-storybook and `npm run build`, all at exit 0.

**P1 — the gutter profile follows the superseded draft of §18.3 step 4, not the amended rule (`docs/golden-rules.md`
GR-3d).**
- `src/stories/_StoryPageGutter.tsx` has a `surface: 'admin'` prop, a `void surface` line, and
  `p={{ base: 'xl', lg: '2xl' }}`. That is 24/24/32/32 px, not the rule's 16/16/32/32.
- The seven call sites pass `surface="admin"`.
- `DashboardHeader.stories.tsx` still writes `Stack p="md"` in all four exports (`:41`, `:67`, `:89`, `:105`).

The owner replaced the per-surface gutter with **one profile for all Stories**, and amended §18.3 step 4 before this
run. That step is the binding text.

**Closed by the reviewer:** `14-lint` exit 1. The one error was the reviewer's own generator
`r2-review/make-leak877-scoped.cjs` (`require()`). It is now `r2-review/make-leak877-scoped.mjs`, in ESM form, and it
lints clean. The `.cjs` file is deleted, and §17.3 and §18.3 now name the `.mjs` file.

### 19.2 Re-entry (a fresh Sonnet session starts here)

The mode is remediation. Keep all code and evidence. Put the new evidence in `docs/sessions/evidence/task877/r4/`.

1. Make `src/stories/_StoryPageGutter.tsx` exactly as §18.3 step 4 says:
   - `StoryPageGutter({ children })`, with **no other prop**;
   - it renders `<Box px={{ base: 'md', sm: 'xl', lg: '2xl' }} py="xl">{children}</Box>`;
   - the comment cites GR-3d and its source, the `.container-wide` ladder (`src/app/globals.css:714-724`) with the
     canvas `py-6` (`.storybook/preview.tsx` `withCanvas`);
   - no `surface` wording and no mention of 898.
2. Remove `surface="admin"` from every call site: `AdminTable.stories.tsx` (4), `AdminPageHeader.stories.tsx`,
   `AdminCurrencyTabs.stories.tsx` and `AdminCurrenciesView.stories.tsx`.
3. `DashboardHeader.stories.tsx`, all 4 exports: `Stack p="md"` becomes `<StoryPageGutter><Stack …>`, and the `Stack`
   keeps its other props but not `p`.
4. Run the §18.3 step 5 block into `r4/`, with `$ev` set to `docs\sessions\evidence\task877\r4`. Expected: every
   command exits 0, **including `14-lint`**.
5. Measure on the new `storybook-static`, and save the result as `r4/30-measurements.json`:
   - **GR-3d:** the edge gap of the first page-content box at 320/390/1024/1440 is **16/16/32/32** for the Stories of
     `AdminTable`, `AdminPageHeader`, `AdminCurrenciesView`, `AdminCurrencyTabs` and `DashboardHeader`;
   - **GR-3b/GR-3c:** the same Stories at 320/390/768/1024/1440;
   - one `GR-3d STORY GUTTER CHECK` receipt per Story.
6. Record the hash-object of every created or changed file in `r4/28-hash-object.txt`. Add a "Revision 4" section to
   the session log. Set the 877 backlog cell to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

### 19.3 Owner

O78-6b (§18.4) runs after this re-entry. Its gutter row now includes `DashboardHeader`, and the gutter it checks is
16px on a phone, 24px from 640px and 32px from 1024px.
