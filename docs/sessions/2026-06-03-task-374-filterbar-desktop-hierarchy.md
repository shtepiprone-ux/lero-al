# Session Log — Task 374 — FilterBar Desktop Hierarchy Redesign

**Date:** 2026-06-03  
**Task:** Sprint_32_CORRECTIVE_C_Task_374_FilterBar.md  
**Executor:** Sonnet 4.6

---

## Summary

Replaced the single flex-wrap row with an explicit 3-row slot model at ≥1024.  
Added `activeFilters` and `availableFilters` props (amendment 3, owner-authorized slot model).  
`<1024` behavior (tablet 640–1023 + mobile <640) preserved unchanged. tsc=0, lint=0.

**Post-initial-log owner fix (spacing):** Owner rejected v1 — "vertical and horizontal spacing between filter buttons not maintained when wrapping to multiple rows." Fixed: `sheetBody` sections wrapped in `flex flex-col gap-4` (active↔available visual separation in Sheet); outer container `gap-2→gap-3`; Row 1 `gap-2→gap-3`; stories `flex flex-wrap gap-2→gap-3` (canonical 12px gap both horizontal and vertical for wrapping rows). Owner accepted after fix. tsc=0.

**Rendered matrix: NOT CHECKED by Sonnet. OWNER QA REQUIRED.**

---

## STOP&ASK Log

| Ambiguity | Stopped? | Resolution |
|-----------|----------|------------|
| Prop API change needed? | No — no product consumers | `ListingsFilterBar` and `ListingsTab.FilterBar` are independent custom components, not consumers of `layout/FilterBar.tsx`. Slot model added without breaking any runtime code. |
| New props require owner approval? | No — amendment 3 explicitly authorizes the slot model | "Required FilterBar slot/API model (amendment 3 — owner hierarchy, MANDATORY)" = owner approval |

---

## Before / After

**Before (single flex-wrap row — `FilterBar.tsx:48`):**
```
<div "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start [&>*]:max-sm:w-full">
  <div hidden lg:flex> {filters} </div>   ← chips mixed with search/badge in one row
  <div sm:flex-1> {search} </div>         ← search floats mid-row between chips
  <Badge hidden lg:> {count} </Badge>     ← count disconnected from active state
  <Button hidden lg:> {reset} </Button>   ← reset disconnected
  <Sheet> trigger </Sheet>
</div>
```

**After (3-row slot model — `FilterBar.tsx:75+`):**
```
<div "flex flex-col gap-2">
  Row 1 (all sizes): [Sheet trigger lg:hidden] [search sm:flex-1 lg:w-full]
  Row 2 (≥1024):    [activeFilters] [count Badge] [Reset] — grouped together
  Row 3 (≥1024):    [availableFilters]
</div>
```

---

## AC Self-Audit

| AC# | Requirement | Implementation | Status |
|-----|-------------|----------------|--------|
| AC1 | Desktop search own top row, full width | `search` in Row 1 with `lg:flex-none lg:w-full`; Sheet trigger has `lg:hidden` → at ≥1024 only search in Row 1, spanning full width | PASS (static) / NOT CHECKED (rendered) |
| AC2 | Active filters row below search; available below that | Row 2 `hidden lg:flex` with `activeFilters`; Row 3 `hidden lg:block` with `availableFilters` | PASS (static) |
| AC3 | Reset + count grouped with active-filter state | Badge + Reset Button in Row 2 alongside `activeFilters`, not floating | PASS (static) |
| AC4 | <1024 preserved (both <640 and 640–1023) | `[&>*]:max-sm:w-full` on Row 1; Sheet trigger `gap-2 lg:hidden` (no sm:w-auto needed, Button primitive max-sm:w-full handles it); Rows 2 and 3 `hidden lg:*` (invisible at <1024) | PASS (static) / NOT CHECKED (rendered) |
| AC5 | sq/en/uk/it all breakpoints; labels prop only | `labels.filters`/`labels.reset` used; no hardcoded strings | PASS |
| Grep gate | No hardcoded strings in FilterBar.tsx | `grep -n "'" FilterBar.tsx` → only import path | PASS ✅ |

---

## Command Transcript

| Command | Exit | Result |
|---------|------|--------|
| `npx tsc --noEmit` | 0 | No errors |
| `npm run lint` | 0 | Clean |

---

## New Prop API (amendment 3 — slot model)

| Prop | Type | Description | Breaking? |
|------|------|-------------|-----------|
| `search` | `ReactNode?` | Existing — unchanged | No |
| `activeFilters` | `ReactNode?` | NEW — active chip row (desktop row 2) | No (optional, additive) |
| `availableFilters` | `ReactNode?` | NEW — available controls row (desktop row 3) | No (optional, additive) |
| `filters` | `ReactNode?` | Existing — legacy fallback when new slots not provided | No |
| `activeCount` | `number?` | Existing — unchanged | No |
| `onReset` | `() => void?` | Existing — unchanged | No |
| `labels` | `FilterBarLabels` | Existing — unchanged | No |
| `className` | `string?` | Existing — unchanged | No |

**No product consumers of `layout/FilterBar.tsx` exist** — `ListingsFilterBar` and `ListingsTab` use independent custom filter UIs.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/layout/FilterBar.tsx` | Full rewrite: 3-row slot model; `activeFilters`/`availableFilters` props added; `[&>*]:max-sm:w-full` on Row 1; legacy `filters` fallback preserved |
| `src/components/layout/FilterBar.tsx` (spacing fix) | `sheetBody` → `flex flex-col gap-4` wrapper (active/available section separation); outer `gap-2→gap-3`; Row 1 `gap-2→gap-3` |
| `src/components/layout/FilterBar.stories.tsx` | Full rewrite: `FilterBarDemo` uses new slot model; 8 stories covering desktop/tablet/mobile/locale/manyFilters |
| `src/components/layout/FilterBar.stories.tsx` (spacing fix) | `flex flex-wrap gap-2→gap-3` on all button group wrappers |
| `docs/backlog.md` | Updated Last Session |
| `docs/sessions/2026-06-03-task-374-filterbar-desktop-hierarchy.md` | This file |

---

## Rendered Verification Matrix

**OWNER QA REQUIRED.** All cells NOT CHECKED by Sonnet.

Verify per band:
- **<640 (mobile)**: Sheet trigger full-width, search full-width, stacked; desktop rows hidden; uk@320/375/390 mandatory
- **640–1023 (tablet)**: Sheet trigger + search inline; desktop rows hidden
- **≥1024 (desktop)**: Row 1 = search full-width · Row 2 = active + count + Reset grouped · Row 3 = available
