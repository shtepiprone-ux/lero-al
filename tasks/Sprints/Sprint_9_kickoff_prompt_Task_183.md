# Kickoff prompt — Task 183 (Sprint 9 — P.4: canonical lero.al URL for all generated links)

> Note 16: a confirmation email's link pointed to `localhost` instead of lero.al. Reproduced from the
> code: `src/modules/auth/components/AuthSheet.tsx` builds redirect URLs from `window.location.origin`
> (line ~86 OAuth callback, ~183 password-reset redirect, ~534 sign-up `emailRedirectTo`). On localhost
> and Vercel previews that origin is NOT lero.al, so the email link is broken. The rest of the codebase
> already uses `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'` (listing page, cron routes, cabinet
> actions). The rule is now codified in docs/env.md ("Canonical site URL rule").

```
You are Claude Code Sonnet 4.6 working in `lero-al`.

Hard contract:
- Do NOT change scope: replace `window.location.origin` in generated/redirect/email links with the
  canonical site URL. Do NOT redesign the email templates or the auth flow.
- Do NOT invent architecture. Introduce/confirm ONE shared site-URL helper/constant reading
  NEXT_PUBLIC_SITE_URL (fallback 'https://lero.al'); reuse it. No new env var (it already exists).
- Global Change Verification Rule: grep the whole repo for `window.location.origin` and fix EVERY
  occurrence that produces a URL leaving the browser (email, OAuth callback target, share). Leave the
  legitimate same-origin in-tab guard (src/hooks/useUnsavedChangesGuard.ts) untouched.
- Update docs/backlog.md + add docs/sessions/2026-05-22-task-183-canonical-site-url.md.
- 0 new lint/typecheck errors; governance PASS.
- Commit + push: SINGLE `git add -A`, then `git log -1` (paste real output). Owner runs git/SQL.

Pre-read:
- src/modules/auth/components/AuthSheet.tsx (lines ~85-87 handleGoogle; ~182-184 reset redirectTo;
  ~533-535 signUp emailRedirectTo — all use window.location.origin)
- existing canonical usage for reference: src/app/[locale]/listings/[slug]/page.tsx (~108, ~254),
  src/modules/cabinet/actions/index.ts (~381, ~438), src/app/api/cron/*/route.ts (SITE_URL const)
- docs/env.md ("Canonical site URL rule"), docs/integrations.md
- src/hooks/useUnsavedChangesGuard.ts (DO NOT change — legitimate same-origin use)

Scope:
1. Add (or reuse) a single client-safe helper/constant for the canonical base URL from
   NEXT_PUBLIC_SITE_URL (fallback 'https://lero.al'). If a shared constant already exists, use it.
2. Replace the three `window.location.origin` usages in AuthSheet (OAuth callback, reset redirect,
   sign-up emailRedirectTo) with the canonical base, preserving the `/auth/callback` + `next=/{locale}/…`
   path structure.
3. Grep for any other generated/email/share link using window.location.origin and fix them too.

Acceptance criteria:
- No `window.location.origin` remains in any auth/email/share/redirect link (grep proves it); the
  same-origin navigation guard is unchanged.
- OAuth, password-reset, and sign-up confirmation links resolve to https://lero.al/... in all environments.
- 0 new lint/typecheck errors; npm run build passes.

Out of scope:
- Email template redesign; Supabase dashboard redirect-allowlist config (note for owner if relevant).
```
