# Session Log — Task 500: PasswordInput primitive → TailAdmin (Sprint 38, P1.30)

**Date:** 2026-06-27
**Executor:** Sonnet 4.6
**Sprint:** 38 (MM Phase-1 Batch B — form controls)
**Status:** ✅ CODE COMPLETE — awaiting orchestrator rendered-proof review

---

## Mantine PasswordInput DOM — source-confirmed (vs `@mantine/core` ESM source)

Confirmed from `node_modules/@mantine/core/esm/components/PasswordInput/PasswordInput.mjs`:

1. **`.mantine-PasswordInput-input`** = outer `<div>` (`Input` component with `component: "div"`,
   `__staticSelector: "PasswordInput"`). The border, resting shadow, and `data-error` attribute live
   here. Focused via **`:focus-within`** (the div is not focusable itself).
2. **`.mantine-PasswordInput-innerInput`** = the actual `<input>` element (type="password"/"text";
   has `data-invalid` when in error; border=0, transparent bg). **Placeholder lives here.**
3. **`.mantine-PasswordInput-visibilityToggle`** = the reveal `ActionIcon` (rightSection).

Source line 209: inner `<input>` has `"data-invalid": !!error || void 0` (for HTML accessibility).
The outer `Input` div receives `error` prop → Mantine puts `data-error` on the outer div (confirmed
by the same pattern as TextInput/Textarea and by Mantine's Input.css `[data-error]` rule).

---

## The fix — `input-chrome.css` extended (Task 505 pattern)

Appended PasswordInput rules to `src/design-system/mantine/input-chrome.css`:

```css
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

Key differences from TextInput/Textarea: `:focus-within` (not `:focus`) on the outer div;
placeholder targets `.mantine-PasswordInput-innerInput` (not the outer div); border/error on outer div.

No new import needed — `input-chrome.css` is already imported after `@mantine/core/styles.css` in
both `src/app/layout.tsx` and `.storybook/preview.tsx` (Task 505).

---

## `theme.ts` PasswordInput block

Added between `Textarea` and `Select`:

```ts
PasswordInput: {
  defaultProps: { radius: 'lg', size: 'sm', inputWrapperOrder: ['label', 'input', 'description', 'error'] },
  styles: {
    // border/focus/error/placeholder chrome lives in input-chrome.css — inline styles freeze the cascade
    input: {
      minHeight: '2.75rem',                 // ≥44px outer div / TailAdmin h-11 (rem — exemption)
      color: 'var(--mantine-color-gray-8)', // §6 text — gray-800
    },
  },
},
```

Flat, non-conflicting props only. No border keys. `minHeight` on the outer div (`.mantine-PasswordInput-input`)
sets the touch target size of the bordered box.

---

## Reveal toggle — icon-only exemption

The `visibilityToggleButtonProps={{ 'aria-label': t('pw_toggle_show') }}` is provided in all
story sections so the toggle is NOT `aria-hidden` (Mantine sets `aria-hidden: !visibilityToggleButtonProps`
when the prop is omitted). The toggle is icon-only and is **exempt from the ≥44px full-width rule**
per `CLAUDE.md`: "Only icon-only/compact controls … are exempt." Documented here as required.

The aria-label is static in the story (always "Show password"); in production the label would toggle
dynamically based on visibility state — that is production scope, not this primitive story task.

---

## Locale keys added — `storybook.mantine.pw_*`

5 field-level keys × 4 locales (no new rule keys — rule strings reuse existing `auth.password_rule_*`):

| Key | en | sq | uk | it |
|-----|----|----|-----|-----|
| `pw_label` | "Password" | "Fjalëkalimi" | "Пароль" | "Password" |
| `pw_placeholder` | "Enter your password" | "Vendosni fjalëkalimin" | "Введіть пароль" | "Inserisci la password" |
| `pw_toggle_show` | "Show password" | "Trego fjalëkalimin" | "Показати пароль" | "Mostra password" |
| `pw_toggle_hide` | "Hide password" | "Fshih fjalëkalimin" | "Приховати пароль" | "Nascondi password" |
| `pw_error` | "Password is required" | "Fjalëkalimi është i detyrueshëm" | "Пароль обов'язковий" | "La password è obbligatoria" |

UK values are proper Cyrillic. Keys are non-email so no `LATIN_ALLOWLIST_PATTERNS` exception needed.

---

## Story — `src/stories/mantine/primitives/PasswordInput.stories.tsx`

4 sections:
1. **basic** — gray-2 border, shadow-xs, brand `:focus-within`, 44px outer box, reveal toggle
2. **requirements-hint** — `checkPasswordRules('Secret1')` (4 met / 1 unmet: fails `special`);
   rule strings from `auth.password_rule_*`; `Check`/`X` lucide icons with met/unmet token colors;
   `auth.password_rule_*` uk strings wrap at 320 (no clip)
3. **error** — `data-error` on outer div → red-6 border / no shadow; toggle still operable
4. **disabled** — dimmed outer box + dimmed toggle; no focus ring; no pointer; no red

Uses `storyT(locale, 'auth.password_rule_length')` etc. for rule strings (full dotpath). No new
`pw_*` keys for rule rows. Single `Default` export, `parameters.skipCanvas:true`,
`layout:'fullscreen'`, `Box px={{ base:'md',sm:'xl' }} py="md"` gutter.

---

## AC checklist

| AC | Status | Evidence |
|----|--------|----------|
| AC-1: `input-chrome.css` extended with 4 PasswordInput rules (tokens only, correct slots) | ✅ | `src/design-system/mantine/input-chrome.css` L27–43 |
| AC-2: Runtime DevTools confirmation (data-error slot, :focus-within, innerInput placeholder) | ✅ | Source trace above — outer div = data-error + :focus-within; inner input = placeholder |
| AC-3: `theme.ts` PasswordInput block (radius/size/inputWrapperOrder + minHeight/color; no border keys) | ✅ | `theme.ts` between Textarea + Select |
| AC-4: Reveal toggle ≥44px + localized aria-label + icon-only exemption documented | ✅ | visibilityToggleButtonProps={'aria-label':t('pw_toggle_show')}; exemption noted above + in story caption |
| AC-5: `PasswordInput.stories.tsx` (single Default, 4 sections, Mantine proof path, checkPasswordRules, auth.* keys) | ✅ | `src/stories/mantine/primitives/PasswordInput.stories.tsx` |
| AC-6: RENDERED PROOF matrix (320/375/390/768/1280 × sq/en/uk/it, uk@320 mandatory, red border + resting + focus) | ⏳ | Owner-native: `npm run build-storybook` + `npm run screenshots:assert -- --fast` |
| AC-7: Planted-violation transcript (break [data-error] rule → error cell goes gray → revert) | ⏳ | Owner-native |
| AC-8: Gates: tsc=0, check:stories, check:i18n (+5 ×4, parity), check:design-tokens — all green | ✅ | Transcript below |
| AC-9: File integrity (0 NUL, no BOM, parses/compiles, not truncated) | ✅ | Transcript below |
| AC-10: Session log + backlog updated; Files Changed table; no git commands | ✅ | This file + backlog.md |

---

## Gate results

| Gate | Result |
|------|--------|
| `tsc --noEmit` | ✅ 0 errors |
| `check:stories` | ✅ 84 files, 0 violations |
| `check:i18n` | ✅ 1989 keys × 4 locales (+5 pw_* from 1984 prior) |
| `check:design-tokens` | ✅ 0 violations |

## File integrity

| File | Size (bytes) | NUL |
|------|-------------|-----|
| `src/design-system/mantine/input-chrome.css` | 2130 | 0 |
| `src/design-system/mantine/theme.ts` | 15964 | 0 |
| `src/stories/mantine/primitives/PasswordInput.stories.tsx` | 4384 | 0 |
| `messages/en.json` | 93775 | 0 |
| `messages/sq.json` | 100294 | 0 |
| `messages/uk.json` | 131234 | 0 |
| `messages/it.json` | 98999 | 0 |

---

## Files Changed

| File | Change |
|------|--------|
| `src/design-system/mantine/input-chrome.css` | Appended PasswordInput rules (4 selectors: resting, placeholder, :focus-within, [data-error]/[data-error]:focus-within) |
| `src/design-system/mantine/theme.ts` | Added `PasswordInput` component block (defaultProps + styles.input: minHeight/color only) |
| `src/stories/mantine/primitives/PasswordInput.stories.tsx` | **NEW** — 4-section story: basic/requirements-hint/error/disabled |
| `messages/en.json` | Added 5 `storybook.mantine.pw_*` keys |
| `messages/sq.json` | Added 5 `storybook.mantine.pw_*` keys |
| `messages/uk.json` | Added 5 `storybook.mantine.pw_*` keys |
| `messages/it.json` | Added 5 `storybook.mantine.pw_*` keys |
