# Unwaivable rule-compliance ledger — Task 737

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `CLAUDE.md` → "Every task belongs to a sprint" | New kickoff | Saved under `tasks/Sprints/`, row in the sprint | `Sprint_54_kickoff_prompt_Task_737_…md`; Sprint 54 closes with it | `COMPLIANT` |
| `CLAUDE.md` → "The executor's report is not proof" | Product UI change | Review inspects real files, diff, rendered evidence | AC1–AC10 each name a persisted artifact | `COMPLIANT` |
| `docs/orchestrator-ui-task-design.md` → visual source map | A changed visible artifact | Source map for each changed and each preserved artifact | R6, AC6, Checkpoint 3 | `COMPLIANT` |
| `docs/orchestrator-ui-task-design.md` → canonical UI decision record | Same | `reuse` / `extend` / `create canonical`, explicitly | R6, AC6 | `COMPLIANT` |
| `docs/orchestrator-ui-task-design.md` → no guessed local value | The fix needs a length | No token fits → `BLOCKED — CANONICAL STYLE DECISION REQUIRED` | R2, contract §1 | `COMPLIANT` |
| `docs/orchestrator-ui-task-design.md` → `preserve`/`out of scope` needs positive evidence | uk/320/390 currently pass | Must be **shown** unchanged, not assumed | R7, AC7, Checkpoint 7 | `COMPLIANT` |
| `docs/qa-profiles.md` → `Q3` row | Shell layout change across mobile widths × 4 locales | Q1 gates + full canonical visual evidence incl. `uk@320` | §13 steps 7–10 | `COMPLIANT` |
| `docs/qa-profiles.md` → do not promote without a concrete risk reason | Could have been read as Q4 | §3.5 confirms neither component is in `critical-flow-registry.md` → Q3, stated | §3.5, §13 | `COMPLIANT` |
| **D34** — a D28 module reproduces the utility's cascade layer | `MobileBottomNavView.module.css` is Task 713's D28 work | `@layer utilities` wrapper must survive | R4, AC4 | `COMPLIANT` |
| **D28** — mechanism-only, zero visual delta | Binds what 713 landed, **not** this bug fix | Do not re-hybridise the component while fixing the collision | §3.4, §8, R4 | `COMPLIANT` |
| Sprint 54 standing constraint — "a collision fix is not a licence to re-hybridise" | This is that collision fix | Minimal change; mechanism intact | §7.3, §10.2 | `COMPLIANT` |
| **D32** — no migration proven against a comparator not shown to fail | The gate reported 6 | The pre-fix 6 is the comparator; 0 is the proof | R3, Checkpoints 1 and 5 | `COMPLIANT` |
| Orchestrator standing note — "measure with the real tool, not an ad-hoc grep" | Geometry drives the fix | Live measurement, not arithmetic from declarations (A2 flags the kickoff's own numbers as unverified) | R1, §3.2, Checkpoint 2 | `COMPLIANT` |
| Orchestrator standing note M1/M2/M4/M5 — the control must detect its own effect | A padding fix could hide rather than fix | The gate's 6 → 0 plus geometry, and passing cells shown unchanged | R3, R7 | `COMPLIANT` |
| **D6** — evidence is local-only | `.screenshots/task737-evidence/` | Must not appear in the diff | Contract §1, §14 | `COMPLIANT` |
| `execute-task` → counting gates run last | Session log + backlog written by the task | Second pass after both exist | AC10, Checkpoint 9 | `COMPLIANT` |
| Backlog rules → "Last Session" replaced, not appended | 717 appended and produced two identical headings | Replace the block | §14 | `COMPLIANT` |
| Backlog-baseline corollary (717 · 721 · 722) | Three executors misread the line count | Read from `git show HEAD:docs/backlog.md \| wc -l` before the first edit | R11, Checkpoint 0 | `COMPLIANT` |
| Dirty-worktree manifest requirement | Worktree may start dirty | Pre-write snapshot + classification + witnesses | A1, Checkpoints 0 and 9 | `COMPLIANT` |
| `docs/orchestrator-procedures.md` → Git policy | Task changes tracked files | Mutating git is owner-only, explicit paths, PowerShell | No git write in the task; handoff at review | `COMPLIANT` |
| `create-task` → permanent Storybook story creation gate | No story added | — | §8; no story in the write set | `NOT APPLICABLE` |
