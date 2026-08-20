# Task 752 — REWORK: filter button label centering (Sprint 60)

**Task path:** `tasks/Sprints/Sprint_60_kickoff_prompt_Task_752_REWORK_FilterButtonLabelCentering.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**QA profile:** Q2 Standard UI

## Requirement and acceptance-criteria evidence

| # | Requirement | Status | Evidence |
|---|---|---|---|
| AC1 | `justify` no longer appears in `FilterMultiToggle.tsx` | Met | `git grep -n "justify" src/components/shared/FilterMultiToggle.tsx` → no output, exit code 1 |
| AC2 | Rendered before/after evidence for the vertical branch at 320/390/768/1024/1440, uk@320 mandatory, incl. a wrapping label; centered in "after" | Met | 11/11 vertical-branch cells (320×{en,sq,uk,it}, 390/768/1024×en, 1440×{en,sq,uk,it}) MD5-differ before→after; `320-uk.png` visually confirmed left-aligned→centered. Current production copy never wraps at these widths (measured, not assumed) — a temporary reversible probe with longer real-language labels proved wrap+center, then was removed (see "Implementation validation notes"). Retained at `docs/sessions/evidence/task752R/` |
| AC3 | Horizontal branch byte-identical before/after | Met | 11/11 horizontal-branch cells (same width/locale matrix) MD5-identical before→after |
| AC4 | `typecheck`, `check:design-tokens`, `check:i18n`, `check:mojibake`, `build` exit 0, plus targeted vitest (10 tests) | Met except pre-existing `check:design-tokens` failure, out of scope (below) | See "Validation evidence" |
| AC5 | `git status --porcelain` shows only `FilterMultiToggle.tsx`, optionally the story, the evidence dir, `docs/backlog.md`, this session log, beyond the pre-existing 753/754/755/756 entries | Met | See "Files Changed" |

## Current versus required behavior

**Current (before, Task 752's original code):** `FilterMultiToggle`'s shared `buttons` array carried
`justify="flex-start"` on every `Button`. Invisible on the horizontal (`Group`, intrinsic-width) branch
because the Button root is `display: inline-block` and `justify-content` on that root is inert. Real on
the vertical (`Stack`, full-width) branch — 3 live callers in `ListingsFilters.tsx`'s mobile filters
drawer (Condition, Offer type, Purchase conditions) — where it set `--button-justify: flex-start`,
consumed by the inner element's `justify-content: var(--button-justify, center)`
(`node_modules/@mantine/core/styles/Button.css:125`), moving labels from centered to left-aligned.

**Required (after):** `justify` prop deleted, substituting nothing. `--button-justify` stays unset, CSS
default `center` applies, restoring the exact pre-Task-752 render on both branches. Confirmed
`src/design-system/mantine/theme.ts`'s `Button` override (`:257-325`) does not touch
`--button-justify` or set any competing `justifyContent` on the label/root — only `minHeight`,
`fontWeight`, `height`, conditional `boxShadow`, and the label's `whiteSpace`/`overflow`/`wordBreak`/
`overflowWrap`.

**Negative-flow applicability (from kickoff):**

| Branch | Applicable? | Expected | Result |
|---|---:|---|---|
| Validation/RLS/offline/concurrent writer | No | No form, data or mutation touched | N/A, confirmed no such code path touched |
| Horizontal branch (`FiltersPanel`, 6 call sites) | Yes | Byte-identical before/after | 11/11 MD5 match |
| Long label wrapping to 2 lines (uk/sq @320) | Yes | Both lines centered; `whiteSpace: 'normal'` wrapping is real | Confirmed via reversible probe — real production copy doesn't currently reach 2 lines at any Q2 width, but the mechanism (wrap → both lines centered) is proven with real-language substitute text |
| Selected vs unselected chip (`filled`/`default`) | Yes | Unchanged in both branches | Both variants render in every captured cell (one pre-selected item in the demo state), no variant-specific delta observed |

## Files Changed

| File | Reason |
|---|---|
| `src/components/shared/FilterMultiToggle.tsx` | Deleted `justify="flex-start"` from the shared `Button` in the `buttons` array (line was between `variant=…` and `onClick=…`). No other line touched. |
| `src/stories/mantine/primitives/FilterControls.stories.tsx` | `MultiToggleDemo` now accepts an optional `className` prop, forwarded to `FilterMultiToggle`. Added a second `Stack` block rendering `MultiToggleDemo` with `className="flex-col gap-1.5"` (the vertical branch, previously uncovered by any story) alongside a `Text` label. No other change survives — the temporary wrap-probe function/render block used mid-session was fully removed; restoration verified (see below). |
| `docs/backlog.md` | Task 752 registry row + Last Session line updated in place (net line count unchanged: 80 → 80). |
| `docs/sessions/evidence/task752R/` (new, retained) | Before/after screenshots + MD5 manifests for the vertical branch (AC2), horizontal branch (AC3), and wrap-probe (AC2 wrap requirement), plus a `README.md` explaining the evidence layout. |
| `docs/sessions/2026-08-17-task752R-filter-button-label-centering.md` | This session log. |

No other file in the tree was touched. `PhoneField.tsx`'s `align="stretch"`, the `.flex-wrap` compatibility
anchors, the `className?.includes('flex-col')` branch condition, `role="group"`/`aria-label`, and every
other Task 752 file are unchanged — confirmed by `git diff` showing only the two files above beyond the
pre-existing 753/754/755/756 uncommitted work.

## Validation evidence

All commands run from the repo root on the final (fixed, probe-removed) source tree:

| Command | Result |
|---|---|
| `git grep -n "justify" src/components/shared/FilterMultiToggle.tsx` | No matches, exit 1 (AC1) |
| `npm run typecheck` | exit 0 |
| `npx vitest run src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` | 1 file, 10/10 tests passed, exit 0 |
| `npm run check:i18n` | 2218/2218 keys parity across sq/en/uk/it, 0 raw-enum leaks, exit 0 |
| `npm run check:mojibake` | 0 artifacts in 2854 files, exit 0 |
| `npm run build` | exit 0 (full production build, all routes compiled) |
| `npm run check:design-tokens --strict` | **exit 1** — 3 `css-length` violations + 1 stale-marker, all in `src/design-system/mantine/patterns/MantineCopyIdButton.module.css`. This is Task 756's uncommitted, unreviewed work (confirmed via `git status` — the file was already modified before this session started). Not caused by this rework, not fixed by this rework — reported honestly per the kickoff's explicit instruction not to claim a green gate this task didn't earn. |

Each transcript was redirected unpiped to a scratch log file with `echo "EXIT_CODE=$?"` appended
immediately after, per the evidence-capture rule.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Vertical (mobile drawer) chip label alignment | `FilterMultiToggle.tsx` `Button` (vertical/`Stack` branch) | Mantine `Button` inner element, `--button-justify` custom property | `Button.css:125` `justify-content: var(--button-justify, center)`; prop `justify="flex-start"` set the var, deletion leaves it unset → CSS default `center`. `theme.ts` Button override confirmed not to set a competing value. | Changed (centered, restored) | `docs/sessions/evidence/task752R/vertical-branch/{before,after}/` — 11/11 cells differ; `320-uk.png` visually inspected |
| Horizontal (desktop/tablet `FiltersPanel`) chip label alignment | `FilterMultiToggle.tsx` `Button` (horizontal/`Group` branch) | Button **root** `display: inline-block` (Button.css), where `justify-content` has no effect regardless of the var | Same prop removal, but the consuming declaration lives on an element whose layout mode ignores it | Preserved (byte-identical) | `docs/sessions/evidence/task752R/horizontal-branch-control/{before,after}/` — 11/11 cells match |
| Long-label wrap behavior | `theme.ts` Button `styles().label` | `whiteSpace: 'normal', overflow: 'visible', wordBreak: 'normal', overflowWrap: 'break-word'` (`theme.ts:323`) | Untouched by this rework | Preserved, and its interaction with the centering fix specifically verified via the reversible probe | `docs/sessions/evidence/task752R/wrap-probe/{before,after}.png` |

## Canonical UI decision record

No new visible artifact was introduced. The one-line change removes a prop from an already-canonical
`Button` usage inside the already-canonical `FilterMultiToggle` component; no new style, token, or
component was created. The story addition (`MultiToggleDemo`'s `className` passthrough + a second render
block) reuses the existing canonical `Mantine/Primitives/FilterControls` story and the existing
`FilterMultiToggle`/`MultiToggleDemo` — `reuse`, authorized explicitly by the kickoff's "Scope extension"
section.

## Implementation validation notes

- **Real gap found: current production copy never wraps at any required Q2 width.** `CONDITION_OPTIONS`
  (mirroring the real `CONDITIONS` constant) and the live `OFFER_TYPES`/`PURCHASE_CONDITIONS` labels in
  all four locales were checked (`messages/{en,sq,uk,it}.json`) — none reach 2 lines at 320/390/768/1024/
  1440px in the `FilterControls` story's rendered width (288px inner, matching `MantineStoryShell`'s
  `px="md"` gutter at `<640px`). The kickoff's cited uk string ("Потребує капітального ремонту") no longer
  exists in messages — `condition_needs_repair` was shortened to "Потребує ремонту" by Task 724R, after
  the kickoff's regression measurement was taken.
- **Resolution — reversible probe, not a permanent fixture.** Per the execute-task skill's probe protocol:
  recorded `git hash-object` of the intended-final `FilterControls.stories.tsx` (`10f1237430651e492327a6baacdc053f2610ece8`)
  before adding a temporary `WrapProbeDemo` (real Ukrainian/Albanian sentences, long enough to wrap at
  288px, hardcoded — not part of any locale file since they're not real product copy). Built Storybook
  4 times total (after-fix/probe, before-regression/probe with `justify` temporarily restored, then
  repeated once more after lengthening the probe strings because the first probe length still didn't
  wrap), captured the wrap-probe screenshots, then removed the probe function and its render block
  entirely and re-restored the `justify` deletion. Final `git hash-object` on the story file returned the
  identical `10f1237430651e492327a6baacdc053f2610ece8`, and `git status --porcelain` for that path showed
  only the intended (non-probe) diff. Both captured after the final gate run, per protocol.
- **Scratch tooling:** a temporary Playwright capture script was placed at the project root (required for
  Node ESM module resolution against `node_modules/playwright`) and deleted immediately after use;
  `storybook-static/` build output was also removed. Confirmed absent from final `git status --porcelain`.
- No other defect found. The one-prop deletion behaved exactly as the kickoff's mechanism analysis
  predicted, on both branches, at every captured cell.

## Assumptions, deviations, and limitations

- The vertical-branch story fixture (`MultiToggleDemo`'s `className` prop + second render block) is a
  permanent addition, authorized explicitly by the kickoff's "Scope extension" section — not treated as
  a probe.
- The wrap-probe's synthetic long labels are not real product copy and were never left in the story;
  they existed only in two intermediate, reverted commits-worth of working-tree state during this
  session, never in the final diff.
- `check:design-tokens --strict`'s failure is pre-existing (Task 756, uncommitted) and explicitly called
  out by the kickoff as out of scope — not fixed, not silently passed over.

## Opus handoff

- Diff to inspect: `git diff -- src/components/shared/FilterMultiToggle.tsx src/stories/mantine/primitives/FilterControls.stories.tsx`
- Evidence: `docs/sessions/evidence/task752R/` (`README.md` explains the layout; `manifest-before.json`/
  `manifest-after.json` carry the full MD5 set for both branches across all 11 cells).
- Open item: the wrap-probe used synthetic text because current production copy doesn't wrap at required
  widths — Opus may want to independently confirm this isn't itself a latent issue (labels that never
  wrap could also never need the `whiteSpace: 'normal'` behavior in practice), though that is unchanged,
  pre-existing behavior outside this rework's one-prop scope.
- Confirm the restoration claim independently if desired: `git hash-object src/stories/mantine/primitives/FilterControls.stories.tsx` should return `10f1237430651e492327a6baacdc053f2610ece8`.

## Backlog update

`docs/backlog.md` — Task 752 registry row updated in place to note the REWORK and link both session logs
and the evidence directory; "Last Session" line replaced to lead with 752R. Net line count: 80 → 80 (no
growth, edited existing lines in place). No `BACKLOG LIMIT BREACH` (file is at the ~80-line target, not
over it).
