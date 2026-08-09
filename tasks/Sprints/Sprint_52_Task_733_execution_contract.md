# Executable task contract — Task 733

## 1. One active execution route

| Field | Value |
|---|---|
| Task | 733 — stop discarding form controls inside `[role="dialog"]` (Sprint 52.5) |
| Active route / owner decision | Single route: re-derive → census → replace-or-remove the skip → plant → escalate what surfaces. Fixing any product component it exposes is a different task |
| Decision source, date, scope | Finding raised in the Task 722 review (2026-08-08) and filed as 733; Sprint 52 §10 orders it 52.5, independent of 52.2–52.4 |
| Starting worktree mode | **dirty with manifest** — pre-write `git status --porcelain`, per-entry classification, before/after content witnesses |
| Exact allowed final write set | `scripts/check-stories-rendered.mjs` (assertion (b) only) · `docs/storybook-governance.md` · `docs/backlog.md` · `docs/sessions/<date>-task733-*.md`. Evidence lives in `.screenshots/task733-evidence/` (gitignored, D6) |
| Blocked rule or decision, if any | None blocks the task. A newly-surfaced product defect is a **stop-and-file**, not a fix |

## 2. Checkpoint matrix

| Checkpoint | Preconditions and preserved inputs | Writes allowed through this checkpoint | Observable result | Producer and persisted artifact | Comparator and failure behavior |
|---|---|---|---|---|---|
| 0 | Clean `git status --porcelain`, `git show HEAD:docs/backlog.md \| wc -l` | none | Dirty manifest + backlog baseline quoted | `J0-status.txt` | Path outside the manifest classes → stop |
| 1 | Checkpoint 0 | none | 852 / 156 / 120 re-derived from a fresh manifest | `I1-census.json` | Differs from the kickoff → reconcile before editing (D32) |
| 2 | Checkpoint 1 | none | Overlay DOM census at 375px across the 10 blind stories | `I2-overlay-dump.json` | A story that cannot be opened → record it; do not infer its shape |
| 3 | Checkpoint 2 | gate script (assertion (b)) | Skip removed or narrowed, with its comment | `K1-gate-diff.txt` | Diff touching assertion (d), `isChipSetMember`, `FULL_WIDTH_TOLERANCE` or `MANTINE_VIEWPORTS` → revert (R8) |
| 4 | Checkpoint 3 | none | Blind-cell count drops; the delta is stated | `K2-blind-delta.log` | **Zero delta → treat as failure**, not success: verify the edit took effect (A3) |
| 5 | Checkpoint 4 | probe in one existing story | A narrowed control inside an open overlay resolves `false`, named | `K3-plant.log` | Still `true`/`null` → the skip did not really come out |
| 6 | Checkpoint 5 | probe removal only | Pre-probe hash restored, path absent from porcelain | `K4-restore.txt` | Mismatch → `BLOCKED`, never "restored" on assertion |
| 7 | Checkpoint 6 | none | 722's guard intact: a control-free cell still resolves `null`, not `true` | `K5-checkedany-witness.log` | A control-free cell resolving `true` → 722 regressed; stop |
| 8 | Checkpoint 7 | docs, backlog, session log | Final matrix vs `1164/1204 PASS, 18 FAIL, 22 AMBIGUOUS`; every new `false` named and filed | `K6-final-matrix.log`, `K7-*` | A newly-green cell produced by a new exemption → reject |

## 3. Required counterexample trace

| Contract claim | Counterexample | Executed or analytical evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route and final write set | A product fix looks like the quickest way to a green cell | Checkpoint 8 | separate contract — file it, do not edit `src/` | |
| Stateful baseline / manifest | The census returns zero blind cells | Checkpoint 1 | fail-closed: zero means the query is wrong, not that the hole is gone | |
| Stateful baseline / manifest | The census returns the expected 120 | Checkpoint 1 | proceed; the number is the before-side of AC6 | |
| Status or diff assertion | A pre-existing modified path changes content while "untouched" | witnesses at 0 and 8 | comparator rejects equal-porcelain-only claims | |
| New gate | Skip removed but no cell changes state | Checkpoint 4 | **suspicious, not successful** — prove the edit is reached before reporting | |
| New gate | The replacement keys on a role/class/name an author supplies | Checkpoint 3 | 724 F1 regression — re-derive from measured DOM | |
| Pre-existing guard | A control-free cell resolves `true` again | Checkpoint 7 | 722 regressed; revert and stop | |
| Task-created artifact | Evidence counted into the integrity denominator | Checkpoint 8, two passes | count difference detected and explained | |

## 4. Publication and review gate

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only when checkpoints 0–8 each have a persisted artifact, the plant
transcript shows a real failure and a clean recovery, and the blind-cell delta is stated as two numbers. This task's
entire claim is that an assertion can now see 120 cells it never saw — the before/after count **is** the deliverable,
and a green matrix with no delta proves nothing.
