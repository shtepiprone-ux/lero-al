# Sprint 28 — Task 306 kickoff (`AdminPageShell` + `AdminTable` controlled-scroll + `AdminCardList` card-row primitives)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **canonical primitive build** activating Epic HH Phase 2 scoped to owner-flagged surfaces in Sprint 28. Pre-read: `docs/orchestrator-role.md`, `docs/ai-behavior.md` (Notes 18/19/20/22), `docs/ui-rules.md` (§0 canonical primitives + §15 control heights + §16 z-index + §17 UI pre-flight), `docs/admin-ux-rules.md` (§1-§12 + §4 per-route policy + §4.1 severity baseline source-of-truth from Task 327), `docs/component-rules.md`, `docs/component-governance.md §1`, `docs/governance-checklists.md` Checklist I, `tasks/Sprints/Sprint_28_—_Admin_Mobile_Responsive_and_Status_Workflow_Foundation.md`, `docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md` (Task 327 output). No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 306 = third (impl) task in Sprint 28. Activates Epic HH Phase 2 reserved number 306. Depends on Task 327 evidence matrix. Parallel-safe with Task 307.

---

```
Type:        feature (canonical primitives, foundational)
Priority:    HIGH (blocks Tasks 308 + 309 migrations)
Area:        src/components/admin/AdminPageShell.tsx + AdminTable.tsx + AdminCardList.tsx (NEW)
             src/components/admin/AdminListingsTable.tsx (pilot integration only)
             src/components/admin/*.stories.tsx (NEW stories)
```

## Why this task exists

Owner-flagged 6 admin surfaces have inconsistent mobile responsive behaviour (Task 327 evidence matrix). Epic HH Decision 1 (APPROVED 2026-05-30) mandates a Hybrid model: workflow surfaces → card-row mobile fallback; data-dense reference surfaces → controlled horizontal scroll. Today, every admin surface implements its own ad-hoc `overflow-x-auto` wrapper (or doesn't), its own header bar, its own filter bar. No shared primitive exists.

Task 306 ships the foundation: `AdminPageShell` + `AdminTable` (controlled-scroll variant) + `AdminCardList` (card-row variant). Tasks 308 + 309 will migrate the owner-flagged surfaces onto these primitives.

## Current behavior to preserve (Notes 19/20/22)

### `AdminListingsTable.tsx` (pilot integration site)

Inventory BEFORE editing — capture in session log:

- Page header: title (`admin.pages.listings_title`), subtitle, count badge, "Create listing" action.
- Filter bar (top): segmented tab strip (status filter Approve/Reject/Pending/Active/Inactive/Sold/Rented/Archived) + market filter Combobox + premium Combobox + property-type Combobox + search Input + Reset all button.
- Table columns (desktop): ID, Listing (image + title), Type, Price, Status (badge), Agent, Created, Actions.
- Column visibility breakpoints (`hidden sm:table-cell` / `hidden md:table-cell` / `hidden lg:table-cell`) — preserve exactly.
- Row actions: edit (link), delete (icon button → AlertDialog), premium toggle (icon button), status transitions per current state (per `STATUS_ACTIONS` map — preserved verbatim; will be wrapped in `StatusChangeControl variant="workflow"` in Task 308, NOT in Task 306).
- Empty state ("No listings"), loading state (skeleton), error state.
- Pagination (page size + page controls).
- All locale keys (sq/en/uk/it).

**EVERY one of these MUST remain functionally identical after the pilot migration**. Task 306 only swaps the OUTER wrapper (`<div>` shell + header bar + `overflow-x-auto` table wrapper) for `AdminPageShell` + `AdminTable`. The inner row rendering, filter logic, action handlers, locale keys, and column visibility are NOT touched.

### `AdminPageShell` / `AdminTable` / `AdminCardList` (NEW)

No "current behavior" — they are new components. The pre-existing implicit behaviour was inconsistent (each admin page rolled its own). The new primitive defines the canonical behaviour per `docs/admin-ux-rules.md` §1-§4.

## Positive flow (happy path)

### Component contracts

```ts
// src/components/admin/AdminPageShell.tsx
type AdminPageShellProps = {
  title: string                          // already-translated
  subtitle?: string                      // already-translated
  countBadge?: { value: number; ariaLabel?: string }
  actions?: ReactNode                    // right-side action cluster (Buttons / Combobox)
  filterBar?: ReactNode                  // optional row below header for filters
  children: ReactNode                    // the table / list / form content
}
// Renders a sticky-at-top page header on narrow widths; full-width content area; padding `p-3 md:p-6`; respects `.container-wide`; supports 320/375/390/768/1280/1440/2560.

// src/components/admin/AdminTable.tsx
type AdminTableProps<Row> = {
  rows: Row[]
  columns: AdminTableColumn<Row>[]
  rowKey: (row: Row) => string
  onRowClick?: (row: Row) => void
  stickyColumnIndex?: number             // default 0 (first column sticky)
  emptyState: ReactNode                  // already-translated
  loading?: boolean
  loadingState?: ReactNode               // optional skeleton
  errorState?: ReactNode
  ariaLabel?: string
}
type AdminTableColumn<Row> = {
  key: string                            // for React keying + sort
  headerKey: I18nKey                     // resolved at call-site if you prefer; or pass pre-translated `header: string`
  cell: (row: Row) => ReactNode
  visibility?: 'always' | 'sm' | 'md' | 'lg'   // collapses to `hidden sm:table-cell` etc.
  sortable?: boolean                     // Phase 1 spec §6 — Task 306 wires the marker but actual sort handled by parent
  sortDirection?: 'asc' | 'desc' | null
  onSort?: () => void
  align?: 'left' | 'right' | 'center'
  className?: string
}
// Renders controlled-scroll: sticky first meaningful column (configurable), sticky header (inside scroll container, not viewport), right-edge fade ::after gradient affordance, no overflow-hidden clipping. At ≥ md desktop layout. Below md the table stays horizontal with scroll affordance (per Epic HH Decision 1).

// src/components/admin/AdminCardList.tsx
type AdminCardListProps<Row> = {
  rows: Row[]
  rowKey: (row: Row) => string
  card: (row: Row) => ReactNode           // caller-rendered card body
  onRowClick?: (row: Row) => void
  emptyState: ReactNode
  loading?: boolean
  loadingState?: ReactNode
  ariaLabel?: string
}
// Renders divide-y stacked cards on ALL breakpoints (this is the workflow surface fallback — desktop also shows cards because the surface is workflow-shaped). At ≥ md may optionally render in a 2-column grid (deferred to a follow-up — Task 306 ships single-column).
```

### Build steps

1. Read `docs/admin-ux-rules.md` §2 (Card-Row Fallback) + §3 (Controlled Horizontal Scroll) + §4 (Per-Route Policy Table) + §4.1 (Severity baseline) + Task 327 evidence matrix.
2. Create `src/components/admin/AdminPageShell.tsx`:
   - Header bar: `flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4`.
   - Title + subtitle stack on left; `countBadge` next to title via inline `Badge`; `actions` slot on right (wraps on narrow).
   - `filterBar` slot below the header bar with `gap-3` separator.
   - Container: `.container-wide` outer + `p-3 md:p-6` inner.
   - Sticky behaviour: header sticks at top of scroll container on `md:` and below to give context while user scrolls a long table; configurable via prop `stickyHeader?: boolean` default `true`.
   - All slots accept `ReactNode` (pre-translated by caller); component itself has zero hardcoded text.
3. Create `src/components/admin/AdminTable.tsx`:
   - Outer wrapper `<div class="relative">` to host the right-edge fade ::after.
   - Scroll container `<div class="overflow-x-auto admin-table-scroll">`. CSS class `admin-table-scroll` defined in `globals.css` ONLY for the `::after` fade (gradient from `transparent` to `var(--background)`, `right-0`, `top-0`, `bottom-0`, `w-6`, `pointer-events-none`). Use existing tokens; do NOT introduce new colours.
   - `<table class="w-full text-sm">`.
   - `<thead>` with `position: sticky; top: 0` + background to mask scrolled rows; per-column `aria-sort` when `sortable`; click handler if `onSort`.
   - First meaningful column (`stickyColumnIndex` default 0): `position: sticky; left: 0; background: var(--background); z-index: 1` (z-index per `docs/ui-rules.md §16` — confirm scale).
   - `<tbody>`: rows render via `columns.map(c => c.cell(row))` with per-column `visibility` class `hidden sm:table-cell` etc.
   - Empty state: `<tbody><tr><td colSpan={columns.length} class="px-4 py-12 text-center text-muted-foreground">{emptyState}</td></tr></tbody>`.
   - Loading state: skeleton rows or caller-supplied `loadingState`.
   - Error state: similar pattern.
   - `min-w-[640px]` on `<table>` to force horizontal scroll below md.
4. Create `src/components/admin/AdminCardList.tsx`:
   - Wrapper `<div class="divide-y rounded-2xl border bg-card">`.
   - Each row: `<div class="p-4 cursor-pointer">{card(row)}</div>` if `onRowClick`; else `<div class="p-4">`.
   - Empty / loading state handling identical pattern.
5. Create storybook stories:
   - `src/components/admin/AdminPageShell.stories.tsx` — desktop1280, tablet768, mobile320 viewports; one story per state (with countBadge, without, with filterBar, without).
   - `src/components/admin/AdminTable.stories.tsx` — desktop1280, mobile320, scroll-affordance demo with 8-column fixture; sortable column demo.
   - `src/components/admin/AdminCardList.stories.tsx` — desktop1280, mobile320, empty state, loading state.
   - All stories use stable fixtures (no `Math.random()`, no `new Date()`).
   - Add `uk` locale variant per story to verify long-string wrapping (per `docs/ui-rules.md` localization rules).
6. Pilot integration on `AdminListingsTable.tsx`:
   - Replace the outer `<div>` + header bar + `overflow-x-auto` wrapper with `<AdminPageShell title={…} subtitle={…} countBadge={…} actions={…} filterBar={…}>`.
   - Replace the table render with `<AdminTable rows={rows} columns={…} rowKey={r => r.id} stickyColumnIndex={1} emptyState={…} />`.
   - The columns array maps existing visible-column structure 1:1 (ID / Listing / Type / Price / Status / Agent / Created / Actions); the `Listing` column has `cell` returning the existing image + title JSX block. The visibility prop matches existing `hidden sm:table-cell` / `hidden md:table-cell` / `hidden lg:table-cell` rules.
   - DO NOT change filter / sort / search / row action / status transition / pagination logic in this task. Task 308 finishes integration of `StatusChangeControl` for the listing transition row-actions.
7. Run UI pre-flight (`docs/ui-rules.md §17`) — paste output in session log.
8. Run `npm run governance:components` + `npm run catalog:components` + update `docs/component-catalog.md` per component governance rules.
9. Update `docs/component-catalog.md` with the 3 new canonical components classified as `canonical-primitive`.
10. Update `docs/backlog.md` per backlog rules.
11. Write session log `docs/sessions/2026-05-30-task-306-admin-shell-primitives.md` per Note 18 self-validation + Files Changed table.

## Negative flow (every off-happy-path branch)

- **Pilot integration breaks an existing AdminListingsTable filter** → STOP. Roll back the pilot integration; ship the 3 primitives + stories only; document the gap in session log; orchestrator decides whether to ship primitives without pilot or hold for fix.
- **Existing column visibility breakpoint cannot be expressed via `visibility: 'sm'|'md'|'lg'`** → STOP & ASK. Propose either an extended union (`'always'|'xs'|'sm'|'md'|'lg'|'xl'`) or per-column className escape hatch.
- **Sticky column z-index collides with sticky header** → use canonical z-index scale in `docs/ui-rules.md §16`; header z = 2, sticky column z = 1. Document in session log.
- **`overflow-x-auto` + sticky `<thead>` doesn't work in Safari iOS** → use `position: sticky` + `top: 0` on `<thead>` + ensure no `overflow-hidden` ancestor; document; if still broken, document as known limitation and propose JS scroll-shadow polyfill in a follow-up.
- **Right-edge fade affordance doesn't render** because the gradient sits on an `<aside>` while `overflow-x` is on the inner `<div>` → use `::after` directly on the scroll container with `pointer-events: none`; do not introduce extra wrapper div.
- **Storybook story uses a stale i18n key** → use existing keys from `messages/sq.json` directly; stories are not localized by default but include a `uk` variant story per component to verify wrap.
- **You feel like ALSO migrating AdminUsersTable in this task** → STOP. Pilot is `/admin/listings` ONLY. AdminUsersTable migration is Task 308.
- **You feel like ALSO migrating AdminSupportManager / AdminInquiriesManager to AdminCardList** → STOP. Task 309's job.
- **You feel like ALSO ADDING sort URL state** (Epic HH Decision 3) → wire `sortable` + `sortDirection` + `onSort` props in the API but do NOT implement URL state in Task 306; Task 308 wires URL state on the listings table.
- **`docs/admin-ux-rules.md §4` per-route policy table needs a new column** → STOP & ASK. Task 327 already added `Severity baseline (Sprint 28)` column; do NOT add more.
- **Pilot integration leaves a duplicate header bar** (existing one + new shell-rendered one) → confirm exactly ONE header bar renders post-integration; if duplicate, STOP and reconcile.
- **Existing AdminListingsTable references `t('admin.pages.listings_title')` for sub-shell title and `AdminPageHeader` is the current shell** → check if `AdminPageHeader.tsx` exists. If it does, document the migration path (deprecate `AdminPageHeader` in favour of `AdminPageShell`, but DO NOT delete `AdminPageHeader` in Task 306 — that requires a separate deprecation task).

## Required investigation (paste in session log BEFORE writing code)

```
# 1. Confirm AdminPageHeader.tsx existence (current shell)
ls src/components/admin/AdminPageHeader* 2>/dev/null || echo "no AdminPageHeader"

# 2. Inventory current AdminListingsTable outer structure
sed -n '1,100p' src/components/admin/AdminListingsTable.tsx
sed -n '100,250p' src/components/admin/AdminListingsTable.tsx

# 3. Inventory canonical container classes
grep -n "container-wide\|max-w-8xl" tailwind.config.* src/app/globals.css | head -10

# 4. Inventory existing canonical primitives to avoid duplication
ls src/components/ui/
grep -n "canonical" docs/component-catalog.md 2>/dev/null | head -20

# 5. Confirm z-index scale + control-height scale
grep -n "z-\|^\s*\\-\\-z-" docs/ui-rules.md | head -20
grep -n "size=" src/components/ui/button.tsx | head -10
```

## Acceptance criteria

- `src/components/admin/AdminPageShell.tsx` exists with the documented API.
- `src/components/admin/AdminTable.tsx` exists with controlled-scroll + sticky first column + sticky header + right-edge fade affordance.
- `src/components/admin/AdminCardList.tsx` exists with divide-y stacked cards.
- `src/components/admin/AdminPageShell.stories.tsx`, `AdminTable.stories.tsx`, `AdminCardList.stories.tsx` exist with desktop/tablet/mobile viewports + `uk` locale variant.
- `AdminListingsTable.tsx` migrated to use the 3 primitives for outer shell + table render only. Inner filter/sort/search/row-action/status-transition/pagination logic UNCHANGED.
- `docs/component-catalog.md` updated; `npm run catalog:components` clean.
- `docs/ui-rules.md §17` UI pre-flight output in session log: 7-bp visual check at `uk` PASS.
- Locale keys: no new keys added by Task 306 (only the shell wraps existing content; AdminListingsTable's keys unchanged). `messages/*.json` parity untouched.
- `npx tsc --noEmit` → 0 errors.
- `npm run build` → passes.
- Self-validation block in session log (Note 18); AC self-audit table all green; UX flow trace shows AdminListingsTable filter / sort / search / row action / status transition / pagination all preserved.
- Files Changed table in session log.
- Zero diff in `messages/*.json`, `scripts/`, `supabase/`.

## Out of scope (HARD)

- Migrating any admin surface other than `AdminListingsTable` pilot integration. AdminUsersTable + AdminSupportManager + AdminInquiriesManager wait for Tasks 308 + 309.
- Introducing `StatusChangeControl` integration on `AdminListingsTable` — that is Task 308.
- Wiring sort URL state — Task 308.
- Deleting `AdminPageHeader.tsx` if it exists — deprecation is a separate follow-up.
- Touching `messages/*.json`.
- Any DB migration.
- Public site work.
- Modifying any of `docs/admin-ux-rules.md §1-§12` (only §4 per-route policy may receive a per-route note about pilot integration; do NOT modify the per-route classifications).
- Building `StatusChangeControl` — that is Task 307 (parallel-safe with this one).

## Notes for orchestrator review

- Orchestrator runs the full UI pre-flight on the pilot `/admin/listings` surface across all 7 bp × 4 loc.
- Orchestrator verifies sticky-column behaviour at 320 with a 8-column fixture (no overflow-hidden, no clipping, scroll affordance visible).
- Orchestrator verifies AdminListingsTable behaviour is byte-identical at filter / sort / search / pagination / row-action / status transition level (no UX regression).
- A diff that ships only the primitives without the pilot integration is INCOMPLETE — primitive correctness is only proven by the pilot.
