import type { ReportStatus } from '@/types/database'

export type ReportStatusFilter = 'all' | ReportStatus

export const REPORT_FILTERS: ReportStatusFilter[] = ['all', 'pending', 'reviewed', 'resolved', 'dismissed']

/**
 * Parses the `?status=` search param of `/admin/reports` (Task 858): a valid tab value maps to itself; a
 * missing, unknown or repeated (array) value maps to `'pending'`, the tab the page always opened on.
 * A plain module (no `'use client'`) so the server `page.tsx` can call it.
 */
export function parseReportStatusParam(value: string | string[] | undefined): ReportStatusFilter {
  return typeof value === 'string' && (REPORT_FILTERS as string[]).includes(value)
    ? (value as ReportStatusFilter)
    : 'pending'
}
