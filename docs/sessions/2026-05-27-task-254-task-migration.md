# Session Archive: Task 254 — Migrate queued tasks to the new concrete Sonnet template — 2026-05-27

**Role:** Opus 4.7 — orchestrator / architect / reviewer. **No product code touched.**

## Scope of this task

Edit only:
- `tasks/Epics/*` (kickoff prompts for pending tasks)
- `tasks/Sprints/*` (kickoff prompts for pending tasks)
- `docs/backlog.md`
- `docs/sessions/2026-05-27-task-254-task-migration.md` (this file)

Forbidden:
- `src/`, `app/`, `components/`, `modules/`, server actions, migrations, runtime UI, styling.
- `messages/*.json`.

## Inventory of queued task files

| Task | File | Current status | Needs migration? | Reason |
|---|---|---|---|---|
| 250 | `tasks/Epics/Epic_R_kickoff_prompt_Task_250.md` | Pending (Sprint 12 R.3a) | **Yes** | Touches admin permissions UI (admin table + edit-flow + RLS). Original prompt is concrete but needs `agent-contract.md` Pre-read + `rule-index.md` bundle + explicit "Current behavior to preserve" / "Required after behavior" sections + Notes 22/23 reference. |
| 251 | `tasks/Epics/Epic_GG_kickoff_prompt_Task_251.md` | Pending (Sprint 13 GG.1) | **Yes** | Touches admin email-templates editor (admin control task). Needs new Pre-read + behavior-preservation blocks + Note 22 reference. |
| 252 | `tasks/Epics/Epic_V_kickoff_prompt_Task_252.md` | Pending (Sprint 13 V.3) | **Yes** | Admin Sales inbox split — admin table task + control relocation (the mailbox-filter dropdown moves to a route-level split). Needs Notes 21 + 22 references. |
| 228, 234, 235, 236, 239, 242, 244, 248 | `tasks/Sprints/Sprint_12_kickoff_prompts.md` | Pending (Sprint 12 active) | **Yes** | All 8 tasks live in a single multi-prompt file. Needed: Sprint-wide header note pointing to `agent-contract.md` + `rule-index.md` and a `Current behavior to preserve` / `Required after behavior` block per task. Task 235 also gets explicit Note 22 reference (admin table). Task 248 gets Note 23 reference (profile edit-flow). |
| 229–233 | Not yet broken out into per-task kickoff files | Sprint 13 deferred (Epic W follow-ups) | **No (no file yet)** | Listed in `Epic_W_Listings_Filter_Bar_and_Drawer_Polish.md` as line items. When the orchestrator files a per-task kickoff (in the future), it must use the new template directly. |
| 237, 238 | Not yet broken out into per-task kickoff files | Sprint 13 deferred (Epic Y follow-ups) | **No (no file yet)** | Same — to be filed with the new template when the orchestrator schedules them. |
| 240, 241, 243, 245, 246, 247, 249 | Not yet broken out | Sprint 13 deferred (Epics Z / AA / BB / CC / DD / EE / FF) | **No (no file yet)** | Same. |
| All tasks 84–227 (kickoff files in `tasks/Epics/*kickoff_prompt_Task_*.md` and `tasks/Sprints/*kickoff_prompt_Task_*.md`) | various | **Completed** — sessions exist under `docs/sessions/` | **No** | Per Task 254 rules: do not rewrite completed task reports or historical kickoff files. |
| All Closed Epics / Closed Sprint summaries (`Epic_*_Summary_CLOSED.md`, `Sprint_*_—_Summary_CLOSED.md`) | various | **Closed** | **No** | Historical final reports — do not rewrite. |
| `Opus_Task_253.md`, `Opus_Task_254.md` | these two | **Owner-authored task specs for me** | **No** | These are the owner's instructions to the orchestrator, not Sonnet kickoffs. |

### Decision: tasks 229–233, 237–238, 240–249, 245, 246, 247, 249 are NOT migrated in this task

They do not have individual kickoff files yet — they exist only as line items inside `Epic_W_*`,
`Epic_Y_*`, `Epic_Z_*`, `Epic_AA_*`, `Epic_BB_*`, `Epic_CC_*`, `Epic_DD_*`, `Epic_EE_*`,
`Epic_FF_*` plan files. Task 254's mandate is to migrate **pending task FILES**, not to rewrite
epic plans or to invent new kickoff files that do not exist. When the orchestrator later schedules
these tasks (Sprint 13+), each new kickoff must use the new template directly from `ai-behavior.md`.

### Decision: epic plan files (`Epic_W_*`, `Epic_X_*`, etc.) are NOT rewritten

These describe high-level epic goals — they are not Sonnet kickoffs. They predate the new template
by design (they are documentation of an Epic's overall direction). Each individual task's kickoff
(filed separately or inside a Sprint prompt collection) IS migrated. Rewriting the Epic plan files
would expand scope beyond Task 254's mandate ("rewrite all pending / queued future tasks") — those
files are not tasks.

## Migrated files (this task)

1. `tasks/Epics/Epic_R_kickoff_prompt_Task_250.md` — Pre-read replaced with rule-index bundle (Admin table + DB/RLS); added Localization coverage, Responsive coverage, Current behavior to preserve, Required after behavior, Notes 22 + 23 conditional blocks.
2. `tasks/Epics/Epic_GG_kickoff_prompt_Task_251.md` — Pre-read replaced (Email/auth lifecycle + Admin control bundles); added new sections + Note 22 conditional block.
3. `tasks/Epics/Epic_V_kickoff_prompt_Task_252.md` — Pre-read replaced (Admin table + Control-relocation bundles); added new sections + Notes 21 + 22 conditional blocks.
4. `tasks/Sprints/Sprint_12_kickoff_prompts.md` — Sprint-wide header now references `agent-contract.md` + `rule-index.md` + Notes 18/19/20/21/22/23. Each of the 8 sub-tasks (228, 234, 235, 236, 239, 242, 244, 248) gained `Pre-read` with explicit rule-index bundle + `Current behavior to preserve` + `Required after behavior`. Task 235 carries Note 22 (admin table). Task 248 carries Note 23 (edit-flow).

## Preservation checks

- Original task numbers preserved. ✅
- Original task titles preserved. ✅
- Original Epic / Sprint placement preserved (no file moves). ✅
- Original business goal preserved (Goal / Scope sections untouched in content). ✅
- Original scope preserved (Out of scope untouched). ✅
- Original acceptance criteria preserved (added new behavioral AC at top where needed; did not remove any existing AC). ✅
- "Read all docs" wording — was never present in these kickoffs (they already used task-specific pre-read lists); each is now explicitly tied to a `rule-index.md` bundle. ✅
- Completed tasks not rewritten. ✅
- Historical final reports / session logs not rewritten. ✅
- No product code changed. ✅
- No locale message files changed. ✅

## Out-of-scope items observed but not addressed

- Some Epic plan files (`Epic_W_*`, `Epic_Y_*`, etc.) contain prose that overlaps with future
  task definitions. Migrating those would expand scope and risk weakening epic-level descriptions.
  Future Sprint-13 kickoffs for these items must use the new Canonical Task Template directly.
- `Sprint_11_UI_Debt_followups.md` was inspected; all its tasks (225–227) are in the Session Archive — completed. Not migrated.
- Older per-task kickoff files (`Sprint_9_kickoff_prompt_Task_*.md`, `Epic_D_kickoff_prompt_Task_*.md`, etc.) are historical artifacts for already-completed tasks. Not migrated.

## Validation performed (Task 254)

Grep-based checks (docs/governance-only task — no product code touched, so `tsc` / `build` are out of scope and remain mandatory for the Sonnet kickoffs themselves when they execute).

| Check | Result |
|---|---|
| Migrated pending tasks do NOT carry "read all docs" wording | ✅ (only 1 hit — in `Sprint_12_kickoff_prompts.md` line 12, the new header explicitly forbidding it) |
| Migrated pending tasks reference `docs/agent-contract.md` | ✅ (Task 250 = 1, Task 251 = 1, Task 252 = 1, Sprint_12 = 3 references including the header note) |
| Migrated pending tasks reference `docs/rule-index.md` for task-type bundles | ✅ (Task 250 = 1, Task 251 = 1, Task 252 = 1, Sprint_12 = 7 references — one per sub-task block) |
| Task 254 appears in `docs/backlog.md` (Last Session block + Session Archive row + "Last task number: 254") | ✅ |
| Task 254 session log exists under `docs/sessions/` | ✅ (`docs/sessions/2026-05-27-task-254-task-migration.md`) |
| No product code (`src/`, `app/`, `components/`, `modules/`, `messages/`, migrations) changed | ✅ |
| Original task numbers preserved (250 / 251 / 252 / 228 / 234 / 235 / 236 / 239 / 242 / 244 / 248) | ✅ |
| Original scope, AC, and Out-of-scope sections preserved (additions only, no deletions of intent) | ✅ |
| Completed task files and historical session logs not rewritten | ✅ |
| Locale message files not changed | ✅ |
| Single-writer git rule respected — no git commands executed | ✅ |

Validation verdict: tsc/build N/A (no product code) · pending-kickoff migration = complete (4 files / 11 sub-tasks) · scope-preservation = green · scope = clean.

## Ready-to-run git commands for owner

```
git add tasks/Epics/Epic_R_kickoff_prompt_Task_250.md tasks/Epics/Epic_GG_kickoff_prompt_Task_251.md tasks/Epics/Epic_V_kickoff_prompt_Task_252.md tasks/Sprints/Sprint_12_kickoff_prompts.md docs/backlog.md docs/sessions/2026-05-27-task-254-task-migration.md
git commit -m "chore(Task254): migrate pending kickoff files to the new concrete Sonnet template"
```

Run these in PowerShell from the repo root. One commit, one logical change. Single `git add` line with explicit paths — do NOT add `^` or backtick continuations.

**Note on commit ordering with Task 253:** Tasks 253 and 254 can be committed in two separate commits in this order (recommended — Task 253 introduces the rules; Task 254 applies them):

```
# Commit 1 — Task 253
git add docs/agent-contract.md docs/rule-index.md docs/orchestrator-role.md docs/ai-behavior.md docs/backlog.md docs/sessions/2026-05-27-task-253-governance-compression.md
git commit -m "chore(Task253): AI governance compression — agent-contract.md + rule-index.md + Notes 21/22/23 + refactored Canonical Task Template"

# Commit 2 — Task 254
git add tasks/Epics/Epic_R_kickoff_prompt_Task_250.md tasks/Epics/Epic_GG_kickoff_prompt_Task_251.md tasks/Epics/Epic_V_kickoff_prompt_Task_252.md tasks/Sprints/Sprint_12_kickoff_prompts.md docs/sessions/2026-05-27-task-254-task-migration.md
git commit -m "chore(Task254): migrate pending kickoff files to the new concrete Sonnet template"
```

(Note: `docs/backlog.md` appears in the first commit; the second commit only stages `tasks/*` + the Task 254 session log because `backlog.md` is already covered by the Task 253 commit's staged changes. If you prefer to keep both Tasks' backlog entries in their own commit, you can `git restore --staged docs/backlog.md` between the two `git add` calls and re-stage it for Task 254 — but a single commit covering both Tasks is also acceptable since they were filed in the same orchestrator session.)
