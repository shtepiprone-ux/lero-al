'use client'

import { Fragment } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronRight, Mail } from 'lucide-react'
import { Box, Divider, Flex, Group, Paper, ScrollArea, SegmentedControl, Stack, Text, UnstyledButton, useMantineTheme } from '@mantine/core'
import { formatDate } from '@/lib/formatters'
import type { InquiryRow } from '@/components/admin/AdminInquiriesManager'
import type { ContactStatus } from '@/types/database'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'

export type InquiryStatusFilter = ContactStatus | 'all'
export type InquiryMailboxFilter = 'all' | 'support' | 'sales'

const STATUS_FILTERS = ['all', 'new', 'in_progress', 'closed'] as const
const MAILBOX_FILTERS = ['all', 'support', 'sales'] as const

export interface AdminInquiriesViewProps {
  /** Rows to list (already filtered by the container). */
  inquiries: InquiryRow[]
  statusFilter: InquiryStatusFilter
  mailboxFilter: InquiryMailboxFilter
  /** The mailbox filter is only offered when the route does not already scope the mailbox. */
  showMailboxFilter: boolean
  onStatusFilterChange: (filter: InquiryStatusFilter) => void
  onMailboxFilterChange: (filter: InquiryMailboxFilter) => void
  onSelect: (inquiry: InquiryRow) => void
  /** Subject line of a row (topic label, custom subject, or the raw unknown topic). */
  displaySubject: (inquiry: InquiryRow) => string
}

/**
 * Presentational View of the `/admin/inquiries/{sales,support}` list (Task 894, Container/Presentational split
 * of `AdminInquiriesManager`). `useTranslations` / `useLocale` only: no state, no server action. Filters are
 * Mantine `SegmentedControl`s in a horizontal `ScrollArea`; the list is a bordered `Paper` of full-width
 * `UnstyledButton` rows. The detail dialog is the separate `InquiryDetailDialogView`.
 */
export function AdminInquiriesView({
  inquiries,
  statusFilter,
  mailboxFilter,
  showMailboxFilter,
  onStatusFilterChange,
  onMailboxFilterChange,
  onSelect,
  displaySubject,
}: AdminInquiriesViewProps) {
  const t = useTranslations('admin.inquiries')
  const locale = useLocale()
  const theme = useMantineTheme()

  return (
    <Stack gap="lg" data-testid="admin-inquiries-manager">
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        justify="space-between"
        align={{ base: 'stretch', sm: 'center' }}
        gap="sm"
      >
        <ScrollArea type="auto" scrollbars="x" scrollbarSize={0} w={{ base: '100%', sm: 'auto' }}>
          <SegmentedControl
            value={statusFilter}
            onChange={value => onStatusFilterChange(value as InquiryStatusFilter)}
            data-testid="inquiry-status-filter"
            data={STATUS_FILTERS.map(s => ({
              value: s,
              label: s === 'all' ? t('filter_all') : t(`filter_${s}` as 'filter_new' | 'filter_in_progress' | 'filter_closed'),
            }))}
          />
        </ScrollArea>
        {showMailboxFilter && (
          <ScrollArea type="auto" scrollbars="x" scrollbarSize={0} w={{ base: '100%', sm: 'auto' }}>
            <SegmentedControl
              value={mailboxFilter}
              onChange={value => onMailboxFilterChange(value as InquiryMailboxFilter)}
              data-testid="inquiry-mailbox-filter"
              data={MAILBOX_FILTERS.map(m => ({
                value: m,
                label: m === 'all' ? t('filter_mailbox_all') : t(`filter_mailbox_${m}` as 'filter_mailbox_support' | 'filter_mailbox_sales'),
              }))}
            />
          </ScrollArea>
        )}
      </Flex>

      {inquiries.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="2xl">{t('no_inquiries')}</Text>
      ) : (
        <Paper withBorder radius="lg">
          {inquiries.map((inq, index) => {
            return (
              <Fragment key={inq.id}>
                {index > 0 && <Divider />}
                <UnstyledButton
                  type="button"
                  w="100%"
                  p="md"
                  mih={theme.other.touchTarget}
                  onClick={() => onSelect(inq)}
                  data-testid="inquiry-row"
                >
                  <Group wrap="nowrap" align="flex-start" gap="md">
                    {/* GR-3h (R74): below 640 the text block and the date row are two blocks of the records rhythm (sm);
                        from 640 they are two columns, whose horizontal gap stays xs. */}
                    <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between" gap={{ base: 'sm', sm: 'xs' }} flex={1} miw={0}>
                      <Stack gap="sm" flex={1} miw={0}>
                        <Group gap="xs" wrap="wrap">
                          <MantineBadge variant="status" entity="inquiry" value={inq.status}>
                            {t(`status_${inq.status}` as 'status_new' | 'status_in_progress' | 'status_closed')}
                          </MantineBadge>
                          <Text size="xs" c="dimmed" ff="monospace">{inq.target_mailbox}</Text>
                        </Group>
                        {/* the badge row and this text block are two blocks one rhythm step (sm) apart; the lines inside the
                            text block follow each other. GR-3i, D6: the sender's name and the e-mail wrap; nothing is cut. */}
                        <Stack gap="tight">
                          <Text size="sm" fw={500}>{displaySubject(inq)}</Text>
                          <Text size="xs" c="dimmed">{inq.name}</Text>
                          <Text size="xs" c="dimmed">{inq.email}</Text>
                        </Stack>
                      </Stack>
                      <Flex direction={{ base: 'row', sm: 'column' }} align={{ base: 'center', sm: 'flex-end' }} gap={{ base: 'md', sm: 'sm' }} flex="none">
                        <Text size="xs" c="dimmed">{formatDate(inq.created_at, locale)}</Text>
                        {inq.reply_count > 0 && (
                          <Group gap="tight" wrap="nowrap" c="dimmed">
                            <Mail size={theme.other.iconSize.badge} />
                            <Text size="xs" c="dimmed" component="span" data-testid="inquiry-reply-count">{inq.reply_count}</Text>
                          </Group>
                        )}
                      </Flex>
                    </Flex>
                    <Box c="dimmed" flex="none" display="flex" mt="tight">
                      <ChevronRight size={theme.other.iconSize.compact} />
                    </Box>
                  </Group>
                </UnstyledButton>
              </Fragment>
            )
          })}
        </Paper>
      )}
    </Stack>
  )
}
