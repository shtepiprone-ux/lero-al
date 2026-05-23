# Task 224 — P0 HOTFIX: Signup email-confirmation link 404

**Date:** 2026-05-23  
**Status:** ✅ Complete  
**`tsc --noEmit`:** 0 errors

## Root cause (confirmed)

The Send Email Hook (Task 122, active ~2026-05-22) sends links via Supabase's
`/auth/v1/verify?token=<token_hash>&type=signup&redirect_to=...` endpoint. That endpoint consumes the
`token_hash` and redirects to `redirect_to` (`/auth/callback`) — but WITHOUT a `?code=` parameter.

`/auth/callback` only had the PKCE `if (code)` branch. On any miss it redirected to
`${origin}/auth/login` — a **non-localized path that doesn't exist** (login lives at
`/${locale}/auth/login`) → **404**.

Before Task 122 was active, Supabase's default email used a PKCE code link that `/auth/callback` handled.
That is why "it worked before".

## What changed

### `src/lib/auth/server.ts` — two new exports

- `verifyOtp({ token_hash, type })` — wraps `supabase.auth.verifyOtp`; used by `/auth/confirm`.
- `ensureUserProfile()` — extracted from `/auth/callback/route.ts` (was a local private function).
  Now shared between `/auth/callback` (OAuth) and `/auth/confirm` (token-hash). Idempotent.

### `src/app/auth/confirm/route.ts` — NEW

Token-hash confirmation route handler. Flow:
1. Reads `token_hash`, `type`, `next` from query params.
2. Validates `type` against allowed OTP types.
3. Calls `verifyOtp({ token_hash, type })` — works cross-device (no PKCE code_verifier cookie needed).
4. On success: calls `ensureUserProfile()` → redirects to `next`.
5. On failure: derives `locale` from `next` (`/(sq|en|uk|it)/` regex, fallback `'sq'`);
   redirects to `/${locale}/auth/login?error=auth_callback_failed`.

### `src/app/auth/callback/route.ts`

- Removed local `ensureUserProfile()` definition — now imported from `@/lib/auth/server`.
- Removed unused `getUser` and `createClient` imports (moved inside `ensureUserProfile`).
- Fixed non-localized fallback redirect: `${origin}/auth/login?...` →
  `${origin}/${locale}/auth/login?error=auth_callback_failed` (locale derived from `next` param).
- Purpose narrowed to **OAuth PKCE `?code=`** only; comment updated accordingly.

### `src/app/api/auth-email-hook/route.ts`

- Renamed `buildActionUrl` → `buildConfirmUrl`. New logic:
  - Derives `appOrigin` from `redirect_to` URL origin (fallback `NEXT_PUBLIC_SITE_URL`).
  - Extracts `next` from `redirect_to`'s `?next=` query param (e.g. `/sq/auth/verified`).
  - Returns `${appOrigin}/auth/confirm?token_hash=<hash>&type=<type>&next=<next>`.
- `email_change` case: kept pointing to Supabase's native `/auth/v1/verify` endpoint (see note below).
- `actionUrl` computed at top using `buildConfirmUrl` — used by signup/invite/recovery/magiclink.

## email_change: custom flow (NOT rerouted through /auth/confirm)

The cabinet uses a fully custom email-change flow:
- `initiateEmailChange()` → inserts into `email_change_tokens` table → sends email via `sendEmailChangeEmails`
  (not through Supabase's hook). Link format: `/${locale}/auth/confirm-email?token=<rawToken>`.
- `consumeEmailChangeToken()` → looks up `email_change_tokens` → calls `auth.admin.updateUserById()`.
- `auth.admin.updateUserById()` bypasses Supabase email confirmation — the hook's `email_change` event
  is NOT triggered in production.
- Decision: left `email_change` case in the hook pointing to Supabase's `auth/v1/verify` as a safety net.
  Rerouting it through `verifyOtp` would risk breaking the custom flow if Supabase ever does trigger it.

## Global Change Verification

- grep `redirect.*['"]/auth/login` → 0 matches (no non-localized redirects remain).
- grep `origin\}/auth/` → 0 matches (no bare `${origin}/auth/...` patterns remain).
- Every `/auth/login` redirect in the codebase uses `/${locale}/auth/login`.

## Owner infra steps (no app code)

1. Add `https://lero.al/auth/confirm` to the Supabase redirect-URL allowlist:
   Dashboard → Authentication → URL Configuration → Redirect URLs.
   (Already documented in `docs/env.md` → Redirect URLs section.)
2. Set `NEXT_PUBLIC_SITE_URL=https://lero.al` explicitly in Vercel environment variables.
   Currently absent — falls back to the hardcoded `'https://lero.al'` string, which is correct for
   production but wrong for staging/preview builds. Set per environment.
3. End-to-end verification: register a new account, open the confirmation email, click the link →
   user should be signed in and land on `/${locale}/auth/verified`. Test both same-browser AND
   a different browser (cross-device — that was the failing case before this fix).
   Also verify recovery + magic-link links after redeployment.

## Acceptance criteria check

- ✅ `/auth/confirm` route created with `verifyOtp` token-hash flow.
- ✅ Email hook's `buildConfirmUrl` points at `/auth/confirm` for signup/invite/recovery/magiclink.
- ✅ OAuth still uses `/auth/callback` (PKCE `?code=` flow unchanged).
- ✅ Every failure path is locale-aware (`/${locale}/auth/login?error=auth_callback_failed`).
- ✅ grep: zero non-localized `/auth/login` redirects.
- ✅ `tsc --noEmit`: 0 errors.
- ✅ Owner infra steps documented.
