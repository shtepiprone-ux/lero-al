# Task 188 — O.3: Client-Side Validation for Email / Password / Phone / WhatsApp

**Date:** 2026-05-23  
**Epic:** O — Auth, Registration & Phone Input  
**Status:** ✅ Complete

## Inventory — surfaces audited

| Surface | Email | Password | Phone | WhatsApp |
|---|---|---|---|---|
| AuthSheet/RegisterView | ✅ EMAIL_RE + error_email_invalid | ✅ length < 6 | ✅ country-aware (optional) | — |
| AuthSheet/LoginView | **gap** → added | **gap** → added | — | — |
| AuthSheet/ForgotPasswordView | browser `type="email"` only (intentional: neutral success) | — | — | — |
| ResetPasswordClient | — | ✅ min-8 + mismatch | — | — |
| ProfileTab/handleEmailChange | **gap** → added | — | ✅ country-aware | ✅ country-aware |
| AdminUserCreate | ✅ Zod `z.string().email()` | — | ✅ country-aware in onSubmit | ✅ country-aware in onSubmit |
| AdminUserProfile | — (no email field) | — | ✅ country-aware in onSubmit | ✅ country-aware in onSubmit |

## Changes

### `src/modules/auth/components/AuthSheet.tsx` — LoginView

Added client-side guards before `signIn()` to avoid unnecessary server round-trips:

```tsx
// Before:
setLoading(true)
setErrorKey(null)
const { error } = await signIn(email, password)

// After:
setErrorKey(null)
if (!email.trim() || !EMAIL_RE.test(email)) { setErrorKey('error_email_invalid'); return }
if (!password) { setErrorKey('error_weak_password'); return }
setLoading(true)
const { error } = await signIn(email, password)
```

`EMAIL_RE` is the module-level regex already used by RegisterView (line 488 in the original file).

### `src/modules/cabinet/components/ProfileTab.tsx`

Added `EMAIL_RE` module-level constant and format check in `handleEmailChange`:

```tsx
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// handleEmailChange — before:
if (!newEmail.trim()) return
setEmailChangeStatus('sending')

// After:
if (!newEmail.trim()) return
if (!EMAIL_RE.test(newEmail.trim())) { setEmailError(t('error_email_invalid')); return }
setEmailChangeStatus('sending')
```

Uses `t('error_email_invalid')` from the `cabinet` namespace (newly added).

### Locale files — `cabinet` namespace gap fixed

ProfileTab uses `useTranslations('cabinet')` and called `t(r.errorKey)` for phone validation errors, but `error_phone_invalid` and `error_phone_no_country_code` were absent from the `cabinet` namespace in all 4 locales. Added to all 4 files:

| Key | sq | en | uk | it |
|---|---|---|---|---|
| `error_phone_invalid` | Ju lutemi vendosni... | Please enter a valid... | Введіть коректний... | Inserisci un numero... |
| `error_phone_no_country_code` | Vendosni numrin... | Enter the phone number... | Введіть номер... | Inserisci il numero... |
| `error_email_invalid` | Adresa e emailit... | Please enter a valid email... | Введіть коректну... | Inserisci un indirizzo... |

Values are identical to the same keys already present in the `auth` namespace.

## Verification

- `tsc --noEmit` → 0 errors
- `grep error_email_invalid AuthSheet.tsx` → line 71 (LoginView) + line 524 (RegisterView existing)
- `cabinet.error_phone_invalid` present at line 490 in en.json (and equivalents in sq/uk/it)
- ForgotPasswordView intentionally left without JS email validation (neutral-success pattern must not hint whether address exists)
