'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Box, Button, Center, Flex, Group, Loader, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core'
import { MantineDrawer } from '@/design-system/mantine/patterns'
import { ListingsSortBar } from '@/modules/listings/components/ListingsSortBar'
import { ListingsPagination } from '@/modules/listings/components/ListingsPagination'
import { ListingCard, type CardListingData } from '@/modules/listings/components/ListingCard'
import { ActiveFilterChips } from '@/modules/listings/components/ActiveFilterChips'
import { ListingsStatusTabs } from '@/modules/listings/components/ListingsStatusTabs'
import { ListingsFilterBar } from '@/modules/listings/components/ListingsFilterBar'
import type { ExchangeRates } from '@/lib/getExchangeRate'

interface Location {
  id: number
  name_al: string
  type: string
}

export interface ListingsShellViewProps {
  listings: CardListingData[]
  total: number
  page: number
  perPage: number
  locations: Location[]
  tab: 'active' | 'closed'
  activeFiltersCount: number
  displayCurrency: string
  rates: ExchangeRates | null
  favoriteIds: ReadonlySet<string>
  view: 'grid' | 'list'
  filtersOpen: boolean
  isLoadingMore: boolean
  showLoadMore: boolean
  onViewChange: (view: 'grid' | 'list') => void
  onFiltersOpenChange: (open: boolean) => void
  onFiltersOpen: () => void
  onShowMore: () => void
  onBeforeNavigate: (slug: string) => void
  onFavoriteToggled: (listingId: string, newState: boolean) => void
  filtersSlot: ReactNode
  saveSearchSlot: ReactNode
}

export function ListingsShellView({
  listings,
  total,
  page,
  perPage,
  locations,
  tab,
  activeFiltersCount,
  displayCurrency,
  rates,
  favoriteIds,
  view,
  filtersOpen,
  isLoadingMore,
  showLoadMore,
  onViewChange,
  onFiltersOpenChange,
  onFiltersOpen,
  onShowMore,
  onBeforeNavigate,
  onFavoriteToggled,
  filtersSlot,
  saveSearchSlot,
}: ListingsShellViewProps) {
  const t = useTranslations('listing')

  return (
    <Stack gap={0} className="listings-shell">
      {/* ── Horizontal filter bar (sm+, 640px); hidden below sm, where the compact drawer-trigger
          button in `ListingsSortBar` takes over (owner decision, Task 781R, 2026-09-03: filters
          must be visible inline the same as desktop from 640px up, not gated behind a drawer
          until 768px) ── */}
      <Box visibleFrom="sm">
        <ListingsFilterBar
          locations={locations}
          onFiltersOpen={onFiltersOpen}
        />
      </Box>

      {/* ── Filters Drawer (full panel — mobile + "More filters" on desktop) ── */}
      <MantineDrawer opened={filtersOpen} onClose={() => onFiltersOpenChange(false)} side="left" size="xs">
        {filtersSlot}
      </MantineDrawer>

      {/* ── Main content ── */}
      <Stack gap={0} mt="md" flex="1" miw={0}>
        <ListingsStatusTabs />
        <ActiveFilterChips locations={locations} />
        {/* Task 781R (owner decision, 2026-09-03): stacks vertically below 640px so both the sort
            bar and the save-search trigger can each be genuinely full-width there (clause 11),
            without reproducing the shared-nowrap-row collapse/occlusion Task 772 fixed (§3.6) —
            a `w="100%"` sibling next to a `flex="1"` sibling in one nowrap row was exactly that
            defect's mechanism. Side-by-side, sort bar growing to fill the remaining row, from
            `sm` (640px) up — unchanged from the original single-row contract at that width. */}
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

        {listings.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="md" ta="center">
              <ThemeIcon size={64} radius="2xl" color="gray" variant="light">
                <Text size="xl" component="span">🏠</Text>
              </ThemeIcon>
              <Box>
                <Text fw={600} size="lg">
                  {tab === 'closed' ? t('no_results_closed') : t('no_results_title')}
                </Text>
                {tab === 'active' && (
                  <Text c="gray.5" size="sm" mt="xs">{t('no_results_desc')}</Text>
                )}
              </Box>
            </Stack>
          </Center>
        ) : (
          <>
            {view === 'grid' ? (
              <SimpleGrid cols={{ base: 1, sm: 2, xl: 3, xxl: 4 }} spacing="lg" pt="lg">
                {listings.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    variant="vertical"
                    onBeforeNavigate={onBeforeNavigate}
                    displayCurrency={displayCurrency}
                    rates={rates}
                    isFavorited={favoriteIds.has(listing.id)}
                    onFavoriteToggled={(newState) => onFavoriteToggled(listing.id, newState)}
                    layoutContext="sidebar"
                  />
                ))}
              </SimpleGrid>
            ) : (
              <Stack gap="sm" pt="lg">
                {listings.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    variant="horizontal"
                    onBeforeNavigate={onBeforeNavigate}
                    displayCurrency={displayCurrency}
                    rates={rates}
                    isFavorited={favoriteIds.has(listing.id)}
                    onFavoriteToggled={(newState) => onFavoriteToggled(listing.id, newState)}
                  />
                ))}
              </Stack>
            )}

            {showLoadMore && (
              <Group justify="center" pt="2xl">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onShowMore}
                  disabled={isLoadingMore}
                  w={{ base: '100%', sm: 'auto' }}
                  miw={{ sm: 192 }}
                  leftSection={isLoadingMore ? <Loader size={16} color="gray" /> : undefined}
                >
                  {t('show_more')}
                </Button>
              </Group>
            )}

            <ListingsPagination
              total={total}
              page={page}
              perPage={perPage}
            />
          </>
        )}
      </Stack>
    </Stack>
  )
}
