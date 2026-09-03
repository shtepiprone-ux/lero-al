'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Box, Button, Center, Group, Loader, SimpleGrid, Stack, Text, ThemeIcon, useMantineTheme } from '@mantine/core'
import { MantineDrawer } from '@/design-system/mantine/patterns'
import { ListingsActionRow } from '@/modules/listings/components/ListingsActionRow'
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
  const theme = useMantineTheme()

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
        {/* Task 782 F3 — extracted to `ListingsActionRow.tsx` so this exact wrapper markup has one
            source, consumed by both this route and its canonical `ListingsActionRow` story. */}
        <ListingsActionRow
          total={total}
          page={page}
          perPage={perPage}
          view={view}
          onViewChange={onViewChange}
          onFiltersOpen={onFiltersOpen}
          activeFiltersCount={activeFiltersCount}
          saveSearchSlot={saveSearchSlot}
        />

        {listings.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="md" ta="center">
              <ThemeIcon size="colossal" radius="2xl" color="gray" variant="light">
                <Text size="xl" component="span">🏠</Text>
              </ThemeIcon>
              <Box>
                <Text component="h3" fw={600} size="lg">
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
                  leftSection={isLoadingMore ? <Loader size={theme.other.iconSize.standard} color="gray" /> : undefined}
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
