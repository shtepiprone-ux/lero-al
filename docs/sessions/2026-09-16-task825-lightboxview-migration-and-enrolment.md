# Task 825 — `LightboxView` leaves Tailwind, then is enrolled

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (Revision 2 — see "Revision 2" section below;
Revision 1 was returned `NEEDS REVISION` by Opus review 2 on 2026-09-17; Revision 0 was returned
`NEEDS REVISION` by Opus review 1 on 2026-09-17. This line was the Revision 0 handoff.)

Kickoff: `tasks/Sprints/Sprint_75_kickoff_prompt_Task_825_LightboxView_Migration_And_Enrolment.md`

**Correction (Revision 1) to this Revision-0 record, per kickoff §16.7:** the "R6 evidence" section
below did NOT cover the strip scroller/strip row — R6 as originally written only measured close,
counter, prev, next, media image, first thumbnail, and (mobile) the pagination rail as a whole.
Deviation 4 below ("Surface-census baseline gap... 1 of the 8") is corrected by §16.1/§16.3: it was
1 of 8 total (rendered-scope + surface-census combined), not "1 of the 8" surface-census rows
specifically — all 7 surface-census rows were still present at Revision 0's handoff. Both gaps are
closed in the Revision 1 section (R16, R15) at the bottom of this log; the analysis above is kept
verbatim as the historical record of what Revision 0 actually did and found.

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1 | `LightboxView.tsx` has no Tailwind utility class; 3 new theme roles | `Select-String`-equivalent grep on `className="` in `LightboxView.tsx` returns nothing (verified via `grep -n 'className="' src/modules/listings/components/LightboxView.tsx`, no output). `theme.ts`: `other.boxSize.lightboxMediaMaxWidth='64rem'`, `other.boxSize.lightboxMediaInlineMargin='4rem'`, `other.lineHeight.lightboxCounter='1.25rem'`. |
| R2 | `GalleryNavActionIcon` drops `className`, takes typed `placement` | `GalleryNavActionIcon.tsx` — see diff; `centerY`/`raised` via `GalleryNavActionIcon.module.css`. |
| R3 | `GalleryDesktopNavigation` `NAV_VARIANTS` become placement objects, identical values | `GalleryDesktopNavigation.tsx` — see diff; gallery `{left:'xs',centerY,raised}` icon `roomy`; lightbox `{left:{base:'sm',sm:'xl'},centerY}` icon `decorative`. |
| R4 | Both control Stories render the new API; `LightboxView.stories.tsx` unchanged | `GalleryNavActionIcon.stories.tsx` uses `placement` (no `className`/local-identifier workaround); `GalleryDesktopNavigation.stories.tsx` needed no edit (already consumed the real component's own API); `LightboxView.stories.tsx` needed no edit (its own public props did not change). |
| R5 | Enrolment + baseline reconciliation | `mantine-migration-scope.json` +1; `check-surface-census.mjs --surface MantineListingGalleryPattern.tsx` exit 0; `rendered-scope-baseline.json` −1 entry (exactly the 1 stale edge, verified via `git diff`); `surface-census-baseline.json` — **only 1 of the 8 stale entries was reachable by the specified writer; see "Surface-census baseline gap" below.** |
| R6 | Before/after rendered-geometry equality | Playwright probe against `build-storybook` output — all rects byte-equal; see "R6 evidence" below. |
| R7 | Critical-flow regression proof | `ListingGallery.portal.smoke.test.tsx` 4/4 pass; `task612` live script 28/28 pass; `check:click-shield` modal (LightboxView) scenario 16/16 pass, 0 interceptions. |
| R8 | Owner visual QA matrix | Handed over below (§13.3), not scored by this session. |
| R9 | 794 rescope | `git diff --stat` shows no change to `GalleryStaticFrame.tsx`/`ListingGallery.tsx`. |

## Current versus required behavior

**Before.** `LightboxView.tsx` rendered through 13 Tailwind utility-class `className` strings; `GalleryNavActionIcon`/`GalleryDesktopNavigation`'s public API was a Tailwind class string. **After.** Identical rendering (R6-verified) from Mantine style props, 3 new `theme.other` tokens, and `LightboxView.module.css`; the two patterns take a typed `placement` object. Negative flows (single image hides prev/next, mobile swipe+pagination rail, thumbnail-strip overflow, locale variance) are unchanged code paths — none were touched by this migration; the Storybook composition (`Default`/`SwipeTrackMode`) exercises them.

## Files Changed

| Path | Reason |
|---|---|
| `src/modules/listings/components/LightboxView.tsx` | R1 — remove all Tailwind utility classes; Mantine style props + CSS Module for the rest. |
| `src/modules/listings/components/LightboxView.module.css` | R1 — new classes (`.body`, `.centerX`, `.minZero`, `.fill`, `.strip`, `.clip`, `.noShrink`) + `display:flex` added to `.paginationRail`. |
| `src/design-system/mantine/patterns/GalleryNavActionIcon.tsx` | R2 — `className` → typed `placement`; exports the shared offset resolver. |
| `src/design-system/mantine/patterns/GalleryNavActionIcon.module.css` | R2 — new file: `.centerY`, `.raised`. |
| `src/design-system/mantine/patterns/GalleryDesktopNavigation.tsx` | R3 — `NAV_VARIANTS` become placement objects; icons take `size=`. |
| `src/design-system/mantine/theme.ts` | R1 — 3 new `other` roles (`boxSize.lightboxMedia*`, `lineHeight.lightboxCounter`). |
| `src/stories/mantine/primitives/GalleryNavActionIcon.stories.tsx` | R4 — demo positioning through the real `placement` API. |
| `scripts/mantine-migration-scope.json` | R5 — `LightboxView.tsx` enrolled. |
| `scripts/rendered-scope-baseline.json` | R5 writer — 1 stale edge removed (`check:rendered-scope:update-baseline`). |
| `scripts/surface-census-baseline.json` | R5 writer — ran, wrote 0 net change (see gap below). |
| `src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx` | Pre-existing baseline defect fix (see "Deviations"), required to produce R7 evidence. |
| `docs/sessions/2026-07-16-task612-assets/manifest.after.json` + 4 PNGs | Produced by running the required `task612` script (its own designed output location). |
| `docs/backlog.md` | Concise state update. |

No change to `GalleryStaticFrame.tsx`/`ListingGallery.tsx` (R9, confirmed by `git diff --stat`).

## Validation evidence

All commands run from the repo root; transcripts under `docs/sessions/evidence/task825/`.

**Baseline (§13.1)** — `01_baseline_surface-census.txt` (exit 1, `LightboxView.tsx` only, matches §3.1) · `03_baseline_design-tokens-strict.txt` (exit 0) · `04_baseline_build-storybook.txt` (exit 0). Baseline vitest (`02_baseline_vitest_portal-smoke.txt`) was **not** a clean pass as the kickoff assumed — see "Deviations."

**Final gate (§13.2):**

| Command | Result | Transcript |
|---|---|---|
| `npm run typecheck` | exit 0 | (inline, not separately archived) |
| `npm run lint` | exit 0, 0 errors, pre-existing warnings only | (inline) |
| `vitest run .../ListingGallery.portal.smoke.test.tsx src/design-system/mantine` | 139/140 pass; 1 pre-existing unrelated failure (`FooterView.tsx`/`footerGridGap`, see Deviations) | `22_final_vitest_v2.txt` |
| `npm run check:design-tokens:strict` | exit 0, 0 violations | `06_final_design-tokens-strict.txt` |
| `npm run check:stories` | exit 0 | `07_final_check-stories.txt` |
| `npm run check:story-coverage` | exit 0, 73/73 covered | `17_final_check-story-coverage.txt` |
| `node scripts/check-surface-census.mjs --surface .../MantineListingGalleryPattern.tsx` | exit 0 | `09_final_surface-census.txt` |
| `npm run check:rendered-scope` (pre-update) | exit 1, 1 stale entry named | `10_pre-baseline-update_rendered-scope.txt` |
| `npm run check:rendered-scope:update-baseline` | exit 0, exactly 1 removal, 0 additions | `11_rendered-scope_update-baseline.txt` |
| `npm run check:rendered-scope` (post-update) | exit 0 | `12_final_rendered-scope.txt` |
| `npm run check:rendered-scope:verify` | exit 0, 5/5 arms | `13_final_rendered-scope-verify.txt` |
| `npm run check:surface-census:changed -- --base HEAD` | exit 0 | `14_pre-baseline-update_surface-census-changed.txt` |
| `npm run check:surface-census:changed:update-baseline -- --base HEAD` | exit 0, 0 net diff on `surface-census-baseline.json` | `15_surface-census-changed_update-baseline.txt` |
| `npm run check:surface-census:changed:verify` | exit 0, 8/8 arms | `16_final_surface-census-changed-verify.txt` |
| `npm run build-storybook` | exit 0 | `19_final_build-storybook_v2.txt` |
| `npm run build` | exit 0 | `23_final_build.txt` |
| `npm run check:click-shield` (BASE_URL, `CLICK_SHIELD_CI_FIXTURE=1` server) | **modal (LightboxView) scenario: 16/16 PASS, 0 interceptions.** Overall script exit 2 — see "Deviations" (unrelated pre-existing failures) | `24_final_click-shield.txt` |
| `node scripts/task612-qa-listinggallery-lightbox-portal.mjs` | 28/28 PASS, exit 0, `SLUG=11-mr7ucly4` (see "Deviations" — the documented example slug does not exist in this environment's DB) | `26_final_task612_realslug.txt` |
| `npm run check:file-integrity` | exit 0, 53 files clean | `27_final_file-integrity.txt` |
| `npm run check:mojibake` | exit 0, 0 artifacts / 5183 files | `28_final_mojibake.txt` |
| `git --no-optional-locks diff --stat` | 14 files, +266/−95 | `29_final_diff_stat.txt` |
| `git --no-optional-locks hash-object` (every §7 path) | recorded | `30_final_hash-object.txt` |

## Visual source trace

| Visible artifact | Component/markup | Class/selector (before → after) | Change/preserve | Evidence |
|---|---|---|---|---|
| Close control | `GalleryNavActionIcon` | `className="top-4 right-4 z-10"` → `placement={{top:'md',right:'md',raised:true}}` | Change (mechanism), preserve (render) | R6: rect/z-index byte-equal |
| Counter | `Box` in `LightboxView` | `absolute top-4 left-1/2 -translate-x-1/2 text-sm` → `pos="absolute" top=… left="50%" fz="sm" lh=…` + `.centerX` | Change (mechanism), preserve (render) | R6: rect/font-size/line-height byte-equal |
| Prev/Next (lightbox) | `GalleryNavActionIcon` via `GalleryDesktopNavigation` | `left-3 sm:left-6 top-1/2 -translate-y-1/2` → `placement={{left:{base:'sm',sm:'xl'},centerY:true}}` | Change (mechanism), preserve (render) | R6: rect byte-equal; `transform` string differs (explained, not a regression — see Deviations) |
| Desktop media column | `div` → `Stack` | `max-w-5xl mx-16 min-w-0 flex flex-col min-h-0` → `maw`/`mx` tokens + `.minZero` | Change (mechanism), preserve (render) | R6: media img rect byte-equal |
| Thumbnail strip | `div` → `Group` | `shrink-0 flex justify-start overflow-x-auto px-2 pt-4` → `Group` props + `.strip` | Change (mechanism), preserve (render) | R6: first-thumbnail rect byte-equal |
| Mobile pagination rail | `div` → `Box` | `absolute bottom-4 left-1/2 -translate-x-1/2 flex` → `pos`/`bottom`/`left` props + `.centerX` + `display:flex` on `.paginationRail` | Change (mechanism), preserve (render) | R6: rail rect byte-equal |
| `GalleryStaticFrame.tsx`, `ListingGallery.tsx` (R9, preserve) | — | — | Out of scope, untouched | `git diff --stat` shows no entry |
| `color-mix` scrim, `.counter` colour (out of scope) | `LightboxView.module.css` | unchanged | Preserve | Not edited |

## Canonical UI decision record

| Changed artifact | Search evidence | Canonical source | Disposition | Consumed path |
|---|---|---|---|---|
| `GalleryNavActionIcon` placement | Only consumer of position offsets on this primitive; no other project pattern takes a typed offset object | `GalleryNavActionIcon.tsx` itself (extend) | Extend (16b/16c) | `theme.spacing` via `resolveGalleryOffset`; `GalleryNavActionIcon.module.css` |
| `GalleryDesktopNavigation` NAV_VARIANTS | Sole owner of the gallery/lightbox nav contract (pre-existing) | `GalleryDesktopNavigation.tsx` itself (extend) | Extend | `theme.other.iconSize.{roomy,decorative}` |
| LightboxView desktop column max-width/margin | `theme.other.boxSize` scale (Task 782/822/824 precedent) | `theme.ts` `other.boxSize` (extend) | Extend | New keys `lightboxMediaMaxWidth`/`lightboxMediaInlineMargin` |
| LightboxView counter line-height | `theme.other.lineHeight` scale (Task 822 precedent) | `theme.ts` `other.lineHeight` (extend) | Extend | New key `lightboxCounter` |
| `LightboxView`, `GalleryNavActionIcon`, `GalleryDesktopNavigation` Stories | Existing canonical Stories (`Mantine/Primitives/*`) already render the real production components | Reuse | Reuse | No new Story files; `GalleryNavActionIcon.stories.tsx` updated in place |

Registration: `scripts/mantine-migration-scope.json` (+`LightboxView.tsx`). `check:story-coverage` 73/73 green.

## GR-1 census receipt

`GR-1 CENSUS COMPLETE — 6 nodes; tier1 6 migrated+enrolled+story; tier2 0 imports removed; tier3 0 listed and filed as none.`

(`node scripts/check-surface-census.mjs --surface src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx`, exit 0 — `docs/sessions/evidence/task825/09_final_surface-census.txt`.)

## R6 evidence

Method: a scratch Playwright probe (not committed — ran from a temporary in-repo dir, deleted before this handoff) drove `build-storybook`'s static output directly (served locally), measuring `getBoundingClientRect()` and computed `z-index`/`transform`/`font-size`/`line-height` for close/counter/prev/next/media-image/first-thumbnail (`lightboxview--default` at 640/1024/1440×900) and close/counter/pagination-rail (`swipe-track-mode` at 320/390×800), plus prev/next in `gallerydesktopnavigation--default` and `listinggallerypattern--default` (1024/1440), `locale:en`.

Saved: `docs/sessions/evidence/task825/20_r6_before.json`, `21_r6_after.json`.

**Result: every rect (x/y/width/height, rounded 0.1px) and every `z-index`/`font-size`/`line-height` value is byte-identical before/after.** The only string difference is the computed `transform` for lightbox prev/next: `"none"` before vs. `"matrix(1, 0, 0, 1, 0, -22)"` after, at identical resulting rects. Explanation: Tailwind's compiled `-translate-y-1/2` applies via the standalone CSS `translate` property (not `transform`), which `getComputedStyle(el).transform` does not surface as a matrix the same way; the new `.centerY` class uses an explicit `transform: translateY(-50%)` declaration, which does. Same rendered position, different (and, if anything, more conventional) CSS mechanism — not a value-preservation violation per §5.2 (rects, the actual rendered geometry, are equal; the assumption note in §5.2 was specifically about `top="md"` resolving to the right *value*, which R6 also caught wrong on the first pass — see Deviations — and this fix is what makes the rects equal).

## Implementation validation notes — defect found and fixed during R6

R6's first pass (before the fix below) found the counter and pagination rail rendered at the **wrong position** (vertically centered instead of pinned near the edge) after the initial migration. Root cause, confirmed by reading `@mantine/core`'s own source (`style-props-data.mjs`): Mantine's `top`/`right`/`bottom`/`left` Box style props use the **"size" resolver** (identity — passes a string through, only converts numbers to `rem`), not the **"spacing" resolver** that `w`/`h`/`mx`/`maw` use. So a bare `top="md"` compiles to the literal, invalid CSS `top: md`, which the browser drops; the element then falls back to its absolutely-positioned "static position," which a flex ancestor's `align-items` (here, `Center`'s own `display:flex; align-items:center`) **does** influence per the flexbox spec — moving the counter to mid-screen. This exactly matches the kickoff's own flagged assumption (§5.2): "Mantine's `top="md"` resolves to `var(--mantine-spacing-md)`... R6 measures it." It does not, by itself. Fix: `GalleryNavActionIcon.tsx` exports `resolveGalleryOffset`, a small helper that resolves a `theme.spacing`-membership key to `var(--mantine-spacing-<key>)` before handing it to the style prop (the same membership test `@mantine/core`'s own `spacingResolver` uses) and passes raw values (e.g. `"50%"`) through unchanged; `LightboxView.tsx`'s counter and pagination-rail now call the same helper instead of passing a bare spacing-key string to `top`/`bottom`. Re-verified: R6 after the fix is byte-equal (see above). This did not require reverting to Tailwind or tuning a value — it is a correct implementation of the same intended token, using the framework correctly.

## Assumptions, deviations, and limitations

1. **Pre-existing baseline vitest failures fixed as a prerequisite for R7 evidence, not new scope.** `ListingGallery.portal.smoke.test.tsx` was already red before this task touched anything (confirmed: `docs/backlog.md` row 61/Task 790 already predicted "825 starts red" for exactly this ResizeObserver reason). Two gaps, both from Task 824 adding `LightboxView`'s mobile/desktop split without updating this pre-existing Task-612 test: (a) no `ResizeObserver` stub (jsdom has none; `useSwipeTrackSync` constructs one when the mobile branch mounts) — added, matching the exact convention already used in `MantinePagination.smoke.test.tsx`; (b) the fixed `matchMedia` stub always reported `matches:false`, so `useMatches({base:true, sm:false})` resolved "mobile" in this test environment and hid the desktop Prev/Next buttons the "Prev/Next buttons cycle the counter" test asserts — fixed by making the stub report the `sm` (40em) breakpoint as matched, matching this suite's own original (Task 612, pre-824) desktop-only intent. Both fixes are additive, in the existing file, and use the codebase's own established stub conventions — no test assertion was weakened. `POLICY-EDIT AUTHORITY REQUIRED` does not apply (this is a test file, not a policy/governance doc).
2. **`task612`'s documented example slug (`test-7-molyl9c8`) does not resolve to a real listing in this environment's database** (`.listing-gallery` never rendered — confirmed via direct Playwright inspection, no console/page errors). Per the kickoff's own §5.2/§13.2 fallback instruction, substituted `SLUG=11-mr7ucly4` (7 photos, confirmed via the lightbox's own "1 / 7" counter) and recorded it here. 28/28 PASS.
3. **`check:click-shield` — overall script exit 2, but the R7-relevant "modal" (LightboxView) scenario is clean.** 16/16 modal cells PASS, 0 interceptions. The non-zero exit is from two unrelated failures with zero plausible connection to this task's diff: (a) the "drawer" scenario's trigger `header button:has(svg.lucide-heart)` (AuthSheet) was not found in any of its 16 cells — a header wishlist-icon control this task never touched; (b) one `[base]` interception on `/it` mobile-375, a footer `<a>` link where `elementFromPoint` returned `null`. Both are outside this task's changed-file set (`LightboxView.tsx`, `GalleryNavActionIcon.tsx`, `GalleryDesktopNavigation.tsx`, `theme.ts`). I did not revert-and-reproduce against a clean `HEAD` to formally rule this out (would require a destructive `git` operation outside Sonnet's git boundary); flagging for Opus to independently confirm via read-only `git show`/`git stash` if a stronger proof is wanted before approval.
4. **Surface-census baseline gap — R5 only partially achieved, and not by a code defect.** `check:rendered-scope:update-baseline` cleanly removed the 1 stale `rendered-scope-baseline.json` edge (verified: `git diff` shows exactly that 3-line removal, 0 additions). `check:surface-census:changed:update-baseline`, however, produced a **0-byte diff** on `surface-census-baseline.json` — none of the 7 stale `LightboxView.tsx` rows (keyed by `MantineListingGalleryPattern.tsx`, `ListingDetailView.tsx`, `ListingGallery.tsx`, and 3 route pages) were removed. Root cause, read directly from `scripts/map-changed-surfaces.mjs`'s `resolveSurfacesFor`: it climbs from a changed file toward its renderer(s) via `renderedBy`, but stops climbing the instant it reaches a node that is *already* a manifest root — "never climb past a root." Once this task's own R5 step adds `LightboxView.tsx` to `scripts/mantine-migration-scope.json`, `LightboxView.tsx` itself becomes such a root, so its own changed-file entry resolves to itself and the walk never reaches `MantineListingGalleryPattern.tsx` etc. The gate's own `--verify-gate` self-test independently documents this as intended behavior ("Arm 7 — baseline entry for an un-censused surface -> carried, not stale, does not fail"). The 7 rows are therefore inert recorded debt (the gate stays green — confirmed, both `check:surface-census:changed` and `:verify` exit 0), not a new defect, but R5's literal "8 removals" is not achievable via the specified command without touching `MantineListingGalleryPattern.tsx`/`ListingDetailView.tsx`/`ListingGallery.tsx`/3 route pages directly, which is outside this task's scope (and R9 explicitly forbids touching `ListingGallery.tsx`). **Reported, not silently worked around — Opus/owner decision needed**: accept as harmless carried debt (self-retires whenever one of those 6 files is next genuinely touched), file a follow-up task against `map-changed-surfaces.mjs`'s climb-past-a-freshly-enrolled-root case, or direct a different remediation.
5. **`GalleryDesktopNavigation.stories.tsx` and `LightboxView.stories.tsx` needed no edits** (R4's "only if the API change requires") — neither file's own public consumption of these components changed shape.

## Opus handoff

Evidence root: `docs/sessions/evidence/task825/` (30 files) + this log. Specific things to inspect:

- The offset-resolution bug and fix (Implementation validation notes) — worth an independent read of `GalleryNavActionIcon.tsx`'s `resolveGalleryOffset` and its two call sites in `LightboxView.tsx`.
- Deviation 4 (surface-census baseline gap) — a tooling-mapping question, not a product defect; needs an explicit decision recorded in the sprint file per GR-1's spirit (no rule may be silently narrowed).
- Deviation 3 (click-shield) — confirm the two unrelated failures are pre-existing if a stronger guarantee is wanted before approval.
- §13.3 owner visual matrix below — unscored by this session.

## §13.3 — OWNER VISUAL QA REQUIRED

| Story | State | Widths | Locales |
|---|---|---|---|
| `mantine-primitives-lightboxview--default` | desktop, many photos | 640, 1024, 1440 | sq, en, uk, it |
| `mantine-primitives-lightboxview--swipe-track-mode` | mobile | 320, 390 | sq, en, uk, it |
| `mantine-primitives-gallerynavactionicon--default` | both tones | 390, 1440 | en |
| `mantine-primitives-gallerydesktopnavigation--default` | both variants | 1024, 1440 | en |
| `patterns-mantine-listinggallerypattern--default` | closed gallery, nav on photo | 640, 1440 | en |

## Backlog update (Revision 0)

`docs/backlog.md` — Last Session paragraph extended with 825's status; the Sprint-75 registry row's `825` clause updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with a one-line summary. Resulting file: 78 physical lines (budget 80) — no `BACKLOG LIMIT BREACH`.

No self-approval. No mutating git command run, emitted, or suggested by this session.

---

# Revision 1 — kickoff §16 (R10–R16, AC7–AC14), 2026-09-17

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

Re-entry mode per §16.0: remediation. Every Revision 0 file change and transcript `01`–`30` is kept
unmodified; new transcripts start at `31`. R1–R4 were not reverted.

## Requirement and acceptance-criteria evidence (R10–R16)

| ID | Requirement | Evidence |
|---|---|---|
| R10 | Mobile pagination rail is an inset, scrollable, single-row carousel | `LightboxView.tsx` — outer `Group` (`pos="absolute" bottom/left/right=resolveGalleryOffset(theme,'md')`, `.paginationRail`+`.hiddenScrollbar`), inner `Group` (`gap="xs" mx="auto"`, `.paginationRow`). AC7: `39_ac7-11_final-report.json` — 5/5 mobile widths, `Modal.Content` never overflows, rail `left=16`/`right=viewport-16` exactly. |
| R11 | Keep-active-in-view, nearest, never centres | `src/hooks/useKeepActiveInView.ts` — pure `computeNearestScrollLeft` + the hook. Unit-tested: `src/hooks/__tests__/useKeepActiveInView.test.ts`, 9/9 pass (`46_rev1_vitest_targeted.txt`). |
| R12 | Applied to both scrollers, wrap-around works | `LightboxView.tsx` — `stripScrollerRef`/`railScrollerRef` + `useKeepActiveInView` calls. AC8 (mobile, 320/390): `allContained=true`, `allAncestorZero=true`, 24→1 wrap lands `scrollLeft=0`. AC9 (desktop, 640/960/1440): same, `allContained=true` after fixing a real bug (see "Defects found and fixed" below). |
| R13 | Hidden native scrollbar on both scrollers, still scrollable | `LightboxView.module.css` `.hiddenScrollbar`. AC10 failing-arm-first: `31_ac10_failing-arm_before-r13.json` (delta=6, scrollbarWidth `auto` — probe proven not blind) → after: `36_ac10_after-r13.json` and `39_ac7-11_final-report.json` AC10 (delta=0, scrollbarWidth `none`, strip at 640/960 and rail at 320). |
| R14 | `LightboxView.stories.tsx` covers both rail states (overflow + fitting) with the real component | `SwipeTrackModeFewPhotos` export added (4 photos, `opened` always true). `check:stories`/`check:story-coverage`/`build-storybook` all exit 0 (`32`, `33`, `38_rev1_build-storybook_v3.txt`). AC11: `39_ac7-11_final-report.json` — row width 88px, centred exactly (`rowCenter===viewportCenter`) at 320 and 390. |
| R15 | Remove the 7 stale surface-census rows via a scoped proof-then-remove procedure | 7 per-surface `--json` census transcripts: `docs/sessions/evidence/task825/40_r15_census/1.txt`-`7.txt` — every one shows `LightboxView.tsx` `manifest:true story:true tier:tier1` (never the blocking node for that surface; the actual blockers are unrelated pre-existing components, see "R15 detail" below). Scratch removal script (not committed) refused to run twice (`SCOPE GUARD FAILED` on the second, already-applied invocation — `43_r15_removal-script-output.txt`), and on the first run deleted exactly the 7 target keys (`git diff --stat`: 21 deletions, 0 additions). `grep -c "LightboxView.tsx :: tier1-unenrolled-or-unstoried" scripts/surface-census-baseline.json` = 0. `check:surface-census:changed -- --base HEAD` and `:verify` both exit 0 (`41`, `42`). |
| R16 | R6 completion — strip scroller/row measured, equality confirmed | `docs/sessions/evidence/task825/39_ac7-11_final-report.json` (AC7/AC10/AC11) plus a dedicated R16 probe (not separately saved as a numbered transcript; its output is reproduced verbatim in "R16 evidence" below) confirm every Revision-0-measured element (close, counter, prev, next, media image, first thumbnail) is byte-identical, the newly-measured strip scroller/row match the predicted formula (`scroller.x = firstThumbRect.x − 8`), and the only changed element is the mobile rail (owner-decided, §16.2). |

## Defects found and fixed during Revision 1 (both via real interaction, not just rect probes)

1. **Mantine's own `:active` press effect was dropping nav-button clicks.** AC9's real click-and-walk (not merely reading `.boundingBox()`) found that clicking "Next"/"Prev" in `lightboxview--default` timed out — Playwright's actionability check reported `<div class="mantine-Center-root"> intercepts pointer events`. Root cause, isolated with `page.mouse.move` + `elementFromPoint` before/after `mousedown`: the button's own vertical position jumped ~22px on press. `@mantine/core`'s global `global.css`: `.mantine-active:active { transform: translateY(calc(0.0625rem * var(--mantine-scale))); }` — applied to every interactive Mantine component including this `ActionIcon` — has higher specificity (`:active` compound, (0,2,0)) than a bare class (`.centerY`, (0,1,0)) and overwrote `centerY`'s `transform: translateY(-50%)` entirely for the duration of any press, regardless of source order. Fix: `GalleryNavActionIcon.module.css`'s `.centerY` now uses the CSS `translate` property (`translate: 0 -50%`) instead of `transform` — a separate CSS property (Transforms Level 2) that Mantine's rule never touches, so both compose without collision. This is also a return to the pre-825 Tailwind mechanism (`-translate-y-1/2` compiles to `translate`, not `transform` — see the original R6 finding that `transform` read `"none"` on the pre-migration build). Verified: 5/5 raw clicks succeed post-fix (`debug-click-loop.mjs`, not saved — trivial repro), and the full AC9 walk passes (0 uncontained steps at all 3 desktop widths).
2. **`useKeepActiveInView`'s first implementation used `item.offsetLeft`, which is relative to `offsetParent` (nearest positioned ancestor) — not reliably the scroller.** The desktop thumbnail-strip scroller (`Group`, no `position` of its own) is not itself an `offsetParent`, so `offsetLeft` resolved against `Center` (`pos="relative"`, much larger) instead, producing near-arbitrary `itemStart`/`itemEnd` values; AC9 failed with 12-31 "uncontained" steps per width even after fix #1. The mobile rail happened to work because it has `pos="absolute"` on the scroller itself, making it its own `offsetParent`. Fixed by computing `itemStart`/`itemEnd` from `getBoundingClientRect()` deltas (position-context-independent) instead of `offsetLeft`/`offsetWidth`; the vitest mocks were updated to match (`getBoundingClientRect` mocked per item/scroller, recomputed from the mock's own `scrollLeft`, rather than static `offsetLeft`/`offsetWidth`). Verified: AC9 0 uncontained steps at 640/960/1440 after the fix.
3. **The probe's own scroll-settle detector was reading mid-animation state.** A 2-consecutive-stable-frame check falsely reported "settled" during a near-zero-velocity moment of Chromium's smooth-scroll easing, ~8px short of the real endpoint (confirmed by comparing a manual fixed-700ms-wait debug run against the polling probe on the identical step). Not a product defect — evidence-tooling only. Fixed by requiring 20 consecutive stable frames plus a 150ms minimum before the count starts.

None of the three defects is a Revision-0 regression relative to the pre-825 Tailwind behavior (defect 1's Tailwind equivalent never collided because it used `translate`, not `transform`, for the identical reason the fix now uses); all three were latent, undetectable by `getBoundingClientRect()`-only measurement, and were only surfaced by AC8/AC9's mandated real click-and-key interaction walk.

## AC7–AC14 evidence detail

- **AC7** (`39_ac7-11_final-report.json` → `AC7`): 5/5 mobile widths (320/360/390/480/560) — `Modal.Content.scrollWidth ≤ clientWidth` (no sideways overflow) at every width; rail scroller `left=16`, `right=viewport−16` exactly; 24 segments, each 16×2px, adjacent lefts differ by exactly 24px (16px segment + 8px `gap="xs"`).
- **AC8** (same file → `AC8`): mobile 320/390, 24 forward + 24 back key-driven walk. `allContained=true`, `allAncestorZero=true` (document and `Modal.Content` `scrollLeft`/`scrollTop` stayed 0 at all 48 steps × 2 widths), wrap 24→1 lands `scrollLeft=0`.
- **AC9** (same file → `AC9`): desktop 640/960/1440, same 24-forward/24-back walk via the real Next/Prev buttons. `allContained=true`, `allAncestorZero=true` at all 3 widths, after the two defect fixes above.
- **AC10**: failing-arm-first, required by the kickoff — `31_ac10_failing-arm_before-r13.json` (delta=6px, `scrollbar-width: auto`, proving the `ignoreDefaultArgs: ['--hide-scrollbars']` Chromium launch is not blind) → `36_ac10_after-r13.json` / `39_...` `AC10` (delta=0, `scrollbar-width: none`) for the strip at 640/960 and the rail at 320.
- **AC11** (same file → `AC11`): `SwipeTrackModeFewPhotos` at 320/390 — row width 88px (4×16+3×8), centred exactly (`rowCenter === viewportCenter`), `railScrollWidth === railClientWidth` (no overflow).
- **AC12**: `src/hooks/__tests__/useKeepActiveInView.test.ts`, 9/9 pass — 5 pure-function cases (past-right, past-left, fully-visible-unchanged, wider-than-viewport-aligns-to-start, exactly-on-both-edges-unchanged) + 4 hook cases (first-run `'auto'`, later change `'smooth'`, reduced-motion forces `'auto'`, `scrollIntoView` never called).
- **AC13**: `check:stories` exit 0 (`32`), `check:story-coverage` exit 0 73/73 (`33`), `build-storybook` exit 0 (`38`).
- **AC14**: 7 per-surface census transcripts (`40_r15_census/1.txt`-`7.txt`), removal script's printed 7-key manifest (`43`), before/after `hash-object` (`2faf21b...` → `7d7aa14...`, in `43`), `grep -c` = 0, `check:surface-census:changed`/`:verify` both exit 0 (`41`, `42`).

`GR-4 AC AUDIT — 8 criteria (AC7-AC14) confirmed observable and met; no absolute was substituted for a judgment call.`

## R15 detail — why all 7 removals are safe

Each of the 7 parent surfaces' own census (`--json`) was inspected individually (not inferred from the overall exit code, which is non-zero for 5 of the 7 due to unrelated pre-existing debt):

| Parent surface | Census exit | LightboxView.tsx row | Other blocking nodes (not this task's) |
|---|---|---|---|
| `.../ci/click-shield-modal/page.tsx` | 1 | `manifest:true story:true tier:tier1` | `ClickShieldModalFixture.tsx`, the page itself |
| `.../listings/[slug]/page.tsx` | 1 | `manifest:true story:true tier:tier1` | `GalleryStaticFrame.tsx` (794), `ListingReportDialog.tsx`, `SimilarListings.tsx`, shadcn `ui/*` (814), 10 others |
| `.../admin/listings/[id]/preview/page.tsx` | 1 | `manifest:true story:true tier:tier1` | same family as `[slug]/page.tsx` |
| `MantineListingDetailPattern.tsx` | 0 | `manifest:true story:true tier:tier1` | none |
| `MantineListingGalleryPattern.tsx` | 0 | `manifest:true story:true tier:tier1` | none |
| `ListingDetailView.tsx` | 1 | `manifest:true story:true tier:tier1` | same family as `[slug]/page.tsx` |
| `ListingGallery.tsx` | 1 | `manifest:true story:true tier:tier1` | `ListingGallery.tsx` itself (794's own unenrolled scope), `ui/button.tsx` |

R15's own condition ("no blocking tier" for `LightboxView.tsx` specifically) holds for all 7; none of the other blocking nodes is in this task's scope (794, 814, 829 already file them).

## R16 evidence (R6 completion)

Probe against `build-storybook` output (chromium default launch, `locale:en`), measuring close/counter/prev/next/media-image/first-thumbnail/strip-scroller/strip-row at `lightboxview--default` (640/1024/1440×900) and close/counter/rail-scroller/rail-row at `swipe-track-mode` (320/390×800):

- **Unchanged from Revision 0's `21_r6_after.json`, byte-for-byte**: close (rect+z-index), counter (rect+font-size+line-height), prev/next (rect; z-index; `transform` field wasn't re-requested this run — already proven equivalent via the AC9 interaction walk, which depends on the real computed transform working correctly), mediaImgRect, firstThumbRect, mobile close, mobile counter.
- **New (not measured in Revision 0)**: `stripScrollerRect` — `x = 64/64/208` at 640/1024/1440 = `firstThumbRect.x (72/72/216) − 8` exactly, matching the predicted formula (§16.4 R16); `stripRowRect` width `1240` at all 3 widths (24×44 + 23×8 = 1256−16 padding, consistent with the earlier-measured `scrollWidth=1256`).
- **Intentionally changed (owner decision §16.2, R10)**: mobile `railScrollerRect` — now `x=16` (inset), `width = viewport−32` (288/358 at 320/390) instead of the pre-Revision-1 `x=-124/-89, width=568` (raw overflow, centred past both edges). `railRowRect` width stays `568` (unchanged row content — only its container is different).

No other difference found. R16 satisfied.

## Validation evidence (Revision 1 additions)

| Command | Result | Transcript |
|---|---|---|
| `npm run typecheck` | exit 0 | `44_rev1_typecheck.txt` |
| `npm run lint` | exit 0, 0 errors (3 new warnings, all from `.tmp-task825/` scratch files not committed) | `45_rev1_lint.txt` |
| `vitest run useKeepActiveInView.test.ts ListingGallery.portal.smoke.test.tsx` (§16.8) | 13/13 pass | `46_rev1_vitest_targeted.txt` |
| `vitest run ListingGallery.portal.smoke.test.tsx src/design-system/mantine` (§13.2) | 139/140 pass; same 1 pre-existing unrelated `FooterView`/`footerGridGap` failure as Revision 0 | `47_rev1_vitest_full.txt` |
| `npm run check:design-tokens:strict` | exit 0 | `34_rev1_design-tokens-strict.txt` |
| `npm run check:stories` | exit 0 | `32_rev1_check-stories.txt` |
| `npm run check:story-coverage` | exit 0, 73/73 | `33_rev1_check-story-coverage.txt` |
| `node scripts/check-surface-census.mjs --surface .../MantineListingGalleryPattern.tsx` | exit 0, `GR-1 CENSUS COMPLETE` | `48_rev1_surface-census.txt` |
| `npm run check:rendered-scope` | exit 0 | `49_rev1_rendered-scope.txt` |
| `npm run check:rendered-scope:verify` | exit 0, 5/5 arms | `50_rev1_rendered-scope-verify.txt` |
| `npm run check:surface-census:changed -- --base HEAD` (post-R15) | exit 0 | `41_r15_surface-census-changed.txt` |
| `npm run check:surface-census:changed:verify` (post-R15) | exit 0, 8/8 arms | `42_r15_surface-census-changed-verify.txt` |
| `npm run build-storybook` | exit 0 (3 iterations while fixing the 2 real bugs; final one is `38_rev1_build-storybook_v3.txt`) | `35`, `37`, `38` |
| `npm run build` | exit 0 | `51_rev1_build.txt` |
| `npm run check:click-shield` | modal (LightboxView) scenario: 16/16 PASS, 0 interceptions (unchanged from Revision 0); overall exit 2 from the same 2 pre-existing unrelated failures (AuthSheet drawer trigger, 1 footer interception) | `52_rev1_click-shield.txt` |
| `node scripts/task612-qa-listinggallery-lightbox-portal.mjs` (`SLUG=11-mr7ucly4`) | 28/28 PASS, exit 0 | `53_rev1_task612.txt` |
| `npm run check:file-integrity` | exit 0, 97 files clean (first run found 14 corrupt `.json`-extension files — my own R15 census transcripts had a raw `EXIT_CODE=N` line appended after valid JSON; renamed to `.txt`, re-ran clean) | `54_rev1_file-integrity.txt` |
| `npm run check:mojibake` | exit 0, 0 artifacts / 5219 files | `55_rev1_mojibake.txt` |
| `git --no-optional-locks diff --stat` | 16 files, +343/−131 | `56_rev1_final_diff_stat.txt` |
| `git --no-optional-locks hash-object` (every changed path) | recorded | `57_rev1_final_hash-object.txt` |

## Files Changed (Revision 1, in addition to Revision 0's table)

| Path | Reason |
|---|---|
| `src/hooks/useKeepActiveInView.ts` | R11 — new hook + pure `computeNearestScrollLeft`. |
| `src/hooks/__tests__/useKeepActiveInView.test.ts` | AC12 — unit coverage. |
| `src/design-system/mantine/patterns/GalleryNavActionIcon.module.css` | Defect 1 fix — `.centerY` uses `translate`, not `transform`. |
| `src/modules/listings/components/LightboxView.tsx` | R10/R12 — inset rail carousel, `useKeepActiveInView` wired to both scrollers. |
| `src/modules/listings/components/LightboxView.module.css` | R10/R13 — `.hiddenScrollbar`, `.paginationRow`, `.paginationRail` restructured to the strip's own outer-scroller shape. |
| `src/stories/mantine/primitives/LightboxView.stories.tsx` | R14 — `SwipeTrackModeFewPhotos` export. |
| `scripts/surface-census-baseline.json` | R15 — 7 stale rows removed by the scoped script. |
| `docs/sessions/2026-07-16-task612-assets/*` | Re-produced by re-running the required `task612` script (R7 re-verification, rail/strip DOM changed). |
| `docs/backlog.md` | Concise state update (Revision 1). |
| This session log | This "Revision 1" section + the correction note at the top. |

**Not edited** (per §16.7): `MantineListingGalleryPattern.tsx`, `GalleryThumbnailButton.tsx`, `useSwipeTrackSync.ts`, `theme.ts` — confirmed by `56_rev1_final_diff_stat.txt` (`GalleryNavActionIcon.tsx` itself also shows no Revision-1 diff — its `hash-object` is identical to Revision 0's final hash; only its co-located `.module.css` changed).

## Opus handoff (Revision 1)

- The two real defects (Mantine `:active` specificity collision; `offsetLeft` vs `getBoundingClientRect`) are worth independently reproducing — both were invisible to a static-rect-only probe and only surfaced through actual click/key interaction, which is exactly what AC8/AC9 were designed to force.
- R15's safety argument (the table in "R15 detail") is the thing to check most carefully: it rests on reading each of the 7 census `--json` outputs individually rather than trusting the aggregate exit code.
- §16.9 owner matrix below is unscored by this session, same as Revision 0's §13.3.
- The Task 831 mapper-gap reservation already on the backlog (filed during Opus's review 1) matches this session's own Revision-0 finding independently — no new information there, just confirmation.

## §16.9 — OWNER VISUAL QA REQUIRED (re-handed)

| Story | Widths | Locales | Owner checks |
|---|---|---|---|
| `mantine-primitives-lightboxview--swipe-track-mode` | 320, 360, 390, 480, 560 | en, uk | rail inside the screen, no white line, active line always visible, sizes unchanged |
| `mantine-primitives-lightboxview--swipe-track-mode-few-photos` | 320, 390 | en | rail centred |
| `mantine-primitives-lightboxview--default` | 640, 768, 960, 1440 | en, uk | no white line under thumbnails, active thumbnail always visible, carousel moves only when needed |

## Backlog update (Revision 1)

`docs/backlog.md` — Last Session paragraph's `825` sentence replaced with the Revision-1 completion summary; the Sprint-75 registry row's `825` clause updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with an R10-R16 summary. Resulting file: 78 physical lines (budget 80) — no `BACKLOG LIMIT BREACH`.

No self-approval. No mutating git command run, emitted, or suggested by this session.

---

# Revision 2 — kickoff §17 (R17–R18, AC15–AC16), 2026-09-17

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

Re-entry mode per §17.0: remediation. Every Revision 0 and Revision 1 change and transcript `01`–`57`
(plus `40_r15_census/`) is kept unmodified; new transcripts start at `58`. R10–R16 were not reverted
(the owner accepted them visually). R15 was not re-run (census rows already gone, AC14).

## Owner return this revision addresses

Quoted verbatim, §17.1: "Візуально все виправлено, але якщо перемикатись між першим і останнім фото,
або між останнім та першим фото - каресель прокручується в реальному часі до потрібного фото... Якщо
користувач знаходиться на останньому фото і клікає праворуч, то система має його перенести до першого
фото, не показуючи як перемотується вся карусель." Cause (kickoff's own, §17.1): `useKeepActiveInView`
chose `behavior: 'smooth'` for every later `activeIndex` change, including a wrap (last→first,
first→last), so the browser visibly animated `scrollLeft` across the whole row on a wrap step.

## Requirement and acceptance-criteria evidence (R17–R18)

| ID | Requirement | Evidence |
|---|---|---|
| R17 | A wrap step never animates; also any jump wider than one viewport | `src/hooks/useKeepActiveInView.ts` — new pure `resolveScrollBehavior({isFirstRun, prefersReducedMotion, previousIndex, nextIndex, count, scrollLeft, nextScrollLeft, clientWidth})`. Wrap: `count>=3` and the index pair is `(count-1,0)` or `(0,count-1)` → `'auto'`. Also `'auto'` when `\|nextScrollLeft-scrollLeft\| > clientWidth`. Everything else (first run, reduced motion) unchanged from R11. The hook now tracks `previousIndex` in a ref and passes it, plus `row.children.length` as `count`, into the new helper. AC15 (7 pure-function cases + 2 hook wrap cases, failing-arm-first) and AC16 (Playwright, 3 cells) both green — see below. |
| R18 | R11's geometry, containment, ancestor-scroll-ban and `scrollIntoView`-ban stay unchanged; only `behavior` selection changed | `computeNearestScrollLeft` is byte-unchanged (confirmed: the function's own source has zero diff in `56_rev1_final_diff_stat.txt` vs. this session's `75_rev2_final_diff_stat.txt` — only `resolveScrollBehavior` and the hook body around it changed). AC16's forward/backward 23-step walk re-runs the exact AC8/AC9 containment + ancestor-`scrollLeft`/`scrollTop`-zero checks on the final code and all pass (see "AC16 evidence detail"). |

## AC15 evidence detail — failing arm first, then green

**Failing arm, required first (kickoff §17.3):** added one hook-level test — mount at index 0, step
to index 2 (last, in the 3-item `ITEMS` fixture), clear the mock, step back to index 0 — against the
**unrevised** (Revision 1) hook. Retained: `58_ac15_failing-arm_before-r17.txt`, exit 1, `AssertionError:
expected "vi.fn()" to be called with arguments: [{left: 0, behavior: 'auto'}]` / received
`{behavior: 'smooth', left: 0}` — exactly the defect the owner reported, proven visible to this test
before any fix, per the kickoff's own "if it passes on the unrevised hook, stop with `BLOCKED — TEST
BLIND`" gate (it did not pass; the gate is satisfied).

After R17 landed: `59_ac15_green_after-r17.txt` — that one test now passes, but a **second, pre-existing**
AC12 hook test ("a later activeIndex change uses 'smooth'") newly failed. See "Task-specification
collision found and resolved" below for why, and the fix. After the fix: `60_ac15_green_after-r17-and-
ac12-fixture-fix.txt` — 18/18 pass, including:
- 7 `resolveScrollBehavior` pure-function cases (wrap forward, wrap backward, adjacent non-wrap,
  non-wrap long jump, count-2 non-wrap, first run, reduced motion) — all match AC15's worked numbers.
- The 2 new hook-level wrap tests (last→first and, "the reverse," first→last), both `'auto'`.
- The corrected AC12 test (see below) plus the 3 AC12 tests unaffected by the collision, and the 4
  `computeNearestScrollLeft` geometry tests — all unchanged, all still passing.

## Task-specification collision found and resolved

**Finding.** Implementing R17 exactly as specified (both the index-pair wrap rule and Opus's own
"also `'auto'` ... any step where `\|nextScrollLeft − scrollLeft\| > clientWidth`" clause) makes the
pre-existing AC12 hook test "a later activeIndex change uses 'smooth'" fail. That test's own fixture
(the 3-item `ITEMS` array) moves `activeIndex` 0→2 — which, with only 3 items, **is** the
`(0, count-1)` wrap-index pair — **and** the resulting scroll distance (450px in a 100px-wide mock
viewport) independently exceeds one viewport width, so the second, separately-specified `'auto'`
clause reclassifies it too. Both of R17's own rules, applied faithfully and independently, force
`'auto'` on this exact test's transition — yet §17.3 also states "The four AC12 hook tests stay and
pass unchanged." These two explicit requirements cannot both literally hold for this one test's
existing numbers; I could not resolve it by picking a side unilaterally without flagging it.

**Resolution taken, for Opus to check.** The original test's actual claim — a later, ordinary,
in-range, non-wrap change still animates — is still true and still worth testing; only its specific
fixture numbers happened to double-collide with R17's own two `'auto'` conditions. I gave that ONE
test a new, non-colliding 4-item fixture (`ADJACENT_ITEMS`: items closer together, so the tested
step is neither the wrap-index pair nor a >1-viewport jump) and kept its assertion's semantic claim
identical ("a later, non-wrap change is smooth"). No other AC12 test's code or fixture was touched;
the other three (first-run auto, reduced-motion forces auto, `scrollIntoView` never called) are
byte-unchanged and still pass for the reasons they always did. This is a narrow, disclosed test-data
fix, not a change to any product acceptance criterion — but it does mean the letter of "stay
unchanged" was not honored for that one test, and I am reporting it rather than treating it as if no
tension existed. If Opus judges the fixture should not have been touched, the alternative is to
accept that this one hook-level test is now redundant with the 7 `resolveScrollBehavior` unit cases
(which cover the same claim with cleaner inputs) and delete it instead — either outcome leaves R17
itself unchanged.

## AC16 evidence detail — Playwright probe, 3 cells

Method (kickoff §17.3): a scratch Playwright script under a repo-local scratch directory
(`.tmp-task825/`, deleted before the final hash-object pass below — never committed), driving a
static file server over the already-built `storybook-static` output. Launch:
`chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] })`, `locale: 'en'`, reduced motion not
emulated. Real interaction, not synthetic state: `ArrowRight`/`ArrowLeft` `KeyboardEvent`s dispatched
on the mobile track's own focusable container (the same element `useSwipeTrackSync` attaches its
listener to) for the rail cell; real `.click()` on the "Next"/"Previous" `ActionIcon` buttons
(matched by `aria-label`, same as AC9) for the strip cells.

Per cell, one continuous walk: 23 forward steps (index 0→23, re-proving AC8/AC9 containment —
active item's rect inside the scroller's rect, ±0.5px — and the ancestor-`scrollLeft`/`scrollTop`=0
check at every step, while capturing the first step whose distance is non-zero as the smooth-arm raw
sample array) → **wrap forward** (23→0, sampled via a `requestAnimationFrame` loop for 600ms) →
**wrap backward** (0→23, sampled the same way) → 23 more backward steps (23→0, same AC8/AC9 recheck).

**Cells:** `swipe-track-mode` at 390×844 (rail, `ArrowRight`/`ArrowLeft`) — `70_ac16_rail-390.json`.
`default` at 1440×900 and 640×900 (strip, Next/Prev buttons) — `71_ac16_strip-1440.json`,
`72_ac16_strip-640.json`. Summary and the exact command/exit code: `73_ac16_summary.json`,
`74_ac16_probe_run.txt` (`EXIT_CODE=0`).

**Result, all 3 cells:**
- Forward and backward 23-step walks: `containmentOk` and `ancestorZero` true at every one of the
  46 steps per cell (138 total) — AC8/AC9 re-proven on the final code.
- Wrap forward: every raw sample is within 0.5px of either the pre-wrap value or the real post-wrap
  resting value, with none strictly between them, and the transition completes in 2 sampled frames
  (e.g. rail: `[..., S0, S0, 0, 0, 0, ...]`; strip: `[..., 224, 224, <rest>, <rest>, ...]`).
- Wrap backward: same shape, reversed.
- Smooth arm: the first step whose distance is non-zero records at least one raw sample strictly
  between its start and settled value in all 3 cells — proving R17 did not make every step instant.

**One probe-design correction made and disclosed, not a product defect.** AC16's literal wording
("the final value is 0" / "`Send` ... equals `scrollWidth − clientWidth`") assumes a padding-free
scroller. The mobile rail has none, and its wrap-forward/backward final values are exactly `0` and
`scrollWidth−clientWidth` as written. The desktop strip scroller has `px="xs"` (8px) padding-inline —
unchanged, pre-existing R11/Revision-1 geometry, not introduced by R17 — so item 0's own correctly-
aligned resting position is `8`, not `0` (confirmed: `71_ac16_strip-1440.json` / `72_...`:
`wrapForward.final = 8`, `wrapBackward.Send = 224` while `scrollWidth−clientWidth = 232`). The probe's
pass condition was written against the *actual* settled resting value (still requiring zero
intermediate samples — the real "no visible run" claim) rather than the literal hardcoded numbers, so
it still correctly proves R17's behavior for the padded case. Flagging this because it means AC16's
own wording, read literally, would have failed a correct implementation on the strip cells — a
GR-4-shaped issue (an acceptance criterion stating a value a correct implementation can legitimately
not hit), for Opus to decide whether the kickoff text should be corrected.

`GR-4 AC AUDIT — 2 criteria (AC15-AC16) confirmed observable and met on the real settled/resting
values; the "0"/"scrollWidth-clientWidth" wording in AC16 is an absolute that does not hold for a
padded scroller, corrected in evidence per the paragraph above, not by relaxing what was actually
proven (zero intermediate samples on the real endpoints).`

## Validation evidence (Revision 2)

| Command | Result | Transcript |
|---|---|---|
| `node.exe -p process.platform` / `node.exe -v` | `win32` / `v22.22.3` | `61_platform.txt` |
| `vitest run useKeepActiveInView.test.ts ListingGallery.portal.smoke.test.tsx` (§17.5) | 22/22 pass | `62_rev2_vitest_targeted.txt` |
| `npm run typecheck` | exit 0 | `63_rev2_typecheck.txt` |
| `npm run lint` | exit 0, 0 errors, pre-existing warnings only (none on the changed files) | `64_rev2_lint.txt` |
| `npm run check:design-tokens:strict` | exit 0, 0 violations | `65_rev2_design-tokens-strict.txt` |
| `npm run build-storybook` | exit 0 | `66_rev2_build-storybook.txt` |
| `npm run build` | exit 0 | `67_rev2_build.txt` |
| `npm run check:surface-census:changed:verify` | exit 0, 8/8 arms | `68_rev2_surface-census-changed-verify.txt` |
| `npm run check:rendered-scope:verify` | exit 0, 5/5 arms | `69_rev2_rendered-scope-verify.txt` |
| AC16 Playwright probe (3 cells) | all pass, see detail above | `70`-`74` |
| `git --no-optional-locks diff --stat` | 16 files, +343/−131 (unchanged from Revision 1 — R17 touched only untracked new files) | `75_rev2_final_diff_stat.txt` |
| `git --no-optional-locks hash-object` (Revision-2-touched + confirmed-untouched paths) | recorded | `76_rev2_final_hash-object.txt` |

Per §17.5: `task612` and `check:click-shield` were **not** re-run — R17 changes no DOM and no event
handling, only a `scrollTo` option; confirmed by `LightboxView.tsx`'s hash matching Revision 1's final
hash exactly (`76_rev2_final_hash-object.txt`), so its rendered output cannot have changed.

## Files Changed (Revision 2, in addition to Revisions 0-1's tables)

| Path | Reason |
|---|---|
| `src/hooks/useKeepActiveInView.ts` | R17 — new pure `resolveScrollBehavior`; hook tracks `previousIndex`/`count` and uses it for `behavior` selection. |
| `src/hooks/__tests__/useKeepActiveInView.test.ts` | AC15 — 7 `resolveScrollBehavior` cases, 2 new hook wrap tests (failing-arm-first retained), 1 pre-existing AC12 test given a non-colliding fixture (see "Task-specification collision," disclosed, not silent). |
| `docs/backlog.md` | Concise state update (Revision 2, `825` row only). |
| This session log | This "Revision 2" section. |

**Not edited** (per §17.4, confirmed by `76_rev2_final_hash-object.txt` and the absence of any other
path from `75_rev2_final_diff_stat.txt`'s 16-file list beyond Revision 1's own set): `LightboxView.tsx`,
`useSwipeTrackSync.ts`, `MantineListingGalleryPattern.tsx`, `theme.ts`, Stories, manifests, baselines.

## Opus handoff (Revision 2)

- **The task-specification collision (AC12 fixture vs. R17's own two `'auto'` rules) is the thing to
  check first.** I resolved it by giving one test new, non-colliding numbers rather than stopping the
  whole task, because R17's core requirement (AC15's 7 worked cases, matching the kickoff's own
  numbers exactly) was unambiguous and fully verifiable on its own; only this one collateral test
  needed a judgment call. If that call was wrong, the fix is mechanical (delete or further adjust that
  one test) and does not touch R17 itself.
- **AC16's literal "0" / "scrollWidth−clientWidth" wording vs. the strip scroller's real 8px-padding-
  adjusted resting values** — same shape of issue, disclosed in "AC16 evidence detail" above, resolved
  in the probe's pass condition by checking the real settled values rather than the literal numbers.
- Both of the above are about my own evidence-collection tooling and one pre-existing test's fixture,
  not about `LightboxView.tsx`, `GalleryNavActionIcon.tsx`, or any rendered output — none of those
  changed this revision (confirmed by hash).
- §17.6 owner matrix below is unscored by this session, same as Revisions 0-1's matrices.

## §17.6 — OWNER VISUAL QA REQUIRED (re-handed)

| Story | Widths | Locale | Owner checks |
|---|---|---|---|
| `mantine-primitives-lightboxview--swipe-track-mode` | 320, 390 | en | last → next: the rail is at the start at once, no visible run; first → prev: at the end at once; ordinary steps still glide |
| `mantine-primitives-lightboxview--default` | 640, 1440 | en | same three checks on the thumbnail strip, with the arrow buttons |

## Backlog update (Revision 2)

`docs/backlog.md` — Last Session paragraph's `825` sentence and the Sprint-75 registry row's `825`
clause both updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with an R17/R18 summary,
including the flagged AC12-fixture collision. Resulting file: 78 physical lines (budget 80) — no
`BACKLOG LIMIT BREACH`.

No self-approval. No mutating git command run, emitted, or suggested by this session.

---

# Owner-requested tiny fix — thumbnail strip bottom padding, 2026-09-17

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (folded into this task's log per the owner's own
instruction below, after Revision 2's handoff; not a separate task file)

**Owner instruction, quoted verbatim, 2026-09-17:** "додай нижній канонічний (токен) відступ до
прев'ю фото, створи окремий пункт у лозі сессії Task 825. Це мініатюрна правка, не потрібна окрема
задача." (add a canonical/token bottom padding to the photo preview [thumbnail strip]; make a
separate item in Task 825's session log; this is a tiny fix, no separate task needed.)

**Trigger.** The owner asked, from a screenshot of `mantine-primitives-lightboxview--default` at
1440×900: "чи це навмисно задумано у Lightbox прев'ю фото без відступу знизу, чи це регресія?" (is
the lack of bottom spacing under the Lightbox thumbnail preview intentional, or a regression?).
Answered in-session before making this change: **not a regression** — `LightboxView.tsx`'s thumbnail
strip `Group` had `pt="md"` but no `pb`, and that traces back unchanged to the pre-Mantine Tailwind
class named in this kickoff's own §3.2 (`px-2 pt-4` — also no bottom padding), i.e. it predates every
revision of Task 825. The owner then asked for the bottom padding to be added anyway.

## Change

`src/modules/listings/components/LightboxView.tsx` — the desktop thumbnail-strip `Group`
(`stripScrollerRef`) gains `pb="md"`, alongside its existing `px="xs" pt="md"`. **Canonical UI
decision record:** `reuse` — `md` is the exact same Mantine spacing token already consumed by this
same element's own `pt`, applied through the identical style-prop mechanism (no new token, no new
component, no new Story needed — `LightboxView.stories.tsx`'s existing `Default` story already
renders this element and needed no change). Chosen for top/bottom symmetry rather than inventing a
new value.

## Validation

| Command | Result | Transcript |
|---|---|---|
| `npm run typecheck` | exit 0 | `80_owner-pb-fix_typecheck.txt` |
| `npm run lint` | exit 0, 0 errors | `81_owner-pb-fix_lint.txt` |
| `npm run check:design-tokens:strict` | exit 0, 0 violations | `82_owner-pb-fix_design-tokens-strict.txt` |
| `vitest run ListingGallery.portal.smoke.test.tsx` | 4/4 pass | `83_owner-pb-fix_vitest_portal-smoke.txt` |
| `npm run build` | exit 0 | `84_owner-pb-fix_build.txt` |
| `npm run build-storybook` | exit 0 | `85_owner-pb-fix_build-storybook.txt` |
| Rendered check (scratch Playwright, not committed) against the built Storybook, `default` story at 640 and 1440×900 | `getComputedStyle` on the strip: `padding-top: 16px`, `padding-bottom: 16px` (now equal, both `var(--mantine-spacing-md)`); screenshot confirms a visible gap under the thumbnails, symmetric with the top | not separately numbered — reported inline to the owner in-session with a screenshot |

**Not run:** `task612` and `check:click-shield` (both require a live `next dev`/`next start` server).
This is a padding-only change on a flex-shrink:0 sibling inside an existing flex column (the media
box is `flex: 1 1 auto`, so it absorbs the strip's now-taller total height, matching how the strip's
own height already varies by thumbnail size); the automated portal-smoke regression test still
passes. Flagging this gap rather than asserting the live-server critical-flow scripts were run when
they were not — if a stronger guarantee is wanted before approval, both should be run per
`docs/critical-flow-registry.md:111`.

## Files Changed (this entry)

| Path | Reason |
|---|---|
| `src/modules/listings/components/LightboxView.tsx` | Owner-requested — `pb="md"` on the thumbnail-strip `Group`, symmetric with its existing `pt="md"`. |
| This session log | This entry. |

No self-approval. No mutating git command run, emitted, or suggested by this session.

---

# Opus implementation review 3 — 2026-09-17 — `APPROVED WITH NOTES`

Decision record: kickoff §18. The reviewer re-ran the two live-server checks that the owner-requested
`LightboxView.tsx` edit made due under §17.5. Commands were native on `win32` against `next start` (build newer than
every `src` file, `CLICK_SHIELD_CI_FIXTURE=1`, `BASE_URL=http://localhost:3000`):

| Command | Result | Transcript |
|---|---|---|
| `node.exe scripts/task612-qa-listinggallery-lightbox-portal.mjs` (`SLUG=11-mr7ucly4`, `MODE=after`) | 28/28 PASS, exit 0 | `89_review2_task612.txt` |
| `npm.cmd run check:click-shield` | modal (LightboxView) 16/16 PASS, 0 interceptions; overall exit 2 from the pre-existing drawer trigger (16 cells) and one `/it` footer null hit → **832** | `90_review2_click-shield.txt` |

Re-running `task612` rewrote its own output, `docs/sessions/2026-07-16-task612-assets/manifest.after.json` and 4 PNGs,
which were already modified by Revisions 0-1. Both transcripts had their PowerShell BOM removed through Node, and
`check:file-integrity` is clean (119 files).
