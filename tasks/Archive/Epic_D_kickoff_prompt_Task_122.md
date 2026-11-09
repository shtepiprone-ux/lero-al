# Kickoff prompt — Task 122 (Epic D.6 — delegate Supabase Auth emails via Send Email Hook)

> THE GOAL behind "Supabase should not email new users directly."
> Requires Task 120 (VerifyEmail) + Task 121 (RecoveryEmail) done first.
> NOTE: there is NO supabase/functions infra in the repo yet — this creates it.

---

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context:
We are continuing Epic D — Email Infrastructure & Account Lifecycle.
Previous: Task 119 (foundation), Task 120 (VerifyEmail), Task 121 (RecoveryEmail). All on origin/main.
This task must be documented as Task 122. Do not rename it to Task D.6. Preserve global task numbering.

GOAL: Delegate ALL of Supabase's user-facing auth emails to our system via the Supabase Send Email Hook, so Supabase stops sending its own default emails and our branded Resend + React Email templates are used instead. After this task, regular users receive ONLY our emails.

Scope boundary (owner clarified 2026-05-20):
- This task touches ONLY user-facing auth emails (LEVEL 1): signup confirm, recovery, magic link, email change, reauthentication.
- Supabase ACCOUNT-level service/security emails (LEVEL 2 — project changes, security alerts, billing → sent to the DB owner) are NOT touched. They already go only to the owner. Do not attempt to reroute/suppress them.

Required pre-read before implementation:
1. tasks/Epics/Epic_D_Email_Infrastructure_and_Account_Lifecycle.md — Task D.6 scope.
2. docs/integrations.md — "Supabase Auth emails — delegation" + "Two distinct email levels" + Email Template Architecture + Locale-aware sending.
3. docs/ai-behavior.md — Canonical Task Template, Auth Lifecycle Rules, Pre-Task Mandatory Checklist.
4. Always-governed: docs/env.md, docs/rls-rules.md.
5. Existing email system (reuse, do not duplicate):
   - src/modules/notifications/lib/emails/send.ts (sendEmail), resolveUserLocale.ts
   - src/modules/notifications/lib/emails/VerifyEmail.tsx + getVerifyEmailStrings (Task 120)
   - src/modules/notifications/lib/emails/RecoveryEmail.tsx + getRecoveryEmailStrings (Task 121)
   - src/modules/notifications/lib/emails/emailChange.ts
6. Supabase docs: "Send Email Auth Hook" + auth email templates. The hook POSTs `{ user, email_data: { token, token_hash, email_action_type, redirect_to, site_url, ... } }` to your endpoint; your code renders + sends the email and returns success.
7. Inspect package.json + how Supabase clients are created (src/lib/supabase/*).

Localization coverage required:
- sq, en, uk, it — the hook selects the recipient's locale via preferred_locale (resolveUserLocale) and renders the correct template language.

Responsive coverage: Email render only (templates already mobile-friendly).

Task scope (Task 122 — Epic D.6):
1. Decide the hook target architecture and DOCUMENT it:
   - Option A: a Supabase Edge Function (new supabase/functions/ infra — none exists yet; needs Supabase CLI + deploy).
   - Option B: an HTTPS endpoint in the Next app (e.g. src/app/api/auth-email-hook/route.ts) that Supabase calls as the hook URL, secured with the hook secret.
   Pick the one that best fits this project's deploy model (the app is on Vercel — a Next route may be simpler than managing Edge Function deploys). Justify in the session log.
2. Implement the hook handler:
   - Verify the hook signature/secret (Supabase signs Send Email Hook requests — validate them; store the secret in env, document in docs/env.md).
   - Map `email_action_type` → our template: signup/confirmation → VerifyEmail; recovery → RecoveryEmail; email_change → emailChange templates; magic link / reauthentication → appropriate template (create minimal ones if needed, same BaseEmail pattern).
   - Build the correct action URL from `token_hash` + `redirect_to` + `email_action_type` (per Supabase verify URL format) so the links actually confirm.
   - Resolve recipient locale via resolveUserLocale(user.id) and render the template in that language.
   - Send via the canonical sendEmail() helper.
3. Owner action (document precise steps — the agent cannot do these in the Supabase dashboard):
   - Register the Send Email Hook URL + secret in Supabase Dashboard → Authentication → Hooks.
   - If Edge Function chosen: how to deploy it.
   - Confirm the hook is enabled and built-in templates are now delegated.
4. After the hook is verified working end-to-end: confirm regular users no longer receive Supabase's default emails (only ours). Do NOT toggle off "Confirm email" — the hook replaces DELIVERY, Supabase still owns token validation + email_confirmed_at.
5. Update docs/integrations.md to reflect the final implementation (hook type, endpoint, env secret, action-type→template map).

Acceptance criteria:
- Hook handler implemented + signature/secret verified; env secret documented.
- email_action_type correctly mapped to VerifyEmail / RecoveryEmail / emailChange (+ magic link / reauth if applicable).
- Action URLs built correctly so confirmation/recovery links work end-to-end.
- Recipient locale resolved via preferred_locale; emails render in the user's language.
- Sends go through the canonical sendEmail() helper (no new `new Resend(...)`).
- LEVEL 2 owner/service emails untouched.
- Dashboard registration steps documented for the owner.
- After hook live: no duplicate/default Supabase emails to regular users (documented verification).
- 0 new lint errors / 0 new warnings; governance:localization PASS; typecheck no new errors.
- npm run build is the user's manual step.
- Session log: docs/sessions/YYYY-MM-DD-task-122-supabase-email-hook.md.
- docs/backlog.md updated.
- Commit + push when green.

Out of scope (do NOT touch in Task 122):
- Admin email template manager (Task 123 = D.2).
- Inactivity emails (Task 124 = D.5).
- LEVEL 2 Supabase account/service emails.

Follow every rule in docs/ai-behavior.md. Do not skip the Pre-Task Mandatory Checklist. Do not start Task 123 in this run.
```

---

## Owner pre-req for this task

Before running Task 122, make sure you have access to **Supabase Dashboard → Authentication → Hooks** (you'll register the hook URL + secret there — Sonnet writes the code, you flip the switch).
