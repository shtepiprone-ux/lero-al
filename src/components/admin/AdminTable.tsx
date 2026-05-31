'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { AdminCardList, type StructuredCard } from '@/components/admin/AdminCardList'

export type AdminTableColumn<Row> = {
  key: string
  header: string
  cell: (row: Row) => ReactNode
  visibility?: 'always' | 'sm' | 'md' | 'lg' | 'xl'
  sortable?: boolean
  sortDirection?: 'asc' | 'desc' | null
  onSort?: () => void
  align?: 'left' | 'right' | 'center'
  className?: string
}

type AdminTableProps<Row> = {
  rows: Row[]
  columns: AdminTableColumn<Row>[]
  rowKey: (row: Row) => string
  onRowClick?: (row: Row) => void
  rowClassName?: (row: Row) => string
  stickyColumnIndex?: number
  cardRow?: (row: Row) => StructuredCard
  emptyState: ReactNode
  loading?: boolean
  loadingState?: ReactNode
  errorState?: ReactNode
  ariaLabel?: string
}

const VISIBILITY_CLASS: Record<NonNullable<AdminTableColumn<unknown>['visibility']>, string> = {
  always: '',
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
}

const ALIGN_CLASS: Record<NonNullable<AdminTableColumn<unknown>['align']>, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

export function AdminTable<Row>({
  rows,
  columns,
  rowKey,
  onRowClick,
  rowClassName,
  stickyColumnIndex = 0,
  cardRow,
  emptyState,
  loading,
  loadingState,
  errorState,
  ariaLabel,
}: AdminTableProps<Row>) {
  const stickyIdx = stickyColumnIndex

  function synthesizeCard(row: Row): StructuredCard {
    const stickyCol = columns[stickyIdx]
    const otherAlways = columns.filter(
      (c, i) => i !== stickyIdx && (c.visibility ?? 'always') === 'always',
    )
    const mdVisible = columns.filter(
      c => c.visibility === 'sm' || c.visibility === 'md',
    )

    const subtitleCols = otherAlways.slice(0, 2)
    const metaCols = [...otherAlways.slice(2), ...mdVisible]

    return {
      title: stickyCol ? stickyCol.cell(row) : null,
      subtitle: subtitleCols.length > 0 ? (
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {subtitleCols.map(c => <span key={c.key}>{c.cell(row)}</span>)}
        </div>
      ) : undefined,
      meta: metaCols.length > 0 ? (
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          {metaCols.map(c => <span key={c.key}>{c.cell(row)}</span>)}
        </div>
      ) : undefined,
    }
  }

  const resolvedCardRow = cardRow ?? synthesizeCard

  return (
    <>
      {/* ── Card mode: visible below lg: ─────────────────────────────────────── */}
      <div className="lg:hidden">
        <AdminCardList
          rows={rows}
          rowKey={rowKey}
          card={resolvedCardRow}
          onRowClick={onRowClick}
          rowClassName={rowClassName}
          emptyState={emptyState}
          loading={loading}
          loadingState={loadingState}
          ariaLabel={ariaLabel}
        />
      </div>

      {/* ── Table mode: visible at lg: and above ─────────────────────────────── */}
      <div className="hidden lg:block admin-table-scroll-wrap bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="admin-table-scroll overflow-x-auto">
          <table
            className="w-full text-sm"
            aria-label={ariaLabel}
          >
            <thead className="sticky top-0 z-[2] bg-card">
              <tr className="border-b bg-muted/40">
                {columns.map((col, idx) => {
                  const visClass = col.visibility ? VISIBILITY_CLASS[col.visibility] : ''
                  const alignClass = col.align ? ALIGN_CLASS[col.align] : 'text-left'
                  const isSticky = idx === stickyIdx
                  return (
                    <th
                      key={col.key}
                      className={cn(
                        'px-4 py-3 font-medium text-muted-foreground whitespace-nowrap',
                        alignClass,
                        visClass,
                        isSticky && 'sticky left-0 z-[1] bg-card',
                        col.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                        col.className,
                      )}
                      aria-sort={
                        col.sortable
                          ? col.sortDirection === 'asc'
                            ? 'ascending'
                            : col.sortDirection === 'desc'
                            ? 'descending'
                            : 'none'
                          : undefined
                      }
                      onClick={col.sortable ? col.onSort : undefined}
                    >
                      {col.header}
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                loadingState ? (
                  <tr>
                    <td colSpan={columns.length}>{loadingState}</td>
                  </tr>
                ) : (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {columns.map(col => (
                        <td
                          key={col.key}
                          className={cn('px-4 py-3', col.visibility ? VISIBILITY_CLASS[col.visibility] : '')}
                        >
                          <div className="h-4 bg-muted rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                )
              ) : errorState ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                    {errorState}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                    {emptyState}
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr
                    key={rowKey(row)}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'hover:bg-muted/20 cursor-pointer',
                      rowClassName?.(row),
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col, idx) => {
                      const visClass = col.visibility ? VISIBILITY_CLASS[col.visibility] : ''
                      const alignClass = col.align ? ALIGN_CLASS[col.align] : ''
                      const isSticky = idx === stickyIdx
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            'px-4 py-3',
                            alignClass,
                            visClass,
                            isSticky && 'sticky left-0 z-[1] bg-card',
                            col.className,
                          )}
                        >
                          {col.cell(row)}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
