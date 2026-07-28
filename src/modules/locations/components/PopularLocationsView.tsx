import Link from 'next/link'
import { Box, SimpleGrid, Text, Title } from '@mantine/core'
import { MapPin } from 'lucide-react'
import { AppImage } from '@/components/ui/AppImage'
import { MantineHomeSection } from '@/design-system/mantine/patterns'

export interface PopularLocationsViewLocation {
  id: string
  name: string
  href: string
  imageUrl?: string | null
}

export interface PopularLocationsViewProps {
  heading: string
  locations: PopularLocationsViewLocation[]
}

// Fallback gradient when no photo is set — semantic tokens only.
const CITY_GRADIENTS = [
  'bg-gradient-to-br from-primary to-brand-950',
  'bg-gradient-to-br from-badge-new to-badge-new/70',
  'bg-gradient-to-br from-badge-premium to-badge-premium/70',
  'bg-gradient-to-br from-brand-950 to-primary',
  'bg-gradient-to-br from-primary/80 to-brand-800',
  'bg-gradient-to-br from-badge-new/90 to-brand-950',
  'bg-gradient-to-br from-badge-premium/90 to-brand-800',
  'bg-gradient-to-br from-brand-800 to-brand-950',
]

/**
 * Presentational "Popular locations" section — Mantine primitives + theme tokens, with
 * decorative gradients/`AppImage`/interaction states kept as `className` (no Mantine
 * equivalent, approved semantic tokens). Prop-driven, hook-free (no useTranslations/data
 * fetching) so it renders identically in the story via storyT() and in the
 * `PopularLocations` consumer. Band is now the canonical `MantineHomeSection` (Task 669) —
 * own hand-rolled Tailwind band retired.
 */
export function PopularLocationsView({ heading, locations }: PopularLocationsViewProps) {
  return (
    <MantineHomeSection variant="muted" containIntrinsicSize="auto 380px">
      <Title order={2} fw={700} fz={{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }} mb="xl">
        {heading}
      </Title>

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm" className="popular-locations">
        {locations.map((loc, i) => (
          <Box
            key={loc.id}
            component={Link}
            href={loc.href}
            pos="relative"
            h={112}
            p="sm"
            c="white"
            bdrs="xl"
            className="flex flex-col justify-end overflow-hidden hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            data-track="popular_location_click"
          >
            {loc.imageUrl ? (
              <>
                <AppImage
                  variant="listing-thumb"
                  src={loc.imageUrl}
                  alt={loc.name}
                  className="absolute inset-0"
                />
                <Box className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </>
            ) : (
              <Box className={`absolute inset-0 ${CITY_GRADIENTS[i % CITY_GRADIENTS.length]}`} />
            )}
            <Box pos="relative" style={{ zIndex: 1 }}>
              <Box mb={2}>
                <MapPin size={14} style={{ opacity: 0.7 }} aria-hidden />
              </Box>
              <Text fw={600} size="sm" lh={1.25} truncate>
                {loc.name}
              </Text>
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    </MantineHomeSection>
  )
}
