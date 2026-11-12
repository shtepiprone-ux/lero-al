'use client'

import type { ChangeEvent } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Search, Star } from 'lucide-react'
import { Flex, Group, Paper, ScrollArea, SegmentedControl, Stack, Tabs, Text, TextInput, UnstyledButton, useMantineTheme } from '@mantine/core'
import { MantineCopyIdButton } from '@/design-system/mantine/patterns/MantineCopyIdButton'
import { MantinePagination } from '@/design-system/mantine/patterns/MantinePagination'
import { MantineSelect } from '@/design-system/mantine/patterns/MantineSelect'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { RelativeTime } from '@/components/shared/RelativeTime'
import type { AdminListing } from '@/components/admin/AdminListingsTable'
import { formatPrice } from '@/lib/formatters'
import { LISTING_STATUS_CODES } from '@/lib/i18n/listingStatusLabel'
import { formatVisibility } from '@/modules/listings/lib/visibility'
import { usePropertyTypes } from '@/hooks/usePropertyTypes'
import type { ListingStatus } from '@/types/database'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'

export type AdminListingsVisibilityFilter = '' | 'visible' | 'hidden_eligible'

export interface AdminListingsAuditCounts {
  total: number
  expired: number
  noExpiry: number
}

export interface AdminListingsViewProps {
  listings: AdminListing[]
  /** The server's `now` (ISO): relative times are measured against it, so the server render and the browser's first render print the same text (Task 965). */
  now?: string
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
 * `AdminTable` adapter (record cards below 768px, D36). The preview and premium dialogs are separate Views.
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
  now,
}: AdminListingsViewProps) {
  const t = useTranslations('admin.listings')
  const tc = useTranslations('cabinet')
  const tl = useTranslations('listing')
  const locale = useLocale()
  const theme = useMantineTheme()
  const { propertyTypes } = usePropertyTypes()
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
      <MantineBadge variant="status" entity="listingVisibility" value={vis.visible ? 'visible' : 'hidden'}>
        {vis.visible ? t('visibility_visible') : t(vis.labelKey as Parameters<typeof t>[0])}
      </MantineBadge>
    )
  }

  const statusBadge = (l: AdminListing) => (
    <MantineBadge variant="status" entity="listing" value={l.status}>
      {statusLabels[l.status]}
    </MantineBadge>
  )

  // Type · property, then the agent: the dimmed meta line under the title and in the card (one helper, §7.3 (b)).
  const metaLine = (l: AdminListing) => `${typeLabel(l)}${l.owner?.name ? ` · ${l.owner.name}` : ''}`
  // The table's meta line starts with the price: it left its own column (Task 923 R39 (c)). The card shows the
  // price in its badges row, so its meta line stays `metaLine`.
  const tableMetaLine = (l: AdminListing) => `${formatPrice(l.price, l.currency, locale)} · ${metaLine(l)}`

  const columns: AdminTableColumn<AdminListing>[] = [
    {
      key: 'id',
      header: 'ID',
      visibility: 'xxl',
      cell: l => (
        <MantineCopyIdButton
          id={l.id}
          label={`#${l.public_id ?? l.id}`}
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
              <Text size="sm" fw={500}>{l.title}</Text>
              <Text size="xs" c="dimmed">{tableMetaLine(l)}</Text>
            </Stack>
          </Group>
        </UnstyledButton>
      ),
    },
    {
      key: 'status',
      header: t('col_status'),
      // §7.3 (b): status and visibility stacked in one cell, one rhythm step (sm) apart (R70, GR-3h).
      cell: l => (
        <Stack gap="sm" align="flex-start">
          {statusBadge(l)}
          {visibilityBadge(l)}
        </Stack>
      ),
    },
    {
      key: 'date',
      header: t('col_date'),
      visibility: 'xl',
      cell: l => <Text size="xs" c="dimmed" component="span"><RelativeTime date={l.created_at} baseDate={now} /></Text>,
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
          miw={{ base: 0, sm: theme.other.boxSize.searchFieldMin }}
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
        {/* A select below 640px, a segmented control from 640px: both render, Mantine's visibility props choose (Task 923 R39 (e)). */}
        <MantineSelect
          hiddenFrom="sm"
          value={activeVisibility}
          onChange={value => onVisibilityChange(value ?? '')}
          data={visibilityOptions}
          allowDeselect={false}
          aria-label={t('visibility_label')}
          data-testid="listings-visibility-filter-compact"
        />
        <SegmentedControl
          visibleFrom="sm"
          value={activeVisibility}
          onChange={onVisibilityChange}
          size="xs"
          aria-label={t('visibility_label')}
          data-testid="listings-visibility-filter"
          data={visibilityOptions}
        />
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
              <Text size="sm" fw={500} miw={0}>{l.title}</Text>
            </Group>
          ),
          // R69(e), GR-3h: price + status + visibility are the card's badges row, not its subtitle.
          badges: (
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
