# Task 703 — Port the skeleton-count invariant (I-D) into `check:homepage-grid`

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** governance gate extension (`docs/rule-index.md` → "Storybook / Visual Proof").
- **Secondary type:** none. No component, no style, no rendered surface changes.
- **Origin:** **finding F1 (`P2`) of the Task 701 review, 2026-07-31** — an orchestrator omission. Task 701's
  §3.5 invariant table and R1 never listed the skeleton-count assertion, so the executor complied literally and
  the consolidation dropped it.

> **This is the blocker on owner-sequence step 3.** Step 3 deletes `task668-qa-grid-1440.mjs`, which is currently
> the only place asserting the loading-grid skeleton counts. Until I-D lands, deleting it removes the invariant
> entirely — and the rendered matrix cannot cover for it, because `HomepageListingGrids/Loading` is a documented
> noise-flaky story.

---

## 2. Objective

1. Add invariant **I-D** — Featured loading grid renders **3** skeletons, Latest renders **4** — to
   `scripts/check-homepage-grid.mjs`.
2. Add its planted violation to `--verify-gate`, on the same per-invariant standard as the existing six.
3. Unblock step 3.

---

## 3. Verified context

Read in this worktree on 2026-07-31.

### 3.1 The assertion being ported

`scripts/task668-qa-grid-1440.mjs`:

```js
:76  // AC4 — skeleton counts on the loading branch (§10.2/§10.4).
:77  const EXPECTED_SKELETON_COUNT = {
:78    Featured: 3,
:79    Latest: 4,
:80  };
...
:295      const expectedSkeletons = EXPECTED_SKELETON_COUNT[cell.component];
:298        row.reasons.push(`skeletonCount=${cell.grid.childrenCount} expected=${expectedSkeletons}`);
```

The count is the **grid's direct children count** on the loading branch, not a `.mantine-Skeleton-root` count.
Port that semantic exactly.

### 3.2 The source of truth in the product

- `src/modules/listings/components/FeaturedListingsView.tsx:59` —
  `{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}`
- `src/modules/listings/components/LatestListingsView.tsx:44` —
  `{Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}`

3 and 4 are literals in the Views. Both are **read-only** in this task.

### 3.3 Where it lands

`scripts/check-homepage-grid.mjs` (Task 701, landed) already visits both loading stories —
`system-featuredlistings--loading` and `system-latestlistings--loading` are entries 2 and 4 of `GAP_STORIES` — and
already measures their columns and gaps at all ten `GAP_WIDTHS` × 4 locales. **The cells are already being
captured; only the assertion is missing.** Add I-D to that existing pass; do not add a new story matrix.

### 3.4 The plant convention to follow

`--verify-gate` (`runVerifyGate`) runs a negative arm, then six named `PLANTS`, then a closing negative arm.
Each plant is an in-page `page.evaluate` mutation restored in `finally`, and each is asserted to trip **its own**
invariant with "no unrelated cell affected". Match this exactly — a seventh entry in the same structure.

### 3.5 Why the rendered matrix cannot substitute

`HomepageListingGrids/Loading` is in the Task 698 §8.1 documented noise set; the Task 699 review measured **10**
md5-changed cells on it under a zero-code-diff control. A byte comparator cannot assert a stable child count
there. This gate can, because it reads the DOM rather than pixels.

### 3.6 Start state

`git status --porcelain` expected **empty**. Anything else is a **stop and report** plus
`docs/orchestrator-dirty-worktree-manifest-template.md`.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1, §3.3 | `check-homepage-grid.mjs` asserts I-D — grid direct-children count is **3** for Featured and **4** for Latest on the `--loading` stories — inside the existing gap-matrix pass, with a comment naming `task668-qa-grid-1440.mjs:77` as the source. | P0 | AC1 | Confirmed |
| R2 | §3.1 | The value is **transcribed**, not re-derived from the current render. If the live count disagrees with 3/4, **stop and report** — that is a regression nobody is currently checking for. | P0 | AC1 | Confirmed |
| R3 | §3.4 | `--verify-gate` gains a seventh plant that forces a wrong child count on one loading grid and is asserted to trip **only** I-D. Negative arms before and after still pass clean. | P0 | AC2 | Confirmed |
| R4 | cl. 1 | No file under `src/` is edited. The three original probes stay byte-identical (md5-witnessed) — step 3 is a separate task. | P0 | AC3 | Confirmed |
| R5 | cl. 9 | `check:homepage-grid` exits 0 on the real tree; `typecheck` 0; `check:stories` 0/127; `check:i18n` 2215×4; `check:design-tokens` 28/0/0; `vitest` no new failure; `check:file-integrity`/`check:mojibake` clean after the records; `npm run build` exit 0 with the full 54-row route table. | P0 | AC4 | Confirmed |
| R6 | cl. 10 | Session log + `docs/backlog.md` at **80 lines**. | P1 | AC5 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — direct children, not `.mantine-Skeleton-root` count.** Each `CardSkeleton`/`RowSkeleton` contains several
  `<Skeleton>` elements; the invariant is the number of **cards**, i.e. the grid's direct children (§3.1). Counting
  skeleton elements instead would assert a different, wrong number.
- **A2 — no new matrix.** The loading cells are already captured (§3.3). Adding a second pass would double the
  run time for nothing.
- **A3 — no CI change.** `check:homepage-grid` and its self-test are already wired into `rendered-proof`
  (Task 701). This task adds an assertion inside an already-running gate.
- **A4 — do not delete any probe.** Step 3.

**Open questions — none.**

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 9, 13, 14.
2. `docs/qa-profiles.md` — the **Q4** row and its planted-violation requirement.
3. `docs/backlog.md` — **80 lines**.

**Source pre-read**

4. `scripts/check-homepage-grid.mjs` — **in full**; especially `GAP_STORIES`, the gap-matrix pass, and
   `runVerifyGate`/`PLANTS`.
5. `scripts/task668-qa-grid-1440.mjs` `:70-90` and `:285-305` — the assertion being ported.
6. `src/modules/listings/components/FeaturedListingsView.tsx` `:50-65`,
   `src/modules/listings/components/LatestListingsView.tsx` `:38-50` — read-only.

## 7. Scope

| Path | Action |
|---|---|
| `scripts/check-homepage-grid.mjs` | modify |
| `docs/backlog.md` | modify — **80 lines** |
| `docs/sessions/2026-08-01-task703-skeleton-count-invariant.md` | create |

Nothing else. `src/`, the three probes, `package.json` and `.github/` are **read-only**.

## 8. Out of scope

- **Deleting the one-off probes** — owner-sequence step 3, unblocked by this task.
- **Task 704** (skeleton shimmer amplitude + capture-time animation pause) — independent; it changes how skeletons
  *look*, this asserts how many there *are*.
- **Changing 3 or 4** — they are the product's values (§3.2).
- **Any CI or `package.json` edit** (A3).
- **Any mutating Git command.**

## 9. Current and required behavior

**Current.** `check:homepage-grid` visits both loading stories and asserts their columns and gaps, but not how
many skeleton cards they render. The only assertion of that lives in a probe no CI job runs and which step 3 will
delete.

**Required after.** I-D is asserted inside the already-running gate, with its own plant proving it fires. Step 3
can delete the probe without losing coverage.

## 10. Implementation requirements

**I0 — start protocol.** `git status --porcelain` verbatim. Record md5 of the three probes.

**I1 — baselines.** `npm run build-storybook`, then `npm run check:homepage-grid` (expect exit 0, 260 cells) and
`npm run check:homepage-grid:verify` (negative arm + 6 plants, all passing). Record both.

**I2 — read the live counts (R2).** Before writing the assertion, capture the actual direct-children count on both
loading grids at one width. If it is not 3 and 4, **stop and report**.

**I3 — add I-D (R1).** Extend the gap-matrix pass. Comment the source as `task668-qa-grid-1440.mjs:77`. Cell count
rises from 260 by the loading-story cells it now also checks — state the new total explicitly.

**I4 — add the seventh plant (R3).** Force a wrong child count in-page (e.g. remove one grid child, or append a
clone), restore in `finally`, assert only I-D trips. Then re-run the closing negative arm.

**I5 — contracts (R4).** `git status` shows no `src/`, probe, `package.json` or `.github/` entry; probe md5s match
I0.

**I6 — gates (R5).** Re-run the I1 suite plus `typecheck`, `check:stories`, `check:i18n`, `check:design-tokens`,
`vitest`.

**I7 — `npm run build` last**, exit 0, full 54-row route table verbatim.

**I8 — records, then encoding gates.** Session log per §14; `docs/backlog.md` (**80 lines**); then
`check:file-integrity` and `check:mojibake` with counts quoted.

**Order:** I0 → I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8.

## 11. Positive and negative flows

### Positive flow

Someone changes `{ length: 3 }` to `{ length: 2 }` in `FeaturedListingsView`. The PR goes red naming I-D, instead
of the loading grid quietly losing a card on a story too flaky for a pixel comparator to police.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---|---|---|---|
| **The assertion never fires** | **Yes** | R3 | the seventh plant trips I-D | AC2 |
| **The plant trips another invariant** | **Yes** | R3, §3.4 | failure, not a pass | AC2 |
| **Skeleton elements counted instead of cards** | **Yes** | A1 | direct children only | AC1 |
| **3/4 re-derived from the render** | **Yes** | R2 | transcribed; disagreement is a stop | AC1 |
| **A probe edited or deleted** | **Yes** | R4, A4 | md5-identical | AC3 |
| **A plant survives** | **Yes** | §3.4 | restore in `finally`; `git status` clean | AC3 |
| Localization / RLS / data path | No | Gate-only change | N/A | — |
| Critical-flow regression | No | No registry row covers loading-grid card counts | N/A | — |

## 12. Acceptance criteria

- **AC1 [R1, R2]** — I-D asserts direct-children 3/4 on the two loading stories inside the existing pass, sourced
  by comment, transcribed not re-derived.
- **AC2 [R3]** — `--verify-gate` shows the negative arm clean, the seventh plant tripping **only** I-D, and the
  closing negative arm clean, with verbatim output for each.
- **AC3 [R4]** — `git status` shows no `src/`, probe, `package.json` or `.github/` entry; probe md5s unchanged.
- **AC4 [R5]** — all gates green as listed; `npm run build` exit 0 with the full 54-row route table.
- **AC5 [R6]** — session log exists; `docs/backlog.md` at exactly 80 lines.

## 13. QA profile and verification plan

**`Q4 — Release/Critical Flow`**, for one reason: this extends a blocking CI gate, and cl. 13 requires a planted
violation for the new assertion. **Not Q3** — nothing rendered changes and `src/` is untouched, so a visual matrix
would prove nothing about this diff.

| Command | Expected |
|---|---|
| `npm run check:homepage-grid` | exit 0, new cell total stated |
| `npm run check:homepage-grid:verify` | negative arm clean · 7 plants each tripping their own invariant · closing negative arm clean |
| `typecheck` / `check:stories` / `check:i18n` / `check:design-tokens` | 0 · 0/127 · 2215×4 · 28/0/0 |
| `vitest` | no new failure |
| `check:file-integrity` / `check:mojibake` | 0 / 0 after I8 |
| `npm run build` | **0 — hard gate**, full 54-row route table, last |

## 14. Completion report contract

Session log at `docs/sessions/2026-08-01-task703-skeleton-count-invariant.md`:

1. `Files Changed` matching the real diff — say **modified** if modified (Task 693 review F3).
2. I0/final `git status --porcelain` plus probe md5s at both ends.
3. R1–R6 → AC1–AC5 with evidence.
4. The I2 live-count reading, before the assertion existed.
5. **All verify-gate runs verbatim** — both negative arms and all seven plants.
6. The diff of `check-homepage-grid.mjs`.
7. Every command with its actual exit code; the build tail verbatim with the full 54-row route table.
8. Deviations and limitations.

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. No
self-approval; no mutating git.

**Handoff:** `tasks/kickoff_prompt_Task_703_Skeleton_Count_Invariant_ID.md` under
`.claude/skills/execute-task/SKILL.md`.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable with no chat context | **Yes** — the source assertion with line numbers, the product literals, the existing gate structure and the plant convention are all inline |
| Every primary requirement has a binary AC | **Yes** — R1–R6 → AC1–AC5 |
| Scope protects existing behavior | **Yes** — §8 plus R4's read-only `src/`/probes/CI, gated by AC3 |
| QA profile + rationale | **Yes** — §13 Q4 with the planted-violation reason, Q3 declined with a reason |
| Negative flows by applicability | **Yes** — §11, incl. the wrong-count-semantic branch and the re-derivation branch |
| Does not claim an uninspected command, file, test, or behavior | **Yes** — §3.1 quotes the probe with line numbers, §3.2 quotes both Views, §3.3 names the existing `GAP_STORIES` entries, §3.5 cites measured noise from the 699 review |
| Gates prove the changed behavior | **Yes** — a dedicated plant that must trip I-D and nothing else |
| Single active owner route | **Yes** — forks are only stop conditions: non-empty I0, a live count other than 3/4, a plant tripping the wrong invariant |
| Baselines account for task-created artifacts | **Yes** — I1 records the gate passing with six plants *before* the seventh exists |
| Dirty-worktree handling | **Yes, declared** — §3.6 |

**Known-risk note for the reviewer.** Two likely defects. First, **counting `.mantine-Skeleton-root` elements
instead of grid children** — each card contains five or six of them, so the assertion would pass on a number that
has nothing to do with the invariant; A1 names the correct semantic. Second, **adopting whatever the render shows**
if it is not 3/4 — the whole reason this invariant is being restored is that nothing has been checking it, so a
disagreement is the finding, not a number to write down.
