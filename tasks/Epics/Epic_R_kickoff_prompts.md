# Epic R — kickoff prompts (Admin Panel 2026)

> Tasks 195–202. Shared hard contract: no scope change; no invented architecture (stop & ask if
> ambiguous); literal AC; update docs/backlog.md + docs/sessions/; 0 new lint/typecheck errors;
> governance PASS; locale parity sq/en/uk/it; responsive 320/375/390/768/1280/1440/2560 where UI; Global
> Change Verification Rule; commit + single `git add -A` then `git log -1`. **Owner runs all git AND all
> SQL** (single-writer rules). For schema-bearing tasks (R.3, R.4, R.5): provide idempotent SQL in the
> session log, update src/types/database.ts + the schema-drift INTERFACE_TABLE_MAP (Sprint 8), and STOP
> to confirm the schema with the orchestrator before finalizing migrations.

## Task 195 — R.1 — Admin auth flow / fix `/admin` 404 (Note 20)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top).
Pre-read: src/app/admin/* (routing + layout/gate), the auth gate that builds `next=/admin`, src/lib/auth/*;
docs/rls-rules.md, docs/ai-behavior.md.
Problem: visiting https://lero.al/admin redirects to /auth/login?next=/admin and 404s.
Scope: provide a proper admin auth flow — unauthenticated → admin login; authenticated non-admin →
forbidden; admin/moderator → admin dashboard. `next` returns the user to /admin after login.
Acceptance criteria:
- /admin never 404s; routes correctly per auth/role; post-login returns to /admin.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.
Out of scope: RBAC matrix (197); edit-screen pattern (196).
```

## Task 196 — R.2 — Admin edit-screen side-panel actions pattern (Note 34)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top). Reusable pattern, not a one-off (docs/ui-rules.md, component-governance.md).
Pre-read: admin listing-edit + profile-edit screens (src/app/admin/users/[id]/page.tsx + admin listing
edit); docs/ui-rules.md; 2026 UI/UX best practices.
Scope: create a reusable admin edit-screen pattern — main content centered, all actions / special settings
(e.g. role selection) in a dedicated right-hand side panel so key controls aren't buried. Apply to both.
Acceptance criteria:
- Documented reusable side-panel pattern applied to both admin edit screens; key actions in the side panel.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.
Out of scope: RBAC logic (197); deactivation logic (198).
```

## Task 197 — R.3 — Role permission management / RBAC (Note 33) ✅ DONE 2026-05-24

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top) + SCHEMA-BEARING rules (idempotent SQL in session log; database.ts + drift map;
stop & confirm schema before finalizing). Enforce server-side (RLS + action guards), not UI-only.
Pre-read: docs/rls-rules.md, docs/data-access-rules.md, docs/domain-rules.md; existing role checks
(assertAdmin / assertAdminOrModerator), src/modules/admin/actions/*.
Scope: let admins (and where allowed, moderators) configure per-role permissions (e.g. allow/deny a
moderator deleting users) via a permissions matrix; enforce server-side. A moderator can NEVER modify the
admin role's permissions (no privilege escalation).
Acceptance criteria:
- Permission matrix UI; changes enforced server-side; moderators cannot edit admin-role permissions.
- New tables/cols coordinated with owner; database.ts + drift map updated.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.
Out of scope: edit-screen pattern (196); support tickets (199).
```

## Task 198 — R.4 — Profile deactivation correctness + history + hard delete (Note 28)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top) + SCHEMA-BEARING rules.
Pre-read: docs/rls-rules.md, docs/data-access-rules.md, Epic C session logs (suspension/blocking);
src/components/admin/AdminUsersTable.tsx, src/app/admin/users/[id]/page.tsx, src/modules/admin/actions/*.
Problem: "Deactivate profile" makes the profile vanish from the table though it stays in DB.
Scope: deactivated profiles must stay VISIBLE in the table (filterable) and be re-activatable;
deactivate/activate requires a mandatory reason comment; keep a per-profile history (status changes,
complaints, complaint resolutions); add a separate HARD DELETE that permanently removes the user from
system + DB (guarded, documented, irreversible).
Acceptance criteria:
- Deactivated profiles remain visible + reactivatable; reason required; per-profile history recorded;
  hard delete works and is guarded.
- New tables/cols coordinated with owner; database.ts + drift map updated.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.
Out of scope: support tickets (199); RBAC (197) beyond who may hard-delete.
```

## Task 199 — R.5 — Support: manual ticket creation + status notifications (Note 29)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top) + SCHEMA-BEARING rules.
Pre-read: docs/data-access-rules.md, docs/rls-rules.md; Epic C (reports) + Epic D (notifications/email);
admin Support page, src/modules/notifications/*.
Scope: in admin Support, allow manual creation of a complaint ticket with reported-user ID, reporter-user
ID, and reason. On status change, notify the user named in the reported/subject field (in-app and/or
email, consistent with Epic C/D).
Acceptance criteria:
- Admin can create a ticket (reported ID + reporter ID + reason); status change notifies the right user.
- New tables/cols coordinated with owner; database.ts + drift map updated.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.
Out of scope: RBAC (197); deactivation history (198) beyond linking complaints into it.
```

## Task 200 — R.6 — Move Delete into the modal for locations & property types (Note 30)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top). Use the §11 canonical admin pattern.
Pre-read: docs/component-governance.md §11 (row click → Dialog, no Actions column), Epic K session logs;
admin locations manager + AdminPropertyTypesManager.tsx.
Scope: move the "Delete" action out of the table row into the entity modal for admin/locations and the
Property Types page.
Acceptance criteria:
- Delete lives in the entity modal (not the row) on both pages (§11).
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.
Out of scope: other admin tables (already migrated in Epic K).
```

## Task 201 — R.7 — Email-template editor modal width fix (Note 26)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top).
Pre-read: src/components/admin/AdminEmailTemplatesManager.tsx, src/components/ui/dialog.tsx;
docs/ui-rules.md (modal spacing).
Problem: the email-template editor modal auto-changes width and clips content.
Scope: find the cause (content-driven width / missing max-width) and fix so the modal width is stable and
content isn't cut.
Acceptance criteria:
- Editor modal keeps a stable width; content never clipped; consistent at all breakpoints.
- 0 new lint/typecheck errors; npm run build passes; all four locales; all 7 breakpoints.
Out of scope: template body content (202).
```

## Task 202 — R.8 — price_change_alert email template body (Note 27)

```
You are Claude Code Sonnet 4.6 working in `lero-al`.
Hard contract: (see top). Any DB seed/update SQL is owner-run (provide idempotent SQL in session log).
Pre-read: Task 166 session log (seeded price_change_alert), Epic D email infra,
src/modules/notifications/lib/sendTemplatedEmail.ts, src/app/api/cron/price-alerts/route.ts.
Problem: the price_change_alert template lists variables ({{listingTitle}}, {{oldPrice}}, {{newPrice}},
{{currency}}, {{listingUrl}}) but has an empty body.
Scope: author the body × 4 locales using those variables, consistent with the Epic D email design.
Acceptance criteria:
- price_change_alert body authored in all four locales using all listed variables; renders correctly.
- Idempotent seed/update SQL in the session log (owner runs it).
- 0 new lint/typecheck errors; npm run build passes.
Out of scope: editor modal layout (201).
```
