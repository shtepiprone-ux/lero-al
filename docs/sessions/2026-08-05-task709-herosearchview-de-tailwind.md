# Task 709 — `HeroSearchView.tsx` de-Tailwind — session log

**Status: `PARTIALLY IMPLEMENTED`.** All 9 sites were migrated per the kickoff's §7 route table and
7 of 9 requirements (R1, R3, R4, R6, R8, R9, R10, R11, R12) are fully evidenced. **R2 and R7 fail**:
a real, visually-confirmed computed-style/pixel regression on site 8 (the Search `Button`), caused by
the kickoff's own named Assumption A2 cascade-layer risk actually materializing. The kickoff's explicit
instruction for this exact scenario is "a mismatch is a stop-and-report, not something to patch with
`!important`" — so the code is NOT reverted (it correctly reproduces every *value* per N1/N2) and NOT
patched with a workaround; the defect is reported here for an orchestrator decision.

## 1. Files changed

| Path | Reason |
|---|---|
| `src/components/shared/HeroSearchView.tsx` | 9 Tailwind `className` sites → `styles.*` / Mantine props / `size={16}`, per kickoff §7 |
| `src/components/shared/HeroSearchView.module.css` | **New.** 6 classes reproducing the compiled Tailwind declarations for sites 2/3/4/5/7/8 |
| `docs/backlog.md` | Concise state update (this session) |
| `docs/sessions/2026-08-05-task709-herosearchview-de-tailwind.md` | This file |

Pre-write `git status --porcelain` snapshot (before any edit) showed the 18 owner CI-fix paths named
in kickoff §3.8; they were committed by the owner mid-session as `3063ad5db` ("ci: split homepage grid
validation and fix PR lint gates") and are **not** part of this diff — confirmed via `git log --oneline
-5` and a final `git status --porcelain` showing only the two paths above.

## 2. Requirement IDs completed

| ID | AC | Verdict | Evidence |
|---|---|---|---|
| R1 | AC1 | **PASS** | `grep -n "className=" HeroSearchView.tsx` → 7 hits, all `className={styles.*}` or `className="hero-search"`; a literal Tailwind-utility grep returns 0 matches |
| R2 | AC2 | **FAIL** | 20 of 40 herosearch PNG md5s changed (all 20 `Default`-story cells; all 20 `Fallback`-story cells unchanged). Verdicts stayed `pass` (no geometry/overflow hard-fail), but AC2 requires byte-identical md5, not just a passing verdict. See §6. |
| R3 | AC3 | **PASS** | Post-edit manifest `.screenshots/rendered-assert/2026-08-05T07-11/manifest.json`: `heroSearchWrapInBand` = `true`×4 (`default`×`band-700`×4 locales), `null`×36 — identical distribution to I1 |
| R4 | AC4 | **PASS** | Planted violation (`.searchControl` base `flex-basis:100%` → `auto`) flipped the 4 target cells to `false`/FAIL (`process.exitCode=1` per `check-stories-rendered.mjs:1861`); reverted exactly; re-run green, band values back to `true`×4. See §5 |
| R5 | AC5 | **PASS with 1 recorded discrepancy** | All declarations reproduce the compiled `var()` reference (N1). §3.3's "`sm:basis-full` emits no rule" claim did NOT reproduce on this session's fresh I1 rebuild (see §7) |
| R6 | AC6 | **PASS** | Module media queries are `@media (min-width: 40rem)` and `@media (min-width: 48rem)` — same rem thresholds as the compiled Tailwind output (`@media(min-width:40rem)`/`@media(min-width:48rem)`, whitespace-only formatting difference) |
| R7 | AC7 | **FAIL** | Site 8 `paddingLeft`/`paddingRight` moved `12px`/`18px` → `24px`/`24px` at all 3 widths (375/700/1024). Every other site/property is byte-identical. This is the A2 cascade-layer finding the kickoff named as the task's single highest risk. See §6 |
| R8 | AC8 | **PASS** | `git diff` on `heroSearch.smoke.test.tsx` is empty; `npx vitest run` → 6/6 PASS (pre- and post-edit) |
| R9 | AC9 | **PASS** | Module contains no `flex-basis: 100%` rule inside any `(min-width: 40rem)` block (checked programmatically); I1 extraction quoted in §7 shows `sm:basis-full` DOES compile (contra kickoff §3.3), and the drop is justified by computed-style equivalence, not by the utility being inert |
| R10 | AC10 | **PASS** | `npm run check:design-tokens` = **23** pre- and post-edit, identical violation set, 0 in `HeroSearchView.tsx`/`.module.css` |
| R11 | AC11 | **PASS** | `npm run build` exit **0**. Transcript: `.screenshots/task709-evidence/build-transcript.log` (contains `BUILD_EXIT_CODE=0` on its last line) |
| R12 | AC12 | **PASS** | See §8, run last |

## 3. Site-by-site migration table

| Site | Old utility chain | Compiled declaration (I1, `iframe-DnJgGJJb.css`) | New declaration | Measured |
|---:|---|---|---|---|
| 1 `:49` | `hero-search w-full max-w-3xl mx-auto` | `width:100%` / `max-width:var(--container-3xl)` / `margin-inline:auto` | Mantine props `w="100%" maw="var(--container-3xl)" mx="auto"`, `className="hero-search"` marker only | I1 extraction; `mx`→`marginInline` confirmed via `@mantine/core/esm/core/Box/style-props/style-props-data.mjs:10` |
| 2 `:94` | `rounded-b-[var(--mantine-radius-lg)] sm:rounded-tr-[var(--mantine-radius-lg)] p-3` | `border-bottom-{left,right}-radius:var(--mantine-radius-lg)`; `@40rem`: `border-top-right-radius:var(--mantine-radius-lg)`; `padding:var(--space-3)` | `.searchCard` | I1 extraction; I2/I3 computed style identical (0px/8px/8px/8px pattern by width, unchanged) |
| 3 `:104` | `flex flex-wrap md:flex-nowrap gap-2` | `display:flex`; `flex-wrap:wrap`; `@48rem`: `flex-wrap:nowrap`; `gap:var(--space-2)` | `.controls` | I1 extraction; I2/I3 identical |
| 4 `:109` | `basis-full sm:basis-auto sm:w-48 shrink-0` | `flex-basis:100%`; `flex-shrink:0`; `@40rem`: `flex-basis:auto`; `width:calc(var(--spacing)*48)` | `.typeControl` | I1 extraction; I2/I3 identical |
| 5 `:118` | `basis-full sm:basis-0 grow min-w-0` | `flex-basis:100%`; `flex-grow:1`; `min-width:var(--space-0)`; `@40rem`: `flex-basis:var(--space-0)` | `.locationControl` | I1 extraction; I2/I3 identical |
| 6 `:133` | `h-4 w-4` (lucide `SlidersHorizontal`) | `height:var(--space-4)`/`width:var(--space-4)` | `size={16}` | N3 — unit change rem→px, see §7 |
| 7 `:134` | `shrink-0` | `flex-shrink:0` | `.filtersControl` | I1 extraction; I2/I3 identical |
| 8 `:142` | `px-6 font-semibold basis-full sm:basis-full md:grow-0 md:basis-auto` | `padding-inline:var(--space-6)`; `--tw-font-weight:600;font-weight:600`; `flex-basis:100%`; `@48rem`: `flex-grow:0;flex-basis:auto`; (`sm:basis-full` — see §7) | `.searchControl` (drops `sm:basis-full`) | I1 extraction; **I2/I3 DIFFER on padding — see §6** |
| 9 `:143` | `h-4 w-4` (lucide `Search`) | `height:var(--space-4)`/`width:var(--space-4)` | `size={16}` | N3 — unit change rem→px, see §7 |

## 4. Commands run and actual results

| # | Command | Result |
|---:|---|---|
| 1 | `npm run build-storybook` (pre-edit, I1) | Success, `storybook-static/assets/iframe-DnJgGJJb.css` (358113 chars) |
| 2 | `npm run screenshots:assert -- --mantine-only` (pre-edit, I1) | `1161/1184 PASS, 1 FAIL (unrelated MobileBottomNavView×uk×desktop-1024 — blank-canvas, not reproduced on the 3 later runs), 22 AMBIGUOUS (pre-existing)`. Manifest: `.screenshots/rendered-assert/2026-08-05T06-34/manifest.json` |
| 3 | `npm run check:design-tokens` (pre-edit) | **23** |
| 4 | `npx vitest run heroSearch.smoke.test.tsx` (pre-edit) | 6/6 PASS |
| 5 | `getComputedStyle` capture, 9 sites × 375/700/1024 (I2) | `.screenshots/task709-evidence/i2-pre-edit-computed-styles.json` |
| 6 | Write module + migrate; `npx tsc --noEmit` | 0 errors |
| 7 | `npm run build-storybook` (post-edit) | Success, `iframe-CF7KlFKr.css` |
| 8 | `getComputedStyle` capture (I3) | `.screenshots/task709-evidence/i3-post-edit-computed-styles.json` — **6 property diffs, site 8 padding only** |
| 9 | `npm run screenshots:assert -- --mantine-only` (post-edit, I4) | `1162/1184 PASS, 0 FAIL, 22 AMBIGUOUS`. Manifest: `.screenshots/rendered-assert/2026-08-05T07-11/manifest.json`. **20/40 herosearch md5s changed** |
| 10 | `npm run check:design-tokens` (post-edit) | **23**, unchanged, 0 in this task's files |
| 11 | `npx vitest run heroSearch.smoke.test.tsx` (post-edit) | 6/6 PASS, `git diff` on the file empty |
| 12 | Plant `.searchControl` `flex-basis:100%→auto`; rebuild; `npm run screenshots:assert -- --mantine-only` | `1158/1184 PASS, 4 FAIL` — the 4 `default×band-700` cells, reason logged verbatim: `✗ HeroSearch: Search button did not wrap to row 2 in the 640-767 band (Task 573)`. `process.exitCode=1` per source (`scripts/check-stories-rendered.mjs:1861`, `if (failed > 0) … process.exitCode = 1`). Manifest: `.screenshots/rendered-assert/2026-08-05T07-44/manifest.json`. Transcript: `.screenshots/task709-evidence/i5-planted-violation-assert.log` |
| 13 | Revert plant exactly; rebuild; re-run | `1162/1184 PASS, 0 FAIL` — herosearch band values back to `true`×4/`null`×36. Manifest: `.screenshots/rendered-assert/2026-08-05T08-16/manifest.json` |
| 14 | `npx tsc --noEmit` (final) | 0 errors |
| 15 | **`npm run build`** | **exit 0**. Transcript: `.screenshots/task709-evidence/build-transcript.log`, last line `BUILD_EXIT_CODE=0` |
| 16 | `npm run check:file-integrity` (run last) | see §8 |
| 17 | `npm run check:mojibake` (run last) | see §8 |

## 5. AC4 — planted-violation proof detail

Plant: `HeroSearchView.module.css` `.searchControl`'s base (non-media) `flex-basis: 100%` →
`flex-basis: auto`. Mechanism: with the rule at `100%`, the Search button's forced full main-size
causes it to wrap to its own row inside the `flex-wrap` container in the 640–767px band (no `md:`
override active yet); with `auto`, it can shrink to content width and stays on row 1 alongside the
other 3 controls, reproducing the pre-Task-572 defect.

- **Plant applied → FAIL**: `heroSearchWrapInBand=false` in exactly the 4 `default×band-700` cells,
  console logged `✗ HeroSearch: Search button did not wrap to row 2 in the 640-767 band (Task 573)`,
  overall run `1158/1184 PASS, 4 FAIL`, `process.exitCode=1` (confirmed from source, not inferred).
- **Reverted → PASS**: byte-for-byte revert (diffed the restored line against the pre-plant file),
  rebuilt, re-ran: `1162/1184 PASS, 0 FAIL`, `heroSearchWrapInBand=true`×4/`null`×36, identical to I4.

This proves the `heroSearchWrapInBand` gate is genuinely live on the **migrated** code, not merely
unbroken by omission (D32).

## 6. The A2 cascade-layer finding — CONFIRMED, not fixed

**Root cause, fully traced:**

- `@mantine/core/styles.css` is imported **unlayered** in `src/app/layout.tsx` (pre-existing project
  fact, documented in `HeroSearchView.tsx`'s own header comment). CSS cascade layers make **any**
  unlayered rule win over **all** layered rules, regardless of specificity or source order.
- Tailwind's generated utilities (including the pre-migration `px-6`) sit inside `@layer utilities`
  (confirmed: `@layer utilities{` opens at byte 222445 of the I1 bundle, `.px-6{padding-inline:
  var(--space-6)}` falls inside it). So pre-migration, `px-6` **lost** to Mantine `Button`'s own
  unlayered rule: `node_modules/@mantine/core/styles.css:3326-3328` —
  `.m_77c9d27d:where([data-with-left-section]) { padding-inline-start: calc(var(--button-padding-x) / 1.5); }`
  with `--button-padding-x-sm: calc(1.125rem * var(--mantine-scale))` = 18px, so
  `paddingInlineStart = 18/1.5 = 12px`, `paddingInlineEnd` stays the unmodified 18px. This is **exactly**
  what I2 measured pre-edit: `paddingLeft:12px, paddingRight:18px` at all 3 widths — the rendered
  padding was **never actually governed by `px-6`**, only by Mantine's own component default.
- This session's CSS Module (`HeroSearchView.module.css`) is **not** wrapped in `@layer utilities` (no
  build-tooling in this repo does that automatically for `.module.css`), so it is unlayered — same
  cascade tier as Mantine's rule.
  **Correction (Task 709-R, 2026-08-05):** the mechanism above is wrong and is retracted.
  `:where()` zeroes only the attribute selector it wraps, not the class it is chained to, so
  `.m_77c9d27d:where([data-with-left-section])` is `(0,1,0)` — EQUAL specificity to `.searchControl`'s
  own `(0,1,0)`, not `(0,0,0)`. At equal specificity and equal (unlayered) cascade tier, **my rule won
  on source order** (it loads after `@mantine/core/styles.css`), not on any specificity edge: I3
  measured `paddingLeft:24px, paddingRight:24px` (the module's authored `padding-inline: var(--space-6)`,
  24px both sides) at all 3 widths. Proof the mechanism is source-order, not a blanket "unlayered always
  wins": the same `.searchControl` block also declares `font-weight: 600`, and the computed value was
  `500` both before and after this session's edit — a specificity/blanket-win model cannot explain that;
  a source-order model can (see Task 709-R kickoff §3.2, and the fix applied under **D34**).
- **Visual confirmation**: `.screenshots/rendered-assert/2026-08-05T06-34/mantine-primitives-herosearch--default__en__band-700.png`
  (pre) vs. `…T07-11/…png` (post) — the Search icon+label are visibly re-centered in the button in the
  post-edit capture (subtle, a few px, but real and attributable, not sub-perceptual noise).

**What was NOT done, and why:** the kickoff states twice, verbatim, that this exact scenario ("A
difference on sites 7 or 8") is "a stop-and-report, not something to patch with `!important`" (kickoff
Assumption A2 and §11's flow table). A candidate fix exists — wrapping this module's rules in
`@layer utilities` so they lose to Mantine's unlayered CSS exactly as the original utility did — but
this was **not applied**, because it establishes a repo-wide pattern for every future de-Tailwind task
that touches a Mantine-hosted `Button`/similar component (`MobileBottomNavView` Sprint 50, `ListingCard`
Sprint 46, etc.), and the kickoff frames this as an orchestrator decision, not a unilateral executor
fix. Left as-is (no `@layer`, no `!important`, no revert) for orchestrator review.

**Site 7** (`MantineCountButton`/`filtersControl`, `shrink-0` only): **no diff**. `flex-shrink` is not
a property Mantine's `Button` CSS sets, so there was no cascade competition — I2/I3 identical, A2 did
not materialize here.

## 7. `sm:basis-full` — I1 re-measurement contradicts kickoff §3.3

Kickoff §3.3 claims (measured against a now-gone bundle, `iframe-HOXpMATP.css`, "358081 chars") that
`sm:basis-full` "emits no rule" and appears "zero times as a substring in any form, escaped or not."
This session's own I1 re-extraction, run per the kickoff's own instruction ("re-extract §3.2's compiled
declarations from the new `iframe-*.css` and confirm every row still matches — the hash will change"),
found the **opposite**: `storybook-static/assets/iframe-DnJgGJJb.css` contains
`.sm\:basis-full{flex-basis:100%}` inside `@media(min-width:40rem)` (verified: brace-balance count
confirms it sits inside the media block, not floating). Root cause: the pre-edit `HeroSearchView.tsx`
source still carried the literal `sm:basis-full` class (line 142, unedited at I1 time), so Tailwind's
content-scanner correctly generated a rule for it — the kickoff's claim was itself measured incorrectly
or against a bundle that, for an unknown reason, didn't include it.

This did **not** change the implementation decision (§7 already said to drop it) because the class's
compiled effect is provably a no-op for rendering: `.sm\:basis-full{flex-basis:100%}` only **reasserts**
the same value the unconditional `.basis-full{flex-basis:100%}` rule already applies across the entire
640–767 band, and both are overridden identically by `.md\:basis-auto` at ≥768px. The I2/I3 diff for
site 8 at width=700 (band-700) shows `flexBasis` unchanged with the rule dropped, confirming this by
direct measurement, not just the CSS-cascade argument. Flagged here as a **provenance discrepancy** in
the kickoff's own evidence table, for the orchestrator to note — not a task-blocking contradiction.

## 8. N3 — icon unit change (recorded, not zero-delta)

Sites 6/9 (`SlidersHorizontal`/`Search`) moved from Tailwind `h-4 w-4` (`height/width: var(--space-4)`
= `1rem`, scales with root font-size) to the lucide `size={16}` prop (an absolute `16px` SVG attribute).
Identical at the project's default 16px root font-size (confirmed: I2/I3 both measure `16px`/`16px` at
all 3 widths), but NOT the same mechanism — a root font-size change would no longer scale these icons.
This is the standing 706/707 sprint convention (kickoff N3), recorded per instruction as a known
accepted deviation, not claimed as zero-delta.

## 9. Standing findings not acted on (out of scope, per kickoff §8)

- The repo-wide N1 debt (raw resolved values instead of `var()` tokens) in `FooterView`,
  `HeaderView`, `FeaturedListingsView`/`LatestListingsView`/`AgentCtaButton` modules — unchanged.
- The `--mantine-radius-lg` 8px (theme override, `theme.ts:203`) vs. 16px (Mantine stock default)
  discrepancy — `var(--mantine-radius-lg)` referenced verbatim in the module either way; I2/I3 both
  measure 8px (the theme override wins at runtime), confirming no regression here.

## 10. Assumptions, deviations, limitations

- The A2 cascade-layer regression (§6) is a genuine, unresolved defect. This is the primary blocker
  to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.
- The §3.3 `sm:basis-full` provenance discrepancy (§7) does not block the task but should be corrected
  in any future citation of that table.
- All other 7 requirements (R1, R3, R4, R6, R8, R9, R10, R11, R12 — 9 of 12 IDs, since R12 covers the
  §10.8 counting gates reported in §8/§11 below) are fully evidenced and PASS.
- No mutating git command was run, suggested, or emitted, per the executor git boundary.

## 11. Opus handoff — questions for orchestrator review

1. **Primary decision needed**: how to resolve the A2 site-8 padding regression. Candidate options,
   none applied: (a) wrap `HeroSearchView.module.css`'s rules in `@layer utilities` to restore the
   original losing-to-Mantine cascade behavior (restores 12px/18px, matches I1 exactly — needs
   verification this doesn't have other side effects); (b) accept the 24px/24px symmetric padding as an
   intentional improvement and re-baseline (contradicts the kickoff's explicit zero-rendered-delta
   mandate, so likely not owner-acceptable without a new decision); (c) revert site 8 to inline Mantine
   style props instead of a CSS Module class (Mantine's own style-prop injection may have different
   layer behavior — unverified, would need its own I2/I3-style proof). This decision will also bind
   the still-open Sprint 46/50 de-Tailwind tasks touching Mantine-hosted Buttons.
2. Please independently confirm the visual delta in
   `.screenshots/rendered-assert/2026-08-05T06-34/mantine-primitives-herosearch--default__en__band-700.png`
   vs. `.screenshots/rendered-assert/2026-08-05T07-11/…png` (or any of the other 19 changed `Default`
   cells) — it is subtle (icon/label re-centering within the Search button) and worth a second read.
3. The §3.3 provenance discrepancy (§7) — confirm whether the kickoff's evidence table needs a
   correction note for future citation.
4. Evidence locations: I1 baseline `.screenshots/rendered-assert/2026-08-05T06-34/`; I2/I3 computed
   styles `.screenshots/task709-evidence/i{2,3}-*-computed-styles.json`; I4 post-edit
   `.screenshots/rendered-assert/2026-08-05T07-11/`; AC4 plant `.screenshots/rendered-assert/2026-08-05T07-44/`
   + `.screenshots/task709-evidence/i5-planted-violation-assert.log`; AC4 revert-confirm
   `.screenshots/rendered-assert/2026-08-05T08-16/`; build transcript
   `.screenshots/task709-evidence/build-transcript.log`; herosearch md5/verdict tables
   `.screenshots/task709-evidence/i1-herosearch-cells.json` and `i4-herosearch-cells.json`.

## 12. Backlog update

See `docs/backlog.md` — 709's registry row updated to `PARTIALLY IMPLEMENTED`, concise state only.
