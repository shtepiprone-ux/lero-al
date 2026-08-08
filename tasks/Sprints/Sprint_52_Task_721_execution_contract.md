# Executable task contract — Task 721

## 1. One active execution route

| Field | Value |
|---|---|
| Task | 721 — three missing liveness-gate arms + 710's citation residue (Sprint 52.3, folds 728) |
| Active route / owner decision | Single route: plant-first for each new arm, then the documentation residue, then 728's reconstruction. `LIVE-THIN`'s severity is OQ1 — decided and recorded by the executor, not left as a fork |
| Decision source, date, scope | Owner 2026-08-06 split the four 710-review findings out of 711 into 721; Sprint 52 §10 orders it 52.3 |
| Starting worktree mode | **dirty with manifest** — pre-write `git status --porcelain`, per-entry classification, before/after content witnesses |
| Exact allowed final write set | `scripts/check-assertion-liveness.mjs` · `scripts/assertion-liveness-registry.json` (only if entry semantics change) · `docs/design-system.md` · `docs/storybook-governance.md` · optionally `.github/workflows/governance-pr.yml` (R8) · `docs/backlog.md` · `docs/sessions/<date>-task721-*.md`. `.screenshots/task721-evidence/` and the `I6f` reconstruction are gitignored (D6) and never appear in the diff |
| Blocked rule or decision, if any | None blocks the task. R6 ("row 50") may close `BLOCKED` on its own without failing the task |

## 2. Checkpoint matrix

| Checkpoint | Preconditions and preserved inputs | Writes allowed through this checkpoint | Observable result | Producer and persisted artifact | Comparator and failure behavior |
|---|---|---|---|---|---|
| 0 | Clean `git status --porcelain`, `git log -1` | none | Dirty-worktree manifest | `J0-status.txt` | Path outside the manifest classes → stop |
| 1 | Checkpoint 0 | none | Baseline: real manifest exits 0, five `LIVE`, ratios recorded | `I1-baseline-liveness.log` | Non-zero at baseline → the tree was already red; that is not this task |
| 2 | Checkpoint 1 | gate script | `[no-boolean-assertions]` exits **2** on a no-boolean manifest | `K1-plant-noboolean.log` | Exits 0 or 1 → the arm does not discriminate; do not proceed |
| 3 | Checkpoint 2 | gate script + registry | `ORPHAN-ENTRY` exits **1**, wording distinct from `STALE-ENTRY` | `K2-plant-orphan.log` | Indistinguishable output → the arm is unactionable |
| 4 | Checkpoint 3 | gate script | `LIVE-THIN` values printed for all five; `heroSearchWrapInBand` not flagged | `K3-livethin.log` | Flags it → rule keyed to the wrong denominator; re-derive |
| 5 | Checkpoint 4 | gate script | `--verify-gate` passes with a plant per new arm | `K4-verify.log` | Any new arm without a plant → not shipped |
| 6 | Checkpoint 5 | docs | Zero `2026-08-0X` citations; every repointed target exists | `K5-citations.log` | A target that does not exist → repointed to fiction; stop |
| 7 | Checkpoint 6 | session log | "row 50" resolved with a quoted source, or `BLOCKED` with searches listed | `K6-row50.md` | Adopting §3.5's lead with no source → rejected |
| 8 | Checkpoint 7 | none (gitignored) | `I6f` reconstruction, self-labelled as such with its source run | `.screenshots/task711-evidence/I6f-plant-popup-matrix.txt` | Labelled as a captured transcript → repeats 728's own defect |
| 9 | Checkpoint 8 | workflow (optional), backlog, session log | Real manifest exit 0; all gates green; counting passes reconcile | `K7-*` | Real manifest non-zero → CI would be red; revert before reporting |

## 3. Required counterexample trace

| Contract claim | Counterexample | Executed or analytical evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route and final write set | An `src/` change looks needed to make an arm pass | Checkpoint 9 | separate contract — escalate, do not edit `src/` | |
| Stateful baseline / manifest | Registry is empty (`entries: []`) — the ORPHAN case has nothing live | Checkpoint 3 | plant an entry; an untested arm is not shipped | |
| Stateful baseline / manifest | Registry is non-empty at run time | Checkpoint 3 | both cases distinct and fail-closed | |
| Status or diff assertion | A pre-existing modified path changes content while "untouched" | witnesses at 0 and 9 | comparator rejects equal-porcelain-only claims | |
| New gate | `LIVE-THIN` flags the healthiest assertion | Checkpoint 4 | rule re-derived; a name allowlist is not an answer | |
| New gate | An arm passes only because the real manifest never reaches it | Checkpoints 2–3 plants | each arm proven by its own plant, then clean recovery | |
| Task-created artifact | Evidence counted into the integrity denominator | Checkpoint 9, two passes | count difference detected and explained | |

## 4. Publication and review gate

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only when checkpoints 0–9 each have a persisted artifact and the real
manifest exits 0. Three arms with no plants is not this task done — the plants **are** the deliverable, because the
whole subject is a gate whose blind spots were invisible until someone planted against them.
