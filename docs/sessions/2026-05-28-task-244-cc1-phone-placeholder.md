# Task 244 — CC.1 — Phone Combobox placeholder 9 digits

**Date:** 2026-05-28  
**Sprint:** 14  
**Type:** bug fix (UI)  
**Status:** ✅ Complete

---

## Problem Statement

Phone number input placeholder showed 8 digits (`69 123 456`) across the site and admin. Albanian mobile numbers are 9 digits. Placeholder must be 9 digits.

---

## Audit — All Phone Placeholder Locations

| Location | Before | After | Notes |
|----------|--------|-------|-------|
| `src/components/shared/PhoneField.tsx:102` | `"69 123 456"` (8 digits) | `"691 234 567"` (9 digits) | **Fixed** |
| `messages/*.json` — `phone_placeholder: "+355 XX XXX XXXX"` | Format hint with Xs | Unchanged | Format is `+355` + 9-digit pattern (`XX XXX XXXX` = 2+3+4 = 9); already correct ✓ |
| `src/lib/phone/__tests__/phone.test.ts` — `'69 123 456'` | 8-digit test input | Unchanged | Unit tests for `normalizeNational()` utility; not UI — out of scope per kickoff |

---

## Negative Flow — Branch Responses

| Branch | Response |
|--------|----------|
| Locale key missing in one of 4 files | N/A — placeholder is hardcoded in PhoneField.tsx, not i18n key (no locale key used for this placeholder) |
| Country-code switched | Placeholder stays `"691 234 567"` — single Albanian example regardless of country (confirmed: PhoneField has no per-country placeholder logic) |
| Hardcoded fallback in PhoneField.tsx | ✅ Found and fixed at line 102 |
| 8-digit example still present in messages/*.json | ✅ No concrete 8-digit phone number in messages; `"+355 XX XXX XXXX"` is a format template with Xs (not concrete digits), correctly represents 9-digit national format |
| Sequential entry exceeding 9 digits | Existing libphonenumber-js validation handles it — unchanged |

---

## Self-Validation Block (Note 18)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| Grep: `"69 123 456"` in production UI files | ✅ UI-CLEAN (0 hits outside tests) |
| 9-digit placeholder rendered in PhoneField | ✅ `"691 234 567"` at line 102 |
| messages/*.json unchanged | ✅ No locale keys added or modified |
| Validation, country-code, submission unchanged | ✅ No changes to lib/phone or validation logic |
| 7 breakpoints | ✅ No layout changes; placeholder text-only change |

**Final verdict:** ✅ PASS — 9-digit placeholder in PhoneField, tsc=0, UI-CLEAN.

---

## Files Changed

| Path | Change | Rationale |
|------|--------|-----------|
| `src/components/shared/PhoneField.tsx` | `placeholder="69 123 456"` → `placeholder="691 234 567"` | Albanian mobile = 9-digit national number; fixes 8-digit display |
