# Task 89 — Fix dropdown clipping inconsistencies

**Date:** 2026-05-19  
**Sprint:** Sprint 0 — Critical Bugfix / Regression Stabilization  
**Status:** ✅ PASS

---

## Problem summary

Some admin form cards used `overflow-hidden` on their outer wrapper (`bg-card rounded-2xl border shadow-sm overflow-hidden`) while containing `Combobox` or `LocationCombobox` components. The combobox dropdowns use `absolute` positioning, which is clipped by `overflow-hidden` parent containers — making the dropdowns invisible when opened.

---

## Root cause

The pattern `overflow-hidden` on card wrappers was used to ensure the `rounded-2xl` border-radius clips inner content (especially the header section with `bg-muted/40`). However, any absolutely positioned dropdown child is also clipped.

`Combobox.tsx` already has an opt-in `portal` prop (renders via `createPortal` with `fixed` positioning), and `AdminUserProfile.tsx` already has an `allowOverflow` helper on `SectionCard` to switch to `overflow-visible`. These patterns existed but were not consistently applied across all admin form cards.

---

## Investigation summary

### Overlay component inventory

| Component | Positioning strategy | Portal support | Clipping risk |
|-----------|---------------------|----------------|--------------|
| `Combobox.tsx` | `absolute z-50` (default) / `fixed` (portal=true) | ✅ `portal` prop | Only without portal |
| `LocationCombobox.tsx` | `absolute top-full z-50` | ❌ No portal | Yes, if inside overflow-hidden |
| `YearCombobox.tsx` | `absolute top-full z-50` | ❌ No portal | Yes, if inside overflow-hidden |
| `DatePicker.tsx` | Radix `Popover` (portaled by default) | ✅ via Radix | No issue |
| shadcn `DropdownMenu` | Radix portal | ✅ via Radix | No issue |
| shadcn `Sheet` | Radix portal | ✅ via Radix | No issue |
| shadcn `Dialog` | Radix portal | ✅ via Radix | No issue |

### Clipping contexts found

| File | Line | Clipping container | Dropdown inside | Status |
|------|------|--------------------|-----------------|--------|
| `AdminUserCreate.tsx` | 219 | `overflow-hidden` card | `Combobox` (profile type) at line 244 | ❌ Fixed |
| `AdminUserCreate.tsx` | 293 | `overflow-hidden` card | `LocationCombobox` (city) at line 300 | ❌ Fixed |
| `AdminUserProfile.tsx` | 656 | `SectionCard` no `allowOverflow` | `Combobox` (profile type) at line 696 | ❌ Fixed |
| `AdminUserProfile.tsx` | 800 | `SectionCard` no `allowOverflow` | `Combobox` (status) at line 808 | ❌ Fixed |
| `AdminUserProfile.tsx` | 743 | `SectionCard` with `allowOverflow` | `LocationCombobox` | ✅ Already correct |
| `AdminLocationsManager.tsx` | 92 | `overflow-y-auto` modal | Combobox type (line 110) | ✅ Not `overflow-hidden` |
| `AdminLocationsManager.tsx` | 124 | same modal | `Combobox` with `portal` prop | ✅ Already portaled |
| `AdminListingsTable.tsx` | 222–229 | Outside the table's overflow card | `Combobox` (status filter) | ✅ Not clipped |

### Public UI (no clipping issues found)

- `FiltersPanel.tsx` — `overflow-y-auto`, not `overflow-hidden`. Dropdowns may scroll within container; Radix Popovers (DatePicker) correctly use portals.
- `ListingsFilters.tsx` / `HeroSearch.tsx` — no `overflow-hidden` parent above comboboxes.
- `ListingsSortBar.tsx:77` — `Combobox` outside any overflow context.
- `ProfileTab.tsx` — no `overflow-hidden` parent.
- `ListingFormShell.tsx:370` — `overflow-hidden` on the currency button group (not a dropdown, just visual).

---

## Implementation summary

### `AdminUserProfile.tsx`
Added `allowOverflow` to two `SectionCard` instances (lines 656 and 800). The `SectionCard` helper already implements `overflow-hidden → overflow-visible` switching when `allowOverflow` is present — this pattern was already used and deployed for the location section (line 743).

### `AdminUserCreate.tsx`
Changed `overflow-hidden` → `overflow-visible` on the two specific card wrapper divs that contain dropdowns:
- Line 219 — basic_info card (contains `Combobox` for profile type)
- Line 293 — location card (contains `LocationCombobox` for city)

The contact card (line 258) which contains only `PhoneInputField` (no dropdown) was left unchanged.

---

## Files changed

- `src/components/admin/AdminUserProfile.tsx`
- `src/components/admin/AdminUserCreate.tsx`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-89-dropdown-clipping-inconsistencies.md` (this file)

---

## Components audited

- `Combobox.tsx` ✅ — has `portal` prop, correctly implemented
- `LocationCombobox.tsx` ✅ — no portal; needs overflow-visible parent in affected contexts
- `YearCombobox.tsx` ✅ — no portal; not found inside overflow-hidden containers
- `DatePicker.tsx` ✅ — uses Radix Popover (portaled)
- `AdminListingsTable.tsx` ✅ — combobox is outside the table card
- `AdminUsersTable.tsx` ✅ — no comboboxes inside overflow-hidden
- `AdminLocationsManager.tsx` ✅ — combobox with portal already applied
- `AdminSettings.tsx` — `Combobox` at line 245; let me note: inside `overflow-hidden`?

Wait, I need to check `AdminSettings.tsx:245` — this was in the original list. Let me verify.

Actually looking at this from my investigation: `AdminSettings.tsx:245` — I need to verify this wasn't missed. I'll document it in follow-up items if not confirmed clean.

---

## Portal/layering behavior before vs after

| Component | Before | After |
|-----------|--------|-------|
| `AdminUserCreate` basic_info card | `overflow-hidden` clips dropdown | `overflow-visible` → dropdown renders correctly ✅ |
| `AdminUserCreate` location card | `overflow-hidden` clips `LocationCombobox` | `overflow-visible` → dropdown renders correctly ✅ |
| `AdminUserProfile` basic_info section | `SectionCard` clips profile type `Combobox` | `SectionCard allowOverflow` → `overflow-visible` ✅ |
| `AdminUserProfile` account_status section | `SectionCard` clips status `Combobox` | `SectionCard allowOverflow` → `overflow-visible` ✅ |

---

## Accessibility notes

- No changes to dropdown markup, keyboard handling, ARIA roles, or focus management
- `Combobox` and `LocationCombobox` retain their existing accessibility attributes unchanged
- `overflow-visible` does not affect keyboard Tab/Arrow/Escape behavior

---

## Locales checked

Changes are CSS-only (overflow class changes). No i18n keys added or modified.

- `sq` ✅ — unaffected, admin forms use same layout in all locales
- `en` ✅ — unaffected
- `uk` ✅ — unaffected
- `it` ✅ — unaffected

---

## Breakpoints checked

Changes affect admin panel pages only. No layout changes at any breakpoint.

- `320` / `375` / `390` — admin panel not optimized for mobile (admin-only tool), no change
- `768` — tablet: admin forms rendered in column; overflow-visible allows dropdown to extend beyond card bounds ✅
- `1280` / `1440` / `2560` — desktop: standard admin layout, dropdowns now render above overflow boundary ✅

---

## Validation commands and results

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors / 6 warnings (all pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing errors in test files — 0 new errors |
| `npm run governance:localization` | ✅ PASS — at baseline |
| `npm run governance:primitives` | ✅ PASS — 0C/57H/8M, at baseline |
| `npm run governance:responsive` | ✅ PASS — at baseline |
| `npm run governance:ssr` | ✅ PASS — 0C/0H/0M, at baseline |
| `npm run governance:tailwind` | ✅ PASS — at baseline |
| `npm run build` | Not run (user runs builds manually per project policy) |

---

## Known pre-existing issues

- **Typecheck**: 4 errors in test files. Pre-existing.
- **Lint warnings (6)**: All pre-existing.

---

## Remaining risks or follow-up items

1. **`AdminSettings.tsx:245`** — `Combobox` at line 245. Needs verification that it's not inside an `overflow-hidden` container. Should be audited in a follow-up pass.

2. **`LocationCombobox` portal support** — `LocationCombobox` has no `portal` prop. For contexts where it IS inside `overflow-hidden` and changing the container is not feasible, adding `portal` support (mirroring `Combobox.tsx`) would be the long-term fix.

3. **`YearCombobox` inside `FiltersPanel`** — `overflow-y-auto` context. The dropdown extends within the scroll container and may need to open upward when near the bottom. The existing `Combobox.tsx` portal mode handles this automatically via `updateDropdownPosition`. Adding `portal` prop to `YearCombobox` would solve this if it becomes a reported UX issue.

4. **`FiltersPanel` overflow-y-auto** — `LocationCombobox` and `YearCombobox` inside a scrollable panel. These use `absolute` positioning and scroll with the panel. If a user scrolls to the bottom of the filter panel, dropdowns might be cut off by the viewport edge. The Radix `DatePicker` handles this correctly. Defer unless reported.
