# Task 747 — Session log (Phase 1 REVISION 5 rework)

**Task path:** `tasks/Sprints/Sprint_61_Task_747_phase1_rework_brief.md` (REVISION 5 contract for this session) ·
`tasks/Sprints/Sprint_61_kickoff_prompt_Task_747_Ledger_State_Projection_Gate.md` (unchanged, still the authority)
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` — `REVISION 5` produced and self-validated against the
rework brief. `REVISION 4` was a rejected brief, never executed (adversarial dossier at
`docs/reviews/artifacts/2026-08-19-task747/revision4-brief-adversarial-reviews.md`); this session executes the
REVISION 5 brief that replaced it. Phase 2 remains blocked: the decision still carries an unfilled owner-approval
slot. Never self-approved.

## 1. Requirement and acceptance-criteria evidence

Rework brief (REVISION 5) §1–§6 mapped to the produced document:

| Brief requirement | Evidence | Result |
|---|---|---|
| §1 deliverable: rewrite decision as REVISION 5, ≤70 lines, answer Q1–Q4; update backlog row; one new session log; no `scripts/`, `scripts/__tests__/`, `package.json`, or workflow write | Decision doc rewritten in place; backlog row 747 updated; this session log created; `git status --porcelain` shows no file outside the permitted write set | Met |
| §1 no self-approval, no Phase 2 write | Document status is `PENDING owner approval`; zero files under `scripts/` touched | Met |
| §2 (Q1) — visible inline `<span data-ledger-claim>` element, whole body compared, no separate `value` attribute, quoting/attribute/one-line/fence rules, reject all 4 preflight alternatives, declare a fifth mechanism | Decision doc Q1 section, marker example, attribute rules paragraph, 4-row rejection table, "fifth option" sentence | Met |
| §3 (Q2/Q4) — v1 fields `openP0`/`openP1`/`openP2`/`decision`; derivation off `findings` at `:927-929`; production-source path rule; `SHALLOW-REPOSITORY` → exists/readable → `--file` per distinct source, `SOURCE-VALIDATION-FAILED` exit 2 without diagnosing which; fail-closed enumeration; **no** `SOURCE-RETIRED`; print drift + exit 2 on mixed bad-input/drift | Decision doc "Q2 and Q4" section, all sub-rules present verbatim | Met |
| §4 (Q3) — scan `docs/backlog.md`, `tasks/Sprints/*.md`, `docs/sessions/**/*.md`; marker-only inspection; never open `docs/backlog-archive.md`; marker-strip-before-close/archive lifecycle; closed/archived docs never re-pinned; Phase 2 evidence must show archive + 2 closed logs unflagged and byte-unchanged | Decision doc Q3 section, both paragraphs | Met |
| §5 — D1 table verbatim; drift message names file/line/claimed/derived text; Phase 2 scope (1 checker, unit tests, 1 `check:` script, ≥1 real marker); AC3/AC4/AC5 definitions; AC5 recipe not "viable" until demonstrated; `--verify-gate` supplements only | Decision doc "Bidirectionality (D1)" section | Met |
| §6 — verification/handoff evidence for this document-only rework | This section (§4 below) and §10 | Met |
| Line caps | Decision doc 64 lines (≤70); `docs/backlog.md` 76 lines (≤80) | Met |

## 2. Current versus required behavior

Current (before this session): the decision document held `REVISION 3`, which two independent adversarial reviews
had already superseded via a rejected `REVISION 4` brief (never executed — the brief itself carried a P0 factual
defect on `SOURCE-RETIRED` population, an unsatisfiable AC3 carve-out, and other design/brief defects catalogued in
the `REVISION 4` adversarial dossier). `docs/backlog.md` row 747 still described the `REVISION 3` state. Required
(this session): rewrite the decision document as `REVISION 5`, executing the REVISION 5 rework brief exactly —
which removes `SOURCE-RETIRED` from v1 entirely, adds the `SHALLOW-REPOSITORY` preflight, binds the marker's
compared value directly into the visible element body, and turns marker lifecycle into a firm rule rather than an
open `D3` recommendation. Negative flows: not applicable — no code, no form, no data access; this is a document-only
rework per the brief's own §1 write-set restriction.

## 3. Files Changed

| Path | Reason |
|---|---|
| `tasks/Sprints/Sprint_61_Task_747_phase1_decision.md` | Rewritten in place as `REVISION 5` per the rework brief §1–§5. |
| `docs/backlog.md` | Row 747 updated to describe `REVISION 5` and the current D1-closed/no-open-D-item state, replacing the `REVISION 3` line. |
| `docs/sessions/2026-08-20-task747-phase1-revision5-rework.md` | New — this session log. |

No file under `scripts/`, `scripts/__tests__/`, `package.json`, or `.github/workflows/` was touched.

## 4. Validation evidence

QA profile: `Q1 Targeted` (kickoff header), non-`Q0`, so the production build gate is mandatory even for a
docs-only change. Exact commands run this session, unpiped, exit code captured into the same transcript file:

```
git status --porcelain                        # before first write (below)
npm run check:mojibake                         # EXIT_CODE=0 — revision5-check-mojibake.log
npm run check:file-integrity                   # EXIT_CODE=0 — revision5-check-file-integrity.log
npm run build                                  # EXIT_CODE=0 — revision5-npm-build.log
(Get-Content tasks/Sprints/Sprint_61_Task_747_phase1_decision.md).Count   # 64 — within ≤70
(Get-Content docs/backlog.md).Count                                       # 76 — within ≤80
git status --porcelain                         # after (below) — unchanged file set vs. start
```

`git status --porcelain` before this session's first write:

```
 M docs/backlog.md
?? .click-shield-ci-fixture.stderr.log
?? .click-shield-ci-fixture.stdout.log
?? docs/reviews/artifacts/2026-08-19-task747/
?? docs/sessions/2026-08-20-task747-ledger-state-projection-phase1.md
?? docs/sessions/2026-08-20-task747-phase1-revision3-rework.md
?? tasks/Sprints/Sprint_61_Task_747_phase1_decision.md
```

`git status --porcelain` after this session's edits and gate runs — identical entry set, plus this session's new
untracked log:

```
 M docs/backlog.md
?? .click-shield-ci-fixture.stderr.log
?? .click-shield-ci-fixture.stdout.log
?? docs/reviews/artifacts/2026-08-19-task747/
?? docs/sessions/2026-08-20-task747-ledger-state-projection-phase1.md
?? docs/sessions/2026-08-20-task747-phase1-revision3-rework.md
?? docs/sessions/2026-08-20-task747-phase1-revision5-rework.md
?? tasks/Sprints/Sprint_61_Task_747_phase1_decision.md
```

`git hash-object` before/after:

| File | Before | After |
|---|---|---|
| `tasks/Sprints/Sprint_61_Task_747_phase1_decision.md` | **Not independently captured this session** — the file was overwritten before a pre-edit `git hash-object` was taken; the file is untracked (no committed blob to recover it from). It is disclosed as a gap, not inferred. The prior (`REVISION 3`) session's recorded post-edit hash, `2b9498db9f65a38d03ceaa404944d223a9c159db`, is the last independently-verified value for this file and is consistent with nothing else having touched it in the interim, but that continuity is not independently re-verified here. | `3e2e1f39d380a88466c0b7823fb5900dda48ae6d` |
| `docs/backlog.md` | `a759dab9a3df7373e827c6b509206a94b6345665` (working tree, pre-edit this session; matches `HEAD:docs/backlog.md` = `f82fe514e644f5be8b2ddaf3ad460bd2e362dd7b` plus the still-uncommitted `REVISION 3` row edit) | `d56cf18c73ba6d8b8519d41f16babff32326519d` |

`npm run test`, `npm run typecheck`, `npm run lint`, and `npm run check:review-ledger` were not re-run this session:
zero `.ts`/`.tsx`/`.mjs`/`.json` files changed, and the rework brief's own §6 verification list for this
document-only rework names only `check:mojibake`, `check:file-integrity`, `build`, the two line-count checks, and
`git status` — all executed above. They remain due, unmodified in expected result, when Phase 2 begins.

No rendered UI evidence required — no visible artifact in scope.

## 5. Visual source trace

Not applicable — no visible UI artifact in scope (docs/governance-decision rework only).

## 6. Canonical UI decision record

Not applicable — no visible UI artifact changed.

## 7. Implementation validation notes

**Line citation re-verified directly against `scripts/check-review-ledger.mjs` this session:** `:927-929`
(`openP0`/`openP1`/`openP2` derived from `findings.filter(finding => finding.priority === '<PN>' && finding.status
=== 'OPEN').length`, inside `validateCoverageSummary`) and `:922` (`primaryRows` — the `PRIMARY_PRIORITIES` filter
— gates only `total`/`verified`/`unverified`, not the `openPN` fields). Both confirmed exact against the file read
this session. No other line citation is carried in `REVISION 5`: unlike `REVISION 3`, this revision does not cite
`:1347`/`:1296-1297`/`:1358`/`:988-989`/`:1028-1044`/`:860-862`/`:955-963`/`:1292`/`:1381`, because the
`SOURCE-RETIRED` mechanism and the `--file`-scope commentary those citations supported are removed from v1 by the
brief itself (§3: "v1 has no `SOURCE-RETIRED` branch"). Removing an unreachable branch removed the citations that
existed only to support it.

**The rework brief's content is prescriptive, not a design brief for this session to re-derive.** The brief's §2–§5
already state the exact marker syntax, field rules, source-validation order, scan scope, lifecycle rule, and D1
table; this session's task was to transcribe that specification into the decision document accurately and within
the line cap, not to re-open any of the design questions the brief itself settled. Verified by side-by-side
comparison of every brief clause in §2–§5 against the corresponding decision-document sentence before finishing
(§1 table above).

**No `D3` or other open recommendation remains in `REVISION 5`.** Unlike `REVISION 3`, which left `D3` (claim
lifecycle) as an open owner recommendation, the rework brief's §4 states the lifecycle rule as a firm requirement
("Immediately before closing a session log or sprint, or migrating a backlog row to the archive, remove every
marker from that carrier; then close or archive it"), so the decision document states it as settled, not proposed.
The only remaining open item is the brief-required overall owner approval of the document (kickoff Appendix A
checkpoint 2), which this document's status line and closing section both state.

## 8. Assumptions, deviations, and limitations

- No independent pre-edit `git hash-object` was captured for the decision document this session (see §4) — the
  file was untracked and was overwritten before a baseline hash was taken. Disclosed as a gap, not inferred or
  fabricated from the prior session's record.
- This session made no changes to `scripts/`, `scripts/__tests__/`, `package.json`, or `.github/workflows/`,
  consistent with the rework brief's §1 binding write-set restriction.
- The `REVISION 4` brief itself was never executed as implementation — it was rejected at the brief-review stage
  (`docs/reviews/artifacts/2026-08-19-task747/revision4-brief-adversarial-reviews.md`) before any executor session
  touched it. This session's "current behavior" baseline is therefore `REVISION 3`, the last document state an
  executor session actually produced.

## 9. Opus handoff

- Read `tasks/Sprints/Sprint_61_Task_747_phase1_decision.md` (`REVISION 5`, 64 lines) in full against the rework
  brief §1–§6 and the requirement table in §1 above.
- Verify independently: the `:927-929`/`:922` citations against `scripts/check-review-ledger.mjs`; that
  `SOURCE-RETIRED` does not appear anywhere in the document; that the D1 table is reproduced verbatim; that the
  marker example's body ("4 P0") is the whole compared value with no separate attribute carrying it.
- Question for the reviewer/owner: does `REVISION 5` fully and accurately execute the rework brief with no
  transcription defect (the same failure class that sank `REVISION 4` at the brief stage)? Is the document ready
  for the owner's quoted approval, or does a further defect remain?
- No risk to the existing tree: zero files under `scripts/` were touched; `git status --porcelain` shows only the
  paths listed in §3 plus the pre-existing CI-fixture logs, the artifacts directory, and the prior session logs.

## 10. Backlog update

`docs/backlog.md` row 747 rewritten to describe `REVISION 5` (D1 closed, no other open D-item, still `BLOCKED` on
overall owner approval) in place of the prior `REVISION 3` line. Baseline line count from
`(Get-Content docs/backlog.md).Count` before this session's edit → **76**; post-edit → **76** (a single-row rewrite,
no line added or removed). Within the 80-line cap. No `BACKLOG LIMIT BREACH`.
