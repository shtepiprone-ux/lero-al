# Session Log — Task 503 — Label asterisk suppression fix (follow-up to Task 501)

**Date:** 2026-06-26  
**Executor:** Sonnet 4.6  
**Origin:** Task 501 REJECTED — owner rendered `Mantine/Primitives/Label` and found "Email Address *" with a red asterisk in the `required (default)` section. AC4 ("no asterisk even when `required` prop is set") violated.  
**Status:** CODE COMPLETE — awaiting orchestrator diff review + OWNER QA (rendered proof required)

---

## AC1 — Root cause confirmed empirically (source analysis)

**Hypothesis from kickoff:** `InputLabel` and `InputDescription` do NOT route through `theme.components.InputLabel` / `InputDescription` — they use `theme.components.InputWrapper`.

**Confirmed from Mantine v9.4.0 source files:**

```
node_modules/@mantine/core/esm/components/Input/InputLabel/InputLabel.mjs
```
```js
const _getStyles = useStyles({
  name: ["InputWrapper", __staticSelector],  // ← "InputWrapper", NOT "InputLabel"
  ...
  rootSelector: "label",
});
const ctx = useInputWrapperContext();
const getStyles = ctx?.getStyles || _getStyles;  // ← uses context's getStyles when inside TextInput/Select/etc.
```

```
node_modules/@mantine/core/esm/components/Input/InputDescription/InputDescription.mjs
```
```js
const _getStyles = useStyles({
  name: ["InputWrapper", __staticSelector],  // ← same — "InputWrapper"
  ...
  rootSelector: "description",
});
```

Both components share the same CSS module (`Input.module.css`) which exposes slots:
- `label` → class `m_8fdc1311`
- `required` → class `m_78a94662`
- `description` → class `m_fe47ce59`

**Conclusion:** `theme.components.InputLabel` and `theme.components.InputDescription` = **complete no-ops**. The asterisk span (`required` slot, class `m_78a94662`) is only reachable via `theme.components.InputWrapper.styles.required`. Task 501's suppression never had any effect.

---

## AC2 — Theme fix (single-source)

### Removed (Task 501 no-ops):
```ts
// REMOVED — both were no-ops; InputLabel/InputDescription use name:"InputWrapper" internally
InputLabel: {
  styles: {
    label: { fontSize: '...', fontWeight: 500, color: '...' },
    required: { display: 'none' },
  },
},
InputDescription: {
  styles: {
    description: { fontSize: '...', color: '...' },
  },
},
```

### Added (Task 503 correct single-source):
```ts
// InputWrapper: §6 label + §6d description treatment + owner no-asterisk policy (Task 503).
// NOTE: InputLabel and InputDescription both call useStyles({ name: "InputWrapper" }) internally —
// all three components share the same CSS module slots. theme.components.InputLabel /
// InputDescription are no-ops; the single-source override is theme.components.InputWrapper.
// owner decision (2026-06-26): all fields required by default → no `*`; optional fields use
// a localized "(optional)" suffix inline in the label text instead of a Mantine asterisk.
InputWrapper: {
  styles: {
    // §6: 14px (text-theme-sm), fw500 (font-medium), gray-700 (text-gray-700)
    label: {
      fontSize: 'var(--mantine-font-size-sm)',
      fontWeight: 500,
      color: 'var(--mantine-color-gray-7)',
    },
    // suppress Mantine's red `*` asterisk globally — no asterisk anywhere, even if `required` is passed
    required: { display: 'none' },
    // §6d: 12px secondary text, gray-500
    description: {
      fontSize: 'var(--mantine-font-size-xs)',
      color: 'var(--mantine-color-gray-5)',
    },
  },
},
```

**Coverage:** applies to `TextInput`, `Select`, `Textarea`, `PasswordInput`, `NumberInput`, standalone `InputLabel` / `Input.Wrapper` — all consumers of the shared CSS module.

---

## Story — unchanged

`src/stories/mantine/primitives/Label.stories.tsx` was correct in Task 501 and requires NO changes. The 4 sections (required-default + optional-marked + long-uk + disabled) are still the correct proof structure. The story was a correct proof of the INTENDED behavior; the theme was the defect.

---

## i18n — no changes

All 6 `storybook.mantine.label_*` keys from Task 501 are present and at parity (1976 keys). No additions.

---

## Gate results

```
tsc --noEmit          → 0 errors ✅
check:stories         → 81 files checked, 0 violations ✅ (411 storybook.* keys, parity ✅)
check:i18n            → 1976 keys, parity ✅
check:design-tokens   → 0 violations ✅
```

---

## OWNER QA REQUIRED (§MQ — rendered proof is the verdict per AC6)

| Check | Story section | Viewports (mandatory) | Locales |
|---|---|---|---|
| **No asterisk** on required field — even with `required` prop set | "required (default)" | **uk@320, uk@375, uk@390, sq@320, en@320** | en + uk + sq |
| Label: 14px / fw500 / gray-700 color | "required (default)" | any | any |
| Optional suffix "(optional)/(опційно)" is gray-5/lighter than the label | "optional" | en@320, uk@320 | en + uk |
| Placeholder + description hint below the optional field | "optional" | en@320, uk@320 | en + uk |
| Long label wraps ≥2 lines, no clip | "long label" | uk@320, uk@375, uk@390, sq@320 | uk + sq |
| No horizontal scroll at 320 | all sections | 320 mandatory | uk, sq |
| Disabled label dimmed | "disabled" | any | any |
| Click required-section label → focuses input (htmlFor wired) | "required (default)" | any | any |

---

## Owner corrections applied post-initial-submission

**Owner rejected Task 503 (2026-06-26) with two additional issues:**
1. Hint text `label_job_hint` = "Designer, Dev, etc." → should be "Agent, Manager, etc." (domain-correct for Albanian real-estate)
2. Description renders ABOVE the input (Mantine default `["label","description","input","error"]`) → owner requires it BELOW

**Fix applied:**
- `theme.components.TextInput.defaultProps.inputWrapperOrder = ['label', 'input', 'description', 'error']` (theme-level, inherits to all TextInput usages; story unchanged)
- `label_job_hint` updated ×4 locales (en/uk/sq/it)

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/design-system/mantine/theme.ts` | Removed `InputLabel` + `InputDescription` (no-ops); added `InputWrapper.styles` = `{ label:§6, required:{display:'none'}, description:§6d }`; added `TextInput.defaultProps.inputWrapperOrder` → description below input | AC2 asterisk fix; owner correction: description below input |
| `messages/en.json` | Updated `label_job_hint`: "Designer, Dev, etc." → "Agent, Manager, etc." | Owner correction: domain-correct hint text |
| `messages/uk.json` | Updated `label_job_hint`: "Дизайнер, розробник тощо" → "Агент, менеджер тощо" | Owner correction |
| `messages/sq.json` | Updated `label_job_hint`: "Dizajner, Dev, etj." → "Agjent, Menaxher, etj." | Owner correction |
| `messages/it.json` | Updated `label_job_hint`: "Designer, Dev, ecc." → "Agente, Manager, ecc." | Owner correction |
| `docs/backlog.md` | Added Task 503 last session entry | Governance |
| `docs/sessions/2026-06-26-task503-label-asterisk-fix.md` | NEW — this session log | Governance |
