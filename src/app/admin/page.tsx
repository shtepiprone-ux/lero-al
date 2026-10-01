import { getAdminLocale } from '@/lib/admin/getAdminLocale'
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
  )
}
