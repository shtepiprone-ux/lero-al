# Sprint 2 — Technical Debt Cleanup

**Status:** CLOSED
**Opened on:** 2026-05-19
**Numbering:** Task 107 → ? (global numbering continues from Epic A's Task 106)

This sprint exists for small, well-scoped cleanup tasks that surfaced during prior sprints but were intentionally deferred to avoid scope-creep. Tasks here MUST stay small (≤ 1 session) — anything larger belongs in an epic.

---

## Task 107 — Remove dead-code avatar server actions

**Type:** Chore / cleanup
**Priority:** Low-Medium
**Area:** `src/modules/cabinet/actions/`, `src/modules/admin/actions/`, dead-code elimination

**Pre-read (mandatory):**
1. `docs/backlog.md` — current state and Carry-over section.
2. `docs/ai-behavior.md` — especially:
   - Canonical Task Template
   - Scope Isolation Rules
   - Dependency Mutation Rules
   - Architecture Stability Rules (do NOT refactor adjacent code while cleaning up)
3. `docs/data-access-rules.md`, `docs/rls-rules.md` — confirm the surviving `/api/upload-avatar` route covers all caller permission cases.
4. Task 103 session log (`docs/sessions/2026-05-19-task-103-locale-audit.md`) — confirms `/api/upload-avatar` is the canonical replacement and inherits the new error-code contract.
5. Files in scope:
   - `src/modules/cabinet/actions/index.ts` (defines `uploadCabinetAvatar`)
   - `src/modules/admin/actions/index.ts` (defines `uploadUserAvatar`)
   - `src/app/api/upload-avatar/route.ts` (canonical replacement — DO NOT modify)
   - `src/components/admin/AdminUserAvatar.tsx`, `src/components/admin/AdminUserProfile.tsx` (current call sites use `/api/upload-avatar`)
6. Inspect `package.json` for the validation scripts.

**Localization coverage:**
- sq, en, uk, it — only relevant if the deleted functions contained translatable strings (Task 103 says hardcoded UA strings were already replaced; verify there's nothing left referenced from `messages/*.json` that becomes orphaned).
- Run `npm run governance:localization` after deletion; key counts must remain 862 per locale unless you also remove an orphaned key (document either way).

**Responsive coverage:** N/A (no rendered UI changes).

**Goal:**
Delete `uploadCabinetAvatar` and `uploadUserAvatar` server actions plus any imports/exports/types referencing them. Confirm zero remaining callers in `src/`. The `/api/upload-avatar` route remains the canonical upload path.

**Required investigation:**
1. Run a project-wide search:
   - `rg -n "uploadCabinetAvatar"` — confirm only the definition file matches.
   - `rg -n "uploadUserAvatar"` — confirm only the definition file matches.
   - Check barrel exports in `src/modules/cabinet/actions/index.ts` and `src/modules/admin/actions/index.ts`.
2. If both functions are sole exports of their `index.ts`, decide whether the file itself should be deleted or just emptied/replaced with `export {}` / re-exports of remaining actions.
3. Check for any `import type` references that might still pull in argument/return types.
4. Confirm Supabase RLS / storage policies don't reference the deleted action names anywhere (`.sql` migration files in `supabase/` — if that folder exists).

**Acceptance criteria:**
- `rg -n "uploadCabinetAvatar"` returns zero hits in `src/`.
- `rg -n "uploadUserAvatar"` returns zero hits in `src/`.
- `/api/upload-avatar` route untouched.
- No regression in admin user create/edit avatar upload, cabinet avatar upload — both still go through `/api/upload-avatar`.
- 0 new lint errors / 0 new warnings (pre-existing 5 warnings unchanged).
- `npm run governance:localization` PASS at baseline; key counts still 862 per locale (or document any orphaned-key removals).
- `npm run typecheck` returns no new errors (pre-existing 4 test-file errors unchanged).
- `npm run build` is the user's manual step — do not block on it.
- Add session log: `docs/sessions/YYYY-MM-DD-task-107-remove-dead-avatar-actions.md`.
- Update `docs/backlog.md`: replace Last Session block; add Session Archive row.

**Out of scope (do NOT touch in Task 107):**
- `governance:primitives` H:+30 pre-existing debt (belongs to Epic K or a separate primitive-audit task).
- Refactoring `/api/upload-avatar` itself.
- Touching any other server action not explicitly named above.
- Starting Epic B Task 108 or any other downstream work.

---

## Sprint 2 — overall acceptance

- Task 107 closed with its acceptance criteria met.
- `docs/backlog.md` updated accordingly.
- No new carry-overs introduced.
- If Task 107 is the only task in this sprint when it closes, create the closure summary immediately (`Sprint_2_—_Summary_CLOSED.md`) and start Epic B. If more cleanup tasks emerge before then (e.g. the user adds Task 107a/b/c), they MUST follow the same Canonical Task Template above and stay within the "small, well-scoped" charter.
