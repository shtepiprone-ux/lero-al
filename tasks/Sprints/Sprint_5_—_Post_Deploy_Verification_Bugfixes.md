# Sprint 5 — Post-Deploy Verification Bugfixes

> Opened 2026-05-22 by the Opus 4.7 orchestrator after the post-deploy verification pass
> (see `docs/sessions/2026-05-22-post-deploy-verification.md`). Two real bugs were found in the
> deployed code (`origin/main` @ `b94dcc312`) during the admin-dashboard smoke test. Both are
> small, surgical, and independent. Index migration, RLS matrix, and dashboard data layer all
> verified clean — out of scope here.

## Goal

Fix the two regressions surfaced by the smoke test so the admin dashboard renders correctly and
the user-role change can actually be saved.

## Tasks

| Task | Area | Summary | Kickoff file |
|---|---|---|---|
| 167 | Epic L (dashboard) | `listing.status_active` / `status_inactive` missing in all 4 catalogs → raw i18n keys render on the dashboard | `Sprint_5_kickoff_prompt_Task_167.md` |
| 168 | Admin user profile | Account-type Combobox `setValue` lacks `{ shouldDirty: true }` → Save stays disabled after a role change | `Sprint_5_kickoff_prompt_Task_168.md` |

Both can be executed in a single Sonnet session (separate atomic commits preferred) or two.
The orchestrator reviews the actual diff per `docs/orchestrator-role.md` before closing the sprint.

## Out of scope

Index/RLS work (already verified), form/dashboard redesigns, key renames, the two stray
`git stash` entries (`stash@{0}` WIP, `stash@{1}` "Tasks 160-162") — to be triaged separately.

## Orchestrator verdict — 2026-05-22 — ✅ APPROVED, Sprint CLOSED

Reviewed the actual diffs (`git show`), not the executor reports.

- **Task 167** (`44303a416`): `listing.status_active` / `status_inactive` present in **all 4**
  catalogs with the exact specified values (sq Aktiv/Joaktiv · en Active/Inactive · uk Активне/
  Неактивне · it Attivo/Non attivo). Locale parity holds (same key set); all 4 JSON files parse;
  exactly 2 lines added per catalog; no code touched. Files changed = scoped set only.
- **Task 168** (`bf47b4ace`): single-line change at `AdminUserProfile.tsx:697` —
  `setValue('profileType', v as ProfileType, { shouldDirty: true })`. One hunk, no scope creep,
  matches the phone-field pattern. Valid react-hook-form `SetValueConfig`.

No governance anti-patterns; backlog + session logs updated. Both **approved**; no follow-up tasks.
Note: a full `npm run build` was not run by the orchestrator (verification was by inspection +
JSON parse + type check of the changed line) — rely on the executor's build gate / CI before deploy.
