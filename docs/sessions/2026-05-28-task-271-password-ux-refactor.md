# Session Log — Task 271: Password UX refactor

**Date:** 2026-05-28  
**Sprint:** 16  
**Executor:** Sonnet 4.6

---

## Investigation §1 — Password input inventory

BEFORE diff grep: `grep -rn 'type="password"' src/`

| File path | Surface | Has confirm field? | Has show/hide? | Has hint today? |
|---|---|---|---|---|
| `src/modules/auth/components/AuthSheet.tsx:125` | Login | No | No | No |
| `src/modules/auth/components/AuthSheet.tsx:648` | Signup (RegisterView, also agent) | No | No | No |
| `src/modules/auth/components/ResetPasswordClient.tsx:143` | Set-new-password (reset) | Yes (line 157) | No | No |
| `src/components/admin/AdminExchangeProvidersManager.tsx:100` | Admin API key field (non-auth) | No | No | N/A |

**Cabinet password-change form:** DOES NOT EXIST. The `ProfileTab.tsx` and `CabinetShell.tsx` have no password input. The "Cabinet reauth form for password change" is a separate Sprint 16 candidate task not yet filed. Nothing to update in cabinet module.

**AdminUserCreate.tsx:** Has a static `PasswordRequirements` info box (static static text, no input) — email-invite flow, no password INPUT. Not affected.

AFTER diff grep: `grep -rn 'type="password"' src/` → returns ONLY `PasswordInput.tsx` (internal toggle). ✅

---

## Investigation §2 — Confirm-password removal inventory

BEFORE: `grep -rn "confirmPassword\|confirm_password\|passwordConfirm" src/` → 0 hits (no camelCase confirm pattern existed).

The confirm field existed in `ResetPasswordClient.tsx` as a plain `const [confirm, setConfirm]` variable:
- `const [confirm, setConfirm] = useState('')` — removed
- Mismatch check `if (password !== confirm)` — removed
- UI confirm field block (lines 153–164) — removed
- Client-side `password.length < 8` pre-check — removed (replaced by disabled CTA gate)

**Locale keys removed:**
- `auth.reset_password_confirm_label` (×4 locales)
- `auth.reset_password_error_mismatch` (×4 locales)
- `auth.reset_password_error_weak` (×4 locales) — client-side check removed; server-side `mapAuthError` still uses the key, so key kept in messages but no longer rendered as a standalone error in reset flow

Wait — re-check: `reset_password_error_weak` is also used in `mapAuthError` (server error mapping in AuthSheet.tsx). I kept it in messages but removed the client-side setter. The locale key stays.

**Final locale removals (×4): `reset_password_confirm_label`, `reset_password_error_mismatch`** — 2 keys × 4 = 8 keys removed.

AFTER: `grep -rn "confirmPassword\|confirm_password\|passwordConfirm" src/` → 0 hits. ✅

---

## Investigation §3 — Canonical `<Input>` inspection

`src/components/ui/input.tsx` — wraps `@base-ui/react/input`. Accepts `React.ComponentProps<"input">` including `ref`, `className`, all standard `<input>` props. Has built-in `aria-invalid:border-destructive ring-2 ring-destructive/20` for error state. `<PasswordInput>` wraps this and adds `pr-12` + dynamic border/ring classes for error/success states.

---

## Investigation §4 — i18n namespace decision

Grep evidence:
- `useTranslations('auth')` — used in all auth components (LoginView, ForgotPasswordView, RegisterView, ResetPasswordClient)
- `useTranslations('common')` — has ARIA label keys (`aria_prev`, `aria_next`, etc.)

**Decision:**
- Eye-toggle aria-labels → `common` namespace: `common.show_password`, `common.hide_password`
- Password rule labels + error text → `auth` namespace: `auth.password_rule_*`, `auth.password_requirements_error`

---

## Investigation §5 — Component category decision

Ran `npm run catalog:components`. Both new components classified as **CANONICAL** with stories:
- `PasswordInput` → `src/components/ui/PasswordInput.tsx` — CANONICAL ✅ story ✅ i18n (common namespace for toggle labels)
- `PasswordRequirementsHint` → `src/components/ui/PasswordRequirementsHint.tsx` — CANONICAL ✅ story ✅ i18n (auth namespace for rule labels)

---

## Investigation §6 — Supabase dashboard config snapshot

From `docs/integrations.md` → "Supabase Auth Configuration (Dashboard settings — owner-set, 2026-05-28)":

| Setting | Value |
|---|---|
| Minimum password length | 8 |
| Password requirements | **Lowercase + uppercase + digits + symbols (Supabase "recommended")** |

This maps exactly to the 5 hint rules:
1. At least 8 characters → `value.length >= 8`
2. One uppercase letter → `/[A-Z]/.test(value)`
3. One lowercase letter → `/[a-z]/.test(value)`
4. One number → `/[0-9]/.test(value)`
5. One special character (!@#$%*=) → `/[!@#$%*=]/.test(value)`

Dashboard config NOT modified. ✅

---

## Locale keys added (×4: sq/en/uk/it)

**`auth` namespace (×6 new, ×2 removed):**
- Added: `password_requirements_error`, `password_rule_length`, `password_rule_uppercase`, `password_rule_lowercase`, `password_rule_digit`, `password_rule_special`
- Removed: `reset_password_confirm_label`, `reset_password_error_mismatch`

**`common` namespace (×2 new):**
- Added: `show_password`, `hide_password`

Total net: +8 new keys × 4 locales = 32 additions; −2 keys × 4 locales = 8 removals.

---

## AC Self-audit table (Note 18)

| AC | Status |
|---|---|
| `<PasswordInput>` created with eye toggle (44×44, localized aria-label, lucide) | ✅ |
| `<PasswordRequirementsHint>` created with 5 live indicators matching design reference | ✅ |
| All `<Input type="password">` migrated; after-grep returns only `PasswordInput.tsx` | ✅ |
| All confirm-password fields removed; after-grep returns 0 hits | ✅ |
| Hint rendered on signup + set-new-password; NOT on login / forgot-password request | ✅ |
| CTA disabled while ≥1 rule unmet on CREATE/CHANGE/RESET surfaces | ✅ |
| ×4 locale keys in same key set | ✅ |
| 7 breakpoints render correctly (structure verified; no runtime browser available) | ✅ (structure) |
| Storybook stories for `PasswordInput` and `PasswordRequirementsHint` | ✅ |
| Catalog updated; MANUAL_REVIEW clean | ✅ |
| `npm run governance:tailwind` clean (H:0) | ✅ (also fixed pre-existing H:6 in AdminPermissionsManager) |
| `npm run governance:components` clean | ✅ |
| `npx tsc --noEmit` → 0 errors | ✅ |
| `docs/backlog.md` updated | ✅ |
| Cabinet password-change form N/A (not yet implemented) | ✅ documented |
| Admin create-user form N/A (email-invite, no password input) | ✅ documented |
| Supabase Auth dashboard config NOT modified | ✅ |

---

## Files Changed

| File | Change |
|---|---|
| `src/components/ui/PasswordInput.tsx` | NEW — canonical eye-toggle primitive |
| `src/components/ui/PasswordRequirementsHint.tsx` | NEW — 5-rule live hint + exported helpers |
| `src/components/ui/PasswordInput.stories.tsx` | NEW — Storybook stories (idle/error/success/mobile/hint) |
| `src/components/ui/PasswordRequirementsHint.stories.tsx` | NEW — Storybook stories (idle/partial/allMet/uk-320px) |
| `src/modules/auth/components/ResetPasswordClient.tsx` | REPLACE confirm field → PasswordInput + hint; disable CTA |
| `src/modules/auth/components/AuthSheet.tsx` | REPLACE login + signup password inputs; add hint + disable state to signup |
| `src/components/admin/AdminExchangeProvidersManager.tsx` | REPLACE API key password input with PasswordInput |
| `src/components/admin/AdminPermissionsManager.tsx` | FIX pre-existing governance violation: text-green-600 → text-status-success, text-amber-500 → text-status-warning (H:6→H:0) |
| `messages/sq.json` | +6 auth keys, +2 common keys, −2 auth keys |
| `messages/en.json` | +6 auth keys, +2 common keys, −2 auth keys |
| `messages/uk.json` | +6 auth keys, +2 common keys, −2 auth keys |
| `messages/it.json` | +6 auth keys, +2 common keys, −2 auth keys |
| `docs/component-catalog.md` | auto-updated by `npm run catalog:components` |
| `docs/component-coverage-matrix.md` | auto-updated |
| `docs/component-risk-register.md` | auto-updated |
| `docs/sessions/2026-05-28-task-271-password-ux-refactor.md` | NEW — this file |
| `docs/backlog.md` | Sprint 16 Task 271 ✅, Last Session updated |

---

## Self-validation verdict

`Self-validation: tsc=0 errors · governance:tailwind=PASS(H:0) · governance:components=PASS · catalog=2 CANONICAL · AC table=all green · runtime locale=uk structure verified · scope=clean`
