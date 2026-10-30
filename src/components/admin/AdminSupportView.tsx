'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useMediaQuery } from '@mantine/hooks'
import { belowMobileGateQuery } from '@/design-system/mantine/belowMobileGate'
import { AddCircleIcon } from '@solar-icons/react/broken'
import { CheckCircleIcon, DangerCircleIcon, RecordCircleIcon } from '@solar-icons/react/bold-duotone'
import { Anchor, Button, Flex, Group, ScrollArea, SegmentedControl, SimpleGrid, Stack, Tabs, Text, useMantineTheme } from '@mantine/core'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { MantineDashboardStatCard } from '@/design-system/mantine/patterns/MantineDashboardStatCard'
import { MantineDetailList, type MantineDetailListItem } from '@/design-system/mantine/patterns/MantineDetailList'
import { MantineSelect } from '@/design-system/mantine/patterns/MantineSelect'
import { formatDate } from '@/lib/formatters'
import {
  SUPPORT_TICKET_STATUSES,
  type SupportAssignedFilter,
  type SupportFilters,
  type SupportStatusFilter,
  type SupportTypeFilter,
} from '@/components/admin/supportFilters'
import type { SupportTicketRow } from '@/components/admin/AdminSupportManager'
import type { TicketStatus } from '@/types/database'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'

export interface AdminSupportViewProps {
  /** Rows after the filters (the container filters). */
  tickets: SupportTicketRow[]
  /** Stats over every loaded ticket, whatever the filter. */
  counts: { open: number; in_progress: number; resolved: number }
  filters: SupportFilters
  onFiltersChange: (filters: SupportFilters) => void
  onSelect: (ticket: SupportTicketRow) => void
  onNew: () => void
}

/**
 * Presentational View of the `/admin/support` list (Task 859, Container/Presentational split of
 * `AdminSupportManager`) on the canonical admin list anatomy (`AdminListingsView`): `AdminPageHeader` with the create
 * action, three stat cards, the type `Tabs`, the filter row (one status `MantineSelect`, the assignment as a
 * `SegmentedControl` from 640px and a `MantineSelect` below) and the shared `AdminTable` (table from 768px, cards
 * below). `useTranslations` / `useLocale` / `useMantineTheme` / `useMediaQuery` only: no state, no navigation, no
 * server action. The dialogs are separate Views.
 */
export function AdminSupportView({ tickets, counts, filters, onFiltersChange, onSelect, onNew }: AdminSupportViewProps) {
  const t = useTranslations('admin.support')
  const tp = useTranslations('admin.pages')
  const tcm = useTranslations('common')
  const locale = useLocale()
  const theme = useMantineTheme()
  // The pattern's own phone query: the assignment filter is a select there, a segmented control from 640px.
  const isMobile = useMediaQuery(belowMobileGateQuery(theme))

  const statusLabel = (status: TicketStatus) => t(`support_status_${status}` as 'support_status_open')

  const stats = [
    { key: 'open', label: tp('support_open'), count: counts.open, icon: RecordCircleIcon },
    { key: 'in_progress', label: tp('support_in_progress'), count: counts.in_progress, icon: DangerCircleIcon },
    { key: 'resolved', label: tp('support_resolved'), count: counts.resolved, icon: CheckCircleIcon },
  ]

  const statusOptions = [
    { value: 'all', label: t('filter_all_status') },
    { value: 'active', label: t('filter_active') },
    ...SUPPORT_TICKET_STATUSES.map(s => ({ value: s, label: statusLabel(s) })),
  ]
  const assignedOptions = [
    { value: 'all', label: tcm('all') },
    { value: 'unassigned', label: t('filter_unassigned') },
  ]

  function statusBadge(tk: SupportTicketRow) {
    return (
      <MantineBadge variant="status" entity="ticket" value={tk.status}>
        {statusLabel(tk.status)}
      </MantineBadge>
    )
  }

  function typeBadge(tk: SupportTicketRow) {
    const isComplaint = tk.ticket_type === 'user_complaint'
    return (
      <MantineBadge variant="status" entity="ticketType" value={isComplaint ? 'user_complaint' : 'support'}>
        {isComplaint ? t('type_user_complaint') : t('type_support')}
      </MantineBadge>
    )
  }

  function complaintBadge(tk: SupportTicketRow) {
    if (tk.ticket_type !== 'user_complaint' || !tk.complaint_type) return null
    return (
      <MantineBadge variant="tone" tone="neutral">
        {t(`complaint_type_${tk.complaint_type}` as 'complaint_type_other')}
      </MantineBadge>
    )
  }

  // R81(c), D5: a user without a name shows the `user_no_name` text (never a cut id), still a link to the profile.
  function userLink(user: SupportTicketRow['reporter']) {
    if (!user) return <Text component="span" size="sm" c="dimmed">—</Text>
    return (
      <Anchor
        component={Link}
        href={`/admin/users/${user.id}`}
        size="sm"
        fw={500}
        onClick={e => e.stopPropagation()}
      >
        {user.name ?? t('user_no_name')}
      </Anchor>
    )
  }

  // §7.3 (b): the people are labelled fields (R81(a), GR-3j: label above the name), so the table needs no
  // reporter/reported columns. A missing reporter or reported user is skipped, not shown as an empty label.
  function peopleFields(tk: SupportTicketRow): MantineDetailListItem[] {
    const items: MantineDetailListItem[] = []
    if (tk.reporter) items.push({ label: t('col_reporter'), value: userLink(tk.reporter) })
    if (tk.ticket_type === 'user_complaint' && tk.reported) items.push({ label: t('col_reported'), value: userLink(tk.reported) })
    return items
  }

  const columns: AdminTableColumn<SupportTicketRow>[] = [
    {
      key: 'subject',
      header: t('col_subject'),
      // §7.3 (a)/(b): the subject wraps at the table-title token width; reason, complaint type and the people sit under it.
      width: theme.other.layout.tableTitleColumnWidth,
      wrap: true,
      cell: tk => (
        // R70, GR-3h: three blocks (text, badge row, people) one rhythm step (sm) apart, as the card form stacks them.
        <Stack gap="sm">
          <Stack gap="tight">
            <Text size="sm" fw={500} c="gray.7">{tk.subject}</Text>
            {tk.reason && <Text size="xs" c="dimmed">{tk.reason}</Text>}
          </Stack>
          {complaintBadge(tk) && <Group gap="xs">{complaintBadge(tk)}</Group>}
          {peopleFields(tk).length > 0 && <MantineDetailList variant="plain" items={peopleFields(tk)} />}
        </Stack>
      ),
    },
    {
      key: 'status',
      header: t('col_status'),
      // §7.3 (b): status and type stacked in one cell, one rhythm step (sm) apart (R70, GR-3h).
      cell: tk => (
        <Stack gap="sm" align="flex-start">
          {statusBadge(tk)}
          {typeBadge(tk)}
        </Stack>
      ),
    },
    {
      key: 'updated',
      header: t('col_updated'),
      visibility: 'md',
      cell: tk => <Text size="xs" c="dimmed">{formatDate(tk.updated_at, locale)}</Text>,
    },
  ]

  return (
    <Stack gap="md" data-testid="admin-support-manager">
      <AdminPageHeader
        title={tp('support_title')}
        subtitle={tp('support_subtitle')}
        action={
          <Button
            leftSection={<AddCircleIcon size={theme.other.iconSize.standard} aria-hidden="true" />}
            onClick={onNew}
          >
            {t('new_ticket_btn')}
          </Button>
        }
      />

      <SimpleGrid cols={{ base: 1, xs2: 3 }} spacing="md">
        {stats.map(({ key, label, count, icon: Icon }) => (
          <MantineDashboardStatCard
            key={key}
            icon={<Icon size={theme.other.iconSize.decorative} aria-hidden="true" />}
            label={label}
            value={String(count)}
            state="ready"
          />
        ))}
      </SimpleGrid>

      <Tabs value={filters.type} onChange={tab => tab && onFiltersChange({ ...filters, type: tab as SupportTypeFilter })}>
        <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
          <Tabs.List>
            <Tabs.Tab value="all">{t('filter_all')}</Tabs.Tab>
            <Tabs.Tab value="support">{t('type_support')}</Tabs.Tab>
            <Tabs.Tab value="user_complaint">{t('type_user_complaint')}</Tabs.Tab>
          </Tabs.List>
        </ScrollArea>
      </Tabs>

      <Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'center' }} wrap="wrap" gap="sm">
        <MantineSelect
          value={filters.status}
          onChange={value => onFiltersChange({ ...filters, status: (value ?? 'all') as SupportStatusFilter })}
          data={statusOptions}
          allowDeselect={false}
          aria-label={t('col_status')}
          data-testid="support-status-filter"
        />
        {isMobile ? (
          <MantineSelect
            value={filters.assigned}
            onChange={value => onFiltersChange({ ...filters, assigned: (value ?? 'all') as SupportAssignedFilter })}
            data={assignedOptions}
            allowDeselect={false}
            aria-label={t('filter_unassigned')}
            data-testid="support-assigned-filter"
          />
        ) : (
          <SegmentedControl
            value={filters.assigned}
            onChange={value => onFiltersChange({ ...filters, assigned: value as SupportAssignedFilter })}
            size="xs"
            aria-label={t('filter_unassigned')}
            data-testid="support-assigned-filter"
            data={assignedOptions}
          />
        )}
      </Flex>

      <AdminTable<SupportTicketRow>
        rows={tickets}
        columns={columns}
        rowKey={tk => tk.id}
        onRowClick={onSelect}
        emptyState={<Text size="sm" c="dimmed" ta="center">{tp('support_empty')}</Text>}
        ariaLabel={t('col_subject')}
        cardRow={tk => ({
          title: <Text size="sm" fw={500} c="gray.7" component="span">{tk.subject}</Text>,
          // R69(e), GR-3h: status and type are the card's badges row, not its subtitle.
          badges: (
            <Group gap="xs" wrap="wrap">
              {statusBadge(tk)}
              {typeBadge(tk)}
            </Group>
          ),
          // R81(a), GR-3j: every field is its label, then its complete value below; an empty field is skipped.
          fields: [
            { label: t('reason_section'), value: tk.reason },
            { label: t('complaint_type_label'), value: complaintBadge(tk) },
            ...peopleFields(tk),
            { label: t('col_updated'), value: formatDate(tk.updated_at, locale) },
          ],
        })}
      />
    </Stack>
  )
}
