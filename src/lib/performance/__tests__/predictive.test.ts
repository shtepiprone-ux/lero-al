/**
 * Predictive image preload (Task 923 Revision 7): at most 2 speculative image fetches per page, none on a weak device, none while the visitor is flinging the page,
 * and a hover is the only trigger a medium device accepts.
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PerformanceTier } from '../tier'

const preloadCalls: { href: string; opts: Record<string, unknown> }[] = []
vi.mock('react-dom', async (orig) => ({ ...(await orig<typeof import('react-dom')>()), preload: (href: string, opts: Record<string, unknown>) => { preloadCalls.push({ href, opts }) } }))
let tier: PerformanceTier = 'high'
vi.mock('../store', () => ({ usePerformanceTier: () => tier }))

async function load(env: Record<string, string> = {}) {
  vi.resetModules()
  preloadCalls.length = 0
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  const predictive = await import('../predictive')
  const guard = await import('../imageGuard')
  return { ...predictive, guard }
}
let events: { name?: string; variant?: string; trigger?: string; success?: boolean }[] = []
const listener = (e: Event) => events.push((e as CustomEvent).detail)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-17T10:00:00Z'))
  events = []
  tier = 'high'
  window.addEventListener('lero:vitals', listener)
})
afterEach(() => { window.removeEventListener('lero:vitals', listener); vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('attemptPredictivePreload', () => {
  it('preloads an image with its srcset and sizes, and tells the guard and the listeners', async () => {
    const p = await load()
    expect(p.attemptPredictivePreload('a.jpg', 'a.jpg 1x, b.jpg 2x', '100vw', 'card' as never, 'high', 'viewport')).toBe(true)
    expect(preloadCalls).toEqual([{ href: 'a.jpg', opts: { as: 'image', imageSrcSet: 'a.jpg 1x, b.jpg 2x', imageSizes: '100vw' } }])
    expect(p.getPredictiveCount()).toBe(1)
    expect(events).toEqual([{ name: 'predictive-preload', variant: 'card', trigger: 'viewport', success: true }])
    expect(p.guard.canPredictivePreload('a.jpg', 'viewport', 1, 2)).toBe('duplicate-url')
  })

  it('without a srcset it sends no sizes either', async () => {
    const p = await load()
    p.attemptPredictivePreload('a.jpg', '', '100vw', 'card' as never, 'high', 'viewport')
    expect(preloadCalls[0].opts).toEqual({ as: 'image', imageSrcSet: undefined, imageSizes: undefined })
  })

  it('a low tier and an empty address never preload', async () => {
    const p = await load()
    expect(p.attemptPredictivePreload('a.jpg', '', '', 'card' as never, 'low', 'hover')).toBe(false)
    expect(p.attemptPredictivePreload('', '', '', 'card' as never, 'high', 'hover')).toBe(false)
    expect(preloadCalls).toEqual([])
  })

  it('a medium tier accepts a hover only', async () => {
    const p = await load()
    expect(p.attemptPredictivePreload('a.jpg', '', '', 'card' as never, 'medium', 'viewport')).toBe(false)
    expect(p.attemptPredictivePreload('b.jpg', '', '', 'card' as never, 'medium', 'scroll')).toBe(false)
    expect(p.attemptPredictivePreload('c.jpg', '', '', 'card' as never, 'medium', 'hover')).toBe(true)
  })

  it('stops at 2 per page and says so', async () => {
    const p = await load()
    expect(p.MAX_PREDICTIVE_PRELOADS).toBe(2)
    expect(p.attemptPredictivePreload('a.jpg', '', '', 'card' as never, 'high', 'viewport')).toBe(true)
    expect(p.attemptPredictivePreload('b.jpg', '', '', 'card' as never, 'high', 'viewport')).toBe(true)
    events = []
    expect(p.attemptPredictivePreload('c.jpg', '', '', 'card' as never, 'high', 'viewport')).toBe(false)
    expect(events).toEqual([{ name: 'predictive-preload', variant: 'card', trigger: 'viewport', success: false }])
    expect(preloadCalls).toHaveLength(2)
  })

  it('the guard can refuse (a duplicate), and the refusal is counted', async () => {
    const p = await load()
    p.guard.notifyPredictivePreload('a.jpg')
    expect(p.attemptPredictivePreload('a.jpg', '', '', 'card' as never, 'high', 'viewport')).toBe(false)
    expect(p.guard.getGuardStats().conflicts).toBe(1)
    expect(preloadCalls).toEqual([])
  })

  it('a reset gives the budget back, and tells subscribers only when there was something to give back', async () => {
    const p = await load()
    const cb = vi.fn()
    p.subscribePredictiveCount(cb)
    p.resetPredictiveBudget()
    expect(cb).not.toHaveBeenCalled()
    p.attemptPredictivePreload('a.jpg', '', '', 'card' as never, 'high', 'viewport')
    cb.mockClear()
    p.resetPredictiveBudget()
    expect(p.getPredictiveCount()).toBe(0)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('prints a line in a debug build only', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const quiet = await load()
    quiet.attemptPredictivePreload('a.jpg', '', '', 'card' as never, 'high', 'viewport')
    expect(console.log).not.toHaveBeenCalled()
    const loud = await load({ NEXT_PUBLIC_PERF_DEBUG: 'true' })
    loud.attemptPredictivePreload('a.jpg', '', '', 'card' as never, 'high', 'viewport')
    expect(console.log).toHaveBeenCalledOnce()
  })

  it('usePredictiveImageCount follows the count', async () => {
    const p = await load()
    const { result } = renderHook(() => p.usePredictiveImageCount())
    expect(result.current).toBe(0)
    act(() => { p.attemptPredictivePreload('a.jpg', '', '', 'card' as never, 'high', 'viewport') })
    expect(result.current).toBe(1)
  })
})

describe('fast scrolling', () => {
  it('a scroll or viewport trigger is refused while the page is flying; a hover is not', async () => {
    const p = await load()
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 })
    let now = 1000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    p.ensureScrollTracker()
    p.ensureScrollTracker()
    window.scrollY = 2000
    now = 1100
    window.dispatchEvent(new Event('scroll'))
    expect(p.attemptPredictivePreload('a.jpg', '', '', 'card' as never, 'high', 'scroll')).toBe(false)
    expect(p.attemptPredictivePreload('b.jpg', '', '', 'card' as never, 'high', 'hover')).toBe(true)
    p.resetScrollTracker()
    expect(p.attemptPredictivePreload('c.jpg', '', '', 'card' as never, 'high', 'scroll')).toBe(true)
  })
})

describe('usePredictivePreload', () => {
  class FakeIO {
    static last: FakeIO | null = null
    disconnected = false
    constructor(public cb: (e: { isIntersecting: boolean }[]) => void, public opts: { rootMargin: string }) { FakeIO.last = this }
    observe() {}
    disconnect() { this.disconnected = true }
  }
  beforeEach(() => { vi.stubGlobal('IntersectionObserver', FakeIO); FakeIO.last = null })

  const mount = async (over: { predictive?: boolean; src?: string } = {}) => {
    const p = await load()
    const el = document.createElement('div')
    document.body.appendChild(el)
    const ref = { current: el }
    const hook = renderHook(() => p.usePredictivePreload(ref, over.src ?? 'a.jpg', 's', '100vw', 'card' as never, over.predictive ?? true))
    return { p, el, hook }
  }

  it('a high tier preloads when the card comes near the viewport (500 px ahead), as a "scroll"', async () => {
    const { el } = await mount()
    expect(FakeIO.last?.opts.rootMargin).toBe('0px 0px 500px 0px')
    act(() => FakeIO.last!.cb([{ isIntersecting: true }]))
    expect(preloadCalls).toHaveLength(1)
    expect(events.at(-1)).toMatchObject({ trigger: 'scroll', success: true })
    expect(FakeIO.last?.disconnected).toBe(true)
    el.remove()
  })

  it('a medium tier waits for a hover (60 ms debounce) and watches 300 px ahead', async () => {
    tier = 'medium'
    const { el } = await mount()
    expect(FakeIO.last?.opts.rootMargin).toBe('0px 0px 300px 0px')
    act(() => FakeIO.last!.cb([{ isIntersecting: true }]))
    expect(preloadCalls).toEqual([])
    el.dispatchEvent(new Event('mouseenter'))
    act(() => { vi.advanceTimersByTime(59) })
    expect(preloadCalls).toEqual([])
    act(() => { vi.advanceTimersByTime(1) })
    expect(preloadCalls).toHaveLength(1)
    expect(events.at(-1)).toMatchObject({ trigger: 'hover' })
    el.remove()
  })

  it('leaving before the debounce cancels the hover', async () => {
    tier = 'medium'
    const { el } = await mount()
    el.dispatchEvent(new Event('mouseenter'))
    act(() => { vi.advanceTimersByTime(30) })
    el.dispatchEvent(new Event('mouseleave'))
    act(() => { vi.advanceTimersByTime(100) })
    expect(preloadCalls).toEqual([])
    el.remove()
  })

  it('an element preloads once, however many triggers fire', async () => {
    const { el } = await mount()
    act(() => FakeIO.last!.cb([{ isIntersecting: true }]))
    el.dispatchEvent(new Event('mouseenter'))
    act(() => { vi.advanceTimersByTime(100) })
    expect(preloadCalls).toHaveLength(1)
    el.remove()
  })

  it('an entry that is not on screen does nothing', async () => {
    const { el } = await mount()
    act(() => FakeIO.last!.cb([{ isIntersecting: false }]))
    expect(preloadCalls).toEqual([])
    el.remove()
  })

  it.each([['predictive turned off', { predictive: false }], ['no image address', { src: '' }]])('%s: nothing is observed', async (_l, over) => {
    const { el } = await mount(over)
    expect(FakeIO.last).toBeNull()
    el.remove()
  })

  it('a low tier observes nothing', async () => {
    tier = 'low'
    const { el } = await mount()
    expect(FakeIO.last).toBeNull()
    el.remove()
  })

  it('on unmount it disconnects and clears a pending hover', async () => {
    tier = 'medium'
    const { el, hook } = await mount()
    el.dispatchEvent(new Event('mouseenter'))
    hook.unmount()
    act(() => { vi.advanceTimersByTime(200) })
    expect(preloadCalls).toEqual([])
    expect(FakeIO.last?.disconnected).toBe(true)
    el.remove()
  })
})
