# Task 95 — Active filter chip: entire button as click target

**Date:** 2026-05-19
**Sprint:** Sprint 1 — Bugfix Continuation & Admin Polish
**Status:** ✅ PASS

---

## Problem summary

Active filter chips consisted of a `<span>` container with an inner raw `<button>` for the × icon only. Clicking the chip label did nothing — the filter only removed when the 12px × icon was hit precisely, which was too small for both mouse and touch input.

---

## Investigation

### Component location

`src/modules/listings/components/ActiveFilterChips.tsx` — one component, used in `ListingsShell.tsx`. No admin equivalent found.

### Before

```tsx
<span className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full bg-primary/10 ...">
  {chip.label}
  <button
    type="button"
    onClick={() => removeChip(chip)}
    className="hover:opacity-60 transition-opacity leading-none"
    aria-label={t('aria_remove_filter')}
  >
    <X className="h-3 w-3" />
  </button>
</span>
```

Issues:
- `onClick` only on the tiny 12px × icon
- `<span>` has no interactive role
- `<button>` inside `<span>` = raw button governance violation
- Touch target: ~12px height — far below 44px minimum

### After

```tsx
<button
  key={chip.key}
  type="button"
  onClick={() => removeChip(chip)}
  className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 select-none hover:bg-primary/20 transition-colors min-h-[44px] sm:min-h-0"
  aria-label={`${chip.label} — ${t('aria_remove_filter')}`}
>
  {chip.label}
  <X className="h-3 w-3 shrink-0" aria-hidden="true" />
</button>
```

Changes:
1. `<span>` → `<button>` — whole chip is the interactive element
2. Inner `<button>` removed — no longer needed
3. `onClick` on outer `<button>` (whole chip)
4. `hover:bg-primary/20 transition-colors` — visual hover feedback on whole chip
5. `min-h-[44px] sm:min-h-0` — 44px touch target on mobile (<640px), natural h-7 on sm+
6. `aria-label="${chip.label} — ${t('aria_remove_filter')}"` — includes both filter value and action for screen readers
7. `<X aria-hidden="true" shrink-0>` — decorative only, `shrink-0` prevents flex shrink

---

## Keyboard accessibility

The `<button>` element natively:
- **Tab** — focuses the chip
- **Enter / Space** — triggers `onClick` → removes filter
- **Escape** — default browser behavior: blurs the button (no extra handling needed)

---

## Touch target

| Breakpoint | Height |
|---|---|
| base (320–639px) | 44px (`min-h-[44px]`) |
| sm+ (≥640px) | 28px (`h-7`, `sm:min-h-0` clears min constraint) |

---

## Localization coverage

All 4 locales: `t('aria_remove_filter')` = "Hiq filtrin" (sq) / "Remove filter" (en) / "Видалити фільтр" (uk) / "Rimuovi filtro" (it). Chip labels come from filter value translations already in use.

---

## Files changed

- `src/modules/listings/components/ActiveFilterChips.tsx`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-95-filter-chip-click-target.md` (this file)

---

## Validation

| Command | Result |
|---|---|
| `npm run lint` | ✅ 0 errors / 5 warnings (all pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing test errors, 0 new |
| `npm run build` | Not run (per policy — user runs manually) |
