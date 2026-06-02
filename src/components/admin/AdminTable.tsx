'use client'

import { type ReactNode } from 'react'
import {
  ArrowUpDown, ArrowUp, ArrowDown, EyeOff, ChevronRight, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminCardList, type StructuredCard } from '@/components/admin/AdminCardList'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// ── Default English labels per sort type ──────────────────────────────────────
function defaultSortLabels(sortType: 'text' | 'numeric' | 'date'): { asc: string; desc: string; hide: string } {
  if (sortType === 'date')    return { asc: 'Newest first',    desc: 'Oldest first',    hide: 'Hide column' }
  if (sortType === 'numeric') return { asc: 'Sort low→high',   desc: 'Sort high→low',   hide: 'Hide column' }
  return                             { asc: 'Sort A→Z',        desc: 'Sort Z→A',        hide: 'Hide column' }
}

export type AdminTableColumn<Row> = {
  key: string
  /** Column label rendered in the header. Pass a string; ReactNode is accepted for advanced cases. */
  header: ReactNode
  cell: (row: Row) => ReactNode
  visibility?: 'always' | 'sm' | 'md' | 'lg' | 'xl'
  /**
   * sortable: column header renders ⇅ ArrowUpDown (h-3 w-3 — smaller than text-sm font)
   * as a DropdownMenu trigger. Menu contains type-correct sort items.
   * Do NOT use funnel/sliders/filter icons — ArrowUpDown is the canonical affordance.
   */
  sortable?: boolean
  /** sortType: drives the sort label wording in the column menu. */
  sortType?: 'text' | 'numeric' | 'date'
  sortDirection?: 'asc' | 'desc' | null
  onSort?: (dir: 'asc' | 'desc') => void
  /**
   * hideable: adds a "Hide column" item (EyeOff icon) to the column menu.
   * The first/sticky column should NOT be hideable to prevent an all-hidden state.
   */
  hideable?: boolean
  onHideColumn?: () => void
  /**
   * sortLabels: localized sort/hide menu item labels for sq/en/uk/it.
   * Omit to use English defaults derived from sortType.
   */
  sortLabels?: { asc: string; desc: string; hide: string }
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
          <table className="w-full text-sm" aria-label={ariaLabel}>
            <thead className="sticky top-0 z-[2] bg-card">
              <tr className="border-b bg-muted/40">
                {columns.map((col, idx) => {
                  const visClass   = col.visibility ? VISIBILITY_CLASS[col.visibility] : ''
                  const alignClass = col.align ? ALIGN_CLASS[col.align] : 'text-left'
                  const isSticky   = idx === stickyIdx
                  const hasMenu    = col.sortable || col.hideable
                  const labels     = col.sortLabels ?? defaultSortLabels(col.sortType ?? 'text')

                  return (
                    <th
                      key={col.key}
                      className={cn(
                        'px-4 py-3 font-medium whitespace-nowrap text-muted-foreground',
                        alignClass,
                        visClass,
                        isSticky && 'sticky left-0 z-[1] bg-card',
                        col.className,
                      )}
                      aria-sort={
                        col.sortable
                          ? col.sortDirection === 'asc' ? 'ascending'
                          : col.sortDirection === 'desc' ? 'descending'
                          : 'none'
                          : undefined
                      }
                    >
                      {hasMenu ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className={cn(
                              'flex items-center gap-1.5 transition-colors hover:text-foreground bg-transparent border-0 p-0 font-medium cursor-pointer',
                              col.sortDirection ? 'text-foreground' : '',
                            )}
                            aria-label={`Column options: ${String(col.header)}`}
                          >
                            {col.header}
                            {/* ⇅ icon: h-3 w-3 (12px) — strictly smaller than text-sm (14px) header */}
                            <ArrowUpDown
                              className={cn(
                                'h-3 w-3 shrink-0',
                                col.sortDirection ? 'text-primary' : 'text-muted-foreground/40',
                              )}
                              aria-hidden="true"
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="min-w-40">
                            {col.sortable && (
                              <>
                                <DropdownMenuItem onClick={() => col.onSort?.('asc')}>
                                  <ArrowUp className="h-4 w-4 shrink-0" aria-hidden="true" />
                                  {labels.asc}
                                  {col.sortDirection === 'asc' && (
                                    <Check className="h-3.5 w-3.5 ml-auto shrink-0 text-primary" aria-hidden="true" />
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => col.onSort?.('desc')}>
                                  <ArrowDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                                  {labels.desc}
                                  {col.sortDirection === 'desc' && (
                                    <Check className="h-3.5 w-3.5 ml-auto shrink-0 text-primary" aria-hidden="true" />
                                  )}
                                </DropdownMenuItem>
                              </>
                            )}
                            {col.sortable && col.hideable && <DropdownMenuSeparator />}
                            {col.hideable && (
                              <DropdownMenuItem onClick={col.onHideColumn}>
                                <EyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                                {labels.hide}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : col.header}
                    </th>
                  )
                })}
                {/* Trailing chevron affordance column — only for interactive rows */}
                {onRowClick && <th className="w-8 px-2 py-3" aria-hidden="true" />}
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                loadingState ? (
                  <tr>
                    <td colSpan={columns.length + (onRowClick ? 1 : 0)}>{loadingState}</td>
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
                      {onRowClick && <td className="w-8 px-2 py-3" aria-hidden="true" />}
                    </tr>
                  ))
                )
              ) : errorState ? (
                <tr>
                  <td colSpan={columns.length + (onRowClick ? 1 : 0)} className="px-4 py-12 text-center text-muted-foreground">
                    {errorState}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (onRowClick ? 1 : 0)} className="px-4 py-12 text-center text-muted-foreground">
                    {emptyState}
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr
                    key={rowKey(row)}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'hover:bg-muted/20 cursor-pointer focus-visible:bg-muted/20 focus-visible:outline-none',
                      rowClassName?.(row),
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row) } }
                        : undefined
                    }
                  >
                    {columns.map((col, idx) => {
                      const visClass   = col.visibility ? VISIBILITY_CLASS[col.visibility] : ''
                      const alignClass = col.align ? ALIGN_CLASS[col.align] : ''
                      const isSticky   = idx === stickyIdx
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
                    {/* Trailing chevron: communicates row is interactive in table mode */}
                    {onRowClick && (
                      <td className="w-8 px-2 py-3 text-right" aria-hidden="true">
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 inline-block" />
                      </td>
                    )}
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
