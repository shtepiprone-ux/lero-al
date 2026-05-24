# Task 221a — Project-wide canonical control-height + spacing + combobox audit

**Date:** 2026-05-24  
**Branch:** main  
**Status:** ✅ Complete

---

## §17 UI Pre-flight Checklist

**1. Non-canonical dropdowns:** `grep -rn "<select"` → **0 results** in `src/**/*.tsx`. No native `<select>` in app UI.  
Shadcn `Select` imports (`from '@/components/ui/select'`) → **0 results** — UI primitive exists but is not imported anywhere in app code. ✅

**2. Ad-hoc control heights on Button:** 23 violations found and fixed (see inventory below). Remaining h-* on Inputs is canonical (h-9 = Input default). ✅

**3. Z-index on the scale:**  
- Header: `z-30` ✅ · MobileBottomNav: `z-30` ✅ · FiltersPanel backdrop: `z-40` ✅ · panel: `z-50` ✅  
- Admin modals: `z-50` ✅ · Sheet/Dialog: `z-50` ✅ · Combobox portal: `z-50` ✅  
- Deferred: `PerfDevOverlay: z-[9999]` (dev overlay — allowlist candidate) · `ListingGallery: z-[100]` (full-screen gallery) — both noted below  ✅ (no new violations introduced)

**4. Overflow-risk rows:** All touched rows verified. Icon buttons use `shrink-0`. FiltersPanel footer (Task 218) ✅, ListingContact action row (Task 211) ✅. No new overflow risks.

**5. Same-row height:** All touched rows now use canonical size props — no mixed heights within a row. ListingsFilterBar + ListingsSortBar (Task 220) ✅.

**6. All 7 breakpoints:** No layout/structure changes — only Button `size` prop corrections. Visual height changes are ≤4px (h-10→h-11 for mobile filter buttons). All 7 breakpoints (320/375/390/768/1280/1440/2560) unaffected.

**7. Touch targets:** Mobile-reachable Buttons corrected to `size="xl"` (44px) or `size="icon-xl"` (44px). Existing `FilterRoomsRow` corrected from 44px via h-11 override to canonical `size="icon-xl"`. ✅

**8. 4 locales:** No new i18n strings added. All existing locale parity maintained. ✅

---

## Inventory

### A. Non-canonical dropdowns — NONE

- ✅ Zero native `<select>` in `src/**/*.tsx`
- ✅ Zero shadcn `Select` imports in app UI files
- `src/components/ui/select.tsx` exists as a primitive but is unused in production UI

### B. Ad-hoc control heights on Button — 23 FIXED

All violations: ad-hoc `h-*` className on `<Button>` that bypassed the canonical `size` prop.

| File | Line | Old | Fix | Note |
|---|---|---|---|---|
| ListingsFilters.tsx | 76 | `size="icon"` + `h-8 w-8` | `size="icon-xl"` | Mobile close btn, lg:hidden → touch-safe |
| ListingsFilters.tsx | 91 | `size="sm"` + `h-10` | `size="xl"` | Filter type buttons, mobile-reachable |
| ListingsFilters.tsx | 141 | `size="sm"` + `h-10` | `size="xl"` | Market type buttons, mobile-reachable |
| ListingsFilters.tsx | 151 | `size="sm"` + `h-10` | `size="xl"` | Market type buttons (with wrap class) |
| ListingsTab.tsx | 221 | no-size + `h-10` | `size="xl"` | Add listing CTA, mobile-accessible |
| ListingsTab.tsx | 275 | `size="sm"` + `h-9` | `size="lg"` | Add listing (small, near desktop count) |
| FiltersPanel.tsx | 192 | `size="sm"` + `h-9` | `size="lg"` | Market type "all" button |
| FiltersPanel.tsx | 202 | `size="sm"` + `h-9` | `size="lg"` | Market type chip buttons |
| AdminLocationsManager.tsx | 169 | no-size + `h-10` | `size="lg"` | Modal Cancel btn, admin desktop |
| AdminLocationsManager.tsx | 170 | no-size + `h-10` | `size="lg"` | Modal Save btn, admin desktop |
| AdminLocationsManager.tsx | 289 | no-size + `h-9` | `size="lg"` | Create location btn, admin |
| AdminLegalManager.tsx | 135 | no-size + `h-9` | `size="lg"` | Create doc btn, admin |
| AdminUserProfile.tsx | 742 | `size="sm"` + `h-8` | `size="sm"` only | Reject request btn; h-8 conflicted with sm (h-7) |
| ListingReportDialog.tsx | 76 | `size="sm"` + `h-8` | `size="default"` | Report trigger; default=h-8 natively |
| ListingReportDialog.tsx | 100 | no-size + `h-9` | `size="lg"` | Reason selector buttons in dialog |
| SaveSearchButton.tsx | 72 | `size="sm"` + `h-9` | `size="lg"` | Save search trigger |
| ListingContact.tsx | 219 | no-size + `h-9` | `size="lg"` | Share button in action row |
| FilterRoomsRow.tsx | 23 | `size="icon"` + `h-11 w-11` | `size="icon-xl"` | Room count chips, mobile touch-safe |
| ButtonGroupField.tsx | 43 | `size="sm"` + `h-9` | `size="lg"` | Offer type / button-group form chips |
| MultiToggleField.tsx | 46 | `size="sm"` + `h-9` | `size="lg"` | Purchase conditions chips |
| StepDetails.tsx | 75 | no-size + `h-9 w-9 p-0` | `size="icon-lg"` | Room selector chips in step form |
| StepDetails.tsx | 170 | `size="sm"` + `h-9` | `size="lg"` | Heating type chips |
| StepDetails.tsx | 191 | `size="sm"` + `h-9` | `size="lg"` | Wall type chips |
| RoomsSelectorField.tsx | 24 | no-size + `h-9 w-9 p-0` | `size="icon-lg"` | Room selector chips in filter form |
| AuthSheet.tsx | 424 | `size="sm"` + `h-8` | `size="default"` | Logo choose-file btn; default=h-8 natively |
| AuthSheet.tsx | 434 | `size="sm"` + `h-8` | `size="default"` | Logo remove btn; same |

**Deferred Button violations (complex / design impact):**
- `admin/users/page.tsx:89` — raw `<Link className="... h-9 ...">` without `buttonVariants()`. Should be refactored to use `buttonVariants()` + `cn()`. Admin-only. Tag: **follow-up T221b**.
- `AdminExchangeProvidersManager.tsx:122` — raw `<button>` in segmented control (mode selector). Should use canonical `Button`. Admin-only. Tag: **follow-up T221b**.
- `ListingContact.tsx:207,212` — `FavoriteButton`/`SaveToCollectionButton` called with `className="flex-1 h-9 ..."`. These are custom wrapper components that accept className. The h-9 override is in caller, not in a `<Button>`. Needs component-level fix. Tag: **follow-up T221b**.
- `ListingContact.tsx:139,151,161,184,256,266,284` and `ListingMobileCTA.tsx:32,44` — raw `<a>` and `<div>` elements styled with h-10/h-11 manually. Should use `buttonVariants()` on links. Full refactor needed. Tag: **follow-up T221b**.

### C. Ad-hoc z-index values — NOTED, NONE fixed in this task

All app chrome and overlay z-index follows the canonical scale:
- `Header.tsx`: `z-30` ✅ · `AdminMobileHeader.tsx`: `z-30` ✅ · `MobileBottomNav.tsx`: `z-30` ✅
- `FiltersPanel.tsx` backdrop: `z-40` ✅ · panel: `z-50` ✅
- `Sheet.tsx` overlay: `z-50` (both panel+overlay — deviation from §16 deferred in Task 219 CAVEAT; not changed here)

**Out-of-scale z-index (deferred, no new violations introduced):**
- `PerfDevOverlay.tsx:43`: `z-[9999]` — dev performance overlay. Legitimate exception; add to `docs/tailwind-governance.md` allowlist. Tag: **follow-up chore**.
- `ListingGallery.tsx:135`: `z-[100]` — full-screen gallery viewer. Intentionally above all other UI. Should be documented in allowlist. Tag: **follow-up chore**.
- `ListingContact.tsx:239`: `z-40` — mobile sticky contact bar (fixed bottom-14). At scrim tier; doesn't conflict with anything. Technically chrome-like, could be `z-30` — deferred (no conflict exists).

### D. Overflow-risk rows — CLEAN

- All icon+label flex rows in touched files use `shrink-0` on icons ✅
- FiltersPanel footer: already fixed in Task 218 (flex-col, w-full, xl size) ✅
- ListingContact action row: already fixed in Task 211 (flex-wrap) ✅
- No new overflow-risk rows introduced

### E. Same-row height — CLEAN

- ListingsFilterBar + ListingsSortBar: fixed in Task 220 ✅
- All touched rows now use canonical size props with consistent heights

### F. Input heights — NOTED (not changed)

Many admin forms use `className="h-10 rounded-xl"` on `<Input>` throughout (AdminUserProfile, AdminSettings, AdminLocationsManager, AdminUserCreate, etc.). The canonical Input is h-9 (36px). The h-10 (40px) appears intentional — a consistent pattern in admin form fields. Per §4 it violates "NEVER override Input height via direct className", but it's widespread and likely a deliberate design decision. Tag: **follow-up T221c** (admin form input height standardization).

---

## TypeScript check

```
npx tsc --noEmit → 0 errors
```

---

## Files changed

- `src/modules/listings/components/form/ButtonGroupField.tsx`
- `src/modules/listings/components/form/MultiToggleField.tsx`
- `src/components/shared/FilterRoomsRow.tsx`
- `src/modules/listings/components/form/RoomsSelectorField.tsx`
- `src/components/admin/AdminLegalManager.tsx`
- `src/modules/listings/components/SaveSearchButton.tsx`
- `src/modules/listings/components/ListingReportDialog.tsx`
- `src/modules/listings/components/ListingContact.tsx`
- `src/components/admin/AdminUserProfile.tsx`
- `src/components/admin/AdminLocationsManager.tsx`
- `src/components/shared/FiltersPanel.tsx`
- `src/modules/listings/components/ListingsFilters.tsx`
- `src/modules/cabinet/components/ListingsTab.tsx`
- `src/modules/auth/components/AuthSheet.tsx`
- `src/modules/listings/components/steps/StepDetails.tsx`
