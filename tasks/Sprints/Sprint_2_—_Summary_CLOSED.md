# Sprint 2 — Technical Debt Cleanup — CLOSED

**Status:** CLOSED  
**Closed on:** 2026-05-19  
**Tasks:** Task 107  
**Commit:** see git log

---

## Summary

Single-task sprint. Removed two dead-code server actions that were superseded by the canonical `/api/upload-avatar` HTTP route during Epic A.1 (Task 103):

- `uploadCabinetAvatar` (cabinet/actions/index.ts) — no callers
- `uploadUserAvatar` (admin/actions/index.ts) — no callers

Companion helpers also removed: local `uploadToCloudinary` in both files; `import { createHash }` in admin/actions (cabinet kept `createHash` — still used by email-change token functions).

Final state: lint 0 errors / 5 pre-existing warnings · typecheck 4 pre-existing test-file errors · governance:localization PASS (862 keys × 4 locales).

→ [Task 107 session log](../../docs/sessions/2026-05-19-task-107-remove-dead-avatar-actions.md)

---

## Next

**Epic B — Auth, Registration & Agent Onboarding**  
Kickoff: [`tasks/Epics/Epic_B_kickoff_prompt_Task_108.md`](../Epics/Epic_B_kickoff_prompt_Task_108.md)
