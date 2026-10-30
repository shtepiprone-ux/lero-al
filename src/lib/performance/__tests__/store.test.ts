/**
 * Performance store (Task 923 Revision 7): the device tier that decides what the page defers and preloads.
 *  - the first measured INP locks the tier for the session (frozen afterwards, saved for the next page);
 *  - an event that is not a real LCP / CLS / INP sample (a dropped sample, a foreign event) never changes the state;
 *  - the rating is the worst one seen.
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

async function load(env: Record<string, string> = {}) {
  vi.resetModules()
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  return import('../store')
}
const vitals = (detail: Record<string, unknown>) => window.dispatchEvent(new CustomEvent('lero:vitals', { detail }))

beforeEach(() => {
  sessionStorage.clear()
  document.documentElement.removeAttribute('data-perf-tier')
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })

describe('initial state', () => {
  it('starts from the hardware tier, with nothing measured, and marks the page', async () => {
    const store = await load()
    const stop = store.initPerformanceStore()
    const { result } = renderHook(() => store.usePerformanceState())
    expect(result.current).toMatchObject({ lcp: null, cls: null, inp: null, rating: 'good', isLocked: false, tierSource: 'hardware' })
    expect(['low', 'medium', 'high']).toContain(result.current.tier)
    expect(document.documentElement.getAttribute('data-perf-tier')).toBe(result.current.tier)
    stop()
  })

  it('a tier saved earlier in the session is used and counts as locked', async () => {
    sessionStorage.setItem('lero:perf-tier', 'low')
    const store = await load()
    const { result } = renderHook(() => store.usePerformanceState())
    expect(result.current).toMatchObject({ tier: 'low', isLocked: true, tierSource: 'session' })
    expect(renderHook(() => store.usePerformanceTier()).result.current).toBe('low')
  })
})

describe('samples', () => {
  it('LCP and CLS fill their own value and never lock the tier', async () => {
    const store = await load()
    const stop = store.initPerformanceStore()
    const { result } = renderHook(() => store.usePerformanceState())
    act(() => vitals({ name: 'LCP', value: 1800, rating: 'good' }))
    act(() => vitals({ name: 'CLS', value: 0.05, rating: 'good' }))
    expect(result.current).toMatchObject({ lcp: 1800, cls: 0.05, inp: null, isLocked: false })
    stop()
  })

  it('the rating is the worst one seen and never improves', async () => {
    const store = await load()
    const stop = store.initPerformanceStore()
    const { result } = renderHook(() => store.usePerformanceState())
    act(() => vitals({ name: 'LCP', value: 3000, rating: 'needs-improvement' }))
    expect(result.current.rating).toBe('needs-improvement')
    act(() => vitals({ name: 'CLS', value: 0.01, rating: 'good' }))
    expect(result.current.rating).toBe('needs-improvement')
    act(() => vitals({ name: 'CLS', value: 0.4, rating: 'poor' }))
    expect(result.current.rating).toBe('poor')
    act(() => vitals({ name: 'LCP', value: 1000, rating: 'good' }))
    expect(result.current.rating).toBe('poor')
    stop()
  })

  it.each([
    [{ name: 'LCP-dropped', originalValue: 90000 }], [{ name: 'FID', value: 5 }], [{ value: 1 }], [{ name: 5 }], [null],
  ])('%j changes nothing', async (detail) => {
    const store = await load()
    const stop = store.initPerformanceStore()
    const { result } = renderHook(() => store.usePerformanceState())
    const before = result.current
    act(() => { window.dispatchEvent(new CustomEvent('lero:vitals', { detail })) })
    expect(result.current).toBe(before)
    stop()
  })

  it('the first INP locks the tier from the measured latency, saves it and marks the page', async () => {
    const store = await load()
    const stop = store.initPerformanceStore()
    const { result } = renderHook(() => store.usePerformanceState())
    act(() => vitals({ name: 'INP', value: 450, rating: 'needs-improvement' }))
    expect(result.current).toMatchObject({ inp: 450, tier: 'low', isLocked: true, tierSource: 'inp' })
    expect(sessionStorage.getItem('lero:perf-tier')).toBe('low')
    expect(document.documentElement.getAttribute('data-perf-tier')).toBe('low')
    stop()
  })

  it.each([[50, 'high'], [200, 'medium'], [301, 'low']])('an INP of %d ms gives the tier %s', async (inp, tier) => {
    const store = await load()
    const stop = store.initPerformanceStore()
    const { result } = renderHook(() => store.usePerformanceState())
    act(() => vitals({ name: 'INP', value: inp, rating: 'good' }))
    expect(result.current.tier).toBe(tier)
    stop()
  })

  it('once locked the tier is frozen: a later INP only updates the number', async () => {
    const store = await load()
    const stop = store.initPerformanceStore()
    const { result } = renderHook(() => store.usePerformanceState())
    act(() => vitals({ name: 'INP', value: 450, rating: 'poor' }))
    act(() => vitals({ name: 'INP', value: 20, rating: 'good' }))
    expect(result.current).toMatchObject({ inp: 20, tier: 'low', tierSource: 'inp' })
    stop()
  })

  it('a locked tier from the session is not re-classified by an INP', async () => {
    sessionStorage.setItem('lero:perf-tier', 'high')
    const store = await load()
    const stop = store.initPerformanceStore()
    const { result } = renderHook(() => store.usePerformanceState())
    act(() => vitals({ name: 'INP', value: 900, rating: 'poor' }))
    expect(result.current).toMatchObject({ tier: 'high', inp: 900, tierSource: 'session' })
    stop()
  })
})

describe('lifecycle', () => {
  it('a second start does not add a second listener, and its stop does nothing', async () => {
    const store = await load()
    const add = vi.spyOn(window, 'addEventListener')
    const stopA = store.initPerformanceStore()
    const stopB = store.initPerformanceStore()
    expect(add.mock.calls.filter((c) => c[0] === 'lero:vitals')).toHaveLength(1)
    stopB()
    const { result } = renderHook(() => store.usePerformanceState())
    act(() => vitals({ name: 'LCP', value: 1, rating: 'good' }))
    expect(result.current.lcp).toBe(1)
    stopA()
  })

  it('after stop, samples are ignored; a new start listens again', async () => {
    const store = await load()
    const stop = store.initPerformanceStore()
    stop()
    const { result } = renderHook(() => store.usePerformanceState())
    act(() => vitals({ name: 'LCP', value: 7, rating: 'good' }))
    expect(result.current.lcp).toBeNull()
    const again = store.initPerformanceStore()
    act(() => vitals({ name: 'LCP', value: 8, rating: 'good' }))
    expect(result.current.lcp).toBe(8)
    again()
  })

  it('a subscriber is told once per change and stops being told after it unsubscribes', async () => {
    const store = await load()
    const stop = store.initPerformanceStore()
    const first = renderHook(() => store.usePerformanceState())
    const second = renderHook(() => store.usePerformanceState())
    act(() => vitals({ name: 'LCP', value: 1, rating: 'good' }))
    expect([first.result.current.lcp, second.result.current.lcp]).toEqual([1, 1])
    first.unmount()
    act(() => vitals({ name: 'LCP', value: 2, rating: 'good' }))
    expect(second.result.current.lcp).toBe(2)
    stop()
  })
})

describe('debug output', () => {
  it('says how the tier was chosen, at start and when it locks', async () => {
    const store = await load({ NEXT_PUBLIC_PERF_DEBUG: 'true' })
    const stop = store.initPerformanceStore()
    act(() => vitals({ name: 'INP', value: 450.4, rating: 'poor' }))
    const lines = (console.log as unknown as { mock: { calls: string[][] } }).mock.calls.map((c) => `${c[0]} ${c[2]}`)
    expect(lines[0]).toMatch(/^%c\[PERF\] Initial tier: (low|medium|high) \(source: hardware — \d+ cores, \d+GB memory, \d+px viewport\)$/)
    expect(lines[1]).toBe('%c[PERF] Tier locked: low (source: INP 450ms)')
    stop()
  })

  it('a tier from the session is named as such', async () => {
    sessionStorage.setItem('lero:perf-tier', 'high')
    const store = await load({ NEXT_PUBLIC_PERF_DEBUG: 'true' })
    store.initPerformanceStore()()
    const lines = (console.log as unknown as { mock: { calls: string[][] } }).mock.calls.map((c) => c[2])
    expect(lines[0]).toBe('(source: sessionStorage (prior INP measurement))')
  })

  it('prints nothing without debug mode', async () => {
    const store = await load()
    const stop = store.initPerformanceStore()
    act(() => vitals({ name: 'INP', value: 450, rating: 'poor' }))
    expect(console.log).not.toHaveBeenCalled()
    stop()
  })
})
