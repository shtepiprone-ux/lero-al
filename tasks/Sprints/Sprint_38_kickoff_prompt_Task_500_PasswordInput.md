# Task 500 — PasswordInput primitive → TailAdmin (Sprint 38, P1.30)

> **Type:** UI / component (Mantine theme + `input-chrome.css` extension + new story).
> **Run-order:** 493 → 501 → 494 → 496 → **500** ← here → 495 → 497 → 498 → 499.
> **Builds on:** Task 494 (TextInput chrome) + Task 505 (the `input-chrome.css` border/error fix). PasswordInput
> shares TextInput's input chrome — but its DOM differs, so the chrome must be wired to PasswordInput's OWN slot
> classes or the error/focus border will silently not apply (this is the exact trap that caused 496/494-R rejections).

## Pre-read (Sprint 38 shared bundle)

`docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan),
`docs/mantine-responsive-design-system.md` (§7 mobile gate, §8 Storybook proof, §12 patterns),
`docs/tailadmin-style-reference.md` §6/§6d, `docs/storybook-governance.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## Shared DoD (Sprint 38 — applies; do not restate, comply)

Zero hardcode (theme tokens only; the sole raw-rem exemption is `minHeight:'2.75rem'`); `storyT()` ×4 locales;
Mantine proof path (`parameters.skipCanvas:true` + `layout:'fullscreen'`, single `Default` export, toolbar-driven
viewport+locale, `storybook.mantine.*` namespace); rendered in `Box px={{base:'md',sm:'xl'}} py="md"`; gates green
(tsc=0, check:stories, check:i18n, check:design-tokens); NO product-surface edits; Files Changed table; executor emits NO git.

## 🔴 CRITICAL — Mantine PasswordInput DOM (confirmed against `@mantine/core` v8 source; DevTools-verify before relying)

PasswordInput is NOT a plain input. Its slots:
- **`.mantine-PasswordInput-input`** = the OUTER bordered box (`Input` root). **The border, resting shadow, and the
  `data-error` attribute live HERE.** It focuses via **`:focus-within`** (the box itself is not `:focus`-able).
- **`.mantine-PasswordInput-innerInput`** = the actual `<input>` (`border:0`, transparent bg). **The placeholder lives
  HERE** — `.mantine-PasswordInput-input::placeholder` would target nothing.
- **`.mantine-PasswordInput-visibilityToggle`** = the reveal/hide `ActionIcon` (rightSection).

**Mandatory runtime confirmation (Task 505 lesson):** before writing CSS, open the PasswordInput error story in the
browser, inspect the element, and CONFIRM (paste evidence in the session log): (a) `data-error="true"` sits on
`.mantine-PasswordInput-input`; (b) the focused state matches `:focus-within` on that box; (c) placeholder is on
`.mantine-PasswordInput-innerInput`. If any differs, target the real attribute/slot — do NOT ship against an assumption.

## The fix — extend `src/design-system/mantine/input-chrome.css` (do NOT use inline `theme.ts` styles for border)

Append PasswordInput rules mirroring the TextInput/Textarea block, but with the PasswordInput slot classes and
`:focus-within`:

```css
/* PasswordInput — border/shadow/error on the OUTER .input box; focus is :focus-within; placeholder on innerInput */
.mantine-PasswordInput-input {
  border-color: var(--mantine-color-gray-2);
  box-shadow: var(--mantine-shadow-xs);
}
.mantine-PasswordInput-innerInput::placeholder {
  color: var(--mantine-color-gray-4);
}
.mantine-PasswordInput-input:focus-within {
  border-color: var(--mantine-color-brand-3);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--mantine-color-brand-5) 10%, transparent);
}
.mantine-PasswordInput-input[data-error],
.mantine-PasswordInput-input[data-error]:focus-within {
  border-color: var(--mantine-color-red-6);
  box-shadow: none;
}
```

Tokens only (no raw hex). The file is already imported after `@mantine/core/styles.css` in `layout.tsx` + `preview.tsx`
(Task 505) — no new import needed. Do NOT add `borderColor`/`boxShadow`/`&:focus`/`&::placeholder`/`&[data-error]` to
`theme.components.PasswordInput.styles` — inline styles freeze the cascade (the proven 496/505 failure mode).

> **Note for the orchestrator (do NOT act on it in this task):** TextInput, Textarea, PasswordInput, Select all share
> `.mantine-Input-input`. A future consolidation could collapse these per-component rules into one `.mantine-Input-input`
> base + per-component placeholder/focus exceptions. That is a separate decision — OUT OF SCOPE for Task 500. Keep the
> explicit per-component selectors here.

## theme.ts — `components.PasswordInput`

Add a `PasswordInput` block mirroring TextInput's NON-border props only: `defaultProps: { radius:'lg', size:'sm',
inputWrapperOrder:['label','input','description','error'] }` and `styles:{ input:{ minHeight:'2.75rem',
color:'var(--mantine-color-gray-8)' } }` (44px touch box + gray-8 text — flat, no state conflict). The reveal toggle
`ActionIcon` must present a **≥44px touch target** and a **localized `aria-label`** via `t()` (visibilityToggleButtonProps
or the story's `visibilityToggleIcon`/`ActionIcon` — keep it ≥44px; if Mantine's default toggle can't reach 44px without
a product-surface change, STOP and ASK rather than hardcode).

## Current behavior to preserve

This is a Phase-1 primitive+story task — **no product-surface edits.** The product `PasswordInput` /
`PasswordRequirementsHint` strength/criteria logic is untouched (visual-only migration is a later phase).

## Requirements-hint rules — REUSE the canonical source (owner directive 2026-06-27)

The password creation/validation rules already exist — **do NOT invent new criteria or new rule strings.** Source them from:
- **Logic:** `src/lib/passwordRules.ts` → import the pure helpers `checkPasswordRules(value)` / `allPasswordRulesMet(value)`.
  These are framework-agnostic (no JSX, no product surface), so importing them is allowed and required. The five canonical
  rules are: **length ≥ 8 · uppercase `[A-Z]` · lowercase `[a-z]` · digit `[0-9]` · special `[!@#$%*=]`.** Do not add,
  remove, or reorder them.
- **Strings:** reuse the EXISTING `auth` namespace keys (already in all four locales) — `auth.password_rule_length`,
  `auth.password_rule_uppercase`, `auth.password_rule_lowercase`, `auth.password_rule_digit`, `auth.password_rule_special`,
  and `auth.password_requirements_error`. Read them in the story via `storyT(locale, 'auth.password_rule_length')` etc.
  **Add NO new `pw_*` keys for the rule rows** — they already exist; new keys are only for field-level labels (see Story).

Render the hint **Mantine-natively** (this is a primitive-story task — do NOT import the shadcn product component
`PasswordRequirementsHint.tsx`): a `Stack gap="xs"` of rows, each `Group gap="xs"` with a met/unmet icon and
`Text size="sm"`. **Met = `c="green.6"`, unmet = `c="gray.5"`** (tokens; mirrors the product's success/muted intent).
Reuse the product's icon convention (lucide `Check` when met / `X` when unmet, `aria-hidden`). Drive met/unmet state from
`checkPasswordRules()` against a small set of demo values so the story shows a realistic mix of met and unmet rows.

## Positive flow

PasswordInput renders TextInput input chrome (gray-2 border, 44px, radius lg, shadow-xs, gray-8 text, gray-4 placeholder)
+ a reveal/hide `ActionIcon` rightSection (≥44px, localized aria-label). Toggling reveals/masks the value. The
requirements-hint rows render met (green) / unmet (gray-5). Focus (`:focus-within`) → brand-3 border + brand-5/10 ring.

## Negative flow

- **Error:** `error` prop set → `data-error` on `.mantine-PasswordInput-input` → **red-6 border, no shadow**, red message
  below; reveal toggle still operable; label unchanged; input text/placeholder stay neutral (match TextInput error decision).
- **Error + focus:** red border stays (error selector outranks `:focus-within`).
- **Disabled:** dimmed box + dimmed toggle, no focus ring, no pointer, no red.
- **Resting:** gray-2 border, no red leak.
- **Long uk hint:** requirement rows wrap, no clip / no h-scroll at 320.
- **Full-width `<640`:** the PasswordInput fills the frame edge-to-edge at 320/375/390.

## Mobile <640 full-width gate (OWNER P0)

PasswordInput full-width edge-to-edge at <640; reveal toggle ≥44px touch; hint rows + labels wrap (sq/en/uk/it); no clip,
no h-scroll at 320. Mantine-native proof path (no `layout:'centered'/'padded'`). Toggle is icon-only → the ONLY exempt
control (document it).

## Story — `src/stories/mantine/primitives/PasswordInput.stories.tsx`

Single `Default` export, mirror `Textarea.stories.tsx` structure. Sections: (1) basic password + reveal toggle +
description-below; (2) with requirements-hint driven by `checkPasswordRules()` over a demo value showing a mix of met/unmet
(rule strings from the existing `auth.password_rule_*` keys); (3) **error** (red border — the cell that must prove the fix);
(4) disabled. **Rule-row strings reuse `auth.password_rule_*` / `auth.password_requirements_error` (no new keys).** Only
FIELD-LEVEL strings get new `storybook.mantine.pw_*` keys: password field label, placeholder, reveal/hide `aria-label`,
and the section captions. Add those `pw_*` keys to ALL FOUR locales (`messages/en|sq|uk|it.json`) — same key set, identical
count delta. uk values proper Cyrillic; the longest `auth.password_rule_*` uk string must wrap (no clip/h-scroll at 320).

## Acceptance criteria

1. `input-chrome.css` extended with the four PasswordInput rules above (tokens only); border/error/focus/placeholder
   target the correct slots (`-input` for border/error, `-innerInput` for placeholder, `:focus-within` for focus).
2. Runtime DevTools confirmation pasted in the session log (data-error slot, focus-within, innerInput placeholder).
3. `theme.ts` `components.PasswordInput` added (radius/size/inputWrapperOrder + `minHeight`/`color` only — NO border keys).
4. Reveal toggle ≥44px + localized aria-label; icon-only exemption documented.
5. New `PasswordInput.stories.tsx` (single `Default`, 4 sections, Mantine proof path). Requirements-hint reuses
   `checkPasswordRules` from `@/lib/passwordRules` + the existing `auth.password_rule_*` keys (NO new rule keys/criteria).
   Only field-level `storybook.mantine.pw_*` keys added — ×4 locales, parity.
6. **RENDERED PROOF (clause 12/13 — THE deliverable):** machine matrix for the PasswordInput story — 320/375/390/768/1280
   × sq/en/uk/it, **uk@320/375/390 mandatory** — each error cell showing the **red border in actual pixels**, plus a
   resting cell (gray, no leak) and a focus cell (brand ring via `:focus-within`). tsc/check:stories green is baseline, NOT proof.
7. **Planted-violation transcript:** temporarily break the `[data-error]` PasswordInput rule, capture the error cell going
   gray, revert — proves the gate is real.
8. Gates: tsc=0, check:stories, check:i18n (+N keys ×4, parity), check:design-tokens — all green in transcript.
9. File-integrity (clause 14): every touched file 0 NUL, no BOM, parses/compiles, not truncated — paste transcript.
10. `docs/backlog.md` Last Session + `docs/sessions/2026-06-27-task500-passwordinput.md` updated; Files Changed table present.
    Do NOT emit `git add`/`git commit` — the orchestrator emits commits at review.

## Critical-flow note

Presentation-only primitive; scan `docs/critical-flow-registry.md`. If no row covers input error styling, clause 15
mandates no new unit test — AC-6 rendered proof + AC-7 planted-violation are the required evidence. Do not invent a
registry row; STOP and ASK if you think one is warranted.

## Hard contract

Scope = `input-chrome.css`, `theme.ts` (PasswordInput block), new story, `pw_*` locale keys, session log/backlog. No
product-surface edits, no other component blocks, no architecture beyond the above. STOP-and-ASK triggers: brand
focus-ring not achievable with tokens alone; reveal toggle can't reach 44px without a product edit; requirements-hint
needs the real product component. Self-validate before "complete" (tsc=0 + AC table + rendered run + uk@320 walk). The
bar for approval is the rendered red-border (and brand focus-within) proof at uk@320 — nothing less.
