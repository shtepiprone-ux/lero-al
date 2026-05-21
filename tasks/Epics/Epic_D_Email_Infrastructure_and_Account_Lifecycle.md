# Epic D — Email Infrastructure & Account Lifecycle

**Status:** OPEN
**Opened:** 2026-05-19

## Goal

Build a centralized email system the admin can manage without code changes: pick a transactional provider, build a template manager in the admin, wire it to the existing lifecycle events (verification, recovery, inactivity warnings).

## Dependencies

- D.1 (provider setup) blocks every other task in this epic and Epic C.4 (reporter notification).
- Epic A (locale consistency) should be at least partially done so that email templates can target the recipient's locale deterministically.

## Tasks

### Task D.1 — Transactional email provider setup + React Email foundation + locale-aware plumbing (Task 119)

**Type:** Infrastructure
**Priority:** Critical (blocking)
**Area:** Resend, React Email, send helper, `preferred_locale` profile column, env config
**Kickoff prompt:** `Epic_D_kickoff_prompt_Task_119.md`
**Design reference:** `Epic_D_email_design_reference.html` (approved coral/graphite look)

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/env.md`, `docs/integrations.md` (Email Template Architecture + Locale-aware sending)
2. `docs/dependencies.md` (package selection rules)
3. `src/modules/notifications/lib/emails/emailChange.ts` (reference pattern), `src/middleware.ts`, `src/modules/admin/actions/locale.ts` (locale plumbing), `src/types/database.ts`
4. Existing `resend@^6.12.3` dependency.

**Localization coverage:** sq, en, uk, it (locale-aware sending is core to this task)
**Responsive coverage:** Email render (mobile-friendly)

**Goal:** Confirm Resend; install React Email; build the shared `BaseEmail` layout (per design reference); a single locale-aware send helper; add `preferred_locale` to the profile + `resolveUserLocale(userId)`; migrate `emailChange.ts` onto the helper.

**Acceptance criteria:**
- React Email installed; `BaseEmail` matches the approved design reference (coral `#EC5447` in one constant); preview server runs.
- Single canonical send helper; `new Resend(...)` in exactly one place; renders React → HTML; takes a `locale`.
- `preferred_locale` column added (migration; location confirmed + documented — no `supabase/` folder today), defaulted `sq`, written on locale change + seeded on registration; `resolveUserLocale` implemented.
- `emailChange.ts` routes through the helper, behavior unchanged; graceful no-key fallback preserved.
- Docs updated (`integrations.md`, `env.md`, `dependencies.md`); lint/typecheck/governance:localization pass; session log + backlog updated.

### Task D.2 — Admin email template manager

**Type:** Feature
**Priority:** High
**Area:** Admin panel, templates table, HTML editor

**Pre-read:** D.1, plus Epic K (admin table pattern), `docs/ui-rules.md`, `docs/component-rules.md`
**Localization coverage:** sq, en, uk, it (each template stored per locale)
**Responsive coverage:** 320–2560 (admin editor UX)

**Goal:** Admin creates / edits / previews email templates per locale. Subject + HTML body. Variables (e.g. `{{userName}}`) supported.

**Acceptance criteria:**
- Templates table with RLS rules.
- Per-locale rows; fallback rules documented.
- Preview renders sanitized HTML safely.
- Send-test feature uses the canonical helper from D.1.

### Task D.3 — Email verification after registration

**Type:** Feature
**Priority:** High
**Pre-read:** D.1, D.2, plus `docs/rls-rules.md` (verified status)
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** Email render (narrow widths) + verification page

**Goal:** On registration, send a verification email; user clicks → email marked verified. Unverified status visible in admin. This is the FIRST real template built on `BaseEmail` (Task 119) — follow the approved design reference + the inline-STRINGS (sq/en/uk/it) pattern; pick locale via `resolveUserLocale`.

**Carry-over from Task 119 review:** `BaseEmail` currently hardcodes `<Html lang="sq">`. Make `BaseEmail` accept a `locale` prop and set `lang={locale}` so each email's root lang matches its actual language (email-client + a11y correctness). Update the existing `emailChange.ts` send path to pass locale too.

**Acceptance criteria:**
- Email sent on registration in recipient's locale (via `resolveUserLocale`).
- `BaseEmail` `lang` attribute reflects the email's locale (no hardcoded `sq`).
- Token expiration + reuse protection.
- UI states for unverified users defined.

### Task D.4 — Password / login recovery email

**Type:** Feature
**Priority:** High
**Pre-read:** D.1, D.2, D.3
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** Email render

**Goal:** Recovery email with secure expiring link; log all recovery attempts.

**Acceptance criteria:** Token expiry; rate limit; security logging.

### Task D.5 — Inactive account warning emails (3 months → 12 months)

**Type:** Feature / scheduled job
**Priority:** Medium
**Area:** Background job, lifecycle scheduling, email
**Pre-read:** D.1–D.4, plus `docs/domain-rules.md`
**Localization coverage:** sq, en, uk, it
**Responsive coverage:** Email render

**Goal:** After 3 months of inactivity (`last_seen_at`), send a warning email. At 12 months → **SOFT DELETE** (owner-decided 2026-05-20): `softDeleteUser` + retain data for a documented grace period, reversible within that window. Sent directly via `sendEmail` (NOT via Supabase hook). Locale via `preferred_locale`. Cron via Vercel (`vercel.json` + `CRON_SECRET`).

**Acceptance criteria:**
- Background cron runs deterministically + idempotently; deduplicated via tracking column.
- Warning email at 3 months, final email at 12 months (both code-first on BaseEmail, 4 locales).
- 12-month action = soft delete with documented grace period + reactivation rule in `docs/domain-rules.md`.

### Task D.6 — Delegate Supabase Auth emails to our system (Send Email Hook)

**Type:** Infrastructure / auth
**Priority:** High (the goal that motivated Epic D's prioritization)
**Area:** Supabase Auth config, Send Email Hook, Edge Function, Resend
**Dependencies:** D.1 (send helper) + D.3 (verification template) + D.4 (recovery template) MUST exist first. Do NOT start before them.

**Pre-read:**
1. `docs/ai-behavior.md` (Canonical Task Template, Auth Lifecycle Rules)
2. `docs/integrations.md` (Email Template Architecture + Resend + the Supabase auth-email delegation note)
3. `docs/rls-rules.md`, `docs/env.md`
4. `src/lib/auth/browser.ts` (`signUp`), `src/app/auth/callback/route.ts`, `src/modules/admin/actions/index.ts` (`auth.admin.createUser`)
5. Supabase docs: Send Email Auth Hook (https://supabase.com/docs/guides/auth/auth-email-templates and auth hooks).

**Localization coverage:** sq, en, uk, it (Hook renders our React Email templates in the recipient's locale)
**Responsive coverage:** Email render

**Goal / problem:**
Currently Supabase Auth sends its own built-in "Confirm signup" email automatically to every new user (on `signUp` and on `auth.admin.createUser`). Once our own verification (D.3) and recovery (D.4) emails exist, Supabase's built-in emails are duplicates / unwanted. Delegate ALL auth emails to our system so Supabase stops sending its own and our Resend + React Email templates are used instead. Regular users get OUR emails; Supabase no longer emails them directly.

**Required investigation / steps:**
1. Build a Supabase Send Email Hook target (Edge Function) that receives the auth email payload (user object + email type: signup confirm, recovery, magic link, email change, reauthentication) and sends via our Resend helper using the correct React Email template + recipient locale.
2. Register the Hook in Supabase Dashboard → Authentication → Hooks (this is a USER action in the dashboard — document the exact steps; the agent cannot do it).
3. Map each Supabase auth email type → our template (verification ↔ D.3, recovery ↔ D.4, email-change ↔ existing `emailChange.ts`).
4. Decide handling for `auth.admin.createUser` (admin-created users) — whether they get an invite/verification email or are pre-confirmed.
5. Scope confirmation (owner clarified 2026-05-20): this task ONLY touches **user-facing auth emails** (level 1). Supabase **account-level service/security emails** (level 2) already go to the owner only and must remain untouched — do NOT attempt to reroute or suppress them. No owner-notification feature is required here unless the owner later asks for a "new registration → notify owner" alert (that would be a separate notification, via our Resend helper).
6. Only after the Hook is verified working end-to-end: confirm built-in duplicate emails no longer reach regular users.

**Acceptance criteria:**
- Supabase auth emails are delegated to the Send Email Hook → Resend; no built-in Supabase emails reach regular users.
- Verification, recovery, and email-change emails all render via our React Email templates in the recipient's locale.
- No auto-confirm security hole: email confirmation still required, just delivered by our system.
- Dashboard Hook registration steps documented for the owner.
- "Super admin only" requirement clarified and implemented (owner notification or scoped service emails).
- Session log + `docs/backlog.md` updated.

**Out of scope:** Marketing/broadcast emails; non-auth notifications (those go through the normal Resend helper / admin manager).

## Epic-level acceptance

Provider live; admin can fully manage templates; verification + recovery + inactivity flows operational across all four locales; **Supabase built-in auth emails fully delegated to our system (D.6) so regular users only ever receive our branded Resend emails.**
