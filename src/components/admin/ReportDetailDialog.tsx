'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'
import { ReportDetailDialogView } from '@/components/admin/ReportDetailDialogView'
import type { ReportRow } from '@/components/admin/AdminReportsManager'
import { updateReportStatusAction, deleteReportAction } from '@/modules/listings/actions/reportListing'
import type { ReportStatus } from '@/types/database'

interface ReportDetailDialogProps {
  report: ReportRow
  locale: string
  onClose: () => void
  onUpdated: (id: string, status: ReportStatus) => void
  onDeleted: (id: string) => void
  canOverrideReportStatus: boolean
  canDeleteReports: boolean
}

/**
 * Container of the `/admin/reports` detail dialog (Task 858, extracted from `AdminReportsManager`). Holds the
 * notes / selected-status / delete-confirm state and the two server actions with their mapped toasts;
 * renders only `ReportDetailDialogView`.
 */
export function ReportDetailDialog({
  report,
  locale,
  onClose,
  onUpdated,
  onDeleted,
  canOverrideReportStatus,
  canDeleteReports,
}: ReportDetailDialogProps) {
  const t = useTranslations('admin.reports')
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus>(report.status)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const ERROR_KEYS: Record<string, string> = {
    forbidden: 'error_forbidden',
    unauthorized: 'error_unauthorized',
    conflict: 'error_conflict',
    not_found: 'error_not_found',
  }

  function handleAction(newStatus: ReportStatus) {
    startTransition(async () => {
      const result = await updateReportStatusAction(report.id, newStatus, notes)
      if (result.error) {
        toast.error(t((ERROR_KEYS[result.error] ?? 'error_update_failed') as Parameters<typeof t>[0]))
        return
      }
      toast.success(t('success_updated'))
      onUpdated(report.id, newStatus)
      onClose()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteReportAction(report.id)
      if (result.error) {
        toast.error(t((ERROR_KEYS[result.error] ?? 'error_delete_failed') as Parameters<typeof t>[0]))
        setShowDeleteConfirm(false)
        return
      }
      toast.success(t('success_deleted'))
      onDeleted(report.id)
      setShowDeleteConfirm(false)
      onClose()
    })
  }

  return (
    <ReportDetailDialogView
      report={report}
      locale={locale}
      canOverrideReportStatus={canOverrideReportStatus}
      canDeleteReports={canDeleteReports}
      isPending={isPending}
      notes={notes}
      onNotesChange={setNotes}
      selectedStatus={selectedStatus}
      onSelectedStatusChange={setSelectedStatus}
      showDeleteConfirm={showDeleteConfirm}
      onAction={handleAction}
      onRequestDelete={() => setShowDeleteConfirm(true)}
      onCancelDelete={() => setShowDeleteConfirm(false)}
      onConfirmDelete={handleDelete}
      onClose={onClose}
    />
  )
}
