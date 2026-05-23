# Task 213 — T.4: Unify List/Card Price Template — Per-m² in List View

**Date:** 2026-05-23  
**Epic:** T — Global UX Polish & Forms  
**Status:** ✅ Complete

## Root cause

`ListingCard.tsx` rendered two diverged price blocks:
- **Vertical (Card view):** price + old/strikethrough price + original price string + per-m²
- **Horizontal (List view):** price + old/strikethrough price + original price string — **per-m² missing**

## What changed

### `src/modules/listings/components/ListingCard.tsx`

**Added `PriceBlock`** interface + function above `ListingCard`:
```tsx
interface PriceBlockProps {
  displayPrice: number
  activeCurrency: string
  locale: string
  displayPriceOld: number | null
  originalPriceStr: string | null
  pricePerSqm: number | null
  perSqmLabel: string
  priceSize: 'base' | 'lg'
}

function PriceBlock({ ... }: PriceBlockProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className={cn(priceSize === 'lg' ? 'text-lg' : 'text-base', 'font-bold text-primary')}>
            {formatPrice(displayPrice, activeCurrency, locale)}
          </span>
          {displayPriceOld && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(displayPriceOld, activeCurrency, locale)}
            </span>
          )}
        </div>
        {originalPriceStr && (
          <span className="text-[10px] text-muted-foreground/70 leading-tight">{originalPriceStr}</span>
        )}
      </div>
      {pricePerSqm && (
        <span className="text-xs text-muted-foreground">
          {formatPrice(pricePerSqm, activeCurrency, locale)} {perSqmLabel}
        </span>
      )}
    </div>
  )
}
```

**Horizontal variant** — replaced inline price div with:
```tsx
<div className="mt-2">
  <PriceBlock ... priceSize="base" />
</div>
```

**Vertical variant** — replaced `<div className="flex items-start justify-between">` block with:
```tsx
<PriceBlock ... priceSize="lg" />
```

## Verification
- `grep formatPrice ListingCard.tsx` — all `formatPrice` calls for card price rendering are exclusively inside `PriceBlock`
- Both `<PriceBlock priceSize="base">` (horizontal) and `<PriceBlock priceSize="lg">` (vertical) receive `pricePerSqm`
- Task 176 currency correctness preserved: `pricePerSqm` derives from `displayPrice` (converted), labelled with `activeCurrency`
- `tsc --noEmit` → 0 errors
