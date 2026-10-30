/**
 * Server-side cached multi-currency exchange rates.
 *
 * Pipeline — ONE source: iliria98.com (Albanian market rates), read from its public page with no key (Task 923 R79, owner decision D57).
 *   Currency list is driven by the active currency catalog (DB currencies table).
 *   EUR/ALL is the mandatory pivot; if it cannot be read the read FAILS (it is not cached) and the last good set is served.
 *
 * Per active catalog currency (excluding ALL, which is the implicit pivot):
 *   1. Read it from iliria98.com.
 *   2. If iliria98 does not publish it: the currency is left out (shown without conversion) and the miss is logged — never a made-up rate and no second source
 *      (the old fallback derived it from open.er-api.com; that path is gone).
 *
 * Every successful read is stored on the server (`public.currency_rates`, service role only: `from_currency` = code, `to_currency` = 'ALL'), so a failed read serves
 * the last good set instead of removing the rates every visitor sees. A failure is never cached as a result: the cached function throws, and `unstable_cache` does
 * not keep a thrown error.
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

const SOURCE_URL = 'https://iliria98.com/'
const PIVOT = 'ALL'

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
      .neq('code', PIVOT)
    if (data && data.length > 0) return (data as { code: string }[]).map(r => r.code)
  } catch {
    // fall through to fallback
  }
  return FALLBACK_CODES
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** `reachable` tells "the page could not be read" from "the page does not publish this currency" */
async function scrapeIliria98Rates(
  currencies: string[],
): Promise<{ rates: Record<string, number | null>; reachable: boolean }> {
  const result: Record<string, number | null> = Object.fromEntries(
    currencies.map(c => [c, null]),
  )
  try {
    const res = await fetch(SOURCE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; lero.al/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return { rates: result, reachable: false }
    const html = await res.text()

    for (const currency of currencies) {
      const [min, max] = ALL_RATE_BOUNDS[currency] ?? DEFAULT_BOUNDS
      // the code is a literal word in the patterns below (Task 923 Revision 7): a code with a pattern character in it must not change or break them
      const word = escapeRegExp(currency)

      const block =
        html.match(new RegExp(`${word}\\.png[\\s\\S]{0,200}`, 'i')) ??
        html.match(new RegExp(`>${word}<[\\s\\S]{0,200}`, 'i')) ??
        html.match(new RegExp(`${word}[^A-Z]{0,200}`, 'i'))

      if (block) {
        // only this currency's own numbers (Task 923 Revision 7): the window runs 200 characters on, into the next currency's row, and a rate averaged with a
        // neighbour's number is a wrong rate that looks right
        const own = block[0].slice(3).split(/[A-Z]{3}\.png|>[A-Z]{3}</i)[0]
        const nums = [...own.matchAll(/(\d{2,3}[.,]\d{1,2})/g)]
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
        new RegExp(`${word}[^<\\d]{0,80}(\\d{2,3}[.,]\\d{1,2})`, 'i'),
      )
      if (generic) {
        const rate = parseFloat(generic[1].replace(',', '.'))
        if (rate >= min && rate <= max) result[currency] = rate
      }
    }
    return { rates: result, reachable: true }
  } catch {
    // leave all currencies as null
    return { rates: result, reachable: false }
  }
}

/**
 * Does iliria98.com publish a rate for this currency? `null` when the page could not be read (unknown). The administrator cannot activate a currency that is not
 * published (`rate_unavailable`, Task 923 R79 (a)); the pivot ALL needs no rate.
 */
export async function isRatePublished(code: string): Promise<boolean | null> {
  const normalized = code.trim().toUpperCase()
  if (normalized === PIVOT) return true
  const { rates, reachable } = await scrapeIliria98Rates([normalized])
  if (!reachable) return null
  return rates[normalized] !== null && rates[normalized] !== undefined
}

class RatesUnavailable extends Error {}

/** the last good set from the database; `null` when none was ever stored or the euro (the pivot) is not in it */
async function readStoredRates(): Promise<ExchangeRates | null> {
  try {
    const { data, error } = await createAdminClient()
      .from('currency_rates')
      .select('from_currency, rate')
      .eq('to_currency', PIVOT)
    if (error || !data) return null
    const rates: ExchangeRates = {}
    for (const row of data as { from_currency: string; rate: number | string }[]) {
      const rate = Number(row.rate)
      if (Number.isFinite(rate) && rate > 0) rates[row.from_currency] = rate
    }
    return rates['EUR'] ? rates : null
  } catch {
    return null
  }
}

/** every successful read is stored (one row per currency, replaced on the unique `(from_currency, to_currency)`); a failure is logged and never fails the read */
async function storeRates(rates: ExchangeRates): Promise<void> {
  const fetchedAt = new Date().toISOString()
  const rows = Object.entries(rates).map(([code, rate]) => ({ from_currency: code, to_currency: PIVOT, rate, source_url: SOURCE_URL, fetched_at: fetchedAt }))
  if (rows.length === 0) return
  try {
    const { error } = await createAdminClient().from('currency_rates').upsert(rows, { onConflict: 'from_currency,to_currency' })
    if (error) console.error('[rates] storing the rates failed', { code: error.code })
  } catch (err) {
    console.error('[rates] storing the rates threw', { message: err instanceof Error ? err.message : 'unknown' })
  }
}

async function fetchAllRates(): Promise<ExchangeRates> {
  const activeCodes = await getActiveCurrencyCodes()
  const { rates: iliria98 } = await scrapeIliria98Rates(activeCodes)
  const eurAll = iliria98['EUR']
  // The pivot could not be read: THROW. A thrown error is not cached by `unstable_cache`, so one failed read does not remove the rates for an hour; the caller serves
  // the stored set (R79 (b), C682).
  if (!eurAll) throw new RatesUnavailable('the euro rate could not be read')

  const rates: ExchangeRates = {}
  for (const code of activeCodes) {
    const rate = iliria98[code]
    if (rate !== null && rate !== undefined) {
      rates[code] = rate
    } else {
      // an active currency iliria98 does not publish is shown without conversion (R79 (a)); the miss is logged so it is found
      console.warn('[rates] iliria98 does not publish an active currency', { code })
    }
  }

  await storeRates(rates)
  return rates
}

const cachedRates = unstable_cache(
  fetchAllRates,
  ['exchange-rates'],
  { revalidate: 3600 },
)

/**
 * After a failed read this server instance stays away from the source for this long and serves the stored set (Task 923 R81 (c), review 21 finding F3): without it every
 * listing page and every call of `/api/exchange-rate` waited up to 5 seconds for a source that was down, and turned each visitor request into a request to it.
 */
export const SOURCE_BACKOFF_MS = 5 * 60 * 1000
let sourceFailedAt: number | null = null

export async function getExchangeRates(): Promise<ExchangeRates | null> {
  if (sourceFailedAt !== null && Date.now() - sourceFailedAt < SOURCE_BACKOFF_MS) return readStoredRates()
  try {
    const rates = await cachedRates()
    sourceFailedAt = null
    return rates
  } catch {
    // a failed read serves the LAST GOOD set; the failure is not kept as an answer (the cache keeps nothing), only remembered here for the back-off above
    sourceFailedAt = Date.now()
    return readStoredRates()
  }
}

/** Legacy: returns EUR/ALL rate for backward-compatible API. */
export async function getExchangeRate(): Promise<number | null> {
  const rates = await getExchangeRates()
  return rates?.EUR ?? null
}
