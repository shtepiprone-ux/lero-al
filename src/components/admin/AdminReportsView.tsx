'use client'

import { useTranslations } from 'next-intl'
import { Group, ScrollArea, Stack, Tabs, Text, useMantineTheme } from '@mantine/core'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { REPORT_FILTERS, type ReportStatusFilter } from '@/components/admin/reportStatusFilter'
import type { ReportRow } from '@/components/admin/AdminReportsManager'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'

export interface AdminReportsViewProps {
  /** Rows of the active tab (already filtered by the container). */
  reports: ReportRow[]
  filter: ReportStatusFilter
  /** Rows per tab, over every loaded report; a tab with 0 shows no count. */
  counts: Record<string, number>
  onFilterChange: (filter: ReportStatusFilter) => void
  onSelect: (report: ReportRow) => void
  /** The server's `now` (ISO): relative times are measured against it (Task 965). */
  now?: string
}

/**
 * Presentational View of the `/admin/reports` list (Task 858, Container/Presentational split of
 * `AdminReportsManager`). `useTranslations` only: no state, no navigation, no server action. Status tabs
 * are Mantine `Tabs` with a count `Badge`; the list is the shared `AdminTable` adapter (table from 768px,
 * record cards below, D36). The detail dialog is the separate `ReportDetailDialogView`.
 */
export function AdminReportsView({ reports, filter, counts, onFilterChange, onSelect, now }: AdminReportsViewProps) {
  const t = useTranslations('admin.reports')
  const tl = useTranslations('listing')
  const theme = useMantineTheme()

  function statusBadge(r: ReportRow) {
    return (
      <MantineBadge variant="status" entity="report" value={r.status}>
        {t(`status_${r.status}` as Parameters<typeof t>[0])}
      </MantineBadge>
    )
  }

  const reasonLabel = (r: ReportRow) => tl(`report_reason_${r.reason}` as Parameters<typeof tl>[0])
  const reporterLabel = (r: ReportRow) => r.reporter?.name ?? t('anonymous')

  const columns: AdminTableColumn<ReportRow>[] = [
    {
      key: 'reason',
      header: t('col_reason'),
      // §7.3 (b): the status badge sits under the reason, one rhythm step (sm) apart (Task 923 R39 (c): it left its own column).
      cell: r => (
        <Stack gap="sm" align="flex-start">
          <Text size="sm" fw={500} c="gray.7">{reasonLabel(r)}</Text>
          {statusBadge(r)}
        </Stack>
      ),
    },
    {
      key: 'listing',
      header: t('col_listing'),
      // §7.3 (a)/(b): the listing title wraps in full at the table-title token width (D6);
      // the reporter is its dimmed meta line.
      width: theme.other.layout.tableTitleColumnWidth,
      wrap: true,
      cell: r => (
        <Stack gap="micro">
          <Text size="sm" c="dimmed">{r.listing?.title ?? '—'}</Text>
          <Text size="xs" c="dimmed">{reporterLabel(r)}</Text>
        </Stack>
      ),
    },
    {
      key: 'date',
      header: t('col_date'),
      cell: r => <Text size="xs" c="dimmed" component="div"><RelativeTime date={r.created_at} baseDate={now} /></Text>,
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
                      <MantineBadge variant="count" emphasis={active ? 'brand' : 'neutral'}>
                        {counts[f]}
                      </MantineBadge>
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
          // a block, like every other card title: an inline `span` made the badge row start 1px lower than the block gap.
          title: <Text size="sm" fw={500} c="gray.7" component="div">{reasonLabel(r)}</Text>,
          // R69(e), GR-3h: status and time are the card's badges row, not its subtitle.
          badges: (
            <Group gap="xs" wrap="wrap">
              {statusBadge(r)}
              {/* the same dimmed xs time the table cell shows; outside the subtitle it no longer inherits that size */}
              <Text size="xs" c="dimmed" component="span"><RelativeTime date={r.created_at} baseDate={now} /></Text>
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
