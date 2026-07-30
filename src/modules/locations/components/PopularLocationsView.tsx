import Link from 'next/link'
import { Box, Flex, SimpleGrid, Text, Title } from '@mantine/core'
import { MapPin } from 'lucide-react'
import { AppImage } from '@/components/ui/AppImage'
import { MantineHomeSection } from '@/design-system/mantine/patterns'
import styles from './PopularLocationsView.module.css'

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

// Fallback gradient when no photo is set — module classes reproducing the prior Tailwind
// utilities' own compiled output byte-for-byte (Task 688, PopularLocationsView.module.css).
const CITY_GRADIENTS = [
  styles.gradient0,
  styles.gradient1,
  styles.gradient2,
  styles.gradient3,
  styles.gradient4,
  styles.gradient5,
  styles.gradient6,
  styles.gradient7,
]

/**
 * Presentational "Popular locations" section — Mantine primitives + theme tokens throughout.
 * `Flex`'s `direction`/`justify` props express the card's layout; `PopularLocationsView.module.css`
 * (Task 688) reproduces the interaction states and gradients a Mantine prop cannot express —
 * `:hover`, `:focus-visible`, and the decorative gradients — since an inline `style` attribute
 * permanently blocks a module's own `:hover` rule (Task 653 finding, `FavoriteButton.module.css`).
 * Prop-driven, hook-free (no useTranslations/data fetching) so it renders identically in the
 * story via storyT() and in the `PopularLocations` consumer. Band is the canonical
 * `MantineHomeSection` (Task 669).
 */
export function PopularLocationsView({ heading, locations }: PopularLocationsViewProps) {
  return (
    <MantineHomeSection variant="muted" containIntrinsicSize="auto 380px">
      <Title order={2} fw={700} fz={{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }} mb="xl">
        {heading}
      </Title>

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
        {locations.map((loc, i) => (
          <Flex
            key={loc.id}
            component={Link}
            href={loc.href}
            direction="column"
            justify="flex-end"
            pos="relative"
            h={112}
            p="sm"
            c="white"
            bdrs="xl"
            className={styles.card}
            data-track="popular_location_click"
          >
            {loc.imageUrl ? (
              <>
                <AppImage
                  variant="listing-thumb"
                  src={loc.imageUrl}
                  alt={loc.name}
                  className={styles.absoluteFill}
                />
                <Box pos="absolute" inset={0} className={styles.scrim} />
              </>
            ) : (
              <Box pos="absolute" inset={0} className={CITY_GRADIENTS[i % CITY_GRADIENTS.length]} />
            )}
            <Box pos="relative" className={styles.content}>
              <Box mb={2}>
                <MapPin size={14} style={{ opacity: 0.7 }} aria-hidden />
              </Box>
              <Text fw={600} size="sm" lh={1.25} truncate>
                {loc.name}
              </Text>
            </Box>
          </Flex>
        ))}
      </SimpleGrid>
    </MantineHomeSection>
  )
}
