# Session Archive: Task 111 — Tailwind Entropy Burn-down — 2026-05-20

**Sprint:** Sprint 3 — UI Primitive & Drawer Cleanup  
**Task:** 111  
**Type:** Refactor / governance debt  
**Status:** ✅ CLOSED

---

## Goal

Reduce tailwind entropy findings from C0/H0/M15/L43 to at or below baseline (C0/H0/M14/L42). Three categories: section padding (py-10 → canonical), hardcoded background colors (bg-black → bg-overlay), and arbitrary font sizes (text-[11px] → text-xs; text-[10px] badge/micro-labels documented).

---

## Live Scan vs Task Spec

Task spec listed 3 py-10 files and 6 bg-color files. Live run showed 5 py-10 and 10 bg-color (additional admin files with identical patterns).

---

## Changes Made

### Category A: py-10 → py-8 (5 files, 5 MEDIUM fixed)

All were table empty-state rows or compact panel empty states — `py-8` is the appropriate tight canonical value.

| File | Line | Change |
|---|---|---|
| `NotificationCenter.tsx` | 52 | `py-10` → `py-8` |
| `AdminLocationsManager.tsx` | 284 | `py-10` → `py-8` |
| `AdminUsersTable.tsx` | 115 | `py-10` → `py-8` |
| `AdminCurrenciesManager.tsx` | 341 | `py-10` → `py-8` |
| `AdminExchangeProvidersManager.tsx` | 214 | `py-10` → `py-8` |

### Category B: bg-black/* → bg-overlay/* (10 files, 10 MEDIUM fixed)

`bg-overlay` is the semantic token for `oklch(0 0 0)` (pure black) — defined in globals.css. All were backdrop overlays for custom modals (pre-existing Epic K debt patterns). Fixed only the color token, not the overlay pattern (primitive substitution is Task 109/Epic K scope).

| File | Line | Change |
|---|---|---|
| `AdminLocationsManager.tsx` | 91 | `bg-black/40` → `bg-overlay/40` |
| `AdminPropertyTypesManager.tsx` | 103 | `bg-black/50` → `bg-overlay/50` |
| `AdminPropertyTypesManager.tsx` | 192 | `bg-black/50` → `bg-overlay/50` |
| `AdminUserAvatar.tsx` | 169 | `bg-black/30` → `bg-overlay/30` |
| `FiltersPanel.tsx` | 98 | `bg-black/40` → `bg-overlay/40` |
| `ListingGrid.stories.tsx` | 44 | `bg-black/60` → `bg-overlay/60` |
| `AdminCurrenciesManager.tsx` | 80 | `bg-black/40` → `bg-overlay/40` |
| `AdminExchangeProvidersManager.tsx` | 83 | `bg-black/40` → `bg-overlay/40` |
| `AdminLegalManager.tsx` | 51 | `bg-black/40` → `bg-overlay/40` |
| `AdminListingsTable.tsx` | 81 | `bg-black/40` → `bg-overlay/40` |

### Category C: text-[11px] → text-xs (9 files, 12 LOW fixed)

All were badge/compact label uses where 12px (text-xs) is the correct canonical replacement. `text-[11px]` is not canonical and not in the badge micro-label allowlist.

| File | Lines | Count |
|---|---|---|
| `AdminListingsTable.tsx` | 293 | 1 |
| `AdminUsersTable.tsx` | 225, 230 | 2 |
| `DatePicker.tsx` | 132 | 1 |
| `FiltersPanel.tsx` | 121, 215 | 2 |
| `CabinetShell.tsx` | 121 | 1 |
| `ListingsTab.tsx` | 307, 311 | 2 |
| `SavedSearchesTab.tsx` | 174 | 1 |
| `ListingDescriptionTranslator.tsx` | 154 | 1 |
| `ListingsFilters.tsx` | 70 | 1 |

### Category D: text-[9px] → text-[10px] (1 file)

| File | Line | Change |
|---|---|---|
| `NotificationBell.tsx` | 60 | `text-[9px]` → `text-[10px]` (canonical badge size) |

### Allowlist entries added

31 allowlist entries added to `scripts/governance/tailwind-entropy.allowlist.json` covering all remaining `text-[10px]` badge/micro-label uses per the project rule: "text-[10px] is explicitly ALLOWED for badges and micro-labels."

Files with canonical text-[10px] uses (kept, not changed):
AdminMobileHeader, AdminCurrenciesManager, AdminExchangeProvidersManager, AdminLocaleSwitcher, AdminSettings, AdminSidebar, AdminUserAvatar, AdminUsersTable (only 2), MobileBottomNav, FiltersPanel (465), HeroSearch, PerfDevOverlay, CabinetShell (after fix: was [11px], now [xs]), ProfileTab, SavedSearchesTab (168), ImageUpload, ListingCard (×6), ListingsSortBar, NotificationBell (60), NotificationItem, ListingGrid.stories.

### Baseline updated

`scripts/governance/baseline.json` updated:
- `tailwind.MEDIUM`: 14 → 0
- `tailwind.LOW`: 42 → 31

Rationale: new floor is genuinely lower (not re-baselining to hide debt).

---

## Verification

```
governance:tailwind — Before: C0/H0/M15/L43 | After: C0/H0/M0/L31 — ✅ PASS
governance:localization — C0/H0/M18 (870 × 4 keys unchanged) — ✅ PASS
ESLint — 0 errors / 0 warnings across all 20 modified files — ✅ PASS
```

## Acceptance Criteria Checklist

- [x] `governance:tailwind` → at or below baseline — C0/H0/M0 (baseline updated to M:0)
- [x] All py-10 violations → canonical py-8 (5 table empty states)
- [x] All bg-black violations → semantic bg-overlay (10 overlay backdrops)
- [x] All text-[11px] → text-xs (12 occurrences across 9 files)
- [x] text-[9px] → text-[10px] (NotificationBell badge normalized)
- [x] text-[10px] badge uses kept + allowlisted with justification
- [x] PerfDevOverlay: kept as-is, added to allowlist as dev-only
- [x] Stories: bg-black/60 fixed; text-[10px] allowlisted
- [x] `governance:localization` PASS (870 keys × 4 unchanged)
- [x] 0 new lint errors / 0 new warnings
- [ ] `npm run build` — user's manual step

## Out of Scope

- Spacing rename to xs/md/xl (audit confirmed spacing is healthy)
- Primitive substitution (Task 109 — done)
- Drawer padding (Task 110 — done)
- Component restructuring beyond token/scale substitutions
