# Task 498 — Radio primitive → TailAdmin source of truth (Sprint 38, Batch B)

> **Type:** UI / component (Mantine primitive + Storybook story + i18n + style-ref §6g). Mantine = source of truth.
> **Goal:** the Mantine `Radio` renders EXACTLY per a NEW `docs/tailadmin-style-reference.md` §6g matrix (extracted from
> `src/components/ui/radio-group.tsx`), and its disabled state dims the **whole control (circle + label) uniformly to
> opacity 0.5** — the §6e/§6f pattern. **Bake in the Task 497 lessons up front (do NOT re-discover them):**
> - Mantine emits **`data-error`** on the radio input (`Radio.mjs` L137 `mod:{error:!!error}`), **NOT `aria-invalid`** —
>   the error rule MUST key on `[data-error]`.
> - The resting rule `.mantine-Radio-radio:not(:checked):not([data-checked])` is specificity (0,3,0); the error border
>   rule MUST tie/beat it (use `[data-error]:not(:checked)` → (0,3,0), placed AFTER the resting rule so it wins by source
>   order), or the red border loses to gray-3 and never renders.
> - The session log MUST contain the FILLED rendered matrix + DevTools values (not an empty template). 497 was first
>   rejected for shipping an empty matrix and a dead selector — do not repeat either.

## Pre-read

`docs/agent-contract.md` (clauses 7, 9, 10, 12), `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — presentation
primitive, no flow), `docs/mantine-responsive-design-system.md` (§7 mobile gate, §8 Mantine story proof path, §18 theming
pitfalls), **`docs/tailadmin-style-reference.md` §6e + §6f (the disabled whole-control-fade pattern + `input-chrome.css`
vs `theme.ts`-inline rule — §6f Checkbox is your nearest precedent; mirror it)**, `docs/ui-rules.md`, `docs/component-rules.md`,
`docs/qa-rules.md`. **Read source-of-truth `src/components/ui/radio-group.tsx`** (the exact classes you extract into §6g)
and `src/components/ui/label.tsx`; read `src/design-system/mantine/theme.ts` (`Radio` block, currently `defaultProps: {}`)
and `src/design-system/mantine/input-chrome.css` (the Checkbox block at ~L92–135 is the literal template to mirror).

## Step 0 — Add §6g to the style reference BEFORE implementing (do not invent values)

Add a new `## 6g. Radio — FULL state matrix (authoritative)` section to `docs/tailadmin-style-reference.md`, mirroring the
§6f format, extracted verbatim from `radio-group.tsx`. The source classes are:

```
RadioGroupItem: size-4 rounded-full aspect-square border border-input
  focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring
  disabled:cursor-not-allowed disabled:opacity-50
  aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20
  aria-invalid:aria-checked:border-primary
  data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground
Indicator dot: size-2 rounded-full bg-primary-foreground   (8px white dot, centered)
```

Resulting §6g matrix (the thing rendered proof is verified against):

| State | Circle | Dot | Label | Source class |
|---|---|---|---|---|
| **unchecked (resting)** | border `gray-3` (#d0d5dd, = `border-input` per §6f family) · transparent bg · 16px · `rounded-full` | none | `text-sm` `gray-7` (#344054), wraps, ≥44px tap row | `border border-input` |
| **checked** | bg `brand-7` (#EC5447) · border `brand-7` · 8px white center dot | `bg-primary-foreground` white, 8px | unchanged | `data-checked:bg-primary data-checked:border-primary` |
| **focus** | keyboard-visible brand ring + brand border (not on mouse) | — | unchanged | `focus-visible:border-ring focus-visible:ring-2` |
| **error** | border `red-6` (#d92d20) + ring; **checked+error keeps brand border** | — | unchanged | `aria-invalid:border-destructive` · `aria-invalid:aria-checked:border-primary` |
| **disabled** | **opacity 0.5** · `cursor: not-allowed` · no focus ring | dims with circle | **opacity 0.5** (dims with circle) | `disabled:opacity-50`; label `peer-disabled:opacity-50` |

Add the "Mantine selector reality" + "Token discipline" + "Always-verify-styles gate" notes exactly as §6f has them, with
the Radio class names: circle = `.mantine-Radio-radio`, dot = `.mantine-Radio-icon`, label = `.mantine-Radio-label`, root =
`.mantine-Radio-root`. **STOP-and-ASK only if** you find the source-of-truth resting border is genuinely gray-2 not gray-3
(§6f settled the checkbox family on gray-3 via `border-input` — match it unless the source clearly says otherwise).

## Required after-behavior (source of truth — §6g)

- **Circle geometry:** 16px diameter, `rounded-full`, 8px white center dot when checked. Mantine `size='sm'` ≈ 20px is too
  large — **confirm at runtime which Mantine `size` yields a 16px circle (likely `size='xs'`, same as Checkbox) and pin it
  in `theme.ts` `Radio.defaultProps`.** Paste the DevTools computed circle diameter as proof.
- **Unchecked:** `gray-3` border, transparent bg.
- **Checked:** `brand-7` fill + border, white 8px dot (Mantine's filled variant + `primaryColor='brand'`/`primaryShade=7`
  already yields this — confirm; do not hardcode a color prop on the story).
- **Focus:** keyboard-visible brand ring + border (`:focus-visible`, not on mouse click).
- **Error:** `red-6` border + ring (`[data-error]`); checked+error keeps the brand border (no red on the filled circle).
- **Disabled:** circle + label dim **uniformly to opacity 0.5**, `cursor: not-allowed`, no focus ring. NO double-opacity
  (0.25). Two-part rule like §6e/§6f: root-level opacity 0.5; reset the input's element-level Mantine opacity to 1.
- **Label:** `text-sm` (14px) `gray-7`; wraps (sq/en/uk/it), never clips; the circle+label row is a ≥44px tap target.

State chrome Mantine `size`/`color` props cannot express goes in `input-chrome.css` on the stable `.mantine-Radio-*`
classes — **NEVER in `theme.ts` inline `styles`** (inline freezes the cascade + drops state selectors; §6e/Task 505 lesson).

## input-chrome.css — add a Radio block (mirror the Checkbox block verbatim, swap the slot name)

```css
/* ── Radio — §6g state chrome (Task 498) ──────────────────────────────── */
/* Resting unchecked: gray-3 border. :not(:checked)/:not([data-checked]) preserves the checked brand fill. */
.mantine-Radio-radio:not(:checked):not([data-checked]) { border-color: var(--mantine-color-gray-3); }
/* Focus — keyboard only via :focus-visible; suppress ring on mouse */
.mantine-Radio-radio:focus-visible { outline: none; border-color: var(--mantine-color-brand-7);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--mantine-color-brand-5) 10%, transparent); }
.mantine-Radio-radio:focus:not(:focus-visible) { outline: none; box-shadow: none; }
/* Error — Mantine emits data-error (Radio.mjs L137), NOT aria-invalid. :not(:checked) lifts to (0,3,0) to beat resting. */
.mantine-Radio-radio[data-error]:not(:checked) { border-color: var(--mantine-color-red-6);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--mantine-color-red-6) 10%, transparent); }
.mantine-Radio-radio[data-error]:checked { border-color: var(--mantine-color-brand-7); box-shadow: none; }
/* Disabled — whole control (circle + label) → opacity 0.5; §6e/§6f two-part pattern */
.mantine-Radio-root:has(:disabled), .mantine-Radio-root:has([data-disabled]) { opacity: 0.5; cursor: not-allowed; }
.mantine-Radio-radio:disabled, .mantine-Radio-radio[data-disabled] { opacity: 1; cursor: not-allowed; }
```

(Confirm the exact slot class is `.mantine-Radio-radio` via DevTools before relying on it — Mantine v8 Radio uses the
`radio` style slot for the input. If DevTools shows a different stable class, use the real one and note it.)

## theme.ts

`Radio.defaultProps` → add the `size` that yields a 16px circle (DevTools-confirmed, likely `'xs'`); `styles.body`
`minHeight: 2.75rem` + `alignItems: center` (≥44px touch, rem exemption like Checkbox); `styles.label` `fontSize:
var(--mantine-font-size-sm)` + `color: var(--mantine-color-gray-7)` (§6g 14px/gray-7). **No other component touched.**
Static label/body styles inline are fine (no state selectors); state chrome stays in `input-chrome.css`.

## New Storybook story

Create `src/stories/mantine/primitives/Radio.stories.tsx` on the Mantine proof path (`parameters: { skipCanvas: true,
layout: 'fullscreen' }`, single `Default` export, toolbar-driven viewport+locale, all strings via
`storyT(locale, 'storybook.mantine.<key>')`). Render `Radio` items (wrap in `Radio.Group` where a group is natural).
Sections, each with a `<Text size="xs" c="gray.5" fw={500}>` caption naming the state:
1. **unchecked** — gray-3 border / 16px circle / label gray-7 / ≥44px row.
2. **checked** — brand-7 fill + white dot.
3. **focus** — caption "keyboard focus ring (brand, :focus-visible); no ring on mouse click".
4. **error** — `error` prop set → red-6 border + red message; include one checked+error showing the brand border retained.
5. **disabled** — one unchecked + one checked, caption "whole control faded (circle + label → opacity 0.5); not-allowed; no focus ring".
6. **long label** — a long uk/sq label that wraps to ≥2 lines at 320 with no clip / no h-scroll.

## i18n

Add `rb_*` keys to all four `messages/{en,sq,uk,it}.json` under `storybook.mantine.*` with exact 4-locale parity:
`rb_label`, `rb_error`, `rb_long_label` (long uk = a real multi-word string that wraps at 320). No localized brand names;
`check:i18n` must rise by the same N in all four (currently 2000 → 2003 each).

## Current behavior to preserve

No existing Mantine Radio story today (new). `theme.ts` `Radio: { defaultProps: {} }` gains `size` + `styles` — do NOT
change other components, do NOT touch the Checkbox/input §6e/§6f rules.

## Positive / negative flow

- **Checked (positive):** select → brand-7 fill + white dot; label readable; row ≥44px.
- **Disabled (negative):** circle + label both opacity 0.5, not-allowed, no focus ring, no select on click; verify unchecked AND checked disabled.
- **Error (negative):** `error` prop → red-6 border + red message; checked+error keeps brand border (no red on filled circle).
- **Keyboard:** focus ring on Tab focus, not on mouse click.
- **No double-opacity (0.25) anywhere; no red/focus leak into disabled.**

## Mobile <640 gate

Circle+label row full-width at <640, ≥44px tap target, label wraps in all 4 locales, no clip / no h-scroll at 320. Mantine proof path.

## Acceptance criteria

1. `docs/tailadmin-style-reference.md` §6g Radio matrix added, extracted from `radio-group.tsx` (no invented values).
2. `theme.ts` `Radio` pinned to the `size` yielding a **16px circle** (DevTools-confirmed) + label 14px/gray-7 + body 44px; no other component touched.
3. State chrome props can't express (resting gray-3 / focus ring / error border / disabled whole-control fade) implemented in `input-chrome.css` on `.mantine-Radio-*`, mirroring §6f; NOT in `theme.ts` inline `styles`. Error rule uses `[data-error]` and out-specifies the resting rule.
4. `Radio.stories.tsx` created with the 6 sections; all strings via `storyT`; Mantine proof path (`skipCanvas`, single `Default`).
5. `rb_*` keys added to all 4 locales with exact parity (2000 → 2003 each).
6. **DevTools confirmation pasted** (FILLED, not a template): circle 16px diameter / checked brand-7 fill + white 8px dot / error input carries `data-error` / disabled circle AND label both opacity 0.5.
7. **RENDERED PROOF (clause 12) — FILLED matrix:** each state cell at uk@320/375/390 (+ en/sq/it@320) — unchecked/checked/focus/**error-red-border (unchecked)**/checked+error-brand/disabled (circle+label faded)/long-label-wrap. The error-red-border cell is mandatory (it is the exact thing that was dead in 497).
8. **Planted-violation transcript:** change `[data-error]` → `[aria-invalid]` (error border goes gray) OR remove the root disabled rule (label snaps to full strength) → capture the regression → revert.
9. Gates: tsc=0, `check:stories`, `check:i18n` (+3 parity), `check:design-tokens`, `check:mojibake` — all green, pasted.
10. File-integrity (clause 14) transcript for every touched file.
11. `docs/backlog.md` Last Session + `docs/sessions/2026-06-28-task498-radio.md` (Files Changed table — list EVERY touched path incl. `tailadmin-style-reference.md`). NO `git add`/`git commit` — orchestrator emits at review.

## Hard contract

Scope = `tailadmin-style-reference.md` (add §6g) + `theme.ts` (`Radio` only) + `input-chrome.css` (Radio rules only) + new
`Radio.stories.tsx` + 4 locale files + session log/backlog. No other component, no token-value change, no input/§6e/§6f/checkbox
change. STOP-and-ASK if: a real consumer needs a horizontal radio row layout (kickoff assumes default vertical
`Radio.Group`); the source resting border is genuinely gray-2 vs gray-3; or no Mantine `size` cleanly yields 16px (propose
closest + a CSS pin, do not guess silently). Self-validate before complete (tsc=0 + DevTools 16px/`data-error`/0.5-opacity
proof + rendered all-states proof incl. the error-red-border cell at uk@320).
