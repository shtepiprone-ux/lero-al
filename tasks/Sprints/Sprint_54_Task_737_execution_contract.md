# Executable task contract — Task 737

## 1. One active execution route

| Field | Value |
|---|---|
| Task | 737 — footer social links permanently under the bottom-nav FAB (Sprint 54, closing task) |
| Active route / owner decision | Single route: **measure the geometry, then fix in existing tokens**. The mechanism is not pre-chosen. `BLOCKED — CANONICAL STYLE DECISION REQUIRED` if no token or evidenced composition fits |
| Decision source, date, scope | Defect found by Task 729's widened gate and confirmed in its orchestrator review 2026-08-09; filed P1 because it blocks activation of Task 727's CI gate |
| Starting worktree mode | **dirty with manifest** — pre-write `git status --porcelain`, per-entry classification, before/after content witnesses |
| Exact allowed final write set | `src/app/[locale]/layout.tsx` and/or `src/components/layout/MobileBottomNavView.module.css` and/or `src/components/layout/FooterView.module.css` — whichever R1's measurement implicates, minimally · `src/app/globals.css` **only** to correct a comment made false by the fix · `docs/backlog.md` · `docs/sessions/<date>-task737-*.md`. Evidence in `.screenshots/task737-evidence/` (gitignored, D6) |
| Blocked rule or decision, if any | R2: no fitting token or evidenced composition → `BLOCKED — CANONICAL STYLE DECISION REQUIRED`, never a guessed raw value. OQ1: if the shell's clearance proves correct and the cause is `FooterView`'s own layout, re-scope with evidence rather than padding the shell |

## 2. Checkpoint matrix

| Checkpoint | Preconditions and preserved inputs | Writes allowed through this checkpoint | Observable result | Producer and persisted artifact | Comparator and failure behavior |
|---|---|---|---|---|---|
| 0 | Clean `git status --porcelain`, `git show HEAD:docs/backlog.md \| wc -l` | none | Dirty manifest + backlog baseline quoted | `J0-status.txt` | Path outside the manifest classes → stop |
| 1 | Checkpoint 0 | none | Pre-fix gate baseline: base scenario = **6** violations, named | `I1-baseline.log` | Not 6 → the defect moved or the harness differs; reconcile before editing |
| 2 | Checkpoint 1 | none | Live geometry: FAB box, social-link boxes, applied clearance — failing cell **and** passing cell | `I2-geometry.json` | Only failing cells measured → the "why not uk/320/390" question stays unanswered, and a fix cannot be justified |
| 3 | Checkpoint 2 | none | Visual source map + canonical UI decision record, dispositions explicit | `I3-ui-records.md` | Missing either → UI rules unmet (R6) |
| 4 | Checkpoint 3 | the implicated file(s) | Fix applied, expressed in existing tokens | `K1-fix-diff.txt` | Any raw length value → reject; `BLOCKED` beats a guess |
| 5 | Checkpoint 4 | same | Base scenario **0** violations; Drawer and Modal unchanged | `K2-clickshield-after.log` | Base not 0 → not fixed; other scenarios moved → collateral |
| 6 | Checkpoint 5 | comments only | No comment still asserts a bar/clearance equality the fix broke | `K3-comment-audit.txt` | A stale coupling comment left → next task inherits a false premise |
| 7 | Checkpoint 6 | none | Rendered proof, Q3 widths × 4 locales incl. `uk@320`; passing cells shown unchanged | `K4-rendered/` | Previously-passing cell moved → unintended visual delta |
| 8 | Checkpoint 7 | none | `check:design-tokens:strict` exit 0; `--mantine-only` vs `1164/1204` | `K5-tokens.log`, `K6-matrix.log` | Any unattributed moved cell → stop and attribute |
| 9 | Checkpoint 8 | docs, backlog, session log | All gates green; counting passes reconcile | `K7-*` | Build non-zero → `PARTIALLY IMPLEMENTED` at best |

## 3. Required counterexample trace

| Contract claim | Counterexample | Executed or analytical evidence | Required outcome | Result |
|---|---|---|---|---|
| Active route and final write set | The quickest green is extra padding on the shell | Checkpoint 2 | must be justified by measurement, not by the gate going quiet | |
| Stateful baseline / manifest | Pre-fix gate reports 0, not 6 | Checkpoint 1 | fail-closed: the comparator is gone; reconcile before any edit | |
| Stateful baseline / manifest | Pre-fix gate reports 6 as recorded | Checkpoint 1 | valid comparator; proceed | |
| Status or diff assertion | A pre-existing modified path changes content while "untouched" | witnesses at 0 and 9 | comparator rejects equal-porcelain-only claims | |
| Fix | Gate goes green but a passing cell's rendering moved | Checkpoint 7 | unintended visual delta — narrow the fix | |
| Fix | The clearance is correct and `FooterView` is the real cause | Checkpoint 2 | OQ1 — re-scope with evidence, do not pad the shell | |
| Landed work | `@layer utilities` dropped from the D28 module | Checkpoint 4 | D34 violation — restore | |
| Task-created artifact | Evidence counted into the integrity denominator | Checkpoint 9, two passes | count difference detected and explained | |

## 4. Publication and review gate

`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` only when checkpoints 0–9 each have a persisted artifact, the base
scenario's **6 → 0** is shown as two transcripts, and the passing cells are shown unchanged rather than assumed.
A green gate with no geometry measurement is not a fix — it is a gate that stopped complaining, which is the
failure this whole sprint was opened to end.
