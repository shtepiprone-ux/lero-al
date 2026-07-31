# Task 701 — Consolidate the homepage grid invariants into one CI gate

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** governance gate authoring (`docs/rule-index.md` → "Storybook / Visual Proof").
- **Secondary type:** none. No component, no style value, no rendered surface is edited.
- **Origin:** **step 2 of the owner cleanup sequence** (owner directive 2026-07-31, recorded in the Task 668 review
  and `docs/backlog.md`). Step 1 (Task 696, `@source not "../../scripts"`) is **APPROVED and landed**. Step 3
  (deleting the one-off probes) is **out of scope here** and comes after this gate is proven.
- **Owner requirement, quoted 2026-07-31:** *"У самому гейті варто вимагати посаджені порушення для кожного
  інваріанту, бо це саме прогалина, яку виявили 669 і 666."* Every invariant this gate asserts must ship with a
  planted-violation proof that the assertion actually fires.

> **Read this first.** Task 691 (`ListingCard` + `MantineListingCardPattern` de-Tailwind) is the next and largest
> migration slice, and it lands directly on top of these grids. Today the invariants protecting them live in three
> task-numbered scripts that **no CI job runs**. This task turns them into one gate that runs on every PR, so 691
> is executed under protection instead of under review-time inspection.

---

## 2. Objective

1. Create **one** neutrally-named gate covering the three permanent homepage-grid invariants: column counts at the
   1440 step, the Featured/Latest gaps, and the header-row geometry.
2. Ship it with a `--verify-gate` self-test that **plants a violation for every individual invariant** and proves
   each one is caught.
3. Wire both into CI without adding a third Storybook build.

---

## 3. Verified context

Every fact below was read or executed in this worktree on branch `task/q0-ci-rendered-locale-split` on 2026-07-31.

### 3.1 The three existing probes — read in source

| Script | Lines | What it actually asserts |
|---|---:|---|
| `scripts/task420-qa-grid-step.mjs` | 302 | Per-story column-track count from `getComputedStyle(grid).gridTemplateColumns` (non-`0px` tracks) against each story's **own** expected table; no horizontal scroll (`scrollWidth <= clientWidth + 2`); `.container-wide` content box ≤ **1408px**, checked only at ≥1536 where the cap can bind. Covers `featuredlistings` (mechanism-agnostic locator: first `display:grid` inside `#storybook-root` with ≥1 `.listing-card` descendant) and `similarlistings` (**verbatim hardcoded-Tailwind locator, deliberately kept as proof that story is NOT migrated**). |
| `scripts/task668-qa-grid-1440.mjs` | 385 | Column **and gap** tables (AC1–AC4) across 4 stories, with a `--baseline` mode that only writes and a `--verify` mode that asserts and labels each width as `APPROVED CHANGE (owner 2026-07-26)` for the 1440–1535 band or `UNCHANGED` elsewhere. Dual locator: first element with `getComputedStyle(el).display === 'grid'` inside `#storybook-root`. |
| `scripts/task668-qa-header-geometry.mjs` | 397 | Featured header row (`system-featuredlistings--default`) × 3 widths × 4 locales = 12 cells. Measures the live row, then **sets `--group-gap` to `0px` on the same element inside the same `page.evaluate`**, re-measures, and restores the original inline state in a `finally`. One page instance, no second `goto`, no clone. |

**None of the three is referenced by `package.json` or `.github/workflows/`** (verified by grep). They are 1084
lines of dead-in-CI tooling.

### 3.2 The CI shape — read in `.github/workflows/governance-pr.yml`

Three independent jobs:

| Job | Budget | Relevant steps |
|---|---|---|
| `governance` | 10 min | `tsc`, `lint`, `npm test`, the whole `check:*` suite. **No browser, no Storybook.** |
| `rendered-proof` | 45 min | `npx playwright install chromium --with-deps` (`:145`) → `npm run build-storybook` (`:148`) → `npm run screenshots:assert -- --mantine-only` (`:159`) → uploads `.screenshots/rendered-assert/`. |
| `locale-leak` | 45 min | installs Playwright and builds Storybook **independently** (`:188`, `:191`). |

The two browser jobs already each pay for their own Storybook build; the workflow's own comment explains this was a
deliberate split for budget isolation. **This task must not add a third.** The new gate belongs as a step inside
`rendered-proof`, after `build-storybook`, reusing that job's already-installed Chromium and already-built
`storybook-static/`.

### 3.3 The self-test precedent — already in CI, already named

`governance-pr.yml` runs two gate self-tests, each labelled *"verifies gate detects violations — CI-safe"*:

```
- name: Hydration gate self-test …            run: npm run check:hydration:verify
- name: Listing public-visibility gate self-test …  run: npm run check:listing-visibility:verify
```

`package.json` backs them with the `check:<name>` / `check:<name>:verify-gate` pair convention
(`check:hydration` → `check:hydration:verify` → `node scripts/check-hydration-console.mjs --verify-gate`;
`check:listing-visibility:verify` → `--verify-gate`). **Follow this convention exactly.** Do not invent a new
naming scheme or a new self-test mechanism.

### 3.4 Why the planted violations are required here

Two reviews in this queue found the gap the owner is closing:

- **Task 669** added three viewport cells to `check-stories-rendered.mjs` justified by the claim that "a future
  edit deleting the third step entirely would pass every standing gate" — and never planted that deletion.
  Review finding F1 `P3`.
- **Task 666** changed `check:mojibake`'s file-selection branch with **no regression test at all**. Review finding
  F1 `P3`.

Contrast the tasks that did it right: Task 692 planted four violations, Task 693's control took three attempts
before it was valid, and Task 663 shipped a **two-armed** control where the second arm proves the check did not
widen. This gate must meet that bar for **each invariant separately** — a single aggregate "the gate fails on a
broken page" proof is explicitly insufficient.

### 3.5 The invariants, with their current authority

| ID | Invariant | Value | Authority |
|---|---|---|---|
| **I-A** | Featured column steps | 1 → 2@640 → 3@1280 → **4@1440** | Task 668, owner-approved 2026-07-26 |
| **I-A** | Latest column steps | 1 → 2@768 → **3@1440** | same |
| **I-A** | Similar column steps | unmigrated Tailwind, still steps at **1536** | `task420-qa-grid-step.mjs` — must stay 1536 until its own migration |
| **I-B** | Featured grid gap | **16px** (`theme.spacing.md` = 1rem) | Task 668 |
| **I-B** | Latest grid gap | **12px** (`theme.spacing.sm` = 0.75rem) | Task 668 |
| **I-C** | Featured header row | `Group justify="space-between" align="center" wrap="nowrap" mb="xl"` renders the same geometry it did as `div.flex … mb-6`, despite `Group`'s default `gap="md"` = 16px | Task 668 revision 7 (F1) |
| supporting | no horizontal scroll | `scrollWidth <= clientWidth + 2` | `task420` |
| supporting | container cap | `.container-wide` content box ≤ **1408px** at ≥1536 | `task420`, `--width-page-max` |

### 3.6 Start state

`git status --porcelain` is expected to be **empty**. Any entry is a **stop and report** — record it verbatim and
complete `docs/orchestrator-dirty-worktree-manifest-template.md` before proceeding.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | §3.1, §3.5 | A new `scripts/check-homepage-grid.mjs` asserts **I-A** (per-story column tables incl. Similar's 1536 step), **I-B** (16px/12px gaps) and **I-C** (header-row geometry) plus the two supporting assertions, across the same story × width × locale matrix the three probes cover today. Neutral name — no task number in the filename, the npm script, or the CI step label. | P0 | AC1 | Confirmed |
| R2 | §3.3 | `package.json` gains `check:homepage-grid` and `check:homepage-grid:verify` (→ `--verify-gate`), matching the `check:hydration` / `check:listing-visibility` convention. | P0 | AC1 | Confirmed |
| R3 | §3.4, owner | `--verify-gate` plants a violation for **each invariant separately** — at minimum one per row of §3.5's I-A/I-B/I-C — and asserts the gate reports **that specific** invariant. A planted violation that trips a different assertion than the one under test is a failure, not a pass. Plants are injected in-page via `page.evaluate` (the §3.1 `--group-gap` technique), never by editing source. | P0 | AC2 | Confirmed |
| R4 | R3 | `--verify-gate` also asserts the **negative arm**: with no plant, every invariant passes on the real tree. A self-test that only proves failures could pass while the gate is permanently red. | P0 | AC2 | Confirmed |
| R5 | §3.2 | CI wiring adds the gate and its self-test as **steps inside the existing `rendered-proof` job**, after `npm run build-storybook`. **No new job. No third Storybook build. No second `playwright install`.** | P0 | AC3 | Confirmed |
| R6 | §3.1 | The three existing probes are **not deleted, renamed or edited** — that is step 3 of the owner sequence. Temporary duplication is intended. | P0 | AC4 | Confirmed |
| R7 | cl. 1 | No file under `src/` is edited. This task adds a gate; it does not change what the gate measures. | P0 | AC4 | Confirmed |
| R8 | §3.5 | The expected tables are transcribed from the three existing probes, **not re-derived** from theme values or from the current render. If a probe's table and the live render disagree, **stop and report** — that is a finding, not a number to update. | P0 | AC1 | Confirmed |
| R9 | cl. 9, 14 | `typecheck` 0; `check:stories` 0/127; `check:story-coverage` 15/15; `check:i18n` 2215×4; `check:design-tokens` 28/0/0; `npx vitest run` no new failure; `check:file-integrity`/`check:mojibake` clean after the records exist; `npm run build` exits 0 with the full 54-row route table. | P0 | AC5 | Confirmed |
| R10 | cl. 10 | Session log + `docs/backlog.md` concise state, backlog staying at **80 lines**. | P1 | AC6 | Confirmed |

---

## 5. Assumptions and open questions

- **A1 — transcribe, do not re-derive (R8).** The three probes are the authority for every expected value. If the
  live render disagrees with a transcribed table, that is a regression the old probes would have caught and nobody
  was running — **stop and report it**, do not silently adopt the observed value.
- **A2 — one gate, not three wrappers.** A file that shells out to the three existing scripts is not a
  consolidation; it inherits their names, their duplication and their divergent locators. Port the assertions.
- **A3 — plants are in-page, never source edits.** `page.evaluate` mutation with restore in `finally`, per §3.1's
  header probe. A self-test that edits a `src/` file cannot run safely in CI.
- **A4 — `Similar` stays at 1536 on purpose.** It is unmigrated. A gate that "fixes" it to 1440 would assert a
  migration that has not happened. Its verbatim Tailwind locator is evidence and must be preserved in spirit.
- **A5 — no probe is deleted here.** Step 3. If the executor believes duplication is untidy, that is correct and
  deliberate.

**Open questions — none.** The invariants, their values, the CI shape and the naming convention are all read from
the repository.

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 9, 13, 14.
2. `docs/rule-index.md` — "Storybook / Visual Proof".
3. `docs/qa-profiles.md` — the **Q4** row and its planted-violation requirement.
4. `docs/storybook-governance.md` §14.9.17 (per-story extra viewports) and §14.11 (D26).
5. `docs/backlog.md` — the numbering line; **exactly 80 lines**.

**Source pre-read**

6. `scripts/task420-qa-grid-step.mjs`, `scripts/task668-qa-grid-1440.mjs`,
   `scripts/task668-qa-header-geometry.mjs` — **in full**. These are the specification.
7. `scripts/check-hydration-console.mjs` — the `--verify-gate` implementation to copy.
8. `.github/workflows/governance-pr.yml` `:120-170` — the `rendered-proof` job.
9. `package.json` — the `check:hydration` / `check:listing-visibility` script pairs.

## 7. Scope

| Path | Action | Why |
|---|---|---|
| `scripts/check-homepage-grid.mjs` | **create** | R1, R3, R4 |
| `package.json` | modify — 2 script entries | R2 |
| `.github/workflows/governance-pr.yml` | modify — 2 steps in `rendered-proof` | R5 |
| `docs/backlog.md` | modify | R10. **80 lines.** |
| `docs/sessions/2026-08-01-task701-homepage-grid-invariants-gate.md` | **create** | R10 |

Nothing else. `src/` and the three existing probes are **read-only**.

## 8. Out of scope

- **Deleting or editing `task420-qa-grid-step.mjs`, `task668-qa-grid-1440.mjs`,
  `task668-qa-header-geometry.mjs`, or any other `task*-qa-*.mjs`** — owner sequence step 3.
- **Task 691** (`ListingCard` de-Tailwind) — this gate protects it; it is not part of it.
- **Migrating `SimilarListings`** off Tailwind (A4).
- **Changing any column count, gap, breakpoint or theme value.**
- **Adding a CI job, a second Storybook build, or a second `playwright install`.**
- **Any mutating Git command.**

## 9. Current and required behavior

**Current.** The homepage grid invariants are asserted by three task-numbered Playwright probes totalling 1084
lines that no CI job invokes. A change to the Featured/Latest column steps, either gap, or the header row ships
with every standing gate green. Task 691 is about to rewrite the card that sits inside these grids.

**Required after.** One `scripts/check-homepage-grid.mjs`, wired as `npm run check:homepage-grid`, runs inside the
existing `rendered-proof` job and fails the PR when any §3.5 invariant breaks. `npm run check:homepage-grid:verify`
runs beside it and proves — per invariant, with an in-page plant and a clean negative arm — that each assertion
actually fires. The three original probes remain on disk, untouched, until step 3.

## 10. Implementation requirements

**I0 — start protocol.** `git status --porcelain`; record verbatim (§3.6). Do not touch `.git/index.lock`.

**I1 — baselines.** `npm run typecheck`, `check:stories`, `check:story-coverage`, `check:i18n`,
`check:design-tokens`, `npx vitest run`. Then `npm run build-storybook` and run **all three existing probes** in
their assertion modes; record their actual output. Those results are the specification for R8 — if any of them
already fails on the current tree, **stop and report** before writing anything.

**I2 — port the assertions (R1, R8).** Write `scripts/check-homepage-grid.mjs`. Transcribe each expected table
from its source probe with a comment naming that probe and the authority row from §3.5. Reuse the
mechanism-agnostic locator for migrated grids and preserve `Similar`'s distinct treatment (A4). Keep the two
supporting assertions.

**I3 — the gate passes on the real tree.** `node scripts/check-homepage-grid.mjs` → exit 0. Quote the cell counts
and compare them against I1's probe output; any disagreement is a **stop and report**.

**I4 — `--verify-gate`, negative arm (R4).** With no plant, every invariant reports PASS. Quote the output.

**I5 — `--verify-gate`, per-invariant plants (R3).** For each of I-A (Featured), I-A (Latest), I-A (Similar), I-B
(Featured gap), I-B (Latest gap) and I-C (header geometry): plant in-page via `page.evaluate`, assert the gate
reports **that specific invariant** failing, restore in `finally`, and confirm the tree is unchanged. Quote the
verbatim output of each. Suggested plants — adjust if a cleaner one exists, and say so:

| Invariant | Suggested in-page plant |
|---|---|
| I-A Featured | override the grid's `grid-template-columns` to one fewer track at 1440 |
| I-A Latest | same, on the Latest grid |
| I-A Similar | force the Similar grid to 1440-step behaviour (proving the gate still demands 1536) |
| I-B Featured gap | set the grid's `gap` to `12px` |
| I-B Latest gap | set the grid's `gap` to `16px` |
| I-C header | set `--group-gap` to a non-zero value the row must not tolerate |

> The I-B pair is deliberately cross-swapped: planting Latest's value into Featured proves the gate distinguishes
> the two rather than accepting "some gap".

**I6 — CI wiring (R5).** Add two steps to `rendered-proof` after `build-storybook`, labelled in the house style
(the self-test step must say it verifies the gate detects violations, per §3.3). Confirm no new job, no second
`playwright install`, no second `build-storybook`.

**I7 — gate checks (R9).** Re-run the I1 suite. `check:design-tokens` must stay **28**/0/0.

**I8 — `npm run build` last**, exit 0, full 54-row route table verbatim.

**I9 — records, then encoding gates.** Session log per §14; `docs/backlog.md` in place (**80 lines**). Then
`check:file-integrity` and `check:mojibake`; quote the counts. Confirm `git status` shows no `src/` entry and no
change to the three probes.

**Order:** I0 → I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8 → I9.

## 11. Positive and negative flows

### Positive flow

Task 691 rewrites `ListingCard` and `MantineListingCardPattern`. The PR runs `rendered-proof`; the new gate
measures the Featured and Latest grids at every width and finds 4/3 columns at 1440, 16px and 12px gaps, and an
unchanged header row. If the rewrite disturbs any of them, the PR goes red naming the invariant — instead of the
defect surfacing during review, or not at all.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---|---|---|---|
| **An invariant's assertion never fires** | **Yes** | R3, §3.4 | each plant trips its own invariant | AC2 |
| **A plant trips the wrong assertion** | **Yes** | R3 | that is a failure, not a pass | AC2 |
| **The gate is permanently red** | **Yes** | R4 | negative arm passes clean on the real tree | AC2 |
| **Gaps accepted loosely** | **Yes** | I5 | cross-swapped 16/12 plants distinguish the two | AC2 |
| **`Similar` silently "migrated" to 1440** | **Yes** | A4 | its plant proves the gate still demands 1536 | AC2 |
| **Expected values re-derived from the render** | **Yes** | R8, A1 | transcribed from the probes; disagreement is a stop | AC1 |
| **A third Storybook build is added** | **Yes** | R5, §3.2 | steps inside `rendered-proof` only | AC3 |
| **A probe edited or deleted "while we're here"** | **Yes** | R6, A5 | probes byte-identical | AC4 |
| **A plant survives the run** | **Yes** | A3 | restore in `finally`; `git status` clean | AC4 |
| Localization | No | No user-facing string touched | N/A | — |
| RLS / authorization / data path | No | No data path touched | N/A | — |
| Critical-flow regression | No | No `docs/critical-flow-registry.md` row covers grid column counts | N/A | — |

## 12. Acceptance criteria

- **AC1 [R1, R2, R8]** — *Given* the new script, *then* it asserts every §3.5 invariant with tables transcribed
  from the named source probe, is neutrally named, and is exposed as `check:homepage-grid` +
  `check:homepage-grid:verify`.
- **AC2 [R3, R4]** — *Given* `--verify-gate`, *then* the negative arm passes clean, and **each** of the six §I5
  plants makes the gate report **its own** invariant, with verbatim output quoted for all seven runs.
- **AC3 [R5]** — *Given* the workflow diff, *then* exactly two steps are added inside `rendered-proof` after
  `build-storybook`, and the file gains no job, no `playwright install`, and no `build-storybook`.
- **AC4 [R6, R7]** — *Given* `git status` and md5s, *then* the three probes and everything under `src/` are
  unchanged, and no plant survives.
- **AC5 [R9]** — `typecheck` 0; `check:stories` 0/127; `check:story-coverage` 15/15; `check:i18n` 2215×4;
  `check:design-tokens` 28/0/0; `vitest` no new failure; `check:file-integrity`/`check:mojibake` 0 after the
  records exist; `npm run build` exit 0 with the full 54-row route table.
- **AC6 [R10]** — session log exists and `docs/backlog.md` is updated in place at exactly 80 lines.

## 13. QA profile and verification plan

### 13.1 Profile

**`Q4 — Release/Critical Flow`**, selected for one reason: this task authors a blocking CI gate, and
agent-contract cl. 13 plus the owner's 2026-07-31 directive require planted-violation proof — here, **per
invariant**, not once for the gate as a whole.

**Not Q3.** No rendered surface changes and `src/` is untouched, so a visual matrix would prove nothing about this
diff. The gate's own per-invariant self-test is the stronger evidence and is what AC2 demands.

### 13.2 Gates

| Command | Expected |
|---|---|
| `node scripts/check-homepage-grid.mjs` | exit 0; cell counts agree with I1's probe output |
| `npm run check:homepage-grid:verify` — negative arm | all invariants PASS |
| `npm run check:homepage-grid:verify` — 6 plants | **each** trips its own invariant; verbatim output for each |
| `npm run typecheck` | 0 |
| `npm run check:stories` | 0 — 127 files |
| `npm run check:story-coverage` | 0 — 15/15 |
| `npm run check:i18n` | 0 — 2215×4 |
| `npm run check:design-tokens` | **28** / 0 / 0, unchanged |
| `npx vitest run` | no new failure |
| `check:file-integrity` / `check:mojibake` | 0 / 0 — after I9 |
| `npm run build` | **0 — hard gate**, full 54-row route table, run last |

## 14. Completion report contract

Session log at `docs/sessions/2026-08-01-task701-homepage-grid-invariants-gate.md`:

1. `Files Changed` table matching the real `git diff`. If a file is modified, say **modified** (Task 693 review F3).
2. I0 snapshot and the true final `git status --porcelain`, plus md5s for the three untouched probes.
3. R1–R10 mapped to AC1–AC6 with evidence.
4. The new script in full.
5. **All seven `--verify-gate` runs verbatim** — the negative arm plus one per invariant. This is the core
   deliverable; a summary of a plant is not proof of a plant.
6. The transcription table: each expected value, the probe it came from, and confirmation it was not re-derived.
7. The workflow diff, in full.
8. Every command with its actual exit code; the `npm run build` tail verbatim with the full 54-row route table.
9. Deviations, each with a reason.
10. Limitations — at minimum: that the gate measures the Storybook render, not the live route; that
    `SimilarListings` remains unmigrated by design; and that the three original probes are still on disk pending
    step 3.

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Sonnet
does not self-approve and does not run, emit, suggest, or delegate any mutating git command.

**Handoff:** execute from this saved path —
`tasks/kickoff_prompt_Task_701_Homepage_Grid_Invariants_CI_Gate.md` — under
`.claude/skills/execute-task/SKILL.md`.

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — the three source probes with their line counts and exact assertion semantics, the CI job shape with line numbers, the naming convention with its two in-repo precedents, the invariant table with authorities, and the six plants are all inline |
| Every primary requirement has a binary AC | **Yes** — R1–R10 → AC1–AC6 |
| Scope protects existing behavior and names what must not change | **Yes** — §8 plus R6/R7's read-only probes and `src/`, gated by AC4 |
| QA profile + rationale present | **Yes** — §13.1 Q4 with the per-invariant planted-violation rationale, and Q3 explicitly declined with a reason |
| Negative flows selected by applicability | **Yes** — §11, including the wrong-assertion-fires branch, the permanently-red branch, the loose-gap branch and the surviving-plant branch |
| Does not claim an uninspected command, file, test, or behavior | **Yes** — §3.1 is read from all three probes; §3.2/§3.3 quote `governance-pr.yml` line numbers and the two existing self-test steps; §3.5's values are transcribed from the probes and the Task 668/669 reviews |
| Gates prove the changed behavior | **Yes** — six independent plants plus a negative arm; no aggregate proof is accepted |
| Single active owner route | **Yes** — forks are only stop conditions: non-empty I0, a probe already failing at I1, a transcribed table disagreeing with the live render, a plant tripping the wrong assertion |
| Baselines account for task-created artifacts | **Yes** — I1 records the three probes' current output *before* anything is written, so the new gate cannot define its own baseline |
| Dirty-worktree handling | **Yes, declared** — §3.6 expects empty; anything else is a stop plus manifest |

**Known-risk note for the reviewer.** Three likely defects. First, **a wrapper instead of a port** — shelling out
to the three scripts satisfies the letter of "one gate" while keeping every problem the consolidation exists to
remove; A2 forbids it. Second, **an aggregate self-test** — proving "the gate goes red when the page is broken" is
much easier than proving six assertions each fire independently, and it is exactly the shortcut that let Tasks 669
and 666 ship ungated changes; AC2 requires seven separate verbatim runs. Third, **re-deriving the expected tables
from the current render** — the tables must come from the probes, because a value silently adopted from today's
render would encode a regression nobody is currently checking for as the new invariant.
