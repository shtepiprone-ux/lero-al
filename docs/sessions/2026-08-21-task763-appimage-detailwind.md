# Task 763 — `AppImage` de-Tailwind — Session Log

**Task path:** `tasks/Sprints/Sprint_63_kickoff_prompt_Task_763_AppImage_De_Tailwind.md`
**Status:** `PARTIALLY IMPLEMENTED` — **never self-approved.** 20 of 21 `appImageConfig.ts` Tailwind
strings + all 4 `AppImage.tsx` strings migrated; `listing`'s `hoverClass`/`'group'` pair is
`BLOCKED` with evidence, per the kickoff's own §10.3.5 stop instruction.

## 1. Requirement and acceptance-criteria evidence

| Req | Status | Evidence |
|---|---|---|
| R1 (zero Tailwind strings in `appImageConfig.ts`) | **PARTIAL** | AC1 grep: only comment lines (58-61) + the one documented exception (`listing.hoverClass`, line 82) remain. 20/21 migrated. |
| R2 (zero Tailwind strings in `AppImage.tsx`) | **MET** | Both `cn()` calls now use `styles.*`; `git diff` confirms. |
| R3 (public API byte-identical) | **MET** | `git diff` shows zero changes to `AppImageProps`, `ImageVariant`, `VARIANTS` keys, JSDoc. `npm run typecheck` exit 0. |
| R4 (LQIP/preload/tier/hook-order unchanged) | **MET** | `git diff` confined to the two `cn()` calls + import; hook order untouched. `npm run test:listings` 45/45. |
| R5 (every declaration traced to I1) | **MET** for migrated fields | `docs/sessions/evidence/task763/i1-utility-extraction.md` maps every module declaration to its I1 row; 3 deliberate `--tw-gradient-*` drops (A3) and 2 literal-vs-token substitutions (duration/easing, N1 exception) are named and justified there. |
| R6 (cascade standing, `@layer utilities`) | **MET** | `AppImage.module.css` wrapped in `@layer utilities`; I4 comparator geometry byte-identical. |
| R7 (`group-hover` → module mechanism, `'group'` removed) | **PARTIAL / BLOCKED** | `gallery-main`/`gallery-side` fully migrated and live-route verified (`brightness(0.95)` on hover, real listing detail page). `listing` — BLOCKED, see §4. |
| R8 (no new Class-2, Class-3 inventory complete) | **MET** | `check:tailwind-runtime-tokens` 24/14/14/0 new debt. Class-3 inventory: §5 below. |
| R9 (two-armed plant) | **MET** | §6 below — both arms observed-fail, then hash-verified reverted. |
| R10 (all 9 variants verified) | **PARTIAL** | `listing`/`listing-thumb` full I2/I4 matrix (6 widths × required locales). `preview`/`upload`/`avatar` — I1 diff + unit assertion only (§10.5, no story exists — correctly not created). `gallery-main`/`gallery-side` — live production-route verification (better than Storybook; no story renders real `AppImage` for these, see §3). `gallery-strip`/`lightbox` — I1 diff + unit assertion only (no story renders them with real `AppImage` either, not investigated further given the other 7 variants' coverage; flagged as a limitation, §8). |
| R11 (no permanent Storybook markup) | **MET** | `git status --porcelain` shows no `*.stories.tsx` path. |
| R12 (`npm run build` exit 0) | **MET** | Final run, this session: exit 0. |

## 2. Current versus required behaviour

Preserved exactly (verified): container geometry (position/inset/width/height/aspect-ratio/
overflow/object-fit/background-color, byte-identical, I2/I4), image fit, hover-suppressed-on-LOW
(`useAdaptiveImageConfig.ts:141` untouched), LQIP blur, priority-opaque-no-transition, React 19
`preload()`/`notifyPriorityPreload` hook order, `usePredictivePreload` position, `srcset`/`sizes`/
`fetchPriority`/`loading`, caller `className` composition, falsy-`src` N1 flow (all untouched code
paths, confirmed by `git diff` scope).

**Not achieved:** `listing` variant's hover-scale mechanism still depends on Tailwind's
`group-hover:scale-105` and `MantineListingCardPattern.tsx:304`'s `'group'` class — see §4.

## 3. I0 drift from the kickoff's own §3 facts

- **§3.5 is FALSE for `ListingCardPattern.stories.tsx`.** It does not render `AppImage` — it
  renders `DemoImage`, an explicit Mantine-`Image` stand-in (`src/stories/patterns/mantine/
  ListingCardPattern.stories.tsx:26`, own comment: *"Demo photo element — a plain Mantine `Image`,
  standing in for the real app's `AppImage`"*). Confirmed two ways: (1) static grep of the story
  file; (2) rendered capture — every one of its 10 `<img>` elements carries
  `mantine-Image-root`/`m_9e117634` classes and Mantine's own `transitionProperty: "transform,
  opacity"`, never `AppImage`'s class list. This reproduces backlog item **746**'s exact finding
  ("no control can see a hover-state or real-consumer (`AppImage`, not `DemoImage`) regression on
  the listing card") — 746 is filed and reserved, not yet built; this session hit its blind spot
  directly. **Substituted** `mantine-primitives-listingcard--default`
  (`src/stories/mantine/primitives/ListingCard.stories.tsx`) — its own header comment: *"statically
  imports the REAL production `ListingCard` (clause 16c canonical-Story binding) … this story
  imports zero demo stand-ins."* Confirmed by rendered capture: real `AppImage` class fingerprints,
  real `group-hover:scale-105` class present pre-edit. This is a **better** source than the one the
  kickoff named, not merely a workaround — it is the one explicitly already blessed as canonical.
- **`preview`, `upload`, `avatar`, `gallery-main`, `gallery-side`, `gallery-strip`, `lightbox` have
  no story that renders the real `AppImage`** — the kickoff's own §3.5 only flagged `preview`/
  `upload`/`avatar` as uncovered; the gallery/lightbox variants are ALSO uncovered
  (`ListingGalleryPattern.stories.tsx` renders `MantineListingGalleryPattern`, which contains zero
  `AppImage` usage — grep-confirmed, zero matches). This is broader than the kickoff stated. For
  `gallery-main`/`gallery-side` this session used the real, live `next dev` production route
  (`/en/listings/11-mr7ucly4`) instead — arguably stronger evidence than Storybook, consistent with
  D-C ("route-level DOM on a real dev server is the mount evidence"). `gallery-strip`/`lightbox`
  (used only inside `LightboxView.tsx`, itself only reachable from a real gallery's lightbox
  trigger) were not chased to the same live-route depth given time — I1 diff + unit assertion only,
  named as a limitation (§8).

## 4. R7 `BLOCKED` finding — `listing` variant's hover mechanism

**Measured (pre-edit, live Storybook `mantine-primitives-listingcard--default`, 1024px):**

| Probe | Result | Script |
|---|---|---|
| Hover directly over the image | Image bounding-rect scales **1.1025×** (296px → 326.34px) | `debug-hover-rects.mjs` |
| Hover the title/price area **below** the image, inside the same Card, never touching the image | Image bounding-rect **still** scales **1.1025×** | `debug-hover-titlearea.mjs` |
| `getComputedStyle` breakdown at the image during hover | `transform: matrix(1.05,…)` (module's own `transform: scale(1.05)`) **composes with** `scale: 1.05` / `--tw-scale-x: 105%` (Tailwind's `group-hover:scale-105`, a *different* CSS property) | `debug-hover-index0.mjs` |

**Mechanism:** `MantineListingCardPattern.module.css:67-68` (Task 602, untouched, out of this
task's scope) already has its own, independent, unlayered `.card:hover .imageSection img {
transform: scale(1.05); }` rule — it does not depend on `.group` or `group-hover:` at all. It wins
the cascade over anything Tailwind emits (D34: unlayered beats `@layer utilities`) and applies
whenever the pointer is anywhere over the `Card` (`'group'`), including the title/price text below
the image. Tailwind's `scale` CSS property (a *separate* property from `transform`) additionally
applies 105% when the `<img>` itself carries `group-hover:scale-105` and its `.group` ancestor is
hovered. The two effects **compose multiplicatively** (1.05 × 1.05 = 1.1025), which is why the
currently-shipped hover-zoom is measurably larger than either utility's own 1.05× — a
previously-undocumented fact this session's I2 measurement surfaced.

**Why this blocks R7 as written:** the kickoff's own §10.3.5 authorizes rooting `AppImage`'s hover
mechanism on its own container (`.container:hover .hoverScale`) — this works cleanly for
`gallery-main`/`gallery-side` because their external `.group` wrapper (`ListingGallery.tsx:95,105`)
contains *only* the `AppImage` instance, so the two ancestor scopes are identical. For `listing`,
`MantineListingCardPattern`'s `Card` (`'group'`) also wraps the title, price, and badges — an area
strictly larger than `AppImage`'s own container. Narrowing the trigger to `AppImage`'s own container
would make the *additional* 0.05× (the part contributed by Tailwind's `group-hover:scale-105`)
fire only while the pointer is directly over the image, silently shrinking the total hover-zoom from
1.1025× to 1.05× whenever the pointer is over the title/price area instead — a real, measured,
rendered regression. The kickoff's own text: *"If I2 shows any consumer relies on a hover
originating outside AppImage's own container, stop and report BLOCKED naming the consumer — do not
widen the selector to :hover on an arbitrary ancestor."* This is exactly that condition.

**Why `'group'` cannot simply be removed either:** `MantineListingCardPattern.module.css`'s own
rule does not depend on `'group'`, so removing it would not break *that* rule — but removing
`'group'` while `appImageConfig.ts`'s `listing.hoverClass` still reads `'group-hover:scale-105'`
would kill Tailwind's half of the compound effect entirely (F-A's exact failure mode, 691R), which
is the reason §2's objective explicitly ties the two together.

**No workaround was implemented.** Both `appImageConfig.ts`'s `listing.hoverClass` and
`MantineListingCardPattern.tsx:304`'s `'group'` are byte-identical to `HEAD` — confirmed by leaving
`MantineListingCardPattern.tsx` completely untouched (not in the real diff) and by the AC1 grep
in §1 showing the one literal Tailwind string is exactly this field.

**Owner decision needed:** accept a measured 1.1025× → 1.05× rendered variance as an approved
trade-off (and this session/task can then close R1/R7 in a follow-up), or specify an alternative
mechanism. Not the executor's call.

## 5. Class-3 inventory (R8)

| Token | Declaring block | `globals.css` line | Replaces | Resolvable? |
|---|---|---|---|---|
| `--space-0` | `@theme inline` | 128 | `inset-0` (in `.absoluteFill`) | Yes — confirmed emitted in both built stylesheets |

`--muted` (`.bgMuted`) is **not** Class-3 — declared in plain `:root` (`globals.css:371`).
`--duration-slow`/`--ease-standard` are **not referenced** — both confirmed absent from every
built stylesheet (9 `.next/static/css/*.css` + 21 `storybook-static/assets/*.css` files); the
module writes their literal resolved values instead (`300ms`, `cubic-bezier(0.4, 0, 0.2, 1)`),
per the Task 757R precedent for the identical situation.

## 6. I5 — two-armed plant

| Arm | Mutation | Command | Result | Revert proof |
|---|---|---|---|---|
| P1 | `.aspect4x3 { aspect-ratio: 4/3 → 3/2 }` | `docs/sessions/evidence/task763/plants/compare-p1.mjs` (I4-style comparator against I2 baseline) | **FAIL** — 156 deltas (vs. the 48-delta clean baseline), naming exact cells: `height`, `aspectRatio` on all 3 `listing` instances | `git hash-object` before=after=`17b639a14b24d21738bccaf194405d369f7f8111` |
| P2 | `.hoverBrightness` rule body emptied (filter declaration deleted) | `docs/sessions/evidence/task763/debug-gallery-hover.mjs` against live `/en/listings/11-mr7ucly4` | **FAIL** — hover filter `none` (expected `brightness(0.95)`) | Same hash, re-confirmed after P2's own revert; live route re-verified `brightness(0.95)` restored |

**Pre-plant census:** `check:design-tokens` does not scan `aspect-ratio` or `filter` values (its
category list is `css-length`/`css-duration`/`css-zindex` only — confirmed by its own report
output, neither plant's mutated declaration matches). `tsc`/`next build` never read CSS
declaration content. `check:tailwind-runtime-tokens` reads custom-property *names*, not geometry
or filter values — a plain `3 / 2` or an emptied rule body introduces no new name. A cross-check of
whether `check:homepage-grid` would independently catch P1 was attempted (re-applying P1 and
re-running the gate against the live dev server) but the run did not complete within the available
time (background process; killed after timeout) — **this specific cross-check is INCONCLUSIVE, not
a confirmed miss**, and is named here rather than silently dropped.

## 7. Files Changed

| Path | Reason |
|---|---|
| `src/components/ui/appImageConfig.ts` | 20/21 Tailwind strings → CSS Module classes; `listing.hoverClass` deliberately unchanged (BLOCKED, §4) |
| `src/components/ui/AppImage.tsx` | 4 inline Tailwind strings → CSS Module classes (both `cn()` calls) |
| `src/components/ui/AppImage.module.css` | **New.** All migrated declarations, I1-sourced, `@layer utilities` |
| `docs/backlog.md` | Concise current-state update (Last Session + Sprint 63 registry line), net line count unchanged (80) |
| `docs/sessions/2026-08-21-task763-appimage-detailwind.md` | This log |
| `docs/sessions/evidence/task763/**` | I1 extraction, I2/I4 captures + comparator, plant transcripts, R7 BLOCKED-finding debug scripts, unit assertion |

**Not touched (deliberately):** `src/design-system/mantine/patterns/MantineListingCardPattern.tsx`
— §7's scope authorized removing `'group'` and its comment at line 304 only; since that removal is
BLOCKED (§4), the file is byte-identical to `HEAD` and does not appear in the real diff.

## 8. Validation evidence — commands run, actual output, exit codes

| Command | Result |
|---|---|
| `git status --porcelain` (pre-write) | empty |
| `git rev-parse HEAD` | `e2dc52f1627c651dfa1d199370c27bb2180eb258` (task filed against `201683f9d`; `git diff --stat 201683f9d e2dc52f16` shows docs-only drift — no code changed between filing and execution) |
| `node scripts/check-tailwind-runtime-tokens.mjs` (I0 baseline) | scanned 23, 14/14, exit 0 |
| `node scripts/check-tailwind-runtime-tokens.mjs` (final) | scanned **24**, 14/14, **0 new debt**, exit 0 — AC8 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | 0 errors, 66 pre-existing warnings (none in touched files except 2 harmless unused-var warnings in the evidence capture script), exit 0 |
| `npm run test:listings` | 45/45 passed, exit 0 |
| `npm run check:design-tokens` | **exit 1** — 2 CONFLICTs, reported not silenced (§9) |
| `npm run governance:tailwind` | 0 regressions vs. baseline (C0/H10/M0, matches baseline exactly), exit 0 |
| `npm run check:hydration` (cold, no server) | SKIP ×7 (dev server not yet running) |
| `npm run check:hydration` (warm, `BASE_URL=http://localhost:3000`, 3rd run) | **4/4 PASS, 0 FAIL, exit 0.** First two runs against a freshly-started dev server showed 1-2 intermittent FAILs on different routes each time (classic Turbopack dev cold-compile noise, documented in `docs/backlog.md`'s Task 601 entry); 6 direct isolated Playwright probes (3× `/en/listings`, 3× `/sq`) against the same running server found **zero** console errors, and the official gate itself went clean once all routes were warm — attributed to pre-existing dev-mode noise, not this diff (CSS Module class names are build-time-stable, not a source of intermittent SSR/client divergence). |
| `npm run check:homepage-grid` (`BASE_URL=http://localhost:3000`) | **260/260 PASS, 0 FAIL, exit 0** |
| `npm run check:css-vars` | 0 violations, 0 in-class dynamic sites, exit 0 |
| `npm run check:mojibake` | 0 artifacts in 3097 files, exit 0 |
| `npm run check:file-integrity` | 16 changed files clean, exit 0 |
| `npm run build` (final) | **exit 0** — AC12 |
| `npm run build-storybook` | exit 0 (run 3×: pre-edit, post-edit, P1-plant) |
| `npx vitest run docs/sessions/evidence/task763/appimage-config-class-assertions.test.ts` | 9/9 passed, exit 0 |
| I2/I4 comparator (`docs/sessions/evidence/task763/compare-i2-i4.mjs`) | 2896 cells compared, **48 deltas, all the same deliberate `transition-property` `--tw-gradient-*` drop (A3)** — no other delta of any kind (geometry, hover) |

## 9. `check:design-tokens` CONFLICTs (A2, not silenced)

Sprint 63 rule 2 forbids adding a `design-tokens-allow:` marker "as a way of passing." Two existing
precedents (`MantineListingCardPattern.module.css:186,204`, `MobileBottomNavView.module.css:88` for
the same `rounded-full` value; `AuthSheet.module.css:43,57,72,88` for the same `duration-300`
situation) DO carry markers — this task deliberately does not follow them, per the explicit rule.

```
src/components/ui/AppImage.module.css
  :116  [css-length]    "border-radius: 3.40282e38px"   — A2, raw Tailwind-compiled `calc(infinity*1px)` collapse, no token exists
  :150  [css-duration]  "transition-duration: 300ms"     — §6 above, `--duration-slow` unresolvable in every built stylesheet
```

`npm run check:design-tokens` exit 1. This is a **known, evidenced CONFLICT**, not an omission.

## 10. Assumptions resolved

- **A1:** `bg-muted` compiles directly to `background-color: var(--muted)`. No `--color-muted`
  substitution needed.
- **A2:** `rounded-full` is a raw literal (`3.40282e38px`). `check:design-tokens` rejects it; no
  marker added, reported as CONFLICT per §9.
- **A3:** Bare `transition`'s compiled property list does contain 3 `--tw-gradient-*` names;
  flattened out, remaining 20 properties (including `transform`/`scale`/`filter`, required for
  correct hover-transition composition) reproduced in order.
- **A4:** Not fully resolved for all 14 consumers — this session's I2 covered the two variants with
  real production-route/story coverage (`listing`, `listing-thumb`, `gallery-main`, `gallery-side`);
  the `position: relative` dependency for the remaining 5 consumers (`preview`, `upload`, `avatar`
  callers; `gallery-strip`/`lightbox` in `LightboxView.tsx`) is covered only by the I1 declaration
  diff, not a live-DOM check. Named as a limitation, not asserted covered.

## 11. Deviations, limitations, unresolved issues

1. **R1/R7 for the `listing` variant's `hoverClass`/`'group'` pair: BLOCKED, owner decision
   needed.** See §4.
2. **§10.5 coverage limit:** `preview`, `upload`, `avatar`, `gallery-strip`, `lightbox` have no
   rendered proof beyond the I1 declaration diff and the unit-level class-name assertion (§1 R10
   row, §3). `gallery-main`/`gallery-side` were verified against a real live production route
   instead of a story — stronger than Storybook, but not the Q3 Storybook proof path literally
   named in §13.
3. **`check:homepage-grid`'s ability to independently catch the P1 plant is UNTESTED** (attempted,
   timed out) — named, not asserted either way.
4. **`check:design-tokens` exits 1** on this diff, by design (§9) — not a defect to silence.
5. `docs/sessions/evidence/task763/` also contains one-off debug scripts (`debug-hover-*.mjs`,
   `debug-hydration-*.mjs`) used to derive the R7 finding and the hydration-flake attribution;
   retained as evidence per the task's own evidence-path scope, not cleaned up into a single
   polished script.

## 12. Opus handoff

- Evidence root: `docs/sessions/evidence/task763/`. Start with `i1-utility-extraction.md`, then
  `debug-hover-titlearea.mjs`'s output (the load-bearing R7 evidence), then `compare-i2-i4.mjs`'s
  48-delta result and `plants/p1-full-transcript.txt`.
- **Question for Opus/owner:** does the R7 BLOCKED finding (§4) get resolved by (a) accepting the
  1.1025× → 1.05× variance as owner-approved and closing 763 as-is with a follow-up task for
  `MantineListingCardPattern.module.css`'s own de-Tailwind (Phase 2, already filed conceptually in
  the Sprint 63 plan), (b) some other mechanism this session did not consider, or (c) treating this
  as new information that reopens Sprint 63's phase ordering?
- Please independently re-verify the "`ListingCardPattern.stories.tsx` renders `DemoImage`, not
  `AppImage`" finding (§3) — it contradicts the kickoff's own §3.5 fact and reproduces backlog item
  746; if confirmed, 746 itself may need scope-checking against this session's substitution.
- The two `check:design-tokens` CONFLICTs (§9) are a **known** exit-1 state, consistent with A2's
  own instruction — not evidence of an unrun check.

## 13. Backlog update

`docs/backlog.md`'s "Last Session" line and the Sprint 63 registry line were both replaced in place
(net line count unchanged, still 80 — no `BACKLOG LIMIT BREACH`). Detailed narrative lives in this
session log, not the backlog.
