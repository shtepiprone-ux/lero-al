# Epic D — follow-up kickoff: Task 166 (seed DB-driven email templates)

> **Why this exists:** The Task 123 admin email-template manager (`/admin/email-templates`) is
> DB-driven, but the `email_templates` table was created empty and **never seeded**. So the admin
> panel shows no templates, AND the cron jobs that call `sendTemplatedEmail({ key: ... })` have no
> active row to send (e.g. saved-search and price-change emails silently no-op:
> `[sendTemplatedEmail] No active template found`). This task seeds the DB-driven templates.
>
> Scope decision (confirmed by owner 2026-05-22): seed the **DB-driven** templates only.
> Auth/transactional emails (verify, recovery, magic-link, reauth, email-change) stay **code-first**
> per the Task 123 architecture decision — do NOT move them into the manager.

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic D follow-up — Task 166. Seed the DB-driven email templates so the admin manager lists
them and templated emails actually send.

Hard contract (do NOT violate): do not change the scope below; do not add new architectural
decisions on your own; execute the acceptance criteria literally; if something is ambiguous,
STOP and ask. Update docs/backlog.md + add a docs/sessions/ log. Commit + push.

Required pre-read:
1. docs/sessions/2026-05-21-task-123-admin-email-template-manager.md (table schema, brand frame,
   {{variable}} interpolation, "Inner HTML only", which templates are DB-driven vs code-first).
2. src/modules/notifications/lib/sendTemplatedEmail.ts (how key+locale resolve; is_active filter;
   how variables interpolate; locale fallback).
3. src/app/admin/email-templates/page.tsx + src/components/admin/AdminEmailTemplatesManager.tsx
   (what the manager lists).
4. integrations.md / the brandEmailLayout wrapper (so html_body is INNER HTML only).

Scope:
1. Enumerate EVERY `sendTemplatedEmail({ key: ... })` call site in the repo and record, per key,
   the EXACT `variables` object keys passed. Known so far (verify against code, do not assume):
     - key 'saved_search_alert'  → variables: { searchName, newCount, searchUrl }
       (src/app/api/cron/saved-searches/route.ts)
     - key 'price_change_alert'  → variables: { listingTitle, oldPrice, newPrice, currency, listingUrl }
       (src/app/api/cron/price-alerts/route.ts)
     - key 'reporter_notification' → Task 123 lists it as DB-driven, but NO sendTemplatedEmail call
       was found for it. CONFIRM: is it actually consumed via sendTemplatedEmail (find the call +
       its variables) or is it code-first / unwired? If unwired/code-first → do NOT seed it; note
       this discrepancy in the session log. If it IS consumed → seed it with its real variables.
2. For each key that is actually consumed by sendTemplatedEmail, author localized content for ALL
   four locales (sq, en, uk, it):
     - subject (localized, may use {{variables}})
     - html_body = INNER HTML only (headings/paragraphs/CTA) — brandEmailLayout wraps it; do NOT
       include <html>/<head>/brand header/footer.
     - The {{placeholder}} names MUST exactly match that key's call-site `variables` keys. No
       placeholder may reference a variable the caller doesn't pass; no caller variable should be
       left unused without reason.
     - variables JSONB = the array of that key's variable names.
     - is_active = true.
3. Deliver the seed as an IDEMPOTENT SQL block (INSERT ... ON CONFLICT (key, locale) DO UPDATE ...)
   documented in the session log, to be run in the Supabase Dashboard SQL Editor (same ops pattern
   as Tasks 119/123 — there is no supabase/ migrations folder). State clearly it is owner-applied.

Localization coverage: sq, en, uk, it (all template rows). Responsive coverage: N/A (email HTML).

Acceptance criteria (verify literally; put evidence in the session log):
- Every key consumed by sendTemplatedEmail has one row per locale (sq/en/uk/it), is_active=true,
  in the seed SQL. (saved_search_alert + price_change_alert at minimum; reporter_notification per #1.)
- Each template's {{variables}} exactly match the call-site variables object keys — list the mapping
  per key in the session log.
- After seeding, /admin/email-templates lists each template group with all 4 locales (describe the
  expected manager view).
- A sent saved_search_alert / price_change_alert renders with interpolated values — no leftover
  {{...}} tokens; subject + body localized.
- npm run typecheck → 0 new errors; npm run lint → 0 new warnings;
  npm run governance:localization → PASS.

Commit hygiene (mandatory): `git add -A` any new files; `git status` shows no untracked source
files; commit + `git push`; confirm `git log` shows the new commit. The seed SQL lives in
docs/sessions/2026-05-22-task-166-seed-email-templates.md (owner runs it; record confirmation when applied).

Out of scope: making auth/transactional emails admin-editable (they stay code-first); any change to
sendTemplatedEmail logic, the manager UI, or the email_templates schema. Follow docs/ai-behavior.md
and docs/orchestrator-role.md.
```
