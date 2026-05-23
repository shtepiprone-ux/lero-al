# Task 191 — Q.2: Suppress mobile keyboard on non-typeable comboboxes

**Date:** 2026-05-23  
**Epic:** Q — Combobox & UI Primitive Single-Source  
**Status:** ✅ Complete

## Pre-read findings

- `PropertyTypeCombobox` — ❌ used default `variant="input"` → renders `<input role="combobox">` → mobile keyboard pops on tap (property type is a fixed short list, not searchable).
- `LocationCombobox` — ✅ legitimately searchable (`variant="input"` correct).
- `YearCombobox` — ✅ legitimately typeable year input (`variant="input"` + `inputMode="numeric"` correct).
- `FiltersPanel.tsx` currency combobox — ✅ already `variant="button"`.
- `Header.tsx` locale switcher — ✅ already `variant="button"`.
- `SavedSearchesTab.tsx` combobox — ✅ already `variant="button"`.

## Changes

### `src/components/shared/PropertyTypeCombobox.tsx`

Switched `Combobox` from default `variant="input"` to `variant="button"`:
```tsx
<Combobox
  options={options}
  value={value}
  onChange={onChange}
  variant="button"   // ← added; renders <button>, no keyboard popup
  placeholder={placeholder ?? t('all_types')}
  icon={<Home className="h-4 w-4" />}
  className={cn('property-type-combobox', className ?? 'sm:w-48 shrink-0')}
/>
```

Removed dead `onKeyDown` prop from interface and destructuring (inapplicable in button mode; Combobox does not wire `onKeyDown` to `<button>`).

### `src/components/shared/HeroSearch.tsx`

Removed stale `onKeyDown={handleKeyDown}` from `<PropertyTypeCombobox>` (prop no longer exists in interface):
```tsx
<PropertyTypeCombobox
  value={propertyType}
  onChange={setPropertyType}
/>
```

## Verification

- `tsc --noEmit` → 0 errors
- Fix is canonical: one change in `PropertyTypeCombobox.tsx`, all consumers (HeroSearch, ListingFormShell) inherit it automatically
- `createPortal|role="combobox"` in shared/ — only `Combobox.tsx` (unchanged)
