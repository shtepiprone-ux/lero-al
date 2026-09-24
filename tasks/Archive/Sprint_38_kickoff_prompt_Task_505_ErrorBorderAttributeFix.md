# Task 505 — Mantine input error-border fix (TextInput + Textarea), v2 CORRECTED — Sprint 38

> **Type:** UI / component (Mantine theme + a new scoped CSS file).
> **Status of prior attempts:** Task 496 + 494-R added an error override INSIDE `theme.components.*.styles.input`.
> It never rendered. The owner re-rejected with DevTools proof (2026-06-27). The orchestrator's earlier
> "use `[data-error]` not `[data-invalid]`" advice was ALSO wrong — same reason. Read the root cause below
> in full; do not repeat either dead approach.

## Pre-read (rule-index → UI/component bundle)

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan).
**Required:** `docs/mantine-responsive-design-system.md` (FIRST — Mantine = source of truth; §7 mobile gate,
§8 Storybook proof path, §16 acceptance gates), `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## ROOT CAUSE — confirmed against Mantine v8 source + owner DevTools (do not re-debate)

1. **Mantine v8 applies `theme.components.X.styles` as INLINE styles** on each slot element. The owner's
   DevTools shows the input with `style="min-height:2.75rem; border-color: var(--mantine-color-gray-2);
   box-shadow: var(--mantine-shadow-xs);"`. An **inline** `border-color` has higher priority than ANY
   stylesheet rule (Mantine's base `border: … solid var(--input-bd)` AND its `[data-error]` rule). So the
   border is frozen gray in every state. Toggling that inline `border-color` off in DevTools → the border
   immediately turns red (Mantine's `[data-error]` rule then sets `--input-bd: var(--mantine-color-error)`).
2. **Nested selector keys inside an inline `styles` object are never emitted.** `'&:focus'`,
   `'&::placeholder'`, `'&[data-error]'`, `'&[data-invalid]'` cannot exist as inline styles, so Mantine
   drops them. That means the existing focus/placeholder overrides AND every error-selector attempt
   (`[data-invalid]` and `[data-error]` alike) were dead from the start.
3. Mantine border facts (`node_modules/@mantine/core/styles/Input.css`): the input border is
   `border: … solid var(--input-bd)` (L162); resting `--input-bd: var(--mantine-color-gray-4)` via
   `[data-mantine-color-scheme='light'] .m_6c018570[data-variant='default']` (L99, specificity 0,3,0);
   error `--input-bd: var(--mantine-color-error)` via `.m_6c018570[data-error]` (L135/139); focus
   `--input-bd: var(--input-bd-focus)` (L194). Stable slot classes exist: the DOM shows
   `class="m_8fb7ebe7 mantine-Input-input mantine-TextInput-input"` (Textarea analogously emits
   `mantine-Textarea-input` — **confirm this at runtime before relying on it**).

**Conclusion:** the border override must live in a STYLESHEET (so `:focus` / `[data-error]` work) and must set
`border-color` **directly** on a stable class (so it bypasses the `--input-bd` variable cascade and we control
every state ourselves). It must NOT stay in inline `styles`.

## The fix — exactly this, no improvisation

### Step 1 — new file `src/design-system/mantine/input-chrome.css`

Create it with these rules (tokens only — no raw hex; passes `check:design-tokens`). Both controls share
the same per-state border treatment:

```css
/* Task 505 — TextInput/Textarea border chrome via stylesheet so the error/focus cascade works.
   Border-color is set DIRECTLY here (not via Mantine's --input-bd) and must NOT be set in
   theme.components.*.styles.input (inline styles freeze the border + drop state selectors). */
.mantine-TextInput-input,
.mantine-Textarea-input {
  border-color: var(--mantine-color-gray-2);          /* §6 resting border — gray-200 */
  box-shadow: var(--mantine-shadow-xs);               /* §5 resting subtle shadow */
}
.mantine-TextInput-input::placeholder,
.mantine-Textarea-input::placeholder {
  color: var(--mantine-color-gray-4);                 /* §6 placeholder — gray-400 */
}
.mantine-TextInput-input:focus,
.mantine-Textarea-input:focus {
  border-color: var(--mantine-color-brand-3);         /* §6 focus border — brand-300 */
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--mantine-color-brand-5) 10%, transparent);
}
.mantine-TextInput-input[data-error],
.mantine-Textarea-input[data-error],
.mantine-TextInput-input[data-error]:focus,
.mantine-Textarea-input[data-error]:focus {
  border-color: var(--mantine-color-red-6);           /* §6 ERROR border — error-600 (#d92d20) */
  box-shadow: none;
}
```

**Specificity rationale (verify, do not change):** our resting `.mantine-TextInput-input` (0,1,0) ties
Mantine's `.m_8fb7ebe7` border shorthand (0,1,0) and wins by later import order → gray-2 at rest.
`[data-error]` (0,2,0) > resting (0,1,0) AND > `:focus` (0,1,1) → red wins in error and error+focus.
`:focus` (0,1,1) > resting (0,1,0) → brand border on focus when not in error. Because we set `border-color`
directly, Mantine's (0,3,0) `--input-bd` rules are irrelevant (we no longer read `--input-bd` for color).

### Step 2 — import the file AFTER `@mantine/core/styles.css` in BOTH entry points

- `src/app/layout.tsx` — insert `import '@/design-system/mantine/input-chrome.css'` (or correct relative
  path) immediately AFTER line 6 (`import '@mantine/core/styles.css'`), before `globals.css`.
- `.storybook/preview.tsx` — insert the same import immediately AFTER line 11 (`import '@mantine/core/styles.css'`),
  before `globals.css`.

### Step 3 — strip the now-dead inline overrides from `theme.ts`

In `src/design-system/mantine/theme.ts`:
- `components.TextInput.styles.input`: REMOVE `borderColor`, `boxShadow`, `'&::placeholder'`, `'&:focus'`,
  and the `'&[data-invalid]'` line. KEEP `minHeight: '2.75rem'` and `color: 'var(--mantine-color-gray-8)'`
  (flat, no state conflict). `defaultProps` (radius/size/inputWrapperOrder) unchanged.
- `components.Textarea.styles.input`: REMOVE the same five keys. Textarea has no `minHeight`; keep
  `color: 'var(--mantine-color-gray-8)'`. If the block becomes `{ color: … }` only, that is fine; do NOT
  delete `defaultProps`.
- Add a one-line comment in each block: `// border/focus/error/placeholder chrome lives in input-chrome.css (Task 505) — inline styles freeze the cascade`.

Do not touch any other component block, any locale file (NO key changes), or any product consumer
(`@/components/ui/*` shadcn inputs are unaffected).

## Current behavior to preserve

Resting gray-2 border, gray-8 text, shadow-xs, gray-4 placeholder, brand-3 focus border + brand-5/10 ring,
TextInput 44px min-height, Textarea free-growing height, `inputWrapperOrder` (description below). The ONLY
behavior that CHANGES is the one that's currently broken: the **error state now shows a red (`red-6`) border**.

## Error-state appearance decision (orchestrator call — flag if owner disagrees)

On error: **border red-6, error message text red (Mantine default), label unchanged, and input text +
placeholder stay neutral** (gray-8 / gray-4 — preserved by Step 1 + the retained inline `color`). This matches
the story's own written contract ("red border + red message text; label unchanged"). If the owner wants FULL
Mantine error styling (red input text + red placeholder too), that is a one-line change — STOP and ASK before
shipping if unsure.

## Positive flow

Field with `error` set → Mantine puts `data-error` on the input → `input-chrome.css` `[data-error]` rule →
**red border, no resting shadow**, at every breakpoint × locale. Message text red; label unchanged.

## Negative flow

- **Resting (no error):** `[data-error]` absent → gray-2 border; red must NOT leak in.
- **Focus, no error:** brand-3 border + ring.
- **Focus, in error:** red border stays (error selector outranks focus) — verify visually.
- **Disabled:** dimmed, no focus ring, no red — Mantine default preserved.
- **Both components independently:** prove TextInput AND Textarea separately.

## Mobile <640 full-width gate (OWNER P0)

Color-only change, but rendered proof must still show both error inputs full-width edge-to-edge at 320/375/390,
labels wrapping (sq/en/uk/it), no clip, no h-scroll at 320; Mantine-native proof path (no `layout:'centered'/'padded'`).

## Acceptance criteria

1. `input-chrome.css` created with the exact rules above (tokens only, no raw hex).
2. Imported after `@mantine/core/styles.css` in BOTH `src/app/layout.tsx` and `.storybook/preview.tsx`.
3. `theme.ts` TextInput + Textarea `styles.input` stripped of the five dead keys; `minHeight`/`color` retained as specified.
4. **Runtime confirmation** that `mantine-Textarea-input` is the real Textarea slot class (paste the DOM/inspector evidence); if Mantine emits a different class, target the real one.
5. **RENDERED PROOF (clause 12/13 — THE deliverable):** machine-produced matrix for the TextInput AND Textarea
   **error** stories — 320/375/390/768/1280 × sq/en/uk/it, **uk@320/375/390 mandatory** — each cell showing the
   **red error border in the actual pixels**, plus one resting + one focus cell proving no red leak / brand focus.
   tsc/`check:stories` green is a baseline, NOT proof. "No browser / owner QA" does NOT close this.
6. **Planted-violation transcript:** temporarily re-add inline `borderColor: gray-2` to `theme.ts` (or remove
   the `[data-error]` rule) and capture the rendered error cell going gray — proves the proof is real — then revert.
7. Gates: tsc=0, `npm run check:stories`, `npm run check:i18n` (count UNCHANGED), `npm run check:design-tokens`,
   rendered-assert run — all green in transcript.
8. File-integrity (clause 14): every touched file 0 NUL, no BOM, parses/compiles, not truncated — paste transcript.
9. `docs/backlog.md` Last Session + a `docs/sessions/` log updated; session log has the **Files Changed** table.
   Do NOT emit `git add`/`git commit` — the orchestrator emits commit commands at review.

## Critical-flow note

Input error styling is presentation-only. Scan `docs/critical-flow-registry.md`; if no row covers it, clause 15
mandates no new unit test here — the AC-5 rendered proof + AC-6 planted-violation transcript ARE the required
evidence. Do not invent a registry row; STOP and ASK if you think one is warranted.

## Hard contract

No scope beyond the three files (`input-chrome.css`, `theme.ts`, the two import lines) + the session log/backlog.
No architecture beyond what's specified here. No locale-key changes. Self-validate before "complete"
(tsc=0 + AC table + rendered run + uk@320 walk). The owner has rejected this twice — the rendered red-border
proof at uk@320 is the bar for approval, nothing less.
