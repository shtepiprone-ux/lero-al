'use client'

import { useState, useMemo } from 'react'
import { useStateFromProp } from '@/hooks/useStateFromProp'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AdminReportsView } from '@/components/admin/AdminReportsView'
import type { ReportStatusFilter } from '@/components/admin/reportStatusFilter'
import { ReportDetailDialog } from '@/components/admin/ReportDetailDialog'
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

interface Props {
  reports: ReportRow[]
  locale: string
  canOverrideReportStatus: boolean
  canDeleteReports: boolean
  /** Tab the list opens on (the page's parsed `?status=`). */
  initialFilter?: ReportStatusFilter
  /** The server's `now` (ISO) the relative times are measured against, so the server render and the browser's first render print the same text (Task 965). */
  now?: string
}

/**
 * Container of `/admin/reports` (Task 858): holds the loaded reports, the active tab (mirrored to
 * `?status=`) and the selected report; renders only `AdminReportsView` and, when a report is selected,
 * `ReportDetailDialog`.
 */
export function AdminReportsManager({
  reports: initial,
  locale,
  canOverrideReportStatus,
  canDeleteReports,
  initialFilter = 'pending',
  now,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [reports, setReports] = useStateFromProp<ReportRow[]>(initial)
  // A navigation to another `?status=` while the page stays mounted (e.g. the dashboard card) hands over a new initial filter.
  const [filter, setFilter] = useStateFromProp<ReportStatusFilter>(initialFilter)
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

  function handleFilterChange(f: ReportStatusFilter) {
    setFilter(f)
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.set('status', f)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function handleUpdated(id: string, status: ReportStatus) {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  function handleDeleted(id: string) {
    setReports(prev => prev.filter(r => r.id !== id))
    setSelected(null)
  }

  return (
    <>
      <AdminReportsView
        reports={filtered}
        filter={filter}
        counts={counts}
        onFilterChange={handleFilterChange}
        onSelect={setSelected}
        now={now}
      />
      {selected && (
        <ReportDetailDialog
          report={selected}
          locale={locale}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
          canOverrideReportStatus={canOverrideReportStatus}
          canDeleteReports={canDeleteReports}
          now={now}
        />
      )}
    </>
  )
}
