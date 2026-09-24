# Executable task contract — Task 678

## 1. One active execution route

| Field | Value |
|---|---|
| Task | 678 — per-story gate enrolment, then 699's xxl gap and AdminUsersTable (Sprint 52.4, folds 687) |
| Active route / owner decision | **Surgical.** Owner decision 2026-08-08: do NOT expand `MANTINE_VIEWPORTS` globally — measured at 4024 cells / ~102 min on a CI-blocking gate against the code's own documented rationale. The backlog's "14-width matrix enrolment" framing is retired |
| Decision source, date, scope | Owner, 2026-08-08, in response to the measurement in §3.1; Sprint 52 §10 orders this 52.4, after 52.1 (722) made the assertions honest |
| Starting worktree mode | **dirty with manifest** — pre-write `git status --porcelain`, per-entry classification, before/after content witnesses |
| Exact allowed final write set | `scripts/lib/mantine-story-scope.mjs` · `scripts/check-stories-rendered.mjs` (enrolment wiring + `MANTINE_STORY_EXTRA_VIEWPORTS` only) · `scripts/check-locale-leak.mjs` / `check-story-coverage.mjs` (only if scope resolution must be re-threaded) · `docs/storybook-governance.md` · `docs/backlog.md` · `docs/sessions/<date>-task678-*.md`. An `src/` story retitle is allowed **only** under §7.4's recorded decision |
| Blocked rule or decision, if any | None blocks the task. A `check:locale-leak` or `check:story-coverage` failure on the newly-enrolled admin story is a **stop-and-report**, not a fix (A2) |

## 2. Checkpoint matrix

| Checkpoint | Preconditions and preserved inputs | Writes allowed through this checkpoint | Observable result | Producer and persisted artifact | Comparator and failure behavior |
|---|---|---|---|---|---|
| 0 | Clean `git status --porcelain`, `git show HEAD:docs/backlog.md \| wc -l` | none | Dirty manifest + backlog baseline quoted | `J0-status.txt` | Path outside the manifest classes → stop |
| 1 | Checkpoint 0 | none | §3.3 table re-derived; three gates' pre-change scoped counts | `I1-before-3gates.log` | Numbers differ from the kickoff → report before editing (D32) |
| 2 | Checkpoint 1 | none | Baseline matrix `1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS` | `I2-baseline-matrix.log` | Any other baseline → reconcile first |
| 3 | Checkpoint 2 | scope module | Per-story enrolment exists; prefix list unchanged | `K1-mechanism-diff.txt` | A new prefix added → rejected, that is the 21-story blast radius |
| 4 | Checkpoint 3 | scope module | `AdminUsersTable` in scope; other 20 `Admin/` stories out — stated as counts | `K2-scope-delta.log` | Sibling count > 0 → mechanism is not per-story |
| 5 | Checkpoint 4 | rendered gate | `HowItWorksSteps` has cells at ≥1440 | `K3-xxl.log` | `MANTINE_VIEWPORTS` touched → revert, R8 |
| 6 | Checkpoint 5 | plant (one story) | An un-enrolled story appears in **none** of the three gates | `K4-negative-plant.log` | Appears in any → enrolment is not gating anything |
| 7 | Checkpoint 6 | plant removal only | Pre-plant hash restored, path absent from porcelain | `K5-restore.txt` | Mismatch → `BLOCKED`, never "restored" on assertion |
| 8 | Checkpoint 7 | docs, backlog, session log | Final matrix; every moved cell named; three gates green or failures escalated | `K6-final-matrix.log`, `K7-*` | A newly-green cell produced by a new exemption → reject |

## 3. Required counterexample trace

| Contract claim | Counterexample | Executed or analytical evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route and final write set | The global 14-width sweep "would be simpler" | §3.1 measurement | out of scope by owner decision — report, do not implement | |
| Stateful baseline / manifest | Zero stories enrolled by the new mechanism (empty case) | Checkpoint 4 | fail-closed: an empty enrolment set must not silently widen or narrow scope | |
| Stateful baseline / manifest | Enrolment set non-empty | Checkpoint 4 | exactly the named stories, siblings excluded | |
| Status or diff assertion | A pre-existing modified path changes content while "untouched" | witnesses at 0 and 8 | comparator rejects equal-porcelain-only claims | |
| New gate | Enrolment changes nothing observable | Checkpoints 4–6 | the negative plant proves gating is real, not decorative | |
| New gate | Newly-enrolled cells fail | Checkpoint 8 | named, attributed, escalated — never suppressed (724) | |
| Task-created artifact | Evidence counted into the integrity denominator | Checkpoint 8, two passes | count difference detected and explained | |

## 4. Publication and review gate

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only when checkpoints 0–8 each have a persisted artifact, the negative
plant transcript exists, and `MANTINE_VIEWPORTS` is witnessed byte-identical. Enrolment without the negative plant
proves only that a story was added — not that anything is being gated.
