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
  /** Task 791 E4 — rendered together with `originalPriceLabel` under the price group when both
   * are set. Was declared-but-unread before this task (`originalPriceLabel` had no paired
   * value prop); `ListingDetailView.tsx`'s converted-currency disclosure needs both. */
  originalPrice?: string
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
  /** Required unless `gallerySlot` is supplied — a Server Component consumer that always supplies
   * `gallerySlot` (Task 791 F2 fix) must be able to omit this without constructing a value that
   * would otherwise cross the Server/Client boundary carrying a function (`labels.counter`),
   * which React rejects at render time ("Functions cannot be passed directly to Client
   * Components"). See the Sprint 71 kickoff §3.4/E1 and the Task 791 Revision 1 F2 finding. */
  galleryLabels?: MantineListingGalleryPatternProps['labels']
  badges?: ListingDetailBadge[]
  features: ListingFeature[]
  descriptionTitle: string
  amenitiesTitle: string
  amenities?: ListingAmenity[]
  /** Required unless `contactSlot` is supplied (Task 791 E2). */
  contact?: MantineListingContactPatternProps
  /** Real `FavoriteButton` (app) / demo heart (story) — positioned node, hook-free split (Task
   * 605). Task 784 D69-25 (owner instruction, 2026-09-04): always rendered in the badges row,
   * right-aligned to the content column's own right edge, at every breakpoint — no longer split
   * with `MantineListingContactPattern` by viewport. */
  favorite?: ReactNode
  /** Task 791 E1 — when supplied, rendered in place of `MantineListingGalleryPattern`. The
   * production consumer's LCP static-frame/interactive-island swap (`ListingDetailView.tsx`)
   * cannot be reproduced by this pattern's own client-only gallery without deleting that
   * mechanism — see the Sprint 71 kickoff §3.4. */
  gallerySlot?: ReactNode
  /** Task 791 E2 — when supplied, rendered in the sidebar `Grid.Col` in place of
   * `MantineListingContactPattern`. `ListingContact.tsx` has five measured divergences from this
   * pattern's contact card (kickoff §3.5) and takes function props that cannot cross the
   * Server/Client boundary of a Server Component consumer — see kickoff §3.3. */
  contactSlot?: ReactNode
  /** Task 791 E3 — appended to the end of the left column's `Stack`, inside the same `gap="lg"`
   * rhythm as the cards above it (map / report row / recently-viewed / similar-listings for the
   * detail route). */
  contentFooter?: ReactNode
  /** Task 791 E5 — the breakpoint the sidebar column splits from `{ base: 12 }` full-width down
   * to `{ md: 8/4 }` (unchanged default, `Patterns/Mantine/ListingDetailPattern`'s own story) or
   * `{ lg: 8/4 }` (`ListingDetailView.tsx`'s production requirement — `ListingContact`'s sidebar
   * is `hidden lg:block`, so splitting at `md` would render an empty column between 768-1023px;
   * kickoff §3.6). @default 'md' */
  sidebarFrom?: 'md' | 'lg'
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
  favorite,
  gallerySlot,
  contactSlot,
  contentFooter,
  sidebarFrom = 'md',
}: MantineListingDetailPatternProps) {
  const theme = useMantineTheme()
  const leftSpan = sidebarFrom === 'lg' ? { base: 12, lg: 8 } : { base: 12, md: 8 }
  const leftPr = sidebarFrom === 'lg' ? { base: 0, lg: 'lg' } : { base: 0, md: 'lg' }
  const leftMb = sidebarFrom === 'lg' ? { base: 'lg', lg: 0 } : { base: 'lg', md: 0 }
  const rightSpan = sidebarFrom === 'lg' ? { base: 12, lg: 4 } : { base: 12, md: 4 }
  return (
    <Grid gutter={0}>
      <Grid.Col span={leftSpan} pr={leftPr} mb={leftMb}>
        <Stack gap="lg">
          {/* `galleryLabels!` — this branch only runs when `gallerySlot` is absent, and every
              consumer that omits `gallerySlot` (this pattern's own story) supplies `galleryLabels`. */}
          {gallerySlot ?? <MantineListingGalleryPattern images={images} title={data.title} labels={galleryLabels!} />}

          <Stack gap="sm">
            {/* Task 784 D69-25 (owner instruction, 2026-09-04): favorite lives here — always,
                at every breakpoint, right-aligned via `justify="space-between"` so its right
                edge sits on the Grid.Col's own right edge, the same edge the gallery/description
                cards align to (this Group is inside the identical Stack, so it inherits the same
                column width whether the column is full-width, stacked below `md`, or the 8/12
                content column beside the sidebar at `md`+). Supersedes D69-23's viewport-split
                placement (favorite no longer renders inside `MantineListingContactPattern` at
                all — see that component's own comment) — a single instance, no state-sync
                concern. No longer gated on `contact.state`: favoriting a listing is independent
                of the agent/owner-account state shown in the contact card. */}
            {/* Task 784 D69-27 (owner visual review, 2026-09-04): the row below is `align="center"`,
                not `flex-start`. The favorite ActionIcon (size="lg", 42px) is taller than a Badge
                (~22px); top-aligning them puts the badge row's optical centre ~10px above the
                icon's, which reads as the heart sitting low. Centring makes the two blocks share a
                centre line at every width, including the 320px case where the badges wrap to two
                rows and the icon centres against the whole block. */}
            {(badges.length > 0 || favorite) && (
              <Group justify="space-between" wrap="nowrap" align="center">
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
                {favorite && (
                  <Group gap={0} style={{ flexShrink: 0 }}>
                    {favorite}
                  </Group>
                )}
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

            {data.originalPriceLabel && data.originalPrice && (
              <Text size="xs" c="dimmed">
                {data.originalPriceLabel}: {data.originalPrice}
              </Text>
            )}

            <Group gap="md" wrap="wrap">
              {data.location && (
                <Group gap="tight" wrap="nowrap">
                  <MapPin size={theme.other.iconSize.standard} className="shrink-0 text-muted-foreground" />
                  <Text size="sm" c="dimmed">
                    {data.location}
                  </Text>
                </Group>
              )}
              <Group gap="tight" wrap="nowrap">
                <Eye size={theme.other.iconSize.standard} className="shrink-0 text-muted-foreground" />
                <Text size="sm" c="dimmed">
                  {data.views} {data.viewsLabel}
                </Text>
              </Group>
              <Group gap="tight" wrap="nowrap">
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
                  <Stack key={i} gap="micro">
                    <Group gap="tight" wrap="nowrap">
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
                <Text c="dimmed" style={{ whiteSpace: 'pre-line', lineHeight: 'var(--mantine-line-height-listingDescription)' }}>
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
                    <Stack key={i} gap="micro">
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

          {contentFooter}
        </Stack>
      </Grid.Col>

      <Grid.Col span={rightSpan}>
        {contactSlot ?? (contact && <MantineListingContactPattern {...contact} />)}
      </Grid.Col>
    </Grid>
  )
}
