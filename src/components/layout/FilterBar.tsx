'use client'

// 'use client' required: FilterBar owns Sheet open-state (useState) and imports
// sheet.tsx which is itself a client component. See docs/design-system.md §11.1
// and Task 349 DS-4 kickoff Decision D3.

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
  filters: ReactNode
  search?: ReactNode
  activeCount?: number
  onReset?: () => void
  labels: FilterBarLabels
  className?: string
}

export function FilterBar({
  filters,
  search,
  activeCount = 0,
  onReset,
  labels,
  className,
}: FilterBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const isActive = activeCount > 0

  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center', className)}>
      {/* lg:+ inline filter cluster — all-or-nothing (Decision D1); hidden on mobile */}
      <div className="hidden min-w-0 flex-wrap items-center gap-2 lg:flex">
        {filters}
      </div>

      {/* Search slot — full-width row below sm; flex-1 in row from sm upward (§11.2) */}
      {search && (
        <div className="min-w-0 w-full sm:flex-1">
          {search}
        </div>
      )}

      {/* lg:+ only: count Badge + single global Reset — inline, end-aligned (Decision D2) */}
      {isActive && (
        <>
          <Badge variant="secondary" className="hidden shrink-0 lg:inline-flex">
            {activeCount}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={onReset}
            className="hidden lg:inline-flex"
          >
            {labels.reset}
          </Button>
        </>
      )}

      {/* <lg: Sheet trigger — hidden at lg:+; carries count Badge when active (Decision D1 + D2) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger
          render={
            <Button
              size="xl"
              variant="outline"
              className="w-full gap-2 sm:w-auto lg:hidden"
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

          {/* Filter controls — entire filters node placed here at <lg: (Decision D1) */}
          <div className="flex-1 overflow-y-auto p-4">
            {filters}
          </div>

          {/* Reset in SheetFooter only when active (Decision D2) */}
          {isActive && (
            <SheetFooter>
              <Button
                size="xl"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  onReset?.()
                  setSheetOpen(false)
                }}
              >
                {labels.reset}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
