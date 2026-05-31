# Sprint 28 — Task 308 kickoff (Migrate `/admin/listings` + `/admin/users` to `AdminPageShell` + `AdminTable` + `StatusChangeControl`)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **surface migration** finishing what Task 306 piloted + integrating Task 307 StatusChangeControl into AdminListingsTable. Pre-read: `docs/orchestrator-role.md`, `docs/ai-behavior.md` (Notes 18/19/20/21/22/23 — ALL of them; this is the failure-mode-epicenter area), `docs/ui-rules.md`, `docs/admin-ux-rules.md` (§1-§13 ALL), `docs/component-rules.md`, `docs/component-governance.md §1`, `docs/governance-checklists.md` Checklists A + B, `docs/qa-rules.md`, `docs/data-access-rules.md` (if any URL-state shape touches the server), `docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md` (Task 327), `tasks/Sprints/Sprint_28_—_Admin_Mobile_Responsive_and_Status_Workflow_Foundation.md`, `tasks/Sprints/Sprint_28_kickoff_prompt_Task_306.md` (foundation primitives), `tasks/Sprints/Sprint_28_kickoff_prompt_Task_307.md` (StatusChangeControl). No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 308 = fifth (impl) task in Sprint 28. Activates Epic HH Phase 3 reserved number 308 scoped to `/admin/listings` + `/admin/users` only. Parallel-safe with Task 309. Depends on Tasks 306 + 307 shipped + approved.

---

```
Type:        refactor + UX (surface migration to canonical shell)
Priority:    HIGH (owner-flagged surfaces — closes mobile responsive + status workflow inconsistency for listings + users)
Area:        src/components/admin/AdminListingsTable.tsx (full migration, NOT pilot-only)
             src/components/admin/AdminUsersTable.tsx (shell migration only; no status change)
             src/app/admin/listings/page.tsx + src/app/admin/users/page.tsx (verify shell wrapping unchanged)
```

## Why this task exists

Owner manually QA'd `/admin/listings` and `/admin/users` at 375px (2026-05-30) and found: table/card content clips horizontally on /admin/listings; header/count/action overlap and table clips on /admin/users. Task 327 evidence matrix classifies these as CRITICAL at 320/375/390.

AdminListingsTable also exposes the inconsistent status-transition button UX that owner directive Sprint 28 Decision 1 makes canonical via `StatusChangeControl variant="workflow"`. AdminUsersTable does NOT have status-change UX in Sprint 28 scope (Verified Agents = Task 313, separate Epic HH Phase 6).

Task 308 finishes:
1. Migrating `AdminListingsTable` fully to `AdminPageShell` + `AdminTable` (Task 306 piloted; this task makes it production-correct + completes column-by-column behaviour).
2. Migrating `AdminUsersTable` to the same primitives.
3. Integrating `StatusChangeControl variant="workflow"` into `AdminListingsTable` row-actions, replacing the existing per-current-status transition button cluster.
4. Implementing sort URL state on both tables per Epic HH Decision 3 (`?sort=<column>&dir=asc|desc`).
5. Fixing header/count/action layout overflow on both surfaces per Task 327 evidence.

## Current behavior to preserve (Notes 19/20/21/22/23)

### `AdminListingsTable.tsx` — INVENTORY BEFORE EDIT (session log)

- Page header: title + count badge + "Create listing" action (currently top of `AdminListingsTable` or wrapped by parent page).
- Filter bar (8 controls): status segmented tabs (Approve/Reject/Pending/Active/Inactive/Sold/Rented/Archived) + market Combobox + premium Combobox + property-type Combobox + search Input + Reset all.
- Columns (desktop, 8): ID, Listing (image+title), Type, Price, Status (badge), Agent, Created, Actions.
- Column visibility breakpoints: per-column `hidden sm:table-cell` / `hidden md:table-cell` / `hidden lg:table-cell`.
- Row actions per row: edit link, delete (icon → AlertDialog), premium toggle, **STATUS_ACTIONS-driven transition cluster (per current status)**: e.g. `pending → [active(Approve), inactive(Reject), archived(Archive)]`, `active → [inactive(Deactivate), sold(MarkSold), rented(MarkRented), archived(Archive)]`, etc.
- Empty state, loading state, error state.
- Pagination.
- All locale keys (sq/en/uk/it).
- URL params: currently filter + page. NO sort URL state today (Epic HH Decision 3 adds it).

**Notes 21 + 22 + 23 apply strongly here.** Every existing row action + filter + control MUST remain reachable. The status-transition cluster is REPLACED with `StatusChangeControl variant="workflow"` inline per-row, NOT removed; the per-current-status transition whitelist (STATUS_ACTIONS map) is preserved verbatim and fed to the new control via the `transitions` prop.

### `AdminUsersTable.tsx` — INVENTORY BEFORE EDIT (session log)

- Page header: title + count badge + "Create user" action.
- Filter bar: role filter Combobox + status filter Combobox + verified-agents tab.
- Columns (desktop): User (avatar + display name), Role, Status, Phone, Verified, Date.
- Column visibility breakpoints (current).
- Row actions: edit link (→ `/admin/users/[id]`).
- Empty / loading / error states.
- Pagination.
- Verified-agents tab: switches the table to "verified agents only" subset; preserve verbatim. Verification action MOVES from table to user-profile page in Task 313 (Epic HH Phase 6) — NOT in Task 308.
- URL params: filter + page. NO sort URL state today.

## Positive flow (happy path)

### AdminListingsTable migration

As admin at `uk` 375px:

1. Navigate to `/uk/admin/listings`. Page renders inside `AdminPageShell`:
   - Header: title "Listings" + count badge + "+ Create listing" button.
   - Filter bar: all 8 filters present, wrap correctly at 375px (no clipping, no overflow), reset button reachable.
2. Below the filter bar: `AdminTable` rendered.
   - Sticky first column = "Listing" (image + title) (index 1; index 0 is "ID" which is hidden below `lg:`).
   - Sticky header at top of scroll container.
   - Right-edge fade affordance visible while horizontal scroll exists.
   - At 320/375/390 the user can scroll horizontally to reach Actions column without losing the Listing column reference.
3. Click status filter tab "Pending" → URL updates `?status=pending`; table re-renders.
4. Click "Type" column header (sortable) → URL updates `?sort=type&dir=asc`; table re-renders sorted by type ASC. Click again → `dir=desc`. Click a third time → sort cleared (params removed).
5. Click a row → opens `/admin/listings/[id]` detail. (No row click handler change in this task; existing per-row Action link click navigates.)
6. Per-row actions render in the Actions column:
   - "Edit" link, "Delete" icon button (→ AlertDialog), Premium toggle.
   - **NEW**: `<StatusChangeControl variant="workflow" currentStatus={listing.status} statuses={LISTING_STATUS_OPTIONS} transitions={STATUS_ACTIONS_FLATTENED} historyEvents={[]} onSubmit={handleListingTransition} aria-label={t('change_listing_status')} />`.
   - Transitions filtered per `currentStatus` by the primitive (see Task 328 contract).
7. Click a transition pill (e.g. "Approve" while status=pending) → optional note Textarea remains optional → click "Update status" → server action `updateListingStatus(id, 'active')` fires → success toast (primitive-owned, `admin.common.status_control.status_change_success`) → row updates with new badge.
8. Existing premium toggle + delete + edit untouched.
9. Empty state at 320 renders inside the table (single full-width cell with localized empty text).
10. Pagination at the bottom — still works at 320 (controls wrap).
11. Switch locale to `sq` / `en` / `it` → all UI text changes; no raw key visible.

### AdminUsersTable migration

As admin at `uk` 375px:

1. Navigate to `/uk/admin/users`. Renders inside `AdminPageShell`.
2. Filter bar: role + status + verified-agents tab — all reachable, no overlap.
3. `AdminTable`: sticky first column = "User" (avatar + display name). Sticky header. Right-edge fade.
4. Click "Verified Agents" tab → table subset (existing behaviour); URL param `?tab=verified-agents` preserved verbatim.
5. Sort by "Date" desc → `?sort=date&dir=desc`.
6. Click a row → opens `/admin/users/[id]` profile (existing).
7. NO `StatusChangeControl` integration on Users table in this task — user status display stays as today (Badge in Status column); user status editing happens at `/admin/users/[id]` profile (already implemented; out of scope here).

### URL state contract

Both tables: `?status=...&market=...&premium=...&type=...&q=...&sort=<col>&dir=asc|desc&page=N`. Sort omitted from URL means default sort (current code's `order_by` for the server fetch). Reset all clears filter params but preserves sort + page=1.

## Negative flow (every off-happy-path branch)

- **Existing filter or row action disappears after migration** → Note 20/22 P0 violation. STOP. Roll back the involved column; ship the rest; file a follow-up.
- **STATUS_ACTIONS map not faithfully translated to `transitions` array** → Sonnet writes a unit test fixture comparing the legacy STATUS_ACTIONS reachable set to the new `transitions` prop for every current status. If divergence found, fix the translation BEFORE shipping.
- **`StatusChangeControl variant="workflow"` rendered per row blows up table width at 320** → use a compact mode: pill cluster collapses to a single `<Combobox>` of allowed transitions when `density="compact"` is set. STOP & ASK on whether to add a `density` prop in Task 307 (if not, render the workflow control inside a Sheet triggered from a single "Change status" row-action button — this is the mobile fallback per Epic HH Decision 5).
  - Recommended default: at `≤md`, the per-row workflow control renders as a single "Change status" button that opens a Sheet (bottom drawer) containing the StatusChangeControl. Desktop ≥md shows pills inline.
- **Sort click during filter-pending state races server** → debounce 200ms; ignore stale fetches; cancel-aware via AbortController.
- **Sort URL state collides with an existing `?sort=` param shape used elsewhere** → confirm naming via grep; canonical is `?sort=<column>&dir=asc|desc` (Epic HH Decision 3 verbatim).
- **Verified-agents tab disappears after AdminUsersTable migration** → Note 20 P0 violation. Tab MUST remain a `Tabs` primitive (canonical) in the filter bar.
- **Status badge colour map changes** → DO NOT alter `STATUS_VARIANT` / `STATUS_BADGE` maps; the primitive consumes them via `statuses` prop.
- **Locale parity check fails** → no new keys are expected in this task (the migration reuses StatusChangeControl's already-created `admin.common.status_control.*` keys from Task 307 + existing listing/user status keys); if parity fails, you accidentally introduced new keys — STOP & ASK.
- **Sticky column z-index conflict at 320 when an AlertDialog opens** → AlertDialog z (high) overrides sticky column z; verify; no fix needed.
- **AdminUsersTable verified-agents subset query relies on URL param shape; sort URL state mixes with it** → preserve `?tab=verified-agents` AND add `?sort=...&dir=...` separately.
- **Implicit "row click opens detail" UX on listings** — currently row click probably opens edit; verify and preserve. DO NOT add row click behaviour where none exists; DO NOT remove existing row click.
- **You feel like ALSO refactoring AdminUsersManager filter bar Combobox-vs-tabs choice** → only IF the Task 304 spec mandates it AND it does not change controls; do not introduce new ones in this task.
- **You feel like ALSO migrating /admin/inquiries/support to share a column header** → STOP. Task 309 owns those.
- **CRITICAL** — if `StatusChangeControl` integration into a per-row context is impractical (e.g. workflow pills can't render inline), the fallback Sheet-trigger pattern above is the canonical answer; do NOT regress to the old transition-button cluster.

## Required investigation (paste in session log BEFORE writing code)

```
# 1. Confirm Task 306 primitives + Task 307 primitive landed and exports
ls src/components/admin/AdminPageShell.tsx \
   src/components/admin/AdminTable.tsx \
   src/components/admin/AdminCardList.tsx \
   src/components/admin/StatusChangeControl.tsx \
   src/components/admin/StatusChangeHistory.tsx
grep -n "export" src/components/admin/AdminPageShell.tsx
grep -n "export" src/components/admin/StatusChangeControl.tsx

# 2. Inventory STATUS_ACTIONS map for accurate transition translation
sed -n '30,80p' src/components/admin/AdminListingsTable.tsx

# 3. Inventory current filter bar + row action structure
sed -n '80,250p' src/components/admin/AdminListingsTable.tsx
sed -n '250,450p' src/components/admin/AdminListingsTable.tsx

# 4. Inventory AdminUsersTable structure
sed -n '1,80p' src/components/admin/AdminUsersTable.tsx
sed -n '80,200p' src/components/admin/AdminUsersTable.tsx

# 5. Inventory canonical Tabs / Combobox usages
grep -n "from '@/components/ui/tabs'" src/components/admin/*.tsx | head -10
grep -n "from '@/components/ui/combobox'" src/components/admin/*.tsx | head -10

# 6. Confirm URL state helper (useSearchParams / router.push)
grep -n "useSearchParams\|router.push" src/components/admin/AdminListingsTable.tsx | head -10
```

## Acceptance criteria

- `AdminListingsTable.tsx`:
  - Outer wrapper = `<AdminPageShell title=... countBadge=... actions=... filterBar=...>`.
  - Table render = `<AdminTable rows=... columns=... rowKey=... stickyColumnIndex=1 emptyState=... loading=... />` with sortable columns wired to URL state.
  - Row actions: edit link + delete (AlertDialog) + premium toggle + StatusChangeControl `variant="workflow"` (inline pills ≥md, Sheet-triggered button ≤md per fallback).
  - All 8 filters preserved + reset all.
  - All STATUS_ACTIONS transitions reachable via the new control for every current status.
  - URL state: `?status&market&premium&type&q&sort&dir&page` (sort + dir NEW; rest preserved verbatim).
- `AdminUsersTable.tsx`:
  - Outer wrapper = `<AdminPageShell ...>`.
  - Table render = `<AdminTable ... stickyColumnIndex=0 (User column sticky) ...>`.
  - Filter bar: role Combobox + status Combobox + Verified Agents `Tabs` — all preserved.
  - URL state: existing params + `?sort&dir` NEW.
  - NO `StatusChangeControl` integration in this task.
- No regression in pagination, search, AlertDialog confirmation flows, empty / loading / error states.
- 7-bp × 4-loc verified at runtime — paste UI pre-flight + UX flow trace in session log per Note 19; before/after control inventory per Note 20.
- `npx tsc --noEmit` → 0 errors.
- `npm run build` → passes.
- `npm run governance:components` → no new MANUAL_REVIEW flags.
- `npm run check:i18n` → PASS (no new keys expected; if you add any STOP & ASK first).
- Self-validation block in session log (Note 18); AC table all green.
- Files Changed table in session log.

## Out of scope (HARD)

- Migrating any admin surface other than `/admin/listings` + `/admin/users`. Task 309 owns Support + Inquiries.
- Editing the `StatusChangeControl` primitive — Task 307 ships it.
- Editing the `AdminPageShell` / `AdminTable` / `AdminCardList` primitives — Task 306 ships them. Bug-fix-level edits to these primitives are allowed if a Task 306 defect surfaces during Task 308 integration, but must be documented + STOP & ASK confirmed.
- Verified Agents workflow on Users table — Task 313 (Epic HH Phase 6).
- DB schema changes.
- Public site changes.
- Email-template or i18n hardening — Epic II tracks.
- Adding new admin filter / column / row action / control to listings or users.

## Notes for orchestrator review

- This task touches the failure-mode-epicenter (admin tables; Notes 20/22). Review will be especially strict on:
  - Before/after control inventory for both tables.
  - STATUS_ACTIONS transition cross-product preserved (no transition lost; no transition added).
  - Existing filter / sort / search / pagination semantics preserved.
  - Sort URL state contract identical for both tables (`?sort&dir`).
  - Sheet fallback for per-row StatusChangeControl at narrow breakpoints (Epic HH Decision 5).
  - 7-bp × 4-loc runtime evidence.
- Orchestrator emits commit commands per surface separately if owner prefers atomic commits (one commit for AdminListingsTable, one for AdminUsersTable).
