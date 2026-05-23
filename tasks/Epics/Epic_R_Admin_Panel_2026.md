# Epic R — Admin Panel 2026

**Status:** OPEN — opened 2026-05-22 by the Opus 4.7 orchestrator. Builds on closed Epics C, K, L.
**Source notes:** issues.txt #20 (admin auth flow → /admin gives 404), #34 (admin edit screens need a side-panel actions pattern), #33 (per-role permission management / RBAC), #28 (profile deactivation correctness + history + hard delete), #29 (Support manual ticket creation + status notifications), #30 (move Delete from table to modal for locations & property types), #26 (email-template editor modal auto-changes width / clips content), #27 (price_change_alert email template body is empty).
**Kickoffs:** `Epic_R_kickoff_prompts.md` (Tasks 195–202).

> Largest epic. Order it access → governance/RBAC → moderation data → patterns/polish. R.3 (RBAC) and
> R.4 (deactivation history) are schema-bearing — they require new tables/columns; coordinate any SQL
> with the owner (single-writer-SQL rule) and the schema-drift guard (Sprint 8 / `database.ts`).

## Goal

A coherent, secure, 2026-grade admin panel: working admin login, role-based permissions, correct
moderation lifecycle with auditable history, a manual support workflow, and consistent edit-screen and
table patterns.

## Dependencies

- Admin shell + tables (Epic K, `docs/component-governance.md §11`), admin dashboard (Epic L),
  trust/safety (Epic C: reports, suspension), email infra (Epic D, `email_templates`, `sendTemplatedEmail`),
  Task 166 (seeded `price_change_alert` template), `src/app/admin/*`, `src/components/admin/*`,
  `src/modules/admin/actions/*`, `docs/rls-rules.md`.

## Tasks

### Task 195 — R.1 — Admin auth flow / fix `/admin` 404 (Note 20)

**Type:** bug
**Priority:** critical
**Area:** admin routing + auth gate

**Pre-read:** docs/ai-behavior.md, docs/rls-rules.md, docs/env.md, docs/component-rules.md; `src/app/admin/*`,
the auth gate / `next=/admin` redirect, `src/lib/auth/*`.
**Localization coverage:** sq, en, uk, it (admin login text).
**Responsive coverage:** all 7 breakpoints.

**Goal:** Visiting `https://lero.al/admin` currently redirects to `/auth/login?next=/admin` and 404s.
Provide a proper admin auth flow: unauthenticated → admin login; authenticated non-admin → forbidden;
admin/moderator → admin dashboard. No 404.

**Acceptance criteria:**
- `/admin` never 404s; routes to the correct destination per auth/role state; `next` returns the user to
  `/admin` after login.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** RBAC matrix (R.3); edit-screen pattern (R.2).

### Task 196 — R.2 — Admin edit-screen side-panel actions pattern (Note 34)

**Type:** feature / UX
**Priority:** high
**Area:** admin listing-edit + profile-edit screens

**Pre-read:** docs/ui-rules.md, docs/component-governance.md; admin edit screens for listings & profiles
(`src/app/admin/users/[id]/page.tsx`, admin listing edit), 2026 UI/UX best practices.
**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** all 7 breakpoints.

**Goal:** Create a reusable admin edit-screen pattern: main content (title + details) centered, with all
actions / special settings (e.g. role selection) in a dedicated right-hand side panel so important
controls don't get lost. Apply to listing-edit and profile-edit.

**Acceptance criteria:**
- A documented, reusable side-panel actions pattern; applied to both admin edit screens.
- Key actions (e.g. role selection) are clearly placed in the side panel, not buried.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** the actual RBAC logic (R.3); deactivation logic (R.4).

### Task 197 — R.3 — Role permission management / RBAC (Note 33)

**Type:** feature
**Priority:** high
**Area:** roles & permissions (admin/moderator), RLS

**Pre-read:** docs/rls-rules.md, docs/data-access-rules.md, docs/domain-rules.md; existing role checks
(`assertAdmin`/`assertAdminOrModerator`), `src/modules/admin/actions/*`.
**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** all 7 breakpoints.

**Goal:** Let admins (and, where allowed, moderators) configure per-role permissions — e.g. grant/deny a
moderator the ability to delete users. Provide a permissions matrix and enforce it server-side (RLS +
action guards). A moderator (lower rank) can never modify the admin role's permissions.

**Acceptance criteria:**
- A permission list/matrix UI; changes enforced server-side (not UI-only).
- Moderators cannot edit admin-role permissions; privilege escalation prevented.
- Any new tables/columns coordinated with the owner (SQL) and added to `database.ts` + schema-drift map.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** the edit-screen pattern (R.2); support tickets (R.5).

### Task 198 — R.4 — Profile deactivation correctness + history + hard delete (Note 28)

**Type:** feature / bug
**Priority:** high
**Area:** admin Users — deactivate/activate, audit history, hard delete

**Pre-read:** docs/rls-rules.md, docs/data-access-rules.md, Epic C session logs (suspension/blocking),
`src/components/admin/AdminUsersTable.tsx`, `src/app/admin/users/[id]/page.tsx`, `src/modules/admin/actions/*`.
**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** all 7 breakpoints.

**Goal:** Fix: "Deactivate profile" makes the profile vanish from the table though it still exists in DB.
Deactivated profiles must stay visible in the table and be re-activatable. Every
deactivation/activation requires a mandatory reason comment. Maintain a per-profile history (status
changes, complaints, complaint resolutions). Add a separate **hard delete** that permanently removes the
user from the system and DB.

**Acceptance criteria:**
- Deactivated profiles remain in the table (filterable), with a clear status, and can be reactivated.
- Deactivate/activate requires a reason; a per-profile history log records status changes + reports +
  resolutions.
- Hard delete permanently removes the user (documented, guarded, irreversible).
- New tables/columns coordinated with owner (SQL) + added to `database.ts` + schema-drift map.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** support ticket creation (R.5); RBAC (R.3) beyond who may hard-delete.

### Task 199 — R.5 — Support: manual ticket creation + status notifications (Note 29)

**Type:** feature
**Priority:** medium
**Area:** admin Support page

**Pre-read:** docs/data-access-rules.md, docs/rls-rules.md, Epic C (reports) + Epic D (notifications/email);
admin Support page, `src/modules/notifications/*`.
**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** all 7 breakpoints.

**Goal:** In admin Support, allow manual creation of a complaint ticket: select the reported user's ID,
the reporter's user ID, and the reason. When the ticket status changes, notify the user named in the
"reported"/subject field.

**Acceptance criteria:**
- Admin can create a ticket with reported-user ID, reporter-user ID, and reason.
- Status change triggers a notification to the relevant user (in-app and/or email, consistent with Epic C/D).
- New tables/columns coordinated with owner (SQL) + `database.ts` + schema-drift map.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** RBAC (R.3); deactivation history (R.4) beyond linking complaints into it.

### Task 200 — R.6 — Move Delete into the modal for locations & property types (Note 30)

**Type:** UX / refactor
**Priority:** low
**Area:** admin/locations + admin Property Types

**Pre-read:** docs/component-governance.md §11 (no Actions column → row click → Dialog), Epic K session
logs; `src/components/admin/AdminPopularLocationsManager.tsx` / locations admin, `AdminPropertyTypesManager.tsx`.
**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** all 7 breakpoints.

**Goal:** Move the "Delete" action out of the table row into the entity's modal (the §11 canonical
pattern) for `admin/locations` and the Property Types page.

**Acceptance criteria:**
- Delete lives in the entity modal, not the table row, on both pages (§11 pattern).
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** other admin tables already migrated in Epic K.

### Task 201 — R.7 — Email-template editor modal width fix (Note 26)

**Type:** bug / UI
**Priority:** low
**Area:** admin Email Templates editor modal

**Pre-read:** `src/components/admin/AdminEmailTemplatesManager.tsx`, `src/components/ui/dialog.tsx`;
docs/ui-rules.md (modal spacing).
**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** all 7 breakpoints.

**Goal:** When editing an email template, the modal auto-changes width and clips content. Find the cause
(content-driven width / missing max-width) and fix it so the modal width is stable and content isn't cut.

**Acceptance criteria:**
- The editor modal keeps a stable width; content is never clipped; consistent at all breakpoints.
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** the template body content (R.8).

### Task 202 — R.8 — price_change_alert email template body (Note 27)

**Type:** content / bug
**Priority:** low
**Area:** `email_templates` (price_change_alert)

**Pre-read:** Task 166 session log (seeded `price_change_alert`), Epic D email infra,
`src/modules/notifications/lib/sendTemplatedEmail.ts`, `src/app/api/cron/price-alerts/route.ts`.
**Localization coverage:** sq, en, uk, it (template body × 4).
**Responsive coverage:** email rendering (mobile + desktop clients).

**Goal:** The `price_change_alert` template lists variables (`{{listingTitle}}`, `{{oldPrice}}`,
`{{newPrice}}`, `{{currency}}`, `{{listingUrl}}`) but has an empty body. Author the body (× 4 locales)
using those variables, consistent with the Epic D email design.

**Acceptance criteria:**
- `price_change_alert` body authored in all four locales, using all listed variables; renders correctly.
- Any DB seed/update SQL coordinated with the owner (single-writer-SQL rule).
- 0 new lint/typecheck errors; `npm run build` passes.

**Out of scope:** the editor modal layout (R.7).

## Epic-level acceptance

Admin login works; RBAC is enforced server-side; deactivation keeps profiles visible with auditable
history + hard delete; manual support tickets notify the right user; tables/edit-screens/modals follow
consistent canonical patterns.
