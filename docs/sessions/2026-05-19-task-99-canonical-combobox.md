# Task 99 — Replace local Combobox in Admin User form with canonical Combobox

**Date:** 2026-05-19
**Sprint:** Sprint 1 — Bugfix Continuation & Admin Polish
**Status:** ✅ PASS

---

## Investigation

### Admin user forms audit

Both admin user forms already use canonical components:
- `AdminUserProfile.tsx` — uses `LocationCombobox` from `@/components/shared/LocationCombobox` ✓
- `AdminUserCreate.tsx` — uses `LocationCombobox` from `@/components/shared/LocationCombobox` ✓

No local Combobox clone found in admin user forms. The task description pointed to `src/components/admin/users/` which doesn't exist.

### Actual local clone: `SettlementCombobox` in `ProfileTab.tsx`

Found at `src/modules/cabinet/components/ProfileTab.tsx` lines 93–207:
```
function SettlementCombobox({ cities, regions, value, onChange, label }: {...})
```

This is a 115-line local reimplementation of `LocationCombobox` with:
- Custom portal rendering via `createPortal`
- Custom scroll/resize position tracking
- Custom city search/filter
- Custom dropdown rendering with raw `<button>` elements
- Shows region name inline in dropdown items and below the field

It duplicated the exact functionality of `LocationCombobox portal` which was added in Task 93. The canonical `LocationCombobox` already supports the same features.

**Why it's a governance violation:**
- Raw `<button>` elements inside (3 violations)
- Bypasses canonical `LocationCombobox`
- Custom portal logic duplicated from canonical component

---

## Implementation

### 1. Removed `SettlementCombobox` function definition

Deleted lines 93–207 from `ProfileTab.tsx`.

### 2. Replaced usage

**Before:**
```tsx
<div className="sm:col-span-2">
  <SettlementCombobox
    cities={cities}
    regions={regions}
    value={locationId}
    onChange={setLocationId}
    label={t('city_label')}
  />
</div>
```

**After:**
```tsx
<div className="sm:col-span-2 flex flex-col gap-1.5">
  <Label className="text-sm">{t('city_label')}</Label>
  <LocationCombobox
    locations={cities.map(c => ({
      ...c,
      type: regions.find(r => r.id === c.region_id)?.name_al,
    }))}
    value={locationId ? String(locationId) : ''}
    onChange={id => setLocationId(id ? Number(id) : null)}
    portal
  />
  {(() => {
    const city = cities.find(c => c.id === locationId)
    const region = regions.find(r => r.id === city?.region_id)
    return region ? <p className="text-xs text-muted-foreground">{region.name_al}</p> : null
  })()}
</div>
```

Key decisions:
- `locations={cities.map(c => ({ ...c, type: regions.find(...)?.name_al }))}` — passes region name as `type` so it shows in dropdown items
- `value={locationId ? String(locationId) : ''}` — converts `number | null` to string (LocationCombobox interface)
- `onChange={id => setLocationId(id ? Number(id) : null)}` — converts string back to number
- `portal` — keeps the correct behavior in scrolling containers
- Region display below field preserved for UX parity

### 3. Cleaned orphaned imports

Removed:
- `useRef` (only used by SettlementCombobox)
- `useEffect` (only used by SettlementCombobox)
- `createPortal` from `react-dom` (only used by SettlementCombobox)
- `MapPin` from lucide-react (only used by SettlementCombobox)

Added:
- `LocationCombobox` from `@/components/shared/LocationCombobox`

---

## Behavior parity

| Feature | SettlementCombobox (before) | LocationCombobox portal (after) |
|---------|----|----|
| City search | ✓ | ✓ |
| Portal rendering | ✓ (custom) | ✓ (canonical) |
| Viewport-aware flip | ✓ | ✓ |
| Region in dropdown | ✓ (as suffix) | ✓ (as `type` field) |
| Region below field | ✓ | ✓ (preserved separately) |
| Clear / "All locations" | ✗ | ✓ (improvement) |
| Keyboard accessibility | basic | ✓ canonical |

---

## Files changed

- `src/modules/cabinet/components/ProfileTab.tsx`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-99-canonical-combobox.md` (this file)

---

## Governance impact

| Metric | Before | After |
|--------|--------|-------|
| primitives HIGH | 88 | **87** (−1, raw buttons in SettlementCombobox eliminated) |
| primitives MEDIUM | 1 | 1 (unchanged) |

---

## Validation

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors / 5 warnings (all pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing test errors, 0 new |
| `npm run governance:primitives` | H:87 (−1 improvement over H:88) |
| `npm run build` | Not run (per policy — user runs manually) |
