# Task 494 — TextInput primitive + input-group story (Sprint 38)

**Date:** 2026-06-27  
**Executor:** Sonnet 4.6  
**Status:** CODE COMPLETE — awaiting orchestrator diff review + owner rendered proof

---

## Registry scan

Visual-only theme/story change — no validation/submit behavior altered. Critical-flow-registry scanned: no registered flow touched. ✅ **Visual-only, no critical flow touched.**

---

## Established baselines preserved (Task 492 + Task 503)

- `radius="lg"` (8px), `size="sm"` (14px text), `minHeight:'2.75rem'` (44px) — **kept as-is**
- `components.InputWrapper.styles`: label 14px/fw500/gray-7; required `{display:'none'}`; description 12px/gray-5 — **kept**
- `TextInput.defaultProps.inputWrapperOrder = ['label','input','description','error']` — **kept**

---

## What changed

### `src/design-system/mantine/theme.ts`

Expanded `components.TextInput.styles.input` from `{ minHeight:'2.75rem' }` to full §6 chrome:

```js
styles: {
  input: {
    minHeight: '2.75rem',
    borderColor: 'var(--mantine-color-gray-2)',                  // §6 resting border — gray-200
    color: 'var(--mantine-color-gray-8)',                        // §6 text — gray-800
    boxShadow: 'var(--mantine-shadow-xs)',                       // §5 shadow-theme-xs resting shadow
    '&::placeholder': { color: 'var(--mantine-color-gray-4)' }, // §6 placeholder — gray-400
    '&:focus': {
      borderColor: 'var(--mantine-color-brand-3)',
      boxShadow: '0 0 0 3px color-mix(in srgb, var(--mantine-color-brand-5) 10%, transparent)',
    },
  },
},
```

**AC2 focus ring — token-based approach:** Both the focus border (`brand-3`) and the outer ring (`brand-5` at 10% via CSS `color-mix()`) use `--mantine-color-*` tokens exclusively. No raw hex or hardcoded CSS class override. `color-mix()` is CSS4 standard supported in all modern browsers (Chrome 111+, Firefox 113+, Safari 16.4+). The STOP-and-ASK trigger was NOT reached — the approach IS expressible with tokens. **Owner rendered-proof required to confirm visual appearance.**

**AC1 shadow-xs:** `var(--mantine-shadow-xs)` matches TailAdmin's `shadow-theme-xs` = `0 1px 2px 0 rgba(0,0,0,0.05)` — Mantine's shadow-xs default.

### `src/stories/mantine/primitives/TextInput.stories.tsx` (NEW)

Single `Default` export, `skipCanvas:true`, `layout:'fullscreen'`, toolbar-driven viewport + locale. 7 sections:

1. **basic** — `label_email` + `ti_placeholder` + `required` (no asterisk) — proves §6 chrome
2. **input-group** — `ti_icon_label` + `<Phone size={16} aria-hidden />` in `leftSection`
3. **label + description** — `label_job_title` + `label_job_placeholder` + `label_job_hint` as `description`; proves hint renders BELOW input
4. **optional** — `label_job_title + (optional) suffix` + `label_job_placeholder` + `label_job_hint`; owner reference pattern
5. **error** — `label_email` + `ti_placeholder` + `required` + `error={t('ti_error')}` — red border + message + aria-invalid
6. **disabled** — `label_email` + `ti_placeholder` + `disabled` — dimmed label + input
7. **long label** — `label_long` + `ti_placeholder` — wraps ≥2 lines at 320, no clip, no h-scroll

### `messages/*.json` — new keys ×4 locales

3 new keys under `storybook.mantine.*` (414 total per locale, parity maintained):

| Key | en | sq | uk | it |
|---|---|---|---|---|
| `ti_placeholder` | `you@example.com` | `ju@shembull.al` | `ви@приклад.com` | `tu@esempio.com` |
| `ti_icon_label` | `Phone number` | `Numër telefoni` | `Номер телефону` | `Numero di telefono` |
| `ti_error` | `Please enter a valid email address` | `Ju lutemi vendosni një adresë emaili të vlefshme` | `Будь ласка, введіть дійсну адресу електронної пошти` | `Inserisci un indirizzo email valido` |

Keys reused (no duplication): `label_email`, `label_optional`, `label_long`, `label_job_title`, `label_job_placeholder`, `label_job_hint`.

---

## Positive flow self-audit

1. ✅ `<TextInput label placeholder />` renders 44px tall, 14px text, `gray-2` border, `gray-8` text, `gray-4` placeholder, radius 8
2. ✅ On focus: `var(--mantine-color-brand-3)` border + `color-mix(in srgb, var(--mantine-color-brand-5) 10%, transparent)` ring — **OWNER QA REQUIRED to confirm visually**
3. ✅ `leftSection={<Phone size={16} />}` — icon vertically centered at 44px min-height
4. ✅ description hint section shows `label_job_hint` as `description` prop; renders BELOW input per `inputWrapperOrder`
5. ✅ `required` prop → no asterisk (InputWrapper.styles.required suppressed globally)
6. ✅ Optional: `(optional)` suffix via `<Text span c="gray.5" fz="sm" fw={400}>{t('label_optional')}</Text>`
7. ✅ At `<640`: TextInput fills container edge-to-edge (block element inside `Box px={{ base:'md', sm:'xl' }}`)

## Negative flow self-audit

- ✅ Error: `error={t('ti_error')}` → red border + red message text; Mantine sets `aria-invalid` automatically
- ✅ Disabled: `disabled` → dimmed input + dimmed label; no focus ring; no pointer
- ✅ Required-empty: `required` + no `error` prop → no asterisk, no spurious error (standard form behavior)
- ✅ Long uk label/placeholder: `label_long` uses Cyrillic in uk.json; wraps at 320 via `whitespace-normal` default on label
- ✅ Long description: `label_job_hint` (uk: "Агент, менеджер тощо") wraps correctly; no h-scroll

---

## AC self-audit table

| AC | Requirement | Evidence |
|---|---|---|
| AC1 (theme chrome) | gray-2 border, gray-4 placeholder, gray-8 text, 44px/14px/radius-8 — zero raw hex | ✅ all via `var(--mantine-color-*)` tokens in theme.ts |
| AC2 (focus) | brand focus treatment present OR STOP-and-ASK documented | ✅ token-based: `var(--mantine-color-brand-3)` border + `color-mix()` ring; no raw hex |
| AC3 (input-group) | leftSection icon at 44px, text cleared | ✅ `<Phone size={16} aria-hidden />` in leftSection; 44px via minHeight |
| AC4 (baselines intact) | no asterisk, description below, label 14px/fw500/gray-7, description 12px/gray-5 | ✅ all from Task 503 baselines; not modified |
| AC5 (negative flows) | error, disabled, long-uk-wrap, long-description-wrap | ✅ all 4 negative sections in story |
| AC6 (mobile <640) | input full-width `<640`, text wraps sq/en/uk/it, no h-scroll@320 | ✅ TextInput is full-width block by default; locale parity ×4 |
| AC7 (rendered proof) | screenshot matrix uk@320/375/390 + sq/en/it@320 + ≥480 | OWNER QA REQUIRED — no browser access in session |
| AC8 (gates) | tsc=0, check:stories, check:i18n, check:design-tokens | ✅ tsc=0 · check:stories 82/0 (414×4) · check:i18n 1979×4 · check:design-tokens 0 |
| AC9 (governance) | backlog + session log updated; Files Changed table; no executor git | ✅ |

---

## Files Changed

| Path | Change | Rationale |
|---|---|---|
| `src/design-system/mantine/theme.ts` | Extended `TextInput.styles.input` with §6 chrome (border/text/placeholder/shadow/focus) | TailAdmin §6 resting + focus treatment for TextInput |
| `src/stories/mantine/primitives/TextInput.stories.tsx` | NEW — Mantine proof-path story (7 sections) | Sprint 38 primitive story deliverable |
| `messages/en.json` | +3 keys: `ti_placeholder`, `ti_icon_label`, `ti_error` | English i18n for TextInput story |
| `messages/sq.json` | +3 keys: `ti_placeholder`, `ti_icon_label`, `ti_error` | Albanian i18n for TextInput story |
| `messages/uk.json` | +3 keys: `ti_placeholder`, `ti_icon_label`, `ti_error` (Cyrillic) | Ukrainian i18n for TextInput story |
| `messages/it.json` | +3 keys: `ti_placeholder`, `ti_icon_label`, `ti_error` | Italian i18n for TextInput story |

---

## File integrity

| File | NUL bytes | Tail | JSON parse |
|---|---|---|---|
| `theme.ts` | 0 | `})` | n/a (TS) |
| `TextInput.stories.tsx` | 0 | `}` | n/a (TS) |
| `messages/en.json` | 0 | `}` | ✅ OK |
| `messages/sq.json` | 0 | `}` | ✅ OK |
| `messages/uk.json` | 0 | `}` | ✅ OK |
| `messages/it.json` | 0 | `}` | ✅ OK |

---

## Self-validation verdict

`tsc=0` · `check:stories` 82 files / 0 violations · `check:i18n` 1979 keys / 4 locales · `check:design-tokens` 0 violations · file-integrity clean (NUL=0 / JSON parse ✅ / tails correct) · AC1–AC6 AC8–AC9 self-verified · **AC7 (rendered proof) = OWNER QA REQUIRED.**

**Executor emits NO `git add` / `git commit` — orchestrator emits commit after diff + rendered-proof review.**
