# Session Archive: Task 658 — MantineListingCardPattern + ListingCard full internal-chrome de-Tailwind → Mantine — 2026-07-22

## Task path and status

`tasks/kickoff_prompt_Task_658_ListingCardPattern_FullChrome_Mantine_Migration.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

Converted the residual raw-HTML chrome inside `MantineListingCardPattern.tsx` (both `layout='grid'`
and `layout='list'`) and `ListingCard.tsx`'s container-owned nodes to Mantine primitives
(`Box`/`Group`/`Stack`/`Center`/`Text`), preserving every computed value. Landed as one diff
covering all three slices (S1 grid, S2 list, S3 container) rather than three sequential sessions
(A-3 executor discretion) — the changes are small enough per-element that atomic review is safer
than staged review, and per-slice evidence is still provided below.

**A real, non-obvious cascade-layer regression was found and fixed during implementation** (see
"Self-review findings"): the title's `group-hover:text-primary` hover-color effect went silently
inert once the title became a Mantine `Text` component, because `@mantine/core/styles.css` is
imported **unlayered** in this project (`src/app/layout.tsx:6`) and Mantine's own
`color: var(--text-color)` rule therefore always wins the cascade over Tailwind's layered
`group-hover:` utility, regardless of hover state — the same cascade-layer class of bug already
documented for `Card`/`Badge`/`ActionIcon` (Task 602/606/612/616/617), newly encountered here for
`Text`'s `color` property. Fixed by having Tailwind's `group-hover:` variant set the **custom
property** Mantine's rule reads (`group-hover:[--text-color:var(--primary)]`) instead of `color`
directly — since nothing else declares that specific custom property, there is no layer conflict
for it, and Mantine's unlayered rule then renders whatever value is live in the variable. Verified
empirically before/after via a real Playwright hover (see Validation evidence).

## Requirement and acceptance-criteria evidence

| ID | Requirement/AC | Evidence |
|---|---|---|
| R1/AC1 | Grid-variant raw elements → Mantine primitives, visuals unchanged | `git diff` grid branch; `screenshots:assert --mantine-only` — `Patterns/Mantine/ListingCardPattern` 0 findings (pass+ambiguous) across all cells |
| R2/AC2 | List-variant raw elements → Mantine primitives, visuals unchanged incl. @320 wrap | Same gate; targeted script confirms location computed `width=30.08px` (>0) @320 uk, no page overflow |
| R3/AC3 | `ListingCard.tsx` container raw elements migrated | `git diff` — no-image fallback (`Center`), date span + vertical footer wrapper (`Text`/`Group`) |
| R4/AC1,2 | Rendered output identical at every Q3 viewport/locale | `screenshots:assert --mantine-only`: 1005/1048 PASS, 0 FAIL, 43 AMBIGUOUS — **zero** ambiguous/fail findings reference `ListingCard`/`ListingCardPattern` (all 43 belong to unrelated pre-existing stories: `NotificationBellView`, `PopularLocationsView`, `RangeDatePicker`, `Tabs`) |
| R5/AC4 | No capability/state lost across all card states | `ListingCard.smoke.test.tsx` (13 tests) + `MantineListingCardPattern.smoke.test.tsx` (4 tests) — 17/17 PASS, covering badges/overlay/photo-counter/favorite/copy-id/date/features/price(+old/per-sqm)/contact/archived/sold/no-image in both layouts |
| R6/AC5 | `MantineListingCardPattern.module.css` untouched | `git diff --stat` for that path → empty |
| R7/AC6 | Canonical Stories re-verified, `check:story-coverage` green | Both stories re-verified with zero rendered divergence (no edit needed); `check:story-coverage` → PASSED 7/7 |
| R8/AC7 | No i18n/string delta | `check:i18n` → 2210 keys × 4 locales, no delta; diff has zero string literal changes |
| R9/AC8 | `npm run build` exit 0, typecheck 0 | `npx tsc --noEmit` → 0 errors; `npm run build` → `✓ Compiled successfully in 62s`, exit 0 |

## Current versus required behavior

Every migrated element renders the identical computed style (color/size/weight/spacing/line-clamp/
wrap/hover) it did before — a primitive swap, not a redesign. All states preserved and
rendered-verified in both layouts: populated / hover (title + card elevation) / premium / archived
/ sold-rented overlay (grid only, by design) / photo-counter (both layouts, grid bottom-right vs
list bottom-left per Task 656) / price-reduced / no-image fallback / long-location @320 wrap.

**Negative-flow applicability (per kickoff §11):** Validation/Auth-RLS/Offline/Concurrent-writer —
N/A (read-only presentational card). No-image, sold/rented, premium/archived, price-reduced, and
the @320 list-wrap case are all applicable and verified above.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | S1 (grid) + S2 (list): every raw `<div>/<span>/<p>/<h3>` structural/text element → `Box`/`Group`/`Stack`/`Center`/`Text`, per §10 disposition table; retained className carve-outs (`text-2xs`, overlay/photo-counter tints, `group-hover:` — reworked to the `--text-color` custom-property form, see below) |
| `src/modules/listings/components/ListingCard.tsx` | S3: no-image fallback (`Center`), date span + vertical footer wrapper (`Text`/`Group`) migrated; added `Center`/`Group`/`Text` imports |
| `src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx` | Fixed a pre-existing stale assertion (predates this task — see Self-review findings) that asserted photoCount is absent in `layout='list'`, contradicting already-shipped Task 656 behavior |
| `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` | Updated the list-branch `priceOld` strike-through assertion from `toHaveClass('line-through')` (a literal Tailwind class, no longer present) to the same computed-style check already used for the vertical branch's identical case (`td="line-through"` is a Mantine style prop, not a className) |
| `scripts/task658-qa-listingcard-chrome-migration.mjs` | New ad hoc (not CI) Playwright verification script — proves the title-hover cascade-layer fix, the S2 @320 wrap-safety, `text-2xs` computed sizing, and photo-counter/overlay/badge sanity, before/after |

**`MantineListingCardPattern.module.css` — NOT present in the diff** (confirmed via `git diff --stat`, R6/AC5).

## Canonical UI decision record

| Visible artifact | Canonical source | Disposition | Notes |
|---|---|---|---|
| All migrated text/structure | `@mantine/core` (`Box`/`Group`/`Stack`/`Center`/`Text`) — pattern already consumes these elsewhere in the same file | `reuse` | No new component/pattern/token created |
| Card hover/premium/list-display | `MantineListingCardPattern.module.css` (existing, frozen) | `preserve` | Untouched — `git diff --stat` empty |
| Title `group-hover` brand color | Existing project semantic token `--primary` (`globals.css`) | `reuse` (mechanism changed, not the value) | Same color value (`--brand-700` / `#EC5447`), same trigger (`.group:hover`); only the CSS property being set changed (`--text-color` custom property instead of `color` directly) to survive Mantine's unlayered `Text` CSS — see Self-review findings |

No new shared primitive, pattern, or token was created; both canonical Stories (`ListingCardPattern.stories.tsx`, `ListingCard.stories.tsx`) needed no edits — re-verified with zero rendered divergence.

## Validation evidence

1. **`npx tsc --noEmit`** → 0 errors.
2. **`npm run check:i18n`** → `✅ Parity PASSED — all 4 locale files have identical key sets (2210 keys)`.
3. **`npm run check:file-integrity`** → `✅ check:file-integrity PASSED — all 7 file(s) clean` (NUL/BOM/parse/truncation, all touched files).
4. **`npm run check:mojibake`** → `0 artifacts in 1865 files`.
5. **`npm run check:story-coverage`** → `✅ PASSED — 7/7 covered`.
6. **`npm run check:design-tokens -- --strict`** → 41 pre-existing violations reported, **zero in either touched file** (`MantineListingCardPattern.tsx`/`ListingCard.tsx` do not appear in the findings list — confirmed by direct inspection of the LISTING-category output).
7. **Regression suite (critical-flow-registry — "Listing card rendering" P0/P1 row):**
   `npx vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx`
   → **17/17 PASS** (after fixing 1 pre-existing stale assertion, see Self-review findings).
8. **Broader collateral-regression sweep:** `npx vitest run src/modules/listings src/design-system` → **606/606 PASS** (29 test files).
9. **`npm run build-storybook`** → `✓ built in 18.98s`, `Storybook build completed successfully`.
10. **`npm run screenshots:assert -- --mantine-only`** (full canonical matrix, 320/375/390/1024 × sq/en/uk/it + per-story extra viewports, 65 Mantine stories, 1048 cells) → **1005/1048 PASS, 0 FAIL, 43 AMBIGUOUS**. All 43 ambiguous findings belong to unrelated, pre-existing stories (`NotificationBellView`, `PopularLocationsView`, `RangeDatePicker`, `Tabs`) — **zero findings of any kind (pass-with-note, ambiguous, or fail) reference `ListingCardPattern` or `ListingCard`**, i.e. both this task's stories are fully clean across the whole matrix.
11. **Targeted computed-style proof** (`node scripts/task658-qa-listingcard-chrome-migration.mjs`, real Playwright against the built Storybook) — **6/6 PASS**:
    - Title hover color genuinely changes: `before=rgb(0, 0, 0)` → `after=oklch(0.614 0.158 23)` (= `--brand-700` / `#EC5447`, byte-identical to the pre-migration value) — proves the `group-hover:[--text-color:var(--primary)]` fix actually works, not just compiles.
    - No page horizontal overflow @320 (`uk` locale, longest strings).
    - List-layout location span computed `width=30.08px` (>0) @320 `uk` — Task 656 wrap-safety fix preserved through the `Group` migration.
    - A `text-2xs` carve-out element (originalPrice, rendered via `Box`, not `Text`) computed `font-size=10px` — confirms it did **not** fall back to Mantine `Text`'s own 16px default, validating the "use `Box` not `Text` for token-less carve-outs" rule documented in the file header.
    - Grid (6) + list (6) sections both render fully; photo-counter (camera icon) present.
12. **Production build (hard gate):** `npm run build` → `✓ Compiled successfully in 62s`, exit 0.

### Acceptance-criteria self-audit

| AC | Result |
|---|---|
| AC1 (grid parity) | ✅ — gate #10, #11 |
| AC2 (list parity + @320 wrap) | ✅ — gate #10, #11 |
| AC3 (no-image fallback + footer) | ✅ — `ListingCard.smoke.test.tsx` no-image tests, both branches |
| AC4 (all states behave identically) | ✅ — gate #7 (17/17), #10 |
| AC5 (module.css untouched) | ✅ — `git diff --stat` empty |
| AC6 (Stories + story-coverage) | ✅ — gate #5, #10 |
| AC7 (no i18n delta) | ✅ — gate #2 |
| AC8 (build + typecheck 0) | ✅ — gate #1, #12 |

**Self-validation: tsc=0 errors · build=passes · AC table=all green · rendered Q3 gate=1005/1048 PASS/0 FAIL (0 for this task's own stories) · regression suite=17/17 (+606/606 broader) · scope=clean (module.css untouched, no consumer files touched beyond the 2 in scope + 2 test files) · integrity=PASS**

## D-1 color-decision resolution (per kickoff §5)

Preserved each element's *current* computed color exactly, per the kickoff's default —
did **not** unify `c="dimmed"` vs `c="var(--muted-foreground)"`:

| Element | Layout | Before (computed) | After |
|---|---|---|---|
| typeLabel | list | `text-muted-foreground` (oklch 0.556) | `c="var(--muted-foreground)"` — same value |
| price | list | `text-primary` (brand-700) | `c="brand"` (theme primaryShade 7 = brand-700) — same value |
| priceOld | list | `text-muted-foreground` + `line-through` | `c="var(--muted-foreground)" td="line-through"` — same value/effect |
| pricePerSqm | list | `text-muted-foreground` | `c="var(--muted-foreground)"` — same value |
| originalPrice | grid + list | `text-muted-foreground/70` (raw className, untouched) | Rendered via `Box`, className kept verbatim — same value (Box has no competing CSS, verified via gate #11 font-size check) |
| grid typeLabel/location (pre-existing, out of scope) | grid | `c="dimmed"` (Mantine gray-6) | **Unchanged** — left exactly as-is, confirming the two-shade split is perpetuated as the kickoff's sanctioned default, not silently unified |

## Self-review findings

1. **Fixed (in scope) — title hover-color cascade-layer regression.** Migrating the title to
   Mantine `Text` silently broke `group-hover:text-primary` (Mantine's unlayered `color:
   var(--text-color)` always wins the cascade over Tailwind's layered `group-hover:` utility,
   independent of hover match). Caught via the task's own required hover computed-style proof
   (§13.6), not assumed. Fixed with `group-hover:[--text-color:var(--primary)]` (targets the
   custom property Mantine's rule reads, which nothing else declares, so there's no layer
   conflict for it). Verified before/after — see Validation evidence #11.
2. **Fixed (pre-existing, adjacent) — stale test assertion.** `MantineListingCardPattern.smoke.test.tsx`'s
   list-mode test asserted photoCount is absent, a Task 606-era assumption invalidated by Task
   656 (which intentionally added photoCount to `layout='list'`, bottom-left) — the assertion was
   never updated and was failing before this task's changes too (confirmed: the pre-existing code
   already rendered `photoCount` in list mode; only the wrapper tag changed under this task). Fixed
   the stale assertion + comment to match shipped, intentional behavior.
3. **No other defects found.** Every other Group/Stack conversion required an explicit `gap`/
   `wrap`/`justify`/`align` prop (Mantine's own CSS sets an unconditional unlayered fallback for
   all four on `Group`/`Stack` — confirmed by inspecting `node_modules/@mantine/core/styles/{Group,Stack}.css`)
   — verified each one maps to the exact prior Tailwind value (including two asymmetric
   `gap-x-N gap-y-M` rows, reproduced via the CSS `gap` two-value shorthand string, e.g.
   `gap="0.25rem 0.75rem"`). `Text` components were only used where an explicit `size`/`fw` prop
   (or the `inherit` prop, for the truncated location span) is set, per the same cascade-layer
   reasoning — carve-out classes with no Mantine equivalent (`text-2xs`, opacity tints, overlay/
   photo-counter tints) use `Box`, which has no component-level CSS of its own.

## Assumptions, deviations, and limitations

- Landed as one atomic diff rather than three sequential sessions (A-3 executor discretion) —
  per-slice evidence is still itemized above (R1–R3 rows) for reviewability.
- D-2 (title hover) implemented with a **different CSS mechanism** than the kickoff's literal
  suggestion (plain `group-hover:text-primary` className) because that literal suggestion is
  provably inert once the title is a Mantine `Text` (see Self-review finding #1) — the fix
  preserves the exact same rendered color/trigger, only the property Tailwind sets changed.
- The `docs/critical-flow-registry.md` "Listing card rendering" row (P0/P1, Task 602/605/606/608)
  is the applicable critical flow; its existing regression suite (`ListingCard.smoke.test.tsx` +
  `MantineListingCardPattern.smoke.test.tsx`) was re-verified green (17/17) after 1 stale-assertion
  fix, satisfying agent-contract clause 15.
- `scripts/task658-qa-listingcard-chrome-migration.mjs` is ad hoc verification (like the precedent
  `task605`/`task606`/`task608` scripts), not a CI gate.

## Opus handoff

- Evidence locations: this session log (all command output summarized inline); rendered-assert
  raw log available at `.screenshots/rendered-assert/2026-07-22T17-22/` (gitignored, local only,
  regeneratable via `npm run build-storybook && npm run screenshots:assert -- --mantine-only`).
- Please re-verify: (1) the `group-hover:[--text-color:var(--primary)]` fix — a novel technique
  in this codebase (no prior file uses this exact arbitrary-custom-property pattern) — is sound
  and matches the project's established cascade-layer-workaround philosophy (CSS module for
  `Card`, this technique for `Text`); (2) the stale-test fix in
  `MantineListingCardPattern.smoke.test.tsx` is judged an in-scope adjacent correction, not scope
  creep.

## Backlog update

See `docs/backlog.md` "Last Session" entry (this session).
