# Sprint 16 — Task 274 kickoff (Cloudflare Turnstile captcha on signup + password-reset request)

> **Mandatory rules — non-negotiable:**
>
> - `docs/agent-contract.md` **clause 6a** (Positive + Negative flow gate, Task 255).
> - `docs/agent-contract.md` **clause 10** + `CLAUDE.md` "Commit hand-off" + `docs/ai-behavior.md` "Commit Rules" (Task 264). Sonnet MUST include a "Files Changed" table in the session log. Sonnet MUST NOT emit `git add` / `git commit` commands.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 working in `lero-al`. Read `docs/agent-contract.md` FIRST (clauses 1–10 + 6a + 10). Pre-read selection per `docs/rule-index.md` — for this task: **"Email / auth lifecycle task" bundle + "UI / layout / component task" bundle** (mixed). No scope change; STOP & ASK if ambiguous; literal AC; self-validate before "complete" claim (`tsc=0`, AC table, diff self-review, runtime check in `uk` 320px). UI task → ×4 locales (sq/en/uk/it) AND 7 breakpoints (320/375/390/768/1280/1440/2560) REQUIRED. Owner runs git; executor never runs git.

---

## Task 274 — Cloudflare Turnstile captcha on signup + password-reset request

```
Hard contract: see top.

Type:        feature + integration (bot abuse mitigation)
Priority:    high (unblocks Supabase Auth "Captcha protection" toggle; real attack surface for a public marketplace)
Area:        auth / shared UI primitives / server-side verification / env config / i18n

GOAL: Add a Cloudflare Turnstile captcha widget to the two public,
unauthenticated POST endpoints currently most exposed to bot abuse:

  (1) Signup (`AuthSheet.tsx` register flow) — currently bot-fillable.
  (2) Password-reset request (`AuthSheet.tsx` forgot-password flow) —
      currently bot-fillable; email-enumeration / inbox-flooding surface.

Strategy: use **Cloudflare Turnstile** (NOT hCaptcha — Turnstile is the
modern recommended choice for Cloudflare-fronted apps; Lero.al is
deployed to Cloudflare Pages per `docs/env.md`, so Turnstile is
first-party). Use the **invisible/managed** challenge mode (Cloudflare's
default — minimal UX friction; only renders a visible challenge if
Cloudflare deems the request suspicious).

Server-side: pair each captcha-protected endpoint with a server-side
verification step. The token from the client widget MUST be re-verified
against Cloudflare's `https://challenges.cloudflare.com/turnstile/v0/siteverify`
endpoint with the `TURNSTILE_SECRET_KEY`; the action proceeds ONLY if
verification succeeds.

This is the frontend prerequisite for the owner flipping the Supabase
Dashboard toggle "Captcha protection" → ON (currently OFF interim per
`docs/integrations.md` → "Supabase Auth Configuration"). Note: when
Supabase's own "Captcha protection" toggle is ON, Supabase ALSO verifies
the captcha token at the Auth API level (independent of our server-side
verification). The owner configures the Supabase dashboard with the
same `TURNSTILE_SECRET_KEY` after this task ships. Our server-side
re-verify is the first line of defense; Supabase's is the second.

Filed by: orchestrator (Opus 4.7) on 2026-05-28. Direct dependency of
the owner flipping "Captcha protection" toggle ON in Supabase Dashboard.
Filed alongside Task 273 (Cabinet reauth) and Task 275 (GRANT audit) as
Sprint 16 Auth Security Hardening batch.

Pre-read (Email / auth lifecycle + UI / layout / component bundle from docs/rule-index.md):
- docs/agent-contract.md  (always)
- docs/backlog.md         (always)
- docs/env.md             → existing env vars + canonical site URL rule
                            (this task ADDS NEXT_PUBLIC_TURNSTILE_SITE_KEY
                            + TURNSTILE_SECRET_KEY entries).
- docs/integrations.md → "Supabase Auth Configuration" — confirm current
                          toggle state + the dependent-task row for this
                          task.
- docs/qa-rules.md
- docs/ui-rules.md        → typography, spacing, alert/inline-message
                            patterns, accessibility patterns.
- docs/component-rules.md → reusable component standards; design-token
                            usage; locale rules.
- docs/ai-behavior.md → Note 19 (UX Flow Preservation — both signup AND
                        forgot-password flows must keep working
                        end-to-end with the captcha addition; every
                        existing state preserved), Note 20 (no silent
                        control removal — the captcha is an ADDITION
                        below the existing controls, not a replacement).
- Cloudflare Turnstile docs (read-only summary; do NOT WebFetch from a
  blocked domain — refer to public docs at
  https://developers.cloudflare.com/turnstile/ for the latest):
  - Client widget loads via `https://challenges.cloudflare.com/turnstile/v0/api.js`
    (script tag in `<head>` or via `react-turnstile` wrapper).
  - Widget renders into a div with `data-sitekey="<NEXT_PUBLIC_TURNSTILE_SITE_KEY>"`
    and emits a `token` via callback.
  - Server-side `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`
    with form body `secret=<TURNSTILE_SECRET_KEY>&response=<token>&remoteip=<optional>`
    returns `{ success: boolean, ... }`.
  - Tokens are single-use, 5-minute validity. Server MUST consume them
    exactly once per signup / password-reset request.
- src/modules/auth/components/AuthSheet.tsx — host surface (this is the
  only file currently containing the signup AND forgot-password forms).

Strategy decision (orchestrator, 2026-05-28):

- **Widget library:** use the official `@marsidev/react-turnstile`
  package (well-maintained, ~10 KB, React 18+ compatible, has an
  imperative reset API needed for retry-after-failure UX). Alternative:
  hand-rolled wrapper around the api.js script. STOP & ASK if there is
  a project preference against new auth dependencies (none in
  `docs/dependencies.md` as of 2026-05-28; verify).
- **Mode:** Cloudflare-managed (invisible unless suspicious). UX-friendly default.
- **Server-side verification:** use `fetch` with `cache: 'no-store'` to
  Cloudflare's `/siteverify` endpoint. Do NOT skip the server-side
  re-verification — Supabase's verification (when the dashboard toggle
  is ON) is a second line; ours is the first.
- **Token transport:** the client passes the token to the server action
  AS PART OF the existing signUp / requestPasswordReset call signature
  via a thin server-action wrapper. The Supabase client SDK's
  `signUp` and `resetPasswordForEmail` accept an `options.captchaToken`
  field — pass the token THROUGH to Supabase as well (so when the
  Dashboard toggle is ON, Supabase verifies the token a second time).
- **Two-layer verification rationale:** if our server-side re-verify
  fails, return early with `{ ok: false, reason: 'captcha_failed' }` —
  do NOT call Supabase. If our re-verify succeeds but Supabase rejects
  (e.g. token expired between our verify and Supabase's verify, or
  Dashboard secret mismatch), surface that as a generic captcha error.

Current behavior to preserve:
- `signIn(email, password)` (login) — do NOT add captcha to login. Captcha on login is poor UX (legitimate users authenticate hundreds of times per year) and Supabase's auth-side rate limit already handles login brute force. Out of scope for this task.
- `requestPasswordReset(email, redirectTo)` (forgot-password) — current flow at `AuthSheet.tsx:189` keeps working; the captcha is added ABOVE the submit button.
- `signUp(email, password, options)` (register) — current flow at `AuthSheet.tsx:554` keeps working; the captcha is added ABOVE the submit button.
- `AuthSheet.tsx`'s tabs (login / signup / forgot-password), validation, error toasts, success states, redirects — all preserved unchanged.
- `AuthSheet.tsx`'s OAuth (Google) flow — do NOT add captcha to OAuth; the OAuth provider has its own bot protection.
- All other auth-related files (`browser.ts`, `ResetPasswordClient.tsx`, `AuthRedirect.tsx`, recovery flow) — do NOT touch.
- The cabinet password-change form (new in Task 273) — do NOT add captcha; the user is already authenticated.
- The `RegisterForm.tsx` mentioned in `docs/integrations.md` — verify whether it still exists at `src/modules/auth/components/RegisterForm.tsx` or whether signup happens exclusively through `AuthSheet.tsx`. If `RegisterForm.tsx` exists and is a live entry point, ADD the captcha there too (same pattern). STOP & ASK if there are unclear duplicate entry points.

Required after behavior:

1. NEW env vars (added to `docs/env.md`):
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — public site key, exposed to the
     client (per `NEXT_PUBLIC_` rule). Obtained from Cloudflare Dashboard
     → Turnstile → Site Key.
   - `TURNSTILE_SECRET_KEY` — server-only secret. Obtained from
     Cloudflare Dashboard → Turnstile → Secret Key. Used by the
     server-side verification helper.
   - Owner sets both in Vercel (or Cloudflare Pages) → Settings → Environment
     Variables. The dev fallback (when the var is absent) is documented
     below.

2. NEW shared verification helper at
   `src/lib/captcha/verifyTurnstile.ts`:
   - Exports `async function verifyTurnstile(token: string, remoteIp?: string): Promise<{ success: boolean; errorCodes?: string[] }>`.
   - Implementation: `fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: <urlencoded form>, cache: 'no-store' })`. Parses Cloudflare's response JSON. Returns `{ success: false, errorCodes: ['missing-secret'] }` when `TURNSTILE_SECRET_KEY` is absent (dev fallback — see below). Never throws; catches all errors and returns `{ success: false, errorCodes: ['internal-error'] }`.
   - Dev fallback: when `TURNSTILE_SECRET_KEY` is absent AND `NODE_ENV !== 'production'`, return `{ success: true }` immediately (so local dev without keys still works). Log a one-time `console.warn('[captcha] TURNSTILE_SECRET_KEY not set — captcha verification skipped (dev only).')`. In production, the absence of the key is a configuration error and verification ALWAYS fails (`{ success: false, errorCodes: ['missing-secret'] }`).

3. NEW shared client component at
   `src/components/auth/CaptchaWidget.tsx`:
   - Wraps `@marsidev/react-turnstile`'s `<Turnstile>` (or, if STOP & ASK rules out the dep, a hand-rolled wrapper around the script API).
   - Props: `{ onSuccess: (token: string) => void; onError?: () => void; onExpire?: () => void; theme?: 'light' | 'dark' | 'auto' }` — defaults to `theme: 'auto'`.
   - Loads `NEXT_PUBLIC_TURNSTILE_SITE_KEY` from env. If the env var is absent: render a small inline note `t('auth.captcha_not_configured')` and immediately call `onSuccess('dev-noop-token')` — server-side `verifyTurnstile` recognizes `'dev-noop-token'` ONLY when `NODE_ENV !== 'production'` AND `TURNSTILE_SECRET_KEY` is absent (dual-key guard). In production, this dev fallback NEVER triggers.
   - Includes a `ref` exposing a `reset()` method (`useImperativeHandle`) so the form parent can reset the widget after a failed submission.
   - 4-locale aria-label `t('auth.captcha_aria_label')`.

4. NEW server-action wrappers (one per protected endpoint) at
   `src/modules/auth/actions/captcha.ts` (NEW file):
   - `async function signUpWithCaptcha({ email, password, captchaToken, options })` — calls `verifyTurnstile(captchaToken)` first; if `success: false`, returns `{ ok: false, reason: 'captcha_failed' }`. On verify success, calls `supabase.auth.signUp({ email, password, options: { ...options, captchaToken } })` (passes the token through to Supabase per strategy). Returns the Supabase result wrapped in `{ ok: true, data } | { ok: false, reason: 'captcha_failed' | 'signup_failed', supabaseError? }`.
   - `async function requestPasswordResetWithCaptcha({ email, captchaToken, redirectTo })` — same pattern, calls `supabase.auth.resetPasswordForEmail(email, { redirectTo, captchaToken })`. Returns `{ ok: true } | { ok: false, reason: 'captcha_failed' | 'reset_failed', supabaseError? }`.
   - Both wrappers run server-side (so the secret never leaves the server) and are invoked from `AuthSheet.tsx` via Next.js Server Actions or a thin POST API route — match whichever pattern the existing cabinet actions use (server actions preferred; consistency wins).

5. `AuthSheet.tsx` edits:
   - **Signup tab:** import `<CaptchaWidget>`; render it ABOVE the submit button; collect the token into local state; pass it to `signUpWithCaptcha` instead of the direct `signUp` call. Disable the submit button while `captchaToken === null`. On submission failure (`{ ok: false, reason: 'captcha_failed' }`): reset the widget, show inline error `t('auth.captcha_error_failed')`, do NOT clear the email/password fields. On success: existing redirect / success state preserved.
   - **Forgot-password tab:** same pattern. Captcha widget above the "Send reset link" button. Token required. Server-action wrapper. On captcha failure: reset widget + inline error. On success: existing "Email sent" state preserved.
   - **Login tab:** unchanged (no captcha on login per strategy).
   - **OAuth (Google) button:** unchanged.
   - Section labels / placement: the captcha widget is placed in a
     `<div>` with `className="my-3"` (or matching existing form gap)
     directly above the submit `<Button>` in each affected tab.

6. New locale keys (×4 locales — sq/en/uk/it, same key set):
   - `auth.captcha_aria_label`
   - `auth.captcha_error_failed`
   - `auth.captcha_not_configured` (dev-only inline note)
   - = 3 new keys × 4 locales = 12 entries.

7. NO changes to: `src/lib/auth/browser.ts`, `ResetPasswordClient.tsx`, `AuthRedirect.tsx`, recovery flow, cabinet flows, admin flows, or any other surface.

Positive flow (happy path) — signup:
- Anonymous user opens `/sq/auth/register` (or AuthSheet → signup tab).
- User fills email + password (rules ✓) → CaptchaWidget loads → user
  completes the (likely invisible) challenge → CaptchaWidget calls
  `onSuccess(token)` → `captchaToken` state populated → submit button
  enables → user clicks submit.
- Client calls `signUpWithCaptcha({ email, password, captchaToken })`.
- Server: `verifyTurnstile(captchaToken)` → `{ success: true }`. Server
  calls `supabase.auth.signUp(...)` with the same token in
  `options.captchaToken`. Supabase verifies independently (when dashboard
  toggle is ON) and creates the user. Returns user data.
- Client: existing post-signup flow (email confirmation prompt / redirect)
  preserved unchanged.

Positive flow (happy path) — forgot-password:
- Anonymous user opens AuthSheet → forgot-password tab → fills email →
  completes captcha → submit enables → submits.
- Server-side wrapper verifies captcha → calls
  `supabase.auth.resetPasswordForEmail(...)` → Supabase sends recovery
  email via the Send Email Hook (Epic D.6 / Task 122).
- Client: existing "check your inbox" state preserved.

Negative flow (every off-happy-path branch):
- **Empty email / invalid email / weak password (signup) / empty email (forgot)** — existing client-side validation rejects before captcha is even checked; submit button stays disabled; no captcha or server call.
- **Captcha widget hasn't completed yet** — submit button disabled (`captchaToken === null`); user is prompted by the captcha to complete it.
- **Captcha widget failed to load (network / Cloudflare outage / adblock)** — `<CaptchaWidget>`'s internal error state triggers `onError` → inline error `t('auth.captcha_error_failed')`; widget shows its own retry UI; submit stays disabled until the widget recovers OR the user reloads the page.
- **Captcha token expired before submit** (>5 min) — Cloudflare's widget auto-fires `onExpire`; client sets `captchaToken = null` → submit re-disabled → user must complete captcha again. Inline note `t('auth.captcha_error_failed')` (reuse the same key).
- **Server-side `verifyTurnstile` returns `{ success: false }`** — server action returns `{ ok: false, reason: 'captcha_failed' }`. Client: resets the widget, shows inline error `t('auth.captcha_error_failed')`. Email/password fields preserved; user can retry without re-entering them.
- **`TURNSTILE_SECRET_KEY` missing in production** — `verifyTurnstile` returns `{ success: false, errorCodes: ['missing-secret'] }`. Client surfaces the same generic captcha error (do NOT leak `missing-secret` to the user). Sentry breadcrumb logged with the actual error code for ops visibility.
- **`NEXT_PUBLIC_TURNSTILE_SITE_KEY` missing** — widget renders the dev-only inline note `t('auth.captcha_not_configured')` AND auto-calls `onSuccess('dev-noop-token')`. Server-side `verifyTurnstile('dev-noop-token')` returns `{ success: true }` ONLY when NODE_ENV !== 'production' AND TURNSTILE_SECRET_KEY is absent. In production with the site key absent (a configuration error), the dev-noop path is DISABLED — the user sees the inline note but the submit button stays disabled and the server-side verify rejects the dev token.
- **Supabase signup fails (duplicate email, password too weak per dashboard rules, network error)** — `signUpWithCaptcha` returns `{ ok: false, reason: 'signup_failed', supabaseError }`. Client surfaces the existing signup-error toast (whichever locale key already exists in `AuthSheet.tsx` for that error class — do NOT duplicate). Captcha widget is reset so the user can retry (the captcha token has now been consumed by Supabase OR by our verify; either way it's spent).
- **Supabase reset-password fails (rate limit, invalid email)** — same pattern: reset widget, surface existing locale key.
- **Network offline at submit time** — server action throws; client catches → surface generic error key (existing); reset widget.
- **User switches tab mid-captcha** (signup → login → signup) — captcha widget unmounts and remounts; new token required. Existing state.
- **Adblock / privacy extension blocking Cloudflare** — widget fails to load; same path as "failed to load" above.
- **Bot attempts to skip the captcha by calling the server action directly without a token** — server action: `if (!captchaToken) return { ok: false, reason: 'captcha_failed' }`. Defense in depth.
- **Locale switch mid-form** — captcha widget re-renders with the new theme/locale; widget state preserved if Cloudflare's API supports it; if not, user must re-complete (acceptable — explicit in the negative-flow contract).
- **Mobile viewport at 320px in `uk`** — captcha widget should be either small variant (`size="compact"`) OR responsive; ensure no horizontal overflow.

Required investigation (paste outputs into the Task 274 session log):

1. Confirm the existing imports + entry-point structure in AuthSheet:
   ```
   grep -n "import\|signUp\|resetPasswordForEmail\|requestPasswordReset" src/modules/auth/components/AuthSheet.tsx | head -40
   ```

2. Confirm RegisterForm.tsx existence (mentioned in integrations.md):
   ```
   find src -name "RegisterForm*"
   ```
   If a separate live entry point exists, this task also touches it.

3. Confirm whether `@marsidev/react-turnstile` is already in
   package.json:
   ```
   grep -n "turnstile" package.json
   ```

4. Confirm there are no other existing captcha implementations in the
   project (avoid duplication):
   ```
   grep -rn "captcha\|turnstile\|hcaptcha\|recaptcha" src/ --include="*.ts" --include="*.tsx"
   ```

5. Confirm the existing AuthSheet inline-error and toast patterns to
   match the visual style:
   ```
   grep -n "Alert\|toast\." src/modules/auth/components/AuthSheet.tsx | head -10
   ```

6. Confirm the existing locale key namespace for auth strings:
   ```
   grep -n "\"auth\":" messages/sq.json | head -5
   ```

7. Decide between Server Actions and an API route for the wrappers
   (whichever already dominates `src/modules/auth/actions/`):
   ```
   ls src/modules/auth/actions/
   ```

Scope (files Sonnet may touch):

1. `src/lib/captcha/verifyTurnstile.ts` — NEW file (shared server-side verification helper).
2. `src/components/auth/CaptchaWidget.tsx` — NEW file (shared client widget).
3. `src/modules/auth/actions/captcha.ts` — NEW file (server-action wrappers).
4. `src/modules/auth/components/AuthSheet.tsx` — integrate the captcha into signup + forgot-password tabs.
5. (Conditional) `src/modules/auth/components/RegisterForm.tsx` — if it exists as a separate live entry point.
6. `package.json` — add `@marsidev/react-turnstile` (unless STOP & ASK overrides for hand-rolled wrapper).
7. `messages/sq.json` + `messages/en.json` + `messages/uk.json` + `messages/it.json` — 3 new keys each.
8. `docs/env.md` — add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` rows + dev-fallback note.
9. `docs/integrations.md` → "Supabase Auth Configuration" → dependent-task row for "Captcha protection on signup + password-reset endpoints" → change status from "Pending" to "Filed (Task 274)" + cross-reference link. Do NOT flip the "Captcha protection" cell from "OFF (interim)" to "ON" — that's the OWNER'S action after this task ships.
10. `docs/dependencies.md` — add `@marsidev/react-turnstile` to the approved list with rationale.
11. `docs/backlog.md` — standard task-closure update.
12. `docs/sessions/2026-05-28-task-274-captcha-integration.md` — NEW session log per Task 264 contract.

Out of scope (do NOT touch):
- `src/lib/auth/browser.ts` (consume `signUp` / `requestPasswordReset` indirectly through the new server-action wrappers; do NOT modify the helpers themselves).
- Login flow (no captcha on login per strategy).
- OAuth (no captcha on OAuth).
- `ResetPasswordClient.tsx` (recovery completion flow — user is mid-flow; no captcha).
- Cabinet flows (Task 273 — separate).
- Admin flows.
- Email templates.
- Supabase Dashboard toggle flip (owner action AFTER this task ships).
- Setting the actual env values (owner action — code reads them, does not set them).

Acceptance criteria (literal):
- `src/lib/captcha/verifyTurnstile.ts` exists, exports `verifyTurnstile(token, remoteIp?)`, returns the typed result, dev-fallback works as documented, production with missing key fails closed.
- `src/components/auth/CaptchaWidget.tsx` exists, renders the Turnstile widget, exposes a `reset()` ref method, has localized aria-label, dev-fallback inline note when site key absent.
- `src/modules/auth/actions/captcha.ts` exports `signUpWithCaptcha` and `requestPasswordResetWithCaptcha` with the documented signatures.
- `AuthSheet.tsx` signup tab and forgot-password tab both: render the captcha widget above the submit button, disable submit until token is present, call the new wrappers, handle the captcha-failure negative flow with widget reset + inline error.
- Login tab and OAuth button unchanged (verified via diff: no edits to those code paths).
- `package.json` includes `@marsidev/react-turnstile` (OR an alternative if STOP & ASK overrode; document in session log).
- `docs/env.md` documents both env vars + dev-fallback behavior.
- `docs/integrations.md` row for "Captcha protection" → status updated to "Filed (Task 274)"; cell for "Captcha protection" toggle still reads "OFF (interim)" (only the owner flips it).
- `docs/dependencies.md` justifies the new package.
- 3 new locale keys × 4 locales = 12 entries; same key set across `messages/{sq,en,uk,it}.json`.
- Mobile usability at 320px in `uk`: captcha widget does not overflow horizontally; `size="compact"` if needed.
- All 7 breakpoints walked.
- Positive + Negative flow parity (every branch above has a verifiable diff line).
- Note 18 self-validation block: tsc=0, AC table all green, runtime locale=uk PASS, scope=clean.
- Note 20 inventory: signup tab + forgot-password tab before/after — only the captcha + submit button gating changes; nothing else removed.
- "Files Changed" table per Task 264 (11-15 files depending on conditional `RegisterForm.tsx`).

Final report required from Sonnet:
1. Files Changed table.
2. Positive flow runtime trace for signup AND forgot-password (screenshots or text walks).
3. Negative-flow audit table: one row per branch → file:line of handler.
4. Locale-key parity: 3 keys × 4 locales = 12 entries; per-file key counts.
5. Note 18 self-validation verdict line.
6. Note 20 AuthSheet before/after control inventory for the two affected tabs.
7. Confirmation that login tab + OAuth + recovery flow + cabinet flows are unchanged (grep evidence).
8. The strategy decision (`@marsidev/react-turnstile` vs hand-rolled) made AND why.

Do NOT emit `git add` / `git commit` commands. Do NOT run git. Do NOT
flip the Supabase Dashboard toggle. Do NOT set env var values; only
document them.
```
