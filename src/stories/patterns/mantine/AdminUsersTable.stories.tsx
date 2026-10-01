import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminUsersTable } from '@/components/admin/AdminUsersTable'
import { FIXTURE_USERS, FIXTURE_VERIFIED_AGENTS } from '@/stories/fixtures/admin.fixtures'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'

/**
 * Task 896 — the Story moved here from `Admin/AdminUsersTable` (Task 483 / MM.1), which was canonical only through
 * the exact-title enrolment hatch the owner rejected for new use (2026-09-17). Viewport and locale come from the
 * Storybook toolbar; component-internal i18n is resolved by the `withLocale` global decorator.
 *
 * GR-3d: `AdminUsersTable` has no page gutter of its own on any side (the production page's `Box p="xl"` supplies it),
 * so every export is wrapped in `StoryPageGutter`.
 */
const meta: Meta<typeof AdminUsersTable> = {
  title: 'Patterns/Mantine/AdminUsersTable',
  component: AdminUsersTable,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Admin users surface on Mantine. Cards <40em, table ≥40em. Verify/revoke, filters, pagination, 4-locale. Viewport and locale via toolbar.',
      },
    },
  },
  args: {
    users: FIXTURE_USERS,
    total: FIXTURE_USERS.length,
    page: 1,
    perPage: 25,
    activeRole: '',
    activeStatus: '',
    searchQuery: '',
    activeTab: 'all',
    verifiedAgents: FIXTURE_VERIFIED_AGENTS,
  },
}
export default meta
type Story = StoryObj<typeof AdminUsersTable>

const render: Story['render'] = (args) => (
  <StoryPageGutter>
    <AdminUsersTable {...args} />
  </StoryPageGutter>
)

export const Default: Story = { render }

export const VerifiedTab: Story = { args: { activeTab: 'verified' }, render }

export const Empty: Story = { args: { users: [], total: 0 }, render }

export const LocationFilter: Story = { args: { locationRequestFilter: true }, render }
