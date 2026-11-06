# Sprint 30 — Task 333 kickoff (Opus) — Password recovery link lifetime + resend audit + Sonnet fix sub-task

> **You are Opus 4.7 orchestrator / architect / reviewer.** Planning + spec only. Allowed: `docs/`, `tasks/`. Forbidden: `src/`, `messages/`, migrations, scripts. Single-writer git.
>
> **Numbering:** Task 333 = Opus architectural (renumbered from old "332"). Sonnet sub-task ≥ 343. Wave 2 highest priority (users locked out of reset).
>
> **Source:** `issues.md` 2026-05-31 — "Audit password recovery link lifetime + UX architecture" + addendum on resend / Supabase rate-limit.

```
Type:     architecture / auth / UX / bugfix planning
Priority: HIGH (users currently locked out of password reset)
Area:     docs/password-recovery-architecture.md (NEW)
          tasks/Sprints/Sprint_30_kickoff_prompt_Task_<NEXT_FREE>.md (NEW Sonnet ≥ 343)
          docs/sessions/2026-05-31-task-333-password-recovery-architecture.md
```

## Pre-read

1. `docs/agent-contract.md`, `docs/orchestrator-role.md`, `docs/backlog.md`
2. `docs/env.md` (Supabase auth, canonical site URL rule)
3. `docs/domain-rules.md` + `docs/integrations.md` → "Supabase Auth Configuration" + Albanian-only outbound email policy (Epic GG)
4. `docs/rls-rules.md` + `docs/data-access-rules.md` + `docs/qa-rules.md`
5. `docs/ai-behavior.md` → Notes 14 / 18 / 19 / 20 + Auth Lifecycle Rules + No Fake Fixes Policy
6. `tasks/Epics/Epic_D_Email_Infrastructure_and_Account_Lifecycle.md` + `tasks/Epics/Epic_O_Auth_Registration_and_Phone_Input.md`
7. `src/modules/auth/actions/recovery.ts` (logging helpers; line 17 comments mention Supabase Free 3/hr rate limit)
8. `src/modules/auth/components/ResetPasswordClient.tsx`
9. `src/app/auth/callback/route.ts` + `src/app/auth/confirm/route.ts`
10. `src/modules/notifications/lib/emails/RecoveryEmail.tsx`
11. `src/app/api/auth-email-hook/route.ts`
12. `src/lib/auth/server.ts` + `browser.ts` + `authSheet.ts`
13. `src/middleware.ts` (if locale middleware touches /auth/callback)
14. `messages/{sq,en,uk,it}.json` — `auth.*`

## Owner-reported problem

**Part A — link expires too fast:** User pressed "Забув пароль"; received email; clicked ~5 min later → app showed "Це посилання застаріле".

**Part B — resend silently fails:** After expired screen, user requested another recovery email; UI allowed but new email did NOT arrive. Owner suspects Supabase Free-tier limits / Auth rate limits / SMTP limits / OTP throttling.

## Root-cause hypothesis space (Opus must verify each)

**Part A — "expired" mapped from multiple distinct errors:**
1. Supabase OTP/recovery expiry actually set too low (Dashboard → Auth → URL Configuration → OTP expiry — owner-only verification).
2. One-time link consumed by email scanner / link preview / corporate proxy (Gmail link checker, Outlook safe-links, Bitdefender) BEFORE user clicks.
3. New recovery request invalidates older recovery links — user clicks older email.
4. Supabase PKCE code-verifier cookie missing/expired/wrong-domain/wrong-SameSite when callback runs.
5. Locale middleware redirects callback and strips `code` / `token_hash` / hash params.
6. `redirectTo` / Supabase "Site URL" / "Redirect URLs" allowlist mismatch.
7. Reset-password route requires session that was never established; UI shows generic "expired" for every callback failure.
8. Recovery email template URL points to stale domain.
9. Auth callback uses wrong helper (`exchangeCodeForSession` vs `verifyOtp` vs token_hash) for the actual link type sent.

**Part B — "resend silently fails":**
1. Supabase Auth email rate limit hit (default 3/hr/user — Dashboard → Auth → Rate Limits).
2. Supabase default email provider per-project daily limit.
3. Custom SMTP per-day limit (if configured).
4. App suppresses rate-limit / send errors and still shows "Email sent" for neutral UX, hiding the real failure.
5. Email routed to spam / promotions.
6. Production domain / redirect mismatch.

## Owner-dashboard verification checklist (REQUIRED — owner-only; Opus + Sonnet cannot verify without owner)

The Opus session AND the produced Sonnet sub-task MUST surface this checklist as a dedicated "Owner-dashboard verification" block. Opus + Sonnet cannot reliably check Dashboard settings; owner must verify and report. Required items:

1. **Supabase Auth → URL Configuration → email OTP expiry** — current value? Recommend ≥ 1 hour.
2. **Supabase Auth → Rate Limits → password recovery** — current value? (Default 3/hr/user on Free.)
3. **Supabase Auth → Rate Limits → email send** — current per-hour project cap.
4. **Custom SMTP** — is custom SMTP configured? Which provider? Per-day limit?
5. **Supabase Auth → URL Configuration → Site URL + Redirect URLs allowlist** — match production `https://lero.al/*`? Match preview deploys?
6. **Email template URL** — points to `${SITE_URL}/auth/callback` (or canonical equivalent), uses `NEXT_PUBLIC_SITE_URL` not `window.location.origin`?

## Required after behavior

- Reset email clicked within configured expiry → reset form opens; new password works; old password rejected; user re-authenticates.
- Reset email clicked after expiry → localized "expired or invalid" message + visible "Надіслати нове посилання" CTA + cooldown timer.
- Multiple resend clicks → cooldown disables the button; countdown shown; no infinite spam loop.
- Supabase rate-limited request → localized "Забагато спроб. Зачекайте кілька хвилин." (NOT hidden under fake "Email sent").
- Localized note "Перевірте папки Спам/Промоакції" + "Використовуйте посилання з останнього листа" visible on success state and expired state.

## Required Opus output

### 1. Canonical doc `docs/password-recovery-architecture.md`

Sections (per `issues.md`):

1. Purpose
2. Current architecture (forgot → email → click → callback → reset)
3. Current bug hypotheses (all 9 + 6 above; each marked verified / requires-owner-dashboard-verification / ruled-out)
4. Canonical recovery flow
5. Canonical resend policy (cooldown ≥ 30 s, neutral success, rate-limit message, spam-folder hint, latest-link instruction)
6. Error-state UX (invalid / expired / reused / network / rate-limited — each with locale key)
7. Resend-link UX (visible CTA, loading, cooldown timer, no infinite loop)
8. Link lifetime — actual value if discoverable OR owner-dashboard-verification step.
9. Supabase Auth email rate limits — actual value OR owner-dashboard step.
10. Email provider — Supabase default vs custom SMTP (Resend).
11. Locale coverage sq/en/uk/it.
12. Responsive 14-width canon.
13. Accessibility.
14. Security — neutral success (no enumeration); old links invalidated; passwords never logged.
15. Outbound email policy — recovery email body sq-only (Epic GG).
16. **Owner-dashboard verification checklist** (the 6 items above) — embedded in the contract; Sonnet sub-task MUST reproduce this checklist verbatim in its own kickoff so owner sees it during the Sonnet run.
17. Phased Sonnet sub-task scope.

### 2. Sonnet sub-task kickoff (Opus writes file ≥ 343)

Title: `Task <NEXT_FREE> — Sonnet: Fix password recovery link handling, expiry UX, resend cooldown, and reset-password flow`.

The Sonnet sub-task MUST follow Canonical Task Template and include ALL canonical sections: Pre-read · Current behavior to preserve · Required after behavior · **Positive flow · Negative flow** (every branch: rate-limited / expired / reused / scanner-consumed / wrong-callback-route / network offline / locale mismatch in middleware / double-submit / session-already-active / OTP not yet expired but cookie missing) · Implementation · AC (each citing Positive/Negative flow) · Out of scope · Validation (pnpm) · Manual QA · Owner-dashboard verification checklist · Final report.

**Required Sonnet investigation:** reproduce 5-min "expired" claim; test link with email scanner simulator; inspect callback route; check middleware param-preservation; identify actual auth flow (PKCE / token_hash / implicit); confirm `redirectTo` uses `NEXT_PUBLIC_SITE_URL` (NEVER `window.location.origin`).

**Required Sonnet implementation:** distinct error reasons → distinct user-facing messages (no more "expired" for every error); visible cooldown 30–60 s with countdown; localized spam/latest-link note; surface rate-limit errors to UI (not hidden); verify post-success sign-out + redirect to login + new password works + old password rejected; sq/en/uk/it; 14 widths.

### 3. Session log + backlog update

Standard.

## Acceptance criteria for THIS Opus task

- Recovery architecture inspected + summarised.
- All 9 + 6 hypotheses listed; each marked verified / dashboard-required / ruled-out.
- Owner-dashboard verification checklist embedded.
- Canonical recovery + resend flow documented.
- Error-state + resend-link UX defined.
- Locale + responsive + accessibility + security + outbound-email-policy alignment documented.
- Sonnet sub-task kickoff written with ALL canonical sections + checklist reproduction.
- `docs/backlog.md` + session log updated.
- NO `src/` / `messages/` / migration changes.

## Out of scope

- Do NOT redesign full auth UI.
- Do NOT add MFA.
- Do NOT add magic-link login.
- Do NOT change account-deletion (Task 336).
- Do NOT change registration validation.
- Do NOT expose raw Supabase technical errors.
- Do NOT hardcode production URLs.

## Validation

```
rg -n "forgot password|reset password|resetPasswordForEmail|verifyOtp|exchangeCodeForSession|auth/callback|token_hash|type=recovery|expired|застаріле|недійсне" docs tasks src messages
rg -n "rate.limit|throttle|cooldown|resend|email sent|spam|SMTP|mailer|RESEND" docs tasks src messages .env.example
git status --short
```

## Final report

Files changed; recovery architecture summary; root-cause list + verification status; canonical flow; error/resend UX; outbound-email policy compliance; owner-dashboard verification checklist; Sonnet sub-task path; validation; confirmation no `src/` / `messages/` / DB changes; explicit-path owner git commands.
