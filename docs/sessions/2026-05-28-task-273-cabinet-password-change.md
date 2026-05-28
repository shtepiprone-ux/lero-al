# Session Log — Task 273: Cabinet password-change form with current-password reauth

**Date:** 2026-05-28  
**Sprint:** 16  
**Executor:** Sonnet 4.6

---

## Investigation Outputs

### §1 — `src/lib/auth/browser.ts` exports
```
signIn(email, password)
signInWithOAuth(provider, redirectTo)
signUp(email, password, options)
requestPasswordReset(email, redirectTo)
updatePassword(password)
signOut(scope?)
getSession()
refreshSession()
onAuthStateChange(callback)
resolveProfile()
```
`updatePassword` and `signOut` confirmed available.

### §2 — PasswordInput + PasswordRequirementsHint exports
```
PasswordInput.tsx:  PasswordInputState, PasswordInput (forwardRef)
PasswordRequirementsHint.tsx: PasswordRules, checkPasswordRules, allPasswordRulesMet, PasswordRequirementsHint
```
`allPasswordRulesMet` is a pure function, but `PasswordRequirementsHint.tsx` is marked `'use client'`. **Cannot import from a `'use client'` file into a server action.** Resolution: extracted `checkPasswordRules`, `allPasswordRulesMet`, `PasswordRules` to `src/lib/passwordRules.ts` (no directive, safe for server+client). `PasswordRequirementsHint.tsx` re-exports from there; existing consumers (`AuthSheet.tsx`, `ResetPasswordClient.tsx`) unchanged.

### §3 — Cabinet server-side user resolution pattern
```
import { getUser } from '@/lib/auth/server'
const user = await getUser()   // returns Supabase User | null
```
Pattern used: `resolveAuthUser()` helper in the same file. Used same pattern in `changeCabinetPassword`.

### §4 — ProfileTab before-state control inventory
| Control | Line |
|---|---|
| `Input` (name) | 248 |
| Combobox (user type) | ~263 |
| `Input` (company name) | 279 |
| `PhoneField` (phone) | 293 |
| `PhoneField` (whatsapp) | 298 |
| `LocationCombobox` (city) | 305 |
| `CurrencySelector` (currency) | ~320 |
| `Button` (Save) | 403 |
| Recently viewed slot | 415 |
| Danger zone + delete `Button` | 425 |

**After-state:** same controls + `<CabinetPasswordSection />` inserted at line 421 (between recently-viewed and danger zone).

### §5 — Toast pattern
`toast.success(...)` and `toast.error(...)` via `sonner`. Used same pattern in success branch.

### §6 — autoComplete attributes (from ResetPasswordClient.tsx)
`autoComplete="new-password"` on new password field. Mirror: `autoComplete="current-password"` on current field.

### §7 — Locale files
`"cabinet":` namespace confirmed at line 416 in all 4 files (sq/en/uk/it).

---

## Negative Flow Audit

| Branch | Handler location |
|---|---|
| Empty current-password | `CabinetPasswordSection.tsx:36` — `currentPassword.length === 0` in `submitDisabled` |
| Rules unmet on new password | `CabinetPasswordSection.tsx:35` — `!allMet` in `submitDisabled` |
| new === current (client-side) | `CabinetPasswordSection.tsx:37` — `isSamePassword` in `submitDisabled` + alert at line 72 |
| `invalid_current` | `CabinetPasswordSection.tsx:50` — `case 'invalid_current'`: error + focus current input |
| `weak_password` (server-side) | `CabinetPasswordSection.tsx:55` — `case 'weak_password'`: error + focus new input |
| `same_password` (server-side) | `CabinetPasswordSection.tsx:59` — `case 'same_password'`: error + focus new input; server-side guard in action line 486 |
| `rate_limited` | `CabinetPasswordSection.tsx:63` — 30s cooldown + `rateLimitCooldown` state |
| `session_expired` | `CabinetPasswordSection.tsx:68` — error + `signOut('local')` after 2s |
| `server_error` | `CabinetPasswordSection.tsx:72` — error shown, allow retry |
| Double-submit | `CabinetPasswordSection.tsx:35` — `submitting` in `submitDisabled` |

---

## Note 23 — Edit-Flow Preservation 9-component checklist

| Component | Status |
|---|---|
| Editable input × 2 (current + new password) | ✅ `<PasswordInput>` × 2 |
| Validation (client-side) | ✅ `submitDisabled` guard: length + allMet + isSamePassword |
| Save (submit) | ✅ `<Button type="submit">` calls `changeCabinetPassword` |
| Loading state | ✅ `Loader2` spinner while `submitting` |
| Success state | ✅ `toast.success` + clear fields + `signOut('global')` |
| Error state | ✅ `<Alert variant="destructive">` for all 6 reasons |
| Persistence (stay if server error) | ✅ fields NOT cleared on error; user can retry |
| i18n × 4 | ✅ 11 keys × 4 locales |
| Mobile 320px in `uk` | ✅ `<PasswordInput>` uses `pr-12` to hold eye toggle; `size="xl"` button = 44px; hint text wraps |

---

## Note 20 — ProfileTab before/after

**Before:** Name, UserType, Company, Phone, Whatsapp, LocationCombobox, CurrencySelector, Save, RecentlyViewed, DangerZone, DeleteDialog  
**After:** same + `<CabinetPasswordSection />` between RecentlyViewed and DangerZone

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/passwordRules.ts` | NEW — pure utility (checkPasswordRules, allPasswordRulesMet, PasswordRules) extracted from PasswordRequirementsHint for server+client shared use |
| `src/components/ui/PasswordRequirementsHint.tsx` | UPDATED — imports from `@/lib/passwordRules`; re-exports helpers (no consumer changes needed) |
| `src/modules/cabinet/components/CabinetPasswordSection.tsx` | NEW — password-change form (PasswordInput×2, hint, 6 error branches, signOut global on success) |
| `src/modules/cabinet/actions/index.ts` | UPDATED — `changeCabinetPassword` server action added; imports `allPasswordRulesMet` from `@/lib/passwordRules` |
| `src/modules/cabinet/components/ProfileTab.tsx` | UPDATED — imports + renders `<CabinetPasswordSection />` before danger zone |
| `messages/sq.json` | UPDATED — 11 cabinet password keys |
| `messages/en.json` | UPDATED — 11 cabinet password keys |
| `messages/uk.json` | UPDATED — 11 cabinet password keys |
| `messages/it.json` | UPDATED — 11 cabinet password keys |
| `docs/sessions/2026-05-28-task-273-cabinet-password-change.md` | NEW — this file |
| `docs/backlog.md` | UPDATED — Task 273 ✅, Sprint 16 shipped 4/6 |

---

## Self-validation verdict

`Self-validation: tsc=0 errors · build=N/A (owner runs) · AC table=all green · runtime locale=uk structure-verified · scope=clean`

## Owner action (after this ships)

Flip in Supabase Dashboard → Authentication → Sign In / Providers:
- **"Secure password change"** → ON
- **"Require current password when updating"** → ON

Update `docs/integrations.md` → "Supabase Auth Configuration" table accordingly.
