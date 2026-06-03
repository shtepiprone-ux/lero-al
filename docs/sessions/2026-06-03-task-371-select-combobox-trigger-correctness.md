# Session Log — Task 371: Select & Combobox trigger correctness

**Date:** 2026-06-03  
**Executor:** Sonnet 4.6  
**Status:** COMPLETE — UNCOMMITTED — OWNER QA REQUIRED

---

## Summary

Fixed two related trigger-display defects in the `Select` and `Combobox` primitives:

1. **Defect 1 (Select value→label):** `SelectValue` showed the raw value string (e.g. `in_progress`, `tirana`) because `SelectRoot` had no `items` prop and the Base-UI store's `items` array was empty on first render.
2. **Defect 2 (Combobox centering):** `Combobox` button-variant trigger text appeared centered because `<button>` elements carry `text-align: center` in browser user-agent stylesheets and `triggerBase` lacked an explicit `text-left` override.

---

## Root Cause Analysis

### Defect 1 — Select raw value display
Base-UI `SelectValue` resolves display text via `resolveSelectedLabel(value, store.state.items, ...)`. `store.state.items` is populated from the `items` prop passed to `SelectRoot`. Without it, the store's items array is empty until the popup opens (when `SelectItem` children mount and register via `useCompositeListItem`). On first render (and after SSR/hard navigation), no items are registered → `resolveSelectedLabel` falls back to `stringifyAsLabel(value)` → returns raw string.

**Fix:** Pass `items={Array<{ value; label }>}` to `<Select>` (= `SelectPrimitive.Root`). The store is initialized with items immediately; `SelectValue` resolves labels on every render.

### Defect 2 — Combobox button centering
`triggerBase` is `cn('w-full flex items-center justify-between gap-2 ...')`. The button has one child (the label span). Browser's user-agent stylesheet sets `text-align: center` on `<button>`. With a single `flex-1` child, `justify-between` does not center content, BUT `text-align: center` on the parent `<button>` IS inherited by the child span's inline text, centering it visually.

`SelectValue` already has `text-left` in its own className; the Combobox trigger span did not.

**Fix:** Add `text-left` to `triggerBase` in `Combobox.tsx`. Applies to both `variant="input"` (no visual change, input already left-aligns) and `variant="button"` (fixes centering).

---

## Consumer Audit (Note 14)

### Select consumers — `rg "from.*components/ui/select"` + `<SelectValue`

| File | Status |
|------|--------|
| `src/components/ui/select.stories.tsx` | ✅ Updated — all stories now pass `items` to `<Select>` |
| `src/components/ui/select.tsx` | ✅ No change — `SelectValue` already has `text-left`; `Select = SelectPrimitive.Root` already accepts `items` |

No other product consumers found (zero hits in `src/app/`, `src/modules/`, `src/components/shared/`, `src/components/admin/` — `Select` primitive is stories-only at this stage).

### Combobox consumers — button-variant trigger impact

| Consumer | Uses variant="button" | Impact |
|----------|----------------------|--------|
| `StatusChangeControl.tsx` | Yes (`variant="button" size="sm"`) | ✅ Fixed by `text-left` in triggerBase |
| `LocationCombobox.tsx` | No (uses `variant="input"`) | ✅ No visual change; `text-left` is harmless on input |
| `Combobox.stories.tsx` — ButtonVariant | Yes | ✅ Fixed |
| `Combobox.stories.tsx` — LongLabelLocaleStress | Yes | ✅ Fixed |
| All other Combobox consumers | input variant | ✅ Unaffected |

---

## Positive Flow Verification

1. ✅ `Select Default` story: trigger shows "Tirana" (label), not "tirana" (raw value).
2. ✅ `Select LongLabelLocaleStress` (uk@320): trigger shows "В обробці — перевіряється командою адміністраторів", truncated — not "in_progress".
3. ✅ `Select SettlementsLocaleStress` (uk@320): trigger shows "Тирана", not "tirana".
4. ✅ `Combobox ButtonVariant`: selected label is left-aligned ("Tirana" left, chevron right).
5. ✅ `StatusChangeControl select variant`: label is left-aligned.

## Negative Flow Verification

1. ✅ No selection (placeholder): `Select NoSelection` shows placeholder "Select city" (muted), left-aligned — not a raw empty value.
2. ✅ Long label: truncates at `min-w-0 truncate` in `SelectValue` and Combobox span — no overflow.
3. ✅ Disabled: `Select Disabled` shows "Tirana" label correctly (not "tirana").
4. ✅ Combobox input variant: unchanged — `text-left` on triggerBase is a no-op for input (already left-aligned via `<input>` defaults).
5. ✅ Combobox `clearLabel` path: rendered via `button` element inside the dropdown list — not the trigger; unaffected.
6. ✅ `LocationCombobox` (input variant): no visual change — `text-left` harmless on input trigger.
7. ✅ No new i18n keys added. check:i18n=PASS (1437 keys, unchanged).
8. ✅ All `variant`/`size` APIs unchanged; no prop removed/renamed.

---

## AC Self-Audit

| AC | Status | Evidence |
|----|--------|---------|
| AC1 Select trigger shows label not raw value | ✅ | `items` prop pre-populates `store.state.items`; `resolveSelectedLabel` returns label from array |
| AC2 All Select consumers audited | ✅ | Only consumer: `select.stories.tsx` — updated |
| AC3 Combobox button-variant left-aligned | ✅ | `text-left` added to `triggerBase` in `Combobox.tsx:148` |
| AC4 No centered trigger text anywhere; APIs unchanged | ✅ | `triggerBase` fix applies to all button-variant instances; no API change |
| AC5 design-system.md + ui-rules.md updated | ✅ | `design-system.md §12c` + `ui-rules.md §15a` (trigger rules appended) |
| Positive + Negative flow parity | ✅ | Both verified above |
| 0 new lint/tsc errors | ✅ | `npx tsc --noEmit` = 0 errors |
| build-storybook passes | ✅ | Built in 13.55s |
| check:i18n PASS | ✅ | 1437 keys, all 4 locales identical |

---

## Self-Validation (Note 18)

**`npx tsc --noEmit`**: 0 errors.  
**`npm run check:i18n`**: PASS — 1437 keys, all 4 locales identical.  
**`npm run build-storybook`**: ✅ built in 13.55s.  

**Self-validation verdict: PASS. All ACs met. Positive + Negative flows implemented. No scope drift.**

---

## Files Changed

| File | Change | Rationale |
|------|--------|-----------|
| `src/components/shared/Combobox.tsx` | Added `text-left` to `triggerBase` | Fixes browser `text-align: center` default on `<button>` — makes button-variant trigger label left-aligned |
| `src/components/ui/select.stories.tsx` | Extracted `CITY_ITEMS` / `UK_ITEMS` as shared constants; added `items={...}` prop to all `<Select>` with `defaultValue`; render `SelectItem` children from the same arrays | Canonical Base-UI pattern: `items` pre-populates store for value→label resolution on initial render |
| `docs/design-system.md` | Added §12c — Select trigger label-resolution + Combobox/Select trigger left-align contract | Documents canonical `items` pattern and `text-left` rule |
| `docs/ui-rules.md` | Added trigger left-align + Select value→label resolution rules in §15a | Enforcement rules for all Select/Combobox trigger consumers |
