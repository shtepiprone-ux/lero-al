'use client'

import { useTranslations } from 'next-intl'
import {
  CheckCircleIcon,
  CloseCircleIcon,
  EyeIcon,
  RestartIcon,
  SquareArrowRightUpIcon,
  TrashBinTrashIcon,
  UserIcon,
} from '@solar-icons/react/broken'
import { Box, Button, Text, Textarea, useMantineTheme } from '@mantine/core'
import { MantineSelect } from '@/design-system/mantine/patterns/MantineSelect'
import { MantineModal } from '@/design-system/mantine/patterns/MantineModal'
import { MantineDialogSections, MantineDialogSection } from '@/design-system/mantine/patterns/MantineDialogSections'
import { MantineDetailList } from '@/design-system/mantine/patterns/MantineDetailList'
import { MantineNavRowList, type MantineNavRow } from '@/design-system/mantine/patterns/MantineNavRowList'
import { MantineDialogFooter } from '@/design-system/mantine/patterns/MantineDialogFooter'
import { MantineDeleteConfirmModal } from '@/design-system/mantine/patterns/MantineDeleteConfirmModal'
import { RelativeTime } from '@/components/shared/RelativeTime'
import type { ReportRow } from '@/components/admin/AdminReportsManager'
import type { ReportStatus } from '@/types/database'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'

export const REPORT_STATUSES: ReportStatus[] = ['pending', 'reviewed', 'resolved', 'dismissed']

export interface ReportDetailDialogViewProps {
  report: ReportRow
  /** Locale of the listing link (`/${locale}/listings/<slug>`). */
  locale: string
  canOverrideReportStatus: boolean
  canDeleteReports: boolean
  /** The server's `now` (ISO): relative times are measured against it (Task 965). */
  now?: string
  /** A status update or delete is in flight: every action shows `loading` / disables. */
  isPending: boolean
  notes: string
  onNotesChange: (value: string) => void
  selectedStatus: ReportStatus
  onSelectedStatusChange: (status: ReportStatus) => void
  /** Delete confirmation is open (the canonical `MantineDeleteConfirmModal` over the detail dialog). */
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
 * `ReportDetailDialog`; Task 859 Revision 2, R29: the canonical dialog anatomy, §23.7). A structured `MantineModal`
 * (bottom sheet below 640px): the facts as `MantineDetailList`, the comment, the moderation section (notes, the
 * status override as a select) and navigation rows for the secondary moderation actions (review, dismiss, apply) and
 * the links (listing, owner profile). The footer is a `MantineDialogFooter` pair: Delete (the resting destructive
 * action) and the one primary of the state (Resolve, Reopen or Close). The delete confirmation is the canonical
 * `MantineDeleteConfirmModal`. `useTranslations` / `useMantineTheme` only: no state, no server action, no toast.
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
  now,
}: ReportDetailDialogViewProps) {
  const t = useTranslations('admin.reports')
  const tl = useTranslations('listing')
  const tc = useTranslations('common')
  const theme = useMantineTheme()
  const iconSize = theme.other.iconSize.standard

  const reasonKey = `report_reason_${report.reason}` as Parameters<typeof tl>[0]
  const listingUrl = report.listing ? `/${locale}/listings/${report.listing.slug}` : null
  const reportStatus = report.status
  const isOpen = reportStatus === 'pending' || reportStatus === 'reviewed'
  const isTerminal = reportStatus === 'resolved' || reportStatus === 'dismissed'

  const statusItems = REPORT_STATUSES.map(s => ({
    value: s,
    label: t(`status_${s}` as Parameters<typeof t>[0]),
  }))

  const actionRow = (key: string, icon: MantineNavRow['icon'], label: string, status: ReportStatus): MantineNavRow => ({
    key,
    icon,
    label,
    onClick: () => { if (!isPending) onAction(status) },
  })

  const moderationRows: MantineNavRow[] = [
    ...(reportStatus === 'pending'
      ? [actionRow('review', <EyeIcon size={iconSize} aria-hidden="true" />, t('action_review'), 'reviewed')]
      : []),
    ...(isOpen
      ? [actionRow('dismiss', <CloseCircleIcon size={iconSize} aria-hidden="true" />, t('action_dismiss'), 'dismissed')]
      : []),
    ...(canOverrideReportStatus && selectedStatus !== report.status
      ? [actionRow('apply', <CheckCircleIcon size={iconSize} aria-hidden="true" />, t('action_apply'), selectedStatus)]
      : []),
  ]

  const linkRows: MantineNavRow[] = [
    ...(listingUrl && report.listing
      ? [{
          key: 'listing',
          icon: <SquareArrowRightUpIcon size={iconSize} aria-hidden="true" />,
          label: report.listing.title,
          description: t('col_listing'),
          href: listingUrl,
          external: true,
        }]
      : []),
    ...(report.listing?.owner
      ? [{
          key: 'owner',
          icon: <UserIcon size={iconSize} aria-hidden="true" />,
          label: t('open_profile'),
          href: `/admin/users/${report.listing.owner.id}`,
        }]
      : []),
  ]

  const primary = isOpen ? (
    <Button type="button" loading={isPending} disabled={isPending} onClick={() => onAction('resolved')}>
      {t('action_resolve')}
    </Button>
  ) : isTerminal && canOverrideReportStatus ? (
    <Button
      type="button"
      leftSection={<RestartIcon size={iconSize} aria-hidden="true" />}
      loading={isPending}
      disabled={isPending}
      onClick={() => onAction('pending')}
      data-testid="reopen-btn"
    >
      {t('action_reopen')}
    </Button>
  ) : (
    <Button type="button" variant="default" onClick={onClose}>
      {tc('close')}
    </Button>
  )

  const footer = (
    <MantineDialogFooter
      secondary={
        canDeleteReports ? (
          <Button
            type="button"
            variant="default"
            c="red.7"
            leftSection={<TrashBinTrashIcon size={iconSize} aria-hidden="true" />}
            disabled={isPending}
            onClick={onRequestDelete}
            data-testid="delete-btn"
          >
            {t('action_delete')}
          </Button>
        ) : undefined
      }
      primary={primary}
    />
  )

  return (
    <>
      <MantineModal
        opened
        onClose={onClose}
        structured
        title={t('detail_title')}
        description={tl(reasonKey)}
        footer={footer}
        covered={showDeleteConfirm}
      >
        <MantineDialogSections>
          <MantineDialogSection>
            <MantineDetailList
              items={[
                {
                  label: t('col_status'),
                  value: (
                    <MantineBadge variant="status" entity="report" value={reportStatus}>
                      {t(`status_${reportStatus}` as Parameters<typeof t>[0])}
                    </MantineBadge>
                  ),
                },
                { label: t('col_reason'), value: tl(reasonKey) },
                { label: t('col_reporter'), value: report.reporter?.name ?? t('anonymous') },
                { label: t('col_date'), value: <RelativeTime date={report.created_at} baseDate={now} /> },
                {
                  label: t('col_owner'),
                  value: report.listing?.owner ? (report.listing.owner.name ?? '—') : t('owner_not_found'),
                },
              ]}
            />
          </MantineDialogSection>

          <MantineDialogSection title={t('comment_label')}>
            <Text size="sm" c={report.comment ? undefined : 'dimmed'} fs={report.comment ? undefined : 'italic'}>
              {report.comment ?? t('no_comment')}
            </Text>
          </MantineDialogSection>

          {(isOpen || canOverrideReportStatus) && (
            <MantineDialogSection title={t('section_moderation')}>
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
                <Box data-testid="status-override-section">
                  <MantineSelect
                    label={t('change_status_label')}
                    data={statusItems}
                    value={selectedStatus}
                    allowDeselect={false}
                    onChange={v => { if (v) onSelectedStatusChange(v as ReportStatus) }}
                  />
                </Box>
              )}
              {moderationRows.length > 0 && <MantineNavRowList items={moderationRows} />}
            </MantineDialogSection>
          )}

          {linkRows.length > 0 && (
            <MantineDialogSection>
              <MantineNavRowList items={linkRows} />
            </MantineDialogSection>
          )}
        </MantineDialogSections>
      </MantineModal>

      <MantineDeleteConfirmModal
        opened={showDeleteConfirm}
        onClose={onCancelDelete}
        title={t('confirm_delete_title')}
        message={t('confirm_delete_body')}
        confirmLabel={t('action_confirm_delete')}
        cancelLabel={tc('cancel')}
        loading={isPending}
        onConfirm={onConfirmDelete}
        confirmTestId="confirm-delete-btn"
        bodyTestId="delete-confirm-dialog"
      />
    </>
  )
}
