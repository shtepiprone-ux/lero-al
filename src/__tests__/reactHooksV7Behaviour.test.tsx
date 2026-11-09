/**
 * Task 953 (AC3): the behaviour the five React Compiler rules touched, pinned BEFORE the findings were fixed and kept green after.
 *
 * Each describe block names the file of the findings list of Task 952 (55 findings in 39 files; the list was removed with Task 953) and the rule. The tests drive the real
 * hook or component through React Testing Library and assert on what a caller can observe (the returned values, the DOM, the callbacks), never on how the code is
 * written, so they pass on the unchanged code and on the fixed code.
 */
import React from 'react'
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  locale: 'en',
  user: null as { id: string } | null,
  currencies: vi.fn(),
  companies: vi.fn(),
  channels: [] as Array<{ name: string; handler: (payload: unknown) => void }>,
  removed: [] as string[],
  notificationRows: vi.fn(),
}))

vi.mock('next-intl', () => ({ useLocale: () => state.locale }))
vi.mock('@/modules/currency/lib/queries', () => ({ getActiveCurrencies: () => state.currencies() }))
vi.mock('@/modules/companies/lib/queries', () => ({ getCompanies: () => state.companies() }))
vi.mock('@/modules/auth/context/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }))
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: (name: string) => {
      const entry = { name, handler: (_payload: unknown) => {} }
      state.channels.push(entry)
      const builder = {
        on: (_type: string, _filter: unknown, handler: (payload: unknown) => void) => { entry.handler = handler; return builder },
        subscribe: () => builder,
      }
      return builder
    },
    removeChannel: (channel: unknown) => { state.removed.push(String(channel)) },
    from: (table: string) => {
      expect(table).toBe('notifications')
      const chain = {
        select: () => chain,
        order: () => chain,
        limit: () => state.notificationRows(),
      }
      return chain
    },
  }),
}))

import { useIsMobile } from '@/hooks/useIsMobile'
import { useIdleMount } from '@/lib/performance/tier'
import { useSwipeTrackSync, buildWrappedSlides } from '@/hooks/useSwipeTrackSync'
import { useCabinetListingsRealtime } from '@/modules/cabinet/hooks/useCabinetListingsRealtime'
import { useFavoritesRealtime } from '@/modules/listings/hooks/useFavoritesRealtime'
import { useNotifications } from '@/modules/notifications/hooks/useNotifications'
import { useCompanies } from '@/modules/companies/hooks/useCompanies'

// setup.ts installs the guarded `fetch` with vi.stubGlobal; unstubbing my own stubs would drop it too, so it is put back.
const guardedFetch = global.fetch

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.stubGlobal('fetch', guardedFetch)
  vi.mocked(global.fetch).mockReset()
})

beforeEach(() => {
  state.locale = 'en'
  state.user = null
  state.channels.length = 0
  state.removed.length = 0
})

// ── src/hooks/useIsMobile.ts (set-state-in-effect) ───────────────────────────────────────────────────────────────────────────────

describe('useIsMobile', () => {
  function stubMatchMedia(initial: boolean) {
    const listeners = new Set<(event: { matches: boolean }) => void>()
    const mq = {
      matches: initial,
      addEventListener: (_type: string, handler: (event: { matches: boolean }) => void) => listeners.add(handler),
      removeEventListener: (_type: string, handler: (event: { matches: boolean }) => void) => listeners.delete(handler),
    }
    vi.stubGlobal('matchMedia', () => mq)
    return {
      change(matches: boolean) { mq.matches = matches; act(() => listeners.forEach(l => l({ matches }))) },
      listenerCount: () => listeners.size,
    }
  }

  it('reports the viewport on the client and follows the media query', () => {
    const media = stubMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
    media.change(true)
    expect(result.current).toBe(true)
    media.change(false)
    expect(result.current).toBe(false)
  })

  it('reports mobile when the query matches at mount', () => {
    stubMatchMedia(true)
    expect(renderHook(() => useIsMobile()).result.current).toBe(true)
  })

  it('removes its listener on unmount', () => {
    const media = stubMatchMedia(false)
    const { unmount } = renderHook(() => useIsMobile())
    expect(media.listenerCount()).toBe(1)
    unmount()
    expect(media.listenerCount()).toBe(0)
  })

  it('renders mobile-first on the server, where there is no viewport', async () => {
    const { renderToString } = await import('react-dom/server')
    function Probe() { return <span>{String(useIsMobile())}</span> }
    expect(renderToString(<Probe />)).toContain('true')
  })
})

// ── src/lib/performance/tier.ts useIdleMount (set-state-in-effect) ───────────────────────────────────────────────────────────────

describe('useIdleMount', () => {
  it('is ready at once when nothing is deferred', () => {
    expect(renderHook(() => useIdleMount(false)).result.current).toBe(true)
  })

  it('waits for the idle callback when deferred, and stays ready afterwards', () => {
    vi.useFakeTimers()
    vi.stubGlobal('requestIdleCallback', undefined)
    vi.stubGlobal('cancelIdleCallback', undefined)
    const { result, rerender } = renderHook(({ defer }) => useIdleMount(defer), { initialProps: { defer: true } })
    expect(result.current).toBe(false)
    act(() => { vi.advanceTimersByTime(250) })
    expect(result.current).toBe(true)
    rerender({ defer: true })
    expect(result.current).toBe(true)
  })

  it('uses requestIdleCallback when the browser has it', () => {
    let idle: (() => void) | undefined
    vi.stubGlobal('requestIdleCallback', (cb: () => void) => { idle = cb; return 7 })
    vi.stubGlobal('cancelIdleCallback', vi.fn())
    const { result } = renderHook(() => useIdleMount(true))
    expect(result.current).toBe(false)
    act(() => idle?.())
    expect(result.current).toBe(true)
  })

  it('mounts at once when the caller forces it, and stays mounted after the force is gone', () => {
    vi.useFakeTimers()
    vi.stubGlobal('requestIdleCallback', undefined)
    vi.stubGlobal('cancelIdleCallback', undefined)
    const { result, rerender } = renderHook(({ force }) => useIdleMount(true, force), { initialProps: { force: false } })
    expect(result.current).toBe(false)
    rerender({ force: true })
    expect(result.current).toBe(true)
    rerender({ force: false })
    expect(result.current).toBe(true)
  })

  it('is ready on a render that starts forced', () => {
    vi.useFakeTimers()
    vi.stubGlobal('requestIdleCallback', undefined)
    vi.stubGlobal('cancelIdleCallback', undefined)
    expect(renderHook(() => useIdleMount(true, true)).result.current).toBe(true)
  })
})

// ── src/hooks/useExchangeRate.ts (set-state-in-effect) ───────────────────────────────────────────────────────────────────────────

describe('useExchangeRate', () => {
  const RATES = { EUR: 100, USD: 92 }

  async function loadHook() {
    vi.resetModules()
    const mod = await import('@/hooks/useExchangeRate')
    return mod.useExchangeRate
  }
  function answerWith(rates: unknown) {
    vi.mocked(global.fetch).mockResolvedValue({ json: async () => ({ rates }) } as Response)
  }

  it('loads the rates once, then serves a warm cache without another request', async () => {
    const useExchangeRate = await loadHook()
    answerWith(RATES)
    const first = renderHook(() => useExchangeRate())
    expect(first.result.current).toEqual({ rates: null, rate: null, loading: true })
    await waitFor(() => expect(first.result.current.loading).toBe(false))
    expect(first.result.current.rates).toEqual(RATES)
    expect(first.result.current.rate).toBe(100)

    const second = renderHook(() => useExchangeRate())
    expect(second.result.current).toEqual({ rates: RATES, rate: 100, loading: false })
    await act(async () => { await Promise.resolve() })
    expect(second.result.current.loading).toBe(false)
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)
  })

  it('stops loading with no rates when the request fails', async () => {
    const useExchangeRate = await loadHook()
    vi.mocked(global.fetch).mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useExchangeRate())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.rates).toBeNull()
    expect(result.current.rate).toBeNull()
  })

  it('refetches rates older than an hour and ends with the new ones', async () => {
    const useExchangeRate = await loadHook()
    answerWith(RATES)
    const first = renderHook(() => useExchangeRate())
    await waitFor(() => expect(first.result.current.loading).toBe(false))
    first.unmount()

    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now + 2 * 60 * 60 * 1000)
    answerWith({ EUR: 120 })
    const second = renderHook(() => useExchangeRate())
    await waitFor(() => expect(second.result.current.rate).toBe(120))
    expect(second.result.current.loading).toBe(false)
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(2)
    vi.mocked(Date.now).mockRestore()
  })
})

// ── src/hooks/usePropertyTypes.ts (set-state-in-effect) ──────────────────────────────────────────────────────────────────────────

describe('usePropertyTypes', () => {
  async function loadHook() {
    vi.resetModules()
    return (await import('@/hooks/usePropertyTypes')).usePropertyTypes
  }
  const answerFor = (map: Record<string, Array<{ value: string; label: string }>>) => {
    vi.mocked(global.fetch).mockImplementation((async (url: string) => {
      const locale = new URL(url, 'http://x').searchParams.get('locale') ?? ''
      return { ok: true, json: async () => map[locale] } as Response
    }) as typeof fetch)
  }

  it('starts on the fallback list, loads the localized list, then serves it from the cache', async () => {
    const usePropertyTypes = await loadHook()
    answerFor({ en: [{ value: 'apartment', label: 'Apartment' }] })
    const first = renderHook(() => usePropertyTypes())
    expect(first.result.current.loading).toBe(true)
    expect(first.result.current.propertyTypes.length).toBeGreaterThan(0)
    expect(first.result.current.propertyTypes[0].label).toBe(first.result.current.propertyTypes[0].value)
    await waitFor(() => expect(first.result.current.loading).toBe(false))
    expect(first.result.current.propertyTypes).toEqual([{ value: 'apartment', label: 'Apartment' }])

    const second = renderHook(() => usePropertyTypes())
    expect(second.result.current).toEqual({ propertyTypes: [{ value: 'apartment', label: 'Apartment' }], loading: false })
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)
  })

  it('keeps the shown list and reports loading while another locale loads, then shows that locale', async () => {
    const usePropertyTypes = await loadHook()
    answerFor({ en: [{ value: 'apartment', label: 'Apartment' }], sq: [{ value: 'apartment', label: 'Apartament' }] })
    const { result, rerender } = renderHook(() => usePropertyTypes())
    await waitFor(() => expect(result.current.loading).toBe(false))
    state.locale = 'sq'
    rerender()
    expect(result.current.loading).toBe(true)
    expect(result.current.propertyTypes).toEqual([{ value: 'apartment', label: 'Apartment' }])
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.propertyTypes).toEqual([{ value: 'apartment', label: 'Apartament' }])
    state.locale = 'en'
    rerender()
    expect(result.current).toEqual({ propertyTypes: [{ value: 'apartment', label: 'Apartment' }], loading: false })
  })

  it('falls back to the static list, not loading, when the API fails', async () => {
    const usePropertyTypes = await loadHook()
    vi.mocked(global.fetch).mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as Response)
    const { result } = renderHook(() => usePropertyTypes())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.propertyTypes.length).toBeGreaterThan(0)
    expect(result.current.propertyTypes.every(pt => pt.label === pt.value)).toBe(true)
  })
})

// ── src/modules/currency/hooks/useCurrencies.ts (set-state-in-effect) ────────────────────────────────────────────────────────────

describe('useCurrencies', () => {
  async function loadHook() {
    vi.resetModules()
    return (await import('@/modules/currency/hooks/useCurrencies')).useCurrencies
  }
  const row = (code: string) => ({ id: 9, code, symbol: code, name_sq: code, name_en: code, name_uk: code, name_it: code, is_active: true, is_default: false, decimals: 2, created_at: '', updated_at: '' })

  it('starts on the fallback currencies, loads the database ones once and serves them from the cache', async () => {
    const useCurrencies = await loadHook()
    state.currencies.mockResolvedValue([row('CHF')])
    const first = renderHook(() => useCurrencies())
    expect(first.result.current.loading).toBe(true)
    expect(first.result.current.currencies.map(c => c.code)).toEqual(['ALL', 'EUR', 'USD', 'GBP'])
    await waitFor(() => expect(first.result.current.loading).toBe(false))
    expect(first.result.current.currencies.map(c => c.code)).toEqual(['CHF'])

    const second = renderHook(() => useCurrencies())
    expect(second.result.current.loading).toBe(false)
    expect(second.result.current.currencies.map(c => c.code)).toEqual(['CHF'])
    await act(async () => { await Promise.resolve() })
    expect(state.currencies).toHaveBeenCalledTimes(1)
  })

  it('keeps the fallback list when the database answers with none', async () => {
    const useCurrencies = await loadHook()
    state.currencies.mockResolvedValue([])
    const { result } = renderHook(() => useCurrencies())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.currencies.map(c => c.code)).toEqual(['ALL', 'EUR', 'USD', 'GBP'])
  })

  it('stops loading on the fallback list when the query fails', async () => {
    const useCurrencies = await loadHook()
    state.currencies.mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => useCurrencies())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.currencies.map(c => c.code)).toEqual(['ALL', 'EUR', 'USD', 'GBP'])
  })
})

// ── src/modules/companies/hooks/useCompanies.ts (set-state-in-effect) ────────────────────────────────────────────────────────────

describe('useCompanies', () => {
  it('loads the companies, stops loading, and refetches on demand', async () => {
    state.companies.mockResolvedValueOnce([{ id: 1, name: 'A' }]).mockResolvedValueOnce([{ id: 1, name: 'A' }, { id: 2, name: 'B' }])
    const { result } = renderHook(() => useCompanies())
    expect(result.current.loading).toBe(true)
    expect(result.current.companies).toEqual([])
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.companies).toHaveLength(1)
    await act(async () => { await result.current.refetch() })
    expect(result.current.companies).toHaveLength(2)
  })

  it('logs the failure, keeps the list empty and stops loading', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    state.companies.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useCompanies())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.companies).toEqual([])
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })
})

// ── src/modules/notifications/hooks/useNotifications.ts (set-state-in-effect) ────────────────────────────────────────────────────

describe('useNotifications', () => {
  const note = (id: string, read: boolean) => ({ id, user_id: 'u1', type: 't', title: id, body: '', link: null, is_read: read, created_at: '2026-01-01', template_id: null, template_params: null })

  it('shows nothing and does not load for a visitor with no session', async () => {
    const { result } = renderHook(() => useNotifications())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.notifications).toEqual([])
    expect(result.current.unreadCount).toBe(0)
    expect(state.channels).toEqual([])
  })

  it('loads the signed-in user\'s notifications, counts the unread ones and subscribes to their channel', async () => {
    state.user = { id: 'u1' }
    state.notificationRows.mockResolvedValue({ data: [note('a', false), note('b', true), note('c', false)], error: null })
    const { result } = renderHook(() => useNotifications())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.notifications.map(n => n.id)).toEqual(['a', 'b', 'c'])
    expect(result.current.unreadCount).toBe(2)
    expect(state.channels.map(c => c.name)).toEqual(['user-notifications:user:u1'])
  })

  it('keeps the loaded list when a later request fails, and refetches when a change arrives', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    state.user = { id: 'u1' }
    state.notificationRows.mockResolvedValueOnce({ data: [note('a', false)], error: null })
    const { result } = renderHook(() => useNotifications())
    await waitFor(() => expect(result.current.loading).toBe(false))
    state.notificationRows.mockResolvedValueOnce({ data: null, error: { message: 'x' } })
    await act(async () => { await result.current.refetch() })
    expect(result.current.notifications.map(n => n.id)).toEqual(['a'])
    state.notificationRows.mockResolvedValueOnce({ data: [note('a', false), note('z', false)], error: null })
    await act(async () => { state.channels[0].handler({}); await Promise.resolve() })
    await waitFor(() => expect(result.current.notifications.map(n => n.id)).toEqual(['a', 'z']))
    error.mockRestore()
  })

  it('clears the list when the user signs out', async () => {
    state.user = { id: 'u1' }
    state.notificationRows.mockResolvedValue({ data: [note('a', false)], error: null })
    const { result, rerender } = renderHook(() => useNotifications())
    await waitFor(() => expect(result.current.notifications).toHaveLength(1))
    state.user = null
    rerender()
    await waitFor(() => expect(result.current.notifications).toEqual([]))
    expect(result.current.unreadCount).toBe(0)
    expect(result.current.loading).toBe(false)
    expect(state.removed.length).toBeGreaterThan(0)
  })

  it('drops the answer of a request that finished after the user changed', async () => {
    state.user = { id: 'u1' }
    let resolveFirst: (value: unknown) => void = () => {}
    state.notificationRows.mockReturnValueOnce(new Promise(resolve => { resolveFirst = resolve }))
    state.notificationRows.mockResolvedValueOnce({ data: [note('mine', false)], error: null })
    const { result, rerender } = renderHook(() => useNotifications())
    state.user = { id: 'u2' }
    rerender()
    await waitFor(() => expect(result.current.notifications.map(n => n.id)).toEqual(['mine']))
    await act(async () => { resolveFirst({ data: [note('stale', false)], error: null }); await Promise.resolve() })
    expect(result.current.notifications.map(n => n.id)).toEqual(['mine'])
  })
})

// ── src/modules/cabinet/hooks/useCabinetListingsRealtime.ts and src/modules/listings/hooks/useFavoritesRealtime.ts (refs) ─────────

describe('useCabinetListingsRealtime', () => {
  it('delivers events to the latest onEvent without resubscribing', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ onEvent }) => useCabinetListingsRealtime({ userId: 'u1', onEvent }), { initialProps: { onEvent: first } })
    expect(state.channels).toHaveLength(1)
    rerender({ onEvent: second })
    expect(state.channels).toHaveLength(1)
    state.channels[0].handler({ eventType: 'UPDATE', new: { id: 'l1', user_id: 'u1', status: 'sold', price: 5 }, old: {} })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith({ type: 'UPDATE', listingId: 'l1', patch: { status: 'sold', price: 5 } })
  })

  it('skips an event of another user and delivers a delete of its own user', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const onEvent = vi.fn()
    renderHook(() => useCabinetListingsRealtime({ userId: 'u1', onEvent }))
    state.channels[0].handler({ eventType: 'UPDATE', new: { id: 'l1', user_id: 'other' }, old: {} })
    expect(onEvent).not.toHaveBeenCalled()
    state.channels[0].handler({ eventType: 'DELETE', new: {}, old: { id: 'l9', user_id: 'u1' } })
    expect(onEvent).toHaveBeenCalledWith({ type: 'DELETE', listingId: 'l9' })
    warn.mockRestore()
  })

  it('removes its channel on unmount', () => {
    const { unmount } = renderHook(() => useCabinetListingsRealtime({ userId: 'u1', onEvent: vi.fn() }))
    unmount()
    expect(state.removed).toHaveLength(1)
  })
})

describe('useFavoritesRealtime', () => {
  it('delivers a delete to the latest onEvent without resubscribing', () => {
    const first = vi.fn()
    const second = vi.fn()
    const ids = { current: new Set<string>() as ReadonlySet<string> }
    const { rerender } = renderHook(({ onEvent }) => useFavoritesRealtime({ userId: 'u1', displayedIdsRef: ids, onEvent }), { initialProps: { onEvent: first } })
    rerender({ onEvent: second })
    expect(state.channels).toHaveLength(1)
    state.channels[0].handler({ eventType: 'DELETE', new: {}, old: { listing_id: 'l1' } })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith({ type: 'DELETE', listingId: 'l1' })
  })

  it('skips an insert for a listing that is already displayed, without a database read', async () => {
    const onEvent = vi.fn()
    const ids = { current: new Set(['l1']) as ReadonlySet<string> }
    renderHook(() => useFavoritesRealtime({ userId: 'u1', displayedIdsRef: ids, onEvent }))
    await state.channels[0].handler({ eventType: 'INSERT', new: { listing_id: 'l1' }, old: {} })
    expect(onEvent).not.toHaveBeenCalled()
  })
})

// ── src/hooks/useSwipeTrackSync.ts (refs, set-state-in-effect) ───────────────────────────────────────────────────────────────────

describe('useSwipeTrackSync', () => {
  const WIDTH = 300
  let observed: Array<(entries: Array<{ contentRect: { width: number } }>) => void> = []

  beforeEach(() => {
    observed = []
    vi.stubGlobal('ResizeObserver', class {
      constructor(cb: (entries: Array<{ contentRect: { width: number } }>) => void) { observed.push(cb) }
      observe() {}
      disconnect() {}
    })
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => WIDTH })
  })
  afterEach(() => {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth
  })

  function Harness({ active, count, onIndexChange }: { active: number; count: number; onIndexChange: (index: number) => void }) {
    const swipe = useSwipeTrackSync(active, count, onIndexChange, 'Photos')
    const slides = buildWrappedSlides(Array.from({ length: count }, (_, i) => i))
    return (
      <div data-testid="container" ref={swipe.containerRef} {...swipe.containerA11yProps}>
        <div data-testid="track" ref={swipe.trackRef} style={swipe.trackStyle}>
          {slides.map((i, position) => <div key={position} style={swipe.slideStyle}>{i}</div>)}
        </div>
      </div>
    )
  }
  const transform = () => screen.getByTestId('track').style.transform

  it('measures the container and positions the strip on the first slide behind the leading clone', () => {
    render(<Harness active={0} count={3} onIndexChange={vi.fn()} />)
    expect(transform()).toBe(`translate3d(${-WIDTH}px, 0, 0)`)
    expect(screen.getByTestId('container')).toHaveAttribute('aria-label', 'Photos')
  })

  it('follows a resize of the container', () => {
    render(<Harness active={0} count={3} onIndexChange={vi.fn()} />)
    act(() => observed.forEach(cb => cb([{ contentRect: { width: 200 } }])))
    expect(transform()).toBe('translate3d(-200px, 0, 0)')
    act(() => observed.forEach(cb => cb([{ contentRect: { width: 0 } }])))
    expect(transform()).toBe('translate3d(-200px, 0, 0)')
  })

  it('moves the strip when the caller changes the active index', () => {
    const { rerender } = render(<Harness active={0} count={3} onIndexChange={vi.fn()} />)
    rerender(<Harness active={2} count={3} onIndexChange={vi.fn()} />)
    expect(transform()).toBe(`translate3d(${-3 * WIDTH}px, 0, 0)`)
  })

  it('reports the next index to the latest callback on ArrowRight, wrapping at the end', () => {
    const stale = vi.fn()
    const latest = vi.fn()
    const { rerender } = render(<Harness active={0} count={3} onIndexChange={stale} />)
    rerender(<Harness active={2} count={3} onIndexChange={latest} />)
    fireEvent.keyDown(screen.getByTestId('container'), { key: 'ArrowRight' })
    expect(stale).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledWith(0)
  })

  it('reports the previous index on ArrowLeft, using the current active index', () => {
    const onIndexChange = vi.fn()
    const { rerender } = render(<Harness active={0} count={3} onIndexChange={onIndexChange} />)
    rerender(<Harness active={1} count={3} onIndexChange={onIndexChange} />)
    fireEvent.keyDown(screen.getByTestId('container'), { key: 'ArrowLeft' })
    expect(onIndexChange).toHaveBeenCalledWith(0)
  })

  it('does not move past either end when there is a single slide', () => {
    const onIndexChange = vi.fn()
    render(<Harness active={0} count={1} onIndexChange={onIndexChange} />)
    fireEvent.keyDown(screen.getByTestId('container'), { key: 'ArrowRight' })
    fireEvent.keyDown(screen.getByTestId('container'), { key: 'ArrowLeft' })
    expect(onIndexChange).not.toHaveBeenCalled()
    expect(transform()).toBe('translate3d(0px, 0, 0)')
  })

  it('settles on the neighbour after a long horizontal pointer drag, using the latest callback', () => {
    const stale = vi.fn()
    const latest = vi.fn()
    const { rerender } = render(<Harness active={0} count={3} onIndexChange={stale} />)
    rerender(<Harness active={1} count={3} onIndexChange={latest} />)
    const container = screen.getByTestId('container')
    fireEvent.pointerDown(container, { pointerType: 'mouse', button: 0, clientX: 250, clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(container, { pointerType: 'mouse', clientX: 100, clientY: 12, pointerId: 1 })
    fireEvent.pointerUp(container, { pointerType: 'mouse', clientX: 100, clientY: 12, pointerId: 1 })
    expect(stale).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledWith(2)
  })
})
