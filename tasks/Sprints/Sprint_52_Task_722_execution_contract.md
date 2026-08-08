# Executable task contract — Task 722

## 1. One active execution route

| Field | Value |
|---|---|
| Task | 722 — `fullWidthControlsAtMobile` `checkedAny` guard + dead-arm re-anchor (Sprint 52.1, folds 732) |
| Active route / owner decision | Single route: guard first, re-anchor from a live census, prove all three states. No alternate route is offered |
| Decision source, date, scope | Owner, 2026-08-08 — "зливати за спільною вартістю"; Sprint 52 §10 fixes 52.1 before 52.4 |
| Starting worktree mode | **dirty with manifest** — snapshot `git status --porcelain` before the first write; classify every entry; pre-existing modified paths need before/after content witnesses |
| Exact allowed final write set | `scripts/check-stories-rendered.mjs` · `docs/storybook-governance.md` · `docs/backlog.md` · `docs/sessions/<date>-task722-*.md`. Nothing else |
| Blocked rule or decision, if any | None outstanding. A2 defines one stop condition: if the census proves **all three** arms dead, publish `BLOCKED — ASSERTION HAS NO LIVE ANCHOR` and do not add the guard |

## 2. Checkpoint matrix

| Checkpoint | Preconditions and preserved inputs | Writes allowed through this checkpoint | Observable result | Producer and persisted artifact | Comparator and failure behavior |
|---|---|---|---|---|---|
| 0 | Clean read of `git status --porcelain`, `git log -1` | none | Dirty-worktree manifest, HEAD recorded | Sonnet · `J0-status.txt` | Any path outside the manifest classes → stop |
| 1 | Checkpoint 0 | none | Per-arm live counts across 1184 cells | `screenshots:assert --mantine-only` · `K1-census.log` | An arm with >0 live matches may **not** be re-anchored (D32) |
| 2 | Checkpoint 1 | `check-stories-rendered.mjs` | `checkedAny` guard + re-anchors in place | `git diff` · `K2-gate-diff.txt` | Diff touching `isChipSetMember`, `FULL_WIDTH_TOLERANCE` or `MANTINE_VIEWPORTS` → revert, out of scope |
| 3 | Checkpoint 2 | probe in one existing story | Probe cell resolves `false`; `:1897` line fires | sweep · `K3-probe-after.log` | Probe cell not `false` → the guard or the anchor is wrong; do not proceed |
| 4 | Checkpoint 3 | probe removal only | Pre-probe hash restored, path absent from status | `git hash-object` · `K4-restore.txt` | Hash mismatch **or** path present → `BLOCKED`, never "restored" on assertion |
| 5 | Checkpoint 4 | `storybook-governance.md` | §14.9.28 records the bound, or the predicate widened with its own plant | doc diff · `K5-r9.txt` | Neither chosen → AC9 fails |
| 6 | Checkpoint 5 | none | Final matrix vs `1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS` | sweep · `K6-final-matrix.log` | Any unnamed moved cell → stop and attribute before reporting |
| 7 | Checkpoint 6 | none | Liveness classification recorded | `check:assertion-liveness` · `K7-liveness.log` | Editing the registry to change a classification is forbidden |
| 8 | Checkpoint 7 | `backlog.md`, session log | Gates green; counting gates reconcile | `tsc`/`build`/`check:i18n`/integrity · `K8-*` | Build non-zero → `PARTIALLY IMPLEMENTED` at best |

## 3. Required counterexample trace

| Contract claim | Counterexample | Executed or analytical evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route and final write set | An `src/` fix looks necessary to make a cell green | Checkpoint 6 attribution | separate contract — escalate, do not edit `src/` | |
| Stateful baseline / manifest | Census returns zero live matches on **every** arm | Checkpoint 1 | `BLOCKED — ASSERTION HAS NO LIVE ANCHOR` (A2), fail-closed | |
| Status or diff assertion | A pre-existing modified path changes content while "untouched" | before/after witnesses at 0 and 8 | comparator rejects an equal-porcelain-only claim | |
| New gate | Guard added but no cell ever reports `null` | Checkpoint 3 no-control cell | observed `true` → `null`, then clean recovery | |
| New gate | Re-anchored selector matches nothing | Checkpoint 1 census + Checkpoint 6 | the defect under a new name — unanchor and say so | |
| Task-created artifact | Evidence files counted into the file-integrity denominator | Checkpoint 8, two passes | count difference detected and explained | |

## 4. Publication and review gate

Sonnet publishes `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only when checkpoints 0–8 each have a persisted
artifact. No self-approval. A newly-`false` cell is a **finding to escalate**, never a reason to add a tolerance,
skip or allowlist — that is the failure this sprint was opened to end.
