# Session Archive: Task 108 — Epic B.1 — Side Popup Auth Flow — 2026-05-19

## Task 108 Summary

**Type:** Feature / UX redesign  
**Epic:** B — Auth, Registration & Agent Onboarding (B.1)

---

## Pre-Task Mandatory Checklist

- [x] No duplicate components — canonical `Sheet` from `@/components/ui/sheet`; `AuthSheet` is new, no existing equivalent
- [x] No hardcode — all strings via `t()`, server errors via Epic A error-code contract
- [x] Scope isolated — new file `AuthSheet.tsx` + modified `Header.tsx` + 4 locale files

---

## Architecture Decision

**Single `AuthSheet` instance** in `Header.tsx` controlled by `authOpen` + `authView` state. Three internal non-exported view functions:
- `LoginView` — login form + Google OAuth
- `RegisterView` (isAgent=false) — regular user registration
- `RegisterView` (isAgent=true) — agent registration (name, email, phone, company text field)

View switching happens inside the Sheet without closing it. The `initialView` prop syncs to internal `view` state via `useEffect([open, initialView])`.

---

## Error-Code Contract (Epic A)

`mapAuthError(message)` maps Supabase error strings to stable i18n keys:

| Supabase message (contains) | i18n key |
|---|---|
| "invalid login credentials" | `auth.error_invalid_credentials` |
| "already registered" / "already exists" | `auth.error_email_exists` |
| "password should be at least" | `auth.error_weak_password` |
| "email not confirmed" | `auth.error_email_not_confirmed` |
| "rate limit" / "too many" | `auth.error_rate_limit` |
| (fallback) | `auth.error_generic` |

---

## New i18n Keys

8 new keys × 4 locales = 32 entries. Key counts: 862 → 870 per locale.

**`auth` namespace (7 keys):**
- `register_agent` — "Register as agent" (Sheet title for agent view)
- `error_invalid_credentials` — wrong credentials
- `error_email_exists` — email taken
- `error_weak_password` — password too short
- `error_email_not_confirmed` — email not yet confirmed
- `error_rate_limit` — rate limited
- `error_generic` — generic fallback

**`nav` namespace (1 key):**
- `register_agent` — mobile drawer button label

---

## Entry Points

| Entry point | Location | Opens Sheet view |
|---|---|---|
| "Login" button | Header desktop + mobile drawer | `login` |
| "Register" button | Header desktop + mobile drawer | `register` |
| "Register as agent" button | Mobile drawer | `register-agent` |
| "Register as agent" link | Inside `register` view | `register-agent` (view switch) |
| "Login" link | Inside `register` / `register-agent` views | `login` (view switch) |
| "Register" link | Inside `login` view | `register` (view switch) |

---

## Post-Login / Post-Register Behavior

- **Login success:** `onClose()` + `router.refresh()` — stays on current page, header re-renders with user session
- **Register success:** Inline success state inside Sheet (CheckCircle + message), `onClose()` button
- **Google OAuth:** Redirects to Google → `/auth/callback` → back to site (Sheet state reset naturally)

---

## Sheet Configuration

- `side="right"` — anchored to the right edge (consistent with mobile hamburger drawer)
- `className="w-full sm:max-w-sm"` — full width on mobile, max 384px on desktop
- `overflow-y-auto` — scrollable content for long forms
- `showCloseButton` — default true (built-in X at top-right)
- `SheetHeader pr-12` — prevents title overlap with close button

---

## Agent Registration (Task 108 scope)

- Same `RegisterView` component with `isAgent=true`
- Shows `company` text field (company name, optional)
- City and company dropdown selectors are **NOT implemented** — deferred to Tasks 109 (city) and 110 (company with logo)
- No placeholder text or "coming soon" notice — the fields are simply absent (clean, minimal form)

---

## Files Changed

| File | Change |
|---|---|
| `src/modules/auth/components/AuthSheet.tsx` | **New** — Sheet + LoginView + RegisterView |
| `src/components/layout/Header.tsx` | Auth Link→Button; `authOpen`/`authView` state; `AuthSheet` mount |
| `messages/sq.json` | +7 auth keys, +1 nav key |
| `messages/en.json` | +7 auth keys, +1 nav key |
| `messages/uk.json` | +7 auth keys, +1 nav key |
| `messages/it.json` | +7 auth keys, +1 nav key |

Existing auth pages (`/auth/login`, `/auth/register`) remain as URL fallbacks — not primary flow.

---

## Breakpoint Matrix

| Breakpoint | Sheet behavior |
|-----------|----------------|
| 320px | Full-width sheet (`w-full`), scrollable |
| 375px | Full-width sheet |
| 390px | Full-width sheet |
| 640px+ (sm) | Slides in from right, `max-w-sm` (384px) |
| 768–2560px | Same as 640px+ |

---

## Validation

| Check | Result |
|-------|--------|
| Sheet (no raw div.fixed.inset-0) | ✅ canonical `Sheet` from `@/components/ui/sheet` |
| Login end-to-end (all 4 locales) | ✅ error-code contract + Google OAuth |
| Register end-to-end (all 4 locales) | ✅ success inline state |
| Register-agent form (all 4 locales) | ✅ name/email/phone/company fields |
| Errors via t() | ✅ `mapAuthError()` → i18n keys |
| Animation | ✅ Sheet built-in slide + opacity (base-ui) |
| `npm run lint` | ✅ 0 errors / 5 pre-existing warnings |
| `npm run governance:localization` | ✅ PASS C0/H0/M18 — 870 keys × 4 locales |
