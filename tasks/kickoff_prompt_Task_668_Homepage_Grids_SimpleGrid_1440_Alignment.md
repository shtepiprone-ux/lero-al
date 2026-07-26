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
| The pre-change full-run baseline already carries **219 FAIL** (historical, unrelated to this task) | `docs/backlog.md` Task 665 entry: "1827/2116 PASS, 219 FAIL unchanged vs baseline" |
| ⇒ **"`screenshots:assert` exits 0" is unachievable** and must never be an acceptance criterion for the full run | the two rows above |
| The run emits a machine-readable `.screenshots/rendered-assert/<ts>/manifest.json` with `{ timestamp, summary, matrix }` (story × viewport × locale, PASS/FAIL) | L1561, L1593–1594, L1759 |
| ⇒ for the **full** run the correct criterion is a **manifest-based delta** on task-owned cells, not the process exit code | — |
| ⚠️ **`--mantine-only` is a DIFFERENT run with a DIFFERENT baseline — it does NOT inherit the 219 FAIL.** It skips the legacy `ASSERT_STORIES` and geometry-only phases and covers only `Mantine/Primitives/*` + `Patterns/Mantine/*`. Its recorded baseline is **`0 FAIL`** | `docs/sessions/2026-07-23-task663-harness-backdrop-overlap-downgrade.md` R4/AC4: "1064 cells, 1021 PASS, **0 FAIL**, 43 ambiguous" before / "1064 cells, 1042 PASS, **0 FAIL**" after; `docs/backlog.md` Task 663: "`0 FAIL` both before/after" |
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
| R5 | §3.1 | The Featured header row (L47) renders via Mantine `Group` with `justify="space-between"`, `align="center"`, `wrap="nowrap"`, and a computed `margin-bottom` of 24px; `Title` + `ViewAllLink` unchanged. | P1 | computed style | Confirmed |
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
| R16 | §3.10 / §13 | `npm run build-storybook` runs immediately before **every** harness capture (Phase A baseline and Phase C verification), so no harness reads a stale `storybook-static/`. | P0 | command transcripts, in order | Confirmed |

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
- **AC5 [R5]** Given the Featured header row, then computed `display:flex`, `justify-content:space-between`,
  `align-items:center`, `flex-wrap:nowrap`, `margin-bottom:24px`, with `Title` + `ViewAllLink` unchanged in order and
  conditional rendering.
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
  repo baseline already carries 219 historical FAIL. Exit 0 is NOT a criterion for the full run and must not be
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
- **AC13 [R14]** Given `npm run screenshots:assert -- --mantine-only`, then it **exits 0 with 0 FAIL** — not a
  delta. This run does **not** inherit the full run's 219 historical FAIL: it skips the legacy `ASSERT_STORIES` and
  geometry-only phases, its recorded baseline is `0 FAIL`, and it is a hard-blocking CI gate (§3.10). The new
  canonical story must be present in the discovered set, `patterns-mantine-homepagelistinggrids--default` must PASS,
  and `patterns-mantine-homepagelistinggrids--loading` must appear as **allowlisted** — not FAIL, and not in the
  known-failure registry. AMBIGUOUS counts must not increase versus the pre-change `--mantine-only` run.
- **AC13b [R14]** Given `npm run check:locale-leak:mantine-only`, then its report shows **no new leak attributable
  to the new story**, judged as a **delta**: this step is `continue-on-error: true` in CI (§3.10), so its exit code
  is not a gate.

## 13. QA profile and verification plan

**Profile: Q3 Full Visual Matrix.** Justification: a migrated Mantine responsive layout on the primary public route
with a deliberate owner-approved breakpoint change, plus a new canonical story and migration-scope enrolment —
`docs/qa-profiles.md` L15 covers "new or migrated Mantine primitive", "Storybook governance", and "high-risk
responsive work". Not Q4: no critical flow, auth, RLS, or data-loss path (§3.8). Not Q2: the layout genuinely changes
at a real viewport band.

Verification plan. **Order is mandatory** — steps 1–3 run on the UNCHANGED tree, before any source edit. Both QA
harnesses read `storybook-static/`, so a stale bundle silently tests the wrong code; every capture is therefore
preceded by its own `build-storybook` (this mirrors CI, which builds Storybook before each gate — §3.10).

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

**Exit-code expectations, so results are not misreported:**

| Must exit 0 | Expected non-zero (not this task's defect) | Exit code not a gate |
|---|---|---|
| 2, 3, 5, 6, 7, 8, 9, 10, 11, 13, 15 | 4 (full run) and 12 (full run) — 219-FAIL historical baseline; 10b (`git diff --no-index` exits 1 whenever files differ, which is the expected result here) | 14 (`continue-on-error` in CI) |

Never report "exit 0" for a command that cannot produce it; never treat the full run's historical non-zero exit as
this task's defect; and never downgrade step 13 to a delta — `--mantine-only` has a `0 FAIL` baseline and blocks CI.

If any required gate cannot run (sandbox / native-binary / timeout limit), record it as missing evidence with the
exact native PowerShell command and return `PARTIALLY IMPLEMENTED` or `BLOCKED` — never a confidence claim.

## 14. Completion report contract (Sonnet)

The session log (`docs/sessions/2026-07-26-task668-*.md`) and the `docs/backlog.md` update must include: a
changed-files table matching the real diff — noting for each path whether it was tracked or untracked at the time,
since the two Views require the §3.11 snapshot diff rather than `git diff`; the **§3.11 targeted before/after diff**
for `FeaturedListingsView.tsx` and `LatestListingsView.tsx`, quoted, plus ordinary `git diff` for the tracked paths;
completed requirement IDs (R1–R16) each with evidence; every command run
with its actual result/exit code **in the §13 Phase A / B / C order** (build-storybook ×2, task668 `--baseline`,
baseline screenshots:assert runs, tsc, check:story-coverage, check:stories, build, task668 `--verify`, task420, the
post-change screenshots:assert + `--mantine-only` + locale-leak runs, governance:screenshots,
governance:components); the **AC11 before/after computed-grid table** with explicit `APPROVED CHANGE` / `UNCHANGED`
labels; the **manifest-delta** table for the **full** run only (task-owned cell verdicts + total FAIL/AMBIGUOUS
before vs after), with each manifest path quoted; for **`--mantine-only`**, the pass/fail statement is
**`exit 0` + `0 FAIL`** (AC13) — a before/after comparison may be included as *informative context* for the
AMBIGUOUS count, but must never be presented as the pass criterion; the locale-leak delta; the A0 `git status
--porcelain` **delta** against the starting snapshot (§13 A0.1b), showing only the harness path(s); confirmation that
`patterns-mantine-homepagelistinggrids--loading` is allowlisted rather than failing and is absent from the
known-failure registry; the `check:story-coverage` count before/after; the `task420` per-story table **and locator**
diff; assumptions/deviations/limitations; and the acceptance-criteria self-audit (AC1–AC13, incl. AC13b).

For every command whose non-zero exit is EXPECTED (§13), report the exit code **and** the reason it is expected —
do not silently omit it, do not relabel it as exit 0, and do not attempt to drive the historical 219-FAIL baseline
to zero; that is out of scope. Set status to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`,
or `BLOCKED`. Do not self-approve. Do not run, emit, or suggest any mutating git command.

## 15. Task quality gate (orchestrator self-check — all pass)

- A fresh Sonnet can execute without chat context — yes (files, line numbers, verbatim markup, both breakpoint scales,
  gap tokens, story IDs and export names, fixture paths, harness model, and all four doc-string lines inlined).
- Every primary requirement has ≥1 binary AC and ≥1 verification method — yes (R1–R16 → AC1–AC13b + §13).
- **Every step of the plan can run at the point the plan runs it** — yes (revision 4): Phase A0 creates the harness
  before Phase A invokes it, and touches nothing else, so the Phase-A baseline is still captured against unchanged
  product code.
- **Each gate is held to its own real baseline, not a borrowed one** — yes (revision 4): the full run is delta-judged
  against 219 historical FAIL; `--mantine-only` is a separate run with a `0 FAIL` baseline and is held to exit 0 /
  0 FAIL; locale-leak is delta-only because CI marks it `continue-on-error`.
- **Every AC is achievable with a named, existing-or-created command** — yes: revision 1's AC9 demanded full-matrix
  `Loading` + 1439/1535 evidence from `screenshots:assert`, which asserts only `Default` for these IDs and sweeps
  `Loading` in the geometry-only phase at 320/375/390. AC9 is now scoped to what that harness really covers, and the
  breakpoint proof moved to R13's dedicated `task668-qa-grid-1440.mjs`.
- **Every AC's pass condition matches the command's real exit semantics** — yes, as corrected in revision 4:
  **AC9** (full run) is a manifest-delta criterion, because that run sets exit 1 against a 219-FAIL historical
  baseline; **AC13** (`--mantine-only`) is **exit 0 / 0 FAIL**, because it is a separate hard-blocking run that skips
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
