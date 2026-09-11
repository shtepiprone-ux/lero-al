import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { within, userEvent } from 'storybook/test'
import { AuthContext } from '@/modules/auth/context/AuthContext'
import { SaveToCollectionButton } from '@/modules/listings/components/SaveToCollectionButton'
import { MantineStoryShell } from '../_MantineStoryShell'
import { storyT } from '@/stories/_storyI18n'
import type { User } from '@/types/database'

/**
 * Task 809 Revision 1 (R14, clause 16d tier-1) — canonical Mantine story for the real production
 * `SaveToCollectionButton` (rendered by `ListingCard`'s `imageActions` slot on `/favorites`, §21
 * census row 7). Statically imports the real component (clause 16c). Enrolled in
 * `scripts/mantine-migration-scope.json`.
 *
 * Three states: `Closed` (icon trigger, unopened), `DialogOpen` (trigger clicked — the modal's own
 * title renders immediately regardless of the collections fetch's outcome, so this state is stable
 * to capture even against the real, unmocked `getCollectionsWithMembership` server action — same
 * "real, unmocked action" precedent as `SaveSearchButton.stories.tsx`), and `Saving` (the inline
 * create-and-add row's pending state, captured via a `play` function that clicks Create without
 * awaiting the action's own resolution — `isCreating` flips synchronously before any `await`
 * settles, identical technique to `SaveSearchButton.stories.tsx`'s `Pending` story).
 */
const meta: Meta<typeof SaveToCollectionButton> = {
  title: 'Mantine/Primitives/SaveToCollectionButton',
  component: SaveToCollectionButton,
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof SaveToCollectionButton>

const FIXTURE_USER: User = {
  id: 'story-user-save-to-collection',
  public_id: 2,
  name: 'Story User',
  last_name: null,
  phone: null,
  whatsapp: null,
  avatar_url: null,
  role: 'user',
  user_type: 'private',
  status: 'active',
  block_reason: null,
  suspended_until: null,
  company_name: null,
  company_logo_url: null,
  company_id: null,
  website: null,
  is_verified: true,
  social_provider: null,
  location_id: null,
  position: null,
  year_started: null,
  deleted_at: null,
  location_request: null,
  preferred_currency: 'EUR',
  pending_email: null,
  last_seen_at: null,
  inactivity_warning_sent_at: null,
  preferred_locale: 'en',
  created_at: '2026-01-01T00:00:00.000Z',
}

const MOCK_SIGNED_IN_AUTH = {
  user: FIXTURE_USER,
  status: 'authenticated' as const,
  loading: false,
  signOut: () => {},
  refreshUser: () => {},
}

export const Closed: Story = {
  render: () => (
    <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
      <MantineStoryShell>
        <SaveToCollectionButton listingId="story-listing-1" />
      </MantineStoryShell>
    </AuthContext.Provider>
  ),
}

export const DialogOpen: Story = {
  render: () => (
    <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
      <MantineStoryShell>
        <SaveToCollectionButton listingId="story-listing-1" />
      </MantineStoryShell>
    </AuthContext.Provider>
  ),
  play: async ({ canvasElement, context }) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const doc = canvasElement.ownerDocument
    const canvas = within(doc.body)
    const trigger = await canvas.findByRole('button', { name: storyT(locale, 'collections.save_to') });
    await userEvent.click(trigger)
    await canvas.findByText(storyT(locale, 'collections.save_to'), {}, { timeout: 4000 })
  },
}

export const Saving: Story = {
  render: () => (
    <AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>
      <MantineStoryShell>
        <SaveToCollectionButton listingId="story-listing-1" />
      </MantineStoryShell>
    </AuthContext.Provider>
  ),
  play: async ({ canvasElement, context }) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const doc = canvasElement.ownerDocument
    const canvas = within(doc.body)
    const trigger = await canvas.findByRole('button', { name: storyT(locale, 'collections.save_to') })
    await userEvent.click(trigger)
    const nameInput = await canvas.findByPlaceholderText(storyT(locale, 'collections.name_placeholder'), {}, { timeout: 4000 })
    await userEvent.type(nameInput, 'Story collection')
    const createButton = await canvas.findByRole('button', { name: storyT(locale, 'collections.create') })
    // Deliberately not awaited past the click — isCreating flips synchronously when handleCreate
    // starts, before its first await settles, so the Loader is genuinely present at capture time.
    await userEvent.click(createButton)
  },
}
