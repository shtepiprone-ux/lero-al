import type { MetadataRoute } from 'next'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { routing } from '@/i18n/routing'
import { applyPublicVisibility } from '@/modules/listings/lib/visibility'
import { PUBLIC_LISTINGS_CACHE_TAG } from '@/modules/listings/lib/cacheTags'

// Task 923 R72 (h): the site had no sitemap. It lists the public pages of every language and EVERY listing a visitor can open (the canonical visibility policy
// `applyPublicVisibility`: an active, unexpired listing), paged: one file of at most PAGE_SIZE listings per `generateSitemaps` id, so no single query or file grows with
// the catalogue (the protocol allows 50 000 addresses a file). Only the slug and the last change are read.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'
const PAGE_SIZE = 5000

// Task 964: the files are read by anonymous visitors outside the proxy, and each one is a service-role read of up to PAGE_SIZE rows. So each file is cached for an hour.
// Revision 1 (R1-1): the set of files follows the CURRENT public listings, not the build. There is no `dynamicParams = false`, so Next serves an id `generateSitemaps`
// returns at request time; the Next wrapper of the route calls `generateSitemaps` on every request, which answers from the cached count below, so an id past the last
// file is a 404 without a read of the listings. A change to the public listings expires PUBLIC_LISTINGS_CACHE_TAG (the Server Actions of R1-2), which reaches this count,
// every cached file and `robots.txt` at once; listings that lapse by time change no row, so the hour bounds how long one stays listed. An id that is not a whole number
// answers 404 here too, before any read.
export const revalidate = 3600
const WHOLE_NUMBER = /^(?:0|[1-9]\d*)$/

/** the number of public listings, cached under the public-listings tag for an hour; a failed read throws, so it is never cached as a count */
const publicListingCount = unstable_cache(
  async (): Promise<number> => {
    const { count, error } = await applyPublicVisibility(createAdminClient().from('listings').select('id', { count: 'exact', head: true }))
    if (error) throw error
    return count ?? 0
  },
  ['public-listing-count'],
  { revalidate: 3600, tags: [PUBLIC_LISTINGS_CACHE_TAG] },
)

/** one sitemap file per PAGE_SIZE public listings (at least one, which also carries the static pages) */
export async function generateSitemaps(): Promise<Array<{ id: number }>> {
  let total = 0
  try {
    total = await publicListingCount()
  } catch {
    // no database (or a failed read): the first file is still produced, empty of listings, and nothing is cached
  }
  return Array.from({ length: Math.max(1, Math.ceil(total / PAGE_SIZE)) }, (_, id) => ({ id }))
}

export default async function sitemap(props: { id: number | string | Promise<number | string> }): Promise<MetadataRoute.Sitemap> {
  const raw = String(await props.id)
  const index = Number(raw)
  if (!WHOLE_NUMBER.test(raw) || !Number.isSafeInteger(index)) notFound()
  const entries: MetadataRoute.Sitemap = []

  if (index === 0) {
    for (const locale of routing.locales) {
      entries.push({ url: `${SITE_URL}/${locale}`, changeFrequency: 'daily', priority: 1 })
      entries.push({ url: `${SITE_URL}/${locale}/listings`, changeFrequency: 'hourly', priority: 0.9 })
    }
  }

  try {
    const from = index * PAGE_SIZE
    const { data, error } = await applyPublicVisibility(createAdminClient().from('listings').select('slug, updated_at'))
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    for (const row of data ?? []) {
      if (!row.slug) continue
      for (const locale of routing.locales) {
        entries.push({
          url: `${SITE_URL}/${locale}/listings/${encodeURIComponent(row.slug)}`,
          lastModified: row.updated_at ?? undefined,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
    }
  } catch (err) {
    // a failed read must not publish a sitemap that silently lacks listings as if it were complete: the error is logged and the static entries remain
    console.error('[sitemap] listings read failed', { index, code: (err as { code?: string })?.code })
  }

  return entries
}
