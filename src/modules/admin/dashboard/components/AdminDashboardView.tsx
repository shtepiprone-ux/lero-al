'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ActionIcon, Button, Group, Stack, Text, Title, useMantineTheme } from '@mantine/core'
import { Check, Eye, EyeOff, FileCheck2, Flag, Info, LifeBuoy } from 'lucide-react'
import { MantineDashboardHeader } from '@/design-system/mantine/patterns/MantineDashboardHeader'
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
import { MantineTooltip } from '@/design-system/mantine/patterns/MantineTooltip'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { tiraneAbsoluteLabel } from '@/lib/dashboard/period'
import { AdminDashboardRecentListings } from '@/components/admin/AdminDashboardRecentListings'
import { LISTING_STATUS_COLOR, VISIBILITY_TONE_COLOR } from '@/modules/listings/lib/listingStatusTone'
import { formatCount } from '@/lib/formatters'
import {
  listingPreviewHref,
  pendingListingsHref,
  pendingReportsHref,
  unassignedSupportHref,
  hiddenEligibleHref,
} from '@/modules/admin/dashboard/hrefs'
import type { AdminDashboardData, Adm11SegmentKey } from '@/modules/admin/dashboard/types'

export interface AdminDashboardViewProps {
  data: AdminDashboardData
  locale: string
}

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

/**
 * `/admin` operations dashboard (Task 853, spec v3.3 §6.1, §16.2, §17.2; kickoff §3.1). Composes
 * only the 843–846 canonical patterns and 847's `AdminDashboardData`. The 791 server→client
 * boundary lesson: this is the client boundary — it receives only serializable data/strings/
 * numbers from `src/app/admin/page.tsx` and owns every callback itself (`onRetry` = `router.refresh()`).
 */
export function AdminDashboardView({ data, locale }: AdminDashboardViewProps) {
  const t = useTranslations('admin.dashboard')
  const tl = useTranslations('listing')
  const trep = useTranslations('admin.reports')
  const tsup = useTranslations('admin.support')
  const tCommon = useTranslations('dashboard.common')
  const theme = useMantineTheme()
  const router = useRouter()

  const onRetry = () => router.refresh()
  const fc = (n: number) => formatCount(n, locale)
  const absoluteLabel = (iso: string) => tiraneAbsoluteLabel(iso, locale)
  const updatedAtLabel = `${tCommon('updated_at_prefix')} ${tiraneAbsoluteLabel(data.refreshedAt, locale)}`

  const positiveIcon = <Check size={theme.other.iconSize.decorative} color={theme.colors.green[6]} aria-hidden="true" />

  // ── Row 1 — queue cards ─────────────────────────────────────────────────────────────────────
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

  // ── Row 2 — ADM-01 work list + ADM-11 donut ────────────────────────────────────────────────
  const adm01Rows: DashboardWorkListRow[] = data.adm01.ok
    ? data.adm01.data.rows.map((row) => ({
        id: row.id,
        href: listingPreviewHref(row.id),
        primary: row.title,
        meta: [row.authorName, <RelativeTime key="t" date={row.createdAt} absoluteLabel={absoluteLabel(row.createdAt)} focusable={false} />],
        ctaLabel: t('worklist_cta_preview'),
      }))
    : []

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

  // ── Row 3 — ADM-02 / ADM-06 / location-requests work lists ────────────────────────────────
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

  // ── Row 4 — ADM-08 / ADM-09 ─────────────────────────────────────────────────────────────────
  const adm09Rows: DashboardStatRow[] = data.adm09.ok
    ? [
        { label: t('adm09_no_expiry'), count: data.adm09.data.noExpiry, href: hiddenEligibleHref('no_expiry'), tone: 'warning' },
        { label: t('adm09_expired'), count: data.adm09.data.expired, href: hiddenEligibleHref('expired'), tone: 'warning' },
      ]
    : []

  return (
    <MantineDashboardGrid>
      <MantineDashboardHeader title={t('title')} subtitle={t('subtitle')} updatedAtLabel={updatedAtLabel} />

      {/* Row 1 — queues (ADM-01, ADM-02, ADM-06; ADM-03 out per D78-1, the grid closes to 3) */}
      <MantineDashboardGridTopRow>
        <MantineDashboardStatCard
          icon={<FileCheck2 size={theme.other.iconSize.decorative} aria-hidden="true" />}
          label={t('adm01_label')}
          value={data.adm01.ok ? fc(data.adm01.data.count) : ''}
          caption={t('adm01_caption')}
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
          href={unassignedSupportHref()}
          state={data.adm06.ok ? (data.adm06.data.unassigned === 0 ? 'zero' : 'ready') : 'error'}
          zeroText={t('adm06_zero')}
          errorMessage={t('error_generic')}
          retryLabel={tCommon('retry')}
          onRetry={onRetry}
          loadingAriaLabel={tCommon('loading_label')}
        />
      </MantineDashboardGridTopRow>

      {/* Row 2 — moderation-queue work list + listing-status donut */}
      <MantineDashboardGridSplit
        main={
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
        }
        side={
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
        }
      />

      {/* Row 3 — ADM-02 / ADM-06 work lists + conditional location requests */}
      <MantineDashboardGridTopRow>
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

      {/* Row 4 — "State of supply": ADM-08 visible / ADM-09 visibility-check breakdown */}
      <Stack gap="md">
        <Title order={2} size="h5">
          {t('supply_section_title')}
        </Title>
        <MantineDashboardGridTopRow>
          <MantineDashboardStatCard
            icon={<Eye size={theme.other.iconSize.decorative} aria-hidden="true" />}
            label={t('adm08_label')}
            value={data.adm08.ok ? fc(data.adm08.data.visible) : ''}
            secondaryLine={
              <Group gap="tight" wrap="nowrap">
                <Text size="xs" c="gray.5" lineClamp={2}>
                  {t('adm08_tooltip')}
                </Text>
                <MantineTooltip label={t('adm08_tooltip')}>
                  <ActionIcon variant="subtle" size="sm" aria-label={t('adm08_tooltip_aria')}>
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
        </MantineDashboardGridTopRow>
      </Stack>

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
