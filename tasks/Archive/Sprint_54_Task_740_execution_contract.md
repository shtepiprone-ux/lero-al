# Executable task contract — Task 740

## 1. One active execution route

| Field | Value |
|---|---|
| Task | 740 — the clearing box must be the fixed system's whole extent (Sprint 54, closing task) |
| Active route / owner decision | Single route: **census the four survivors, state an inclusion rule, then fix the box**. Orchestrator selection 2026-08-09 from 739's review notes N1/N2 — the residual is one narrow geometry gap, not four defects and not the band-scan dedup |
| Decision source, date, scope | 739 `APPROVED WITH NOTES` 2026-08-09. N2: the landed `union(hit, ancestor)` covers only the one descendant that happened to be `hit`; `.fabLink` (745) blocks all six footer identities but is `hit` in two. N1: 739's own `I2b` records `union → resolvesClean: false` for `it Facebook`, refuting the dedup attribution |
| Starting worktree mode | **dirty with manifest** — pre-write `git status --porcelain`, per-entry classification, before/after content witnesses |
| Exact allowed final write set | `scripts/check-click-shield.mjs` · `docs/backlog.md` · `docs/sessions/2026-08-09-task740-*.md` · `docs/storybook-governance.md` **or** `docs/qa-profiles.md` only to correct a sentence the fix falsifies (quote it). Evidence in `.screenshots/task740-evidence/` (gitignored, D6) |
| Blocked rule or decision, if any | OQ4 / R1: a census that contradicts kickoff §3.2–§3.3 → `BLOCKED` with the measurement. **R3: any identity-keyed condition (class name, component, `data-*`, module hash) is an automatic rejection** — 724 F1. **R12: no application file may enter the write set** |

## 2. Checkpoint matrix

| Checkpoint | Preconditions and preserved inputs | Writes allowed through this checkpoint | Observable result | Producer and persisted artifact | Comparator and failure behavior |
|---|---|---|---|---|---|
| 0 | Manifested `git status --porcelain`, `git show HEAD:docs/backlog.md \| wc -l` | none | Dirty manifest + backlog baseline quoted | `J0-status.txt` | Path outside the manifest classes → stop |
| 1 | Checkpoint 0 | none | **3×** full sweeps → baseline **union** of blocked identities (expect 4: `sq`/`en`/`it` Instagram + `it` Facebook, base × mobile-375) | `I1-baseline-run{1,2,3}.log`, `I1-union.json` | A single run's count is not the comparator (3/4/6/6/6 was observed). No union → no valid D32 comparator |
| 2 | Checkpoint 1 | none | Census per survivor, ≥3 runs: candidate · `hit` · ancestor · **ancestor extent** · offsets under landed vs. proposed box · phase-2 per offset | `I2-census.json` | 745 not shown to be the blocking edge → OQ4, `BLOCKED` |
| 3 | Checkpoint 2 | none | Inclusion rule as prose + predicate; every exclusion justified by hit-test behaviour | `I3-inclusion-rule.md` | An exclusion justified by its effect on the count rather than on hit-testing → reject |
| 4 | Checkpoint 3 | none | Cost measurement: per-candidate extent computation, with and without caching | `I4-cost.md` | Single sweep > 3× 87s → stop and report before iterating |
| 5 | Checkpoint 4 | none | Pre-fix `--verify-gate` 12/12 **plus** R6's over-extension control shown FAILING under a deliberately naive union-everything rule | `I5-verify-pre.log` | The new control passes pre-fix → it does not express the over-extension risk; rebuild it |
| 6 | Checkpoint 5 | `scripts/check-click-shield.mjs` | Fix applied; rule keys on computed style and geometry only | `K1-fix-diff.txt` | Any class/component/`data-*` condition → R3 rejection |
| 7 | Checkpoint 6 | same | `--verify-gate` ≥14 cases green; `/permanent` + both permanent twins still FAIL; R6's control now PASSES | `K2-verify-post.log` | A permanent fixture goes quiet → generosity unbounded. R6's control still fails → the exclusion rule does not work |
| 8 | Checkpoint 7 | same | **3×** post-fix sweeps → identity set diff vs. the Checkpoint 1 union | `K3-sweep-run{1,2,3}.log`, `K4-setdiff.md` | **Any** `cleared → blocked` transition → reject. Post-fix runs disagreeing with each other → report as unstable, do not pick the green one |
| 9 | Checkpoint 8 | same | Every surviving violation carries a genuineness proof; R7 re-measurement of the dedup claim | `K5-genuineness.json` | An unproven survivor reported as a residual rather than a suspected false positive → reject |
| 10 | Checkpoint 9 | comments only | 725's plant loud → restored to hash, clean porcelain; no comment asserts a falsified premise | `K6-plant.log`, `K7-comment-audit.txt` | Plant quiet → the fix disabled the gate |
| 11 | Checkpoint 10 | docs, backlog, session log | `tsc` · `build` · `check:i18n` · `check:design-tokens:strict` exit 0; counting passes reconcile; no product file in the diff | `K8-*` | Any application file present → R12 violation → reject |

## 3. Required counterexample trace

| Contract claim | Counterexample | Executed or analytical evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route and final write set | The quickest green is a `.fabLink` special case | Checkpoint 6 diff | R3 / 724 F1 — automatic rejection; the rule keys on geometry or it is not a rule | |
| Active route and final write set | The quickest green is padding the app | Checkpoint 6 diff | R12 — 737 proved the app correct | |
| Stateful baseline | Baseline union is not 4 | Checkpoint 1 | the comparator moved; reconcile before any edit (**D32**) | |
| The box | Base reaches 0 by unioning everything, including non-hit-testable overflow | Checkpoints 7 and 8 | offsets exceed `maxScrollY` and get discarded → clearable candidates become permanent violations. R6's control + the zero-tolerance set diff must both catch it | |
| The box | A candidate that was `cleared` is now `blocked` | Checkpoint 8 | reject — regardless of what else improved. This is exactly how attempt 1 of 739 shipped a regression | |
| The box | 739's two wins (`sq`/`en` Facebook, `FavoriteButton`) are traded away | Checkpoint 8 | reject — the set diff is against the landed code, so a trade shows up as a transition | |
| Evidence quality | A comparison run decides a design choice on one run | Checkpoint 2 | R9 — ≥3 runs or it is not evidence; 739's `I2b` recorded identical inputs with opposite verdicts | |
| Residual attribution | A survivor is called "the band-scan dedup" without measurement | Checkpoint 9 | R7 — said twice, refuted twice by the task's own data. Measure, then claim | |
| Scenario integrity | A scenario reports `violations=0` because `checked=0` | Checkpoints 1 and 8 | 727 A2 — per-scenario `checked` reported; a silent zero is not a pass | |
| Cost | The extent is recomputed per candidate per band and the sweep triples | Checkpoint 4 | measure, cache, report; > 3× 87s → stop and report | |
| Kickoff premise | The census shows 745 is not the blocking edge | Checkpoint 2 | OQ4 — `BLOCKED` with the measurement | |
| Task-created artifact | Evidence counted into the integrity denominator | Checkpoint 11, two passes | count difference detected and explained | |

## 4. Publication and review gate

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only when checkpoints 0–11 each have a persisted artifact, the
identity set diff shows **zero** `cleared → blocked` transitions, and every surviving violation carries its
genuineness proof.

A base of **0** is the expected outcome and is not, on its own, evidence of anything. This gate has now been
"fixed" twice with a number that looked right: once by a box that broke containment, once by a box that covered
only the descendant it happened to hit. The set diff and the three control fixtures are what distinguish a fix
from a number.
