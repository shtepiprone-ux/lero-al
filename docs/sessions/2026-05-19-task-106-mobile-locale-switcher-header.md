# Session Archive: Task 106 — Epic A.4 — Mobile Locale Switcher to Header — 2026-05-19

## Task 106 Summary

**Type:** Responsive UI / UX  
**Epic:** A — Localization & Locale Consistency (A.4)

---

## Pre-Task Mandatory Checklist

- [x] No duplicate components — canonical `Combobox` from `@/components/shared/Combobox` used directly; no new component created
- [x] No hardcode — locale codes (SQ/EN/UK/IT) are technical identifiers; full language names in dropdown via `langLabels` (i18n `t('lang_sq')` etc.)
- [x] Scope isolated — only `src/components/layout/Header.tsx` modified

---

## Investigation

### Before

| Breakpoint | Locale switcher location |
|-----------|--------------------------|
| 320–639px | Hamburger Sheet drawer — button grid `{loc.flag} {langLabels[loc.code]}` |
| 640px+    | Header — `LocaleSwitcher` dropdown (`hidden sm:flex`) |

Issues:
- Mobile locale switcher was hidden inside a drawer — required 2 taps to switch locale
- Used raw `Button` elements, not canonical `Combobox`
- Not visible at all without opening the drawer

### After

| Breakpoint | Locale switcher location |
|-----------|--------------------------|
| 320–639px | **Header** — `Combobox` with `sm:hidden`, `portal`, `size="default"` (44px touch target) |
| 640px+    | Header — `LocaleSwitcher` dropdown (`hidden sm:flex`) — unchanged |

---

## Implementation

### `src/components/layout/Header.tsx`

**Added:**
1. Import `Combobox` and `ComboboxOption` from `@/components/shared/Combobox`
2. `localeOptions` array built from `LOCALES` with:
   - `label`: `${flag} ${code.toUpperCase()}` — compact for trigger (e.g. "🇦🇱 SQ")
   - `description`: `langLabels[loc.code]` — full localized name shown in dropdown (e.g. "Shqip")
3. `<Combobox>` in header right-side div with `className="w-24 sm:hidden"`:
   - `variant="button"` — click-to-open (no search input; 4 static options)
   - `size="default"` — h-11 = 44px touch target
   - `portal` — dropdown escapes sticky header z-stacking via `position: fixed`

**Removed:**
- "Mobile locale switcher" section from Sheet drawer (lines ~249–265) — locale now accessible directly from header

---

## Breakpoint Matrix

| Breakpoint | Visible in header | Touch target | Locale accessible |
|-----------|-------------------|--------------|-------------------|
| 320px     | ✅ Combobox `w-24 sm:hidden` | ✅ h-11 = 44px | ✅ |
| 375px     | ✅ | ✅ | ✅ |
| 390px     | ✅ | ✅ | ✅ |
| 640px (sm)| switches to `LocaleSwitcher` dropdown | ✅ | ✅ |
| 768px     | ✅ `LocaleSwitcher` | ✅ | ✅ |
| 1280px    | ✅ `LocaleSwitcher` | ✅ | ✅ |
| 1440px    | ✅ `LocaleSwitcher` | ✅ | ✅ |
| 2560px    | ✅ `LocaleSwitcher` | ✅ | ✅ |

---

## Combobox Option Format

```ts
const localeOptions: ComboboxOption[] = LOCALES.map(loc => ({
  value: loc.code,           // 'sq' | 'en' | 'uk' | 'it'
  label: `${loc.flag} ${loc.code.toUpperCase()}`,   // "🇦🇱 SQ" — compact trigger
  description: langLabels[loc.code],                 // "Shqip" — full name in dropdown
}))
```

Trigger shows: `🇦🇱 SQ` (compact, fits in w-24 = 96px)  
Dropdown shows: `🇦🇱 SQ   Shqip` (flag + code + full name as description)

All four locales at runtime (when UI locale = `sq`):
- `🇦🇱 SQ   Shqip`
- `🇬🇧 EN   Anglisht`
- `🇺🇦 UK   Ukrainisht`
- `🇮🇹 IT   Italisht`

---

## Desktop regression check

- `LocaleSwitcher` (`hidden sm:flex`) — unchanged ✅
- Admin `AdminLocaleSwitcher` — unchanged ✅
- Desktop nav (`hidden md:flex`) — unchanged ✅
- Favorites link (`hidden sm:flex`) — unchanged ✅
- Hamburger drawer content (nav links, auth buttons, logout) — unchanged ✅

---

## Validation

| Check | Result |
|-------|--------|
| Mobile locale switcher in header (320–639px) | ✅ Combobox `sm:hidden` |
| Touch target ≥ 44px | ✅ `size="default"` = h-11 = 44px |
| Uses canonical Combobox | ✅ `@/components/shared/Combobox` |
| All four locales switchable | ✅ `options={localeOptions}` covers sq/en/uk/it |
| Language names via i18n keys | ✅ `langLabels` uses `t('lang_sq')` etc. |
| No desktop header regression | ✅ `LocaleSwitcher` `hidden sm:flex` unchanged |
| Portal for sticky header clipping | ✅ `portal` prop enabled |
| `npm run lint` | ✅ 0 errors / 5 pre-existing warnings |
| `npm run governance:localization` | ✅ PASS C0/H0/M18 at baseline |
