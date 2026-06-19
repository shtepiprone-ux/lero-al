'use client'

import { type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StructuredCard = {
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  trailing?: ReactNode
}

function isStructuredCard(result: unknown): result is StructuredCard {
  return result !== null && typeof result === 'object' && 'title' in (result as object)
}

type AdminCardListProps<Row> = {
  rows: Row[]
  rowKey: (row: Row) => string
  card: (row: Row) => StructuredCard | ReactNode
  onRowClick?: (row: Row) => void
  rowClassName?: (row: Row) => string
  emptyState: ReactNode
  loading?: boolean
  loadingState?: ReactNode
  ariaLabel?: string
  compact?: boolean
}

export function AdminCardList<Row>({
  rows,
  rowKey,
  card,
  onRowClick,
  rowClassName,
  emptyState,
  loading,
  loadingState,
  ariaLabel,
  compact = false,
}: AdminCardListProps<Row>) {
  const padding = compact ? 'p-3' : 'p-4'

  if (loading) {
    return (
      <div data-testid="admin-card-list" className="divide-y rounded-2xl border bg-card" aria-label={ariaLabel}>
        {loadingState ?? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn(padding, 'animate-pulse space-y-2')}>
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          ))
        )}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div data-testid="admin-card-list" className="rounded-2xl border bg-card px-4 py-12 text-center text-sm text-muted-foreground" aria-label={ariaLabel}>
        {emptyState}
      </div>
    )
  }

  return (
    <div data-testid="admin-card-list" className="divide-y rounded-2xl border bg-card" aria-label={ariaLabel}>
      {rows.map(row => {
        const cardContent = card(row)
        return (
          <div
            key={rowKey(row)}
            className={cn(
              padding,
              onRowClick && 'cursor-pointer hover:bg-muted/30 transition-colors',
              rowClassName?.(row),
            )}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            role={onRowClick ? 'button' : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onKeyDown={
              onRowClick
                ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row) } }
                : undefined
            }
          >
            {isStructuredCard(cardContent) ? (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm leading-snug">{cardContent.title}</div>
                  {cardContent.subtitle && (
                    <div className="mt-1">{cardContent.subtitle}</div>
                  )}
                  {cardContent.meta && (
                    <div className="mt-0.5">{cardContent.meta}</div>
                  )}
                </div>
                {/* Trailing slot: explicit trailing takes precedence; auto-chevron for interactive rows */}
                <div className="shrink-0 self-center">
                  {cardContent.trailing ?? (onRowClick
                    ? <ChevronRight className="h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
                    : null)}
                </div>
              </div>
            ) : (
              cardContent
            )}
          </div>
        )
      })}
    </div>
  )
}
