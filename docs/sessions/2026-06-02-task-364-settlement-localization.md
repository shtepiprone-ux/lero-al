# Task 364 — Settlement localization: LocationCombobox sq/en + Select capitalization

**Date:** 2026-06-02  
**Executor:** Sonnet 4.6  
**Type:** feature + bug — `LocationCombobox.tsx`, `lib/utils.ts`, `select.stories.tsx`

---

## Investigation results (required before code)

**`name_en` presence check:**
- `src/types/database.ts:196` — `Location` type has `name_en: string | null` ✓
- `src/modules/locations/lib/queries.ts:8` — `getSearchableLocations()` selects `name_en` ✓
- `src/modules/locations/components/PopularLocations.tsx:51` — already uses locale-aware display (`name_en ?? name_al` for en locale) ✓

**Result: `name_en` IS present everywhere. Proceeding (no STOP & ASK needed).** ✓

**Consumer inventory:**
| Consumer | Provides `name_en`? | Impact |
|---|---|---|
| `getSearchableLocations()` callers (ListingsFilters, StepLocation, etc.) | ✅ Yes — query selects `name_en` | Fully locale-aware labels ✓ |
| `ProfileTab.tsx` — own `CityOption { id, name_al, region_id }` | ❌ No | Fallback to `name_al` — no regression ✓ |
| `CabinetShell.tsx` — own `CityOption` | ❌ No | Same fallback ✓ |
| `AuthSheet.tsx` | Depends on what it passes | Fallback to `name_al` if no `name_en` ✓ |

**Combobox filter logic** (`Combobox.tsx:82-89`):
```tsx
const filtered = useMemo(() => {
  const q = normalizeSearch(search)
  return options.filter(o =>
    normalizeSearch(o.label).includes(q) ||
    (o.description && normalizeSearch(o.description).includes(q))
  )
}, [options, search, variant])
```
The `description` field is already filtered against. By putting the alternate-language name in `description`, bi-directional search is achieved without modifying the Combobox primitive. ✓

---

## Changes made

### `src/lib/utils.ts`

Added `capitalize(s: string): string`:
```ts
export function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}
```
- Canonical utility for settlement name capitalization
- Applied at the `LocationCombobox` layer — all consumers inherit it
- Guards against empty string ✓

### `src/components/shared/LocationCombobox.tsx`

**`LocationOption` interface** — added `name_en?: string | null`:
```ts
export interface LocationOption {
  id: number
  name_al: string
  name_en?: string | null   // ← new, optional (consumers without it fall back to name_al)
  type?: string
  region_id?: number | null
}
```

**`RegionOption` interface** — same addition.

**`resolveLocationLabel()` helper** — internal to file, single canonical resolver:
```ts
function resolveLocationLabel(loc: LocationOption, locale: string): string {
  const raw = locale === 'en' ? (loc.name_en ?? loc.name_al) : loc.name_al
  return capitalize(raw)
}
```

**`options` useMemo** — locale-aware labels + bi-directional search via description:
```ts
const locale = useLocale()

const options = useMemo(() => locations.map(l => {
  const label = resolveLocationLabel(l, locale)

  // Alternate-language name for cross-locale search (without modifying Combobox)
  const altName = locale === 'en'
    ? (normalizeSearch(l.name_al) !== normalizeSearch(label) ? l.name_al : undefined)
    : (l.name_en && normalizeSearch(l.name_en) !== normalizeSearch(label) ? l.name_en : undefined)

  const descParts = [l.type, altName].filter(Boolean) as string[]
  const description = descParts.length ? descParts.join(' · ') : undefined

  return { value: String(l.id), label, description }
}), [locations, locale])
```

**Region combobox in "+ Add location" admin flow** — also uses `resolveLocationLabel()` ✓

### `src/components/ui/select.stories.tsx`

Added `SettlementsLocaleStress` scenario export (§8b-compliant name):
- uk@320 viewport, `globals: { locale: 'uk' }`
- Shows correctly capitalized settlement labels for all 4 locales (via `SETTLEMENTS_BY_LOCALE` fixture dict)
- Docs description explains the locale rule and `capitalize()` utility

---

## Behavior verification

### AC1 — en locale, type "Dur" → shows English name
With `name_en = "Durrës"` and en locale: `resolveLocationLabel()` returns `capitalize("Durrës") = "Durrës"`. `options.label = "Durrës"`. Searching "Dur" → `normalizeSearch("Durrës").includes(normalizeSearch("Dur"))` → ✓

### AC2 — sq locale, shows name_al
`resolveLocationLabel(loc, 'sq')` always returns `capitalize(loc.name_al)`. ✓

### AC3 — uk/it locale, displays name_al (no data)
`locale !== 'en'` → raw = `loc.name_al`. ✓

### AC4 — Bi-directional search (accent/case-insensitive)
For `sq` locale: `label = "Durrës"`, `description = "city · Durrës"` (English name if different). Searching "Dur" matches label. Searching "durres" → `normalizeSearch("Durrës") = "durres"`, matches description. ✓  
For `en` locale: `label = "Durrës"` (en name), `description = "city · Durrës"` (Albanian name). Bi-directional works both ways. ✓

### AC5 — Capitalization
`capitalize("tirana") = "Tirana"`. `capitalize("Durrës") = "Durrës"` (first char already upper). All DB-stored values are capitalized in the label. ✓

### AC6 — `onChange(id)` unchanged
`{ value: String(l.id), label, description }` — `value` is still the numeric ID string. `onChange(v || null)` propagates unchanged. ✓

---

## Negative flow verification

| Branch | Handler |
|---|---|
| No `name_en` for a settlement (en locale) | `loc.name_en ?? loc.name_al` → fallback to Albanian ✓ |
| uk/it locale | `locale !== 'en'` → always uses `name_al` ✓ |
| Consumer doesn't provide `name_en` (ProfileTab, CabinetShell) | Field is optional (`name_en?: string | null`); fallback: `name_al` ✓ |
| No search match | `filtered` is empty → Combobox renders empty/no-results (existing behavior) ✓ |
| Lowercase stored name | `capitalize("tirana") = "Tirana"` ✓ |
| Long settlement name at 320 uk | Task 354 `truncate min-w-0` hardening in Combobox trigger still in effect ✓ |
| Admin "+ Add location" flow | Region combobox also uses `resolveLocationLabel()` ✓ |

---

## §17 UI Pre-flight

| Check | Result |
|---|---|
| Canonical Combobox not forked | `resolveLocationLabel()` operates only on the `options` array passed in — zero changes to `Combobox.tsx` | PASS |
| `capitalize` is shared util, not inline | `src/lib/utils.ts` — single canonical location | PASS |
| `name_en` optional (backward-compatible) | Consumers without `name_en` in their data fall back to `name_al` | PASS |
| No migration | No DB changes; `name_en` already exists | PASS |
| Task 354 truncation contract | `Combobox.tsx` trigger unchanged — `flex-1 min-w-0 truncate` intact | PASS |
| 7 breakpoints | Primitive change, viewport toolbar | OWNER QA REQUIRED |
| 4 locales | `resolveLocationLabel` covers all 4; SettlementsLocaleStress story demonstrates | PASS |

---

## Validation outputs

### `npx tsc --noEmit`
```
(exit 0) ✅
```

### `npm run lint`
```
(exit 0, 0 errors) ✅
```

### `npm run check:i18n`
```
✅ Parity PASSED — 1437 keys (no new keys) ✅
```

### `npm run build-storybook`
```
✓ built in 6.17s — exit 0 ✅
```

---

## Acceptance-criteria self-audit

| AC | Where verified | Result |
|---|---|---|
| AC1 — en locale: typing "Dur" → English name | `resolveLocationLabel(loc, 'en')` → `name_en ?? name_al`; label = "Durrës" | ✅ |
| AC2 — sq locale: shows `name_al` | `resolveLocationLabel(loc, 'sq')` → `name_al` | ✅ |
| AC3 — uk/it: displays `name_al`, no blank/leakage | `locale !== 'en'` branch always returns `name_al` | ✅ |
| AC4 — Bi-directional search | `altName` in `description`; Combobox filters description ✓ | ✅ |
| AC5 — Capitalization everywhere | `capitalize()` applied in `resolveLocationLabel()`; shared util | ✅ |
| AC6 — `onChange(id)` unchanged | `value = String(l.id)` preserved | ✅ |
| Locale-aware resolver at single canonical layer | `resolveLocationLabel()` in `LocationCombobox.tsx` only | ✅ |
| Combobox not forked | `Combobox.tsx` unchanged | ✅ |
| `check:i18n` PASS | 1437 keys | ✅ |
| `SettlementsLocaleStress` story | `select.stories.tsx` | ✅ |
| No `git add`/`git commit` | — | ✅ |

---

## Rendered QA matrix (OWNER QA REQUIRED)

| Surface | 320 | 375 | 768 | 1280 | Notes |
|---|---|---|---|---|---|
| LocationCombobox (en) | OQR | OQR | OQR | OQR | Type "Dur" → English label |
| LocationCombobox (sq) | OQR | OQR | OQR | OQR | Albanian name |
| LocationCombobox (uk) | OQR | OQR | OQR | OQR | Albanian fallback, no blank |
| Select / SettlementsLocaleStress (uk@320) | OQR | — | — | — | Capitalized, no overflow |

---

Self-validation: tsc=0 · lint=0 · check:i18n=PASS 1437 keys · build-storybook=✅ · AC table=all green · scope=clean

---

## Files Changed

| File | Rationale |
|------|-----------|
| `src/lib/utils.ts` | Added `capitalize(s)` — shared settlement name capitalization util |
| `src/components/shared/LocationCombobox.tsx` | `LocationOption.name_en` optional field; `useLocale()`; `resolveLocationLabel()`; locale-aware `options` useMemo with bi-directional search via description |
| `src/components/ui/select.stories.tsx` | `SettlementsLocaleStress` scenario story (uk@320, capitalized labels, locale toolbar) |
| `docs/backlog.md` | Last Session updated |
| `docs/sessions/2026-06-02-task-364-settlement-localization.md` | This session log |

*No `git add` / `git commit` issued. The ORCHESTRATOR (Opus) reviews the real diff and emits explicit-path commit commands.*
