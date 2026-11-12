import type { MetadataRoute } from 'next'
import { generateSitemaps } from './sitemap'

// Task 923 R72 (h): the site had no robots file. The admin panel, the API, the cabinet and the authentication pages are not for search engines. The cabinet and the
// authentication pages live under the language segment (`/sq/cabinet`, `/en/auth/...`), so each of them is listed with and without it (`*` matches the language).
// Task 964: `sitemap.ts` has `generateSitemaps`, so Next serves one `/sitemap/<id>.xml` per id and no `/sitemap.xml`; each file that exists is named here.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'

/**
 * rebuilt at most once an hour, as the sitemap files are (Task 964), and at once when the public listings change: the ids come from `generateSitemaps`, whose count is
 * cached under PUBLIC_LISTINGS_CACHE_TAG (Revision 1, R1-1/R1-2), so `robots.txt` names exactly the files the sitemap route serves now
 */
export const revalidate = 3600

export default async function robots(): Promise<MetadataRoute.Robots> {
  const sitemaps = await generateSitemaps()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/cabinet', '/auth', '/*/cabinet', '/*/auth'],
      },
    ],
    sitemap: sitemaps.map(({ id }) => `${SITE_URL}/sitemap/${id}.xml`),
  }
}
