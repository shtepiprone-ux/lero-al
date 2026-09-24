# Task 747 — Make a live state claim machine-checkable against the ledger that owns it

**Sprint:** 61 — The projection layer no gate reads (`tasks/Sprints/Sprint_61_The_Projection_Layer_No_Gate_Reads.md`)
**Type:** governance control (new checker + its format) · **QA profile:** `Q1 Targeted` + a mandatory
planted-violation proof (the profile does not require one; `docs/backlog.md`'s standing rule for any new gate does)
**Preflight:** `Sprint_61_Task_747_evidence_preflight.md` — read §2 and §4 before writing anything.
**Priority:** P1. **Status:** KICKOFF FILED.

---

## 1. Objective

`review.coverage` in a v4 review ledger is recomputed by the validator and **cannot lie**. The same facts are then
restated in prose across `docs/backlog.md`, `tasks/Sprints/Sprint_NN_*.md` and session logs, where **no gate reads
them**. Close that one gap: make a *live* state claim in markdown checkable against the ledger that owns it.

You are not building a source of truth. It exists — `scripts/check-review-ledger.mjs:917-936`. You are building a
**projection check**, and first, the format that makes a projection checkable at all.

## 2. Verified context

**The source of truth, read in full (preflight §2).** `validateCoverageSummary` recomputes
`total / verified / unverified / openP0 / openP1 / openP2` from the ledger's own rows and rejects any declared
value that differs. **Note the restriction:** `total`/`verified`/`unverified` count only rows whose priority is in
`PRIMARY_PRIORITIES`. A projection that counts all rows will disagree with the ledger for a reason that has
nothing to do with drift — mirror the same filter or your control produces false positives on day one.

**Instance ⓐ — `VERIFIED`, fixture on disk.**
`docs/reviews/2026-08-12-task691-mantinelistingcardpattern-detailwind.review-ledger.SUPERSEDED.json` carries
`{"total":12,"verified":3,"unverified":9,"openP0":4,"openP1":2,"openP2":1}`. Three markdown sites — the backlog
registry row, the backlog Last Session line, and the Sprint 46 Tasks row — said **`2 P0`**. `check:review-ledger`
was green the whole time, because the ledger was right and nothing compared the two. The owner caught it by
reading both. **That reading is the control this task replaces.**

**Instance ⓑ — `ASSUMED`, you must open it.** Task 691's session log §13 asserted a backlog edit
(`landed count moved to 5 of 9`) that the diff never contained; recorded as finding `F-M`. Open the session log
and the commit diff before using it as a fixture. If it does not reproduce, say so and drop it — do not repeat it
from this kickoff.

**No generated-region convention exists to reuse:** `grep -rn "BEGIN GENERATED|DO NOT EDIT|<!-- generated"` over
`docs/*.md` and `scripts/*.mjs` returns zero hits (preflight §5).

## 3. Phase 1 — the design decision. Ends at an owner approval. No checker code before it.

The reserved text is explicit: *"Define the machine source-of-truth and a stable assertion format before writing
any checker."* Produce a short written decision — one page, saved with this task — that answers:

**Q1. How is a claim marked as live and machine-checkable, as opposed to prose?** Compare at minimum the four
mechanisms enumerated in preflight §4: a fenced block with a declared source · YAML front-matter · a generated
region · a registry JSON on the `scripts/assertion-liveness-registry.json` model. State why each rejected option
was rejected. Mechanism 4 is the only one with a bidirectional in-tree precedent — that is an input, not a verdict.

**Q2. Which claim fields are in scope for v1?** Recommend the smallest useful set. `decision`, `handoff.commitPush`
and the six `coverage` integers are the candidates; a v1 that only covers `openP0/openP1/openP2` and `decision`
would already have caught instance ⓐ.

**Q3. How does the control tell a LIVE claim from HISTORY?** This is the hard question and the reason a grep
fails. `docs/backlog-archive.md`, superseded ledgers, retracted claims and narrative prose all contain counts that
must never be rewritten or flagged. Name the rule, and name what happens to a document that carries **no** marked
claim — silent pass, or flagged as unprojected? Both are defensible; choose and justify.

**Q4. What is the failure mode when the ledger is absent, unreadable, or itself invalid?** Fail closed. Say how.

**Stop here and publish the decision for owner approval.** Do not begin Phase 2 until it is approved.

## 4. Phase 2 — the control

Build only what Phase 1 chose. Constraints that bind regardless of the choice:

- **Bidirectional.** It must fail when the markdown drifts from the ledger **and** when the ledger moves while the
  markdown stands still. The `assertion-liveness` precedent gets this right with two distinct failure names
  (`STALE-ENTRY`, `ORPHAN-ENTRY`); yours needs the equivalent.
- **Never edits documents.** It reports; it does not rewrite. A control that auto-fixes prose hides the drift it
  exists to surface.
- **Never touches history.** `docs/backlog-archive.md`, `*.SUPERSEDED.json` and closed session logs are read-only
  fixtures. If your rule requires editing a historical file to go green, the rule is wrong.
- **No `N P0` pattern-matching.** Explicit non-goal.
- One new `check:` script in `package.json`. **Do not wire it into
  `.github/workflows/governance-pr.yml`** — making it blocking is a separate owner decision.

## 5. Scope

**In scope:** the new checker + its format artefact under `scripts/`, its unit tests under `scripts/__tests__/`,
one `package.json` script, the Phase 1 decision document, `docs/backlog.md` (index-sized), a session log.

**Out of scope, zero diff:** `docs/backlog-archive.md` · every `*.SUPERSEDED.json` · every closed session log ·
`scripts/check-review-ledger.mjs` (it is the source of truth; this task reads it, never changes it) ·
`.github/workflows/governance-pr.yml` · Task **746** (the reserved text forbids folding it in) · Task **750**.

## 6. Acceptance criteria

- **AC1 [Q1-Q4]** The Phase 1 decision document exists, answers all four questions, names every rejected
  alternative with its reason, and carries the owner's approval before any file under `scripts/` is created.
- **AC2** Running the control on the tree as it stands today exits **0** — it must not open with a backlog of
  pre-existing violations it cannot distinguish from real drift.
- **AC3** *(instance ⓐ, the acceptance fixture)* A reconstruction of the 691 state — the superseded ledger's
  `openP0: 4` against a markdown claim of `2` — is **rejected** by the control, with the offending file, the
  claimed value and the ledger-derived value all named in the message.
- **AC4** *(plant, forward arm)* Change **only** a live markdown claim, leave its ledger byte-identical: the
  control fails. Restore: it passes. Record both runs and the `git hash-object` of the touched file.
- **AC5** *(plant, reverse arm)* Change **only** the ledger, leave the markdown untouched: the control fails with
  a *distinct* failure name from AC4's. Restore: it passes.
- **AC6** *(no-false-positive arm)* With the control in place, `docs/backlog-archive.md` and at least two closed
  session logs containing counts are **not** flagged, and are byte-unchanged (`git status --porcelain` clean for
  them).
- **AC7** `npm run test` exits 0 with the new unit arms present; `npm run typecheck`, `npm run lint`,
  `npm run check:review-ledger` and `npm run build` all exit 0. Transcripts retained under
  `docs/reviews/artifacts/2026-08-19-task747/` — **that path is tracked; `.screenshots/` is gitignored
  (`.gitignore:55`) and must not be used for retained evidence.**
- **AC8** `docs/backlog.md` stays within its **80-line** cap and is updated with concise current state.

## 7. Negative-flow applicability

| Branch | Applicable? | Expected behavior |
|---|---:|---|
| Validation / Authorization / RLS / Offline / Concurrent writer | **No** | no form, no data access, no network, no writes to product data |
| **Missing or unreadable ledger** | **Yes** | fail closed, named error — AC1/Q4 |
| **Ledger present but invalid** | **Yes** | fail closed; do not fall back to trusting the markdown |
| **Document with no marked claim** | **Yes** | behaviour fixed by the Q3 decision, and asserted either way |
| **Historical file containing counts** | **Yes** | never flagged, never edited — AC6 |

## 8. Verification plan

```
git status --porcelain                      # before first write
#   … Phase 1 decision → owner approval …
#   … Phase 2 build …
node scripts/<new-checker>.mjs              # AC2: exits 0 on today's tree
#   … AC3 fixture, AC4 forward plant, AC5 reverse plant, each restored with hash proof …
npm run test
npm run typecheck && npm run lint
npm run check:review-ledger
npm run build
git status --porcelain                      # compare to the start snapshot
```

## 9. Completion-report contract

Changed files with `git hash-object` before/after · AC1–AC8 with actual results · the Phase 1 decision and the
owner approval it carries · both plant transcripts with their distinct failure names and their restores · the AC6
no-false-positive list · assumptions, deviations, limitations. **If instance ⓑ does not reproduce, report that
rather than repeating this kickoff's description of it.** Status is `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED`, or `BLOCKED` — never self-approved.

---

## Appendix A — execution contract

| Field | Value |
|---|---|
| Active route / owner decision | Two-phase by design: Phase 1 produces a decision, the owner approves, Phase 2 builds exactly that. This is **not** a multi-route task — Phase 2 has one route once Phase 1 closes. |
| Starting worktree mode | clean isolated (2 known untracked CI-fixture logs) |
| Allowed final write set | §5 "In scope" only |
| Blocked decision | Phase 2 is blocked until the Phase 1 approval exists |

| # | Checkpoint | Observable | Comparator / failure |
|--:|---|---|---|
| 0 | start snapshot | `git status --porcelain` = 2 known `??` | a third entry → stop |
| 1 | Phase 1 decision published | document exists, Q1–Q4 answered | missing answer → `BLOCKED`, not a guess |
| 2 | owner approval | quoted, dated | absent → Phase 2 must not start |
| 3 | control built | `node scripts/<checker>.mjs` exits 0 on today's tree | non-zero → the format admits pre-existing noise; redesign, do not allowlist |
| 4 | AC3 fixture | 691 reconstruction rejected, all three values named | a bare "mismatch" message → insufficient |
| 5 | AC4 + AC5 plants | two **distinct** failure names, both restore clean | one name for both directions → the control cannot tell drift from staleness |
| 6 | AC6 | history unflagged and byte-unchanged | any archive/session edit → stop |
| 7 | gates | §8 commands exit 0, transcripts retained | non-zero → `PARTIALLY IMPLEMENTED` at best |

## Appendix B — rule-compliance ledger

| Rule | Applicability | Mandatory outcome | Evidence | Result |
|---|---|---|---|---|
| `CLAUDE.md` — every task belongs to a sprint; kickoff at `tasks/Sprints/Sprint_NN_kickoff_prompt_Task_NNN_<Slug>.md` | new task 747 | sprint first, then kickoff | Sprint 61 opened with its own plan file; goal-fit table over all 6 open sprints | `COMPLIANT` |
| `CLAUDE.md` — sprint chosen by goal fit, never "highest number" | 6 open sprints | pick by goal, else open the next | table in the Sprint 61 plan | `COMPLIANT` |
| `docs/backlog.md` standing rule — every new gate needs a two-armed plant that can demonstrably fail | this task builds a gate | plant + restore | AC4 forward, AC5 reverse, AC6 false-positive arm | `COMPLIANT` |
| `orchestrator-procedures.md` — "Requirement feasibility and detector scope": read the detector before requiring it | the task depends on `check-review-ledger.mjs` | prove how it treats the target | preflight §2 quotes `validateCoverageSummary` incl. the `PRIMARY_PRIORITIES` restriction | `COMPLIANT` |
| `orchestrator-evidence-first-preflight.md` — falsification before reliance | every material claim | `EXECUTED` / `ANALYTICAL` | preflight §5, six rows | `COMPLIANT` |
| `create-task/SKILL.md` — no owner exception without a quoted decision | Phase 1 ends at an owner approval | quote or `BLOCKED` | ckpt 2 requires the quote before Phase 2 | `COMPLIANT` |
| `orchestrator-ui-task-design.md` | — | visual source map | `NOT APPLICABLE` — no visible artifact changes | `NOT APPLICABLE` |
| `docs/critical-flow-registry.md` | — | regression evidence when a flow is touched | `NOT APPLICABLE` — no registry flow touches `scripts/` governance checkers | `NOT APPLICABLE` |
