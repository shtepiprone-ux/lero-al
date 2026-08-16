'use client'

import { useTranslations } from 'next-intl'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Box, Button, SegmentedControl } from '@mantine/core'
import { MantineCountButton } from '@/design-system/mantine/patterns'
import { FiltersPanel } from '@/components/shared/FiltersPanel'
import type { FilterValues } from '@/modules/listings/domain/filterEngine'
import { LocationCombobox, type LocationOption } from '@/components/shared/LocationCombobox'
import { PropertyTypeCombobox } from '@/components/shared/PropertyTypeCombobox'
import type { ListingType } from '@/types/database'
import styles from './HeroSearchView.module.css'

interface HeroSearchViewProps {
  locations: LocationOption[]
  listingType: ListingType
  onListingTypeChange: (type: ListingType) => void
  propertyType: string
  onPropertyTypeChange: (value: string) => void
  locationId: string | null
  onLocationChange: (id: string | null) => void
  filters: FilterValues
  onFiltersChange: (values: FilterValues) => void
  activeFiltersCount: number
  filtersOpen: boolean
  onOpenFilters: () => void
  onCloseFilters: () => void
  onSearch: (override?: FilterValues) => void
  onLocationKeyDown: (e: React.KeyboardEvent) => void
}

// Task 568 item 0: pure presentational view — no hooks, no data fetching. Everything arrives
// via props so it stories/tests without mocking `useLocations`/`useRouter` (FiltersPanel precedent).
export function HeroSearchView({
  locations,
  listingType, onListingTypeChange,
  propertyType, onPropertyTypeChange,
  locationId, onLocationChange,
  filters, onFiltersChange,
  activeFiltersCount,
  filtersOpen, onOpenFilters, onCloseFilters,
  onSearch, onLocationKeyDown,
}: HeroSearchViewProps) {
  const t = useTranslations('common')
  const tl = useTranslations('listing')
  const th = useTranslations('home')

  return (
    <>
      <Box className="hero-search" w="100%" maw="var(--container-3xl)" mx="auto">
        {/* Task 652: §6c gray SegmentedControl, flush (0px) on top of the bar. Mobile = full-width
            50/50 (fullWidth inside a 100%-wide wrapper); desktop = content-width (fullWidth inside
            a fit-content wrapper) — CSS-based (`w` responsive prop), no hook, keeps the Task-568
            hook-free presentational contract. theme.ts already supplies the §6c look (gray-1 track,
            white active pill, shadow-xs, radius lg); only the flush bottom edge is overridden here. */}
        <Box w={{ base: '100%', sm: 'fit-content' }}>
          <SegmentedControl
            fullWidth
            mb={0}
            value={listingType}
            onChange={(value) => onListingTypeChange(value as ListingType)}
            data={(['sale', 'rent'] as ListingType[]).map((type) => ({ label: tl(type), value: type }))}
            styles={{
              root: {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                borderBottomWidth: 0,
              },
            }}
          />
        </Box>

        {/* Search bar — §6c gray track (Task 652, radius corrected Task 652 R8): `bg`/`bd` are
            Mantine style props, not Tailwind classes, because `@mantine/core/styles.css` is
            imported unlayered in `src/app/layout.tsx` (no `@layer mantine` wrapper) — component
            CSS always wins over `@layer utilities` regardless of source order (Task 650/651).
            Kept as `Box`, NOT `Paper` — Paper's own component CSS (defaultProps.radius='2xl',
            shadow, border-color) would win over any Tailwind class unconditionally (Task 650
            finding); `Box` carries no component-level defaults, so the radius/padding Tailwind
            classes below still render byte-identical. Radius must match the SegmentedControl's
            own `radius="lg"` = 8px (`var(--mantine-radius-lg)`, theme.ts). R8's literal
            `rounded-b-lg`/`sm:rounded-tr-lg` classes were VERIFIED via computed style to render
            12px, not 8px — Tailwind's `lg` here resolves through this project's LEGACY shadcn
            scale (`globals.css` `--radius-lg: var(--radius)` = 0.75rem = 12px), a different `lg`
            token than Mantine's theme radius scale (8px). Using the Mantine CSS var directly as a
            Tailwind arbitrary value is the only way to get the stated 8px target, so that is what
            renders here; flagged as a literal-classname deviation for orchestrator confirmation
            (same category as Task 650's Paper→Box correction) — see session log. Top corners
            squared on mobile (the full-width SegmentedControl now covers the entire top edge,
            incl. top-right); desktop keeps the top-right radius since the SegmentedControl stays
            content-width at top-left there (owner-confirmed, unchanged). */}
          <Box
            bg="gray.1"
            bd="1px solid var(--mantine-color-gray-2)"
            className={styles.searchCard}
            data-testid="hero-search-card"
          >
            {/* Task 572: flattened into ONE flex-wrap container (no more separate action-buttons
                <div> grouping filters+Search) so each control's own flex-basis decides its row
                placement per breakpoint. <640 and >=768 render byte-identical to before; the NEW
                640-767 (`sm`) band wraps Search alone to a second row so Location regains width
                (was crushed illegible at ~720px — owner-reported). See "Why these exact classes" in
                the Task 572 kickoff — do NOT swap any basis/grow/shrink utility for the `flex-1`
                shorthand, it fights the sm:/md: flex-basis overrides. */}
            <Box className={styles.controls} data-testid="hero-search-controls">

            <PropertyTypeCombobox
              value={propertyType}
              onChange={onPropertyTypeChange}
              className={styles.typeControl}
            />

            <LocationCombobox
              locations={locations}
              value={locationId ?? ''}
              onChange={onLocationChange}
              onKeyDown={onLocationKeyDown}
              placeholder={th('hero_placeholder_location')}
              className={styles.locationControl}
            />

            {/* Task 571: canonical MantineCountButton — owns both the label-collapse (icon-only
                <860px, so the location combobox stops losing width to the full label) and the
                active-count badge (inline rightSection pill, same look as the CountButton story's
                filled+count example). Replaces the round-1 raw Button + absolute corner <span>
                badge + relative wrapper entirely — no more Button overflow:hidden clipping risk.
                Task 572: `shrink-0` keeps it content-width and on row 1 in every band. */}
            <MantineCountButton
              variant="default"
              count={activeFiltersCount}
              iconOnlyBelow={860}
              iconOnlyAbove={640}
              onClick={onOpenFilters}
              aria-label={t('advanced_filters')}
              leftSection={<SlidersHorizontal size={16} />}
              className={styles.filtersControl}
            >
              {t('advanced_filters')}
            </MantineCountButton>

            <Button
              variant="filled"
              onClick={() => onSearch()}
              className={styles.searchControl}
              leftSection={<Search size={16} />}
            >
              {t('search')}
            </Button>
          </Box>
        </Box>
      </Box>

      <FiltersPanel
        open={filtersOpen}
        onClose={onCloseFilters}
        values={filters}
        onChange={onFiltersChange}
        onApply={onSearch}
        locations={locations}
      />
    </>
  )
}
