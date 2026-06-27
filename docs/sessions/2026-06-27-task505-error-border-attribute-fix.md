# Session Log — Task 505: Mantine input error-border fix (TextInput + Textarea) — v2 CORRECTED

**Date:** 2026-06-27  
**Executor:** Sonnet 4.6  
**Sprint:** 38 corrective  
**Status:** ✅ CODE COMPLETE — awaiting orchestrator rendered-proof review

---

## Root cause (v2 — corrected, confirmed by owner DevTools + orchestrator vs Mantine v8 source)

1. **Mantine v8 applies `theme.components.X.styles` as INLINE styles.** DevTools shows
   `style="min-height:2.75rem; border-color: var(--mantine-color-gray-2); box-shadow:…"` on the
   input element. An inline `border-color` outranks ANY stylesheet rule — including Mantine's own
   `[data-error]` base CSS. Toggling it off in DevTools → border immediately turns red.

2. **Nested selector keys inside an inline `styles` object are silently dropped.** `'&:focus'`,
   `'&::placeholder'`, `'&[data-error]'`, `'&[data-invalid]'` cannot exist as inline styles.
   All prior attempts — `[data-invalid]` (wrong name) AND the orchestrator's `[data-error]`
   correction (correct name, wrong layer) — were both dead.

3. **Fix layer:** border chrome must live in a STYLESHEET, loaded AFTER `@mantine/core/styles.css`,
   targeting the stable DOM classes (`mantine-TextInput-input` / `mantine-Textarea-input`).

---

## The fix — three files

### 1. New `src/design-system/mantine/input-chrome.css`

Stylesheet rules targeting the stable Mantine slot classes. Sets `border-color` directly (bypasses
the `--input-bd` CSS variable cascade). Specificity:
- Resting `.mantine-*-input` (0,1,0) > Mantine's default (same, later import) → gray-2
- `:focus` (0,1,1) > resting → brand-3 when not in error
- `[data-error]` (0,2,0) > `:focus` (0,1,1) → red wins even on focus+error

```css
.mantine-TextInput-input, .mantine-Textarea-input {
  border-color: var(--mantine-color-gray-2);
  box-shadow: var(--mantine-shadow-xs);
}
.mantine-TextInput-input::placeholder, .mantine-Textarea-input::placeholder {
  color: var(--mantine-color-gray-4);
}
.mantine-TextInput-input:focus, .mantine-Textarea-input:focus {
  border-color: var(--mantine-color-brand-3);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--mantine-color-brand-5) 10%, transparent);
}
.mantine-TextInput-input[data-error], .mantine-Textarea-input[data-error],
.mantine-TextInput-input[data-error]:focus, .mantine-Textarea-input[data-error]:focus {
  border-color: var(--mantine-color-red-6);
  box-shadow: none;
}
```

### 2. Import added to `src/app/layout.tsx`

```ts
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@/design-system/mantine/input-chrome.css'   // ← added after Mantine, before globals
import './globals.css'
```

### 3. Import added to `.storybook/preview.tsx`

```ts
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '../src/design-system/mantine/input-chrome.css';  // ← added
import '../src/app/globals.css';
```

### 4. `src/design-system/mantine/theme.ts` — dead inline overrides stripped

Both TextInput and Textarea `styles.input` blocks reduced to only the flat, non-conflicting properties:
- **TextInput:** kept `minHeight: '2.75rem'` + `color: gray-8`; removed `borderColor`, `boxShadow`, `&::placeholder`, `&:focus`, `&[data-error]`
- **Textarea:** kept `color: gray-8`; same removals; no `minHeight` (multiline, grows freely)
- Added comment: `// border/focus/error/placeholder chrome lives in input-chrome.css (Task 505) — inline styles freeze the cascade`

---

## Mantine slot class confirmation

`Textarea.mjs` → `InputBase` with `__staticSelector: "Textarea"`. Mantine's `Input` uses
`name: ["Input", __staticSelector]` for class generation. Stable classes:
- TextInput input slot: `mantine-Input-input mantine-TextInput-input`
- Textarea input slot: `mantine-Input-input mantine-Textarea-input`

`input-chrome.css` targets the component-specific suffixed classes (`mantine-TextInput-input`,
`mantine-Textarea-input`) so each control is independently targetable.

---

## AC checklist

| AC | Status | Evidence |
|----|--------|----------|
| AC-1: `input-chrome.css` created with exact rules, tokens only | ✅ | `src/design-system/mantine/input-chrome.css` |
| AC-2: imported after `@mantine/core/styles.css` in layout.tsx + preview.tsx | ✅ | Both files edited |
| AC-3: `theme.ts` TextInput + Textarea stripped of 5 dead keys; minHeight/color retained | ✅ | theme.ts L174–191 |
| AC-4: Textarea slot class confirmed (`mantine-Textarea-input`) | ✅ | Mantine source trace above |
| AC-5: Rendered proof matrix (uk@320/375/390 mandatory) | ⏳ | Owner-native: `npm run build-storybook` + `npm run screenshots:assert -- --fast` |
| AC-6: Planted-violation transcript | ⏳ | Owner-native: temporarily remove `[data-error]` rule from `input-chrome.css`, rebuild, `screenshots:assert`, revert |
| AC-7: Gates green | ✅ | tsc=0 · check:stories 83/0 · check:i18n 1984 · check:design-tokens 0 |
| AC-8: File integrity | ✅ | All files: NUL=0, sizes above |
| AC-9: Session log + backlog | ✅ | This file + backlog.md |

---

## Files Changed

| File | Change |
|------|--------|
| `src/design-system/mantine/input-chrome.css` | **NEW** — stylesheet border/focus/error/placeholder chrome for TextInput + Textarea |
| `src/app/layout.tsx` | Added `import '@/design-system/mantine/input-chrome.css'` after Mantine CSS |
| `.storybook/preview.tsx` | Added `import '../src/design-system/mantine/input-chrome.css'` after Mantine CSS |
| `src/design-system/mantine/theme.ts` | TextInput + Textarea: stripped 5 dead inline keys, kept `minHeight`/`color`, added comment |

---

## Gate Results

| Gate | Result |
|------|--------|
| `tsc --noEmit` | ✅ 0 errors |
| `check:stories` | ✅ 83 files, 0 violations |
| `check:i18n` | ✅ 1984 keys × 4 locales — unchanged |
| `check:design-tokens` | ✅ 0 violations |

## File Integrity

| File | Size | NUL |
|------|------|-----|
| `src/design-system/mantine/input-chrome.css` | 1220 bytes | 0 |
| `src/design-system/mantine/theme.ts` | 15359 bytes | 0 |
| `src/app/layout.tsx` | 2359 bytes | 0 |
| `.storybook/preview.tsx` | 12591 bytes | 0 |
