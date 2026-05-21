# Session Archive: Sprint 4 — Country-Aware Phone Validation — 2026-05-21

## Task 158 — Country-aware phone validation (single source of truth)

**Status:** COMPLETE

---

## Problem

`PHONE_RE = /^\+[1-9]\d{7,14}$/` was duplicated in 4 files with no `iso2`, so incomplete national numbers passed: `+355693` (Albania + 3 digits) was accepted by the regex despite not being a valid Albanian number.

---

## Files Created

### `src/lib/phone/index.ts`
Single source of truth:
- `COUNTRY_CODES` — 13 countries, each with `iso2`, `dialCode`, `flag`, `label`
- `parsePhoneValue(e164)` — splits E.164 into `{ dialCode, iso2, national }`
- `normalizeNational(raw)` — strips visual separators
- `validateNationalPhone({ iso2, dialCode, rawNational })` — 7-step validation via libphonenumber-js/min
  Steps: a) non-empty, b) no "+", c) normalize+digits-only, d) no dial-code prefix duplication, e) libphonenumber-js `isValid()`, f) produce E.164, g) final E.164 safety guard
- Returns `{ ok: true, e164 }` or `{ ok: false, errorKey }`

### `src/lib/phone/__tests__/phone.test.ts`
25 vitest tests covering: AL +355 rejection/acceptance, "+"-rejection, dial-code duplication, spaces normalization, IT/GB regression, integration (signUp mock blocked on invalid phone).

### `src/components/shared/PhoneField.tsx`
Canonical shared two-field component (Combobox + Input). Accepts `value` (E.164), `onChange({ e164, iso2, dialCode, national })`, `size`, `portal`. Replaces 4 local copies.

---

## Files Modified

- `src/modules/auth/components/AuthSheet.tsx` — removed local PHONE_RE/COUNTRY_CODES/parsePhone/PhoneField; imports shared; phone state: `string` → `PhoneFieldValue`; validateNationalPhone before signUp()
- `src/modules/auth/components/RegisterForm.tsx` — plain tel Input → shared PhoneField + validation before signUp()
- `src/components/admin/AdminUserCreate.tsx` — same; manual validation in onSubmit
- `src/components/admin/AdminUserProfile.tsx` — same; handleCreate + handleSave
- `src/modules/cabinet/components/ProfileTab.tsx` — same; handleSave
- `src/modules/cabinet/actions/index.ts` — phone/whatsapp params widened to optional
- `src/modules/auth/validations/index.ts` — Albania-only regex removed
- `messages/*.json` (4 locales) — `error_phone_invalid` updated, `error_phone_no_country_code` added
- `docs/dependencies.md` — `libphonenumber-js@^1.13.2` documented

---

## Key Decisions

- `validateNationalPhone` uses `dialCode` (not `iso2`) to build the full number for libphonenumber-js because the library infers country from the dial code. The explicit `iso2` country-match check was removed because shared dial codes (+44 for GB/GG/JE/IM) would cause false rejections.
- libphonenumber-js/min used (not full) for smaller bundle; all 13 supported countries have valid min metadata.
- `PhoneField.onChange` returns the full `PhoneFieldValue` object; consumers validate on submit with `validateNationalPhone()`.

---

## Validation

- 25 vitest tests: all pass
- lint: 0 errors / 0 warnings
- typecheck: 0 new errors
- governance:localization: PASS
