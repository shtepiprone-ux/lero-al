// @vitest-environment node
/**
 * Security (Task 964): `/sitemap/<id>.xml` is read by anonymous visitors outside the proxy, and each file is a service-role read of up to 5000 listings.
 *  - AC3 (T2, denial of service): an id that is not a whole number answers 404 before any database read; the set of files follows the CURRENT public listings
 *    (Revision 1, R1-1): `dynamicParams` is not `false`, so Next serves an id `generateSitemaps` returns at request time, and `generateSitemaps` reads the public
 *    count through `unstable_cache` (tag `PUBLIC_LISTINGS_CACHE_TAG`, one hour), so an id past the last file is answered from the cached count and a second call makes
 *    no second query; a good id reads one range; both crawler files are cached for an hour.
 *  - AC4 (T1, information disclosure): the listings read goes through `applyPublicVisibility` (the canonical public visibility policy) and selects only the slug and
 *    the last change, so a listing a visitor may not open never appears in a sitemap.
 * The real `sitemap.ts` and the real visibility policy run; the service-role client is a recording double, and `next/cache` is a double that records the options of
 * `unstable_cache`, caches by key and drops the entries of a tag on `updateTag`. Every value is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PUBLIC_LISTINGS_CACHE_TAG } from '@/modules/listings/lib/cacheTags'

type Call = [string, ...unknown[]]
const db = vi.hoisted(() => ({
  clients: 0,
  tables: [] as string[],
  calls: [] as Call[],
  count: 0,
  rows: [] as Array<{ slug: string | null; updated_at: string | null }>,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => {
    db.clients += 1
    return {
      from: (table: string) => {
        db.tables.push(table)
        let head = false
        const query: Record<string, unknown> = {}
        for (const method of ['select', 'eq', 'in', 'gte', 'order', 'range']) {
          query[method] = (...args: unknown[]) => {
            db.calls.push([method, ...args])
            if (method === 'select' && (args[1] as { head?: boolean } | undefined)?.head) head = true
            return query
          }
        }
        query.then = (resolve: (value: unknown) => unknown) =>
          resolve(head ? { count: db.count, error: null } : { data: db.rows, error: null })
        return query
      },
    }
  },
}))

type CacheOptions = { revalidate?: number | false; tags?: string[] }
const cache = vi.hoisted(() => ({
  registrations: [] as Array<{ keyParts: string[] | undefined; options: CacheOptions | undefined }>,
  store: new Map<string, { value: unknown; tags: string[] }>(),
  expired: [] as string[],
}))

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => Promise<unknown>, keyParts?: string[], options?: CacheOptions) => {
    cache.registrations.push({ keyParts, options })
    return async (...args: unknown[]) => {
      const key = JSON.stringify([keyParts, args])
      const hit = cache.store.get(key)
      if (hit) return hit.value
      const value = await fn(...args)
      cache.store.set(key, { value, tags: options?.tags ?? [] })
      return value
    }
  },
  updateTag: (tag: string) => {
    cache.expired.push(tag)
    for (const [key, entry] of cache.store) if (entry.tags.includes(tag)) cache.store.delete(key)
  },
}))

import sitemap, * as sitemapModule from '../sitemap'
import { updateTag } from 'next/cache'
import { revalidate as robotsRevalidate } from '../robots'

const { generateSitemaps, revalidate } = sitemapModule

const NOT_FOUND = { digest: 'NEXT_HTTP_ERROR_FALLBACK;404' }
const serve = (id: string) => sitemap({ id: Promise.resolve(id) })
const countQueries = () => db.calls.filter(([m, , options]) => m === 'select' && (options as { head?: boolean } | undefined)?.head).length

beforeEach(() => {
  db.clients = 0
  db.tables = []
  db.calls = []
  db.count = 0
  db.rows = []
  cache.store.clear()
  cache.expired = []
})

describe('sitemap files: a bad id reads nothing', () => {
  it('[AC3] an id that is not a whole number answers 404 and the database is never touched', async () => {
    for (const id of ['abc', '-1', '1.5', '', '01', '1e3', ' 1', '0x1', '9007199254740993']) {
      await expect(serve(id), `id ${JSON.stringify(id)}`).rejects.toMatchObject(NOT_FOUND)
    }
    expect(db.clients).toBe(0)
    expect(db.calls).toEqual([])
  })

  it('[AC3] the files follow the current public listings: request-time ids are served (no `dynamicParams = false`) and the ids are the files of the count', async () => {
    // Revision 1, R1-1: with `dynamicParams = false` Next answered only the ids of the build, so a new file waited for a deployment
    expect((sitemapModule as Record<string, unknown>).dynamicParams).not.toBe(false)
    db.count = 12_000
    expect(await generateSitemaps()).toEqual([{ id: 0 }, { id: 1 }, { id: 2 }])
    // no listing at all still gives the one file that carries the static pages
    cache.store.clear()
    db.count = 0
    expect(await generateSitemaps()).toEqual([{ id: 0 }])
  })

  it('[AC3] generateSitemaps reads the count through unstable_cache with the public-listings tag and one hour, so a second call makes no second query', async () => {
    // the options are recorded when the module is loaded
    expect(cache.registrations).toHaveLength(1)
    expect(cache.registrations[0].options).toMatchObject({ tags: [PUBLIC_LISTINGS_CACHE_TAG], revalidate: 3600 })
    expect(cache.registrations[0].options?.tags).toEqual([PUBLIC_LISTINGS_CACHE_TAG])

    db.count = 1
    await generateSitemaps()
    expect(countQueries()).toBe(1)
    await generateSitemaps()
    await generateSitemaps()
    expect(countQueries(), 'the second and third call are answered from the cache').toBe(1)
  })

  it('[AC3] the ids follow a count that grows from 1 to 12 000 rows once the tag is expired, and not before', async () => {
    db.count = 1
    expect(await generateSitemaps()).toEqual([{ id: 0 }])
    db.count = 12_000
    // inside the cache the old count answers: an id past the last file stays a 404 without a read
    expect(await generateSitemaps()).toEqual([{ id: 0 }])
    expect(countQueries()).toBe(1)
    // a change to the public listings expires the tag (R1-2): the next call reads again and the files follow
    updateTag(PUBLIC_LISTINGS_CACHE_TAG)
    expect(cache.expired).toEqual([PUBLIC_LISTINGS_CACHE_TAG])
    expect(await generateSitemaps()).toEqual([{ id: 0 }, { id: 1 }, { id: 2 }])
    expect(countQueries()).toBe(2)
  })

  it('[AC3] a good id reads exactly one range of the listings', async () => {
    db.rows = [{ slug: 'flat-1', updated_at: '2026-11-01T00:00:00.000Z' }]
    const entries = await serve('2')
    expect(db.tables).toEqual(['listings'])
    expect(db.calls.filter(([m]) => m === 'range')).toEqual([['range', 10_000, 14_999]])
    // file 2 carries listings only; the static pages are in file 0
    expect(entries.map((e) => e.url)).toEqual(['sq', 'en', 'uk', 'it'].map((l) => `https://lero.al/${l}/listings/flat-1`))

    db.tables = []
    db.calls = []
    const first = await serve('0')
    expect(db.calls.filter(([m]) => m === 'range')).toEqual([['range', 0, 4_999]])
    expect(first.some((e) => e.url === 'https://lero.al/sq')).toBe(true)
  })

  it('[AC3] both crawler files are cached for one hour', () => {
    expect(revalidate).toBe(3600)
    expect(robotsRevalidate).toBe(3600)
  })
})

describe('sitemap files: only what a visitor may open', () => {
  it('[AC4] the listings read goes through the public visibility policy and selects only the slug and the last change', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-11T10:00:00.000Z'))
    try {
      await serve('0')
    } finally {
      vi.useRealTimers()
    }
    expect(db.calls.filter(([m]) => m === 'select')).toEqual([['select', 'slug, updated_at']])
    // applyPublicVisibility: only the public status, and not expired
    expect(db.calls).toContainEqual(['eq', 'status', 'active'])
    expect(db.calls).toContainEqual(['gte', 'expires_at', '2026-11-11T10:00:00.000Z'])
  })

  it('[AC4] the count that sizes the files uses the same policy', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-11T10:00:00.000Z'))
    try {
      await generateSitemaps()
    } finally {
      vi.useRealTimers()
    }
    expect(db.calls).toEqual([
      ['select', 'id', { count: 'exact', head: true }],
      ['eq', 'status', 'active'],
      ['gte', 'expires_at', '2026-11-11T10:00:00.000Z'],
    ])
  })
})
