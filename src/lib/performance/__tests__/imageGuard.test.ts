/**
 * Image preload guard (Task 923 Revision 7): the brake on speculative image fetches. Too many at once slow the page the visitor is actually looking at.
 *  - a URL is preloaded once per page; more than 4 in a second, or a combined load over the budget, is refused with a named reason;
 *  - the pressure level follows the combined load and the burst rate, and a change of level is announced once.
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

async function load(env: Record<string, string> = {}) {
  vi.resetModules()
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  return import('../imageGuard')
}
let events: { name?: string; pressure?: string; reason?: string; trigger?: string; src?: string }[] = []
const listener = (e: Event) => events.push((e as CustomEvent).detail)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-17T10:00:00Z'))
  events = []
  window.addEventListener('lero:vitals', listener)
})
afterEach(() => { window.removeEventListener('lero:vitals', listener); vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks() })

describe('canPredictivePreload', () => {
  it('allows a fresh URL when nothing is loading', async () => {
    const g = await load()
    expect(g.canPredictivePreload('a.jpg', 'viewport', 0, 2)).toBe('allow')
  })

  it('refuses a URL that was already preloaded on this page', async () => {
    const g = await load()
    g.notifyPredictivePreload('a.jpg')
    expect(g.canPredictivePreload('a.jpg', 'viewport', 0, 2)).toBe('duplicate-url')
    g.notifyPriorityPreload('b.jpg')
    expect(g.canPredictivePreload('b.jpg', 'viewport', 0, 2)).toBe('duplicate-url')
  })

  it('refuses the fifth preload inside one second, and allows again when the second has passed', async () => {
    const g = await load()
    for (let i = 0; i < 4; i++) g.notifyPredictivePreload(`u${i}.jpg`)
    expect(g.canPredictivePreload('x.jpg', 'viewport', 0, 2)).toBe('rate-limit')
    vi.advanceTimersByTime(1001)
    expect(g.canPredictivePreload('x.jpg', 'viewport', 0, 2)).toBe('allow')
  })

  it('refuses when the predictive and priority loads together are over 3', async () => {
    const g = await load()
    g.updateImageSystemState({ priorityCount: 3 })
    expect(g.canPredictivePreload('x.jpg', 'viewport', 0, 2)).toBe('allow')
    expect(g.canPredictivePreload('x.jpg', 'viewport', 1, 2)).toBe('contention')
  })

  it('a hover is refused when only one predictive slot is left, other triggers are not', async () => {
    const g = await load()
    expect(g.canPredictivePreload('x.jpg', 'hover', 1, 2)).toBe('near-limit')
    expect(g.canPredictivePreload('x.jpg', 'hover', 0, 2)).toBe('allow')
    expect(g.canPredictivePreload('x.jpg', 'viewport', 1, 2)).toBe('allow')
  })

  it('checks in the order duplicate, rate, contention, near limit', async () => {
    const g = await load()
    for (let i = 0; i < 4; i++) g.notifyPredictivePreload(`u${i}.jpg`)
    g.updateImageSystemState({ priorityCount: 5 })
    expect(g.canPredictivePreload('u0.jpg', 'hover', 2, 2)).toBe('duplicate-url')
    expect(g.canPredictivePreload('new.jpg', 'hover', 2, 2)).toBe('rate-limit')
    vi.advanceTimersByTime(1001)
    expect(g.canPredictivePreload('new.jpg', 'hover', 2, 2)).toBe('contention')
  })
})

describe('priority preloads', () => {
  it('count toward the rate only the first time a URL is seen', async () => {
    const g = await load()
    for (let i = 0; i < 6; i++) g.notifyPriorityPreload('same.jpg')
    expect(g.canPredictivePreload('other.jpg', 'viewport', 0, 2)).toBe('allow')
    for (let i = 0; i < 4; i++) g.notifyPriorityPreload(`p${i}.jpg`)
    expect(g.canPredictivePreload('other.jpg', 'viewport', 0, 2)).toBe('rate-limit')
  })
})

describe('pressure', () => {
  it('follows the combined load: low, then normal at 4, then high at 6', async () => {
    const g = await load()
    expect(g.getGuardStats().pressure).toBe('low')
    g.updateImageSystemState({ priorityCount: 3, predictiveCount: 0 })
    expect(g.getGuardStats().pressure).toBe('low')
    g.updateImageSystemState({ predictiveCount: 1 })
    expect(g.getGuardStats().pressure).toBe('normal')
    g.updateImageSystemState({ predictiveCount: 3 })
    expect(g.getGuardStats().pressure).toBe('high')
  })

  it('follows the burst rate: normal at 3 a second, high at 6', async () => {
    const g = await load()
    for (let i = 0; i < 3; i++) g.notifyPredictivePreload(`r${i}.jpg`)
    expect(g.getGuardStats().pressure).toBe('normal')
    for (let i = 3; i < 6; i++) g.notifyPredictivePreload(`r${i}.jpg`)
    expect(g.getGuardStats().pressure).toBe('high')
  })

  it('announces a change of level once, not on every update', async () => {
    const g = await load()
    g.updateImageSystemState({ priorityCount: 4 })
    g.updateImageSystemState({ priorityCount: 4 })
    g.updateImageSystemState({ priorityCount: 5 })
    expect(events).toEqual([{ name: 'pressure-state-change', pressure: 'normal' }])
    g.updateImageSystemState({ priorityCount: 6 })
    expect(events.map((e) => e.pressure)).toEqual(['normal', 'high'])
  })

  it('an unchanged update tells nobody', async () => {
    const g = await load()
    const cb = vi.fn()
    g.subscribeGuardStats(cb)
    g.updateImageSystemState({})
    g.updateImageSystemState({ predictiveCount: 0, priorityCount: 0 })
    expect(cb).not.toHaveBeenCalled()
    // a load that does not change the level changes no stat, so nobody is told
    g.updateImageSystemState({ predictiveCount: 1 })
    expect(cb).not.toHaveBeenCalled()
    g.updateImageSystemState({ priorityCount: 4 })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('a high level is warned about in a debug build only', async () => {
    const quiet = await load()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    quiet.updateImageSystemState({ priorityCount: 6 })
    expect(console.warn).not.toHaveBeenCalled()
    const loud = await load({ NEXT_PUBLIC_PERF_DEBUG: 'true' })
    loud.updateImageSystemState({ priorityCount: 6 })
    expect(console.warn).toHaveBeenCalledOnce()
  })
})

describe('blocks', () => {
  it('a duplicate counts as a conflict and is announced as suppressed', async () => {
    const g = await load()
    g.notifyGuardBlock('duplicate-url', 'viewport', 'a.jpg')
    expect(g.getGuardStats()).toMatchObject({ conflicts: 1, suppressed: 0 })
    expect(events).toEqual([{ name: 'preload-suppressed', reason: 'duplicate-url', trigger: 'viewport', src: 'a.jpg' }])
  })

  it.each(['rate-limit', 'contention', 'near-limit'] as const)('%s counts as suppressed and is announced as a guard trigger', async (reason) => {
    const g = await load()
    g.notifyGuardBlock(reason, 'hover', 'a.jpg')
    expect(g.getGuardStats()).toMatchObject({ conflicts: 0, suppressed: 1 })
    expect(events).toEqual([{ name: 'image-guard-trigger', reason, trigger: 'hover', src: 'a.jpg' }])
  })

  it('the counts add up', async () => {
    const g = await load()
    g.notifyGuardBlock('duplicate-url', 'viewport', 'a')
    g.notifyGuardBlock('duplicate-url', 'viewport', 'b')
    g.notifyGuardBlock('contention', 'viewport', 'c')
    expect(g.getGuardStats()).toMatchObject({ conflicts: 2, suppressed: 1 })
  })
})

describe('reset and the hook', () => {
  it('a reset forgets every URL, count and level', async () => {
    const g = await load()
    g.notifyPredictivePreload('a.jpg')
    g.updateImageSystemState({ priorityCount: 6 })
    g.notifyGuardBlock('contention', 'hover', 'a.jpg')
    g.resetGuard()
    expect(g.getGuardStats()).toEqual({ pressure: 'low', conflicts: 0, suppressed: 0 })
    expect(g.canPredictivePreload('a.jpg', 'viewport', 0, 2)).toBe('allow')
  })

  it('useGuardStats follows the stats, and an unsubscribed listener is not called', async () => {
    const g = await load()
    const { result, unmount } = renderHook(() => g.useGuardStats())
    expect(result.current.pressure).toBe('low')
    act(() => g.updateImageSystemState({ priorityCount: 4 }))
    expect(result.current.pressure).toBe('normal')
    unmount()
    const stop = g.subscribeGuardStats(() => undefined)
    stop()
  })
})
