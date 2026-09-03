'use client'

import type { ReactNode } from 'react'
import { Grid, Stack, Title, Text, Badge, Group, Paper, SimpleGrid, Divider, useMantineTheme } from '@mantine/core'
import { MapPin, Eye, CalendarDays } from 'lucide-react'
import { MantineListingGalleryPattern, type MantineListingGalleryImage, type MantineListingGalleryPatternProps } from './MantineListingGalleryPattern'
import { MantineListingContactPattern, type MantineListingContactPatternProps } from './MantineListingContactPattern'

export interface ListingFeature {
  icon: ReactNode
  label: string
  value: string
}

export interface ListingAmenity {
  label: string
  value: string
}

export type ListingDetailBadgeTone = 'new' | 'premium' | 'reduced' | 'type'

export interface ListingDetailBadge {
  label: string
  tone: ListingDetailBadgeTone
}

export interface MantineListingDetailData {
  title: string
  location?: string
  price: string
  priceOld?: string
  originalPriceLabel?: string
  pricePerSqm?: string
  views: number
  viewsLabel: string
  date: string
  publicId: string
  description?: string
}

export interface MantineListingDetailPatternProps {
  data: MantineListingDetailData
  images: MantineListingGalleryImage[]
  galleryLabels: MantineListingGalleryPatternProps['labels']
  badges?: ListingDetailBadge[]
  features: ListingFeature[]
  descriptionTitle: string
  amenitiesTitle: string
  amenities?: ListingAmenity[]
  contact: MantineListingContactPatternProps
}

/**
 * Tone -> Mantine THEME color name (owner decision, 2026-07-17: native Mantine `color` + the
 * theme's default `variant='light'` — the SAME idiom as the canonical `Mantine/Primitives/Badge`
 * story (`color="green"`/`"yellow"`/`"sale"`, soft background) — not a re-skin of the legacy
 * `--badge-new/premium/reduced` tokens (`globals.css:373-375`), which were defined for the
 * legacy `@/components/ui/badge` and would have reproduced its solid-fill look via a Mantine
 * shell. `new`=green, `premium`=yellow (closest theme color to "gold"), `reduced`=`sale` (Task
 * 619 — a dedicated owner-provided crimson `#dd0939`, distinct from both `brand` (the page's own
 * price text) and `red` (error/`Blocked`); matches the card's `price_reduced` badge so the
 * "price reduced" signal reads as the same color across the whole product) — all three from
 * `theme.ts`'s `colors.{green,yellow,sale}` tuples, matched to Badge.stories.tsx.
 */
const BADGE_TONE_COLOR: Record<Exclude<ListingDetailBadgeTone, 'type'>, string> = {
  new: 'green',
  premium: 'yellow',
  reduced: 'sale',
}

/**
 * Canonical listing-detail pattern (Task 616 D3, ALL-Mantine rebuild) — composes the D1
 * gallery pattern + a Mantine info block (badges/price/meta/key-features card/description
 * card/amenities card) + the D2 sticky contact card. Zero `@/components/ui/*` imports.
 *
 * Keeps the Task 609 `gutter={0}` + `pr`/`mb` gap fix (Grid's negative-margin gutter bleeds
 * past an unclipped standalone story render otherwise) and the Task 615 contact-CTA
 * `Flex`/`minWidth:0` fix (owned by `MantineListingContactPattern`, composed here unchanged).
 */
export function MantineListingDetailPattern({
  data,
  images,
  galleryLabels,
  badges = [],
  features,
  descriptionTitle,
  amenitiesTitle,
  amenities = [],
  contact,
}: MantineListingDetailPatternProps) {
  const theme = useMantineTheme()
  return (
    <Grid gutter={0}>
      <Grid.Col span={{ base: 12, sm: 8 }} pr={{ base: 0, sm: 'lg' }} mb={{ base: 'lg', sm: 0 }}>
        <Stack gap="lg">
          <MantineListingGalleryPattern images={images} title={data.title} labels={galleryLabels} />

          <Stack gap="sm">
            {badges.length > 0 && (
              <Group gap="xs" wrap="wrap">
                {badges.map((b, i) => (
                  <Badge
                    key={i}
                    variant={b.tone === 'type' ? 'outline' : undefined}
                    color={b.tone === 'type' ? 'gray' : BADGE_TONE_COLOR[b.tone]}
                  >
                    {b.label}
                  </Badge>
                ))}
              </Group>
            )}

            <Title order={1} size="h2" style={{ wordBreak: 'break-word' }}>
              {data.title}
            </Title>

            <Group gap="sm" align="baseline" wrap="wrap">
              <Text fw={700} size="xl" c="brand">
                {data.price}
              </Text>
              {data.priceOld && (
                <Text size="md" c="dimmed" td="line-through">
                  {data.priceOld}
                </Text>
              )}
              {data.pricePerSqm && (
                <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                  {data.pricePerSqm}
                </Text>
              )}
            </Group>

            <Group gap="md" wrap="wrap">
              {data.location && (
                <Group gap={4} wrap="nowrap">
                  <MapPin size={theme.other.iconSize.standard} className="shrink-0 text-muted-foreground" />
                  <Text size="sm" c="dimmed">
                    {data.location}
                  </Text>
                </Group>
              )}
              <Group gap={4} wrap="nowrap">
                <Eye size={theme.other.iconSize.standard} className="shrink-0 text-muted-foreground" />
                <Text size="sm" c="dimmed">
                  {data.views} {data.viewsLabel}
                </Text>
              </Group>
              <Group gap={4} wrap="nowrap">
                <CalendarDays size={theme.other.iconSize.standard} className="shrink-0 text-muted-foreground" />
                <Text size="sm" c="dimmed">
                  {data.date}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" ff="monospace">
                ID: #{data.publicId}
              </Text>
            </Group>
          </Stack>

          {features.length > 0 && (
            <Paper withBorder radius="lg" p="lg">
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                {features.map((f, i) => (
                  <Stack key={i} gap={2}>
                    <Group gap={4} wrap="nowrap">
                      <span className="shrink-0 text-muted-foreground">{f.icon}</span>
                      <Text size="xs" c="dimmed">
                        {f.label}
                      </Text>
                    </Group>
                    <Text size="sm" fw={600}>
                      {f.value}
                    </Text>
                  </Stack>
                ))}
              </SimpleGrid>
            </Paper>
          )}

          {data.description && (
            <Paper withBorder radius="lg" p="lg">
              <Stack gap="sm">
                <Title order={2} size="h4">
                  {descriptionTitle}
                </Title>
                <Text c="dimmed" style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                  {data.description}
                </Text>
              </Stack>
            </Paper>
          )}

          {amenities.length > 0 && (
            <Paper withBorder radius="lg" p="lg">
              <Stack gap="md">
                <Title order={2} size="h4">
                  {amenitiesTitle}
                </Title>
                <Divider />
                <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                  {amenities.map((a, i) => (
                    <Stack key={i} gap={2}>
                      <Text size="xs" c="dimmed">
                        {a.label}
                      </Text>
                      <Text size="sm" fw={500}>
                        {a.value}
                      </Text>
                    </Stack>
                  ))}
                </SimpleGrid>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 4 }}>
        <MantineListingContactPattern {...contact} />
      </Grid.Col>
    </Grid>
  )
}
