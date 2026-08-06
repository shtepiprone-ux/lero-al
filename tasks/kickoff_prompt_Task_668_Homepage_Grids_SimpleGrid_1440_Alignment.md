# Kickoff — Task 668: Homepage Featured/Latest grids → Mantine `SimpleGrid`, aligned on `xxl = 1440px`

> Saved implementation kickoff. A fresh Sonnet session must be able to execute this without any chat context.
> Execute via `.claude/skills/execute-task/SKILL.md`. Strongest valid completion status is
> `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` — never self-approve.
>
> **Revision 2 (2026-07-26)** after owner review returned `NEEDS REVISION` on revision 1. Two blockers fixed:
> (1) AC9 demanded evidence `screenshots:assert` cannot produce → narrowed AC9 plus a dedicated
> `scripts/task668-qa-grid-1440.mjs`; (2) manifest enrolment is no longer deferred to review — a new canonical
> `Patterns/Mantine/*` story enrols both Views in this same diff, with no retitling of the existing `System/*`
> stories. Three wording/accuracy fixes also applied (§10.6 imports, §7 exact story lines, §13 `InlineStyles`).
>
> **Revision 3 (2026-07-26)** after owner review returned `NEEDS REVISION` on revision 2 — the QA plan could not be
> executed without false failures. Five P0 fixes: (1) `task668-qa-grid-1440.mjs` split into `--baseline` / `--verify`
> modes with a stable baseline path and a **dual locator**, because the same script must run before the migration
> exists (§10.10, R13); (2) `task420-qa-grid-step.mjs` also needs its **locator** changed, not just its expected
> table — it currently finds the grid by hardcoded Tailwind tokens (§3.9, §10.9, R12); (3) the canonical story's
> filename/title/exports are now **fixed**, with `--default` in `ASSERT_STORIES` and `--loading` in
> `LOADER_ALLOWLIST` (§10.11, R15); (4) ~~AC9/AC13 are now **manifest-delta** criteria~~ **[superseded by revision 4 —
> only AC9 is manifest-delta; AC13 is `exit 0` / `0 FAIL`]** — the full run cannot exit 0
> against a 219-FAIL historical baseline, and `check:locale-leak:mantine-only` is `continue-on-error` in CI
> (§3.10, R14); (5) `npm run build-storybook` is now explicit before **every** harness capture (§13, R16).
>
> **Revision 4 (2026-07-26)** after owner review returned `NEEDS REVISION` on revision 3. Two P0 fixes: (1) Phase A
> invoked `task668-qa-grid-1440.mjs --baseline` on an "unchanged tree", but this task **creates** that script — a new
> **Phase A0** now writes the harness alone (nothing else) before the baseline is captured (§13); (2) AC13 wrongly
> applied the full run's delta logic to `--mantine-only`, which is a separate, hard-blocking run that skips the legacy
> and geometry phases and has a **`0 FAIL` baseline** — it is now held to **exit 0 / 0 FAIL**, with locale-leak split
> into AC13b as the delta-only, non-blocking check (§3.10). Two minor fixes: `R1–R14` → `R1–R16` in §14/§15, and the
> four Storybook doc strings must be **rewritten as `SimpleGrid` prop descriptions** rather than having `2xl` swapped
> for `xxl`, which would invent a non-existent Tailwind class (§7).
>
> **Revision 5 (2026-07-26)** after owner review returned `NEEDS REVISION` on revision 4. One P0: Phase A0's exit
> criterion demanded that `git status` show only the harness path(s) — impossible in this worktree, which carries
> many pre-existing Task 665/666 modified/untracked paths, and dangerous because it could push the executor into
> `git clean`/`git restore` on someone else's uncommitted work. A0 now snapshots `git status --porcelain` first and
> asserts only that the **delta** contains the harness path(s) (§13 A0.0/A0.1b). Two consistency fixes: §14 no longer
> calls `--mantine-only` a manifest-delta check (it is `exit 0` / `0 FAIL`; before/after is informative only), and
> §15's stale revision-3 claim that AC13 is a manifest-delta criterion is withdrawn.
>
> **Revision 6 (2026-07-26)** after owner review returned `NEEDS REVISION` on revision 5. One P0: R7/R8/AC7 cited
> repo-wide `git diff` as the proof that card props, skeleton counts, the empty branch, and `t()` keys are unchanged
> — but **both target Views are untracked** (Task 665 is uncommitted), so `git diff` emits nothing for exactly the
> two files this task edits, and an executor would read that empty output as "no unintended change". New **§3.11**
> requires a Phase-A0 content snapshot of both Views into the ignored QA-artifact directory and a
> `git diff --no-index` file-to-file comparison afterwards (§13 A0.1a, step 10b); R7/R8/AC7 now cite that mechanism,
> with ordinary `git diff` retained only for the tracked paths.
>
> **Revision 7 (2026-07-27)** after orchestrator review returned `NEEDS REVISION` on the revision-6 implementation.
> Three P2 and two P3 findings, **all evidence/specification defects — no product-code defect was found.** The six
> render branches, both harnesses, the canonical story, and the migration-scope enrolment were all verified against
> real artifacts, and the owner-native `tsc` / `build` / `governance:screenshots` / `governance:components` gates all
> returned exit 0. Only the deltas below are re-opened; everything else in revisions 1–6 stands.
>
> 🛑 **EXECUTION MODE — READ FIRST. Revision 7 starts at §13 Phase D, step 17.**
> **Do NOT run Phase A0, Phase A, Phase B, or Phase C. Do NOT re-run `task668-qa-grid-1440.mjs --baseline`. Do NOT
> overwrite `.screenshots/task668/baseline.json`.** The task is already implemented; `runBaseline()` writes that file
> unconditionally (L229–231) and the pre-change tree is no longer buildable, so a re-run would irreversibly destroy
> the AC1/AC2/AC4/AC11 before/after proof and leave `--verify` comparing the change against itself. Reuse the
> recorded artifacts of the previous execution. Full rationale and the artifact list: **§13.0**.
>
> - **F1 `P2` (AC5/R5).** The header row's required **computed-style proof was never produced**, and the migration
>   introduces an undeclared computed `column-gap` `normal → 16px`: `@mantine/core@8.3.18`
>   `esm/components/Group/Group.mjs` L24 sets `defaultProps = { gap: "md" }` → `theme.spacing.md` = 16px, with **no**
>   `Group` defaultProps override in `theme.ts`. The old `<div className="flex … mb-6">` computed `column-gap: normal`
>   (0px). ⚠️ The rendered impact is **NOT established in either direction** — with `justify-content: space-between`
>   and two children the gap is absorbed by free space and the extreme positions can be identical. This is an
>   **unproven** change, not a demonstrated regression. New **§10.14** defines the only permitted proof method;
>   **AC5 is rewritten** around measured geometry rather than computed rules alone.
> - **F7 `P2` (AC13).** Revision 6's AC13 demanded that `--loading` "appear as **allowlisted**" — **no such verdict
>   exists.** `scripts/check-stories-rendered.mjs` emits `pass` / `fail` / `ambiguous` / `out-of-range` /
>   `known-failure` (L1253, L858, L1250, L1484, L1564); `LOADER_ALLOWLIST` is consulted only by readiness/gating
>   logic (L530, L851, L990) and never assigns a verdict. The implementation was correct throughout; the AC — and the
>   self-audit that marked it `VERIFIED` — were not. **AC13 rewritten** to a checkable condition.
> - **F2 `P2` (owner sequencing, not an executor action).** Four of this task's tracked paths carry Task 668 **and**
>   unreviewed Task 665 changes in the same working-tree diff, and Task 665 is `PARTIALLY VERIFIED`. No isolated
>   commit handoff for Task 668 is constructible until the owner sequences 665. Recorded in §16.
> - **F3 `P3`.** `scripts/task668-qa-grid-1440.mjs` L315–317 pushes a reason string but leaves `row.pass = true` when
>   a baseline cell is missing or `infraOk:false`, silently skipping the before/after assertion. Fix in §10.15.
>   It stays `P3` **because §10.14 puts the header proof in a separate script**: the grid harness's baseline schema is
>   untouched, so F3 is not a precondition of F1. Had the header capture been bolted onto the same harness, F3 would
>   escalate to `P2` and block first — the pre-change baseline moment has passed, so the missing header rows would
>   pass silently through exactly this branch.
> - **F4 `P3`.** §3.10 cited `screenshots:assert:fast` counts as the **full** run's baseline. Both figures are real
>   but describe different matrices; §3.10 now carries them as two separate rows rather than overwriting history.

## 1. Mode and task type

- **Mode:** implementation.
- **Task type:** UI (current Mantine path) — responsive layout migration with an **owner-approved visual change**,
  plus canonical-Story creation and migration-scope enrolment.
- **Owner directive driving this task (2026-07-26):** the owner reviewed the Mantine-vs-Tailwind breakpoint mismatch
  and ruled: *"мені вже не потрібен 1536 breakpoint, бо у Mantine набагато краща поведінка адаптації"* → **deliberate
  alignment on Mantine `xxl = 1440px`.** Binding decisions, not open questions:
  1. Featured grid steps to **4 columns at 1440px** (was 1536px).
  2. Latest grid steps to **3 columns at 1440px** (was 1536px).
  3. This is an **approved adaptive change, NOT a byte-identical migration**.
  4. A grid difference in the **1440–1535px** band is **expected and is not a regression**.
- **Owner decision on enrolment (2026-07-26, revision 2):** these two Views are a real Mantine migration, so they
  **must** be enrolled in `scripts/mantine-migration-scope.json` in this same diff. The route is a **new canonical
  `Patterns/Mantine/*` story that statically imports both Views** — the existing `System/*` stories and their story
  IDs are **not** renamed. See §3.7.
- **Why this is not merely cosmetic:** it removes a live inconsistency. Mantine-driven headings on the same page
  already step at `xxl` (1440px) while these Tailwind grids waited until `2xl` (1536px) — see §3.4.

## 2. Objective

Replace the raw `<div className="grid grid-cols-… gap-…">` grid containers and the raw `<div>` header row in
`FeaturedListingsView` and `LatestListingsView` with Mantine `SimpleGrid` / `Group`; move the large-desktop column
step from Tailwind `2xl` (1536px) onto Mantine `xxl` (1440px); enrol both Views in the Mantine migration scope behind
a new canonical story; and prove the moved step with a dedicated computed-style harness. All other breakpoints, gaps,
card contents, DOM order, and both non-populated states keep their current rendered behavior.

## 3. Verified context

All facts below were inspected in the repo on 2026-07-26. Do not re-derive; re-verify only where a step says so.

### 3.1 Files in scope (exact current markup)

**`src/modules/listings/components/FeaturedListingsView.tsx`**

| Line | Current markup (verbatim) | Branch |
|---|---|---|
| 47 | `<div className="flex items-center justify-between mb-6">` | `header` (shared by all three branches) |
| 57 | `<div className="featured-listings grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">` | **loading** (3 × `CardSkeleton`) |
| 78 | `<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">` | **populated** |

**`src/modules/listings/components/LatestListingsView.tsx`**

| Line | Current markup (verbatim) | Branch |
|---|---|---|
| 47 | `<div className="latest-listings grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">` | **loading** (4 × `RowSkeleton`) |
| 60 | `<div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">` | **populated** |

`LatestListingsView` has **no header row** — the Latest heading lives in `src/app/[locale]/page.tsx` L48 and is
already a Mantine `Group`. Only `FeaturedListingsView` owns a header row (L47).

Both files also contain skeleton sub-components (`CardSkeleton` / `RowSkeleton`) whose Mantine `Box` wrappers still
carry Tailwind chrome (`rounded-xl border bg-card overflow-hidden`, `p-3 space-y-2`, `flex flex-col`). **Those are OUT
of scope here** (§8) — this task changes grid containers only, so the visual delta stays attributable.

### 3.2 Breakpoint provenance (the whole reason for this task)

| Scale | Token | px | Source |
|---|---|---|---|
| Tailwind | `sm` / `md` / `xl` / `2xl` | 640 / 768 / 1280 / **1536** | Tailwind default scale |
| Mantine theme | `sm` / `md` / `xl` / `xxl` | 640 / 768 / 1280 / **1440** | `src/design-system/mantine/theme.ts` L142–150 (`xxl: '90em'`) |

`sm`, `md`, `xl` are **numerically identical** across both scales, so only the large-desktop step moves.
There is **no 1536px breakpoint in the Mantine theme** — documented as a trap in Task 662 §3.3, where the fix was a
CSS-module `@media (min-width:1536px)`. **Task 668 takes the opposite, owner-chosen route:** drop 1536 and adopt 1440.
Do NOT add a 1536px breakpoint to `theme.ts` and do NOT reintroduce a CSS-module media query to preserve 1536 — that
directly contradicts §1.

### 3.3 Gap provenance (must NOT change)

| Grid | Current utility | Computed | Mantine equivalent (verified `theme.ts` L171–177) |
|---|---|---|---|
| Featured | `gap-4` | 16px row + column | `spacing="md"` (`md: '1rem'` = 16px) |
| Latest | `gap-3` | 12px row + column | `spacing="sm"` (`sm: '0.75rem'` = 12px) |

Mantine `SimpleGrid` `spacing` sets **both** axes (like Tailwind `gap`), so a single prop reproduces each. If the
executor finds any computed divergence, use `spacing`/`verticalSpacing` explicitly to hit the exact px — the binding
requirement is the computed value, not the prop shape.

### 3.4 The inconsistency this removes (verified)

`src/app/[locale]/page.tsx` L49 and L77 already render `<Title … fz={{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }}>`
— a **Mantine** `xxl` step at **1440px**. `FeaturedListingsView` L78 steps its grid at **1536px**. Therefore in the
current production build, at 1440–1535px the section heading has already grown while the grid has not. Task 668
collapses both onto 1440.

### 3.5 Existing Storybook + governance registrations (keep working, do NOT retitle)

| Story file | `meta.title` | Story ID base | Exports (verified) |
|---|---|---|---|
| `src/stories/FeaturedListings.stories.tsx` | `System/FeaturedListings` | `system-featuredlistings` | `Default` (L78), `LocaleStress` (L111), `Loading` (L144), `Empty` (L166) |
| `src/stories/LatestListings.stories.tsx` | `System/LatestListings` | `system-latestlistings` | `Default` (L78), `LocaleStress` (L110), `Loading` (L142), `Empty` (L160) |

Both statically import the **real production Views** (Task 665). Story-ID references that would break on a retitle —
which is exactly why revision 2 does **not** retitle:

- `scripts/check-stories-rendered.mjs` L173–174 (`ASSERT_STORIES`, anchor `.listing-card`)
- `scripts/responsive-screenshots.mjs` L103–106 (Featured: desktop-1280/1440, huge-2560, mobile-320/375, `uk`)
- `scripts/governance/component-catalog.mjs` L446
- `scripts/task420-qa-grid-step.mjs` L53 — **and see §3.9, this one also encodes the OLD breakpoint expectations**

### 3.6 Marker-class asymmetry (verified — preserve as-is)

`.featured-listings` and `.latest-listings` exist **only on the loading-branch grid**, never on the populated grid
(`FeaturedListingsView` L57 vs L78; `LatestListingsView` L47 vs L60). Documented in
`docs/sessions/2026-07-24-task665-storybook-listing-view-splits.md` L203–204, which explicitly warns these are **not**
valid `document.querySelector()` locators for the loaded grid. **Preserve this exact placement.** Do not add the
marker class to the populated grid "for consistency" — that would silently change locator behavior for the Task 665
§16.1 `classList.contains` predicate and for the new §10.10 harness.

### 3.7 Migration-scope enrolment — the mechanism (verified; supersedes revision 1's deferral)

`scripts/mantine-migration-scope.json` currently holds 8 entries; neither View is enrolled.
`scripts/check-story-coverage.mjs` (header §1–4, L203–204) marks a component **covered** iff:

1. its path is in `scripts/mantine-migration-scope.json`, **and**
2. it is **statically imported** by ≥1 story whose `meta.title` satisfies `isCanonicalMantineTitle()` —
   prefixes `Mantine/Primitives/` and `Patterns/Mantine/` (`scripts/lib/mantine-story-scope.mjs`).

`System/*` does not satisfy (2). **But nothing requires the covering story to be the only story for a component.**
Therefore the resolution is additive: create **one new canonical story** under `Patterns/Mantine/` that statically
imports **both** Views, and enrol both paths. The `System/*` stories, their exports, and all four §3.5 story-ID
references stay byte-unchanged.

Verified conventions for the new story (model: `src/stories/patterns/mantine/HomeSection.stories.tsx`, Task 662):

- Path `src/stories/patterns/mantine/<Name>.stories.tsx`, `meta.title = 'Patterns/Mantine/<Name>'`,
  `parameters: { skipCanvas: true, layout: 'fullscreen' }`.
- **Import the component files directly, NOT via the barrel** — `check-story-coverage.mjs` resolves import specifiers
  to concrete file paths, and a barrel re-export does not resolve to the manifest entry. `HomeSection.stories.tsx`
  L4–L7 carries this exact warning in a comment.
- Fixtures: `makeCardListingFixtures(locale)` from `src/stories/fixtures/cardListingData.fixture.ts` (L47), and the
  signed-in `AuthContext.Provider` mechanism used by the existing `System/*` stories — **never** `AuthProvider`,
  never a mock.

**Consequence to plan for:** a new `Patterns/Mantine/*` story enters the `--mantine-only` runs
(`screenshots:assert --mantine-only`, `check:locale-leak:mantine-only`), which are hard-blocking CI gates. Its cells
must be clean, or the task is not done. This is an accepted, intended cost of correct enrolment.

### 3.11 ⚠️ Both target Views are UNTRACKED — repo-wide `git diff` cannot prove R7/R8 (verified — blocking)

`git status --porcelain` on this worktree reports:

```
?? src/modules/listings/components/FeaturedListingsView.tsx
?? src/modules/listings/components/LatestListingsView.tsx
```

Both files are **untracked** — created by Task 665, which is implemented but not yet committed. Git produces **no
diff output at all** for an untracked file, so a plain `git diff` (or `git diff <path>`) shows **nothing** for
exactly the two files this task modifies. Any acceptance criterion phrased as "given `git diff`, the card props are
unchanged" is therefore **unprovable as written**, and an executor running it would see empty output and could
mistake that for "no unintended change".

**Required mechanism — a targeted content snapshot, taken in Phase A0 before any edit:**

1. In Phase A0, copy both files verbatim into the ignored QA-artifact directory, e.g.
   `.screenshots/task668/source-baseline/FeaturedListingsView.tsx` and `…/LatestListingsView.tsx`.
2. After Phase B, produce a **file-to-file** diff per file — `git diff --no-index <snapshot> <current>` (works
   regardless of tracking status) or any equivalent file diff.
3. Quote both diffs in the session log as the R7/R8 evidence.

**Robust either way:** if the owner commits Task 665 before this task runs, the two files become tracked and plain
`git diff` would also work — but the snapshot mechanism stays correct in both worlds, so use it unconditionally and
do not branch on tracking status.

**Scope note:** this affects only these two files. The other paths this task touches — `FeaturedListings.stories.tsx`,
`LatestListings.stories.tsx`, `check-stories-rendered.mjs`, `task420-qa-grid-step.mjs`,
`mantine-migration-scope.json` — are tracked, so ordinary `git diff` is valid evidence for them (AC7).

### 3.8 Critical-flow scan

`docs/critical-flow-registry.md`: the homepage listing-preview render is **not** a registered critical flow (registry
covers auth, RLS/write-path, moderation, reporting, payment). No automated regression-coverage obligation. Profile is
Q3, not Q4.

### 3.9 ⚠️ `task420-qa-grid-step.mjs` will FAIL after this change unless fixed (verified — blocking)

`scripts/task420-qa-grid-step.mjs` asserts the §8.3 column step for **two** stories against **one shared** expected
table:

- `STORIES` (L52–55): `system-featuredlistings--default` **and** `system-similarlistings--default`.
- `VIEWPORTS` (L35–45) carries a single `expectedCols` per width, including **`1440 → 3`** and **`1536 → 4`**.
- L220 asserts `grid.columnCount !== viewport.expectedCols` → fail.

`SimilarListingsView` L23 still renders `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` and is **out of
scope** for Task 668. So after this change Featured@1440 = 4 while Similar@1440 = 3, and a single shared table cannot
describe both. **This script must be made per-story in this task** (§10.9) or it becomes a false failure.

**And a second, independent break in the same script:** its `evalGrid()` (L100–107) locates the grid by **hardcoded
Tailwind class tokens**:

```js
const grid = [...document.querySelectorAll('div')].find(d => {
  const t = tokens(d);
  return t.includes('grid') && t.includes('grid-cols-1') &&
    t.includes('sm:grid-cols-2') && t.includes('xl:grid-cols-3') && t.includes('2xl:grid-cols-4');
});
if (!grid) return { found: false };
```

After the migration the Featured grid carries Mantine-generated classes, not these tokens, so `found: false` →
`pass = false` (L219–220) regardless of the expected-column table. **A per-story expected table alone does not fix
this** — the locator must change too, while still locating `SimilarListings`' unchanged Tailwind grid (§10.9).

### 3.10 Harness exit-code and CI realities (verified — AC9/AC13 depend on these)

| Fact | Evidence |
|---|---|
| `screenshots:assert` (full run) sets `process.exitCode = 1` on **any** FAIL | `scripts/check-stories-rendered.mjs` L1324/L1352/L1364/L1816 |
| **`screenshots:assert:fast`** (a DIFFERENT, smaller matrix) carries **2116 cells / 219 FAIL** | `docs/backlog.md` Task 665 entry: "`screenshots:assert:fast` now 1827/2116 PASS, 219 FAIL unchanged vs baseline" |
| **`screenshots:assert`** (the FULL run this task judges) carries **7880 cells / 953 FAIL** pre-change | measured directly in Task 668 Phase A, manifest `.screenshots/rendered-assert/2026-07-26T18-37/manifest.json` |
| ⚠️ **Revision 7 correction (F4):** revisions 1–6 quoted the `--fast` figure (219/2116) as if it were the **full** run's baseline. Both numbers are real; they describe **different matrices**. Judge the full run only against its own `953 FAIL / 7880 cells`, and never "correct" the historical `--fast` record | the two rows above |
| ⇒ **"`screenshots:assert` exits 0" is unachievable** and must never be an acceptance criterion for the full run | the rows above |
| The run emits a machine-readable `.screenshots/rendered-assert/<ts>/manifest.json` with `{ timestamp, summary, matrix }` (story × viewport × locale, PASS/FAIL) | L1561, L1593–1594, L1759 |
| ⇒ for the **full** run the correct criterion is a **manifest-based delta** on task-owned cells, not the process exit code | — |
| ⚠️ **`--mantine-only` is a DIFFERENT run with a DIFFERENT baseline — it inherits neither the full run's 953 FAIL nor the `--fast` 219 FAIL.** It skips the legacy `ASSERT_STORIES` and geometry-only phases and covers only `Mantine/Primitives/*` + `Patterns/Mantine/*`. Its recorded baseline is **`0 FAIL`** | `docs/sessions/2026-07-23-task663-harness-backdrop-overlap-downgrade.md` R4/AC4: "1064 cells, 1021 PASS, **0 FAIL**, 43 ambiguous" before / "1064 cells, 1042 PASS, **0 FAIL**" after; `docs/backlog.md` Task 663: "`0 FAIL` both before/after" |
| ⇒ `--mantine-only` **must exit 0 with 0 FAIL** — it is a hard-blocking CI gate (`check-stories-rendered.mjs` L290) and a delta-only criterion would be strictly weaker than the project's own gate | — |
| `check:locale-leak:mantine-only` is `continue-on-error: true` in CI (Task 625 migration-window policy) | `.github/workflows/governance-pr.yml` L194–200 |
| ⇒ requiring exit 0 from it is stricter than the project's own gate; require a **delta** instead | — |
| CI runs `npm run build-storybook` **before** both `screenshots:assert --mantine-only` and `check:locale-leak:mantine-only` | `.github/workflows/governance-pr.yml` L148, L191 |
| ⇒ any local harness run over `storybook-static/` is only valid against a **freshly built** bundle (§13) | — |
| `LOADER_ALLOWLIST` (L242–) exempts story IDs whose **intended content is a loading/skeleton state** — precedent entry `primitives-skeleton--listing-card-skeleton`. It is explicitly for **false positives only**, never for real defects (L292–293, owner ruling Task 607) | L240–254, L288–304 |
| ⇒ a deliberate `Loading` story under `Patterns/Mantine/*` **must** be allowlisted or `--mantine-only` fails on it — and it qualifies, being the same category as the pinned precedent | — |

## 4. Requirements (requirement ledger)

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner §1.1 | Featured grid (populated **and** loading) renders via Mantine `SimpleGrid` with column steps **1 / 2 @640 / 3 @1280 / 4 @1440**. | P0 | §10.10 harness | Confirmed |
| R2 | Owner §1.2 | Latest grid (populated **and** loading) renders via Mantine `SimpleGrid` with column steps **1 / 2 @768 / 3 @1440**. | P0 | §10.10 harness | Confirmed |
| R3 | §3.3 | Gaps unchanged: Featured 16px, Latest 12px, on **both** axes, at every width. | P0 | computed `columnGap` + `rowGap` | Confirmed |
| R4 | Owner §1.3–1.4 | The 1440–1535px difference vs the pre-change render is recorded as the **approved** outcome; every other width band matches the pre-change computed grid. | P0 | before/after table (AC11) | Confirmed |
| R5 | §3.1 | The Featured header row (L47) renders via Mantine `Group` with `justify="space-between"`, `align="center"`, `wrap="nowrap"`, and a computed `margin-bottom` of 24px; `Title` + `ViewAllLink` unchanged. | P1 | **§10.14 synthetic-`gap:0` geometry harness** — computed rules ALONE are not sufficient (revision 7, F1) | Confirmed |
| R17 | Revision 7 F1 | The header row's `column-gap` `normal → 16px` change is **measured**, not asserted: the rendered geometry of `Group`/`Title`/`ViewAllLink` is proven either unchanged by the gap, or the affected element and width band are named for an owner decision. | P0 | §10.14, AC5 | Confirmed |
| R6 | §3.6 | `.featured-listings` / `.latest-listings` remain on the **loading** grid only. | P0 | DOM, both branches | Confirmed |
| R7 | agent-contract P0.3/P0.5 | Card count, order, props (`priority`, `displayCurrency`, `rates`, `isFavorited`), `getImagePriority()` index semantics, empty state, and skeleton counts (3 Featured / 4 Latest) unchanged. | P0 | DOM + the **§3.11 targeted file diff** (NOT repo-wide `git diff` — both Views are untracked) | Confirmed |
| R8 | agent-contract P0.7 | No user-facing string added or changed. | P0 | **§3.11 targeted file diff**, zero `t()` key changes | Confirmed |
| R9 | agent-contract P0.9 | `npx tsc --noEmit` clean and `npm run build` exit 0. | P0 | transcripts | Confirmed |
| R10 | §3.7 + clause 16c | A new canonical `Patterns/Mantine/*` story statically imports **both** Views by direct file path; **both** View paths are added to `scripts/mantine-migration-scope.json`; `check:story-coverage` exits 0 with both newly covered. | P0 | `npm run check:story-coverage` | Confirmed |
| R11 | §3.5 | Existing `System/*` story titles, exports, IDs, and all four §3.5 reference sites still resolve; `check:stories`, `governance:screenshots`, `governance:components` exit 0. | P0 | transcripts | Confirmed |
| R12 | §3.9 | `scripts/task420-qa-grid-step.mjs` uses a **per-story** expected-column table **and a per-story locator** (Featured mechanism-agnostic, Similar still pinned to Tailwind tokens); passes for both. | P0 | script run, exit 0 | Confirmed |
| R13 | §10.10 | A new `scripts/task668-qa-grid-1440.mjs` with explicit `--baseline` / `--verify` modes, a stable baseline path, and a **dual locator** that works on both the pre-change Tailwind grid and the post-change `SimpleGrid`; captures `gridTemplateColumns`/`columnGap`/`rowGap` for all four grid containers × the §13 widths × 4 locales; `--baseline` asserts nothing and exits 0 on the unchanged tree, `--verify` asserts the §12 tables and produces the AC11 diff. | P0 | both modes run, exit 0 + recorded table | Confirmed |
| R14 | qa-profiles Q3 + §3.10 | Rendered proof judged by **manifest delta**, not exit code: zero new FAIL on task-owned cells in the full run, no increase in totals, and the new canonical story clean in `--mantine-only`. | P0 | before/after manifests | Confirmed |
| R15 | §3.10 / §10.11 | The new canonical story has a **fixed** filename, `meta.title`, and exports (`Default`, `Loading`); `--default` is registered in `ASSERT_STORIES` with the `.listing-card` anchor and `--loading` in `LOADER_ALLOWLIST` (false-positive category, **not** the known-failure registry). | P0 | source + `--mantine-only` verdicts | Confirmed |
| R16 | §3.10 / §13 | `npm run build-storybook` runs immediately before **every** harness capture — Phase A baseline, Phase C verification, **and Phase D step 19 before the new header harness (revision 7)** — so no harness ever reads a stale `storybook-static/`. | P0 | command transcripts, in order | Confirmed |

Every acceptance criterion in §12 maps to these IDs.

## 5. Assumptions and open questions

- **A1 (RESOLVED in revision 2 — no longer an open owner decision):** manifest enrolment happens **in this task**, via
  the new canonical `Patterns/Mantine/*` story (§3.7). Revision 1's "defer enrolment to review" is withdrawn: it
  contradicted `check-story-coverage.mjs`'s stated obligation while the task migrated two production Views.
- **A2 (assumption — verify before coding):** `SimpleGrid`'s `cols` accepts theme breakpoint keys
  (`base`/`sm`/`md`/`xl`/`xxl`), as used today in `HowItWorksSteps` (`cols={{ base: 1, sm: 3 }}`) and
  `PopularLocationsView` (`cols={{ base: 2, sm: 3, md: 4 }}`). Re-verify against the installed `@mantine/core`. If
  `xxl` is not accepted in `cols`, **STOP and report** — do not substitute a CSS-module media query (that re-creates
  the split this task exists to remove).
- **OQ1 (non-blocking, follow-up):** whether the `System/FeaturedListings` / `System/LatestListings` stories should
  eventually be consolidated into the new canonical story. Not done here — §3.5 reference sites must keep resolving.
- **OQ2 (non-blocking):** skeleton chrome Tailwind (§3.1) and the other homepage Tailwind surfaces (`FiltersPanel`,
  `MobileBottomNav`, Sonner `Toaster`, `HeaderView`/`FooterView` hybrids) → Tasks 669–673.
- **OQ3 (non-blocking, surfaced by this task):** `MantineHomeSection` still steps its band padding at **1536px** via
  its CSS-module `@media` chain (Task 662 §3.3). After Task 668 the page will step *grids* at 1440 and *band padding*
  at 1536. Given the owner's 2026-07-26 ruling this is probably also worth collapsing onto 1440, but it is a
  different component with its own byte-identical acceptance history — **out of scope here**, recorded for a
  follow-up decision.
- No blocking open questions.

## 6. Pre-read rule bundle (exact — do not read all docs)

1. `docs/agent-contract.md` (P0 invariants).
2. `docs/mantine-responsive-design-system.md` (breakpoints, responsive props, `SimpleGrid`).
3. `docs/component-rules.md` (container/presentational split, no-duplicate).
4. `docs/qa-profiles.md` (Q3 evidence requirements).
5. `docs/storybook-governance.md` §14–§15 (rendered proof + coverage manifest).
6. `docs/qa-rules.md` (validation, encoding, mojibake).
7. `src/stories/patterns/mantine/HomeSection.stories.tsx` (canonical-story + direct-import model, Task 662).
8. `scripts/task420-qa-grid-step.mjs` (harness model for §10.10, and the §3.9 fix target).
9. This kickoff. Re-verify §3.2 (`theme.ts`) and A2 before coding.

## 7. Scope

- `src/modules/listings/components/FeaturedListingsView.tsx` — grid containers (L57, L78) + header row (L47).
- `src/modules/listings/components/LatestListingsView.tsx` — grid containers (L47, L60).
- **New** `src/stories/patterns/mantine/HomepageListingGrids.stories.tsx` — **fixed** filename, title
  `Patterns/Mantine/HomepageListingGrids`, exports exactly `Default` and `Loading` (§10.11); statically imports both
  Views by direct file path.
- `scripts/mantine-migration-scope.json` — add both View paths.
- **New** `scripts/task668-qa-grid-1440.mjs` — the computed-grid harness, `--baseline` / `--verify` (§10.10).
  **Revision 7:** one bug fix only (§10.15 / F3). Do **not** add header capture to this script — see §10.14.
- **New (revision 7)** `scripts/task668-qa-header-geometry.mjs` — the header-row synthetic-`gap:0` geometry harness
  (§10.14). A **separate** script by design: it needs no pre-change tree and must not touch
  `task668-qa-grid-1440.mjs`'s `baseline.json` schema.
- `scripts/task420-qa-grid-step.mjs` — per-story expected-column table **and** per-story locator (§3.9 / §10.9).
- `scripts/check-stories-rendered.mjs` — add `patterns-mantine-homepagelistinggrids--default` to `ASSERT_STORIES`
  (anchor `.listing-card`) and `patterns-mantine-homepagelistinggrids--loading` to `LOADER_ALLOWLIST` (§10.11.a/b);
  the existing L173–174 entries stay unchanged.
- `.gitignore` — only if the chosen baseline directory (§10.10) is not already ignored.
- **Exactly four** Storybook doc-description strings describe the old Tailwind grid and must be **rewritten to
  describe the `SimpleGrid` props**. Do **not** mechanically swap `2xl` → `xxl` inside a class list: `xxl:grid-cols-4`
  is **not a real Tailwind class**, and after this task there is no Tailwind grid class on these elements at all.
  Describe the actual mechanism instead. All four verified verbatim:

  | File | Line | Current text | Required after |
  |---|---|---|---|
  | `FeaturedListings.stories.tsx` | 28 | `Canonical §8.3 card grid: grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4.` | describe `<SimpleGrid cols={{ base: 1, sm: 2, xl: 3, xxl: 4 }} spacing="md">` |
  | `FeaturedListings.stories.tsx` | 100 | `1 col (<640) → 2 cols (sm) → 3 cols (xl, 1280px) → 4 cols (2xl, 1536px).` | `1 col (<640) → 2 cols (sm, 640px) → 3 cols (xl, 1280px) → 4 cols (xxl, 1440px)` — naming these as **Mantine theme breakpoints**, and noting the 1536→1440 move is the Task 668 owner decision |
  | `LatestListings.stories.tsx` | 28 | `Canonical grid: grid-cols-1 md:grid-cols-2 2xl:grid-cols-3.` | describe `<SimpleGrid cols={{ base: 1, md: 2, xxl: 3 }} spacing="sm">` |
  | `LatestListings.stories.tsx` | 99 | `1 col (<768) → 2 cols (md, 768px) → 3 cols (2xl, 1536px).` | `1 col (<768) → 2 cols (md, 768px) → 3 cols (xxl, 1440px)` — same breakpoint-source note |

  These are Storybook doc strings, not user-facing i18n copy, so R8 is unaffected — but leaving them would ship a
  false canonical claim, and a naive `2xl`→`xxl` substitution would ship a *different* false claim (a Tailwind class
  that does not exist). Do **not** change `meta.title`, story export names, or story args in these files.
- `docs/backlog.md` (concise current state, ~80-line cap) + session log under `docs/sessions/`.

## 8. Out of scope

- Any 1536px preservation mechanism (`theme.ts` breakpoint addition, CSS-module `@media`) — contradicts §1.
- `MantineHomeSection`'s own 1536px band-padding step — OQ3.
- `CardSkeleton` / `RowSkeleton` internal Tailwind chrome — OQ2.
- Retitling / moving / deleting the existing `System/*` stories or their four §3.5 reference sites (beyond the §3.9
  per-story table fix and the additive `ASSERT_STORIES` entries).
- `SimilarListingsView` / `RecentlyViewedGridView` — still Tailwind grids, unchanged; §3.9 only makes the harness
  describe them separately.
- `ListingCard`, `MantineListingCardPattern`, `FavoriteButton`, `AppImage` — untouched.
- The homepage `Group` at `page.tsx` L48 — already Mantine, leave verbatim.
- `PopularLocations`, `FiltersPanel`, `HeroSearch*`, `MobileBottomNav`, `Toaster` — Tasks 669–673.
- Adding a marker class to the populated grids — §3.6.

## 9. Current and required behavior

**Current:** both Views render raw `<div>` grid containers with Tailwind utilities. Featured: 1 col → 2 @640 → 3 @1280
→ 4 **@1536**, gap 16px. Latest: 1 col → 2 @768 → 3 **@1536**, gap 12px. Featured's header row is a raw
`<div className="flex items-center justify-between mb-6">`. Neither View is enrolled in the Mantine migration scope.

**Required (after):** the same six render branches use Mantine `SimpleGrid` / `Group`. Featured: 1 → 2 @640 → 3 @1280
→ 4 **@1440**. Latest: 1 → 2 @768 → 3 **@1440**. Gaps, card contents, order, counts, empty/loading states, and
marker-class placement unchanged. Both Views enrolled in `mantine-migration-scope.json` and covered by a new canonical
`Patterns/Mantine/*` story. **At 1440–1535px the grid intentionally differs from the pre-change render** (Featured 4
cols instead of 3; Latest 3 cols instead of 2) — the approved outcome per §1.

## 10. Implementation requirements

1. **Featured populated grid (L78)** → `<SimpleGrid cols={{ base: 1, sm: 2, xl: 3, xxl: 4 }} spacing="md">`.
2. **Featured loading grid (L57)** → same props, **plus** `className="featured-listings"` (§3.6).
3. **Latest populated grid (L60)** → `<SimpleGrid cols={{ base: 1, md: 2, xxl: 3 }} spacing="sm">`.
4. **Latest loading grid (L47)** → same props, **plus** `className="latest-listings"`.
5. **Featured header row (L47)** → `<Group justify="space-between" align="center" wrap="nowrap" mb="xl">` wrapping the
   existing `Title` + conditional `ViewAllLink` verbatim. `mb-6` = 24px; theme `spacing.xl` = `1.5rem` = 24px
   (`theme.ts` L176). **`wrap="nowrap"` is mandatory:** Tailwind `flex` defaults to `nowrap` while Mantine `Group`
   defaults to `wrap="wrap"`, so omitting it silently changes behavior. This matches the sibling Latest heading row
   at `page.tsx` L48. Verify computed `margin-bottom` is 24px; if not, use the value that computes to 24px.
   ⚠️ **Revision 7 (F1) — the `gap` trap, the exact sibling of the `wrap` trap above.** Mantine `Group` also defaults
   to **`gap="md"` = 16px** (`Group.mjs` L24 → `--group-gap`, `Group.mjs` L33), while Tailwind `flex` defaults to
   `column-gap: normal` (0px). Revision 6 enumerated four props and omitted this one, so the shipped `Group` carries a
   16px inter-child gap the old `<div>` did not. **Do NOT reflexively add `gap={0}`** — with `justify-content:
   space-between` and two children the gap is normally absorbed by free space, and `page.tsx` L48 (the canonical
   sibling this row is modelled on) also omits `gap`. Measure first per §10.14, then apply §10.14's decision rule.
6. **Imports — per file, exactly:**
   - `FeaturedListingsView.tsx`: add **`SimpleGrid` and `Group`** to the existing `@mantine/core` import
     (it owns the header row).
   - `LatestListingsView.tsx`: add **`SimpleGrid` only** — this file has no header row (§3.1).
   - Remove any import left unused after the change; keep both files `'use client'` and hook-free apart from the
     existing `useTranslations`.
7. **No new tokens, no CSS module, no `theme.ts` change.**
8. **Story doc strings** — update exactly the four lines tabulated in §7.
9. **`scripts/task420-qa-grid-step.mjs` — TWO fixes, both required (§3.9):**
   - **(a) Per-story expected table.** Move `expectedCols` from the shared `VIEWPORTS` table (L35–45) onto each
     `STORIES` entry (or an equivalent per-story map), so Featured asserts the new 1440 step and Similar keeps 1536.
   - **(b) Per-story locator.** `evalGrid()` (L100–107) currently finds the grid by hardcoded Tailwind tokens and
     will return `found: false` for the migrated Featured grid. Give each `STORIES` entry its own locator strategy:
     `similarlistings` keeps the existing Tailwind-token predicate **verbatim** (it is still a Tailwind grid);
     `featuredlistings` switches to a mechanism-agnostic predicate — e.g. the first element inside
     `#storybook-root` whose computed `display` is `grid` and which has ≥1 `.listing-card` descendant.
     Keep `evalGrid`'s existing `containerWidthPx` walk (`.container-wide` ancestor) and the `>=1536` container-cap
     assertion unchanged for both stories.
   - Do not weaken or delete any assertion, do not change its story IDs, and do not make the Similar locator
     mechanism-agnostic "while you're there" — leaving it pinned to Tailwind tokens is what proves Similar was not
     accidentally migrated.
10. **New `scripts/task668-qa-grid-1440.mjs`** — model it on `task420-qa-grid-step.mjs` (serves `storybook-static/`
    over a local static server, drives `iframe.html?id=…&globals=locale:…`, reads computed styles). It must:
    - **Run in two explicit modes** — this is mandatory, because the same script must run **before** the source
      change (when no `SimpleGrid` exists and 1440 still shows the old column counts) and **after** it:
      - `--baseline` — captures every cell and **writes** the result file. **Asserts nothing** about expected column
        counts; it only fails on infrastructure problems (story failed to render, grid not found, page error).
        Running it against the pre-change tree must exit 0.
      - `--verify` — captures every cell, asserts the §12 AC1–AC4 expected tables, **and** diffs against the stored
        baseline to produce the AC11 `APPROVED CHANGE` / `UNCHANGED` labelling automatically. Exits non-zero on any
        expected-table mismatch or on any unlabelled difference outside the 1440–1535 band.
      - Default (no flag) = `--verify`.
    - Write the baseline to a **stable, deterministic path** (e.g. `.screenshots/task668/baseline.json`) — not a
      timestamped directory — so `--verify` can find it without arguments. Add it to `.gitignore` if that directory
      is not already ignored; do not commit captured artifacts.
    - Open **four** story IDs: `system-featuredlistings--default`, `system-featuredlistings--loading`,
      `system-latestlistings--default`, `system-latestlistings--loading` (export names verified §3.5).
    - Iterate widths **320 / 640 / 768 / 1024 / 1280 / 1439 / 1440 / 1535 / 1536 / 1920** × locales `sq/en/uk/it`.
    - Record `getComputedStyle(grid).gridTemplateColumns`, `.columnGap`, `.rowGap` per cell.
    - **Use a dual locator that works on BOTH the pre-change Tailwind grid and the post-change `SimpleGrid`** —
      otherwise `--baseline` cannot run at all. Locate mechanism-agnostically: within `#storybook-root`, the first
      element whose computed `display` is `grid`, scoped to the View under test. On the loading branch the marker
      class (`.featured-listings` / `.latest-listings`) may be used as the scope, since it survives the migration
      (§3.6/§10.2/§10.4). **Do not** add a marker class to the populated grid to make locating easier (§3.6), and do
      **not** write a locator that depends on Tailwind tokens or on Mantine class names — either one breaks in one
      of the two modes.
11. **New canonical story (§3.7) — deterministic identity, not "executor discretion":**
    - **File:** `src/stories/patterns/mantine/HomepageListingGrids.stories.tsx`
    - **`meta.title`:** `Patterns/Mantine/HomepageListingGrids`
    - **Exports:** exactly `Default` and `Loading` → story IDs
      `patterns-mantine-homepagelistinggrids--default` and `patterns-mantine-homepagelistinggrids--loading`.
      These IDs are referenced by items 11.a/11.b below and by AC9/AC13, so they must not be renamed.
    - `parameters: { skipCanvas: true, layout: 'fullscreen' }`.
    - Statically imports **both** `@/modules/listings/components/FeaturedListingsView` and
      `@/modules/listings/components/LatestListingsView` **by direct path, not the barrel** (§3.7).
    - `Default` renders both Views populated via `makeCardListingFixtures(locale)` + the signed-in
      `AuthContext.Provider` fixture pattern from the existing `System/*` stories; `Loading` renders both with
      `loading: true`.
    - **(a) `ASSERT_STORIES`:** add **only** `patterns-mantine-homepagelistinggrids--default`, anchor
      `{ type: 'selector', value: '.listing-card', label: 'listing-card' }`. **Do NOT add the `Loading` ID** — it has
      no `.listing-card` to anchor on by design.
    - **(b) `LOADER_ALLOWLIST`:** add `patterns-mantine-homepagelistinggrids--loading` with a comment citing this
      task. Required: `--mantine-only` auto-discovers every `Patterns/Mantine/*` story by title prefix, and this one
      is a deliberate, permanent skeleton state — the same false-positive category as the pinned precedent
      `primitives-skeleton--listing-card-skeleton` (§3.10). Without the entry the hard-blocking gate fails on an
      intended state. This is a FALSE-positive allowlisting, which the Task 607 ruling permits; it is **not** a
      known-failure registration, and the executor must not add anything to the known-failure registry.
12. **Manifest:** add `src/modules/listings/components/FeaturedListingsView.tsx` and
    `src/modules/listings/components/LatestListingsView.tsx` to `scripts/mantine-migration-scope.json`.
13. **i18n / encoding:** no `t()` key changes; touched files stay UTF-8 no-BOM, no mojibake.
14. **NEW (revision 7, F1) — `scripts/task668-qa-header-geometry.mjs`: the header-row proof.**

    **Why a synthetic before, and why in-place.** There is **no rendered pre-change baseline** for this row and there
    cannot be one retroactively: `.screenshots/task668/source-baseline/` holds only two `.tsx` files, and
    `baseline.json` holds only `{found, columnCount, gridTemplateColumns, columnGap, rowGap, childrenCount}` — no
    header data, no rects. The pre-change capture moment has passed. Two alternatives are **explicitly forbidden**:

    - ❌ **Do NOT swap the untracked Views back to their snapshots to rebuild a pre-change Storybook.** Both Views are
      untracked, so `git checkout` / `git restore` cannot recover them; a failure between swap and restore would
      destroy uncommitted Task 665 work. (A rebuild is only defensible inside an isolated temporary copy of the
      project, and is not worth its cost given the method below.)
    - ❌ **Do NOT measure a hidden clone.** Mantine puts scoped classes and CSS variables on the element and its
      ancestors; a clone in another subtree inherits the cascade differently, so any rect delta would be an artifact
      of cloning rather than a property of `gap`.

    **Required method — synthetic `gap:0` on the real element, inside one `page.evaluate`:**

    1. Measure the live row: `getBoundingClientRect()` for the `Group`, the `Title`, and the `ViewAllLink`;
       `Group.clientWidth` / `Group.scrollWidth`; and computed `display`, `justify-content`, `align-items`,
       `flex-wrap`, `margin-bottom`, `column-gap`.
    2. Save the inline custom-property state **completely** — both `el.style.getPropertyValue('--group-gap')` **and**
       `el.style.getPropertyPriority('--group-gap')`, and note whether the property was absent (empty value).
    3. Set `el.style.setProperty('--group-gap', '0px')`. This is exactly the variable `Group.mjs` L33 writes, so the
       probe hits the one suspected difference and nothing else.
    4. Wait one frame (`requestAnimationFrame`), then repeat step 1's measurements.
    5. In a **`finally`** block, restore the saved state precisely: if the property was originally absent, call
       `el.style.removeProperty('--group-gap')`; otherwise `setProperty(name, savedValue, savedPriority)`. Never
       leave the probe applied, and never restore by guessing `'16px'`.
    6. Matrix: **exactly one story ID × 3 widths × 4 locales = 12 deterministic cells.**

    **Deterministic identity (do not leave any of this to executor discretion):**

    | Parameter | Value |
    |---|---|
    | Story ID | **`system-featuredlistings--default`** — the only ID. Chosen because it is the populated branch, so `ViewAllLink` is present (it renders only under `!loading && listings.length > 0`, `FeaturedListingsView.tsx` L47). Do **not** add `--loading` (no `ViewAllLink` → the two-child geometry under test does not exist) and do **not** add `--empty`. |
    | Widths | `320`, `640`, `1440` |
    | Locales | `sq`, `en`, `uk`, `it` |
    | Runner | Same model as `scripts/task668-qa-grid-1440.mjs`: `createServer` static server over `storybook-static/` on a **free port not already used by a sibling harness** (verified: `task420-qa-grid-step.mjs` L186 uses **6014**, `task668-qa-grid-1440.mjs` L365 uses **6015** — use **6016**), Playwright `chromium.launch()`, `page.setViewportSize({ width, height: 900 })`, `page.goto('iframe.html?id=<id>&globals=locale:<loc>&viewMode=story', { waitUntil: 'networkidle', timeout: 20000 })`, then `page.waitForTimeout(400)`. |
    | `Group` locator | Within `#storybook-root`, the first element whose computed `display` is `flex` **and** which contains an `h2` descendant. Mechanism-agnostic — do **not** match Mantine class names. Assert exactly one match; on 0 or >1, fail the cell as an infra error with a distinct reason string rather than guessing. |
    | `Title` locator | `group.querySelector('h2')` — `Title order={2}` renders `<h2>` (`FeaturedListingsView.tsx` L46). |
    | `ViewAllLink` locator | The `Group`'s **last element child**, asserted `!== title`. Do not pin to a class or `href`. |
    | Render-failure guard | Reuse `task668-qa-grid-1440.mjs`'s `renderResult` check verbatim (`sb-show-errordisplay`, blank canvas, `pageerror` collection) so an unrendered story cannot silently produce "matching" rects. |

    Both measurement passes (live and synthetic) must run inside **one** `page.evaluate` on the **same** page instance
    — never two `goto`s, never two page objects. Re-navigating would re-lay-out and defeat the comparison.

    **Premise that must be VERIFIED, not assumed.** This method proves the effect of `gap` only. Confirm by reading
    Mantine's compiled `Group` root CSS that the root differs from the old `<div className="flex items-center
    justify-between mb-6">` **solely** in `display` / `flex-direction` / `flex-wrap` / `align-items` /
    `justify-content` / `gap` (plus `margin-bottom` via `mb`) — in particular that `grow={false}` adds no `flex-grow`
    to the children.

    ⚠️ **`flex-direction: row` is EXPECTED — do not escalate on it.** Mantine's `Group` root sets it explicitly,
    while the old Tailwind `flex` div inherited the identical value from the CSS initial value for a flex container.
    The computed result is `row` on both sides, so this is a **declaration difference with no rendered effect**, not
    a regression. It is listed here precisely so the "report any other root rule" instruction below does not fire a
    false escalation on it.

    If any root rule **beyond** the six listed above exists, report it; the synthetic probe does not cover it.

    **Decision rule — measured rects and overflow only.** Free space
    (`Group.clientWidth − (Title.width + ViewAllLink.width) − column-gap`) is a **diagnostic field for the report,
    never a pass condition**. In particular a negative value is NOT by itself grounds for escalation: if synthetic
    `gap:0` yields the same rects and the same overflow, the negative figure proves nothing.
    ⚠️ `scrollWidth ≤ clientWidth` also does **not** prove absence of shrink — a compressed flex item re-wraps its
    text inside the smaller width and stays within `scrollWidth`. Escalate to an owner decision **only** on:

    - any rect difference **> 0.5px** between the live and synthetic-`gap:0` measurements (epsilon `≤ 0.5px`); or
    - **worse overflow** with the real `gap:16px` than with synthetic `gap:0`.

    On escalation, name **which** element moved or compressed and **at which width/locale**. Do not predict which one
    it will be — either child may shrink depending on resolved `flex-shrink` / `min-width`, or overflow may occur
    instead. If neither trigger fires, record the row as `PRESERVE (rendered layout) — MEASURED`, and record the
    `column-gap` `0 → 16px` as an accepted convergence with the `page.tsx` L48 canonical sibling.
15. **NEW (revision 7, F3) — `scripts/task668-qa-grid-1440.mjs` L315–317 bug fix.** The `else` branch that handles a
    missing or `infraOk:false` baseline cell pushes a reason string but leaves `row.pass = true`, so the before/after
    assertion is skipped silently. Set `row.pass = false` in that branch. Change nothing else in this script; its
    `baseline.json` schema and both modes stay exactly as verified.

### Canonical UI decision record

| Visible artifact | Search performed | Canonical Mantine Story / source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|
| Featured card grid container | `rg "SimpleGrid"` across `src` → 8 files; opened `HowItWorksSteps.tsx` (`cols={{ base:1, sm:3 }} spacing={32}`), `PopularLocationsView.tsx` (`cols={{ base:2, sm:3, md:4 }} spacing="sm"`), `stories/patterns/mantine/ListingCardPattern.stories.tsx` | Mantine `SimpleGrid` — already this page's grid mechanism | **reuse** | theme `spacing.md` (16px) + theme breakpoints; **new** enrolment of `FeaturedListingsView` in `mantine-migration-scope.json` + new `Patterns/Mantine/*` story |
| Latest card grid container | same search | Mantine `SimpleGrid` | **reuse** | theme `spacing.sm` (12px); **new** enrolment of `LatestListingsView` + same story |
| Featured header row | `page.tsx` L48 renders the equivalent Latest heading row as `<Group justify="space-between" align="center" wrap="nowrap" mb="xl">` — inspected verbatim | Mantine `Group`, in-repo precedent on the same page | **reuse** | theme `spacing.xl` (24px) |
| Large-desktop column step | `theme.ts` L142–150 inspected; no 1536px breakpoint exists | theme `xxl` = 1440px | **reuse** | none new |

No `create canonical` disposition is claimed for a *style*: every visual artifact maps to an upstream Mantine
primitive already used on this page, so clause 16a is satisfied — the only changed visual value (the 1440px step) is
an explicit owner decision recorded in §1. The **story** is new because enrolment requires it (§3.7), not because a
new visual primitive is being invented.

## 11. Positive and negative flows

**Positive flow:** Load `/[locale]` at 1440px → Featured renders 4 columns and Latest renders 3 columns (previously
3 and 2); at 320/375/640/768/1024/1280/1536/1920 the column counts and both gaps match the pre-change render; cards,
order, favorites, and headings unchanged.

**Negative-flow applicability:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | No | No form/input touched | N/A | — |
| Authorization/RLS | No | Public marketing route, no write path | N/A | — |
| Offline/network | No | No fetch change; container/View split untouched | Existing behavior | — |
| Concurrent writer | No | No mutation | N/A | — |
| **Loading state** | **Yes** | `loading:true` branch has its own grid | Steps at the SAME new breakpoints as the populated grid; 3/4 skeleton count unchanged; marker class still present | §10.10 harness, `Loading` IDs |
| **Empty state** | **Yes** | `!listings.length` branch | Renders `Text` empty message, no grid; unaffected | `Empty` story |
| **Partial fill at 1440** | **Yes** | 4-col grid with 3 fixtures | Row does not stretch or misalign; trailing cells collapse as `SimpleGrid` does natively | rendered check @1440 |
| Long-locale (uk) @320 | Yes | i18n | No horizontal overflow; single column; gap unchanged | `screenshots:assert` `uk@320` |
| **1439 vs 1440 boundary** | **Yes** | §1.1–1.2 | Column count changes at exactly 1440, not 1439 | §10.10 harness |
| **1535 vs 1536 boundary** | **Yes** | §1.4 | **No** column change at 1536 (old step gone) | §10.10 harness |
| **Sibling grid unaffected** | **Yes** | §3.9 | `SimilarListingsView` still steps at 1536 | `task420-qa-grid-step.mjs` per-story, exit 0 |
| **New story in `--mantine-only`** | **Yes** | §3.7 | New canonical story adds no FAIL to the hard-blocking gate | `--mantine-only` FAIL delta = 0 |

## 12. Acceptance criteria

- **AC1 [R1,R4,R13]** Given the Featured grid, when `gridTemplateColumns` is read at
  320 / 640 / 768 / 1024 / 1280 / **1439 / 1440 / 1535 / 1536** / 1920, then the column counts are
  1 / 2 / 2 / 2 / 3 / **3 / 4 / 4 / 4** / 4, and the value does **not** change between 1535 and 1536.
- **AC2 [R2,R4,R13]** Given the Latest grid, at the same widths, then the column counts are
  1 / 1 / 2 / 2 / 2 / **2 / 3 / 3 / 3** / 3, and the value does **not** change between 1535 and 1536.
- **AC3 [R3,R13]** Given both grids at every AC1 width, then `columnGap` and `rowGap` are 16px (Featured) and 12px
  (Latest) — identical to the pre-change render at every width.
- **AC4 [R1,R2,R7,R13]** Given the **loading** branch of both Views, then its grid computes the SAME
  `gridTemplateColumns` / `columnGap` / `rowGap` as the populated branch at every AC1 width, and renders exactly
  3 (Featured) / 4 (Latest) skeletons.
- **AC5 [R5,R17]** *(rewritten in revision 7 — F1.)* Given `node scripts/task668-qa-header-geometry.mjs` run per
  §10.14 at **320 / 640 / 1440 × sq/en/uk/it**, then **both** of the following hold:
  - **(a) Computed rules.** The `Group` computes `display:flex`, **`flex-direction:row`**, `justify-content:space-between`,
    `align-items:center`, `flex-wrap:nowrap`, `margin-bottom:24px`, and `column-gap:16px`; `Title` + `ViewAllLink`
    are unchanged in order and conditional rendering. `flex-direction:row` is recorded as **equivalent to the old
    `display:flex` div's browser-default `row`** — Mantine declares it explicitly, the outcome is identical, and it
    is **not** an escalation trigger (§10.14).
  - **(b) Measured geometry.** For every cell, the live rects of `Group` / `Title` / `ViewAllLink` and the
    `clientWidth`/`scrollWidth` overflow state match the synthetic-`gap:0` measurement within **≤ 0.5px**, and the
    real `gap:16px` does not produce worse overflow than synthetic `gap:0`.

  Clause (a) alone is **NOT** sufficient and must not be reported as AC5 satisfied — that substitution is exactly the
  revision-6 defect. Free space is reported as diagnostic context only and is **not** a pass condition; a negative
  value with matching rects and matching overflow is not a failure. If either (b) trigger fires, the AC is **not**
  met: report the element, width, and locale, and stop for the owner decision (`gap={0}` or an explicit acceptance of
  the `page.tsx` L48 convergence) rather than choosing one unilaterally. The session log's visual-source-trace row for
  this artifact must then read `PRESERVE (rendered layout) — MEASURED` or `CHANGE (<element>, <width>, <locale>)`;
  an unmeasured `PRESERVE` claim is not acceptable.
- **AC6 [R6]** Given the DOM, then `.featured-listings` / `.latest-listings` appear on the loading grid only.
- **AC7 [R7,R8]** Given the **§3.11 targeted before/after file diff** of `FeaturedListingsView.tsx` and
  `LatestListingsView.tsx` (produced against the Phase-A0 content snapshot, **not** repo-wide `git diff` — both files
  are untracked, see §3.11), then card props, `getImagePriority()` index arguments, skeleton counts, the empty
  branch, and all `t()` keys are unchanged; the only differences in those two files are the grid/header containers
  and their imports. For the **tracked** files this task also touches (`src/stories/FeaturedListings.stories.tsx`,
  `src/stories/LatestListings.stories.tsx`, `scripts/check-stories-rendered.mjs`,
  `scripts/task420-qa-grid-step.mjs`, `scripts/mantine-migration-scope.json`), ordinary `git diff` is valid evidence
  and must also be quoted.
- **AC8 [R9]** Given the repo, then `npx tsc --noEmit` is clean and `npm run build` exits 0 (transcript included).
- **AC9 [R14]** Given `npm run screenshots:assert` run before and after the change, then a **manifest-based delta**
  (`.screenshots/rendered-assert/<ts>/manifest.json`, §3.10) shows: **zero new FAIL** among the task-owned cells —
  `system-featuredlistings--default`, `system-latestlistings--default`, and
  `patterns-mantine-homepagelistinggrids--default` — and the total FAIL count is **not higher** than the pre-change
  baseline. *(The process **exit code will be non-zero** in both runs: the harness sets exit 1 on any FAIL and the
  full run's own pre-change baseline already carries **953 FAIL across 7880 cells** (§3.10). ⚠️ Do **not** use
  `219 / 2116` here — that is the historical **`screenshots:assert:fast`** figure for a different, smaller matrix
  (revision 7, F4). Exit 0 is NOT a criterion for the full run and must not be
  reported as one. AC9 also deliberately does NOT claim full-matrix `Loading` or 1439/1535 coverage — the harness
  asserts `Default` for these IDs and sweeps `Loading` only in the geometry-only phase at 320/375/390. The
  moved-breakpoint proof is AC1–AC4 via R13.)*
- **AC10 [R10]** Given the repo, then `npm run check:story-coverage` exits 0 and reports **both** Views as covered by
  the new `Patterns/Mantine/*` story; the story imports them by direct file path, not via the barrel.
- **AC11 [R4]** Given the session log, then it contains an explicit **before/after** computed-grid table for all four
  grid containers at all AC1 widths, with the 1440–1535 rows labelled **`APPROVED CHANGE (owner 2026-07-26)`** and
  every other row labelled `UNCHANGED`. Any unlabelled difference outside 1440–1535 is a defect.
- **AC12 [R11,R12]** Given the repo, then `npm run check:stories`, `npm run governance:screenshots`,
  `npm run governance:components`, and `node scripts/task420-qa-grid-step.mjs` all exit 0, with Featured asserting the
  new 1440 step and Similar still asserting 1536; the existing `System/*` titles, exports, and IDs are unchanged.
- **AC13 [R14]** *(rewritten in revision 7 — F7.)* Given `npm run screenshots:assert -- --mantine-only`, then it
  **exits 0 with 0 FAIL** — not a delta. This run does **not** inherit the full run's historical FAIL: it skips the
  legacy `ASSERT_STORIES` and geometry-only phases, its recorded baseline is `0 FAIL`, and it is a hard-blocking CI
  gate (§3.10). The new canonical story must be present in the discovered set,
  `patterns-mantine-homepagelistinggrids--default` must PASS, and for
  `patterns-mantine-homepagelistinggrids--loading`:

  > the ID is present in `LOADER_ALLOWLIST`; its rendered verdict is **`pass`**, not `fail` and not `known-failure`.

  AMBIGUOUS counts must not increase versus the pre-change `--mantine-only` run.

  ⚠️ **Revisions 1–6 required this story to "appear as allowlisted". No such verdict exists** and that wording was
  unsatisfiable by construction: `scripts/check-stories-rendered.mjs` emits only `pass` / `fail` / `ambiguous` /
  `out-of-range` / `known-failure` (L1253, L858, L1250, L1484, L1564), while `LOADER_ALLOWLIST` is consulted purely by
  readiness/gating logic (L530, L851, L990) and never assigns a verdict. A static skeleton never trips the
  loader-timeout heuristic, so `pass` is the correct and expected outcome. The allowlist entry stays as a defensive
  registration per §10.11.b. Do **not** invent a verdict value, and do **not** mark this AC `VERIFIED` on the strength
  of a state the harness cannot emit.
- **AC13b [R14]** Given `npm run check:locale-leak:mantine-only`, then its report shows **no new leak attributable
  to the new story**, judged as a **delta**: this step is `continue-on-error: true` in CI (§3.10), so its exit code
  is not a gate.

## 13. QA profile and verification plan

**Profile: Q3 Full Visual Matrix.** Justification: a migrated Mantine responsive layout on the primary public route
with a deliberate owner-approved breakpoint change, plus a new canonical story and migration-scope enrolment —
`docs/qa-profiles.md` L15 covers "new or migrated Mantine primitive", "Storybook governance", and "high-risk
responsive work". Not Q4: no critical flow, auth, RLS, or data-loss path (§3.8). Not Q2: the layout genuinely changes
at a real viewport band.

### 🛑 13.0 — EXECUTION MODE. READ BEFORE ANY COMMAND.

**Task 668 is ALREADY IMPLEMENTED** (revision-6 execution, session log
`docs/sessions/2026-07-26-task668-homepage-grids-simplegrid-1440-alignment.md`). Revision 7 is a **remediation pass**,
not a fresh run.

> **For revision 7: START AT PHASE D, STEP 17. DO NOT RUN PHASE A0, PHASE A, PHASE B, OR PHASE C.**
> **DO NOT re-run `scripts/task668-qa-grid-1440.mjs --baseline`. DO NOT overwrite
> `.screenshots/task668/baseline.json`.** Reuse the recorded artifacts of the previous execution.

⚠️ **Why this is a hard stop, not a preference.** Phase A step 3 invokes `--baseline`, and `runBaseline()`
**unconditionally writes** `.screenshots/task668/baseline.json` (`scripts/task668-qa-grid-1440.mjs` L229–231). On the
current, already-migrated tree that would overwrite the pre-change grid data with post-change data. The baseline is
**not reconstructable** — the pre-change tree no longer exists in any buildable form — so AC1/AC2/AC4/AC11's entire
before/after proof would be destroyed irreversibly, and `--verify` would then compare the change against itself and
report a meaningless 160/160 PASS.

Phases A0–C below are retained **as the historical record of how the implementation was produced**, and remain
binding for anyone executing this task from scratch on an unchanged tree. They are **not** revision-7 instructions.

Artifacts to reuse as-is (do not regenerate): `.screenshots/task668/baseline.json`,
`.screenshots/task668/source-baseline/*.tsx`, `.screenshots/task668/verify-2026-07-26T23-53/manifest.json`,
`.screenshots/rendered-assert/2026-07-26T{18-37,23-55}/manifest.json`, and the Phase-A/C logs under
`.screenshots/task668/*.log`.

---

Verification plan **for a from-scratch execution on an unchanged tree** (see §13.0 — revision 7 skips to Phase D).
**Order is mandatory** — steps 1–3 run on the UNCHANGED tree, before any source edit. Both QA harnesses read
`storybook-static/`, so a stale bundle silently tests the wrong code; every capture is therefore preceded by its own
`build-storybook` (this mirrors CI, which builds Storybook before each gate — §3.10).

**Phase A0 — create the harness ONLY (no product/UI change yet).**
The baseline in Phase A is captured by `scripts/task668-qa-grid-1440.mjs`, which **this task creates** — so it cannot
already exist on an untouched tree. Resolve the ordering explicitly:

0. **Before writing anything, snapshot the worktree:** run read-only `git status --porcelain` and save the output as
   the **starting snapshot**. ⚠️ This worktree legitimately contains many pre-existing modified and untracked paths
   from other in-flight work (Task 665/666). They are **not yours**. Never run `git clean`, `git restore`,
   `git checkout --`, `git stash`, or any other mutating Git command — mutating Git is owner-only (`CLAUDE.md`).
1. Write `scripts/task668-qa-grid-1440.mjs` per §10.10 (both modes, dual locator) and, if needed, the `.gitignore`
   entry for its output directory. **Change nothing else** — no `Views`, no stories, no `ASSERT_STORIES`,
   no `LOADER_ALLOWLIST`, no manifest, no `task420` edit.
   *(This is why §10.10 forbids a Mantine-class-based locator: at this point the migrated markup does not exist yet.)*
1a. **Snapshot both target View files verbatim** into the ignored QA-artifact directory (§3.11) —
   `.screenshots/task668/source-baseline/FeaturedListingsView.tsx` and `…/LatestListingsView.tsx`. This is the ONLY
   way R7/R8 can be proven: both Views are **untracked**, so repo-wide `git diff` will show nothing for them. Take
   this snapshot **before** any edit to those files. Snapshot files live in the ignored directory and are never
   committed.
1b. **Exit criterion for A0 — a delta, never an absolute:** run `git status --porcelain` again and diff it against
   the step-0 starting snapshot. The **delta** must contain only `scripts/task668-qa-grid-1440.mjs` and, if it was
   needed, `.gitignore`. Any other path appearing in the delta means A0 changed more than it should — fix your own
   change; do not touch the pre-existing entries. **Do not require, expect, or produce a clean `git status`**: an
   absolute check against an empty worktree is impossible here and would push you toward destroying unrelated
   uncommitted work.

**Phase A — baselines, with the product tree still unchanged:**

2. `npm run build-storybook` → exit 0. Required before any capture. Valid here because Phase A0 touched no story
   or component source.
3. `node scripts/task668-qa-grid-1440.mjs --baseline` → **exit 0**, writes the stable baseline file. If this fails,
   the dual locator (§10.10) is wrong — fix the harness and re-run before touching the Views. A `--baseline` run
   that cannot find the pre-change Tailwind grid is a harness defect, not a product defect.
4. `npm run screenshots:assert` and `npm run screenshots:assert -- --mantine-only` → **record each manifest path and
   its FAIL/AMBIGUOUS counts.** For the **full** run a non-zero exit is EXPECTED (§3.10) and is not a failure of this
   step. For **`--mantine-only`** the expected baseline is **exit 0 / 0 FAIL**; if it is already failing before any
   change, STOP and report — that is a pre-existing repo problem, not this task's, and it must not be absorbed.
   Also record `npm run check:locale-leak:mantine-only`'s report as the leak baseline.

**Phase B — implement the product change and the remaining registrations** (§10.1–§10.9, §10.11–§10.13).

**Phase C — verification, on the changed tree:**

5. `npx tsc --noEmit` → 0 errors.
6. `npm run check:story-coverage` → **exit 0**, both Views reported covered (AC10).
7. `npm run check:stories` → **exit 0**.
8. `npm run build` → **exit 0** (mandatory non-Q0 hard gate; include the `✓ Compiled` + static-pages transcript).
9. `npm run build-storybook` → **exit 0**. Mandatory re-build: the steps below must not read the Phase-A bundle.
10. **`node scripts/task668-qa-grid-1440.mjs --verify` → exit 0 — the core evidence for this task.** Asserts the
   AC1–AC4 tables and diffs against the Phase-A baseline to produce the AC11 labelling.
   **Assert on computed values only (`gridTemplateColumns`, `columnGap`, `rowGap`) — do NOT assert byte-identical
   DOM.** The DOM is expected to differ: `SimpleGrid` replaces the Tailwind utility classes with Mantine-generated
   class and style rules (its responsive CSS is emitted through Mantine's `InlineStyles` mechanism, so the rules are
   not necessarily an inline `style` attribute on the grid element itself). A DOM diff is expected output, not
   evidence of a defect, and must not be used as a pass/fail criterion.
10b. **Targeted source diff (§3.11)** — for each of the two Views:
    `git diff --no-index .screenshots/task668/source-baseline/<File>.tsx src/modules/listings/components/<File>.tsx`.
    Expect a non-zero exit (that is how `--no-index` reports "files differ"); the criterion is the **content** of the
    diff, per AC7. Also run ordinary `git diff` for the tracked paths this task touches. A plain repo-wide `git diff`
    alone is NOT acceptable evidence for the two Views — it will be empty for them.
11. `node scripts/task420-qa-grid-step.mjs` → **exit 0**, with Featured asserting the new 1440 step through the new
    locator and Similar still asserting 1536 through the retained Tailwind-token locator (AC12).
12. `npm run screenshots:assert` (full) → compare its manifest against the Phase-A counterpart. **Judge by delta**
    (AC9): zero new FAIL on task-owned cells, totals not higher. Non-zero exit expected.
13. `npm run screenshots:assert -- --mantine-only` → **exit 0 with 0 FAIL** (AC13). This is a hard gate, not a
    delta: this run does not carry the full run's historical FAIL (§3.10).
14. `npm run check:locale-leak:mantine-only` → **delta** vs the Phase-A report (AC13b); exit code is not a gate.
15. `npm run governance:screenshots`, `npm run governance:components` → **exit 0**.
16. File-integrity/mojibake check on all touched text files.

**Phase D — revision 7 remediation (F1 / F3). ⬅️ THIS IS WHERE REVISION 7 STARTS (§13.0).**
Runs on the already-implemented tree. No product-code change, no `--baseline` re-run, no `baseline.json` write.

17. Apply the §10.15 one-line fix to `scripts/task668-qa-grid-1440.mjs` (F3).
18. Write `scripts/task668-qa-header-geometry.mjs` per §10.14.
19. **`npm run build-storybook` → exit 0. MANDATORY, not optional.** R16 requires a freshly built bundle before
    **every** rendered capture, and step 18 is a new capture. ⚠️ "No rebuild" in §10.14 means only "do not build a
    separate **pre-change** tree" — it never means reusing a stale `storybook-static/`. The bundle on disk may
    predate steps 17–18 and any interleaved work.
20. `node scripts/task668-qa-header-geometry.mjs` → **exit 0** (AC5). On an escalation trigger it must exit non-zero
    and name the element/width/locale; do not choose `gap={0}` or any other fix unilaterally — stop for the owner.
21. `node scripts/task668-qa-grid-1440.mjs --verify` → **exit 0**, re-run to confirm §10.15 did not disturb the
    160/160 result.
22. Update the session log: AC5 rewritten per the measured result, AC13 restated per its revision-7 wording, and the
    §2 visual-source-trace row for the header carrying `MEASURED` rather than an assumed `PRESERVE`.

**Exit-code expectations, so results are not misreported:**

| Must exit 0 | Expected non-zero (not this task's defect) | Exit code not a gate |
|---|---|---|
| 2, 3, 5, 6, 7, 8, 9, 10, 11, 13, 15, **19, 20, 21** | 4 (full run) and 12 (full run) — see the §3.10 full-run baseline (**953 FAIL / 7880 cells**, NOT the `--fast` 219/2116); 10b (`git diff --no-index` exits 1 whenever files differ, which is the expected result here) | 14 (`continue-on-error` in CI) |

Never report "exit 0" for a command that cannot produce it; never treat the full run's historical non-zero exit as
this task's defect; and never downgrade step 13 to a delta — `--mantine-only` has a `0 FAIL` baseline and blocks CI.

If any required gate cannot run (sandbox / native-binary / timeout limit), record it as missing evidence with the
exact native PowerShell command and return `PARTIALLY IMPLEMENTED` or `BLOCKED` — never a confidence claim.

## 14. Completion report contract (Sonnet)

The session log (`docs/sessions/2026-07-26-task668-*.md`) and the `docs/backlog.md` update must include: a
changed-files table matching the real diff — noting for each path whether it was tracked or untracked at the time,
since the two Views require the §3.11 snapshot diff rather than `git diff`; the **§3.11 targeted before/after diff**
for `FeaturedListingsView.tsx` and `LatestListingsView.tsx`, quoted, plus ordinary `git diff` for the tracked paths;
completed requirement IDs (R1–R17) each with evidence; every command run
with its actual result/exit code **in the §13 Phase A / B / C order** (build-storybook ×2, task668 `--baseline`,
baseline screenshots:assert runs, tsc, check:story-coverage, check:stories, build, task668 `--verify`, task420, the
post-change screenshots:assert + `--mantine-only` + locale-leak runs, governance:screenshots,
governance:components); the **AC11 before/after computed-grid table** with explicit `APPROVED CHANGE` / `UNCHANGED`
labels; the **manifest-delta** table for the **full** run only (task-owned cell verdicts + total FAIL/AMBIGUOUS
before vs after), with each manifest path quoted; for **`--mantine-only`**, the pass/fail statement is
**`exit 0` + `0 FAIL`** (AC13) — a before/after comparison may be included as *informative context* for the
AMBIGUOUS count, but must never be presented as the pass criterion; the locale-leak delta; the A0 `git status
--porcelain` **delta** against the starting snapshot (§13 A0.1b), showing only the harness path(s); confirmation that
`patterns-mantine-homepagelistinggrids--loading` is **registered in `LOADER_ALLOWLIST` and carries rendered verdict
`pass`, not `fail` and not `known-failure`** (revision 7, F7 — there is no `allowlisted` verdict) and is absent from the
known-failure registry; the `check:story-coverage` count before/after; the `task420` per-story table **and locator**
diff; assumptions/deviations/limitations; and the acceptance-criteria self-audit (AC1–AC13, incl. AC13b).

**Revision 7 additions to the report contract.** The session log must also carry: the §10.14 header table (live vs
synthetic-`gap:0` rects for `Group`/`Title`/`ViewAllLink`, `clientWidth`/`scrollWidth`, computed rules, and free
space as a diagnostic column) for all 12 cells; the verified premise that the `Group` root differs from the old
Tailwind `<div>` only in `display`/`flex-wrap`/`align-items`/`justify-content`/`gap`; the §10.15 one-line diff; the
step-19 `build-storybook` transcript **preceding** step 20; and AC5/AC13 restated in their revision-7 wording.
⚠️ Do not carry the revision-6 self-audit forward unchanged: AC5 was marked `VERIFIED` on computed-rule reasoning
that AC5 no longer accepts, and AC13 was marked `VERIFIED` against a verdict the harness cannot emit. Both must be
re-derived from the new evidence, and `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` remains the strongest valid
status.

For every command whose non-zero exit is EXPECTED (§13), report the exit code **and** the reason it is expected —
do not silently omit it, do not relabel it as exit 0, and do not attempt to drive the full run's historical FAIL
baseline (**953 FAIL / 7880 cells**, §3.10 — not the `--fast` 219/2116) to zero; that is out of scope. Set status to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`,
or `BLOCKED`. Do not self-approve. Do not run, emit, or suggest any mutating git command.

## 15. Task quality gate (orchestrator self-check — all pass)

- A fresh Sonnet can execute without chat context — yes (files, line numbers, verbatim markup, both breakpoint scales,
  gap tokens, story IDs and export names, fixture paths, harness model, and all four doc-string lines inlined).
- Every primary requirement has ≥1 binary AC and ≥1 verification method — yes (R1–R17 → AC1–AC13b + §13).
- **No retained step can destroy the evidence of a completed step** — yes (**revision 7**, §13.0): Phase A step 3
  writes `.screenshots/task668/baseline.json` unconditionally (`task668-qa-grid-1440.mjs` L229–231), and the
  pre-change tree is no longer buildable, so re-running Phase A on the implemented tree would irreversibly destroy
  the AC1/AC2/AC4/AC11 before/after proof. §13.0 pins revision 7 to start at Phase D step 17 and forbids the
  `--baseline` re-run; Phases A0–C are retained only as the from-scratch record.
- **Every step of the plan can run at the point the plan runs it** — yes (revision 4): Phase A0 creates the harness
  before Phase A invokes it, and touches nothing else, so the Phase-A baseline is still captured against unchanged
  product code.
- **Each gate is held to its own real baseline, not a borrowed one** — yes (revision 4, **corrected in revision 7**):
  the full run is delta-judged against **its own** pre-change baseline of **953 FAIL / 7880 cells**, NOT against the
  historical `screenshots:assert:fast` figure of `219 FAIL / 2116 cells` that revisions 1–6 mistakenly borrowed for
  it (F4 — two different matrices, both real, §3.10); `--mantine-only` is a separate run with a `0 FAIL` baseline and
  is held to exit 0 / 0 FAIL; locale-leak is delta-only because CI marks it `continue-on-error`.
- **Every AC is achievable with a named, existing-or-created command** — yes: revision 1's AC9 demanded full-matrix
  `Loading` + 1439/1535 evidence from `screenshots:assert`, which asserts only `Default` for these IDs and sweeps
  `Loading` in the geometry-only phase at 320/375/390. AC9 is now scoped to what that harness really covers, and the
  breakpoint proof moved to R13's dedicated `task668-qa-grid-1440.mjs`.
- **Every AC's pass condition matches the command's real exit semantics** — yes, as corrected in revision 4:
  **AC9** (full run) is a manifest-delta criterion, because that run sets exit 1 against its own historical baseline
  of **953 FAIL / 7880 cells** (revision 7, F4 — revisions 1–6 wrote `219` here, which is the `--fast` matrix); **AC13** (`--mantine-only`) is **exit 0 / 0 FAIL**, because it is a separate hard-blocking run that skips
  the legacy and geometry phases and has a `0 FAIL` baseline; **AC13b** (locale-leak) is delta-only, because CI marks
  it `continue-on-error` (§3.10). *(Revision 3 wrongly grouped AC13 with AC9 as manifest-delta — that grouping is
  withdrawn.)* §13 lists per-step exit expectations so a historical non-zero exit is not misreported as this task's
  defect — and so the executor cannot "fix" it.
- **Every evidence mechanism actually produces output for the files it is meant to cover** — yes (revision 5): R7/R8
  previously cited repo-wide `git diff`, which emits **nothing** for an untracked file, and both target Views are
  untracked (created by the still-uncommitted Task 665). Evidence is now the §3.11 snapshot-based file-to-file diff,
  with ordinary `git diff` retained only for the tracked paths.
- **No instruction can push the executor into destroying unrelated work** — yes (revision 4): A0's exit criterion is
  a **delta against a starting `git status --porcelain` snapshot**, never an absolute "clean worktree" check, and the
  task states outright that the pre-existing Task 665/666 modified/untracked paths are not the executor's and that
  mutating Git is owner-only.
- **Every harness the task depends on can actually run at the moment the plan runs it** — yes (revision 3): the
  `--baseline` mode asserts nothing and locates the grid mechanism-agnostically, so it works on the pre-change tree
  where no `SimpleGrid` exists and 1440 still shows the old counts; `task420`'s locator is fixed alongside its
  expected table, so the migrated Featured grid is still found.
- **Every harness reads fresh inputs** — yes (revision 3): `build-storybook` precedes each capture (R16), mirroring
  CI, so no result is produced from a stale `storybook-static/`.
- **Newly registered stories land in the right registry** — yes (revision 3): `--loading` goes to
  `LOADER_ALLOWLIST` (false-positive category, matching the `primitives-skeleton--listing-card-skeleton` precedent),
  explicitly NOT the known-failure registry, and `ASSERT_STORIES` gets only the populated `--default`, which is the
  one with a `.listing-card` anchor to assert.
- **No requirement contradicts a project governance rule** — yes: revision 1 migrated two production Views while
  skipping `mantine-migration-scope.json`. R10 now enrols both via a new canonical `Patterns/Mantine/*` story, with
  no retitling of the `System/*` stories (§3.7).
- Scope protects existing behavior and names what must not change — yes (§8; plus §3.9 catches a harness that would
  otherwise fail falsely, and §3.6 prevents a locator-breaking "consistency" edit).
- Current/legacy UI boundary, QA profile, locales, Storybook obligations explicit — yes (current Mantine path, Q3,
  4 locales, new canonical story + existing `System/*` proof path).
- Canonical UI decision record present with search evidence; every style disposition is `reuse` with a named in-repo
  precedent; the one new artifact (the story) is justified by the enrolment mechanism, not invented styling — yes.
- Trace's change/preserve classifications agree with owner intent — yes: the 1440 step is the only intended visual
  change and is recorded as owner-approved in §1, §9, AC11.
- Negative flows selected by applicability — yes (§11: loading, empty, partial fill, both boundaries, uk@320, sibling
  grid, new-story gate impact).
- No uninspected command/file/story/behavior claimed — yes (all paths, line numbers, export names, and script
  internals inspected 2026-07-26).
- Gates prove the changed behavior — yes: AC1/AC2 assert the moved step at the exact 1439/1440 and 1535/1536
  boundaries via a harness built for it, and §13.9 forbids the byte-identical-DOM criterion that would have made the
  task unsatisfiable.
- Assumptions and unresolved decisions visible — yes (§5: A1 resolved, A2 requires re-verification with a STOP
  condition, OQ1–OQ3 deferred).

---

**Task path:** `tasks/kickoff_prompt_Task_668_Homepage_Grids_SimpleGrid_1440_Alignment.md`
**QA profile:** Q3 Full Visual Matrix.
**Ambiguous/conflicting requirements:** none. Revision 1's two blockers are resolved in-task (§5 A1, AC9/R13);
revision 2's five P0 blockers are resolved by R12–R16 (§3.9, §3.10, §10.9, §10.10, §10.11, §13); revision 3's two
P0 blockers are resolved by the Phase A0 split (§13) and the corrected `--mantine-only` baseline (§3.10, AC13/AC13b);
revision 4's P0 is resolved by A0's snapshot-delta exit criterion (§13 A0.0/A0.1b); revision 5's P0 is resolved by
the §3.11 targeted source-snapshot diff (§13 A0.1a + step 10b, R7/R8, AC7).
**Owner decision still needed:** none for execution. OQ3 (`MantineHomeSection`'s own 1536px band-padding step, now
inconsistent with the 1440 grids) is recorded for a separate follow-up decision.

## 16. Commit sequencing — revision 7, F2 (owner action, NOT an executor action)

No isolated commit handoff for Task 668 is constructible from the current worktree. Four of this task's tracked
paths carry Task 668 **and** unreviewed Task 665 changes in the same diff:

- `src/stories/FeaturedListings.stories.tsx`
- `src/stories/LatestListings.stories.tsx`
- `scripts/check-stories-rendered.mjs`
- `scripts/task420-qa-grid-step.mjs`

`docs/backlog.md` additionally carries 665/666/668 state, and Task 665 is `PARTIALLY VERIFIED` (`docs/backlog.md`).
Staging any of these paths therefore commits unreviewed Task 665 work, so the orchestrator withholds the handoff
under the `STATUS/REPORT MISMATCH` rule until the owner picks one:

1. close Task 665 first, then commit 668 on top; or
2. accept an explicit combined `665 + 666 + 668` commit.

⚠️ The executor must not attempt to resolve this. Mutating Git is owner-only and native-PowerShell-only, and the
`git clean` / `git restore` / `git checkout --` / `git stash` family is prohibited outright — both target Views are
untracked, so those commands would destroy Task 665's uncommitted work rather than recover it.

Independent of sequencing: `docs/backlog.md` is at **88 physical lines** against the 80-line cap
(`BACKLOG LIMIT BREACH`, correctly flagged by the executor and carried over from Task 665/666). Consolidation is an
orchestrator duty and is deferred until this task's review closes.
