// @vitest-environment node
/**
 * Exchange rates (Task 923 Revision 7): prices are converted with a rate scraped from a third-party page, so the parser must accept only plausible numbers, never
 * make a rate up, and keep working when the page, the cross-rate service or the database is unavailable.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let activeCodes: string[] | 'error' | 'empty' = ['EUR', 'USD', 'GBP']
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))
// the last good set, stored on the server (Task 923 R79 (b)): `currency_rates` with one row per currency
const stored: Record<string, number> = {}
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => table === 'currency_rates'
      ? {
          upsert: async (rows: { from_currency: string; rate: number }[]) => { for (const r of rows) stored[r.from_currency] = r.rate; return { error: null } },
          select: () => ({ eq: async () => ({ data: Object.entries(stored).map(([from_currency, rate]) => ({ from_currency, rate })), error: null }) }),
        }
      : {
          select: () => ({ eq: () => ({ neq: async () => {
            if (activeCodes === 'error') throw new Error('db down')
            return { data: activeCodes === 'empty' ? [] : (activeCodes as string[]).map((code) => ({ code })), error: null }
          } }) }),
        },
  }),
}))

// The module remembers a failed read for 5 minutes (Task 923 R81 (c)): it is loaded fresh for each test so that one test's outage is not the next test's back-off.
type Server = typeof import('../getExchangeRateServer')
let convertPrice: Server['convertPrice']
let getExchangeRate: Server['getExchangeRate']
let getExchangeRates: Server['getExchangeRates']

const fetchMock = vi.fn()
/** the host of an address, compared as a whole (never a substring of the text) */
const hostOf = (u: unknown): string => { try { return new URL(String(u)).hostname } catch { return '' } }
let pageHtml: string | null = null
let pageOk = true
let crossRates: Record<string, number> | null = null
let crossOk = true

beforeEach(async () => {
  vi.resetModules()
  ;({ convertPrice, getExchangeRate, getExchangeRates } = await import('../getExchangeRateServer'))
  for (const key of Object.keys(stored)) delete stored[key]
  activeCodes = ['EUR', 'USD', 'GBP']
  pageHtml = '<img src="EUR.png"> 100.50 101.50 <img src="USD.png"> 90.00 91.00 <img src="GBP.png"> 120.20 121.20'
  pageOk = true
  crossRates = null
  crossOk = true
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (url: string) => {
    if (hostOf(url) === 'iliria98.com') {
      if (pageHtml === null) throw new Error('offline')
      return { ok: pageOk, text: async () => pageHtml }
    }
    return { ok: crossOk, json: async () => ({ rates: crossRates ?? {} }) }
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('scraping the page', () => {
  it('averages the two numbers after the currency image', async () => {
    expect(await getExchangeRates()).toEqual({ EUR: 101, USD: 90.5, GBP: 120.7 })
  })

  it('a single number is used as it is', async () => {
    pageHtml = '<img src="EUR.png"> 100,25 text <img src="USD.png"> 90.5 <img src="GBP.png"> 120.2'
    expect(await getExchangeRates()).toMatchObject({ EUR: 100.25, USD: 90.5, GBP: 120.2 })
  })

  it('numbers outside the plausible range of the currency are ignored', async () => {
    pageHtml = '<img src="EUR.png"> 5.00 999.99 100.40 <img src="USD.png"> 90.0 <img src="GBP.png"> 120.2'
    expect((await getExchangeRates())?.EUR).toBe(100.4)
  })

  it('finds the currency by its ">EUR<" label or by the plain word when there is no image', async () => {
    pageHtml = '<td>>EUR< 100.00 101.00</td> USD kurs: 90.10 <b>GBP</b> 120.30'
    const r = await getExchangeRates()
    expect(r?.EUR).toBe(100.5)
    expect(r?.USD).toBe(90.1)
    expect(r?.GBP).toBe(120.3)
  })

  it('the generic pattern is bounded by the same range', async () => {
    pageHtml = '<img src="EUR.png"> 100.50 101.50 USD: 250.00 GBP: 120.20'
    const r = await getExchangeRates()
    expect(r?.USD).toBeUndefined()
    expect(r?.GBP).toBe(120.2)
  })

  it('a page that is not ok, or does not load, gives no rates when nothing was ever stored (the euro is the pivot)', async () => {
    pageOk = false
    expect(await getExchangeRates()).toBeNull()
    pageOk = true
    pageHtml = null
    expect(await getExchangeRates()).toBeNull()
  })

  it('a page without the euro gives no rates, even if the other currencies are there', async () => {
    pageHtml = '<img src="USD.png"> 90.00 91.00 <img src="GBP.png"> 120.20 121.20'
    expect(await getExchangeRates()).toBeNull()
  })

  it('is asked with a user agent and a timeout', async () => {
    await getExchangeRates()
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers['User-Agent']).toContain('lero.al')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })
})

describe('which currencies are asked for', () => {
  it('the active ones from the catalogue', async () => {
    activeCodes = ['EUR', 'CHF']
    pageHtml = '<img src="EUR.png"> 100.00 101.00 <img src="CHF.png"> 105.00 106.00'
    expect(await getExchangeRates()).toEqual({ EUR: 100.5, CHF: 105.5 })
  })

  it('an empty catalogue or a database failure falls back to EUR, USD and GBP', async () => {
    activeCodes = 'empty'
    expect(Object.keys((await getExchangeRates()) ?? {}).sort()).toEqual(['EUR', 'GBP', 'USD'])
    activeCodes = 'error'
    expect(Object.keys((await getExchangeRates()) ?? {}).sort()).toEqual(['EUR', 'GBP', 'USD'])
  })

  it('a code with a pattern character in it cannot break the other currencies', async () => {
    // the bad codes come FIRST: an error in their pattern would stop the loop before the euro is read
    activeCodes = ['(', 'A.*', 'EUR']
    pageHtml = '<img src="EUR.png"> 100.00 101.00 junk ( A.* 50.00'
    const r = await getExchangeRates()
    expect(r?.EUR).toBe(100.5)
  })
})

describe('one source (Task 923 R79)', () => {
  it('a currency the page does not publish is left out: no second host is asked and nothing is made up', async () => {
    pageHtml = '<img src="EUR.png"> 100.00 101.00 <img src="USD.png"> 90.00 91.00'
    crossRates = { GBP: 0.85 }                                   // a cross-rate service would have answered: it is not asked
    activeCodes = ['EUR', 'USD', 'GBP']
    expect(await getExchangeRates()).toEqual({ EUR: 100.5, USD: 90.5 })
    expect(fetchMock.mock.calls.every(([u]) => hostOf(u) === 'iliria98.com')).toBe(true)
    expect(fetchMock.mock.calls.some(([u]) => hostOf(u) === 'open.er-api.com')).toBe(false)
  })

  it('an unknown currency is left out, and the miss is logged', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    pageHtml = '<img src="EUR.png"> 100.00 101.00'
    activeCodes = ['EUR', 'JPY']
    expect(await getExchangeRates()).toEqual({ EUR: 100.5 })
    expect(warn).toHaveBeenCalledWith('[rates] iliria98 does not publish an active currency', { code: 'JPY' })
  })
})

describe('the helpers', () => {
  it('getExchangeRate is the euro rate, or null', async () => {
    expect(await getExchangeRate()).toBe(101)
    pageOk = false
    expect(await getExchangeRate()).toBe(101)                        // a failed read serves the last good set (Task 923 R79 (b))
    for (const key of Object.keys(stored)) delete stored[key]
    expect(await getExchangeRate()).toBeNull()                        // nothing stored, nothing read: null
  })

  it('convertPrice is the shared one', () => {
    expect(convertPrice(10, 'EUR', 'ALL', { EUR: 100 })).toBe(1000)
  })
})

// Task 923 R38 (case SEC-S56-SRV-DENY)
it('[SEC-S56-SRV-DENY] The exchange-rate lookup reads only the requested currency and escapes its code', async () => {
  // a pattern character in a code cannot break (or widen) the read of the real currency
  activeCodes = ['(', 'A.*', 'EUR']
  pageHtml = '<img src="EUR.png"> 100.00 101.00 junk ( A.* 50.00'
  const rates = await getExchangeRates()
  expect(rates?.EUR).toBe(100.5)
  expect(rates?.['A.*']).not.toBe(rates?.EUR)                // the pattern character does not match the rate of the euro
  expect(rates?.['A.*']).toBeUndefined()                     // Task 951 AC2: a code that is not three letters is never read at all (before: only its own literal label, the code being escaped)
  // a neighbouring currency whose label starts like the requested one is not read as it
  activeCodes = ['EUR', 'USD']
  pageHtml = '<img src="EUR.png"> 100.00 101.00 <img src="USDT.png"> 5.00 6.00 <img src="USD.png"> 90.00 91.00'
  expect((await getExchangeRates())?.USD).toBe(90.5)
})

describe('the catalogue is data from outside (Task 951 AC2)', () => {
  it('only three-letter upper-case codes are read: "__proto__", "ab" and "A.C" get no rate, EUR does', async () => {
    activeCodes = ['__proto__', 'ab', 'A.C', 'EUR']
    pageHtml = '<img src="EUR.png"> 100.00 101.00 ab 90.00 91.00 ABC 70.00 71.00 __proto__ 95.00 96.00 A.C 80.00 81.00'
    expect(await getExchangeRates()).toEqual({ EUR: 100.5 })
  })

  it('Object.prototype is untouched by a hostile code, and the rates have no inherited keys', async () => {
    const before = Object.getOwnPropertyNames(Object.prototype).sort()
    activeCodes = ['__proto__', 'constructor', 'EUR']
    pageHtml = '<img src="EUR.png"> 100.00 101.00 __proto__ 95.00 96.00 constructor 85.00 86.00'
    const rates = await getExchangeRates()
    expect(Object.getOwnPropertyNames(Object.prototype).sort()).toEqual(before)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(Object.keys(rates ?? {})).toEqual(['EUR'])
    expect(Object.getPrototypeOf(rates)).toSatisfy((proto: unknown) => proto === Object.prototype || proto === null)
  })

  it('a code with regex characters cannot change which numbers a letter code gets', async () => {
    activeCodes = ['A.C', 'A|E', 'EUR']
    pageHtml = '<img src="EUR.png"> 100.00 101.00 ABC 70.00 71.00 AEUR 60.00 61.00'
    expect(await getExchangeRates()).toEqual({ EUR: 100.5 })
  })

  it('a catalogue with no valid code falls back to EUR, USD and GBP', async () => {
    activeCodes = ['__proto__', 'ab']
    expect(Object.keys((await getExchangeRates()) ?? {}).sort()).toEqual(['EUR', 'GBP', 'USD'])
  })

  it('isRatePublished refuses a code that is not three letters without asking the source', async () => {
    const { isRatePublished } = await import('../getExchangeRateServer')
    fetchMock.mockClear()
    expect(await isRatePublished('__proto__')).toBe(false)
    expect(await isRatePublished('A.C')).toBe(false)
    expect(await isRatePublished('ab')).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(await isRatePublished(' eur ')).toBe(true)
  })
})
