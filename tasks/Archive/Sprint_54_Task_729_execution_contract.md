# Executable task contract — Task 729

## 1. One active execution route

| Field | Value |
|---|---|
| Task | 729 — the click-shield gate's below-fold blind spot (Sprint 54, closing task) |
| Active route / owner decision | Single route: **measure, then apply §7.3's stated rule**. The fix is not pre-chosen; it is selected by the census. Only a materially slower blocking CI job escalates to the owner |
| Decision source, date, scope | Finding recorded by Task 725's executor (session log §R12, 2026-08-07) and reserved as 729; Sprint 54 names 729 as its closing condition |
| Starting worktree mode | **dirty with manifest** — pre-write `git status --porcelain`, per-entry classification, before/after content witnesses |
| Exact allowed final write set | `scripts/check-click-shield.mjs` · `docs/storybook-governance.md` (§14.9.29) · `docs/backlog.md` · `docs/sessions/<date>-task729-*.md`. Evidence in `.screenshots/task729-evidence/` (gitignored, D6). `src/components/layout/FooterView.module.css` is touched **only** as a reverted plant |
| Blocked rule or decision, if any | §7.3: if the cheapest correct fix materially slows the CI-blocking job, publish `BLOCKED — OWNER DECISION REQUIRED` with measured before/after wall-clock rather than shipping or narrowing |

## 2. Checkpoint matrix

| Checkpoint | Preconditions and preserved inputs | Writes allowed through this checkpoint | Observable result | Producer and persisted artifact | Comparator and failure behavior |
|---|---|---|---|---|---|
| 0 | Clean `git status --porcelain`, `git show HEAD:docs/backlog.md \| wc -l` | none | Dirty manifest + backlog baseline quoted | `J0-status.txt` | Path outside the manifest classes → stop |
| 1 | Checkpoint 0 | none | Pre-change baseline: all 3 scenarios + wall-clock | `I1-baseline.log` | Cannot reach `127.0.0.1:3000` → fix the harness before any edit |
| 2 | Checkpoint 1 | gate script (instrumentation) | Excluded-candidate census per scenario × cell | `I2-census.json` | **Zero exclusions anywhere → instrumentation failure** (A2); 725 proved at least one exists |
| 3 | Checkpoint 2 | gate script | §7.3 branch selected, with the rejected alternative recorded | `K1-decision.md` | Branch chosen without citing the census → reject |
| 4 | Checkpoint 3 | gate script | Skipped count in the gate's normal output beside `checked` | `K2-output.log` | Behind a debug flag → R2 not met |
| 5 | Checkpoint 4 | gate script | Base scenario verdicts unchanged; 727's predicate/scenarios/guard intact | `K3-base-rerun.log` | Base turned red, or 727 refactored → revert |
| 6 | Checkpoint 5 | `FooterView.module.css` (plant only) | The plant now produces a result — stated against 725's recorded **zero change** | `K4-footer-plant.log` | Still zero change → coverage did not actually widen |
| 7 | Checkpoint 6 | plant removal only | Hash equals pre-plant; porcelain clean for that path | `K5-restore.txt` | Mismatch → `BLOCKED`, never "restored" on assertion |
| 8 | Checkpoint 7 | none | Wall-clock after, same machine; delta stated | `K6-timing.txt` | Material slowdown → §7.3 escalation, not a silent ship |
| 9 | Checkpoint 8 | docs, backlog, session log | `:verify` passes; all gates green; counting passes reconcile | `K7-*` | Real occluded control found → named, attributed, reserved; **not** fixed |

## 3. Required counterexample trace

| Contract claim | Counterexample | Executed or analytical evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route and final write set | A real occluded control is found and "would be quick to fix" | Checkpoint 9 | separate contract — reserve a number, do not edit `src/` | |
| Stateful baseline / manifest | Census returns **zero** excluded candidates | Checkpoint 2 | fail-closed: instrumentation is wrong, not the page (A2) | |
| Stateful baseline / manifest | Census returns a large exclusion count | Checkpoint 2 | proceed to §7.3's second branch; a flood of new violations is itself a reportable finding | |
| Status or diff assertion | A pre-existing modified path changes content while "untouched" | witnesses at 0 and 9 | comparator rejects equal-porcelain-only claims | |
| New coverage | The `FooterView` plant still produces zero change | Checkpoint 6 | the widening did not take effect — do not report success | |
| New coverage | Coverage widened but CI time doubles | Checkpoint 8 | escalate; neither shipping it nor narrowing it is the executor's call | |
| Pre-existing work | 727's predicate reconstructed differently at the two sites | Checkpoint 5 + `:verify` | R6 — restore 727's form exactly | |
| Task-created artifact | Evidence counted into the integrity denominator | Checkpoint 9, two passes | count difference detected and explained | |

## 4. Publication and review gate

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only when checkpoints 0–9 each have a persisted artifact, the census
total is stated as one number, and the `FooterView` plant's new result is stated **against 725's recorded zero
change**. On the documentation-only branch of §7.3, R2 must still have shipped — a task that concludes "no coverage
change needed" and leaves `checked` still implying full coverage has not done its job.
