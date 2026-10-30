// @vitest-environment jsdom
/**
 * Security (Task 923 R66 (g)): the speculation-rules script of the similar-listings block carries the stored slugs of OTHER listings.
 *  - SEC-X-SRV-SLUG-SCRIPT (critical): a slug that holds `</script><script>` stays inside the JSON; the server-rendered block has exactly one script element.
 *  - SEC-X-FE-SPECULATION-ESCAPE: parsed like a browser would, the page holds one speculation-rules script and no element injected after it.
 * `SimilarListings` and `jsonForScript` are the real ones; the database, the language layer and the card grid (`SimilarListingsView`, not under test) are doubles.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// the two line terminators of the script grammar, written from their code points so that no raw one sits in this file
const LS = String.fromCharCode(0x2028)
const PS = String.fromCharCode(0x2029)
const BARE = new RegExp(`[<>&${LS}${PS}]`)
const HOSTILE = `x"</script><script id="evil">window.__pwned=1</script><!-- ${LS}${PS} &amp; <img src=x onerror=alert(1)>`
let rows: { id: string; slug: string }[] = []

// every builder call returns the builder; the ladder's terminal `.limit()` answers with the rows
const chain: unknown = new Proxy({}, { get: (_t, prop) => (prop === 'limit' ? () => Promise.resolve({ data: rows, error: null }) : () => chain) })
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: () => chain }) }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => null }))
vi.mock('@/lib/getExchangeRateServer', () => ({ getExchangeRates: async () => ({}) }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key, getLocale: async () => 'sq' }))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('./SimilarListingsView', () => ({ SimilarListingsView: () => null }))

import { SimilarListings } from './SimilarListings'

const PROPS = {
  currentId: 'current', propertyType: 'apartment', listingType: 'sale', locationId: null, condition: null, heating: null, wallType: null, marketType: null, offerType: null,
  purchaseConditions: null, rooms: null, areaGross: null, floor: null, yearBuilt: null,
}
const render = async () => renderToStaticMarkup(await SimilarListings(PROPS))
const scriptText = (html: string) => html.slice(html.indexOf('>', html.indexOf('<script type="speculationrules"')) + 1, html.indexOf('</script>'))

beforeEach(() => {
  rows = [{ id: 'a', slug: HOSTILE }, { id: 'b', slug: 'normal-slug-1' }, { id: 'c', slug: 'normal-slug-2' }]
})

describe('SimilarListings', () => {
  it('[SEC-X-SRV-SLUG-SCRIPT] a hostile slug stays inside the JSON', async () => {
    const html = await render()
    // the block holds exactly one script element, and the hostile text never closes it
    expect(html.split('<script').length - 1).toBe(1)
    expect(html.split('</script>').length - 1).toBe(1)
    expect(html).not.toContain('</script><script')
    expect(html).not.toContain('id="evil"')
    expect(html.indexOf('<script type="speculationrules"')).toBeGreaterThanOrEqual(0)
    const json = scriptText(html)
    // the JSON parses back to the exact slug: nothing was dropped or altered, only written with escapes
    const parsed = JSON.parse(json) as { prerender: { source: string; urls: string[]; eagerness: string }[] }
    expect(parsed.prerender).toHaveLength(1)
    expect(parsed.prerender[0].urls).toEqual([`/sq/listings/${HOSTILE}`, '/sq/listings/normal-slug-1'])
    // none of the five characters is left bare inside the script text
    expect(json).not.toMatch(BARE)
  })

  it('the same block with ordinary slugs keeps its two URLs and its settings (the control)', async () => {
    rows = [{ id: 'b', slug: 'normal-slug-1' }, { id: 'c', slug: 'normal-slug-2' }, { id: 'd', slug: 'normal-slug-3' }]
    expect(JSON.parse(scriptText(await render()))).toEqual({ prerender: [{ source: 'list', urls: ['/sq/listings/normal-slug-1', '/sq/listings/normal-slug-2'], eagerness: 'conservative' }] })
  })

  it('[SEC-X-FE-SPECULATION-ESCAPE] the parsed page has one speculation script', async () => {
    const doc = new DOMParser().parseFromString(`<!doctype html><html><body>${await render()}</body></html>`, 'text/html')
    const scripts = doc.querySelectorAll('script')
    expect(scripts).toHaveLength(1)
    expect(scripts[0].getAttribute('type')).toBe('speculationrules')
    expect(JSON.parse(scripts[0].textContent ?? '').prerender[0].urls[0]).toBe(`/sq/listings/${HOSTILE}`)
    // no element was injected by the hostile text, before or after the script
    expect(doc.getElementById('evil')).toBeNull()
    expect(doc.querySelector('img')).toBeNull()
    expect(doc.body.querySelectorAll('*').length).toBe(2)               // the wrapper div and the script
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined()
  })
})
