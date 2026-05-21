# Kickoff prompt — Task 124 (Epic D.5 — inactive account warning emails)

> Closes Epic D. Background job (cron) — no request context, so locale comes from preferred_locale (the reason Task 119 added that column).
> NOTE: no cron infra exists yet (no vercel.json) — this creates it.

---

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context:
We are finishing Epic D — Email Infrastructure & Account Lifecycle.
Previous: Task 119 (foundation), 120 (verify), 121 (recovery), 122 (Supabase hook), 123 (admin template manager). All on origin/main.
This task must be documented as Task 124. Do not rename it to Task D.5. Preserve global task numbering.

GOAL: After 3 months of inactivity, email the user a warning. After 12 months, deactivate (or delete — see policy decision) the account. Inactivity is measured by `last_seen_at`.

IMPORTANT — these are OUR OWN lifecycle emails, not Supabase auth emails:
Unlike verification/recovery (which Supabase triggers and D.6 delegates), inactivity emails are triggered by OUR cron job and sent DIRECTLY via the canonical sendEmail() helper. There is NO Supabase built-in inactivity email, so there is no double-email concern and no Send Email Hook involvement here.

Required pre-read before implementation:
1. tasks/Epics/Epic_D_Email_Infrastructure_and_Account_Lifecycle.md — Task D.5 scope.
2. tasks/Epics/Epic_D_email_design_reference.html — approved visual design.
3. docs/integrations.md — Email Template Architecture + Locale-aware sending.
4. docs/ai-behavior.md — Canonical Task Template, Localization Rules, Architecture Stability Rules, Pre-Task Mandatory Checklist.
5. docs/domain-rules.md — status values (`active`, `blocked`, `inactive`, `self_deleted`) + `user_status_history`. This task adds the inactivity lifecycle policy here.
6. Always-governed: docs/env.md, docs/rls-rules.md, docs/data-access-rules.md.
7. Email system (reuse): src/modules/notifications/lib/emails/BaseEmail.tsx, send.ts, resolveUserLocale.ts, VerifyEmail.tsx (template pattern).
8. Activity + lifecycle code:
   - src/app/api/presence/route.ts (how last_seen_at is written) + the profiles `last_seen_at` column.
   - src/modules/admin/actions/index.ts → softDeleteUser / hardDeleteUser + status writes to user_status_history.
9. Confirm where DB migrations are applied (no supabase/ folder — Supabase dashboard SQL editor, per Task 119).
10. Inspect package.json + deployment model (Vercel — use Vercel Cron Jobs via vercel.json + an authenticated cron route).

Localization coverage required:
- sq, en, uk, it
- Two code-first templates (3-month warning, 12-month final) on BaseEmail, INLINE STRINGS sq/en/uk/it. Export getXEmailStrings() for consistency.
- Locale per recipient via resolveUserLocale (NO request context in cron → relies on preferred_locale, fallback sq). This is exactly why preferred_locale exists.

Responsive coverage:
- Email render only (BaseEmail handles mobile). No app UI pages in this task.

Task scope (Task 124 — Epic D.5):
1. Templates: InactivityWarning (3-month) + InactivityFinal (12-month) React Email components on BaseEmail, matching the design reference, 4 locales. Warning = "your account will be removed in N months unless you sign in"; final = account deactivated/removed notice. Include a clear CTA to sign in.
2. Inactivity detection: a query over profiles using `last_seen_at` (treat null last_seen_at as created_at fallback — decide + document). Thresholds: warning at 3 months, final action at 12 months.
3. Deduplication: add tracking so each email is sent once. Add a column (migration) e.g. `inactivity_warning_sent_at timestamptz` (and reset it to null when the user becomes active again, i.e. on presence update). Document the migration SQL (dashboard-applied).
4. Final action at 12 months: SOFT DELETE (owner decided 2026-05-20). Reuse the existing `softDeleteUser` mechanism + status system (`self_deleted` or a dedicated inactivity status — decide + document) + write to user_status_history. Data is retained for a grace period (define the grace window, e.g. 30–90 days, and document it) after which it MAY be hard-deleted in a later cleanup. Do NOT hard-delete in this task. Document the policy in docs/domain-rules.md.
4b. Reactivation: if a soft-deleted-by-inactivity user returns WITHIN the grace period (signs in / presence update), define how the account is restored, and document it. After the grace period, restoration may not be possible — document that too.
5. Cron job: create vercel.json with a daily cron hitting an authenticated route (e.g. src/app/api/cron/inactivity/route.ts). Protect it with a secret (CRON_SECRET env, verify the header — document in docs/env.md). The job must be deterministic + idempotent (safe to run repeatedly; dedup via the tracking column). Batch + log results.
6. Document the full lifecycle (3mo warning → 12mo deactivate → reactivation) in docs/domain-rules.md.

Acceptance criteria:
- Two templates (3-month, 12-month) on BaseEmail, all 4 locales, matching the approved design.
- Inactivity detected via last_seen_at; thresholds 3mo / 12mo; null-handling documented.
- Dedup tracking column added (migration SQL documented); reset on reactivation.
- 12-month action = SOFT DELETE (owner-chosen) via softDeleteUser + user_status_history, with a documented grace period before any eventual hard delete; policy documented in docs/domain-rules.md.
- Reactivation within the grace period defined + documented.
- Cron route authenticated via CRON_SECRET (documented in docs/env.md); vercel.json daily schedule; job idempotent + logged.
- Emails sent DIRECTLY via sendEmail() (not via Supabase hook); locale via resolveUserLocale (preferred_locale).
- 0 new lint errors / 0 new warnings; governance:localization PASS (email STRINGS inline); typecheck no new errors.
- npm run build is the user's manual step.
- Session log: docs/sessions/YYYY-MM-DD-task-124-inactivity-emails.md.
- docs/backlog.md updated. After this, Epic D is COMPLETE → create tasks/Epics/Epic_D_Summary_CLOSED.md and mark the plan CLOSED.
- Commit + push when green.

Out of scope (do NOT touch in Task 124):
- Auth emails / Supabase hook (done in D.6).
- Admin template manager internals (done in D.2) — though inactivity templates MAY optionally be registered there if the owner wants them editable; default is code-first.
- Epic C / E / F notification triggers.

Follow every rule in docs/ai-behavior.md. Do not skip the Pre-Task Mandatory Checklist.
```

---

## Policy decision — CONFIRMED by owner (2026-05-20)

At 12 months of inactivity → **SOFT DELETE**: mark the account removed (via `softDeleteUser`) but retain data for a grace period, after which a later cleanup may hard-delete. Reversible within the grace window. Sonnet implements soft delete (NOT deactivate, NOT immediate hard delete). Define + document the grace window length and the reactivation rule in docs/domain-rules.md. Flag any GDPR/legal retention consideration in the session log.
