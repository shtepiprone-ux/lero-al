# Task 604 — Verify (and fix if broken) the real-page `ListingCard` hover: elevation + photo zoom on the ACTUAL homepage/grid, not Storybook

**Sprint:** 44 (Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI — real-page rendered verification + conditional fix (single primitive/pattern). **NO redesign.**
**Owner report (2026-07-15):** the hover effect visible in the `Patterns/Mantine/ListingCardPattern` Storybook story
does NOT appear on the live site's cards — "навіть hover ефекту на картках немає." The owner is comparing the real
homepage/`/listings` cards to the story and they don't match.

**Why this task exists (the standing gap):** Task 602 proved the hover ONLY in Storybook (Playwright computed-style
diff against the `ListingCardPattern` Default story). Task 603 rendered the REAL card but only measured favorite-button
geometry — it never checked hover. So the hover on the **real Next.js page** has never been verified. Per this project's
own rendered-evidence rule (`orchestrator-role.md` → "Rendered-evidence approval gate"; agent-contract clause 12), a
Storybook/computed-style proof does NOT close a UI behavior — the real surface must be shown. The owner's real-page
observation takes priority over the Storybook proof.

**Pre-read:** `agent-contract.md`, `backlog.md`, `critical-flow-registry.md`,
`docs/mantine-responsive-design-system.md` (**§18 CSS-cascade/layer pitfalls — central to this task**),
`docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` (clause 16, §5 shadow tokens),
`docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## Step 1 — REPRODUCE on the real page FIRST (do not assume a code bug, do not assume it works)

Drive the live `next dev` server (as Task 603's QA script already does — reuse that harness) and, on **`/{locale}`
(homepage "Останні") AND `/{locale}/listings` (Grid view)**, with a **real desktop pointer context**
(`hasTouch:false`, and explicitly emulate `(hover: hover) and (pointer: fine)` — Playwright: launch without touch, or
`page.emulateMedia` is not enough for pointer; use a desktop context), hover a card and capture `getComputedStyle` of:
- the Mantine `Card` root (`.card`) → `boxShadow` + `transform` before vs during `:hover`,
- the inner `<img>` inside the image section (`.imageSection img`) → `transform` before vs during `:hover`.

Record the before/after values. This tells us definitively whether the effect fires on the real page.

## Step 2 — decide the branch based on Step 1 evidence

**Branch A — the effect DOES fire on a real desktop pointer (values change as in Task 602's Storybook transcript).**
Then there is no code bug; the owner's "no hover" is an environmental artifact. The single most likely cause: the hover
is intentionally gated to `@media (hover: hover) and (pointer: fine)` (so a tap on a phone can't leave a card stuck
zoomed). **Chrome's device/responsive toolbar emulates touch → reports `pointer: coarse` / `hover: none` → the effect
is suppressed by design.** In that case: (a) document this in the session log with the real-desktop computed-style
proof + a device-toolbar-on capture showing it correctly suppressed; (b) STOP-AND-ASK the orchestrator whether the
owner wants the hover to ALSO fire under coarse pointer (which would risk stuck-hover on touch) — do NOT change the
guard unilaterally. No product-code change in Branch A without that owner decision.

**Branch B — the effect does NOT fire on a real desktop pointer** (boxShadow/transform unchanged on `:hover`). Then it
is a genuine real-page bug that the Storybook environment masked. Investigate the actual cause before changing anything.
Leading suspects, in order:
1. **CSS cascade / source order in the Next.js build vs Storybook.** In the real app (`src/app/layout.tsx`),
   `@mantine/core/styles.css` is imported unlayered at the top, then chrome CSS, then `globals.css` (Tailwind layers).
   The `MantineListingCardPattern.module.css` module is unlayered and expected to load AFTER Mantine so `.card` /
   `.card:hover` win. **Verify the ACTUAL loaded-stylesheet order in the built page** (DevTools "Sources"/coverage or
   the emitted CSS bundle) — if the module's `.card` rules load BEFORE Mantine's `.mantine-Card-root`, Mantine's
   resting box-shadow/border win and may visually swamp the hover delta. `.card:hover` (0,2,0) still out-specifies a
   single Mantine class (0,1,0), so a true no-op would more likely be an ordering/`!important`/inline-style issue —
   confirm which.
2. **Inline style or higher-specificity Mantine rule** on the Card root overriding `transform`/`box-shadow`.
3. **`overflow`/stacking**: a parent (`.listing-card--vertical` `<Link>`, the grid, or Mantine `Card` `overflow:hidden`)
   clipping the 2px lift + spilled shadow so the effect is computed but invisible.
The fix must be the minimal, canonical one that makes the real page match the intended §5-cited hover (elevation
`shadow-theme-lg`, `translateY(-2px)`, photo `scale(1.05)`), reusing the existing token citations — **no invented
values**, and still guarded by `prefers-reduced-motion` and `(hover:hover) and (pointer:fine)`. If the correct fix is
ambiguous or would touch more than the pattern/its module, STOP-AND-ASK.

## Also in scope — reconcile "the story styling didn't pull through"

The owner said the real cards don't match the story broadly, hover being the cited symptom. While reproducing, do a
**side-by-side of the real homepage/grid card vs the `ListingCardPattern` Default story** at 1 desktop width + uk@320,
and list any OTHER visible divergence (resting shadow/border, radius, spacing, premium ring). If a divergence is a real
regression, record it; if it's expected (the real card injects `AppImage`/real `FavoriteButton`/footer via slots, which
legitimately differ from the demo fixtures), say so explicitly. Do NOT fix unrelated divergences in this task without
orchestrator sign-off — report them for follow-up routing.

## Files in scope

- **Verification/evidence:** reuse/extend `scripts/task603-qa-favoritebutton.mjs` (or a sibling ad-hoc script) to
  capture the real-page hover computed-style + side-by-side PNGs. Not a CI check.
- **Conditional product change (Branch B only):** `src/design-system/mantine/patterns/MantineListingCardPattern.module.css`
  and/or `MantineListingCardPattern.tsx` — minimal fix so the real page hovers. **Branch A → NO product change**
  (owner decision required first). Do NOT touch `ListingCard.tsx`, `LatestListings.tsx`, `button.tsx`, locale JSON.

## Gates

- **Real-page rendered proof (clause 12) — on the actual Next.js homepage + grid, NOT Storybook.** Before/after
  computed-style transcript for `.card` + `.imageSection img` on a real desktop pointer; device-toolbar/coarse-pointer
  capture showing correct suppression; side-by-side vs the story. uk@320 + ≥1 desktop width mandatory. Persist PNGs +
  manifest under `docs/sessions/2026-07-15-task604-assets/`.
- **If Branch B (a fix lands):** regression coverage proving the hover computes on `(hover:hover)/(pointer:fine)` and is
  `none` under `prefers-reduced-motion` — with a planted-violation FAIL. Reuse the computed-style-diff approach (class
  presence is NOT proof — that's the exact 602 lesson).
- **TailAdmin (clause 16):** any hover shadow stays the §5-cited `shadow-theme-lg`/listing-card tokens; zero invented values.
- **`prefers-reduced-motion` + `(hover:hover)/(pointer:fine)` guards preserved.**
- **File-integrity (clause 14)** clean; `tsc=0`/lint/`check:stories`/`check:i18n`/`check:mojibake` green.
- **No `git add`/`git commit` by Sonnet.** Session log: Files-Changed table + AC self-audit + the real-page evidence +
  the Branch A/B determination.

## Acceptance criteria

1. Real-page reproduction done: before/after computed-style of `.card` + `.imageSection img` on the actual homepage and
   grid, real desktop pointer — Branch A or B stated with evidence. *(transcript + PNGs)*
2. **Branch A:** documented as environmental (device-toolbar coarse-pointer suppression) with a real-desktop capture
   proving the effect fires + a coarse-pointer capture proving intended suppression; STOP-AND-ASK logged for whether to
   change the guard. NO product code changed. **Branch B:** minimal canonical fix lands; real-page after-capture shows
   elevation + photo zoom firing; §5-cited values only; guards preserved; regression + planted-violation FAIL present.
3. Story-vs-real side-by-side captured; any other divergence listed and classified (regression vs expected-slot-diff),
   routed not fixed. *(evidence + list)*
4. Gates green; file-integrity clean; Files-Changed table + AC self-audit in the session log; NO git ops by Sonnet.
   *(transcripts)*
