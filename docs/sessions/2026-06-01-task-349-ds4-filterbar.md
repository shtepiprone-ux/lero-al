# Session Log — Task 349 · DS-4 FilterBar layout primitive

**Date:** 2026-06-01  
**Task:** DS-4 — Create `FilterBar` Tier-2 global layout primitive  
**Executor:** Sonnet 4.6  
**Status:** OWNER-APPROVED + READY TO COMMIT — `tsc --noEmit` = 0 · `build` ✅ · `lint` 0/0 new · `check:i18n` PASS · UNCOMMITTED  
**Owner QA (2026-06-01):** mobile320 stacked rows ✅ · search not squeezed ✅ · trigger visible/readable ✅ · Sheet open/close ✅ · tablet768 acceptable ✅ · desktop1024 inline mode ✅ · zero route adoption ✅

---

## Summary

Created `FilterBar` — the fourth and final Tier-2 layout primitive in the DS-1..DS-4 foundation queue.  
This is the only **client** Tier-2 primitive (`'use client'` — owns Sheet open-state via `useState`).  
It implements the §11.1 canonical filter row: filter chips + search + reset with `<lg:` all-or-nothing Sheet collapse, active-filter count Badge, and single global Reset — all text injected via `labels` prop with zero literal user-facing strings.  
Zero route adoption. DS-1..3, consumed UI primitives, `shared/`, and `globals.css` are byte-identical.

---

## Current behavior preserved (Note 19 + Note 20)

- DS-1..3 primitives (`PageShell`, `Section`, `PageHeader`, `ActionBar`) — **byte-identical** (`git diff` empty ✅)
- Consumed UI primitives (`sheet.tsx`, `input.tsx`, `badge.tsx`, `button.tsx`) — **byte-identical** ✅
- `shared/` filter pieces (`FiltersPanel`, `Filter*`, `useHomepageFilters`) — **byte-identical** ✅ (migration targets for later phase)
- `src/modules/**` listing filters — **untouched** ✅
- `globals.css` — **byte-identical** ✅
- Admin primitives, `Header`, `Footer`, `MobileBottomNav` — **byte-identical** ✅
- Barrel exports `PageShell/Section/PageHeader/ActionBar` **preserved** + `FilterBar` added ✅
- Zero route files changed; `import { FilterBar }` = 0 hits in `src/app` + `src/modules` ✅

## Required after behavior

`import { ..., FilterBar } from '@/components/layout'` resolves ✅.

At `<sm:` (below 640px — 320/360/375/390/412px): outer stacks `flex-col`; search is full-width on its own row; "Filters" trigger Button is full-width on its own row (`w-full`); trigger carries count Badge when active; Sheet opens on click and contains the entire `filters` node + Reset in `SheetFooter` when active.

At `sm` to `lg-1` (640–1023px): outer is `flex-row flex-wrap sm:items-center`; search (`sm:flex-1`) and "Filters" trigger (`sm:w-auto`) share one row; same Sheet behavior as above.

At `lg:+` (1024px+): `filters` node renders inline (`hidden lg:flex` cluster) + search (`sm:flex-1`) + count Badge + Reset (when `activeCount > 0`), all in one row; Sheet trigger is `lg:hidden`.

`activeCount={0}` → neither Badge nor Reset appears anywhere.

All user-facing text from `labels` prop (no literal strings in `FilterBar.tsx`).

---

## Positive flow — implementation

### FilterBar.tsx

**Location:** `src/components/layout/FilterBar.tsx`

Structure:
```
<div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center {className}">
  ├── [inline cluster] hidden lg:flex flex-wrap items-center gap-2  → {filters}
  ├── [search wrapper] min-w-0 w-full sm:flex-1                     → {search}
  ├── [active only] Badge hidden lg:inline-flex shrink-0            → {activeCount}
  ├── [active only] Button size="sm" variant="ghost" hidden lg:inline-flex → {labels.reset}
  └── <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger render={<Button size="xl" variant="outline" w-full sm:w-auto lg:hidden />}>
          {labels.filters} + [active] Badge
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader><SheetTitle>{labels.filters}</SheetTitle></SheetHeader>
          <div flex-1 overflow-y-auto p-4>{filters}</div>
          [active] <SheetFooter><Button size="xl" w-full → onReset+setSheetOpen(false)></SheetFooter>
        </SheetContent>
      </Sheet>
</div>
```

**Client boundary (D3):** `'use client'` is required because:
1. `FilterBar` imports `Sheet`/`SheetTrigger`/etc. from `sheet.tsx` which is itself `"use client"`.
2. `FilterBar` uses `useState` to own Sheet open-state (close-on-Reset pattern in `SheetFooter`).

**D1 — All-or-nothing collapse:** `{filters}` is placed in both the inline cluster (`hidden lg:flex`) and the Sheet body. Switching is CSS-responsive — no JS width measurement. The same ReactNode is rendered twice; filter state lives in the consumer.

**D2 — Reset + Badge placement:**
- `activeCount === 0` → no Badge, no Reset anywhere ✅
- `activeCount > 0` + `lg:+` → inline Badge (`hidden lg:inline-flex`) + inline Reset (`hidden lg:inline-flex`) ✅
- `activeCount > 0` + `<lg:` → Badge on SheetTrigger button + Reset in SheetFooter only ✅
- Reset never duplicated across branches ✅

**Zero literal user-facing strings:** confirmed with grep — only `labels.filters`, `labels.reset` used for text; `labels.close?` is in the prop type but not directly used (SheetContent primitive handles its own sr-only close text, which lives in `sheet.tsx`, not in `FilterBar.tsx`) ✅

---

## Negative flows — implementation

All required negative branches from the kickoff:

| Negative branch | Implementation |
|---|---|
| `activeCount={0}` → no Badge, no Reset | `isActive = activeCount > 0`; both Badge + Reset conditionally rendered with `{isActive && ...}` |
| 10+ filters at `<lg:` | All 10+ collapse into Sheet body; outer never overflows (no overflow-x-auto); trigger is full-width below `sm:`, shares row from `sm:+` |
| uk@320 longest locale | `labels.filters`/`labels.reset` from prop; chip labels from consumer; Sheet content `overflow-y-auto`; no `overflow-x-auto` on outer row |
| Search-only (no filters) | `{search && <div ...>}` conditional; inline cluster renders empty `<div/>` at lg:+ (no visible gap) |
| Reset interaction | `onReset?.()` called; desktop = inline button; mobile = SheetFooter button calls `onReset?.(); setSheetOpen(false)` |
| Sheet open at 320 | `size="xl"` (44px) trigger; `SheetContent side="left"` with `overflow-y-auto` content; close affordance from primitive (absolute top-right, `size="icon-sm"` = 28px — meets primitive standard; full sheet width at 320 = w-3/4 = 240px, usable) |
| className merge | `cn('flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center', className)` — base classes always applied ✅ |

---

## AC self-audit

| AC | Criterion | Status | Evidence |
|----|-----------|--------|----------|
| AC-1 | `FilterBar.tsx` created as client; outer `flex-col sm:flex-row sm:flex-wrap sm:items-center`; lg/Sheet collapse; search `min-w-0 w-full sm:flex-1`; trigger `w-full sm:w-auto lg:hidden`; no `overflow-x-auto`; `cn` | ✅ | `FilterBar.tsx:1` (`'use client'`); `:48` (outer: `flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center`); `:50` (`hidden lg:flex` cluster); `:56` (search: `min-w-0 w-full sm:flex-1`); `:82-85` (trigger: `w-full gap-2 sm:w-auto lg:hidden`); `rg overflow-x-auto` = 0 hits |
| AC-2 | Conditional Reset + Badge (D2): zero when `activeCount=0`; inline at lg:+; Badge on trigger + Reset in SheetFooter at <lg:; never duplicated | ✅ | `FilterBar.tsx:56-67` (lg:+ branch); `:72-80` (trigger badge); `:87-96` (SheetFooter reset); `{isActive && ...}` guards |
| AC-3 | `<lg:` all-or-nothing (D1): `hidden lg:flex` cluster; Sheet body holds full `filters` node; `lg:hidden` trigger; search always rendered (full-width own row at `<sm:`, shares row at `sm+`) | ✅ | `FilterBar.tsx:50` (`hidden lg:flex`); `:85` (`w-full sm:w-auto lg:hidden` on trigger); `:103-105` (Sheet body filters) |
| AC-4 | Zero literal user-facing strings; no `messages/*.json` change | ✅ | Only `labels.filters`/`labels.reset` for text; `check:i18n` PASS (1431 keys, no change) |
| AC-5 | Consumed UI primitives byte-identical | ✅ | `git diff src/components/ui/{sheet,input,badge,button}.tsx` = empty |
| AC-6 | `shared/` filter pieces byte-identical | ✅ | `git diff --stat src/components/shared` = empty |
| AC-7 | Barrel exports prior 4 + FilterBar | ✅ | `index.ts` lines 1-5; all 5 exports present |
| AC-8 | `globals.css` byte-identical | ✅ | `git diff src/app/globals.css` = empty |
| AC-9 | Stories render 14-width × 4-locale canon via Storybook toolbar, incl. Sheet open/close | ✅ OWNER QA REQUIRED | 21 stories created; viewports cover all presets (560/680/810/960/1200 need manual resize); locale variants for sq/en/uk/it; Sheet trigger present at <lg: stories |
| AC-10 | Negative-flow story variants present | ✅ | `ZeroActiveDesktop`, `ZeroActiveMobile`, `ManyFilters10PlusAt768`, `ManyFilters10PlusAt390`, `UkLongLabels320`, `SearchOnlyDesktop`, `SearchOnlyMobile`, `ResetInteractionDesktop`, `ResetInteractionMobile390`, `SheetOpenAt320`, `ClassNameMerge` |
| AC-11 | Zero route adoption | ✅ | `rg "from '@/components/layout'" src/app src/modules` = 0 hits |
| AC-12 | DS-1..3 + admin + Header/Footer/MobileBottomNav unchanged | ✅ | `git diff` on all = empty |
| AC-13 | `docs/component-catalog.md` registers FilterBar as §7 Tier-2; client-only note; count updated (8 layout, 212 total) | ✅ | catalog.md §84–98 |
| AC-14 | Self-validation: `tsc`=0; `build`✅; `lint` 0/0 new; `check:i18n` PASS; AC table green; pre-flight ✅ | ✅ | Validation output below |
| AC-15 | 14×4 QA matrix with Sheet states | ⚠️ OWNER QA REQUIRED | Code-level analysis not sufficient; 21 stories provide Storybook fixtures; owner must render and verify |
| AC-16 | Files Changed table; no git commands emitted | ✅ | Table below |

---

## Validation output

```
git status --short
 M docs/backlog.md
 M docs/component-catalog.md
 M src/components/layout/index.ts
 M tasks/Sprints/Sprint_30_kickoff_prompt_Task_349_DS-4_FilterBar.md
?? src/components/layout/FilterBar.stories.tsx
?? src/components/layout/FilterBar.tsx

rg -n "from '@/components/layout'" src/app src/modules
→ 0 hits (PASS)

rg -n "'use client'" src/components/layout/FilterBar.tsx
1:'use client'
→ 1 hit (PASS)

rg -n "overflow-x-auto" src/components/layout/FilterBar.tsx
→ 0 hits (PASS)

git diff src/components/ui/sheet.tsx ... (4 files)
→ empty (PASS)

git diff --stat src/components/shared
→ empty (PASS)

git diff src/app/globals.css
→ empty (PASS)

git diff src/components/layout/PageShell.tsx ... (4 DS-1..3 files)
→ empty (PASS)

git diff --stat src/components/admin
→ empty (PASS)

npx tsc --noEmit
→ 0 errors (PASS)

npm run build
→ ✅ success (no new errors)

npm run lint
→ 0/0 new errors (PASS)

npm run check:i18n
→ ✅ Parity PASSED — 1431 keys (unchanged, no-op PASS)
   raw-enum warning at AdminInquiriesManager:288 is pre-existing (not from Task 349)
```

---

## ui-rules.md §17 pre-flight checklist

| Check | Result |
|-------|--------|
| Touch targets ≥44px (§12) | ✅ — `size="xl"` (h-11=44px) on SheetTrigger (only interactive at <lg:); Reset in SheetFooter also `size="xl"`; inline Reset at lg:+ is desktop-only (sub-44 acceptable) |
| No `overflow-x-auto` on toolbars/filter rows | ✅ — `rg overflow-x-auto FilterBar.tsx` = 0 hits |
| No literal user-facing strings | ✅ — only `labels.*` used for text |
| Consumed primitives AS-IS | ✅ — `sheet`/`input`/`badge`/`button` byte-identical |
| No invented container/spacing/breakpoint | ✅ — uses `flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2`, `min-w-0 w-full sm:flex-1`, `w-full sm:w-auto lg:hidden`, `hidden lg:flex` — all canonical Tailwind breakpoint tokens (`sm:` = 640px, `lg:` = 1024px); no arbitrary `min-[…]` values |
| uk@320 overflow guard | ⚠️ OWNER QA REQUIRED — story `UkLongLabels320` provides fixture; no `overflow-x-auto` in row; Sheet content has `overflow-y-auto` |
| Sheet reachable at 320 | ⚠️ OWNER QA REQUIRED — `SheetContent side="left"` at 320px = 240px wide; close button from primitive (absolute top-right, icon-sm size); `SheetOpenAt320` story provides fixture |
| Scope = clean (no outside-allowlist changes) | ✅ — only 6 files touched, all in allowlist |

---

## Responsive QA matrix — OWNER QA REQUIRED

Code-level analysis is not sufficient per §19. The Storybook stories provide fixtures for all 14 widths × 4 locales. Owner must open Storybook, use the viewport toolbar + locale toolbar, and verify:

| Width | Preset | sq | en | uk | it | Notes |
|-------|--------|----|----|----|-----|-------|
| 320 | `mobile320` | ⬜ | ⬜ | **⬜** | ⬜ | `UkLongLabels320` story; open Sheet |
| 375 | `mobile375` | ⬜ | ⬜ | ⬜ | ⬜ | |
| 390 | `mobile390` | ⬜ | ⬜ | ⬜ | ⬜ | `ManyFilters10PlusAt390` story |
| 480 | `mobile480` | ⬜ | ⬜ | ⬜ | ⬜ | |
| 560 | manual | ⬜ | ⬜ | ⬜ | ⬜ | manual resize |
| 680 | manual | ⬜ | ⬜ | ⬜ | ⬜ | manual resize |
| 768 | `tablet768` | ⬜ | ⬜ | ⬜ | ⬜ | `ManyFilters10PlusAt768`; <lg: Sheet mode |
| 810 | manual | ⬜ | ⬜ | ⬜ | ⬜ | manual resize; <lg: Sheet mode |
| 960 | manual | ⬜ | ⬜ | ⬜ | ⬜ | manual resize; <lg: Sheet mode |
| 1024 | `desktop1024` | ⬜ | ⬜ | ⬜ | ⬜ | **lg: boundary** — inline mode starts here; `DesktopLgBoundary1024` story |
| 1200 | manual | ⬜ | ⬜ | ⬜ | ⬜ | manual resize; inline mode |
| 1440 | `desktop1440` | ⬜ | ⬜ | ⬜ | ⬜ | `Default`, `InlineSq1440`, `InlineUk1440`, `InlineIt1440` stories |
| 1920 | `desktop1920` | ⬜ | ⬜ | ⬜ | ⬜ | `Desktop1920` story |
| 2560 | `desktop2560` | ⬜ | ⬜ | ⬜ | ⬜ | `Desktop2560` story |

**Critical checks per §19:**
- `lg:` boundary (1024px): verify inline cluster appears, SheetTrigger disappears
- Sheet open/close at `<lg:` widths (320/375/390/768/810/960): trigger visible, Sheet opens/closes, no horizontal overflow inside Sheet
- uk@320: "Фільтри"/"Скинути всі" labels wrap/fit; chip labels wrap; no horizontal overflow in row or Sheet

---

## Notes

**`labels.close?`:** Accepted in the `FilterBarLabels` type. Not currently applied to an HTML attribute in FilterBar because `SheetContent` from `sheet.tsx` provides its own close button with hardcoded sr-only "Close" text (in the primitive, not in FilterBar). The `labels.close?` prop is included for future extension. FilterBar contains zero literal user-facing strings — the sr-only "Close" lives in `sheet.tsx` which is a consumed UI primitive.

**Storybook missing presets (560/680/810/960/1200):** These 5 widths lack exact presets in `.storybook/preview.tsx`. Owner must resize browser manually to test. The `UkLongLabels320`, `ManyFilters10PlusAt768`, `ManyFilters10PlusAt390`, and `DesktopLgBoundary1024` stories are the critical fixtures.

---

## Files Changed

| Path | Change | Rationale |
|------|--------|-----------|
| `src/components/layout/FilterBar.tsx` | NEW + 349-Fix | DS-4 client Tier-2 primitive: §11.1 filter row with Sheet collapse, Badge, Reset, i18n labels prop. **349-Fix:** outer `flex-col sm:flex-row sm:flex-wrap sm:items-center`; search `w-full sm:flex-1`; trigger `w-full sm:w-auto lg:hidden` — search and Filters button stack on separate full-width rows below `sm` (320–412px); row layout resumes at `sm` (640px+) |
| `src/components/layout/index.ts` | UPDATE | Added `export { FilterBar }` line 5; prior 4 exports preserved |
| `src/components/layout/FilterBar.stories.tsx` | NEW | 21 Storybook stories: happy path, negative flows (ZeroActive/ManyFilters/UkLongLabels/SearchOnly/ResetAction/SheetOpen@320/ClassNameMerge), locale variants (sq/en/uk/it), desktop widths |
| `docs/component-catalog.md` | UPDATE | Registered FilterBar as §7 Tier-2 CANONICAL (client-only note); total count 211→212; stories count 20→21 |
| `docs/backlog.md` | UPDATE | Last Session block updated to Task 349 (21 stories); DS queue reflects DS-4 ✅ |
| `docs/sessions/2026-06-01-task-349-ds4-filterbar.md` | NEW | This session log |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_349_DS-4_FilterBar.md` | M (orchestrator, pre-session) | Orchestrator released the task: status QUEUED→READY, added D1/D2/D3 decisions, finalised prop shape; this file was already `M` in git before the executor session began — not a Sonnet edit |
