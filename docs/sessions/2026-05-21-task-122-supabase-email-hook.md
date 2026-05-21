# Session Archive: Epic D.6 — Delegate Supabase Auth Emails via Send Email Hook — 2026-05-21

## Task 122 — Epic D.6 — Supabase Send Email Hook

**Status:** COMPLETE (code shipped; owner must register hook in Supabase Dashboard)
**Dependencies satisfied:** Task 119 (send helper) + Task 120 (VerifyEmail) + Task 121 (RecoveryEmail) all on main.

---

## Pre-Task Mandatory Checklist

1. **No duplicate components** — no existing `auth-email-hook` route; no `MagicLinkEmail.tsx` or `ReauthEmail.tsx` files.
2. **No hardcode planned** — all email strings inline (sq/en/uk/it); hook secret from env var.
3. **Scope isolated** — files created: route.ts, MagicLinkEmail.tsx, ReauthEmail.tsx, session log. Files updated: env.md, integrations.md, backlog.md.

---

## Architecture Decision: Option B — Next.js API Route

**Chosen:** Option B — `POST /api/auth-email-hook` (Next.js route on Vercel).

**Rejected:** Option A — Supabase Edge Function.

**Justification:**
- App deploys to Vercel; no `supabase/functions/` infrastructure exists in the repo (confirmed in Epic D plan).
- Project already has 9 API routes following the same pattern.
- Avoids Supabase CLI setup, separate Edge Function deployment pipeline, and managing a second deploy target.
- Secret management stays in Vercel env vars, consistent with all other secrets in the project.
- `resolveUserLocale` uses the service-role Supabase client, which is already available in Next.js server context.

---

## Files Created

### `src/app/api/auth-email-hook/route.ts`
Main hook handler. Responsibilities:
- Reads raw request body as text (required for HMAC verification before JSON parsing).
- Verifies HMAC-SHA256 signature from `x-supabase-signature` header against `SUPABASE_EMAIL_HOOK_SECRET`.
- Parses `HookPayload` (user + email_data).
- Resolves recipient locale via `resolveUserLocale(user.id)`.
- Builds action URL: `{SUPABASE_URL}/auth/v1/verify?token={token_hash}&type={email_action_type}&redirect_to={redirect_to}`.
- Maps `email_action_type` to template and sends via canonical `sendEmail()`.
- Returns `{}` on success (required by Supabase).

**Action-type map:**
| `email_action_type` | Template | Recipient |
|---|---|---|
| `signup` | VerifyEmail | `user.email` |
| `invite` | VerifyEmail | `user.email` |
| `recovery` | RecoveryEmail | `user.email` |
| `magiclink` | MagicLinkEmail | `user.email` |
| `email_change` | inline HTML (emailChange.ts pattern) | `user.new_email ?? user.email` |
| `reauthentication` | ReauthEmail (OTP display) | `user.email` |
| unknown | logs warning, returns 200 | — |

### `src/modules/notifications/lib/emails/MagicLinkEmail.tsx`
React Email template for passwordless sign-in ("magic link"). Same structure as VerifyEmail:
- CTA link button → `signInUrl`
- Fallback URL text block
- Inline STRINGS sq/en/uk/it
- Wraps BaseEmail

### `src/modules/notifications/lib/emails/ReauthEmail.tsx`
React Email template for reauthentication OTP codes. Different from link-based templates:
- No CTA button — shows OTP code prominently in a monospace code block (coral color, centered)
- Inline STRINGS sq/en/uk/it
- Wraps BaseEmail
- `otp` prop takes `email_data.token` (the 6-digit code Supabase generates)

---

## Files Updated

### `docs/env.md`
Added: `SUPABASE_EMAIL_HOOK_SECRET` — the shared secret for HMAC-SHA256 signature verification.

### `docs/integrations.md`
Updated "Supabase Auth emails — delegation" section to reflect:
- Architecture decision (Option B, Next.js route)
- Hook endpoint URL
- Security model (HMAC-SHA256)
- Action-type → template map table
- Action URL format
- Owner registration steps (manual dashboard steps)
- Verification procedure (test sign-up → confirm 1 email arrives, not 2)
- Note on email_change coexistence with our cabinet flow

---

## Security Notes

- **Signature verification:** `createHmac('sha256', secret).update(rawBody).digest('hex')` compared with `timingSafeEqual` to prevent timing attacks. Strips `sha256=` prefix if present (matches both raw hex and GitHub-style formats).
- **Secret not set:** if `SUPABASE_EMAIL_HOOK_SECRET` is unset, signature check is skipped (allows local dev without the secret). In production, the secret MUST be set.
- **No auto-confirm hole:** "Confirm email" is NOT disabled in Supabase. The hook replaces delivery only; Supabase still owns token validation and `email_confirmed_at`.

---

## Owner Registration Steps (Manual)

These steps cannot be performed by code — they require the Supabase Dashboard:

1. **Generate hook secret:** `openssl rand -hex 32` (or any 32+ char random string).
2. **Add to Vercel env vars:** `SUPABASE_EMAIL_HOOK_SECRET=<value>` (server-only, never public).
3. **Supabase Dashboard → Authentication → Hooks → "Send Email Hook":**
   - Enable: ON
   - Hook URL: `https://lero.al/api/auth-email-hook`
   - Hook Secret: paste the same value used in step 1
   - Save.
4. **Redeploy on Vercel** (or wait for the env var to propagate to the running deployment).
5. **Verify:**
   - Sign up a test user → check inbox → one email arrives (our VerifyEmail template, not Supabase's default).
   - Request password reset → one email arrives (our RecoveryEmail template).
   - No duplicate emails = hook is working.

---

## Localization Coverage

All new email templates: sq / en / uk / it inline STRINGS. Same pattern as VerifyEmail, RecoveryEmail, emailChange.ts.

Email templates render outside next-intl context (server-side hook handler) → locale from `resolveUserLocale(user.id)` → `preferred_locale` → `sq`.

---

## Validation

- TypeScript: 0 new errors in new files (pre-existing test-file errors unrelated).
- ESLint: 0 errors in new files.
- governance:localization: ✅ PASS C0/H0/M17 (baseline M18 — no regression).
- npm run build: user's manual step per project policy.
