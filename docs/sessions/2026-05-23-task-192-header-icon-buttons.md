# Task 192 — Q.3: Header icon buttons — single canonical config

**Date:** 2026-05-23  
**Epic:** Q — Combobox & UI Primitive Single-Source  
**Status:** ✅ Complete

## Pre-read findings

- **NotificationBell**: `Button size="icon" variant="ghost" className="relative rounded-xl"` + `<Bell className="size-5" />` → 40×40px, `rounded-xl`, 20px icon ✅ (reference)
- **Favorites (auth)**: `Link className={buttonVariants({ variant:'ghost', size:'sm' }) + 'gap-1 px-2'}` + `<Heart className="h-4 w-4" />` → h-7 (not square), `rounded-[min(var(--radius-md),12px)]`, 16px icon ❌
- **Favorites (unauth)**: `Button size="sm" variant="ghost" className="gap-1 px-2"` + `<Heart className="h-4 w-4" />` → same as above ❌
- **Hamburger**: `SheetTrigger className={buttonVariants({ variant:'ghost', size:'icon' })}` → 40×40px, but no `rounded-xl` (only base `rounded-lg`) ❌

## Changes

### `src/components/layout/Header.tsx`

Added module-level shared constant before `NavLinks`:
```tsx
const ICON_BTN = 'rounded-xl'
```

Favorites (authenticated Link):
```tsx
<Link
  href={`/${locale}/favorites`}
  className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), ICON_BTN, 'hidden sm:flex')}
  aria-label={t('favorites')}
>
  <Heart className="size-5" />
</Link>
```

Favorites (unauthenticated Button):
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => openAuthSheet('login')}
  className={cn(ICON_BTN, 'hidden sm:flex')}
  aria-label={t('favorites')}
>
  <Heart className="size-5" />
</Button>
```

Mobile hamburger SheetTrigger:
```tsx
<SheetTrigger
  className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), ICON_BTN, 'md:hidden')}
  aria-label={tc('aria_open_menu')}
>
```

`NotificationBell.tsx` — no change (already correct).

## Result

All header icon-action buttons now: `size-10` (40×40px) · `rounded-xl` · `variant="ghost"` · 20px icon.

## Verification

- `tsc --noEmit` → 0 errors
