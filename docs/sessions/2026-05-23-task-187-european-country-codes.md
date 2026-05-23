# Tasks 186+187 — O.1+O.2: Phone Consolidation Verified + European Country Codes

**Date:** 2026-05-23  
**Epic:** O — Auth, Registration & Phone Input  
**Status:** ✅ Complete

## Task 186 — O.1: Already complete (Task 158 / Sprint 4)

Pre-read verification confirmed all acceptance criteria already met:
- Only `type="tel"` in production code is inside `PhoneField.tsx` itself
- All editable phone/WhatsApp inputs (`AuthSheet`, `ProfileTab`, `AdminUserCreate`, `AdminUserProfile`) import and render `PhoneField`
- PhoneField docstring: *"Replaces four local copies"*
- `AdminSettings.tsx` `contact_phone` is a free-form config text field, not a user phone — out of scope

No code changes needed for Task 186.

## Task 187 — O.2: European country codes + searchable dropdown

### `src/lib/phone/index.ts`

`COUNTRY_CODES` expanded from 13 → 45 entries. All European/EU sovereign states added. Russia absent (product policy — comment added). US kept (Albanian diaspora). Albania remains first (default). Remaining entries sorted A-Z.

New entries added (32 countries):
Andorra, Austria, Belarus, Belgium, Bulgaria, Croatia, Cyprus, Czech Republic, Denmark, Estonia, Finland, Greece, Hungary, Iceland, Ireland, Kosovo (was already there), Latvia, Liechtenstein, Lithuania, Luxembourg, Malta, Moldova, Monaco, Netherlands, Norway, Poland, Portugal, Romania, Slovakia, Slovenia, Spain, Sweden, Switzerland.

Previously present and retained: Ukraine, Italy, UK, US, Germany, France, Turkey, Kosovo, Montenegro, Bosnia, Serbia, North Macedonia.

### `src/components/shared/Combobox.tsx`

Added `dropdownMinWidth?: number` prop (backward-compatible — defaults to undefined):
- **Portal mode:** `dropdownStyle.width = Math.max(rect.width, dropdownMinWidth ?? 0)` — dropdown is at least `dropdownMinWidth` px wide even when trigger is narrow
- **Non-portal mode:** `style={{ minWidth: dropdownMinWidth }}` applied to the dropdown div

### `src/components/shared/PhoneField.tsx`

Three changes to enable searchable country selection:
1. `variant="button"` → `variant="input"` — enables live filtering as the user types
2. `description: c.label` added to each option — Combobox filters on both `label` ("🇦🇱 +355") and `description` ("Albania")
3. `dropdownMinWidth={200}` — widens the dropdown from the 90px trigger width to 200px so country names are legible

## Verification
- `tsc --noEmit` → 0 errors
- `grep "Russia\|iso2.*RU" src/lib/phone/index.ts` → only the exclusion comment (no entry)
- 45 country entries: Albania first, 44 more sorted A-Z
- `grep 'variant="button"' src/components/shared/PhoneField.tsx` → no match (changed to input)
