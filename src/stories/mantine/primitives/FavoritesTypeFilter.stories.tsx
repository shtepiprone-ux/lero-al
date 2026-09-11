import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text } from '@mantine/core'
import { FavoritesTypeFilter } from '@/modules/listings/components/FavoritesTypeFilter'
import { MantineStoryShell } from '../_MantineStoryShell'

/**
 * Task 809 Revision 1 (R14, clause 16d tier-1) — canonical Mantine story for the real production
 * `FavoritesTypeFilter` (rendered by `FavoritesShell`, §21 census row 8). Statically imports the
 * real component (clause 16c). Reuses the canonical `SegmentedControl` primitive (its own story:
 * `Mantine/Primitives/SegmentedControl`) — same mobile stretch/swipe contract (owner decision
 * 2026-06-25): <640 stretches full-width when labels fit, swipe-scrolls via ScrollArea when they
 * overflow; >=640 stays content-width. Enrolled in `scripts/mantine-migration-scope.json`.
 *
 * Renders every selectable state side by side: "All" active, and each individual property type
 * active — this component reads its active value from the `currentType` prop and pushes via
 * `next/navigation`'s router (auto-mocked by `@storybook/nextjs-vite`), so no play-function
 * interaction is required to reach each state.
 */
const meta: Meta<typeof FavoritesTypeFilter> = {
  title: 'Mantine/Primitives/FavoritesTypeFilter',
  component: FavoritesTypeFilter,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/favorites' } },
  },
}
export default meta
type Story = StoryObj<typeof FavoritesTypeFilter>

const TYPE_COUNTS = { apartment: 6, house: 3, land: 1 }

export const Default: Story = {
  render: () => (
    <MantineStoryShell>
      <Stack gap="xl">
        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>all selected (no active type filter)</Text>
          <FavoritesTypeFilter typeCounts={TYPE_COUNTS} />
        </Stack>
        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>&ldquo;apartment&rdquo; selected</Text>
          <FavoritesTypeFilter typeCounts={TYPE_COUNTS} currentType="apartment" />
        </Stack>
        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>&ldquo;house&rdquo; selected</Text>
          <FavoritesTypeFilter typeCounts={TYPE_COUNTS} currentType="house" />
        </Stack>
        <Stack gap="xs">
          <Text size="xs" c="gray.5" fw={500}>&ldquo;land&rdquo; selected</Text>
          <FavoritesTypeFilter typeCounts={TYPE_COUNTS} currentType="land" />
        </Stack>
      </Stack>
    </MantineStoryShell>
  ),
}
