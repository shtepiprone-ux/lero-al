# Task 589 — Button `default`/`outline`: fix the FULL chrome vars-precedence bug (neutral §6l secondary now actually applies)

**Sprint:** 44 (Header → Mantine + presentational split — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI — theme/styling fix (product code: `theme.ts` only). **Owner-directed 2026-07-13.**
**Origin:** the side-finding Sonnet root-caused during Task 587; the BEFORE-edit probe (below) then showed the bug is
bigger than one var. **STOP-AND-ASK RESOLVED (owner 2026-07-13): Option 2 — fix ALL FOUR discarded vars.**

## Why (updated after the probe)

Task 587 proved Mantine's `getStyle()` applies `theme.components.Button.styles` **before** the component's built-in
`varsResolver`, so any `styles`-level override of a CSS var the resolver also sets is silently discarded. The
mandatory BEFORE-edit probe on the current `outline`/`default` `styles` branch ("Task 527 fix #6") found that **all
four** var overrides are discarded — only `box-shadow` (a real property, not a resolver var) applies:

| Variant | `--button-bg` (intended → **actual**) | `--button-color` | `--button-bd` | `--button-padding-x` | box-shadow |
|---|---|---|---|---|---|
| **default** | white → **`--mantine-color-default` (stock)** | gray-7 → **`default-color` (near-black)** | gray-2 → **`default-border` (stock)** | 16px → **`padding-x-sm` (stock)** | ✅ xs applied |
| **outline** | white → **transparent (stock)** | gray-7 → **`brand-outline` (brand!)** | gray-2 → **`brand-outline` (brand border!)** | 16px → **stock** | ✅ xs applied |

So the documented TailAdmin **§6l secondary** chrome (white bg · gray-700 text · gray border · 16px pad ·
shadow-xs) **never actually applied**. `outline` especially renders Mantine's **brand-colored** border+text — a real
visible defect, not a subtle shift. Fix: move all four overrides into the existing `Button.vars` callback (the merge
stage that wins over the built-in resolver — Task 587's proven technique), gated so an explicit `color` prop still
wins. Owner accepts this **visibly re-skins every neutral Mantine outline/default button brand→neutral gray** (their
decision, 2026-07-13).

## Pre-read (rule-index → UI / layout / component task)

- `docs/agent-contract.md` (clauses **1, 12, 16**) + `docs/backlog.md` + `docs/critical-flow-registry.md`
  (Button chrome is presentational — touches NO registry flow; confirm and state).
- 🔴 `docs/mantine-responsive-design-system.md` — **§18** theming/CSS pitfalls (the `styles`-vs-`vars` precedence
  lesson in the Task 587 Button comment) + the §18 rule that **state selectors** (`:hover`, `:disabled`) cannot live
  in inline `styles`/`vars` **but a hover VAR (`--button-hover*`) can** be set via `vars`.
- 🔴 `docs/tailadmin-style-reference.md` — **§6a "Button (secondary\\outline)" + §6l Buttons secondary**: authoritative
  neutral secondary = `border bg-white text-gray-700 hover:bg-gray-50 shadow-theme-xs`, radius 8, ≥44px. Text target
  gray-700 `#344054`; hover bg gray-50 (`#f9fafb` = theme `gray.0`). (The border token stays the theme's existing
  `gray-2`, a pre-existing decision — do NOT switch it to §6l's gray-300 in this task; see Out of scope.)
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
- Reference: `src/design-system/mantine/theme.ts` Button block — the `vars` callback (Task 587) + the `styles`
  `outline`/`default` branch you are relocating.

## Files in scope

1. `src/design-system/mantine/theme.ts` — **Button block ONLY.** Relocate the `outline`/`default` neutral-chrome vars
   from `styles` into `Button.vars`, add the hover var, gate on `color === undefined`.

**MUST NOT touch:** any other component block; the `transparent` branch (Task 587 — correct); `minHeight`,
`fontWeight`, `height`, `label` (real CSS props — stay in `styles`, they apply); `boxShadow` (applies — leave in
`styles`); the border TOKEN choice (`gray-2`). No other file.

## Exact change

In `Button.vars`, extend the callback (keep the Task 587 `transparent` branch untouched) so that for
`(props.variant === 'outline' || props.variant === 'default') && props.color === undefined`:

- `'--button-bg': 'var(--mantine-color-white)'` — §6l bg-white
- `'--button-color': 'var(--mantine-color-gray-7)'` — §6l text gray-700 (#344054)
- `'--button-bd': '1px solid var(--mantine-color-gray-2)'` — §6l border (existing token)
- `'--button-padding-x': '1rem'` — §6l px-4 / 16px
- **hover:** set the hover-background var to §6l gray-50 via `vars` (e.g. `'--button-hover':
  'var(--mantine-color-gray-0)'`) — PROBE the exact Mantine var name for the default/outline hover background and set
  THAT (do not guess; Mantine's own `:hover` rule reads it, so a var is legal in `vars` — §18). Confirm via the AFTER
  probe that hover still repaints (not frozen) and resolves to gray-0.

Then **remove** the now-relocated `--button-bg`/`--button-color`/`--button-bd`/`--button-padding-x` lines from the
`styles` `outline`/`default` branch (leave `boxShadow` there). Update the code comment to cite §6l + the Task 587
precedence root-cause and note the `color===undefined` gate.

## 🔴 Destructive/colored-outline safeguard (critical — do NOT regress)

The neutral chrome MUST be gated on `props.color === undefined`. Consumers that pass an explicit `color` on an
outline/default button (e.g. `variant="outline" color="red"` destructive actions in admin managers) must KEEP their
semantic color — the gate ensures Mantine's own `variantColorResolver` still yields red bg/border/text for those.
Add a probe row for `variant="outline" color="red"` proving bg/border/text stay red AFTER the change.

## Current behavior to PRESERVE / required after-behavior

- **Preserve:** `filled`/`transparent` untouched; `boxShadow`, `minHeight`(44px), `fontWeight`, label-wrap unchanged;
  an explicit `color` on default/outline still wins (bg/border/text stay that color); disabled still dims; hover still
  repaints.
- **After:** a *neutral* (no `color`) `default`/`outline` button renders §6l secondary — white bg, gray-700 text,
  gray-2 border, 16px pad, shadow-xs, hover bg gray-50. **Note:** neutral `default` and neutral `outline` will now
  look identical (both = §6l secondary) — this is intended per the single §6l "secondary\\outline" row; call it out in
  the log.

## Rendered evidence (clauses 12/13/16 + §18) — REQUIRED to close

- **Probe BEFORE/AFTER table** in the session log for `default`, `outline`, and `outline color="red"`: every var's
  resolved value before vs after. Expect neutral default/outline: bg→white, color→`rgb(52,64,84)`, bd→gray-2,
  pad→16px, hover→gray-0; `color="red"` row stays red; `filled`/`transparent` byte-identical.
- **`npm run screenshots:assert -- --mantine-only` FULL run** — this is a GLOBAL recolor (Note 14). Paste before/after
  counts; confirm zero NEW fail/ambiguous vs the Task 588 baseline (634/660/0/26). Every shifted Button cell must be
  an intended brand→neutral recolor, NOT a geometry/layout regression — spot-check the shifted stories.
- 🔴 **§18/§18.9 human-visual side-by-side** at one desktop width + `uk@320`: a neutral `outline` button BEFORE
  (brand border+text) vs AFTER (white/gray-700/gray border); a `default` BEFORE (near-black text) vs AFTER
  (gray-700); a `color="red"` outline STILL red; disabled still dims (label+control); hover shows gray-50 fill.
  Include at least one real consumer surface (an admin manager or a listings form outline button), not only the
  primitive story.

## Acceptance criteria (each verifiable in the diff + rendered evidence)

1. `Button.vars` gains the `(outline||default) && color===undefined` branch setting `--button-bg`(white)/
   `--button-color`(gray-7)/`--button-bd`(gray-2)/`--button-padding-x`(16px) + the probed hover-bg var (gray-0); the
   four relocated lines are REMOVED from the `styles` branch; `boxShadow` stays; `transparent`/`filled` untouched;
   comment updated with §6l + precedence citation. *(diff)*
2. Probe BEFORE/AFTER table proves neutral default+outline now resolve white/gray-7/gray-2/16px/gray-0-hover;
   `filled`/`transparent` byte-identical. *(session log)*
3. Destructive safeguard: `variant="outline" color="red"` still resolves red bg/border/text (gate verified in diff +
   a probe row). *(diff + probe)*
4. Rendered side-by-side vs §6l secondary on the primitive story AND ≥1 real consumer; disabled dims; hover = gray-50;
   `color`-set outline stays semantic. *(clause 16, rendered)*
5. `screenshots:assert -- --mantine-only` FULL run: zero NEW fail/ambiguous vs 634/660/0/26; shifted cells are
   intended recolors only. *(rendered)*
6. Gates: `tsc=0`, `eslint`, `check:stories`, `check:i18n`, `check:file-integrity`, `check:mojibake` all green;
   Files-Changed table + AC-by-AC self-audit + rendered matrix + probe table in the session log. **Do NOT run
   `git add`/`git commit` — HELD for orchestrator review.** *(transcript)*

## Out of scope

The secondary border token (`gray-2` vs §6l's `gray-3`) — separate pre-existing decision, do NOT change; report if
noticed. `filled`/`transparent`. Any non-Button component. Adding/removing any consumer. Changing any button that
passes an explicit `color` (the gate must leave those exactly as today).
