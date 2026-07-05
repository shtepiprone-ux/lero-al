# Task 548 — Slider primitive → TailAdmin (Phase 1 · P1.27)

> **Sprint 40 / Epic MM — Phase 1 primitive slice. Owner P0, agent-contract clause 16.**
> **Executor:** Sonnet 4.6. **Type:** UI / Mantine primitive slice (theme defaults + thin wrapper only if a real
> behavior gap appears + story + rendered proof). Follows the P1.24 (Skeleton) / P1.25 (Separator) / P1.26 (ScrollArea)
> precedent: **primitive + story ONLY, zero consumer migration** (that is Phase 2). **Status:** OPEN.
> Tracker row: `docs/mantine-tailadmin-migration-tracker.md` P1.27 (`slider.tsx` → Mantine `Slider`/`RangeSlider`, ref §6/§6q).

## Scope

Build the canonical Mantine `Slider` (and `RangeSlider` for the two-thumb case) primitive — the Mantine equivalent of the
legacy `src/components/ui/slider.tsx` — styled to the TailAdmin form-control look, plus a `Mantine/Primitives/Slider`
story with rendered proof. Do NOT migrate any consumer; do NOT touch other primitives; do NOT touch shared tokens or any
`*-chrome.css` beyond (at most) a new scoped `slider-chrome.css` if — and only if — Step 0 proves the values can't be set
via theme.

**Legacy contract to preserve** (`src/components/ui/slider.tsx`, Base-UI `Slider`):
- Supports BOTH single-value and range (multi-thumb) — the legacy code renders one thumb per value in `_values`
  (`value`/`defaultValue` array → range). The Mantine equivalent is `Slider` (single) + `RangeSlider` (two-thumb).
- `min=0`, `max=100` defaults; horizontal full-width (`data-horizontal:w-full`); vertical supported (`min-h-40`).
- Track: `rounded-full bg-muted`, horizontal thickness `h-1` (4px) / vertical `w-1`.
- Indicator (the filled/selected range): `bg-primary`.
- Thumb: `size-3` (12px), `rounded-full`, `border border-ring`, `bg-white`, focus/hover/active ring
  (`ring-ring/50` → `ring-3`), `disabled:opacity-50` on the whole control.
- `touch-none select-none`.

Mantine `Slider` (props incl. `min`/`max`/`step`/`marks`/`label`/`color`/`size`/`radius`/`thumbSize`/`value`/
`defaultValue`/`disabled`/`inverted`/`scale`) and `RangeSlider` are a strict superset — **prefer importing the Mantine
primitives directly** (like Skeleton/Divider/ScrollArea did), NO wrapper, unless a real behavior gap appears. **If a gap
appears (e.g. vertical orientation — Mantine `Slider` is horizontal-only; confirm whether any target consumer needs
vertical before adding anything), STOP and ASK before adding a wrapper or extending scope.** Current expectation: no
consumer needs vertical (see the consumer audit — zero importers), so horizontal-only is acceptable; state it explicitly.

## 🔴 Step 0 — EXTRACT the reference FIRST (clause 16 — no invented values)

There is **no authoritative Slider/range §-row yet** in `docs/tailadmin-style-reference.md` (grep-confirmed). Before
writing any code, extract TailAdmin's slider/range chrome from `demo_tailadmin_com.zip` (`css/style.css` + any
`range`/`slider`/`noUiSlider`/`.range-good`-style markup in its HTML pages) into a NEW `docs/tailadmin-style-reference.md
§6q` row:
- **Filled (selected) track color** — which brand/gray token. Brand stays `#EC5447` (project override) — confirm whether
  TailAdmin's slider fill is brand or a gray/semantic token, and cite the exact class / `css/style.css` line.
- **Empty (unfilled) track color** — a gray ramp token (candidates already anchored in the doc: gray-100 `#f2f4f7`,
  gray-200 `#e4e7ec`, gray-300 `#d0d5dd`). Confirm from the zip; do NOT assume.
- **Track thickness** + **radius** (legacy is 4px `rounded-full` — confirm TailAdmin's value; cite it).
- **Thumb** — size (px), fill color, border color/width, radius, and the **focus ring** (the project control-chrome
  convention is `focus:ring-brand-500/10 focus:ring-3` per §6e — confirm the slider thumb follows it or cite the zip's
  own value).
- **Disabled** — how the whole control dims (legacy = whole-control `opacity-50`; §6e/§6f/§6g/§6h rule is: dim the WHOLE
  control uniformly, never stack two opacities, and the dim MUST reach the thumb + track together — see the §6e/§6f
  "verifying only the track is a review failure" warning). Record the disabled treatment in §6q.

- **🔴 Honest-negative fallback (expected here):** the zip likely has **no dedicated range-slider component** (grep of
  `demo_tailadmin_com.zip` for `slider`/`range`/`noui` returned nothing at kickoff time). If confirmed, do NOT invent —
  extract from the closest cited source-of-truth values and SAY SO explicitly in §6q, exactly as §6n (Skeleton) and §6o
  (Separator) did for their honest-negative fallbacks: filled track/thumb-accent = brand `#EC5447`; empty track = the
  gray token nearest the legacy `bg-muted`; thumb chrome + focus ring = the §6e form-control control-chrome convention;
  disabled = the §6e whole-control dim. Every value still traces to a cited anchor — zero invented color/px/radius.

- **🔴 Mechanism (resolve in Step 0, record in §6q):** determine whether the §6q values are reachable via
  `theme.components.Slider` / `theme.components.RangeSlider` (`defaultProps.color`/`size`/`radius`/`thumbSize` +
  `styles`/`vars` or the `--slider-*` CSS vars for track/thumb/mark colors) — try theme FIRST
  (`mantine-responsive-design-system.md` §18 + the Skeleton/Divider/ScrollArea precedent). Only fall back to a scoped
  `slider-chrome.css` if you PROVE a needed value can't be set via theme (document the proof against Mantine's compiled
  `Slider.mjs` + `Slider.module.css`, exactly as Task 545 §14.9.13 did for Divider and Task 546 did for ScrollArea).
  Record the finding in `docs/storybook-governance.md §14.9.16`.

Every value in the implementation must trace to that new §6q row — zero invented color/px/radius.

## Required after-behavior

- **`theme.ts` `Slider` (+ `RangeSlider`) handling per §6q, `var(--mantine-*)` tokens only.** Set the filled-track/thumb
  accent to brand, the empty track to the §6q gray, thumb size/border/radius, and the focus ring — via
  `theme.components.Slider`/`RangeSlider` (`defaultProps` + `styles`/`vars`), or a scoped `slider-chrome.css` ONLY with
  proof (per Step 0). Do NOT re-implement geometry Mantine already gives correctly (drag, keyboard step, label bubble);
  document any zero-override decision like Progress/Skeleton/Divider/ScrollArea did. **Mantine `Slider` is horizontal-only
  — if the legacy vertical mode is needed by any consumer, STOP and ASK; do not silently drop or silently re-implement it.**
- **`Mantine/Primitives/Slider` story** (`skipCanvas: true` + `layout: 'fullscreen'`, `MantineStoryShell`): show the states
  as static, determinate renders matching §6q —
  1. **single** — a `Slider` at a fixed mid value (e.g. 40) showing empty track + filled portion + thumb;
  2. **range** — a `RangeSlider` with two thumbs (e.g. [20, 70]) showing the filled band between them;
  3. **disabled** — a `Slider` with `disabled` showing the §6q whole-control dim (track AND thumb dim together — verify
     the thumb dims, not just the track, per the §6e/§6f warning);
  4. **with marks** (optional, only if §6q defines mark chrome) — a `Slider` with `marks` to prove mark dot/label color.
  - **🔴 i18n:** every visible caption/label/mark-label string MUST come from `storyT()` against `storybook.mantine.*`
    with full sq/en/uk/it parity — the canonical pattern used by all sibling primitive stories. Do NOT hardcode English
    captions. (Task 544's dev-annotation caption exemption `§14.9.11` is scoped to THAT story only — it does not license
    new hardcoded captions here; follow the Task 545 correction.)
  - **🔴 Determinate render:** give each Slider an explicit `defaultValue` (no animation, no async) so the rendered cell
    is byte-stable and the label bubble (if shown) is deterministic — the gate compares rendered geometry.
- **🔴 Loader-allowlist — VERIFY, do not assume:** a Slider is a static, determinate control and should trip NONE of
  `waitForStoryReady`'s loader signals. Confirm empirically on the built story (like Task 544 §14.9.10 / 545 §14.9.12 /
  546 did). If no signal fires (expected), `LOADER_ALLOWLIST` stays UNCHANGED and you record the verified finding in
  `docs/storybook-governance.md §14.9.16`. If a signal unexpectedly fires, STOP and ASK. **Do NOT copy a prior finding
  forward — re-verify.**
- **Consumer audit (migrate none):** `grep -rl "@/components/ui/slider" src` — list every consumer in the session log;
  migrate ZERO this task (Phase 2). Current expectation: **zero consumers** (verified at kickoff time — no importer of the
  legacy `slider.tsx` exists) — state it. Leave `src/components/ui/slider.tsx` in place (deleting the legacy file is a
  Phase-2 decision, not this slice).

## Mobile <640 full-width gate (clause 11)

- The **Slider root/track is a full-width interactive surface** — it MUST span edge-to-edge at `<640` (the legacy
  `data-horizontal:w-full` behavior). Confirm no fixed px width clips at 320 in any locale.
- **Thumb touch target:** the slider thumb is a drag handle. A visible thumb smaller than 44px is acceptable for a slider
  handle (same class as a native range input), BUT the **draggable/interactive row must be comfortably tappable** — keep
  Mantine's default thumb hit area (or the legacy `after:-inset-2` expanded hit box) and DOCUMENT the thumb as a
  compact-control exemption with this justification in the session log (per clause 11's "icon-only/compact controls are
  the only exemption, each listed explicitly"). Do NOT shrink the interactive row below a tappable height.
- Long uk/it captions/mark-labels wrap (`whitespace-normal break-words`), never clip; **no document h-scroll at 320** in
  any locale.

## Positive + Negative flow

- **Positive:** `Mantine/Primitives/Slider` at `≥640` and `320` × sq/en/uk/it renders the single + range + disabled
  [+ marks] states with the §6q filled/empty track colors, thumb size/border/radius, and focus ring — visibly matching
  the TailAdmin reference side-by-side with the zip (or the honest-negative fallback anchors). The filled band sits
  between the thumbs (range) / from min to the thumb (single); the thumb is draggable and keyboard-steppable.
- **Negative flow (every branch):**
  - **(a) disabled** — the WHOLE control dims uniformly (track AND thumb together, §6q/§6e rule); the thumb is not
    draggable; no focus ring on hover. Verify the thumb dims — not only the track (the §6e/§6f/§6g/§6h failure pattern).
  - **(b) uk@320/375/390** — Slider root full-width, NO document h-scroll; long uk/it captions/mark labels wrap, never
    clip the document.
  - **(c) min == max / empty range edge** — no thrown error, thumb renders at the boundary (determinate).
  - **(d) focus/keyboard** — thumb shows the §6q focus ring on focus-visible; Arrow keys step by `step`; this is the
    existing Mantine behavior — confirm the theme override did not remove the ring or the keyboard step.
  - **(e) No other primitive regressed** — the `theme.components.Slider`/`RangeSlider` default must not leak into any
    other component; no shared token/var modified; `globals.css` untouched.

## Pre-read (rule-index → UI / layout / component + Storybook)

- `docs/agent-contract.md` (clauses 1–16) + `docs/backlog.md` + `docs/critical-flow-registry.md` (scan — primitive, no
  registered flow expected; confirm and state it).
- 🔴 `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` — extract the §6q Slider row FIRST (Step 0); read
  §6e (form-control chrome + focus ring + the disabled whole-control-dim rule) as the reference convention.
- `docs/mantine-responsive-design-system.md` §7 (mobile gate), §12 (canonical patterns), §16 (acceptance gates), §18
  (theming pitfalls — theme defaultProps/styles/vars vs a `*-chrome.css` file; prefer theme when the value is reachable).
- `docs/storybook-governance.md` §14 (+ §14.9 for the loader-allowlist verification record; note §14.9.11 scope and
  §14.9.13 "check the compiled source per component" lesson).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## Gates to close (HELD until green)

- `npm run screenshots:assert -- --mantine-only` — new Slider story, all cells resolved, uk@320/375/390 clean, **no
  document h-scroll**, no new FAIL elsewhere; rendered side-by-side with the §6q reference. Attach the manifest.
- Planted-violation FAIL transcript (prove the gate still catches a real defect on this surface — e.g. force an over-wide
  fixed track / an unstyled thumb — then revert clean and reconfirm the baseline).
- `tsc --noEmit`, `check:stories`, `check:i18n`, `check:mojibake`, `check:design-tokens -- --strict` (if that gate exists
  in this tree), `check:file-integrity` — all green (paste transcripts).
- Regression (clause 15): confirm no `critical-flow-registry.md` flow touched — state it.

## Acceptance criteria

1. New `docs/tailadmin-style-reference.md §6q` Slider row extracted FIRST (filled track, empty track, thickness, radius,
   thumb size/fill/border/focus-ring, disabled whole-control dim) + the theme-vs-`slider-chrome.css` mechanism decision
   recorded; honest-negative fallback declared explicitly if the zip has no slider component; every implementation value
   cited to §6q — zero invented (clause 16).
2. `theme.ts` `Slider` (+ `RangeSlider`) handling (theme defaultProps/styles/vars preferred; `slider-chrome.css` only
   with proof) + `Mantine/Primitives/Slider` story (single / range / disabled [/ marks] states, `storyT` i18n parity)
   render matching §6q at ≥640 and 320 × sq/en/uk/it, with NO document h-scroll at 320. Disabled state dims track AND
   thumb together (verified, not asserted). Horizontal-only confirmed acceptable (no consumer needs vertical) or
   STOP-AND-ASK if a vertical need is found.
3. `LOADER_ALLOWLIST` verified empirically — UNCHANGED if no signal fires (expected), documented in
   `storybook-governance.md §14.9.16` with rendered proof. No assumption copied from a prior task.
4. Consumer audit in the session log (expect zero; migrate zero — Phase 2). Legacy `slider.tsx` left in place. No other
   primitive regressed; no shared token/var or `globals.css` modified.
5. Rendered `--assert` matrix (uk@320/375/390 + ≥640) + planted-violation transcript; all light gates green. Thumb
   compact-control mobile exemption documented explicitly (clause 11).
6. Session log: Files-Changed table, AC-by-AC self-audit, `Self-validation: …` line. **Do NOT run git.**

## Commit hand-off (HELD)

Do NOT emit `git add`/`git commit`. HELD — the orchestrator reviews the real diff (Read-tool, no sandbox git) + the
rendered matrix, then emits the explicit-path commit (`src/theme.ts` [+ `slider-chrome.css` only if justified] + the
Slider story + `scripts/check-stories-rendered.mjs` only if the allowlist changed + `docs/tailadmin-style-reference.md`
+ `docs/storybook-governance.md` + any new i18n message keys (sq/en/uk/it) + session log + tracker + backlog). Owner runs
it in PowerShell after the native gate.
