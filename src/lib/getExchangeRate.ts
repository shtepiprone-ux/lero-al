/**
 * Client-safe exchange rate utilities — pure computation only, no DB access.
 *
 * Server-side fetching (getExchangeRates, getExchangeRate) lives in
 * `src/lib/getExchangeRateServer.ts` which is server-only.
 *
 * See docs/integrations.md "Exchange Rate Pipeline" for the full policy.
 */

/** ALL per 1 unit of each active catalog currency code (keyed by currency code). */
export type ExchangeRates = Record<string, number>

/**
 * Convert a price between any two currencies via ALL as pivot.
 * rates: ExchangeRates — ALL per 1 unit of each foreign currency code.
 * Returns original price if conversion is not possible.
 */
export function convertPrice(
  price: number,
  from: string,
  to: string,
  rates: ExchangeRates | null,
): number {
  if (!rates || from === to) return price

  let allPrice = price
  if (from !== 'ALL') {
    const rateFrom = rates[from]
    if (!rateFrom) return price
    allPrice = Math.round(price * rateFrom)
  }

  if (to === 'ALL') return allPrice

  const rateTo = rates[to]
  if (!rateTo) return allPrice
  return Math.round(allPrice / rateTo)
}
