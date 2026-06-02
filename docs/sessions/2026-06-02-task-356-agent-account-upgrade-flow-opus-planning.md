# Task 356 — Private → Agent account upgrade flow (Opus planning / architecture audit)

**Date:** 2026-06-02
**Role:** Opus orchestrator / architect (no product code — read/search only)
**Output:** one Sonnet implementation task → **Task 366**

---

## Why this log exists
Task 356 was a READY Opus-planning task that was never executed: no session log, and no implementation
sub-task (≥357) — Tasks 357–365 are all Storybook/DS work, none address the agent-upgrade bug. Discovered
during the 2026-06-02 orchestrator review of Tasks 354–361. The critical agent-upgrade bug was therefore
still unaddressed. This session runs the 356 audit and produces the missing implementation task.

## Root-cause audit (read-only; file:line anchors)
1. **Homepage CTA** — `src/app/[locale]/page.tsx:130-138`: the agent CTA is a static link
   `href={/${locale}/auth/register?type=agent}` with **no auth-state branching** → authenticated private
   users are sent into the new-user registration flow. Root cause of the reported bug.
2. **Profile account-type** — `src/modules/cabinet/components/ProfileTab.tsx:94,128,166,264-281`:
   `userType` is local `useState`; the two types render as clickable tabs (`['private','agent'].map`);
   clicking "Агент" flips local state and reveals company fields (`userType==='agent' && (...)`), persisted
   on the generic profile save. Private→Agent is a lightweight UI toggle, not a controlled one-way upgrade;
   nothing prevents an agent flipping back to private (downgrade).
3. **Persistence / model** — `src/types/database.ts:2` → `UserType = 'private' | 'agent' | 'developer'`;
   cabinet action `src/modules/cabinet/actions/index.ts:31,59` writes `company_name` only when
   `userType==='agent'` as a side-effect of profile update. No dedicated upgrade action; **no server-side
   downgrade guard**.
4. **Close behaviour / blank-spinner** — `src/modules/auth/components/AuthSheet.tsx:91-99,759-779`:
   register success calls `onClose()` + `router.push(next)` + `router.refresh()`; suspected source of the
   blank-page-with-spinner on close. The `/auth/register` route (page vs intercepting modal) must be
   confirmed by the executor as part of reproducing the bug.

## Final chosen behavior (encoded in Task 366)
- Guest → existing guest agent registration/login (reused); closes cleanly.
- Authenticated private → dedicated controlled upgrade route `/[locale]/profile/upgrade-agent`.
- Authenticated agent → CTA hidden/replaced; profile shows only "Агент"; "Приватна особа" option fully hidden.
- Admin/moderator → never routed into agent registration / never converted.
- One-way lifecycle enforced by BOTH a UI guard and a server/action guard.

## One task vs split
Concluded **one task (366)**: CTA branching, the upgrade page, the profile one-way lifecycle, and the
server guard are tightly coupled (CTA branch depends on the upgrade route existing). Authorized fallback
split (max two: 366A routing/modal/spinner + branching; 366B upgrade page + lifecycle) only if the executor
proves independence is required — STOP & ASK first.

## Produced artifacts
- `tasks/Sprints/Sprint_32_kickoff_prompt_Task_366_PrivateToAgentAccountUpgradeFlow.md` — copy-paste-ready
  Sonnet implementation task with Positive + Negative flow sections (Task 255 rule) and AC-by-AC mapping.

## Confirmation
Opus edited **no product code** — only read/searched `src/` for the audit and wrote this log + the Task 366
kickoff. Commit commands are emitted by the orchestrator in the review response; the owner runs them in PowerShell.
