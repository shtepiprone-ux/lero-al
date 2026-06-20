'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ExternalLink, Loader2, Flag, Trash2, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { RelativeTime } from '@/components/shared/RelativeTime'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateReportStatusAction, deleteReportAction } from '@/modules/listings/actions/reportListing'
import { cn } from '@/lib/utils'
import type { ReportStatus, ReportReason } from '@/types/database'

export interface ReportRow {
  id: string
  listing_id: string
  user_id: string | null
  reason: ReportReason
  comment: string | null
  status: ReportStatus
  created_at: string
  listing: {
    id: string
    title: string
    slug: string
    owner: { id: string; name: string | null; user_type: string } | null
  } | null
  reporter: { id: string; name: string | null } | null
}

type StatusFilter = 'all' | ReportStatus

const FILTERS: StatusFilter[] = ['all', 'pending', 'reviewed', 'resolved', 'dismissed']

const STATUS_VARIANT: Record<ReportStatus, 'neutral' | 'warning' | 'success' | 'destructive'> = {
  pending:   'warning',
  reviewed:  'neutral',
  resolved:  'success',
  dismissed: 'destructive',
}

// ── Report detail dialog ──────────────────────────────────────────────────────

const ALL_STATUSES: ReportStatus[] = ['pending', 'reviewed', 'resolved', 'dismissed']

function ReportDetailDialog({
  report,
  locale,
  onClose,
  onUpdated,
  onDeleted,
  canOverrideReportStatus,
  canDeleteReports,
}: {
  report: ReportRow
  locale: string
  onClose: () => void
  onUpdated: (id: string, status: ReportStatus) => void
  onDeleted: (id: string) => void
  canOverrideReportStatus: boolean
  canDeleteReports: boolean
}) {
  const t = useTranslations('admin.reports')
  const tl = useTranslations('listing')
  const tc = useTranslations('common')
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

  const reasonKey = `report_reason_${report.reason}` as Parameters<typeof tl>[0]
  const listingUrl = report.listing ? `/${locale}/listings/${report.listing.slug}` : null
  const isOpen = report.status === 'pending' || report.status === 'reviewed'
  const isTerminal = report.status === 'resolved' || report.status === 'dismissed'

  const statusItems = ALL_STATUSES.map(s => ({
    value: s,
    label: t(`status_${s}` as Parameters<typeof t>[0]),
  }))

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-muted-foreground shrink-0" />
            {t('detail_title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('col_status')}</span>
            <Badge variant={STATUS_VARIANT[report.status]}>
              {t(`status_${report.status}` as Parameters<typeof t>[0])}
            </Badge>
          </div>

          {/* Reason */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('col_reason')}</span>
            <span className="font-medium">{tl(reasonKey)}</span>
          </div>

          {/* Listing */}
          <div className="flex items-start justify-between gap-2">
            <span className="text-muted-foreground shrink-0">{t('col_listing')}</span>
            {listingUrl ? (
              <Link
                href={listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium text-right flex items-center gap-1 max-w-xs truncate"
              >
                <span className="truncate">{report.listing?.title}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </Link>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>

          {/* Listing owner */}
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground">{t('col_owner')}</span>
            {report.listing?.owner ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{report.listing.owner.name ?? '—'}</span>
                <Link
                  href={`/admin/users/${report.listing.owner.id}`}
                  className="text-primary hover:underline text-xs font-medium min-h-11 flex items-center"
                >
                  {t('open_profile')}
                </Link>
              </div>
            ) : (
              <span className="text-muted-foreground">{t('owner_not_found')}</span>
            )}
          </div>

          {/* Reporter */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('col_reporter')}</span>
            <span>{report.reporter?.name ?? t('anonymous')}</span>
          </div>

          {/* Comment */}
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">{tl('report_comment_label')}</span>
            <p className={cn('rounded-xl bg-muted/40 px-3 py-2 text-sm', !report.comment && 'text-muted-foreground italic')}>
              {report.comment ?? t('no_comment')}
            </p>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>{t('col_date')}</span>
            <RelativeTime date={report.created_at} />
          </div>

          {/* Status override: free any→any Select + Apply */}
          {canOverrideReportStatus && (
            <div className="flex flex-col gap-2" data-testid="status-override-section">
              <Label className="text-xs">{t('change_status_label')}</Label>
              <div className="flex flex-col max-sm:w-full sm:flex-row gap-2">
                <Select
                  value={selectedStatus}
                  onValueChange={v => setSelectedStatus(v as ReportStatus)}
                  items={statusItems}
                >
                  <SelectTrigger variant="outline" size="sm" className="max-sm:w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_STATUSES.map(s => (
                      <SelectItem key={s} value={s}>
                        {t(`status_${s}` as Parameters<typeof t>[0])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => handleAction(selectedStatus)}
                  disabled={isPending || selectedStatus === report.status}
                  className="gap-1.5 max-sm:w-full"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
                  {t('action_apply')}
                </Button>
              </div>
            </div>
          )}

          {/* Action notes */}
          {isOpen && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">{t('notes_label')}</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t('notes_placeholder')}
                  rows={2}
                  className="rounded-xl resize-none text-sm"
                  maxLength={500}
                />
              </div>

              {/* Action buttons — standard moderator transitions */}
              <div className="flex flex-wrap gap-2 max-sm:flex-col justify-end">
                {/* eslint-disable-next-line no-restricted-syntax -- report status, not listing status */}
                {report.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('reviewed')}
                    disabled={isPending}
                    className="gap-1.5 max-sm:w-full"
                  >
                    {isPending && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
                    {t('action_review')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('dismissed')}
                  disabled={isPending}
                  className="gap-1.5 max-sm:w-full text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
                  {t('action_dismiss')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAction('resolved')}
                  disabled={isPending}
                  className="gap-1.5 max-sm:w-full"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
                  {t('action_resolve')}
                </Button>
              </div>
            </>
          )}

          {/* Reopen quick-action for terminal reports */}
          {isTerminal && canOverrideReportStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('pending')}
              disabled={isPending}
              className="gap-1.5 max-sm:w-full self-end"
              data-testid="reopen-btn"
            >
              {isPending && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
              <RotateCcw className="h-3 w-3 shrink-0" />
              {t('action_reopen')}
            </Button>
          )}

          {/* Bottom actions: delete + close */}
          <div className="flex flex-wrap gap-2 max-sm:flex-col justify-end border-t pt-3">
            {canDeleteReports && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isPending}
                className="gap-1.5 max-sm:w-full text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
                data-testid="delete-btn"
              >
                <Trash2 className="h-3 w-3 shrink-0" />
                {t('action_delete')}
              </Button>
            )}
            {!isOpen && !canOverrideReportStatus && (
              <Button variant="ghost" size="sm" onClick={onClose} className="max-sm:w-full self-end">
                {tc('close')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <Dialog open onOpenChange={open => { if (!open) setShowDeleteConfirm(false) }}>
          <DialogContent className="max-w-sm" data-testid="delete-confirm-dialog">
            <DialogHeader>
              <DialogTitle className="text-destructive">{t('confirm_delete_title')}</DialogTitle>
              <DialogDescription>{t('confirm_delete_body')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="max-sm:w-full"
              >
                {tc('cancel')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
                className="gap-1.5 max-sm:w-full"
                data-testid="confirm-delete-btn"
              >
                {isPending && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
                {t('action_confirm_delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}

// ── Main manager ──────────────────────────────────────────────────────────────

interface Props {
  reports: ReportRow[]
  locale: string
  canOverrideReportStatus: boolean
  canDeleteReports: boolean
}

export function AdminReportsManager({ reports: initial, locale, canOverrideReportStatus, canDeleteReports }: Props) {
  const t = useTranslations('admin.reports')
  const tl = useTranslations('listing')

  const [reports, setReports] = useState<ReportRow[]>(initial)
  useEffect(() => { setReports(initial) }, [initial])
  const [filter, setFilter] = useState<StatusFilter>('pending')
  const [selected, setSelected] = useState<ReportRow | null>(null)

  const filtered = useMemo(
    () => filter === 'all' ? reports : reports.filter(r => r.status === filter),
    [reports, filter]
  )

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: reports.length }
    for (const r of reports) m[r.status] = (m[r.status] ?? 0) + 1
    return m
  }, [reports])

  function handleUpdated(id: string, status: ReportStatus) {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  function handleDeleted(id: string) {
    setReports(prev => prev.filter(r => r.id !== id))
    setSelected(null)
  }

  return (
    <div data-testid="admin-reports-manager" className="flex flex-col gap-4">
      {/* Status filter tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              filter === f
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`filter_${f}` as Parameters<typeof t>[0])}
            {counts[f] ? (
              <span className={cn(
                'ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium',
                filter === f ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {counts[f]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">{t('empty')}</p>
      ) : (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-3 sm:px-5 py-3 text-left font-medium text-muted-foreground">{t('col_reason')}</th>
                <th className="px-3 sm:px-5 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">{t('col_listing')}</th>
                <th className="px-3 sm:px-5 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">{t('col_reporter')}</th>
                <th className="px-3 sm:px-5 py-3 text-left font-medium text-muted-foreground">{t('col_status')}</th>
                <th className="px-3 sm:px-5 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">{t('col_date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(report => {
                const reasonKey = `report_reason_${report.reason}` as Parameters<typeof tl>[0]
                return (
                  <tr
                    key={report.id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setSelected(report)}
                  >
                    <td className="px-3 sm:px-5 py-3 font-medium">{tl(reasonKey)}</td>
                    <td className="px-3 sm:px-5 py-3 text-muted-foreground hidden md:table-cell max-w-xs truncate">
                      {report.listing?.title ?? '—'}
                    </td>
                    <td className="px-3 sm:px-5 py-3 text-muted-foreground hidden lg:table-cell">
                      {report.reporter?.name ?? t('anonymous')}
                    </td>
                    <td className="px-3 sm:px-5 py-3">
                      <Badge variant={STATUS_VARIANT[report.status]}>
                        {t(`status_${report.status}` as Parameters<typeof t>[0])}
                      </Badge>
                    </td>
                    <td className="px-3 sm:px-5 py-3 text-muted-foreground hidden sm:table-cell">
                      <RelativeTime date={report.created_at} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail dialog */}
      {selected && (
        <ReportDetailDialog
          report={selected}
          locale={locale}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
          canOverrideReportStatus={canOverrideReportStatus}
          canDeleteReports={canDeleteReports}
        />
      )}
    </div>
  )
}
