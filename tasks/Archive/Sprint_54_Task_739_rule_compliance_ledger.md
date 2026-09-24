# Unwaivable rule-compliance ledger — Task 739

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `CLAUDE.md` → "Every task belongs to a sprint" | New kickoff | Saved under `tasks/Sprints/`, row in the sprint plan | `Sprint_54_kickoff_prompt_Task_739_…md`; Sprint 54 closes with it | `COMPLIANT` |
| `CLAUDE.md` → "The executor's report is not proof" | CI-blocking gate logic change | Review inspects the real diff, real transcripts, real fixtures | AC1–AC12 each name a persisted artifact | `COMPLIANT` |
| `docs/qa-profiles.md` → `Q4` row | Gate is CI-blocking (727) and this changes its classification logic | Planted-violation proof required, both directions | R4, §13 steps 4/6, AC6 | `COMPLIANT` |
| `docs/qa-profiles.md` → do not promote without a concrete risk reason | 729 ran Q3 on the same file | §13 states the reason: coverage widening vs. classification logic in a now-blocking gate; a false negative here is silent by construction | §13 | `COMPLIANT` |
| **D32** — no migration proven against a comparator not shown to fail | The gate reports 6 | The pre-fix 6 is the comparator; the new fixtures must be shown failing pre-fix | R4, R5, Checkpoints 1 and 4 | `COMPLIANT` |
| **Task 724 F1** — an exemption an author can hand-apply is not an exemption the gate owns | Option 2 from 737's §7 was a CI exemption | Rejected at design time; recorded in contract §1 and §3 | Contract §1, §3 row 2 | `COMPLIANT` |
| **Task 727 R2** — one predicate source, rebuilt identically at both sites | The fix touches classification used by both paths | Agreement by construction, not resemblance | R3 C4, §10.3, Checkpoint 5 | `COMPLIANT` |
| **Task 725** — transient/permanent semantics | This task changes how their boundary is computed | Semantics preserved; only the geometry that feeds them changes | §3.9, R3 C5 | `COMPLIANT` |
| Orchestrator standing note — "measure with the real tool, not an ad-hoc grep" | Geometry drives the fix | Live census, not arithmetic from declarations; §3 flags its own numbers as re-measurable | R1, §3, Checkpoint 2 | `COMPLIANT` |
| Orchestrator standing note M1/M2/M4/M5 — the control must detect its own effect | A generous generator could clear everything | `/permanent` + new twin + 725's plant must all still fail | R3 C5, A2, Checkpoints 6 and 8 | `COMPLIANT` |
| **Corollary (Task 737)** — a kickoff's root cause is a hypothesis until measured | 737's kickoff was structurally wrong | OQ4 pre-authorises `BLOCKED` on a census that refutes §3.4 | §5 OQ4, §15, Checkpoint 2 | `COMPLIANT` |
| **Corollary (Task 661)** — a verdict that is not written down did not happen | OQ1–OQ3 may end in "not fixed here" | Each OQ needs a written disposition, not silence | AC8, §14 | `COMPLIANT` |
| **Corollary (Task 721)** — read what a config keys on, not what it appears to key on | `nearestFixedOrStickyAncestorOf` keys on computed `position`; sticky ≠ fixed | OQ1 requires sticky invariance to be measured, not assumed | §5 OQ1 | `COMPLIANT` |
| Sprint 52 lesson — a blocking gate that silently never runs is the defect | The job is blocking and currently unrunnable (secrets) | No `continue-on-error`, no skip, no softened threshold | R7, §8 | `COMPLIANT` |
| **D6** — evidence is local-only | `.screenshots/task739-evidence/` | Must not appear in the diff | R11, contract §1, §14 | `COMPLIANT` |
| `execute-task` → counting gates run last | Session log + backlog written by the task | Second pass after both exist | AC12, Checkpoint 10 | `COMPLIANT` |
| Backlog rules → "Last Session" replaced, not appended | 717 appended and produced two identical headings | Replace the block | AC11 | `COMPLIANT` |
| Backlog-baseline corollary (717 · 721 · 722) | Three executors misread the line count | Read from `git show HEAD:docs/backlog.md \| wc -l` before the first edit | R9, Checkpoint 0 | `COMPLIANT` |
| Dirty-worktree manifest requirement | Worktree may start dirty | Pre-write snapshot + classification + witnesses | A1, R10, Checkpoints 0 and 10 | `COMPLIANT` |
| `docs/orchestrator-procedures.md` → Git policy | Task changes tracked files | Mutating git is owner-only, explicit paths, native PowerShell | No git write in the task; handoff at review | `COMPLIANT` |
| `docs/orchestrator-ui-task-design.md` → visual source map / canonical UI record | **No rendered UI artifact changes** — gate script only | — | R6 forbids product files; nothing visible changes | `NOT APPLICABLE` |
| `create-task` → permanent Storybook story creation gate | No story added | — | §8; no story in the write set | `NOT APPLICABLE` |
