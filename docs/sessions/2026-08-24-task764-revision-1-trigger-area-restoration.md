# Task 764 Revision 1 — trigger area restoration, F1/F2/F4 closure

**Task:** `tasks/Sprints/Sprint_63_Task_764_revision_1_trigger_area_restoration.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**Base commit:** `1d9fa77cf8b18a75560b661a3281351d45bc46c1` (unchanged — HEAD not moved this session)
**QA profile:** Q4

## 1. I0 drift

`git status --porcelain` and `git rev-parse HEAD` matched the expected Task 764 dirty working set and base
commit exactly. `docs/sessions/evidence/task764/phase-a-pointer-matrix.pre-edit.json` was already `M` (modified)
in the working tree **before this session started** — confirmed by re-reading the conversation's own initial
`gitStatus` block, and confirmed no command run in this session writes to that exact path (`favorites`/`matrix`
probe modes write to `rev1-favorites-composition.*.json` / `phase-a-pointer-matrix.rev1-final.json`, never
`*.pre-edit.json`). This is inherited predecessor-session drift, not caused by Revision 1.

Re-read facts at §3.1–§3.5's cited lines: all confirmed current, no drift.

## 2. Requirement / acceptance-criteria evidence

| ID | Status | Evidence |
|---|---|---|
| R13/AC14 | Confirmed | `MantineListingCardPattern.tsx` — `imageActions?: ReactNode` prop, rendered in the grid `Card.Section` after `{badges}`; list branch diff empty (only `imageActions` prop threaded, unused in the list return). `MantineListingCardPattern.smoke.test.tsx` — 3 new tests: renders inside `.mantine-Card-section` after badges (DOM-order proof), absent in `layout="list"`, absent when omitted. |
| R14/AC15 | Confirmed | `FavoritesShell.tsx` — `group`/`group-hover:` wrapper and sibling overlay div removed; `SaveToCollectionButton` passed through `ListingCard`'s new `imageActions` prop, forwarded unchanged to the pattern. `grep -rn "group-hover:\|'group'" src/` — 0 hits. RTL containment test (`ListingCard.smoke.test.tsx`) proves descendant of both `.cardGrid` and `.imageSection` (the latter is the invariant that actually discriminates the P3 mutation — see §5). |
| R15/R16/AC16 | Confirmed | `rev1-favorites-composition.post.json`: hover-on-action `effectiveScale` = 1.1025 (w/h, 4dp), equal to hover-on-image/hover-on-title in the same artifact. `elementAtActionCentre` resolves to the action's own icon/button (`closestButtonAriaLabel: "Save to collection"`), never a badge. |
| R17/AC17 | Confirmed | Source: `.module.css` reveal rule — hover arm `@media (hover: hover)` only (no `pointer: fine`); `focus-within` arm no media guard. Measured: `rev1-favorites-composition.post.json` `coarseOverride.reveal` = `{actionOpacityAtRest: "0", actionOpacityOnCardHover: "1"}` — reveals correctly under the coarse-override `(hover:hover, pointer:coarse, !pointer:fine)` context. |
| R18/AC18 | Confirmed | `grep -rn "group-hover:\|'group'" src/` — 0 hits (post-revert). No `:has()`, no cross-module selector in the diff (inspected `git diff` on the CSS module — only `.imageActions`/`.cardGrid`-scoped rules added). |
| R19/AC19 | Confirmed | `phase-a-pointer-matrix.rev1-final.json` — `reducedMotion` context (real Playwright `newContext({reducedMotion:'reduce'})`): grid image-hover and title-hover both `effectiveScale` 1.0000, `transform: none`. Measured, not reasoned (A6 closed). |
| R20/AC20 | Confirmed | `rev1-plant-p1-transcript.txt` / `rev1-plant-p2-transcript.txt` — both non-zero exit, expected-FAIL observed. `compare-phase-c.mjs` and both plant scripts untouched this session (`git status --porcelain` still shows them `??`, unedited). `compare-phase-c.mjs` re-run: 21/21 PASS, exit 0 — original invariants unchanged. |
| R21/AC21 | Confirmed | `docs/sessions/evidence/task764/build-transcript.txt` — `EXIT_CODE=0`. |
| R22/AC22 | Confirmed, with a recorded kickoff-fact correction | See §5 (Q4 planted-violation section) below. |
| R23/AC23 | Confirmed | Both canonical Stories render the new slot with the real `SaveToCollectionButton` (not a demo stand-in): `ListingCard.stories.tsx`'s new `FavoritesComposition` export (byte-identical composition to `FavoritesShell.tsx`) and `ListingCardPattern.stories.tsx`'s `Default` export (`DemoCard id="1"`, `withImageActions`), both under a mocked signed-in `AuthContext.Provider`. `check:stories` PASSED — 129 files, 0 violations. `screenshots:assert --mantine-only` — see §6 (gate result is non-zero overall, but 0 of the failing/ambiguous cells involve any `ListingCard`/`MantineListingCardPattern` story; all failures are pre-existing `AuthSheet` cells, unrelated to this revision's scope). |
| R24/AC24 | Confirmed | Every retained transcript in `docs/sessions/evidence/task764/rev1-*` carries the five-line header (`EXECUTION_PLATFORM`/`NODE_VERSION`/`CWD`/`COMMAND`/`EXIT_CODE`), platform `win32` throughout. |

## 3. Current vs required behaviour

Matches kickoff §9 exactly. Fine-pointer hover on the save action now yields `effectiveScale` 1.1025 (was: no
zoom, action outside the hover chain) — measured equal to image/title hover in the same artifact. List card,
badge paint order, reveal semantics (hover/focus-within guards), and reduced-motion behaviour are all
byte/measured-unchanged. Tailwind `group`/`group-hover:` fully removed from the Favorites surface.

## 4. Files changed

| Path | Reason |
|---|---|
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | Add `imageActions?: ReactNode` prop; render inside the grid `Card.Section`, after `{badges}`. |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | New `.imageActions` wrapper class (position/z-index/opacity/transition) + reveal rules (`(hover: hover)`-only hover arm, unguarded `focus-within` arm). |
| `src/modules/listings/components/ListingCard.tsx` | Add and forward `imageActions?: ReactNode` (vertical branch only). |
| `src/modules/listings/components/FavoritesShell.tsx` | Remove the `relative group` wrapper and the sibling overlay div; pass `SaveToCollectionButton` through the new `imageActions` prop. |
| `scripts/task764-pointer-probe.mjs` | Add `reducedMotion` matrix context (F4); add `favorites` CLI mode (R-A/R-D pointer-geometry + reveal-opacity capture for the Favorites composition, both fine and coarse-override contexts). |
| `src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx` | 3 new tests covering the `imageActions` slot (grid containment/paint-order, list-absence, omitted-absence). |
| `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` | Real-auth `useAuth`/`getCollectionsWithMembership` mocks; new RTL containment test (real `SaveToCollectionButton`, descendant of both `.cardGrid` and `.imageSection`). |
| `src/stories/mantine/primitives/ListingCard.stories.tsx` | New `FavoritesComposition` export — real `ListingCard` + real `SaveToCollectionButton` via `imageActions`, same composition `FavoritesShell.tsx` uses. |
| `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` | `Default`'s regular grid card now renders the real `SaveToCollectionButton` via `imageActions`, wrapped in a signed-in `AuthContext.Provider`. |
| `docs/sessions/evidence/task764/rev1-*` (28 new files) | Retained transcripts/artifacts for this revision (see §6). |
| `docs/sessions/evidence/task764/rev1-plant-p4-compare.mjs` | New P4 comparator (mirrors the existing P1/P2 plant-check convention). |

`src/components/ui/appImageConfig.ts` and the grid `Card`'s `className` list in `MantineListingCardPattern.tsx`
were **temporarily** mutated for the R-A baseline and R-F P3 plants, then fully reverted — final `git diff` on
both is byte-identical to session start (proven in `rev1-baseline-revert-proof.txt` for R-A; the P3/P4 CSS/TSX
mutations left no residual marker, confirmed via `grep -n "PLANTED\|TEMPORARY"` returning empty).

## 5. A4 — the pre-fold baseline (Phase R-A)

No pre-existing artifact for the Favorites-composition trigger area (A4, `UNKNOWN` at filing). Built a
controlled, temporary pre-fold baseline per §10.1:

1. Added `ListingCard.stories.tsx`'s `FavoritesComposition` export, initially in the **pre-fold form**
   (byte-identical to `FavoritesShell.tsx`'s then-current sibling-overlay/`relative group` composition — the
   `imageActions` prop did not exist yet at this point in the revision, so the story could not use it).
2. Temporarily re-added `appImageConfig.ts`'s `listing.hoverClass: 'group-hover:scale-105'` and `'group'` on
   `MantineListingCardPattern.tsx`'s grid `Card`.
3. Built Storybook, probed via `node scripts/task764-pointer-probe.mjs favorites pre-fold`.
4. **Result:** `rev1-favorites-composition.pre-fold.json` — hover-on-action `effectiveScale` = **1.0500**,
   matching the ≈1.05 gate. **A4 answer: confirmed 1.05x, gate PASS, not `BLOCKED`.**
   *(Note recorded honestly: the same artifact's hover-on-image/title values read 1.1576, not 1.05 or 1.1025 —
   this is expected contamination, not a measurement error: the already-landed Task 764 `.cardGrid:hover`
   fold rule (`transform: scale(1.1025)`) coexists with the temporarily-restored Tailwind `group-hover:scale-105`
   `scale` property when hovering the CARD itself, composing multiplicatively (1.1025 × 1.05 = 1.157625). This
   does not affect the action-hover measurement, which is outside `.cardGrid`'s `.imageSection` and the sole
   value the A4 gate depends on.)*
5. Reverted `appImageConfig.ts` and `MantineListingCardPattern.tsx` completely — proven byte-for-byte identical
   to their pre-baseline `git diff` in `rev1-baseline-revert-proof.txt` (`IDENTICAL=True`).
6. Implemented Phase R-B (the real `imageActions` slot), then updated `FavoritesComposition` to its final form
   (real `SaveToCollectionButton` via the new prop — the same composition production now uses).

**Post-implementation probe** (`rev1-favorites-composition.post.json`, Phase R-D): hover-on-action
`effectiveScale` = **1.1025**, equal to hover-on-image/hover-on-title in the same artifact (AC16 met).

## 6. F4 — reduced motion (Phase R-C)

Added a real `prefers-reduced-motion: reduce` Playwright context (`newContext({reducedMotion:'reduce'})`, not a
CSS/reasoning claim) to `task764-pointer-probe.mjs`'s `matrix` mode. `phase-a-pointer-matrix.rev1-final.json`:
grid card image-hover and title-hover both `effectiveScale` 1.0000, computed `transform: none`. This closes F4
as a measurement; the predecessor review's cascade-source-order reasoning (A6) is not cited as the result.

## 7. F2 — the retained plants, re-run unchanged

`rev1-plant-p1-transcript.txt`: `EXIT_CODE=1` — plant-p1's `effectiveScale.w` (1.05) differs from the 1.1025
baseline, comparator correctly detects it.
`rev1-plant-p2-transcript.txt`: `EXIT_CODE=1` — plant-p2's transform is already-settled at t=75ms (no mid-flight
easing), comparator correctly detects it.
Neither `compare-phase-c.mjs` nor either plant script was edited this session (`git status --porcelain` still
lists all three as untracked/unmodified `??`).

## 8. F1 — the build

`docs/sessions/evidence/task764/build-transcript.txt` — `next build`, `EXIT_CODE=0`.

## 9. Q4 planted-violation results (Phase R-F) — includes a corrected kickoff fact

**P3** (kickoff: "render `imageActions` as a sibling of `Card.Section` instead of inside it"):

- **Measured, not assumed:** this exact mutation (sibling of `Card.Section`, still a child of the outer `Card`)
  does **not** produce the kickoff's predicted `effectiveScale` 1.0000 — the action remains a descendant of
  `.cardGrid`, and CSS `:hover` propagates to every ancestor of the hovered element regardless of DOM depth, so
  `.cardGrid:hover` still fires and the image still zooms to 1.1025 (`rev1-favorites-composition.plant-p3.json`).
  The kickoff-specified RTL assertion ("descendant of `.cardGrid`") also does **not** fail under this exact
  mutation, for the identical reason — confirmed empirically (`rev1-plant-p3-rtl-transcript.txt`, first run:
  1 passed, 13 skipped, `EXIT_CODE=0`).
- **Correction applied and recorded in the test itself** (not silently): the RTL containment test in
  `ListingCard.smoke.test.tsx` was strengthened with a second assertion — containment inside `.imageSection`
  (the `Card.Section`) specifically, which is the invariant §3.2 actually establishes and the one that
  genuinely discriminates this mutation. Re-run under the plant: `rev1-plant-p3-rtl-transcript.txt` —
  **`EXIT_CODE=1`**, real assertion failure (`toContainElement` — the `.imageSection` element does not contain
  the save button). Reverted; clean re-run — `EXIT_CODE=0`, 14/14 passed.
- No existing gate would have caught the literal kickoff-specified mutation via the `.cardGrid`-only
  containment check or the effectiveScale metric; only the corrected `.imageSection` containment assertion
  does.

**P4** (reveal hover-arm guard changed to `(hover: hover) and (pointer: fine)`):

- Mutated `MantineListingCardPattern.module.css`'s `.imageActions` hover-arm media query. Rebuilt Storybook,
  re-probed the coarse-override context: `rev1-favorites-composition.plant-p4.json` —
  `coarseOverride.reveal.actionOpacityOnCardHover` = `"0"` (stayed hidden — guard now requires `pointer:fine`,
  which the coarse-override context reports `false`).
- New comparator `rev1-plant-p4-compare.mjs` (mirrors the P1/P2 convention): asserts
  `actionOpacityAtRest==='0' && actionOpacityOnCardHover==='1'` on the coarse-override capture.
  `rev1-plant-p4-fail-transcript.txt` — **`EXIT_CODE=1`**, genuine FAIL. Reverted; `rev1-plant-p4-clean-transcript.txt`
  — `EXIT_CODE=0`, clean.
- No existing gate would have caught this without the new coarse-override reveal capture — the `fine`-context
  capture alone is blind to a `pointer:fine`-narrowed guard (fine context always reports `pointer:fine:true`).

## 10. Validation evidence — full command list, final diff

All commands run in native Windows PowerShell (`node.exe`/`npm.cmd`/`npx.cmd`), platform `win32` confirmed at
session start (`rev1-platform-attestation.txt`) and on every retained transcript.

| Command | Result | Transcript |
|---|---|---|
| `npm.cmd run typecheck` | `EXIT_CODE=0` | `rev1-typecheck-final-transcript.txt` |
| `npx.cmd vitest run` (both card suites) | 22/22 PASS, `EXIT_CODE=0` | `rev1-card-suites-transcript.txt` |
| `npm.cmd run test:listings` | 45/45 PASS, `EXIT_CODE=0` | `rev1-test-listings-transcript.txt` |
| `npm.cmd run check:tailwind-runtime-tokens` | 0 new debt, `EXIT_CODE=0` | `rev1-tailwind-runtime-tokens-transcript.txt` |
| `npm.cmd run check:design-tokens` (`--strict`) | `EXIT_CODE=1` — same 2 pre-existing `AppImage.module.css` findings, no third | `rev1-design-tokens-transcript.txt` |
| `npm.cmd run check:homepage-grid` | 260/260 PASS, `EXIT_CODE=0` | `rev1-homepage-grid-transcript.txt` |
| `npm.cmd run build-storybook` | `EXIT_CODE=0` (run 3× across R-A/P3/P4/final) | `rev1-build-storybook-final-transcript.txt` (+ prefold/plant-p3 variants) |
| `npm.cmd run screenshots:assert -- --mantine-only` | `EXIT_CODE=1` — 1225/1332 PASS, 80 FAIL, 27 AMBIGUOUS; **all 80 FAIL cells and all 27 AMBIGUOUS cells are `AuthSheet`/`AdminUsersTable`/`Combobox`/`PopularLocationsView` — 0 involve any `ListingCard`/`MantineListingCardPattern` story**; see §11 | `rev1-screenshots-assert-transcript.txt` |
| `npm.cmd run check:stories` | 129 files, 0 violations, `EXIT_CODE=0` | `rev1-check-stories-transcript.txt` |
| `npm.cmd run screenshots:responsive -- --mantine-only` | 296/296 captured, 0 failed, `EXIT_CODE=0` | `rev1-screenshots-responsive-transcript.txt` |
| `npm.cmd run check:mojibake` | 0 artifacts / 3200 files, `EXIT_CODE=0` | `rev1-mojibake-final-transcript.txt` |
| `npm.cmd run check:file-integrity` | 80/80 clean, `EXIT_CODE=0` | `rev1-file-integrity-final-transcript.txt` |
| `node.exe docs/sessions/evidence/task764/compare-phase-c.mjs` | 21/21 PASS, `EXIT_CODE=0` | `rev1-compare-phase-c-rerun-transcript.txt` |
| `npm.cmd run build` | `EXIT_CODE=0` | `build-transcript.txt` |

Rendered proof: two Storybook builds (R-A pre-fold state, final state) + one intermediate per plant (P3, P4);
`rev1-favorites-composition.{pre-fold,post,plant-p3,plant-p4}.json`; `phase-a-pointer-matrix.rev1-final.json`.

## 11. Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Token/utility path | Change/preserve | Evidence |
|---|---|---|---|---|---|
| Save action position (top-2/left-2) | `Box` in `Card.Section` | `.imageActions` | `var(--space-2)` × 2 (reproduces `.badgesGrid`'s own values) | Change (new slot, same offsets as the retired sibling-overlay div) | `.module.css` §10.2, measured via `elementAtActionCentre` |
| Save action paint order vs badges | same | `.imageActions` `z-index: 1` | new — no existing z-index token at this stacking scope; `design-tokens-allow` marker added | Preserve (already-above today) | Grid occupancy unchanged; visually verified via DOM order + explicit z-index |
| Reveal opacity/transition | `.imageActions` | `opacity`/`transition-property`/`-duration`/`-timing-function` | Reproduces Tailwind's compiled `transition-opacity` values, same precedent as `.cardTitle` (`:254-255`) | Preserve (identical values, new mechanism) | Source inspection + `rev1-favorites-composition.post.json` reveal capture |
| Card zoom on hover (image/title/action) | `.cardGrid:hover .imageSection img` | unchanged (Task 764's own fold, not touched) | `scale(1.1025)` | Preserve, extended to cover the action-hover case (F3 fix) | `compare-phase-c.mjs` 21/21 unchanged + `rev1-favorites-composition.post.json` |
| List layout | — | — | — | Preserve, byte-identical (Q2, no `imageActions` consumer) | `MantineListingCardPattern.smoke.test.tsx` list-absence test |

## 12. Canonical UI decision record

Both `imageActions` consumer sites reuse the pattern's own existing `favorite`-slot precedent (§3.2) — no new
canonical primitive was needed. The wrapper class (`.imageActions`) is a new, task-scoped addition to the
pattern's own already-unlayered CSS Module (D34 precedent, same file), placed next to `.badgesGrid` per the
kickoff. Canonical Story search: `ListingCardPattern.stories.tsx` (pattern-level) and `ListingCard.stories.tsx`
(primitive-level, real production component) were both inspected and updated in this task — no other story
scope search was needed since the kickoff itself named both required files (§7 items 7).

## 13. Implementation validation notes

- Discovered and corrected a kickoff-fact defect in §10.6's P3 mutation description (see §9) — recorded, not
  silently patched around; the RTL test itself now documents the correction inline.
- `screenshots:assert --mantine-only` exits non-zero, but the failing/ambiguous population is disjoint from this
  revision's touched stories (see §11 detail below). This is reported as a gap, not claimed as a pass.

## 14. Assumptions, deviations, and limitations

- **A4:** resolved — 1.05x confirmed on the pre-fold save-action hover, gate PASS (not `BLOCKED`).
- **A5:** no rest-state pixel delta was found in any comparator/probe artifact for either the pattern or
  `ListingCard` stories; `screenshots:responsive`/`screenshots:assert` show no ListingCard-family regression.
- **A6:** closed — measured, not reasoned (§6).
- **Q2/Q3:** left out of scope exactly as specified (list layout gets no `imageActions` consumer; touch
  invisible-but-tappable overlay untouched).
- **`screenshots:assert --mantine-only` exits 1** on this run. The 80 FAIL cells are 100% `Patterns/Mantine/AuthSheet/*`
  (Login/Register/Register Agent/Register Agent Add Company/Forgot Password — `page.goto` `networkidle` timeouts
  and pre-existing "text button not full-width" content failures) and the 27 AMBIGUOUS cells are
  `Admin/AdminUsersTable`, `Mantine/Primitives/Combobox`, `Mantine/Primitives/PopularLocationsView` — none of
  which this revision's diff touches. **This is reported as unresolved evidence, not silently waived**: I did
  not re-run this gate a second time to test whether the AuthSheet timeouts are transient (this machine had
  three consecutive heavy Playwright/Storybook builds running across roughly the preceding hour when this gate
  ran, which is a plausible resource-contention explanation for `networkidle` timeouts specifically, but that is
  an inference, not a measured fact — D37 binds: a single re-run passing would not retroactively explain this
  run). Opus should decide whether a clean, isolated re-run is required before approval, or whether the
  disjoint-scope evidence above is sufficient given the pre-existing nature of the AuthSheet failure signature
  (37 AuthSheet mobile "not full-width" content failures read as a genuine, content-based, non-flaky defect,
  independent of the ~50 `networkidle` timeout cells).

## 15. Opus handoff

Evidence root: `docs/sessions/evidence/task764/` (all `rev1-*` files this revision; `phase-a-pointer-matrix.rev1-final.json`;
`rev1-favorites-composition.{pre-fold,post,plant-p3,plant-p4}.json`; `rev1-baseline-revert-proof.txt`;
`rev1-plant-p4-compare.mjs`). Session log: this file.

Owner-run commit/push handoff: **not emitted** — Sonnet has no approval authority and does not emit Git commands;
per the project contract, only Opus emits the commit/push handoff after review.
