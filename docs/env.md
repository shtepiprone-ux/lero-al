## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset  # Unsigned upload preset for listing images (CldUploadWidget in ImageUpload.tsx). Create in Cloudinary Dashboard → Settings → Upload → Upload presets. Set folder restriction to listings/ (updated to <userId>/listings/ in H.4).
CLOUDINARY_DELETE_MODE=dry-run  # Controls deleteAsset() in src/lib/cloudinaryDelete.ts. Values: 'dry-run' (default — logs only, no real delete) | 'enabled' (real Cloudinary destroy after reference check). Never set to 'enabled' without running H.6 dry-run audit first.  # Unsigned upload preset for listing images (CldUploadWidget in ImageUpload.tsx). Create in Cloudinary Dashboard → Settings → Upload → Upload presets. Set folder restriction to listings/ (updated to <userId>/listings/ in H.4).
RESEND_API_KEY=re_xxx                  # Resend dashboard → API Keys (server-only, never expose to client)
NEXT_PUBLIC_SITE_URL=https://lero.al
SUPABASE_EMAIL_HOOK_SECRET=v1,whsec_your_base64_secret  # Supabase Dashboard → Auth → Hooks → Send Email Hook → Secret. Dashboard-issued value in v1,whsec_<base64> format (do NOT invent your own). Server-only; verified via Standard Webhooks (standardwebhooks lib) on incoming hook requests at /api/auth-email-hook
CRON_SECRET=your_cron_secret               # Random secret (e.g. openssl rand -hex 32). Set in Vercel → Settings → Environment Variables. Vercel automatically passes it as Authorization: Bearer <CRON_SECRET> to cron routes defined in vercel.json. Used by /api/cron/inactivity.
LOG_CORRELATION_SALT=your_random_salt      # Server-only salt for hashing emails in security audit logs (Task 157). Used by src/modules/auth/actions/recovery.ts to produce a stable correlationId without exposing raw email. Generate: openssl rand -hex 24. If absent, falls back to 'lero-al' (weaker; set in production).
# Email-change token expiry: 24 hours (hardcoded in src/modules/cabinet/actions/index.ts EMAIL_CHANGE_EXPIRY_HOURS)
# Email preview server: npm run email — launches react-email preview at localhost:3000 (dev only)

# Optional — enables verbose Web Vitals console output in production/staging builds
# NEXT_PUBLIC_PERF_DEBUG=true
```
For deployed environments, these variables must also be configured in Cloudflare Pages → Settings → Variables and Secrets.
Use placeholder values in documentation only; real secrets must be stored in the root `.env.local` file for local development and in Cloudflare Pages environment variables / secrets for deployed environments, never committed to the repository.
Note: Variables starting with `NEXT_PUBLIC_` are exposed to the client bundle and must only be used for values intended to be public. All other variables are server-only and must never be exposed to client code.

## Canonical site URL rule (Note 16 — enforced 2026-05-22)

Every absolute link the app generates — auth/confirmation/recovery emails, OAuth `redirectTo`,
`emailRedirectTo`, share links, cron-email links, sitemap/SEO URLs — MUST be built from the canonical
base `process.env.NEXT_PUBLIC_SITE_URL` (fallback `'https://lero.al'`), NEVER from
`window.location.origin`.

- `window.location.origin` resolves to `localhost:3000` in dev and to a preview host on Vercel
  previews, so any email/link built from it ships a broken `localhost`/preview URL to real users.
  This is the exact cause of the "confirmation email points to localhost" bug.
- Server and client resolve the base the same way: `NEXT_PUBLIC_SITE_URL` (it is `NEXT_PUBLIC_`
  precisely so client code can read it). Prefer a single shared helper/constant over re-reading the
  env var ad hoc.
- `window.location.origin` is acceptable ONLY for purely in-tab, same-origin logic (e.g. the
  unsaved-changes navigation guard) — never for a URL that leaves the browser (email, share, OAuth
  callback target).
- Reviewer red flag: any `window.location.origin` in an auth/email/share diff.

> **Set it explicitly in production.** As of 2026-05-23 `NEXT_PUBLIC_SITE_URL` is NOT set on the
> deployment; the code falls back to `'https://lero.al'`, which happens to be correct — but rely on the
> fallback at your peril (any preview/staging build will then also point at prod). Set
> `NEXT_PUBLIC_SITE_URL` per environment.

## Supabase Auth — Redirect URLs allowlist (recorded 2026-05-23)

Supabase Dashboard → Authentication → URL Configuration → **Redirect URLs** is an allowlist of the
**redirect TARGET URLs** the app hands to Supabase (`emailRedirectTo`, OAuth `redirectTo`, password-reset
`redirectTo`, and any `redirect_to` embedded in a Supabase `/auth/v1/verify` link). It is **not** a list
of email types — you do **not** add an entry per email.

Targets the app actually uses (everything else is internal and needs no entry):

| Target URL | Used by |
|---|---|
| `https://lero.al/auth/callback` | Google OAuth (PKCE `?code=`); legacy signup/recovery `redirect_to` |
| `https://lero.al/auth/confirm` | token_hash email links via `verifyOtp` (Task 224 — signup/recovery/magic-link) |

Do **NOT** add these — they are internal, not Supabase redirect targets:
- `next` destinations resolved by our own routes (`/<locale>/auth/verified`, `/<locale>/auth/reset-password`).
- Locale variants (`/sq/…`, `/en/…`) — they are only `next` values, never the redirect target.
- The cabinet email-change link (`/<locale>/auth/confirm-email?token=…`) — a custom in-app token flow
  that links directly to the app, bypassing Supabase redirect validation.

**Recommended (low-maintenance):** add a single wildcard for the canonical domain so new targets/locales
never require an allowlist change:

```
https://lero.al/**
```

Keep `Site URL = https://lero.al`. If you ever test auth on preview/localhost, add that host too
(e.g. `http://localhost:3000/**`) — otherwise auth emails from those envs are rejected.