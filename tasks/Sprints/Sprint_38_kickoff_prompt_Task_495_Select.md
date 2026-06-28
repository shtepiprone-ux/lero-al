# Task 495 — Select primitive → TailAdmin (Sprint 38, P1.03)

> **Type:** UI / component (Mantine theme + `input-chrome.css` extension + new story).
> **Scope:** Select INPUT CHROME + story. The `<640` dropdown bottom-sheet is **explicitly OUT of scope** — see
> "Dropdown bottom-sheet" below (Batch C / STOP-and-ASK).

## 🔴 Pre-read — MANDATORY

`docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan),
**`docs/mantine-responsive-design-system.md` — read §18 IN FULL (Mantine theming/CSS pitfalls) FIRST**, plus §7 (mobile
gate), §8 (Storybook proof), §12 (patterns), `docs/tailadmin-style-reference.md` §6/§6d, `docs/storybook-governance.md`,
`docs/component-rules.md`, `docs/qa-rules.md`. Read current `src/design-system/mantine/input-chrome.css` (Select is
already in the DISABLED rule from Task 507 — do NOT duplicate it; you are ADDING resting/focus/error/placeholder only).

## §18 compliance (the hard-won rules — non-negotiable)

- Border/focus/error/placeholder go in **`input-chrome.css`** on the stable class **`.mantine-Select-input`** — NEVER
  in inline `theme.components.Select.styles` (inline freezes the border + drops state selectors). §18.1.
- Mantine Select renders its trigger via `Input` → the box is `.mantine-Select-input`, carries **`data-error`** (not
  `data-invalid`) and `:focus`. **DevTools-confirm** this on the rendered error/focus states before relying. §18.3.
- Set `border-color` DIRECTLY per state (don't rely on `--input-bd`). `[data-error]` (0,2,0) > `:focus` (0,1,1). §18.3.
- Rendered proof at uk@320 is the verdict; `tsc`/gates green ≠ proof. §18.6.

## Required values (§6d Select)

- `radius: 'lg'` (8), `size: 'sm'` (14px), `minHeight: '2.75rem'` (44px — already in theme).
- Resting border **gray-2** (OWNER DECISION 2026-06-27 — match TextInput/Textarea/PasswordInput for visual consistency;
  this overrides the §6d Select "gray-3" note). All four form inputs share the same resting border.
- Placeholder `gray-4`, option/value text `gray-7`/`gray-8`, focus = brand-3 border + brand-5/10 ring (mirror TextInput).
- Chevron on the right via Mantine's default `rightSection` (Select ships a chevron); confirm its color is tokenized
  (gray-5) and it does not clip; do NOT hardcode an icon color.

## `input-chrome.css` — ADD Select resting/focus/error (mirror TextInput; resting = gray-2 per owner)

Add (tokens only):

```css
.mantine-Select-input { border-color: var(--mantine-color-gray-2); box-shadow: var(--mantine-shadow-xs); }
.mantine-Select-input::placeholder { color: var(--mantine-color-gray-4); }
.mantine-Select-input:focus { border-color: var(--mantine-color-brand-3); box-shadow: 0 0 0 3px color-mix(in srgb, var(--mantine-color-brand-5) 10%, transparent); }
.mantine-Select-input[data-error], .mantine-Select-input[data-error]:focus { border-color: var(--mantine-color-red-6); box-shadow: none; }
```

(Disabled for Select is ALREADY present from Task 507 — do not re-add.) `theme.components.Select` keeps only flat props
(`radius`/`size`/`minHeight`); no border/state keys inline.

## Dropdown bottom-sheet at `<640` — OUT OF SCOPE (Batch C / STOP-and-ASK)

The owner P0 rule (agent-contract clause 11) requires all popups to be full-width bottom sheets at `<640`. The Select
DROPDOWN (Combobox) bottom-sheet treatment is **Batch C (overlays)** per the sprint plan, and the sprint Task 495 block
says **"if the canonical bottom-sheet wiring for Select is not already in the theme/a wrapper, STOP and ASK — do not
invent."** There is currently NO canonical Select-dropdown bottom-sheet pattern. **OWNER DECISION 2026-06-27: DEFER the dropdown
bottom-sheet to Batch C.** Therefore:
- Task 495 covers the Select **input chrome only**. The dropdown uses Mantine's default anchored dropdown for now.
- The story documents this with a visible caption: "dropdown bottom-sheet `<640` = Batch C, pending".
- **Do NOT invent a bottom-sheet wrapper here.** The `<640` dropdown bottom-sheet is a Batch C overlay task (owner will
  decide the exact pattern then).

## 🔴 SOURCE-OF-TRUTH SPLIT (owner standing rules)

- **BEHAVIOR + RESPONSIVE = Mantine** — taken from Mantine's built-in component, NOT reimplemented.
- **VISUAL UI = TailAdmin** — every color/spacing/border/radius/shadow value comes from the TailAdmin source of truth
  (`docs/tailadmin-style-reference.md` §6/§6d + the `demo_tailadmin_com.zip` demo). **ZERO invented px/colors** — if a
  value isn't in the reference, STOP and ASK; do not guess. Mantine supplies the mechanism; TailAdmin dictates the look.

## 🔴 BEHAVIOR = MANTINE (owner standing rule — do NOT reimplement)

We take the BEHAVIOR of every element from Mantine; this task only applies VISUAL CHROME via tokens. Select's
open/close, keyboard navigation, type-to-search, option selection, value display, ARIA/a11y, focus management — ALL
Mantine's built-in behavior, left untouched. Do NOT wrap, fork, re-handle events, or reimplement any interaction. The
only changes are: token-driven border/focus/error/placeholder colors in `input-chrome.css` + flat theme defaults. If a
required visual result seems to need a behavioral change, STOP and ASK — do not re-engineer Mantine's behavior.

**Responsive behavior is ALSO Mantine's (owner note 2026-06-27): Mantine already does responsive properly.** Rely on
Mantine's built-in responsive system / dropdown positioning — do NOT hand-roll responsive CSS or custom media-query
hacks. (When the `<640` dropdown bottom-sheet is tackled in Batch C, it should likewise prefer Mantine-native responsive
capabilities over a bespoke wrapper.)

## Current behavior to preserve

Existing `Select` consumers keep their props/behavior (single-select, search if used). No product-surface edits. The
already-shipped disabled state (Task 507) and the other inputs' chrome are untouched.

## Positive / negative flow

- **Positive:** Select renders input chrome identical to TextInput (44px, 14px, agreed border, brand focus ring) + chevron;
  opening shows options (gray-7); selecting updates the value; desktop anchored dropdown.
- **Negative:** placeholder/empty; `error` → red border + message (red on `.mantine-Select-input[data-error]`); disabled
  → faded transparent (Task 507, verify still correct for Select); long uk option (`Адміністратор`) no clip; no h-scroll@320.

## Mobile <640 gate

The Select TRIGGER is full-width at `<640` (no clip, labels wrap, ≥44px). The DROPDOWN bottom-sheet is deferred (above).

## Story — `src/stories/mantine/primitives/Select.stories.tsx`

Single `Default`, Mantine proof path (`skipCanvas:true`, `layout:'fullscreen'`, `Box px={{base:'md',sm:'xl'}} py="md"`).
Sections: (1) label + select with 3–4 options; (2) open state (`defaultDropdownOpened` or rendered open); (3) error;
(4) disabled. All strings via `storyT('storybook.mantine.sel_*')` — new `sel_*` keys ×4 locales (parity), proper uk
Cyrillic, at least one long option that wraps at 320. NO hardcoded strings, NO raw `<select>`.

## Acceptance criteria

1. Resting/focus/error rules for `.mantine-Select-input` added to `input-chrome.css` (resting border **gray-2**);
   placeholder gray-4; NOT in inline `theme.styles`.
2. DevTools confirmation pasted: `data-error` + `:focus` carried by `.mantine-Select-input`; chevron is `rightSection`.
3. `theme.components.Select` holds only flat props (no border/state keys).
4. New `Select.stories.tsx` (4 sections) + `sel_*` keys ×4 (parity); dropdown-bottom-sheet caption present.
5. **RENDERED PROOF (clause 12/13):** uk@320/375/390 (+ en/sq/it@320) — trigger full-width, agreed border, brand focus,
   red error border, faded disabled, long uk option no clip/no h-scroll. Plus a planted-violation transcript for the
   error border. tsc/gates green is baseline, NOT proof (§18.6).
6. Gates: tsc=0, `check:stories`, `check:i18n` (+N parity), `check:design-tokens`, `check:mojibake` — green.
7. File-integrity (clause 14) transcript for touched files.
8. `docs/backlog.md` Last Session + `docs/sessions/2026-06-27-task495-select.md` (Files Changed table). NO git emitted.

## Hard contract

Scope = `input-chrome.css` (Select resting/focus/error only) + `theme.ts` Select flat props (if any) + new story +
`sel_*` keys + log/backlog. **Owner decisions baked in (no longer open):** resting border = **gray-2**; `<640` dropdown
bottom-sheet = **deferred to Batch C** (do NOT build an overlay wrapper here). **Behavior + responsive = Mantine's**
(do not reimplement). No other component, no token-value change, no overlay wrapper, no event re-handling. Self-validate
before complete (tsc=0 + DevTools selector proof + rendered uk@320 walk).
