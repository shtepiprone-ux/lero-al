import { redirect } from 'next/navigation'
import { getDefaultSiteLocale } from '@/modules/admin/lib/settings'

// Use temporary redirect (307) so the browser re-checks when default locale changes.
export default async function RootPage() {
  const locale = await getDefaultSiteLocale()
  redirect(`/${locale}`)
}
