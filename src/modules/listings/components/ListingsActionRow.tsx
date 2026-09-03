'use client'

import type { ReactNode } from 'react'
import { Box, Flex } from '@mantine/core'
import { ListingsSortBar } from '@/modules/listings/components/ListingsSortBar'

export interface ListingsActionRowProps {
  total: number
  page: number
  perPage: number
  view: 'grid' | 'list'
  onViewChange: (view: 'grid' | 'list') => void
  onFiltersOpen: () => void
  activeFiltersCount: number
  /** Real `SaveSearchButton` (app) / demo trigger (story) — positioned node, hook-free split
   *  (matches the `MantineListingContactPattern`/`favorite`/`inquiryTrigger` precedent). */
  saveSearchSlot: ReactNode
}

/**
 * Task 782 F3 — extracted from `ListingsShellView.tsx`'s previously-inline action-row markup
 * (the `Flex`/`Box` wrapper around `ListingsSortBar` + `saveSearchSlot`) so production and its
 * canonical `Patterns/Mantine/ListingsActionRow` story consume the SAME component instead of the
 * story hand-duplicating the wrapper (clause 16c). Zero behavioral change — byte-identical
 * `Flex`/`Box` props to the markup this replaces.
 *
 * Task 781R (owner decision, 2026-09-03): stacks vertically below 640px so both the sort bar and
 * the save-search trigger can each be genuinely full-width there (clause 11), without reproducing
 * the shared-nowrap-row collapse/occlusion Task 772 fixed (§3.6) — a `w="100%"` sibling next to a
 * `flex="1"` sibling in one nowrap row was exactly that defect's mechanism. Side-by-side, sort bar
 * growing to fill the remaining row, from `sm` (640px) up — unchanged from the original
 * single-row contract at that width.
 */
export function ListingsActionRow({
  total,
  page,
  perPage,
  view,
  onViewChange,
  onFiltersOpen,
  activeFiltersCount,
  saveSearchSlot,
}: ListingsActionRowProps) {
  return (
    <Flex direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }} gap="xs">
      <Box flex={{ sm: '1' }} w={{ base: '100%', sm: 'auto' }} miw={0}>
        <ListingsSortBar
          total={total}
          page={page}
          perPage={perPage}
          view={view}
          onViewChange={onViewChange}
          onFiltersOpen={onFiltersOpen}
          activeFiltersCount={activeFiltersCount}
        />
      </Box>
      {saveSearchSlot}
    </Flex>
  )
}
