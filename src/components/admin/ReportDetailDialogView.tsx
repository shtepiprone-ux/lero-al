'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { AlertTriangle, ExternalLink, Flag, RotateCcw, Trash2 } from 'lucide-react'
import {
  Anchor,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useMantineTheme,
} from '@mantine/core'
import { MantineModal, MantineSelect } from '@/design-system/mantine/patterns'
import { RelativeTime } from '@/components/shared/RelativeTime'
import type { ReportRow } from '@/components/admin/AdminReportsManager'
import type { ReportStatus } from '@/types/database'

export const REPORT_STATUSES: ReportStatus[] = ['pending', 'reviewed', 'resolved', 'dismissed']

/** Badge colour per report status (kickoff 858 R4): pending yellow, reviewed gray, resolved green, dismissed red. */
export const REPORT_STATUS_COLOR: Record<ReportStatus, string> = {
  pending: 'yellow',
  reviewed: 'gray',
  resolved: 'green',
  dismissed: 'red',
}

export interface ReportDetailDialogViewProps {
  report: ReportRow
  /** Locale of the listing link (`/${locale}/listings/<slug>`). */
  locale: string
  canOverrideReportStatus: boolean
  canDeleteReports: boolean
  /** A status update or delete is in flight: every action shows `loading` / disables. */
  isPending: boolean
  notes: string
  onNotesChange: (value: string) => void
  selectedStatus: ReportStatus
  onSelectedStatusChange: (status: ReportStatus) => void
  /** Delete confirmation is open (second `MantineModal` over the detail dialog). */
  showDeleteConfirm: boolean
  /** Moderator / override / reopen transition. */
  onAction: (status: ReportStatus) => void
  onRequestDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
  onClose: () => void
}

/**
 * Presentational View of the `/admin/reports` detail dialog (Task 858, Container/Presentational split of
 * `ReportDetailDialog`). `useTranslations` / `useMantineTheme` only: no state, no server action, no toast.
 * The dialog and its delete confirmation are the canonical `MantineModal` (bottom sheet below 640px).
 */
export function ReportDetailDialogView({
  report,
  locale,
  canOverrideReportStatus,
  canDeleteReports,
  isPending,
  notes,
  onNotesChange,
  selectedStatus,
  onSelectedStatusChange,
  showDeleteConfirm,
  onAction,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onClose,
}: ReportDetailDialogViewProps) {
  const t = useTranslations('admin.reports')
  const tl = useTranslations('listing')
  const tc = useTranslations('common')
  const theme = useMantineTheme()

  const reasonKey = `report_reason_${report.reason}` as Parameters<typeof tl>[0]
  const listingUrl = report.listing ? `/${locale}/listings/${report.listing.slug}` : null
  const reportStatus = report.status
  const isOpen = reportStatus === 'pending' || reportStatus === 'reviewed'
  const isTerminal = reportStatus === 'resolved' || reportStatus === 'dismissed'

  const statusItems = REPORT_STATUSES.map(s => ({
    value: s,
    label: t(`status_${s}` as Parameters<typeof t>[0]),
  }))

  const caption = (text: string) => <Text size="xs" c="dimmed">{text}</Text>

  const footer = (
    <Flex
      data-testid="report-dialog-footer"
      direction={{ base: 'column-reverse', sm: 'row' }}
      justify="space-between"
      gap="sm"
    >
      {canDeleteReports ? (
        <Button
          variant="subtle"
          color="red"
          w={{ base: '100%', sm: 'auto' }}
          leftSection={<Trash2 size={theme.other.iconSize.compact} />}
          disabled={isPending}
          onClick={onRequestDelete}
          data-testid="delete-btn"
        >
          {t('action_delete')}
        </Button>
      ) : (
        <Box visibleFrom="sm" />
      )}
      <Flex direction={{ base: 'column-reverse', sm: 'row' }} gap="sm">
        {isOpen && (
          <>
            {reportStatus === 'pending' && (
              <Button
                variant="default"
                w={{ base: '100%', sm: 'auto' }}
                loading={isPending}
                disabled={isPending}
                onClick={() => onAction('reviewed')}
              >
                {t('action_review')}
              </Button>
            )}
            <Button
              variant="outline"
              color="red"
              w={{ base: '100%', sm: 'auto' }}
              loading={isPending}
              disabled={isPending}
              onClick={() => onAction('dismissed')}
            >
              {t('action_dismiss')}
            </Button>
            <Button
              w={{ base: '100%', sm: 'auto' }}
              loading={isPending}
              disabled={isPending}
              onClick={() => onAction('resolved')}
            >
              {t('action_resolve')}
            </Button>
          </>
        )}
        {isTerminal && canOverrideReportStatus && (
          <Button
            variant="outline"
            w={{ base: '100%', sm: 'auto' }}
            leftSection={<RotateCcw size={theme.other.iconSize.compact} />}
            loading={isPending}
            disabled={isPending}
            onClick={() => onAction('pending')}
            data-testid="reopen-btn"
          >
            {t('action_reopen')}
          </Button>
        )}
        {!isOpen && !canOverrideReportStatus && (
          <Button variant="default" w={{ base: '100%', sm: 'auto' }} onClick={onClose}>
            {tc('close')}
          </Button>
        )}
      </Flex>
    </Flex>
  )

  return (
    <>
      <MantineModal
        opened
        onClose={onClose}
        title={
          <Group gap="xs" wrap="nowrap">
            <Flag size={theme.other.iconSize.standard} />
            {t('detail_title')}
          </Group>
        }
        footer={footer}
      >
        <Stack gap="lg">
          <SimpleGrid cols={2} spacing="md" verticalSpacing="md">
            <Stack gap="tight">
              {caption(t('col_status'))}
              <Box>
                <Badge variant="light" size="sm" color={REPORT_STATUS_COLOR[reportStatus]}>
                  {t(`status_${reportStatus}` as Parameters<typeof t>[0])}
                </Badge>
              </Box>
            </Stack>
            <Stack gap="tight">
              {caption(t('col_reason'))}
              <Text size="sm" fw={500}>{tl(reasonKey)}</Text>
            </Stack>
            <Stack gap="tight">
              {caption(t('col_reporter'))}
              <Text size="sm" fw={500}>{report.reporter?.name ?? t('anonymous')}</Text>
            </Stack>
            <Stack gap="tight">
              {caption(t('col_date'))}
              <Text size="sm" fw={500} component="div">
                <RelativeTime date={report.created_at} />
              </Text>
            </Stack>
          </SimpleGrid>

          <Paper withBorder radius="md" p="sm">
            <Stack gap="sm">
              {caption(t('col_listing'))}
              {listingUrl ? (
                <Anchor href={listingUrl} target="_blank" rel="noopener noreferrer" size="sm" fw={500}>
                  <Group gap="tight" wrap="nowrap" align="flex-start">
                    <Text component="span" inherit lineClamp={2}>{report.listing?.title}</Text>
                    <Box component="span" flex="none" display="flex">
                      <ExternalLink size={theme.other.iconSize.badge} />
                    </Box>
                  </Group>
                </Anchor>
              ) : (
                <Text size="sm" c="dimmed">—</Text>
              )}
              <Group justify="space-between" wrap="nowrap" align="center">
                <Stack gap="tight">
                  {caption(t('col_owner'))}
                  {report.listing?.owner ? (
                    <Text size="sm" fw={500}>{report.listing.owner.name ?? '—'}</Text>
                  ) : (
                    <Text size="sm" c="dimmed">{t('owner_not_found')}</Text>
                  )}
                </Stack>
                {report.listing?.owner && (
                  <Button
                    component={Link}
                    href={`/admin/users/${report.listing.owner.id}`}
                    variant="subtle"
                    size="compact-sm"
                  >
                    {t('open_profile')}
                  </Button>
                )}
              </Group>
            </Stack>
          </Paper>

          <Stack gap="tight">
            {caption(t('comment_label'))}
            <Paper bg="gray.0" p="sm" radius="md">
              <Text size="sm" c={report.comment ? undefined : 'dimmed'} fs={report.comment ? undefined : 'italic'}>
                {report.comment ?? t('no_comment')}
              </Text>
            </Paper>
          </Stack>

          {(isOpen || canOverrideReportStatus) && (
            <Stack gap="md">
              <Divider label={t('section_moderation')} labelPosition="left" />
              {isOpen && (
                <Textarea
                  label={t('notes_label')}
                  value={notes}
                  onChange={e => onNotesChange(e.currentTarget.value)}
                  placeholder={t('notes_placeholder')}
                  autosize
                  minRows={2}
                  maxLength={500}
                />
              )}
              {canOverrideReportStatus && (
                <Flex
                  direction={{ base: 'column', sm: 'row' }}
                  align={{ base: 'stretch', sm: 'flex-end' }}
                  gap="sm"
                  data-testid="status-override-section"
                >
                  <Box flex={{ base: 'none', sm: 1 }}>
                    <MantineSelect
                      label={t('change_status_label')}
                      data={statusItems}
                      value={selectedStatus}
                      allowDeselect={false}
                      onChange={v => { if (v) onSelectedStatusChange(v as ReportStatus) }}
                    />
                  </Box>
                  <Button
                    w={{ base: '100%', sm: 'auto' }}
                    loading={isPending}
                    disabled={isPending || selectedStatus === report.status}
                    onClick={() => onAction(selectedStatus)}
                  >
                    {t('action_apply')}
                  </Button>
                </Flex>
              )}
            </Stack>
          )}
        </Stack>
      </MantineModal>

      <MantineModal
        opened={showDeleteConfirm}
        onClose={onCancelDelete}
        title={
          <Group gap="xs" wrap="nowrap" c="red.7">
            <AlertTriangle size={theme.other.iconSize.standard} />
            <Text component="span" inherit>{t('confirm_delete_title')}</Text>
          </Group>
        }
        footer={
          <Flex direction={{ base: 'column-reverse', sm: 'row' }} gap="sm" justify={{ base: 'stretch', sm: 'flex-end' }}>
            <Button variant="outline" color="gray" w={{ base: '100%', sm: 'auto' }} disabled={isPending} onClick={onCancelDelete}>
              {tc('cancel')}
            </Button>
            <Button
              color="red"
              w={{ base: '100%', sm: 'auto' }}
              loading={isPending}
              disabled={isPending}
              onClick={onConfirmDelete}
              data-testid="confirm-delete-btn"
            >
              {t('action_confirm_delete')}
            </Button>
          </Flex>
        }
      >
        <Stack gap="md" data-testid="delete-confirm-dialog">
          <Text size="sm" c="gray.7">{t('confirm_delete_body')}</Text>
        </Stack>
      </MantineModal>
    </>
  )
}
