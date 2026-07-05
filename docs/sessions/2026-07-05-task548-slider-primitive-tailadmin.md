# Task 548 — Slider/RangeSlider primitive → TailAdmin (Sprint 40 / Epic MM Phase-1 · P1.27)

**Executor: direct execution, no separate orchestrator layer in this session.**

## Summary

New canonical Mantine `Slider` + `RangeSlider` primitives (`theme.ts` overrides + `slider-chrome.css`) +
`Mantine/Primitives/Slider` story. Primitive + story only, zero consumer migration (Phase 2), per the
P1.24/P1.25/P1.26 precedent.

**Step 0 extraction result: negative (honest fallback).** `demo_tailadmin_com.zip` (`css/style.css`,
11,286 lines, fully extracted) has zero hits for `slider`/`range-slider`/`noUiSlider`/`irs-`, and a
whole-archive `grep -iE "slider|range|noui"` returns zero matches. No bundled HTML page has a
`<input type="range">` or any range/slider widget. Per clause 16's honest-negative fallback (same pattern
as §6n Skeleton / §6o Divider), every §6q value reuses an already-cited token/shape — nothing invented:

- **Filled track / thumb accent = brand** — legacy `bg-primary`/`border-ring` both already resolve to this
  project's brand token (`--ring: var(--brand-700)` = `#EC5447`). **ZERO-OVERRIDE**: Mantine's own
  `--slider-color` falls back to `--mantine-primary-color-filled` (`theme.primaryColor='brand'`) when no
  `color` prop is passed — verified against compiled `Slider.css`.
- **Empty track = gray-100 `#f2f4f7`** — the gray token nearest the legacy `bg-muted` (`#F5F5F5`) by RGB
  distance among the three candidates already anchored in `tailadmin-style-reference.md` (gray-100 Δ≈3.7 vs.
  gray-200 Δ≈23.8 vs. gray-300 Δ≈54.5) — a DIFFERENT rule than §6p's zip-cited gray-200, because this value
  has no zip source to trace to. `--slider-track-bg` is not part of Slider's own `varsResolver`; verified via
  `resolve-vars.mjs` that `theme.components.Slider.vars` MERGES with (does not replace) the component's
  internal resolver, so it's still theme-reachable with no `-chrome.css` needed for this value.
- **Track thickness = 4px / thumb = 12px** — legacy `h-1`/`w-1` (4px) + `size-3` (12px) map EXACTLY onto
  Mantine's built-in `size="xs"` preset (`--slider-size-xs: 4px`) + an explicit `thumbSize: 12` — no invented
  pixel value.
- **Radius = pill** — legacy `rounded-full`. `Slider`'s own `defaultProps` set `radius:"xl"`, which (after
  this project's `theme.radius.xl` override to 12px) resolves to a non-pill 12px corner — fixed via
  `defaultProps.radius:'pill'`. `RangeSlider`'s own `defaultProps` do NOT set `radius` at all, so it already
  falls back to the compiled stylesheet's `1000px` default — **zero-override for RangeSlider**, confirmed by
  rendered proof (`sliderRadius: calc(62.5rem * 1)` = 1000px with no `radius` prop set).
- **Focus ring = zero-override** — the thumb renders with `getStyles("thumb", {focusable:true})`, which
  applies Mantine's shared `mantine-focus-auto` class (`theme.focusRing` defaults to `'auto'`), giving a 2px
  solid brand outline on `:focus-visible` out of the box — matches §6e's brand-focus intent.
- **🔴 Disabled — a genuine, provable Mantine divergence, fixed via `slider-chrome.css`.** Verified against
  compiled `Slider.css`: (1) the ROOT element never receives a `disabled`/`data-disabled` attribute at all
  (`SliderRoot.mjs` destructures and discards `disabled`) — `trackContainer`/`track`/`bar`/`thumb` are each
  tagged independently; (2) `.mantine-Slider-thumb:where([data-disabled]) { display: none; }` makes the
  disabled thumb **vanish** rather than dim. Both diverge from §6e's "dim the WHOLE control to ONE uniform
  opacity, track AND thumb together" rule. Fixed by applying `opacity: 0.5` to ONLY the outermost
  disabled-tagged part (`trackContainer` — track/bar/thumb are its DOM descendants, so the dim cascades ONCE,
  never stacked) and restoring the thumb's `display` so it stays visible-but-dimmed.
- **Marks — not implemented.** No §6q mark chrome exists to cite (honest-negative), per the kickoff's own
  conditional.
- **Horizontal-only confirmed acceptable** — zero consumers of the legacy component (re-confirmed below), so
  no vertical-mode need exists. No STOP-AND-ASK trigger.

Full record: `docs/tailadmin-style-reference.md` §6q.

## Rendered proof (Playwright against the built story, `getComputedStyle`)

```
single   — trackBg: #f2f4f7 (gray-100) | radius: 9999px (pill) | thumbSize: 12px
           | thumbBorderColor: rgb(236,84,71) (#EC5447 brand) | barBg (filled): rgb(236,84,71)
range    — trackBg: #f2f4f7 (gray-100) | radius: calc(62.5rem*1) = 1000px (RangeSlider zero-override)
           | thumbSize: 12px | barBg: rgb(236,84,71) (brand)
disabled — trackContainer opacity: 0.5 | thumb display: "flex" (restored, not vanished)
           | barBg: rgb(102,112,133) (#667085 gray-500 — Mantine's own disabled-color swap, dimmed
           further by the parent opacity, never stacked)
```

**Loader-allowlist: verified NOT needed** (same empirical discipline as Tasks 544/545/546, not copied
forward). Native gate run summary: `loaderOnly: 0` across all 16 Slider cells. `LOADER_ALLOWLIST` UNCHANGED.
Documented in `storybook-governance.md` §14.9.16.

**i18n** — every visible caption in the story is `storyT`-driven against `storybook.mantine.*` with full
sq/en/uk/it parity (3 new keys: `slider_single_caption`, `slider_range_caption`, `slider_disabled_caption`),
2096→2096 keys (4-locale parity check passed, `check:i18n` confirms 2096 keys in all 4 locales after the
`storybook.*` Check 6 also confirmed 531-key parity for the sub-namespace).

**Story states:** (1) single — `Slider defaultValue={40}`; (2) range — `RangeSlider defaultValue={[20,70]}`,
filled band between the two thumbs; (3) disabled — `Slider defaultValue={60} disabled`, whole-control dim
verified on both track and thumb. No marks variant (honest-negative, no §6q mark chrome to cite).

## Consumer audit (expected zero — confirmed)

`grep -rl "@/components/ui/slider" src` (and project-wide, not just `src`) → **0 consumers.** A broader
`grep -rn "\bSlider\b|\bRangeSlider\b"` across `src/**/*.{ts,tsx}` returns only `theme.ts`, the new story, and
the untouched legacy `src/components/ui/slider.tsx` — no other primitive or pattern imports raw Mantine
`Slider`/`RangeSlider`, so there is no regression surface to check (unlike ScrollArea/Tabs, which had existing
raw-Mantine consumers to verify against the new theme defaults).

## Mobile <640 full-width gate (clause 11)

Slider/RangeSlider root render at their container's full width by default (no fixed px). Native gate confirms
`noHorizontalOverflow: true` and `fullWidthControlsAtMobile: true` on all 12 mobile cells (3 breakpoints × 4
locales), zero document h-scroll. **Thumb touch-target compact-control exemption (clause 11):** the 12px
visible thumb is smaller than 44px — documented exemption, same class as the legacy `after:-inset-2` expanded
hit-box precedent; Mantine's own thumb hit area is the full 12×12 visible box (no expanded invisible hit
region was added, since no consumer exists yet to demonstrate a real tap-precision problem — Phase 2 territory
if a consumer surfaces one). Long uk/it captions wrap via the story's `Text` (no fixed width, `Stack` layout).

## Gates

```
npx tsc --noEmit                     → 0 errors
npm run check:stories                → PASSED, 103 files, 0 violations
npm run check:i18n                   → PASSED, 4 locales, 2096 keys
npm run check:mojibake               → 0 artifacts, 1574 files
npm run check:design-tokens --strict → 0 violations, 396 files scanned
npm run check:file-integrity         → PASSED, 10 files clean
npm run build-storybook              → built clean (3x: initial, planted, reverted)
npm run screenshots:assert -- --mantine-only → 446/464 PASS, 0 FAIL, 18 AMBIGUOUS (pre-existing
                                        Combobox/Drawer/Tabs ambiguous-overlap/offscreen set, unchanged,
                                        unrelated to Slider)
```

## Planted-violation transcript (AC5)

Planted `<div data-testid="task548-planted-overflow" style={{width:900, height:12}} />` at the top of the
story (temporary). Full native gate:

```
Results: 446/464 total, 434 PASS, 12 FAIL, 18 AMBIGUOUS
❌ Failed cells (manifest-verified):
  Mantine/Primitives/Slider/Default × {sq,en,uk,it} × {mobile-320,mobile-375,mobile-390}
    ✗ noHorizontalOverflow: false (document-level h-scroll)
```

Exactly the expected 12 cells; desktop-1024 correctly unaffected (900px div doesn't overflow at 1024px).
Reverted (`grep -n "task548-planted"` → 0 matches), rebuilt, reconfirmed green: **446/464 PASS, 0 FAIL, 18
AMBIGUOUS** — byte-identical summary to the pre-plant baseline (`{"total":464,"passed":446,"failed":0,...,
"ambiguousOnly":18,...}`).

## Regression (clause 15)

`grep -in slider docs/critical-flow-registry.md` → 0 matches, no registered critical flow touched.
Theme-only + new-file change scoped to `Slider`/`RangeSlider`; no other primitive's `theme.ts` block, story,
or `globals.css` modified.

## Files Changed

| File | Change | Why |
|---|---|---|
| `src/design-system/mantine/theme.ts` | New `Slider: { defaultProps, vars }` + `RangeSlider: { defaultProps, vars }` blocks + rationale comment | Fixes the one reachable §6q divergence (empty-track color) + the built-in-preset track/thumb sizing + Slider's non-pill radius default |
| `src/design-system/mantine/slider-chrome.css` | New file — disabled whole-control dim (trackContainer opacity) + thumb display restore | Mantine's own disabled treatment is independently-tagged parts + a hidden thumb, not reachable via `vars`/`defaultProps` (§6q) |
| `src/app/layout.tsx` | Import `slider-chrome.css` after `scrollarea-chrome.css` | Wires the chrome file into the app (source-order override) |
| `.storybook/preview.tsx` | Import `slider-chrome.css` after `scrollarea-chrome.css` | Wires the chrome file into Storybook (same source-order override) |
| `src/stories/mantine/primitives/Slider.stories.tsx` | New file — `Default` story: single/range/disabled states | Required rendered-proof surface, AC2 |
| `messages/en.json`, `sq.json`, `uk.json`, `it.json` | 3 new `storybook.mantine.slider_*` keys each | i18n parity for the story's visible content |
| `docs/tailadmin-style-reference.md` | New `## 6q.` section | Step 0 extraction record + mechanism decisions, AC1 |
| `docs/storybook-governance.md` | New `§14.9.16` | Records the verified "no loader-allowlist needed" finding + rendered §6q proof (AC3) |
| `docs/mantine-tailadmin-migration-tracker.md` | P1.27 row updated ⬜ → 🟡 Task 548; Phase-1 remaining-list updated | Tracker accuracy |
| `docs/backlog.md` | Last Session + Task 548 status line updated | Tidy rule |
| `docs/backlog-archive.md` | Task 547's prior Last-Session entry archived (1 row, top) | Tidy rule |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | Auto-regenerated by `screenshots:assert` (final clean run) | Standing auto-generated artifact |

No product/consumer file touched (zero consumers exist for `slider.tsx`, confirmed above).

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | New §6q row extracted FIRST, honest-negative declared, mechanism decision recorded, every value cited | ✅ | `tailadmin-style-reference.md` §6q — whole-archive grep confirms zero zip source; every value traces to an already-cited legacy/§6e/Mantine-default token |
| 2 | `theme.ts` handling + story (single/range/disabled, `storyT` i18n parity) render matching §6q at ≥640/320 × 4 locales, no document h-scroll; disabled dims track AND thumb together (verified); horizontal-only confirmed acceptable | ✅ | `defaultProps`/`vars` blocks + `slider-chrome.css`; rendered proof above; native gate 16/16 Slider cells PASS; zero consumers → no vertical need |
| 3 | `LOADER_ALLOWLIST` verified empirically — UNCHANGED, no assumption copied forward | ✅ | §14.9.16 — `loaderOnly:0` across all 16 cells, verified via the native gate run, not assumed |
| 4 | Consumer audit in session log (expect zero; migrate zero); no other primitive regressed | ✅ | 0 consumers of legacy `slider.tsx` (project-wide grep); no other raw-Mantine `Slider`/`RangeSlider` consumer exists to regress |
| 5 | Rendered `--assert` matrix + planted-violation transcript; all light gates green | ✅ | Both transcripts above; all 6 light gates green |
| 6 | Session log: Files-Changed, AC self-audit, `Self-validation:` line; no git run | ✅ | This file; no `git` command executed |

## Self-validation

Self-validation: all 6 ACs met with rendered-gate evidence. Step 0 extraction was a genuine honest-negative
(whole-archive `grep -iE "slider|range|noui"` on the zip returns zero matches, not just a stylesheet-only
check) — every §6q value traces to an already-cited legacy CSS variable, a §6e convention, or a Mantine
built-in default/preset, zero invented color/px/radius. The empty-track color (gray-100) is a genuinely
different token than §6p ScrollArea's gray-200 because it has no zip source — resolved via the kickoff's own
explicit "nearest to legacy `bg-muted`" instruction, backed by an RGB-distance calculation, not a guess. The
disabled-state finding (Mantine hides the thumb entirely rather than dimming it, and tags four DOM parts
independently rather than a single root toggle) was verified against the compiled `Slider.css`/`SliderRoot.mjs`
source, not assumed, and fixed with a single-ancestor opacity override that provably avoids the "stacking two
opacities" failure pattern §6e/§6f/§6g/§6h warn about — confirmed via rendered `getComputedStyle`
(`trackContainerOpacity: "0.5"`, `thumbDisplay: "flex"`). The `theme.components.Slider.vars` merge-not-replace
mechanism was verified by reading `resolve-vars.mjs` directly, not assumed from the Progress precedent.
Planted-violation transcript proves the gate still catches a real document-overflow defect on this surface
(12/12 expected cells FAILed, desktop-1024 correctly unaffected, reverted to a byte-identical baseline). Final
native gate: 446/464 PASS, 0 FAIL, 18 AMBIGUOUS (identical to the pre-existing baseline — Combobox/Drawer/Tabs,
unrelated to this task). Zero product/consumer file touched; zero other primitive regressed.
**HELD — no git commands run; awaiting review + explicit-path commit emission.**
