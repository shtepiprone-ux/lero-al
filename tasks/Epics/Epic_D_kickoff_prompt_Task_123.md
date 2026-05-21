# Kickoff prompt — Task 123 (Epic D.2 — admin email template manager)

> The DB-driven half of the hybrid email architecture: editable / marketing templates an admin manages without a deploy.
> Code-first transactional templates (verify/recovery/email-change) stay in code — this manager is for the editable layer.

---

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context:
We are continuing Epic D — Email Infrastructure & Account Lifecycle.
Previous: Task 119 (foundation), 120 (verify), 121 (recovery), 122 (Supabase hook delegation). All on origin/main.
This task must be documented as Task 123. Do not rename it to Task D.2. Preserve global task numbering.

Per the hybrid email architecture (docs/integrations.md → Email Template Architecture):
- Critical transactional emails (verify, recovery, email-change) are CODE-FIRST React Email — NOT managed here.
- This task builds the DB-driven admin manager for EDITABLE / marketing / non-critical emails an admin should change without a deploy (e.g. future saved-search alerts E.4, price-change alerts F.3, announcements).

Required pre-read before implementation:
1. tasks/Epics/Epic_D_Email_Infrastructure_and_Account_Lifecycle.md — Task D.2 scope.
2. docs/integrations.md — Email Template Architecture (which templates are admin-editable vs code-first).
3. docs/ai-behavior.md — Canonical Task Template, Localization Rules, UI Primitive Anti-Patterns / Canonical Usage Enforcement, Component Catalog Rules, Pre-Task Mandatory Checklist.
4. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md, docs/data-access-rules.md.
5. docs/ui-rules.md (admin page + table patterns), docs/component-governance.md.
6. Existing admin CRUD pages to mirror (pick the closest as the pattern reference): src/app/admin/companies/, src/app/admin/locations/, and their components/actions. Reuse the same table + Dialog + sonner toast + form patterns.
7. Email system: src/modules/notifications/lib/emails/send.ts (sendEmail), BaseEmail.tsx, resolveUserLocale.ts.
8. src/components/ui/dialog.tsx, src/components/ui/sonner.tsx, src/app/admin/layout.tsx + sidebar.
9. Inspect package.json + confirm where DB migrations are applied (no supabase/ folder — Supabase dashboard SQL editor, per Task 119 session log).

Localization coverage required:
- sq, en, uk, it
- Admin UI strings → messages/*.json (add to all 4 files).
- Email templates are stored PER LOCALE in the DB (one row set per template × locale), so an admin can edit each language. Sending picks the row by recipient locale (resolveUserLocale), fallback sq.

Responsive coverage:
- Admin manager pages/editor: 320, 375, 390, 768, 1280, 1440, 2560. Canonical primitives only (Button, Input, Dialog, Table) — no raw elements.

Task scope (Task 123 — Epic D.2):
1. DB: create an `email_templates` table (migration via Supabase dashboard SQL — document the SQL like Task 119 did). Suggested columns: id, key (template identifier, e.g. 'saved_search_alert'), locale (sq/en/uk/it), subject, html_body, variables (jsonb / documented placeholders like {{userName}}), is_active, updated_at, updated_by. RLS: only admin/moderator can read/write.
2. Admin page: src/app/admin/email-templates/ + sidebar entry — list templates (grouped by key), CRUD via the existing admin table + Dialog pattern (mirror companies/locations). sonner toast on save; Save disabled until dirty (reuse the Task 100 pattern).
3. Editor: subject + HTML body per locale, with a safe preview (sanitize HTML before rendering preview). Support variable placeholders ({{...}}) with a documented list per template.
4. Sending integration: a helper that loads a template by key + locale from the DB, interpolates variables, wraps/renders, and sends via the canonical sendEmail(). Wrap DB-driven HTML in BaseEmail (or a compatible shell) so admin-edited emails keep the brand frame. Decide + document whether admin edits the inner content only (recommended — keeps header/footer consistent) or the full body.
5. Do NOT migrate the code-first transactional templates (verify/recovery/email-change) into this system — they stay in code.

Acceptance criteria:
- `email_templates` table created (migration SQL documented), with RLS limiting writes to admin/moderator.
- Admin email-templates page: list + create + edit + delete, per-locale rows, following the canonical admin table + Dialog + toast pattern.
- HTML preview is sanitized (no XSS via stored HTML).
- Variable interpolation works with a documented placeholder list.
- Sending helper loads by key+locale (resolveUserLocale fallback sq), renders within the brand frame, sends via canonical sendEmail().
- Code-first transactional templates untouched.
- All 4 locales for admin UI; admin pages pass at all 7 breakpoints.
- 0 new lint errors / 0 new warnings; governance:localization + governance:responsive + governance:components PASS (no new primitive violations).
- npm run typecheck — no new errors.
- npm run build is the user's manual step.
- Session log: docs/sessions/YYYY-MM-DD-task-123-admin-email-template-manager.md.
- docs/backlog.md updated.
- Commit + push when green.

Out of scope (do NOT touch in Task 123):
- Inactivity emails (Task 124 = D.5).
- Code-first transactional templates (verify/recovery/email-change).
- Wiring specific notification triggers (saved-search E.4, price-change F.3) — those are their own epic tasks; D.2 only provides the manager + sending helper they will use.

Follow every rule in docs/ai-behavior.md. Do not skip the Pre-Task Mandatory Checklist. Do not start Task 124 in this run.
```
