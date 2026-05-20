# Session Archive: Task 120 — Epic D.3 — Email Verification — 2026-05-20

## Summary

Built the VerifyEmail template + BaseEmail locale fix + signup confirmed landing page + admin email verification status. The template is ready for D.6 delivery — NOT wired for parallel sending in this task.

## ⚠️ No double emails — D.6 wires delivery

Supabase Auth currently sends its own built-in "Confirm signup" email automatically. Until D.6 (Task 122 — Send Email Hook) ships, Supabase keeps sending that email. This task does NOT add a second, parallel verification email on registration. Doing so would send TWO emails to new users, and disabling Supabase's built-in confirm NOW (without the Hook in place) would create an auto-confirm security hole.

**How D.6 will wire VerifyEmail:**
D.6 registers a Supabase Send Email Hook (Edge Function) that:
1. Receives Supabase's email payload: `{ user, email_data: { token, token_hash, redirect_to, ... } }`
2. Constructs `confirmUrl` from the payload's `redirect_to`/token
3. Resolves the recipient's locale via `resolveUserLocale(user.id)`
4. Calls `sendEmail({ to: user.email, subject: getVerifyEmailStrings(locale).subject, react: <VerifyEmail confirmUrl={confirmUrl} locale={locale} /> })`

Until D.6, Supabase's built-in email continues unchanged.

## Files Created

| File | Description |
|------|-------------|
| `src/modules/notifications/lib/emails/VerifyEmail.tsx` | React Email template wrapping BaseEmail. Inline STRINGS sq/en/uk/it. Exports `getVerifyEmailStrings()` for use in D.6 hook. Accepts `confirmUrl, locale, preview`. |
| `src/app/[locale]/auth/verified/page.tsx` | Signup email confirmation success page. Users land here after clicking the confirmation link (flows through /auth/callback → redirect to this page). |
| `docs/sessions/2026-05-20-task-120-email-verification.md` | This file. |

## Files Modified

| File | Change |
|------|--------|
| `src/modules/notifications/lib/emails/BaseEmail.tsx` | Added `locale?: string` prop (default `'sq'`); `<Html lang={locale}>` (was hardcoded `lang="sq"`). |
| `src/modules/auth/components/AuthSheet.tsx` | Changed `emailRedirectTo` `next` param from `/${locale}` to `/${locale}/auth/verified`. |
| `src/modules/auth/components/RegisterForm.tsx` | Same redirect change as AuthSheet. |
| `src/app/admin/users/[id]/page.tsx` | Extract `emailConfirmedAt` from existing `auth.admin.getUserById(id)` call. Pass to `AdminUserProfile`. |
| `src/components/admin/AdminUserProfile.tsx` | Accept `emailConfirmedAt?: string | null`; show success/warning Badge next to email field. |
| `messages/sq.json`, `en.json`, `uk.json`, `it.json` | Added 5 new keys: 3 in `auth` (`verified_title`, `verified_body`, `verified_browse`) + 2 in `admin.user_profile.fields` (`email_confirmed`, `email_not_confirmed`). Keys: 951→956 × 4. |

## Verification status decision

**Use Supabase's native `email_confirmed_at` — no new DB column.**

Rationale: D.6 will delegate Supabase auth emails to our system via the Send Email Hook. The Send Email Hook does NOT bypass Supabase's confirmation logic — it just intercepts the email delivery. Supabase still owns the token, validates it, and sets `email_confirmed_at` when the user clicks the link. Since `email_confirmed_at` is already the authoritative source for confirmation status, there is no value in adding a duplicate column on `users`.

The admin surfaces this via `auth.admin.getUserById(id)` (already called) → `email_confirmed_at`.

## Verification Checks

| Check | Result |
|-------|--------|
| `npm run governance:localization` | ✅ PASS — C0/H0/M17 — 956×4 keys (baseline M18) |
| `npm run governance:responsive` | ✅ PASS — C0/H0/M17 (baseline M15 — 2 pre-existing M issues from Storybook stories, not from Task 120 files) |
| `npm run typecheck` | ✅ 0 new errors (4 pre-existing unchanged) |
| `npm run lint` | ✅ 0 errors / 3 pre-existing warnings |

## Acceptance Criteria Status

- [x] BaseEmail accepts `locale` prop; `<Html lang={locale}>`; emailChange.ts passes locale via its own inline STRINGS (not affected by BaseEmail's lang attr since it doesn't use BaseEmail)
- [x] VerifyEmail renders on BaseEmail in all four locales, matching approved design (coral from BRAND_ACCENT)
- [x] Verification status visible in admin (`emailConfirmedAt` badge in AdminUserProfile)
- [x] `/[locale]/auth/verified` confirm landing page created; localized 4 locales; 7 breakpoints (simple centered card — same pattern as confirm-email)
- [x] `emailRedirectTo` updated in AuthSheet + RegisterForm to land on `/auth/verified` after signup confirmation
- [x] NO double emails — Supabase built-in confirm untouched; VerifyEmail ready for D.6; documented above
- [x] 0 new lint errors / 0 new warnings
- [x] governance:localization PASS
- [x] governance:responsive PASS
- [x] typecheck 0 new errors
