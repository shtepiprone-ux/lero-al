# Task 363 — Phone Input numeric-only validation

**Date:** 2026-06-02  
**Executor:** Sonnet 4.6  
**Type:** bug (validation) — `PhoneField.tsx`, `lib/phone/index.ts`, `input.stories.tsx`, `messages/*.json`

---

## Summary

Phone field now blocks letters and symbols at two layers (defense in depth):

1. **Input-level filter** (`PhoneField.tsx`): every keystroke and paste is stripped to `[digits, spaces, dashes, parentheses, dots]` — the same set that `normalizeNational()` already handles. Letters, `+`, `@`, `#`, emojis, Cyrillic, etc. are removed before they appear in the field.

2. **Schema validation** (`lib/phone/index.ts`): `validateNationalPhone` step (c) now returns the specific `error_phone_digits_only` error key (was `error_phone_invalid`) when non-digit characters survive normalization. A dedicated "digits only" message is localized in all 4 locales.

---

## Root cause

`PhoneField.tsx` `handleNationalChange` previously set `national = e.target.value` without any filtering. Any character typed or pasted was accepted. Existing `validateNationalPhone` step (c) already rejected letters on submission but returned the generic `error_phone_invalid` key ("valid phone for country") instead of a specific "digits only" message.

---

## Consumer survey

| Consumer | Namespace for phone errors | Impact |
|---|---|---|
| `AuthSheet.tsx` | `auth` (`t(result.errorKey)`) | `auth.error_phone_digits_only` added ✓ |
| `ProfileTab.tsx` | `cabinet` (`t(r.errorKey)`) | `cabinet.error_phone_digits_only` added ✓ |
| `AdminUserCreate.tsx` | `admin.user_profile` (`t(`validation.${result.errorKey}`)`) | `admin.user_profile.validation.error_phone_digits_only` added ✓ |
| `AdminUserProfile.tsx` | `admin.user_profile` (same) | same ✓ |

No consumer needs to accept letters in the phone field — confirmed safe. No consumer file changed (the new key is a purely additive message key).

---

## Changes made

### `src/components/shared/PhoneField.tsx`

```tsx
function handleNationalChange(e: React.ChangeEvent<HTMLInputElement>) {
  // Strip everything that is not a digit or a standard phone formatting char.
  const raw = e.target.value.replace(/[^\d\s\-().]/g, '')
  setNational(raw)
  emit(dialCode, iso2, raw)
}
```

Allowed chars: `\d` (digits), `\s` (spaces), `\-` (dashes), `(` `)` (parentheses), `.` (dots).  
These match the chars that `normalizeNational()` strips — so any combo of formatting + digits will normalize correctly.  
`+` is NOT allowed in national input (it belongs in the dial-code slot; `validateNationalPhone` step (b) already catches it).

### `src/lib/phone/index.ts`

- `PhoneErrorKey` type: added `'error_phone_digits_only'`
- Step (c): `return { ok: false, errorKey: 'error_phone_invalid' }` → `return { ok: false, errorKey: 'error_phone_digits_only' }`

### `messages/{en,sq,uk,it}.json` — 3 locations × 4 locales = 12 insertions

Keys added in `auth`, `cabinet`, and `admin.user_profile.validation` namespaces:

| Locale | Value |
|---|---|
| en | `"Enter digits only — no letters or symbols."` |
| sq | `"Vendosni vetëm shifra — pa shkronja ose simbole."` |
| uk | `"Введіть лише цифри — без букв та символів."` |
| it | `"Inserire solo cifre — nessuna lettera o simbolo."` |

### `src/lib/phone/__tests__/phone.test.ts`

Updated "rejects national with letters" test to also assert `errorKey === 'error_phone_digits_only'`. Added 2 new tests:
- "rejects national with symbols → error_phone_digits_only" (`69@#456`)
- "rejects national with Cyrillic letters → error_phone_digits_only" (`69аб456`)

### `src/components/ui/input.stories.tsx`

Added `PhoneNumericValidation` scenario (§8b-compliant name):
- Shows valid state (digits only), error state (en), and error state (uk)
- Documents the filter regex, the errorKey, and the 3 namespaces in story description

---

## Note 20 — Before/after control inventory

### `PhoneField.tsx`
| Before | After |
|---|---|
| `handleNationalChange`: sets raw value as-is (letters accepted) | strips `[^\d\s\-().]` before setting (letters/symbols blocked) |
| Existing props, country-code Combobox, length validation | All unchanged ✓ |
| Error display (`{error && <p>...}`) | Unchanged ✓ |

### `lib/phone/index.ts`
| Before | After |
|---|---|
| `PhoneErrorKey`: 2 values | 3 values (+ `error_phone_digits_only`) |
| Step (c): returns `error_phone_invalid` for non-digits | returns `error_phone_digits_only` |
| All other steps, E.164 safety guard | Unchanged ✓ |

---

## Negative flow verification

| Branch | Handler in diff |
|---|---|
| Letter typed (`a`, `я`) | `replace(/[^\d\s\-().]/g, '')` strips on keystroke — never appears in field ✓ |
| Symbol typed (`@`, `#`, emoji) | Same filter ✓ |
| Paste mixed string `"+355 ab 6912"` | `+` stripped (not in allowed set); `a`, `b` stripped; result: `"355  6912"` — user sees cleaned value ✓ |
| Empty / required | Existing step (a) `error_phone_invalid` still fires ✓ |
| Too short / too long | libphonenumber-js step (e) still fires ✓ |
| Locale mismatch | Error key is in all 4 namespaces × 4 locales ✓ |
| Double-submit | No changes to submit guard ✓ |

---

## Validation outputs

### `npx tsc --noEmit`
```
(exit 0) ✅
```

### `npm run lint`
```
(exit 0) ✅
```

### `npm test` (vitest)
```
Test Files  15 passed (15)
     Tests  430 passed (430) ✅
```

### `npm run check:i18n`
```
✅ Parity PASSED — all 4 locale files have identical key sets (1437 keys). ✅
```

### `npm run build-storybook`
```
✓ built in 10.86s — exit 0 ✅
```

---

## Acceptance-criteria self-audit

| AC | Where verified | Result |
|---|---|---|
| AC1 — digit typed → accepted | `PhoneField.tsx` filter allows `\d` | ✅ |
| AC2 — letter/symbol → blocked + localized error | `PhoneField.tsx:76` filter + `lib/phone/index.ts:139` `error_phone_digits_only` | ✅ |
| AC3 — paste mixed string → sanitized | `PhoneField.tsx` filter on onChange (paste fires onChange) | ✅ |
| AC4 — valid all-digits phone → no error | Filter passes digits; step (c) passes `normalizeNational('691234567')` = `'691234567'` ✓ | ✅ |
| AC5 — error clears when value valid | Consumers re-validate on change; if error, passing value clears it (existing flow) | ✅ |
| Error key in sq/en/uk/it | `check:i18n` PASS 1437 keys (+3 new × 4 locales) | ✅ |
| Tests updated, passing | 430 tests PASS | ✅ |
| Existing phone rules preserved | All other `validateNationalPhone` steps unchanged; tests confirm | ✅ |
| No `git add`/`git commit` | — | ✅ |

---

## Rendered QA matrix (OWNER QA REQUIRED)

| Surface | 320 | 375 | 390 | 768 | Notes |
|---|---|---|---|---|---|
| `input.stories.tsx / PhoneNumericValidation` | OQR | OQR | OQR | OQR | Error message wrapping at 320 uk |
| PhoneField in AuthSheet (registration) | OQR | OQR | OQR | OQR | Type "abc" → nothing appears |
| PhoneField in ProfileTab (cabinet) | OQR | OQR | OQR | OQR | Paste "+355 ab 1234" → cleaned |

---

Self-validation: tsc=0 · lint=0 · tests=430 PASS · check:i18n=PASS 1437 keys · build-storybook=✅ · AC table=all green · scope=clean

---

## Files Changed

| File | Rationale |
|------|-----------|
| `src/components/shared/PhoneField.tsx` | `handleNationalChange`: strip `[^\d\s\-().]` on every keystroke/paste |
| `src/lib/phone/index.ts` | `PhoneErrorKey` + `'error_phone_digits_only'`; step (c) returns it |
| `src/lib/phone/__tests__/phone.test.ts` | Updated letters test + 2 new tests (symbols, Cyrillic) |
| `messages/en.json` | `error_phone_digits_only` in auth + cabinet + admin.user_profile.validation |
| `messages/sq.json` | Same |
| `messages/uk.json` | Same |
| `messages/it.json` | Same |
| `src/components/ui/input.stories.tsx` | `PhoneNumericValidation` scenario export |
| `docs/backlog.md` | Last Session updated |
| `docs/sessions/2026-06-02-task-363-phone-numeric-only-validation.md` | This session log |

*No `git add` / `git commit` issued. The ORCHESTRATOR (Opus) reviews the real diff and emits explicit-path commit commands.*
