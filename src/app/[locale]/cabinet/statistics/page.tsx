import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getAgentStatisticsAccess } from '@/modules/cabinet/statistics/access'
import { getAgentStatisticsData, getOwnListingTitles } from '@/modules/cabinet/statistics/data'
import { resolvePeriod, parsePeriodParams, previousPeriod } from '@/lib/dashboard/period'
import { parseAgt10Table } from '@/modules/cabinet/statistics/tableParams'
import { rankTopListings } from '@/modules/cabinet/statistics/topListings'
import { portfolioSegments } from '@/modules/cabinet/statistics/portfolio'
import { getOwnerActivitySeries, getOwnerActivityByListing, getActivityFreshness } from '@/modules/analytics/activity/read'
import { blockFail, blockOk, type BlockResult } from '@/lib/dashboard/blockResult'
import { AgentStatisticsView } from '@/modules/cabinet/statistics/components/AgentStatisticsView'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'cabinet.statistics' })
  return { title: `${t('title')} | Lero.al` }
}

/**
 * `/{locale}/cabinet/statistics` — the agent dashboard (Task 854, D78-3/D78-6). Server component
 * only: reads the access gate and the period/table URL params, fetches 848's data, and renders
 * `AgentStatisticsView` with serializable props only (791 lesson — no function ever crosses this
 * boundary; every callback the view needs, it owns itself via `useRouter`).
 */
export default async function AgentStatisticsPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams

  const access = await getAgentStatisticsAccess()
  if (access.kind === 'unauthenticated') {
    redirect(`/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/cabinet/statistics`)}&session=lost`)
  }
  if (access.kind === 'not_agent') {
    redirect(`/${locale}/cabinet`)
  }

  const now = new Date()
  const periodSelection = parsePeriodParams(sp, now)
  const period = resolvePeriod(periodSelection, now)
  const table = parseAgt10Table(sp)

  // Task 891 (R1): started here, before any `await`, so every one of 848's own queries and 849's
  // activity series/by-listing/freshness reads runs concurrently. `getAgentStatisticsData` awaits
  // this same `activityByListing` promise internally (to merge/sort AGT-10's activity columns, R7),
  // and it is awaited again here for the top-listings ranking — one network call, two consumers.
  const activityByListing = getOwnerActivityByListing(access.ownerId, period)
  const [data, activitySeriesCurrent, activitySeriesPrevious, freshness, byListingForTop, ownListings] =
    await Promise.all([
      getAgentStatisticsData({ ownerId: access.ownerId, now, period, table, activityByListing }),
      getOwnerActivitySeries(access.ownerId, period),
      getOwnerActivitySeries(access.ownerId, previousPeriod(period)),
      getActivityFreshness(now),
      activityByListing,
      getOwnListingTitles(access.ownerId),
    ])

  const topListings: BlockResult<ReturnType<typeof rankTopListings>> =
    byListingForTop.ok && ownListings.ok
      ? blockOk(rankTopListings(byListingForTop.data, ownListings.data))
      : blockFail('query_failed')

  const portfolio: BlockResult<ReturnType<typeof portfolioSegments>> =
    data.agt01.ok && data.agt02.ok
      ? blockOk(portfolioSegments(data.agt02.data.statusCounts, data.agt01.data.hidden))
      : blockFail('query_failed')

  return (
    <AgentStatisticsView
      data={data}
      activitySeriesCurrent={activitySeriesCurrent}
      activitySeriesPrevious={activitySeriesPrevious}
      freshness={freshness}
      topListings={topListings}
      portfolio={portfolio}
      locale={locale}
      now={now.toISOString()}
      period={periodSelection}
      periodDays={period.days}
      table={table}
    />
  )
}
