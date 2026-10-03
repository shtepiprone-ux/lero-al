'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ActionIcon, Badge, Box, Button, Center, Flex, Group, Stack, Text, useMantineTheme } from '@mantine/core'
import { Activity, CalendarClock, Check, Eye, Info, Mail, MessageCircle, MessageSquare } from 'lucide-react'
import { MantineDashboardHeader } from '@/design-system/mantine/patterns/MantineDashboardHeader'
import { MantineDashboardPeriodControl, type DashboardPeriodControlLabels } from '@/design-system/mantine/patterns/MantineDashboardPeriodControl'
import {
  MantineDashboardGrid,
  MantineDashboardGridTopRow,
  MantineDashboardGridSplit,
  MantineDashboardGridFull,
} from '@/design-system/mantine/patterns/MantineDashboardGrid'
import { MantineDashboardCard, type DashboardCardState } from '@/design-system/mantine/patterns/MantineDashboardCard'
import { MantineDashboardStatCard } from '@/design-system/mantine/patterns/MantineDashboardStatCard'
import { MantineDashboardStatRows, type DashboardStatRow } from '@/design-system/mantine/patterns/MantineDashboardStatRows'
import { MantineDashboardLineChart, type DashboardLineChartDatum } from '@/design-system/mantine/patterns/MantineDashboardLineChart'
import { MantineDashboardBarChart, type DashboardBarChartDatum } from '@/design-system/mantine/patterns/MantineDashboardBarChart'
import { MantineDashboardDonut, type DashboardDonutSegment } from '@/design-system/mantine/patterns/MantineDashboardDonut'
import { MantineDashboardSparkline, type DashboardSparklineDatum } from '@/design-system/mantine/patterns/MantineDashboardSparkline'
import { MantineDataTableToCards, type TableColumn, type CardConfig } from '@/design-system/mantine/patterns/MantineDataTableToCards'
import { MantinePagination } from '@/design-system/mantine/patterns/MantinePagination'
import { MantineSelect } from '@/design-system/mantine/patterns/MantineSelect'
import { MantineTooltip } from '@/design-system/mantine/patterns/MantineTooltip'
import { MantineEmptyLoadingErrorState } from '@/design-system/mantine/patterns/MantineEmptyLoadingErrorState'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { AppImage } from '@/design-system/media/AppImage'
import { getListingStatusLabel, LISTING_STATUS_CODES } from '@/lib/i18n/listingStatusLabel'
import { LISTING_STATUS_COLOR, VISIBILITY_TONE_COLOR } from '@/modules/listings/lib/listingStatusTone'
import { formatCount, formatDate, formatDateOnly, formatShortDate } from '@/lib/formatters'
import { tiraneAbsoluteLabel, compareToPrevious, serializePeriod, type PeriodSelection } from '@/lib/dashboard/period'
import { agentCardHref } from '@/modules/cabinet/statistics/hrefs'
import { AGT10_SORT_TOKENS, sortTokenOf, resolveSortToken, serializeAgt10Table } from '@/modules/cabinet/statistics/tableParams'
import type { AgentStatisticsData, Agt10Row, Agt10Table } from '@/modules/cabinet/statistics/types'
import type { ActivityByListingRow, ActivityFreshness, ActivityPoint } from '@/modules/analytics/activity/types'
import type { TopListingRow } from '@/modules/cabinet/statistics/topListings'
import type { PortfolioSegments } from '@/modules/cabinet/statistics/portfolio'
import { activityStates } from '@/modules/cabinet/statistics/activityState'
import type { BlockResult } from '@/lib/dashboard/blockResult'
import type { ListingStatus, ListingType } from '@/types/database'

export interface AgentStatisticsViewProps {
  data: AgentStatisticsData
  /** Task 891 (R1/R3) — the owner's activity aggregate for the current and previous period; every
   * KPI mini-chart value/comparison and the activity area chart are derived from these, never a
   * second, separate read. */
  activitySeriesCurrent: BlockResult<ActivityPoint[]>
  activitySeriesPrevious: BlockResult<ActivityPoint[]>
  /** Task 891 (R10) — when stale, the header and the activity card show the last successful refresh
   * time instead of treating a stale value as current; when failed, the activity chart and every
   * KPI mini-chart error instead of a false `0`. */
  freshness: BlockResult<ActivityFreshness>
  /** Task 891 (R5) — the already-ranked top-5-by-views rows (page.tsx: `rankTopListings`). */
  topListings: BlockResult<TopListingRow[]>
  /** Task 891 (R6) — the already-computed portfolio-visibility donut segments (page.tsx:
   * `portfolioSegments`). */
  portfolio: BlockResult<PortfolioSegments>
  locale: string
  /** The server's request time (ISO) — this view never reads the clock (791 boundary: serializable
   * props only). Drives both the "updated at" label and the period control's "yesterday" bound. */
  now: string
  period: PeriodSelection
  /** The resolved period's day count (7, 30, or a custom span) — for the "last N days" label. */
  periodDays: number
  table: Agt10Table
}

type ActivityMetric = keyof Pick<ActivityByListingRow, 'recordedViews' | 'whatsappClicks' | 'listingInquirySubmissions'>

function sumMetric(points: ActivityPoint[], metric: ActivityMetric): number {
  return points.reduce((sum, p) => sum + p[metric], 0)
}

function sparklineOf(points: ActivityPoint[], metric: ActivityMetric): DashboardSparklineDatum[] {
  return points.map((p) => ({ date: p.date, value: p[metric] }))
}

/**
 * `/{locale}/cabinet/statistics` — the agent dashboard (Task 854, rebuilt to the owner's chart
 * references by Task 891 §2.1: KPI mini-charts, the activity area chart, the top-listings bar chart
 * and the portfolio donut). Composes only the 843-846/845/889 canonical patterns and 848/849's data;
 * the 791 server→client boundary lesson: this is the client boundary — it receives only serializable
 * data/strings/numbers from `src/app/[locale]/cabinet/statistics/page.tsx` and owns every callback
 * itself (period/table changes and pagination all become a `router.replace`, never a function prop
 * crossing the server/client boundary).
 */
export function AgentStatisticsView({
  data,
  activitySeriesCurrent,
  activitySeriesPrevious,
  freshness,
  topListings,
  portfolio,
  locale,
  now,
  period,
  periodDays,
  table,
}: AgentStatisticsViewProps) {
  const t = useTranslations('cabinet.statistics')
  const tl = useTranslations('listing')
  const tc = useTranslations('cabinet')
  const tp = useTranslations('dashboard.period')
  const tCommon = useTranslations('dashboard.common')
  const theme = useMantineTheme()
  const router = useRouter()
  const pathname = usePathname()

  const fc = (n: number) => formatCount(n, locale)
  const absoluteLabel = (iso: string) => tiraneAbsoluteLabel(iso, locale)
  const positiveIcon = <Check size={theme.other.iconSize.decorative} color={theme.colors.green[6]} aria-hidden="true" />

  function pushParams(nextPeriod: PeriodSelection, nextTable: Agt10Table) {
    const params = new URLSearchParams({ ...serializePeriod(nextPeriod), ...serializeAgt10Table(nextTable) })
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }
  const onRetry = () => router.refresh()
  const onPeriodChange = (next: PeriodSelection) => pushParams(next, table)
  const onTableChange = (patch: Partial<Agt10Table>) => pushParams(period, { ...table, ...patch, page: patch.page ?? 1 })
  const onPageChange = (page: number) => pushParams(period, { ...table, page })

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

  // ── freshness / staleness (R10) and activity render state (review 1, F2/F3) ────────────────
  const isStale = freshness.ok && freshness.data.stale
  const lastSuccessAt = freshness.ok ? freshness.data.lastSuccessAt : null
  // With a stale aggregate the "updated at" reads the last successful refresh, never `now` — `now`
  // would claim the (stale) activity numbers are current.
  const updatedAtIso = isStale && lastSuccessAt ? lastSuccessAt : now
  const updatedAtLabel = `${tCommon('updated_at_prefix')} ${absoluteLabel(updatedAtIso)}`
  const staleTimeLabel = lastSuccessAt ? absoluteLabel(lastSuccessAt) : absoluteLabel(now)
  const headerStale = isStale ? { label: t('freshness_stale_badge', { time: staleTimeLabel }) } : undefined

  // `activityStates` (review 1, F3): a failed freshness, current- OR previous-period read all put
  // the three KPI cards into `error` (R2 — every series R1 fetches, never a false "no base"); the
  // chart depends on freshness/current only and additionally distinguishes a genuine all-zero
  // period (F2) from a stale one.
  const { kpiState, cardState, chartState } = activityStates(freshness, activitySeriesCurrent, activitySeriesPrevious)
  const seriesCurrent = activitySeriesCurrent.ok ? activitySeriesCurrent.data : []
  const seriesPrevious = activitySeriesPrevious.ok ? activitySeriesPrevious.data : []

  function comparisonNode(current: number, previous: number): ReactNode {
    const cmp = compareToPrevious(current, previous)
    if (cmp.kind === 'no_base') {
      return (
        <Text size="xs" c="gray.5">
          {t('agt05_no_base')}
        </Text>
      )
    }
    const delta = cmp.delta > 0 ? `+${cmp.delta}` : `${cmp.delta}`
    return (
      <Text size="xs" c="gray.5">
        {t('agt05_comparison', { delta, days: periodDays })}
      </Text>
    )
  }

  // Review 5 (F11): the info icon moves out of `secondaryLine` — that slot renders inside the
  // value/label text stack, so its extra line lifted this card's value/sparkline above the other
  // two (`rev3/measure.out.json` → `ac23`: `valueBottom` 288/288/259). `comparison` renders in the
  // card's own top-right `Group`, alongside the icon+label row, so it never touches value height.
  const agt05InfoIcon = (
    <MantineTooltip label={t('agt05_tooltip')}>
      <ActionIcon variant="subtle" size="sm" aria-label={t('agt05_tooltip_aria')}>
        <Info size={theme.other.iconSize.compact} aria-hidden="true" />
      </ActionIcon>
    </MantineTooltip>
  )

  const periodLabel =
    period.kind === 'custom'
      ? t('agt05_period_range', { from: formatDateOnly(period.from, locale), to: formatDateOnly(period.to, locale) })
      : t('agt05_period_days', { days: periodDays })

  const viewsSum = sumMetric(seriesCurrent, 'recordedViews')
  const whatsappSum = sumMetric(seriesCurrent, 'whatsappClicks')
  const formsSum = sumMetric(seriesCurrent, 'listingInquirySubmissions')
  const viewsPrevSum = sumMetric(seriesPrevious, 'recordedViews')
  const whatsappPrevSum = sumMetric(seriesPrevious, 'whatsappClicks')
  const formsPrevSum = sumMetric(seriesPrevious, 'listingInquirySubmissions')

  // ── AGT-01 (needs my action) ─────────────────────────────────────────────────────────────────
  const agt01Rows: DashboardStatRow[] = data.agt01.ok
    ? [
        { label: t('agt01_pending'), count: data.agt01.data.pending, href: agentCardHref(locale, 'pending'), tone: 'warning' },
        { label: t('agt01_hidden'), count: data.agt01.data.hidden, href: agentCardHref(locale, 'hidden'), tone: 'danger' },
        { label: t('agt01_expiring'), count: data.agt01.data.expiring, href: agentCardHref(locale, 'expiring'), tone: 'warning' },
      ]
    : []

  // ── AGT-02 inventory rows (moved under the portfolio donut, §2.1 row 3) ────────────────────
  const agt02Rows: DashboardStatRow[] = data.agt02.ok
    ? [
        { label: t('agt02_pending'), count: data.agt02.data.pending, href: agentCardHref(locale, 'pending') },
        { label: t('agt02_inactive'), count: data.agt02.data.inactive, href: agentCardHref(locale, 'inactive') },
        { label: t('agt02_sold'), count: data.agt02.data.sold, href: agentCardHref(locale, 'sold') },
        { label: t('agt02_rented'), count: data.agt02.data.rented, href: agentCardHref(locale, 'rented') },
      ]
    : []

  // ── portfolio donut segments (R6) ───────────────────────────────────────────────────────────
  const portfolioState: DashboardCardState = portfolio.ok && data.agt02.ok ? 'ready' : 'error'
  const donutSegments: DashboardDonutSegment[] = portfolio.ok
    ? [
        { key: 'visible', label: t('portfolio_segment_visible'), count: portfolio.data.visible, color: VISIBILITY_TONE_COLOR.positive },
        { key: 'needs_action', label: t('portfolio_segment_needs_action'), count: portfolio.data.needsAction, color: 'yellow' },
        { key: 'not_visible', label: t('portfolio_segment_not_visible'), count: portfolio.data.notVisible, color: VISIBILITY_TONE_COLOR.danger },
      ]
    : []

  // ── top listings by views (R5) ──────────────────────────────────────────────────────────────
  const topListingsRows = topListings.ok ? topListings.data : []
  const topListingsData: DashboardBarChartDatum[] = topListingsRows.map((row) => ({
    category: row.listingId,
    recordedViews: row.recordedViews,
  }))
  const topListingsTitleByCategory = new Map(topListingsRows.map((row) => [row.listingId, row.title]))
  const topListingsState: 'ready' | 'empty' | 'error' = !topListings.ok ? 'error' : topListingsRows.length === 0 ? 'empty' : 'ready'

  // ── activity area chart (R3) ────────────────────────────────────────────────────────────────
  const activityChartData: DashboardLineChartDatum[] = seriesCurrent.map((p) => ({
    date: p.date,
    recordedViews: p.recordedViews,
    whatsappClicks: p.whatsappClicks,
    formInquiries: p.listingInquirySubmissions,
  }))

  // ── AGT-10 filters/sort data ─────────────────────────────────────────────────────────────────
  const statusData = [
    { value: '', label: t('agt10_filter_status_all') },
    ...LISTING_STATUS_CODES.map((status) => ({ value: status, label: getListingStatusLabel(status, tl) })),
  ]
  const visibilityData = [
    { value: '', label: t('agt10_filter_visibility_all') },
    { value: 'visible', label: t('agt10_visibility_visible') },
    { value: 'hidden', label: t('agt10_visibility_hidden') },
  ]
  const typeData = [
    { value: '', label: t('agt10_filter_type_all') },
    { value: 'sale', label: tl('sale') },
    { value: 'rent', label: tl('rent') },
  ]
  const sortData = Object.keys(AGT10_SORT_TOKENS).map((token) => ({
    value: token,
    label: t(`agt10_sort_${token}` as Parameters<typeof t>[0]),
  }))
  const currentSortToken = sortTokenOf(table.sort, table.direction)

  function thumbnail(row: Agt10Row): ReactNode {
    return (
      <Box w={theme.other.boxSize.dashboardListingThumb} h={theme.other.boxSize.dashboardListingThumb} bg="gray.1" flex="0 0 auto">
        <AppImage variant="listing-thumb" src={row.coverUrl} alt={row.title} />
      </Box>
    )
  }

  function titleLink(row: Agt10Row): ReactNode {
    return (
      <Text component={Link} href={`/${locale}/listings/${row.slug}`} size="sm" fw={500} c="gray.8" lineClamp={2}>
        {row.title}
      </Text>
    )
  }

  function statusBadge(row: Agt10Row): ReactNode {
    return (
      <Badge color={LISTING_STATUS_COLOR[row.status]} variant="light" size="sm">
        {getListingStatusLabel(row.status, tl)}
      </Badge>
    )
  }

  function visibilityBadge(row: Agt10Row): ReactNode {
    return (
      <Badge color={row.visible ? VISIBILITY_TONE_COLOR.positive : VISIBILITY_TONE_COLOR.danger} variant="light" size="sm">
        {row.visible ? t('agt10_visibility_visible') : t('agt10_visibility_hidden')}
      </Badge>
    )
  }

  function expiresCell(row: Agt10Row): ReactNode {
    if (!row.expiresAt) return <Text size="sm" c="gray.7">—</Text>
    return (
      <Text size="sm" c="gray.7">
        {formatDate(row.expiresAt, locale)}{' '}
        <Text component="span" size="xs" c="gray.5">
          (<RelativeTime date={row.expiresAt} baseDate={now} absoluteLabel={absoluteLabel(row.expiresAt)} focusable={false} />)
        </Text>
      </Text>
    )
  }

  function viewsCell(row: Agt10Row): ReactNode {
    return <Text size="sm" c="gray.7">{fc(row.recordedViews)}</Text>
  }

  function whatsappCell(row: Agt10Row): ReactNode {
    return <Text size="sm" c="gray.7">{fc(row.whatsappClicks)}</Text>
  }

  function formInquiriesCell(row: Agt10Row): ReactNode {
    return <Text size="sm" c="gray.7">{fc(row.formInquiries)}</Text>
  }

  function lastActivityCell(row: Agt10Row): ReactNode {
    if (!row.lastActivityDate) return <Text size="sm" c="gray.7">—</Text>
    const label = formatDateOnly(row.lastActivityDate, locale)
    return (
      <Text size="sm" c="gray.7">
        {label}{' '}
        <Text component="span" size="xs" c="gray.5">
          (<RelativeTime date={row.lastActivityDate} baseDate={now} absoluteLabel={label} focusable={false} />)
        </Text>
      </Text>
    )
  }

  function editAction(row: Agt10Row): ReactNode {
    return (
      <Button component={Link} href={`/${locale}/listings/${row.slug}/edit`} variant="subtle" size="xs">
        {t('agt10_edit')}
      </Button>
    )
  }

  // §7.3 (a)/(b), Task 857 R31/R33 + the §19.1 owner decision (cards below 1024): the title wraps at the table-title
  // token width (thumbnail + two-line link); status + visibility, expiry + last activity, and the three counts each
  // stack in one cell; every other column stays `nowrap`. The card keeps every value separately labelled.
  const columns: TableColumn<Agt10Row>[] = [
    { key: 'title', label: t('agt10_col_title'), width: theme.other.layout.tableTitleColumnWidth, wrap: true, render: (row) => <Group gap="sm" wrap="nowrap">{thumbnail(row)}{titleLink(row)}</Group> },
    {
      key: 'status',
      label: t('agt10_col_status'),
      render: (row) => (
        <Stack gap="tight" align="flex-start">
          {statusBadge(row)}
          {visibilityBadge(row)}
        </Stack>
      ),
    },
    {
      key: 'dates',
      label: t('agt10_col_dates'),
      render: (row) => (
        <Stack gap="tight" align="flex-start">
          <Group gap="tight" wrap="nowrap" role="group" aria-label={t('agt10_col_expires')}>
            <CalendarClock size={theme.other.iconSize.badge} aria-hidden="true" />
            {expiresCell(row)}
          </Group>
          <Group gap="tight" wrap="nowrap" role="group" aria-label={t('agt10_col_activity')}>
            <Activity size={theme.other.iconSize.badge} aria-hidden="true" />
            {lastActivityCell(row)}
          </Group>
        </Stack>
      ),
    },
    {
      key: 'counts',
      label: t('agt10_col_activity_counts'),
      align: 'right',
      render: (row) => (
        <Stack gap="tight" align="flex-end">
          <Group gap="tight" wrap="nowrap" role="group" aria-label={t('agt10_col_views')}>
            <Eye size={theme.other.iconSize.badge} aria-hidden="true" />
            {viewsCell(row)}
          </Group>
          <Group gap="tight" wrap="nowrap" role="group" aria-label={t('agt10_col_whatsapp')}>
            <MessageCircle size={theme.other.iconSize.badge} aria-hidden="true" />
            {whatsappCell(row)}
          </Group>
          <Group gap="tight" wrap="nowrap" role="group" aria-label={t('agt10_col_inquiries')}>
            <Mail size={theme.other.iconSize.badge} aria-hidden="true" />
            {formInquiriesCell(row)}
          </Group>
        </Stack>
      ),
    },
    { key: 'actions', label: t('agt10_col_actions'), align: 'right', render: editAction },
  ]

  const card: CardConfig<Agt10Row> = {
    actions: editAction,
    avatar: thumbnail,
    title: titleLink,
    badge: statusBadge,
    meta: [
      { label: t('agt10_col_visibility'), value: visibilityBadge },
      { label: t('agt10_col_expires'), value: expiresCell },
      { label: t('agt10_col_views'), value: viewsCell },
      { label: t('agt10_col_whatsapp'), value: whatsappCell },
      { label: t('agt10_col_inquiries'), value: formInquiriesCell },
      { label: t('agt10_col_activity'), value: lastActivityCell },
    ],
  }

  const agt10Total = data.agt10.ok ? data.agt10.data.total : 0
  const totalPages = data.agt10.ok ? Math.max(1, Math.ceil(data.agt10.data.total / data.agt10.data.pageSize)) : 1
  // R11 (854 review 1, F1): a filter matching nothing is not "no listings yet" — the agent has
  // listings, just none matching. Keep the filter row and use the pattern's own empty path with a
  // different message instead of replacing the whole card with the Add-listing CTA.
  const filtersActive = Boolean(table.status || table.visibility || table.listingType)
  const showAgt10Empty = data.agt10.ok && agt10Total === 0 && !filtersActive

  return (
    <MantineDashboardGrid>
      <MantineDashboardHeader
        title={t('title')}
        subtitle={t('subtitle')}
        updatedAtLabel={updatedAtLabel}
        stale={headerStale}
        periodControl={<MantineDashboardPeriodControl value={period} onChange={onPeriodChange} now={now} labels={periodLabels} />}
      />

      {/* Row 1 — three activity-aggregate KPI mini-charts (Lahomes KPI row / Task 889). The AGT-02
          hero moves to row 2's side column with the inventory sub-stats (review 4, R18) — the `lg`
          3-column track gives each remaining card room for its chart beside the text. */}
      <MantineDashboardGridTopRow>
        <MantineDashboardStatCard
          icon={<Eye size={theme.other.iconSize.decorative} aria-hidden="true" />}
          label={t('agt03_card_title', { period: periodLabel })}
          value={kpiState === 'ready' ? fc(viewsSum) : ''}
          comparison={kpiState === 'ready' ? comparisonNode(viewsSum, viewsPrevSum) : undefined}
          chart={
            <MantineDashboardSparkline
              data={sparklineOf(seriesCurrent, 'recordedViews')}
              color={theme.other.chartSeries.recordedViews}
              valueLabel={fc}
              dateLabel={(d) => formatShortDate(d, locale)}
              ariaLabel={t('agt03_sparkline_aria')}
            />
          }
          state={kpiState}
          errorMessage={t('error_generic')}
          retryLabel={tCommon('retry')}
          onRetry={onRetry}
          loadingAriaLabel={tCommon('loading_label')}
        />

        <MantineDashboardStatCard
          icon={<MessageCircle size={theme.other.iconSize.decorative} aria-hidden="true" />}
          label={t('whatsapp_card_title', { period: periodLabel })}
          value={kpiState === 'ready' ? fc(whatsappSum) : ''}
          comparison={kpiState === 'ready' ? comparisonNode(whatsappSum, whatsappPrevSum) : undefined}
          chart={
            <MantineDashboardSparkline
              data={sparklineOf(seriesCurrent, 'whatsappClicks')}
              color={theme.other.chartSeries.whatsappClicks}
              valueLabel={fc}
              dateLabel={(d) => formatShortDate(d, locale)}
              ariaLabel={t('whatsapp_sparkline_aria')}
            />
          }
          state={kpiState}
          errorMessage={t('error_generic')}
          retryLabel={tCommon('retry')}
          onRetry={onRetry}
          loadingAriaLabel={tCommon('loading_label')}
        />

        <MantineDashboardStatCard
          icon={<MessageSquare size={theme.other.iconSize.decorative} aria-hidden="true" />}
          label={t('agt05_card_title', { period: periodLabel })}
          value={kpiState === 'ready' ? fc(formsSum) : ''}
          comparison={
            kpiState === 'ready' ? (
              <Group gap="xs" wrap="nowrap">
                {comparisonNode(formsSum, formsPrevSum)}
                {agt05InfoIcon}
              </Group>
            ) : (
              agt05InfoIcon
            )
          }
          chart={
            <MantineDashboardSparkline
              data={sparklineOf(seriesCurrent, 'listingInquirySubmissions')}
              color={theme.other.chartSeries.formInquiries}
              valueLabel={fc}
              dateLabel={(d) => formatShortDate(d, locale)}
              ariaLabel={t('agt05_sparkline_aria')}
            />
          }
          state={kpiState}
          errorMessage={t('error_generic')}
          retryLabel={tCommon('retry')}
          onRetry={onRetry}
          loadingAriaLabel={tCommon('loading_label')}
        />
      </MantineDashboardGridTopRow>

      {/* Row 2 — the activity area chart (Kamr "Guest Activity") + the hero/AGT-01 side column
          (review 4, R18-R20). The three series descriptions move into the header info tooltip
          (R19) so the card is compact; the hero keeps its own content height while AGT-01 fills
          the rest of the `h="100%"` side column, so this row and row 3 end level with row 3. */}
      <MantineDashboardGridSplit
        main={
          <MantineDashboardCard
            title={t('activity_card_title', { period: periodLabel })}
            state={cardState}
            errorMessage={t('error_generic')}
            retryLabel={tCommon('retry')}
            onRetry={onRetry}
            staleLabel={t('freshness_stale_label')}
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
                <ActionIcon variant="subtle" size="sm" aria-label={t('agt05_tooltip_aria')}>
                  <Info size={theme.other.iconSize.compact} aria-hidden="true" />
                </ActionIcon>
              </MantineTooltip>
            }
          >
            <MantineDashboardLineChart
              data={activityChartData}
              series={[
                { key: 'recordedViews', label: t('activity_series_views'), color: theme.other.chartSeries.recordedViews },
                { key: 'whatsappClicks', label: t('activity_series_whatsapp'), color: theme.other.chartSeries.whatsappClicks },
                { key: 'formInquiries', label: t('activity_series_form'), color: theme.other.chartSeries.formInquiries },
              ]}
              mode="multi"
              dateLabel={(d) => formatShortDate(d, locale)}
              valueLabel={fc}
              state={chartState}
              emptyDescription={t('activity_empty')}
              allHiddenHint={t('activity_all_hidden')}
              ariaLabel={t('activity_card_title', { period: periodLabel })}
            />
          </MantineDashboardCard>
        }
        side={
          <Stack h="100%">
            <MantineDashboardStatCard
              icon={<Eye size={theme.other.iconSize.decorative} aria-hidden="true" />}
              label={t('agt02_label')}
              value={data.agt02.ok ? fc(data.agt02.data.visible) : ''}
              state={data.agt02.ok ? 'ready' : 'error'}
              errorMessage={t('error_generic')}
              retryLabel={tCommon('retry')}
              onRetry={onRetry}
              loadingAriaLabel={tCommon('loading_label')}
              variant="accent"
              substats={agt02Rows.map((row, i) => ({ key: `agt02-substat-${i}`, label: row.label, value: fc(row.count), href: row.href }))}
            />
            {/* Review 5 (F14): the hero above has no `fill`, so its height stays content-driven —
                but a plain flex child still shrinks to fit a height-constrained column once Card's
                own `overflow: hidden` removes the browser's automatic min-height protection
                (`evidence/task891/review5/custom-closed-1440.png`: a card height of 186 against a
                content height of 254, clipping "Sold …"/"Rented …"). Explicit `flex={1}` on this
                `Box` makes AGT-01 absorb all the column's remaining space instead, so the hero
                never has to shrink below its own content to make room. */}
            <Box flex={1}>
              <MantineDashboardCard
                title={t('agt01_card_title')}
                scopeLabel={t('scope_now')}
                state={data.agt01.ok ? 'ready' : 'error'}
                errorMessage={t('error_generic')}
                retryLabel={tCommon('retry')}
                onRetry={onRetry}
                fill
              >
                <MantineDashboardStatRows
                  rows={agt01Rows}
                  allZeroState={{ icon: positiveIcon, text: t('agt01_zero') }}
                  state="ready"
                />
              </MantineDashboardCard>
            </Box>
          </Stack>
        }
      />

      {/* Row 3 — top listings by views (Lahomes-style bars) + the centred portfolio donut, whose
          legend now carries each segment's count (review 4, R20-R21). Both cards fill the row. */}
      <MantineDashboardGridSplit
        main={
          <MantineDashboardCard
            title={t('top_listings_card_title', { period: periodLabel })}
            state={topListingsState === 'error' ? 'error' : 'ready'}
            errorMessage={t('error_generic')}
            retryLabel={tCommon('retry')}
            onRetry={onRetry}
            fill
          >
            <MantineDashboardBarChart
              data={topListingsData}
              series={[{ key: 'recordedViews', label: t('activity_series_views'), color: theme.other.chartSeries.recordedViews }]}
              categoryLabel={(category) => topListingsTitleByCategory.get(category) ?? category}
              valueLabel={fc}
              state={topListingsState}
              emptyDescription={t('top_listings_empty')}
              errorText={t('error_generic')}
              retryLabel={tCommon('retry')}
              onRetry={onRetry}
              loadingAriaLabel={tCommon('loading_label')}
              ariaLabel={t('top_listings_card_title', { period: periodLabel })}
              horizontal
            />
          </MantineDashboardCard>
        }
        side={
          <MantineDashboardCard
            title={t('portfolio_card_title')}
            state={portfolioState}
            errorMessage={t('error_generic')}
            retryLabel={tCommon('retry')}
            onRetry={onRetry}
            fill
          >
            <Center>
              <MantineDashboardDonut
                segments={donutSegments}
                formatCount={fc}
                ariaLabel={t('portfolio_card_title')}
                state="ready"
                showCounts
              />
            </Center>
          </MantineDashboardCard>
        }
      />

      {/* Row 4 — AGT-10 results table/cards, now full width (D854-1 = A). */}
      <MantineDashboardGridFull>
        <MantineDashboardCard
          title={t('agt10_card_title')}
          state={data.agt10.ok ? 'ready' : 'error'}
          errorMessage={t('error_generic')}
          retryLabel={tCommon('retry')}
          onRetry={onRetry}
        >
          {showAgt10Empty ? (
            <MantineEmptyLoadingErrorState
              state="empty"
              description={t('agt10_empty')}
              action={
                <Button component={Link} href={`/${locale}/listings/create`} color="brand">
                  {tc('add_listing')}
                </Button>
              }
            />
          ) : (
            <Stack gap="md">
              <Flex gap="sm" wrap="wrap" direction={{ base: 'column', sm: 'row' }}>
                <MantineSelect
                  data={statusData}
                  value={table.status ?? ''}
                  onChange={(val) => onTableChange({ status: (val || undefined) as ListingStatus | undefined })}
                  aria-label={t('agt10_col_status')}
                  placeholder={t('agt10_col_status')}
                />
                <MantineSelect
                  data={visibilityData}
                  value={table.visibility ?? ''}
                  onChange={(val) => onTableChange({ visibility: (val || undefined) as Agt10Table['visibility'] })}
                  aria-label={t('agt10_col_visibility')}
                  placeholder={t('agt10_col_visibility')}
                />
                <MantineSelect
                  data={typeData}
                  value={table.listingType ?? ''}
                  onChange={(val) => onTableChange({ listingType: (val || undefined) as ListingType | undefined })}
                  aria-label={tl('offer_type')}
                  placeholder={tl('offer_type')}
                />
                <MantineSelect
                  data={sortData}
                  value={currentSortToken}
                  onChange={(val) => {
                    const token = resolveSortToken(val ?? undefined)
                    onTableChange({ sort: token.sort, direction: token.direction })
                  }}
                  aria-label={t('agt10_sort_label')}
                  placeholder={t('agt10_sort_label')}
                />
              </Flex>

              <MantineDataTableToCards
                columns={columns}
                rows={data.agt10.ok ? data.agt10.data.rows : []}
                card={card}
                cardsBelow="lg"
                emptyLabel={filtersActive ? t('agt10_filtered_empty') : t('agt10_empty')}
              />

              {data.agt10.ok && totalPages > 1 && (
                <Group justify="flex-end">
                  <MantinePagination
                    total={totalPages}
                    value={data.agt10.data.page}
                    onChange={onPageChange}
                    previousLabel={t('pagination_aria_prev')}
                    nextLabel={t('pagination_aria_next')}
                  />
                </Group>
              )}
            </Stack>
          )}
        </MantineDashboardCard>
      </MantineDashboardGridFull>
    </MantineDashboardGrid>
  )
}
