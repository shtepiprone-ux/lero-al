# Task 747 — Phase 2 kickoff: build the ledger-claim projection control

**Authority chain (all three bind, in this order):**

1. `tasks/Sprints/Sprint_61_kickoff_prompt_Task_747_Ledger_State_Projection_Gate.md` — the task kickoff. Still binding in full.
2. `tasks/Sprints/Sprint_61_Task_747_phase1_decision.md` (`REVISION 5`, 69 lines) — **owner-approved 2026-08-20**. This is the build contract.
3. This document — Phase 2 execution constraints and evidence discipline. It adds nothing to the design.

**Preflight:** `tasks/Sprints/Sprint_61_Task_747_evidence_preflight.md` §2 and §4 — read before writing anything.
**QA profile:** `Q1 Targeted` + mandatory planted-violation proof. **Priority:** P1.
**Status:** PHASE 1 CLOSED · PHASE 2 OPEN.

---

## 0. What is already settled — do not re-open

Phase 1 ran three times and was reviewed adversarially twice. `REVISION 5` is approved. The marker syntax, the v1 field set, the source-path policy, the preflight order, the fail-closed enumeration, the scan scope, the lifecycle rule and the D1 drift table are **specification, not suggestion**. Transcribe them into code exactly.

Do not propose an alternative marker format. Do not reintroduce `SOURCE-RETIRED`. Do not widen v1 beyond `openP0`, `openP1`, `openP2`, `decision`. If you believe a clause is wrong, stop and report `BLOCKED` with the clause quoted — do not build around it.

The owner's approval, quoted from the decision document:

> **Owner approval (2026-08-20):** Approve Task 747 REVISION 5 as the Phase 2 contract. I explicitly accept the Phase 1 evidence variance: the overwritten decision's contemporaneous pre-edit hash and the new session log's hash were not captured. This is not retroactively represented as compliant evidence. The retained `revision5-*` validation logs are accepted as Phase 1 evidence. Phase 2 may begin only under this approved decision.

## 1. Owner clarification — `data-ledger-hash` and `SHALLOW-REPOSITORY`

These are two unrelated mechanisms. The decision document is correct on both; this section fixes the reading so you do not conflate them.

**`data-ledger-hash` is the current working-tree content hash.**

```
data-ledger-hash = stdout of:  git hash-object -- <normalized data-source>
```

SHA-1 of the named ledger file **as it stands in the working tree**. Do **not** use `HEAD:<path>`, `review.baseRevision`, a commit SHA, a historical blob, or any other history lookup. D1 then works literally: any byte change to a valid retained ledger changes this hash and yields `LEDGER-MOVED`, exit 1.

**`SHALLOW-REPOSITORY` belongs to source validation, not to hashing.**

The guard precedes the mandatory `node scripts/check-review-ledger.mjs --file <source>` call. Its justification is in that validator: `validateLedger` calls `immutableCommit(ledger.review.baseRevision, …)` at `check-review-ledger.mjs:990`, which runs `git cat-file -e <revision>^{commit}` (`:152`), and `readGitRevisionFile` reads history via `git show <revision>:<path>` (`:157-165`, called from `:605`, `:647`, `:699`). The `baseRevision` check runs for **every** ledger carrying a `review` object, so in a shallow clone the `--file` validation fails universally — and without the guard your checker would report `SOURCE-VALIDATION-FAILED`, blaming a ledger that is fine. The guard converts that into a deterministic `SHALLOW-REPOSITORY`, exit 2, before the validator is invoked.

Both mechanisms are mandatory. Neither is redundant. Neither may be removed as dead code.

## 2. Build scope

Exactly what the decision authorises, nothing more:

- **one** checker under `scripts/`
- its unit tests under `scripts/__tests__/`, fixtures under `scripts/__tests__/fixtures/`
- **one** `check:` script in `package.json` (a `:verify` sibling for the `--verify-gate` flag is permitted, following the existing `check:assertion-liveness` / `check:assertion-liveness:verify` precedent)
- **at least one real visible marker** on a live claim in a live carrier document
- `docs/backlog.md` update (index-sized, ≤80 lines)
- one new session log under `docs/sessions/`

**Zero diff, no exceptions:** `docs/backlog-archive.md` · every `*.SUPERSEDED.json` · every closed session log · `scripts/check-review-ledger.mjs` · `.github/workflows/governance-pr.yml` · `tasks/Sprints/Sprint_61_Task_747_phase1_decision.md` (approved and frozen) · Task 746 · Task 750.

**Do not wire the new gate into CI.** Making it blocking is a separate owner decision.

## 3. Acceptance criteria

AC1 is closed by the owner approval above. AC2–AC8 carry over from the task kickoff §6, refined by `REVISION 5`:

- **AC2** — the checker exits **0** on today's tree, with the real marker in place. No allowlist, no baseline file. If it opens with pre-existing violations, the format is wrong; report `BLOCKED` rather than suppressing them.
- **AC2a** *(fence rule, prove it)* — `tasks/Sprints/Sprint_61_Task_747_phase1_decision.md` is inside the scan scope (`tasks/Sprints/*.md`) and contains a marker example inside a fenced code block. AC2 passes **only** if fence and inline-code skipping is genuinely implemented. Add a unit arm asserting a marker inside a fence and inside backticks is ignored.
- **AC3** — test-only reconstruction under `scripts/__tests__/fixtures/`: Task 691 state `openP0: 4` against a visible `2 P0` claim. The checker rejects it and names the file, the claimed text, and the ledger-derived text. A bare "mismatch" is insufficient.
- **AC4** *(forward arm)* — edit **only** the visible element body, leave the ledger byte-identical → `CLAIM-STALE`, exit 1. Restore → pass. Record both runs and `git hash-object` before/during/after.
- **AC5** *(reverse arm)* — edit a **real retained** ledger, keep it valid (`check:review-ledger --file` still green under every coordinated change the edit requires), leave the markdown untouched → `LEDGER-MOVED`, exit 1, a **distinct** name from AC4. Fully restore, proven by hash. **Do not describe any edit recipe as viable until you have demonstrated it in this session** — the unvalidated four-edit recipe is exactly what sank an earlier revision.
- **AC6** — `docs/backlog-archive.md` and at least two closed session logs containing counts are unflagged and byte-unchanged. Demonstrate the lifecycle rule end to end: a marker is stripped from its carrier **before** that carrier closes or archives; a closed or archived document is never re-pinned or edited to clear the gate.
- **AC7** — `npm run test`, `npm run typecheck`, `npm run lint`, `npm run check:review-ledger`, `npm run check:mojibake`, `npm run check:file-integrity`, `npm run build` all exit 0. Transcripts retained under `docs/reviews/artifacts/2026-08-19-task747/` with a `phase2-` prefix. `.screenshots/` is gitignored and must not hold retained evidence.
- **AC8** — `docs/backlog.md` within its 80-line cap, updated with concise current state.

Also assert, as unit arms, each distinct bad-input message the decision enumerates: missing / duplicate / unknown / malformed attribute · malformed quoting · nested markup · malformed body · illegal source path (`..`, `*.SUPERSEDED.json`, `*.DRAFT.json`) · missing or unreadable source · `SHALLOW-REPOSITORY` · `SOURCE-VALIDATION-FAILED` · unsupported field · unavailable `git`. Each exits 2. Mixed bad-input-plus-drift prints every drift finding and still exits 2.

## 4. Evidence discipline — read this before your first write

Phase 1 lost evidence it could have captured. Do not repeat it.

1. **Capture the pre-edit hash before you touch a file, not after.** For every file you create or modify: `git hash-object -- <path>` before the first write, and again after the last. New files record `before: N/A (new file)`. This includes your own session log — record its `before` as N/A and note that a file cannot contain its own post-write hash.
2. **Snapshot scope with `git status --porcelain --untracked-files=all`,** before the first write and after the last. Plain `--porcelain` collapses an untracked directory to a single line, which makes `docs/reviews/artifacts/2026-08-19-task747/` unauditable — that gap was a P1 finding against Phase 1. Use `-uall` so every retained transcript is individually listed.
3. **Baseline as of this kickoff** — 1 modified, 18 untracked under `-uall` — 19 lines total (this kickoff file included; the artifacts directory expands to 11 individual files):

```
 M docs/backlog.md
?? .click-shield-ci-fixture.stderr.log
?? .click-shield-ci-fixture.stdout.log
?? docs/reviews/artifacts/2026-08-19-task747/  (11 files, individually listed under -uall)
?? docs/sessions/2026-08-20-task747-ledger-state-projection-phase1.md
?? docs/sessions/2026-08-20-task747-phase1-revision3-rework.md
?? docs/sessions/2026-08-20-task747-phase1-revision5-rework.md
?? tasks/Sprints/Sprint_61_Task_747_phase1_decision.md
?? tasks/Sprints/Sprint_61_Task_747_phase2_kickoff.md
```

Reference hashes at Phase 2 start: decision `2463dfa6cda6971ed1ed8a8af7378881af888f6a` · `docs/backlog.md` `1fafdc61f46bcb4287a7257c605d39fece50c235`. Both must be unchanged at the end for the decision; the backlog will change by your AC8 edit only.

4. **Every plant is restored and the restore is proven by hash**, not asserted in prose.
5. **Run gates unpiped, capture `EXIT_CODE` into the same transcript file.**

## 5. Environment

Windows / PowerShell, Node v22.23.2, Next.js 15.5.18. **Use `npm` only.** A `pnpm` invocation in this repo relocates ~50 packages into `node_modules/.ignored/` and writes a `.pnpm-store/` containing a binary that fails `check:file-integrity`. If you find either, stop and report it rather than committing around it.

## 6. Verification plan — run exactly these, unpiped, capturing `EXIT_CODE`

PowerShell: use `$LASTEXITCODE`. `--no-optional-locks` keeps `git status` from taking `.git/index.lock`; harmless
locally, and required if any agent tooling touches the repo concurrently.

```
# ── 0 · START SNAPSHOT — before the first write, no exceptions ───────────────
git --no-optional-locks status --porcelain -uall
git --no-optional-locks hash-object -- tasks/Sprints/Sprint_61_Task_747_phase1_decision.md   # expect 2463dfa6d…
git --no-optional-locks hash-object -- docs/backlog.md                                       # expect 1fafdc61f…
git --no-optional-locks hash-object -- tasks/Sprints/Sprint_61_Task_747_phase2_kickoff.md    # record it; a file
                                                                                             # cannot carry its own hash
git --no-optional-locks hash-object -- docs/backlog-archive.md                               # AC6 reference
git --no-optional-locks hash-object -- package.json .github/workflows/governance-pr.yml

# ── 1 · PRE-EDIT HASH for every file you are about to touch ─────────────────
git --no-optional-locks hash-object -- <path>          # once per file, BEFORE the write
                                                       # new file → record "before: N/A (new file)"

# ── 2 · AC2 — checker green on today's tree, real marker in place ───────────
node scripts/<new-checker>.mjs                         # expect exit 0

# ── 3 · AC3 + unit arms (incl. AC2a fence rule, all bad-input messages) ─────
npm run test                                           # expect exit 0

# ── 4 · AC4 FORWARD PLANT — markdown drifts, ledger frozen ──────────────────
git --no-optional-locks hash-object -- <carrier>.md                    # A: baseline
#   edit ONLY the marker element body
git --no-optional-locks hash-object -- <carrier>.md                    # B: must differ from A
git --no-optional-locks hash-object -- <source>.review-ledger.json     # must be UNCHANGED
node scripts/<new-checker>.mjs                                         # expect CLAIM-STALE, exit 1
#   restore the body
git --no-optional-locks hash-object -- <carrier>.md                    # must equal A exactly
node scripts/<new-checker>.mjs                                         # expect exit 0

# ── 5 · AC5 REVERSE PLANT — ledger moves, markdown frozen ───────────────────
git --no-optional-locks hash-object -- <source>.review-ledger.json     # C: baseline
#   edit the retained ledger, applying every coordinated change it needs to stay valid
node scripts/check-review-ledger.mjs --file <source>.review-ledger.json # MUST exit 0 — else you are
                                                                        # proving SOURCE-VALIDATION-FAILED,
                                                                        # not LEDGER-MOVED
git --no-optional-locks hash-object -- <source>.review-ledger.json     # D: must differ from C
git --no-optional-locks hash-object -- <carrier>.md                    # must equal A
node scripts/<new-checker>.mjs                                         # expect LEDGER-MOVED, exit 1
#   restore the ledger
git --no-optional-locks hash-object -- <source>.review-ledger.json     # must equal C exactly
node scripts/check-review-ledger.mjs --file <source>.review-ledger.json # expect exit 0
node scripts/<new-checker>.mjs                                         # expect exit 0

# ── 6 · AC6 — history unflagged and byte-unchanged ──────────────────────────
node scripts/<new-checker>.mjs                                         # exit 0 with archive+closed logs present
git --no-optional-locks hash-object -- docs/backlog-archive.md         # must equal the §0 value
git --no-optional-locks status --porcelain -uall -- docs/backlog-archive.md docs/sessions/
                                                                       # only your NEW session log may appear

# ── 7 · AC7 GATES ───────────────────────────────────────────────────────────
npm run test
npm run typecheck
npm run lint
npm run check:review-ledger
npm run check:mojibake
npm run check:file-integrity
npm run build
#   → each transcript to docs/reviews/artifacts/2026-08-19-task747/phase2-<name>.log with EXIT_CODE=

# ── 8 · POST-EDIT HASHES + CLOSING SNAPSHOT ─────────────────────────────────
git --no-optional-locks hash-object -- <each created or modified path>
git --no-optional-locks diff --check                                   # expect no output
git --no-optional-locks status --porcelain -uall                       # diff against §0; every new entry
                                                                       # must be one you can name
# ── 9 · FROZEN-FILE ASSERTIONS — all must hold at the end ───────────────────
git --no-optional-locks hash-object -- tasks/Sprints/Sprint_61_Task_747_phase1_decision.md   # STILL 2463dfa6d…
git --no-optional-locks hash-object -- tasks/Sprints/Sprint_61_Task_747_phase2_kickoff.md    # STILL the §0 value
git --no-optional-locks status --porcelain -uall -- .github/workflows/ scripts/check-review-ledger.mjs
                                                                       # expect EMPTY output
git --no-optional-locks status --porcelain -uall -- "docs/reviews/*.SUPERSEDED.json"
                                                                       # expect EMPTY output
```

If any assertion in §0/§8/§9 fails, stop and report it — do not continue and reconcile in prose at the end.

**Read-only git only.** Every command above is inspection (`status`, `diff`, `show`, `log`, `hash-object`). Mutating git is owner-only and native PowerShell only (`CLAUDE.md` § Git policy, `docs/orchestrator-procedures.md`). You must not run, emit, or suggest `git add`, `git commit`, `git push`, `git reset`, `git restore`, `git checkout`, `git stash`, `git clean`, or any other mutating form — including in your completion report. You have no approval authority; leave every change unstaged in the working tree and let the owner stage it after review.

## 7. Completion-report contract

Changed files with `git hash-object` before/after (every one, including new files) · AC2–AC8 with actual observed results, not restatements of the requirement · both plant transcripts with their distinct failure names and hash-proven restores · the AC6 no-false-positive list · the exact text and location of the real visible marker you planted · assumptions, deviations, limitations, stated as gaps rather than inferred.

Status is `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. **Never self-approved.**

---

## Appendix — checkpoints

| # | Checkpoint | Observable | Failure |
|--:|---|---|---|
| 0 | start snapshot | `git status --porcelain -uall` matches §4.3 | a further entry → stop and report before writing |
| 1 | decision unchanged | decision hash still `2463dfa6…` at every checkpoint | any change → stop; the approved contract is frozen |
| 2 | checker built | exits 0 on today's tree incl. the real marker | non-zero → format admits noise; `BLOCKED`, do not allowlist |
| 3 | fence rule | unit arm proves fenced/inline-code markers ignored | absent → AC2 passes for the wrong reason |
| 4 | AC3 fixture | 691 reconstruction rejected, all three values named | bare "mismatch" → insufficient |
| 5 | AC4 + AC5 | two distinct failure names, both restored, hash-proven | one name for both directions → cannot tell drift from staleness |
| 6 | AC6 lifecycle | history unflagged, byte-unchanged; strip-before-close shown | any archive or closed-log edit → stop |
| 7 | gates | §6 step 7 commands exit 0, `phase2-` transcripts retained | non-zero → `PARTIALLY IMPLEMENTED` at best |
| 8 | no CI wiring | `.github/workflows/governance-pr.yml` byte-unchanged | any diff → out of scope |
