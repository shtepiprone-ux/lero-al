/**
 * Small client hooks (Task 923 Revision 7): the mobile flag, the presence ping, and the three data loaders that keep a module-level cache. A cache that is shared
 * by every component must be filled once, never serve rates or currencies that are an hour/five minutes old, fall back safely when the server fails, and never
 * set state on a component that is gone.
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); vi.resetModules(); vi.doUnmock('next-intl') })

describe('useIsMobile', () => {
  function stubMatchMedia(matches: boolean) {
    const listeners = new Set<(e: { matches: boolean }) => void>()
    const mq = {
      matches,
      addEventListener: vi.fn((_t: string, l: (e: { matches: boolean }) => void) => listeners.add(l)),
      removeEventListener: vi.fn((_t: string, l: (e: { matches: boolean }) => void) => listeners.delete(l)),
    }
    const matchMedia = vi.fn(() => mq)
    vi.stubGlobal('matchMedia', matchMedia)
    window.matchMedia = matchMedia as never
    return { mq, matchMedia, fire: (m: boolean) => listeners.forEach((l) => l({ matches: m })), listeners }
  }

  it('asks for "narrower than 1024px", and takes the real answer after the first render', async () => {
    const { useIsMobile } = await import('../useIsMobile')
    const s = stubMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(s.matchMedia).toHaveBeenCalledWith('(max-width: 1023px)')
    expect(result.current).toBe(false)
  })

  it('is true on a narrow screen, and follows the window when it is resized', async () => {
    const { useIsMobile } = await import('../useIsMobile')
    const s = stubMatchMedia(true)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
    act(() => s.fire(false))
    expect(result.current).toBe(false)
    act(() => s.fire(true))
    expect(result.current).toBe(true)
  })

  it('stops listening when the component goes away', async () => {
    const { useIsMobile } = await import('../useIsMobile')
    const s = stubMatchMedia(true)
    const { unmount } = renderHook(() => useIsMobile())
    expect(s.listeners.size).toBe(1)
    unmount()
    expect(s.listeners.size).toBe(0)
    expect(s.mq.removeEventListener).toHaveBeenCalledTimes(1)
  })
})

describe('usePresence', () => {
  it('sends one POST to the presence endpoint per mount, with nothing in the body', async () => {
    const { usePresence } = await import('../usePresence')
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })))
    vi.stubGlobal('fetch', fetchMock)
    const { rerender } = renderHook(() => usePresence())
    rerender()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/presence', { method: 'POST' })
  })

  it('a network failure is handled by the hook itself (the promise it got is given a rejection handler)', async () => {
    const { usePresence } = await import('../usePresence')
    const failing = Promise.reject(new Error('offline'))
    const handled = vi.spyOn(failing, 'catch')
    vi.stubGlobal('fetch', vi.fn(() => failing))
    expect(() => renderHook(() => usePresence())).not.toThrow()
    expect(handled).toHaveBeenCalledTimes(1)
    await failing.catch(() => {})
  })
})

describe('useExchangeRate', () => {
  const RATES = { EUR: 100.5, USD: 92 } as never

  async function load() {
    vi.resetModules()
    return (await import('../useExchangeRate')).useExchangeRate
  }
  const answer = (body: unknown) => Promise.resolve({ json: () => Promise.resolve(body) } as Response)

  it('loads once, gives the rates and the EUR rate, and says it is no longer loading', async () => {
    const useExchangeRate = await load()
    const fetchMock = vi.fn(() => answer({ rates: RATES }))
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useExchangeRate())
    expect(result.current).toEqual({ rates: null, rate: null, loading: true })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current).toEqual({ rates: RATES, rate: 100.5, loading: false })
    expect(fetchMock).toHaveBeenCalledWith('/api/exchange-rate')
  })

  it('components mounted together share one request, and a later one uses the cache', async () => {
    const useExchangeRate = await load()
    const fetchMock = vi.fn(() => answer({ rates: RATES }))
    vi.stubGlobal('fetch', fetchMock)
    const a = renderHook(() => useExchangeRate())
    const b = renderHook(() => useExchangeRate())
    await waitFor(() => expect(a.result.current.loading || b.result.current.loading).toBe(false))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const c = renderHook(() => useExchangeRate())
    expect(c.result.current).toEqual({ rates: RATES, rate: 100.5, loading: false })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rates older than an hour are fetched again', async () => {
    const useExchangeRate = await load()
    vi.useFakeTimers({ toFake: ['Date'] })
    const fetchMock = vi.fn(() => answer({ rates: RATES }))
    vi.stubGlobal('fetch', fetchMock)
    const a = renderHook(() => useExchangeRate())
    await waitFor(() => expect(a.result.current.loading).toBe(false))
    vi.setSystemTime(Date.now() + 59 * 60_000)
    renderHook(() => useExchangeRate())
    expect(fetchMock).toHaveBeenCalledTimes(1)
    vi.setSystemTime(Date.now() + 2 * 60_000)
    const c = renderHook(() => useExchangeRate())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(c.result.current.loading).toBe(false))
  })

  it('a failed request gives "no rate" (not a crash), and the next component tries again', async () => {
    const useExchangeRate = await load()
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('offline')).mockImplementation(() => answer({ rates: RATES }))
    vi.stubGlobal('fetch', fetchMock)
    const a = renderHook(() => useExchangeRate())
    await waitFor(() => expect(a.result.current.loading).toBe(false))
    expect(a.result.current).toEqual({ rates: null, rate: null, loading: false })
    const b = renderHook(() => useExchangeRate())
    await waitFor(() => expect(b.result.current.rate).toBe(100.5))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it.each([[{}], [{ rates: null }], [{ other: 1 }]])('an answer without rates (%j) is "no rate"', async (body) => {
    const useExchangeRate = await load()
    vi.stubGlobal('fetch', vi.fn(() => answer(body)))
    const { result } = renderHook(() => useExchangeRate())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.rate).toBeNull()
  })

  it('an answer that is not JSON is "no rate"', async () => {
    const useExchangeRate = await load()
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ json: () => Promise.reject(new SyntaxError('x')) } as Response)))
    const { result } = renderHook(() => useExchangeRate())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current).toEqual({ rates: null, rate: null, loading: false })
  })

  it('rates without EUR give a null EUR rate', async () => {
    const useExchangeRate = await load()
    vi.stubGlobal('fetch', vi.fn(() => answer({ rates: { USD: 1 } })))
    const { result } = renderHook(() => useExchangeRate())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.rate).toBeNull()
  })

  it('a component that is gone before the answer arrives is not updated', async () => {
    const useExchangeRate = await load()
    let release!: () => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((r) => { release = () => r({ json: () => Promise.resolve({ rates: RATES }) } as Response) })))
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { unmount } = renderHook(() => useExchangeRate())
    unmount()
    await act(async () => { release(); await Promise.resolve(); await Promise.resolve() })
    expect(err).not.toHaveBeenCalled()
  })
})

describe('useCurrencies', () => {
  const ROW = { id: 9, code: 'CHF', symbol: 'Fr', name_en: 'Franc' } as never
  const getActive = vi.fn()

  async function load() {
    vi.resetModules()
    getActive.mockReset()
    vi.doMock('@/modules/currency/lib/queries', () => ({ getActiveCurrencies: getActive }))
    return (await import('@/modules/currency/hooks/useCurrencies')).useCurrencies
  }

  it('starts with the built-in list so a price can be shown at once, then uses the real list', async () => {
    const useCurrencies = await load()
    getActive.mockResolvedValue([ROW])
    const { result } = renderHook(() => useCurrencies())
    expect(result.current.loading).toBe(true)
    expect(result.current.currencies.map((c) => c.code)).toEqual(['ALL', 'EUR', 'USD', 'GBP'])
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.currencies).toEqual([ROW])
  })

  it('an empty list from the server keeps the built-in list', async () => {
    const useCurrencies = await load()
    getActive.mockResolvedValue([])
    const { result } = renderHook(() => useCurrencies())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.currencies.map((c) => c.code)).toEqual(['ALL', 'EUR', 'USD', 'GBP'])
  })

  it('a server failure keeps the built-in list and ends loading', async () => {
    const useCurrencies = await load()
    getActive.mockRejectedValue(new Error('db down'))
    const { result } = renderHook(() => useCurrencies())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.currencies.map((c) => c.code)).toEqual(['ALL', 'EUR', 'USD', 'GBP'])
  })

  it('is fetched once for several components and cached for five minutes', async () => {
    const useCurrencies = await load()
    vi.useFakeTimers({ toFake: ['Date'] })
    getActive.mockResolvedValue([ROW])
    const a = renderHook(() => useCurrencies())
    const b = renderHook(() => useCurrencies())
    await waitFor(() => expect(a.result.current.loading || b.result.current.loading).toBe(false))
    expect(getActive).toHaveBeenCalledTimes(1)
    vi.setSystemTime(Date.now() + 4 * 60_000)
    const c = renderHook(() => useCurrencies())
    expect(c.result.current).toEqual({ currencies: [ROW], loading: false })
    expect(getActive).toHaveBeenCalledTimes(1)
    vi.setSystemTime(Date.now() + 2 * 60_000)
    renderHook(() => useCurrencies())
    await waitFor(() => expect(getActive).toHaveBeenCalledTimes(2))
  })

  it('a component that is gone before the answer arrives is not updated', async () => {
    const useCurrencies = await load()
    let release!: (v: unknown[]) => void
    getActive.mockImplementation(() => new Promise((r) => { release = r }))
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { unmount } = renderHook(() => useCurrencies())
    unmount()
    await act(async () => { release([ROW]); await Promise.resolve() })
    expect(err).not.toHaveBeenCalled()
  })
})

describe('usePropertyTypes', () => {
  let locale = 'sq'
  const answer = (rows: unknown, ok = true, status = 200) => Promise.resolve({ ok, status, json: () => Promise.resolve(rows) } as Response)

  async function load() {
    vi.resetModules()
    vi.doMock('next-intl', () => ({ useLocale: () => locale }))
    return (await import('../usePropertyTypes')).usePropertyTypes
  }
  beforeEach(() => { locale = 'sq' })

  it('starts with the built-in types (their own value as the label), then shows the localized ones', async () => {
    const usePropertyTypes = await load()
    const fetchMock = vi.fn(() => answer([{ value: 'apartment', label: 'Apartament' }]))
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => usePropertyTypes())
    expect(result.current.loading).toBe(true)
    expect(result.current.propertyTypes.length).toBeGreaterThan(0)
    expect(result.current.propertyTypes.every((p) => p.label === p.value)).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.propertyTypes).toEqual([{ value: 'apartment', label: 'Apartament' }])
    expect(fetchMock).toHaveBeenCalledWith('/api/property-types?locale=sq')
  })

  it('a server error answer falls back to the built-in types and is not remembered as the real list', async () => {
    const usePropertyTypes = await load()
    const fetchMock = vi.fn().mockImplementationOnce(() => answer({ error: 'x' }, false, 500)).mockImplementation(() => answer([{ value: 'villa', label: 'Vila' }]))
    vi.stubGlobal('fetch', fetchMock)
    const a = renderHook(() => usePropertyTypes())
    await waitFor(() => expect(a.result.current.loading).toBe(false))
    expect(a.result.current.propertyTypes.every((p) => p.label === p.value)).toBe(true)
    const b = renderHook(() => usePropertyTypes())
    await waitFor(() => expect(b.result.current.propertyTypes).toEqual([{ value: 'villa', label: 'Vila' }]))
  })

  it('a network failure falls back as well', async () => {
    const usePropertyTypes = await load()
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    const { result } = renderHook(() => usePropertyTypes())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.propertyTypes.every((p) => p.label === p.value)).toBe(true)
  })

  it('the list is kept per language: another language is fetched on its own, and each is fetched once', async () => {
    const usePropertyTypes = await load()
    const fetchMock = vi.fn((url: string) => answer([{ value: 'apartment', label: url.endsWith('=en') ? 'Apartment' : 'Apartament' }]))
    vi.stubGlobal('fetch', fetchMock)
    const sq = renderHook(() => usePropertyTypes())
    await waitFor(() => expect(sq.result.current.loading).toBe(false))
    locale = 'en'
    const en = renderHook(() => usePropertyTypes())
    await waitFor(() => expect(en.result.current.propertyTypes[0].label).toBe('Apartment'))
    locale = 'sq'
    const again = renderHook(() => usePropertyTypes())
    expect(again.result.current).toEqual({ propertyTypes: [{ value: 'apartment', label: 'Apartament' }], loading: false })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('a change of language while mounted loads that language', async () => {
    const usePropertyTypes = await load()
    vi.stubGlobal('fetch', vi.fn((url: string) => answer([{ value: 'x', label: url.slice(-2) }])))
    const { result, rerender } = renderHook(() => usePropertyTypes())
    await waitFor(() => expect(result.current.propertyTypes[0].label).toBe('sq'))
    locale = 'it'
    rerender()
    await waitFor(() => expect(result.current.propertyTypes[0].label).toBe('it'))
  })

  it('two components asking at once share one request', async () => {
    const usePropertyTypes = await load()
    const fetchMock = vi.fn(() => answer([{ value: 'a', label: 'A' }]))
    vi.stubGlobal('fetch', fetchMock)
    const a = renderHook(() => usePropertyTypes())
    const b = renderHook(() => usePropertyTypes())
    await waitFor(() => expect(a.result.current.loading || b.result.current.loading).toBe(false))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('useLocations and useCompanies', () => {
  it('useLocations gives the searchable locations; a failure is logged and ends loading with an empty list', async () => {
    const getLocations = vi.fn()
    vi.doMock('@/modules/locations/lib/queries', () => ({ getSearchableLocations: getLocations }))
    const { useLocations } = await import('@/modules/locations/hooks/useLocations')
    getLocations.mockResolvedValueOnce([{ id: 1 }])
    const ok = renderHook(() => useLocations())
    expect(ok.result.current).toEqual({ locations: [], loading: true })
    await waitFor(() => expect(ok.result.current.loading).toBe(false))
    expect(ok.result.current.locations).toEqual([{ id: 1 }])

    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    getLocations.mockRejectedValueOnce(new Error('db'))
    const bad = renderHook(() => useLocations())
    await waitFor(() => expect(bad.result.current.loading).toBe(false))
    expect(bad.result.current.locations).toEqual([])
    expect(err).toHaveBeenCalled()
  })

  it('useCompanies gives the companies, a failure keeps the list empty, and refetch loads again', async () => {
    const getCompanies = vi.fn()
    vi.doMock('@/modules/companies/lib/queries', () => ({ getCompanies }))
    const { useCompanies } = await import('@/modules/companies/hooks/useCompanies')
    getCompanies.mockResolvedValueOnce([{ id: 'c1' }])
    const { result } = renderHook(() => useCompanies())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.companies).toEqual([{ id: 'c1' }])

    getCompanies.mockResolvedValueOnce([{ id: 'c1' }, { id: 'c2' }])
    await act(async () => { await result.current.refetch() })
    expect(result.current.companies).toHaveLength(2)

    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    getCompanies.mockRejectedValueOnce(new Error('db'))
    await act(async () => { await result.current.refetch() })
    expect(result.current.companies).toHaveLength(2)
    expect(err).toHaveBeenCalled()

    getCompanies.mockRejectedValueOnce(new Error('db'))
    const fresh = renderHook(() => useCompanies())
    await waitFor(() => expect(fresh.result.current.loading).toBe(false))
    expect(fresh.result.current.companies).toEqual([])
  })
})
