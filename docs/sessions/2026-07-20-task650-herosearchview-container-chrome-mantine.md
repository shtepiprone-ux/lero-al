# Session Archive: Task 650 — HeroSearchView container chrome → Mantine `Box` — 2026-07-20

## Task path and status

`tasks/kickoff_prompt_Task_650_HeroSearchView_Container_Chrome_Mantine.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

Migrated all four remaining raw-Tailwind container `<div>`s in `HeroSearchView.tsx` to Mantine `Box`,
preserving every existing `className` verbatim. **Deviation from the kickoff's literal mapping:** the
kickoff specified container (3) — the search-bar surface — as `Paper`, not `Box`. Rendered computed-style
evidence (below) showed `Paper` breaks pixel parity: `@mantine/core/styles.css` is imported **unlayered**
in `src/app/layout.tsx` (no `@layer mantine` wrapper), so `Paper`'s own component CSS
(`theme.ts` `Paper: { defaultProps: { radius: '2xl' }, styles: { root: { '--mantine-color-default-border': ... } } }`)
wins over the Tailwind utility classes on the element **unconditionally** — unlayered CSS always beats
layered `@layer utilities` regardless of source order or specificity. This is the **same root-cause defect
Task 629 already found and fixed** (via `Button unstyled`) for `HeaderView.tsx`; `Paper` has no `unstyled`
prop (grep-verified, absent from `node_modules/@mantine/core/lib/components/Paper`), so `Box` — which
carries zero component-level defaults in `theme.ts` — is the correct minimal substitute here. All four
containers are `Box`; none is `Paper`. This closes **block D**, completing the homepage → 100% Mantine
chrome migration (blocks A/646, B/648–649, C/647, D/650 all done). Tab toggle intentionally kept as the
styled Mantine `Button` — no `SegmentedControl` conversion (owner decision, out of scope).

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | Containers (1)/(2)/(4) → `Box`; kickoff said (3) → `Paper` | **Deviation:** (3) is also `Box`, not `Paper` — see Summary + Self-review findings. `Box` added to the `@mantine/core` import; `Paper` NOT imported. `git diff` shows all 4 elements + the import line only. |
| R2/AC2 | Rendered hero pixel-identical to legacy, incl. uk@320 + sm 640–767 band × 4 locales | **Pixel-diff proof:** 24-cell (4 locale × 6 width: 320/390/720/768/1024/1440) before/after Playwright capture of `.hero-search`, compared pixel-by-pixel in an offscreen canvas (tolerance ±30 per-channel-sum to allow negligible AA noise) — **0 differing pixels, maxDelta 0, in all 24 cells** with the final `Box`-only implementation. (The first `Paper`-based attempt showed 400–437 differing pixels per cell, localized to the surface's top-left/top-right corners — see Self-review.) |
| R3/AC3 | Tabs/Comboboxes/`MantineCountButton`/Search `Button`/`FiltersPanel`/props/handlers unchanged | `git diff` — only the 4 container tags + import line changed; every control, prop, handler, and child `className` byte-identical |
| R4 | Search/toggle/select/filters/Enter/`hero-search` skeleton hook behave as before | No handler/prop touched (`git diff`); `hero-search` class preserved verbatim on the outer `Box` (line 50) |
| R5 | No i18n/`theme.ts`/`HeroSearch.tsx`/other-file change | `git status --short` — only `HeroSearchView.tsx` (+ this session log + backlog); `check:i18n` unchanged (2206/2206 keys, no delta) |
| R6/AC4 | typecheck/check:stories/check:i18n/check:mojibake + `npm run build` all exit 0 | All 5 green — see Validation evidence (run twice: once against the interim `Paper` draft, again against the final `Box`-only file) |

## Current versus required behavior

**Current (before):** all 4 container elements (outer wrapper, tab strip, search-bar surface, inner control
row) were raw `<div>` with Tailwind classes; the controls inside were already Mantine.

**Required after (implemented):** all 4 containers are Mantine `Box` with the exact same `className`
strings; the hero renders and behaves identically; no control/prop/child changed.

**Applicable negative flows:**

| Branch | Applicable? | Evidence |
|---|---:|---|
| Hero renders (desktop) | Yes | `en-1024`/`en-1440` pixel-diff: 0 differing pixels |
| Mobile uk@320 | Yes | `uk-320` pixel-diff: 0 differing pixels; full-width tabs, squared top-left corner (0px, verified — see below), no overflow |
| sm 640–767 wrap band | Yes | `*-720` pixel-diff (all 4 locales): 0 differing pixels — Search wraps to row 2, Location regains width, unchanged |
| Search/toggle/select/filters/Enter | Yes (regression) | No handler/prop changed in the diff; `MantineCountButton`, `PropertyTypeCombobox`, `LocationCombobox`, `Button`, `FiltersPanel` all byte-identical call sites |
| `hero-search` skeleton hook | Yes | Class preserved verbatim on the outer `Box` — `git diff` line 50 |
| Production build | Yes | `npm run build` exit 0 (see Validation evidence) |
| i18n key change | No — reused existing keys | `check:i18n` unchanged |

## Files Changed

| File | Rationale |
|---|---|
| `src/components/shared/HeroSearchView.tsx` | 4 container `<div>`s → `Box` (all 4, not 3+`Paper` — see deviation); `Box` added to `@mantine/core` import; one code comment added at the search-bar surface documenting the `Paper`→`Box` deviation for future readers |
| `docs/backlog.md` | Concise active-state update — Task 650 → awaiting review, closes homepage block D |
| `docs/sessions/2026-07-20-task650-herosearchview-container-chrome-mantine.md` | This session log |

**Confirmed NOT touched:** `HeroSearch.tsx` (container), `HeroSearchClient.tsx`, `FiltersPanel.tsx`,
`PropertyTypeCombobox.tsx`, `LocationCombobox.tsx`, `MantineCountButton` (pattern), `theme.ts`,
`messages/*.json`.

## Before/after (the four containers)

**Before:**
```tsx
import { Button } from '@mantine/core'
...
<div className="hero-search w-full max-w-3xl mx-auto">
  <div className="flex mb-0"> ... </div>
  <div className="bg-background rounded-b-2xl sm:rounded-tr-2xl border shadow-xl p-3">
    <div className="flex flex-wrap md:flex-nowrap gap-2"> ... </div>
  </div>
</div>
```

**After:**
```tsx
import { Box, Button } from '@mantine/core'
...
<Box className="hero-search w-full max-w-3xl mx-auto">
  <Box className="flex mb-0"> ... </Box>
  <Box className="bg-background rounded-b-2xl sm:rounded-tr-2xl border shadow-xl p-3">
    <Box className="flex flex-wrap md:flex-nowrap gap-2"> ... </Box>
  </Box>
</Box>
```

Every `className` string is byte-identical to before; only the element tag name and the import line
changed.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Outer wrapper width/centering + `hero-search` hook | `<div>` → `Box` | `hero-search w-full max-w-3xl mx-auto` | Tailwind utilities; `Box` has no `theme.ts` component override | Change (tag only) | `git diff`; computed-style/pixel-diff below |
| Tab strip flex row | `<div>` → `Box` | `flex mb-0` | Tailwind utilities; `Box` no override | Change (tag only) | Same |
| Search-bar surface bg/border/shadow/asymmetric radius/padding | `<div>` → `Box` (kickoff said `Paper`) | `bg-background rounded-b-2xl sm:rounded-tr-2xl border shadow-xl p-3` | Tailwind utilities. **`Paper` rejected** — `theme.ts` `Paper: { defaultProps: { radius: '2xl' } }` + unlayered `@mantine/core/styles.css` import (`src/app/layout.tsx:6`) forces `border-radius: 16px` on **all 4 corners** (verified via `getComputedStyle`) and collapses `box-shadow` to `none`, regardless of the Tailwind classes present. `Box` carries no such override, so the verbatim classes resolve exactly as they did on the legacy `div` | **Preserve exactly** — `Box` chosen over `Paper` specifically to preserve this | `getComputedStyle` before: `{top-left:0px, top-right:24px, bottom-left:24px, bottom-right:24px, boxShadow: "...0px 20px 25px -5px, ...0px 8px 10px -6px"}`; with `Paper` (rejected): `{all corners:16px, boxShadow:"none"}`; with final `Box`: identical to before, verified byte-for-byte via 24-cell pixel-diff (0 differing pixels) |
| Inner control row flex-wrap | `<div>` → `Box` | `flex flex-wrap md:flex-nowrap gap-2` | Tailwind utilities; `Box` no override | Change (tag only) | Same |
| Tab `Button`s, Comboboxes, `MantineCountButton`, Search `Button` | Unchanged | N/A | N/A | **Preserve** — out of scope | `git diff` — zero change to these elements |
| `FiltersPanel` | Unchanged | N/A | N/A | **Preserve** — out of scope | `git diff` — zero change |

## Canonical UI decision record

| Visible artifact | Search evidence | Canonical story / source | Decision | Consumed style or token path |
|---|---|---|---|---|
| 4 generic layout containers (wrapper/tab-strip/surface/inner-row) | Inspected `src/components/layout/FooterView.tsx` (Task 629 precedent: server-side `Box`/`Stack`/`Group`/`Flex` with verbatim legacy `className`s, no re-tokenizing); inspected `HeaderView.tsx` session log (Task 629) for the exact unlayered-CSS defect class; checked `src/design-system/mantine/patterns/` — no shared "generic container" pattern exists or is warranted (these are one-off page-specific layout wrappers, not a reusable pattern) | `FooterView.tsx` (`Box` + verbatim `className`, reused directly) | **Reuse** — `Box` is a core Mantine primitive already consumed this exact way elsewhere in the tree; no new component/pattern/token needed | No new token; classes are the existing Tailwind utility chain, unchanged |
| Search-bar surface — `Paper` vs `Box` choice | Verified via `getComputedStyle` inspection (Playwright, both variants) against `theme.ts`'s `Paper` component defaults and `src/app/layout.tsx`'s CSS import order | `theme.ts` (`Paper` defaultProps/styles block) + `src/app/layout.tsx:6` (unlayered `@mantine/core/styles.css` import) + `docs/sessions/2026-07-19-task629-headerview-chrome-mantine-migration.md` (same defect class, prior precedent) | **Deviation from kickoff, verified correct** — `Paper` would silently break the P0 pixel-parity requirement; `Box` is the only option that renders byte-identical, consistent with the Task 629 precedent of routing around this same unlayered-CSS defect | N/A — no token change, `Box` carries the existing Tailwind classes as-is |

No new component, pattern, or token was created. The `Paper`→`Box` substitution is a verified correction to
the kickoff's own snippet (same category as Task 646's `lh` deviation), not an invented architecture change.

## Validation evidence

1. `npm run typecheck` → **0 errors** (run against the final `Box`-only file).
2. `npm run check:stories` → **PASSED — 122 files checked, 0 violations.**
3. `npm run check:i18n` → **PASSED** — 2206/2206 keys across all 4 locales, no delta.
4. `npm run check:mojibake` → **0 artifacts in 1843 files.**
5. `npm run build` → **exit 0** — `✓ Compiled successfully in 70s`; all 40 static pages + all dynamic routes generated; confirmed via explicit `echo EXIT_CODE=$?` after the run.
6. **Rendered proof** — ad-hoc Playwright capture against the running `next dev` server (Turbopack), same no-git-used file-swap pattern as Tasks 621/630/645/646/629: captured `.hero-search` element screenshots at 320/390/720(sm band)/768/1024/1440px × sq/en/uk/it (24 cells) for both the pre-migration `div` version and the final `Box`-only version, then diffed every pair pixel-by-pixel in an offscreen canvas (Chromium, via Playwright `page.evaluate`) with a ±30 per-channel-sum tolerance for anti-aliasing noise. **Result: 0 differing pixels, maxDelta 0, in all 24 cells.** An interim `Paper`-based draft was captured and diffed first and showed a real regression (400–437 differing pixels per cell, localized via a generated diff-heatmap to the surface's top row / left+right corners) — this drove the `Paper`→`Box` correction documented above; the corrected version was then re-captured and re-diffed with the clean 0-pixel result reported here. All screenshots, diff scripts, and the diff-heatmap image were session-scratchpad only and deleted before this report (re-capturable via the pattern described here: `page.locator('.hero-search').screenshot()` per locale/width, canvas pixel-diff via `page.evaluate`).
7. `git status --short` / `git diff --stat` → only `src/components/shared/HeroSearchView.tsx` changed by this task (plus this session log and the `docs/backlog.md` update).

## Self-review findings

- **Real defect found and fixed before completion (not a product regression — a kickoff-snippet correction):**
  the kickoff's mapping table specified `Paper` for container (3). Implementing it literally first, then
  running the mandatory rendered-proof pixel-diff (step 8 of the evidence protocol — "reconcile the visual
  source trace with the rendered proof"), showed a real visual break: `getComputedStyle` on the `Paper`
  version returned `border-top-left-radius: 16px` (should be `0px` — the legacy `div` never rounded that
  corner) and `box-shadow: none` (should retain the `shadow-xl` drop shadow). Root cause: `theme.ts`'s
  `Paper: { defaultProps: { radius: '2xl' } }` combined with `@mantine/core/styles.css` being imported
  **unlayered** in `src/app/layout.tsx:6` (no `@layer mantine` wrapper, contradicting
  `docs/mantine-responsive-design-system.md` §5's "Mantine docs — CSS imports" row, which claims Tailwind
  utilities can override Mantine — they cannot, because unlayered CSS always wins over any `@layer`-wrapped
  CSS regardless of source order). This is the **same defect class Task 629 already discovered and fixed**
  on `HeaderView.tsx` (via `Button unstyled`) — confirmed by reading that session log mid-task. `Paper` has
  no `unstyled` prop (verified absent from `node_modules/@mantine/core/lib/components/Paper`), so `Box`
  (zero component-level defaults in `theme.ts`) was substituted instead. Re-verified with a fresh
  `getComputedStyle` check and a full 24-cell pixel-diff: 0 differing pixels, confirming the fix.
- No other defects found. The remaining 3 containers ((1)/(2)/(4)) needed no correction — `Box` has no
  component-level theme override, so their conversion was a direct, mechanical tag swap with verified 0-pixel
  diff.

## Assumptions, deviations, and limitations

- **`Box` instead of `Paper` for container (3)** (AC1 literal-mapping deviation): the kickoff's own
  "Assumptions and open questions" section anticipated a verified-prop deviation ("if the executor verifies
  a specific prop renders byte-identical, it may use it") but did not anticipate the component itself
  breaking the render. Given AC2 ("pixel-identical to before") is explicitly P0 and the owner's stated
  priority ("keep the look" is called out twice in the kickoff), and given `Paper` is empirically unable to
  satisfy that while `Box` is verified to satisfy it exactly, `Box` was used for all 4 containers. This
  deviates from AC1's literal wording ("(3) is `Paper`") but is the only choice consistent with AC2 and the
  owner's stated priority — flagging prominently for orchestrator confirmation, since it is a component-type
  substitution, not a numeric-value correction (a larger deviation category than Task 646's `lh` fix).
  **This also surfaces a live contradiction in `docs/mantine-responsive-design-system.md` §5** (claims
  Tailwind utilities can override Mantine CSS via layer order; they cannot, because the import is
  unlayered) — Task 629's session log already flagged this same finding on 2026-07-19 without a doc
  correction yet landing; this session is a second independent confirmation. Recommend a Q0 doc-correction
  task to either wrap `@mantine/core/styles.css` in `@layer mantine` (matching the doc's claim) or correct
  the doc to state the actual (unlayered, Mantine-wins) behavior — orchestrator to decide.
- **Reduced rendered-proof width set (320/390/720/768/1024/1440, not the full 14-width Q3 canon):** same
  scope-appropriate reduction precedent as Tasks 621/630/645/646, with the sm-band (720px) and uk@320
  explicitly included per this task's mandatory requirement.
- Pixel-diff tolerance was ±30 per-channel-sum (out of 765 max) to allow negligible sub-pixel AA noise; the
  final result was exactly 0 differing pixels at this tolerance in all 24 cells (not merely "under
  threshold"), so no borderline cases needed manual visual inspection.
- `check:hydration` was not run — not part of this task's Q3 profile/gate list; no new client boundary was
  added (file already `'use client'`), consistent with the Task 646/629 precedent for this class of change.

## Opus handoff

Evidence locations:
- Diff: `src/components/shared/HeroSearchView.tsx` (`git diff`), reproduced in full above.
- Rendered screenshots/diff scripts: captured and diffed this session, then deleted (session-scratchpad
  only) — re-capturable via the Playwright pattern in Validation evidence item 6.

Questions/risks for the reviewer to inspect:
1. **Confirm the `Paper`→`Box` deviation for container (3)** — independently re-verify (e.g. re-run the
   `getComputedStyle` check or the pixel-diff) before approving, since this diverges from AC1's literal
   kickoff wording even though it is required to satisfy AC2 (P0, pixel-identical).
2. **Consider a follow-up Q0 doc-correction task** for `docs/mantine-responsive-design-system.md` §5 —
   this is the second task (after 629) to independently discover that `@mantine/core/styles.css` is
   imported unlayered and Mantine component CSS unconditionally beats Tailwind utility classes, contradicting
   the doc's current claim.
3. Confirm this closes homepage block D and the full homepage → 100% Mantine chrome migration (blocks
   A/646, B/648–649, C/647, D/650 all now implemented).

## Backlog update

See `docs/backlog.md` — concise active-state entry updated for Task 650 (implemented, awaiting review,
closes homepage block D + the doc-correction flag). Full detail lives here per session-log rules.
