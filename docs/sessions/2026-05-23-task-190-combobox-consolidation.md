# Task 190 — Q.1: Combobox Consolidation

**Date:** 2026-05-23  
**Epic:** Q — Combobox & UI Primitive Single-Source  
**Status:** ✅ Complete

## Pre-read findings

- `PropertyTypeCombobox` — ✅ already a thin wrapper (imports Combobox, passes options, no internals)
- `LocationCombobox` — ❌ parallel implementation: own `search/open/dropdownStyle` state, `createPortal`, `updateDropdownPosition`, raw `<input role="combobox">`, manual dropdown div
- `YearCombobox` — ❌ parallel implementation: same pattern, ~90 lines of duplicated internals
- No `Select`-based domain dropdowns in production TSX files

## Changes

### `src/components/shared/Combobox.tsx` — 3 new props

```tsx
clearLabel?: string        // always-visible deselect item at top of dropdown
inputMode?: ...            // passed to <input inputMode={inputMode}>
onInputChange?: (value: string) => void  // fires on each keystroke (variant="input" only)
```

`clearLabel` renders as a non-filtered button above the options list:
```tsx
{clearLabel && (
  <button ... onMouseDown={() => { onChange(''); setSearch(''); setOpen(false) }}>
    <span>{clearLabel}</span>
    {value === '' && <Check .../>}
  </button>
)}
```

Input onChange updated to fire `onInputChange`:
```tsx
onChange={e => { setSearch(e.target.value); onChange(''); setOpen(true); onInputChange?.(e.target.value) }}
```

All 3 props are backward-compatible (default undefined).

### `src/components/shared/LocationCombobox.tsx` — rewritten as thin wrapper

Removed: ~130 lines (`useState` for search/open/dropdownStyle, `useRef`, `useCallback`, `useEffect`, `createPortal`, `updateDropdownPosition`, manual dropdown div, raw `<input role="combobox">`, `filtered` memo).

Retained: "Add location" admin sub-form (unchanged — already used canonical Combobox for region select), all Props types.

New main render:
```tsx
<Combobox
  options={locations.map(l => ({ value: String(l.id), label: l.name_al, description: l.type || undefined }))}
  value={value}
  onChange={v => onChange(v || null)}
  clearLabel={tc('all_locations')}
  icon={<MapPin className="h-4 w-4" />}
  placeholder={placeholder ?? tc('all_locations')}
  portal={portal}
  error={error}
  onKeyDown={onKeyDown}
/>
```

Note: `onChange(v || null)` maps Combobox's `onChange('')` (clearLabel click) to `onChange(null)` for consumers expecting null deselect.

### `src/components/shared/YearCombobox.tsx` — rewritten as thin wrapper

Removed: ~90 lines (same pattern of duplicated internals).

Retained: `handleInputChange` logic (strips non-digits, validates range, fires `onChange(year)` live).

New render:
```tsx
<Combobox
  options={YEAR_OPTIONS.map(y => ({ value: String(y), label: String(y) }))}
  value={value != null ? String(value) : ''}
  onChange={v => onChange(v ? parseInt(v, 10) : undefined)}
  onInputChange={handleInputChange}
  inputMode="numeric"
  icon={<Calendar className="h-4 w-4" />}
  ...
/>
```

`onChange(v)` from option click → `onChange(parseInt(v, 10))`.  
`onInputChange(raw)` from keystroke → strips non-digits, validates range → `onChange(year)` if valid.

## Verification

- `tsc --noEmit` → 0 errors
- `grep "createPortal|role=\"combobox\"|updateDropdownPosition" src/components/shared/` → only `Combobox.tsx` (DatePicker has `[open, setOpen]` for calendar popup — not a combobox)
- `LocationCombobox.tsx`: 92 lines (was ~220); `YearCombobox.tsx`: 46 lines (was ~130)
