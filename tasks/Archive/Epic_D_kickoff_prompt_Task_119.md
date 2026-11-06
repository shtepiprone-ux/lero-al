# Kickoff prompt — Task 119 (Epic D.1)

> Epic D — Email Infrastructure & Account Lifecycle. Starting task.
> Resume point after the 2026-05-20 corruption recovery: HEAD = Task 118, working tree clean.

---

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context:
We are starting Epic D — Email Infrastructure & Account Lifecycle.
The last completed task is Task 118 (Epic C.3 — admin reports dashboard). HEAD = b4b9e6f21 on origin/main.
NOTE: a phantom "Task 119" referenced earlier never existed — it was a working-tree corruption artifact, since recovered. THIS is the real Task 119.
This task must be documented as Task 119. Do not rename it to Task D.1. Preserve global task numbering.

Why Epic D now:
Epic C.4 (reporter notification) is blocked until transactional email exists. Epic D.1 unblocks it and feeds later notification work (E.4 saved-search, F.3 price-change, C.4).

ARCHITECTURE DECISION (2026-05-20, documented in docs/integrations.md → "Email Template Architecture"):
HYBRID — code-first React Email for critical transactional emails + DB-driven admin template manager (Epic D.2) for editable/marketing emails. Task 119 builds the code-first foundation. The Resend dashboard is NOT the template source of truth.

CURRENT STATE — email is already PARTIALLY integrated (this task is consolidation, not green-field):
- `resend` is installed (package.json: resend@^6.12.3). `@react-email/components` / `react-email` are NOT yet installed — add them in this task.
- `src/modules/notifications/lib/emails/emailChange.ts` is a WORKING reference: it does `new Resend(apiKey)` locally, has inline locale STRINGS (sq/en/uk/it) inside the file, uses FROM_ADDRESS = 'Lero.al <noreply@lero.al>', and sends via `resend.emails.send()` with HTML strings.
- `RESEND_API_KEY` is documented in docs/env.md.
- docs/integrations.md has a Resend section + the new "Email Template Architecture" decision with the 9-template inventory.
- IMPORTANT: email localization uses INLINE per-template STRINGS objects (NOT messages/*.json) because emails render server-side outside the next-intl context, selected by a `locale` prop. Keep this pattern.

Required pre-read before implementation:
1. Read tasks/Epics/Epic_D_Email_Infrastructure_and_Account_Lifecycle.md — Task D.1 scope + acceptance.
2. Read docs/backlog.md — Last completed + Next Immediate Tasks.
3. Read docs/ai-behavior.md — Canonical Task Template, Pre-Task Mandatory Checklist, Scope Isolation Rules, Localization (i18n) Rules.
4. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md.
5. Task-relevant: docs/integrations.md (Resend section), docs/dependencies.md (package policy), docs/data-access-rules.md.
6. Read the reference implementation in full: src/modules/notifications/lib/emails/emailChange.ts (this is the canonical email pattern to generalize).
7. Read src/modules/cabinet/actions/index.ts (the email-change action caller) to see how emails are triggered today.
8. Open the APPROVED DESIGN REFERENCE: tasks/Epics/Epic_D_email_design_reference.html — this is the agreed look (monochrome graphite + coral #EC5447 accent, single CTA, 600px card). BaseEmail must re-implement THIS design. Open it in a browser to see it.
9. Read the locale-aware sending section in docs/integrations.md + the existing locale plumbing: src/middleware.ts, src/modules/admin/actions/locale.ts, src/lib/admin/getAdminLocale.ts (how `admin-locale` is set today — Task 105).
10. Read src/types/database.ts (profile shape — note there is NO preferred_locale column yet).
11. Inspect package.json for validation scripts.

Localization coverage required:
- sq, en, uk, it
- Email content uses INLINE STRINGS objects per email module (the emailChange.ts pattern) — NOT messages/*.json.
- LOCALE-AWARE SENDING (key requirement): every email is sent in the RECIPIENT's chosen language. Fallback chain: profile `preferred_locale` → request locale (if available) → `sq`. The send helper takes a `locale`; templates select inline STRINGS by it.
- Brand accent colour `#EC5447` (`--brand-700`; `#BD4339` = `--brand-800` for AA-critical text) lives in ONE BaseEmail constant — never per-template.

Responsive coverage:
- Email HTML must be mobile-friendly (emailChange.ts is already "mobile-responsive, plain-text-fallback-friendly" — follow the same approach). No app-breakpoint testing needed; this is email-client rendering.

Task scope (Task 119 — Epic D.1 — provider setup + React Email foundation):
1. Confirm Resend as the canonical provider; the architecture decision is already in docs/integrations.md — keep it consistent.
2. Install React Email: `@react-email/components` (and `react-email` dev dependency for the local preview server). Follow docs/dependencies.md package policy.
3. Create a single shared `BaseEmail` layout component that re-implements the approved design reference (tasks/Epics/Epic_D_email_design_reference.html): top 3px coral strip, logo tile + "Lero.al" wordmark (coral ".al"), content slot, footer on faint grey. Coral accent in ONE constant. Mobile-friendly, plain-text-fallback-friendly. Location: `src/modules/notifications/lib/emails/BaseEmail.tsx`. Every future template wraps it.
4. Extract a single canonical send helper, e.g. `src/modules/notifications/lib/emails/send.ts` (pick location, document why):
   - One place that instantiates `new Resend(RESEND_API_KEY)`.
   - A typed `sendEmail({ to, subject, react | html, locale })` that renders a React Email component to HTML (use `@react-email/render`) and sends via Resend, with logging and a typed error result (follow the Epic A error-code contract for any user-facing failure; internal failures logged + returned, not thrown silently).
   - Preserve the existing graceful no-key behavior (if RESEND_API_KEY absent, log + return silently — useful for local dev).
   - Centralize FROM_ADDRESS = 'Lero.al <noreply@lero.al>' as a constant.
5. LOCALE-AWARE plumbing (required for the whole epic):
   - Add a `preferred_locale` column to the user profile (DB migration). First CONFIRM where migrations live — there is no `supabase/` folder in the repo; check whether migrations are applied via the Supabase dashboard or a migrations dir, and document it. The column default = `sq`; allowed values sq/en/uk/it.
   - Write `preferred_locale` whenever the user changes locale: hook into the same flow that sets the `admin-locale` cookie (Task 105 — `src/modules/admin/actions/locale.ts`, `src/middleware.ts`). On registration, seed it from the signup request locale (`useLocale()` in RegisterForm/AuthSheet).
   - Add a `resolveUserLocale(userId)` helper returning: profile `preferred_locale` → request locale (if available) → `sq`. Email callers use this to pick the locale.
6. Migrate emailChange.ts to use the canonical send helper (instead of its own `new Resend(...)`) WITHOUT changing its behavior or its inline STRINGS. Converting it to React Email components is OPTIONAL and may be deferred — the required outcome is that it routes through the shared helper. Document the choice.
7. Confirm env config: RESEND_API_KEY in docs/env.md and .env.example (if present); document production/staging expectations.
8. Add a documented way to send a test email in staging (script or a guarded route) + confirm the React Email local preview server works (`npm run email` or equivalent). Keep test routes out of production.

Acceptance criteria:
- `@react-email/components` installed; React Email preview server runs locally.
- Shared `BaseEmail` layout exists, visually matches the approved design reference (coral #EC5447 accent in one constant), reusable by future templates.
- Single canonical send helper exists; `new Resend(...)` is instantiated in exactly ONE place; renders React → HTML via @react-email/render; takes a `locale`.
- `preferred_locale` column added to the profile (migration), defaulted to `sq`, written on locale change + seeded on registration; `resolveUserLocale(userId)` helper implemented with the documented fallback chain.
- Migration location confirmed and documented (no `supabase/` folder exists today).
- emailChange.ts routes through the helper with identical behavior (email-change flow still works; inline STRINGS unchanged); graceful no-key fallback preserved.
- FROM_ADDRESS centralized as a constant.
- docs/integrations.md consistent with the implementation (helper + BaseEmail + locale-aware + preferred_locale).
- docs/env.md accurate for RESEND_API_KEY; docs/dependencies.md notes the react-email packages.
- 0 new lint errors / 0 new warnings.
- npm run governance:localization PASS (messages/*.json untouched — email strings stay inline; key counts unchanged).
- npm run typecheck — no new errors.
- npm run build is the user's manual step.
- Session log: docs/sessions/YYYY-MM-DD-task-119-email-provider-setup.md.
- docs/backlog.md updated (Last Session + Session Archive row).

Out of scope (do NOT touch in Task 119):
- Admin email template manager (Task 120 = Epic D.2).
- Email verification after registration (Task 121 = Epic D.3).
- Password/login recovery email (Task 122 = Epic D.4).
- Inactive account warning emails (Task 123 = Epic D.5).
- Epic C.4 reporter notification (comes after D.1+D.4 exist).
- Moving email strings into messages/*.json (keep the inline-STRINGS pattern).

Follow every rule in docs/ai-behavior.md. Do not skip the Pre-Task Mandatory Checklist. Do not start Task 120 in this run.
```

---

## Epic D queue (after Task 119)

- **Task 120** — Epic D.2 — Admin email template manager (templates table + HTML editor + preview, per-locale rows).
- **Task 121** — Epic D.3 — Email verification after registration (token + verified status).
- **Task 122** — Epic D.4 — Password/login recovery email (expiring link + security logging).
- **Task 123** — Epic D.5 — Inactive account warning emails (3-month → 12-month lifecycle job).

**After D.1 + D.4 exist**, Epic C.4 (reporter notification) becomes unblocked.
