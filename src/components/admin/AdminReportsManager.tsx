'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ExternalLink, Loader2, Flag } from 'lucide-react'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { updateReportStatusAction } from '@/modules/listings/actions/reportListing'
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

function ReportDetailDialog({
  report,
  locale,
  onClose,
  onUpdated,
}: {
  report: ReportRow
  locale: string
  onClose: () => void
  onUpdated: (id: string, status: ReportStatus) => void
}) {
  const t = useTranslations('admin.reports')
  const tl = useTranslations('listing')
  const tc = useTranslations('common')
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState('')

  function handleAction(newStatus: ReportStatus) {
    startTransition(async () => {
      const result = await updateReportStatusAction(report.id, newStatus, notes)
      if (result.error) {
        toast.error(t('error_update_failed'))
        return
      }
      toast.success(t('success_updated'))
      onUpdated(report.id, newStatus)
      onClose()
    })
  }

  const reasonKey = `report_reason_${report.reason}` as Parameters<typeof tl>[0]
  const listingUrl = report.listing ? `/${locale}/listings/${report.listing.slug}` : null

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

          {/* Action notes */}
          {/* eslint-disable-next-line no-restricted-syntax -- report status, not listing status */}
          {report.status === 'pending' || report.status === 'reviewed' ? (
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

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 justify-end">
                {/* eslint-disable-next-line no-restricted-syntax -- report status, not listing status */}
                {report.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('reviewed')}
                    disabled={isPending}
                    className="gap-1.5"
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
                  className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
                  {t('action_dismiss')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAction('resolved')}
                  disabled={isPending}
                  className="gap-1.5"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
                  {t('action_resolve')}
                </Button>
              </div>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={onClose} className="self-end">
              {tc('close')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main manager ──────────────────────────────────────────────────────────────

interface Props {
  reports: ReportRow[]
  locale: string
}

export function AdminReportsManager({ reports: initial, locale }: Props) {
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

  return (
    <div className="flex flex-col gap-4">
      {/* Status filter tabs */}
      <div className="flex gap-1 border-b">
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
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">{t('col_reason')}</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">{t('col_listing')}</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">{t('col_reporter')}</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">{t('col_status')}</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">{t('col_date')}</th>
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
                    <td className="px-5 py-3 font-medium">{tl(reasonKey)}</td>
                    <td className="px-5 py-3 text-muted-foreground hidden md:table-cell max-w-xs truncate">
                      {report.listing?.title ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground hidden lg:table-cell">
                      {report.reporter?.name ?? t('anonymous')}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={STATUS_VARIANT[report.status]}>
                        {t(`status_${report.status}` as Parameters<typeof t>[0])}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
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
        />
      )}
    </div>
  )
}
