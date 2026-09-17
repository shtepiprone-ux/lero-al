import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Group, Stack, Text, useMantineTheme } from '@mantine/core'
import { ListingFeatureIcon } from '@/modules/listings/components/ListingFeatureIcon'
import type { PresentationIcon } from '@/modules/listings/domain/listingFields'
import cardStyles from '@/modules/listings/components/ListingCard.module.css'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Task 821 — canonical story for the real production `ListingFeatureIcon` (agent-contract 16d
 * tier-3 node, enrolled in `scripts/mantine-migration-scope.json`; its former tier-3
 * `scripts/rendered-scope-allowlist.json` entry was removed by the 2026-09-16 owner decision once
 * the component was enrolled and storied — the allowlist carries no current entry for it).
 * Rendered by `ListingCard` and `ListingDetailView`, neither of which owns it. Statically imports
 * the real component (clause 16c) — no demo stand-in. Every `PresentationIcon` name is rendered so
 * a missing/renamed `ICON_MAP` key (`ListingFeatureIcon.tsx`) is caught immediately, not only the 4
 * names the real card/detail surfaces currently select.
 *
 * Both real production sizing paths are reproduced exactly, not invented: `ListingCard.tsx:184/282`
 * passes `className={styles.featureIcon}` (its own co-located `ListingCard.module.css`, reused here
 * verbatim — `.875rem`/14px svg); `ListingDetailView.tsx:271` passes `size={theme.other.iconSize.compact}`
 * (Task 791's className-free path). No local/invented style value.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/ListingFeatureIcon',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

const ICON_NAMES: { name: PresentationIcon; caption: string }[] = [
  { name: 'home', caption: 'home — Home — rooms, detail features grid' },
  { name: 'bed-double', caption: 'bed-double — BedDouble — rooms in the card, bedrooms' },
  { name: 'bath', caption: 'bath — Bath — bathrooms, toilets' },
  { name: 'area', caption: 'area — Maximize2 — floor area' },
  { name: 'building', caption: 'building — Building2 — floor in the card' },
  { name: 'layers', caption: 'layers — Layers — floor, detail features grid' },
  { name: 'calendar', caption: 'calendar — CalendarDays — year built' },
]

function IconRow({ name, caption }: { name: PresentationIcon; caption: string }) {
  const theme = useMantineTheme()
  return (
    <Group gap="lg" wrap="nowrap" align="center">
      <ListingFeatureIcon name={name} className={cardStyles.featureIcon} />
      <ListingFeatureIcon name={name} size={theme.other.iconSize.compact} />
      <Text size="sm">{caption}</Text>
    </Group>
  )
}

export const Default: Story = {
  render: () => (
    <MantineStoryShell>
      <Stack gap="md">
        <Text size="xs" c="gray.5" fw={500}>
          Every `PresentationIcon` the real `ICON_MAP` resolves. Left icon of each pair: the real
          `ListingCard.tsx` className path (its own `.featureIcon` CSS-module class). Right icon:
          the real `ListingDetailView.tsx` size-prop path (`theme.other.iconSize.compact`).
        </Text>
        {ICON_NAMES.map(({ name, caption }) => (
          <IconRow key={name} name={name} caption={caption} />
        ))}
      </Stack>
    </MantineStoryShell>
  ),
}
