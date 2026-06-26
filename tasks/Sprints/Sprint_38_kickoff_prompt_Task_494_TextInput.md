# Task 494 — TextInput (+ input-group) primitive → TailAdmin (P1.02)

**Type:** UI / Storybook (Mantine) — primitive theme refinement + new story
**Sprint:** 38 (MM Phase-1 Batch B — form controls). Run order: 493 → 501 → **494** → 496 → 500 → 495 → 497 → 498 → 499.
**Reference (copy-source):** `docs/tailadmin-style-reference.md` §6 Input row + §6c input-group / leading-trailing affordances.
**Theme:** `src/design-system/mantine/theme.ts` → `components.TextInput` + `components.InputWrapper`.
**Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews rendered side-by-side with the reference; tsc/green ≠ approval).

> **NO product-surface edits in Phase 1.** This task touches ONLY `theme.ts` (TextInput/InputWrapper defaults) +
> a NEW `src/stories/mantine/primitives/TextInput.stories.tsx` + `storybook.mantine.*` i18n keys ×4 locales.

## Pre-read (rule-index → UI/layout/component, Mantine)
- `docs/agent-contract.md` (clauses 1–15) + `docs/backlog.md`
- `docs/critical-flow-registry.md` — **SCAN.** This is a visual-only theme/story change (no validation/submit
  behavior changes), so no registry flow is touched and no regression test is required. **If** you find yourself
  changing input error/validation *behavior* (not just its color/border), STOP — that would touch the auth/listing
  form flows and pull in clause-15. Confirm "visual-only, no registry flow touched" in the session log.
- `docs/mantine-responsive-design-system.md` — §6 theme, §7 mobile gate, §8 Storybook proof path, §12 patterns, §16 gates
- `docs/tailadmin-style-reference.md` §6 + §6c
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/storybook-governance.md`, `docs/qa-rules.md`

## 🔴 Established baselines — DO NOT re-litigate or undo (already landed in theme)
These are committed and are the starting point for this task. Build ON them; do not revert or duplicate:
- **Density (Task 492):** `TextInput` default `radius="lg"` (8px), `size="sm"` (14px text), `styles.input.minHeight:'2.75rem'`
  (44px / TailAdmin `h-11`). Do NOT set `size="md"`; do NOT remove the 44px min-height.
- **Label treatment (Task 501/503):** labels render via `components.InputWrapper.styles.label` = 14px (`font-size-sm`) /
  `fontWeight:500` / `gray-7`. Inputs inherit it — do NOT add a per-instance label style.
- **No required-asterisk (Task 503):** `components.InputWrapper.styles.required = { display:'none' }` globally suppresses
  the `*` for every input. Required inputs show NO asterisk. Optional fields use the localized `(optional)` suffix pattern.
- **Description below input (Task 503, owner P0):** `TextInput.defaultProps.inputWrapperOrder = ['label','input','description','error']`.
  The `description` hint renders BELOW the input for every TextInput consumer. The story's label+description section MUST
  reflect this (hint sits under the field, not above it). Do NOT change `inputWrapperOrder`.
- **Description treatment (Task 503):** `InputWrapper.styles.description` = 12px (`font-size-xs`) / `gray-5`.

## Required values (theme — refine `components.TextInput` chrome to §6; verify against the reference render)
- `radius="lg"` (8), `size="sm"` (14px), input `minHeight:'2.75rem'` — **already set, keep.**
- Border: `gray-2` (`#e4e7ec`) resting border (§6). Set via `styles.input` using a token (`var(--mantine-color-gray-2)`),
  not a raw hex.
- Placeholder color: `gray-4`. Text color: `gray-8`.
- Focus: brand ring — `focus:border-brand-300` + soft `focus:ring-brand-500/10` (ring-3) per §6.
  **🛑 STOP-and-ASK trigger:** Mantine's default focus border is already the primary (brand) color, but the SOFT outer
  RING (box-shadow `ring-brand-500/10`) is not a Mantine default and may not be expressible with theme tokens alone. If you
  cannot achieve the brand focus ring with theme `styles` + `--mantine-color-brand-*` tokens (NO raw hardcoded CSS class
  hack), **STOP and ASK the orchestrator** — do not invent a CSS override. Document what you tried.
- `shadow-xs` resting shadow (§6) if expressible via token; otherwise note and ask.
- Input-group: support `leftSection` / `rightSection` for leading/trailing icons (§6c) — these are Mantine-native props,
  showcase them in the story; no theme change needed beyond confirming icon vertical-centering at 44px.

## Current behavior to preserve (Note 19/20)
- Existing `TextInput` consumers (~4 call sites) keep their explicit props; only the theme default chrome is refined.
- The established baselines above (density, label, no-asterisk, description-below, description style) all keep working.
- `error` slot still renders a red border + message on real validation; `disabled` still dims; focus still moves to the input.

## Positive flow (happy path)
1. `<TextInput label placeholder />` renders 44px tall, 14px text, `gray-2` border, `gray-8` text, `gray-4` placeholder, radius 8.
2. On focus: brand focus treatment (border + soft ring per §6 — or the STOP-and-ASK outcome documented).
3. `<TextInput label leftSection={<Icon/>} />` (input-group): icon vertically centered, text padded clear of the icon.
4. `<TextInput label description />`: label above (14px/fw500/gray-7), input, then `description` hint BELOW (12px/gray-5) — per the
   committed `inputWrapperOrder`.
5. `<TextInput label required />`: label renders with **no asterisk** (Task 503 baseline).
6. Optional field: `<TextInput label={<>{label} <Text span c="gray.5" fz="sm" fw={400}>{(optional)}</Text></>} placeholder description />`
   — quiet `(optional)` suffix + placeholder + hint-below, matching the owner reference (same pattern as the Label story).
7. `fullWidth` / container at `<640`: the input fills the frame edge-to-edge.

## Negative flow (every off-happy-path branch)
- **Error state:** `<TextInput error={message} />` → red border + red message text + `aria-invalid`; message localized via `storyT()`.
- **Disabled:** `<TextInput disabled />` → dimmed input + dimmed label (no bright label over a greyed field), no focus ring, no pointer.
- **Required-empty:** required input with no value still shows NO asterisk and no spurious error until validated.
- **Long uk label / placeholder:** a long `uk` label and placeholder wrap (`whitespace-normal break-words`), no clip, **no
  horizontal scroll at 320**; the input stays full-width.
- **Long description:** a long `uk` description hint wraps below the input, no clip, no h-scroll@320.

## Mobile <640 full-width gate (OWNER P0 — MANDATORY)
- The TextInput container/control is **full-width at `<640`** (`max-sm`) — never content-width or fixed-width.
- Touch target ≥44px (the 44px input min-height already satisfies this; the rem exemption is allowlisted theme input).
- Labels, placeholders, descriptions, and error messages **wrap** in all four locales (sq/en/uk/it); no clip, no overflow,
  no horizontal scroll at 320.
- No popup/overlay in scope for TextInput (icons are inline `leftSection`/`rightSection`) → no bottom-sheet rule applies here.
  If a wrapped input-group introduces any overlay, STOP and ASK.

## Story (Mantine proof path — single `Default` export)
- New file: `src/stories/mantine/primitives/TextInput.stories.tsx`.
- `parameters: { skipCanvas: true, layout: 'fullscreen' }`; ONE `export const Default`; toolbar-driven viewport + locale
  (`context.globals.locale`); strings via `storyT(locale, 'storybook.mantine.<key>')`. NO `layout:'centered'/'padded'`, NO
  `Ukrainian*` export, NO locale pin, NO raw `<input>`.
- Canvas wrapper: `<Box px={{ base:'md', sm:'xl' }} py="md"><Stack gap="xl"> … </Stack></Box>` (same shell as the Label story).
- Sections (each preceded by a small `Text size="xs" c="gray.5"` caption, like the Label story):
  1. **basic** — label + placeholder (default chrome, brand focus).
  2. **input-group** — label + `leftSection` icon (+ optional `rightSection`).
  3. **label + description** — proves the hint renders BELOW the input.
  4. **optional** — `(optional)` suffix + placeholder + description (owner reference pattern).
  5. **error** — red border + localized message.
  6. **disabled** — dimmed.
  7. **long-label (negative)** — long uk label/placeholder, wraps ≥2 lines at 320, no clip/h-scroll.
- New i18n keys under `storybook.mantine.*` (×4 locales, full parity) — propose concise keys, e.g.:
  `ti_label`, `ti_placeholder`, `ti_description`, `ti_optional` (reuse existing `label_optional` if identical — prefer reuse),
  `ti_icon_label`, `ti_error`, `ti_long_label`. Reuse existing keys where the string is genuinely identical; do not duplicate.

## Acceptance criteria (each maps to a flow above; verifiable in diff + render)
- **AC1 (theme chrome):** `components.TextInput` renders §6 values — `gray-2` border, `gray-4` placeholder, `gray-8` text,
  44px/14px/radius-8 — verified in the render; every value a token, **zero raw hex/px** (allowlisted rem exemptions only).
- **AC2 (focus):** brand focus treatment present (Positive flow step 2) OR the STOP-and-ASK outcome is documented with what was tried.
- **AC3 (input-group):** `leftSection` icon vertically centered at 44px, text cleared (Positive flow step 3).
- **AC4 (baselines intact):** no asterisk on `required`; description renders BELOW the input; label = 14px/fw500/gray-7;
  description = 12px/gray-5 — all proven in the render (Positive flow steps 4–5).
- **AC5 (negative flows):** error (red + message + `aria-invalid`), disabled (dimmed label+input), long-uk-wrap, long-description-wrap
  — each present in the diff and the render.
- **AC6 (Mobile <640 gate):** input full-width `<640`; all text wraps sq/en/uk/it; no h-scroll@320.
- **AC7 (RENDERED PROOF — the verdict, NOT tsc):** screenshot matrix attached — **uk@320 / uk@375 / uk@390 mandatory**, plus
  sq@320 + en@320 + it@320 and at least one ≥480 cell — showing basic + input-group + label/description-below + optional +
  error + disabled + long-label-wrap. A green `tsc`/`check:stories` is baseline only and does NOT close this task.
- **AC8 (gates):** `tsc=0`, `check:stories` (storybook.* parity ×4), `check:i18n` (4-locale parity preserved), `check:design-tokens` 0,
  file-integrity clean (read-back every written file; 0 NUL, parses, not truncated).
- **AC9 (governance):** `docs/backlog.md` + session log under `docs/sessions/` updated; **Files Changed table** (one row per
  touched path + 1-line rationale); registry-scan note ("visual-only, no critical flow touched"). **Executor emits NO
  `git add`/`git commit`** — the orchestrator emits the commit after diff + rendered-proof review.

## Hard contract (verified against the diff on return)
No scope change (theme + one story + i18n keys only; no product-surface edits). No invented architecture — if the brand
focus ring (or `shadow-xs`) is not token-expressible, **STOP and ASK**, do not hardcode CSS. Execute the AC literally.
Self-validate before "complete" (tsc=0, AC-by-AC self-audit table, read-back integrity, walk the story at uk@320 end-to-end).
Preserve all existing controls and flows. 4-locale parity (sq/en/uk/it), same key set. Single `Default` story on the Mantine
proof path. Files Changed table present; no executor git.
