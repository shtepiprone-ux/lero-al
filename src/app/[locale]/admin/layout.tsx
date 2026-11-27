import { notFound, redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { requireViewer } from '@/lib/auth/requireViewer'
import { allowedAdminPageKeys } from '@/lib/auth/permissions'
import { adminHref, adminSidebarPaths } from '@/lib/auth/adminPages'
import { AdminShell } from '@/components/admin/AdminShell'
import type { Metadata } from 'next'
import { getAllSettings, getSettings } from '@/modules/admin/lib/settings'
import { isAppLocale } from '@/i18n/uiLocale'
import { isBrandImageUrl } from '@/lib/uploads/imageUrl'

// Task 989: the admin tab shows the saved favicon too, only when it is an image of the account's own Cloudinary; else the fixed `src/app/favicon.ico`
export async function generateMetadata(): Promise<Metadata> {
  const favicon = await getSettings(['favicon_url']).then(settings => settings.favicon_url, () => undefined)
  return { title: 'Admin — Lero.al', ...(isBrandImageUrl(favicon) ? { icons: { icon: favicon as string } } : {}) }
}

// Task 988 (owner decision O988-4): the admin lives under the language slug. Its language is the `[locale]` segment, checked and given to next-intl by
// `src/app/[locale]/layout.tsx`, whose provider carries the messages of that language: no cookie and no second message bundle here.
export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isAppLocale(locale)) notFound()   // every redirect below is built from it
  setRequestLocale(locale)

  // The role comes from requireViewer() (Task 923 R44): a blocked, deactivated, deleted or missing account of any role is not an administrator or
  // a moderator, and a failed lookup does not open the admin area.
  const viewer = await requireViewer()
  if (!viewer.ok && viewer.reason === 'unauthenticated') redirect(`/${locale}/auth/login?next=${encodeURIComponent(adminHref(locale, '/admin'))}&session=lost`)

  const isAuthorized = viewer.ok && (viewer.role === 'admin' || viewer.role === 'moderator')
  if (!isAuthorized) redirect(`/${locale}`)

  // Task 1007: the sidebar shows the pages the administrator switched on for a moderator (one read, shared with the `/admin` landing); an administrator sees every item, a failed
  // read shows none. Display only: every page and every loader checks its own key.
  const role = viewer.ok ? viewer.role : null
  const allowedPaths = adminSidebarPaths(role ? await allowedAdminPageKeys(role) : [], role === 'admin')

  const settings = await getAllSettings()
  const siteName = settings['site_name'] ?? 'Lero.al'

  return <AdminShell siteName={siteName} locale={locale} allowedPaths={allowedPaths}>{children}</AdminShell>
}
