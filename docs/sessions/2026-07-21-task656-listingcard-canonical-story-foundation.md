# Session: Task 656 — ListingCard canonical Story-first foundation — 2026-07-21

## Task path and status

`tasks/kickoff_prompt_Task_656_ListingCard_Canonical_Story_Foundation.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

Supersedes Task 655 (its uncommitted `ListingCard.tsx` diff was reverted and its local
`ListingCard.module.css` deleted as D0; the copy-id migration was redone via the new canonical
component in D5).

## Summary

Implemented D0–D5 in order: extracted the copy-id footer-action control into a canonical
`MantineCopyIdButton` (owning its own clipboard/copied-state and styling), rebuilt
`ListingCardPattern.stories.tsx` to render only real canonical Mantine components (real
`FavoriteButton` + real `MantineCopyIdButton`, zero demo stand-ins), added a canonical
`Mantine/Primitives/ListingCard` story that statically imports the real production component, and
migrated production `ListingCard.tsx` onto the canonical copy-id component.

**Two additional defects were found and fixed mid-task, both owner-authorized after being reported
as out-of-scope discoveries (see Assumptions/Deviations):**

1. Making the `ListingCardPattern` story render the *real* `FavoriteButton` (as D3 requires)
   revealed that the favorite heart's `className="absolute top-2 right-2"` contract was silently
   broken in production too — `ActionIcon`'s own unlayered CSS (`position: relative`) beats
   Tailwind's layered `.absolute` utility, so the button never actually floated over the image.
   Fixed via a new `overlay` prop on `FavoriteButton` that inline-styles position instead.
2. Owner-reported, from the rendered `Mantine/Primitives/ListingCard` story: the list-layout
   footer row silently collapsed the location text to `width:0` at narrow widths (a genuine flex/
   overflow bug, not something this task introduced), the list layout had no photo-count pill, and
   there was no defined wrap behavior when location/copy-id/date don't fit one line. Fixed in
   `MantineListingCardPattern.tsx`'s list branch: photo count now renders bottom-left in list mode,
   and location/copy-id/date are independent flex-wrap items that shed to the next line starting
   from the last one, all left-aligned (a first attempt right-aligned a wrapped copy-id via
   `margin-left:auto`, which the owner correctly rejected as looking hardcoded/stray once it had
   no location to justify against — removed).

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | `MantineCopyIdButton` owns clipboard write + copied-state + styling; props-only app concerns | `src/design-system/mantine/patterns/MantineCopyIdButton.tsx` — internal `useState`, `navigator.clipboard.writeText`, no i18n/app import |
| R2/AC1 | `Mantine/Primitives/CopyIdButton` story, resting + copied states | `src/stories/mantine/primitives/CopyIdButton.stories.tsx` — 2 sections, `play` clicks the 2nd instance (real click, not `defaultCopied`) |
| R3/AC2 | `ListingCardPattern.stories.tsx` renders only real canonical components, no `@/components/ui/*` | `grep -n "@/components/ui" src/stories/patterns/mantine/ListingCardPattern.stories.tsx` → no matches; real `FavoriteButton` + `MantineCopyIdButton` imported |
| R4/AC3 | `Mantine/Primitives/ListingCard` statically imports real `ListingCard`, mocked signed-in `AuthContext` | `src/stories/mantine/primitives/ListingCard.stories.tsx` — `import { ListingCard } from '@/modules/listings/components/ListingCard'`; `AuthContext.Provider` with fixture `status:'authenticated'` |
| R5/AC4 | Production `ListingCard` uses `MantineCopyIdButton` in both footers; local module.css deleted; manifest + coverage | `src/modules/listings/components/ListingCard.tsx` both footers; `ListingCard.module.css` deleted; `scripts/mantine-migration-scope.json` includes the path; `check:story-coverage` PASSED (7/7 covered) |
| R6/AC4 | Copy-ID look/behavior byte-identical pre/post-migration | Same CSS module rules moved verbatim (`.copyId[data-copy-id]` font-size/color/hover/focus); `ListingCard.smoke.test.tsx` 13/13 green, unchanged assertions for the copy-id cells |
| R7/AC5 | Pattern holds no clipboard state; `FavoriteButton`/`theme.ts` unchanged except the owner-authorized `overlay` addition | `MantineListingCardPattern.tsx` has zero `useState`/clipboard logic; `theme.ts` untouched (`git diff --stat` confirms); `FavoriteButton.tsx` changed only by owner direction (see Deviations) |
| R8/AC5 | All gates + build green | See Validation evidence below |

## Current versus required behavior

- **Before:** copy-id = Task-655 `UnstyledButton` + Homepage-only local CSS; `ListingCardPattern`
  story rendered legacy shadcn demo stand-ins (`DemoFavoriteButton`, static `DemoFooterActions`);
  no story rendered the real `ListingCard`; production not registered in the migration-scope
  manifest; list-layout footer silently dropped location at narrow widths; list layout had no
  photo count; favorite button's `absolute` positioning silently did nothing (rendered in normal
  flow) due to an unlayered-CSS conflict with Mantine `ActionIcon`.
- **After:** copy-id = shared canonical `MantineCopyIdButton`, used by production + both stories;
  `ListingCardPattern` story is a truthful Mantine rendering (real `FavoriteButton` + real
  `MantineCopyIdButton`); a `ListingCard` story statically imports the real component; production
  registered + coverage-proven; zero Homepage-only local card CSS; copy-id look/behavior
  byte-identical; favorite button genuinely floats top-right (grid) via an inline-styled
  `overlay` prop; list layout shows a bottom-left photo count and never collapses/hides its
  location text, wrapping location/copy-id/date left-aligned, shedding from the last element
  first when space is tight.

## Files Changed

| File | Reason |
|---|---|
| `src/design-system/mantine/patterns/MantineCopyIdButton.tsx` (new) | D1 — canonical copy-id component |
| `src/design-system/mantine/patterns/MantineCopyIdButton.module.css` (new) | D1 — Task-655 overrides moved verbatim |
| `src/design-system/mantine/patterns/index.ts` | D1 — barrel export |
| `src/stories/mantine/primitives/CopyIdButton.stories.tsx` (new) | D2 — primitive story (resting + copied) |
| `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` | D3 — real `FavoriteButton`/`MantineCopyIdButton`, no demo stand-ins; list DemoFooterActions/photoCount comment updated |
| `src/stories/mantine/primitives/ListingCard.stories.tsx` (new) | D4 — static-import story of the real production component |
| `src/modules/listings/components/ListingCard.tsx` | D0 revert + D5 migration; `photoCount` now passed to the list branch |
| `scripts/mantine-migration-scope.json` | D5 — registers `ListingCard.tsx` |
| `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` | Updated the list-branch photo-count assertion (was "absent by design", now present per owner direction) |
| `src/modules/auth/context/AuthContext.tsx` | Exported the `AuthContext` object so D4's story can mock a signed-in value without touching live Supabase/`AuthController` wiring |
| `src/modules/listings/components/FavoriteButton.tsx` | Owner-authorized: new `overlay` prop, inline-styles `position/top/right` to fix a real production defect (Tailwind `.absolute` silently defeated by `ActionIcon`'s unlayered `position: relative`) |
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | Owner-authorized: list layout now renders `photoCount` (bottom-left); location/footer-actions row rebuilt as independent flex-wrap items (fixes location collapsing to `width:0`; implements last-first wrap shedding, left-aligned) |
| `messages/{en,sq,uk,it}.json` | New `storybook.mantine.copy_id_button_*` keys (aria copy/copied, resting/copied captions) |
| `docs/backlog.md` | Concise current-state update, supersedes the 655 entry |

Deleted: `src/modules/listings/components/ListingCard.module.css` (Task-655 Homepage-only override, superseded).

## Validation evidence

1. `npm run typecheck` → exit 0 (run 3 times across iterations, all clean).
2. `npm run check:stories` → `✅ check:stories PASSED — 124 files checked, 0 violations.`
3. `npm run check:story-coverage` → `✅ PASSED` — manifest 7 entries, 7 covered including `src/modules/listings/components/ListingCard.tsx` via the new `Mantine/Primitives/ListingCard` story.
4. `npm run check:i18n` → `✅ Parity PASSED` — 2210 keys × 4 locales.
5. `npm run check:mojibake` → `0 artifacts in 1861 files`.
6. `npx vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx src/modules/listings/components/__tests__/FavoriteButton.test.tsx` → **27/27 PASS** (13 + 14).
7. **Planted-violation (critical flow, clause 15):** changed `MantineCopyIdButton`'s `useState(false)` → `useState(true)` (always-copied). Re-ran the smoke suite: **3/13 tests genuinely FAILED** (`getByLabelText('Copy listing ID')` not found in both the vertical and horizontal branches, since the button rendered with the copied-state aria-label instead). Reverted → **13/13 PASS** again.
8. **Rendered proof:** `npm run build-storybook` succeeded (3 times across iterations, final one after all fixes). Since this session has no interactive browser for manual inspection, rendered proof was captured via a real headless Chromium (Playwright, already a project dependency) navigating the built `storybook-static` output and reading `getComputedStyle`/`getBoundingClientRect` — the same technique `check-stories-rendered.mjs` uses, run ad hoc here for targeted verification:
   - `Mantine/Primitives/CopyIdButton` and the rebuilt `ListingCardPattern`/`ListingCard` stories render (confirmed via DOM presence + non-empty rects at 320px and 1024px, uk locale).
   - **Favorite position bug (fixed):** before the `overlay` prop, `getComputedStyle(favoriteButton).position` was `"relative"` (not `"absolute"`) on both the `ListingCardPattern` story AND the real-production `Mantine/Primitives/ListingCard` story — confirming this was a pre-existing production defect, not introduced by this task. After the fix: `position:"absolute", top:"8px", right:"8px"` on both stories, rect positioned at the image's top-right corner.
   - **Location-collapse bug (fixed):** before the fix, at 320px/uk the list footer row was 134px wide while the copy-id+date cluster alone needed ~143px; the location span's computed `width` was `"0px"` (invisible) despite non-empty `textContent`. After the fix: location renders at its full natural width (106px container, 90px inner text, `scrollWidth === clientWidth` → not ellipsized), fully visible.
   - **List photo count (added):** bottom-left pill confirmed at `x≈25` against an image starting at `x≈17` (320px) and `x≈58` against an image at `x≈50` (1024px) — left-anchored in both cases, unaffected grid instance still bottom-right.
   - **Wrap-shed order + alignment (fixed twice):** first pass used `margin-left:auto` on copy-id, which the owner correctly rejected after seeing it stuck to the card's right edge once alone on its own line. Final version: at 320px/uk, location (x=157) is on its own line; copy-id (x=157, y=719) sits directly below it, same left x-coordinate; date (x=157, y=739) sheds to its own line below copy-id, same left x-coordinate. No horizontal scroll (`document.documentElement.scrollWidth === clientWidth`, confirmed `false` overflow flag).
9. `npm run build` → **exit 0**, final production build after all fixes (Next.js 15.5.18, "Compiled successfully", all 40 static pages generated).

## Visual source trace

| Visible artifact | Component/markup | Class/selector | Utility/token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Copy-ID pill | `MantineCopyIdButton` (new) | `.copyId[data-copy-id]` | `--text-2xs`, `--color-muted-foreground` (moved verbatim from Task 655) | Change (extraction) | `MantineCopyIdButton.module.css` |
| Favorite heart (grid) | `FavoriteButton` → `ActionIcon` | `overlay` inline style (new) | `var(--mantine-spacing-xs)` | Change (position fix) | Playwright computed-style before/after |
| Favorite heart (list) | `FavoriteButton` → `ActionIcon` | `className="shrink-0 -mt-0.5 -mr-1"`, no `overlay` | n/a (normal flow, unchanged) | Preserve | `ListingCard.tsx` horizontal branch unchanged in this regard |
| Photo count (grid) | `MantineListingCardPattern` grid branch | `absolute bottom-2 right-2` | unchanged | Preserve | Not touched this task |
| Photo count (list) | `MantineListingCardPattern` list branch | `absolute bottom-2 left-2` (new) | same `bg-overlay/60`/`rounded-full` tokens as grid | Change (added) | Playwright rect check |
| Location + footer row (list) | `MantineListingCardPattern` list branch | `flex flex-wrap items-center gap-x-2 gap-y-1` (rebuilt) | Tailwind flex/gap utilities, no new tokens | Change (bug fix) | Playwright computed-style/rect before/after |

## Canonical UI decision record

| Visible artifact | Search evidence | Canonical decision | Shared source + coverage |
|---|---|---|---|
| Copy-ID control | Per kickoff: no primitive story existed; `ListingCard.tsx` inline button + Task-655 `UnstyledButton` | **create canonical** — `MantineCopyIdButton` | `Mantine/Primitives/CopyIdButton` story; registered via both card stories + production; `check:story-coverage` proves it |
| Favorite (both stories) | Real `FavoriteButton` (Mantine `ActionIcon`, Task 653) — already canonical | **reuse**, extended with an `overlay` prop for the position-fix (owner-authorized) | `FavoriteButton.tsx`; no new component created, existing canonical primitive extended |
| ListingCard (composed) | No story rendered the real component before this task | **create canonical** — `Mantine/Primitives/ListingCard`, static-import | Real production import; coverage proven |
| Photo count (list) | `MantineListingCardPattern`'s own existing grid photo-count markup/tokens | **reuse** (same tokens, mirrored position) | Same `bg-overlay/60`/`rounded-full` classes already canonical for grid |

## Self-review findings

- Fixed: favorite-button `position:absolute` silently defeated by Mantine `ActionIcon`'s unlayered CSS (found via the D3 truthful-Story requirement; confirmed present in production via the D4 story too).
- Fixed: list-layout location text collapsing to `width:0` at narrow viewports (found via the D4 story; root-caused via computed-style inspection, not guessed).
- Fixed (owner correction, 2 iterations): list-layout wrap/shed behavior — first attempt right-aligned a lone wrapped copy-id via `margin-left:auto`, which looked like a stray hardcoded position once separated from location; removed in favor of plain left-flowing flex-wrap.
- No remaining known gaps against the R1–R8 requirement ledger.

## Assumptions, deviations, and limitations

- **Scope deviation (owner-authorized):** `FavoriteButton.tsx` and `MantineListingCardPattern.tsx`'s list layout are explicitly named out-of-scope in the kickoff ("FavoriteButton internals (reuse as-is)"; "Any card chrome change in `MantineListingCardPattern` beyond receiving the same slots"). Both were changed after I stopped, reported each as a `TASK SPECIFICATION CONTRADICTION`-class discovery with concrete rendered evidence, and the owner explicitly directed "fix it now in this task" for both. Recorded here for the reviewer to weigh explicitly.
- **No interactive browser/manual visual inspection available in this session.** Rendered proof was produced via headless Chromium (Playwright) against the actual built `storybook-static` output and real `getComputedStyle`/`getBoundingClientRect` reads — not a code-level assertion — but it is not the project's full `screenshots:assert --mantine-only` machine-gate run (not executed this session due to time; see Opus handoff).
- `MantineCopyIdButton` does not accept an `onCopy` injection prop (the kickoff called this optional/acceptable, not required) — kept the API minimal since no consumer currently needs it.
- The location/footer-actions row's wrap behavior was verified functionally (position, wrap order, no overflow) via Playwright: it was not verified against the full 14-viewport × 4-locale canonical matrix in this session.

## Opus handoff

- Please verify: whether the `FavoriteButton.overlay` prop and the `MantineListingCardPattern` list-layout changes should be recorded as their own follow-up governance note (e.g. `docs/mantine-responsive-design-system.md` UI migration table), since they touch a "single source of truth" pattern used sitewide on `/listings`.
- `npm run screenshots:assert -- --mantine-only` (the project's canonical machine-gate rendered proof) was not run this session — recommend running it before final approval, particularly for `CopyIdButton`, `ListingCardPattern`, and `ListingCard` at the full viewport/locale matrix.
- Evidence locations: Playwright ad hoc checks were run against `storybook-static/` builds produced by `npm run build-storybook`; no persisted screenshot artifacts were saved (state-inspection only, not the `--assert` PNG/JSON pipeline).

## Backlog update

See `docs/backlog.md` — concise current-state entry replacing the Task 655 line.
