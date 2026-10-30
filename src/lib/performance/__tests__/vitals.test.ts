/**
 * Web-vitals plumbing (Task 923 Revision 7): budgets, device tier, the browser collector and the reporter.
 * Nothing here leaves the browser (the reporter only dispatches a `lero:vitals` event), but a wrong tier or an invalid sample would silently change what every visitor
 * is served (image preloads, deferred panels) and what the team reads as a regression.
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PERFORMANCE_BUDGETS, classifyMetric } from '../budgets'
import { classifyTier, hasSavedTier, readInitialTier, readInitialTierWithSource, saveTier, useIdleMount } from '../tier'
import { startWebVitalsCollection, type WebVitalMetric } from '../collector'

describe('budgets', () => {
  it('uses the Core Web Vitals thresholds', () => {
    expect(PERFORMANCE_BUDGETS).toEqual({ LCP: { good: 2500, poor: 4000 }, CLS: { good: 0.1, poor: 0.25 }, INP: { good: 200, poor: 500 } })
  })

  it.each([
    ['LCP', 2500, 'good'], ['LCP', 2501, 'needs-improvement'], ['LCP', 4000, 'needs-improvement'], ['LCP', 4001, 'poor'], ['LCP', 0, 'good'],
    ['CLS', 0.1, 'good'], ['CLS', 0.11, 'needs-improvement'], ['CLS', 0.25, 'needs-improvement'], ['CLS', 0.26, 'poor'],
    ['INP', 200, 'good'], ['INP', 201, 'needs-improvement'], ['INP', 500, 'needs-improvement'], ['INP', 501, 'poor'],
  ] as const)('%s of %d is %s', (name, value, rating) => expect(classifyMetric(name, value)).toBe(rating))
})

describe('classifyTier', () => {
  it('a measured INP decides everything, whatever the hardware', () => {
    expect(classifyTier({ inp: 301, cores: 16, memory: 16 })).toBe('low')
    expect(classifyTier({ inp: 300, cores: 1, memory: 1 })).toBe('medium')
    expect(classifyTier({ inp: 120, cores: 1, memory: 1 })).toBe('medium')
    expect(classifyTier({ inp: 119, cores: 1, memory: 1 })).toBe('high')
    expect(classifyTier({ inp: 0 })).toBe('high')
  })

  it('without INP: two cores or less, or 1 GB or less, is low', () => {
    expect(classifyTier({ cores: 2 })).toBe('low')
    expect(classifyTier({ memory: 1 })).toBe('low')
    expect(classifyTier({ cores: 4, memory: 2 })).toBe('medium')
  })

  it('8 cores and 4 GB is high; either alone is not', () => {
    expect(classifyTier({ cores: 8, memory: 4 })).toBe('high')
    expect(classifyTier({ cores: 8, memory: 2 })).toBe('medium')
    expect(classifyTier({ cores: 4, memory: 8 })).toBe('medium')
  })

  it('a narrow screen with a weak phone is low, a narrow screen alone is not', () => {
    expect(classifyTier({ cores: 4, memory: 2, viewport: 479 })).toBe('low')
    expect(classifyTier({ cores: 4, memory: 2, viewport: 480 })).toBe('medium')
    expect(classifyTier({ cores: 6, memory: 4, viewport: 320 })).toBe('medium')
  })

  it('the defaults are a medium machine', () => {
    expect(classifyTier({})).toBe('medium')
  })
})

describe('the saved tier', () => {
  beforeEach(() => sessionStorage.clear())

  it('uses the one saved for the session, and only if it is one of the three', () => {
    expect(hasSavedTier()).toBe(false)
    saveTier('low')
    expect(hasSavedTier()).toBe(true)
    expect(readInitialTierWithSource()).toEqual({ tier: 'low', source: 'session' })
    expect(readInitialTier()).toBe('low')
    sessionStorage.setItem('lero:perf-tier', 'turbo')
    expect(readInitialTierWithSource().source).toBe('hardware')
  })

  it('without a saved value it reads the hardware', () => {
    vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(16)
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 8 })
    expect(readInitialTierWithSource()).toEqual({ tier: 'high', source: 'hardware' })
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: undefined })
  })

  it('a storage that throws is ignored', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    expect(hasSavedTier()).toBe(false)
    expect(readInitialTierWithSource().source).toBe('hardware')
    expect(() => saveTier('high')).not.toThrow()
    get.mockRestore(); set.mockRestore()
  })
})

describe('useIdleMount', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

  it('is ready at once when nothing is deferred', () => {
    expect(renderHook(() => useIdleMount(false)).result.current).toBe(true)
  })

  it('waits for the browser to be idle, then stays ready', () => {
    let idle: () => void = () => {}
    vi.stubGlobal('requestIdleCallback', (cb: () => void) => { idle = cb; return 7 })
    const cancel = vi.fn()
    vi.stubGlobal('cancelIdleCallback', cancel)
    const { result, unmount } = renderHook(() => useIdleMount(true))
    expect(result.current).toBe(false)
    act(() => idle())
    expect(result.current).toBe(true)
    unmount()
  })

  it('cancels the wait when it is removed first', () => {
    vi.stubGlobal('requestIdleCallback', () => 9)
    const cancel = vi.fn()
    vi.stubGlobal('cancelIdleCallback', cancel)
    renderHook(() => useIdleMount(true)).unmount()
    expect(cancel).toHaveBeenCalledWith(9)
  })

  it('without idle callbacks it falls back to a 200 ms timer, and clears it', () => {
    vi.useFakeTimers()
    vi.stubGlobal('requestIdleCallback', undefined)
    vi.stubGlobal('cancelIdleCallback', undefined)
    const { result } = renderHook(() => useIdleMount(true))
    expect(result.current).toBe(false)
    act(() => { vi.advanceTimersByTime(199) })
    expect(result.current).toBe(false)
    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe(true)
    const second = renderHook(() => useIdleMount(true))
    second.unmount()
  })

  it('mounts at once when the user asks for it', () => {
    vi.stubGlobal('requestIdleCallback', () => 1)
    vi.stubGlobal('cancelIdleCallback', () => undefined)
    const { result, rerender } = renderHook(({ force }) => useIdleMount(true, force), { initialProps: { force: false } })
    expect(result.current).toBe(false)
    rerender({ force: true })
    expect(result.current).toBe(true)
  })
})

// ── the collector, with a controllable PerformanceObserver ──────────────────

type Entry = Record<string, unknown>
class FakeObserver {
  static all: FakeObserver[] = []
  type = ''
  pending: Entry[] = []
  disconnected = false
  constructor(public cb: (list: { getEntries: () => Entry[] }) => void) { FakeObserver.all.push(this) }
  observe(opts: { type: string }) { this.type = opts.type }
  takeRecords() { const r = this.pending; this.pending = []; return r }
  disconnect() { this.disconnected = true }
}
const observer = (type: string) => FakeObserver.all.find((o) => o.type === type)!
const emit = (type: string, entries: Entry[]) => observer(type).cb({ getEntries: () => entries })
let visibility: 'visible' | 'hidden' = 'visible'

describe('startWebVitalsCollection', () => {
  const metrics: WebVitalMetric[] = []
  // every collector started by a test is stopped after it, so none keeps listening on the shared window / document
  const stops: (() => void)[] = []
  const start = (route = '/sq/listings') => { const stop = startWebVitalsCollection(route, (m) => metrics.push(m)); stops.push(stop); return stop }

  beforeEach(() => {
    metrics.length = 0
    FakeObserver.all = []
    visibility = 'visible'
    vi.stubGlobal('PerformanceObserver', FakeObserver)
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{ type: 'navigate' } as never])
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
  })
  afterEach(() => { stops.splice(0).forEach((stop) => stop()); vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('does nothing where PerformanceObserver does not exist', () => {
    vi.stubGlobal('PerformanceObserver', undefined)
    // `in window` is what is asked, so remove the key as well
    delete (window as unknown as Record<string, unknown>).PerformanceObserver
    const stop = start()
    expect(typeof stop).toBe('function')
    expect(() => stop()).not.toThrow()
    expect(FakeObserver.all).toEqual([])
  })

  it('reports the LCP at the first interaction, once, with the element kind and the page facts', () => {
    start()
    emit('largest-contentful-paint', [{ renderTime: 1200, element: { tagName: 'img' } }])
    document.dispatchEvent(new Event('click'))
    document.dispatchEvent(new Event('keydown'))
    expect(metrics).toHaveLength(1)
    expect(metrics[0]).toMatchObject({ name: 'LCP', value: 1200, rating: 'good', route: '/sq/listings', navigationType: 'navigate', deviceType: 'desktop', viewportWidth: 1200, viewportHeight: 800, lcpIsImage: true, wasHiddenDuringCollection: false, env: 'development' })
    expect(metrics[0].id).toMatch(/^lcp-\d+-[a-z0-9]+$/)
  })

  it('the LCP uses the load time when there is no render time, and a url means an image', () => {
    start()
    emit('largest-contentful-paint', [{ renderTime: 0, loadTime: 3000, url: 'https://x/y.jpg', element: null }])
    document.dispatchEvent(new Event('pointerdown'))
    expect(metrics[0]).toMatchObject({ value: 3000, rating: 'needs-improvement', lcpIsImage: true })
  })

  it('a text element is not an image; the last entry wins', () => {
    start()
    emit('largest-contentful-paint', [{ renderTime: 900, element: { tagName: 'IMG' } }, { renderTime: 1500, element: { tagName: 'H1' } }])
    document.dispatchEvent(new Event('click'))
    expect(metrics[0]).toMatchObject({ value: 1500, lcpIsImage: false })
  })

  it('no LCP entry means no LCP report', () => {
    start()
    document.dispatchEvent(new Event('click'))
    expect(metrics.filter((m) => m.name === 'LCP')).toEqual([])
  })

  it('on page hide it reports LCP, CLS and INP from what is still waiting in the observers', () => {
    start()
    observer('largest-contentful-paint').pending = [{ renderTime: 2000, element: { tagName: 'PICTURE' } }]
    observer('layout-shift').pending = [{ value: 0.05, hadRecentInput: false }, { value: 0.5, hadRecentInput: true }]
    observer('event').pending = [{ interactionId: 1, duration: 300 }, { interactionId: 1, duration: 100 }, { interactionId: 2, duration: 30 }]
    window.dispatchEvent(new Event('pagehide'))
    expect(metrics.map((m) => [m.name, m.value])).toEqual([['LCP', 2000], ['CLS', 0.05], ['INP', 300]])
    expect(metrics[0].lcpIsImage).toBe(true)
  })

  it('CLS ignores shifts that follow a user input and is reported even when it is 0', () => {
    start()
    emit('layout-shift', [{ value: 0.2, hadRecentInput: true }])
    window.dispatchEvent(new Event('pagehide'))
    expect(metrics.find((m) => m.name === 'CLS')).toMatchObject({ value: 0, rating: 'good' })
  })

  it('INP is the 98th percentile of the slowest interaction of each id, and interactions under 40 ms do not count', () => {
    start()
    const entries = Array.from({ length: 100 }, (_, i) => ({ interactionId: i + 1, duration: 50 + i }))
    emit('event', [...entries, { interactionId: 1, duration: 10 }, { interactionId: 0, duration: 999 }, { duration: 999 }])
    window.dispatchEvent(new Event('pagehide'))
    expect(metrics.find((m) => m.name === 'INP')?.value).toBe(50 + 97)
  })

  it('no interaction means no INP report', () => {
    start()
    window.dispatchEvent(new Event('pagehide'))
    expect(metrics.some((m) => m.name === 'INP')).toBe(false)
  })

  it('reports once, however many times the page is hidden', () => {
    start()
    emit('largest-contentful-paint', [{ renderTime: 1000, element: null }])
    visibility = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('pagehide'))
    expect(metrics.filter((m) => m.name === 'LCP')).toHaveLength(1)
    expect(metrics.filter((m) => m.name === 'CLS')).toHaveLength(1)
  })

  it('remembers that the page was hidden while it measured', () => {
    start()
    emit('largest-contentful-paint', [{ renderTime: 1000, element: null }])
    visibility = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))
    expect(metrics[0].wasHiddenDuringCollection).toBe(true)
  })

  it('a page that starts hidden is marked as such', () => {
    visibility = 'hidden'
    start()
    emit('largest-contentful-paint', [{ renderTime: 1000, element: null }])
    document.dispatchEvent(new Event('click'))
    expect(metrics[0].wasHiddenDuringCollection).toBe(true)
  })

  it.each([[500, 'mobile'], [767, 'mobile'], [768, 'tablet'], [1023, 'tablet'], [1024, 'desktop']])('a width of %d is a %s', (width, kind) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
    start()
    emit('largest-contentful-paint', [{ renderTime: 1000, element: null }])
    document.dispatchEvent(new Event('click'))
    expect(metrics[0].deviceType).toBe(kind)
  })

  it('the navigation type is "unknown" when the browser gives none', () => {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([])
    start()
    emit('largest-contentful-paint', [{ renderTime: 1000, element: null }])
    document.dispatchEvent(new Event('click'))
    expect(metrics[0].navigationType).toBe('unknown')
  })

  it('the environment is "production" in a production build', () => {
    vi.stubEnv('NODE_ENV', 'production')
    start()
    emit('largest-contentful-paint', [{ renderTime: 1000, element: null }])
    document.dispatchEvent(new Event('click'))
    expect(metrics[0].env).toBe('production')
    vi.unstubAllEnvs()
  })

  it('an observer type the browser refuses is skipped, the others still work', () => {
    class Picky extends FakeObserver {
      observe(opts: { type: string }) { if (opts.type === 'event') throw new Error('unsupported'); super.observe(opts) }
    }
    vi.stubGlobal('PerformanceObserver', Picky)
    start()
    window.dispatchEvent(new Event('pagehide'))
    expect(metrics.some((m) => m.name === 'CLS')).toBe(true)
  })

  it('the cleanup disconnects every observer and removes the listeners', () => {
    const stop = start()
    stop()
    expect(FakeObserver.all.every((o) => o.disconnected)).toBe(true)
    emit('largest-contentful-paint', [{ renderTime: 1000, element: null }])
    document.dispatchEvent(new Event('click'))
    window.dispatchEvent(new Event('pagehide'))
    expect(metrics).toEqual([])
  })
})
