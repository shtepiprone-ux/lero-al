# Task 497 — Checkbox primitive → TailAdmin source of truth (Sprint 38, Batch B)

> **Type:** UI / component (Mantine primitive + Storybook story + i18n). Mantine = source of truth (`rule-index` UI bundle).
> **Goal:** the Mantine `Checkbox` renders EXACTLY per `docs/tailadmin-style-reference.md` §6f for every state, and its
> disabled state dims the **whole control (box + label) uniformly to opacity 0.5** — the same class of fix that Task 508
> just landed for the inputs. Do NOT repeat the 495/507 miss (fading only the box, leaving the label full-strength).

## Pre-read

`docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan),
`docs/mantine-responsive-design-system.md` (§7 mobile gate, §8 Mantine story proof path, §18 theming pitfalls if present),
**`docs/tailadmin-style-reference.md` §6f (the authoritative Checkbox state matrix — this is what your render is verified
against) + §6e (the disabled whole-control-fade pattern + `input-chrome.css` vs `theme.ts`-inline rule)**, `docs/ui-rules.md`,
`docs/component-rules.md`, `docs/qa-rules.md`. Read source-of-truth `src/components/ui/checkbox.tsx` and
`src/components/ui/label.tsx`; read `src/design-system/mantine/theme.ts` (`Checkbox` block) and
`src/design-system/mantine/input-chrome.css` (where state chrome that props can't express goes — see the §6e disabled
two-part rule as the pattern to mirror).

## Required after-behavior (source of truth — §6f)

Per-state, the rendered Mantine `Checkbox` must match §6f:
- **Box geometry:** 16px box (`size-4`), 4px radius (`rounded-[4px]` → Mantine `radius='sm'`), check icon 14px. Mantine
  `size='sm'` ≈ 20px — **confirm at runtime which Mantine `size` yields a 16px box (likely `size='xs'`) and pin it in
  `theme.ts` `Checkbox.defaultProps`.** Paste the DevTools computed box size as proof.
- **Unchecked:** `gray-3` (#d0d5dd) border, transparent bg.
- **Checked:** `brand-7` (#EC5447) fill + border, white check mark.
- **Focus:** keyboard-visible brand ring + border (not on mouse click).
- **Error:** `red-6` (#d92d20) border + ring; checked+error keeps the brand border (`aria-invalid:aria-checked` rule).
- **Disabled:** box + label dim **uniformly to opacity 0.5**, `cursor: not-allowed`, no focus ring. NO double-opacity
  (0.25). Mirror the §6e Part-1/Part-2 approach (root-level opacity 0.5; reset any element-level Mantine dim to 1).
- **Label:** `text-sm` (14px) `gray-7` (#344054); wraps (sq/en/uk/it), never clips; the box+label row is a ≥44px tap target.
- **Indeterminate:** only if a real consumer needs it — otherwise OUT OF SCOPE. If you believe it is needed, **STOP and ASK**;
  do not style it speculatively.

State chrome that Mantine `radius`/`color`/`size` props cannot express (the disabled whole-control fade, any error-border
nuance) goes in `input-chrome.css` on the stable `.mantine-Checkbox-{input,label,icon}` / `.mantine-Checkbox-root` classes —
NEVER in `theme.ts` inline `styles` (inline freezes the cascade + drops state selectors; §6e/Task 505 lesson).

## 🔴 Mandatory runtime selector + geometry confirmation BEFORE relying on selectors (Task 505/506/507/508 lesson)

In DevTools, in the Checkbox story, paste evidence of:
1. the box class (`.mantine-Checkbox-input`), its computed **width/height = 16px** and **border-radius = 4px**;
2. the label class (`.mantine-Checkbox-label`) and that your disabled rule dims it (computed opacity 0.5);
3. the checked fill = brand-7 and check-mark = white;
4. which selector carries disabled (`:disabled` / `[data-disabled]`) and the computed opacity of box AND label (both 0.5, not 1, not 0.25);
5. which Mantine `size` value produced the 16px box.

## New Storybook story

Create `src/stories/mantine/primitives/Checkbox.stories.tsx` following the Mantine proof path (`parameters: { skipCanvas: true,
layout: 'fullscreen' }`, single `Default` export, toolbar-driven viewport+locale, all strings via `storyT('storybook.mantine.<key>')`).
Sections, each with a `<Text size="xs" c="gray.5">` caption naming the state:
1. **unchecked** — gray-3 border / 16px / 4px radius / label gray-7.
2. **checked** — brand-7 fill + white check.
3. **focus** — note "keyboard focus ring (brand)".
4. **error** — `error` prop set → red-6 border + red message; include one checked+error showing brand border retained.
5. **disabled** — one unchecked + one checked, caption "whole control faded (box + label → opacity 0.5); not-allowed; no focus ring".
6. **long label** — a long uk/sq label that wraps to ≥2 lines at 320 with no clip / no h-scroll.

## i18n

Add `cb_*` keys to all four `messages/{en,sq,uk,it}.json` under `storybook.mantine.*` (same key set, 4-locale parity):
e.g. `cb_label`, `cb_label_checked`, `cb_error`, `cb_long_label` (long uk = a real multi-word string that wraps at 320).
No localized brand names; keep parity exact (`check:i18n` count rises by the same N in all four).

## Current behavior to preserve

No existing Mantine Checkbox story today (new). `theme.ts` `Checkbox: { defaultProps: { radius: 'sm' } }` may gain a `size`
to hit 16px — do not change other components. No change to the inputs' §6e rules.

## Positive / negative flow

- **Checked (positive):** click toggles checked → brand-7 fill + white check; label readable; row ≥44px.
- **Disabled (negative):** box + label both at opacity 0.5, not-allowed, no focus ring, no toggle on click; verify unchecked AND checked disabled.
- **Error (negative):** `error` prop → red-6 border + red message; checked+error keeps brand border (no red box when checked).
- **Keyboard:** focus ring appears on Tab focus, not on mouse click.
- **No double-opacity (0.25) anywhere; no red/focus leak into disabled.**

## Mobile <640 gate

Box+label row full-width at <640, ≥44px tap target, label wraps in all 4 locales, no clip / no h-scroll at 320. Mantine proof path.

## Acceptance criteria

1. `theme.ts` `Checkbox` pinned to the `size`/`radius` that yields a **16px box + 4px radius** (DevTools-confirmed); no other component touched.
2. Any state chrome props can't express (disabled whole-control fade; error border if needed) implemented in `input-chrome.css` on `.mantine-Checkbox-*`, mirroring §6e; NOT in `theme.ts` inline `styles`.
3. `Checkbox.stories.tsx` created with the 6 sections above; all strings via `storyT`; Mantine proof path (`skipCanvas`, single `Default`).
4. `cb_*` keys added to all 4 locales with exact parity.
5. **DevTools selector + geometry + opacity confirmation** pasted (box 16px / radius 4px / checked brand-7 / disabled box+label opacity 0.5).
6. **RENDERED PROOF (clause 12/13):** each state cell at uk@320/375/390 (+ en/sq/it@320) — unchecked/checked/focus/error/disabled (box+label faded)/long-label-wrap — with a side-by-side note vs §6f.
7. **Planted-violation transcript:** remove the disabled label-dim (or the checked brand fill) → capture the regression (label snaps to full strength / fill goes gray) → revert.
8. Gates: tsc=0, `check:stories`, `check:i18n` (+N parity), `check:design-tokens`, `check:mojibake` — green.
9. File-integrity (clause 14) transcript for every touched file.
10. `docs/backlog.md` Last Session + `docs/sessions/2026-06-28-task497-checkbox.md` (Files Changed table). NO `git add`/`git commit` — orchestrator emits at review.

## Critical-flow note

Presentation-only primitive. Scan registry; no new unit test mandated — AC-6 rendered proof + AC-7 planted-violation are the evidence.

## Hard contract

Scope = `theme.ts` (`Checkbox` only) + `input-chrome.css` (Checkbox rules only) + new `Checkbox.stories.tsx` + 4 locale files
+ session log/backlog. No other component, no token-value change, no input/§6e change. STOP-and-ASK if: indeterminate is
needed by a real consumer; the source-of-truth unchecked border is genuinely gray-2 vs gray-3 (§6f says gray-3 / `border-input`);
or no Mantine `size` cleanly yields 16px (propose the closest + a CSS pin, do not guess silently). Self-validate before
complete (tsc=0 + DevTools 16px/0.5-opacity proof + rendered all-states proof at uk@320).
