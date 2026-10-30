import type { MetadataRoute } from 'next'

// Task 923 R72 (h): the site had no robots file. The admin panel, the API, the cabinet and the authentication pages are not for search engines. The cabinet and the
// authentication pages live under the language segment (`/sq/cabinet`, `/en/auth/...`), so each of them is listed with and without it (`*` matches the language).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lero.al'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/cabinet', '/auth', '/*/cabinet', '/*/auth'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
