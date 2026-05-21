# Kickoff prompt — Task 120 (Epic D.3 — email verification)

> Epic D.1 (foundation) shipped as Task 119. This is the first REAL template on BaseEmail.
> Order chosen 2026-05-20: D.3 → D.4 → D.6 first (fastest path to disabling Supabase auto-emails).

---

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context:
We are continuing Epic D — Email Infrastructure & Account Lifecycle.
Epic D.1 (foundation: BaseEmail, send helper, preferred_locale, resolveUserLocale) shipped as Task 119 (commit 40c0371c7, on origin/main).
This task must be documented as Task 120. Do not rename it to Task D.3. Preserve global task numbering.

This is the FIRST real transactional template built on the BaseEmail foundation.

CRITICAL coordination — avoid double emails (read carefully):
Supabase Auth currently sends its OWN built-in "Confirm signup" email automatically. We will delegate that to our system in Task 122 (Epic D.6, Send Email Hook). Until D.6 ships, Supabase keeps sending its built-in confirm email.
Therefore Task 120 MUST NOT add a second, parallel verification email that fires on registration in addition to Supabase's — that would send users TWO emails, and disabling Supabase's confirm now (without the Hook) would create an auto-confirm security hole.
Task 120 scope is: build the VerifyEmail TEMPLATE + the verification status tracking + the confirm landing page/route + the BaseEmail lang fix. The template gets WIRED FOR DELIVERY via the Send Email Hook in D.6 (Task 122). Do NOT flip Supabase "Confirm email" off in this task. Document this clearly in the session log.

Required pre-read before implementation:
1. tasks/Epics/Epic_D_Email_Infrastructure_and_Account_Lifecycle.md — Task D.3 scope + the carry-over note about BaseEmail lang.
2. tasks/Epics/Epic_D_email_design_reference.html — approved visual design.
3. docs/integrations.md — Email Template Architecture + Locale-aware sending + Supabase auth delegation sections.
4. docs/ai-behavior.md — Canonical Task Template, Auth Lifecycle Rules, Localization (i18n) Rules, Pre-Task Mandatory Checklist.
5. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md.
6. Task 119 outputs — read them fully, you build directly on these:
   - src/modules/notifications/lib/emails/BaseEmail.tsx (layout + BRAND_ACCENT/BRAND_AA)
   - src/modules/notifications/lib/emails/send.ts (sendEmail helper)
   - src/modules/notifications/lib/emails/resolveUserLocale.ts
   - src/modules/notifications/lib/emails/emailChange.ts (reference for inline STRINGS + how it now calls sendEmail)
   - docs/sessions/2026-05-20-task-119-email-provider-setup.md
7. Auth flow: src/lib/auth/browser.ts, src/app/auth/callback/route.ts, src/modules/auth/components/AuthSheet.tsx.
8. src/types/database.ts (User shape — has preferred_locale; check for any email_verified/verified field).
9. Inspect package.json for validation scripts.

Localization coverage required:
- sq, en, uk, it
- VerifyEmail uses INLINE STRINGS (sq/en/uk/it) like emailChange.ts — NOT messages/*.json.
- Any user-facing UI on the confirm landing page uses messages/*.json (next-intl) and must add keys to ALL four locale files.
- Locale for the email is chosen via resolveUserLocale.

Responsive coverage:
- Email render: mobile-friendly (BaseEmail already handles this).
- Confirm landing page: 320, 375, 390, 768, 1280, 1440, 2560 (it IS app UI).

Task scope (Task 120 — Epic D.3):
1. Fix BaseEmail to accept a `locale` prop and set `<Html lang={locale}>` (carry-over from Task 119, which hardcoded lang="sq"). Update emailChange.ts callers to pass locale. Default 'sq' if not provided.
2. Create VerifyEmail React Email template wrapping BaseEmail, matching the design reference:
   - Heading, body, single coral CTA ("Confirm email address"), monospace fallback link, expiry + ignore note, footer (from BaseEmail).
   - Inline STRINGS for sq/en/uk/it. Suggested copy is in the design reference (English) — translate for the other three.
3. Verification status tracking:
   - Determine whether email-verified state should live in Supabase auth (auth.users.email_confirmed_at) or a profile column. Document the decision. Prefer reusing Supabase's native confirmation state if D.6 will drive it via the Hook.
   - Surface unverified status in the admin user view.
4. Confirm landing page/route: handles the verification click (token → mark verified → success UI), with token expiration + reuse protection. Localized UI (4 locales).
5. DO NOT send a parallel verification email on registration in this task (Supabase still sends its built-in one until D.6). Instead, prepare VerifyEmail so D.6's Send Email Hook can render + send it. Add a short "how D.6 will wire this" note in the session log.
6. Optional: add VerifyEmail to the React Email preview server so the design can be eyeballed (`npm run email`).

Acceptance criteria:
- BaseEmail accepts `locale` and sets `lang` accordingly; emailChange.ts passes locale; no hardcoded `sq` lang.
- VerifyEmail template renders on BaseEmail in all four locales, matching the approved design (coral accent from BRAND_ACCENT).
- Verification status visible in admin; verified/unverified UI states defined.
- Confirm landing page works (token validate → mark verified → localized success/expired/invalid states); token expiry + reuse protection.
- NO double emails: Supabase built-in confirm untouched; our VerifyEmail prepared for D.6 delivery, not fired in parallel. Documented.
- 0 new lint errors / 0 new warnings.
- governance:localization PASS (new confirm-page UI keys added to all 4 locale files; email STRINGS stay inline).
- governance:responsive PASS for the confirm page at all 7 breakpoints.
- npm run typecheck — no new errors.
- npm run build is the user's manual step.
- Session log: docs/sessions/YYYY-MM-DD-task-120-email-verification.md.
- docs/backlog.md updated (Last Session + Session Archive row).
- Commit + push when green (lesson from the 2026-05-20 corruption incident: commit/push while the tree is clean).

Out of scope (do NOT touch in Task 120):
- Disabling Supabase "Confirm email" / registering the Send Email Hook (that's Task 122 = D.6).
- Password recovery template (Task 121 = D.4).
- Admin email template manager (Task 123 = D.2).
- Inactivity emails (Task 124 = D.5).

Follow every rule in docs/ai-behavior.md. Do not skip the Pre-Task Mandatory Checklist. Do not start Task 121 in this run.
```

---

## Epic D queue (updated order, 2026-05-20)

- **Task 120** — D.3 — Email verification (this prompt).
- **Task 121** — D.4 — Password / login recovery email.
- **Task 122** — D.6 — Delegate Supabase Auth emails via Send Email Hook (needs D.3 + D.4) ← disables Supabase auto-emails to users.
- **Task 123** — D.2 — Admin email template manager.
- **Task 124** — D.5 — Inactive account warning emails (3 → 12 month).
