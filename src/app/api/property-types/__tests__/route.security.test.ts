// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S10): GET /api/property-types?locale=...
 * The locale went unvalidated into a cached query, so every distinct string was a new cache key (unbounded memory) and a new database round trip.
 * Only a supported locale reaches the query; anything else is answered as the default locale.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const asked: string[] = []
vi.mock('@/modules/admin/lib/propertyTypes', () => ({
  getLocalizedPropertyTypes: vi.fn(async (locale: string) => { asked.push(locale); return [{ slug: 'flat', name: `flat-${locale}` }] }),
}))

import { GET } from '../route'

const get = (qs: string) => GET(new Request(`https://lero.al/api/property-types${qs}`))
beforeEach(() => { asked.length = 0 })

describe('GET /api/property-types', () => {
  it.each(['sq', 'en', 'uk', 'it'])('asks for the supported locale %s', async (l) => {
    const res = await get(`?locale=${l}`)
    expect(asked).toEqual([l])
    expect(await res.json()).toEqual([{ slug: 'flat', name: `flat-${l}` }])
  })

  it('no locale means the default (sq)', async () => {
    await get('')
    expect(asked).toEqual(['sq'])
  })

  it.each(['xx', 'EN', 'en ', 'en,uk', '../../etc', '<script>alert(1)</script>', 'a'.repeat(500), '', '%00', "sq'; drop table property_types;--"])('maps the unsupported locale %j to the default', async (l) => {
    await get(`?locale=${encodeURIComponent(l)}`)
    expect(asked).toEqual(['sq'])
  })

  it('many different bogus locales produce ONE cache key, not many', async () => {
    for (let i = 0; i < 50; i++) await get(`?locale=bogus${i}`)
    expect(new Set(asked)).toEqual(new Set(['sq']))
  })

  it('is cacheable by shared caches and sets no cookie', async () => {
    const res = await get('?locale=en')
    expect(res.headers.get('cache-control')).toMatch(/public/)
    expect(res.headers.get('set-cookie')).toBeNull()
  })
})

// Task 923 R38 (case SEC-S10-SRV-DENY)
it('[SEC-S10-SRV-DENY] The property-types route accepts only the four supported locales', async () => {
  await get('?locale=xx')
  await get(`?locale=${'a'.repeat(10_000)}`)
  expect(asked).toEqual(['sq', 'sq'])                       // the default locale is used, never the typed string: no new cache key
  asked.length = 0
  for (const l of ['sq', 'en', 'uk', 'it']) await get(`?locale=${l}`)
  expect(asked).toEqual(['sq', 'en', 'uk', 'it'])           // the control: the four supported locales pass
})
