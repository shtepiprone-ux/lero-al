# Executable task contract — Task 727

## 1. One active execution route

| Field | Value |
|---|---|
| Task | 727 — contextual N6 + real overlay scenarios + blocking CI job (Sprint 52, final task) |
| Active route / owner decision | **OQ2 and OQ3 closed by the owner, 2026-08-09**, quoted verbatim in kickoff §3.1. Local production build, blocking, no `continue-on-error`; overlays are NOT exempt, the exemption becomes contextual on the candidate |
| Decision source, date, scope | Owner, 2026-08-09, answering the two questions Task 723 §10 left open; Sprint 52 is held open by this task alone |
| Starting worktree mode | **dirty with manifest** — pre-write `git status --porcelain`, per-entry classification, before/after content witnesses |
| Exact allowed final write set | `scripts/check-click-shield.mjs` · `.github/workflows/governance-pr.yml` · `package.json` (only if a scenario needs its own script entry) · `docs/storybook-governance.md` · `docs/backlog.md` · `docs/sessions/<date>-task727-*.md`. Evidence in `.screenshots/task727-evidence/` (gitignored, D6) |
| Blocked rule or decision, if any | None. A question the quoted decision does not cover → `BLOCKED — OWNER DECISION REQUIRED`, never a choice made inside the task |

## 2. Checkpoint matrix

| Checkpoint | Preconditions and preserved inputs | Writes allowed through this checkpoint | Observable result | Producer and persisted artifact | Comparator and failure behavior |
|---|---|---|---|---|---|
| 0 | Clean `git status --porcelain`, `git show HEAD:docs/backlog.md \| wc -l` | none | Dirty manifest + backlog baseline quoted | `J0-status.txt` | Path outside the manifest classes → stop |
| 1 | Checkpoint 0 | none | Pre-change base sweep against a local production build, 16 cells | `I1-baseline.log` | Cannot reach `127.0.0.1:3000` → fix the harness before any code edit |
| 2 | Checkpoint 1 | gate script | Contextual predicate implemented **once**, used at `:223` and `:276` | `K1-rule-diff.txt` | Either site retaining the unconditional form → incomplete, stop |
| 3 | Checkpoint 2 | gate script | Base scenario verdicts **unchanged** vs Checkpoint 1 | `K2-base-rerun.log` | Base turned red → the rule over-fires; that is the "switched off within a week" outcome |
| 4 | Checkpoint 3 | gate script | Modal and Drawer scenarios run 16 cells each, **with the dialog proven present in the DOM at hit-test time** | `K3-modal.log`, `K4-drawer.log` | No dialog in the DOM record → the scenario never opened; zero violations means nothing (A2) |
| 5 | Checkpoint 4 | plant | Candidate inside the dialog, overlay-intercepted → **violation**, gate exits non-zero, names it | `K5-plant-fail.log` | Gate stays green → the contextual rule is not reached |
| 6 | Checkpoint 5 | plant removal only | Prior verdict restored; hash and porcelain evidence | `K6-restore.txt` | Mismatch → `BLOCKED`, never "restored" on assertion |
| 7 | Checkpoint 6 | gate script | Background-page element under the backdrop still **cleared** | `K7-must-still-clear.log` | Now a violation → R4 broken; both directions must hold |
| 8 | Checkpoint 7 | workflow | Blocking job, owner's exact sequence, `BASE_URL=http://127.0.0.1:3000`, no `continue-on-error`, `if: always()` artifact | `K8-workflow-diff.txt` | Any bypass present → rejected |
| 9 | Checkpoint 8 | docs, backlog, session log | `:verify` passes; all gates green; counting passes reconcile | `K9-*` | Real defect found → named, attributed, reserved; **not** fixed |

## 3. Required counterexample trace

| Contract claim | Counterexample | Executed or analytical evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route and final write set | A product control genuinely fails the new check | Checkpoint 9 | separate contract — reserve a number, do not edit `src/` | |
| Stateful baseline / manifest | A scenario reports 0 violations because the overlay never opened | Checkpoint 4 | fail-closed: absent dialog in the DOM record invalidates the run | |
| Stateful baseline / manifest | A scenario reports 0 violations with the dialog proven open | Checkpoint 4 | valid clean result | |
| Status or diff assertion | A pre-existing modified path changes content while "untouched" | witnesses at 0 and 9 | comparator rejects equal-porcelain-only claims | |
| New gate | The rule fires on every open modal | Checkpoint 7 | R4 — the exemption must still clear background candidates | |
| New gate | Only one call site fixed | Checkpoint 2 | the defect stays reachable via the other path | |
| New gate | Job added but non-blocking | Checkpoint 8 | contradicts the quoted decision — reject | |
| Task-created artifact | Evidence counted into the integrity denominator | Checkpoint 9, two passes | count difference detected and explained | |

## 4. Publication and review gate

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only when checkpoints 0–9 each have a persisted artifact, **both**
directions are proven (inside-dialog fails, background still clears), and every scenario carries DOM proof the
overlay was open. A green run whose scenarios cannot be shown to have reached the overlay state is not evidence —
it is the exact shape of the defect this task exists to remove.
