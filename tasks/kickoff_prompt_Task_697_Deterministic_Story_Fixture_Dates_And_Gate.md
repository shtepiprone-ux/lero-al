# Task 697 — Freeze wall-clock dates out of story fixtures, write the rule into §14, and gate it

## 1. Mode and task type

- **Mode:** implementation (Sonnet executor, via `.claude/skills/execute-task/SKILL.md`).
- **Primary task type:** Storybook / visual-proof governance — **new machine gate + the violations it catches**
  (`docs/rule-index.md` → "Storybook / Visual Proof").
- **Secondary types:** test-fixture determinism; rendered-gate reliability.
- **Origin:** Task 693 review finding **F9** (`P2`, 2026-07-30). Owner decision **D23** (2026-07-30) sets the scope.

> **Read this first.** This task deliberately **changes rendered pixels** on at least 32 enrolled cells — that is the
> point, not a regression. It replaces a date that silently changes every calendar day with a frozen one. The
> comparator is therefore *not* "no cells changed"; it is "0 FAIL, 0 verdict changes, and every changed cell is a
> story whose fixture date this task froze, with the diff confined to the date region."

---

## 2. Objective

1. Replace every wall-clock expression in story fixtures with a frozen constant, so a capture taken on any calendar
   day produces byte-identical PNGs.
2. Write the rule into `docs/storybook-governance.md` §14 — it is currently **folklore**: two files already believe
   they follow it, one cites "§14" for it, and §14 does not contain it (§3.4).
3. Add **`check:stories` Check 16** enforcing it, with planted-violation proof, and bump the `checksRan` assertion in
   the same task.
4. Re-baseline the rendered matrix and prove the change is confined to the date regions.

**Measured motivation.** Task 693's Q3 run burned a full diagnostic cycle on 32 cells that differed at max channel
delta **140** purely because the baseline was captured on 2026-07-29 and the new run on 2026-07-30: `"Jul 27, 2026"`
→ `"Jul 28, 2026"`. Reviewer confirmed it visually (`.screenshots/task693-delta/crop-base.png` /
`crop-new.png`) and by natural experiment — a same-day zero-code-diff control produced **zero** motion on those
stories, while the cross-day comparison produced 32 cells. Every future Q3 task hits this.

---

## 3. Verified context

Every fact below was read or executed in the worktree on branch `task/q0-ci-rendered-locale-split` on 2026-07-30,
after Task 693 was reviewed `APPROVED WITH NOTES`. Nothing is inferred from a filename or a prior report.

### 3.1 Owner decisions

| ID | Question | Ruling |
|---|---|---|
| **D6** (Task 684, standing) | `.screenshots/` visibility. | **Local-only** per `.gitignore:55`. |
| **D10** (Task 685 review, standing) | Comparator for non-target cells. | **0 verdict changes** + per-story attribution. |
| **D17 / D22** (Tasks 688 / 693 reviews, standing) | Sub-perceptual md5 motion. | Ratifiable when computed styles are identical, 0 verdict changes, and the delta is **≤ 2** *and* at or below the same-session zero-code-diff control floor. **Does not apply to this task's intended date-region changes**, which are large and deliberate. |
| **D23** (this task, 2026-07-30) | How far does the fix go? | **All three layers: freeze the fixtures, write the rule into §14, and gate it** — per §14's own stated principle that "prose rules that are not machine-enforced… do not survive" (§3.4). Follows the Task 685 precedent of shipping a gate together with the violations it catches. |

### 3.2 The complete wall-clock census — grep-verified

`grep -rn "Date.now()\|new Date()" src/stories/` returns **5 live sites in 4 files**, plus one comment and one
already-correct file:

| # | Site | Expression | Field |
|---|---|---|---|
| 1 | `src/stories/mantine/primitives/ListingCard.stories.tsx:84` | `new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)` | `created_at` |
| 2 | `src/stories/fixtures/cardListingData.fixture.ts:61` | `new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000)` | `created_at`, per generated card |
| 3 | `src/stories/fixtures/admin.fixtures.ts:331` | `new Date(Date.now() + 30 * 86_400_000)` | `expires_at` |
| 4 | `src/stories/fixtures/admin.fixtures.ts:376` | `new Date(Date.now() - 10 * 86_400_000)` | `expires_at` |
| 5 | `src/stories/mantine/primitives/NotificationBellView.stories.tsx:7` | `const NOW = new Date().toISOString()` | `created_at` for every fixture notification |

Two non-sites, both instructive:

- `src/stories/fixtures/admin.fixtures.ts:2` — the file docstring reads *"Typed admin story fixtures — deterministic,
  no `Date.now()`/random."* The file uses `Date.now()` twice, at `:331` and `:376`. **The docstring is false today**
  and must become true, not be deleted.
- `src/stories/mantine/primitives/RangeDatePicker.stories.tsx:79` — already correct, and its comment reads
  *"Fixed dates (no `Math.random()`/`new Date()` wall-clock in fixtures per Storybook governance §14)"*. It is the
  model to follow, and the source of the citation examined in §3.4.

### 3.3 Blast radius — which enrolled cells actually move

Consumers, traced by import (`grep -rln`), and their enrolment in the 1184-cell `--mantine-only` matrix:

| Fixture site | Consumers | Enrolled stories / cells |
|---|---|---|
| #1 `ListingCard.stories.tsx` | itself | `Mantine/Primitives/ListingCard/Default` — **16** |
| #2 `cardListingData.fixture.ts` | `HomepageListingGrids.stories.tsx`, `FeaturedListings`, `LatestListings`, `RecentlyViewedSection`, `SimilarListings` | `Patterns/Mantine/HomepageListingGrids/Default` — **16**; `…/Loading` — **16** (skeletons; may render no date — determine empirically, do not assume); the other 4 story files are **not** enrolled |
| #5 `NotificationBellView.stories.tsx` | itself | `Mantine/Primitives/NotificationBellView/Default` — **16** |
| #3/#4 `admin.fixtures.ts` | 10 `src/components/admin/*.stories.tsx` files | `Patterns/Mantine/AdminSurfacePattern/Default` — **16** (verify whether `expires_at` is rendered there at all) |

**Measured today:** exactly `ListingCard/Default` (16) and `HomepageListingGrids/Default` (16) drift across a day
boundary — 32 cells, max channel delta **140**, diff confined to a ~44–104-pixel patch on the card footer date, in
the same location in every locale and viewport. `HomepageListingGrids/Loading` appeared in Task 693's comparison only
at delta ≤2 inside the harness-noise set, consistent with skeletons rendering no date. Sites #3/#4/#5 have **not**
been observed to move a cell; they are in scope because they are the same defect class, not because they were caught.

### 3.4 The rule is folklore — it is cited but not written

`docs/storybook-governance.md` **§14** ("Enforceable Storybook gates", `:476`) is the authority for story governance.
Read in full at `:476-560`, it covers: 14.1 canvas/layout, 14.2 the locale-aware fixture/i18n layer, 14.3 machine
gates (ESLint + `check-stories.mjs` + `--assert`), 14.4 the proof rule and its sub-contracts.

**It contains no fixture-determinism rule.** `grep -n "determinist\|Math.random\|wall.clock" docs/storybook-governance.md`
returns only §14.9.4 (Mantine's auto-generated random *element IDs*, a different subject) and `:1109` (the component
catalog stamping `new Date()` into its own header). Nothing about wall-clock values in fixtures.

Yet two independent files already act as though the rule exists — `RangeDatePicker.stories.tsx:79` cites "§14" for it
by name, and `admin.fixtures.ts:2` asserts its own compliance. This is precisely the failure §14's own preamble
describes:

> *"prose rules that are not machine-enforced, and proof that is not machine-produced, do not survive."*

Here the rule was not even prose. **D23 requires writing it and gating it**, not just fixing the five sites.

### 3.5 `check:stories` — where Check 16 goes

`scripts/check-stories.mjs` currently returns `checksRan: 15` at `:1049`. Check 15 (unregistered Mantine colour,
Tasks 685/686) occupies `:856-…` and is the structural model to copy: a scoped file walk, a violation record per
site, and a `log('── Check N: … ───')` banner.

`scripts/__tests__/check-stories.test.ts:889-892` asserts `checksRan === 15` with a comment tracking its history
(14 pre-Task-685). **Task 685's precedent is binding: bump this assertion in the same task that adds the check** —
Check 14 drifted historically because that was not done.

`docs/storybook-governance.md:14.3` documents "`checksRan: 13`" and "13 governance checks" — **already stale by two**
(it predates Checks 14 and 15). Correct it to 16 as part of R3; do not leave a third drift.

### 3.6 Baseline

| Comparator | Value | Source |
|---|---|---|
| rendered matrix | `.screenshots/rendered-assert/2026-07-30T08-53/` — 1184 cells, 1162 pass, 0 fail, 22 ambiguous | Task 693, reviewer-verified |
| ambiguous set | Combobox 4 + `PopularLocationsView/Long City Name` 16 + Tabs 2 = **22** | reviewer re-derived from the manifest |
| `check:design-tokens` | **43 / 0 stale** | reviewer re-ran 2026-07-30 |
| `check:stories` | 0 violations, **127 files**, `checksRan: 15` | reviewer re-ran 2026-07-30 |
| `check:story-coverage` | 15/15 | reviewer re-ran 2026-07-30 |
| `check:i18n` | 2215 × 4 | reviewer re-ran 2026-07-30 |

**Harness noise floor, measured by the reviewer** on a zero-code-diff control pair (`09-26` vs `08-53`): 66 cells
move with no code change, per-story maxima `EmptyLoadingErrorState` **179**, `Button` **125**, `LocaleSwitcher` 57,
`MobileBottomNavView` 20, `HeroSearch/Fallback` 3, `Skeleton`/`FiltersPanelShell`/`HomepageListingGrids/Loading`/
`PopularLocationsView` 2. **Any cell in those stories is noise, not signal** — do not attribute it to this task.

### 3.7 Start state — clean

Task 693 was committed **and pushed** as `9caae02aa`
(`feat(Task693): overlay dual declaration @theme+:root (D19) …`), verified 2026-07-30; the branch was level with
`origin/task/q0-ci-rendered-locale-split` at that moment. **Expect a clean `git status --porcelain` at I0.** A
non-empty start state → **stop and report**: no approved work is pending, so anything present is unexplained and must
not be reconciled by assumption. Note that this task's own kickoff commit sits after `9caae02aa`, so `HEAD` will not
equal it; confirm `9caae02aa` is an ancestor instead.

---

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification |
|---|---|---|---|---|
| R1 | D23, §3.2 | All **5** wall-clock sites are replaced by frozen constants. `grep -rn "Date.now()\|new Date()" src/stories/` returns **only** comment lines, no live expression. Rendered dates are unchanged in *format* — only their value becomes fixed. | P0 | AC1 |
| R2 | §3.2 | `admin.fixtures.ts:2`'s "deterministic, no `Date.now()`/random" docstring becomes **true**; it is not deleted or weakened. | P1 | AC1 |
| R3 | D23, §3.4 | `docs/storybook-governance.md` §14 gains an explicit fixture-determinism rule naming the failure mode (cross-day PNG drift breaking the rendered gate), the required form (frozen ISO constants), and the gate that enforces it. §14.3's stale "13 checks / `checksRan: 13`" is corrected to **16**. | P1 | AC2 |
| R4 | D23, §3.5 | `check:stories` gains **Check 16**, flagging `Date.now()` / `new Date()` used as a *value* anywhere under the story scope. `checksRan` returns **16**, and `scripts/__tests__/check-stories.test.ts`'s assertion is bumped in this same task. | P0 | AC3 |
| R5 | cl. 13, §14.4 | **Planted-violation proof**: on the final tree the gate exits 0; re-introducing a wall-clock expression at a named site makes it exit non-zero with that exact site reported; reverting restores 0. Plus a **negative control**: an already-frozen constant and the `RangeDatePicker:79` comment must **not** be flagged. | P0 | AC4 |
| R6 | §3.3 | Rendered matrix: **0 FAIL, 0 verdict changes** across all 1184 cells; the ambiguous set stays 4/16/2 = 22. Every md5-changed cell is either (a) a story whose fixture this task froze, or (b) a story in §3.6's measured noise set. Any changed cell outside both is a **stop and report**. | P0 | AC5 |
| R7 | §3.3 | For each changed cell in group (a), a pixel-diff showing the diff region confined to the date text — no layout shift, no geometry change. Report the bounding boxes. | P0 | AC5 |
| R8 | §3.2 | The frozen dates keep every date-dependent affordance in its current state — in particular the `LISTING_NEW_DAYS` "new" badge (`docs/domain-rules.md:106`: visible when `Date.now() - created_at ≤ LISTING_NEW_DAYS × 86400000`). If freezing flips a badge on or off, **stop and report** before choosing a value. | P0 | AC6 |
| R9 | cl. 9, 7, 14 | `npm run build` exits 0; `typecheck`, `check:stories`, `check:story-coverage`, `check:i18n` (2215×4, zero new keys), `check:design-tokens` (43/0), `check:file-integrity`, `check:mojibake` all exit 0; `npx vitest run` shows no new failure attributable to this diff. | P0 | AC7 |

---

## 5. Assumptions and open questions

- **A1 — pixels are *supposed* to change here.** Unlike Tasks 688/690/693, a changed md5 on a date-bearing story is
  the intended outcome. What must not change: verdicts, geometry, the ambiguous set, and any story outside groups
  (a)/(b) of R6.
- **A2 — freeze, do not delete.** Every fixture keeps a `created_at`/`expires_at`; only the *source* of the value
  changes from wall-clock to constant. Removing the field, or making it `null`, changes what the component renders
  and is out of scope.
- **A3 — preserve relative relationships.** Site #2 generates `(i + 1)` days ago per card, so cards differ from each
  other; site #3 is +30 days (future/valid) and #4 is −10 days (past/expired). These relationships are load-bearing
  for what the stories demonstrate. Freeze them as an ordered set of constants relative to one **frozen "today"**,
  not as five unrelated literals.
- **A4 — pick the frozen anchor deliberately and state it.** Choose one project-wide constant "today" and derive
  every fixture date from it. It must satisfy R8. Record the value and the reason in the session log; if any
  candidate flips a badge, report before choosing.
- **A5 — do not touch production code.** Only `src/stories/**`, `scripts/check-stories.mjs`,
  `scripts/__tests__/check-stories.test.ts`, and `docs/storybook-governance.md` are in scope. No component, no
  `src/lib/**` date helper, no i18n message.
- **A6 — `HomepageListingGrids/Loading` and the admin/notification stories may not move at all.** §3.3 predicts only
  32 cells move. If more move, attribute them; if fewer, that is fine — but say which and why.
- **A7 — the start state may be dirty** with Task 693's approved-but-uncommitted files (§3.7). Snapshot
  `git status --porcelain` first and classify every entry; do not stage or edit them.

**Open questions — none.** D23 settles scope. The one genuinely undetermined value (the frozen anchor) is chosen
inside the single route under A4's stated constraint, with an explicit stop condition in R8.

---

## 6. Pre-read rule bundle

1. `docs/agent-contract.md` — clauses 1, 7, 9, 12, 13, 14.
2. `docs/rule-index.md` — "Storybook / Visual Proof".
3. `docs/qa-profiles.md` — the **Q4** row (a new gate is being authored) and the viewport policy section.
4. `docs/storybook-governance.md` — **§14 in full (`:476-560`)**, plus `:1100-1140` (the catalog's own
   `new Date()` finding, the nearest existing precedent for this defect class).
5. `docs/qa-rules.md` — validation and encoding rules.
6. `docs/domain-rules.md` — **`:100-115`** (`LISTING_NEW_DAYS`, R8's constraint).
7. `docs/backlog.md` — the numbering line; **exactly 80 lines**, must not grow.

**Source pre-read**

8. All five sites in §3.2, each with surrounding context: `ListingCard.stories.tsx:70-95`,
   `cardListingData.fixture.ts:40-70`, `admin.fixtures.ts:1-10, :320-340, :365-385`,
   `NotificationBellView.stories.tsx:1-25`.
9. `src/stories/mantine/primitives/RangeDatePicker.stories.tsx:75-90` — the **model** for a correctly frozen fixture.
10. `scripts/check-stories.mjs` — **:856-900** (Check 15's structure, the model for Check 16) and **:1040-1050**
    (the `checksRan` return).
11. `scripts/__tests__/check-stories.test.ts` — **:880-895** (the `checksRan` assertion and its history comment).
12. `docs/sessions/2026-07-30-task693-overlay-dual-declaration.md` — **§4** (the measured 216-cell breakdown, the
    noise set, and the date-fixture diagnosis this task acts on).

---

## 7. Scope

| Path | Action | Why |
|---|---|---|
| `src/stories/mantine/primitives/ListingCard.stories.tsx` | modify | R1 site #1 |
| `src/stories/fixtures/cardListingData.fixture.ts` | modify | R1 site #2 |
| `src/stories/fixtures/admin.fixtures.ts` | modify | R1 sites #3/#4, R2 |
| `src/stories/mantine/primitives/NotificationBellView.stories.tsx` | modify | R1 site #5 |
| `scripts/check-stories.mjs` | modify | R4 — Check 16, `checksRan` 15→16 |
| `scripts/__tests__/check-stories.test.ts` | modify | R4 — bump the assertion in the same task |
| `docs/storybook-governance.md` | modify | R3 — write the rule, fix the stale check count |
| `docs/backlog.md` | modify | Update 697's state. **Stay at 80 lines.** |
| `docs/sessions/2026-07-30-task697-deterministic-fixture-dates.md` | **create** | Session log per §14 |

Evidence under `.screenshots/task697-delta/`; `.screenshots/rendered-assert/2026-07-30T08-53/` is a **read-only
baseline**.

---

## 8. Out of scope

- **Any production component, date helper, or i18n message** (A5). If a fixture cannot be frozen without a
  production change, **stop and report**.
- **The 4 non-enrolled consumers of `cardListingData`** (`FeaturedListings`, `LatestListings`,
  `RecentlyViewedSection`, `SimilarListings`) — they inherit the frozen fixture automatically; no edit, no separate
  proof.
- **Other non-determinism classes** — `Math.random()`, Mantine auto-generated IDs (§14.9.4), the component catalog's
  own `new Date()` header stamp (`storybook-governance.md:1109`). Check 16 targets wall-clock *values in fixtures*
  only. Widening it is a follow-up if the gate proves useful.
- **Tasks 689, 691, 692, 694, 695, 696** — unaffected and untouched.
- **Re-running or re-litigating Task 693's D22 ratification.**
- **Any mutating Git command.**

---

## 9. Current and required behavior

**Current.** Five story fixtures compute dates from the wall clock at render time. `ListingCard` shows a listing
created "2 days ago", `cardListingData` staggers cards at 1…N days ago, `admin.fixtures` marks one record valid
(+30d) and one expired (−10d), and `NotificationBellView` stamps every notification "now". The rendered PNGs
therefore encode the capture date: a baseline taken on one calendar day and a run taken on the next differ on 32
enrolled cells at max channel delta 140, entirely in the card-footer date text. The rule against this is cited in two
files but written in none, and no gate enforces it. Task 693 lost a full diagnostic cycle to it.

**Required after.** Every fixture date derives from one frozen, documented anchor constant, preserving the relative
offsets each story depends on (staggered cards, valid vs expired, "now" for notifications) and preserving every
date-dependent affordance including the `LISTING_NEW_DAYS` badge. Two captures taken on different calendar days from
the same tree produce byte-identical PNGs. The rule is written into §14, `check:stories` Check 16 fails the build on
any new wall-clock fixture value, `checksRan` reports 16 with its unit assertion bumped in the same task, and §14.3's
stale check count is corrected. No production code, component behaviour, or locale string changes.

---

## 10. Implementation requirements

**I0 — start protocol (before any write).** `git status --porcelain`; record verbatim — **expect empty** (§3.7).
Any entry → **stop and report**. Confirm `9caae02aa` (Task 693) is an ancestor of `HEAD`
(`git log --oneline | grep 9caae02aa`) and quote `git log -1 --oneline`.

**I1 — baseline gates on the untouched tree.** Record actual output for `npm run check:stories` (expect 0, 127
files, `checksRan: 15`), `npm run check:design-tokens` (**43 / 0 stale**), `npm run check:story-coverage` (15/15),
`npm run check:i18n` (2215×4). Also record the **full census**:
`grep -rn "Date.now()\|new Date()" src/stories/` — expect §3.2's 5 live sites plus the 2 comment lines. A sixth live
site → **stop and report**; the census is then wrong and must not be patched over.

**I2 — choose and record the frozen anchor (R8, A4).** Pick one constant "today", derive all five sites' values from
it preserving §3.2's offsets, and **before writing any fixture**, verify against `docs/domain-rules.md:106` that the
chosen `created_at` values keep the `LISTING_NEW_DAYS` badge in exactly its current state for every affected story.
Record the anchor, each derived value, and the badge check. If any value flips a badge, **stop and report** rather
than picking a different anchor silently.

**I3 — freeze the five sites (R1, R2).** Follow `RangeDatePicker.stories.tsx:79`'s model: a named constant with a
comment stating why it is frozen and citing Task 697 / §14. Make `admin.fixtures.ts:2`'s docstring true.

**I4 — write the rule (R3).** Add the fixture-determinism rule to `docs/storybook-governance.md` §14 as a numbered
sub-section alongside 14.1–14.4: the failure mode (cross-day PNG drift silently breaking the rendered gate, with
Task 693's 32-cell / delta-140 incident as the worked example), the required form, and the gate that enforces it.
Correct §14.3's "13 governance checks" / "`checksRan: 13`" to **16**.

**I5 — add Check 16 (R4).** Model it on Check 15's structure (`:856-…`). Flag `Date.now()` and `new Date()` used as
a **value** under the story scope; do not flag them inside comments, and do not flag `new Date(<literal>)` forms that
are already deterministic. Return `checksRan: 16`. Bump
`scripts/__tests__/check-stories.test.ts`'s assertion **in this task**.

**I6 — planted-violation proof (R5), all four steps quoted.**

1. **Clean run.** `npm run check:stories` on the final tree → exit **0**, 127 files, `checksRan: 16`.
2. **Plant.** Re-introduce a wall-clock expression at one named site (file edit, **no git**). Re-run → exit
   **non-zero**, and the reported violation names **that exact file and line**. Quote the output.
3. **Revert and re-run** → exit 0 again. Quote it.
4. **Negative controls — the gate must stay silent on all of these:** an already-frozen constant (e.g. the value you
   wrote at site #1), `RangeDatePicker.stories.tsx:79`'s *comment* mentioning `new Date()`, and a deterministic
   `new Date('2026-01-01T00:00:00.000Z')` literal. A gate that flags these is over-broad — **stop and report**.

**I7 — rendered proof (R6, R7).** `npm run build-storybook`, then
`npm run screenshots:assert -- --mantine-only`, compared against `.screenshots/rendered-assert/2026-07-30T08-53/`:

1. All 1184 cells: **0 FAIL, 0 verdict changes**; ambiguous set still 4/16/2 = 22.
2. Partition every md5-changed cell into (a) frozen-fixture stories, (b) §3.6's measured noise stories. **Any cell in
   neither is a stop and report.** Quote the partition with counts per story.
3. For every group-(a) cell, a pixel-diff with diff-pixel count, bounding box and max channel delta. **The bounding
   box must be confined to the date region** — a box spanning card geometry means a layout shift, which is a
   **stop and report**. Scan the full group, never a sample (Task 688 review F4).
4. Persist under `.screenshots/task697-delta/`.

**I8 — token and gate checks (R9).** `npm run check:design-tokens` (43 / 0 stale), `npm run typecheck`,
`npm run check:story-coverage`, `npm run check:i18n`, `npx vitest run`. For vitest: the documented full-run-only
timeout set is `date-format-ssr-parity`, `RangeDatePicker`, `saveSavedSearch.dedup`, and **which two of the three
time out varies by run** (Task 688 review F8) — report the pair observed plus an isolated re-run of exactly those
files. The `check-stories` unit suite must pass with the bumped assertion.

**I9 — `npm run build` runs last** and must exit 0. Quote the transcript tail **including the route table**.

**I10 — records, then encoding gates.** Session log per §14; update `docs/backlog.md` in place (**80 lines**; flag
`BACKLOG LIMIT BREACH` if you cannot). Then `check:file-integrity` and `check:mojibake` **after** the records exist;
quote the file counts.

**Order of operations:** I0 → I1 → I2 → I3 → I4 → I5 → I6 → I7 → I8 → I9 → I10.

---

## 11. Positive and negative flows

### Positive flow

A reviewer captures the `--mantine-only` matrix today and another captures it three weeks later from the same commit.
The PNGs are byte-identical: `ListingCard`'s footer shows the same frozen date, the homepage grid's cards keep their
staggered order, the admin fixtures still read valid-vs-expired, and the notification list still reads as "now"
relative to its own frozen anchor. A developer who adds `created_at: new Date()` to a new fixture has the build fail
with the file and line named, before it can reach a baseline.

### Negative-flow applicability table

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| **Cross-day capture** | **Yes** | F9, §3.3 | Byte-identical PNGs — the whole objective | AC5 |
| **A new wall-clock fixture is added** | **Yes** | R4, R5 | Check 16 fails, naming file and line | AC4 |
| **The gate is over-broad** | **Yes** | I6.4 | Frozen constants, comments and literal `new Date('…')` must NOT flag | AC4 |
| **`LISTING_NEW_DAYS` badge flips** | **Yes** | `domain-rules.md:106`, R8 | Frozen values keep every badge in its current state; a flip is a stop | AC6 |
| **Relative offsets collapse** | **Yes** | A3 | Staggered cards stay staggered; valid stays valid, expired stays expired | AC1, AC5 |
| **Layout shift from a different-width date string** | **Yes** | R7 | Diff bbox confined to the date region; a geometry-spanning box is a stop | AC5 |
| **A story outside groups (a)/(b) moves** | **Yes** | R6 | Stop and report — unexplained motion is not accepted as noise by default | AC5 |
| **Harness noise mistaken for signal** | **Yes** | §3.6 | Attribute against the reviewer's measured control set (up to delta 179 on `EmptyLoadingErrorState`) | AC5 |
| **Non-enrolled consumers** | **Yes** | §8 | Inherit the frozen fixture; no edit, no separate proof | AC1 |
| **All four locales** | **Yes** | cl. 7 | Date *format* is locale-dependent and unchanged; zero new keys | AC5, AC7 |
| **Small viewport (<640)** | **Yes** | cl. 11, 12 | Date region only; `noHorizontalOverflow` stays true at 320/375/390 | AC5 |
| Validation / authorization / RLS | No | Story fixtures only; no data path, write, or permission boundary | N/A | — |
| Critical-flow regression | No | No `docs/critical-flow-registry.md` row covers story fixtures | N/A | — |
| RTL | No | Project has no RTL locale | N/A | — |

---

## 12. Acceptance criteria

- **AC1 [R1, R2]** — *Given* the final tree, *then* `grep -rn "Date.now()\|new Date()" src/stories/` returns **no
  live expression** (comment lines only), all five sites hold frozen constants derived from one documented anchor
  preserving §3.2's offsets, and `admin.fixtures.ts:2`'s determinism docstring is true. Quote the grep and all five
  before/after lines.
- **AC2 [R3]** — *Given* `docs/storybook-governance.md`, *then* §14 contains a fixture-determinism sub-section naming
  the failure mode, the required form and the enforcing gate, citing Task 693's incident; and §14.3 reads **16**
  checks, not 13.
- **AC3 [R4]** — *Given* `npm run check:stories` on the final tree, *then* it exits 0 with 127 files and
  `checksRan: 16`, and `scripts/__tests__/check-stories.test.ts` asserts 16 and passes.
- **AC4 [R5]** — *Given* I6's four steps, *then* clean = exit 0; planted = exit non-zero naming the exact file and
  line; reverted = exit 0; and **all three negative controls stay unflagged**. Quote every transcript.
- **AC5 [R6, R7]** — *Given* a fresh `build-storybook` + `--mantine-only` run vs `2026-07-30T08-53`, *then* 1184
  cells show **0 FAIL, 0 verdict changes**, the ambiguous set is 4/16/2 = 22, every md5-changed cell is partitioned
  into frozen-fixture or measured-noise with counts per story and none outside both, and every frozen-fixture cell
  has a persisted pixel row whose **bounding box is confined to the date region**.
- **AC6 [R8]** — *Given* I2's record, *then* the chosen anchor and every derived value are quoted, with an explicit
  `LISTING_NEW_DAYS` check per affected story showing the badge state is unchanged.
- **AC7 [R9]** — `npm run build` exits 0 on a fresh transcript (quote the tail **including the route table**);
  `typecheck` 0, `check:design-tokens` 43/0, `check:story-coverage` 15/15, `check:i18n` 0 at 2215×4 with zero new
  keys, `check:file-integrity`/`check:mojibake` 0 **after** the records exist (quote counts), and `vitest` with no
  new failure beyond the documented run-varying pair.

---

## 13. QA profile and verification plan

### 13.1 Profile

**`Q4 — Gate authoring`**, per `docs/qa-profiles.md`: this task adds a new build-failing `check:stories` check, which
requires planted-violation proof (cl. 13, §14.4). It is not `Q3` — Q3 would cover the rendered re-baseline but not
the gate. It carries the full Q3 rendered matrix **in addition**, because the fixture change deliberately moves
enrolled pixels.

**Declared proof path.** `--mantine-only` over the 67 enrolled stories / 1184 cells at 4 locales × 7 viewports
(320/375/390/1024/1200/1440/1536), plus I6's four-step gate proof including three negative controls. Remaining
canonical widths stay **Task 678's** scope.

**Known limitation to record, not fix.** The rendered gate cannot prove "no longer drifts across days" directly —
that would need a clock the harness does not control. The objective is proven structurally instead: the fixture
values are literal constants (AC1), the gate blocks regressions (AC4), and the rule is written (AC2). State this
plainly in the session log rather than implying a cross-day capture was performed.

**TailAdmin side-by-side: not required.** No visual value changes; only the data a fixture renders.

### 13.2 Worktree

May start dirty with Task 693's approved files (§3.7). Snapshot `git status --porcelain` at I0 and classify every
entry; `EXCLUDED AS UNRELATED` entries are neither edited nor staged. Anything unexpected → **stop and report**.

### 13.3 Gates

| Command | Expected |
|---|---|
| census `grep -rn "Date.now()\|new Date()" src/stories/` (before / after) | 5 live sites + 2 comments / **comments only** |
| `npm run check:stories` (before / after) | 0, 127 files, `checksRan` **15** / **16** |
| I6 planted violation | exit non-zero, exact file+line named |
| I6 revert | exit 0 |
| I6 negative controls ×3 | **unflagged** |
| `npx vitest run` — `check-stories.test.ts` | passes with the bumped `checksRan: 16` assertion |
| `npm run check:design-tokens` | **43 / 0 stale** |
| `npm run typecheck` | 0 |
| `npm run check:story-coverage` | 0 — 15/15 |
| `npm run check:i18n` | 0 — 2215×4, zero new keys |
| `npm run build-storybook` | 0 |
| `npm run screenshots:assert -- --mantine-only` | 0 FAIL, 0 verdict changes, ambiguous 22; every changed cell partitioned and every frozen-fixture cell's bbox confined to the date region |
| `npm run check:file-integrity` / `check:mojibake` | 0 / 0 — **run after I10** |
| `npm run build` | **0 — hard gate**, route table quoted, run last |

---

## 14. Completion report contract

Session log at `docs/sessions/2026-07-30-task697-deterministic-fixture-dates.md`:

1. `Files Changed` table matching the real `git diff`, scoped to §7, with every `EXCLUDED AS UNRELATED` start entry
   listed and shown untouched.
2. The I0 snapshot and the **true final** `git status --porcelain`, taken after the records are written.
3. R1–R9 mapped to AC1–AC7 with evidence.
4. The before/after census grep, and all five sites' before/after lines.
5. **The frozen anchor**: its value, why it was chosen, every derived value, and the `LISTING_NEW_DAYS` badge check
   per affected story.
6. The §14 rule text as added, and the §14.3 check-count correction.
7. **The full I6 gate proof** — clean, planted (with the exact reported file+line), reverted, and all three negative
   controls.
8. The 1184-cell comparison: the changed-cell partition with counts per story, and the **full** per-cell pixel table
   for every frozen-fixture cell including bounding boxes.
9. Every command with its **actual** exit code; the `npm run build` tail quoted verbatim including the route table.
10. Deviations, each with a reason.
11. Limitations — at minimum: the 7-width proof path; that cross-day drift is proven **structurally, not by a
    cross-day capture** (§13.1); that other non-determinism classes are out of scope (§8); and that `.screenshots/`
    evidence is local-only per D6.

**Status vocabulary.** `IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Sonnet
does not self-approve and does not run, emit, suggest, or delegate any mutating git command, including clearing
`.git/index.lock`.

**Handoff:** execute from this saved path —
`tasks/kickoff_prompt_Task_697_Deterministic_Story_Fixture_Dates_And_Gate.md` — under
`.claude/skills/execute-task/SKILL.md`.

---

## 15. Task quality gate

| Check | Result |
|---|---|
| Executable by a fresh Sonnet session with no chat context | **Yes** — every site, line number, consumer, cell count, command and owner ruling is inline |
| Every primary requirement has a binary AC | **Yes** — R1–R9 → AC1–AC7 |
| Scope protects existing behavior and names what must not change | **Yes** — §8, incl. all production code, the 4 non-enrolled consumers, the other non-determinism classes, and Task 693's ratification |
| QA profile + canonical decision record present | **Yes** — §13.1 Q4 with the not-Q3 reason and the explicit "cannot prove cross-day directly" limitation; §16 |
| Negative flows selected by applicability | **Yes** — §11, incl. the over-broad-gate branch and the badge-flip branch, each with a stop condition |
| Does not claim an uninspected command, file, test, or behavior | **Yes** — §3.2 is a grep census, §3.3 traces consumers by import and cell counts from the real manifest, §3.4 quotes the governance doc and the failed grep for the missing rule, §3.5 quotes the real `checksRan` and the real unit assertion, §3.6 is the reviewer's measured control |
| Gates prove the changed behavior | **Yes** — a planted-violation proof with **three negative controls** (the over-broad-gate failure mode), a bbox-constrained pixel comparison rather than a bare md5 count, and a partition that stops on any unexplained cell |
| Single active owner route | **Yes** — forks are only stop conditions: I0 unexpected path, I1 sixth census site, I2 badge flip, I6 over-broad gate, I7 unexplained cell or geometry-spanning bbox |
| Baselines account for task-created artifacts | **Yes** — `.screenshots/task697-delta/` is task-created with no prior baseline; `2026-07-30T08-53` is read-only |
| Dirty-worktree handling | **Yes** — §3.7 / §13.2 classify Task 693's approved files as `EXCLUDED AS UNRELATED` with an explicit stop for anything else |

**Known-risk note for the reviewer.** Five likely defects. First, **an over-broad Check 16** that flags comments,
frozen literals, or `new Date('<iso>')` — I6.4's three negative controls exist solely to catch this, and a gate that
fails them is worse than no gate. Second, **forgetting the `checksRan` unit assertion**, repeating Check 14's
historical drift that Task 685 explicitly corrected. Third, **flattening the relative offsets** — freezing all five
sites to the same instant would destroy the staggered-cards and valid-vs-expired distinctions the stories exist to
show (A3). Fourth, **an anchor that silently flips the `LISTING_NEW_DAYS` badge**, changing what the story
demonstrates while the pixel diff still looks date-shaped (R8). Fifth, **accepting any changed cell as "noise"** —
§3.6 gives the measured noise set, and anything outside it plus the frozen-fixture set is a stop, not a judgement
call.

---

## 16. Visual source map

| Visible artifact/state | Component/markup | Source of the value | Disposition | Evidence |
|---|---|---|---|---|
| Listing card footer date | `ListingCard` via `ListingCard.stories.tsx:84` | `Date.now() - 2d` → **frozen constant** | **changed value, same format/geometry** | AC1, AC5 |
| Homepage grid card dates ×N | `HomepageListingGrids` via `cardListingData.fixture.ts:61` | `Date.now() - (i+1)d` → **frozen, offsets preserved** | **changed value, same format/geometry** | AC1, AC5 |
| Homepage grid loading state | `HomepageListingGrids/Loading` | skeletons; predicted to render no date | **expected unchanged — verify, do not assume** | AC5 |
| Notification timestamps | `NotificationBellView` via `:7` `NOW` | `new Date()` → **frozen anchor** | **changed value, same format** | AC1, AC5 |
| Admin valid/expired records | 10 `src/components/admin/*.stories.tsx` via `admin.fixtures.ts:331/376` | `Date.now() ± Nd` → **frozen, valid/expired preserved** | **changed value; enrolled only via `AdminSurfacePattern`** | AC1, AC5 |
| "New" listing badge | `ListingCard` | `LISTING_NEW_DAYS` vs `created_at` (`domain-rules.md:106`) | **state must be identical — a flip is a stop** | AC6 |
| `RangeDatePicker` fixed dates | `RangeDatePicker.stories.tsx:79-83` | already frozen literals | **untouched — the model, and a negative control** | AC4 |
| Date format per locale | `formatListingDate` etc. | production helper | **out of scope, untouched** | A5, §8 |

## 17. Canonical UI decision record

| Visible artifact | Search queries and inspected paths | Canonical source | Disposition | Shared path |
|---|---|---|---|---|
| Story fixture dates | `grep -rn "Date.now()\|new Date()" src/stories/` (5 live sites + 2 comments, all read); traced every consumer by `grep -rln`; cross-referenced each against the real 1184-cell manifest for enrolment and cell counts | `RangeDatePicker.stories.tsx:79-83` — the only already-correct frozen fixture in the tree, and the file that cites the rule by name | **reuse its pattern** — named frozen constant + comment citing the governance section | one documented anchor constant, all five sites derived from it (A3/A4) |
| The determinism rule | read `docs/storybook-governance.md` §14 in full; `grep` for `determinist`/`Math.random`/`wall.clock` → only §14.9.4 (element IDs) and `:1109` (catalog header) | **none — the rule does not exist** despite being cited at `RangeDatePicker:79` and asserted at `admin.fixtures.ts:2` | **create** — new §14 sub-section + Check 16 | `docs/storybook-governance.md` §14, `scripts/check-stories.mjs` |

**Clause 16c note.** No Mantine component, prop, DOM shape or style changes. The canonical stories for the affected
surfaces already render the real production components and need no structural edit — only the *data* their fixtures
supply changes, which is the subject of the task.

## 18. Rule-compliance ledger

| Rule source and clause | Applicability evidence | Exact mandatory outcome | Evidence artifact | Result |
|---|---|---|---|---|
| cl. 1 (scope bounded) | 4 fixture files + 2 script files + 2 docs | No production code touched; the 4 non-enrolled consumers inherit without edit | §7, §8, A5 | required |
| cl. 3/5 (capabilities and UX flows intact) | Date-bearing stories | Every date-dependent affordance keeps its state, incl. the `LISTING_NEW_DAYS` badge | R8, AC6 | required |
| cl. 7 (four locales) | Rendered surfaces | Zero new keys; parity 2215×4; date *format* per locale unchanged | AC5, AC7 | required |
| cl. 9 (validation evidence) | Non-Q0 | `npm run build` exit 0, fresh transcript + route table | AC7 | required |
| cl. 11 (mobile/overlay protected) | In-scope UI below 640px | Date region only; `noHorizontalOverflow` true at 320/375/390 | AC5 | required |
| cl. 12 (rendered evidence follows risk) | Q4 + full Q3 matrix | 0 FAIL, 0 verdict changes; every changed cell partitioned; bbox confined to the date region | AC5 | required |
| cl. 13 (Storybook gates enforceable) | **A new build-failing gate is authored** | Planted-violation proof + 3 negative controls; `checksRan` 16 with its unit assertion bumped in the same task | AC3, AC4 | required |
| cl. 14 (file integrity) | 8 modified + 1 created text file | UTF-8 no BOM, no mojibake, scanned set includes the records | AC7 | required |
| cl. 15 (critical flows) | **No registry row** covers story fixtures | Not applicable — explicit negative, not silence | §11 | N/A, declared |
| cl. 16/16a (TailAdmin visual source) | No visual value introduced | Only fixture data changes; no side-by-side needed | §13.1 | required |
| cl. 16b (canonical provenance before code) | 8 artifacts mapped | Canonical search recorded; `RangeDatePicker` reused as the pattern; the rule created because none existed | §16, §17 | required |
| cl. 16c (canonical Story cannot be bypassed) | Enrolled stories change rendered data | Stories render the real components and need no structural edit; their cells are the acceptance evidence | §17, AC5 | required |
| cl. 10 (git ownership) | Possibly dirty start | §3.7 classification; diff limited to §7; no mutating Git by the executor | A7, §13.2 | required |

## 19. Execution contract

| Field | Value |
|---|---|
| Task | 697 |
| Active route / owner decision | Single route: freeze all 5 wall-clock fixture sites to constants derived from one documented anchor preserving their relative offsets, write the missing determinism rule into `storybook-governance.md` §14, add `check:stories` Check 16 with a planted-violation proof and 3 negative controls, bump `checksRan` and its unit assertion, then re-baseline the rendered matrix proving 0 verdict changes and date-region-confined diffs (owner **D23**, 2026-07-30, from Task 693 review finding **F9**; **D10** sets the verdict comparator; **D6** governs `.screenshots/`) |
| Decision source, date, scope | Owner, 2026-07-30, after Task 693's Q3 run lost a diagnostic cycle to 32 cross-day cells at delta 140; scope = 4 fixture files + `check-stories.mjs` + its test + `storybook-governance.md` + records; **no** production code |
| Starting worktree mode | May be dirty with Task 693's approved files — classified `EXCLUDED AS UNRELATED` at I0, with an explicit stop for anything else (§3.7, §13.2) |
| Producer of each checkpoint | I0 snapshot + classification → baseline gates + census → anchor choice + badge check → 5 sites frozen → §14 rule written → Check 16 + `checksRan` + test bumped → **4-step gate proof incl. 3 negative controls** → storybook + `--mantine-only` 1184-cell partition + bbox pixel table → design-tokens/typecheck/coverage/i18n/vitest → build → records → post-records encoding gates |
| Persisted result | I0/final porcelain snapshots; before/after census; the anchor record + badge check; the §14 diff; the full 4-step gate transcript; the 1184-cell partition and per-cell bbox pixel table under `.screenshots/task697-delta/`; every gate transcript; build tail with route table; session log |
| Comparator | census after = **comments only**; `check:stories` 0/127/`checksRan: 16`; planted → non-zero naming the exact file+line, reverted → 0, all 3 negative controls **unflagged**; 1184 cells **0 FAIL / 0 verdict changes**, ambiguous **4/16/2 = 22**, every changed cell in {frozen-fixture, measured-noise} and none outside; every frozen-fixture cell's bbox confined to the date region; `design-tokens` **43 / 0 stale**; `story-coverage` 15/15; `i18n` 2215×4 |
| Failure path | Unexpected start path → stop; a 6th census site → stop, do not patch over it; an anchor that flips a `LISTING_NEW_DAYS` badge → stop before choosing; a gate that flags any negative control → stop, over-broad; a changed cell outside both partitions, or a bbox spanning card geometry → stop and report; a fixture that cannot be frozen without a production change → stop (A5) |
| Zero/empty input case | The post-fix census legitimately returns **zero live sites** — that is the success state, so the comparator must distinguish "grep ran and found only comments" from "grep never ran"; quote the command and its full output both times. Likewise the md5-changed set for a *noise* story may legitimately be empty on a given run; record "0 changed cells" for it rather than omitting the row |
| Task-created artifacts in baselines | `.screenshots/task697-delta/` is task-created with no prior baseline. `.screenshots/rendered-assert/2026-07-30T08-53/` is a **read-only** input captured before this change; it must not be regenerated, or the cross-day diff this task exists to eliminate would be silently erased from the comparison |
