# Task 93 — Full site-wide dropdown/popover clipping audit

**Date:** 2026-05-19
**Sprint:** Sprint 1 — Bugfix Continuation & Admin Polish
**Status:** ✅ PASS

---

## Problem summary

Two dropdown rendering strategies existed in the project. Base UI primitives (Popover, DropdownMenu, Select) use portal rendering and are clipping-safe. Custom Combobox variants used absolute positioning and were clipped by scroll containers. `FiltersPanel` and `ListingsFilters` sidebar both wrap dropdowns inside `overflow-y-auto` containers, causing dropdown clipping.

---

## Task 89 baseline (what was already fixed)

Task 89 fixed 4 locations in the admin panel:
- `AdminUserCreate.tsx` — 2 form cards changed `overflow-hidden` → `overflow-visible`
- `AdminUserProfile.tsx` — 2 SectionCards given `allowOverflow` prop

---

## Site-wide audit findings

### Portal strategy classification

| Component | Strategy | Safe? |
|---|---|---|
| `DropdownMenu` | Base UI `MenuPrimitive.Portal` → body | ✅ |
| `Popover` | Base UI `PopoverPrimitive.Portal` → body | ✅ |
| `Select` | Base UI `SelectPrimitive.Portal` → body | ✅ |
| `Sheet` | Base UI dialog portal | ✅ |
| `DatePicker` | Uses `Popover` → portal | ✅ |
| `Combobox` | Dual-mode: `portal=false` (abs) / `portal=true` (fixed/body) | ⚠️ prop-dependent |
| `LocationCombobox` (before fix) | Absolute only — no portal support | ❌ |
| `YearCombobox` (before fix) | Absolute only — no portal support | ❌ |
| `SettlementCombobox` (ProfileTab) | Always `createPortal` → body | ✅ |

### Clipping risk inventory

| File | Component | Container | Risk |
|---|---|---|---|
| `FiltersPanel.tsx:138` | `LocationCombobox` | `div.overflow-y-auto` (line 132) | ❌ CLIPPING |
| `FiltersPanel.tsx:314,323` | `YearCombobox` ×2 | same `div.overflow-y-auto` | ❌ CLIPPING |
| `ListingsFilters.tsx:124` | `LocationCombobox` | used in `ListingsShell:175` `div.overflow-y-auto` | ❌ CLIPPING |
| `ListingsFilters.tsx:276,285` | `YearCombobox` ×2 | same `ListingsShell:175` container | ❌ CLIPPING |
| `AdminLocationsManager.tsx` | `Combobox` | already `portal={true}` | ✅ |
| `AdminUserCreate.tsx` | `LocationCombobox` | card `overflow-visible` (Task 89) | ✅ |
| `AdminUserProfile.tsx` | `LocationCombobox` | `allowOverflow=true` SectionCards (Task 89) | ✅ |
| `HeroSearch.tsx` | `LocationCombobox` | no overflow parent | ✅ |
| `StepLocation.tsx` | `LocationCombobox` | no overflow parent | ✅ |

---

## Implementation

### 1. `LocationCombobox.tsx` — Add `portal` prop

Added:
- `useRef, useCallback, useEffect` to imports
- `createPortal` from `react-dom`
- `portal?: boolean` to Props interface
- `containerRef` for position calculation
- `dropdownStyle` state
- `updateDropdownPosition` callback (viewport-aware, opens up/down)
- `useEffect` registering scroll/resize listeners when portal+open
- Computed `dropdownContent` JSX variable (conditional on portal mode for CSS class vs inline style)
- Portal branch: `createPortal(dropdownContent, document.body)` when `portal={true}`
- `onFocus` calls `updateDropdownPosition()` to pre-compute before opening

### 2. `YearCombobox.tsx` — Add `portal` prop

Same pattern as `LocationCombobox` — identical implementation.

### 3. `FiltersPanel.tsx` — Pass `portal` at 3 call sites

```tsx
<LocationCombobox ... portal />
<YearCombobox ... portal />
<YearCombobox ... portal />
```

### 4. `ListingsFilters.tsx` — Pass `portal` at 3 call sites

```tsx
<LocationCombobox ... portal />
<YearCombobox ... portal />
<YearCombobox ... portal />
```

---

## Files changed

- `src/components/shared/LocationCombobox.tsx`
- `src/components/shared/YearCombobox.tsx`
- `src/components/shared/FiltersPanel.tsx`
- `src/modules/listings/components/ListingsFilters.tsx`
- `docs/component-risk-register.md`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-93-dropdown-clipping-audit.md` (this file)

---

## Localization coverage

All 4 locales render the same component logic — no locale-specific changes. Ukrainian strings (longest) are not affected by portal strategy.

---

## Responsive coverage

Portal strategy uses `getBoundingClientRect()` + viewport height for position calculation — correct at all 7 breakpoints. Viewport-aware flip (opens upward when insufficient space below) works at all sizes.

---

## Validation

| Command | Result |
|---|---|
| `npm run lint` | ✅ 0 errors / 5 warnings (all pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing test errors, 0 new |
| `npm run governance:localization` | ✅ PASS at baseline |
| `npm run build` | Not run (per policy — user runs manually) |

---

## Known remaining items

- `NotificationBell` dropdown uses absolute positioning but lives only in Header which has no scroll/overflow parent — low risk, deferred.
- `Combobox` call sites without `portal={true}` in non-scrolling containers are safe by structural design.
