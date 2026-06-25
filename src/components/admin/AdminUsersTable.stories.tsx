import { Box } from '@mantine/core'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AdminUsersTable } from './AdminUsersTable'
import { FIXTURE_USERS, FIXTURE_VERIFIED_AGENTS } from '@/stories/fixtures/admin.fixtures'

/**
 * Mantine-proof story for AdminUsersTable (Task 483 — Epic MM.1).
 * Viewport and locale switched via Storybook toolbar.
 * Component-internal i18n resolved by the withLocale global decorator.
 *
 * Gutter: Box px={{ base: 'md', sm: 'xl' }} py="md" — mirrors canonical admin page gutter
 * (responsive 16px→24px horizontal, 16px vertical). skipCanvas:true requires this explicit
 * container replacement; full-bleed is reserved for bottom-sheet popups only.
 */
const meta: Meta<typeof AdminUsersTable> = {
  title: 'Admin/AdminUsersTable',
  component: AdminUsersTable,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Admin users surface migrated to Mantine (MM.1). Cards <40em, table ≥40em. Verify/revoke, filters, pagination, 4-locale. Viewport and locale via toolbar.',
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

export const Default: Story = {
  render: (args) => (
    <Box px={{ base: 'md', sm: 'xl' }} py="md">
      <AdminUsersTable {...args} />
    </Box>
  ),
}
