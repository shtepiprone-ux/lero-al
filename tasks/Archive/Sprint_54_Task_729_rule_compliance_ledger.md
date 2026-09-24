# Unwaivable rule-compliance ledger — Task 729

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `CLAUDE.md` → "Every task belongs to a sprint" | New kickoff | Saved under `tasks/Sprints/`, row in the sprint | `Sprint_54_kickoff_prompt_Task_729_…md`; Sprint 54 names 729 as its closing task | `COMPLIANT` |
| `CLAUDE.md` → "The executor's report is not proof" | CI-blocking gate coverage changes | Review inspects real files, diff, evidence | AC1–AC10 each name a persisted artifact | `COMPLIANT` |
| `docs/qa-profiles.md` → `Q4` row | A CI-blocking gate's coverage changes; a gate behaviour is claimed | Q1–Q3 as applicable **plus** planted-violation failure proof | §13 steps 6–7 | `COMPLIANT` |
| **D32** — no migration proven against a comparator not shown to fail | Coverage is being widened | The excluded set must be counted before it is closed; the plant's prior result is the comparator | R1, R4; Checkpoints 2 and 6 | `COMPLIANT` |
| Task 722 lesson — a number that reads as coverage but is not | `checked=N` excludes below-fold candidates silently | The skipped count ships regardless of which branch §7.3 selects | R2, §7.2, contract §4 | `COMPLIANT` |
| Task 733 lesson — do not state an unmeasured size as fact | The hole's size has never been counted | Declare it unmeasured; require the census to produce it | §3.3, A2 | `COMPLIANT` |
| Task 725 §14.9.29 — transient vs permanent decided by measurement | This task edits the same two-phase contract | The distinction must survive any widening | §10.3 | `COMPLIANT` |
| Task 727 (approved 2026-08-09) must not regress | Same function, three days old, CI-blocking | Predicate, both call sites, three scenarios, dialog-open guard witnessed unchanged | R6, AC6, Checkpoint 5 | `COMPLIANT` |
| 724 F1 (closed by 726) — an exemption an author applies is not one the gate owns | A widening could be undone by a new skip | No author-appliable exemption may be added to keep the gate fast | §7.3 second bullet, negative-flow row | `COMPLIANT` |
| Orchestrator standing note M1/M2/M4/M5 — the control must detect its own effect | The subject is a control blind to a whole region | Plant with a **recorded prior result**; zero-exclusion census pre-declared as failure | R4, A2 | `COMPLIANT` |
| `create-task` → probe restoration must be **evidenced** | R4 plants in `FooterView.module.css` | `git hash-object` equal to pre-plant **and** absence from `git status --porcelain` | AC5, Checkpoint 7 | `COMPLIANT` |
| `create-task` → permanent Storybook story creation gate | The plant is a CSS probe, not story markup | No story added or extended | §8 out-of-scope | `NOT APPLICABLE` |
| **D6** — evidence is local-only | `.screenshots/task729-evidence/` | Must not appear in the diff; stated in the session log | Contract §1, §14 | `COMPLIANT` |
| `execute-task` → counting gates run last | Session log + backlog written by the task | Second pass after both exist | AC10, Checkpoint 9 | `COMPLIANT` |
| Backlog rules → "Last Session" replaced, not appended | 717 appended and produced two identical headings | Replace the block | §14 | `COMPLIANT` |
| Backlog-baseline corollary (717 · 721 · 722) | Three executors misread the line count | Read from `git show HEAD:docs/backlog.md \| wc -l` before the first edit | R11, Checkpoint 0 | `COMPLIANT` |
| Dirty-worktree manifest requirement | Worktree may start dirty | Pre-write snapshot + classification + witnesses | A1, Checkpoints 0 and 9 | `COMPLIANT` |
| `docs/orchestrator-procedures.md` → Git policy | Task changes tracked files | Mutating git is owner-only, explicit paths, PowerShell | No git write in the task; handoff at review | `COMPLIANT` |
| UI task-design requirements | The `FooterView` plant is reverted, nothing ships | Visual source map + canonical UI decision record | No `src/` change survives the task | `NOT APPLICABLE` |
