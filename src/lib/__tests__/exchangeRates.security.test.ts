// @vitest-environment node
/**
 * Security and availability (Task 923 R79, owner decision D57): one rate source, and the last good rates survive a failed read.
 *  - SEC-X-SRV-RATES-LAST-GOOD: the REAL `getExchangeRates` runs against a database double (the catalogue and the `currency_rates` store) and a network double. A successful
 *    read is stored; a failed read afterwards serves the STORED set (not null), the failure is not kept as an answer (the next call reads again and recovers), a currency
 *    iliria98 does not publish comes without a rate, and no host other than iliria98.com is ever asked (the open.er-api.com fallback is gone).
 * `unstable_cache` is replaced by a double that behaves like the real one on the point that matters here: a thrown error is NOT kept, a returned value is.
 *  - SEC-X-SRV-RATES-BACKOFF (Task 923 R81 (c)): after a failed read the instance does not ask the source again for 5 minutes (it serves the stored set); the first call after
 *    the 5 minutes asks once more. The module is loaded fresh for each test (its memory of a failure is module state) and only `Date` is faked.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  cache: new Map<string, unknown>(),
  stored: {} as Record<string, number>,
  active: ['EUR', 'USD', 'GBP'] as string[],
}))

vi.mock('next/cache', () => ({
  unstable_cache: (fn: () => Promise<unknown>, keys: string[]) => async () => {
    const key = keys.join('|')
    if (state.cache.has(key)) return state.cache.get(key)
    const value = await fn()                       // a throw leaves nothing in the cache
    state.cache.set(key, value)
    return value
  },
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => table === 'currency_rates'
      ? {
          upsert: async (rows: { from_currency: string; to_currency: string; rate: number }[]) => { for (const r of rows) state.stored[r.from_currency] = r.rate; return { error: null } },
          select: () => ({ eq: async () => ({ data: Object.entries(state.stored).map(([from_currency, rate]) => ({ from_currency, rate })), error: null }) }),
        }
      : { select: () => ({ eq: () => ({ neq: async () => ({ data: state.active.map((code) => ({ code })), error: null }) }) }) },
  }),
}))

const fetchMock = vi.fn()
let page: string | null = null
let getExchangeRates: () => Promise<Record<string, number> | null>
let SOURCE_BACKOFF_MS: number
const advance = (ms: number) => vi.setSystemTime(Date.now() + ms)

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-20T12:00:00Z'))
  vi.resetModules()
  ;({ getExchangeRates, SOURCE_BACKOFF_MS } = await import('../getExchangeRateServer'))
  state.cache.clear()
  state.stored = {}
  state.active = ['EUR', 'USD', 'GBP']
  page = '<img src="EUR.png"> 100.00 101.00 <img src="USD.png"> 90.00 91.00 <img src="GBP.png"> 120.00 121.00'
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (url: string) => {
    if (!String(url).startsWith('https://iliria98.com')) throw new Error(`a request to another host: ${url}`)
    if (page === null) throw new Error('offline')
    return { ok: true, text: async () => page }
  })
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('exchangeRates', () => {
  it('[SEC-X-SRV-RATES-LAST-GOOD] one source and the last good rates', async () => {
    // a successful read is returned and stored
    expect(await getExchangeRates()).toEqual({ EUR: 100.5, USD: 90.5, GBP: 120.5 })
    expect(state.stored).toEqual({ EUR: 100.5, USD: 90.5, GBP: 120.5 })

    // the page goes down and the cache is empty (an hour later): the stored set is served, never null
    state.cache.clear()
    page = null
    expect(await getExchangeRates()).toEqual({ EUR: 100.5, USD: 90.5, GBP: 120.5 })

    // the failure was not kept as an answer: once the back-off is over and the page is back with new numbers, the very next call reads them and stores them
    expect(state.cache.size, 'the failure left nothing in the cache').toBe(0)
    page = '<img src="EUR.png"> 110.00 111.00 <img src="USD.png"> 95.00 96.00 <img src="GBP.png"> 125.00 126.00'
    advance(SOURCE_BACKOFF_MS)
    expect(await getExchangeRates()).toEqual({ EUR: 110.5, USD: 95.5, GBP: 125.5 })
    expect(state.stored.EUR).toBe(110.5)

    // a currency the page does not publish comes without a rate, and the rest is served
    state.cache.clear()
    page = '<img src="EUR.png"> 100.00 101.00 <img src="USD.png"> 90.00 91.00'
    expect(await getExchangeRates()).toEqual({ EUR: 100.5, USD: 90.5 })

    // no host other than iliria98.com was ever asked, whatever happened
    for (const [url] of fetchMock.mock.calls) expect(String(url)).toBe('https://iliria98.com/')
  })

  it('without a stored set a failed read still gives null, and the next successful read recovers (the controls)', async () => {
    page = null
    expect(await getExchangeRates()).toBeNull()
    page = '<img src="EUR.png"> 100.00 101.00'
    state.active = ['EUR']
    advance(SOURCE_BACKOFF_MS)
    expect(await getExchangeRates()).toEqual({ EUR: 100.5 })
  })

  it('[SEC-X-SRV-RATES-BACKOFF] an outage asks the source once per 5 minutes', async () => {
    // a good read first, so that a stored set exists; then the source goes down and the cache is empty
    expect(await getExchangeRates()).toEqual({ EUR: 100.5, USD: 90.5, GBP: 120.5 })
    state.cache.clear()
    page = null
    fetchMock.mockClear()
    const stored = { EUR: 100.5, USD: 90.5, GBP: 120.5 }
    // the first call after the outage asks the source once and serves the stored set
    expect(await getExchangeRates()).toEqual(stored)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    // ten more calls inside the 5 minutes make no request at all and serve the same set
    for (let i = 0; i < 10; i++) {
      advance(25_000)
      expect(await getExchangeRates()).toEqual(stored)
    }
    expect(fetchMock, 'ten calls, one request in all').toHaveBeenCalledTimes(1)
    // the first call after the 5 minutes asks once more (the source is still down), and the back-off starts again
    advance(SOURCE_BACKOFF_MS)
    expect(await getExchangeRates()).toEqual(stored)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    for (let i = 0; i < 10; i++) { advance(10_000); await getExchangeRates() }
    expect(fetchMock).toHaveBeenCalledTimes(2)
    // the source is back: the next window reads it, the back-off is forgotten and the cache serves the following calls without a request
    page = '<img src="EUR.png"> 110.00 111.00 <img src="USD.png"> 95.00 96.00 <img src="GBP.png"> 125.00 126.00'
    advance(SOURCE_BACKOFF_MS)
    expect(await getExchangeRates()).toEqual({ EUR: 110.5, USD: 95.5, GBP: 125.5 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    await getExchangeRates()
    expect(fetchMock, 'served from the cache').toHaveBeenCalledTimes(3)
    // the other source is never asked, whatever happened
    for (const [url] of fetchMock.mock.calls) expect(String(url)).toBe('https://iliria98.com/')
  })
})
