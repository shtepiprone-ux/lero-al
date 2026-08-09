# Unwaivable rule-compliance ledger — Task 740

| Rule source and exact clause | Applicability evidence | Exact mandatory outcome | Evidence artifact / command | Result |
|---|---|---|---|---|
| `CLAUDE.md` → "Every task belongs to a sprint" | New kickoff | Saved under `tasks/Sprints/`, row in the sprint plan | `Sprint_54_kickoff_prompt_Task_740_…md`; Sprint 54 closes with it | `COMPLIANT` |
| `CLAUDE.md` → "The executor's report is not proof" | CI-blocking gate logic change | Review inspects the real diff, real transcripts, real fixtures | AC1–AC12 each name a persisted artifact | `COMPLIANT` |
| `docs/qa-profiles.md` → `Q4` row | Gate is CI-blocking (727); this changes its classification logic | Planted-violation proof in both directions | R6, §13 steps 5/7, AC6 | `COMPLIANT` |
| `docs/qa-profiles.md` → no promotion without a concrete risk reason | Could have been read as Q3 | §13 states it: a false negative in a blocking gate is silent by construction | §13 | `COMPLIANT` |
| **Task 724 F1** — an exemption an author can hand-apply is not one the gate owns | The tempting fix is a `.fabLink` special case | Rule keys on computed style and geometry only; identity-keyed condition = automatic rejection | R3, AC3, contract §1 and §3 row 1 | `COMPLIANT` |
| **D32** — no migration proven against a comparator not shown to fail | Base reports 4 | Baseline is a ≥3-run **union**, not one run | R5, Checkpoint 1 | `COMPLIANT` |
| **Task 727 R2** — one predicate source, rebuilt identically at both sites | The rule may be needed in both closures | Agreement by construction, not resemblance | §10.3, Checkpoint 6 | `COMPLIANT` |
| **Task 725** — transient/permanent semantics | This changes how their boundary is computed | Semantics preserved; only the geometry feeding them changes | §3.5, R5 | `COMPLIANT` |
| **Task 739 N2** — corrected C1 is plural | The landed box unions one descendant | The extent covers every hit-testable descendant that overflows | R2, §9, AC2 | `COMPLIANT` |
| **Task 739 N3** — a flaked comparison decided a design choice | `I2b`'s `sq Instagram` row: identical inputs, opposite verdicts | ≥3 runs before any result counts as evidence | R9, AC1, Checkpoint 2 | `COMPLIANT` |
| **Task 739 N1 / attempt-1 finding 1** — the dedup was blamed twice without measurement | Both attempts attributed geometry shortfalls to the band scan | Re-measure first; only a survivor earns a number | R7, AC9, Checkpoint 9 | `COMPLIANT` |
| **Task 739 attempt 1** — a regression shipped because acceptance was a count | `FavoriteButton` went `cleared → blocked` | Identity set diff, zero tolerance, against the landed code | R5(1), AC4, Checkpoint 8 | `COMPLIANT` |
| Orchestrator standing note M1/M2/M4/M5 — the control must detect its own effect | Over-extension is the new failure direction | R6's third fixture must FAIL under a naive rule and PASS after | R6, AC6, Checkpoints 5 and 7 | `COMPLIANT` |
| **Corollary (Task 737)** — a kickoff's root cause is a hypothesis until measured | §3.2/§3.3 are the orchestrator's reading of 739's evidence | OQ4 pre-authorises `BLOCKED` on a census that refutes them | §5 OQ4, §15, Checkpoint 2 | `COMPLIANT` |
| **Corollary (Task 661)** — a verdict that is not written down did not happen | OQ1–OQ3 may end in "no action" | Each OQ needs a written disposition | AC9, §14 | `COMPLIANT` |
| Sprint 52 lesson — a blocking gate that silently never runs is the defect | The job is blocking and still unrunnable | No `continue-on-error`, no skip, no softened threshold | §8, §10.2 | `COMPLIANT` |
| **D6** — evidence is local-only | `.screenshots/task740-evidence/` | Must not appear in the diff | R12, contract §1 | `COMPLIANT` |
| `execute-task` → counting gates run last | Session log + backlog written by the task | Second pass after both exist | AC12, Checkpoint 11 | `COMPLIANT` |
| Backlog rules → "Last Session" replaced, not appended | 717 appended and produced two identical headings | Replace the block | AC11 | `COMPLIANT` |
| Backlog-baseline corollary (717 · 721 · 722) | Three executors misread the line count | Read from `git show HEAD:docs/backlog.md \| wc -l` before the first edit | R10, Checkpoint 0 | `COMPLIANT` |
| Dirty-worktree manifest requirement | Worktree may start dirty | Pre-write snapshot + classification + witnesses | A1, R11, Checkpoints 0 and 11 | `COMPLIANT` |
| `docs/orchestrator-procedures.md` → Git policy | Task changes tracked files | Mutating git is owner-only, explicit paths, native PowerShell | No git write in the task; handoff at review | `COMPLIANT` |
| `docs/orchestrator-ui-task-design.md` → visual source map / canonical UI record | **No rendered UI artifact changes** — gate script only | — | R12 forbids product files | `NOT APPLICABLE` |
| `create-task` → permanent Storybook story creation gate | No story added | — | §8 | `NOT APPLICABLE` |
