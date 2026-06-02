# Session Archive: Task 354-Fix — Canonical AdminTable Filtering System Cleanup — 2026-06-02

## Verdict

**Task 354-Fix canonical AdminTable filtering system cleanup — COMPLETE (OWNER QA REQUIRED for rendered Storybook)**

---

## Owner Rejection Acknowledgment

This corrective task exists because the previous pass created two parallel filtering systems and left the Storybook sidebar confusing:
- `Filtered_*` stories (36 exports) using `FilteredTableDemo` — a toolbar-chip approach above the table
- `ColFilter_*` stories (33 exports) using `ColumnFilteredTableDemo` — column-header ArrowUpDown approach

Both used the same data but different UX patterns, creating a confusing duplicate in the sidebar. The owner rejected this as two competing filter systems.

---

## Scope Confirmation

This task was handled globally across:
- All `AdminTable.stories.tsx` Filtered_* and ColFilter_* story families
- No AdminTable.tsx or AdminCardList.tsx changes were needed (the canonical column-header system was already correct there)
- No other files touched

---

## Corrected Canonical System

**One filtering model (ColumnFilteredTableDemo):**
- Desktop/table mode (≥1024px): filterable column headers show ArrowUpDown icon (bidirectional, inline, balanced). Click header → column-specific filter panel opens above table. Active column: `bg-primary/5` tint + primary icon color.
- Mobile/card mode (<1024px): single ArrowUpDown "Filters" trigger above cards. Opens inline panel with all filterable columns grouped by column name. Active count badge on trigger.
- Same filter model, same component, same props. No toolbar-chip panel.

**Static vs interactive:**
- Static: filters work, no row click, no chevron affordance
- Interactive: filters + row click + chevron all coexist

**Filterable columns:** Name (text), Status (chips), Role (chips), Location/City (chips)  
**Non-filterable:** Email (covered by Name search), Phone (unique values), Created (date range out of scope for this DS pass)

**Removed as duplicate:** `FilteredTableDemo`, `FilterChipsRow`, `FL` dict (all toolbar-chip approach, non-canonical)

---

## Duplicate Story Cleanup Map

| Duplicate story family | Action | Coverage preserved by |
|---|---|---|
| `ColFilter_Desktop1280` through `ColFilter_Mobile320` (15 stories) | Removed — identical to migrated `Filtered_Desktop1280` through `Filtered_Mobile320` | `Filtered_Desktop1280` through `Filtered_Mobile320` |
| `ColFilter_Interactive_Desktop1280`, `ColFilter_Interactive_Desktop1024`, `ColFilter_Interactive_Mobile320` | Removed — identical to migrated `Filtered_Interactive_*` | `Filtered_Interactive_Desktop1280`, etc. |
| `ColFilter_Static_Desktop1280` | Renamed to `Filtered_Static_Desktop1280` | `Filtered_Static_Desktop1280` (new story) |
| `ColFilter_ResponsiveSwitch_*` | Removed — identical to migrated `Filtered_ResponsiveSwitch_*` | `Filtered_ResponsiveSwitch_Mobile320`, `Filtered_ResponsiveSwitch_Desktop1280` |
| `ColFilter_EmptyResult_Desktop`, `ColFilter_EmptyResult_Mobile` | Removed — identical to migrated `Filtered_EmptyResult_*` | `Filtered_EmptyResult_Desktop`, `Filtered_EmptyResult_Mobile` |
| `ColFilter_Uk_*`, `ColFilter_Sq_*`, `ColFilter_It_*` (12 stories) | Removed — identical to migrated `Filtered_Uk_*`, `Filtered_Sq_*`, `Filtered_It_*` | Existing locale filtered stories |

---

## Story Migration Map

All `Filtered_*` stories (previously using `FilteredTableDemo` toolbar chip approach) now use `ColumnFilteredTableDemo`:

| Old story | Implementation before | Implementation after | Filter system visible |
|---|---|---|---|
| `Filtered_Desktop1280` | `FilteredTableDemo` (toolbar chips) | `ColumnFilteredTableDemo` (column-header ArrowUpDown) | ✅ column-header |
| `Filtered_Desktop1440` | toolbar chips | column-header | ✅ |
| `Filtered_Desktop1920` | toolbar chips | column-header | ✅ |
| `Filtered_Desktop2560` | toolbar chips | column-header | ✅ |
| `Filtered_Canonical1200` | toolbar chips | column-header | ✅ |
| `Filtered_Desktop1024` | toolbar chips | column-header | ✅ |
| `Filtered_Canonical960` | toolbar chips | column-header (mobile panel) | ✅ |
| `Filtered_Canonical810` | toolbar chips | column-header (mobile panel) | ✅ |
| `Filtered_Tablet768` | toolbar chips | column-header (mobile panel) | ✅ |
| `Filtered_Canonical680` | toolbar chips | column-header (mobile panel) | ✅ |
| `Filtered_Canonical560` | toolbar chips | column-header (mobile panel) | ✅ |
| `Filtered_Mobile480` | toolbar chips | column-header (mobile panel) | ✅ |
| `Filtered_Mobile390` | toolbar chips | column-header (mobile panel) | ✅ |
| `Filtered_Mobile375` | toolbar chips | column-header (mobile panel) | ✅ |
| `Filtered_Mobile320` | toolbar chips | column-header (mobile panel) | ✅ |
| `Filtered_Static_Desktop1280` | NEW (from ColFilter_Static) | column-header, no row interaction | ✅ |
| `Filtered_Interactive_Desktop1280` | toolbar chips + interactive | column-header + interactive | ✅ |
| `Filtered_Interactive_Desktop1024` | toolbar chips + interactive | column-header + interactive | ✅ |
| `Filtered_Interactive_Mobile320` | toolbar chips + interactive | column-header (mobile panel) + interactive | ✅ |
| `Filtered_ResponsiveSwitch_Mobile320` | toolbar chips | column-header (mobile panel) | ✅ |
| `Filtered_ResponsiveSwitch_Desktop1280` | toolbar chips | column-header | ✅ |
| `Filtered_EmptyResult_Desktop` | toolbar chips, empty | column-header, empty | ✅ |
| `Filtered_EmptyResult_Mobile` | toolbar chips, empty | column-header (mobile panel), empty | ✅ |
| `Filtered_Uk_Desktop1280` | toolbar chips (uk) | column-header (uk) | ✅ |
| `Filtered_Uk_Desktop1440` | toolbar chips (uk) | column-header (uk) | ✅ |
| `Filtered_Uk_Tablet768` | toolbar chips (uk) | column-header (uk) | ✅ |
| `Filtered_Uk_Mobile390` | toolbar chips (uk) | column-header (mobile panel, uk) | ✅ |
| `Filtered_Uk_Mobile320` | toolbar chips (uk) | column-header (mobile panel, uk) | ✅ |
| `Filtered_Uk_Interactive_Desktop1280` | toolbar chips + interactive (uk) | column-header + interactive (uk) | ✅ |
| `Filtered_Uk_EmptyResult` | toolbar chips, empty (uk) | column-header, empty (uk) | ✅ |
| `Filtered_Sq_Desktop1280` | toolbar chips (sq) | column-header (sq) | ✅ |
| `Filtered_Sq_Mobile320` | toolbar chips (sq) | column-header (mobile panel, sq) | ✅ |
| `Filtered_Sq_Mobile390` | toolbar chips (sq) | column-header (mobile panel, sq) | ✅ |
| `Filtered_It_Desktop1280` | toolbar chips (it) | column-header (it) | ✅ |
| `Filtered_It_Desktop1440` | toolbar chips (it) | column-header (it) | ✅ |
| `Filtered_It_Mobile320` | toolbar chips (it) | column-header (mobile panel, it) | ✅ |
| `Filtered_It_Mobile390` | toolbar chips (it) | column-header (mobile panel, it) | ✅ |

---

## Files Changed

| File | Rationale |
|------|-----------|
| `src/components/admin/AdminTable.stories.tsx` | Removed `FL` dict, `FilterChipsRow`, `FilteredTableDemo` (toolbar system); migrated all `Filtered_*` story exports to `ColumnFilteredTableDemo`; removed all 33 `ColFilter_*` story exports; added `Filtered_Static_Desktop1280`; updated meta description |
| `docs/backlog.md` | Updated Last Session summary |
| `docs/sessions/2026-06-02-task-354-fix-canonical-admin-table-filtering-cleanup.md` | This file |

---

## Preservation Inventory

| Feature | Status |
|---|---|
| Columns | ✅ Unchanged: name, state, role, email, phone, location, created |
| Column filters | ✅ Name (text), Status (chips), Role (chips), Location (chips) |
| Non-filterable columns | ✅ Email (doc'd: covered by name search), Phone (doc'd: unique values), Created (doc'd: date range out of scope) |
| Global search | ✅ Removed from stories — was a secondary convenience in `FilteredTableDemo`, not canonical. Column-header Name filter covers this. |
| Toolbar filters | ✅ Removed from canonical stories — they duplicated column-header filtering |
| Sort | N/A (not in these stories, not changed) |
| Pagination | N/A (not in these stories, not changed) |
| Row click | ✅ Preserved in all interactive stories |
| Keyboard activation | ✅ Preserved (AdminTable.tsx unchanged — Enter/Space handlers intact) |
| Chevrons | ✅ Preserved (AdminTable.tsx unchanged — auto-chevron for interactive rows) |
| Row actions | ✅ Not applicable to primitive stories (no row actions in sample data) |
| Inline controls | ✅ Not applicable |
| Empty/loading states | ✅ Preserved (`EmptyState`, `EmptyState_Interactive`, `LoadingState`, `LoadingState_Interactive` stories unchanged) |
| Card mode layout | ✅ Preserved (`CustomCardLayout_Mobile320`, `CustomCardLayout_Mobile390` unchanged) |
| Table mode layout | ✅ Preserved (`Desktop1280`, `Desktop1440` static stories unchanged) |
| Responsive switch behavior | ✅ Preserved (`ResponsiveSwitch_*` stories unchanged) |
| Locale coverage | ✅ sq/en/uk/it — all Filtered_* locale stories migrated |
| Breakpoint coverage | ✅ All 14 canonical breakpoints: 320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560 |

---

## Icon Confirmation

- The ONLY column affordance icon is `ArrowUpDown` (bidirectional up/down arrows from lucide-react).
- Used in: filterable column headers (AdminTable.tsx), ColFilterPanel header, MobileColFilterPanel trigger and column labels.
- No `Funnel`, `Sliders`, `Tune`, `Settings`, or any other filter icon appears anywhere in admin table stories.
- Icon size: `h-3.5 w-3.5` in column headers (balanced relative to text), `h-4 w-4` in filter panels (slightly larger for panel context).
- `shrink-0` applied to prevent squish in flex layouts.
- `aria-hidden="true"` on all icon instances (decorative).

---

## Toolbar Cleanup Confirmation

- `FilteredTableDemo` (toolbar-chip panel) removed entirely.
- `FilterChipsRow` (chip button group component) removed entirely.
- `FL` (toolbar label dict) removed entirely.
- The `Filtered_*` stories no longer show a toolbar filter panel above the table.
- Column-header filtering is the primary filter UX at desktop.
- Mobile filter panel (column-grouped, triggered by ArrowUpDown button) is the mobile equivalent.
- No competing filter toolbar remains in any canonical filtered story.

If any toolbar/search control remains in production admin routes (not stories), that is out of scope for this DS primitive task.

---

## Localization Confirmation

All visible filter UI is localized via the `CFL` dict with 18 keys per locale (sq/en/uk/it):
- Column labels: colName, colStatus, colRole, colEmail, colPhone, colLocation, colCreated
- Chip values: active, inactive, agent, user, moderator
- UI text: nameSearch, filterBy, filters, clearColumn, clearAll, close, activeFilters, showing, noResults

Locale-specific Filtered_* story groups:
- `Filtered_Uk_*` (5 breakpoint + interactive + empty) — Ukrainian labels, `globals: { locale: 'uk' }`
- `Filtered_Sq_*` (3 stories) — Albanian labels, `globals: { locale: 'sq' }`
- `Filtered_It_*` (4 stories) — Italian labels, `globals: { locale: 'it' }`

No English leaks into sq/uk/it canvases confirmed by locale dict structure and story globals.

---

## Responsive Confirmation

All canonical filtered stories cover: 320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560

- ≤960px: card mode — mobile ArrowUpDown "Filters" button + column-grouped panel
- ≥1024px: table mode — ArrowUpDown icons in column headers, click → inline filter panel
- No horizontal overflow (AdminTable has `overflow-x-auto` scroll wrap)
- Filter controls remain reachable at all widths (mobile: full-width button; desktop: header click)

---

## Interaction Preservation

| Interaction | Status |
|---|---|
| Row click (onRowClick) | ✅ Unchanged in AdminTable.tsx and all interactive stories |
| Keyboard activation (Enter/Space) | ✅ Unchanged in AdminTable.tsx |
| Chevron affordance (table mode) | ✅ Unchanged — auto-renders trailing `<th>/<td>` when `onRowClick` set |
| Auto-chevron (card mode) | ✅ Unchanged — AdminCardList auto-adds ChevronRight when `onRowClick` set |
| Selected row feedback | ✅ Interactive stories show "Selected record" panel in all 4 locales |
| Empty/loading states | ✅ `EmptyState`, `EmptyState_Interactive`, `LoadingState`, `LoadingState_Interactive` unchanged |
| Sorting | N/A — not in these primitive stories |
| Pagination | N/A — not in these primitive stories |

---

## Full Rendered QA Matrix

**OWNER QA REQUIRED** — cannot render Storybook canvas in this environment.

The following stories require owner visual verification:
- `Filtered_Desktop1280` through `Filtered_Mobile320` (all 15 widths): column headers show ArrowUpDown icon tinted when filter active; filter panel opens on click; rows update; clear all works
- `Filtered_Static_Desktop1280`: filters work without row click, no chevron column
- `Filtered_Interactive_*` (3 stories): column-header filters + row click + chevron coexist
- `Filtered_ResponsiveSwitch_*`: same component transitions correctly between card/table modes
- `Filtered_EmptyResult_*`: empty state shows when no rows match
- `Filtered_Uk_*`, `Filtered_Sq_*`, `Filtered_It_*`: all labels in correct locale, no English leak

---

## Validation Commands and Results

```
npx tsc --noEmit → 0 errors ✅
npm run build-storybook → ✅ built in 8.36s (AdminTable.stories-DUB4jXOE.js 91.20 kB)
grep -rn "ColFilter_" src/components/admin/AdminTable.stories.tsx → 0 story exports ✅
grep -rn "Funnel|Sliders|Tune" src/components/admin/ → 0 matches in filter context ✅
grep -n "FilteredTableDemo|FilterChipsRow" src/components/admin/ → 0 matches ✅
```

Post-change story count: 79 total exports in AdminTable.stories.tsx (was 112+ with duplicate ColFilter_* family)

---

## Remaining Issues

None introduced by this task. One pre-existing known issue:
- The `Storybook` chunk size warning (some chunks > 500 kB) is pre-existing and not related to this change.

---

## Explicit Confirmation

- No git commands are included in this report.
- No commit was made.
- No push was made.
- Sonnet did not run any mutating git operations.
