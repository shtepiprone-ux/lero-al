# Task 589 — Button `default`/`outline`: fix the FULL chrome vars-precedence bug (neutral §6l secondary now actually applies)

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_589_ButtonDefaultOutlineColorVarsPrecedenceFix.md`.
Origin: the side-finding Sonnet root-caused during Task 587. **STOP-AND-ASK resolved (owner 2026-07-13,
mid-session): Option 2 — fix all four discarded vars**, after the mandatory BEFORE-edit probe showed the bug
was bigger than the kickoff's original v1 assumed (see Why).

## Why

Task 587 proved Mantine's `getStyle()` applies `theme.components.Button.styles` **before** the component's
built-in `varsResolver`, so a `styles`-level override of a CSS var the resolver also sets is silently
discarded. The kickoff's v1 assumed only `--button-color` was affected on `outline`/`default`. The **mandatory
BEFORE-edit probe** (isolated `@testing-library/react` + `MantineProvider` render, reading
`button.getAttribute('style')` — same method as Task 587) found **all four** overrides were discarded, not
just one — see the probe table below. `outline` in particular was rendering Mantine's stock
**brand-colored** border+text, not a subtle near-black shift. I stopped and reported this via `AskUserQuestion`
per the kickoff's explicit STOP-AND-ASK clause rather than silently expanding scope; the owner chose to fix
all four vars in this task (rewrote the kickoff to the v2 in-scope contract reflected here) and specified the
hover-var fix and the destructive-safeguard probe row.

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/theme.ts` | `Button` block only. Extended the existing `vars` callback (Task 587) with a second branch: `(variant === 'outline' \|\| variant === 'default') && color === undefined` → sets `--button-bg` (white), `--button-color` (gray-7), `--button-bd` (`1px solid gray-2`), `--button-padding-x` (`1rem`), and `--button-hover` (gray-0, §6l `hover:bg-gray-50`) — the vars merge stage that wins over the built-in resolver. Removed the now-dead `--button-bg`/`--button-color`/`--button-bd`/`--button-padding-x` lines from the `styles` `outline`/`default` branch, leaving only `boxShadow: var(--mantine-shadow-xs)` there (a real CSS property, not a resolver var, so it already applied correctly — confirmed by the probe). Comments updated to cite §6l + the Task 587 precedence root-cause and the `color===undefined` gate. `transparent`/`filled` branches untouched. |

**Not touched:** any other component block, `MobileNavDrawer.tsx`, `Button.stories.tsx`, any locale file, the
border token choice (`gray-2`, a separate pre-existing decision per Out of scope).

## Probe BEFORE table (mandatory pre-edit probe, current `theme.ts` at session start)

Isolated `@testing-library/react` + `MantineProvider` render, reading the root `<button>`'s resolved inline
`style` attribute (throwaway test file, not committed, deleted after use):

| Variant | `--button-bg` | `--button-color` | `--button-bd` | `--button-padding-x` | `box-shadow` |
|---|---|---|---|---|---|
| `default` | `var(--mantine-color-default)` (Mantine stock) | `var(--mantine-color-default-color)` (stock, near-black) | `var(--mantine-color-default-border)` (stock) | `var(--button-padding-x-sm)` (stock) | `var(--mantine-shadow-xs)` ✅ applied |
| `outline` | `transparent` (stock) | `var(--mantine-color-brand-outline)` (**brand-colored**) | `...solid var(--mantine-color-brand-outline)` (**brand border**) | `var(--button-padding-x-sm)` (stock) | `var(--mantine-shadow-xs)` ✅ applied |
| `filled` | `var(--mantine-color-brand-filled)` | `var(--mantine-color-white)` | `solid transparent` | `var(--button-padding-x-sm)` | — (no override attempted) |
| `transparent` | `transparent` | `var(--mantine-color-gray-7)` (Task 587's fix, correctly applied) | `solid transparent` | `var(--button-padding-x-sm)` | — |
| `default` + `color="red"` | same as `default` (Mantine's `default` variant ignores `color` by design) | same as `default` | same as `default` | same as `default` | applied |
| `outline` + `color="brand"` | `transparent` | `var(--mantine-color-brand-outline)` | `...brand-outline` | stock | applied |

**Conclusion:** only `box-shadow` (a real property, not a resolver var) took effect for `outline`/`default`;
all four CSS-var overrides were dead code — confirmed the kickoff's original single-var assumption was
incomplete.

## Probe AFTER table (post-edit, same method)

| Variant | `--button-bg` | `--button-color` | `--button-bd` | `--button-padding-x` | `--button-hover` | `box-shadow` |
|---|---|---|---|---|---|---|
| `default` | `var(--mantine-color-white)` ✅ | `var(--mantine-color-gray-7)` = `rgb(52,64,84)` = `#344054` ✅ | `1px solid var(--mantine-color-gray-2)` ✅ | `1rem` ✅ | `var(--mantine-color-gray-0)` = `#f9fafb` ✅ | `var(--mantine-shadow-xs)` ✅ |
| `outline` | `var(--mantine-color-white)` (now **identical to `default`**, intended — §6l is one reference row) | `var(--mantine-color-gray-7)` | `1px solid var(--mantine-color-gray-2)` | `1rem` | `var(--mantine-color-gray-0)` | `var(--mantine-shadow-xs)` |
| `filled` | byte-identical to BEFORE | byte-identical | byte-identical | byte-identical | (unchanged, `brand-filled-hover`) | — |
| `transparent` | byte-identical to BEFORE | byte-identical (`gray-7`) | byte-identical | byte-identical | (unchanged, `transparent`) | — |
| `default` + `color="red"` | `var(--mantine-color-default)` (unchanged — gate skipped, Mantine's `default` variant still ignores `color`) | `var(--mantine-color-default-color)` | `var(--mantine-color-default-border)` | stock | `var(--mantine-color-default-hover)` | applied |
| `outline` + `color="brand"` | `transparent` (unchanged — gate skipped) | `var(--mantine-color-brand-outline)` | `...brand-outline` | stock | `var(--mantine-color-brand-outline-hover)` | applied |
| `outline` + `color="red"` (destructive safeguard, new probe row) | `transparent` | `var(--mantine-color-red-outline)` | `...red-outline` | stock | `var(--mantine-color-red-outline-hover)` | applied |

**Destructive safeguard confirmed:** `variant="outline" color="red"` resolves fully red (bg/border/text/hover)
— the `color === undefined` gate correctly steps aside for any explicit `color` prop, on both `default` and
`outline`. `filled`/`transparent` are byte-identical before/after — zero blast radius outside the two
targeted variants.

## Positive / Negative flow

- **Positive:** neutral (`color` unset) `default`/`outline` buttons render §6l secondary — white bg,
  gray-700 text, gray-2 border, 16px padding, shadow-xs, hover fills to gray-50 — at every breakpoint/locale
  (verified on the primitive story + a real consumer, see Rendered evidence). Hover repaints correctly (a
  different var value at rest vs hover, not a frozen literal).
- **Negative:** an explicit `color` prop (`red`, `brand`, etc.) on `default`/`outline` is NOT frozen to
  gray-7 — probe rows confirm `outline color="red"` and `outline color="brand"` both resolve their full
  semantic color untouched; `filled`/`transparent` unaffected; disabled `default`/`outline` still dims
  (Mantine's own `[data-disabled]` styling path, untouched by this diff — visually confirmed in the primitive
  story's "disabled" section, `Cancel` button still gray/dimmed); no h-scroll/geometry change anywhere
  (`screenshots:assert` cell count unchanged — this is a pure color/CSS-var change, the geometry gate is
  blind to it by design).

## Rendered evidence (clauses 12/13/16 + §18)

**`screenshots:assert -- --mantine-only` FULL run** (fresh `build-storybook` after this diff, confirmed fresh
via file mtime — `storybook-static/index.html` rebuilt after `theme.ts`'s edit):

- **634/660 PASS, 0 FAIL, 26 AMBIGUOUS** — byte-identical to the Task 588 baseline. Zero new fail/ambiguous
  cells despite this being a global recolor of every `default`/`outline` Button consumer in the app — expected,
  since the geometry/overlap assertion harness is color-blind by design; it does not regress on a pure
  CSS-var recolor.

**🔴 §18/§18.9 human-visual side-by-side** (inspected manually via direct Storybook-iframe screenshots):

- **`Mantine/Primitives/Button` primitive story, en@1280:** the "Default" swatch in the variants row now
  renders dark gray-700 text (previously near-black) on white with the same gray border; the "disabled"
  section's `Cancel` button (also `variant="default"`) still renders visibly dimmed/gray, confirming
  `disabled` styling is unaffected by this diff.
- **Same story, uk@320:** "Стандартний" (Default) swatch renders identically recolored, no h-scroll, no
  clipping, unchanged layout.
- **Real consumer — `FiltersPanel`'s "Reset filters" button** (`variant="default"`, no `color` prop), via
  `Mantine/Primitives/FiltersPanelShell` story:
  - **en@1280:** "Reset filters" renders white bg / gray-700 text / gray-2 border / icon-left — visually
    matches the "Apply filters" button's shape/padding, distinguished only by fill (filled red vs. neutral
    secondary), exactly the intended §6l secondary contrast.
  - **uk@320:** "Скинути фільтри" — same chrome, no clipping, full-width within the filter sheet.
  - **Computed-style proof (headless-Chromium, en@1280):** `getComputedStyle(button)` on the "Reset filters"
    button — `backgroundColor` at rest = `rgb(255, 255, 255)` (white); on `:hover` = `rgb(249, 250, 251)`
    (`#F9FAFB` = exact gray-50 per §6l `hover:bg-gray-50`); `color` = `rgb(52, 64, 84)` (`#344054` = exact
    gray-700). Confirms both the resting chrome AND that hover actually repaints (not frozen — a real, distinct
    value change on `:hover`), on a real consumer surface, not only the primitive story.

## Rendered matrix (clause 12)

| Surface | en@1280 | uk@320 |
|---|---|---|
| `Button` primitive story (Default swatch) | PASS (screenshot reviewed — gray-700, white, gray border) | PASS (screenshot reviewed — "Стандартний", same chrome, no h-scroll) |
| `FiltersPanel` "Reset filters" (real consumer) | PASS (screenshot + computed-style proof — white/gray-700/gray-2/hover-gray-50) | PASS (screenshot reviewed — "Скинути фільтри", same chrome, no clip) |

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `Button.vars` gains the `(outline\|\|default) && color===undefined` branch (bg-white/color-gray-7/bd-gray-2/padding-16px + probed hover-bg gray-0); the four relocated lines removed from `styles`; `boxShadow` stays; `transparent`/`filled` untouched; comment updated | ✅ | diff (theme.ts) |
| 2 | Probe BEFORE/AFTER table proves neutral default+outline now resolve white/gray-7/gray-2/16px/gray-0-hover; `filled`/`transparent` byte-identical | ✅ | probe tables above |
| 3 | Destructive safeguard: `variant="outline" color="red"` still resolves red bg/border/text | ✅ | probe AFTER table, `outline+red` row — bg=transparent, color/bd/hover all `red-outline*` |
| 4 | Rendered side-by-side vs §6l secondary on the primitive story AND ≥1 real consumer; disabled dims; hover=gray-50; `color`-set outline stays semantic | ✅ | screenshots (Button story + FiltersPanelShell) + computed-style hover proof; disabled `Cancel` swatch visually confirmed dimmed |
| 5 | `screenshots:assert -- --mantine-only` FULL run: zero NEW fail/ambiguous vs 634/660/0/26; shifted cells are intended recolors only | ✅ | 634/660 PASS, 0 FAIL, 26 AMBIGUOUS — byte-identical counts (geometry gate is color-blind, so no cell-level shift to inspect — confirmed by design, not by omission) |
| 6 | Gates: tsc=0, eslint, check:stories, check:i18n, check:file-integrity, check:mojibake all green; Files-Changed + AC table + rendered matrix + probe table in log; no git run | ✅ | see Self-validation below |

## Self-validation

`npx tsc --noEmit` = 0 errors. `npx eslint src/design-system/mantine/theme.ts` = clean, no output.
`npm run check:i18n` = PASSED, 2145×4 keys (unchanged — this task touched no locale file).
`npm run check:stories` = PASSED, 115 files / 0 violations; `storybook.*` 566×4 keys (unchanged).
`npm run check:mojibake` = 0 artifacts / 1686 files. `npm run check:file-integrity` = PASSED, 8 changed/
untracked files clean. **`npm run build-storybook`** — rebuilt fresh after the `theme.ts` edit (file-mtime
confirmed: `storybook-static/index.html` postdates `theme.ts`). **`npm run screenshots:assert --
--mantine-only`** (full run) = 634/660 PASS, 0 FAIL, 26 AMBIGUOUS — byte-identical to the Task 588 baseline,
zero regression. Isolated-render probe test file and a headless-Chromium screenshot/hover-probe capture
script were written to throwaway locations (a temp vitest test under `src/design-system/mantine/__tests__/`
and repo-root `.tmp-task589-*` scripts), run, inspected, and deleted after use — `git status --short` confirms
only `src/design-system/mantine/theme.ts` is new/changed from this session (alongside the pre-existing held
Task 587/588 product-code diffs — `MobileNavDrawer.tsx`, `Button.stories.tsx`, the 4 locale files — and the
auto-generated governance-report delta; the Task 587/588/589 kickoffs/session-logs/backlog were already
committed separately as a docs-only commit, `ab23e1277`, before this session — confirmed via `git log`). Git
NOT run by this session (single-writer rule) — Files Changed table above is for the orchestrator/owner to
review before committing.

**Verdict: Task 589 is functionally complete and verified — the mandatory BEFORE-edit probe caught a bug
bigger than originally scoped (all four vars discarded, not one), was correctly escalated via STOP-AND-ASK
rather than silently expanded, and after the owner's Option-2 decision, the fix is proven correct by a
BEFORE/AFTER probe table, a destructive-safeguard probe row, a full rendered-assert run showing zero
regression, and rendered + computed-style evidence on both the primitive story and a real consumer surface.**
