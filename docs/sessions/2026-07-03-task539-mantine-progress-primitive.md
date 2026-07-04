# Session — Task 539: Canonical `MantineProgress` (progress bar) → TailAdmin conformance

**Date:** 2026-07-03
**Kickoff:** `tasks/Sprints/Sprint_40_kickoff_prompt_Task_539_MantineProgressPrimitive.md`
**Executor:** Sonnet (this session)

## Summary

New canonical `MantineProgress` primitive (`src/design-system/mantine/patterns/MantineProgress.tsx`) —
built directly on Mantine's top-level `<Progress>`, behavioral parity with legacy
`src/components/ui/progress.tsx`. Plus its Storybook proof (`Mantine/Primitives/Progress`, 8 sections).
**Primitive + story ONLY.** Legacy `progress.tsx` has **zero current consumers** (verified via `grep` before
starting) — there is nothing to migrate in any phase; this primitive exists for future use.

## Critical-flow-registry scan

Scanned `docs/critical-flow-registry.md` per the kickoff instruction — this task builds a primitive + story
only and touches **no registry flow**. Confirmed legacy `progress.tsx` has zero consumers (`grep -rn
"from.*ui/progress"` returns nothing outside the component's own file), so there is no existing flow this
task could have disturbed even indirectly.

## STOP-and-ASK #3 — story canvas convention (resolved by inspection, no interrupt needed)

The kickoff explicitly warned: "Progress is non-overlay... match an existing NON-overlay primitive story
(Alert/Pagination)... **if the Mantine proof-path doc and that reference story disagree on
`skipCanvas`/`layout`, STOP and ASK**." Before writing the story, I inspected `Alert.stories.tsx`,
`Pagination.stories.tsx`, AND `Badge.stories.tsx` (three non-overlay reference stories) — **all three**
already use `skipCanvas: true, layout: 'fullscreen'`, identical to every overlay story (`Combobox`, `Popover`,
etc.). Post-Task-536's `MantineStoryShell` unification made this convention uniform across **every**
`Mantine/Primitives/*` story, overlay and non-overlay alike — there is no actual disagreement to STOP-and-ASK
about; the kickoff's concern described a pre-Task-536 state that no longer exists. `Progress.stories.tsx`
follows the same convention (`Progress.stories.tsx:8-12`).

## STOP-and-ASK #1 / #2 — defaulted per kickoff's own pre-authorization

Both explicitly pre-answered by the kickoff itself (no interrupt needed): semantic-color variants
(success/warning/error fill) — **not added**, brand-only per §6; indeterminate/loading mode — **not added**,
numeric `value` required.

## TailAdmin chrome — every value cited, zero invented

Read `node_modules/@mantine/core/styles/Progress.css` directly (not assumed) before deciding what needs
overriding:

- **Track color: zero override needed.** Mantine's own default already sets
  `background-color: var(--mantine-color-gray-2)` on the root — `#e4e7ec`, exactly §6's "track gray-200
  `#e4e7ec`".
- **Fill color: zero override needed.** `ProgressSection`'s default `color` resolves to `theme.primaryColor`,
  which is `'brand'` in this theme (`theme.ts:92`) — exactly §6's "fill brand".
- **Radius: override needed.** Global `defaultRadius` is `'lg'` (8px), not a pill. New
  `theme.components.Progress.defaultProps.radius = 'pill'` (`theme.ts:465`) resolves to `9999px` — the same
  canonical token Badge/Avatar already use for `rounded-full`.
- **Size scale: override needed.** Mantine's own default `sm/md/lg/xl` = 5/8/12/16px — does not match §6's
  required 8/12/16/20px. Implemented via `theme.components.Progress.vars` (`theme.ts:466-474`) — **the first
  `vars`-function usage in this `theme.ts` file** — mapping each size token to the exact §6 px value via the
  `--progress-size` CSS variable Mantine's own root already consumes. Typed explicitly (`MantineTheme`,
  `ProgressProps`, both newly imported) to satisfy `noImplicitAny`.

### Fix found + applied mid-session: fill-section radius (owner-reported)

While reviewing the rendered output, the owner pointed out `.mantine-Progress-section` (the fill) was only
rounded on the START side, square on the END side. Verified via `getComputedStyle`:
`{borderTopLeftRadius:'9999px', borderTopRightRadius:'0px', borderBottomLeftRadius:'9999px',
borderBottomRightRadius:'0px'}`. Root cause: Mantine's own CSS has a `:first-of-type` rule (resets
`border-radius:0` then re-adds only the two START corners) that comes AFTER the `:last-of-type` rule (which
sets the END corners) in source order — at equal `:where()` specificity, later wins. A single-section
Progress (this primitive never renders more than one) matches **both** pseudo-classes simultaneously, so the
END corners always lose. This is a real Mantine default-CSS quirk (intentional for multi-section bars so
adjacent sections tile without double-rounded seams), not something to work around silently.

**Fix:** added `styles: { section: { borderRadius: 'var(--progress-radius)' } }` to the `Progress` theme
block (`theme.ts:479-483`). The owner then asked directly whether this was a canonical token or a hardcode —
confirmed by tracing the chain: `var(--progress-radius)` is the SAME CSS variable Mantine's own root element
already uses for its own border-radius (`Progress.css:33`), set by `ProgressRoot.mjs` via `getRadius(radius)`
resolving the `radius:'pill'` prop through the theme's own `theme.radius.pill` token (`9999px`) — not a new
raw value, a re-application of the existing canonical chain to the section slot. Re-measured after the fix:
all 4 corners `9999px`. Owner visually confirmed the rendered fix (screenshot review) before I moved on.

## Component design

`label`/`valueLabel` render ABOVE the bar via a thin `Stack`+`Group` wrapper (`MantineProgress.tsx:52-69`),
not via `Progress.Root`/`.Section`/`.Label` compound (never needed — this primitive renders exactly one
section) — preserves legacy `progress.tsx`'s exact shape, where `ProgressLabel`/`ProgressValue` are siblings
of the track, not children. `value` is clamped via `Math.min(100, Math.max(0, value))`
(`MantineProgress.tsx:60`).

## a11y — verified in source, not assumed

Read `node_modules/@mantine/core/esm/components/Progress/ProgressSection/ProgressSection.mjs` directly:
confirms it already renders `role="progressbar"` + `aria-valuemax="100"` + `aria-valuemin="0"` +
`aria-valuenow={value}` + `aria-valuetext="${value}%"`, and forwards `aria-label`. This wrapper only decides
WHEN `aria-label` is the bar's sole accessible name (`hasVisibleLabelRow` check, `MantineProgress.tsx:63,71`)
— no extra ARIA wiring needed.

## Manually-verified flows (Playwright, native measurements)

- **Resting/bare** (no visible label): `getComputedStyle` confirmed `rootBg: rgb(228,231,236)` (gray-200),
  `rootRadius: 9999px` (pill), `sectionBg: rgb(236,84,71)` (brand `#EC5447`), `role="progressbar"`,
  `aria-valuenow="45"`, `aria-label="Storage used"` — all exact matches, zero invented values.
- **Label + value**: label left / value right in a row above the bar, both update with `value` —
  screenshot-confirmed.
- **Sizes**: 4 stacked bars at `sm`/`md`/`lg`/`xl`, visibly increasing 8→12→16→20px — screenshot-confirmed.
- **Transition (two static values)**: 20% and 80% fill both render correctly at their respective widths.
- **`value=0`**: empty track, no crash — screenshot-confirmed.
- **`value=100`**: fully filled — screenshot-confirmed.
- **Out-of-range**: `value=150` renders visually identical to `value=100` (clamped, no overflow past the
  track); `value=-30` renders visually identical to `value=0` (clamped) — both screenshot-confirmed.
- **Long uk label at 320**: wraps to 3 lines, value wraps to its own line below (`Group wrap="wrap"`), zero
  h-scroll (`document.documentElement.scrollWidth > clientWidth` = `false`) — confirmed both before AND after
  the radius fix rebuild.
- **Mobile full-width**: track `getBoundingClientRect().width = 288px` at a 320px viewport (= 320 − 32px
  `MantineStoryShell` gutter) — full-width relative to its container, confirmed via direct measurement.
- **SSR-deterministic**: `value` comes entirely from props; no `useEffect`-gated first render, no
  `isMobile`/client-only branch anywhere in `MantineProgress.tsx` — confirmed by reading the file (unlike the
  overlay primitives, there is no hydration caveat here).

## Mobile <640 popup exemption (documented per §7)

Progress is a non-interactive DISPLAY element — not an overlay/popup, not a focusable control. No
bottom-sheet rule, no touch-target rule, no full-width-Button rule applies. Only the full-width-track rule
applies (`w="100%"` on the `Progress` element, `MantineProgress.tsx:73`) and is satisfied at every breakpoint,
confirmed above.

## ⚠️ Deviation from clause 13 (planted-violation proof) — owner-directed, explicitly recorded

A planted violation (`Box miw={900}` wrapping the long-label section, `Progress.stories.tsx`) was prepared
and **pre-verified via an ad-hoc Playwright script to cause real `document.documentElement.scrollWidth`
overflow** (`h-scroll with planted violation (en@375): true`) — confirming the mechanism would work before
committing to a full gate run, per the Task 537 lesson.

**The formal native `screenshots:assert -- --mantine-only` re-run to capture the FAIL transcript was NOT
completed this session.** Sequence of events: an earlier full gate run (started before the owner's radius
report) was corrupted by a race condition — I ran a second `build-storybook` (for the radius-fix check) while
that gate was still reading from the same `storybook-static` directory, producing spurious `loader-only` +
`horizontal overflow` failures on the Progress story and two unrelated Textarea cells. A clean re-run was
started, but was manually backgrounded by the owner, then explicitly ordered killed ("завершай цей процес,
він не потрібний") when a stray process kept port 6008 occupied. When asked directly how to proceed (kill +
one final clean run, vs. accept the ad-hoc Playwright evidence + the owner's own visual review, vs. stop
entirely), **the owner chose to skip the formal native gate run for this task.** The planted violation was
reverted immediately after (`Progress.stories.tsx` — `Box` wrapper + now-unused `Box` import removed), `tsc`
reconfirmed clean.

**What stands in place of the formal gate transcript:** (1) the ad-hoc Playwright pre-verification showing the
plant DOES cause real, detectable overflow (so the mechanism is sound, matching the Task 537/538-established
pattern of "no `ResponsiveBottomSheet` here, so a document-level plant fails cleanly — no gate blind spot
applies to this primitive"); (2) the owner's own direct visual review of the rendered story (radius fix
specifically); (3) every other gate (`tsc`, `check:stories`, `check:i18n`, `check:mojibake`,
`check:design-tokens:strict`, `check:file-integrity`) run clean AFTER reverting the plant, confirming the
final committed state is not the planted-violation state. **This is recorded here plainly as an incomplete
formal proof, not hidden** — a future task or the orchestrator's own review should run
`screenshots:assert -- --mantine-only` once cleanly (no concurrent `build-storybook`) before/at merge to
obtain the missing native transcript.

## Gates (green, final state — `screenshots:assert` full run NOT included, see above)

```
npx tsc --noEmit                     → 0 errors
npm run check:stories                → PASSED, 99 files, 0 violations, storybook.* 517/517 parity
npm run check:i18n                   → PASSED, 4 locales, 2082 keys, parity OK
npm run check:mojibake               → 0 artifacts, 1543 files
npm run check:design-tokens:strict   → 0 violations, 393 files scanned
npm run check:file-integrity         → PASSED, 13 files clean
npm run build-storybook              → built cleanly multiple times during this session, final state confirmed via tsc + check:stories above
```

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | `MantineProgress.tsx` created + exported; parity per §3 | ✅ | `patterns/index.ts` export; value/track+fill/label+value/size scale all implemented, `MantineProgress.tsx:47-77` |
| 2 | TailAdmin chrome cited; zero invented values | ✅ | Track/fill zero-override discovery; radius+size `theme.ts` block; radius-fix chain traced to canonical token; `check:design-tokens:strict` 0 violations |
| 3 | Positive flow §5 steps 1–4 rendered-verified | ✅ | Resting, label+value, 4 sizes, two-value transition — all screenshot-confirmed above |
| 4 | Negative flow §6 every branch has code + evidence | ✅ | `value=0`/`100`/clamp (`Math.min/max`, `MantineProgress.tsx:60`), no-label+aria-label (`hasVisibleLabelRow`, `:63,71`), long-label wrap, SSR-deterministic (no client-only branch) |
| 5 | Mobile <640 gate §7 satisfied; popup exemption documented | ✅ | `w="100%"`; 288px/320px measured; exemption documented above |
| 6 | Story wrapped in `MantineStoryShell`, single `Default`, `storyT()` only, `progress_*` 4× parity; non-overlay canvas; NOT in `MANTINE_OVERLAY_PRIMITIVES` | ✅ | `Progress.stories.tsx`; 3 new keys ×4 locales; `skipCanvas:true` matching non-overlay precedent (STOP-and-ASK #3); `scripts/check-stories-rendered.mjs` untouched this task |
| 7 | All gates green + planted-violation FAIL transcript | ⚠️ **PARTIAL** | All native gates green EXCEPT the formal `screenshots:assert` re-run — owner-directed skip, documented above with the ad-hoc pre-verification evidence in its place |
| 8 | Session log + tracker updated; no git run | ✅ | This file; `mantine-tailadmin-migration-tracker.md` P1.23; zero git commands run |

## File-integrity gate (clause 14)

`check:file-integrity` (git-changed + untracked) → 13 files clean (0 NUL, no BOM, not truncated).

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantineProgress.tsx` | NEW (~75 lines) — the canonical progress-bar primitive. |
| `src/design-system/mantine/patterns/index.ts` | +3 lines — export `MantineProgress` + its type. |
| `src/design-system/mantine/theme.ts` | +23 lines — new `Progress` block (`radius:'pill'` + size-scale `vars` function + `styles.section` radius fix); `ProgressProps` import added. |
| `src/stories/mantine/primitives/Progress.stories.tsx` | NEW (~100 lines) — 8 sections covering every Positive/Negative flow item. |
| `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json` | +3 `progress_*` keys each (12 total) — storage label, upload label, long label. |
| `docs/mantine-tailadmin-migration-tracker.md` | P1.23 row + Batch D summary line updated. |
| `docs/backlog.md` | Last Session + Sprint 40 status updated. |
| `docs/sessions/2026-07-03-task539-mantine-progress-primitive.md` | This file. |
| `docs/sessions/assets/task539/*` | Manual-QA screenshots (desktop, mobile uk@320, radius-fix before/after). |

**Not touched this task:** legacy `src/components/ui/progress.tsx` (stays until Phase 6, unused already);
any consumer (there are none); `Combobox`/`Menu`/`Popover`/`Table` `theme.ts` blocks (verified diff shows
ONLY the new `Progress` block); dark mode; semantic-color variants; indeterminate mode.

**Reverted, not part of this diff:** the planted-violation `Box miw={900}` wrapper (`Progress.stories.tsx`,
reverted after the owner-directed decision to skip the formal gate proof this round);
`docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` (auto-regenerated side
effect of gate commands run this session, restored to HEAD).

**Self-validation:** `tsc=0` · `AC=7/8 green, 1 partial (documented deviation)` · `scope=clean` (git status
matches exactly the Files Changed table above). **`runtime uk@320 PASS` via ad-hoc Playwright measurement,
NOT the formal native `screenshots:assert` transcript** — owner-directed skip this session, follow-up run
recommended before merge (see clause-13 deviation note above).

**Emitting NO `git add`/`git commit`** — no mutating git command was run this session.
