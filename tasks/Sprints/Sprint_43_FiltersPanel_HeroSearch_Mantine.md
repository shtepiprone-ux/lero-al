# Sprint 43 — FiltersPanel / HeroSearch → Mantine (Epic MM Phase-2, composite surfaces)

**Owner-approved 2026-07-09.** After the Combobox family (551/552/553), PhoneField (556) and the
DatePicker/range work (558–565) closed, the last legacy-primitive holdouts in the search stack are the
two composite surfaces `HeroSearch` + `FiltersPanel` and their three leaf filter sub-components. This
sprint migrates all five off `@/components/ui/*` onto the canonical Mantine + TailAdmin primitives,
**preserving 100% of the filter logic, URL-param contract, and public Props APIs.**

## Legacy inventory (verified 2026-07-09)

| File | Legacy primitives still used |
|---|---|
| `src/components/shared/FilterRangeInputs.tsx` | `ui/input` ×2 (price/area/floor/floors_total min–max) |
| `src/components/shared/FilterMultiToggle.tsx` | `ui/button` (condition/heating/wall/offer/layout/purchase multi-select chips) |
| `src/components/shared/FilterRoomsRow.tsx` | `ui/button` (rooms 1–5+ toggles) |
| `src/components/shared/FiltersPanel.tsx` | `ui/sheet` (overlay), `ui/button` (close-X, property/market toggles, Apply/Reset footer), `ui/input` (listing-id search) |
| `src/components/shared/HeroSearch.tsx` | `ui/button` ×4 (sale/rent tabs, filters button, search button) |

Already migrated — DO NOT touch: `LocationCombobox`, `YearCombobox`, `PropertyTypeCombobox`, `RangeDatePicker`.

## Owner decisions (2026-07-09)

1. **Task split = 3 tasks** (leaf sub-components → FiltersPanel shell → HeroSearch). Each closes with its
   own rendered proof — narrowest review surface.
2. **FiltersPanel overlay → `MantineDrawer`** (canonical Task 523 result; `position="right"` desktop,
   `<640` full-width bottom sheet via the single-source `ResponsiveBottomSheet` contract). NOT the legacy
   `ui/sheet`, NOT a bare `ResponsiveBottomSheet`.
3. **Toggle grids stay toggle-buttons on Mantine `Button`** (selected `variant="filled"` brand / unselected
   `variant="default"` §6a), NOT a redesign to `SegmentedControl` — the multi-select grids (condition/
   heating/wall/offer/layout/purchase) are inherently multi-select and cannot be a single-select segmented
   control. Behavior preserved verbatim.

## Tasks

| # | Scope | Depends on | Kickoff |
|---|---|---|---|
| **566** | 3 leaf sub-components → Mantine: `FilterRangeInputs` (→ Mantine `TextInput` §6e), `FilterMultiToggle` + `FilterRoomsRow` (→ Mantine `Button` toggles §6a) | — | `Sprint_43_kickoff_prompt_Task_566_FilterLeafComponentsMantine.md` |
| **567** | `FiltersPanel` shell: `ui/sheet` → `MantineDrawer`; close-X → Mantine `ActionIcon`/`Button`; property-type + market-type toggle grids → Mantine `Button`; listing-id `ui/input` → Mantine `TextInput`; Apply/Reset footer → Mantine `Button`. Consumes the 566 leaf components unchanged. | 566 | *(authored after 566 approved)* |
| **568** | `HeroSearch`: sale/rent tabs, filters button (+ active-count badge), search button → Mantine `Button`; card/tab layout keeps its structure; mobile <640 full-width per clause 11. | 567 | `Sprint_43_kickoff_prompt_Task_568_HeroSearchMantine.md` ✅ authored 2026-07-10 |

**Order matters:** 566 first (leaf components are consumed by 567's shell); 567 before 568 (HeroSearch mounts
FiltersPanel). Each task is held for orchestrator diff + rendered review before the next is handed off.

## Sprint-wide gates (every task)

- **Logic frozen:** zero change to `filterEngine`, URL-param serialization, `useHomepageFilters`, number
  parsing, or any public Props API. Presentational swap only (the Task 556 PhoneField precedent).
- **TailAdmin (clause 16):** every value traces to a `docs/tailadmin-style-reference.md` §-row (§6a Button /
  §6e input chrome); rendered side-by-side vs the reference — `tsc=0`/gate-green is NOT style proof.
- **Mobile <640 (clause 11):** text Buttons full-width unless an explicitly-listed compact exemption
  (the filter-chip wrap grids are the documented exemption — see each kickoff); ≥44px touch; labels wrap
  sq/en/uk/it; no h-scroll at 320.
- **Rendered evidence (clause 12/13 + §18.9):** persisted `Mantine/Primitives/*` story + `screenshots:assert
  -- --mantine-only` green + human-visual uk@320/375/390 set.
- **Regression (clause 15):** the listings-filter flow is in `docs/critical-flow-registry.md` — baseline +
  extend; RTL smoke with a planted-violation transcript per task.
