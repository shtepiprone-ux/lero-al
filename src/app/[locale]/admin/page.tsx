import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { requireStaffPage } from '@/lib/auth/staff'
import { allowedAdminPageKeys, roleHasPermission } from '@/lib/auth/permissions'
import { ADMIN_PAGES, adminHref } from '@/lib/auth/adminPages'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { MantineEmptyLoadingErrorState } from '@/design-system/mantine/patterns/MantineEmptyLoadingErrorState'
import { parsePeriodParams, resolvePeriod } from '@/lib/dashboard/period'
import { getAdminDashboardData } from '@/modules/admin/dashboard/queries'
import { getAdminTrends, getVisibleListingsByCity } from '@/modules/admin/dashboard/trends'
import { getActivityFreshness, getPlatformActivitySeries } from '@/modules/analytics/activity/read'
import { AdminDashboardView } from '@/modules/admin/dashboard/components/AdminDashboardView'

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * `/admin` — the operations dashboard (Task 853, rebuilt to the owner's references by Task 890).
 * Server component only: reads the period from the URL (`period`, `from`, `to`; anything else is
 * ignored, an invalid value falls back to 30 days), fetches every block in one `Promise.all` (after
 * the locale), and renders `AdminDashboardView` with serializable props only (791 lesson — no function ever crosses
 * this boundary; the view owns its own callbacks via `useRouter`).
 */
export default async function AdminDashboard({ searchParams }: Props) {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  // Task 1007: `landing` checks the role only, because `/admin` is where a moderator without `page.dashboard` is sent on to the first page switched on
  const { role } = await requireStaffPage({ landing: true })
  if (role !== 'admin' && !(await roleHasPermission(role, 'page.dashboard'))) {
    // no dashboard read runs for this moderator: the first page switched on (the sidebar's order), or the no-pages state (a failed read of the keys is the same: none).
    // `page.dashboard` is never the target: `/admin` would redirect to itself when the first read failed and this one did not.
    const [first] = (await allowedAdminPageKeys(role)).filter((key) => key !== 'page.dashboard')
    const page = ADMIN_PAGES.find((p) => p.key === first)
    if (page) redirect(adminHref(await getAdminLocale(), page.paths[0]))
    await getAdminLocale()   // the admin's own language, as on every admin page: without it the message comes in the site's default locale
    const t = await getTranslations('admin.pages_access')
    return (
      <AdminPageFrame>
        <MantineEmptyLoadingErrorState state="empty" title={t('none')} />
      </AdminPageFrame>
    )
  }
  const sp = await searchParams
  const now = new Date()
  const periodSelection = parsePeriodParams(sp, now)
  const period = resolvePeriod(periodSelection, now)

  // The city card labels follow the admin locale, so that (cookie-only) read comes first.
  const locale = await getAdminLocale()
  const [data, activity, freshness, trends, cities] = await Promise.all([
    getAdminDashboardData(),
    getPlatformActivitySeries(period),
    getActivityFreshness(now),
    getAdminTrends(period, now),
    getVisibleListingsByCity(locale),
  ])

  return (
    <AdminPageFrame>
      <AdminDashboardView
        data={data}
        activity={activity}
        freshness={freshness}
        trends={trends}
        cities={cities}
        locale={locale}
        now={now.toISOString()}
        period={periodSelection}
        periodDays={period.days}
      />
    </AdminPageFrame>
  )
}
