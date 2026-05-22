/**
 * Server-side cached multi-currency exchange rates.
 *
 * Pipeline — canonical source: iliria98.com (Albanian market rates).
 *   EUR/ALL — scraped directly from iliria98.com
 *   USD/ALL — scraped directly from iliria98.com; derivation fallback if not found
 *   GBP/ALL — scraped directly from iliria98.com; derivation fallback if not found
 *
 * Derivation fallback (when a currency is absent from iliria98):
 *   USD/ALL = EUR/ALL ÷ EUR/USD  (cross-rate from open.er-api.com)
 *   GBP/ALL = EUR/ALL ÷ EUR/GBP  (cross-rate from open.er-api.com)
 *   The EUR/ALL pivot always comes from iliria98 — open.er-api.com supplies only
 *   the cross-rate denominator, never the ALL value itself.
 *
 * If iliria98 returns no EUR/ALL rate, the whole fetch returns null (no rates).
 * Cache TTL: 1 hour.
 */
import { unstable_cache } from 'next/cache'

export type ExchangeRates = { EUR: number; USD: number; GBP: number }

// Plausible ALL/currency bounds used for sanity-filtering scraped numbers.
const ALL_RATE_BOUNDS: Record<string, [number, number]> = {
  EUR: [80, 160],
  USD: [70, 140],
  GBP: [90, 180],
}

/**
 * Scrape multiple currency rates from iliria98.com in a single HTTP request.
 * Returns ALL per 1 foreign currency for each requested currency, or null if
 * the rate could not be parsed from the page.
 */
async function scrapeIliria98Rates(
  currencies: string[],
): Promise<Record<string, number | null>> {
  const result: Record<string, number | null> = Object.fromEntries(
    currencies.map(c => [c, null]),
  )
  try {
    const res = await fetch('https://iliria98.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; lero.al/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return result
    const html = await res.text()

    for (const currency of currencies) {
      const [min, max] = ALL_RATE_BOUNDS[currency] ?? [0, 9999]

      const block =
        html.match(new RegExp(`${currency}\\.png[\\s\\S]{0,200}`, 'i')) ??
        html.match(new RegExp(`>${currency}<[\\s\\S]{0,200}`, 'i')) ??
        html.match(new RegExp(`${currency}[^A-Z]{0,200}`, 'i'))

      if (block) {
        const nums = [...block[0].matchAll(/(\d{2,3}[.,]\d{1,2})/g)]
          .map(m => parseFloat(m[1].replace(',', '.')))
          .filter(n => n >= min && n <= max)
        if (nums.length >= 2) {
          result[currency] = Math.round(((nums[0] + nums[1]) / 2) * 100) / 100
          continue
        }
        if (nums.length === 1) {
          result[currency] = nums[0]
          continue
        }
      }

      const generic = html.match(
        new RegExp(`${currency}[^<\\d]{0,80}(\\d{2,3}[.,]\\d{1,2})`, 'i'),
      )
      if (generic) {
        const rate = parseFloat(generic[1].replace(',', '.'))
        if (rate >= min && rate <= max) result[currency] = rate
      }
    }
  } catch {
    // leave all currencies as null
  }
  return result
}

/**
 * Fetch EUR/USD and EUR/GBP cross-rates from open.er-api.com (free, no key).
 * Used ONLY as a denominator in the derivation fallback — never as a direct
 * source of ALL-denominated rates. See pipeline doc in docs/integrations.md.
 */
async function fetchCrossRates(): Promise<{ usd: number | null; gbp: number | null }> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/EUR', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; lero.al/1.0)' },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return { usd: null, gbp: null }
    const data = await res.json() as { rates?: Record<string, number> }
    return {
      usd: data.rates?.USD ?? null,
      gbp: data.rates?.GBP ?? null,
    }
  } catch {
    return { usd: null, gbp: null }
  }
}

async function fetchAllRates(): Promise<ExchangeRates | null> {
  // Primary: scrape EUR, USD, GBP from iliria98.com in one request
  const iliria98 = await scrapeIliria98Rates(['EUR', 'USD', 'GBP'])
  const eurAll = iliria98['EUR']
  if (!eurAll) return null  // EUR/ALL is mandatory; abort if unavailable

  let usdAll = iliria98['USD']
  let gbpAll = iliria98['GBP']

  // Derivation fallback: pivot through EUR/ALL when USD/ALL or GBP/ALL are absent from iliria98
  if (!usdAll || !gbpAll) {
    const cross = await fetchCrossRates()
    // 1 USD = (EUR/ALL) ÷ (EUR/USD cross-rate)
    if (!usdAll && cross.usd) usdAll = Math.round((eurAll / cross.usd) * 100) / 100
    // 1 GBP = (EUR/ALL) ÷ (EUR/GBP cross-rate)
    if (!gbpAll && cross.gbp) gbpAll = Math.round((eurAll / cross.gbp) * 100) / 100
  }

  // If derivation also fails, omit those currencies rather than return stale hardcoded values
  if (!usdAll || !gbpAll) return null

  return { EUR: eurAll, USD: usdAll, GBP: gbpAll }
}

export const getExchangeRates = unstable_cache(
  fetchAllRates,
  ['exchange-rates'],
  { revalidate: 3600 },
)

/**
 * Convert a price between any two supported currencies via ALL as pivot.
 * rates: ExchangeRates (ALL per 1 foreign currency).
 * Returns original price if conversion is not possible.
 */
export function convertPrice(
  price: number,
  from: string,
  to: string,
  rates: ExchangeRates | null,
): number {
  if (!rates || from === to) return price

  // Convert to ALL first (normalize), then to target
  let allPrice = price
  if (from !== 'ALL') {
    const rateFrom = rates[from as keyof ExchangeRates]
    if (!rateFrom) return price
    allPrice = Math.round(price * rateFrom)
  }

  if (to === 'ALL') return allPrice

  const rateTo = rates[to as keyof ExchangeRates]
  if (!rateTo) return allPrice
  return Math.round(allPrice / rateTo)
}

/** Legacy: returns EUR/ALL rate for backward-compatible API. */
export async function getExchangeRate(): Promise<number | null> {
  const rates = await getExchangeRates()
  return rates?.EUR ?? null
}
