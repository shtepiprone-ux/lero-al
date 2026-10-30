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
 * States: `Empty` (no collections yet), `Populated` (a few collections with counts), and the dialogs
 * opened via a Storybook `play` function (same technique `SaveSearchButton.stories.tsx`'s `OpenModal`
 * story uses): `CreateDialogOpen`, `CreateError`, `RenameDialogOpen`, `DeleteConfirmOpen`.
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

/**
 * Task 859 R46 — the three dialogs of `CollectionsSection` (create, rename, delete confirm) each have a
 * Story now. Each `play` opens the dialog the way a user does and asserts it. No server action is
 * called: rename and delete only open, and `CreateError` uses the component's own client validation.
 */
export const CreateError: Story = {
  render: () => (
    <MantineStoryShell>
      <CollectionsSection initialCollections={FIXTURE_COLLECTIONS} />
    </MantineStoryShell>
  ),
  play: async ({ canvasElement, context }) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const canvas = within(canvasElement.ownerDocument.body)
    await userEvent.click(await canvas.findByRole('button', { name: storyT(locale, 'collections.new') }))
    await canvas.findByRole('dialog')
    // The Create button is disabled while the name is empty; Enter in the empty field runs the
    // component's own `handleCreate` validation, which sets `createError` (`name_required`).
    const field = await canvas.findByPlaceholderText(storyT(locale, 'collections.name_placeholder'), {}, { timeout: 4000 })
    await userEvent.type(field, '{Enter}')
    await canvas.findByText(storyT(locale, 'collections.name_required'))
  },
}

export const RenameDialogOpen: Story = {
  render: () => (
    <MantineStoryShell>
      <CollectionsSection initialCollections={FIXTURE_COLLECTIONS} />
    </MantineStoryShell>
  ),
  play: async ({ canvasElement, context }) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const canvas = within(canvasElement.ownerDocument.body)
    const triggers = await canvas.findAllByRole('button', { name: storyT(locale, 'collections.rename') })
    await userEvent.click(triggers[0]!)
    await canvas.findByRole('dialog')
    await canvas.findByPlaceholderText(storyT(locale, 'collections.new_name_placeholder'), {}, { timeout: 4000 })
  },
}

export const DeleteConfirmOpen: Story = {
  render: () => (
    <MantineStoryShell>
      <CollectionsSection initialCollections={FIXTURE_COLLECTIONS} />
    </MantineStoryShell>
  ),
  play: async ({ canvasElement, context }) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const canvas = within(canvasElement.ownerDocument.body)
    const triggers = await canvas.findAllByRole('button', { name: storyT(locale, 'collections.delete') })
    await userEvent.click(triggers[0]!)
    await canvas.findByRole('dialog')
    await canvas.findByText(storyT(locale, 'collections.delete_confirm'), {}, { timeout: 4000 })
  },
}
