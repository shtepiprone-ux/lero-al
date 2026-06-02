# Task 354-Fix — Global AdminTable Column-Header Filtering System
**Date:** 2026-06-02  
**Executor:** Sonnet 4.6  
**Status:** INCOMPLETE / OWNER QA REQUIRED

---

## 1. Verdict

**Task 354-Fix global AdminTable column-header filtering system: INCOMPLETE / OWNER QA REQUIRED.**  
TypeScript: 0 errors. Build: ✅ (22.02s). No git commit. No push. No git commands.

---

## 2. Owner Rejection Acknowledged

The previous pass implemented a toolbar/chip panel ABOVE the table. The owner rejected this because it did not implement proper column-level filtering where filtering feels connected to the specific column. This pass corrects that by implementing column-header affordances with the canonical `ArrowUpDown` icon and column-specific filter panels.

---

## 3. Corrected Filtering Model

### 3.1 Global Search vs Toolbar Filters vs Column-Header Filters

| Type | Description | This Task |
|------|-------------|-----------|
| Global search | One input searching all fields | Included as "Name" column text filter |
| Toolbar filters | Chip panel above table | Previous pass (Filtered_* stories remain) |
| Column-header filters | Per-column affordance in table header | **This pass (ColFilter_* stories)** |

Column-header filtering is the canonical model per owner requirement.

### 3.2 Canonical Icon Rule
- **ONLY icon used**: `ArrowUpDown` (bidirectional up/down arrows from lucide-react)
- **Forbidden**: funnel, sliders, tune, settings, filter glyphs — none appear anywhere
- `ArrowUpDown` in inactive column: `text-muted-foreground/40` (neutral, subtle)
- `ArrowUpDown` in active-filtered column: `text-primary` (colored, clearly active)
- Mobile filter trigger also uses `ArrowUpDown` — consistent globally

### 3.3 Filterable Columns

| Column | Filter Type | Filterable | Notes |
|--------|-------------|-----------|-------|
| Name | Text input | ✓ | Searches row.name |
| Status/State | Chip: Active/Inactive | ✓ | Filters row.state (on/off) |
| Role | Chip: Agent/User/Moderator | ✓ | Filters row.role |
| Email | — | ✗ | Unique values; covered by name search |
| Phone | — | ✗ | Too many unique values |
| Location/City | Chip: Tirana/Kyiv/Milan | ✓ | Filters row.location |
| Created | — | ✗ | Date range outside scope of this DS pass |

### 3.4 Desktop Column-Header Filter UX

1. Filterable column header shows `ArrowUpDown` icon next to the column label
2. Header is clickable (`cursor-pointer`)
3. When active filter: header gets `bg-primary/5` tint + icon colored primary
4. Clicking header: toggles a column-specific filter panel ABOVE the table
5. Filter panel shows: "Filter by: [Column]" heading with `ArrowUpDown` icon, filter UI, "Clear" button, "×" close button
6. Filter UI types: text input for Name, chip buttons for Status/Role/Location
7. Filter panel updates rows immediately on interaction
8. Active filter summary shows count and result count below the panel

### 3.5 Mobile/Card Mode Filter UX

No column headers in card mode. A visible filter trigger appears above cards:
- Button with `ArrowUpDown` icon + localized "Filters" label
- Active count shown as a bubble on the button (if any filters active)
- Clicking opens an inline panel showing all filterable columns grouped with `ArrowUpDown` icon
- Each group shows the column name (localized) + filter UI
- Active column groups show primary-colored `ArrowUpDown`

### 3.6 Responsive Switch

The `ColumnFilteredTableDemo` handles both modes transparently:
- <1024px: mobile filter panel shown; AdminTable renders AdminCardList
- ≥1024px: column headers with ArrowUpDown shown; AdminTable renders table

Filter state is preserved across the mode switch (same component, same state).

---

## 4. Files Changed

| File | Change |
|------|--------|
| `src/components/admin/AdminTable.tsx` | `ArrowUpDown` import. Added `filterable?`, `filterActive?`, `onFilterClick?` to `AdminTableColumn`. Updated `<th>` to render clickable header with `ArrowUpDown` icon when `filterable` or `sortable`. `bg-primary/5` + `text-primary` when `filterActive`. |
| `src/components/admin/AdminTable.stories.tsx` | `ArrowUpDown` + `cn` imports. `CFL` localized dict (sq/en/uk/it, 18 keys). `ColFilterPanel` component. `MobileColFilterPanel` component. `ColumnFilteredTableDemo` component. 33 `ColFilter_*` story exports. |
| `docs/backlog.md` | New Last Session entry |
| `docs/sessions/2026-06-02-task-354-fix-column-header-filtering.md` | This file |

---

## 5. Canonical Icon Confirmation

**`ArrowUpDown` from lucide-react is the ONLY column affordance icon used.**

- `AdminTable.tsx` `<th>` rendering: `<ArrowUpDown className="..." aria-hidden="true" />`
- `ColFilterPanel` heading: `<ArrowUpDown className="h-4 w-4 text-primary" />`
- `MobileColFilterPanel` trigger: `<ArrowUpDown className="h-4 w-4" />`
- `MobileColFilterPanel` column group labels: `<ArrowUpDown className="h-3.5 w-3.5" />`

**No funnel, sliders, settings, tune, or other filter glyphs exist in the AdminTable column filtering UI.**

---

## 6. Preservation Inventory

All existing capabilities confirmed preserved:

| Capability | Status |
|------------|--------|
| Columns (name/state/role/email/phone/location/created) | ✓ |
| Column visibility breakpoints | ✓ |
| Row click (onRowClick) | ✓ |
| Keyboard Enter/Space | ✓ |
| Trailing ChevronRight column (table mode) | ✓ |
| Auto-chevron (card mode) | ✓ |
| Selected-row localized panel | ✓ |
| Responsive card/table switch | ✓ |
| Empty state | ✓ |
| Loading state | ✓ |
| All existing Static/Interactive/Filtered/RS/LocaleStress stories | ✓ |
| Existing `Filtered_*` toolbar stories | ✓ (kept alongside ColFilter_*) |

---

## 7. Audit Summary

**Issue found:** Previous `Filtered_*` stories used toolbar chips above table, not column-header affordances. Column headers had no interactive filter affordance (no icon, not clickable for filtering).

**Implemented:**
- `filterable` prop on `AdminTableColumn` → `ArrowUpDown` in header, clickable
- `filterActive` prop → primary tint + colored icon when filter is applied
- `onFilterClick` prop → story wrapper manages which panel is open
- `ColFilterPanel` — column-specific filter panel above the table (appears on header click)
- `MobileColFilterPanel` — mobile filter entry with `ArrowUpDown` trigger
- 33 `ColFilter_*` stories: 14 breakpoints (en) + interactive + RS + empty result + uk/sq/it locales

---

## 8. Localization

`CFL` dict covers 18 labels per locale:

| Key | en | sq | uk | it |
|-----|-----|-----|-----|-----|
| colStatus | Status | Gjendja | Статус | Stato |
| colRole | Role | Roli | Роль | Ruolo |
| colLocation | City | Qyteti | Місто | Città |
| filterBy | Filter by | Filtro sipas | Фільтр за | Filtra per |
| filters | Filters | Filtrat | Фільтри | Filtri |
| clearColumn | Clear | Pastro | Очистити | Cancella |
| clearAll | Clear all | Pastro të gjitha | Очистити всі | Cancella tutti |
| activeFilters | Active filters | Filtra aktive | Активні фільтри | Filtri attivi |
| noResults | No records match… | Asnjë rekord… | Немає записів… | Nessun record… |

---

## 9. Responsive Confirmation

- All 14 breakpoints covered via `ColFilter_*` story exports
- Mobile (`<1024px`): `MobileColFilterPanel` with `ArrowUpDown` trigger — `flex-wrap` chip groups
- Desktop (`≥1024px`): Column headers with `ArrowUpDown` — `ColFilterPanel` appears above table (no overflow-clipping issues)
- `MobileColFilterPanel` uses `size="xl"` buttons (44px) and `flex-wrap` — no overflow

---

## 10. QA Matrix

All entries: OWNER QA REQUIRED.

| Scenario | Locale | Breakpoints | Key check | Status |
|----------|--------|-------------|-----------|--------|
| ColFilter basic | en | all 14 | ArrowUpDown in headers; Status active tint | OWNER QA REQUIRED |
| ColFilter interactive | en | 320/1024/1280 | Chevron + filter panel + row selection | OWNER QA REQUIRED |
| ColFilter static | en | 1280 | Filters work, no chevron | OWNER QA REQUIRED |
| ColFilter RS | en | 320/1280 | Card mode filter button; table mode headers | OWNER QA REQUIRED |
| ColFilter empty result | en | 320/1280 | Localized no-results state | OWNER QA REQUIRED |
| ColFilter uk | uk | 320/390/768/1280/1440 + interactive + empty | Ukrainian labels, ArrowUpDown icon | OWNER QA REQUIRED |
| ColFilter sq | sq | 320/390/1280 | Albanian labels | OWNER QA REQUIRED |
| ColFilter it | it | 320/390/1280/1440 | Italian labels | OWNER QA REQUIRED |

---

## 11. Validation

```
npm run typecheck      → 0 errors ✓
npm run build-storybook → ✓ built in 22.02s ✓
```

---

## 12. Explicit Confirmation

**No git commands included. No commit. No push.**
