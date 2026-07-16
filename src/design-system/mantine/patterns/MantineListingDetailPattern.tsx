'use client'

import { Grid, Stack, Title, Text, Badge, Group, Button, Paper, SimpleGrid, Divider } from '@mantine/core'

export interface ListingFeature {
  label: string
  value: string
}

export interface MantineListingDetailData {
  title: string
  location: string
  price: string
  badge?: string
  description?: string
  features?: ListingFeature[]
  imageUrl?: string
}

export interface MantineListingDetailPatternProps {
  data: MantineListingDetailData
  callLabel: string
  whatsappLabel: string
  onCall?: () => void
  onWhatsApp?: () => void
}

/**
 * Canonical listing detail pattern.
 *
 * Mobile (<sm / 640px): single column — gallery top, info + contact below.
 *   Contact CTAs are full-width, stacked (P0 mobile gate).
 * Tablet/Desktop (sm+): two-column grid — gallery left, info + contact right.
 *
 * Responsive API:
 *   - Grid cols={{ base: 1, sm: '1fr 360px' }} — Mantine Grid.
 *   - Contact buttons: `fullWidth` at base, auto at sm+.
 *   - Features grid: SimpleGrid cols={{ base: 2, sm: 3 }}.
 *
 * Migration target: src/modules/listings/components/ListingDetailView.tsx (Phase 4).
 */
export function MantineListingDetailPattern({
  data,
  callLabel,
  whatsappLabel,
  onCall,
  onWhatsApp,
}: MantineListingDetailPatternProps) {
  return (
    // `Grid`'s gutter is implemented as a negative margin on `.mantine-Grid-inner` (bled back in
    // by matching padding on each `Grid.Col`) — harmless when an ancestor clips it, but this
    // pattern can render standalone (e.g. its own Storybook story) with nothing to hide the
    // bleed, so the inner wrapper's own box measures wider than the viewport
    // (scrollWidth > clientWidth). Clipping that ancestor doesn't fix it either: the geometry
    // gate's text-clip check walks up from each button looking for the first clipped ancestor
    // whose scrollWidth exceeds its clientWidth, and an overflow:clip Box around the whole Grid
    // IS exactly that ancestor — a false positive, since nothing is actually clipped visually.
    // Root-cause fix: `gutter={0}` removes the negative margin entirely, and the same visual
    // gap is reproduced explicitly — `pr="lg"` between the two side-by-side columns at `sm+`,
    // `mb="lg"` between the two stacked columns at base — so the layout stays byte-identical
    // with zero negative-margin bleed anywhere.
    <Grid gutter={0}>
      <Grid.Col span={{ base: 12, sm: 8 }} pr={{ base: 0, sm: 'lg' }} mb={{ base: 'lg', sm: 0 }}>
        <Stack gap="md">
          <Paper
            radius="md"
            style={{
              background: data.imageUrl ? `url(${data.imageUrl}) center/cover` : 'var(--mantine-color-gray-1)',
              minHeight: 320,
              position: 'relative',
            }}
          >
            {!data.imageUrl && (
              <Text c="dimmed" ta="center" pt={140} size="sm">
                Gallery
              </Text>
            )}
          </Paper>

          {data.description && (
            <Stack gap="xs">
              <Text fw={600} size="md">
                {data.description.split('.')[0]}
              </Text>
              <Text size="sm" c="dimmed">
                {data.description}
              </Text>
            </Stack>
          )}

          {data.features && data.features.length > 0 && (
            <Stack gap="sm">
              <Divider />
              <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                {data.features.map((f) => (
                  <Stack key={f.label} gap={2}>
                    <Text size="xs" c="dimmed">
                      {f.label}
                    </Text>
                    <Text size="sm" fw={500}>
                      {f.value}
                    </Text>
                  </Stack>
                ))}
              </SimpleGrid>
            </Stack>
          )}
        </Stack>
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 4 }}>
        <Paper shadow="sm" p="md" radius="md" withBorder style={{ position: 'sticky', top: 80 }}>
          <Stack gap="sm">
            {data.badge && (
              <Badge color="brand" variant="filled" size="sm">
                {data.badge}
              </Badge>
            )}
            <Title order={2} size="h3" lineClamp={3}>
              {data.title}
            </Title>
            <Text size="sm" c="dimmed">
              {data.location}
            </Text>
            <Text fw={700} size="xl" c="brand">
              {data.price}
            </Text>
            <Divider />
            <Group gap="sm" style={{ flexDirection: 'column' }} styles={{ root: { '@media (min-width: 40em)': { flexDirection: 'row' } } }}>
              <Button
                color="brand"
                fullWidth
                size="md"
                onClick={onCall}
              >
                {callLabel}
              </Button>
              <Button
                color="green"
                fullWidth
                size="md"
                onClick={onWhatsApp}
              >
                {whatsappLabel}
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Grid.Col>
    </Grid>
  )
}
