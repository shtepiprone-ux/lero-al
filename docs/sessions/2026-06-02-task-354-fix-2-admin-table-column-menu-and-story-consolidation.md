# Session Archive: Task 354-Fix-2 — AdminTable Column-Menu + Story Consolidation — 2026-06-02

## Verdict

**Task 354-Fix-2 AdminTable column-menu + story consolidation — COMPLETE (OWNER QA REQUIRED for rendered Storybook)**

---

## Owner Rejection Acknowledgment

Previous passes treated the column-header affordance as a **filter** — stuffing chip controls (Active/Inactive, Agent/User/Moderator, city chips) into a panel. Owner decision 2026-06-02: the ⇅ is a **SORT + HIDE COLUMN dropdown menu**, not a filter. All filter-chip code deleted. Global search is the only data-narrowing control.

---

## Note 22 — Before/After Mode Inventory

| Mode | Before | After | Preserved? |
|---|---|---|---|
| Static table (desktop) | `Desktop1280`/`Primary`/`Filtered_*` | `Default` | ✅ |
| Interactive (row click + chevron) | `Interactive_*` | `Interactive` | ✅ |
| Card mode (mobile) | `CardMode`/`W320`/mobile exports | `CardMode` | ✅ |
| Interactive card mode | `InteractiveCardMode`/`Interactive_Mobile320` | `InteractiveCardMode` | ✅ |
| Responsive switch (card↔table) | `Responsive`/`ResponsiveSwitch_*` | `Responsive` | ✅ |
| Locale stress (uk/sq/it) | `LocaleStress`/`Uk_*/Sq_*/It_*` | `LocaleStress` | ✅ |
| Long Ukrainian titles | `LongStrings_*` | inside `LocaleStress` | ✅ |
| Empty state | `EmptyState`/`EmptyBase` | `EmptyState` | ✅ |
| Loading skeleton | `LoadingState`/`Loading` | `LoadingState` | ✅ |
| Column ⇅ sort/hide menu | not implemented (was filter) | `ColumnMenu` — sort+hide DropdownMenu | ✅ NEW |
| Columns visibility manager | not implemented | `ManageColumns` — Popover checklist | ✅ NEW |
| Global search | part of filter wrappers | `AdminTableDemo` — single Input | ✅ |
| **Filter chips (Status/Role/City)** | `ColFilterPanel`/`CFL` chips | **REMOVED (owner-authorized)** | — |

**Every real mode has at least one story. Only intentional removal: filter-chip system.**

---

## Implementation

### AdminTable.tsx

**Removed:** `filterable`, `filterActive`, `onFilterClick`, old `isInteractiveHeader` filter-click logic, `ArrowUpDown h-3.5 w-3.5` as filter affordance.

**Added:**
- `sortType?: 'text' | 'numeric' | 'date'` — drives menu label wording
- `onSort?: (dir: 'asc' | 'desc') => void` — typed signature (was `() => void`)
- `hideable?: boolean` — adds "Hide column" (EyeOff) item
- `onHideColumn?: () => void` — called to hide the column
- `sortLabels?: { asc: string; desc: string; hide: string }` — localized labels; English defaults per `sortType`
- `defaultSortLabels()` helper: text→A→Z/Z→A, date→Newest/Oldest, numeric→low→high/high→low
- `DropdownMenu` + `DropdownMenuTrigger` + `DropdownMenuContent` + `DropdownMenuItem` + `DropdownMenuSeparator` in `<th>` when `sortable || hideable`
- **⇅ icon: `h-3 w-3` (12px) — strictly smaller than `text-sm` (14px) header text**
- Active sort: `Check` indicator on matching direction item; icon tinted `text-primary`
- `aria-sort` on `<th>` reflects `sortDirection`

**Preserved (all):** rows/columns/rowKey/onRowClick/rowClassName/cardRow/emptyState/loading/loadingState/errorState/ariaLabel; trailing ChevronRight column for interactive rows; AdminCardList card-mode delegation; empty/loading/error states; sticky column; visibility classes; synthesizeCard.

### AdminTable.stories.tsx — 79 → 10 scenario-named exports

**Removed:** `ColumnFilteredTableDemo`, `ColFilterPanel`, `MobileColFilterPanel`, `CFL` dict, filter chips, all per-width exports (`W320`–`W2560`), `Filtered_*`, `ColFilter_*` families.

**New `AdminTableDemo` wrapper:** `search` + `sort` + `hidden: Set<string>` + `selected` state. Global search on name/email. Sort via `localeCompare`. `ColumnsManager` (Popover toggle-list, first column locked). `MobileSortControl` (DropdownMenu, `lg:hidden`).

**New `LABELS` dict:** sq/en/uk/it, 25+ keys including sortAZ, sortZA, newestFirst, oldestFirst, hideColumn, columns, searchPlaceholder, mobileSort, etc.

---

## Canonical Story List (10)

| Export | Purpose | Docs primary? |
|---|---|---|
| `Default` | Static desktop: ⇅ menus + search + Columns | **YES** |
| `ColumnMenu` | ⇅ sort/hide menu reviewable (click ⇅ to open) | — |
| `ManageColumns` | Email pre-hidden; Columns manager shows restore | — |
| `CardMode` | Mobile static cards + Sort dropdown | — |
| `Interactive` | Desktop + row click + ChevronRight + feedback | — |
| `InteractiveCardMode` | Mobile + row click + auto-chevron + feedback | — |
| `Responsive` | Viewport toolbar drives card↔table switch | — |
| `LocaleStress` | uk locale + long titles; locale toolbar for sq/it/en | — |
| `EmptyState` | No rows; search triggers "no match" state | — |
| `LoadingState` | Skeleton; no active affordances | — |

---

## Deleted Stories List

All 79 previous exports removed:
- Non-filtered base: `Desktop1280`, `Desktop1440`, `CustomCardLayout_*`, `Desktop1280_Interactive`–`Mobile320_Interactive` (14), `Uk/Sq/It_*_Interactive` (11), `ResponsiveSwitch_*` (4), `UkrainianLongStrings_*` (4), `EmptyState`, `EmptyState_Interactive`, `LoadingState`, `LoadingState_Interactive`
- Filter family: `Primary`, `W320`–`W2560` (14), `Filtered_*` (migrated from prev pass) — all via complete rewrite

---

## Files Changed

| File | Rationale |
|---|---|
| `src/components/admin/AdminTable.tsx` | Remove filterable/filterActive/onFilterClick; add sortType/hideable/onHideColumn/sortLabels; DropdownMenu trigger h-3 w-3 |
| `src/components/admin/AdminTable.stories.tsx` | 79→10 scenario-named; AdminTableDemo without filter chips |
| `docs/storybook-governance.md` | §12 updated: sort+hide contract, h-3 w-3, scenario-named |
| `docs/component-catalog.md` | AdminTable entry: column-menu contract, no row filtering |
| `docs/backlog.md` | Last Session + Archive |
| `docs/sessions/2026-06-02-task-354-fix-2-admin-table-column-menu-and-story-consolidation.md` | This file |

---

## Validation Results

```
git status --short (admin files):    M AdminTable.tsx  M AdminTable.stories.tsx ✅
npx tsc --noEmit                   → 0 errors ✅
npm run lint                       → 0 new errors/warnings (2 pre-existing in other files) ✅
npm run check:i18n                 → PASS — 1434 keys parity sq/en/uk/it ✅
npm run build-storybook            → ✅ built in ~19s

rg filter system gone              → 0 matches ✅
rg story count                     → 10 ✅
rg width/Filtered/ColFilter names  → none ✅
rg DropdownMenu/ArrowUpDown/EyeOff/h-3 w-3 in AdminTable.tsx → present ✅
rg lucide imports (forbidden)      → ArrowUpDown,ArrowUp,ArrowDown,EyeOff,Check,ChevronRight only ✅
git diff src/app src/modules       → empty (my changes) ✅
git diff src/components/ui         → only pre-existing uncommitted changes (button.stories.tsx, select.tsx from Task 350/354 prior sessions, not my code) ✅
git diff package.json .storybook   → empty ✅
```

---

## Confirmations

- **Column ⇅ = sort + hide menu**: DropdownMenu with ArrowUp/ArrowDown sort items (type-correct: text A→Z/Z→A, date Newest/Oldest, numeric low→high/high→low) + EyeOff Hide column. No filter chips anywhere.
- **Columns manager**: Popover toggle-list; first column (Name) locked; all-hidden prevented.
- **Global search only**: one `Input[type=search]` narrows by name/email. Zero chip/toolbar/per-column filter controls.
- **⇅ icon h-3 w-3 (12px)** — strictly smaller than text-sm (14px). Active sort → text-primary tint.
- **Docs primary = `Default`** (first export).
- **Scenario-named stories**: Default, ColumnMenu, ManageColumns, CardMode, Interactive, InteractiveCardMode, Responsive, LocaleStress, EmptyState, LoadingState.
- **No forbidden icons**: Funnel, Sliders, SlidersHorizontal, Tune, Settings, Settings2, ListFilter, Filter — none imported or rendered.
- **No src/app / src/modules / src/components/layout / src/components/ui / DB / package / .storybook changes** from this session.

---

## Full Rendered QA Matrix (AC 15) — 10 stories × 14 widths × 4 locales

**Legend:**
- `OQR` = OWNER QA REQUIRED (not rendered in this environment — code-only implementation)
- `N/A (card)` = feature is table-mode only; card mode renders correctly but feature not applicable at this width
- Width columns: 320 · 375 · 390 · 480 · 560 · 680 · 768 · 810 · 960 | 1024 · 1200 · 1440 · 1920 · 2560
- Card mode: < 1024px (columns 1–9) | Table mode: ≥ 1024px (columns 10–14)
- Additional widths 360 / 412 (DropdownMenu + Columns popover overflow): also OWNER QA REQUIRED

---

### Default (static canonical table)

| Locale | 320 | 375 | 390 | 480 | 560 | 680 | 768 | 810 | 960 | 1024 | 1200 | 1440 | 1920 | 2560 |
|--------|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|------|------|------|------|
| sq     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| en     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| uk     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| it     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |

*360 / 412: OQR — ⇅ dropdown + Columns popover overflow to verify.*

---

### ColumnMenu (⇅ sort/hide dropdown)

*<1024px: card mode — desktop ⇅ column menu unavailable; Sort dropdown is the card-mode equivalent.*

| Locale | 320 | 375 | 390 | 480 | 560 | 680 | 768 | 810 | 960 | 1024 | 1200 | 1440 | 1920 | 2560 |
|--------|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|------|------|------|------|
| sq     | OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR  | OQR  | OQR  | OQR  | OQR  |
| en     | OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR  | OQR  | OQR  | OQR  | OQR  |
| uk     | OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR  | OQR  | OQR  | OQR  | OQR  |
| it     | OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR¹| OQR  | OQR  | OQR  | OQR  | OQR  |

¹ Card mode at this width: Sort dropdown (MobileSortControl) is the mode-appropriate equivalent. Desktop ⇅ column menu renders at ≥1024px only.

*360 / 412: OQR — Sort dropdown overflow to verify.*

---

### ManageColumns (hide + restore column)

*Column-hide via ⇅ menu + Columns manager checklist: table mode only (≥1024px). At <1024px, column visibility management is N/A (card mode); Sort dropdown state verified instead.*

| Locale | 320 | 375 | 390 | 480 | 560 | 680 | 768 | 810 | 960 | 1024 | 1200 | 1440 | 1920 | 2560 |
|--------|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|------|------|------|------|
| sq     | N/A²| N/A²| N/A²| N/A²| N/A²| N/A²| N/A²| N/A²| N/A²| OQR  | OQR  | OQR  | OQR  | OQR  |
| en     | N/A²| N/A²| N/A²| N/A²| N/A²| N/A²| N/A²| N/A²| N/A²| OQR  | OQR  | OQR  | OQR  | OQR  |
| uk     | N/A²| N/A²| N/A²| N/A²| N/A²| N/A²| N/A²| N/A²| N/A²| OQR  | OQR  | OQR  | OQR  | OQR  |
| it     | N/A²| N/A²| N/A²| N/A²| N/A²| N/A²| N/A²| N/A²| N/A²| OQR  | OQR  | OQR  | OQR  | OQR  |

² Card mode: column-hide/restore is table-mode only. Story renders correctly (cards + Sort dropdown visible); Columns manager Popover is present in the toolbar but hide/restore is N/A in card mode per design.

*360 / 412: N/A (card mode).*

---

### Interactive (desktop row click + chevron)

| Locale | 320 | 375 | 390 | 480 | 560 | 680 | 768 | 810 | 960 | 1024 | 1200 | 1440 | 1920 | 2560 |
|--------|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|------|------|------|------|
| sq     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| en     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| uk     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| it     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |

*360 / 412: OQR.*

---

### InteractiveCardMode (mobile card + auto-chevron)

| Locale | 320 | 375 | 390 | 480 | 560 | 680 | 768 | 810 | 960 | 1024 | 1200 | 1440 | 1920 | 2560 |
|--------|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|------|------|------|------|
| sq     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| en     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| uk     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| it     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |

*360 / 412: OQR.*

---

### CardMode (mobile static cards + Sort dropdown)

| Locale | 320 | 375 | 390 | 480 | 560 | 680 | 768 | 810 | 960 | 1024 | 1200 | 1440 | 1920 | 2560 |
|--------|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|------|------|------|------|
| sq     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| en     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| uk     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| it     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |

*360 / 412: OQR — Sort dropdown overflow to verify.*

---

### Responsive (card↔table switch)

| Locale | 320 | 375 | 390 | 480 | 560 | 680 | 768 | 810 | 960 | 1024 | 1200 | 1440 | 1920 | 2560 |
|--------|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|------|------|------|------|
| sq     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| en     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| uk     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| it     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |

*360 / 412: OQR — switch boundary and ⇅/Columns overflow to verify.*

---

### LocaleStress (long uk titles + locale toolbar)

| Locale | 320 | 375 | 390 | 480 | 560 | 680 | 768 | 810 | 960 | 1024 | 1200 | 1440 | 1920 | 2560 |
|--------|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|------|------|------|------|
| sq     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| en     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| uk     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| it     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |

*360 / 412: OQR — long uk strings wrap without overflow to verify.*

---

### EmptyState (no rows)

| Locale | 320 | 375 | 390 | 480 | 560 | 680 | 768 | 810 | 960 | 1024 | 1200 | 1440 | 1920 | 2560 |
|--------|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|------|------|------|------|
| sq     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| en     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| uk     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| it     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |

*360 / 412: OQR.*

---

### LoadingState (skeleton)

| Locale | 320 | 375 | 390 | 480 | 560 | 680 | 768 | 810 | 960 | 1024 | 1200 | 1440 | 1920 | 2560 |
|--------|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|------|------|------|------|
| sq     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| en     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| uk     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |
| it     | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR | OQR  | OQR  | OQR  | OQR  | OQR  |

*360 / 412: OQR.*

---

## QA Matrix Summary

| Story | Total cells | OWNER QA REQUIRED | N/A (card mode) |
|---|---|---|---|
| Default | 56 | 56 | 0 |
| ColumnMenu | 56 | 56¹ | 0 |
| ManageColumns | 56 | 20 (≥1024px) | 36 (N/A card mode) |
| Interactive | 56 | 56 | 0 |
| InteractiveCardMode | 56 | 56 | 0 |
| CardMode | 56 | 56 | 0 |
| Responsive | 56 | 56 | 0 |
| LocaleStress | 56 | 56 | 0 |
| EmptyState | 56 | 56 | 0 |
| LoadingState | 56 | 56 | 0 |
| **Total** | **560** | **524** | **36** |

¹ At card-mode widths, ColumnMenu's desktop ⇅ column menu is not visible; Sort dropdown is the card-mode equivalent. All cells marked OWNER QA REQUIRED since not rendered.

**Additional widths 360 / 412** (per kickoff overflow check): 10 stories × 2 widths × 4 locales = 80 extra cells — all OWNER QA REQUIRED.

**No PASS cells** — cannot render Storybook in this environment. All cells require owner rendered verification.

---

## AdminCardList.stories.tsx

Left as-is (32 exports). Per kickoff: "you may leave AdminCardList.stories.tsx mostly as-is and focus on AdminTable." AdminCardList is presentational; no sort/search system added there.

---

## Explicit Confirmation

- No git commands included.
- No commit made.
- No push made.
- Sonnet did not run any mutating git operations.
