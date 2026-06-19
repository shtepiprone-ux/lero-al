'use client'

// 'use client' required: FilterBar owns Sheet open-state (useState) and imports
// sheet.tsx which is itself a client component. See docs/design-system.md §11.1

import { useState } from 'react'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

type FilterBarLabels = {
  filters: string
  reset: string
  close?: string
}

type FilterBarProps = {
  /**
   * Slot A — search row (top, full content width at all breakpoints).
   * Required by the canonical desktop hierarchy (AC1).
   */
  search?: ReactNode
  /**
   * Slot B — currently-applied filter chips.
   * Desktop (≥1024): row 2, grouped with count Badge + Reset (AC2/AC3).
   * <1024: rendered inside the Sheet (section 1).
   */
  activeFilters?: ReactNode
  /**
   * Slot C — available / refinement filter controls.
   * Desktop (≥1024): row 3 (AC2).
   * <1024: rendered inside the Sheet (section 2).
   */
  availableFilters?: ReactNode
  /**
   * Legacy single-slot (used when activeFilters/availableFilters are not provided).
   * Desktop (≥1024): rendered inline (old behavior).
   * <1024: rendered inside the Sheet.
   */
  filters?: ReactNode
  activeCount?: number
  onReset?: () => void
  labels: FilterBarLabels
  className?: string
}

export function FilterBar({
  search,
  activeFilters,
  availableFilters,
  filters,
  activeCount = 0,
  onReset,
  labels,
  className,
}: FilterBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const isActive = activeCount > 0
  const hasNewSlots = activeFilters !== undefined || availableFilters !== undefined

  // Sheet body: new slots get a column layout with gap so sections are visually separated
  const sheetBody = hasNewSlots ? (
    <div className="flex flex-col gap-4">
      {activeFilters && <div className="flex flex-wrap gap-2">{activeFilters}</div>}
      {availableFilters && <div className="flex flex-wrap gap-2">{availableFilters}</div>}
    </div>
  ) : filters

  return (
    <div data-testid="filter-bar" className={cn('flex flex-col gap-3', className)}>

      {/* ── Row 1: Sheet trigger (hidden ≥1024) + Search ─────────────────────── */}
      {/* <640: stacked full-width. 640–1023: inline row.
          ≥1024: only search visible (trigger hidden via lg:hidden). */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center [&>*]:max-sm:w-full">

        {/* Sheet trigger — visible at <1024 */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={
              <Button
                size="xl"
                variant="outline"
                className="gap-2 lg:hidden"
              />
            }
          >
            {labels.filters}
            {isActive && (
              <Badge variant="secondary" className="shrink-0">
                {activeCount}
              </Badge>
            )}
          </SheetTrigger>

          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>{labels.filters}</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              {sheetBody}
            </div>
            {isActive && (
              <SheetFooter>
                <Button
                  size="xl"
                  variant="ghost"
                  className="w-full"
                  onClick={() => { onReset?.(); setSheetOpen(false) }}
                >
                  {labels.reset}
                </Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>

        {/* Search — full-width at <640; flex-1 at 640–1023; full row at ≥1024 */}
        {search && (
          <div className="min-w-0 w-full sm:flex-1 lg:flex-none lg:w-full">
            {search}
          </div>
        )}
      </div>

      {/* ── Row 2 (≥1024): active filters + count Badge + Reset ──────────────── */}
      {/* Hidden at <1024 — these controls live in the Sheet below 1024. */}
      {hasNewSlots && (activeFilters || isActive) && (
        <div className="hidden lg:flex lg:flex-wrap lg:items-center lg:gap-2">
          {activeFilters}
          {isActive && (
            <span className="inline-flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className="shrink-0">{activeCount}</Badge>
              <Button
                size="xl"
                variant="ghost"
                onClick={onReset}
                className="shrink-0"
              >
                {labels.reset}
              </Button>
            </span>
          )}
        </div>
      )}

      {/* ── Row 3 (≥1024): available filters ─────────────────────────────────── */}
      {hasNewSlots && availableFilters && (
        <div className="hidden lg:flex lg:flex-wrap lg:gap-2">
          {availableFilters}
        </div>
      )}

      {/* ── Legacy row (≥1024, no new slots): filters inline + count + Reset ─── */}
      {!hasNewSlots && filters && (
        <div className="hidden lg:flex lg:flex-wrap lg:items-start lg:gap-2">
          {filters}
          {isActive && (
            <span className="inline-flex items-center gap-2 shrink-0 lg:self-center">
              <Badge variant="secondary" className="shrink-0">{activeCount}</Badge>
              <Button
                size="xl"
                variant="ghost"
                onClick={onReset}
                className="shrink-0"
              >
                {labels.reset}
              </Button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
