import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { within, userEvent } from 'storybook/test'
import { CollectionsSection } from '@/modules/listings/components/CollectionsSection'
import { MantineStoryShell } from '../_MantineStoryShell'
import { storyT } from '@/stories/_storyI18n'
import type { CollectionWithCount } from '@/types/database'

/**
 * Task 809 Revision 1 (R14, clause 16d tier-1) — canonical Mantine story for the real production
 * `CollectionsSection` (rendered by `FavoritesShell`, §21 census row 6). Statically imports the real
 * component (clause 16c) — no demo stand-in. Enrolled in `scripts/mantine-migration-scope.json`.
 *
 * Three states: `Empty` (no collections yet), `Populated` (a few collections with counts), and
 * `CreateDialogOpen` (the "New collection" trigger opened via a Storybook `play` function, same
 * technique `SaveSearchButton.stories.tsx`'s `OpenModal` story uses).
 */
const meta: Meta<typeof CollectionsSection> = {
  title: 'Mantine/Primitives/CollectionsSection',
  component: CollectionsSection,
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof CollectionsSection>

const FIXTURE_COLLECTIONS: CollectionWithCount[] = [
  {
    id: 'story-collection-1',
    user_id: 'story-user',
    name: 'Vacation homes',
    item_count: 4,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'story-collection-2',
    user_id: 'story-user',
    name: 'City apartments',
    item_count: 12,
    created_at: '2026-01-02T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'story-collection-3',
    user_id: 'story-user',
    name: 'Investment properties',
    item_count: 0,
    created_at: '2026-01-03T00:00:00.000Z',
    updated_at: '2026-01-03T00:00:00.000Z',
  },
]

export const Empty: Story = {
  render: () => (
    <MantineStoryShell>
      <CollectionsSection initialCollections={[]} />
    </MantineStoryShell>
  ),
}

export const Populated: Story = {
  render: () => (
    <MantineStoryShell>
      <CollectionsSection initialCollections={FIXTURE_COLLECTIONS} />
    </MantineStoryShell>
  ),
}

export const CreateDialogOpen: Story = {
  render: () => (
    <MantineStoryShell>
      <CollectionsSection initialCollections={FIXTURE_COLLECTIONS} />
    </MantineStoryShell>
  ),
  play: async ({ canvasElement, context }) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const doc = canvasElement.ownerDocument
    const canvas = within(doc.body)
    const trigger = await canvas.findByRole('button', { name: storyT(locale, 'collections.new') })
    await userEvent.click(trigger)
    await canvas.findByPlaceholderText(storyT(locale, 'collections.name_placeholder'), {}, { timeout: 4000 })
  },
}
