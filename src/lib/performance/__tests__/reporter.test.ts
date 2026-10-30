/**
 * Vitals reporter (Task 923 Revision 7): which samples are reported, which are dropped as invalid (and why), and what is printed in a debug build.
 * An invalid sample (a back-forward cache restore, a 5-minute LCP, a hidden tab) reported as real would show up as a performance regression that never happened.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WebVitalMetric } from '../collector'

const metric = (over: Partial<WebVitalMetric> = {}): WebVitalMetric => ({
  name: 'LCP', value: 1200, rating: 'good', id: 'lcp-1', navigationType: 'navigate', route: '/sq/listings', deviceType: 'desktop', viewportWidth: 1200, viewportHeight: 800,
  lcpIsImage: false, wasHiddenDuringCollection: false, env: 'production', ...over,
})

let events: { name?: string; reason?: string; originalValue?: number; route?: string; navigationType?: string; env?: string; value?: number }[] = []
const listener = (e: Event) => events.push((e as CustomEvent).detail)

async function load(env: Record<string, string> = {}) {
  vi.resetModules()
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  return (await import('../reporter')).reportMetric
}

beforeEach(() => {
  events = []
  window.addEventListener('lero:vitals', listener)
  vi.spyOn(console, 'debug').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})
afterEach(() => { window.removeEventListener('lero:vitals', listener); vi.unstubAllEnvs(); vi.restoreAllMocks() })

describe('what is reported', () => {
  it('a good sample is dispatched as it is', async () => {
    const report = await load()
    report(metric())
    expect(events).toEqual([metric()])
  })

  it('without debug mode nothing is printed', async () => {
    const report = await load()
    report(metric({ rating: 'poor', value: 9000 }))
    expect(console.log).not.toHaveBeenCalled()
    expect(console.warn).not.toHaveBeenCalled()
    expect(events).toHaveLength(1)
  })
})

describe('what is dropped, and why', () => {
  it.each([
    ['an LCP over 60 seconds', metric({ value: 60_001 }), 'sanity-ceiling'],
    ['an LCP after a back / forward restore', metric({ navigationType: 'back_forward' }), 'bfcache'],
    ['a sample taken while the tab was hidden', metric({ wasHiddenDuringCollection: true }), 'hidden-during-collection'],
    ['a hidden CLS', metric({ name: 'CLS', value: 0.3, rating: 'poor', wasHiddenDuringCollection: true }), 'hidden-during-collection'],
  ])('%s', async (_l, m, reason) => {
    const report = await load()
    report(m)
    expect(events).toEqual([{ name: `${m.name}-dropped`, reason, originalValue: m.value, route: '/listings', navigationType: m.navigationType, env: m.env }])
  })

  it('exactly 60 seconds is still kept', async () => {
    const report = await load()
    report(metric({ value: 60_000 }))
    expect(events[0]).toMatchObject({ name: 'LCP', value: 60_000 })
  })

  it('back / forward only drops the LCP, not CLS or INP', async () => {
    const report = await load()
    report(metric({ name: 'INP', value: 300, rating: 'needs-improvement', navigationType: 'back_forward' }))
    expect(events[0]).toMatchObject({ name: 'INP' })
  })

  it('the route in a dropped sample has its language prefix removed', async () => {
    const report = await load()
    for (const [route, expected] of [['/sq/listings', '/listings'], ['/en', '/'], ['/uk/', '/'], ['/listings', '/listings'], ['/', '/'], ['/abcde/x', '/abcde/x']]) {
      events = []
      report(metric({ wasHiddenDuringCollection: true, route }))
      expect(events[0].route).toBe(expected)
    }
  })

  it('a dropped sample is only logged at debug level', async () => {
    const report = await load()
    report(metric({ value: 70_000 }))
    expect(console.debug).toHaveBeenCalledOnce()
    expect(console.warn).not.toHaveBeenCalled()
  })
})

describe('in a debug build', () => {
  it('prints one line per sample with its rating', async () => {
    const report = await load({ NEXT_PUBLIC_PERF_DEBUG: 'true' })
    report(metric())
    report(metric({ name: 'CLS', value: 0.123456, rating: 'needs-improvement' }))
    report(metric({ name: 'INP', value: 150.6 }))
    const labels = (console.log as unknown as { mock: { calls: string[][] } }).mock.calls.map((c) => c[0])
    expect(labels).toEqual(['%c[LCP] 1200ms — GOOD', '%c[CLS] 0.1235 — NEEDS IMPROVEMENT', '%c[INP] 151ms — GOOD'])
  })

  it('warns once per metric and route about a poor sample', async () => {
    const report = await load({ NEXT_PUBLIC_PERF_DEBUG: 'true' })
    report(metric({ rating: 'poor', value: 5000 }))
    report(metric({ rating: 'poor', value: 5200 }))
    report(metric({ rating: 'poor', value: 5200, route: '/en/cabinet' }))
    const warnings = (console.warn as unknown as { mock: { calls: string[][] } }).mock.calls.map((c) => c[0])
    expect(warnings.filter((w) => w.includes('[Perf Regression]'))).toHaveLength(2)
    expect(warnings[0]).toContain('Budget: good ≤ 2500ms, poor > 4000ms')
  })

  it('warns when an image owns the LCP, except on a listing page', async () => {
    const report = await load({ NEXT_PUBLIC_PERF_DEBUG: 'true' })
    report(metric({ lcpIsImage: true, route: '/sq/cabinet' }))
    report(metric({ lcpIsImage: true, route: '/sq/listings/flat-1' }))
    const warnings = (console.warn as unknown as { mock: { calls: string[][] } }).mock.calls.map((c) => c[0])
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('/sq/cabinet')
  })

  it('a poor sample in a development build is "dev only", not a regression', async () => {
    const report = await load({ NODE_ENV: 'development' })
    report(metric({ rating: 'poor', value: 5000 }))
    expect(console.info).toHaveBeenCalledOnce()
    expect(console.warn).not.toHaveBeenCalled()
    expect(events).toHaveLength(1)
  })
})
