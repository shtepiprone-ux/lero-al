import { redirect } from 'next/navigation'
import { getDefaultSiteLocale } from '@/modules/admin/lib/settings'

// Use temporary redirect (307) so the browser re-checks when default locale changes.
// Task 988: the request proxy sends `/` to the account language, the session language or next-intl's default first; this page is what is left: the site-wide
// default locale from DB settings (the `admin-locale` cookie is gone).
export default async function RootPage() {
  const locale = await getDefaultSiteLocale()
  redirect(`/${locale}`)
}
