# Session Archive: Task 112 — Epic B.2 — Agent City Selection — 2026-05-20

**Epic:** B — Auth, Registration & Agent Onboarding  
**Task:** 112 (global numbering)  
**Type:** Feature  
**Status:** ✅ CLOSED

---

## Goal

Add an optional city selector to the agent registration view in `AuthSheet` (when `isAgent=true`), using the canonical `LocationCombobox` component and the existing `useLocations` data source. Persist the selected city to the agent's profile on registration.

---

## Pre-Task Checklist

- ✅ No duplicate component — using existing `LocationCombobox` + `useLocations` hook
- ✅ No hardcode planned — 2 new i18n keys: `auth.city`, `auth.city_placeholder`
- ✅ Scope isolated: `AuthSheet.tsx` + 4 locale files; no other files touched

---

## Changes Made

### `src/modules/auth/components/AuthSheet.tsx`

1. Added imports: `useLocations` (hook), `LocationCombobox` (component)
2. Added `AgentCityField` sub-component — isolates `useLocations()` call so it only mounts when `isAgent=true`, avoiding unnecessary location fetches for non-agent registrations
3. Added `locationId: string` state to `RegisterView`
4. Added `AgentCityField` to the agent form UI (after phone, before company field)
5. Added `location_id: isAgent && locationId ? parseInt(locationId, 10) : undefined` to `signUp()` data payload — stored in Supabase auth metadata (`raw_user_meta_data`) for the DB trigger to pick up when creating the profile row

### `messages/{sq,en,uk,it}.json`

Added 2 keys to the `auth` namespace in all 4 locale files:

| Key | sq | en | uk | it |
|---|---|---|---|---|
| `city` | "Qyteti (opsional)" | "City (optional)" | "Місто (необов'язково)" | "Città (opzionale)" |
| `city_placeholder` | "Zgjidhni qytetin tuaj" | "Select your city" | "Оберіть ваше місто" | "Seleziona la tua città" |

---

## Key Decisions

### LocationCombobox vs Combobox
Used `LocationCombobox` (canonical location selector) rather than a generic `Combobox` because:
- Purpose-built for location selection with search/filter logic
- Uses `name_al` for Albanian-first display (canonical for this project)
- Has built-in `portal` prop for Sheet-nested use case

### portal={true}
`AuthSheet` uses `SheetContent` with `overflow-y-auto`. Without `portal`, the `LocationCombobox` dropdown would clip inside the Sheet. `portal={true}` renders the dropdown via `createPortal` into `document.body`, avoiding clipping — pattern from Task 93/98 fixes.

### Isolated AgentCityField sub-component
`useLocations()` fetches all locations on mount. Isolating it into `AgentCityField` ensures the fetch only happens when `isAgent=true` and the field is actually rendered. Non-agent registration forms never trigger the locations fetch.

### location_id persistence via signUp metadata
The city is passed as `location_id: parseInt(locationId, 10)` in the `signUp()` data payload. Supabase stores this in `auth.users.raw_user_meta_data`. The existing DB trigger reads this metadata when creating the profile row in `public.users`. This follows the same pattern as `user_type`, `company_name`, `phone` — fields already passed via this mechanism.

---

## Acceptance Criteria Checklist

- [x] Agent register view has optional city Combobox (canonical `LocationCombobox`)
- [x] City data from `useLocations()` → `getSearchableLocations()` — existing canonical source
- [x] City persists via `location_id` in `signUp` auth metadata; optional (registration succeeds without city)
- [x] Dropdown uses `portal={true}` — no clipping inside AuthSheet at any breakpoint
- [x] All 4 locales: label/placeholder via `t('city')` / `t('city_placeholder')` — 2 keys × 4 files
- [x] 0 new lint errors / 0 new warnings
- [x] `governance:localization` PASS (C0/H0/M18 at baseline)
- [x] `governance:primitives` PASS (C0/H57/M1 — no new violations)
- [ ] `npm run build` — user's manual step

## Out of Scope

- Agent company dropdown with logos (Task 113)
- Company logo upload rules (Task 114)
- Admin company management page (Task 115)
- Reworking AuthSheet overall structure (Task 108)
