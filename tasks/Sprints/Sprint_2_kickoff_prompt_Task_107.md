# Kickoff prompt — Task 107 (Sprint 2 cleanup)

> Copy-paste the block below into Claude Code (Sonnet 4.6) to start the cleanup task.

---

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context:
We are starting Sprint 2 — Technical Debt Cleanup with a single task.
The previous completed task is Task 106 (Epic A.4 — Mobile locale switcher to header).
Epic A is CLOSED. See:
- tasks/Epics/Epic_A_Summary_CLOSED.md
- docs/sessions/2026-05-19-task-103-locale-audit.md (introduced the canonical `/api/upload-avatar` route + error-code contract)

This task must be documented as Task 107.
Do not rename it to Task 2.1 or anything else — preserve global task numbering.

Goal (small, well-scoped chore):
Delete the dead-code server actions `uploadCabinetAvatar` (in src/modules/cabinet/actions/index.ts) and `uploadUserAvatar` (in src/modules/admin/actions/index.ts). They were superseded by /api/upload-avatar during Epic A.1 (Task 103). Project-wide search already confirms only the definitions remain — there are no callers.

Required pre-read before implementation:
1. Read tasks/Sprints/Sprint_2_—_Technical_Debt_Cleanup.md — the full task spec for Task 107.
2. Read docs/backlog.md — Last Session + Carry-over.
3. Read docs/ai-behavior.md, especially:
   - Canonical Task Template
   - Scope Isolation Rules
   - Dependency Mutation Rules
   - Architecture Stability Rules
4. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md.
5. Read docs/data-access-rules.md (confirm /api/upload-avatar covers all permission cases the deleted actions used to cover).
6. Read docs/sessions/2026-05-19-task-103-locale-audit.md — Epic A's reference implementation of the error-code contract on the surviving route.
7. Files in scope:
   - src/modules/cabinet/actions/index.ts (delete or remove the `uploadCabinetAvatar` export)
   - src/modules/admin/actions/index.ts (delete or remove the `uploadUserAvatar` export)
   - src/app/api/upload-avatar/route.ts (DO NOT modify — verify it stays the canonical path)
   - src/components/admin/AdminUserAvatar.tsx, src/components/admin/AdminUserProfile.tsx (current callers — confirm they still go to /api/upload-avatar after deletion)
8. Inspect package.json for the validation scripts (lint, typecheck, governance, build).

Localization coverage required:
- sq, en, uk, it.
- After deletion, run `npm run governance:localization` — key counts must stay at 862 per locale.
- If any translation key was orphaned by removing the actions (e.g. a key referenced only from the deleted code), document the orphan and either remove it from all four message files in the same task OR leave a note explaining why it stays.

Responsive coverage:
- N/A — no rendered UI changes.
- Smoke-check the avatar upload flow still works (admin user create/edit + cabinet) via the canonical /api/upload-avatar — manual verification in dev is enough since no UI is being changed.

Task scope (Task 107):
1. Project-wide search:
   - `rg -n "uploadCabinetAvatar" src/` — must show only the definition line.
   - `rg -n "uploadUserAvatar" src/` — must show only the definition line.
2. Inspect barrel exports / `export { ... }` lines in both `src/modules/cabinet/actions/index.ts` and `src/modules/admin/actions/index.ts`. If these files have other exports, delete only the dead functions; if they are the sole exports, decide whether to delete the file or leave it as a placeholder (`export {}`) — document the choice in the session log.
3. Remove any `import type { ... }` lines that referenced the deleted function arguments/return types.
4. Verify /api/upload-avatar is untouched and still handles every call site (AdminUserAvatar, AdminUserProfile).
5. Check `supabase/` migration folder (if it exists) for any policy or function reference to the deleted action names; remove only if confirmed orphaned, otherwise document and skip.

Acceptance criteria:
- `rg -n "uploadCabinetAvatar"` returns zero hits anywhere in `src/`.
- `rg -n "uploadUserAvatar"` returns zero hits anywhere in `src/`.
- /api/upload-avatar route file is unchanged.
- Avatar upload still works for admin create/edit + cabinet (manual dev verification, screenshot or log in session file).
- 0 new lint errors / 0 new warnings (the 5 pre-existing warnings stay 5).
- npm run governance:localization PASS at baseline; key counts 862 per locale (or document removed orphans).
- npm run typecheck returns no new errors.
- npm run build is the user's manual step — do not block on it.
- Add session log file: docs/sessions/YYYY-MM-DD-task-107-remove-dead-avatar-actions.md.
- Update docs/backlog.md: replace Last Session block; add Session Archive row.

Out of scope (do NOT touch):
- governance:primitives H:+30 pre-existing debt — that's Epic K or a separate primitive-audit task.
- Refactoring /api/upload-avatar itself.
- Any other server action not explicitly named above.
- Epic B Task 108 or any downstream work.

Follow every other rule in docs/ai-behavior.md. Do not skip the Pre-Task Mandatory Checklist. This is a one-task sprint — do not start additional cleanup tasks unless the user asks.
```

---

## After Task 107 closes

- Create `tasks/Sprints/Sprint_2_—_Summary_CLOSED.md` (mirroring Sprint_0/Sprint_1 closure pattern) and mark `Sprint_2_—_Technical_Debt_Cleanup.md` shapka as CLOSED.
- Then proceed with Epic B Task 108 — use `tasks/Epics/Epic_B_kickoff_prompt_Task_108.md`.
