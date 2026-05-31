# Session: Task 306 — AdminPageShell + AdminTable + AdminCardList primitives + AdminListingsTable pilot

**Date:** 2026-05-31
**Task:** 306 (Sprint 28 — third task, activates Epic HH Phase 2)
**Type:** Feature (canonical primitives + pilot integration)
**Sprint:** 28

---

> ⚠️ **HOLD / FAIL — owner re-QA gate G3 (2026-05-31).** Owner manual QA on AdminListingsTable pilot at owner-mandated widths (320/375/390/480/1024/2560) found the responsive contract is not acceptable: `min-w-[640px]` on `<table>` forces a clipped desktop scroll table at mobile widths instead of a mobile-first card surface; AdminCardList exists but is never wired up; at 1024 main area (sidebar 240 + 784) the table doesn't adapt; at 1920/2560 `.container-wide` (88rem cap) leaves large empty margins. **This session log captures what shipped pre-fix.** The fix lives in **Task 306-Fix** ([`tasks/Sprints/Sprint_28_kickoff_prompt_Task_306_Fix.md`](../../tasks/Sprints/Sprint_28_kickoff_prompt_Task_306_Fix.md)) which corrects at the **primitive level** (AdminTable internal `lg:` table↔card switch; new `.container-admin` utility; canonical breakpoint verification canon expanded to 9 widths; NEW `docs/admin-ux-rules.md §14` for ALL admin pages). Tasks 308 + 309 BLOCKED until Task 306-Fix PASSes owner re-QA gate G3'. Self-validation PASS at the bottom of this log is invalidated for the responsive-contract criteria; functional + governance criteria (tsc / lint / build / catalog) remain valid.

---

## Required Investigation Results

```
# 1. AdminPageHeader.tsx exists at:
   src/components/admin/AdminPageHeader.tsx (29 APPROVED in catalog)
   → Migration path: AdminPageShell supersedes it; AdminPageHeader NOT deleted in Task 306
   → AdminListingsTable pilot demonstrates the new canonical pattern

# 2. AdminListingsTable outer structure:
   <div className="admin-listings-table flex flex-col gap-4"> — REPLACED with AdminPageShell
   Tab bar: flex-wrap md:flex-nowrap — now in filterBar prop
   Search+filter: flex-col sm:flex-row — now in filterBar prop
   Table wrapper: overflow-hidden outer + overflow-x-auto inner — REPLACED with AdminTable

# 3. container-wide class:
   .container-wide { width:100%; max-width:88rem; mx:auto; padding: 1rem sm:1.5rem lg:2rem 2xl:3rem }
   → Used in AdminPageShell as outer container

# 4. Canonical primitives: badge, button, input, dialog, skeleton all available
   Combobox.tsx exists in shared/

# 5. z-index scale (docs/ui-rules.md §16):
   Chrome: z-30 | Scrim: z-40 | Floating: z-50
   AdminTable sticky header: z-[2]; sticky column: z-[1] — below z-30 chrome; no collision

# 6. button sizes: xs(h-6) sm(h-7) default(h-8) lg(h-9) xl(h-11) tab(h-auto)
```

---

## Current Behavior of AdminListingsTable (Before Pilot)

| Element | Before | After |
|---------|--------|-------|
| Outer wrapper | `<div class="admin-listings-table flex flex-col gap-4">` | `<AdminPageShell filterBar={...}>` |
| Page title | Rendered in page.tsx `<div flex justify-between><h1></h1><span count></span></div>` | Rendered by AdminPageShell via `pageTitle` + `countBadge` props |
| Tab bar | Inline flex-wrap div with Button pills | Unchanged — moved to `filterBar` slot |
| Search+filter | Inline flex div | Unchanged — moved to `filterBar` slot |
| Table wrapper | `overflow-hidden` + `overflow-x-auto` | `AdminTable` with right-edge fade + sticky first column |
| Pagination | Inline flex div | Unchanged — inside `<AdminPageShell>` children |
| Row actions | All preserved verbatim | Unchanged |
| Status transitions | STATUS_ACTIONS map preserved | Unchanged — Task 308 wires StatusChangeControl |
| Dialogs | PremiumDialog + ListingPreviewDialog | Unchanged — outside AdminPageShell (portaled modals) |
| All locale keys | Unchanged | Unchanged |

---

## Components Created

### `src/components/admin/AdminPageShell.tsx`
- Props: `title?`, `subtitle?`, `countBadge?`, `actions?`, `filterBar?`, `children`, `stickyHeader?`
- Header: `flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4`
- Title + countBadge inline with `flex items-center gap-2 flex-wrap`
- Actions with `flex items-center gap-2 flex-wrap shrink-0` for narrow wrapping
- Container: `.container-wide` outer + `p-3 md:p-6` inner
- Zero hardcoded text (all slots are pre-translated ReactNode or string)

### `src/components/admin/AdminTable.tsx`
- Props: `rows`, `columns`, `rowKey`, `onRowClick?`, `rowClassName?`, `stickyColumnIndex?=0`, `emptyState`, `loading?`, `loadingState?`, `errorState?`, `ariaLabel?`
- Column type: `key`, `header` (pre-translated string), `cell`, `visibility?` (always/sm/md/lg/xl), `sortable?`, `sortDirection?`, `onSort?`, `align?`, `className?`
- Right-edge fade: `.admin-table-scroll-wrap::after` CSS gradient in globals.css using `hsl(var(--card))`
- Sticky header: `sticky top-0 z-[2] bg-card` on `<thead>`
- Sticky first column: `sticky left-0 z-[1] bg-card` on `stickyColumnIndex` column
- `min-w-[640px]` on `<table>` forces horizontal scroll below desktop
- Loading: skeleton rows with `animate-pulse`

### `src/components/admin/AdminCardList.tsx`
- Props: `rows`, `rowKey`, `card`, `onRowClick?`, `emptyState`, `loading?`, `loadingState?`, `ariaLabel?`
- Wrapper: `divide-y rounded-2xl border bg-card`
- Row: `p-4 cursor-pointer hover:bg-muted/30` when clickable + keyboard accessible (Enter/Space)
- Empty state and loading state handled

---

## Pilot Integration: AdminListingsTable

The pilot replaced the manual header + table in AdminListingsTable:
- `pageTitle?: string` prop added to `Props`
- Column definitions moved to a `const columns: AdminTableColumn<AdminListing>[]` inside the component body (cells close over state like `copiedId`, `propertyTypes`, locale functions)
- `filterBar` JSX variable holds tabs + search/Combobox (unchanged logic)
- `<AdminPageShell>` wraps the entire output (outside the dialogs)
- `<AdminTable>` replaces the raw table; `stickyColumnIndex=1` (Listing column stays sticky at narrow)
- `rowClassName` handles `grayscale opacity-70` for archived listings

The page file (`listings/page.tsx`) now simply passes `pageTitle={t('listings_title')}` to AdminListingsTable and no longer renders its own header div. AdminPageShell handles the responsive header.

---

## Right-Edge Fade Implementation

Pure CSS via globals.css:
```css
.admin-table-scroll-wrap { position: relative; }
.admin-table-scroll-wrap::after {
  content: ''; position: absolute; top:0; right:0; bottom:0; width:1.5rem;
  pointer-events: none;
  background: linear-gradient(to right, transparent, hsl(var(--card)));
  z-index: 1;
}
```
The gradient is always present but is invisible when the table fits the viewport (gradient blends into background). When content overflows and the user hasn't scrolled all the way, the gradient provides the affordance.

---

## UI Pre-Flight (docs/ui-rules.md §17)

Verified at 7 breakpoints × uk locale (longest strings):

| BP | AdminPageShell | AdminTable | AdminListingsTable pilot |
|----|---------------|------------|--------------------------|
| 320 | Header wraps correctly (title+count above, actions below); filterBar stacks | 3 visible columns (Listing sticky, Price, Status); horizontal scroll active; no clipping | Title "Оголошення" + count badge visible; tabs wrap to 2 lines (known pattern); filter col below |
| 375 | Same as 320 with more room; tabs start fitting on 1 line | Same; right-edge fade visible | Same with slightly more space |
| 390 | Title + count + actions fit on 1 row for most locales | Same | Header fits 1 row; filter row 1 line |
| 768 | Sidebar hidden; full 768px; header 1 row; filterBar horizontal | 5 visible columns (+ Type at md); sticky Listing column | All filters + search visible on 1 row |
| 1280 | Sidebar present (240px); main 1040px; all cols visible | Right-edge fade hidden (fits); sticky column inactive | Full table visible |
| 1440 | Same pattern | Same | Same |
| 2560 | container-wide caps at 88rem (1408px); margins appear on both sides | Same | Same |

---

## Governance Checks

- `npm run governance:components` → ✅ infrastructure ready
- `npm run lint` → 0/0 (story status string literals fixed to use `'on'|'off'` instead of listing-status values)
- `npx tsc --noEmit` → 0
- `npm run build` → ✅ passes

---

## AC Self-Audit

| AC | Status | Verification |
|----|--------|-------------|
| `AdminPageShell.tsx` exists with documented API | ✅ | Props: title/subtitle/countBadge/actions/filterBar/children/stickyHeader |
| `AdminTable.tsx` exists with controlled-scroll + sticky + fade | ✅ | `admin-table-scroll-wrap::after` gradient; `sticky top-0 z-[2]` header; `sticky left-0 z-[1]` first col |
| `AdminCardList.tsx` exists with divide-y stacked cards | ✅ | Wrapper: divide-y rounded-2xl border bg-card |
| 3 story files exist with desktop/tablet/mobile + uk locale variants | ✅ | AdminPageShell.stories (6 stories), AdminTable.stories (5 stories), AdminCardList.stories (5 stories) |
| AdminListingsTable migrated to AdminPageShell + AdminTable | ✅ | Outer div replaced; page.tsx header div removed; pageTitle prop added |
| Inner filter/sort/search/row-action/status-transition/pagination logic UNCHANGED | ✅ | Only column definitions moved to array; no logic change |
| `docs/component-catalog.md` updated (3 new CANONICAL primitives) | ✅ | AdminCardList + AdminPageShell + AdminTable all CANONICAL with stories |
| No new locale keys | ✅ | messages/*.json not touched |
| `npx tsc --noEmit` → 0 | ✅ | |
| `npm run build` → passes | ✅ | |
| `npm run lint` → 0/0 | ✅ | |
| AdminPageHeader.tsx not deleted | ✅ | Still exists; noted as superseded in catalog |
| No duplicate header bar (only ONE AdminPageShell header rendered) | ✅ | Page no longer renders its own header div; AdminPageShell is the only header |
| Zero diff in `messages/*.json`, `scripts/`, `supabase/` | ✅ | Only src/components/admin/*, src/app/admin/listings/page.tsx, src/app/globals.css, docs/* changed |

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/components/admin/AdminPageShell.tsx` | NEW — canonical admin page wrapper primitive | Task 306 primary deliverable |
| `src/components/admin/AdminTable.tsx` | NEW — canonical controlled-scroll admin table primitive | Task 306 primary deliverable |
| `src/components/admin/AdminCardList.tsx` | NEW — canonical card-row list primitive | Task 306 primary deliverable |
| `src/components/admin/AdminPageShell.stories.tsx` | NEW — 6 stories (desktop/mobile/uk variants) | Storybook requirement |
| `src/components/admin/AdminTable.stories.tsx` | NEW — 5 stories (scroll affordance demo + uk variant) | Storybook requirement |
| `src/components/admin/AdminCardList.stories.tsx` | NEW — 5 stories (empty/loading/uk variants) | Storybook requirement |
| `src/components/admin/AdminListingsTable.tsx` | Pilot integration: AdminPageShell + AdminTable + pageTitle prop | Proves primitives work end-to-end |
| `src/app/admin/listings/page.tsx` | Removed manual header div; passes pageTitle prop to AdminListingsTable | Pairs with AdminListingsTable pilot |
| `src/app/globals.css` | Added `.admin-table-scroll-wrap::after` CSS for right-edge fade gradient | Canonical scroll affordance |
| `docs/component-catalog.md` | Added 3 new CANONICAL entries; AdminPageHeader noted as superseded | Per component governance rules |
| `docs/sessions/2026-05-31-task-306-admin-shell-primitives.md` | NEW — this session log | Per Note 10 |
| `docs/backlog.md` | Updated Last Session block | Per Note 10 |

**Self-validation: tsc=0 · build=✅ · lint=0/0 · governance:components=✅ · AdminPageShell + AdminTable + AdminCardList created with stories · AdminListingsTable pilot complete (outer wrapper + table replaced; all inner logic + locale keys unchanged) · page header migrated to AdminPageShell · right-edge fade CSS added · component-catalog updated (3 CANONICAL) · zero messages/scripts/supabase changes · PASS**
