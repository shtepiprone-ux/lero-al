# Task 225 (T221b) — buttonVariants for raw link/button elements

**Date:** 2026-05-25
**Sprint:** Sprint 11 — UI Debt Follow-ups
**Status:** ✅ DONE

## Scope

Replace raw `<Link>/<a>/<button>/<div>` elements styled as ad-hoc buttons with canonical `buttonVariants()` across 4 sites identified in Task 221a.

## Changes

### `src/app/admin/users/page.tsx`
- Added `buttonVariants` to import from `@/components/ui/button`.
- `<Link className="h-9 rounded-xl ...">` → `className={buttonVariants({ size: 'lg' })}`.

### `src/components/admin/AdminExchangeProvidersManager.tsx`
- Replaced raw `<button className="...rounded-none text-xs">` segmented control (auto/manual/hybrid mode selector) with `<Button size="lg" variant={mode === m ? 'default' : 'ghost'} className="flex-1 rounded-none text-xs">`.
- Container uses `overflow-hidden` to clip buttons into the rounded-xl group → `rounded-none` on each button is correct.

### `src/modules/listings/components/FavoriteButton.tsx`
- Added `size?: 'default' | 'lg' | 'xl'` to `FavoriteButtonProps`.
- `size={shape === 'pill' ? size : undefined}` forwarded to `<Button>` (icon shape unaffected).

### `src/modules/listings/components/SaveToCollectionButton.tsx`
- Added `size?: 'default' | 'lg' | 'xl'` to `Props`.
- `size={variant === 'icon' ? 'icon-sm' : 'sm'}` → `size={variant === 'icon' ? 'icon-sm' : (size ?? 'sm')}` (backward compatible).

### `src/modules/listings/components/ListingContact.tsx`
- Import: added `buttonVariants` alongside `Button`.
- FavoriteButton call: removed `h-9` from className, added `size="lg"`.
- SaveToCollectionButton call: removed `h-9` from className, added `size="lg"`.
- Desktop sidebar WhatsApp `<a>`: `className={cn(buttonVariants({ size: 'xl', variant: 'default' }), 'bg-whatsapp hover:bg-whatsapp/90')}` + `<MessageCircle className="size-5" />`.
- Desktop sidebar Phone `<a>`: `className={buttonVariants({ size: 'xl', variant: 'outline' })}` + `<Phone className="size-5" />`.
- Desktop sidebar Message `<Link>`: `className={buttonVariants({ size: 'xl', variant: 'default' })}` + `<MessageCircle className="size-5" />`.
- Mobile bar WhatsApp `<a>`: `className={cn(buttonVariants({ size: 'xl', variant: 'default' }), 'bg-whatsapp hover:bg-whatsapp/90')}`.
- Mobile bar Phone `<a>` (icon-only): `className={buttonVariants({ size: 'icon-xl', variant: 'outline' })}` + `<Phone className="size-5" />`.

### `src/modules/listings/components/ListingMobileCTA.tsx`
- Added imports: `cn` from `@/lib/utils`, `buttonVariants` from `@/components/ui/button`.
- Phone `<a>`: `className={cn(buttonVariants({ size: 'xl', variant: 'outline' }), 'shrink-0')}`.
- WhatsApp `<a>`: `className={cn(buttonVariants({ size: 'xl', variant: 'default' }), 'bg-whatsapp hover:bg-whatsapp/90 shrink-0')}`.
- Fixed pre-existing `bg-[color:var(--whatsapp)]` arbitrary color → semantic `bg-whatsapp`.

## Key technical notes

- **CVA svg rule**: `buttonVariants` base includes `[&_svg:not([class*='size-'])]:size-4` — resizes SVGs without `size-*` class to 16px. Icons that were `h-5 w-5` (20px) were converted to `size-5` so the `[class*='size-']` check exempts them.
- **WhatsApp override**: `default` variant includes `[a]:hover:bg-primary/80`; `cn()` + twMerge lets `hover:bg-whatsapp/90` win.

## Verification

`tsc --noEmit` → 0 errors.
