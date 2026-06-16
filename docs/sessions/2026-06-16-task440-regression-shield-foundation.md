# 2026-06-16 — Task 440 — Regression Shield foundation (Epic RS, Slice 0)

**Session role:** Opus orchestrator. Governance/planning — docs + task/epic files only; NO product code.
**Owner directive (2026-06-16):** build a project-wide system that prevents critical flows from silently
regressing (it has happened repeatedly), NOT another point patch. Approach decided by owner: new Epic
"Regression Shield" **+** a P0 governance rule that acts immediately, **+** a Critical Flow Registry,
**+** incremental coverage slices (Task 436 reframed as Slice 1). Do not mix with live bugs 433/434/435/437/439.

## What landed this session (the rule is now LIVE)

| File | Change |
|---|---|
| `tasks/Epics/Epic_RS_Regression_Shield.md` | NEW — Epic: two pillars (immediate rule + growing suite), slice table (0–6 = Tasks 440/436/441/442/443/444/445), definition of done, no-mix-with-live-bugs boundary. |
| `docs/critical-flow-registry.md` | NEW — single source of truth: all P0/P1 flows (auth, admin, listings, server-action/RLS, i18n/hydration/mobile) with route/action · owner task · happy · failure · required test · command · coverage status. |
| `docs/agent-contract.md` | NEW **clause 15** (regression coverage for critical flows = P0); header count "ten"→"(1–15)". |
| `docs/orchestrator-role.md` | NEW standing rule + review-checklist item: regression-coverage gate; approval forbidden without automated proof old behavior survives. |
| `docs/rule-index.md` | registry added to "Always required"; NEW task type "Regression / critical-flow coverage task". |
| `docs/ai-behavior.md` | Canonical Task Template gains a "Regression coverage" AC + a Rules bullet. |
| `tasks/kickoff_prompt_Task_436_RegressionProtectionGuards.md` | REFRAMED header → Epic RS Slice 1 (foundational guards), no longer "Task-432-only". |
| `tasks/kickoff_prompt_Task_441_RegressionShield_Slice2_AuthLifecycleSmoke.md` | NEW — Slice 2 kickoff (auth-lifecycle smoke + gates for Sonnet). |

## The rule (now binding on Task 439 and every future task)

Any task touching a flow in `docs/critical-flow-registry.md` MUST: baseline the existing regression test
green BEFORE the change → add/update a regression test for the new behavior → cannot close without
automated proof the old critical functionality still works (a manual one-case check is rejected). Missing
registry row → the task adds one. Every fixed bug earns a regression test so it cannot return. Orchestrator
verifies the test runs in CI and FAILS on a planted violation (no-op gate = failure).

## Division of labor honored

Governance docs + registry + Epic + kickoffs = orchestrator domain → done directly this session.
Playwright/vitest smoke implementation = product/test code → delegated to Sonnet via slice kickoffs
(441 written; 442–445 contracts fixed in the Epic, kickoffs to be written when scheduled).

## Slices

0/440 ✅ (this) · 1/436 reframed (kickoff ready) · 2/441 (kickoff ready) · 3/442 listings · 4/443 admin ·
5/444 server-action+RLS positive/negative permission harness (closes Task 270→435 class) · 6/445
i18n/hydration/date-format + mobile-no-overflow gate.

## Files Changed table — see the table above (one row per path).

## Status

Foundation complete; rule live. Next: owner runs commits; Sonnet executes Slice 1 (436) then Slice 2 (441).
No product code touched. Not mixed with any live bug.
