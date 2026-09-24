# Executable task contract — Task 739

## 1. One active execution route

| Field | Value |
|---|---|
| Task | 739 — `check-click-shield` computes its clearing offset from the wrong box (Sprint 54, closing task) |
| Active route / owner decision | Single route: **census the real geometry, then fix the gate**. The mechanism is deliberately not pre-chosen — R3's contract C1–C5 defines the target, the executor selects the implementation from measurement |
| Decision source, date, scope | Orchestrator selection 2026-08-09 from the three options in Task 737's session log §7. Option 2 (scope a CI exemption) rejected — an author-appliable exemption to silence a gate is the Task 724 F1 pattern this sprint removed. Option 3 (restyle `.fabLink`) rejected — changing production design to satisfy a buggy gate is backwards |
| Starting worktree mode | **dirty with manifest** — pre-write `git status --porcelain`, per-entry classification, before/after content witnesses |
| Exact allowed final write set | `scripts/check-click-shield.mjs` · `docs/backlog.md` · `docs/sessions/2026-08-09-task739-*.md` · `docs/storybook-governance.md` **or** `docs/qa-profiles.md` only to correct a sentence the fix falsifies (quote it). Evidence in `.screenshots/task739-evidence/` (gitignored, D6) |
| Blocked rule or decision, if any | OQ4 / R1: if the census contradicts kickoff §3.4, report `BLOCKED` with the measurement rather than proceeding on the kickoff's premise. R6: **no application file may enter the write set** — 737 proved the app is correct |

## 2. Checkpoint matrix

| Checkpoint | Preconditions and preserved inputs | Writes allowed through this checkpoint | Observable result | Producer and persisted artifact | Comparator and failure behavior |
|---|---|---|---|---|---|
| 0 | Clean or manifested `git status --porcelain`, `git show HEAD:docs/backlog.md \| wc -l` | none | Dirty manifest + backlog baseline quoted | `J0-status.txt` | Path outside the manifest classes → stop |
| 1 | Checkpoint 0 | none | Pre-fix sweep: base scenario **6** violations, `checked=1772`, `excluded=40`, `cleared=45` | `I1-baseline.log` | Not 6 → the comparator moved; reconcile before any edit (**D32**) |
| 2 | Checkpoint 1 | none | Per-violation census: candidate rect · `hit` rect · ancestor rect · generated offsets · phase-2 result | `I2-census.json` | Undershoot not reproduced numerically → OQ4, `BLOCKED` |
| 3 | Checkpoint 2 | none | Blast radius across all 48 cells: `hit !== ancestor`, and of those, `hit` extending beyond the ancestor | `I3-blast-radius.md` | Large count → state the changed risk profile **before** editing, not after |
| 4 | Checkpoint 3 | none | Pre-fix `--verify-gate` 8/8, **plus** the new overhang fixture shown FAILING | `I4-verify-pre.log` | New fixture passes pre-fix → it does not express the defect; rebuild it |
| 5 | Checkpoint 4 | `scripts/check-click-shield.mjs` | Fix applied; C1–C5 each addressed by name | `K1-fix-diff.txt` | A candidate promoted on geometry alone → C3 violation → reject |
| 6 | Checkpoint 5 | same | `--verify-gate` green on every case; `/permanent` and the new permanent twin both still FAIL | `K2-verify-post.log` | Any permanent fixture goes quiet → C5 violation → the fix bought silence |
| 7 | Checkpoint 6 | same | Post-fix 48-cell sweep: base **0**; `checked`/`excluded` unmoved; `cleared` delta named per element | `K3-sweep-after.log` | `checked` moved → coverage changed unintentionally; reconcile |
| 8 | Checkpoint 7 | same | Task 725's plant → violations > 0 against the **new 0 baseline** → restore → `d2c6588aec…`, clean porcelain | `K4-plant.log` | Plant quiet → the fix disabled the gate; stop |
| 9 | Checkpoint 8 | comments only | No comment still asserts the ancestor's box is the occluding box | `K5-comment-audit.txt` | Stale comment left → the next task inherits this exact false premise |
| 10 | Checkpoint 9 | docs, backlog, session log | `tsc` · `build` · `check:i18n` · `check:design-tokens:strict` exit 0; counting passes reconcile; no product file in the diff | `K6-*` | Any product file present → R6 violation → reject |

## 3. Required counterexample trace

| Contract claim | Counterexample | Executed or analytical evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route and final write set | The quickest green is padding `FooterView` | Checkpoint 5 diff | R6 — 737 refuted that; any product file is a rejection | |
| Active route and final write set | The quickest green is a CI exemption for these 6 | Checkpoint 5 diff | rejected at design time (724 F1); an exemption an author hand-applies is not one the gate owns | |
| Stateful baseline | Pre-fix sweep reports 0, not 6 | Checkpoint 1 | fail-closed: comparator gone, reconcile before editing (**D32**) | |
| Stateful baseline | Pre-fix sweep reports 6 as recorded | Checkpoint 1 | valid comparator; proceed | |
| The fix | `6 → 0` achieved by a more generous generator that also clears genuine occlusion | Checkpoints 6 and 8 | `/permanent` + twin + 725's plant must all still fail; if any goes quiet, the fix is a regression | |
| The fix | A candidate is reported `cleared` without a real scroll re-hit-test | Checkpoint 5 | C3 violation — phase 2 is the sole arbiter | |
| The fix | The two hit-test paths diverge | Checkpoint 5 | C4 — 727's single-source predicate standard; agreement by construction | |
| Coverage | `checked` or `excluded` moves off `1772` / `40` | Checkpoint 7 | this task changes classification, not coverage; explain or revert | |
| Scenario integrity | A scenario reports `violations=0` because `checked=0` | Checkpoints 1 and 7 | 727 A2 — per-scenario `checked` reported for all three; a silent zero is not a pass | |
| Self-test | A new fixture passes both before and after the fix | Checkpoint 4 | it does not express the defect; it proves nothing and does not count toward R4 | |
| Kickoff premise | The census shows the cause is not the overhang | Checkpoint 2 | OQ4 — `BLOCKED` with the measurement; this is a success for the process | |
| Task-created artifact | Evidence counted into the integrity denominator | Checkpoint 10, two passes | count difference detected and explained | |

## 4. Publication and review gate

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only when checkpoints 0–10 each have a persisted artifact **and**
kickoff §5 A2's four proofs are presented together, not separately: `6 → 0`, `--verify-gate` green with every
permanent fixture still failing, 725's plant still loud against the new baseline, and `checked`/`excluded`
unmoved.

`6 → 0` on its own is not evidence of a fix. It is equally the signature of a gate that stopped complaining —
the failure this sprint has now located four times, each one layer further inside the tooling than the last.
