/**
 * Server-side cached multi-currency exchange rates.
 *
 * Returns ALL per 1 foreign currency for supported currencies:
 *   EUR — from iliria98.com (Albanian market rate)
 *   USD — derived: ECB EUR/USD cross-rate × EUR/ALL
 *   GBP — derived: ECB EUR/GBP cross-rate × EUR/ALL
 *
 * Cache TTL: 1 hour.
 */
import { unstable_cache } from 'next/cache'

export type ExchangeRates = { EUR: number; USD: number; GBP: number }

async function scrapeEurAllRate(): Promise<number | null> {
  try {
    const res = await fetch('https://iliria98.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; lero.al/1.0)' },
    })
    if (!res.ok) return null
    const html = await res.text()

    const eurBlock =
      html.match(/EUR\.png[\s\S]{0,200}/i) ??
      html.match(/>EUR<[\s\S]{0,200}/i) ??
      html.match(/EUR[^A-Z]{0,200}/i)

    if (eurBlock) {
      const nums = [...eurBlock[0].matchAll(/(\d{2,3}[.,]\d{1,2})/g)]
        .map(m => parseFloat(m[1].replace(',', '.')))
        .filter(n => n >= 80 && n <= 160)
      if (nums.length >= 2) return Math.round(((nums[0] + nums[1]) / 2) * 100) / 100
      if (nums.length === 1) return nums[0]
    }

    const generic = html.match(/EUR[^<\d]{0,80}(\d{2,3}[.,]\d{1,2})/i)
    if (generic) {
      const rate = parseFloat(generic[1].replace(',', '.'))
      if (rate >= 80 && rate <= 160) return rate
    }
    return null
  } catch {
    return null
  }
}

/** Fetch EUR/USD and EUR/GBP cross-rates from open.er-api.com (free, no key). */
async function fetchCrossRates(): Promise<{ usd: number | null; gbp: number | null }> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/EUR', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; lero.al/1.0)' },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return { usd: null, gbp: null }
    const data = await res.json() as { rates?: Record<string, number> }
    const usd = data.rates?.USD ?? null
    const gbp = data.rates?.GBP ?? null
    return { usd, gbp }
  } catch {
    return { usd: null, gbp: null }
  }
}

async function fetchAllRates(): Promise<ExchangeRates | null> {
  const [eurAll, { usd: eurUsd, gbp: eurGbp }] = await Promise.all([
    scrapeEurAllRate(),
    fetchCrossRates(),
  ])

  if (!eurAll) return null

  // Derive ALL per 1 USD/GBP via EUR as pivot:
  //   1 EUR = eurAll ALL
  //   1 EUR = eurUsd USD → 1 USD = (eurAll / eurUsd) ALL
  //   1 EUR = eurGbp GBP → 1 GBP = (eurAll / eurGbp) ALL
  const usdRate = eurUsd ? Math.round((eurAll / eurUsd) * 100) / 100 : Math.round(eurAll / 1.08 * 100) / 100
  const gbpRate = eurGbp ? Math.round((eurAll / eurGbp) * 100) / 100 : Math.round(eurAll / 0.86 * 100) / 100

  return { EUR: eurAll, USD: usdRate, GBP: gbpRate }
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
