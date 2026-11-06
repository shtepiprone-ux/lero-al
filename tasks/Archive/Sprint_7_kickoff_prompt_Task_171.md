# Kickoff prompt — Task 171 (Sprint 7 — hide email-template Delete action from non-admins)

> A moderator on `/admin/email-templates` sees the **Delete** (trash) action on every template.
> The server boundary is correct — `deleteEmailTemplateGroupAction` / `deleteEmailTemplateLocaleAction`
> call `assertAdmin()` (Task 161), so a moderator clicking Delete only gets an error toast — but the
> button must not be shown at all. Per the `email_templates` RLS matrix (docs/integrations.md):
> SELECT/INSERT/UPDATE = admin+moderator; **DELETE = admin only**. So: keep Edit for both roles,
> show Delete only to admins. `AdminEmailTemplatesManager` currently takes no role prop and renders
> both actions unconditionally.

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract:
- Do NOT change scope; no new architecture; if ambiguous, STOP and ask.
- Execute AC literally. Update docs/backlog.md + add docs/sessions/2026-05-22-task-171-email-delete-admin-only-ui.md.
- 0 new lint/typecheck errors; governance PASS (canonical Button only; no raw <button>).
- Commit + push. SINGLE `git add -A` (no `^`/backtick continuations). Then `git log -1`, paste real output.
- Concurrency: ensure no other Claude/editor session is editing these files at the same time.

Pre-read:
- src/app/admin/email-templates/page.tsx (server component; currently passes only `templates`)
- src/components/admin/AdminEmailTemplatesManager.tsx (renders Edit Pencil + Delete Trash2 with NO role gate; the Delete button is the <Button> with aria-label={t('delete_label')})
- src/app/admin/users/[id]/page.tsx lines ~70-74 — the canonical pattern for resolving the viewer's
  role: getUser() → select role from users → `const isAdmin = myProfile?.role === 'admin'`
- src/modules/notifications/actions/emailTemplates.ts (confirm delete actions already assertAdmin — leave as-is)

Scope:
1. In email-templates/page.tsx, resolve the current viewer's role the SAME way as the user page
   (getUser → users.role → isAdmin: boolean) and pass `isAdmin` to <AdminEmailTemplatesManager>.
2. In AdminEmailTemplatesManager, accept `isAdmin: boolean` prop and render the Delete (Trash2)
   button ONLY when `isAdmin`. Keep the Edit (Pencil) button visible for both admin and moderator.
   Ensure the delete dialog cannot be opened by non-admins (the trigger is gone).
3. Do NOT change the server actions — `assertAdmin()` stays as the enforced boundary (defense-in-depth).

Acceptance criteria:
- Admin: sees Edit + Delete (unchanged). Moderator: sees Edit only, NO Delete button.
- Server still blocks any non-admin delete (assertAdmin unchanged).
- No governance anti-patterns (canonical Button; no hardcoded role strings beyond the single isAdmin
  comparison matching the existing user-page pattern).
- 0 new lint/typecheck errors; backlog + session log updated; commit pushed.

Out of scope:
- Changing who can ACCESS the page (moderators still manage templates — edit allowed).
- Reworking the templates list/editor; any i18n change.
```
