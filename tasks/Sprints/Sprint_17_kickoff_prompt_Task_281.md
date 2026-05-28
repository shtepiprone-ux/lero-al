# Sprint 17 — Task 281 kickoff (Auth session persistence hardening after browser Site Data + Cookies cleanup)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST. Pre-read selection per `docs/rule-index.md` — **"Email / auth lifecycle" + "DB / server action / RLS" + "UI / layout / component" bundles** (mixed; this is a security-critical multi-surface task). No scope change; STOP & ASK if ambiguous; literal AC; self-validate; UI task → ×4 locales + 7 breakpoints. Owner runs git; executor never runs git.

> **Security-critical task.** This work touches the auth/session model.
> Read clause 17 (security forbidden list) BEFORE writing any code.
> When in doubt, STOP & ASK. The cost of a wrong move is RLS-bypass /
> hidden admin access / token leakage — far worse than the cost of an
> extra orchestrator round-trip.

---

## Task 281 — Auth session persistence hardening after browser Site Data + Cookies cleanup

```
Hard contract: see top.

Type:        bugfix + security + UX hardening + architecture cleanup
Priority:    high (security-adjacent; UX-critical; owner-reported)
Area:        auth / Supabase session / SSR cookies / protected routes / admin access / user persistence UX

GOAL: Remove the accidental-logout failure mode caused by fragile
client-side-only auth state. Migrate (or correct) the project to use
Supabase's canonical SSR/cookie-compatible session model so that:

  (1) Clearing ONLY localStorage / sessionStorage / cache while valid
      auth cookies remain → user stays logged in.
  (2) Full deletion of cookies + Site Data → clean re-auth UX with
      safe returnTo, no broken loops, no admin data flashes.
  (3) Normal refresh / direct protected-URL open / tab close-reopen
      with valid cookies → user stays authenticated (this is the
      practical UX improvement the owner is asking for).

This task MUST NOT:
- Fake impossible persistence (no token resurrection after full
  cookie deletion).
- Store backup refresh tokens in localStorage / IndexedDB / service
  workers.
- Implement fingerprinting / device tracking / cross-site workarounds.
- Weaken RLS.
- Add admin bypass cookies.
- Expose service-role key in browser code.
- Add long-lived "remember me" tokens.
- Hardcode admin emails / user IDs.

Filed by: orchestrator (Opus 4.7) on 2026-05-28 from owner-uploaded
issues.txt §8 (the "logged out after Site Data cleanup" bug + UX
hardening directive).

Pre-read (Email/auth + DB/RLS + UI bundles from docs/rule-index.md):
- docs/agent-contract.md  (always)
- docs/backlog.md         (always)
- docs/env.md             → existing env vars, canonical site URL rule.
- docs/integrations.md    → "Supabase Auth Configuration" (Tasks
                             271/273 set the current dashboard toggle
                             state; this task does NOT flip dashboard
                             toggles).
- docs/rls-rules.md       → must not weaken any RLS policy.
- docs/qa-rules.md
- docs/ui-rules.md        → for any re-auth UI added (loading state,
                             alert pattern).
- docs/component-rules.md → no hardcoded text; locale rules.
- docs/data-access-rules.md → server-action / SSR client patterns.
- docs/state-authority.md → THE primary doc: SSR vs client authority
                             for auth state.
- docs/architecture.md    → modular monolith structure; auth lives in
                             `src/modules/auth/` + `src/lib/auth/` +
                             middleware.
- docs/ai-behavior.md → Note 19 (UX Flow Preservation — every existing
                        login/register/reset/admin flow keeps working),
                        Note 20 (Existing-Control Preservation — no
                        silent UI removal).
- package.json — confirm installed Supabase packages (@supabase/supabase-js,
                  @supabase/ssr if present, any deprecated
                  @supabase/auth-helpers).
- middleware.ts (or .js) — current middleware behavior.
- next.config.* — current Next.js config.
- src/lib/auth/browser.ts — current browser auth helpers.
- src/lib/supabase/client.ts — current browser Supabase client.
- src/lib/supabase/server.ts (or equivalent) — server Supabase client.
- All auth/admin/profile/favorites pages and guards.

Strategy decision (orchestrator, 2026-05-28):

- **If `@supabase/ssr` is INSTALLED:** verify it's used correctly per
  the official Supabase Next.js App Router pattern (cookie-based
  session, middleware-side refresh, server actions consuming the
  cookie-aware client). Fix any gap; consolidate any duplicate
  client.
- **If `@supabase/ssr` is NOT installed:** add it (it's the official
  current Supabase package for Next.js App Router cookie session).
  Document the addition rationale. Do NOT install the deprecated
  `@supabase/auth-helpers-nextjs`.
- **If the project still uses `@supabase/auth-helpers-*`** (deprecated):
  migrate to `@supabase/ssr`. Document migration scope.

The decision should be made based on the Required investigation
output. STOP & ASK if the situation is ambiguous (e.g. partial
migration left in place).

Current behavior to preserve:
- Login (email/password) — works.
- Register (email/password + email confirmation) — works.
- Logout (explicit) — works; remains final; refresh keeps the user
  logged out.
- Password reset request + recovery completion (Task 271 surface) — works.
- Email change flow (existing custom token system) — works.
- Email verification flow — works.
- Auth callback route (`/auth/callback`, `/auth/confirm`) — works
  (Task 224 + Task 251 + Task 271 surfaces).
- Supabase Send Email Hook (Epic D.6 / Task 122) — UNCHANGED. Do NOT
  re-enable Supabase default emails.
- Admin RBAC + admin permissions logic — UNCHANGED in semantics; auth
  source may improve but role-resolution logic stays.
- Profile cabinet flows (ProfileTab fields, Task 271 password section
  Task 273) — work.
- Favorites + listing creation/editing auth guards — work.
- Existing RLS policies — UNCHANGED unless investigation surfaces a
  bug (then STOP & ASK).
- Existing locale routing — UNCHANGED.
- Existing OAuth (Google) flow — UNCHANGED.
- Existing CAPTCHA work-in-progress (Task 274) — UNCHANGED (not yet
  shipped; do not break the Task 274 kickoff scope).
- Existing TaskSheet (AuthSheet) UX — UNCHANGED visually; only
  the underlying client/cookie/session model is hardened.

Required after behavior:

1. **Canonical Supabase client architecture** — ONE pattern per layer:
   - Browser client: `src/lib/supabase/client.ts` (single instance,
     cookie-aware via `@supabase/ssr`'s `createBrowserClient`).
   - Server client: `src/lib/supabase/server.ts` (per-request via
     `createServerClient`, consuming Next.js `cookies()` from
     `next/headers`).
   - Middleware client: `src/lib/supabase/middleware.ts` (session
     refresh helper consumed by `middleware.ts`).
   - Service-role client: `src/lib/supabase/admin.ts` (server-side only,
     reads `SUPABASE_SERVICE_ROLE_KEY`, NEVER imported into client code;
     existing usage preserved).

   If duplicates exist (e.g. multiple `createClient` calls scattered
   across components), consolidate into the canonical helpers. Document
   any unavoidable exception in the session log.

2. **SSR/cookie-compatible session flow:**
   - Server components / route handlers / server actions resolve user
     via `createServerClient(cookies()).auth.getUser()` — NEVER trust
     client-passed user IDs as proof of identity.
   - Browser components MAY use the AuthContext / `useAuth()` hook for
     UI reactivity but MUST NOT be the sole source of truth for
     protected access.
   - The middleware refreshes expired access tokens when a valid
     refresh token cookie exists.

3. **Remove `localStorage`-only dependency:**
   - The Supabase browser client must NOT default to localStorage-only
     persistence. Cookie-based persistence (via `@supabase/ssr`) is the
     canonical session source.
   - Clearing only localStorage / sessionStorage / cache in DevTools
     must NOT log the user out if valid auth cookies remain.

4. **Middleware** (`middleware.ts`):
   - Calls the session-refresh helper on every request that traverses
     the matcher.
   - Matcher EXCLUDES: static assets (`/_next/static`, `/_next/image`),
     image optimization, public files (`/favicon.ico`, `/robots.txt`,
     etc.), the auth callback routes (`/auth/callback`, `/auth/confirm`
     — they must NOT be redirected away).
   - Locale-aware: preserves `/[locale]/...` routing.
   - Protected routes (e.g. `/[locale]/cabinet`, `/[locale]/admin`,
     `/[locale]/favorites` if auth-gated) → if no valid session, redirect
     to `/[locale]/auth/login?returnTo=<encoded-safe-path>`.
   - Public routes (e.g. `/[locale]/listings`, `/[locale]/`) →
     middleware refreshes session if present, otherwise passes through.

5. **Protected user routes** — profile, favorites (auth-gated), listing
   create/edit, cabinet pages: server-side auth check via
   `createServerClient(cookies()).auth.getUser()`. Unauthenticated →
   redirect to login with safe `returnTo`. Authenticated → render.

6. **Protected admin routes** — `/[locale]/admin/**`: server-side auth
   check + existing admin role/permission check. Unauthenticated OR
   non-admin → redirect to login (or admin-specific redirect target if
   that's the existing pattern; preserve). Admin must NOT see admin
   data while session is unknown (no flash; use proper SSR auth check
   BEFORE rendering admin layout).

7. **`returnTo` sanitization** — accept only same-origin relative paths.
   Reject/sanitize: absolute URLs, protocol-relative URLs (`//evil.com`),
   `javascript:`, `data:`, malformed paths, path-traversal attempts.
   Reject admin paths if the current user is not authorized (after
   login). Locale preserved in `returnTo`. After successful login,
   redirect to the safe `returnTo` (or canonical post-login destination
   if absent/invalid).

8. **Client-side AuthContext** (`useAuth()` / equivalent):
   - Reflects current user state for UI reactivity.
   - Clears state on logout.
   - Updates on login.
   - Does NOT serve as the authoritative source for server-side
     decisions.
   - No hydration mismatch (no `typeof window` branches in render;
     no `suppressHydrationWarning`).
   - Cross-tab updates via Supabase's `onAuthStateChange` (already
     used per Task 185).

9. **Logout remains final** — `signOut('global')` invalidates session
   server-side; client state cleared; refresh keeps user out; admin
   pages not accessible post-logout.

10. **NEW locale keys for session recovery message** (×4 locales):
    - `auth.session_recovery_message`
      - sq: "Sesioni juaj duhet të rivendoset. Ju lutemi hyni përsëri për të vazhduar."
      - en: "Your session needs to be restored. Please sign in again to continue."
      - uk: "Потрібно відновити вашу сесію. Увійдіть ще раз, щоб продовжити."
      - it: "La tua sessione deve essere ripristinata. Effettua nuovamente l'accesso per continuare."
    - = 1 new key × 4 = 4 entries.
    - Rendered on the login page as a localized banner when the user
      arrives via a session-loss redirect (e.g. via a `?session=lost`
      query param OR detected from referrer pattern).

11. **NO changes to:**
    - Supabase Auth dashboard configuration (owner-only).
    - Email templates.
    - Send Email Hook handler.
    - Resend integration.
    - Agent approval logic.
    - Existing RLS policies (unless investigation proves a real bug;
      then STOP & ASK).
    - Service-role usage patterns (preserve, just don't expand).
    - Existing public routes' SSR rendering (still works without auth).
    - Existing CAPTCHA-in-progress (Task 274).
    - Phone country-code combobox (Task 280).
    - Listing card / detail / favorites surfaces (Task 277 / 278 / 279
      are separate).

Positive flow (happy path) — normal refresh:
- User logs in via /sq/auth/login → cookies set → redirected to /sq/.
- User opens /sq/cabinet directly via URL → middleware refreshes session
  (cookies valid) → server-side `getUser()` returns user → cabinet
  renders.
- User refreshes the page → middleware refreshes again → renders.
- User closes the tab, reopens within session lifetime → cookies still
  valid → cabinet still loads.

Positive flow (happy path) — localStorage cleared (the bug):
- User logged in, clears localStorage via DevTools (cookies untouched).
- User refreshes /sq/cabinet → middleware finds valid cookies →
  refreshes session → user still authenticated → cabinet renders.
- (PRE-FIX behavior was: client lost user state and forced re-login.
  POST-FIX: user stays in.)

Positive flow (happy path) — admin:
- Admin logs in → opens /sq/admin → server-side `getUser()` + role
  check → admin renders.
- Refresh → middleware + SSR check → admin still in.
- Cleared localStorage → same as above.

Positive flow (happy path) — full Site Data deletion:
- User logged in, deletes all Site Data + Cookies via browser UI.
- Opens /sq/cabinet → middleware finds NO cookies → redirects to
  /sq/auth/login?returnTo=%2Fsq%2Fcabinet&session=lost.
- Login page shows the localized session-recovery banner
  (`t('auth.session_recovery_message')`).
- User logs in → redirected back to /sq/cabinet (sanitized returnTo).
- (POST-FIX: clean re-auth UX; no broken loop, no 500.)

Negative flow (every off-happy-path branch):
- **Full cookie deletion + admin route** — redirect to admin-appropriate login target (existing pattern; preserve); same `session=lost` UX.
- **Expired refresh token** — middleware tries refresh, fails → redirect to login with returnTo + session-lost banner.
- **Invalid cookie tampering** — Supabase rejects on refresh → redirect to login.
- **`returnTo` is external** (e.g. `?returnTo=https://evil.com`) — reject; redirect to canonical post-login destination instead.
- **`returnTo` is protocol-relative** (`//evil.com`) — reject.
- **`returnTo` contains `javascript:` or `data:`** — reject.
- **`returnTo` is an admin path AND user is not admin after login** — redirect to canonical user post-login destination instead of the admin path; do not silently grant admin.
- **Explicit logout** — session invalidated; refresh keeps user out; admin pages not accessible.
- **Login while already logged in (rare)** — handle gracefully; either route to home or refresh session.
- **Auth callback (`/auth/confirm`)** — middleware MUST NOT redirect this route away; the route handler completes Supabase verification + sets cookies + redirects to canonical destination.
- **Password reset link click** — same: callback route handled correctly; ResetPasswordClient (Task 271) works.
- **Email verification click** — auth callback completes; user lands on verified state.
- **Cross-tab logout** — Supabase's `onAuthStateChange` fires across tabs; AuthContext clears; UI updates.
- **Hydration mismatch risk** — auth provider renders consistent UI server + client; no `typeof window` branches in initial render.
- **Service-role key leak** — verify no `SUPABASE_SERVICE_ROLE_KEY` appears in browser bundle (grep across `.next/static` post-build, or use a guard import like `import 'server-only'` in `lib/supabase/admin.ts`).
- **Middleware infinite loop** — verify by hitting protected routes with invalid cookies; should redirect ONCE to login, not loop.
- **Stale protected data flash** — verify by clearing cookies + hitting /admin; should redirect BEFORE rendering admin layout, not after.
- **No-spinner-stuck** — loading states have timeouts / fallbacks; if session resolution hangs, eventually redirect.
- **Mobile / 7 breakpoints** — login page + session-recovery banner walked.
- **Locale switch on login** — banner translates.
- **Favorites action while session is lost** — favorite click → server action sees no user → returns auth-required → existing UI shows login prompt.
- **Public pages** — work without auth; never redirect; middleware passes through.

Required investigation (PASTE outputs in session log — this task is
security-critical; the investigation phase is mandatory):

1. Supabase package versions:
   ```
   grep -E "@supabase/(supabase-js|ssr|auth-helpers)" package.json
   ```

2. All Supabase client instantiations:
   ```
   grep -rIn "createClient\|createBrowserClient\|createServerClient\|@supabase/ssr\|@supabase/auth-helpers" src/ middleware.ts middleware.js 2>/dev/null --include="*.ts" --include="*.tsx"
   ```

3. Storage / persistence usage:
   ```
   grep -rIn "localStorage\|sessionStorage\|IndexedDB\|persistSession\|storageKey" src/ middleware.ts 2>/dev/null --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".test."
   ```

4. Auth API surface usage:
   ```
   grep -rIn "getSession()\|getUser()\|onAuthStateChange\|refreshSession\|setSession\|exchangeCodeForSession\|signOut" src/ middleware.ts 2>/dev/null --include="*.ts" --include="*.tsx"
   ```

5. Existing returnTo / redirectTo handling:
   ```
   grep -rIn "returnTo\|redirectTo\|next=" src/ middleware.ts 2>/dev/null --include="*.ts" --include="*.tsx"
   ```

6. Service-role usage (must stay server-only):
   ```
   grep -rIn "service_role\|SERVICE_ROLE\|SUPABASE_SERVICE_ROLE\|createAdminClient" src/ middleware.ts 2>/dev/null --include="*.ts" --include="*.tsx"
   ```

7. Existing middleware behavior:
   ```
   cat middleware.ts 2>/dev/null || cat middleware.tsx 2>/dev/null || cat middleware.js 2>/dev/null
   ```

8. Existing auth callback route:
   ```
   find src/app -name "route.ts" -path "*auth*"
   ```

9. AuthContext / useAuth hook:
   ```
   grep -rln "AuthContext\|useAuth\|AuthProvider" src/ --include="*.tsx" --include="*.ts" 2>/dev/null
   ```

10. Inventory table for the session log:
    | Area | File | Current behavior | Session/storage source | Risk | Required change |
    |---|---|---|---|---|---|

Scope (files Sonnet may touch):

1. `package.json` — add `@supabase/ssr` IF not present + remove deprecated `@supabase/auth-helpers-*` if present and fully replaced.
2. `src/lib/supabase/client.ts` — canonical browser client (cookie-aware via `@supabase/ssr`).
3. `src/lib/supabase/server.ts` — canonical server client.
4. `src/lib/supabase/middleware.ts` — NEW middleware session-refresh helper.
5. `src/lib/supabase/admin.ts` — verify `import 'server-only'` guard; do not change behavior.
6. `middleware.ts` (or .js) — consume the session-refresh helper; correct matcher.
7. `src/lib/auth/browser.ts` — verify it consumes the canonical browser client (no parallel client creation).
8. `src/modules/auth/context/AuthContext.tsx` — verify it consumes the canonical browser client; no localStorage-only assumption.
9. Server pages with auth guards: `src/app/[locale]/cabinet/page.tsx`, `src/app/[locale]/admin/**/page.tsx`, `src/app/[locale]/favorites/page.tsx` (if auth-gated), listing create/edit pages — verify SSR auth check via canonical server client.
10. `src/app/[locale]/auth/login/page.tsx` (or AuthSheet entry) — read `?session=lost` query param → render the localized banner.
11. `src/modules/auth/lib/sanitizeReturnTo.ts` — NEW helper for safe returnTo sanitization.
12. `messages/sq.json` + `messages/en.json` + `messages/uk.json` + `messages/it.json` — 1 new key each.
13. `docs/backlog.md` — standard task-closure update.
14. `docs/sessions/2026-05-28-task-281-auth-session-persistence.md` — NEW session log per Task 264.
15. `docs/integrations.md` → "Supabase Auth Configuration" — add a row or note documenting that the project now uses `@supabase/ssr` cookie session (if it didn't before).

Out of scope (do NOT touch):
- Supabase Auth dashboard config (owner-only).
- Email templates (Resend / React Email).
- Send Email Hook handler.
- Resend behavior.
- Email validation / password validation / name validation.
- Agent approval logic.
- RLS policies.
- Service-role usage patterns (preserve).
- New OAuth providers.
- Redesign of login / register / password reset pages (except minimal recovery-banner UI).
- Admin navigation redesign.
- Locale message files beyond the 1 new key.
- Analytics / device management UI / session-list UI / remember-devices.
- The CAPTCHA-in-progress work (Task 274).
- Phone country-code work (Task 280).
- Listing / favorites / WhatsApp surfaces (Tasks 277-279).

Acceptance criteria (literal):
- Canonical browser/server/middleware/admin Supabase clients identified or established; duplicates consolidated; any unavoidable duplicate documented.
- `@supabase/ssr` cookie session in use (added if necessary; documented).
- LocalStorage-only session dependency removed.
- Middleware refreshes session per request (matcher excludes static / auth-callback / public assets).
- Normal refresh: user stays authenticated (manual QA scenario A).
- Direct protected URL open: works when session valid (QA A).
- Admin persistence: admin stays authenticated (QA B).
- Clearing localStorage/sessionStorage/cache only: user stays authenticated (QA C — the main UX win).
- Full cookie + Site Data deletion: clean re-auth UX with safe returnTo + localized banner; no infinite loop, no 500, no stale data flash (QA D).
- Explicit logout: final; refresh keeps user out; admin not accessible (QA E).
- Auth callback / email verification / password reset flows: still work (QA F).
- Favorites / auth-required actions: work when authenticated; show canonical auth-required behavior when truly logged out (QA G).
- `returnTo` sanitization: rejects external, protocol-relative, javascript:, data:, malformed, admin-when-not-admin.
- No service-role key in browser bundle (`grep "SUPABASE_SERVICE_ROLE" .next/static -r` returns 0 hits post-build).
- No new lint errors.
- `tsc=0` errors.
- `npm run build` passes.
- 1 new locale key × 4 locales = 4 entries.
- All 7 breakpoints walked for login page + session-recovery banner.
- Note 18 self-validation block + Note 20 before/after inventory for any touched UI in session log.
- Inventory table in session log per Required investigation §10.
- "Files Changed" table per Task 264.
- Existing login / register / password reset / email verification / email change / admin access / profile / favorites flows still work (each verified manually per the QA scenarios).
- Self-validation verdict line: `Self-validation: tsc=0 errors · build=passes · AC table=all green · runtime locale=uk PASS · scope=clean · QA scenarios A-G: PASS`.

Final report required from Sonnet:
1. Files Changed table.
2. Auth model BEFORE (1 paragraph).
3. Auth model AFTER (1 paragraph).
4. Supabase packages used (before/after).
5. Confirmation that localStorage-only dependency was removed (grep evidence).
6. QA scenario A result: normal refresh.
7. QA scenario B result: admin persistence.
8. QA scenario C result: localStorage cleanup (the main UX fix).
9. QA scenario D result: full Site Data deletion.
10. QA scenario E result: explicit logout.
11. QA scenario F result: auth callback / email flows.
12. QA scenario G result: favorites / auth-required action.
13. Explicit confirmation that full cookie deletion is handled as CLEAN RE-AUTH, not impossible silent persistence.
14. Confirmation that explicit logout is still final.
15. returnTo sanitization tests (one per attack vector: external, protocol-relative, javascript:, admin-escalation).
16. No service-role key in client bundle (grep evidence post-build).
17. Inventory table (Required investigation §10).
18. Locale-key parity (1 × 4 = 4 entries).
19. Responsive walk evidence.
20. Note 18 self-validation verdict line.
21. Known limitations (e.g. cross-tab logout edge cases; document if observed).
22. Follow-up tasks if needed (e.g. if any RLS issue surfaces, file a separate follow-up — do NOT silently weaken RLS).

Do NOT emit `git add` / `git commit` commands. Do NOT run git. Do NOT
modify Supabase dashboard. Do NOT weaken RLS. Do NOT expose service-role.
Do NOT add browser storage backup tokens. Do NOT implement fingerprinting.
Do NOT hardcode admin emails/IDs. Do NOT create a parallel auth system.
Do NOT touch out-of-scope files.
```
