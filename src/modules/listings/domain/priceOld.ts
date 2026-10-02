/**
 * Server-owned `listings.price_old` rule (Sprint 88, Task 917; D88-2 / D88-3).
 *
 * `price_old` holds the highest earlier price while the current price is below it.
 * A raise to or above it, or a currency change, clears it (null).
 * Pure: no I/O.
 */

export interface PriceOldInput {
  prev: { price: number; priceOld: number | null; currency: string }
  next: { price: number; currency: string }
}

export function computeNextPriceOld({ prev, next }: PriceOldInput): number | null {
  if (next.currency !== prev.currency) return null
  const ceiling = Math.max(prev.price, prev.priceOld ?? 0)
  return next.price < ceiling ? ceiling : null
}
