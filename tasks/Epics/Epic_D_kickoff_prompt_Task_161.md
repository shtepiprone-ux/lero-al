# Kickoff prompt — Task 161 (D.2 follow-up — email-template delete = admin-only + verify RLS)

> Follow-up to Task 123. Review: delete actions allow admin+moderator, but policy is "DELETE → admin only"; server actions use the service-role client (bypasses RLS), so a moderator could delete.

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: do NOT change scope; no new architecture; AC literally;
update docs/backlog.md + add docs/sessions/<date>-task-161-*.md.

Pre-read: src/modules/notifications/actions/emailTemplates.ts, docs/rls-rules.md,
docs/integrations.md (email template section), src/lib/auth/server.ts.

Scope:
1. Tighten deleteEmailTemplateGroupAction + deleteEmailTemplateLocaleAction to admin-only
   (role==='admin'); moderator → forbidden. Keep SELECT/INSERT/UPDATE at admin+moderator.
2. Confirm the email_templates RLS matrix exists (SELECT/INSERT/UPDATE admin+moderator;
   DELETE admin). If missing, provide exact SQL + document in session log + integrations.md.
3. Note that actions use the service-role client → in-code role check is the primary gate.

Acceptance criteria:
- Moderator cannot delete templates; admin can. RLS matrix documented/confirmed.
- 0 new lint/typecheck errors; governance PASS. Session log + backlog updated.
Out of scope: template manager UI redesign; versioning.
```
