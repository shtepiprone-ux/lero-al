'use client'

import { useTranslations } from 'next-intl'
import { Badge, Group, ScrollArea, Stack, Tabs, Text } from '@mantine/core'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { REPORT_STATUS_COLOR } from '@/components/admin/ReportDetailDialogView'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { REPORT_FILTERS, type ReportStatusFilter } from '@/components/admin/reportStatusFilter'
import type { ReportRow } from '@/components/admin/AdminReportsManager'

export interface AdminReportsViewProps {
  /** Rows of the active tab (already filtered by the container). */
  reports: ReportRow[]
  filter: ReportStatusFilter
  /** Rows per tab, over every loaded report; a tab with 0 shows no count. */
  counts: Record<string, number>
  onFilterChange: (filter: ReportStatusFilter) => void
  onSelect: (report: ReportRow) => void
}

/**
 * Presentational View of the `/admin/reports` list (Task 858, Container/Presentational split of
 * `AdminReportsManager`). `useTranslations` only: no state, no navigation, no server action. Status tabs
 * are Mantine `Tabs` with a count `Badge`; the list is the shared `AdminTable` adapter (table from 640px,
 * cards below). The detail dialog is the separate `ReportDetailDialogView`.
 */
export function AdminReportsView({ reports, filter, counts, onFilterChange, onSelect }: AdminReportsViewProps) {
  const t = useTranslations('admin.reports')
  const tl = useTranslations('listing')

  function statusBadge(r: ReportRow) {
    return (
      <Badge variant="light" size="sm" color={REPORT_STATUS_COLOR[r.status]}>
        {t(`status_${r.status}` as Parameters<typeof t>[0])}
      </Badge>
    )
  }

  const reasonLabel = (r: ReportRow) => tl(`report_reason_${r.reason}` as Parameters<typeof tl>[0])
  const reporterLabel = (r: ReportRow) => r.reporter?.name ?? t('anonymous')

  const columns: AdminTableColumn<ReportRow>[] = [
    {
      key: 'reason',
      header: t('col_reason'),
      cell: r => <Text size="sm" fw={500} c="gray.7">{reasonLabel(r)}</Text>,
    },
    {
      key: 'listing',
      header: t('col_listing'),
      visibility: 'md',
      cell: r => <Text size="sm" c="dimmed" lineClamp={1}>{r.listing?.title ?? '—'}</Text>,
    },
    {
      key: 'reporter',
      header: t('col_reporter'),
      visibility: 'lg',
      cell: r => <Text size="sm" c="dimmed">{reporterLabel(r)}</Text>,
    },
    { key: 'status', header: t('col_status'), cell: statusBadge },
    {
      key: 'date',
      header: t('col_date'),
      visibility: 'sm',
      cell: r => <RelativeTime date={r.created_at} />,
    },
  ]

  return (
    <Stack gap="md" data-testid="admin-reports-manager">
      <Tabs value={filter} onChange={value => { if (value) onFilterChange(value as ReportStatusFilter) }}>
        <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
          <Tabs.List>
            {REPORT_FILTERS.map(f => {
              const active = filter === f
              return (
                <Tabs.Tab
                  key={f}
                  value={f}
                  rightSection={
                    counts[f] > 0 ? (
                      <Badge size="sm" variant={active ? 'filled' : 'light'} color={active ? 'brand' : 'gray'}>
                        {counts[f]}
                      </Badge>
                    ) : null
                  }
                >
                  {t(`filter_${f}` as Parameters<typeof t>[0])}
                </Tabs.Tab>
              )
            })}
          </Tabs.List>
        </ScrollArea>
      </Tabs>

      <AdminTable<ReportRow>
        rows={reports}
        columns={columns}
        rowKey={r => r.id}
        onRowClick={onSelect}
        cardRow={r => ({
          title: <Text size="sm" fw={500} c="gray.7" component="span">{reasonLabel(r)}</Text>,
          subtitle: (
            <Group component="span" gap="xs" wrap="wrap">
              {statusBadge(r)}
              <RelativeTime date={r.created_at} />
            </Group>
          ),
          meta: (
            <Text size="xs" c="dimmed" component="span">
              {r.listing?.title ?? '—'} · {reporterLabel(r)}
            </Text>
          ),
        })}
        emptyState={<Text size="sm" c="dimmed" ta="center">{t('empty')}</Text>}
      />
    </Stack>
  )
}
