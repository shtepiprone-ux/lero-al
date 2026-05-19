# Task 101 — Hide "Переглянути всі" when Premium section is empty

**Date:** 2026-05-19
**Sprint:** Sprint 1 — Bugfix Continuation & Admin Polish
**Status:** ✅ PASS

---

## Problem

The "Переглянути всі" / "View all" link was always rendered in the Featured (Premium) section, even when there were no premium listings. This created a broken UX: a "View all" button pointing to an empty filtered listings page.

---

## Root cause

The "View all" link lived in `src/app/[locale]/page.tsx` — a **Server Component** — as part of the static section header:

```tsx
<div className="flex items-center justify-between mb-6">
  <h2 ...>{tl('featured')}</h2>
  <Link href={`/${locale}/listings?is_premium=true`} ...>  {/* ← always rendered */}
    {tl('view_all')}
  </Link>
</div>
<FeaturedListings />
```

`FeaturedListings` is a **Client Component** that fetches data via `useFeaturedListings()`. The Server Component parent had no way to know whether listings existed at render time without adding another DB query.

---

## Fix: move section header into `FeaturedListings`

Moved the heading (`<h2>`) and conditional "View all" link into `FeaturedListings.tsx`. The component now owns the full section header:

```tsx
const header = (
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold">{t('featured')}</h2>
    {!loading && listings.length > 0 && (
      <Link href={`/${locale}/listings?is_premium=true`} ...>
        {t('view_all')}
      </Link>
    )}
  </div>
)
```

The `header` element is always rendered (loading and empty states include it), while `t('view_all')` link only appears when `!loading && listings.length > 0`.

Updated `page.tsx` to remove the old static header — the Featured section now just renders `<FeaturedListings />`:

```tsx
<section className="...">
  <div className="container-wide">
    <FeaturedListings />
  </div>
</section>
```

---

## State machine

| State | Heading shown | "View all" shown |
|-------|---------------|-----------------|
| Loading | ✓ (skeleton content) | ✗ (unknown) |
| Empty | ✓ | ✗ |
| Has listings | ✓ | ✓ |

---

## Files changed

- `src/modules/listings/components/FeaturedListings.tsx`
- `src/app/[locale]/page.tsx`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-101-hide-view-all-empty.md` (this file)

---

## i18n keys used (no new keys)

- `listing.featured` — heading ("Premium"/"Featured"/"Преміум"/"In evidenza")
- `listing.view_all` — link label ("Shiko të gjitha"/"View all"/"Переглянути всі"/"Vedi tutti")

Both keys already existed in all 4 locale files from before Task 101.

---

## Localization coverage

All 4 locales render correctly — heading always shows, "View all" conditionally shows.

---

## Validation

| Command | Result |
|---------|--------|
| `npm run lint` | ✅ 0 errors / 5 warnings (pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing test errors, 0 new |
| `npm run build` | Not run (per policy — user runs manually) |
