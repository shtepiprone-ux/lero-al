# Sprint 31 — Task 354-Fix-2 kickoff (Sonnet) — AdminTable canonical COLUMN-MENU (sort + hide column) + Columns manager + global search; kill filter-chips & parallel/proof stories; scenario-named stories (NO row filtering, NO route migration)

> **Status: READY. Owner priority #1 (second re-rejection of Task 354 Storybook work).**
> **The previous direction was WRONG and is now corrected by owner decision (2026-06-02).** Earlier
> passes treated the column-header affordance as a **filter** and stuffed filter chips (Active/Inactive,
> Agent/User/Moderator, city chips) into a panel/dropdown. **That is rejected.** The owner's reference
> screenshots show the column-header control is a **SORT + HIDE-COLUMN menu**, not a filter.
>
> **You are Sonnet 4.6, the executor.** Implement the literal acceptance criteria below. Do NOT change
> scope. Do NOT re-introduce row filtering. Do NOT migrate admin/app routes. Do NOT rewrite Storybook
> config. If anything is ambiguous or a required decision is missing, **STOP and ASK the orchestrator** —
> do not improvise.
>
> **Single-writer git:** you do NOT run `git add` / `git commit` / any mutating git. End your session
> with a "Files Changed" table only; the ORCHESTRATOR (Opus) reads the real diff and emits commit
> commands during review. (agent-contract clause 10.)

```
Type:     corrective / canonical AdminTable column-interaction redesign + Storybook consolidation (re-rejection remediation)
Priority: CRITICAL (owner first-priority; blocks approval of Task 354 / 354-Fix)
Area:     src/components/admin/AdminTable.tsx (column-menu + visibility — additive) · AdminTable.stories.tsx (full restructure) ·
          AdminCardList.stories.tsx (trim) · docs
Removes:  the entire filter-chip system added by prior 354-Fix passes (ColumnFilteredTableDemo filter logic,
          ColFilterPanel, MobileColFilterPanel, CFL filter-chip dict). Row filtering is OUT. Global search is the
          ONLY data-narrowing control.
```

## Owner decisions that define the canon (2026-06-02 — binding)

1. **Column-header ⇅ icon → a SORT/HIDE dropdown menu** (use `src/components/ui/dropdown-menu.tsx`).
   Menu items, labels chosen by column data type:
   - **Text columns:** "Sort A→Z", "Sort Z→A".
   - **Date columns:** "Newest first", "Oldest first" (owner: "від найближчої / від найстаршої").
   - **Numeric columns** (if any): "Sort low→high", "Sort high→low".
   - **"Hide column"** (last item, with an eye-off icon — like the reference screenshot).
   - **NO filter chips, NO filter values, NO funnel/sliders** anywhere in this menu.
2. **A "Columns" manager control** must exist so a hidden column can be restored / visibility managed
   (owner: "має бути функціонал як можна керувати колонками, які можна приховувати або показати").
   Use the reference screenshot pattern: a "Columns" button → a checklist of all columns with
   show/hide checkboxes. (Column **reordering / drag handles are OUT of scope** — show/hide only.)
3. **Row filtering is REMOVED entirely.** No Status/Role/City filtering, no chips, no toolbar filter
   panel. The ONLY data-narrowing control is **one global/secondary search** input.
4. **The ⇅ icon must be SMALLER than the header font** (owner: "трохи меньший за розмір шрифта").
   Header text is `text-sm` (14px) → icon ≈ **12px max** (`h-3 w-3`), visually balanced. The current
   `h-3.5 w-3.5` (14px = same as font) is too big.
5. **Story names are by SCENARIO/MODE, not by width.** No `W 320`, `W 375`, `Uk Mobile 320`,
   `Long Strings Interactive Mobile 320`, `Empty Filtered Uk`, etc. Breakpoints are exercised via the
   **Storybook viewport toolbar parameter**, NOT as separate named exports. The sidebar must read like a
   human UX list of modes.

## Contract reference — ASCII wireframes (build to THIS, not to a filter UI)

These sketches are the binding visual contract. If your output diverges from these, it is wrong.

**1. Canonical desktop table — toolbar + sortable headers + small ⇅ icons (≈12px, < the 14px header text):**

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  [ 🔍 Search…            ]                                   [ ▦ Columns ]      │  ← global search (only narrowing control) + Columns manager
├───────────────────────────────────────────────────────────────────────────────┤
│  Name ⇅      Status ⇅     Role ⇅      Email        Location ⇅    Created ⇅      │  ← ⇅ only on SORTABLE columns; Email not sortable here
│  ──────────────────────────────────────────────────────────────────────────── │     ⇅ = ArrowUpDown, h-3 w-3 (12px), smaller than the header label
│  Arben K.    ● Active     Agent       arben@…      Tirana        2026-01-15     │
│  Oksana P.   ○ Inactive   User        oksana@…     Kyiv          2026-02-20     │
│  Marco R.    ● Active      Moderator   marco@…      Milan         2026-03-01     │
└───────────────────────────────────────────────────────────────────────────────┘
   NO funnel / sliders / filter chips anywhere. NO "Status / Role / City" button panel above the table.
```

**2. Column ⇅ dropdown — TEXT column (click the ⇅ on e.g. "Name"):**

```
        Name ⇅◄── click
        ┌──────────────────────────┐
        │  ↑  Sort A→Z             │   ← onSort('asc')   (active item highlighted/checked when sortDirection set)
        │  ↓  Sort Z→A             │   ← onSort('desc')
        │ ───────────────────────  │
        │  🚫👁  Hide column        │   ← onHideColumn()  (EyeOff icon)
        └──────────────────────────┘
```

**3. Column ⇅ dropdown — DATE column (e.g. "Created", sortType='date'): different labels:**

```
        Created ⇅◄── click
        ┌──────────────────────────┐
        │  ↑  Newest first         │   ← "від найближчої"
        │  ↓  Oldest first         │   ← "від найстаршої"
        │ ───────────────────────  │
        │  🚫👁  Hide column        │
        └──────────────────────────┘
```
(Numeric columns, if any: "Sort low→high" / "Sort high→low". Labels are localized sq/en/uk/it.)

**4. "Columns" manager — show/hide + RESTORE a hidden column (checklist; reorder/drag is OUT):**

```
   [ ▦ Columns ]◄── click
   ┌────────────────────────────┐
   │  ☑ Name      (locked)      │   ← first/sticky column cannot be hidden (prevents all-hidden)
   │  ☑ Status                  │
   │  ☑ Role                    │
   │  ☐ Email     ◄── hidden    │   ← unchecked = hidden; re-check to RESTORE
   │  ☑ Location                │
   │  ☑ Created                 │
   └────────────────────────────┘
```

**5. Mobile / card mode (<1024px) — no headers → ONE compact Sort control (same sort model), global search:**

```
┌─────────────────────────────┐
│ [ 🔍 Search…              ]  │
│ [ ⇅ Sort ▾ ]                │  ← single Sort control → list of sortable fields × asc/desc; NO column-hide on cards
├─────────────────────────────┤
│ Arben Krasniqi          ›   │  ← interactive card: trailing chevron (›); static card: no chevron
│ ● Active · Agent            │
│ arben@…  ·  Tirana          │
├─────────────────────────────┤
│ Oksana Petrenko         ›   │
│ ○ Inactive · User           │
│ oksana@…  ·  Kyiv           │
└─────────────────────────────┘
```

**Icon legend (lucide):** `⇅`=`ArrowUpDown` (header trigger, 12px) · `↑`=`ArrowUp` · `↓`=`ArrowDown` ·
`🚫👁`=`EyeOff` (hide) · `▦`=`Columns` (manager) · `›`=`ChevronRight` (interactive row). **Forbidden:**
`Funnel`, `Sliders`, `SlidersHorizontal`, `Tune`, `Settings`, `Settings2`, `ListFilter`, `Filter`.

## Role contract

You are **Sonnet 4.6, the executor**. You (a) make the canonical AdminTable column interaction a
**sort + hide-column dropdown menu** with a **Columns visibility manager**, (b) remove the rejected
row-filter chip system and leave a single global search, (c) shrink the ⇅ icon below the font size, and
(d) consolidate `AdminTable.stories.tsx` into a small, scenario-named canonical set whose Docs primary is
the canonical table. You do **not** re-introduce row filtering, **not** migrate routes, **not** touch
DB/RLS/auth, **not** rewrite Storybook config, **not** modify shared UI primitives beyond using them, and
**not** run git. Outside-allowlist = scope violation = STOP & ASK. Opus reviews the real diff and emits
git commands.

## Root cause (verified by orchestrator audit, 2026-06-02 — anchored to real code)

`src/components/admin/AdminTable.tsx` exposes `filterable` / `filterActive` / `onFilterClick` and renders
the `ArrowUpDown` icon as a **filter** trigger. `AdminTable.stories.tsx` (1333 lines, **79 exports**)
builds `ColumnFilteredTableDemo` + `ColFilterPanel` + `MobileColFilterPanel` + `CFL`, which put **filter
chips** into a panel/dropdown — and keeps **two parallel story families** plus per-width proof exports
("W 320", "W 375", …). This is wrong on three counts: (1) the column control should SORT/HIDE, not
filter; (2) there should be no row-filter chips at all (global search only); (3) the story set is bloated
and width-named instead of scenario-named, and Docs shows a non-canonical example.

## Pre-read (load ONLY these — `docs/rule-index.md`: "Admin table / admin control" + "Storybook / visual snapshot")

**Always required:** `docs/agent-contract.md` (esp. clause 10), `docs/backlog.md`.
**Required (admin control):** `docs/design-system.md` (esp. **§3** the 14-width × 4-locale canon),
`docs/ui-rules.md`, `docs/component-rules.md`, `docs/component-governance.md` (canonical `AdminTableRow`),
`docs/qa-rules.md`, `docs/ai-behavior.md` → **Note 22 "Admin Table Preservation Rule"**.
**Required (Storybook):** `docs/storybook-governance.md`, `docs/storybook-visual-snapshots.md`,
`docs/responsive-screenshot-matrix.md`.
**Required (this corrective):** Task 354-Fix session logs
(`docs/sessions/2026-06-02-task-354-fix-canonical-admin-table-filtering-cleanup.md`,
`docs/sessions/2026-06-02-task-354-fix-column-header-filtering.md`).
**Then inspect** `src/components/admin/AdminTable.tsx`, `AdminTable.stories.tsx`, `AdminCardList.tsx`,
`AdminCardList.stories.tsx`, and **the primitives you will USE (do not modify):**
`src/components/ui/dropdown-menu.tsx`, `src/components/ui/popover.tsx`, `src/components/ui/checkbox.tsx`,
`src/components/ui/input.tsx`, `src/components/ui/button.tsx`.

## Mandatory scope (literal)

### A. AdminTable.tsx — canonical column menu (additive, replaces the filter affordance)
Replace the filter affordance with a sort/hide column menu. Update `AdminTableColumn<Row>`:
- **Remove** `filterable` / `filterActive` / `onFilterClick` (filter affordance is rejected).
- **Add / use** `sortable?: boolean`, `sortType?: 'text' | 'numeric' | 'date'` (default `'text'`),
  `sortDirection?: 'asc' | 'desc' | null`, `onSort?: (dir: 'asc' | 'desc') => void`,
  `hideable?: boolean` (default `true` when the column is part of the manageable set), and
  `onHideColumn?: () => void`.
- When a column is `sortable` or `hideable`, the header renders the column label + a **small ⇅
  `ArrowUpDown` icon (`h-3 w-3`, 12px — smaller than the `text-sm` header)** acting as a
  **`DropdownMenu` trigger** (from `dropdown-menu.tsx`). The menu contains:
  - if `sortable`: two sort items with type-correct labels (text → A→Z / Z→A; date → Newest / Oldest;
    numeric → low→high / high→low), each calling `onSort('asc'|'desc')`; use `ArrowUp` / `ArrowDown` icons.
  - if `hideable`: a "Hide column" item (use an `EyeOff` icon) calling `onHideColumn()`.
  - the currently-active sort direction is indicated (e.g. checked/highlighted item) when
    `sortDirection` is set.
- Keep accessible: the trigger is a real focusable button with a localized `aria-label`
  (e.g. "Column options: {header}"); menu items are keyboard-navigable; `aria-sort` on the `<th>`
  reflects `sortDirection`. **Do not break existing keyboard/focus/aria.**
- **Forbidden icons:** funnel, sliders, tune, settings. Allowed: `ArrowUpDown` (trigger), `ArrowUp`,
  `ArrowDown`, `EyeOff` (menu), `Check` (active indicator), `ChevronRight` (existing row chevron).
- All other AdminTable behavior is PRESERVED (Note 22): columns, row click + trailing chevron,
  card-mode delegation to AdminCardList, empty/loading/error states, sticky column, visibility classes.

### B. Column visibility manager ("Columns" control)
- The canonical table supports hiding/showing columns. A **"Columns" control** (a `Button` opening a
  `Popover`/`DropdownMenu` with a `Checkbox` per column) lets the user toggle each column's visibility
  and **restore** a column hidden via the header "Hide column" item.
- Visibility STATE is owned at the story/demo wrapper level (the demo passes only the visible columns to
  AdminTable and renders the Columns control); AdminTable itself stays presentational and additive. The
  header "Hide column" calls `onHideColumn` which the wrapper uses to flip that column's visibility.
- Reorder/drag is OUT of scope.

### C. Remove row filtering; keep a single global search
- **Delete** the rejected filter-chip system: `ColumnFilteredTableDemo` filter logic, `ColFilterPanel`,
  `MobileColFilterPanel`, and the `CFL` filter-chip dictionary (the parts that drive Status/Role/City/Name
  chip filtering). Remove all `Active/Inactive`, `Agent/User/Moderator`, and city chip controls.
- Provide ONE **global search** `Input` (type=search) above the table that narrows rows by a free-text
  match across visible text fields (name/email/etc.). This is the ONLY data-narrowing control. It is a
  secondary/global search — not a per-column filter and not a chip toolbar.

### D. Icon size
- The header ⇅ icon is `h-3 w-3` (12px) — strictly smaller than the `text-sm` (14px) header text;
  balanced vertical alignment with the label. No icon may be ≥ the header font size.

### E. Story restructure — scenario-named, NOT width-named, ONE clean family
Rewrite `AdminTable.stories.tsx` into a small set of **scenario/mode** stories. Breakpoints are checked
via the **viewport toolbar parameter**, NOT separate exports. Target ≈ 10–14 exports (down from 79).
Suggested canonical set (you may refine names, keep them human/UX, no width tokens in names):

1. **Default** — static canonical desktop table: ⇅ sort menus on sortable headers, global search,
   "Columns" manager, no row interaction (no chevron). **This is the Docs/autodocs primary.**
2. **ColumnMenu** — a story that shows the header ⇅ dropdown open (Sort A→Z / Sort Z→A / Hide column),
   so the menu is reviewable. (Use a `play` function or an always-open demo state.)
3. **ManageColumns** — the "Columns" manager open, with one column hidden and restorable.
4. **CardMode** — mobile card mode (static): cards + a single compact **Sort** control (same sort model;
   column hide/manage is a table-mode concept, not required on cards).
5. **Interactive** — desktop: row click + trailing chevron + selected-row feedback, alongside the sort
   menus and global search.
6. **InteractiveCardMode** — mobile card mode interactive (auto-chevron + selection).
7. **Responsive** — ONE story documenting the card↔table auto-switch; reviewer uses the viewport toolbar
   to move across widths (card <1024px, table ≥1024px). Same component, same controls.
8. **LocaleStress** — long sq/en/uk/it content (esp. long Ukrainian listing titles): labels wrap, ⇅ menu
   + global search + Columns control all localized; reviewer switches locale via the locale toolbar.
9. **EmptyState** — no rows; no misleading chevrons.
10. **LoadingState** — skeleton; no active affordances.

Do NOT create per-width exports. Do NOT re-create a `Filtered_*` / `ColFilter_*` family. Story count must
drop sharply. Sidebar must read as a clean list of modes.

### F. AdminCardList.stories.tsx — trim to the same philosophy
Reduce its 32 exports to scenario/mode stories (primary, card layout, static-vs-interactive, locale
stress, legacy node, empty, loading) — no per-width `StructuredCard_*` sweep, no new card UX, no second
sort/search system (card-mode sort is owned by the AdminTable wrapper's Sort control). Preserve coverage
of each real mode. **If trimming AdminCardList risks removing a behavior the screenshot matrix depends on,
keep it and note it; if scope is unclear → STOP & ASK** (you may leave AdminCardList.stories.tsx mostly
as-is and focus on AdminTable).

## Localization

Locales **sq / en / uk / it**. The sort-menu item labels, "Hide column", the "Columns" control + its
checkboxes, the global search placeholder, empty/loading copy, and any selected-row feedback are localized
via a story-level dict (sq/en/uk/it) and exercised through the locale toolbar. No mixed-language normal
story. No raw keys/enums as user copy. No new production `messages/*` keys are expected; if a genuinely
missing real key is referenced, add to all four with parity — otherwise leave `messages/*` untouched.
`check:i18n` must pass.

## Responsive coverage — verify via the viewport toolbar (NOT per-width exports)

Each scenario story is validated across the 14 canonical DS widths (`design-system.md §3`):
**320 · 375 · 390 · 480 · 560 · 680 · 768 · 810 · 960 · 1024 · 1200 · 1440 · 1920 · 2560** using the
Storybook viewport toolbar. Card mode <1024px; table mode ≥1024px. The ⇅ menu and "Columns" popover must
stay viewport-bounded (no horizontal overflow) at 320/360/375/390/412/480.

## AdminTable preservation inventory (MANDATORY — `ai-behavior.md` Note 22)

Before editing, record a before/after inventory in the session log and confirm each remains reachable:
columns · row click + trailing chevron (interactive) · card-mode layout · empty state · loading state ·
sticky column · visibility breakpoints · sort (now via the column menu) · selected-row feedback. The only
intentional REMOVAL (owner-authorized) is the **filter-chip system** (replaced by sort/hide menu + global
search). Any OTHER silent removal of a real behavior = P0 regression → STOP & ASK.

## Allowed file areas (edit ONLY these)

```
src/components/admin/AdminTable.tsx               (additive column-menu: sort/hide; remove filterable/filterActive/onFilterClick; smaller ⇅ icon; PRESERVE all else)
src/components/admin/AdminTable.stories.tsx        (full restructure: sort/hide menu + Columns manager + global search; scenario-named; delete filter-chip code & per-width/parallel exports)
src/components/admin/AdminCardList.stories.tsx     (trim to scenario/mode stories; no new UX)
docs/component-catalog.md                          (UPDATE AdminTable entry: canonical column-menu = sort + hide; Columns manager; global search; no row filtering)
docs/component-governance.md                       (UPDATE canonical AdminTableRow/column-interaction contract if codified)
docs/ai-behavior.md                                (UPDATE Note 22 ONLY if the canonical "column menu = sort/hide, no row filtering" contract is codified there)
docs/storybook-governance.md                       (ADD: no parallel/proof families; scenario-named stories; breakpoints via viewport toolbar; Docs primary = canonical table)
docs/responsive-screenshot-matrix.md               (UPDATE: register the new scenario stories; remove dead Filtered_*/per-width entries)
docs/design-system.md                              (UPDATE ONLY if a canonical column-menu/icon-size rule is codified; e.g. header affordance icon < header font size)
docs/backlog.md                                    (UPDATE — Last Session, 2–4 lines)
docs/sessions/2026-06-02-task-354-fix-2-admin-table-column-menu-and-story-consolidation.md  (NEW — session log)
```

## Forbidden file areas (STOP & ASK if any seems required)

```
src/app/**                          (route adoption out of scope; READ-only for the empty-diff proof)
src/modules/**                      (out of scope; READ-only for the empty-diff proof)
src/components/layout/**             (Task 350 layout primitives — FROZEN)
src/components/ui/**                 (USE dropdown-menu/popover/checkbox/input/button AS-IS; do NOT modify the primitives)
database migrations / SQL · Supabase / RLS / auth
package.json / package-lock.json    (no dependency changes)
.storybook/main.ts · .storybook/preview.tsx preset list / locale toolbar / viewport presets (PRESERVE)
messages/*.json                      (no new production i18n keys expected; story labels live in the story-level dict)
```

## Positive flow (happy path) — required (Task 255 rule)

**Actor:** owner/designer doing rendered Storybook DS QA. **Preconditions:** Storybook built; viewport +
locale toolbars intact; sq/en/uk/it loaded.

1. Owner opens **Docs** → the primary example is the canonical table: small ⇅ icons on sortable headers,
   a global search, and a "Columns" control — NOT a filter-chip table, NOT an old un-affordanced table.
2. Owner clicks a column ⇅ → a dropdown opens with **Sort A→Z / Sort Z→A** (or **Newest / Oldest** on the
   date column) + **Hide column** — exactly like the reference screenshot. No filter chips.
3. Owner hides a column via the menu, then re-shows it via the **Columns** manager checklist.
4. Owner types in the **global search** → rows narrow; no per-column filter UI exists.
5. Owner compares **Default** (static) vs **Interactive** → identical sort/search/columns UI; only the
   Interactive one has clickable rows + chevron + selected-row feedback.
6. Owner opens **CardMode** (<1024px) → cards + one compact Sort control; same sort model.
7. Owner opens **Responsive** and drags the viewport across widths → the same component switches
   card↔table at 1024px with the same controls; ⇅ menu and Columns popover stay viewport-bounded.
8. Owner switches locale (sq/en/uk/it) → all menu items, "Columns", search placeholder, empty/loading copy
   are localized; long uk strings wrap; no overflow.
9. Owner scans the AdminTable sidebar → a clean scenario-named list (~10–14), no width tokens, no
   `Filtered_*`/`ColFilter_*` family, no proof duplicates.

**Post-conditions:** one canonical scenario family; Docs primary = canonical table; `check:i18n` parity;
`tsc`/`build`/`lint` clean; `build-storybook` exits 0; no `src/app`/`src/modules`/`layout`/UI-primitive/
DB/package/Storybook-config diff.

## Negative flow (every off-happy-path branch) — required (Task 255 rule)

- **Temptation to re-add row filtering / filter chips / a Status-Role-City panel** → DO NOT; filtering is
  removed by owner decision; global search is the only narrowing control.
- **Temptation to add per-width or `*_Filtered`/`Demo` proof stories** → DO NOT; scenario-named only; count
  goes down.
- **⇅ menu needs a popover/dropdown primitive that doesn't exist** → it DOES (`dropdown-menu.tsx`); do not
  build a new one. If a genuine gap appears → STOP & ASK.
- **Hiding all columns** → guard so at least the sticky/first column cannot be hidden (or the Columns
  manager prevents an all-hidden state); document the rule.
- **Date column sort** → uses Newest/Oldest labels, not A→Z.
- **Long uk/it label** → wraps; ⇅ icon and menu stay aligned; chevron stays visible in interactive mode.
- **Narrow 320/360/375/390/412/480** → ⇅ dropdown and Columns popover stay viewport-bounded; no horizontal
  page overflow.
- **Keyboard/focus/aria** for the ⇅ menu trigger, menu items, Columns checkboxes, search, and row
  activation must work and not regress.
- **Scope-escape** → if a fix needs a UI-primitive change / a layout primitive / `src/app` / `src/modules`
  / DB / package / Storybook-config change → STOP & ASK.

## Acceptance criteria (literal — each maps to a flow above)

1. Column-header ⇅ opens a dropdown menu with **sort** items (type-correct labels: text A→Z/Z→A, date
   Newest/Oldest, numeric low→high/high→low) + **Hide column**. No filter chips, no funnel/sliders.
2. A **Columns** manager control exists and can hide/show (restore) columns; all-hidden is prevented.
3. **No row filtering** anywhere; a single **global search** is the only data-narrowing control; the
   filter-chip system (`ColumnFilteredTableDemo` filters, `ColFilterPanel`, `MobileColFilterPanel`,
   `CFL` chips) is deleted.
4. The header ⇅ icon is `h-3 w-3` (12px) — smaller than the `text-sm` header font; no affordance icon is
   ≥ the header font size.
5. `AdminTable.stories.tsx` is a clean **scenario-named** family (~10–14 exports); no per-width exports,
   no `Filtered_*`/`ColFilter_*` family, no proof duplicates; Docs/autodocs primary = the canonical table.
6. Static vs Interactive differ only by row click / chevron / selected-row feedback; sort/search/columns
   UI is identical.
7. CardMode + Responsive prove the same component & controls across card/table modes via the viewport
   toolbar.
8. sq/en/uk/it localized; no mixed-language normal story; no raw key/enum; `check:i18n` passes.
9. ⇅ dropdown + Columns popover are viewport-bounded at 320/360/375/390/412/480; no horizontal overflow;
   long uk/it labels wrap.
10. Keyboard/focus/aria preserved for menu trigger, menu items, checkboxes, search, row activation.
11. AdminCardList.stories.tsx trimmed (or left as-is with a documented reason); no new card UX; no second
    sort/search system there.
12. No `src/app`/`src/modules`/`src/components/layout`/`src/components/ui`/DB/package/Storybook-config diff.
13. `tsc` passes; `build` passes; `lint` 0 new errors/warnings; `check:i18n` passes; `build-storybook`
    exits 0.
14. Session log includes the Note 22 before/after inventory, deleted-stories list, canonical scenario
    list, Files Changed table, validation results, and the rendered-QA matrix.
15. The rendered-QA matrix is the **FULL grid**: every scenario story × all 14 canonical widths × all 4
    locales (sq/en/uk/it), PASS / OWNER QA REQUIRED / N/A(mode) per cell — no representative subset.

## Required validation (run & report the exact command used)

- `git status --short`
- `npm run typecheck` (or `npx tsc --noEmit`) → 0 errors
- `npm run build`
- `npm run lint` → 0 new errors/warnings
- `npm run check:i18n` → parity PASS
- `npm run build-storybook` (bounded smoke build; must exit 0; do NOT leave `storybook dev` running)
- **rg audits (paste results):**
  - filter system gone:
    `rg -n "filterable|filterActive|onFilterClick|ColumnFilteredTableDemo|ColFilterPanel|MobileColFilterPanel|FilterChips" src/components/admin`
    (expected: no matches, or only in deleted-history notes)
  - story set scenario-named & small:
    `rg -n "^export const " src/components/admin/AdminTable.stories.tsx | wc -l` and
    `rg -n "^export const (W[0-9]|.*Filtered|ColFilter|.*[0-9]{3,})" src/components/admin/AdminTable.stories.tsx`
    (expected: no width-token / Filtered / ColFilter exports)
  - canonical menu present + icon size:
    `rg -n "DropdownMenu|ArrowUpDown|EyeOff|h-3 w-3|onSort|onHideColumn|hideable|sortType" src/components/admin/AdminTable.tsx`
  - no forbidden ICONS imported from lucide (check the import line, not identifiers):
    `rg -n "from 'lucide-react'" src/components/admin/AdminTable.tsx src/components/admin/AdminTable.stories.tsx`
    then confirm none of `Funnel`, `Sliders`, `SlidersHorizontal`, `Tune`, `Settings`, `Settings2`,
    `ListFilter`, `Filter` (the icon) are imported/rendered.
- `git diff -- src/app src/modules src/components/layout src/components/ui` → MUST be empty
- `git diff -- package.json package-lock.json .storybook` → MUST be empty

## Required rendered QA matrix (in the final report)

**FULL GRID — every scenario story is verified at ALL 14 canonical widths × ALL 4 locales (owner
decision 2026-06-02). No representative subset, no spot-check shortcut.**

The 14 widths (columns of every sub-matrix):
**320 · 375 · 390 · 480 · 560 · 680 · 768 · 810 · 960 · 1024 · 1200 · 1440 · 1920 · 2560.**
The 4 locales (rows of every sub-matrix): **sq · en · uk · it.**
⇒ Each scenario story = **14 × 4 = 56 cells**, PASS / OWNER QA REQUIRED per cell, exercised via the
viewport + locale toolbars.

Produce ONE 14×4 sub-matrix per scenario story:
- **Default / canonical table** — 14 × 4
- **ColumnMenu (sort + hide open)** — 14 × 4 (at <1024 the menu is reached via the CardMode Sort control;
  verify the mode-appropriate control at each width; date-column labels verified)
- **ManageColumns (hide + restore)** — 14 × 4 (table-mode manager ≥1024; <1024 verify the card Sort
  control state — note that column-hide is table-only and mark such cells "N/A (card mode)" rather than skipping)
- **Interactive** — 14 × 4
- **InteractiveCardMode** — 14 × 4
- **CardMode** — 14 × 4
- **Responsive (card↔table switch)** — 14 × 4
- **LocaleStress** — 14 × 4
- **EmptyState** — 14 × 4
- **LoadingState** — 14 × 4

Where a control is genuinely mode-specific (e.g. desktop column-hide at a card-mode width), mark the cell
**N/A (mode)** with a one-line reason — never silently omit a width or locale. Also explicitly inspect the
owner-observed **360 / 412** for the ⇅ dropdown and Columns popover overflow (in addition to the 14).

**Do NOT claim rendered PASS unless you actually rendered the story / captured a screenshot. If you only
restructured fixtures/code, mark OWNER QA REQUIRED for that cell.** Cells left unrendered must read
OWNER QA REQUIRED, not PASS.

## STOP & ASK conditions

The ⇅ menu or Columns manager cannot be built from existing `dropdown-menu.tsx`/`popover.tsx`/`checkbox.tsx`
without a new primitive · a sort/hide/visibility contract genuinely needs a breaking AdminTable API change
beyond the additive props above · AdminCardList trimming scope is unclear · any `src/app`/`src/modules`/
`src/components/layout`/`src/components/ui`/DB/package/Storybook-config change seems required · column
reordering is requested (it is OUT) · scope exceeds the column-menu redesign + story consolidation.

## Out of scope

Row filtering of any kind (chips, toolbar, per-column); column reordering/drag; new filtering UX;
admin/public route migration; unfreezing Sprint 28; Task 350 layout primitive changes; UI primitive
modifications; DB/SQL/RLS/auth; package upgrades; Storybook-config rewrite; Chromatic/Percy setup;
wholesale AdminTable redesign beyond the column-menu/columns-manager/global-search behavior.

## Final report required (no git commands from you)

- **Files Changed** table (Path / Change / Rationale).
- **Note 22 before/after inventory** (every preserved mode still reachable; only the filter-chip system
  intentionally removed).
- **Deleted stories list** + **canonical scenario list** (the ~10–14 that remain).
- Confirmation: column ⇅ = sort + hide menu (type-correct labels), NOT filter; Columns manager works;
  global search is the only narrowing control; filter-chip code deleted.
- Confirmation: ⇅ icon < header font (`h-3 w-3`); story names are scenario-based; Docs primary = canonical.
- Confirmation: no `src/app`/`src/modules`/`src/components/layout`/`src/components/ui`/DB/package/
  Storybook-config edits.
- **Validation command results** (exact commands + outcomes) + **rendered QA matrix** (PASS / OWNER QA REQUIRED).
- **No `git add` / `git commit` / `git push`.** End with the Files Changed table; Opus emits commits.
