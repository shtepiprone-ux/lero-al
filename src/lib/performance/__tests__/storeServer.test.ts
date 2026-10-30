// @vitest-environment node
/**
 * The performance store on the server (Task 923 Revision 7): there is no window, so nothing may be read from the browser, and the first render must match what the
 * browser renders before it knows the device (the "medium" tier), or the page would not hydrate cleanly.
 */
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { initPerformanceStore, usePerformanceState, usePerformanceTier } from '../store'

describe('on the server', () => {
  it('starting the store does nothing and its stop does nothing', () => {
    const stop = initPerformanceStore()
    expect(typeof stop).toBe('function')
    expect(() => stop()).not.toThrow()
  })

  it('renders the neutral snapshot: medium tier, nothing measured, not locked', () => {
    function Probe() {
      const s = usePerformanceState()
      return createElement('span', null, JSON.stringify(s))
    }
    const html = renderToString(createElement(Probe))
    expect(html).toContain('&quot;tier&quot;:&quot;medium&quot;')
    expect(html).toContain('&quot;isLocked&quot;:false')
    expect(html).toContain('&quot;lcp&quot;:null')
  })

  it('the tier hook gives "medium" on the server', () => {
    function Probe() { return createElement('i', null, usePerformanceTier()) }
    expect(renderToString(createElement(Probe))).toContain('medium')
  })
})
