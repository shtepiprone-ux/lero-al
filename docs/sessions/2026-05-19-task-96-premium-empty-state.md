# Task 96 — Replace "Не забувайте" placeholder in Premium empty state

**Date:** 2026-05-19
**Sprint:** Sprint 1 — Bugfix Continuation & Admin Polish
**Status:** ✅ PASS

---

## Investigation

### "Не забувайте" search result

The string "Не забувайте" does not exist in the current codebase or any message files. It was either removed in a prior cleanup or was never committed to the current version. The bug report is valid in principle: the Premium section empty state was using the wrong i18n key.

### Current state before fix

`FeaturedListings.tsx`:
```tsx
if (!listings.length) {
  return (
    <p className="text-center text-muted-foreground py-8">{t('no_listings')}</p>
  )
}
```

`t('no_listings')` from `listing` namespace returns:
- sq: "Nuk ka njoftime" (= "No listings")
- en: "No listings found"
- uk: "Оголошення не знайдено" (= "No listings found")
- it: "Nessun annuncio trovato" (= "No listings found")

This is a generic message for the listings search/grid, not a premium-specific empty state. It does not communicate to the user that the Premium section is temporarily empty.

### Related keys already in codebase

`cabinet.no_listings_PREMIUM` exists in all locales:
- sq: "Asnjë njoftim premium"
- en: "No premium listings"
- uk: "Немає преміум оголошень"
- it: "Nessun annuncio premium"

But this key lives in the `cabinet` namespace (user cabinet/my listings), not `listing` namespace.

---

## Implementation

### 1. Added `listing.no_premium_listings` to all 4 locale files

Inserted after `listing.no_listings` in each file:

| Locale | Value |
|--------|-------|
| sq | `Aktualisht nuk ka oferta premium.` |
| en | `No premium listings right now.` |
| uk | `Зараз немає преміум оголошень.` |
| it | `Al momento non ci sono annunci premium.` |

### 2. Updated `FeaturedListings.tsx`

```tsx
// Before:
<p className="text-center text-muted-foreground py-8">{t('no_listings')}</p>

// After:
<p className="text-center text-muted-foreground py-8">{t('no_premium_listings')}</p>
```

`listing.no_listings` key remains in the file (still used elsewhere in the codebase).

---

## Files changed

- `messages/sq.json`
- `messages/en.json`
- `messages/uk.json`
- `messages/it.json`
- `src/modules/listings/components/FeaturedListings.tsx`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-96-premium-empty-state.md` (this file)

---

## Key counts

Before: 823 per locale. After: **824** per locale. All 4 files balanced.

---

## Localization coverage

| Locale | Empty state message |
|--------|-------------------|
| sq ✅ | "Aktualisht nuk ka oferta premium." |
| en ✅ | "No premium listings right now." |
| uk ✅ | "Зараз немає преміум оголошень." |
| it ✅ | "Al momento non ci sono annunci premium." |

---

## Validation

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors / 5 warnings (all pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing test errors, 0 new |
| Key parity check | ✅ 824 keys in all 4 locale files |
| `npm run build` | Not run (per policy — user runs manually) |
