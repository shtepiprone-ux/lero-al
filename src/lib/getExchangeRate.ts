/**
 * Server-side cached multi-currency exchange rates.
 *
 * Pipeline — canonical source: iliria98.com (Albanian market rates).
 *   Currency list is driven by the active currency catalog (DB currencies table).
 *   EUR/ALL is the mandatory pivot; if unavailable the whole fetch returns null.
 *
 * Per active catalog currency (excluding ALL, which is the implicit pivot):
 *   1. Attempt direct scrape from iliria98.com.
 *   2. If absent from iliria98: derive via EUR/ALL ÷ EUR/X (open.er-api.com cross-rate).
 *   3. If derivation also fails: exclude that currency — never fake a rate.
 *
 * See docs/integrations.md "Exchange Rate Pipeline" for the full policy.
 * Cache TTL: 1 hour.
 */
import { unstable_cache } from 'next/cache'

/** ALL per 1 unit of each active catalog currency code (keyed by currency code). */
export type ExchangeRates = Record<string, number>

// Plausible ALL/currency bounds for sanity-filtering scraped numbers.
// Currencies absent from this map get wide permissive bounds.
const ALL_RATE_BOUNDS: Record<string, [number, number]> = {
  EUR: [80, 160],
  USD: [70, 140],
  GBP: [90, 180],
}

const DEFAULT_BOUNDS: [number, number] = [0, 9999]

// Used when the DB is unavailable — mirrors the canonical seed rows (Task 177).
const FALLBACK_CODES = ['EUR', 'USD', 'GBP']

async function getActiveCurrencyCodes(): Promise<string[]> {
  try {
    // Dynamic import keeps createAdminClient out of the client bundle
    // (convertPrice is imported by client components; getActiveCurrencyCodes is server-only)
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const db = createAdminClient()
    const { data } = await db
      .from('currencies')
      .select('code')
      .eq('is_active', true)
      .neq('code', 'ALL')
    if (data && data.length > 0) return (data as { code: string }[]).map(r => r.code)
  } catch {
    // fall through to fallback
  }
  return FALLBACK_CODES
}

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
      const [min, max] = ALL_RATE_BOUNDS[currency] ?? DEFAULT_BOUNDS

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
 * Fetch EUR/X cross-rates from open.er-api.com for currencies absent from iliria98.
 * open.er-api.com supplies only the EUR/X denominator — never the ALL value directly.
 * Used ONLY as a derivation fallback; see pipeline docs in docs/integrations.md.
 */
async function fetchCrossRates(
  codes: string[],
): Promise<Record<string, number | null>> {
  const result: Record<string, number | null> = Object.fromEntries(
    codes.map(c => [c, null]),
  )
  if (codes.length === 0) return result
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/EUR', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; lero.al/1.0)' },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return result
    const data = await res.json() as { rates?: Record<string, number> }
    for (const code of codes) {
      result[code] = data.rates?.[code] ?? null
    }
  } catch {
    // leave all as null
  }
  return result
}

async function fetchAllRates(): Promise<ExchangeRates | null> {
  // Read active catalog currencies (ALL excluded — it is the implicit pivot)
  const activeCodes = await getActiveCurrencyCodes()

  // Primary: scrape all active currencies from iliria98.com in one request
  const iliria98 = await scrapeIliria98Rates(activeCodes)
  const eurAll = iliria98['EUR']
  if (!eurAll) return null  // EUR/ALL is mandatory; abort if unavailable

  const rates: ExchangeRates = {}
  const needsCrossRate: string[] = []

  for (const code of activeCodes) {
    const rate = iliria98[code]
    if (rate !== null && rate !== undefined) {
      rates[code] = rate
    } else {
      needsCrossRate.push(code)
    }
  }

  // Derivation fallback: for currencies absent from iliria98, derive via EUR/ALL ÷ EUR/X
  if (needsCrossRate.length > 0) {
    const crossRates = await fetchCrossRates(needsCrossRate)
    for (const code of needsCrossRate) {
      const eurX = crossRates[code]
      if (eurX) {
        // 1 X = (EUR/ALL) ÷ (EUR/X cross-rate)
        rates[code] = Math.round((eurAll / eurX) * 100) / 100
      }
      // If derivation also fails, exclude this currency — never fake a rate
    }
  }

  if (!rates['EUR']) return null

  return rates
}

export const getExchangeRates = unstable_cache(
  fetchAllRates,
  ['exchange-rates'],
  { revalidate: 3600 },
)

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

/** Legacy: returns EUR/ALL rate for backward-compatible API. */
export async function getExchangeRate(): Promise<number | null> {
  const rates = await getExchangeRates()
  return rates?.EUR ?? null
}
