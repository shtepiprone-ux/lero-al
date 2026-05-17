import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getDefaultSiteLocale } from '@/modules/admin/lib/settings'

const SUPPORTED = ['sq', 'en', 'uk', 'it'] as const
type Locale = typeof SUPPORTED[number]

// Use temporary redirect (307) so the browser re-checks when default locale changes.
export default async function RootPage() {
  // Prefer the user's preferred locale cookie (set by both website and admin switchers).
  // Falls back to the site-wide default locale from DB settings.
  const jar = await cookies()
  const raw = jar.get('admin-locale')?.value
  const preferred = (SUPPORTED as readonly string[]).includes(raw ?? '') ? raw as Locale : null
  const locale = preferred ?? await getDefaultSiteLocale()
  redirect(`/${locale}`)
}
