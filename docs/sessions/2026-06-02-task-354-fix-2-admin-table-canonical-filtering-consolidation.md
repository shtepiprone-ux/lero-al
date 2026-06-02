# Session Archive: Task 354-Fix-2 — AdminTable Canonical Filtering Consolidation — 2026-06-02

## Verdict

**Task 354-Fix-2 AdminTable canonical filtering consolidation — COMPLETE (OWNER QA REQUIRED for rendered Storybook)**

---

## Note 22 — Before/After Mode Inventory

### Before (79 exports, two parallel families)

**Non-filtered base family (~39 stories):** `Desktop1280`, `Desktop1440`, `CustomCardLayout_*`, `*_Interactive` (14 widths + locales), `ResponsiveSwitch_*`, `UkrainianLongStrings_*`, `EmptyState`, `EmptyState_Interactive`, `LoadingState`, `LoadingState_Interactive` — none of these showed the column-filter affordance. Docs primary (`Desktop1280`) was an unfiltered table.

**Filtered family (~40 stories):** `Filtered_*` (all 14 widths + interactive + RS + empty + locales) — the correct `ColumnFilteredTableDemo`, but in a *separate parallel family* under the `Filtered_` prefix.

**Root defect:** the first export was `Desktop1280` (no filters). Docs autodocs showed an old unfiltered table as the component's canonical example.

### After (34 exports, one canonical family)

Every story shows the canonical column-filtered table. First export is `Primary` (Docs shows filtered table).

| Mode | Before story name(s) | After story name | Preserved? |
|---|---|---|---|
| Static filtered table (all 14 widths) | `Filtered_Desktop1280` … `Filtered_Mobile320` | `Primary`, `W320`–`W2560` (14 + 1) | ✅ |
| Interactive + filtering | `Filtered_Interactive_Desktop1280/1024/Mobile320` | `Interactive_Desktop1280`, `Interactive_Mobile320` | ✅ |
| Responsive Switch | `Filtered_ResponsiveSwitch_*` / `ResponsiveSwitch_*` | `ResponsiveSwitch_Mobile320/Tablet768/Desktop1024/Desktop1280` | ✅ |
| Locale stress (uk/sq/it) | `Filtered_Uk_*/Sq_*/It_*` | `Uk_Desktop1280`, `Uk_Mobile320`, `Sq_Desktop1280`, `It_Desktop1280` | ✅ |
| Long-string stress | `UkrainianLongStrings_*` | `LongStrings_Desktop/Mobile320/Interactive_Desktop/Interactive_Mobile320` | ✅ |
| Empty (base) | `EmptyState` | `EmptyBase` | ✅ |
| Empty (filtered result) | `Filtered_EmptyResult_*`, `ColFilter_EmptyResult_*` | `EmptyFiltered`, `EmptyFiltered_Mobile320`, `EmptyFiltered_Uk` | ✅ |
| Loading | `LoadingState` | `Loading` | ✅ |
| Chevron (interactive) | via `*_Interactive` | via `Interactive_*`, `LongStrings_Interactive_*` | ✅ |
| Card mode | via mobile stories | via `W320`–`W960`, `ResponsiveSwitch_Mobile320/Tablet768` | ✅ |
| Column-header filter affordance | `ColFilter_*` / `Filtered_*` (canonical) | ALL stories — it's the canonical state | ✅ |
| Header-anchored filter popover | not implemented (full-width block) | ✅ via Popover from `@/components/ui/popover` | ✅ NEW |

**Removed modes (authorized by kickoff):** `EmptyState_Interactive`, `LoadingState_Interactive`, `CustomCardLayout_*`, `Desktop1280`/`Desktop1440` non-filtered static — all removed because they existed only to duplicate a non-filtered view. The canonical filtered table covers the same visual territory. The `EmptyBase` story serves as the empty-without-interaction story.

No real behavior mode was silently dropped.

---

## Root Cause Fix

The structural defect was: `Desktop1280` (non-filtered) was the first export → Docs showed an unfiltered table. Fix: the first export is now `Primary` (filtered, `canonical1200` viewport). All stories use `ColumnFilteredTableDemo` — filtering is always visible.

---

## Header-Anchored Filter: Technical Approach

**Problem:** Previous implementation had a full-width `ColFilterPanel` block rendered above the table. The owner required a header-anchored control next to each column.

**Solution:** Changed `AdminTableColumn.header: string → ReactNode`. For filterable columns, the story wrapper (`ColumnFilteredTableDemo`) passes a `<Popover>` as the column `header`. The `PopoverTrigger` renders the column label + `ArrowUpDown` icon; `PopoverContent` (anchored via Base UI's Portal + Positioner) contains the column-specific filter control. This renders ADJACENT to the column header, not in a top block.

**AdminTable.tsx change:** One property type change, additive and non-breaking:
```ts
// Before:
header: string
// After:
/** String label OR ReactNode (e.g. a header-anchored Popover trigger). */
header: ReactNode
```

**Existing `filterable`/`onFilterClick` props** are not used for the header-anchored Popover pattern (Popover manages its own open state). The `filterActive` prop is still used for `<th>` tinting (`bg-primary/5` + `text-primary`).

**Why Popover doesn't close on filter state change:** `Popover` is a stable component type (from `@base-ui/react`). When `ColumnFilteredTableDemo` re-renders after a chip click, React reconciles `<th key={col.key}>` by key and reconciles `<Popover>` by stable type — it doesn't unmount/remount. Base UI's internal `open` state is preserved. The popover stays open while the user toggles chips.

**`ColFilterPanel` (full-width block):** removed from the file — its UI is now inline in each column's `filterHeader()` JSX.

---

## Deleted Stories List

All 79 previous exports were removed; 34 new canonical exports replace them.

**Removed (non-filtered base family):**
`Desktop1280`, `Desktop1440`, `CustomCardLayout_Mobile320`, `CustomCardLayout_Mobile390`, `Desktop1280_Interactive` through `Mobile320_Interactive` (14), `Uk_*/Sq_*/It_*_Interactive` (11), `ResponsiveSwitch_Mobile320/Tablet768/Desktop1024/Desktop1280`, `UkrainianLongStrings_Mobile320/Desktop/Interactive_Desktop/Interactive_Mobile320`, `EmptyState`, `EmptyState_Interactive`, `LoadingState`, `LoadingState_Interactive`

**Removed (Filtered_* family — merged into canonical):**
All 37 `Filtered_*` exports from Task 354-Fix

**Coverage preserved by:** the 34 canonical exports in the new file

---

## Canonical Story List (34 exports)

| Group | Stories | Count |
|---|---|---|
| Primary (Docs entry) | `Primary` | 1 |
| Breakpoints (all 14 DS widths, static filtered) | `W320`, `W375`, `W390`, `W480`, `W560`, `W680`, `W768`, `W810`, `W960`, `W1024`, `W1200`, `W1440`, `W1920`, `W2560` | 14 |
| Interactive | `Interactive_Desktop1280`, `Interactive_Mobile320` | 2 |
| Responsive Switch | `ResponsiveSwitch_Mobile320`, `ResponsiveSwitch_Tablet768`, `ResponsiveSwitch_Desktop1024`, `ResponsiveSwitch_Desktop1280` | 4 |
| Locale Stress | `Uk_Desktop1280`, `Uk_Mobile320`, `Sq_Desktop1280`, `It_Desktop1280`, `LongStrings_Desktop`, `LongStrings_Mobile320`, `LongStrings_Interactive_Desktop`, `LongStrings_Interactive_Mobile320` | 8 |
| Empty / Loading | `EmptyBase`, `EmptyFiltered`, `EmptyFiltered_Mobile320`, `EmptyFiltered_Uk`, `Loading` | 5 |
| **Total** | | **34** |

---

## Files Changed

| File | Rationale |
|---|---|
| `src/components/admin/AdminTable.tsx` | Change `header: string → ReactNode` (additive, non-breaking — enables Popover in column header) |
| `src/components/admin/AdminTable.stories.tsx` | Complete restructure: 79 → 34 exports; one canonical filtered family; header-anchored Popover filter; Primary as first export |
| `docs/storybook-governance.md` | Added §12 (AdminTable canonical story contract) + 3 new forbidden patterns |
| `docs/component-catalog.md` | Updated AdminTable entry: header ReactNode + filtering canonical state + §12 reference |
| `docs/backlog.md` | Updated Last Session + Archive table |
| `docs/sessions/2026-06-02-task-354-fix-2-admin-table-canonical-filtering-consolidation.md` | This session log |

---

## Docs/Autodocs Primary Confirmation

`Primary` is the first export in `AdminTable.stories.tsx`. Storybook autodocs uses the first named export as the primary example. `Primary` renders `ColumnFilteredTableDemo` at `canonical1200` with `initialFilters={{ status: ['on'] }}`, showing the filtered table with the `ArrowUpDown` icon tinted on the Status column.

---

## Confirmation: One Filter System

- No `Filtered_*` parallel family → ✅ removed
- No `ColFilter_*` parallel family → ✅ removed (was already gone from Task 354-Fix)
- All stories use `ColumnFilteredTableDemo` → ✅
- `ArrowUpDown` is the only column affordance icon → ✅ (no Funnel, Sliders, Tune, Settings)
- Desktop filter = header-anchored Popover → ✅ (not a full-width chip toolbar)
- Mobile filter = column-grouped panel → ✅ (`MobileColFilterPanel` preserved)
- Static vs interactive = identical filter UI, differ only by `onRowClick`/chevron/feedback → ✅

---

## Scope Boundaries

No `src/app` / `src/modules` / `src/components/layout` / DB / package / Storybook-config changes.

Verified:
```
git diff -- src/app src/modules src/components/layout → no new changes from this session
git diff -- package.json package-lock.json .storybook → empty
```

---

## Validation Results

```
npx tsc --noEmit              → 0 errors ✅
npm run lint                  → 0 new errors/warnings (2 pre-existing warnings in other files) ✅
npm run check:i18n            → PASS — 1434 keys parity across sq/en/uk/it ✅
npm run build-storybook       → ✅ built in 8.47s

rg "^export const " AdminTable.stories.tsx | wc -l → 34 ✅
rg "Filtered_|ColFilter_" AdminTable.stories.tsx → 0 story exports ✅
rg "Funnel|Sliders|Tune" src/components/admin/ → 0 filter-context matches ✅
rg "ColumnFilteredTableDemo|MobileColFilterPanel|ArrowUpDown|filterActive" AdminTable.stories.tsx → present ✅
```

---

## Rendered QA Matrix — OWNER QA REQUIRED

Cannot render Storybook canvas in this environment.

| Scenario | Width | Locale | Status |
|---|---|---|---|
| Primary (static filtered, header popover visible) | 1200 | en | OWNER QA REQUIRED |
| Breakpoints — card mode | 320, 390, 480, 560, 680, 768, 810, 960 | en | OWNER QA REQUIRED |
| Breakpoints — table mode | 1024, 1200, 1280, 1440, 1920, 2560 | en | OWNER QA REQUIRED |
| Interactive (chevron + filters) | 1280 | en | OWNER QA REQUIRED |
| Interactive (mobile panel + auto-chevron) | 320 | en | OWNER QA REQUIRED |
| Responsive Switch | 320, 768, 1024, 1280 | en | OWNER QA REQUIRED |
| Locale stress | 1280, 320 | uk | OWNER QA REQUIRED |
| Locale stress | 1280 | sq, it | OWNER QA REQUIRED |
| Long strings | 1280, 320 | uk | OWNER QA REQUIRED |
| Empty base | 1280 | en | OWNER QA REQUIRED |
| Empty filtered | 1280, 320 | en, uk | OWNER QA REQUIRED |
| Loading | 1280 | en | OWNER QA REQUIRED |

---

## Explicit Confirmation

- No git commands included.
- No commit made.
- No push made.
- Sonnet did not run any mutating git operations.
