'use client'

import type { ChangeEvent } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useMediaQuery } from '@mantine/hooks'
import { Search, Star } from 'lucide-react'
import {
  Badge, Flex, Group, Paper, ScrollArea, SegmentedControl, Stack, Tabs, Text, TextInput, UnstyledButton,
  useMantineTheme,
} from '@mantine/core'
import { MantineCopyIdButton } from '@/design-system/mantine/patterns/MantineCopyIdButton'
import { MantinePagination } from '@/design-system/mantine/patterns/MantinePagination'
import { MantineSelect } from '@/design-system/mantine/patterns/MantineSelect'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { RelativeTime } from '@/components/shared/RelativeTime'
import type { AdminListing } from '@/components/admin/AdminListingsTable'
import { formatPrice } from '@/lib/formatters'
import { LISTING_STATUS_CODES } from '@/lib/i18n/listingStatusLabel'
import { LISTING_STATUS_COLOR } from '@/modules/listings/lib/listingStatusTone'
import { formatVisibility } from '@/modules/listings/lib/visibility'
import { usePropertyTypes } from '@/hooks/usePropertyTypes'
import type { ListingStatus } from '@/types/database'

export type AdminListingsVisibilityFilter = '' | 'visible' | 'hidden_eligible'

export interface AdminListingsAuditCounts {
  total: number
  expired: number
  noExpiry: number
}

export interface AdminListingsViewProps {
  listings: AdminListing[]
  page: number
  totalPages: number
  activeStatus: string
  activeTab: string
  activeVisibility: string
  activeReason: string
  auditCounts?: AdminListingsAuditCounts
  /** Translated status label per `ListingStatus` (the container resolves them). */
  statusLabels: Record<ListingStatus, string>
  /** Search field state from `useAdminSearchQuery` (controlled, debounced URL write in the container). */
  search: { value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void }
  onTabChange: (tab: string) => void
  onStatusChange: (status: string) => void
  onVisibilityChange: (visibility: string) => void
  /** Audit-panel link: the hidden-eligible filter, optionally narrowed to one reason. */
  onAuditSelect: (reason: 'expired' | 'no_expiry' | null) => void
  onPageChange: (page: number) => void
  onSelect: (listing: AdminListing) => void
}

/**
 * Presentational View of the `/admin/listings` list (Task 857, Container/Presentational split of
 * `AdminListingsTable`). `useTranslations` / `useLocale` / `usePropertyTypes` (read-only) only: no state, no
 * router, no server action. Tabs and the segmented visibility filter follow `AdminUsersTable`; the list is the
 * `AdminTable` adapter (cards below 768px). The preview and premium dialogs are separate Views.
 */
export function AdminListingsView({
  listings,
  page,
  totalPages,
  activeStatus,
  activeTab,
  activeVisibility,
  activeReason,
  auditCounts,
  statusLabels,
  search,
  onTabChange,
  onStatusChange,
  onVisibilityChange,
  onAuditSelect,
  onPageChange,
  onSelect,
}: AdminListingsViewProps) {
  const t = useTranslations('admin.listings')
  const tc = useTranslations('cabinet')
  const tl = useTranslations('listing')
  const locale = useLocale()
  const theme = useMantineTheme()
  const { propertyTypes } = usePropertyTypes()
  // The pattern's own phone query: the visibility filter is a select there, a segmented control from 640px (R18).
  const isMobile = useMediaQuery(`(max-width: ${theme.other.mobileGate})`)
  const visibilityOptions = [
    { value: '', label: tc('filter_ALL') },
    { value: 'visible', label: t('visibility_visible') },
    { value: 'hidden_eligible', label: t('visibility_filter_hidden_eligible') },
  ]

  const typeLabel = (l: AdminListing) =>
    `${(tl as (k: string) => string)(l.listing_type)} · ${propertyTypes.find(pt => pt.value === l.property_type)?.label ?? l.property_type}`

  const statusOptions = [
    { value: '', label: tc('filter_ALL') },
    ...LISTING_STATUS_CODES.map(s => ({ value: s, label: statusLabels[s as ListingStatus] })),
  ]

  const visibilityBadge = (l: AdminListing) => {
    const vis = formatVisibility({ status: l.status, expires_at: l.expires_at })
    return (
      <Badge variant="light" size="sm" color={vis.visible ? 'green' : 'red'}>
        {vis.visible ? t('visibility_visible') : t(vis.labelKey as Parameters<typeof t>[0])}
      </Badge>
    )
  }

  const statusBadge = (l: AdminListing) => (
    <Badge variant="light" size="sm" color={LISTING_STATUS_COLOR[l.status]}>
      {statusLabels[l.status]}
    </Badge>
  )

  // Type · property, then the agent: the dimmed meta line under the title and in the card (one helper, §7.3 (b)).
  const metaLine = (l: AdminListing) => `${typeLabel(l)}${l.owner?.name ? ` · ${l.owner.name}` : ''}`

  const columns: AdminTableColumn<AdminListing>[] = [
    {
      key: 'id',
      header: 'ID',
      visibility: 'xxl',
      cell: l => (
        <MantineCopyIdButton
          id={l.id}
          label={`#${l.public_id ?? l.id.slice(0, 8)}`}
          copyLabel={tl('copy_id')}
          copiedLabel={tl('id_copied')}
        />
      ),
    },
    {
      key: 'listing',
      header: t('col_listing'),
      // §7.3 (a): the title wraps in a column of the table-title token width instead of setting the table width.
      width: theme.other.layout.tableTitleColumnWidth,
      wrap: true,
      cell: l => (
        <UnstyledButton
          type="button"
          onClick={e => {
            e.stopPropagation()
            onSelect(l)
          }}
        >
          <Group gap="xs" wrap="nowrap" align="flex-start">
            {l.is_premium && <Star size={theme.other.iconSize.compact} color="var(--badge-premium)" />}
            <Stack gap="micro">
              <Text size="sm" fw={500} lineClamp={2}>{l.title}</Text>
              <Text size="xs" c="dimmed" lineClamp={1}>{metaLine(l)}</Text>
            </Stack>
          </Group>
        </UnstyledButton>
      ),
    },
    {
      key: 'price',
      header: t('col_price'),
      cell: l => <Text size="sm" fw={500}>{formatPrice(l.price, l.currency, locale)}</Text>,
    },
    {
      key: 'status',
      header: t('col_status'),
      // §7.3 (b): status and visibility stacked in one cell.
      cell: l => (
        <Stack gap="tight" align="flex-start">
          {statusBadge(l)}
          {visibilityBadge(l)}
        </Stack>
      ),
    },
    {
      key: 'date',
      header: t('col_date'),
      visibility: 'xl',
      cell: l => <Text size="xs" c="dimmed" component="span"><RelativeTime date={l.created_at} /></Text>,
    },
  ]

  const auditButton = (label: string, active: boolean, onClick: () => void, strong: boolean) => (
    <UnstyledButton
      type="button"
      mih={{ base: theme.other.touchTarget, sm: 'auto' }}
      c={active ? 'brand' : undefined}
      fw={strong || active ? 500 : undefined}
      onClick={onClick}
    >
      <Text size="sm">{label}</Text>
    </UnstyledButton>
  )

  return (
    <Stack gap="md" data-testid="admin-listings-table">
      <Tabs value={activeTab} onChange={tab => tab && onTabChange(tab)}>
        <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
          <Tabs.List>
            <Tabs.Tab value="all">{t('tab_all')}</Tabs.Tab>
            <Tabs.Tab value="premium">{t('tab_premium')}</Tabs.Tab>
          </Tabs.List>
        </ScrollArea>
      </Tabs>

      <Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'center' }} wrap="wrap" gap="sm">
        <TextInput
          value={search.value}
          onChange={search.onChange}
          placeholder={t('search_placeholder')}
          aria-label={t('search_placeholder')}
          leftSection={<Search size={theme.other.iconSize.standard} />}
          flex={{ base: 'none', sm: 1 }}
          miw={0}
          data-testid="listings-search"
        />
        <MantineSelect
          value={activeStatus}
          onChange={value => onStatusChange(value ?? '')}
          data={statusOptions}
          allowDeselect={false}
          aria-label={tc('filter_ALL')}
          data-testid="listings-status-filter"
        />
        {isMobile ? (
          <MantineSelect
            value={activeVisibility}
            onChange={value => onVisibilityChange(value ?? '')}
            data={visibilityOptions}
            allowDeselect={false}
            aria-label={t('visibility_label')}
            data-testid="listings-visibility-filter"
          />
        ) : (
          <SegmentedControl
            value={activeVisibility}
            onChange={onVisibilityChange}
            size="xs"
            aria-label={t('visibility_label')}
            data-testid="listings-visibility-filter"
            data={visibilityOptions}
          />
        )}
      </Flex>

      {auditCounts && (
        <Paper withBorder radius="lg" p="sm">
          {auditCounts.total === 0 ? (
            <Text size="sm" c="dimmed">{t('audit_hidden_zero')}</Text>
          ) : (
            <Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'center' }} gap={{ base: 'xs', sm: 'md' }}>
              {auditButton(
                t('audit_hidden_total', { count: auditCounts.total }),
                activeVisibility === 'hidden_eligible' && !activeReason,
                () => onAuditSelect(null),
                true,
              )}
              <Text size="sm" c="dimmed" visibleFrom="sm">·</Text>
              <Flex direction={{ base: 'column', sm: 'row' }} gap={{ base: 'xs', sm: 'md' }}>
                  {auditButton(
                    t('audit_hidden_expired', { count: auditCounts.expired }),
                    activeReason === 'expired',
                    () => onAuditSelect('expired'),
                    false,
                  )}
                  {auditButton(
                    t('audit_hidden_no_expiry', { count: auditCounts.noExpiry }),
                    activeReason === 'no_expiry',
                    () => onAuditSelect('no_expiry'),
                    false,
                  )}
              </Flex>
            </Flex>
          )}
        </Paper>
      )}

      <AdminTable
        rows={listings}
        columns={columns}
        rowKey={l => l.id}
        onRowClick={onSelect}
        stickyColumnIndex={1}
        emptyState={t('empty')}
        ariaLabel={t('col_listing')}
        cardRow={l => ({
          title: (
            <Group gap="xs" wrap="nowrap">
              {l.is_premium && <Star size={theme.other.iconSize.compact} color="var(--badge-premium)" />}
              <Text size="sm" fw={500} lineClamp={1}>{l.title}</Text>
            </Group>
          ),
          subtitle: (
            <Group gap="xs" wrap="wrap">
              <Text size="sm" fw={500} component="span">{formatPrice(l.price, l.currency, locale)}</Text>
              {statusBadge(l)}
              {visibilityBadge(l)}
            </Group>
          ),
          meta: <Text size="xs" c="dimmed">{metaLine(l)}</Text>,
        })}
      />

      {totalPages > 1 && (
        <Group justify="center">
          <MantinePagination
            total={totalPages}
            value={page}
            onChange={onPageChange}
            previousLabel={t('prev_page')}
            nextLabel={t('next_page')}
          />
        </Group>
      )}
    </Stack>
  )
}
