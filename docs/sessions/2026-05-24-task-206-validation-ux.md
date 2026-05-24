# Task 206 — T.2: Required-field validation UX

**Date:** 2026-05-24  
**Epic:** T — Global UX Polish & Forms  
**Status:** ✅ Complete

## Scope

On submit, highlight empty required fields and scroll to the first invalid field.
Fixed two forms: `ListingFormShell` (main bug) and `AdminUserProfile` (non-registered fields).

## Changes

### ListingFormShell (`src/modules/listings/components/ListingFormShell.tsx`)

**Bug:** `window.scrollTo({ top: 0, behavior: 'smooth' })` always scrolled to page top instead of the first invalid field.

**Fix:**
- Added `id` prop to `SectionCard` local component
- Added `id="field-property_type"` to property type wrapper div
- Added `id="field-price"` to price wrapper div
- Added `id="field-details"` to Section 2 (Property Details) SectionCard — fallback for schema-declared required field errors
- Added `id="field-images"` to Section 3 (Photos) SectionCard
- Title input already had `id="title"` ✓
- New `scrollToFirstError(errs)` helper iterates in validation priority order (title → property_type → price → images → floor/details) and calls `element.scrollIntoView({ behavior: 'smooth', block: 'center' })`

### AdminUserProfile (`src/components/admin/AdminUserProfile.tsx`)

RHF's default `shouldFocusError: true` already handles `firstName` and `lastName` (they use `register()` and get a ref). Non-registered fields (`locationId`, `companyName`, `website`) need explicit scroll.

**Fix:**
- Added `id` prop to `SectionCard` local component
- `id="section-identity"` on basic info section
- `id="section-location"` on location section
- `id="section-business"` on company/business section
- Updated `handleSubmit(onSubmit)` button to `handleSubmit(onSubmit, errs => { ... })` — the `onInvalid` callback scrolls to the relevant section when only non-registered fields fail

## No new locale keys

All error messages already existed in the Zod schema (AdminUserProfile) and listing translation keys (ListingFormShell). No locale file changes required.

## Type-check

`tsc --noEmit` → 0 errors.

## Files changed

| File | Change |
|------|--------|
| `src/modules/listings/components/ListingFormShell.tsx` | `SectionCard` id prop; `scrollToFirstError` helper; field ids; replace `window.scrollTo` |
| `src/components/admin/AdminUserProfile.tsx` | `SectionCard` id prop; section ids; `onInvalid` callback on save button |
