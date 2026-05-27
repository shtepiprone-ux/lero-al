# Epic W — Listings Page Filter Bar & Drawer Polish

**Status:** OPEN — opened 2026-05-25 by the Opus 4.7 orchestrator.
**Source notes:** `issues.txt` 2026-05-25 — #4–5 (filter drawer: "Ринок нерухомості" section disappears
when "Тип нерухомості" changes, on both homepage and `/listings`); #7 (two separate "Reset filters"
buttons on `/listings` — must collapse into ONE global reset that also clears the segmented
sale/rent/all toggle, the "All types" combobox, and the location chip); #8 (sort combobox is missing
the "Area: ascending" option); #11 ("Всі типи" and "Спочатку нові" on `/listings` are not the
canonical Combobox); #12 (`.listings-filter-bar` clips horizontally — bring every control on the page
to the canonical adaptive form); #13 (the vertical gap between `.listings-filter-bar` and the status
tabs is too small — double it so the bar does not press on the tabs).
**Kickoffs:** `Epic_W_kickoff_prompts.md` (Tasks 228–233).

## Goal

The `/listings` page (and the homepage filter drawer where the same controls live) becomes the
canonical reference for filter UX in this project: one consistent reset, one sort catalog, only
canonical primitives, no clipped toolbar, predictable vertical rhythm, and zero "section disappears
when I pick a property type" surprises.

## Dependencies

- `src/modules/listings/components/ListingsFilters.tsx`, `ListingsFilterBar.tsx`,
  `ListingsStatusTabs.tsx` (the `/listings` toolbar and tabs surface).
- `src/modules/filters/components/FiltersPanel.tsx`, `useHomepageFilters.ts` (the homepage drawer,
  same filter primitives — sibling that must move in lockstep per Note 14).
- `src/lib/filters/filterEngine.ts` (`parseSearchParams`, `countActiveFilters`, `getFilterVisibility`)
  — the canonical normalization + visibility layer. Filter section visibility must come from this,
  not local component state (Filter Architecture Anti-Patterns, `docs/ai-behavior.md`).
- Canonical `Combobox` (`src/components/ui/combobox.tsx`) — the only allowed selection primitive for
  type / sort / location. `Select`-based domain inputs are forbidden (`docs/ai-behavior.md` →
  Selection Components Policy).
- `docs/ui-rules.md` §0 (single-source Combobox/Button), §1 (spacing scale), §4 (canonical Input/
  control heights), §15–§17 (canonical control alignment + UI pre-flight), §16 (z-index scale).

## Tasks

- **Task 228 — W.1** — Filter sections disappearing on property-type change (real-estate market +
  any other section). Root-cause in `getFilterVisibility` / `handlePropertyTypeChange` / draft-state
  pruning; fix in `filterEngine.ts`; apply to BOTH FiltersPanel (homepage drawer) and
  ListingsFilters (`/listings` drawer).
- **Task 229 — W.2** — One global "Reset filters" button on `/listings` that clears: sale/rent/all
  segmented toggle, property-type Combobox, location chip, all drawer fields. Remove the duplicate
  reset button currently shipping.
- **Task 230 — W.3** — Add the missing `area_asc` (Area: ascending) sort option to the canonical
  sort catalog + the i18n key (×4); verify it routes through `filterEngine.ts` and the listings
  query.
- **Task 231 — W.4** — Convert "Всі типи" (property-type) and "Спочатку нові" (sort) controls on
  `/listings` to the canonical `Combobox` (variant=`button` per §15). Kill any custom dropdown
  wrappers left in `ListingsFilterBar.tsx`.
- **Task 232 — W.5** — Fix the horizontal clipping of `.listings-filter-bar` (currently
  `flex-nowrap overflow-x-auto`) and bring every control on the page to canonical adaptive form
  per `docs/ui-rules.md §15–§17`. Mobile-first; verify at 320 / 375 / 390 / 768 / 1280 / 1440 / 2560.
- **Task 233 — W.6** — Double the vertical gap between `.listings-filter-bar` and the status tabs
  (`.listings-status-tabs`) so the bar no longer crowds the tabs. Use the canonical spacing scale
  (`docs/ui-rules.md §1`) — no arbitrary `py-N` values.

## Epic-level acceptance

- Switching property type in EITHER the homepage drawer OR the `/listings` drawer never silently
  removes a filter section that was visible for the previous type — visibility is one shared,
  documented decision in `filterEngine.ts` (Global Change Verification Rule).
- `/listings` has ONE global "Reset filters" that clears every user-set filter, including the
  segmented toggle, property type, location, and drawer fields.
- The sort catalog is complete (price asc/desc, date newest/oldest, area asc/desc, …) and lives in a
  single source consumed by both drawer and toolbar.
- `/listings` toolbar uses ONLY canonical `Combobox` + `Button`; no custom dropdown wrappers.
- `.listings-filter-bar` does not clip at any of the 7 breakpoints in `uk` (longest strings); the
  vertical gap to the tabs uses the canonical spacing scale.
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints; governance PASS.
