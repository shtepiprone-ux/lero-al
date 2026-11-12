// @vitest-environment node
/**
 * Task 964 AC2: robots.txt names every sitemap file the site serves. `src/app/sitemap.ts` has `generateSitemaps`, so Next serves `/sitemap/<id>.xml` for each id and
 * no `/sitemap.xml` at all (measured 2026-11-07: robots.txt named that missing address). The ids come from a double of `generateSitemaps`; every value is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sitemaps = vi.hoisted(() => ({ ids: [{ id: 0 }] as Array<{ id: number }>, calls: 0 }))
vi.mock('../sitemap', () => ({
  generateSitemaps: async () => { sitemaps.calls += 1; return sitemaps.ids },
}))

import robots, { revalidate } from '../robots'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'

beforeEach(() => { sitemaps.calls = 0 })

describe('robots.txt', () => {
  it('names the one sitemap file when there is one, and never /sitemap.xml', async () => {
    sitemaps.ids = [{ id: 0 }]
    const result = await robots()
    expect(result.sitemap).toEqual([`${SITE}/sitemap/0.xml`])
    expect(sitemaps.calls).toBe(1)
  })

  it('names each of three sitemap files in order, and never /sitemap.xml', async () => {
    sitemaps.ids = [{ id: 0 }, { id: 1 }, { id: 2 }]
    const result = await robots()
    expect(result.sitemap).toEqual([`${SITE}/sitemap/0.xml`, `${SITE}/sitemap/1.xml`, `${SITE}/sitemap/2.xml`])
    expect(JSON.stringify(result)).not.toContain('/sitemap.xml')
  })

  it('keeps the private areas out of the index and is rebuilt at most once an hour', async () => {
    const result = await robots()
    expect(result.rules).toEqual([
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/cabinet', '/auth', '/*/cabinet', '/*/auth'] },
    ])
    expect(revalidate).toBe(3600)
  })
})
