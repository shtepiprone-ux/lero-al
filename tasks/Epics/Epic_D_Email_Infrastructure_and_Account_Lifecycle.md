# Epic D — Email Infrastructure & Account Lifecycle

**Status:** OPEN
**Opened:** 2026-05-19

## Goal

Build a centralized email system the admin can manage without code changes: pick a transactional provider, build a template manager in the admin, wire it to the existing lifecycle events (verification, recovery, inactivity warnings).

## Dependencies

- D.1 (provider setup) blocks every other task in this epic and Epic C.4 (reporter notification).
- Epic A (locale consistency) should be at least partially done so that email templates can target the recipient's locale deterministically.

## Tasks

### Task D.1 — Transactional email provider setup

**Type:** Infrastructure
**Priority:** Critical (blocking)
**Area:** SMTP / transactional email service, env vars, deployment config

**Pre-read:**
1. `docs/ai-behavior.md`, `docs/env.md`, `docs/integrations.md`
2. `docs/dependencies.md` (package selection rules)
3. Existing `resend` dependency (`package.json` lists `resend@^6.12.3`) — confirm whether Resend is the chosen provider or whether the project will switch.

**Localization coverage:** N/A
**Responsive coverage:** N/A

**Goal:** Confirm provider (Resend appears to already be installed — verify and document). Configure env variables for production / staging. Provide a single send-mail helper in `src/lib/email/`.

**Acceptance criteria:**
- Decision documented in `docs/integrations.md`.
- Env vars listed in `docs/env.md` and `.env.example` (if present).
- Single canonical send helper with logging and retry policy.
- Smoke test sends a real email in staging.

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

**Goal:** On registration, send a verification email; user clicks → email marked verified. Unverified status visible in admin.

**Acceptance criteria:**
- Email sent on registration in recipient's locale.
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

**Goal:** After 3 months of inactivity (no login, no activity), send a warning email. At 12 months, deactivate or delete (final policy to be decided as part of this task).

**Acceptance criteria:**
- Background job runs deterministically; deduplicated.
- Warning email at 3 months, final email at 12 months.
- Deletion / deactivation policy documented in `docs/domain-rules.md`.

## Epic-level acceptance

Provider live; admin can fully manage templates; verification + recovery + inactivity flows operational across all four locales.
