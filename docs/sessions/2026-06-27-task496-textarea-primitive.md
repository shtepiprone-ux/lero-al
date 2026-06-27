# Session Log — Task 496: Textarea primitive → TailAdmin §6 chrome + Storybook story

**Date:** 2026-06-27  
**Executor:** Sonnet 4.6  
**Sprint:** 38 / MM Phase-1 Batch B  
**Status:** ✅ CODE COMPLETE (after owner rework feedback) — awaiting orchestrator diff-review

---

## What Changed

### `src/design-system/mantine/theme.ts`
Expanded the `Textarea` component block from bare `defaultProps` to full §6 chrome — mirrors `TextInput` exactly,
minus the `minHeight` floor (Textarea is multiline and grows). Added `inputWrapperOrder` to match Task 503 UX decision.

**Owner rework:** First pass was rejected — "no red border around Textarea" in the error section. Root cause:
`borderColor: 'var(--mantine-color-gray-2)'` in `styles.input` (a class-level rule) overrides Mantine's built-in
`[data-invalid]` error state when emotion injects the theme override class after the component's default error
CSS. Fix: explicitly restore the error border via `'&[data-invalid]'` in the same styles block.

Final `Textarea` block:
```ts
Textarea: {
  defaultProps: { radius: 'lg', size: 'sm', inputWrapperOrder: ['label', 'input', 'description', 'error'] },
  styles: {
    input: {
      borderColor: 'var(--mantine-color-gray-2)',
      color: 'var(--mantine-color-gray-8)',
      boxShadow: 'var(--mantine-shadow-xs)',
      '&::placeholder': { color: 'var(--mantine-color-gray-4)' },
      // resting borderColor overrides Mantine's [data-invalid] default → restore explicitly
      '&[data-invalid]': { borderColor: 'var(--mantine-color-red-6)', boxShadow: 'none' },
      '&:focus': {
        borderColor: 'var(--mantine-color-brand-3)',
        boxShadow: '0 0 0 3px color-mix(in srgb, var(--mantine-color-brand-5) 10%, transparent)',
      },
    },
  },
},
```

> **Note for orchestrator:** `TextInput` (Task 494, approved) has the same structural pattern and the same
> latent issue. Task 496 scope forbids touching TextInput chrome. If the error-state red border is also missing
> in TextInput's rendered story, a follow-up task is needed.

### `src/stories/mantine/primitives/Textarea.stories.tsx` — new
Mantine proof-path story (skipCanvas, fullscreen, single Default, toolbar locale). 4 sections:
1. **basic** — label + placeholder + description below + autosize minRows=3
2. **autosize** — `defaultValue={ta_long_value}` grows with content; uk Cyrillic long text wraps ≥2 lines at 320
3. **error** — red border (`[data-invalid]`) + red message + aria-invalid
4. **disabled** — dimmed input + label, no focus ring

No icons, no `leftSection`/`rightSection`.

### Locale files (5 new keys × 4 locales)

| Key | en | sq | uk | it |
|-----|----|----|----|----|
| `ta_label` | Listing description | Përshkrimi i shpalljes | Опис оголошення | Descrizione dell'annuncio |
| `ta_placeholder` | Describe the property… | Përshkruani pronën… | Опишіть нерухомість… | Descrivi l'immobile… |
| `ta_hint` | Up to 1000 characters | Deri në 1000 karaktere | До 1000 символів | Fino a 1000 caratteri |
| `ta_error` | Description is required | Përshkrimi është i detyrueshëm | Опис обов'язковий | La descrizione è obbligatoria |
| `ta_long_value` | 3-sentence flat description (EN) | sq equivalent | Cyrillic long text (wraps ≥2 lines @320) | it equivalent |

All 5 keys: natural language, localized per locale, `uk` fully Cyrillic — satisfies §5a and Check 8.

---

## Consumer safety check

Product `Textarea` consumers all import from `@/components/ui/textarea` (shadcn/ui) — **zero Mantine theme impact**.  
Mantine pattern consumers (`MantineTwoColumnForm`, `MantineFormSectionStack`) use `autosize minRows={2}` — chrome-only change, layout/size unaffected.

---

## Files Changed

| File | Change |
|------|--------|
| `src/design-system/mantine/theme.ts` | `Textarea` block: `inputWrapperOrder` + §6 `styles.input` chrome + `[data-invalid]` error-border restore |
| `src/stories/mantine/primitives/Textarea.stories.tsx` | New Mantine proof-path story, 4 sections, no icons |
| `messages/en.json` | +5 `ta_*` keys (English) |
| `messages/sq.json` | +5 `ta_*` keys (Albanian) |
| `messages/uk.json` | +5 `ta_*` keys (Ukrainian Cyrillic) |
| `messages/it.json` | +5 `ta_*` keys (Italian) |

---

## Gate Results

| Gate | Result |
|------|--------|
| `tsc --noEmit` | ✅ 0 errors |
| `check:stories` | ✅ 83 files, 0 violations |
| `check:i18n` | ✅ 1984 keys × 4 locales, parity pass |
| `check:design-tokens` | ✅ 0 violations |

## File Integrity

| File | Size | NUL |
|------|------|-----|
| `theme.ts` | ~16 600 bytes | 0 |
| `Textarea.stories.tsx` | 2710 bytes | 0 |
| `messages/en.json` | 93574 bytes | 0 |
| `messages/sq.json` | 100059 bytes | 0 |
| `messages/uk.json` | 130971 bytes | 0 |
| `messages/it.json` | 98783 bytes | 0 |
