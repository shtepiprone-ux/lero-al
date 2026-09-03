'use client'

/**
 * ListingsFilterBar — horizontal filter bar for the listings page (E.1 / Task 131; Mantine
 * migration Task 779; responsive layout rework Task 780).
 *
 * Route visibility (sm+, 640px — Task 781R) lives in the host (`ListingsShellView` wraps this in
 * `<Box visibleFrom="sm">`) — the component itself carries no visibility gate, so it renders
 * real UI at every Storybook viewport (Task 779 §3.5/§3.6).
 *
 * Layout contract (Task 780, corrected Task 780R): every non-toggle-set control is full-width
 * below `sm` and content-width from `sm` onward — the width cascade runs Stack (plain block,
 * full-width by default; carries no `w`/`me`/`ms`/`mr`/`ml`) → outer Group (stretch) →
 * left-controls Group / nested listing-type Group / right-actions Group (explicit
 * `w={{ base: '100%', sm: 'auto' }}`) → each leaf Button/Indicator. The right-actions Group
 * additionally carries `ms={{ sm: 'auto' }}` (logical `margin-inline-start: auto`) so its right
 * edge stays pinned to the bar's right edge even when it wraps onto its own row between
 * ~768–1024px, where a lone flex item on a wrapped line is not affected by the row's own
 * `justify-content` — only an auto margin on the item itself reliably pushes it to the far edge.
 *
 * The advanced-filters `Indicator` badge is an absolutely-positioned corner element that overhangs
 * its own `Button` by design (Mantine `top-end` default, `translate-x: 50%` — Task 779 §3.7; its
 * `size`/`offset`/`position` are never overridden here). Task 780 first "fixed" the resulting
 * document-edge overflow with a `me="sm"` inset on this `Stack` — but that inset was
 * production-visible (it shipped through `ListingsShellView` onto the real route, offsetting the
 * bar from every sibling) to solve a defect that only exists in Storybook's own zero-gutter
 * `layout:'fullscreen'` story rendering. Task 780R (review rework) withdrew it: the overhang is
 * now absorbed by a Mantine-native container in the STORY file itself, mirroring the gutter
 * production already supplies via `ListingsPageFrame.tsx`. This component carries no
 * compensating margin/padding/inset of any kind.
 *
 * All filter state routes through useListingsUrlFilters → filterEngine.ts.
 * No new filter logic — existing primitives only.
 */

import { SlidersHorizontal, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Box, Button, Divider, Group, Indicator, Stack, useMantineTheme } from '@mantine/core'
import { MantineCombobox } from '@/design-system/mantine/patterns'
import { LocationCombobox } from '@/components/shared/LocationCombobox'
import { useListingsUrlFilters } from '@/modules/listings/hooks/useListingsUrlFilters'

interface Location { id: number; name_al: string; type: string }

interface Props {
  locations: Location[]
  /** Opens the full-filters Drawer (same handler used by mobile sort bar) */
  onFiltersOpen: () => void
}

const FULL_BELOW_SM = { base: '100%', sm: 'auto' } as const

export function ListingsFilterBar({ locations, onFiltersOpen }: Props) {
  const t = useTranslations('listing')
  const tc = useTranslations('common')
  const theme = useMantineTheme()

  const {
    get, updateParams, handlePropertyTypeChange,
    activeCount, propertyTypes, resetFilters,
  } = useListingsUrlFilters()

  const listingType = get('type') || ''
  const propertyType = get('property_type') || ''
  const locationId = get('location_id') || ''
  const isPremium = get('premium') === 'true'

  const propertyTypeOptions = [
    { value: '', label: tc('all_types') },
    ...propertyTypes.map(pt => ({ value: pt.value, label: pt.label })),
  ]

  return (
    <Stack gap={0} data-testid="listings-filter-bar-root">
      <Group wrap="wrap" gap="xs" py="sm">
        <Group wrap="wrap" gap="xs" w={FULL_BELOW_SM}>
          {/* Listing type — sale / rent */}
          <Group gap="xs" wrap="wrap" w={FULL_BELOW_SM}>
            {(['', 'sale', 'rent'] as const).map(type => (
              <Button
                key={type}
                type="button"
                variant={listingType === type ? 'filled' : 'default'}
                w={FULL_BELOW_SM}
                onClick={() => updateParams({ type: type || null })}
              >
                {type === '' ? tc('all') : t(type)}
              </Button>
            ))}
          </Group>

          <Divider orientation="vertical" color="gray.3" />

          {/*
            Property type — wrapped in a plain block `Box`: `MantineCombobox`'s own outer wrapper
            carries no width, so as a bare flex item its `triggerWidth: '100%'` resolves against
            an undetermined containing block and collapses to content size (Task 780). A `Box`
            with an explicit responsive `w` becomes a definite-width flex item; the combobox's own
            unwidthed block child then fills it via ordinary block auto-width — no combobox-file
            edit needed.
          */}
          <Box w={FULL_BELOW_SM}>
            <MantineCombobox
              options={propertyTypeOptions}
              value={propertyType}
              onChange={v => handlePropertyTypeChange(v || null)}
              placeholder={tc('all_types')}
              variant="button"
              noResultsLabel={tc('no_results')}
            />
          </Box>

          {/* Location — same wrapping reason as the property-type combobox above. */}
          <Box w={FULL_BELOW_SM}>
            <LocationCombobox
              locations={locations}
              value={locationId}
              onChange={id => updateParams({ location_id: id ?? null })}
              placeholder={tc('all_locations')}
              portal
            />
          </Box>

          {/* Premium-only toggle */}
          <Button
            type="button"
            variant={isPremium ? 'filled' : 'default'}
            w={FULL_BELOW_SM}
            onClick={() => updateParams({ premium: isPremium ? null : 'true' })}
          >
            {t('filter_premium_toggle_label')}
          </Button>
        </Group>

        <Group gap="xs" wrap="wrap" w={FULL_BELOW_SM} ms={{ sm: 'auto' }}>
          {/* Global reset — shown only when filters are active */}
          {activeCount > 0 && (
            <Button
              type="button"
              variant="subtle"
              color="gray"
              w={FULL_BELOW_SM}
              leftSection={<X size={theme.other.iconSize.compact} />}
              onClick={resetFilters}
            >
              {tc('reset_filters')}
            </Button>
          )}

          {/* More / advanced filters → opens full Drawer */}
          <Indicator label={activeCount} disabled={activeCount === 0} color="brand" w={FULL_BELOW_SM}>
            <Button
              type="button"
              data-testid="task775-advanced-filters"
              variant="default"
              w={FULL_BELOW_SM}
              leftSection={<SlidersHorizontal size={theme.other.iconSize.compact} />}
              onClick={onFiltersOpen}
            >
              {tc('advanced_filters')}
            </Button>
          </Indicator>
        </Group>
      </Group>

      <Divider color="gray.3" />
    </Stack>
  )
}
