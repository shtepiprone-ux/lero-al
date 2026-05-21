# Kickoff prompt — Task 121 (Epic D.4 — password / login recovery)

> Builds on Task 119 (foundation) + Task 120 (verification). Same template + double-email-guard pattern.
> NOTE: there is currently NO recovery flow in the app (no resetPasswordForEmail, no forgot/reset pages) — this builds it from scratch.

---

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context:
We are continuing Epic D — Email Infrastructure & Account Lifecycle.
Previous: Task 119 (foundation), Task 120 (email verification). Both on origin/main.
This task must be documented as Task 121. Do not rename it to Task D.4. Preserve global task numbering.

There is currently NO password recovery flow in the project (no `resetPasswordForEmail` call, no forgot/reset pages). Build it.

CRITICAL coordination — avoid double emails (same rule as Task 120):
Calling `supabase.auth.resetPasswordForEmail()` makes Supabase send its OWN built-in recovery email. We will delegate that to our RecoveryEmail template via the Send Email Hook in Task 122 (D.6). Until D.6 ships, Supabase sends its built-in recovery email. Task 121 builds the forgot/reset UI + the RecoveryEmail TEMPLATE; it does NOT add a second parallel email and does NOT disable Supabase's built-in one. Document this.

Required pre-read before implementation:
1. tasks/Epics/Epic_D_Email_Infrastructure_and_Account_Lifecycle.md — Task D.4 scope.
2. tasks/Epics/Epic_D_email_design_reference.html — approved visual design.
3. docs/integrations.md — Email Template Architecture + Locale-aware sending + Supabase auth delegation.
4. docs/ai-behavior.md — Canonical Task Template, Auth Lifecycle Rules, Localization Rules, UI Primitive Anti-Patterns, Pre-Task Mandatory Checklist.
5. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md.
6. Task 119 + 120 outputs (build on these directly):
   - src/modules/notifications/lib/emails/BaseEmail.tsx (locale prop + BRAND_ACCENT)
   - src/modules/notifications/lib/emails/VerifyEmail.tsx (the pattern to mirror — inline STRINGS + getXEmailStrings export)
   - src/modules/notifications/lib/emails/send.ts, resolveUserLocale.ts
   - src/app/[locale]/auth/verified/page.tsx (landing-page pattern to mirror)
   - docs/sessions/2026-05-20-task-120-email-verification.md
7. Auth flow: src/lib/auth/browser.ts, src/app/auth/callback/route.ts, src/modules/auth/components/AuthSheet.tsx (LoginView — add a "Forgot password?" entry point).
8. Inspect package.json for validation scripts.

Localization coverage required:
- sq, en, uk, it
- RecoveryEmail uses INLINE STRINGS (sq/en/uk/it) like VerifyEmail — export getRecoveryEmailStrings() for the D.6 hook.
- Forgot-password form + reset-password page UI use messages/*.json (next-intl) — add keys to ALL four locale files.
- Email locale via resolveUserLocale.

Responsive coverage:
- Email render: mobile-friendly (BaseEmail).
- Forgot-password form + reset-password page: 320, 375, 390, 768, 1280, 1440, 2560 (app UI). Use canonical primitives (Button, Input, Sheet/Dialog or page) — no raw elements.

Task scope (Task 121 — Epic D.4):
1. Forgot-password entry: add a "Forgot password?" link in the AuthSheet LoginView that opens a forgot-password view/form (email input). On submit, call `supabase.auth.resetPasswordForEmail(email, { redirectTo: .../auth/reset-password })`. Errors follow the Epic A error-code contract.
2. Reset-password page: src/app/[locale]/auth/reset-password/page.tsx — handles the recovery link, lets the user set a new password (validation), then `supabase.auth.updateUser({ password })`. Localized success/expired/invalid states (4 locales, 7 breakpoints).
3. RecoveryEmail React Email template wrapping BaseEmail, matching the design reference (heading, body, single coral CTA "Reset password", monospace fallback link, expiry + ignore note). Inline STRINGS sq/en/uk/it. Export getRecoveryEmailStrings().
4. Security logging: log recovery attempts (request + completion) per docs/rls-rules.md / data-access-rules — without leaking whether an email exists (the forgot-password form should give the same neutral response regardless of whether the email is registered).
5. DO NOT add a parallel recovery email or disable Supabase's built-in one — RecoveryEmail is prepared for D.6 delivery. Add a short "how D.6 wires this" note in the session log.

Acceptance criteria:
- Forgot-password flow works end-to-end (request → Supabase recovery email → reset-password page → new password set), all 4 locales.
- RecoveryEmail template renders on BaseEmail in all 4 locales, matching the approved design (coral accent from BRAND_ACCENT).
- Neutral response on forgot-password (no email-enumeration leak).
- Token expiry + reuse protection (rely on Supabase's recovery token).
- Security logging in place.
- NO double emails: Supabase built-in recovery untouched; RecoveryEmail prepared for D.6; documented.
- 0 new lint errors / 0 new warnings.
- governance:localization PASS (new UI keys in all 4 files; email STRINGS inline).
- governance:responsive PASS for new pages at all 7 breakpoints.
- npm run typecheck — no new errors.
- npm run build is the user's manual step.
- Session log: docs/sessions/YYYY-MM-DD-task-121-password-recovery.md.
- docs/backlog.md updated.
- Commit + push when green (lesson from the 2026-05-20 corruption incident).

Out of scope (do NOT touch in Task 121):
- Registering the Send Email Hook / disabling Supabase emails (Task 122 = D.6).
- Admin email template manager (Task 123 = D.2).
- Inactivity emails (Task 124 = D.5).

Follow every rule in docs/ai-behavior.md. Do not skip the Pre-Task Mandatory Checklist. Do not start Task 122 in this run.
```
