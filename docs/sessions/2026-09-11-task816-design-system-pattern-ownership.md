# Task 816 — The design system is governed three different ways, and nobody chose that

Sprint 75 · P1 · QA profile Q2. Executor: Sonnet.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## 1. §13.1 baseline (captured before writing any code)

`docs/sessions/evidence/task816/R0_baseline-13.1.txt` — `win32`, node `v22.22.3`, clean tree; `check:rendered-scope`
exit 0 (29 baselined/0 new/0 stale); `check:rendered-scope:report` exit 0 with its `allowlisted` block; `check:story-coverage`
exit 0 (38 covered/0 unproven); `check:surface-census:changed:verify` exit 0 (8/8 arms); live pattern-file count = 33.

## 2. Requirement and acceptance-criteria evidence

| Req | AC | Evidence | Result |
|---|---|---|---|
| R1 (re-measure the census from source) | AC1, AC2 | `scripts/audit-design-system-patterns.mjs` — 33 files derived from the directory (`Get-ChildItem` count also 33, AC2); totals 5 enrolled / 11 tier-3 / 17 ungoverned / 0 in-both, reconciled against the kickoff's §2 table — **no difference**. Full census in `docs/design-system-pattern-ownership.md` §2. | Confirmed |
| R2 (verify the allowlist's premise per path) | AC3 | `docs/design-system-pattern-ownership.md` §3 — all 11 rows quoted with consumer count, shared verdict, own-Story verdict and the exact story file(s). **3 of 11 fail "shared"** (`MantineCopyIdButton`, `MantineListingCardPattern`, `MantineListingDetailPattern` — each exactly 1 production consumer), named explicitly, cross-checked against a direct `git grep` showing every other textual hit is a code comment. All 11 pass the Story half. | Confirmed |
| R3 (runnable re-measure command, audit not gate) | AC4, AC5 | `npm run audit:design-system-patterns` on the clean tree: **exits 1**, not 0 — see §3 below, this contradicts the kickoff's own AC4 assumption and is reported as a finding, not forced green. `AC5_no-own-story_probe.txt` — a scratch pattern file + temporary allowlist entry (no story) → audit fails naming it `[no-own-story]`; restored, `git hash-object` identical (after correcting a real mojibake incident — see §3). Not wired into any CI workflow (§5's stated assumption). | Confirmed, with the AC4 discrepancy reported |
| R4 (six inherited notes closed/recorded) | AC6, AC7 | `docs/design-system-pattern-ownership.md` §5 — table with each note's exact disposition. Two fixed with a diff (817's superseded-transcript line; 819's skip-set dedup), two recorded with the reason they stand (817's `ui-imports` filter, 817's duplicate-blocked-line), two already closed by prior tasks or this one's own gate-block shape (818 ×2). | Confirmed |
| R5 (sprint's transferable paragraph, folded in) | AC8 | `docs/orchestrator-procedures.md` → "Recurring orchestrator failure modes" — new corollary naming all four landed Sprint 75 commands. | Confirmed |
| R6 (STOP — owner decision, measured inputs only) | AC9 | `docs/design-system-pattern-ownership.md` §4 — three bounded options with the measured cost of each (now including the 8-vs-11 correction from §3); decision recorded as unresolved with today's date. `git diff --stat` empty for both `scripts/mantine-migration-scope.json` and `scripts/rendered-scope-allowlist.json`. | Confirmed |
| R7 (six existing gate files untouched, except 819's dedup) | AC10 | `G15_hashes-and-AC10.txt` — `check:rendered-scope`, `:verify`, `check:story-coverage`, `check:surface-census:changed`, `:verify` all reproduce §13.1 exactly; `git diff --stat` empty for all six named files. | Confirmed |

GR-4 AC audit: 10 criteria, each an observable property (counts, hashes, exit codes, quoted text, diff scope); no
absolute assertion — AC6's/AC10's "byte-identical"/"empty diff" are scoped to named files this task deliberately
does not otherwise touch, captured as measured before/after pairs.

## 3. A conflict between the kickoff's AC4 and the measured tree — reported, not resolved by weakening the tool

AC4 assumed `npm run audit:design-system-patterns` would exit **0** on the clean tree. It does not: it exits **1**,
because 3 of the 11 allowlisted patterns genuinely have exactly 1 production consumer each when measured with the
correct tool (a whole-`src` AST render-graph walk, not a grep — verified by hand that every other textual match for
these three pattern names is a code comment, never an import). This is the "kickoff's own measured facts are not
exempt" failure mode, applied to this kickoff's own AC4. Per that same rule and per §10.3's own instruction ("the
audit command fails on a broken premise, not on debt"), the correct response is to report the real measured result,
not to loosen the "shared" definition or otherwise force a green exit. Full detail, including the corrected
8-vs-11 split for §4's owner-decision cost estimates, is in `docs/design-system-pattern-ownership.md` §3-§4.

## 4. Current versus required behavior

**Before.** 33 patterns governed three ways with no re-measure command; decision 1's "must re-measure" was a promise,
not a mechanism; the allowlist's own premise had never been checked for all 11.

**After.** One command (`npm run audit:design-system-patterns`) prints the full census and fails on a broken
allowlist premise, naming the path and the failing half. One document (`docs/design-system-pattern-ownership.md`)
records the split, the per-path verdict (including the 3 that fail), the trigger, and the owner's open decision. Six
inherited notes are closed or recorded with a reason. The sprint's transferable narrowing-disclosure rule is written
into durable procedure with all four of this sprint's landed commands as its evidence.

Negative flows (§11's table) all exercised: a listed path with 1 consumer (real, ×3) and one with no Story (planted,
AC5); a pattern in both manifest and allowlist (0 real cases, logic present and unit-verified by inspection); a
new/ungoverned pattern (reported in the census, not a failure — matches §10.3); the allowlist's own missing-reason/
owner and stale-entry checks (unchanged, not this task's mechanism, `check:rendered-scope` still enforces them).

## 5. Files Changed

| Path | Reason |
|---|---|
| `scripts/audit-design-system-patterns.mjs` (new) | The re-measure command: whole-`src` census, per-allowlisted-path premise verdict, `--json` mode. |
| `docs/design-system-pattern-ownership.md` (new) | The census, the 11 premise verdicts, the six-note disposition table, the owner-decision record. |
| `scripts/map-changed-surfaces.mjs` | R4/AC7 — `SKIP_DIRS` is now `= CANDIDATE_SKIP_DIR_SEGMENTS` (same `Set` object), not a second literal. |
| `package.json` | One new script entry: `audit:design-system-patterns`. |
| `docs/orchestrator-procedures.md` | R4/R5/AC8 — one new corollary (`Get-Content -Raw` hazard + mitigation, hash-in-gate-block rule, sprint's four-command transferable paragraph). Nothing else in the file changed (6 insertions, 0 deletions, confirmed via `git diff --stat`). |
| `docs/sessions/evidence/task817/R1_AC16-favoritesshell-report.txt` | R4/AC6 — one line marking it superseded; every other line byte-identical (1 insertion). |
| `docs/backlog.md` | Task 816 status line updated. Still 80 lines. |
| `docs/sessions/evidence/task816/*` (new) | All command transcripts and probe witnesses. |

## 6. Validation evidence

§13.2 final gate block, all native `win32` PowerShell, `node v22.22.3` — platform/version/pwd/command/exit code
recorded inside every transcript:

| Command | Exit | Transcript |
|---|---|---|
| `node --check scripts/audit-design-system-patterns.mjs` | 0 | `G01_check-audit.txt` |
| `node --check scripts/map-changed-surfaces.mjs` | 0 | `G02_check-mapper.txt` |
| `npm run typecheck` | 0 | `G03_typecheck.txt` |
| `npx eslint` (both changed scripts) | 0 | `G04_eslint.txt` |
| `npm run audit:design-system-patterns` | **1** (3 real premise failures, see §3) | `G05_audit.txt` |
| `npm run check:rendered-scope` (unchanged) | 0 | `G06_check-rendered-scope.txt` |
| `npm run check:rendered-scope:verify` | 0 | `G07_check-rendered-scope-verify.txt` |
| `npm run check:surface-census:changed -- --base f46c487d5 --head HEAD` (unchanged) | 0 | `G08_check-surface-census-changed.txt` |
| `npm run check:surface-census:changed:verify` | 0 (8/8 arms) | `G09_check-surface-census-changed-verify.txt` |
| `npm run check:story-coverage` (unchanged) | 0 | `G10_check-story-coverage.txt` |
| `npm run check:stories` | 0 | `G11_check-stories.txt` |
| `npm run build` | 0 | `G12_build.txt` |
| `npm run check:file-integrity` | 0 | `G13_check-file-integrity.txt`, re-confirmed clean on the full tree afterward |
| `npm run check:mojibake` | 0 | `G14_check-mojibake.txt`, re-confirmed clean on the full tree afterward |

`git hash-object` of every changed file, plus the AC10 re-verification, both in `G15_hashes-and-AC10.txt`.

## 7. Visual source trace / Canonical UI decision record

Not applicable — this task changes `scripts/`, `package.json`, and `.md` files only. No rendered UI, no visible
component, no Storybook artifact is touched or migrated.

## 8. Implementation validation notes

- The audit's measurement is a **superset** of `check:rendered-scope:report`'s enrolled-only view (whole-`src` render
  graph vs. enrolled-roots-only); the `(enrolled-only:N)` column reconstructs the narrower view for direct
  comparison, and the two reconcile exactly against Task 812's own measured 23-edge table for the 11 allowlisted
  paths (sum of `enrolled-only` across the 11 = 23).
- A real, second occurrence of the `Get-Content -Raw` mojibake hazard (documented in `docs/orchestrator-procedures.md`
  as of this task) happened live during AC5's own probe, on `scripts/rendered-scope-allowlist.json` — caught by the
  `git hash-object` witness, corrected with the same Node-based reversal technique, and used as the corollary's
  second worked example. See `AC5_no-own-story_probe.txt`.

## 9. Assumptions, deviations, limitations

- **`ASSUMPTION` (stated, per kickoff §5) — the audit command is not wired into CI.** Decision 1 asks Task 816 to
  own and re-measure, not to block; a blocking gate is a separate Q4 task.
- **Deviation, §3** — AC4's "exits 0 on the clean tree" does not hold; the real measured result (exit 1, 3 named
  failures) is reported instead of forced.
- The `ui-imports` and duplicate-blocked-line notes (§5 of the ownership doc) are recorded, not fixed — both
  because they describe intentional/documented behaviour or fall outside this task's narrow authorization to edit
  `check-surface-census.mjs`, not because they were skipped.
- No limitation found in R1/R2/R3/R4/R5/R6/R7's actual implementation beyond what §3 already states as a measured
  finding rather than a defect.

## 10. Opus handoff

- Evidence root: `docs/sessions/evidence/task816/`.
- **Please make the §4 governance-model decision** — it is the one open item this task cannot close itself, and
  §3's finding (3 of 11 allowlisted patterns fail "shared") changes option (a)'s cost from "enrol 11" to "enrol
  8, decide the other 3 separately."
- Verify independently: the whole-`src` render-graph consumer counts for the 3 failing patterns — re-run
  `npm run audit:design-system-patterns --json` and cross-check `MantineCopyIdButton`/`MantineListingCardPattern`/
  `MantineListingDetailPattern`'s consumer lists against a fresh `git grep`.
- Verify the `ui-imports`/duplicate-blocked-line dispositions in §5 of the ownership doc — confirm "recorded, not
  fixed" is the correct call for both, or file a follow-up task if either should be fixed.

## 11. Backlog update

`docs/backlog.md` Sprint 75 row and task-registry row 55 updated in place — Task 816 status changed to
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with a pointer to this session log and the AC4 finding. File line
count: **80** (at the stated budget, not a breach — no BACKLOG LIMIT BREACH).
