# Task 747 — Session log (Phase 1 REVISION 3 rework)

**Task path:** `tasks/Sprints/Sprint_61_Task_747_phase1_rework_brief.md` (contract for this session) ·
`tasks/Sprints/Sprint_61_kickoff_prompt_Task_747_Ledger_State_Projection_Gate.md` (unchanged, still the authority)
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` — `REVISION 3` produced and self-validated per the rework
brief. Phase 2 remains blocked: the decision still carries an unfilled owner-approval slot (`D3` open). Never
self-approved.

## 1. Requirement and acceptance-criteria evidence

Rework brief §4 acceptance: R1–R14 addressed · document ≤70 lines · all four enumerated mechanisms carry a
rejection reason and the fifth is declared · D1's truth table verbatim · only D3 left open · `docs/backlog.md`
consistent and ≤80 lines · every line-number citation re-verified against the file before it is written · zero
files under `scripts/`, `scripts/__tests__/`, `package.json`.

| Item | Evidence | Result |
|---|---|---|
| R1 (delegation, not path ban) | Decision doc Q1 "`source` validity is delegated…"; consequences paragraph | Met |
| R2 (exclude fenced/code spans) | Decision doc Q1, marker example kept inside a fence | Met |
| R3 (SOURCE-RETIRED precedence + caveat) | Decision doc Q4; re-verified below, figure corrected from brief's own "2 of 5" to "0 of 5" | Met, with a correction to the brief's own input — see §7 |
| R4 (4 mechanisms + a declared fifth) | Decision doc Q1 table, 4 rows + "adopted mechanism is a fifth option" sentence | Met |
| R5 (D1 verbatim truth table) | Decision doc "Failure names" section, 3+1 row table | Met |
| R6 (session logs back in scope) | Decision doc Q3 "Scan scope" sentence | Met |
| R7 (real, restorable plants) | Decision doc "Phase 2 proof mechanism" — AC4/AC5 on real files, `--verify-gate` in addition | Met (Phase 2 not yet built — this is the design commitment, not the plant itself) |
| R8 (gate not inert) | Decision doc "Phase 2 proof mechanism", appended commitment sentence | Met |
| R9 (honest `ledgerHash` rationale) | Decision doc Q1, CRLF claim removed, honest delegation reason given | Met |
| R10 (assert no-marker negative flow) | Decision doc Q3, "asserted as a rule…Phase 2 must carry its own unit arm" | Met |
| R11 (citation fixes) | Q1/Q2 citations re-verified directly against `scripts/check-review-ledger.mjs` this session (§7) | Met |
| R12 (≤70 lines) | `(Get-Content …).Count` → 68 | Met |
| R13 (D3 recommendation) | Decision doc Q3 "D3 — claim lifecycle, open" paragraph | Met |
| R14 (backlog/document revision consistency) | `docs/backlog.md` row 747 rewritten to say `REVISION 3` | Met |

## 2. Current versus required behavior

Current (before this session): `tasks/Sprints/Sprint_61_Task_747_phase1_decision.md` held `REVISION 2`, rejected by
two independent adversarial reviews for 2 P0 + 9 further defects (rework brief §0–§2). `docs/backlog.md` row 747
still described that rejected state. Required (this session): a `REVISION 3` that corrects every item in rework
brief §2 without reopening settled owner decisions (§1), staying inside the document-only write set (§0, "Still
binding"). Negative flows: not applicable — no code, no form, no data access (kickoff §7, unchanged by this
rework).

## 3. Files Changed

| Path | Reason |
|---|---|
| `tasks/Sprints/Sprint_61_Task_747_phase1_decision.md` | Rewritten in place as `REVISION 3` — corrects R1–R14. |
| `docs/backlog.md` | Row 747 updated to describe `REVISION 3` and its D1-closed/D3-open state, replacing the `REVISION 2 rejected` line. |
| `docs/sessions/2026-08-20-task747-phase1-revision3-rework.md` | New — this session log. |

No file under `scripts/`, `scripts/__tests__/`, or `package.json` was touched.

## 4. Validation evidence

QA profile: `Q1 Targeted` (kickoff header), non-`Q0`, so the production build gate is mandatory even for a
docs-only change.

```
git status --porcelain                       # before first write: 2 known CI-fixture logs + the artifacts dir +
                                               # the prior session's uncommitted session log + decision doc — no
                                               # third untracked entry beyond what the prior session already added
npm run check:mojibake                        # EXIT_CODE=0 — docs/reviews/artifacts/2026-08-19-task747/revision3-check-mojibake.log
npm run check:file-integrity                  # EXIT_CODE=0 — docs/reviews/artifacts/2026-08-19-task747/revision3-check-file-integrity.log
npm run build                                 # EXIT_CODE=0 — docs/reviews/artifacts/2026-08-19-task747/revision3-npm-build.log
wc -l tasks/Sprints/Sprint_61_Task_747_phase1_decision.md   # 68 (PowerShell (Get-Content …).Count) — within ≤70
wc -l docs/backlog.md                         # 76 (PowerShell (Get-Content …).Count) — within ≤80
git status --porcelain                        # unchanged file set vs. start, all 5 paths still the only entries
```

`git hash-object` before/after:

| File | Before | After |
|---|---|---|
| `tasks/Sprints/Sprint_61_Task_747_phase1_decision.md` | **Not captured** — the file was created uncommitted by the prior (`REVISION 2`) session and no `git hash-object` was taken of it before this session began editing; there is no committed blob to recover it from. Reported as a gap, not inferred. | `2b9498db9f65a38d03ceaa404944d223a9c159db` |
| `docs/backlog.md` | `f82fe514e644f5be8b2ddaf3ad460bd2e362dd7b` (`HEAD:docs/backlog.md`) | `a759dab9a3df7373e827c6b509206a94b6345665` |

`npm run test`, `npm run typecheck`, `npm run lint`, and `npm run check:review-ledger` were not re-run this
session: zero `.ts`/`.tsx`/`.mjs`/`.json` files changed, and the rework brief's own §5 verification plan for this
document-only rework does not list them (it lists `check:mojibake`, `check:file-integrity`, `build`, the two
`wc -l` checks, and `git status`, all executed above). They remain due, unmodified in expected result, when Phase
2 begins.

No rendered UI evidence required — no visible artifact in scope.

## 5. Visual source trace

Not applicable — no visible UI artifact in scope (docs/governance-decision rework only).

## 6. Canonical UI decision record

Not applicable — no visible UI artifact changed.

## 7. Implementation validation notes

**Line-number citations re-verified directly against `scripts/check-review-ledger.mjs` this session** (not
carried over from the rework brief unchecked): `:1347` (`--file` routes through
`validateLedger(ledger, label, { checkPaths: true, requireApproval })`), `:1296-1297` (draft/superseded discovery
skipped by `--file`), `:1358` (orphaned-superseded back-reference skipped by `--file`), `:927-929`
(`openP0`/`openP1`/`openP2` derivation), `:922` (`PRIMARY_PRIORITIES` gates only the deferred fields),
`:988-989` (`VALID_DECISIONS` membership), `:1028-1044` and `:860-862` (approval cross-validation on `decision`),
`:955-963` (`validateGateReceipt` status/exitCode cross-check), `:1292`/`:1381` (`--ci`/`--verify-gate` dispatch).
All confirmed exact against the file read this session. `check-assertion-liveness.mjs:93,98` (exit 1 vs exit 2)
also re-read and confirmed.

**A defect in the rework brief's own R3 was found and corrected, not propagated.** R3 stated "2 of the 5
`*.SUPERSEDED.json` files were born superseded (git status `A`) and never had a retained stem." This session
independently checked all 5 files on today's tree with `git log --all --diff-filter=A --name-status` and
`git log --all` (no filter) against each file's un-suffixed stem (e.g.
`docs/reviews/2026-08-14-task741-closedoverlaystyle-module-exit.review-ledger.json`, without the `.SUPERSEDED`
segment): **zero** of the 5 non-suffixed stems have any git history at all — no commit ever added, modified, or
touched a file under that exact un-suffixed name. All 5 `.SUPERSEDED.json` files were authored directly with that
suffix in their first commit. The corrected document reports **0 of 5** (not 2 of 5); this makes the underlying
point *stronger*, not weaker — the SOURCE-RETIRED substitution mechanism cannot retroactively resolve for **any**
of today's five, only for a ledger retired after a live marker pins it. Full command transcript is in this
session's tool history; not separately filed as it is a read-only `git log` check, not a build artifact.

**All prior "do not undo" items (kickoff §3 / rework brief §3) were preserved**: `openPN` derivation, exit 1 vs 2
distinction, `--verify-gate` as a flag on one script, silent pass on unmarked prose, and scope discipline (nothing
outside kickoff §5, 746/750 not folded in).

## 8. Assumptions, deviations, and limitations

- The decision document's own marker example (Q1) is kept inside a fenced code block specifically so it does not
  trip the new "exclude fenced/code spans" rule on this file itself — the document is self-consistent under its
  own format rule (R2's requirement).
- `D3` (claim lifecycle) remains an open owner decision by design (R13) — the document states a recommendation
  ("accept indefinite marker liveness") but does not treat it as settled. Phase 2 cannot start until the owner
  rules on `D3` and fills the approval slot, per kickoff Appendix A checkpoint 2.
- No `git hash-object` "before" value exists for the decision document (see §4) because it was never committed in
  its `REVISION 2` form. This is disclosed as a gap rather than papered over.
- This session made no changes to `scripts/`, `scripts/__tests__/`, or `package.json`, consistent with the rework
  brief's binding constraint (§0).

## 9. Opus handoff

- Read `tasks/Sprints/Sprint_61_Task_747_phase1_decision.md` (`REVISION 3`, 68 lines) in full against the rework
  brief's R1–R14 and §4 acceptance criteria.
- Verify independently: the `:1347`/`:1296-1297`/`:1358`/`:927-929`/`:922`/`:988-989`/`:1028-1044`/`:860-862`/
  `:955-963`/`:1292`/`:1381` citations against `scripts/check-review-ledger.mjs`, and the corrected "0 of 5"
  SUPERSEDED-stem claim against `git log --all` on each non-suffixed path (§7 above).
- Decide whether the R3 correction (this session's "0 of 5", replacing the brief's "2 of 5") is itself accurate,
  since it revises input the brief presented as already-verified — this is exactly the kind of claim clause 9a
  requires an adversarial re-check on, not a carry-forward.
- Question for the reviewer/owner: does `REVISION 3` satisfy the rework brief's R1–R14, and is the `D3`
  recommendation (accept indefinite marker liveness) acceptable, or does the owner want option (b) or (c) instead?
- No risk to the existing tree: zero files under `scripts/` were touched; `git status --porcelain` shows only the
  5 paths listed in §3 plus the 2 pre-existing CI-fixture logs and the artifacts directory.

## 10. Backlog update

`docs/backlog.md` row 747 rewritten to describe `REVISION 3` (D1 closed, D3 open, still `BLOCKED`) in place of the
prior `REVISION 2 rejected` line. Baseline line count from `git show HEAD:docs/backlog.md` (via PowerShell array
`.Count`, not `Measure-Object -Line`, which undercounts) → **76**; post-edit `(Get-Content docs/backlog.md).Count`
→ **76**. Within the 80-line cap. No `BACKLOG LIMIT BREACH`.
