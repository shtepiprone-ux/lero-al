# Task 183 — P.4: Canonical lero.al URL for All Generated Links

**Date:** 2026-05-23  
**Sprint:** 9  
**Type:** auth/email link fix

## Root Cause

`src/modules/auth/components/AuthSheet.tsx` built OAuth callback, password-reset, and sign-up
confirmation URLs from `window.location.origin`. On localhost and Vercel previews that origin is
NOT `lero.al`, so the links in emails pointed to the wrong host.

The rest of the codebase already used `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'`
(listing page, cabinet actions, cron routes) — there was no shared constant, just repeated inline.

## Fix

### New shared constant — `src/lib/siteUrl.ts`

```ts
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'
```

Client-safe (`NEXT_PUBLIC_` prefix); works in both server and client components.

### `src/modules/auth/components/AuthSheet.tsx`

Added import `import { SITE_URL } from '@/lib/siteUrl'` and replaced three occurrences:

| Line | Before | After |
|------|--------|-------|
| ~86 | `` `${window.location.origin}/auth/callback` `` | `` `${SITE_URL}/auth/callback` `` |
| ~183 | `` `${window.location.origin}/auth/callback?next=/${locale}/auth/reset-password` `` | `` `${SITE_URL}/auth/callback?next=/${locale}/auth/reset-password` `` |
| ~534 | `` `${window.location.origin}/auth/callback?next=/${locale}/auth/verified` `` | `` `${SITE_URL}/auth/callback?next=/${locale}/auth/verified` `` |

### Left untouched

`src/hooks/useUnsavedChangesGuard.ts:48-49` — legitimate same-origin navigation guard;
uses `window.location.origin` to detect external URLs, does not produce outbound email links.

## Global Change Verification

`grep -rn "window\.location\.origin" src/` confirms only the navigation guard remains.

## Post-Fix Verification

- `npx tsc --noEmit` → **0 errors**

## Note for owner

Supabase dashboard → Authentication → URL Configuration → Redirect URLs must include
`https://lero.al/**` (and any preview/staging origin). These are already expected to be set;
the fix ensures the code always generates the canonical URL regardless of runtime origin.

## Acceptance Criteria

- [x] No `window.location.origin` in any auth/email/share/redirect link (grep confirmed)
- [x] `src/hooks/useUnsavedChangesGuard.ts` navigation guard unchanged
- [x] OAuth, password-reset, and sign-up confirmation links resolve to `https://lero.al/...` in all environments
- [x] Single shared `SITE_URL` constant in `src/lib/siteUrl.ts` — no new env var
- [x] 0 new lint/typecheck errors
