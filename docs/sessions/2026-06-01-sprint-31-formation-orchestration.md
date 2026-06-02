# 2026-06-01 — Sprint 31 formation (Opus orchestration)

**Model:** Opus (orchestrator / planner — no product code written).
**Trigger:** Owner uploaded a new `issues.md` (3 issues) on 2026-06-01 with the directive: *fix the design system
first; the other two are lower priority.*

## What this session did

Batched the 3 owner-reported items into **Sprint 31** (Tasks 354–356) and wrote one canonical kickoff file per task
under `tasks/Sprints/`. No `src/`, `app/`, `components/`, `modules/`, `messages/*.json`, or migration files were
touched (orchestrator standing rules, `docs/orchestrator-role.md`). No git was run (single-writer rule).

## Pre-flight audit (verified before drafting)

- Component paths confirmed on disk: `src/components/admin/AdminTable.tsx` (+stories), `AdminCardList.tsx` (+stories),
  `StatusChangeControl.tsx` (+stories), `StatusChangeHistory.tsx` (+stories); `src/components/shared/Combobox.tsx`;
  `src/components/ui/select.tsx`.
- DS evidence confirmed real: `StatusChangeControl.stories.tsx` (~lines 87–99) passes raw i18n keys as labels
  (`labelKey: 'support_status_open' | 'support_status_in_progress' | 'support_status_resolved' | 'support_status_closed'`).
  This is the confirmed root cause of "raw keys appear in normal stories."
- Locale files present: `messages/{sq,en,uk,it}.json`. npm scripts present: `typecheck`, `build`, `lint`,
  `check:i18n` (`scripts/check-i18n-parity.mjs`), `storybook`.
- Referenced docs all exist (design-system, component-governance, ui-rules, admin-ux-rules, storybook-governance,
  storybook-visual-snapshots, responsive-screenshot-matrix, component-catalog, rule-index, agent-contract).
- Numbering: `Task 354/355/356` and `Sprint_31` free; last task number was 353.

## Compliance correction during the session

After the owner challenged whether the orchestrator rules had been read, `docs/orchestrator-role.md` was read in
full. Two gaps were corrected in all three kickoffs: (1) pre-read lists were re-selected from `docs/rule-index.md`
task-type bundles instead of an ad-hoc doc list; (2) the **mandatory Task 255 `Positive flow` / `Negative flow`
sections** were added (354, 355) and required-to-be-passed-through into the Sonnet sub-task (356), with Acceptance
criteria citing both flows by name.

## Tasks produced

| # | Type | Priority | Title |
|---|---|---|---|
| 354 | Sonnet | CRITICAL (owner #1) | Admin DS primitives — overflow, row-actions & Storybook i18n hardening |
| 355 | Sonnet | high | Listing status lifecycle — owner/admin/moderator correct Sold/Rented |
| 356 | Opus | critical | Private → Agent account upgrade flow contract + Sonnet impl task |

Run order: 354 → 355 → 356 (354 is parallel-safe — disjoint file scope).

## Files Changed

| Path | Change | Rationale |
|---|---|---|
| `tasks/Sprints/Sprint_31_—_Owner_Issues_2026-06-01.md` | NEW | Sprint 31 inventory + run order + cross-refs |
| `tasks/Sprints/Sprint_31_kickoff_prompt_Task_354_AdminDSPrimitivesHardening.md` | NEW | Sonnet kickoff — DS hardening (owner priority #1) |
| `tasks/Sprints/Sprint_31_kickoff_prompt_Task_355_ListingStatusLifecycleCorrection.md` | NEW | Sonnet kickoff — sold/rented status correction |
| `tasks/Sprints/Sprint_31_kickoff_prompt_Task_356_AgentAccountUpgrade_OpusPlanning.md` | NEW | Opus planning kickoff — Private→Agent upgrade |
| `docs/sessions/2026-06-01-sprint-31-formation-orchestration.md` | NEW | This session log |
| `docs/backlog.md` | UPDATE | Last Session block + Sprint 31 run order |

## Suggested commit (owner runs in PowerShell — orchestrator-emitted, explicit paths)

```
git add tasks/Sprints/Sprint_31_—_Owner_Issues_2026-06-01.md tasks/Sprints/Sprint_31_kickoff_prompt_Task_354_AdminDSPrimitivesHardening.md tasks/Sprints/Sprint_31_kickoff_prompt_Task_355_ListingStatusLifecycleCorrection.md tasks/Sprints/Sprint_31_kickoff_prompt_Task_356_AgentAccountUpgrade_OpusPlanning.md docs/sessions/2026-06-01-sprint-31-formation-orchestration.md docs/backlog.md
git commit -m "docs(Sprint31): form Sprint 31 (Tasks 354-356) from 2026-06-01 owner issues — DS hardening first"
```

> If `git status` shows phantom-corruption mods first: `Remove-Item .git\index -ErrorAction SilentlyContinue; git reset` then the `git add` above.
