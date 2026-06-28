# Task 499 — Switch primitive → TailAdmin source of truth (Sprint 38, Batch B — FINAL)

> **Type:** UI / component (Mantine primitive + Storybook story + i18n + style-ref §6h). Mantine = source of truth.
> **Goal:** the Mantine `Switch` renders EXACTLY per a NEW `docs/tailadmin-style-reference.md` §6h matrix (extracted from
> `src/components/ui/switch.tsx`), and its disabled state dims the **whole control (track + thumb + label) uniformly to
> opacity 0.5** — the §6e/§6f/§6g pattern. This is the last form-control in Sprint 38; it must be clean on the first pass.
>
> **🔴 Bake in the Task 497/498 lessons up front (do NOT re-discover them):**
> - Mantine emits **`data-error`** on the control (the recurring `mod:{error:!!error}` pattern, same as Checkbox/Radio),
>   **NOT `aria-invalid`** — the error rule MUST key on `[data-error]`. Confirm the exact slot via DevTools before relying.
> - Resting-state CSS rules are typically specificity (0,3,0); any error rule MUST tie/beat the resting rule and be placed
>   AFTER it so it wins by source order — or the error border loses and never renders (the dead-selector trap from 497).
> - The session log MUST contain the **FILLED** rendered matrix + DevTools values (NOT an empty template). 497 was rejected
>   for shipping an empty matrix and a dead selector — do not repeat either.
> - **Disabled must dim the LABEL too, not just the track** (owner P0 2026-06-28, Task 495/508 §6e always-verify gate).

## Pre-read

`docs/agent-contract.md` (clauses 7, 9, 10, 12, 14), `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — Switch is a
presentation primitive, touches NO registry flow; note that in the log), `docs/mantine-responsive-design-system.md`
(§7 mobile gate, §8 Mantine story proof path, **§18 theming pitfalls — `theme.styles`=inline-only/no state selectors →
state chrome goes in `input-chrome.css`; `data-error` not `data-invalid`; disabled `:disabled`/`[data-disabled]`/`:has`**),
**`docs/tailadmin-style-reference.md` §6e + §6f + §6g (the disabled whole-control-fade pattern + `input-chrome.css` vs
`theme.ts`-inline rule — §6g Radio is your nearest precedent; mirror it)**, `docs/ui-rules.md`, `docs/component-rules.md`,
`docs/qa-rules.md`. **Read source-of-truth `src/components/ui/switch.tsx`** (the exact classes you extract into §6h) and
`src/components/ui/label.tsx`; read `src/design-system/mantine/theme.ts` (the `Switch` block, currently
`defaultProps: { size: 'sm' }`) and `src/design-system/mantine/input-chrome.css` (the Radio block, Task 498, is the literal
template to mirror — swap the slot names).

## Step 0 — Add §6h to the style reference BEFORE implementing (do not invent values)

Add a new `## 6h. Switch — FULL state matrix (authoritative)` section to `docs/tailadmin-style-reference.md`, inserted
AFTER §6g (Radio) and before §7, mirroring the §6g format, extracted verbatim from `src/components/ui/switch.tsx`. The
source classes are:

```
Track (Root): peer relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all
  data-[size=default]:h-[18.4px] data-[size=default]:w-8   data-[size=sm]:h-3.5 data-[size=sm]:w-6
  data-checked:bg-primary   data-unchecked:bg-input
  focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50
  aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20
  data-disabled:cursor-not-allowed data-disabled:opacity-50
Thumb: pointer-events-none block rounded-full bg-background transition-transform
  group-data-[size=default]/switch:size-4   group-data-[size=sm]/switch:size-3
  data-checked:translate-x-[calc(100%-2px)]   data-unchecked:translate-x-0
```

Resulting §6h matrix (the thing rendered proof is verified against):

| State | Track | Thumb | Label | Source class |
|---|---|---|---|---|
| **unchecked (resting)** | bg `input`-gray (reconcile against §6d "gray-200" + the §6e family `border-input`→gray-3 mapping — **confirm gray-2 vs gray-3 from the actual `--input` token; do not invent**) · transparent border · `rounded-full` | white (`bg-background`), at left | `text-sm` `gray-7` (#344054), wraps, ≥44px tap row | `data-unchecked:bg-input` |
| **checked** | bg `brand-7` (#EC5447) | white, slid right (`translate-x-[calc(100%-2px)]`) | unchanged | `data-checked:bg-primary` |
| **focus** | keyboard-visible brand ring + brand border (not on mouse) | — | unchanged | `focus-visible:border-ring focus-visible:ring-3` |
| **error** | border `red-6` (#d92d20) + ring; **checked+error keeps brand fill** (no red on a filled track) | — | unchanged | `aria-invalid:border-destructive` (→ Mantine `[data-error]`) |
| **disabled** | **opacity 0.5** · `cursor: not-allowed` · no focus ring | dims with track | **opacity 0.5** (dims with track) | `data-disabled:opacity-50`; label dims too |

Add the **"Mantine selector reality"** + **"Token discipline"** + **"Always-verify-styles gate"** notes exactly as §6g has
them, with the Switch class names: track = `.mantine-Switch-track`, thumb = `.mantine-Switch-thumb`, input =
`.mantine-Switch-input`, label = `.mantine-Switch-label`, root = `.mantine-Switch-root`. **STOP-and-ASK if** the source
unchecked track color does not cleanly resolve to a single gray token (gray-2 vs gray-3), or if DevTools shows the checked
state lives on a slot/attribute these names don't cover.

## Required after-behavior (source of truth — §6h)

- **Track geometry:** the source default track is `h-[18.4px] w-8` (≈18×32px) with a `size-4` (16px) thumb; sm is
  `h-3.5 w-6` (14×24) with `size-3` thumb. **Confirm at runtime which Mantine `size` yields the TailAdmin default density
  and pin it in `theme.ts` `Switch.defaultProps`** (the block is currently `size:'sm'` "compact toggle density"; §6d's
  note says "size md" — reconcile the two against the rendered DevTools track height and document the final choice; STOP
  and ASK if neither Mantine size matches and a CSS pin would be needed).
- **Unchecked:** gray track (the resolved `--input` gray), white thumb at rest-left, transparent border.
- **Checked:** `brand-7` track fill, white thumb slid to the right (Mantine + `primaryColor='brand'`/`primaryShade=7`
  already yields the brand fill — confirm; do NOT hardcode a `color` prop on the story).
- **Focus:** keyboard-visible brand ring + border (`:focus-visible`, NOT on mouse click).
- **Error:** `red-6` border + ring on the track (`[data-error]`); checked+error keeps the brand fill (no red on a filled
  track). The error rule must out-specify / source-order-beat the resting rule.
- **Disabled:** track + thumb + **label** dim **uniformly to opacity 0.5**, `cursor: not-allowed`, no focus ring. NO
  double-opacity (0.25). Two-part rule like §6e/§6f/§6g: root-level opacity 0.5; reset the element-level Mantine opacity
  to 1 so the root 0.5 is the sole multiplier.
- **Label:** `text-sm` (14px) `gray-7`; wraps (sq/en/uk/it), never clips; the track+label row is a ≥44px tap target.

State chrome Mantine `size`/`color` props cannot express goes in `input-chrome.css` on the stable `.mantine-Switch-*`
classes — **NEVER in `theme.ts` inline `styles`** (inline freezes the cascade + drops state selectors; §6e/Task 505 lesson).

## input-chrome.css — add a Switch block (mirror the Radio block verbatim, swap the slot names)

```css
/* ── Switch — §6h state chrome (Task 499) ─────────────────────────────── */
/* Resting unchecked track: resolved input-gray. :not(:checked)/:not([data-checked]) preserves the checked brand fill. */
.mantine-Switch-track:not(:checked):not([data-checked]) { /* background-color: var(--mantine-color-gray-?); ← pin the DevTools-confirmed token */ }
/* Focus — keyboard only via :focus-visible on the input; ring on the track; suppress on mouse */
.mantine-Switch-input:focus-visible + .mantine-Switch-track { outline: none; border-color: var(--mantine-color-brand-7);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--mantine-color-brand-5) 10%, transparent); }
.mantine-Switch-input:focus:not(:focus-visible) + .mantine-Switch-track { outline: none; box-shadow: none; }
/* Error — Mantine emits data-error (confirm the slot via DevTools), NOT aria-invalid. Out-specify/source-order-beat resting. */
.mantine-Switch-root[data-error] .mantine-Switch-track { border-color: var(--mantine-color-red-6);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--mantine-color-red-6) 10%, transparent); }
/* checked+error → brand fill wins (no red on a filled track) — confirm the exact checked selector at runtime */
/* Disabled — whole control (track + thumb + label) → opacity 0.5; §6e/§6f/§6g two-part pattern */
.mantine-Switch-root:has(:disabled), .mantine-Switch-root:has([data-disabled]) { opacity: 0.5; cursor: not-allowed; }
.mantine-Switch-input:disabled, .mantine-Switch-input[data-disabled] { opacity: 1; cursor: not-allowed; }
```

**The exact selectors above are a STARTING TEMPLATE — Mantine v8 Switch slot structure (track/thumb/input adjacency and
where `data-checked`/`data-error` actually land) MUST be DevTools-verified before you rely on it.** If the real DOM differs
(e.g. checked state is an attribute on `.mantine-Switch-track` itself rather than a sibling-input combinator), use the real
structure and document it in the §6h "Mantine selector reality" note. Do not ship a selector you have not seen match in
DevTools (the 497 dead-selector failure).

## theme.ts

`Switch.defaultProps` → keep/adjust `size` to the value that yields the TailAdmin default track density (DevTools-confirmed —
reconcile current `'sm'` vs §6d "md"); add `styles.body` `minHeight: 2.75rem` + `alignItems: center` (≥44px touch, rem
exemption like Radio/Checkbox) and `styles.label` `fontSize: var(--mantine-font-size-sm)` + `color:
var(--mantine-color-gray-7)` (§6h 14px/gray-7). **No other component touched.** Static label/body styles inline are fine
(no state selectors); ALL state chrome stays in `input-chrome.css`.

## New Storybook story

Create `src/stories/mantine/primitives/Switch.stories.tsx` on the Mantine proof path (`parameters: { skipCanvas: true,
layout: 'fullscreen' }`, single `Default` export, toolbar-driven viewport+locale, all strings via
`storyT(locale, 'storybook.mantine.<key>')`). Sections, each with a `<Text size="xs" c="gray.5" fw={500}>` caption naming
the state:
1. **unchecked** — gray track / white thumb left / label gray-7 / ≥44px row.
2. **checked** — brand-7 track fill + white thumb slid right (`defaultChecked`).
3. **focus** — caption "keyboard focus ring (brand, :focus-visible); no ring on mouse click".
4. **error** — `error` prop set → red-6 track border + red message; include one checked+error showing the brand fill retained.
5. **disabled** — one unchecked + one checked (`defaultChecked disabled`), caption "whole control faded (track + thumb +
   label → opacity 0.5); not-allowed; no focus ring".
6. **long label** — a long uk/sq label that wraps to ≥2 lines at 320 with no clip / no h-scroll.

## i18n

Add `sw_*` keys to all four `messages/{en,sq,uk,it}.json` under `storybook.mantine.*` with exact 4-locale parity:
`sw_label`, `sw_error`, `sw_long_label` (long uk = a real multi-word string that wraps at 320). No localized brand names;
`check:i18n` must rise by the same +3 in all four locales (confirm the current baseline first, then +3 each — 498 left it
at 2003 each, so expect ~2006).

## Current behavior to preserve

No existing Mantine Switch story today (new). `theme.ts` `Switch: { defaultProps: { size: 'sm' } }` gains `styles` (and a
possible `size` adjustment) — do NOT change other components, do NOT touch the Checkbox/Radio/input §6e/§6f/§6g rules.

## Positive / negative flow

- **Checked (positive):** toggle on → brand-7 track + thumb slides right; label readable; row ≥44px.
- **Disabled (negative):** track + thumb + label all opacity 0.5, not-allowed, no focus ring, no toggle on click; verify
  unchecked AND checked disabled.
- **Error (negative):** `error` prop → red-6 track border + red message; checked+error keeps brand fill (no red on filled track).
- **Keyboard:** focus ring on Tab focus, not on mouse click; Space toggles.
- **No double-opacity (0.25) anywhere; no red/focus leak into disabled; label must dim with the track.**

## Mobile <640 gate

Track+label row full-width at <640, ≥44px tap target, label wraps in all 4 locales, no clip / no h-scroll at 320. Mantine
proof path (`skipCanvas`, toolbar-driven viewport/locale).

## Acceptance criteria

1. `docs/tailadmin-style-reference.md` §6h Switch matrix added (after §6g, before §7), extracted from `switch.tsx` (no
   invented values); the unchecked track gray token is resolved from the real `--input` token, not guessed.
2. `theme.ts` `Switch` pinned to the `size` yielding the TailAdmin default track density (DevTools-confirmed; §6d "md" vs
   current "sm" reconciled + documented) + label 14px/gray-7 + body 44px; no other component touched.
3. State chrome props can't express (resting gray track / focus ring / error border / **disabled whole-control fade incl.
   label**) implemented in `input-chrome.css` on `.mantine-Switch-*`, mirroring §6g; NOT in `theme.ts` inline `styles`.
   Error rule uses `[data-error]` and out-specifies/source-order-beats the resting rule.
4. `Switch.stories.tsx` created with the 6 sections; all strings via `storyT`; Mantine proof path (`skipCanvas`, single `Default`).
5. `sw_*` keys added to all 4 locales with exact parity (+3 each from the confirmed baseline).
6. **DevTools confirmation pasted** (FILLED, not a template): track geometry (default density) / checked brand-7 track +
   thumb travel / error control carries `data-error` (not `aria-invalid`) / disabled track AND thumb AND label all opacity 0.5.
7. **RENDERED PROOF (clause 12) — FILLED matrix:** each state cell at uk@320/375/390 (+ en/sq/it@320) —
   unchecked/checked/focus/**error-red-border (unchecked)**/checked+error-brand/disabled (track+thumb+label faded)/
   long-label-wrap. The error-red-border cell is mandatory (it is the exact thing that was dead in 497). The disabled cell
   must show the LABEL dimmed, not just the track (the 495/508 lesson).
8. **Planted-violation transcript:** change `[data-error]` → `[aria-invalid]` (error border goes gray) OR remove the root
   disabled rule (label snaps to full strength while the track dims) → capture the regression → revert.
9. Gates: tsc=0, `check:stories`, `check:i18n` (+3 parity), `check:design-tokens`, `check:mojibake` — all green, pasted.
10. File-integrity (clause 14) transcript for every touched file (0 NUL / parses / not truncated).
11. `docs/backlog.md` Last Session + `docs/sessions/2026-06-28-task499-switch.md` (Files Changed table — list EVERY touched
    path incl. `tailadmin-style-reference.md`). NO `git add`/`git commit` — orchestrator emits at review.

## Hard contract

Scope = `tailadmin-style-reference.md` (add §6h) + `theme.ts` (`Switch` only) + `input-chrome.css` (Switch rules only) + new
`Switch.stories.tsx` + 4 locale files + session log/backlog. No other component, no token-value change, no
input/§6e/§6f/§6g/checkbox/radio change. **STOP-and-ASK if:** the source unchecked track color does not resolve to a single
gray token (gray-2 vs gray-3); the Mantine Switch DOM does not match the assumed track/thumb/input slot structure; no
Mantine `size` cleanly yields the default density (propose closest + a CSS pin, do not guess silently); or a real consumer
needs an on/off text label inside the track (kickoff assumes a plain toggle + external label). Self-validate before complete
(tsc=0 + DevTools density/`data-error`/0.5-opacity-incl-label proof + rendered all-states proof incl. the error-red-border
cell AND the dimmed-label disabled cell at uk@320).
