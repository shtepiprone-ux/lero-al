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
 * Server-only. Client components must import convertPrice / ExchangeRates from
 * `src/lib/getExchangeRate.ts` instead.
 *
 * See docs/integrations.md "Exchange Rate Pipeline" for the full policy.
 * Cache TTL: 1 hour.
 */
import 'server-only'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ExchangeRates } from '@/lib/getExchangeRate'

export type { ExchangeRates }
export { convertPrice } from '@/lib/getExchangeRate'

// Plausible ALL/currency bounds for sanity-filtering scraped numbers.
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
  const activeCodes = await getActiveCurrencyCodes()
  const iliria98 = await scrapeIliria98Rates(activeCodes)
  const eurAll = iliria98['EUR']
  if (!eurAll) return null

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

  if (needsCrossRate.length > 0) {
    const crossRates = await fetchCrossRates(needsCrossRate)
    for (const code of needsCrossRate) {
      const eurX = crossRates[code]
      if (eurX) {
        rates[code] = Math.round((eurAll / eurX) * 100) / 100
      }
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

/** Legacy: returns EUR/ALL rate for backward-compatible API. */
export async function getExchangeRate(): Promise<number | null> {
  const rates = await getExchangeRates()
  return rates?.EUR ?? null
}
