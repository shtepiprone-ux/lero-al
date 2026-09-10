# Session Archive: Task 810 — the rail becomes usable — 2026-09-10

Task path: `tasks/Sprints/Sprint_74_kickoff_prompt_Task_810_The_Rail_Becomes_Usable.md`
Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## 1. Requirement and acceptance-criteria evidence

| Req | AC | Evidence | Result |
|---|---|---|---|
| R1 scrollbar | AC1 | `docs/sessions/evidence/task810/runs/baseline-1/rail-controls-probe.json` — `scrollbarWidthComputed: "thin"` at every width; `webkitScrollbarHeightRest: "4px"` → `webkitScrollbarHeightHover: "8px"` on the overflowing rail (measured via `getComputedStyle(el, '::-webkit-scrollbar')` before/after a real Playwright `.hover()`). | ✅ |
| R2 controls presence | AC2 | Same run: non-overflowing single-card rail (`rail0`) shows `controlCount: 0` at every width; the overflowing rail shows `controlCount: 1` at `scrollLeft:0` (next only), and the `clickTest.controlsAfter` array shows both labels present mid-scroll, then only "Попередні оголошення" (prev) once the end is reached at 1024/1440. | ✅ |
| R3 paging | AC3 | Same run's `clickTest`: `before:0` → `after` = a whole "page" (e.g. 872px width: `after:515`, `delta:515`); `controlsAfter` updates without reload. | ✅ |
| R4 equal heights | AC4 | Measured live (see §6): 381.5px vs 397.5px before the fix (a real listing lacking the optional price-per-sqm row), 417.5/419.5px equal after, in **both** rail (homepage) and grid (`/listings`) mode. | ✅ |
| R5 two-line clamp | AC5 | `MantineListingCardPattern.tsx:224`/`:360` already render `lineClamp={2}` — unchanged. The `RailMixedTitleLengths`/`GridMixedTitleLengths` stories render a long fixture title beside a short one for the owner's visual proof. Not independently re-measured pixel-for-pixel beyond the equal-height proof above (§6), which already includes a long-title card. | ✅ (no fix needed) |
| R6 D74-5 boundary | AC6 | `baseline-1`, `rail0` (a genuine single-card section on the live homepage): `firstChildWidth` = 288/358/448 at 320/390/480 (= 100% of each measured container) and 280 at 481/640/768/872/1024/1440 (= `min(280, 82%×container)`). | ✅ |
| R7 D74-6 peek | AC7 | `baseline-1`, `rail1` (7-card overflowing rail): `peekPx` = 87.7/112.9/48.7/48.8/74.6/38.4/**50.9**/22.4/16.8 at 320/390/480/481/640/768/**872**/1024/1440 — positive at every one; `firstChildWidth` never exceeds 280 for the multi-card rail. Non-overflowing case (`rail0`) asserted separately: `peekPx: null`, `controlCount: 0`. | ✅ |
| R8 tokens/no-hardcode | AC8 | `check:design-tokens --strict --scope=mantine` → 0 violations (transcript below); `check:story-coverage` → 33/33; `git diff package.json` empty (no new dependency); i18n keys present in all 4 locales at the same line (§ i18n below); §10.5 provenance table below; `grep` for bare px/rem/hex/rgba in the two changed files below. | ✅ |
| R9 grid/rail freeze | AC9 | `git diff` on `MantineListingCardTrack.module.css` (below) shows `.grid` untouched byte-for-byte and the base `.rail > * { flex: 0 0 min(var(--listing-card-min), 82%); ... }` rule untouched — it now governs the `:only-child` case above 480px (D74-5's own AC6 boundary measurements above confirm `min(280,82%)` still applies there). `imageDelivery.ts` absent from `git status --porcelain`. | ✅ |

## 2. Current versus required behavior

**Before:** the rail scrolled only by touch/shift-wheel, no scrollbar, no control, no signal more cards existed. A `min(var(--listing-card-min), 82%)` fixed-cap card could exactly tile a container (measured live: at a 872px-viewport homepage, three 280px cards + gaps left a peek; the kickoff's own hypothetical 872px-container illustration is the same class of defect — see §7 note). Cards in a section could differ in height (a real content difference — an optional price-per-sqm row — silently broke stretch, see §6). A lone card sat at a fixed 82%/280px width with dead space beside it below 480px.

**After:** every rail exposes a thin scrollbar that thickens on hover of the track; prev/next `ActionIcon` controls appear exactly when that direction can scroll and vanish otherwise; a multi-card rail's card width is a breakpoint-ladder fraction of the container (never a fixed px), guaranteeing a peek at every measured width; a section's cards are all the tallest card's height in both modes; a lone card fills the track ≤480px and reverts to the standard clamp above it.

**Negative flows (kickoff §11):**

| Flow | Result |
|---|---|
| Content does not overflow | `controlCount: 0`, no thumb (native — nothing to scroll) |
| Exactly one card, ≤480px | fills 100% (measured) |
| Exactly one card, >480px | falls back to `min(280,82%)` (measured) |
| Zero children | `{childCount > 0 && <RailControls .../>}` guard — the track renders nothing extra and does not observe a non-existent scroller |
| Long vs short title, one section | `RailMixedTitleLengths`/`GridMixedTitleLengths` stories |
| Resize across the overflow boundary | `ResizeObserver` on the scroller re-runs the same `update()` that drives initial state |
| `prefers-reduced-motion: reduce` | `scrollByPage` reads `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and uses `behavior:'auto'` |
| Keyboard-only user | `ActionIcon` renders a real `<button>` (focusable, labelled); the scroller itself is unchanged (no `tabIndex` removed) |

## 3. Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantineListingCardTrack.tsx` | `'use client'`; prev/next `ActionIcon` controls + scroll-state hook (R1-R3); `Children.count` guard |
| `src/design-system/mantine/patterns/MantineListingCardTrack.module.css` | scrollbar chrome (R1), control positioning (R1-R3), R4's `height: auto` override on the anchor, D74-5 media query, D74-6 count ladder |
| `src/stories/patterns/mantine/ListingCardTrack.stories.tsx` | `RailNoOverflow`, `RailMixedTitleLengths`, `GridMixedTitleLengths` — the 3 new states R8 requires beyond the kept 5 |
| `messages/en.json`, `sq.json`, `uk.json`, `it.json` | 2 new `common` keys: `aria_scroll_prev`/`aria_scroll_next` (the only new i18n strings, per R8) |
| `scripts/task810-rail-controls-probe.mjs` | new — extends Task 807's probe conventions for R1-R7's rendered measurement |
| `docs/component-catalog.md` | updated the `MantineListingCardTrack` row for the new interactive behaviour |
| `docs/backlog.md` | Last Session summary, sprint/task-registry state |
| `docs/sessions/2026-09-10-task810-the-rail-becomes-usable.md` | this file |

**Not touched** (§8 out of scope, confirmed by `git status --porcelain`): `ListingCard.tsx`/`.module.css` (the actual `height:100%` culprit — fixed from the track instead, §6), the five consumer views, `src/lib/imageDelivery.ts`, `globals.css`, `theme.ts`, `package.json`.

## 4. Validation evidence

Platform, gates, and the two vitest suites were captured natively in Windows PowerShell per the kickoff's transcript rule; each file ends with its own `EXIT_CODE=` line.

| Command | Transcript | Exit |
|---|---|---|
| `node.exe -p process.platform` | `transcripts/platform.txt` | 0 (`win32`) |
| `npm.cmd run typecheck` | `transcripts/typecheck.txt` | 0 |
| `npm.cmd run lint` | `transcripts/lint.txt` | 0 (72 pre-existing warnings, 0 errors, none in a touched file) |
| `npm.cmd run check:stories` | `transcripts/check-stories.txt` | 0 (140 files, 0 violations) |
| `npm.cmd run check:story-coverage` | `transcripts/check-story-coverage.txt` | 0 (33 covered / 0 unproven) |
| `node.exe scripts\check-design-tokens.mjs --strict --scope=mantine` | `transcripts/check-design-tokens.txt` | 0 |
| `npx.cmd vitest run src/design-system src/modules/listings` | `transcripts/vitest-targeted.txt` | 1 — 3 pre-existing failures, all named in §5 |
| `npm.cmd run test` | `transcripts/npm-test-full.txt` | 1 — 5 pre-existing failures / 4 files, exact match to Task 790's documented baseline |
| `npm.cmd run build-storybook` | `transcripts/build-storybook.txt` | 0 |
| `npm.cmd run build` | `transcripts/build.txt` | 0 — `ƒ /[locale]/listings/[slug]` confirmed present (line 38) |
| `npm.cmd run check:file-integrity` | `transcripts/check-file-integrity.txt` | 0 |
| `npm.cmd run check:mojibake` | `transcripts/check-mojibake.txt` | 0 |

**Pass 2 (final, after every artifact including this session log and `docs/backlog.md` exist)**: `check:file-integrity` → `transcripts/check-file-integrity-final.txt`, exit 0, 26 files checked (`git status --porcelain` reports 12 top-level paths; one, `docs/sessions/evidence/task810/`, is a directory expanding to the run JSONs + transcripts — reconciles). `check:mojibake` → `transcripts/check-mojibake-final.txt`, exit 0.

## 5. Pre-existing test failures (baseline, not caused by this diff)

Reproduced identically before and after this diff; none touch a file this task changed:

1. `scripts/__tests__/css-var-resolvability.test.ts` — count assertion (296/297 vs 257 — pre-existing, Task 806's session log already notes this drift).
2. `docs/sessions/evidence/task763/appimage-config-class-assertions.test.ts` — self-declared `BLOCKED`.
3. `src/design-system/mantine/__tests__/theme.d69-18.test.tsx` — `FooterView.tsx` non-null-assertion substring mismatch (Task 790's own named root cause).
4/5. `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` ×2 — `.grayscale.opacity-60` class-selector assertion (archived-card styling moved to a different mechanism pre-810; Task 790's backlog row names this exact pair).

Exact match to `docs/backlog.md`'s Task 790 baseline ("5 failures / 4 files").

## 6. R4 — equal card heights: measurement and root cause

Measured live against `npm run dev` on the homepage's "Latest" rail (real seeded listings, 1024px viewport), **before** any change:

| Card | Height | Cause of the difference |
|---|---|---|
| `11-mr7ucly4` (no price-per-sqm data) | 381.515625px | `.priceMetaRow` absent |
| `apartament-ne-lungomare-mtuf41kg` (has price-per-sqm) | 397.515625px | `.priceMetaRow` present (12px row) |

This is real, legitimate content variance — not a title-length case — and it is exactly what `align-items: stretch` (the default on both `.rail` and `.grid`, neither sets `align-items` itself) exists to absorb. It wasn't absorbing it: `ListingCard.module.css`'s `.cardVertical { height: 100% }` is applied to the anchor that is the actual flex/grid item, and per the CSS Flexbox/Grid spec, an item's own block-size must **compute** to `auto` for stretch to apply — a `100%` value opts the item out even though it later **resolves** to `auto` against the track's own indefinite height. `ListingCard.module.css` is out of this task's scope (kickoff §8), so the fix lives in the track instead — the canonical decision record's own explicit allowance ("the rule goes in the pattern or the track — never in a consumer"):

```css
.rail > a,
.grid > a {
  height: auto;
}
```

`a` gives this rule higher specificity than `.cardVertical` alone, so it wins regardless of stylesheet import order. **After**: all four sampled cards in that rail measured **417.515625px**; `/listings` grid mode measured **419.515625px** across 6 sampled cards. `MantineListingCardPattern.module.css`'s own `.cardGrid { height: 100% }` was left untouched — once the anchor has a definite (stretched) height, that inner rule correctly fills it (it was never the problem; the anchor one level up was).

## 7. R7 / D74-6 — the count-ladder, its derivation, and the flagged constant

Measured live (production build, homepage rails, `docs/sessions/evidence/task810/runs/baseline-1/`), the real container widths at the required widths: 288/358/448/449/592/720/**824**/960/1344 px at 320/390/480/481/640/768/**872**/1024/1440. (The kickoff's own illustrative "an 872px container" is a hypothetical value, not this site's actual container at an 872px **viewport** — the mechanism below fixes the defect class at every measured width regardless of the exact coincidence, which is a stronger proof than hitting one specific number.)

Mechanism (kickoff §3.4a, the owner's cited reference measured live): `fraction = 100%/n − offset/n²`, where `n` = the rung's "fully visible" card count — this makes the reserved peek always `offset/n` percent of the track, never the leftover after a whole number of fixed-px cards.

**`offset = 36` is an engineered constant, not a grepped repo token, and not the reference's own measured `30`.** `30` (Rozetka's own value) leaves only a **0.64px** peek at this site's real 1344px container (1440px viewport) once the flex `gap` between cards is subtracted from the nominal reserve — too thin to trust against sub-pixel rounding on the one graded width where it matters most. `36` was raised until every rung cleared roughly a gap's width of real, measured peek:

| Rung (breakpoint) | n | fraction | Container | Card width | Peek | Cap (≤280px) |
|---|---|---|---|---|---|---|
| default (<480) | 1 | 64% | 288 (320) | 184.3 | 87.7 | ✅ |
| | | | 358 (390) | 229.1 | 112.9 | ✅ |
| ≥480 (xs2) | 2 | 41% | 448 (480) | 183.7 | 48.7 | ✅ |
| | | | 449 (481) | 184.1 | 48.8 | ✅ |
| | | | 592 (640) | 242.7 | 74.6 | ✅ |
| ≥768 (md) | 3 | 29.3333% | 720 (768) | 211.2 | 38.4 | ✅ |
| | | | **824 (872, mandatory)** | 241.7 | **50.9** | ✅ |
| ≥1024 (lg) | 4 | 22.75% | 960 (1024) | 218.4 | 22.4 | ✅ |
| ≥1280 (xl) | 5 | 18.56% | 1344 (1440) | 249.4 | 16.8 | ✅ |

**`CANONICAL STYLE DECISION REQUIRED` — flagged for the owner, per kickoff §5's own instruction ("bring the owner the measured options rather than picking one"):** `36` is this task's own engineered choice. The measured alternative was `30` (the reference's own value), rejected because it leaves the 1440px cell at 0.64px — within noise of a real render. No existing token encodes either number; both are visual constants specific to this formula. Options for the owner: keep `36` (current implementation, every rung ≥16.8px peek), adopt `30` (matches the reference exactly, but the 1440px cell is unverified-safe), or a different value entirely.

**A known, bounded, untested gap:** the same per-rung math shows `n=2` stops being cap-safe (>280px) somewhere before viewport 768 (around container ~659px, i.e. viewport ~707 given this range's 48px gutter), and `n=3` similarly stops being safe somewhere before 1024 (~933px container, viewport ~981). Neither gap falls on any of the kickoff's 9 required test widths (640→768 and 872→1024 are the adjacent pairs), so it is undetected by AC7 as specified, but it is a real, narrow window (viewport ~707-767 and ~981-1023) where the cap could bind and the fixed-width degenerate-peek risk could theoretically reappear. Flagged rather than silently left implicit — no additional theme.ts breakpoint exists to close it without inventing one, which is out of this task's scope (kickoff §8: "`--listing-card-min`'s value" and implicitly the breakpoint scale itself, `theme.ts` is listed out of scope).

## 8. Canonical UI decision record

| Visible artifact | Searched / inspected | Canonical source | Disposition | Registration |
|---|---|---|---|---|
| Prev/next control | `grep -rn "ActionIcon" src/design-system/mantine`, `src/modules/listings/components/LightboxView.tsx` (nearest ActionIcon+Chevron consumer), `theme.ts` `components:` block (no `ActionIcon` override — confirmed absent) | Mantine `ActionIcon` (component default styling, `variant="default"`) + `lucide-react` `ChevronLeft`/`ChevronRight` (same icons `LightboxView.tsx` and `theme.ts` name) | **reuse** | No new component. Size = `theme.other.touchTarget` (2.75rem, the existing mobile-touch-target token, `theme.ts:424`); icon size = `theme.other.iconSize.standard` (16, the same rung `ListingsSortBar.tsx:175` already consumes for a toolbar `ActionIcon`) |
| Rail scrollbar | `MantineListingCardTrack.module.css` (Task 806) | The track's own CSS module | **extend** | Thin/hover rules added there only; no consumer styles a scrollbar |
| One-card ≤480 rule | `theme.ts:322` `xs2: '30em'` | The theme breakpoint scale | **reuse** | `@media (max-width: 30em)` — same numeric value, no new breakpoint |
| Count-ladder rungs (D74-6) | `theme.ts:322-327` (xs2/sm/md/lg/xl) | The theme breakpoint scale | **reuse** | 4 of the ladder's `@media (min-width: …em)` values match `theme.ts` exactly (30/48/64/80em); `sm` (40em) is not used as its own rung — `n=2` already covers it (§7) |
| Equal card height | `MantineListingCardTrack.module.css` (this task, §6) | The track — per this task's own decision table ("the pattern or the track") | **extend** | `.rail > a, .grid > a { height: auto }`, not the pattern (root cause lives one DOM level above the pattern) |
| Scrollbar/control token provenance | see §9 below | — | — | — |

**No `create canonical` disposition needed** — every visible value traced to an existing Mantine primitive, an existing `theme.ts` value, or an existing `globals.css` token.

## 9. Token provenance table (§10.5, blocking)

| New visual value | Chosen token / theme key | Grepped definition |
|---|---|---|
| Scrollbar thickness at rest | `calc(var(--mantine-spacing-xs) / 2)` (4px) | `theme.ts:349` `xs: '0.5rem', // 8px` — Mantine auto-generates `--mantine-spacing-xs` from this scale (existing precedent in the same file: `.grid { gap: var(--mantine-spacing-md) }`, Task 806) |
| Scrollbar thickness on hover | `var(--mantine-spacing-xs)` (8px) | same as above |
| Scrollbar thumb colour | `var(--border)` | `globals.css:470` `--border: var(--neutral-200); /* #EBEBEB */` — same token the project's own global scrollbar rule already consumes (`globals.css:646` `::-webkit-scrollbar-thumb { @apply bg-border rounded-full; }`) |
| Scrollbar track colour | `var(--muted)` | `globals.css:438` `--muted: var(--neutral-100); /* #F5F5F5 */` — same token the global rule's `::-webkit-scrollbar-track { @apply bg-muted; }` already consumes |
| Control size | `theme.other.touchTarget` | `theme.ts:424` `touchTarget: '2.75rem', // 44px minimum` |
| Control icon size | `theme.other.iconSize.standard` | `theme.ts:433` `standard: 16, // globals.css --icon-md role` |
| Control inset from the track edge | `var(--mantine-spacing-xs)` | `theme.ts:349` (as above) |
| Control background / border / icon colour | Mantine `ActionIcon` `variant="default"` (no repo override) | `theme.ts` `components:` block — grepped for `ActionIcon:`, confirmed absent; Mantine's own default variant CSS applies unmodified |
| Control elevation (shadow) | `var(--shadow-sm)` | `globals.css:229` `--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);` |
| Control stacking (`z-index`) | `var(--z-dropdown)` (10) | `globals.css:257` `--z-dropdown: 10;` — needed because `MantineListingCardPattern.module.css`'s `.imageActions` sets `z-index: 1` on a card-internal overlay slot and `.rail` establishes no stacking context of its own, so that value competes directly with this sibling (reproduced live: without it, a real Playwright click hit-tested a card title instead of the control) |
| Smooth-scroll duration | none authored — native `scrollBy({behavior:'smooth'})`, no JS duration value | N/A |
| D74-6 rungs (`64%`/`41%`/`29.3333%`/`22.75%`/`18.56%`) and `offset=36` | engineered, not a repo token | **flagged — see §7's `CANONICAL STYLE DECISION REQUIRED`** |

**AC8 grep** — `grep -nE '[0-9]+(px|rem|em)|#[0-9a-fA-F]{3,8}|rgba?\(' ` over the two changed files, run for real (not asserted):

- `MantineListingCardTrack.tsx`: **1** match — a `/**` doc comment prose sentence ("...up to 480px (D74-5)..."), not code.
- `MantineListingCardTrack.module.css`: **15** matches. Two categories:
  1. **In real declarations** (4): `calc(var(--mantine-spacing-xs) / 2)` and `var(--mantine-spacing-xs)` (the scrollbar-thickness rules) and the two `flex-basis: min(var(--listing-card-min), N%)` lines flagged only because their trailing `/* n=1, <480px */`-style comment on the SAME physical line contains a px number — the declaration values themselves are unitless percentages or `var()`/`calc()` forms, none a bare px/rem/em literal.
  2. **In `/* … */` prose comments only** (11): measured pixel values cited for provenance (e.g. "4px at rest", "an 872px container", "30em, theme.ts:322 — 480px"). No declaration on these lines has a bare px/rem/em/hex/rgba value — the grep pattern has no comment-exclusion, so it also matches prose that merely *quotes* a measured pixel number.

The actual blocking gate, `check:design-tokens --strict --scope=mantine`, strips CSS comments before scanning (its own documented behavior) and reports **0 violations** (transcript above) — it is the authority AC8 names for the pass/fail line ("`check:design-tokens --strict --scope=mantine` 0 violations..."), and the raw grep is supplementary evidence, not a second independently-blocking check. Percentages like `64%`/`82%` are not px/rem/em/hex/rgba and were already the established convention in this exact file before this task (Task 806/807's own `min(var(--listing-card-min), 82%)`).

`check:design-tokens --strict --scope=mantine` → **0 violations, 0 stale markers, 0 missing-reason errors** (transcript above). No `design-tokens-allow` marker was added. `git diff package.json` is empty.

## 10. Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Token path | Change/preserve | Evidence |
|---|---|---|---|---|---|
| Rail scrollbar | `.rail` (`MantineListingCardTrack.module.css`) | `.rail::-webkit-scrollbar*`, `scrollbar-width`/`scrollbar-color` | `--border`/`--muted`/`--mantine-spacing-xs` | change | §9, `baseline-1` probe |
| Prev/next controls | `RailControls` (new, `MantineListingCardTrack.tsx`) | `.control`/`.controlPrev`/`.controlNext` | `theme.other.touchTarget`/`iconSize.standard`, `--shadow-sm`, `--z-dropdown` | change | §9, `baseline-1` probe |
| Card height (rail + grid) | anchor (`ListingCard.tsx`, unmodified) inside `.rail`/`.grid` | `.rail > a, .grid > a` (new, `MantineListingCardTrack.module.css`) | none (structural) | change (root cause is `ListingCard.module.css`'s `.cardVertical`, preserved/untouched — §6) | §6 |
| Single-card fill (D74-5) | `.rail > *:only-child` | media query, `MantineListingCardTrack.module.css` | `theme.ts` xs2=30em | change (new rule; the `:only-child` selector is new — the underlying base rule it overrides is preserved byte-identical) | §7, AC6 row |
| Multi-card ladder (D74-6) | `.rail > *:not(:only-child)` | media queries, `MantineListingCardTrack.module.css` | `theme.ts` breakpoints | change | §7 |
| `.grid` (AC9) | `.grid` | `MantineListingCardTrack.module.css` | `--listing-card-min` | **preserve, byte-unchanged** | `git diff` shows no hunk touching `.grid` |
| Card two-line title clamp | `MantineListingCardPattern.tsx:224`/`:360` | `styles.cardTitle`, `lineClamp={2}` | n/a | **preserve** (already implemented, R5) | inspected, unchanged in diff |
| `.cardGrid { height: 100% }` | `MantineListingCardPattern.module.css:188` | `.cardGrid` | n/a | **preserve, byte-unchanged** | confirmed via `git status --porcelain` (file absent) |

## 11. Assumptions, deviations, and limitations

- **`ASSUMPTION (reversible, stated)`** — all four rails (Featured/Latest/RecentlyViewed/Similar) get the controls, since they all render `mode="rail"` through the shared track and the kickoff itself names this as the only consistent choice (§5).
- **`CANONICAL STYLE DECISION REQUIRED`** — the D74-6 `offset=36` constant (§7). Not a repo token; two measured alternatives presented for the owner.
- **Known, bounded, untested gap** — cap-safety for the count ladder is unverified in two narrow, ungraded viewport windows (~707-767px, ~981-1023px) — §7.
- **`ListingCard.module.css`'s `.cardVertical { height: 100% }`** is the actual root cause the R4 fix works around, not the cause itself — it is out of this task's scope (kickoff §8) and was not touched; the track overrides it instead, per the kickoff's own canonical decision table.
- Two-armed proof (§12) plants the violation directly in `RailControls`'s JSX condition (`{canScrollNext && (...)}` → `{true && (...)}`), matching the kickoff's own described plant exactly ("set the control's visibility condition to a constant `true` so a control renders on a non-overflowing rail").
- The mandatory 872px test width does not reproduce the kickoff's own illustrative "872px container" exactly on this site's real gutters (measured container: 824px) — see §7's note. The fix's mechanism (a percentage-of-container fraction, never a fixed px) is verified robust at the real measured container regardless.
- No `@mantine/carousel` or other new dependency was added (`git diff package.json` empty).
- `RecentlyViewedSkeleton`/`FavoritesShell` (Task 809) were not touched — out of scope.

## 12. Two-armed proof (Q3 gate claim)

Plant: `src/design-system/mantine/patterns/MantineListingCardTrack.tsx` — `{canScrollNext && (` → `{true && (`.

- Pre-plant hash: `6942fbd18e5d6ac4e0490e2681ddc67f45359a2d`
- Planted run (`runs/planted-1/`): `npm run build` → exit 0 → `npm run start` → `BASE_URL=http://localhost:3000 node scripts/task810-rail-controls-probe.mjs planted-1` → **exit 1**, 9 hard-fail lines, each naming `control present on non-overflowing rail (count=1)` at every one of the 9 tested widths' `rail0` (the genuinely non-overflowing single-card section).
- Revert: restored `{canScrollNext && (`. Post-revert hash: `6942fbd18e5d6ac4e0490e2681ddc67f45359a2d` — **identical to the pre-plant hash**; `git status --porcelain` on the file shows only the task's OTHER (legitimate) hunks, no stray plant residue.
- Reverted run (`runs/reverted-1/`): `npm run build` → exit 0 → `npm run start` → same probe into a fresh `runId` → **exit 0**, "all cells captured cleanly."
- **Both arms fired by the same final probe blob**: `git hash-object scripts/task810-rail-controls-probe.mjs` = `ec5e5a3ce7423b8d132a74ac1884dc586a07e989`, identical across `baseline-1`, `planted-1`, and `reverted-1`'s own recorded `probeHash` field (quoted in each JSON).

## 13. `'use client'` boundary change

`MantineListingCardTrack.tsx` gains `'use client'` (Task 810 owns scroll-position state and DOM listeners for its own controls, per kickoff §10.1). Its five Server Component consumers are unaffected — client boundaries compose transparently in the App Router. Confirmed via the final `npm run build` transcript: `ƒ /[locale]/listings/[slug]` (dynamic, server-rendered) is still present (line 38, `transcripts/build.txt`), matching the kickoff's explicit requirement.

## 14. Backlog update

`docs/backlog.md` "Last Session" replaced; Sprint 74 / Task registry rows updated to reflect **810** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Resulting `docs/backlog.md` line count and any `BACKLOG LIMIT BREACH` are reported in that file's own header per the 80-line rule.

## 15. Self-validation verdict

```
Self-validation: tsc=0 errors · build=passes (exit 0, ƒ /[locale]/listings/[slug] present) · AC table=all green (§1) · runtime locale=uk PASS (all evidence captured at locale uk against the live homepage) · scope=clean (git status matches the declared Files Changed table, no consumer/imageDelivery.ts/package.json/theme.ts touched) · integrity=PASS (check:file-integrity, check:mojibake both 0)
```

## 16. Opus handoff — evidence locations and open questions

- Evidence root: `docs/sessions/evidence/task810/` — `runs/{baseline-1,planted-1,reverted-1}/rail-controls-probe.json`, `transcripts/*.txt`.
- Probe script: `scripts/task810-rail-controls-probe.mjs`.
- **Open decision for the owner/reviewer**: §7/§9's `offset=36` — verify the reasoning, or pick a different constant.
- **Open, low-severity, ungraded gap**: §7's two narrow untested cap-safety windows.
- **Please independently verify**: the `.imageActions z-index:1` / `--z-dropdown` stacking interaction (§9) — this was found empirically via a real click failure during probe development, not derived from a pre-existing finding; worth a second look given it touches a card-pattern file this task did not otherwise change.
- **`OWNER VISUAL QA REQUIRED`** (kickoff §13 table, unchanged from the kickoff — not run by the executor per the `screenshots:assert` retirement, owner decision 2026-09-03): rail scrollbar hover/click at uk/sq, 390/768/1024/1440; non-overflowing rail (no controls) at uk, 1440; Similar/Recently-viewed one-card boundary at uk, 320/480/481; long-vs-short title equal heights at uk 320 (mandatory) and 1024; mouse-drag + click both controls at uk 1024. Storybook states to review: `Patterns/Mantine/ListingCardTrack` → `Rail`, `RailNoOverflow`, `RailSingleItem`, `RailMixedTitleLengths`, `GridMixedTitleLengths`.

**Revision 0 evidence status: SUPERSEDED, retained in place.** `runs/baseline-1/`, `runs/planted-1/`, `runs/reverted-1/`, and every `transcripts/*.txt` without a `rev1-` prefix are Revision 0 artifacts. None was deleted or overwritten; §1-16 above describe that diff, which Revision 1 extends. Do not cite them for any Revision-1-era claim (D74-9, the container ladder, AC10-AC17, or the mid-revision fixes in §17.2/§17.3 below) — use the `rev1-*` runs/transcripts instead.

---

# Revision 1

Filed against the orchestrator review of 2026-09-10 (`NEEDS REVISION`, kickoff §16-§20) plus three mid-session owner
corrections issued directly during this execution (§17.2/§17.3 below, not part of the reviewer's written §16-§20).
Sections 1-16 above are Revision 0 and are **not** rewritten.

## 17. Requirement and acceptance-criteria evidence — Revision 1

| Req | AC | Evidence | Result |
|---|---|---|---|
| R10 D74-9 container ladder | AC10 | `runs/rev1-baseline/rail-controls-probe.json` → `homeVsDetail`, ALL 13 widths: where the two routes' containers are equal (320-1010, 9 widths) the card width is **identical, diff 0.00px**; at 1440 containers 1344 vs 854.66 give 249.44 vs 250.69 (**1.25px**); at 1024 they give 280.00 vs 254.19 (**25.81px**) and at 1920/2560 243.50 vs 250.69 (**7.19px**). **Corrected by the reviewer 2026-09-10:** AC10's own “within 5px at every viewport” wording was unsatisfiable under a container-keyed ladder and is a task-design defect, not an implementation failure — the invariant that D74-9 actually guarantees is *equal container ⇒ equal card*, and AC16's 26/26 rung match is its real proof. `git diff` on the module CSS shows the D74-6 block uses `@container (min-width: …em)` exclusively; D74-5 still `@media (max-width: 30em)`. | ✅ |
| R11 detail route measured | AC11 | Every one of 13 widths produced a `/` cell **and** a `/listings/11-mr7ucly4` cell (39 total cells, 13×3 incl. `/listings` grid). Usage-error path separately verified: `DETAIL_SLUG=this-slug-does-not-exist-xyz` → `❌ … usage error — detail route /listings/this-slug-does-not-exist-xyz did not resolve (status 200)`, real shell exit code **2** (checked directly, not through a pipe). No run directory persisted for that invocation (the script throws before `writeFile`, confirmed empty and removed). | ✅ |
| R12 grid measured + 2nd two-armed proof | AC12 | `/listings` grid cell present at every width with `cardHeights`/`equalHeights`/`controlCount:0`. Planted (`rev1-heights-planted`): exit **1**, 14 reasons incl. `width=320 path=/listings/11-mr7ucly4 rail[0]: unequal card heights` (a rail cell, not only grid — the plant removed the rule for BOTH selectors). Reverted (`rev1-heights-reverted`): exit **0**. Pre-plant hash `e65d29a8ed5a74842edf40ceb582584e4c25c24b` = post-revert hash (identical). Shared `probeHash` `3100f50a927994d93aef207b0e75b7b0523885e5` across `rev1-baseline`/`rev1-heights-planted`/`rev1-heights-reverted`. | ✅ |
| R13 D74-8 paging | AC13 | `scrollByPage` rewritten to `pitch = cardWidth + gap; delta = max(floor(clientWidth/pitch)*pitch, pitch)`. Per-cell arithmetic in §18 below — every non-end-clamped cell matches `clientWidth − peek` within ±2px; every end-clamped cell lands exactly at `scrollWidth − clientWidth`. | ✅ |
| R14 real hit-testability | AC14 | `evalRailSection` now calls `wrapper.scrollIntoView({block:'center', behavior:'instant'})` before `elementFromPoint` (Revision 0's version silently skipped ~all cells as `inViewport:false`, a no-op that looked like a pass — found and fixed mid-session, see §17.2). Final run: **17/17 hit-tests `inViewport:true` and `hit:true`, 0 misses**. | ✅ |
| R15 widened width set | AC15 | `WIDTHS = [320,390,480,481,640,750,768,872,1010,1024,1440,1920,2560]` — all 13 present in every cell group of `rev1-baseline`. | ✅ |
| R16 rung assertion | AC16 | `expectedRailCardWidth()` independently re-derives `n`/`offset=36` from container width (not copy-pasted from the CSS — see script header comment). **26/26** multi-card rail measurements matched within ±1px; full table in §19. | ✅ |
| R17 documentation corrections | AC17 | R17.1 (provenance table additions) done — §20 below. R17.2 (`'use client'` scope) done — TSX doc comment, `docs/component-catalog.md`, this section all corrected; the optional module split was **not** taken (documented reason in §20). R17.3 (`@layer` reason) done — CSS comment cites it. R17.4 (`RailNoOverflow` viewport pin) done — `globals: { viewport: { value: 'desktop1440', isRotated: false } }`. R17.5 (D74-7/D74-8/D74-9 citations) done — quoted in §20. | ✅ |

## 18. AC13 — per-cell paging arithmetic (D74-8)

| Path | Width | `before` | `after` | `delta` | `expectedDelta` (`clientWidth−peek`) | End-clamp? | Within ±2px or end-clamped? |
|---|---|---|---|---|---|---|---|
| `/` | 320 | 0 | 200 | 200 | 200.31 | No | ✅ |
| `/listings/11-mr7ucly4` | 320 | 0 | 97 | 97 | 200.31 | **Yes** (`scrollWidth−clientWidth`) | ✅ (exempt) |
| `/` | 390 | 0 | 245 | 245 | 245.11 | No | ✅ |
| `/listings/11-mr7ucly4` | 390 | 0 | 116 | 116 | 245.11 | Yes | ✅ (exempt) |
| `/` | 480 | 0 | 296 | 296 | 296.00 | No | ✅ |
| `/listings/11-mr7ucly4` | 480 | 0 | 128 | 128 | 296.00 | Yes | ✅ (exempt) |
| `/` | 481 | 0 | 296 | 296 | 296.00 | No | ✅ |
| `/listings/11-mr7ucly4` | 481 | 0 | 127 | 127 | 296.00 | Yes | ✅ (exempt) |
| `/` | 640 | 0 | 517 | 517 | 517.44 | No | ✅ |
| `/` | 750 | 0 | 592 | 592 | 592.00 | No | ✅ |
| `/` | 768 | 0 | 592 | 592 | 592.00 | No | ✅ |
| `/` | 872 | 0 | 773 | 773 | 773.11 | No | ✅ |
| `/` | 1010 | 0 | 888 | 888 | 888.00 | No | ✅ |
| `/` | 1024 | 0 | 888 | 888 | 888.00 | No | ✅ |
| `/` | 1440 | 0 | 498 | 498 | 1327.19 | **Yes** | ✅ (exempt) |
| `/` | 1920 | 0 | 489 | 489 | 1297.50 | Yes | ✅ (exempt) |
| `/` | 2560 | 0 | 489 | 489 | 1297.50 | Yes | ✅ (exempt) |

Every non-end-clamped cell matches the whole-page formula within rounding; every end-clamped cell (the rail ran out
of content before a full page) landed exactly at `scrollWidth − clientWidth`, the AC13-stated exemption.

## 19. AC16 — per-rail rung assertion (D74-9 container ladder)

| Path | Width | Container (px) | Rung `n` | Expected width | Actual `firstChildWidth` | Match (±1px)? | Peek (px) |
|---|---|---|---|---|---|---|---|
| `/` | 320 | 288.0 | 1 | 184.32 | 184.31 | ✅ | 87.69 |
| `/listings/…` | 320 | 288.0 | 1 | 184.32 | 184.31 | ✅ | — (fits) |
| `/` | 390 | 358.0 | 1 | 229.12 | 229.11 | ✅ | 112.89 |
| `/listings/…` | 390 | 358.0 | 1 | 229.12 | 229.11 | ✅ | — |
| `/` | 480 | 448.0 | 1 | 280.00 | 280.00 | ✅ | 152.00 |
| `/listings/…` | 480 | 448.0 | 1 | 280.00 | 280.00 | ✅ | — |
| `/` | 481 | 449.0 | 1 | 280.00 | 280.00 | ✅ | 153.00 |
| `/listings/…` | 481 | 449.0 | 1 | 280.00 | 280.00 | ✅ | — |
| `/` | 640 | 592.0 | 2 | 242.72 | 242.72 | ✅ | 74.56 |
| `/listings/…` | 640 | 592.0 | 2 | 242.72 | 242.72 | ✅ | — (fits) |
| `/` | 750 | 702.0 | 2 | 280.00 | 280.00 | ✅ | 110.00 |
| `/listings/…` | 750 | 702.0 | 2 | 280.00 | 280.00 | ✅ | — |
| `/` | 768 | 720.0 | 2 | 280.00 | 280.00 | ✅ | 128.00 |
| `/listings/…` | 768 | 720.0 | 2 | 280.00 | 280.00 | ✅ | — |
| `/` | 872 (mandatory) | 824.0 | 3 | 241.71 | 241.70 | ✅ | **50.89** |
| `/listings/…` | 872 | 824.0 | 3 | 241.71 | 241.70 | ✅ | — |
| `/` | 1010 | 962.0 | 3 | 280.00 | 280.00 | ✅ | 74.00 |
| `/listings/…` | 1010 | 962.0 | 3 | 280.00 | 280.00 | ✅ | — |
| `/` | 1024 | 960.0 | 3 | 280.00 | 280.00 | ✅ | 72.00 |
| `/listings/…` | 1024 | **620.0** | 2 | 254.19 | 254.19 | ✅ | — |
| `/` | 1440 | 1344.0 | 5 | 249.45 | 249.44 | ✅ | 16.81 |
| `/listings/…` | 1440 | **854.7** | 3 | 250.70 | 250.69 | ✅ | — |
| `/` | 1920 | 1312.0 | 5 | 243.51 | 243.50 | ✅ | 14.50 |
| `/listings/…` | 1920 | 854.7 | 3 | 250.70 | 250.69 | ✅ | — |
| `/` | 2560 | 1312.0 | 5 | 243.51 | 243.50 | ✅ | 14.50 |
| `/listings/…` | 2560 | 854.7 | 3 | 250.70 | 250.69 | ✅ | — |

26/26 matches. **This table is itself AC10's evidence too**: at every width the homepage and detail-route containers
that happen to be EQUAL (320-1010) always select the SAME rung and render the SAME card width — the D74-9 defect
(same viewport, same rung, different container, different card) cannot recur, because the query now reads the
container directly. At 1024/1440/1920/2560 the two routes' containers genuinely differ (the detail route's contact
sidebar claims width the homepage doesn't spend), so they correctly select different rungs — that is the intended,
container-driven behaviour, not a regression of the fix.

## 20. R17 documentation corrections — done in this revision

1. **Provenance table (R17.1)** — two rows the Revision 0 table omitted:
   - Scrollbar thumb `border-radius`: `var(--radius-pill)` — `globals.css:333` `--radius-pill: 3.40282e38px;`.
   - `ActionIcon` `radius="xl"`: a Mantine radius **key** (named token, not a literal) — no grep needed for a
     component prop value; cited here for completeness since §9's table lists every new visual value.
   - The hover scrollbar-height row is corrected from 8px to **12px** (`var(--mantine-spacing-sm)`,
     `theme.ts:350` `sm: '0.75rem', // 12px`) — a mid-revision owner correction, §17.3 below; §9's original row
     is Revision-0-accurate for what it measured at the time and is left as historical record rather than edited.
2. **`'use client'` scope (R17.2)** — corrected in three places: the TSX module doc comment (now states the
   directive covers the whole module, `grid` mode included), `docs/component-catalog.md`'s `MantineListingCardTrack`
   row, and this session log's own §13 (superseded by this note — §13 above is Revision 0 prose and is not edited
   in place). The optional `RailControls`-as-its-own-module split (keeping `grid` mode server-only) was **considered
   and not taken**: the component is small, `grid` mode was already paying for the client bundle in practice once
   `'use client'` sits at the top of the file (a module directive, not a per-export one), and splitting would add a
   second file for a boundary that does not change any measured behaviour — the corrected sentence is a sufficient,
   smaller fix. `rev1-build.txt` reconfirms `ƒ /[locale]/listings/[slug]` — see §22.
3. **R4 `@layer` reason (R17.3)** — `MantineListingCardTrack.module.css`'s R4 comment now states the primary reason
   (`ListingCard.module.css` wraps `.cardVertical` in `@layer utilities`, `:37`/`:45`; this module is unlayered, so
   it wins regardless of specificity) ahead of the specificity point, which was Revision 0's only stated reason.
4. **`RailNoOverflow` viewport (R17.4)** — pinned via `globals: { viewport: { value: 'desktop1440', isRotated: false } }`,
   with a comment explaining why (2 cards overflow the `n=1` rung's own default width at mobile canvases).
5. **Decision citations (R17.5)** — `offset=36` cites **D74-7** in place of Revision 0's "flagged for the owner"
   prose; the paging rewrite cites **D74-8**; the container-query rungs cite **D74-9**. Quoted quotes are in the CSS
   module and the TSX `scrollByPage` comment (see the diff).

## 21. Mid-revision owner corrections (2026-09-10, issued directly during this execution — not part of the reviewer's §16-§20)

These three items were raised by the owner in the chat, live, while Revision 1 was in progress. None is in the
kickoff's own §16-§20 text; all three are real, verified defects/requests, and all three are now fixed and measured.
Recorded here because the completion-report contract (§14/§19) requires deviations to be stated, and these are the
most consequential changes in this revision.

### 21.1 The control button was unreliable to click in a real browser — found live, not by the probe

The owner reported "sometimes I click the arrows and nothing happens." Reproduced with a **real** Playwright mouse
click (`page.mouse.move` + `.down()` + `.up()`, not the `el.click()` DOM-dispatch the probe itself uses): **8 of 8**
consecutive real clicks failed with `elementHandle.click: Timeout … element … from <div class="…rail…"> subtree
intercepts pointer events`, alternating between an `<img>` inside a card and, occasionally, the sticky header.

Root cause, isolated by instrumenting `mousedown`/`mouseup`/`click` listeners directly on the button: a real
`mousedown` engages Mantine's own `.mantine-active:active { transform: translateY(0.0625rem) }` (`theme.ts`'s
default `activeClassName`, present on every `ActionIcon` unless overridden), which **replaces** — not composes
with — this control's own `transform: translateY(-50%)` centring rule (a single `transform` declaration holds one
value). Measured: the button's `top` moved from `428.28px` to `451.28px` under a real `mousedown`. The mouse cursor
does not move, so `mouseup` fires over whatever is now under it — the card image — and the browser never dispatches
a `click` event to the button at all. This is a functional defect, not a cosmetic one: `MOUSEDOWN` fired but
`MOUSEUP`/`CLICK` never did, confirmed via live event listeners.

**First fix attempt did not work.** `.control.mantine-active:active { transform: translateY(-50%) }` compiles, in a
CSS Module, to `.MantineListingCardTrack_control__xxx.MantineListingCardTrack_mantine-active__yyy:active` — CSS
Modules scope EVERY bare class token, including `.mantine-active`, which is Mantine's real *global*, unscoped class
name. The rule matched nothing. Found by reading the compiled rule back out of `document.styleSheets` in a live
probe (quoted `cssText`), not by inspection alone. Fixed with `:global(.mantine-active)`.

**Verification, both before and after, with the SAME repro:**

| | Real mousedown moves the button? | 10 consecutive real clicks |
|---|---|---|
| Before fix | Yes — `top` 428.28px → 451.28px | 0/10 (not separately re-measured; the 8/8 failure predates the fix) |
| After fix | No — `top` 428.28px → 428.28px, identical | **10/10** |

### 21.2 The owner's first message was about this same button, misread as "remove scroll animation"

The owner's exact first message: *"прибери анімацію під час кліку з кнопок контролів вліво/вправо у секціях, де
скроляться горизонтально картки"* ("remove the animation during a click from the left/right control buttons"). This
was initially misread as a request to remove the PAGE's smooth-scroll animation (`scrollBy({behavior:'smooth'})` →
`'auto'}`) rather than the BUTTON's own press animation (§21.1). The owner corrected this directly: *"я тебе попросив
прибрати анімацію з самих кнопок… а не... каруселі"* / *"поверни плавну анімацію скролу"* ("bring back the smooth
scroll animation"). `scrollByPage`'s `behavior` is reverted to `'smooth'` (with the `prefers-reduced-motion` fallback
to `'auto'` restored); §21.1's fix is the actual, correct resolution of the original request. Verified live: sampling
`rail.scrollLeft` every 50ms after a click shows a genuine multi-step animation (`10 → 103 → 515 → 714 → 788 → 834`
over ~300ms), not an instant jump, and the 10/10 click-reliability result in §21.1 was re-measured AFTER this revert
(so the reliability fix and the smooth-scroll restoration are confirmed to coexist correctly).

### 21.3 Hover scrollbar thickness raised from 8px to 12px, to match the owner's reference

Owner instruction, with a reference screenshot (rozetka.com.ua "Схожі товари"): the hover-state scrollbar should be
thick enough to grab and drag with a mouse, specifically **12px**. `.rail:hover::-webkit-scrollbar,
.rail:focus-within::-webkit-scrollbar { height: … }` changed from `var(--mantine-spacing-xs)` (8px) to
`var(--mantine-spacing-sm)` (12px, `theme.ts:350`). Verified live: `getComputedStyle(rail, '::-webkit-scrollbar').height`
reads `4px` at rest, `12px` on `:hover`. The rest-state 4px is unchanged (not part of this instruction).

## 22. Final native gate re-run (Revision 1)

All commands re-run after every fix above, from the FINAL source state (post §21.1-§21.3), captured natively in
Windows PowerShell per the transcript rule; each file ends with its own `EXIT_CODE=` line.

| Command | Transcript | Exit |
|---|---|---|
| `node.exe -p process.platform` | `transcripts/rev1-platform.txt` | 0 (`win32`) |
| `npm.cmd run typecheck` | `transcripts/rev1-typecheck.txt` | 0 |
| `npm.cmd run lint` | `transcripts/rev1-lint.txt` | 0 |
| `npm.cmd run check:stories` | `transcripts/rev1-check-stories.txt` | 0 |
| `npm.cmd run check:story-coverage` | `transcripts/rev1-check-story-coverage.txt` | 0 (33/0) |
| `node.exe scripts\check-design-tokens.mjs --strict --scope=mantine` | `transcripts/rev1-check-design-tokens.txt` | 0 |
| `npx.cmd vitest run src/design-system src/modules/listings` | `transcripts/rev1-vitest-targeted.txt` | 1 — 3 pre-existing failures, identical to Revision 0's baseline (§5) |
| `npm.cmd run test` | `transcripts/rev1-npm-test-full.txt` | 1 — **9 failures this specific capture**; see the flakiness note below |
| `npm.cmd run build-storybook` | `transcripts/rev1-build-storybook.txt` | 0 |
| `npm.cmd run build` | `transcripts/rev1-build.txt` | 0 — `ƒ /[locale]/listings/[slug]` present (line 38) |
| `npm.cmd run check:file-integrity` | `transcripts/rev1-check-file-integrity.txt` | 0 |
| `npm.cmd run check:mojibake` | `transcripts/rev1-check-mojibake.txt` | 0 |

**`npm run test` full-suite flakiness — measured, not assumed.** The full suite was run **four** times across this
revision (one retained as `rev1-npm-test-full.txt`, three more via `npx vitest run` for cross-checking) with
**no source change between runs**: failure counts were 5, 9, 9, 10, over 4 / 6 / 7 / 7 files. **Five failures are
present in every single run and are byte-identical to Revision 0's/Task 790's documented baseline**:
`css-var-resolvability.test.ts`, `theme.d69-18.test.tsx` (`FooterView.tsx`), `appimage-config-class-assertions.test.ts`
(self-declared `BLOCKED`), and `ListingCard.smoke.test.tsx` ×2. A second, **non-deterministic** group appears in some
runs and not others: `filtersPanelShell.smoke.test.tsx`, `filtersRangeDatePicker.smoke.test.tsx`,
`heroSearch.smoke.test.tsx` — **none of these three files is touched by this task's diff** (they belong to the
`FiltersPanel`/`HeroSearch` surfaces), and running them in isolation (`npx vitest run` on just those two files)
passes **33/33** cleanly. This is pre-existing full-suite test-order/pollution flakiness, not a regression introduced
by Task 810 — but it is newly *observed* here because this session ran the full suite four times, more than any
single prior task did. Not filed as a numbered task by the executor (task filing is Opus's role); flagged for the
orchestrator to decide whether it becomes one.

## 23. Files Changed — Revision 1 (in addition to §3's Revision 0 list)

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantineListingCardTrack.module.css` | D74-9 container query conversion + `container-type: inline-size`; R4 `@layer` reason; D74-7 citation; §21.1 `:global(.mantine-active)` click-reliability fix; §21.3 12px hover scrollbar |
| `src/design-system/mantine/patterns/MantineListingCardTrack.tsx` | D74-8 paging rewrite + citation; §21.2 smooth-scroll revert; `'use client'` scope doc correction |
| `scripts/task810-rail-controls-probe.mjs` | R11 (detail route) + R12 (grid + 2nd two-armed proof) + R13 (paging assertion) + R14 (real hit-test, incl. the scroll-into-view fix found mid-session) + R15 (widths) + R16 (rung assertion); two bugs found and fixed during this session (grid cells wrongly required a rail track; grid/rail equal-height check didn't bucket by row, flagging single-column grid rows as unequal) |
| `src/stories/patterns/mantine/ListingCardTrack.stories.tsx` | R17.4 `RailNoOverflow` viewport pin |
| `docs/component-catalog.md` | R17.2 `'use client'` scope correction + Revision 1 summary sentence |
| `docs/sessions/2026-09-10-task810-the-rail-becomes-usable.md` | this Revision 1 section |
| `docs/backlog.md` | Last Session + Sprint 74 + task-registry rows updated for Revision 1 |

## 24. Self-validation verdict — Revision 1

```
Self-validation: tsc=0 errors · build=passes (exit 0, ƒ /[locale]/listings/[slug] present, rev1-build.txt) · AC table=all green (§17, incl. AC11's usage-error exit 2, verified) · runtime locale=uk PASS (all rendered evidence at locale uk, both / and the detail route) · scope=clean (git status matches §23's Files Changed table) · integrity=PASS (rev1-check-file-integrity.txt, rev1-check-mojibake.txt both 0) · two-armed proofs=2/2 (R2's original + R12's new, both planted-exit-1/reverted-exit-0 with matching probeHash) · click-reliability=10/10 real clicks (§21.1)
```

Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**.
