import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { routing } from '@/i18n/routing'
import { applyPublicVisibility } from '@/modules/listings/lib/visibility'

// Task 923 R72 (h): the site had no sitemap. It lists the public pages of every language and EVERY listing a visitor can open (the canonical visibility policy
// `applyPublicVisibility`: an active, unexpired listing), paged: one file of at most PAGE_SIZE listings per `generateSitemaps` id, so no single query or file grows with
// the catalogue (the protocol allows 50 000 addresses a file). Only the slug and the last change are read.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'
const PAGE_SIZE = 5000

/** one sitemap file per PAGE_SIZE public listings (at least one, which also carries the static pages) */
export async function generateSitemaps(): Promise<Array<{ id: number }>> {
  let total = 0
  try {
    const { count } = await applyPublicVisibility(createAdminClient().from('listings').select('id', { count: 'exact', head: true }))
    total = count ?? 0
  } catch {
    // no database at build time: the first file is still produced, empty of listings
  }
  return Array.from({ length: Math.max(1, Math.ceil(total / PAGE_SIZE)) }, (_, id) => ({ id }))
}

export default async function sitemap(props: { id: number | string | Promise<number | string> }): Promise<MetadataRoute.Sitemap> {
  const index = Number(await props.id)
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
