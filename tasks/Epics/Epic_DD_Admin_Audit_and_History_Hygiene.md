# Epic DD — Admin Audit & History Hygiene

**Status:** OPEN — opened 2026-05-25 by the Opus 4.7 orchestrator.
**Source notes:** `issues.txt` 2026-05-25 — #26 (admin should be able to clear the all change history and crear each line of changes
in the admin panel; the project already stores change history in the user profile and in a few
other places — give admin a controlled "clear history" operation).
**Kickoffs:** `Epic_DD_kickoff_prompts.md` (Task 246).

> This Epic intersects with the role_permissions hardening of Task 197 / Task 250 (R.3a): any
> "clear history" action is a privileged operation that must default-deny for moderators unless
> explicitly granted via `role_permissions`. Do NOT ship DD before R.3a (Task 250) — confirm
> ordering when slotting into a Sprint.

## Goal

Admins can clear the audit/change history in the admin surfaces where this history is currently
displayed, with a clear confirm step, an event log entry of the clear action, and role-gated
access (admin always; moderator only if explicitly granted).

## Dependencies

- Task 197 / Task 250 (R.3a) — `role_permissions` table + `role_permission_events` audit
  pattern; the same audit-table pattern is the model for DD's clear-history event log.
- Existing change-history surfaces — at minimum the user profile change history (Epic R / Task
  198 / R.4 area: profile deactivation history + status changes + reports). Audit other places
  the project records change history (admin Listings? admin Locations? admin Email Templates?)
  in the kickoff.
- `docs/rls-rules.md` (default-deny for moderators); `docs/ai-behavior.md` Note 19 + Note 20.

## Tasks

### Task 246 — DD.1 — Admin can clear change history (gated + audited)

**Type:** feature
**Priority:** medium
**Area:** every admin surface that displays a change-history list

**Pre-read:** Task 197 / Task 250 session logs (when shipped); Task 198 / R.4 (profile
deactivation history) if shipped by the time DD runs; `src/components/admin/AdminUserProfile.tsx`
(the user history block); `docs/rls-rules.md`; `docs/ai-behavior.md` Note 20; the canonical
`Dialog` for the confirm step; the canonical Toast for success/error.
**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** all 7 breakpoints.

**Goal:**

1. **Inventory.** List every admin surface that today displays a change-history list — user
   profile history, listing history (if any), location history (if any), etc. The kickoff lists
   them; Sonnet does NOT invent new history surfaces.
2. **Clear action — TWO scopes (owner directive 2026-05-25 — see source notes above):**
   - **Per-row clear:** each history row in the list has its own "clear" control (canonical
     icon Button + confirm Dialog) that deletes ONLY that row.
   - **Per-entity clear:** a "Clear history" button at the top of each surface clears every
     row belonging to that entity (e.g. all history rows for one user).

   Both are gated by the `audit.clear_history` permission key (default true for admin, default
   false for moderator — matching the R.3a default-deny philosophy). The confirm Dialog
   distinguishes per-row vs per-entity in its text (i18n × 4). Each delete is recorded via a
   `role_permission_events`-style audit row in an audit-of-the-clear table (or reuse the
   existing `role_permission_events` pattern with a different `event_type` if owner approves —
   STOP and ask before adding a second audit table).
3. **Cross-entity scope.** A per-entity clear acts only on its own entity (e.g. clearing
   history on user A does not touch user B). A global "clear ALL history across the system" is
   OUT OF SCOPE for this task — file a follow-up if owner wants it.

**Acceptance criteria:**
- Per-row "clear" control on every row in every history-bearing admin surface (canonical icon
  Button + confirm Dialog, i18n × 4).
- Per-entity "Clear history" button at the top of every history-bearing admin surface
  (canonical Button + confirm Dialog distinguishing per-entity vs per-row in copy).
- Both actions gated by `audit.clear_history` permission; default-deny for moderator;
  enforced server-side via RLS (not UI-only hiding).
- Confirm Dialog (canonical) before every destructive action; success/error toast (canonical).
- An audit event is inserted on every clear — per-row OR per-entity (who, when, which entity,
  which row IDs OR row-count).
- New table/columns coordinated with the owner (single-writer SQL — EXACT idempotent SQL in
  the session log; owner runs it).
- 0 new lint/typecheck errors; `npm run build` passes; 4 locales; 7 breakpoints; UX-flow trace
  per Note 19; control-inventory per Note 20.

**Out of scope:** a global "clear ALL across the system" sweep; auto-rotation / time-based
history pruning (file as follow-up if wanted).

## Epic-level acceptance

Per-row AND per-entity "Clear history" works on every admin surface that displays history; both
actions are permission-gated, confirmed, and audited; moderator default-deny is enforced
server-side via RLS, not just hidden in the UI.
