'use client'

import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ActionIcon, Button, Flex, Group, Stack, Text, useMantineTheme } from '@mantine/core'
import { Check, Eye, EyeOff, FileCheck2, Flag, Info, LifeBuoy } from 'lucide-react'
import { MantineDashboardHeader } from '@/design-system/mantine/patterns/MantineDashboardHeader'
import { MantineDashboardPeriodControl, type DashboardPeriodControlLabels } from '@/design-system/mantine/patterns/MantineDashboardPeriodControl'
import {
  MantineDashboardGrid,
  MantineDashboardGridTopRow,
  MantineDashboardGridSplit,
  MantineDashboardGridFull,
} from '@/design-system/mantine/patterns/MantineDashboardGrid'
import { MantineDashboardStatCard } from '@/design-system/mantine/patterns/MantineDashboardStatCard'
import { MantineDashboardCard } from '@/design-system/mantine/patterns/MantineDashboardCard'
import { MantineDashboardWorkList, type DashboardWorkListRow } from '@/design-system/mantine/patterns/MantineDashboardWorkList'
import { MantineDashboardStatRows, type DashboardStatRow } from '@/design-system/mantine/patterns/MantineDashboardStatRows'
import { MantineDashboardDonut, type DashboardDonutSegment } from '@/design-system/mantine/patterns/MantineDashboardDonut'
import { MantineDashboardLineChart, type DashboardLineChartDatum } from '@/design-system/mantine/patterns/MantineDashboardLineChart'
import { MantineDashboardBarChart, type DashboardBarChartDatum } from '@/design-system/mantine/patterns/MantineDashboardBarChart'
import { MantineDashboardSparkline } from '@/design-system/mantine/patterns/MantineDashboardSparkline'
import { MantineTooltip } from '@/design-system/mantine/patterns/MantineTooltip'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { tiraneAbsoluteLabel, serializePeriod, type PeriodSelection } from '@/lib/dashboard/period'
import type { BlockResult } from '@/lib/dashboard/blockResult'
import { AdminDashboardRecentListings } from '@/components/admin/AdminDashboardRecentListings'
import { LISTING_STATUS_COLOR, VISIBILITY_TONE_COLOR } from '@/modules/listings/lib/listingStatusTone'
import { formatCount, formatDateOnly, formatShortDate } from '@/lib/formatters'
import {
  listingPreviewHref,
  pendingListingsHref,
  pendingReportsHref,
  unassignedSupportHref,
  hiddenEligibleHref,
} from '@/modules/admin/dashboard/hrefs'
import type { AdminDashboardData, Adm11SegmentKey } from '@/modules/admin/dashboard/types'
import type { AdminTrends, TrendPoint, VisibleListingsByCity } from '@/modules/admin/dashboard/trends'
import type { ActivityFreshness, ActivityPoint } from '@/modules/analytics/activity/types'

export interface AdminDashboardViewProps {
  data: AdminDashboardData
  /** The platform activity series over the selected period (849). */
  activity: BlockResult<ActivityPoint[]>
  /** When the activity aggregate was last refreshed (849); a failed read fails the activity card. */
  freshness: BlockResult<ActivityFreshness>
  /** New listings / new users over the period, and the three queue sparklines (7 days). */
  trends: AdminTrends
  /** Visible listings by city (scope "Now"): top five plus Other. */
  cities: BlockResult<VisibleListingsByCity>
  locale: string
  /** The server's request time (ISO) — this view never reads the clock (791 boundary). */
  now: string
  period: PeriodSelection
  /** The resolved period's day count (7, 30, or a custom span) — for the "last N days" label. */
  periodDays: number
}

const CITY_OTHER_KEY = 'other'

const DONUT_SEGMENT_ORDER: Adm11SegmentKey[] = [
  'pending',
  'visible',
  'active_hidden',
  'inactive',
  'sold',
  'rented',
  'archived',
  'expired',
]

function donutColor(key: Adm11SegmentKey): string {
  switch (key) {
    case 'pending':
      return LISTING_STATUS_COLOR.pending
    case 'visible':
      return VISIBILITY_TONE_COLOR.positive
    case 'active_hidden':
      return VISIBILITY_TONE_COLOR.danger
    case 'inactive':
      return LISTING_STATUS_COLOR.inactive
    case 'sold':
      return LISTING_STATUS_COLOR.sold
    case 'rented':
      return LISTING_STATUS_COLOR.rented
    case 'archived':
      return LISTING_STATUS_COLOR.archived
    case 'expired':
      return LISTING_STATUS_COLOR.expired
  }
}

function sparklineOf(points: TrendPoint[]) {
  return points.map((p) => ({ date: p.date, value: p.count }))
}

/**
 * `/admin` operations dashboard (Task 853, spec v3.3 §6.1, §16.2, §17.2; rebuilt to the owner's
 * Lahomes/Omah references by Task 890 §2.1). Composes only the 843–846 + 889 canonical patterns and
 * 847's `AdminDashboardData`. The 791 server→client boundary lesson: this is the client boundary —
 * it receives only serializable data/strings/numbers from `src/app/admin/page.tsx` and owns every
 * callback itself (`onRetry` = `router.refresh()`, the period change = `router.replace`).
 */
export function AdminDashboardView({ data, activity, freshness, trends, cities, locale, now, period, periodDays }: AdminDashboardViewProps) {
  const t = useTranslations('admin.dashboard')
  const tl = useTranslations('listing')
  const trep = useTranslations('admin.reports')
  const tsup = useTranslations('admin.support')
  const tCommon = useTranslations('dashboard.common')
  const tp = useTranslations('dashboard.period')
  const theme = useMantineTheme()
  const router = useRouter()
  const pathname = usePathname()

  const onRetry = () => router.refresh()
  // Only `period`, `from` and `to` are written; every other query param is dropped (R9).
  const onPeriodChange = (next: PeriodSelection) =>
    router.replace(`${pathname}?${new URLSearchParams(serializePeriod(next)).toString()}`, { scroll: false })
  const fc = (n: number) => formatCount(n, locale)
  const shortDate = (d: string) => formatShortDate(d, locale)
  const absoluteLabel = (iso: string) => tiraneAbsoluteLabel(iso, locale)

  const periodLabels: DashboardPeriodControlLabels = {
    label7d: tp('label_7d'),
    label30d: tp('label_30d'),
    labelCustom: tp('label_custom'),
    rangePlaceholder: tp('range_placeholder'),
    scopeLabel: tp('scope_label'),
    errors: {
      end_after_yesterday: tp('error_end_after_yesterday'),
      start_after_end: tp('error_start_after_end'),
      longer_than_90_days: tp('error_longer_than_90_days'),
      invalid_date: tp('error_invalid_date'),
    },
  }
  const periodLabel =
    period.kind === 'custom'
      ? t('period_range', { from: formatDateOnly(period.from, locale), to: formatDateOnly(period.to, locale) })
      : t('period_days', { days: periodDays })

  // ── freshness (R8): with a stale aggregate the header reads the last refresh, never `now` ────
  const isStale = freshness.ok && freshness.data.stale
  const lastSuccessAt = freshness.ok ? freshness.data.lastSuccessAt : null
  const updatedAtIso = isStale && lastSuccessAt ? lastSuccessAt : data.refreshedAt
  const updatedAtLabel = `${tCommon('updated_at_prefix')} ${absoluteLabel(updatedAtIso)}`
  const staleTimeLabel = absoluteLabel(lastSuccessAt ?? now)

  const positiveIcon = <Check size={theme.other.iconSize.decorative} color={theme.colors.green[6]} aria-hidden="true" />

  // ── Row 1 — queue sparklines: new items per completed Tirane day, never a queue size (R4) ───
  function queueSparkline(result: BlockResult<TrendPoint[]>, ariaLabel: string) {
    return result.ok ? (
      <MantineDashboardSparkline
        data={sparklineOf(result.data)}
        color="brand.4"
        valueLabel={fc}
        dateLabel={shortDate}
        ariaLabel={ariaLabel}
      />
    ) : undefined
  }

  const adm02ReviewedLine =
    data.adm02.ok && data.adm02.data.reviewed > 0 ? (
      <Text size="xs" c="gray.5">
        {t('adm02_secondary', { count: data.adm02.data.reviewed })}
      </Text>
    ) : undefined

  const adm06AnomalyLine =
    data.adm06.ok && data.adm06.data.inProgressAnomaly > 0 ? (
      <Text size="xs" c="yellow.7">
        {t('adm06_anomaly', { count: data.adm06.data.inProgressAnomaly })}
      </Text>
    ) : undefined

  // ── Row 2 — platform activity (R5, R8) + ADM-11 donut + ADM-09 ──────────────────────────────
  const activityPoints = activity.ok ? activity.data : []
  const activityAllZero = activityPoints.every(
    (p) => p.recordedViews === 0 && p.whatsappClicks === 0 && p.listingInquirySubmissions === 0,
  )
  // A failed freshness or series read is an error, never a chart of zeros; a stale aggregate still
  // shows its data together with the stale caption (the card's own `stale` state).
  const activityFailed = !activity.ok || !freshness.ok
  const activityCardState = activityFailed ? 'error' : isStale ? 'stale' : 'ready'
  const activityChartState = activityFailed ? 'error' : activityAllZero ? 'empty' : 'ready'

  const activityChartData: DashboardLineChartDatum[] = activityPoints.map((p) => ({
    date: p.date,
    recordedViews: p.recordedViews,
    whatsappClicks: p.whatsappClicks,
    formInquiries: p.listingInquirySubmissions,
  }))
  // Three different events, three totals — never summed into one number (spec §3.1).
  const activityTotals: DashboardStatRow[] = [
    { label: t('activity_series_views'), count: activityPoints.reduce((sum, p) => sum + p.recordedViews, 0) },
    { label: t('activity_series_whatsapp'), count: activityPoints.reduce((sum, p) => sum + p.whatsappClicks, 0) },
    { label: t('activity_series_form'), count: activityPoints.reduce((sum, p) => sum + p.listingInquirySubmissions, 0) },
  ].map((row) => ({ ...row, displayCount: fc(row.count) }))

  const donutSegments: DashboardDonutSegment[] = data.adm11.ok
    ? DONUT_SEGMENT_ORDER.map((key) => {
        const segment = data.adm11.ok ? data.adm11.data.segments.find((s) => s.key === key) : undefined
        return {
          key,
          label: t(`donut_segment_${key}`),
          count: segment?.count ?? 0,
          color: donutColor(key),
        }
      })
    : []
  const donutAllZero = donutSegments.every((s) => s.count === 0)

  const adm09Rows: DashboardStatRow[] = data.adm09.ok
    ? [
        { label: t('adm09_no_expiry'), count: data.adm09.data.noExpiry, href: hiddenEligibleHref('no_expiry'), tone: 'warning' },
        { label: t('adm09_expired'), count: data.adm09.data.expired, href: hiddenEligibleHref('expired'), tone: 'warning' },
      ]
    : []

  // ── Row 3 — new listings / new users per day (R6) + visible listings by city ────────────────
  const trendsOk = trends.newListings.ok && trends.newUsers.ok
  const usersByDate = new Map((trends.newUsers.ok ? trends.newUsers.data : []).map((p) => [p.date, p.count]))
  const trendsData: DashboardBarChartDatum[] = trends.newListings.ok
    ? trends.newListings.data.map((p) => ({
        category: p.date,
        newListings: p.count,
        newUsers: usersByDate.get(p.date) ?? 0,
      }))
    : []

  const cityRows = cities.ok ? cities.data.cities : []
  const cityOther = cities.ok ? cities.data.other : 0
  const cityNames = new Map<string, string>([
    ...cityRows.map((c): [string, string] => [c.key, c.name]),
    [CITY_OTHER_KEY, t('cities_other')],
  ])
  const citiesData: DashboardBarChartDatum[] = [
    ...cityRows.map((c) => ({ category: c.key, visible: c.count })),
    ...(cityOther > 0 ? [{ category: CITY_OTHER_KEY, visible: cityOther }] : []),
  ]

  // ── Row 4 — work lists ──────────────────────────────────────────────────────────────────────
  const adm01Rows: DashboardWorkListRow[] = data.adm01.ok
    ? data.adm01.data.rows.map((row) => ({
        id: row.id,
        href: listingPreviewHref(row.id),
        primary: row.title,
        meta: [row.authorName, <RelativeTime key="t" date={row.createdAt} absoluteLabel={absoluteLabel(row.createdAt)} focusable={false} />],
        ctaLabel: t('worklist_cta_preview'),
      }))
    : []

  const adm02Rows: DashboardWorkListRow[] = data.adm02.ok
    ? data.adm02.data.rows.map((row) => ({
        id: row.id,
        href: pendingReportsHref(),
        primary: tl(`report_reason_${row.reason}` as Parameters<typeof tl>[0]),
        meta: [
          row.listingTitle ?? '—',
          <RelativeTime key="t" date={row.createdAt} absoluteLabel={absoluteLabel(row.createdAt)} focusable={false} />,
        ],
        status: { label: trep(`status_${row.status}` as Parameters<typeof trep>[0]), color: VISIBILITY_TONE_COLOR.warning },
        ctaLabel: t('worklist_cta_review'),
      }))
    : []

  const adm06Rows: DashboardWorkListRow[] = data.adm06.ok
    ? data.adm06.data.rows.map((row) => ({
        id: row.id,
        href: unassignedSupportHref(),
        primary: tsup(row.ticketType === 'user_complaint' ? 'type_user_complaint' : 'type_support'),
        meta: [<RelativeTime key="t" date={row.createdAt} absoluteLabel={absoluteLabel(row.createdAt)} focusable={false} />],
        status: {
          label: tsup(row.status === 'in_progress' ? 'support_status_in_progress' : 'support_status_open'),
          color: row.status === 'in_progress' ? VISIBILITY_TONE_COLOR.warning : VISIBILITY_TONE_COLOR.neutral,
        },
        ctaLabel: t('worklist_cta_review'),
      }))
    : []

  const locationRows: DashboardWorkListRow[] =
    data.locationRequests.ok
      ? data.locationRequests.data.rows.map((row) => ({
          id: row.id,
          href: `/admin/users/${row.id}`,
          primary: row.displayName,
          meta: [[row.city, row.region].filter(Boolean).join(', ')],
          ctaLabel: t('worklist_cta_review'),
        }))
      : []
  const showLocationRequests = !data.locationRequests.ok || data.locationRequests.data.count > 0

  return (
    <MantineDashboardGrid>
      <MantineDashboardHeader
        title={t('title')}
        subtitle={t('subtitle')}
        updatedAtLabel={updatedAtLabel}
        periodControl={<MantineDashboardPeriodControl value={period} onChange={onPeriodChange} now={now} labels={periodLabels} />}
      />

      {/* Row 1 — the "Visible now" hero (Omah "Total Properties") + the three queue KPIs with
          new-per-day mini-bars (Lahomes KPI row). The period control does not touch this row. */}
      <MantineDashboardGridTopRow wideFrom="xl">
        <MantineDashboardStatCard
          variant="accent"
          icon={<Eye size={theme.other.iconSize.decorative} aria-hidden="true" />}
          label={t('adm08_label')}
          value={data.adm08.ok ? fc(data.adm08.data.visible) : ''}
          secondaryLine={
            <Group gap="tight" wrap="nowrap">
              <Text size="xs" c="white" lineClamp={2}>
                {t('adm08_tooltip')}
              </Text>
              <MantineTooltip label={t('adm08_tooltip')}>
                <ActionIcon variant="transparent" c="white" size="sm" aria-label={t('adm08_tooltip_aria')}>
                  <Info size={theme.other.iconSize.compact} aria-hidden="true" />
                </ActionIcon>
              </MantineTooltip>
            </Group>
          }
          state={data.adm08.ok ? 'ready' : 'error'}
          errorMessage={t('error_generic')}
          retryLabel={tCommon('retry')}
          onRetry={onRetry}
          loadingAriaLabel={tCommon('loading_label')}
        />
        <MantineDashboardStatCard
          icon={<FileCheck2 size={theme.other.iconSize.decorative} aria-hidden="true" />}
          label={t('adm01_label')}
          value={data.adm01.ok ? fc(data.adm01.data.count) : ''}
          caption={t('adm01_caption')}
          chart={queueSparkline(trends.sparklines.listings, t('adm01_sparkline_aria'))}
          href={pendingListingsHref()}
          state={data.adm01.ok ? (data.adm01.data.count === 0 ? 'zero' : 'ready') : 'error'}
          zeroText={t('adm01_zero')}
          errorMessage={t('error_generic')}
          retryLabel={tCommon('retry')}
          onRetry={onRetry}
          loadingAriaLabel={tCommon('loading_label')}
        />
        <MantineDashboardStatCard
          icon={<Flag size={theme.other.iconSize.decorative} aria-hidden="true" />}
          label={t('adm02_label')}
          value={data.adm02.ok ? fc(data.adm02.data.pending) : ''}
          secondaryLine={adm02ReviewedLine}
          chart={queueSparkline(trends.sparklines.reports, t('adm02_sparkline_aria'))}
          href={pendingReportsHref()}
          state={data.adm02.ok ? (data.adm02.data.pending === 0 ? 'zero' : 'ready') : 'error'}
          zeroText={t('adm02_zero')}
          errorMessage={t('error_generic')}
          retryLabel={tCommon('retry')}
          onRetry={onRetry}
          loadingAriaLabel={tCommon('loading_label')}
        />
        <MantineDashboardStatCard
          icon={<LifeBuoy size={theme.other.iconSize.decorative} aria-hidden="true" />}
          label={t('adm06_label')}
          value={data.adm06.ok ? fc(data.adm06.data.unassigned) : ''}
          caption={t('adm06_caption')}
          secondaryLine={adm06AnomalyLine}
          chart={queueSparkline(trends.sparklines.tickets, t('adm06_sparkline_aria'))}
          href={unassignedSupportHref()}
          state={data.adm06.ok ? (data.adm06.data.unassigned === 0 ? 'zero' : 'ready') : 'error'}
          zeroText={t('adm06_zero')}
          errorMessage={t('error_generic')}
          retryLabel={tCommon('retry')}
          onRetry={onRetry}
          loadingAriaLabel={tCommon('loading_label')}
        />
      </MantineDashboardGridTopRow>

      {/* Row 2 — platform activity area chart + its totals strip (Lahomes "Sales Analytic"), and the
          listing-status donut over ADM-09 (Kamr "Rooms Availability"). */}
      <MantineDashboardGridSplit
        main={
          <MantineDashboardCard
            title={t('activity_card_title', { period: periodLabel })}
            state={activityCardState}
            errorMessage={t('error_generic')}
            retryLabel={tCommon('retry')}
            onRetry={onRetry}
            staleLabel={t('activity_stale_label')}
            staleTime={staleTimeLabel}
            loadingAriaLabel={tCommon('loading_label')}
            fill
            headerAction={
              <MantineTooltip
                label={
                  <Stack gap="micro">
                    <Text size="xs" c="white">
                      {t('activity_desc_views')}
                    </Text>
                    <Text size="xs" c="white">
                      {t('activity_desc_whatsapp')}
                    </Text>
                    <Text size="xs" c="white">
                      {t('activity_desc_form')}
                    </Text>
                  </Stack>
                }
              >
                <ActionIcon variant="subtle" size="sm" aria-label={t('activity_info_aria')}>
                  <Info size={theme.other.iconSize.compact} aria-hidden="true" />
                </ActionIcon>
              </MantineTooltip>
            }
          >
            <Stack gap="md">
              <MantineDashboardLineChart
                data={activityChartData}
                series={[
                  { key: 'recordedViews', label: t('activity_series_views'), color: theme.other.chartSeries.recordedViews },
                  { key: 'whatsappClicks', label: t('activity_series_whatsapp'), color: theme.other.chartSeries.whatsappClicks },
                  { key: 'formInquiries', label: t('activity_series_form'), color: theme.other.chartSeries.formInquiries },
                ]}
                mode="multi"
                dateLabel={shortDate}
                valueLabel={fc}
                state={activityChartState}
                emptyDescription={t('activity_empty')}
                allHiddenHint={t('activity_all_hidden')}
                errorText={t('error_generic')}
                retryLabel={tCommon('retry')}
                onRetry={onRetry}
                loadingAriaLabel={tCommon('loading_label')}
                ariaLabel={t('activity_card_title', { period: periodLabel })}
              />
              {activityChartState === 'ready' && <MantineDashboardStatRows rows={activityTotals} state="ready" />}
            </Stack>
          </MantineDashboardCard>
        }
        side={
          <Flex direction="column" gap={{ base: 'md', md: 'xl' }}>
            <MantineDashboardCard
              title={t('adm11_card_title')}
              scopeLabel={t('scope_now')}
              state={data.adm11.ok ? 'ready' : 'error'}
              errorMessage={data.adm11.ok ? undefined : t(`adm11_error_${data.adm11.error}`)}
              retryLabel={tCommon('retry')}
              onRetry={onRetry}
            >
              <MantineDashboardDonut
                segments={donutSegments}
                formatCount={fc}
                ariaLabel={t('adm11_aria')}
                state={donutAllZero ? 'empty' : 'ready'}
                emptyText={t('adm11_empty')}
              />
            </MantineDashboardCard>
            <MantineDashboardStatCard
              icon={<EyeOff size={theme.other.iconSize.decorative} aria-hidden="true" />}
              label={t('adm09_label')}
              value={data.adm09.ok ? fc(data.adm09.data.total) : ''}
              secondaryLine={
                data.adm09.ok ? (
                  <MantineDashboardStatRows
                    rows={adm09Rows}
                    allZeroState={{ icon: positiveIcon, text: t('adm09_breakdown_zero') }}
                    state="ready"
                  />
                ) : undefined
              }
              state={data.adm09.ok ? 'ready' : 'error'}
              errorMessage={t('error_generic')}
              retryLabel={tCommon('retry')}
              onRetry={onRetry}
              loadingAriaLabel={tCommon('loading_label')}
            />
          </Flex>
        }
      />

      {/* Row 3 — two different events per day, side by side and never stacked (Lahomes chart row),
          and the visible listings by city (Lahomes "Sessions by Country"; scope "Now"). */}
      <MantineDashboardGridSplit
        main={
          <MantineDashboardCard
            title={t('trends_card_title', { period: periodLabel })}
            state={trendsOk ? 'ready' : 'error'}
            errorMessage={t('error_generic')}
            retryLabel={tCommon('retry')}
            onRetry={onRetry}
            fill
          >
            <MantineDashboardBarChart
              data={trendsData}
              series={[
                { key: 'newListings', label: t('trends_series_listings'), color: 'brand.4' },
                { key: 'newUsers', label: t('trends_series_users'), color: 'gray.4' },
              ]}
              categoryLabel={shortDate}
              valueLabel={fc}
              state="ready"
              allHiddenHint={t('activity_all_hidden')}
              ariaLabel={t('trends_card_title', { period: periodLabel })}
              stacked={false}
            />
          </MantineDashboardCard>
        }
        side={
          <MantineDashboardCard
            title={t('cities_card_title')}
            scopeLabel={t('scope_now')}
            state={cities.ok ? 'ready' : 'error'}
            errorMessage={t('error_generic')}
            retryLabel={tCommon('retry')}
            onRetry={onRetry}
            fill
          >
            <MantineDashboardBarChart
              data={citiesData}
              series={[{ key: 'visible', label: t('cities_series'), color: 'brand.4' }]}
              categoryLabel={(category) => cityNames.get(category) ?? category}
              valueLabel={fc}
              state={citiesData.length === 0 ? 'empty' : 'ready'}
              emptyDescription={t('cities_empty')}
              ariaLabel={t('cities_card_title')}
              horizontal
            />
          </MantineDashboardCard>
        }
      />

      {/* Row 4 — the three work lists (ADM-01 first) + conditional location requests; at most 2-up, so the
          work-list text never clips in a narrow card. */}
      <MantineDashboardGridTopRow maxColumns={2}>
        <MantineDashboardCard
          title={t('adm01_card_title')}
          state={data.adm01.ok ? 'ready' : 'error'}
          errorMessage={t('error_generic')}
          retryLabel={tCommon('retry')}
          onRetry={onRetry}
        >
          <MantineDashboardWorkList
            rows={adm01Rows}
            maxRows={5}
            footer={{ label: t('adm01_view_queue'), href: pendingListingsHref() }}
            state={adm01Rows.length === 0 ? 'empty' : 'ready'}
            emptyIcon={positiveIcon}
            emptyText={t('adm01_zero')}
          />
        </MantineDashboardCard>

        <MantineDashboardCard
          title={t('adm02_list_title')}
          state={data.adm02.ok ? 'ready' : 'error'}
          errorMessage={t('error_generic')}
          retryLabel={tCommon('retry')}
          onRetry={onRetry}
        >
          <MantineDashboardWorkList
            rows={adm02Rows}
            maxRows={5}
            footer={{ label: t('adm02_view_all'), href: pendingReportsHref() }}
            state={adm02Rows.length === 0 ? 'empty' : 'ready'}
            emptyIcon={positiveIcon}
            emptyText={t('adm02_zero')}
          />
        </MantineDashboardCard>

        <MantineDashboardCard
          title={t('adm06_list_title')}
          state={data.adm06.ok ? 'ready' : 'error'}
          errorMessage={t('error_generic')}
          retryLabel={tCommon('retry')}
          onRetry={onRetry}
        >
          <MantineDashboardWorkList
            rows={adm06Rows}
            maxRows={5}
            footer={{ label: t('adm06_view_all'), href: unassignedSupportHref() }}
            state={adm06Rows.length === 0 ? 'empty' : 'ready'}
            emptyIcon={positiveIcon}
            emptyText={t('adm06_zero')}
          />
        </MantineDashboardCard>

        {showLocationRequests && (
          <MantineDashboardCard
            title={t('location_requests_title')}
            state={data.locationRequests.ok ? 'ready' : 'error'}
            errorMessage={t('error_generic')}
            retryLabel={tCommon('retry')}
            onRetry={onRetry}
          >
            <MantineDashboardWorkList
              rows={locationRows}
              maxRows={5}
              footer={{ label: t('location_requests_view_all'), href: '/admin/users?location_request=1' }}
              state={locationRows.length === 0 ? 'empty' : 'ready'}
              emptyIcon={positiveIcon}
              emptyText={t('location_requests_zero')}
            />
          </MantineDashboardCard>
        )}
      </MantineDashboardGridTopRow>

      {/* Row 5 — recent listings, migrated (agent-contract 16d) */}
      <MantineDashboardGridFull>
        <MantineDashboardCard
          title={t('recent_listings_title')}
          scopeLabel={t('scope_now')}
          headerAction={
            <Button component={Link} href="/admin/listings" variant="transparent" size="sm">
              {t('recent_listings_all')}
            </Button>
          }
          state={data.recentListings.ok ? 'ready' : 'error'}
          errorMessage={t('error_generic')}
          retryLabel={tCommon('retry')}
          onRetry={onRetry}
        >
          {data.recentListings.ok && (
            <AdminDashboardRecentListings
              listings={data.recentListings.data}
              locale={locale}
              emptyText={t('recent_listings_empty')}
            />
          )}
        </MantineDashboardCard>
      </MantineDashboardGridFull>
    </MantineDashboardGrid>
  )
}
