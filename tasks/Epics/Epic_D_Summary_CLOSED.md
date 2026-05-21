# Epic D — Email Infrastructure & Account Lifecycle — CLOSED

**Status:** COMPLETE  
**Opened:** 2026-05-19  
**Closed:** 2026-05-21

---

## Goal (achieved)

Centralized email system with admin management: transactional provider, branded templates, verification/recovery/inactivity flows, Supabase built-in email delegation to Resend. Regular users receive ONLY our branded Resend emails.

---

## Tasks completed

| Task | Epic sub | Description | Session log |
|------|----------|-------------|-------------|
| 119 | D.1 | Email foundation: BaseEmail, send helper, preferred_locale, resolveUserLocale, emailChange migration | [log](../../docs/sessions/2026-05-20-task-119-email-provider-setup.md) |
| 120 | D.3 | Email verification: VerifyEmail template, /auth/verified page, admin email badge | [log](../../docs/sessions/2026-05-20-task-120-email-verification.md) |
| 121 | D.4 | Password/login recovery: RecoveryEmail, ForgotPasswordView, /auth/reset-password | [log](../../docs/sessions/2026-05-21-task-121-password-recovery.md) |
| 122 | D.6 | Supabase Send Email Hook: /api/auth-email-hook, Svix verification, MagicLinkEmail, ReauthEmail | [log](../../docs/sessions/2026-05-21-task-122-supabase-email-hook.md) |
| 123 | D.2 | Admin email template manager: email_templates table, CRUD UI, sendTemplatedEmail() helper | [log](../../docs/sessions/2026-05-21-task-123-admin-email-template-manager.md) |
| 124 | D.5 | Inactive account lifecycle: InactivityWarning + InactivityFinal emails, daily cron, soft delete, grace period reactivation | [log](../../docs/sessions/2026-05-21-task-124-inactivity-emails.md) |

---

## Architecture delivered

- **Single send helper**: `sendEmail()` in `src/modules/notifications/lib/emails/send.ts` — one `new Resend(...)`, all emails route through it
- **BaseEmail layout**: branded React Email component (coral strip, logo, footer) shared by all 6 templates
- **Locale-aware**: every email in the recipient's language via `resolveUserLocale(userId)` → `preferred_locale` → sq fallback
- **Supabase hook**: Svix-signed `/api/auth-email-hook` intercepts ALL Supabase auth emails (signup/recovery/magic link/email-change/reauth) and sends branded versions via Resend
- **Admin template manager**: `/admin/email-templates` — DB-driven editable templates for marketing/notification emails; `sendTemplatedEmail()` helper for future E.4/F.3/C.4 tasks
- **Inactivity lifecycle**: daily Vercel Cron → 3-month warning → 12-month soft-delete with 90-day grace period reactivation

## DB migrations required (all documented in session logs)

1. `preferred_locale` column on `users` table (Task 119)
2. `email_templates` table + RLS policies (Task 123)
3. `inactivity_warning_sent_at` column on `users` table (Task 124)

## Owner actions required

- RESEND_API_KEY, SUPABASE_EMAIL_HOOK_SECRET, CRON_SECRET in Vercel env vars
- Supabase Dashboard → Authentication → URL Configuration: Site URL = https://lero.al
- Supabase Dashboard → Authentication → Hooks → Send Email Hook: URL + Secret
- Vercel Cron Jobs: verify `/api/cron/inactivity` appears after deploy
